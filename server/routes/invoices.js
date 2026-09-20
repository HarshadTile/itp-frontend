import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireCap } from '../auth.js';
import { toInvoice } from '../serializers.js';
import { stageIndexFor } from '../stageIndex.js';
import { STATUS_CHIP } from '../../src/data/constants.js';
import { invoiceVisibility } from '../visibility.js';

const r = Router();
const VALID_STATUSES = Object.keys(STATUS_CHIP);

r.get('/invoices', requireAuth, async (req, res, next) => {
  try {
    const v = invoiceVisibility(req);
    res.json((await query(`SELECT * FROM invoices${v.sql}`, v.params)).map(toInvoice));
  } catch (e) {
    next(e);
  }
});

/* Stage / status move. Internal roles holding the editRows capability only.
   When `status` changes without an explicit stageIndex, the stage position is
   re-derived from the new status so the two never drift apart. */
r.patch('/invoices/:no', requireCap('editRows'), async (req, res, next) => {
  try {
    const { status, utr, stageIndex } = req.body || {};
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `unknown status "${status}"` });
    }
    const [existing] = await query('SELECT * FROM invoices WHERE no=?', [req.params.no]);
    if (!existing) return res.status(404).json({ error: 'invoice not found' });

    const sets = [];
    const vals = [];
    if (status !== undefined) { sets.push('status=?'); vals.push(status); }
    if (utr !== undefined) { sets.push('utr=?'); vals.push(String(utr)); }
    let nextStage = stageIndex;
    if (nextStage === undefined && status !== undefined) {
      nextStage = stageIndexFor({ channel: existing.channel, status });
    }
    if (nextStage !== undefined) { sets.push('stage_index=?'); vals.push(nextStage); }
    if (!sets.length) return res.status(400).json({ error: 'nothing to update' });

    vals.push(req.params.no);
    await query(`UPDATE invoices SET ${sets.join(',')} WHERE no=?`, vals);
    const [row] = await query('SELECT * FROM invoices WHERE no=?', [req.params.no]);
    return res.json(toInvoice(row));
  } catch (e) {
    return next(e);
  }
});

export default r;

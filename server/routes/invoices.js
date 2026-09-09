import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { toInvoice } from '../serializers.js';

const r = Router();

r.get('/invoices', requireAuth, async (_req, res, next) => {
  try {
    res.json((await query('SELECT * FROM invoices')).map(toInvoice));
  } catch (e) {
    next(e);
  }
});

r.patch('/invoices/:no', requireAuth, async (req, res, next) => {
  try {
    const { status, utr, stageIndex } = req.body || {};
    const sets = [];
    const vals = [];
    if (status !== undefined) { sets.push('status=?'); vals.push(status); }
    if (utr !== undefined) { sets.push('utr=?'); vals.push(utr); }
    if (stageIndex !== undefined) { sets.push('stage_index=?'); vals.push(stageIndex); }
    if (!sets.length) return res.status(400).json({ error: 'nothing to update' });
    vals.push(req.params.no);
    await query(`UPDATE invoices SET ${sets.join(',')} WHERE no=?`, vals);
    const [row] = await query('SELECT * FROM invoices WHERE no=?', [req.params.no]);
    if (!row) return res.status(404).json({ error: 'invoice not found' });
    return res.json(toInvoice(row));
  } catch (e) {
    return next(e);
  }
});

export default r;

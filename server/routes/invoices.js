import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireCap } from '../auth.js';
import { toInvoice } from '../serializers.js';
import { stageIndexFor } from '../stageIndex.js';
import { INTERNAL_TEAM_CHANNELS, STATUS_CHIP } from '../../src/data/constants.js';

const r = Router();
const VALID_STATUSES = Object.keys(STATUS_CHIP);

/** WHERE fragment limiting invoices to what this caller may see.
 *  - supplier sessions: only their own vendor code
 *  - Internal Team scope (from the session, or ?scope=internalTeam when an HQ
 *    admin is viewing as the team): only the team's channels */
function visibility(req) {
  if (req.session.authType === 'supplier') {
    return { sql: ' WHERE vcode=?', params: [req.session.supplier?.vcode ?? ''] };
  }
  const scoped = req.session.scope?.channelScope === 'internalTeam' || req.query.scope === 'internalTeam';
  if (scoped) {
    return { sql: ` WHERE channel IN (${INTERNAL_TEAM_CHANNELS.map(() => '?').join(',')})`, params: [...INTERNAL_TEAM_CHANNELS] };
  }
  return { sql: '', params: [] };
}

r.get('/invoices', requireAuth, async (req, res, next) => {
  try {
    const v = visibility(req);
    res.json((await query(`SELECT * FROM invoices${v.sql}`, v.params)).map(toInvoice));
  } catch (e) {
    next(e);
  }
});

/* Server-side aggregation — a small fixed payload no matter how many invoices
   exist, so the dashboard never has to reduce the full table in the browser. */
r.get('/invoices/summary', requireAuth, async (req, res, next) => {
  try {
    const v = visibility(req);
    const [[k], byChannelRows, byStatusRows] = await Promise.all([
      query(`SELECT
        COUNT(*) AS total,
        SUM(status='Pending Approval') AS pendingApproval,
        SUM(status='Payment Due') AS paymentDue,
        SUM((status='Paid' OR status='Short-Paid') AND (utr='-' OR utr IS NULL OR utr='')) AS noUtr,
        SUM(status='Short-Paid') AS shortPaid
        FROM invoices${v.sql}`, v.params),
      query(`SELECT channel, COUNT(*) AS value FROM invoices${v.sql} GROUP BY channel`, v.params),
      query(`SELECT status, COUNT(*) AS value FROM invoices${v.sql} GROUP BY status`, v.params),
    ]);
    res.json({
      total: Number(k.total) || 0,
      kpi: {
        pendingApproval: Number(k.pendingApproval) || 0,
        paymentDue: Number(k.paymentDue) || 0,
        noUtr: Number(k.noUtr) || 0,
        shortPaid: Number(k.shortPaid) || 0,
      },
      byChannel: byChannelRows.map((x) => ({ key: x.channel, value: Number(x.value) })),
      byStatus: byStatusRows.map((x) => ({ key: x.status, value: Number(x.value) })),
    });
  } catch (e) {
    next(e);
  }
});

/* Newest N invoices — server-side LIMIT, never the whole table. */
r.get('/invoices/recent', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 25);
    const v = visibility(req);
    const rows = await query(
      `SELECT * FROM invoices${v.sql} ORDER BY STR_TO_DATE(date, '%d %b %Y') DESC, no DESC LIMIT ?`,
      [...v.params, String(limit)],
    );
    res.json(rows.map(toInvoice));
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

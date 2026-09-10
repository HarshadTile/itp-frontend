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

/* Server-side aggregation — a small fixed payload no matter how many invoices
   exist, so the dashboard never has to reduce the full table in the browser. */
r.get('/invoices/summary', requireAuth, async (_req, res, next) => {
  try {
    const [[k], byChannelRows, byStatusRows] = await Promise.all([
      query(`SELECT
        COUNT(*) AS total,
        SUM(status='Pending Approval') AS pendingApproval,
        SUM(status='Payment Due') AS paymentDue,
        SUM((status='Paid' OR status='Short-Paid') AND (utr='-' OR utr IS NULL OR utr='')) AS noUtr,
        SUM(status='Short-Paid') AS shortPaid
        FROM invoices`),
      query('SELECT channel, COUNT(*) AS value FROM invoices GROUP BY channel'),
      query('SELECT status, COUNT(*) AS value FROM invoices GROUP BY status'),
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
    const rows = await query(
      'SELECT * FROM invoices ORDER BY STR_TO_DATE(date, \'%d %b %Y\') DESC, no DESC LIMIT ?',
      [String(limit)],
    );
    res.json(rows.map(toInvoice));
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

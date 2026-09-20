import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { toInvoice } from '../serializers.js';
import { invoiceVisibility } from '../visibility.js';

const r = Router();

/* GET /api/dashboard/summary
   KPI counts plus invoices-by-channel and invoices-by-status, aggregated in SQL
   so the payload stays tiny no matter how many invoices exist. */
r.get('/dashboard/summary', requireAuth, async (req, res, next) => {
  try {
    const v = invoiceVisibility(req);
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

/* GET /api/dashboard/latest-invoices?count=5
   The newest `count` invoices (1-25, default 6) — a server-side LIMIT, never the whole table. */
r.get('/dashboard/latest-invoices', requireAuth, async (req, res, next) => {
  try {
    const count = Math.min(Math.max(parseInt(req.query.count, 10) || 6, 1), 25);
    const v = invoiceVisibility(req);
    const rows = await query(
      `SELECT * FROM invoices${v.sql} ORDER BY STR_TO_DATE(date, '%d %b %Y') DESC, no DESC LIMIT ?`,
      [...v.params, String(count)],
    );
    res.json(rows.map(toInvoice));
  } catch (e) {
    next(e);
  }
});

export default r;

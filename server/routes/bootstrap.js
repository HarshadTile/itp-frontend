import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { toInvoice, toSyncRow, toTicket } from '../serializers.js';

const r = Router();

function parseJson(v) {
  return typeof v === 'string' ? JSON.parse(v) : v;
}

r.get('/bootstrap', requireAuth, async (_req, res, next) => {
  try {
    const invoices = (await query('SELECT * FROM invoices')).map(toInvoice);
    const syncLog = (await query('SELECT * FROM sync_log ORDER BY id')).map(toSyncRow);

    const tRows = await query('SELECT * FROM tickets');
    const comments = await query('SELECT * FROM ticket_comments ORDER BY ticket_id, seq');
    const activity = await query('SELECT * FROM ticket_activity ORDER BY ticket_id, seq');
    const tickets = tRows.map((row) => toTicket(
      row,
      comments.filter((c) => c.ticket_id === row.id),
      activity.filter((a) => a.ticket_id === row.id),
    ));
    const ticketSeq = tRows.reduce((m, t) => {
      const n = parseInt(String(t.id).replace(/\D/g, ''), 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 1005);

    const tableRows = await query('SELECT * FROM table_rows ORDER BY table_key, row_index');
    const tables = {};
    for (const tr of tableRows) {
      (tables[tr.table_key] ||= []).push(parseJson(tr.cells_json));
    }

    const [s] = await query('SELECT * FROM settings WHERE id=1');
    const integrations = (await query('SELECT name,status,last_sync FROM integrations ORDER BY id'))
      .map((i) => [i.name, i.status, i.last_sync]);
    const settings = {
      roleMatrix: parseJson(s.role_matrix_json),
      twoFactorOn: !!s.two_factor,
      senderEmail: s.sender_email,
      integrations,
    };

    res.json({ invoices, syncLog, tickets, ticketSeq, tables, settings });
  } catch (e) {
    next(e);
  }
});

export default r;

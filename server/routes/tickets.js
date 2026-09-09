import { Router } from 'express';
import { query, withConn } from '../db.js';
import { requireAuth } from '../auth.js';
import { toTicket } from '../serializers.js';

const r = Router();

const APP_NOW = '2026-09-09';
function todayStr() {
  return new Date(APP_NOW).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function loadTicket(id) {
  const [row] = await query('SELECT * FROM tickets WHERE id=?', [id]);
  if (!row) return null;
  const comments = await query('SELECT * FROM ticket_comments WHERE ticket_id=? ORDER BY seq', [id]);
  const activity = await query('SELECT * FROM ticket_activity WHERE ticket_id=? ORDER BY seq', [id]);
  return toTicket(row, comments, activity);
}

r.get('/tickets', requireAuth, async (_req, res, next) => {
  try {
    const rows = await query('SELECT id FROM tickets');
    res.json(await Promise.all(rows.map((x) => loadTicket(x.id))));
  } catch (e) {
    next(e);
  }
});

r.post('/tickets', requireAuth, async (req, res, next) => {
  try {
    const {
      no, category, priority = 'Medium', desc, raisedBy, assignee = 'MDE Invoice Team',
    } = req.body || {};
    const [{ maxid }] = await query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(id,5) AS UNSIGNED)),1005) AS maxid FROM tickets",
    );
    const seq = Number(maxid) + 1;
    const id = 'TCK-' + seq;
    const date = req.body.date || todayStr();
    await withConn(async (c) => {
      await c.execute(
        `INSERT INTO tickets (id,no,category,description,status,priority,assignee,raised_by,raised_date,sla_hours,resolved_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,NULL)`,
        [id, no, category, desc || 'No description provided.', 'Open', priority, assignee, raisedBy, date, 24],
      );
      await c.execute(
        'INSERT INTO ticket_activity (ticket_id,date,text,seq) VALUES (?,?,?,0)',
        [id, date, `Ticket created by ${raisedBy}, priority set to ${priority}, assigned to ${assignee}.`],
      );
    });
    res.json({ ticket: await loadTicket(id), seq });
  } catch (e) {
    next(e);
  }
});

r.post('/tickets/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { author, role = '', text } = req.body || {};
    const id = req.params.id;
    const date = req.body.date || todayStr();
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM ticket_comments WHERE ticket_id=?', [id]);
    const [{ a }] = await query('SELECT COUNT(*) AS a FROM ticket_activity WHERE ticket_id=?', [id]);
    await withConn(async (c) => {
      await c.execute(
        'INSERT INTO ticket_comments (ticket_id,author,role,date,text,seq) VALUES (?,?,?,?,?,?)',
        [id, author, role, date, text, n],
      );
      await c.execute(
        'INSERT INTO ticket_activity (ticket_id,date,text,seq) VALUES (?,?,?,?)',
        [id, date, `Comment added by ${author}${role ? ` (${role})` : ''}.`, a],
      );
    });
    res.json(await loadTicket(id));
  } catch (e) {
    next(e);
  }
});

r.patch('/tickets/:id', requireAuth, async (req, res, next) => {
  try {
    const { status, priority, assignee, resolvedDate, activity } = req.body || {};
    const id = req.params.id;
    const sets = [];
    const vals = [];
    if (status !== undefined) { sets.push('status=?'); vals.push(status); }
    if (priority !== undefined) { sets.push('priority=?'); vals.push(priority); }
    if (assignee !== undefined) { sets.push('assignee=?'); vals.push(assignee); }
    if (resolvedDate !== undefined) { sets.push('resolved_date=?'); vals.push(resolvedDate); }
    await withConn(async (c) => {
      if (sets.length) {
        await c.execute(`UPDATE tickets SET ${sets.join(',')} WHERE id=?`, [...vals, id]);
      }
      for (const entry of activity || []) {
        const [countRows] = await c.query(
          'SELECT COUNT(*) AS a FROM ticket_activity WHERE ticket_id=?', [id],
        );
        await c.execute(
          'INSERT INTO ticket_activity (ticket_id,date,text,seq) VALUES (?,?,?,?)',
          [id, entry.date, entry.text, countRows[0].a],
        );
      }
    });
    const ticket = await loadTicket(id);
    if (!ticket) return res.status(404).json({ error: 'ticket not found' });
    return res.json(ticket);
  } catch (e) {
    return next(e);
  }
});

export default r;

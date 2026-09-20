import { Router } from 'express';
import { query, withConn } from '../db.js';
import { requireAuth, requireCap } from '../auth.js';
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

/** A supplier session may only touch tickets raised on invoices of its own
 *  vendor code. Internal sessions may touch any. */
async function canAccessInvoice(session, invoiceNo) {
  if (session.authType !== 'supplier') return true;
  const [inv] = await query('SELECT vcode FROM invoices WHERE no=?', [invoiceNo]);
  return !!inv && inv.vcode === session.supplier?.vcode;
}

r.get('/tickets', requireAuth, async (req, res, next) => {
  try {
    const rows = await query('SELECT id, no FROM tickets');
    const visible = [];
    for (const x of rows) if (await canAccessInvoice(req.session, x.no)) visible.push(x);
    res.json(await Promise.all(visible.map((x) => loadTicket(x.id))));
  } catch (e) {
    next(e);
  }
});

r.post('/tickets', requireAuth, async (req, res, next) => {
  try {
    const { no, category, priority = 'Medium', desc, assignee = 'MDE Invoice Team' } = req.body || {};
    if (!no || !category) return res.status(400).json({ error: 'invoice no and category are required' });
    const [inv] = await query('SELECT no FROM invoices WHERE no=?', [no]);
    if (!inv) return res.status(404).json({ error: 'invoice not found' });
    if (!(await canAccessInvoice(req.session, no))) return res.status(403).json({ error: 'Not your invoice.' });

    // who raised it comes from the session, not the request body
    const raisedBy = req.session.authType === 'supplier' ? 'Supplier' : 'Internal';
    const date = req.body.date || todayStr();

    // The id is max+1; two concurrent requests can pick the same one, so a
    // duplicate-key failure just retries with the next number.
    let id;
    let seq;
    for (let attempt = 0; ; attempt++) {
      const [{ maxid }] = await query(
        "SELECT COALESCE(MAX(CAST(SUBSTRING(id,5) AS UNSIGNED)),1005) AS maxid FROM tickets",
      );
      seq = Number(maxid) + 1;
      id = 'TCK-' + seq;
      try {
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
        break;
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY' || attempt >= 5) throw e;
      }
    }
    res.json({ ticket: await loadTicket(id), seq });
  } catch (e) {
    next(e);
  }
});

r.post('/tickets/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const { author, text } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text is required' });
    const [t] = await query('SELECT * FROM tickets WHERE id=?', [id]);
    if (!t) return res.status(404).json({ error: 'ticket not found' });
    if (!(await canAccessInvoice(req.session, t.no))) return res.status(403).json({ error: 'Not your ticket.' });

    const isSupplier = req.session.authType === 'supplier';
    // a supplier can't post as an internal role (or vice versa)
    const role = isSupplier ? 'Supplier' : (req.body.role && req.body.role !== 'Supplier' ? req.body.role : '');
    const date = req.body.date || todayStr();
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM ticket_comments WHERE ticket_id=?', [id]);
    const [{ a }] = await query('SELECT COUNT(*) AS a FROM ticket_activity WHERE ticket_id=?', [id]);

    await withConn(async (c) => {
      await c.execute(
        'INSERT INTO ticket_comments (ticket_id,author,role,date,text,seq) VALUES (?,?,?,?,?,?)',
        [id, author || (isSupplier ? 'Supplier' : 'Internal'), role, date, text, n],
      );
      let seq = Number(a);
      const log = (line) => c.execute(
        'INSERT INTO ticket_activity (ticket_id,date,text,seq) VALUES (?,?,?,?)',
        [id, date, line, seq++],
      );
      await log(`Comment added by ${author || 'user'}${role ? ` (${role})` : ''}.`);

      // Same status rules the client applies optimistically, so the server copy
      // that comes back agrees with what the user just saw.
      if (isSupplier && t.status === 'Resolved') {
        await c.execute("UPDATE tickets SET status='In Progress', resolved_date=NULL WHERE id=?", [id]);
        await log('Reopened to In Progress after a supplier reply.');
      } else if (!isSupplier && t.status === 'Open') {
        await c.execute("UPDATE tickets SET status='In Progress' WHERE id=?", [id]);
        await log('Status changed to In Progress.');
      }
    });
    res.json(await loadTicket(id));
  } catch (e) {
    next(e);
  }
});

// Status / priority / assignee changes are an internal editing action.
r.patch('/tickets/:id', requireCap('editRows'), async (req, res, next) => {
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

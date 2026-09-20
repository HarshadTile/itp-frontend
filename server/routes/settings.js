import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireInternal, roleFor } from '../auth.js';

const r = Router();

function parseJson(v) {
  return typeof v === 'string' ? JSON.parse(v) : v;
}

async function readSettings() {
  const [s] = await query('SELECT * FROM settings WHERE id=1');
  const integrations = (await query('SELECT name,status,last_sync FROM integrations ORDER BY id'))
    .map((i) => [i.name, i.status, i.last_sync]);
  return {
    roleMatrix: parseJson(s.role_matrix_json),
    twoFactorOn: !!s.two_factor,
    senderEmail: s.sender_email,
    integrations,
  };
}

r.get('/settings', requireAuth, async (_req, res, next) => {
  try {
    res.json(await readSettings());
  } catch (e) {
    next(e);
  }
});

r.put('/settings', requireInternal, async (req, res, next) => {
  try {
    const { roleMatrix, twoFactorOn, senderEmail } = req.body || {};
    // Changing who-can-do-what needs the manageUsers capability; the sender
    // address is mail configuration (manageConfig). 2FA is a personal toggle.
    const needs = roleMatrix !== undefined ? 'manageUsers' : senderEmail !== undefined ? 'manageConfig' : null;
    if (needs) {
      const [cur] = await query('SELECT role_matrix_json FROM settings WHERE id=1');
      const perm = parseJson(cur.role_matrix_json)[roleFor(req.session)];
      if (!perm || !perm[needs]) return res.status(403).json({ error: 'Your role is not permitted to do this.' });
    }
    const sets = [];
    const vals = [];
    if (roleMatrix !== undefined) { sets.push('role_matrix_json=?'); vals.push(JSON.stringify(roleMatrix)); }
    if (twoFactorOn !== undefined) { sets.push('two_factor=?'); vals.push(twoFactorOn ? 1 : 0); }
    if (senderEmail !== undefined) { sets.push('sender_email=?'); vals.push(senderEmail); }
    if (sets.length) await query(`UPDATE settings SET ${sets.join(',')} WHERE id=1`, vals);
    res.json(await readSettings());
  } catch (e) {
    next(e);
  }
});

export default r;

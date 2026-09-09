import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';

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

r.put('/settings', requireAuth, async (req, res, next) => {
  try {
    const { roleMatrix, twoFactorOn, senderEmail } = req.body || {};
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

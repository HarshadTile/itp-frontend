import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

export const hashPassword = (s) => bcrypt.hashSync(s, 10);
export const verifyPassword = (s, hash) => bcrypt.compareSync(s, hash);

function parseJson(v) {
  if (v == null) return null;
  return typeof v === 'string' ? JSON.parse(v) : v;
}

export async function createSession({ userId = null, authType, scope = null, supplier = null }) {
  const token = randomUUID();
  await query(
    'INSERT INTO sessions (token,user_id,auth_type,scope_json,supplier_json) VALUES (?,?,?,?,?)',
    [token, userId, authType, scope ? JSON.stringify(scope) : null, supplier ? JSON.stringify(supplier) : null],
  );
  return token;
}

export async function getSession(token) {
  if (!token) return null;
  const rows = await query('SELECT * FROM sessions WHERE token=?', [token]);
  if (!rows.length) return null;
  const r = rows[0];
  return {
    token: r.token,
    userId: r.user_id,
    authType: r.auth_type,
    scope: parseJson(r.scope_json),
    supplier: parseJson(r.supplier_json),
  };
}

export async function deleteSession(token) {
  await query('DELETE FROM sessions WHERE token=?', [token]);
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const session = await getSession(token);
    if (!session) return res.status(401).json({ error: 'Not authenticated' });
    req.session = session;
    return next();
  } catch (e) {
    return next(e);
  }
}

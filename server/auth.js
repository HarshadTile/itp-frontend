import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

export const verifyPassword = (s, hash) => bcrypt.compareSync(s, hash);

// Sessions older than this are rejected (and lazily deleted).
export const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS) || 12;

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
  const rows = await query(
    `SELECT * FROM sessions WHERE token=? AND created_at > (NOW() - INTERVAL ${Number(SESSION_TTL_HOURS)} HOUR)`,
    [token],
  );
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

/** The role a session acts as. Mirrors buildAuthPayload in serializers.js. */
export function roleFor(session) {
  if (session.authType === 'supplier') return 'Viewer';
  return session.scope?.channelScope !== 'all' ? 'MDE Invoice Team' : 'Admin';
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

/** Authenticated, internal (non-supplier) session only. */
export async function requireInternal(req, res, next) {
  return requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.session.authType !== 'internal') return res.status(403).json({ error: 'Not permitted for supplier logins.' });
    return next();
  });
}

/** Authenticated internal session whose role holds the given capability in the
 *  role matrix stored in the settings table (e.g. 'editRows', 'manageUsers'). */
export const requireCap = (cap) => async (req, res, next) => requireInternal(req, res, async (err) => {
  if (err) return next(err);
  try {
    const [s] = await query('SELECT role_matrix_json FROM settings WHERE id=1');
    const matrix = s ? parseJson(s.role_matrix_json) : {};
    const perm = matrix[roleFor(req.session)];
    if (!perm || !perm[cap]) return res.status(403).json({ error: 'Your role is not permitted to do this.' });
    return next();
  } catch (e) {
    return next(e);
  }
});

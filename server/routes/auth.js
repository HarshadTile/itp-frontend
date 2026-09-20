import { Router } from 'express';
import { query } from '../db.js';
import { verifyPassword, createSession, deleteSession, requireAuth, getSession } from '../auth.js';
import { buildAuthPayload } from '../serializers.js';
import { panFor, supplierForCode } from '../identity.js';

const r = Router();

r.post('/login', async (req, res, next) => {
  try {
    const { mode } = req.body || {};

    if (mode === 'supplier') {
      // The vendor code is the credential: it must exist, and the supplier it
      // belongs to is looked up server-side (never trusted from the client).
      const vcode = String(req.body.vcode || '').trim();
      if (!vcode) return res.status(400).json({ error: 'vendor code is required' });
      const company = await supplierForCode(vcode);
      if (!company) return res.status(401).json({ error: 'Invalid vendor code.' });
      const supplier = { company: company.vendor, pan: panFor(company.vendor), vcode: company.vcode };
      const token = await createSession({ authType: 'supplier', supplier });
      const session = await getSession(token);
      return res.json({ token, auth: buildAuthPayload(session) });
    }

    const { username, password, channelScope } = req.body;
    const rows = await query('SELECT * FROM users WHERE username=?', [String(username || '').toLowerCase()]);
    const user = rows[0];
    if (!user || !verifyPassword(password || '', user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    // Only Admin accounts may sign in with the all-channels (HQ) scope.
    const wantsAll = channelScope !== 'internalTeam';
    if (wantsAll && user.role !== 'Admin') {
      return res.status(403).json({ error: 'This account can only sign in to the Internal Team portal.' });
    }
    const scope = { channelScope: wantsAll ? 'all' : 'internalTeam' };
    const token = await createSession({ userId: user.id, authType: 'internal', scope });
    const session = await getSession(token);
    return res.json({ token, auth: buildAuthPayload(session, user) });
  } catch (e) {
    return next(e);
  }
});

r.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await deleteSession(req.session.token);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

r.get('/me', requireAuth, async (req, res, next) => {
  try {
    let userRow = null;
    if (req.session.userId) {
      const rows = await query('SELECT * FROM users WHERE id=?', [req.session.userId]);
      userRow = rows[0] || null;
    }
    return res.json({ auth: buildAuthPayload(req.session, userRow) });
  } catch (e) {
    return next(e);
  }
});

export default r;

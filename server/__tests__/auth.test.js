import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { seedAll } from '../seed.js';
import { createApp } from '../index.js';
import { query, closePools } from '../db.js';

let app;
beforeAll(async () => {
  await seedAll();
  app = createApp();
});
afterAll(async () => { await closePools(); });

describe('auth', () => {
  it('logs in with correct internal credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ mode: 'internal', username: 'admin', password: 'admin123', channelScope: 'all' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.auth.authType).toBe('internal');
    expect(res.body.auth.role).toBe('Admin');
    expect(res.body.auth.currentUser.email).toBe('r.kulkarni@company.com');
  });

  it('maps the internalTeam scope to the MDE Invoice Team role', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ mode: 'internal', username: 'priya', password: 'priya123', channelScope: 'internalTeam' });
    expect(res.status).toBe(200);
    expect(res.body.auth.channelScope).toBe('internalTeam');
    expect(res.body.auth.role).toBe('MDE Invoice Team');
  });

  it('rejects a wrong password and creates no session', async () => {
    const [{ n: before }] = await query('SELECT COUNT(*) AS n FROM sessions');
    const res = await request(app)
      .post('/api/login')
      .send({ mode: 'internal', username: 'admin', password: 'nope' });
    expect(res.status).toBe(401);
    const [{ n: after }] = await query('SELECT COUNT(*) AS n FROM sessions');
    expect(after).toBe(before);
  });

  it('GET /api/me works with a valid token and 401s without one', async () => {
    const login = await request(app)
      .post('/api/login')
      .send({ mode: 'internal', username: 'admin', password: 'admin123' });
    const ok = await request(app).get('/api/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.auth.role).toBe('Admin');

    const no = await request(app).get('/api/me');
    expect(no.status).toBe(401);
  });

  it('logout deletes the session so the token stops working', async () => {
    const login = await request(app)
      .post('/api/login')
      .send({ mode: 'internal', username: 'admin', password: 'admin123' });
    const token = login.body.token;
    await request(app).post('/api/logout').set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).get('/api/me').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('supplier login needs no password and resolves the supplier from the vendor code', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ mode: 'supplier', vcode: 'dit00388ac', company: 'Ignored Corp' });
    expect(res.status).toBe(200);
    expect(res.body.auth.authType).toBe('supplier');
    expect(res.body.auth.supplierQuery).toBe('Tata Communications Ltd'); // from the DB, not the request
    expect(res.body.auth.supplierLoginVcode).toBe('DIT00388AC');
    expect(res.body.auth.supplierPAN).toMatch(/^[A-Z]{5}\d{4}[A-Z]$/);
  });

  it('rejects an unknown vendor code and creates no session', async () => {
    const [{ n: before }] = await query('SELECT COUNT(*) AS n FROM sessions');
    const res = await request(app).post('/api/login').send({ mode: 'supplier', vcode: 'NOPE999' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid vendor code/);
    const [{ n: after }] = await query('SELECT COUNT(*) AS n FROM sessions');
    expect(after).toBe(before);
    await request(app).post('/api/login').send({ mode: 'supplier' }).expect(400);
  });

  it('only Admin accounts may use the all-channels scope', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ mode: 'internal', username: 'priya', password: 'priya123', channelScope: 'all' });
    expect(res.status).toBe(403);
  });

  it('rejects an expired session', async () => {
    const login = await request(app)
      .post('/api/login')
      .send({ mode: 'internal', username: 'admin', password: 'admin123' });
    await query("UPDATE sessions SET created_at = NOW() - INTERVAL 13 HOUR WHERE token=?", [login.body.token]);
    await request(app).get('/api/me').set('Authorization', `Bearer ${login.body.token}`).expect(401);
  });
});

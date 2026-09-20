import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { seedAll } from '../seed.js';
import { createApp } from '../index.js';
import { closePools } from '../db.js';

let app;
const tokens = {};
const h = (k) => ({ Authorization: `Bearer ${tokens[k]}` });

async function login(body) {
  const res = await request(app).post('/api/login').send(body);
  expect(res.status).toBe(200);
  return res.body.token;
}

beforeAll(async () => {
  await seedAll();
  app = createApp();
  tokens.admin = await login({ mode: 'internal', username: 'admin', password: 'admin123', channelScope: 'all' });
  tokens.team = await login({ mode: 'internal', username: 'priya', password: 'priya123', channelScope: 'internalTeam' });
  tokens.supplier = await login({ mode: 'supplier', vcode: 'DIT00388AC' });
});
afterAll(async () => { await closePools(); });

describe('supplier data scoping', () => {
  it('bootstrap only returns the supplier\'s own vendor code and its tickets', async () => {
    const res = await request(app).get('/api/bootstrap').set(h('supplier'));
    expect(res.status).toBe(200);
    expect(res.body.invoices.length).toBeGreaterThan(0);
    expect(res.body.invoices.every((i) => i.vcode === 'DIT00388AC')).toBe(true);
    const mine = new Set(res.body.invoices.map((i) => i.no));
    expect(res.body.tickets.every((t) => mine.has(t.no))).toBe(true);
    expect(res.body.tables).toEqual({});
  });

  it('cannot raise or comment on another vendor code\'s invoice/ticket', async () => {
    const other = await request(app).post('/api/tickets').set(h('supplier'))
      .send({ no: 'INV-MS-1004', category: 'Short Payment' }); // Bosch
    expect(other.status).toBe(403);
    const cmt = await request(app).post('/api/tickets/TCK-1003/comments').set(h('supplier'))
      .send({ author: 'x', text: 'hi' }); // INV-MN-3003, Bharat Forge
    expect(cmt.status).toBe(403);
  });

  it('raisedBy comes from the session, not the request body', async () => {
    const res = await request(app).post('/api/tickets').set(h('supplier'))
      .send({ no: 'INV-MS-1001', category: 'Short Payment', raisedBy: 'Internal' }); // DIT00388AC
    expect(res.status).toBe(200);
    expect(res.body.ticket.raisedBy).toBe('Supplier');
  });

  it('a supplier reply reopens a Resolved ticket on the server too', async () => {
    // TCK-1001 (INV-PP-2002, vcode DIT00388AP) is Resolved in the seed
    const sup = await login({ mode: 'supplier', vcode: 'DIT00388AP' });
    const res = await request(app).post('/api/tickets/TCK-1001/comments')
      .set({ Authorization: `Bearer ${sup}` }).send({ author: 'Tata', role: 'Supplier', text: 'still wrong' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('In Progress');
    expect(res.body.resolvedDate).toBeNull();
    expect(res.body.comments.at(-1).role).toBe('Supplier');
  });
});

describe('write permissions', () => {
  it('suppliers cannot move invoices, edit tickets, tables or settings', async () => {
    await request(app).patch('/api/invoices/INV-MS-1002').set(h('supplier')).send({ status: 'Paid' }).expect(403);
    await request(app).patch('/api/tickets/TCK-1002').set(h('supplier')).send({ status: 'Closed' }).expect(403);
    await request(app).put('/api/tables/settings-users').set(h('supplier')).send({ rows: [] }).expect(403);
    await request(app).put('/api/settings').set(h('supplier')).send({ twoFactorOn: true }).expect(403);
    await request(app).get('/api/tables/settings-users').set(h('supplier')).expect(403);
  });

  it('a role without manageUsers cannot rewrite the role matrix', async () => {
    const cur = await request(app).get('/api/settings').set(h('team'));
    const matrix = cur.body.roleMatrix;
    matrix.Viewer.manageUsers = true;
    await request(app).put('/api/settings').set(h('team')).send({ roleMatrix: matrix }).expect(403);
    await request(app).put('/api/settings').set(h('admin')).send({ roleMatrix: matrix }).expect(200);
  });

  it('a role loses a capability as soon as the matrix removes it', async () => {
    const cur = await request(app).get('/api/settings').set(h('admin'));
    const matrix = cur.body.roleMatrix;
    matrix['MDE Invoice Team'].editRows = false;
    await request(app).put('/api/settings').set(h('admin')).send({ roleMatrix: matrix }).expect(200);
    await request(app).patch('/api/invoices/INV-MS-1002').set(h('team')).send({ status: 'Paid' }).expect(403);
  });
});

describe('invoice stage moves', () => {
  it('rejects unknown statuses and unknown invoices', async () => {
    await request(app).patch('/api/invoices/INV-MS-1003').set(h('admin')).send({ status: 'Bogus' }).expect(400);
    await request(app).patch('/api/invoices/NOPE').set(h('admin')).send({ status: 'Paid' }).expect(404);
  });

  it('re-derives stage_index from the new status', async () => {
    const before = await request(app).get('/api/invoices').set(h('admin'));
    const was = before.body.find((i) => i.no === 'INV-MS-1003').stageIndex;
    const res = await request(app).patch('/api/invoices/INV-MS-1003').set(h('admin')).send({ status: 'Approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Approved');
    expect(res.body.stageIndex).toBeGreaterThan(was);
  });
});

describe('Internal Team scope', () => {
  it('summary and recent exclude the Manual channel for an Internal Team session', async () => {
    const all = await request(app).get('/api/invoices/summary').set(h('admin'));
    const team = await request(app).get('/api/invoices/summary').set(h('team'));
    expect(all.body.byChannel.some((c) => c.key === 'manual')).toBe(true);
    expect(team.body.byChannel.some((c) => c.key === 'manual')).toBe(false);
    expect(team.body.total).toBeLessThan(all.body.total);
    const recent = await request(app).get('/api/invoices/recent?limit=25').set(h('team'));
    expect(recent.body.every((i) => i.channel !== 'manual')).toBe(true);
  });

  it('an HQ admin viewing as the Internal Team gets the same numbers via ?scope=', async () => {
    const team = await request(app).get('/api/invoices/summary').set(h('team'));
    const asTeam = await request(app).get('/api/invoices/summary?scope=internalTeam').set(h('admin'));
    expect(asTeam.body.total).toBe(team.body.total);
  });
});

describe('ticket ids', () => {
  it('concurrent ticket creation yields unique ids', async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () =>
      request(app).post('/api/tickets').set(h('admin')).send({ no: 'INV-MS-1002', category: 'Short Payment' })));
    expect(results.every((r) => r.status === 200)).toBe(true);
    const ids = results.map((r) => r.body.ticket.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

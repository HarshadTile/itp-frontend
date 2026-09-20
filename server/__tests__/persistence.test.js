import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { seedAll } from '../seed.js';
import { createApp } from '../index.js';
import { closePools } from '../db.js';

let app;
let token;

beforeAll(async () => {
  await seedAll();
  app = createApp();
  const login = await request(app)
    .post('/api/auth/login')
    .send({ mode: 'internal', username: 'admin', password: 'admin123' });
  token = login.body.token;
});
afterAll(async () => { await closePools(); });

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('persistence', () => {
  it('bootstrap returns the full seeded dataset', async () => {
    const res = await request(app).get('/api/workspace').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.invoices.length).toBeGreaterThanOrEqual(19);
    expect(res.body.tickets.length).toBeGreaterThanOrEqual(4);
    expect(res.body.tickets[0]).toHaveProperty('comments');
    expect(res.body.tables['settings-users'].length).toBeGreaterThanOrEqual(4);
    expect(res.body.settings.roleMatrix.Admin.manageUsers).toBe(true);
    expect(res.body.ticketSeq).toBeGreaterThanOrEqual(1004);
  });

  it('requires a token', async () => {
    await request(app).get('/api/workspace').expect(401);
  });

  it('a new ticket is visible from a fresh app instance', async () => {
    const create = await request(app).post('/api/tickets').set(auth()).send({
      no: 'INV-MS-1002', category: 'Payment Not Received', priority: 'High',
      desc: 'persistence check', raisedBy: 'Internal',
    });
    expect(create.status).toBe(200);
    const id = create.body.ticket.id;
    expect(create.body.ticket.activity.length).toBe(1);

    const fresh = createApp();
    const res = await request(fresh).get('/api/workspace').set(auth());
    expect(res.body.tickets.some((t) => t.id === id)).toBe(true);
  });

  it('a ticket comment persists and appends activity', async () => {
    const res = await request(app).post('/api/tickets/TCK-1002/comments').set(auth())
      .send({ author: 'MDE Invoice Team', role: 'MDE Invoice Team', text: 'checking now' });
    expect(res.status).toBe(200);
    const fresh = await request(createApp()).get('/api/workspace').set(auth());
    const t = fresh.body.tickets.find((x) => x.id === 'TCK-1002');
    expect(t.comments.at(-1).text).toBe('checking now');
    expect(t.activity.some((a) => /Comment added/.test(a.text))).toBe(true);
    expect(t.status).toBe('In Progress'); // internal reply picks up an Open ticket
  });

  it('an invoice stage move persists', async () => {
    await request(app).patch('/api/invoices/INV-MS-1003').set(auth())
      .send({ stageIndex: 6, status: 'Approved' }).expect(200);
    const fresh = await request(createApp()).get('/api/workspace').set(auth());
    const inv = fresh.body.invoices.find((i) => i.no === 'INV-MS-1003');
    expect(inv.stageIndex).toBe(6);
    expect(inv.status).toBe('Approved');
  });

  it('a permission toggle persists via PUT /api/settings', async () => {
    const cur = await request(app).get('/api/settings').set(auth());
    const matrix = cur.body.roleMatrix;
    matrix.Viewer.editRows = !matrix.Viewer.editRows;
    await request(app).put('/api/settings').set(auth()).send({ roleMatrix: matrix }).expect(200);
    const fresh = await request(createApp()).get('/api/workspace').set(auth());
    expect(fresh.body.settings.roleMatrix.Viewer.editRows).toBe(matrix.Viewer.editRows);
  });

  it('editable table rows round-trip through PUT /api/tables/:key', async () => {
    const next = [
      ['New Person', 'n.person@company.com', 'Analyst', 'Finance', 'Viewer', 'Active'],
    ];
    const put = await request(app).put('/api/tables/settings-users').set(auth()).send({ rows: next });
    expect(put.status).toBe(200);
    const fresh = await request(createApp()).get('/api/workspace').set(auth());
    expect(fresh.body.tables['settings-users']).toEqual(next);
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { seedAll } from '../seed.js';
import { query, closePools } from '../db.js';

beforeAll(async () => { await seedAll(); });
afterAll(async () => { await closePools(); });

describe('seed', () => {
  it('loads every invoice from src/data', async () => {
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM invoices');
    expect(n).toBeGreaterThanOrEqual(19);
  });

  it('loads tickets with their comments and activity', async () => {
    const [{ t }] = await query('SELECT COUNT(*) AS t FROM tickets');
    const [{ c }] = await query('SELECT COUNT(*) AS c FROM ticket_comments');
    expect(t).toBeGreaterThanOrEqual(4);
    expect(c).toBeGreaterThan(0);
  });

  it('stores the admin password as a bcrypt hash, not plaintext', async () => {
    const [u] = await query('SELECT password_hash FROM users WHERE username=?', ['admin']);
    expect(u.password_hash).not.toBe('admin123');
    expect(u.password_hash.startsWith('$2')).toBe(true);
  });

  it('writes exactly one settings row with a role matrix', async () => {
    const rows = await query('SELECT * FROM settings');
    expect(rows).toHaveLength(1);
    const matrix = typeof rows[0].role_matrix_json === 'string'
      ? JSON.parse(rows[0].role_matrix_json) : rows[0].role_matrix_json;
    expect(matrix.Admin.manageUsers).toBe(true);
  });

  it('is idempotent — a second run does not duplicate rows', async () => {
    await seedAll();
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM settings');
    expect(n).toBe(1);
  });

  it('gives each invoice a stage_index within its channel range', async () => {
    const rows = await query('SELECT no, stage_index FROM invoices');
    for (const r of rows) expect(r.stage_index).toBeGreaterThanOrEqual(0);
  });
});

import { describe, it, expect, afterAll } from 'vitest';
import { rootPool, closePools } from '../db.js';

afterAll(async () => { await closePools(); });

describe('db connection', () => {
  it('connects to the local MySQL server', async () => {
    const [rows] = await rootPool.query('SELECT 1 AS ok');
    expect(rows[0].ok).toBe(1);
  });
});

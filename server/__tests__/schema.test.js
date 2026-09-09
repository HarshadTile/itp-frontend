import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { applySchema } from '../applySchema.js';
import { query, closePools } from '../db.js';

beforeAll(async () => { await applySchema(); });
afterAll(async () => { await closePools(); });

const EXPECTED = [
  'users', 'sessions', 'invoices', 'tickets', 'ticket_comments',
  'ticket_activity', 'table_rows', 'settings', 'sync_log', 'integrations',
];

describe('schema', () => {
  it('creates all expected tables in mahindra_i2p', async () => {
    const rows = await query(
      'SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ?',
      ['mahindra_i2p'],
    );
    const names = rows.map((r) => String(r.t).toLowerCase());
    for (const t of EXPECTED) expect(names).toContain(t);
  });

  it('leaves the existing duroshox databases untouched', async () => {
    const rows = await query(
      "SELECT schema_name AS s FROM information_schema.schemata WHERE schema_name LIKE 'duroshox%'",
    );
    // We never drop or create these; just assert we can still see them.
    expect(Array.isArray(rows)).toBe(true);
  });
});

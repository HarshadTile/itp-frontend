import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rootPool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Create the database and every table. Safe to run repeatedly. */
export async function applySchema() {
  const sql = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  const conn = await rootPool.getConnection();
  try {
    // rootPool has multipleStatements enabled.
    await conn.query(sql);
  } finally {
    conn.release();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  applySchema()
    .then(() => { console.log('schema applied'); return rootPool.end(); })
    .then(() => process.exit(0))
    .catch((e) => { console.error('schema failed:', e.message); process.exit(1); });
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { rootPool, DB_NAME } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Create the database and every table. Safe to run repeatedly. The database
 *  name comes from DB_NAME (schema.sql is written against `mahindra_i2p`), which
 *  is how the test suite gets its own `mahindra_i2p_test` database. */
export async function applySchema() {
  if (!/^[A-Za-z0-9_]+$/.test(DB_NAME)) throw new Error(`Unsafe DB_NAME: ${DB_NAME}`);
  const sql = (await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8'))
    .replaceAll('mahindra_i2p', DB_NAME);
  const conn = await rootPool.getConnection();
  try {
    // rootPool has multipleStatements enabled.
    await conn.query(sql);
  } finally {
    conn.release();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  applySchema()
    .then(() => { console.log('schema applied'); return rootPool.end(); })
    .then(() => process.exit(0))
    .catch((e) => { console.error('schema failed:', e.message); process.exit(1); });
}

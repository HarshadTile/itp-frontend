import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  applySchema()
    .then(() => { console.log('schema applied'); return rootPool.end(); })
    .then(() => process.exit(0))
    .catch((e) => { console.error('schema failed:', e.message); process.exit(1); });
}

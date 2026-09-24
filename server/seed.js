import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import { applySchema } from './applySchema.js';
import { pool, query, closePools } from './db.js';

const TABLES = [
  'ticket_comments', 'ticket_activity', 'tickets', 'sessions', 'users',
  'invoices', 'table_rows', 'settings', 'sync_log', 'integrations',
];

export async function seedAll() {
  await applySchema();
  await pool.query('SET FOREIGN_KEY_CHECKS=0');
  for (const table of TABLES) await pool.query(`TRUNCATE TABLE \`${table}\``);
  await pool.query('SET FOREIGN_KEY_CHECKS=1');
  await query(
    'INSERT INTO users (username,password_hash,name,email,role,dept,title,status) VALUES (?,?,?,?,?,?,?,?)',
    ['admin', bcrypt.hashSync('admin@123', 10), 'Administrator', 'admin@company.com', 'Admin', 'IT', 'System Administrator', 'Active'],
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedAll()
    .then(() => { console.log('schema created, application data cleared, and temporary admin provisioned'); return closePools(); })
    .then(() => process.exit(0))
    .catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
}

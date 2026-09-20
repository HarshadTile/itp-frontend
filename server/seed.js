import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import { applySchema } from './applySchema.js';
import { pool, query, closePools } from './db.js';
import { stageIndexFor } from './stageIndex.js';
import { INVOICE_DATA, SYNC_LOG } from '../src/data/invoices.js';
import { INITIAL_TICKETS } from '../src/data/tickets.js';
import { ROLE_MATRIX } from '../src/data/constants.js';
import {
  buildExtraInvoices, buildExtraUsers, buildExtraTickets, buildExtraSyncLog,
} from './dummyData.js';

// Hand-written rows + generated demo rows.
const ALL_INVOICES = [...INVOICE_DATA, ...buildExtraInvoices()];
const ALL_TICKETS = [...INITIAL_TICKETS, ...buildExtraTickets(ALL_INVOICES)];
const ALL_SYNC = [...SYNC_LOG, ...buildExtraSyncLog()];

// Login accounts. Passwords are bcrypt-hashed on insert.
const USERS = [
  ['admin', 'admin123', 'Administrator', 'admin@company.com', 'Admin', 'IT', 'System Administrator'],
  ['ravi', 'ravi123', 'Ravi Kulkarni', 'r.kulkarni@company.com', 'Admin', 'Procurement', 'MDE Invoice Lead'],
  ['priya', 'priya123', 'Priya Deshmukh', 'p.deshmukh@company.com', 'MDE Invoice Team', 'Procurement', 'Invoice Processor'],
  ...buildExtraUsers(),
];

// Editable grids shown under Settings.
const TABLE_ROWS = {
  'settings-users': [
    ['Administrator', 'admin@company.com', 'System Administrator', 'IT', 'Admin', 'Active'],
    ['Ravi Kulkarni', 'r.kulkarni@company.com', 'MDE Invoice Lead', 'Procurement', 'Admin', 'Active'],
    ['Priya Deshmukh', 'p.deshmukh@company.com', 'Invoice Processor', 'Procurement', 'MDE Invoice Team', 'Active'],
    ['Ajay Menon', 'a.menon@company.com', 'Category Approver', 'Sourcing', 'Approver', 'Active'],
    ['Neha Kulkarni', 'n.kulkarni@company.com', 'Accounts Executive', 'Finance', 'Accounts', 'Active'],
    ['Anil Mehta', 'a.mehta@company.com', 'Category Approver', 'Sourcing', 'Approver', 'Active'],
    ['Vijay Nair', 'v.nair@company.com', 'Accounts Executive', 'Finance', 'Accounts', 'Active'],
    ['Kiran Shah', 'k.shah@company.com', 'Accounts Executive', 'Finance', 'Accounts', 'Active'],
    ['Sneha Iyer', 's.iyer@company.com', 'Category Approver', 'Sourcing', 'Approver', 'Active'],
    ['Ramesh Rao', 'r.rao@company.com', 'Coordinator', 'Procurement', 'Viewer', 'Inactive'],
  ],
  'settings-notifications': [
    ['Invoice Uploaded', 'Internal, MDE Invoice Team', '-', 'On'],
    ['Approval Pending > 3 days', 'Internal, Approver', 'MDE Invoice Team', 'On'],
    ['Payment Due Today', 'Internal, Accounts', 'COE', 'On'],
    ['Payment Completed', 'Supplier', 'MDE Invoice Team', 'On'],
  ],
  'settings-audit': [
    ['2026-08-06 07:10', 'r.kulkarni@company.com', 'Login', 'SSO sign-in'],
    ['2026-08-05 18:02', 'MDE Invoice Team', 'Vendor Master Edit', 'Added vendor code TCLB15'],
  ],
};

const INTEGRATIONS = [
  ['Msetu / SRM', 'Connected', '06 Aug 2026, 07:00 AM'],
  ['PO Portal', 'Connected', '06 Aug 2026, 07:02 AM'],
  ['SAP (MIRO / ML81N / FBL1N)', 'Connected', '06 Aug 2026, 07:05 AM'],
  ['MFOX Portal', 'Connection Error', '06 Aug 2026, 07:08 AM'],
];

const TABLES = [
  'ticket_comments', 'ticket_activity', 'tickets', 'sessions', 'users',
  'invoices', 'table_rows', 'settings', 'sync_log', 'integrations',
];

export async function seedAll() {
  await applySchema();

  await pool.query('SET FOREIGN_KEY_CHECKS=0');
  for (const t of TABLES) await pool.query(`TRUNCATE TABLE \`${t}\``);
  await pool.query('SET FOREIGN_KEY_CHECKS=1');

  for (const [username, pw, name, email, role, dept, title] of USERS) {
    await query(
      'INSERT INTO users (username,password_hash,name,email,role,dept,title,status) VALUES (?,?,?,?,?,?,?,?)',
      [username, bcrypt.hashSync(pw, 10), name, email, role, dept, title, 'Active'],
    );
  }

  for (const i of ALL_INVOICES) {
    await query(
      `INSERT INTO invoices (no,vcode,vendor,channel,po,amount,status,utr,date,short_pay_reason,stage_index)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [i.no, i.vcode, i.vendor, i.channel, i.po, i.amount, i.status, i.utr || '-', i.date,
        i.shortPayReason || null, stageIndexFor(i)],
    );
  }

  for (const t of ALL_TICKETS) {
    await query(
      `INSERT INTO tickets (id,no,category,description,status,priority,assignee,raised_by,raised_date,sla_hours,resolved_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [t.id, t.no, t.category, t.desc, t.status, t.priority, t.assignee, t.raisedBy,
        t.raisedDate, t.slaHours || 24, t.resolvedDate || null],
    );
    let s = 0;
    for (const c of t.comments || []) {
      await query(
        'INSERT INTO ticket_comments (ticket_id,author,role,date,text,seq) VALUES (?,?,?,?,?,?)',
        [t.id, c.author, c.role || '', c.date, c.text, s++],
      );
    }
    s = 0;
    for (const a of t.activity || []) {
      await query(
        'INSERT INTO ticket_activity (ticket_id,date,text,seq) VALUES (?,?,?,?)',
        [t.id, a.date, a.text, s++],
      );
    }
  }

  for (const [key, rows] of Object.entries(TABLE_ROWS)) {
    for (let idx = 0; idx < rows.length; idx++) {
      await query(
        'INSERT INTO table_rows (table_key,row_index,cells_json) VALUES (?,?,?)',
        [key, idx, JSON.stringify(rows[idx])],
      );
    }
  }

  await query(
    'INSERT INTO settings (id,role_matrix_json,two_factor,sender_email) VALUES (1,?,?,?)',
    [JSON.stringify(ROLE_MATRIX), 0, 'i2ptracker@company.com'],
  );

  for (const s of ALL_SYNC) {
    await query(
      'INSERT INTO sync_log (channel,time,status,records,msg) VALUES (?,?,?,?,?)',
      [s.channel, s.time, s.status, s.records, s.msg],
    );
  }
  for (const [name, status, last] of INTEGRATIONS) {
    await query('INSERT INTO integrations (name,status,last_sync) VALUES (?,?,?)', [name, status, last]);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedAll()
    .then(() => { console.log('seed complete'); return closePools(); })
    .then(() => process.exit(0))
    .catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
}

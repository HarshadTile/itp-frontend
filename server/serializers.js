import { panFor } from './identity.js';

function initialsOf(name) {
  const words = name.split(/[\s._-]+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase(); // "admin" -> "AD"
  return words.map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/** The name shown for an internal user follows how they signed in: with their
 *  username ("admin") the app shows "admin"; with their e-mail it shows the
 *  account holder's full name. `fullName` always carries the real name. */
function internalUser(userRow, scope) {
  const shown = scope.loginBy === 'email' ? userRow.name : (scope.loginId || userRow.username);
  return {
    username: userRow.username,
    name: shown,
    fullName: userRow.name,
    initials: initialsOf(shown),
    title: userRow.title,
    dept: userRow.dept,
    email: userRow.email,
  };
}

/** Build the exact object shape the client's authSlice expects. */
export function buildAuthPayload(session, userRow = null) {
  if (session.authType === 'supplier') {
    const s = session.supplier || {};
    const company = s.company;
    const name = company || 'Supplier';
    return {
      authType: 'supplier',
      channelScope: 'all',
      role: 'Viewer',
      supplierQuery: company,
      supplierPAN: s.pan ?? panFor(company),
      supplierLoginVcode: s.vcode,
      currentUser: {
        name,
        initials: initialsOf(name),
        title: 'Supplier',
        dept: 'Supplier',
        email: '',
      },
    };
  }
  const scope = session.scope || {};
  const validScopes = ['all', 'msetuSrm', 'poPortal', 'mfoxPortal'];
  const channelScope = validScopes.includes(scope.channelScope) ? scope.channelScope : 'all';
  return {
    authType: 'internal',
    channelScope,
    role: channelScope === 'all' ? 'Admin' : 'MDE Invoice Team',
    supplierQuery: null,
    supplierPAN: null,
    supplierLoginVcode: null,
    currentUser: userRow ? internalUser(userRow, scope) : null,
  };
}

export const toInvoice = (r) => ({
  no: r.no,
  vcode: r.vcode,
  vendor: r.vendor,
  channel: r.channel,
  po: r.po,
  amount: r.amount,
  status: r.status,
  utr: r.utr,
  date: r.date,
  shortPayReason: r.short_pay_reason || undefined,
  stageIndex: r.stage_index,
});

export const toSyncRow = (r) => ({
  channel: r.channel, time: r.time, status: r.status, records: r.records, msg: r.msg,
});

export function toTicket(row, comments = [], activity = []) {
  return {
    id: row.id,
    no: row.no,
    category: row.category,
    desc: row.description,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    raisedBy: row.raised_by,
    raisedDate: row.raised_date,
    slaHours: row.sla_hours,
    resolvedDate: row.resolved_date || null,
    comments: comments.map((c) => ({ author: c.author, role: c.role, date: c.date, text: c.text })),
    activity: activity.map((a) => ({ date: a.date, text: a.text })),
  };
}

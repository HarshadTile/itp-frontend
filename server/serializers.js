import { panFor, vendorCodesFor } from './identity.js';

const DEFAULT_USER = {
  name: 'Ravi Kulkarni', initials: 'RK', title: 'MDE Invoice Lead',
  dept: 'Procurement', email: 'r.kulkarni@company.com',
};

function initialsOf(name) {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/** Build the exact object shape the client's authSlice expects. */
export function buildAuthPayload(session, userRow = null) {
  if (session.authType === 'supplier') {
    const s = session.supplier || {};
    const company = s.company;
    return {
      authType: 'supplier',
      channelScope: 'all',
      role: 'Viewer',
      supplierQuery: company,
      supplierPAN: s.pan ?? panFor(company),
      supplierLoginVcode: s.vcode || vendorCodesFor(company)[0],
      currentUser: DEFAULT_USER,
    };
  }
  const scope = session.scope || {};
  const channelScope = scope.channelScope === 'internalTeam' ? 'internalTeam' : 'all';
  return {
    authType: 'internal',
    channelScope,
    role: channelScope === 'all' ? 'Admin' : 'MDE Invoice Team',
    supplierQuery: null,
    supplierPAN: null,
    supplierLoginVcode: null,
    currentUser: userRow
      ? {
          name: userRow.name,
          initials: initialsOf(userRow.name),
          title: userRow.title,
          dept: userRow.dept,
          email: userRow.email,
        }
      : DEFAULT_USER,
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

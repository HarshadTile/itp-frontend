/* Deterministic dummy dataset layered on top of the hand-written rows in
 * src/data/*. Import order matters only for readability — everything here is
 * pure and produces the same output every run. */

const CHANNELS = ['msetuSrm', 'poPortal', 'manual', 'mfoxPortal'];
const STATUSES = ['Uploaded', 'Pending Approval', 'Approved', 'Booked', 'Payment Due', 'Paid', 'Short-Paid', 'Failed'];

// supplier -> list of vendor codes (mirrors the "many codes, one supplier" theme)
const SUPPLIERS = {
  'Bosch Auto Components': ['BSC00021', 'BSC00044', 'BSC00078'],
  'Continental AG': ['CNT00187', 'CNT00203'],
  'Bharat Forge Ltd': ['BFL00456', 'BFL00461', 'BFL00470'],
  'Sandvik India': ['SDV00301', 'SDV00312'],
  'Sundram Fasteners Ltd': ['SFL00512', 'SFL00519'],
  'ZF India Pvt Ltd': ['ZFI00088', 'ZFI00090', 'ZFI00101'],
  'Valeo India Pvt Ltd': ['VLO00234'],
  'Gabriel India Ltd': ['GBL00777', 'GBL00780'],
  'Endurance Technologies Ltd': ['END00145', 'END00150', 'END00158'],
  'Motherson Sumi Systems': ['MSS00610', 'MSS00622'],
  'Exide Industries Ltd': ['EXD00330', 'EXD00341'],
  'CEAT Ltd': ['CET00905', 'CET00912'],
};

const APPROVERS = ['R. Kulkarni', 'S. Iyer', 'A. Mehta', 'P. Deshmukh', 'N. Bhatt'];
const ACCOUNTS = ['V. Nair', 'K. Shah', 'J. Pillai', 'M. Rao'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const CATEGORIES = ['Payment Not Received', 'Short Payment', 'Invoice Not Visible', 'Debit Note Query', 'PO / Rate Mismatch'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

// simple deterministic PRNG so the dataset is stable across runs
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];

function inr(r) {
  const n = Math.floor(10000 + r() * 900000);
  return '₹' + n.toLocaleString('en-IN');
}
function fx(r) {
  const cur = pick(r, ['$', '€', '£']);
  return cur + Math.floor(3000 + r() * 40000).toLocaleString('en-US');
}
function dateStr(r) {
  const day = String(1 + Math.floor(r() * 27)).padStart(2, '0');
  return `${day} ${pick(r, MONTHS)} 2026`;
}

export function buildExtraInvoices() {
  const r = rng(20260909);
  const rows = [];
  const supplierNames = Object.keys(SUPPLIERS);
  let counters = { msetuSrm: 1100, poPortal: 2100, manual: 3100, mfoxPortal: 4100 };

  supplierNames.forEach((vendor) => {
    const codes = SUPPLIERS[vendor];
    const invoiceCount = 4 + Math.floor(r() * 4); // 4-7 invoices per supplier
    for (let i = 0; i < invoiceCount; i++) {
      const channel = pick(r, CHANNELS);
      const prefix = { msetuSrm: 'MS', poPortal: 'PP', manual: 'MN', mfoxPortal: 'MF' }[channel];
      counters[channel] += 1;
      const status = pick(r, STATUSES);
      const isFx = channel === 'mfoxPortal';
      const paid = status === 'Paid' || status === 'Short-Paid';
      rows.push({
        no: `INV-${prefix}-${counters[channel]}`,
        vcode: pick(r, codes),
        vendor,
        channel,
        po: '45000' + Math.floor(10000 + r() * 89999) + (channel === 'manual' ? ' (Capex)' : ''),
        amount: isFx ? fx(r) : inr(r),
        status,
        utr: paid ? 'UTR26' + Math.floor(1000000 + r() * 8999999) : '-',
        date: dateStr(r),
        shortPayReason: status === 'Short-Paid'
          ? `Debit note DN-${Math.floor(1000 + r() * 8999)} raised; amount deducted at payment.`
          : undefined,
      });
    }
  });
  return rows;
}

export function buildExtraUsers() {
  return [
    ['amehta', 'amehta123', 'Anil Mehta', 'a.mehta@company.com', 'Approver', 'Sourcing', 'Category Approver'],
    ['vnair', 'vnair123', 'Vijay Nair', 'v.nair@company.com', 'Accounts', 'Finance', 'Accounts Executive'],
    ['kshah', 'kshah123', 'Kiran Shah', 'k.shah@company.com', 'Accounts', 'Finance', 'Accounts Executive'],
    ['siyer', 'siyer123', 'Sneha Iyer', 's.iyer@company.com', 'Approver', 'Sourcing', 'Category Approver'],
    ['viewer', 'viewer123', 'Ramesh Rao', 'r.rao@company.com', 'Viewer', 'Procurement', 'Coordinator'],
  ];
}

export function buildExtraTickets(allInvoices) {
  const r = rng(88991122);
  const rows = [];
  // attach tickets to ~12 random invoices that aren't already ticketed
  const pool = allInvoices.filter((i) => ['Payment Due', 'Short-Paid', 'Failed', 'Pending Approval'].includes(i.status));
  const count = Math.min(12, pool.length);
  for (let i = 0; i < count; i++) {
    const inv = pool[Math.floor(r() * pool.length) % pool.length];
    const id = 'TCK-' + (1100 + i);
    const status = pick(r, ['Open', 'In Progress', 'Resolved', 'Closed']);
    const raisedBy = r() > 0.5 ? 'Supplier' : 'Internal';
    const assignee = pick(r, ['MDE Invoice Team', ...APPROVERS, ...ACCOUNTS]);
    const raisedDate = dateStr(r);
    const comments = [
      { author: raisedBy, role: raisedBy, date: raisedDate, text: 'Raising this against the invoice, please check and update.' },
    ];
    const activity = [
      { date: raisedDate, text: `Ticket created by ${raisedBy}, priority set to Medium, assigned to ${assignee}.` },
    ];
    if (status !== 'Open') {
      comments.push({ author: assignee, role: 'MDE Invoice Team', date: raisedDate, text: 'Looking into this, will revert shortly.' });
      activity.push({ date: raisedDate, text: 'Status changed to In Progress.' });
    }
    if (status === 'Resolved' || status === 'Closed') {
      activity.push({ date: raisedDate, text: `Status changed to ${status}.` });
    }
    rows.push({
      id,
      no: inv.no,
      category: pick(r, CATEGORIES),
      desc: 'Auto-generated demo query for ' + inv.no + '.',
      status,
      priority: pick(r, PRIORITIES),
      assignee,
      raisedBy,
      raisedDate,
      slaHours: pick(r, [24, 48]),
      resolvedDate: (status === 'Resolved' || status === 'Closed') ? raisedDate : null,
      comments,
      activity,
    });
  }
  return rows;
}

export function buildExtraSyncLog() {
  return [
    { channel: 'Msetu / SRM', time: '07 Aug 2026, 07:00 AM', status: 'Success', records: 231, msg: '231 invoices pulled, 0 errors' },
    { channel: 'PO Portal', time: '07 Aug 2026, 07:02 AM', status: 'Success', records: 63, msg: '63 service-entry invoices pulled' },
    { channel: 'SAP: FBL1N', time: '07 Aug 2026, 07:05 AM', status: 'Success', records: 447, msg: 'Vendor-wise payment status & UTR refreshed' },
    { channel: 'MFOX Portal', time: '07 Aug 2026, 07:08 AM', status: 'Success', records: 12, msg: '12 foreign-currency invoices pulled' },
    { channel: 'Manual (Email Inbox)', time: '06 Aug 2026, 06:55 PM', status: 'Success', records: 7, msg: '7 email approvals parsed' },
  ];
}

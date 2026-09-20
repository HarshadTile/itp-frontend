import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CHANNELS, CHANNEL_LABEL } from '../data/constants';
import { selectScopedInvoices, selectInternalScopeLabel } from '../features/invoices/selectors';
import { setInvoicesTopTab } from '../features/ui/uiSlice';
import { api } from '../api/client';
import GlobalLogsBody from '../components/common/GlobalLogsBody.jsx';
import StatCard from '../components/common/StatCard.jsx';
import BarChart from '../components/common/BarChart.jsx';
import DonutChart from '../components/common/DonutChart.jsx';
import RecentInvoices from '../components/invoices/RecentInvoices.jsx';

/* KPI glyphs — same stroke family as the rest of the app */
const ClockIcon = (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
const CardIcon = (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>);
const EyeOffIcon = (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A9.5 9.5 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.5 6.5A17 17 0 0 0 2 12s4 7 10 7a9.4 9.4 0 0 0 3.5-.7" /></svg>);
const SplitIcon = (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M12 3v18M5 8l-3 4 3 4M19 8l3 4-3 4" /></svg>);

const STATUS_ORDER = ['Paid', 'Payment Due', 'Booked', 'Approved', 'Pending Approval', 'Uploaded', 'Short-Paid', 'Failed'];
const RECENT_LIMIT = 5;

/* Single-hue Mahindra-red ramp: dark = largest value, light = smallest. */
const RED_RAMP = ['#7C0A1B', '#9E0E24', '#C4122E', '#D63E51', '#E36B7B', '#EE97A3', '#F5BFC7', '#FADEE2'];
function shadeByRank(items) {
  const order = [...items].sort((a, b) => b.value - a.value).map((x) => x.key);
  const n = Math.max(items.length - 1, 1);
  return items.map((it) => {
    const rank = order.indexOf(it.key);
    const idx = Math.round((rank / n) * (RED_RAMP.length - 1));
    return { ...it, color: RED_RAMP[idx] };
  });
}

/* Aggregate the (already-loaded) invoice list into the same small shape the
   /dashboard/summary endpoint returns — used as an offline fallback. */
function aggregate(invoices) {
  const count = (fn) => invoices.filter(fn).length;
  return {
    total: invoices.length,
    kpi: {
      pendingApproval: count((i) => i.status === 'Pending Approval'),
      paymentDue: count((i) => i.status === 'Payment Due'),
      noUtr: count((i) => (i.status === 'Paid' || i.status === 'Short-Paid') && i.utr === '-'),
      shortPaid: count((i) => i.status === 'Short-Paid'),
    },
    byChannel: CHANNELS.map((c) => ({ key: c.key, value: count((i) => i.channel === c.key) })),
    byStatus: STATUS_ORDER.map((s) => ({ key: s, value: count((i) => i.status === s) })).filter((s) => s.value > 0),
  };
}

function recentFrom(invoices) {
  return [...invoices]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, RECENT_LIMIT);
}

export default function InvoicesPage() {
  const dispatch = useDispatch();
  const invoices = useSelector(selectScopedInvoices);
  const scopeLabel = useSelector(selectInternalScopeLabel);
  const isScoped = useSelector((s) => s.auth.channelScope === 'internalTeam');
  const topTab = useSelector((s) => s.ui.invoicesTopTab);

  // Server-side aggregation; falls back to the loaded list if the call fails.
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState(null);

  const dataVersion = useSelector((s) => s.ui.dataVersion);
  const fetchKey = `${isScoped ? 'team' : 'all'}:${dataVersion}`;

  useEffect(() => {
    let alive = true;
    // An HQ admin viewing "as Internal Team" has an unscoped session, so the
    // scope is sent explicitly; a real Internal Team session is scoped server-side.
    const scope = isScoped ? 'scope=internalTeam' : '';
    (async () => {
      try {
        const s = await api.get(`/dashboard/summary${scope ? `?${scope}` : ''}`);
        if (alive && s && s.kpi) setSummary({ key: fetchKey, data: s });
      } catch { /* fall back */ }
      try {
        const r = await api.get(`/dashboard/latest-invoices?count=${RECENT_LIMIT}${scope ? `&${scope}` : ''}`);
        if (alive && Array.isArray(r)) setRecent({ key: fetchKey, data: r });
      } catch { /* fall back */ }
    })();
    return () => { alive = false; };
  }, [fetchKey, isScoped]);

  // Server numbers are only used while they belong to the current scope/data
  // version; otherwise the (already scoped) loaded list is the fallback.
  const agg = summary?.key === fetchKey ? summary.data : aggregate(invoices);
  const recentRows = recent?.key === fetchKey ? recent.data : recentFrom(invoices);

  const channelSegments = shadeByRank(
    agg.byChannel
      .map((c) => ({ key: c.key, label: CHANNEL_LABEL[c.key] || c.key, value: c.value }))
      .filter((c) => c.value > 0),
  );
  const statusBars = shadeByRank(
    agg.byStatus.map((s) => ({ key: s.key, label: s.key, value: s.value })),
  );

  return (
    <>
      <header className="page-head page-head--tight">
        <h1 className="page-title">{isScoped ? `${scopeLabel} Invoice Tracking` : 'Invoice Tracking'}</h1>
      </header>

      <div className="seg-tabs" role="tablist" aria-label="Invoice view">
        <button type="button" role="tab" aria-selected={topTab === 'All Invoices'}
          className={`seg-tab${topTab === 'All Invoices' ? ' active' : ''}`}
          onClick={() => dispatch(setInvoicesTopTab('All Invoices'))}>Overview</button>
        {/* value stays 'All Invoices' for store compatibility; label reads 'Overview' */}
        <button type="button" role="tab" aria-selected={topTab === 'History'}
          className={`seg-tab${topTab === 'History' ? ' active' : ''}`}
          onClick={() => dispatch(setInvoicesTopTab('History'))}>History / Logs</button>
      </div>

      {topTab === 'History' ? (
        <GlobalLogsBody invoiceList={invoices} tableKey="invoicesHistory" />
      ) : (
        <div className="dash">
          <div className="kpi-grid">
            <StatCard tone="warn" icon={<ClockIcon />} label="Pending Approval" value={agg.kpi.pendingApproval} sub="Awaiting approver action" />
            <StatCard icon={<CardIcon />} label="Payment Due" value={agg.kpi.paymentDue} sub="Booked, due this cycle" />
            <StatCard tone="bad" icon={<EyeOffIcon />} label="No UTR Visibility" value={agg.kpi.noUtr} sub="Paid, UTR not yet synced" />
            <StatCard tone="warn" icon={<SplitIcon />} label="Short-Paid" value={agg.kpi.shortPaid} sub="Paid below invoice value" />
          </div>

          <div className="chart-grid">
            <div className="card chart-card">
              <h3>Invoices by Channel</h3>
              <DonutChart segments={channelSegments} total={agg.total} />
            </div>
            <div className="card chart-card">
              <h3>Invoice Status</h3>
              <BarChart bars={statusBars} />
            </div>
          </div>

          <div className="card recent-card">
            <h3>Recent Invoices <span className="card-hint">Latest {recentRows.length}</span></h3>
            <RecentInvoices rows={recentRows} />
          </div>
        </div>
      )}
    </>
  );
}

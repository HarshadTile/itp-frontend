import { useDispatch, useSelector } from 'react-redux';
import { CHANNELS } from '../data/constants';
import { selectScopedInvoices, selectFilteredInvoices, selectInternalScopeLabel } from '../features/invoices/selectors';
import { setInvoiceFilterChannel, setInvoiceFilterStatus, setInvoicesTopTab } from '../features/ui/uiSlice';
import InvoiceTable from '../components/invoices/InvoiceTable.jsx';
import GlobalLogsBody from '../components/common/GlobalLogsBody.jsx';
import StatCard from '../components/common/StatCard.jsx';
import BarChart from '../components/common/BarChart.jsx';
import DonutChart from '../components/common/DonutChart.jsx';

/* small stroke glyphs for the KPI tiles — same family as the rest of the app */
const ClockIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
const CardIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
);
const EyeOffIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A9.5 9.5 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.5 6.5A17 17 0 0 0 2 12s4 7 10 7a9.4 9.4 0 0 0 3.5-.7" /></svg>
);
const SplitIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M12 3v18M5 8l-3 4 3 4M19 8l3 4-3 4" /></svg>
);

/* one colour per status — no two the same */
const STATUS_COLOR = {
  Paid: '#16A34A', 'Payment Due': '#2563EB', Approved: '#0EA5E9', Booked: '#7C3AED',
  'Pending Approval': '#D97706', 'Short-Paid': '#EA9308', Uploaded: '#94A3B8', Failed: '#DC2626',
};
const STATUS_ORDER = ['Paid', 'Payment Due', 'Booked', 'Approved', 'Pending Approval', 'Uploaded', 'Short-Paid', 'Failed'];

export default function InvoicesPage() {
  const dispatch = useDispatch();
  const invoices = useSelector(selectScopedInvoices);
  const filtered = useSelector(selectFilteredInvoices);
  const scopeLabel = useSelector(selectInternalScopeLabel);
  const isScoped = useSelector((s) => s.auth.channelScope === 'internalTeam');
  const topTab = useSelector((s) => s.ui.invoicesTopTab);
  const invoiceFilterChannel = useSelector((s) => s.ui.invoiceFilterChannel);
  const invoiceFilterStatus = useSelector((s) => s.ui.invoiceFilterStatus);

  const pendingApproval = invoices.filter((i) => i.status === 'Pending Approval').length;
  const paymentDue = invoices.filter((i) => i.status === 'Payment Due').length;
  const noUtr = invoices.filter((i) => (i.status === 'Paid' || i.status === 'Short-Paid') && i.utr === '-').length;
  const shortPaid = invoices.filter((i) => i.status === 'Short-Paid').length;

  const bars = CHANNELS.map((c) => ({ key: c.key, label: c.label, value: invoices.filter((i) => i.channel === c.key).length }));
  const segments = STATUS_ORDER.filter((st) => invoices.some((i) => i.status === st)).map((st) => ({
    key: st, label: st, value: invoices.filter((i) => i.status === st).length, color: STATUS_COLOR[st],
  }));

  return (
    <>
      <header className="page-head">
        <h1 className="page-title">{isScoped ? `${scopeLabel} Invoice Tracking` : 'Invoice Tracking'}</h1>
        <p className="page-sub">Every supplier invoice across the four processing channels — from upload to payment.</p>
      </header>

      <div className="seg-tabs" role="tablist" aria-label="Invoice view">
        <button type="button" role="tab" aria-selected={topTab === 'All Invoices'}
          className={`seg-tab${topTab === 'All Invoices' ? ' active' : ''}`}
          onClick={() => dispatch(setInvoicesTopTab('All Invoices'))}>All Invoices</button>
        <button type="button" role="tab" aria-selected={topTab === 'History'}
          className={`seg-tab${topTab === 'History' ? ' active' : ''}`}
          onClick={() => dispatch(setInvoicesTopTab('History'))}>History / Logs</button>
      </div>

      {topTab === 'History' ? (
        <GlobalLogsBody invoiceList={invoices} tableKey="invoicesHistory" />
      ) : (
        <>
          <div className="kpi-grid">
            <StatCard tone="warn" icon={<ClockIcon />} label="Pending Approval" value={pendingApproval} sub="Awaiting approver action" onClick={() => dispatch(setInvoiceFilterStatus('Pending Approval'))} active={invoiceFilterStatus === 'Pending Approval'} />
            <StatCard icon={<CardIcon />} label="Payment Due" value={paymentDue} sub="Booked, due this cycle" onClick={() => dispatch(setInvoiceFilterStatus('Payment Due'))} active={invoiceFilterStatus === 'Payment Due'} />
            <StatCard tone="bad" icon={<EyeOffIcon />} label="No UTR Visibility" value={noUtr} sub="Paid, UTR not yet synced" />
            <StatCard tone="warn" icon={<SplitIcon />} label="Short-Paid" value={shortPaid} sub="Paid below invoice value" onClick={() => dispatch(setInvoiceFilterStatus('Short-Paid'))} active={invoiceFilterStatus === 'Short-Paid'} />
          </div>

          <div className="chart-grid">
            {!isScoped && (
              <div className="card">
                <h3>Invoices by Channel <span className="card-hint">Click a bar to filter</span></h3>
                <BarChart bars={bars} onBarClick={(key) => dispatch(setInvoiceFilterChannel(invoiceFilterChannel === key ? null : key))} activeKey={invoiceFilterChannel} />
              </div>
            )}
            <div className="card">
              <h3>Status Breakdown <span className="card-hint">Click a status to filter</span></h3>
              <DonutChart segments={segments} total={invoices.length} onSegmentClick={(key) => dispatch(setInvoiceFilterStatus(key))} activeKey={invoiceFilterStatus} />
            </div>
          </div>

          {!isScoped && (
            <div className="tabbar" role="tablist" aria-label="Filter invoices by channel">
              <button type="button" role="tab" aria-selected={!invoiceFilterChannel} className={`tab${!invoiceFilterChannel ? ' active' : ''}`} onClick={() => dispatch(setInvoiceFilterChannel(null))}>
                All <span className="tab-count">{invoices.length}</span>
              </button>
              {CHANNELS.map((c) => (
                <button type="button" role="tab" key={c.key} aria-selected={invoiceFilterChannel === c.key} className={`tab${invoiceFilterChannel === c.key ? ' active' : ''}`} onClick={() => dispatch(setInvoiceFilterChannel(c.key))}>
                  {c.label} <span className="tab-count">{invoices.filter((i) => i.channel === c.key).length}</span>
                </button>
              ))}
              {invoiceFilterStatus && (
                <button type="button" className="tab filter-clear" style={{ marginLeft: 'auto' }} onClick={() => dispatch(setInvoiceFilterStatus(invoiceFilterStatus))}>
                  Status: {invoiceFilterStatus} <span aria-hidden="true">✕</span>
                </button>
              )}
            </div>
          )}

          <div className="card">
            <InvoiceTable invoices={filtered} tableKey="invoiceTracking" mode="simple" bulk />
          </div>
        </>
      )}
    </>
  );
}

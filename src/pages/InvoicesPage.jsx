import { useDispatch, useSelector } from 'react-redux';
import { CHANNELS } from '../data/constants';
import { selectScopedInvoices, selectFilteredInvoices, selectInternalScopeLabel } from '../features/invoices/selectors';
import { setInvoiceFilterChannel, setInvoiceFilterStatus, setInvoicesTopTab } from '../features/ui/uiSlice';
import InvoiceTable from '../components/invoices/InvoiceTable.jsx';
import GlobalLogsBody from '../components/common/GlobalLogsBody.jsx';
import StatCard from '../components/common/StatCard.jsx';
import BarChart from '../components/common/BarChart.jsx';
import DonutChart from '../components/common/DonutChart.jsx';

const STATUS_COLOR = {
  Paid: 'var(--green)', 'Payment Due': 'var(--blue)', Booked: 'var(--purple)', Approved: 'var(--blue)',
  'Pending Approval': 'var(--amber)', Uploaded: '#94A3B8', 'Short-Paid': 'var(--amber)', Failed: 'var(--red)',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title">{isScoped ? `${scopeLabel} Invoice Tracking` : 'Invoice Tracking'}</h1>
      </div>

      <div className="sheet-carousel" style={{ margin: '12px 0 16px' }}>
        <div className="car-track">
          <button type="button" className={`car-chip${topTab === 'All Invoices' ? ' active' : ''}`} onClick={() => dispatch(setInvoicesTopTab('All Invoices'))}>All Invoices</button>
          <button type="button" className={`car-chip${topTab === 'History' ? ' active' : ''}`} onClick={() => dispatch(setInvoicesTopTab('History'))}>History / Logs</button>
        </div>
      </div>

      {topTab === 'History' ? (
        <GlobalLogsBody invoiceList={invoices} tableKey="invoicesHistory" />
      ) : (
        <>
          <div className="row" style={{ marginBottom: 20 }}>
            <StatCard tone="warn" icon="⏳" label="Pending Approval" value={pendingApproval} sub="Awaiting Approver action" onClick={() => dispatch(setInvoiceFilterStatus('Pending Approval'))} active={invoiceFilterStatus === 'Pending Approval'} />
            <StatCard icon="💳" label="Payment Due" value={paymentDue} sub="Booked, due per payment cycle" onClick={() => dispatch(setInvoiceFilterStatus('Payment Due'))} active={invoiceFilterStatus === 'Payment Due'} />
            <StatCard tone="bad" icon="🔍" label="No UTR Visibility" value={noUtr} sub="Paid but UTR not yet synced from FBL1N" />
            <StatCard tone="warn" icon="⚠" label="Short-Paid" value={shortPaid} sub="Amount paid < invoice amount" onClick={() => dispatch(setInvoiceFilterStatus('Short-Paid'))} active={invoiceFilterStatus === 'Short-Paid'} />
          </div>

          <div className="row" style={{ marginBottom: 20, alignItems: 'stretch' }}>
            {!isScoped && (
              <div className="card" style={{ flex: 2, minWidth: 340 }}>
                <h3>Invoices by Channel <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 11.5 }}>(click a bar to filter)</span></h3>
                <BarChart bars={bars} onBarClick={(key) => dispatch(setInvoiceFilterChannel(invoiceFilterChannel === key ? null : key))} activeKey={invoiceFilterChannel} />
              </div>
            )}
            <div className="card" style={{ flex: 1, minWidth: 220, textAlign: 'center' }}>
              <h3 style={{ textAlign: 'left' }}>Status Breakdown <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 11.5 }}>(click to filter)</span></h3>
              <DonutChart segments={segments} total={invoices.length} onSegmentClick={(key) => dispatch(setInvoiceFilterStatus(key))} activeKey={invoiceFilterStatus} />
            </div>
          </div>

          {!isScoped && (
            <div className="tabbar">
              <button type="button" className={`tab${!invoiceFilterChannel ? ' active' : ''}`} onClick={() => dispatch(setInvoiceFilterChannel(null))}>All {invoices.length}</button>
              {CHANNELS.map((c) => (
                <button type="button" key={c.key} className={`tab${invoiceFilterChannel === c.key ? ' active' : ''}`} onClick={() => dispatch(setInvoiceFilterChannel(c.key))}>
                  {c.label} {invoices.filter((i) => i.channel === c.key).length}
                </button>
              ))}
              {invoiceFilterStatus && (
                <button type="button" className="tab active" style={{ marginLeft: 'auto', background: 'var(--amber-bg)', color: 'var(--amber)' }} onClick={() => dispatch(setInvoiceFilterStatus(invoiceFilterStatus))}>
                  Status: {invoiceFilterStatus} ✕
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

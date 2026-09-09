import { useDispatch, useSelector } from 'react-redux';
import { INVOICE_DATA } from '../../data/invoices';
import { CHANNEL_STAGES, CHANNEL_LABEL } from '../../data/constants';
import { combinedStatusFor, currentHandlerFor, stageProgress, panFor, activityLogRows } from '../../utils/businessLogic';
import { setSupplierHomeTab, openModal } from '../../features/ui/uiSlice';
import InvoiceTable from '../../components/invoices/InvoiceTable.jsx';

export default function SupplierHomePage() {
  const dispatch = useDispatch();
  const { supplierLoginVcode: code, supplierQuery: supplier, supplierPAN } = useSelector((s) => s.auth);
  const activeTab = useSelector((s) => s.ui.supplierHomeTab) || 'current';

  const codeInvoices = INVOICE_DATA.filter((i) => i.vcode === code);
  const inProgress = codeInvoices.filter((i) => !['Paid', 'Short-Paid', 'Failed'].includes(i.status));
  const byLabel = {};
  codeInvoices.forEach((inv) => { const l = combinedStatusFor(inv).label; byLabel[l] = (byLabel[l] || 0) + 1; });
  const pan = supplierPAN || panFor(supplier);

  return (
    <>
      <div className="card" style={{ background: 'var(--ink)', borderColor: 'var(--ink)', marginBottom: 20 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#B7B9BD', fontWeight: 700 }}>Vendor Code Login</div>
        <h1 style={{ margin: '6px 0 4px', fontSize: 21, color: '#fff', fontFamily: 'monospace' }}>{code}</h1>
        <div style={{ fontSize: 12.5, color: '#B7B9BD' }}>{supplier} : PAN {pan}. This login shows only {code}'s own purchase orders and invoices; other codes under this PAN log in separately.</div>
      </div>

      <div className="row" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="lbl">Total Invoices</div><div className="val">{codeInvoices.length}</div></div>
        <div className="stat-card"><div className="lbl">Fully Paid</div><div className="val">{byLabel['Fully Paid'] || 0}</div></div>
        <div className="stat-card warn"><div className="lbl">Partially Paid</div><div className="val">{byLabel['Partially Paid'] || 0}</div></div>
        <div className="stat-card"><div className="lbl">In Approval</div><div className="val">{byLabel['In Approval'] || 0}</div></div>
      </div>

      <div className="sheet-carousel" style={{ marginBottom: 14 }}>
        <div className="car-track">
          <button type="button" className={`car-chip${activeTab === 'current' ? ' active' : ''}`} onClick={() => dispatch(setSupplierHomeTab('current'))}>Current Invoice{inProgress.length ? ` (${inProgress.length})` : ''}</button>
          <button type="button" className={`car-chip${activeTab === 'all' ? ' active' : ''}`} onClick={() => dispatch(setSupplierHomeTab('all'))}>All Invoices ({codeInvoices.length})</button>
        </div>
      </div>

      {activeTab === 'current' ? (
        inProgress.length ? inProgress.map((inv) => <CurrentInvoiceCard key={inv.no} inv={inv} />) : (
          <div className="card"><p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>Nothing currently in progress on {code} right now. Everything is either fully closed out or hasn't started yet, check the All Invoices tab.</p></div>
        )
      ) : (
        <div className="card"><InvoiceTable invoices={codeInvoices} tableKey="supplierAllInvoices" mode="supplierSafe" /></div>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <h3>Activity Log : {code}</h3>
        {activityLogRows(codeInvoices).length ? activityLogRows(codeInvoices).map(({ inv, stage, owner }) => (
          <div className="validation-row" key={inv.no}>
            <span>{inv.date} · {inv.no} · PO {inv.po}</span>
            <span style={{ textAlign: 'right' }}>{stage}<br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>with {owner.name}</span></span>
          </div>
        )) : <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: '6px 0' }}>No activity yet.</p>}
      </div>
    </>
  );
}

function CurrentInvoiceCard({ inv }) {
  const dispatch = useDispatch();
  const stages = CHANNEL_STAGES[inv.channel];
  const done = stageProgress(inv.channel, inv.status);
  const cs = combinedStatusFor(inv);
  const contact = currentHandlerFor(inv);

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <div>
          <button type="button" className="link-hero" style={{ fontSize: 15 }} onClick={() => dispatch(openModal({ kind: 'supplierInvoiceDetail', ctx: { no: inv.no } }))}>{inv.no}</button>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{CHANNEL_LABEL[inv.channel]} : PO {inv.po} : {inv.amount}</div>
        </div>
        <span className={`chip ${cs.tone}`}>{cs.label}</span>
      </div>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Stage in {CHANNEL_LABEL[inv.channel]}</label>
      <div style={{ display: 'flex', alignItems: 'flex-start', margin: '10px 0 4px', overflowX: 'auto' }}>
        {stages.map((s, i) => {
          const idx = i + 1;
          const st = idx < done ? 'done' : idx === done ? 'current' : 'todo';
          const dotBg = st === 'done' ? 'var(--green)' : st === 'current' ? 'var(--blue)' : '#E2E8F0';
          const dotFg = st === 'todo' ? 'var(--text-muted)' : '#fff';
          return (
            <div key={i} style={{ flex: 1, minWidth: 88, textAlign: 'center', position: 'relative' }}>
              {i > 0 && <div style={{ position: 'absolute', top: 11, left: '-50%', width: '100%', height: 2, background: idx <= done ? 'var(--blue)' : '#E2E8F0', zIndex: 0 }} />}
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: dotBg, color: dotFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>{st === 'done' ? '✓' : idx}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.3 }}>{s}</div>
            </div>
          );
        })}
      </div>
      <div className="validation-row" style={{ marginTop: 10 }}><span>UTR No.</span><span>{inv.utr === '-' ? <span style={{ color: '#CBD5E1' }}>Not yet visible</span> : inv.utr}</span></div>
      {inv.shortPayReason && <div className="validation-row"><span>Reason for Less Paid</span><span style={{ textAlign: 'right', maxWidth: 280 }}>{inv.shortPayReason}</span></div>}
      <div className="validation-row"><span>Contact for This Invoice</span><span style={{ textAlign: 'right' }}>{contact.name}{contact.name !== 'MDE Invoice Team' ? ` (${contact.role})` : ''}<br /><span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{contact.email}</span></span></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" className="btn" onClick={() => dispatch(openModal({ kind: 'raiseTicket', ctx: { no: inv.no } }))}>✉ Raise a Query</button>
        <button type="button" className="btn" onClick={() => dispatch(openModal({ kind: 'supplierInvoiceDetail', ctx: { no: inv.no } }))}>View Full Detail</button>
      </div>
    </div>
  );
}

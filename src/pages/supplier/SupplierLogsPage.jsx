import { useDispatch, useSelector } from 'react-redux';
import { runtime } from '../../data/runtime';
import { CHANNEL_LABEL } from '../../data/constants';
import { activityLogRows } from '../../utils/businessLogic';
import { openModal } from '../../features/ui/uiSlice';

export default function SupplierLogsPage() {
  const dispatch = useDispatch();
  const code = useSelector((s) => s.auth.supplierLoginVcode);
  const invoices = runtime.invoices.filter((i) => i.vcode === code);
  const done = invoices.filter((i) => i.status === 'Paid' || i.status === 'Short-Paid');
  const activityRows = activityLogRows(invoices);

  return (
    <>
      <h1 className="page-title">Logs : {code}</h1>
      <p className="page-sub">Review every invoice activity and closed payment record for this vendor code.</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Activity Log</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Date</th><th>Invoice No</th><th>PO No</th><th>Stage</th><th>Owner</th></tr>
            </thead>
            <tbody>
              {activityRows.length ? activityRows.map(({ inv, stage, owner }) => (
                <tr key={`${inv.no}-${stage}`}>
                  <td>{inv.date}</td>
                  <td><button type="button" className="link-hero" onClick={() => dispatch(openModal({ kind: 'supplierInvoiceDetail', ctx: { no: inv.no } }))}>{inv.no}</button></td>
                  <td>{inv.po}</td>
                  <td>{stage}</td>
                  <td>{owner.name}<br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{owner.email}</span></td>
                </tr>
              )) : <tr><td colSpan={5} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No activity yet on {code}.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Closed Invoices</h3>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Invoice No</th><th>Portal</th><th>PO No</th><th>Amount</th><th>Status</th><th>UTR No</th><th>Date</th></tr></thead>
            <tbody>
              {done.length ? done.map((inv) => (
                <tr key={inv.no}>
                  <td><button type="button" className="link-hero" onClick={() => dispatch(openModal({ kind: 'supplierInvoiceDetail', ctx: { no: inv.no } }))}>{inv.no}</button></td>
                  <td>{CHANNEL_LABEL[inv.channel]}</td><td>{inv.po}</td><td>{inv.amount}</td>
                  <td><span className={`chip ${inv.status === 'Paid' ? 'green' : 'amber'}`}>{inv.status}</span></td>
                  <td>{inv.utr === '-' ? <span style={{ color: '#CBD5E1' }}>Not yet visible</span> : inv.utr}</td>
                  <td>{inv.date}</td>
                </tr>
              )) : <tr><td colSpan={7} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nothing closed out yet on {code}.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

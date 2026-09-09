import { useSelector } from 'react-redux';
import { INVOICE_DATA } from '../../data/invoices';
import { CHANNEL_LABEL } from '../../data/constants';
import { useDispatch } from 'react-redux';
import { openModal } from '../../features/ui/uiSlice';

export default function SupplierLogsPage() {
  const dispatch = useDispatch();
  const code = useSelector((s) => s.auth.supplierLoginVcode);
  const done = INVOICE_DATA.filter((i) => i.vcode === code && (i.status === 'Paid' || i.status === 'Short-Paid'));

  return (
    <>
      <h1 className="page-title">Logs : {code}</h1>
      <p className="page-sub">Invoices that are fully closed out on {code}, portal, amount and UTR at a glance. Anything still in progress is on My Invoices.</p>
      <div className="card">
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

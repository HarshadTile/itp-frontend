import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectScopedInvoices } from '../features/invoices/selectors';
import InvoiceTable from '../components/invoices/InvoiceTable.jsx';

export default function SearchInvoicePage() {
  const invoices = useSelector(selectScopedInvoices);
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const results = !query ? [] : invoices.filter((inv) =>
    inv.no.toLowerCase().includes(query) ||
    inv.vcode.toLowerCase().includes(query) ||
    inv.vendor.toLowerCase().includes(query) ||
    inv.po.toLowerCase().includes(query),
  );

  return (
    <>
      <h1 className="page-title">Search Invoice(s)</h1>
      <p className="page-sub">Search by invoice number, vendor code, vendor name, or PO number across every channel you have access to.</p>
      <div className="card" style={{ marginBottom: 20 }}>
        <input
          className="search-box"
          style={{ width: '100%', padding: '12px 14px', fontSize: 14 }}
          placeholder="Type an invoice no, vendor code, vendor name, or PO no..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>
      {query && (
        <div className="card">
          <h3>{results.length} result{results.length === 1 ? '' : 's'} for "{q}"</h3>
          <InvoiceTable invoices={results} tableKey="searchInvoice" mode="full" />
        </div>
      )}
    </>
  );
}

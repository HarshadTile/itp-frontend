import { useDispatch, useSelector } from 'react-redux';
import { CHANNEL_LABEL, STATUS_CHIP } from '../../data/constants';
import { currentHandlerFor, currentStageName } from '../../utils/businessLogic';
import { setSearch, setTablePage, toggleSelectRow, setSelectAll, clearSelection, openModal, pushToast } from '../../features/ui/uiSlice';
import Badge from '../common/Badge.jsx';
import PagerFoot from '../common/PagerFoot.jsx';
import { Mail, Flag, Eye, Download, Inbox } from '../common/icons.jsx';

const PAGE_SIZE = 10;
const EMPTY_SELECTION = Object.freeze([]);

/**
 * mode: 'full' (internal, opens Invoice Detail modal), 'simple' (opens Stage Simple modal),
 * 'supplierSafe' (opens the supplier-facing Invoice Detail modal)
 */
export default function InvoiceTable({ invoices, tableKey, mode = 'full', bulk = false }) {
  const dispatch = useDispatch();
  const search = useSelector((s) => s.ui.search[tableKey] || '');
  const page = useSelector((s) => s.ui.tablePage[tableKey] || 1);
  const selected = useSelector((s) => s.ui.tableSelected[tableKey] || EMPTY_SELECTION);

  const q = search.toLowerCase();
  const filtered = q
    ? invoices.filter((inv) => [inv.no, inv.vcode, inv.vendor, CHANNEL_LABEL[inv.channel], inv.po, inv.status, inv.utr].join(' ').toLowerCase().includes(q))
    : invoices;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageAllSelected = pageRows.length > 0 && pageRows.every((inv) => selected.includes(inv.no));

  const action = mode === 'simple' ? 'stageSimple' : mode === 'supplierSafe' ? 'supplierInvoiceDetail' : 'invoiceDetail';
  const title = mode === 'simple' ? 'Click to see current stage' : mode === 'supplierSafe' ? 'Click for the supplier-facing status view' : 'Click for full stage-by-stage status';

  function openInvoice(no) {
    dispatch(openModal({ kind: action, ctx: { no } }));
  }
  function openVendorCode(code) {
    dispatch(openModal({ kind: 'vendorCodePreview', ctx: { code } }));
  }
  function openNotify(no) {
    dispatch(openModal({ kind: 'notifyPreview', ctx: { no } }));
  }
  function openRaiseTicket(no) {
    dispatch(openModal({ kind: 'raiseTicket', ctx: { no } }));
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="search-box"
            style={{ width: 280 }}
            placeholder="Search invoice no, vendor, PO..."
            value={search}
            onChange={(e) => dispatch(setSearch({ key: tableKey, value: e.target.value }))}
          />
          {selected.length > 0 && <span className="chip blue" style={{ marginLeft: 10 }}>{selected.length} selected</span>}
        </div>
        <div className="toolbar-right">
          {bulk && selected.length > 0 ? (
            <>
              <button type="button" className="btn" onClick={() => { dispatch(pushToast(`Status email sent for ${selected.length} invoice${selected.length === 1 ? '' : 's'}.`)); dispatch(clearSelection(tableKey)); }}><Mail />Notify Selected</button>
              <button type="button" className="btn" onClick={() => dispatch(pushToast(`Exporting ${selected.length} invoice${selected.length === 1 ? '' : 's'} to Excel...`))}><Download />Export Selected</button>
            </>
          ) : (
            <button type="button" className="btn" onClick={() => dispatch(pushToast('Exporting all invoices to Excel...'))}><Download />Export All</button>
          )}
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {bulk && (
                <th style={{ width: 30 }}>
                  <input
                    type="checkbox"
                    checked={pageAllSelected}
                    onChange={(e) => dispatch(setSelectAll({ key: tableKey, nos: pageRows.map((i) => i.no), checked: e.target.checked }))}
                  />
                </th>
              )}
              <th>Invoice No</th><th>Vendor Code</th><th>Vendor</th><th>Channel</th><th>PO No</th><th>Amount</th>
              <th>Status</th><th>Current Stage</th><th>Handled By</th><th>UTR No</th><th>Date</th><th>Notify</th><th>Raise Query</th><th></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={bulk ? 15 : 14}>
                <div className="empty-state">
                  <Inbox />
                  <b>No invoices found</b>
                  <span>Try changing your search or filters.</span>
                </div>
              </td></tr>
            )}
            {pageRows.map((inv) => {
              const owner = currentHandlerFor(inv);
              return (
                <tr key={inv.no}>
                  {bulk && (
                    <td>
                      <input type="checkbox" checked={selected.includes(inv.no)} onChange={() => dispatch(toggleSelectRow({ key: tableKey, no: inv.no }))} />
                    </td>
                  )}
                  <td><button type="button" className="link-hero" title={title} onClick={() => openInvoice(inv.no)}>{inv.no}</button></td>
                  <td><button type="button" className="vcode-chip link-hero" title={`Preview ${inv.vcode}`} onClick={() => openVendorCode(inv.vcode)}>{inv.vcode}</button></td>
                  <td>{inv.vendor}</td>
                  <td>{CHANNEL_LABEL[inv.channel]}</td>
                  <td>{inv.po}</td>
                  <td className="mono">{inv.amount}</td>
                  <td><Badge tone={STATUS_CHIP[inv.status] || 'gray'}>{inv.status}</Badge></td>
                  <td><span className="chip gray" style={{ whiteSpace: 'normal' }}>{currentStageName(inv)}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {owner.name}
                    {owner.role && owner.name !== 'MDE Invoice Team' && <><br /><span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{owner.role}</span></>}
                  </td>
                  <td>{inv.utr === '-' ? <span style={{ color: '#CBD5E1' }}>Not yet visible</span> : inv.utr}</td>
                  <td>{inv.date}</td>
                  <td><button type="button" className="kebab" title="Notify Supplier: preview To / CC" aria-label="Notify supplier" onClick={() => openNotify(inv.no)}><Mail /></button></td>
                  <td><button type="button" className="kebab" title="Raise a query on this invoice" aria-label="Raise a query on this invoice" onClick={() => openRaiseTicket(inv.no)}><Flag /></button></td>
                  <td><button type="button" className="kebab" title={title} aria-label="View invoice" onClick={() => openInvoice(inv.no)}><Eye /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PagerFoot total={filtered.length} page={currentPage} pageSize={PAGE_SIZE} onPage={(p) => dispatch(setTablePage({ key: tableKey, page: p }))} />
    </div>
  );
}

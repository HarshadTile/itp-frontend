import { useDispatch, useSelector } from 'react-redux';
import { setSearch, setTablePage, openModal } from '../../features/ui/uiSlice';
import { deleteRow } from '../../features/tables/tablesSlice';
import { pushToast } from '../../features/ui/uiSlice';
import PagerFoot from '../common/PagerFoot.jsx';
import Badge from './Badge.jsx';

const PAGE_SIZE = 20;

function renderCell(v) {
  if (v === '-') return <span style={{ color: '#CBD5E1' }}>-</span>;
  if (['Yes', 'Active', 'Success', 'Paid', 'Approved'].includes(v)) return <Badge tone="green">{v}</Badge>;
  if (['No', 'Inactive', 'Failed', 'Rejected'].includes(v)) return <Badge tone="red">{v}</Badge>;
  if (['Pending', 'Pending Approval'].includes(v)) return <Badge tone="amber">{v}</Badge>;
  return v;
}

/**
 * A generic, permission-aware CRUD table over an array-of-arrays row store (tablesSlice).
 * Mirrors the reference app's renderTableBlock: search, pagination, add/edit/delete,
 * optional import/export, optional statusCol (invoice/vendor-code quick links + notify).
 */
export default function EditableTable({
  tableKey, cols, rows, canEdit = true, canImportExport = true,
  allowAdd = true, addLabel = '+ Add Row', statusCol = false, originTag = null,
  onViewInvoice, onViewVendorCode, onNotify,
}) {
  const dispatch = useDispatch();
  const search = useSelector((s) => s.ui.search[tableKey] || '');
  const page = useSelector((s) => s.ui.tablePage[tableKey] || 1);

  const q = search.toLowerCase();
  const filtered = rows.filter((r) => !q || r.some((c) => String(c).toLowerCase().includes(q)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const vcodeIdx = statusCol ? cols.indexOf('Vendor Code') : -1;

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <input className="search-box" style={{ width: 260 }} placeholder="Search this table..." value={search} onChange={(e) => dispatch(setSearch({ key: tableKey, value: e.target.value }))} />
        </div>
        <div className="toolbar-right">
          {canImportExport && (
            <>
              <button type="button" className="btn" disabled={!canEdit} title={!canEdit ? 'Not permitted for your role' : undefined} onClick={() => dispatch(openModal({ kind: 'import', ctx: { tableKey } }))}>⬆ Import</button>
              <button type="button" className="btn" onClick={() => dispatch(openModal({ kind: 'export', ctx: { tableKey, cols, rows, label: tableKey } }))}>⬇ Export</button>
            </>
          )}
          {allowAdd && (
            <button type="button" className="btn primary" disabled={!canEdit} title={!canEdit ? 'Not permitted for your role' : undefined} onClick={() => dispatch(openModal({ kind: 'row', ctx: { tableKey, cols, rows, idx: null } }))}>{addLabel}</button>
          )}
        </div>
      </div>
      {originTag && (
        <div style={{ marginBottom: 10 }}>
          <span className={`pill-origin ${originTag === 'Shared Master' ? 'pill-shared' : 'pill-specific'}`}>{originTag}</span>
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {cols.map((c) => <th key={c}>{c}</th>)}
              {statusCol && <th>Notify</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={cols.length + 1 + (statusCol ? 1 : 0)} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No rows match your search.</td></tr>
            )}
            {pageRows.map((r) => {
              const rowIdx = rows.indexOf(r);
              return (
                <tr key={rowIdx}>
                  {r.map((c, ci) => {
                    if (statusCol && ci === 0) return <td key={ci}><button type="button" className="link-hero" title="Click for full stage-by-stage status" onClick={() => onViewInvoice && onViewInvoice(r[0])}>{c}</button></td>;
                    if (statusCol && ci === vcodeIdx) return <td key={ci}><button type="button" className="link-hero" title={`Preview ${c}`} onClick={() => onViewVendorCode && onViewVendorCode(c)}>{c}</button></td>;
                    return <td key={ci}>{renderCell(c)}</td>;
                  })}
                  {statusCol && <td><button type="button" className="kebab" title="Notify Supplier: preview To / CC" onClick={() => onNotify && onNotify(r[0])}>✉</button></td>}
                  <td>
                    <button type="button" className="kebab" disabled={!canEdit} title="Edit" onClick={() => dispatch(openModal({ kind: 'row', ctx: { tableKey, cols, rows, idx: rowIdx } }))}>✎</button>
                    <button
                      type="button"
                      className="kebab"
                      disabled={!canEdit}
                      title="Delete"
                      onClick={() => {
                        if (window.confirm('Delete this row?')) {
                          dispatch(deleteRow({ key: tableKey, idx: rowIdx }));
                          dispatch(pushToast('Row deleted.'));
                        }
                      }}
                    >🗑</button>
                  </td>
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

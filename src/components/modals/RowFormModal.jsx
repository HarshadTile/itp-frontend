import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addRow, updateRow } from '../../features/tables/tablesSlice';
import { closeModal, pushToast } from '../../features/ui/uiSlice';
import ModalShell from './ModalShell.jsx';

export default function RowFormModal({ ctx }) {
  const dispatch = useDispatch();
  const { tableKey, cols, rows, idx } = ctx;
  const editing = idx != null;
  const [values, setValues] = useState(editing ? [...rows[idx]] : cols.map(() => ''));

  function setVal(i, v) {
    setValues((prev) => { const next = [...prev]; next[i] = v; return next; });
  }
  function save() {
    if (editing) dispatch(updateRow({ key: tableKey, idx, row: values }));
    else dispatch(addRow({ key: tableKey, row: values }));
    dispatch(closeModal());
    dispatch(pushToast('Row saved.'));
  }

  return (
    <ModalShell
      title={`${editing ? 'Edit' : 'Add'} ${tableKey.replace(/-/g, ' ')} Entry`}
      foot={(
        <>
          <button type="button" className="btn" onClick={() => dispatch(closeModal())}>Cancel</button>
          <button type="button" className="btn primary" onClick={save}>Save Changes</button>
        </>
      )}
    >
      {cols.map((c, i) => (
        <div className="form-field" key={c}>
          <label>{c}</label>
          <input value={values[i] ?? ''} onChange={(e) => setVal(i, e.target.value)} />
        </div>
      ))}
    </ModalShell>
  );
}

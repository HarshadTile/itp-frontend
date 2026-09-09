import { createSlice } from '@reduxjs/toolkit';

const SEED = {
  'settings-users': [
    ['Ravi Kulkarni', 'r.kulkarni@company.com', 'MDE Invoice Lead', 'Procurement', 'Admin', 'Active'],
    ['Priya Deshmukh', 'p.deshmukh@company.com', 'Invoice Processor', 'Procurement', 'MDE Invoice Team', 'Active'],
    ['Ajay Menon', 'a.menon@company.com', 'Category Approver', 'Sourcing', 'Approver', 'Active'],
    ['Neha Kulkarni', 'n.kulkarni@company.com', 'Accounts Executive', 'Finance', 'Accounts', 'Active'],
  ],
  'settings-notifications': [
    ['Invoice Uploaded', 'Internal, MDE Invoice Team', '-', 'On'],
    ['Approval Pending > 3 days', 'Internal, Approver', 'MDE Invoice Team', 'On'],
    ['Payment Due Today', 'Internal, Accounts', 'COE', 'On'],
    ['Payment Completed', 'Supplier', 'MDE Invoice Team', 'On'],
  ],
  'settings-audit': [
    ['2026-08-06 07:10', 'r.kulkarni@company.com', 'Login', 'SSO sign-in'],
    ['2026-08-05 18:02', 'MDE Invoice Team', 'Vendor Master Edit', 'Added vendor code TCLB15'],
  ],
};

const tablesSlice = createSlice({
  name: 'tables',
  initialState: { byKey: {} },
  reducers: {
    ensureSeeded(state, action) {
      const key = action.payload;
      if (!state.byKey[key] && SEED[key]) state.byKey[key] = SEED[key].map((r) => [...r]);
    },
    setRows(state, action) {
      const { key, rows } = action.payload;
      state.byKey[key] = rows;
    },
    addRow(state, action) {
      const { key, row } = action.payload;
      if (!state.byKey[key]) state.byKey[key] = [];
      state.byKey[key].push(row);
    },
    updateRow(state, action) {
      const { key, idx, row } = action.payload;
      if (state.byKey[key]) state.byKey[key][idx] = row;
    },
    deleteRow(state, action) {
      const { key, idx } = action.payload;
      if (state.byKey[key]) state.byKey[key].splice(idx, 1);
    },
    toggleNotifRule(state, action) {
      const idx = action.payload;
      const rows = state.byKey['settings-notifications'];
      if (rows && rows[idx]) rows[idx][3] = rows[idx][3] === 'On' ? 'Off' : 'On';
    },
  },
});

export const { ensureSeeded, setRows, addRow, updateRow, deleteRow, toggleNotifRule } = tablesSlice.actions;
export default tablesSlice.reducer;

const EMPTY_ROWS = Object.freeze([]);
export const selectTable = (state, key) => state.tables.byKey[key] || EMPTY_ROWS;

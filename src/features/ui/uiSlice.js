import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
  expandedNav: ['channels'],
  modal: null, // { kind, ctx }
  toasts: [], // { id, msg }
  search: {}, // tableKey -> string
  tablePage: {}, // tableKey -> number
  tableSelected: {}, // tableKey -> string[] (invoice numbers)
  invoiceFilterChannel: null,
  invoiceFilterStatus: null,
  invoicesTopTab: 'All Invoices',
  ticketFilterStatus: null,
  channelViewTab: {}, // channelKey -> view name
  vcodeViewTab: {}, // code -> view name
  inquiryViewMode: 'list',
  inquiryChannelTab: null,
  channelQueryViewMode: 'list',
  supplierHomeTab: 'current',
  supplierVisibilityQuery: 'Tata Communications Ltd',
  ticketDetailTab: {}, // ticketId -> tab name
  globalLogsChannel: null,
  globalLogsStatus: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleNavExpanded(state, action) {
      const id = action.payload;
      const i = state.expandedNav.indexOf(id);
      if (i >= 0) state.expandedNav.splice(i, 1); else state.expandedNav.push(id);
    },
    ensureNavExpanded(state, action) {
      if (!state.expandedNav.includes(action.payload)) state.expandedNav.push(action.payload);
    },
    openModal(state, action) {
      state.modal = action.payload; // { kind, ctx }
    },
    closeModal(state) {
      state.modal = null;
    },
    pushToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare(msg) {
        return { payload: { id: nanoid(), msg } };
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setSearch(state, action) {
      const { key, value } = action.payload;
      state.search[key] = value;
    },
    setTablePage(state, action) {
      const { key, page } = action.payload;
      state.tablePage[key] = page;
    },
    toggleSelectRow(state, action) {
      const { key, no } = action.payload;
      const sel = state.tableSelected[key] || (state.tableSelected[key] = []);
      const i = sel.indexOf(no);
      if (i >= 0) sel.splice(i, 1); else sel.push(no);
    },
    setSelectAll(state, action) {
      const { key, nos, checked } = action.payload;
      state.tableSelected[key] = checked ? [...new Set(nos)] : [];
    },
    clearSelection(state, action) {
      state.tableSelected[action.payload] = [];
    },
    setInvoiceFilterChannel(state, action) {
      state.invoiceFilterChannel = action.payload || null;
    },
    setInvoiceFilterStatus(state, action) {
      state.invoiceFilterStatus = state.invoiceFilterStatus === action.payload ? null : action.payload;
    },
    setInvoicesTopTab(state, action) {
      state.invoicesTopTab = action.payload;
    },
    setTicketFilterStatus(state, action) {
      state.ticketFilterStatus = state.ticketFilterStatus === action.payload ? null : action.payload;
    },
    setChannelViewTab(state, action) {
      const { key, view } = action.payload;
      state.channelViewTab[key] = view;
    },
    setVcodeViewTab(state, action) {
      const { code, view } = action.payload;
      state.vcodeViewTab[code] = view;
    },
    setInquiryViewMode(state, action) {
      state.inquiryViewMode = action.payload;
    },
    setInquiryChannelTab(state, action) {
      state.inquiryChannelTab = action.payload;
    },
    setChannelQueryViewMode(state, action) {
      state.channelQueryViewMode = action.payload;
    },
    setSupplierHomeTab(state, action) {
      state.supplierHomeTab = action.payload;
    },
    setSupplierVisibilityQuery(state, action) {
      state.supplierVisibilityQuery = action.payload;
    },
    setTicketDetailTab(state, action) {
      const { id, tab } = action.payload;
      state.ticketDetailTab[id] = tab;
    },
    setGlobalLogsChannel(state, action) {
      state.globalLogsChannel = action.payload || null;
    },
    setGlobalLogsStatus(state, action) {
      state.globalLogsStatus = action.payload || null;
    },
    resetFiltersOnIdentitySwitch(state) {
      state.search = {};
      state.invoiceFilterChannel = null;
      state.invoiceFilterStatus = null;
    },
  },
});

export const {
  toggleNavExpanded, ensureNavExpanded, openModal, closeModal, pushToast, dismissToast,
  setSearch, setTablePage, toggleSelectRow, setSelectAll, clearSelection,
  setInvoiceFilterChannel, setInvoiceFilterStatus, setInvoicesTopTab, setTicketFilterStatus,
  setChannelViewTab, setVcodeViewTab, setInquiryViewMode, setInquiryChannelTab,
  setChannelQueryViewMode, setSupplierHomeTab, setSupplierVisibilityQuery, setTicketDetailTab,
  setGlobalLogsChannel, setGlobalLogsStatus, resetFiltersOnIdentitySwitch,
} = uiSlice.actions;
export default uiSlice.reducer;

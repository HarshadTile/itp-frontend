import { createSlice } from '@reduxjs/toolkit';
import { INITIAL_TICKETS } from '../../data/tickets';
import { APP_NOW, INTERNAL_TEAM_CHANNELS } from '../../data/constants';
import { INVOICE_DATA } from '../../data/invoices';
import { currentHandlerFor } from '../../utils/businessLogic';

function today() {
  return new Date(APP_NOW).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function logActivity(t, text) {
  t.activity = t.activity || [];
  t.activity.push({ date: today(), text });
}
function findInvoice(no) {
  return INVOICE_DATA.find((i) => i.no === no);
}

const initialState = {
  items: INITIAL_TICKETS,
  seq: 1005,
};

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    submitTicket(state, action) {
      const { no, category, priority, desc, raisedBy } = action.payload;
      state.seq += 1;
      const id = 'TCK-' + state.seq;
      const inv = findInvoice(no);
      const assignee = inv ? currentHandlerFor(inv).name : 'MDE Invoice Team';
      state.items.unshift({
        id, no, category, desc: desc || 'No description provided.', status: 'Open',
        priority: priority || 'Medium', assignee, raisedBy, raisedDate: today(), slaHours: 24,
        comments: [], activity: [{ date: today(), text: `Ticket created by ${raisedBy}, priority set to ${priority || 'Medium'}, assigned to ${assignee}.` }],
      });
    },
    postComment(state, action) {
      const { id, author, role, text } = action.payload;
      const t = state.items.find((x) => x.id === id);
      if (!t) return;
      t.comments = t.comments || [];
      t.comments.push({ author, role, date: today(), text });
      logActivity(t, `Comment added by ${author}${role ? ` (${role})` : ''}.`);
      if (role === 'Supplier' && t.status === 'Resolved') {
        t.status = 'In Progress';
        t.resolvedDate = null;
        logActivity(t, 'Reopened to In Progress after a supplier reply.');
      } else if (role !== 'Supplier' && t.status === 'Open') {
        t.status = 'In Progress';
        logActivity(t, 'Status changed to In Progress.');
      }
    },
    setStatus(state, action) {
      const { id, status } = action.payload;
      const t = state.items.find((x) => x.id === id);
      if (!t || t.status === status) return;
      t.status = status;
      if (status === 'Resolved') t.resolvedDate = today();
      logActivity(t, `Status changed to ${status}.`);
    },
    moveStatus(state, action) {
      // same as setStatus, distinct name for the Kanban drag path (audit text differs slightly)
      const { id, status } = action.payload;
      const t = state.items.find((x) => x.id === id);
      if (!t || t.status === status) return;
      t.status = status;
      if (status === 'Resolved') t.resolvedDate = today();
      logActivity(t, `Status changed to ${status} (moved on board).`);
    },
    setPriority(state, action) {
      const { id, priority } = action.payload;
      const t = state.items.find((x) => x.id === id);
      if (!t) return;
      const old = t.priority;
      t.priority = priority;
      logActivity(t, `Priority changed from ${old} to ${priority}.`);
    },
    setAssignee(state, action) {
      const { id, assignee } = action.payload;
      const t = state.items.find((x) => x.id === id);
      if (!t) return;
      const old = t.assignee;
      t.assignee = assignee;
      logActivity(t, `Reassigned from ${old} to ${assignee}.`);
    },
  },
});

export const { submitTicket, postComment, setStatus, moveStatus, setPriority, setAssignee } = ticketsSlice.actions;
export default ticketsSlice.reducer;

/* ---- selectors ---- */
export const selectAllTickets = (state) => state.tickets.items;
export const selectTicketsForScope = (state) => {
  const { authType, channelScope } = state.auth;
  let list = state.tickets.items;
  if (authType === 'internal' && channelScope === 'internalTeam') {
    list = list.filter((t) => { const inv = findInvoice(t.no); return inv && INTERNAL_TEAM_CHANNELS.includes(inv.channel); });
  }
  return list;
};
export const selectTicketsForSupplier = (state, supplier) => state.tickets.items.filter((t) => { const inv = findInvoice(t.no); return inv && inv.vendor === supplier; });
export const selectTicketsForVendorCode = (state, code) => state.tickets.items.filter((t) => { const inv = findInvoice(t.no); return inv && inv.vcode === code; });
export const selectTicketsForChannel = (state, key) => state.tickets.items.filter((t) => { const inv = findInvoice(t.no); return inv && inv.channel === key; });

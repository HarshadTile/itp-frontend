import { createSelector } from '@reduxjs/toolkit';
import { INVOICE_DATA } from '../../data/invoices';
import { INTERNAL_TEAM_CHANNELS } from '../../data/constants';

/** Every invoice a login is allowed to see, given the current auth scope.
 * Memoized so the same channelScope always returns the same array reference. */
export const selectScopedInvoices = createSelector(
  [(state) => state.auth.authType, (state) => state.auth.channelScope],
  (authType, channelScope) => {
    if (authType === 'supplier') return INVOICE_DATA; // supplier-side pages filter by vcode themselves
    if (channelScope === 'internalTeam') return INVOICE_DATA.filter((i) => INTERNAL_TEAM_CHANNELS.includes(i.channel));
    return INVOICE_DATA;
  },
);

export function selectInternalScopeLabel(state) {
  return state.auth.channelScope === 'internalTeam' ? 'Internal Team' : '';
}

export const selectFilteredInvoices = createSelector(
  [selectScopedInvoices, (state) => state.ui.invoiceFilterChannel, (state) => state.ui.invoiceFilterStatus],
  (list, invoiceFilterChannel, invoiceFilterStatus) => {
    if (invoiceFilterChannel) list = list.filter((i) => i.channel === invoiceFilterChannel);
    if (invoiceFilterStatus) list = list.filter((i) => i.status === invoiceFilterStatus);
    return list;
  },
);

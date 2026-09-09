import { createSelector } from '@reduxjs/toolkit';
import { runtime } from '../../data/runtime';
import { INTERNAL_TEAM_CHANNELS } from '../../data/constants';

/** Every invoice a login is allowed to see, given the current auth scope.
 * Memoized so the same channelScope always returns the same array reference. */
export const selectScopedInvoices = createSelector(
  [(state) => state.auth.authType, (state) => state.auth.channelScope],
  (authType, channelScope) => {
    if (authType === 'supplier') return runtime.invoices; // supplier-side pages filter by vcode themselves
    if (channelScope === 'internalTeam') return runtime.invoices.filter((i) => INTERNAL_TEAM_CHANNELS.includes(i.channel));
    return runtime.invoices;
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

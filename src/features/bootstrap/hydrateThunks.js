import { api } from '../../api/client';
import { setAuthFromServer, logout as logoutLocal } from '../auth/authSlice';
import { hydrateTickets } from '../tickets/ticketsSlice';
import { hydrateTables } from '../tables/tablesSlice';
import { hydrateSettings } from '../settings/settingsSlice';
import { setRuntimeData } from '../../data/runtime';
import { bumpData } from '../ui/uiSlice';

/** Pull the whole dataset from the API and push it into the store + runtime. */
export const loadBootstrap = () => async (dispatch) => {
  const b = await api.get('/workspace');
  setRuntimeData({ invoices: b.invoices, syncLog: b.syncLog });
  dispatch(bumpData()); // memoised invoice selectors must re-read the new data
  dispatch(hydrateTickets({ items: b.tickets, seq: b.ticketSeq }));
  dispatch(hydrateTables(b.tables));
  dispatch(hydrateSettings(b.settings));
  return b;
};

/** Sign in, store the token, hydrate. Throws on bad credentials.
 *  `opts.remember === false` keeps the session in sessionStorage only. */
export const loginThunk = (form, opts = {}) => async (dispatch) => {
  const { token, auth } = await api.post('/auth/login', form);
  api.setToken(token, { persist: opts.remember !== false });
  // Load the data BEFORE flipping to "logged in": the route guards redirect into
  // the app the moment auth flips, and pages must not render (and cache) an empty
  // dataset while the bootstrap request is still in flight.
  try {
    await dispatch(loadBootstrap());
  } catch (err) {
    api.clearToken();
    throw err;
  }
  dispatch(setAuthFromServer(auth));
};

/** On app start: if a token is present, revalidate it and hydrate. */
export const restoreSession = () => async (dispatch) => {
  if (!api.hasToken()) return false;
  try {
    const { auth } = await api.get('/auth/me');
    dispatch(setAuthFromServer(auth));
    await dispatch(loadBootstrap());
    return true;
  } catch {
    api.clearToken();
    return false;
  }
};

/** Invalidate the session server-side, then clear local auth. */
export const logoutThunk = () => async (dispatch) => {
  try {
    await api.post('/auth/logout');
  } catch {
    /* token already gone / server down — clear locally anyway */
  }
  api.clearToken();
  dispatch(logoutLocal());
};

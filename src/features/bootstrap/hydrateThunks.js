import { api } from '../../api/client';
import { setAuthFromServer, logout as logoutLocal } from '../auth/authSlice';
import { hydrateTickets } from '../tickets/ticketsSlice';
import { hydrateTables } from '../tables/tablesSlice';
import { hydrateSettings } from '../settings/settingsSlice';
import { setRuntimeData } from '../../data/runtime';

/** Pull the whole dataset from the API and push it into the store + runtime. */
export const loadBootstrap = () => async (dispatch) => {
  const b = await api.get('/bootstrap');
  setRuntimeData({ invoices: b.invoices, syncLog: b.syncLog });
  dispatch(hydrateTickets({ items: b.tickets, seq: b.ticketSeq }));
  dispatch(hydrateTables(b.tables));
  dispatch(hydrateSettings(b.settings));
  return b;
};

/** Sign in, store the token, hydrate. Throws on bad credentials. */
export const loginThunk = (form) => async (dispatch) => {
  const { token, auth } = await api.post('/login', form);
  api.setToken(token);
  dispatch(setAuthFromServer(auth));
  await dispatch(loadBootstrap());
};

/** On app start: if a token is present, revalidate it and hydrate. */
export const restoreSession = () => async (dispatch) => {
  if (!api.hasToken()) return false;
  try {
    const { auth } = await api.get('/me');
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
    await api.post('/logout');
  } catch {
    /* token already gone / server down — clear locally anyway */
  }
  api.clearToken();
  dispatch(logoutLocal());
};

import { createSlice } from '@reduxjs/toolkit';
import { panFor, vendorCodesFor, supplierForVendorCode } from '../../utils/businessLogic';

const initialState = {
  loggedIn: false,
  authType: 'internal', // 'internal' | 'supplier'
  channelScope: 'all', // 'all' (HQ/Admin) | 'internalTeam' (Msetu/SRM + PO Portal + MFOX)
  role: 'Admin', // 'Admin' | 'MDE Invoice Team'
  supplierQuery: null, // logged-in supplier's name (authType==='supplier' only)
  supplierPAN: null,
  supplierLoginVcode: null,
  currentUser: { name: 'Ravi Kulkarni', initials: 'RK', title: 'MDE Invoice Lead', dept: 'Procurement', email: 'r.kulkarni@company.com' },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginInternal(state, action) {
      const channelScope = action.payload?.channelScope === 'internalTeam' ? 'internalTeam' : 'all';
      state.loggedIn = true;
      state.authType = 'internal';
      state.channelScope = channelScope;
      state.role = channelScope === 'all' ? 'Admin' : 'MDE Invoice Team';
      state.supplierQuery = null;
      state.supplierPAN = null;
      state.supplierLoginVcode = null;
    },
    loginSupplier(state, action) {
      const { supplier, vcode } = action.payload;
      state.loggedIn = true;
      state.authType = 'supplier';
      state.supplierQuery = supplier;
      state.supplierPAN = panFor(supplier);
      state.supplierLoginVcode = vcode || vendorCodesFor(supplier)[0];
    },
    switchIdentity(state, action) {
      // payload: 'internal:all' | 'internal:internalTeam' | 'supplier:<vendorCode>'
      const [kind, val] = action.payload.split(':');
      if (kind === 'supplier') {
        const supplier = supplierForVendorCode(val);
        state.authType = 'supplier';
        state.supplierQuery = supplier;
        state.supplierPAN = panFor(supplier);
        state.supplierLoginVcode = val;
      } else {
        state.authType = 'internal';
        state.channelScope = val === 'internalTeam' ? 'internalTeam' : 'all';
        state.role = state.channelScope === 'all' ? 'Admin' : 'MDE Invoice Team';
        state.supplierQuery = null;
        state.supplierPAN = null;
        state.supplierLoginVcode = null;
      }
    },
    logout(state) {
      Object.assign(state, initialState, { loggedIn: false });
    },
    // Apply the auth object returned by POST /api/login or GET /api/me.
    setAuthFromServer(state, action) {
      Object.assign(state, action.payload, { loggedIn: true });
    },
  },
});

export const { loginInternal, loginSupplier, switchIdentity, logout, setAuthFromServer } = authSlice.actions;
export default authSlice.reducer;

/* ---- selectors ---- */
export const selectAuth = (state) => state.auth;
export const selectIsScopedInternal = (state) => state.auth.authType === 'internal' && state.auth.channelScope === 'internalTeam';
export const selectPerm = (state) => {
  const ROLE_MATRIX = state.settings.roleMatrix;
  return ROLE_MATRIX[state.auth.role] || ROLE_MATRIX.Viewer;
};

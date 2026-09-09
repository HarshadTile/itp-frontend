import { createSlice } from '@reduxjs/toolkit';
import { ROLE_MATRIX } from '../../data/constants';

const initialState = {
  roleMatrix: JSON.parse(JSON.stringify(ROLE_MATRIX)),
  integrations: [
    ['Msetu / SRM', 'Connected', '06 Aug 2026, 07:00 AM'],
    ['PO Portal', 'Connected', '06 Aug 2026, 07:02 AM'],
    ['SAP (MIRO / ML81N / FBL1N)', 'Connected', '06 Aug 2026, 07:05 AM'],
    ['MFOX Portal', 'Connection Error', '06 Aug 2026, 07:08 AM'],
  ],
  senderEmail: 'i2ptracker@company.com',
  twoFactorOn: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    togglePermission(state, action) {
      const { role, cap } = action.payload;
      state.roleMatrix[role][cap] = !state.roleMatrix[role][cap];
    },
    toggleTwoFactor(state) {
      state.twoFactorOn = !state.twoFactorOn;
    },
  },
});

export const { togglePermission, toggleTwoFactor } = settingsSlice.actions;
export default settingsSlice.reducer;

export const selectRoleMatrix = (state) => state.settings.roleMatrix;

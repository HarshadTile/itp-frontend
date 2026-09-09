import { useDispatch, useSelector } from 'react-redux';
import { panFor, vendorCodesFor, supplierEmailFor, synthPhone } from '../utils/businessLogic';
import { toggleTwoFactor } from '../features/settings/settingsSlice';
import { pushToast } from '../features/ui/uiSlice';

export default function ProfilePage() {
  const { authType, currentUser, supplierQuery, supplierLoginVcode, channelScope, role } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const twoFactorOn = useSelector((s) => s.settings.twoFactorOn);

  if (authType === 'supplier') {
    const pan = panFor(supplierQuery);
    const codes = vendorCodesFor(supplierQuery);
    return (
      <>
        <h1 className="page-title">My Profile</h1>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="card" style={{ width: 280 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="avatar" style={{ width: 80, height: 80, fontSize: 22, margin: '0 auto 10px' }}>{pan.slice(0, 2)}</div>
              <b>{supplierQuery}</b>
              <p style={{ color: 'var(--brand)', fontSize: 12.5, margin: '2px 0' }}>Vendor Code {supplierLoginVcode}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>PAN {pan}</p>
            </div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 320 }}>
            <h3>Company Information</h3>
            <div className="row">
              <div className="form-field" style={{ flex: 1 }}><label>Supplier Name</label><input value={supplierQuery} readOnly /></div>
              <div className="form-field" style={{ flex: 1 }}><label>PAN</label><input value={pan} readOnly /></div>
            </div>
            <div className="form-field"><label>Contact Email</label><input value={supplierEmailFor(supplierQuery)} readOnly /></div>
            <div className="form-field"><label>Contact Phone</label><input value={synthPhone(supplierQuery)} readOnly /></div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginTop: 14, marginBottom: 8 }}>
              All Vendor Codes Under This PAN ({codes.length})
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {codes.map((c) => <span key={c} className={`chip mono ${c === supplierLoginVcode ? '' : 'gray'}`} style={c === supplierLoginVcode ? { background: 'var(--brand-tint)', color: 'var(--brand)' } : undefined}>{c}{c === supplierLoginVcode ? ' (this login)' : ''}</span>)}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">User Profile</h1>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ width: 260 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="avatar" style={{ width: 80, height: 80, fontSize: 26, margin: '0 auto 10px' }}>{currentUser.initials}</div>
            <b>{currentUser.name}</b>
            <p style={{ color: 'var(--brand)', fontSize: 12.5, margin: '2px 0' }}>{currentUser.title}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentUser.dept} Department</p>
          </div>
          <div className="row" style={{ textAlign: 'center', marginTop: 14 }}>
            <div style={{ flex: 1 }}><b>412</b><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>INVOICES TRACKED</div></div>
            <div style={{ flex: 1 }}><b>96%</b><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SLA MET</div></div>
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 320 }}>
          <h3>Personal Information</h3>
          <div className="row">
            <div className="form-field" style={{ flex: 1 }}><label>Full Name</label><input value={currentUser.name} readOnly /></div>
            <div className="form-field" style={{ flex: 1 }}><label>Email</label><input value={currentUser.email} readOnly /></div>
          </div>
          <div className="row">
            <div className="form-field" style={{ flex: 1 }}><label>Job Title</label><input value={currentUser.title} readOnly /></div>
            <div className="form-field" style={{ flex: 1 }}><label>Role</label><input value={role} readOnly /></div>
          </div>
          <div className="form-field"><label>Access Scope</label><input value={channelScope === 'all' ? 'All Channels (HQ / Admin)' : 'Internal Team'} readOnly /></div>
          <h3 style={{ marginTop: 20 }}>Security</h3>
          <div className="validation-row">
            <span>Password: last changed 2 months ago</span>
            <button type="button" className="btn" onClick={() => dispatch(pushToast('Password change link sent to your email.'))}>Change Password</button>
          </div>
          <div className="validation-row">
            <span>Two-Factor Authentication</span>
            <button type="button" className={`toggle${twoFactorOn ? ' on' : ''}`} onClick={() => { dispatch(toggleTwoFactor()); dispatch(pushToast(!twoFactorOn ? 'Two-Factor Authentication enabled.' : 'Two-Factor Authentication disabled.')); }}><div className="dot" /></button>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginThunk } from '../features/bootstrap/hydrateThunks';
import { pushToast } from '../features/ui/uiSlice';
import { SUPPLIERS } from '../data/invoices';
import { vendorCodesFor, panFor } from '../utils/businessLogic';
import logo from '../assets/mahindra-logo.png';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tab, setTab] = useState('internal');

  // Internal team fields
  const [channelScope, setChannelScope] = useState('all');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Supplier fields
  const [company, setCompany] = useState(SUPPLIERS[0]);
  const [vcode, setVcode] = useState(vendorCodesFor(SUPPLIERS[0])[0]);
  const [phone, setPhone] = useState('');

  async function submitInternal(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await dispatch(loginThunk({ mode: 'internal', username: username.trim(), password, channelScope }));
      dispatch(pushToast('Signed in.'));
      navigate('/app/invoices');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function submitSupplier(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await dispatch(loginThunk({ mode: 'supplier', company, vcode, phone }));
      dispatch(pushToast('Signed in.'));
      navigate('/supplier/home');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  function onCompanyChange(e) {
    const val = e.target.value;
    setCompany(val);
    setVcode(vendorCodesFor(val)[0]);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <img className="logo" src={logo} alt="Mahindra" />
        <h2>Invoice to Payment Tracker</h2>
        <p className="sub">Sign in to continue</p>

        <div className="login-tabs">
          <button type="button" className={`lt${tab === 'internal' ? ' active' : ''}`} onClick={() => setTab('internal')}>Internal Team</button>
          <button type="button" className={`lt${tab === 'supplier' ? ' active' : ''}`} onClick={() => setTab('supplier')}>Supplier</button>
        </div>

        {tab === 'internal' ? (
          <form onSubmit={submitInternal}>
            <div className="form-field">
              <label>Portal / Team</label>
              <select value={channelScope} onChange={(e) => setChannelScope(e.target.value)}>
                <option value="all">All Channels (HQ / Admin)</option>
                <option value="internalTeam">Internal Team (Msetu/SRM + PO Portal + MFOX)</option>
              </select>
            </div>
            {error && <div className="login-error">{error}</div>}
            <div className="form-field">
              <label>Username</label>
              <input placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Password</label>
              <input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn primary" disabled={busy} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>{busy ? 'Signing in…' : 'Login'}</button>
            <p className="login-hint">Pick your portal first. A team logged in against one portal only ever sees that portal's own data.</p>
            <p className="login-hint">Demo login — username <b>admin</b>, password <b>admin123</b></p>
          </form>
        ) : (
          <form onSubmit={submitSupplier}>
            {error && <div className="login-error">{error}</div>}
            <div className="form-field">
              <label>Company / PAN</label>
              <select value={company} onChange={onCompanyChange}>
                {SUPPLIERS.map((s) => <option key={s} value={s}>{s} : PAN {panFor(s)}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Vendor Code</label>
              <select value={vcode} onChange={(e) => setVcode(e.target.value)}>
                {vendorCodesFor(company).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Phone Number</label>
              <input type="tel" placeholder="Enter 10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <p className="login-hint" style={{ marginTop: -8 }}>OTP will be sent to this number.</p>
            <button type="submit" className="btn primary" disabled={busy} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>{busy ? 'Signing in…' : 'Login'}</button>
            <p className="login-hint">Pick your company/PAN, then the one vendor code you log in as. That code can carry several purchase orders. Your view only ever shows this code's own POs, never a sibling code's.</p>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginThunk } from '../features/bootstrap/hydrateThunks';
import { pushToast } from '../features/ui/uiSlice';
import { SUPPLIERS } from '../data/invoices';
import { vendorCodesFor, panFor } from '../utils/businessLogic';
import logo from '../assets/mahindra-logo.png';
import './login.css';

/* ---------- inline icons (decorative) ---------- */
const Ic = ({ d, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {d}
  </svg>
);
const UserIcon = (p) => <Ic {...p} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>} />;
const LockIcon = (p) => <Ic {...p} d={<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>} />;
const BuildingIcon = (p) => <Ic {...p} d={<><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M10 21v-4h4v4" /></>} />;
const HashIcon = (p) => <Ic {...p} d={<><path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" /></>} />;
const PhoneIcon = (p) => <Ic {...p} d={<path d="M6 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 6a2 2 0 0 1 2-3Z" />} />;
const CaretIcon = (p) => <Ic {...p} d={<path d="m6 9 6 6 6-6" />} />;
const EyeIcon = (p) => <Ic {...p} d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>} />;
const EyeOffIcon = (p) => <Ic {...p} d={<><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A9.5 9.5 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.5 6.5A17 17 0 0 0 2 12s4 7 10 7a9.4 9.4 0 0 0 3.5-.7" /></>} />;
const AlertIcon = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>} />;
const CheckIcon = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>} />;

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab] = useState('internal');
  const [status, setStatus] = useState('idle'); // idle | busy | success
  const [error, setError] = useState('');
  const [fieldErr, setFieldErr] = useState({});
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);

  // Internal team fields
  const [channelScope, setChannelScope] = useState('all');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Supplier fields
  const [company, setCompany] = useState(SUPPLIERS[0]);
  const [vcode, setVcode] = useState(vendorCodesFor(SUPPLIERS[0])[0]);
  const [phone, setPhone] = useState('');

  const busy = status === 'busy';
  const done = status === 'success';

  function switchTab(next) {
    setTab(next);
    setError('');
    setFieldErr({});
  }

  async function runLogin(form, dest) {
    setError('');
    setStatus('busy');
    try {
      await dispatch(loginThunk(form, { remember }));
      setStatus('success');
      dispatch(pushToast('Signed in.'));
      navigate(dest);
    } catch (err) {
      setStatus('idle');
      setError(err.message || 'Something went wrong. Please try again.');
    }
  }

  function submitInternal(e) {
    e.preventDefault();
    const fe = {};
    if (!username.trim()) fe.username = 'Username is required.';
    if (!password) fe.password = 'Password is required.';
    setFieldErr(fe);
    if (Object.keys(fe).length) return;
    runLogin({ mode: 'internal', username: username.trim(), password, channelScope }, '/app/invoices');
  }

  function submitSupplier(e) {
    e.preventDefault();
    const fe = {};
    if (!company) fe.company = 'Select your company.';
    if (!vcode) fe.vcode = 'Select a vendor code.';
    setFieldErr(fe);
    if (Object.keys(fe).length) return;
    runLogin({ mode: 'supplier', company, vcode, phone }, '/supplier/home');
  }

  function onCompanyChange(e) {
    const val = e.target.value;
    setCompany(val);
    setVcode(vendorCodesFor(val)[0]);
  }

  const forgot = () => dispatch(pushToast('Password help: contact your IT service desk (x-4400).'));

  return (
    <div className="lgn-page">
      {/* -------- Brand panel (minimal) -------- */}
      <aside className="lgn-brand">
        <div className="lgn-brand-deco" aria-hidden="true">
          <span className="lgn-brand-lines" />
        </div>
        <div className="lgn-brand-center">
          <img className="lgn-brand-logo" src={logo} alt="Mahindra" />
          <p className="lgn-brand-title">Invoice to Payment Tracker</p>
        </div>
      </aside>

      {/* -------- Auth panel -------- */}
      <main className="lgn-auth">
        <div className="lgn-card">
          <div className="lgn-auth-head">
            <h1>Welcome back</h1>
            <p>Sign in to Invoice to Payment Tracker</p>
          </div>

          <div className="lgn-seg" role="group" aria-label="Login type">
            <button type="button" aria-pressed={tab === 'internal'}
              data-active={tab === 'internal'}
              onClick={() => switchTab('internal')}>Internal Team</button>
            <button type="button" aria-pressed={tab === 'supplier'}
              data-active={tab === 'supplier'}
              onClick={() => switchTab('supplier')}>Supplier</button>
          </div>

          {error && (
            <div className="lgn-alert error" role="alert" style={{ marginBottom: 16 }}>
              <AlertIcon /><span>{error}</span>
            </div>
          )}
          {done && (
            <div className="lgn-alert success" role="status" style={{ marginBottom: 16 }}>
              <CheckIcon /><span>Signed in — taking you to your workspace…</span>
            </div>
          )}

          {tab === 'internal' ? (
            <form className="lgn-form" onSubmit={submitInternal} noValidate>
              <div className="lgn-field">
                <label htmlFor="lgn-portal">Portal / Team</label>
                <div className="lgn-input">
                  <BuildingIcon className="lgn-ic" />
                  <select id="lgn-portal" value={channelScope}
                    onChange={(e) => setChannelScope(e.target.value)}>
                    <option value="all">All Channels (HQ / Admin)</option>
                    <option value="internalTeam">Internal Team (Msetu/SRM + PO Portal + MFOX)</option>
                  </select>
                  <CaretIcon className="lgn-caret" />
                </div>
              </div>

              <div className="lgn-field">
                <label htmlFor="lgn-username">Username</label>
                <div className="lgn-input">
                  <UserIcon className="lgn-ic" />
                  <input id="lgn-username" type="text" autoComplete="username"
                    placeholder="Enter username" value={username}
                    aria-invalid={!!fieldErr.username}
                    aria-describedby={fieldErr.username ? 'lgn-username-err' : undefined}
                    onChange={(e) => setUsername(e.target.value)} />
                </div>
                {fieldErr.username && <span id="lgn-username-err" className="lgn-field-msg">{fieldErr.username}</span>}
              </div>

              <div className="lgn-field">
                <label htmlFor="lgn-password">Password</label>
                <div className="lgn-input">
                  <LockIcon className="lgn-ic" />
                  <input id="lgn-password" type={showPw ? 'text' : 'password'}
                    autoComplete="current-password" placeholder="Enter password"
                    value={password} aria-invalid={!!fieldErr.password}
                    aria-describedby={fieldErr.password ? 'lgn-password-err' : undefined}
                    onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="lgn-pw-toggle"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    aria-pressed={showPw} onClick={() => setShowPw((v) => !v)}>
                    {showPw ? <EyeOffIcon width="16" height="16" /> : <EyeIcon width="16" height="16" />}
                  </button>
                </div>
                {fieldErr.password && <span id="lgn-password-err" className="lgn-field-msg">{fieldErr.password}</span>}
              </div>

              <div className="lgn-row">
                <label className="lgn-remember">
                  <input type="checkbox" checked={remember}
                    onChange={(e) => setRemember(e.target.checked)} />
                  Remember me
                </label>
                <button type="button" className="lgn-link" onClick={forgot}>Forgot password?</button>
              </div>

              <button type="submit" className="lgn-submit" disabled={busy || done}>
                {busy && <span className="lgn-spinner" />}
                {busy ? 'Signing in…' : done ? 'Signed in' : 'Sign In'}
                {!busy && !done && <span className="lgn-arrow" aria-hidden="true">→</span>}
              </button>

              <p className="lgn-hint">
                Demo access — <b>admin</b> / <b>admin123</b>
              </p>
            </form>
          ) : (
            <form className="lgn-form" onSubmit={submitSupplier} noValidate>
              <div className="lgn-field">
                <label htmlFor="lgn-company">Company / PAN</label>
                <div className="lgn-input">
                  <BuildingIcon className="lgn-ic" />
                  <select id="lgn-company" value={company} onChange={onCompanyChange}>
                    {SUPPLIERS.map((s) => <option key={s} value={s}>{s} : PAN {panFor(s)}</option>)}
                  </select>
                  <CaretIcon className="lgn-caret" />
                </div>
              </div>

              <div className="lgn-field">
                <label htmlFor="lgn-vcode">Vendor Code</label>
                <div className="lgn-input">
                  <HashIcon className="lgn-ic" />
                  <select id="lgn-vcode" value={vcode} onChange={(e) => setVcode(e.target.value)}>
                    {vendorCodesFor(company).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <CaretIcon className="lgn-caret" />
                </div>
              </div>

              <div className="lgn-field">
                <label htmlFor="lgn-phone">Registered Mobile</label>
                <div className="lgn-input">
                  <PhoneIcon className="lgn-ic" />
                  <input id="lgn-phone" type="tel" inputMode="numeric" autoComplete="tel"
                    placeholder="Enter 10-digit mobile number" value={phone}
                    onChange={(e) => setPhone(e.target.value)} />
                </div>
                <span className="lgn-field-msg" style={{ color: 'var(--text-muted)' }}>
                  A one-time password is sent to this number.
                </span>
              </div>

              <div className="lgn-row">
                <label className="lgn-remember">
                  <input type="checkbox" checked={remember}
                    onChange={(e) => setRemember(e.target.checked)} />
                  Remember me
                </label>
                <button type="button" className="lgn-link" onClick={forgot}>Need help?</button>
              </div>

              <button type="submit" className="lgn-submit" disabled={busy || done}>
                {busy && <span className="lgn-spinner" />}
                {busy ? 'Signing in…' : done ? 'Signed in' : 'Sign In'}
                {!busy && !done && <span className="lgn-arrow" aria-hidden="true">→</span>}
              </button>

              <p className="lgn-hint">
                Your view is scoped to the selected vendor code only.
              </p>
            </form>
          )}

          <footer className="lgn-footer">
            <span>© 2026 Mahindra. All rights reserved.</span>
            <nav>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); forgot(); }}>Privacy Policy</a>
              <a href="#support" onClick={(e) => { e.preventDefault(); forgot(); }}>Help / Support</a>
            </nav>
          </footer>
        </div>
      </main>
    </div>
  );
}

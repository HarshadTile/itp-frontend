import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginThunk } from '../features/bootstrap/hydrateThunks';
import { pushToast } from '../features/ui/uiSlice';
import { supplierForVendorCode } from '../utils/businessLogic';
import logo from '../assets/mahindra-logo.png';
import './login.css';

/* ---------- inline icons (decorative) ---------- */
const Ic = ({ d, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {d}
  </svg>
);
const IdIcon = (p) => <Ic {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M13 10h5M13 14H7" /></>} />;
const LockIcon = (p) => <Ic {...p} d={<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>} />;
const BuildingIcon = (p) => <Ic {...p} d={<><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M10 21v-4h4v4" /></>} />;
const HashIcon = (p) => <Ic {...p} d={<><path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" /></>} />;
const CaretIcon = (p) => <Ic {...p} d={<path d="m6 9 6 6 6-6" />} />;
const EyeIcon = (p) => <Ic {...p} d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>} />;
const EyeOffIcon = (p) => <Ic {...p} d={<><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A9.5 9.5 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.5 6.5A17 17 0 0 0 2 12s4 7 10 7a9.4 9.4 0 0 0 3.5-.7" /></>} />;
const AlertIcon = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>} />;
const CheckIcon = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>} />;

/* abstract, non-cartoon invoice / payment workflow visual */
function WorkflowVisual() {
  return (
    <svg className="lgn-hero-visual" viewBox="0 0 520 300" fill="none" aria-hidden="true">
      <defs>
        <pattern id="lgnGrid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M26 0H0V26" stroke="rgba(255,255,255,.06)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="520" height="300" fill="url(#lgnGrid)" />

      {/* stacked documents */}
      <g stroke="rgba(255,255,255,.55)" strokeWidth="1.5">
        <rect x="46" y="70" width="150" height="180" rx="10" fill="rgba(255,255,255,.05)" />
        <rect x="64" y="52" width="150" height="180" rx="10" fill="rgba(255,255,255,.09)" />
        <path d="M84 78h110M84 100h110M84 122h72M84 150h110M84 172h88M84 194h110" strokeWidth="3" strokeLinecap="round" stroke="rgba(255,255,255,.4)" />
      </g>

      {/* routed flow */}
      <path d="M214 142h70c14 0 14 -60 28 -60h60" stroke="rgba(255,255,255,.5)" strokeWidth="2" />
      <path d="M214 142h70c14 0 14 60 28 60h60" stroke="rgba(255,255,255,.28)" strokeWidth="2" />
      {[[214, 142], [312, 82], [312, 202], [372, 82], [372, 202]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill="#fff" opacity=".85" />
      ))}

      {/* approval node */}
      <circle cx="430" cy="82" r="26" fill="rgba(255,255,255,.12)" stroke="#fff" strokeWidth="2" />
      <path d="m418 82 8 8 16-18" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* payment / UTR tag */}
      <rect x="402" y="176" width="86" height="34" rx="8" fill="rgba(255,255,255,.12)" stroke="#fff" strokeWidth="1.5" />
      <path d="M416 193h20M416 199h30" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab] = useState('internal');
  const [status, setStatus] = useState('idle'); // idle | busy | success
  const [error, setError] = useState('');
  const [fieldErr, setFieldErr] = useState({});
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);

  const [channelScope, setChannelScope] = useState('all');
  const [empId, setEmpId] = useState('');
  const [vcode, setVcode] = useState('');
  const [password, setPassword] = useState('');

  const busy = status === 'busy';
  const done = status === 'success';

  function switchTab(next) {
    if (next === tab) return;
    setTab(next);
    setError('');
    setFieldErr({});
    setPassword('');
    setShowPw(false);
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
      if (err.status === 401) {
        setError(form.mode === 'supplier'
          ? 'Invalid vendor code or password.'
          : 'Invalid EAML / Employee ID or password.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    }
  }

  function submitInternal(e) {
    e.preventDefault();
    const fe = {};
    if (!empId.trim()) fe.empId = 'Enter your EAML / Employee ID.';
    if (!password) fe.password = 'Enter your password.';
    setFieldErr(fe);
    if (Object.keys(fe).length) return;
    runLogin({ mode: 'internal', username: empId.trim(), password, channelScope }, '/app/invoices');
  }

  function submitSupplier(e) {
    e.preventDefault();
    const fe = {};
    if (!vcode.trim()) fe.vcode = 'Enter your vendor code.';
    if (!password) fe.password = 'Enter your password.';
    setFieldErr(fe);
    if (Object.keys(fe).length) return;
    const code = vcode.trim();
    runLogin(
      { mode: 'supplier', vcode: code, company: supplierForVendorCode(code), password },
      '/supplier/home',
    );
  }

  const notify = (msg) => dispatch(pushToast(msg));

  const submitBtn = (
    <button type="submit" className="lgn-submit" disabled={busy || done}>
      {busy && <span className="lgn-spinner" />}
      {busy ? 'Signing in…' : done ? 'Signed in' : 'Login'}
    </button>
  );

  const rememberRow = (
    <div className="lgn-row">
      <label className="lgn-remember">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Remember me
      </label>
      <button type="button" className="lgn-link"
        onClick={() => notify('Password help: contact the Mahindra IT service desk (x-4400).')}>
        Forgot password?
      </button>
    </div>
  );

  function PasswordField() {
    return (
      <div className="lgn-field">
        <label htmlFor="lgn-password">Password</label>
        <div className="lgn-input">
          <LockIcon className="lgn-ic" />
          <input id="lgn-password" type={showPw ? 'text' : 'password'}
            autoComplete="current-password" placeholder="Enter your password"
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
    );
  }

  return (
    <div className="lgn-page">
      {/* -------- Slim corporate header -------- */}
      <header className="lgn-hdr">
        <div className="lgn-hdr-brand">
          <img src={logo} alt="Mahindra" />
          <span>Invoice to Payment Tracker</span>
        </div>
        <nav className="lgn-hdr-nav">
          <button type="button" onClick={() => notify('Help centre: i2p-help.mahindra.internal')}>Help</button>
          <button type="button" onClick={() => notify('Contact support: i2p-support@mahindra.com')}>Contact Support</button>
        </nav>
      </header>

      {/* -------- Hero + login -------- */}
      <div className="lgn-hero">
        <div className="lgn-hero-deco" aria-hidden="true">
          <span className="shard a" /><span className="shard b" /><span className="shard c" />
        </div>

        <section className="lgn-hero-left">
          <p className="lgn-eyebrow">Finance &amp; Procurement</p>
          <h1 className="lgn-hero-title">Invoice to Payment Tracker</h1>
          <p className="lgn-hero-text">
            Simplifying invoice processing, approvals and payment tracking across Mahindra.
          </p>
          <WorkflowVisual />
        </section>

        <section className="lgn-hero-right">
          <div className="lgn-card">
            <div className="lgn-card-head">
              <p className="lgn-kicker">Welcome</p>
              <h2>Sign in to Invoice to Payment Tracker</h2>
              <p className="lgn-card-sub">Use your Mahindra or supplier credentials to continue.</p>
            </div>

            <div className="lgn-seg" role="group" aria-label="Login type">
              <button type="button" aria-pressed={tab === 'internal'} data-active={tab === 'internal'}
                onClick={() => switchTab('internal')}>Internal Team</button>
              <button type="button" aria-pressed={tab === 'supplier'} data-active={tab === 'supplier'}
                onClick={() => switchTab('supplier')}>Supplier</button>
            </div>

            {error && (
              <div className="lgn-alert error" role="alert">
                <AlertIcon /><span>{error}</span>
              </div>
            )}
            {done && (
              <div className="lgn-alert success" role="status">
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
                  <label htmlFor="lgn-empid">Mahindra EAML / Employee ID</label>
                  <div className="lgn-input">
                    <IdIcon className="lgn-ic" />
                    <input id="lgn-empid" type="text" autoComplete="username"
                      placeholder="Enter your Mahindra EAML / Employee ID" value={empId}
                      aria-invalid={!!fieldErr.empId}
                      aria-describedby={fieldErr.empId ? 'lgn-empid-err' : undefined}
                      onChange={(e) => setEmpId(e.target.value)} />
                  </div>
                  {fieldErr.empId && <span id="lgn-empid-err" className="lgn-field-msg">{fieldErr.empId}</span>}
                </div>

                {PasswordField()}
                {rememberRow}
                {submitBtn}
              </form>
            ) : (
              <form className="lgn-form" onSubmit={submitSupplier} noValidate>
                <div className="lgn-field">
                  <label htmlFor="lgn-vcode">Vendor Code</label>
                  <div className="lgn-input">
                    <HashIcon className="lgn-ic" />
                    <input id="lgn-vcode" type="text" autoComplete="username"
                      placeholder="Enter your vendor code" value={vcode}
                      aria-invalid={!!fieldErr.vcode}
                      aria-describedby={fieldErr.vcode ? 'lgn-vcode-err' : undefined}
                      onChange={(e) => setVcode(e.target.value)} />
                  </div>
                  {fieldErr.vcode && <span id="lgn-vcode-err" className="lgn-field-msg">{fieldErr.vcode}</span>}
                </div>

                {PasswordField()}
                {rememberRow}
                {submitBtn}
              </form>
            )}

            <footer className="lgn-footer">
              <span>© 2026 Mahindra. All rights reserved.</span>
              <nav>
                <a href="#privacy" onClick={(e) => { e.preventDefault(); notify('Privacy Policy'); }}>Privacy Policy</a>
                <a href="#support" onClick={(e) => { e.preventDefault(); notify('Help / Support'); }}>Help / Support</a>
              </nav>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}

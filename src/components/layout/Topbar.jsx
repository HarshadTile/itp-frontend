import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CHANNELS } from '../../data/constants';
import { SUPPLIERS } from '../../data/invoices';
import { vendorCodesFor, panFor } from '../../utils/businessLogic';
import { switchIdentity } from '../../features/auth/authSlice';
import { pushToast, resetFiltersOnIdentitySwitch } from '../../features/ui/uiSlice';

function crumbFor(pathname, params) {
  if (pathname.startsWith('/app/invoices')) return 'Invoice Tracking';
  if (pathname.startsWith('/app/search')) return 'Search Invoice(s)';
  if (pathname.startsWith('/app/channel/')) { const c = CHANNELS.find((x) => x.key === params.key); return `Processing Channels / ${c ? c.label : ''}`; }
  if (pathname.startsWith('/app/vendor-code/') || pathname.startsWith('/supplier/vendor-code/')) return `Supplier Visibility / ${params.code || ''}`;
  if (pathname.startsWith('/app/supplier-visibility')) return 'Supplier Visibility';
  if (pathname.startsWith('/app/logs')) return 'Logs / History';
  if (pathname.startsWith('/app/inquiry-desk')) return 'Inquiry Desk';
  if (pathname.startsWith('/supplier/home')) return 'My Invoices';
  if (pathname.startsWith('/supplier/tickets')) return 'My Queries';
  if (pathname.startsWith('/supplier/logs')) return 'Logs';
  if (pathname.startsWith('/app/outputs')) return 'Vendor Status Reports';
  if (pathname.startsWith('/app/sync-log')) return 'Sync Log';
  if (pathname.startsWith('/app/settings/')) return `Settings / ${params.sub || ''}`;
  if (pathname.startsWith('/app/profile') || pathname.startsWith('/supplier/profile')) return 'Profile';
  return '';
}

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { authType, channelScope, supplierLoginVcode, supplierQuery, currentUser } = useSelector((s) => s.auth);

  const identityValue = authType === 'supplier' ? `supplier:${supplierLoginVcode}` : `internal:${channelScope}`;

  function handleIdentityChange(e) {
    const val = e.target.value;
    dispatch(switchIdentity(val));
    dispatch(resetFiltersOnIdentitySwitch());
    const [kind, v] = val.split(':');
    if (kind === 'supplier') {
      navigate('/supplier/home');
      dispatch(pushToast(`Now viewing as supplier, vendor code ${v} only.`));
    } else {
      navigate('/app/invoices');
      dispatch(pushToast(v === 'all' ? 'Now viewing all channels.' : 'Now viewing Internal Team (Msetu/SRM + PO Portal + MFOX).'));
    }
  }

  return (
    <div className="topbar">
      <div className="crumb" dangerouslySetInnerHTML={{ __html: `<b>${crumbFor(location.pathname, params)}</b>` }} />
      <div className="topbar-right">
        <input className="search-box" placeholder="Search invoice, PO, vendor code..." onFocus={() => navigate(authType === 'supplier' ? '/supplier/home' : '/app/search')} readOnly />
        <select className="role-select" value={identityValue} onChange={handleIdentityChange} title="Switch view: internal team / portal, or supplier vendor code">
          <optgroup label="Internal Team">
            <option value="internal:all">All Channels (HQ)</option>
            <option value="internal:internalTeam">Internal Team</option>
          </optgroup>
          {SUPPLIERS.map((s) => (
            <optgroup key={s} label={`Supplier: ${s}`}>
              {vendorCodesFor(s).map((code) => (
                <option key={code} value={`supplier:${code}`}>{s.split(' ')[0]} + {code}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button type="button" className="icon-btn" title="Notifications" onClick={() => dispatch(pushToast('No new notifications.'))}>🔔</button>
        <button type="button" className="icon-btn" title="Help" onClick={() => dispatch(pushToast('Help & documentation coming soon.'))}>?</button>
        <div className="avatar" title={authType === 'supplier' ? supplierQuery : currentUser.name}>{authType === 'supplier' ? panFor(supplierQuery).slice(0, 2) : currentUser.initials}</div>
      </div>
    </div>
  );
}

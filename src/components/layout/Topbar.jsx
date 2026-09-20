import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CHANNELS } from '../../data/constants';
import { suppliersFromRuntime } from '../../data/runtime';
import { vendorCodesFor } from '../../utils/businessLogic';
import { switchIdentity } from '../../features/auth/authSlice';
import { pushToast, resetFiltersOnIdentitySwitch, toggleSidebar } from '../../features/ui/uiSlice';
import { Search, Bell, HelpCircle, ChevronDown, Menu } from '../common/icons.jsx';
import UserMenu from './UserMenu.jsx';

const SETTINGS_LABEL = {
  integrations: 'Integration Settings', notifications: 'Notifications', auditLogs: 'Audit Logs',
  users: 'Users', roles: 'Roles & Permissions',
};

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
  if (pathname.startsWith('/app/settings/')) return `Settings / ${SETTINGS_LABEL[pathname.split('/').pop()] || ''}`;
  if (pathname.startsWith('/app/profile') || pathname.startsWith('/supplier/profile')) return 'Profile';
  return '';
}

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { authType, channelScope, supplierLoginVcode } = useSelector((s) => s.auth);

  const identityValue = authType === 'supplier' ? `supplier:${supplierLoginVcode}` : `internal:${channelScope}`;
  const crumb = crumbFor(location.pathname, params);

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
    <header className="topbar">
      <button type="button" className="icon-btn menu-btn" aria-label="Open menu"
        onClick={() => dispatch(toggleSidebar())}>
        <Menu size={18} />
      </button>
      <div className="crumb"><b>{crumb}</b></div>

      <div className="topbar-right">
        <div className="topbar-search">
          <Search size={16} aria-hidden="true" />
          <input
            className="search-box"
            placeholder="Search invoice, PO, vendor…"
            aria-label="Search invoices, POs, vendor codes"
            onFocus={() => navigate(authType === 'supplier' ? '/supplier/home' : '/app/search')}
            readOnly
          />
        </div>

        <div className="workspace-select">
          <select
            className="role-select"
            value={identityValue}
            onChange={handleIdentityChange}
            aria-label="Switch workspace"
            title="Switch view: internal team / portal, or supplier vendor code"
          >
            <optgroup label="Internal Team">
              <option value="internal:all">All Channels (HQ)</option>
              <option value="internal:internalTeam">Internal Team</option>
            </optgroup>
            {suppliersFromRuntime().map((s) => (
              <optgroup key={s} label={`Supplier: ${s}`}>
                {vendorCodesFor(s).map((code) => (
                  <option key={code} value={`supplier:${code}`}>{s.split(' ')[0]} + {code}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </div>

        <button type="button" className="icon-btn" aria-label="Notifications"
          onClick={() => dispatch(pushToast('No new notifications.'))}>
          <Bell size={18} />
        </button>
        <button type="button" className="icon-btn" aria-label="Help"
          onClick={() => dispatch(pushToast('Help & documentation coming soon.'))}>
          <HelpCircle size={18} />
        </button>

        <UserMenu />
      </div>
    </header>
  );
}

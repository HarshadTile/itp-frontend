import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { CHANNELS, LOGIN_CHANNELS, CHANNEL_LABEL } from '../../data/constants';
import { toggleNavExpanded } from '../../features/ui/uiSlice';
import { logoutThunk } from '../../features/bootstrap/hydrateThunks';
import logo from '../../assets/mahindra-logo.png';

function NavItem({ icon, label, active, badge, onClick, hasChildren, open }) {
  return (
    <button
      type="button"
      className={`nav-item${active ? ' active' : ''}`}
      onClick={onClick}
      title={label}
    >
      <span className="ic">{icon}</span>
      <span>{label}{badge != null ? ` (${badge})` : ''}</span>
      {hasChildren && <span className={`chev${open ? ' open' : ''}`}>▶</span>}
    </button>
  );
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { authType, channelScope, supplierLoginVcode } = useSelector((s) => s.auth);
  const expandedNav = useSelector((s) => s.ui.expandedNav);
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isOpen = (id) => expandedNav.includes(id);

  if (authType === 'supplier') {
    const code = supplierLoginVcode;
    return (
      <aside className="sidebar">
        <Brand />
        <nav className="nav-tree">
          <NavItem icon="☰" label="My Invoices" to="/supplier/home" active={isActive('/supplier/home')} onClick={() => navigate('/supplier/home')} />
          <NavItem icon="🏷" label="Supplier Visibility" active={isActive('/supplier/vendor-code')} onClick={() => navigate(`/supplier/vendor-code/${code}`)} />
          <NavItem icon="🕘" label="Logs" to="/supplier/logs" active={isActive('/supplier/logs')} onClick={() => navigate('/supplier/logs')} />
          <NavItem icon="✉" label="My Queries" to="/supplier/tickets" active={isActive('/supplier/tickets')} onClick={() => navigate('/supplier/tickets')} />
        </nav>
        <div className="nav-bottom">
          <NavItem icon="◍" label="My Profile" active={isActive('/supplier/profile')} onClick={() => navigate('/supplier/profile')} />
          <NavItem icon="⎋" label="Logout" onClick={() => { dispatch(logoutThunk()); navigate('/login'); }} />
        </div>
      </aside>
    );
  }

  const scoped = channelScope === 'internalTeam';
  const channelsToShow = scoped ? LOGIN_CHANNELS : CHANNELS;

  return (
    <aside className="sidebar">
      <Brand />
      <nav className="nav-tree">
        <NavItem
          icon="☰"
          label={scoped ? 'Internal Team Invoice Tracking' : 'Invoice Tracking'}
          active={isActive('/app/invoices')}
          onClick={() => navigate('/app/invoices')}
        />
        <NavItem icon="🔍" label="Search Invoice(s)" active={isActive('/app/search')} onClick={() => navigate('/app/search')} />

        <NavItem
          icon="◈"
          label={scoped ? 'Internal Team : Processing' : 'Processing Channels'}
          hasChildren
          open={isOpen('channels')}
          onClick={() => dispatch(toggleNavExpanded('channels'))}
        />
        {isOpen('channels') && (
          <div className="nav-children lvl1">
            {channelsToShow.map((c) => (
              <NavItem key={c.key} icon="◈" label={c.label} active={isActive(`/app/channel/${c.key}`)} onClick={() => navigate(`/app/channel/${c.key}`)} />
            ))}
          </div>
        )}

        {!scoped && (
          <NavItem icon="🏷" label="Supplier Visibility" active={isActive('/app/supplier-visibility')} onClick={() => navigate('/app/supplier-visibility')} />
        )}
        <NavItem icon="✉" label="Inquiry Desk" active={isActive('/app/inquiry-desk')} onClick={() => navigate('/app/inquiry-desk')} />
      </nav>

      <div className="nav-bottom">
        {!scoped && (
          <>
            <NavItem icon="⇩" label="Vendor Status Reports" active={isActive('/app/outputs')} onClick={() => navigate('/app/outputs')} />
            <NavItem icon="🕘" label="Logs / History" active={isActive('/app/logs')} onClick={() => navigate('/app/logs')} />
            <NavItem icon="↻" label="Sync Log" active={isActive('/app/sync-log')} onClick={() => navigate('/app/sync-log')} />
            <NavItem
              icon="⚙"
              label="Settings"
              hasChildren
              open={isOpen('settings')}
              onClick={() => dispatch(toggleNavExpanded('settings'))}
            />
            {isOpen('settings') && (
              <div className="nav-children lvl1">
                <NavItem icon="▫" label="Integration Settings" active={isActive('/app/settings/integrations')} onClick={() => navigate('/app/settings/integrations')} />
                <NavItem icon="▫" label="Notifications" active={isActive('/app/settings/notifications')} onClick={() => navigate('/app/settings/notifications')} />
                <NavItem icon="▫" label="Audit Logs" active={isActive('/app/settings/auditLogs')} onClick={() => navigate('/app/settings/auditLogs')} />
                <NavItem icon="▫" label="Users" active={isActive('/app/settings/users')} onClick={() => navigate('/app/settings/users')} />
                <NavItem icon="▫" label="Roles & Permissions" active={isActive('/app/settings/roles')} onClick={() => navigate('/app/settings/roles')} />
              </div>
            )}
          </>
        )}
        <NavItem icon="◍" label="Profile" active={isActive('/app/profile')} onClick={() => navigate('/app/profile')} />
        <NavItem icon="⎋" label="Logout" onClick={() => { dispatch(logoutThunk()); navigate('/login'); }} />
      </div>
    </aside>
  );
}

function Brand() {
  return (
    <div className="brand">
      <img src={logo} alt="Mahindra" />
      <div className="brand-text">
        <b>I2P Tracker</b>
        <span>Invoice to Payment Tracking</span>
      </div>
    </div>
  );
}

export { CHANNEL_LABEL };

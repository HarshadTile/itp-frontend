import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

/** Gate for the internal (HQ / Internal Team) side of the app. */
export function RequireInternal() {
  const { loggedIn, authType } = useSelector((s) => s.auth);
  if (!loggedIn) return <Navigate to="/login" replace />;
  if (authType !== 'internal') return <Navigate to="/supplier/home" replace />;
  return <Outlet />;
}

/** Gate for the supplier side of the app. */
export function RequireSupplier() {
  const { loggedIn, authType } = useSelector((s) => s.auth);
  if (!loggedIn) return <Navigate to="/login" replace />;
  if (authType !== 'supplier') return <Navigate to="/app/invoices" replace />;
  return <Outlet />;
}

/** HQ-only pages (Outputs, Sync Log, Logs/History, Settings, Supplier Visibility) are hidden
 * from an Internal Team (channel-scoped) login, same rule the sidebar itself enforces. */
export function RequireHQ() {
  const { channelScope } = useSelector((s) => s.auth);
  if (channelScope !== 'all') return <Navigate to="/app/invoices" replace />;
  return <Outlet />;
}

export function RedirectIfLoggedIn({ children }) {
  const { loggedIn, authType } = useSelector((s) => s.auth);
  if (loggedIn) return <Navigate to={authType === 'supplier' ? '/supplier/home' : '/app/invoices'} replace />;
  return children;
}

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import ModalHost from '../modals/ModalHost.jsx';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div id="content">
          <Outlet />
        </div>
      </div>
      <ModalHost />
    </div>
  );
}

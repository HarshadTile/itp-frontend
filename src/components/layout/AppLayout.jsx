import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import ModalHost from '../modals/ModalHost.jsx';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        {/* single scroll area: the top bar sticks, the page content scrolls under it */}
        <div className="main-scroll">
          <Topbar />
          <div id="content">
            <Outlet />
          </div>
        </div>
      </div>
      <ModalHost />
    </div>
  );
}

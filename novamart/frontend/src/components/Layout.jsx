import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart,
  LogOut, Store, Sparkles,
} from 'lucide-react';
import {
  getRoleId, canSeeDashboard, canSeeInventory, canSeePOS, canSeeAI,
} from '../utils/rbac';

const ALL_NAV = [
  { path: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard, check: canSeeDashboard },
  { path: '/inventory', label: 'Inventory',     icon: Package,         check: canSeeInventory },
  { path: '/pos',       label: 'Point of Sale', icon: ShoppingCart,    check: canSeePOS },
  { path: '/ai',        label: 'Ask AI',        icon: Sparkles,        check: canSeeAI },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const roleId   = getRoleId();
  const navItems = ALL_NAV.filter((n) => n.check(roleId));

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (user.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const pageTitle = navItems.find((n) => location.pathname.startsWith(n.path))?.label || 'Dashboard';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* ─── SIDEBAR ─────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <Store size={22} />
          </div>
          <h2>NovaMart</h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} className="nav-icon" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'none' }}>
            <LogOut size={20} className="nav-icon" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN AREA ───────────────────────── */}
      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{pageTitle}</span>

          <div className="topbar-right">
            <div className="topbar-user">
              <div className="topbar-avatar">{initials}</div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user.name || 'User'}</span>
                <span className="topbar-user-role">
                  {user.role_id === 1
                    ? 'Regional Admin'
                    : user.role_id === 2
                    ? 'Store Manager'
                    : user.role_id === 3
                    ? 'Inventory Supervisor'
                    : 'Sales Associate'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

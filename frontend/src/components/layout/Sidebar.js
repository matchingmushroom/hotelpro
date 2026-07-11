import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'fa-chart-pie', roles: ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager', 'food_staff'] },
  { to: '/rooms', label: 'Rooms', icon: 'fa-door-open', roles: ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager'] },
  { to: '/rooms/kanban', label: 'KanBan Board', icon: 'fa-columns', roles: ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager'] },
  { to: '/rooms/calendar', label: 'Calendar', icon: 'fa-calendar-alt', roles: ['admin', 'receptionist'] },
  { to: '/bookings', label: 'Bookings', icon: 'fa-book', roles: ['admin', 'receptionist'] },
  { to: '/check-in-out', label: 'Check-In/Out', icon: 'fa-sign-in-alt', roles: ['admin', 'receptionist'] },
  { to: '/waitlist', label: 'Waitlist', icon: 'fa-list', roles: ['admin', 'receptionist'] },
  { to: '/food/menu', label: 'Food Menu', icon: 'fa-utensils', roles: ['admin', 'food_staff'] },
  { to: '/food/orders', label: 'Food Orders', icon: 'fa-clipboard-list', roles: ['admin', 'food_staff'] },
  { to: '/food/staff-dashboard', label: 'Food Staff', icon: 'fa-kitchen-set', roles: ['food_staff'] },
  { to: '/housekeeping', label: 'Housekeeping', icon: 'fa-broom', roles: ['admin', 'housekeeping', 'housekeeping_manager'] },
  { to: '/housekeeping/cleaner', label: 'Cleaner Dashboard', icon: 'fa-clipboard-check', roles: ['housekeeping'] },
  { to: '/quotes', label: 'Quotes', icon: 'fa-file-invoice', roles: ['admin', 'receptionist'] },
  { to: '/invoices', label: 'Invoices', icon: 'fa-file-invoice-dollar', roles: ['admin', 'receptionist'] },
  { to: '/payments', label: 'Payments', icon: 'fa-credit-card', roles: ['admin', 'receptionist'] },
  { to: '/guests', label: 'Guests', icon: 'fa-users', roles: ['admin', 'receptionist'] },
  { to: '/reports', label: 'Reports', icon: 'fa-chart-bar', roles: ['admin'] },
  { to: '/activity-log', label: 'Activity Log', icon: 'fa-history', roles: ['admin'] },
  { to: '/chat', label: 'AI Assistant', icon: 'fa-robot', roles: ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager', 'food_staff'] },
  { to: '/settings', label: 'Settings', icon: 'fa-cog', roles: ['admin'] },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { profile } = useAuth();
  const location = useLocation();
  const role = profile?.role || 'admin';

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <i className="fas fa-hotel"></i>
          {!collapsed && <span>Otel.Pro</span>}
        </div>
        <button className="sidebar-toggle" onClick={onToggle}>
          <i className={`fas fa-${collapsed ? 'chevron-right' : 'chevron-left'}`}></i>
        </button>
      </div>
      <nav className="sidebar-nav">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <i className={`fas ${item.icon}`}></i>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--primary);
          color: var(--white);
          z-index: 100;
          transition: width var(--transition);
          overflow-y: auto;
          overflow-x: hidden;
        }
        .sidebar.collapsed { width: 64px; }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          height: var(--header-height);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.2rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .sidebar-logo i { font-size: 1.3rem; color: var(--accent); }
        .sidebar-toggle {
          background: none;
          border: none;
          color: var(--white);
          cursor: pointer;
          padding: 4px;
          opacity: 0.7;
        }
        .sidebar-toggle:hover { opacity: 1; }
        .sidebar-nav { padding: 8px 0; }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-size: 0.9rem;
          transition: var(--transition);
          white-space: nowrap;
          border-left: 3px solid transparent;
        }
        .sidebar-link:hover {
          color: var(--white);
          background: rgba(255,255,255,0.05);
        }
        .sidebar-link.active {
          color: var(--white);
          background: rgba(255,255,255,0.1);
          border-left-color: var(--accent);
        }
        .sidebar-link i { width: 20px; text-align: center; font-size: 1rem; }
        .sidebar.collapsed .sidebar-link { justify-content: center; padding: 12px; }
        .sidebar.collapsed .sidebar-link i { width: auto; }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); width: var(--sidebar-width); }
        }
      `}</style>
    </aside>
  );
}

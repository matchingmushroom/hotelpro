import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const sections = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'fa-chart-pie', roles: ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager', 'food_staff'] },
      { to: '/rooms', label: 'Rooms', icon: 'fa-door-open', roles: ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager'] },
      { to: '/rooms/kanban', label: 'KanBan', icon: 'fa-columns', roles: ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager'] },
      { to: '/rooms/calendar', label: 'Calendar', icon: 'fa-calendar-alt', roles: ['admin', 'receptionist'] },
      { to: '/bookings', label: 'Bookings', icon: 'fa-book', roles: ['admin', 'receptionist'] },
      { to: '/check-in-out', label: 'Check-In/Out', icon: 'fa-sign-in-alt', roles: ['admin', 'receptionist'] },
      { to: '/waitlist', label: 'Waitlist', icon: 'fa-list', roles: ['admin', 'receptionist'] },
    ],
  },
  {
    label: 'Food',
    items: [
      { to: '/food/menu', label: 'Food Menu', icon: 'fa-utensils', roles: ['admin', 'food_staff'] },
      { to: '/food/orders', label: 'Food Orders', icon: 'fa-clipboard-list', roles: ['admin', 'food_staff'] },
      { to: '/food/staff-dashboard', label: 'Food Staff', icon: 'fa-kitchen-set', roles: ['food_staff'] },
    ],
  },
  {
    label: 'Housekeeping',
    items: [
      { to: '/housekeeping', label: 'Housekeeping', icon: 'fa-broom', roles: ['admin', 'housekeeping', 'housekeeping_manager'] },
      { to: '/housekeeping/cleaner', label: 'Cleaner', icon: 'fa-clipboard-check', roles: ['housekeeping'] },
      { to: '/housekeeping/assignments', label: 'Assignments', icon: 'fa-tasks', roles: ['admin', 'housekeeping_manager'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/quotes', label: 'Quotes', icon: 'fa-file-invoice', roles: ['admin', 'receptionist'] },
      { to: '/invoices', label: 'Invoices', icon: 'fa-file-invoice-dollar', roles: ['admin', 'receptionist'] },
      { to: '/payments', label: 'Payments', icon: 'fa-credit-card', roles: ['admin', 'receptionist'] },
    ],
  },
  {
    label: 'Guests',
    items: [
      { to: '/guests', label: 'Guests', icon: 'fa-users', roles: ['admin', 'receptionist'] },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/reports', label: 'Reports', icon: 'fa-chart-bar', roles: ['admin'] },
      { to: '/activity-log', label: 'Activity Log', icon: 'fa-history', roles: ['admin'] },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/chat', label: 'AI Assistant', icon: 'fa-robot', roles: ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager', 'food_staff'] },
      { to: '/settings', label: 'Settings', icon: 'fa-cog', roles: ['admin'] },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, isOpen, onClose }) {
  const { profile } = useAuth();
  const role = profile?.role || 'admin';

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/dashboard" className="sidebar-logo" onClick={onClose}>
            <i className="fas fa-hotel"></i>
            {!collapsed && <span>Otel.Pro</span>}
          </NavLink>
          <button className="sidebar-toggle" onClick={onToggle}>
            <i className={`fas fa-${collapsed ? 'chevron-right' : 'chevron-left'}`}></i>
          </button>
        </div>
        <nav className="sidebar-nav">
          {sections.map(section => {
            const visible = section.items.filter(i => i.roles.includes(role));
            if (!visible.length) return null;
            return (
              <div key={section.label}>
                {!collapsed && <div className="sidebar-section-label">{section.label}</div>}
                {visible.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/rooms' || item.to === '/housekeeping'}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                    onClick={onClose}
                  >
                    <i className={`fas ${item.icon}`}></i>
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

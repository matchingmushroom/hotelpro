import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Loading from '../common/Loading';

const bottomNavItems = [
  { to: '/dashboard', icon: 'fa-chart-pie', label: 'Dashboard', roles: ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager', 'food_staff'] },
  { to: '/bookings', icon: 'fa-book', label: 'Bookings', roles: ['admin', 'receptionist'] },
  { to: '/check-in-out', icon: 'fa-sign-in-alt', label: 'Check-In', roles: ['admin', 'receptionist'] },
  { to: '/rooms', icon: 'fa-door-open', label: 'Rooms', roles: ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager'] },
  { to: '/food/orders', icon: 'fa-clipboard-list', label: 'Orders', roles: ['admin', 'food_staff'] },
  { to: '/housekeeping', icon: 'fa-broom', label: 'Cleaning', roles: ['admin', 'housekeeping', 'housekeeping_manager'] },
  { to: '/invoices', icon: 'fa-file-invoice-dollar', label: 'Invoices', roles: ['admin', 'receptionist'] },
  { to: '/guests', icon: 'fa-users', label: 'Guests', roles: ['admin', 'receptionist'] },
  { to: '/chat', icon: 'fa-robot', label: 'AI', roles: ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager', 'food_staff'] },
  { to: '/settings', icon: 'fa-cog', label: 'Settings', roles: ['admin'] },
  { to: '/reports', icon: 'fa-chart-bar', label: 'Reports', roles: ['admin'] },
];

const MAX_VISIBLE = 4;

export default function MainLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { profile } = useAuth();
  const role = profile?.role || 'admin';

  useEffect(() => {
    setSidebarOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  const visibleItems = bottomNavItems.filter(i => i.roles.includes(role));
  const mainItems = visibleItems.slice(0, MAX_VISIBLE);
  const moreItems = visibleItems.slice(MAX_VISIBLE);

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          collapsed={sidebarCollapsed}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {mainItems.map(item => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <a key={item.to} href={`#${item.to}`}
              className={`bottom-nav-link ${isActive ? 'active' : ''}`}
              onClick={e => {
                e.preventDefault();
                window.location.hash = item.to;
                setMoreOpen(false);
              }}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </a>
          );
        })}
        {moreItems.length > 0 && (
          <>
            <button className="bottom-nav-link" onClick={() => setMoreOpen(!moreOpen)}>
              <i className="fas fa-ellipsis-h"></i>
              <span>More</span>
            </button>
            <div className={`more-menu ${moreOpen ? 'open' : ''}`}>
              {moreItems.map(item => {
                const isActive = location.pathname === item.to;
                return (
                  <a key={item.to} href={`#${item.to}`}
                    className={`more-menu-item ${isActive ? 'text-primary' : ''}`}
                    onClick={e => {
                      e.preventDefault();
                      window.location.hash = item.to;
                      setMoreOpen(false);
                    }}
                  >
                    <i className={`fas ${item.icon}`}></i>
                    {item.label}
                  </a>
                );
              })}
            </div>
          </>
        )}
      </nav>
    </div>
  );
}

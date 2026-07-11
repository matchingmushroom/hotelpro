import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';

export default function Header({ onMenuToggle }) {
  const { profile, user, signOut } = useAuth();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuToggle}>
          <i className="fas fa-bars"></i>
        </button>
        <h2 className="header-title">Otel.Pro</h2>
      </div>
      <div className="header-right">
        <span className="header-date">{formatDateTime(new Date())}</span>
        <div className="header-user">
          <div className="header-avatar">
            {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{profile?.name || 'User'}</span>
            <span className="header-user-role">{profile?.role || 'Staff'}</span>
          </div>
          <button className="header-logout" onClick={signOut} title="Logout">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
      <style>{`
        .app-header {
          position: fixed;
          top: 0;
          left: var(--sidebar-width);
          right: 0;
          height: var(--header-height);
          background: var(--white);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 50;
          transition: left var(--transition);
        }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .header-menu-btn {
          display: none;
          background: none;
          border: none;
          font-size: 1.2rem;
          color: var(--text);
          cursor: pointer;
        }
        .header-title { font-size: 1.1rem; font-weight: 600; color: var(--primary); }
        .header-right { display: flex; align-items: center; gap: 20px; }
        .header-date { font-size: 0.85rem; color: var(--text-muted); }
        .header-user { display: flex; align-items: center; gap: 10px; }
        .header-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: var(--primary);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .header-user-info { display: flex; flex-direction: column; }
        .header-user-name { font-size: 0.9rem; font-weight: 500; }
        .header-user-role { font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize; }
        .header-logout {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          font-size: 1rem;
          transition: var(--transition);
        }
        .header-logout:hover { color: var(--error); }
        @media (max-width: 768px) {
          .app-header { left: 0; }
          .header-menu-btn { display: block; }
          .header-date { display: none; }
          .header-user-info { display: none; }
        }
      `}</style>
    </header>
  );
}

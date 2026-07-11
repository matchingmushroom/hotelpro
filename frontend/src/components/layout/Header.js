import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';

export default function Header({ onMenuToggle, collapsed }) {
  const { profile, user, signOut } = useAuth();
  const [hotelName, setHotelName] = useState('');

  useEffect(() => {
    if (profile?.hotel_id) {
      supabase.from('hotels').select('name').eq('id', profile.hotel_id).single()
        .then(({ data }) => { if (data) setHotelName(data.name); })
        .catch(() => {});
    }
  }, [profile?.hotel_id]);

  return (
    <header className={`app-header ${collapsed ? 'expanded' : ''}`}>
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <i className="fas fa-bars"></i>
        </button>
        <span className="header-title">{hotelName || 'Otel.Pro'}</span>
      </div>
      <div className="header-right">
        {hotelName && <span className="header-hotel-badge">{hotelName}</span>}
        <span className="header-date">
          <i className="fas fa-calendar-day mr-1"></i>
          {formatDateTime(new Date())}
        </span>
        <div className="header-user" title={profile?.name || 'User'}>
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
    </header>
  );
}

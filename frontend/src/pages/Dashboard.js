import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAll, countRecords } from '../services/supabaseService';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalRooms: 0, availableRooms: 0, todayCheckIns: 0, todayCheckOuts: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const rooms = await fetchAll('rooms');
      const totalRooms = rooms.data.length;
      const availableRooms = rooms.data.filter(r => r.status === 'available').length;
      const today = new Date().toISOString().split('T')[0];
      const checkIns = await countRecords('bookings', { check_in_date: today, status: 'confirmed' });
      const checkOuts = await countRecords('bookings', { check_out_date: today, status: 'checked_in' });
      setStats({ totalRooms, availableRooms, todayCheckIns: checkIns, todayCheckOuts: checkOuts });
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }

  const cards = [
    { label: 'Total Rooms', value: stats.totalRooms, icon: 'fa-door-open', color: '#3b82f6' },
    { label: 'Available', value: stats.availableRooms, icon: 'fa-check-circle', color: '#22c55e' },
    { label: 'Check-Ins Today', value: stats.todayCheckIns, icon: 'fa-sign-in-alt', color: '#f59e0b' },
    { label: 'Check-Outs Today', value: stats.todayCheckOuts, icon: 'fa-sign-out-alt', color: '#ef4444' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {profile?.name || 'User'}</p>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map(card => (
          <div key={card.label} className="stat-card" style={{ borderTopColor: card.color }}>
            <div className="stat-icon" style={{ background: card.color + '18', color: card.color }}>
              <i className={`fas ${card.icon}`}></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mt-3">
        <div className="card">
          <h3>Recent Activity</h3>
          <p className="text-muted mt-1">Activity log will appear here once data starts flowing.</p>
        </div>
        <div className="card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button className="btn btn-primary" onClick={() => window.location.href = '/bookings/new'}>
              <i className="fas fa-plus"></i> New Booking
            </button>
            <button className="btn btn-outline" onClick={() => window.location.href = '/check-in-out'}>
              <i className="fas fa-sign-in-alt"></i> Check-In
            </button>
            <button className="btn btn-outline" onClick={() => window.location.href = '/food/orders'}>
              <i className="fas fa-utensils"></i> Food Orders
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .stat-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-top: 3px solid;
        }
        .stat-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
        }
        .stat-info { display: flex; flex-direction: column; }
        .stat-value { font-size: 1.5rem; font-weight: 700; line-height: 1.2; }
        .stat-label { font-size: 0.85rem; color: var(--text-muted); }
        .quick-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
        .quick-actions .btn { width: 100%; justify-content: center; }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchAll, countRecords } from '../services/supabaseService';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalRooms: 0, availableRooms: 0, todayCheckIns: 0, todayCheckOuts: 0,
  });
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [guestMap, setGuestMap] = useState({});

  useEffect(() => { loadStats(); }, []);

  function guestName(b) {
    return b?.guest_name || guestMap[b?.guest_id] || 'Guest';
  }

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

  async function openModal(key) {
    setModalLoading(true);
    setModal(key);
    setModalData([]);
    try {
      const today = new Date().toISOString().split('T')[0];
      let data = [];

      switch (key) {
        case 'totalRooms':
        case 'availableRooms': {
          const rooms = await fetchAll('rooms', { orderBy: 'room_number' });
          data = key === 'availableRooms'
            ? rooms.data.filter(r => r.status === 'available')
            : rooms.data;
          break;
        }
        case 'todayCheckIns': {
          const [bookingsRes, guestsRes] = await Promise.all([
            fetchAll('bookings', {
              filters: { check_in_date: today, status: 'confirmed' },
              orderBy: 'check_in_date',
            }),
            fetchAll('guests'),
          ]);
          const map = {};
          (guestsRes.data || []).forEach(g => { map[g.id] = g.name; });
          setGuestMap(map);
          const roomIds = [...new Set(bookingsRes.data.map(b => b.room_id).filter(Boolean))];
          const rooms = roomIds.length ? await fetchAll('rooms', { filters: { id: roomIds } }) : { data: [] };
          const roomMap = Object.fromEntries((rooms.data || []).map(r => [r.id, r]));
          data = (bookingsRes.data || []).map(b => ({
            ...b,
            room_number: roomMap[b.room_id]?.room_number || 'N/A',
          }));
          break;
        }
        case 'todayCheckOuts': {
          const [bookingsRes, guestsRes] = await Promise.all([
            fetchAll('bookings', {
              filters: { check_out_date: today, status: 'checked_in' },
              orderBy: 'check_out_date',
            }),
            fetchAll('guests'),
          ]);
          const map = {};
          (guestsRes.data || []).forEach(g => { map[g.id] = g.name; });
          setGuestMap(map);
          const roomIds = [...new Set(bookingsRes.data.map(b => b.room_id).filter(Boolean))];
          const rooms = roomIds.length ? await fetchAll('rooms', { filters: { id: roomIds } }) : { data: [] };
          const roomMap = Object.fromEntries((rooms.data || []).map(r => [r.id, r]));
          data = (bookingsRes.data || []).map(b => ({
            ...b,
            room_number: roomMap[b.room_id]?.room_number || 'N/A',
          }));
          break;
        }
      }
      setModalData(data);
    } catch (err) {
      console.error('Failed to load modal data', err);
    } finally {
      setModalLoading(false);
    }
  }

  const cards = [
    { key: 'totalRooms', label: 'Total Rooms', value: stats.totalRooms, icon: 'fa-door-open', color: '#3b82f6' },
    { key: 'availableRooms', label: 'Available', value: stats.availableRooms, icon: 'fa-check-circle', color: '#22c55e' },
    { key: 'todayCheckIns', label: 'Check-Ins Today', value: stats.todayCheckIns, icon: 'fa-sign-in-alt', color: '#f59e0b' },
    { key: 'todayCheckOuts', label: 'Check-Outs Today', value: stats.todayCheckOuts, icon: 'fa-sign-out-alt', color: '#ef4444' },
  ];

  const modalConfig = {
    totalRooms: { title: 'All Rooms', cols: ['Room #', 'Type', 'Floor', 'Price', 'Status'] },
    availableRooms: { title: 'Available Rooms', cols: ['Room #', 'Type', 'Floor', 'Price'] },
    todayCheckIns: { title: 'Check-Ins Today', cols: ['Guest', 'Room', 'Check-In', 'Check-Out', 'Guests'] },
    todayCheckOuts: { title: 'Check-Outs Today', cols: ['Guest', 'Room', 'Check-Out', 'Guests'] },
  };

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
          <div key={card.key} className="stat-card clickable"
            style={{ borderTopColor: card.color }}
            onClick={() => openModal(card.key)}
          >
            <div className="stat-icon" style={{ background: card.color + '18', color: card.color }}>
              <i className={`fas ${card.icon}`}></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
            <i className="fas fa-chevron-right stat-arrow"></i>
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
            <button className="btn btn-primary" onClick={() => navigate('/bookings/new')}>
              <i className="fas fa-plus"></i> New Booking
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/check-in-out')}>
              <i className="fas fa-sign-in-alt"></i> Check-In
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/food/orders')}>
              <i className="fas fa-utensils"></i> Food Orders
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2>{modalConfig[modal]?.title}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              {modalLoading ? (
                <div className="dash-modal-loading">Loading...</div>
              ) : modalData.length === 0 ? (
                <div className="dash-modal-empty">No data to show.</div>
              ) : (
                <div className="table-wrap" style={{ boxShadow: 'none', borderRadius: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        {modalConfig[modal]?.cols.map(col => <th key={col}>{col}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(modal === 'totalRooms' || modal === 'availableRooms') && modalData.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.room_number}</strong></td>
                          <td className="text-capitalize">{item.room_type}</td>
                          <td>{item.floor}</td>
                          <td>{formatCurrency(item.price_per_night)}</td>
                          {modal === 'totalRooms' && (
                            <td><span className={`badge badge-${item.status}`}>{item.status.replace(/_/g, ' ')}</span></td>
                          )}
                        </tr>
                      ))}
                      {(modal === 'todayCheckIns') && modalData.map(item => (
                        <tr key={item.id}>
                          <td>{guestName(item)}</td>
                          <td>{item.room_number || 'N/A'}</td>
                          <td>{formatDate(item.check_in_date)}</td>
                          <td>{formatDate(item.check_out_date)}</td>
                          <td>{(item.adults || 0) + (item.children || 0)}</td>
                        </tr>
                      ))}
                      {(modal === 'todayCheckOuts') && modalData.map(item => (
                        <tr key={item.id}>
                          <td>{guestName(item)}</td>
                          <td>{item.room_number || 'N/A'}</td>
                          <td>{formatDate(item.check_out_date)}</td>
                          <td>{(item.adults || 0) + (item.children || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          position: relative;
          transition: all 0.25s ease;
        }
        .stat-card.clickable {
          cursor: pointer;
        }
        .stat-card.clickable:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
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
        .stat-info { display: flex; flex-direction: column; flex: 1; }
        .stat-value { font-size: 1.5rem; font-weight: 700; line-height: 1.2; }
        .stat-label { font-size: 0.85rem; color: var(--text-muted); }
        .stat-arrow {
          color: var(--border);
          font-size: 0.85rem;
          transition: var(--transition);
        }
        .stat-card.clickable:hover .stat-arrow {
          color: var(--text-muted);
          transform: translateX(3px);
        }

        .quick-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
        .quick-actions .btn { width: 100%; justify-content: center; }

        .dash-modal-loading,
        .dash-modal-empty {
          text-align: center;
          padding: 48px 20px;
          color: var(--text-muted);
        }

        .badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: capitalize;
        }
        .badge-available { background: #dcfce7; color: #166534; }
        .badge-occupied { background: #fee2e2; color: #991b1b; }
        .badge-cleaning { background: #fef3c7; color: #92400e; }
        .badge-maintenance { background: #f3f4f6; color: #374151; }
        .badge-out_of_order { background: #e5e7eb; color: #111827; }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .stat-card { padding: 14px; }
          .stat-value { font-size: 1.2rem; }
          .stat-icon { width: 40px; height: 40px; font-size: 1.1rem; }
          .stat-arrow { display: none; }
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchAll } from '../services/supabaseService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const toDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLastNDays = (n) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateStr(d));
  }
  return days;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [guestMap, setGuestMap] = useState({});
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const colors = {
    primary: '#6366f1', success: '#10b981', info: '#3b82f6',
    warning: '#f59e0b', accent: '#f43f5e', purple: '#8b5cf6',
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [roomsRes, bookingsRes, paymentsRes, ordersRes, guestsRes] = await Promise.all([
      fetchAll('rooms'),
      fetchAll('bookings', { filters: { status: { operator: 'in', value: ['confirmed', 'checked_in', 'checked_out'] } } }),
      fetchAll('payments', { orderBy: 'created_at', orderDir: 'desc' }),
      fetchAll('food_orders', { filters: { status: { operator: 'in', value: ['pending', 'preparing'] } } }),
      fetchAll('guests'),
    ]);
    if (roomsRes.data) setRooms(roomsRes.data);
    if (bookingsRes.data) setBookings(bookingsRes.data);
    if (paymentsRes.data) setPayments(paymentsRes.data);
    if (ordersRes.data) setPendingOrders(ordersRes.data);
    if (guestsRes.data) {
      const gMap = {};
      guestsRes.data.forEach(g => { gMap[g.id] = g.name; });
      setGuestMap(gMap);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { const i = setInterval(loadData, 30000); return () => clearInterval(i); }, [loadData]);

  const today = toDateStr(new Date());
  const totalRooms = rooms.length;

  const roomStatus = {
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
    maintenance: rooms.filter(r => ['maintenance', 'out_of_order'].includes(r.status)).length,
  };
  const occupiedRooms = roomStatus.occupied;
  const availableRooms = roomStatus.available;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const todayCheckIns = bookings.filter(b => b.check_in_date === today && b.status !== 'cancelled' && b.status !== 'checked_out');
  const todayCheckOuts = bookings.filter(b => b.check_out_date === today && b.status === 'checked_in');
  const activeBookings = bookings.filter(b => b.status === 'checked_in');
  const pendingCheckOuts = bookings.filter(b => b.check_out_date === today && (b.status === 'confirmed' || b.status === 'checked_in'));

  const todayPayments = payments.filter(p => {
    const pDate = p.created_at?.split('T')[0];
    return pDate === today && p.status === 'completed';
  });
  const todayRevenue = todayPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const last7Days = getLastNDays(7);
  const revenueLast7 = last7Days.map(day => {
    const dayPayments = payments.filter(p => {
      const pDate = p.created_at?.split('T')[0];
      return pDate === day && p.status === 'completed';
    });
    return dayPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  });

  const last10Days = getLastNDays(10);
  const occupancyLast10 = last10Days.map(day => {
    const occupied = bookings.filter(b => {
      if (b.status === 'cancelled' || b.status === 'checked_out') return false;
      return b.check_in_date <= day && b.check_out_date > day;
    }).length;
    return totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;
  });

  const occupancyChartData = {
    labels: last10Days.map(d => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }),
    datasets: [{
      label: 'Occupancy',
      data: occupancyLast10,
      fill: true,
      borderColor: colors.primary,
      backgroundColor: (ctx) => {
        if (!ctx.chart?.ctx) return 'rgba(99,102,241,0.1)';
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280);
        g.addColorStop(0, 'rgba(99,102,241,0.3)');
        g.addColorStop(1, 'rgba(99,102,241,0.02)');
        return g;
      },
      tension: 0.4,
      pointBackgroundColor: colors.primary,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 7,
      borderWidth: 2.5,
    }]
  };

  const occupancyOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b', titleFont: { size: 12 }, bodyFont: { size: 13 },
        padding: 12, cornerRadius: 8, displayColors: false,
        callbacks: { label: (ctx) => `${ctx.parsed.y}% Occupied` }
      }
    },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => `${v}%`, font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } }
    },
    interaction: { intersect: false, mode: 'index' },
  };

  const revenueChartData = {
    labels: last7Days.map(d => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }); }),
    datasets: [{
      label: 'Revenue',
      data: revenueLast7,
      backgroundColor: (ctx) => {
        if (!ctx.chart?.ctx) return 'rgba(16,185,129,0.6)';
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
        g.addColorStop(0, 'rgba(16,185,129,0.7)');
        g.addColorStop(1, 'rgba(16,185,129,0.15)');
        return g;
      },
      borderColor: colors.success,
      borderWidth: 1.5,
      borderRadius: 6,
      hoverBackgroundColor: colors.success,
    }]
  };

  const revenueOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b', padding: 12, cornerRadius: 8, displayColors: false,
        callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y) }
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => formatCurrency(v).replace('.00', ''), font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } }
    },
  };

  const doughnutData = {
    labels: ['Available', 'Occupied', 'Cleaning', 'Maintenance'],
    datasets: [{
      data: [roomStatus.available, roomStatus.occupied, roomStatus.cleaning, roomStatus.maintenance],
      backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#6b7280'],
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 11 } } },
      tooltip: {
        backgroundColor: '#1e293b', padding: 10, cornerRadius: 8,
        callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} (${totalRooms > 0 ? Math.round((ctx.parsed / totalRooms) * 100) : 0}%)` }
      }
    },
    cutout: '68%',
  };

  const stats = [
    { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: 'fa-building', color: colors.primary,
      detail: `${occupiedRooms} of ${totalRooms} rooms`, key: 'occupancy' },
    { label: "Today's Revenue", value: formatCurrency(todayRevenue), icon: 'fa-dollar-sign', color: colors.success,
      detail: `${todayPayments.length} payment(s)`, key: 'revenue' },
    { label: 'Active Bookings', value: activeBookings.length, icon: 'fa-calendar-check', color: colors.info,
      detail: `${todayCheckIns.length} check-ins today`, key: 'activeBookings' },
    { label: 'Available Rooms', value: availableRooms, icon: 'fa-door-open', color: colors.warning,
      detail: `${roomStatus.cleaning} in cleaning`, key: 'availableRooms' },
    { label: 'Pending Check-outs', value: pendingCheckOuts.length, icon: 'fa-sign-out-alt', color: colors.accent,
      detail: `${todayCheckOuts.length} due now`, key: 'pendingCheckouts' },
  ];

  const quickActions = [
    { label: 'New Booking', icon: 'fa-plus-circle', path: '/bookings/new', color: colors.primary },
    { label: 'Check In/Out', icon: 'fa-exchange-alt', path: '/check-in-out', color: colors.success },
    { label: 'Food Orders', icon: 'fa-utensils', path: '/food/orders', color: colors.warning },
    { label: 'Housekeeping', icon: 'fa-broom', path: '/housekeeping', color: colors.info },
    { label: 'Invoices', icon: 'fa-file-invoice', path: '/invoices', color: colors.accent },
    { label: 'Reports', icon: 'fa-chart-bar', path: '/reports', color: colors.purple },
    { label: 'Room Calendar', icon: 'fa-calendar-alt', path: '/rooms/calendar', color: '#06b6d4' },
    { label: 'Guests', icon: 'fa-users', path: '/guests', color: '#ec4899' },
  ];

  async function openModal(key) {
    setModalLoading(true);
    setModal(key);
    setModalData([]);
    try {
      let data = [];
      switch (key) {
        case 'occupancy': {
          const allBookings = bookings.filter(b => b.status === 'checked_in');
          const roomIds = [...new Set(allBookings.map(b => b.room_id).filter(Boolean))];
          const roomsData = roomIds.length ? (await fetchAll('rooms', { filters: { id: roomIds } })).data : [];
          const roomMap = Object.fromEntries((roomsData || []).map(r => [r.id, r]));
          data = allBookings.map(b => ({ ...b, room_number: roomMap[b.room_id]?.room_number || 'N/A' }));
          break;
        }
        case 'revenue':
          data = todayPayments;
          break;
        case 'activeBookings': {
          const active = bookings.filter(b => b.status === 'checked_in');
          const rIds = [...new Set(active.map(b => b.room_id).filter(Boolean))];
          const rData = rIds.length ? (await fetchAll('rooms', { filters: { id: rIds } })).data : [];
          const rMap = Object.fromEntries((rData || []).map(r => [r.id, r]));
          data = active.map(b => ({ ...b, room_number: rMap[b.room_id]?.room_number || 'N/A' }));
          break;
        }
        case 'availableRooms':
          data = rooms.filter(r => r.status === 'available');
          break;
        case 'pendingCheckouts': {
          const pending = bookings.filter(b => b.check_out_date === today && (b.status === 'confirmed' || b.status === 'checked_in'));
          const pIds = [...new Set(pending.map(b => b.room_id).filter(Boolean))];
          const pData = pIds.length ? (await fetchAll('rooms', { filters: { id: pIds } })).data : [];
          const pMap = Object.fromEntries((pData || []).map(r => [r.id, r]));
          data = pending.map(b => ({ ...b, room_number: pMap[b.room_id]?.room_number || 'N/A' }));
          break;
        }
      }
      setModalData(data);
    } catch (err) {
      console.error('Modal data error', err);
    } finally {
      setModalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">{formatDate(new Date())} · {profile?.hotel_name || 'Hotel'}</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadData}>
          <i className="fas fa-sync-alt" /> Refresh
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card clickable" style={{ borderTop: `3px solid ${s.color}` }}
            onClick={() => openModal(s.key)}>
            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
              <span className="stat-detail">{s.detail}</span>
            </div>
            <i className="fas fa-chevron-right stat-arrow" />
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3><i className="fas fa-chart-area" style={{ color: colors.primary }} /> Occupancy Rate</h3>
            <span className="text-muted">Last 10 days</span>
          </div>
          <div className="chart-body"><Line data={occupancyChartData} options={occupancyOptions} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h3><i className="fas fa-chart-bar" style={{ color: colors.success }} /> Revenue</h3>
            <span className="text-muted">Last 7 days</span>
          </div>
          <div className="chart-body"><Bar data={revenueChartData} options={revenueOptions} /></div>
        </div>
      </div>

      <div className="bottom-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3><i className="fas fa-chart-pie" style={{ color: colors.purple }} /> Room Status</h3>
          </div>
          <div className="chart-body doughnut-body"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h3><i className="fas fa-calendar-day" style={{ color: colors.info }} /> Today's Agenda</h3>
          </div>
          <div className="agenda-body">
            <div className="agenda-item" onClick={() => openModal('activeBookings')}>
              <div className="agenda-icon" style={{ background: '#ecfdf5', color: colors.success }}><i className="fas fa-sign-in-alt" /></div>
              <div><strong>{todayCheckIns.length}</strong> Check-ins<div className="text-muted" style={{fontSize:12}}>Arriving today</div></div>
            </div>
            <div className="agenda-item" onClick={() => openModal('pendingCheckouts')}>
              <div className="agenda-icon" style={{ background: '#fff1f2', color: colors.accent }}><i className="fas fa-sign-out-alt" /></div>
              <div><strong>{todayCheckOuts.length}</strong> Check-outs<div className="text-muted" style={{fontSize:12}}>Departing today</div></div>
            </div>
            <div className="agenda-item">
              <div className="agenda-icon" style={{ background: '#fffbeb', color: colors.warning }}><i className="fas fa-utensils" /></div>
              <div><strong>{pendingOrders.length}</strong> Pending Orders<div className="text-muted" style={{fontSize:12}}>Food to prepare</div></div>
            </div>
            <div className="agenda-item" onClick={() => openModal('occupancy')}>
              <div className="agenda-icon" style={{ background: '#eef2ff', color: colors.primary }}><i className="fas fa-bed" /></div>
              <div><strong>{occupiedRooms}</strong> Occupied Rooms<div className="text-muted" style={{fontSize:12}}>{occupancyRate}% occupancy</div></div>
            </div>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h3><i className="fas fa-bolt" style={{ color: colors.warning }} /> Quick Actions</h3>
          </div>
          <div className="quick-actions-grid">
            {quickActions.map((a, i) => (
              <button key={i} className="quick-action-btn" onClick={() => navigate(a.path)}>
                <div className="qa-icon" style={{ background: `${a.color}15`, color: a.color }}><i className={`fas ${a.icon}`} /></div>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2>{stats.find(s => s.key === modal)?.label || 'Details'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-body">
              {modalLoading ? (
                <div className="dash-modal-loading"><div className="spinner-sm" /> Loading...</div>
              ) : modalData.length === 0 ? (
                <div className="dash-modal-empty"><i className="fas fa-inbox" /> No data to show.</div>
              ) : modal === 'revenue' ? (
                <div className="table-wrap"><table>
                  <thead><tr><th>Amount</th><th>Method</th><th>Reference</th><th>Time</th></tr></thead>
                  <tbody>{modalData.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{formatCurrency(p.amount)}</strong></td>
                      <td>{p.payment_method_name || '-'}</td>
                      <td>{p.reference || '-'}</td>
                      <td style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>{new Date(p.created_at).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              ) : modal === 'availableRooms' ? (
                <div className="room-badge-list">
                  {modalData.map((r, i) => (
                    <span key={i} className="badge badge-available"><i className="fas fa-door-open" /> Room {r.room_number || r.name}</span>
                  ))}
                </div>
              ) : (
                <div className="table-wrap"><table>
                  <thead><tr><th>Guest</th><th>Room</th><th>Check-In</th><th>Check-Out</th></tr></thead>
                  <tbody>{modalData.map((b, i) => (
                    <tr key={i}>
                      <td>{b.guest_name || guestMap[b.guest_id] || 'Guest'}</td>
                      <td><strong>{b.room_number || 'N/A'}</strong></td>
                      <td>{b.check_in_date ? formatDate(b.check_in_date) : '-'}</td>
                      <td>{b.check_out_date ? formatDate(b.check_out_date) : '-'}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: var(--bg-card);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          transition: all 0.2s ease;
          cursor: pointer;
          border-top: 3px solid;
        }
        .stat-card:hover {
          box-shadow: var(--shadow);
          transform: translateY(-1px);
        }
        .stat-icon {
          width: 34px; height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .stat-info { display: flex; flex-direction: column; flex: 1; min-width: 0; overflow: hidden; gap: 0; }
        .stat-value { font-size: 1rem; font-weight: 700; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-label { font-size: 0.68rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-detail { font-size: 0.62rem; color: var(--text-muted); opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-arrow { display: none; }

        .charts-row {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .bottom-row {
          display: grid;
          grid-template-columns: 1fr 1.1fr 1.2fr;
          gap: 14px;
        }
        .chart-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow);
          padding: 18px;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .chart-header h3 { font-size: 0.92rem; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0; }
        .chart-header h3 i { font-size: 0.85rem; }
        .chart-body { height: 260px; position: relative; }
        .doughnut-body { height: 250px; display: flex; align-items: center; justify-content: center; }

        .agenda-body { display: flex; flex-direction: column; gap: 8px; }
        .agenda-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; border-radius: var(--radius);
          transition: all 0.2s; cursor: pointer;
        }
        .agenda-item:hover { background: var(--bg-alt); }
        .agenda-icon {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 1rem;
        }
        .agenda-body strong { font-size: 1.15rem; margin-right: 4px; }
        .agenda-body > div > div:last-child { line-height: 1.3; }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .quick-action-btn {
          display: flex; flex-direction: column;
          align-items: center; gap: 6px;
          padding: 14px 8px;
          border: 1px solid var(--border-light);
          border-radius: var(--radius);
          background: var(--bg-card);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.72rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .quick-action-btn:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow);
          transform: translateY(-1px);
        }
        .qa-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.95rem;
        }

        .dash-modal-loading, .dash-modal-empty {
          text-align: center; padding: 48px 20px;
          color: var(--text-muted);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .spinner-sm {
          width: 24px; height: 24px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        .room-badge-list {
          display: flex; flex-wrap: wrap; gap: 8px;
          padding: 8px 0;
        }
        .room-badge-list .badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 100px;
          font-size: 0.8rem; font-weight: 500;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
          .bottom-row { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .stat-card { padding: 10px 12px; gap: 8px; }
          .stat-value { font-size: 0.92rem; }
          .stat-icon { width: 30px; height: 30px; font-size: 0.82rem; }
          .stat-detail { display: none; }
          .charts-row { grid-template-columns: 1fr; }
          .bottom-row { grid-template-columns: 1fr; }
          .chart-body { height: 220px; }
          .quick-actions-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .quick-actions-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}

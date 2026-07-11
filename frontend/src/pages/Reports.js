import { useState, useEffect } from 'react';
import { fetchAll } from '../services/supabaseService';
import { formatCurrency } from '../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [r, b, i, p, f] = await Promise.all([
        fetchAll('rooms'),
        fetchAll('bookings'),
        fetchAll('invoices'),
        fetchAll('payments'),
        fetchAll('food_orders'),
      ]);
      setRooms(r.data || []);
      setBookings(b.data || []);
      setInvoices(i.data || []);
      setPayments(p.data || []);
      setFoodOrders(f.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="loading-spinner">Loading reports...</div>;

  const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.amount_paid || 0), 0);
  const pendingRevenue = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((s, i) => s + parseFloat(i.balance || i.total || 0), 0);

  const roomStatusCounts = { available: 0, occupied: 0, cleaning: 0, maintenance: 0 };
  rooms.forEach(r => { if (roomStatusCounts[r.status] !== undefined) roomStatusCounts[r.status]++; });

  const bookingStatusCounts = { confirmed: 0, checked_in: 0, checked_out: 0, cancelled: 0 };
  bookings.forEach(b => { if (bookingStatusCounts[b.status] !== undefined) bookingStatusCounts[b.status]++; });

  const foodStatusCounts = { pending: 0, preparing: 0, delivered: 0, cancelled: 0 };
  foodOrders.forEach(f => { if (foodStatusCounts[f.status] !== undefined) foodStatusCounts[f.status]++; });

  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyBookings = Array(12).fill(0);
  const monthlyRevenue = Array(12).fill(0);
  bookings.forEach(b => {
    if (b.created_at) {
      const m = new Date(b.created_at).getMonth();
      monthlyBookings[m]++;
    }
  });
  invoices.forEach(i => {
    if (i.created_at && i.amount_paid) {
      const m = new Date(i.created_at).getMonth();
      monthlyRevenue[m] += parseFloat(i.amount_paid);
    }
  });

  const paymentMethodTotals = {};
  payments.forEach(p => {
    const method = p.payment_method_id || 'unknown';
    paymentMethodTotals[method] = (paymentMethodTotals[method] || 0) + parseFloat(p.amount || 0);
  });

  const primaryColor = '#1a1a2e';
  const accentColor = '#e94560';
  const chartColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Revenue, occupancy, and operational insights</p>
        </div>
      </div>

      <div className="stats-grid mb-3">
        <div className="stat-card" style={{ borderTopColor: '#22c55e' }}>
          <div className="stat-icon" style={{ background: '#22c55e18', color: '#22c55e' }}>
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(totalRevenue)}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#f59e0b' }}>
          <div className="stat-icon" style={{ background: '#f59e0b18', color: '#f59e0b' }}>
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(pendingRevenue)}</span>
            <span className="stat-label">Pending / Outstanding</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#3b82f6' }}>
          <div className="stat-icon" style={{ background: '#3b82f618', color: '#3b82f6' }}>
            <i className="fas fa-door-open"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{rooms.length}</span>
            <span className="stat-label">Total Rooms</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTopColor: '#8b5cf6' }}>
          <div className="stat-icon" style={{ background: '#8b5cf618', color: '#8b5cf6' }}>
            <i className="fas fa-concierge-bell"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{foodOrders.length}</span>
            <span className="stat-label">Food Orders</span>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-3">
        <div className="card">
          <h3 className="mb-2">Monthly Revenue</h3>
          <Line data={{
            labels: monthlyLabels,
            datasets: [{
              label: 'Revenue',
              data: monthlyRevenue,
              borderColor: accentColor,
              backgroundColor: accentColor + '20',
              fill: true,
              tension: 0.3,
              pointBackgroundColor: accentColor,
            }]
          }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="card">
          <h3 className="mb-2">Monthly Bookings</h3>
          <Bar data={{
            labels: monthlyLabels,
            datasets: [{
              label: 'Bookings',
              data: monthlyBookings,
              backgroundColor: chartColors,
              borderRadius: 4,
            }]
          }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="grid-3 mb-3">
        <div className="card">
          <h3 className="mb-2">Room Status</h3>
          <Doughnut data={{
            labels: Object.keys(roomStatusCounts).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
            datasets: [{
              data: Object.values(roomStatusCounts),
              backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#6b7280'],
              borderWidth: 0,
            }]
          }} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>
        <div className="card">
          <h3 className="mb-2">Booking Status</h3>
          <Doughnut data={{
            labels: Object.keys(bookingStatusCounts).map(k => k.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())),
            datasets: [{
              data: Object.values(bookingStatusCounts),
              backgroundColor: ['#3b82f6', '#22c55e', '#6b7280', '#ef4444'],
              borderWidth: 0,
            }]
          }} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>
        <div className="card">
          <h3 className="mb-2">Food Orders</h3>
          <Doughnut data={{
            labels: Object.keys(foodStatusCounts).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
            datasets: [{
              data: Object.values(foodStatusCounts),
              backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444'],
              borderWidth: 0,
            }]
          }} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
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
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .mb-2 { margin-bottom: 12px; }
        .mb-3 { margin-bottom: 20px; }
        .card { padding: 20px; }
        @media (max-width: 768px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
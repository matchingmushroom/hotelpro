import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAll, updateRecord } from '../services/supabaseService';
import { formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { showSuccess, showError, showConfirm } from '../components/common/ConfirmDialog';

export default function CheckInOut() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('booking');

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('checkin');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (preselectedId && bookings.length) {
      const el = document.getElementById(`booking-${preselectedId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [preselectedId, bookings]);

  async function loadBookings() {
    try {
      const { data } = await fetchAll('bookings', { orderBy: 'check_in_date' });
      setBookings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(booking) {
    const confirmed = await showConfirm({
      title: 'Check In Guest?',
      text: `Check in ${booking.guest_name || 'Guest'} to Room ${booking.room_id?.slice(0, 8)}?`,
      confirmText: 'Check In',
    });
    if (!confirmed) return;
    try {
      await updateRecord('bookings', booking.id, { status: 'checked_in' });
      await updateRecord('rooms', booking.room_id, { status: 'occupied' });
      showSuccess('Checked In', `${booking.guest_name} checked in successfully`);
      loadBookings();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleCheckOut(booking) {
    const confirmed = await showConfirm({
      title: 'Check Out Guest?',
      text: `Check out ${booking.guest_name || 'Guest'} from Room ${booking.room_id?.slice(0, 8)}?`,
      confirmText: 'Check Out',
    });
    if (!confirmed) return;
    try {
      await updateRecord('bookings', booking.id, { status: 'checked_out' });
      await updateRecord('rooms', booking.room_id, { status: 'cleaning' });
      showSuccess('Checked Out', `${booking.guest_name} checked out. Room marked for cleaning.`);
      loadBookings();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  const checkIns = bookings.filter(b =>
    b.status === 'confirmed' &&
    (tab === 'checkin')
  );

  const checkOuts = bookings.filter(b =>
    b.status === 'checked_in'
  );

  const filtered = (tab === 'checkin' ? checkIns : checkOuts).filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (b.guest_name || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Check-In / Check-Out</h1>
        <p>Manage guest arrivals and departures</p>
      </div>

      <div className="tabs mb-2">
        <button className={`tab ${tab === 'checkin' ? 'active' : ''}`} onClick={() => setTab('checkin')}>
          <i className="fas fa-sign-in-alt"></i> Check-In ({checkIns.length})
        </button>
        <button className={`tab ${tab === 'checkout' ? 'active' : ''}`} onClick={() => setTab('checkout')}>
          <i className="fas fa-sign-out-alt"></i> Check-Out ({checkOuts.length})
        </button>
      </div>

      <div className="card mb-2">
        <input className="form-control" placeholder="Search by guest name..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="booking-cards">
        {filtered.length === 0 && (
          <div className="card text-center text-muted py-3">
            No {tab === 'checkin' ? 'guests to check in' : 'guests to check out'}.
          </div>
        )}
        {filtered.map(booking => (
          <div key={booking.id} id={`booking-${booking.id}`} className="booking-card card">
            <div className="booking-card-main">
              <div className="booking-card-info">
                <div className="booking-card-name">
                  {booking.guest_name || 'Unknown Guest'}
                  <StatusBadge status={booking.status} />
                </div>
                <div className="booking-card-details">
                  <span><i className="fas fa-door-open"></i> Room {booking.room_id?.slice(0, 8)}</span>
                  <span><i className="fas fa-calendar-check"></i> {formatDate(booking.check_in_date)} → {formatDate(booking.check_out_date)}</span>
                  <span><i className="fas fa-user-friends"></i> {booking.adults + (booking.children || 0)} guests</span>
                  {booking.special_requests && (
                    <span><i className="fas fa-comment"></i> {booking.special_requests}</span>
                  )}
                </div>
              </div>
              <div className="booking-card-action">
                {tab === 'checkin' && (
                  <button className="btn btn-primary btn-lg" onClick={() => handleCheckIn(booking)}>
                    <i className="fas fa-sign-in-alt"></i> Check In
                  </button>
                )}
                {tab === 'checkout' && (
                  <button className="btn btn-accent btn-lg" onClick={() => handleCheckOut(booking)}>
                    <i className="fas fa-sign-out-alt"></i> Check Out
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .tabs { display: flex; gap: 0; background: var(--white); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); }
        .tab {
          flex: 1; padding: 12px 24px; border: none; cursor: pointer;
          font-size: 0.9rem; font-weight: 500; background: var(--white); color: var(--text-muted);
          transition: var(--transition); border-bottom: 2px solid transparent;
        }
        .tab:hover { color: var(--text); background: var(--bg); }
        .tab.active { color: var(--primary); border-bottom-color: var(--primary); background: var(--bg); }
        .booking-cards { display: flex; flex-direction: column; gap: 12px; }
        .booking-card {
          transition: var(--transition);
        }
        .booking-card:hover { box-shadow: var(--shadow-md); }
        .booking-card-main { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .booking-card-info { flex: 1; }
        .booking-card-name {
          display: flex; align-items: center; gap: 8px;
          font-size: 1.1rem; font-weight: 600; margin-bottom: 8px;
        }
        .booking-card-details {
          display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.85rem; color: var(--text-secondary);
        }
        .booking-card-details i { width: 16px; color: var(--text-muted); }
        .booking-card-action { flex-shrink: 0; }
        .py-3 { padding-top: 40px; padding-bottom: 40px; }
      `}</style>
    </div>
  );
}

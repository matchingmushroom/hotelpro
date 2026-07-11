import { useState, useEffect } from 'react';
import { fetchAll, removeRecord } from '../services/supabaseService';
import { formatDate, formatCurrency } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { showConfirm, showSuccess, showError } from '../components/common/ConfirmDialog';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const { data } = await fetchAll('bookings', { orderBy: 'check_in_date', orderDir: 'desc' });
      setBookings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(booking) {
    const confirmed = await showConfirm({
      title: `Cancel Booking?`,
      text: `Cancel booking for ${booking.guest_name || 'Guest'}?`,
      confirmText: 'Cancel Booking',
    });
    if (!confirmed) return;
    try {
      const { updateRecord } = await import('../services/supabaseService');
      await updateRecord('bookings', booking.id, { status: 'cancelled' });
      await updateRecord('rooms', booking.room_id, { status: 'available' });
      showSuccess('Cancelled', 'Booking cancelled');
      loadBookings();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  const filtered = bookings.filter(b => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (b.guest_name || '').toLowerCase();
      return name.includes(q);
    }
    return true;
  });

  if (loading) return <div className="loading-spinner">Loading bookings...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bookings</h1>
          <p>{bookings.length} total &middot; {bookings.filter(b => b.status === 'confirmed').length} upcoming</p>
        </div>
        <div className="flex gap-1">
          <button className="btn btn-primary" onClick={() => window.location.href = '/bookings/new'}>
            <i className="fas fa-plus"></i> New Booking
          </button>
          <button className="btn btn-outline" onClick={() => window.location.href = '/bookings/group'}>
            <i className="fas fa-users"></i> Group
          </button>
          <button className="btn btn-outline" onClick={() => window.location.href = '/bookings/walk-in'}>
            <i className="fas fa-walking"></i> Walk-In
          </button>
        </div>
      </div>

      <div className="card mb-2 flex-between">
        <input className="form-control" style={{ maxWidth: 300 }} placeholder="Search by guest name..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-control" style={{ maxWidth: 180 }} value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Guest</th>
              <th>Room</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Nights</th>
              <th>Guests</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => {
              const nights = Math.max(1, Math.ceil((new Date(b.check_out_date) - new Date(b.check_in_date)) / (1000*60*60*24)));
              return (
                <tr key={b.id}>
                  <td><strong>{b.guest_name || `Guest #${b.guest_id}`}</strong></td>
                  <td>Room {b.room_id?.slice(0, 8) || '-'}</td>
                  <td>{formatDate(b.check_in_date)}</td>
                  <td>{formatDate(b.check_out_date)}</td>
                  <td>{nights}</td>
                  <td>{b.adults + (b.children || 0)}</td>
                  <td className="text-capitalize">{b.booking_type}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <div className="table-actions">
                      {b.status === 'confirmed' && (
                        <button className="btn-icon btn-icon-danger" title="Cancel"
                          onClick={() => handleCancel(b)}>
                          <i className="fas fa-ban"></i>
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button className="btn-icon" title="Check In"
                          onClick={() => window.location.href = `/check-in-out?booking=${b.id}`}>
                          <i className="fas fa-sign-in-alt"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="9" className="text-center text-muted py-3">
                {search ? 'No matching bookings.' : 'No bookings yet. Create one to get started.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .table-actions { display: flex; gap: 4px; }
        .btn-icon {
          background: none; border: none;
          width: 32px; height: 32px;
          border-radius: 6px;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-secondary);
          transition: var(--transition);
        }
        .btn-icon:hover { background: var(--bg); color: var(--primary); }
        .btn-icon-danger:hover { background: #fef2f2; color: var(--error); }
        .py-3 { padding-top: 24px; padding-bottom: 24px; }
      `}</style>
    </div>
  );
}

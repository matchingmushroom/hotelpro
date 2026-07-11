import { useState, useEffect } from 'react';
import { fetchAll, insertRecord, updateRecord, removeRecord } from '../services/supabaseService';
import { formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { showConfirm, showSuccess, showError } from '../components/common/ConfirmDialog';

const defaultForm = {
  guest_name: '',
  guest_phone: '',
  guest_email: '',
  preferred_room_type: 'double',
  check_in_date: '',
  check_out_date: '',
  notes: '',
};

export default function Waitlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });

  useEffect(() => {
    loadWaitlist();
  }, []);

  async function loadWaitlist() {
    try {
      const { data } = await fetchAll('waitlist', { orderBy: 'created_at', orderDir: 'desc' });
      setEntries(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.guest_name) return showError('Required', 'Guest name is required');
    try {
      await insertRecord('waitlist', form);
      showSuccess('Added', `${form.guest_name} added to waitlist`);
      setShowForm(false);
      setForm({ ...defaultForm });
      loadWaitlist();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleStatusChange(entry, newStatus) {
    try {
      await updateRecord('waitlist', entry.id, { status: newStatus });
      showSuccess('Updated', `Status changed to ${newStatus}`);
      loadWaitlist();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleDelete(entry) {
    const confirmed = await showConfirm({
      title: 'Remove from waitlist?',
      text: `Remove ${entry.guest_name}?`,
      confirmText: 'Remove',
    });
    if (!confirmed) return;
    try {
      await removeRecord('waitlist', entry.id);
      loadWaitlist();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  if (loading) return <div className="loading-spinner">Loading waitlist...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Waitlist</h1>
          <p>{entries.filter(e => e.status === 'waiting').length} waiting</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i> Add to Waitlist
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Guest Name</th>
              <th>Contact</th>
              <th>Preferred Room</th>
              <th>Dates</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id}>
                <td><strong>{entry.guest_name}</strong></td>
                <td>
                  {entry.guest_phone && <div>{entry.guest_phone}</div>}
                  {entry.guest_email && <div className="text-muted">{entry.guest_email}</div>}
                </td>
                <td className="text-capitalize">{entry.preferred_room_type}</td>
                <td>
                  {entry.check_in_date && formatDate(entry.check_in_date)}
                  {entry.check_out_date && ` → ${formatDate(entry.check_out_date)}`}
                </td>
                <td className="text-muted">{entry.notes || '-'}</td>
                <td>
                  <select className="status-select" value={entry.status}
                    onChange={e => handleStatusChange(entry, e.target.value)}>
                    <option value="waiting">Waiting</option>
                    <option value="notified">Notified</option>
                    <option value="booked">Booked</option>
                    <option value="expired">Expired</option>
                  </select>
                </td>
                <td>
                  <button className="btn-icon btn-icon-danger" title="Remove"
                    onClick={() => handleDelete(entry)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan="7" className="text-center text-muted py-3">
                No one on the waitlist. Click "Add to Waitlist" to add a guest.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add to Waitlist</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Guest Name *</label>
                  <input className="form-control" value={form.guest_name}
                    onChange={e => setForm(prev => ({ ...prev, guest_name: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input className="form-control" value={form.guest_phone}
                      onChange={e => setForm(prev => ({ ...prev, guest_phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input className="form-control" value={form.guest_email}
                      onChange={e => setForm(prev => ({ ...prev, guest_email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Preferred Room Type</label>
                  <select className="form-control" value={form.preferred_room_type}
                    onChange={e => setForm(prev => ({ ...prev, preferred_room_type: e.target.value }))}>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="twin">Twin</option>
                    <option value="suite">Suite</option>
                    <option value="deluxe">Deluxe</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Check-In Date</label>
                    <input type="date" className="form-control" value={form.check_in_date}
                      onChange={e => setForm(prev => ({ ...prev, check_in_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Check-Out Date</label>
                    <input type="date" className="form-control" value={form.check_out_date}
                      onChange={e => setForm(prev => ({ ...prev, check_out_date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add to Waitlist</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .status-select {
          padding: 4px 8px; border-radius: 100px;
          font-size: 0.75rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.03em;
          cursor: pointer; outline: none; -webkit-appearance: none;
          background: var(--bg); color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .btn-icon {
          background: none; border: none;
          width: 32px; height: 32px; border-radius: 6px;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-secondary);
          transition: var(--transition);
        }
        .btn-icon-danger:hover { background: #fef2f2; color: var(--error); }
        .py-3 { padding-top: 24px; padding-bottom: 24px; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }
        .modal-content {
          background: var(--white); border-radius: var(--radius-lg);
          width: 100%; max-width: 520px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px; border-bottom: 1px solid var(--border);
        }
        .modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
        .modal-body { padding: 24px; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 8px;
          padding: 16px 24px; border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}

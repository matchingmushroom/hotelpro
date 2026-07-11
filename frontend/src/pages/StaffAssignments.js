import { useState, useEffect } from 'react';
import { fetchAll, insertRecord, updateRecord } from '../services/supabaseService';
import { formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { showSuccess, showError } from '../components/common/ConfirmDialog';

export default function StaffAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const [form, setForm] = useState({
    staff_id: '', room_id: '', assignment_type: 'cleaning', notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [assignRes, roomsRes, staffRes] = await Promise.all([
        fetchAll('staff_assignments', { orderBy: 'assignment_date', orderDir: 'desc' }),
        fetchAll('rooms', { orderBy: 'room_number' }),
        fetchAll('profiles', { filters: { role: ['housekeeping', 'housekeeping_manager'].map(r => ({ operator: 'in', value: `(${r})` })) } }),
      ]);
      setAssignments(assignRes.data || []);
      setRooms(roomsRes.data || []);
      setStaff(staffRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.staff_id || !form.room_id) return showError('Required', 'Select staff and room');
    try {
      await insertRecord('staff_assignments', {
        ...form,
        assignment_date: filterDate,
      });
      showSuccess('Assigned', 'Staff assigned to room');
      setShowForm(false);
      setForm({ staff_id: '', room_id: '', assignment_type: 'cleaning', notes: '' });
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateRecord('staff_assignments', id, { status });
      showSuccess('Updated', `Status changed to ${status}`);
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  const filtered = assignments.filter(a => a.assignment_date === filterDate);

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Staff Assignments</h1>
          <p>Assign housekeeping staff to rooms</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i> New Assignment
        </button>
      </div>

      <div className="card mb-2" style={{ maxWidth: 240 }}>
        <input type="date" className="form-control" value={filterDate}
          onChange={e => setFilterDate(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Staff</th>
              <th>Room</th>
              <th>Type</th>
              <th>Date</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const s = staff.find(st => st.id === a.staff_id);
              const room = rooms.find(r => r.id === a.room_id);
              return (
                <tr key={a.id}>
                  <td><strong>{s?.name || a.staff_id?.slice(0, 8)}</strong></td>
                  <td>Room {room?.room_number || a.room_id?.slice(0, 8)}</td>
                  <td className="text-capitalize">{a.assignment_type?.replace(/_/g, ' ')}</td>
                  <td>{formatDate(a.assignment_date)}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="text-muted">{a.notes || '-'}</td>
                  <td>
                    <select className="status-select" value={a.status}
                      onChange={e => handleStatusChange(a.id, e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="text-center text-muted py-3">
                No assignments for this date.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Assignment</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Staff Member *</label>
                  <select className="form-control" value={form.staff_id}
                    onChange={e => setForm(p => ({ ...p, staff_id: e.target.value }))}>
                    <option value="">Select staff...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role?.replace(/_/g, ' ')})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Room *</label>
                  <select className="form-control" value={form.room_id}
                    onChange={e => setForm(p => ({ ...p, room_id: e.target.value }))}>
                    <option value="">Select room...</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.room_number} - {r.room_type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assignment Type</label>
                  <select className="form-control" value={form.assignment_type}
                    onChange={e => setForm(p => ({ ...p, assignment_type: e.target.value }))}>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="checkout_cleaning">Check-Out Cleaning</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="form-control" value={filterDate} disabled />
                  <small className="text-muted">Use the date filter above to change</small>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .status-select {
          padding: 4px 8px; border-radius: 100px;
          font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
          cursor: pointer; outline: none;
          background: var(--bg); color: var(--text-secondary);
          border: 1px solid var(--border); -webkit-appearance: none;
        }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
        }
        .modal-content {
          background: var(--white); border-radius: var(--radius-lg);
          width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); }
        .modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
        .modal-body { padding: 24px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--border); }
        .py-3 { padding-top: 24px; padding-bottom: 24px; }
      `}</style>
    </div>
  );
}

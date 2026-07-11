import { useState, useEffect } from 'react';
import { fetchAll, insertRecord, updateRecord, removeRecord } from '../services/supabaseService';
import { formatDate, formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { showConfirm, showSuccess, showError } from '../components/common/ConfirmDialog';

const priorityOrder = { high: 0, medium: 1, low: 2 };

export default function Housekeeping() {
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const [form, setForm] = useState({ room_id: '', priority: 'medium', notes: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [reqRes, roomsRes, staffRes] = await Promise.all([
        fetchAll('cleaning_requests', { orderBy: 'created_at', orderDir: 'desc' }),
        fetchAll('rooms', { orderBy: 'room_number' }),
        fetchAll('profiles', { filters: { role: ['housekeeping', 'housekeeping_manager'].map(r => ({ operator: 'in', value: `(${r})` })) } }),
      ]);
      setRequests(reqRes.data || []);
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
    if (!form.room_id) return showError('Required', 'Select a room');
    try {
      await insertRecord('cleaning_requests', form);
      showSuccess('Created', 'Cleaning request added');
      setShowForm(false);
      setForm({ room_id: '', priority: 'medium', notes: '' });
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleAssign(request) {
    try {
      const staffList = staff.filter(s => s.role === 'housekeeping');
      if (staffList.length === 0) return showError('No staff', 'Add housekeeping staff first');
      await updateRecord('cleaning_requests', request.id, {
        assigned_to: staffList[0].id,
        status: 'in_progress',
      });
      showSuccess('Assigned', 'Task assigned to available staff');
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleComplete(request) {
    try {
      await updateRecord('cleaning_requests', request.id, { status: 'completed' });
      await updateRecord('rooms', request.room_id, { status: 'available' });
      showSuccess('Completed', 'Room marked available');
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleDelete(request) {
    const confirmed = await showConfirm({ title: 'Delete request?', text: 'This cannot be undone.', confirmText: 'Delete' });
    if (!confirmed) return;
    try {
      await removeRecord('cleaning_requests', request.id);
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  const sorted = [...requests].sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
  const filtered = statusFilter ? sorted.filter(r => r.status === statusFilter) : sorted;

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Housekeeping</h1>
          <p>{requests.filter(r => r.status !== 'completed').length} active tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i> New Request
        </button>
      </div>

      <div className="card mb-2 flex-between">
        <select className="form-control" style={{ maxWidth: 200 }} value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <span className="text-muted">{filtered.length} requests</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Room</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Notes</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(req => {
              const room = rooms.find(r => r.id === req.room_id);
              const assignee = staff.find(s => s.id === req.assigned_to);
              const priorityColor = req.priority === 'high' ? 'var(--error)' : req.priority === 'medium' ? 'var(--warning)' : 'var(--text-muted)';
              return (
                <tr key={req.id}>
                  <td><strong>{room?.room_number || req.room_id?.slice(0, 8)}</strong></td>
                  <td>
                    <span className="priority-badge" style={{ background: priorityColor + '18', color: priorityColor }}>
                      {req.priority}
                    </span>
                  </td>
                  <td><StatusBadge status={req.status} /></td>
                  <td>{assignee?.name || req.assigned_to?.slice(0, 8) || <span className="text-muted">Unassigned</span>}</td>
                  <td className="text-muted">{req.notes || '-'}</td>
                  <td className="text-muted">{formatDate(req.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      {req.status === 'pending' && (
                        <button className="btn-icon" title="Assign" onClick={() => handleAssign(req)}>
                          <i className="fas fa-user-check"></i>
                        </button>
                      )}
                      {req.status === 'in_progress' && (
                        <button className="btn-icon" style={{ color: 'var(--success)' }} title="Complete" onClick={() => handleComplete(req)}>
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDelete(req)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="text-center text-muted py-3">No cleaning requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Cleaning Request</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Room *</label>
                  <select className="form-control" value={form.room_id}
                    onChange={e => setForm(p => ({ ...p, room_id: e.target.value }))}>
                    <option value="">Select room...</option>
                    {rooms.filter(r => r.status !== 'available' || true).map(r => (
                      <option key={r.id} value={r.id}>{r.room_number} - {r.room_type} [{r.status}]</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="form-control" value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="form-control" rows={3} value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .priority-badge {
          display: inline-block; padding: 2px 10px; border-radius: 100px;
          font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
        }
        .table-actions { display: flex; gap: 4px; }
        .btn-icon {
          background: none; border: none; width: 32px; height: 32px;
          border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-secondary); transition: var(--transition);
        }
        .btn-icon:hover { background: var(--bg); color: var(--primary); }
        .btn-icon-danger:hover { background: #fef2f2; color: var(--error); }
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

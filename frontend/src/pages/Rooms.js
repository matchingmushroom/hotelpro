import { useState, useEffect } from 'react';
import { fetchAll, insertRecord, updateRecord, removeRecord } from '../services/supabaseService';
import { formatCurrency } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { showConfirm, showSuccess, showError } from '../components/common/ConfirmDialog';
import RoomForm from '../components/rooms/RoomForm';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const { data } = await fetchAll('rooms', { orderBy: 'room_number' });
      setRooms(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(roomData) {
    try {
      if (editRoom) {
        await updateRecord('rooms', editRoom.id, roomData);
        await showSuccess('Updated', 'Room updated successfully');
      } else {
        await insertRecord('rooms', roomData);
        await showSuccess('Added', 'Room added successfully');
      }
      setShowForm(false);
      setEditRoom(null);
      loadRooms();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleDelete(room) {
    const confirmed = await showConfirm({
      title: `Delete Room ${room.room_number}?`,
      text: 'This action cannot be undone.',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      await removeRecord('rooms', room.id);
      showSuccess('Deleted', `Room ${room.room_number} removed`);
      loadRooms();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleStatusChange(room, newStatus) {
    try {
      await updateRecord('rooms', room.id, { status: newStatus });
      loadRooms();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  const filtered = rooms.filter(r =>
    !search || r.room_number.toLowerCase().includes(search.toLowerCase()) ||
    r.room_type.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-spinner">Loading rooms...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Rooms</h1>
          <p>{rooms.length} rooms total &middot; {rooms.filter(r => r.status === 'available').length} available</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditRoom(null); setShowForm(true); }}>
          <i className="fas fa-plus"></i> Add Room
        </button>
      </div>

      <div className="card mb-2">
        <input className="form-control" placeholder="Search by room number or type..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Room #</th>
              <th>Type</th>
              <th>Floor</th>
              <th>Price/Night</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(room => (
              <tr key={room.id}>
                <td><strong>{room.room_number}</strong></td>
                <td className="text-capitalize">{room.room_type}</td>
                <td>Floor {room.floor}</td>
                <td>{formatCurrency(room.price_per_night)}</td>
                <td>{room.capacity} guests</td>
                <td>
                  <select className="status-select" value={room.status}
                    onChange={e => handleStatusChange(room, e.target.value)}
                    style={{
                      background: (room.status === 'available' ? '#22c55e' : room.status === 'occupied' ? '#ef4444' : room.status === 'cleaning' ? '#f59e0b' : '#6b7280') + '18',
                      color: room.status === 'available' ? '#22c55e' : room.status === 'occupied' ? '#ef4444' : room.status === 'cleaning' ? '#f59e0b' : '#6b7280',
                      border: '1px solid ' + (room.status === 'available' ? '#22c55e' : room.status === 'occupied' ? '#ef4444' : room.status === 'cleaning' ? '#f59e0b' : '#6b7280') + '30',
                    }}>
                    {['available', 'occupied', 'cleaning', 'maintenance', 'out_of_order'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn-icon" title="Edit" onClick={() => { setEditRoom(room); setShowForm(true); }}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDelete(room)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="text-center text-muted py-3">
                {search ? 'No rooms match your search.' : 'No rooms yet. Click "Add Room" to get started.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <RoomForm
          room={editRoom}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditRoom(null); }}
        />
      )}

      <style>{`
        .status-select {
          padding: 4px 8px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          cursor: pointer;
          outline: none;
          -webkit-appearance: none;
        }
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

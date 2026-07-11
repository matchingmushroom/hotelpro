import { useState, useEffect } from 'react';
import { fetchAll, insertRecord, updateRecord } from '../services/supabaseService';
import { formatCurrency } from '../utils/formatters';
import { showSuccess, showError } from '../components/common/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

export default function GroupBooking() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    contact_phone: '',
    check_in_date: '',
    check_out_date: '',
    notes: '',
  });

  const [selectedRooms, setSelectedRooms] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAll('rooms').then(({ data }) => setRooms(data || [])).catch(console.error);
  }, []);

  function handleSelectRoom(roomId) {
    setSelectedRooms(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.check_in_date || !form.check_out_date) {
      return showError('Missing fields', 'Please fill in all required fields');
    }
    if (selectedRooms.length === 0) {
      return showError('No rooms', 'Please select at least one room');
    }

    setSubmitting(true);
    try {
      const group = await insertRecord('group_bookings', {
        ...form,
        total_rooms: selectedRooms.length,
        status: 'confirmed',
      });

      for (const roomId of selectedRooms) {
        await insertRecord('bookings', {
          room_id: roomId,
          group_id: group.id,
          guest_name: form.name,
          check_in_date: form.check_in_date,
          check_out_date: form.check_out_date,
          booking_type: 'group',
          status: 'confirmed',
          adults: 2,
        });
        await updateRecord('rooms', roomId, { status: 'occupied' });
      }

      showSuccess('Success', `Group booking created for ${selectedRooms.length} rooms`);
      navigate('/bookings');
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Group Booking</h1>
        <p>Reserve multiple rooms for a group</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Group / Organization Name *</label>
              <input className="form-control" value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Contact Person</label>
              <input className="form-control" value={form.contact_person}
                onChange={e => setForm(prev => ({ ...prev, contact_person: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Phone</label>
              <input className="form-control" value={form.contact_phone}
                onChange={e => setForm(prev => ({ ...prev, contact_phone: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Check-In Date *</label>
              <input type="date" className="form-control" value={form.check_in_date}
                onChange={e => setForm(prev => ({ ...prev, check_in_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label>Check-Out Date *</label>
              <input type="date" className="form-control" value={form.check_out_date}
                onChange={e => setForm(prev => ({ ...prev, check_out_date: e.target.value }))}
                min={form.check_in_date} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" rows={2} value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Select Rooms ({selectedRooms.length} selected)</label>
            <div className="room-grid">
              {rooms.map(room => (
                <div key={room.id}
                  className={`room-chip ${selectedRooms.includes(room.id) ? 'selected' : ''}`}
                  onClick={() => handleSelectRoom(room.id)}>
                  <strong>{room.room_number}</strong>
                  <span>{room.room_type} - {formatCurrency(room.price_per_night)}</span>
                  <span className="badge badge-status">{room.status}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedRooms.length > 0 && (
            <div className="form-group">
              <div className="summary-card">
                <strong>Summary:</strong>
                <span>{selectedRooms.length} rooms selected</span>
              </div>
            </div>
          )}

          <div className="flex gap-1 mt-2">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/bookings')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-users"></i>}
              {submitting ? 'Creating...' : `Create Group Booking (${selectedRooms.length} rooms)`}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .room-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .room-chip {
          padding: 10px 16px; border: 2px solid var(--border); border-radius: var(--radius);
          cursor: pointer; display: flex; flex-direction: column; gap: 2px;
          min-width: 160px; transition: var(--transition);
        }
        .room-chip:hover { border-color: var(--primary); }
        .room-chip.selected { border-color: var(--primary); background: rgba(26,26,46,0.05); }
        .room-chip span { font-size: 0.8rem; color: var(--text-muted); }
        .badge-status {
          display: inline-block; padding: 2px 8px; border-radius: 100px;
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          background: var(--bg); color: var(--text-muted); margin-top: 4px;
        }
        .summary-card {
          display: flex; justify-content: space-between; align-items: center;
          background: var(--bg); padding: 12px 16px; border-radius: var(--radius);
        }
      `}</style>
    </div>
  );
}

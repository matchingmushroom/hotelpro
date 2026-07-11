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
              {rooms.filter(r => r.status === 'available').map(room => (
                <div key={room.id}
                  className={`room-chip ${selectedRooms.includes(room.id) ? 'selected' : ''}`}
                  onClick={() => handleSelectRoom(room.id)}>
                  <div className="room-chip-top">
                    <strong>{room.room_number}</strong>
                    {selectedRooms.includes(room.id) && <i className="fas fa-check-circle" />}
                  </div>
                  <span>{room.room_type}</span>
                  <span>{formatCurrency(room.price_per_night)} / night</span>
                </div>
              ))}
              {rooms.filter(r => r.status !== 'available').map(room => (
                <div key={room.id} className="room-chip disabled" title={`Room is ${room.status}`}>
                  <div className="room-chip-top">
                    <strong>{room.room_number}</strong>
                    <span className="badge badge-status">{room.status}</span>
                  </div>
                  <span>{room.room_type}</span>
                  <span className="text-muted">{room.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedRooms.length > 0 && (
            <div className="form-group">
              <div className="summary-card">
                <div>
                  <strong>{selectedRooms.length} room{selectedRooms.length > 1 ? 's' : ''} selected</strong>
                  <div className="text-muted" style={{fontSize:'0.82rem',marginTop:4}}>
                    {selectedRooms.map(id => {
                      const r = rooms.find(x => x.id === id);
                      return r?.room_number;
                    }).filter(Boolean).join(', ')}
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <strong>{formatCurrency(selectedRooms.reduce((sum, id) => {
                    const r = rooms.find(x => x.id === id);
                    return sum + (parseFloat(r?.price_per_night) || 0);
                  }, 0))}</strong>
                  <div className="text-muted" style={{fontSize:'0.82rem'}}>per night</div>
                </div>
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
          padding: 12px 16px; border: 2px solid var(--border); border-radius: var(--radius);
          cursor: pointer; display: flex; flex-direction: column; gap: 4px;
          min-width: 170px; flex: 1 0 auto; max-width: 220px;
          transition: all 0.2s; background: var(--bg-card);
        }
        .room-chip:hover { border-color: var(--primary); box-shadow: var(--shadow-sm); }
        .room-chip.selected { border-color: var(--primary); background: #eef2ff; }
        .room-chip.disabled { opacity: 0.5; cursor: not-allowed; background: var(--bg); }
        .room-chip.disabled:hover { border-color: var(--border); box-shadow: none; }
        .room-chip-top { display: flex; justify-content: space-between; align-items: center; }
        .room-chip-top i { color: var(--primary); font-size: 1.1rem; }
        .room-chip span { font-size: 0.78rem; color: var(--text-muted); }
        .badge-status {
          display: inline-block; padding: 2px 8px; border-radius: 100px;
          font-size: 0.65rem; font-weight: 600; text-transform: capitalize;
          background: #fee2e2; color: #991b1b;
        }
        .summary-card {
          display: flex; justify-content: space-between; align-items: center;
          background: var(--bg); padding: 14px 18px; border-radius: var(--radius);
          border: 1px solid var(--border-light);
        }
      `}</style>
    </div>
  );
}

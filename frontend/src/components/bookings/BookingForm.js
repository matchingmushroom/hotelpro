import { useState, useEffect } from 'react';
import { fetchAll, insertRecord, updateRecord } from '../../services/supabaseService';
import { formatCurrency } from '../../utils/formatters';
import { isValidDateRange } from '../../utils/validators';

export default function BookingForm({ onClose, onSuccess, defaultType = 'regular' }) {
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [searchGuest, setSearchGuest] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    booking_type: defaultType,
    guest_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    room_id: '',
    check_in_date: '',
    check_out_date: '',
    adults: 1,
    children: 0,
    special_requests: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [roomsRes, guestsRes] = await Promise.all([
        fetchAll('rooms', { filters: { status: 'available' } }),
        fetchAll('guests', { orderBy: 'name' }),
      ]);
      setRooms(roomsRes.data || []);
      setGuests(guestsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (form.check_in_date && form.check_out_date) {
      checkAvailability();
    }
  }, [form.check_in_date, form.check_out_date]);

  async function checkAvailability() {
    if (!isValidDateRange(form.check_in_date, form.check_out_date)) return;
    try {
      const { data: bookings } = await fetchAll('bookings', {
        filters: { status: ['confirmed', 'checked_in'].map(s => ({ operator: 'in', value: `(${s})` })) },
      });
      const bookedRoomIds = bookings?.filter(b =>
        b.check_in_date < form.check_out_date && b.check_out_date > form.check_in_date
      ).map(b => b.room_id) || [];

      const avail = rooms.filter(r => !bookedRoomIds.includes(r.id));
      setAvailableRooms(avail);
    } catch (err) {
      console.error(err);
    }
  }

  function selectGuest(guest) {
    setForm(prev => ({ ...prev, guest_id: guest.id, guest_name: guest.name, guest_email: guest.email || '', guest_phone: guest.phone || '' }));
  }

  function handleGuestSearch(e) {
    const val = e.target.value;
    setSearchGuest(val);
    setForm(prev => ({ ...prev, guest_name: val, guest_id: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.guest_name) errs.guest_name = 'Guest name required';
    if (!form.check_in_date) errs.check_in_date = 'Check-in date required';
    if (!form.check_out_date) errs.check_out_date = 'Check-out date required';
    if (form.check_in_date && form.check_out_date && !isValidDateRange(form.check_in_date, form.check_out_date))
      errs.check_out_date = 'Check-out must be after check-in';
    if (!form.room_id) errs.room_id = 'Please select a room';
    return errs;
  }

  function canGoNext(stepNum) {
    if (stepNum === 2) return form.check_in_date && form.check_out_date && form.check_in_date < form.check_out_date;
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        hotel_id: undefined,
        adults: parseInt(form.adults),
        children: parseInt(form.children),
      };

      if (form.guest_id) {
        delete payload.guest_name;
        delete payload.guest_email;
        delete payload.guest_phone;
      }

      const booking = await insertRecord('bookings', payload);
      await updateRecord('rooms', form.room_id, { status: 'occupied' });

      onSuccess?.(booking);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Booking</h2>
          <button className="modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>

        <div className="booking-steps">
          <div className={`step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`} onClick={() => setStep(1)}>
            <span className="step-num">{step > 1 ? <i className="fas fa-check"></i> : 1}</span>
            <span>Dates & Room</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`} onClick={() => canGoNext(2) && setStep(2)}>
            <span className="step-num">{step > 2 ? <i className="fas fa-check"></i> : 2}</span>
            <span>Guest Info</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${step === 3 ? 'active' : ''}`} onClick={() => canGoNext(3) && setStep(3)}>
            <span className="step-num">3</span>
            <span>Confirm</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Check-In Date *</label>
                  <input type="date" className={`form-control ${errors.check_in_date ? 'error' : ''}`}
                    value={form.check_in_date}
                    onChange={e => setForm(prev => ({ ...prev, check_in_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]} />
                  {errors.check_in_date && <div className="form-error">{errors.check_in_date}</div>}
                </div>
                <div className="form-group">
                  <label>Check-Out Date *</label>
                  <input type="date" className={`form-control ${errors.check_out_date ? 'error' : ''}`}
                    value={form.check_out_date}
                    onChange={e => setForm(prev => ({ ...prev, check_out_date: e.target.value }))}
                    min={form.check_in_date || new Date().toISOString().split('T')[0]} />
                  {errors.check_out_date && <div className="form-error">{errors.check_out_date}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Adults</label>
                  <input type="number" className="form-control" value={form.adults}
                    onChange={e => setForm(prev => ({ ...prev, adults: e.target.value }))} min={1} max={20} />
                </div>
                <div className="form-group">
                  <label>Children</label>
                  <input type="number" className="form-control" value={form.children}
                    onChange={e => setForm(prev => ({ ...prev, children: e.target.value }))} min={0} max={10} />
                </div>
              </div>

              {form.check_in_date && form.check_out_date && (
                <div className="form-group">
                  <label>Select Room *</label>
                  {errors.room_id && <div className="form-error">{errors.room_id}</div>}
                  <div className="room-select-grid">
                    {availableRooms.map(room => (
                      <div key={room.id} className={`room-option ${form.room_id === room.id ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ ...prev, room_id: room.id }))}>
                        <div className="room-option-header">
                          <strong>{room.room_number}</strong>
                          <span className="text-capitalize">{room.room_type}</span>
                        </div>
                        <div className="room-option-footer">
                          <span>{formatCurrency(room.price_per_night)}/night</span>
                          <span>{room.capacity} guests</span>
                        </div>
                      </div>
                    ))}
                    {availableRooms.length === 0 && (
                      <p className="text-muted">No rooms available for selected dates.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={() => canGoNext(2) && setStep(2)}
                  disabled={!canGoNext(2)}>
                  Next <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="modal-body">
              <div className="form-group">
                <label>Search Existing Guest</label>
                <input className="form-control" placeholder="Type to search guests..."
                  value={searchGuest} onChange={handleGuestSearch} />
                {searchGuest && guests.filter(g =>
                  g.name.toLowerCase().includes(searchGuest.toLowerCase()) ||
                  g.phone?.includes(searchGuest)
                ).map(g => (
                  <div key={g.id} className="search-result-item" onClick={() => selectGuest(g)}>
                    <strong>{g.name}</strong>
                    <span className="text-muted">{g.phone || g.email}</span>
                  </div>
                )).slice(0, 5)}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Guest Name *</label>
                  <input className={`form-control ${errors.guest_name ? 'error' : ''}`} name="guest_name"
                    value={form.guest_name} onChange={e => setForm(prev => ({ ...prev, guest_name: e.target.value }))} />
                  {errors.guest_name && <div className="form-error">{errors.guest_name}</div>}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-control" name="guest_email" value={form.guest_email}
                    onChange={e => setForm(prev => ({ ...prev, guest_email: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" name="guest_phone" value={form.guest_phone}
                  onChange={e => setForm(prev => ({ ...prev, guest_phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Special Requests</label>
                <textarea className="form-control" name="special_requests" rows={2}
                  value={form.special_requests}
                  onChange={e => setForm(prev => ({ ...prev, special_requests: e.target.value }))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                  <i className="fas fa-arrow-left"></i> Back
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
                  Review <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="modal-body">
              <div className="summary-card">
                <h3>Booking Summary</h3>
                <div className="summary-row">
                  <span>Room</span>
                  <span>{rooms.find(r => r.id === form.room_id)?.room_number || form.room_id} - {rooms.find(r => r.id === form.room_id)?.room_type}</span>
                </div>
                <div className="summary-row">
                  <span>Check-In</span>
                  <span>{form.check_in_date}</span>
                </div>
                <div className="summary-row">
                  <span>Check-Out</span>
                  <span>{form.check_out_date}</span>
                </div>
                <div className="summary-row">
                  <span>Guest</span>
                  <span>{form.guest_name}</span>
                </div>
                <div className="summary-row">
                  <span>Guests</span>
                  <span>{form.adults} adults, {form.children} children</span>
                </div>
                <div className="summary-row summary-total">
                  <span>Total Nights</span>
                  <span>
                    {Math.max(1, Math.ceil((new Date(form.check_out_date) - new Date(form.check_in_date)) / (1000*60*60*24)))}
                  </span>
                </div>
              </div>
              {errors.submit && <div className="alert alert-error mt-2">{errors.submit}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>
                  <i className="fas fa-arrow-left"></i> Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                  {submitting ? 'Creating...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      <style>{`
        .modal-lg { max-width: 680px; }
        .booking-steps {
          display: flex; align-items: center; justify-content: center;
          padding: 20px 24px; border-bottom: 1px solid var(--border);
          gap: 0;
        }
        .step {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.85rem; color: var(--text-muted); cursor: pointer;
        }
        .step.active { color: var(--primary); font-weight: 600; }
        .step.done { color: var(--success); }
        .step-num {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 700;
          background: var(--border); color: var(--text-muted);
        }
        .step.active .step-num { background: var(--primary); color: var(--white); }
        .step.done .step-num { background: var(--success); color: var(--white); }
        .step-connector {
          width: 40px; height: 2px; background: var(--border); margin: 0 8px;
        }
        .modal-body { padding: 24px; }
        .room-select-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
        .room-option {
          padding: 12px; border: 2px solid var(--border); border-radius: var(--radius);
          cursor: pointer; transition: var(--transition);
        }
        .room-option:hover { border-color: var(--primary); }
        .room-option.selected { border-color: var(--primary); background: rgba(26,26,46,0.05); }
        .room-option-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .room-option-footer { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); }
        .search-result-item {
          padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
        }
        .search-result-item:hover { background: var(--bg); }
        .summary-card { background: var(--bg); border-radius: var(--radius); padding: 16px; }
        .summary-card h3 { margin-bottom: 12px; font-size: 1rem; }
        .summary-row {
          display: flex; justify-content: space-between; padding: 6px 0;
          font-size: 0.9rem; border-bottom: 1px solid var(--border);
        }
        .summary-row:last-child { border-bottom: none; }
        .summary-total { font-weight: 700; padding-top: 8px; font-size: 1rem; }
        @media (max-width: 600px) {
          .room-select-grid { grid-template-columns: 1fr; }
          .booking-steps { flex-wrap: wrap; gap: 4px; }
          .step-connector { width: 20px; }
        }
      `}</style>
    </div>
  );
}

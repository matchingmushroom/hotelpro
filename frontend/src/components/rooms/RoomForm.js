import { useState } from 'react';
import { ROOM_TYPES, ROOM_STATUS } from '../../utils/constants';
import { isValidEmail, isPositiveNumber, isRequired } from '../../utils/validators';

export default function RoomForm({ room, onSave, onClose }) {
  const isEdit = !!room;
  const [form, setForm] = useState({
    room_number: room?.room_number || '',
    room_type: room?.room_type || 'single',
    floor: room?.floor || 1,
    price_per_night: room?.price_per_night || '',
    capacity: room?.capacity || 2,
    status: room?.status || 'available',
    description: room?.description || '',
    amenities: room?.amenities?.join(', ') || '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!isRequired(form.room_number)) errs.room_number = 'Room number is required';
    if (!isPositiveNumber(form.price_per_night)) errs.price_per_night = 'Valid price required';
    if (!isRequired(form.floor)) errs.floor = 'Floor is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    onSave({
      ...form,
      amenities: form.amenities ? form.amenities.split(',').map(a => a.trim()).filter(Boolean) : [],
      price_per_night: parseFloat(form.price_per_night),
      floor: parseInt(form.floor),
      capacity: parseInt(form.capacity),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Room' : 'Add Room'}</h2>
          <button className="modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Room Number *</label>
              <input name="room_number" className={`form-control ${errors.room_number ? 'error' : ''}`}
                value={form.room_number} onChange={handleChange} placeholder="e.g. 101" />
              {errors.room_number && <div className="form-error">{errors.room_number}</div>}
            </div>
            <div className="form-group">
              <label>Room Type</label>
              <select name="room_type" className="form-control" value={form.room_type} onChange={handleChange}>
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Floor</label>
              <input name="floor" type="number" className={`form-control ${errors.floor ? 'error' : ''}`}
                value={form.floor} onChange={handleChange} min={1} />
              {errors.floor && <div className="form-error">{errors.floor}</div>}
            </div>
            <div className="form-group">
              <label>Price per Night (NPR) *</label>
              <input name="price_per_night" type="number" className={`form-control ${errors.price_per_night ? 'error' : ''}`}
                value={form.price_per_night} onChange={handleChange} min={0} step="0.01" />
              {errors.price_per_night && <div className="form-error">{errors.price_per_night}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Capacity (guests)</label>
              <input name="capacity" type="number" className="form-control" value={form.capacity}
                onChange={handleChange} min={1} max={10} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                {Object.values(ROOM_STATUS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Amenities (comma separated)</label>
            <input name="amenities" className="form-control" value={form.amenities}
              onChange={handleChange} placeholder="wifi, tv, ac, minibar, balcony" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="form-control" value={form.description}
              onChange={handleChange} rows={3} placeholder="Room description..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <i className={`fas fa-${isEdit ? 'save' : 'plus'}`}></i>
              {isEdit ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }
        .modal-content {
          background: var(--white); border-radius: var(--radius-lg);
          width: 100%; max-width: 560px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px; border-bottom: 1px solid var(--border);
        }
        .modal-header h2 { font-size: 1.2rem; }
        .modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
        .modal-close:hover { color: var(--text); }
        form { padding: 24px; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 8px;
          padding-top: 16px; border-top: 1px solid var(--border); margin-top: 16px;
        }
      `}</style>
    </div>
  );
}

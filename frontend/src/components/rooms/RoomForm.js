import { useState } from 'react';
import { ROOM_TYPES, ROOM_STATUS, AMENITIES } from '../../utils/constants';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

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
    amenities: room?.amenities || [],
    images: room?.images || [],
  });
  const [errors, setErrors] = useState({});
  const [uploadingImg, setUploadingImg] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const toggleAmenity = (value) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter(a => a !== value)
        : [...prev.amenities, value],
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'rooms');
      const res = await fetch(`${BACKEND_URL}/api/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url = `${BACKEND_URL}${data.path}`;
      setForm(prev => ({ ...prev, images: [...prev.images, url] }));
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setUploadingImg(false);
    }
  };

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    const errs = {};
    if (!form.room_number.trim()) errs.room_number = 'Room number is required';
    if (!form.price_per_night || parseFloat(form.price_per_night) <= 0) errs.price_per_night = 'Valid price required';
    if (!form.floor) errs.floor = 'Floor is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    onSave({
      ...form,
      room_number: form.room_number.trim(),
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
            <label>Amenities</label>
            <div className="amenity-tags">
              {AMENITIES.map(a => (
                <button
                  key={a.value}
                  type="button"
                  className={`amenity-tag ${form.amenities.includes(a.value) ? 'selected' : ''}`}
                  onClick={() => toggleAmenity(a.value)}
                >
                  <i className={`fas ${a.icon}`}></i>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="form-control" value={form.description}
              onChange={handleChange} rows={3} placeholder="Room description..." />
          </div>

          <div className="form-group">
            <label>Images</label>
            <div className="room-images-grid">
              {form.images.map((url, i) => (
                <div key={i} className="room-img-thumb">
                  <img src={url} alt="" />
                  <button type="button" className="img-remove" onClick={() => removeImage(i)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
              <label className="room-img-add">
                {uploadingImg
                  ? <i className="fas fa-spinner fa-spin"></i>
                  : <><i className="fas fa-plus"></i><span>Add Image</span></>
                }
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={uploadingImg} />
              </label>
            </div>
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
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          width: 100%; max-width: 600px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px; border-bottom: 1px solid var(--border);
        }
        .modal-header h2 { font-size: 1.2rem; margin: 0; }
        .modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); padding: 4px; }
        .modal-close:hover { color: var(--text); }
        form { padding: 24px; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 8px;
          padding-top: 16px; border-top: 1px solid var(--border); margin-top: 16px;
        }

        .amenity-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .amenity-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 100px;
          border: 1.5px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .amenity-tag i { font-size: 0.8rem; }
        .amenity-tag:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(99, 102, 241, 0.05);
        }
        .amenity-tag.selected {
          background: var(--primary);
          border-color: var(--primary);
          color: var(--white);
        }
        .amenity-tag.selected i { color: var(--white); }

        .room-images-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 4px;
        }
        .room-img-thumb {
          position: relative;
          width: 100px;
          height: 80px;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .room-img-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .img-remove {
          position: absolute;
          top: 3px; right: 3px;
          width: 22px; height: 22px;
          border-radius: 50%;
          border: none;
          background: rgba(0,0,0,0.6);
          color: white;
          font-size: 0.7rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .room-img-add {
          width: 100px;
          height: 80px;
          border-radius: var(--radius-md);
          border: 2px dashed var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 0.75rem;
          transition: all 0.2s ease;
        }
        .room-img-add:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .room-img-add i { font-size: 1.2rem; }
      `}</style>
    </div>
  );
}

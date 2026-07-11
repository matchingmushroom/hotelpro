import { useState, useEffect } from 'react';
import { fetchAll, insertRecord, updateRecord, removeRecord } from '../services/supabaseService';
import { formatCurrency } from '../utils/formatters';
import { ROOM_TYPES, ROOM_STATUS, AMENITIES } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import { showConfirm, showSuccess, showError } from '../components/common/ConfirmDialog';
import RoomForm from '../components/rooms/RoomForm';

const PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#e2e8f0" width="400" height="300"/><text fill="#94a3b8" font-family="system-ui" font-size="14" text-anchor="middle" x="200" y="155">No Image</text></svg>');

const amenityIconMap = Object.fromEntries(AMENITIES.map(a => [a.value, a]));

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detailRoom, setDetailRoom] = useState(null);
  const [detailImgIdx, setDetailImgIdx] = useState(0);

  useEffect(() => { loadRooms(); }, []);

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
      setDetailRoom(null);
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

  const filtered = rooms.filter(r => {
    const matchSearch = !search || r.room_number.toLowerCase().includes(search.toLowerCase()) || r.room_type.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || r.room_type === filterType;
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const availableCount = rooms.filter(r => r.status === 'available').length;

  if (loading) return <div className="loading-spinner">Loading rooms...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Rooms</h1>
          <p>{rooms.length} rooms &middot; {availableCount} available</p>
        </div>
        <div className="page-header-actions">
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table view">
              <i className="fas fa-table"></i>
            </button>
            <button className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')} title="Card view">
              <i className="fas fa-th-large"></i>
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditRoom(null); setShowForm(true); }}>
            <i className="fas fa-plus"></i> Add Room
          </button>
        </div>
      </div>

      <div className="card mb-2 filter-bar">
        <div className="filter-row">
          <input className="form-control" placeholder="Search by room number or type..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select className="form-control filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {Object.values(ROOM_STATUS).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'table' ? (
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
                      {Object.values(ROOM_STATUS).map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" title="View" onClick={() => { setDetailRoom(room); setDetailImgIdx(0); }}>
                        <i className="fas fa-eye"></i>
                      </button>
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
                  {search || filterType || filterStatus ? 'No rooms match your filters.' : 'No rooms yet. Click "Add Room" to get started.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rooms-grid">
          {filtered.map(room => (
            <div key={room.id} className="room-card" onClick={() => { setDetailRoom(room); setDetailImgIdx(0); }}>
              <div className="room-card-img-wrap">
                <img
                  src={room.images?.[0] ? (room.images[0].startsWith('http') ? room.images[0] : `http://localhost:5000${room.images[0]}`) : PLACEHOLDER_IMG}
                  alt={room.room_number}
                  className="room-card-img"
                />
                <div className="room-card-status">
                  <StatusBadge status={room.status} />
                </div>
                <div className="room-card-type">{room.room_type}</div>
              </div>
              <div className="room-card-body">
                <div className="room-card-header">
                  <h3 className="room-card-number">{room.room_number}</h3>
                  <span className="room-card-price">{formatCurrency(room.price_per_night)}<small>/night</small></span>
                </div>
                <div className="room-card-meta">
                  <span><i className="fas fa-layer-group"></i> Floor {room.floor}</span>
                  <span><i className="fas fa-user-friends"></i> {room.capacity} guests</span>
                </div>
                {room.amenities?.length > 0 && (
                  <div className="room-card-amenities">
                    {room.amenities.slice(0, 4).map(a => {
                      const info = amenityIconMap[a];
                      return (
                        <span key={a} className="amenity-chip" title={info?.label || a}>
                          <i className={`fas ${info?.icon || 'fa-check-circle'}`}></i>
                          {info?.label || a}
                        </span>
                      );
                    })}
                    {room.amenities.length > 4 && <span className="amenity-chip more">+{room.amenities.length - 4}</span>}
                  </div>
                )}
                <div className="room-card-actions">
                  <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); setEditRoom(room); setShowForm(true); }}>
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(room); }}>
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-door-open"></i>
              <p>{search || filterType || filterStatus ? 'No rooms match your filters.' : 'No rooms yet. Click "Add Room" to get started.'}</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <RoomForm
          room={editRoom}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditRoom(null); }}
        />
      )}

      {detailRoom && (
        <div className="modal-overlay" onClick={() => setDetailRoom(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setDetailRoom(null)}><i className="fas fa-times"></i></button>
            <div className="detail-layout">
              <div className="detail-gallery">
                <div className="detail-main-img">
                  <img
                    src={detailRoom.images?.length > 0
                      ? (detailRoom.images[detailImgIdx].startsWith('http') ? detailRoom.images[detailImgIdx] : `http://localhost:5000${detailRoom.images[detailImgIdx]}`)
                      : PLACEHOLDER_IMG}
                    alt={detailRoom.room_number}
                  />
                </div>
                {detailRoom.images?.length > 1 && (
                  <div className="detail-thumbs">
                    {detailRoom.images.map((url, i) => (
                      <button key={i} className={`detail-thumb ${i === detailImgIdx ? 'active' : ''}`} onClick={() => setDetailImgIdx(i)}>
                        <img src={url.startsWith('http') ? url : `http://localhost:5000${url}`} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="detail-info">
                <div className="detail-head">
                  <h2>{detailRoom.room_number}</h2>
                  <StatusBadge status={detailRoom.status} />
                </div>
                <p className="detail-type">{detailRoom.room_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                <div className="detail-meta-grid">
                  <div className="detail-meta-item">
                    <i className="fas fa-money-bill-wave"></i>
                    <div>
                      <span className="detail-meta-label">Price/Night</span>
                      <span className="detail-meta-value">{formatCurrency(detailRoom.price_per_night)}</span>
                    </div>
                  </div>
                  <div className="detail-meta-item">
                    <i className="fas fa-layer-group"></i>
                    <div>
                      <span className="detail-meta-label">Floor</span>
                      <span className="detail-meta-value">{detailRoom.floor}</span>
                    </div>
                  </div>
                  <div className="detail-meta-item">
                    <i className="fas fa-user-friends"></i>
                    <div>
                      <span className="detail-meta-label">Capacity</span>
                      <span className="detail-meta-value">{detailRoom.capacity} guests</span>
                    </div>
                  </div>
                </div>

                {detailRoom.amenities?.length > 0 && (
                  <div className="detail-amenities">
                    <h4>Amenities</h4>
                    <div className="detail-amenity-grid">
                      {detailRoom.amenities.map(a => {
                        const info = amenityIconMap[a];
                        return (
                          <div key={a} className="detail-amenity-item">
                            <i className={`fas ${info?.icon || 'fa-check-circle'}`}></i>
                            <span>{info?.label || a}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {detailRoom.description && (
                  <div className="detail-desc">
                    <h4>Description</h4>
                    <p>{detailRoom.description}</p>
                  </div>
                )}

                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => { setEditRoom(detailRoom); setShowForm(true); setDetailRoom(null); }}>
                    <i className="fas fa-edit"></i> Edit Room
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(detailRoom)}>
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .page-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .view-toggle {
          display: flex;
          background: var(--bg-alt);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .toggle-btn {
          background: none;
          border: none;
          padding: 8px 12px;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        .toggle-btn.active {
          background: var(--primary);
          color: var(--white);
        }
        .toggle-btn:not(.active):hover {
          color: var(--text);
          background: rgba(99, 102, 241, 0.05);
        }

        .filter-bar { padding: 12px 16px; }
        .filter-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .filter-row .form-control { flex: 1; min-width: 140px; }
        .filter-select { flex: 0 0 160px; }

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

        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .room-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: var(--shadow-sm);
        }
        .room-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
          border-color: var(--primary-light);
        }
        .room-card-img-wrap {
          position: relative;
          height: 180px;
          background: var(--bg-alt);
          overflow: hidden;
        }
        .room-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .room-card-status {
          position: absolute;
          top: 10px;
          left: 10px;
        }
        .room-card-type {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(0,0,0,0.65);
          color: white;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          backdrop-filter: blur(4px);
        }
        .room-card-body {
          padding: 16px;
        }
        .room-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .room-card-number {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
          color: var(--text);
        }
        .room-card-price {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary);
        }
        .room-card-price small {
          font-size: 0.7rem;
          font-weight: 400;
          color: var(--text-muted);
          margin-left: 2px;
        }
        .room-card-meta {
          display: flex;
          gap: 16px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }
        .room-card-meta i {
          margin-right: 4px;
          width: 14px;
          text-align: center;
        }
        .room-card-amenities {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        .amenity-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 500;
          background: var(--bg-alt);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .amenity-chip i {
          font-size: 0.65rem;
          color: var(--primary);
        }
        .amenity-chip.more {
          background: var(--primary);
          color: var(--white);
          border-color: var(--primary);
        }
        .room-card-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .room-card-actions .btn { flex: 1; }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }
        .empty-state i {
          font-size: 3rem;
          margin-bottom: 12px;
          display: block;
        }

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }

        .detail-modal {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: var(--shadow-xl);
        }
        .detail-close {
          position: absolute;
          top: 14px; right: 14px;
          width: 36px; height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(0,0,0,0.5);
          color: white;
          font-size: 1rem;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .detail-close:hover {
          background: rgba(0,0,0,0.7);
        }
        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 400px;
        }
        .detail-gallery {
          background: var(--bg-alt);
          display: flex;
          flex-direction: column;
        }
        .detail-main-img {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          min-height: 250px;
        }
        .detail-main-img img {
          max-width: 100%;
          max-height: 320px;
          object-fit: contain;
          border-radius: var(--radius);
        }
        .detail-thumbs {
          display: flex;
          gap: 8px;
          padding: 8px 16px 16px;
          overflow-x: auto;
        }
        .detail-thumb {
          width: 60px;
          height: 50px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          padding: 0;
          background: none;
          flex-shrink: 0;
          transition: border-color 0.2s ease;
        }
        .detail-thumb.active {
          border-color: var(--primary);
        }
        .detail-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .detail-info {
          padding: 24px;
        }
        .detail-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .detail-head h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .detail-type {
          color: var(--text-secondary);
          text-transform: capitalize;
          font-size: 0.9rem;
          margin-bottom: 20px;
        }
        .detail-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        .detail-meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--bg-alt);
          border-radius: var(--radius);
        }
        .detail-meta-item i {
          font-size: 1.1rem;
          color: var(--primary);
          width: 20px;
          text-align: center;
        }
        .detail-meta-label {
          display: block;
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .detail-meta-value {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text);
        }

        .detail-amenities {
          margin-bottom: 20px;
        }
        .detail-amenities h4,
        .detail-desc h4 {
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--text);
        }
        .detail-amenity-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .detail-amenity-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 500;
          background: var(--bg-alt);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .detail-amenity-item i {
          font-size: 0.75rem;
          color: var(--primary);
        }

        .detail-desc {
          margin-bottom: 20px;
        }
        .detail-desc p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .detail-actions {
          display: flex;
          gap: 10px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .detail-actions .btn { flex: 1; }

        @media (max-width: 640px) {
          .detail-layout {
            grid-template-columns: 1fr;
          }
          .detail-gallery {
            max-height: 220px;
          }
          .rooms-grid {
            grid-template-columns: 1fr;
          }
          .filter-row .form-control,
          .filter-select { min-width: 100%; }
        }
      `}</style>
    </div>
  );
}

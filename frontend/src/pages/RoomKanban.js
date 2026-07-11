import { useState, useEffect } from 'react';
import { fetchAll, updateRecord } from '../services/supabaseService';
import StatusBadge from '../components/common/StatusBadge';
import { showToast } from '../components/common/ConfirmDialog';

export default function RoomKanban() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState(null);

  const columns = ['available', 'occupied', 'cleaning', 'maintenance'];

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

  async function handleDrop(status) {
    if (!draggedId) return;
    try {
      await updateRecord('rooms', draggedId, { status });
      setRooms(prev => prev.map(r => r.id === draggedId ? { ...r, status } : r));
      showToast('success', `Room moved to ${status}`);
    } catch (err) {
      showToast('error', 'Failed to update status');
    }
    setDraggedId(null);
  }

  if (loading) return <div className="loading-spinner">Loading KanBan...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>KanBan Board</h1>
        <p>Drag rooms between columns to update status</p>
      </div>
      <div className="kanban-board">
        {columns.map(col => (
          <div
            key={col}
            className="kanban-column"
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(col)}
          >
            <div className="kanban-header">
              <StatusBadge status={col} />
              <span className="kanban-count">{rooms.filter(r => r.status === col).length}</span>
            </div>
            <div className="kanban-cards">
              {rooms.filter(r => r.status === col).map(room => (
                <div
                  key={room.id}
                  className="kanban-card"
                  draggable
                  onDragStart={() => setDraggedId(room.id)}
                >
                  <span className="kanban-room-num">{room.room_number}</span>
                  <span className="kanban-room-type">{room.room_type}</span>
                  <span className="kanban-room-price">NPR {room.price_per_night}</span>
                </div>
              ))}
              {rooms.filter(r => r.status === col).length === 0 && (
                <div className="kanban-empty">No rooms</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .kanban-board {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          min-height: 60vh;
        }
        .kanban-column {
          background: var(--bg);
          border-radius: var(--radius-lg);
          padding: 12px;
        }
        .kanban-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 0 4px;
        }
        .kanban-count {
          background: var(--border);
          color: var(--text-secondary);
          width: 24px; height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .kanban-cards { display: flex; flex-direction: column; gap: 8px; }
        .kanban-card {
          background: var(--bg-card);
          border-radius: var(--radius);
          padding: 12px;
          box-shadow: var(--shadow-sm);
          cursor: grab;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: var(--transition);
        }
        .kanban-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
        .kanban-card:active { cursor: grabbing; }
        .kanban-room-num { font-weight: 700; font-size: 1.1rem; }
        .kanban-room-type { font-size: 0.8rem; color: var(--text-muted); text-transform: capitalize; }
        .kanban-room-price { font-size: 0.85rem; font-weight: 600; color: var(--primary); }
        .kanban-empty {
          padding: 20px;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
          border: 2px dashed var(--border);
          border-radius: var(--radius);
        }
        @media (max-width: 900px) {
          .kanban-board { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 500px) {
          .kanban-board { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

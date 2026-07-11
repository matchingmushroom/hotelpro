import { useState, useEffect } from 'react';
import { fetchAll, updateRecord } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { showToast } from '../components/common/ConfirmDialog';

export default function CleanerDashboard() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [reqRes, roomsRes] = await Promise.all([
        fetchAll('cleaning_requests', { orderBy: 'created_at', orderDir: 'desc' }),
        fetchAll('rooms'),
      ]);
      setRequests(reqRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelfAssign(reqId) {
    if (!profile?.id) return;
    try {
      await updateRecord('cleaning_requests', reqId, { assigned_to: profile.id, status: 'in_progress' });
      showToast('success', 'Task assigned to you');
      loadData();
    } catch (err) {
      showToast('error', 'Failed to assign');
    }
  }

  async function handleComplete(reqId, roomId) {
    try {
      await updateRecord('cleaning_requests', reqId, { status: 'completed' });
      await updateRecord('rooms', roomId, { status: 'available' });
      showToast('success', 'Room marked available');
      loadData();
    } catch (err) {
      showToast('error', 'Failed to complete');
    }
  }

  const myTasks = requests.filter(r => r.assigned_to === profile?.id && r.status !== 'completed');
  const pendingUrgent = requests.filter(r => r.status === 'pending' && r.priority === 'high');
  const pendingStandard = requests.filter(r => r.status === 'pending' && r.priority !== 'high');

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cleaner Dashboard</h1>
          <p>{requests.filter(r => r.status !== 'completed').length} active tasks</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* My Tasks */}
        <div className="dash-col">
          <div className="dash-col-header">
            <i className="fas fa-clipboard-check"></i> My Tasks
            <span className="dash-count">{myTasks.length}</span>
          </div>
          <div className="dash-col-body">
            {myTasks.map(req => {
              const room = rooms.find(r => r.id === req.room_id);
              return (
                <div key={req.id} className="task-card mine">
                  <div className="task-card-head">
                    <strong>Room {room?.room_number || req.room_id?.slice(0, 8)}</strong>
                    <StatusBadge status={req.status} />
                  </div>
                  {req.notes && <div className="task-notes">📝 {req.notes}</div>}
                  <div className="task-meta">{formatDateTime(req.created_at)}</div>
                  <button className="btn btn-success btn-sm" onClick={() => handleComplete(req.id, req.room_id)}>
                    <i className="fas fa-check"></i> Mark Complete
                  </button>
                </div>
              );
            })}
            {myTasks.length === 0 && <div className="dash-empty">No assigned tasks</div>}
          </div>
        </div>

        {/* Urgent */}
        <div className="dash-col">
          <div className="dash-col-header urgent">
            <i className="fas fa-exclamation-triangle"></i> Urgent
            <span className="dash-count urgent-count">{pendingUrgent.length}</span>
          </div>
          <div className="dash-col-body">
            {pendingUrgent.map(req => {
              const room = rooms.find(r => r.id === req.room_id);
              return (
                <div key={req.id} className="task-card urgent-task">
                  <div className="task-card-head">
                    <strong>Room {room?.room_number || req.room_id?.slice(0, 8)}</strong>
                    <span className="urgent-badge">HIGH</span>
                  </div>
                  {req.notes && <div className="task-notes">📝 {req.notes}</div>}
                  <div className="task-meta">{formatDateTime(req.created_at)}</div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleSelfAssign(req.id)}>
                    <i className="fas fa-hand-paper"></i> Claim Task
                  </button>
                </div>
              );
            })}
            {pendingUrgent.length === 0 && <div className="dash-empty">No urgent tasks</div>}
          </div>
        </div>

        {/* Standard Queue */}
        <div className="dash-col">
          <div className="dash-col-header standard">
            <i className="fas fa-list"></i> Standard Queue
            <span className="dash-count">{pendingStandard.length}</span>
          </div>
          <div className="dash-col-body">
            {pendingStandard.sort((a, b) => a.priority === 'medium' ? -1 : 0).map(req => {
              const room = rooms.find(r => r.id === req.room_id);
              return (
                <div key={req.id} className="task-card">
                  <div className="task-card-head">
                    <strong>Room {room?.room_number || req.room_id?.slice(0, 8)}</strong>
                    <span className="priority-text">{req.priority}</span>
                  </div>
                  {req.notes && <div className="task-notes">📝 {req.notes}</div>}
                  <div className="task-meta">{formatDateTime(req.created_at)}</div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleSelfAssign(req.id)}>
                    <i className="fas fa-hand-paper"></i> Claim Task
                  </button>
                </div>
              );
            })}
            {pendingStandard.length === 0 && <div className="dash-empty">No pending tasks</div>}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          min-height: calc(100vh - 180px);
        }
        .dash-col {
          background: var(--bg);
          border-radius: var(--radius-lg);
          padding: 12px;
          display: flex;
          flex-direction: column;
        }
        .dash-col-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 8px 4px 12px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 12px;
        }
        .dash-col-header.urgent { color: var(--error); border-bottom-color: var(--error); }
        .dash-col-header.standard { color: var(--info); border-bottom-color: var(--info); }
        .dash-count {
          margin-left: auto;
          background: var(--border);
          color: var(--text-secondary);
          width: 24px; height: 24px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem;
        }
        .urgent-count { background: var(--error) !important; color: var(--white) !important; }
        .dash-col-body {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .task-card {
          background: var(--bg-card);
          border-radius: var(--radius);
          padding: 12px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .task-card.mine { border-left: 3px solid var(--success); }
        .task-card.urgent-task { border-left: 3px solid var(--error); }
        .task-card-head { display: flex; justify-content: space-between; align-items: center; }
        .urgent-badge {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.05em;
          padding: 2px 8px; border-radius: 100px;
          background: var(--error); color: var(--white);
        }
        .priority-text {
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          color: var(--text-muted);
        }
        .task-notes { font-size: 0.8rem; color: var(--text-secondary); }
        .task-meta { font-size: 0.7rem; color: var(--text-muted); }
        .dash-empty {
          padding: 24px; text-align: center; color: var(--text-muted);
          font-size: 0.85rem;
          border: 2px dashed var(--border); border-radius: var(--radius);
        }
        .btn-success {
          background: var(--success); color: var(--white); border: none;
        }
        .btn-success:hover { opacity: 0.9; }
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

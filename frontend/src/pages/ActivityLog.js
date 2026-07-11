import { useState, useEffect } from 'react';
import { fetchActivityLog } from '../services/activityService';
import { formatDateTime } from '../utils/formatters';

const actionLabels = {
  create: { icon: 'fa-plus-circle', color: '#22c55e' },
  update: { icon: 'fa-edit', color: '#3b82f6' },
  delete: { icon: 'fa-trash', color: '#ef4444' },
  check_in: { icon: 'fa-sign-in-alt', color: '#22c55e' },
  check_out: { icon: 'fa-sign-out-alt', color: '#f59e0b' },
  payment: { icon: 'fa-money-bill', color: '#22c55e' },
  convert: { icon: 'fa-exchange-alt', color: '#8b5cf6' },
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const data = await fetchActivityLog({ limit: 100 });
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading-spinner">Loading activity log...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Activity Log</h1>
        <p>Audit trail of all system actions</p>
      </div>

      <div className="card">
        <div className="activity-feed">
          {logs.map(log => {
            const actionDef = actionLabels[log.action] || { icon: 'fa-circle', color: '#64748b' };
            return (
              <div key={log.id} className="activity-item">
                <div className="activity-icon" style={{ background: actionDef.color + '18', color: actionDef.color }}>
                  <i className={`fas ${actionDef.icon}`}></i>
                </div>
                <div className="activity-content">
                  <div className="activity-head">
                    <strong className="text-capitalize">{log.action?.replace(/_/g, ' ')}</strong>
                    <span className="activity-entity text-muted">{log.entity_type} #{log.entity_id?.slice(0, 6)}</span>
                    <span className="activity-user">{log.profiles?.name || 'System'}</span>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="activity-details text-muted">
                      {JSON.stringify(log.details).substring(0, 120)}
                    </div>
                  )}
                  <div className="activity-time">{formatDateTime(log.created_at)}</div>
                </div>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="text-center text-muted py-3">No activity logged yet.</div>
          )}
        </div>
      </div>

      <style>{`
        .activity-feed { display: flex; flex-direction: column; gap: 4px; }
        .activity-item {
          display: flex; gap: 12px; padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }
        .activity-item:last-child { border-bottom: none; }
        .activity-icon {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 2px;
        }
        .activity-content { flex: 1; min-width: 0; }
        .activity-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .activity-entity { font-size: 0.8rem; }
        .activity-user { margin-left: auto; font-size: 0.8rem; color: var(--text-secondary); }
        .activity-details {
          font-size: 0.8rem; margin-top: 2px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .activity-time { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
      `}</style>
    </div>
  );
}

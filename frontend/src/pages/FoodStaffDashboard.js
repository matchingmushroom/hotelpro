import { useState, useEffect, useRef } from 'react';
import { updateRecord } from '../services/supabaseService';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { showToast } from '../components/common/ConfirmDialog';
import VoiceAlert from '../components/food/VoiceAlert';
import { subscribeToTable } from '../services/supabaseService';

const statuses = ['pending', 'preparing', 'delivered'];
const statusLabels = { pending: 'Pending', preparing: 'Preparing', delivered: 'Delivered' };

export default function FoodStaffDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [latestOrder, setLatestOrder] = useState(null);
  const audioCtxRef = useRef(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    loadOrders();
    const sub = subscribeToTable('food_orders', null, (payload) => {
      if (payload.eventType === 'INSERT') {
        setLatestOrder(payload.new);
        setOrders(prev => [payload.new, ...prev]);
        playAlertSound();
      } else if (payload.eventType === 'UPDATE') {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
      }
    });
    return () => {
      if (sub?.unsubscribe) sub.unsubscribe();
    };
  }, []);

  async function loadOrders() {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { fetchAll } = await import('../services/supabaseService');
      const { data } = await fetchAll('food_orders', { orderBy: 'created_at', orderDir: 'desc' });
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }

  function playAlertSound() {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.15);
      }, 200);
    } catch (e) { /* audio not supported */ }
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateRecord('food_orders', orderId, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast('success', `Order ${statusLabels[newStatus] || newStatus}`);
    } catch (err) {
      showToast('error', 'Failed to update');
    }
  }

  async function moveNext(order) {
    const idx = statuses.indexOf(order.status);
    if (idx < statuses.length - 1) {
      await handleStatusChange(order.id, statuses[idx + 1]);
    }
  }

  const grouped = {};
  statuses.forEach(s => { grouped[s] = orders.filter(o => o.status === s); });

  if (loading) return <div className="loading-spinner">Loading orders...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Food Staff Dashboard</h1>
          <p>Real-time orders with voice alerts</p>
        </div>
        <button
          className={`btn ${voiceEnabled ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setVoiceEnabled(!voiceEnabled)}
        >
          <i className={`fas fa-${voiceEnabled ? 'volume-up' : 'volume-mute'}`}></i>
          Voice {voiceEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <VoiceAlert order={latestOrder} enabled={voiceEnabled} />

      <div className="order-columns">
        {statuses.map(status => (
          <div key={status} className="order-col">
            <div className="order-col-header">
              <span className={`status-dot ${status}`}></span>
              <span>{statusLabels[status]}</span>
              <span className="order-count">{grouped[status].length}</span>
            </div>
            <div className="order-col-body">
              {grouped[status].map(order => {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                return (
                  <div key={order.id} className="order-card" onClick={() => moveNext(order)}>
                    <div className="order-card-head">
                      <strong>Room {order.room_number || 'Reception'}</strong>
                      <span className="order-time">{formatDateTime(order.created_at)}</span>
                    </div>
                    <div className="order-card-items">
                      {items.map((item, i) => (
                        <span key={i}>{item.qty || 1}x {item.name || item.item_name}</span>
                      ))}
                    </div>
                    <div className="order-card-footer">
                      <span className="order-total">{formatCurrency(order.total_amount)}</span>
                      {order.guest_name && <span className="order-guest">{order.guest_name}</span>}
                    </div>
                    {order.notes && <div className="order-notes">📝 {order.notes}</div>}
                    <div className="order-card-actions">
                      {status === 'pending' && (
                        <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); handleStatusChange(order.id, 'preparing'); }}>
                          <i className="fas fa-fire"></i> Start Preparing
                        </button>
                      )}
                      {status === 'preparing' && (
                        <button className="btn btn-success btn-sm" onClick={e => { e.stopPropagation(); handleStatusChange(order.id, 'delivered'); }}>
                          <i className="fas fa-check"></i> Mark Delivered
                        </button>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); handleStatusChange(order.id, 'cancelled'); }}>
                        <i className="fas fa-ban"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
              {grouped[status].length === 0 && (
                <div className="order-col-empty">No {statusLabels[status].toLowerCase()} orders</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .order-columns {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          min-height: calc(100vh - 180px);
        }
        .order-col {
          background: var(--bg);
          border-radius: var(--radius-lg);
          padding: 12px;
          display: flex;
          flex-direction: column;
        }
        .order-col-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 8px 4px 12px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 12px;
        }
        .status-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
        }
        .status-dot.pending { background: var(--warning); }
        .status-dot.preparing { background: var(--info); }
        .status-dot.delivered { background: var(--success); }
        .order-count {
          margin-left: auto;
          background: var(--border);
          color: var(--text-secondary);
          width: 24px; height: 24px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem;
        }
        .order-col-body {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .order-card {
          background: var(--bg-card);
          border-radius: var(--radius);
          padding: 12px;
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          transition: var(--transition);
        }
        .order-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
        .order-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .order-time { font-size: 0.7rem; color: var(--text-muted); }
        .order-card-items {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .order-card-items span {
          background: var(--bg);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .order-card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-bottom: 4px;
        }
        .order-total { font-weight: 700; color: var(--primary); }
        .order-guest { color: var(--text-muted); }
        .order-notes {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-style: italic;
          padding: 4px 0;
          border-top: 1px dashed var(--border);
          margin-top: 4px;
        }
        .order-card-actions {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }
        .order-card-actions .btn { flex: 1; justify-content: center; }
        .btn-success {
          background: var(--success); color: var(--white); border: none;
        }
        .btn-success:hover { opacity: 0.9; }
        .order-col-empty {
          padding: 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
          border: 2px dashed var(--border);
          border-radius: var(--radius);
        }
        @media (max-width: 900px) {
          .order-columns { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

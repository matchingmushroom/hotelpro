import { useState, useEffect } from 'react';
import { fetchAll, updateRecord } from '../services/supabaseService';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { showSuccess, showError } from '../components/common/ConfirmDialog';
import CartDrawer from '../components/food/CartDrawer';
import DetailModal from '../components/common/DetailModal';
import ViewToggle from '../components/common/ViewToggle';

export default function FoodOrders() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [ordersRes, menuRes] = await Promise.all([
        fetchAll('food_orders', { orderBy: 'created_at', orderDir: 'desc' }),
        fetchAll('menu_items'),
      ]);
      setOrders(ordersRes.data || []);
      setMenuItems(menuRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(order, newStatus) {
    try {
      await updateRecord('food_orders', order.id, { status: newStatus });
      showSuccess('Updated', `Order status changed to ${newStatus}`);
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  if (loading) return <div className="loading-spinner">Loading orders...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Food Orders</h1>
          <p>{orders.length} total &middot; {orders.filter(o => o.status === 'pending').length} pending</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCart(true)}>
          <i className="fas fa-plus"></i> New Order
        </button>
      </div>

      <div className="toolbar-row">
        <div className="card mb-2" style={{ maxWidth: 200 }}>
          <select className="form-control" value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <ViewToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === 'table' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Room</th>
                <th>Guest</th>
                <th>Items</th>
                <th>Total</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                return (
                  <tr key={order.id} className="clickable-row" onClick={() => setSelectedOrder(order)}>
                    <td className="text-muted">{order.id?.slice(0, 6)}</td>
                    <td><strong>{order.room_number || '-'}</strong></td>
                    <td>{order.guest_name || '-'}</td>
                    <td>
                      {items?.map((item, i) => (
                        <div key={i} className="order-item-line">
                          {item.qty || 1}x {item.name || item.item_name}
                        </div>
                      ))}
                    </td>
                    <td>{formatCurrency(order.total_amount)}</td>
                    <td className="text-muted">{formatDateTime(order.created_at)}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <select className="status-select" value={order.status}
                        onChange={e => handleStatusChange(order, e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="8" className="text-center text-muted py-3">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(order => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            return (
              <div key={order.id} className="card-grid-item" onClick={() => setSelectedOrder(order)}>
                <div className="card-grid-head">
                  <span className="text-truncate text-muted">#{order.id?.slice(0, 8)}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="card-grid-body">
                  <div className="card-field"><span className="field-label">Room</span><strong className="text-truncate">{order.room_number || '-'}</strong></div>
                  <div className="card-field"><span className="field-label">Guest</span><span className="text-truncate">{order.guest_name || '-'}</span></div>
                  <div className="card-field"><span className="field-label">Items</span>
                    <div className="text-wrap"><span>{items?.map((item, i) => (
                      <span key={i} className="order-item-line">{item.qty || 1}x {item.name || item.item_name}{i < items.length - 1 ? ', ' : ''}</span>
                    ))}</span></div>
                  </div>
                  <div className="card-field"><span className="field-label">Total</span><span className="text-truncate">{formatCurrency(order.total_amount)}</span></div>
                  <div className="card-field"><span className="field-label">Time</span><span className="text-truncate text-muted">{formatDateTime(order.created_at)}</span></div>
                </div>
                <div className="card-grid-actions" onClick={e => e.stopPropagation()}>
                  <select className="status-select" value={order.status}
                    onChange={e => handleStatusChange(order, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-muted py-3" style={{ gridColumn: '1 / -1' }}>No orders found.</div>
          )}
        </div>
      )}

      {showCart && (
        <CartDrawer
          menuItems={menuItems}
          onClose={() => setShowCart(false)}
          onOrderPlaced={loadData}
        />
      )}

      {selectedOrder && (
        <DetailModal item={selectedOrder} title="Food Order Details"
          fields={[
            { key: 'id', label: 'Order ID', render: v => v?.slice(0, 8) },
            { key: 'room_number', label: 'Room' },
            { key: 'guest_name', label: 'Guest' },
            { key: 'items', label: 'Items', render: (v) => Array.isArray(v) ? v.map(i => `${i.name || 'Item'} x${i.qty || 1}`).join(', ') : JSON.stringify(v || []) },
            { key: 'total_amount', label: 'Total', render: v => formatCurrency(v) },
            { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            { key: 'notes', label: 'Notes', hide: v => !v },
            { key: 'created_at', label: 'Ordered', render: v => formatDateTime(v) },
          ]}
          onClose={() => setSelectedOrder(null)} />
      )}

      <style>{`
        .order-item-line { font-size: 0.85rem; }
        .status-select {
          padding: 4px 8px; border-radius: 100px;
          font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
          cursor: pointer; outline: none;
          background: var(--bg); color: var(--text-secondary);
          border: 1px solid var(--border); -webkit-appearance: none;
        }
        .py-3 { padding-top: 24px; padding-bottom: 24px; }
        .clickable-row { cursor: pointer; transition: background 0.15s; }
        .clickable-row:hover { background: var(--hover); }
        .toolbar-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .card-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px; margin-top: 16px;
        }
        .card-grid-item {
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px; cursor: pointer;
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .card-grid-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .card-grid-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .card-grid-body { display: flex; flex-direction: column; gap: 8px; }
        .card-field { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; }
        .field-label { color: var(--text-secondary); font-size: 0.8rem; }
        .card-grid-actions { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
        .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; max-width: 100%; }
        .text-wrap { white-space: normal; word-break: break-word; overflow-wrap: break-word; }
        .card-grid-item { overflow: hidden; }
        .card-grid-body { min-width: 0; }
        .card-grid-body span:last-child { max-width: 100%; }
      `}</style>
    </div>
  );
}

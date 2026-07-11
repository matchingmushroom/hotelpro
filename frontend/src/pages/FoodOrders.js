import { useState, useEffect } from 'react';
import { fetchAll, updateRecord } from '../services/supabaseService';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { showSuccess, showError } from '../components/common/ConfirmDialog';
import CartDrawer from '../components/food/CartDrawer';

export default function FoodOrders() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

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
                <tr key={order.id}>
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
                  <td>
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

      {showCart && (
        <CartDrawer
          menuItems={menuItems}
          onClose={() => setShowCart(false)}
          onOrderPlaced={loadData}
        />
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
      `}</style>
    </div>
  );
}

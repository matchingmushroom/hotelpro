import { useState } from 'react';
import { insertRecord } from '../../services/supabaseService';
import { formatCurrency } from '../../utils/formatters';
import { showSuccess, showError } from '../common/ConfirmDialog';

export default function CartDrawer({ menuItems, onClose, onOrderPlaced }) {
  const [cart, setCart] = useState({});
  const [roomNumber, setRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0);
  const total = cartItems.reduce((sum, [id, qty]) => {
    const item = menuItems.find(m => m.id === id);
    return sum + (item?.price || 0) * qty;
  }, 0);

  function addItem(id) {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  function removeItem(id) {
    setCart(prev => {
      const qty = (prev[id] || 0) - 1;
      return qty <= 0 ? { ...prev, [id]: 0 } : { ...prev, [id]: qty };
    });
  }

  async function placeOrder() {
    if (cartItems.length === 0) return showError('Empty cart', 'Add items to the order');
    if (!roomNumber && !guestName) return showError('Missing info', 'Enter room number or guest name');

    setSubmitting(true);
    try {
      const items = cartItems.map(([id, qty]) => {
        const item = menuItems.find(m => m.id === id);
        return { menu_item_id: id, name: item.name, price: item.price, qty };
      });

      await insertRecord('food_orders', {
        room_number: roomNumber,
        guest_name: guestName,
        items,
        total_amount: total,
        status: 'pending',
        notes,
      });

      showSuccess('Order Placed', `Order for Room ${roomNumber || 'Reception'} placed`);
      onOrderPlaced?.();
      onClose();
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        <div className="cart-header">
          <h2>New Order</h2>
          <button className="cart-close" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>

        <div className="cart-body">
          <div className="form-row">
            <div className="form-group">
              <label>Room Number</label>
              <input className="form-control" value={roomNumber}
                onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. 201" />
            </div>
            <div className="form-group">
              <label>Guest Name</label>
              <input className="form-control" value={guestName}
                onChange={e => setGuestName(e.target.value)} placeholder="Guest name" />
            </div>
          </div>

          <div className="menu-grid">
            {menuItems.filter(m => m.available !== false).map(item => (
              <div key={item.id} className="menu-item-card">
                <div className="menu-item-info">
                  <strong>{item.name}</strong>
                  <span className="menu-item-cat">{item.category?.replace(/_/g, ' ')}</span>
                  <span className="menu-item-price">{formatCurrency(item.price)}</span>
                </div>
                <div className="menu-item-qty">
                  {cart[item.id] > 0 ? (
                    <div className="qty-controls">
                      <button className="qty-btn" onClick={() => removeItem(item.id)}>-</button>
                      <span>{cart[item.id]}</span>
                      <button className="qty-btn" onClick={() => addItem(item.id)}>+</button>
                    </div>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => addItem(item.id)}>
                      <i className="fas fa-plus"></i> Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {notes && (
            <div className="form-group mt-2">
              <label>Notes</label>
              <textarea className="form-control" rows={2} value={notes}
                onChange={e => setNotes(e.target.value)} placeholder="Special instructions..." />
            </div>
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total Items: {cartItems.reduce((sum, [, qty]) => sum + qty, 0)}</span>
            <span className="cart-total-price">{formatCurrency(total)}</span>
          </div>
          <div className="cart-actions">
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={placeOrder} disabled={submitting || cartItems.length === 0}>
              {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
              Place Order
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .cart-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; justify-content: flex-end; z-index: 1000;
        }
        .cart-drawer {
          width: 460px; max-width: 100vw;
          background: var(--white); height: 100vh;
          display: flex; flex-direction: column;
          box-shadow: var(--shadow-lg);
        }
        .cart-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px; border-bottom: 1px solid var(--border);
        }
        .cart-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
        .cart-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
        .menu-grid { display: flex; flex-direction: column; gap: 8px; }
        .menu-item-card {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px; border: 1px solid var(--border); border-radius: var(--radius);
        }
        .menu-item-info { display: flex; flex-direction: column; gap: 2px; }
        .menu-item-cat { font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize; }
        .menu-item-price { font-size: 0.85rem; font-weight: 600; color: var(--primary); }
        .qty-controls { display: flex; align-items: center; gap: 8px; }
        .qty-btn {
          width: 28px; height: 28px; border-radius: 50%;
          border: 1.5px solid var(--border); background: var(--white);
          cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center;
        }
        .qty-btn:hover { border-color: var(--primary); color: var(--primary); }
        .cart-footer {
          border-top: 1px solid var(--border); padding: 16px 24px;
        }
        .cart-total {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 12px; font-size: 0.9rem;
        }
        .cart-total-price { font-size: 1.2rem; font-weight: 700; color: var(--primary); }
        .cart-actions { display: flex; gap: 8px; }
        .cart-actions .btn { flex: 1; justify-content: center; }
      `}</style>
    </div>
  );
}

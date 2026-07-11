import { useState, useEffect } from 'react';
import { fetchAll, fetchById, insertRecord, updateRecord } from '../../services/supabaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { showError } from '../common/ConfirmDialog';

const LOYALTY_RATE = 100;
const TAX_RATE = 0.10;

function calcNights(checkIn, checkOut) {
  return Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
}

function sumOrderItems(totalAmount, items) {
  if (totalAmount > 0) return parseFloat(totalAmount);
  if (items && Array.isArray(items)) return items.reduce((s, i) => s + (parseFloat(i.price) || 0) * (parseInt(i.qty) || 1), 0);
  return 0;
}

export default function CheckoutBillModal({ booking, guestName, roomNumber, onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [guest, setGuest] = useState(null);
  const [foodOrders, setFoodOrders] = useState([]);
  const [barOrders, setBarOrders] = useState([]);
  const [manualItems, setManualItems] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nights = calcNights(booking.check_in_date, booking.check_out_date);
  const roomCharge = room ? parseFloat(room.price_per_night) * nights : 0;
  const foodTotal = foodOrders.reduce((s, o) => s + sumOrderItems(o.total_amount, o.items), 0);
  const barTotal = barOrders.reduce((s, o) => s + sumOrderItems(o.total_amount, o.items), 0);
  const manualTotal = manualItems.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);

  const subtotal = roomCharge + foodTotal + barTotal + manualTotal;
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + tax;
  const loyaltyPoints = Math.floor(grandTotal / LOYALTY_RATE);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (grandTotal > 0) setAmountPaid(grandTotal.toFixed(2));
  }, [grandTotal]);

  async function loadData() {
    try {
      const [roomRes, guestRes, foodRes, barRes, pmRes] = await Promise.all([
        booking.room_id ? fetchById('rooms', booking.room_id).catch(() => null) : null,
        booking.guest_id ? fetchById('guests', booking.guest_id).catch(() => null) : null,
        fetchAll('food_orders', { filters: { booking_id: booking.id, status: 'delivered' } }),
        fetchAll('bar_orders', { filters: { booking_id: booking.id, status: 'delivered' } }).catch(() => ({ data: [] })),
        fetchAll('payment_methods', { filters: { active: true } }),
      ]);
      setRoom(roomRes);
      setGuest(guestRes);
      setFoodOrders(foodRes.data || []);
      setBarOrders(barRes.data || []);
      setPaymentMethods(pmRes.data || []);
      if (pmRes.data?.length) setPaymentMethodId(pmRes.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function addManualItem() {
    setManualItems(i => [...i, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  }

  function updateManualItem(idx, field, value) {
    setManualItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.unit_price) || 0);
      }
      if (field === 'description') updated.description = value;
      return updated;
    }));
  }

  function removeManualItem(idx) {
    setManualItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // Build invoice line items
      const invoiceItems = [];

      if (roomCharge > 0) {
        invoiceItems.push({
          description: `Room ${room.room_number || ''} - ${nights} night(s) at ${formatCurrency(room.price_per_night)}/night`,
          quantity: nights,
          unit_price: parseFloat(room.price_per_night),
          total: roomCharge,
        });
      }

      foodOrders.forEach(o => {
        if (Array.isArray(o.items)) {
          o.items.forEach(item => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.qty) || 1;
            invoiceItems.push({
              description: `Food: ${item.name || 'Item'}`,
              quantity: qty,
              unit_price: price,
              total: price * qty,
            });
          });
        } else {
          invoiceItems.push({
            description: `Food Order #${o.id?.slice(0, 8) || ''}`,
            quantity: 1,
            unit_price: parseFloat(o.total_amount),
            total: parseFloat(o.total_amount),
          });
        }
      });

      barOrders.forEach(o => {
        if (Array.isArray(o.items)) {
          o.items.forEach(item => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.qty) || 1;
            invoiceItems.push({
              description: `Bar: ${item.name || 'Item'}`,
              quantity: qty,
              unit_price: price,
              total: price * qty,
            });
          });
        } else {
          invoiceItems.push({
            description: `Bar Order #${o.id?.slice(0, 8) || ''}`,
            quantity: 1,
            unit_price: parseFloat(o.total_amount),
            total: parseFloat(o.total_amount),
          });
        }
      });

      manualItems.forEach(i => {
        if (i.description && parseFloat(i.total) > 0) {
          invoiceItems.push({
            description: i.description,
            quantity: parseInt(i.quantity) || 1,
            unit_price: parseFloat(i.unit_price) || 0,
            total: parseFloat(i.total),
          });
        }
      });

      // Create invoice
      const invoice = await insertRecord('invoices', {
        booking_id: booking.id,
        guest_id: booking.guest_id || null,
        guest_name: guestName(booking),
        guest_email: booking.guest_email || guest?.email || null,
        items: invoiceItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(grandTotal.toFixed(2)),
        amount_paid: parseFloat(amountPaid) || 0,
        balance: parseFloat((grandTotal - (parseFloat(amountPaid) || 0)).toFixed(2)),
        status: (parseFloat(amountPaid) || 0) >= grandTotal ? 'paid' : (parseFloat(amountPaid) || 0) > 0 ? 'partial' : 'draft',
        due_date: new Date().toISOString().split('T')[0],
        notes: paymentNote || null,
      });

      // Record payment
      if (parseFloat(amountPaid) > 0 && paymentMethodId) {
        await insertRecord('payments', {
          invoice_id: invoice.id,
          amount: parseFloat(amountPaid),
          payment_method_id: paymentMethodId,
          notes: paymentNote || null,
          status: 'completed',
        });
      }

      // Update booking
      const bookingUpdates = {
        status: 'checked_out',
        total_amount: parseFloat(grandTotal.toFixed(2)),
      };
      await updateRecord('bookings', booking.id, bookingUpdates);

      // Update room
      if (booking.room_id) {
        await updateRecord('rooms', booking.room_id, { status: 'cleaning' });
      }

      // Loyalty points
      let pointsMsg = '';
      if (booking.guest_id && loyaltyPoints > 0) {
        try {
          const currentPoints = guest?.loyalty_points || 0;
          await updateRecord('guests', booking.guest_id, {
            loyalty_points: currentPoints + loyaltyPoints,
          });
          pointsMsg = ` · ${loyaltyPoints} loyalty points earned`;
        } catch (_) {
          pointsMsg = ` · ${loyaltyPoints} pts (loyalty not configured)`;
        }
      }

      onComplete?.(`${guestName(booking)} checked out. ${formatCurrency(grandTotal)} bill settled.${pointsMsg}`);
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="co-modal" onClick={e => e.stopPropagation()}>
        <div className="co-modal-header">
          <h2><i className="fas fa-sign-out-alt"></i> Check-Out & Bill</h2>
          <button className="co-modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>

        {loading ? (
          <div className="co-loading"><i className="fas fa-spinner fa-spin"></i> Loading...</div>
        ) : (
          <div className="co-modal-body">
            {/* Guest Info */}
            <div className="co-summary">
              <div className="co-summary-row">
                <span>Guest</span>
                <strong>{guestName(booking)}</strong>
              </div>
              <div className="co-summary-row">
                <span>Room</span>
                <strong>{roomNumber(booking)}{room ? ` · ${room.room_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}` : ''}</strong>
              </div>
              <div className="co-summary-row">
                <span>Stay</span>
                <strong>{formatDate(booking.check_in_date)} → {formatDate(booking.check_out_date)} ({nights} night{nights > 1 ? 's' : ''})</strong>
              </div>
              {guest && (
                <div className="co-summary-row">
                  <span>Loyalty Points</span>
                  <strong className="co-points">{guest.loyalty_points ?? 0} pts</strong>
                </div>
              )}
            </div>

            {/* Bill Items */}
            <div className="co-bill-section">
              <h3><i className="fas fa-receipt"></i> Bill Breakdown</h3>

              {roomCharge > 0 && (
                <div className="co-bill-row">
                  <div className="co-bill-desc">
                    <span className="co-bill-label">Room Charges</span>
                    <span className="co-bill-detail">{room.room_number} · {formatCurrency(room.price_per_night)} × {nights} night{nights > 1 ? 's' : ''}</span>
                  </div>
                  <span className="co-bill-amount">{formatCurrency(roomCharge)}</span>
                </div>
              )}

              {foodOrders.length > 0 && (
                <div className="co-bill-row">
                  <div className="co-bill-desc">
                    <span className="co-bill-label">Restaurant / Food</span>
                    <span className="co-bill-detail">{foodOrders.length} order{foodOrders.length > 1 ? 's' : ''}</span>
                  </div>
                  <span className="co-bill-amount">{formatCurrency(foodTotal)}</span>
                </div>
              )}

              {barOrders.length > 0 && (
                <div className="co-bill-row">
                  <div className="co-bill-desc">
                    <span className="co-bill-label">Bar</span>
                    <span className="co-bill-detail">{barOrders.length} order{barOrders.length > 1 ? 's' : ''}</span>
                  </div>
                  <span className="co-bill-amount">{formatCurrency(barTotal)}</span>
                </div>
              )}

              {manualItems.map((item, idx) => (
                <div key={idx} className="co-bill-row co-bill-manual">
                  <div className="co-bill-desc">
                    <input className="co-manual-input" value={item.description}
                      onChange={e => updateManualItem(idx, 'description', e.target.value)}
                      placeholder="Charge description" />
                    <div className="co-manual-details">
                      <input type="number" className="co-manual-sm" value={item.quantity}
                        onChange={e => updateManualItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                        min={1} placeholder="Qty" />
                      <input type="number" className="co-manual-sm" value={item.unit_price}
                        onChange={e => updateManualItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        min={0} step="0.01" placeholder="Price" />
                      <button className="co-manual-remove" onClick={() => removeManualItem(idx)}
                        title="Remove"><i className="fas fa-times"></i></button>
                    </div>
                  </div>
                  <span className="co-bill-amount">{formatCurrency(item.total)}</span>
                </div>
              ))}

              <button className="co-add-item-btn" onClick={addManualItem}>
                <i className="fas fa-plus-circle"></i> Add Charge
              </button>

              {/* Totals */}
              <div className="co-totals">
                <div className="co-total-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="co-total-row">
                  <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="co-total-row co-total-grand">
                  <span>Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
                {loyaltyPoints > 0 && (
                  <div className="co-total-row co-total-points">
                    <span>Loyalty Points Earned</span>
                    <span>+{loyaltyPoints} pts</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="co-payment-section">
              <h3><i className="fas fa-credit-card"></i> Payment</h3>
              <div className="co-payment-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Method</label>
                  <select className="form-control" value={paymentMethodId}
                    onChange={e => setPaymentMethodId(e.target.value)}>
                    {paymentMethods.length === 0 && <option value="">No methods configured</option>}
                    {paymentMethods.map(pm => (
                      <option key={pm.id} value={pm.id}>{pm.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Amount Paid</label>
                  <input className="form-control" type="number" value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    min={0} step="0.01" />
                </div>
              </div>
              <div className="form-group">
                <label>Note (optional)</label>
                <input className="form-control" value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  placeholder="Payment note..." />
              </div>
            </div>
          </div>
        )}

        <div className="co-modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" onClick={async () => {
            try {
              await handleSubmit();
            } catch (err) {
              showError('Check-Out Failed', err.message || 'Unknown error');
            }
          }} disabled={submitting || loading}>
            {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sign-out-alt"></i>}
            {submitting ? 'Processing...' : `Check Out & Settle Bill (${formatCurrency(grandTotal)})`}
          </button>
        </div>
      </div>

      <style>{`
        .co-modal {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .co-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .co-modal-header h2 { margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 10px; }
        .co-modal-header h2 i { color: var(--accent); }
        .co-modal-close { background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; padding: 4px; }
        .co-modal-close:hover { color: var(--text); }
        .co-loading { padding: 60px; text-align: center; color: var(--text-muted); }
        .co-modal-body { padding: 24px; }
        .co-modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px 20px;
          border-top: 1px solid var(--border);
        }

        .co-summary {
          background: var(--bg-alt);
          border-radius: var(--radius);
          padding: 14px 16px;
          margin-bottom: 20px;
        }
        .co-summary-row {
          display: flex; justify-content: space-between;
          padding: 4px 0; font-size: 0.85rem;
        }
        .co-summary-row span { color: var(--text-muted); }
        .co-summary-row strong { color: var(--text); }
        .co-points { color: var(--accent) !important; }

        .co-bill-section { margin-bottom: 20px; }
        .co-bill-section h3, .co-payment-section h3 {
          font-size: 0.95rem; margin: 0 0 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .co-bill-section h3 i { color: var(--primary); }
        .co-payment-section h3 i { color: var(--accent); }

        .co-bill-row {
          display: flex; justify-content: space-between;
          padding: 8px 0; border-bottom: 1px solid var(--border);
          font-size: 0.85rem;
        }
        .co-bill-desc { flex: 1; }
        .co-bill-label { display: block; font-weight: 500; color: var(--text); }
        .co-bill-detail { display: block; font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
        .co-bill-amount { font-weight: 600; color: var(--text); white-space: nowrap; padding-left: 16px; }

        .co-bill-manual { padding: 4px 0; }
        .co-manual-input {
          width: 100%; border: 1px solid var(--border); border-radius: 4px;
          padding: 4px 8px; font-size: 0.8rem; background: var(--bg);
          color: var(--text);
        }
        .co-manual-details { display: flex; gap: 4px; margin-top: 4px; align-items: center; }
        .co-manual-sm {
          width: 60px; border: 1px solid var(--border); border-radius: 4px;
          padding: 3px 6px; font-size: 0.78rem; background: var(--bg);
          color: var(--text);
        }
        .co-manual-remove {
          background: none; border: none; color: var(--error); cursor: pointer;
          padding: 2px 6px; font-size: 0.8rem;
        }
        .co-manual-remove:hover { background: #fef2f2; border-radius: 4px; }

        .co-add-item-btn {
          background: none; border: 1px dashed var(--border);
          width: 100%; padding: 8px; margin-top: 8px;
          border-radius: var(--radius); cursor: pointer;
          color: var(--text-muted); font-size: 0.82rem;
          transition: var(--transition);
        }
        .co-add-item-btn:hover { border-color: var(--primary); color: var(--primary); }
        .co-add-item-btn i { margin-right: 4px; }

        .co-totals {
          margin-top: 12px; padding-top: 8px;
          border-top: 2px solid var(--border);
        }
        .co-total-row {
          display: flex; justify-content: space-between;
          padding: 3px 0; font-size: 0.85rem;
        }
        .co-total-row span:last-child { font-weight: 500; }
        .co-total-grand {
          font-size: 1.1rem; font-weight: 700;
          padding-top: 6px; border-top: 1px solid var(--border);
          margin-top: 4px;
        }
        .co-total-grand span:last-child { color: var(--primary); }
        .co-total-points span:last-child { color: var(--accent); font-weight: 700; }

        .co-payment-section { margin-bottom: 8px; }
        .co-payment-row { display: flex; gap: 16px; }

        @media (max-width: 768px) {
          .co-modal { margin: 10px; border-radius: var(--radius-lg); }
          .co-payment-row { flex-direction: column; gap: 8px; }
        }
      `}</style>
    </div>
  );
}

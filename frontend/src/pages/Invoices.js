import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAll, fetchById, insertRecord, updateRecord, removeRecord } from '../services/supabaseService';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { showConfirm, showSuccess, showError, showToast } from '../components/common/ConfirmDialog';
import LineItemForm from '../components/finance/LineItemForm';
import PrintPreview from '../components/finance/PrintPreview';
import FileUpload from '../components/common/FileUpload';
import { sendEmail } from '../services/backendService';

export default function Invoices() {
  const [searchParams] = useSearchParams();
  const convertQuoteId = searchParams.get('convert');

  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [showPayment, setShowPayment] = useState(null);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  const [form, setForm] = useState({
    guest_name: '', guest_email: '', guest_phone: '',
    due_date: '', notes: '', quote_id: null,
  });

  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method_id: '', reference: '', notes: '', screenshot_url: '' });
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (convertQuoteId && quotes.length > 0) {
      const quote = quotes.find(q => q.id === convertQuoteId);
      if (quote) handleConvertFromQuote(quote);
    }
  }, [convertQuoteId, quotes]);

  async function loadData() {
    try {
      const [invRes, qRes, pmRes] = await Promise.all([
        fetchAll('invoices', { orderBy: 'created_at', orderDir: 'desc' }),
        fetchAll('quotes', { filters: { status: ['accepted', 'sent'].map(s => ({ operator: 'in', value: `(${s})` })) } }),
        fetchAll('payment_methods', { filters: { active: true } }),
      ]);
      setInvoices(invRes.data || []);
      setQuotes(qRes.data || []);
      setPaymentMethods(pmRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditInvoice(null);
    setForm({ guest_name: '', guest_email: '', guest_phone: '', due_date: '', notes: '', quote_id: null });
    setItems([{ description: '', quantity: 1, unit_price: 0 }]);
    setShowForm(true);
  }

  function handleConvertFromQuote(quote) {
    const qItems = typeof quote.items === 'string' ? JSON.parse(quote.items) : (quote.items || []);
    setEditInvoice(null);
    setForm({
      guest_name: quote.guest_name || '',
      guest_email: quote.guest_email || '',
      guest_phone: quote.guest_phone || '',
      due_date: '',
      notes: `Converted from Quote #${quote.id?.slice(0, 6)}`,
      quote_id: quote.id,
    });
    setItems(qItems);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.guest_name) return showError('Required', 'Guest name is required');
    const subtotal = items.reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    try {
      const payload = { ...form, items, subtotal, tax, total, balance: total, amount_paid: 0, status: editInvoice?.status || 'draft' };
      if (editInvoice) {
        await updateRecord('invoices', editInvoice.id, payload);
        showSuccess('Updated', 'Invoice updated');
      } else {
        await insertRecord('invoices', payload);
        if (form.quote_id) {
          await updateRecord('quotes', form.quote_id, { status: 'converted' });
        }
        showSuccess('Created', 'Invoice created');
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleStatusChange(invoice, newStatus) {
    try {
      await updateRecord('invoices', invoice.id, { status: newStatus });
      showToast('success', `Invoice ${newStatus}`);
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleSend(invoice) {
    if (!invoice.guest_email) return showError('No email', 'Guest has no email');
    const confirmed = await showConfirm({ title: 'Send invoice?', text: `Email to ${invoice.guest_email}`, confirmText: 'Send' });
    if (!confirmed) return;
    try {
      await sendEmail({
        to: invoice.guest_email,
        subject: `Invoice from Otel.Pro`,
        html: `<h1>Invoice</h1><p>Dear ${invoice.guest_name},</p><p>Amount Due: ${formatCurrency(invoice.balance || invoice.total)}</p><p>Due: ${invoice.due_date || 'N/A'}</p>`,
        type: 'invoice',
      });
      await updateRecord('invoices', invoice.id, { status: 'sent' });
      showSuccess('Sent', 'Invoice emailed');
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleRecordPayment(invoice) {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return showError('Invalid', 'Enter a valid amount');
    try {
      const amount = parseFloat(paymentForm.amount);
      const newPaid = parseFloat(invoice.amount_paid || 0) + amount;
      const newBalance = parseFloat(invoice.total) - newPaid;
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      await insertRecord('payments', {
        invoice_id: invoice.id,
        amount,
        payment_method_id: paymentForm.payment_method_id || null,
        reference: paymentForm.reference || '',
        screenshot_url: paymentForm.screenshot_url || null,
        notes: paymentForm.notes || '',
        status: 'completed',
      });

      await updateRecord('invoices', invoice.id, {
        amount_paid: newPaid,
        balance: newBalance,
        status: newStatus,
      });

      showSuccess('Payment Recorded', `${formatCurrency(amount)} received. Balance: ${formatCurrency(newBalance)}`);
      setShowPayment(null);
      setPaymentForm({ amount: '', payment_method_id: '', reference: '', notes: '', screenshot_url: '' });
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleDelete(invoice) {
    const confirmed = await showConfirm({ title: 'Delete invoice?', text: 'This cannot be undone.', confirmText: 'Delete' });
    if (!confirmed) return;
    try {
      await removeRecord('invoices', invoice.id);
      loadData();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  const filtered = statusFilter ? invoices.filter(i => i.status === statusFilter) : invoices;

  if (loading) return <div className="loading-spinner">Loading invoices...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>{invoices.length} total &middot; {invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length} outstanding</p>
        </div>
        <div className="flex gap-1">
          <button className="btn btn-primary" onClick={openNew}><i className="fas fa-plus"></i> New Invoice</button>
        </div>
      </div>

      <div className="card mb-2" style={{ maxWidth: 200 }}>
        <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Invoices</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Guest</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => (
              <tr key={inv.id} className={inv.status === 'overdue' ? 'row-overdue' : ''}>
                <td><strong>{inv.guest_name}</strong></td>
                <td>{formatCurrency(inv.total)}</td>
                <td className="text-success">{formatCurrency(inv.amount_paid || 0)}</td>
                <td><strong>{formatCurrency(inv.balance || inv.total)}</strong></td>
                <td>{inv.due_date ? formatDate(inv.due_date) : '-'}</td>
                <td><StatusBadge status={inv.status} /></td>
                <td>
                  <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setPreviewInvoice(inv)} title="Preview">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditInvoice(inv); setForm({ guest_name: inv.guest_name, guest_email: inv.guest_email || '', guest_phone: '', due_date: inv.due_date || '', notes: inv.notes || '', quote_id: inv.quote_id }); setItems(typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || [])); setShowForm(true); }} title="Edit">
                      <i className="fas fa-edit"></i>
                    </button>
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <button className="btn btn-primary btn-sm" onClick={() => { setShowPayment(inv); setPaymentForm({ amount: inv.balance || inv.total, payment_method_id: '', reference: '', notes: '' }); }} title="Record Payment">
                        <i className="fas fa-money-bill"></i>
                      </button>
                    )}
                    {inv.status === 'sent' && inv.guest_email && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleSend(inv)} title="Send Email">
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    )}
                    <select className="status-select" value={inv.status}
                      onChange={e => handleStatusChange(inv, e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="overdue">Overdue</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(inv)} title="Delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="text-center text-muted py-3">No invoices found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editInvoice ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Guest Name *</label>
                    <input className="form-control" value={form.guest_name}
                      onChange={e => setForm(p => ({ ...p, guest_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input className="form-control" value={form.guest_email}
                      onChange={e => setForm(p => ({ ...p, guest_email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" className="form-control" value={form.due_date}
                      onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Line Items</label>
                  <LineItemForm items={items} onChange={setItems} />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className={`fas fa-${editInvoice ? 'save' : 'plus'}`}></i>
                  {editInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewInvoice && (
        <PrintPreview
          title="Invoice"
          data={previewInvoice}
          items={typeof previewInvoice.items === 'string' ? JSON.parse(previewInvoice.items) : (previewInvoice.items || [])}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Payment</h2>
              <p className="text-muted">Invoice total: {formatCurrency(showPayment.total)} | Balance: {formatCurrency(showPayment.balance || showPayment.total)}</p>
              <button className="modal-close" onClick={() => setShowPayment(null)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Amount *</label>
                <input type="number" className="form-control" value={paymentForm.amount}
                  onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} min={0} step="0.01" />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select className="form-control" value={paymentForm.payment_method_id}
                  onChange={e => setPaymentForm(p => ({ ...p, payment_method_id: e.target.value }))}>
                  <option value="">Select method...</option>
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.name} ({pm.type})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Reference / Transaction ID</label>
                <input className="form-control" value={paymentForm.reference}
                  onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea className="form-control" rows={2} value={paymentForm.notes}
                  onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Payment Screenshot</label>
                <FileUpload
                  label="Upload payment screenshot"
                  folder="payments"
                  accept="image/*"
                  onUpload={result => {
                    if (result.url) setPaymentForm(p => ({ ...p, screenshot_url: result.url }));
                  }}
                />
                {paymentForm.screenshot_url && (
                  <a href={paymentForm.screenshot_url} target="_blank" rel="noreferrer" className="file-linked">
                    <i className="fas fa-external-link-alt"></i> View uploaded screenshot
                  </a>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPayment(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleRecordPayment(showPayment)}>
                <i className="fas fa-check"></i> Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: var(--white); border-radius: var(--radius-lg); width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
        .modal-lg { max-width: 720px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 8px; }
        .modal-header p { font-size: 0.85rem; width: 100%; }
        .modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
        .modal-body { padding: 24px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--border); }
        .status-select { padding: 4px 8px; border-radius: 100px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; cursor: pointer; outline: none; background: var(--bg); color: var(--text-secondary); border: 1px solid var(--border); -webkit-appearance: none; }
        .btn-danger { background: var(--error); color: var(--white); border: none; }
        .btn-danger:hover { opacity: 0.9; }
        .row-overdue { background: rgba(239,68,68,0.05); }
        .py-3 { padding-top: 24px; padding-bottom: 24px; }
      `}</style>
    </div>
  );
}

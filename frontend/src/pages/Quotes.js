import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAll, insertRecord, updateRecord, removeRecord } from '../services/supabaseService';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { showConfirm, showSuccess, showError, showToast } from '../components/common/ConfirmDialog';
import DetailModal from '../components/common/DetailModal';
import ViewToggle from '../components/common/ViewToggle';
import LineItemForm from '../components/finance/LineItemForm';
import PrintPreview from '../components/finance/PrintPreview';
import { sendEmail } from '../services/backendService';

export default function Quotes() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editQuote, setEditQuote] = useState(null);
  const [previewQuote, setPreviewQuote] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    guest_name: '', guest_email: '', guest_phone: '',
    valid_until: '', notes: '',
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    loadQuotes();
  }, []);

  async function loadQuotes() {
    try {
      const { data } = await fetchAll('quotes', { orderBy: 'created_at', orderDir: 'desc' });
      setQuotes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditQuote(null);
    setForm({ guest_name: '', guest_email: '', guest_phone: '', valid_until: '', notes: '' });
    setItems([{ description: '', quantity: 1, unit_price: 0 }]);
    setShowForm(true);
  }

  function openEdit(quote) {
    setEditQuote(quote);
    setForm({
      guest_name: quote.guest_name || '',
      guest_email: quote.guest_email || '',
      guest_phone: quote.guest_phone || '',
      valid_until: quote.valid_until || '',
      notes: quote.notes || '',
    });
    setItems(typeof quote.items === 'string' ? JSON.parse(quote.items) : (quote.items || []));
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.guest_name) return showError('Required', 'Guest name is required');
    const subtotal = items.reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    try {
      const payload = { ...form, items, subtotal, tax, total, status: editQuote?.status || 'draft' };
      if (editQuote) {
        await updateRecord('quotes', editQuote.id, payload);
        showSuccess('Updated', 'Quote updated');
      } else {
        await insertRecord('quotes', payload);
        showSuccess('Created', 'Quote created');
      }
      setShowForm(false);
      loadQuotes();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleStatusChange(quote, newStatus) {
    try {
      await updateRecord('quotes', quote.id, { status: newStatus });
      showToast('success', `Quote ${newStatus}`);
      loadQuotes();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleSend(quote) {
    if (!quote.guest_email) return showError('No email', 'Guest has no email address');
    const confirmed = await showConfirm({ title: 'Send quote to guest?', text: `Email to ${quote.guest_email}`, confirmText: 'Send' });
    if (!confirmed) return;
    try {
      const items = typeof quote.items === 'string' ? JSON.parse(quote.items) : (quote.items || []);
      const subtotal = items.reduce((s, i) => s + parseFloat(i.total || 0), 0);
      const total = subtotal + subtotal * 0.1;
      await sendEmail({
        to: quote.guest_email,
        subject: `Quote from Otel.Pro`,
        html: `<h1>Quote</h1><p>Dear ${quote.guest_name},</p><p>Total: ${formatCurrency(total)}</p><p>Valid until: ${quote.valid_until || 'N/A'}</p>`,
        type: 'quote',
      });
      await updateRecord('quotes', quote.id, { status: 'sent' });
      showSuccess('Sent', 'Quote emailed to guest');
      loadQuotes();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleDelete(quote) {
    const confirmed = await showConfirm({ title: 'Delete quote?', text: 'This cannot be undone.', confirmText: 'Delete' });
    if (!confirmed) return;
    try {
      await removeRecord('quotes', quote.id);
      loadQuotes();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  const filtered = statusFilter ? quotes.filter(q => q.status === statusFilter) : quotes;

  if (loading) return <div className="loading-spinner">Loading quotes...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Quotes</h1>
          <p>{quotes.length} total &middot; {quotes.filter(q => q.status === 'draft').length} drafts</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><i className="fas fa-plus"></i> New Quote</button>
      </div>

      <div className="toolbar-row">
        <div className="card" style={{ maxWidth: 200 }}>
          <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Quotes</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="converted">Converted</option>
          </select>
        </div>
        <ViewToggle view={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === 'table' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Email</th>
                <th>Total</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} className="clickable-row" onClick={() => setSelectedQuote(q)}>
                  <td><strong>{q.guest_name}</strong></td>
                  <td className="text-muted">{q.guest_email || '-'}</td>
                  <td><strong>{formatCurrency(q.total || q.subtotal * 1.1)}</strong></td>
                  <td>{q.valid_until ? formatDate(q.valid_until) : '-'}</td>
                  <td><StatusBadge status={q.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); setPreviewQuote(q); }} title="Preview">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); openEdit(q); }} title="Edit">
                        <i className="fas fa-edit"></i>
                      </button>
                      {q.status === 'draft' && q.guest_email && (
                        <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); handleSend(q); }} title="Send">
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      )}
                      {q.status !== 'converted' && (
                        <button className="btn btn-accent btn-sm"
                          onClick={e => { e.stopPropagation(); navigate(`/invoices?convert=${q.id}`); }} title="Convert to Invoice">
                          <i className="fas fa-file-invoice"></i>
                        </button>
                      )}
                      <select className="status-select" value={q.status}
                        onChange={e => handleStatusChange(q, e.target.value)}>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                      </select>
                      <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(q); }} title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted py-3">No quotes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(q => (
            <div key={q.id} className="card-grid-item">
              <div className="card-grid-head" onClick={() => setSelectedQuote(q)}>
                <strong className="text-truncate">{q.guest_name}</strong>
                <span className="text-muted text-truncate">{q.guest_email || '-'}</span>
              </div>
              <div className="card-grid-body">
                <div className="card-field text-truncate">
                  <span className="card-label">Total</span>
                  <strong>{formatCurrency(q.total || q.subtotal * 1.1)}</strong>
                </div>
                <div className="card-field text-truncate">
                  <span className="card-label">Valid Until</span>
                  <span>{q.valid_until ? formatDate(q.valid_until) : '-'}</span>
                </div>
                <div className="card-field text-truncate">
                  <span className="card-label">Status</span>
                  <StatusBadge status={q.status} />
                </div>
              </div>
              <div className="card-grid-actions">
                <button className="btn btn-outline btn-sm" onClick={() => setPreviewQuote(q)} title="Preview">
                  <i className="fas fa-eye"></i>
                </button>
                <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); openEdit(q); }} title="Edit">
                  <i className="fas fa-edit"></i>
                </button>
                {q.status === 'draft' && q.guest_email && (
                  <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); handleSend(q); }} title="Send">
                    <i className="fas fa-paper-plane"></i>
                  </button>
                )}
                {q.status !== 'converted' && (
                  <button className="btn btn-accent btn-sm"
                    onClick={e => { e.stopPropagation(); navigate(`/invoices?convert=${q.id}`); }} title="Convert to Invoice">
                    <i className="fas fa-file-invoice"></i>
                  </button>
                )}
                <select className="status-select" value={q.status}
                  onChange={e => handleStatusChange(q, e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
                <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(q); }} title="Delete">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-muted py-3" style={{ gridColumn: '1 / -1' }}>No quotes found.</div>
          )}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editQuote ? 'Edit Quote' : 'New Quote'}</h2>
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
                    <label>Phone</label>
                    <input className="form-control" value={form.guest_phone}
                      onChange={e => setForm(p => ({ ...p, guest_phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Valid Until</label>
                    <input type="date" className="form-control" value={form.valid_until}
                      onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))} />
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
                  <i className={`fas fa-${editQuote ? 'save' : 'plus'}`}></i>
                  {editQuote ? 'Update Quote' : 'Create Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedQuote && (
        <DetailModal item={selectedQuote} title="Quote Details"
          fields={[
            { key: 'guest_name', label: 'Guest' },
            { key: 'guest_email', label: 'Email' },
            { key: 'guest_phone', label: 'Phone' },
            { key: 'total', label: 'Total', render: v => formatCurrency(v) },
            { key: 'valid_until', label: 'Valid Until', render: v => formatDate(v) },
            { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            { key: 'notes', label: 'Notes', hide: v => !v },
            { key: 'created_at', label: 'Created', render: v => formatDate(v) },
          ]}
          onClose={() => setSelectedQuote(null)} />
      )}

      {previewQuote && (
        <PrintPreview
          title="Quote"
          data={previewQuote}
          items={typeof previewQuote.items === 'string' ? JSON.parse(previewQuote.items) : (previewQuote.items || [])}
          onClose={() => setPreviewQuote(null)}
        />
      )}

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: var(--white); border-radius: var(--radius-lg); width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
        .modal-lg { max-width: 720px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); }
        .modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
        .modal-body { padding: 24px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--border); }
        .toolbar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .clickable-row { cursor: pointer; transition: background 0.15s; }
        .clickable-row:hover { background: var(--bg-alt); }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .card-grid-item { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s; }
        .card-grid-item:hover { box-shadow: var(--shadow-md); }
        .card-grid-head { padding: 14px 16px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; border-bottom: 1px solid var(--border-light); }
        .card-grid-head strong { font-size: 0.95rem; }
        .card-grid-head span { font-size: 0.8rem; }
        .card-grid-body { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
        .card-field { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
        .card-label { color: var(--text-muted); }
        .card-grid-actions { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border-top: 1px solid var(--border-light); flex-wrap: wrap; }
        .status-select { padding: 4px 8px; border-radius: 100px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; cursor: pointer; outline: none; background: var(--bg); color: var(--text-secondary); border: 1px solid var(--border); -webkit-appearance: none; }
        .btn-accent { background: var(--accent); color: var(--white); border: none; }
        .btn-accent:hover { background: var(--accent-hover); }
        .btn-danger { background: var(--error); color: var(--white); border: none; }
        .btn-danger:hover { opacity: 0.9; }
        .py-3 { padding-top: 24px; padding-bottom: 24px; }
        .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; max-width: 100%; }
        .text-wrap { white-space: normal; word-break: break-word; overflow-wrap: break-word; }
        .card-grid-item { overflow: hidden; }
        .card-grid-body { min-width: 0; }
        .card-grid-head strong, .card-grid-head span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
        .card-grid-actions { overflow: hidden; }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { fetchAll } from '../services/supabaseService';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import DetailModal from '../components/common/DetailModal';
import ViewToggle from '../components/common/ViewToggle';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [payRes, invRes, pmRes] = await Promise.all([
        fetchAll('payments', { orderBy: 'created_at', orderDir: 'desc' }),
        fetchAll('invoices', { orderBy: 'created_at', orderDir: 'desc' }),
        fetchAll('payment_methods'),
      ]);
      setPayments(payRes.data || []);
      setInvoices(invRes.data || []);
      setPaymentMethods(pmRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = payments.filter(p => {
    const inv = invoices.find(i => i.id === p.invoice_id);
    const guestName = (inv?.guest_name || '').toLowerCase();
    const q = search.toLowerCase();
    if (search && !guestName.includes(q)) return false;
    if (methodFilter && p.payment_method_id !== methodFilter) return false;
    if (startDate && p.created_at && p.created_at < startDate) return false;
    if (endDate && p.created_at && p.created_at > endDate + 'T23:59:59') return false;
    return true;
  });

  const totalReceived = filtered.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  if (loading) return <div className="loading-spinner">Loading payments...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Transaction History</h1>
          <p>{payments.length} total transactions &middot; {formatCurrency(totalReceived)} in filtered view</p>
        </div>
      </div>

      <div className="card mb-2">
        <div className="toolbar-row">
          <div className="filters-row">
            <input className="form-control" placeholder="Search by guest name..." value={search}
              onChange={e => setSearch(e.target.value)} />
            <select className="form-control" value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
              <option value="">All Methods</option>
              {paymentMethods.map(pm => (
                <option key={pm.id} value={pm.id}>{pm.name}</option>
              ))}
            </select>
            <input type="date" className="form-control" value={startDate}
              onChange={e => setStartDate(e.target.value)} title="From" />
            <input type="date" className="form-control" value={endDate}
              onChange={e => setEndDate(e.target.value)} title="To" />
          </div>
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Guest</th>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const inv = invoices.find(i => i.id === p.invoice_id);
                const method = paymentMethods.find(m => m.id === p.payment_method_id);
                return (
                  <tr key={p.id} className="clickable-row" onClick={() => setSelectedPayment(p)}>
                    <td className="text-muted">{formatDateTime(p.created_at)}</td>
                    <td><strong>{inv?.guest_name || '-'}</strong></td>
                    <td className="text-muted">{p.invoice_id?.slice(0, 6)}</td>
                    <td><strong className="text-success">{formatCurrency(p.amount)}</strong></td>
                    <td>{method?.name || p.payment_method_id?.slice(0, 8) || '-'}</td>
                    <td className="text-muted">{p.reference || '-'}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted py-3">No payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(p => {
            const inv = invoices.find(i => i.id === p.invoice_id);
            const method = paymentMethods.find(m => m.id === p.payment_method_id);
            return (
              <div key={p.id} className="card-grid-item" onClick={() => setSelectedPayment(p)}>
                <div className="card-grid-head">
                  <span className="text-muted">{formatDate(p.created_at)}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="card-grid-body">
                  <div className="text-truncate"><strong>{inv?.guest_name || '-'}</strong></div>
                  <div className="text-muted text-truncate">Invoice: {p.invoice_id?.slice(0, 6)}</div>
                  <div><strong className="text-success">{formatCurrency(p.amount)}</strong></div>
                  <div className="text-muted text-truncate">{method?.name || p.payment_method_id?.slice(0, 8) || '-'}</div>
                  <div className="text-muted text-truncate">{p.reference || '-'}</div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-muted py-3" style={{ gridColumn: '1 / -1' }}>No payments found.</div>
          )}
        </div>
      )}

      {selectedPayment && (
        <DetailModal item={selectedPayment} title="Payment Details"
          fields={[
            { key: 'created_at', label: 'Date', render: v => formatDate(v) },
            { key: 'amount', label: 'Amount', render: v => formatCurrency(v) },
            { key: 'reference', label: 'Reference' },
            { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            { key: 'notes', label: 'Notes', hide: v => !v },
          ]}
          onClose={() => setSelectedPayment(null)} />
      )}

      <style>{`
        .toolbar-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .toolbar-row .filters-row {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 200px 160px 160px;
          gap: 12px;
        }
        .clickable-row { cursor: pointer; }
        .clickable-row:hover { background: var(--bg-alt); }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .card-grid-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          transition: var(--transition);
        }
        .card-grid-item:hover { box-shadow: var(--shadow-md); border-color: var(--primary-light); }
        .card-grid-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-light);
          font-size: 0.8rem;
        }
        .card-grid-body { padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; }
        .card-grid-actions { padding: 8px 16px; border-top: 1px solid var(--border-light); display: flex; gap: 8px; }
        .py-3 { padding-top: 24px; padding-bottom: 24px; }
        @media (max-width: 700px) {
          .toolbar-row { flex-direction: column; align-items: stretch; }
          .toolbar-row .filters-row { grid-template-columns: 1fr; }
        }
        .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; max-width: 100%; }
        .text-wrap { white-space: normal; word-break: break-word; overflow-wrap: break-word; }
        .card-grid-body { min-width: 0; }
        .card-grid-body div { overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </div>
  );
}

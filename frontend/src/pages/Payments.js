import { useState, useEffect } from 'react';
import { fetchAll } from '../services/supabaseService';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
      </div>

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
                <tr key={p.id}>
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

      <style>{`
        .filters-row {
          display: grid;
          grid-template-columns: 1fr 200px 160px 160px;
          gap: 12px;
        }
        .py-3 { padding-top: 24px; padding-bottom: 24px; }
        @media (max-width: 700px) {
          .filters-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

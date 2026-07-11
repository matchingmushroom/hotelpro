import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function LineItemForm({ items = [], onChange }) {
  const [rows, setRows] = useState(items.length > 0 ? items : [{ description: '', quantity: 1, unit_price: 0 }]);

  function updateRow(index, field, value) {
    const updated = rows.map((row, i) => {
      if (i !== index) return row;
      const newRow = { ...row, [field]: value };
      newRow.total = parseFloat((parseFloat(newRow.quantity) || 0) * (parseFloat(newRow.unit_price) || 0));
      return newRow;
    });
    setRows(updated);
    onChange(updated);
  }

  function addRow() {
    const updated = [...rows, { description: '', quantity: 1, unit_price: 0 }];
    setRows(updated);
    onChange(updated);
  }

  function removeRow(index) {
    if (rows.length <= 1) return;
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
    onChange(updated);
  }

  const subtotal = rows.reduce((sum, r) => sum + parseFloat(r.total || 0), 0);

  return (
    <div className="line-items">
      <div className="line-items-header">
        <span className="li-desc">Description</span>
        <span className="li-qty">Qty</span>
        <span className="li-price">Unit Price</span>
        <span className="li-total">Total</span>
        <span className="li-action"></span>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="line-item-row">
          <input className="form-control li-desc" value={row.description}
            onChange={e => updateRow(i, 'description', e.target.value)}
            placeholder="Item description..." />
          <input type="number" className="form-control li-qty" value={row.quantity}
            onChange={e => updateRow(i, 'quantity', e.target.value)} min={1} />
          <input type="number" className="form-control li-price" value={row.unit_price}
            onChange={e => updateRow(i, 'unit_price', e.target.value)} min={0} step="0.01" />
          <span className="li-total">{formatCurrency(row.total || 0)}</span>
          <button className="btn-icon" onClick={() => removeRow(i)} disabled={rows.length <= 1}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
      <button className="btn btn-outline btn-sm" onClick={addRow} style={{ marginTop: 8 }}>
        <i className="fas fa-plus"></i> Add Line
      </button>
      <div className="line-items-subtotal">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <style>{`
        .line-items { margin: 12px 0; }
        .line-items-header {
          display: flex; gap: 8px; font-size: 0.75rem; font-weight: 600;
          color: var(--text-muted); text-transform: uppercase; padding: 4px 0;
          border-bottom: 1px solid var(--border); margin-bottom: 8px;
        }
        .line-item-row {
          display: flex; gap: 8px; align-items: center; margin-bottom: 6px;
        }
        .li-desc { flex: 1; }
        .li-qty { width: 60px; }
        .li-price { width: 100px; }
        .li-total { width: 100px; font-weight: 600; font-size: 0.85rem; text-align: right; }
        .li-action { width: 30px; }
        .btn-icon {
          background: none; border: none; width: 30px; height: 30px;
          border-radius: 6px; cursor: pointer; color: var(--text-muted);
          display: inline-flex; align-items: center; justify-content: center;
        }
        .btn-icon:hover { color: var(--error); background: #fef2f2; }
        .btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }
        .line-items-subtotal {
          display: flex; justify-content: flex-end; gap: 8px;
          padding-top: 8px; margin-top: 8px; border-top: 2px solid var(--border);
          font-weight: 700; font-size: 1rem;
        }
      `}</style>
    </div>
  );
}

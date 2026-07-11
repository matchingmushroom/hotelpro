import { formatCurrency, formatDate } from '../../utils/formatters';

export default function PrintPreview({ title, data, items, onClose }) {
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.total || 0), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  function handlePrint() {
    const printWin = window.open('', '_blank', 'width=800,height=600');
    printWin.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { font-family: 'Georgia', serif; padding: 40px; color: #1e293b; }
        .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; }
        .header h1 { margin: 0; font-size: 24px; color: #1a1a2e; }
        .header p { margin: 4px 0; color: #64748b; font-size: 14px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #1a1a2e; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
        td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .total-section { text-align: right; margin-top: 16px; }
        .total-row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; font-size: 14px; }
        .grand-total { font-size: 20px; font-weight: 700; color: #1a1a2e; border-top: 2px solid #1a1a2e; padding-top: 8px; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
      </style></head><body>
        <div class="header">
          <h1>Otel.Pro</h1>
          <p>${title}</p>
        </div>
        <div class="meta">
          <div>
            <strong>Date:</strong> ${formatDate(new Date())}<br>
            <strong>Guest:</strong> ${data.guest_name || 'N/A'}<br>
            <strong>Email:</strong> ${data.guest_email || '-'}
          </div>
          <div>
            ${data.valid_until ? `<strong>Valid Until:</strong> ${formatDate(data.valid_until)}<br>` : ''}
            ${data.due_date ? `<strong>Due Date:</strong> ${formatDate(data.due_date)}` : ''}
          </div>
        </div>
        <table>
          <tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr>
          ${items.map(i => `<tr><td>${i.description}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${formatCurrency(i.unit_price)}</td><td style="text-align:right">${formatCurrency(i.total)}</td></tr>`).join('')}
        </table>
        <div class="total-section">
          <div class="total-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
          <div class="total-row"><span>Tax (10%)</span><span>${formatCurrency(tax)}</span></div>
          <div class="total-row grand-total"><span>Total</span><span>${formatCurrency(total)}</span></div>
        </div>
        ${data.notes ? `<p style="margin-top:20px;font-style:italic;color:#64748b;">Notes: ${data.notes}</p>` : ''}
        <div class="footer"><p>Thank you for choosing Otel.Pro</p></div>
      </body></html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={e => e.stopPropagation()}>
        <div className="preview-header">
          <h2>Preview {title}</h2>
          <div className="preview-actions">
            <button className="btn btn-primary" onClick={handlePrint}>
              <i className="fas fa-print"></i> Print
            </button>
            <button className="btn btn-outline" onClick={onClose}>
              <i className="fas fa-times"></i> Close
            </button>
          </div>
        </div>
        <div className="preview-body">
          <div className="preview-doc">
            <div className="preview-doc-header">
              <h1>Otel.Pro</h1>
              <h3>{title}</h3>
            </div>
            <div className="preview-meta">
              <div>
                <p><strong>Guest:</strong> {data.guest_name || 'N/A'}</p>
                <p><strong>Email:</strong> {data.guest_email || '-'}</p>
              </div>
              <div>
                <p><strong>Date:</strong> {formatDate(new Date())}</p>
                {data.valid_until && <p><strong>Valid Until:</strong> {formatDate(data.valid_until)}</p>}
                {data.due_date && <p><strong>Due Date:</strong> {formatDate(data.due_date)}</p>}
              </div>
            </div>
            <table>
              <thead>
                <tr><th>Description</th><th style={{textAlign:'center'}}>Qty</th><th style={{textAlign:'right'}}>Unit Price</th><th style={{textAlign:'right'}}>Total</th></tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}><td>{item.description}</td><td style={{textAlign:'center'}}>{item.quantity}</td><td style={{textAlign:'right'}}>{formatCurrency(item.unit_price)}</td><td style={{textAlign:'right'}}>{formatCurrency(item.total)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="preview-totals">
              <div><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div><span>Tax (10%)</span><span>{formatCurrency(tax)}</span></div>
              <div className="preview-grand-total"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
            {data.notes && <p className="preview-notes"><em>Notes: {data.notes}</em></p>}
          </div>
        </div>
        <style>{`
          .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
          .preview-modal { background: var(--white); border-radius: var(--radius-lg); width: 100%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: var(--shadow-lg); }
          .preview-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--border); }
          .preview-header h2 { font-size: 1.1rem; }
          .preview-actions { display: flex; gap: 8px; }
          .preview-body { flex: 1; overflow-y: auto; padding: 24px; }
          .preview-doc { font-family: 'Georgia', serif; color: #1e293b; }
          .preview-doc-header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1a1a2e; padding-bottom: 12px; }
          .preview-doc-header h1 { margin: 0; color: #1a1a2e; font-size: 1.5rem; }
          .preview-doc-header h3 { margin: 4px 0 0; color: #64748b; font-weight: 400; }
          .preview-meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 0.85rem; }
          .preview-meta p { margin: 2px 0; }
          .preview-doc table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          .preview-doc th { background: #1a1a2e; color: white; padding: 8px 12px; text-align: left; font-size: 0.8rem; }
          .preview-doc td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; }
          .preview-totals { text-align: right; }
          .preview-totals div { display: flex; justify-content: flex-end; gap: 24px; padding: 2px 0; font-size: 0.9rem; }
          .preview-grand-total { font-size: 1.2rem; font-weight: 700; color: #1a1a2e; border-top: 2px solid #1a1a2e; padding-top: 6px; margin-top: 6px; }
          .preview-notes { margin-top: 16px; font-style: italic; color: #64748b; font-size: 0.85rem; }
        `}</style>
      </div>
    </div>
  );
}

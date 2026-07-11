export default function DetailModal({ item, fields, title, onClose }) {
  if (!item) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={e => e.stopPropagation()}>
        <div className="detail-modal-header">
          <h2><i className="fas fa-info-circle"></i> {title || 'Details'}</h2>
          <button className="detail-modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        <div className="detail-modal-body">
          {fields.map(f => {
            const val = item[f.key];
            const display = f.render ? f.render(val, item) : (val ?? '-');
            if (f.hide?.(val, item)) return null;
            return (
              <div className="detail-row" key={f.key}>
                <span className="detail-label">{f.label}</span>
                <span className="detail-value">{display}</span>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        .detail-modal {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-width: 520px;
          max-height: 80vh;
          overflow-y: auto;
        }
        .detail-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .detail-modal-header h2 { margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; }
        .detail-modal-header h2 i { color: var(--primary); }
        .detail-modal-close { background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; padding: 4px; }
        .detail-modal-close:hover { color: var(--text); }
        .detail-modal-body { padding: 20px 24px; }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-light);
          font-size: 0.85rem;
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: var(--text-muted); flex-shrink: 0; margin-right: 16px; min-width: 100px; }
        .detail-value { color: var(--text); font-weight: 500; text-align: right; word-break: break-word; max-width: 60%; }
        @media (max-width: 768px) {
          .detail-modal { margin: 10px; border-radius: var(--radius-lg); }
          .detail-row { flex-direction: column; gap: 2px; }
          .detail-label { min-width: auto; }
          .detail-value { text-align: left; max-width: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle">
      <button className={`vt-btn ${view === 'table' ? 'active' : ''}`} onClick={() => onChange('table')}
        title="Table view">
        <i className="fas fa-table"></i>
      </button>
      <button className={`vt-btn ${view === 'cards' ? 'active' : ''}`} onClick={() => onChange('cards')}
        title="Card view">
        <i className="fas fa-th-large"></i>
      </button>
      <style>{`
        .view-toggle {
          display: flex;
          background: var(--bg);
          border-radius: var(--radius);
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .vt-btn {
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.9rem;
          transition: var(--transition);
        }
        .vt-btn:hover { color: var(--text); background: var(--bg-alt); }
        .vt-btn.active { color: var(--primary); background: var(--white); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
      `}</style>
    </div>
  );
}

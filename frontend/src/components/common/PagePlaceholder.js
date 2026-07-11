export default function PagePlaceholder({ title = 'Page' }) {
  return (
    <div className="page-placeholder">
      <div className="placeholder-icon"><i className="fas fa-code"></i></div>
      <h2>{title}</h2>
      <p className="text-muted">This module will be implemented in the next development phase.</p>
      <style>{`
        .page-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 12px;
          text-align: center;
        }
        .placeholder-icon {
          font-size: 3rem;
          color: var(--text-muted);
          opacity: 0.5;
        }
        .page-placeholder h2 { color: var(--text-secondary); }
      `}</style>
    </div>
  );
}

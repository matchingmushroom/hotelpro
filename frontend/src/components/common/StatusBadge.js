import { STATUS_COLORS } from '../../utils/constants';
import { formatStatus } from '../../utils/formatters';

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#6b7280';

  return (
    <span className="status-badge" style={{
      background: color + '18',
      color: color,
      border: `1px solid ${color}30`,
    }}>
      {formatStatus(status)}
      <style>{`
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
      `}</style>
    </span>
  );
}

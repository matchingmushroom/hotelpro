import { useState, useEffect } from 'react';
import { fetchAll } from '../services/supabaseService';
import { formatCurrency } from '../utils/formatters';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function RoomCalendar() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetchAll('rooms', { orderBy: 'room_number' }),
        fetchAll('bookings'),
      ]);
      setRooms(roomsRes.data || []);
      setBookings(bookingsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(y, m) {
    return new Date(y, m + 1, 0).getDate();
  }

  function getFirstDayOfMonth(y, m) {
    return new Date(y, m, 1).getDay();
  }

  function getBookingsForRoomAndDate(roomId, dateStr) {
    return bookings.filter(b =>
      b.room_id === roomId &&
      b.check_in_date <= dateStr &&
      b.check_out_date > dateStr &&
      b.status !== 'cancelled'
    );
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  if (loading) return <div className="loading-spinner">Loading calendar...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Calendar View</h1>
        <p>Room availability across dates</p>
      </div>

      <div className="calendar-nav">
        <button className="btn btn-outline btn-sm" onClick={prevMonth}><i className="fas fa-chevron-left"></i></button>
        <h2>{MONTHS[month]} {year}</h2>
        <button className="btn btn-outline btn-sm" onClick={nextMonth}><i className="fas fa-chevron-right"></i></button>
        <button className="btn btn-outline btn-sm" onClick={() => setCurrentDate(new Date())}>Today</button>
      </div>

      <div className="calendar-legend">
        <span><span className="legend-dot available"></span> Available</span>
        <span><span className="legend-dot occupied"></span> Occupied</span>
        <span><span className="legend-dot cleaning"></span> Maintenance</span>
        <span><span className="legend-dot today-dot"></span> Today</span>
      </div>

      <div className="calendar-wrap">
        <div className="cal-header">
          <div className="cal-room-col">Room</div>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = new Date(year, month, i + 1);
            const dateStr = d.toISOString().split('T')[0];
            const isToday = dateStr === today;
            const dayName = DAYS[d.getDay()];
            return (
              <div key={i} className={`cal-day-header ${isToday ? 'today' : ''}`}>
                <span className="cal-day-name">{dayName}</span>
                <span className="cal-day-num">{i + 1}</span>
              </div>
            );
          })}
        </div>

        {rooms.map(room => (
          <div key={room.id} className="cal-row">
            <div className="cal-room-col">
              <strong>{room.room_number}</strong>
              <span className="text-muted">{room.room_type}</span>
            </div>
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = new Date(year, month, i + 1);
              const dateStr = d.toISOString().split('T')[0];
              const isToday = dateStr === today;
              const roomBookings = getBookingsForRoomAndDate(room.id, dateStr);
              const isOccupied = roomBookings.length > 0;

              let cellClass = 'cal-cell';
              if (isToday) cellClass += ' today-cell';
              if (isOccupied) cellClass += ' occupied';
              else if (room.status === 'maintenance' || room.status === 'out_of_order') cellClass += ' maintenance';

              return (
                <div key={i} className={cellClass} title={
                  isOccupied ? `${roomBookings[0].guest_name || 'Guest'}` : room.status
                }>
                  {isOccupied && <div className="cal-booking-indicator"></div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <style>{`
        .calendar-nav {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 16px;
        }
        .calendar-nav h2 { flex: 1; font-size: 1.2rem; }
        .calendar-legend {
          display: flex; gap: 20px; margin-bottom: 12px;
          font-size: 0.8rem; color: var(--text-secondary);
        }
        .legend-dot {
          display: inline-block; width: 10px; height: 10px;
          border-radius: 2px; margin-right: 6px;
        }
        .legend-dot.available { background: #22c55e; }
        .legend-dot.occupied { background: #ef4444; }
        .legend-dot.cleaning { background: #f59e0b; }
        .legend-dot.today-dot { border: 2px solid var(--primary); background: transparent; }
        .calendar-wrap {
          overflow-x: auto;
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow);
        }
        .cal-header, .cal-row {
          display: flex; min-width: max-content;
          border-bottom: 1px solid var(--border);
        }
        .cal-room-col {
          width: 120px; flex-shrink: 0;
          padding: 8px 12px;
          display: flex; flex-direction: column;
          font-size: 0.85rem;
          background: var(--bg);
          border-right: 1px solid var(--border);
          position: sticky; left: 0; z-index: 2;
        }
        .cal-day-header {
          width: 36px; flex-shrink: 0;
          padding: 6px 0;
          text-align: center;
          font-size: 0.7rem;
          display: flex; flex-direction: column;
          border-right: 1px solid var(--border);
        }
        .cal-day-header.today {
          background: var(--primary);
          color: var(--white);
        }
        .cal-day-name { color: var(--text-muted); }
        .cal-day-num { font-weight: 600; font-size: 0.85rem; }
        .cal-cell {
          width: 36px; flex-shrink: 0;
          height: 44px;
          border-right: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
        }
        .cal-cell.today-cell { border: 2px solid var(--primary); }
        .cal-cell.occupied { background: rgba(239,68,68,0.1); }
        .cal-cell.maintenance { background: rgba(245,158,11,0.1); }
        .cal-booking-indicator {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--error);
        }
        .cal-row:hover .cal-cell { background: var(--bg); }
        .cal-row:hover .cal-room-col { background: #e2e8f0; }
      `}</style>
    </div>
  );
}

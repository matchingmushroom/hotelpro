import { useState, useEffect } from 'react';
import { fetchAll } from '../services/supabaseService';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const CELL_W = 40;
const ROOM_COL_W = 130;

export default function RoomCalendar() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guestMap, setGuestMap] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [mobileRoom, setMobileRoom] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [roomsRes, bookingsRes, guestsRes] = await Promise.all([
        fetchAll('rooms', { orderBy: 'room_number' }),
        fetchAll('bookings'),
        fetchAll('guests'),
      ]);
      setRooms(roomsRes.data || []);
      setBookings(bookingsRes.data || []);
      const map = {};
      (guestsRes.data || []).forEach(g => { map[g.id] = g.name; });
      setGuestMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function guestName(booking) {
    return booking.guest_name || guestMap[booking.guest_id] || 'Guest';
  }

  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function firstDay(y, m) { return new Date(y, m, 1).getDay(); }
  function toDateStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const daysTotal = daysInMonth(year, month);
  const firstDayIdx = firstDay(year, month);
  const todayStr = new Date().toISOString().split('T')[0];

  function getBookingsForRoom(roomId) {
    return bookings.filter(b =>
      b.room_id === roomId &&
      b.status !== 'cancelled'
    );
  }

  function getBookingSpans(roomId) {
    const spans = [];
    const roomBookings = getBookingsForRoom(roomId);
    const monthStart = toDateStr(year, month, 1);
    const monthEnd = toDateStr(year, month, daysTotal);

    for (const b of roomBookings) {
      const start = b.check_in_date > monthStart ? b.check_in_date : monthStart;
      const end = b.check_out_date < monthEnd ? b.check_out_date : monthEnd;

      if (start > monthEnd || end < monthStart) continue;

      const startDay = parseInt(start.split('-')[2]);
      const endDay = Math.min(parseInt(end.split('-')[2]), daysTotal);

      spans.push({
        booking: b,
        startDay,
        endDay,
        left: (startDay - 1) * CELL_W,
        width: (endDay - startDay) * CELL_W,
        nights: endDay - startDay,
      });
    }
    return spans;
  }

  function isDateOccupied(roomId, day) {
    const dateStr = toDateStr(year, month, day);
    return bookings.some(b =>
      b.room_id === roomId &&
      b.check_in_date <= dateStr &&
      b.check_out_date > dateStr &&
      b.status !== 'cancelled'
    );
  }

  function getCellBooking(roomId, day) {
    const dateStr = toDateStr(year, month, day);
    return bookings.find(b =>
      b.room_id === roomId &&
      b.check_in_date <= dateStr &&
      b.check_out_date > dateStr &&
      b.status !== 'cancelled'
    );
  }

  function getBookingColor(booking) {
    if (!booking) return '#22c55e';
    if (booking.status === 'checked_out') return '#6b7280';
    if (booking.status === 'checked_in') return '#3b82f6';
    if (booking.booking_type === 'group') return '#8b5cf6';
    if (booking.booking_type === 'walk_in') return '#f59e0b';
    return '#6366f1';
  }

  const filteredRooms = rooms.filter(r => !filterType || r.room_type === filterType);

  // Stats
  const totalRooms = rooms.length;
  const todayAvailable = rooms.filter(r => r.status === 'available').length;
  const occupiedToday = bookings.filter(b =>
    b.check_in_date <= todayStr && b.check_out_date > todayStr && b.status !== 'cancelled'
  ).length;
  const occupancyRate = totalRooms ? Math.round((occupiedToday / totalRooms) * 100) : 0;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  if (loading) return <div className="loading-spinner">Loading calendar...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Room Calendar</h1>
          <p>{totalRooms} rooms &middot; {occupancyRate}% occupied today</p>
        </div>
        <select className="form-control" style={{ width: 'auto' }}
          value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {[...new Set(rooms.map(r => r.room_type))].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      <div className="cal-stats">
        <div className="cal-stat">
          <span className="cal-stat-value">{totalRooms}</span>
          <span className="cal-stat-label">Total Rooms</span>
        </div>
        <div className="cal-stat">
          <span className="cal-stat-value" style={{ color: 'var(--success)' }}>{todayAvailable}</span>
          <span className="cal-stat-label">Available Today</span>
        </div>
        <div className="cal-stat">
          <span className="cal-stat-value" style={{ color: 'var(--error)' }}>{occupiedToday}</span>
          <span className="cal-stat-label">Occupied Today</span>
        </div>
        <div className="cal-stat">
          <span className="cal-stat-value" style={{ color: 'var(--primary)' }}>{occupancyRate}%</span>
          <span className="cal-stat-label">Occupancy Rate</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="cal-nav">
        <button className="btn btn-outline btn-sm" onClick={prevMonth}><i className="fas fa-chevron-left"></i></button>
        <h2>{MONTHS[month]} {year}</h2>
        <button className="btn btn-outline btn-sm" onClick={nextMonth}><i className="fas fa-chevron-right"></i></button>
        <button className="btn btn-outline btn-sm" onClick={() => setCurrentDate(new Date())}>Today</button>
      </div>

      {/* Legend */}
      <div className="cal-legend">
        <span><span className="legend-dot" style={{ background: '#22c55e' }}></span> Available</span>
        <span><span className="legend-dot" style={{ background: '#6366f1' }}></span> Booked</span>
        <span><span className="legend-dot" style={{ background: '#f59e0b' }}></span> Walk-In</span>
        <span><span className="legend-dot" style={{ background: '#8b5cf6' }}></span> Group</span>
        <span><span className="legend-dot" style={{ background: '#3b82f6' }}></span> Checked In</span>
        <span><span className="legend-dot" style={{ background: 'var(--bg-alt)', border: '2px solid var(--primary)' }}></span> Today</span>
      </div>

      {/* ── Desktop View ── */}
      <div className="cal-desktop">
        <div className="cal-scroll">
          {/* Header row */}
          <div className="cal-header">
            <div className="cal-room-col">Room</div>
            {Array.from({ length: daysTotal }, (_, i) => {
              const d = new Date(year, month, i + 1);
              const dateStr = toDateStr(year, month, i + 1);
              const isToday = dateStr === todayStr;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div key={i} className={`cal-day-hdr ${isToday ? 'hdr-today' : ''} ${isWeekend ? 'hdr-weekend' : ''}`}
                  style={{ width: CELL_W }}>
                  <span className="cal-day-name">{DAYS_SHORT[d.getDay()]}</span>
                  <span className="cal-day-num">{i + 1}</span>
                </div>
              );
            })}
          </div>

          {/* Room rows */}
          {filteredRooms.map(room => {
            const spans = getBookingSpans(room.id);
            return (
              <div key={room.id} className="cal-row">
                <div className="cal-room-col" onClick={() => setMobileRoom(room)}>
                  <strong>{room.room_number}</strong>
                  <span className="room-col-type">{room.room_type}</span>
                  <span className="room-col-status">{room.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="cal-cells-wrap">
                  {/* Day cells */}
                  {Array.from({ length: daysTotal }, (_, i) => {
                    const day = i + 1;
                    const dateStr = toDateStr(year, month, day);
                    const isToday = dateStr === todayStr;
                    const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
                    const occupied = isDateOccupied(room.id, day);
                    const isCheckIn = bookings.some(b => b.room_id === room.id && b.check_in_date === dateStr && b.status !== 'cancelled');
                    const isCheckOut = bookings.some(b => b.room_id === room.id && b.check_out_date === dateStr && b.status !== 'cancelled');

                    let cls = 'cal-cell';
                    if (isToday) cls += ' cell-today';
                    if (isWeekend && !occupied) cls += ' cell-weekend';
                    if (isCheckIn) cls += ' cell-checkin';
                    if (isCheckOut) cls += ' cell-checkout';

                    const booking = getCellBooking(room.id, day);
                    return (
                      <div key={i} className={cls} style={{ width: CELL_W }}
                        onClick={() => booking && setSelectedBooking(booking)}
                        title={booking ? `${guestName(booking)} (${booking.booking_type})` : ''}>
                      </div>
                    );
                  })}
                  {/* Booking span bars */}
                  {spans.map((s, idx) => (
                    <div key={idx} className="cal-booking-bar"
                      style={{
                        left: s.left,
                        width: Math.max(s.width, 20),
                        background: getBookingColor(s.booking),
                      }}
                      onClick={() => setSelectedBooking(s.booking)}
                      title={`${guestName(s.booking)} · ${s.booking.check_in_date} → ${s.booking.check_out_date}`}>
                      {s.width > 50 && (
                        <span className="bar-label">
                          {guestName(s.booking)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile View ── */}
      <div className="cal-mobile">
        {filteredRooms.map(room => {
          const todayBookings = bookings.filter(b =>
            b.room_id === room.id &&
            b.check_in_date <= todayStr &&
            b.check_out_date > todayStr &&
            b.status !== 'cancelled'
          );
          const upcoming = bookings.filter(b =>
            b.room_id === room.id &&
            b.check_in_date > todayStr &&
            b.status !== 'cancelled'
          ).sort((a, b) => a.check_in_date.localeCompare(b.check_in_date)).slice(0, 3);

          return (
            <div key={room.id} className="mobile-room-card" onClick={() => setMobileRoom(room)}>
              <div className="mobile-room-head">
                <div>
                  <strong className="mobile-room-num">{room.room_number}</strong>
                  <span className="mobile-room-type">{room.room_type}</span>
                </div>
                <StatusBadge status={room.status} />
              </div>
              {todayBookings.length > 0 ? (
                <div className="mobile-room-guest">
                  <i className="fas fa-user"></i>
                  {guestName(todayBookings[0])}
                  <span className="mobile-guest-checkout">
                    Check-out: {formatDate(todayBookings[0].check_out_date)}
                  </span>
                </div>
              ) : (
                <div className="mobile-room-guest available-text">
                  <i className="fas fa-check-circle"></i> Available
                </div>
              )}
              <div className="mobile-room-price">{formatCurrency(room.price_per_night)}<small>/night</small></div>
              {upcoming.length > 0 && (
                <div className="mobile-upcoming">
                  <span className="mobile-upcoming-label">Upcoming:</span>
                  {upcoming.map(b => (
                    <span key={b.id} className="mobile-upcoming-chip">
                      {formatDate(b.check_in_date)} — {guestName(b)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Booking Detail Modal ── */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="modal-close" onClick={() => setSelectedBooking(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="bd-guest">{guestName(selectedBooking)}</div>
              <div className="bd-badge-row">
                <StatusBadge status={selectedBooking.status} />
                <span className="bd-type">{selectedBooking.booking_type}</span>
              </div>
              <div className="bd-grid">
                <div className="bd-item">
                  <span className="bd-label">Room</span>
                  <span className="bd-val">
                    {rooms.find(r => r.id === selectedBooking.room_id)?.room_number || selectedBooking.room_id?.slice(0, 8) || 'N/A'}
                  </span>
                </div>
                <div className="bd-item">
                  <span className="bd-label">Check-In</span>
                  <span className="bd-val">{formatDate(selectedBooking.check_in_date)}</span>
                </div>
                <div className="bd-item">
                  <span className="bd-label">Check-Out</span>
                  <span className="bd-val">{formatDate(selectedBooking.check_out_date)}</span>
                </div>
                <div className="bd-item">
                  <span className="bd-label">Guests</span>
                  <span className="bd-val">{(selectedBooking.adults || 0) + (selectedBooking.children || 0)}</span>
                </div>
              </div>
              {selectedBooking.special_requests && (
                <div className="bd-requests">
                  <span className="bd-label">Requests</span>
                  <p>{selectedBooking.special_requests}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Room Detail Modal ── */}
      {mobileRoom && (
        <div className="modal-overlay room-detail-overlay" onClick={() => setMobileRoom(null)}>
          <div className="room-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="room-detail-head" onClick={() => setMobileRoom(null)}>
              <div>
                <strong className="mobile-room-num">{mobileRoom.room_number}</strong>
                <span className="mobile-room-type">{mobileRoom.room_type}</span>
              </div>
              <i className="fas fa-chevron-down"></i>
            </div>
            <div className="room-detail-body">
              <div className="rd-stats">
                <div className="rd-stat">
                  <span className="rd-stat-val">{formatCurrency(mobileRoom.price_per_night)}</span>
                  <span className="rd-stat-lbl">Price/Night</span>
                </div>
                <div className="rd-stat">
                  <span className="rd-stat-val">Floor {mobileRoom.floor}</span>
                  <span className="rd-stat-lbl">Floor</span>
                </div>
                <div className="rd-stat">
                  <span className="rd-stat-val">{mobileRoom.capacity}</span>
                  <span className="rd-stat-lbl">Capacity</span>
                </div>
              </div>
              <h4 style={{ margin: '16px 0 10px', fontSize: '0.9rem' }}>
                {MONTHS[month]} {year} — Occupancy
              </h4>
              <div className="rd-month-grid">
                {Array.from({ length: daysTotal }, (_, i) => {
                  const day = i + 1;
                  const dateStr = toDateStr(year, month, day);
                  const isToday = dateStr === todayStr;
                  const occ = isDateOccupied(mobileRoom.id, day);
                  const booking = getCellBooking(mobileRoom.id, day);
                  return (
                    <div key={i}
                      className={`rd-day ${occ ? 'rd-occ' : 'rd-free'} ${isToday ? 'rd-today' : ''}`}
                      onClick={() => booking && setSelectedBooking(booking)}
                      title={booking ? `${guestName(booking)} (${booking.check_in_date}→${booking.check_out_date})` : ''}>
                      <span className="rd-day-num">{day}</span>
                      {occ && <span className="rd-day-dot"></span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cal-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }
        .cal-stat {
          background: var(--bg-card);
          border-radius: var(--radius);
          padding: 14px 16px;
          text-align: center;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
        }
        .cal-stat-value { font-size: 1.5rem; font-weight: 700; display: block; line-height: 1.2; }
        .cal-stat-label { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; display: block; }

        .cal-nav {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px;
        }
        .cal-nav h2 { flex: 1; font-size: 1.15rem; font-weight: 700; margin: 0; }

        .cal-legend {
          display: flex; flex-wrap: wrap; gap: 14px;
          margin-bottom: 14px;
          font-size: 0.75rem; color: var(--text-secondary);
        }
        .legend-dot {
          display: inline-block; width: 10px; height: 10px;
          border-radius: 3px; margin-right: 5px; vertical-align: middle;
        }

        /* ── Desktop ── */
        .cal-desktop { display: block; }
        .cal-scroll {
          overflow-x: auto;
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          position: relative;
          -webkit-overflow-scrolling: touch;
        }
        .cal-header, .cal-row {
          display: flex;
          min-width: max-content;
          border-bottom: 1px solid var(--border);
        }
        .cal-room-col {
          width: ${ROOM_COL_W}px;
          flex-shrink: 0;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          font-size: 0.82rem;
          background: var(--bg);
          border-right: 1px solid var(--border);
          position: sticky;
          left: 0;
          z-index: 3;
          cursor: pointer;
          transition: var(--transition);
        }
        .cal-room-col:hover { background: var(--bg-alt); }
        .room-col-type { font-size: 0.7rem; color: var(--text-muted); text-transform: capitalize; }
        .room-col-status { font-size: 0.65rem; color: var(--text-muted); text-transform: capitalize; margin-top: 2px; }

        .cal-day-hdr {
          flex-shrink: 0;
          padding: 6px 0;
          text-align: center;
          font-size: 0.68rem;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .cal-day-hdr.hdr-today { background: var(--primary); color: var(--white); }
        .cal-day-hdr.hdr-weekend:not(.hdr-today) { background: var(--bg-alt); }
        .cal-day-name { color: var(--text-muted); font-size: 0.6rem; }
        .cal-day-hdr.hdr-today .cal-day-name { color: rgba(255,255,255,0.7); }
        .cal-day-num { font-weight: 600; font-size: 0.8rem; }

        .cal-cells-wrap {
          display: flex;
          position: relative;
          flex: 1;
          min-height: 44px;
        }
        .cal-cell {
          flex-shrink: 0;
          height: 44px;
          border-right: 1px solid var(--border-light);
          cursor: pointer;
          transition: var(--transition);
          position: relative;
        }
        .cal-cell:hover { background: var(--bg-alt); }
        .cal-cell.cell-today { box-shadow: inset 0 0 0 2px var(--primary); z-index: 1; }
        .cal-cell.cell-weekend { background: rgba(0,0,0,0.02); }
        .cal-cell.cell-checkin { border-left: 2px solid var(--primary); }
        .cal-cell.cell-checkout { border-right: 2px solid var(--error); }

        .cal-booking-bar {
          position: absolute;
          top: 6px;
          height: 30px;
          border-radius: 6px;
          cursor: pointer;
          z-index: 2;
          display: flex;
          align-items: center;
          padding: 0 6px;
          opacity: 0.85;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          overflow: hidden;
        }
        .cal-booking-bar:hover {
          opacity: 1;
          transform: scaleY(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
          z-index: 4;
        }
        .bar-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cal-row:hover .cal-cell { background: var(--bg); }
        .cal-row:hover .cal-room-col { background: var(--bg-alt); }

        /* ── Mobile ── */
        .cal-mobile { display: none; }

        @media (max-width: 768px) {
          .cal-desktop { display: none; }
          .cal-mobile { display: flex; flex-direction: column; gap: 10px; }
          .cal-stats { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .cal-stat { padding: 10px; }
          .cal-stat-value { font-size: 1.2rem; }
          .cal-legend { gap: 8px; font-size: 0.7rem; }

          .mobile-room-card {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            padding: 14px 16px;
            box-shadow: var(--shadow-card);
            cursor: pointer;
            transition: var(--transition);
            border: 1px solid var(--border);
          }
          .mobile-room-card:hover { border-color: var(--primary-light); }
          .mobile-room-card:active { transform: scale(0.99); }

          .mobile-room-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
          }
          .mobile-room-num { font-size: 1rem; }
          .mobile-room-type {
            font-size: 0.78rem;
            color: var(--text-muted);
            text-transform: capitalize;
            margin-left: 8px;
          }
          .mobile-room-guest {
            font-size: 0.85rem;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 6px;
          }
          .mobile-room-guest i { color: var(--primary); width: 14px; }
          .mobile-room-guest.available-text i { color: var(--success); }
          .mobile-guest-checkout {
            font-size: 0.72rem;
            color: var(--text-muted);
            margin-left: auto;
          }
          .mobile-room-price {
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--primary);
          }
          .mobile-room-price small { font-size: 0.7rem; font-weight: 400; color: var(--text-muted); }

          .mobile-upcoming {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid var(--border);
          }
          .mobile-upcoming-label {
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-right: 2px;
          }
          .mobile-upcoming-chip {
            font-size: 0.72rem;
            padding: 3px 10px;
            border-radius: 100px;
            background: var(--bg-alt);
            border: 1px solid var(--border);
            color: var(--text-secondary);
          }
        }

        /* ── Booking Detail Modal ── */
        .bd-guest { font-size: 1.2rem; font-weight: 700; margin-bottom: 4px; }
        .bd-badge-row { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; }
        .bd-type {
          font-size: 0.75rem; padding: 3px 10px; border-radius: 100px;
          background: var(--bg-alt); color: var(--text-muted); text-transform: capitalize;
        }
        .bd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .bd-item { display: flex; flex-direction: column; gap: 2px; }
        .bd-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .bd-val { font-size: 0.92rem; font-weight: 600; color: var(--text); }
        .bd-requests { margin-top: 8px; }
        .bd-requests p { font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; }

        /* ── Mobile Room Detail ── */
        .room-detail-overlay {
          align-items: flex-end;
          padding: 0;
        }
        .room-detail-modal {
          background: var(--bg-card);
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          width: 100%;
          max-height: 75vh;
          overflow-y: auto;
          box-shadow: var(--shadow-xl);
        }
        .room-detail-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
        }
        .room-detail-head i { color: var(--text-muted); font-size: 1.2rem; }
        .room-detail-body { padding: 20px; }

        .rd-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .rd-stat {
          text-align: center;
          padding: 12px;
          background: var(--bg-alt);
          border-radius: var(--radius);
        }
        .rd-stat-val { font-size: 1rem; font-weight: 700; display: block; }
        .rd-stat-lbl { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; display: block; }

        .rd-month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .rd-day {
          aspect-ratio: 1;
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          cursor: pointer;
          transition: var(--transition);
          gap: 2px;
          background: var(--bg-alt);
        }
        .rd-day.rd-free { background: rgba(34, 197, 94, 0.08); }
        .rd-day.rd-occ { background: rgba(99, 102, 241, 0.12); }
        .rd-day.rd-today { box-shadow: inset 0 0 0 2px var(--primary); font-weight: 700; }
        .rd-day:hover { opacity: 0.8; }
        .rd-day-num { line-height: 1; }
        .rd-day-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: var(--primary);
        }

        @media (min-width: 769px) {
          .room-detail-overlay { display: none; }
        }
      `}</style>
    </div>
  );
}

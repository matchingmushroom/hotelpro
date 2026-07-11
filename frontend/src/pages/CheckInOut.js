import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAll, updateRecord, insertRecord } from '../services/supabaseService';
import { formatDate } from '../utils/formatters';
import { gasUploadFile } from '../services/gasService';
import StatusBadge from '../components/common/StatusBadge';
import { showSuccess, showError, showConfirm } from '../components/common/ConfirmDialog';
import CheckoutBillModal from '../components/checkout/CheckoutBillModal';

const todayISO = () => new Date().toISOString().split('T')[0];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CheckInOut() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('booking');

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('checkin');
  const [search, setSearch] = useState('');
  const [guestMap, setGuestMap] = useState({});
  const [roomMap, setRoomMap] = useState({});

  // Walk-in state
  const [walkinOpen, setWalkinOpen] = useState(false);
  const [walkinForm, setWalkinForm] = useState({
    guest_name: '', guest_email: '', guest_phone: '',
    room_id: '', check_in_date: todayISO(), check_out_date: '',
    adults: 1, children: 0, special_requests: '',
  });
  const [walkinDocFile, setWalkinDocFile] = useState(null);
  const [walkinDocUploading, setWalkinDocUploading] = useState(false);
  const [walkinDocUrl, setWalkinDocUrl] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [walkinErrors, setWalkinErrors] = useState({});
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);

  // Regular check-in modal state
  const [checkinModal, setCheckinModal] = useState(null);
  const [checkinPhone, setCheckinPhone] = useState('');
  const [checkinDocFile, setCheckinDocFile] = useState(null);
  const [checkinDocUploading, setCheckinDocUploading] = useState(false);
  const [checkinDocUrl, setCheckinDocUrl] = useState('');
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);

  useEffect(() => { loadBookings(); }, []);

  useEffect(() => {
    if (preselectedId && bookings.length) {
      const el = document.getElementById(`booking-${preselectedId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [preselectedId, bookings]);

  function guestName(b) {
    return b?.guest_name || guestMap[b?.guest_id] || 'Guest';
  }

  function roomNumber(b) {
    return roomMap[b?.room_id] || b?.room_id?.slice(0, 8) || '';
  }

  async function loadBookings() {
    try {
      const [bookingsRes, guestsRes, roomsRes] = await Promise.all([
        fetchAll('bookings', { orderBy: 'check_in_date' }),
        fetchAll('guests'),
        fetchAll('rooms'),
      ]);
      setBookings(bookingsRes.data || []);
      const gMap = {};
      (guestsRes.data || []).forEach(g => { gMap[g.id] = g.name; });
      setGuestMap(gMap);
      const rMap = {};
      (roomsRes.data || []).forEach(r => { rMap[r.id] = r.room_number; });
      setRoomMap(rMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableRooms() {
    try {
      const { data } = await fetchAll('rooms', { filters: { status: 'available' }, orderBy: 'room_number' });
      setAvailableRooms(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function uploadDoc(file, folder = 'guest-docs') {
    const base64 = await fileToBase64(file);
    const result = await gasUploadFile(base64.split(',')[1], file.name, file.type, folder);
    if (!result.success) throw new Error('Document upload failed');
    return result;
  }

  async function findOrCreateGuest(name, phone, email, docUrl) {
    if (!phone) return null;
    phone = phone.trim();
    const { data: existing } = await fetchAll('guests', { filters: { phone } });
    if (existing && existing.length > 0) {
      const guest = existing[0];
      const updates = {};
      if (docUrl) updates.id_card_front = docUrl;
      if (name && !guest.name) updates.name = name;
      if (email && !guest.email) updates.email = email;
      if (Object.keys(updates).length) await updateRecord('guests', guest.id, updates);
      return guest;
    }
    return await insertRecord('guests', {
      name: name || 'Unknown',
      phone,
      email: email || null,
      id_card_front: docUrl || null,
    });
  }

  // ── Walk-In ──

  function openWalkin() {
    setWalkinForm({
      guest_name: '', guest_email: '', guest_phone: '',
      room_id: '', check_in_date: todayISO(), check_out_date: '',
      adults: 1, children: 0, special_requests: '',
    });
    setWalkinDocFile(null);
    setWalkinDocUrl('');
    setWalkinDocUploading(false);
    setWalkinErrors({});
    loadAvailableRooms();
    setWalkinOpen(true);
  }

  function validateWalkin() {
    const e = {};
    if (!walkinForm.guest_name.trim()) e.guest_name = 'Guest name is required';
    if (!walkinForm.room_id) e.room_id = 'Select a room';
    if (!walkinForm.check_out_date) e.check_out_date = 'Check-out date is required';
    else if (walkinForm.check_out_date <= walkinForm.check_in_date) e.check_out_date = 'Must be after check-in';
    setWalkinErrors(e);
    return !Object.keys(e).length;
  }

  async function handleWalkinDocSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setWalkinDocFile(file);
    setWalkinDocUploading(true);
    try {
      const result = await uploadDoc(file);
      setWalkinDocUrl(result.url || 'uploaded');
      showSuccess('Document Uploaded', 'Customer document saved to Google Drive');
    } catch (err) {
      showError('Upload Failed', err.message);
      setWalkinDocFile(null);
    } finally {
      setWalkinDocUploading(false);
    }
  }

  async function handleWalkinSubmit(e) {
    e.preventDefault();
    if (!validateWalkin()) return;
    setWalkinSubmitting(true);
    try {
      const guest = await findOrCreateGuest(
        walkinForm.guest_name.trim(),
        walkinForm.guest_phone,
        walkinForm.guest_email.trim(),
        walkinDocUrl || null,
      );

      const payload = {
        guest_name: walkinForm.guest_name.trim(),
        guest_email: walkinForm.guest_email.trim() || null,
        guest_phone: walkinForm.guest_phone.trim() || null,
        room_id: walkinForm.room_id,
        check_in_date: walkinForm.check_in_date,
        check_out_date: walkinForm.check_out_date,
        adults: parseInt(walkinForm.adults),
        children: parseInt(walkinForm.children),
        special_requests: walkinForm.special_requests.trim() || null,
        status: 'checked_in',
        booking_type: 'walk_in',
        document_url: walkinDocUrl || null,
      };
      if (guest) payload.guest_id = guest.id;

      const booking = await insertRecord('bookings', payload);
      await updateRecord('rooms', walkinForm.room_id, { status: 'occupied' });

      const roomLabel = roomNumber(booking);
      showSuccess('Walk-In Check-In',
        `${walkinForm.guest_name} checked in to Room ${roomLabel}${guest ? ' · Guest registered' : ''}`
      );
      setWalkinOpen(false);
      loadBookings();
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setWalkinSubmitting(false);
    }
  }

  // ── Regular Check-In ──

  function openCheckinModal(booking) {
    setCheckinModal(booking);
    setCheckinPhone(booking.guest_phone || '');
    setCheckinDocFile(null);
    setCheckinDocUrl('');
    setCheckinDocUploading(false);
  }

  async function handleCheckinDocSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCheckinDocFile(file);
    setCheckinDocUploading(true);
    try {
      const result = await uploadDoc(file);
      setCheckinDocUrl(result.url || 'uploaded');
      showSuccess('Document Uploaded', 'Customer document saved to Google Drive');
    } catch (err) {
      showError('Upload Failed', err.message);
      setCheckinDocFile(null);
    } finally {
      setCheckinDocUploading(false);
    }
  }

  async function handleCheckinSubmit() {
    if (!checkinModal) return;
    setCheckinSubmitting(true);
    try {
      const guest = await findOrCreateGuest(
        checkinModal.guest_name || '',
        checkinPhone,
        checkinModal.guest_email || '',
        checkinDocUrl || null,
      );

      const updates = { status: 'checked_in' };
      if (checkinDocUrl) updates.document_url = checkinDocUrl;
      if (guest) updates.guest_id = guest.id;

      await updateRecord('bookings', checkinModal.id, updates);
      if (checkinModal.room_id) await updateRecord('rooms', checkinModal.room_id, { status: 'occupied' });

      const name = guestName(checkinModal);
      showSuccess('Checked In', `${name} checked in successfully${guest ? ' · Guest registered' : ''}`);
      setCheckinModal(null);
      loadBookings();
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setCheckinSubmitting(false);
    }
  }

  // ── Check-Out modal state ──
  const [checkoutBooking, setCheckoutBooking] = useState(null);

  function openCheckout(booking) {
    setCheckoutBooking(booking);
  }

  function onCheckoutComplete(message) {
    showSuccess('Checked Out', message);
    setCheckoutBooking(null);
    loadBookings();
  }

  // ── Render ──

  const checkIns = bookings.filter(b => b.status === 'confirmed');
  const checkOuts = bookings.filter(b => b.status === 'checked_in');

  const filtered = (tab === 'checkin' ? checkIns : checkOuts).filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (b.guest_name || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Check-In / Check-Out</h1>
          <p>Manage guest arrivals and departures</p>
        </div>
        <button className="btn btn-accent" onClick={openWalkin}>
          <i className="fas fa-walking"></i> Walk-In Check-In
        </button>
      </div>

      <div className="tabs mb-2">
        <button className={`tab ${tab === 'checkin' ? 'active' : ''}`} onClick={() => setTab('checkin')}>
          <i className="fas fa-sign-in-alt"></i> Check-In ({checkIns.length})
        </button>
        <button className={`tab ${tab === 'checkout' ? 'active' : ''}`} onClick={() => setTab('checkout')}>
          <i className="fas fa-sign-out-alt"></i> Check-Out ({checkOuts.length})
        </button>
      </div>

      <div className="card mb-2">
        <input className="form-control" placeholder="Search by guest name..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="booking-cards">
        {filtered.length === 0 && (
          <div className="card text-center text-muted py-3">
            No {tab === 'checkin' ? 'guests to check in' : 'guests to check out'}.
          </div>
        )}
        {filtered.map(booking => (
          <div key={booking.id} id={`booking-${booking.id}`} className="booking-card card">
            <div className="booking-card-main">
              <div className="booking-card-info">
                <div className="booking-card-name">
                  {guestName(booking)}
                  <StatusBadge status={booking.status} />
                </div>
                <div className="booking-card-details">
                  <span><i className="fas fa-door-open"></i> Room {roomNumber(booking)}</span>
                  <span><i className="fas fa-calendar-check"></i> {formatDate(booking.check_in_date)} → {formatDate(booking.check_out_date)}</span>
                  <span><i className="fas fa-user-friends"></i> {(booking.adults || 0) + (booking.children || 0)} guests</span>
                  {booking.special_requests && (
                    <span><i className="fas fa-comment"></i> {booking.special_requests}</span>
                  )}
                  {booking.document_url && (
                    <span><i className="fas fa-file-alt" style={{ color: 'var(--success)' }}></i> Document on file</span>
                  )}
                  {booking.guest_id && (
                    <span><i className="fas fa-id-card" style={{ color: 'var(--primary)' }}></i> Registered guest</span>
                  )}
                </div>
              </div>
              <div className="booking-card-action">
                {tab === 'checkin' && (
                  <button className="btn btn-primary btn-lg" onClick={() => openCheckinModal(booking)}>
                    <i className="fas fa-sign-in-alt"></i> Check In
                  </button>
                )}
                {tab === 'checkout' && (
                  <button className="btn btn-accent btn-lg" onClick={() => openCheckout(booking)}>
                    <i className="fas fa-sign-out-alt"></i> Check Out
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Regular Check-In Modal ── */}
      {checkinModal && (
        <div className="modal-overlay" onClick={() => setCheckinModal(null)}>
          <div className="checkin-modal" onClick={e => e.stopPropagation()}>
            <div className="checkin-modal-header">
              <h2><i className="fas fa-sign-in-alt"></i> Check-In Guest</h2>
              <button className="checkin-modal-close" onClick={() => setCheckinModal(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="checkin-modal-body">
              <div className="checkin-booking-summary">
                <div className="checkin-summary-row">
                  <span>Guest</span>
                  <strong>{guestName(checkinModal)}</strong>
                </div>
                <div className="checkin-summary-row">
                  <span>Room</span>
                  <strong>{roomNumber(checkinModal) || 'N/A'}</strong>
                </div>
                <div className="checkin-summary-row">
                  <span>Dates</span>
                  <strong>{formatDate(checkinModal.check_in_date)} → {formatDate(checkinModal.check_out_date)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number <span className="req">*</span></label>
                <div className="input-icon-group">
                  <i className="fas fa-phone input-icon"></i>
                  <input className="form-control" value={checkinPhone}
                    onChange={e => setCheckinPhone(e.target.value)}
                    placeholder="Customer phone for registration" />
                </div>
                <div className="form-help">Used to find or create customer record &amp; track loyalty points</div>
              </div>

              <div className="form-group">
                <label>Customer Document (ID Card / Passport)</label>
                {checkinDocUrl ? (
                  <div className="doc-uploaded">
                    <i className="fas fa-check-circle"></i> Document uploaded to Google Drive
                    <button type="button" className="doc-clear" onClick={() => { setCheckinDocFile(null); setCheckinDocUrl(''); }}>
                      <i className="fas fa-times"></i> Remove
                    </button>
                  </div>
                ) : (
                  <label className="doc-upload-btn">
                    {checkinDocUploading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                    ) : (
                      <><i className="fas fa-cloud-upload-alt"></i> Upload Document to Google Drive</>
                    )}
                    <input type="file" accept="image/*,.pdf" onChange={handleCheckinDocSelect} hidden disabled={checkinDocUploading} />
                  </label>
                )}
              </div>
            </div>
            <div className="checkin-modal-footer">
              <button className="btn btn-outline" onClick={() => setCheckinModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCheckinSubmit} disabled={checkinSubmitting}>
                {checkinSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sign-in-alt"></i>}
                {checkinSubmitting ? 'Processing...' : 'Confirm Check-In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Check-Out Modal ── */}
      {checkoutBooking && (
        <CheckoutBillModal
          booking={checkoutBooking}
          guestName={guestName}
          roomNumber={roomNumber}
          onClose={() => setCheckoutBooking(null)}
          onComplete={onCheckoutComplete}
        />
      )}

      {/* ── Walk-In Modal ── */}
      {walkinOpen && (
        <div className="modal-overlay" onClick={() => setWalkinOpen(false)}>
          <div className="walkin-modal" onClick={e => e.stopPropagation()}>
            <div className="walkin-header">
              <h2><i className="fas fa-walking"></i> Walk-In Check-In</h2>
              <button className="walkin-close" onClick={() => setWalkinOpen(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleWalkinSubmit}>
              <div className="walkin-body">
                <div className="form-group">
                  <label>Guest Name <span className="req">*</span></label>
                  <div className="input-icon-group">
                    <i className="fas fa-user input-icon"></i>
                    <input className={`form-control ${walkinErrors.guest_name ? 'error' : ''}`}
                      value={walkinForm.guest_name}
                      onChange={e => setWalkinForm(p => ({ ...p, guest_name: e.target.value }))}
                      placeholder="Full name" autoFocus />
                  </div>
                  {walkinErrors.guest_name && <div className="form-error">{walkinErrors.guest_name}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone <span className="req">*</span></label>
                    <div className="input-icon-group">
                      <i className="fas fa-phone input-icon"></i>
                      <input className="form-control"
                        value={walkinForm.guest_phone}
                        onChange={e => setWalkinForm(p => ({ ...p, guest_phone: e.target.value }))}
                        placeholder="+977 98..." />
                    </div>
                    <div className="form-help">Used to register &amp; track loyalty points</div>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <div className="input-icon-group">
                      <i className="fas fa-envelope input-icon"></i>
                      <input className="form-control" type="email"
                        value={walkinForm.guest_email}
                        onChange={e => setWalkinForm(p => ({ ...p, guest_email: e.target.value }))}
                        placeholder="guest@example.com" />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Room <span className="req">*</span></label>
                  <div className="room-select-grid">
                    {availableRooms.length === 0 ? (
                      <div className="text-muted" style={{ padding: '12px 0', fontSize: '0.85rem' }}>No available rooms right now.</div>
                    ) : availableRooms.map(room => (
                      <label key={room.id} className={`room-select-option ${walkinForm.room_id === room.id ? 'selected' : ''}`}>
                        <input type="radio" name="room_id" value={room.id} checked={walkinForm.room_id === room.id}
                          onChange={e => setWalkinForm(p => ({ ...p, room_id: e.target.value }))} />
                        <span className="room-select-number">{room.room_number}</span>
                        <span className="room-select-type">{room.room_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        <span className="room-select-price">{room.price_per_night}</span>
                      </label>
                    ))}
                  </div>
                  {walkinErrors.room_id && <div className="form-error">{walkinErrors.room_id}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Check-In</label>
                    <input className="form-control" type="date"
                      value={walkinForm.check_in_date}
                      onChange={e => setWalkinForm(p => ({ ...p, check_in_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Check-Out <span className="req">*</span></label>
                    <input className={`form-control ${walkinErrors.check_out_date ? 'error' : ''}`} type="date"
                      value={walkinForm.check_out_date}
                      onChange={e => setWalkinForm(p => ({ ...p, check_out_date: e.target.value }))}
                      min={walkinForm.check_in_date} />
                    {walkinErrors.check_out_date && <div className="form-error">{walkinErrors.check_out_date}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Adults</label>
                    <input className="form-control" type="number" min="1" max="20"
                      value={walkinForm.adults}
                      onChange={e => setWalkinForm(p => ({ ...p, adults: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Children</label>
                    <input className="form-control" type="number" min="0" max="20"
                      value={walkinForm.children}
                      onChange={e => setWalkinForm(p => ({ ...p, children: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Customer Document (ID Card / Passport)</label>
                  {walkinDocUrl ? (
                    <div className="doc-uploaded">
                      <i className="fas fa-check-circle"></i> Document uploaded to Google Drive
                      <button type="button" className="doc-clear" onClick={() => { setWalkinDocFile(null); setWalkinDocUrl(''); }}>
                        <i className="fas fa-times"></i> Remove
                      </button>
                    </div>
                  ) : (
                    <label className="doc-upload-btn">
                      {walkinDocUploading ? (
                        <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                      ) : (
                        <><i className="fas fa-cloud-upload-alt"></i> Upload Document to Google Drive</>
                      )}
                      <input type="file" accept="image/*,.pdf" onChange={handleWalkinDocSelect} hidden disabled={walkinDocUploading} />
                    </label>
                  )}
                </div>

                <div className="form-group">
                  <label>Special Requests</label>
                  <textarea className="form-control" rows="2"
                    value={walkinForm.special_requests}
                    onChange={e => setWalkinForm(p => ({ ...p, special_requests: e.target.value }))}
                    placeholder="Any special requests..." />
                </div>
              </div>
              <div className="walkin-footer">
                <button type="button" className="btn btn-outline" onClick={() => setWalkinOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent" disabled={walkinSubmitting}>
                  {walkinSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sign-in-alt"></i>}
                  {walkinSubmitting ? 'Processing...' : 'Check In Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tabs { display: flex; gap: 0; background: var(--white); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); }
        .tab {
          flex: 1; padding: 12px 24px; border: none; cursor: pointer;
          font-size: 0.9rem; font-weight: 500; background: var(--white); color: var(--text-muted);
          transition: var(--transition); border-bottom: 2px solid transparent;
        }
        .tab:hover { color: var(--text); background: var(--bg); }
        .tab.active { color: var(--primary); border-bottom-color: var(--primary); background: var(--bg); }
        .booking-cards { display: flex; flex-direction: column; gap: 12px; }
        .booking-card { transition: var(--transition); }
        .booking-card:hover { box-shadow: var(--shadow-md); }
        .booking-card-main { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .booking-card-info { flex: 1; }
        .booking-card-name {
          display: flex; align-items: center; gap: 8px;
          font-size: 1.1rem; font-weight: 600; margin-bottom: 8px;
        }
        .booking-card-details {
          display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.85rem; color: var(--text-secondary);
        }
        .booking-card-details i { width: 16px; color: var(--text-muted); }
        .booking-card-action { flex-shrink: 0; }
        .py-3 { padding-top: 40px; padding-bottom: 40px; }

        /* ── Check-In Modal ── */
        .checkin-modal {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .checkin-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .checkin-modal-header h2 {
          margin: 0;
          font-size: 1.15rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .checkin-modal-header h2 i { color: var(--primary); }
        .checkin-modal-close {
          background: none; border: none; font-size: 1.2rem;
          color: var(--text-muted); cursor: pointer; padding: 4px;
        }
        .checkin-modal-close:hover { color: var(--text); }
        .checkin-modal-body { padding: 24px; }
        .checkin-modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px 20px;
          border-top: 1px solid var(--border);
        }

        .checkin-booking-summary {
          background: var(--bg-alt);
          border-radius: var(--radius);
          padding: 14px 16px;
          margin-bottom: 20px;
        }
        .checkin-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 0.85rem;
        }
        .checkin-summary-row span { color: var(--text-muted); }
        .checkin-summary-row strong { color: var(--text); }

        .input-icon-group { position: relative; }
        .input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 0.85rem;
          pointer-events: none;
          z-index: 1;
        }
        .input-icon-group .form-control { padding-left: 42px; }

        /* ── Walk-In Modal ── */
        .walkin-modal {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .walkin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .walkin-header h2 {
          margin: 0;
          font-size: 1.15rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .walkin-header h2 i { color: var(--accent); }
        .walkin-close {
          background: none; border: none; font-size: 1.2rem;
          color: var(--text-muted); cursor: pointer; padding: 4px;
        }
        .walkin-close:hover { color: var(--text); }
        .walkin-body { padding: 24px; }
        .walkin-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px 20px;
          border-top: 1px solid var(--border);
        }
        .req { color: var(--error); }

        .room-select-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 8px;
          margin-top: 4px;
        }
        .room-select-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 12px 8px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .room-select-option:hover {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.04);
        }
        .room-select-option.selected {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .room-select-option input { display: none; }
        .room-select-number { font-weight: 700; font-size: 1rem; color: var(--text); }
        .room-select-type { font-size: 0.72rem; color: var(--text-muted); text-transform: capitalize; }
        .room-select-price { font-size: 0.85rem; font-weight: 600; color: var(--primary); }
        .room-select-price::before { content: 'NPR '; }

        /* ── Document Upload ── */
        .doc-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border: 2px dashed var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 0.85rem;
          transition: var(--transition);
          background: var(--bg);
        }
        .doc-upload-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .doc-upload-btn i { font-size: 1.1rem; }
        .doc-uploaded {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--success-bg);
          color: var(--success);
          border-radius: var(--radius);
          font-size: 0.85rem;
          font-weight: 500;
        }
        .doc-uploaded i { font-size: 1.1rem; }
        .doc-clear {
          background: none;
          border: none;
          color: var(--error);
          cursor: pointer;
          font-size: 0.78rem;
          margin-left: 8px;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .doc-clear:hover { background: var(--error-bg); }

        .form-help {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        @media (max-width: 768px) {
          .booking-card-main { flex-direction: column; align-items: flex-start; }
          .booking-card-action { width: 100%; }
          .booking-card-action .btn { width: 100%; justify-content: center; }
          .walkin-modal { margin: 10px; border-radius: var(--radius-lg); }
          .room-select-grid { grid-template-columns: repeat(2, 1fr); }
          .checkin-modal { margin: 10px; border-radius: var(--radius-lg); }
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAll, updateRecord, insertRecord } from '../services/supabaseService';
import { formatDate, formatCurrency } from '../utils/formatters';
import { gasUploadFile } from '../services/gasService';
import StatusBadge from '../components/common/StatusBadge';
import { showConfirm, showSuccess, showError } from '../components/common/ConfirmDialog';
import CheckoutBillModal from '../components/checkout/CheckoutBillModal';
import DetailModal from '../components/common/DetailModal';
import ViewToggle from '../components/common/ViewToggle';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [guestMap, setGuestMap] = useState({});
  const [guestDataMap, setGuestDataMap] = useState({});
const [roomMap, setRoomMap] = useState({});
const [rooms, setRooms] = useState([]);

// Check-in modal state
  const [checkinModal, setCheckinModal] = useState(null);
  const [checkinPhone, setCheckinPhone] = useState('');
  const [checkinDocFile, setCheckinDocFile] = useState(null);
  const [checkinDocUploading, setCheckinDocUploading] = useState(false);
  const [checkinDocUrl, setCheckinDocUrl] = useState('');
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);
  const [companions, setCompanions] = useState([]);

  // Modify modal state
  const [modifyModal, setModifyModal] = useState(null);
  const [modifyForm, setModifyForm] = useState({});
  const [modifySubmitting, setModifySubmitting] = useState(false);

  // Check-out modal state
  const [checkoutBooking, setCheckoutBooking] = useState(null);

  // Detail popup + view toggle
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [groupHighlight, setGroupHighlight] = useState(null);
  const [groupModal, setGroupModal] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const [bookingsRes, guestsRes, roomsRes] = await Promise.all([
        fetchAll('bookings', { orderBy: 'check_in_date', orderDir: 'desc' }),
        fetchAll('guests'),
        fetchAll('rooms'),
      ]);
      setBookings(bookingsRes.data || []);
      const gMap = {};
      const gdMap = {};
      (guestsRes.data || []).forEach(g => { gMap[g.id] = g.name; gdMap[g.id] = g; });
      setGuestMap(gMap);
      setGuestDataMap(gdMap);
      const rMap = {};
      (roomsRes.data || []).forEach(r => { rMap[r.id] = r.room_number; });
      setRoomMap(rMap);
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function guestName(b) {
    return b.guest_name || guestMap[b.guest_id] || 'Guest';
  }

  function roomNumber(b) {
    return roomMap[b.room_id] || b.room_id?.slice(0, 8) || '-';
  }

  async function handleCancel(booking) {
    const confirmed = await showConfirm({
      title: `Cancel Booking?`,
      text: `Cancel booking for ${guestName(booking)}?`,
      confirmText: 'Cancel Booking',
    });
    if (!confirmed) return;
    try {
      const { updateRecord } = await import('../services/supabaseService');
      await updateRecord('bookings', booking.id, { status: 'cancelled' });
      await updateRecord('rooms', booking.room_id, { status: 'available' });
      showSuccess('Cancelled', 'Booking cancelled');
      loadBookings();
    } catch (err) {
      showError('Error', err.message);
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

  function openCheckinModal(booking) {
    setCheckinModal(booking);
    setCheckinPhone(booking.guest_phone || '');
    setCheckinDocFile(null);
    setCheckinDocUrl('');
    setCheckinDocUploading(false);
    const totalGuests = (booking.adults || 1) + (booking.children || 0);
    const existing = booking.companions || [];
    setCompanions(
      Array.from({ length: Math.max(0, totalGuests - 1) }, (_, i) => existing[i] || { name: '', phone: '', address: '' })
    );
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

  function openModifyModal(booking) {
    const guest = booking.guest_id ? guestDataMap[booking.guest_id] : null;
    setModifyModal(booking);
    setModifyForm({
      guest_name: booking.guest_name || guest?.name || '',
      guest_email: booking.guest_email || guest?.email || '',
      guest_phone: booking.guest_phone || guest?.phone || '',
      room_id: booking.room_id || '',
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      adults: booking.adults || 1,
      children: booking.children || 0,
      special_requests: booking.special_requests || '',
    });
  }

  async function handleModifySubmit(e) {
    e.preventDefault();
    if (!modifyModal) return;
    setModifySubmitting(true);
    try {
      const updates = { ...modifyForm };
      if (!updates.room_id) delete updates.room_id;
      await updateRecord('bookings', modifyModal.id, updates);
      if (modifyForm.room_id && modifyForm.room_id !== modifyModal.room_id) {
        if (modifyModal.room_id) await updateRecord('rooms', modifyModal.room_id, { status: 'available' });
        const status = modifyModal.status === 'checked_in' ? 'occupied' : 'available';
        await updateRecord('rooms', modifyForm.room_id, { status });
      }
      showSuccess('Updated', 'Booking modified successfully');
      setModifyModal(null);
      loadBookings();
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setModifySubmitting(false);
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
      if (companions.some(c => c.name)) updates.companions = companions.filter(c => c.name);
      await updateRecord('bookings', checkinModal.id, updates);
      if (checkinModal.room_id) await updateRecord('rooms', checkinModal.room_id, { status: 'occupied' });
      showSuccess('Checked In', `${guestName(checkinModal)} checked in successfully${guest ? ' · Guest registered' : ''}`);
      setCheckinModal(null);
      loadBookings();
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setCheckinSubmitting(false);
    }
  }

  function onCheckoutComplete(message) {
    showSuccess('Checked Out', message);
    setCheckoutBooking(null);
    loadBookings();
  }

  const today = new Date().toISOString().split('T')[0];
  const filtered = bookings.filter(b => {
    // Hide past bookings (check_out before today)
    if (b.check_out_date < today) return false;
    // Hide cancelled by default (unless explicitly filtering by cancelled)
    if (b.status === 'cancelled' && statusFilter !== 'cancelled') return false;
    if (statusFilter && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = guestName(b).toLowerCase();
      return name.includes(q);
    }
    return true;
  });

  const groupMap = {};
  bookings.forEach(b => {
    if (b.group_id) {
      if (!groupMap[b.group_id]) groupMap[b.group_id] = [];
      groupMap[b.group_id].push(b.id);
    }
  });

  if (loading) return <div className="loading-spinner">Loading bookings...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bookings</h1>
          <p>{filtered.length} active &middot; {bookings.filter(b => b.status === 'confirmed').length} upcoming</p>
        </div>
        <div className="flex gap-1">
          <button className="btn btn-primary" onClick={() => navigate('/bookings/new')}>
            <i className="fas fa-plus"></i> New Booking
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/bookings/group')}>
            <i className="fas fa-users"></i> Group
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/bookings/walk-in')}>
            <i className="fas fa-walking"></i> Walk-In
          </button>
        </div>
      </div>

      <div className="card mb-2 flex-between">
        <input className="form-control" style={{ maxWidth: 300 }} placeholder="Search by guest name..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-1" style={{ alignItems: 'center' }}>
          <select className="form-control" style={{ maxWidth: 150 }} value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Nights</th>
                <th>Guests</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const nights = Math.max(1, Math.ceil((new Date(b.check_out_date) - new Date(b.check_in_date)) / (1000*60*60*24)));
                return (
                  <tr key={b.id} className={`clickable-row${groupHighlight === b.group_id ? ' group-highlight' : ''}`} onClick={() => setSelectedBooking(b)}>
                    <td><strong>{guestName(b)}</strong></td>
                    <td>Room {roomNumber(b)}</td>
                    <td>{formatDate(b.check_in_date)}</td>
                    <td>{formatDate(b.check_out_date)}</td>
                    <td>{nights}</td>
                    <td>{b.adults + (b.children || 0)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      {b.group_id && groupMap[b.group_id]?.length > 1 ? (
                        <span className="group-badge" onClick={() => { setGroupModal(b.group_id); setGroupHighlight(b.group_id); }}>
                          <i className="fas fa-users" /> Group · {groupMap[b.group_id].length}
                        </span>
                      ) : (
                        <span className="text-capitalize">{b.booking_type}</span>
                      )}
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="table-actions">
                        {b.status === 'checked_in' && (
                          <button className="btn-icon btn-icon-checkout" title="Check Out"
                            onClick={() => setCheckoutBooking(b)}>
                            <i className="fas fa-sign-out-alt"></i>
                          </button>
                        )}
                        {['confirmed', 'checked_in'].includes(b.status) && (
                          <button className="btn-icon" title="Modify"
                            onClick={() => openModifyModal(b)}>
                            <i className="fas fa-pen"></i>
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button className="btn-icon btn-icon-danger" title="Cancel"
                            onClick={() => handleCancel(b)}>
                            <i className="fas fa-ban"></i>
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button className="btn-icon" title="Check In"
                            onClick={() => openCheckinModal(b)}>
                            <i className="fas fa-sign-in-alt"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="9" className="text-center text-muted py-3">
                  {search ? 'No matching bookings.' : 'No bookings yet. Create one to get started.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(b => {
            const nights = Math.max(1, Math.ceil((new Date(b.check_out_date) - new Date(b.check_in_date)) / (1000*60*60*24)));
            return (
              <div key={b.id} className={`card-grid-item${groupHighlight === b.group_id ? ' group-highlight' : ''}`} onClick={() => setSelectedBooking(b)}>
                <div className="card-grid-head">
                  <strong className="text-truncate">{guestName(b)}</strong>
                  <div className="flex gap-1" style={{alignItems:'center', flexShrink:0}}>
                    {b.group_id && groupMap[b.group_id]?.length > 1 && (
                      <span className="group-badge" onClick={e => { e.stopPropagation(); setGroupModal(b.group_id); setGroupHighlight(b.group_id); }}>
                        <i className="fas fa-users" /> {groupMap[b.group_id].length}
                      </span>
                    )}
                    <StatusBadge status={b.status} />
                  </div>
                </div>
                <div className="card-grid-body">
                  <span className="text-truncate"><i className="fas fa-door-open"></i> Room {roomNumber(b)}</span>
                  <span className="text-truncate"><i className="fas fa-calendar"></i> {formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}</span>
                  <span className="text-truncate"><i className="fas fa-moon"></i> {nights} night{nights > 1 ? 's' : ''}</span>
                  <span className="text-truncate"><i className="fas fa-user-friends"></i> {b.adults + (b.children || 0)} guests</span>
                  <span className="text-truncate"><i className="fas fa-tag"></i> {b.booking_type}</span>
                </div>
                <div className="card-grid-actions" onClick={e => e.stopPropagation()}>
                  {b.status === 'checked_in' && (
                    <button className="btn btn-sm btn-accent" onClick={() => setCheckoutBooking(b)}>
                      <i className="fas fa-sign-out-alt"></i> Check Out
                    </button>
                  )}
                  {b.status === 'confirmed' && (
                    <button className="btn btn-sm btn-primary" onClick={() => openCheckinModal(b)}>
                      <i className="fas fa-sign-in-alt"></i> Check In
                    </button>
                  )}
                  {['confirmed', 'checked_in'].includes(b.status) && (
                    <button className="btn btn-sm btn-outline" onClick={() => openModifyModal(b)}>
                      <i className="fas fa-pen"></i> Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="card text-center text-muted py-3">
              {search ? 'No matching bookings.' : 'No bookings yet.'}
            </div>
          )}
        </div>
      )}

      {modifyModal && (
        <div className="modal-overlay" onClick={() => setModifyModal(null)}>
          <div className="modify-modal" onClick={e => e.stopPropagation()}>
            <div className="modify-modal-header">
              <h2><i className="fas fa-pen"></i> Modify Booking</h2>
              <button className="modify-modal-close" onClick={() => setModifyModal(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleModifySubmit}>
              <div className="modify-modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Guest Name</label>
                    <input className="form-control" value={modifyForm.guest_name}
                      onChange={e => setModifyForm(f => ({...f, guest_name: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input className="form-control" type="email" value={modifyForm.guest_email}
                      onChange={e => setModifyForm(f => ({...f, guest_email: e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-control" value={modifyForm.guest_phone}
                    onChange={e => setModifyForm(f => ({...f, guest_phone: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Room</label>
                  <select className="form-control" value={modifyForm.room_id}
                    onChange={e => setModifyForm(f => ({...f, room_id: e.target.value}))}>
                    <option value="">-- Select Room --</option>
                    {rooms.filter(r => r.status === 'available' || r.id === modifyModal?.room_id).map(r => (
                      <option key={r.id} value={r.id}>
                        {r.room_number} ({r.room_type || 'N/A'}){r.id === modifyModal?.room_id ? ' · Current' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Check-In Date</label>
                    <input className="form-control" type="date" value={modifyForm.check_in_date}
                      onChange={e => setModifyForm(f => ({...f, check_in_date: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>Check-Out Date</label>
                    <input className="form-control" type="date" value={modifyForm.check_out_date}
                      onChange={e => setModifyForm(f => ({...f, check_out_date: e.target.value}))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Adults</label>
                    <input className="form-control" type="number" min="1" value={modifyForm.adults}
                      onChange={e => setModifyForm(f => ({...f, adults: Number(e.target.value)}))} />
                  </div>
                  <div className="form-group">
                    <label>Children</label>
                    <input className="form-control" type="number" min="0" value={modifyForm.children}
                      onChange={e => setModifyForm(f => ({...f, children: Number(e.target.value)}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Special Requests</label>
                  <textarea className="form-control" rows="3" value={modifyForm.special_requests}
                    onChange={e => setModifyForm(f => ({...f, special_requests: e.target.value}))} />
                </div>
              </div>
              <div className="modify-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModifyModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={modifySubmitting}>
                  {modifySubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                  {modifySubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedBooking && (
        <DetailModal
          item={selectedBooking}
          title="Booking Details"
          fields={[
            { key: 'id', label: 'Booking ID', render: v => v?.slice(0, 8) + '...' },
            { key: 'guest_name', label: 'Guest', render: (v, b) => guestName(b) },
            { key: 'guest_phone', label: 'Phone' },
            { key: 'guest_email', label: 'Email' },
            { key: 'room_id', label: 'Room', render: (v, b) => `Room ${roomNumber(b)}` },
            { key: 'check_in_date', label: 'Check-In', render: v => formatDate(v) },
            { key: 'check_out_date', label: 'Check-Out', render: v => formatDate(v) },
            { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            { key: 'booking_type', label: 'Type', render: v => <span className="text-capitalize">{v}</span> },
            { key: 'adults', label: 'Adults' },
            { key: 'children', label: 'Children' },
            { key: 'total_amount', label: 'Total Amount', render: v => v ? formatCurrency(v) : '-' },
            { key: 'special_requests', label: 'Requests', hide: v => !v },
            { key: 'created_at', label: 'Created', render: v => formatDate(v) },
          ]}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {checkoutBooking && (
        <CheckoutBillModal
          booking={checkoutBooking}
          guestName={guestName}
          roomNumber={roomNumber}
          onClose={() => setCheckoutBooking(null)}
          onComplete={onCheckoutComplete}
        />
      )}

      {checkinModal && (
        <div className="modal-overlay" onClick={() => setCheckinModal(null)}>
          <div className="cin-modal" onClick={e => e.stopPropagation()}>
            <div className="cin-modal-header">
              <h2><i className="fas fa-sign-in-alt"></i> Check-In Guest</h2>
              <button className="cin-modal-close" onClick={() => setCheckinModal(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="cin-modal-body">
              <div className="cin-summary">
                <div className="cin-summary-row">
                  <span>Guest</span>
                  <strong>{guestName(checkinModal)}</strong>
                </div>
                <div className="cin-summary-row">
                  <span>Room</span>
                  <strong>{roomNumber(checkinModal)}</strong>
                </div>
                <div className="cin-summary-row">
                  <span>Dates</span>
                  <strong>{formatDate(checkinModal.check_in_date)} → {formatDate(checkinModal.check_out_date)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number <span style={{color:'var(--error)'}}>*</span></label>
                <div className="cin-input-group">
                  <i className="fas fa-phone cin-input-icon"></i>
                  <input className="form-control" value={checkinPhone}
                    onChange={e => setCheckinPhone(e.target.value)}
                    placeholder="Customer phone for registration" />
                </div>
                <div className="form-help" style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'4px'}}>
                  Used to find or create customer record &amp; track loyalty points
                </div>
              </div>

              <div className="form-group">
                <label>Customer Document (ID Card / Passport)</label>
                {checkinDocUrl ? (
                  <div className="cin-doc-uploaded">
                    <i className="fas fa-check-circle"></i> Document uploaded to Google Drive
                    <button type="button" className="cin-doc-clear" onClick={() => { setCheckinDocFile(null); setCheckinDocUrl(''); }}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <label className="cin-doc-btn">
                    {checkinDocUploading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                    ) : (
                      <><i className="fas fa-cloud-upload-alt"></i> Upload Document to Google Drive</>
                    )}
                    <input type="file" accept="image/*,.pdf" onChange={handleCheckinDocSelect} hidden disabled={checkinDocUploading} />
                  </label>
                )}
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    <i className="fas fa-users" style={{marginRight:6}} />Other Guests Staying
                  </label>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => setCompanions(prev => [...prev, { name: '', phone: '', address: '' }])}>
                    <i className="fas fa-plus" /> Add Guest
                  </button>
                </div>
                {companions.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                    Add details of other guests sharing this room (optional)
                  </div>
                )}
                {companions.map((c, i) => (
                  <div key={i} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Guest #{i + 2}</span>
                        {c.name && <span className="btn btn-sm btn-outline" style={{fontSize:'0.72rem',padding:'2px 8px'}} onClick={() => setCompanions(prev => prev.map((x, j) => j === i ? { name: '', phone: '', address: '' } : x))}>Clear</span>}
                      </div>
                      <div className="form-row" style={{gap:8}}>
                        <div className="form-group" style={{flex:2}}>
                          <input className="form-control" placeholder="Full Name" value={c.name}
                            onChange={e => setCompanions(prev => prev.map((x, j) => j === i ? {...x, name: e.target.value} : x))} />
                        </div>
                        <div className="form-group" style={{flex:1}}>
                          <input className="form-control" placeholder="Mobile" value={c.phone}
                            onChange={e => setCompanions(prev => prev.map((x, j) => j === i ? {...x, phone: e.target.value} : x))} />
                        </div>
                      </div>
                      <div className="form-group" style={{marginTop:4}}>
                        <input className="form-control" placeholder="Address (optional)" value={c.address}
                          onChange={e => setCompanions(prev => prev.map((x, j) => j === i ? {...x, address: e.target.value} : x))} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="cin-modal-footer">
              <button className="btn btn-outline" onClick={() => setCheckinModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCheckinSubmit} disabled={checkinSubmitting}>
                {checkinSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sign-in-alt"></i>}
                {checkinSubmitting ? 'Processing...' : 'Confirm Check-In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {groupModal && (() => {
        const groupBookings = bookings.filter(b => b.group_id === groupModal);
        const first = groupBookings[0];
        return (
          <div className="modal-overlay" onClick={() => { setGroupModal(null); setGroupHighlight(null); }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2><i className="fas fa-users" style={{color:'var(--primary)'}} /> Group Booking</h2>
                <button className="modal-close" onClick={() => { setGroupModal(null); setGroupHighlight(null); }}>
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 0 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600 }}>{first?.guest_name || 'Group'}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {first?.check_in_date} → {first?.check_out_date} · {groupBookings.length} room{groupBookings.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ padding: '12px 20px 16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Assigned Rooms
                  </div>
                  {groupBookings.map(b => {
                    const room = rooms.find(r => r.id === b.room_id);
                    return (
                      <div key={b.id} className="group-room-row" onClick={() => { setSelectedBooking(b); setGroupModal(null); setGroupHighlight(null); }}>
                        <div className="group-room-left">
                          <strong>{room?.room_number || b.room_id?.slice(0, 8)}</strong>
                          <span className="text-muted">{room?.room_type || '-'}</span>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        .table-actions { display: flex; gap: 4px; }
        .cin-modal {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .cin-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .cin-modal-header h2 { margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 10px; }
        .cin-modal-header h2 i { color: var(--primary); }
        .cin-modal-close { background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; padding: 4px; }
        .cin-modal-close:hover { color: var(--text); }
        .cin-modal-body { padding: 24px; }
        .cin-modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px 20px;
          border-top: 1px solid var(--border);
        }
        .cin-summary {
          background: var(--bg-alt);
          border-radius: var(--radius);
          padding: 14px 16px;
          margin-bottom: 20px;
        }
        .cin-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 0.85rem;
        }
        .cin-summary-row span { color: var(--text-muted); }
        .cin-summary-row strong { color: var(--text); }
        .cin-input-group { position: relative; }
        .cin-input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 0.85rem;
          pointer-events: none;
          z-index: 1;
        }
        .cin-input-group .form-control { padding-left: 42px; }
        .cin-doc-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 18px;
          border: 2px dashed var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 0.85rem;
          transition: var(--transition);
          background: var(--bg);
        }
        .cin-doc-btn:hover { border-color: var(--primary); color: var(--primary); }
        .cin-doc-btn i { font-size: 1.1rem; }
        .cin-doc-uploaded {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 16px;
          background: var(--success-bg);
          color: var(--success);
          border-radius: var(--radius);
          font-size: 0.85rem;
          font-weight: 500;
        }
        .cin-doc-uploaded i { font-size: 1.1rem; }
        .cin-doc-clear {
          background: none; border: none;
          color: var(--error); cursor: pointer;
          margin-left: 8px; padding: 2px 6px; border-radius: 4px;
        }
        .cin-doc-clear:hover { background: var(--error-bg); }
        .modify-modal {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modify-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .modify-modal-header h2 { margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 10px; }
        .modify-modal-header h2 i { color: var(--primary); }
        .modify-modal-close { background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; padding: 4px; }
        .modify-modal-close:hover { color: var(--text); }
        .modify-modal-body { padding: 24px; }
        .modify-modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px 20px;
          border-top: 1px solid var(--border);
        }
        .form-row { display: flex; gap: 16px; }
        .form-row .form-group { flex: 1; }
        .btn-icon {
          background: none; border: none;
          width: 32px; height: 32px;
          border-radius: 6px;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-secondary);
          transition: var(--transition);
        }
        .btn-icon:hover { background: var(--bg); color: var(--primary); }
        .btn-icon-danger:hover { background: #fef2f2; color: var(--error); }
        .btn-icon-checkout:hover { background: #f0fdf4; color: var(--success); }
        .py-3 { padding-top: 24px; padding-bottom: 24px; }
        .clickable-row { cursor: pointer; transition: var(--transition); }
        .clickable-row:hover { background: var(--bg-alt); }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
        .card-grid-item {
          background: var(--bg-card); border-radius: var(--radius-lg);
          box-shadow: var(--shadow); padding: 16px; cursor: pointer;
          transition: var(--transition); border: 1px solid var(--border);
        }
        .card-grid-item:hover { box-shadow: var(--shadow-md); border-color: var(--primary); transform: translateY(-1px); }
        .card-grid-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .card-grid-head strong { font-size: 1rem; }
        .card-grid-body { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; }
        .card-grid-body i { width: 18px; color: var(--text-muted); }
        .card-grid-actions { display: flex; gap: 6px; flex-wrap: wrap; padding-top: 10px; border-top: 1px solid var(--border-light); }
        .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; max-width: 100%; }
        .text-wrap { white-space: normal; word-break: break-word; overflow-wrap: break-word; }
        .card-grid-item { overflow: hidden; }
        .card-grid-body { min-width: 0; }
        .group-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 100px;
          font-size: 0.72rem; font-weight: 600;
          background: #eef2ff; color: var(--primary);
          cursor: pointer; transition: var(--transition);
          white-space: nowrap;
        }
        .group-badge:hover { background: #dbeafe; }
        .clickable-row.group-highlight,
        .card-grid-item.group-highlight {
          background: #eef2ff !important;
          box-shadow: 0 0 0 2px var(--primary);
        }
        .card-grid-item.group-highlight { border-color: var(--primary); }
        .group-room-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 12px; border-radius: var(--radius);
          cursor: pointer; transition: var(--transition); margin-bottom: 4px;
        }
        .group-room-row:hover { background: var(--bg-alt); }
        .group-room-left { display: flex; flex-direction: column; gap: 1px; }
        .group-room-left strong { font-size: 0.92rem; }
        .group-room-left span { font-size: 0.78rem; }
      `}</style>
    </div>
  );
}

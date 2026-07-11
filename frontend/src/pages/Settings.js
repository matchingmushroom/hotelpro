import { useState, useEffect } from 'react';
import { fetchAll, insertRecord, updateRecord, removeRecord } from '../services/supabaseService';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { inviteStaff, updateStaff, deleteStaff, resetStaffPassword } from '../services/backendService';
import { showConfirm, showSuccess, showError } from '../components/common/ConfirmDialog';

const ROLES = [
  { value: 'admin', label: 'Admin', icon: 'fa-crown' },
  { value: 'receptionist', label: 'Receptionist', icon: 'fa-user-tie' },
  { value: 'housekeeping', label: 'Housekeeping', icon: 'fa-broom' },
  { value: 'housekeeping_manager', label: 'Housekeeping Manager', icon: 'fa-users-cog' },
  { value: 'food_staff', label: 'Food Staff', icon: 'fa-utensils' },
];

export default function Settings() {
  const { profile } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');
  const [showPmForm, setShowPmForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editMethod, setEditMethod] = useState(null);
  const [editStaff, setEditStaff] = useState(null);
  const [pmForm, setPmForm] = useState({ name: '', type: 'cash', details: '', active: true });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', phone: '', role: 'receptionist' });
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [ownPasswordForm, setOwnPasswordForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [pmRes, staffRes] = await Promise.all([
        fetchAll('payment_methods', { orderBy: 'name' }),
        fetchAll('profiles', { orderBy: 'name' }),
      ]);
      setPaymentMethods(pmRes.data || []);
      setStaff(staffRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  // --- Payment Methods ---
  function openAddPm() { setEditMethod(null); setPmForm({ name: '', type: 'cash', details: '', active: true }); setShowPmForm(true); }
  function openEditPm(pm) { setEditMethod(pm); setPmForm({ name: pm.name, type: pm.type, details: pm.details || '', active: pm.active }); setShowPmForm(true); }

  async function handleSavePm(e) {
    e.preventDefault();
    if (!pmForm.name) return showError('Required', 'Name is required');
    try {
      if (editMethod) { await updateRecord('payment_methods', editMethod.id, pmForm); showSuccess('Updated', 'Payment method updated'); }
      else { await insertRecord('payment_methods', pmForm); showSuccess('Added', 'Payment method added'); }
      setShowPmForm(false); loadData();
    } catch (err) { showError('Error', err.message); }
  }

  async function handleTogglePm(pm) {
    try { await updateRecord('payment_methods', pm.id, { active: !pm.active }); loadData(); }
    catch (err) { showError('Error', err.message); }
  }

  async function handleDeletePm(pm) {
    try { await removeRecord('payment_methods', pm.id); showSuccess('Deleted', 'Payment method removed'); loadData(); }
    catch (err) { showError('Error', err.message); }
  }

  // --- Staff ---
  function openAddStaff() {
    setEditStaff(null);
    setStaffForm({ name: '', email: '', password: '', phone: '', role: 'receptionist' });
    setShowStaffForm(true);
  }

  function openEditStaff(s) {
    setEditStaff(s);
    setStaffForm({ name: s.name, email: '', password: '', phone: s.phone || '', role: s.role });
    setShowStaffForm(true);
  }

  async function handleSaveStaff(e) {
    e.preventDefault();
    if (!staffForm.name) return showError('Required', 'Name is required');
    if (!editStaff && !staffForm.email) return showError('Required', 'Email is required');
    if (!editStaff && !staffForm.password) return showError('Required', 'Password is required');
    setSubmitting(true);
    try {
      if (editStaff) {
        const updates = {};
        if (staffForm.name !== editStaff.name) updates.name = staffForm.name;
        if (staffForm.phone !== editStaff.phone) updates.phone = staffForm.phone;
        if (staffForm.role !== editStaff.role) updates.role = staffForm.role;
        if (Object.keys(updates).length) {
          await updateStaff(editStaff.id, updates);
        }
        showSuccess('Updated', 'Staff updated');
      } else {
        await inviteStaff({ ...staffForm, hotel_id: profile?.hotel_id });
        showSuccess('Added', `${staffForm.name} added as ${staffForm.role.replace(/_/g, ' ')}`);
      }
      setShowStaffForm(false); loadData();
    } catch (err) { showError('Error', err.message); }
    finally { setSubmitting(false); }
  }

  async function handleToggleStaff(s) {
    try {
      await updateStaff(s.id, { is_active: !s.is_active });
      showSuccess('Updated', `${s.name} ${s.is_active ? 'deactivated' : 'activated'}`);
      loadData();
    } catch (err) { showError('Error', err.message); }
  }

  async function handleDeleteStaff(s) {
    const confirmed = await showConfirm({ title: 'Delete staff?', text: `${s.name} will be permanently removed.`, confirmText: 'Delete' });
    if (!confirmed) return;
    try {
      await deleteStaff(s.id);
      showSuccess('Deleted', 'Staff removed');
      loadData();
    } catch (err) { showError('Error', err.message); }
  }

  function openResetPassword(s) {
    setPasswordTarget(s);
    setNewPassword('');
    setShowPasswordForm(true);
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return showError('Invalid', 'Password must be at least 6 characters');
    setSubmitting(true);
    try {
      await resetStaffPassword(passwordTarget.id, newPassword);
      showSuccess('Updated', `Password reset for ${passwordTarget.name}`);
      setShowPasswordForm(false);
    } catch (err) { showError('Error', err.message); }
    finally { setSubmitting(false); }
  }

  async function handleChangeOwnPassword(e) {
    e.preventDefault();
    if (ownPasswordForm.new !== ownPasswordForm.confirm) return showError('Mismatch', 'New passwords do not match');
    if (ownPasswordForm.new.length < 6) return showError('Invalid', 'Password must be at least 6 characters');
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: ownPasswordForm.new });
      if (error) throw error;
      showSuccess('Password changed', 'Your password has been updated');
      setOwnPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) { showError('Error', err.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="loading-spinner">Loading settings...</div>;

  return (
    <div>
      <div className="page-header"><h1>Settings</h1><p>Hotel configuration</p></div>

      <div className="settings-tabs">
        <button className={`st-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
          <i className="fas fa-credit-card"></i> Payment Methods
        </button>
        <button className={`st-tab ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
          <i className="fas fa-users"></i> Staff
        </button>
        <button className={`st-tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
          <i className="fas fa-key"></i> Change Password
        </button>
        <button className={`st-tab ${activeTab === 'hotel' ? 'active' : ''}`} onClick={() => setActiveTab('hotel')}>
          <i className="fas fa-hotel"></i> Hotel Profile
        </button>
      </div>

      {activeTab === 'payments' && (
        <div className="card">
          <div className="flex-between mb-2">
            <h3>Payment Methods ({paymentMethods.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={openAddPm}><i className="fas fa-plus"></i> Add Method</button>
          </div>
          <div className="pm-grid">
            {paymentMethods.map(pm => (
              <div key={pm.id} className={`pm-card ${!pm.active ? 'inactive' : ''}`}>
                <div className="pm-card-head"><strong>{pm.name}</strong><span className="pm-type">{pm.type?.replace(/_/g, ' ')}</span></div>
                {pm.details && <div className="pm-details">{pm.details}</div>}
                <div className="pm-actions">
                  <button className={`pm-toggle ${pm.active ? 'on' : 'off'}`} onClick={() => handleTogglePm(pm)}>{pm.active ? 'Active' : 'Inactive'}</button>
                  <button className="btn-icon" onClick={() => openEditPm(pm)}><i className="fas fa-edit"></i></button>
                  <button className="btn-icon btn-icon-danger" onClick={() => handleDeletePm(pm)}><i className="fas fa-trash"></i></button>
                </div>
              </div>
            ))}
            {paymentMethods.length === 0 && <p className="text-muted">No payment methods configured.</p>}
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="card">
          <div className="flex-between mb-2">
            <h3>Staff Members ({staff.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={openAddStaff}><i className="fas fa-plus"></i> Add Staff</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Phone</th><th>Role</th><th>Status</th><th style={{textAlign:'right'}}>Actions</th></tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td className="text-muted">{s.phone || '-'}</td>
                    <td><span className="role-badge" data-role={s.role}>{s.role?.replace(/_/g, ' ')}</span></td>
                    <td>{s.is_active !== false ? <span className="text-success">Active</span> : <span className="text-error">Inactive</span>}</td>
                    <td style={{textAlign:'right'}}>
                      <div className="flex gap-1" style={{justifyContent:'flex-end'}}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEditStaff(s)} title="Edit"><i className="fas fa-edit"></i></button>
                        <button className="btn btn-outline btn-sm" onClick={() => openResetPassword(s)} title="Reset Password"><i className="fas fa-key"></i></button>
                        <button className={`btn btn-sm ${s.is_active !== false ? 'btn-warning' : 'btn-primary'}`}
                          onClick={() => handleToggleStaff(s)} title={s.is_active !== false ? 'Deactivate' : 'Activate'}>
                          <i className={`fas fa-${s.is_active !== false ? 'ban' : 'check'}`}></i>
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStaff(s)} title="Delete"><i className="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-3">No staff found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card" style={{maxWidth:480}}>
          <h3 className="mb-2">Change Your Password</h3>
          <form onSubmit={handleChangeOwnPassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" className="form-control" value={ownPasswordForm.current}
                onChange={e => setOwnPasswordForm(p => ({...p, current: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" className="form-control" value={ownPasswordForm.new}
                onChange={e => setOwnPasswordForm(p => ({...p, new: e.target.value}))} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" className="form-control" value={ownPasswordForm.confirm}
                onChange={e => setOwnPasswordForm(p => ({...p, confirm: e.target.value}))} required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'hotel' && (
        <div className="card"><h3 className="mb-2">Hotel Profile</h3><p className="text-muted">Hotel profile settings will be available in a future update.</p></div>
      )}

      {/* Payment Method Modal */}
      {showPmForm && (
        <div className="modal-overlay" onClick={() => setShowPmForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMethod ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
              <button className="modal-close" onClick={() => setShowPmForm(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSavePm}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Method Name *</label>
                  <input className="form-control" value={pmForm.name} onChange={e => setPmForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Visa Card" />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-control" value={pmForm.type} onChange={e => setPmForm(p => ({...p, type: e.target.value}))}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online</option>
                    <option value="mobile_banking">Mobile Banking</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Details</label>
                  <textarea className="form-control" rows={2} value={pmForm.details} onChange={e => setPmForm(p => ({...p, details: e.target.value}))} placeholder="e.g. Bank name, account number" />
                </div>
                <div className="form-group">
                  <label className="flex-center" style={{justifyContent:'flex-start', cursor:'pointer'}}>
                    <input type="checkbox" checked={pmForm.active} onChange={e => setPmForm(p => ({...p, active: e.target.checked}))} style={{marginRight:8}} /> Active
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowPmForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><i className={`fas fa-${editMethod ? 'save' : 'plus'}`}></i> {editMethod ? 'Update' : 'Add Method'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffForm && (
        <div className="modal-overlay" onClick={() => setShowStaffForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editStaff ? 'Edit Staff' : 'Add Staff'}</h2>
              <button className="modal-close" onClick={() => setShowStaffForm(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSaveStaff}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input className="form-control" value={staffForm.name} onChange={e => setStaffForm(p => ({...p, name: e.target.value}))} placeholder="Full name" />
                </div>
                {!editStaff && (
                  <>
                    <div className="form-group">
                      <label>Email *</label>
                      <input type="email" className="form-control" value={staffForm.email} onChange={e => setStaffForm(p => ({...p, email: e.target.value}))} placeholder="staff@email.com" />
                    </div>
                    <div className="form-group">
                      <label>Password *</label>
                      <input type="password" className="form-control" value={staffForm.password} onChange={e => setStaffForm(p => ({...p, password: e.target.value}))} placeholder="Set temporary password" />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-control" value={staffForm.phone} onChange={e => setStaffForm(p => ({...p, phone: e.target.value}))} placeholder="+977-98XXXXXXXX" />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select className="form-control" value={staffForm.role} onChange={e => setStaffForm(p => ({...p, role: e.target.value}))}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowStaffForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <i className={`fas fa-${editStaff ? 'save' : 'user-plus'}`}></i>
                  {submitting ? 'Saving...' : editStaff ? 'Update Staff' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordForm && (
        <div className="modal-overlay" onClick={() => setShowPasswordForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Password — {passwordTarget?.name}</h2>
              <button className="modal-close" onClick={() => setShowPasswordForm(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="modal-body">
                <div className="form-group">
                  <label>New Password *</label>
                  <input type="password" className="form-control" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowPasswordForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .settings-tabs { display: flex; gap: 0; margin-bottom: 24px; background: var(--white); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); }
        .st-tab { flex: 1; padding: 12px 24px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 500; background: var(--white); color: var(--text-muted); transition: var(--transition); border-bottom: 2px solid transparent; }
        .st-tab:hover { color: var(--text); background: var(--bg); }
        .st-tab.active { color: var(--primary); border-bottom-color: var(--primary); background: var(--bg); }
        .pm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
        .pm-card { padding: 16px; border: 1px solid var(--border); border-radius: var(--radius); }
        .pm-card.inactive { opacity: 0.5; }
        .pm-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .pm-type { font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize; }
        .pm-details { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px; }
        .pm-actions { display: flex; align-items: center; gap: 8px; }
        .pm-toggle { padding: 2px 10px; border-radius: 100px; font-size: 0.7rem; font-weight: 600; border: none; cursor: pointer; }
        .pm-toggle.on { background: #22c55e18; color: var(--success); }
        .pm-toggle.off { background: var(--bg); color: var(--text-muted); }
        .btn-icon { background: none; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; color: var(--text-secondary); display: inline-flex; align-items: center; justify-content: center; }
        .btn-icon:hover { background: var(--bg); color: var(--primary); }
        .btn-icon-danger:hover { background: #fef2f2; color: var(--error); }
        .role-badge { padding: 2px 10px; border-radius: 100px; font-size: 0.75rem; font-weight: 600; }
        .role-badge[data-role="admin"] { background: #1a1a2e18; color: #1a1a2e; }
        .role-badge[data-role="receptionist"] { background: #3b82f618; color: #3b82f6; }
        .role-badge[data-role="housekeeping"] { background: #22c55e18; color: #22c55e; }
        .role-badge[data-role="housekeeping_manager"] { background: #8b5cf618; color: #8b5cf6; }
        .role-badge[data-role="food_staff"] { background: #f59e0b18; color: #f59e0b; }
        .btn-warning { background: var(--warning, #f59e0b); color: var(--white); border: none; }
        .btn-warning:hover { opacity: 0.9; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: var(--white); border-radius: var(--radius-lg); width: 100%; max-width: 480px; box-shadow: var(--shadow-lg); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); }
        .modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
        .modal-body { padding: 24px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--border); }
      `}</style>
    </div>
  );
}
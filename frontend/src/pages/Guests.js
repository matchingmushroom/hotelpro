import { useState, useEffect } from 'react';
import { fetchAll, insertRecord, updateRecord, removeRecord } from '../services/supabaseService';
import { formatDate } from '../utils/formatters';
import FileUpload from '../components/common/FileUpload';
import { showConfirm, showSuccess, showError } from '../components/common/ConfirmDialog';

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGuest, setEditGuest] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', id_card_front: '', id_card_back: '' });

  useEffect(() => {
    loadGuests();
  }, []);

  async function loadGuests() {
    try {
      const { data } = await fetchAll('guests', { orderBy: 'created_at', orderDir: 'desc' });
      setGuests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditGuest(null);
    setForm({ name: '', email: '', phone: '', address: '', id_card_front: '', id_card_back: '' });
    setShowForm(true);
  }

  function openEdit(guest) {
    setEditGuest(guest);
    setForm({
      name: guest.name, email: guest.email || '', phone: guest.phone || '',
      address: guest.address || '', id_card_front: guest.id_card_front || '',
      id_card_back: guest.id_card_back || '',
    });
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name) return showError('Required', 'Guest name is required');
    try {
      if (editGuest) {
        await updateRecord('guests', editGuest.id, form);
        showSuccess('Updated', `${form.name} updated`);
      } else {
        await insertRecord('guests', form);
        showSuccess('Added', `${form.name} added`);
      }
      setShowForm(false);
      loadGuests();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleDelete(guest) {
    const confirmed = await showConfirm({ title: `Remove ${guest.name}?`, text: 'This cannot be undone.', confirmText: 'Remove' });
    if (!confirmed) return;
    try {
      await removeRecord('guests', guest.id);
      loadGuests();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  function handleCardUpload(side, result) {
    if (result.url) setForm(p => ({ ...p, [side]: result.url }));
  }

  const filtered = guests.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || (g.phone || '').includes(q) || (g.email || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="loading-spinner">Loading guests...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Guests</h1>
          <p>{guests.length} registered &middot; {guests.filter(g => g.id_card_front).length} with ID card</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><i className="fas fa-plus"></i> Add Guest</button>
      </div>

      <div className="card mb-2">
        <input className="form-control" placeholder="Search by name, phone or email..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>ID Card</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <tr key={g.id}>
                <td><strong>{g.name}</strong></td>
                <td>{g.email || '-'}</td>
                <td>{g.phone || '-'}</td>
                <td className="text-muted">{g.address || '-'}</td>
                <td>
                  <div className="flex gap-1">
                    {g.id_card_front
                      ? <a href={g.id_card_front} target="_blank" rel="noreferrer" className="id-link" title="View Front"><i className="fas fa-id-card"></i> Front</a>
                      : <span className="text-muted">-</span>
                    }
                    {g.id_card_back
                      ? <a href={g.id_card_back} target="_blank" rel="noreferrer" className="id-link" title="View Back"><i className="fas fa-id-card"></i> Back</a>
                      : null
                    }
                  </div>
                </td>
                <td className="text-muted">{formatDate(g.created_at)}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-icon" onClick={() => openEdit(g)} title="Edit"><i className="fas fa-edit"></i></button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(g)} title="Delete"><i className="fas fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="text-center text-muted py-3">
                {search ? 'No matching guests.' : 'No guests yet.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editGuest ? 'Edit Guest' : 'Add Guest'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input className="form-control" value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input className="form-control" value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input className="form-control" value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input className="form-control" value={form.address}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>ID Card (Front)</label>
                    <FileUpload
                      label="Upload Front of ID"
                      folder="id-cards"
                      accept="image/*,.pdf"
                      onUpload={result => handleCardUpload('id_card_front', result)}
                    />
                    {form.id_card_front && (
                      <a href={form.id_card_front} target="_blank" rel="noreferrer" className="file-linked">
                        <i className="fas fa-external-link-alt"></i> View uploaded front
                      </a>
                    )}
                  </div>
                  <div className="form-group">
                    <label>ID Card (Back)</label>
                    <FileUpload
                      label="Upload Back of ID"
                      folder="id-cards"
                      accept="image/*,.pdf"
                      onUpload={result => handleCardUpload('id_card_back', result)}
                    />
                    {form.id_card_back && (
                      <a href={form.id_card_back} target="_blank" rel="noreferrer" className="file-linked">
                        <i className="fas fa-external-link-alt"></i> View uploaded back
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className={`fas fa-${editGuest ? 'save' : 'plus'}`}></i>
                  {editGuest ? 'Update Guest' : 'Add Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: var(--white); border-radius: var(--radius-lg); width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
        .modal-lg { max-width: 640px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); }
        .modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
        .modal-body { padding: 24px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--border); }
        .btn-icon { background: none; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; color: var(--text-secondary); display: inline-flex; align-items: center; justify-content: center; }
        .btn-icon:hover { background: var(--bg); color: var(--primary); }
        .btn-icon-danger:hover { background: #fef2f2; color: var(--error); }
        .id-link { font-size: 0.8rem; color: var(--primary); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
        .id-link:hover { text-decoration: underline; }
        .file-linked { display: inline-flex; align-items: center; gap: 4px; font-size: 0.8rem; color: var(--primary); margin-top: 4px; text-decoration: none; }
        .file-linked:hover { text-decoration: underline; }
        .py-3 { padding-top: 24px; padding-bottom: 24px; }
      `}</style>
    </div>
  );
}

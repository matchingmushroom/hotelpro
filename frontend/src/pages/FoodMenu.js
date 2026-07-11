import { useState, useEffect } from 'react';
import { fetchAll, insertRecord, updateRecord, removeRecord } from '../services/supabaseService';
import { formatCurrency } from '../utils/formatters';
import { FOOD_CATEGORIES } from '../utils/constants';
import { showConfirm, showSuccess, showError } from '../components/common/ConfirmDialog';

const emptyItem = {
  name: '', category: 'veg', description: '', price: '', available: true,
};

export default function FoodMenu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ ...emptyItem });
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const { data } = await fetchAll('menu_items', { orderBy: 'category' });
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({ name: item.name, category: item.category, description: item.description || '', price: item.price, available: item.available });
    setShowForm(true);
  }

  function openAdd() {
    setEditItem(null);
    setForm({ ...emptyItem });
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.price) return showError('Required', 'Name and price are required');
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editItem) {
        await updateRecord('menu_items', editItem.id, payload);
        showSuccess('Updated', `${form.name} updated`);
      } else {
        await insertRecord('menu_items', payload);
        showSuccess('Added', `${form.name} added to menu`);
      }
      setShowForm(false);
      loadItems();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleToggleAvailability(item) {
    try {
      await updateRecord('menu_items', item.id, { available: !item.available });
      loadItems();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  async function handleDelete(item) {
    const confirmed = await showConfirm({
      title: `Delete ${item.name}?`, text: 'This cannot be undone.',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      await removeRecord('menu_items', item.id);
      showSuccess('Deleted', `${item.name} removed`);
      loadItems();
    } catch (err) {
      showError('Error', err.message);
    }
  }

  const filtered = items.filter(i => {
    if (catFilter && i.category !== catFilter) return false;
    if (search) return i.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  if (loading) return <div className="loading-spinner">Loading menu...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Food Menu</h1>
          <p>{items.length} items &middot; {items.filter(i => i.available).length} available</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="fas fa-plus"></i> Add Item</button>
      </div>

      <div className="card mb-2 flex-between">
        <input className="form-control" style={{ maxWidth: 280 }} placeholder="Search items..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-control" style={{ maxWidth: 160 }} value={catFilter}
          onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {FOOD_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
      </div>

      <div className="menu-items-grid">
        {filtered.map(item => (
          <div key={item.id} className={`menu-card ${!item.available ? 'unavailable' : ''}`}>
            <div className="menu-card-head">
              <span className="menu-cat-badge">{item.category.replace(/_/g, ' ')}</span>
              <button className={`avail-toggle ${item.available ? 'on' : 'off'}`}
                onClick={() => handleToggleAvailability(item)} title="Toggle availability">
                <i className={`fas fa-${item.available ? 'check-circle' : 'times-circle'}`}></i>
              </button>
            </div>
            <h3>{item.name}</h3>
            {item.description && <p className="menu-desc">{item.description}</p>}
            <div className="menu-card-footer">
              <span className="menu-price">{formatCurrency(item.price)}</span>
              <div className="menu-actions">
                <button className="btn-icon" onClick={() => openEdit(item)}><i className="fas fa-edit"></i></button>
                <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(item)}><i className="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center text-muted py-3">
            {search ? 'No matching items.' : 'Menu is empty. Add your first item.'}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input className="form-control" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-control" value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      {FOOD_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Price (NPR) *</label>
                    <input type="number" className="form-control" value={form.price}
                      onChange={e => setForm(p => ({ ...p, price: e.target.value }))} min={0} step="0.01" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" rows={2} value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="flex-center" style={{ cursor: 'pointer', justifyContent: 'flex-start' }}>
                    <input type="checkbox" checked={form.available}
                      onChange={e => setForm(p => ({ ...p, available: e.target.checked }))} style={{ marginRight: 8 }} />
                    Available
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className={`fas fa-${editItem ? 'save' : 'plus'}`}></i>
                  {editItem ? 'Update' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .menu-items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
        .menu-card {
          background: var(--bg-card); border-radius: var(--radius-lg);
          box-shadow: var(--shadow); padding: 16px;
          transition: var(--transition);
        }
        .menu-card:hover { box-shadow: var(--shadow-md); }
        .menu-card.unavailable { opacity: 0.5; }
        .menu-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .menu-cat-badge {
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
          padding: 2px 8px; border-radius: 100px;
          background: var(--bg); color: var(--text-muted);
        }
        .avail-toggle { background: none; border: none; cursor: pointer; font-size: 1.1rem; }
        .avail-toggle.on { color: var(--success); }
        .avail-toggle.off { color: var(--text-muted); }
        .menu-card h3 { font-size: 1rem; margin-bottom: 4px; }
        .menu-desc { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; }
        .menu-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
        .menu-price { font-size: 1.1rem; font-weight: 700; color: var(--primary); }
        .menu-actions { display: flex; gap: 4px; }
        .btn-icon {
          background: none; border: none; width: 30px; height: 30px;
          border-radius: 6px; cursor: pointer; color: var(--text-secondary);
          display: inline-flex; align-items: center; justify-content: center;
          transition: var(--transition);
        }
        .btn-icon:hover { background: var(--bg); color: var(--primary); }
        .btn-icon-danger:hover { background: #fef2f2; color: var(--error); }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
        }
        .modal-content {
          background: var(--white); border-radius: var(--radius-lg);
          width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px; border-bottom: 1px solid var(--border);
        }
        .modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
        .modal-body { padding: 24px; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 8px;
          padding: 16px 24px; border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { inventoryAPI } from '../api';
import { Search, Plus, Minus, Package, AlertTriangle, Trash2, Pencil, X, Check } from 'lucide-react';
import { getRoleId, canAddProduct, canEditProduct, canDeleteProduct, canAdjustStock } from '../utils/rbac';

export default function Inventory() {
  const [products, setProducts]   = useState([]);
  const [inventory, setInventory] = useState([]);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [toast, setToast]         = useState(null);

  // ── stock adjust panel ──────────────────────────────────
  const [adjustItem, setAdjustItem] = useState(null); // {item, mode: 'IN'|'OUT'}
  const [adjustQty, setAdjustQty]   = useState('');

  // ── edit product panel ──────────────────────────────────
  const [editItem, setEditItem]   = useState(null);
  const [editForm, setEditForm]   = useState({});

  // ── new product form ────────────────────────────────────
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', category: '', price: '', cost_price: '', reorder_level: 10,
  });

  const user    = JSON.parse(localStorage.getItem('user') || '{}');
  const storeId = user.store_id || 1;
  const roleId  = getRoleId();

  // Pre-compute permissions once
  const allowAddProduct  = canAddProduct(roleId);
  const allowEdit        = canEditProduct(roleId);
  const allowDelete      = canDeleteProduct(roleId);
  const allowStockAdjust = canAdjustStock(roleId);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [prodRes, invRes] = await Promise.allSettled([
        inventoryAPI.get('/inventory/products/all'),
        inventoryAPI.get(`/inventory/${storeId}`),
      ]);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data);
      if (invRes.status === 'fulfilled')  setInventory(invRes.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ── merge catalog + stock ───────────────────────────────
  const merged = products.map((p) => {
    const inv = inventory.find((i) => i.product_id === p.id);
    return { ...p, quantity: inv?.quantity ?? null, reorder_level: inv?.reorder_level ?? p.reorder_level };
  });

  const filtered = merged.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    if (filter === 'low')     return matchesSearch && item.quantity !== null && item.quantity <= item.reorder_level && item.quantity > 0;
    if (filter === 'out')     return matchesSearch && item.quantity === 0;
    if (filter === 'stocked') return matchesSearch && item.quantity !== null && item.quantity > item.reorder_level;
    return matchesSearch;
  });

  function getStatus(item) {
    if (item.quantity === null) return { label: 'Not stocked', cls: 'badge-info' };
    if (item.quantity === 0)    return { label: 'Out of stock', cls: 'badge-danger' };
    if (item.quantity <= item.reorder_level) return { label: 'Low stock', cls: 'badge-warning' };
    return { label: 'Healthy', cls: 'badge-success' };
  }

  // ── handlers ────────────────────────────────────────────
  async function handleAddProduct(e) {
    e.preventDefault();
    try {
      await inventoryAPI.post('/inventory/products', {
        ...newProduct,
        price:        parseFloat(newProduct.price),
        cost_price:   newProduct.cost_price ? parseFloat(newProduct.cost_price) : null,
        reorder_level: parseInt(newProduct.reorder_level),
      });
      setShowAdd(false);
      setNewProduct({ sku: '', name: '', category: '', price: '', cost_price: '', reorder_level: 10 });
      showToast('Product added successfully!');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to add product', true);
    }
  }

  async function handleAdjustStock(e) {
    e.preventDefault();
    try {
      await inventoryAPI.put('/inventory/stock/adjust', {
        store_id:   storeId,
        product_id: adjustItem.item.id,
        qty:        parseInt(adjustQty),
        type:       adjustItem.mode,
      });
      setAdjustItem(null);
      setAdjustQty('');
      showToast(adjustItem.mode === 'IN' ? 'Stock added!' : 'Stock removed!');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update stock', true);
    }
  }

  function openEdit(item) {
    setEditItem(item);
    setEditForm({
      sku:           item.sku,
      name:          item.name,
      category:      item.category || '',
      price:         item.price,
      cost_price:    item.cost_price || '',
      reorder_level: item.reorder_level,
    });
  }

  async function handleEditProduct(e) {
    e.preventDefault();
    try {
      await inventoryAPI.put(`/inventory/products/${editItem.id}`, {
        ...editForm,
        price:         parseFloat(editForm.price),
        cost_price:    editForm.cost_price ? parseFloat(editForm.cost_price) : null,
        reorder_level: parseInt(editForm.reorder_level),
      });
      setEditItem(null);
      showToast('Product updated successfully!');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update product', true);
    }
  }

  async function handleDeleteProduct(productId) {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await inventoryAPI.delete(`/inventory/products/${productId}`);
      showToast('Product deleted successfully!');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete product', true);
    }
  }

  function showToast(msg, isError = false) {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Loading inventory...</p>
      </div>
    );
  }

  const panelStyle = { marginBottom: 24, animation: 'slideUp 0.3s ease' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="toolbar">
        <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={18} className="search-icon" />
          <input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={`filter-chip ${filter === 'all'     ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button className={`filter-chip ${filter === 'low'     ? 'active' : ''}`} onClick={() => setFilter('low')}>⚠️ Low</button>
        <button className={`filter-chip ${filter === 'out'     ? 'active' : ''}`} onClick={() => setFilter('out')}>🚫 Out</button>
        <button className={`filter-chip ${filter === 'stocked' ? 'active' : ''}`} onClick={() => setFilter('stocked')}>✅ Healthy</button>
        {allowAddProduct && (
          <button className="btn btn-primary btn-sm" onClick={() => { setShowAdd(!showAdd); setEditItem(null); setAdjustItem(null); }}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {/* ── Add Product Form ─────────────────────────────────── */}
      {showAdd && (
        <div className="chart-panel" style={panelStyle}>
          <h3><Plus size={16} /> New Product</h3>
          <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 16 }}>
            <div className="form-group">
              <label>SKU</label>
              <input placeholder="SKU-001" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input placeholder="Product name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input placeholder="Beverages" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" step="0.01" placeholder="99.00" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Cost Price (₹)</label>
              <input type="number" step="0.01" placeholder="60.00" value={newProduct.cost_price} onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Reorder Level</label>
              <input type="number" value={newProduct.reorder_level} onChange={(e) => setNewProduct({ ...newProduct, reorder_level: e.target.value })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <button type="submit" className="btn btn-success btn-sm"><Check size={14} /> Save</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}><X size={14} /> Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Edit Product Form ────────────────────────────────── */}
      {editItem && (
        <div className="chart-panel" style={{ ...panelStyle, background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.3)' }}>
          <h3><Pencil size={16} /> Edit Product — {editItem.name}</h3>
          <form onSubmit={handleEditProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 16 }}>
            <div className="form-group">
              <label>SKU</label>
              <input value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Cost Price (₹)</label>
              <input type="number" step="0.01" value={editForm.cost_price} onChange={(e) => setEditForm({ ...editForm, cost_price: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Reorder Level</label>
              <input type="number" value={editForm.reorder_level} onChange={(e) => setEditForm({ ...editForm, reorder_level: e.target.value })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm"><Check size={14} /> Update</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditItem(null)}><X size={14} /> Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Adjust Stock Form ────────────────────────────────── */}
      {adjustItem && (
        <div className="chart-panel" style={{
          ...panelStyle,
          background: adjustItem.mode === 'IN' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
          borderColor: adjustItem.mode === 'IN' ? 'rgba(16,185,129,0.3)'  : 'rgba(239,68,68,0.3)',
        }}>
          <h3>
            {adjustItem.mode === 'IN' ? <Plus size={16} /> : <Minus size={16} />}
            {' '}{adjustItem.mode === 'IN' ? 'Add Stock' : 'Remove Stock'} — {adjustItem.item.name} ({adjustItem.item.sku})
          </h3>
          <form onSubmit={handleAdjustStock} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginTop: 16 }}>
            <div className="form-group" style={{ marginBottom: 0, width: '220px' }}>
              <label>Quantity to {adjustItem.mode === 'IN' ? 'Add' : 'Remove'}</label>
              <input
                type="number" min="1"
                placeholder={adjustItem.mode === 'IN' ? 'e.g. 50' : `Max: ${adjustItem.item.quantity ?? 0}`}
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required autoFocus
              />
            </div>
            <button type="submit" className={`btn ${adjustItem.mode === 'IN' ? 'btn-success' : 'btn-danger'}`}>
              <Check size={14} /> Confirm
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { setAdjustItem(null); setAdjustQty(''); }}>
              <X size={14} /> Cancel
            </button>
          </form>
        </div>
      )}

      {/* ── Inventory Table ──────────────────────────────────── */}
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h3><Package size={18} /> Inventory ({filtered.length} products)</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Reorder</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <p>No products found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const status = getStatus(item);
                return (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{item.sku}</td>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.category || '—'}</td>
                    <td>₹{parseFloat(item.price).toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>{item.quantity ?? '—'}</td>
                    <td>{item.reorder_level}</td>
                    <td>
                      <span className={`badge ${status.cls}`}>
                        <span className="badge-dot" />
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Add Stock — inventory_supervisor and above */}
                        {allowStockAdjust && (
                          <button
                            onClick={() => { setAdjustItem({ item, mode: 'IN' }); setAdjustQty(''); setEditItem(null); setShowAdd(false); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50); }}
                            className="btn btn-sm"
                            style={{ color: 'var(--success)', background: 'transparent', padding: '4px 8px', border: '1px solid rgba(16,185,129,0.3)' }}
                            title="Add stock"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                        {/* Remove Stock */}
                        {allowStockAdjust && (
                          <button
                            onClick={() => { setAdjustItem({ item, mode: 'OUT' }); setAdjustQty(''); setEditItem(null); setShowAdd(false); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50); }}
                            className="btn btn-sm"
                            disabled={!item.quantity}
                            style={{ color: item.quantity ? 'var(--warning)' : 'var(--text-muted)', background: 'transparent', padding: '4px 8px', border: `1px solid ${item.quantity ? 'rgba(245,158,11,0.3)' : 'rgba(100,100,100,0.2)'}` }}
                            title="Remove stock"
                          >
                            <Minus size={14} />
                          </button>
                        )}
                        {/* Edit — inventory_supervisor and above */}
                        {allowEdit && (
                          <button
                            onClick={() => { openEdit(item); setAdjustItem(null); setShowAdd(false); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50); }}
                            className="btn btn-sm"
                            style={{ color: 'var(--accent)', background: 'transparent', padding: '4px 8px', border: '1px solid rgba(99,102,241,0.3)' }}
                            title="Edit product"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {/* Delete — store_manager and above only */}
                        {allowDelete && (
                          <button
                            onClick={() => handleDeleteProduct(item.id)}
                            className="btn btn-sm"
                            style={{ color: 'var(--danger)', background: 'transparent', padding: '4px 8px', border: '1px solid rgba(239,68,68,0.3)' }}
                            title="Delete product"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>
          {toast.isError ? <AlertTriangle size={16} /> : '✅'} {toast.msg}
        </div>
      )}
    </div>
  );
}

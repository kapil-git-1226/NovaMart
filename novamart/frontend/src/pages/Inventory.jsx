import { useEffect, useState } from 'react';
import { inventoryAPI } from '../api';
import { Search, Plus, Package, AlertTriangle } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', category: '', price: '', cost_price: '', reorder_level: 10
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const storeId = user.store_id || 1;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [prodRes, invRes] = await Promise.allSettled([
        inventoryAPI.get('/inventory/products/all'),
        inventoryAPI.get(`/inventory/${storeId}`),
      ]);

      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data);
      if (invRes.status === 'fulfilled') setInventory(invRes.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Merge product catalog with inventory data
  const merged = products.map((p) => {
    const inv = inventory.find((i) => i.product_id === p.id);
    return {
      ...p,
      quantity: inv?.quantity ?? null,
      reorder_level: inv?.reorder_level ?? p.reorder_level,
    };
  });

  // Filter + search
  const filtered = merged.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());

    if (filter === 'low') return matchesSearch && item.quantity !== null && item.quantity <= item.reorder_level && item.quantity > 0;
    if (filter === 'out') return matchesSearch && item.quantity === 0;
    if (filter === 'stocked') return matchesSearch && item.quantity !== null && item.quantity > item.reorder_level;
    return matchesSearch;
  });

  function getStatus(item) {
    if (item.quantity === null) return { label: 'Not stocked', cls: 'badge-info' };
    if (item.quantity === 0) return { label: 'Out of stock', cls: 'badge-danger' };
    if (item.quantity <= item.reorder_level) return { label: 'Low stock', cls: 'badge-warning' };
    return { label: 'Healthy', cls: 'badge-success' };
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    try {
      await inventoryAPI.post('/inventory/products', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        cost_price: newProduct.cost_price ? parseFloat(newProduct.cost_price) : null,
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

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={18} className="search-icon" />
          <input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >All</button>
        <button
          className={`filter-chip ${filter === 'low' ? 'active' : ''}`}
          onClick={() => setFilter('low')}
        >⚠️ Low</button>
        <button
          className={`filter-chip ${filter === 'out' ? 'active' : ''}`}
          onClick={() => setFilter('out')}
        >🚫 Out</button>
        <button
          className={`filter-chip ${filter === 'stocked' ? 'active' : ''}`}
          onClick={() => setFilter('stocked')}
        >✅ Healthy</button>

        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Add Product Form (collapsible) */}
      {showAdd && (
        <div className="chart-panel" style={{ marginBottom: 24, animation: 'slideUp 0.3s ease' }}>
          <h3><Plus size={16} /> New Product</h3>
          <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
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
              <button type="submit" className="btn btn-success btn-sm">Save</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Table */}
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
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
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
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>
          {toast.isError ? <AlertTriangle size={16} /> : '✅'} {toast.msg}
        </div>
      )}
    </div>
  );
}

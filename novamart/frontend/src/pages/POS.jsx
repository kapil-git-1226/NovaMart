import { useEffect, useState } from 'react';
import { inventoryAPI, salesAPI } from '../api';
import { Search, ShoppingCart, Trash2, CreditCard, AlertTriangle } from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const storeId = user.store_id || 1;

  useEffect(() => {
    inventoryAPI
      .get('/inventory/products/all')
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product_id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          unit_price: parseFloat(product.price),
          qty: 1,
          discount: 0,
        },
      ];
    });
  }

  function updateQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product_id === productId ? { ...c, qty: Math.max(0, c.qty + delta) } : c
        )
        .filter((c) => c.qty > 0)
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((c) => c.product_id !== productId));
  }

  const total = cart.reduce((sum, c) => sum + c.unit_price * c.qty - c.discount, 0);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
      const res = await salesAPI.post('/sales/', {
        store_id: storeId,
        cashier_id: user.id || 1,
        payment_method: paymentMethod,
        items: cart.map((c) => ({
          product_id: c.product_id,
          qty: c.qty,
          unit_price: c.unit_price,
          discount: c.discount,
        })),
      });

      setLastReceipt(res.data);
      setCart([]);
      showToast(`Sale completed! Transaction #${res.data.transaction_id}`);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Checkout failed', true);
    } finally {
      setSubmitting(false);
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
        <p style={{ color: 'var(--text-muted)' }}>Loading products...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="pos-layout">
        {/* ── Left: Product Grid ─────────────── */}
        <div>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No products found. Add some in the Inventory page.</p>
            </div>
          ) : (
            <div className="pos-products-grid">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="pos-product-card"
                  onClick={() => addToCart(p)}
                >
                  <div className="product-name">{p.name}</div>
                  <div className="product-sku">{p.sku}</div>
                  <div className="product-price">₹{parseFloat(p.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Cart ────────────────────── */}
        <div className="pos-cart">
          <div className="pos-cart-header">
            <h3>
              <ShoppingCart size={18} />
              Cart
              {cart.length > 0 && (
                <span className="cart-count">{cart.reduce((s, c) => s + c.qty, 0)}</span>
              )}
            </h3>
          </div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 10px' }}>
                <div className="empty-icon">🛒</div>
                <p>Click a product to add it</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product_id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">
                      ₹{item.unit_price.toFixed(2)} × {item.qty} ={' '}
                      <strong>₹{(item.unit_price * item.qty).toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => updateQty(item.product_id, -1)}>−</button>
                    <span className="cart-item-qty">{item.qty}</span>
                    <button onClick={() => updateQty(item.product_id, 1)}>+</button>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="pos-cart-footer">
              <div className="cart-total-row">
                <span className="cart-total-label">Total</span>
                <span className="cart-total-value">
                  ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <select
                className="payment-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="upi">📱 UPI</option>
              </select>

              <button
                className="btn btn-success"
                style={{ width: '100%' }}
                onClick={handleCheckout}
                disabled={submitting}
              >
                <CreditCard size={18} />
                {submitting ? 'Processing...' : `Checkout — ₹${total.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Last Receipt Mini */}
      {lastReceipt && (
        <div className="chart-panel" style={{ marginTop: 24 }}>
          <h3>🧾 Last Receipt — Transaction #{lastReceipt.transaction_id}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Total: <strong style={{ color: 'var(--accent-400)' }}>₹{lastReceipt.total_amount?.toFixed(2)}</strong>
            {' • '}Status: <span className="badge badge-success"><span className="badge-dot" />{lastReceipt.status}</span>
          </p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>
          {toast.isError ? <AlertTriangle size={16} /> : '✅'} {toast.msg}
        </div>
      )}
    </div>
  );
}

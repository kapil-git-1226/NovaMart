import { useEffect, useState } from 'react';
import { inventoryAPI, salesAPI } from '../api';
import {
  Search, ShoppingCart, Trash2, CreditCard,
  AlertTriangle, X, Printer, CheckCircle
} from 'lucide-react';

const PAYMENT_ICONS = { cash: '💵', card: '💳', upi: '📱' };

export default function POS() {
  const [products,       setProducts]       = useState([]);
  const [inventory,      setInventory]      = useState([]);
  const [cart,           setCart]           = useState([]);
  const [search,         setSearch]         = useState('');
  const [paymentMethod,  setPaymentMethod]  = useState('cash');
  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [toast,          setToast]          = useState(null);
  const [receipt,        setReceipt]        = useState(null);   // full receipt object
  const [showReceipt,    setShowReceipt]    = useState(false);

  const user    = JSON.parse(localStorage.getItem('user') || '{}');
  const storeId = user.store_id || 1;

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      const [prodRes, invRes] = await Promise.allSettled([
        inventoryAPI.get('/inventory/products/all'),
        inventoryAPI.get(`/inventory/${storeId}`),
      ]);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data);
      if (invRes.status  === 'fulfilled') setInventory(invRes.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Merge product data with stock quantity for this store
  const productsWithStock = products.map((p) => {
    const inv = inventory.find((i) => i.product_id === p.id);
    return { ...p, available: inv?.quantity ?? 0 };
  });

  const filtered = productsWithStock.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  // ── Cart helpers ──────────────────────────────────────
  function addToCart(product) {
    if (product.available === 0) {
      showToast('Out of stock — cannot add to cart', true);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === product.id);
      if (existing) {
        if (existing.qty >= product.available) {
          showToast(`Only ${product.available} units available`, true);
          return prev;
        }
        return prev.map((c) =>
          c.product_id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name:        product.name,
          sku:         product.sku,
          unit_price:  parseFloat(product.price),
          qty:         1,
          discount:    0,
          available:   product.available,
        },
      ];
    });
  }

  function updateQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product_id !== productId) return c;
          const newQty = c.qty + delta;
          if (newQty > c.available) {
            showToast(`Only ${c.available} units available`, true);
            return c;
          }
          return { ...c, qty: Math.max(0, newQty) };
        })
        .filter((c) => c.qty > 0)
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((c) => c.product_id !== productId));
  }

  const subtotal = cart.reduce((sum, c) => sum + c.unit_price * c.qty, 0);
  const discount = cart.reduce((sum, c) => sum + c.discount, 0);
  const total    = subtotal - discount;

  // ── Checkout ─────────────────────────────────────────
  async function handleCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const saleRes = await salesAPI.post('/sales/', {
        store_id:       storeId,
        cashier_id:     user.id || 1,
        payment_method: paymentMethod,
        items: cart.map((c) => ({
          product_id: c.product_id,
          qty:        c.qty,
          unit_price: c.unit_price,
          discount:   c.discount,
        })),
      });

      // Fetch full receipt with product names
      const txnId = saleRes.data.transaction_id;
      const receiptRes = await salesAPI.get(`/sales/receipt/${txnId}`);
      setReceipt(receiptRes.data);
      setShowReceipt(true);
      setCart([]);
      fetchProducts(); // refresh stock
      showToast(`✅ Sale #${txnId} completed!`);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Checkout failed. Please try again.', true);
    } finally {
      setSubmitting(false);
    }
  }

  function showToast(msg, isError = false) {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  }

  function handlePrint() {
    window.print();
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

        {/* ── Left: Product Grid ──────────────────────── */}
        <div>
          <div className="search-bar" style={{ marginBottom: 16 }}>
            <Search size={18} className="search-icon" />
            <input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>No products found. Add some in the Inventory page first.</p>
            </div>
          ) : (
            <div className="pos-products-grid">
              {filtered.map((p) => {
                const inCart     = cart.find((c) => c.product_id === p.id);
                const outOfStock = p.available === 0;
                return (
                  <div
                    key={p.id}
                    className="pos-product-card"
                    onClick={() => addToCart(p)}
                    style={{
                      opacity:       outOfStock ? 0.45 : 1,
                      cursor:        outOfStock ? 'not-allowed' : 'pointer',
                      position:      'relative',
                      borderColor:   inCart ? 'var(--primary-400)' : undefined,
                    }}
                  >
                    {inCart && (
                      <span style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'var(--primary-500)', color: 'white',
                        borderRadius: '50%', width: 20, height: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 700,
                      }}>
                        {inCart.qty}
                      </span>
                    )}
                    <div className="product-name">{p.name}</div>
                    <div className="product-sku">{p.sku}</div>
                    <div className="product-price">₹{parseFloat(p.price).toFixed(2)}</div>
                    <div style={{ fontSize: '0.72rem', marginTop: 6, color: outOfStock ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {outOfStock ? '● Out of stock' : `● ${p.available} in stock`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Cart ─────────────────────────────── */}
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
              {/* Totals */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: 'var(--success)', marginBottom: 4 }}>
                    <span>Discount</span>
                    <span>−₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="cart-total-row">
                  <span className="cart-total-label">Total</span>
                  <span className="cart-total-value">
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment method */}
              <select
                className="payment-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="upi">📱 UPI</option>
              </select>

              {/* Checkout */}
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

      {/* ══════════════════════════════════════════════════
          RECEIPT MODAL
         ══════════════════════════════════════════════════ */}
      {showReceipt && receipt && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReceipt(false); }}
        >
          <div
            id="receipt-modal"
            style={{
              background: '#0f1930',
              border: '1px solid rgba(100,140,220,0.2)',
              borderRadius: 16, padding: 32,
              width: '100%', maxWidth: 440,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              animation: 'slideUp 0.3s ease',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)', border: '2px solid var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <CheckCircle size={28} color="var(--success)" />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>Payment Successful</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {receipt.store_name}
              </p>
            </div>

            {/* Meta */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 10,
              padding: '14px 16px', marginBottom: 20,
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
              fontSize: '0.82rem',
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Transaction ID</div>
                <div style={{ fontWeight: 600 }}>#{receipt.transaction_id}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Payment</div>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {PAYMENT_ICONS[receipt.payment_method]} {receipt.payment_method}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Cashier</div>
                <div style={{ fontWeight: 600 }}>{receipt.cashier_name}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Date & Time</div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  {new Date(receipt.date).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Line items */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                fontSize: '0.75rem', color: 'var(--text-muted)',
                padding: '0 0 8px', borderBottom: '1px solid rgba(56,80,130,0.2)',
                marginBottom: 8,
              }}>
                <span>ITEM</span><span style={{ textAlign: 'right' }}>QTY</span><span style={{ textAlign: 'right' }}>TOTAL</span>
              </div>
              {receipt.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto',
                    fontSize: '0.85rem', padding: '6px 0',
                    borderBottom: '1px solid rgba(56,80,130,0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{item.unit_price.toFixed(2)} each</div>
                  </div>
                  <div style={{ textAlign: 'right', paddingRight: 16, alignSelf: 'center' }}>{item.qty}</div>
                  <div style={{ textAlign: 'right', fontWeight: 600, alignSelf: 'center' }}>₹{item.subtotal.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 10, padding: '14px 16px',
              marginBottom: 20,
            }}>
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>TOTAL PAID</span>
              <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--success)' }}>
                ₹{receipt.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowReceipt(false)}
              >
                <X size={16} /> Close
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handlePrint}
              >
                <Printer size={16} /> Print Receipt
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Thank you for shopping at NovaMart! 🛍️
            </p>
          </div>
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

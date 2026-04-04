import { useEffect, useState, useCallback } from 'react';
import { salesAPI } from '../api';
import {
  ReceiptText, Search, Eye, X, Printer,
  CheckCircle, AlertTriangle, ChevronLeft, ChevronRight,
} from 'lucide-react';

const PAYMENT_ICONS = { cash: '💵', card: '💳', upi: '📱' };
const STATUS_COLORS = {
  completed: 'var(--success)',
  returned: 'var(--danger)',
  pending: 'var(--warning)',
};

const PAGE_SIZE = 15;

export default function Receipts() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const storeId = user.store_id || 1;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Receipt detail modal
  const [receipt, setReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [loadingRx, setLoadingRx] = useState(false);

  // Summary stats
  const [summary, setSummary] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesAPI.get(`/sales/${storeId}?limit=500&offset=0`);
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await salesAPI.get(`/sales/summary/${storeId}`);
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load summary', err);
    }
  }, [storeId]);

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [fetchTransactions, fetchSummary]);

  async function openReceipt(txnId) {
    setLoadingRx(true);
    setReceiptOpen(true);
    try {
      const res = await salesAPI.get(`/sales/receipt/${txnId}`);
      setReceipt(res.data);
    } catch (err) {
      console.error('Failed to load receipt', err);
    } finally {
      setLoadingRx(false);
    }
  }

  // ── Filter + pagination ────────────────────────────────
  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    return (
      String(t.id).includes(q) ||
      (t.payment_method || '').toLowerCase().includes(q) ||
      (t.status || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Aggregate stats ────────────────────────────────────
  const totalRevenue = transactions.reduce((s, t) => s + parseFloat(t.total_amount || 0), 0);
  const todayRevenue = transactions
    .filter((t) => new Date(t.created_at).toDateString() === new Date().toDateString())
    .reduce((s, t) => s + parseFloat(t.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Loading receipts...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>

      {/* ── Stats Row ──────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16, marginBottom: 24,
      }}>
        {[
          { label: 'Total Transactions', value: transactions.length, color: 'var(--primary-400)' },
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: 'var(--success)' },
          { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: 'var(--warning)' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Table card ─────────────────────────────────── */}
      <div className="card">
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ReceiptText size={20} color="var(--primary-400)" />
            Transaction Receipts
            <span style={{
              background: 'rgba(100,140,255,0.15)', color: 'var(--primary-400)',
              borderRadius: 20, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600,
            }}>
              {filtered.length} records
            </span>
          </h2>

          <div className="search-bar" style={{ width: 280, marginBottom: 0 }}>
            <Search size={16} className="search-icon" />
            <input
              placeholder="Search by ID, payment, status..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(56,80,130,0.3)' }}>
                {['Receipt #', 'Date & Time', 'Cashier ID', 'Payment', 'Amount', 'Status', 'Action'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: '0.72rem', textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🧾</div>
                    No transactions found.
                  </td>
                </tr>
              ) : paginated.map((t) => (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: '1px solid rgba(56,80,130,0.12)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary-300)' }}>
                    #{String(t.id).padStart(6, '0')}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '0.83rem' }}>
                    <div>{new Date(t.created_at).toLocaleDateString('en-IN')}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                    #{t.cashier_id}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: 'rgba(100,140,255,0.10)', color: 'var(--primary-300)',
                      borderRadius: 6, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600,
                    }}>
                      {PAYMENT_ICONS[t.payment_method] || '?'} {t.payment_method}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                    ₹{parseFloat(t.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      color: STATUS_COLORS[t.status] || 'var(--text-muted)',
                      background: `${STATUS_COLORS[t.status]}18`,
                      border: `1px solid ${STATUS_COLORS[t.status]}40`,
                      borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600,
                    }}>
                      {t.status === 'completed' ? '✓' : t.status === 'returned' ? '↩' : '○'} {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                      onClick={() => openReceipt(t.id)}
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '5px 10px' }}
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                return (
                  <button
                    key={p}
                    className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '5px 12px', minWidth: 36 }}
                    onClick={() => setPage(p)}
                  >
                    {p + 1}
                  </button>
                );
              })}
              <button
                className="btn btn-secondary"
                style={{ padding: '5px 10px' }}
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          RECEIPT DETAIL MODAL
         ══════════════════════════════════════════════════════ */}
      {receiptOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setReceiptOpen(false); }}
        >
          <div
            style={{
              background: '#0f1930',
              border: '1px solid rgba(100,140,220,0.2)',
              borderRadius: 16, padding: 32,
              width: '100%', maxWidth: 460,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              animation: 'slideUp 0.3s ease',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            {loadingRx ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-muted)' }}>Loading receipt...</p>
              </div>
            ) : receipt ? (
              <>
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
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>
                    Receipt #{String(receipt.transaction_id).padStart(6, '0')}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{receipt.store_name}</p>
                </div>

                {/* Meta grid */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                  padding: '14px 16px', marginBottom: 20,
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                  fontSize: '0.82rem',
                }}>
                  {[
                    { label: 'Transaction ID', value: `#${String(receipt.transaction_id).padStart(6, '0')}` },
                    { label: 'Payment Method', value: `${PAYMENT_ICONS[receipt.payment_method] || ''} ${receipt.payment_method}` },
                    { label: 'Cashier', value: receipt.cashier_name },
                    { label: 'Date & Time', value: new Date(receipt.date).toLocaleString('en-IN') },
                    { label: 'Status', value: receipt.status },
                    { label: 'Items', value: `${receipt.items.length} item(s)` },
                  ].map((m) => (
                    <div key={m.label}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Line items */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto',
                    fontSize: '0.72rem', color: 'var(--text-muted)',
                    padding: '0 0 8px', borderBottom: '1px solid rgba(56,80,130,0.2)',
                    marginBottom: 8,
                  }}>
                    <span>ITEM</span><span style={{ textAlign: 'right' }}>QTY</span><span style={{ textAlign: 'right' }}>TOTAL</span>
                  </div>
                  {receipt.items.map((item, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1fr auto auto',
                      fontSize: '0.85rem', padding: '7px 0',
                      borderBottom: '1px solid rgba(56,80,130,0.08)',
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                          {item.sku} · ₹{item.unit_price.toFixed(2)} each
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', paddingRight: 16, alignSelf: 'center' }}>{item.qty}</div>
                      <div style={{ textAlign: 'right', fontWeight: 600, alignSelf: 'center' }}>
                        ₹{item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total paid */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 10, padding: '14px 16px', marginBottom: 20,
                }}>
                  <span style={{ fontWeight: 600 }}>TOTAL PAID</span>
                  <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--success)' }}>
                    ₹{receipt.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setReceiptOpen(false)}>
                    <X size={16} /> Close
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
                    <Printer size={16} /> Print
                  </button>
                </div>

                <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Thank you for shopping at NovaMart! 🛍️
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--danger)' }}>
                <AlertTriangle size={32} style={{ marginBottom: 10 }} />
                <p>Failed to load receipt.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

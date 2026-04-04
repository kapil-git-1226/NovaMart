import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { ShoppingCart, UserPlus, LogIn } from 'lucide-react';

const ROLES = [
  { id: 1, name: 'regional_admin',       label: 'Regional Admin',        desc: 'Full platform access — all stores & settings' },
  { id: 2, name: 'store_manager',         label: 'Store Manager',          desc: 'Manage inventory, staff & sales of one store' },
  { id: 3, name: 'inventory_supervisor',  label: 'Inventory Supervisor',   desc: 'Full inventory control — stock & products' },
  { id: 4, name: 'sales_associate',       label: 'Sales Associate',        desc: 'Point of Sale billing & product browsing' },
];

const STORES = [
  { id: 1, name: 'NovaMart – Koramangala, Bangalore' },
  { id: 2, name: 'NovaMart – Andheri, Mumbai' },
  { id: 3, name: 'NovaMart – Connaught, Delhi' },
];

export default function AuthPage() {
  const [mode, setMode]       = useState('login');   // 'login' | 'register'
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ── Login state ────────────────────────────────────────
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // ── Register state ─────────────────────────────────────
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', confirm: '',
    role_id: '', store_id: '',
  });

  // ── Handlers ───────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.append('username', loginEmail);
      body.append('password', loginPassword);

      const res = await authAPI.post('/auth/login', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);

      const meRes = await authAPI.get('/auth/me', {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });
      localStorage.setItem('user', JSON.stringify(meRes.data));
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (regForm.password !== regForm.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!regForm.role_id) {
      setError('Please select a role.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.post('/auth/register', {
        name:     regForm.name,
        email:    regForm.email,
        password: regForm.password,
        role_id:  parseInt(regForm.role_id),
        store_id: regForm.store_id ? parseInt(regForm.store_id) : null,
      });
      setError('');
      setMode('login');
      setLoginEmail(regForm.email);
      setRegForm({ name: '', email: '', password: '', confirm: '', role_id: '', store_id: '' });
      // Small delay to show success hint
      setTimeout(() => setError(''), 100);
      alert(`✅ Account created! Sign in as ${regForm.email}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  const selectedRole = ROLES.find((r) => r.id === parseInt(regForm.role_id));

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: mode === 'register' ? 520 : 420 }}>

        {/* ── Logo ─────────────────────────────────────── */}
        <div className="logo-section">
          <div className="logo-icon">
            <ShoppingCart size={28} />
          </div>
          <h1>NovaMart</h1>
          <p className="subtitle">Omnichannel Retail Platform</p>
        </div>

        {/* ── Tab Toggle ───────────────────────────────── */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 4, marginBottom: 28, border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem',
              background: mode === 'login' ? 'var(--primary-500)' : 'transparent',
              color: mode === 'login' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem',
              background: mode === 'register' ? 'var(--primary-500)' : 'transparent',
              color: mode === 'register' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <UserPlus size={14} /> Create Account
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* ════════════════════════════════════════════════
            LOGIN FORM
           ════════════════════════════════════════════════ */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@novamart.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              No account?{' '}
              <span
                onClick={() => setMode('register')}
                style={{ color: 'var(--primary-300)', cursor: 'pointer', fontWeight: 600 }}
              >
                Create one
              </span>
            </p>
          </form>
        )}

        {/* ════════════════════════════════════════════════
            REGISTER FORM
           ════════════════════════════════════════════════ */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                required autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                placeholder="you@novamart.com"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                required
              />
            </div>

            {/* ── Role Selector ─────────────────────────── */}
            <div className="form-group">
              <label>Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ROLES.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => setRegForm({ ...regForm, role_id: role.id.toString() })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${regForm.role_id === role.id.toString() ? 'var(--primary-400)' : 'var(--border-subtle)'}`,
                      background: regForm.role_id === role.id.toString() ? 'rgba(37,99,235,0.12)' : 'var(--bg-input)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: regForm.role_id === role.id.toString() ? 'var(--primary-300)' : 'var(--text-primary)', marginBottom: 3 }}>
                      {role.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {role.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Store Selector ────────────────────────── */}
            <div className="form-group">
              <label htmlFor="reg-store">
                Assigned Store{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional for Regional Admin)</span>
              </label>
              <select
                id="reg-store"
                value={regForm.store_id}
                onChange={(e) => setRegForm({ ...regForm, store_id: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', outline: 'none' }}
              >
                <option value="">— Select a store —</option>
                {STORES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="min 6 chars"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  required minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-confirm">Confirm Password</label>
                <input
                  id="reg-confirm"
                  type="password"
                  placeholder="repeat password"
                  value={regForm.confirm}
                  onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <span
                onClick={() => setMode('login')}
                style={{ color: 'var(--primary-300)', cursor: 'pointer', fontWeight: 600 }}
              >
                Sign in
              </span>
            </p>
          </form>
        )}

      </div>
    </div>
  );
}

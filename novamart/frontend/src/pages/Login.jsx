import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';
import { ShoppingCart, UserPlus, LogIn, KeyRound, Send, RotateCcw } from 'lucide-react';

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
  { id: 4, name: 'NovaMart – T. Nagar, Chennai' },
  { id: 5, name: 'NovaMart – Banjara Hills, Hyderabad' },
  { id: 6, name: 'NovaMart – Salt Lake, Kolkata' },
  { id: 7, name: 'NovaMart – Viman Nagar, Pune' },
  { id: 8, name: 'NovaMart – SG Highway, Ahmedabad' },
  { id: 9, name: 'NovaMart – Malviya, Jaipur' },
  { id: 10, name: 'NovaMart – Adajan, Surat' },
  { id: 11, name: 'NovaMart – Orchard, Singapore' },
  { id: 12, name: 'NovaMart – Sukhumvit, Bangkok' },
  { id: 13, name: 'NovaMart – Bintang, Kuala Lumpur' },
  { id: 14, name: 'NovaMart – Menteng, Jakarta' },
  { id: 15, name: 'NovaMart – Makati, Manila' },
  { id: 16, name: 'NovaMart – District 1, Ho Chi Minh' },
  { id: 17, name: 'NovaMart – Hoan Kiem, Hanoi' },
  { id: 18, name: 'NovaMart – BKK1, Phnom Penh' },
  { id: 19, name: 'NovaMart – Dagon, Yangon' },
  { id: 20, name: 'NovaMart – Seminyak, Bali' },
];

// ── Reusable tab button ───────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer',
        fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem',
        background: active ? 'var(--primary-500)' : 'transparent',
        color: active ? 'white' : 'var(--text-secondary)',
        transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 6,
      }}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

export default function AuthPage() {
  // top-level mode: 'login' | 'otp' | 'register'
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [mode, setMode]       = useState(initialMode);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already logged in, skip the login page entirely
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) navigate('/home', { replace: true });
  }, [navigate]);

  // ── Password login state ──────────────────────────────
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // ── OTP state ─────────────────────────────────────────
  const [otpEmail, setOtpEmail]   = useState('');
  const [otpCode, setOtpCode]     = useState('');
  const [otpSent, setOtpSent]     = useState(false);   // true = show code input
  const [resendTimer, setResendTimer] = useState(0);   // countdown in seconds

  // ── Register state ────────────────────────────────────
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', confirm: '',
    role_id: '', store_id: '',
  });

  // ── Resend countdown timer ────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Helper: save tokens and navigate home ─────────────
  async function finishLogin(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    const meRes = await authAPI.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    localStorage.setItem('user', JSON.stringify(meRes.data));
    navigate('/home');
  }

  // ── Password login handler ────────────────────────────
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
      await finishLogin(res.data.access_token, res.data.refresh_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  // ── OTP Step 1: send OTP ──────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.post('/auth/send-otp', { email: otpEmail });
      setOtpSent(true);
      setResendTimer(60);   // 60-second cooldown before resend
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Check your email address.');
    } finally {
      setLoading(false);
    }
  }

  // ── OTP Step 2: verify OTP ────────────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.post('/auth/verify-otp', {
        email: otpEmail,
        code: otpCode,
      });
      await finishLogin(res.data.access_token, res.data.refresh_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP ────────────────────────────────────────
  async function handleResend() {
    if (resendTimer > 0) return;
    setOtpCode('');
    setError('');
    setLoading(true);
    try {
      await authAPI.post('/auth/send-otp', { email: otpEmail });
      setResendTimer(60);
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Register handler ──────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (regForm.password !== regForm.confirm) { setError('Passwords do not match.'); return; }
    if (!regForm.role_id) { setError('Please select a role.'); return; }
    setLoading(true);
    try {
      await authAPI.post('/auth/register', {
        name:     regForm.name,
        email:    regForm.email,
        password: regForm.password,
        role_id:  parseInt(regForm.role_id),
        store_id: regForm.store_id ? parseInt(regForm.store_id) : null,
      });
      setMode('login');
      setLoginEmail(regForm.email);
      setRegForm({ name: '', email: '', password: '', confirm: '', role_id: '', store_id: '' });
      alert(`✅ Account created! Sign in as ${regForm.email}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError('');
    setOtpSent(false);
    setOtpCode('');
    setResendTimer(0);
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: mode === 'register' ? 520 : 440 }}>

        {/* ── Logo ─────────────────────────────────────── */}
        <div className="logo-section">
          <div className="logo-icon"><ShoppingCart size={28} /></div>
          <h1>NovaMart</h1>
          <p className="subtitle">Omnichannel Retail Platform</p>
        </div>

        {/* ── Tab Bar ──────────────────────────────────── */}
        <div style={{
          display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
          padding: 4, marginBottom: 28, border: '1px solid var(--border-subtle)', gap: 4,
        }}>
          <TabBtn active={mode === 'login' || mode === 'otp'} onClick={() => handleModeChange('login')} icon={LogIn}    label="Sign In" />
          <TabBtn active={mode === 'register'}                onClick={() => handleModeChange('register')} icon={UserPlus} label="Register" />
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* ══════════════════════════════════════════════
            PASSWORD LOGIN
           ══════════════════════════════════════════════ */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input id="login-email" type="email" placeholder="you@novamart.com"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" placeholder="••••••••"
                value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Forgot your password?{' '}
              <span onClick={() => handleModeChange('otp')}
                style={{ color: 'var(--primary-300)', cursor: 'pointer', fontWeight: 600 }}>
                Login via OTP instead
              </span>
            </p>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ══════════════════════════════════════════════
            OTP LOGIN
           ══════════════════════════════════════════════ */}
        {mode === 'otp' && (
          <div>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
                background: 'var(--primary-500)', color: 'white',
              }}>1</div>
              <div style={{ flex: 1, height: 2, background: otpSent ? 'var(--primary-500)' : 'var(--border-subtle)', transition: 'background 0.4s ease' }} />
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
                background: otpSent ? 'var(--primary-500)' : 'var(--border-subtle)',
                color: otpSent ? 'white' : 'var(--text-muted)',
                transition: 'all 0.4s ease',
              }}>2</div>
            </div>

            {/* ── Step 1: Enter email and send OTP ── */}
            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label htmlFor="otp-email">Registered Email Address</label>
                  <input id="otp-email" type="email" placeholder="you@novamart.com"
                    value={otpEmail} onChange={e => setOtpEmail(e.target.value)} required autoFocus />
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  A 6-digit verification code will be sent to this email.
                </p>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending…' : <><Send size={15} /> Send OTP</>}
                </button>
              </form>
            ) : (
              /* ── Step 2: Enter the OTP code ── */
              <form onSubmit={handleVerifyOtp}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  We sent a 6-digit code to <strong style={{ color: 'var(--primary-300)' }}>{otpEmail}</strong>.
                  It expires in <strong>4 minutes</strong>.
                </p>
                <div className="form-group">
                  <label htmlFor="otp-code">Verification Code</label>
                  <input
                    id="otp-code"
                    type="text"
                    placeholder="e.g. 839210"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    autoFocus
                    style={{ fontSize: '1.4rem', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 700 }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading || otpCode.length !== 6}
                  style={{ marginBottom: 12 }}>
                  {loading ? 'Verifying…' : <><KeyRound size={15} /> Verify & Sign In</>}
                </button>

                {/* Resend OTP */}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || loading}
                  style={{
                    width: '100%', background: 'transparent', border: '1px solid var(--border-subtle)',
                    borderRadius: '0.375rem', padding: '10px', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                    color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--primary-300)',
                    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <RotateCcw size={14} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>

                <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Wrong email?{' '}
                  <span onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }}
                    style={{ color: 'var(--primary-300)', cursor: 'pointer', fontWeight: 600 }}>
                    Go back
                  </span>
                </p>
              </form>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            REGISTER FORM
           ══════════════════════════════════════════════ */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <input id="reg-name" type="text" placeholder="e.g. Rahul Sharma"
                value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                required autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <input id="reg-email" type="email" placeholder="you@novamart.com"
                value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
            </div>

            {/* Role Selector */}
            <div className="form-group">
              <label>Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ROLES.map((role) => (
                  <div key={role.id}
                    onClick={() => setRegForm({ ...regForm, role_id: role.id.toString() })}
                    style={{
                      padding: '12px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: `1px solid ${regForm.role_id === role.id.toString() ? 'var(--primary-400)' : 'var(--border-subtle)'}`,
                      background: regForm.role_id === role.id.toString() ? 'rgba(37,99,235,0.12)' : 'var(--bg-input)',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 3,
                      color: regForm.role_id === role.id.toString() ? 'var(--primary-300)' : 'var(--text-primary)' }}>
                      {role.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {role.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store Selector */}
            <div className="form-group">
              <label htmlFor="reg-store">
                Assigned Store{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional for Regional Admin)</span>
              </label>
              <select id="reg-store" value={regForm.store_id}
                onChange={e => setRegForm({ ...regForm, store_id: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', outline: 'none' }}>
                <option value="">— Select a store —</option>
                {STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <input id="reg-password" type="password" placeholder="min 6 chars"
                  value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                  required minLength={6} />
              </div>
              <div className="form-group">
                <label htmlFor="reg-confirm">Confirm Password</label>
                <input id="reg-confirm" type="password" placeholder="repeat password"
                  value={regForm.confirm} onChange={e => setRegForm({ ...regForm, confirm: e.target.value })}
                  required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

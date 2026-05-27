import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Store, LayoutDashboard, Package,
  Sparkles, ArrowRight, ReceiptText, LogIn, UserPlus,
  TrendingUp, Shield, Zap,
} from 'lucide-react';

function OrbitDot({ size, radius, duration, delay, color }) {
  return (
    <div style={{
      position: 'absolute',
      width: radius * 2, height: radius * 2,
      top: '50%', left: '50%',
      marginTop: -radius, marginLeft: -radius,
      borderRadius: '50%',
      border: `1px dashed ${color}`,
      animation: `landingOrbit ${duration}s linear ${delay}s infinite`,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        top: -size / 2, left: '50%', marginLeft: -size / 2,
        width: size, height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 ${size * 3}px ${color}`,
      }} />
    </div>
  );
}

const FEATURES = [
  {
    emoji: '📊',
    label: 'Live Dashboard',
    desc: 'Real-time KPIs, revenue charts, and store performance insights.',
    glow: 'rgba(59,130,246,0.35)',
  },
  {
    emoji: '📦',
    label: 'Inventory Control',
    desc: 'Manage products, track stock levels, and get replenishment alerts.',
    glow: 'rgba(16,185,129,0.35)',
  },
  {
    emoji: '🛒',
    label: 'Point of Sale',
    desc: 'Fast checkout, receipt generation, and payment management.',
    glow: 'rgba(139,92,246,0.35)',
  },
  {
    emoji: '🧾',
    label: 'Receipts & Reports',
    desc: 'View all past transactions and daily sales summaries.',
    glow: 'rgba(236,72,153,0.35)',
  },
  {
    emoji: '🤖',
    label: 'Ask Nova AI',
    desc: 'Query your data in plain English — powered by Gemini AI.',
    glow: 'rgba(245,158,11,0.35)',
  },
  {
    emoji: '🔒',
    label: 'Role-Based Access',
    desc: 'Granular permissions per role — Admin, Manager, Associate & more.',
    glow: 'rgba(99,102,241,0.35)',
  },
];

const STATS = [
  { value: '86', label: 'Retail Stores' },
  { value: '4', label: 'User Roles' },
  { value: '6', label: 'Modules' },
  { value: 'AI', label: 'Powered' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // If already logged in, go straight to the app
    const token = localStorage.getItem('access_token');
    if (token) { navigate('/home', { replace: true }); return; }

    const t = setTimeout(() => setVisible(true), 80);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll); };
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>

      {/* ── Top Navbar ──────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        background: scrolled
          ? 'rgba(10,10,10,0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #b45309, #f59e0b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(245,158,11,0.4)',
          }}>
            <ShoppingCart size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.3px' }}>
            NovaMart
          </span>
        </div>

        {/* Tagline — hidden on small screens */}
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={13} style={{ color: '#f59e0b' }} />
          Omnichannel Retail Platform
        </span>

        {/* Auth Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            id="landing-signin-btn"
            onClick={() => navigate('/login')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', borderRadius: 8,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#e5e5e5', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          >
            <LogIn size={15} /> Sign In
          </button>
          <button
            id="landing-signup-btn"
            onClick={() => navigate('/login?tab=register')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', borderRadius: 8,
              background: 'linear-gradient(135deg, #b45309, #f59e0b)',
              border: 'none', color: '#fff', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem',
              boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,0.35)'; }}
          >
            <UserPlus size={15} /> Sign Up
          </button>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', position: 'relative', overflow: 'hidden',
      }}>

        {/* Background orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', width: 700, height: 700,
            top: '-25%', left: '-15%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'landingFloat 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 600, height: 600,
            bottom: '-20%', right: '-10%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'landingFloat 10s ease-in-out 2s infinite reverse',
          }} />
          <div style={{
            position: 'absolute', width: 400, height: 400,
            top: '30%', right: '20%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'landingFloat 6s ease-in-out 1s infinite',
          }} />
        </div>

        {/* Orbit logo */}
        <div style={{
          position: 'relative', width: 130, height: 130,
          marginBottom: 40,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.4)',
          transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <OrbitDot size={6}  radius={58} duration={4}  delay={0}   color="rgba(245,158,11,0.7)" />
          <OrbitDot size={4}  radius={74} duration={7}  delay={0.5} color="rgba(59,130,246,0.4)" />
          <OrbitDot size={5}  radius={90} duration={10} delay={1}   color="rgba(139,92,246,0.3)" />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #92400e, #b45309)',
            borderRadius: 32,
            boxShadow: '0 0 50px rgba(245,158,11,0.5), 0 0 100px rgba(245,158,11,0.2)',
          }}>
            <Store size={52} color="white" />
          </div>
        </div>

        {/* Headline */}
        <div style={{
          textAlign: 'center', marginBottom: 24,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'all 0.7s ease 0.15s',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 30, padding: '5px 16px', marginBottom: 20,
            fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600,
          }}>
            <TrendingUp size={13} /> Enterprise Retail Management
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 900, lineHeight: 1.1, marginBottom: 20,
            background: 'linear-gradient(135deg, #ffffff 10%, #fde68a 50%, #f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
          }}>
            Welcome to NovaMart
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 40px',
            lineHeight: 1.65,
          }}>
            The all-in-one retail operations platform for managing inventory,
            sales, AI insights, and team access across <strong style={{ color: 'var(--text-primary)' }}>86+ stores</strong>.
          </p>
        </div>

        {/* CTA buttons */}
        <div style={{
          display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
          marginBottom: 72,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease 0.3s',
        }}>
          <button
            id="hero-signin-btn"
            onClick={() => navigate('/login')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 10,
              background: 'linear-gradient(135deg, #b45309, #f59e0b)',
              border: 'none', color: '#fff', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1rem',
              boxShadow: '0 6px 24px rgba(245,158,11,0.4)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(245,158,11,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,158,11,0.4)'; }}
          >
            <LogIn size={18} /> Sign In to NovaMart
          </button>
          <button
            id="hero-signup-btn"
            onClick={() => navigate('/login?tab=register')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)', color: '#e5e5e5', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1rem',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          >
            <UserPlus size={18} /> Create Account
          </button>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex', gap: 0, flexWrap: 'wrap', justifyContent: 'center',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s ease 0.45s',
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              padding: '18px 36px', textAlign: 'center',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px 120px', maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 30, padding: '5px 16px', marginBottom: 16,
            fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600,
          }}>
            <Shield size={13} /> Everything you need
          </div>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 800,
            color: '#f5f5f5', marginBottom: 12, letterSpacing: '-0.5px',
          }}>
            A complete retail command centre
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
            Six powerful modules, one unified platform. Manage every aspect of
            your retail operations from a single dashboard.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {FEATURES.map((f, i) => {
            const isHovered = hoveredCard === i;
            return (
              <div
                key={f.label}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  position: 'relative',
                  background: isHovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isHovered ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 18, padding: '28px 28px 24px', overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  transform: isHovered ? 'translateY(-6px) scale(1.012)' : 'translateY(0) scale(1)',
                  boxShadow: isHovered
                    ? `0 20px 60px ${f.glow}, 0 0 0 1px rgba(255,255,255,0.06)`
                    : '0 4px 24px rgba(0,0,0,0.2)',
                }}
              >
                {/* Hover glow */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 18,
                  background: `radial-gradient(circle at 30% 30%, ${f.glow}, transparent 65%)`,
                  opacity: isHovered ? 1 : 0, transition: 'opacity 0.4s', pointerEvents: 'none',
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, marginBottom: 16, fontSize: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isHovered ? `rgba(255,255,255,0.08)` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isHovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
                    transition: 'all 0.3s',
                  }}>
                    {f.emoji}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: isHovered ? '#fff' : 'var(--text-primary)', transition: 'color 0.2s', margin: 0 }}>
                      {f.label}
                    </h3>
                    <ArrowRight size={16} style={{
                      color: '#f59e0b',
                      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                      opacity: isHovered ? 1 : 0.35,
                      transition: 'all 0.25s',
                    }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────── */}
      <section style={{
        padding: '64px 24px 80px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f5f5f5', marginBottom: 12 }}>
          Ready to get started?
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '1rem' }}>
          Sign in to your account or create a new one to access the platform.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            id="footer-signin-btn"
            onClick={() => navigate('/login')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 9,
              background: 'linear-gradient(135deg, #b45309, #f59e0b)',
              border: 'none', color: '#fff', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.95rem',
              boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
            }}
          >
            <LogIn size={16} /> Sign In
          </button>
          <button
            id="footer-signup-btn"
            onClick={() => navigate('/login?tab=register')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 9,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: '#ccc', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.95rem',
            }}
          >
            <UserPlus size={16} /> Create Account
          </button>
        </div>

        <p style={{ marginTop: 48, fontSize: '0.78rem', color: '#333' }}>
          © 2025 NovaMart · Omnichannel Retail Platform
        </p>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes landingOrbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes landingFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-28px) scale(1.04); }
        }
      ` }} />
    </div>
  );
}

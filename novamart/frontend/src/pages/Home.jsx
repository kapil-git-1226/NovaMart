import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart,
  Sparkles, ArrowRight, TrendingUp, Store, ReceiptText,
} from 'lucide-react';
import {
  getRoleId, canSeeDashboard, canSeeInventory, canSeePOS, canSeeReceipts, canSeeAI,
} from '../utils/rbac';

const ROLE_LABELS = {
  1: 'Regional Admin',
  2: 'Store Manager',
  3: 'Inventory Supervisor',
  4: 'Sales Associate',
};

const ALL_CARDS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    check: canSeeDashboard,
    description: 'Live KPIs, revenue charts and performance insights for your store.',
    gradient: 'from-blue-500 to-cyan-400',
    glowColor: 'rgba(59,130,246,0.35)',
    emoji: '📊',
  },
  {
    path: '/inventory',
    label: 'Inventory',
    icon: Package,
    check: canSeeInventory,
    description: 'Manage your product catalog, stock levels and replenishment alerts.',
    gradient: 'from-emerald-500 to-teal-400',
    glowColor: 'rgba(16,185,129,0.35)',
    emoji: '📦',
  },
  {
    path: '/pos',
    label: 'Point of Sale',
    icon: ShoppingCart,
    check: canSeePOS,
    description: 'Process customer checkouts, generate receipts and manage payments.',
    gradient: 'from-violet-500 to-purple-400',
    glowColor: 'rgba(139,92,246,0.35)',
    emoji: '🛒',
  },
  {
    path: '/receipts',
    label: 'Receipts',
    icon: ReceiptText,
    check: canSeeReceipts,
    description: 'View past receipts and track daily sales summaries.',
    gradient: 'from-pink-500 to-rose-400',
    glowColor: 'rgba(236,72,153,0.35)',
    emoji: '🧾',
  },
  {
    path: '/ai',
    label: 'Ask Nova AI',
    icon: Sparkles,
    check: canSeeAI,
    description: 'Ask natural language questions about sales, stock, and store reports.',
    gradient: 'from-amber-500 to-orange-400',
    glowColor: 'rgba(245,158,11,0.35)',
    emoji: '🤖',
  },
];

function OrbitDot({ size, radius, duration, delay, color }) {
  return (
    <div style={{
      position: 'absolute',
      width: radius * 2, height: radius * 2,
      top: '50%', left: '50%',
      marginTop: -radius, marginLeft: -radius,
      borderRadius: '50%',
      border: `1px dashed ${color}`,
      animation: `orbit ${duration}s linear ${delay}s infinite`,
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

export default function Home() {
  const navigate = useNavigate();
  const roleId = getRoleId();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const cards = ALL_CARDS.filter((c) => c.check(roleId));

  const [visible, setVisible] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Animated background orbs ─────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 600, height: 600,
          top: '-20%', left: '-10%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'floatSlow 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500,
          bottom: '-15%', right: '-5%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'floatSlow 10s ease-in-out 2s infinite reverse',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300,
          top: '40%', right: '15%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'floatSlow 6s ease-in-out 1s infinite',
        }} />
      </div>

      {/* ── Logo orbit ────────────────────────────────── */}
      <div style={{
        position: 'relative', width: 120, height: 120,
        marginBottom: 32,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.5)',
        transition: 'all 0.7s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <OrbitDot size={6}  radius={56} duration={4}  delay={0}   color="rgba(59,130,246,0.6)" />
        <OrbitDot size={4}  radius={72} duration={6}  delay={0.5} color="rgba(139,92,246,0.4)" />
        <OrbitDot size={5}  radius={88} duration={9}  delay={1}   color="rgba(16,185,129,0.3)" />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #1d40af, #3b82f6)',
          borderRadius: 28,
          boxShadow: '0 0 40px rgba(59,130,246,0.5), 0 0 80px rgba(59,130,246,0.2)',
        }}>
          <Store size={48} color="white" />
        </div>
      </div>

      {/* ── Greeting + Brand ──────────────────────────── */}
      <div style={{
        textAlign: 'center', marginBottom: 8,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.6s ease 0.2s',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 8 }}>
          {greeting}, <strong style={{ color: 'var(--primary-400)' }}>{user.name || 'there'}</strong> 👋
        </p>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff 20%, #93c5fd 60%, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
          marginBottom: 12,
        }}>
          Welcome to NovaMart
        </h1>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 30, padding: '6px 16px',
          fontSize: '0.82rem', color: 'var(--primary-400)',
        }}>
          <TrendingUp size={14} />
          {ROLE_LABELS[roleId] || 'Team Member'}
        </div>
      </div>

      <p style={{
        color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 48,
        textAlign: 'center', maxWidth: 480,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s ease 0.35s',
      }}>
        Your retail command centre. Select a module below to get started.
      </p>

      {/* ── Feature Cards ─────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(cards.length, 2)}, 1fr)`,
        gap: 20,
        width: '100%',
        maxWidth: 760,
      }}>
        {cards.map((card, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={card.path}
              onClick={() => navigate(card.path)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                position: 'relative',
                background: isHovered
                  ? 'rgba(255,255,255,0.07)'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isHovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 20,
                padding: '28px 28px 24px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                transform: isHovered ? 'translateY(-6px) scale(1.015)' : 'translateY(0) scale(1)',
                boxShadow: isHovered
                  ? `0 20px 60px ${card.glowColor}, 0 0 0 1px rgba(255,255,255,0.08)`
                  : '0 4px 24px rgba(0,0,0,0.2)',
                opacity: visible ? 1 : 0,
                animationDelay: `${0.5 + i * 0.1}s`,
              }}
            >
              {/* Glow bleed on hover */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 20,
                background: `radial-gradient(circle at 30% 30%, ${card.glowColor}, transparent 65%)`,
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.4s',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14, marginBottom: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isHovered
                    ? `linear-gradient(135deg, ${card.glowColor}, rgba(255,255,255,0.05))`
                    : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.3s',
                  fontSize: 24,
                }}>
                  {card.emoji}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{
                    fontSize: '1.1rem', fontWeight: 700, marginBottom: 8,
                    color: isHovered ? '#fff' : 'var(--text-primary)',
                    transition: 'color 0.2s',
                  }}>
                    {card.label}
                  </h3>
                  <ArrowRight
                    size={18}
                    style={{
                      color: 'var(--primary-400)',
                      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                      transition: 'transform 0.25s',
                      opacity: isHovered ? 1 : 0.4,
                    }}
                  />
                </div>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-30px) scale(1.05); }
        }
      `}} />
    </div>
  );
}

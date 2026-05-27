import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ShoppingCart, Store, LayoutDashboard, Package,
  Sparkles, ArrowRight, ReceiptText, LogIn, UserPlus,
  TrendingUp, Shield, Zap, Tag, Percent
} from 'lucide-react';

function FloatingRetailBackground() {
  const { scrollY } = useScroll();

  const elements = [
    { id: 1, type: ShoppingCart, left: '8%', top: '18%', size: 48, duration: 25, delay: 0, color: 'rgba(245,158,11,0.45)', scrollFactor: -0.65, xDrift: [-20, 20, -20] },
    { id: 2, type: Store, left: '86%', top: '15%', size: 58, duration: 32, delay: 1, color: 'rgba(59,130,246,0.45)', scrollFactor: 0.45, xDrift: [30, -30, 30] },
    { id: 3, type: Tag, left: '78%', top: '65%', size: 36, duration: 22, delay: 3, color: 'rgba(16,185,129,0.45)', scrollFactor: -0.5, xDrift: [-15, 25, -15] },
    { id: 4, type: ReceiptText, left: '12%', top: '60%', size: 52, duration: 28, delay: 2, color: 'rgba(139,92,246,0.45)', scrollFactor: 0.7, xDrift: [25, -20, 25] },
    { id: 5, type: Package, left: '46%', top: '82%', size: 40, duration: 26, delay: 4, color: 'rgba(236,72,153,0.45)', scrollFactor: -0.4, xDrift: [-25, 25, -25] },
    { id: 6, type: Percent, left: '84%', top: '42%', size: 30, duration: 20, delay: 0.5, color: 'rgba(245,158,11,0.4)', scrollFactor: 0.5, xDrift: [20, -20, 20] },
    { id: 7, type: Sparkles, left: '26%', top: '24%', size: 32, duration: 18, delay: 1.5, color: 'rgba(255,255,255,0.45)', scrollFactor: -0.75, xDrift: [-30, 30, -30] },
    { id: 8, type: ShoppingCart, left: '90%', top: '88%', size: 44, duration: 30, delay: 5, color: 'rgba(245,158,11,0.45)', scrollFactor: 0.55, xDrift: [25, -25, 25] },
    { id: 9, type: Store, left: '4%', top: '40%', size: 50, duration: 27, delay: 2.5, color: 'rgba(59,130,246,0.45)', scrollFactor: -0.6, xDrift: [-30, 30, -30] },
    { id: 10, type: Tag, left: '58%', top: '8%', size: 34, duration: 24, delay: 3.5, color: 'rgba(16,185,129,0.45)', scrollFactor: 0.35, xDrift: [15, -15, 15] },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {elements.map((el) => {
        const IconComponent = el.type;
        // Transform vertical window scroll to customized element speed offsets
        const yParallax = useTransform(scrollY, [0, 1200], [0, 1200 * el.scrollFactor]);

        return (
          <motion.div
            key={el.id}
            initial={{ rotate: 0 }}
            animate={{ 
              x: el.xDrift,
              rotate: [0, 360],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: el.delay,
            }}
            style={{
              position: 'absolute',
              left: el.left,
              top: el.top,
              y: yParallax, // Linked directly to scroll!
            }}
          >
            <IconComponent size={el.size} strokeWidth={1.3} color={el.color} />
          </motion.div>
        );
      })}
    </div>
  );
}

function OrbitDot({ size, radius, duration, delay, color }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration, delay, ease: "linear" }}
      style={{
        position: 'absolute',
        width: radius * 2, height: radius * 2,
        top: '50%', left: '50%',
        marginTop: -radius, marginLeft: -radius,
        borderRadius: '50%',
        border: `1px dashed ${color}`,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        position: 'absolute',
        top: -size / 2, left: '50%', marginLeft: -size / 2,
        width: size, height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 ${size * 3}px ${color}`,
      }} />
    </motion.div>
  );
}

const GLYPHS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_@#$*&%-+=";

function DecipherText({ text, delay = 0.1 }) {
  const [displayText, setDisplayText] = useState("");
  const [triggerCount, setTriggerCount] = useState(0);

  useEffect(() => {
    let timer;
    let iteration = 0;
    const splitText = text.split("");

    // Set initial jumbled string
    const initialJumble = splitText
      .map(char => (char === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
      .join("");
    setDisplayText(initialJumble);

    const startTimeout = setTimeout(() => {
      timer = setInterval(() => {
        setDisplayText(prev => {
          return splitText
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < iteration) return text[index];
              // Deciphering effect: 30% chance to show a random glyph, otherwise keep previous
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join("");
        });

        iteration += 0.45; // Controls decoding speed
        if (iteration >= text.length + 1) {
          clearInterval(timer);
          setDisplayText(text);
        }
      }, 25);
    }, delay * 1000);

    return () => {
      clearTimeout(startTimeout);
      if (timer) clearInterval(timer);
    };
  }, [text, delay, triggerCount]);

  return (
    <motion.span
      onMouseEnter={() => setTriggerCount(prev => prev + 1)}
      style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', cursor: 'pointer' }}
    >
      {displayText.split("").map((char, idx) => {
        const isResolved = char === text[idx];
        return (
          <motion.span
            key={idx}
            animate={isResolved ? { scale: [1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'inline-block',
              color: isResolved ? 'inherit' : '#f59e0b',
              textShadow: isResolved ? 'none' : '0 0 8px rgba(245,158,11,0.5)',
              fontFamily: isResolved ? 'inherit' : 'monospace',
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        );
      })}
    </motion.span>
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
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // If already logged in, go straight to the app
    const token = localStorage.getItem('access_token');
    if (token) { navigate('/home', { replace: true }); return; }

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); };
  }, [navigate]);

  // Stagger variants for Hero elements
  const heroContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      }
    }
  };

  const heroItemVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 80, damping: 15 }
    }
  };

  const featureContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const featureCardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 70, damping: 16 }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>

      {/* ── Top Navbar ──────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        background: scrolled ? 'rgba(10,10,10,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div
            whileHover={{ rotate: 15, scale: 1.05 }}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #b45309, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(245,158,11,0.4)',
              cursor: 'pointer',
            }}
          >
            <ShoppingCart size={18} color="white" />
          </motion.div>
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
          <motion.button
            id="landing-signin-btn"
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.3)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', borderRadius: 8,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#e5e5e5', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem',
              transition: 'border-color 0.2s ease',
            }}
          >
            <LogIn size={15} /> Sign In
          </motion.button>
          <motion.button
            id="landing-signup-btn"
            onClick={() => navigate('/login?tab=register')}
            whileHover={{ scale: 1.03, y: -1, boxShadow: '0 8px 24px rgba(245,158,11,0.45)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', borderRadius: 8,
              background: 'linear-gradient(135deg, #b45309, #f59e0b)',
              border: 'none', color: '#fff', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem',
              boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
            }}
          >
            <UserPlus size={15} /> Sign Up
          </motion.button>
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
          <motion.div
            animate={{
              y: [0, -28, 0],
              scale: [1, 1.04, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute', width: 700, height: 700,
              top: '-25%', left: '-15%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <motion.div
            animate={{
              y: [0, 28, 0],
              scale: [1, 1.04, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            style={{
              position: 'absolute', width: 600, height: 600,
              bottom: '-20%', right: '-10%',
              background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        </div>

        {/* Floating Shopping/Market Background Elements */}
        <FloatingRetailBackground />

        {/* Parent container for Staggered Hero Elements */}
        <motion.div
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', width: '100%', maxWidth: 800, zIndex: 10
          }}
        >
          {/* Orbit logo */}
          <motion.div
            variants={heroItemVariants}
            style={{
              position: 'relative', width: 130, height: 130,
              marginBottom: 40,
            }}
          >
            <OrbitDot size={6}  radius={58} duration={4}  delay={0}   color="rgba(245,158,11,0.7)" />
            <OrbitDot size={4}  radius={74} duration={7}  delay={0.5} color="rgba(59,130,246,0.4)" />
            <OrbitDot size={5}  radius={90} duration={10} delay={1}   color="rgba(139,92,246,0.3)" />
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #92400e, #b45309)',
                borderRadius: 32,
                boxShadow: '0 0 50px rgba(245,158,11,0.5), 0 0 100px rgba(245,158,11,0.2)',
                cursor: 'pointer',
              }}
            >
              <Store size={52} color="white" />
            </motion.div>
          </motion.div>

          {/* Badge & Headline */}
          <motion.div variants={heroItemVariants} style={{ marginBottom: 24 }}>
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
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <DecipherText text="Welcome to NovaMart" delay={0.2} />
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto',
              lineHeight: 1.65,
            }}>
              The all-in-one retail operations platform for managing inventory,
              sales, AI insights, and team access across <strong style={{ color: 'var(--text-primary)' }}>86+ stores</strong>.
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            variants={heroItemVariants}
            style={{
              display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
              marginBottom: 72,
            }}
          >
            <motion.button
              id="hero-signin-btn"
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.04, y: -2, boxShadow: '0 12px 32px rgba(245,158,11,0.5)' }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 32px', borderRadius: 10,
                background: 'linear-gradient(135deg, #b45309, #f59e0b)',
                border: 'none', color: '#fff', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1rem',
                boxShadow: '0 6px 24px rgba(245,158,11,0.4)',
              }}
            >
              <LogIn size={18} /> Sign In to NovaMart
            </motion.button>
            <motion.button
              id="hero-signup-btn"
              onClick={() => navigate('/login?tab=register')}
              whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 32px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)', color: '#e5e5e5', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1rem',
              }}
            >
              <UserPlus size={18} /> Create Account
            </motion.button>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            variants={heroItemVariants}
            style={{
              display: 'flex', gap: 0, flexWrap: 'wrap', justifyContent: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, overflow: 'hidden',
            }}
          >
            {STATS.map((s, i) => (
              <div key={s.label} style={{
                padding: '18px 36px', textAlign: 'center',
                borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                  style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}
                >
                  {s.value}
                </motion.div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px 120px', maxWidth: 1100, margin: '0 auto' }}>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
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
        </motion.div>

        <motion.div
          variants={featureContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {FEATURES.map((f, i) => {
            const isHovered = hoveredCard === i;
            return (
              <motion.div
                key={f.label}
                variants={featureCardVariants}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                whileHover={{
                  y: -6,
                  scale: 1.012,
                  borderColor: 'rgba(255,255,255,0.16)',
                  boxShadow: `0 20px 60px ${f.glow}, 0 0 0 1px rgba(255,255,255,0.06)`,
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  position: 'relative',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 18, padding: '28px 28px 24px', overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                {/* Hover glow */}
                <motion.div
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 18,
                    background: `radial-gradient(circle at 30% 30%, ${f.glow}, transparent 65%)`,
                    pointerEvents: 'none',
                  }}
                />
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
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{
          padding: '64px 24px 80px', textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f5f5f5', marginBottom: 12 }}>
          Ready to get started?
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '1rem' }}>
          Sign in to your account or create a new one to access the platform.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            id="footer-signin-btn"
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.05, y: -1, boxShadow: '0 8px 24px rgba(245,158,11,0.45)' }}
            whileTap={{ scale: 0.95 }}
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
          </motion.button>
          <motion.button
            id="footer-signup-btn"
            onClick={() => navigate('/login?tab=register')}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.3)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 9,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: '#ccc', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.95rem',
            }}
          >
            <UserPlus size={16} /> Create Account
          </motion.button>
        </div>

        <p style={{ marginTop: 48, fontSize: '0.78rem', color: '#333' }}>
          © 2025 NovaMart · Omnichannel Retail Platform
        </p>
      </motion.section>
    </div>
  );
}

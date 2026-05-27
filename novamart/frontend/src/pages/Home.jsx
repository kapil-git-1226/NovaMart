import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart,
  Sparkles, ArrowRight, TrendingUp, Store, ReceiptText, Tag, Percent
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
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join("");
        });

        iteration += 0.45;
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
              color: isResolved ? 'inherit' : '#3b82f6', // uses a neon blue for Home scrambled text
              textShadow: isResolved ? 'none' : '0 0 8px rgba(59,130,246,0.5)',
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

function FloatingRetailBackground() {
  const elements = [
    { id: 1, type: ShoppingCart, left: '8%', top: '18%', size: 48, duration: 25, delay: 0, color: 'rgba(245,158,11,0.45)', xRange: [-30, 40, -30], yRange: [-25, 45, -25] },
    { id: 2, type: Store, left: '86%', top: '15%', size: 58, duration: 32, delay: 1, color: 'rgba(59,130,246,0.45)', xRange: [40, -35, 40], yRange: [-35, 35, -35] },
    { id: 3, type: Tag, left: '78%', top: '65%', size: 36, duration: 22, delay: 3, color: 'rgba(16,185,129,0.45)', xRange: [-20, 35, -20], yRange: [30, -20, 30] },
    { id: 4, type: ReceiptText, left: '12%', top: '60%', size: 52, duration: 28, delay: 2, color: 'rgba(139,92,246,0.45)', xRange: [35, -20, 35], yRange: [-40, 20, -40] },
    { id: 5, type: Package, left: '46%', top: '82%', size: 40, duration: 26, delay: 4, color: 'rgba(236,72,153,0.45)', xRange: [-30, 30, -30], yRange: [20, -35, 20] },
    { id: 6, type: Percent, left: '84%', top: '42%', size: 30, duration: 20, delay: 0.5, color: 'rgba(245,158,11,0.4)', xRange: [25, -25, 25], yRange: [-20, 30, -20] },
    { id: 7, type: Sparkles, left: '26%', top: '24%', size: 32, duration: 18, delay: 1.5, color: 'rgba(255,255,255,0.45)', xRange: [-25, 25, -25], yRange: [35, -35, 35] },
    { id: 8, type: ShoppingCart, left: '90%', top: '88%', size: 44, duration: 30, delay: 5, color: 'rgba(245,158,11,0.45)', xRange: [30, -30, 30], yRange: [-30, 30, -30] },
    { id: 9, type: Store, left: '4%', top: '40%', size: 50, duration: 27, delay: 2.5, color: 'rgba(59,130,246,0.45)', xRange: [-35, 35, -35], yRange: [40, -40, 40] },
    { id: 10, type: Tag, left: '58%', top: '8%', size: 34, duration: 24, delay: 3.5, color: 'rgba(16,185,129,0.45)', xRange: [20, -20, 20], yRange: [-25, 25, -25] },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {elements.map((el) => {
        const IconComponent = el.type;
        return (
          <motion.div
            key={el.id}
            initial={{ x: 0, y: 0, rotate: 0 }}
            animate={{ 
              x: el.xRange,
              y: el.yRange,
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
            }}
          >
            <IconComponent size={el.size} strokeWidth={1.3} color={el.color} />
          </motion.div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const roleId = getRoleId();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const cards = ALL_CARDS.filter((c) => c.check(roleId));

  const [hoveredIdx, setHoveredIdx] = useState(null);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Animation variants
  const welcomeContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      }
    }
  };

  const welcomeItemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 80, damping: 15 }
    }
  };

  const cardContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 75, damping: 15 }
    }
  };

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
        <motion.div
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: 'absolute', width: 600, height: 600,
            top: '-20%', left: '-10%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          style={{
            position: 'absolute', width: 500, height: 500,
            bottom: '-15%', right: '-5%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Floating Shopping/Market Background Elements */}
      <FloatingRetailBackground />

      {/* ── Parent Container for Greeting & Header ────── */}
      <motion.div
        variants={welcomeContainerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', width: '100%', maxWidth: 800, zIndex: 10
        }}
      >
        {/* Logo orbit */}
        <motion.div
          variants={welcomeItemVariants}
          style={{
            position: 'relative', width: 120, height: 120,
            marginBottom: 32,
          }}
        >
          <OrbitDot size={6}  radius={56} duration={4}  delay={0}   color="rgba(59,130,246,0.6)" />
          <OrbitDot size={4}  radius={72} duration={6}  delay={0.5} color="rgba(139,92,246,0.4)" />
          <OrbitDot size={5}  radius={88} duration={9}  delay={1}   color="rgba(16,185,129,0.3)" />
          <motion.div
            whileHover={{ scale: 1.08, rotate: -5 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #1d40af, #3b82f6)',
              borderRadius: 28,
              boxShadow: '0 0 40px rgba(59,130,246,0.5), 0 0 80px rgba(59,130,246,0.2)',
              cursor: 'pointer',
            }}
          >
            <Store size={48} color="white" />
          </motion.div>
        </motion.div>

        {/* Greeting + Brand */}
        <motion.div variants={welcomeItemVariants} style={{ marginBottom: 8 }}>
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
            letterSpacing: '-0.5px',
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <DecipherText text="Welcome to NovaMart" delay={0.2} />
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
        </motion.div>

        <motion.p
          variants={welcomeItemVariants}
          style={{
            color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 48,
            textAlign: 'center', maxWidth: 480,
          }}
        >
          Your retail command centre. Select a module below to get started.
        </motion.p>
      </motion.div>

      {/* ── Feature Cards ─────────────────────────────── */}
      <motion.div
        variants={cardContainerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(320px, 1fr))`,
          gap: 20,
          width: '100%',
          maxWidth: 760,
          zIndex: 10,
        }}
      >
        {cards.map((card, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <motion.div
              key={card.path}
              variants={cardItemVariants}
              onClick={() => navigate(card.path)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              whileHover={{
                y: -6,
                scale: 1.015,
                borderColor: 'rgba(255,255,255,0.18)',
                boxShadow: `0 20px 60px ${card.glowColor}, 0 0 0 1px rgba(255,255,255,0.08)`,
              }}
              whileTap={{ scale: 0.985 }}
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20,
                padding: '28px 28px 24px',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              {/* Glow bleed on hover */}
              <motion.div
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: 20,
                  background: `radial-gradient(circle at 30% 30%, ${card.glowColor}, transparent 65%)`,
                  pointerEvents: 'none',
                }}
              />

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
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

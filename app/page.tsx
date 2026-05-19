"use client";

import { useState, useEffect, useRef } from "react";
import {
  LogIn, UserPlus, Upload, ArrowRight, Brain, Target, AlertTriangle,
  TrendingUp, Lock, Shield, Trash2, EyeOff, CheckCircle, XCircle,
  Sparkles, FileText, ChevronRight, Menu, X
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: "#080B14",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.15)",
  text: "#ffffff",
  textMuted: "rgba(255,255,255,0.45)",
  textFaint: "rgba(255,255,255,0.25)",
  emerald: "#6EE7B7",
  cyan: "#67E8F9",
  blue: "#60A5FA",
  amber: "#FBB040",
  rose: "#FB7185",
  violet: "#A78BFA",
};

// ─── Global responsive styles ─────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #080B14; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #080B14; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 3px; }

  /* ── Navbar ── */
  .ml-nav-inner {
    max-width: 1100px; margin: 0 auto; padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .ml-nav-auth { display: flex; align-items: center; gap: 8px; }
  .ml-hamburger { display: none; }
  .ml-mobile-menu {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 49;
    background: rgba(8,11,20,0.97); backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px); display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    padding: 80px 24px 40px; animation: fadeInMenu 0.18s ease;
  }
  @keyframes fadeInMenu { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
  .ml-mobile-btn {
    width: 100%; max-width: 320px; height: 52px; border-radius: 16px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-family: 'DM Sans', sans-serif; transition: opacity 0.2s, transform 0.2s;
  }
  .ml-mobile-btn:active { transform: scale(0.97); opacity: 0.85; }

  /* ── Section containers ── */
  .ml-section { padding: 112px 24px; }
  .ml-section-inner { max-width: 1000px; margin: 0 auto; }
  .ml-section-heading { text-align: center; margin-bottom: 64px; }

  /* ── Grids ── */
  .ml-grid-2   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .ml-grid-3   { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
  .ml-grid-4   { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
  .ml-grid-aff { display: grid; grid-template-columns: 2fr 3fr; gap: 16px; }

  /* ── Hero chips ── */
  .ml-chips { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
  .ml-chip { min-width: 200px; flex: 1 1 200px; max-width: 260px; }

  /* ── Projection layout ── */
  .ml-proj-inner { display: flex; flex-wrap: wrap; gap: 48px; }
  .ml-proj-chart { flex: 1 1 280px; }
  .ml-proj-notes { flex: 0 0 240px; display: flex; flex-direction: column; gap: 16px; }

  /* ── CTA buttons ── */
  .ml-cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  /* ── Footer ── */
  .ml-footer-inner {
    max-width: 1000px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
  }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* ─────────────── TABLET (≤900px) ─────────────── */
  @media (max-width: 900px) {
    .ml-grid-4   { grid-template-columns: 1fr 1fr; }
    .ml-grid-3   { grid-template-columns: 1fr 1fr; }
    .ml-proj-notes { flex: 1 1 100%; }
  }

  /* ─────────────── MOBILE (≤640px) ─────────────── */
  @media (max-width: 640px) {
    .ml-nav-inner  { padding: 0 16px; }
    .ml-nav-auth   { display: none; }
    .ml-hamburger  { display: flex; }

    .ml-section      { padding: 72px 16px; }
    .ml-section-heading { margin-bottom: 40px; }

    .ml-grid-2   { grid-template-columns: 1fr; }
    .ml-grid-3   { grid-template-columns: 1fr; }
    .ml-grid-4   { grid-template-columns: 1fr; }
    .ml-grid-aff { grid-template-columns: 1fr; }

    .ml-chip     { max-width: 100%; }

    .ml-proj-inner { gap: 28px; }
    .ml-proj-notes { flex: 1 1 100%; }
  }
`;

// ─── Utility hooks ────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Base components ──────────────────────────────────────────────────────────
function GlassCard({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      borderRadius: 20, border: `1px solid ${T.border}`,
      background: T.surface, backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)", ...style,
    }}>
      {children}
    </div>
  );
}

function FadeIn({ children, delay = 0, style = {} }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function Tag({ children }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 14px", borderRadius: 999,
      border: `1px solid ${T.border}`, background: T.surface,
      color: T.textMuted, fontSize: 11, letterSpacing: "0.1em",
      textTransform: "uppercase", fontWeight: 500, marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function SectionHeading({ tag, title, sub }) {
  return (
    <div className="ml-section-heading">
      <Tag>{tag}</Tag>
      <h2 style={{
        fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
        fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800,
        color: T.text, marginBottom: 16, lineHeight: 1.05,
      }}>{title}</h2>
      {sub && <p style={{ color: T.textMuted, maxWidth: 480, margin: "0 auto", lineHeight: 1.7, fontSize: 16 }}>{sub}</p>}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 640) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: scrolled ? "12px 0" : "20px 0",
        background: scrolled || menuOpen ? "rgba(8,11,20,0.85)" : "transparent",
        backdropFilter: scrolled || menuOpen ? "blur(24px)" : "none",
        WebkitBackdropFilter: scrolled || menuOpen ? "blur(24px)" : "none",
        borderBottom: scrolled ? `1px solid ${T.border}` : "1px solid transparent",
        transition: "all 0.4s ease",
      }}>
        <div className="ml-nav-inner">
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg, ${T.emerald}, ${T.blue})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="white" />
                <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
              </svg>
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 600, color: T.text, letterSpacing: "-0.02em" }}>
              MoneyLens
            </span>
          </div>

          {/* Desktop auth */}
          <div className="ml-nav-auth">
            <button onClick={() => router.push('/login')} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 12,
              background: "transparent", border: `1px solid ${T.border}`,
              color: T.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
            >
              <LogIn size={14} /> Log in
            </button>
            <button onClick={() => router.push('/signup')} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 12,
              background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})`,
              border: "none", color: "#080B14", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <UserPlus size={14} /> Sign up free
            </button>
          </div>

          {/* Hamburger */}
          <button className="ml-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          style={{
            background: "transparent",
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            width: 38,
            height: 38,
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: T.text,
            flexShrink: 0,
            transition: "border-color 0.2s",
          }} 
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="ml-mobile-menu" onClick={() => setMenuOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
            <button onClick={() => { router.push('/login'); setMenuOpen(false); }} className="ml-mobile-btn"
              style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.text }}>
              <LogIn size={16} /> Log in
            </button>
            <button onClick={() => { router.push('/signup'); setMenuOpen(false); }} className="ml-mobile-btn"
              style={{ background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})`, border: "none", color: "#080B14" }}>
              <UserPlus size={16} /> Sign up free
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function InsightChip({ icon: Icon, color, label, value, sub, delay }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <GlassCard className="ml-chip" style={{
      padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12,
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.6s ease, transform 0.6s ease",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={15} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{value}</div>
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{sub}</div>
      </div>
    </GlassCard>
  );
}

function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);

  const anim = (delay) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  });

  return (
    <section style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "96px 20px 64px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "25%", left: "50%", transform: "translate(-50%,-50%)",
          width: "min(800px, 100vw)", height: "min(800px, 100vw)", borderRadius: "50%",
          background: `radial-gradient(circle, ${T.emerald}0F 0%, ${T.blue}08 50%, transparent 75%)`,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }} />
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center", position: "relative", width: "100%" }}>
        {/* Badge */}
        <div style={{
          ...anim(0),
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 999,
          border: `1px solid ${T.emerald}30`, background: `${T.emerald}0C`,
          color: T.emerald, fontSize: 12, fontWeight: 500, marginBottom: 28,
          flexWrap: "wrap", justifyContent: "center",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.emerald, animation: "pulse 2s infinite", flexShrink: 0 }} />
          AI-Powered Financial Intelligence · Now in Beta
        </div>

        <h1 style={{
          ...anim(150),
          fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
          fontSize: "clamp(40px, 10vw, 96px)", fontWeight: 900,
          color: T.text, lineHeight: 0.95, letterSpacing: "-0.03em", marginBottom: 24,
        }}>
          Your money,<br />
          <span style={{ background: `linear-gradient(90deg, ${T.emerald}, ${T.cyan}, ${T.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            decoded.
          </span>
        </h1>

        <p style={{
          ...anim(250),
          fontSize: "clamp(15px, 2.5vw, 18px)", color: T.textMuted,
          maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7,
        }}>
          MoneyLens goes beyond tracking — it understands your spending behavior,
          detects hidden patterns, and tells you exactly what your financial habits mean for your future.
        </p>

        <div style={{ ...anim(350), marginBottom: 56 }} className="ml-cta-row">
          <button onClick={() => router.push('/signup')} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "14px 28px", borderRadius: 16,
            background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})`,
            border: "none", color: "#080B14", fontWeight: 700, fontSize: 15,
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: `0 0 28px ${T.emerald}30`,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}
          >
            <Upload size={16} /> Upload Statement
          </button>
        </div>

        <div className="ml-chips">
          <InsightChip icon={Brain} color={T.violet} label="Behavior Insight" value="Weekend spend 2.4× higher" sub="vs your weekday average" delay={500} />
          <InsightChip icon={Target} color={T.emerald} label="Affordability" value="iPhone in ~9 weeks" sub="at current savings rate" delay={650} />
          <InsightChip icon={AlertTriangle} color={T.amber} label="Hidden Drain" value="₹2,340 in micro-payments" sub="draining flexibility quietly" delay={800} />
          <InsightChip icon={TrendingUp} color={T.rose} label="Projection" value="Savings gap in 4 months" sub="if shopping trend continues" delay={950} />
        </div>
      </div>
    </section>
  );
}

// ─── Why Section ──────────────────────────────────────────────────────────────
function WhySection() {
  const traditional = ["Shows your transactions", "Categorizes expenses", "Creates budget buckets", "Tells you what you spent", "Generates colorful pie charts"];
  const moneylens = ["Explains WHY you spend that way", "Detects hidden financial patterns", "Predicts future consequences", "Answers real affordability questions", "Builds smarter financial habits"];

  return (
    <section className="ml-section">
      <div className="ml-section-inner">
        <FadeIn><SectionHeading tag="Why MoneyLens" title="Not another expense tracker." sub="Traditional apps see your numbers. MoneyLens understands your behavior." /></FadeIn>
        <FadeIn delay={100}>
          <div className="ml-grid-2">
            <GlassCard style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.textFaint, flexShrink: 0 }} />
                <span style={{ color: T.textFaint, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Traditional Apps</span>
              </div>
              {traditional.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: T.textFaint, fontSize: 14 }}>
                  <XCircle size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </GlassCard>
            <GlassCard style={{ padding: 28, border: `1px solid ${T.emerald}25`, background: `linear-gradient(135deg, ${T.emerald}0A 0%, transparent 60%)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.emerald, boxShadow: `0 0 8px ${T.emerald}`, flexShrink: 0 }} />
                <span style={{ color: T.emerald, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>MoneyLens</span>
              </div>
              {moneylens.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                  <CheckCircle size={14} color={T.emerald} style={{ flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </GlassCard>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Behavior Section ─────────────────────────────────────────────────────────
const insightCards = [
  { emoji: "🌙", tag: "Timing Pattern", color: T.violet, insight: "Your weekend spending is 2.4× higher than weekdays.", detail: "Saturdays and Sundays account for 54% of your discretionary spend, mostly after 7 PM." },
  { emoji: "💧", tag: "Silent Drain", color: T.amber, insight: "Small recurring UPI payments are quietly draining your flexibility.", detail: "47 micro-transactions under ₹200 totalled ₹4,890 last month — invisible, but significant." },
  { emoji: "📅", tag: "Salary Trigger", color: T.blue, insight: "Your spending spikes 68% in the first 5 days after salary credit.", detail: "A common behavioral pattern — MoneyLens can help you build a buffer window." },
  { emoji: "🛵", tag: "Goal Impact", color: T.rose, insight: "Food delivery is delaying your iPhone goal by 6 weeks.", detail: "₹3,200/month in delivery fees vs. a one-time redirect could fund it by August." },
];

function BehaviorSection() {
  return (
    <section className="ml-section">
      <div className="ml-section-inner">
        <FadeIn><SectionHeading tag="Behavioral Intelligence" title={<>AI that reads between<br />the transactions.</>} sub="MoneyLens identifies behavioral patterns you didn't know existed — specific, personal, actionable." /></FadeIn>
        <div className="ml-grid-2">
          {insightCards.map((item, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div style={{
                borderRadius: 20, padding: 24,
                border: `1px solid ${item.color}20`,
                background: `linear-gradient(135deg, ${item.color}10 0%, transparent 60%)`,
                transition: "transform 0.3s", cursor: "default", height: "100%",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.015)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{item.emoji}</span>
                  <span style={{ fontSize: 11, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.tag}</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8, lineHeight: 1.4 }}>{item.insight}</p>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>{item.detail}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Affordability Section ────────────────────────────────────────────────────
const affordQ = [
  { q: "Can I buy an iPhone?", icon: "📱", answer: "Yes — in approximately 9 weeks", tradeoff: "If you pause food delivery and reduce weekend dining by 40%, you get there 3 weeks faster.", confidence: 78, label: "Affordability Score" },
  { q: "Can I afford this EMI?", icon: "🏦", answer: "Caution — it's tight", tradeoff: "₹4,200/month EMI would push your savings rate below 8%. Recommend waiting 6 weeks.", confidence: 41, label: "Risk Score" },
  { q: "Can I travel to Goa?", icon: "✈️", answer: "Yes — comfortably in 11 weeks", tradeoff: "At ₹2,000/month dedicated savings, your Goa fund hits ₹22,000 by late November.", confidence: 85, label: "Feasibility Score" },
];

function ConfBar({ value, color }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 3,
        background: `linear-gradient(90deg, ${color[0]}, ${color[1]})`,
        width: inView ? `${value}%` : "0%",
        transition: "width 1s ease",
      }} />
    </div>
  );
}

function AffordabilitySection() {
  const [active, setActive] = useState(0);
  const item = affordQ[active];
  const scoreColor = item.confidence > 70 ? [T.emerald, T.cyan] : item.confidence > 50 ? [T.amber, "#F59E0B"] : [T.rose, "#FB7185"];
  const scoreText = item.confidence > 70 ? T.emerald : item.confidence > 50 ? T.amber : T.rose;

  return (
    <section className="ml-section">
      <div className="ml-section-inner">
        <FadeIn><SectionHeading tag="Can I Afford This?" title={<>Real answers to<br />real money questions.</>} sub="Not a budget calculator. A financial thinking partner that gives you honest, context-aware answers." /></FadeIn>
        <FadeIn delay={100}>
          <div className="ml-grid-aff">
            {/* Question list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {affordQ.map((q, i) => (
                <button key={i} onClick={() => setActive(i)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", borderRadius: 14, textAlign: "left",
                  border: `1px solid ${active === i ? T.borderHover : T.border}`,
                  background: active === i ? "rgba(255,255,255,0.08)" : T.surface,
                  color: active === i ? T.text : T.textMuted,
                  fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                  width: "100%",
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{q.icon}</span>
                  {q.q}
                </button>
              ))}
            </div>
            {/* Answer card */}
            <GlassCard style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <span style={{ color: T.textMuted, fontSize: 13 }}>{item.q}</span>
              </div>
              <p style={{ fontSize: "clamp(16px, 3vw, 20px)", fontWeight: 700, color: scoreText, marginBottom: 14 }}>{item.answer}</p>
              <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.7, marginBottom: 24 }}>{item.tradeoff}</p>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: T.textFaint }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: T.textFaint }}>{item.confidence}%</span>
                </div>
                <ConfBar value={item.confidence} color={scoreColor} />
              </div>
            </GlassCard>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Projection Section ───────────────────────────────────────────────────────
function ProjectionSection() {
  const { ref, inView } = useInView();
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const savP = [12, 14, 13, 15, 11, 9];
  const shopP = [8, 9, 11, 13, 15, 17];
  const W = 480, H = 180, pX = 30, pY = 10;
  const tX = (i) => pX + (i / (months.length - 1)) * (W - pX * 2);
  const tY = (v) => H - pY - (v / 20) * (H - pY * 2);
  const pathD = (d) => d.map((v, i) => `${i === 0 ? "M" : "L"}${tX(i)},${tY(v)}`).join(" ");

  return (
    <section className="ml-section" ref={ref}>
      <div className="ml-section-inner">
        <FadeIn><SectionHeading tag="Future Projections" title={<>See where you're headed,<br />before you get there.</>} /></FadeIn>
        <FadeIn delay={100}>
          <GlassCard style={{ padding: "32px 28px" }}>
            <div className="ml-proj-inner">
              <div className="ml-proj-chart">
                <div style={{ fontSize: 11, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>6-Month Trajectory</div>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.emerald} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={T.emerald} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.rose} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={T.rose} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[5, 10, 15, 20].map(v => <line key={v} x1={pX} x2={W - pX} y1={tY(v)} y2={tY(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
                  <path d={`${pathD(savP)} L${tX(5)},${H - pY} L${tX(0)},${H - pY} Z`} fill="url(#sg)" />
                  <path d={`${pathD(shopP)} L${tX(5)},${H - pY} L${tX(0)},${H - pY} Z`} fill="url(#rg)" />
                  <path d={pathD(savP)} fill="none" stroke={T.emerald} strokeWidth="2"
                    style={{ strokeDasharray: inView ? "none" : 500, strokeDashoffset: inView ? 0 : 500, transition: "stroke-dashoffset 1.5s ease" }} />
                  <path d={pathD(shopP)} fill="none" stroke={T.rose} strokeWidth="2" strokeDasharray="4 3" />
                  <circle cx={tX(3)} cy={tY(14)} r="4" fill={T.amber} opacity="0.9" />
                  <text x={tX(3) + 8} y={tY(14) + 4} fill={T.amber} fontSize="9" opacity="0.9">Crossover point</text>
                  {months.map((m, i) => <text key={m} x={tX(i)} y={H - 1} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">{m}</text>)}
                </svg>
                <div style={{ display: "flex", gap: 24, marginTop: 12, flexWrap: "wrap" }}>
                  {[{ color: T.emerald, label: "Savings growth", dash: false }, { color: T.rose, label: "Shopping trend", dash: true }].map((l, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.textFaint }}>
                      <div style={{ width: 24, height: l.dash ? 0 : 2, background: l.dash ? "transparent" : l.color, opacity: 0.8, borderTop: l.dash ? `2px dashed ${l.color}` : "none" }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ml-proj-notes">
                {[
                  { color: T.rose, text: "If current shopping trend continues, it will exceed savings growth by October." },
                  { color: T.emerald, text: "Cutting discretionary spend by ₹4k/month accelerates your MBA goal by 3 months." },
                  { color: T.amber, text: "Salary trigger spending is your #1 momentum risk right now." },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 3, flexShrink: 0, borderRadius: 2, background: item.color }} />
                    <p style={{ fontSize: 13, color: item.color, lineHeight: 1.6, opacity: 0.85 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Goals Section ────────────────────────────────────────────────────────────
const goals = [
  { icon: "🏖️", name: "Goa Trip", target: 22000, saved: 14500, weeks: 11, note: "On track — keep your weekend spend steady.", ok: true },
  { icon: "💻", name: "MacBook", target: 90000, saved: 28000, weeks: 31, note: "Long runway — consider a ₹5k/month boost.", ok: true },
  { icon: "💍", name: "Jewelry for Mom", target: 15000, saved: 12800, weeks: 3, note: "Almost there — just one more month.", ok: true },
  { icon: "🎓", name: "MBA Fund", target: 300000, saved: 48000, weeks: 104, note: "Ambitious. Reduce dining out to cut 8 weeks.", ok: false },
];

function GoalCard({ g }) {
  const { ref, inView } = useInView(0.2);
  const pct = Math.round((g.saved / g.target) * 100);
  const accent = g.ok ? T.emerald : T.amber;
  return (
    <GlassCard ref={ref} style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{g.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{g.name}</div>
            <div style={{ fontSize: 12, color: T.textFaint }}>~{g.weeks} weeks away</div>
          </div>
        </div>
        <span style={{
          fontSize: 11, padding: "4px 10px", borderRadius: 8, flexShrink: 0,
          color: g.ok ? T.emerald : T.amber, background: g.ok ? `${T.emerald}12` : `${T.amber}12`,
        }}>{g.ok ? "On track" : "Review"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textFaint, marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
        <span>₹{g.saved.toLocaleString("en-IN")} saved</span>
        <span>{pct}% · ₹{g.target.toLocaleString("en-IN")}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 10 }}>
        <div style={{
          height: "100%", borderRadius: 3,
          background: `linear-gradient(90deg, ${accent}, ${g.ok ? T.cyan : "#F59E0B"})`,
          width: inView ? `${pct}%` : "0%", transition: "width 1s ease",
        }} />
      </div>
      <p style={{ fontSize: 12, color: T.textFaint, lineHeight: 1.5 }}>{g.note}</p>
    </GlassCard>
  );
}

function GoalsSection() {
  return (
    <section className="ml-section">
      <div className="ml-section-inner">
        <FadeIn><SectionHeading tag="Goals & Savings" title="Goals with honest timelines." sub="MoneyLens won't tell you what you want to hear. It tells you what's actually achievable — and how to get there." /></FadeIn>
        <div className="ml-grid-2">
          {goals.map((g, i) => (
            <FadeIn key={i} delay={i * 80}><GoalCard g={g} /></FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
const steps = [
  { num: "01", Icon: FileText, title: "Upload your statement", desc: "Drop your bank or UPI statement. PDF, CSV — we handle it securely." },
  { num: "02", Icon: Brain, title: "AI analyzes your behavior", desc: "MoneyLens scans patterns, habits, risks, and trajectories — not just totals." },
  { num: "03", Icon: Sparkles, title: "Get financial clarity", desc: "Personalized insights, affordability answers, and an honest picture of where you're headed." },
];

function HowItWorksSection() {
  return (
    <section className="ml-section">
      <div className="ml-section-inner">
        <FadeIn><SectionHeading tag="How It Works" title="Three steps to financial clarity." /></FadeIn>
        <div className="ml-grid-3">
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px",
                  background: T.surface, border: `1px solid ${T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <s.Icon size={24} color={T.textMuted} />
                </div>
                <div style={{ fontSize: 11, color: T.textFaint, fontFamily: "monospace", marginBottom: 4 }}>{s.num}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trust Section ────────────────────────────────────────────────────────────
const trustPoints = [
  { Icon: Lock, title: "End-to-end encrypted", desc: "Your statement is encrypted in transit and at rest. We never store raw data." },
  { Icon: XCircle, title: "No bank credentials", desc: "You upload a PDF — never your login, password, or OTP." },
  { Icon: Trash2, title: "Auto-deleted after analysis", desc: "Statement files are purged within 24 hours of processing." },
  { Icon: Shield, title: "Privacy-first architecture", desc: "No selling, no sharing, no advertising use of your financial data. Ever." },
];

function TrustSection() {
  return (
    <section className="ml-section" style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.012)" }}>
      <div className="ml-section-inner">
        <FadeIn><SectionHeading tag="Trust & Privacy" title="Your data is yours." sub="We understand that uploading financial data requires deep trust. We designed MoneyLens to earn it." /></FadeIn>
        <div className="ml-grid-4">
          {trustPoints.map((t, i) => (
            <FadeIn key={i} delay={i * 80}>
              <GlassCard style={{ padding: 22, textAlign: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, margin: "0 auto 14px",
                  background: `${T.emerald}12`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <t.Icon size={20} color={T.emerald} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: T.textFaint, lineHeight: 1.6 }}>{t.desc}</div>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  const router = useRouter();
  return (
    <section className="ml-section" style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(700px, 100vw)", height: "min(700px, 100vw)", borderRadius: "50%",
        background: `radial-gradient(circle, ${T.emerald}0A 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <FadeIn>
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          <h2 style={{
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
            fontSize: "clamp(32px, 7vw, 72px)", fontWeight: 900,
            color: T.text, lineHeight: 1.05, marginBottom: 20,
          }}>
            Your financial life<br />
            <span style={{ background: `linear-gradient(90deg, ${T.emerald}, ${T.cyan}, ${T.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              already tells a story.
            </span>
          </h2>
          <p style={{ fontSize: "clamp(14px, 2.5vw, 17px)", color: T.textMuted, marginBottom: 40, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
            MoneyLens helps you read it — before your money habits write a future you didn't choose.
          </p>
          <div className="ml-cta-row">
            <button onClick={() => router.push('/signup')} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "16px 32px", borderRadius: 18,
              background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})`,
              border: "none", color: "#080B14", fontWeight: 800, fontSize: 16,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: `0 0 40px ${T.emerald}25`,
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Upload size={17} /> Upload Statement — It's Free
            </button>
          </div>
          <p style={{ fontSize: 12, color: T.textFaint, marginTop: 20 }}>No account required · Encrypted · Auto-deleted after analysis</p>
        </div>
      </FadeIn>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, padding: "40px 24px" }}>
      <div className="ml-footer-inner">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${T.emerald}, ${T.cyan})`, opacity: 0.8 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>MoneyLens</span>
        </div>
        <div style={{ fontSize: 13, color: T.textFaint }}>© 2026 MoneyLens. All rights reserved.</div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif", color: T.text, WebkitFontSmoothing: "antialiased" }}>
        <Navbar />
        <HeroSection />
        <WhySection />
        <BehaviorSection />
        <AffordabilitySection />
        <ProjectionSection />
        <GoalsSection />
        <HowItWorksSection />
        <TrustSection />
        <FinalCTA />
        <Footer />
      </div>
    </>
  );
}
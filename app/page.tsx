"use client";

import { useState, useEffect, useRef } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip,
  XAxis, YAxis, BarChart, Bar,
} from "recharts";

// ─── DATA ────────────────────────────────────────────────────────────────────

const savingsGrowth = [
  { month: "Jan", actual: 2800, withML: 5600 },
  { month: "Feb", actual: 3100, withML: 8900 },
  { month: "Mar", actual: 2600, withML: 12400 },
  { month: "Apr", actual: 3800, withML: 16800 },
  { month: "May", actual: 4200, withML: 22300 },
  { month: "Jun", actual: 3500, withML: 28700 },
];

const spendingCategories = [
  { name: "Food & Dining", value: 18400, fill: "#E8622A", pct: 31 },
  { name: "Shopping", value: 12800, fill: "#9B6FD8", pct: 21 },
  { name: "Transport", value: 8200, fill: "#3A9FD8", pct: 14 },
  { name: "Subscriptions", value: 5100, fill: "#D4A017", pct: 9 },
  { name: "Entertainment", value: 4800, fill: "#2EB87A", pct: 8 },
];

const chatMessages = [
  { role: "user", text: "What if I saved ₹3,000/month from food delivery?" },
  {
    role: "ai",
    text: "Great question. ₹3,000/month in a Nifty 50 SIP at 12% p.a. compounds to:",
    cards: ["₹2.4L in 5 yrs", "₹6.2L in 10 yrs", "₹21L in 20 yrs"],
  },
  { role: "user", text: "Which subscriptions should I cancel?" },
  {
    role: "ai",
    text: "I found 4 overlapping subscriptions worth ₹1,840/month:\n• Netflix + Prime (you only use Prime)\n• 2 duplicate cloud storage plans\nCancelling saves ₹22,080/year.",
    cards: [],
  },
];

const testimonials = [
  {
    name: "Rahul M.", city: "Bengaluru", role: "Software Engineer",
    quote: "Found ₹6,200/month leaking into forgotten subscriptions and UPI impulse buys. MoneyLens paid for itself on day one.",
    saved: "₹74K saved", avatar: "RM", color: "#E8622A",
  },
  {
    name: "Priya S.", city: "Delhi", role: "Product Manager",
    quote: "The AI chatbot gave me a personalised 7-year investment roadmap. No financial advisor has ever done that for me.",
    saved: "₹1.2L projected", avatar: "PS", color: "#9B6FD8",
  },
  {
    name: "Arjun R.", city: "Hyderabad", role: "CA",
    quote: "I track clients' money all day but never my own. MoneyLens showed I was spending ₹9K/month on food without realising it.",
    saved: "₹41K in Q1", avatar: "AR", color: "#2EB87A",
  },
];

// ─── HOOKS ───────────────────────────────────────────────────────────────────

function useIntersection(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useCounter(target, visible, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target, duration]);
  return count;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useIntersection();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function StatCounter({ value, prefix = "", suffix = "", label }) {
  const [ref, visible] = useIntersection();
  const count = useCounter(value, visible);
  const fmt = (n) => {
    if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };
  return (
    <div ref={ref} className="text-center">
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#fff", lineHeight: 1 }}>
        {prefix}<span style={{ color: "#E8622A" }}>{fmt(count)}</span>{suffix}
      </div>
      <p style={{ fontSize: "0.7rem", color: "#71717a", marginTop: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function SIPCalculator() {
  const [monthly, setMonthly] = useState(3000);
  const [years, setYears] = useState(10);
  const rate = 0.12;
  const months = years * 12;
  const mr = rate / 12;
  const fv = monthly * ((Math.pow(1 + mr, months) - 1) / mr) * (1 + mr);
  const invested = monthly * months;
  const fmt = (n) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
  };
  const data = Array.from({ length: years }, (_, i) => {
    const m = (i + 1) * 12;
    return {
      year: `Y${i + 1}`,
      value: Math.round(monthly * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr)),
      invested: monthly * m,
    };
  });

  return (
    <div style={{ background: "#111113", border: "1px solid #222226", borderRadius: 24, padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.75rem" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(232,98,42,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌱</div>
        <div>
          <p style={{ fontSize: "0.65rem", color: "#52525b", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>Live SIP Projection</p>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.25rem", color: "#fff", margin: 0 }}>What could you build?</h3>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Monthly savings", value: fmt(monthly), min: 500, max: 25000, step: 500, val: monthly, set: setMonthly },
          { label: "Time horizon", value: `${years} years`, min: 1, max: 30, step: 1, val: years, set: setYears },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: "0.75rem", color: "#71717a" }}>{s.label}</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E8622A" }}>{s.value}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
              onChange={e => s.set(+e.target.value)}
              style={{ width: "100%", accentColor: "#E8622A" }} />
          </div>
        ))}
      </div>

      <div style={{ height: 160, marginBottom: "1.5rem" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fvG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8622A" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#E8622A" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="invG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3A9FD8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3A9FD8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
            <XAxis dataKey="year" stroke="#3f3f46" tick={{ fontSize: 10, fill: "#52525b" }} />
            <YAxis stroke="#3f3f46" tick={{ fontSize: 10, fill: "#52525b" }}
              tickFormatter={v => v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${v}`} />
            <Tooltip contentStyle={{ background: "#111113", border: "1px solid #222226", borderRadius: 10, fontSize: 12 }}
              formatter={(v, n) => [fmt(v), n === "value" ? "Future Value" : "Invested"]} />
            <Area type="monotone" dataKey="invested" stroke="#3A9FD8" fill="url(#invG)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="value" stroke="#E8622A" fill="url(#fvG)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Invested", val: fmt(invested), color: "#3A9FD8" },
          { label: "Future value", val: fmt(fv), color: "#E8622A" },
          { label: "Wealth gain", val: fmt(fv - invested), color: "#2EB87A" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#0e0e10", borderRadius: 14, padding: "0.85rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.65rem", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.1rem", color: s.color, margin: 0 }}>{s.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIChatPreview() {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (step >= chatMessages.length) return;
    const delay = chatMessages[step].role === "ai" ? 800 : 400;
    const timer = setTimeout(() => {
      if (chatMessages[step].role === "ai") {
        setTyping(true);
        setTimeout(() => { setTyping(false); setStep(s => s + 1); }, 1100);
      } else { setStep(s => s + 1); }
    }, step === 0 ? 500 : 900);
    return () => clearTimeout(timer);
  }, [step]);
  const shown = chatMessages.slice(0, step);

  return (
    <div style={{ background: "#111113", border: "1px solid #222226", borderRadius: 24, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 1.5rem", borderBottom: "1px solid #1a1a1e", background: "#0d0d0f" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #E8622A, #D4A017)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 800, fontSize: 13, fontFamily: "'Instrument Serif', serif" }}>ML</div>
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, background: "#2EB87A", borderRadius: "50%", border: "2px solid #0d0d0f" }} />
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#fff", margin: 0 }}>MoneyLens AI</p>
          <p style={{ fontSize: "0.7rem", color: "#2EB87A", margin: 0 }}>Online · Analysing your statement</p>
        </div>
      </div>

      <div style={{ padding: "1.5rem", minHeight: 260, display: "flex", flexDirection: "column", gap: 12 }}>
        {shown.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "0.65rem 1rem", fontSize: "0.8rem", lineHeight: 1.5,
              background: msg.role === "user" ? "#E8622A" : "#1a1a1e",
              color: msg.role === "user" ? "#fff" : "#d4d4d8",
              animation: "fadeUp 0.3s ease forwards",
            }}>
              <p style={{ whiteSpace: "pre-line", margin: 0 }}>{msg.text}</p>
              {msg.cards && msg.cards.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {msg.cards.map((c, j) => (
                    <span key={j} style={{ background: "rgba(232,98,42,0.18)", color: "#E8622A", border: "1px solid rgba(232,98,42,0.3)", borderRadius: 10, padding: "3px 10px", fontSize: "0.7rem", fontWeight: 700 }}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", gap: 4, padding: "0.7rem 1rem", background: "#1a1a1e", borderRadius: "18px 18px 18px 4px", width: "fit-content", alignItems: "center" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 7, height: 7, background: "#E8622A", borderRadius: "50%", animation: `chatBounce 1s ${i*0.2}s infinite` }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "0 1.5rem 1.5rem" }}>
        <div style={{ background: "#1a1a1e", borderRadius: 16, display: "flex", alignItems: "center", gap: 10, padding: "0.6rem 1rem" }}>
          <input readOnly placeholder="Ask about your spending…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.8rem", color: "#71717a" }} />
          <button style={{ width: 30, height: 30, background: "#E8622A", borderRadius: 10, border: "none", cursor: "pointer", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {["Cut food spend", "Best SIP for me", "Subscription audit"].map((s, i) => (
            <button key={i} style={{ fontSize: "0.7rem", background: "transparent", border: "1px solid #222226", borderRadius: 10, padding: "5px 10px", color: "#71717a", cursor: "pointer" }}>{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function MoneyLensLanding() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ background: "#0a0a0c", color: "#e4e4e7", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Cabinet+Grotesk:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body, html { font-family: 'Cabinet Grotesk', system-ui, sans-serif !important; }

        .ml-display {
          font-family: 'Instrument Serif', Georgia, serif !important;
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: -0.02em;
        }
        .ml-mono {
          font-family: 'Geist Mono', 'Courier New', monospace;
        }
        .ml-label {
          font-family: 'Cabinet Grotesk', system-ui, sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #52525b;
        }

        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes chatBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes slowSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes pulseDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.5} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }

        .ml-float { animation: float 4.5s ease-in-out infinite; }
        .ml-spin { animation: slowSpin 25s linear infinite; }
        .ml-marquee { animation: marquee 35s linear infinite; }

        .ml-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 0.875rem 2rem;
          background: #E8622A;
          color: #fff;
          font-family: 'Cabinet Grotesk', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          border: none;
          border-radius: 100px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          letter-spacing: 0.01em;
        }
        .ml-btn-primary:hover { background: #f0733c; transform: translateY(-1px); }
        .ml-btn-primary:active { transform: scale(0.98); }

        .ml-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 0.875rem 2rem;
          background: transparent;
          color: #a1a1aa;
          font-family: 'Cabinet Grotesk', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          border: 1px solid #27272a;
          border-radius: 100px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .ml-btn-ghost:hover { border-color: #52525b; color: #e4e4e7; }

        .ml-card {
          background: #111113;
          border: 1px solid #1e1e22;
          border-radius: 20px;
          transition: border-color 0.2s;
        }
        .ml-card:hover { border-color: #2a2a2e; }

        .ml-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(232,98,42,0.08);
          border: 1px solid rgba(232,98,42,0.18);
          color: #E8622A;
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 100px;
        }

        .hero-grid-bg {
          background-image:
            linear-gradient(rgba(232,98,42,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,98,42,0.03) 1px, transparent 1px);
          background-size: 80px 80px;
        }

        .text-shimmer {
          background: linear-gradient(90deg, #E8622A, #D4A017, #E8622A);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .noise-overlay {
          position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.25;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
        }

        input[type=range] { cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #E8622A; border-radius: 50%; }
        input[type=range]::-webkit-slider-runnable-track { height: 3px; border-radius: 2px; background: rgba(232,98,42,0.2); }

        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .chat-sip-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .testimonial-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="noise-overlay" />

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        transition: "all 0.4s",
        background: scrolled ? "rgba(10,10,12,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid #1a1a1e" : "1px solid transparent",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #E8622A, #D4A017)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: 18, color: "#000", fontWeight: 400, position: "relative" }}>
              M
              <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, background: "#2EB87A", borderRadius: "50%", animation: "pulseDot 2s infinite" }} />
            </div>
            <span style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em", color: "#fff" }}>MoneyLens</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "2rem", fontSize: "0.85rem", fontWeight: 600, color: "#71717a" }}>
            {[["features", "Features"], ["how", "How it works"], ["pricing", "Pricing"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = "#e4e4e7"} onMouseLeave={e => e.target.style.color = "#71717a"}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a", fontSize: "0.85rem", fontWeight: 600, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Log in</button>
            <button className="ml-btn-primary" onClick={() => scrollTo("upload")} style={{ padding: "0.6rem 1.4rem", fontSize: "0.8rem" }}>
              Try free →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-grid-bg" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 100, paddingBottom: 80, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "30%", left: "20%", width: 600, height: 600, background: "radial-gradient(circle, rgba(232,98,42,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 400, height: 400, background: "radial-gradient(circle, rgba(155,111,216,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem", width: "100%" }}>
          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: "5rem", alignItems: "center" }}>
            {/* LEFT */}
            <div>
              <div style={{ marginBottom: "1.75rem" }}>
                <span className="ml-tag">
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2EB87A", display: "inline-block" }} />
                  India's smartest expense analyser
                </span>
              </div>

              <h1 className="ml-display" style={{ fontSize: "clamp(3.5rem, 7vw, 6rem)", color: "#fff", marginBottom: "1.5rem" }}>
                Know where<br />
                every <span className="text-shimmer">rupee</span><br />
                goes.
              </h1>

              <p style={{ fontSize: "1.1rem", color: "#71717a", lineHeight: 1.7, maxWidth: 420, marginBottom: "2rem", fontWeight: 400 }}>
                Upload your bank statement. Get AI-powered spending breakdowns,
                personalised saving ideas, and wealth projections in under 30 seconds.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "2rem" }}>
                <button className="ml-btn-primary" onClick={() => scrollTo("upload")}>Analyse my statement →</button>
                <button className="ml-btn-ghost" onClick={() => scrollTo("how")}>See how it works</button>
              </div>

              <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.75rem", color: "#52525b" }}>
                {["256-bit encrypted", "No account needed", "All Indian banks"].map((t, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ color: "#2EB87A", fontSize: "0.6rem" }}>●</span> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT – Dashboard */}
            <div style={{ position: "relative" }}>
              {/* Floating insight badge */}
              <div className="ml-float" style={{ position: "absolute", top: -20, left: -20, zIndex: 20, background: "#111113", border: "1px solid #222226", borderRadius: 16, padding: "0.75rem 1.1rem", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(46,184,122,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💡</div>
                <div>
                  <p style={{ fontSize: "0.65rem", color: "#52525b", marginBottom: 2 }}>AI Insight</p>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>Cancel 3 unused subs · Save ₹1,840/mo</p>
                </div>
              </div>

              <div style={{ background: "#111113", border: "1px solid #1e1e22", borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
                <div style={{ background: "#0d0d0f", padding: "1.5rem", borderBottom: "1px solid #1a1a1e", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <p className="ml-label">March 2026 Analysis</p>
                    <p className="ml-display" style={{ fontSize: "2.25rem", color: "#fff", marginTop: 4 }}>₹1,84,720 <span style={{ fontSize: "1rem", fontFamily: "'Cabinet Grotesk', sans-serif", color: "#52525b" }}>spent</span></p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.7rem", color: "#52525b" }}>Potential monthly savings</p>
                    <p className="ml-display" style={{ fontSize: "1.5rem", color: "#2EB87A" }}>+₹31,200</p>
                  </div>
                </div>

                <div style={{ padding: "1.5rem" }}>
                  <p className="ml-label" style={{ marginBottom: 12 }}>Savings: Actual vs. With MoneyLens</p>
                  <div style={{ height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={savingsGrowth}>
                        <defs>
                          <linearGradient id="mlG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#E8622A" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#E8622A" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="actG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3A9FD8" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3A9FD8" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                        <XAxis dataKey="month" stroke="#2a2a2e" tick={{ fontSize: 10, fill: "#52525b" }} />
                        <YAxis stroke="#2a2a2e" tick={{ fontSize: 10, fill: "#52525b" }} tickFormatter={v => `₹${v/1000}K`} />
                        <Tooltip contentStyle={{ background: "#111113", border: "1px solid #222226", borderRadius: 10, fontSize: 12 }}
                          formatter={(v, n) => [`₹${v.toLocaleString("en-IN")}`, n === "withML" ? "With MoneyLens" : "Actual"]} />
                        <Area type="monotone" dataKey="actual" stroke="#3A9FD8" fill="url(#actG)" strokeWidth={1.5} />
                        <Area type="monotone" dataKey="withML" stroke="#E8622A" fill="url(#mlG)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="ml-label" style={{ marginTop: "1.25rem", marginBottom: 10 }}>Top spending categories</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {spendingCategories.map((cat, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: cat.fill, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.8rem", color: "#a1a1aa", flex: 1 }}>{cat.name}</span>
                        <div style={{ width: 80, background: "#1a1a1e", borderRadius: 4, height: 4 }}>
                          <div style={{ width: `${cat.pct}%`, background: cat.fill, height: "100%", borderRadius: 4 }} />
                        </div>
                        <span className="ml-mono" style={{ fontSize: "0.75rem", color: "#e4e4e7", width: 56, textAlign: "right" }}>₹{(cat.value/1000).toFixed(1)}K</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Streak badge */}
              <div style={{ position: "absolute", bottom: -16, right: -16, zIndex: 20, background: "linear-gradient(135deg, #D4A017, #E8622A)", borderRadius: 16, padding: "0.85rem 1rem", textAlign: "center", boxShadow: "0 16px 40px rgba(232,98,42,0.3)" }}>
                <div style={{ fontSize: 24, lineHeight: 1 }}>🔥</div>
                <div className="ml-display" style={{ fontSize: "1.6rem", color: "#000", lineHeight: 1 }}>14</div>
                <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#000", letterSpacing: "0.1em", textTransform: "uppercase" }}>Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BANK MARQUEE ── */}
      <div style={{ borderTop: "1px solid #1a1a1e", borderBottom: "1px solid #1a1a1e", padding: "1rem 0", overflow: "hidden", background: "#0d0d0f" }}>
        <div className="ml-marquee" style={{ display: "flex", whiteSpace: "nowrap" }}>
          {Array(2).fill(null).map((_, ri) => (
            <div key={ri} style={{ display: "flex", gap: "3rem", alignItems: "center", marginRight: "3rem" }}>
              {["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Kotak", "Yes Bank", "IndusInd", "IDFC First", "Federal Bank", "BOB", "PNB", "Canara Bank"].map((b, i) => (
                <span key={i} className="ml-label" style={{ fontSize: "0.6rem" }}>
                  {b} <span style={{ color: "#E8622A", margin: "0 1rem" }}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{ padding: "5rem 2rem", borderBottom: "1px solid #1a1a1e" }}>
        <div className="stats-grid" style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "3rem" }}>
          <StatCounter value={4200000} prefix="₹" suffix="+" label="Savings identified" />
          <StatCounter value={18000} suffix="+" label="Statements analysed" />
          <StatCounter value={94} suffix="%" label="Saved in month 1" />
          <StatCounter value={6200} prefix="₹" suffix="/mo" label="Average leaks found" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: "6rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <span className="ml-tag" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>Process</span>
              <h2 className="ml-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#fff", marginTop: "1rem" }}>
                30 seconds to<br /><span className="text-shimmer">total clarity.</span>
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
            {[
              { num: "01", icon: "📤", title: "Upload your statement", desc: "Drag-drop your PDF, CSV, or Excel from HDFC, SBI, ICICI, Axis and 20+ banks. Encrypted end-to-end.", color: "#E8622A" },
              { num: "02", icon: "🧠", title: "AI does the heavy lifting", desc: "Our model categorises every transaction, spots patterns, detects leaks, and generates personalised saving strategies.", color: "#9B6FD8" },
              { num: "03", icon: "📈", title: "See your wealth potential", desc: "Charts, AI insights, investment projections, and a personal finance coach — all in one dashboard.", color: "#2EB87A" },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="ml-card" style={{ padding: "2rem", position: "relative", overflow: "hidden", height: "100%" }}>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "5rem", color: "#1a1a1e", position: "absolute", top: 12, right: 16, lineHeight: 1, userSelect: "none" }}>{step.num}</div>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${step.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: "1.25rem", position: "relative", zIndex: 1 }}>{step.icon}</div>
                  <h3 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#fff", marginBottom: "0.65rem" }}>{step.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#71717a", lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "6rem 2rem", background: "#0d0d0f", borderTop: "1px solid #1a1a1e", borderBottom: "1px solid #1a1a1e" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <span className="ml-tag" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>Features</span>
              <h2 className="ml-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#fff", marginTop: "1rem" }}>
                Not just charts.<br /><span className="text-shimmer">Actual results.</span>
              </h2>
            </div>
          </Reveal>

          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: "#1a1a1e", borderRadius: 24, overflow: "hidden" }}>
            {[
              { icon: "🔍", title: "Deep Spend Analysis", desc: "Auto-categorisation across 40+ categories. Trend detection. Week-over-week comparison. Hidden leak finder.", badge: "Core", color: "#E8622A" },
              { icon: "💡", title: "Smart Saving Ideas", desc: "MoneyLens finds your specific leaks: unused subscriptions, duplicate payments, impulse UPI spends — with exact ₹ amounts.", badge: "Unique", color: "#D4A017" },
              { icon: "🌱", title: "Wealth Projections", desc: "See what ₹2,000 saved from Zomato becomes in 5, 10, 20 years via SIP. Real mutual fund benchmarks.", badge: "Core", color: "#2EB87A" },
              { icon: "🤖", title: "AI Finance Coach", desc: "Ask anything. \"What if I cut dining by 40%?\" — get projections, alternatives, and a step-by-step savings plan.", badge: "Unique", color: "#3A9FD8" },
              { icon: "🔥", title: "Streaks & Goals", desc: "Build saving habits with daily streaks. Set custom goals — vacation, MacBook, emergency fund. Compete with friends.", badge: "Fun", color: "#9B6FD8" },
              { icon: "🔒", title: "Bank-Grade Privacy", desc: "Your data is encrypted, never sold, and deleted after analysis. DPDP Act compliant. Zero data on our servers.", badge: "Security", color: "#71717a" },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div style={{ background: "#0a0a0c", padding: "2rem", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#0f0f12"}
                  onMouseLeave={e => e.currentTarget.style.background = "#0a0a0c"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: `${f.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{f.icon}</div>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 8, border: `1px solid ${f.color}30`, color: f.color, background: `${f.color}08` }}>{f.badge}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#e4e4e7", marginBottom: "0.6rem" }}>{f.title}</h3>
                  <p style={{ fontSize: "0.82rem", color: "#52525b", lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPLOAD ── */}
      <section id="upload" style={{ padding: "6rem 2rem" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <span className="ml-tag" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>Get Started</span>
              <h2 className="ml-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#fff", marginTop: "1rem" }}>Upload your statement</h2>
              <p style={{ color: "#52525b", marginTop: "0.75rem", fontSize: "0.9rem" }}>Free for your first 3 statements. No card required.</p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div style={{ border: "1.5px dashed #222226", borderRadius: 24, padding: "4rem 2rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: "rgba(232,98,42,0.02)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(232,98,42,0.4)"; e.currentTarget.style.background = "rgba(232,98,42,0.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#222226"; e.currentTarget.style.background = "rgba(232,98,42,0.02)"; }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(232,98,42,0.08)", border: "1px solid rgba(232,98,42,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 1.5rem" }}>📄</div>
              <h3 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#fff", marginBottom: "0.5rem" }}>Drop your bank statement here</h3>
              <p style={{ color: "#52525b", fontSize: "0.85rem", marginBottom: "1.75rem" }}>PDF, CSV, or Excel · Max 10MB · Encrypted instantly</p>
              <button className="ml-btn-primary">Choose file to upload</button>
              <p style={{ fontSize: "0.7rem", color: "#3f3f46", marginTop: "1.5rem" }}>HDFC · SBI · ICICI · Axis · Kotak · Yes Bank · IndusInd · IDFC First · BOB · PNB + more</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── AI CHAT + SIP ── */}
      <section style={{ padding: "6rem 2rem", background: "#0d0d0f", borderTop: "1px solid #1a1a1e", borderBottom: "1px solid #1a1a1e" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <span className="ml-tag" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>Intelligence</span>
              <h2 className="ml-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#fff", marginTop: "1rem" }}>
                Your personal<br /><span className="text-shimmer">wealth advisor.</span>
              </h2>
              <p style={{ color: "#52525b", marginTop: "1rem", maxWidth: 400, margin: "1rem auto 0" }}>Ask anything about your money. Get real answers with numbers, not vague tips.</p>
            </div>
          </Reveal>

          <div className="chat-sip-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <Reveal delay={50}><AIChatPreview /></Reveal>
            <Reveal delay={150}><SIPCalculator /></Reveal>
          </div>
        </div>
      </section>

      {/* ── WHAT IF TIMELINE ── */}
      <section style={{ padding: "6rem 2rem" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <span className="ml-tag" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>The Realisation</span>
              <h2 className="ml-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#fff", marginTop: "1rem" }}>₹2,800/month<br />on food delivery</h2>
              <p style={{ color: "#52525b", marginTop: "0.75rem" }}>What if you redirected that into a SIP?</p>
            </div>
          </Reveal>

          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 20, top: 28, bottom: 28, width: 1, background: "linear-gradient(to bottom, #E8622A, #D4A017, #2EB87A)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {[
                { time: "Right now", title: "₹2,800 spent this month", sub: "33,600 calories and zero wealth gained.", color: "#E8622A" },
                { time: "After 1 year", title: "₹33,600 gone", sub: "That's a weekend trip to Goa + ₹5K emergency fund.", color: "#D4A017" },
                { time: "After 5 years", title: "₹2.4 Lakh opportunity cost", sub: "Invested in Nifty 50 that would be ₹2.4L → ₹4.2L.", color: "#F07230" },
                { time: "After 10 years", title: "₹8.7 Lakh potential", sub: "A down payment. An international holiday. An emergency corpus.", color: "#2EB87A" },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", paddingLeft: "3.5rem", position: "relative" }}>
                    <div style={{ position: "absolute", left: 12, width: 18, height: 18, borderRadius: "50%", border: `2px solid ${item.color}`, background: "#0a0a0c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }} />
                    <div className="ml-card" style={{ padding: "1.25rem 1.5rem", flex: 1 }}>
                      <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: item.color, marginBottom: 6 }}>{item.time}</p>
                      <h3 style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#fff", marginBottom: 4 }}>{item.title}</h3>
                      <p style={{ fontSize: "0.82rem", color: "#71717a" }}>{item.sub}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROJECTIONS ── */}
      <section id="projections" style={{ padding: "6rem 2rem", background: "#0d0d0f", borderTop: "1px solid #1a1a1e", borderBottom: "1px solid #1a1a1e" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <span className="ml-tag" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>Projections</span>
              <h2 className="ml-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#fff", marginTop: "1rem" }}>
                From spending report<br /><span className="text-shimmer">to investment plan.</span>
              </h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="ml-card" style={{ padding: "2.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                {[
                  { label: "You spend on food delivery", val: "₹4,200/mo", note: "Based on 847 users" },
                  { label: "Average we help cut by", val: "60%", note: "Without feeling deprived" },
                  { label: "That's a potential SIP of", val: "₹2,520/mo", note: "Starting next month" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#0d0d0f", borderRadius: 14, padding: "1.25rem", textAlign: "center" }}>
                    <p className="ml-label" style={{ marginBottom: 8 }}>{s.label}</p>
                    <p className="ml-display" style={{ fontSize: "2rem", color: "#E8622A" }}>{s.val}</p>
                    <p style={{ fontSize: "0.7rem", color: "#3f3f46", marginTop: 4 }}>{s.note}</p>
                  </div>
                ))}
              </div>

              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { year: "5 Yrs", invested: 151200, returns: 220000 },
                    { year: "10 Yrs", invested: 302400, returns: 587000 },
                    { year: "15 Yrs", invested: 453600, returns: 1260000 },
                    { year: "20 Yrs", invested: 604800, returns: 2540000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                    <XAxis dataKey="year" stroke="#2a2a2e" tick={{ fontSize: 12, fill: "#52525b" }} />
                    <YAxis stroke="#2a2a2e" tick={{ fontSize: 11, fill: "#52525b" }} tickFormatter={v => v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : String(v)} />
                    <Tooltip contentStyle={{ background: "#111113", border: "1px solid #222226", borderRadius: 10, fontSize: 12 }}
                      formatter={(v, n) => [`₹${v.toLocaleString("en-IN")}`, n === "returns" ? "Future Value" : "Invested"]} />
                    <Bar dataKey="invested" fill="#3A9FD8" fillOpacity={0.4} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="returns" fill="#E8622A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p style={{ textAlign: "center", fontSize: "0.7rem", color: "#3f3f46", marginTop: "1rem" }}>₹2,520/month SIP · 12% p.a. CAGR (Nifty 50 historical) · Compounded monthly</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "6rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <span className="ml-tag" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>Real Users</span>
              <h2 className="ml-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#fff", marginTop: "1rem" }}>Real money saved.</h2>
            </div>
          </Reveal>

          <div className="testimonial-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="ml-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "3.5rem", color: "rgba(232,98,42,0.15)", lineHeight: 1, marginBottom: "0.75rem" }}>"</div>
                  <p style={{ fontSize: "0.88rem", color: "#a1a1aa", lineHeight: 1.7, flex: 1, marginBottom: "1.5rem" }}>{t.quote}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, color: "#fff" }}>{t.avatar}</div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>{t.name}</p>
                        <p style={{ fontSize: "0.7rem", color: "#52525b" }}>{t.role} · {t.city}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#2EB87A", background: "rgba(46,184,122,0.08)", border: "1px solid rgba(46,184,122,0.18)", borderRadius: 10, padding: "4px 10px" }}>{t.saved}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "6rem 2rem", background: "#0d0d0f", borderTop: "1px solid #1a1a1e", borderBottom: "1px solid #1a1a1e" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <span className="ml-tag" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>Pricing</span>
              <h2 className="ml-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#fff", marginTop: "1rem" }}>Simple. Fair. Worth it.</h2>
            </div>
          </Reveal>

          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
            {[
              {
                name: "Starter", price: "Free", period: "forever",
                desc: "Try it risk-free",
                features: ["3 statement analyses", "Spending charts", "Category breakdown", "Basic saving tips"],
                cta: "Start free", highlight: false,
              },
              {
                name: "Pro", price: "₹199", period: "/month",
                desc: "For the serious saver",
                features: ["Unlimited statements", "AI Finance Coach chat", "Wealth projections", "Saving streaks & goals", "Investment recommendations", "Priority support"],
                cta: "Start Pro trial", highlight: true,
              },
              {
                name: "Family", price: "₹349", period: "/month",
                desc: "For the whole family",
                features: ["5 member accounts", "Everything in Pro", "Family spending overview", "Shared goals", "Monthly family report", "Dedicated advisor"],
                cta: "Get Family plan", highlight: false,
              },
            ].map((plan, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{
                  background: plan.highlight ? "#E8622A" : "#111113",
                  border: plan.highlight ? "none" : "1px solid #1e1e22",
                  borderRadius: 24, padding: "2rem",
                  position: "relative", overflow: "hidden",
                  display: "flex", flexDirection: "column", height: "100%",
                }}>
                  {plan.highlight && (
                    <div style={{ position: "absolute", top: 16, right: 16, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(0,0,0,0.2)", color: "#fff", padding: "4px 10px", borderRadius: 8 }}>Most popular</div>
                  )}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: plan.highlight ? "rgba(255,255,255,0.6)" : "#52525b", marginBottom: 6 }}>{plan.name}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span className="ml-display" style={{ fontSize: "2.5rem", color: "#fff" }}>{plan.price}</span>
                      <span style={{ fontSize: "0.8rem", color: plan.highlight ? "rgba(255,255,255,0.6)" : "#52525b" }}>{plan.period}</span>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: plan.highlight ? "rgba(255,255,255,0.75)" : "#71717a", marginTop: 4 }}>{plan.desc}</p>
                  </div>

                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, flex: 1, marginBottom: "1.5rem" }}>
                    {plan.features.map((f, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: plan.highlight ? "rgba(255,255,255,0.9)" : "#a1a1aa" }}>
                        <span style={{ color: plan.highlight ? "#fff" : "#2EB87A", fontWeight: 700 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>

                  <button style={{
                    width: "100%", padding: "0.85rem", borderRadius: 100, fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s",
                    background: plan.highlight ? "#000" : "#E8622A",
                    color: "#fff", border: "none",
                  }}>{plan.cta}</button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "8rem 2rem", position: "relative", overflow: "hidden", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(232,98,42,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div className="ml-spin" style={{ position: "absolute", top: "50%", left: "50%", marginLeft: -300, marginTop: -300, width: 600, height: 600, border: "1px solid rgba(232,98,42,0.07)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Reveal>
            <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>🔍</div>
            <h2 className="ml-display" style={{ fontSize: "clamp(3rem, 6vw, 5rem)", color: "#fff", marginBottom: "1.25rem" }}>
              Your money<br />deserves a<br /><span className="text-shimmer">lens.</span>
            </h2>
            <p style={{ color: "#71717a", fontSize: "1.05rem", marginBottom: "2.5rem", lineHeight: 1.6 }}>
              Upload your first statement free. No credit card. No jargon. Just clarity.
            </p>
            <button className="ml-btn-primary" onClick={() => scrollTo("upload")} style={{ fontSize: "1rem", padding: "1rem 2.5rem" }}>
              Analyse my statement free →
            </button>
            <p style={{ fontSize: "0.7rem", color: "#3f3f46", marginTop: "1.25rem" }}>3 free analyses · No card required · Cancel anytime</p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #1a1a1e", background: "#0a0a0c", padding: "4rem 2rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "3rem", marginBottom: "3rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
                <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #E8622A, #D4A017)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: 18, color: "#000" }}>M</div>
                <span style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#fff" }}>MoneyLens</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#52525b", lineHeight: 1.65 }}>AI-powered expense analysis for smarter, wealthier Indians.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "How it Works", "Pricing", "Changelog"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Use", "Security", "DPDP Act"] },
            ].map((col, i) => (
              <div key={i}>
                <p className="ml-label" style={{ marginBottom: "1rem" }}>{col.title}</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map((l, j) => (
                    <li key={j}><a href="#" style={{ fontSize: "0.82rem", color: "#52525b", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => e.target.style.color = "#e4e4e7"} onMouseLeave={e => e.target.style.color = "#52525b"}>{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #1a1a1e", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#3f3f46" }}>© 2026 MoneyLens Technologies Pvt. Ltd. · Made with ❤️ in India</p>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {["Twitter", "LinkedIn", "Instagram"].map((s, i) => (
                <a key={i} href="#" style={{ fontSize: "0.72rem", color: "#3f3f46", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = "#71717a"} onMouseLeave={e => e.target.style.color = "#3f3f46"}>{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── FLOATING CTA ── */}
      <button onClick={() => scrollTo("upload")} style={{
        position: "fixed", bottom: "2rem", right: "2rem", zIndex: 50,
        width: 52, height: 52, background: "linear-gradient(135deg, #E8622A, #D4A017)",
        borderRadius: 16, border: "none", cursor: "pointer", fontSize: 22,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 30px rgba(232,98,42,0.4)", transition: "transform 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="Try MoneyLens Free">🤖</button>
    </div>
  );
}
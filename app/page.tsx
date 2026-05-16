"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, BarChart, Bar,
} from "recharts";
import { useRouter } from "next/navigation";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type RevealProps = { children: ReactNode; delay?: number; className?: string };

// ─── DATA ────────────────────────────────────────────────────────────────────
const SALARY_CYCLE = [
  { day: "D1",  spend: 18000, label: "Salary Day",      zone: "credit",  note: "₹92K credited" },
  { day: "D2",  spend: 8200,  label: "Immediate Spend", zone: "danger",  note: "Impulse surge" },
  { day: "D3",  spend: 11400, label: "Splurge Window",  zone: "danger",  note: "65% discretionary" },
  { day: "D5",  spend: 4800,  label: "Settling Down",   zone: "warning", note: "Still elevated" },
  { day: "D7",  spend: 3200,  label: "Normalizing",     zone: "neutral", note: "Routine spend" },
  { day: "D10", spend: 2800,  label: "Steady State",    zone: "neutral", note: "Controlled" },
  { day: "D14", spend: 2400,  label: "Mid-Month Low",   zone: "safe",    note: "Disciplined" },
  { day: "D18", spend: 3600,  label: "Stress Zone",     zone: "warning", note: "Anxiety creeping" },
  { day: "D22", spend: 5100,  label: "Pre-Paycheck",    zone: "danger",  note: "Stress spending" },
  { day: "D25", spend: 6800,  label: "Critical Zone",   zone: "critical",note: "Low balance fear" },
  { day: "D28", spend: 4200,  label: "Survival Mode",   zone: "critical",note: "Cutting back" },
  { day: "D30", spend: 2100,  label: "Recovery",        zone: "safe",    note: "Pre-salary calm" },
];

const ZONE_COLORS: Record<string, string> = {
  credit:   "#2EB87A",
  danger:   "#E8622A",
  warning:  "#D4A017",
  neutral:  "#3A9FD8",
  safe:     "#2EB87A",
  critical: "#ef4444",
};

const AHA_MOMENTS = [
  {
    icon: "⚡",
    color: "#E8622A",
    headline: "65% of your spending happens in 3 days",
    sub: "Days 1–3 after salary credit are your most financially vulnerable window.",
    badge: "Salary Trap",
  },
  {
    icon: "📉",
    color: "#ef4444",
    headline: "Financial stress begins at Day 18",
    sub: "Your transaction patterns show anxiety-driven purchases every month after Day 18.",
    badge: "Stress Pattern",
  },
  {
    icon: "🎭",
    color: "#D4A017",
    headline: "Food delivery spikes on stressful Tuesdays",
    sub: "You spend 3.2× more on delivery during high-workload weeks. Emotional eating confirmed.",
    badge: "Behavioral Link",
  },
  {
    icon: "🕳️",
    color: "#9B6FD8",
    headline: "₹3,200/month disappearing silently",
    sub: "Hidden leakage across 6 recurring charges you haven't actively used in 90+ days.",
    badge: "Ghost Spend",
  },
];

const FUTURE_IMPACT = [
  { habit: "₹2,800/mo food delivery", impact: "₹8.7L opportunity", years: 10, color: "#E8622A" },
  { habit: "Cut impulse by 20%", impact: "Emergency fund 14mo earlier", years: 0, color: "#2EB87A" },
  { habit: "₹1,840/mo subscriptions", impact: "₹5.2L in 8 years", years: 8, color: "#9B6FD8" },
  { habit: "₹620/mo late-night UPI", impact: "₹1.9L in 5 years", years: 5, color: "#D4A017" },
];

const EVOLUTION_MONTHS = [
  { m: "Sep", stress: 82, savings: 12, stability: 38 },
  { m: "Oct", stress: 78, savings: 15, stability: 42 },
  { m: "Nov", stress: 71, savings: 19, stability: 51 },
  { m: "Dec", stress: 68, savings: 22, stability: 58 },
  { m: "Jan", stress: 62, savings: 26, stability: 64 },
  { m: "Feb", stress: 54, savings: 31, stability: 71 },
];

const CHAT_PROMPTS = [
  "Why did I overspend this month?",
  "What habit hurts me most?",
  "Am I financially improving?",
  "How stable am I right now?",
  "What changed from last month?",
];

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useIntersection(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

function useCounter(target: number, visible: boolean, duration = 1600) {
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtCr = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const [ref, visible] = useIntersection();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function StatCounter({ value, prefix = "", suffix = "", label }: {
  value: number; prefix?: string; suffix?: string; label: string;
}) {
  const [ref, visible] = useIntersection();
  const count = useCounter(value, visible);
  return (
    <div ref={ref} className="text-center">
      <div style={{ fontSize: "clamp(2.2rem,4vw,3.2rem)", fontFamily: "var(--font-serif)", color: "#fff", lineHeight: 1 }}>
        {prefix}<span style={{ color: "var(--accent)" }}>{fmtCr(count)}</span>{suffix}
      </div>
      <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
        {label}
      </p>
    </div>
  );
}

// ─── HERO BEHAVIORAL SCORE ────────────────────────────────────────────────────
function HeroScore({ score = 42 }: { score?: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const [drawn, setDrawn] = useState(0);
  const ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      let s = 0;
      const step = setInterval(() => {
        s += 1;
        setDrawn(s);
        if (s >= score) clearInterval(step);
      }, 18);
      return () => clearInterval(step);
    }, 600);
    return () => clearTimeout(timer);
  }, [score]);

  const dash = (drawn / 100) * circ;
  const color = score < 40 ? "#ef4444" : score < 65 ? "#D4A017" : "#2EB87A";
  const label = score < 40 ? "At Risk" : score < 65 ? "Needs Work" : "Healthy";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          ref={ref}
          cx="65" cy="65" r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "65px 65px", transition: "stroke-dasharray 0.03s linear" }}
        />
        <text x="65" y="58" textAnchor="middle" fill="white" fontSize="28" fontWeight="700" fontFamily="Cormorant Garamond, serif">{drawn}</text>
        <text x="65" y="74" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="Instrument Sans, sans-serif">/100</text>
      </svg>
      <div style={{
        fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
        color, background: `${color}15`, border: `1px solid ${color}30`,
        padding: "0.3rem 0.85rem", borderRadius: "100px"
      }}>
        {label} · Financial Health
      </div>
    </div>
  );
}

// ─── SALARY CYCLE VISUALIZATION ──────────────────────────────────────────────
function SalaryCycleViz() {
  const [ref, visible] = useIntersection();
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const maxSpend = Math.max(...SALARY_CYCLE.map(d => d.spend));

  return (
    <div ref={ref} style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-xl)",
      padding: "2rem",
      overflow: "hidden",
      position: "relative"
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(232,98,42,0.03) 0%, transparent 50%)",
        pointerEvents: "none"
      }} />

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <span style={{
            background: "rgba(232,98,42,0.1)", border: "1px solid rgba(232,98,42,0.2)",
            color: "var(--accent)", fontSize: "0.62rem", fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            padding: "0.25rem 0.7rem", borderRadius: "100px"
          }}>Signature Feature</span>
        </div>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", color: "#fff", fontWeight: 400, marginBottom: "0.25rem" }}>
          Your Salary Cycle
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
          The 30-day behavioral rhythm your bank never shows you.
        </p>
      </div>

      {/* Timeline Bars */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "120px", marginBottom: "0.75rem" }}>
        {SALARY_CYCLE.map((day, i) => {
          const h = (day.spend / maxSpend) * 100;
          const color = ZONE_COLORS[day.zone];
          const isActive = activeDay === i;
          return (
            <div
              key={i}
              style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", cursor: "pointer" }}
              onMouseEnter={() => setActiveDay(i)}
              onMouseLeave={() => setActiveDay(null)}
            >
              <div
                style={{
                  height: visible ? `${h}%` : "2px",
                  background: isActive
                    ? color
                    : `linear-gradient(to top, ${color}90, ${color}40)`,
                  borderRadius: "4px 4px 2px 2px",
                  transition: `height ${0.4 + i * 0.04}s cubic-bezier(0.16,1,0.3,1), background 0.2s`,
                  minHeight: "4px",
                  boxShadow: isActive ? `0 0 12px ${color}60` : "none",
                  transform: isActive ? "scaleY(1.05)" : "scaleY(1)",
                  transformOrigin: "bottom",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Day Labels */}
      <div style={{ display: "flex", gap: "6px" }}>
        {SALARY_CYCLE.map((day, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <p style={{ fontSize: "0.55rem", color: activeDay === i ? "var(--accent)" : "var(--text-ghost)", fontWeight: 600, transition: "color 0.2s" }}>
              {day.day}
            </p>
          </div>
        ))}
      </div>

      {/* Active Tooltip */}
      {activeDay !== null && (
        <div style={{
          marginTop: "1rem",
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${ZONE_COLORS[SALARY_CYCLE[activeDay].zone]}30`,
          borderRadius: "var(--radius-md)",
          padding: "0.75rem 1rem",
          display: "flex", alignItems: "center", gap: "1rem"
        }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: ZONE_COLORS[SALARY_CYCLE[activeDay].zone],
            flexShrink: 0
          }} />
          <div>
            <p style={{ fontSize: "0.7rem", color: ZONE_COLORS[SALARY_CYCLE[activeDay].zone], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {SALARY_CYCLE[activeDay].label}
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>
              {SALARY_CYCLE[activeDay].note} · <strong style={{ color: "#fff" }}>{fmtCr(SALARY_CYCLE[activeDay].spend)}</strong> spent
            </p>
          </div>
        </div>
      )}

      {/* Zone Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
        {[
          { label: "Salary Day", color: "#2EB87A" },
          { label: "Splurge Zone", color: "#E8622A" },
          { label: "Stress Zone", color: "#D4A017" },
          { label: "Critical", color: "#ef4444" },
          { label: "Safe Zone", color: "#3A9FD8" },
        ].map((z, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: z.color }} />
            <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{z.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AHA MOMENT CARDS ─────────────────────────────────────────────────────────
function AhaMomentCard({ moment, delay }: { moment: typeof AHA_MOMENTS[0]; delay: number }) {
  const [ref, visible] = useIntersection();
  return (
    <div
      ref={ref}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
        transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${moment.color}30`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px) scale(1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-subtle)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)";
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at top left, ${moment.color}08 0%, transparent 60%)`,
        pointerEvents: "none"
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", position: "relative", zIndex: 1 }}>
        <div style={{
          width: "42px", height: "42px", borderRadius: "12px", flexShrink: 0,
          background: `${moment.color}12`, border: `1px solid ${moment.color}20`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem"
        }}>
          {moment.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{
              fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: moment.color, background: `${moment.color}12`, border: `1px solid ${moment.color}20`,
              padding: "0.2rem 0.6rem", borderRadius: "100px"
            }}>{moment.badge}</span>
          </div>
          <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff", lineHeight: 1.35, marginBottom: "0.5rem" }}>
            {moment.headline}
          </h4>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{moment.sub}</p>
        </div>
      </div>
    </div>
  );
}

// ─── FUTURE IMPACT ENGINE ─────────────────────────────────────────────────────
function FutureImpact({ item, delay }: { item: typeof FUTURE_IMPACT[0]; delay: number }) {
  const [ref, visible] = useIntersection();
  return (
    <div
      ref={ref}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-16px)",
        transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>{item.habit}</p>
      </div>
      <p style={{
        fontFamily: "var(--font-serif)", fontSize: "1.6rem", color: item.color,
        fontWeight: 500, lineHeight: 1.2, marginBottom: "0.35rem"
      }}>
        → {item.impact}
      </p>
      {item.years > 0 && (
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          over {item.years} years at 12% p.a.
        </p>
      )}
    </div>
  );
}

// ─── AI COMPANION PREVIEW ─────────────────────────────────────────────────────
function AICompanion() {
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  const REPLIES: Record<string, string> = {
    "Why did I overspend this month?": "Your overspend happened in 3 concentrated windows. Days 1–3 (post-salary), Day 17–18 (stress trigger), and Fri/Sat evenings. Together these account for 78% of your discretionary excess.",
    "What habit hurts me most?": "Your biggest wealth killer is the post-salary relaxation effect. You spend ₹14,200 on average in the first 3 days — 4× your daily average. This alone costs you ₹1.2L per year in opportunity cost.",
    "Am I financially improving?": "Yes — your financial stress score dropped from 82 to 54 over 6 months. Savings rate is up 19pts. But your emergency fund is still below 2 months. Focus there.",
    "How stable am I right now?": "Stability score: 64/100. Your balance trajectory shows healthy mid-month behavior. Primary risk: Day 18–25 vulnerability window still active. EMI-to-income ratio is safe at 12%.",
    "What changed from last month?": "vs February: Food delivery -₹1,200 ✓, Subscription leakage identified -₹620 ✓, but impulse UPI went up by ₹840. Net improvement: ₹980 better. Trend: positive.",
  };

  const handlePrompt = (p: string) => {
    setActivePrompt(p);
    setTyping(true);
    setReply(null);
    setTimeout(() => {
      setTyping(false);
      setReply(REPLIES[p] ?? "Analysing your financial patterns...");
    }, 1400);
  };

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-xl)",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "1.25rem 1.5rem",
        display: "flex", alignItems: "center", gap: "0.75rem"
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #E8622A, #D4A017)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-serif)", fontSize: "1.1rem", fontWeight: 600, color: "#000"
          }}>ML</div>
          <div style={{
            position: "absolute", bottom: "-1px", right: "-1px",
            width: "10px", height: "10px", background: "#2EB87A",
            borderRadius: "50%", border: "2px solid var(--bg-card)"
          }} />
        </div>
        <div>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>MoneyLens AI</p>
          <p style={{ fontSize: "0.68rem", color: "#2EB87A" }}>Context-aware · Behaviorally intelligent</p>
        </div>
      </div>

      {/* Chat area */}
      <div style={{ padding: "1.25rem 1.5rem", minHeight: "180px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {!activePrompt && (
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.6 }}>
            Ask me anything about your financial behavior. I know your patterns, cycles, and triggers intimately.
          </p>
        )}
        {activePrompt && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{
              background: "var(--accent)", color: "#fff",
              padding: "0.6rem 1rem", borderRadius: "16px 16px 4px 16px",
              fontSize: "0.82rem", maxWidth: "85%", lineHeight: 1.5,
              animation: "fadeUp 0.3s ease"
            }}>
              {activePrompt}
            </div>
          </div>
        )}
        {typing && (
          <div style={{ display: "flex", gap: "5px", padding: "0.75rem 1rem", background: "#1a1a1e", borderRadius: "16px 16px 16px 4px", width: "fit-content" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: "6px", height: "6px", background: "var(--accent)", borderRadius: "50%", animation: `chatBounce 1s ${i*0.2}s infinite` }} />
            ))}
          </div>
        )}
        {reply && (
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)",
            padding: "0.8rem 1rem", borderRadius: "16px 16px 16px 4px",
            fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.65,
            maxWidth: "88%", animation: "fadeUp 0.35s ease"
          }}>
            {reply}
          </div>
        )}
      </div>

      {/* Prompt chips */}
      <div style={{ padding: "0 1.5rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.25rem" }}>
          Try asking:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {CHAT_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => handlePrompt(p)}
              style={{
                background: activePrompt === p ? "rgba(232,98,42,0.1)" : "transparent",
                border: `1px solid ${activePrompt === p ? "rgba(232,98,42,0.3)" : "var(--border-default)"}`,
                color: activePrompt === p ? "var(--accent)" : "var(--text-muted)",
                fontSize: "0.72rem", padding: "0.35rem 0.8rem",
                borderRadius: "100px", cursor: "pointer",
                transition: "all 0.2s ease", fontFamily: "var(--font-sans)",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FINANCIAL EVOLUTION CHART ────────────────────────────────────────────────
function EvolutionChart() {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-xl)",
      padding: "2rem",
      overflow: "hidden", position: "relative"
    }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", color: "#fff", fontWeight: 400, marginBottom: "0.3rem" }}>
          Your Financial Evolution
        </h3>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          6 months of measurable progress — stress falling, stability rising.
        </p>
      </div>
     <div className="h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={EVOLUTION_MONTHS}>
            <defs>
              <linearGradient id="stressG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="stabG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2EB87A" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#2EB87A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="savG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4A017" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#D4A017" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
            <XAxis dataKey="m" stroke="#2a2a2e" tick={{ fontSize: 11, fill: "#52525b" }} />
            <YAxis stroke="#2a2a2e" tick={{ fontSize: 10, fill: "#52525b" }} domain={[0, 100]} tickFormatter={v => `${v}`} />
            <Tooltip
              contentStyle={{ background: "#111113", border: "1px solid #222226", borderRadius: 10, fontSize: 12 }}
              formatter={(v: number, name: string) => [
                `${v}`,
                name === "stress" ? "Stress Index" : name === "stability" ? "Stability Score" : "Savings Rate"
              ]}
            />
            <Area type="monotone" dataKey="stress"    stroke="#ef4444" fill="url(#stressG)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="stability" stroke="#2EB87A" fill="url(#stabG)"   strokeWidth={2}   dot={false} />
            <Area type="monotone" dataKey="savings"   stroke="#D4A017" fill="url(#savG)"    strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
        {[
          { label: "Stress Index", color: "#ef4444", trend: "↓ 34%" },
          { label: "Stability",    color: "#2EB87A", trend: "↑ 87%" },
          { label: "Savings Rate", color: "#D4A017", trend: "↑ 19pts" },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color }} />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{l.label}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: l.color }}>{l.trend}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION TAG ──────────────────────────────────────────────────────────────
function SectionTag({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.4rem",
      background: "rgba(232,98,42,0.08)", border: "1px solid rgba(232,98,42,0.18)",
      color: "var(--accent)", fontSize: "0.62rem", fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase",
      padding: "0.3rem 0.9rem", borderRadius: "100px",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#2EB87A", animation: "pulseDot 2s infinite" }} />
      {label}
    </span>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────
export default function MoneyLensLanding() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) router.replace("/dashboard");
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, [router]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ background: "var(--bg-deep)", color: "var(--text-primary)", overflowX: "hidden", fontFamily: "var(--font-sans)" }}>
      <div className="noise-overlay" />

      {/* ── NAVIGATION ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        transition: "all 0.3s ease",
        background: scrolled ? "rgba(10,10,12,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "10px",
                background: "linear-gradient(135deg, #E8622A, #D4A017)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "#000", fontWeight: 600
              }}>M</div>
              <div style={{
                position: "absolute", top: "-2px", right: "-2px",
                width: "8px", height: "8px", background: "#2EB87A", borderRadius: "50%",
                animation: "pulseDot 2s infinite"
              }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em", color: "#fff" }}>MoneyLens</span>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            {[["features","Features"],["cycle","Salary Cycle"],["intelligence","Intelligence"],["pricing","Pricing"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 600,
                fontFamily: "var(--font-sans)", transition: "color 0.2s"
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >{label}</button>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button onClick={() => router.push("/login")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 600,
              fontFamily: "var(--font-sans)"
            }}>Log in</button>
            <button onClick={() => scrollTo("upload")} style={{
              background: "var(--accent)", color: "#fff", border: "none",
              padding: "0.6rem 1.4rem", borderRadius: "100px", cursor: "pointer",
              fontWeight: 700, fontSize: "0.8rem", fontFamily: "var(--font-sans)",
              transition: "all 0.2s", boxShadow: "0 4px 16px rgba(232,98,42,0.3)"
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f0733c")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--accent)")}
            >
              Try free →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-grid-bg" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: "6rem", paddingBottom: "5rem", overflow: "hidden" }}>
        {/* Orbs */}
        <div className="orb-orange" style={{ position: "absolute", width: "700px", height: "700px", top: "20%", left: "10%", pointerEvents: "none" }} />
        <div className="orb-gold" style={{ position: "absolute", width: "500px", height: "500px", bottom: "0%", right: "10%", pointerEvents: "none" }} />

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem", width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "4rem", alignItems: "center" }}>

            {/* LEFT */}
            <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: "rgba(232,98,42,0.08)", border: "1px solid rgba(232,98,42,0.18)",
                  color: "var(--accent)", fontSize: "0.65rem", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  padding: "0.3rem 0.9rem", borderRadius: "100px"
                }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#2EB87A", animation: "pulseDot 2s infinite" }} />
                  AI Behavioral Financial Intelligence
                </span>
              </div>

              {/* Big Insight Hero */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "var(--radius-lg)", padding: "1.2rem 1.4rem", marginBottom: "1.5rem",
                borderLeft: "3px solid var(--accent)"
              }}>
                <p style={{ fontSize: "0.65rem", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.4rem" }}>
                  AI detected this about you
                </p>
                <p style={{ fontSize: "1.05rem", color: "#fff", fontWeight: 500, lineHeight: 1.55 }}>
                  "65% of your discretionary spending happens within <strong style={{ color: "var(--accent)" }}>3 days of salary credit</strong>. Your financial stress begins at Day 18 every month."
                </p>
              </div>

              <h1 style={{
                fontFamily: "var(--font-serif)", color: "#fff",
                fontSize: "clamp(3.5rem,6.5vw,5.5rem)", fontWeight: 400, lineHeight: 1.05,
                marginBottom: "1.25rem"
              }}>
                Your money has<br />
                a <span className="text-shimmer">behavioral</span><br />
                pattern.
              </h1>

              <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.7, maxWidth: "420px", marginBottom: "2rem" }}>
                MoneyLens is not a budgeting app. It's an AI-powered behavioral intelligence system that understands <em>why</em> your money disappears.
              </p>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                <button onClick={() => scrollTo("upload")} style={{
                  background: "var(--accent)", color: "#fff", border: "none",
                  padding: "0.9rem 2rem", borderRadius: "100px", cursor: "pointer",
                  fontWeight: 700, fontSize: "0.9rem", fontFamily: "var(--font-sans)",
                  boxShadow: "0 8px 24px rgba(232,98,42,0.35)",
                  transition: "all 0.2s"
                }}>
                  Analyse my behavior →
                </button>
                <button onClick={() => scrollTo("cycle")} style={{
                  background: "transparent", color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                  padding: "0.9rem 2rem", borderRadius: "100px", cursor: "pointer",
                  fontWeight: 600, fontSize: "0.9rem", fontFamily: "var(--font-sans)",
                  transition: "all 0.2s"
                }}>
                  See how it works
                </button>
              </div>

              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                {["No bank login needed", "256-bit encrypted", "All Indian banks"].map((t, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    <span style={{ color: "#2EB87A", fontSize: "0.55rem" }}>●</span> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ position: "relative", opacity: heroVisible ? 1 : 0, transition: "all 1s cubic-bezier(0.16,1,0.3,1) 200ms", transform: heroVisible ? "translateY(0)" : "translateY(24px)" }}>
              {/* Floating AI Alert */}
              <div className="ml-float" style={{
                position: "absolute", top: "-20px", left: "-20px", zIndex: 20,
                background: "var(--bg-card)", border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)", padding: "0.75rem 1rem",
                display: "flex", alignItems: "center", gap: "0.6rem",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
              }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(232,98,42,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>⚡</div>
                <div>
                  <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Aha Moment Detected</p>
                  <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>Post-salary splurge: ₹18,400 in 3 days</p>
                </div>
              </div>

              {/* Main Dashboard Card */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "var(--radius-xl)", overflow: "hidden",
                boxShadow: "0 40px 80px rgba(0,0,0,0.6)"
              }}>
                {/* Header */}
                <div style={{
                  background: "rgba(0,0,0,0.4)", padding: "1.5rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-end"
                }}>
                  <div>
                    <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                      April 2026 · Behavioral Profile
                    </p>
                    <p style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "#fff" }}>
                      Stress Index: <span style={{ color: "#D4A017" }}>68/100</span>
                    </p>
                  </div>
                  <HeroScore score={42} />
                </div>

                {/* Behavioral indicators */}
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Behavioral signals
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {[
                      { label: "Post-Salary Relaxation", pct: 82, color: "#E8622A" },
                      { label: "Impulse Spend Cycles",   pct: 67, color: "#D4A017" },
                      { label: "Stress-Triggered Spend", pct: 54, color: "#ef4444" },
                      { label: "Savings Discipline",     pct: 38, color: "#3A9FD8" },
                      { label: "Financial Stability",    pct: 44, color: "#2EB87A" },
                    ].map((item, i) => (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{item.label}</span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: item.color }}>{item.pct}%</span>
                        </div>
                        <div style={{ height: "4px", background: "#1a1a1e", borderRadius: "4px" }}>
                          <div style={{
                            height: "100%", borderRadius: "4px",
                            width: `${item.pct}%`, background: item.color,
                            transition: "width 1s ease"
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Streak badge */}
              <div className="ml-float-b" style={{
                position: "absolute", bottom: "-16px", right: "-16px", zIndex: 20,
                background: "linear-gradient(135deg, #D4A017, #E8622A)",
                borderRadius: "var(--radius-md)", padding: "0.85rem", textAlign: "center",
                boxShadow: "0 16px 40px rgba(232,98,42,0.35)"
              }}>
                <div style={{ fontSize: "1.4rem", lineHeight: 1 }}>🔥</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "#000", lineHeight: 1 }}>14</div>
                <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(0,0,0,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BANK MARQUEE ── */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "0.9rem 0", background: "var(--bg-surface)", overflow: "hidden" }}>
        <div className="ml-marquee" style={{ display: "flex", whiteSpace: "nowrap" }}>
          {Array(2).fill(null).map((_, ri) => (
            <div key={ri} style={{ display: "flex", gap: "3rem", alignItems: "center", marginRight: "3rem" }}>
              {["HDFC Bank","SBI","ICICI Bank","Axis Bank","Kotak","Yes Bank","IndusInd","IDFC First","Federal Bank","BOB","PNB","Canara Bank"].map((b, i) => (
                <span key={i} style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-ghost)" }}>
                  {b}<span style={{ color: "var(--accent)", margin: "0 1rem" }}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{ padding: "5rem 2rem", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "3rem" }}>
          <StatCounter value={4200000} prefix="₹" suffix="+" label="Savings identified" />
          <StatCounter value={18000} suffix="+" label="Statements analysed" />
          <StatCounter value={94} suffix="%" label="Saved in month 1" />
          <StatCounter value={6200} prefix="₹" suffix="/mo" label="Avg. leaks found" />
        </div>
      </section>

      {/* ── SALARY CYCLE SECTION ── */}
      <section id="cycle" style={{ padding: "6rem 2rem", background: "var(--bg-surface)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <SectionTag label="Signature Feature" />
              <h2 style={{
                fontFamily: "var(--font-serif)", color: "#fff",
                fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 400, marginTop: "1rem", marginBottom: "0.75rem"
              }}>
                The 30-day rhythm<br />
                <span className="text-shimmer">you never knew existed.</span>
              </h2>
              <p style={{ color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
                Every salaried person has a predictable financial cycle. MoneyLens maps yours and shows you exactly where it breaks down.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <SalaryCycleViz />
          </Reveal>

          {/* Below cycle: key stats */}
          <Reveal delay={150}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "1.5rem" }}>
              {[
                { stat: "3 days", label: "when 65% of your discretionary spend happens", color: "#E8622A" },
                { stat: "Day 18", label: "when financial stress consistently begins each month", color: "#D4A017" },
                { stat: "₹4.2K",  label: "average monthly impulse leak from the stress window", color: "#ef4444" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem"
                }}>
                  <p style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: s.color, marginBottom: "0.4rem" }}>{s.stat}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── AHA MOMENTS ── */}
      <section id="intelligence" style={{ padding: "6rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <SectionTag label="Hidden Pattern Intelligence" />
              <h2 style={{
                fontFamily: "var(--font-serif)", color: "#fff",
                fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 400, marginTop: "1rem", marginBottom: "0.75rem"
              }}>
                Moments that make you<br />
                <span className="text-shimmer">see yourself clearly.</span>
              </h2>
              <p style={{ color: "var(--text-muted)", maxWidth: "460px", margin: "0 auto", lineHeight: 1.7 }}>
                Not generic analytics. Psychologically accurate insights about your specific behavioral patterns.
              </p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
            {AHA_MOMENTS.map((m, i) => (
              <AhaMomentCard key={i} moment={m} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FUTURE IMPACT ENGINE ── */}
      <section style={{ padding: "6rem 2rem", background: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <SectionTag label="Future Impact Engine" />
              <h2 style={{
                fontFamily: "var(--font-serif)", color: "#fff",
                fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 400, marginTop: "1rem", marginBottom: "0.75rem"
              }}>
                Today's habits.<br />
                <span className="text-shimmer">Tomorrow's wealth.</span>
              </h2>
              <p style={{ color: "var(--text-muted)", maxWidth: "420px", margin: "0 auto", lineHeight: 1.7 }}>
                Not guilt-tripping. Empowering. See exactly what small changes compounded over time.
              </p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", maxWidth: "800px", margin: "0 auto" }}>
            {FUTURE_IMPACT.map((item, i) => (
              <FutureImpact key={i} item={item} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── AI COMPANION + EVOLUTION ── */}
      <section style={{ padding: "6rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <SectionTag label="AI Financial Companion" />
              <h2 style={{
                fontFamily: "var(--font-serif)", color: "#fff",
                fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 400, marginTop: "1rem"
              }}>
                Not a chatbot.<br />
                <span className="text-shimmer">A financial mirror.</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <Reveal delay={50}><AICompanion /></Reveal>
            <Reveal delay={150}><EvolutionChart /></Reveal>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" style={{ padding: "6rem 2rem", background: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <SectionTag label="Core Features" />
              <h2 style={{
                fontFamily: "var(--font-serif)", color: "#fff",
                fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 400, marginTop: "1rem"
              }}>
                Built for behavioral<br />
                <span className="text-shimmer">self-awareness.</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--border-subtle)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
            {[
              { icon: "🔍", title: "Deep Behavioral Analysis",   desc: "Not just category charts. AI-mapped behavioral patterns, impulse cycles, stress windows, and post-salary drain analysis.", color: "#E8622A", badge: "Core" },
              { icon: "🧠", title: "Psychological Spend Mapping", desc: "Identify emotional triggers, social spending dependency, burnout patterns, and behavioral loops unique to you.", color: "#9B6FD8", badge: "Unique" },
              { icon: "📅", title: "Salary Cycle Intelligence",   desc: "Our signature feature. See your 30-day financial rhythm, vulnerable windows, and stability zones in vivid detail.", color: "#D4A017", badge: "Signature" },
              { icon: "🌱", title: "Compound Impact Engine",      desc: "Show what ₹2,800/mo on delivery becomes in 10 years. Real numbers, real benchmarks. Empowering, never guilt-based.", color: "#2EB87A", badge: "Impact" },
              { icon: "🤖", title: "Context-Aware AI Chat",       desc: "Ask anything. Get answers grounded in your actual transaction history, behavioral patterns, and monthly trends.", color: "#3A9FD8", badge: "AI" },
              { icon: "📈", title: "Financial Evolution Tracker", desc: "Monthly stress reduction. Rising savings discipline. Improving stability. Watch yourself grow financially.", color: "#E8622A", badge: "Growth" },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 50}>
                <div style={{
                  background: "var(--bg-deep)", padding: "2rem",
                  transition: "background 0.2s"
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-deep)")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${f.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>{f.icon}</div>
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: f.color, background: `${f.color}10`, border: `1px solid ${f.color}25`, padding: "0.2rem 0.6rem", borderRadius: "100px" }}>
                      {f.badge}
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#e4e4e7", marginBottom: "0.6rem" }}>{f.title}</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPLOAD ── */}
      <section id="upload" style={{ padding: "6rem 2rem" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <SectionTag label="Get Started" />
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem,4vw,3rem)", color: "#fff", fontWeight: 400, marginTop: "1rem", marginBottom: "0.5rem" }}>
                Upload your statement
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Free for your first 3 analyses. No card required.</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div style={{
              border: "1.5px dashed rgba(255,255,255,0.1)", borderRadius: "var(--radius-xl)",
              padding: "4rem 2rem", textAlign: "center", cursor: "pointer",
              background: "rgba(232,98,42,0.02)", transition: "all 0.3s"
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,98,42,0.35)";
                (e.currentTarget as HTMLDivElement).style.background = "rgba(232,98,42,0.04)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLDivElement).style.background = "rgba(232,98,42,0.02)";
              }}
            >
              <div style={{
                width: "68px", height: "68px", borderRadius: "18px",
                background: "rgba(232,98,42,0.08)", border: "1px solid rgba(232,98,42,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.8rem", margin: "0 auto 1.5rem"
              }}>📄</div>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff", marginBottom: "0.5rem" }}>
                Drop your bank statement here
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1.75rem" }}>
                PDF, CSV, or Excel · Max 10MB · Encrypted instantly
              </p>
              <button style={{
                background: "var(--accent)", color: "#fff", border: "none",
                padding: "0.85rem 2.25rem", borderRadius: "100px", cursor: "pointer",
                fontWeight: 700, fontSize: "0.88rem", fontFamily: "var(--font-sans)",
                boxShadow: "0 8px 24px rgba(232,98,42,0.3)"
              }}>
                Choose file to upload
              </button>
              <p style={{ fontSize: "0.68rem", color: "var(--text-ghost)", marginTop: "1.5rem" }}>
                HDFC · SBI · ICICI · Axis · Kotak · Yes Bank · IndusInd + more
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "6rem 2rem", background: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <SectionTag label="Pricing" />
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2.5rem,5vw,4rem)", color: "#fff", fontWeight: 400, marginTop: "1rem" }}>
                Simple. Fair. Worth it.
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
            {[
              { name: "Starter", price: "Free", period: "forever", desc: "Try it risk-free", highlight: false,
                features: ["3 statement analyses", "Behavioral overview", "Salary cycle viz", "Basic insight cards"], cta: "Start free" },
              { name: "Pro", price: "₹199", period: "/month", desc: "For the serious saver", highlight: true,
                features: ["Unlimited analyses", "AI Behavioral Coach", "Full cycle intelligence", "Future impact engine", "Evolution tracking", "Priority support"], cta: "Start Pro" },
              { name: "Family", price: "₹349", period: "/month", desc: "For the whole family", highlight: false,
                features: ["5 member accounts", "Everything in Pro", "Family behavioral map", "Shared financial goals", "Monthly family report"], cta: "Get Family" },
            ].map((plan, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{
                  borderRadius: "var(--radius-xl)", padding: "2rem",
                  display: "flex", flexDirection: "column",
                  background: plan.highlight ? "var(--accent)" : "var(--bg-card)",
                  border: `1px solid ${plan.highlight ? "transparent" : "var(--border-subtle)"}`,
                  boxShadow: plan.highlight ? "0 24px 60px rgba(232,98,42,0.3)" : "none",
                  position: "relative", overflow: "hidden"
                }}>
                  {plan.highlight && (
                    <div style={{
                      position: "absolute", top: "1rem", right: "1rem",
                      fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.1em", background: "rgba(0,0,0,0.2)",
                      color: "#fff", padding: "0.25rem 0.75rem", borderRadius: "100px"
                    }}>Most popular</div>
                  )}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: plan.highlight ? "rgba(255,255,255,0.65)" : "var(--text-muted)", marginBottom: "0.4rem" }}>{plan.name}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                      <span style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", color: "#fff" }}>{plan.price}</span>
                      <span style={{ fontSize: "0.8rem", color: plan.highlight ? "rgba(255,255,255,0.6)" : "var(--text-muted)" }}>{plan.period}</span>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: plan.highlight ? "rgba(255,255,255,0.75)" : "var(--text-muted)", marginTop: "0.25rem" }}>{plan.desc}</p>
                  </div>
                  <ul style={{ flex: 1, marginBottom: "1.5rem", listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {plan.features.map((f, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: plan.highlight ? "rgba(255,255,255,0.9)" : "var(--text-secondary)" }}>
                        <span style={{ fontWeight: 700, color: plan.highlight ? "#fff" : "#2EB87A" }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button style={{
                    width: "100%", padding: "0.9rem", borderRadius: "100px",
                    border: "none", cursor: "pointer", fontWeight: 700,
                    fontSize: "0.85rem", fontFamily: "var(--font-sans)",
                    background: plan.highlight ? "#000" : "var(--accent)",
                    color: "#fff", transition: "all 0.2s"
                  }}>
                    {plan.cta}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "8rem 2rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="orb-orange" style={{ position: "absolute", width: "600px", height: "600px", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
        <div className="ml-spin" style={{ position: "absolute", top: "50%", left: "50%", width: "600px", height: "600px", marginLeft: "-300px", marginTop: "-300px", border: "1px solid rgba(232,98,42,0.07)", borderRadius: "50%", pointerEvents: "none" }} />
        <div className="ml-spin-rev" style={{ position: "absolute", top: "50%", left: "50%", width: "400px", height: "400px", marginLeft: "-200px", marginTop: "-200px", border: "1px solid rgba(212,160,23,0.05)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ maxWidth: "600px", margin: "0 auto", position: "relative", zIndex: 10 }}>
          <Reveal>
            <div style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>🔍</div>
            <h2 style={{ fontFamily: "var(--font-serif)", color: "#fff", fontSize: "clamp(3rem,6vw,5rem)", fontWeight: 400, lineHeight: 1.05, marginBottom: "1.25rem" }}>
              Your money has<br />a story.<br /><span className="text-shimmer">Read it.</span>
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "2.5rem", lineHeight: 1.7 }}>
              Upload your first statement free. No credit card. No jargon. Just deep, personal financial clarity.
            </p>
            <button onClick={() => scrollTo("upload")} style={{
              background: "var(--accent)", color: "#fff", border: "none",
              padding: "1rem 2.5rem", borderRadius: "100px", cursor: "pointer",
              fontWeight: 700, fontSize: "1rem", fontFamily: "var(--font-sans)",
              boxShadow: "0 12px 32px rgba(232,98,42,0.4)", transition: "all 0.2s"
            }}>
              Understand my financial behavior →
            </button>
            <p style={{ fontSize: "0.7rem", color: "var(--text-ghost)", marginTop: "1.25rem" }}>
              3 free analyses · No card required · Results in 30 seconds
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-deep)", padding: "4rem 2rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "3rem", marginBottom: "3rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#E8622A,#D4A017)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-serif)", fontSize: "1rem", color: "#000" }}>M</div>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>MoneyLens</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
                AI-powered behavioral financial intelligence for smarter, wealthier Indians.
              </p>
            </div>
            {[
              { title: "Product", links: ["Features","Salary Cycle","AI Companion","Pricing","Changelog"] },
              { title: "Company", links: ["About","Blog","Careers","Press"] },
              { title: "Legal",   links: ["Privacy Policy","Terms of Use","Security","DPDP Act"] },
            ].map((col, i) => (
              <div key={i}>
                <p style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-muted)", marginBottom: "1rem" }}>{col.title}</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {col.links.map((l, j) => (
                    <li key={j}>
                      <a href="#" style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--text-ghost)" }}>© 2026 MoneyLens Technologies Pvt. Ltd. · Made with ❤️ in India</p>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {["Twitter","LinkedIn","Instagram"].map((s, i) => (
                <a key={i} href="#" style={{ fontSize: "0.7rem", color: "var(--text-ghost)", textDecoration: "none" }}>{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Floating AI button */}
      <button
        onClick={() => scrollTo("upload")}
        style={{
          position: "fixed", bottom: "2rem", right: "2rem", zIndex: 50,
          width: "52px", height: "52px",
          background: "linear-gradient(135deg, #E8622A, #D4A017)",
          borderRadius: "14px", border: "none", cursor: "pointer",
          fontSize: "1.3rem", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 30px rgba(232,98,42,0.4)",
          transition: "transform 0.2s"
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        title="Analyse my finances"
      >🤖</button>
    </div>
  );
}
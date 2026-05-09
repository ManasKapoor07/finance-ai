"use client";

import { useState, useEffect, useRef, RefObject, ReactNode } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip,
  XAxis, YAxis, BarChart, Bar,
} from "recharts";
import './globals.css'
import { useRouter } from "next/navigation";

type SavingsGrowthItem = { month: string; actual: number; withML: number };
type SpendingCategory  = { name: string; value: number; fill: string; pct: number };
type ChatMessage       = { role: "user" | "ai"; text: string; cards?: string[] };
type RevealProps       = { children: ReactNode; delay?: number; className?: string };
type StatCounterProps  = { value: number; prefix?: string; suffix?: string; label: string };
type UseIntersectionReturn = [RefObject<HTMLDivElement | null>, boolean];

const savingsGrowth: SavingsGrowthItem[] = [
  { month: "Jan", actual: 2800,  withML: 5600  },
  { month: "Feb", actual: 3100,  withML: 8900  },
  { month: "Mar", actual: 2600,  withML: 12400 },
  { month: "Apr", actual: 3800,  withML: 16800 },
  { month: "May", actual: 4200,  withML: 22300 },
  { month: "Jun", actual: 3500,  withML: 28700 },
];

const spendingCategories: SpendingCategory[] = [
  { name: "Food & Dining",  value: 18400, fill: "#E8622A", pct: 31 },
  { name: "Shopping",       value: 12800, fill: "#9B6FD8", pct: 21 },
  { name: "Transport",      value: 8200,  fill: "#3A9FD8", pct: 14 },
  { name: "Subscriptions",  value: 5100,  fill: "#D4A017", pct: 9  },
  { name: "Entertainment",  value: 4800,  fill: "#2EB87A", pct: 8  },
];

const chatMessages: ChatMessage[] = [
  { role: "user", text: "What if I saved ₹3,000/month from food delivery?" },
  { role: "ai",   text: "Great question. ₹3,000/month in a Nifty 50 SIP at 12% p.a. compounds to:", cards: ["₹2.4L in 5 yrs", "₹6.2L in 10 yrs", "₹21L in 20 yrs"] },
  { role: "user", text: "Which subscriptions should I cancel?" },
  { role: "ai",   text: "I found 4 overlapping subscriptions worth ₹1,840/month:\n• Netflix + Prime (you only use Prime)\n• 2 duplicate cloud storage plans\nCancelling saves ₹22,080/year.", cards: [] },
];


function useIntersection(threshold = 0.12): UseIntersectionReturn {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useCounter(target: number, visible: boolean, duration = 1800): number {
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
const fmt = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`;
  return n.toString();
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
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function StatCounter({ value, prefix = "", suffix = "", label }: StatCounterProps) {
  const [ref, visible] = useIntersection();
  const count = useCounter(value, visible);
  return (
    <div ref={ref} className="text-center">
      <div className="font-serif leading-none" style={{ fontSize: "clamp(2.5rem,5vw,4rem)", color: "#fff" }}>
        {prefix}<span className="text-[#E8622A]">{fmt(count)}</span>{suffix}
      </div>
      <p className="text-[0.7rem] text-zinc-500 mt-2 tracking-[0.12em] uppercase font-medium">{label}</p>
    </div>
  );
}

function SIPCalculator() {
  const [monthly, setMonthly] = useState(3000);
  const [years,   setYears]   = useState(10);
  const rate    = 0.12;
  const months  = years * 12;
  const mr      = rate / 12;
  const fv      = monthly * ((Math.pow(1 + mr, months) - 1) / mr) * (1 + mr);
  const invested = monthly * months;

  const fmtFull = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
  };

  const data = Array.from({ length: years }, (_, i) => {
    const m = (i + 1) * 12;
    return {
      year: `Y${i + 1}`,
      value:    Math.round(monthly * ((Math.pow(1 + mr, m) - 1) / mr) * (1 + mr)),
      invested: monthly * m,
    };
  });

  return (
    <div className="bg-[#111113] border border-[#222226] rounded-3xl p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 rounded-xl bg-[#E8622A]/10 flex items-center justify-center text-lg">🌱</div>
        <div>
          <p className="text-[0.65rem] text-zinc-600 tracking-[0.12em] uppercase font-semibold mb-0.5">Live SIP Projection</p>
          <h3 className="font-serif text-xl text-white m-0">What could you build?</h3>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {[
          { label: "Monthly savings", value: fmtFull(monthly), min: 500,  max: 25000, step: 500, val: monthly, set: setMonthly },
          { label: "Time horizon",    value: `${years} years`,  min: 1,    max: 30,    step: 1,   val: years,   set: setYears   },
        ].map((s, i) => (
          <div key={i}>
            <div className="flex justify-between mb-2.5">
              <span className="text-xs text-zinc-500">{s.label}</span>
              <span className="text-xs font-bold text-[#E8622A]">{s.value}</span>
            </div>
            <input
              type="range" min={s.min} max={s.max} step={s.step} value={s.val}
              onChange={e => s.set(+e.target.value)}
              className="w-full accent-[#E8622A]"
            />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-40 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fvG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#E8622A" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#E8622A" stopOpacity="0"   />
              </linearGradient>
              <linearGradient id="invG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#3A9FD8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3A9FD8" stopOpacity="0"    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
            <XAxis dataKey="year" stroke="#3f3f46" tick={{ fontSize: 10, fill: "#52525b" }} />
            <YAxis stroke="#3f3f46" tick={{ fontSize: 10, fill: "#52525b" }}
              tickFormatter={v => v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${v}`} />
            <Tooltip
              contentStyle={{ background: "#111113", border: "1px solid #222226", borderRadius: 10, fontSize: 12 }}
              formatter={(v, n) => [fmtFull(v as number), n === "value" ? "Future Value" : "Invested"]}
            />
            <Area type="monotone" dataKey="invested" stroke="#3A9FD8" fill="url(#invG)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="value"    stroke="#E8622A" fill="url(#fvG)"  strokeWidth={2}   />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Invested",     val: fmtFull(invested),      color: "#3A9FD8" },
          { label: "Future value", val: fmtFull(fv),            color: "#E8622A" },
          { label: "Wealth gain",  val: fmtFull(fv - invested), color: "#2EB87A" },
        ].map((s, i) => (
          <div key={i} className="bg-[#0e0e10] rounded-2xl p-3.5 text-center">
            <p className="text-[0.65rem] text-zinc-600 uppercase tracking-[0.1em] mb-1">{s.label}</p>
            <p className="font-serif text-lg m-0" style={{ color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIChatPreview() {
  const [step,   setStep]   = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (step >= chatMessages.length) return;
    const delay = chatMessages[step].role === "ai" ? 800 : 400;
    const timer = setTimeout(() => {
      if (chatMessages[step].role === "ai") {
        setTyping(true);
        setTimeout(() => { setTyping(false); setStep(s => s + 1); }, 1100);
      } else setStep(s => s + 1);
    }, step === 0 ? 500 : 900);
    return () => clearTimeout(timer);
  }, [step]);

  const shown = chatMessages.slice(0, step);

  return (
    <div className="bg-[#111113] border border-[#222226] rounded-3xl overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1a1a1e] bg-[#0d0d0f]">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8622A] to-[#D4A017] flex items-center justify-center text-black font-extrabold text-sm font-serif">ML</div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#2EB87A] rounded-full border-2 border-[#0d0d0f]" />
        </div>
        <div>
          <p className="font-semibold text-sm text-white m-0">MoneyLens AI</p>
          <p className="text-[0.7rem] text-[#2EB87A] m-0">Online · Analysing your statement</p>
        </div>
      </div>

      {/* Messages */}
      <div className="px-6 pt-6 pb-0 min-h-[260px] flex flex-col gap-3">
        {shown.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 text-[0.8rem] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#E8622A] text-white rounded-[18px_18px_4px_18px]"
                  : "bg-[#1a1a1e] text-zinc-300 rounded-[18px_18px_18px_4px]"
              }`}
              style={{ animation: "fadeUp 0.3s ease forwards" }}
            >
              <p className="whitespace-pre-line m-0">{msg.text}</p>
              {msg.cards && msg.cards.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {msg.cards.map((c, j) => (
                    <span key={j} className="bg-[#E8622A]/18 text-[#E8622A] border border-[#E8622A]/30 rounded-xl px-2.5 py-0.5 text-[0.7rem] font-bold">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-1 px-4 py-3 bg-[#1a1a1e] rounded-[18px_18px_18px_4px] w-fit items-center">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 bg-[#E8622A] rounded-full" style={{ animation: `chatBounce 1s ${i * 0.2}s infinite` }} />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-4">
        <div className="bg-[#1a1a1e] rounded-2xl flex items-center gap-2.5 px-4 py-2.5">
          <input readOnly placeholder="Ask about your spending…" className="flex-1 bg-transparent border-none outline-none text-[0.8rem] text-zinc-500" />
          <button className="w-7 h-7 bg-[#E8622A] rounded-xl border-none cursor-pointer text-white text-sm flex items-center justify-center">→</button>
        </div>
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {["Cut food spend", "Best SIP for me", "Subscription audit"].map((s, i) => (
            <button key={i} className="text-[0.7rem] bg-transparent border border-[#222226] rounded-xl px-2.5 py-1 text-zinc-500 cursor-pointer">{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function MoneyLensLanding() {
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);

   useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="bg-[#0a0a0c] text-zinc-200 overflow-x-hidden">


      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-25"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")` }}
      />

      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? "bg-[#0a0a0c]/85 backdrop-blur-xl border-b border-[#1a1a1e]" : "bg-transparent border-b border-transparent"}`}>
        <div className="max-w-[1200px] mx-auto px-8 py-[1.1rem] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-[34px] h-[34px] bg-gradient-to-br from-[#E8622A] to-[#D4A017] rounded-xl flex items-center justify-center font-serif text-lg text-black">
              M
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#2EB87A] rounded-full" style={{ animation: "pulseDot 2s infinite" }} />
            </div>
            <span className="font-extrabold text-[1.1rem] tracking-tight text-white" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>MoneyLens</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-500">
            {[["features","Features"],["how","How it works"],["security","Security"],["pricing","Pricing"]].map(([id,label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="bg-transparent border-none cursor-pointer text-zinc-500 hover:text-zinc-200 transition-colors font-semibold text-sm"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                {label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
            onClick={()=>router.push('/login')}
            className="bg-transparent border-none cursor-pointer text-zinc-500 text-sm font-semibold hover:text-zinc-200 transition-colors" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Log in</button>
            <button onClick={() => scrollTo("upload")}
              className="inline-flex items-center gap-2 px-[1.4rem] py-2.5 bg-[#E8622A] hover:bg-[#f0733c] text-white font-bold text-[0.8rem] rounded-full border-none cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-95"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Try free →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-grid-bg relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
        <div className="absolute top-[30%] left-[20%] w-[600px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(232,98,42,0.07) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(155,111,216,0.05) 0%, transparent 70%)" }} />

        <div className="max-w-[1200px] mx-auto px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-16 lg:gap-20 items-center">

            {/* LEFT */}
            <div>
              <div className="mb-7">
                <span className="inline-flex items-center gap-1.5 bg-[#E8622A]/8 border border-[#E8622A]/18 text-[#E8622A] text-[0.68rem] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2EB87A] inline-block" />
                  India's smartest expense analyser
                </span>
              </div>

              <h1 className="font-serif text-white mb-6" style={{ fontSize: "clamp(3.5rem,7vw,6rem)" }}>
                Know where<br />
                every <span className="text-shimmer">rupee</span><br />
                goes.
              </h1>

              <p className="text-zinc-500 text-[1.1rem] leading-relaxed max-w-[420px] mb-8 font-normal">
                Upload your bank statement. Get AI-powered spending breakdowns,
                personalised saving ideas, and wealth projections in under 30 seconds.
              </p>

              <div className="flex gap-3 flex-wrap mb-8">
                <button onClick={() => scrollTo("upload")}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#E8622A] hover:bg-[#f0733c] text-white font-bold text-[0.9rem] rounded-full border-none cursor-pointer transition-all hover:-translate-y-px"
                  style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  Analyse my statement →
                </button>
                <button onClick={() => scrollTo("how")}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-transparent hover:border-zinc-500 hover:text-zinc-200 text-zinc-400 text-[0.9rem] font-semibold border border-[#27272a] rounded-full cursor-pointer transition-all"
                  style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  See how it works
                </button>
              </div>

              <div className="flex gap-6 text-xs text-zinc-600">
                {["256-bit encrypted", "No account needed", "All Indian banks"].map((t, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="text-[#2EB87A] text-[0.6rem]">●</span> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT – Dashboard */}
            <div className="relative">
              {/* Floating insight */}
              <div className="ml-float absolute -top-5 -left-5 z-20 bg-[#111113] border border-[#222226] rounded-2xl px-4 py-3 flex items-center gap-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <div className="w-8 h-8 rounded-xl bg-[#2EB87A]/10 flex items-center justify-center text-base">💡</div>
                <div>
                  <p className="text-[0.65rem] text-zinc-600 mb-0.5">AI Insight</p>
                  <p className="text-[0.8rem] font-bold text-white">Cancel 3 unused subs · Save ₹1,840/mo</p>
                </div>
              </div>

              <div className="bg-[#111113] border border-[#1e1e22] rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
                {/* Dashboard header */}
                <div className="bg-[#0d0d0f] p-6 border-b border-[#1a1a1e] flex justify-between items-end">
                  <div>
                    <p className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-zinc-600">March 2026 Analysis</p>
                    <p className="font-serif text-[2.25rem] text-white mt-1">₹1,84,720 <span className="text-base font-sans text-zinc-600">spent</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.7rem] text-zinc-600">Potential monthly savings</p>
                    <p className="font-serif text-2xl text-[#2EB87A]">+₹31,200</p>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-3">Savings: Actual vs. With MoneyLens</p>
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={savingsGrowth}>
                        <defs>
                          <linearGradient id="mlG"  x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#E8622A" stopOpacity="0.45"/><stop offset="100%" stopColor="#E8622A" stopOpacity="0"/></linearGradient>
                          <linearGradient id="actG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#3A9FD8" stopOpacity="0.25"/><stop offset="100%" stopColor="#3A9FD8" stopOpacity="0"/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                        <XAxis dataKey="month" stroke="#2a2a2e" tick={{ fontSize: 10, fill: "#52525b" }} />
                        <YAxis stroke="#2a2a2e"  tick={{ fontSize: 10, fill: "#52525b" }} tickFormatter={v => `₹${(v as number)/1000}K`} />
                        <Tooltip contentStyle={{ background:"#111113", border:"1px solid #222226", borderRadius:10, fontSize:12 }}
                          formatter={(v,n) => [`₹${(v as number).toLocaleString("en-IN")}`, n==="withML"?"With MoneyLens":"Actual"]} />
                        <Area type="monotone" dataKey="actual" stroke="#3A9FD8" fill="url(#actG)" strokeWidth={1.5} />
                        <Area type="monotone" dataKey="withML" stroke="#E8622A" fill="url(#mlG)"  strokeWidth={2}   />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-zinc-600 mt-5 mb-2.5">Top spending categories</p>
                  <div className="flex flex-col gap-2">
                    {spendingCategories.map((cat, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: cat.fill }} />
                        <span className="text-[0.8rem] text-zinc-400 flex-1">{cat.name}</span>
                        <div className="w-20 bg-[#1a1a1e] rounded h-1">
                          <div className="h-full rounded" style={{ width: `${cat.pct}%`, background: cat.fill }} />
                        </div>
                        <span className="font-mono-ml text-xs text-zinc-200 w-14 text-right">₹{(cat.value/1000).toFixed(1)}K</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Streak badge */}
              <div className="absolute -bottom-4 -right-4 z-20 bg-gradient-to-br from-[#D4A017] to-[#E8622A] rounded-2xl p-3.5 text-center shadow-[0_16px_40px_rgba(232,98,42,0.3)]">
                <div className="text-2xl leading-none">🔥</div>
                <div className="font-serif text-[1.6rem] text-black leading-none">14</div>
                <div className="text-[0.6rem] font-extrabold text-black tracking-[0.1em] uppercase">Day Streak</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── BANK MARQUEE ── */}
      <div className="border-t border-b border-[#1a1a1e] py-4 overflow-hidden bg-[#0d0d0f]">
        <div className="ml-marquee flex whitespace-nowrap">
          {Array(2).fill(null).map((_, ri) => (
            <div key={ri} className="flex gap-12 items-center mr-12">
              {["HDFC Bank","SBI","ICICI Bank","Axis Bank","Kotak","Yes Bank","IndusInd","IDFC First","Federal Bank","BOB","PNB","Canara Bank"].map((b, i) => (
                <span key={i} className="text-[0.6rem] font-bold tracking-[0.14em] uppercase text-zinc-600">
                  {b} <span className="text-[#E8622A] mx-4">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="py-20 px-8 border-b border-[#1a1a1e]">
        <div className="max-w-[900px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <StatCounter value={4200000} prefix="₹" suffix="+" label="Savings identified"   />
          <StatCounter value={18000}   suffix="+"               label="Statements analysed" />
          <StatCounter value={94}      suffix="%"               label="Saved in month 1"    />
          <StatCounter value={6200}    prefix="₹" suffix="/mo"  label="Average leaks found" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-8">
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 bg-[#E8622A]/8 border border-[#E8622A]/18 text-[#E8622A] text-[0.68rem] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full mb-6">Process</span>
              <h2 className="font-serif text-white mt-4" style={{ fontSize: "clamp(2.5rem,5vw,4rem)" }}>
                30 seconds to<br /><span className="text-shimmer">total clarity.</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num:"01", icon:"📤", title:"Upload your statement", desc:"Drag-drop your PDF, CSV, or Excel from HDFC, SBI, ICICI, Axis and 20+ banks. Encrypted end-to-end.",                                                          color:"#E8622A" },
              { num:"02", icon:"🧠", title:"AI does the heavy lifting", desc:"Our model categorises every transaction, spots patterns, detects leaks, and generates personalised saving strategies.",                                       color:"#9B6FD8" },
              { num:"03", icon:"📈", title:"See your wealth potential", desc:"Charts, AI insights, investment projections, and a personal finance coach — all in one dashboard.",                                                           color:"#2EB87A" },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-[#111113] border border-[#1e1e22] rounded-[20px] hover:border-[#2a2a2e] transition-colors p-8 relative overflow-hidden h-full">
                  <div className="absolute top-3 right-4 font-serif text-[5rem] text-[#1a1a1e] leading-none select-none">{step.num}</div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[22px] mb-5 relative z-10" style={{ background: `${step.color}15` }}>{step.icon}</div>
                  <h3 className="font-bold text-[1.1rem] text-white mb-2.5" style={{ fontFamily: "'Cabinet Grotesk',sans-serif" }}>{step.title}</h3>
                  <p className="text-[0.85rem] text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-8 bg-[#0d0d0f] border-t border-b border-[#1a1a1e]">
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 bg-[#E8622A]/8 border border-[#E8622A]/18 text-[#E8622A] text-[0.68rem] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full mb-6">Features</span>
              <h2 className="font-serif text-white mt-4" style={{ fontSize: "clamp(2.5rem,5vw,4rem)" }}>
                Not just charts.<br /><span className="text-shimmer">Actual results.</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a1a1e] rounded-3xl overflow-hidden">
            {[
              { icon:"🔍", title:"Deep Spend Analysis",    desc:"Auto-categorisation across 40+ categories. Trend detection. Week-over-week comparison. Hidden leak finder.",                                             badge:"Core",     color:"#E8622A" },
              { icon:"💡", title:"Smart Saving Ideas",     desc:"MoneyLens finds your specific leaks: unused subscriptions, duplicate payments, impulse UPI spends — with exact ₹ amounts.",                             badge:"Unique",   color:"#D4A017" },
              { icon:"🌱", title:"Wealth Projections",     desc:"See what ₹2,000 saved from Zomato becomes in 5, 10, 20 years via SIP. Real mutual fund benchmarks.",                                                     badge:"Core",     color:"#2EB87A" },
              { icon:"🤖", title:"AI Finance Coach",       desc:"Ask anything. \"What if I cut dining by 40%?\" — get projections, alternatives, and a step-by-step savings plan.",                                      badge:"Unique",   color:"#3A9FD8" },
              { icon:"🔥", title:"Streaks & Goals",        desc:"Build saving habits with daily streaks. Set custom goals — vacation, MacBook, emergency fund. Compete with friends.",                                   badge:"Fun",      color:"#9B6FD8" },
              { icon:"🔒", title:"Bank-Grade Privacy",     desc:"Your data is encrypted, never sold, and deleted after analysis. DPDP Act compliant. Zero data on our servers.",                                         badge:"Security", color:"#71717a" },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="bg-[#0a0a0c] hover:bg-[#0f0f12] p-8 transition-colors">
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-[46px] h-[46px] rounded-2xl flex items-center justify-center text-xl" style={{ background: `${f.color}12` }}>{f.icon}</div>
                    <span className="text-[0.62rem] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-lg border" style={{ border:`1px solid ${f.color}30`, color:f.color, background:`${f.color}08` }}>{f.badge}</span>
                  </div>
                  <h3 className="font-bold text-[1rem] text-zinc-200 mb-1.5" style={{ fontFamily:"'Cabinet Grotesk',sans-serif" }}>{f.title}</h3>
                  <p className="text-[0.82rem] text-zinc-600 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPLOAD ── */}
      <section id="upload" className="py-24 px-8">
        <div className="max-w-[680px] mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 bg-[#E8622A]/8 border border-[#E8622A]/18 text-[#E8622A] text-[0.68rem] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full mb-6">Get Started</span>
              <h2 className="font-serif text-white mt-4" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>Upload your statement</h2>
              <p className="text-zinc-600 mt-3 text-[0.9rem]">Free for your first 3 statements. No card required.</p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div
              className="border-[1.5px] border-dashed border-[#222226] hover:border-[#E8622A]/40 rounded-3xl p-16 text-center cursor-pointer transition-all bg-[#E8622A]/[0.02] hover:bg-[#E8622A]/[0.04]"
            >
              <div className="w-[72px] h-[72px] rounded-[20px] bg-[#E8622A]/8 border border-[#E8622A]/15 flex items-center justify-center text-3xl mx-auto mb-6">📄</div>
              <h3 className="font-bold text-[1.2rem] text-white mb-2" style={{ fontFamily:"'Cabinet Grotesk',sans-serif" }}>Drop your bank statement here</h3>
              <p className="text-zinc-600 text-[0.85rem] mb-7">PDF, CSV, or Excel · Max 10MB · Encrypted instantly</p>
              <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#E8622A] hover:bg-[#f0733c] text-white font-bold text-[0.9rem] rounded-full border-none cursor-pointer transition-all"
                style={{ fontFamily:"'Cabinet Grotesk',sans-serif" }}>
                Choose file to upload
              </button>
              <p className="text-[0.7rem] text-zinc-700 mt-6">HDFC · SBI · ICICI · Axis · Kotak · Yes Bank · IndusInd · IDFC First · BOB · PNB + more</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── AI CHAT + SIP ── */}
      <section className="py-24 px-8 bg-[#0d0d0f] border-t border-b border-[#1a1a1e]">
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 bg-[#E8622A]/8 border border-[#E8622A]/18 text-[#E8622A] text-[0.68rem] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full mb-6">Intelligence</span>
              <h2 className="font-serif text-white mt-4" style={{ fontSize: "clamp(2.5rem,5vw,4rem)" }}>
                Your personal<br /><span className="text-shimmer">wealth advisor.</span>
              </h2>
              <p className="text-zinc-600 mt-4 max-w-[400px] mx-auto">Ask anything about your money. Get real answers with numbers, not vague tips.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Reveal delay={50}><AIChatPreview /></Reveal>
            <Reveal delay={150}><SIPCalculator /></Reveal>
          </div>
        </div>
      </section>

      {/* ── WHAT IF TIMELINE ── */}
      <section className="py-24 px-8">
        <div className="max-w-[680px] mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 bg-[#E8622A]/8 border border-[#E8622A]/18 text-[#E8622A] text-[0.68rem] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full mb-6">The Realisation</span>
              <h2 className="font-serif text-white mt-4" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>₹2,800/month<br />on food delivery</h2>
              <p className="text-zinc-600 mt-3">What if you redirected that into a SIP?</p>
            </div>
          </Reveal>

          <div className="relative">
            <div className="absolute left-5 top-7 bottom-7 w-px" style={{ background: "linear-gradient(to bottom, #E8622A, #D4A017, #2EB87A)" }} />
            <div className="flex flex-col gap-6">
              {[
                { time:"Right now",    title:"₹2,800 spent this month",   sub:"33,600 calories and zero wealth gained.",                                         color:"#E8622A" },
                { time:"After 1 year", title:"₹33,600 gone",              sub:"That's a weekend trip to Goa + ₹5K emergency fund.",                             color:"#D4A017" },
                { time:"After 5 years",title:"₹2.4 Lakh opportunity cost",sub:"Invested in Nifty 50 that would be ₹2.4L → ₹4.2L.",                            color:"#F07230" },
                { time:"After 10 years",title:"₹8.7 Lakh potential",      sub:"A down payment. An international holiday. An emergency corpus.",                 color:"#2EB87A" },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div className="flex items-center gap-6 pl-14 relative">
                    <div className="absolute left-3 w-[18px] h-[18px] rounded-full border-2 bg-[#0a0a0c] flex items-center justify-center" style={{ borderColor: item.color }} />
                    <div className="bg-[#111113] border border-[#1e1e22] rounded-[20px] hover:border-[#2a2a2e] transition-colors px-6 py-5 flex-1">
                      <p className="text-[0.65rem] font-bold tracking-[0.1em] uppercase mb-1.5" style={{ color: item.color }}>{item.time}</p>
                      <h3 className="font-bold text-[1.1rem] text-white mb-1" style={{ fontFamily:"'Cabinet Grotesk',sans-serif" }}>{item.title}</h3>
                      <p className="text-[0.82rem] text-zinc-500">{item.sub}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROJECTIONS ── */}
      <section id="projections" className="py-24 px-8 bg-[#0d0d0f] border-t border-b border-[#1a1a1e]">
        <div className="max-w-[1000px] mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 bg-[#E8622A]/8 border border-[#E8622A]/18 text-[#E8622A] text-[0.68rem] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full mb-6">Projections</span>
              <h2 className="font-serif text-white mt-4" style={{ fontSize: "clamp(2.5rem,5vw,4rem)" }}>
                From spending report<br /><span className="text-shimmer">to investment plan.</span>
              </h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="bg-[#111113] border border-[#1e1e22] rounded-[20px] p-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { label:"You spend on food delivery",  val:"₹4,200/mo",   note:"Based on 847 users"    },
                  { label:"Average we help cut by",      val:"60%",          note:"Without feeling deprived" },
                  { label:"That's a potential SIP of",   val:"₹2,520/mo",   note:"Starting next month"   },
                ].map((s, i) => (
                  <div key={i} className="bg-[#0d0d0f] rounded-2xl p-5 text-center">
                    <p className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-2">{s.label}</p>
                    <p className="font-serif text-[2rem] text-[#E8622A]">{s.val}</p>
                    <p className="text-[0.7rem] text-zinc-700 mt-1">{s.note}</p>
                  </div>
                ))}
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { year:"5 Yrs",  invested:151200, returns:220000  },
                    { year:"10 Yrs", invested:302400, returns:587000  },
                    { year:"15 Yrs", invested:453600, returns:1260000 },
                    { year:"20 Yrs", invested:604800, returns:2540000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                    <XAxis dataKey="year" stroke="#2a2a2e" tick={{ fontSize:12, fill:"#52525b" }} />
                    <YAxis stroke="#2a2a2e"  tick={{ fontSize:11, fill:"#52525b" }} tickFormatter={v => (v as number)>=100000?`₹${((v as number)/100000).toFixed(0)}L`:String(v)} />
                    <Tooltip contentStyle={{ background:"#111113", border:"1px solid #222226", borderRadius:10, fontSize:12 }}
                      formatter={(v,n) => [`₹${(v as number).toLocaleString("en-IN")}`, n==="returns"?"Future Value":"Invested"]} />
                    <Bar dataKey="invested" fill="#3A9FD8" fillOpacity={0.4} radius={[6,6,0,0]} />
                    <Bar dataKey="returns"  fill="#E8622A"                   radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-[0.7rem] text-zinc-700 mt-4">₹2,520/month SIP · 12% p.a. CAGR (Nifty 50 historical) · Compounded monthly</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── LEAKS FOUND ── */}
      <section className="py-24 px-8">
        <div className="max-w-[1000px] mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 bg-[#E8622A]/8 border border-[#E8622A]/18 text-[#E8622A] text-[0.68rem] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full mb-5">What we find</span>
              <h2 className="font-serif text-white mt-4" style={{ fontSize: "clamp(2.5rem,5vw,4rem)" }}>
                Leaks most people<br />never notice.
              </h2>
              <p className="text-zinc-500 mt-3 text-[0.9rem]">These are real patterns MoneyLens catches across Indian bank statements.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                tag: "Subscription overlap",
                icon: "📱",
                color: "#9B6FD8",
                leak: "₹1,840 / month",
                txns: ["Netflix ₹649", "Amazon Prime ₹179", "YouTube Premium ₹189", "JioCinema ₹299"],
                insight: "You have 4 video streaming plans. Usage data shows only 1 is opened more than once a week.",
              },
              {
                tag: "Food delivery inflation",
                icon: "🛵",
                color: "#E8622A",
                leak: "₹4,200 / month",
                txns: ["Swiggy ×23 orders", "Zomato ×19 orders", "Avg ₹249/order, ₹49 delivery fee"],
                insight: "Your food delivery spend rose 61% in 3 months. Cooking just 10 of those meals saves ₹1,800.",
              },
              {
                tag: "Forgotten SaaS trials",
                icon: "💳",
                color: "#3A9FD8",
                leak: "₹620 / month",
                txns: ["Canva Pro ₹499 (last used: 4 mo ago)", "Grammarly ₹121 (last used: 6 mo ago)"],
                insight: "2 software subscriptions auto-renewed with zero recent usage detected.",
              },
              {
                tag: "UPI impulse pattern",
                icon: "⚡",
                color: "#D4A017",
                leak: "₹3,100 / month",
                txns: ["Late-night transfers (10 pm–1 am)", "Avg ₹380 per impulse transaction", "Spike on weekends: +82%"],
                insight: "68% of your discretionary UPI spends happen after 9 pm. A simple nudge could cut this by half.",
              },
            ].map((card, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="bg-[#111113] border border-[#1e1e22] hover:border-[#2a2a2e] rounded-2xl p-6 transition-colors">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: `${card.color}15` }}>{card.icon}</div>
                      <span className="text-[0.7rem] font-bold tracking-[0.08em] uppercase text-zinc-500">{card.tag}</span>
                    </div>
                    <span className="font-serif text-[1.15rem] font-bold" style={{ color: card.color }}>{card.leak}</span>
                  </div>

                  {/* Transaction pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {card.txns.map((t, j) => (
                      <span key={j} className="text-[0.68rem] bg-[#1a1a1e] text-zinc-400 px-2.5 py-1 rounded-lg">{t}</span>
                    ))}
                  </div>

                  {/* AI insight */}
                  <div className="flex items-start gap-2 bg-[#0d0d0f] rounded-xl px-3.5 py-3">
                    <span className="text-[0.7rem] mt-0.5 flex-shrink-0">🤖</span>
                    <p className="text-[0.78rem] text-zinc-400 leading-relaxed">{card.insight}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Bottom total */}
          <Reveal delay={200}>
            <div className="mt-8 bg-[#111113] border border-[#1e1e22] rounded-2xl px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[0.65rem] font-bold tracking-[0.12em] uppercase text-zinc-600 mb-1">Total leaks identified above</p>
                <p className="font-serif text-[2rem] text-[#E8622A]">₹9,760 <span className="text-base font-sans text-zinc-600">/ month</span></p>
              </div>
              <div className="text-right">
                <p className="text-[0.65rem] text-zinc-600 mb-1">If invested in a SIP @ 12% p.a.</p>
                <p className="font-serif text-xl text-[#2EB87A]">₹22.4L in 10 years</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section id="security" className="py-20 px-8 bg-[#0d0d0f] border-t border-b border-[#1a1a1e]">
        <div className="max-w-[900px] mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 bg-[#2EB87A]/8 border border-[#2EB87A]/20 text-[#2EB87A] text-[0.68rem] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full mb-5">Security</span>
              <h2 className="font-serif text-white mt-4" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
                Your statement is safe.<br />Here's exactly how.
              </h2>
            </div>
          </Reveal>

          {/* 4-step flow */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: "📤", step: "Upload",    detail: "TLS 1.3 encrypted in transit",   color: "#2EB87A" },
              { icon: "🔐", step: "Stored",    detail: "AES-256 encrypted at rest",      color: "#3A9FD8" },
              { icon: "🧠", step: "Analysed",  detail: "Isolated sandbox, never shared", color: "#9B6FD8" },
              { icon: "🗑️", step: "Deleted",   detail: "Raw file gone within 24 hours",  color: "#E8622A" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 70}>
                <div className="bg-[#111113] border border-[#1e1e22] rounded-2xl p-5 text-center hover:border-[#2a2a2e] transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mx-auto mb-3" style={{ background: `${s.color}15` }}>{s.icon}</div>
                  <p className="font-bold text-white text-[0.88rem] mb-1">{s.step}</p>
                  <p className="text-[0.72rem] text-zinc-500 leading-snug">{s.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Guarantees */}
          <Reveal delay={100}>
            <div className="bg-[#111113] border border-[#1e1e22] rounded-2xl px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { ok: true,  text: "No banking credentials or login required" },
                { ok: true,  text: "DPDP Act 2023 compliant" },
                { ok: false, text: "We never sell or share your data" },
                { ok: false, text: "Raw file never stored beyond 24 h" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[0.82rem] text-zinc-400">
                  <span className={`font-bold text-xs flex-shrink-0 ${item.ok ? "text-[#2EB87A]" : "text-red-400"}`}>{item.ok ? "✓" : "✕"}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

            {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-8 bg-[#0a0a0c] border-t border-b border-[#1a1a1e]">
        <div className="max-w-[960px] mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 bg-[#E8622A]/8 border border-[#E8622A]/18 text-[#E8622A] text-[0.68rem] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full mb-6">Pricing</span>
              <h2 className="font-serif text-white mt-4" style={{ fontSize: "clamp(2.5rem,5vw,4rem)" }}>Simple. Fair. Worth it.</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name:"Starter", price:"Free",  period:"forever",  desc:"Try it risk-free",        highlight:false,
                features:["3 statement analyses","Spending charts","Category breakdown","Basic saving tips"],
                cta:"Start free" },
              { name:"Pro",     price:"₹199",  period:"/month",   desc:"For the serious saver",   highlight:true,
                features:["Unlimited statements","AI Finance Coach chat","Wealth projections","Saving streaks & goals","Investment recommendations","Priority support"],
                cta:"Start Pro trial" },
              { name:"Family",  price:"₹349",  period:"/month",   desc:"For the whole family",    highlight:false,
                features:["5 member accounts","Everything in Pro","Family spending overview","Shared goals","Monthly family report","Dedicated advisor"],
                cta:"Get Family plan" },
            ].map((plan, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className={`relative overflow-hidden rounded-3xl p-8 flex flex-col h-full ${plan.highlight ? "bg-[#E8622A]" : "bg-[#111113] border border-[#1e1e22]"}`}>
                  {plan.highlight && (
                    <div className="absolute top-4 right-4 text-[0.6rem] font-bold tracking-[0.1em] uppercase bg-black/20 text-white px-2.5 py-1 rounded-lg">Most popular</div>
                  )}
                  <div className="mb-6">
                    <p className={`text-[0.7rem] font-bold tracking-[0.1em] uppercase mb-1.5 ${plan.highlight ? "text-white/60" : "text-zinc-600"}`}>{plan.name}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-serif text-[2.5rem] text-white">{plan.price}</span>
                      <span className={`text-[0.8rem] ${plan.highlight ? "text-white/60" : "text-zinc-600"}`}>{plan.period}</span>
                    </div>
                    <p className={`text-[0.82rem] mt-1 ${plan.highlight ? "text-white/75" : "text-zinc-500"}`}>{plan.desc}</p>
                  </div>

                  <ul className="flex flex-col gap-2.5 flex-1 mb-6 list-none p-0">
                    {plan.features.map((f, j) => (
                      <li key={j} className={`flex items-center gap-2 text-[0.82rem] ${plan.highlight ? "text-white/90" : "text-zinc-400"}`}>
                        <span className={`font-bold ${plan.highlight ? "text-white" : "text-[#2EB87A]"}`}>✓</span> {f}
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full py-3.5 rounded-full font-bold text-[0.85rem] cursor-pointer transition-all border-none text-white ${plan.highlight ? "bg-black hover:bg-zinc-900" : "bg-[#E8622A] hover:bg-[#f0733c]"}`}
                    style={{ fontFamily:"'Cabinet Grotesk',sans-serif" }}>
                    {plan.cta}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-8 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(232,98,42,0.1) 0%, transparent 65%)" }} />
        <div className="ml-spin absolute top-1/2 left-1/2 -ml-[300px] -mt-[300px] w-[600px] h-[600px] border border-[#E8622A]/7 rounded-full pointer-events-none" />

        <div className="max-w-[640px] mx-auto relative z-10">
          <Reveal>
            <div className="text-4xl mb-6">🔍</div>
            <h2 className="font-serif text-white mb-5" style={{ fontSize: "clamp(3rem,6vw,5rem)" }}>
              Your money<br />deserves a<br /><span className="text-shimmer">lens.</span>
            </h2>
            <p className="text-zinc-500 text-[1.05rem] mb-10 leading-relaxed">
              Upload your first statement free. No credit card. No jargon. Just clarity.
            </p>
            <button onClick={() => scrollTo("upload")}
              className="inline-flex items-center gap-2 text-[1rem] px-10 py-4 bg-[#E8622A] hover:bg-[#f0733c] text-white font-bold rounded-full border-none cursor-pointer transition-all hover:-translate-y-px"
              style={{ fontFamily:"'Cabinet Grotesk',sans-serif" }}>
              Analyse my statement free →
            </button>
            <p className="text-[0.7rem] text-zinc-700 mt-5">3 free analyses · No card required · Cancel anytime</p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1a1a1e] bg-[#0a0a0c] px-8 pt-16 pb-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#E8622A] to-[#D4A017] rounded-xl flex items-center justify-center font-serif text-lg text-black">M</div>
                <span className="font-extrabold text-[1rem] text-white" style={{ fontFamily:"'Cabinet Grotesk',sans-serif" }}>MoneyLens</span>
              </div>
              <p className="text-[0.82rem] text-zinc-600 leading-relaxed">AI-powered expense analysis for smarter, wealthier Indians.</p>
            </div>
            {[
              { title:"Product", links:["Features","How it Works","Pricing","Changelog"] },
              { title:"Company", links:["About","Blog","Careers","Press"]                },
              { title:"Legal",   links:["Privacy Policy","Terms of Use","Security","DPDP Act"] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-4">{col.title}</p>
                <ul className="flex flex-col gap-2.5 list-none p-0">
                  {col.links.map((l, j) => (
                    <li key={j}>
                      <a href="#" className="text-[0.82rem] text-zinc-600 hover:text-zinc-200 no-underline transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-[#1a1a1e] pt-6 flex flex-wrap justify-between items-center gap-4">
            <p className="text-[0.72rem] text-zinc-700">© 2026 MoneyLens Technologies Pvt. Ltd. · Made with ❤️ in India</p>
            <div className="flex gap-6">
              {["Twitter","LinkedIn","Instagram"].map((s, i) => (
                <a key={i} href="#" className="text-[0.72rem] text-zinc-700 hover:text-zinc-500 no-underline transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <button onClick={() => scrollTo("upload")}
        className="fixed bottom-8 right-8 z-50 w-[52px] h-[52px] bg-gradient-to-br from-[#E8622A] to-[#D4A017] rounded-2xl border-none cursor-pointer text-[22px] flex items-center justify-center shadow-[0_8px_30px_rgba(232,98,42,0.4)] hover:scale-110 transition-transform"
        title="Try MoneyLens Free">🤖
      </button>

    </div>
  );
}
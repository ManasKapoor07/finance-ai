"use client";

import { useParams } from "next/navigation";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  LayoutDashboard, FileText, CreditCard, Sparkles, Settings,
  Upload, TrendingDown, AlertCircle, Zap, ChevronRight,
  Wallet, ShoppingBag, Utensils, Car, Wifi, MoreHorizontal,
  Bell, ArrowUpRight, ArrowDownRight, Target, Activity,
} from "lucide-react";
import { useGetStatementByIdQuery } from "@/app/redux/api/authApi";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  balance: number;
  category: string;
  subCategory: string | null;
}

interface Insight {
  id: string;
  type: string;
  label: string;
  value: string;
  meta: string | null;
}

interface DashboardData {
  id: string;
  originalFileName: string;
  status: string;
  createdAt: string;
  transactions: Transaction[];
  insights: Insight[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CAT: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  "Food & Dining":   { color: "#FF6B35", bg: "rgba(255,107,53,0.1)",   border: "rgba(255,107,53,0.2)",   icon: Utensils },
  "Shopping":        { color: "#A78BFA", bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.2)",  icon: ShoppingBag },
  "Transport":       { color: "#38BDF8", bg: "rgba(56,189,248,0.1)",   border: "rgba(56,189,248,0.2)",   icon: Car },
  "Utilities":       { color: "#34D399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.2)",   icon: Wifi },
  "Cash Withdrawal": { color: "#FBBF24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.2)",   icon: Wallet },
  "Other":           { color: "#6B7280", bg: "rgba(107,114,128,0.1)",  border: "rgba(107,114,128,0.2)",  icon: MoreHorizontal },
};
const cat = (k: string) => CAT[k] ?? CAT["Other"];

const CHART_COLORS = ["#FF6B35","#A78BFA","#38BDF8","#34D399","#FBBF24","#F472B6"];

// clean "UPI-ZOMATO-PAYZOMATO@HDFCBANK..." → "Zomato"
const clean = (d: string) =>
  d.replace(/^UPI-/, "")
   .replace(/@[^\s]+/g, "")
   .split("-")[0]
   .trim()
   .toLowerCase()
   .replace(/\b\w/g, c => c.toUpperCase())
   .slice(0, 26) || d.slice(0, 26);

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({ active = "Overview" }: { active?: string }) {
  const nav = [
    { label: "Overview",     icon: LayoutDashboard },
    { label: "Statements",   icon: FileText },
    { label: "Transactions", icon: CreditCard },
    { label: "AI Insights",  icon: Sparkles },
    { label: "Settings",     icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#0c0c0e] border-r border-white/[0.06] px-4 py-7 gap-8">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#f59e0b] flex items-center justify-center font-black text-black text-sm">M</div>
        <span className="font-black text-[15px] tracking-tight text-white">MoneyLens</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {nav.map(({ label, icon: Icon }) => {
          const on = label === active;
          return (
            <button key={label} className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
              ${on
                ? "bg-[#FF6B35]/12 text-[#FF6B35] border border-[#FF6B35]/20"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
              }
            `}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {on && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />}
            </button>
          );
        })}
      </nav>

      {/* Upload */}
      <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#ff7d4a] text-white text-[13px] font-bold transition-all active:scale-95">
        <Upload className="w-3.5 h-3.5" />
        Upload Statement
      </button>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────────────────────

function Topbar({ file, month }: { file: string; month: string }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-7 py-4 bg-[#0c0c0e]/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold">Statement · {month}</p>
          <p className="text-[13px] text-zinc-300 font-medium truncate max-w-xs mt-0.5">{file}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
          <Bell className="w-3.5 h-3.5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#f59e0b] flex items-center justify-center text-black font-black text-xs">U</div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO ROW — Balance + 3 stat pills
// ─────────────────────────────────────────────────────────────────────────────

function HeroRow({ insights, transactions }: { insights: Insight[]; transactions: Transaction[] }) {
  const s = (label: string) => insights.find(i => i.type === "SUMMARY" && i.label === label)?.value ?? "—";
  const lastBal = transactions[0]?.balance ?? 0;
  const month   = insights.find(i => i.type === "MONTHLY_TREND")?.label ?? "";
  const debits  = transactions.filter(t => t.type === "DEBIT").length;
  const credits = transactions.filter(t => t.type === "CREDIT").length;

  const pills = [
    { label: "Total Debits",  value: s("Total Spent"),    icon: ArrowDownRight, color: "#FF6B35", glow: "shadow-[0_0_24px_rgba(255,107,53,0.15)]" },
    { label: "Total Credits", value: s("Total Received"), icon: ArrowUpRight,   color: "#34D399", glow: "shadow-[0_0_24px_rgba(52,211,153,0.15)]" },
    { label: "Net Flow",      value: s("Net Flow"),       icon: Activity,       color: "#A78BFA", glow: "shadow-[0_0_24px_rgba(167,139,250,0.15)]" },
    { label: "Transactions",  value: s("Total Transactions"), icon: Target,     color: "#38BDF8", glow: "shadow-[0_0_24px_rgba(56,189,248,0.15)]" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Main balance card */}
      <div className="lg:col-span-2 relative rounded-2xl bg-gradient-to-br from-[#141416] to-[#0f0f11] border border-white/[0.07] p-6 overflow-hidden">
        {/* Glow blob */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF6B35]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6B35]/30 to-transparent" />

        <p className="text-[11px] text-zinc-600 uppercase tracking-[0.15em] font-semibold mb-3">Current Balance</p>
        <p className="text-4xl font-black tracking-tighter text-white mb-1">
          ₹{lastBal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="flex items-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
            {month}
          </span>
          <span className="text-[11px] text-zinc-600">{debits} debits · {credits} credits</span>
        </div>
      </div>

      {/* Stat pills */}
      {pills.map(({ label, value, icon: Icon, color, glow }, i) => (
        <div key={i} className={`rounded-2xl bg-[#141416] border border-white/[0.07] p-5 flex flex-col justify-between ${glow} hover:border-white/[0.12] transition-all`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] text-zinc-600 uppercase tracking-[0.12em] font-semibold">{label}</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
          </div>
          <p className="text-xl font-black tracking-tight" style={{ color }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARTS ROW
// ─────────────────────────────────────────────────────────────────────────────

function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const grouped: Record<string, number> = {};
  [...transactions].reverse().forEach(tx => {
    if (tx.type !== "DEBIT") return;
    grouped[tx.date] = (grouped[tx.date] ?? 0) + tx.amount;
  });
  const data = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date: date.slice(8), amount: Math.round(amount) }));

  return (
    <div className="rounded-2xl bg-[#141416] border border-white/[0.07] p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-white">Daily Spend</h3>
          <p className="text-[12px] text-zinc-600 mt-0.5">Debit outflow per day</p>
        </div>
        <span className="text-[11px] text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-2.5 py-1 rounded-lg font-semibold">This Month</span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#FF6B35" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
            <XAxis dataKey="date" stroke="#333" tick={{ fontSize: 10, fill: "#52525b" }} />
            <YAxis stroke="#333" tick={{ fontSize: 10, fill: "#52525b" }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ background: "#1a1a1e", border: "1px solid #2a2a2e", borderRadius: 10, fontSize: 12, color: "#fff" }}
              formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Spent"]}
              labelStyle={{ color: "#71717a" }}
            />
            <Area type="monotone" dataKey="amount" stroke="#FF6B35" strokeWidth={1.5} fill="url(#sg)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BalanceChart({ transactions }: { transactions: Transaction[] }) {
  const data = [...transactions]
    .reverse()
    .filter((_, i) => i % 4 === 0)
    .map(tx => ({ date: tx.date.slice(8), balance: tx.balance }));

  return (
    <div className="rounded-2xl bg-[#141416] border border-white/[0.07] p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-white">Balance Flow</h3>
          <p className="text-[12px] text-zinc-600 mt-0.5">Running balance across month</p>
        </div>
        <span className="text-[11px] text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-2.5 py-1 rounded-lg font-semibold">Live</span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
            <XAxis dataKey="date" stroke="#333" tick={{ fontSize: 10, fill: "#52525b" }} />
            <YAxis stroke="#333" tick={{ fontSize: 10, fill: "#52525b" }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ background: "#1a1a1e", border: "1px solid #2a2a2e", borderRadius: 10, fontSize: 12, color: "#fff" }}
              formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Balance"]}
              labelStyle={{ color: "#71717a" }}
            />
            <Area type="monotone" dataKey="balance" stroke="#38BDF8" strokeWidth={1.5} fill="url(#bg2)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY PIE
// ─────────────────────────────────────────────────────────────────────────────

function CategoryPie({ insights }: { insights: Insight[] }) {
  const cats = insights.filter(i => i.type === "CATEGORY");
  const pie  = cats.map(c => ({ name: c.label, value: parseFloat(c.value.replace(/[₹,]/g, "")) }));

  return (
    <div className="rounded-2xl bg-[#141416] border border-white/[0.07] p-6">
      <h3 className="text-[15px] font-bold text-white mb-1">Categories</h3>
      <p className="text-[12px] text-zinc-600 mb-5">Spend distribution</p>

      <div className="flex gap-4 items-center">
        <div className="w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pie} cx="50%" cy="50%" innerRadius={42} outerRadius={66} dataKey="value" paddingAngle={2}>
                {pie.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1a1a1e", border: "1px solid #2a2a2e", borderRadius: 10, fontSize: 11 }}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2.5 min-w-0">
          {cats.map((c, i) => {
            const pct = parseFloat(c.meta?.replace("%","") ?? "0");
            const color = CHART_COLORS[i % CHART_COLORS.length];
            return (
              <div key={i}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-zinc-400 truncate pr-2">{c.label}</span>
                  <span className="font-bold text-zinc-300 shrink-0">{c.meta}</span>
                </div>
                <div className="h-1 rounded-full bg-[#1f1f23]">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP MERCHANTS
// ─────────────────────────────────────────────────────────────────────────────

function TopMerchants({ insights }: { insights: Insight[] }) {
  const merchants = insights.filter(i => i.type === "TOP_MERCHANT").slice(0, 7);
  const max = Math.max(...merchants.map(m => parseFloat(m.value.replace(/[₹,]/g, ""))));

  return (
    <div className="rounded-2xl bg-[#141416] border border-white/[0.07] p-6">
      <h3 className="text-[15px] font-bold text-white mb-1">Top Merchants</h3>
      <p className="text-[12px] text-zinc-600 mb-5">Where money went</p>
      <div className="space-y-3.5">
        {merchants.map((m, i) => {
          const amt = parseFloat(m.value.replace(/[₹,]/g, ""));
          const pct = (amt / max) * 100;
          const color = CHART_COLORS[i % CHART_COLORS.length];
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[11px] font-black w-4 text-center shrink-0" style={{ color }}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-zinc-300 truncate font-medium pr-2">{m.label}</span>
                  <span className="font-bold shrink-0" style={{ color }}>{m.value}</span>
                </div>
                <div className="h-1 rounded-full bg-[#1f1f23]">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART INSIGHTS PANEL
// ─────────────────────────────────────────────────────────────────────────────

function InsightsPanel({ insights }: { insights: Insight[] }) {
  const saving = insights.filter(i => i.type === "SAVING_OPPORTUNITY");
  const subs   = insights.filter(i => i.type === "SUBSCRIPTION").slice(0, 4);
  const large  = insights.filter(i => i.type === "LARGEST_TRANSACTION").slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Saving opportunity — hero card */}
      {saving.map((s, i) => (
        <div key={i} className="rounded-2xl p-5 relative overflow-hidden border border-[#34D399]/20 bg-gradient-to-br from-[#34D399]/8 to-[#141416]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#34D399]/8 rounded-full blur-2xl" />
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-[#34D399]" />
            <span className="text-[10px] font-black text-[#34D399] uppercase tracking-[0.15em]">Saving Opportunity</span>
          </div>
          <h4 className="text-[13px] font-bold text-white mb-1">{s.label}</h4>
          <p className="text-2xl font-black text-[#34D399]">{s.value}</p>
          {s.meta && <p className="text-[11px] text-zinc-500 mt-1.5">{s.meta}</p>}
        </div>
      ))}

      {/* Largest transactions */}
      <div className="rounded-2xl bg-[#141416] border border-white/[0.07] p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span className="text-[10px] font-black text-[#FF6B35] uppercase tracking-[0.15em]">Biggest Spends</span>
        </div>
        <div className="space-y-3">
          {large.map((l, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-zinc-300 truncate leading-snug">
                  {l.label.length > 28 ? l.label.slice(0, 28) + "…" : l.label}
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{l.meta}</p>
              </div>
              <p className="text-[12px] font-black text-[#FF6B35] shrink-0">{l.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recurring payments */}
      <div className="rounded-2xl bg-[#141416] border border-white/[0.07] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span className="text-[10px] font-black text-[#FBBF24] uppercase tracking-[0.15em]">Recurring</span>
          </div>
          <button className="text-[10px] text-zinc-600 hover:text-zinc-300 flex items-center gap-0.5 transition-colors">
            All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {subs.map((s, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-zinc-300 truncate">{s.label}</p>
                <p className="text-[10px] text-zinc-600">{s.meta}</p>
              </div>
              <p className="text-[11px] font-black text-[#FBBF24] shrink-0">{s.value.split("·")[0].trim()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTION TABLE
// ─────────────────────────────────────────────────────────────────────────────

function TxTable({ transactions }: { transactions: Transaction[] }) {
  const [show, setShow] = useState(12);
  const [filter, setFilter] = useState<"ALL" | "DEBIT" | "CREDIT">("ALL");

  const visible = transactions
    .filter(tx => filter === "ALL" || tx.type === filter)
    .slice(0, show);

  return (
    <div className="rounded-2xl bg-[#141416] border border-white/[0.07] p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-white">Transactions</h3>
          <p className="text-[12px] text-zinc-600 mt-0.5">{transactions.length} total</p>
        </div>
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-[#0c0c0e] border border-white/[0.06] rounded-xl p-1">
          {(["ALL","DEBIT","CREDIT"] as const).map(f => (
            <button key={f} onClick={() => { setFilter(f); setShow(12); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                filter === f
                  ? f === "DEBIT" ? "bg-red-500/15 text-red-400"
                    : f === "CREDIT" ? "bg-green-500/15 text-green-400"
                    : "bg-white/[0.06] text-white"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-3 mb-2">
        {["Description","Category","Date","Amount"].map(h => (
          <p key={h} className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{h}</p>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {visible.map(tx => {
          const isD = tx.type === "DEBIT";
          const c   = cat(tx.category ?? "Other");
          const Icon = c.icon;
          return (
            <div key={tx.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all group cursor-default">
              {/* Desc */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-zinc-200 truncate leading-snug">{clean(tx.description)}</p>
                  <p className="text-[10px] text-zinc-600">Bal ₹{tx.balance.toFixed(0)}</p>
                </div>
              </div>
              {/* Category */}
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg whitespace-nowrap"
                style={{ background: c.bg, color: c.color }}>
                {tx.category ?? "Other"}
              </span>
              {/* Date */}
              <p className="text-[11px] text-zinc-600 whitespace-nowrap">{tx.date}</p>
              {/* Amount */}
              <p className={`text-[13px] font-black whitespace-nowrap text-right ${isD ? "text-red-400" : "text-green-400"}`}>
                {isD ? "−" : "+"}₹{tx.amount.toLocaleString("en-IN")}
              </p>
            </div>
          );
        })}
      </div>

      {show < transactions.filter(t => filter === "ALL" || t.type === filter).length && (
        <button onClick={() => setShow(s => s + 12)}
          className="mt-4 w-full py-2.5 rounded-xl border border-white/[0.06] text-zinc-500 text-[12px] font-semibold hover:bg-white/[0.03] hover:text-zinc-300 transition-all">
          Load more
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center">
      <div className="text-center space-y-5">
        <div className="relative w-14 h-14 mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#f59e0b] flex items-center justify-center font-black text-black text-xl">M</div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#f59e0b] animate-ping opacity-30" />
        </div>
        <div className="space-y-1">
          <p className="text-white font-bold text-[15px]">Analysing your statement</p>
          <p className="text-zinc-600 text-[13px]">Crunching numbers, finding insights…</p>
        </div>
        <div className="flex justify-center gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]"
              style={{ animation: `bounce 1s ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const params      = useParams();
  const statementId = params.statementId as string;

  const { data: res, isLoading, isError } = useGetStatementByIdQuery(statementId);

  if (isLoading) return <LoadingState />;

  if (isError || !res?.data) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-white font-bold">Could not load statement</p>
          <p className="text-zinc-600 text-sm">Check your connection or try again.</p>
        </div>
      </div>
    );
  }

  const data: DashboardData = res.data;
  const { transactions, insights } = data;
  const month = insights.find(i => i.type === "MONTHLY_TREND")?.label ?? "This Month";

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { background: #0c0c0e; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2e; border-radius: 4px; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>

      <Sidebar active="Overview" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar file={data.originalFileName} month={month} />

        <main className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Page heading */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span className="text-[10px] font-black text-[#FF6B35] uppercase tracking-[0.2em]">Financial Intelligence</span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter">Your Financial Pulse.</h1>
            </div>
            <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-[#FF6B35] text-[12px] font-bold hover:bg-[#FF6B35]/15 transition-all">
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI Coach
            </button>
          </div>

          {/* Hero stats */}
          <HeroRow insights={insights} transactions={transactions} />

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <SpendingChart transactions={transactions} />
            <BalanceChart transactions={transactions} />
          </div>

          {/* Category + Merchants */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <CategoryPie insights={insights} />
            <TopMerchants insights={insights} />
          </div>

          {/* Transactions + Insights */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2">
              <TxTable transactions={transactions} />
            </div>
            <InsightsPanel insights={insights} />
          </div>

        </main>
      </div>
    </div>
  );
}
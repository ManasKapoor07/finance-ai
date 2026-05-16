"use client";

import { useParams } from "next/navigation";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, FileText, CreditCard, Sparkles, Upload,
  Bell, ArrowUpRight, ArrowDownRight, Target, Activity, Calendar,
  Brain, TrendingUp, ListChecks, Lightbulb, CheckCircle2,
  ChevronDown, Users, AlertTriangle,
  Wallet, ShoppingBag, Utensils, Car, Wifi,
  ShoppingCart, RefreshCw, Building2, Receipt, CornerDownLeft,
  ArrowDownToLine, Heart, Clock, Search,
  ChevronLeft, ChevronRight, MoreHorizontal, Filter,
  TrendingDown, Shield, Zap, Eye, AlertCircle,
} from "lucide-react";
import {
  useAnalyzeFinancialProfileMutation,
  useGetStatementByIdQuery,
  useGetDashboardQuery,
  useGetTransactionsQuery,
  useGetRecurringChargesQuery,
  useGetWeeklySpendQuery,
} from "../../redux/api/authApi";
import type { WeeklySpendItem } from "../../redux/api/authApi";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Chart from "chart.js/auto";
import { WeeklySpendRhythm } from "../WeeklyRythum";
import { AIChatPanel } from "../AIChatPanel";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string; date: string; description: string;
  amount: number; type: "DEBIT" | "CREDIT";
  balance: number; category: string; subCategory: string | null;
}
interface Insight {
  id: string; type: string; label: string;
  value: string; meta: string | null;
}
interface MonthlyOverviewItem {
  month: string; debit: number; credit: number;
}
interface DashboardData {
  totalBalance: number; totalSpending: number; totalIncome: number;
  balanceChangePercent: number; spendingChangePercent: number; incomeChangePercent: number;
  monthlyOverview: MonthlyOverviewItem[];
  spendingByCategory: Record<string, number>;
  recentTransactions: Transaction[];
  savings?: number;
}
interface StatementData {
  id: string; originalFileName: string; status: string;
  createdAt: string; periodFrom: string; periodTo: string;
  insights: Insight[];
}
interface PagedTransactions {
  content: Transaction[]; page: number; size: number;
  totalElements: number; totalPages: number; first: boolean; last: boolean;
}
interface ProjectionCard {
  headline: string; impact: string; timeframe: string;
  type: "leak" | "opportunity" | "compounding" | "risk";
}
interface BehavioralSignal {
  label: string; observation: string;
  emotion: "impulsive" | "anxious" | "disciplined" | "avoidant" | "reactive";
  intensity: number;
}
interface HiddenPattern {
  title: string; insight: string;
  category: "timing" | "merchant" | "category" | "behavioral";
}
interface AnalysisData {
  summary: string;
  moneyPersonality: { archetype: string; description: string; trait: string };
  spendingPulse: { status: string; summary: string; stabilityScore: number };
  risks: string[];
  positiveHabits: string[];
  recommendations: string[];
  nextActions: string[];
  projections: ProjectionCard[];
  behavioralSignals: BehavioralSignal[];
  hiddenPatterns: HiddenPattern[];
}
interface RecurringCharge {
  merchant: string;
  rawDescription: string;
  avgAmount: number;
  totalSpent: number;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  category: string;
  variancePct: number;
  estimatedMonthly: number;
  estimatedAnnual: number;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#0ea5e9","#f59e0b","#10b981","#8b5cf6","#f43f5e","#06b6d4","#84cc16","#ec4899"];

const CAT_META: Record<string, { bg: string; color: string; icon: any }> = {
  "Food & Dining":    { bg: "#fff7ed", color: "#ea580c", icon: Utensils },
  "Groceries":        { bg: "#eff6ff", color: "#2563eb", icon: ShoppingCart },
  "Shopping":         { bg: "#fdf4ff", color: "#9333ea", icon: ShoppingBag },
  "Transport":        { bg: "#f0f9ff", color: "#0284c7", icon: Car },
  "Utilities":        { bg: "#f0fdf4", color: "#16a34a", icon: Wifi },
  "Subscriptions":    { bg: "#faf5ff", color: "#7c3aed", icon: RefreshCw },
  "Healthcare":       { bg: "#ecfdf5", color: "#059669", icon: Activity },
  "Investment":       { bg: "#fefce8", color: "#ca8a04", icon: TrendingUp },
  "EMI / Loan":       { bg: "#eff6ff", color: "#1d4ed8", icon: CreditCard },
  "P2P Transfer":     { bg: "#fff7ed", color: "#c2410c", icon: Users },
  "Cash Withdrawal":  { bg: "#f9fafb", color: "#374151", icon: Wallet },
  "Bank Transfer":    { bg: "#eff6ff", color: "#1e40af", icon: Building2 },
  "Merchant Payment": { bg: "#fffbeb", color: "#92400e", icon: Receipt },
  "Refund":           { bg: "#f0fdf4", color: "#166534", icon: CornerDownLeft },
  "Income":           { bg: "#ecfdf5", color: "#14532d", icon: ArrowDownToLine },
  "Personal Care":    { bg: "#fdf2f8", color: "#9d174d", icon: Heart },
  "Other":            { bg: "#f8fafc", color: "#64748b", icon: MoreHorizontal },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmtK(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + Math.round(n);
}
function fmtCompact(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + Math.round(n);
}
function fmtDate(d: string) {
  const [, m, day] = d.split("-");
  return `${parseInt(day)} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}`;
}
function formatPeriodLabel(from: string, to: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  const a = new Date(from).toLocaleDateString("en-IN", opts);
  const b = new Date(to).toLocaleDateString("en-IN", opts);
  return a === b ? a : `${a} – ${b}`;
}

const MERCHANT_MAP: [RegExp, string][] = [
  [/zomato/i,"Zomato"],[/blinkit/i,"Blinkit"],[/amazon/i,"Amazon"],
  [/swiggy/i,"Swiggy"],[/airtel/i,"Airtel"],[/uber/i,"Uber"],[/rapido/i,"Rapido"],
  [/google/i,"Google"],[/roppen/i,"Rapido"],
];
function resolveMerchant(desc: string): string {
  for (const [re, name] of MERCHANT_MAP) if (re.test(desc)) return name;
  const cleaned = desc
    .replace(/\/UPI\/|\/Blinki\/|\/Collec\/|\/UPIInt\/|\/Payvia\/|\/Pay [Tt]o\/|\/Paymen\/|\/Verifi\//g, " ")
    .replace(/@\S+/g,"").replace(/[A-Z]{2,5} BANK[^/]*/gi," ").replace(/\d{8,}/g," ").replace(/[^\w\s]/g," ").trim();
  const words = cleaned.split(/\s+/).filter(w => w.length > 2).slice(0, 2);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") || desc.slice(0, 20);
}
function bankVia(desc: string): string {
  const m = desc.match(/\/([A-Z][A-Z ]+BANK[^/]*)/i);
  return m ? m[1].trim().slice(0, 22) : "UPI";
}


const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f1f5f9; font-family: 'Sora', sans-serif; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .card {
    background: #ffffff; border-radius: 20px;
    border: 1px solid #e8edf5;
    box-shadow: 0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.03);
  }
  .stat-card {
    background: #ffffff; border-radius: 20px; border: 1px solid #e8edf5;
    padding: 22px 24px; box-shadow: 0 1px 3px rgba(15,23,42,0.04);
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .stat-card:hover { box-shadow: 0 4px 20px rgba(15,23,42,0.09); transform: translateY(-2px); }
  .tx-row {
    display: grid; grid-template-columns: 2.2fr 1fr 1fr 0.8fr;
    gap: 8px; padding: 11px 14px; border-radius: 12px;
    align-items: center; cursor: default; transition: background 0.15s;
    border: 1px solid transparent;
  }
  .tx-row:hover { background: #f8fafc; border-color: #e8edf5; }
  .filter-btn {
    padding: 5px 14px; border-radius: 8px; font-size: 11px; font-weight: 600;
    cursor: pointer; font-family: 'Sora', sans-serif; border: none; transition: all 0.15s;
  }
  .filter-btn.active { background: #0f172a; color: #fff; }
  .filter-btn:not(.active) { background: transparent; color: #94a3b8; }
  .filter-btn:not(.active):hover { background: #f1f5f9; color: #334155; }
  .section-toggle {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; background: none; border: none; cursor: pointer;
    padding: 0; font-family: 'Sora', sans-serif; margin-bottom: 10px;
  }
  .ai-action-btn {
    width: 100%; padding: 13px; border-radius: 14px;
    background: linear-gradient(135deg, #0ea5e9, #6366f1);
    color: #fff; font-size: 13px; font-weight: 700; border: none;
    cursor: pointer; font-family: 'Sora', sans-serif;
    letter-spacing: -0.01em; transition: opacity 0.2s;
  }
  .ai-action-btn:hover { opacity: 0.88; }
  .page-btn {
    width: 28px; height: 28px; border-radius: 8px; font-size: 11px; font-weight: 600;
    cursor: pointer; font-family: 'Sora', sans-serif; border: 1px solid #e2e8f0; transition: all 0.15s;
  }
  .page-btn.active { background: #0f172a; color: #fff; border-color: #0f172a; }
  .page-btn:not(.active) { background: #fff; color: #64748b; }
  .page-btn:not(.active):hover { background: #f8fafc; color: #334155; }
  .nav-btn {
    display: flex; align-items: center; gap: 4px; padding: 6px 12px;
    border-radius: 9px; font-size: 11px; font-weight: 600; cursor: pointer;
    font-family: 'Sora', sans-serif; background: #fff; color: #374151;
    border: 1px solid #e2e8f0; transition: all 0.15s;
  }
  .nav-btn:disabled { opacity: 0.38; cursor: not-allowed; }
  .nav-btn:not(:disabled):hover { background: #f8fafc; }
  .recurring-row {
    display: flex; align-items: center; gap: 12px; padding: 10px 12px;
    border-radius: 12px; background: #fafafa; border: 1px solid #f1f5f9; transition: all 0.15s;
  }
  .recurring-row:hover { background: #f8fafc; border-color: #e8edf5; }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .skeleton {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.45s ease both; }
  .fade-up-1 { animation-delay: 0.05s; }
  .fade-up-2 { animation-delay: 0.1s; }
  .fade-up-3 { animation-delay: 0.15s; }
  .fade-up-4 { animation-delay: 0.2s; }
  .fade-up-5 { animation-delay: 0.25s; }
`;


function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: "12px" }}>
      {children}
    </p>
  );
}


function StatCards({ dashboard }: { dashboard: DashboardData }) {
  const savings = dashboard.totalIncome - dashboard.totalSpending;
  const sign = (v: number) => v >= 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`;

  const cards = [
    {
      label: "Current Balance", value: fmtCompact(dashboard.totalBalance),
      sub: `${sign(dashboard.balanceChangePercent)} from last month`,
      good: dashboard.balanceChangePercent >= 0,
      accent: "#6366f1", bg: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", dark: true,
    },
    {
      label: "Total Income", value: fmtCompact(dashboard.totalIncome),
      sub: `${sign(dashboard.incomeChangePercent)} vs prior`,
      good: dashboard.incomeChangePercent >= 0,
      accent: "#10b981", bg: "#fff", dark: false,
    },
    {
      label: "Total Spending", value: fmtCompact(dashboard.totalSpending),
      sub: `${sign(dashboard.spendingChangePercent)} vs prior`,
      good: dashboard.spendingChangePercent <= 0,
      accent: "#f43f5e", bg: "#fff", dark: false,
    },
    {
      label: "Net Savings", value: fmtCompact(Math.abs(savings)),
      sub: savings >= 0 ? "Positive net flow ↑" : "Negative net flow ↓",
      good: savings >= 0, accent: "#f59e0b", bg: "#fff", dark: false,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
      {cards.map((c, i) => (
        <div key={i} className={`stat-card fade-up fade-up-${i+1}`}
          style={{ background: c.bg, position: "relative", overflow: "hidden", padding: "24px" }}>
          <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: "3px",
            background: c.dark ? "rgba(255,255,255,0.3)" : c.accent, borderRadius: "0 0 3px 3px" }} />
          <p style={{ fontSize: "11px", fontWeight: 600, color: c.dark ? "rgba(255,255,255,0.7)" : "#94a3b8", marginBottom: "10px", letterSpacing: "0.03em" }}>
            {c.label}
          </p>
          <p style={{ fontSize: "26px", fontWeight: 800, color: c.dark ? "#fff" : "#0f172a",
            letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
            {c.value}
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 600,
            color: c.dark ? (c.good ? "#a7f3d0" : "#fecaca") : (c.good ? "#059669" : "#dc2626"),
            background: c.dark ? (c.good ? "rgba(167,243,208,0.15)" : "rgba(254,202,202,0.15)") : (c.good ? "#ecfdf5" : "#fef2f2"),
            padding: "4px 9px", borderRadius: "100px" }}>
            {c.good ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── WEEKLY SPEND RHYTHM ──────────────────────────────────────────────────────

const peakLabelPlugin = {
  id: "peakLabelPlugin",
  afterDatasetsDraw(chart: any, _: any, opts: any) {
    const { ctx, scales } = chart;
    const { peakIdx, debits } = opts;
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.[peakIdx]) return;
    const bar = meta.data[peakIdx];
    const x = bar.x;
    const y = scales.y.getPixelForValue(debits[peakIdx]) - 12;
    ctx.save();
    ctx.font = "600 10px 'Sora', sans-serif";
    ctx.fillStyle = "#e11d48";
    ctx.textAlign = "center";
    ctx.fillText("▲ peak", x, y);
    ctx.restore();
  },
};


// ─── CATEGORY BREAKDOWN ───────────────────────────────────────────────────────

function CategoryBreakdown({ spendingByCategory }: { spendingByCategory: Record<string, number> }) {
  const total = Object.values(spendingByCategory ?? {}).reduce((a, b) => a + Number(b || 0), 0);
  const pie = Object.entries(spendingByCategory ?? {})
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([name, value], i) => ({
      name, value: Number(value || 0),
      pct: total > 0 ? ((Number(value) / total) * 100).toFixed(1) : "0",
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));

  return (
    <div className="card" style={{ padding: "24px 26px" }}>
      <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: "4px" }}>Where Money Goes</h2>
      <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "20px" }}>Total: {fmtK(total)}</p>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <div style={{ width: "120px", height: "120px", flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pie} cx="50%" cy="50%" innerRadius={36} outerRadius={56} dataKey="value" paddingAngle={2} strokeWidth={0}>
                {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 11, fontFamily: "Sora" }}
                formatter={(v: any, _: any, p: any) => [fmtK(v), p.payload.name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
          {pie.slice(0, 7).map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "2px", background: c.color, flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: "#475569", flex: 1 }}>{c.name}</span>
              <div style={{ height: "4px", width: `${Math.max(8, Number(c.pct))}%`, background: c.color, borderRadius: "2px", opacity: 0.7 }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a", minWidth: "30px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{c.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RECURRING CHARGES ────────────────────────────────────────────────────────

function RecurringCharges({ statementId }: { statementId: string }) {
  const { data: res, isLoading, isError } = useGetRecurringChargesQuery(statementId);
  const charges: RecurringCharge[] = res?.data ?? [];
  const totalMonthly = charges.reduce((sum, c) => sum + Number(c.estimatedMonthly), 0);

  if (isLoading) {
    return (
      <div className="card" style={{ padding: "24px 26px" }}>
        <div style={{ marginBottom: "18px" }}>
          <div className="skeleton" style={{ height: "18px", width: "60%", marginBottom: "6px" }} />
          <div className="skeleton" style={{ height: "12px", width: "40%" }} />
        </div>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: "54px", marginBottom: "7px" }} />)}
      </div>
    );
  }

  if (isError || charges.length === 0) {
    return (
      <div className="card" style={{ padding: "24px 26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", gap: "10px" }}>
        <RefreshCw size={28} color="#e2e8f0" />
        <p style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>No recurring charges detected</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "24px 26px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
            <RefreshCw size={14} color="#8b5cf6" />
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Recurring Charges</h2>
          </div>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            {charges.length} detected · {fmtCompact(totalMonthly)}/mo estimated
          </p>
        </div>
        <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "10px", padding: "6px 11px", textAlign: "right" }}>
          <p style={{ fontSize: "9px", color: "#8b5cf6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Annual</p>
          <p style={{ fontSize: "14px", fontWeight: 800, color: "#7c3aed", fontFamily: "'JetBrains Mono', monospace" }}>
            {fmtCompact(totalMonthly * 12)}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {charges.map((c, i) => {
          const cm = CAT_META[c.category] ?? CAT_META["Other"];
          const Icon = cm.icon;
          return (
            <div key={i} className="recurring-row">
              <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: cm.bg,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={13} color={cm.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{c.merchant}</p>
                  {c.variancePct > 10 && (
                    <span style={{ fontSize: "8px", fontWeight: 700, color: "#d97706",
                      background: "#fffbeb", border: "1px solid #fde68a", padding: "1px 5px", borderRadius: "4px" }}>
                      variable
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "1px" }}>
                  {c.occurrences}× seen · last {fmtDate(c.lastSeen)}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtCompact(Number(c.avgAmount))}
                </p>
                <p style={{ fontSize: "9px", color: "#94a3b8" }}>avg/charge</p>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: "14px", padding: "10px 12px", background: "#f0f9ff", border: "1px solid #bae6fd",
        borderRadius: "10px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <AlertCircle size={13} color="#0284c7" style={{ marginTop: "1px", flexShrink: 0 }} />
        <p style={{ fontSize: "11px", color: "#0369a1", lineHeight: 1.6 }}>
          Charges with &lt;20% amount variance flagged as recurring. Review and cancel any you no longer use.
        </p>
      </div>
    </div>
  );
}

// ─── TRANSACTIONS TABLE ───────────────────────────────────────────────────────

function TransactionsTable({ statementId }: { statementId: string }) {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<"ALL" | "DEBIT" | "CREDIT">("ALL");
  const { data: res, isFetching } = useGetTransactionsQuery({
    statementId, page, size: 25, sort: "date", dir: "desc",
    type: filter === "ALL" ? undefined : filter,
  });
  const paged: PagedTransactions | null = res?.data ?? null;
  const transactions = paged?.content ?? [];

  return (
    <div className="card fade-up fade-up-5" style={{ padding: "24px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Transactions</h2>
          {paged && <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px" }}>{paged.totalElements} entries · Page {paged.page + 1}/{paged.totalPages}</p>}
        </div>
        <div style={{ display: "flex", gap: "2px", background: "#f1f5f9", padding: "3px", borderRadius: "10px" }}>
          {(["ALL","DEBIT","CREDIT"] as const).map(f => (
            <button key={f} className={`filter-btn${filter === f ? " active" : ""}`} onClick={() => { setFilter(f); setPage(0); }}>{f}</button>
          ))}
        </div>
      </div>
      <div className="tx-row" style={{ marginBottom: "2px" }}>
        {["Merchant","Category","Amount","Date"].map(h => (
          <span key={h} style={{ fontSize: "10px", fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
        ))}
      </div>
      {isFetching ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: "48px" }} />)}
        </div>
      ) : (
        <div>
          {transactions.map(tx => {
            const isD = tx.type === "DEBIT";
            const cm = CAT_META[tx.category ?? "Other"] ?? CAT_META["Other"];
            const Icon = cm.icon;
            const name = resolveMerchant(tx.description);
            return (
              <div key={tx.id} className="tx-row">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: cm.bg,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} color={cm.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{name}</p>
                    <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "1px" }}>{bankVia(tx.description)}</p>
                  </div>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 600, color: cm.color, background: cm.bg,
                  padding: "3px 8px", borderRadius: "6px", display: "inline-block", whiteSpace: "nowrap" }}>
                  {tx.category ?? "Other"}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: isD ? "#f43f5e" : "#10b981", fontFamily: "'JetBrains Mono', monospace" }}>
                  {isD ? "−" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                </span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{fmtDate(tx.date)}</span>
              </div>
            );
          })}
        </div>
      )}
      {paged && paged.totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
          <button className="nav-btn" disabled={paged.first} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={12} /> Prev
          </button>
          <div style={{ display: "flex", gap: "4px" }}>
            {Array.from({ length: Math.min(paged.totalPages, 5) }, (_, i) => {
              const p = paged.totalPages <= 5 ? i : Math.max(0, paged.page - 2) + i;
              if (p >= paged.totalPages) return null;
              return (
                <button key={p} className={`page-btn${p === paged.page ? " active" : ""}`} onClick={() => setPage(p)}>{p + 1}</button>
              );
            })}
          </div>
          <button className="nav-btn" disabled={paged.last} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AI INSIGHT SIDEBAR ───────────────────────────────────────────────────────

const TRAIT_CFG: Record<string, { color: string; bg: string; label: string }> = {
  impulsive:    { color: "#dc2626", bg: "#fef2f2", label: "Impulsive" },
  inconsistent: { color: "#7c3aed", bg: "#f5f3ff", label: "Inconsistent" },
  disciplined:  { color: "#059669", bg: "#ecfdf5", label: "Disciplined" },
  cautious:     { color: "#0284c7", bg: "#f0f9ff", label: "Cautious" },
  anxious:      { color: "#d97706", bg: "#fffbeb", label: "Anxious" },
};
const EMOTION_COLOR: Record<string, string> = {
  impulsive: "#dc2626", anxious: "#d97706", disciplined: "#059669",
  avoidant: "#7c3aed", reactive: "#db2777",
};

function Collapsible({ icon, label, color = "#64748b", children, defaultOpen = true }: any) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "16px" }}>
      <button className="section-toggle" onClick={() => setOpen((o: boolean) => !o)}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ color }}>{icon}</div>
          <span style={{ fontSize: "10px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</span>
        </div>
        {open ? <ChevronDown size={13} color="#cbd5e1" /> : <ChevronRight size={13} color="#cbd5e1" />}
      </button>
      {open && children}
    </div>
  );
}

function AISidebar({ analysis, loading }: { analysis: AnalysisData | null; loading: boolean }) {
  const params = useParams();
  const statementId = params.statementId;
  const router = useRouter();

  if (loading) return (
    <aside style={{ width: "320px", flexShrink: 0, height: "100%", overflowY: "auto", borderLeft: "1px solid #e8edf5", background: "#fff", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {[90, 160, 100, 140, 110].map((h, i) => <div key={i} className="skeleton" style={{ height: `${h}px` }} />)}
    </aside>
  );
  if (!analysis) return null;

  const tc = TRAIT_CFG[analysis.moneyPersonality?.trait] ?? TRAIT_CFG.cautious;
  const stability = analysis.spendingPulse?.stabilityScore ?? 0;
  const pulseColor = ({ volatile: "#f43f5e", stable: "#10b981", declining: "#f43f5e", improving: "#0ea5e9" } as Record<string, string>)[analysis.spendingPulse?.status] ?? "#64748b";

  return (
    <aside style={{ width: "320px", flexShrink: 0, height: "100%", overflowY: "auto",
      borderLeft: "1px solid #e8edf5", background: "#fcfcfd", padding: "22px 20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#eef2ff", color: "#6366f1",
          fontSize: "10px", fontWeight: 700, padding: "4px 11px", borderRadius: "100px", marginBottom: "12px", letterSpacing: "0.06em" }}>
          <Sparkles size={10} /> AI INSIGHTS
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1.2 }}>
          Financial<br />Intelligence
        </h2>
      </div>

      <div style={{ background: "#0f172a", borderRadius: "18px", padding: "20px", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -20, right: -20, width: "90px", height: "90px", borderRadius: "50%", background: "rgba(99,102,241,0.12)" }} />
        <div style={{ position: "absolute", top: -10, right: 30, width: "50px", height: "50px", borderRadius: "50%", background: "rgba(99,102,241,0.08)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={15} color="#a5b4fc" />
          </div>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Money Personality</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
            {analysis.moneyPersonality?.archetype}
          </h3>
          <div style={{ background: tc.bg, color: tc.color, fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "100px", flexShrink: 0 }}>
            {tc.label}
          </div>
        </div>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: "16px" }}>
          {analysis.moneyPersonality?.description}
        </p>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", color: "#475569", fontWeight: 600 }}>Stability Score</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: pulseColor, fontFamily: "'JetBrains Mono', monospace" }}>{stability}%</span>
          </div>
          <div style={{ display: "flex", gap: "3px" }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ height: "4px", flex: 1, borderRadius: "2px", background: i < Math.floor(stability / 10) ? pulseColor : "rgba(255,255,255,0.08)" }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "14px 16px", marginBottom: "16px", borderLeft: "3px solid #6366f1" }}>
        <p style={{ fontSize: "12px", lineHeight: 1.8, color: "#334155", fontStyle: "italic" }}>"{analysis.summary}"</p>
      </div>

      <Collapsible icon={<Activity size={13} />} label="Behavioral Signals" color="#f43f5e">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {analysis.behavioralSignals?.slice(0, 3).map((s, i) => {
            const ec = EMOTION_COLOR[s.emotion] ?? "#64748b";
            return (
              <div key={i} style={{ borderRadius: "12px", border: `1px solid ${ec}22`, background: `${ec}06`, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>{s.label}</p>
                    <p style={{ fontSize: "9px", color: ec, fontWeight: 600, textTransform: "capitalize", marginTop: "1px" }}>{s.emotion} · {s.intensity}/10</p>
                  </div>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {Array.from({ length: 10 }, (_, j) => (
                      <div key={j} style={{ width: "4px", height: "14px", borderRadius: "2px", background: j < s.intensity ? ec : `${ec}22` }} />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: "11px", lineHeight: 1.65, color: "#475569" }}>{s.observation}</p>
              </div>
            );
          })}
        </div>
      </Collapsible>

      <Collapsible icon={<Eye size={13} />} label="Hidden Patterns" color="#8b5cf6">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {analysis.hiddenPatterns?.slice(0, 3).map((p, i) => (
            <div key={i} style={{ borderRadius: "12px", background: "#f5f3ff", border: "1px solid #e9d5ff", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "capitalize", color: "#8b5cf6", background: "#ede9fe", padding: "2px 7px", borderRadius: "5px" }}>{p.category}</span>
                <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>{p.title}</h4>
              </div>
              <p style={{ fontSize: "11px", lineHeight: 1.65, color: "#475569" }}>{p.insight}</p>
            </div>
          ))}
        </div>
      </Collapsible>

      {analysis.nextActions?.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <SectionLabel>Action Items</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {analysis.nextActions.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", padding: "10px 12px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "5px", background: "#6366f1", color: "#fff",
                  fontSize: "9px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: "11px", lineHeight: 1.65, color: "#374151" }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="ai-action-btn" onClick={() => router.push(`/dashboard/${statementId}/analysis`)}>
        View Full Analysis →
      </button>
    </aside>
  );
}

// ─── STATEMENT HERO ───────────────────────────────────────────────────────────

function StatementHero({ statement, dashboard }: { statement: StatementData | null; dashboard: DashboardData }) {
  if (!statement) return null;
  const savings = dashboard.totalIncome - dashboard.totalSpending;
  const savingsRate = dashboard.totalIncome > 0 ? ((savings / dashboard.totalIncome) * 100).toFixed(1) : "0";

  const stats = [
    { l: "Income",    v: fmtCompact(dashboard.totalIncome),   c: "#4ade80" },
    { l: "Spending",  v: fmtCompact(dashboard.totalSpending), c: "#f87171" },
    { l: "Savings",   v: fmtCompact(savings),                 c: "#a5b4fc" },
    { l: "Save Rate", v: `${savingsRate}%`,                   c: "#fcd34d" },
  ];

  return (
    <div className="fade-up" style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2445 100%)",
      borderRadius: "22px", padding: "26px 28px",
      display: "grid", gridTemplateColumns: "1fr auto", gap: "20px", alignItems: "center",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -40, right: 120, width: "160px", height: "160px", borderRadius: "50%", background: "rgba(99,102,241,0.1)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -30, right: 30, width: "100px", height: "100px", borderRadius: "50%", background: "rgba(14,165,233,0.08)", pointerEvents: "none" }} />
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={17} color="#a5b4fc" />
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{statement.originalFileName}</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.38)", marginTop: "2px" }}>
              {formatPeriodLabel(statement.periodFrom, statement.periodTo)} · Uploaded {new Date(statement.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div style={{ marginLeft: "10px", display: "flex", alignItems: "center", gap: "5px", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: "100px", padding: "4px 11px" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: "10px", color: "#4ade80", fontWeight: 600 }}>{statement.status}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "28px" }}>
          {stats.map((s, i) => (
            <div key={i}>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.l}</p>
              <p style={{ fontSize: "20px", fontWeight: 800, color: s.c, letterSpacing: "-0.04em", fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Balance</p>
        <p style={{ fontSize: "36px", fontWeight: 900, color: "#fff", letterSpacing: "-0.05em", lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
          {fmtCompact(dashboard.totalBalance)}
        </p>
      </div>
    </div>
  );
}

// ─── INSIGHTS STRIP ───────────────────────────────────────────────────────────

function InsightsStrip({ insights }: { insights: Insight[] }) {
  if (!insights?.length) return null;
  const icons: Record<string, React.ReactNode> = {
    INCOME:   <ArrowUpRight size={13} color="#10b981" />,
    SPENDING: <ArrowDownRight size={13} color="#f43f5e" />,
    SAVINGS:  <Target size={13} color="#f59e0b" />,
    DEFAULT:  <Sparkles size={13} color="#6366f1" />,
  };
  return (
    <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "2px" }}>
      {insights.slice(0, 6).map((ins, i) => (
        <div key={i} className="card" style={{ padding: "14px 16px", flexShrink: 0, minWidth: "155px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
            {icons[ins.type] ?? icons.DEFAULT}
            <span style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{ins.type}</span>
          </div>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#334155" }}>{ins.label}</p>
          <p style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px", fontFamily: "'JetBrains Mono', monospace" }}>{ins.value}</p>
          {ins.meta && <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>{ins.meta}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── LOADING ──────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #6366f1, #0ea5e9)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LayoutDashboard size={20} color="#fff" />
        </div>
        <p style={{ fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>Loading your dashboard…</p>
        <p style={{ color: "#94a3b8", fontSize: "13px" }}>Fetching your financial data</p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const params = useParams();
  const statementId = params.statementId as string;
  const router = useRouter();

  const { data: dashRes, isLoading: dashLoading } = useGetDashboardQuery(statementId);
  const { data: stmtRes, isLoading: stmtLoading } = useGetStatementByIdQuery(statementId);
  const [analyzeFinancialProfile, { isLoading: aiLoading }] = useAnalyzeFinancialProfileMutation();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  useEffect(() => {
    if (!statementId) return;
    analyzeFinancialProfile(statementId)
      .unwrap()
      .then(res => setAnalysis(res?.data ?? res ?? null))
      .catch(err => console.error("AI Analysis Error:", err));
  }, [statementId, analyzeFinancialProfile]);

  const dashboard: DashboardData | null = dashRes?.data?.data ?? dashRes?.data ?? null;
  const statement: StatementData | null = stmtRes?.data?.data ?? stmtRes?.data ?? null;

  if (dashLoading || stmtLoading) return <LoadingState />;
  if (!dashboard?.monthlyOverview) return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>Could not load dashboard</p>
        <p style={{ color: "#94a3b8", fontSize: "13px" }}>Check your connection or try again.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", color: "#0f172a", display: "flex", flexDirection: "column", fontFamily: "'Sora', sans-serif" }}>
      <style>{STYLES}</style>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          <StatementHero statement={statement} dashboard={dashboard} />
          {statement?.insights?.length > 0 && <InsightsStrip insights={statement.insights} />}
          <StatCards dashboard={dashboard} />
          <div className="fade-up fade-up-4">
            <WeeklySpendRhythm statementId={statementId} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "16px" }} className="fade-up fade-up-4">
            <CategoryBreakdown spendingByCategory={dashboard.spendingByCategory} />
            <RecurringCharges statementId={statementId} />
          </div>
          <TransactionsTable statementId={statementId} />
        </main>
        <AISidebar analysis={analysis} loading={aiLoading} />
      </div>
      <AIChatPanel statementId={statementId} />

    </div>
  );
}
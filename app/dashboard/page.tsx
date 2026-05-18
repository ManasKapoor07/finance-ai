"use client";

import { useState, useMemo } from "react";
import {
  useGetDashboardQuery,
  useGetWeeklySpendQuery,
  useGetTransactionsQuery,
  useGetStatementsQuery,
  useGetRecurringChargesQuery,
} from "../redux/api/authApi";
import type {
  TransactionDto,
  StatementDetailDto,
  RecurringChargeDto,
  TransactionQueryParams,
} from "../redux/api/authApi";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import AIInsightsPanel from "./Aiinsightspanel";
import PageLayout from "../components/PageLayout";
import FloatingChat from "./Floatingchat";

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtCompact = (n: number) => {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtShortDate = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

// ── Palette ───────────────────────────────────────────────────────────────────
const CAT_COLORS = [
  "#a78bfa","#34d399","#f472b6","#60a5fa","#fb923c",
  "#4ade80","#e879f9","#2dd4bf","#fbbf24","#f87171",
];

const TABS = [
  { key: "overview",     label: "Overview",     emoji: "✦" },
  { key: "transactions", label: "Transactions", emoji: "⇅" },
  { key: "statements",   label: "Statements",   emoji: "◫" },
] as const;
type TabKey = typeof TABS[number]["key"];

// ── Tiny atoms ────────────────────────────────────────────────────────────────
function Pill({ children, variant = "neutral" }: { children: React.ReactNode; variant?: "neutral"|"green"|"red"|"violet"|"blue" }) {
  const v: Record<string, string> = {
    neutral: "bg-zinc-100 text-zinc-500",
    green:   "bg-emerald-50 text-emerald-600 border border-emerald-100",
    red:     "bg-rose-50 text-rose-500 border border-rose-100",
    violet:  "bg-violet-50 text-violet-600 border border-violet-100",
    blue:    "bg-blue-50 text-blue-600 border border-blue-100",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${v[variant]}`}>
      {children}
    </span>
  );
}

function GlassCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_2px_24px_-4px_rgba(0,0,0,0.08)] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase mb-4">{children}</p>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-100 ${className}`} />;
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-300">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, change, bg, emoji }: {
  label: string; value: string; change?: number; bg: string; emoji: string;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className={`relative overflow-hidden rounded-3xl p-5 flex flex-col gap-2 ${bg} shadow-sm hover:scale-[1.02] transition-transform duration-200 cursor-default`}>
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-black tracking-[0.18em] uppercase opacity-60">{label}</span>
        <span className="text-xl">{emoji}</span>
      </div>
      <p className="text-[1.65rem] font-black leading-none tracking-tight">{value}</p>
      {change !== undefined && (
        <p className={`text-xs font-bold ${up ? "opacity-70" : "opacity-70"} flex items-center gap-1`}>
          <span>{up ? "↑" : "↓"}</span>{pct(Math.abs(change))} vs last
        </p>
      )}
    </div>
  );
}

// ── Transactions Tab ──────────────────────────────────────────────────────────
function TransactionsTab() {
  const [params, setParams] = useState<TransactionQueryParams>({ page: 0, size: 20, sort: "date", dir: "desc" });
  const { data, isLoading, isFetching } = useGetTransactionsQuery(params);
  const txList = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const set = (key: keyof TransactionQueryParams, val: any) =>
    setParams(p => ({ ...p, [key]: val, page: 0 }));

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <GlassCard className="p-4 flex flex-wrap gap-3 items-center">
        {[
          { val: "", label: "All" }, { val: "DEBIT", label: "Debits" }, { val: "CREDIT", label: "Credits" },
        ].map(opt => (
          <button key={opt.val}
            onClick={() => set("type", opt.val || undefined)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150
              ${(params.type ?? "") === opt.val
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
            {opt.label}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <select
            className="text-xs bg-zinc-100 border-none rounded-full px-3 py-1.5 text-zinc-600 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-300"
            value={params.dir}
            onChange={e => set("dir", e.target.value)}
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
          {data && <span className="text-[11px] text-zinc-400 font-medium">{data.totalElements.toLocaleString()} total</span>}
        </div>
      </GlassCard>

      {/* List */}
      <GlassCard className="overflow-hidden">
        <div className="divide-y divide-zinc-50">
          {isLoading || isFetching
            ? [...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                  <Skeleton className="w-10 h-10 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-44" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            : txList.length === 0
            ? <Empty icon="🧾" text="No transactions found" />
            : txList.map((tx: TransactionDto) => {
                const isDebit = tx.type === "DEBIT";
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50/60 transition-colors group">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base flex-shrink-0 font-bold
                      ${isDebit ? "bg-rose-50 text-rose-400" : "bg-emerald-50 text-emerald-500"}`}>
                      {isDebit ? "↓" : "↑"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-zinc-400">{fmtShortDate(tx.date)}</span>
                        {tx.category && <Pill variant="violet">{tx.category}</Pill>}
                      </div>
                    </div>
                    <span className={`text-sm font-black tabular-nums ${isDebit ? "text-rose-500" : "text-emerald-500"}`}>
                      {isDebit ? "−" : "+"}{fmt(Number(tx.amount))}
                    </span>
                  </div>
                );
              })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-50 bg-zinc-50/40">
            <button disabled={params.page === 0}
              onClick={() => setParams(p => ({ ...p, page: (p.page ?? 0) - 1 }))}
              className="text-xs font-bold px-4 py-2 rounded-full bg-white border border-zinc-200 text-zinc-600 disabled:opacity-30 hover:bg-zinc-50 transition-colors shadow-sm">
              ← Prev
            </button>
            <span className="text-xs text-zinc-400 font-medium">
              {(params.page ?? 0) + 1} / {totalPages}
            </span>
            <button disabled={(params.page ?? 0) + 1 >= totalPages}
              onClick={() => setParams(p => ({ ...p, page: (p.page ?? 0) + 1 }))}
              className="text-xs font-bold px-4 py-2 rounded-full bg-white border border-zinc-200 text-zinc-600 disabled:opacity-30 hover:bg-zinc-50 transition-colors shadow-sm">
              Next →
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ── Statements Tab ────────────────────────────────────────────────────────────
function StatementsTab() {
  const { data: statements, isLoading } = useGetStatementsQuery();
  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52" />)}
    </div>
  );
  if (!statements?.length) return <Empty icon="📂" text="No statements uploaded yet" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {statements.map((s: StatementDetailDto, i: number) => (
        <GlassCard key={s.id} className="p-5 flex flex-col gap-4 hover:scale-[1.01] transition-transform duration-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${CAT_COLORS[i % CAT_COLORS.length]}, ${CAT_COLORS[(i + 2) % CAT_COLORS.length]})` }}>
              {(s.bankName?.[0] ?? "B").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-black text-zinc-800">{s.bankName}</p>
              <Pill variant="blue">Statement</Pill>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">Period</span>
              <span className="text-[11px] font-bold text-zinc-700">
                {s.periodFrom ? fmtShortDate(s.periodFrom) : "—"} → {s.periodTo ? fmtShortDate(s.periodTo) : "—"}
              </span>
            </div>
            {s.transactionCount != null && (
              <div className="flex justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">Transactions</span>
                <span className="text-[11px] font-black text-zinc-800">{s.transactionCount}</span>
              </div>
            )}
            {s.totalDebit != null && (
              <div className="flex justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">Total Spent</span>
                <span className="text-[11px] font-black text-rose-500">{fmtCompact(Number(s.totalDebit))}</span>
              </div>
            )}
            {s.totalCredit != null && (
              <div className="flex justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">Total Earned</span>
                <span className="text-[11px] font-black text-emerald-500">{fmtCompact(Number(s.totalCredit))}</span>
              </div>
            )}
          </div>

          {s.uploadedAt && (
            <p className="text-[10px] text-zinc-400 font-medium text-right">Uploaded {fmtDate(s.uploadedAt)}</p>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({
  dashboard, weeklyData, isLoading, onViewAllTransactions,
}: {
  dashboard: any;
  weeklyData: any;
  isLoading: boolean;
  onViewAllTransactions: () => void;
}) {
  const { data: recurring, isLoading: recurringLoading } = useGetRecurringChargesQuery();

  const categories = useMemo(() =>
    Object.entries(dashboard?.spendingByCategory ?? {})
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value),
    [dashboard]);

  const totalCatSpend = useMemo(() =>
    categories.reduce((s, c) => s + c.value, 0), [categories]);

  const monthlyData = useMemo(() =>
    (dashboard?.monthlyOverview ?? []).map((m: any) => ({
      month: m.month, Income: Number(m.credit), Spending: Number(m.debit),
    })), [dashboard]);

  const weeklyChartData = useMemo(() =>
    (weeklyData?.data ?? []).map((w: any) => ({
      label: w.label, Spending: Number(w.debit), Income: Number(w.credit),
    })), [weeklyData]);

  const recentTx = dashboard?.recentTransactions ?? [];
  const recurringList: RecurringChargeDto[] = recurring ?? [];

  if (isLoading && !dashboard) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Balance"  value={fmt(Number(dashboard?.totalBalance ?? 0))}  change={dashboard?.balanceChangePercent}
          bg="bg-gradient-to-br from-violet-100 via-violet-50 to-white text-violet-900"   emoji="💜" />
        <StatCard label="Income"   value={fmt(Number(dashboard?.totalIncome ?? 0))}   change={dashboard?.incomeChangePercent}
          bg="bg-gradient-to-br from-emerald-100 via-emerald-50 to-white text-emerald-900" emoji="💚" />
        <StatCard label="Spending" value={fmt(Number(dashboard?.totalSpending ?? 0))} change={dashboard?.spendingChangePercent}
          bg="bg-gradient-to-br from-rose-100 via-rose-50 to-white text-rose-900"        emoji="🔴" />
        <StatCard label="Savings"  value={fmt(Number(dashboard?.savings ?? 0))}
          bg="bg-gradient-to-br from-sky-100 via-sky-50 to-white text-sky-900"           emoji="🩵" />
      </div>

      {/* ── Monthly + Category ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-6">
          <SectionLabel>Monthly Overview</SectionLabel>
          {monthlyData.length === 0
            ? <Empty icon="📈" text="No monthly data" />
            : <>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f4f4f5" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#a1a1aa", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#a1a1aa", fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: "none", boxShadow: "0 8px 32px -4px rgba(0,0,0,0.12)", fontSize: 12 }}
                      formatter={(v: any) => fmt(v)} />
                    <Area type="monotone" dataKey="Income"   stroke="#34d399" strokeWidth={2.5} fill="url(#gIncome)" dot={false} />
                    <Area type="monotone" dataKey="Spending" stroke="#f472b6" strokeWidth={2.5} fill="url(#gSpend)"  dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex gap-5 mt-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                    <span className="w-3 h-0.5 bg-emerald-400 rounded-full inline-block" />Income
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                    <span className="w-3 h-0.5 bg-pink-400 rounded-full inline-block" />Spending
                  </div>
                </div>
              </>}
        </GlassCard>

        <GlassCard className="p-6">
          <SectionLabel>By Category</SectionLabel>
          {categories.length === 0
            ? <Empty icon="🏷️" text="No data" />
            : <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={categories.slice(0, 8)} cx="50%" cy="50%"
                      innerRadius={44} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {categories.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {categories.slice(0, 5).map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                      <span className="text-xs text-zinc-600 truncate flex-1">{c.name}</span>
                      <span className="text-xs font-black text-zinc-800">{fmtCompact(c.value)}</span>
                      <span className="text-[10px] text-zinc-400 w-7 text-right">{totalCatSpend ? ((c.value / totalCatSpend) * 100).toFixed(0) : 0}%</span>
                    </div>
                  ))}
                  {categories.length > 5 && (
                    <p className="text-[10px] text-zinc-400 text-center pt-1">+{categories.length - 5} more</p>
                  )}
                </div>
              </>}
        </GlassCard>
      </div>

      {/* ── Weekly spend ── */}
      {weeklyChartData.length > 0 && (
        <GlassCard className="p-6">
          <SectionLabel>Weekly Spend</SectionLabel>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={weeklyChartData} barGap={3} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#a1a1aa", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#a1a1aa", fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
              <Tooltip contentStyle={{ borderRadius: 14, fontSize: 12, border: "none", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.1)" }} formatter={(v: any) => fmt(v)} />
              <Bar dataKey="Spending" fill="#fda4af" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Income"   fill="#6ee7b7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <span className="w-3 h-2.5 bg-rose-200 rounded inline-block" />Spending
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <span className="w-3 h-2.5 bg-emerald-200 rounded inline-block" />Income
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── Recurring + Recent side by side on large, stacked on small ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recurring */}
        <GlassCard className="p-6">
          <SectionLabel>Recurring Charges</SectionLabel>
          {recurringLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="w-9 h-9 rounded-2xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-14" />
                </div>
              ))
            : recurringList.length === 0
            ? <Empty icon="🔁" text="No recurring charges" />
            : (
              <>
                {/* Summary pill */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-violet-50 rounded-2xl">
                  <div className="flex-1">
                    <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Est. Monthly</p>
                    <p className="text-lg font-black text-violet-700">
                      {fmt(recurringList.reduce((s, c) => s + Number(c.estimatedMonthly), 0))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Subscriptions</p>
                    <p className="text-lg font-black text-violet-700">{recurringList.length}</p>
                  </div>
                </div>

                <div className="divide-y divide-zinc-50">
                  {recurringList.slice(0, 6).map((c, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 hover:bg-zinc-50/60 rounded-xl transition-colors px-1">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${CAT_COLORS[i % CAT_COLORS.length]}, ${CAT_COLORS[(i+3)%CAT_COLORS.length]})` }}>
                        {(c.merchant?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-800 truncate">{c.merchant}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-zinc-400">{c.occurrences}× seen</span>
                          {c.category && <Pill variant="violet">{c.category}</Pill>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-zinc-800">{fmt(Number(c.avgAmount))}</p>
                        <p className="text-[10px] text-zinc-400">avg / charge</p>
                      </div>
                    </div>
                  ))}
                  {recurringList.length > 6 && (
                    <p className="text-xs text-zinc-400 text-center pt-3">+{recurringList.length - 6} more charges</p>
                  )}
                </div>
              </>
            )}
        </GlassCard>

        {/* Recent Transactions */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Recent Transactions</p>
            <button
              onClick={onViewAllTransactions}
              className="text-[11px] font-black text-violet-500 hover:text-violet-700 transition-colors flex items-center gap-1">
              View all <span>→</span>
            </button>
          </div>

          {recentTx.length === 0
            ? <Empty icon="💳" text="No transactions yet" />
            : (
              <div className="divide-y divide-zinc-50">
                {recentTx.slice(0, 8).map((tx: TransactionDto) => {
                  const isDebit = tx.type === "DEBIT";
                  return (
                    <div key={tx.id} className="flex items-center gap-3 py-3 hover:bg-zinc-50/60 rounded-xl px-1 transition-colors">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0
                        ${isDebit ? "bg-rose-50 text-rose-400" : "bg-emerald-50 text-emerald-500"}`}>
                        {isDebit ? "↓" : "↑"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-800 truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-400">{fmtShortDate(tx.date)}</span>
                          {tx.category && <Pill variant="violet">{tx.category}</Pill>}
                        </div>
                      </div>
                      <span className={`text-sm font-black tabular-nums flex-shrink-0 ${isDebit ? "text-rose-500" : "text-emerald-500"}`}>
                        {isDebit ? "−" : "+"}{fmtCompact(Number(tx.amount))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
        </GlassCard>
      </div>
        <AIInsightsPanel />   

    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const { data: dashboard, isLoading, isError } = useGetDashboardQuery();
  const { data: weeklyData } = useGetWeeklySpendQuery();

  const goToTransactions = () => setActiveTab("transactions");

  if (isError && !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #f0fdf4 100%)" }}>
        <div className="text-center">
          <p className="text-5xl mb-5">📂</p>
          <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto font-medium">
            Upload a bank statement to unlock your financial picture.
          </p>
          <button className="px-6 py-3 rounded-2xl bg-zinc-900 text-white text-sm font-black shadow-lg hover:bg-zinc-800 transition-colors">
            Upload Statement
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>

   
    <div className="min-h-screen font-sans"
      style={{ background: "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 40%, #f0fdf4 100%)" }}>

      {/* ── Ambient blobs ── */}
      {/* <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #c084fc, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #34d399, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #f472b6, transparent 70%)", filter: "blur(60px)" }} />
      </div> */}

      <div className="relative" style={{ zIndex: 1 }}>
        {/* <div className="sticky top-0 z-20 bg-white/60 backdrop-blur-2xl border-b border-white/60 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
            <p className="text-sm font-black text-zinc-800 tracking-tight">
              money<span className="text-violet-500">lens</span>
            </p>

            {dashboard && (
              <div className="hidden md:flex items-center gap-5">
                {[
                  { l: "Balance",  v: fmtCompact(Number(dashboard.totalBalance)),  c: "text-violet-600" },
                  { l: "Income",   v: fmtCompact(Number(dashboard.totalIncome)),    c: "text-emerald-500" },
                  { l: "Spending", v: fmtCompact(Number(dashboard.totalSpending)),  c: "text-rose-500" },
                  { l: "Savings",  v: fmtCompact(Number(dashboard.savings)),        c: "text-sky-500" },
                ].map(({ l, v, c }) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{l}</span>
                    <span className={`text-sm font-black ${c}`}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div> */}

        <div className=" mx-auto px-4 md:px-8 py-7">
          {/* ── Heading ── */}
          <div className="mb-6">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight leading-tight">
              Your finances,<br />
              <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-emerald-500 bg-clip-text text-transparent">
                all in one place.
              </span>
            </h1>
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 mb-6 p-1.5 bg-white/60 backdrop-blur-xl rounded-2xl w-fit shadow-sm border border-white/80">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200
                  ${activeTab === t.key
                    ? "bg-zinc-900 text-white shadow-md"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-white/60"}`}>
                <span className="text-base leading-none">{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          {activeTab === "overview"      && (
            <OverviewTab
              dashboard={dashboard}
              weeklyData={weeklyData}
              isLoading={isLoading}
              onViewAllTransactions={goToTransactions}
            />
          )}
          {activeTab === "transactions"  && <TransactionsTab />}
          {activeTab === "statements"    && <StatementsTab />}
        </div>
      </div>
    </div>
    <FloatingChat />
    </PageLayout>
  );
}
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
import OnboardingModal from "../components/OnboardingModal";
import ClarificationCards from "../components/ClarificationCards";

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
  "#6EE7B7","#3B82F6","#22d3ee","#a78bfa","#f472b6",
  "#34d399","#60a5fa","#e879f9","#fbbf24","#f87171",
];

const TABS = [
  { key: "overview",     label: "Overview",     emoji: "✦" },
  { key: "transactions", label: "Transactions", emoji: "⇅" },
  { key: "statements",   label: "Statements",   emoji: "◫" },
] as const;
type TabKey = typeof TABS[number]["key"];

// ── Global styles ─────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .db-root * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }

  .db-grid-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .db-glow-1 {
    position: fixed; top: -200px; right: -100px; width: 700px; height: 700px;
    background: radial-gradient(ellipse, rgba(110,231,183,0.07) 0%, rgba(59,130,246,0.04) 45%, transparent 70%);
    pointer-events: none; border-radius: 50%; z-index: 0;
  }
  .db-glow-2 {
    position: fixed; bottom: -150px; left: -100px; width: 500px; height: 500px;
    background: radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%);
    pointer-events: none; border-radius: 50%; z-index: 0;
  }

  .db-card {
    background: rgba(255,255,255,0.04);
    border: 0.5px solid rgba(255,255,255,0.09);
    border-radius: 20px;
    backdrop-filter: blur(12px);
    position: relative;
    overflow: hidden;
  }
  .db-card::before {
    content: '';
    position: absolute; inset: 0; border-radius: 20px;
    background: linear-gradient(135deg, rgba(110,231,183,0.03) 0%, rgba(59,130,246,0.015) 50%, transparent 100%);
    pointer-events: none;
  }

  .db-section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: rgba(255,255,255,0.28); margin-bottom: 16px;
  }

  /* ── Tabs: scrollable on mobile ── */
  .db-tab-bar {
    display: flex; align-items: center; gap: 4;
    padding: 6px;
    background: rgba(255,255,255,0.04);
    border-radius: 16px;
    width: fit-content;
    max-width: 100%;
    border: 0.5px solid rgba(255,255,255,0.08);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .db-tab-bar::-webkit-scrollbar { display: none; }

  .db-tab-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 12px; border: none;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; font-family: 'DM Sans', sans-serif;
    white-space: nowrap; flex-shrink: 0;
  }
  .db-tab-btn.active {
    background: linear-gradient(135deg, #6EE7B7, #22d3ee);
    color: #080B14; box-shadow: 0 4px 16px rgba(110,231,183,0.25);
  }
  .db-tab-btn.inactive {
    background: transparent; color: rgba(255,255,255,0.38);
  }
  .db-tab-btn.inactive:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }

  .db-pill {
    display: inline-flex; align-items: center;
    padding: 2px 8px; border-radius: 99px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
  }
  .db-pill-green  { background: rgba(110,231,183,0.12); color: #6EE7B7; border: 0.5px solid rgba(110,231,183,0.25); }
  .db-pill-red    { background: rgba(248,113,113,0.12); color: #f87171; border: 0.5px solid rgba(248,113,113,0.25); }
  .db-pill-blue   { background: rgba(59,130,246,0.12);  color: #60a5fa; border: 0.5px solid rgba(59,130,246,0.25); }
  .db-pill-cyan   { background: rgba(34,211,238,0.12);  color: #22d3ee; border: 0.5px solid rgba(34,211,238,0.25); }

  .db-skeleton {
    border-radius: 12px;
    background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.05) 75%);
    background-size: 200% 100%;
    animation: db-shimmer 1.4s infinite;
  }
  @keyframes db-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* ── Filter bar: wrap on mobile ── */
  .db-filter-row {
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  }

  .db-filter-btn {
    padding: 6px 14px; border-radius: 99px; border: none;
    font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif; white-space: nowrap;
  }
  .db-filter-btn.active { background: linear-gradient(135deg,#6EE7B7,#22d3ee); color: #080B14; }
  .db-filter-btn.inactive { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.45); }
  .db-filter-btn.inactive:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }

  /* ── Category pills: horizontal scroll on mobile ── */
  .db-cat-scroll {
    display: flex; gap: 8px; align-items: center;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    scrollbar-width: none; padding-bottom: 2px;
  }
  .db-cat-scroll::-webkit-scrollbar { display: none; }
  .db-cat-scroll .db-filter-btn { flex-shrink: 0; }

  .db-page-btn {
    font-size: 12px; font-weight: 700; padding: 8px 14px; border-radius: 99px; border: none;
    background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); cursor: pointer;
    transition: all 0.15s; font-family: 'DM Sans', sans-serif;
  }
  .db-page-btn:hover:not(:disabled) { background: rgba(110,231,183,0.12); color: #6EE7B7; }
  .db-page-btn:disabled { opacity: 0.25; cursor: not-allowed; }

  .db-select {
    font-size: 12px; background: rgba(255,255,255,0.06); border: 0.5px solid rgba(255,255,255,0.1);
    border-radius: 99px; padding: 6px 14px; color: rgba(255,255,255,0.6);
    font-weight: 700; outline: none; cursor: pointer; font-family: 'DM Sans', sans-serif;
  }
  .db-select option { background: #0f1524; }

  .db-tx-row { transition: background 0.15s; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
  .db-tx-row:last-child { border-bottom: none; }
  .db-tx-row:hover { background: rgba(255,255,255,0.03); }

  .db-view-all {
    font-size: 11px; font-weight: 700; color: #6EE7B7; background: none; border: none;
    cursor: pointer; display: flex; align-items: center; gap: 4px; font-family: 'DM Sans', sans-serif;
    transition: color 0.15s; white-space: nowrap;
  }
  .db-view-all:hover { color: #34d399; }

  .db-stat-card {
    position: relative; overflow: hidden; border-radius: 20px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
    border: 0.5px solid rgba(255,255,255,0.09);
    transition: transform 0.2s; cursor: default;
  }
  .db-stat-card:hover { transform: translateY(-2px); }

  /* ── Stat grid: 2 col on mobile → 4 on desktop ── */
  .db-stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  @media (min-width: 900px) {
    .db-stat-grid { grid-template-columns: repeat(4, 1fr); }
  }

  /* ── Two-column grid: stacked on mobile → side-by-side on desktop ── */
  .db-2col-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 900px) {
    .db-2col-grid { grid-template-columns: 2fr 1fr; }
  }

  /* ── Equal two-column grid: stacked on mobile ── */
  .db-2col-equal {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 900px) {
    .db-2col-equal { grid-template-columns: 1fr 1fr; }
  }

  /* ── Statements grid ── */
  .db-statements-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 540px) {
    .db-statements-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 900px) {
    .db-statements-grid { grid-template-columns: repeat(3, 1fr); }
  }

  /* ── Heading responsive sizes ── */
  .db-heading {
    font-family: 'Bricolage Grotesque', 'DM Sans', sans-serif;
    font-size: clamp(22px, 5vw, 32px);
    font-weight: 800; color: #fff;
    letter-spacing: -0.03em; line-height: 1.1; margin: 0;
  }

  /* ── Reduce inner padding on small screens ── */
  @media (max-width: 480px) {
    .db-card-pad { padding: 16px !important; }
    .db-stat-card { padding: 14px 16px !important; }
    .db-stat-card p[style*="font-size: 26"] { font-size: 20px !important; }
  }

  /* ── Sort row on mobile: stack type filters + sort below ── */
  .db-sort-row {
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  }
  .db-sort-right {
    display: flex; align-items: center; gap: 10px; margin-left: auto;
  }
  @media (max-width: 480px) {
    .db-sort-right { margin-left: 0; width: 100%; justify-content: space-between; }
  }

  /* ── TX amount: don't overflow on mobile ── */
  .db-tx-amount {
    font-size: 13px; font-weight: 800; flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  /* ── Recurring summary row: stack on very small screens ── */
  .db-recurring-summary {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 16px; padding: 12px 16px;
    background: rgba(110,231,183,0.07); border-radius: 14px;
    border: 0.5px solid rgba(110,231,183,0.15);
    flex-wrap: wrap;
  }

  .recharts-tooltip-wrapper .recharts-default-tooltip {
    background: rgba(8,11,20,0.92) !important;
    border: 0.5px solid rgba(255,255,255,0.12) !important;
    border-radius: 12px !important;
    color: #fff !important;
  }

  @keyframes db-fadeup {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .db-animate { animation: db-fadeup 0.35s ease both; }
`;

// ── Tooltip customization ─────────────────────────────────────────────────────
const customTooltipStyle = {
  background: "rgba(8,11,20,0.92)",
  border: "0.5px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
};

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="db-skeleton" style={style} />;
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 10, color: "rgba(255,255,255,0.18)" }}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{text}</p>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, change, gradient, emoji }: {
  label: string; value: string; change?: number; gradient: string; emoji: string;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="db-stat-card" style={{ background: gradient }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>{label}</span>
        <span style={{ fontSize: 18 }}>{emoji}</span>
      </div>
      <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</p>
      {change !== undefined && (
        <p style={{ fontSize: 11, fontWeight: 700, color: up ? "#6EE7B7" : "#f87171", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
          <span>{up ? "↑" : "↓"}</span>{pct(Math.abs(change))} vs last
        </p>
      )}
    </div>
  );
}

// ── Transactions Tab ──────────────────────────────────────────────────────────
function TransactionsTab({ categories = [] }: { categories?: string[] }) {
  const [params, setParams] = useState<TransactionQueryParams>({
    page: 0, size: 20, sort: "date", dir: "desc",
  });
  const { data, isLoading, isFetching } = useGetTransactionsQuery(params);
  const txList = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const set = (key: keyof TransactionQueryParams, val: any) =>
    setParams(p => ({ ...p, [key]: val, page: 0 }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="db-animate">

      {/* ── Filter bar ── */}
      <div className="db-card db-card-pad" style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Row 1: type filters + sort */}
        <div className="db-sort-row">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { val: "",       label: "All"     },
              { val: "DEBIT",  label: "Debits"  },
              { val: "CREDIT", label: "Credits" },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setParams(p => ({
                  ...p,
                  type: opt.val || undefined,
                  category: opt.val === "CREDIT" ? undefined : p.category,
                  page: 0,
                }))}
                className={`db-filter-btn ${(params.type ?? "") === opt.val ? "active" : "inactive"}`}
              >
                {opt?.label}
              </button>
            ))}
          </div>

          <div className="db-sort-right">
            <select
              className="db-select"
              value={params.dir}
              onChange={e => set("dir", e.target.value)}
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
            {data && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, whiteSpace: "nowrap" }}>
                {data.totalElements.toLocaleString()} total
              </span>
            )}
          </div>
        </div>

        {/* Row 2: category pills — horizontally scrollable on mobile */}
        {categories.length > 0 && params.type !== "CREDIT" && (
          <div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.25)", display: "block", marginBottom: 8,
            }}>
              CATEGORY
            </span>
            <div className="db-cat-scroll">
              <button
                onClick={() => set("category", undefined)}
                className={`db-filter-btn ${!params.category ? "active" : "inactive"}`}
                style={{ fontSize: 11 }}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => set("category", params.category === cat ? undefined : cat)}
                  className={`db-filter-btn ${params.category === cat ? "active" : "inactive"}`}
                  style={{ fontSize: 11 }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Transaction list ── */}
      <div className="db-card" style={{ overflow: "hidden" }}>
        <div>
          {isLoading || isFetching
            ? [...Array(7)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 20px",
                    borderBottom: "0.5px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <Skeleton style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                    <Skeleton style={{ height: 12, width: "60%" }} />
                    <Skeleton style={{ height: 10, width: "40%" }} />
                  </div>
                  <Skeleton style={{ height: 14, width: 70 }} />
                </div>
              ))
            : txList.length === 0
            ? <Empty icon="🧾" text="No transactions found" />
            : txList.map((tx: TransactionDto) => {
                const isDebit = tx.type === "DEBIT";
                return (
                  <div
                    key={tx.id}
                    className="db-tx-row"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 800,
                      background: isDebit ? "rgba(248,113,113,0.1)" : "rgba(110,231,183,0.1)",
                      color:      isDebit ? "#f87171"               : "#6EE7B7",
                      border: `0.5px solid ${isDebit ? "rgba(248,113,113,0.2)" : "rgba(110,231,183,0.2)"}`,
                    }}>
                      {isDebit ? "↓" : "↑"}
                    </div>

                    {/* Description + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)",
                        margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {tx.description}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>
                          {fmtShortDate(tx.date)}
                        </span>
                        {tx.category && (
                          <span className="db-pill db-pill-cyan">{tx.category}</span>
                        )}
                        {tx.subCategory && (
                          <span className="db-pill db-pill-blue">{tx.subCategory}</span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <span className="db-tx-amount" style={{ color: isDebit ? "#f87171" : "#6EE7B7" }}>
                      {isDebit ? "−" : "+"}{fmtCompact(Number(tx.amount))}
                    </span>
                  </div>
                );
              })}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px",
            borderTop: "0.5px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}>
            <button
              disabled={params.page === 0}
              onClick={() => setParams(p => ({ ...p, page: (p.page ?? 0) - 1 }))}
              className="db-page-btn"
            >
              ← Prev
            </button>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", fontWeight: 600 }}>
              {(params.page ?? 0) + 1} / {totalPages}
            </span>
            <button
              disabled={(params.page ?? 0) + 1 >= totalPages}
              onClick={() => setParams(p => ({ ...p, page: (p.page ?? 0) + 1 }))}
              className="db-page-btn"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Statements Tab ────────────────────────────────────────────────────────────
function StatementsTab() {
  const { data: statements, isLoading } = useGetStatementsQuery();
  if (isLoading) return (
    <div className="db-statements-grid">
      {[...Array(3)].map((_, i) => <Skeleton key={i} style={{ height: 220, borderRadius: 20 }} />)}
    </div>
  );
  if (!statements?.length) return <Empty icon="📂" text="No statements uploaded yet" />;

  return (
    <div className="db-statements-grid db-animate">
      {statements.map((s: StatementDetailDto, i: number) => (
        <div key={s.id} className="db-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16, transition: "transform 0.2s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
              color: "#080B14", fontWeight: 900, fontSize: 18, flexShrink: 0,
              background: `linear-gradient(135deg, ${CAT_COLORS[i % CAT_COLORS.length]}, ${CAT_COLORS[(i + 2) % CAT_COLORS.length]})`,
            }}>
              {(s.bankName?.[0] ?? "B").toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>{s.bankName}</p>
              <span className="db-pill db-pill-blue" style={{ marginTop: 4, display: "inline-flex" }}>Statement</span>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, border: "0.5px solid rgba(255,255,255,0.07)" }}>
            {[
              { label: "Period", value: `${s.periodFrom ? fmtShortDate(s.periodFrom) : "—"} → ${s.periodTo ? fmtShortDate(s.periodTo) : "—"}`, color: "rgba(255,255,255,0.75)" },
              s.transactionCount != null && { label: "Transactions", value: s.transactionCount, color: "#fff" },
              s.totalDebit != null && { label: "Total Spent", value: fmtCompact(Number(s.totalDebit)), color: "#f87171" },
              s.totalCredit != null && { label: "Total Earned", value: fmtCompact(Number(s.totalCredit)), color: "#6EE7B7" },
            ].filter(Boolean).map((row: any, ri) => (
              <div key={ri} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          {s.uploadedAt && (
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", margin: 0, textAlign: "right", fontWeight: 600 }}>Uploaded {fmtDate(s.uploadedAt)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ dashboard, weeklyData, isLoading, onViewAllTransactions }: {
  dashboard: any; weeklyData: any; isLoading: boolean; onViewAllTransactions: () => void;
}) {
  const { data: recurring, isLoading: recurringLoading } = useGetRecurringChargesQuery();

  const categories = useMemo(() =>
    Object.entries(dashboard?.spendingByCategory ?? {})
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value), [dashboard]);

  const totalCatSpend = useMemo(() => categories.reduce((s, c) => s + c.value, 0), [categories]);

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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="db-stat-grid">
          {[...Array(4)].map((_, i) => <Skeleton key={i} style={{ height: 110, borderRadius: 20 }} />)}
        </div>
        <div className="db-2col-grid">
          <Skeleton style={{ height: 280, borderRadius: 20 }} />
          <Skeleton style={{ height: 280, borderRadius: 20 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="db-animate">
      <ClarificationCards />

      {/* Stat Cards */}
      <div className="db-stat-grid">
        <StatCard label="Balance"  value={fmt(Number(dashboard?.totalBalance ?? 0))}  
          gradient="linear-gradient(135deg, rgba(110,231,183,0.12) 0%, rgba(110,231,183,0.04) 100%)" emoji="💚" />
        <StatCard label="Income"   value={fmt(Number(dashboard?.totalIncome ?? 0))}   
          gradient="linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%)" emoji="💙" />
        <StatCard label="Spending" value={fmt(Number(dashboard?.totalSpending ?? 0))} 
          gradient="linear-gradient(135deg, rgba(248,113,113,0.12) 0%, rgba(248,113,113,0.04) 100%)" emoji="🔴" />
        <StatCard label="Savings"  value={fmt(Number(dashboard?.savings ?? 0))}
          gradient="linear-gradient(135deg, rgba(34,211,238,0.12) 0%, rgba(34,211,238,0.04) 100%)" emoji="🩵" />
      </div>

      {/* Monthly + Category */}
      <div className="db-2col-grid">
        <div className="db-card db-card-pad" style={{ padding: "22px 24px" }}>
          <p className="db-section-label">Monthly Overview</p>
          {monthlyData.length === 0 ? <Empty icon="📈" text="No monthly data" /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6EE7B7" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#6EE7B7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.28)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.28)", fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
                  <Tooltip contentStyle={customTooltipStyle} formatter={(v: any) => fmt(v)} />
                  <Area type="monotone" dataKey="Income"   stroke="#6EE7B7" strokeWidth={2.5} fill="url(#gIncome)" dot={false} />
                  <Area type="monotone" dataKey="Spending" stroke="#f87171" strokeWidth={2.5} fill="url(#gSpend)"  dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                {[{ color: "#6EE7B7", label: "Income" }, { color: "#f87171", label: "Spending" }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
                    <span style={{ width: 14, height: 2.5, background: l.color, borderRadius: 99, display: "inline-block" }} />
                    {l?.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="db-card db-card-pad" style={{ padding: "22px 24px" }}>
          <p className="db-section-label">By Category</p>
          {categories.length === 0 ? <Empty icon="🏷️" text="No data" /> : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={categories.slice(0, 8)} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {categories.slice(0, 8).map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v)} contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
                {categories.slice(0, 5).map((c, i) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: CAT_COLORS[i % CAT_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{fmtCompact(c.value)}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", width: 28, textAlign: "right" }}>{totalCatSpend ? ((c.value / totalCatSpend) * 100).toFixed(0) : 0}%</span>
                  </div>
                ))}
                {categories.length > 5 && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", margin: "4px 0 0", fontWeight: 600 }}>+{categories.length - 5} more</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weekly Spend */}
      {weeklyChartData.length > 0 && (
        <div className="db-card db-card-pad" style={{ padding: "22px 24px" }}>
          <p className="db-section-label">Weekly Spend</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyChartData} barGap={4} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.28)", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.28)", fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
              <Tooltip contentStyle={customTooltipStyle} formatter={(v: any) => fmt(v)} />
              <Bar dataKey="Spending" fill="rgba(248,113,113,0.7)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Income"   fill="rgba(110,231,183,0.7)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
            {[{ color: "rgba(248,113,113,0.7)", label: "Spending" }, { color: "rgba(110,231,183,0.7)", label: "Income" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
                <span style={{ width: 12, height: 10, background: l.color, borderRadius: 4, display: "inline-block" }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring + Recent — equal columns, stacked on mobile */}
      <div className="db-2col-equal">

        {/* Recurring */}
        <div className="db-card db-card-pad" style={{ padding: "22px 24px" }}>
          <p className="db-section-label">Recurring Charges</p>
          {recurringLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                  <Skeleton style={{ width: 38, height: 38, borderRadius: 12 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <Skeleton style={{ height: 11, width: "60%" }} /><Skeleton style={{ height: 9, width: "40%" }} />
                  </div>
                  <Skeleton style={{ height: 12, width: 60 }} />
                </div>
              ))
            : recurringList.length === 0 ? <Empty icon="🔁" text="No recurring charges" />
            : (
              <>
                <div className="db-recurring-summary">
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(110,231,183,0.6)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}>Est. Monthly</p>
                    <p style={{ margin: "3px 0 0", fontSize: 20, fontWeight: 900, color: "#6EE7B7" }}>
                      {fmt(recurringList.reduce((s, c) => s + Number(c.estimatedMonthly), 0))}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(110,231,183,0.6)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}>Subscriptions</p>
                    <p style={{ margin: "3px 0 0", fontSize: 20, fontWeight: 900, color: "#6EE7B7" }}>{recurringList.length}</p>
                  </div>
                </div>
                {recurringList.slice(0, 6).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#080B14", fontSize: 13, fontWeight: 900,
                      background: `linear-gradient(135deg, ${CAT_COLORS[i % CAT_COLORS.length]}, ${CAT_COLORS[(i + 3) % CAT_COLORS.length]})`,
                    }}>
                      {(c.merchant?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.merchant}</p>
                      <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{c.occurrences}× seen</span>
                        {c.category && <span className="db-pill db-pill-cyan">{c.category}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>{fmtCompact(Number(c.avgAmount))}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", margin: "2px 0 0" }}>avg</p>
                    </div>
                  </div>
                ))}
                {recurringList.length > 6 && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", textAlign: "center", padding: "10px 0 0", fontWeight: 600 }}>+{recurringList.length - 6} more charges</p>}
              </>
            )}
        </div>

        {/* Recent Transactions */}
        <div className="db-card db-card-pad" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p className="db-section-label" style={{ marginBottom: 0 }}>Recent Transactions</p>
            <button className="db-view-all" onClick={onViewAllTransactions}>View all <span>→</span></button>
          </div>
          {recentTx.length === 0 ? <Empty icon="💳" text="No transactions yet" /> : (
            recentTx.slice(0, 8).map((tx: TransactionDto) => {
              const isDebit = tx.type === "DEBIT";
              return (
                <div key={tx.id} className="db-tx-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, flexShrink: 0,
                    background: isDebit ? "rgba(248,113,113,0.1)" : "rgba(110,231,183,0.1)",
                    color: isDebit ? "#f87171" : "#6EE7B7",
                  }}>
                    {isDebit ? "↓" : "↑"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.82)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{fmtShortDate(tx.date)}</span>
                      {tx.category && <span className="db-pill db-pill-cyan">{tx.category}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: isDebit ? "#f87171" : "#6EE7B7", flexShrink: 0 }}>
                    {isDebit ? "−" : "+"}{fmtCompact(Number(tx.amount))}
                  </span>
                </div>
              );
            })
          )}
        </div>
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

  if (isError && !dashboard) {
    return (
      <div style={{ minHeight: "100vh", background: "#080B14", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <style>{GLOBAL_STYLES}</style>
        <div className="db-grid-bg" /><div className="db-glow-1" /><div className="db-glow-2" />
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📂</p>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, marginBottom: 24, maxWidth: 280, margin: "0 auto 24px", fontWeight: 500 }}>
            Upload a bank statement to unlock your financial picture.
          </p>
          <button style={{
            padding: "12px 28px", borderRadius: 14, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #6EE7B7, #22d3ee)", color: "#080B14",
            fontSize: 13, fontWeight: 800, boxShadow: "0 8px 24px rgba(110,231,183,0.25)",
            fontFamily: "DM Sans, sans-serif",
          }}>
            Upload Statement
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <OnboardingModal />
      <style>{GLOBAL_STYLES}</style>
      <div className="db-root" style={{ minHeight: "100vh", background: "#080B14", fontFamily: "DM Sans, sans-serif" }}>
        <div className="db-grid-bg" /><div className="db-glow-1" /><div className="db-glow-2" />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px 80px" }}>

            {/* Heading */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6EE7B7", marginBottom: 8 }}>
                Financial Dashboard
              </p>
              <h1 className="db-heading">
                Your finances,{" "}
                <span style={{ backgroundImage: "linear-gradient(135deg, #6EE7B7, #3B82F6, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  all in one place.
                </span>
              </h1>
            </div>

            {/* Tabs — scrollable bar */}
            <div className="db-tab-bar" style={{ marginBottom: 24 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`db-tab-btn ${activeTab === t.key ? "active" : "inactive"}`}>
                  <span style={{ fontSize: 14 }}>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            {activeTab === "overview" && (
              <OverviewTab dashboard={dashboard} weeklyData={weeklyData} isLoading={isLoading} onViewAllTransactions={() => setActiveTab("transactions")} />
            )}
            {activeTab === "transactions" && (
              <TransactionsTab categories={Object.keys(dashboard?.spendingByCategory ?? {})} />
            )}
            {activeTab === "statements" && <StatementsTab />}
          </div>
        </div>
      </div>
      <FloatingChat />
    </PageLayout>
  );
}
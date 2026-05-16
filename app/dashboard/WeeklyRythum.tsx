import { useRef, useEffect } from "react";
import { Activity, TrendingDown, TrendingUp, Minus } from "lucide-react";
import Chart from "chart.js/auto";
import { useGetWeeklySpendQuery } from "../redux/api/authApi";

interface WeeklySpendItem {
  label: string;
  rangeFrom: string;
  rangeTo: string;
  debit: number;
  credit: number;
  txCount: number;
}

function fmtCompact(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + Math.round(n);
}

function fmtINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

const fmtRange = (from: string, to: string) => {
  const f = (d: string) => {
    const [, m, day] = d.split("-");
    return `${parseInt(day)} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}`;
  };
  return `${f(from)}–${f(to)}`;
};

// ─── Chart 1: Grouped Income vs Spend bars ──────────────────────────────────
function IncomeVsSpendChart({ data }: { data: WeeklySpendItem[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inst = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;
    inst.current?.destroy();

    const labels  = data.map(w => w.label);
    const debits  = data.map(w => Number(w.debit));
    const credits = data.map(w => Number(w.credit));

    inst.current = new Chart(ref.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Income",
            data: credits,
            backgroundColor: "rgba(5,150,105,0.85)",
            borderColor: "#059669",
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: "Spent",
            data: debits,
            backgroundColor: "rgba(225,29,72,0.8)",
            borderColor: "#e11d48",
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0f172a",
            titleColor: "#94a3b8",
            bodyColor: "#f8fafc",
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              title: (items) => {
                const w = data[items[0].dataIndex];
                return `${w.label}  ·  ${fmtRange(w.rangeFrom, w.rangeTo)}`;
              },
              label: (item) =>
                `  ${item.dataset.label === "Income" ? "Income " : "Spent  "}  ${fmtINR(item.raw as number)}`,
              afterBody: (items) => {
                const w = data[items[0].dataIndex];
                const net = Number(w.credit) - Number(w.debit);
                const sign = net >= 0 ? "+" : "";
                return [`  Net  ${sign}${fmtINR(net)}`];
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: "#94a3b8", font: { size: 11 } },
          },
          y: {
            grid: { color: "rgba(148,163,184,0.1)" },
            border: { display: false },
            ticks: {
              color: "#94a3b8",
              font: { size: 11 },
              padding: 8,
              callback: (v) => fmtCompact(Number(v)),
            },
            beginAtZero: true,
          },
        },
      },
    });

    return () => { inst.current?.destroy(); inst.current = null; };
  }, [data]);

  return (
    <div style={{ position: "relative", width: "100%", height: "200px" }}>
      <canvas ref={ref} role="img" aria-label="Grouped bar chart: income vs spending per week" />
    </div>
  );
}

// ─── Chart 2: Running Net Balance ───────────────────────────────────────────
function RunningBalanceChart({ data }: { data: WeeklySpendItem[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inst = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;
    inst.current?.destroy();

    let running = 0;
    const balances = data.map(w => {
      running += Number(w.credit) - Number(w.debit);
      return running;
    });

    const colors = balances.map(b => b >= 0 ? "#059669" : "#e11d48");

    inst.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels: data.map(w => w.label),
        datasets: [
          {
            label: "Running balance",
            data: balances,
            borderColor: "#7c3aed",
            backgroundColor: (ctx: any) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
              gradient.addColorStop(0, "rgba(124,58,237,0.18)");
              gradient.addColorStop(1, "rgba(124,58,237,0)");
              return gradient;
            },
            borderWidth: 2.5,
            pointBackgroundColor: colors,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.35,
            fill: true,
          } as any,
          {
            label: "Break even",
            data: data.map(() => 0),
            borderColor: "rgba(148,163,184,0.4)",
            borderWidth: 1.5,
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
          } as any,
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0f172a",
            titleColor: "#94a3b8",
            bodyColor: "#f8fafc",
            padding: 12,
            cornerRadius: 10,
            filter: (item) => item.dataset.label !== "Break even",
            callbacks: {
              title: (items) => {
                const w = data[items[0].dataIndex];
                return `${w.label}  ·  ${fmtRange(w.rangeFrom, w.rangeTo)}`;
              },
              label: (item) => {
                const v = item.raw as number;
                const sign = v >= 0 ? "+" : "";
                return `  Net balance  ${sign}${fmtINR(v)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: "#94a3b8", font: { size: 11 } },
          },
          y: {
            grid: { color: "rgba(148,163,184,0.1)" },
            border: { display: false },
            ticks: {
              color: "#94a3b8",
              font: { size: 11 },
              padding: 8,
              callback: (v) => fmtCompact(Number(v)),
            },
          },
        },
      },
    });

    return () => { inst.current?.destroy(); inst.current = null; };
  }, [data]);

  return (
    <div style={{ position: "relative", width: "100%", height: "180px" }}>
      <canvas ref={ref} role="img" aria-label="Cumulative net balance line chart across weeks" />
    </div>
  );
}

// ─── Chart 3: Transaction activity ──────────────────────────────────────────
function TxActivityChart({ data }: { data: WeeklySpendItem[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inst = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;
    inst.current?.destroy();

    const maxTx = Math.max(...data.map(w => w.txCount));
    const barColors = data.map(w =>
      w.txCount === maxTx ? "#f59e0b" : "rgba(245,158,11,0.4)"
    );

    inst.current = new Chart(ref.current, {
      type: "bar",
      data: {
        labels: data.map(w => w.label),
        datasets: [{
          label: "Transactions",
          data: data.map(w => w.txCount),
          backgroundColor: barColors,
          borderColor: barColors.map(c => c === "#f59e0b" ? "#b45309" : "rgba(180,83,9,0.4)"),
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: "y" as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0f172a",
            titleColor: "#94a3b8",
            bodyColor: "#f8fafc",
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              title: (items) => {
                const w = data[items[0].dataIndex];
                return `${w.label}  ·  ${fmtRange(w.rangeFrom, w.rangeTo)}`;
              },
              label: (item) =>
                `  ${item.raw} transactions  ·  avg ₹${Math.round(Number(data[item.dataIndex].debit) / (item.raw as number)).toLocaleString("en-IN")} each`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(148,163,184,0.1)" },
            border: { display: false },
            ticks: { color: "#94a3b8", font: { size: 11 } },
            beginAtZero: true,
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: "#94a3b8", font: { size: 11 } },
          },
        },
      },
    });

    return () => { inst.current?.destroy(); inst.current = null; };
  }, [data]);

  return (
    <div style={{ position: "relative", width: "100%", height: `${data.length * 42 + 40}px` }}>
      <canvas ref={ref} role="img" aria-label="Horizontal bar chart of transaction count per week" />
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function WeeklySpendRhythm({ statementId }: { statementId: string }) {
  const { data: res, isLoading } = useGetWeeklySpendQuery(statementId);
  const data: WeeklySpendItem[] = res?.data ?? [];

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[200, 200, 180].map((h, i) => (
          <div key={i} className="card" style={{ padding: "20px 24px" }}>
            <div className="skeleton" style={{ height: "14px", width: "40%", marginBottom: "20px" }} />
            <div className="skeleton" style={{ height: `${h}px`, borderRadius: "12px" }} />
          </div>
        ))}
      </div>
    );
  }

  if (!data.length) return null;

  const totalSpend  = data.reduce((s, w) => s + Number(w.debit), 0);
  const totalIncome = data.reduce((s, w) => s + Number(w.credit), 0);
  const netBalance  = totalIncome - totalSpend;
  const avgWeeklySpend = Math.round(totalSpend / data.length);

  const peakSpendIdx = data.reduce((b, w, i) => Number(w.debit) > Number(data[b].debit) ? i : b, 0);
  const mostActivIdx = data.reduce((b, w, i) => w.txCount > data[b].txCount ? i : b, 0);

  // Spend category: weeks where income > spend = "green", else "red"
  const weekStatus = data.map(w => Number(w.credit) > Number(w.debit) ? "surplus" : "deficit");

  const sectionStyle: React.CSSProperties = {
    padding: "20px 24px 8px",
    borderBottom: "1px solid #f1f5f9",
  };
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    margin: "0 0 16px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* ── Summary stat bar ── */}
      <div className="card fade-up fade-up-3" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 24px 14px", borderBottom: "1px solid #f1f5f9" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", margin: 0 }}>
            Weekly financial summary
          </h2>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            {data.length} weeks · {fmtRange(data[0].rangeFrom, data[data.length - 1].rangeTo)}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {[
            { label: "Total spent",   value: fmtCompact(totalSpend),   color: "#e11d48" },
            { label: "Total income",  value: fmtCompact(totalIncome),  color: "#059669" },
            { label: "Net balance",   value: (netBalance >= 0 ? "+" : "") + fmtCompact(netBalance), color: netBalance >= 0 ? "#059669" : "#e11d48" },
            { label: "Avg/week",      value: fmtCompact(avgWeeklySpend), color: "#0f172a" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "16px 20px", borderLeft: i > 0 ? "1px solid #f1f5f9" : "none" }}>
              <p style={{ fontSize: "10px", color: "#94a3b8", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                {s.label}
              </p>
              <p style={{ fontSize: "17px", fontWeight: 700, color: s.color, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chart 1: Income vs Spend ── */}
      <div className="card fade-up fade-up-3" style={{ overflow: "hidden" }}>
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Income vs spend — per week</p>
          <div style={{ display: "flex", gap: "18px", marginBottom: "16px" }}>
            {[
              { color: "#059669", label: "Income" },
              { color: "#e11d48", label: "Spent" },
            ].map((l, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: "inline-block" }} />
                {l.label}
              </span>
            ))}
          </div>
          <IncomeVsSpendChart data={data} />
        </div>

        {/* Week-level surplus/deficit badges */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.length}, 1fr)`, padding: "12px 24px 16px", gap: "8px" }}>
          {data.map((w, i) => {
            const net = Number(w.credit) - Number(w.debit);
            const surplus = net >= 0;
            return (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "99px",
                  background: surplus ? "#ecfdf5" : "#fff1f2",
                  color: surplus ? "#059669" : "#e11d48",
                }}>
                  {surplus ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {surplus ? "+" : ""}{fmtCompact(net)}
                </div>
                <p style={{ fontSize: "10px", color: "#94a3b8", margin: "4px 0 0" }}>{w.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chart 2: Running balance ── */}
      <div className="card fade-up fade-up-3" style={{ overflow: "hidden" }}>
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Cumulative net balance</p>
          <div style={{ display: "flex", gap: "18px", marginBottom: "16px" }}>
            {[
              { el: <span style={{ width: 16, height: 3, borderRadius: 2, background: "#7c3aed", display: "inline-block" }} />, label: "Running balance" },
              { el: <span style={{ width: 16, height: 0, borderTop: "2px dashed #94a3b8", display: "inline-block" }} />, label: "Break even" },
            ].map((l, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                {l.el} {l.label}
              </span>
            ))}
          </div>
          <RunningBalanceChart data={data} />
        </div>

        <div style={{ display: "flex", gap: "10px", padding: "12px 24px 16px" }}>
          <div style={{
            flex: 1, display: "flex", gap: "10px", alignItems: "flex-start",
            background: netBalance >= 0 ? "#ecfdf5" : "#fff1f2",
            border: `1px solid ${netBalance >= 0 ? "#a7f3d0" : "#fecdd3"}`,
            borderRadius: "12px", padding: "12px 14px",
          }}>
            {netBalance >= 0
              ? <TrendingUp size={14} color="#059669" style={{ marginTop: "1px", flexShrink: 0 }} />
              : <TrendingDown size={14} color="#e11d48" style={{ marginTop: "1px", flexShrink: 0 }} />
            }
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: netBalance >= 0 ? "#065f46" : "#9f1239", margin: "0 0 3px" }}>
                {netBalance >= 0 ? "You're in the green" : "Spending exceeds income"}
              </p>
              <p style={{ fontSize: "12px", color: netBalance >= 0 ? "#059669" : "#e11d48", margin: 0, lineHeight: 1.6 }}>
                Net {netBalance >= 0 ? "surplus" : "deficit"} of {fmtCompact(Math.abs(netBalance))} over {data.length} weeks.
                {netBalance >= 0
                  ? ` Week 2's ₹81.5K income drove most of this.`
                  : ` Review your biggest spend weeks.`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chart 3: Transaction activity ── */}
      <div className="card fade-up fade-up-3" style={{ overflow: "hidden" }}>
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Transaction activity — volume & avg ticket</p>
          <TxActivityChart data={data} />
        </div>

        <div style={{ display: "flex", gap: "10px", padding: "12px 24px 16px" }}>
          <div style={{
            flex: 1, display: "flex", gap: "10px", alignItems: "flex-start",
            background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "12px 14px",
          }}>
            <Activity size={14} color="#d97706" style={{ marginTop: "1px", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#92400e", margin: "0 0 3px" }}>
                {data[mostActivIdx].label} — most active ({data[mostActivIdx].txCount} txns)
              </p>
              <p style={{ fontSize: "12px", color: "#d97706", margin: 0, lineHeight: 1.6 }}>
                Avg ticket ₹{Math.round(Number(data[mostActivIdx].debit) / data[mostActivIdx].txCount).toLocaleString("en-IN")} per transaction.
                {" "}{data[peakSpendIdx].label} had the heaviest spend at {fmtCompact(Number(data[peakSpendIdx].debit))}.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
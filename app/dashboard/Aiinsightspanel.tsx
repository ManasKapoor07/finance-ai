"use client";

import {
  useGetAIAnalysisQuery,
  useRefreshAIAnalysisMutation,
} from "../redux/api/authApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthScore {
  score: number;
  grade: string;
  label: string;
}

interface Projection {
  headline: string;
  impact: string;
  timeframe: string;
  type: string;
}

interface BehavioralSignal {
  label: string;
  observation: string;
  emotion: string | null;
  intensity: number;
}

interface HiddenPattern {
  title: string;
  insight: string;
  category: string;
}

interface MoneyPersonality {
  archetype: string;
  description: string;
  trait: string;
}

interface SpendingPulse {
  status: string;
  summary: string;
}

interface Analysis {
  summary: string;
  moneyPersonality: MoneyPersonality;
  spendingPulse: SpendingPulse;
  healthScore: HealthScore;
  risks: string[];
  positiveHabits: string[];
  recommendations: string[];
  nextActions: string[];
  projections: Projection[];
  behavioralSignals: BehavioralSignal[];
  hiddenPatterns: HiddenPattern[];
}

interface APIResponse {
  analysis: Analysis;
  isStale: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 70) return { fg: "#6EE7B7", bg: "rgba(110,231,183,0.12)", border: "rgba(110,231,183,0.25)" };
  if (score >= 50) return { fg: "#F59E0B", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)" };
  return             { fg: "#FB7185", bg: "rgba(251,113,133,0.12)",  border: "rgba(251,113,133,0.25)" };
}

function intensityColor(v: number) {
  if (v >= 8) return "#FB7185";
  if (v >= 5) return "#F59E0B";
  return "#6EE7B7";
}

// ─── Responsive style injection ───────────────────────────────────────────────

const responsiveStyles = `
  .ai-hero-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 32px;
    align-items: start;
  }
  .ai-split-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  .ai-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 28px;
  }
  .ai-stale-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .ai-score-ring {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  @media (max-width: 640px) {
    .ai-hero-grid {
      grid-template-columns: 1fr;
    }
    .ai-score-ring {
      flex-direction: row;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    .ai-score-ring-meta {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .ai-split-grid {
      grid-template-columns: 1fr;
    }
    .ai-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
  @media (max-width: 480px) {
    .ai-wrapper {
      padding: 16px !important;
    }
    .ai-card {
      padding: 16px !important;
    }
    .ai-hero-title {
      font-size: 28px !important;
    }
    .ai-stat-grid {
      grid-template-columns: 1fr 1fr !important;
    }
  }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: "0 0 20px",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.18em",
      textTransform: "uppercase" as const,
      color: "rgba(255,255,255,0.3)",
    }}>
      {children}
    </p>
  );
}

function Card({
  children,
  style = {},
  className = "",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`ai-card ${className}`}
      style={{
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        padding: "24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Pill({
  children,
  color = "#6EE7B7",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: 99,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.08em",
      background: color + "18",
      border: `1px solid ${color}30`,
      color,
    }}>
      {children}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const c = scoreColor(score);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
      <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
        <circle
          cx={70} cy={70} r={r} fill="none"
          stroke={c.fg} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 4, letterSpacing: "0.1em" }}>/&nbsp;100</span>
      </div>
    </div>
  );
}

function IntensityBar({ value }: { value: number }) {
  const color = intensityColor(value);
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" as const }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{
          width: 14, height: 4, borderRadius: 2,
          background: i < value ? color : "rgba(255,255,255,0.08)",
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{
      minHeight: 500, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
    }}>
      <div style={{
        width: 48, height: 48,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.08)",
        borderTop: "2px solid #6EE7B7",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
        Building your financial intelligence report…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      minHeight: 500, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center",
    }}>
      <div style={{ fontSize: 40, opacity: 0.4 }}>◎</div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#fff" }}>No insights yet</h2>
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", maxWidth: 340, lineHeight: 1.8 }}>
        Upload a bank statement to generate your AI financial behavior report.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIInsightsPanel() {
  const { data: raw, isLoading, isError } = useGetAIAnalysisQuery() as {
    data: APIResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  };

  const [refresh, { isLoading: refreshing }] = useRefreshAIAnalysisMutation();

  const analysis: Analysis | undefined = raw?.analysis;
  const isStale: boolean = raw?.isStale ?? false;

  const score = analysis?.healthScore?.score ?? 0;
  const sc = scoreColor(score);

  if (isLoading) return <Wrapper><LoadingState /></Wrapper>;
  if (isError || !analysis) return <Wrapper><EmptyState /></Wrapper>;

  const shoppingSignal = analysis.behavioralSignals?.find(s =>
    s.label.toLowerCase().includes("shopping")
  );
  const foodSignal = analysis.behavioralSignals?.find(s =>
    s.label.toLowerCase().includes("food")
  );
  const duplicateSignal = analysis.behavioralSignals?.find(s =>
    s.label.toLowerCase().includes("duplicate")
  );

  function extractAmount(observation: string): string {
    const match = observation.match(/₹[\d,]+/);
    return match ? match[0] : "—";
  }

  function extractCount(observation: string): string {
    const match = observation.match(/(\d+)\s+(payment|charge|order|time)/i);
    return match ? `${match[1]} detected` : "—";
  }

  const leaks = [
    shoppingSignal && {
      label: "Shopping",
      amount: extractAmount(shoppingSignal.observation),
      intensity: shoppingSignal.intensity,
    },
    foodSignal && {
      label: "Food Delivery",
      amount: extractAmount(foodSignal.observation),
      intensity: foodSignal.intensity,
    },
    duplicateSignal && {
      label: "Duplicate Payments",
      amount: extractCount(duplicateSignal.observation),
      intensity: duplicateSignal.intensity,
    },
  ].filter(Boolean) as { label: string; amount: string; intensity: number }[];

  return (
    <Wrapper>
      <style>{responsiveStyles}</style>

      {/* ── Stale banner ── */}
      {isStale && (
        <div style={{
          padding: "12px 18px", borderRadius: 14, marginBottom: 16,
          background: "rgba(251,191,36,0.07)",
          border: "0.5px solid rgba(251,191,36,0.25)",
        }} className="ai-stale-banner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14 }}>✦</span>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "rgba(251,191,36,0.9)", lineHeight: 1.5 }}>
              New answers detected — your insights may be outdated.
            </p>
          </div>
          <button
            onClick={() => refresh()}
            disabled={refreshing}
            style={{
              flexShrink: 0, padding: "7px 16px", borderRadius: 99, border: "none",
              background: "rgba(251,191,36,0.15)", color: "#fbbf24",
              fontSize: 12, fontWeight: 700, cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.6 : 1, whiteSpace: "nowrap" as const,
            }}
          >
            {refreshing ? "Refreshing…" : "Refresh insights →"}
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="ai-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "#6EE7B7" }}>
            AI FINANCIAL INTELLIGENCE
          </p>
          <h1
            className="ai-hero-title"
            style={{ margin: 0, fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 700, color: "#fff", lineHeight: 1.05, letterSpacing: "-0.04em" }}
          >
            Your financial<br />behavior report.
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.9, maxWidth: 520 }}>
            {analysis.summary}
          </p>
        </div>

        {!isStale && (
          <button
            onClick={() => refresh()}
            disabled={refreshing}
            style={{
              alignSelf: "flex-start",
              padding: "9px 18px", borderRadius: 99,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)",
              fontSize: 12, fontWeight: 600, cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.5 : 1, whiteSpace: "nowrap" as const,
            }}
          >
            {refreshing ? "Refreshing…" : "↺ Refresh"}
          </button>
        )}
      </div>

      {/* ── Hero: Score + Personality ── */}
      <Card style={{ marginBottom: 16, overflow: "hidden", position: "relative" }}>
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, ${sc.bg}, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div className="ai-hero-grid">
          {/* Score ring + meta */}
          <div className="ai-score-ring">
            <ScoreRing score={score} />
            <div className="ai-score-ring-meta">
              <Pill color={sc.fg}>{analysis.healthScore.label}</Pill>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                Grade <strong style={{ color: sc.fg }}>{analysis.healthScore.grade}</strong>
              </p>
              <div style={{ width: 120 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 5 }}>
                  <span>At Risk</span><span>Healthy</span>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${score}%`, background: sc.fg, transition: "width 1s ease" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Personality + spending pulse */}
          <div>
            <div style={{ marginBottom: 20 }}>
              <SectionLabel>Money Personality</SectionLabel>
              <h2 style={{ margin: "0 0 8px", fontSize: "clamp(18px, 2.5vw, 22px)", fontWeight: 700, color: "#fff" }}>
                {analysis.moneyPersonality.archetype}
              </h2>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
                {analysis.moneyPersonality.description}
              </p>
              <div style={{
                display: "inline-block", padding: "6px 14px", borderRadius: 8,
                background: "rgba(110,231,183,0.07)", border: "1px solid rgba(110,231,183,0.15)",
                fontSize: 12, color: "rgba(110,231,183,0.8)", fontStyle: "italic",
              }}>
                "{analysis.moneyPersonality.trait}"
              </div>
            </div>

            {/* Spending pulse */}
            <div style={{
              padding: "14px 18px", borderRadius: 14,
              background: analysis.spendingPulse.status === "Unstable"
                ? "rgba(251,113,133,0.06)" : "rgba(110,231,183,0.06)",
              border: `1px solid ${analysis.spendingPulse.status === "Unstable"
                ? "rgba(251,113,133,0.2)" : "rgba(110,231,183,0.2)"}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: analysis.spendingPulse.status === "Unstable" ? "#FB7185" : "#6EE7B7",
                  boxShadow: `0 0 6px ${analysis.spendingPulse.status === "Unstable" ? "#FB7185" : "#6EE7B7"}`,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>
                  SPENDING PULSE · {analysis.spendingPulse.status.toUpperCase()}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                {analysis.spendingPulse.summary}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Behavioral Signals ── */}
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>Behavioral Signals</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {analysis.behavioralSignals?.map((signal, i) => (
            <div key={i} style={{
              padding: "18px 20px", borderRadius: 14,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#fff" }}>
                    {signal.label}
                  </h4>
                  {signal.emotion && (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
                      {signal.emotion}
                    </span>
                  )}
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: intensityColor(signal.intensity) }}>
                    {signal.intensity}
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>/10</span>
                </div>
              </div>
              <IntensityBar value={signal.intensity} />
              <p style={{ margin: "12px 0 0", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>
                {signal.observation}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Hidden Patterns + Money Leaks ── */}
      <div className="ai-split-grid">
        {/* Hidden patterns */}
        <Card>
          <SectionLabel>Hidden Patterns</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {analysis.hiddenPatterns?.map((p, i) => (
              <div key={i} style={{
                padding: "16px 18px", borderRadius: 14,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <Pill color="#6EE7B7">{p.category}</Pill>
                <h3 style={{ margin: "10px 0 6px", fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
                  {p.title}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>
                  {p.insight}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Money leaks */}
        <Card>
          <SectionLabel>Money Leaks</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {leaks.map((leak, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{leak.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{leak.amount}</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.05)" }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    width: `${(leak.intensity / 10) * 100}%`,
                    background: intensityColor(leak.intensity),
                    transition: "width 1s ease",
                  }} />
                </div>
              </div>
            ))}

            {/* Risks list */}
            <div style={{ marginTop: 8, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}>
                RISK FACTORS
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {analysis.risks?.map((risk, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#FB7185", fontSize: 12, marginTop: 1, flexShrink: 0 }}>▲</span>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{risk}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Projections ── */}
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>12-Month Forecast</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {analysis.projections?.map((proj, i) => (
            <div key={i} style={{
              padding: "18px 20px", borderRadius: 14,
              background: "rgba(251,113,133,0.04)",
              border: "1px solid rgba(251,113,133,0.15)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
                <Pill color="#FB7185">{proj.timeframe}</Pill>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
                  {proj.type.toUpperCase()}
                </span>
              </div>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.45 }}>
                {proj.headline}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                {proj.impact}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Action Plan ── */}
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel>What to Fix First</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {analysis.nextActions?.map((action, i) => (
            <div key={i} style={{
              display: "flex", gap: 16, alignItems: "flex-start",
              padding: "16px 18px", borderRadius: 14,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: i === 0
                  ? "rgba(110,231,183,0.15)"
                  : i === 1
                  ? "rgba(245,158,11,0.12)"
                  : "rgba(255,255,255,0.05)",
                fontSize: 12, fontWeight: 700,
                color: i === 0 ? "#6EE7B7" : i === 1 ? "#F59E0B" : "rgba(255,255,255,0.4)",
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)" }}>
                  {i === 0 ? "TOP PRIORITY" : i === 1 ? "SECONDARY" : "OPTIMIZATION"}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                  {action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Positive Habits ── */}
      <Card>
        <SectionLabel>What You're Doing Right</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {analysis.positiveHabits?.map((habit, i) => (
            <div key={i} style={{
              padding: "14px 16px", borderRadius: 14,
              background: "rgba(110,231,183,0.04)",
              border: "1px solid rgba(110,231,183,0.12)",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ color: "#6EE7B7", fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{habit}</p>
            </div>
          ))}
        </div>
      </Card>
    </Wrapper>
  );
}

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="ai-wrapper"
      style={{
        borderRadius: 28,
        background: "#080B14",
        padding: "28px",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
        `,
        backgroundSize: "52px 52px",
      }} />
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: -150, right: -100,
        width: 500, height: 500, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(110,231,183,0.07), transparent 70%)",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
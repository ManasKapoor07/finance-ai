"use client";

import { useState } from "react";
import { useGetAIAnalysisQuery, useRefreshAIAnalysisMutation } from "../redux/api/authApi";
import type { AIAnalysisResponse } from "../redux/api/authApi";

// ── Types (match AIAnalysisResponse DTO) ─────────────────────────────────────
type Signal   = { label: string; observation: string; emotion: string; intensity: number };
type Pattern  = { title: string; insight: string; category: string };
type Projection = { headline: string; impact: string; timeframe: string; type: string };

// ── Score helpers ─────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 70) return { fg: "#166534", bg: "#dcfce7", border: "#86efac" };
  if (score >= 50) return { fg: "#854d0e", bg: "#fef9c3", border: "#fde047" };
  return { fg: "#991b1b", bg: "#fee2e2", border: "#fca5a5" };
}
function scoreLabel(score: number) {
  if (score >= 80) return "Healthy";
  if (score >= 65) return "Fair";
  if (score >= 50) return "Needs attention";
  return "At risk";
}
function scoreGrade(score: number) {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

// ── Personality archetype accent ──────────────────────────────────────────────
const ARCHETYPE_COLORS: Record<string, { bg: string; border: string; fg: string }> = {
  default:   { bg: "#eef2ff", border: "#a5b4fc", fg: "#3730a3" },
  impulsive: { bg: "#fff7ed", border: "#fdba74", fg: "#9a3412" },
  saver:     { bg: "#f0fdf4", border: "#86efac", fg: "#166534" },
  anxious:   { bg: "#fdf4ff", border: "#d8b4fe", fg: "#6b21a8" },
  social:    { bg: "#ecfeff", border: "#67e8f9", fg: "#0e7490" },
};
function archetypeAccent(archetype: string = "") {
  const key = Object.keys(ARCHETYPE_COLORS).find(k =>
    archetype.toLowerCase().includes(k)
  );
  return ARCHETYPE_COLORS[key ?? "default"];
}

// ── Tiny atoms ────────────────────────────────────────────────────────────────
function Tag({ text, color }: { text: string; color: { bg: string; fg: string; border: string } }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.06em",
      background: color.bg,
      color: color.fg,
      border: `1px solid ${color.border}`,
    }}>{text}</span>
  );
}

function IntensityBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  const color = pct >= 70 ? "#f87171" : pct >= 40 ? "#fb923c" : "#34d399";
  return (
    <div style={{ height: 4, background: "#f3f4f6", borderRadius: 99, marginTop: 8, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: "0.18em",
      color: "#9ca3af",
      textTransform: "uppercase",
      marginBottom: 12,
    }}>{children}</p>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #f0f0f0",
      borderRadius: 20,
      padding: "20px 22px",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16 }: { w?: string | number; h?: number }) {
  return (
    <div style={{
      width: w, height: h,
      borderRadius: 8,
      background: "linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ── Loading state ─────────────────────────────────────────────────────────────
function LoadingPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <Card>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Skeleton w={90} h={90} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton w="60%" h={18} />
            <Skeleton w="80%" h={13} />
            <Skeleton w="50%" h={13} />
          </div>
        </div>
      </Card>
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <Skeleton w="35%" h={10} />
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton h={13} />
            <Skeleton w="85%" h={13} />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyPanel() {
  return (
    <Card style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
      <p style={{ fontWeight: 700, color: "#111827", fontSize: 16, marginBottom: 6 }}>
        No data to analyse yet
      </p>
      <p style={{ fontSize: 13, color: "#9ca3af" }}>
        Upload a bank statement to unlock your financial insights.
      </p>
    </Card>
  );
}

// ── Score ring (pure CSS, no SVG) ─────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const { fg, bg, border } = scoreColor(score);
  const grade = scoreGrade(score);
  const label = scoreLabel(score);
  return (
    <div style={{
      width: 92, height: 92, borderRadius: "50%",
      background: bg,
      border: `3px solid ${border}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 28, fontWeight: 900, color: fg, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 10, fontWeight: 800, color: fg, letterSpacing: "0.1em", marginTop: 2 }}>
        GRADE {grade}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIInsightsPanel() {
  const { data: analysis, isLoading, isError } = useGetAIAnalysisQuery();
  const [refresh, { isLoading: refreshing }] = useRefreshAIAnalysisMutation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) return <LoadingPanel />;

  // ── No data ──────────────────────────────────────────────────────────────
  if (isError || !analysis) return <EmptyPanel />;

  const a = analysis as AIAnalysisResponse;
  const pulse = a.spendingPulse;
  const score = pulse?.stabilityScore ?? 65;
  const persona = a.moneyPersonality;
  const accent = archetypeAccent(persona?.archetype);
  const signals: Signal[] = a.behavioralSignals ?? [];
  const patterns: Pattern[] = a.hiddenPatterns ?? [];
  const projections: Projection[] = a.projections ?? [];
  const risks: string[] = a.risks ?? [];
  const positives: string[] = a.positiveHabits ?? [];
  const recs: string[] = a.recommendations ?? [];
  const actions: string[] = a.nextActions ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Header bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", color: "#a855f7", textTransform: "uppercase", marginBottom: 3 }}>
            AI · Financial Intelligence
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111827", margin: 0, lineHeight: 1.2 }}>
            Your money, decoded.
          </h2>
        </div>
        <button
          onClick={() => refresh()}
          disabled={refreshing}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 99,
            border: "1px solid #e5e7eb",
            background: refreshing ? "#f9fafb" : "#fff",
            color: "#374151", fontSize: 12, fontWeight: 700,
            cursor: refreshing ? "not-allowed" : "pointer",
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <span style={{ fontSize: 13, display: "inline-block", animation: refreshing ? "spin 1s linear infinite" : "none" }}>
            ↻
          </span>
          {refreshing ? "Analysing…" : "Refresh"}
        </button>
      </div>

      {/* ── Hero: Score + Summary ── */}
      <Card style={{ background: "#fafafa", border: "1px solid #e9e9e9" }}>
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          <ScoreRing score={score} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 12, fontWeight: 800,
                color: pulse?.status === "STABLE" ? "#166534" : pulse?.status === "UNSTABLE" ? "#991b1b" : "#854d0e",
                background: pulse?.status === "STABLE" ? "#dcfce7" : pulse?.status === "UNSTABLE" ? "#fee2e2" : "#fef9c3",
                border: `1px solid ${pulse?.status === "STABLE" ? "#86efac" : pulse?.status === "UNSTABLE" ? "#fca5a5" : "#fde047"}`,
                padding: "2px 10px", borderRadius: 99,
              }}>
                {pulse?.status ?? "FAIR"}
              </span>
              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
                {pulse?.summary ?? "Spending pulse"}
              </span>
            </div>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              {a.summary}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Money Personality ── */}
      {persona && (
        <Card style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
          <SectionTitle>Money personality</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "#fff",
              border: `1.5px solid ${accent.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>
              🧠
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: accent.fg, margin: 0, marginBottom: 3 }}>
                {persona.archetype}
              </p>
              <p style={{ fontSize: 13, color: accent.fg, opacity: 0.8, margin: 0, fontWeight: 500 }}>
                {persona.trait}
              </p>
            </div>
          </div>
          {persona.description && (
            <p style={{
              marginTop: 12, fontSize: 13, color: accent.fg,
              lineHeight: 1.65, opacity: 0.85,
              padding: "10px 14px",
              background: "#fff",
              borderRadius: 12,
              border: `1px solid ${accent.border}`,
              fontStyle: "italic",
            }}>
              "{persona.description}"
            </p>
          )}
        </Card>
      )}

      {/* ── Behavioral signals ── */}
      {signals.length > 0 && (
        <Card>
          <SectionTitle>Behavioral signals</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {signals.map((s, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>{s.label}</p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "3px 0 0", lineHeight: 1.5 }}>{s.observation}</p>
                  </div>
                  <Tag
                    text={s.emotion}
                    color={{ bg: "#f3f4f6", fg: "#374151", border: "#e5e7eb" }}
                  />
                </div>
                <IntensityBar value={s.intensity} />
                {i < signals.length - 1 && (
                  <div style={{ marginTop: 14, height: 1, background: "#f9fafb" }} />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Hidden patterns ── */}
      {patterns.length > 0 && (
        <Card>
          <SectionTitle>Hidden patterns</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {patterns.map((p, i) => (
              <div key={i} style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "#f9fafb",
                border: "1px solid #f3f4f6",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#a855f7" }}>
                    {p.category?.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{p.title}</p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.55 }}>{p.insight}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Risks + Positives ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {risks.length > 0 && (
          <Card style={{ background: "#fff7f7", border: "1px solid #fecaca" }}>
            <SectionTitle>Risks</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {risks.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 14, color: "#ef4444", flexShrink: 0, marginTop: 1 }}>↓</span>
                  <p style={{ fontSize: 12, color: "#991b1b", margin: 0, lineHeight: 1.55, fontWeight: 500 }}>{r}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
        {positives.length > 0 && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <SectionTitle>Strengths</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {positives.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 14, color: "#22c55e", flexShrink: 0, marginTop: 1 }}>↑</span>
                  <p style={{ fontSize: 12, color: "#166534", margin: 0, lineHeight: 1.55, fontWeight: 500 }}>{p}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ── Projections ── */}
      {projections.length > 0 && (
        <Card>
          <SectionTitle>What happens next</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projections.map((proj, i) => {
              const typeColor =
                proj.type === "POSITIVE"   ? { bg: "#f0fdf4", border: "#bbf7d0", fg: "#166534" } :
                proj.type === "NEGATIVE"   ? { bg: "#fff7f7", border: "#fecaca", fg: "#991b1b" } :
                                              { bg: "#fafafa", border: "#e5e7eb", fg: "#374151" };
              return (
                <div key={i} style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: typeColor.bg,
                  border: `1px solid ${typeColor.border}`,
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: typeColor.fg,
                    background: "#fff", border: `1px solid ${typeColor.border}`,
                    padding: "2px 8px", borderRadius: 99, flexShrink: 0, marginTop: 2,
                    letterSpacing: "0.06em",
                  }}>
                    {proj.timeframe}
                  </span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: typeColor.fg, margin: "0 0 3px" }}>{proj.headline}</p>
                    <p style={{ fontSize: 12, color: typeColor.fg, opacity: 0.8, margin: 0, lineHeight: 1.5 }}>{proj.impact}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Recommendations ── */}
      {recs.length > 0 && (
        <Card>
          <SectionTitle>Recommendations</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recs.map((r, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                padding: "10px 12px", borderRadius: 10,
                background: "#f8f7ff", border: "1px solid #e9d5ff",
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", background: "#a855f7",
                  color: "#fff", fontSize: 11, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 1,
                }}>
                  {i + 1}
                </span>
                <p style={{ fontSize: 13, color: "#4c1d95", margin: 0, lineHeight: 1.55, fontWeight: 500 }}>{r}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Next actions ── */}
      {actions.length > 0 && (
        <Card style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <SectionTitle>Do this week</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actions.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{
                  fontSize: 14, color: "#d97706", flexShrink: 0, fontWeight: 800, marginTop: 0,
                }}>→</span>
                <p style={{ fontSize: 13, color: "#92400e", margin: 0, lineHeight: 1.55, fontWeight: 600 }}>{a}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
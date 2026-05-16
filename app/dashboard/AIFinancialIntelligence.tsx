"use client";

import {
  Brain, Sparkles, TrendingUp, AlertTriangle, CheckCircle2,
  Lightbulb, ArrowRight, Zap, Eye, Target, Clock,
  TrendingDown, Shield, ChevronDown, ChevronUp,
  ListChecks,
} from "lucide-react";
import { useState } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

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
interface MoneyPersonality {
  archetype: string; description: string;
  trait: "impulsive" | "cautious" | "inconsistent" | "disciplined";
}
interface SpendingPulse {
  status: "volatile" | "stable" | "declining" | "improving";
  summary: string; stabilityScore: number;
}
interface AnalysisData {
  summary: string;
  moneyPersonality: MoneyPersonality;
  spendingPulse: SpendingPulse;
  risks: string[];
  positiveHabits: string[];
  recommendations: string[];
  nextActions: string[];
  projections: ProjectionCard[];
  behavioralSignals: BehavioralSignal[];
  hiddenPatterns: HiddenPattern[];
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TRAIT_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  impulsive:    { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Impulsive" },
  anxious:      { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Anxious" },
  inconsistent: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", label: "Inconsistent" },
  disciplined:  { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", label: "Disciplined" },
  cautious:     { color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", label: "Cautious" },
};

const STATUS_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  volatile:  { color: "#dc2626", dot: "#dc2626",  label: "Volatile" },
  stable:    { color: "#059669", dot: "#10b981",  label: "Stable" },
  declining: { color: "#dc2626", dot: "#f87171",  label: "Declining" },
  improving: { color: "#0284c7", dot: "#38bdf8",  label: "Improving" },
};

const PROJECTION_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  leak:        { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: TrendingDown, label: "Leak" },
  opportunity: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: TrendingUp,   label: "Opportunity" },
  compounding: { color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", icon: Zap,          label: "Compounding" },
  risk:        { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: Shield,       label: "Risk" },
};

const EMOTION_COLOR: Record<string, string> = {
  impulsive: "#dc2626", anxious: "#d97706", disciplined: "#059669",
  avoidant: "#7c3aed", reactive: "#db2777",
};

const PATTERN_ICON: Record<string, any> = {
  timing: Clock, merchant: Eye, category: Target, behavioral: Brain,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
      <div style={{ color }}>{icon}</div>
      <span style={{ fontSize: "10px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</span>
    </div>
  );
}

function CollapsibleSection({
  icon, label, color, children, defaultOpen = true,
}: {
  icon: React.ReactNode; label: string; color: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "14px" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "0 0 10px 0", fontFamily: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ color }}>{icon}</div>
          <span style={{ fontSize: "10px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</span>
        </div>
        {open
          ? <ChevronUp size={13} color="#9ca3af" />
          : <ChevronDown size={13} color="#9ca3af" />}
      </button>
      {open && children}
    </div>
  );
}

// ─── LOADING ──────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <aside style={{ width: "340px", height: "100vh", position: "sticky", top: 0, overflowY: "auto", borderLeft: "1px solid #f0f0f0", background: "#fff", padding: "20px" }}>
      {[80, 160, 110, 160, 120].map((h, i) => (
        <div key={i} style={{ height: `${h}px`, borderRadius: "12px", background: "#f3f4f6", marginBottom: "12px", animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </aside>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AIInsightSidebar({
  analysis,
  loading = false,
}: {
  analysis: AnalysisData | null;
  loading?: boolean;
}) {
  if (loading) return <LoadingSkeleton />;
  if (!analysis) return null;

  const trait   = analysis.moneyPersonality?.trait ?? "cautious";
  const traitCfg = TRAIT_CONFIG[trait] ?? TRAIT_CONFIG.cautious;
  const pulse    = analysis.spendingPulse?.status ?? "stable";
  const pulseCfg = STATUS_CONFIG[pulse] ?? STATUS_CONFIG.stable;
  const stability = analysis.spendingPulse?.stabilityScore ?? 0;

  return (
    <aside style={{
      width: "340px", height: "100%", position: "sticky", top: 0,
      overflowY: "auto", borderLeft: "1px solid #f0f0f0",
      background: "#fff", padding: "20px", display: "flex",
      flexDirection: "column", gap: "0",
    }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: "18px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "#eef2ff", color: "#6366f1", fontSize: "10px",
          fontWeight: 600, padding: "4px 10px", borderRadius: "100px",
          marginBottom: "12px",
        }}>
          <Sparkles size={11} /> AI Financial Intelligence
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#111", letterSpacing: "-0.04em", lineHeight: 1.15 }}>
          Your money<br />behavior
        </h2>
        <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.7, marginTop: "8px" }}>
          Deep behavioral analysis from your transaction history — patterns, signals, and what they mean for your finances.
        </p>
      </div>

      {/* ── PERSONALITY CARD ── */}
      <div style={{
        background: "#18181b", borderRadius: "16px", padding: "20px",
        color: "#fff", marginBottom: "14px", position: "relative", overflow: "hidden",
      }}>
        {/* decorative circle */}
        <div style={{ position: "absolute", top: -20, right: -20, width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
          <Brain size={18} color="#fff" />
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
          <div>
            <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", marginBottom: "4px" }}>Money Personality</p>
            <h3 style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              {analysis.moneyPersonality?.archetype}
            </h3>
          </div>
          <div style={{
            background: traitCfg.bg, border: `1px solid ${traitCfg.border}`,
            color: traitCfg.color, borderRadius: "100px",
            fontSize: "10px", fontWeight: 700, padding: "4px 10px", flexShrink: 0,
          }}>
            {traitCfg.label}
          </div>
        </div>

        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: "16px" }}>
          {analysis.moneyPersonality?.description}
        </p>

        {/* Stability meter */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Spending stability</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: pulseCfg.dot }} />
              <span style={{ fontSize: "10px", color: pulseCfg.color, fontWeight: 600 }}>{pulseCfg.label}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{stability}%</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "3px" }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{
                height: "4px", flex: 1, borderRadius: "2px",
                background: i < Math.floor(stability / 10) ? "#fff" : "rgba(255,255,255,0.1)",
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── SPENDING PULSE SUMMARY ── */}
      <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
        <SectionHeader icon={<TrendingUp size={13} />} label="What we noticed" color="#6366f1" />
        <p style={{ fontSize: "12px", lineHeight: 1.75, color: "#374151" }}>{analysis.summary}</p>
        <p style={{ fontSize: "11px", lineHeight: 1.7, color: "#9ca3af", marginTop: "8px" }}>
          {analysis.spendingPulse?.summary}
        </p>
      </div>

      {/* ── BEHAVIORAL SIGNALS ── */}
      <CollapsibleSection icon={<AlertTriangle size={13} />} label="Behavioral signals" color="#dc2626">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {analysis.behavioralSignals?.slice(0, 4).map((signal: BehavioralSignal, i: number) => {
            const emotColor = EMOTION_COLOR[signal.emotion] ?? "#6b7280";
            return (
              <div key={i} style={{ borderRadius: "12px", background: "#fef2f2", border: "1px solid #fecaca", padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
                  <div>
                    <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#111" }}>{signal.label}</h4>
                    <p style={{ fontSize: "10px", color: emotColor, marginTop: "2px", textTransform: "capitalize" }}>
                      {signal.emotion} · intensity {signal.intensity}/10
                    </p>
                  </div>
                  {/* Intensity bar */}
                  <div style={{ display: "flex", gap: "2px", flexShrink: 0, marginTop: "2px" }}>
                    {Array.from({ length: 10 }, (_, j) => (
                      <div key={j} style={{
                        width: "5px", height: "16px", borderRadius: "2px",
                        background: j < signal.intensity ? emotColor : `${emotColor}22`,
                      }} />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: "11px", lineHeight: 1.65, color: "#374151" }}>{signal.observation}</p>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* ── HIDDEN PATTERNS ── */}
      <CollapsibleSection icon={<Eye size={13} />} label="Hidden patterns" color="#7c3aed">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {analysis.hiddenPatterns?.slice(0, 3).map((pattern: HiddenPattern, i: number) => {
            const PatternIcon = PATTERN_ICON[pattern.category] ?? Brain;
            return (
              <div key={i} style={{ borderRadius: "12px", background: "#f5f3ff", border: "1px solid #ddd6fe", padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <PatternIcon size={12} color="#7c3aed" />
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#111" }}>{pattern.title}</h4>
                  <span style={{ fontSize: "9px", textTransform: "capitalize", color: "#7c3aed", marginLeft: "auto", background: "#ede9fe", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                    {pattern.category}
                  </span>
                </div>
                <p style={{ fontSize: "11px", lineHeight: 1.65, color: "#374151" }}>{pattern.insight}</p>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* ── PROJECTIONS ── */}
      {analysis.projections?.length > 0 && (
        <CollapsibleSection icon={<Zap size={13} />} label="Financial projections" color="#d97706" defaultOpen={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {analysis.projections.slice(0, 3).map((proj: ProjectionCard, i: number) => {
              const cfg = PROJECTION_CONFIG[proj.type] ?? PROJECTION_CONFIG.risk;
              const ProjIcon = cfg.icon;
              return (
                <div key={i} style={{ borderRadius: "12px", background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <ProjIcon size={12} color={cfg.color} />
                      <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <span style={{ fontSize: "9px", color: cfg.color, background: `${cfg.color}18`, padding: "2px 6px", borderRadius: "4px" }}>{proj.timeframe}</span>
                  </div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#111", marginBottom: "4px" }}>{proj.headline}</p>
                  <p style={{ fontSize: "11px", color: "#374151", lineHeight: 1.6 }}>{proj.impact}</p>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* ── RISKS ── */}
      {analysis.risks?.length > 0 && (
        <CollapsibleSection icon={<AlertTriangle size={13} />} label="Risk flags" color="#f97316" defaultOpen={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {analysis.risks.map((risk: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "10px 12px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f97316", marginTop: "5px", flexShrink: 0 }} />
                <p style={{ fontSize: "11px", lineHeight: 1.65, color: "#374151" }}>{risk}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ── POSITIVE HABITS ── */}
      <CollapsibleSection icon={<CheckCircle2 size={13} />} label="Positive habits" color="#059669" defaultOpen={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {analysis.positiveHabits?.map((habit: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "10px 12px" }}>
              <CheckCircle2 size={12} color="#059669" style={{ marginTop: "2px", flexShrink: 0 }} />
              <p style={{ fontSize: "11px", lineHeight: 1.65, color: "#374151" }}>{habit}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ── RECOMMENDATIONS ── */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ background: "#18181b", borderRadius: "14px", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
            <Lightbulb size={13} color="#fbbf24" />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.12em" }}>Smart recommendations</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {analysis.recommendations?.slice(0, 4).map((item: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "11px 12px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fbbf24", color: "#000", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: "11px", lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NEXT ACTIONS ── */}
      {analysis.nextActions?.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <SectionHeader icon={<ListChecks size={13} />} label="Action items" color="#6366f1" />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {analysis.nextActions.map((action: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", padding: "10px 12px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "5px", background: "#6366f1", color: "#fff", fontSize: "9px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: "11px", lineHeight: 1.65, color: "#374151" }}>{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <button
        style={{
          width: "100%", height: "44px", borderRadius: "12px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff", fontSize: "12px", fontWeight: 700,
          border: "none", cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
        }}
      >
        View Full Analysis <ArrowRight size={14} />
      </button>
    </aside>
  );
}
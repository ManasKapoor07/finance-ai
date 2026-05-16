"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useAnalyzeFinancialProfileMutation,
  useGetDashboardQuery,
} from "../../../redux/api/authApi";
import { useEffect, useState, useRef } from "react";
import {
  Brain, Sparkles, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Lightbulb, Eye, Zap, Shield, Activity,
  ArrowLeft, Target, Clock, BarChart2,
  MessageSquare, Send, X, Bot, Loader2, ChevronDown,
} from "lucide-react";
import { AIChatPanel } from "../../AIChatPanel";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ProjectionCard {
  headline: string;
  impact: string;
  timeframe: string;
  type: "leak" | "opportunity" | "compounding" | "risk";
}
interface BehavioralSignal {
  label: string;
  observation: string;
  emotion: "impulsive" | "anxious" | "disciplined" | "avoidant" | "reactive";
  intensity: number;
}
interface HiddenPattern {
  title: string;
  insight: string;
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
interface DashboardData {
  totalBalance: number;
  totalSpending: number;
  totalIncome: number;
  balanceChangePercent: number;
  spendingChangePercent: number;
  incomeChangePercent: number;
  monthlyOverview: any[];
  spendingByCategory: Record<string, number>;
  recentTransactions: any[];
}
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmtCompact(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + Math.round(n);
}
function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── THEME CONFIGS ────────────────────────────────────────────────────────────

const TRAIT_CFG: Record<string, {
  textColor: string; bg: string; border: string; label: string; desc: string;
}> = {
  impulsive:    { textColor: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     label: "Impulsive",    desc: "Acts fast, thinks later" },
  anxious:      { textColor: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   label: "Anxious",      desc: "Worry-driven decisions" },
  inconsistent: { textColor: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200",  label: "Inconsistent", desc: "Patterns lack routine" },
  disciplined:  { textColor: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Disciplined",  desc: "Structured & planned" },
  cautious:     { textColor: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200",     label: "Cautious",     desc: "Risk-averse approach" },
};

const PROJ_CFG: Record<string, {
  textColor: string; bg: string; border: string; icon: any; label: string; barColor: string;
}> = {
  leak:        { textColor: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     icon: TrendingDown, label: "Money Leak",  barColor: "bg-red-500" },
  opportunity: { textColor: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: TrendingUp,   label: "Opportunity", barColor: "bg-emerald-500" },
  compounding: { textColor: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200",     icon: Zap,          label: "Compounding", barColor: "bg-sky-500" },
  risk:        { textColor: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Shield,       label: "Risk Alert",  barColor: "bg-amber-500" },
};

const EMOTION_CFG: Record<string, {
  textColor: string; bg: string; border: string; label: string; dotColor: string;
}> = {
  impulsive:   { textColor: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     label: "Impulsive",   dotColor: "bg-red-500" },
  anxious:     { textColor: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   label: "Anxious",     dotColor: "bg-amber-500" },
  disciplined: { textColor: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Disciplined", dotColor: "bg-emerald-500" },
  avoidant:    { textColor: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200",  label: "Avoidant",    dotColor: "bg-violet-500" },
  reactive:    { textColor: "text-pink-700",    bg: "bg-pink-50",    border: "border-pink-200",    label: "Reactive",    dotColor: "bg-pink-500" },
};

const PATTERN_CFG: Record<string, {
  textColor: string; bg: string; border: string; badgeBg: string; icon: any;
}> = {
  timing:     { textColor: "text-sky-700",    bg: "bg-sky-50",    border: "border-sky-200",    badgeBg: "bg-sky-100",    icon: Clock },
  merchant:   { textColor: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", badgeBg: "bg-violet-100", icon: Eye },
  category:   { textColor: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200",  badgeBg: "bg-amber-100",  icon: BarChart2 },
  behavioral: { textColor: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",    badgeBg: "bg-red-100",    icon: Brain },
};

// ─── SECTION TITLE ────────────────────────────────────────────────────────────

function SectionTitle({
  icon, label, sub, iconBg = "bg-stone-100", iconColor = "text-stone-500",
}: {
  icon: React.ReactNode; label: string; sub?: string;
  iconBg?: string; iconColor?: string;
}) {
  return (
    <div className="section-divider">
      <div className="flex items-center gap-2 shrink-0">
        <div className={`w-7 h-7 rounded-lg ${iconBg} border border-stone-200 flex items-center justify-center`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-stone-900 tracking-tight">{label}</p>
          {sub && <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── HERO SECTION ─────────────────────────────────────────────────────────────

function HeroSection({ analysis, dashboard }: { analysis: AnalysisData; dashboard: DashboardData }) {
  const tc = TRAIT_CFG[analysis.moneyPersonality?.trait] ?? TRAIT_CFG.cautious;
  const stability = analysis.spendingPulse?.stabilityScore ?? 0;
  const savings = dashboard.totalIncome - dashboard.totalSpending;
  const savingsRate = dashboard.totalIncome > 0
    ? ((savings / dashboard.totalIncome) * 100).toFixed(1)
    : "0";

  const status = analysis.spendingPulse?.status;
  const pulseText = status === "stable" ? "text-emerald-600" : status === "improving" ? "text-sky-600" : "text-red-500";
  const pulseBar  = status === "stable" ? "bg-emerald-500" : status === "improving" ? "bg-sky-500" : "bg-red-400";

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-9 relative overflow-hidden fade-up shadow-sm">
      <div className="absolute inset-y-0 right-0 w-80 hero-texture pointer-events-none" />

      <div className="grid grid-cols-[1fr_300px] gap-9 items-center relative">
        {/* left */}
        <div>
          <div className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 rounded-full px-3 py-1 mb-5">
            <Sparkles size={10} className="text-stone-400" />
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
              AI Financial Intelligence
            </span>
          </div>

          <h1 className="font-fraunces text-[42px] font-bold leading-[1.1] tracking-tight text-stone-900 mb-3">
            Your Money<br />
            <span className="italic text-stone-500">Personality</span>
          </h1>

          <p className="text-sm leading-relaxed text-stone-500 max-w-md mb-6">{analysis.summary}</p>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`${tc.bg} ${tc.border} border rounded-xl px-3.5 py-2`}>
              <p className={`text-[10px] ${tc.textColor} font-semibold uppercase tracking-widest mb-0.5`}>
                {tc.label} Spender
              </p>
              <p className="text-xs text-stone-600">{tc.desc}</p>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2">
              <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-0.5">Stability Score</p>
              <p className={`text-xl font-bold font-mono ${pulseText}`}>{stability}%</p>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2">
              <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-0.5">Savings Rate</p>
              <p className={`text-xl font-bold font-mono ${Number(savingsRate) > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {savingsRate}%
              </p>
            </div>
          </div>
        </div>

        {/* right — archetype card */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center mb-4">
            <Brain size={18} className="text-stone-500" />
          </div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Your Archetype</p>
          <h2 className="font-fraunces text-2xl font-bold text-stone-900 tracking-tight mb-2">
            {analysis.moneyPersonality?.archetype}
          </h2>
          <p className="text-xs leading-relaxed text-stone-500 mb-5">{analysis.moneyPersonality?.description}</p>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest">Spending Stability</span>
              <span className={`text-[10px] font-semibold uppercase ${pulseText}`}>{status}</span>
            </div>
            <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div className={`h-full ${pulseBar} rounded-full transition-all duration-1000`} style={{ width: `${stability}%` }} />
            </div>
            <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">{analysis.spendingPulse?.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              { l: "Income",   v: fmtCompact(dashboard.totalIncome),   color: "text-emerald-600" },
              { l: "Spending", v: fmtCompact(dashboard.totalSpending), color: "text-red-500" },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl p-2.5">
                <p className="text-[9px] text-stone-400 font-semibold uppercase tracking-widest mb-1">{s.l}</p>
                <p className={`text-base font-bold font-mono ${s.color}`}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BEHAVIORAL SIGNALS ───────────────────────────────────────────────────────

function BehavioralSignals({ signals }: { signals: BehavioralSignal[] }) {
  return (
    <div>
      <SectionTitle
        icon={<Activity size={13} />} label="Behavioral Signals"
        sub="Emotional patterns driving your spending"
        iconBg="bg-red-50" iconColor="text-red-500"
      />
      <div className="grid grid-cols-3 gap-3">
        {signals.map((s, i) => {
          const ec = EMOTION_CFG[s.emotion] ?? EMOTION_CFG.reactive;
          return (
            <div key={i} className={`bg-white border border-stone-200 rounded-[18px] p-5 relative overflow-hidden shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200 fade-up delay-${Math.min(i + 1, 8)}`}>
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${ec.dotColor} opacity-50`} />

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 tracking-tight">{s.label}</h3>
                  <div className={`inline-flex items-center gap-1 mt-1 ${ec.bg} ${ec.border} border rounded-full px-2 py-0.5`}>
                    <div className={`w-1 h-1 rounded-full ${ec.dotColor} animate-pulse-dot`} />
                    <span className={`text-[10px] font-semibold capitalize ${ec.textColor}`}>{ec.label}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`w-10 h-10 rounded-full border-2 ${ec.border} ${ec.bg} flex items-center justify-center`}>
                    <span className={`text-sm font-bold font-mono ${ec.textColor}`}>{s.intensity}</span>
                  </div>
                  <p className="text-[9px] text-stone-400 mt-0.5">/ 10</p>
                </div>
              </div>

              <div className="flex gap-0.5 mb-3 h-5 items-end">
                {Array.from({ length: 10 }, (_, j) => (
                  <div
                    key={j}
                    className={`flex-1 rounded-sm transition-all duration-300 ${j < s.intensity ? ec.dotColor : "bg-stone-100"}`}
                    style={{ height: `${35 + j * 6}%` }}
                  />
                ))}
              </div>

              <p className="text-xs leading-relaxed text-stone-500">{s.observation}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── HIDDEN PATTERNS ─────────────────────────────────────────────────────────

function HiddenPatterns({ patterns }: { patterns: HiddenPattern[] }) {
  return (
    <div>
      <SectionTitle
        icon={<Eye size={13} />} label="Hidden Patterns"
        sub="What your transaction data reveals beneath the surface"
        iconBg="bg-violet-50" iconColor="text-violet-600"
      />
      <div className="grid grid-cols-3 gap-3">
        {patterns.map((p, i) => {
          const cfg = PATTERN_CFG[p.category] ?? PATTERN_CFG.behavioral;
          const PIcon = cfg.icon;
          return (
            <div key={i} className={`${cfg.bg} ${cfg.border} border rounded-[18px] p-5 shadow-sm hover:shadow-md transition-all duration-200 fade-up delay-${Math.min(i + 1, 8)}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-[9px] bg-white ${cfg.border} border flex items-center justify-center`}>
                  <PIcon size={14} className={cfg.textColor} />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${cfg.textColor} ${cfg.badgeBg} px-2 py-0.5 rounded`}>
                  {p.category}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-stone-900 tracking-tight mb-1.5">{p.title}</h3>
              <p className="text-xs leading-relaxed text-stone-500">{p.insight}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PROJECTIONS ─────────────────────────────────────────────────────────────

function Projections({ projections }: { projections: ProjectionCard[] }) {
  return (
    <div>
      <SectionTitle
        icon={<TrendingUp size={13} />} label="Financial Projections"
        sub="Where your current habits are taking you"
        iconBg="bg-amber-50" iconColor="text-amber-600"
      />
      <div className="grid grid-cols-3 gap-3">
        {projections.map((proj, i) => {
          const cfg = PROJ_CFG[proj.type] ?? PROJ_CFG.risk;
          const PIcon = cfg.icon;
          return (
            <div key={i} className={`${cfg.bg} ${cfg.border} border rounded-[18px] p-5 shadow-sm hover:shadow-md transition-all duration-200 fade-up delay-${Math.min(i + 1, 8)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-lg bg-white ${cfg.border} border flex items-center justify-center`}>
                    <PIcon size={13} className={cfg.textColor} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.textColor}`}>{cfg.label}</span>
                </div>
                <span className={`text-[10px] font-semibold ${cfg.textColor} bg-white px-2 py-0.5 rounded-full ${cfg.border} border`}>
                  {proj.timeframe}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-stone-900 tracking-tight leading-snug mb-2">{proj.headline}</h3>
              <p className="text-xs leading-relaxed text-stone-500">{proj.impact}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── RISKS & HABITS ───────────────────────────────────────────────────────────

function RisksAndHabits({ risks, habits }: { risks: string[]; habits: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <SectionTitle
          icon={<AlertTriangle size={13} />} label="Risk Flags"
          sub={`${risks.length} risks identified`}
          iconBg="bg-orange-50" iconColor="text-orange-500"
        />
        <div className="flex flex-col gap-2">
          {risks.map((r, i) => (
            <div key={i} className={`flex gap-3 bg-white border border-orange-200 border-l-[3px] border-l-orange-400 rounded-xl px-3.5 py-3 fade-up delay-${Math.min(i + 1, 8)}`}>
              <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-stone-600">{r}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle
          icon={<CheckCircle2 size={13} />} label="Good Habits"
          sub={`${habits.length} positive patterns`}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
        />
        <div className="flex flex-col gap-2">
          {habits.map((h, i) => (
            <div key={i} className={`flex gap-3 bg-white border border-emerald-200 border-l-[3px] border-l-emerald-500 rounded-xl px-3.5 py-3 fade-up delay-${Math.min(i + 1, 8)}`}>
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-stone-600">{h}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RECOMMENDATIONS ─────────────────────────────────────────────────────────

function Recommendations({ recommendations }: { recommendations: string[] }) {
  return (
    <div>
      <SectionTitle
        icon={<Lightbulb size={13} />} label="Smart Recommendations"
        sub="Personalized guidance based on your patterns"
        iconBg="bg-indigo-50" iconColor="text-indigo-600"
      />
      <div className="grid grid-cols-2 gap-2.5">
        {recommendations.map((item, i) => (
          <div key={i} className={`flex gap-3.5 bg-white border border-stone-200 rounded-2xl px-4 py-3.5 hover:border-stone-300 hover:shadow-md hover:-translate-y-px transition-all duration-200 fade-up delay-${Math.min(i + 1, 8)}`}>
            <div className="w-8 h-8 rounded-[9px] bg-stone-100 border border-stone-200 text-stone-500 text-xs font-bold flex items-center justify-center shrink-0 font-mono">
              {String(i + 1).padStart(2, "0")}
            </div>
            <p className="text-xs leading-relaxed text-stone-600 pt-1">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NEXT ACTIONS ─────────────────────────────────────────────────────────────

function NextActions({ actions }: { actions: string[] }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setDone(prev => {
    const s = new Set(prev);
    s.has(i) ? s.delete(i) : s.add(i);
    return s;
  });

  return (
    <div>
      <SectionTitle
        icon={<Target size={13} />} label="Action Plan"
        sub={`${done.size}/${actions.length} completed`}
        iconBg="bg-sky-50" iconColor="text-sky-600"
      />
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((a, i) => {
            const isDone = done.has(i);
            return (
              <div
                key={i}
                onClick={() => toggle(i)}
                className={`flex gap-3 rounded-xl px-3.5 py-3 cursor-pointer border transition-all duration-200 fade-up delay-${Math.min(i + 1, 8)}
                  ${isDone ? "bg-emerald-50 border-emerald-200" : "bg-stone-50 border-stone-200 hover:bg-stone-100 hover:border-stone-300"}`}
              >
                <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center border transition-all duration-200
                  ${isDone ? "bg-emerald-500 border-transparent" : "bg-white border-stone-200"}`}
                >
                  {isDone
                    ? <CheckCircle2 size={13} className="text-white" />
                    : <span className="text-[10px] font-bold text-stone-300 font-mono">{String(i + 1).padStart(2, "0")}</span>
                  }
                </div>
                <p className={`text-xs leading-relaxed transition-all duration-200 ${isDone ? "text-emerald-600 line-through" : "text-stone-600"}`}>
                  {a}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="flex justify-between mb-1.5">
            <span className="text-[11px] text-stone-400 font-medium">Action Progress</span>
            <span className="text-[11px] text-emerald-600 font-semibold">{done.size}/{actions.length} done</span>
          </div>
          <div className="h-1 bg-stone-100 rounded-full">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(done.size / actions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  "Why am I overspending?",
  "How can I save more?",
  "Explain my risk flags",
  "Top 3 actions to take",
];



// ─── LOADING ──────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#f5f4f0] p-6">
      <div className="mx-auto flex flex-col gap-4">
        <div className="skeleton h-72" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40" />)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32" />)}
        </div>
        <div className="skeleton h-52" />
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function FullAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const statementId = params.statementId as string;

  const { data: dashRes, isLoading: dashLoading } = useGetDashboardQuery(statementId);
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

  if (aiLoading || dashLoading || !analysis || !dashboard) return <LoadingState />;

  return (
    <div className="min-h-screen">

      {/* sticky nav */}
      <div className="sticky top-0 z-[100] bg-[rgba(245,244,240,0.9)] backdrop-blur-xl border-b border-stone-200 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-stone-500 bg-white border border-stone-200 rounded-xl px-3.5 py-1.5 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 transition-all cursor-pointer"
          >
            <ArrowLeft size={12} /> Back
          </button>
          <div className=" h-[18px] bg-stone-200" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-stone-900 flex items-center justify-center">
              <Sparkles size={10} className="text-stone-100" />
            </div>
            <span className="text-[13px] font-semibold text-stone-900 tracking-tight">Full Analysis</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
          <span className="text-[11px] text-stone-400 font-medium">AI-powered · Real-time</span>
        </div>
      </div>

      {/* content */}
      <div className="mx-auto px-6 py-7 pb-20 flex flex-col gap-10">
        <HeroSection analysis={analysis} dashboard={dashboard} />
        <BehavioralSignals signals={analysis.behavioralSignals ?? []} />
        <HiddenPatterns patterns={analysis.hiddenPatterns ?? []} />
        <Projections projections={analysis.projections ?? []} />
        <RisksAndHabits risks={analysis.risks ?? []} habits={analysis.positiveHabits ?? []} />
        <Recommendations recommendations={analysis.recommendations ?? []} />
        <NextActions actions={analysis.nextActions ?? []} />

        <div className="text-center pb-6">
          <div className="inline-flex items-center gap-1.5 bg-white border border-stone-200 rounded-full px-3.5 py-2">
            <Sparkles size={10} className="text-stone-400" />
            <span className="text-[11px] text-stone-400 font-medium">
              Analysis generated by AI · Based on your transaction history
            </span>
          </div>
        </div>
      </div>

      <AIChatPanel statementId={statementId} />
    </div>
  );
}
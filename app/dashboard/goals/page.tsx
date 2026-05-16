"use client";

import { useState, useRef } from "react";
import {
  Target, Plus, TrendingUp, CheckCircle2, XCircle, Sparkles,
  Pencil, Trash2, X, Check, Calendar, IndianRupee, Wallet,
  Loader2, AlertCircle, RefreshCw, ChevronDown, ListChecks,
  BarChart3, ChevronRight, Zap, Award, SkipForward,
} from "lucide-react";

import {
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useUpdateSavedMutation,
  useCancelGoalMutation,
  useGetPlansQuery,
  useCheckInMutation,
  useAbandonPlanMutation,
  type GoalDto,
  type GoalPlanDto,
  type WeekTaskDto,
  type GoalStatus,
} from "../../redux/api/goalsApi";

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAN_CHUNK_SIZE = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";

const progressColor = (pct: number) =>
  pct >= 80 ? "#6366f1" : pct >= 50 ? "#f59e0b" : pct >= 25 ? "#f97316" : "#ef4444";

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 56, stroke = 4, color }: {
  pct: number; size?: number; stroke?: number; color: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────
function StatsBanner({ goals, plans }: { goals: GoalDto[]; plans: GoalPlanDto[] }) {
  const active      = goals.filter(g => g.status === "ACTIVE").length;
  const totalSaved  = goals.reduce((a, g) => a + g.currentSaved, 0);
  const totalTarget = goals.filter(g => g.targetAmount).reduce((a, g) => a + (g.targetAmount ?? 0), 0);
  const completed   = goals.filter(g => g.status === "COMPLETED").length;
  const activePlans = plans.filter(p => p.status === "ACTIVE").length;

  const stats = [
    { label: "Active Goals",  value: String(active),         sub: "in progress",      Icon: Target,     accent: "#6366f1", lightBg: "#eef2ff" },
    { label: "Total Saved",   value: `₹${fmt(totalSaved)}`,  sub: "across all goals", Icon: Wallet,     accent: "#10b981", lightBg: "#ecfdf5" },
    { label: "Total Target",  value: `₹${fmt(totalTarget)}`, sub: "combined",         Icon: TrendingUp, accent: "#f59e0b", lightBg: "#fffbeb" },
    { label: "Completed",     value: String(completed),       sub: "milestones",       Icon: Award,      accent: "#8b5cf6", lightBg: "#f5f3ff" },
    { label: "Active Plans",  value: String(activePlans),     sub: "running now",      Icon: ListChecks, accent: "#0ea5e9", lightBg: "#f0f9ff" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-2xl border border-slate-100 px-4 py-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: s.lightBg }}
          >
            <s.Icon size={16} style={{ color: s.accent }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-medium leading-none mb-1 truncate">{s.label}</p>
            <p className="text-[15px] font-extrabold text-slate-800 leading-none">{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Plan Task Row ────────────────────────────────────────────────────────────
const CHECKIN_META = {
  PENDING: { bgClass: "bg-amber-50 text-amber-700 border-amber-100",   label: "Pending"  },
  DONE:    { bgClass: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Done" },
  SKIPPED: { bgClass: "bg-slate-100 text-slate-500 border-slate-200",  label: "Skipped"  },
};

function PlanTaskRow({ task, planId, isCurrent, periodLabel, frequency, onCheckIn, checkingIn }: {
  task: WeekTaskDto; planId: string; isCurrent: boolean;
  periodLabel: string; frequency: string;
  onCheckIn: (taskId: string, amount: number | null, note: string, status: "DONE" | "SKIPPED") => void;
  checkingIn: boolean;
}) {
  const [open, setOpen]         = useState(isCurrent);
  const [amount, setAmount]     = useState("");
  const [note, setNote]         = useState("");
  const [showForm, setShowForm] = useState(false);
  const c = CHECKIN_META[task.checkinStatus];
  const reset = () => { setShowForm(false); setAmount(""); setNote(""); };

  const actions: string[] = Array.isArray(task.actions)
    ? task.actions
    : (task.actions as unknown as string ?? "").split("\n").filter(Boolean);

  return (
    <div className={`rounded-xl overflow-hidden border transition-all duration-200 ${isCurrent ? "border-indigo-200 bg-indigo-50/30" : "border-slate-100 bg-white"}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {task.checkinStatus === "DONE"    && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
          {task.checkinStatus === "SKIPPED" && <SkipForward  size={12} className="text-slate-400 shrink-0" />}
          {task.checkinStatus === "PENDING" && (
            <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${isCurrent ? "border-indigo-400" : "border-slate-300"}`} />
          )}
          {isCurrent && (
            <span className="text-[9px] font-bold tracking-wide bg-indigo-500 text-white px-1.5 py-0.5 rounded-full leading-none">NOW</span>
          )}
          <span className="text-[12px] font-semibold text-slate-700">{periodLabel} {task.weekNumber}</span>
          <span className="text-[11px] text-slate-400 hidden sm:block">{fmtDate(task.weekStart)} – {fmtDate(task.weekEnd)}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.savingTarget != null && (
            <span className="text-[12px] font-bold text-emerald-600">₹{fmt(task.savingTarget)}</span>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.bgClass}`}>{c.label}</span>
          <ChevronRight size={12} className={`text-slate-300 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-slate-100 pt-3">
          <div className="flex flex-col gap-2">
            {actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <p className="text-[12px] text-slate-600 leading-relaxed">{action}</p>
              </div>
            ))}
          </div>

          {task.tip && (
            <div className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-100">
              <Zap size={12} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 italic leading-relaxed">{task.tip}</p>
            </div>
          )}

          {task.checkinStatus === "PENDING" && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2 rounded-lg border border-dashed border-slate-200 text-[11px] font-semibold text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/40 transition-all flex items-center justify-center gap-1.5"
            >
              <Check size={11} /> Check in for this {frequency === "MONTHLY" ? "month" : "week"}
            </button>
          )}

          {task.checkinStatus === "PENDING" && showForm && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-white focus-within:border-indigo-300 transition-colors">
                <IndianRupee size={11} className="text-slate-400" />
                <input
                  type="number" min={0} placeholder="Amount saved"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="flex-1 text-[12px] text-slate-800 outline-none bg-transparent placeholder:text-slate-300"
                />
              </div>
              <input
                type="text" placeholder="Note (optional)"
                value={note} onChange={e => setNote(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-indigo-300 transition-colors placeholder:text-slate-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onCheckIn(task.id, amount ? parseFloat(amount) : null, note, "DONE"); reset(); }}
                  disabled={checkingIn}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold disabled:opacity-50 transition-colors"
                >
                  {checkingIn ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Done
                </button>
                <button
                  onClick={() => { onCheckIn(task.id, null, note, "SKIPPED"); reset(); }}
                  disabled={checkingIn}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Skip
                </button>
                <button onClick={reset} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                  <X size={12} className="text-slate-400" />
                </button>
              </div>
            </div>
          )}

          {task.checkinStatus !== "PENDING" && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <CheckCircle2 size={11} className="text-emerald-400" />
              {task.savedAmount != null ? `Saved ₹${fmt(task.savedAmount)}` : "Marked as skipped"}
              {task.checkinNote && <span>· {task.checkinNote}</span>}
              {task.checkedInAt && <span>· {fmtDate(task.checkedInAt)}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Plan Panel ───────────────────────────────────────────────────────────────
function PlanPanel({ plan, onAbandon, abandoningPlan, onCheckIn }: {
  plan: GoalPlanDto; onAbandon: (id: string) => void; abandoningPlan: boolean;
  onCheckIn: (args: { planId: string; taskId: string; savedAmount?: number; note?: string; status: "DONE" | "SKIPPED" }) => void;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const freq        = plan.frequency === "MONTHLY" ? "monthly" : "weekly";
  const periodLabel = plan.frequency === "MONTHLY" ? "Month" : "Week";
  const currentIdx  = plan.weeks.findIndex(w => w.isCurrent);
  const visible     = expanded ? plan.weeks : plan.weeks.slice(0, PLAN_CHUNK_SIZE);

  const handleCheckIn = async (taskId: string, amount: number | null, note: string, status: "DONE" | "SKIPPED") => {
    setCheckingIn(true);
    try { await onCheckIn({ planId: plan.id, taskId, savedAmount: amount ?? undefined, note: note || undefined, status }); }
    finally { setCheckingIn(false); }
  };

  return (
    <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
            <ListChecks size={12} className="text-emerald-500" />
          </div>
          <span className="text-[12px] font-bold text-slate-700 capitalize">{freq} plan</span>
          <span className="text-[10px] text-slate-400">· {plan.totalWeeks} {periodLabel.toLowerCase()}s · {plan.progressPct}% done</span>
        </div>
        <button
          onClick={() => onAbandon(plan.id)} disabled={abandoningPlan}
          className="text-[10px] text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {abandoningPlan && <Loader2 size={10} className="animate-spin" />} Abandon
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(plan.progressPct, 100)}%` }} />
        </div>
        {plan.weeklySavingTarget != null && (
          <span className="text-[11px] font-bold text-emerald-600 shrink-0">
            ₹{fmt(plan.weeklySavingTarget)}/{freq === "weekly" ? "wk" : "mo"}
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
        {plan.summary}
      </p>

      <div className="flex flex-col gap-2">
        {visible.map((w, i) => (
          <PlanTaskRow
            key={w.id} task={w} planId={plan.id}
            isCurrent={w.isCurrent || (currentIdx === -1 && i === 0)}
            periodLabel={periodLabel} frequency={plan.frequency}
            onCheckIn={handleCheckIn} checkingIn={checkingIn}
          />
        ))}
      </div>

      {plan.weeks.length > PLAN_CHUNK_SIZE && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 transition-colors py-1"
        >
          <ChevronDown size={13} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Show less" : `Show all ${plan.weeks.length} ${periodLabel.toLowerCase()}s`}
        </button>
      )}
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────
const GOAL_META: Record<GoalStatus, {
  pillBg: string; pillText: string; iconBg: string; iconColor: string;
  label: string; Icon: React.ElementType;
}> = {
  ACTIVE:    { pillBg: "#eef2ff", pillText: "#4f46e5", iconBg: "#eef2ff", iconColor: "#6366f1", label: "Active",    Icon: TrendingUp   },
  COMPLETED: { pillBg: "#ecfdf5", pillText: "#059669", iconBg: "#ecfdf5", iconColor: "#10b981", label: "Completed", Icon: CheckCircle2 },
  CANCELLED: { pillBg: "#f8fafc", pillText: "#94a3b8", iconBg: "#f8fafc", iconColor: "#94a3b8", label: "Cancelled", Icon: XCircle      },
};

function GoalCard({
  goal, plan, onEdit, onCancel, onAddSavings, onAbandonPlan, onCheckIn,
  cancellingGoal, savingProgress, abandoningPlan,
}: {
  goal: GoalDto; plan: GoalPlanDto | null;
  onEdit: (g: GoalDto) => void; onCancel: (id: string) => void;
  onAddSavings: (id: string, n: number) => void;
  onAbandonPlan: (planId: string) => void;
  onCheckIn: (args: { planId: string; taskId: string; savedAmount?: number; note?: string; status: "DONE" | "SKIPPED" }) => void;
  cancellingGoal: boolean; savingProgress: boolean; abandoningPlan: boolean;
}) {
  const meta      = GOAL_META[goal.status];
  const ringColor = goal.status === "COMPLETED" ? "#10b981" : goal.status === "CANCELLED" ? "#cbd5e1" : progressColor(goal.progressPercent);
  const remaining = goal.targetAmount != null ? Math.max(0, goal.targetAmount - goal.currentSaved) : null;

  const [addOpen, setAddOpen]   = useState(false);
  const [addAmt, setAddAmt]     = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const n = parseFloat(addAmt);
    if (!n || n <= 0) return;
    onAddSavings(goal.id, n);
    setAddAmt(""); setAddOpen(false);
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.iconBg }}>
            <meta.Icon size={18} style={{ color: meta.iconColor }} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[14px] text-slate-800 truncate leading-snug">{goal.name}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: meta.pillBg, color: meta.pillText }}>
                {meta.label}
              </span>
              {goal.source === "AI_EXTRACTED" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 flex items-center gap-1">
                  <Sparkles size={8} /> AI
                </span>
              )}
              {plan && goal.status === "ACTIVE" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1">
                  <ListChecks size={8} /> Plan
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <ProgressRing pct={goal.progressPercent} color={ringColor} />
          <span
            className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold"
            style={{ color: ringColor }}
          >
            {Math.round(goal.progressPercent)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(goal.progressPercent, 100)}%`, background: ringColor }}
        />
      </div>

      {/* Amounts */}
      <div className={`grid gap-2.5 ${goal.targetAmount != null ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mb-1.5">
            <Wallet size={9} /> Saved
          </p>
          <p className="text-[17px] font-extrabold text-slate-800 leading-none">₹{fmt(goal.currentSaved)}</p>
        </div>
        {goal.targetAmount != null && (
          <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mb-1.5">
              <Target size={9} />
              {goal.status === "ACTIVE" && remaining != null && remaining > 0 ? "Remaining" : "Target"}
            </p>
            <p className="text-[17px] font-extrabold text-slate-800 leading-none">
              ₹{fmt(goal.status === "ACTIVE" && remaining != null && remaining > 0 ? remaining : goal.targetAmount)}
            </p>
          </div>
        )}
      </div>

      {/* Log savings */}
      {goal.status === "ACTIVE" && (
        <div>
          {addOpen ? (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 border border-indigo-200 bg-indigo-50/40 rounded-xl px-3 py-2.5 focus-within:border-indigo-400 transition-colors">
                <IndianRupee size={11} className="text-slate-400" />
                <input
                  ref={inputRef} type="number" min={1} placeholder="Amount saved"
                  value={addAmt} onChange={e => setAddAmt(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAddOpen(false); setAddAmt(""); } }}
                  className="flex-1 text-[13px] text-slate-800 outline-none bg-transparent placeholder:text-slate-300"
                />
              </div>
              <button
                onClick={handleAdd} disabled={savingProgress || !addAmt}
                className="px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[12px] font-bold disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {savingProgress ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Add
              </button>
              <button
                onClick={() => { setAddOpen(false); setAddAmt(""); }}
                className="px-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <X size={13} className="text-slate-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setAddOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 text-[12px] font-semibold text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/40 transition-all flex items-center justify-center gap-1.5"
            >
              <IndianRupee size={12} /> Log savings
            </button>
          )}
        </div>
      )}

      {/* View plan toggle */}
      {goal.status === "ACTIVE" && plan && (
        <button
          onClick={() => setPlanOpen(v => !v)}
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={13} className="text-emerald-500" />
            <span className="text-[12px] font-bold text-emerald-800">View savings plan</span>
            <span className="text-[10px] text-emerald-400">{plan.progressPct}% done · {plan.totalWeeks} {plan.frequency === "MONTHLY" ? "months" : "weeks"}</span>
          </div>
          <ChevronDown size={13} className={`text-emerald-400 transition-transform duration-200 ${planOpen ? "rotate-180" : ""}`} />
        </button>
      )}

      {planOpen && plan && (
        <PlanPanel plan={plan} onAbandon={onAbandonPlan} abandoningPlan={abandoningPlan} onCheckIn={onCheckIn} />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {goal.monthlyContribution != null && goal.status === "ACTIVE" && (
            <span className="flex items-center gap-1">
              <Zap size={10} className="text-amber-400" />
              ₹{fmt(goal.monthlyContribution)}/mo needed
            </span>
          )}
          {goal.targetDate && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {goal.monthsLeft > 0
                ? `${goal.monthsLeft}mo left`
                : goal.status === "COMPLETED" ? "Achieved 🎉" : "Overdue"}
            </span>
          )}
        </div>

        {goal.status === "ACTIVE" && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(goal)}
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
              title="Edit"
            >
              <Pencil size={12} className="text-slate-400" />
            </button>
            <button
              onClick={() => onCancel(goal.id)} disabled={cancellingGoal}
              className="p-1.5 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
              title="Cancel"
            >
              {cancellingGoal
                ? <Loader2 size={12} className="animate-spin text-red-400" />
                : <Trash2 size={12} className="text-red-400" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Goal Modal ───────────────────────────────────────────────────────────────
interface ModalForm { name: string; targetAmount: string; currentSaved: string; targetDate: string; }

function GoalModal({ goal, onClose, onSave, saving }: {
  goal: Partial<GoalDto> | null; onClose: () => void;
  onSave: (f: ModalForm) => void; saving: boolean;
}) {
  const isEdit = !!goal?.id;
  const [form, setForm] = useState<ModalForm>({
    name:         goal?.name         ?? "",
    targetAmount: goal?.targetAmount?.toString() ?? "",
    currentSaved: goal?.currentSaved?.toString() ?? "0",
    targetDate:   goal?.targetDate   ?? "",
  });
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!form.name.trim()) { setErr("Goal name is required."); return; }
    setErr(""); onSave(form);
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all placeholder:text-slate-300 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 border border-slate-100">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-[18px] font-extrabold text-slate-900 tracking-tight">
              {isEdit ? "Edit Goal" : "New Goal"}
            </h2>
            <p className="text-[12px] text-slate-400 mt-1">
              {isEdit ? "Update your savings target" : "Set a new financial milestone"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Goal Name *</label>
            <input
              placeholder="e.g. iPhone 16 Pro, Goa Trip, Emergency Fund"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={`${inputCls} ${err ? "border-red-300 focus:border-red-300 focus:ring-red-50" : ""}`}
            />
            {err && <p className="text-[11px] text-red-500 mt-1">{err}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target (₹)</label>
              <input type="number" min={0} placeholder="119900"
                value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Already Saved (₹)</label>
              <input type="number" min={0} placeholder="0"
                value={form.currentSaved} onChange={e => setForm({ ...form, currentSaved: e.target.value })}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Date</label>
            <input type="date" value={form.targetDate}
              onChange={e => setForm({ ...form, targetDate: e.target.value })}
              className={inputCls} />
          </div>
        </div>

        <div className="flex gap-3 mt-7">
          <button
            onClick={onClose} disabled={saving}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-[13px] font-bold disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Create Goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty & Error States ─────────────────────────────────────────────────────
function EmptyState({ filter, onCreate }: { filter: string; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center py-24 text-center col-span-full">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
        <Target size={28} className="text-indigo-400" />
      </div>
      <p className="text-[15px] font-bold text-slate-700">
        {filter === "ALL" ? "No goals yet" : `No ${filter.toLowerCase()} goals`}
      </p>
      <p className="text-[12px] text-slate-400 mt-2 max-w-xs leading-relaxed">
        {filter === "ALL"
          ? "Chat with MoneyLens to auto-detect goals, or create one manually."
          : `You don't have any ${filter.toLowerCase()} goals right now.`}
      </p>
      {filter === "ALL" && (
        <button
          onClick={onCreate}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-[13px] font-bold transition-colors shadow-lg shadow-indigo-100"
        >
          <Plus size={14} /> Create your first goal
        </button>
      )}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center py-24 text-center col-span-full">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-red-400" />
      </div>
      <p className="text-[14px] font-bold text-slate-700">Failed to load goals</p>
      <p className="text-[12px] text-slate-400 mt-1">Something went wrong fetching your data.</p>
      <button
        onClick={onRetry}
        className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-[13px] font-bold transition-colors"
      >
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3 bg-slate-100 rounded-full w-2/3 animate-pulse" />
          <div className="h-2.5 bg-slate-100 rounded-full w-1/3 animate-pulse" />
        </div>
        <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse" />
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full animate-pulse" />
      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
        <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
      </div>
      <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type FilterKey = "ALL" | GoalStatus;

export default function GoalsPage() {
  const { data: goals = [], isLoading: goalsLoading, isError: goalsError, refetch } = useGetGoalsQuery();
  const { data: plans = [], isLoading: plansLoading }                               = useGetPlansQuery();

  const [createGoal, { isLoading: creating }] = useCreateGoalMutation();
  const [updateGoal, { isLoading: updating }] = useUpdateGoalMutation();
  const [updateSaved]                         = useUpdateSavedMutation();
  const [cancelGoal]                          = useCancelGoalMutation();
  const [checkIn]                             = useCheckInMutation();
  const [abandonPlan]                         = useAbandonPlanMutation();

  const [filter,           setFilter]           = useState<FilterKey>("ALL");
  const [modalGoal,        setModalGoal]        = useState<Partial<GoalDto> | null | undefined>(undefined);
  const [cancellingId,     setCancellingId]     = useState<string | null>(null);
  const [savingProgressId, setSavingProgressId] = useState<string | null>(null);
  const [abandoningPlanId, setAbandoningPlanId] = useState<string | null>(null);

  const saving = creating || updating;

  const planByGoalId = plans.reduce<Record<string, GoalPlanDto>>((acc, p) => {
    if (p.status === "ACTIVE") acc[p.goalId] = p;
    return acc;
  }, {});

  const handleSave = async (form: ModalForm) => {
    const payload = {
      name:         form.name,
      targetAmount: form.targetAmount ? parseFloat(form.targetAmount) : null,
      currentSaved: parseFloat(form.currentSaved) || 0,
      targetDate:   form.targetDate || null,
    };
    try {
      if (modalGoal?.id) await updateGoal({ goalId: modalGoal.id, ...payload }).unwrap();
      else               await createGoal({ ...payload, source: "MANUAL" }).unwrap();
      setModalGoal(undefined);
    } catch (e) { console.error("Goal save failed:", e); }
  };

  const handleAddSavings = async (id: string, addAmt: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    setSavingProgressId(id);
    try { await updateSaved({ goalId: id, currentSaved: goal.currentSaved + addAmt }).unwrap(); }
    finally { setSavingProgressId(null); }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try { await cancelGoal(id).unwrap(); }
    finally { setCancellingId(null); }
  };

  const handleAbandonPlan = async (planId: string) => {
    setAbandoningPlanId(planId);
    try { await abandonPlan(planId).unwrap(); }
    finally { setAbandoningPlanId(null); }
  };

  const handleCheckIn = async (args: { planId: string; taskId: string; savedAmount?: number; note?: string; status: "DONE" | "SKIPPED" }) => {
    try { await checkIn(args).unwrap(); }
    catch (e) { console.error("Check-in failed:", e); }
  };

  const FILTERS: Array<{ key: FilterKey; label: string }> = [
    { key: "ALL",       label: "All"       },
    { key: "ACTIVE",    label: "Active"    },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  const filtered  = filter === "ALL" ? goals : goals.filter(g => g.status === filter);
  const isLoading = goalsLoading || plansLoading;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; font-family: 'Sora', sans-serif; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
        .animate-spin      { animation: spin 1s linear infinite; }
        .animate-pulse     { animation: pulse 2s cubic-bezier(.4,0,.6,1) infinite; }
      `}</style>

      {modalGoal !== undefined && (
        <GoalModal goal={modalGoal} onClose={() => setModalGoal(undefined)} onSave={handleSave} saving={saving} />
      )}

      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

          {/* Page header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Financial Goals
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8" }}>
                Track milestones · auto-detected from chats · powered by MoneyLens AI
              </p>
            </div>
            <button
              onClick={() => setModalGoal({})}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-[13px] font-bold transition-all shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            >
              <Plus size={15} /> New Goal
            </button>
          </div>

          {/* Stats */}
          {!isLoading && !goalsError && goals.length > 0 && (
            <StatsBanner goals={goals} plans={plans} />
          )}

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-6" style={{ background: "#f1f5f9", borderRadius: 16, padding: 4, width: "fit-content" }}>
            {FILTERS.map(({ key, label }) => {
              const active = filter === key;
              const count  = key === "ALL" ? null : goals.filter(g => g.status === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200"
                  style={{
                    background: active ? "#fff" : "transparent",
                    color:      active ? "#0f172a" : "#94a3b8",
                    boxShadow:  active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {label}
                  {count != null && count > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: active ? "#eef2ff" : "#e2e8f0", color: active ? "#6366f1" : "#94a3b8" }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : goalsError ? (
            <ErrorState onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <EmptyState filter={filter} onCreate={() => setModalGoal({})} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  plan={planByGoalId[goal.id] ?? null}
                  onEdit={g => setModalGoal(g)}
                  onCancel={handleCancel}
                  onAddSavings={handleAddSavings}
                  onAbandonPlan={handleAbandonPlan}
                  onCheckIn={handleCheckIn}
                  cancellingGoal={cancellingId === goal.id}
                  savingProgress={savingProgressId === goal.id}
                  abandoningPlan={abandoningPlanId === (planByGoalId[goal.id]?.id)}
                />
              ))}
            </div>
          )}

          {/* AI legend */}
          {!isLoading && !goalsError && filtered.some(g => g.source === "AI_EXTRACTED") && (
            <div className="mt-8 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles size={12} className="text-violet-400" />
              Goals marked <span className="text-violet-500 font-semibold mx-0.5">AI</span> were detected from your MoneyLens chat conversations.
            </div>
          )}

        </div>
      </div>
    </>
  );
}
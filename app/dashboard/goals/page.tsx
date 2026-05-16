"use client";

import { useState, useRef } from "react";
import {
  Target, Plus, PlusCircle, TrendingUp, CheckCircle2, XCircle,
  Sparkles, Pencil, Trash2, X, Check, Calendar, IndianRupee,
  Wallet, Loader2, AlertCircle, RefreshCw, ChevronRight,
  ChevronDown, Zap, ListChecks, BarChart3, Clock,
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
  GoalDto,
  GoalPlanDto,
  WeekTaskDto,
  GoalStatus,
  CheckinStatus,
} from "../../redux/api/goalsApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

const statusMeta: Record<GoalStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ACTIVE:    { label: "Active",    color: "#4f6ef7", bg: "#eef1fe", icon: TrendingUp   },
  COMPLETED: { label: "Completed", color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "#9ca3af", bg: "#f3f4f6", icon: XCircle      },
};

const checkinMeta: Record<CheckinStatus, { color: string; bg: string; label: string }> = {
  PENDING: { color: "#f59e0b", bg: "#fffbeb", label: "Pending"  },
  DONE:    { color: "#16a34a", bg: "#f0fdf4", label: "Done"     },
  SKIPPED: { color: "#9ca3af", bg: "#f3f4f6", label: "Skipped"  },
};

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ percent, size = 56, stroke = 5, color = "#4f6ef7" }: {
  percent: number; size?: number; stroke?: number; color?: string;
}) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0f0f0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100" />
          <div className="space-y-2">
            <div className="h-3 w-28 bg-gray-100 rounded-full" />
            <div className="h-2.5 w-16 bg-gray-100 rounded-full" />
          </div>
        </div>
        <div className="w-14 h-14 rounded-full bg-gray-100" />
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 bg-gray-50 rounded-xl" />
        <div className="h-14 bg-gray-50 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-red-400" />
      </div>
      <p className="text-gray-600 font-medium text-sm">Failed to load goals</p>
      <p className="text-gray-400 text-xs mt-1">Something went wrong while fetching your goals.</p>
      <button onClick={onRetry}
        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
        style={{ background: "linear-gradient(135deg,#4f6ef7,#7c3aed)" }}>
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  );
}

// ─── Plan Task Row ────────────────────────────────────────────────────────────

function PlanTaskRow({ task, planId, isCurrent, periodLabel, onCheckIn, checkingIn }: {
  task:        WeekTaskDto;
  planId:      string;
  isCurrent:   boolean;
  periodLabel: string;
  onCheckIn:   (taskId: string, amount: number | null, note: string, status: "DONE" | "SKIPPED") => void;
  checkingIn:  boolean;
}) {
  const [open,      setOpen]      = useState(isCurrent);
  const [amount,    setAmount]    = useState("");
  const [note,      setNote]      = useState("");
  const [showForm,  setShowForm]  = useState(false);
  const meta = checkinMeta[task.checkinStatus];

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      isCurrent ? "border-blue-200 bg-blue-50/30" : "border-gray-100 bg-white"
    }`}>
      {/* Row header */}
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center gap-2">
          {isCurrent && (
            <span className="text-[10px] font-bold text-white bg-blue-500 rounded-full px-2 py-0.5">NOW</span>
          )}
          <span className="text-xs font-semibold text-gray-700">
            {periodLabel} {task.weekNumber}
          </span>
          <span className="text-[11px] text-gray-400">
            {new Date(task.weekStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {task.savingTarget && (
            <span className="text-xs font-bold text-emerald-600">₹{fmt(task.savingTarget)}</span>
          )}
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
          <ChevronRight size={12} className="text-gray-300 transition-transform"
            style={{ transform: open ? "rotate(90deg)" : "none" }} />
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2.5">
          {/* Actions */}
          <div className="flex flex-col gap-1">
            {task.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                <p className="text-xs text-gray-600 leading-relaxed">{action}</p>
              </div>
            ))}
          </div>

          {/* Tip */}
          {task.tip && (
            <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-2">
              <span className="text-sm flex-shrink-0">💡</span>
              <p className="text-xs text-amber-700 italic leading-relaxed">{task.tip}</p>
            </div>
          )}

          {/* Check-in — only for pending tasks */}
          {task.checkinStatus === "PENDING" && (
            <>
              {!showForm ? (
                <button onClick={() => setShowForm(true)}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-gray-200 text-xs font-medium text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all">
                  <Check size={12} /> Check in for this period
                </button>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-2 bg-white">
                    <span className="text-xs text-gray-400">₹</span>
                    <input type="number" min={0} placeholder="Amount saved"
                      value={amount} onChange={e => setAmount(e.target.value)}
                      className="flex-1 text-xs text-gray-800 outline-none placeholder-gray-300 bg-transparent" />
                  </div>
                  <input type="text" placeholder="Note (optional)"
                    value={note} onChange={e => setNote(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-800 outline-none placeholder-gray-300 focus:border-blue-300 transition-colors" />
                  <div className="flex gap-2">
                    <button onClick={() => onCheckIn(task.id, amount ? parseFloat(amount) : null, note, "DONE")}
                      disabled={checkingIn}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
                      {checkingIn ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Done
                    </button>
                    <button onClick={() => onCheckIn(task.id, null, note, "SKIPPED")}
                      disabled={checkingIn}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 disabled:opacity-60 hover:bg-gray-50 transition-colors">
                      Skip
                    </button>
                    <button onClick={() => { setShowForm(false); setAmount(""); setNote(""); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Already checked in */}
          {task.checkinStatus !== "PENDING" && task.savedAmount != null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <CheckCircle2 size={11} className="text-emerald-500" />
              Saved ₹{fmt(task.savedAmount)} this period
              {task.checkinNote && <span>· {task.checkinNote}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Plan Panel ───────────────────────────────────────────────────────────────

function PlanPanel({ plan, onAbandon, abandoningPlan }: {
  plan:          GoalPlanDto;
  onAbandon:     (id: string) => void;
  abandoningPlan: boolean;
}) {
  const [expanded,   setExpanded]   = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkIn]                   = useCheckInMutation();

  const freq        = plan.frequency === "MONTHLY" ? "monthly" : "weekly";
  const periodLabel = plan.frequency === "MONTHLY" ? "Month" : "Week";
  const visible     = expanded ? plan.weeks : plan.weeks.slice(0, 3);
  const currentIdx  = plan.weeks.findIndex(w => w.isCurrent);

  const handleCheckIn = async (
    taskId: string, amount: number | null, note: string, status: "DONE" | "SKIPPED"
  ) => {
    setCheckingIn(true);
    try {
      await checkIn({ planId: plan.id, taskId, savedAmount: amount ?? undefined, note, status }).unwrap();
    } catch (err) {
      console.error("Check-in failed:", err);
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
      {/* Plan header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
            <ListChecks size={12} className="text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700 capitalize">{freq} plan</span>
          <span className="text-[10px] text-gray-400">
            · {plan.totalWeeks} {periodLabel.toLowerCase()}s · {plan.progressPct}% done
          </span>
        </div>
        <button onClick={() => onAbandon(plan.id)} disabled={abandoningPlan}
          className="text-[10px] text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50">
          {abandoningPlan ? <Loader2 size={10} className="animate-spin" /> : "Abandon"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(plan.progressPct, 100)}%` }} />
        </div>
        {plan.weeklySavingTarget && (
          <span className="text-[10px] font-semibold text-emerald-600 flex-shrink-0">
            ₹{fmt(plan.weeklySavingTarget)}/{freq === "weekly" ? "wk" : "mo"}
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 rounded-lg px-2.5 py-2">
        {plan.summary}
      </p>

      {/* Task rows */}
      <div className="flex flex-col gap-2">
        {visible.map((w, i) => (
          <PlanTaskRow key={w.id} task={w} planId={plan.id}
            isCurrent={i === currentIdx || (currentIdx === -1 && i === 0)}
            periodLabel={periodLabel}
            onCheckIn={handleCheckIn}
            checkingIn={checkingIn}
          />
        ))}
      </div>

      {/* Expand toggle */}
      {plan.weeks.length > 3 && (
        <button onClick={() => setExpanded(v => !v)}
          className="flex items-center justify-center gap-1.5 text-xs text-blue-500 font-medium py-1 hover:text-blue-600 transition-colors">
          <ChevronDown size={13} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          {expanded ? "Show less" : `Show all ${plan.weeks.length} ${periodLabel.toLowerCase()}s`}
        </button>
      )}
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal, plan, onEdit, onCancel, onAddSavings, onAbandonPlan,
  cancellingGoal, savingProgress, abandoningPlan }: {
  goal:           GoalDto;
  plan:           GoalPlanDto | null;
  onEdit:         (g: GoalDto) => void;
  onCancel:       (id: string) => void;
  onAddSavings:   (id: string, addAmount: number) => Promise<void>;
  onAbandonPlan:  (planId: string) => void;
  cancellingGoal: boolean;
  savingProgress: boolean;
  abandoningPlan: boolean;
}) {
  const meta = statusMeta[goal.status];
  const StatusIcon = meta.icon;
  const ringColor =
    goal.status === "COMPLETED" ? "#16a34a"
    : goal.status === "CANCELLED" ? "#d1d5db"
    : goal.progressPercent >= 75 ? "#4f6ef7"
    : goal.progressPercent >= 40 ? "#f59e0b"
    : "#f97316";

  const [addAmount, setAddAmount] = useState("");
  const [inputOpen, setInputOpen] = useState(false);
  const [planOpen,  setPlanOpen]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openInput = () => { setInputOpen(true); setTimeout(() => inputRef.current?.focus(), 50); };

  const handleAdd = async () => {
    const n = parseFloat(addAmount);
    if (!n || n <= 0) return;
    await onAddSavings(goal.id, n);
    setAddAmount("");
    setInputOpen(false);
  };

  const remaining = goal.targetAmount != null
    ? Math.max(0, goal.targetAmount - goal.currentSaved) : null;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: meta.bg }}>
            <StatusIcon size={18} style={{ color: meta.color }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate leading-tight">{goal.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
              {goal.source === "AI_EXTRACTED" && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-500 flex items-center gap-1">
                  <Sparkles size={10} /> AI
                </span>
              )}
              {plan && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1">
                  <ListChecks size={10} /> Plan active
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="relative flex-shrink-0">
          <ProgressRing percent={goal.progressPercent} color={ringColor} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
            style={{ color: ringColor }}>
            {Math.round(goal.progressPercent)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(goal.progressPercent, 100)}%`,
            background:
              goal.status === "COMPLETED" ? "#16a34a"
              : goal.progressPercent >= 75 ? "#4f6ef7"
              : goal.progressPercent >= 40 ? "#f59e0b"
              : "#f97316",
          }} />
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
            <Wallet size={10} /> Saved
          </p>
          <p className="font-bold text-gray-800 text-sm">₹{fmt(goal.currentSaved)}</p>
        </div>
        {goal.targetAmount != null && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
              <Target size={10} />
              {goal.status === "ACTIVE" && remaining != null && remaining > 0 ? "Remaining" : "Target"}
            </p>
            <p className="font-bold text-gray-800 text-sm">
              {goal.status === "ACTIVE" && remaining != null && remaining > 0
                ? `₹${fmt(remaining)}`
                : `₹${fmt(goal.targetAmount)}`}
            </p>
          </div>
        )}
      </div>

      {/* Log savings — ACTIVE only */}
      {goal.status === "ACTIVE" && (
        <div>
          {inputOpen ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1.5 border border-blue-200 rounded-xl px-3 py-2 bg-blue-50/40 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <span className="text-xs text-gray-400 font-medium">₹</span>
                <input ref={inputRef} type="number" min={1} placeholder="Amount saved"
                  value={addAmount}
                  onChange={e => setAddAmount(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setInputOpen(false); setAddAmount(""); }}}
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-300 min-w-0" />
              </div>
              <button onClick={handleAdd} disabled={savingProgress || !addAmount}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#4f6ef7,#7c3aed)" }}>
                {savingProgress ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Add
              </button>
              <button onClick={() => { setInputOpen(false); setAddAmount(""); }}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button onClick={openInput}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-200 text-xs font-medium text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/40 transition-all">
              <PlusCircle size={13} /> Log savings
            </button>
          )}
        </div>
      )}

      {/* Plan toggle — ACTIVE goals with a plan */}
      {goal.status === "ACTIVE" && plan && (
        <button onClick={() => setPlanOpen(v => !v)}
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors">
          <div className="flex items-center gap-2">
            <BarChart3 size={13} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">View savings plan</span>
            <span className="text-[10px] text-emerald-500">
              {plan.progressPct}% · Week {plan.weeks.findIndex(w => w.isCurrent) + 1} of {plan.totalWeeks}
            </span>
          </div>
          <ChevronDown size={13} className="text-emerald-500 transition-transform"
            style={{ transform: planOpen ? "rotate(180deg)" : "none" }} />
        </button>
      )}

      {/* Expanded plan */}
      {planOpen && plan && (
        <PlanPanel plan={plan} onAbandon={onAbandonPlan} abandoningPlan={abandoningPlan} />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          {goal.monthlyContribution != null && goal.status === "ACTIVE" && (
            <span className="flex items-center gap-1">
              <IndianRupee size={10} /> {fmt(goal.monthlyContribution)}/mo needed
            </span>
          )}
          {goal.targetDate && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {goal.monthsLeft > 0
                ? `${goal.monthsLeft}mo left`
                : goal.status === "COMPLETED" ? "Done!" : "Overdue"}
            </span>
          )}
        </div>

        {goal.status === "ACTIVE" && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(goal)}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors" title="Edit">
              <Pencil size={13} />
            </button>
            <button onClick={() => onCancel(goal.id)} disabled={cancellingGoal}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50" title="Cancel">
              {cancellingGoal ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalForm {
  name: string; targetAmount: string; currentSaved: string; targetDate: string;
}

function GoalModal({ goal, onClose, onSave, saving }: {
  goal:    Partial<GoalDto> | null;
  onClose: () => void;
  onSave:  (form: ModalForm) => void;
  saving:  boolean;
}) {
  const isEdit = !!goal?.id;
  const [form, setForm] = useState<ModalForm>({
    name:         goal?.name ?? "",
    targetAmount: goal?.targetAmount?.toString() ?? "",
    currentSaved: goal?.currentSaved?.toString() ?? "0",
    targetDate:   goal?.targetDate ?? "",
  });
  const [fieldError, setFieldError] = useState("");

  const handleSave = () => {
    if (!form.name.trim()) { setFieldError("Goal name is required."); return; }
    setFieldError("");
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-blue-100 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{isEdit ? "Edit Goal" : "New Goal"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? "Update your savings target" : "Set a new financial milestone"}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Goal Name *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder-gray-300"
              placeholder="e.g. iPhone 16, Goa Trip, Emergency Fund"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            {fieldError && <p className="text-xs text-red-400 mt-1">{fieldError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Target Amount (₹)", key: "targetAmount", placeholder: "134900" },
              { label: "Already Saved (₹)", key: "currentSaved", placeholder: "0"      },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
                <input type="number" min={0} placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder-gray-300"
                  value={(form as any)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Target Date</label>
            <input type="date"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              value={form.targetDate}
              onChange={e => setForm({ ...form, targetDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ background: "linear-gradient(135deg,#4f6ef7,#7c3aed)" }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Create Goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────

function StatsStrip({ goals, plans }: { goals: GoalDto[]; plans: GoalPlanDto[] }) {
  const active      = goals.filter(g => g.status === "ACTIVE").length;
  const totalSaved  = goals.reduce((a, g) => a + g.currentSaved, 0);
  const totalTarget = goals.filter(g => g.targetAmount != null).reduce((a, g) => a + (g.targetAmount ?? 0), 0);
  const completed   = goals.filter(g => g.status === "COMPLETED").length;
  const activePlans = plans.filter(p => p.status === "ACTIVE").length;

  const stats = [
    { label: "Active Goals",  value: active,                icon: Target,       color: "#4f6ef7", bg: "#eef1fe" },
    { label: "Total Saved",   value: `₹${fmt(totalSaved)}`, icon: Wallet,       color: "#16a34a", bg: "#f0fdf4" },
    { label: "Total Target",  value: `₹${fmt(totalTarget)}`, icon: TrendingUp,  color: "#f59e0b", bg: "#fffbeb" },
    { label: "Completed",     value: completed,             icon: CheckCircle2, color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Active Plans",  value: activePlans,           icon: ListChecks,   color: "#0891b2", bg: "#ecfeff" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: bg }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <p className="text-xs text-gray-400 leading-tight">{label}</p>
            <p className="font-bold text-gray-800 text-sm mt-0.5">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterKey = "ALL" | GoalStatus;

export default function GoalsPage() {
  const [filter,           setFilter]           = useState<FilterKey>("ALL");
  const [modalGoal,        setModalGoal]        = useState<Partial<GoalDto> | null | undefined>(undefined);
  const [cancellingId,     setCancellingId]     = useState<string | null>(null);
  const [savingProgressId, setSavingProgressId] = useState<string | null>(null);
  const [abandoningPlanId, setAbandoningPlanId] = useState<string | null>(null);

  const { data: goals = [], isLoading, isError, refetch } = useGetGoalsQuery();
  const { data: plans = [] }                              = useGetPlansQuery();
  const [createGoal, { isLoading: creating }]             = useCreateGoalMutation();
  const [updateGoal, { isLoading: updating }]             = useUpdateGoalMutation();
  const [updateSaved]                                     = useUpdateSavedMutation();
  const [cancelGoal]                                      = useCancelGoalMutation();
  const [abandonPlan]                                     = useAbandonPlanMutation();

  const saving = creating || updating;

  // Map goalId → active plan for O(1) lookup
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
      if (modalGoal?.id) {
        await updateGoal({ goalId: modalGoal.id, ...payload }).unwrap();
      } else {
        await createGoal({ ...payload, source: "MANUAL" }).unwrap();
      }
      setModalGoal(undefined);
    } catch (err) { console.error("Goal save failed:", err); }
  };

  const handleAddSavings = async (id: string, addAmount: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    setSavingProgressId(id);
    try {
      await updateSaved({ goalId: id, currentSaved: goal.currentSaved + addAmount }).unwrap();
    } catch (err) { console.error("Add savings failed:", err); }
    finally { setSavingProgressId(null); }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try { await cancelGoal(id).unwrap(); }
    catch (err) { console.error("Cancel failed:", err); }
    finally { setCancellingId(null); }
  };

  const handleAbandonPlan = async (planId: string) => {
    setAbandoningPlanId(planId);
    try { await abandonPlan(planId).unwrap(); }
    catch (err) { console.error("Abandon failed:", err); }
    finally { setAbandoningPlanId(null); }
  };

  const filtered = filter === "ALL" ? goals : goals.filter(g => g.status === filter);

  const filterOptions: Array<{ key: FilterKey; label: string }> = [
    { key: "ALL",       label: "All"       },
    { key: "ACTIVE",    label: "Active"    },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <>
      {modalGoal !== undefined && (
        <GoalModal goal={modalGoal} onClose={() => setModalGoal(undefined)}
          onSave={handleSave} saving={saving} />
      )}

      <div className="flex-1 overflow-y-auto bg-gray-50/60 min-h-screen">
        <div className="mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Financial Goals</h1>
              <p className="text-sm text-gray-400 mt-1">Track your savings milestones and stay on target.</p>
            </div>
            <button onClick={() => setModalGoal({})}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg,#4f6ef7,#7c3aed)" }}>
              <Plus size={15} /> New Goal
            </button>
          </div>

          {/* Stats */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-16 animate-pulse" />
              ))}
            </div>
          ) : !isError && <StatsStrip goals={goals} plans={plans} />}

          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            {filterOptions.map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
                style={filter === key
                  ? { background: "#4f6ef7", color: "#fff" }
                  : { background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                {label}
                {key !== "ALL" && !isLoading && (
                  <span className="ml-1.5 opacity-75">{goals.filter(g => g.status === key).length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <Target size={24} className="text-blue-400" />
              </div>
              <p className="text-gray-500 font-medium text-sm">No goals here</p>
              <p className="text-gray-400 text-xs mt-1">
                {filter === "ALL"
                  ? "Create a new goal to start tracking your savings."
                  : `No ${filter.toLowerCase()} goals found.`}
              </p>
              {filter === "ALL" && (
                <button onClick={() => setModalGoal({})}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#4f6ef7,#7c3aed)" }}>
                  <Plus size={13} /> New Goal
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(goal => (
                <GoalCard key={goal.id} goal={goal}
                  plan={planByGoalId[goal.id] ?? null}
                  onEdit={g => setModalGoal(g)}
                  onCancel={handleCancel}
                  onAddSavings={handleAddSavings}
                  onAbandonPlan={handleAbandonPlan}
                  cancellingGoal={cancellingId === goal.id}
                  savingProgress={savingProgressId === goal.id}
                  abandoningPlan={abandoningPlanId === planByGoalId[goal.id]?.id}
                />
              ))}
            </div>
          )}

          {/* AI badge legend */}
          {!isLoading && !isError && filtered.some(g => g.source === "AI_EXTRACTED") && (
            <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
              <Sparkles size={12} className="text-purple-400" />
              <span>Goals marked <span className="text-purple-500 font-medium">AI</span> were detected from your chat conversations.</span>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
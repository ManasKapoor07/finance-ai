"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, Loader2, RotateCcw, Sparkles,
  TrendingUp, ShieldAlert, Target, Lightbulb,
  ChevronRight, Clock, Plus, Check, Calendar,
  CreditCard, X, ChevronDown, CalendarDays,
  Zap, ListChecks, CheckCircle2,
} from "lucide-react";
import {
  useSendChatMessageMutation,
  useConfirmGoalMutation,
  useListChatsQuery,
  useGetChatHistoryQuery,
  type ChatMessageDto,
  type ChatListItem,
  type SuggestedGoalDto,
  type GoalPlanDto,
  type WeekTaskDto,
  type StatementIdWithBank,
  useGetStatementIdsQuery,
} from "../../redux/api/authApi";
import {
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateSavedMutation,
  useCancelGoalMutation,
  type GoalDto,
} from "../../redux/api/goalsApi";

// ─── Types ─────────────────────────────────────────────────────────────────

interface LocalMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  pending?: boolean;
  suggestedGoal?: SuggestedGoalDto | null;
  goalConfirmed?: boolean;
  goalDismissed?: boolean;
  createdPlan?: GoalPlanDto | null;
  planOfferPending?: boolean;
  pendingPlanGoalName?: string | null;
  planLimitError?: string | null;   // ← add this
}

interface Props {
  statementId?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function genId() { return Math.random().toString(36).slice(2, 10); }
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

const QUICK_PROMPTS = [
  { icon: ShieldAlert, label: "Risk check",     text: "What are my biggest financial risk flags right now?" },
  { icon: TrendingUp,  label: "Spending pulse",  text: "Give me a spending pulse — where is my money going?" },
  { icon: Target,      label: "Goal advice",    text: "How can I reach my savings goals faster?" },
  { icon: Lightbulb,   label: "Smart tip",      text: "What's one thing I can do today to improve my finances?" },
];

// ─── Typing Dots ─────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 2px" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#94a3b8",
          display: "inline-block", animation: "mlBounce 1.2s infinite",
          animationDelay: `${i * 0.18}s`,
        }} />
      ))}
    </div>
  );
}

// ─── Statement Picker ─────────────────────────────────────────────────────────

function StatementPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading, isError } = useGetStatementIdsQuery(undefined);
  const statements: StatementIdWithBank[] = Array.isArray(data) ? data : [];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", gap: 28 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#4f6ef7,#6d4aff)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 8px 28px rgba(79,110,247,0.32)" }}>
          <CreditCard size={26} color="#fff" />
        </div>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em" }}>Select a statement</h2>
        <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#64748b", lineHeight: 1.6, maxWidth: 340 }}>
          Choose which bank statement you'd like MoneyLens AI to analyse.
        </p>
      </div>

      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 13 }}>
          <Loader2 size={15} style={{ animation: "mlSpin 1s linear infinite" }} /> Loading…
        </div>
      )}
      {isError && <p style={{ fontSize: 13, color: "#ef4444" }}>Could not load statements.</p>}
      {!isLoading && !isError && statements.length === 0 && (
        <p style={{ fontSize: 13, color: "#94a3b8" }}>No statements found. Please upload one first.</p>
      )}
      {!isLoading && !isError && statements.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 420 }}>
          {statements.map((s) => (
            <button key={s.id} onClick={() => onSelect(s.id)} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              borderRadius: 13, border: "1.5px solid #e8ecf4", background: "#fff",
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CreditCard size={17} color="#4f6ef7" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.bankName}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{s.id.slice(0, 8)}…</p>
              </div>
              <ChevronRight size={15} color="#c7d2e8" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Goal Suggestion Card ─────────────────────────────────────────────────────

function GoalSuggestionCard({ goal, chatId, onConfirmed, onDismiss }: {
  goal: SuggestedGoalDto;
  chatId: string;
  onConfirmed: (res: { reply: string; plan?: GoalPlanDto | null }) => void;
  onDismiss: () => void;
}) {
  const [confirmGoal, { isLoading }] = useConfirmGoalMutation();
  const [done, setDone] = useState(false);
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount != null ? String(goal.targetAmount) : "");
  const [currentSaved, setCurrentSaved] = useState(goal.currentSaved != null ? String(goal.currentSaved) : "");
  const [errors, setErrors] = useState<{ target?: string; saved?: string }>({});

  const validate = () => {
    const e: { target?: string; saved?: string } = {};
    const t = Number(targetAmount), s = Number(currentSaved || "0");
    if (!targetAmount.trim() || isNaN(t) || t <= 0) e.target = "Enter a valid target amount";
    if (currentSaved.trim() !== "" && (isNaN(s) || s < 0)) e.saved = "Enter a valid amount or leave blank";
    if (!e.target && !e.saved && s > t) e.saved = "Savings can't exceed target";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    try {
      const res = await confirmGoal({
        chatId,
        body: {
          name: goal.name,
          targetAmount: Number(targetAmount),
          currentSaved: currentSaved.trim() === "" ? 0 : Number(currentSaved),
          targetDate: goal.targetDate ?? null,
        },
      }).unwrap();
      setDone(true);
      onConfirmed({ reply: res.reply, plan: res.createdPlan });
    } catch (err) {
      console.error("Goal confirmation failed:", err);
    }
  };

  if (done) return (
    <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#15803d", fontWeight: 500 }}>
      <CheckCircle2 size={13} color="#22c55e" style={{ flexShrink: 0 }} />
      Goal "{goal.name}" added!
    </div>
  );

  return (
    <div style={{ marginTop: 10, borderRadius: 14, border: "1px solid #dbeafe", background: "linear-gradient(135deg,#eff6ff,#eef2ff)", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={13} color="#6366f1" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b" }}>Goal detected</p>
          <p style={{ margin: 0, fontSize: 10.5, color: "#94a3b8" }}>Confirm the details to start tracking</p>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Target size={12} color="#818cf8" />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{goal.name}</p>
        </div>
        {goal.targetDate && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", background: "#f1f5f9", borderRadius: 20, padding: "2px 8px" }}>
            <Calendar size={10} />
            {new Date(goal.targetDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Target amount", required: true, value: targetAmount, setter: setTargetAmount, key: "target" as const, placeholder: "100000" },
          { label: "Already saved", required: false, value: currentSaved, setter: setCurrentSaved, key: "saved" as const, placeholder: "0" },
        ].map(({ label, required, value, setter, key, placeholder }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {label} {required ? <span style={{ color: "#f87171" }}>*</span> : <span style={{ color: "#cbd5e1" }}>(opt)</span>}
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#94a3b8" }}>₹</span>
              <input type="number" min={0} placeholder={placeholder} value={value}
                onChange={e => { setter(e.target.value); setErrors(p => ({ ...p, [key]: undefined })); }}
                style={{ width: "100%", paddingLeft: 22, paddingRight: 8, paddingTop: 7, paddingBottom: 7, borderRadius: 8, fontSize: 12, color: "#1e293b", background: "#fff", border: `1px solid ${errors[key] ? "#fca5a5" : "#e2e8f0"}`, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            {errors[key] && <p style={{ margin: 0, fontSize: 10, color: "#ef4444" }}>{errors[key]}</p>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleConfirm} disabled={isLoading} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 9, border: "none", cursor: isLoading ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#4f6ef7,#7c3aed)", color: "#fff", fontSize: 12, fontWeight: 600, opacity: isLoading ? 0.6 : 1 }}>
          {isLoading ? <Loader2 size={12} style={{ animation: "mlSpin 1s linear infinite" }} /> : <Check size={12} />}
          Add goal
        </button>
        <button onClick={onDismiss} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#64748b" }}>
          Not now
        </button>
      </div>
    </div>
  );
}

// ─── Plan Offer Card ──────────────────────────────────────────────────────────

function PlanOfferCard({ goalName, onSelect }: {
  goalName: string;
  onSelect: (frequency: "weekly" | "monthly") => void;
}) {
  return (
    <div style={{ marginTop: 10, borderRadius: 14, border: "1px solid #fde68a", background: "linear-gradient(135deg,#fffbeb,#fff7ed)", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CalendarDays size={13} color="#d97706" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b" }}>Build a savings plan?</p>
          <p style={{ margin: 0, fontSize: 10.5, color: "#94a3b8" }}>Get a concrete roadmap for <strong style={{ color: "#92400e" }}>{goalName}</strong></p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Weekly", sub: "Week-by-week actions", icon: Zap, freq: "weekly" as const },
          { label: "Monthly", sub: "Month-by-month targets", icon: TrendingUp, freq: "monthly" as const },
        ].map(({ label, sub, icon: Icon, freq }) => (
          <button key={freq} onClick={() => onSelect(freq)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 12, borderRadius: 12, background: "#fff", border: "1.5px solid #fde68a", cursor: "pointer", transition: "all 0.15s" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={14} color="#d97706" />
            </div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{label}</p>
            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", textAlign: "center" }}>{sub}</p>
          </button>
        ))}
      </div>
      <button onClick={() => onSelect("weekly")} style={{ fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", textAlign: "center" }}>
        Skip for now
      </button>
    </div>
  );
}

// ─── Created Plan Card ────────────────────────────────────────────────────────

function WeekRow({ week, periodLabel, isCurrent }: { week: WeekTaskDto; periodLabel: string; isCurrent: boolean }) {
  const [open, setOpen] = useState(isCurrent);
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${isCurrent ? "#6ee7b7" : "#e2e8f0"}`, background: "rgba(255,255,255,0.7)", overflow: "hidden" }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isCurrent && <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "#10b981", borderRadius: 20, padding: "1px 6px" }}>NOW</span>}
          <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{periodLabel} {week.weekNumber}</span>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>{new Date(week.weekStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {week.savingTarget && <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>₹{fmt(week.savingTarget)}</span>}
          <ChevronRight size={12} color="#94a3b8" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          {week.actions.map((action, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ color: "#10b981", marginTop: 1, flexShrink: 0 }}>•</span>
              <p style={{ margin: 0, fontSize: 11, color: "#4b5563", lineHeight: 1.5 }}>{action}</p>
            </div>
          ))}
          {week.tip && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 4, background: "#fffbeb", borderRadius: 8, padding: "6px 8px" }}>
              <span style={{ fontSize: 11, flexShrink: 0 }}>💡</span>
              <p style={{ margin: 0, fontSize: 11, color: "#4b5563", fontStyle: "italic", lineHeight: 1.5 }}>{week.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreatedPlanCard({ plan }: { plan: GoalPlanDto }) {
  const [expanded, setExpanded] = useState(false);
  const freq = plan.frequency === "MONTHLY" ? "monthly" : "weekly";
  const periodLabel = plan.frequency === "MONTHLY" ? "Month" : "Week";
  const visible = expanded ? plan.weeks.slice(0, 4) : plan.weeks.slice(0, 2);

  return (
    <div style={{ marginTop: 10, borderRadius: 14, border: "1px solid #6ee7b7", background: "linear-gradient(135deg,#ecfdf5,#f0fdfa)", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ListChecks size={13} color="#059669" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{plan.totalWeeks}-{periodLabel.toLowerCase()} plan created</p>
            <p style={{ margin: 0, fontSize: 10.5, color: "#94a3b8" }}>{plan.goalName} · {freq}</p>
          </div>
        </div>
        {plan.weeklySavingTarget && (
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#059669" }}>₹{fmt(plan.weeklySavingTarget)}</p>
            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>/{freq === "weekly" ? "wk" : "mo"}</p>
          </div>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: "#4b5563", lineHeight: 1.6, background: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "8px 10px" }}>{plan.summary}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {visible.map(w => <WeekRow key={w.id} week={w} periodLabel={periodLabel} isCurrent={w.isCurrent} />)}
      </div>
      {plan.weeks.length > 2 && (
        <button onClick={() => setExpanded(v => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, color: "#059669", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>
          {expanded ? "Show less" : `Show more ${periodLabel.toLowerCase()}s`}
          <ChevronRight size={12} style={{ transform: expanded ? "rotate(90deg)" : "none" }} />
        </button>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4, borderTop: "1px solid #a7f3d0" }}>
        <div style={{ flex: 1, height: 6, background: "#a7f3d0", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(plan.progressPct, 100)}%`, background: "#10b981", borderRadius: 3, transition: "width 0.7s" }} />
        </div>
        <span style={{ fontSize: 10, color: "#6b7280", flexShrink: 0 }}>{plan.progressPct}% done</span>
      </div>
    </div>
  );
}

// ─── Goals Panel ──────────────────────────────────────────────────────────────

function GoalsPanel({ statementId }: { statementId: string }) {
  const { data: goals = [], isLoading, refetch } = useGetGoalsQuery();
  const [createGoal, { isLoading: creating }] = useCreateGoalMutation();
  const [updateSaved] = useUpdateSavedMutation();
  const [cancelGoal] = useCancelGoalMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", currentSaved: "", targetDate: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string; target?: string }>({});
  const [editingSaved, setEditingSaved] = useState<string | null>(null);
  const [savedInput, setSavedInput] = useState("");

  const validateForm = () => {
    const e: { name?: string; target?: string } = {};
    if (!form.name.trim()) e.name = "Goal name is required";
    if (!form.targetAmount.trim() || isNaN(Number(form.targetAmount)) || Number(form.targetAmount) <= 0) e.target = "Enter a valid target amount";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      await createGoal({
        name: form.name.trim(),
        targetAmount: Number(form.targetAmount),
        currentSaved: form.currentSaved.trim() ? Number(form.currentSaved) : 0,
        targetDate: form.targetDate || null,
        statementId,
        source: "MANUAL",
      }).unwrap();
      setForm({ name: "", targetAmount: "", currentSaved: "", targetDate: "" });
      setShowForm(false);
    } catch (err) { console.error("Create goal failed:", err); }
  };

  const handleUpdateSaved = async (goalId: string) => {
    const val = Number(savedInput);
    if (isNaN(val) || val < 0) return;
    try {
      await updateSaved({ goalId, currentSaved: val }).unwrap();
      setEditingSaved(null);
    } catch (err) { console.error("Update saved failed:", err); }
  };

  const handleCancel = async (goalId: string) => {
    if (!confirm("Cancel this goal?")) return;
    try { await cancelGoal(goalId).unwrap(); } catch (err) { console.error("Cancel goal failed:", err); }
  };

  const active = goals.filter(g => g.status === "ACTIVE");
  const completed = goals.filter(g => g.status === "COMPLETED");

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Financial Goals</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>{active.length} active · {completed.length} completed</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none", background: showForm ? "#f1f5f9" : "linear-gradient(135deg,#4f6ef7,#7c3aed)", color: showForm ? "#64748b" : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? "Cancel" : "New Goal"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ borderRadius: 14, border: "1px solid #e0e7ff", background: "linear-gradient(135deg,#f8faff,#f5f3ff)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Create a new goal</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Goal name *", key: "name", type: "text", placeholder: "e.g. iPhone 16 Pro, Goa Trip", error: formErrors.name },
              { label: "Target amount (₹) *", key: "targetAmount", type: "number", placeholder: "e.g. 120000", error: formErrors.target },
              { label: "Already saved (₹)", key: "currentSaved", type: "number", placeholder: "0" },
              { label: "Target date", key: "targetDate", type: "date", placeholder: "" },
            ].map(({ label, key, type, placeholder, error }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
                <input
                  type={type} placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setFormErrors(p => ({ ...p, [key === "targetAmount" ? "target" : key]: undefined })); }}
                  style={{ padding: "8px 10px", borderRadius: 8, fontSize: 12, color: "#1e293b", background: "#fff", border: `1px solid ${error ? "#fca5a5" : "#e2e8f0"}`, outline: "none" }}
                />
                {error && <p style={{ margin: 0, fontSize: 10, color: "#ef4444" }}>{error}</p>}
              </div>
            ))}
          </div>
          <button onClick={handleCreate} disabled={creating} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#4f6ef7,#7c3aed)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1 }}>
            {creating ? <Loader2 size={12} style={{ animation: "mlSpin 1s linear infinite" }} /> : <Check size={12} />}
            Create Goal
          </button>
        </div>
      )}

      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 13 }}>
          <Loader2 size={15} style={{ animation: "mlSpin 1s linear infinite" }} /> Loading goals…
        </div>
      )}

      {/* Active goals */}
      {active.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Active</p>
          {active.map(goal => (
            <GoalCard key={goal.id} goal={goal}
              editingSaved={editingSaved} savedInput={savedInput}
              onEditSaved={(id, val) => { setEditingSaved(id); setSavedInput(val); }}
              onSaveSaved={handleUpdateSaved}
              onCancelEdit={() => setEditingSaved(null)}
              onSavedInputChange={setSavedInput}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {/* Completed goals */}
      {completed.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Completed</p>
          {completed.map(goal => (
            <GoalCard key={goal.id} goal={goal}
              editingSaved={editingSaved} savedInput={savedInput}
              onEditSaved={(id, val) => { setEditingSaved(id); setSavedInput(val); }}
              onSaveSaved={handleUpdateSaved}
              onCancelEdit={() => setEditingSaved(null)}
              onSavedInputChange={setSavedInput}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {!isLoading && goals.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
          <Target size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No goals yet</p>
          <p style={{ margin: "6px 0 0", fontSize: 12 }}>Create one above or ask MoneyLens AI to detect one from your chat.</p>
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, editingSaved, savedInput, onEditSaved, onSaveSaved, onCancelEdit, onSavedInputChange, onCancel }: {
  goal: GoalDto;
  editingSaved: string | null;
  savedInput: string;
  onEditSaved: (id: string, val: string) => void;
  onSaveSaved: (id: string) => void;
  onCancelEdit: () => void;
  onSavedInputChange: (val: string) => void;
  onCancel: (id: string) => void;
}) {
  const pct = goal.progressPercent ?? 0;
  const isCompleted = goal.status === "COMPLETED";

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${isCompleted ? "#bbf7d0" : "#e8ecf4"}`, background: isCompleted ? "#f0fdf4" : "#fff", padding: 16, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: isCompleted ? "#dcfce7" : "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isCompleted ? <CheckCircle2 size={15} color="#22c55e" /> : <Target size={15} color="#4f6ef7" />}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{goal.name}</p>
            {goal.targetDate && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#64748b", marginTop: 2 }}>
                <Calendar size={10} /> By {new Date(goal.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {goal.monthsLeft > 0 && ` · ${goal.monthsLeft} months left`}
              </span>
            )}
          </div>
        </div>
        {!isCompleted && (
          <button onClick={() => onCancel(goal.id)} title="Cancel goal" style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #fee2e2", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <X size={11} color="#f87171" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#64748b" }}>
            ₹{fmt(goal.currentSaved)} saved
            {goal.targetAmount ? ` of ₹${fmt(goal.targetAmount)}` : ""}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: isCompleted ? "#22c55e" : "#4f6ef7" }}>{Math.round(pct)}%</span>
        </div>
        <div style={{ height: 7, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: isCompleted ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#4f6ef7,#7c3aed)", borderRadius: 4, transition: "width 0.6s" }} />
        </div>
      </div>

      {/* Monthly contribution */}
      {goal.monthlyContribution && !isCompleted && (
        <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
          Save <strong style={{ color: "#4f6ef7" }}>₹{fmt(goal.monthlyContribution)}/month</strong> to reach your goal on time.
        </p>
      )}

      {/* Update saved */}
      {!isCompleted && (
        editingSaved === goal.id ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#94a3b8" }}>₹</span>
              <input type="number" min={0} value={savedInput} onChange={e => onSavedInputChange(e.target.value)}
                style={{ width: "100%", paddingLeft: 22, paddingRight: 8, paddingTop: 7, paddingBottom: 7, borderRadius: 8, fontSize: 12, color: "#1e293b", border: "1px solid #c7d2fe", outline: "none", boxSizing: "border-box" }}
                autoFocus
              />
            </div>
            <button onClick={() => onSaveSaved(goal.id)} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "#4f6ef7", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
            <button onClick={onCancelEdit} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: "pointer" }}>✕</button>
          </div>
        ) : (
          <button onClick={() => onEditSaved(goal.id, String(goal.currentSaved))} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 11, fontWeight: 500, color: "#64748b", alignSelf: "flex-start" }}>
            <ChevronDown size={11} /> Update saved amount
          </button>
        )
      )}
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function Bubble({ msg, statementId, chatId, onGoalConfirmed, onGoalDismiss, onPlanSelected }: {
  msg: LocalMessage;
  statementId: string;
  chatId: string | null;
  onGoalConfirmed: (msgId: string, res: { reply: string; plan?: GoalPlanDto | null }) => void;
  onGoalDismiss: (msgId: string) => void;
  onPlanSelected: (frequency: "weekly" | "monthly") => void;
}) {
  const isUser = msg.role === "USER";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 4, animation: "mlFadeUp 0.22s ease both" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isUser ? "row-reverse" : "row" }}>
        {!isUser && (
          <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg,#1e293b,#334155)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={14} color="#e2e8f0" />
          </div>
        )}
        <div style={{
          maxWidth: 520, padding: msg.pending ? "10px 14px" : "11px 16px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
          background: isUser ? "linear-gradient(135deg,#4f6ef7,#6d4aff)" : "#f8fafc",
          border: isUser ? "none" : "1px solid #e8ecf4",
          color: isUser ? "#fff" : "#1e293b",
          fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap",
          boxShadow: isUser ? "0 4px 16px rgba(79,110,247,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
          opacity: msg.pending ? 0.6 : 1,
        }}>
          {msg.pending ? <TypingDots /> : msg.content}
        </div>
      </div>

      {!isUser && !msg.pending && msg.suggestedGoal && !msg.goalDismissed && chatId && (
        <div style={{ paddingLeft: 38, width: "100%", maxWidth: 560 }}>
          <GoalSuggestionCard
            goal={msg.suggestedGoal} chatId={chatId}
            onConfirmed={res => onGoalConfirmed(msg.id, res)}
            onDismiss={() => onGoalDismiss(msg.id)}
          />
        </div>
      )}

      {!isUser && !msg.pending && msg.planOfferPending && msg.pendingPlanGoalName && (
        <div style={{ paddingLeft: 38, width: "100%", maxWidth: 560 }}>
          <PlanOfferCard goalName={msg.pendingPlanGoalName} onSelect={onPlanSelected} />
        </div>
      )}

      {!isUser && !msg.pending && msg.createdPlan && (
        <div style={{ paddingLeft: 38, width: "100%", maxWidth: 560 }}>
          <CreatedPlanCard plan={msg.createdPlan} />
        </div>
      )}

      {!msg.pending && (
        <span style={{ fontSize: 10.5, color: "#94a3b8", paddingLeft: isUser ? 0 : 38, paddingRight: isUser ? 4 : 0 }}>
          {fmtTime(msg.createdAt)}
        </span>
      )}
    </div>
  );
}

// ─── History Item ─────────────────────────────────────────────────────────────

function HistoryItem({ chat, active, onClick }: { chat: ChatListItem; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "none", background: active ? "#f0f4ff" : "transparent", cursor: "pointer", transition: "background 0.15s", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: active ? "#e0e8ff" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Clock size={13} color={active ? "#4f6ef7" : "#94a3b8"} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? "#3451d1" : "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.title || "New chat"}</p>
        <p style={{ margin: 0, fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>{fmtDate(chat.updatedAt)}</p>
      </div>
      {active && <ChevronRight size={12} color="#4f6ef7" style={{ flexShrink: 0 }} />}
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", gap: 32 }}>
      <div style={{ position: "relative" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#4f6ef7,#6d4aff)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(79,110,247,0.35)", animation: "mlPulse 3s ease-in-out infinite" }}>
          <Sparkles size={28} color="#fff" />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em" }}>Your financial mind-reader</h2>
        <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#64748b", maxWidth: 360, lineHeight: 1.6 }}>Ask me anything about your spending, goals, risks, or how to improve your financial health.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 460 }}>
        {QUICK_PROMPTS.map(({ icon: Icon, label, text }) => (
          <button key={label} onClick={() => onPrompt(text)} style={{ padding: "13px 14px", borderRadius: 12, border: "1.5px solid #e8ecf4", background: "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={13} color="#4f6ef7" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{label}</span>
            <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Chat UI ──────────────────────────────────────────────────────────────────

function ChatUI({ statementId, selectedBankName, onSwitchStatement }: {
  statementId: string;
  selectedBankName: string;
  onSwitchStatement: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"chat" | "goals">("chat");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingPlanGoalName, setPendingPlanGoalName] = useState<string | null>(null);
  const [selectedHistoryChatId, setSelectedHistoryChatId] = useState<string | null>(null);

  const { data: historyData } = useGetChatHistoryQuery(selectedHistoryChatId!, { skip: !selectedHistoryChatId });

  useEffect(() => {
    if (!historyData) return;
    setMessages(historyData.map((m: ChatMessageDto) => ({
      id: m.id, role: m.role as "USER" | "ASSISTANT",
      content: m.content, createdAt: m.createdAt,
    })));
    setChatId(selectedHistoryChatId);
  }, [historyData, selectedHistoryChatId]);

  const [sendChatMessage, { isLoading }] = useSendChatMessageMutation();
  const { data: chatList = [], refetch: refetchList } = useListChatsQuery(statementId);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    setChatId(null);
    setMessages([]);
    setSelectedHistoryChatId(null);
    setPendingPlanGoalName(null);
  }, [statementId]);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userBubble: LocalMessage = { id: genId(), role: "USER", content: msg, createdAt: new Date().toISOString() };
    const pendingId = genId();
    const pendingBubble: LocalMessage = { id: pendingId, role: "ASSISTANT", content: "", createdAt: new Date().toISOString(), pending: true };

    setMessages(prev => [...prev, userBubble, pendingBubble]);

    try {
      const res = await sendChatMessage({ statementId, chatId, message: msg }).unwrap();

      const serverMessages: LocalMessage[] = res.history.map((m: ChatMessageDto) => ({
        id: m.id, role: m.role as "USER" | "ASSISTANT",
        content: m.content, createdAt: m.createdAt,
      }));

      if (res.suggestedGoal) {
        for (let i = serverMessages.length - 1; i >= 0; i--) {
          if (serverMessages[i].role === "ASSISTANT") {
            serverMessages[i].suggestedGoal = res.suggestedGoal;
            break;
          }
        }
      }

      if (res.createdPlan) {
        for (let i = serverMessages.length - 1; i >= 0; i--) {
          if (serverMessages[i].role === "ASSISTANT") {
            serverMessages[i].createdPlan = res.createdPlan;
            break;
          }
        }
      }

      if (res.planOfferPending && res.pendingPlanGoalName) {
        for (let i = serverMessages.length - 1; i >= 0; i--) {
          if (serverMessages[i].role === "ASSISTANT") {
            serverMessages[i].planOfferPending = true;
            serverMessages[i].pendingPlanGoalName = res.pendingPlanGoalName;
            break;
          }
        }
        setPendingPlanGoalName(res.pendingPlanGoalName);
      } else {
        setPendingPlanGoalName(null);
      }

      setMessages(serverMessages);

      if (!chatId || res.newChat) {
        setChatId(res.chatId);
        refetchList();
      }
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.id !== pendingId),
        { id: genId(), role: "ASSISTANT", content: "Something went wrong. Please try again.", createdAt: new Date().toISOString() },
      ]);
    }
  }, [input, chatId, statementId, isLoading, sendChatMessage, refetchList]);

  const handleGoalConfirmed = useCallback((msgId: string, res: { reply: string; plan?: GoalPlanDto | null }) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, suggestedGoal: null, goalConfirmed: true } : m));
    const offerMsg: LocalMessage = {
      id: genId(), role: "ASSISTANT", content: res.reply, createdAt: new Date().toISOString(),
      createdPlan: res.plan ?? null,
      planOfferPending: !res.plan,
      pendingPlanGoalName: !res.plan ? "your goal" : null,
    };
    setMessages(prev => [...prev, offerMsg]);
    if (!res.plan) setPendingPlanGoalName("your goal");
  }, []);

  const handleGoalDismiss = useCallback((msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, suggestedGoal: null, goalDismissed: true } : m));
  }, []);

  const handlePlanSelected = useCallback((frequency: "weekly" | "monthly") => {
    setMessages(prev => prev.map(m => ({ ...m, planOfferPending: false })));
    setPendingPlanGoalName(null);
    send(frequency === "weekly" ? "Yes, weekly plan please" : "Yes, monthly plan please");
  }, [send]);

  const loadChat = (id: string) => setSelectedHistoryChatId(id);

  const startNew = () => {
    setChatId(null);
    setMessages([]);
    setSelectedHistoryChatId(null);
    setPendingPlanGoalName(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const resizeTextarea = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", background: "#fff", borderRight: "1px solid #f0f4f8", overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", padding: "12px 12px 0", gap: 4, borderBottom: "1px solid #f0f4f8" }}>
          {(["chat", "goals"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "8px 0", borderRadius: "8px 8px 0 0", border: "none", background: activeTab === tab ? "#f0f4ff" : "transparent", color: activeTab === tab ? "#4f6ef7" : "#94a3b8", fontSize: 12, fontWeight: activeTab === tab ? 700 : 500, cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s", borderBottom: activeTab === tab ? "2px solid #4f6ef7" : "2px solid transparent" }}>
              {tab === "chat" ? "💬 Chats" : "🎯 Goals"}
            </button>
          ))}
        </div>

        {activeTab === "chat" ? (
          <>
            <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Conversations</span>
              <button onClick={startNew} style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px solid #e8ecf4", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={13} color="#4f6ef7" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {chatList.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#cbd5e1", fontSize: 12 }}>
                  <Clock size={24} style={{ margin: "0 auto 8px", display: "block", opacity: 0.5 }} />
                  No conversations yet
                </div>
              ) : chatList.map((chat: ChatListItem) => (
                <HistoryItem key={chat.id} chat={chat} active={chat.id === chatId} onClick={() => loadChat(chat.id)} />
              ))}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            <MiniGoalsList />
          </div>
        )}

        {/* Switch statement */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid #f0f4f8", flexShrink: 0 }}>
          <button onClick={onSwitchStatement} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 9, border: "1.5px solid #e8ecf4", background: "#fff", cursor: "pointer", transition: "all 0.15s" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CreditCard size={13} color="#4f6ef7" />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedBankName}</p>
              <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>Switch statement</p>
            </div>
            <RotateCcw size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeTab === "goals" ? (
          <GoalsPanel statementId={statementId} />
        ) : (
          <>
            {/* Top bar */}
            <div style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "#fff", borderBottom: "1px solid #f0f4f8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#1e293b,#334155)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={16} color="#e2e8f0" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>MoneyLens AI</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ fontSize: 11, color: "#64748b" }}>Online · Powered by GPT-4o</span>
                  </div>
                </div>
              </div>
              <button onClick={startNew} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1.5px solid #e8ecf4", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                <RotateCcw size={12} /> New chat
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {messages.length === 0 ? (
                <EmptyState onPrompt={text => send(text)} />
              ) : (
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 780, width: "100%", margin: "0 auto" }}>
                  {messages.map(msg => (
                    <Bubble key={msg.id} msg={msg} statementId={statementId} chatId={chatId}
                      onGoalConfirmed={handleGoalConfirmed}
                      onGoalDismiss={handleGoalDismiss}
                      onPlanSelected={handlePlanSelected}
                    />
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: "12px 24px 20px", background: "#fff", borderTop: "1px solid #f0f4f8" }}>
              <div style={{ maxWidth: 780, margin: "0 auto", background: "#f8fafc", border: "1.5px solid #e8ecf4", borderRadius: 16, display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 12px" }}>
                <textarea ref={inputRef} value={input} rows={1}
                  onChange={e => { setInput(e.target.value); resizeTextarea(); }}
                  onKeyDown={handleKey}
                  placeholder={pendingPlanGoalName ? "Type weekly, monthly, or skip…" : "Ask about your finances, goals, spending…"}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", resize: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: "#0f172a", lineHeight: 1.6, padding: "2px 4px", minHeight: 28, maxHeight: 120 }}
                />
                <button onClick={() => send()} disabled={!input.trim() || isLoading} style={{ width: 36, height: 36, borderRadius: 10, border: "none", cursor: input.trim() && !isLoading ? "pointer" : "not-allowed", background: input.trim() && !isLoading ? "linear-gradient(135deg,#4f6ef7,#6d4aff)" : "#e8ecf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                  {isLoading ? <Loader2 size={15} color="#94a3b8" style={{ animation: "mlSpin 1s linear infinite" }} /> : <Send size={15} color={input.trim() ? "#fff" : "#94a3b8"} />}
                </button>
              </div>
              <p style={{ textAlign: "center", fontSize: 11, color: "#cbd5e1", margin: "8px 0 0" }}>MoneyLens AI · Uses your transaction data only · Not financial advice</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Mini Goals List (sidebar) ────────────────────────────────────────────────

function MiniGoalsList() {
  const { data: goals = [], isLoading } = useGetGoalsQuery();
  const active = goals.filter(g => g.status === "ACTIVE");

  if (isLoading) return <div style={{ padding: 16, fontSize: 12, color: "#94a3b8" }}>Loading…</div>;
  if (active.length === 0) return (
    <div style={{ padding: "24px 16px", textAlign: "center", color: "#cbd5e1", fontSize: 12 }}>
      <Target size={20} style={{ margin: "0 auto 6px", display: "block", opacity: 0.4 }} />
      No active goals
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 8px" }}>
      {active.map(g => {
        const pct = g.progressPercent ?? 0;
        return (
          <div key={g.id} style={{ padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f0f4f8" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</p>
            <div style={{ height: 4, background: "#e8ecf4", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: "linear-gradient(90deg,#4f6ef7,#7c3aed)", borderRadius: 2 }} />
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "#94a3b8" }}>₹{fmt(g.currentSaved)}{g.targetAmount ? ` / ₹${fmt(g.targetAmount)}` : ""} · {Math.round(pct)}%</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagePage({ statementId: propStatementId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(propStatementId ?? null);

  useEffect(() => {
    if (propStatementId) setSelectedId(propStatementId);
  }, [propStatementId]);

  const { data } = useGetStatementIdsQuery(undefined);
  const statements: StatementIdWithBank[] = Array.isArray(data) ? data : [];
  const selectedBankName = statements.find(s => s.id === selectedId)?.bankName ?? "Unknown bank";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes mlFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes mlBounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }
        @keyframes mlSpin   { to { transform:rotate(360deg); } }
        @keyframes mlPulse  { 0%,100% { box-shadow:0 8px 32px rgba(79,110,247,0.35); } 50% { box-shadow:0 8px 48px rgba(79,110,247,0.55); } }
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px;}
      `}</style>
      <div style={{ display: "flex", height: "100%", overflow: "hidden", fontFamily: "'DM Sans',sans-serif", background: "#f8fafc" }}>
        {!selectedId ? (
          <StatementPicker onSelect={id => setSelectedId(id)} />
        ) : (
          <ChatUI statementId={selectedId} selectedBankName={selectedBankName} onSwitchStatement={() => setSelectedId(null)} />
        )}
      </div>
    </>
  );
}
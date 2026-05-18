"use client";

import { useState } from "react";
import {
  useGetGoalsQuery,
  useGetPlansQuery,
  useCheckInMutation,
  useAbandonPlanMutation,
  useCancelGoalMutation,
  useUpdateSavedMutation,
  useCreateGoalMutation,
} from "../redux/api/goalsApi";
import type { GoalDto, GoalPlanDto } from "../redux/api/goalsApi";
import PageLayout from "@/app/components/PageLayout";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined) =>
  n != null
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
    : "—";

const fmtShort = (n: number | null | undefined) =>
  n != null ? `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}` : "—";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  ACTIVE:    { label: "Active",     dot: "#22c55e", bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  COMPLETED: { label: "Completed",  dot: "#3b82f6", bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
  CANCELLED: { label: "Cancelled",  dot: "#9ca3af", bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" },
  ABANDONED: { label: "Abandoned",  dot: "#ef4444", bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
};

// ── Create Goal Modal ─────────────────────────────────────────────────────────

function CreateGoalModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [createGoal, { isLoading }] = useCreateGoalMutation();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("Goal name is required."); return; }
    try {
      await createGoal({
        name: name.trim(),
        targetAmount: amount ? Number(amount) : null,
        currentSaved: saved ? Number(saved) : null,
        targetDate: date || null,
      }).unwrap();
      onCreated();
      onClose();
    } catch {
      setError("Failed to create goal. Please try again.");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(15,10,40,0.55)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
      animation: "fadeIn 0.18s ease both",
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .gl-input { width:100%; padding:10px 13px; border:1.5px solid #e5e7eb; border-radius:12px;
          font-size:13px; background:#fafafa; color:#111; outline:none; box-sizing:border-box;
          transition:border-color 0.15s; font-family:inherit; }
        .gl-input:focus { border-color:#7c3aed; background:#fff; }
        .gl-input::placeholder { color:#c4b5fd; }
      `}</style>
      <div style={{
        background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420,
        boxShadow: "0 24px 80px rgba(124,58,237,0.18)",
        animation: "slideUp 0.22s cubic-bezier(.22,1,.36,1) both",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
          padding: "22px 24px 18px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "#ddd6fe", textTransform: "uppercase" }}>New goal</p>
              <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "#fff" }}>What are you saving for?</h2>
            </div>
            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "22px 24px 24px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Goal name *</label>
            <input className="gl-input" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. iPhone 16, Trip to Goa, MacBook Pro" autoFocus />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Target amount (₹)</label>
              <input className="gl-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 80000" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Already saved (₹)</label>
              <input className="gl-input" type="number" value={saved} onChange={e => setSaved(e.target.value)} placeholder="e.g. 5000" />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Target date</label>
            <input className="gl-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {error && (
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 10, border: "1px solid #fecaca" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: "11px", border: "1.5px solid #e5e7eb", borderRadius: 14, fontSize: 13, fontWeight: 700, background: "#fff", color: "#6b7280", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={isLoading || !name.trim()}
              style={{
                flex: 2, padding: "11px",
                background: name.trim() ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#e5e7eb",
                color: name.trim() ? "#fff" : "#9ca3af",
                border: "none", borderRadius: 14,
                fontSize: 13, fontWeight: 800, cursor: name.trim() ? "pointer" : "default",
                boxShadow: name.trim() ? "0 4px 14px rgba(124,58,237,0.35)" : "none",
                transition: "all 0.15s",
              }}>
              {isLoading ? "Creating…" : "Create goal ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Check-in Modal ────────────────────────────────────────────────────────────

function CheckInModal({ taskId, planId, weekNumber, savingTarget, onClose, onDone }: {
  taskId: string; planId: string; weekNumber: number;
  savingTarget: number | null; onClose: () => void; onDone: () => void;
}) {
  const [checkIn, { isLoading }] = useCheckInMutation();
  const [amount, setAmount] = useState(savingTarget?.toString() ?? "");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"DONE" | "SKIPPED">("DONE");

  const handleSubmit = async () => {
    try {
      await checkIn({ planId, taskId, savedAmount: amount ? Number(amount) : null, note, status }).unwrap();
      onDone();
    } catch { /* ignore */ }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(15,10,40,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{`
        .ci-input { width:100%; padding:10px 13px; border:1.5px solid #e5e7eb; border-radius:12px;
          font-size:13px; background:#fafafa; color:#111; outline:none; box-sizing:border-box;
          transition:border-color 0.15s; font-family:inherit; }
        .ci-input:focus { border-color:#7c3aed; background:#fff; }
      `}</style>
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 380, boxShadow: "0 24px 80px rgba(0,0,0,0.15)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase" }}>Check in</p>
            <h3 style={{ margin: "3px 0 0", fontSize: 18, fontWeight: 800, color: "#1e1b4b" }}>Period {weekNumber}</h3>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div style={{ padding: "16px 22px 22px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(["DONE", "SKIPPED"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} style={{
                flex: 1, padding: "10px",
                borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${status === s ? (s === "DONE" ? "#22c55e" : "#f59e0b") : "#e5e7eb"}`,
                background: status === s ? (s === "DONE" ? "#f0fdf4" : "#fffbeb") : "#fff",
                color: status === s ? (s === "DONE" ? "#166534" : "#92400e") : "#6b7280",
                transition: "all 0.15s",
              }}>
                {s === "DONE" ? "✓ Completed" : "↷ Skipped"}
              </button>
            ))}
          </div>

          {status === "DONE" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount saved (₹)</label>
              <input className="ci-input" type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={savingTarget ? `Target: ${fmtShort(savingTarget)}` : "Enter amount"} />
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Note (optional)</label>
            <textarea className="ci-input" style={{ resize: "none", height: 72 }} value={note} onChange={e => setNote(e.target.value)} placeholder="What worked? What didn't?" />
          </div>

          <button onClick={handleSubmit} disabled={isLoading} style={{
            width: "100%", padding: "12px",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 13, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
            opacity: isLoading ? 0.7 : 1,
          }}>
            {isLoading ? "Saving…" : "Save check-in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, onRefresh }: { plan: GoalPlanDto; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [checkingIn, setCheckingIn] = useState<{ taskId: string; weekNumber: number; savingTarget: number | null } | null>(null);
  const [abandonPlan] = useAbandonPlanMutation();
  const pct = plan.progressPct ?? 0;

  const donePeriods = plan.weeks?.filter(w => w.checkinStatus === "DONE").length ?? 0;
  const pendingPeriods = plan.weeks?.filter(w => w.checkinStatus === "PENDING").length ?? 0;

  return (
    <div style={{ background: "#fafafa", border: "1px solid #f0e6ff", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 9px",
              background: STATUS_CONFIG[plan.status]?.bg ?? "#f9fafb",
              color: STATUS_CONFIG[plan.status]?.text ?? "#6b7280",
              border: `1px solid ${STATUS_CONFIG[plan.status]?.border ?? "#e5e7eb"}`,
              borderRadius: 999, letterSpacing: "0.05em",
            }}>
              {STATUS_CONFIG[plan.status]?.label ?? plan.status}
            </span>
            {plan.weeklySavingTarget && (
              <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginLeft: 8 }}>
                {fmtShort(Number(plan.weeklySavingTarget))}/period
              </span>
            )}
          </div>
          {plan.status === "ACTIVE" && (
            <button onClick={async () => {
              if (!confirm("Abandon this plan?")) return;
              await abandonPlan(plan.id).unwrap();
              onRefresh();
            }} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}>
              Abandon
            </button>
          )}
        </div>

        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#4b5563", lineHeight: 1.6 }}>{plan.summary}</p>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, height: 8, background: "#ede9fe", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #7c3aed, #22c55e)", borderRadius: 999, width: `${pct}%`, transition: "width 0.7s ease" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", minWidth: 30 }}>{pct}%</span>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 10, color: "#a78bfa" }}>{donePeriods} of {plan.totalWeeks} periods complete</p>
      </div>

      <button onClick={() => setExpanded(e => !e)} style={{
        width: "100%", padding: "10px 16px",
        background: "none", border: "none", borderTop: "1px solid #f0e6ff",
        fontSize: 11, fontWeight: 700, color: "#7c3aed", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>{expanded ? "▲ Hide periods" : `▼ All ${plan.totalWeeks} periods`}</span>
        {plan.status === "ACTIVE" && <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 600 }}>{pendingPeriods} pending</span>}
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid #f0e6ff" }}>
          {plan.weeks?.map(w => {
            const isDone = w.checkinStatus === "DONE";
            const isSkipped = w.checkinStatus === "SKIPPED";
            const isCurrent = w.isCurrent;
            const isPending = w.checkinStatus === "PENDING";

            return (
              <div key={w.id} style={{
                padding: "12px 16px",
                borderBottom: "1px solid #f5f3ff",
                background: isCurrent ? "#faf5ff" : "#fff",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800,
                      background: isDone ? "#f0fdf4" : isSkipped ? "#fffbeb" : isCurrent ? "#ede9fe" : "#f9fafb",
                      color: isDone ? "#16a34a" : isSkipped ? "#d97706" : isCurrent ? "#7c3aed" : "#9ca3af",
                      border: isCurrent ? "2px solid #c4b5fd" : "none",
                    }}>
                      {isDone ? "✓" : isSkipped ? "↷" : w.weekNumber}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? "#7c3aed" : "#374151" }}>
                          Period {w.weekNumber}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", background: "#ede9fe", color: "#7c3aed", borderRadius: 999 }}>CURRENT</span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 10, color: "#9ca3af" }}>
                        {w.weekStart} – {w.weekEnd}
                        {w.savingTarget && <span style={{ marginLeft: 6, color: "#7c3aed", fontWeight: 700 }}>{fmtShort(Number(w.savingTarget))}</span>}
                      </p>
                    </div>
                  </div>

                  {isPending && plan.status === "ACTIVE" && (
                    <button onClick={() => setCheckingIn({ taskId: w.id, weekNumber: w.weekNumber, savingTarget: w.savingTarget ? Number(w.savingTarget) : null })}
                      style={{ padding: "5px 12px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                      Check in
                    </button>
                  )}
                  {isDone && w.savedAmount != null && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#22c55e", flexShrink: 0 }}>Saved {fmtShort(Number(w.savedAmount))}</span>
                  )}
                </div>

                {w.actions && w.actions.length > 0 && (
                  <div style={{ marginTop: 8, marginLeft: 38 }}>
                    {w.actions.slice(0, 3).map((a, i) => (
                      <p key={i} style={{ margin: "2px 0", fontSize: 11, color: isDone || isSkipped ? "#d1d5db" : "#4b5563", textDecoration: isDone || isSkipped ? "line-through" : "none" }}>• {a}</p>
                    ))}
                    {w.tip && <p style={{ margin: "6px 0 0", fontSize: 10, color: "#c4b5fd", fontStyle: "italic" }}>💡 {w.tip}</p>}
                  </div>
                )}
                {w.checkinNote && (
                  <p style={{ margin: "6px 0 0 38px", fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>"{w.checkinNote}"</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {checkingIn && (
        <CheckInModal
          taskId={checkingIn.taskId}
          planId={plan.id}
          weekNumber={checkingIn.weekNumber}
          savingTarget={checkingIn.savingTarget}
          onClose={() => setCheckingIn(null)}
          onDone={() => { setCheckingIn(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────

const GOAL_EMOJIS: Record<string, string> = {
  iphone: "📱", phone: "📱", mobile: "📱",
  laptop: "💻", macbook: "💻", computer: "💻",
  trip: "✈️", travel: "✈️", goa: "✈️", vacation: "✈️",
  car: "🚗", bike: "🏍️",
  wedding: "💍",
  education: "🎓", mba: "🎓", course: "🎓",
  house: "🏠", home: "🏠", rent: "🏠",
  emergency: "🛡️",
};

function goalEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(GOAL_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "🎯";
}

function GoalCard({ goal, plans, onRefresh }: { goal: GoalDto; plans: GoalPlanDto[]; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelGoal] = useCancelGoalMutation();
  const [updateSaved] = useUpdateSavedMutation();
  const [editingSaved, setEditingSaved] = useState(false);
  const [savedInput, setSavedInput] = useState("");

  const goalPlans = plans.filter(p => p.goalId === goal.id);
  const activePlan = goalPlans.find(p => p.status === "ACTIVE");
  const pct = Math.min(100, goal.progressPercent ?? 0);
  const cfg = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.ACTIVE;
  const emoji = goalEmoji(goal.name);

  const barColor = pct >= 100 ? "#22c55e" : pct >= 60 ? "#7c3aed" : "#a78bfa";

  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #f0e6ff",
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: "0 2px 20px rgba(124,58,237,0.06)",
      transition: "box-shadow 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(124,58,237,0.13)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 20px rgba(124,58,237,0.06)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Goal header */}
      <div style={{ padding: "20px 22px 16px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* Emoji circle */}
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, border: "1.5px solid #e9d5ff",
          }}>
            {emoji}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {goal.name}
              </h3>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 9px",
                background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
                borderRadius: 999,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block", marginRight: 4, verticalAlign: "middle" }} />
                {cfg.label}
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              {goal.targetAmount != null && (
                <span style={{ fontSize: 14, fontWeight: 800, color: "#7c3aed" }}>{fmt(Number(goal.targetAmount))}</span>
              )}
              {goal.targetDate && (
                <span style={{ fontSize: 12, color: "#9ca3af" }}>by {goal.targetDate}
                  {goal.monthsLeft > 0 && <span style={{ color: "#d8b4fe", marginLeft: 4 }}>({goal.monthsLeft}mo left)</span>}
                </span>
              )}
              {goal.monthlyContribution != null && (
                <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, background: "#f5f3ff", padding: "2px 8px", borderRadius: 999 }}>
                  {fmtShort(Number(goal.monthlyContribution))}/mo needed
                </span>
              )}
            </div>
          </div>

          {goal.status === "ACTIVE" && (
            <button onClick={async () => { if (!confirm("Cancel this goal?")) return; await cancelGoal(goal.id).unwrap(); onRefresh(); }}
              style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600, flexShrink: 0, padding: 0 }}>
              Cancel
            </button>
          )}
        </div>

        {/* Progress section */}
        {goal.targetAmount != null && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 10, background: "#f0e7ff", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", background: barColor, borderRadius: 999, width: `${pct}%`, transition: "width 0.8s ease" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: barColor, minWidth: 36 }}>{Math.round(pct)}%</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                <span style={{ color: "#7c3aed", fontWeight: 700 }}>{fmtShort(Number(goal.currentSaved ?? 0))}</span>
                {goal.targetAmount != null && <span> of {fmtShort(Number(goal.targetAmount))}</span>}
              </p>
              {goal.status === "ACTIVE" && (
                <button onClick={() => setEditingSaved(e => !e)}
                  style={{ fontSize: 11, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: 0 }}>
                  + Update saved
                </button>
              )}
            </div>

            {editingSaved && (
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <input type="number" value={savedInput} onChange={e => setSavedInput(e.target.value)}
                  placeholder="New amount saved (₹)" autoFocus
                  style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #c4b5fd", borderRadius: 10, fontSize: 13, background: "#faf5ff", outline: "none", color: "#1e1b4b" }} />
                <button onClick={async () => {
                  if (!savedInput) return;
                  await updateSaved({ goalId: goal.id, currentSaved: Number(savedInput) }).unwrap();
                  setEditingSaved(false); setSavedInput(""); onRefresh();
                }} style={{ padding: "8px 14px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Save
                </button>
                <button onClick={() => setEditingSaved(false)}
                  style={{ padding: "8px 12px", background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✕</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plans section toggle */}
      {goalPlans.length > 0 && (
        <div style={{ borderTop: "1px solid #f5f3ff" }}>
          <button onClick={() => setExpanded(e => !e)} style={{
            width: "100%", padding: "11px 22px",
            background: "none", border: "none", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 12, fontWeight: 700, color: "#7c3aed",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              {goalPlans.length} savings plan{goalPlans.length > 1 ? "s" : ""}
              {activePlan && <span style={{ color: "#22c55e", fontWeight: 700 }}>· Active</span>}
            </span>
            <span style={{ fontSize: 10 }}>{expanded ? "▲" : "▼"}</span>
          </button>

          {expanded && (
            <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {goalPlans.map(plan => (
                <PlanCard key={plan.id} plan={plan} onRefresh={onRefresh} />
              ))}
            </div>
          )}
        </div>
      )}

      {goalPlans.length === 0 && goal.status === "ACTIVE" && (
        <div style={{ borderTop: "1px solid #f5f3ff", padding: "12px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#c4b5fd" }}>No savings plan yet</p>
          <a href="/#chat" style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textDecoration: "none" }}>Ask AI to create one →</a>
        </div>
      )}
    </div>
  );
}


function StatsStrip({
  goals,
  plans,
}: {
  goals: GoalDto[];
  plans: GoalPlanDto[];
}) {
  const active = goals.filter((g) => g.status === "ACTIVE").length;
  const completed = goals.filter((g) => g.status === "COMPLETED").length;
  const totalSaved = goals.reduce(
    (sum, g) => sum + Number(g.currentSaved ?? 0),
    0
  );
  const activePlans = plans.filter((p) => p.status === "ACTIVE").length;

  const stats = [
    {
      label: "Active Goals",
      value: active,
      color: "#7c3aed",
      bg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    },
    {
      label: "Completed",
      value: completed,
      color: "#22c55e",
      bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    },
    {
      label: "Total Saved",
      value: fmtShort(totalSaved),
      color: "#3b82f6",
      bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    },
    {
      label: "Active Plans",
      value: activePlans,
      color: "#f59e0b",
      bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            position: "relative",
            overflow: "hidden",
            background: s.bg,
            borderRadius: 24,
            padding: "20px 18px",
            border: `1px solid ${s.color}20`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            transition: "all 0.25s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow =
              "0 18px 40px rgba(0,0,0,0.10)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(0,0,0,0.05)";
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: `${s.color}18`,
              top: -30,
              right: -25,
            }}
          />

          {/* Top Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
              position: "relative",
              zIndex: 2,
            }}
          >
            

            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: s.color,
                boxShadow: `0 0 12px ${s.color}`,
              }}
            />
          </div>

          {/* Value */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <p
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                color: "#111827",
                letterSpacing: "-1px",
              }}
            >
              {s.value}
            </p>

            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: "#6b7280",
                fontWeight: 600,
                letterSpacing: "0.2px",
              }}
            >
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Filter Tabs ───────────────────────────────────────────────────────────────

type Filter = "ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED";

function FilterTabs({ active, onChange, counts }: { active: Filter; onChange: (f: Filter) => void; counts: Record<string, number> }) {
  const tabs: { key: Filter; label: string }[] = [
    { key: "ACTIVE", label: "Active" },
    { key: "ALL", label: "All" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "#f5f3ff", padding: 5, borderRadius: 14, width: "fit-content" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding: "7px 16px",
          borderRadius: 10, border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 700,
          background: active === t.key ? "#7c3aed" : "none",
          color: active === t.key ? "#fff" : "#7c3aed",
          transition: "all 0.15s",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {t.label}
          {counts[t.key] > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 800, minWidth: 18, height: 18,
              background: active === t.key ? "rgba(255,255,255,0.25)" : "#e9d5ff",
              color: active === t.key ? "#fff" : "#7c3aed",
              borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "0 5px",
            }}>
              {counts[t.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onCreateGoal }: { onCreateGoal: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{
        width: 72, height: 72, borderRadius: 24,
        background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px", fontSize: 36, border: "1.5px solid #c4b5fd",
      }}>
        🎯
      </div>
      <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#1e1b4b" }}>No goals yet</h2>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "#9ca3af", maxWidth: 300, marginInline: "auto", lineHeight: 1.6 }}>
        Create your first goal below, or ask MoneyLens AI — "I want to save for an iPhone".
      </p>
      <button onClick={onCreateGoal} style={{
        padding: "12px 28px",
        background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
        color: "#fff", border: "none", borderRadius: 14,
        fontSize: 14, fontWeight: 800, cursor: "pointer",
        boxShadow: "0 4px 18px rgba(124,58,237,0.3)",
        display: "inline-flex", alignItems: "center", gap: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        Create first goal
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const [filter, setFilter] = useState<Filter>("ACTIVE");
  const [showCreate, setShowCreate] = useState(false);

  const { data: goals = [], refetch: refetchGoals, isLoading: goalsLoading } = useGetGoalsQuery();
  const { data: plans = [], refetch: refetchPlans, isLoading: plansLoading } = useGetPlansQuery();

  const refresh = () => { refetchGoals(); refetchPlans(); };

  const counts: Record<string, number> = {
    ALL: goals.length,
    ACTIVE: goals.filter(g => g.status === "ACTIVE").length,
    COMPLETED: goals.filter(g => g.status === "COMPLETED").length,
    CANCELLED: goals.filter(g => g.status === "CANCELLED").length,
  };

  const filtered = goals.filter(g => filter === "ALL" || g.status === filter);
  const isLoading = goalsLoading || plansLoading;

  return (
    <PageLayout>
    <div style={{background: "#fbf9ff", fontFamily: "inherit" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #f0e6ff",
        padding: "0 32px",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{  padding: "18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9ca3af", textDecoration: "none", fontWeight: 600, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#7c3aed"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9ca3af"}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Dashboard
            </a> */}
            <span style={{ color: "#e5e7eb" }}>·</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e1b4b" }}>Goals & Plans</h1>
            </div>
          </div>

          <button onClick={() => setShowCreate(true)} style={{
            padding: "9px 18px",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "#fff", border: "none", borderRadius: 12,
            fontSize: 12, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7,
            boxShadow: "0 3px 12px rgba(124,58,237,0.3)",
            transition: "box-shadow 0.15s, transform 0.15s",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 5px 18px rgba(124,58,237,0.4)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 3px 12px rgba(124,58,237,0.3)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            New goal
          </button>
        </div>
      </div>

      <div style={{ padding: "28px 32px 64px" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #ede9fe", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "#a78bfa", fontWeight: 600, fontSize: 13 }}>Loading your goals…</p>
          </div>
        ) : goals.length === 0 ? (
          <EmptyState onCreateGoal={() => setShowCreate(true)} />
        ) : (
          <>
            <StatsStrip goals={goals} plans={plans} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <FilterTabs active={filter} onChange={setFilter} counts={counts} />
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#c4b5fd", fontSize: 14, fontWeight: 600 }}>
                No {filter.toLowerCase()} goals
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filtered.map(goal => (
                  <GoalCard key={goal.id} goal={goal} plans={plans} onRefresh={refresh} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <CreateGoalModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { refresh(); setShowCreate(false); }}
        />
      )}
    </div>
    </PageLayout>
  );
}
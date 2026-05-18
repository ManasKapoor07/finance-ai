"use client";

import { useState } from "react";
import type { SuggestedGoalDto, GoalPlanDto } from "../redux/api/authApi";
import { useConfirmGoalMutation } from "../redux/api/authApi";

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontSize: 13,
  fontWeight: 500,
  color: "#1e1b4b",
  border: "1.5px solid #e9d5ff",
  borderRadius: 10,
  padding: "8px 10px",
  background: "#fff",
  outline: "none",
  transition: "border-color 0.15s",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  color: "#9ca3af",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 4,
};

const fadeUp = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  @keyframes pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:.4; transform:scale(0.75); }
  }
  @keyframes drawCheck { to { stroke-dashoffset: 0; } }
`;

// ── Animated check ────────────────────────────────────────────────────────────
function CheckCircle() {
  return (
    <svg width="40" height="40" viewBox="0 0 44 44" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r="21" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
      <path
        d="M13 22l6 6 12-12"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="24"
        strokeDashoffset="24"
        style={{ animation: "drawCheck 0.4s ease 0.1s forwards" }}
      />
    </svg>
  );
}

// ── Step 1: Edit goal details ─────────────────────────────────────────────────
function EditGoalStep({
  goal,
  onConfirm,
  onSkip,
}: {
  goal: SuggestedGoalDto;
  onConfirm: (name: string, amount: string, date: string) => void;
  onSkip: () => void;
}) {
  const [name,   setName]   = useState(goal.name ?? "");
  const [amount, setAmount] = useState(goal.targetAmount?.toString() ?? "");
  const [date,   setDate]   = useState(goal.targetDate ?? "");

  const canProceed = name.trim().length > 0;

  return (
    <div style={{ animation: "fadeSlideUp 0.28s cubic-bezier(.22,1,.36,1) both" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 14px 10px", borderBottom: "1px solid #ede9fe",
      }}>
        <span style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          color: "#7c3aed", textTransform: "uppercase",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#7c3aed", display: "inline-block",
            animation: "pulse 2s ease infinite",
          }} />
          Goal detected
        </span>
        <button
          onClick={onSkip}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#d1d5db", fontSize: 14, lineHeight: 1, padding: 2,
          }}
        >
          ✕
        </button>
      </div>

      {/* Fields */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={labelStyle}>Goal name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Gold Jewellery"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = "#a78bfa")}
            onBlur={e  => (e.currentTarget.style.borderColor = "#e9d5ff")}
          />
        </div>

        <div>
          <label style={labelStyle}>Target amount (₹)</label>
          <input
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="e.g. 40000"
            inputMode="decimal"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = "#a78bfa")}
            onBlur={e  => (e.currentTarget.style.borderColor = "#e9d5ff")}
          />
        </div>

        <div>
          <label style={labelStyle}>Target date <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = "#a78bfa")}
            onBlur={e  => (e.currentTarget.style.borderColor = "#e9d5ff")}
          />
        </div>

        <div style={{ display: "flex", gap: 7, marginTop: 2 }}>
          <button
            onClick={() => canProceed && onConfirm(name.trim(), amount, date)}
            disabled={!canProceed}
            style={{
              flex: 1, padding: "9px 0",
              background: canProceed
                ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#e5e7eb",
              color: canProceed ? "#fff" : "#9ca3af",
              border: "none", borderRadius: 12,
              fontSize: 12, fontWeight: 700,
              cursor: canProceed ? "pointer" : "default",
              boxShadow: canProceed ? "0 2px 8px rgba(124,58,237,0.28)" : "none",
              transition: "all 0.15s",
            }}
          >
            Next →
          </button>
          <button
            onClick={onSkip}
            style={{
              padding: "9px 14px", background: "#fff", color: "#9ca3af",
              border: "1.5px solid #e5e7eb", borderRadius: 12,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Choose plan cadence ───────────────────────────────────────────────
function ChoosePlanStep({
  goalName,
  onSelect,
  onSkipPlan,
  isLoading,
}: {
  goalName: string;
  onSelect: (freq: "weekly" | "monthly") => void;
  onSkipPlan: () => void;
  isLoading: boolean;
}) {
  const [selected, setSelected] = useState<"weekly" | "monthly" | null>(null);

  return (
    <div style={{ animation: "fadeSlideUp 0.28s cubic-bezier(.22,1,.36,1) both" }}>

      {/* Success header */}
      <div style={{
        padding: "12px 14px 10px", borderBottom: "1px solid #d1fae5",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <CheckCircle />
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#16a34a", textTransform: "uppercase" }}>
            Goal created!
          </p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#14532d" }}>
            {goalName}
          </p>
        </div>
      </div>

      <div style={{ padding: "12px 14px 14px" }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}>
          Want a savings plan to stay on track?
        </p>

        {/* Cadence cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          {(["weekly", "monthly"] as const).map(f => (
            <button
              key={f}
              onClick={() => !isLoading && setSelected(f)}
              style={{
                padding: "12px 8px", borderRadius: 14, textAlign: "center",
                border: selected === f ? "2px solid #7c3aed" : "1.5px solid #e5e7eb",
                background: selected === f ? "#f5f3ff" : "#fff",
                cursor: isLoading ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>
                {f === "weekly" ? "📅" : "🗓️"}
              </div>
              <p style={{
                margin: 0, fontSize: 12, fontWeight: 700,
                color: selected === f ? "#6d28d9" : "#374151",
              }}>
                {f === "weekly" ? "Weekly" : "Monthly"}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af" }}>
                {f === "weekly" ? "Week-by-week actions" : "Monthly milestones"}
              </p>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 7 }}>
          <button
            onClick={() => selected && !isLoading && onSelect(selected)}
            disabled={!selected || isLoading}
            style={{
              flex: 1, padding: "9px 0",
              background: selected
                ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#e5e7eb",
              color: selected ? "#fff" : "#9ca3af",
              border: "none", borderRadius: 12,
              fontSize: 12, fontWeight: 700,
              cursor: selected && !isLoading ? "pointer" : "default",
              boxShadow: selected ? "0 2px 8px rgba(124,58,237,0.25)" : "none",
              transition: "all 0.15s",
            }}
          >
            {isLoading
              ? "Creating goal…"
              : selected
              ? `Build ${selected} plan →`
              : "Select a cadence"}
          </button>
          <button
            onClick={onSkipPlan}
            disabled={isLoading}
            style={{
              padding: "9px 14px", background: "#fff", color: "#9ca3af",
              border: "1.5px solid #e5e7eb", borderRadius: 12,
              fontSize: 12, fontWeight: 600,
              cursor: isLoading ? "default" : "pointer",
            }}
          >
            No plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Done (goal created, plan being built via chat) ────────────────────
function DoneStep({ goalName }: { goalName: string }) {
  return (
    <div style={{
      animation: "fadeSlideUp 0.28s cubic-bezier(.22,1,.36,1) both",
      padding: "14px 14px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <CheckCircle />
      <div>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#16a34a", textTransform: "uppercase" }}>
          All set!
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: "#14532d" }}>
          {goalName}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#6b7280" }}>
          Building your plan now…
        </p>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function GoalDetectedCard({
  goal,
  chatId,
  onConfirmed,
}: {
  goal: SuggestedGoalDto;
  chatId: string;
  onConfirmed: (
    plan: GoalPlanDto | null,
    reply: string,
    frequency: "weekly" | "monthly" | null
  ) => void;
}) {
  const [confirmGoal, { isLoading }] = useConfirmGoalMutation();

  type Step = "edit" | "choose-plan" | "done";
  const [step,         setStep]        = useState<Step>("edit");
  const [editedName,   setEditedName]  = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [editedDate,   setEditedDate]  = useState("");
  const [dismissed,    setDismissed]   = useState(false);

  if (dismissed) return null;

  // Step 1 → Step 2
  const handleEditConfirm = (name: string, amount: string, date: string) => {
    setEditedName(name);
    setEditedAmount(amount);
    setEditedDate(date);
    setStep("choose-plan");
  };

  // Step 2: user chose frequency — call confirm-goal, then let chat handle plan creation
  const handleSelectPlan = async (freq: "weekly" | "monthly") => {
    try {
      const res = await confirmGoal({
        chatId,
        body: {
          name:         editedName,
          targetAmount: editedAmount ? parseFloat(editedAmount) : null,
          currentSaved: goal.currentSaved ?? null,
          targetDate:   editedDate || null,
        },
      }).unwrap();

      setStep("done");
      // Pass frequency up — FloatingChat will send it as a chat message
      // which triggers the P2 state machine → chunked plan generation
      onConfirmed(null, res.reply, freq);
    } catch {
      /* silent */
    }
  };

  // Step 2: user skipped plan — create goal only
  const handleSkipPlan = async () => {
    try {
      const res = await confirmGoal({
        chatId,
        body: {
          name:         editedName,
          targetAmount: editedAmount ? parseFloat(editedAmount) : null,
          currentSaved: goal.currentSaved ?? null,
          targetDate:   editedDate || null,
        },
      }).unwrap();
      onConfirmed(null, res.reply, null);
      setDismissed(true);
    } catch {
      /* silent */
    }
  };

  return (
    <>
      <style>{fadeUp}</style>
      <div style={{
        marginTop: 10,
        width: 290,
        background: step === "done" ? "#f0fdf4" : "#faf5ff",
        border: `1.5px solid ${step === "done" ? "#bbf7d0" : "#e9d5ff"}`,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 2px 16px rgba(124,58,237,0.09)",
      }}>
        {step === "edit" && (
          <EditGoalStep
            goal={goal}
            onConfirm={handleEditConfirm}
            onSkip={() => setDismissed(true)}
          />
        )}
        {step === "choose-plan" && (
          <ChoosePlanStep
            goalName={editedName}
            onSelect={handleSelectPlan}
            onSkipPlan={handleSkipPlan}
            isLoading={isLoading}
          />
        )}
        {step === "done" && (
          <DoneStep goalName={editedName} />
        )}
      </div>
    </>
  );
}
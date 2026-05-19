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

const fmt = (n: number | null | undefined) =>
  n != null
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
    : "—";

const fmtShort = (n: number | null | undefined) =>
  n != null ? `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}` : "—";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  ACTIVE:    { label: "Active",    dot: "#6EE7B7", bg: "rgba(110,231,183,0.15)",  text: "#6EE7B7", border: "rgba(110,231,183,0.3)" },
  COMPLETED: { label: "Completed", dot: "#22d3ee", bg: "rgba(34,211,238,0.15)",   text: "#22d3ee", border: "rgba(34,211,238,0.3)"  },
  CANCELLED: { label: "Cancelled", dot: "#9ca3af", bg: "rgba(156,163,175,0.15)",  text: "#d1d5db", border: "rgba(156,163,175,0.3)" },
  ABANDONED: { label: "Abandoned", dot: "#f87171", bg: "rgba(248,113,113,0.15)",  text: "#fca5a5", border: "rgba(248,113,113,0.3)" },
};

const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .gl-input {
    width: 100%; padding: 11px 14px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px; font-size: 14px;
    background: rgba(255,255,255,0.06); color: #fff;
    outline: none; box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
  }
  .gl-input:focus { border-color: rgba(110,231,183,0.5); background: rgba(110,231,183,0.05); }
  .gl-input::placeholder { color: rgba(255,255,255,0.3); }
`;

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
      background: "rgba(8,11,20,0.88)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, animation: "fadeIn 0.18s ease both",
    }}>
      <style>{SHARED_STYLES}</style>
      <div style={{
        background: "#0f1221",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, width: "100%", maxWidth: 440,
        animation: "slideUp 0.22s cubic-bezier(.22,1,.36,1) both",
        overflow: "hidden", position: "relative",
      }}>
        {/* Top glow */}
        <div style={{ position:"absolute", top:-60, left:"50%", transform:"translateX(-50%)", width:300, height:200,
          background:"radial-gradient(ellipse, rgba(110,231,183,0.08) 0%, transparent 70%)", pointerEvents:"none" }} />

        {/* Header */}
        <div style={{ padding: "24px 24px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <p style={{ margin:0, fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:"#6EE7B7", textTransform:"uppercase" }}>New goal</p>
              <h2 style={{ margin:"4px 0 0", fontSize:22, fontWeight:800, color:"#fff", fontFamily:"'Bricolage Grotesque', sans-serif", letterSpacing:"-0.02em" }}>What are you saving for?</h2>
            </div>
            <button onClick={onClose} style={{
              width:34, height:34, borderRadius:"50%",
              background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.6)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div style={{ height:"1px", background:"rgba(255,255,255,0.08)" }} />

        {/* Form */}
        <div style={{ padding:"20px 24px 24px" }}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:7, letterSpacing:"0.04em", textTransform:"uppercase" }}>Goal name *</label>
            <input className="gl-input" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. iPhone 16, Trip to Goa, MacBook Pro" autoFocus />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:7, letterSpacing:"0.04em", textTransform:"uppercase" }}>Target (₹)</label>
              <input className="gl-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="80000" />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:7, letterSpacing:"0.04em", textTransform:"uppercase" }}>Saved (₹)</label>
              <input className="gl-input" type="number" value={saved} onChange={e => setSaved(e.target.value)} placeholder="5000" />
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:7, letterSpacing:"0.04em", textTransform:"uppercase" }}>Target date</label>
            <input className="gl-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {error && (
            <p style={{ margin:"0 0 14px", fontSize:13, fontWeight:500, color:"#fca5a5", background:"rgba(248,113,113,0.1)", padding:"10px 14px", borderRadius:10, border:"1px solid rgba(248,113,113,0.25)" }}>{error}</p>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onClose} style={{
              flex:1, padding:"12px", border:"1px solid rgba(255,255,255,0.12)", borderRadius:14,
              fontSize:14, fontWeight:700, background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.6)",
              cursor:"pointer", fontFamily:"'DM Sans', sans-serif",
            }}>Cancel</button>
            <button onClick={handleCreate} disabled={isLoading || !name.trim()} style={{
              flex:2, padding:"12px",
              background: name.trim() ? "linear-gradient(135deg, #6EE7B7, #22d3ee)" : "rgba(255,255,255,0.06)",
              color: name.trim() ? "#080B14" : "rgba(255,255,255,0.25)",
              border:"none", borderRadius:14, fontSize:14, fontWeight:800,
              cursor: name.trim() ? "pointer" : "default",
              boxShadow: name.trim() ? "0 4px 20px rgba(110,231,183,0.3)" : "none",
              transition:"all 0.15s", fontFamily:"'DM Sans', sans-serif",
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
    } catch {}
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, background:"rgba(8,11,20,0.88)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <style>{SHARED_STYLES}</style>
      <div style={{ background:"#0f1221", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, width:"100%", maxWidth:380, overflow:"hidden" }}>
        <div style={{ padding:"20px 22px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ margin:0, fontSize:11, fontWeight:700, color:"#6EE7B7", letterSpacing:"0.12em", textTransform:"uppercase" }}>Check in</p>
            <h3 style={{ margin:"3px 0 0", fontSize:20, fontWeight:800, color:"#fff", fontFamily:"'Bricolage Grotesque', sans-serif" }}>Period {weekNumber}</h3>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.6)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ padding:"16px 22px 22px" }}>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {(["DONE","SKIPPED"] as const).map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{
                flex:1, padding:"10px", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans', sans-serif",
                border:`1px solid ${status===s ? (s==="DONE" ? "rgba(110,231,183,0.5)" : "rgba(251,191,36,0.5)") : "rgba(255,255,255,0.1)"}`,
                background: status===s ? (s==="DONE" ? "rgba(110,231,183,0.12)" : "rgba(251,191,36,0.1)") : "rgba(255,255,255,0.03)",
                color: status===s ? (s==="DONE" ? "#6EE7B7" : "#fbbf24") : "rgba(255,255,255,0.5)",
                transition:"all 0.15s",
              }}>
                {s==="DONE" ? "✓ Completed" : "↷ Skipped"}
              </button>
            ))}
          </div>
          {status==="DONE" && (
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.04em" }}>Amount saved (₹)</label>
              <input className="gl-input" type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={savingTarget ? `Target: ${fmtShort(savingTarget)}` : "Enter amount"} />
            </div>
          )}
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.04em" }}>Note (optional)</label>
            <textarea className="gl-input" style={{ resize:"none", height:72 }} value={note} onChange={e => setNote(e.target.value)} placeholder="What worked? What didn't?" />
          </div>
          <button onClick={handleSubmit} disabled={isLoading} style={{
            width:"100%", padding:"13px",
            background:"linear-gradient(135deg, #6EE7B7, #22d3ee)",
            color:"#080B14", border:"none", borderRadius:14,
            fontSize:14, fontWeight:800, cursor:"pointer",
            boxShadow:"0 4px 18px rgba(110,231,183,0.25)",
            opacity: isLoading ? 0.7 : 1, fontFamily:"'DM Sans', sans-serif",
          }}>
            {isLoading ? "Saving…" : "Save check-in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Period Row ────────────────────────────────────────────────────────────────

function PeriodRow({ w, planStatus, planId, onRefresh }: {
  w: any; planStatus: string; planId: string; onRefresh: () => void;
}) {
  const [checkingIn, setCheckingIn] = useState(false);
  const isDone = w.checkinStatus === "DONE";
  const isSkipped = w.checkinStatus === "SKIPPED";
  const isCurrent = w.isCurrent;
  const isPending = w.checkinStatus === "PENDING";

  const dotColor = isDone ? "#6EE7B7" : isSkipped ? "#fbbf24" : isCurrent ? "#6EE7B7" : "rgba(255,255,255,0.2)";
  const rowBg = isCurrent ? "rgba(110,231,183,0.05)" : "transparent";

  return (
    <>
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
        background: rowBg,
        borderRadius:12,
        transition:"background 0.15s",
      }}>
        {/* Status dot / number */}
        <div style={{
          width:32, height:32, borderRadius:"50%", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, fontWeight:800,
          background: isDone ? "rgba(110,231,183,0.15)" : isSkipped ? "rgba(251,191,36,0.12)" : isCurrent ? "rgba(110,231,183,0.1)" : "rgba(255,255,255,0.06)",
          color: dotColor,
          border: `1px solid ${isDone ? "rgba(110,231,183,0.3)" : isSkipped ? "rgba(251,191,36,0.25)" : isCurrent ? "rgba(110,231,183,0.25)" : "rgba(255,255,255,0.08)"}`,
        }}>
          {isDone ? "✓" : isSkipped ? "↷" : w.weekNumber}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:1 }}>
            <span style={{ fontSize:13, fontWeight:700, color: isCurrent ? "#fff" : isDone || isSkipped ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)" }}>
              Period {w.weekNumber}
            </span>
            {isCurrent && (
              <span style={{ fontSize:10, fontWeight:800, padding:"1px 7px", background:"rgba(110,231,183,0.15)", color:"#6EE7B7", border:"1px solid rgba(110,231,183,0.3)", borderRadius:999 }}>NOW</span>
            )}
            {w.savingTarget && (
              <span style={{ fontSize:12, fontWeight:700, color: isDone ? "rgba(110,231,183,0.5)" : "#6EE7B7", marginLeft:"auto" }}>
                {fmtShort(Number(w.savingTarget))}
              </span>
            )}
          </div>
          <p style={{ margin:0, fontSize:14, color:"rgba(255,255,255,0.35)", fontWeight:500 }}>
            {w.weekStart} – {w.weekEnd}
            {isDone && w.savedAmount != null && (
              <span style={{ color:"#6EE7B7", fontWeight:700, marginLeft:8 }}>Saved {fmtShort(Number(w.savedAmount))}</span>
            )}
          </p>
          {w.actions && w.actions.length > 0 && (
            <div style={{ marginTop:5 }}>
              {w.actions.slice(0,2).map((a: string, i: number) => (
                <p key={i} style={{ margin:"1px 0", fontSize:11, fontWeight:500, color: isDone||isSkipped ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)", textDecoration: isDone||isSkipped ? "line-through" : "none" }}>
                  • {a}
                </p>
              ))}
              {w.tip && <p style={{ margin:"4px 0 0", fontSize:11, fontWeight:500, color:"rgba(110,231,183,0.45)", fontStyle:"italic" }}>💡 {w.tip}</p>}
            </div>
          )}
          {w.checkinNote && (
            <p style={{ margin:"4px 0 0", fontSize:11, fontWeight:500, color:"rgba(255,255,255,0.35)", fontStyle:"italic" }}>"{w.checkinNote}"</p>
          )}
        </div>

        {/* Check-in button */}
        {isPending && planStatus === "ACTIVE" && (
          <button onClick={() => setCheckingIn(true)} style={{
            padding:"6px 14px", flexShrink:0,
            background:"linear-gradient(135deg, #6EE7B7, #22d3ee)",
            color:"#080B14", border:"none", borderRadius:8,
            fontSize:12, fontWeight:800, cursor:"pointer",
            fontFamily:"'DM Sans', sans-serif",
            boxShadow:"0 2px 10px rgba(110,231,183,0.2)",
          }}>
            Check in
          </button>
        )}
      </div>

      {/* Connector line between rows */}
      <div style={{ marginLeft:28, width:2, height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }} />

      {checkingIn && (
        <CheckInModal
          taskId={w.id} planId={planId}
          weekNumber={w.weekNumber}
          savingTarget={w.savingTarget ? Number(w.savingTarget) : null}
          onClose={() => setCheckingIn(false)}
          onDone={() => { setCheckingIn(false); onRefresh(); }}
        />
      )}
    </>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────

const GOAL_EMOJIS: Record<string, string> = {
  iphone:"📱", phone:"📱", mobile:"📱",
  laptop:"💻", macbook:"💻", computer:"💻",
  trip:"✈️", travel:"✈️", goa:"✈️", vacation:"✈️",
  car:"🚗", bike:"🏍️", wedding:"💍",
  education:"🎓", mba:"🎓", course:"🎓",
  house:"🏠", home:"🏠", rent:"🏠", emergency:"🛡️",
};

function goalEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(GOAL_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "🎯";
}

function GoalCard({ goal, plans, onRefresh }: { goal: GoalDto; plans: GoalPlanDto[]; onRefresh: () => void }) {
  const [cancelGoal] = useCancelGoalMutation();
  const [abandonPlan] = useAbandonPlanMutation();
  const [updateSaved] = useUpdateSavedMutation();
  const [editingSaved, setEditingSaved] = useState(false);
  const [savedInput, setSavedInput] = useState("");

  const goalPlans = plans.filter(p => p.goalId === goal.id);
  const activePlan = goalPlans.find(p => p.status === "ACTIVE");
  const displayPlan = activePlan ?? goalPlans[0];
  const pct = Math.min(100, goal.progressPercent ?? 0);
  const cfg = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.ACTIVE;
  const emoji = goalEmoji(goal.name);

  const donePeriods = displayPlan?.weeks?.filter((w: any) => w.checkinStatus === "DONE").length ?? 0;
  const totalPeriods = displayPlan?.totalWeeks ?? 0;

  return (
    <div style={{
      background:"#0f1221",
      border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:20, overflow:"hidden",
      transition:"border-color 0.2s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(110,231,183,0.2)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      {/* ── Goal Header ── */}
      <div style={{ padding:"20px 22px 18px" }}>
        <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
          {/* Emoji */}
          <div style={{
            width:50, height:50, borderRadius:14, flexShrink:0,
            background:"rgba(110,231,183,0.08)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24, border:"1px solid rgba(110,231,183,0.15)",
          }}>
            {emoji}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
              <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:"#fff", fontFamily:"'Bricolage Grotesque', sans-serif", letterSpacing:"-0.02em" }}>
                {goal.name}
              </h3>
              <span style={{
                fontSize:11, fontWeight:700, padding:"3px 10px",
                background:cfg.bg, color:cfg.text, border:`1px solid ${cfg.border}`,
                borderRadius:999,
              }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:cfg.dot, display:"inline-block", marginRight:4, verticalAlign:"middle" }}/>
                {cfg.label}
              </span>
            </div>

            <div style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"center" }}>
              {goal.targetAmount != null && (
                <span style={{ fontSize:15, fontWeight:800, color:"#6EE7B7" }}>{fmt(Number(goal.targetAmount))}</span>
              )}
              {goal.targetDate && (
                <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)", fontWeight:500 }}>
                  by {goal.targetDate}
                  {goal.monthsLeft > 0 && <span style={{ color:"rgba(110,231,183,0.6)", marginLeft:4 }}>({goal.monthsLeft}mo left)</span>}
                </span>
              )}
              {goal.monthlyContribution != null && (
                <span style={{ fontSize:12, color:"#6EE7B7", fontWeight:700, background:"rgba(110,231,183,0.08)", padding:"2px 9px", borderRadius:999, border:"1px solid rgba(110,231,183,0.2)" }}>
                  {fmtShort(Number(goal.monthlyContribution))}/mo needed
                </span>
              )}
            </div>
          </div>

          {goal.status === "ACTIVE" && (
            <button onClick={async () => { if (!confirm("Cancel this goal?")) return; await cancelGoal(goal.id).unwrap(); onRefresh(); }}
              style={{ fontSize:12, color:"#f87171", background:"none", border:"none", cursor:"pointer", fontWeight:700, padding:0, fontFamily:"'DM Sans', sans-serif" }}>
              Cancel
            </button>
          )}
        </div>

        {/* Progress bar */}
        {goal.targetAmount != null && (
          <div style={{ marginTop:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.6)" }}>
                <span style={{ color:"#fff", fontWeight:700 }}>{fmtShort(Number(goal.currentSaved ?? 0))}</span>
                {" "}of {fmtShort(Number(goal.targetAmount))} saved
              </span>
              <span style={{ fontSize:13, fontWeight:800, color:"#6EE7B7" }}>{Math.round(pct)}%</span>
            </div>
            <div style={{ height:8, background:"rgba(255,255,255,0.08)", borderRadius:999, overflow:"hidden" }}>
              <div style={{ height:"100%", background:"linear-gradient(90deg, #6EE7B7, #22d3ee)", borderRadius:999, width:`${pct}%`, transition:"width 0.8s ease" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:7 }}>
              {totalPeriods > 0 && (
                <span style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,0.4)" }}>
                  {donePeriods} of {totalPeriods} periods complete
                </span>
              )}
              {goal.status === "ACTIVE" && (
                <button onClick={() => setEditingSaved(e => !e)}
                  style={{ fontSize:12, color:"#6EE7B7", background:"none", border:"none", cursor:"pointer", fontWeight:700, padding:0, fontFamily:"'DM Sans', sans-serif", marginLeft:"auto" }}>
                  + Update saved
                </button>
              )}
            </div>

            {editingSaved && (
              <div style={{ marginTop:10, display:"flex", gap:8 }}>
                <input type="number" value={savedInput} onChange={e => setSavedInput(e.target.value)}
                  placeholder="New amount saved (₹)" autoFocus
                  style={{
                    flex:1, padding:"9px 12px",
                    border:"1px solid rgba(110,231,183,0.3)", borderRadius:10,
                    fontSize:13, fontWeight:500, background:"rgba(110,231,183,0.05)", outline:"none",
                    color:"#fff", fontFamily:"'DM Sans', sans-serif",
                  }}/>
                <button onClick={async () => {
                  if (!savedInput) return;
                  await updateSaved({ goalId: goal.id, currentSaved: Number(savedInput) }).unwrap();
                  setEditingSaved(false); setSavedInput(""); onRefresh();
                }} style={{
                  padding:"9px 14px", background:"linear-gradient(135deg, #6EE7B7, #22d3ee)",
                  color:"#080B14", border:"none", borderRadius:10,
                  fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'DM Sans', sans-serif",
                }}>Save</button>
                <button onClick={() => setEditingSaved(false)} style={{
                  padding:"9px 12px", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)",
                  border:"1px solid rgba(255,255,255,0.1)", borderRadius:10,
                  fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans', sans-serif",
                }}>✕</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Active Plan Periods (always visible, no toggle) ── */}
      {displayPlan && (
        <>
          <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", margin:"0 22px" }} />
          <div style={{ padding:"14px 12px 12px" }}>
            {/* Plan meta row */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, padding:"0 6px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{
                  fontSize:11, fontWeight:700, padding:"3px 9px",
                  background:STATUS_CONFIG[displayPlan.status]?.bg ?? "rgba(156,163,175,0.15)",
                  color:STATUS_CONFIG[displayPlan.status]?.text ?? "#d1d5db",
                  border:`1px solid ${STATUS_CONFIG[displayPlan.status]?.border ?? "rgba(156,163,175,0.3)"}`,
                  borderRadius:999,
                }}>
                  {STATUS_CONFIG[displayPlan.status]?.label ?? displayPlan.status}
                </span>
                {displayPlan.weeklySavingTarget && (
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontWeight:600 }}>
                    {fmtShort(Number(displayPlan.weeklySavingTarget))}<span style={{ color:"rgba(255,255,255,0.35)" }}>/period</span>
                  </span>
                )}
              </div>
              {displayPlan.status === "ACTIVE" && (
                <button onClick={async () => {
                  if (!confirm("Abandon this plan?")) return;
                  await abandonPlan(displayPlan.id).unwrap();
                  onRefresh();
                }} style={{ fontSize:12, color:"#f87171", background:"none", border:"none", cursor:"pointer", fontWeight:700, fontFamily:"'DM Sans', sans-serif" }}>
                  {/* Abandon plan */}
                </button>
              )}
            </div>

            {displayPlan.summary && (
              <p style={{ margin:"0 6px 12px", fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.5)", lineHeight:1.5 }}>{displayPlan.summary}</p>
            )}

            <div style={{ maxHeight:400, overflowY:"auto", paddingRight:2 }}>
              {displayPlan.weeks?.map((w: any) => (
                <PeriodRow
                  key={w.id} w={w}
                  planStatus={displayPlan.status}
                  planId={displayPlan.id}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {!displayPlan && goal.status === "ACTIVE" && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"13px 22px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ margin:0, fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.35)" }}>No savings plan yet</p>
          {/* <a href="/#chat" style={{ fontSize:13, fontWeight:700, color:"#6EE7B7", textDecoration:"none" }}>Ask AI to create one →</a> */}
        </div>
      )}
    </div>
  );
}

// ── Stats Strip ───────────────────────────────────────────────────────────────

function StatsStrip({ goals, plans }: { goals: GoalDto[]; plans: GoalPlanDto[] }) {
  const active    = goals.filter(g => g.status === "ACTIVE").length;
  const completed = goals.filter(g => g.status === "COMPLETED").length;
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentSaved ?? 0), 0);
  const activePlans = plans.filter(p => p.status === "ACTIVE").length;

  const stats = [
    { label:"Active Goals",  value: String(active),           color:"#6EE7B7", border:"rgba(110,231,183,0.2)" },
    { label:"Completed",     value: String(completed),        color:"#22d3ee", border:"rgba(34,211,238,0.2)"  },
    { label:"Total Saved",   value: fmtShort(totalSaved),     color:"#a78bfa", border:"rgba(167,139,250,0.2)" },
    { label:"Active Plans",  value: String(activePlans),      color:"#fbbf24", border:"rgba(251,191,36,0.2)"  },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:12, marginBottom:28 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background:"#0f1221", border:`1px solid ${s.border}`,
          borderRadius:18, padding:"18px 16px", position:"relative", overflow:"hidden",
          transition:"border-color 0.2s",
          cursor:"default",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color + "50"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = s.border; }}
        >
          <div style={{ position:"absolute", width:70, height:70, borderRadius:"50%", background:`${s.color}10`, top:-25, right:-15, pointerEvents:"none" }}/>
          <div style={{ width:8, height:8, borderRadius:"50%", background:s.color, marginBottom:14, boxShadow:`0 0 10px ${s.color}` }}/>
          <p style={{ margin:0, fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"-0.5px", fontFamily:"'Bricolage Grotesque', sans-serif" }}>
            {s.value}
          </p>
          <p style={{ margin:"5px 0 0", fontSize:13, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Filter Tabs ───────────────────────────────────────────────────────────────

type Filter = "ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED";

function FilterTabs({ active, onChange, counts }: { active: Filter; onChange: (f: Filter) => void; counts: Record<string, number> }) {
  const tabs: { key: Filter; label: string }[] = [
    { key:"ACTIVE",    label:"Active"    },
    { key:"ALL",       label:"All"       },
    { key:"COMPLETED", label:"Completed" },
    { key:"CANCELLED", label:"Cancelled" },
  ];
  return (
    <div style={{ display:"flex", gap:4, marginBottom:20, background:"rgba(255,255,255,0.04)", padding:4, borderRadius:14, width:"fit-content", border:"1px solid rgba(255,255,255,0.08)" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding:"8px 16px", borderRadius:10, border:"none", cursor:"pointer",
          fontSize:13, fontWeight:700,
          background: active===t.key ? "linear-gradient(135deg, #6EE7B7, #22d3ee)" : "none",
          color: active===t.key ? "#080B14" : "rgba(255,255,255,0.5)",
          transition:"all 0.15s", display:"flex", alignItems:"center", gap:6,
          fontFamily:"'DM Sans', sans-serif",
        }}>
          {t.label}
          {counts[t.key] > 0 && (
            <span style={{
              fontSize:11, fontWeight:800, minWidth:18, height:18,
              background: active===t.key ? "rgba(8,11,20,0.2)" : "rgba(255,255,255,0.08)",
              color: active===t.key ? "#080B14" : "rgba(255,255,255,0.45)",
              borderRadius:999, display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0 5px",
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
    <div style={{ textAlign:"center", padding:"70px 24px" }}>
      <div style={{
        width:72, height:72, borderRadius:22,
        background:"rgba(110,231,183,0.08)",
        display:"flex", alignItems:"center", justifyContent:"center",
        margin:"0 auto 20px", fontSize:36,
        border:"1px solid rgba(110,231,183,0.2)",
      }}>🎯</div>
      <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:800, color:"#fff", fontFamily:"'Bricolage Grotesque', sans-serif" }}>No goals yet</h2>
      <p style={{ margin:"0 0 24px", fontSize:14, fontWeight:500, color:"rgba(255,255,255,0.45)", maxWidth:300, marginInline:"auto", lineHeight:1.65 }}>
        Create your first goal, or ask MoneyLens AI — "I want to save for an iPhone".
      </p>
      <button onClick={onCreateGoal} style={{
        padding:"13px 28px",
        background:"linear-gradient(135deg, #6EE7B7, #22d3ee)",
        color:"#080B14", border:"none", borderRadius:14,
        fontSize:14, fontWeight:800, cursor:"pointer",
        boxShadow:"0 4px 20px rgba(110,231,183,0.25)",
        display:"inline-flex", alignItems:"center", gap:8,
        fontFamily:"'DM Sans', sans-serif",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
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
    ALL:       goals.length,
    ACTIVE:    goals.filter(g => g.status === "ACTIVE").length,
    COMPLETED: goals.filter(g => g.status === "COMPLETED").length,
    CANCELLED: goals.filter(g => g.status === "CANCELLED").length,
  };

  const filtered = goals.filter(g => filter === "ALL" || g.status === filter);
  const isLoading = goalsLoading || plansLoading;

  return (
    <PageLayout>
      <div style={{ background:"#080B14", fontFamily:"'DM Sans', sans-serif", minHeight:"100vh", position:"relative", overflow:"hidden" }}>
        <style>{`
          ${SHARED_STYLES}
          .gl-grid-bg {
            position:absolute; inset:0;
            background-image:
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
            background-size:60px 60px;
            pointer-events:none; z-index:0;
          }
          .gl-glow-top {
            position:absolute; top:-140px; left:50%; transform:translateX(-50%);
            width:700px; height:500px;
            background:radial-gradient(ellipse, rgba(110,231,183,0.07) 0%, rgba(34,211,238,0.04) 40%, transparent 70%);
            pointer-events:none; border-radius:50%; z-index:0;
          }
          .gl-glow-bottom {
            position:absolute; bottom:-100px; left:10%;
            width:400px; height:400px;
            background:radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%);
            pointer-events:none; border-radius:50%; z-index:0;
          }
          ::-webkit-scrollbar { width:4px; }
          ::-webkit-scrollbar-track { background:transparent; }
          ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
        `}</style>

        <div className="gl-grid-bg"/>
        <div className="gl-glow-top"/>
        <div className="gl-glow-bottom"/>

        {/* Header */}
        <div style={{
          background:"rgba(8,11,20,0.85)",
          borderBottom:"1px solid rgba(255,255,255,0.07)",
          padding:"0 32px", position:"sticky", top:0, zIndex:20,
          backdropFilter:"blur(20px)",
        }}>
          <div style={{ padding:"18px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#fff", fontFamily:"'Bricolage Grotesque', sans-serif", letterSpacing:"-0.03em" }}>
              Goals & Plans
            </h1>
            <button onClick={() => setShowCreate(true)} style={{
              padding:"10px 20px",
              background:"linear-gradient(135deg, #6EE7B7, #22d3ee)",
              color:"#080B14", border:"none", borderRadius:12,
              fontSize:13, fontWeight:800, cursor:"pointer",
              display:"flex", alignItems:"center", gap:7,
              boxShadow:"0 4px 16px rgba(110,231,183,0.25)",
              transition:"opacity 0.15s, transform 0.15s",
              fontFamily:"'DM Sans', sans-serif",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              New goal
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:"28px 32px 64px", position:"relative", zIndex:1 }}>
          {isLoading ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 0", gap:14 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid rgba(110,231,183,0.15)", borderTopColor:"#6EE7B7", animation:"spin 0.8s linear infinite" }}/>
              <p style={{ color:"rgba(110,231,183,0.6)", fontWeight:600, fontSize:14 }}>Loading your goals…</p>
            </div>
          ) : goals.length === 0 ? (
            <EmptyState onCreateGoal={() => setShowCreate(true)} />
          ) : (
            <>
              <StatsStrip goals={goals} plans={plans} />
              <FilterTabs active={filter} onChange={setFilter} counts={counts} />
              {filtered.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 0", color:"rgba(255,255,255,0.3)", fontSize:14, fontWeight:600 }}>
                  No {filter.toLowerCase()} goals
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
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
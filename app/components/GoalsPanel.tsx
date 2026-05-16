"use client";

import { useState } from "react";
import {
  Target, Plus, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, Clock, TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoalDto {
  id: string;
  name: string;
  targetAmount: number | null;
  currentSaved: number;
  monthlyContribution: number | null;
  targetDate: string | null;
  monthsLeft: number;
  progressPercent: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  source: "MANUAL" | "AI_EXTRACTED";
  createdAt: string;
}

interface GoalsPanelProps {
  goals: GoalDto[];
  onAdd: (goal: {
    name: string;
    targetAmount: number | null;
    currentSaved: number;
    targetDate: string | null;
    statementId?: string;
  }) => Promise<void>;
  onUpdateSaved: (goalId: string, currentSaved: number) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
  statementId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null) {
  if (n == null) return "—";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

// ─── Single goal card ─────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onUpdateSaved,
  onDelete,
}: {
  goal: GoalDto;
  onUpdateSaved: (id: string, saved: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing]   = useState(false);
  const [savedVal, setSavedVal] = useState(String(goal.currentSaved));
  const [loading, setLoading]   = useState(false);

  const progress = Math.min(100, goal.progressPercent);
  const done     = goal.status === "COMPLETED";

  const handleSave = async () => {
    setLoading(true);
    await onUpdateSaved(goal.id, parseFloat(savedVal) || 0);
    setEditing(false);
    setLoading(false);
  };

  return (
    <div className={`rounded-xl border p-3 text-[12px] transition-all
      ${done ? "border-emerald-200 bg-emerald-50" : "border-stone-200 bg-white"}`}>

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {done
            ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            : <Target size={13} className="text-stone-500 shrink-0" />
          }
          <span className="font-semibold text-stone-900 truncate">{goal.name}</span>
          {goal.source === "AI_EXTRACTED" && (
            <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full shrink-0">
              AI
            </span>
          )}
        </div>
        <button
          onClick={() => onDelete(goal.id)}
          className="text-stone-300 hover:text-red-400 transition-colors shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Progress bar */}
      {goal.targetAmount != null && (
        <div className="mb-2">
          <div className="flex justify-between text-stone-400 mb-1">
            <span>{fmt(goal.currentSaved)} saved</span>
            <span>{fmt(goal.targetAmount)} goal</span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${done ? "bg-emerald-400" : "bg-stone-800"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right text-stone-400 mt-0.5">{progress.toFixed(0)}%</div>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-stone-400 mb-2">
        {goal.monthlyContribution != null && (
          <span className="flex items-center gap-1">
            <TrendingUp size={10} />
            {fmt(goal.monthlyContribution)}/mo needed
          </span>
        )}
        {goal.targetDate && (
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {goal.monthsLeft > 0 ? `${goal.monthsLeft}mo left` : "overdue"}
          </span>
        )}
      </div>

      {/* Update saved amount */}
      {!done && (
        editing ? (
          <div className="flex gap-1.5 mt-1">
            <input
              type="number"
              value={savedVal}
              onChange={e => setSavedVal(e.target.value)}
              className="flex-1 text-[12px] border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-stone-400"
              placeholder="Current saved (₹)"
            />
            <button
              onClick={handleSave}
              disabled={loading}
              className="text-[11px] bg-stone-900 text-white px-2.5 py-1 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-[11px] text-stone-400 hover:text-stone-700 px-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
          >
            Update saved amount
          </button>
        )
      )}
    </div>
  );
}

// ─── Add goal form ────────────────────────────────────────────────────────────

function AddGoalForm({
  onAdd,
  onCancel,
  statementId,
}: {
  onAdd: GoalsPanelProps["onAdd"];
  onCancel: () => void;
  statementId?: string;
}) {
  const [name, setName]               = useState("");
  const [targetAmount, setTarget]     = useState("");
  const [currentSaved, setSaved]      = useState("");
  const [targetDate, setDate]         = useState("");
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onAdd({
      name: name.trim(),
      targetAmount: targetAmount ? parseFloat(targetAmount) : null,
      currentSaved: parseFloat(currentSaved) || 0,
      targetDate: targetDate || null,
      statementId,
    });
    setLoading(false);
    onCancel();
  };

  return (
    <div className="border border-stone-200 rounded-xl p-3 bg-stone-50 flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest">New Goal</p>

      <input
        type="text"
        placeholder="Goal name (e.g. iPhone 16, Goa trip)"
        value={name}
        onChange={e => setName(e.target.value)}
        className="text-[12px] border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-stone-400 bg-white"
      />
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Target ₹"
          value={targetAmount}
          onChange={e => setTarget(e.target.value)}
          className="flex-1 text-[12px] border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-stone-400 bg-white"
        />
        <input
          type="number"
          placeholder="Saved so far ₹"
          value={currentSaved}
          onChange={e => setSaved(e.target.value)}
          className="flex-1 text-[12px] border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-stone-400 bg-white"
        />
      </div>
      <input
        type="date"
        value={targetDate}
        onChange={e => setDate(e.target.value)}
        className="text-[12px] border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-stone-400 bg-white"
      />

      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          className="flex-1 text-[12px] bg-stone-900 text-white py-1.5 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add Goal"}
        </button>
        <button
          onClick={onCancel}
          className="text-[12px] text-stone-400 hover:text-stone-700 px-3"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Goals panel ─────────────────────────────────────────────────────────────

export function GoalsPanel({
  goals,
  onAdd,
  onUpdateSaved,
  onDelete,
  statementId,
}: GoalsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding]       = useState(false);

  const active    = goals.filter(g => g.status === "ACTIVE");
  const completed = goals.filter(g => g.status === "COMPLETED");

  return (
    <div className="border border-stone-200 rounded-2xl bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-stone-50 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Target size={15} className="text-stone-700" />
          <span className="text-[13px] font-semibold text-stone-900">Financial Goals</span>
          {active.length > 0 && (
            <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded-full">
              {active.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); setAdding(true); setCollapsed(false); }}
            className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
          >
            <Plus size={12} className="text-stone-600" />
          </button>
          {collapsed
            ? <ChevronDown size={14} className="text-stone-400" />
            : <ChevronUp size={14} className="text-stone-400" />
          }
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {adding && (
            <AddGoalForm
              onAdd={onAdd}
              onCancel={() => setAdding(false)}
              statementId={statementId}
            />
          )}

          {active.length === 0 && !adding && (
            <p className="text-[12px] text-stone-400 text-center py-3">
              No active goals. Add one to get AI-powered progress tracking.
            </p>
          )}

          {active.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              onUpdateSaved={onUpdateSaved}
              onDelete={onDelete}
            />
          ))}

          {completed.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mt-1 px-1">
                Completed
              </p>
              {completed.map(g => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onUpdateSaved={onUpdateSaved}
                  onDelete={onDelete}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
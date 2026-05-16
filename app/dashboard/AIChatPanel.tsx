"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, X, Send, Bot, Loader2,
  ChevronDown, RotateCcw, ChevronLeft,
  Target, Sparkles, Check, Calendar,
  CalendarDays, TrendingUp, ListChecks,
  Zap, ChevronRight, CheckCircle2,
} from "lucide-react";
import {
  useSendChatMessageMutation,
  useConfirmGoalMutation,
  useListChatsQuery,
  type ChatMessageDto,
  type ChatListItem,
  type SuggestedGoalDto,
  type GoalPlanDto,
  type WeekTaskDto,
} from "../redux/api/authApi";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  planLimitError?: string | null;   // ← fixed
}

interface Props {
  statementId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const QUICK_PROMPTS = [
  "Why am I always broke before salary?",
  "What's my biggest money leak?",
  "How can I save more this month?",
  "Explain my risk flags",
];

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-4 py-3 bg-stone-100 border border-stone-200 rounded-2xl rounded-bl-sm w-fit">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ─── Goal Suggestion Card ─────────────────────────────────────────────────────

function GoalSuggestionCard({
  goal,
  chatId,
  onConfirmed,
  onDismiss,
}: {
  goal: SuggestedGoalDto;
  chatId: string;
  onConfirmed: (response: { reply: string; plan?: GoalPlanDto | null }) => void;
  onDismiss: () => void;
}) {
  const [confirmGoal, { isLoading }] = useConfirmGoalMutation();
  const [done, setDone] = useState(false);

  const [targetAmount, setTargetAmount] = useState(
    goal.targetAmount != null ? String(goal.targetAmount) : ""
  );
  const [currentSaved, setCurrentSaved] = useState(
    goal.currentSaved != null ? String(goal.currentSaved) : ""
  );
  const [errors, setErrors] = useState<{ target?: string; saved?: string }>({});

  const validate = () => {
    const e: { target?: string; saved?: string } = {};
    const t = Number(targetAmount);
    const s = Number(currentSaved || "0");
    if (!targetAmount.trim() || isNaN(t) || t <= 0)
      e.target = "Enter a valid target amount";
    if (currentSaved.trim() !== "" && (isNaN(s) || s < 0))
      e.saved = "Enter a valid amount or leave blank";
    if (!e.target && !e.saved && s > t)
      e.saved = "Savings can't exceed target";
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

  



  if (done) {
    return (
      <div className="flex items-center gap-2 mt-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
        Goal &quot;{goal.name}&quot; added — check your Goals page!
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-3.5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
          <Sparkles size={13} className="text-indigo-500" />
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-800">Goal detected</p>
          <p className="text-[10px] text-stone-400">Confirm the details to start tracking</p>
        </div>
      </div>

      {/* Goal name + date */}
      <div className="bg-white/80 rounded-lg px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Target size={12} className="text-indigo-400 shrink-0" />
          <p className="text-sm font-bold text-stone-800">{goal.name}</p>
        </div>
        {goal.targetDate && (
          <span className="flex items-center gap-1 text-[10px] text-stone-500 bg-stone-100 rounded-full px-2 py-0.5">
            <Calendar size={9} />
            {new Date(goal.targetDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
            Target <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-stone-400 font-medium">₹</span>
            <input
              type="number"
              min={0}
              placeholder="100000"
              value={targetAmount}
              onChange={(e) => { setTargetAmount(e.target.value); setErrors(p => ({ ...p, target: undefined })); }}
              className={`w-full pl-6 pr-2 py-2 rounded-lg text-xs text-stone-800 bg-white border outline-none transition-colors
                ${errors.target ? "border-red-300 focus:border-red-400" : "border-stone-200 focus:border-indigo-400"}`}
            />
          </div>
          {errors.target && <p className="text-[10px] text-red-500">{errors.target}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
            Saved so far
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-stone-400 font-medium">₹</span>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={currentSaved}
              onChange={(e) => { setCurrentSaved(e.target.value); setErrors(p => ({ ...p, saved: undefined })); }}
              className={`w-full pl-6 pr-2 py-2 rounded-lg text-xs text-stone-800 bg-white border outline-none transition-colors
                ${errors.saved ? "border-red-300 focus:border-red-400" : "border-stone-200 focus:border-indigo-400"}`}
            />
          </div>
          {errors.saved && <p className="text-[10px] text-red-500">{errors.saved}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
          Add goal
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-2 rounded-lg text-xs font-medium text-stone-500 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

// ─── Plan Offer Card ──────────────────────────────────────────────────────────
// Shown after goal is confirmed — user picks weekly or monthly

function PlanOfferCard({
  goalName,
  onSelect,
}: {
  goalName: string;
  onSelect: (frequency: "weekly" | "monthly") => void;
}) {
  return (
    <div className="mt-2 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <CalendarDays size={13} className="text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-800">Build a savings plan?</p>
          <p className="text-[10px] text-stone-400">Get a concrete roadmap for <span className="font-medium text-stone-600">{goalName}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSelect("weekly")}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
            <Zap size={14} className="text-amber-600" />
          </div>
          <p className="text-xs font-semibold text-stone-700">Weekly</p>
          <p className="text-[10px] text-stone-400 text-center">Week-by-week actions</p>
        </button>

        <button
          onClick={() => onSelect("monthly")}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
            <TrendingUp size={14} className="text-amber-600" />
          </div>
          <p className="text-xs font-semibold text-stone-700">Monthly</p>
          <p className="text-[10px] text-stone-400 text-center">Month-by-month targets</p>
        </button>
      </div>

      <button
        onClick={() => onSelect("weekly")} // "skip" — just dismiss by not saving
        className="text-[10px] text-stone-400 hover:text-stone-600 text-center transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}

// ─── Created Plan Card ────────────────────────────────────────────────────────

function CreatedPlanCard({ plan }: { plan: GoalPlanDto }) {
  const [expanded, setExpanded] = useState(false);
  const frequency = plan.frequency === "MONTHLY" ? "monthly" : "weekly";
  const periodLabel = plan.frequency === "MONTHLY" ? "Month" : "Week";

  const currentTask = plan.weeks.find((w) => w.isCurrent) ?? plan.weeks[0];
  const visibleWeeks = expanded ? plan.weeks.slice(0, 4) : plan.weeks.slice(0, 2);

  return (
    <div className="mt-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <ListChecks size={13} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-800">
              {plan.totalWeeks}-{periodLabel.toLowerCase()} plan created
            </p>
            <p className="text-[10px] text-stone-400">{plan.goalName} · {frequency}</p>
          </div>
        </div>
        {plan.weeklySavingTarget && (
          <div className="text-right">
            <p className="text-xs font-bold text-emerald-700">₹{fmt(plan.weeklySavingTarget)}</p>
            <p className="text-[10px] text-stone-400">/{frequency === "weekly" ? "wk" : "mo"}</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-[11px] text-stone-600 leading-relaxed bg-white/60 rounded-lg px-2.5 py-2">
        {plan.summary}
      </p>

      {/* Week previews */}
      <div className="flex flex-col gap-2">
        {visibleWeeks.map((week) => (
          <WeekRow key={week.id} week={week} periodLabel={periodLabel} isCurrent={week.isCurrent} />
        ))}
      </div>

      {plan.weeks.length > 2 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-center gap-1 text-[11px] text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
        >
          {expanded ? "Show less" : `Show more weeks`}
          <ChevronRight size={12} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-emerald-200">
        <div className="flex-1 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(plan.progressPct, 100)}%` }}
          />
        </div>
        <span className="text-[10px] text-stone-500 shrink-0">{plan.progressPct}% done</span>
      </div>
    </div>
  );
}

function WeekRow({
  week,
  periodLabel,
  isCurrent,
}: {
  week: WeekTaskDto;
  periodLabel: string;
  isCurrent: boolean;
}) {
  const [open, setOpen] = useState(isCurrent);

  return (
    <div className={`rounded-lg border bg-white/70 overflow-hidden transition-all
      ${isCurrent ? "border-emerald-300" : "border-stone-200/60"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2.5 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          {isCurrent && (
            <span className="text-[9px] font-bold text-white bg-emerald-500 rounded-full px-1.5 py-0.5">
              NOW
            </span>
          )}
          <span className="text-[11px] font-semibold text-stone-700">
            {periodLabel} {week.weekNumber}
          </span>
          <span className="text-[10px] text-stone-400">
            {new Date(week.weekStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {week.savingTarget && (
            <span className="text-[11px] font-bold text-emerald-600">
              ₹{fmt(week.savingTarget)}
            </span>
          )}
          <ChevronRight
            size={12}
            className={`text-stone-400 transition-transform ${open ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-2.5 pb-2.5 flex flex-col gap-1.5">
          {week.actions.map((action, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
              <p className="text-[11px] text-stone-600 leading-snug">{action}</p>
            </div>
          ))}
          {week.tip && (
            <div className="flex items-start gap-1.5 mt-1 bg-amber-50 rounded-lg px-2 py-1.5">
              <span className="text-amber-500 text-[11px] shrink-0">💡</span>
              <p className="text-[11px] text-stone-600 leading-snug italic">{week.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({
  msg,
  chatId,
  onGoalConfirmed,
  onGoalDismiss,
  onPlanSelected,
}: {
  msg: LocalMessage;
  chatId: string | null;
  onGoalConfirmed: (msgId: string, res: { reply: string; plan?: GoalPlanDto | null }) => void;
  onGoalDismiss: (msgId: string) => void;
  onPlanSelected: (frequency: "weekly" | "monthly") => void;
}) {
  function PremiumLimitCard({ message }: { message: string }) {
  return (
    <div className="mt-2 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <Sparkles size={13} className="text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-900">MoneyLens Premium</p>
          <p className="text-[10px] text-stone-400">Feature coming soon</p>
        </div>
      </div>
      <p className="text-[11px] text-amber-900 leading-relaxed bg-white/60 rounded-lg px-2.5 py-2">
        {message}
      </p>
    </div>
  );
}
  const isUser = msg.role === "USER";

  return (
    <div className={`flex flex-col max-w-[88%] ${isUser ? "self-end items-end" : "self-start items-start"}`}>
      <div className={`flex items-end gap-1.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {!isUser && (
          <div className="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center shrink-0 mb-0.5">
            <Bot size={12} className="text-stone-100" />
          </div>
        )}
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap
            ${isUser
              ? "bg-stone-900 text-stone-50 rounded-br-sm"
              : "bg-stone-100 text-stone-900 border border-stone-200 rounded-bl-sm"
            }
            ${msg.pending ? "opacity-60" : "opacity-100"}
          `}
        >
          {msg.pending ? <TypingDots /> : msg.content}
        </div>
      </div>

      {/* Goal suggestion card */}
      {!isUser && !msg.pending && msg.suggestedGoal && !msg.goalDismissed && chatId && (
        <div className="ml-8 w-[calc(100%-2rem)]">
          <GoalSuggestionCard
            goal={msg.suggestedGoal}
            chatId={chatId}
            onConfirmed={(res) => onGoalConfirmed(msg.id, res)}
            onDismiss={() => onGoalDismiss(msg.id)}
          />
        </div>
      )}

      {/* Plan offer card — shown on the assistant message that triggered the offer */}
      {!isUser && !msg.pending && msg.planOfferPending && msg.pendingPlanGoalName && (
        <div className="ml-8 w-[calc(100%-2rem)]">
          <PlanOfferCard
            goalName={msg.pendingPlanGoalName}
            onSelect={onPlanSelected}
          />
        </div>
      )}

      {!isUser && !msg.pending && msg.planLimitError && (
        <div className="ml-8 w-[calc(100%-2rem)]">
          <PremiumLimitCard message={msg.planLimitError} />
        </div>
)}

      {/* Created plan card */}
      {!isUser && !msg.pending && msg.createdPlan && (
        <div className="ml-8 w-[calc(100%-2rem)]">
          <CreatedPlanCard plan={msg.createdPlan} />
        </div>
      )}

      {!msg.pending && (
        <p className={`text-[11px] text-stone-400 mt-1 px-1 ${isUser ? "text-right" : "text-left ml-8"}`}>
          {fmtTime(msg.createdAt)}
        </p>
      )}
    </div>
  );
}

// ─── History Sidebar Item ─────────────────────────────────────────────────────

function HistoryItem({
  chat, active, onClick,
}: {
  chat: ChatListItem; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs leading-snug transition-colors border
        ${active
          ? "bg-stone-900 text-stone-50 border-stone-900"
          : "bg-transparent text-stone-600 border-transparent hover:bg-stone-100 hover:border-stone-200"
        }`}
    >
      <p className="font-medium truncate">{chat.title || "New chat"}</p>
      <p className={`text-[10px] mt-0.5 ${active ? "text-stone-400" : "text-stone-400"}`}>
        {new Date(chat.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </p>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIChatPanel({ statementId }: Props) {
  const [isOpen,       setIsOpen]       = useState(false);
  const [showHistory,  setShowHistory]  = useState(false);
  const [chatId,       setChatId]       = useState<string | null>(null);
  const [messages,     setMessages]     = useState<LocalMessage[]>([]);
  const [input,        setInput]        = useState("");
  const [hasUnread,    setHasUnread]    = useState(false);

  // Track whether there's a pending plan offer so we can send the right message
  const [pendingPlanGoalName, setPendingPlanGoalName] = useState<string | null>(null);

  const [sendChatMessage, { isLoading }] = useSendChatMessageMutation();
  const { data: chatList = [], refetch: refetchList } = useListChatsQuery(statementId, {
    skip: !isOpen,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Greet on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: genId(),
        role: "ASSISTANT",
        content: "Hi! I'm your MoneyLens AI. Ask me anything about your spending, savings goals, or financial health.",
        createdAt: new Date().toISOString(),
      }]);
    }
  }, [isOpen]);

  // ── Send ──────────────────────────────────────────────────────────────────

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userBubble: LocalMessage = {
      id: genId(), role: "USER",
      content: msg, createdAt: new Date().toISOString(),
    };
    const pendingId = genId();
    const pendingBubble: LocalMessage = {
      id: pendingId, role: "ASSISTANT",
      content: "", createdAt: new Date().toISOString(), pending: true,
    };

    setMessages((prev) => [...prev, userBubble, pendingBubble]);

    try {
      const res = await sendChatMessage({ statementId, chatId, message: msg }).unwrap();

      // Rebuild from server history
      const serverMessages: LocalMessage[] = res.history.map((m) => ({
        id: m.id,
        role: m.role as "USER" | "ASSISTANT",
        content: m.content,
        createdAt: m.createdAt,
      }));

      // Attach suggestedGoal to last assistant message
      if (res.suggestedGoal) {
        for (let i = serverMessages.length - 1; i >= 0; i--) {
          if (serverMessages[i].role === "ASSISTANT") {
            serverMessages[i].suggestedGoal = res.suggestedGoal;
            break;
          }
        }
      }

      if (res.planLimitError) {
      for (let i = serverMessages.length - 1; i >= 0; i--) {
        if (serverMessages[i].role === "ASSISTANT") {
          serverMessages[i].planLimitError = res.planLimitError;
          break;
    }
  }
}

      // Attach createdPlan to last assistant message
      if (res.createdPlan) {
        for (let i = serverMessages.length - 1; i >= 0; i--) {
          if (serverMessages[i].role === "ASSISTANT") {
            serverMessages[i].createdPlan = res.createdPlan;
            break;
          }
        }
      }

      // Attach plan offer state to last assistant message
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
        // Clear pending plan if it was resolved this turn
        setPendingPlanGoalName(null);
      }

      setMessages(serverMessages);

      if (!chatId || res.newChat) {
        setChatId(res.chatId);
        refetchList();
      }
      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== pendingId),
        {
          id: genId(), role: "ASSISTANT",
          content: "Something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [input, chatId, statementId, isLoading, sendChatMessage, refetchList, isOpen]);

  // ── Goal card callbacks ────────────────────────────────────────────────────

  /**
   * User confirmed a goal from the suggestion card.
   * The backend (confirmGoalAndOfferPlan) saves the goal and returns a
   * ChatResponse with planOfferPending=true.
   * We inject the backend's reply as a new assistant message with the plan offer UI.
   */
  const handleGoalConfirmed = useCallback((
    msgId: string,
    res: { reply: string; plan?: GoalPlanDto | null }
  ) => {
    // Remove the suggestion card from the triggering message
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, suggestedGoal: null, goalConfirmed: true } : m)
    );

    // Inject the backend's "goal created + plan offer" message
    const offerMsg: LocalMessage = {
      id: genId(),
      role: "ASSISTANT",
      content: res.reply,
      createdAt: new Date().toISOString(),
      // If the backend already created a plan (shouldn't happen here but safe)
      createdPlan: res.plan ?? null,
      // Always show the plan offer after goal confirmation
      planOfferPending: !res.plan,
      pendingPlanGoalName: !res.plan ? "your goal" : null,
    };
    setMessages((prev) => [...prev, offerMsg]);
    if (!res.plan) setPendingPlanGoalName("your goal");
  }, []);

  const handleGoalDismiss = useCallback((msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, suggestedGoal: null, goalDismissed: true } : m)
    );
  }, []);

  /**
   * User picked weekly or monthly from the plan offer card.
   * Send the selection as a chat message — the backend detects pendingPlanGoalName
   * and creates the plan, returning createdPlan in the response.
   */
  const handlePlanSelected = useCallback((frequency: "weekly" | "monthly") => {
    // Remove plan offer card from all messages
    setMessages((prev) =>
      prev.map((m) => ({ ...m, planOfferPending: false }))
    );
    setPendingPlanGoalName(null);
    // Send as a user message so the backend can process it
    send(frequency === "weekly" ? "Yes, weekly plan please" : "Yes, monthly plan please");
  }, [send]);

  // ── Load past chat ─────────────────────────────────────────────────────────

  const loadChat = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/v1/chat/${id}/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      const history: ChatMessageDto[] = json.data ?? json;
      setMessages(history.map((m) => ({
        id: m.id, role: m.role as "USER" | "ASSISTANT",
        content: m.content, createdAt: m.createdAt,
      })));
      setChatId(id);
      setShowHistory(false);
      setPendingPlanGoalName(null);
    } catch {
      // keep current messages
    }
  }, []);

  const startNew = () => {
    setChatId(null);
    setPendingPlanGoalName(null);
    setMessages([{
      id: genId(), role: "ASSISTANT",
      content: "Starting fresh. What would you like to explore about your finances?",
      createdAt: new Date().toISOString(),
    }]);
    setShowHistory(false);
  };

  // Auto-resize textarea
  const resizeTextarea = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const showPrompts = messages.length <= 1;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3">

      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="w-[380px] h-[580px] bg-white rounded-2xl border border-stone-200 shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="w-7 h-7 rounded-lg border border-stone-200 bg-white flex items-center justify-center hover:bg-stone-100 transition-colors"
              >
                <ChevronLeft
                  size={13}
                  className={`text-stone-500 transition-transform ${showHistory ? "rotate-180" : ""}`}
                />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
                  <Bot size={14} className="text-stone-100" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-stone-900 leading-none">MoneyLens AI</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-stone-400 font-medium">online</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={startNew}
                title="New chat"
                className="w-7 h-7 rounded-lg border border-stone-200 bg-white flex items-center justify-center hover:bg-stone-100 transition-colors"
              >
                <RotateCcw size={12} className="text-stone-500" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg border border-stone-200 bg-white flex items-center justify-center hover:bg-stone-100 transition-colors"
              >
                <ChevronDown size={13} className="text-stone-500" />
              </button>
            </div>
          </div>

          {/* Body */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest px-2 mb-1">
                Previous chats
              </p>
              {chatList.length === 0 && (
                <p className="text-xs text-stone-400 px-2 py-4 text-center">No previous chats yet.</p>
              )}
              {chatList.map((c) => (
                <HistoryItem
                  key={c.id}
                  chat={c}
                  active={c.id === chatId}
                  onClick={() => loadChat(c.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((msg) => (
                <Bubble
                  key={msg.id}
                  msg={msg}
                  chatId={chatId}
                  onGoalConfirmed={handleGoalConfirmed}
                  onGoalDismiss={handleGoalDismiss}
                  onPlanSelected={handlePlanSelected}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Quick prompts */}
          {!showHistory && showPrompts && (
            <div className="flex flex-wrap gap-1.5 px-4 py-2 border-t border-stone-100 shrink-0">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-[11px] font-medium text-stone-500 bg-stone-100 border border-stone-200 rounded-full px-3 py-1 hover:bg-stone-200 hover:text-stone-700 transition-colors whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {!showHistory && (
            <div className="flex gap-2 items-end px-3.5 py-3 border-t border-stone-100 bg-white shrink-0">
              <textarea
                ref={inputRef}
                placeholder={
                  pendingPlanGoalName
                    ? "Type weekly, monthly, or skip..."
                    : "Ask about your finances..."
                }
                value={input}
                onChange={(e) => { setInput(e.target.value); resizeTextarea(); }}
                onKeyDown={handleKey}
                rows={1}
                className="flex-1 font-sans text-[13px] text-stone-900 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 resize-none outline-none leading-snug min-h-[40px] max-h-[100px] focus:border-stone-400 focus:bg-white transition-colors placeholder:text-stone-300"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center shrink-0 mb-0.5 hover:bg-stone-700 transition-colors disabled:bg-stone-200 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? <Loader2 size={14} className="text-white animate-spin" />
                  : <Send size={14} className="text-white" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── FAB ────────────────────────────────────────────────────────────── */}
      <button
        onClick={() => { setIsOpen((o) => !o); setHasUnread(false); }}
        className="w-[52px] h-[52px] rounded-2xl bg-stone-900 flex items-center justify-center shadow-xl hover:bg-stone-700 hover:scale-105 transition-all duration-200 relative"
      >
        {isOpen
          ? <X size={20} className="text-stone-100" />
          : <MessageSquare size={20} className="text-stone-100" />}
        {hasUnread && !isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
            1
          </div>
        )}
      </button>
    </div>
  );
}
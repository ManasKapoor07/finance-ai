"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  useSendChatMessageMutation,
  useListChatsQuery,
  useGetChatHistoryQuery,
} from "../redux/api/authApi";
import type {
  ChatMessageDto,
  ChatListItem,
  SuggestedGoalDto,
  GoalPlanDto,
} from "../redux/api/authApi";
import { GoalDetectedCard } from "../components/Goaldetectedcard";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LocalMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  suggestedGoal?: SuggestedGoalDto | null;
  createdPlan?: GoalPlanDto | null;
  chatId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const generateId = (): string => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (err) {
    console.error("UUID generation failed:", err);
  }
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

function renderMarkdown(text: string) {
  return text.split("\n").map((line, li, arr) => (
    <span key={li}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((chunk, ci) =>
        chunk.startsWith("**") && chunk.endsWith("**") ? (
          <strong key={ci} className="font-semibold">{chunk.slice(2, -2)}</strong>
        ) : (
          <span key={ci}>{chunk}</span>
        )
      )}
      {li < arr.length - 1 && <br />}
    </span>
  ));
}

const SUGGESTIONS = [
  "Where am I spending the most?",
  "Am I saving enough?",
  "Show my subscription leaks",
  "Can I afford a big purchase?",
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-0.5 px-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full inline-block animate-bounce"
          style={{
            background: "#6EE7B7",
            animationDelay: `${i * 0.18}s`,
            animationDuration: "1.2s",
          }}
        />
      ))}
    </div>
  );
}

function SidebarItem({
  chat,
  active,
  onClick,
}: {
  chat: ChatListItem;
  active: boolean;
  onClick: () => void;
}) {
  const when = new Date(chat.updatedAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "rgba(110,231,183,0.07)" : "transparent",
        border: active
          ? "0.5px solid rgba(110,231,183,0.2)"
          : "0.5px solid transparent",
      }}
      className="w-full text-left px-2.5 py-2 rounded-xl transition-colors duration-150 hover:bg-white/[0.04]"
    >
      <p
        className="text-xs font-medium truncate mb-0.5"
        style={{ color: active ? "#6EE7B7" : "rgba(255,255,255,0.55)" }}
      >
        {chat.title || "New chat"}
      </p>
      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "10px" }}>{when}</p>
    </button>
  );
}

function MessageBubble({
  msg,
  onGoalConfirmed,
}: {
  msg: LocalMessage;
  onGoalConfirmed: (
    plan: GoalPlanDto | null,
    reply: string,
    msgId: string,
    frequency: "weekly" | "monthly" | null
  ) => void;
}) {
  const isUser = msg.role === "USER";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, #6EE7B7, #22d3ee)",
                color: "#080B14",
                borderRadius: "14px 14px 3px 14px",
              }
            : {
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(255,255,255,0.09)",
                color: "rgba(255,255,255,0.75)",
                borderRadius: "14px 14px 14px 3px",
              }
        }
        className="max-w-[80%] px-3.5 py-2.5 text-[12px] leading-snug break-words font-medium"
      >
        {renderMarkdown(msg.content)}
      </div>

      <p
        className="text-[10px] mt-1 px-1"
        style={{ color: "rgba(255,255,255,0.2)" }}
      >
        {fmtTime(msg.createdAt)}
      </p>

      {!isUser && msg.suggestedGoal && msg.chatId && (
        <GoalDetectedCard
          goal={msg.suggestedGoal}
          chatId={msg.chatId}
          onConfirmed={(plan, reply, frequency) =>
            onGoalConfirmed(plan, reply, msg.id, frequency)
          }
        />
      )}
    </div>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (s: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 py-6 text-center h-full">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(110,231,183,0.1)",
          border: "0.5px solid rgba(110,231,183,0.2)",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6EE7B7"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-4 8H9c-1-2-4-4-4-8a7 7 0 0 1 7-7z" />
          <path d="M9 21h6M10 17h4" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
          Your financial intelligence engine
        </p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Ask me anything about your spending, savings, or goals.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-1">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            style={{
              border: "0.5px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.4)",
              fontFamily: "'DM Sans', sans-serif",
            }}
            className="px-3 py-1.5 rounded-full text-xs transition-colors duration-150 cursor-pointer hover:bg-[rgba(110,231,183,0.08)] hover:text-[#6EE7B7]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatIdRef = useRef<string | null>(null);
  const localMessagesRef = useRef(false);

  // ── RTK Query ──────────────────────────────────────────────────────────────

  const { data: chatList = [], refetch: refetchList } =
    useListChatsQuery(undefined, { skip: !open });

  const { data: historyData } =
    useGetChatHistoryQuery(activeChatId!, { skip: !activeChatId });

  const [sendMessage] = useSendChatMessageMutation();

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!historyData || localMessagesRef.current) return;
    setMessages(
      historyData.map((m: ChatMessageDto) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        chatId: chatIdRef.current ?? "",
      }))
    );
  }, [historyData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const startNewChat = useCallback(() => {
    localMessagesRef.current = false;
    chatIdRef.current = null;
    setActiveChatId(null);
    setMessages([]);
  }, []);

  const selectChat = useCallback((id: string) => {
    if (id === chatIdRef.current) return;
    localMessagesRef.current = false;
    chatIdRef.current = id;
    setActiveChatId(id);
    setMessages([]);
  }, []);

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isTyping) return;

      localMessagesRef.current = true;

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "USER" as const,
          content,
          createdAt: new Date().toISOString(),
          chatId: chatIdRef.current ?? "",
        },
      ]);
      setInput("");
      setIsTyping(true);

      try {
        const res = await sendMessage({
          message: content,
          chatId: chatIdRef.current,
          statementId: undefined as any,
        }).unwrap();

        const resolvedChatId: string =
          res.newChat && res.chatId ? res.chatId : (chatIdRef.current ?? "");

        if (res.newChat && res.chatId) {
          chatIdRef.current = res.chatId;
          setActiveChatId(res.chatId);
          refetchList();
        }

        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "ASSISTANT" as const,
            content: res.reply,
            createdAt: new Date().toISOString(),
            suggestedGoal: res.suggestedGoal ?? null,
            createdPlan: res.createdPlan ?? null,
            chatId: resolvedChatId,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "ASSISTANT" as const,
            content: "Something went wrong. Please try again.",
            createdAt: new Date().toISOString(),
            chatId: chatIdRef.current ?? "",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, sendMessage, refetchList]
  );

  const handleGoalConfirmed = useCallback(
    (
      plan: GoalPlanDto | null,
      reply: string,
      msgId: string,
      frequency: "weekly" | "monthly" | null
    ) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, suggestedGoal: null } : m))
      );
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "ASSISTANT" as const,
          content: reply,
          createdAt: new Date().toISOString(),
          createdPlan: plan ?? null,
          chatId: chatIdRef.current ?? "",
        },
      ]);
      if (frequency) {
        setTimeout(() => handleSend(frequency), 400);
      }
    },
    [handleSend]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes mlFadeUp {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ml-window { animation: mlFadeUp 0.22s ease forwards; }

        .ml-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 52px 52px;
          pointer-events: none;
          z-index: 0;
        }

        .ml-glow-orb {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(110,231,183,0.07) 0%, rgba(59,130,246,0.05) 45%, transparent 70%);
          pointer-events: none;
          border-radius: 50%;
          z-index: 0;
        }

        .ml-scroll::-webkit-scrollbar       { width: 3px; }
        .ml-scroll::-webkit-scrollbar-track { background: transparent; }
        .ml-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }

        .ml-textarea-field                    { scrollbar-width: none; font-family: 'DM Sans', sans-serif; }
        .ml-textarea-field::-webkit-scrollbar { display: none; }
        .ml-textarea-field:focus              { outline: none; border-color: rgba(110,231,183,0.4) !important; background: rgba(110,231,183,0.03) !important; }

        .ml-chip-btn:hover {
          background: rgba(110,231,183,0.08) !important;
          color: #6EE7B7 !important;
          border-color: rgba(110,231,183,0.2) !important;
        }

        .ml-sidebar-item-hover:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.07) !important;
        }

        .ml-goals-link:hover {
          background: rgba(110,231,183,0.06);
          color: #6EE7B7 !important;
        }

        .ml-toggle-btn:hover {
          background: rgba(255,255,255,0.08) !important;
          color: rgba(255,255,255,0.6) !important;
        }

        .ml-new-chat-btn:hover {
          background: rgba(110,231,183,0.14) !important;
        }
      `}</style>

      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle chat"
        className="fixed bottom-7 right-7 z-[9999] w-14 h-14 rounded-full flex items-center
                   justify-center border-none cursor-pointer active:scale-95
                   transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #6EE7B7, #22d3ee)",
          boxShadow: "0 4px 22px rgba(110,231,183,0.35)",
        }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#080B14" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#080B14" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className={`ml-window fixed bottom-24 right-7 z-[9998] flex overflow-hidden
                      rounded-2xl transition-[width] duration-200
                      ${sidebarOpen ? "w-[700px]" : "w-[400px]"} h-[580px]`}
          style={{
            background: "#080B14",
            border: "0.5px solid rgba(255,255,255,0.09)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.05)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Background decoration */}
          <div className="ml-grid-bg" />
          <div className="ml-glow-orb" />

          {/* Sidebar */}
          {sidebarOpen && (
            <div
              className="w-52 flex-shrink-0 flex flex-col relative z-10"
              style={{
                borderRight: "0.5px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.015)",
              }}
            >
              {/* Sidebar header */}
              <div
                className="px-3.5 pt-3.5 pb-2.5"
                style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
              >
                <p
                  className="font-bold mb-2.5"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  Conversations
                </p>
                <button
                  onClick={startNewChat}
                  className="ml-new-chat-btn w-full py-1.5 rounded-lg flex items-center justify-center
                             gap-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer"
                  style={{
                    border: "0.5px solid rgba(110,231,183,0.25)",
                    background: "rgba(110,231,183,0.07)",
                    color: "#6EE7B7",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New chat
                </button>
              </div>

              {/* Chat list */}
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5 ml-scroll">
                {chatList.length === 0 ? (
                  <p className="text-xs text-center mt-6" style={{ color: "rgba(255,255,255,0.22)" }}>
                    No chats yet
                  </p>
                ) : (
                  chatList.map((c: ChatListItem) => (
                    <SidebarItem
                      key={c.id}
                      chat={c}
                      active={c.id === activeChatId}
                      onClick={() => selectChat(c.id)}
                    />
                  ))
                )}
              </div>

              {/* Sidebar footer */}
              <div
                className="px-3 pb-3 pt-2"
                style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}
              >
                <a
                  href="/goals"
                  className="ml-goals-link flex items-center gap-2 px-2.5 py-2 rounded-lg
                             text-xs font-medium transition-colors duration-150"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                  Goals & Plans
                </a>
              </div>
            </div>
          )}

          {/* Main panel */}
          <div className="flex-1 flex flex-col min-w-0 relative z-10">

            {/* Header */}
            <div
              className="px-3.5 py-2.5 flex items-center gap-2.5 flex-shrink-0"
              style={{
                borderBottom: "0.5px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.015)",
              }}
            >
              <button
                onClick={() => setSidebarOpen((s) => !s)}
                className="ml-toggle-btn w-8 h-8 rounded-lg flex items-center justify-center
                           transition-colors duration-150 cursor-pointer flex-shrink-0"
                style={{
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                </svg>
              </button>

              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(110,231,183,0.18), rgba(59,130,246,0.18))",
                  border: "0.5px solid rgba(110,231,183,0.25)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-4 8H9c-1-2-4-4-4-8a7 7 0 0 1 7-7z" />
                  <path d="M9 21h6M10 17h4" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#fff" }}>MoneyLens AI</p>
                <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {activeChatId
                    ? chatList.find((c: ChatListItem) => c.id === activeChatId)?.title || "Active chat"
                    : "New conversation"}
                </p>
              </div>

              {isTyping && (
                <p className="text-[11px] font-semibold flex-shrink-0" style={{ color: "#6EE7B7" }}>
                  Thinking…
                </p>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3.5 pt-4 pb-2 flex flex-col gap-3 ml-scroll">
              {messages.length === 0 ? (
                <EmptyState onSuggest={handleSend} />
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    onGoalConfirmed={handleGoalConfirmed}
                  />
                ))
              )}

              {isTyping && (
                <div className="flex flex-col items-start">
                  <div
                    className="px-3.5 py-2.5"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "0.5px solid rgba(255,255,255,0.09)",
                      borderRadius: "14px 14px 14px 3px",
                    }}
                  >
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div
              className="px-3 pb-3 pt-2.5 flex gap-2 items-end flex-shrink-0"
              style={{
                borderTop: "0.5px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.015)",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                placeholder="Ask about your finances…"
                className="ml-textarea-field flex-1 resize-none rounded-xl px-3 py-2.5
                           text-[12px] leading-snug min-h-[38px] max-h-[100px]
                           transition-[border-color,background] duration-150"
                style={{
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.8)",
                }}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                aria-label="Send"
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center
                           border-none active:scale-90 disabled:opacity-35 disabled:cursor-not-allowed
                           transition-all duration-150 cursor-pointer hover:opacity-85"
                style={{
                  background: "linear-gradient(135deg, #6EE7B7, #22d3ee)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#080B14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>

            <div className="pb-2 px-3.5 flex justify-end flex-shrink-0">
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.16)" }}>
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
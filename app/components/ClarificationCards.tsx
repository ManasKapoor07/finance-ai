"use client";

import { useState, useEffect } from "react";
import {
  useGetPendingClarificationsQuery,
  useResolveClarificationMutation,
  useSkipClarificationMutation,
  type TransactionClarificationDto,
} from "../redux/api/onBoardingapi";

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  RECURRING_P2P: {
    emoji: "🔁",
    label: "Recurring transfer",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.2)",
  },
  UNCONFIRMED_SALARY: {
    emoji: "💸",
    label: "Unconfirmed income",
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.2)",
  },
  LOW_CONFIDENCE_CATEGORY: {
    emoji: "❓",
    label: "Unclear category",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.2)",
  },
} as const;

// ── Single card ───────────────────────────────────────────────────────────────

function ClarificationCard({ card }: { card: TransactionClarificationDto }) {
  const [resolve] = useResolveClarificationMutation();
  const [skip]    = useSkipClarificationMutation();
  const [pending, setPending]   = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const cfg = TYPE_CONFIG[card.clarificationType];

  const handleResolve = async (answer: string) => {
    setSelected(answer);
    setPending("resolve");
    try {
      await resolve({ id: card.id, answer }).unwrap();
    } catch {
      setSelected(null);
      setPending(null);
    }
  };

  const handleSkip = async () => {
    setPending("skip");
    try {
      await skip(card.id).unwrap();
    } catch {
      setPending(null);
    }
  };

  return (
    <div style={{
      background: "#0f1524",
      border: `0.5px solid ${cfg.border}`,
      borderRadius: 20,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      animation: "cc-fadein 0.3s ease",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            background: cfg.bg, border: `0.5px solid ${cfg.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>
            {cfg.emoji}
          </div>
          <div>
            <p style={{
              margin: 0, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase" as const,
              color: cfg.color,
            }}>
              {cfg.label}
            </p>
            <p style={{
              margin: "4px 0 0", fontSize: 14, fontWeight: 700,
              color: "rgba(255,255,255,0.88)", lineHeight: 1.4,
            }}>
              {card.questionText}
            </p>
          </div>
        </div>

        {/* Skip / dismiss */}
        <button
          onClick={handleSkip}
          disabled={pending !== null}
          aria-label="Dismiss"
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 16, color: "rgba(255,255,255,0.2)", flexShrink: 0,
            padding: "4px", borderRadius: 8, lineHeight: 1,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
        >
          ✕
        </button>
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {card.options.map(opt => {
          const isChosen = selected === opt;
          const isBusy   = pending !== null;
          return (
            <button
              key={opt}
              onClick={() => !isBusy && handleResolve(opt)}
              disabled={isBusy}
              style={{
                padding: "7px 14px",
                borderRadius: 99,
                border: isChosen
                  ? `0.5px solid ${cfg.color}`
                  : "0.5px solid rgba(255,255,255,0.1)",
                background: isChosen ? cfg.bg : "rgba(255,255,255,0.04)",
                color: isChosen ? cfg.color : "rgba(255,255,255,0.6)",
                fontSize: 12,
                fontWeight: 700,
                cursor: isBusy ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                fontFamily: "'DM Sans', sans-serif",
                opacity: isBusy && !isChosen ? 0.4 : 1,
              }}
            >
              {isChosen && pending === "resolve" ? "Saving…" : opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div style={{
      background: "#0f1524",
      border: "0.5px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, flexShrink: 0,
          background: "rgba(255,255,255,0.05)",
          animation: "cc-shimmer 1.4s infinite",
        }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ height: 10, width: 100, borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "cc-shimmer 1.4s infinite" }} />
          <div style={{ height: 14, width: "70%", borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "cc-shimmer 1.4s infinite" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[80, 110, 70, 90].map((w, i) => (
          <div key={i} style={{
            height: 30, width: w, borderRadius: 99,
            background: "rgba(255,255,255,0.05)",
            animation: "cc-shimmer 1.4s infinite",
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Container ─────────────────────────────────────────────────────────────────

export default function ClarificationCards() {
  const [stopPolling, setStopPolling] = useState(false);

  const { data: cards, isLoading } = useGetPendingClarificationsQuery(undefined, {
    // Poll every 4s after upload while backend is still processing.
    // Stops once cards arrive.
    pollingInterval: stopPolling ? 0 : 4000,
    skipPollingIfUnfocused: true,
  });

  // Stop polling as soon as we get cards
  useEffect(() => {
    if (cards && cards.length > 0) setStopPolling(true);
  }, [cards]);

  // Show skeletons while initial load or polling is still pending
  const showSkeleton = isLoading && !cards;

  if (showSkeleton) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 4 }}>
          <HeaderRow count={null} />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </>
    );
  }

  if (!cards?.length) return null;

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 4 }}>
        <HeaderRow count={cards.length} />
        {cards.map(card => (
          <ClarificationCard key={card.id} card={card} />
        ))}
      </div>
    </>
  );
}

// ── Header row ────────────────────────────────────────────────────────────────

function HeaderRow({ count }: { count: number | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <p style={{
        margin: 0, fontSize: 10, fontWeight: 700,
        letterSpacing: "0.18em", textTransform: "uppercase" as const,
        color: "rgba(255,255,255,0.28)",
      }}>
        Help us understand your transactions
      </p>
      {count !== null && (
        <span style={{
          display: "inline-flex", alignItems: "center",
          padding: "2px 8px", borderRadius: 99,
          background: "rgba(251,191,36,0.1)",
          border: "0.5px solid rgba(251,191,36,0.25)",
          fontSize: 10, fontWeight: 700, color: "#fbbf24",
        }}>
          {count} pending
        </span>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes cc-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cc-shimmer {
    0%   { opacity: 0.5; }
    50%  { opacity: 1;   }
    100% { opacity: 0.5; }
  }
`;
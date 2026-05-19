"use client";

import { useGetFeedbackAnalyticsQuery, type PersonalizationValue } from "../redux/api/feedbackApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERSONALIZATION_LABELS: Record<PersonalizationValue, string> = {
  EXTREMELY_PERSONALIZED: "Extremely personalized",
  MOSTLY_PERSONALIZED:    "Mostly personalized",
  SOMEWHAT_GENERIC:       "Somewhat generic",
  VERY_GENERIC:           "Very generic",
};

const PERSONALIZATION_COLOR: Record<PersonalizationValue, string> = {
  EXTREMELY_PERSONALIZED: "#6EE7B7",
  MOSTLY_PERSONALIZED:    "#67E8F9",
  SOMEWHAT_GENERIC:       "#FBB040",
  VERY_GENERIC:           "#FB7185",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedbackAnalyticsPage() {
  const { data, isLoading, isError, error, refetch } =
    useGetFeedbackAnalyticsQuery();

  if (isLoading) return <PageShell><LoadingState /></PageShell>;
  if (isError || !data) return <PageShell><ErrorState error={error} onRetry={refetch} /></PageShell>;

  const personalizationTotal = Object.values(data.personalizationBreakdown).reduce(
    (s, v) => s + v, 0
  );
  const insightsTotal = Object.values(data.topWantedInsights).reduce(
    (s, v) => s + v, 0
  );
  const optInRate =
    data.totalResponses > 0
      ? Math.round((data.contactOptIns / data.totalResponses) * 100)
      : 0;

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest text-white/25 mb-1">
          Internal
        </p>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-white">Feedback analytics</h1>
          <button
            onClick={refetch}
            className="text-xs text-white/30 border border-white/[0.07] rounded-xl
                       px-4 py-2 hover:text-white/60 hover:border-white/15 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard label="Total responses" value={data.totalResponses} />
        <StatCard label="Contact opt-ins" value={data.contactOptIns} />
        <StatCard label="Opt-in rate" value={`${optInRate}%`} />
      </div>

      {/* Personalization */}
      <Section title="Personalization breakdown">
        <div className="flex flex-col gap-4">
          {(Object.entries(data.personalizationBreakdown) as [PersonalizationValue, number][]).map(
            ([key, count]) => {
              const pct =
                personalizationTotal > 0
                  ? Math.round((count / personalizationTotal) * 100)
                  : 0;
              const color = PERSONALIZATION_COLOR[key] ?? "#888";
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/70">
                      {PERSONALIZATION_LABELS[key] ?? key}
                    </span>
                    <span className="text-white/30">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </Section>

      {/* Wanted insights */}
      <Section title="Wanted insights — ranked">
        {Object.keys(data.topWantedInsights).length === 0 ? (
          <Empty />
        ) : (
          <div className="flex flex-col gap-2.5">
            {(Object.entries(data.topWantedInsights) as [string, number][]).map(
              ([tag, count], i) => {
                const pct =
                  insightsTotal > 0
                    ? Math.round((count / insightsTotal) * 100)
                    : 0;
                return (
                  <div key={tag} className="flex items-center gap-3">
                    <span className="text-[11px] text-white/20 font-mono w-4 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-white/70 flex-1 min-w-0 truncate">
                      {tag}
                    </span>
                    <span className="text-xs text-white/30 flex-shrink-0">{count}</span>
                    <div className="w-24 h-1 rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0">
                      <div
                        className="h-full rounded-full bg-cyan-400/60"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </Section>

      {/* Describe to friend */}
      <Section title="How they described it to a friend">
        {data.recentDescriptions.length === 0 ? (
          <Empty />
        ) : (
          <div className="flex flex-col gap-3">
            {data.recentDescriptions.map((text, i) => (
              <blockquote
                key={i}
                className="text-sm text-white/60 leading-relaxed
                           border-l-2 border-emerald-500/40 pl-4 italic"
              >
                {text}
              </blockquote>
            ))}
          </div>
        )}
      </Section>

      {/* Holy-shit answers */}
      <Section title='"Holy sh*t this app understands me" — what would cause that?'>
        {data.recentHolyShit.length === 0 ? (
          <Empty />
        ) : (
          <div className="flex flex-col gap-3">
            {data.recentHolyShit.map((text, i) => (
              <blockquote
                key={i}
                className="text-sm text-white/60 leading-relaxed
                           border-l-2 border-violet-500/40 pl-4 italic"
              >
                {text}
              </blockquote>
            ))}
          </div>
        )}
      </Section>
    </PageShell>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#080B14] px-6 py-16">
      <div className="max-w-3xl mx-auto">{children}</div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
      <p className="text-[11px] uppercase tracking-widest text-white/25 mb-5">
        {title}
      </p>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
      <p className="text-xs text-white/30 mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-white/20 italic">No responses yet.</p>;
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4 animate-pulse pt-10">
      <div className="h-8 w-48 rounded-xl bg-white/[0.04]" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-white/[0.04]" />
      <div className="h-64 rounded-2xl bg-white/[0.04]" />
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: any;
  onRetry: () => void;
}) {
  const msg =
    error && "status" in error
      ? `Error ${error.status}`
      : "Something went wrong";
  return (
    <div className="flex flex-col items-center gap-4 pt-20 text-center">
      <p className="text-red-400 text-sm">{msg}</p>
      <button
        onClick={onRetry}
        className="text-xs text-white/40 border border-white/[0.07] rounded-xl
                   px-4 py-2 hover:text-white/60 transition-all"
      >
        Try again
      </button>
    </div>
  );
}
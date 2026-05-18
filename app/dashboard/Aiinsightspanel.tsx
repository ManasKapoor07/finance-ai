"use client";

import {
  useGetAIAnalysisQuery,
  useRefreshAIAnalysisMutation,
} from "../redux/api/authApi";

export default function AIInsightsPanel() {
  const { data: analysis, isLoading, isError } =
    useGetAIAnalysisQuery();

  const [refresh, { isLoading: refreshing }] =
    useRefreshAIAnalysisMutation();

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden rounded-[32px] bg-[#080B14] p-8">
        <GridBackground />

        <div className="relative z-10 flex min-h-[500px] flex-col items-center justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-white/10 border-t-[#6EE7B7]" />

          <p className="mt-5 text-sm text-white/40">
            Preparing financial intelligence...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="relative min-h-screen overflow-hidden rounded-[32px] bg-[#080B14] p-8">
        <GridBackground />

        <div className="relative z-10 flex min-h-[500px] flex-col items-center justify-center">

          <div className="mb-4 text-5xl text-[#6EE7B7]">
            ◎
          </div>

          <h2 className="text-2xl font-semibold text-white">
            No insights available
          </h2>

          <p className="mt-3 max-w-[420px] text-center text-sm leading-7 text-white/40">
            Upload transactions to generate your
            AI financial behavior report.
          </p>

        </div>
      </div>
    );
  }

  const score =
    analysis?.healthScore?.score || 0;

  const scoreColor =
    score >= 70
      ? "#6EE7B7"
      : score >= 50
      ? "#F59E0B"
      : "#FB7185";

  const scoreBg =
    score >= 70
      ? "bg-[#6EE7B7]/10 border-[#6EE7B7]/20 text-[#6EE7B7]"
      : score >= 50
      ? "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]"
      : "bg-[#FB7185]/10 border-[#FB7185]/20 text-[#FB7185]";

  return (
    <div className="relative min-h-screen overflow-hidden rounded-[32px] bg-[#080B14] p-5 md:p-7">

      <GridBackground />

      {/* ambient glow */}
      <div className="absolute right-[-120px] top-[-180px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(110,231,183,0.10),rgba(34,211,238,0.04),transparent_70%)]" />

      <div className="relative z-10 flex flex-col gap-5">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

          <div>

            <div className="mb-3 text-[10px] font-medium tracking-[0.18em] text-[#6EE7B7]">
              AI FINANCIAL INTELLIGENCE
            </div>

            <h1 className="font-[Bricolage_Grotesque] text-[38px] font-semibold leading-[0.95] tracking-[-0.06em] text-white md:text-[46px]">
              Your financial
              <br />
              behavior report.
            </h1>

            <p className="mt-4 max-w-[620px] text-[13px] leading-[1.9] text-white/40">
              AI analyzed your transactions,
              recurring habits, behavioral signals
              and spending consistency.
            </p>

          </div>

          <button
            onClick={() => refresh()}
            className="h-11 rounded-[14px] border border-white/10 bg-white/[0.04] px-5 text-[12px] font-medium text-white/70 backdrop-blur-xl transition hover:border-[#6EE7B7]/20 hover:text-white"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh Analysis"}
          </button>

        </div>

        {/* HERO */}
        <GlassCard className="overflow-hidden">

          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(110,231,183,0.05),rgba(59,130,246,0.02),transparent)]" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[280px_1fr]">

            {/* SCORE SIDE */}
            <div>

              <div className="flex h-[140px] w-[140px] items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(110,231,183,0.12),rgba(34,211,238,0.05))]">

                <div className="flex h-[108px] w-[108px] flex-col items-center justify-center rounded-full border border-white/10 bg-[#0D111B]">

                  <h2 className="text-[34px] font-semibold text-white">
                    {score}
                  </h2>

                  <span className="mt-1 text-[10px] text-white/35">
                    health score
                  </span>

                </div>

              </div>

              {/* STATUS */}
              <div className="mt-5">

                <div
                  className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-medium ${scoreBg}`}
                >
                  {analysis.healthScore?.label}
                </div>

                <div className="mt-2 text-[12px] text-white/35">
                  Grade {analysis.healthScore?.grade}
                </div>

                <p className="mt-4 text-[12px] leading-[1.8] text-white/50">

                  {score >= 70
                    ? "Your financial behavior appears relatively stable with manageable risk patterns."
                    : score >= 50
                    ? "Your finances are moderately stable, but recurring spending patterns need attention."
                    : "Your financial behavior currently shows instability caused by spending spikes and silent money leaks."}

                </p>

                {/* SCALE */}
                <div className="mt-5">

                  <div className="mb-2 flex items-center justify-between text-[10px] text-white/30">
                    <span>At Risk</span>
                    <span>Healthy</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/5">

                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${score}%`,
                        background: scoreColor,
                      }}
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* CONTENT */}
            <div>

              <div className="mb-4 inline-flex rounded-full border border-[#FB7185]/20 bg-[#FB7185]/10 px-3 py-1 text-[10px] font-medium text-[#FB7185]">
                AI detected unstable spending behavior
              </div>

              <h2 className="max-w-[760px] font-[Bricolage_Grotesque] text-[28px] font-semibold leading-[1.1] tracking-[-0.04em] text-white md:text-[34px]">
                Weekend spending and repeated
                charges are quietly draining
                your cash flow.
              </h2>

              <p className="mt-5 max-w-[760px] text-[14px] leading-[1.9] text-white/50">
                {analysis.summary}
              </p>

              {/* INSIGHT CHIPS */}
              <div className="mt-7 flex flex-wrap gap-3">

                <InsightChip
                  label="Shopping Spend"
                  value="₹23,760"
                />

                <InsightChip
                  label="Duplicate Charges"
                  value="5 detected"
                />

                <InsightChip
                  label="Food Delivery"
                  value="₹5,479"
                />

              </div>

            </div>

          </div>

        </GlassCard>

        {/* LEAKS + PATTERNS */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* MONEY LEAKS */}
          <GlassCard>

            <Label>
              Silent money leaks
            </Label>

            <div className="space-y-6">

              <LeakBar
                label="Shopping"
                amount="₹23,760"
                progress={92}
              />

              <LeakBar
                label="Food Delivery"
                amount="₹5,479"
                progress={48}
              />

              <LeakBar
                label="Duplicate Payments"
                amount="₹1,200"
                progress={24}
              />

            </div>

          </GlassCard>

          {/* PATTERNS */}
          <GlassCard>

            <Label>
              What's driving this behavior
            </Label>

            <div className="space-y-4">

              {analysis.hiddenPatterns?.map(
                (pattern: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5"
                  >

                    <div className="mb-2 text-[11px] text-[#6EE7B7]">
                      {pattern.category}
                    </div>

                    <h3 className="text-[18px] font-medium text-white">
                      {pattern.title}
                    </h3>

                    <p className="mt-3 text-[13px] leading-[1.8] text-white/50">
                      {pattern.insight}
                    </p>

                  </div>
                )
              )}

            </div>

          </GlassCard>

        </div>

        {/* FORECAST */}
        <div className="grid gap-5 lg:grid-cols-2">

          {analysis.projections?.map(
            (projection: any, i: number) => (
              <div
                key={i}
                className="rounded-[24px] border border-[#FB7185]/15 bg-[#FB7185]/[0.04] p-6 backdrop-blur-xl"
              >

                <div className="mb-3 inline-flex rounded-full border border-[#FB7185]/15 bg-[#FB7185]/10 px-3 py-1 text-[10px] text-[#FB7185]">
                  {projection.timeframe}
                </div>

                <h3 className="text-[22px] font-medium leading-[1.5] text-white">
                  {projection.headline}
                </h3>

                <p className="mt-4 text-[13px] leading-[1.9] text-white/50">
                  {projection.impact}
                </p>

              </div>
            )
          )}

        </div>

        {/* ACTION PLAN */}
        <GlassCard>

          <Label>
            What to fix first
          </Label>

          <div className="space-y-4">

            {analysis.nextActions?.map(
              (action: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-[18px] border border-white/10 bg-white/[0.03] p-4"
                >

                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,rgba(110,231,183,0.14),rgba(34,211,238,0.08))] text-[12px] font-medium text-white">
                    0{i + 1}
                  </div>

                  <div>

                    <div className="text-[13px] font-medium text-white">
                      {i === 0
                        ? "Top priority"
                        : i === 1
                        ? "Secondary fix"
                        : "Optimization"}
                    </div>

                    <p className="mt-1 text-[13px] leading-[1.8] text-white/55">
                      {action}
                    </p>

                  </div>

                </div>
              )
            )}

          </div>

        </GlassCard>

        {/* SIGNALS */}
        <GlassCard>

          <Label>
            Supporting behavioral signals
          </Label>

          <div className="relative flex flex-col gap-6 before:absolute before:left-[7px] before:top-[6px] before:h-full before:w-px before:bg-white/10">

            {analysis.behavioralSignals?.map(
              (signal: any, i: number) => (
                <div
                  key={i}
                  className="relative flex gap-4"
                >

                  <div className="relative z-10 mt-1 h-[15px] w-[15px] flex-shrink-0 rounded-full bg-[#6EE7B7]" />

                  <div className="flex-1">

                    <div className="mb-2 flex items-center justify-between gap-3">

                      <h4 className="text-[14px] font-medium text-white">
                        {signal.label}
                      </h4>

                      <span className="text-[11px] text-white/35">
                        Intensity {signal.intensity}/10
                      </span>

                    </div>

                    <p className="text-[13px] leading-[1.8] text-white/50">
                      {signal.observation}
                    </p>

                    {signal.emotion && (
                      <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/60">
                        {signal.emotion}
                      </div>
                    )}

                  </div>

                </div>
              )
            )}

          </div>

        </GlassCard>

      </div>

    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function Label({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 text-[10px] tracking-[0.14em] text-white/35">
      {children}
    </div>
  );
}

function InsightChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[11px] text-white/35">
        {label}
      </div>

      <div className="mt-1 text-[15px] font-medium text-white">
        {value}
      </div>
    </div>
  );
}

function LeakBar({
  label,
  amount,
  progress,
}: {
  label: string;
  amount: string;
  progress: number;
}) {
  return (
    <div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] text-white/70">
          {label}
        </span>

        <span className="text-[13px] text-white">
          {amount}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/5">

        <div
          className="h-full rounded-full bg-[#6EE7B7] transition-all duration-700"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

    </div>
  );
}

function GridBackground() {
  return (
    <div
      className="
        absolute inset-0
        bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]
        bg-[size:56px_56px]
      "
    />
  );
}
// components/dashboard/InsightCard.tsx

"use client";

import { Sparkles } from "lucide-react";

export default function InsightCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl p-6">

      <div className="flex items-center gap-2 text-[#E8622A]">

        <Sparkles className="w-4 h-4" />

        <span className="uppercase tracking-[0.2em] text-xs font-semibold">
          Insight
        </span>

      </div>

      <h3 className="mt-5 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-zinc-500 leading-relaxed text-sm">
        {text}
      </p>

    </div>
  );
}
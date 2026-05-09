// components/dashboard/MetricCard.tsx

"use client";

export default function MetricCard({
  title,
  value,
  icon,
  color,
}: any) {

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">

      <div className="flex items-center justify-between">

        <div className="text-zinc-500 text-sm">
          {title}
        </div>

        <div className={color}>
          {icon}
        </div>

      </div>

      <div className="mt-6 text-4xl font-bold">
        {value}
      </div>

    </div>
  );
}
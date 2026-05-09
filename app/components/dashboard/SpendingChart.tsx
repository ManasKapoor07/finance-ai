// components/dashboard/SpendingChart.tsx

"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
} from "recharts";

export default function SpendingChart({
  transactions,
}: any) {

  const grouped: Record<string, number> = {};

  transactions.forEach((tx: any) => {

    if (tx.type !== "DEBIT") {
      return;
    }

    if (!grouped[tx.date]) {
      grouped[tx.date] = 0;
    }

    grouped[tx.date] += tx.amount;
  });

  const data = Object.entries(grouped)
    .map(([date, amount]) => ({
      date,
      amount,
    }))
    .slice(-10);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">

      <div>

        <h2 className="text-2xl font-bold">
          Spending Trend
        </h2>

        <p className="mt-1 text-zinc-500">
          Daily debit activity
        </p>

      </div>

      <div className="h-[320px] mt-6">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <AreaChart data={data}>

            <defs>

              <linearGradient
                id="spend"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >

                <stop
                  offset="5%"
                  stopColor="#E8622A"
                  stopOpacity={0.8}
                />

                <stop
                  offset="95%"
                  stopColor="#E8622A"
                  stopOpacity={0}
                />

              </linearGradient>

            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#222"
            />

            <XAxis
              dataKey="date"
              stroke="#666"
            />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="amount"
              stroke="#E8622A"
              fillOpacity={1}
              fill="url(#spend)"
            />

          </AreaChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}
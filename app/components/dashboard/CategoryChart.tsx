// components/dashboard/CategoryChart.tsx

"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#E8622A",
  "#9B6FD8",
  "#2EB87A",
  "#06B6D4",
  "#F59E0B",
];

export default function CategoryChart({
  data,
}: any) {

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">

      <div>

        <h2 className="text-2xl font-bold">
          Category Breakdown
        </h2>

        <p className="mt-1 text-zinc-500">
          Spending distribution
        </p>

      </div>

      <div className="h-[320px] mt-6">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
            >

              {data.map(
                (
                  _: any,
                  index: number
                ) => (

                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index % COLORS.length
                      ]
                    }
                  />

                )
              )}

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}
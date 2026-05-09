// components/dashboard/TransactionCard.tsx

"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

export default function TransactionCard({
  tx,
}: any) {

  const isDebit =
    tx.type === "DEBIT";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-all p-5 flex items-center justify-between">

      <div className="flex items-center gap-4">

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isDebit
              ? "bg-red-500/10 text-red-400"
              : "bg-green-500/10 text-green-400"
          }`}
        >

          {isDebit
            ? <ArrowDownRight />
            : <ArrowUpRight />}

        </div>

        <div>

          <div className="font-semibold text-lg">
            {tx.description}
          </div>

          <div className="mt-1 text-sm text-zinc-500">
            {tx.category || "Other"}
          </div>

        </div>

      </div>

      <div className="text-right">

        <div
          className={`text-xl font-bold ${
            isDebit
              ? "text-red-400"
              : "text-green-400"
          }`}
        >
          {isDebit ? "-" : "+"}₹{tx.amount}
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          {tx.date}
        </div>

      </div>

    </div>
  );
}
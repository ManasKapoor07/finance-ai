
"use client";

import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Sparkles,
  Settings,
  Upload,
} from "lucide-react";

export default function Sidebar() {

  const items = [
    {
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      label: "Statements",
      icon: FileText,
    },
    {
      label: "Transactions",
      icon: CreditCard,
    },
    {
      label: "AI Insights",
      icon: Sparkles,
    },
    {
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden lg:flex w-[260px] border-r border-white/10 bg-white/[0.03] backdrop-blur-xl flex-col p-6">

      <div>

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E8622A] to-[#D4A017] flex items-center justify-center text-black font-bold">
            M
          </div>

          <div>
            <h1 className="text-xl font-bold">
              MoneyLens
            </h1>

            <p className="text-xs text-zinc-500">
              Financial Intelligence
            </p>
          </div>

        </div>

      </div>

      <div className="mt-12 space-y-3">

        {items.map((item) => {

          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <Icon className="w-5 h-5" />

              <span>
                {item.label}
              </span>
            </button>
          );
        })}

      </div>

      <div className="mt-auto">

        <button className="w-full h-14 rounded-2xl bg-[#E8622A] hover:bg-[#f0733c] transition-all flex items-center justify-center gap-2 font-semibold">
          <Upload className="w-4 h-4" />
          Upload Statement
        </button>

      </div>

    </aside>
  );
}
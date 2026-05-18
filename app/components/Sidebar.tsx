"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ── Icons ─────────────────────────────────────────────────────────────
const IconDashboard = () => (
  <svg
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconGoals = () => (
  <svg
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

const IconMessages = () => (
  <svg
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

// ── Nav Items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <IconDashboard />,
  },
  {
    href: "/goals",
    label: "Goals",
    icon: <IconGoals />,
  },
  // {
  //   href: "/dashboard/messages",
  //   label: "Messages",
  //   icon: <IconMessages />,
  // },
];

// ── Sidebar ───────────────────────────────────────────────────────────
interface SidebarProps {
  userName?: string;
  userEmail?: string;
}

export default function Sidebar({
  userName = "Manas",
  userEmail = "manas@example.com",
}: SidebarProps) {
  const pathname = usePathname();

  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 z-30 bg-white backdrop-blur-2xl border-r border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">

      {/* Glow */}
      <div className="absolute -top-20 -left-20 w-52 h-52 bg-violet-300/30 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 -right-10 w-40 h-40 bg-pink-300/20 blur-3xl rounded-full pointer-events-none" />

      {/* Logo */}
      <div className="relative h-16 px-6 flex items-center border-b border-zinc-100/80">
        <div>
          <p className="text-lg font-black tracking-tight text-zinc-900">
            money<span className="text-violet-500">lens</span>
          </p>

          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-400 mt-0.5">
            Finance OS
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex flex-col px-4 pt-6 flex-1">
        <p className="px-3 mb-3 text-[10px] font-black tracking-[0.22em] uppercase text-zinc-400">
          Navigation
        </p>

        <div className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 overflow-hidden
                ${
                  active
                    ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-white"
                }`}
              >
                {/* Active Glow */}
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 pointer-events-none" />
                )}

                <span
                  className={`relative z-10 transition-transform duration-200 group-hover:scale-110
                  ${active ? "text-white" : "text-zinc-400"}`}
                >
                  {item.icon}
                </span>

                <span className="relative z-10">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom User Card */}
      <div className="relative p-4">
        <div className="rounded-3xl bg-gradient-to-br from-white to-zinc-50 border border-zinc-100 p-3.5 shadow-sm">

          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-violet-500/20">
              {initials}
            </div>

            {/* User */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-zinc-800 truncate">
                {userName}
              </p>

              <p className="text-[11px] text-zinc-400 truncate">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

            <p className="text-[11px] font-bold text-emerald-600">
              AI insights active
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
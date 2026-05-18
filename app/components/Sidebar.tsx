"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// ── Icons ─────────────────────────────────────────────────────────────
const IconDashboard = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconGoals = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ── Nav Items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/goals",     label: "Goals",     icon: <IconGoals />     },
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
  const router = useRouter();
  const initials = userName.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/");
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 z-30 overflow-hidden border-r border-white/10 bg-[#080B14] backdrop-blur-2xl">

      {/* GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px]" />

      {/* GLOWS */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(110,231,183,0.12),rgba(59,130,246,0.06),transparent_70%)] blur-2xl" />
      <div className="absolute bottom-[-100px] right-[-60px] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.08),transparent_70%)] blur-2xl" />

      {/* Logo */}
      <div className="relative h-16 px-6 flex items-center border-b border-white/10">
        <div>
          <p className="font-[Bricolage_Grotesque] text-[22px] font-bold tracking-[-0.04em] text-white">
            money<span className="text-[#6EE7B7]">lens</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">
            Finance OS
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex flex-col px-4 pt-6 flex-1">
        <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#6EE7B7]">
          Navigation
        </p>
        <div className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300
                  ${active
                    ? "border border-[#6EE7B7]/20 bg-[linear-gradient(135deg,rgba(110,231,183,0.12),rgba(34,211,238,0.06))] text-white shadow-[0_10px_30px_rgba(110,231,183,0.08)]"
                    : "border border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
              >
                {active && (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(110,231,183,0.10),transparent_70%)]" />
                )}
                <span className={`relative z-10 transition-all duration-200 ${active ? "text-[#6EE7B7]" : "text-white/35 group-hover:text-white/80"}`}>
                  {item.icon}
                </span>
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom User Card */}
      <div className="relative p-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-xl">

          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6EE7B7,#22D3EE)] text-xs font-black text-[#080B14] shadow-[0_10px_30px_rgba(110,231,183,0.22)] shrink-0">
              {initials}
            </div>
            {/* User info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{userName}</p>
              <p className="truncate text-[11px] text-white/35">{userEmail}</p>
            </div>
            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/35 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            >
              <IconLogout />
            </button>
          </div>

          {/* Status */}
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#6EE7B7]/10 bg-[#6EE7B7]/10 px-3 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#6EE7B7]" />
            <p className="text-[11px] font-semibold text-[#6EE7B7]">AI insights active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
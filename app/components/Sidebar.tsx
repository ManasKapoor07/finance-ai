"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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

const IconFeedback = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    <line x1="9" y1="10" x2="15" y2="10" />
    <line x1="9" y1="14" x2="13" y2="14" />
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconMenu = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// ── Nav Items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { href: "/goals",     label: "Goals",     icon: <IconGoals />     },
  { href: "/feedback",  label: "Feedback",  icon: <IconFeedback />  },
];

// ── Shared Nav Link ───────────────────────────────────────────────────
function NavLink({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[0];
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300
        ${
          active
            ? "border border-[#6EE7B7]/20 bg-[linear-gradient(135deg,rgba(110,231,183,0.12),rgba(34,211,238,0.06))] text-white shadow-[0_10px_30px_rgba(110,231,183,0.08)]"
            : "border border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
        }`}
    >
      {active && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(110,231,183,0.10),transparent_70%)]" />
      )}
      <span
        className={`relative z-10 transition-all duration-200 ${
          active ? "text-[#6EE7B7]" : "text-white/35 group-hover:text-white/80"
        }`}
      >
        {item.icon}
      </span>
      <span className="relative z-10">{item.label}</span>
    </Link>
  );
}

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

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/");
  };

  const SidebarInner = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px]" />
      {/* Glows */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(110,231,183,0.12),rgba(59,130,246,0.06),transparent_70%)] blur-2xl" />
      <div className="absolute bottom-[-100px] right-[-60px] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.08),transparent_70%)] blur-2xl" />

      {/* Logo */}
      <div className="relative h-16 px-6 flex items-center border-b border-white/10 flex-shrink-0">
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
      <nav className="relative flex flex-col px-4 pt-6 flex-1 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#6EE7B7]">
          Navigation
        </p>
        <div className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <NavLink
                key={item.href}
                item={item}
                active={active}
                onClick={onNavClick}
              />
            );
          })}
        </div>
      </nav>

      {/* User Card */}
      <div className="relative p-4 flex-shrink-0">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6EE7B7,#22D3EE)] text-xs font-black text-[#080B14] shadow-[0_10px_30px_rgba(110,231,183,0.22)] shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{userName}</p>
              <p className="truncate text-[11px] text-white/35">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/35 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            >
              <IconLogout />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#6EE7B7]/10 bg-[#6EE7B7]/10 px-3 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#6EE7B7]" />
            <p className="text-[11px] font-semibold text-[#6EE7B7]">
              AI insights active
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar (lg+) ───────────────────────────────────── */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 z-30 overflow-hidden flex-col border-r border-white/10 bg-[#080B14] backdrop-blur-2xl">
        <SidebarInner />
      </aside>

      {/* ── Mobile top bar (< lg) ───────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 border-b border-white/10 bg-[#080B14]/95 backdrop-blur-2xl">
        <p className="font-[Bricolage_Grotesque] text-[20px] font-bold tracking-[-0.04em] text-white">
          money<span className="text-[#6EE7B7]">lens</span>
        </p>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:text-white"
          aria-label="Open menu"
        >
          <IconMenu />
        </button>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────────────── */}
      <div
        className={`lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col bg-[#080B14] border-r border-white/10 overflow-hidden transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/50 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <IconClose />
        </button>
        <SidebarInner onNavClick={() => setMobileOpen(false)} />
      </div>

      {/* ── Mobile bottom tab bar ───────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/10 bg-[#080B14]/95 backdrop-blur-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 px-5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                active
                  ? "text-[#6EE7B7]"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              <span className={active ? "text-[#6EE7B7]" : "text-white/30"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-red-400 transition-colors"
        >
          <IconLogout />
          Logout
        </button>
      </nav>
    </>
  );
}
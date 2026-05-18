"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// ── Icons ─────────────────────────────────────────────────────────────
const IconUpload = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconChevron = () => (
  <svg
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    viewBox="0 0 24 24"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconSparkles = () => (
  <svg
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
  </svg>
);

// ── Nav Items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/goals", label: "Goals" },
  { href: "/dashboard/messages", label: "Messages" },
];

// ── Profile Dropdown ──────────────────────────────────────────────────
function ProfileDropdown({
  name,
  email,
  onClose,
}: {
  name: string;
  email: string;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-3 w-60 rounded-3xl bg-white border border-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden z-50 backdrop-blur-2xl">

      {/* Top */}
      <div className="p-4 border-b border-zinc-100 bg-gradient-to-br from-violet-50 to-pink-50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-violet-500/20">
            {name.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black text-zinc-800 truncate">
              {name}
            </p>

            <p className="text-[11px] text-zinc-400 truncate">
              {email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="p-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-zinc-50 transition-all text-sm font-semibold text-zinc-700">
          <span className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-500">
            ✨
          </span>
          AI Preferences
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-zinc-50 transition-all text-sm font-semibold text-zinc-700">
          <span className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-500">
            ⚙️
          </span>
          Settings
        </button>

        <button
          onClick={onClose}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-rose-50 transition-all text-sm font-semibold text-rose-500"
        >
          <span className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
            ↗
          </span>
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Top Navbar ────────────────────────────────────────────────────────
interface TopNavbarProps {
  userName?: string;
  userEmail?: string;
  onUploadClick?: () => void;
}

export default function TopNavbar({
  userName = "Manas",
  userEmail = "manas@example.com",
  onUploadClick,
}: TopNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);

  const initials = userName.slice(0, 2).toUpperCase();

  const currentPage =
    NAV_ITEMS.find(
      (n) =>
        pathname === n.href ||
        pathname.startsWith(n.href + "/")
    )?.label ?? "Dashboard";

  return (
    <header className="sticky top-0 z-50 h-16 px-6 flex items-center justify-between bg-white backdrop-blur-2xl border-b border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">

      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/3 w-72 h-32 bg-violet-300/10 blur-3xl rounded-full pointer-events-none" />

      {/* Left */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="px-2 py-1 rounded-full bg-violet-100 text-violet-600 text-[10px] font-black tracking-wider uppercase">
            AI Powered
          </span>

          <div className="flex items-center gap-1 text-emerald-500 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>

        
      </div>

      {/* Right */}
      <div className="relative flex items-center gap-3">

        {/* AI Search / Hint */}
        {/* <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-zinc-100 shadow-sm">
          <IconSparkles />

          <span className="text-xs font-semibold text-zinc-400">
            Ask AI about your spending...
          </span>
        </div> */}

        {/* Upload */}
        <button
          onClick={()=> router.push("/upload")}
          className="group relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 text-white text-xs font-black shadow-lg shadow-zinc-900/10 hover:scale-[1.03] transition-all duration-200"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

          <span className="relative z-10">
            <IconUpload />
          </span>

          <span className="relative z-10">
            Upload Statement
          </span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="group flex items-center gap-3 px-2 py-1.5 rounded-2xl hover:bg-white transition-all border border-transparent hover:border-zinc-100"
          >
            {/* Avatar */}
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-violet-500/20">
                {initials}
              </div>

              {/* Online Dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
            </div>

            {/* User */}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-black text-zinc-800 leading-none">
                {userName}
              </p>

              <p className="text-[11px] text-zinc-400 mt-1">
                Premium Member
              </p>
            </div>

            {/* Chevron */}
            <span
              className={`text-zinc-400 transition-transform duration-200 ${
                profileOpen ? "rotate-180" : ""
              }`}
            >
              <IconChevron />
            </span>
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />

              <div className="relative z-50">
                <ProfileDropdown
                  name={userName}
                  email={userEmail}
                  onClose={() => setProfileOpen(false)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
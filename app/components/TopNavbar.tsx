"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGetMeQuery } from "../redux/api/authApi";

// ── Icons ─────────────────────────────────────────────────────────────
const IconUpload = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconSparkles = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
  </svg>
);

// // ── Profile Dropdown ──────────────────────────────────────────────────
// function ProfileDropdown({ name, email, onClose }: { name: string; email: string; onClose: () => void }) {
//   return (
//     <div className="absolute right-0 top-full mt-3 w-60 rounded-3xl bg-[#10141F] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden z-50 backdrop-blur-2xl">
//       <div className="p-4 border-b border-white/10 bg-gradient-to-br from-[#6EE7B7]/10 to-[#22D3EE]/10">
//         <div className="flex items-center gap-3">
//           <div className="w-11 h-11 rounded-2xl bg-[linear-gradient(135deg,#6EE7B7,#22D3EE)] flex items-center justify-center text-[#080B14] text-xs font-black shadow-lg shadow-[#6EE7B7]/20">
//             {name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
//           </div>
//           <div className="min-w-0">
//             <p className="text-sm font-black text-white truncate">{name}</p>
//             <p className="text-[11px] text-white/40 truncate">{email}</p>
//           </div>
//         </div>
//       </div>
//       <div className="p-2">
//         <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/[0.04] transition-all text-sm font-semibold text-white/80">
//           <span className="w-8 h-8 rounded-xl bg-[#6EE7B7]/10 flex items-center justify-center text-[#6EE7B7]"><IconSparkles /></span>
//           AI Preferences
//         </button>
//         <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/[0.04] transition-all text-sm font-semibold text-white/80">
//           <span className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">⚙️</span>
//           Settings
//         </button>
//         <button onClick={onClose} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-rose-500/10 transition-all text-sm font-semibold text-rose-400">
//           <span className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">↗</span>
//           Sign out
//         </button>
//       </div>
//     </div>
//   );
// }

// ── Top Navbar ────────────────────────────────────────────────────────
interface TopNavbarProps {
  onUploadClick?: () => void;
}

export default function TopNavbar({ onUploadClick }: TopNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: user, error } = useGetMeQuery({});
  const userData = user?.data;
  const fullName = userData?.fullName || "Manas Kapoor";
  const email = userData?.email || "manas@example.com";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    if (user) console.log("User data:", user);
    if (error) console.error("Failed to fetch user data:", error);
  }, [user, error]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".profile-dropdown-root")) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  return (
    /*
     * On mobile (< lg) this navbar sits BELOW the Sidebar's mobile top bar (z-40),
     * so it's hidden there — the Sidebar renders its own mobile top bar.
     * On desktop (lg+) this shows as the full-width top header beside the sidebar.
     */
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#080B14]/95 px-4 sm:px-6 backdrop-blur-2xl">

      {/* GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:56px_56px]" />

      {/* AMBIENT GLOW */}
      <div className="absolute left-1/3 top-[-80px] h-40 w-72 rounded-full bg-[radial-gradient(circle,rgba(110,231,183,0.10),rgba(59,130,246,0.04),transparent_70%)] blur-3xl" />

      {/* Left — badges */}
      <div className="relative z-10 flex items-center gap-2">
        <span className="rounded-full border border-[#6EE7B7]/15 bg-[#6EE7B7]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6EE7B7] hidden xs:inline-flex">
          AI Powered
        </span>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#6EE7B7]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#6EE7B7]" />
          <span className="hidden sm:inline">Live</span>
        </div>
      </div>

      {/* Right */}
      <div className="relative z-10 flex items-center gap-2 sm:gap-3">

        {/* Upload — full label on sm+, icon-only on xs */}
        <button
          onClick={() => { if (onUploadClick) onUploadClick(); else router.push("/upload"); }}
          className="group relative overflow-hidden rounded-2xl border border-[#6EE7B7]/20 bg-[linear-gradient(135deg,rgba(110,231,183,0.16),rgba(34,211,238,0.08))] px-3 sm:px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_30px_rgba(110,231,183,0.08)] transition-all duration-300 hover:scale-[1.03]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(110,231,183,0.16),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative z-10 flex items-center gap-2">
            <IconUpload />
            {/* Hide label on very small screens */}
            <span className="hidden sm:inline">Upload Statement</span>
          </div>
        </button>

        {/* Profile */}
        <div className="relative profile-dropdown-root">
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="group flex items-center gap-2 sm:gap-3 rounded-2xl border border-transparent bg-white/[0.03] px-2 py-1.5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.05]"
          >
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6EE7B7,#22D3EE)] text-xs font-black text-[#080B14] shadow-[0_10px_30px_rgba(110,231,183,0.22)]">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border-2 border-[#080B14] bg-[#6EE7B7]" />
            </div>
            {/* Name — only on sm+ */}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold leading-none text-white">{fullName}</p>
              <p className="mt-1 text-[11px] text-white/35">{email}</p>
            </div>
          </button>

          {/* {profileOpen && (
            <ProfileDropdown name={fullName} email={email} onClose={() => setProfileOpen(false)} />
          )} */}
        </div>
      </div>
    </header>
  );
}
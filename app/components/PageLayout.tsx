"use client";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface PageLayoutProps {
  children: React.ReactNode;
  onUploadClick?: () => void;
}

export default function PageLayout({ children, onUploadClick }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#080B14]">
      {/*
        Sidebar renders:
          - lg+: fixed left column (w-64)
          - <lg: fixed top bar (h-14) + slide-in drawer + bottom tab bar
      */}
      <Sidebar />

      {/*
        Main area:
          - lg+: offset left by sidebar width (pl-64), no top padding from sidebar
          - <lg: offset top by mobile top bar (pt-14), offset bottom by tab bar (pb-16)
      */}
      <div className="lg:pl-64">
        {/* TopNavbar — shown on lg+ only (mobile top bar is inside Sidebar) */}
        <div className="hidden lg:block">
          <TopNavbar onUploadClick={onUploadClick} />
        </div>

        {/* Page content — extra bottom padding on mobile for tab bar clearance */}
        <main className="pt-14 lg:pt-0 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
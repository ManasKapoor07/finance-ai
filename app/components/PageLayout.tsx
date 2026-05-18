"use client";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        <TopNavbar />
        <main className="">
          {children}
        </main>

      </div>
    </div>
  );
}
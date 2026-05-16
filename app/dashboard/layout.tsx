"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import UploadModal from "../components/UploadModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f8fc",
        display: "flex",
        fontFamily: "'Inter','DM Sans',sans-serif",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Topbar
          onUploadClick={() => setShowUpload(true)}
        />

        <main
          style={{
            flex: 1,
            overflow: "auto",
          }}
        >
          {children}
        </main>
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
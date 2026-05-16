"use client";

import {
    AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  FileCheck,
  Loader2,
  Lock,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useUploadStatementMutation } from "../redux/api/authApi";
import { useRouter } from "next/router";

interface Props {
  title?: string;
  subtitle?: string;
  onUploadClick?: () => void;
}

export default function Topbar({
  periodFrom,
  periodTo,
  onUploadClick,
}: {
  periodFrom?: string;
  periodTo?: string;
  onUploadClick?: () => void;
}) {
    const BANKS = ["HDFC", "ICICI", "AXIS", "SBI", "PNB", "OTHER"];
    
    function UploadModal({ onClose }: { onClose: () => void }) {
      const router = useRouter();
      const [uploadStatement] = useUploadStatementMutation();
    
      const [status,   setStatus]   = useState<"idle"|"dragging"|"selected"|"uploading"|"success"|"error">("idle");
      const [file,     setFile]     = useState<File | null>(null);
      const [password, setPassword] = useState("");
      const [bankName, setBankName] = useState("");
      const [progress, setProgress] = useState(0);
      const [errorMsg, setErrorMsg] = useState("");
      const fileInputRef = useRef<HTMLInputElement>(null);
    
      const isPdf = file?.name.toLowerCase().endsWith(".pdf");
    
      useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
      }, [onClose]);
    
      const validateFile = (f: File): string | null => {
        if (f.size > 10 * 1024 * 1024) return "File too large. Max size is 10MB.";
        const ext = "." + f.name.split(".").pop()?.toLowerCase();
        if (![".pdf", ".csv", ".xlsx"].includes(ext)) return "Only PDF, CSV, or Excel files are accepted.";
        return null;
      };
    
      const selectFile = (f: File) => {
        const err = validateFile(f);
        if (err) { setErrorMsg(err); setStatus("error"); return; }
        setFile(f); setErrorMsg(""); setPassword(""); setStatus("selected");
      };
    
      const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) selectFile(f); else setStatus("idle");
      }, []);
    
      const clearFile = () => {
        setFile(null); setStatus("idle"); setErrorMsg("");
        setProgress(0); setPassword("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
    
      const handleUpload = async () => {
        if (!file) return;
        if (!bankName) { setErrorMsg("Please select your bank."); return; }
    
        setStatus("uploading");
        setProgress(0);
        setErrorMsg("");
    
        const interval = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 200);
    
        try {
          const response: any = await uploadStatement({
            file,
            password: password || undefined,
            bankName,
          }).unwrap();
    
          clearInterval(interval);
          setProgress(100);
          setStatus("success");
          toast.success("Statement uploaded successfully!");
    
          const statementId = response?.data?.statementId ?? response?.data?.id ?? response?.id ?? null;
          setTimeout(() => { onClose(); if (statementId) router.push(`/dashboard/${statementId}`); }, 1200);
    
        } catch (err: any) {
          clearInterval(interval);
          setStatus("error");
          const msg = err?.data?.message ?? err?.message ?? "Upload failed. Please try again.";
          setErrorMsg(msg);
          toast.error(msg);
        }
      };
    
      const fileSizeMB  = file ? (file.size / (1024 * 1024)).toFixed(2) : null;
      const isDragging  = status === "dragging";
    
      return (
        <div
          onClick={onClose}
          style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width:"100%", maxWidth:"480px", background:"#fff", borderRadius:"24px", boxShadow:"0 24px 80px rgba(0,0,0,0.18)", overflow:"hidden", animation:"modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:"1px solid #f0f0f0" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:"linear-gradient(135deg,#4f6ef7,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <CloudUpload size={16} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize:"14px", fontWeight:800, color:"#111", letterSpacing:"-0.02em" }}>Upload Statement</p>
                  <p style={{ fontSize:"11px", color:"#9ca3af" }}>PDF, CSV, or Excel · Max 10MB</p>
                </div>
              </div>
              <button onClick={onClose} style={{ width:"32px", height:"32px", borderRadius:"8px", background:"#f9fafb", border:"1px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <X size={14} color="#6b7280" />
              </button>
            </div>
    
            {/* Body */}
            <div style={{ padding:"24px" }}>
    
              {/* Bank selector — always visible unless uploading/success/error */}
              {(status === "idle" || status === "dragging" || status === "selected") && (
                <div style={{ marginBottom:"16px" }}>
                  <label style={{ fontSize:"12px", fontWeight:700, color:"#374151", display:"block", marginBottom:"6px" }}>
                    Bank <span style={{ color:"#ef4444" }}>*</span>
                  </label>
                  <div style={{ position:"relative" }}>
                    <select
                      value={bankName}
                      onChange={e => { setBankName(e.target.value); setErrorMsg(""); }}
                      style={{ width:"100%", height:"40px", borderRadius:"10px", border:"1px solid #e5e7eb", padding:"0 32px 0 12px", fontSize:"12px", fontWeight:600, color: bankName ? "#111" : "#9ca3af", background:"#f9fafb", outline:"none", appearance:"none", cursor:"pointer", fontFamily:"inherit" }}
                    >
                      <option value="">— Select your bank —</option>
                      {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown size={13} color="#9ca3af" style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                  </div>
                </div>
              )}
    
              {/* Drop zone */}
              {(status === "idle" || status === "dragging") && (
                <div
                  onDragOver={e => { e.preventDefault(); setStatus("dragging"); }}
                  onDragLeave={() => setStatus("idle")}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border:`2px dashed ${isDragging ? "#4f6ef7" : "#e5e7eb"}`, borderRadius:"16px", padding:"32px 24px", textAlign:"center", cursor:"pointer", background: isDragging ? "#eef1ff" : "#f9fafb", transition:"all 0.18s ease", marginBottom:"16px" }}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,.csv,.xlsx" onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f); }} style={{ display:"none" }} />
                  <div style={{ width:"48px", height:"48px", borderRadius:"12px", background:"#eef1ff", margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <CloudUpload size={22} color="#4f6ef7" />
                  </div>
                  <p style={{ fontSize:"13px", fontWeight:700, color:"#111", marginBottom:"4px" }}>
                    {isDragging ? "Drop your statement" : "Drop your statement here"}
                  </p>
                  <p style={{ fontSize:"11px", color:"#9ca3af" }}>or click to browse · PDF, CSV, Excel</p>
                </div>
              )}
    
              {/* Selected */}
              {status === "selected" && file && (
                <>
                  <div style={{ border:"2px dashed #c7d2fe", borderRadius:"16px", padding:"24px", textAlign:"center", marginBottom:"16px", background:"#f8faff" }}>
                    <div style={{ width:"48px", height:"48px", borderRadius:"12px", background:"#eef1ff", margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <FileCheck size={22} color="#4f6ef7" />
                    </div>
                    <p style={{ fontSize:"13px", fontWeight:700, color:"#111", marginBottom:"4px" }}>{file.name}</p>
                    <p style={{ fontSize:"11px", color:"#9ca3af", marginBottom:"12px" }}>{fileSizeMB} MB</p>
                    <button onClick={clearFile} style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"5px 12px", borderRadius:"8px", border:"1px solid #e5e7eb", background:"#fff", fontSize:"11px", fontWeight:600, color:"#6b7280", cursor:"pointer", fontFamily:"inherit" }}>
                      <X size={11} /> Remove file
                    </button>
                  </div>
    
                  {isPdf && (
                    <div style={{ marginBottom:"16px" }}>
                      <label style={{ fontSize:"12px", fontWeight:700, color:"#374151", display:"block", marginBottom:"6px" }}>
                        PDF Password <span style={{ color:"#9ca3af", fontWeight:400 }}>(if protected)</span>
                      </label>
                      <div style={{ position:"relative" }}>
                        <Lock />
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Enter PDF password"
                          style={{ width:"100%", height:"40px", borderRadius:"10px", border:"1px solid #e5e7eb", paddingLeft:"32px", paddingRight:"12px", fontSize:"12px", outline:"none", fontFamily:"inherit", background:"#f9fafb" }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
    
              {/* Uploading */}
              {status === "uploading" && (
                <div style={{ textAlign:"center", padding:"24px 0", marginBottom:"16px" }}>
                  <div style={{ width:"48px", height:"48px", borderRadius:"12px", background:"#eef1ff", margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Loader2 size={22} color="#4f6ef7" style={{ animation:"spin 1s linear infinite" }} />
                  </div>
                  <p style={{ fontSize:"13px", fontWeight:700, color:"#111", marginBottom:"16px" }}>Uploading statement…</p>
                  <div style={{ height:"6px", borderRadius:"100px", background:"#f3f4f6", overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:"100px", background:"linear-gradient(90deg,#4f6ef7,#7c3aed)", width:`${progress}%`, transition:"width 0.3s ease" }} />
                  </div>
                  <p style={{ fontSize:"11px", color:"#9ca3af", marginTop:"8px" }}>{progress}%</p>
                </div>
              )}
    
              {/* Success */}
              {status === "success" && (
                <div style={{ textAlign:"center", padding:"24px 0", marginBottom:"16px" }}>
                  <div style={{ width:"48px", height:"48px", borderRadius:"12px", background:"#ecfdf5", margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <CheckCircle2 size={22} color="#059669" />
                  </div>
                  <p style={{ fontSize:"13px", fontWeight:700, color:"#111" }}>Upload Complete!</p>
                  <p style={{ fontSize:"11px", color:"#9ca3af", marginTop:"4px" }}>Redirecting to dashboard…</p>
                </div>
              )}
    
              {/* Error */}
              {status === "error" && (
                <div style={{ textAlign:"center", padding:"24px 0", marginBottom:"16px" }}>
                  <div style={{ width:"48px", height:"48px", borderRadius:"12px", background:"#fef2f2", margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <AlertTriangle size={22} color="#dc2626" />
                  </div>
                  <p style={{ fontSize:"13px", fontWeight:700, color:"#111" }}>Upload Failed</p>
                  <p style={{ fontSize:"12px", color:"#dc2626", marginTop:"4px", marginBottom:"12px" }}>{errorMsg}</p>
                  <button onClick={clearFile} style={{ padding:"6px 16px", borderRadius:"8px", border:"1px solid #e5e7eb", background:"#f9fafb", fontSize:"12px", fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>
                    Try Again
                  </button>
                </div>
              )}
    
              {/* Hint */}
              {(status === "idle" || status === "dragging" || status === "selected") && (
                <div style={{ display:"flex", alignItems:"center", gap:"8px", background:"#f8f7ff", border:"1px solid #e9e4ff", borderRadius:"10px", padding:"10px 14px", marginBottom:"20px" }}>
                  <AlertTriangle size={13} color="#7c3aed" />
                  <p style={{ fontSize:"11px", color:"#6b7280", lineHeight:1.5 }}>
                    Supports <strong style={{ color:"#374151" }}>PDF</strong>, <strong style={{ color:"#374151" }}>CSV</strong>, and <strong style={{ color:"#374151" }}>Excel</strong>. Duplicates are auto-detected.
                  </p>
                </div>
              )}
    
              {/* Actions */}
              {(status === "idle" || status === "dragging" || status === "selected") && (
                <>
                  {errorMsg && <p style={{ fontSize:"11px", color:"#dc2626", marginBottom:"10px", textAlign:"center" }}>{errorMsg}</p>}
                  <div style={{ display:"flex", gap:"10px" }}>
                    <button onClick={onClose} style={{ flex:1, height:"44px", borderRadius:"12px", background:"#f9fafb", border:"1px solid #e5e7eb", fontSize:"13px", fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={status !== "selected" || !bankName}
                      style={{ flex:2, height:"44px", borderRadius:"12px", background: (status === "selected" && bankName) ? "linear-gradient(135deg,#4f6ef7,#7c3aed)" : "#e5e7eb", border:"none", fontSize:"13px", fontWeight:700, color: (status === "selected" && bankName) ? "#fff" : "#9ca3af", cursor: (status === "selected" && bankName) ? "pointer" : "not-allowed", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}
                    >
                      <Upload size={14} />
                      Analyse My Statement
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

     const [showUpload, setShowUpload] = useState(false);
     
    function formatPeriodLabel(from: string, to: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  const a = new Date(from).toLocaleDateString("en-IN", opts);
  const b = new Date(to).toLocaleDateString("en-IN", opts);
  return a === b ? a : `${a} – ${b}`;
}
  return (
    <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 24px", background:"#fff", borderBottom:"1px solid #f0f0f0" }}>
      <div>
        <h1 style={{ fontSize:"18px", fontWeight:800, color:"#111", letterSpacing:"-0.02em" }}>Dashboard</h1>
        <p style={{ fontSize:"12px", color:"#9ca3af", marginTop:"1px" }}>
          Dashboard › Transactions · {periodFrom && periodTo ? formatPeriodLabel(periodFrom, periodTo) : "—"}
        </p>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:"10px", padding:"8px 12px" }}>
          <Search size={13} color="#9ca3af" />
          <span style={{ fontSize:"12px", color:"#9ca3af" }}>Search</span>
          <span style={{ fontSize:"10px", color:"#d1d5db", background:"#f3f4f6", padding:"1px 5px", borderRadius:"4px", marginLeft:"4px" }}>⌘/</span>
        </div>

        {/* ── Upload Statement button ── */}
        {onUploadClick && (
        <button
            onClick={onUploadClick}
            style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 16px",
            borderRadius: "14px",
            background:
                "linear-gradient(135deg,#4f46e5,#7c3aed)",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "12px",
            fontWeight: 700,
            color: "#fff",
            boxShadow:
                "0 10px 30px rgba(79,70,229,0.25)",
            transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
            e.currentTarget.style.transform =
                "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
            e.currentTarget.style.transform =
                "translateY(0)";
            }}
        >
            <Upload size={14} />
            Upload Statement
        </button>
)}

        <div style={{ display:"flex", alignItems:"center", gap:"5px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:"10px", padding:"8px 12px", fontSize:"12px", color:"#374151" }}>
          🌐 English
        </div>
        <button style={{ width:"36px", height:"36px", borderRadius:"10px", background:"#f9fafb", border:"1px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <Bell size={15} color="#6b7280" />
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:"linear-gradient(135deg,#4f6ef7,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:"12px" }}>JS</div>
          <div>
            <p style={{ fontSize:"12px", fontWeight:700, color:"#111" }}>Jhon Smith</p>
            <p style={{ fontSize:"10px", color:"#9ca3af" }}>Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
"use client";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  FileCheck,
  FileText,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useUploadStatementMutation } from "../redux/api/authApi";
import { useRouter } from "next/navigation";

interface UploadModalProps {
  onClose: () => void;
}

const BANKS = ["HDFC", "ICICI", "AXIS", "SBI", "PNB", "OTHER"];

export default function UploadModal({ onClose }: UploadModalProps) {
  const router = useRouter();
  const [uploadStatement] = useUploadStatementMutation();
  const [status, setStatus] = useState<
    "idle" | "dragging" | "selected" | "uploading" | "success" | "error"
  >("idle");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [bankName, setBankName] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPdf = file?.name.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const validateFile = (f: File): string | null => {
    if (f.size > 10 * 1024 * 1024) return "File too large. Max size is 10MB.";
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (![".pdf", ".csv", ".xlsx"].includes(ext))
      return "Only PDF, CSV, or Excel files are accepted.";
    return null;
  };

  const selectFile = (f: File) => {
    const err = validateFile(f);
    if (err) { setErrorMsg(err); setStatus("error"); return; }
    setFile(f);
    setErrorMsg("");
    setPassword("");
    setStatus("selected");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f); else setStatus("idle");
  }, []);

  const clearFile = () => {
    setFile(null);
    setStatus("idle");
    setErrorMsg("");
    setProgress(0);
    setPassword("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!bankName) { setErrorMsg("Please select your bank."); return; }
    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 8, 85));
    }, 200);
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
      const statementId =
        response?.data?.statementId ?? response?.data?.id ?? response?.id ?? null;
      setTimeout(() => {
        onClose();
        if (statementId) router.push(`/dashboard/${statementId}`);
      }, 1200);
    } catch (err: any) {
      clearInterval(interval);
      setStatus("error");
      const msg = err?.data?.message ?? err?.message ?? "Upload failed. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : null;
  const isDragging = status === "dragging";
  const isUploading = status === "uploading";
  const isSuccess = status === "success";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "520px",
          background: "rgba(255,255,255,0.97)",
          borderRadius: "32px", overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 40px 120px rgba(15,23,42,0.18)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 28px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "18px",
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 12px 30px rgba(79,70,229,0.25)",
            }}>
              <CloudUpload size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>
                Upload Statement
              </h2>
              <p style={{ fontSize: "12px", color: "#94a3b8" }}>PDF, CSV or Excel • Max 10MB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "38px", height: "38px", borderRadius: "12px",
              border: "1px solid #e2e8f0", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} color="#64748b" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "28px" }}>

          {/* SUCCESS STATE */}
          {isSuccess && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: "72px", height: "72px", borderRadius: "50%",
                background: "linear-gradient(135deg,#10b981,#059669)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 16px 40px rgba(16,185,129,0.25)",
              }}>
                <CheckCircle2 size={34} color="#fff" />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
                Upload Successful!
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b" }}>
                Redirecting to your dashboard...
              </p>
            </div>
          )}

          {/* UPLOADING STATE */}
          {isUploading && (
            <div style={{ padding: "12px 0" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "16px", borderRadius: "16px",
                background: "#f8fafc", border: "1px solid #e2e8f0",
                marginBottom: "20px",
              }}>
                <div style={{
                  width: "42px", height: "42px", borderRadius: "12px",
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <FileText size={20} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "2px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file?.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>{fileSizeMB} MB</p>
                </div>
                <Loader2 size={20} color="#4f46e5" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Uploading & analyzing...</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#4f46e5" }}>{progress}%</span>
              </div>
              <div style={{ height: "8px", borderRadius: "99px", background: "#e2e8f0", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "99px",
                  background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
                  width: `${progress}%`,
                  transition: "width 0.3s ease",
                }} />
              </div>
            </div>
          )}

          {/* IDLE / DRAGGING / SELECTED / ERROR STATES */}
          {!isUploading && !isSuccess && (
            <>
              {/* Bank selector */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{
                  display: "block", marginBottom: "8px",
                  fontSize: "12px", fontWeight: 700, color: "#334155",
                }}>
                  Select Bank
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{
                      width: "100%", height: "48px", borderRadius: "14px",
                      border: `1px solid ${!bankName && errorMsg === "Please select your bank." ? "#ef4444" : "#e2e8f0"}`,
                      padding: "0 40px 0 16px", background: "#f8fafc",
                      fontSize: "13px", fontWeight: 600, outline: "none",
                      appearance: "none", color: bankName ? "#111827" : "#94a3b8",
                    }}
                  >
                    <option value="">Choose your bank</option>
                    {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown size={16} color="#94a3b8" style={{
                    position: "absolute", right: "14px", top: "50%",
                    transform: "translateY(-50%)", pointerEvents: "none",
                  }} />
                </div>
              </div>

              {/* Drop zone — only when no file selected */}
              {(status === "idle" || status === "dragging") && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setStatus("dragging"); }}
                  onDragLeave={() => setStatus("idle")}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? "#4f46e5" : "#cbd5e1"}`,
                    borderRadius: "24px", padding: "42px 28px", textAlign: "center",
                    background: isDragging ? "#eef2ff" : "#f8fafc",
                    cursor: "pointer", transition: "all 0.2s ease", marginBottom: "18px",
                  }}
                >
                  <input
                    ref={fileInputRef} type="file" accept=".pdf,.csv,.xlsx"
                    style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f); }}
                  />
                  <div style={{
                    width: "70px", height: "70px", borderRadius: "22px",
                    background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 18px",
                    boxShadow: "0 16px 40px rgba(79,70,229,0.25)",
                  }}>
                    <CloudUpload size={30} color="#fff" />
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
                    {isDragging ? "Drop your statement" : "Drag & drop statement"}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>or click to browse files</p>
                </div>
              )}

              {/* File selected card */}
              {status === "selected" && file && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "16px", borderRadius: "16px",
                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                  marginBottom: "18px",
                }}>
                  <div style={{
                    width: "42px", height: "42px", borderRadius: "12px",
                    background: "linear-gradient(135deg,#10b981,#059669)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <FileCheck size={20} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "13px", fontWeight: 700, color: "#111827",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      marginBottom: "2px",
                    }}>
                      {file.name}
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>{fileSizeMB} MB</p>
                  </div>
                  <button
                    onClick={clearFile}
                    style={{
                      width: "30px", height: "30px", borderRadius: "8px",
                      border: "1px solid #e2e8f0", background: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    <X size={14} color="#64748b" />
                  </button>
                </div>
              )}

              {/* Password field for PDFs */}
              {status === "selected" && isPdf && (
                <div style={{ marginBottom: "18px" }}>
                  <label style={{
                    display: "block", marginBottom: "8px",
                    fontSize: "12px", fontWeight: 700, color: "#334155",
                  }}>
                    PDF Password <span style={{ color: "#94a3b8", fontWeight: 400 }}>(if protected)</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={15} color="#94a3b8" style={{
                      position: "absolute", left: "14px", top: "50%",
                      transform: "translateY(-50%)", pointerEvents: "none",
                    }} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (optional)"
                      style={{
                        width: "100%", height: "48px", borderRadius: "14px",
                        border: "1px solid #e2e8f0", paddingLeft: "40px",
                        paddingRight: "16px", background: "#f8fafc",
                        fontSize: "13px", outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Error message */}
              {/* Error message */}
{errorMsg && (
  <div style={{
    padding: "16px", borderRadius: "12px",
    background: "#fef2f2", border: "1px solid #fecaca",
    marginBottom: "18px",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
      <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
      <p style={{ fontSize: "13px", color: "#dc2626", fontWeight: 500 }}>{errorMsg}</p>
    </div>
    <button
      onClick={() => {
        setErrorMsg("");
        setStatus(file ? "selected" : "idle");
        setProgress(0);
      }}
      style={{
        width: "100%", height: "40px", borderRadius: "10px",
        border: "1px solid #fecaca", background: "#fff",
        color: "#dc2626", fontSize: "13px", fontWeight: 700,
        cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", gap: "6px",
      }}
    >
      <Loader2 size={14} color="#dc2626" />
      Try Again
    </button>
  </div>
)}

              {/* Upload button */}
              {status === "selected" && (
                <button
                  onClick={handleUpload}
                  style={{
                    width: "100%", height: "52px", borderRadius: "16px",
                    border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                    color: "#fff", fontSize: "15px", fontWeight: 700,
                    boxShadow: "0 12px 30px rgba(79,70,229,0.3)",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Analyze Statement
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
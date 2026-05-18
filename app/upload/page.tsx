"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Lock, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUploadStatementMutation } from "../redux/api/authApi";
import { useRouter } from "next/navigation";

type FileStatus = "idle" | "dragging" | "selected" | "uploading" | "success" | "error";

const ACCEPTED_EXTENSIONS = [".pdf", ".csv", ".xlsx"];
const MAX_SIZE_MB = 10;

const BANKS = ["HDFC", "ICICI", "AXIS", "SBI", "PNB", "OTHER"];

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  const [status,   setStatus]   = useState<FileStatus>("idle");
  const [file,     setFile]     = useState<File | null>(null);
  const [error,    setError]    = useState("");
  const [progress, setProgress] = useState(0);
  const [password, setPassword] = useState("");
  const [bankName, setBankName] = useState("");

  const [uploadStatement] = useUploadStatementMutation();

  const isPdf = file?.name.toLowerCase().endsWith(".pdf");

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_SIZE_MB * 1024 * 1024)
      return `File too large. Max size is ${MAX_SIZE_MB}MB.`;
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext))
      return "Only PDF, CSV, or Excel files are accepted.";
    return null;
  };

  const selectFile = (f: File) => {
    const err = validateFile(f);
    if (err) { setError(err); setStatus("error"); return; }
    setFile(f);
    setError("");
    setPassword("");
    setStatus("selected");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f); else setStatus("idle");
  }, []);

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setStatus("dragging"); };
  const handleDragLeave = () => { if (status === "dragging") setStatus(file ? "selected" : "idle"); };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) selectFile(f);
  };

  const clearFile = () => {
    setFile(null); setStatus("idle"); setError("");
    setProgress(0); setPassword("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!bankName) { setError("Please select your bank before uploading."); return; }

    setStatus("uploading");
    setProgress(0);
    setError("");

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

      setTimeout(() => router.push(`/dashboard`), 1200);

    } catch (err: any) {
      clearInterval(interval);
      setStatus("error");
      const message = err?.data?.message || "Upload failed. Please try again.";
      setError(message);
      toast.error(message);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isDragging  = status === "dragging";
  const isUploading = status === "uploading";
  const isSuccess   = status === "success";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .ml-upload-root {
          min-height: 100vh;
          background: #080B14;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .ml-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .ml-glow-top {
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 700px;
          background: radial-gradient(ellipse, rgba(110,231,183,0.09) 0%, rgba(59,130,246,0.06) 45%, transparent 70%);
          pointer-events: none;
          border-radius: 50%;
        }

        .ml-glow-bottom {
          position: absolute;
          bottom: -100px;
          right: 15%;
          width: 400px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%);
          pointer-events: none;
          border-radius: 50%;
        }

        .ml-upload-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 560px;
        }

        /* Logo */
        .ml-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
        }

        .ml-logo-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, #6EE7B7, #3B82F6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 800;
          color: #080B14;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(110,231,183,0.2);
        }

        .ml-logo-text h1 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .ml-logo-text p {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 3px;
        }

        /* Header */
        .ml-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .ml-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 99px;
          background: rgba(110,231,183,0.08);
          border: 0.5px solid rgba(110,231,183,0.2);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6EE7B7;
          margin-bottom: 20px;
        }

        .ml-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
          box-shadow: 0 0 6px #6EE7B7;
        }

        .ml-heading {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 42px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.05;
          margin-bottom: 14px;
        }

        .ml-subtext {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          line-height: 1.7;
          max-width: 380px;
          margin: 0 auto;
        }

        /* Bank Selector */
        .ml-field-group {
          margin-bottom: 16px;
        }

        .ml-field-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
          letter-spacing: 0.01em;
        }

        .ml-field-group label span {
          color: #f87171;
          margin-left: 2px;
        }

        .ml-select-wrap {
          position: relative;
        }

        .ml-select {
          width: 100%;
          height: 52px;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 0 44px 0 16px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          appearance: none;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }

        .ml-select:focus {
          border-color: rgba(110,231,183,0.45);
          background: rgba(110,231,183,0.04);
        }

        .ml-select option {
          background: #111827;
          color: #fff;
        }

        .ml-select-chevron {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.25);
          pointer-events: none;
        }

        /* Upload Card */
        .ml-card {
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.09);
          border-radius: 28px;
          padding: 36px 32px;
          backdrop-filter: blur(20px);
          position: relative;
          text-align: center;
          transition: border-color 0.25s, background 0.25s;
          cursor: pointer;
        }

        .ml-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(110,231,183,0.04) 0%, rgba(59,130,246,0.02) 50%, transparent 100%);
          pointer-events: none;
        }

        .ml-card.is-dragging {
          border-color: rgba(110,231,183,0.5);
          background: rgba(110,231,183,0.05);
        }

        .ml-card.is-selected {
          border-color: rgba(110,231,183,0.25);
          cursor: default;
        }

        .ml-card.is-error {
          border-color: rgba(248,113,113,0.4);
          cursor: default;
        }

        .ml-card.is-success {
          border-color: rgba(110,231,183,0.4);
          cursor: default;
        }

        .ml-card.is-uploading {
          cursor: default;
        }

        /* Icon boxes */
        .ml-icon-box {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .ml-icon-box.default {
          background: rgba(110,231,183,0.1);
          border: 0.5px solid rgba(110,231,183,0.2);
        }

        .ml-icon-box.success {
          background: rgba(110,231,183,0.1);
          border: 0.5px solid rgba(110,231,183,0.3);
        }

        .ml-icon-box.error {
          background: rgba(248,113,113,0.1);
          border: 0.5px solid rgba(248,113,113,0.25);
        }

        .ml-card-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
        }

        .ml-card-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          margin-bottom: 20px;
          line-height: 1.6;
        }

        /* Type badges */
        .ml-badges {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ml-badge {
          padding: 4px 12px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.1);
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
        }

        .ml-badge.limit {
          color: rgba(255,255,255,0.2);
          border-color: transparent;
          background: transparent;
        }

        /* Password field */
        .ml-pw-wrap {
          max-width: 380px;
          margin: 0 auto 20px;
          text-align: left;
        }

        .ml-pw-wrap label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
        }

        .ml-pw-wrap label span {
          color: rgba(255,255,255,0.22);
          font-weight: 400;
          margin-left: 4px;
        }

        .ml-field {
          height: 52px;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: border-color 0.2s, background 0.2s;
        }

        .ml-field:focus-within {
          border-color: rgba(110,231,183,0.45);
          background: rgba(110,231,183,0.04);
        }

        .ml-field svg {
          color: rgba(255,255,255,0.25);
          flex-shrink: 0;
        }

        .ml-field input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 13px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
        }

        .ml-field input::placeholder {
          color: rgba(255,255,255,0.2);
        }

        /* Remove / retry button */
        .ml-ghost-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.1);
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }

        .ml-ghost-btn:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.65);
        }

        /* Progress bar */
        .ml-progress-track {
          width: 100%;
          height: 3px;
          background: rgba(255,255,255,0.07);
          border-radius: 99px;
          overflow: hidden;
          margin-top: 24px;
        }

        .ml-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6EE7B7, #22d3ee);
          border-radius: 99px;
          transition: width 0.3s ease;
          box-shadow: 0 0 8px rgba(110,231,183,0.5);
        }

        .ml-progress-pct {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin-top: 10px;
        }

        /* Error message */
        .ml-error-text {
          color: #f87171;
          font-size: 12px;
          text-align: center;
          margin-top: 12px;
        }

        /* Primary button */
        .ml-btn-primary {
          width: 100%;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #6EE7B7, #22d3ee);
          color: #080B14;
          font-weight: 700;
          font-size: 13px;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
          margin-top: 16px;
          transition: all 0.2s;
          box-shadow: 0 8px 24px rgba(110,231,183,0.2);
        }

        .ml-btn-primary:hover:not(:disabled) {
          opacity: 0.9;
          transform: scale(0.99);
        }

        .ml-btn-primary:active:not(:disabled) {
          transform: scale(0.97);
        }

        .ml-btn-primary:disabled {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.25);
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Secondary / outline button */
        .ml-btn-outline {
          width: 100%;
          height: 52px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.55);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          margin-top: 16px;
          transition: all 0.2s;
        }

        .ml-btn-outline:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.8);
        }

        /* Trust badges */
        .ml-trust {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .ml-trust-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: rgba(255,255,255,0.25);
        }

        .ml-trust-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #6EE7B7;
          box-shadow: 0 0 4px #6EE7B7;
          flex-shrink: 0;
        }
      `}</style>

      <div className="ml-upload-root">
        <div className="ml-grid-bg" />
        <div className="ml-glow-top" />
        <div className="ml-glow-bottom" />

        <div className="ml-upload-inner">
          {/* Logo */}
          <div className="ml-logo">
            <div className="ml-logo-icon">M</div>
            <div className="ml-logo-text">
              <h1>MoneyLens</h1>
              <p>Financial Intelligence Platform</p>
            </div>
          </div>

          {/* Header */}
          <div className="ml-header">
            <div className="ml-eyebrow">
              <span className="ml-eyebrow-dot" />
              STEP 1 OF 1
            </div>
            <h1 className="ml-heading">
              Upload your<br />bank statement
            </h1>
            <p className="ml-subtext">
              We'll analyse every transaction and generate insights about your spending, saving and financial behavior.
            </p>
          </div>

          {/* Bank Selector */}
          <div className="ml-field-group">
            <label>Select your bank <span>*</span></label>
            <div className="ml-select-wrap">
              <select
                value={bankName}
                onChange={e => { setBankName(e.target.value); setError(""); }}
                className="ml-select"
              >
                <option value="">— Choose your bank —</option>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown className="ml-select-chevron" size={16} />
            </div>
          </div>

          {/* Upload Card */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isUploading && !isSuccess && status !== "selected" && status !== "error" && inputRef.current?.click()}
            className={`ml-card ${
              isDragging   ? "is-dragging"  :
              status === "error"    ? "is-error"    :
              status === "selected" ? "is-selected" :
              isSuccess             ? "is-success"  :
              isUploading           ? "is-uploading": ""
            }`}
          >
            <input ref={inputRef} type="file" accept={ACCEPTED_EXTENSIONS.join(",")} onChange={handleFileInput} className="hidden" style={{ display: "none" }} />

            {/* Idle / Dragging */}
            {(status === "idle" || status === "dragging") && (
              <>
                <div className="ml-icon-box default">
                  <Upload size={28} color="#6EE7B7" />
                </div>
                <h3 className="ml-card-title">
                  {isDragging ? "Drop your statement" : "Upload bank statement"}
                </h3>
                <p className="ml-card-sub">Drag & drop your file here, or click to browse</p>
                <div className="ml-badges">
                  {["PDF", "CSV", "Excel"].map(t => (
                    <span key={t} className="ml-badge">{t}</span>
                  ))}
                  <span className="ml-badge limit">Max 10 MB</span>
                </div>
              </>
            )}

            {/* Selected */}
            {status === "selected" && file && (
              <>
                <div className="ml-icon-box default">
                  <FileText size={28} color="#6EE7B7" />
                </div>
                <h3 className="ml-card-title">{file.name}</h3>
                <p className="ml-card-sub">{formatSize(file.size)}</p>

                {isPdf && (
                  <div className="ml-pw-wrap">
                    <label>PDF Password <span>(if protected)</span></label>
                    <div className="ml-field">
                      <Lock size={16} />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter PDF password"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={e => { e.stopPropagation(); clearFile(); }}
                  className="ml-ghost-btn"
                >
                  <X size={14} /> Remove file
                </button>
              </>
            )}

            {/* Uploading */}
            {isUploading && (
              <>
                <div className="ml-icon-box default">
                  <Loader2 size={28} color="#6EE7B7" style={{ animation: "spin 1s linear infinite" }} />
                </div>
                <h3 className="ml-card-title">Uploading statement…</h3>
                <div className="ml-progress-track">
                  <div className="ml-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="ml-progress-pct">{progress}%</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </>
            )}

            {/* Success */}
            {isSuccess && (
              <>
                <div className="ml-icon-box success">
                  <CheckCircle size={28} color="#6EE7B7" />
                </div>
                <h3 className="ml-card-title">Upload Complete!</h3>
                <p className="ml-card-sub">Redirecting to your dashboard…</p>
              </>
            )}

            {/* Error */}
            {status === "error" && (
              <>
                <div className="ml-icon-box error">
                  <AlertCircle size={28} color="#f87171" />
                </div>
                <h3 className="ml-card-title">Upload Failed</h3>
                <p className="ml-card-sub" style={{ color: "rgba(248,113,113,0.7)" }}>{error}</p>
                <button
                  onClick={e => { e.stopPropagation(); clearFile(); }}
                  className="ml-ghost-btn"
                >
                  Try Again
                </button>
              </>
            )}
          </div>

          {/* CTA */}
          {status === "selected" && (
            <>
              {error && <p className="ml-error-text">{error}</p>}
              <button
                onClick={handleUpload}
                disabled={!bankName}
                className="ml-btn-primary"
              >
                Analyse My Statement
              </button>
            </>
          )}

          {isSuccess && (
            <button onClick={clearFile} className="ml-btn-outline">
              Upload Another Statement
            </button>
          )}

          {/* Trust badges */}
          <div className="ml-trust">
            {["256-bit encrypted", "Deleted after 24h", "Never shared"].map(t => (
              <span key={t} className="ml-trust-item">
                <span className="ml-trust-dot" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
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

      const statementId = response?.data?.statementId;
      setTimeout(() => router.push(`/dashboard/${statementId}`), 1200);

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
    <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-extrabold text-lg">M</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">MoneyLens</h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">Financial Intelligence Platform</p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#eef2ff] text-[#4f6ef7] text-xs font-bold tracking-wide border border-[#dbe4ff]">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
            STEP 1 OF 1
          </span>
          <h1 className="text-[44px] leading-[1.05] tracking-[-0.05em] font-extrabold text-[#111] mt-6">
            Upload your<br />bank statement
          </h1>
          <p className="text-[#9ca3af] text-sm mt-5 max-w-md mx-auto leading-6">
            We'll analyse every transaction and generate insights about your spending, saving and financial behavior.
          </p>
        </div>

        {/* Bank Selector */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-[#374151] mb-2">
            Select your bank <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <select
              value={bankName}
              onChange={e => { setBankName(e.target.value); setError(""); }}
              className="w-full h-14 rounded-2xl border border-[#e5e7eb] bg-white pl-5 pr-10 text-sm font-semibold text-[#111] outline-none focus:border-[#4f6ef7] appearance-none cursor-pointer"
            >
              <option value="">— Choose your bank —</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
          </div>
        </div>

        {/* Upload Card */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && !isSuccess && status !== "selected" && inputRef.current?.click()}
          className={`bg-white rounded-[32px] border-2 transition-all duration-300 p-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.04)] ${
            isDragging   ? "border-[#4f6ef7] bg-[#f8faff]" :
            status === "error"    ? "border-red-300"   :
            status === "selected" ? "border-[#c7d2fe]" :
            status === "success"  ? "border-green-300" :
            "border-[#ececec]"
          }`}
        >
          <input ref={inputRef} type="file" accept={ACCEPTED_EXTENSIONS.join(",")} onChange={handleFileInput} className="hidden" />

          {/* Idle / Dragging */}
          {(status === "idle" || status === "dragging") && (
            <>
              <div className="w-20 h-20 rounded-[24px] bg-[#eef2ff] border border-[#dbe4ff] flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-[#4f6ef7]" />
              </div>
              <h3 className="text-2xl font-bold text-[#111] tracking-tight">
                {isDragging ? "Drop your statement" : "Upload bank statement"}
              </h3>
              <p className="text-[#9ca3af] text-sm mt-3 mb-6">Drag & drop your file here or click to browse</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {["PDF","CSV","Excel"].map(t => (
                  <span key={t} className="px-3 py-1 rounded-lg bg-[#f9fafb] border border-[#ececec] text-xs font-semibold text-[#6b7280]">{t}</span>
                ))}
                <span className="px-3 py-1 text-xs text-[#9ca3af]">Max 10MB</span>
              </div>
            </>
          )}

          {/* Selected */}
          {status === "selected" && file && (
            <>
              <div className="w-20 h-20 rounded-[24px] bg-[#eef2ff] border border-[#dbe4ff] flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-[#4f6ef7]" />
              </div>
              <h3 className="text-xl font-bold text-[#111] tracking-tight">{file.name}</h3>
              <p className="text-[#9ca3af] text-sm mt-2 mb-6">{formatSize(file.size)}</p>

              {isPdf && (
                <div className="max-w-md mx-auto text-left mb-6">
                  <label className="block text-sm font-semibold text-[#374151] mb-2">
                    PDF Password <span className="text-[#9ca3af] font-normal">(if protected)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter PDF password"
                      className="w-full h-14 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] pl-11 pr-4 text-sm outline-none focus:border-[#4f6ef7]"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={e => { e.stopPropagation(); clearFile(); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ececec] text-sm font-semibold text-[#6b7280] hover:bg-[#fafafa]"
              >
                <X className="w-4 h-4" /> Remove file
              </button>
            </>
          )}

          {/* Uploading */}
          {isUploading && (
            <>
              <div className="w-20 h-20 rounded-[24px] bg-[#eef2ff] border border-[#dbe4ff] flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-[#4f6ef7] animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-[#111]">Uploading statement...</h3>
              <div className="w-full h-2 bg-[#f3f4f6] rounded-full overflow-hidden mt-6">
                <div className="h-full bg-gradient-to-r from-[#4f6ef7] to-[#7c3aed] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm text-[#9ca3af] mt-3">{progress}%</p>
            </>
          )}

          {/* Success */}
          {isSuccess && (
            <>
              <div className="w-20 h-20 rounded-[24px] bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-[#111]">Upload Complete!</h3>
              <p className="text-[#9ca3af] text-sm mt-3">Redirecting to dashboard...</p>
            </>
          )}

          {/* Error */}
          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-[24px] bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#111]">Upload Failed</h3>
              <p className="text-red-500 text-sm mt-3 mb-6">{error}</p>
              <button
                onClick={e => { e.stopPropagation(); clearFile(); }}
                className="px-5 py-2 rounded-xl border border-[#ececec] text-sm font-semibold text-[#6b7280] hover:bg-[#fafafa]"
              >
                Try Again
              </button>
            </>
          )}
        </div>

        {/* Upload Button */}
        {status === "selected" && (
          <>
            {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
            <button
              onClick={handleUpload}
              disabled={!bankName}
              className={`w-full mt-5 h-14 rounded-2xl text-white font-bold text-sm shadow-lg transition-all ${
                bankName
                  ? "bg-gradient-to-r from-[#4f6ef7] to-[#7c3aed] shadow-blue-500/20 hover:scale-[0.99] active:scale-[0.98]"
                  : "bg-[#e5e7eb] cursor-not-allowed shadow-none"
              }`}
            >
              Analyse My Statement
            </button>
          </>
        )}

        {/* Success button */}
        {isSuccess && (
          <button onClick={clearFile} className="w-full mt-5 h-14 rounded-2xl border border-[#ececec] bg-white text-[#374151] font-bold text-sm hover:bg-[#fafafa]">
            Upload Another Statement
          </button>
        )}

        {/* Trust badges */}
        <div className="flex justify-center gap-5 flex-wrap mt-8">
          {["256-bit encrypted","Deleted after 24h","Never shared"].map(t => (
            <span key={t} className="text-xs text-[#9ca3af] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />{t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
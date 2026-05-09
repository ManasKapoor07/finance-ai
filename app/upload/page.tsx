"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useUploadStatementMutation } from "../redux/api/authApi";

type FileStatus = "idle" | "dragging" | "selected" | "uploading" | "success" | "error";

const ACCEPTED_EXTENSIONS = [".pdf", ".csv", ".xlsx"];
const MAX_SIZE_MB = 10;

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<FileStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [password, setPassword] = useState("");

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
    if (err) {
      setError(err);
      setStatus("error");
      return;
    }
    setFile(f);
    setError("");
    setPassword("");
    setStatus("selected");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
    else setStatus("idle");
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setStatus("dragging");
  };

  const handleDragLeave = () => {
    if (status === "dragging") setStatus(file ? "selected" : "idle");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) selectFile(f);
  };

  const clearFile = () => {
    setFile(null);
    setStatus("idle");
    setError("");
    setProgress(0);
    setPassword("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 8, 85));
    }, 200);

    try {
      await uploadStatement({ file, password: password || undefined }).unwrap();

      clearInterval(interval);
      setProgress(100);
      setStatus("success");
      toast.success("Statement uploaded! Analysing...");
    } catch (err: unknown) {
      clearInterval(interval);
      setStatus("error");

      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Upload failed. Please try again.";

      setError(message);
      toast.error("Upload failed");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isDragging = status === "dragging";
  const isUploading = status === "uploading";
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-200 flex flex-col items-center justify-center px-4 relative overflow-hidden">

      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#E8622A]/6 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-80px] right-[-100px] w-[400px] h-[400px] bg-[#9B6FD8]/4 blur-[100px] rounded-full pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none z-[9999] opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-xl relative z-10">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-12 justify-center">
          <div className="relative w-9 h-9 bg-gradient-to-br from-[#E8622A] to-[#D4A017] rounded-xl flex items-center justify-center font-serif text-lg text-black">
            M
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#2EB87A] rounded-full" />
          </div>
          <span className="font-extrabold text-[1.1rem] tracking-tight text-white">MoneyLens</span>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 bg-[#E8622A]/8 border border-[#E8622A]/18 text-[#E8622A] text-[0.68rem] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2EB87A] inline-block" />
            Step 1 of 1
          </span>
          <h1 className="font-serif text-white mt-4 text-[2.5rem] leading-tight">
            Upload your<br />bank statement
          </h1>
          <p className="text-zinc-500 mt-3 text-[0.9rem] max-w-sm mx-auto leading-relaxed">
            We'll analyse every transaction and surface insights in under 30 seconds.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && !isSuccess && status !== "selected" && inputRef.current?.click()}
          className="relative rounded-3xl transition-all duration-300 cursor-pointer"
          style={{
            border: `1.5px dashed ${
              isDragging ? "#E8622A"
              : isSuccess ? "#2EB87A"
              : status === "error" ? "#ef4444"
              : status === "selected" ? "#E8622A60"
              : "#222226"
            }`,
            background: isDragging
              ? "rgba(232,98,42,0.05)"
              : isSuccess
              ? "rgba(46,184,122,0.03)"
              : "rgba(232,98,42,0.01)",
            padding: "3rem 2rem",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Idle / Dragging */}
          {(status === "idle" || status === "dragging") && (
            <div className="text-center">
              <div
                className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center mx-auto mb-5 transition-all duration-300"
                style={{
                  background: isDragging ? "rgba(232,98,42,0.15)" : "rgba(232,98,42,0.08)",
                  border: "1px solid rgba(232,98,42,0.15)",
                }}
              >
                <Upload className="w-7 h-7 text-[#E8622A]" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-[1.1rem] text-white mb-2">
                {isDragging ? "Drop it here" : "Drop your bank statement"}
              </h3>
              <p className="text-zinc-600 text-[0.82rem] mb-6">or click to browse your files</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {["PDF", "CSV", "Excel"].map((t, i) => (
                  <span key={i} className="text-[0.68rem] font-bold bg-[#1a1a1e] text-zinc-500 px-3 py-1 rounded-lg border border-[#222226]">
                    {t}
                  </span>
                ))}
                <span className="text-[0.68rem] text-zinc-700">· Max 10MB</span>
              </div>
            </div>
          )}

          {/* File selected */}
          {status === "selected" && file && (
            <div className="text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-[72px] h-[72px] rounded-[20px] bg-[#E8622A]/10 border border-[#E8622A]/20 flex items-center justify-center mx-auto mb-5">
                <FileText className="w-7 h-7 text-[#E8622A]" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-[1rem] text-white mb-1">{file.name}</h3>
              <p className="text-zinc-600 text-[0.78rem] mb-5">{formatSize(file.size)}</p>

              {/* Password field — only for PDFs */}
              {isPdf && (
                <div className="mb-5 text-left">
                  <label className="block text-[0.72rem] text-zinc-500 mb-2 font-medium">
                    PDF password{" "}
                    <span className="text-zinc-700">(if your bank statement is password protected)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" strokeWidth={1.5} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. your date of birth (DDMMYYYY)"
                      className="w-full bg-[#111114] border border-[#222226] rounded-xl pl-9 pr-4 py-2.5 text-[0.82rem] text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-[#E8622A]/50 transition-colors"
                    />
                  </div>
                  <p className="text-[0.65rem] text-zinc-700 mt-1.5">
                    Common passwords: date of birth (DDMMYYYY), account number, or first 4 letters of name + DOB
                  </p>
                </div>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="inline-flex items-center gap-1.5 text-[0.72rem] text-zinc-600 hover:text-zinc-400 transition-colors border border-[#222226] rounded-xl px-3 py-1.5"
              >
                <X className="w-3 h-3" /> Remove file
              </button>
            </div>
          )}

          {/* Uploading */}
          {isUploading && (
            <div className="text-center">
              <div className="w-[72px] h-[72px] rounded-[20px] bg-[#E8622A]/10 border border-[#E8622A]/20 flex items-center justify-center mx-auto mb-5">
                <Loader2 className="w-7 h-7 text-[#E8622A] animate-spin" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-[1rem] text-white mb-4">Uploading & encrypting…</h3>
              <div className="w-full bg-[#1a1a1e] rounded-full h-1.5 mb-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#E8622A] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-zinc-600 text-[0.72rem]">{progress}%</p>
            </div>
          )}

          {/* Success */}
          {isSuccess && (
            <div className="text-center">
              <div className="w-[72px] h-[72px] rounded-[20px] bg-[#2EB87A]/10 border border-[#2EB87A]/20 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-7 h-7 text-[#2EB87A]" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-[1rem] text-white mb-1">Upload complete!</h3>
              <p className="text-zinc-500 text-[0.82rem]">Your statement is being analysed…</p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="text-center">
              <div className="w-[72px] h-[72px] rounded-[20px] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-7 h-7 text-red-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-[1rem] text-white mb-1">Something went wrong</h3>
              <p className="text-red-400 text-[0.82rem] mb-4">{error}</p>
              <button
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="text-[0.72rem] text-zinc-500 hover:text-zinc-300 transition-colors border border-[#222226] rounded-xl px-3 py-1.5"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Upload button */}
        {status === "selected" && (
          <button
            onClick={handleUpload}
            className="w-full mt-4 h-14 rounded-2xl bg-[#E8622A] hover:bg-[#f0733c] text-white font-bold text-[0.9rem] border-none cursor-pointer transition-all hover:-translate-y-px shadow-[0_8px_30px_rgba(232,98,42,0.25)]"
          >
            Analyse my statement →
          </button>
        )}

        {/* Upload another after success */}
        {isSuccess && (
          <button
            onClick={clearFile}
            className="w-full mt-4 h-14 rounded-2xl border border-[#222226] text-zinc-400 hover:text-white hover:border-zinc-600 font-bold text-[0.9rem] bg-transparent cursor-pointer transition-all"
          >
            Upload another statement
          </button>
        )}

        {/* Trust badges */}
        <div className="flex gap-6 justify-center mt-7 flex-wrap">
          {["256-bit encrypted", "Deleted after 24h", "Never shared"].map((t, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="text-[#2EB87A] text-[0.6rem]">●</span> {t}
            </span>
          ))}
        </div>

        <p className="text-center text-[0.68rem] text-zinc-700 mt-5">
          HDFC · SBI · ICICI · Axis · Kotak · Yes Bank · IndusInd · IDFC First · BOB · PNB + more
        </p>
      </div>
    </div>
  );
}
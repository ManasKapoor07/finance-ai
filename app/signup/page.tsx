"use client";

import Link from "next/link";
import { Mail, Lock, User } from "lucide-react";
import { useState } from "react";
import { useSignupMutation } from "../redux/api/authApi";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const[signup] = useSignupMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    signup(formData)
    console.log("Signup Form Data:", formData);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-[-120px] right-[-120px] w-[350px] h-[350px] bg-[#E8622A]/10 blur-3xl rounded-full" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E8622A] to-[#D4A017] flex items-center justify-center text-black font-bold text-lg">
            M
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              MoneyLens
            </h1>

            <p className="text-xs text-zinc-500">
              Smart Finance Intelligence
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#111113] border border-[#1E1E22] rounded-3xl p-8 shadow-2xl">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.2em] text-[#E8622A] font-semibold mb-3">
              Get Started
            </p>

            <h2 className="text-4xl font-serif leading-tight">
              Create your account
            </h2>

            <p className="text-zinc-500 mt-3 text-sm">
              Start understanding where your money really goes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Full Name
              </label>

              <div className="h-14 rounded-2xl bg-[#0D0D0F] border border-[#222226] px-4 flex items-center gap-3 focus-within:border-[#E8622A] transition">
                <User className="w-5 h-5 text-zinc-500" />

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="bg-transparent outline-none flex-1 text-sm placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Email Address
              </label>

              <div className="h-14 rounded-2xl bg-[#0D0D0F] border border-[#222226] px-4 flex items-center gap-3 focus-within:border-[#E8622A] transition">
                <Mail className="w-5 h-5 text-zinc-500" />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="bg-transparent outline-none flex-1 text-sm placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Password
              </label>

              <div className="h-14 rounded-2xl bg-[#0D0D0F] border border-[#222226] px-4 flex items-center gap-3 focus-within:border-[#E8622A] transition">
                <Lock className="w-5 h-5 text-zinc-500" />

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="bg-transparent outline-none flex-1 text-sm placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full h-14 rounded-2xl bg-[#E8622A] hover:bg-[#f0743b] transition-all font-semibold text-white shadow-lg shadow-[#E8622A]/20"
            >
              Create Account
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-zinc-500 mt-8">
            Already have an account?
            <Link
              href="/login"
              className="text-[#E8622A] ml-2 hover:text-[#f0743b]"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
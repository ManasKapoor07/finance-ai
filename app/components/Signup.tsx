"use client";

import { useState } from "react";
import { Eye, EyeOff, Wallet, Mail, Lock, User } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B1020] text-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-120px] left-[-100px] w-[300px] h-[300px] bg-emerald-500/20 blur-3xl rounded-full" />
      <div className="absolute bottom-[-120px] right-[-100px] w-[300px] h-[300px] bg-cyan-500/20 blur-3xl rounded-full" />

      {/* Main Card */}
      <div className="w-full max-w-5xl bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-2">
        
        {/* Left Section */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-r border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20">
                <Wallet className="w-7 h-7 text-emerald-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold">MoneyLens</h1>
                <p className="text-sm text-gray-400">
                  Smart AI-powered finance tracking
                </p>
              </div>
            </div>

            <div className="mt-16">
              <h2 className="text-4xl font-bold leading-tight">
                Understand your
                <span className="text-emerald-400"> money </span>
                before it controls you.
              </h2>

              <p className="mt-5 text-gray-400 leading-relaxed">
                Track spending, understand habits, and get AI-driven financial
                insights with complete privacy-first architecture.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Secure • Encrypted • AI Powered
          </div>
        </div>

        {/* Right Section */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              {isLogin ? "Welcome back 👋" : "Create account"}
            </h2>

            <p className="text-gray-400 mt-2">
              {isLogin
                ? "Login to continue managing your finances."
                : "Start your journey towards smarter money management."}
            </p>
          </div>

          <form className="space-y-5">
            {!isLogin && (
              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  Full Name
                </label>

                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-emerald-400 transition">
                  <User className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="bg-transparent outline-none w-full placeholder:text-gray-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Email Address
              </label>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-emerald-400 transition">
                <Mail className="w-5 h-5 text-gray-400" />

                <input
                  type="email"
                  placeholder="you@example.com"
                  className="bg-transparent outline-none w-full placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Password
              </label>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-emerald-400 transition">
                <Lock className="w-5 h-5 text-gray-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-transparent outline-none w-full placeholder:text-gray-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition-all duration-300 font-semibold text-black shadow-lg shadow-emerald-500/20"
            >
              {isLogin ? "Login to MoneyLens" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-sm text-gray-500">OR</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* Google */}
          <button className="w-full border border-white/10 hover:border-white/20 bg-white/5 py-3 rounded-2xl transition">
            Continue with Google
          </button>

          {/* Toggle */}
          <p className="text-center text-gray-400 mt-8 text-sm">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
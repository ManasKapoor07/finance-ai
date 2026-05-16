"use client";

import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";
import { useLoginMutation } from "../redux/api/authApi";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] =
    useState(false);

  const router = useRouter();

  const [login, { isLoading }] =
    useLoginMutation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      const res: any = await login(
        formData
      );

      if (res?.data) {
        toast.success("Login Successful!");

        localStorage.setItem(
          "access_token",
          res.data?.data?.accessToken
        );

        router.push(
          res.data.data.user.hasStatement
            ? `/dashboard/${res.data.data.user.latestStatementId}`
            : "/upload"
        );
      }
    } catch (error) {
      toast.error("Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-extrabold text-lg">
              M
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111]">
              MoneyLens
            </h1>

            <p className="text-xs text-[#9ca3af] mt-0.5">
              Financial Intelligence Platform
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#ececec] rounded-[28px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          
          {/* Heading */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4f6ef7] mb-3">
              Welcome Back
            </p>

            <h2 className="text-[36px] leading-[1.05] tracking-[-0.04em] font-extrabold text-[#111]">
              Login to your account
            </h2>

            <p className="text-sm text-[#9ca3af] mt-4 leading-6">
              Continue tracking your transactions,
              spending patterns and financial
              insights.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            
            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-2">
                Email Address
              </label>

              <div className="h-14 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 flex items-center gap-3 transition-all focus-within:border-[#4f6ef7] focus-within:bg-white">
                <Mail className="w-[18px] h-[18px] text-[#9ca3af]" />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent outline-none text-sm text-[#111] placeholder:text-[#9ca3af]"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-2">
                Password
              </label>

              <div className="h-14 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 flex items-center gap-3 transition-all focus-within:border-[#4f6ef7] focus-within:bg-white">
                <Lock className="w-[18px] h-[18px] text-[#9ca3af]" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent outline-none text-sm text-[#111] placeholder:text-[#9ca3af]"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="text-[#9ca3af] hover:text-[#6b7280] transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm font-semibold text-[#4f6ef7] hover:text-[#3d5ce6] transition"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#4f6ef7] to-[#7c3aed] text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[0.99] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {isLoading
                ? "Logging in..."
                : "Login to MoneyLens"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="h-px bg-[#ececec] flex-1" />

            <span className="text-xs text-[#9ca3af] font-medium">
              OR
            </span>

            <div className="h-px bg-[#ececec] flex-1" />
          </div>

          {/* Google */}
          <button className="w-full h-14 rounded-2xl border border-[#e5e7eb] bg-white hover:bg-[#fafafa] transition text-sm font-semibold text-[#374151]">
            Continue with Google
          </button>

          {/* Footer */}
          <p className="text-center text-sm text-[#9ca3af] mt-8">
            Don’t have an account?

            <Link
              href="/signup"
              className="ml-2 text-[#4f6ef7] font-semibold hover:text-[#3d5ce6]"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
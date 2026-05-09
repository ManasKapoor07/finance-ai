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

    const [login] = useLoginMutation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Handle Input Change
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

    login(formData).then((res)=>{
      if(res.data){
        toast.success("Login Succefull!")
        localStorage.setItem("access_token" , res.data?.data.accessToken)
        router.push(res.data.data.hasStatement ? "/dashboard" : "/upload");
      }
    })
    console.log(formData);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-[#E8622A]/10 blur-3xl rounded-full" />

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
              AI Powered Finance Intelligence
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#111113] border border-[#1E1E22] rounded-3xl p-8 shadow-2xl">
          
          {/* Heading */}
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.2em] text-[#E8622A] font-semibold mb-3">
              Welcome Back
            </p>

            <h2 className="text-4xl leading-tight font-serif">
              Login to your account
            </h2>

            <p className="text-zinc-500 mt-3 text-sm">
              Continue tracking your spending
              and wealth journey.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            
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
                  required
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
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="bg-transparent outline-none flex-1 text-sm placeholder:text-zinc-600"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-zinc-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-zinc-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-[#E8622A] hover:text-[#f0743b]"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-14 rounded-2xl bg-[#E8622A] hover:bg-[#f0743b] transition-all font-semibold text-white shadow-lg shadow-[#E8622A]/20"
            >
              Login to MoneyLens
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="h-px flex-1 bg-[#222226]" />

            <span className="text-xs text-zinc-600">
              OR
            </span>

            <div className="h-px flex-1 bg-[#222226]" />
          </div>

          {/* Google Button */}
          <button className="w-full h-14 rounded-2xl border border-[#222226] hover:border-zinc-700 bg-[#0D0D0F] transition text-sm font-medium">
            Continue with Google
          </button>

          {/* Footer */}
          <p className="text-center text-sm text-zinc-500 mt-8">
            Don’t have an account?

            <Link
              href="/signup"
              className="text-[#E8622A] ml-2 hover:text-[#f0743b]"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useLoginMutation } from "../redux/api/authApi";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res: any = await login(formData);
      if (res?.data) {
        toast.success("Login Successful!");
        localStorage.setItem("access_token", res.data?.data?.accessToken);
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .ml-auth-root {
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
          left: 15%;
          width: 400px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%);
          pointer-events: none;
          border-radius: 50%;
        }

        .ml-auth-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
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

        /* Card */
        .ml-card {
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.09);
          border-radius: 28px;
          padding: 36px 32px 32px;
          backdrop-filter: blur(20px);
          position: relative;
        }

        .ml-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(110,231,183,0.04) 0%, rgba(59,130,246,0.02) 50%, transparent 100%);
          pointer-events: none;
        }

        /* Heading */
        .ml-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6EE7B7;
          margin-bottom: 10px;
        }

        .ml-heading {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 34px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.05;
          margin-bottom: 12px;
        }

        .ml-subtext {
          font-size: 13px;
          color: rgba(255,255,255,0.38);
          line-height: 1.65;
          margin-bottom: 28px;
        }

        /* Form fields */
        .ml-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ml-field-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
          letter-spacing: 0.01em;
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

        .ml-field button {
          background: transparent;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }

        .ml-field button:hover {
          color: rgba(255,255,255,0.55);
        }

        .ml-forgot {
          display: flex;
          justify-content: flex-end;
          margin-top: -6px;
        }

        .ml-forgot button {
          background: transparent;
          border: none;
          font-size: 12px;
          font-weight: 600;
          color: #6EE7B7;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }

        .ml-forgot button:hover {
          color: #34d399;
        }

        /* Submit */
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
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Divider */
        .ml-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 6px 0;
        }

        .ml-divider-line {
          flex: 1;
          height: 0.5px;
          background: rgba(255,255,255,0.08);
        }

        .ml-divider span {
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          font-weight: 500;
        }

        /* Google */
        .ml-btn-google {
          width: 100%;
          height: 52px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.55);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
        }

        .ml-btn-google:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.8);
        }

        /* Footer */
        .ml-footer {
          text-align: center;
          font-size: 13px;
          color: rgba(255,255,255,0.28);
          margin-top: 24px;
        }

        .ml-footer a {
          color: #6EE7B7;
          font-weight: 600;
          text-decoration: none;
          margin-left: 6px;
          transition: color 0.2s;
        }

        .ml-footer a:hover {
          color: #34d399;
        }
      `}</style>

      <div className="ml-auth-root">
        <div className="ml-grid-bg" />
        <div className="ml-glow-top" />
        <div className="ml-glow-bottom" />

        <div className="ml-auth-inner">
          {/* Logo */}
          <div className="ml-logo">
            <div className="ml-logo-icon">M</div>
            <div className="ml-logo-text">
              <h1>MoneyLens</h1>
              <p>Financial Intelligence Platform</p>
            </div>
          </div>

          {/* Card */}
          <div className="ml-card">
            <p className="ml-eyebrow">Welcome Back</p>
            <h2 className="ml-heading">Login to your<br />account</h2>
            <p className="ml-subtext">
              Continue tracking your transactions, spending patterns and financial insights.
            </p>

            <form onSubmit={handleSubmit} className="ml-form">
              {/* Email */}
              <div className="ml-field-group">
                <label>Email Address</label>
                <div className="ml-field">
                  <Mail size={17} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="ml-field-group">
                <label>Password</label>
                <div className="ml-field">
                  <Lock size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div className="ml-forgot">
                <button type="button">Forgot password?</button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="ml-btn-primary"
              >
                {isLoading ? "Logging in..." : "Login to MoneyLens"}
              </button>
            </form>

            {/* Divider */}
            <div className="ml-divider" style={{ marginTop: "20px" }}>
              <div className="ml-divider-line" />
              <span>OR</span>
              <div className="ml-divider-line" />
            </div>

            {/* Google */}
            <button className="ml-btn-google">
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="rgba(255,255,255,0.5)" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="rgba(255,255,255,0.4)" />
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="rgba(255,255,255,0.35)" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="rgba(255,255,255,0.45)" />
              </svg>
              Continue with Google
            </button>

            {/* Footer */}
            <p className="ml-footer">
              Don't have an account?
              <Link href="/signup">Create account</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
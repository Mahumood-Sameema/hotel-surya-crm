import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { usePmsAuth } from "../context/PmsAuthContext";

export default function Login() {
  const { login } = usePmsAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email address is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const loggedIn = await login(email, password);
      if (loggedIn) {
        if (rememberMe) {
          localStorage.setItem("sr_pms_remember", email);
        } else {
          localStorage.removeItem("sr_pms_remember");
        }
        navigate("/dashboard");
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      setError(err.message || "An error occurred during login. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F5F5F5] px-4">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-extrabold text-[#B71C1C] tracking-wide font-serif mb-1">
          Surya Residency
        </h1>
        <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">
          Hotel Management System
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-premium border border-slate-200 p-8 text-slate-800">
        <h2 className="text-xl font-bold text-slate-805 mb-6 text-center">
          Staff Authentication
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-650 rounded-lg text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="receptionist@suryaresidency.com"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-slate-605 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-[#B71C1C] focus:ring-[#B71C1C] mr-2 h-4 w-4"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#B71C1C] hover:bg-[#9B1515] text-white py-2.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {submitting ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>

      <div className="mt-8 text-xs text-slate-400 font-medium">
        Secured connection. Authorized personnel only.
      </div>
    </div>
  );
}

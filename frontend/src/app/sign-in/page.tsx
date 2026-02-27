"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1E2F5C]">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #D4A017 0px,
            #D4A017 1px,
            transparent 1px,
            transparent 60px
          )`
        }}
      />

      <div className="relative w-full max-w-md px-6">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#D4A017] mb-4 shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
                fill="#1E2F5C" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pactura</h1>
          <p className="text-sm text-white/50 mt-1">Contract Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-[#1E2F5C] mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to your organization</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1E2F5C]" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.gov"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E2F5C] focus:border-transparent transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1E2F5C]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E2F5C] focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#1E2F5C] hover:bg-[#162344] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          © {new Date().getFullYear()} Aurum Equity LLC. All rights reserved.
        </p>
      </div>
    </div>
  );
}
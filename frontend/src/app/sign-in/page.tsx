"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { PacturaLogo } from "@/components/ui/PacturaLogo";

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
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #D4A017 0px,
            #D4A017 1px,
            transparent 1px,
            transparent 60px
          )`,
        }}
      />

      <div className="relative w-full max-w-md px-6">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-10">
          <PacturaLogo size="lg" variant="auto" priority />
          <h1
            className="mt-4 text-2xl tracking-widest font-semibold"
            style={{ color: "#C9A84C", fontVariant: "small-caps" }}
          >
            PACTURA.AI
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Contract Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-modal rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-white/50 mb-6">
            Sign in to your organization
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-white/70"
                htmlFor="email"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.gov"
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent transition"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-white/70"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="text-sm text-red-300 bg-red-950/60 border border-red-500/30 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#0A1628] text-sm font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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

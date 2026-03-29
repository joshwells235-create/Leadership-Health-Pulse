"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 bg-navy min-h-screen">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/leadshift-logo-white.svg"
            alt="LeadShift"
            className="h-8 mx-auto mb-4 opacity-90"
          />
          <p className="text-white/40 text-xs uppercase tracking-widest">
            Admin Dashboard
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-xl p-8 shadow-[0px_4px_30px_rgba(0,0,0,0.2)] space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-navy/60 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-navy/15 text-navy bg-navy/[0.02] focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-colors"
              placeholder="you@leadshift.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy/60 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-navy/15 text-navy bg-navy/[0.02] focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-magenta text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white font-semibold py-3 rounded-md hover:bg-navy/90 active:bg-navy transition-all disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}

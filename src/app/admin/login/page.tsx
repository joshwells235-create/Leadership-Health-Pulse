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
          <h1 className="text-3xl font-bold text-white">LeadShift</h1>
          <p className="text-white/50 mt-2 text-sm">Admin Dashboard</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-md p-8 shadow-[0px_2px_20px_rgba(0,0,0,0.15)] space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-navy/20 text-navy focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="you@leadshift.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-navy/20 text-navy focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-magenta text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue text-white font-semibold py-3 rounded-md hover:bg-blue/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}

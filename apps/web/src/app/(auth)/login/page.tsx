"use client";

import { useState } from "react";
import { createClient } from "@parallel/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-parallel-bg flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-display font-bold text-2xl text-parallel-text mb-12">
          PARALLEL
        </Link>
        <div className="surface-glass rounded-2xl p-8">
          <h1 className="font-display font-bold text-xl text-parallel-text mb-6">Welcome back</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-parallel-dim text-sm mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-parallel-bg border border-parallel-border rounded-lg px-4 py-2.5 text-parallel-text text-sm focus:outline-none focus:border-parallel-accent/60 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-parallel-dim text-sm mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-parallel-bg border border-parallel-border rounded-lg px-4 py-2.5 text-parallel-text text-sm focus:outline-none focus:border-parallel-accent/60 transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-parallel-accent hover:bg-parallel-accent/90 disabled:opacity-50 text-white font-medium rounded-lg transition-all text-sm">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center text-parallel-dim text-sm">
            No account?{" "}
            <Link href="/signup" className="text-parallel-accent hover:underline">Get started</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

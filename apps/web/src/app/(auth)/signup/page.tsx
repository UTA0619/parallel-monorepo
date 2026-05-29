"use client";

import { useState } from "react";
import { createClient } from "@parallel/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/onboarding` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
  }

  if (done) return (
    <div className="min-h-screen bg-parallel-bg flex items-center justify-center p-8">
      <div className="surface-glass rounded-2xl p-10 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-parallel-accent/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✉️</span>
        </div>
        <h2 className="font-display font-bold text-xl text-parallel-text mb-2">Check your email</h2>
        <p className="text-parallel-dim text-sm">We sent a confirmation link to <strong>{email}</strong>. Click it to begin your onboarding ritual.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-parallel-bg flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-display font-bold text-2xl text-parallel-text mb-12">PARALLEL</Link>
        <div className="surface-glass rounded-2xl p-8">
          <h1 className="font-display font-bold text-xl text-parallel-text mb-2">Create your account</h1>
          <p className="text-parallel-dim text-sm mb-6">Your other selves are waiting.</p>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-parallel-dim text-sm mb-1.5">Your name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full bg-parallel-bg border border-parallel-border rounded-lg px-4 py-2.5 text-parallel-text text-sm focus:outline-none focus:border-parallel-accent/60 transition-colors"
                placeholder="Aiko" />
            </div>
            <div>
              <label className="block text-parallel-dim text-sm mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-parallel-bg border border-parallel-border rounded-lg px-4 py-2.5 text-parallel-text text-sm focus:outline-none focus:border-parallel-accent/60 transition-colors"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-parallel-dim text-sm mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full bg-parallel-bg border border-parallel-border rounded-lg px-4 py-2.5 text-parallel-text text-sm focus:outline-none focus:border-parallel-accent/60 transition-colors"
                placeholder="min. 8 characters" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-parallel-accent hover:bg-parallel-accent/90 disabled:opacity-50 text-white font-medium rounded-lg transition-all text-sm">
              {loading ? "Creating…" : "Begin →"}
            </button>
          </form>
          <p className="mt-4 text-center text-parallel-dim text-xs leading-relaxed">
            By signing up you agree to our{" "}
            <Link href="/privacy" className="text-parallel-accent hover:underline">Privacy Policy</Link> and{" "}
            <Link href="/terms" className="text-parallel-accent hover:underline">Terms</Link>.
          </p>
          <p className="mt-4 text-center text-parallel-dim text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-parallel-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

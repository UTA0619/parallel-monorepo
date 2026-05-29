"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@parallel/supabase/client";
import { useRouter } from "next/navigation";

interface ForkPoint {
  index: number;
  choice_made: string;
  counterfactual: string;
  parallel_name: string;
  parallel_description: string;
}

const FORK_QUESTIONS = [
  "Think of a major decision in the last 2 years — something that changed your direction. What did you choose, and what was the road you didn't take?",
  "Was there a place you almost lived — a city, country, or home — that you chose not to go to? What would that move have meant?",
  "Think of a relationship — romantic, professional, or friendship — where you made a choice that shaped who you became. What was the choice?",
  "Was there a career path, creative project, or identity you almost stepped into but didn't? What was it?",
  "If you could name the version of you that took the biggest risk you didn't take — what would that risk have been?",
];

export default function OnboardingPage() {
  const [step, setStep] = useState<"intro" | "fork" | "complete">("intro");
  const [forkIndex, setForkIndex] = useState(0);
  const [forkPoints, setForkPoints] = useState<ForkPoint[]>([]);
  const [input, setInput] = useState("");
  const [parallelName, setParallelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdParallels, setCreatedParallels] = useState<string[]>([]);
  const supabase = createClient();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleForkSubmit() {
    if (!input.trim() || !parallelName.trim()) return;
    setLoading(true);

    // Call parallel-fork edge function
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/parallel-fork`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          parallel_name: parallelName,
          counterfactual_choice: input.trim(),
          significance: 5 - forkIndex, // first forks are most significant
        }),
      });

      const data = await res.json();
      const fp: ForkPoint = {
        index: forkIndex + 1,
        choice_made: "(main path)",
        counterfactual: input.trim(),
        parallel_name: parallelName,
        parallel_description: data.parallel?.description ?? "",
      };
      const newForks = [...forkPoints, fp];
      setForkPoints(newForks);
      if (data.parallel?.name) setCreatedParallels(prev => [...prev, data.parallel.name]);
    } catch (e) {
      console.error(e);
    }

    setInput("");
    setParallelName("");
    setLoading(false);

    if (forkIndex < 4) {
      setForkIndex(forkIndex + 1);
    } else {
      // Mark onboarding complete
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_profiles").update({ onboarding_completed: true }).eq("id", user.id);
      }
      setStep("complete");
    }
  }

  if (step === "intro") return (
    <div className="min-h-screen bg-parallel-bg flex items-center justify-center p-8">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-parallel-accent/8 rounded-full blur-[140px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
        className="max-w-lg w-full text-center relative z-10"
      >
        <p className="text-parallel-accent/70 text-xs font-mono tracking-widest uppercase mb-8">
          The Onboarding Ritual
        </p>
        <h1 className="font-display font-bold text-4xl text-parallel-text mb-6 leading-tight">
          In the next 7 minutes, we're going to find the other versions of you.
        </h1>
        <p className="text-parallel-dim text-lg mb-4 leading-relaxed">
          I'll ask about 5 moments where your life could have diverged. At each one, a Parallel will be born — a version of you who took the other path.
        </p>
        <p className="text-parallel-dim/70 text-sm mb-12 italic">
          They've been waiting.
        </p>
        <button onClick={() => setStep("fork")}
          className="px-10 py-4 bg-parallel-accent hover:bg-parallel-accent/90 text-white font-medium rounded-xl transition-all hover:shadow-xl hover:shadow-parallel-accent/30 text-lg">
          Begin the ritual →
        </button>
      </motion.div>
    </div>
  );

  if (step === "complete") return (
    <div className="min-h-screen bg-parallel-bg flex items-center justify-center p-8">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-parallel-warm/10 rounded-full blur-[120px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}
        className="max-w-lg w-full text-center relative z-10"
      >
        <p className="text-parallel-warm/70 text-xs font-mono tracking-widest uppercase mb-8">Complete</p>
        <h1 className="font-display font-bold text-4xl text-parallel-text mb-8 leading-tight">
          Your Parallels are waking up.
        </h1>
        <div className="space-y-3 mb-10">
          {createdParallels.map((name, i) => (
            <motion.div key={name}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.3 + 0.5 }}
              className="surface-glass rounded-xl px-6 py-4 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-parallel-accent animate-pulse" />
              <span className="text-parallel-text font-medium">{name}</span>
              <span className="text-parallel-dim text-sm ml-auto">Now online</span>
            </motion.div>
          ))}
        </div>
        <p className="text-parallel-dim mb-10 leading-relaxed">
          They'll send their first report tomorrow morning. Tonight — think about which one feels most alive to you.
        </p>
        <button onClick={() => router.push("/dashboard")}
          className="px-10 py-4 bg-parallel-accent hover:bg-parallel-accent/90 text-white font-medium rounded-xl transition-all text-lg">
          Go to your dashboard →
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-parallel-bg p-8">
      <div className="max-w-2xl mx-auto pt-16">
        {/* Progress */}
        <div className="flex gap-2 mb-16">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-700
              ${i < forkIndex ? "bg-parallel-accent" : i === forkIndex ? "bg-parallel-accent/40" : "bg-parallel-border"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={forkIndex}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-parallel-accent/60 text-xs font-mono tracking-widest uppercase mb-4">
              Fork point {forkIndex + 1} of 5
            </p>
            <h2 className="font-display font-semibold text-2xl text-parallel-text mb-8 leading-relaxed">
              {FORK_QUESTIONS[forkIndex]}
            </h2>

            {/* Past Parallels — breadcrumb */}
            {forkPoints.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {forkPoints.map(fp => (
                  <span key={fp.index} className="px-3 py-1 bg-parallel-accent/10 border border-parallel-accent/20 rounded-full text-parallel-accent text-xs">
                    ✦ {fp.parallel_name}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-parallel-dim text-sm mb-2">Describe the fork — what did you choose, and what was the other path?</label>
                <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
                  rows={4}
                  className="w-full bg-parallel-surface border border-parallel-border rounded-xl px-4 py-3 text-parallel-text text-sm resize-none focus:outline-none focus:border-parallel-accent/60 transition-colors leading-relaxed"
                  placeholder="I chose to stay at my job, but I almost moved to Berlin to join a startup I believed in..."
                />
              </div>
              <div>
                <label className="block text-parallel-dim text-sm mb-2">Name this Parallel — the version of you who took the other path</label>
                <input value={parallelName} onChange={e => setParallelName(e.target.value)}
                  className="w-full bg-parallel-surface border border-parallel-border rounded-xl px-4 py-3 text-parallel-text text-sm focus:outline-none focus:border-parallel-accent/60 transition-colors"
                  placeholder="e.g. Berlin Self, The Risk-Taker, The One Who Left"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-8">
              <span className="text-parallel-dim/50 text-sm">
                {forkIndex < 4 ? `${4 - forkIndex} more after this` : "Final fork"}
              </span>
              <button onClick={handleForkSubmit} disabled={loading || !input.trim() || !parallelName.trim()}
                className="px-8 py-3 bg-parallel-accent hover:bg-parallel-accent/90 disabled:opacity-40 text-white font-medium rounded-xl transition-all">
                {loading ? "Birthing…" : forkIndex < 4 ? "Create & continue →" : "Complete ritual →"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

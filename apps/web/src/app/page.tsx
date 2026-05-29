"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const PARALLELS_PREVIEW = [
  { name: "Tokyo Self",        desc: "The one who moved abroad and found a different kind of courage." },
  { name: "The Entrepreneur",  desc: "Took the leap. Some days brilliant, some days hard." },
  { name: "The One Who Stayed",desc: "Chose roots over adventure. Found depth instead of breadth." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-parallel-bg overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-parallel-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-parallel-warm/8 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="font-display font-bold text-xl text-parallel-text tracking-tight">
          PARALLEL
        </span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-parallel-dim hover:text-parallel-text transition-colors text-sm">
            Sign in
          </Link>
          <Link href="/signup"
            className="px-4 py-2 bg-parallel-accent hover:bg-parallel-accent/90 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-parallel-accent/25">
            Get early access
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-parallel-accent/80 text-sm font-mono tracking-widest uppercase mb-6">
            Identity OS
          </p>
          <h1 className="font-display font-bold text-5xl md:text-7xl text-parallel-text leading-[1.05] mb-6">
            Live 100 lives.<br />
            <span className="text-gradient-accent">Choose the best one.</span>
          </h1>
          <p className="text-parallel-dim text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Multiple versions of you — each one a path you didn't take — running in parallel.
            Every morning, they report back with what they've learned.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"
              className="px-8 py-4 bg-parallel-accent hover:bg-parallel-accent/90 text-white font-medium rounded-xl transition-all hover:shadow-xl hover:shadow-parallel-accent/30 text-base">
              Start your ritual →
            </Link>
            <a href="#how-it-works"
              className="px-8 py-4 border border-parallel-border hover:border-parallel-accent/40 text-parallel-text rounded-xl transition-all text-base">
              See how it works
            </a>
          </div>
        </motion.div>

        {/* Parallel cards preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {PARALLELS_PREVIEW.map((p, i) => (
            <div key={p.name}
              className="surface-glass rounded-2xl p-6 text-left hover:border-parallel-accent/30 transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-parallel-accent to-parallel-warm/60 mb-4
                flex items-center justify-center text-white text-sm font-bold">
                {i + 1}
              </div>
              <h3 className="font-display font-semibold text-parallel-text mb-2">{p.name}</h3>
              <p className="text-parallel-dim text-sm leading-relaxed">{p.desc}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-parallel-accent opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="w-1.5 h-1.5 rounded-full bg-parallel-accent animate-pulse" />
                <span>Reporting daily</span>
              </div>
            </div>
          ))}
        </motion.div>
      </main>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 max-w-4xl mx-auto px-8 py-24">
        <h2 className="font-display font-bold text-3xl text-parallel-text text-center mb-16">
          How PARALLEL works
        </h2>
        <div className="space-y-12">
          {[
            { step: "01", title: "The 7-minute ritual", body: "Voice-first onboarding. You narrate 5 key decisions. At each fork, a Parallel is born — a version of you who made the other choice." },
            { step: "02", title: "They live their lives", body: "Your Parallels develop independently. They accumulate experience, memories, and perspectives from their diverged paths. They are not chatbots — they are versions of you." },
            { step: "03", title: "Morning dispatches", body: "Every morning, each Parallel sends a report. Not generic advice — observations filtered through their specific path and your shared core identity." },
            { step: "04", title: "Conversations across paths", body: "Tap any Parallel to continue the conversation. They remember your history. They know you because they are you." },
          ].map((item) => (
            <div key={item.step} className="flex gap-8 items-start">
              <span className="font-mono text-4xl font-bold text-parallel-accent/20 shrink-0 w-16">{item.step}</span>
              <div>
                <h3 className="font-display font-semibold text-xl text-parallel-text mb-2">{item.title}</h3>
                <p className="text-parallel-dim leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="relative z-10 text-center py-24 px-8">
        <div className="surface-glass max-w-2xl mx-auto rounded-3xl p-12">
          <h2 className="font-display font-bold text-3xl text-parallel-text mb-4">
            Your other selves are waiting.
          </h2>
          <p className="text-parallel-dim mb-8">Join the waitlist. First 1,000 users get unlimited Parallels free for 3 months.</p>
          <Link href="/signup"
            className="inline-block px-10 py-4 bg-parallel-accent hover:bg-parallel-accent/90 text-white font-medium rounded-xl transition-all hover:shadow-xl hover:shadow-parallel-accent/30">
            Begin →
          </Link>
        </div>
      </section>
    </div>
  );
}

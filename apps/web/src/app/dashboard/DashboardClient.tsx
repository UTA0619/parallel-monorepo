"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { UserProfile, Parallel, DailyReport } from "@parallel/shared-types";

interface Props {
  profile: UserProfile | null;
  parallels: Partial<Parallel>[];
  reports: Partial<DailyReport>[];
}

function AffectionBar({ score }: { score: number }) {
  return (
    <div className="h-0.5 w-full bg-parallel-border rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-parallel-accent to-parallel-warm/70 rounded-full transition-all duration-1000"
        style={{ width: `${score * 100}%` }} />
    </div>
  );
}

function ParallelCard({ parallel, report }: { parallel: Partial<Parallel>; report?: Partial<DailyReport> }) {
  const isUnread = report && !report.opened_at;
  return (
    <Link href={`/parallel/${parallel.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }} transition={{ duration: 0.3 }}
        className="surface-glass rounded-2xl p-5 cursor-pointer group hover:border-parallel-accent/30 transition-all relative overflow-hidden"
      >
        {isUnread && (
          <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-parallel-warm animate-pulse" />
        )}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-parallel-accent/60 to-parallel-warm/40 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
            {parallel.name?.[0] ?? "P"}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-parallel-text text-sm truncate">{parallel.name}</h3>
            <p className="text-parallel-dim text-xs mt-0.5 line-clamp-1">{parallel.description}</p>
          </div>
        </div>

        {report ? (
          <p className="text-parallel-dim text-xs leading-relaxed line-clamp-3 mb-4">{report.narrative}</p>
        ) : (
          <p className="text-parallel-dim/50 text-xs italic mb-4">Generating today's report…</p>
        )}

        <AffectionBar score={parallel.affection_score ?? 0} />
        <div className="flex justify-between mt-1.5">
          <span className="text-parallel-dim/50 text-xs">affection</span>
          <span className="text-parallel-dim/50 text-xs">{Math.round((parallel.affection_score ?? 0) * 100)}%</span>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-parallel-accent opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Open conversation</span>
          <span>→</span>
        </div>
      </motion.div>
    </Link>
  );
}

export default function DashboardClient({ profile, parallels, reports }: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const reportMap = new Map(reports.map(r => [r.parallel_id, r]));
  const unreadCount = reports.filter(r => !r.opened_at).length;

  return (
    <div className="min-h-screen bg-parallel-bg">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-[400px] h-[400px] bg-parallel-accent/6 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-parallel-border/50 px-8 py-4 flex items-center justify-between">
        <span className="font-display font-bold text-lg text-parallel-text tracking-tight">PARALLEL</span>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 bg-parallel-warm/20 text-parallel-warm rounded-full text-xs font-medium">
              {unreadCount} new {unreadCount === 1 ? "report" : "reports"}
            </span>
          )}
          <div className="w-8 h-8 rounded-full bg-parallel-accent/20 flex items-center justify-center text-parallel-accent text-sm font-bold">
            {profile?.display_name?.[0]?.toUpperCase() ?? "?"}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-8 py-10">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <p className="text-parallel-dim text-sm mb-1">{greeting}, {profile?.display_name?.split(" ")[0] ?? "traveler"}</p>
          <h1 className="font-display font-bold text-3xl text-parallel-text">
            {parallels.length === 0
              ? "Your Parallels are waking up."
              : `Your ${parallels.length} Parallel${parallels.length === 1 ? "" : "s"} ${reports.length > 0 ? "have reported in." : "are generating today's reports."}`}
          </h1>
        </motion.div>

        {/* Top convergence insight */}
        {reports[0] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="mb-10 surface-glass rounded-2xl p-6 border-l-2 border-parallel-accent">
            <p className="text-parallel-accent text-xs font-mono tracking-widest uppercase mb-3">Today's top insight</p>
            <p className="text-parallel-text leading-relaxed line-clamp-4">{reports[0].narrative}</p>
            <p className="text-parallel-dim text-xs mt-3">
              — from <Link href={`/parallel/${reports[0].parallel_id}`} className="text-parallel-accent hover:underline">
                {parallels.find(p => p.id === reports[0]?.parallel_id)?.name ?? "your Parallel"}
              </Link>
            </p>
          </motion.div>
        )}

        {/* Parallels grid */}
        {parallels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parallels.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <ParallelCard parallel={p} report={p.id ? reportMap.get(p.id) : undefined} />
              </motion.div>
            ))}
            {/* Add Parallel CTA */}
            <Link href="/parallel/new">
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: parallels.length * 0.08 }}
                whileHover={{ y: -2 }} className="rounded-2xl border border-dashed border-parallel-border/60 hover:border-parallel-accent/40 p-5 cursor-pointer group transition-all h-full flex flex-col items-center justify-center gap-3 min-h-[200px]">
                <div className="w-10 h-10 rounded-full border border-dashed border-parallel-accent/40 group-hover:border-parallel-accent flex items-center justify-center text-parallel-accent/50 group-hover:text-parallel-accent text-2xl transition-all">+</div>
                <p className="text-parallel-dim/60 group-hover:text-parallel-dim text-sm transition-colors text-center">Fork a new Parallel</p>
              </motion.div>
            </Link>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-parallel-dim mb-6">No Parallels yet.</p>
            <Link href="/onboarding"
              className="px-8 py-3 bg-parallel-accent text-white rounded-xl font-medium hover:bg-parallel-accent/90 transition-all">
              Begin the ritual →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

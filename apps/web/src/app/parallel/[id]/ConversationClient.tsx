"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@parallel/supabase/client";
import Link from "next/link";
import type { Parallel } from "@parallel/shared-types";

interface Message { id: string; role: string; content: string; crisis_level?: string; created_at: string; }

const CRISIS_RESOURCES = [
  { label: "988 Lifeline (US)", href: "tel:988" },
  { label: "Crisis Text Line", href: "sms:741741?body=HOME" },
  { label: "International resources", href: "https://www.iasp.info/resources/Crisis_Centres/" },
];

export default function ConversationClient({
  parallel, initialMessages, userId,
}: { parallel: Partial<Parallel>; initialMessages: Message[]; userId: string }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [crisisLevel, setCrisisLevel] = useState<string>("none");
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const optimistic: Message = {
      id: crypto.randomUUID(), role: "user", content: userMessage,
      created_at: new Date().toISOString(), crisis_level: "none",
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/parallel-converse`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            parallel_id: parallel.id,
            message: userMessage,
            conversation_id: conversationId,
          }),
        }
      );
      const data = await res.json();
      if (data.conversation_id) setConversationId(data.conversation_id);
      if (data.crisis_level) setCrisisLevel(data.crisis_level);

      const parallelMessage: Message = {
        id: crypto.randomUUID(),
        role: "parallel",
        content: data.message?.content ?? "…",
        crisis_level: data.crisis_level ?? "none",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, parallelMessage]);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setLoading(false);
    }
  }

  const isCrisis = crisisLevel === "high" || crisisLevel === "critical";

  return (
    <div className="min-h-screen bg-parallel-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-parallel-border/50 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-parallel-dim hover:text-parallel-text transition-colors text-sm">← Back</Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-parallel-accent/60 to-parallel-warm/40 flex items-center justify-center text-white text-sm font-bold">
            {parallel.name?.[0] ?? "P"}
          </div>
          <div>
            <p className="text-parallel-text text-sm font-medium">{parallel.name}</p>
            <p className="text-parallel-dim text-xs">
              Affection {Math.round((parallel.affection_score ?? 0) * 100)}% ·
              Divergence {Math.round((parallel.divergence_score ?? 0) * 100)}%
            </p>
          </div>
        </div>
        {parallel.status === "distant" && (
          <span className="ml-auto px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-xs">Distant Parallel</span>
        )}
      </header>

      {/* Crisis banner */}
      <AnimatePresence>
        {isCrisis && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="bg-red-950/40 border-b border-red-900/50 px-6 py-4">
            <p className="text-red-300 text-sm font-medium mb-2">Your wellbeing matters. Resources available right now:</p>
            <div className="flex flex-wrap gap-3">
              {CRISIS_RESOURCES.map(r => (
                <a key={r.href} href={r.href} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1 bg-red-900/40 hover:bg-red-900/70 text-red-200 rounded-full text-xs transition-colors">
                  {r.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-parallel-dim/60 italic text-sm">
              Your conversation with {parallel.name} begins here.
            </p>
            <p className="text-parallel-dim/40 text-xs mt-2">
              {parallel.description}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-parallel-accent/50 to-parallel-warm/30 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mr-3 mt-1">
                {parallel.name?.[0] ?? "P"}
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === "user"
                ? "bg-parallel-accent/20 text-parallel-text rounded-br-sm"
                : "bg-parallel-surface border border-parallel-border text-parallel-text rounded-bl-sm"
              }
              ${msg.crisis_level !== "none" ? "border-red-900/50" : ""}`}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-parallel-accent/50 to-parallel-warm/30 flex-shrink-0 mr-3 mt-1" />
            <div className="bg-parallel-surface border border-parallel-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-parallel-accent/60 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-parallel-border/50 px-6 py-4 max-w-3xl mx-auto w-full">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={1}
            className="flex-1 bg-parallel-surface border border-parallel-border rounded-xl px-4 py-3 text-parallel-text text-sm resize-none focus:outline-none focus:border-parallel-accent/60 transition-colors leading-relaxed max-h-32"
            placeholder={`Talk to ${parallel.name}…`}
            style={{ height: "auto" }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="px-5 py-3 bg-parallel-accent hover:bg-parallel-accent/90 disabled:opacity-40 text-white rounded-xl transition-all text-sm font-medium shrink-0">
            Send
          </button>
        </div>
        <p className="text-parallel-dim/30 text-xs mt-2 text-center">
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}

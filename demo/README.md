# PARALLEL — Interactive Demo

A **zero-dependency, no-backend** walkthrough of the PARALLEL product.
No signup, no API keys, no install. The "AI" is a local, in-persona response engine — nothing leaves your machine.

## Run it

**Option A — double-click**
Open `demo/index.html` in any browser. Done.

**Option B — local server** (recommended, so `localStorage` persistence works)
```bash
cd demo
python3 -m http.server 4599
# then open http://localhost:4599
```

## What you can do

1. **Landing** → feel the pitch and see your three seeded Parallels.
2. **The Fork Ritual** → answer 5 prompts; your answers personalize your first Parallel.
3. **Dashboard** → read each Parallel's morning report + today's top insight.
4. **Conversation** → talk to any Parallel. Each replies *in character*:
   - Try `"I've been feeling stuck at work"` → the Entrepreneur answers through a risk/ambition lens.
   - Try the same to *The One Who Stayed* → a depth/presence lens instead.
   - Affection rises as you talk.
5. **Safety** → the crisis-detection path is wired in. (It triggers on explicit self-harm language and surfaces 988 / Crisis Text Line resources — the same behavior as the production `crisis-detect` edge function.)

## What's simulated vs. real

| Real in production | Simulated here |
|---|---|
| Persona-grounded conversation | ✅ local response engine (keyword theme + persona voice) |
| Daily reports | ✅ pre-written, real Claude Sonnet in prod |
| Crisis detection + resources | ✅ keyword trigger here; Claude Haiku classifier in prod |
| Affection / divergence scoring | ✅ simplified (+0.02 per exchange) |
| Auth, persistence, push, IAP | ❌ stubbed — this is a feel-the-product demo |

This demo mirrors the real app's design system, data model, and conversation UX 1:1.

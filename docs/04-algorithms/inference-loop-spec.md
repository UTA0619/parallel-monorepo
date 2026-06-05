# PARALLEL Inference Loop Specification

> The 4-Stage Loop: Sense → Reflect → Simulate → Advise  
> Status: v1  
> Owner: Architect Agent

---

## Overview

```
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌────────┐
│  SENSE   │────▶│ REFLECT │────▶│ SIMULATE │────▶│ ADVISE │
│          │     │         │     │          │     │        │
│ Capture  │     │ Memory  │     │ Path     │     │Morning │
│ user     │     │ retrieval│    │ Monte    │     │Report  │
│ context  │     │ + tag   │     │ Carlo    │     │+ Tips  │
└──────────┘     └─────────┘     └──────────┘     └────────┘
  <500ms           <2s             <30s             <5s
                                  (nightly)         (streaming)
```

---

## Stage 1: SENSE

**Purpose:** Capture and classify incoming user signal.

**Inputs:**
- Voice audio (WAV, ≤5min) → transcribed via Whisper
- Text input (direct)
- Behavioral events (app open, notification interaction, streak data)

**Processing:**
1. Transcription (Whisper API) → `content: string`
2. Language detection → route to appropriate prompt template
3. Sentence segmentation → split into discrete memory candidates
4. Emotion extraction (Claude Haiku) → `EmotionVector`
5. Behavioral tag classification (Claude Haiku) → `tags: string[]`

**Outputs:**
```typescript
interface SenseOutput {
  raw_content: string;
  segments: string[];           // Split into discrete memories
  emotion: EmotionVector;
  proposed_tags: string[];
  source: MemorySource;
  processing_ms: number;
}
```

**Latency SLO:** p95 < 500ms (excluding transcription)  
**Transcription SLO:** p95 < 2s for ≤30s audio

**Failure modes:**
| Failure | Handling |
|---------|---------|
| Transcription API down | Queue for retry; show "Processing..." in UI |
| Audio too noisy (SNR < 15dB) | Prompt user to re-record |
| Language unsupported | Fallback to text input mode |
| Content too long | Chunk into ≤4000 char segments |

---

## Stage 2: REFLECT

**Purpose:** Retrieve relevant memories and build context for simulation and advice.

**Inputs:**
- SenseOutput (current context)
- user_id (for memory retrieval)
- Optional: time-of-day context, life domain hint

**Processing:**
1. Embed current context → query vector (text-embedding-3-small)
2. ANN search in pgvector → top-K memories (K=20)
3. Re-rank by retrieval_score formula (see memory-data-model.md)
4. Cluster analysis → identify active life domains
5. Salience update → increment access_count on retrieved memories
6. New memory storage → persist current SenseOutput as new memory

**Outputs:**
```typescript
interface ReflectOutput {
  retrieved_memories: Memory[];     // Top-10 after re-ranking
  active_domains: LifeDomain[];
  memory_gaps: string[];            // Topics with sparse memory coverage
  new_memory_id: string;
  context_summary: string;          // Claude Haiku summary for Stage 3 input
}
```

**Latency SLO:** p95 < 2s  
**Retrieval precision target:** Top-10 contains ≥7 highly relevant memories

**Failure modes:**
| Failure | Handling |
|---------|---------|
| DB timeout | Retry once; fall back to recent-memories-only |
| Embedding API down | Queue memory; use keyword search fallback |
| No memories yet (new user) | Use onboarding context only |

---

## Stage 3: SIMULATE

**Purpose:** Run overnight Monte Carlo simulation of alternative life paths.

**Inputs:**
- All user memories (full corpus)
- Behavioral pattern analysis (30-day window)
- External context (market trends, seasonal patterns — anonymized aggregate)

**Processing:**
1. Build behavioral profile from memory corpus
2. Identify 3 key decision nodes (active choices user faces)
3. For each decision node: branch into 3 alternative paths
4. Monte Carlo: simulate 10,000 path variants per user
5. Score paths by predicted Affection Score, goal alignment, risk
6. Select top-3 paths for morning report inclusion

**Outputs:**
```typescript
interface SimulateOutput {
  decision_nodes: DecisionNode[];
  top_paths: LifePath[];           // Top-3 alternative paths
  confidence_scores: number[];     // 0.0–1.0 per path
  simulation_metadata: {
    variants_run: number;          // ~10,000
    duration_ms: number;
    model_version: string;
  };
}

interface LifePath {
  id: string;
  title: string;                   // e.g., "Career pivot to independent consulting"
  narrative: string;               // 1-paragraph description
  probability: number;             // Estimated likelihood of positive outcome
  key_actions: string[];           // 3 specific next steps
  risks: string[];                 // Top 2 risks
  affection_score_delta: number;   // Predicted change in Affection Score
}
```

**Schedule:** Nightly, 2am–4am user local time  
**Latency SLO:** p95 < 4 hours for 1M users (batch, not real-time)  
**Cost target:** ≤$0.01 per user per night at scale

**Failure modes:**
| Failure | Handling |
|---------|---------|
| Simulation incomplete by morning | Use previous day's results |
| Too few memories (<10) | Skip simulation; use generic morning insights |
| Cost spike | Circuit breaker: pause simulation at $0.02/user |

---

## Stage 4: ADVISE

**Purpose:** Generate the Morning Report and on-demand conversational advice.

**Inputs:**
- ReflectOutput (retrieved memories, context)
- SimulateOutput (top life paths, if available)
- User preferences (tone, report length, focus areas)
- Current date/time context

**Processing:**
1. Select 1–3 key insights from retrieved memories
2. Select 1 life-path recommendation (if simulation available)
3. Generate Morning Report via Claude Sonnet (streamed)
4. Personalize tone and length per user preferences
5. Append implementation intention for top insight
6. Cache report with 24h TTL

**Morning Report Structure:**
```
## Good morning, [Name]. [Personalized opener]

### 🔍 Today's Insight
[1 key insight from memory analysis, ≤100 words]

### 🌌 A Path Worth Considering
[1 life-path scenario, ≤150 words, with 3 specific actions]

### ⚡ Today's Intention
[1 specific implementation intention, e.g., "When I feel overwhelmed at work today, I will take 10 minutes to walk outside before responding."]

---
*Powered by your [N] memories | Updated [timestamp]*
```

**Outputs:**
```typescript
interface AdviseOutput {
  morning_report: string;          // Markdown, ≤500 words
  insights: Insight[];             // 1–3 structured insights
  recommended_path: LifePath | null;
  implementation_intention: string;
  generation_metadata: {
    model: 'claude-sonnet-4-6';
    tokens_used: number;
    cached: boolean;
    duration_ms: number;
  };
}
```

**Latency SLO:** p95 < 5s (streaming; first token < 1s)  
**Delivery:** Push notification by 7:00am user local time  
**Report Open Rate target:** ≥70% at D7

**Failure modes:**
| Failure | Handling |
|---------|---------|
| Claude API down | Deliver cached fallback report with "AI temporarily unavailable" notice |
| Streaming timeout | Deliver partial report with truncation notice |
| Report too generic (<3 specific details) | Retry with higher temperature; log for prompt improvement |

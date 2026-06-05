# Memory Layer — Data Model Primitives

> Status: v1  
> Owner: Architect Agent  
> Informs: ADR-011 (Vector DB), Phase 2 implementation

---

## Core Entity: Memory

```typescript
interface Memory {
  // Identity
  id: string;                    // UUID v7 (time-ordered)
  user_id: string;               // FK → auth.users
  
  // Content
  content: string;               // Raw text (≤4000 chars)
  embedding: number[];           // 1536-dim vector (text-embedding-3-small)
  
  // Classification
  source: MemorySource;          // 'onboarding' | 'tap_to_converse' | 'reflection' | 'morning_report' | 'system'
  tags: string[];                // Behavioral tags from taxonomy v1 (≤10 per memory)
  emotion: EmotionVector;        // { valence: -1..1, arousal: 0..1 }
  
  // Scoring
  salience: number;              // 0.0–1.0 (user-importance signal)
  recency_score: number;         // Computed: exp(-λ * days_since_created)
  access_count: number;          // Times retrieved
  
  // Temporal
  created_at: timestamptz;
  updated_at: timestamptz;
  event_at: timestamptz | null;  // When the event occurred (may differ from capture time)
  
  // Privacy
  encrypted: boolean;            // true for sensitive content (crisis tier 2+)
  retention_until: date | null;  // null = keep forever; set for TTL-limited memories
}

type MemorySource = 
  | 'onboarding'
  | 'tap_to_converse'
  | 'reflection'
  | 'morning_report'
  | 'system';

interface EmotionVector {
  valence: number;    // -1 (negative) to +1 (positive)
  arousal: number;    // 0 (calm) to 1 (excited)
}
```

---

## Memory Cluster Entity

```typescript
interface MemoryCluster {
  id: string;
  user_id: string;
  name: string;                  // Auto-generated label (e.g., "Work challenges Q1 2026")
  memory_ids: string[];          // FK → memories
  centroid_embedding: number[];  // Mean vector of member memories
  cluster_type: ClusterType;
  created_at: timestamptz;
  updated_at: timestamptz;
}

type ClusterType = 
  | 'life_domain'    // Work, relationships, health, finances, creativity, spirituality
  | 'temporal'       // Monthly, quarterly clusters
  | 'emotional'      // Stress cluster, joy cluster
  | 'project'        // Goal-specific clusters
  | 'auto';          // Algorithm-generated
```

---

## Causal Link Entity

```typescript
interface CausalLink {
  id: string;
  user_id: string;
  cause_memory_id: string;       // FK → memories
  effect_memory_id: string;      // FK → memories
  strength: number;              // 0.0–1.0 (ML-inferred correlation strength)
  link_type: CausalLinkType;
  created_at: timestamptz;
}

type CausalLinkType =
  | 'triggers'           // A caused B
  | 'prevents'           // A prevented B
  | 'correlates_with'    // A and B co-occur
  | 'precedes';          // A consistently precedes B
```

---

## Memory Score Formula

```
retrieval_score(m, query_embedding, context) =
  α × semantic_similarity(m.embedding, query_embedding)
  + β × recency_score(m)
  + γ × salience(m)
  + δ × context_match(m, context)

Where:
  α = 0.45  (semantic relevance weight)
  β = 0.25  (recency weight)
  γ = 0.20  (salience weight)
  δ = 0.10  (context match weight)

recency_score(m) = exp(-0.05 × days_since_created(m))
  # Decay constant λ=0.05 → half-life ≈ 14 days

salience(m) = 0.3 × explicit_user_rating
            + 0.4 × access_frequency_normalized
            + 0.3 × emotional_intensity(|valence| + arousal) / 2
```

---

## Life Domain Taxonomy

```
LIFE DOMAINS (6 top-level)
├── WORK
│   ├── career_growth
│   ├── relationships_professional
│   ├── skills_development
│   └── work_life_balance
├── RELATIONSHIPS
│   ├── romantic
│   ├── family
│   ├── friends
│   └── community
├── HEALTH
│   ├── physical
│   ├── mental
│   ├── sleep
│   └── nutrition
├── FINANCES
│   ├── income
│   ├── spending
│   ├── investing
│   └── debt
├── CREATIVITY
│   ├── projects
│   ├── learning
│   └── expression
└── SPIRITUALITY
    ├── meaning
    ├── values
    └── practices
```

---

## Database Schema (PostgreSQL + pgvector)

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE memories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) <= 4000),
  embedding     vector(1536),
  source        TEXT NOT NULL CHECK (source IN ('onboarding','tap_to_converse','reflection','morning_report','system')),
  tags          TEXT[] DEFAULT '{}',
  emotion       JSONB DEFAULT '{"valence":0,"arousal":0}',
  salience      FLOAT DEFAULT 0.5 CHECK (salience BETWEEN 0 AND 1),
  access_count  INT DEFAULT 0,
  encrypted     BOOLEAN DEFAULT FALSE,
  retention_until DATE,
  event_at      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ANN index for semantic search
CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- User scoped index for fast per-user queries
CREATE INDEX ON memories (user_id, created_at DESC);

-- RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own memories"
  ON memories FOR ALL
  USING (auth.uid() = user_id);
```

---

## ERD Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  auth.users │1──∞─│    memories      │∞──∞─│  memory_cluster │
│  ─────────  │     │  ─────────────   │     │  ─────────────  │
│  id (UUID)  │     │  id             │     │  id             │
│  email      │     │  user_id (FK)   │     │  user_id (FK)   │
│  ...        │     │  content        │     │  memory_ids[]   │
└─────────────┘     │  embedding      │     │  centroid_emb   │
                    │  tags[]         │     └─────────────────┘
                    │  salience       │
                    │  ...            │     ┌─────────────────┐
                    └──────┬──────────┘     │  causal_links   │
                           │                │  ─────────────  │
                           │ 1:N cause      │  cause_mem_id   │
                           └────────────────│  effect_mem_id  │
                                            │  strength       │
                                            └─────────────────┘
```

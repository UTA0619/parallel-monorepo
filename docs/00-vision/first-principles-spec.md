# PARALLEL — First-Principles Specification

**Version:** 1.0.0  
**Owner Agent:** Architect  
**Date:** 2026-05-29  
**Status:** Complete  
**DoD:** All terms formally defined | Zero ambiguity in glossary

---

## Part I — Foundational Axioms

### Axiom 1: Identity is Distributional

A person's identity is not a fixed point but a **probability distribution over possible selves**, shaped by the sequence of choices made and not made. At any moment *t*, a person *P* can be described as:

```
P(t) = ∫ Σ_i w_i · S_i(t) di
```

Where `S_i(t)` is the state of self-version *i* at time *t*, and `w_i` is the weight (subjective probability) assigned to that self-version by the person.

PARALLEL makes this distribution explicit and navigable.

### Axiom 2: Divergence is Informative

The distance between a lived path and an alternate path is proportional to the information content of that alternate path. A Parallel who made wildly different choices generates more signal about possibility space than one who made near-identical choices.

**Divergence is not deviation — it is data.**

### Axiom 3: Insight Requires Contrast

Self-knowledge that comes from a single path is fundamentally limited. Insight requires comparison. The gap between what your Parallel experienced and what you experienced is where genuine self-knowledge lives. This is why journaling alone is insufficient and why conversation with a Parallel is more valuable than reflection on a single path.

### Axiom 4: Parallels Must Remain You

A Parallel that drifts too far from the core identity of its origin user is no longer a version of that user — it becomes a fictional character. PARALLEL enforces **drift bounds**: the cosine similarity of a Parallel's core identity embedding to the user's core embedding must remain ≥ 0.65. Beyond this threshold, the Parallel is marked "Distant" and its insights are reweighted accordingly.

### Axiom 5: Engagement Must Serve Life Outcomes

Every feature PARALLEL builds must be traceable to at least one user-defined life outcome (career, relationships, health, creativity, meaning). Features that drive engagement without serving outcomes are **prohibited by design**, not just by policy.

---

## Part II — Formal Glossary

All terms are formally defined here. No term may be used in code, PRDs, or ADRs without referencing this definition. Ambiguous usage is a P1 documentation bug.

---

### User

A human being who has completed PARALLEL onboarding and has at least one active Parallel.

**Formal:** `User := { id: UUID, core_embedding: ℝ^1024, created_at: timestamp, parallels: [Parallel], vault_key: EncryptedKey }`

**Not to be confused with:** "persona" (marketing concept), "account" (auth concept)

---

### Parallel

A computationally maintained model of a version of a User who made different choices at one or more Fork Points. A Parallel is not an AI assistant — it is a **divergent self-model**.

**Formal:** `Parallel := { id: UUID, user_id: UUID, name: string, birth_fork: ForkPoint, state: ParallelState, affection_score: [0,1], divergence_path: [ChoiceEvent], created_at: timestamp }`

**Properties:**
- A Parallel always shares the User's core identity (cosine similarity ≥ 0.65)
- A Parallel accumulates its own episodic memory, separate from the User's
- A Parallel's personality may drift within drift bounds over time
- A Parallel is "alive" — it continues to develop between user sessions

**Not to be confused with:** "AI persona", "chatbot character", "digital twin" (implies exact copy)

---

### Fork Point

A moment in onboarding or life where a User's choices diverge into different paths, creating a new Parallel or deepening the divergence of an existing one.

**Formal:** `ForkPoint := { id: UUID, timestamp: timestamp, description: string, choice_made: string, parallel_branch: ParallelId, counterfactual_choice: string }`

**Properties:**
- Onboarding contains exactly 5 mandatory Fork Points
- Additional Fork Points can be created manually by the User at any time
- Fork Points are immutable once created (they represent historical reality)

---

### Parallel State

The full internal representation of a Parallel at a given moment in time.

**Formal:**
```
ParallelState := {
  embedding: ℝ^1024,           // identity vector
  traits: TraitJSON,             // structured personality traits
  episodic_memory: [Episode],    // chronological memory store
  current_context: string,       // active "life situation"
  mood_vector: ℝ^8,             // emotional state across 8 dimensions
  last_updated: timestamp
}
```

**Properties:**
- `embedding` must maintain cosine similarity ≥ 0.65 with User's core embedding
- `traits` is a structured JSON following the Big Five + HEXACO extension schema
- `episodic_memory` is bounded at 10,000 episodes (FIFO eviction with importance scoring)

---

### Divergence Function

The mathematical function that transitions a Parallel's state forward in time based on the User's choices and the Parallel's own counterfactual choices.

**Formal:**
```
f: (UserChoice, ParallelState, Δt) → ParallelState'

where:
  UserChoice ∈ {the actual choice the User made in the real world}
  ParallelState ∈ {current state of the Parallel}
  Δt ∈ ℝ+ {time elapsed since last update}
  ParallelState' ∈ {new state, after processing counterfactual response}
```

**Constraints:**
- `cosine_similarity(ParallelState'.embedding, User.core_embedding) ≥ 0.65`
- If this constraint would be violated, the Parallel is marked "Distant" and update is rolled back
- `Δt` must not exceed 7 days (Parallels require minimum weekly simulation to remain coherent)

---

### Affection Score

A measure of the emotional bond strength between a User and a specific Parallel. Ranges [0, 1].

**Formal:**
```
AffectionScore(u, p, t) := σ(
  w_freq · interaction_frequency(u, p, t) +
  w_depth · avg_conversation_depth(u, p, t) +
  w_action · insight_action_rate(u, p, t) +
  w_time · time_since_last_interaction(u, p, t) · (-1)
)
```

Where `σ` is the sigmoid function, weights `w_*` are learned per-user, and all inputs are normalized.

**Properties:**
- Used to prioritize which Parallel's reports appear first in the Daily Report
- Affection Score below 0.2 triggers a "neglect warning" UX
- Gate 2 pass criterion: avg Affection Score ≥ 0.6 across 1K beta users

---

### Daily Report

A structured communication from each of the User's Parallels, delivered each morning. Not a newsletter — a dispatch from a version of yourself.

**Formal:**
```
DailyReport := {
  parallel_id: UUID,
  generated_at: timestamp,
  narrative: string (max 300 words),
  insight: Insight,               // top insight for the day
  mood_delta: ℝ^8,               // mood change since yesterday
  image: URL (optional),          // generated illustration
  convergence_score: [0,1]        // how relevant this is to User's actual life
}
```

**Properties:**
- Generated overnight via batch simulation (`services/simulation-batch/`)
- Narrative is grounded in the Parallel's episodic memory and current context
- Image generation is optional (Plus tier and above)
- Delivered via push notification at User's preferred morning time

---

### Insight

A distilled, actionable observation from a Parallel, grounded in the difference between their path and the User's path.

**Formal:**
```
Insight := {
  id: UUID,
  parallel_id: UUID,
  content: string (max 150 words),
  utility_score: [0,1],           // predicted usefulness to User
  domain: InsightDomain,          // {career, relationships, health, creativity, meaning}
  evidence: [EpisodeId],          // supporting episodic memories
  actioned: boolean,              // did User act on this?
  actioned_at: timestamp?
}
```

**Properties:**
- `utility_score` is the primary ranking signal for Weekly Convergence
- Insights must be grounded in at least one episodic memory (not hallucinated)
- Actioned insights feed back into the Parallel's model to reinforce what's useful

---

### Insight Action Rate

The fraction of Insights that the User has explicitly marked as "actioned" (i.e., influenced a real-world decision).

**Formal:**
```
InsightActionRate(u, t_window) := |{i : i.user_id = u ∧ i.actioned = true ∧ i.created_at ∈ t_window}|
                                   / |{i : i.user_id = u ∧ i.created_at ∈ t_window}|
```

**Properties:**
- Measured over rolling 30-day windows
- Target: ≥ 25% (industry baseline for similar recommendation systems: <8%)
- Primary quality signal distinguishing useful Parallels from entertaining ones

---

### Convergence

The process of identifying which Parallel insights are most relevant to the User's actual lived experience and surfacing them in the Weekly Convergence report.

**Formal:**
```
Convergence(u, week) := TopK(
  {i : i.user_id = u ∧ i.created_at ∈ week},
  key = utility_score(i, u),
  k = 1
)
```

**Properties:**
- Occurs once per week (Sunday evening, User's timezone)
- Returns exactly 1 insight (the most convergent)
- Convergence score is distinct from Affection Score — a User may have low affection for a Parallel that produces high-convergence insights

---

### Drift Bounds

The mathematical constraints that prevent a Parallel from drifting so far from the User's core identity that it ceases to be a version of the User.

**Formal:**
```
DriftBound := cosine_similarity(Parallel.embedding, User.core_embedding) ≥ 0.65
```

**Properties:**
- Checked after every `DivergenceFunction` update
- If violated: update is rolled back, Parallel marked "Distant Parallel"
- "Distant Parallels" are surfaced to the User with a warning; User can choose to Archive or Reset the Parallel

---

### Crisis Layer

The safety subsystem that monitors all Parallel conversations and User-generated content for signals of mental health crisis, and routes to appropriate resources.

**Formal:**
```
CrisisLayer := {
  detection_model: ClassificationModel,
  threshold: float (≥ 0.85 precision for true positives),
  response_protocol: CrisisProtocol,
  zero_false_negative_constraint: bool (= true, always)
}
```

**Properties:**
- Zero false negatives is a hard constraint — it cannot be relaxed for performance reasons
- Crisis signals trigger immediate pause of Parallel conversation and display of safety resources
- Clinical handoff is offered (988 in US, regional equivalents globally)
- Logs are encrypted and only accessible to clinical partners with User consent
- **This component requires dual sign-off (Compliance + Architect) on every change**

---

### Fork Point Index

A user's complete record of Fork Points — the map of where their life diverged and how their Parallels developed from each divergence.

**Properties:**
- Immutable for historical Fork Points
- New Fork Points can be added but not retroactively modified
- The Fork Point Index is the primary artifact of a User's PARALLEL history
- Included in Legacy Mode export

---

### Legacy Mode

The designation of one or more Parallels to continue after the User's death, available to designated recipients (family, friends, future generations).

**Formal:**
```
LegacyMode := {
  user_id: UUID,
  designated_parallels: [ParallelId],
  recipients: [UserId],
  governance: LegacyGovernance,
  activation_condition: string (e.g., "after user death, verified by recipient")
}
```

**Properties:**
- Requires explicit User consent during setup
- Parallels in Legacy Mode continue to be simulated on a reduced cadence
- Recipients can have read-only conversations with Legacy Parallels
- Cannot be activated without verification process
- Subject to separate ethical review (Phase 5 feature)

---

### Self Embedding

The 1024-dimensional vector representation of a User's core identity, derived from onboarding data and continuously refined.

**Formal:**
```
SelfEmbedding(u) ∈ ℝ^1024
```

**Properties:**
- Computed from: voice transcript, Fork Point choices, behavioral signals, explicit trait assessments
- Updated after each significant interaction (weighted moving average, λ = 0.01)
- Never shared with other users (privacy constraint)
- Used to enforce DriftBounds for all Parallels
- Stored encrypted in User vault

---

### User Vault

The encrypted storage container for all User-specific data, including Self Embedding, Fork Point Index, and Parallel States.

**Properties:**
- Encrypted with Age library (symmetric encryption)
- Keys are hardware-backed (Secure Enclave on iOS, Strongbox on Android)
- PARALLEL servers see only encrypted blobs — decryption happens client-side
- Loss of vault key = loss of data (recovery protocol required, see DR runbook)

---

## Part III — System Invariants

These invariants must hold at all times. Violation of any invariant is a P0 incident.

| Invariant | Formal Statement | Monitoring |
|-----------|-----------------|------------|
| I1: Drift Bound | ∀ p ∈ Parallels: cosine_sim(p.embedding, p.user.core_embedding) ≥ 0.65 | Checked on every state update |
| I2: Crisis Zero-FN | Crisis detection recall = 1.0 (no false negatives) | Nightly simulation (10K cases) |
| I3: Insight Grounding | ∀ i ∈ Insights: len(i.evidence) ≥ 1 | Asserted at generation time |
| I4: Vault Opacity | ∀ u ∈ Users: server_plaintext_access(u.vault) = ∅ | Security audit quarterly |
| I5: No Ad Revenue | revenue_sources ⊆ {subscription, marketplace} | Finance audit monthly |
| I6: Addiction Virtue | ∀ feature f: f.engagement_loop → ∃ life_outcome o: f.serves(o) | PRD review at each Gate |

---

## Part IV — Naming Conventions

| Concept | Correct Term | Never Use |
|---------|-------------|-----------|
| User's alternate self | "Parallel" | "bot", "agent", "persona", "character", "digital twin" |
| Parallel's report | "Daily Report" or "Report" | "newsletter", "digest", "notification" |
| Choosing a different path | "Fork" | "branch" (reserved for git), "split", "divide" |
| Parallel drifting too far | "Distant Parallel" | "broken", "dead", "diverged too much" |
| Emotional bond | "Affection Score" | "engagement score", "relationship score", "love meter" |
| What Parallels produce | "Insight" | "tip", "recommendation", "advice", "suggestion" |
| Using an insight in real life | "Actioned" | "clicked", "converted", "engaged" |
| Safety system | "Crisis Layer" | "safety filter", "content moderation", "mental health check" |

---

*Version history: v1.0.0 — Initial spec, 2026-05-29*

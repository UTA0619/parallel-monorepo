# PARALLEL — Patent Strategy v1.0

**Version:** 1.0.0  
**Owner Agent:** Compliance  
**Date:** 2026-05-29  
**Status:** Ready for filing — provisional applications in US + JP + EU  
**DoD:** 8 patent disclosures complete | Filed by 2026-08-29 (Month 3)

---

## Overview

PARALLEL's patent strategy covers the core technical innovations that create the platform's durable moat. All 8 patents are filed as provisional applications simultaneously in the United States (USPTO), Japan (JPO), and European Union (EPO), establishing priority dates before any public disclosure.

**Filing deadline:** 2026-08-29 (3 months from start)  
**Patent counsel:** TBD — require US + JP + EU jurisdiction coverage

---

## Patent Portfolio Summary

| # | Title | Domain | Priority | Innovation Core |
|---|-------|--------|----------|----------------|
| P1 | Multi-Agent Self-Fork Orchestration | Systems | Critical | The core Parallel runtime |
| P2 | Inter-Parallel Network Protocol | Systems | Critical | Cross-user Parallel matching |
| P3 | Convergence Scoring of Agent Insights | AI/ML | High | Daily Report quality engine |
| P4 | Privacy-Preserving Longitudinal Self Embedding | AI/ML + Privacy | Critical | The data moat |
| P5 | Legacy Mode Post-Mortem Agent Governance | Systems + Legal | High | Legacy Mode architecture |
| P6 | Daily Simulation Batch Architecture | Systems | High | Cost-optimized inference |
| P7 | Parallel Marketplace Transactional Model | Business | Medium | Creator economy mechanics |
| P8 | Affection Score Measurement | AI/ML | High | Emotional bond metric |

---

## Patent Disclosures

---

### P1: Multi-Agent Self-Fork Orchestration with State Divergence Bounds

**Filing type:** Utility (provisional → full within 12 months)  
**Inventors:** TBD (Founder 2 / CTO primary)

**Field of Invention:**  
Systems and methods for maintaining multiple concurrent AI agent instances that each represent divergent versions of a single human identity, with enforced bounds on state divergence to preserve identity coherence.

**Problem Addressed:**  
Prior art in multi-agent systems treats agents as independent entities or collaborating peers. No prior system maintains multiple agents that are explicitly constrained to represent divergent versions of a *single* source identity, with mathematical bounds on permissible divergence.

**Summary of Invention:**  
A system comprising: (1) a source identity encoder producing a canonical identity embedding E_core ∈ ℝ^d; (2) a fork orchestrator that, upon receiving a fork event, instantiates a new agent with initial state derived from E_core; (3) a divergence monitor that continuously checks cosine_similarity(E_agent, E_core) ≥ θ for each agent, where θ is a configurable drift bound; (4) a rollback mechanism that reverts agent state updates that would violate the drift bound; (5) a "Distant Agent" designation applied when θ is approached within ε.

**Independent Claims (draft):**  
1. A computer-implemented system for maintaining a plurality of AI agents representing divergent versions of a single source identity, comprising: an identity encoder configured to produce a canonical embedding of the source identity; a fork orchestrator configured to instantiate agent instances with state derived from the canonical embedding; a divergence constraint enforcer configured to maintain a minimum similarity between each agent's current state embedding and the canonical embedding; and a rollback mechanism configured to revert agent state updates that would violate the minimum similarity constraint.

2. The system of claim 1, wherein the minimum similarity is measured using cosine similarity over a high-dimensional embedding space.

3. A method for orchestrating divergent agent state evolution while preserving identity coherence...

**Prior Art Search Notes:**  
- Multi-agent RL: treats agents as separate entities, no identity constraint
- Digital twin literature: single twin per entity, no divergence modeling
- LangGraph / Temporal: workflow orchestration, no identity coherence constraint
- **No prior art found for identity-constrained multi-agent self-forking.**

---

### P2: Inter-Parallel Network Protocol for Cross-User Agent Matching

**Filing type:** Utility (provisional)  
**Inventors:** TBD

**Field of Invention:**  
Communication protocols and matching systems enabling selective, privacy-preserving interaction between AI agent instances representing different users' divergent selves, based on path similarity scoring.

**Problem Addressed:**  
No prior protocol exists for enabling AI agents that represent versions of different human identities to communicate, discover compatible counterparts, or facilitate introductions between their respective human owners, while preserving each user's privacy and requiring explicit consent.

**Summary of Invention:**  
A system comprising: (1) a path embedding system that encodes each agent's divergence path as a vector P_agent; (2) an approximate nearest-neighbor matching service operating over encrypted path embeddings (homomorphic or hash-based); (3) a consent layer requiring bilateral opt-in before any cross-user agent interaction; (4) a sandboxed message-passing protocol (JSON-RPC 2.0 with signed messages) for inter-agent communication; (5) a privacy shield that prevents any agent from revealing information about its parent user beyond consented profile elements.

**Independent Claims (draft):**  
1. A system for connecting AI agent instances representing different users' divergent life paths, comprising: a path embedding module encoding each agent's divergence history as a vector representation; a privacy-preserving matching service configured to identify agent pairs with high path similarity without revealing raw path data; a bilateral consent enforcement layer requiring explicit opt-in from both users before any agent-to-agent communication; and a sandboxed communication channel for agent interaction.

---

### P3: Convergence Scoring of Agent Insights to Primary User

**Filing type:** Utility (provisional)  
**Inventors:** TBD

**Field of Invention:**  
Machine learning methods for scoring the relevance and utility of insights generated by divergent AI agent instances with respect to the current state and objectives of the source user identity.

**Problem Addressed:**  
When multiple AI agents representing divergent versions of a user generate insights, ranking these insights by generic quality fails. The relevant metric is *utility to the specific user's current life situation* — a context-dependent, personalized relevance score that existing recommendation systems do not address.

**Summary of Invention:**  
A scoring function utility(i, u, t) ∈ [0,1] that takes as input: an insight i generated by an agent, a user profile u including current life context, and timestamp t; and outputs a utility score used to rank insights for the Weekly Convergence report. The function incorporates: (1) semantic similarity between insight domain and user's active goals; (2) novelty relative to user's recent insight history; (3) historical action rate of similar insights by this user; (4) divergence degree of the generating agent (high divergence → potential novelty bonus); (5) temporal relevance decay.

---

### P4: Privacy-Preserving Longitudinal Self Embedding

**Filing type:** Utility (provisional) — **highest priority**  
**Inventors:** TBD

**Field of Invention:**  
Systems and methods for constructing, updating, and storing AI embeddings of human identity over multi-year time horizons while maintaining end-to-end encryption such that the operating service cannot access the plaintext embedding.

**Problem Addressed:**  
Longitudinal identity modeling requires persistent storage of rich personal data. No prior system enables continuous AI-based identity modeling with the property that the service operator cannot access the identity representation — a requirement for genuine privacy guarantees.

**Summary of Invention:**  
A client-side identity embedding system comprising: (1) a local embedding model that runs on-device, processing user inputs to update the identity embedding without transmitting raw data; (2) a secure aggregation protocol that merges on-device updates with server-side encrypted state; (3) a hardware-backed key management system (Secure Enclave / Strongbox) that ensures only the user's device can decrypt the identity embedding; (4) an encrypted vector storage protocol enabling the server to perform approximate nearest-neighbor queries over encrypted embeddings using privacy-preserving computation.

**This patent is the foundation of PARALLEL's data moat.** The system design described here enables 5+ years of longitudinal identity data that (a) cannot be accessed by PARALLEL or compelled by legal process and (b) cannot be replicated by competitors who start later.

---

### P5: Legacy Mode: Post-Mortem Agent Governance Protocol

**Filing type:** Utility (provisional)  
**Inventors:** TBD

**Field of Invention:**  
Systems and methods for continuing the operation of AI agent instances representing a deceased human's divergent selves, with governance frameworks for recipient access, behavioral constraints, and consent verification.

**Problem Addressed:**  
Digital legacy products (StoryFile, HereAfterAI) create static or passively-replayable representations. No prior system enables *dynamically evolving* AI agents to continue developing after a user's death, with formalized governance structures for who may interact with them and under what conditions.

**Summary of Invention:**  
A legacy governance system comprising: (1) a user-defined legacy designation structure specifying which agents continue post-mortem, which recipients may access them, and under what behavioral constraints; (2) a death verification protocol that gates activation on verified death confirmation; (3) a reduced-cadence simulation schedule for legacy agents; (4) a behavioral constraint layer preventing legacy agents from making claims about the deceased user's wishes in legally binding domains; (5) a consent renewal system requiring periodic recipient consent renewal.

---

### P6: Daily Simulation Batch Architecture (Cost-Optimized)

**Filing type:** Utility (provisional)  
**Inventors:** TBD

**Field of Invention:**  
Systems and methods for cost-efficient large-scale overnight simulation of AI agent state transitions, optimized for consumer subscription economics.

**Problem Addressed:**  
Real-time simulation of 100 AI agents per user at consumer scale (millions of users) at current inference costs would be economically infeasible. No prior system describes a batch simulation architecture specifically designed to defer non-real-time agent state updates to off-peak compute windows while maintaining the appearance of continuous agent activity.

**Summary of Invention:**  
A simulation pipeline comprising: (1) a daily event queue populated with simulated life events for each agent, generated from the user's actual day and the agent's divergence path; (2) a priority-based scheduling system that runs urgent simulations (crisis signals, user-triggered conversations) in real-time and defers routine state updates to overnight batch windows; (3) a cost model that dynamically routes simulation jobs to lowest-cost available compute (spot instances, regional cost arbitrage); (4) a state coherence guarantee ensuring that batch-updated agent states are indistinguishable to the user from real-time updates.

---

### P7: Parallel Marketplace Transactional Model

**Filing type:** Utility (provisional)  
**Inventors:** TBD

**Field of Invention:**  
Business methods and systems for a marketplace enabling creators to publish, monetize, and distribute AI agent configurations representing specialized versions of human selves, with provenance tracking and behavioral constraint enforcement.

**Problem Addressed:**  
Existing AI model marketplaces (HuggingFace, Civitai) focus on model weights or image generation configurations. No prior marketplace addresses the distribution of *identity-typed AI agent configurations* — agent templates that represent a specific archetype of human self (philosopher, entrepreneur, creative) while being legally and technically constrained from claiming to represent a specific real individual.

**Summary of Invention:**  
A marketplace system comprising: (1) a creator publishing interface for submitting agent configurations with required disclosures (synthetic persona, no real-person basis); (2) a provenance ledger tracking which base model, training data, and configuration parameters were used in each agent; (3) a behavioral constraint layer applying marketplace-wide prohibitions (no impersonation of real individuals, no crisis-adjacent content); (4) a revenue distribution protocol allocating subscription-derived marketplace revenue between PARALLEL (30%) and creators (70%); (5) a user installation protocol for adding marketplace agents to a user's Parallel roster.

---

### P8: Affection Score — Emotional Bond Measurement Between User and Agent

**Filing type:** Utility (provisional)  
**Inventors:** TBD

**Field of Invention:**  
Machine learning systems for measuring and predicting the strength of emotional attachment between a human user and an AI agent instance, based on multimodal behavioral signals.

**Problem Addressed:**  
No prior art defines a measurable, reproducible metric for emotional bond strength between a human and an AI agent. Engagement metrics (session count, time spent) do not capture the qualitative dimension of attachment. PARALLEL's Affection Score is the first formal specification of such a metric with demonstrated predictive validity for user retention.

**Summary of Invention:**  
An Affection Score computation system comprising: (1) a multi-signal input layer ingesting interaction frequency, conversation depth (measured by semantic richness of exchanges), insight action rate, and temporal patterns; (2) a personalized weighting model (learned per-user) that reflects individual differences in attachment expression; (3) a calibration system that maps raw signals to the [0,1] range with interpretable thresholds; (4) a temporal decay function that models attenuation of bond strength with inactivity; (5) a UI feedback layer that surfaces Affection Score dynamics to users in accessible, non-gamified form.

**Claim differentiation from prior art:**  
- User engagement scores (Netflix, Spotify): measure time/frequency, not attachment quality
- Relationship health scores (therapy apps): self-reported, not behavioral
- Social network tie strength (Facebook, LinkedIn): based on network activity, not dyadic bond

---

## Filing Timeline

| Milestone | Date | Status |
|-----------|------|--------|
| Patent disclosures complete (this document) | 2026-05-29 | ✅ |
| Patent counsel engaged | 2026-06-15 | ⬜ Pending |
| Priority search completed | 2026-07-01 | ⬜ Pending |
| Claims refined with counsel | 2026-07-15 | ⬜ Pending |
| Provisional applications filed (US + JP + EU) | 2026-08-29 | ⬜ Pending |
| Full applications filed (within 12 months of provisional) | 2027-08-29 | ⬜ Scheduled |

---

## Portfolio Expansion Plan

| Timeline | Target Portfolio Size | Focus Areas |
|----------|----------------------|-------------|
| Month 3 | 8 provisionals | Core system patents |
| Year 1 | 15 full + new provisionals | Memory architecture, safety |
| Year 3 | 25 patents | B2B applications, Marketplace |
| Year 5 | 30+ patents | Platform API, Hardware, Archive |

---

*Version history: v1.0.0 — Initial disclosure, 2026-05-29*

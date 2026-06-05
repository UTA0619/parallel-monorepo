# ADR-001: Foundation Model Selection — Open-Weight vs. Proprietary

**Status:** Accepted  
**Date:** 2026-05-29  
**Deciders:** CTO, Architect Agent, Research Agent

---

## Context

PARALLEL's core value proposition depends on high-quality language understanding, generation, and reasoning. We must choose between proprietary API models (Anthropic Claude, OpenAI GPT-4o) and open-weight models (Meta Llama 3, Mistral) for different pipeline stages.

Key constraints:
- JP data residency may require self-hosting for some tasks (see ADR-025)
- Cost must be ≤$0.01/user/day at 1M users (R6 risk)
- Safety and alignment critical for identity AI (R1 risk)
- Latency: Morning Report must be generated in <5s

## Decision

**Multi-model routing strategy:**

| Task | Model | Rationale |
|------|-------|-----------|
| Behavioral tag classification | Claude Haiku 4.5 | Fast, cheap, sufficient quality |
| Emotion extraction | Claude Haiku 4.5 | Sub-500ms required |
| Morning Report generation | Claude Sonnet 4.6 | Best quality/cost for generation |
| Life-path simulation | Claude Sonnet 4.6 | Complex reasoning required |
| Prompt evaluation (LLM-as-judge) | Claude Opus 4.8 | Highest quality for eval |
| Fallback (JP data residency) | Llama 3 70B (self-hosted) | Data sovereignty only |

## Consequences

**Positive:**
- ~60% cost reduction vs. single Sonnet for all tasks
- Better quality: right model for each task
- Anthropic's Constitutional AI provides safety alignment out of box

**Negative:**
- Vendor concentration risk (Anthropic)
- Open-weight fallback adds ops overhead
- Multiple prompt formats to maintain

**Mitigations:**
- Model-agnostic prompt interface in packages/ai-core/ abstracts provider
- Monthly cost monitoring with circuit breaker at 150% of budget

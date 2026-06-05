# ADR-012: LLM Routing — Single Model vs. Multi-Model

**Status:** Accepted (see ADR-001 for detail)  
**Date:** 2026-06-05  

## Decision
**Multi-model routing: Haiku for classification, Sonnet for generation, Opus for evaluation**

Summary: See ADR-001. Model router in packages/ai-core/src/router.ts.
Cost target: ≤$0.01/user/day at 1M users.

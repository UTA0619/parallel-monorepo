# Gate 2 — Stage Review: Phase 2 MVP Development

> **Decision Date:** 2027-07-31 (target)  
> **Phase:** 2 → 3 (Closed Beta)

## KPI Scorecard

| KPI | Target | Actual |
|-----|--------|--------|
| Voice onboarding completion rate | ≥80% | TBD |
| Memory storage latency p95 | <2s | TBD |
| Morning Report generation p95 | <5s | TBD |
| Crisis layer recall on test set | ≥99% | TBD |
| Crisis layer precision | ≥90% | TBD |
| Crash-free session rate | ≥99.9% | TBD |
| P0 bug count | 0 | TBD |
| Security audit passed | Yes | TBD |

## Services Implemented
- ✅ services/crisis-layer/ — FastAPI + Claude Haiku + keyword detection
- ✅ services/memory-py/ — FastAPI + pgvector + retrieval scoring
- ✅ services/orchestrator-rs/ — Rust pipeline (Sense→Reflect→Advise)
- ✅ packages/ai-core/ — Model router, morning report generator, behavioral tagger
- ✅ packages/database/migrations/ — pgvector schema, RLS, hybrid search

## Decision: PENDING
Gates on: red team completion, clinical sign-off on crisis layer, security audit.

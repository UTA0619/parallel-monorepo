# ADR-025: Data Residency Strategy — US-Only vs. Multi-Region vs. JP-Primary

**Status:** Accepted  
**Date:** 2026-06-05  
**Deciders:** CEO, CTO, Compliance Agent, Legal Counsel (JP)

---

## Context

JP market is target for 40% of revenue. JP users have strong data sovereignty expectations. GDPR (EU) and Japan's APPI (Act on Protection of Personal Information) have cross-border data transfer restrictions.

## Decision

**Multi-region: US Primary + JP Region (active-active user-data partitioning)**

### Architecture
- JP users: all personal data (memories, profile, auth) stored in Supabase Tokyo
- US/EU users: data stored in Supabase US East
- No cross-region replication of personal data
- Analytics (PostHog): separate regional instances

### Data Classification

| Data Type | US Storage | JP Storage | Notes |
|-----------|-----------|-----------|-------|
| User memories | ✅ US users | ✅ JP users | Never cross-region |
| Embeddings | ✅ US users | ✅ JP users | Co-located with content |
| Auth tokens | ✅ US users | ✅ JP users | Regional Supabase Auth |
| Aggregated analytics | ✅ US PostHog | ✅ JP PostHog | No PII in events |
| AI model weights | US (Anthropic API) | JP (self-hosted fallback) | See ADR-010 |

### Compliance
- APPI: JP user data stays in Japan. Cross-border transfer consent shown in onboarding.
- GDPR: EU users data in US East with SCCs (Standard Contractual Clauses)
- CCPA: US users covered by standard privacy policy

## Consequences
- Higher infrastructure cost vs. US-only (~40% more)
- Partition logic required in API gateway (route by user region)
- Supabase Tokyo read replica is not enough; need separate primary for JP
- Blocks: ADR-010 (STT), ADR-013 (Auth), ADR-015 (Analytics), ADR-020 (Infra) — all resolved by this decision

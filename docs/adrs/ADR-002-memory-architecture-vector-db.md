# ADR-002: Memory Architecture — Vector DB Selection

**Status:** Accepted  
**Date:** 2026-05-29  
**Deciders:** CTO, Architect Agent

---

## Context

PARALLEL's memory layer requires fast approximate nearest neighbor (ANN) search over user embeddings. Constraints:
- JP data residency option required (ADR-025)
- Co-location with user data preferred (reduces latency, simplifies RLS)
- Scale: up to 100K memories per user, 1M users = 100B vectors total at scale
- Must support metadata filtering: user_id, salience, tags, date range

## Decision

**Phase 2 MVP:** pgvector (via Supabase)  
**Phase 5 Migration Path:** Dedicated vector DB (Pinecone or Weaviate) if pgvector performance degrades

### Phase 2: pgvector
- Co-located with existing Postgres/Supabase stack
- Native RLS support (critical for user data isolation)
- IVFFlat index: lists=100, suitable for ≤10M vectors per table
- No additional vendor or ops overhead

### Migration Trigger
If any of the following are hit, migrate to dedicated vector DB:
- p95 ANN search latency > 200ms at 10M vectors per user
- Total vectors across all users > 5B
- Feature requirement not supported by pgvector

## Consequences

**Positive:**
- Zero additional cost in MVP (included in Supabase plan)
- Simplified ops (one DB to manage)
- RLS enforced at DB layer

**Negative:**
- Performance ceiling lower than dedicated vector DBs
- Requires migration if scale targets are hit

**Mitigations:**
- Partition memories table by user_id for query performance
- Monitor p95 latency in production from Day 1

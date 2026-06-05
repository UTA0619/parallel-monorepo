# ADR-011: Vector Database — pgvector vs. Pinecone vs. Weaviate

**Status:** Accepted (see ADR-002 for detail)  
**Date:** 2026-06-05  

## Decision
**pgvector for MVP; migration trigger defined**

Summary: See ADR-002. IVFFlat index with lists=100, partitioned by user_id.
Migration to Pinecone when: p95 latency >200ms OR total vectors >5B.

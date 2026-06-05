# ADR-020: Cloud Infrastructure — Supabase+Vercel vs. AWS vs. GCP

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**Supabase (DB/Auth) + Vercel (web) + Railway (backend services) + AWS Tokyo (JP data residency)**

| Component | Platform | Region |
|-----------|----------|--------|
| PostgreSQL + pgvector | Supabase | US East + Tokyo (read replica) |
| Auth | Supabase Auth | Follows DB region |
| Web marketing | Vercel | Edge (global) |
| Orchestrator (Rust) | Railway | US + Tokyo |
| Memory service (Python) | Railway | US + Tokyo |
| Voice STT (self-hosted) | AWS EC2 A100 | ap-northeast-1 (Tokyo) |
| PostHog analytics | Self-hosted | US + Tokyo |

## Consequences
- Railway chosen over AWS ECS for simplicity at MVP scale
- Migration trigger to AWS EKS: >$10K/mo Railway bill or 99.9% SLA requirement
- JP data residency satisfied via Tokyo deployments for all user-data services

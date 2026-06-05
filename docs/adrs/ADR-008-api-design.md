# ADR-008: API Design — REST vs. GraphQL vs. tRPC

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**tRPC for internal API (mobile ↔ backend) + REST for external API (Phase 6)**

- tRPC: end-to-end type safety, zero schema duplication, perfect for TypeScript monorepo
- REST: external developer API in Phase 6 must be language-agnostic

## Consequences
- tRPC router in services/api-gateway-go/ (via ts-rest bridge)
- External REST API documented in OpenAPI 3.1 (Phase 6 ADR-025 area)

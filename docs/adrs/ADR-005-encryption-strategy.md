# ADR-005: Encryption Strategy — User Vault E2E Encryption

**Status:** Accepted  
**Date:** 2026-05-29  
**Deciders:** CTO, Compliance Agent, Security Reviewer

---

## Context

User memory data is highly sensitive (identity, relationships, mental health). A breach (R3) would be catastrophic for user trust and regulatory compliance. We need a clear encryption strategy for data at rest and in transit.

## Decision

### Encryption Layers

**At rest:**
- Database: AES-256 encryption at storage layer (Supabase/AWS RDS)
- Application layer: Sensitive memories (crisis tier 2+) additionally encrypted with user-derived key
- Embeddings: Stored alongside encrypted content (same key)

**In transit:**
- TLS 1.3 for all API calls
- Certificate pinning in mobile app for auth endpoints

**Key management:**
- User-derived key: PBKDF2(user_password, user_salt, 310,000 iterations, SHA-256)
- Key never stored; re-derived on each auth session
- For E2E: key stored in device Secure Enclave (iOS) / Android Keystore

**Crisis content (tier 3+):**
- Stored with 24h TTL
- Not included in exports
- Access logged with immutable audit trail

## Consequences
- E2E encryption means server-side recovery is impossible if user loses password
- Migration path: introduce recovery key flow in Phase 3
- Additional 50-100ms latency for encryption/decryption on sensitive memories

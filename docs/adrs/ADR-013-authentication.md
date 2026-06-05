# ADR-013: Authentication Platform — Supabase Auth vs. Clerk vs. Auth0

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**Supabase Auth (primary) + Sign in with Apple (mandatory for iOS)**

- Supabase Auth: native RLS integration, no additional cost, supports email + OAuth
- Sign in with Apple: mandatory for iOS apps with 3rd-party login options (App Store rule)
- Google Sign-In: via Supabase OAuth provider
- Magic Link: for passwordless flow

## Consequences
- Supabase Auth limitation: no advanced MFA flows without custom implementation
- JP users: email-based auth preferred (higher trust in email vs. social login in JP)
- Phase 3: add passkey support (WebAuthn via Supabase)

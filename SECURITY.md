# Security Policy

## Reporting a Vulnerability

**DO NOT** open a public GitHub issue for security vulnerabilities.

Report vulnerabilities to: security@parallel.ai

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge within 24 hours and provide a fix timeline within 72 hours.

## Critical Paths Requiring Extra Review

1. `/services/crisis-layer/` — any changes require dual sign-off (Compliance + Architect)
2. `/packages/prompt-library/` — prompt injection risks require Red Team review
3. User vault encryption code — hardware-backed key handling
4. Auth flows — Supabase RLS policies

## Bug Bounty

_Program launching Phase 4 (Month 20). Details TBD._

# ADR-019: Feature Flags — LaunchDarkly vs. Flagsmith vs. Custom

**Status:** Accepted (see ADR-015)  
**Date:** 2026-06-05  

## Decision
**PostHog Feature Flags** (co-located with analytics, see ADR-015)

- Zero additional vendor for MVP
- Supports percentage rollouts, user targeting, and A/B experiments
- Migration to LaunchDarkly if: targeting complexity exceeds PostHog capabilities, or if sales team needs enterprise flag management

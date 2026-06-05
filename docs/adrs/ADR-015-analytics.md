# ADR-015: Product Analytics — PostHog vs. Amplitude vs. Mixpanel

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**PostHog (self-hosted) in Tokyo + US regions**

- JP users → PostHog instance in Tokyo (data residency compliance)
- US/EU users → PostHog Cloud (US region)
- Feature flags: PostHog built-in (replaces separate vendor)
- Session recording: enabled for onboarding flow analysis only

## Consequences
- Self-hosted Tokyo instance: ~$200/mo operational cost
- PostHog feature flags replace need for LaunchDarkly (cost saving)
- Less mature than Amplitude for cohort analysis, but acceptable for MVP

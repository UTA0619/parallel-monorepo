# ADR-016: Error Monitoring — Sentry vs. Datadog vs. Bugsnag

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**Sentry** (self-hosted for JP, Cloud for US)

- Best React Native SDK support (crash reporting, performance monitoring)
- Session replay for web (onboarding flow debugging)
- Error budget: ≤0.1% crash-free session failure rate triggers alert
- Source maps uploaded automatically via CI (EAS Build hook)

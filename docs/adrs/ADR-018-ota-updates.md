# ADR-018: Mobile OTA Updates — EAS Update vs. CodePush

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**EAS Update** (Expo)

- CodePush is deprecated by Microsoft (App Center EOL: March 2025)
- EAS Update: native to Expo Bare workflow, integrated with EAS Build CI
- Enables JS bundle updates without App Store review for non-binary changes
- Deployment strategy: gradual rollout (10% → 50% → 100%) per update channel

## Consequences
- EAS Update cost: included in Expo's free tier up to 1000 updates/month; Enterprise plan at scale
- Binary changes (native modules) still require App Store review

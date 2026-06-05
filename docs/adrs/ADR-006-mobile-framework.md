# ADR-006: Mobile Framework — Expo Managed vs. Bare vs. Bare RN

**Status:** Accepted (see ADR-004)  
**Date:** 2026-06-05  
**Deciders:** CTO, Architect Agent

---

## Context

See ADR-004 for full context. This ADR documents the specific Expo workflow decision.

## Decision

**Expo SDK 51+ with Bare Workflow**

### Why Bare over Managed
1. Crisis layer requires background audio processing (not available in Managed)
2. Voice capture with real-time processing requires custom native modules
3. Biometric authentication integration requires expo-local-authentication (supported in Bare)
4. Future on-device ML (Phase 5) will require custom native code

### Why not fully custom React Native (no Expo)
1. EAS Build provides reliable CI/CD with minimal configuration
2. EAS Update provides OTA updates without App Store review cycles
3. Expo ecosystem reduces native module integration burden
4. Expo's documentation and community support reduces onboarding time

## Consequences
- Cannot use Expo Go for development (must use development builds)
- EAS Build costs (mitigated by Expo's startup program eligibility)
- Native module updates require new build (not OTA-updatable)

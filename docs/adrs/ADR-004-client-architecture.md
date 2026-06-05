# ADR-004: Client Architecture — React Native vs. Native (iOS/Android)

**Status:** Accepted  
**Date:** 2026-05-29  
**Deciders:** CTO, CPO, Architect Agent

---

## Context

PARALLEL requires a mobile app for iOS and Android with voice capture, push notifications, background processing, and biometric auth. We must choose between cross-platform (React Native) and native (Swift/Kotlin) development.

## Decision

**Expo Bare Workflow (React Native)**

### Rationale vs. Alternatives

| Factor | Expo Bare | Expo Managed | Bare RN | Swift+Kotlin |
|--------|-----------|--------------|---------|-------------|
| Native module access | ✅ Full | ❌ Limited | ✅ Full | ✅ Full |
| Team size efficiency | ✅ 1 codebase | ✅ | ✅ | ❌ 2 codebases |
| Voice capture | ✅ expo-av | ❌ | ✅ | ✅ |
| EAS Build integration | ✅ Best | ✅ | 🟡 | ❌ |
| Background processing | ✅ | ❌ | ✅ | ✅ |
| Developer hiring pool | Large | Large | Large | Smaller |

### Key Decisions
- Use Expo Bare (not Managed) to allow native modules
- EAS Build for CI/CD; EAS Update for OTA JS updates
- expo-av for voice capture
- expo-local-authentication for biometrics

## Consequences
- Faster time to market vs. dual native codebases
- Some performance gap vs. pure native (acceptable for our use case)
- Platform-specific UI adjustments needed for iOS/Android differences

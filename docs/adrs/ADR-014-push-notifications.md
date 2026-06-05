# ADR-014: Push Notifications — Firebase FCM vs. OneSignal vs. Expo

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**Expo Notifications (abstracts FCM/APNs) for MVP; upgrade to OneSignal at Phase 3**

- MVP: Expo Notifications — zero additional setup, works with EAS Build
- Phase 3: migrate to OneSignal for delivery analytics, A/B testing on notification timing
- Morning Report notification delivery rate target: ≥95%

## Consequences
- Expo Notifications has limited delivery analytics in MVP (acceptable)
- OneSignal migration: <1 sprint effort (SDK swap)

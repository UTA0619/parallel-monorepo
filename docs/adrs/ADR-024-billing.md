# ADR-024: In-App Billing — RevenueCat vs. Stripe vs. Custom

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**RevenueCat** (unified billing across iOS/Android/Web)

- iOS: StoreKit 2 (via RevenueCat SDK) — Apple takes 15-30%
- Android: Play Billing (via RevenueCat SDK) — Google takes 15%
- Web: Stripe (via RevenueCat) — no platform fee
- RevenueCat fee: 1% of revenue (or $0 on Hobby plan up to $2.5K MRR)

**Pricing:**
- Free: 30-day trial → $0
- Premium: $14.99/mo or $99.99/yr (33% discount)
- Enterprise: $49/seat/mo (Phase 5)

## Consequences
- Platform fees unavoidable for iOS/Android in-app purchases
- RevenueCat provides cross-platform entitlement management and analytics
- Web subscription via Stripe avoids platform fee (encourage web signup in marketing)

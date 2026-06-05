# Phase 5 — Scale Plan (Y2–Y5)

> Target: $50M ARR, 5M MAU, D30 Retention ≥75%

## 5.1 Parallel Self v2 — Proactive Simulation Engine

### Nightly Simulation Architecture
```
2:00am user local time
│
├── Fetch user's full memory corpus
├── Build behavioral profile (30-day window)
├── Identify 3 active decision nodes
├── Monte Carlo: 10,000 path variants per decision node
├── Score paths: Affection Score delta + goal alignment + risk
├── Select top-3 paths
└── Store results → retrieved in next Morning Report
```

**Cost model:**
- Claude Haiku for path scoring: ~$0.003/user/night
- Storage overhead: ~50KB per user per night
- Total at 1M users: ~$3,000/night → $0.003/user ✅ (target ≤$0.01)

### Privacy-Preserving Aggregation
- Differential privacy (ε=1.0, δ=10^-6) on cross-user insights
- Laplace mechanism on frequency counts
- No individual memory content ever aggregated
- External privacy audit required before launch (Phase 5 Sprint 1)

## 5.2 Enterprise & B2B Expansion

### Enterprise Features
- SAML/OIDC SSO integration
- Admin dashboard: aggregate wellness metrics (no individual data visible)
- Bulk onboarding via CSV + invite codes
- Custom branding (white-label option)
- Dedicated CSM + SLA: 99.9% uptime guarantee

### Pricing
- Enterprise: $49/seat/month (min 10 seats)
- Target: 10 enterprise contracts by end of Y3

## Gate 5 Targets
| KPI | Target |
|-----|--------|
| D30 Retention | ≥75% |
| Affection Score | ≥75 |
| MAU | ≥5M |
| ARR | ≥$50M |
| Insight Action Rate | ≥40% |
| Enterprise contracts | ≥10 |

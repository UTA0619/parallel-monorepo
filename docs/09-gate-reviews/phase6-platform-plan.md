# Phase 6 — Platform Plan (Y5–Y10)

> Target: $500M ARR, 20M MAU, 100+ 3rd-party integrations

## 6.1 PARALLEL Platform — Open API

### API Design
```
GET  /v1/memories              List user memories (paginated)
POST /v1/memories              Store new memory
GET  /v1/memories/{id}         Get single memory
POST /v1/simulate              Trigger life-path simulation
GET  /v1/insights              Get today's insights
POST /v1/conversation          Send message to Parallel Self
```

**API Constraints:**
- Rate limit: 1,000 req/min per OAuth2 client
- Memory content: 3rd parties can write but not read raw content (privacy)
- Insights: read-only for 3rd parties
- No access to crisis data or clinical records

### Developer Portal
- Self-serve signup → API key in <2 minutes
- Interactive docs (Scalar or Swagger UI)
- Sandbox with 30-day synthetic user
- Usage dashboard + billing (metered at $0.001/API call above free tier)

### Revenue Share
- Free tier: 10K calls/month
- Pro: $49/mo (1M calls)
- Enterprise: custom
- Premium integrations: 30% revenue share on subscriptions driven by integration

## Gate 6 Targets
| KPI | Target |
|-----|--------|
| D30 Retention | ≥78% |
| MAU | ≥20M |
| ARR | ≥$500M |
| 3rd-party integrations | ≥100 |
| Platform GMV | ≥$10M |
| Developer NPS | ≥60 |

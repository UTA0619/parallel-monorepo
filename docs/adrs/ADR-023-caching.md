# ADR-023: Caching Strategy — Redis vs. In-Memory vs. CDN Edge

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**Multi-layer caching:**

| Layer | Technology | TTL | Use Case |
|-------|-----------|-----|---------|
| CDN Edge | Vercel Edge Cache | 1h | Static assets, public marketing pages |
| Application | Upstash Redis | 24h | Morning Report per user, session state |
| In-memory | Node.js LRU cache | 5min | Hot embedding lookups, tag taxonomy |

**Morning Report cache invalidation:**
- Invalidated when: user adds ≥3 new memories OR 24h elapsed
- Key: `report:{user_id}:{date}`

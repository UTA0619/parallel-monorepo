# C4 Model — Level 2: Containers

```
┌─────────────────────────────────────────── PARALLEL PLATFORM ───┐
│                                                                   │
│  ┌─────────────────┐    ┌──────────────────────────────────────┐ │
│  │  Mobile App     │    │  Web Marketing                       │ │
│  │  React Native   │    │  Next.js 15 + App Router             │ │
│  │  Expo Bare 51   │    │  Vercel Edge                         │ │
│  │  iOS + Android  │    │  apps/web-marketing/                 │ │
│  └────────┬────────┘    └──────────────────────────────────────┘ │
│           │ HTTPS/WSS                                             │
│  ┌────────▼────────────────────────────────────────────────────┐ │
│  │  API Gateway                                                │ │
│  │  Go + gorilla/mux                                          │ │
│  │  - JWT validation (Supabase Auth)                          │ │
│  │  - Rate limiting (100 req/min per user)                    │ │
│  │  - Request routing to services                             │ │
│  │  - WebSocket proxy (voice sessions)                        │ │
│  │  services/api-gateway-go/                                  │ │
│  └────┬───────────┬───────────────┬──────────────────────┬────┘ │
│       │           │               │                      │       │
│  ┌────▼────┐ ┌────▼────┐  ┌───────▼───────┐  ┌──────────▼────┐ │
│  │Orchestr-│ │ Memory  │  │ Crisis Layer  │  │  Simulation   │ │
│  │ator     │ │ Service │  │               │  │  Batch        │ │
│  │(Rust)   │ │(Python) │  │ Crisis detect │  │  (Python)     │ │
│  │Pipeline │ │Embedding│  │ Escalation    │  │  Monte Carlo  │ │
│  │mgmt     │ │Retrieval│  │ Hotline integ │  │  10K paths    │ │
│  │Retry    │ │ML ops   │  │               │  │  Nightly cron │ │
│  └────┬────┘ └────┬────┘  └───────────────┘  └───────────────┘ │
│       │           │                                              │
│  ┌────▼───────────▼──────────────────────────────────────────┐  │
│  │  Supabase                                                 │  │
│  │  ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐  │  │
│  │  │  PostgreSQL  │  │ pgvector │  │   Auth   │  │ Store │  │  │
│  │  │  + RLS      │  │ 1536-dim │  │JWT/OAuth │  │ audio │  │  │
│  │  └─────────────┘  └──────────┘  └──────────┘  └───────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Message Queue (Upstash Redis Streams)                   │    │
│  │  parallel:memory:process | parallel:simulation:run       │    │
│  │  parallel:notify:schedule | parallel:report:generate     │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Cache (Upstash Redis)                                   │    │
│  │  Morning reports (24h TTL) | Session state               │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

## Container Descriptions

### Mobile App (apps/mobile/)
- **Technology:** React Native, Expo Bare SDK 51, TypeScript
- **Responsibilities:** UI, voice capture (expo-av), push notification handling, offline cache, biometric auth
- **Communicates with:** API Gateway via HTTPS REST + WebSocket

### Web Marketing (apps/web-marketing/)
- **Technology:** Next.js 15, App Router, Tailwind CSS, deployed on Vercel
- **Responsibilities:** Landing page, waitlist capture, pricing page, blog
- **No backend access** — marketing content only

### API Gateway (services/api-gateway-go/)
- **Technology:** Go 1.22, gorilla/mux, jwt-go
- **Responsibilities:** Authentication middleware, rate limiting, routing, WebSocket proxy
- **Ports:** 8080 (HTTP/WS)

### Orchestrator (services/orchestrator-rs/)
- **Technology:** Rust, tokio async runtime
- **Responsibilities:** Pipeline execution (Sense→Reflect→Simulate→Advise), stage retry logic, telemetry
- **Communicates with:** Memory Service, LLM APIs (Claude), Queue

### Memory Service (services/memory-py/)
- **Technology:** Python 3.11, FastAPI, sentence-transformers
- **Responsibilities:** Embedding generation, ANN retrieval, memory scoring, tag classification
- **Communicates with:** Supabase (pgvector), OpenAI Embeddings API

### Crisis Layer (services/crisis-layer/)
- **Technology:** Python 3.11, FastAPI
- **Responsibilities:** Distress detection, severity classification, hotline routing, audit logging
- **Criticality:** HIGH — failure must be fail-safe (default to Tier 3 escalation on error)

### Simulation Batch (services/simulation-batch/)
- **Technology:** Python 3.11, async
- **Responsibilities:** Nightly Monte Carlo simulation of life paths, parallel processing
- **Schedule:** Cron: 2am–4am user local time

### Supabase
- **Technology:** PostgreSQL 15, pgvector 0.7, Supabase Auth, Supabase Storage
- **Regions:** US East (primary) + Tokyo (JP users, see ADR-025)

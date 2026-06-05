# C4 Model — Level 1: System Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PARALLEL SYSTEM                              │
│                                                                     │
│  ┌────────────┐     ┌─────────────────────────────────────────┐    │
│  │    User    │────▶│         PARALLEL App (Mobile)           │    │
│  │ (iOS/Android│    │  React Native + Expo Bare               │    │
│  │  any OS)   │◀────│  Voice capture, Morning Report, Reflect │    │
│  └────────────┘     └────────────────┬────────────────────────┘    │
│                                      │ HTTPS/WSS                   │
│                     ┌────────────────▼────────────────────────┐    │
│                     │       API Gateway (Go)                  │    │
│                     │  Auth, rate limiting, routing           │    │
│                     └──────┬──────────┬──────────┬────────────┘    │
│                            │          │          │                  │
│              ┌─────────────▼─┐  ┌─────▼──────┐  ┌▼───────────┐   │
│              │ Orchestrator  │  │  Memory    │  │  Crisis    │   │
│              │    (Rust)     │  │  (Python)  │  │  Layer     │   │
│              │ Pipeline mgmt │  │  ML/embed  │  │  (Safety)  │   │
│              └───────┬───────┘  └─────┬──────┘  └────────────┘   │
│                      │                │                            │
│              ┌───────▼────────────────▼──────────────────────┐    │
│              │           Supabase                            │    │
│              │  PostgreSQL + pgvector + Auth + Storage       │    │
│              └───────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘

EXTERNAL SYSTEMS:
  Anthropic API (Claude Haiku/Sonnet/Opus)
  OpenAI API (Whisper STT, text-embedding-3-small)
  Apple APNs / Google FCM (push notifications)
  RevenueCat (billing)
  PostHog (analytics)
  Sentry (error monitoring)
```

## Actors

| Actor | Description |
|-------|-------------|
| User | Individual using PARALLEL on iOS/Android |
| Enterprise Admin | HR manager or coach managing an org (Phase 5) |
| Developer | 3rd-party developer using PARALLEL API (Phase 6) |

## External Systems

| System | Purpose | Data shared |
|--------|---------|------------|
| Anthropic Claude | LLM inference (generation, classification) | Memory content excerpts (no PII labels) |
| OpenAI Whisper | Speech-to-text transcription | Audio files (ephemeral) |
| OpenAI Embeddings | text-embedding-3-small for memory vectors | Memory text (no user identifiers) |
| Apple APNs | iOS push notifications | Device token, notification payload |
| Google FCM | Android push notifications | Device token, notification payload |
| RevenueCat | In-app subscription management | User ID, purchase events |
| PostHog | Product analytics | Anonymous events, no PII |
| Sentry | Error monitoring | Stack traces, session IDs |

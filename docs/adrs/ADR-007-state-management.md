# ADR-007: Client State Management — Zustand vs. Redux Toolkit vs. Jotai

**Status:** Accepted  
**Date:** 2026-06-05  
**Deciders:** Architect Agent, Code Agent

---

## Context

Mobile and web apps need predictable global state management for: auth session, user profile, in-flight voice sessions, morning report cache, notification state.

## Decision

**Zustand** for global client state

### Rationale

| Factor | Zustand | Redux Toolkit | Jotai |
|--------|---------|---------------|-------|
| Bundle size | ~1KB | ~15KB | ~3KB |
| Boilerplate | Minimal | Medium | Minimal |
| DevTools | ✅ | ✅ Excellent | 🟡 |
| React Native support | ✅ | ✅ | ✅ |
| Learning curve | Low | Medium | Low |
| Middleware/middleware | ✅ immer built-in | ✅ | ❌ |

### Store Structure
```
stores/
├── authStore.ts        # Session, user profile
├── memoryStore.ts      # Local memory cache
├── voiceStore.ts       # Voice session state
├── reportStore.ts      # Morning report cache
└── uiStore.ts          # Navigation, modals, notifications
```

## Consequences
- Simpler than Redux; sufficient for our state complexity
- No global Redux DevTools browser extension (Zustand has own middleware)
- Migration to Redux Toolkit straightforward if state complexity grows significantly

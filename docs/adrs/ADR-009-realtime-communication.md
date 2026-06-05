# ADR-009: Real-Time Communication — WebSockets vs. SSE vs. Long Polling

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**WebSockets for voice session streaming; SSE for report streaming**

- Voice (Tap-to-Converse): bidirectional audio stream requires WebSockets
- Morning Report streaming: server-to-client only → SSE (simpler, HTTP/2 compatible)
- Supabase Realtime (WebSocket) for notification delivery

## Consequences
- Load balancer must support WebSocket sticky sessions for voice sessions
- Fallback: if WebSocket fails, degrade to SSE for transcription (text only)

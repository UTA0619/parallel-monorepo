# ADR-010: Speech-to-Text — Whisper API vs. Self-Hosted vs. AssemblyAI

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**OpenAI Whisper API (primary) + Self-hosted Whisper (JP data residency)**

| Deployment | Usage |
|-----------|-------|
| Whisper API | US, EU users by default |
| Self-hosted Whisper large-v3 (GPU) | JP users (data residency requirement) |

- Self-hosted on a single A100 GPU instance in Tokyo region
- Fallback: if self-hosted fails, route JP users to Whisper API with data residency notice

## Consequences
- GPU ops cost: ~$1,500/mo for A100 in Tokyo
- Consistent accuracy: Whisper large-v3 matches API quality for Japanese
- Operational overhead: GPU instance management, model updates

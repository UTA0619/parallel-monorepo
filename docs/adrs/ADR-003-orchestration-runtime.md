# ADR-003: Orchestration Runtime — LangGraph vs. Temporal vs. Custom

**Status:** Accepted  
**Date:** 2026-05-29  
**Deciders:** CTO, Architect Agent

---

## Context

The PARALLEL inference loop (Sense → Reflect → Simulate → Advise) requires a durable, observable orchestration runtime. The simulation batch and crisis layer also need reliable workflow execution.

## Decision

**Custom lightweight orchestrator in Rust** (services/orchestrator-rs/)

### Rationale
- LangGraph: Python-native, good for LLM chains but adds Python dependency to Rust service; limited durability
- Temporal: Excellent durability but heavyweight (requires separate cluster); overkill for MVP
- Custom Rust: Direct integration with memory layer, predictable performance, full control over retry/timeout logic

### Architecture
```
orchestrator-rs/
├── src/
│   ├── pipeline/     # Sense → Reflect → Simulate → Advise stages
│   ├── tasks/        # Individual task definitions
│   ├── retry/        # Exponential backoff, circuit breakers
│   └── telemetry/    # OpenTelemetry traces per pipeline run
```

### Durability
- Pipeline state persisted to Postgres (orchestration_runs table)
- Crash recovery: on restart, resume from last completed stage
- Idempotent stage execution via stage_run_id

## Consequences
- Custom code requires maintenance; mitigated by thorough test coverage
- Migrate to Temporal at Phase 5 if pipeline complexity exceeds custom solution

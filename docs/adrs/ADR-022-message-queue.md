# ADR-022: Message Queue — Redis Streams vs. RabbitMQ vs. Kafka

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**Redis Streams (Upstash) for MVP; migrate to Kafka at Phase 5**

- Redis Streams via Upstash: serverless, zero ops, sufficient for MVP throughput
- Queue jobs: memory processing, simulation triggers, notification scheduling
- Phase 5 migration to Kafka when: >10K events/sec or exactly-once delivery required

```
Queues:
  parallel:memory:process    # New memory → tag + embed
  parallel:simulation:run    # Nightly simulation triggers
  parallel:notify:schedule   # Notification scheduling
  parallel:report:generate   # Morning report generation
```

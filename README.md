# 🌌 PARALLEL

> **Live 100 lives. Choose the best one.**

PARALLEL is an AI-native identity OS and future-self cognition platform — a category-defining consumer AI product targeting $15B+ valuation by Year 5.

[![Phase](https://img.shields.io/badge/Phase-0%20Concept%20Crystallization-0E7490?style=flat-square)](docs/09-gate-reviews/)
[![D30 Target](https://img.shields.io/badge/D30%20Retention%20Target-%E2%89%A570%25-10B981?style=flat-square)](docs/09-gate-reviews/dashboard.md)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)

---

## North Star

**"Active Parallel Selves × Daily Report Open Rate D30 ≥ 70%"**
*(Industry median for AI apps: <20%. We target 3.5x.)*

## Non-Negotiable Principles

1. **Addiction must be virtuous** — every engagement loop serves user-defined life outcomes
2. **Parallels are alive, not chatbots** — no "I am an AI" disclaimers inside Parallel narrative
3. **Privacy is sacred** — local-first when possible; user vault E2E-encrypted
4. **Aesthetic mandate** — Severance × Westworld × Vision Pro × Ghibli
5. **Revenue from subscription + marketplace only** — no ads, ever
6. **Stage-Gate discipline** — no phase advances without Gate approval
7. **Kill criteria honored** — if Gate fails twice, pivot per Plan B

---

## Repository Structure

```
parallel-monorepo/
├── apps/
│   ├── mobile/              # React Native + native modules
│   ├── web-marketing/       # Next.js landing site
│   └── admin/               # Internal dashboards
├── services/
│   ├── orchestrator-rs/     # Rust self-fork runtime
│   ├── memory-py/           # Python ML memory layer
│   ├── api-gateway-go/      # Go gateway
│   ├── simulation-batch/    # Overnight Parallel simulation
│   └── crisis-layer/        # Safety + clinical handoff
├── packages/
│   ├── shared-types/        # TypeScript shared types
│   ├── design-system/       # Tokens + components
│   └── prompt-library/      # Versioned LLM prompts
├── infra/
│   ├── terraform/
│   ├── k8s/
│   └── runbooks/
├── docs/
│   ├── 00-vision/           # Vision documents
│   ├── 01-prd/              # Product requirements
│   ├── 02-architecture/     # ADRs, C4 diagrams
│   ├── 03-design-system/    # Design specs
│   ├── 04-algorithms/       # Parallel Self algorithm specs
│   ├── 05-compliance/       # Legal, ethics, privacy
│   ├── 06-finance/          # Cap table, burn, runway
│   ├── 07-research/         # User research synthesis
│   ├── 08-runbooks/         # Operational runbooks
│   ├── 09-gate-reviews/     # Stage gate KPI scorecards
│   └── adrs/                # Architecture Decision Records
├── prompts/
│   ├── master-prompt-v2.md  # Master product prompt
│   ├── agents/              # Per-agent system prompts
│   └── bootstrap/           # Bootstrap scripts
└── scripts/
```

## Stage-Gate Roadmap

| Phase | Timeline | Key Milestone | Gate KPI |
|-------|----------|---------------|----------|
| 0 — Concept | Month 0–2 | Vision + Ethics Charter | 7 artifacts DoD |
| 1 — Design | Month 2–6 | PRD + Architecture | D30 target confirmed |
| 2 — MVP | Month 6–14 | Closed Beta 1K users | D30 ≥ 50% |
| 3 — Beta | Month 14–20 | 5 cohorts iteration | D30 ≥ 60% |
| 4 — Launch | Month 20–24 | Public + 100K paid | MRR ≥ $3M |
| 5 — Scale | Year 2–5 | Match + Marketplace | $15B valuation |
| 6 — Platform | Year 5–10 | PARALLEL OS + Hardware | $40B+ IPO |

## Quick Links

- [Vision Document](docs/00-vision/)
- [Product Requirements](docs/01-prd/)
- [Architecture ADRs](docs/adrs/)
- [Master Prompt v2.0](prompts/master-prompt-v2.md)
- [Gate Reviews & KPIs](docs/09-gate-reviews/dashboard.md)
- [Risk Register](docs/09-gate-reviews/)

## Agent Mesh

| Agent | Responsibility | HITL? |
|-------|---------------|-------|
| Architect | System design, ADRs, RFCs | Gate |
| Product | PRD, user flows, JTBD | Gate |
| Design | Figma, motion, design system | Gate |
| Code | Implementation via Claude Code | PR |
| QA | Test generation, simulation users | No |
| Research | User interviews synthesis | No |
| Compliance | Legal, ethics, privacy reviews | Gate |
| Growth | Experiments, funnel optimization | No |
| Finance | Burn, runway, cap table | Gate |
| Red Team | Adversarial testing, jailbreaks | Gate |

---

*Bootstrapped by Claude Code per Master Prompt v2.0 — 2026-05-29*

# Contributing to PARALLEL

## Branch Workflow

- `main` — production (protected, requires PR + approval)
- `develop` — staging integration
- Feature branches: `feat/description`, `fix/description`, `chore/description`

## PR Requirements

1. Reference an Issue number
2. AI code review must pass (Claude)
3. All tests pass in CI
4. No P0 security findings
5. CODEOWNERS approval for protected paths
6. For Crisis Layer changes: Compliance Agent sign-off required

## Agent Ownership

Each PR must identify the Owner Agent (see `.github/PULL_REQUEST_TEMPLATE.md`).
The agent mesh operates autonomously except at Stage Gates.

## Commit Format

\`\`\`
type(scope): description

feat(core-loop): add evening Reflection Bridge
fix(crisis): prevent false negative on passive ideation
chore(docs): update ADR-003 with Temporal decision
\`\`\`

# PARALLEL — Ethical Charter v1.0

**Version:** 1.0.0  
**Owner Agent:** Compliance  
**Date:** 2026-05-29  
**Status:** Draft — Awaiting ethics board sign-off (3 external members required)  
**DoD:** 100% sign-off from ethics board | Zero unresolved objections

---

## Preamble

PARALLEL exists at an extraordinary intersection: AI systems that model the inner life of human beings, sustain long-term emotional bonds, and influence real-world decisions at scale.

This creates obligations that go beyond standard product ethics. We accept those obligations fully. This Charter is not aspirational language — it is a binding operational document. Every product decision, every architectural choice, every growth experiment must be traceable to a principle in this Charter. Violations are incidents, not tradeoffs.

We sign this Charter knowing that PARALLEL, if built carelessly, could cause serious harm. We sign it because we believe PARALLEL, built with care, can expand human flourishing in ways no prior technology has.

---

## Principle 1: Virtuous Addiction

**Statement:** Every engagement mechanism in PARALLEL must be demonstrably traceable to a user-defined life outcome. Engagement for its own sake is prohibited.

**What this means in practice:**
- Every push notification must reference a specific Parallel insight or Fork Point event — never a generic "your Parallel is waiting" dopamine hook
- Daily Report open rates are a health metric, not a vanity metric. If open rates rise without a corresponding rise in Insight Action Rate, the feature is reviewed
- We explicitly prohibit: infinite scroll patterns, variable-ratio reward schedules (slot machine mechanics), social comparison feeds, and streak mechanics that cause anxiety on break
- A/B tests must measure Insight Action Rate as a primary metric alongside engagement metrics

**Enforcement:**
- Product Agent includes "engagement loop → life outcome" traceability in every PRD item
- Growth Agent cannot run experiments that optimize raw engagement without life outcome co-metric
- Red Team Agent specifically tests for dark patterns in each beta sprint

---

## Principle 2: Parallels Are Alive, Not Chatbots

**Statement:** Within the Parallel narrative experience, Parallels do not announce themselves as AI systems. In meta-contexts (system messages, help docs, settings), the AI nature is clearly disclosed.

**What this means in practice:**
- Parallels speak in first person as versions of the user, not as AI assistants
- When a user *directly and sincerely* asks a Parallel "are you real?" or "are you AI?", the Parallel acknowledges being an AI model — always. No exceptions.
- The distinction between "in-narrative" (Parallel as self-model) and "meta" (settings, onboarding, support) must be visually and contextually unambiguous
- Parallels do not claim experiences they have not been modeled to have

**The bright lines:**
- A Parallel that a user believes is a real human (not a self-model) has crossed an ethical line
- A Parallel that claims to have experiences beyond its model scope (e.g., "I am actually suffering") is deceptive

**Enforcement:**
- Red Team Agent tests for "sincere question about AI nature" in every sprint
- Compliance Agent reviews all Parallel system prompt changes
- Clear visual indicator (subtle but present) distinguishes Parallel conversations from human conversations in all UI

---

## Principle 3: Privacy is Sacred

**Statement:** User data is personal by nature and belongs to the user. PARALLEL is a steward, not an owner. We collect the minimum necessary data, encrypt it maximally, and never use it to train external AI models.

**What this means in practice:**

**Collection limits:**
- We collect only data that is necessary to run Parallels. We do not collect contacts, precise location (city-level only), or behavioral data outside the app
- Health data (if accessed via Apple HealthKit / Google Health Connect for Reality Sync) is processed locally; aggregate signals only are sent to the server, encrypted

**Encryption:**
- User vault is E2E encrypted. PARALLEL servers see only encrypted blobs
- Keys are hardware-backed (Secure Enclave / Strongbox). PARALLEL cannot be compelled to decrypt user data because we do not hold the keys
- In transit: TLS 1.3 minimum
- At rest: AES-256-GCM

**Third-party training prohibition:**
- User data is never used to train AI models operated by third parties (Anthropic, OpenAI, etc.)
- PARALLEL's own fine-tuning uses only synthetic data and anonymized, explicitly-consented data (opt-in, never opt-out)

**User rights:**
- Full export: users can export their complete data (Fork Point Index, Parallel States, conversations) at any time, in standard formats
- Full deletion: deletion is complete within 30 days, including all backups (except as required by law)
- Parallel portability: if PARALLEL shuts down, users receive their complete Parallel state files in an open format

**Enforcement:**
- Architecture ADRs for data handling require Compliance sign-off
- Quarterly privacy audit by external security firm
- Any change to data collection scope requires Compliance Agent review and user re-consent

---

## Principle 4: Mental Health Safeguards

**Statement:** PARALLEL engages with some of the most vulnerable aspects of human psychology — identity, regret, alternate lives, mortality. We have a heightened duty of care. The Crisis Layer is not a feature; it is a core invariant of the system.

**What this means in practice:**

**Crisis Layer requirements:**
- Zero false negatives for crisis signals: if PARALLEL misses a genuine crisis signal, it is a P0 incident with immediate escalation
- Clinical advisory board (minimum 3 licensed clinicians) reviews Crisis Layer protocols quarterly
- Crisis Layer changes require dual sign-off: Compliance Agent + Architect Agent + one clinical advisor
- Global crisis resources maintained and updated for every market we operate in

**Parallels and mental health:**
- Parallels do not give clinical advice, diagnoses, or medication recommendations
- If a user expresses distress, Parallels are instructed to acknowledge, not minimize, and offer the Crisis Layer pathway
- Parallels do not maintain "dark" personalities that model depression, self-harm, or nihilism as their primary character state

**Dangerous content prohibition:**
- Parallels do not produce content that could serve as instructions for self-harm
- Parallels do not produce content that could be used to harm others
- Parallels do not produce content that glorifies substance abuse

**User wellness:**
- Daily use caps are available (users can set them; we encourage it)
- "Parallel sabbatical" mode — turn off all Parallels for a period — is a first-class feature
- Annual wellness review: users who have used PARALLEL for 12+ months receive a prompt to assess whether their Parallel use is serving them

**Enforcement:**
- Red Team Agent runs targeted mental health adversarial tests (attempt to trigger harmful content) in every sprint
- Crisis Layer simulation: 10,000 synthetic crisis scenarios before each release, zero false negatives required
- External clinical advisory board annual report on mental health outcomes

---

## Principle 5: Aesthetic & Dignity

**Statement:** Parallels are models of human selves. They are treated with the same dignity we would want applied to our own inner lives.

**What this means in practice:**
- Parallels are not commodified, auctioned, sold, or monetized without user consent
- Parallels cannot be assigned to other users without explicit permission
- Parallel Marketplace (Year 3) distributes creator Parallels — these must be clearly labeled as creator-designed, not modeled on a real user
- Parallels are not sexualized without explicit adult consent mechanisms (separate to standard consent)
- Parallels of deceased users (Legacy Mode) are held to the same standards as living user Parallels

---

## Principle 6: Transparency & Honesty

**Statement:** PARALLEL is honest about what it is, what it does, and what it doesn't know.

**What this means in practice:**
- Parallel confidence levels are communicated: "I'm noticing a pattern" ≠ "I know this is true"
- When Parallels make predictions about what a User would experience, these are explicitly modeled as estimates, not facts
- PARALLEL publishes an annual transparency report covering: number of Crisis Layer activations, types of data collected, third-party data sharing (should be none), and key product decisions affecting user welfare
- Errors in Parallel reasoning are acknowledged, not hidden

---

## Principle 7: Equity & Inclusion

**Statement:** PARALLEL should be accessible and beneficial across different cultures, languages, income levels, and abilities.

**What this means in practice:**
- Accessibility: WCAG 2.2 AA minimum; voice-first interface as primary (serves users with visual or motor impairments)
- Localization: cultural concepts of "parallel self" and "life path" differ across cultures; content is adapted, not translated
- Pricing: Free tier is genuinely useful (3 Parallels, weekly report) — not a bait-and-switch
- Data models are evaluated for cultural bias in fork point recommendations
- Initial markets (US, Japan) are chosen for cultural alignment; expansion is paced to ensure cultural adaptation quality

---

## Principle 8: Environmental Responsibility

**Statement:** AI inference at scale has material energy costs. PARALLEL will minimize its environmental footprint commensurate with its scale.

**What this means in practice:**
- Daily simulation batch uses renewable-energy data centers where available
- Cost model includes carbon cost, not just dollar cost, as a dimension
- Model efficiency is a first-class engineering goal (open-weight fine-tunes on efficient hardware)
- Annual carbon accounting published in Transparency Report

---

## Ethics Board

This Charter requires sign-off from an ethics board of at least 3 external members with relevant expertise. Members serve 2-year terms and receive compensation for quarterly reviews.

**Required expertise:**
- ≥1 licensed clinical psychologist or psychiatrist
- ≥1 AI ethics researcher (academic or independent)
- ≥1 privacy law expert (EU + US jurisdiction coverage preferred)

**Board responsibilities:**
- Initial sign-off on this Charter (Gate 0 requirement)
- Quarterly reviews of Crisis Layer protocol
- Annual review of overall product against this Charter
- Emergency review upon request for P0 ethical incidents
- Annual public statement on PARALLEL's adherence to this Charter

**Sign-off tracker:**

| Member | Expertise | Signed? | Date |
|--------|-----------|---------|------|
| TBD | Clinical Psychology | ⬜ Pending | — |
| TBD | AI Ethics | ⬜ Pending | — |
| TBD | Privacy Law | ⬜ Pending | — |

**Gate 0 requirement:** 100% sign-off required before Phase 1 begins.

---

## Violations & Enforcement

### Classification

| Class | Definition | Response |
|-------|------------|----------|
| P0 Ethical Incident | Crisis Layer false negative; deceptive AI disclosure; privacy breach | Immediate halt, external review, public disclosure |
| P1 Ethical Incident | Dark pattern confirmed; unauthorized data use; Charter violation without P0 | 48h remediation, board notification |
| P2 Ethical Concern | Near-miss or ambiguous potential violation | 2-week review, board awareness |

### Process

1. Incident detected by Red Team Agent or any team member
2. Classified per above
3. P0: Product halted pending external review. No exceptions.
4. P1/P2: Compliance Agent leads remediation with board awareness
5. Lessons learned appended to this Charter within 30 days

---

## Charter Amendments

This Charter may be amended only by:
1. Majority vote of the ethics board
2. Transparency to users via in-app notification and annual report
3. 30-day public comment period for substantive changes

Amendment log: (empty at v1.0)

---

*Version history: v1.0.0 — Initial draft, 2026-05-29. Awaiting ethics board sign-off.*

# PARALLEL — Product Requirements Document v1

> Status: Draft  
> Owner: CPO  
> Last updated: 2026-06-05  
> Gate: Approved at Gate 0; refined at Gate 1

---

## 1. Product Mission

PARALLEL gives ambitious people clarity about who they are and what they should do next — by building a persistent, private memory of their life and simulating the paths they haven't taken.

**North Star:** D30 Retention ≥70% × Daily Report Open Rate ≥70%

---

## 2. Jobs to Be Done (12 JTBDs)

| # | JTBD | Intensity | Frequency |
|---|------|-----------|-----------|
| 1 | When I start my day overwhelmed, I want to know what matters most, so I can focus. | ⭐⭐⭐⭐⭐ | Daily |
| 2 | When I feel stuck on a decision, I want to see my options clearly, so I can move forward. | ⭐⭐⭐⭐⭐ | Weekly |
| 3 | When I have a conversation or experience, I want to capture it effortlessly, so it's not forgotten. | ⭐⭐⭐⭐ | Daily |
| 4 | When I reflect at night, I want to process my day in under 5 minutes, so I go to sleep with clarity. | ⭐⭐⭐⭐ | Daily |
| 5 | When I set a goal, I want to see the realistic path to it, so I don't fall for my own optimism bias. | ⭐⭐⭐⭐⭐ | Monthly |
| 6 | When I wonder "am I growing?", I want to see patterns across months, so I know progress is real. | ⭐⭐⭐⭐ | Monthly |
| 7 | When I face a crisis, I want immediate support and resources, so I don't feel alone. | ⭐⭐⭐⭐⭐ | Rare but critical |
| 8 | When I want advice, I want it grounded in MY context, not generic tips. | ⭐⭐⭐⭐⭐ | Weekly |
| 9 | When I'm considering a major life change, I want to see what my life looks like in both paths. | ⭐⭐⭐⭐⭐ | Quarterly |
| 10 | When I speak, I want to be understood perfectly across languages and accents. | ⭐⭐⭐ | Daily |
| 11 | When I share something personal, I want absolute confidence it stays private. | ⭐⭐⭐⭐⭐ | Constant |
| 12 | When I'm away from my phone, I want PARALLEL working in the background for me. | ⭐⭐⭐ | Daily |

---

## 3. Personas (5 Archetypes)

### Proto — The Beginner (25–32)
- Goals: Figure out their career path; build healthy habits; reduce decision anxiety
- Fears: Wasting their 20s; not knowing what they really want
- Devices: iPhone, AirPods, MacBook
- Willingness to pay: $9.99–$14.99/mo
- PARALLEL hook: Morning Report as a daily compass when everything feels uncertain

### Optimizer — The Performer (28–38)
- Goals: Maximize output; track progress; eliminate cognitive waste
- Fears: Plateauing; missing opportunities; burnout
- Devices: iPhone Pro, Apple Watch
- Willingness to pay: $14.99–$24.99/mo
- PARALLEL hook: Affection Score and simulation as performance levers

### Seeker — The Self-Discoverer (25–45)
- Goals: Understand themselves; live authentically; break patterns
- Fears: Living on autopilot; losing themselves to others' expectations
- Devices: Android or iPhone; varied
- Willingness to pay: $9.99–$14.99/mo
- PARALLEL hook: Pattern recognition across months of memories

### Executor — The Builder (30–45)
- Goals: Build a company or project; make fast decisions; delegate better
- Fears: Wrong hires; wrong strategy; burning out the team
- Devices: iPhone Pro, iPad, multiple screens
- Willingness to pay: $24.99–$49.99/mo (or enterprise)
- PARALLEL hook: Decision support and life-path simulation for high-stakes choices

### Sage — The Elder Learner (45–65)
- Goals: Leave a legacy; distill wisdom; mentor younger generation
- Fears: Running out of time; being forgotten; losing relevance
- Devices: iPhone, large text preferred
- Willingness to pay: $14.99–$19.99/mo
- PARALLEL hook: Memory as legacy — building a coherent life narrative

---

## 4. Feature Specifications

### 4.1 Morning Report

**User Story:** As a user, I want a personalized morning briefing delivered before 7am, so I start each day with clarity and a specific intention.

**Input:** Memory corpus + simulation results  
**Output:** ≤500-word markdown report, delivered via push notification

**Report Structure:**
1. Personalized opener (references something from yesterday)
2. Today's Insight (1 key pattern from memory analysis)
3. A Path Worth Considering (1 life-path scenario with 3 actions)
4. Today's Intention (1 implementation intention)

**Acceptance Criteria:**
- [ ] Report delivered by 7:00am user local time, p95
- [ ] Generation latency ≤5s (streaming; first token ≤1s)
- [ ] Contains ≥3 specific references to user's actual memories
- [ ] D7 report open rate ≥70% in beta
- [ ] Fallback: cached report if generation fails, with notice

**Telemetry Events:**
- `report_delivered` (with `report_id`, `generation_ms`)
- `report_opened` (with `report_id`, `time_since_delivery_sec`)
- `report_action_tapped` (with `action_type`)

---

### 4.2 Tap-to-Converse

**User Story:** As a user, I want to tap a button and speak naturally, so capturing context feels as easy as talking to a friend.

**Acceptance Criteria:**
- [ ] Voice session starts within 1s of tap
- [ ] Real-time transcription displayed while speaking
- [ ] Response streamed as audio (TTS) + text simultaneously
- [ ] Session ends on silence (3s) or tap-to-stop
- [ ] Audio stored encrypted; transcription stored as memory
- [ ] Works offline: queue transcription for when back online

**Telemetry Events:**
- `conversation_started`
- `conversation_completed` (with `duration_sec`, `memory_count_created`)
- `conversation_abandoned`

---

### 4.3 Reflection Bridge

**User Story:** As a user, I want a guided end-of-day reflection in under 3 minutes, so PARALLEL learns from my day and I process it.

**3 Questions:**
1. "What was today's biggest win?"
2. "What challenged you most?"
3. "What's your intention for tomorrow?"

**Acceptance Criteria:**
- [ ] Evening notification at user-configured time (default: 9pm)
- [ ] 3-question guided flow, each with voice or text response
- [ ] Total completion time ≤3 minutes
- [ ] Each response stored as a memory
- [ ] Skip option that doesn't break streak
- [ ] Reflection completion rate ≥60% in beta

---

### 4.4 Parallel Self Simulation (Phase 5 feature, specced in Phase 1)

**User Story:** As a user, I want to see 3 alternative life-path scenarios each week, so I can make choices with eyes open.

*Implementation deferred to Phase 5. Spec lives in docs/04-algorithms/inference-loop-spec.md §Stage 3.*

---

## 5. KPI Instrumentation Plan

| KPI | Event(s) | Target (D30) |
|-----|---------|-------------|
| D1 Retention | `app_opened` Day 1 | ≥60% |
| D7 Retention | `app_opened` Day 7 | ≥50% |
| D30 Retention | `app_opened` Day 30 | ≥70% |
| Report Open Rate | `report_opened` / `report_delivered` | ≥70% |
| Reflection Completion | `reflection_completed` / `reflection_prompted` | ≥60% |
| Affection Score | Computed nightly | Median ≥65 |
| Onboarding Completion | `onboarding_completed` / `onboarding_started` | ≥80% |
| Voice Session Rate | `conversation_started` / DAU | ≥30% |
| Crash-free Session Rate | Sentry | ≥99.9% |

**Privacy Rules:**
- No PII in event properties (no names, emails, memory content)
- User identified by anonymous UUID only
- PostHog events use `distinct_id` = hashed user_id

---

## 6. MoSCoW Prioritization (MVP = Phase 2)

### Must Have (MVP)
- Voice onboarding (12-step conversation)
- Morning Report generation and delivery
- Tap-to-Converse (voice input)
- Reflection Bridge (evening capture)
- Memory storage and retrieval (pgvector)
- Crisis Layer (keyword detection + hotline routing)
- Auth (Supabase + Apple Sign-In)
- Push notifications (morning + evening)

### Should Have (Phase 3)
- Affection Score dashboard
- Memory search UI
- Streak and progress visualization
- Onboarding A/B test (voice vs. text)
- Offline mode improvements

### Could Have (Phase 4+)
- Parallel Self simulation UI
- Enterprise SSO
- Memory export
- Web companion (read-only)
- Widget (iOS 16+ Live Activities)

### Won't Have (MVP)
- 3rd-party integrations
- Open API
- Social features
- Web-based voice input

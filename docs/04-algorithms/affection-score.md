# Affection Score — Formula and Calibration

> The North Star metric for PARALLEL user engagement  
> Status: v1  
> Owner: Research Agent

---

## Definition

The **Affection Score** (AS) measures the depth and quality of a user's engagement with PARALLEL. It is designed to track genuine behavioral change and insight-driven action, not passive consumption.

**Target:** Median AS ≥ 65 at D30. Industry baseline for comparable apps: ~35.

---

## Formula

```
AfflectionScore = (
  0.30 × ReportOpenRate_7d
  + 0.25 × ReflectionCompletionRate_7d  
  + 0.25 × ActionFollowThroughRate_14d
  + 0.20 × SessionDepthScore_7d
) × 100

Range: 0–100
```

### Component Definitions

**1. ReportOpenRate_7d** (weight: 30%)
```
= opens_last_7d / reports_delivered_last_7d
```
- Baseline (industry): 0.20 (email newsletters)
- Target: 0.70+

**2. ReflectionCompletionRate_7d** (weight: 25%)
```
= completed_reflections_last_7d / reflection_prompts_last_7d
```
- Completed = ≥2 of 3 questions answered
- Skips count as 0; notification-not-opened also 0

**3. ActionFollowThroughRate_14d** (weight: 25%)
```
= confirmed_actions_last_14d / recommended_actions_last_14d
```
- Confirmed action = user self-reports completion via Tap-to-Converse within 72h
- Requires verbal or text confirmation; cannot be assumed

**4. SessionDepthScore_7d** (weight: 20%)
```
= min(1.0, (avg_session_duration_sec / 180) × (avg_taps_per_session / 5))
```
- Denominator: 180s = "deep session" threshold, 5 taps = "engaged session"
- Capped at 1.0 to prevent gaming via long idle sessions

---

## Affection Score Bands

| Band | Score | Meaning |
|------|-------|---------|
| 🔴 Dormant | 0–24 | User not engaging meaningfully |
| 🟡 Passive | 25–49 | Opening reports but not acting |
| 🟢 Active | 50–74 | Regular engagement + some actions |
| 💜 Thriving | 75–100 | Deep daily engagement, high follow-through |

---

## Calibration Approach

### Calibration Dataset
- 100 synthetic users generated with GPT-4o
- Each user has 30-day behavioral trace with randomized engagement patterns
- Validated manually to confirm intuitive score ordering

### Correlation Validation
- Primary signal: Pearson correlation with D30 retention (target r ≥ 0.7)
- Secondary signal: Correlation with NPS at D30 (target r ≥ 0.5)
- Will be recalibrated after first 500 beta users complete D30

### Decay Handling
- Affection Score is a 7/14-day rolling window — inactive users decay naturally
- No penalty for occasional gaps (≤3 day gaps ignored)
- Score resets to 0 only after 14-day complete inactivity

---

## Insight Action Rate (Secondary KPI)

```
InsightActionRate = confirmed_actions_last_30d / insights_surfaced_last_30d
```

Target: ≥40% at Phase 5  
Phase 2 target: ≥25%

---

## Implementation Notes

- Computed nightly by a scheduled Supabase Edge Function
- Stored in `user_metrics` table (not re-derived on demand)
- Exposed to Morning Report prompt for personalization ("You've been in Thriving mode for 12 days!")
- Used as the primary Phase 3 gate criterion (median ≥65 across ≥2 cohorts)

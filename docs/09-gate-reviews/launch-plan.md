# Phase 4 — Public Launch Plan

> Owner: Growth Agent + CPO  
> Target Date: 2028-05-31

## Pre-Launch Checklist (T-30 days)

### Product
- [ ] App Store listing (screenshots, preview video, keywords) optimised
- [ ] Play Store listing localised (EN + JP)
- [ ] Final security audit passed
- [ ] P0 bug count = 0
- [ ] Crash-free session rate ≥99.9% on staging

### Communications
- [ ] Press kit finalized
- [ ] 20 journalist pitches sent (under embargo)
- [ ] 50 influencer packages delivered
- [ ] Embargo date: T-7 days

### Operations
- [ ] War room runbook published to docs/08-runbooks/launch-day.md
- [ ] On-call rotation scheduled (24h coverage for first 72h)
- [ ] Rollback procedure tested
- [ ] KPI dashboard live (PostHog + custom)

## Launch Day Timeline (T+0)

| Time | Action |
|------|--------|
| 00:00 | Embargo lifted; press publish |
| 06:00 | App Store / Play Store go-live |
| 07:00 | First morning reports delivered to Day 1 users |
| 09:00 | War room check-in #1 (crash rate, conversion) |
| 12:00 | War room check-in #2 |
| 18:00 | End-of-day metrics review |
| 24:00 | D1 retention snapshot |

## Rollback Criteria
- Crash rate >1% sustained for 15 minutes → auto-rollback
- Error rate >5% → manual rollback decision by CTO
- Crisis layer accuracy <95% → disable Tap-to-Converse, notify users

## Post-Launch
- D7 retro: what worked, what didn't
- Phase 5 planning kickoff within 2 weeks

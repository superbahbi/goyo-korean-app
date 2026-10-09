# Recall-quality SRS design

## Goal

Goyo should schedule cards according to **how reliably the learner recalled them**, not only the number of times they were reviewed. The scheduler remains intentionally simple enough to explain and tune from real learner data.

## Model

Each reviewed card now tracks:

- `interval`: scheduled delay in days;
- `easeFactor`: growth multiplier, bounded from 1.3 to 3.2;
- `consecutiveCorrect`: uninterrupted successful recalls;
- `lapseCount`: number of `Again` outcomes.

Existing saved cards continue to work. Missing fields use conservative defaults, so older progress is not lost or reset.

## Rating behavior

| Rating | Initial interval | Later behavior | Meaning |
|---|---:|---|---|
| Again | 1 day | reset to 1 day | Retrieval failed; rebuild memory soon |
| Good | 2 days | previous interval × ease | Successful effortful recall |
| Easy | 4 days | previous interval × ease × 1.3 | Immediate, confident recall |

Intervals are rounded and capped at 365 days. A lapse reduces ease by 0.2, while an Easy answer increases it by 0.15. This prevents both runaway scheduling and repeated failures being hidden by a large interval.

## Mastery interpretation

A card is not considered Known merely because its aggregate accuracy is high. It also needs at least three reviews, a seven-day interval, 75%+ accuracy, and two consecutive correct recalls. This better represents durable retrieval.

## Queue implications

The existing queue continues to prioritize cards whose `due` date is today or earlier. The improved intervals now make that queue more meaningful: failed cards return tomorrow, while stable cards naturally leave space for new vocabulary.

## Tuning plan

After collecting real usage data, tune in this order:

1. **Retention first:** If learners report too many forgotten cards, reduce Good growth before changing the daily goal.
2. **Workload second:** If due queues become too large, adjust Easy growth or the 365-day cap.
3. **Mastery last:** Adjust the Known threshold only after reviewing recall accuracy and lapse rates by card age.

The model should not be tuned from XP or streak data; those measure motivation, not memory.

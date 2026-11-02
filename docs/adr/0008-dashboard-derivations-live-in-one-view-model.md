# 0008. Dashboard derivations live in one view model

- Status: Accepted
- Date: 2026-11-02

## Context

"What does the learner do today" was encoded across the dashboard hook, the welcome card,
the progress cards, the practice menu, the session hook and one practice component.
Availability had two rules — a card-count gate in the hook and a surviving-scenario-ids
check in the component — so the gate could pass while the screen said "Nothing to practice
yet". `Home` also assembled a sixteen-field stats model and a three-field forecast from
values the hook already returned, and one category object fed three different declared
shapes.

## Decision

`lib/dashboardView.ts` builds one view model: today's plan, mode availability (including
scenario-id presence), category summaries, review stats, and the stats/forecast payload.
`Home` composes; cards and the dialog host consume the model. Date-label style is an input
to the builder rather than a formatting call inside a hook.

## Consequences

- One availability rule and one category shape.
- Stats and forecasts are testable without rendering.
- `Home` becomes composition; historical hooks stop deriving presentation policy.
- The builder takes an explicit clock/date style so tests are deterministic.
- If a view needs a new derived number, add it to the builder rather than to the page.

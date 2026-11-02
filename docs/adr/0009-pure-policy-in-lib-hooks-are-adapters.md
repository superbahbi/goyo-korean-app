# 0009. Pure policy lives in lib; hooks are adapters; e2e is the UI net

- Status: Accepted
- Date: 2026-11-02

## Context

The repo has no jsdom or component-testing setup: vitest runs pure Node tests and Playwright
covers rendered behaviour. Logic that lived in hooks could only be exercised through the
browser, which is how several session, grade and selection rules became untestable while
their files looked covered. The refactors repeatedly moved policy out of hooks, but the
pattern was not written down.

## Decision

Framework-free policy belongs in `client/src/lib/` behind a small interface, with the
clock, storage, network and audio dependencies injected. Hooks adapt that policy to React:
subscribe, forward events, supply dependencies. Components render. UI wiring is verified by
Playwright; policy is verified by vitest. Adding a component-test environment is a new
decision, not an incidental change.

## Consequences

- New behaviour should arrive as a lib module with tests, then an adapter, then a view.
- Hooks should not contain rules that a pure function could own.
- E2E remains the behavioural net for mounting, focus, keyboard and accessibility; keep
  specs user-visible rather than implementation-shaped.
- A test that only crosses a helper the production code does not use is a warning sign, not
  coverage.

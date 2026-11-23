## This repo: goyo-korean-app

Find the screen first: `docs/ui-map.md` maps each named screen to its page and components
(under `apps/web/src/`), its domain modules (under `packages/domain/src/`) and its e2e
specs. If two rows could match, ask which screen before designing anything.

Keep the existing patterns. A new dashboard entry point adds one Dialog request kind in
`packages/domain/src/dialogLauncher.ts` and one entry in
`apps/web/src/components/dialogs/registry.tsx` — never a "show" boolean. Colour and tokens
come from `packages/shared/theme.ts` (persisted as `goyo-theme` in `localStorage`), not
from ad-hoc hex values. Components stay presentational: no domain state computed in a
component.

Accessibility belongs to the design, not to a later pass: `e2e/accessibility.spec.ts` and
`e2e/accessibility-semantics.spec.ts` run in CI, so semantics and labels must survive a
restyle.

After a screen change, `pnpm shots` captures the main screens in light and dark at desktop
and iPhone sizes into `.tmp/shots/current/`. Read those PNGs and judge the result against
the brief before reporting it as done; report what the images show, not what you intended.

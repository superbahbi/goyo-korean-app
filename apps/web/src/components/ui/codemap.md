# apps/web/src/components/ui/

## Responsibility

Generated shadcn-style primitives: unstyled Radix behavior plus Tailwind
classes, wrapped once so the rest of the app imports `@/components/ui/*`
instead of Radix directly. This folder carries no domain logic and no app state.

## Design

Each file follows the same recipe: a Radix primitive (`@radix-ui/react-dialog`,
`-select`, `-checkbox`, `-switch`, `-tooltip`, `-progress`, `-slot`), class
composition with `cn` from `@domain/utils`, and `class-variance-authority` where
variants exist. Every element carries a `data-slot="…"` attribute used by
nested Tailwind selectors. Exports:

- `button.tsx` — `Button`, `buttonVariants` (variant × size, `asChild` via
  `Slot`).
- `badge.tsx` — `Badge`, `badgeVariants` (default/secondary/destructive/outline).
- `card.tsx` — `Card`, `CardHeader`, `CardTitle`, `CardDescription`,
  `CardAction`, `CardContent`, `CardFooter`.
- `dialog.tsx` — the Radix parts plus a `DialogCompositionContext` /
  `useDialogComposition` so an open IME composition blocks Escape-to-close, and
  `DialogContent` saves and restores focus because these dialogs are opened by
  parent state rather than a `DialogTrigger`.
- `input.tsx` — `Input`, wired to `useComposition` so CJK IME Enter presses do
  not submit business logic.
- `select.tsx` — trigger/content/item/label/separator/scroll buttons, popper
  positioning, in-viewport scrolling.
- `checkbox.tsx`, `switch.tsx`, `progress.tsx`, `tooltip.tsx` — single-control
  wrappers.
- `sonner.tsx` — `Toaster` re-themed from `ThemeContext.resolvedTheme`.

These are last-resort components: they accept `className` and spread the rest of
their props, so consumers override spacing, radius, and color. Visual identity
(emerald/teal, serif headings) lives in call sites, not here.

## Flow

Pure presentation, one prop hop: caller → wrapper → Radix primitive → DOM.
Open/checked/value state is always controlled by the caller (or left to Radix
for uncontrolled dialogs). The only internal behavior is accessibility plumbing:
focus return in `DialogContent`, composition tracking in `Dialog`/`Input`, and
theme propagation in `Toaster`.

## Integration

Depends on `@radix-ui/*`, `class-variance-authority`, `lucide-react`,
`@domain/utils`, `@/hooks/useComposition`, and `@/contexts/ThemeContext`. Consumed
by nearly every sibling folder — `../` (HomeHeader, QuickLinks, FlashCard,
DownloadAllAudio, AlphabetCard…), `../browse/`, `../settings/`, and the
`../study/`, `../practice/`, `../stats/`, `../grammar/` components — plus pages
and `pages/Home.tsx`.

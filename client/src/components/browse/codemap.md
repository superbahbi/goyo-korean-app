# client/src/components/browse/

## Responsibility

The result-list half of the vocabulary library: turning an already-filtered and
already-paged card slice into a scrollable list of per-card rows. It performs no
searching, filtering, paging, mastery calculation, or audio dispatch — every one
of those is a prop or callback supplied by the parent `BrowseDialog`.

## Design

Two presentational components, no local state:

- `BrowseResultsList` — list container. Renders `BrowseResultRow` per card, a
  dashed empty state (`No matching cards`) when `matchingCount === 0`, and a
  "Load 40 more · N remaining" button when
  `visibleCards.length < matchingCount`. It derives each row's mastery via
  `getMasteryState(cardStates[card.id])` and resolves the per-card playing flags
  by comparing `playingCardId` / `playingSentenceId` against the card id.
- `BrowseResultRow` — one card row, marked `data-testid="browse-result-row"`.
  Shows Korean front, meaning (`back`), a height-reserved romanization line that
  only fills when `isShowingRoman`, the example sentence with its own speaker
  button when `hasSentenceAudio`, plus tag, mastery (`MASTERY_LABELS` /
  `MASTERY_STYLES` from `@/lib/mastery`), and an "Audio pending" badge when
  `card.audioReady === false`. The speak button is disabled while
  `isSpeaking` or audio is pending; both buttons are labelled with the card's
  Korean text and expose `aria-busy` / `aria-pressed`.

All behavior is callback injection: `onSpeak`, `onSpeakSentence`,
`onToggleRomanization`, `onLoadMore`. The row never calls the audio player or
mutates the deck. Callbacks carry only ids; the parent decides what to do.

## Flow

In: `visibleCards` (≤ one page), `matchingCount`, `cardStates`,
`showRomanization`, playback ids from `useAudioPlayback`, and
`sentenceAudioIds` from `useSentenceAudioIds`. `BrowseResultsList` maps cards →
rows, passing booleans computed from those inputs. Out: user events bubble up as
`onSpeak(cardId)`, `onSpeakSentence(cardId)`, `onToggleRomanization(cardId)`,
and `onLoadMore()`; the parent `BrowseDialog` then calls the audio layer, flips
its `showRomanization` record, or grows `visibleCount` by `BROWSE_PAGE_SIZE`.
Rows are keyed by `card.id`, so reveal state and playback highlighting follow
identity rather than list index.

## Integration

Imports `@/components/ui/badge`, `@/components/ui/button`, `@/lib/mastery`, and
`@/lib/vocabulary`. Its only consumer is `../BrowseDialog.tsx`, which owns the
query, category, and mastery filters (front, back, romanization, and example
text matching) plus the 40-card page size; `BrowseDialog` in turn is lazily
rendered by `../dialogs/registry.tsx` under the `browse` Dialog request.

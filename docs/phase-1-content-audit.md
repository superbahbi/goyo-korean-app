# Phase 1 Content Audit

## Source reviewed

`The600EssentialKoreanWords.xlsx` was inspected before integration.

Findings:

- 547 valid Korean–English rows were present.
- 542 unique Korean headwords remained after normalizing the source typos; genuine homonyms remain as separate sense records.
- Duplicate headwords were reviewed as separate senses where appropriate:
  - `차`: car (row 18) / tea (row 175)
  - `공`: ball (row 160) / zero; ball (row 375)
  - `병`: bottle (row 207) / disease; illness (row 282)
  - `눈`: eye (row 261) / snow; eye (row 291)
  - `달`: moon; month (row 292) / month (counter) (row 455)
- Import cleanup trimmed repeated senses: `공` row 375 is now only `zero`, `눈` row 291 is now only `snow`, and the `달` month-counter row was merged into the row 292 entry as `moon; month (counter)`.
- Two high-confidence source corrections were applied: `자정거` → `자전거` (row 20, bicycle) and `놉다` → `높다` (row 580, to be high).
- The workbook does not provide romanization, example sentences, reliable part of speech, or audio.

## Integration decision

The existing 136-card curated phrase deck remains the study-ready deck because it already has reviewed examples and ElevenLabs audio. The imported essential-word inventory is available in the Vocabulary Library under **Essential 600**, but is marked `audioReady: false` until each word receives:

1. a content-reviewed meaning and usage note;
2. a natural example sentence;
3. a verified learner-facing romanization;
4. verified ElevenLabs Korean pronunciation recordings.

This prevents incomplete source data from entering the audio-first daily session or producing silent/broken practice cards.

## Implemented

- Added 546 sense-aware essential-word records from the 547 valid source rows.
- 45 headwords overlap with existing curated cards, but only 29 Korean-plus-meaning pairs are exact matches after case normalization. Those 29 duplicate senses are removed; distinct meanings remain as separate cards, producing 517 new imported sense cards.
- Added deterministic romanization for library search and preview.
- Added a natural Korean example, English translation, usage note, and corrected part-of-speech metadata for all 546 imported records.
- Added source metadata and audio readiness metadata to `VocabularyCard`.
- Added the **Essential 600** library category.
- Kept audio-first Daily, Listening, Scenario, and Shadowing practice restricted to study-ready cards.
- Generated and verified 1,092 word-level ElevenLabs recordings: 546 with **Hyuk - Cold and Clear** and 546 with **Anna Kim - Tender, Calm and Clear**.
- Marked all 546 imported records audio-ready and mapped both speakers in `public/audio/index.json`.
- Browse Deck now shows the imported records as playable rather than audio-pending.
- Corrected several high-confidence curated romanization typos, including `재미있어요`, `화났어요`, and `뭐라고 했어요?`.
- Daily, Listening, Scenario, and Shadowing practice can now use the complete imported deck because every record has enriched content and verified word-level audio.
- Dashboard learning percentage now uses the complete study-ready deck.

## Next content pass

The next safe batch should enrich the essential inventory in small reviewable groups of 25–50 words. Each group should be checked for naturalness, politeness, part of speech, example quality, and audio before becoming study-ready.

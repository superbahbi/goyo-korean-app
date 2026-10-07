# Phase 1 Content Audit

## Source reviewed

`The600EssentialKoreanWords.xlsx` was inspected before integration.

Findings:

- 547 valid Korean–English rows were present.
- 542 unique Korean headwords remained after deduplication.
- Duplicate headwords: `차`, `공`, `병`, `눈`, and `달`.
- Two high-confidence source corrections were applied: `자정거` → `자전거` and `놉다` → `높다`.
- The workbook does not provide romanization, example sentences, part of speech, or audio.

## Integration decision

The existing 136-card curated phrase deck remains the study-ready deck because it already has reviewed examples and ElevenLabs audio. The imported essential-word inventory is available in the Vocabulary Library under **Essential 600**, but is marked `audioReady: false` until each word receives:

1. a content-reviewed meaning and usage note;
2. a natural example sentence;
3. a verified learner-facing romanization;
4. an ElevenLabs Korean recording.

This prevents incomplete source data from entering the audio-first daily session or producing silent/broken practice cards.

## Implemented

- Added 542 deduplicated essential-word records.
- 45 of those headwords overlap with existing curated cards; the library therefore adds 497 new unique cards rather than duplicating them.
- Added deterministic romanization for library search and preview.
- Added source metadata and audio readiness metadata to `VocabularyCard`.
- Added the **Essential 600** library category.
- Kept audio-first Daily, Listening, Scenario, and Shadowing practice restricted to study-ready cards.
- Added an explicit **Audio pending** state in Browse Deck.
- Corrected several high-confidence curated romanization typos, including `재미있어요`, `화났어요`, and `뭐라고 했어요?`.
- Dashboard learning percentage now uses the reviewed, study-ready deck rather than counting pending inventory as learnable progress.

## Next content pass

The next safe batch should enrich the essential inventory in small reviewable groups of 25–50 words. Each group should be checked for naturalness, politeness, part of speech, example quality, and audio before becoming study-ready.

# Goyo

A Korean-language learning PWA. This glossary fixes the language of study
progress: how a learner's judgements of cards become scheduling, XP, and daily
goal progress.

## Language

**Grade**:
One learner judgement of one card in one practice mode; the unit that
scheduling, XP, and the daily goal are computed from.
_Avoid_: score, answer, attempt

**Rating**:
The judgement attached to a grade: again, good, or easy.
_Avoid_: mark, result, response

**Grade intent**:
What a grade is for in its practice mode: whether it advances the schedule,
earns XP, and counts toward the daily goal.
_Avoid_: grade options, grade flags, grade config

**Practice mode**:
The context a grade is given in, which determines the grade's intent.
_Avoid_: session type, exercise

**Dialog request**:
The single value naming the one dashboard dialog that is open, plus any
payload it needs; opening another replaces it rather than stacking.
_Avoid_: dialog flags, show booleans, active modal

**Dialog launcher**:
The seam that turns a dashboard entry point into one dialog request and back to
none; the dialog host maps that request to a lazily mounted dialog.
_Avoid_: modal manager, dialog store, show-state bundle

**Audio manifest**:
The parsed map from domain IDs — vocabulary cards, example sentences, and
Hangul characters — to content-hashed clip filenames; one fetch per page load
serves both playback and the offline download.
_Avoid_: audio config, clip registry, audio index shape

**Warm**:
To fetch one clip with `?warm=1` and store it in the offline audio cache under
its real URL, but only when the response is a 200 with an audio content type.
_Avoid_: preload, download, cache fill

**Study session**:
One run through a planned queue of cards, ending in a summary.
_Avoid_: study flow, review run, deck run

**Session queue**:
The ordered cards a study session works through; a failed card is appended once
and never reorders the rest.
_Avoid_: card list, plan, deck

**Grade lock**:
The guard that ignores a second grade between one card's grade and the next
card appearing.
_Avoid_: debounce, cooldown, click guard

**Session machine**:
The framework-free implementation that owns a study session's queue, card
index, locks, results, and restart, behind a small command interface.
_Avoid_: session store, session controller, session reducer

**Recognition practice**:
Listening and scenario practice; it confirms familiarity but never stretches a
card's schedule.
_Avoid_: passive practice, review mode

**Practice question**:
One prompt and its answer choices inside a practice mode.
_Avoid_: quiz item, exercise, card test

**Question loop**:
The framework-free implementation that owns a practice mode's prompt index,
selected choice, verdict, score, completion, and restart behind a small command
interface.
_Avoid_: question state, quiz store, practice reducer

**Distractor**:
A wrong answer choice drawn from another card; each practice mode decides its
own count, dedupe key, and tag preference.
_Avoid_: wrong answer, red herring, filler option

**Practice-only**:
Self-reported practice that is logged but never moves the schedule or progress.
_Avoid_: shadowing-only, no-count, unscored

**Repeat practice**:
Voluntary daily practice offered once the daily goal is met; its grades are
logged and earn half the rating's XP, so extra study still moves the level
while the daily goal stays the meaningful target.
_Avoid_: bonus round, extra practice

**Daily goal**:
The number of distinct cards a learner grades in a day, after which planned
daily work is done.
_Avoid_: target, quota

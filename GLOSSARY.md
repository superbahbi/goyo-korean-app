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

**Recognition practice**:
Listening and scenario practice; it confirms familiarity but never stretches a
card's schedule.
_Avoid_: passive practice, review mode

**Practice-only**:
Self-reported practice that is logged but never moves the schedule or progress.
_Avoid_: shadowing-only, no-count, unscored

**Repeat practice**:
Voluntary daily practice offered once the daily goal is met; its grades are
logged but earn no XP.
_Avoid_: bonus round, extra practice

**Daily goal**:
The number of distinct cards a learner grades in a day, after which planned
daily work is done.
_Avoid_: target, quota

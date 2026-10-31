import assert from "node:assert/strict";
import { scheduleRecall, scheduleReview } from "../client/src/lib/srs";

const firstGood = scheduleRecall(undefined, "good");
assert.equal(firstGood.interval, 2);
assert.equal(firstGood.consecutiveCorrect, 1);

const secondGood = scheduleRecall(
  { ...firstGood, timesReviewed: 1, timesCorrect: 1 },
  "good",
);
assert.ok(secondGood.interval > firstGood.interval);
assert.equal(secondGood.consecutiveCorrect, 2);

const easy = scheduleRecall(
  { ...secondGood, timesReviewed: 2, timesCorrect: 2 },
  "easy",
);
assert.ok(easy.interval > secondGood.interval);
assert.ok(easy.easeFactor > secondGood.easeFactor);

const fastGood = scheduleRecall(
  { ...secondGood, timesReviewed: 2, timesCorrect: 2 },
  "good",
  4000,
);
const slowGood = scheduleRecall(
  { ...secondGood, timesReviewed: 2, timesCorrect: 2 },
  "good",
  13000,
);
assert.ok(slowGood.interval < fastGood.interval);
assert.ok(slowGood.easeFactor < fastGood.easeFactor);

// A first-ever "again" is not a lapse and leaves ease untouched.
const firstAgain = scheduleRecall(undefined, "again");
assert.equal(firstAgain.interval, 1);
assert.equal(firstAgain.box, 0);
assert.equal(firstAgain.lapseCount, 0);
assert.equal(firstAgain.easeFactor, firstGood.easeFactor);
const afterFirstAgain = scheduleRecall(
  { ...firstAgain, timesReviewed: 1, timesCorrect: 0 },
  "good",
);
assert.equal(afterFirstAgain.interval, 2);

// A slow first review lowers ease but keeps the starting interval.
const slowFirst = scheduleRecall(undefined, "good", 13000);
assert.equal(slowFirst.interval, 2);
assert.ok(Math.abs(slowFirst.easeFactor - (firstGood.easeFactor - 0.1)) < 1e-9);

// Older saves with an interval but no timesReviewed are not brand new.
const legacy = scheduleRecall({ interval: 10, easeFactor: 2.5 }, "good");
assert.equal(legacy.interval, 25);
const legacyAgain = scheduleRecall({ interval: 10, easeFactor: 2.5 }, "again");
assert.equal(legacyAgain.lapseCount, 1);
assert.ok(legacyAgain.easeFactor < 2.5);

// Interval cap and ease clamps.
const capped = scheduleRecall(
  { interval: 360, timesReviewed: 9, timesCorrect: 9, easeFactor: 3.2, consecutiveCorrect: 9 },
  "easy",
);
assert.equal(capped.interval, 365);
assert.equal(capped.easeFactor, 3.2);
const floored = scheduleRecall(
  { interval: 5, timesReviewed: 9, timesCorrect: 5, easeFactor: 1.3, consecutiveCorrect: 2, lapseCount: 3 },
  "again",
);
assert.equal(floored.easeFactor, 1.3);

// Same-day repeats must not compound the schedule.
const today = "2026-10-30";
let repeated: Parameters<typeof scheduleReview>[0] = {
  interval: 2, box: 1, easeFactor: 2.35, consecutiveCorrect: 1,
  timesReviewed: 1, timesCorrect: 1, lastReviewDate: today,
};
for (let i = 0; i < 5; i++) {
  const result = scheduleReview(repeated, i % 2 ? "easy" : "good", today);
  assert.equal(result.advanced, false);
  assert.equal(result.schedule.interval, 2);
  assert.equal(result.schedule.easeFactor, 2.35);
  assert.equal(result.schedule.box, 1);
  assert.equal(result.schedule.consecutiveCorrect, 1);
  repeated = { ...repeated, ...result.schedule };
}
// The same card on a later day advances normally.
const nextDay = scheduleReview(repeated, "good", "2026-11-01");
assert.equal(nextDay.advanced, true);
assert.ok(nextDay.schedule.interval > 2);
// A same-day "again" records one lapse and returns tomorrow; repeats do not stack.
const sameDayLapse = scheduleReview(repeated, "again", today);
assert.equal(sameDayLapse.advanced, true);
assert.equal(sameDayLapse.schedule.interval, 1);
assert.equal(sameDayLapse.schedule.lapseCount, 1);
const lapsedState = { ...repeated, ...sameDayLapse.schedule };
const secondLapse = scheduleReview(lapsedState, "again", today);
assert.equal(secondLapse.advanced, false);
assert.equal(secondLapse.schedule.lapseCount, 1);
// A same-day "good" after a lapse does not undo the lapse.
const goodAfterLapse = scheduleReview(lapsedState, "good", today);
assert.equal(goodAfterLapse.advanced, false);
assert.equal(goodAfterLapse.schedule.interval, 1);

const lapse = scheduleRecall(
  { ...easy, timesReviewed: 3, timesCorrect: 3 },
  "again",
);
assert.equal(lapse.interval, 1);
assert.equal(lapse.consecutiveCorrect, 0);
assert.equal(lapse.lapseCount, 1);
assert.ok(lapse.easeFactor < easy.easeFactor);

const recovered = scheduleRecall(
  { ...lapse, timesReviewed: 4, timesCorrect: 3 },
  "good",
);
assert.equal(recovered.interval, 2);
assert.equal(recovered.lapseCount, 1);

console.log("SRS regression checks passed");

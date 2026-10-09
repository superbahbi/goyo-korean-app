import assert from "node:assert/strict";
import { scheduleRecall } from "../client/src/lib/srs";

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

import { describe, it, expect } from "vitest";
import { scheduleRecall, scheduleReview } from "../client/src/lib/srs";

describe("SRS scheduling", () => {
  const firstGood = scheduleRecall(undefined, "good");
  const secondGood = scheduleRecall(
    { ...firstGood, timesReviewed: 1, timesCorrect: 1 },
    "good"
  );
  const easy = scheduleRecall(
    { ...secondGood, timesReviewed: 2, timesCorrect: 2 },
    "easy"
  );
  const fastGood = scheduleRecall(
    { ...secondGood, timesReviewed: 2, timesCorrect: 2 },
    "good",
    4000
  );
  const slowGood = scheduleRecall(
    { ...secondGood, timesReviewed: 2, timesCorrect: 2 },
    "good",
    13000
  );

  it("starts a new card at a 2-day interval on a good review", () => {
    expect(firstGood.interval).toBe(2);
    expect(firstGood.consecutiveCorrect).toBe(1);
  });

  it("grows the interval and consecutive count on repeated good reviews", () => {
    expect(secondGood.interval).toBeGreaterThan(firstGood.interval);
    expect(secondGood.consecutiveCorrect).toBe(2);
  });

  it("grows interval and ease further on an easy review", () => {
    expect(easy.interval).toBeGreaterThan(secondGood.interval);
    expect(easy.easeFactor).toBeGreaterThan(secondGood.easeFactor);
  });

  it("adjusts ease by response time", () => {
    expect(slowGood.interval).toBeLessThan(fastGood.interval);
    expect(slowGood.easeFactor).toBeLessThan(fastGood.easeFactor);
  });

  it("treats a first-ever again as a non-lapse that leaves ease untouched", () => {
    const firstAgain = scheduleRecall(undefined, "again");
    expect(firstAgain.interval).toBe(1);
    expect(firstAgain.lapseCount).toBe(0);
    expect(firstAgain.easeFactor).toBe(firstGood.easeFactor);
    const afterFirstAgain = scheduleRecall(
      { ...firstAgain, timesReviewed: 1, timesCorrect: 0 },
      "good"
    );
    expect(afterFirstAgain.interval).toBe(2);
  });

  it("lowers ease on a slow first review but keeps the starting interval", () => {
    const slowFirst = scheduleRecall(undefined, "good", 13000);
    expect(slowFirst.interval).toBe(2);
    expect(
      Math.abs(slowFirst.easeFactor - (firstGood.easeFactor - 0.1))
    ).toBeLessThan(1e-9);
  });

  it("does not treat legacy saves with an interval but no timesReviewed as brand new", () => {
    const legacy = scheduleRecall({ interval: 10, easeFactor: 2.5 }, "good");
    expect(legacy.interval).toBe(25);
    const legacyAgain = scheduleRecall(
      { interval: 10, easeFactor: 2.5 },
      "again"
    );
    expect(legacyAgain.lapseCount).toBe(1);
    expect(legacyAgain.easeFactor).toBeLessThan(2.5);
  });

  it("caps the interval at 90 days and clamps ease", () => {
    const capped = scheduleRecall(
      {
        interval: 360,
        timesReviewed: 9,
        timesCorrect: 9,
        easeFactor: 3.2,
        consecutiveCorrect: 9,
      },
      "easy"
    );
    expect(capped.interval).toBe(90);
    expect(capped.easeFactor).toBe(3.2);
    const floored = scheduleRecall(
      {
        interval: 5,
        timesReviewed: 9,
        timesCorrect: 5,
        easeFactor: 1.3,
        consecutiveCorrect: 2,
        lapseCount: 3,
      },
      "again"
    );
    expect(floored.easeFactor).toBe(1.3);
  });

  it("does not compound the schedule on same-day repeats", () => {
    const today = "2026-10-30";
    let repeated: Parameters<typeof scheduleReview>[0] = {
      interval: 2,
      easeFactor: 2.35,
      consecutiveCorrect: 1,
      timesReviewed: 1,
      timesCorrect: 1,
      lastReviewDate: today,
    };
    for (let i = 0; i < 5; i++) {
      const result = scheduleReview(repeated, i % 2 ? "easy" : "good", today);
      expect(result.advanced).toBe(false);
      expect(result.schedule.interval).toBe(2);
      expect(result.schedule.easeFactor).toBe(2.35);
      expect(result.schedule.consecutiveCorrect).toBe(1);
      repeated = { ...repeated, ...result.schedule };
    }

    const nextDay = scheduleReview(repeated, "good", "2026-11-01");
    expect(nextDay.advanced).toBe(true);
    expect(nextDay.schedule.interval).toBeGreaterThan(2);

    const sameDayLapse = scheduleReview(repeated, "again", today);
    expect(sameDayLapse.advanced).toBe(true);
    expect(sameDayLapse.schedule.interval).toBe(1);
    expect(sameDayLapse.schedule.lapseCount).toBe(1);
    const lapsedState = { ...repeated, ...sameDayLapse.schedule };
    const secondLapse = scheduleReview(lapsedState, "again", today);
    expect(secondLapse.advanced).toBe(false);
    expect(secondLapse.schedule.lapseCount).toBe(1);

    const goodAfterLapse = scheduleReview(lapsedState, "good", today);
    expect(goodAfterLapse.advanced).toBe(false);
    expect(goodAfterLapse.schedule.interval).toBe(1);
  });

  it("caps recognition reviews so they never stretch an interval", () => {
    const firstRecognition = scheduleReview(
      undefined,
      "easy",
      "2026-10-31",
      undefined,
      { recognition: true }
    );
    expect(firstRecognition.advanced).toBe(true);
    expect(firstRecognition.schedule.interval).toBe(2);
    expect(firstRecognition.schedule.consecutiveCorrect).toBe(0);

    const mature = {
      interval: 12,
      easeFactor: 2.5,
      consecutiveCorrect: 3,
      timesReviewed: 4,
      timesCorrect: 4,
      lastReviewDate: "2026-10-29",
    };
    const reviewed = scheduleReview(mature, "good", "2026-10-31", undefined, {
      recognition: true,
    });
    expect(reviewed.advanced).toBe(true);
    expect(reviewed.schedule.interval).toBe(12);
    expect(reviewed.schedule.easeFactor).toBe(2.5);
    expect(reviewed.schedule.consecutiveCorrect).toBe(3);

    const recalled = scheduleReview(mature, "good", "2026-10-31");
    expect(recalled.schedule.interval).toBeGreaterThan(12);
  });

  it("still records a lapse during recognition review", () => {
    const lapse = scheduleReview(
      {
        interval: 12,
        easeFactor: 2.5,
        consecutiveCorrect: 3,
        timesReviewed: 4,
        timesCorrect: 4,
        lastReviewDate: "2026-10-29",
      },
      "again",
      "2026-10-31",
      undefined,
      { recognition: true }
    );
    expect(lapse.advanced).toBe(true);
    expect(lapse.schedule.interval).toBe(1);
    expect(lapse.schedule.lapseCount).toBe(1);
  });

  it("records a lapse on again and recovers on a later good review", () => {
    const lapse = scheduleRecall(
      { ...easy, timesReviewed: 3, timesCorrect: 3 },
      "again"
    );
    expect(lapse.interval).toBe(1);
    expect(lapse.consecutiveCorrect).toBe(0);
    expect(lapse.lapseCount).toBe(1);
    expect(lapse.easeFactor).toBeLessThan(easy.easeFactor);

    const recovered = scheduleRecall(
      { ...lapse, timesReviewed: 4, timesCorrect: 3 },
      "good"
    );
    expect(recovered.interval).toBe(2);
    expect(recovered.lapseCount).toBe(1);
  });
});

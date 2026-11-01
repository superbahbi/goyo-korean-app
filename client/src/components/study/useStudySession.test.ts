import { describe, expect, it } from "vitest";
import type { CardState } from "@/lib/mastery";
import {
  acknowledgeNewCardIntro,
  shouldShowNewCardIntro,
} from "./useStudySession";

const reviewed: CardState = {
  id: "surv_001",
  due: "2026-11-02",
  interval: 2,
  timesReviewed: 1,
  timesCorrect: 1,
  lastReviewDate: "2026-11-01",
};

describe("new card introduction", () => {
  it("appears only for cards with no saved state", () => {
    expect(shouldShowNewCardIntro("surv_001", {}, new Set())).toBe(true);
    expect(shouldShowNewCardIntro("surv_001", undefined, new Set())).toBe(true);
    expect(
      shouldShowNewCardIntro("surv_001", { surv_001: reviewed }, new Set())
    ).toBe(false);
  });

  it("does not repeat for a word already introduced, such as an again retry", () => {
    const introduced = acknowledgeNewCardIntro(new Set(), "surv_001");
    expect(shouldShowNewCardIntro("surv_001", {}, introduced)).toBe(false);
    expect(shouldShowNewCardIntro("surv_002", {}, introduced)).toBe(true);
  });

  it("advancing the intro creates no card state", () => {
    const cardStates: Record<string, CardState> = {};

    // The only transition the intro owns is marking the word as seen. It has no
    // grade callback, so nothing can reach onGrade or the saved progress.
    const introduced = acknowledgeNewCardIntro(new Set(), "surv_001");

    expect(introduced.has("surv_001")).toBe(true);
    expect(cardStates).toEqual({});
    expect(shouldShowNewCardIntro("surv_001", cardStates, introduced)).toBe(
      false
    );
  });
});

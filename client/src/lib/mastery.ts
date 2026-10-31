export interface CardState {
  id: string;
  due: string;
  interval: number;
  timesReviewed: number;
  timesCorrect: number;
  lastReviewDate: string;
  easeFactor?: number;
  consecutiveCorrect?: number;
  lapseCount?: number;
  lastResponseTimeMs?: number;
}

export type MasteryState = "new" | "learning" | "shaky" | "known";

export function getMasteryState(cardState?: CardState): MasteryState {
  if (!cardState || cardState.timesReviewed === 0) return "new";
  const accuracy = cardState.timesCorrect / cardState.timesReviewed;
  const consecutiveCorrect = cardState.consecutiveCorrect ?? Math.min(2, cardState.timesCorrect);
  if (cardState.timesReviewed < 2 || accuracy < 0.5) return "learning";
  if (cardState.timesReviewed < 3 || accuracy < 0.75 || cardState.interval < 7 || consecutiveCorrect < 2) return "shaky";
  return "known";
}

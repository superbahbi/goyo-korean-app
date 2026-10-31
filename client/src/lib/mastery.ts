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

export const MASTERY_LABELS: Record<MasteryState, string> = {
  new: "New",
  learning: "Learning",
  shaky: "Shaky",
  known: "Known",
};

export const MASTERY_STYLES: Record<MasteryState, string> = {
  new: "bg-slate-100 text-slate-600",
  learning: "bg-blue-100 text-blue-700",
  shaky: "bg-amber-100 text-amber-700",
  known: "bg-emerald-100 text-emerald-700",
};

export function getMasteryState(cardState?: CardState): MasteryState {
  if (!cardState || cardState.timesReviewed === 0) return "new";
  const accuracy = cardState.timesCorrect / cardState.timesReviewed;
  const consecutiveCorrect =
    cardState.consecutiveCorrect ?? Math.min(2, cardState.timesCorrect);
  if (cardState.timesReviewed < 2 || accuracy < 0.5) return "learning";
  if (
    cardState.timesReviewed < 3 ||
    accuracy < 0.75 ||
    cardState.interval < 7 ||
    consecutiveCorrect < 2
  )
    return "shaky";
  return "known";
}

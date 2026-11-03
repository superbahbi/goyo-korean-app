import {
  getMasteryState,
  type CardState,
  type MasteryState,
} from "@/lib/mastery";
import { CATEGORIES, type VocabularyCard } from "@/lib/vocabulary";

/**
 * Derived statistics for the dashboard and its Stats dialog: per-category
 * coverage and accuracy, whole-deck review accuracy, and mastery counts. Pure
 * aggregation over the deck and saved card states.
 */

/** The one category shape shared by the theme grid and the stats dialog. */
export interface CategorySummary {
  id: string;
  name: string;
  icon: string;
  color: string;
  reviewed: number;
  total: number;
  accuracy: number | null;
  known: number;
  coverage: number;
}

export interface ReviewStats {
  totalReviews: number;
  overallAccuracy: number;
  medianResponseTime: number | null;
}

export interface DashboardStats {
  masteryCounts: Record<MasteryState, number>;
  reviewStats: ReviewStats;
  categories: CategorySummary[];
}

function buildCategories(
  vocabulary: VocabularyCard[],
  cardStates: Record<string, CardState>
): CategorySummary[] {
  return CATEGORIES.map(category => {
    const cards = vocabulary.filter(card => card.tag === category.id);
    const reviewed = cards.filter(card =>
      Boolean(cardStates?.[card.id]?.timesReviewed)
    );
    const reviews = reviewed.reduce(
      (sum, card) => sum + (cardStates?.[card.id]?.timesReviewed ?? 0),
      0
    );
    const correct = reviewed.reduce(
      (sum, card) => sum + (cardStates?.[card.id]?.timesCorrect ?? 0),
      0
    );
    const known = cards.filter(
      card => getMasteryState(cardStates?.[card.id]) === "known"
    ).length;
    return {
      ...category,
      reviewed: reviewed.length,
      total: cards.length,
      accuracy: reviews > 0 ? Math.round((correct / reviews) * 100) : null,
      known,
      coverage: cards.length > 0 ? Math.round((known / cards.length) * 100) : 0,
    };
  });
}

function buildReviewStats(
  vocabulary: VocabularyCard[],
  cardStates: Record<string, CardState>
): ReviewStats {
  const reviewedCards = vocabulary.filter(card =>
    Boolean(cardStates[card.id]?.timesReviewed)
  );
  const totalReviews = reviewedCards.reduce(
    (sum, card) => sum + (cardStates[card.id]?.timesReviewed ?? 0),
    0
  );
  const totalCorrect = reviewedCards.reduce(
    (sum, card) => sum + (cardStates[card.id]?.timesCorrect ?? 0),
    0
  );
  const responseTimes = reviewedCards
    .map(card => cardStates[card.id]?.lastResponseTimeMs)
    .filter((time): time is number => typeof time === "number" && time > 0)
    .sort((a, b) => a - b);
  return {
    totalReviews,
    overallAccuracy:
      totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0,
    medianResponseTime:
      responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length / 2)]
        : null,
  };
}

export function buildDashboardStats(
  vocabulary: VocabularyCard[],
  cardStates: Record<string, CardState>
): DashboardStats {
  const masteryCounts = vocabulary.reduce<Record<MasteryState, number>>(
    (counts, card) => {
      counts[getMasteryState(cardStates?.[card.id])] += 1;
      return counts;
    },
    { new: 0, learning: 0, shaky: 0, known: 0 }
  );

  return {
    masteryCounts,
    reviewStats: buildReviewStats(vocabulary, cardStates),
    categories: buildCategories(vocabulary, cardStates),
  };
}

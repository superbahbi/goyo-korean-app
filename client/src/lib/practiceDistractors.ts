import { shuffle } from "@/lib/shuffle";
import type { VocabularyCard } from "@/lib/vocabulary";

/**
 * Build the wrong choices beside a practice question.
 *
 * The rules that differ by mode stay options rather than being flattened:
 * listening dedupes by meaning and takes three, while scenarios dedupe by the
 * Korean phrase, prefer survival cards, and take two. A caller that needs fewer
 * than `count` distinct candidates gets a shorter list; padding with a
 * duplicate would make two buttons read the same.
 */
export interface PickDistractorsOptions {
  /** How many wrong options the question needs. */
  count: number;
  /** The correct card's id; it never appears among its own distractors. */
  correctCardId: string;
  /** Two cards answer the same way when their keys match. */
  dedupeKey: (card: VocabularyCard) => string;
  /** Cards carrying this tag are offered before the rest. */
  preferTag?: string;
  /** Injected by tests; production uses the Fisher–Yates shuffle. */
  shuffleCards?: (cards: readonly VocabularyCard[]) => VocabularyCard[];
}

export function pickDistractors(
  cards: readonly VocabularyCard[],
  {
    count,
    correctCardId,
    dedupeKey,
    preferTag,
    shuffleCards = shuffle,
  }: PickDistractorsOptions
): VocabularyCard[] {
  if (count <= 0) return [];

  const pool = shuffleCards(cards.filter(card => card.id !== correctCardId));
  const ordered = preferTag
    ? [
        ...pool.filter(card => card.tag === preferTag),
        ...pool.filter(card => card.tag !== preferTag),
      ]
    : pool;

  const correctCard = cards.find(card => card.id === correctCardId);
  const seen = new Set(correctCard ? [dedupeKey(correctCard)] : []);
  const distractors: VocabularyCard[] = [];

  for (const card of ordered) {
    const key = dedupeKey(card);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(card);
    if (distractors.length === count) break;
  }

  return distractors;
}

/**
 * Fisher–Yates shuffle. Returns a new array so callers never reorder their
 * own data, and every permutation is equally likely (unlike
 * `sort(() => Math.random() - 0.5)`).
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = result[index];
    result[index] = result[swapIndex];
    result[swapIndex] = current;
  }
  return result;
}

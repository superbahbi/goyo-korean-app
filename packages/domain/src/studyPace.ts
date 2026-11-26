/**
 * The study-pace choices both surfaces offer. One list keeps the web Select
 * and the /mobile chips in step, so a pace chosen on one surface shows as
 * selected on the other.
 */
export const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 30] as const;
export const NEW_CARDS_PER_DAY_OPTIONS = [1, 2, 3, 5, 8, 10] as const;

/**
 * The options to show for a saved value, ascending. A save can hold any
 * sanitized number (an import, an older build), so the current value is
 * always offered instead of leaving nothing selected.
 */
export function paceOptions(
  options: readonly number[],
  current: number
): number[] {
  const values = new Set(options);
  if (Number.isFinite(current)) values.add(current);
  return Array.from(values).sort((a, b) => a - b);
}

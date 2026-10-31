/**
 * Level math lives here so saved-state parsing, grading, and the dashboard all
 * derive a level from XP the same way.
 */

export const LEVEL_TITLES = [
  "Beginner",
  "Explorer",
  "Builder",
  "Conversational",
  "Fluent",
  "Korean Sage",
] as const;

/** Level 1 starts at 0 XP; each level costs the square of its number × 100. */
export function levelFromXp(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

/** Total XP required to reach the start of `level`. */
export function xpToReachLevel(level: number): number {
  return Math.pow(Math.max(0, level - 1), 2) * 100;
}

/** Title for a level, clamped so edited saves cannot index past the list. */
export function levelTitle(level: number): string {
  return LEVEL_TITLES[
    Math.min(LEVEL_TITLES.length - 1, Math.max(0, level - 1))
  ];
}

/** Progress through the current level as a 0–100 percentage. */
export function levelProgress(totalXp: number, level: number): number {
  const currentLevelXp = xpToReachLevel(level);
  const nextLevelXp = xpToReachLevel(level + 1);
  if (nextLevelXp <= currentLevelXp) return 100;
  return Math.min(
    100,
    Math.max(
      0,
      ((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    )
  );
}

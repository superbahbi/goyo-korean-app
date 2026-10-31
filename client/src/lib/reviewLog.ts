import type { SrsRating } from "@/lib/srs";

export const REVIEW_LOG_SCHEMA_VERSION = 1;
// Five thousand grades is roughly a year of steady daily use. The log is for
// analysis only, so dropping the oldest entries loses nothing the app needs.
export const REVIEW_LOG_LIMIT = 5000;

export const STUDY_MODES = [
  "daily",
  "weak",
  "learning",
  "listening",
  "scenario",
  "shadowing",
] as const;
export type StudyMode = (typeof STUDY_MODES)[number];

export interface ReviewLogEntry {
  cardId: string;
  /** ISO 8601 timestamp of the grade. */
  at: string;
  rating: SrsRating;
  responseTimeMs: number | null;
  mode: StudyMode;
}

export interface ReviewLog {
  schemaVersion: number;
  /** Oldest first. */
  entries: ReviewLogEntry[];
}

const RATINGS: readonly SrsRating[] = ["again", "good", "easy"];

function isStudyMode(value: unknown): value is StudyMode {
  return (
    typeof value === "string" &&
    (STUDY_MODES as readonly string[]).includes(value)
  );
}

function isRating(value: unknown): value is SrsRating {
  return (
    typeof value === "string" && (RATINGS as readonly string[]).includes(value)
  );
}

export function createReviewLog(): ReviewLog {
  return { schemaVersion: REVIEW_LOG_SCHEMA_VERSION, entries: [] };
}

/** Append one grade, dropping the oldest entries past the cap. */
export function appendReviewEntry(
  log: ReviewLog,
  entry: ReviewLogEntry
): ReviewLog {
  const entries = [...log.entries, entry];
  return {
    schemaVersion: REVIEW_LOG_SCHEMA_VERSION,
    entries:
      entries.length > REVIEW_LOG_LIMIT
        ? entries.slice(entries.length - REVIEW_LOG_LIMIT)
        : entries,
  };
}

function sanitizeEntry(value: unknown): ReviewLogEntry | null {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  const record = value as Record<string, unknown>;

  if (typeof record.cardId !== "string" || record.cardId.length === 0)
    return null;
  if (typeof record.at !== "string" || Number.isNaN(Date.parse(record.at)))
    return null;
  if (!isRating(record.rating)) return null;

  const responseTimeMs =
    typeof record.responseTimeMs === "number" &&
    Number.isFinite(record.responseTimeMs) &&
    record.responseTimeMs >= 0
      ? record.responseTimeMs
      : null;

  // An unknown mode comes from a newer app; keep the grade rather than drop it.
  const mode = isStudyMode(record.mode) ? record.mode : "daily";

  return {
    cardId: record.cardId,
    at: record.at,
    rating: record.rating,
    responseTimeMs,
    mode,
  };
}

/** Accept only well-formed entries and enforce the cap on imported logs. */
export function sanitizeReviewLog(value: unknown): ReviewLog {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return createReviewLog();
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.entries)) return createReviewLog();

  const entries = record.entries
    .map(sanitizeEntry)
    .filter((entry): entry is ReviewLogEntry => entry !== null)
    .slice(-REVIEW_LOG_LIMIT);

  return { schemaVersion: REVIEW_LOG_SCHEMA_VERSION, entries };
}

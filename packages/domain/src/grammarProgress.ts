/**
 * Grammar progress lives in the same save as vocabulary progress, so one JSON
 * export moves both. Kept free of lesson content so the dashboard's main chunk
 * does not import the whole course.
 */

export interface GrammarScore {
  correct: number;
  total: number;
}

export interface GrammarProgress {
  completedLessonIds: string[];
  /** Best result per lesson; a retake only replaces a worse score. */
  scores: Record<string, GrammarScore>;
  lastLessonId?: string;
}

const MAX_LESSONS = 100;
const MAX_ID_LENGTH = 80;
const MAX_QUESTIONS = 100;

export function emptyGrammarProgress(): GrammarProgress {
  return { completedLessonIds: [], scores: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_ID_LENGTH
  );
}

export function sanitizeGrammarProgress(value: unknown): GrammarProgress {
  const progress = emptyGrammarProgress();
  if (!isRecord(value)) return progress;

  if (Array.isArray(value.completedLessonIds)) {
    for (const id of value.completedLessonIds) {
      if (!validId(id) || progress.completedLessonIds.includes(id)) continue;
      progress.completedLessonIds.push(id);
      if (progress.completedLessonIds.length >= MAX_LESSONS) break;
    }
  }

  if (isRecord(value.scores)) {
    for (const [id, score] of Object.entries(value.scores)) {
      if (!validId(id) || !isRecord(score)) continue;
      const { correct, total } = score;
      if (
        typeof correct !== "number" ||
        typeof total !== "number" ||
        !Number.isInteger(correct) ||
        !Number.isInteger(total) ||
        correct < 0 ||
        total < 1 ||
        correct > total ||
        total > MAX_QUESTIONS
      ) {
        continue;
      }
      progress.scores[id] = { correct, total };
      if (Object.keys(progress.scores).length >= MAX_LESSONS) break;
    }
  }

  if (validId(value.lastLessonId)) progress.lastLessonId = value.lastLessonId;
  return progress;
}

/**
 * Records a finished lesson: completion is permanent, and a retake replaces the
 * score only when it is better.
 */
export function recordGrammarAttempt(
  progress: GrammarProgress,
  lessonId: string,
  correct: number,
  total: number
): GrammarProgress {
  const safeTotal = Math.max(1, Math.round(total));
  const safeCorrect = Math.min(safeTotal, Math.max(0, Math.round(correct)));
  const previous = progress.scores[lessonId];
  const best =
    previous && previous.correct >= safeCorrect
      ? previous
      : { correct: safeCorrect, total: safeTotal };

  return {
    completedLessonIds: progress.completedLessonIds.includes(lessonId)
      ? progress.completedLessonIds
      : [...progress.completedLessonIds, lessonId],
    scores: { ...progress.scores, [lessonId]: best },
    lastLessonId: lessonId,
  };
}

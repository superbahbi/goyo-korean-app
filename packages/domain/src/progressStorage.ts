import { getLocalDateKey } from "@domain/day";

/**
 * The one localStorage key for saved progress. The app and its reset paths read
 * the same constant, so a rename cannot leave one path writing or clearing a
 * different save.
 */
export const PROGRESS_STORAGE_KEY = "goyo-progress-v2";

/** Erase this device's saved progress. Throws when localStorage is unavailable. */
export function clearProgress(): void {
  localStorage.removeItem(PROGRESS_STORAGE_KEY);
}

/** File name for a raw save backup, dated by the learner's local day. */
export function progressBackupFileName(date = new Date()): string {
  return `goyo-progress-backup-${getLocalDateKey(date)}.json`;
}

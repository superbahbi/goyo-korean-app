import { useState, useEffect, useCallback, useRef } from "react";
import {
  applyGradeOutcome,
  type GradeOptions,
  type GradeOutcome,
} from "@/lib/gradeOutcome";
import { requestPersistentStorage } from "@/lib/storageProtection";
import { PROGRESS_STORAGE_KEY } from "@/lib/progressStorage";
import {
  isNewerSave,
  loadSavedState,
  parseSavedState,
  type LoadedSave,
  type UserSettings,
  type UserState,
} from "@/lib/savedState";
import { recordGrammarAttempt } from "@/lib/grammarProgress";

function readStoredSave(): LoadedSave {
  try {
    return loadSavedState(localStorage.getItem(PROGRESS_STORAGE_KEY));
  } catch (error) {
    console.error("Failed to load saved progress, starting fresh:", error);
    return loadSavedState(null);
  }
}

/**
 * The React adapter over `lib/savedState`: it owns the localStorage read/write,
 * cross-tab storage events, and the setter callbacks. The save format itself
 * lives in the lib module, so it is tested without a browser.
 */
export function useStudyState() {
  // Read the save during the first render so the dashboard never flashes blank
  // while an effect catches up.
  const [initialLoad] = useState(readStoredSave);
  const [state, setState] = useState<UserState>(initialLoad.state);
  // A newer save is never rewritten, so this tab's changes stay in memory only.
  const [saveBlocked, setSaveBlocked] = useState(
    initialLoad.blockedByNewerVersion
  );
  const [saveError, setSaveError] = useState(false);
  // gradeCard computes the next saved state synchronously so it can hand the
  // grade's outcome back to the caller. The ref keeps that read on the state the
  // last grade produced, even before React has re-rendered.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Another tab wrote progress: adopt it instead of overwriting it later.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PROGRESS_STORAGE_KEY) return;
      if (isNewerSave(event.newValue)) {
        // Another build upgraded the save: do not adopt (or sanitize) it.
        setSaveBlocked(true);
        return;
      }
      setSaveBlocked(false);
      setState(parseSavedState(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (saveBlocked) return;
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
      setSaveError(false);
    } catch (error) {
      console.error("Failed to save progress:", error);
      setSaveError(true);
    }
  }, [state, saveBlocked]);

  const gradeCard = useCallback(
    (
      cardId: string,
      rating: "again" | "good" | "easy",
      options?: GradeOptions
    ): GradeOutcome => {
      // Persist storage is granted per origin and cannot be requested repeatedly
      // for effect; ask on the first real use, not on first paint.
      void requestPersistentStorage();

      const result = applyGradeOutcome(
        stateRef.current,
        cardId,
        rating,
        options
      );
      // Two grades in one tick must build on the first, not on stale state.
      stateRef.current = result.state;
      setState(result.state);
      return result.outcome;
    },
    []
  );

  const updateSettings = useCallback((settings: Partial<UserSettings>) => {
    setState(current => ({
      ...current,
      settings: { ...current.settings, ...settings },
    }));
  }, []);

  const recordGrammarResult = useCallback(
    (lessonId: string, correct: number, total: number) => {
      setState(current => ({
        ...current,
        grammar: recordGrammarAttempt(
          current.grammar,
          lessonId,
          correct,
          total
        ),
      }));
    },
    []
  );

  const replaceState = useCallback((next: UserState) => {
    setState(next);
  }, []);

  return {
    state,
    gradeCard,
    updateSettings,
    recordGrammarResult,
    replaceState,
    saveBlocked,
    saveError,
  };
}

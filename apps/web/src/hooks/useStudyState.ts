import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { GradeOptions, GradeOutcome } from "@domain/gradeOutcome";
import { requestPersistentStorage } from "@domain/storageProtection";
import { PROGRESS_STORAGE_KEY } from "@domain/progressStorage";
import type { UserState } from "@domain/savedState";
import {
  createCrossPlatformProgressStore,
  type CrossPlatformProgressStore,
} from "@shared/storage";

interface StudyStateSnapshot {
  state: UserState;
  saveBlocked: boolean;
  saveError: boolean;
}

/**
 * One immutable snapshot of the store, rebuilt only when the state or a flag
 * changed, so `useSyncExternalStore` re-renders on a real transition and a
 * newer-save block or a failed write reaches the alerts even when the state
 * itself did not change.
 */
function useStoreSnapshot(
  store: CrossPlatformProgressStore
): StudyStateSnapshot {
  const cached = useRef<StudyStateSnapshot | null>(null);
  const getSnapshot = useCallback(() => {
    const state = store.getState();
    const saveBlocked = store.isSaveBlocked();
    const saveError = store.hasSaveError();
    const previous = cached.current;
    if (
      previous &&
      previous.state === state &&
      previous.saveBlocked === saveBlocked &&
      previous.saveError === saveError
    ) {
      return previous;
    }
    const next = { state, saveBlocked, saveError };
    cached.current = next;
    return next;
  }, [store]);
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

/**
 * The React adapter over the shared progress store (`@shared/storage`), the
 * same store `/mobile` runs on. The store owns the localStorage read and write,
 * the newer-save guard before every write and the error flag; this hook
 * subscribes, adopts other tabs' writes and asks for persistent storage on the
 * first grade.
 *
 * Nothing is written until the learner changes something, so a visit that
 * never studies leaves no save behind.
 */
export function useStudyState() {
  // localStorage is synchronous, so the store has read the save before the
  // first render: the dashboard never flashes blank while an effect catches up.
  const [store] = useState(() => createCrossPlatformProgressStore());
  const { state, saveBlocked, saveError } = useStoreSnapshot(store);

  // Another tab wrote or reset progress: adopt it instead of overwriting it
  // later. A newer build's save blocks this tab's writes instead.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PROGRESS_STORAGE_KEY) return;
      store.adoptStoredSave(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [store]);

  const gradeCard = useCallback(
    (
      cardId: string,
      rating: "again" | "good" | "easy",
      options?: GradeOptions
    ): GradeOutcome => {
      // Persist storage is granted per origin and cannot be requested repeatedly
      // for effect; ask on the first real use, not on first paint.
      void requestPersistentStorage();
      // The store updates synchronously, so two grades in one tick build on
      // each other rather than on a stale render.
      return store.gradeCard(cardId, rating, options);
    },
    [store]
  );

  return {
    state,
    gradeCard,
    updateSettings: store.updateSettings,
    recordGrammarResult: store.recordGrammarResult,
    replaceState: store.replaceState,
    resetProgress: store.resetProgress,
    saveBlocked,
    saveError,
  };
}

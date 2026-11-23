/**
 * Cross-platform progress storage.
 *
 * The web app reads and writes `localStorage` synchronously; React Native has
 * `AsyncStorage`, whose reads and writes are promises. Everything above this
 * file works with one `UserState`, so this adapter owns the raw string, the
 * newer-save guard, and the error flag exactly once.
 *
 * No platform storage is a hard dependency: pass any storage that satisfies
 * `SyncOrAsyncStorage` (localStorage, AsyncStorage, a test double) to
 * `createCrossPlatformProgressStore`.
 */

import {
  applyGradeOutcome,
  type GradeOptions,
  type GradeOutcome,
} from "../../packages/domain/src/gradeOutcome";
import { recordGrammarAttempt } from "../../packages/domain/src/grammarProgress";
import { PROGRESS_STORAGE_KEY } from "../../packages/domain/src/progressStorage";
import {
  isNewerSave,
  loadSavedState,
  parseSavedState,
  type UserSettings,
  type UserState,
} from "../../packages/domain/src/savedState";

/**
 * The storage surface the progress store needs. A synchronous implementation
 * may return values directly; an asynchronous one (React Native's
 * AsyncStorage) returns promises for all three methods.
 */
export interface SyncOrAsyncStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

/** An in-memory storage with the same contract as localStorage. */
export function createMemoryStorage(): SyncOrAsyncStorage {
  const values = new Map<string, string>();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: key => {
      values.delete(key);
    },
  };
}

let fallbackStorage: SyncOrAsyncStorage | null = null;

function browserLocalStorage(): Storage | null {
  try {
    const candidate = (globalThis as { localStorage?: Storage }).localStorage;
    if (
      !candidate ||
      typeof candidate.getItem !== "function" ||
      typeof candidate.setItem !== "function" ||
      typeof candidate.removeItem !== "function"
    ) {
      return null;
    }
    return candidate;
  } catch {
    // Access can throw in a privacy-restricted browser context.
    return null;
  }
}

/**
 * The best storage this runtime offers: `localStorage` on the web, otherwise
 * one shared memory instance. React Native callers should pass AsyncStorage to
 * `createCrossPlatformProgressStore` instead.
 */
export function getDefaultStorage(): SyncOrAsyncStorage {
  const local = browserLocalStorage();
  if (local) {
    return {
      getItem: key => local.getItem(key),
      setItem: (key, value) => local.setItem(key, value),
      removeItem: key => local.removeItem(key),
    };
  }
  if (!fallbackStorage) fallbackStorage = createMemoryStorage();
  return fallbackStorage;
}

export interface CrossPlatformProgressStore {
  getState(): UserState;
  /** A newer app build owns the stored save; do not overwrite it. */
  isSaveBlocked(): boolean;
  /** The last read or write failed (quota, privacy mode, storage unavailable). */
  hasSaveError(): boolean;
  subscribe(listener: () => void): () => void;
  /** Loads async storage and returns the state the app should run on. */
  hydrate(): Promise<UserState>;
  gradeCard(
    cardId: string,
    rating: "again" | "good" | "easy",
    options?: GradeOptions
  ): GradeOutcome;
  updateSettings(partial: Partial<UserSettings>): void;
  recordGrammarResult(lessonId: string, correct: number, total: number): void;
  replaceState(next: UserState): void;
  resetProgress(): Promise<void>;
  /** Resolves once every write already issued has settled. */
  flush(): Promise<void>;
}

function defaultState(): UserState {
  return parseSavedState(null);
}

/**
 * One saved-progress store over a platform storage.
 *
 * The store keeps the current state in memory, writes whenever a mutation
 * succeeds, and exposes the save errors and newer-save block as flags so the
 * UI can warn without every caller re-checking storage.
 */
export function createCrossPlatformProgressStore(
  storage: SyncOrAsyncStorage = getDefaultStorage()
): CrossPlatformProgressStore {
  let state = defaultState();
  let blocked = false;
  let saveError = false;
  let hydrated = false;
  let revision = 0;
  let readIsAsync = false;

  let initialRead: Promise<string | null> | null = null;
  const pendingWrites = new Set<Promise<void>>();
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of Array.from(listeners)) {
      try {
        listener();
      } catch {
        // A failing subscriber must not break the store or other subscribers.
      }
    }
  };

  const applyLoaded = (raw: string | null) => {
    const loaded = loadSavedState(raw);
    state = loaded.state;
    blocked = loaded.blockedByNewerVersion;
  };

  const readStoredRaw = (): string | null | undefined => {
    try {
      const value = storage.getItem(PROGRESS_STORAGE_KEY);
      if (isPromiseLike<string | null>(value)) {
        // Async storage cannot be checked synchronously; make sure a rejected
        // probe never surfaces as an unhandled rejection.
        void Promise.resolve(value).catch(() => {
          saveError = true;
        });
        return undefined;
      }
      return value;
    } catch {
      saveError = true;
      return undefined;
    }
  };

  const persist = () => {
    if (blocked) return;

    // Another tab may have written a newer save since this store loaded. Only
    // synchronous storage can be probed here; async storage's newer-save guard
    // happens during hydrate.
    if (!readIsAsync) {
      const stored = readStoredRaw();
      if (stored !== undefined && isNewerSave(stored)) {
        blocked = true;
        notify();
        return;
      }
    }

    const raw = JSON.stringify(state);
    try {
      const result = storage.setItem(PROGRESS_STORAGE_KEY, raw);
      if (isPromiseLike<void>(result)) {
        const write: Promise<void> = Promise.resolve(result).then(
          () => {
            saveError = false;
          },
          () => {
            saveError = true;
          }
        );
        pendingWrites.add(write);
        void write.finally(() => {
          pendingWrites.delete(write);
        });
      } else {
        saveError = false;
      }
    } catch {
      saveError = true;
    }
  };

  const mutate = (next: UserState) => {
    revision += 1;
    state = next;
    persist();
    notify();
  };

  // Load synchronously when the platform allows it. Async storage stays at the
  // default state until `hydrate()` resolves; the read is started here so a
  // later hydrate does not issue a second request.
  try {
    const raw = storage.getItem(PROGRESS_STORAGE_KEY);
    if (isPromiseLike<string | null>(raw)) {
      readIsAsync = true;
      initialRead = Promise.resolve(raw);
      initialRead.catch(() => {
        saveError = true;
      });
    } else {
      applyLoaded(raw);
      hydrated = true;
    }
  } catch {
    saveError = true;
    hydrated = true;
  }

  const hydrate = async (): Promise<UserState> => {
    if (hydrated) return state;

    const startedAt = revision;
    let raw: string | null;
    try {
      raw = initialRead
        ? await initialRead
        : await storage.getItem(PROGRESS_STORAGE_KEY);
    } catch {
      saveError = true;
      return state;
    } finally {
      initialRead = null;
    }

    hydrated = true;

    if (startedAt !== revision) {
      // Local edits happened while the read was in flight. Keep them, but do
      // not clobber a newer save that another build wrote.
      if (isNewerSave(raw)) blocked = true;
      notify();
      return state;
    }

    applyLoaded(raw);
    notify();
    return state;
  };

  const gradeCard = (
    cardId: string,
    rating: "again" | "good" | "easy",
    options: GradeOptions = {}
  ): GradeOutcome => {
    const { state: next, outcome } = applyGradeOutcome(
      state,
      cardId,
      rating,
      options
    );
    mutate(next);
    return outcome;
  };

  const updateSettings = (partial: Partial<UserSettings>) => {
    mutate({ ...state, settings: { ...state.settings, ...partial } });
  };

  const recordGrammarResult = (
    lessonId: string,
    correct: number,
    total: number
  ) => {
    mutate({
      ...state,
      grammar: recordGrammarAttempt(state.grammar, lessonId, correct, total),
    });
  };

  const replaceState = (next: UserState) => {
    hydrated = true;
    mutate(next);
  };

  const resetProgress = async (): Promise<void> => {
    try {
      const result = storage.removeItem(PROGRESS_STORAGE_KEY);
      if (isPromiseLike<void>(result)) await result;
    } catch {
      saveError = true;
      return;
    }

    initialRead = null;
    hydrated = true;
    blocked = false;
    saveError = false;
    revision += 1;
    state = defaultState();
    notify();
  };

  const flush = async (): Promise<void> => {
    while (pendingWrites.size > 0) {
      await Promise.all(Array.from(pendingWrites));
    }
  };

  return {
    getState: () => state,
    isSaveBlocked: () => blocked,
    hasSaveError: () => saveError,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hydrate,
    gradeCard,
    updateSettings,
    recordGrammarResult,
    replaceState,
    resetProgress,
    flush,
  };
}

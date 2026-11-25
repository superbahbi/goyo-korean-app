import { afterEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_STORAGE_KEY } from "../../packages/domain/src/progressStorage";
import {
  SCHEMA_VERSION,
  parseSavedState,
  type UserState,
} from "../../packages/domain/src/savedState";
import {
  createCrossPlatformProgressStore,
  createMemoryStorage,
  getDefaultStorage,
  type SyncOrAsyncStorage,
} from "./storage";

function seededStorage(value: unknown): SyncOrAsyncStorage {
  const storage = createMemoryStorage();
  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(value));
  return storage;
}

function storedState(storage: SyncOrAsyncStorage): UserState {
  const raw = storage.getItem(PROGRESS_STORAGE_KEY);
  if (typeof raw !== "string") throw new Error("expected a stored save");
  return JSON.parse(raw) as UserState;
}

function createAsyncStorage(initial: string | null = null) {
  let value = initial;
  const counts = { reads: 0, writes: 0, removes: 0 };
  const storage: SyncOrAsyncStorage = {
    getItem: async () => {
      counts.reads += 1;
      return value;
    },
    setItem: async (_key, next) => {
      counts.writes += 1;
      value = next;
    },
    removeItem: async () => {
      counts.removes += 1;
      value = null;
    },
  };
  return {
    storage,
    counts,
    read: () => value,
    write: (next: string | null) => {
      value = next;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createMemoryStorage", () => {
  it("behaves like a key/value store", () => {
    const storage = createMemoryStorage();

    expect(storage.getItem("missing")).toBeNull();
    storage.setItem("key", "value");
    expect(storage.getItem("key")).toBe("value");
    storage.removeItem("key");
    expect(storage.getItem("key")).toBeNull();
  });
});

describe("getDefaultStorage", () => {
  it("wraps localStorage when the runtime provides it", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    });

    const storage = getDefaultStorage();
    storage.setItem("key", "value");

    expect(values.get("key")).toBe("value");
    expect(storage.getItem("key")).toBe("value");
  });

  it("falls back to one shared memory store", () => {
    vi.stubGlobal("localStorage", undefined);

    const first = getDefaultStorage();
    const second = getDefaultStorage();

    expect(first).toBe(second);
    first.setItem("fallback", "1");
    expect(second.getItem("fallback")).toBe("1");
  });
});

describe("createCrossPlatformProgressStore with synchronous storage", () => {
  it("hydrates a save during construction", () => {
    const saved = parseSavedState(null);
    saved.stats.totalXp = 420;
    const storage = seededStorage(saved);

    const store = createCrossPlatformProgressStore(storage);

    expect(store.getState().stats.totalXp).toBe(420);
    expect(store.isSaveBlocked()).toBe(false);
    expect(store.hasSaveError()).toBe(false);
  });

  it("grades a card, updates the state, and writes the save", () => {
    const storage = createMemoryStorage();
    const store = createCrossPlatformProgressStore(storage);

    const outcome = store.gradeCard("surv_001", "good");

    expect(outcome).toMatchObject({
      xp: 10,
      countsAsNewCard: true,
      goalJustReached: false,
    });
    expect(store.getState().cardStates.surv_001).toBeDefined();
    expect(store.getState().stats.totalXp).toBe(10);
    expect(storedState(storage).stats.totalXp).toBe(10);
  });

  it("keeps practice-only modes out of the schedule while logging them", () => {
    const storage = createMemoryStorage();
    const store = createCrossPlatformProgressStore(storage);

    const outcome = store.gradeCard("surv_001", "good", { mode: "shadowing" });

    expect(outcome.xp).toBe(0);
    expect(store.getState().cardStates.surv_001).toBeUndefined();
    expect(store.getState().reviewLog.entries).toHaveLength(1);
    expect(store.getState().reviewLog.entries[0]).toMatchObject({
      cardId: "surv_001",
      mode: "shadowing",
      rating: "good",
    });
  });

  it("records a grammar attempt and keeps the best score", () => {
    const storage = createMemoryStorage();
    const store = createCrossPlatformProgressStore(storage);

    store.recordGrammarResult("copula", 4, 5);
    store.recordGrammarResult("copula", 3, 5);

    const grammar = store.getState().grammar;
    expect(grammar.completedLessonIds).toEqual(["copula"]);
    expect(grammar.scores.copula).toEqual({ correct: 4, total: 5 });
    expect(grammar.lastLessonId).toBe("copula");
    expect(storedState(storage).grammar.scores.copula).toEqual({
      correct: 4,
      total: 5,
    });
  });

  it("merges settings updates instead of replacing them", () => {
    const storage = createMemoryStorage();
    const store = createCrossPlatformProgressStore(storage);

    store.updateSettings({ dailyGoal: 25 });

    expect(store.getState().settings.dailyGoal).toBe(25);
    expect(store.getState().settings.newCardsPerDay).toBe(3);
    expect(store.getState().settings.autoPlayAudio).toBe(true);
    expect(storedState(storage).settings.dailyGoal).toBe(25);
  });

  it("never overwrites a newer save", () => {
    const newer = {
      schemaVersion: SCHEMA_VERSION + 1,
      stats: { totalXp: 999 },
    };
    const storage = seededStorage(newer);
    const before = storage.getItem(PROGRESS_STORAGE_KEY);
    const store = createCrossPlatformProgressStore(storage);

    expect(store.isSaveBlocked()).toBe(true);

    const outcome = store.gradeCard("surv_001", "good");

    // The tab keeps working in memory, but the newer build's save is untouched.
    expect(outcome.xp).toBe(10);
    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBe(before);
    expect(store.isSaveBlocked()).toBe(true);
  });

  it("blocks writes when a newer save appears after loading", () => {
    const storage = createMemoryStorage();
    const store = createCrossPlatformProgressStore(storage);
    const newer = JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1 });
    storage.setItem(PROGRESS_STORAGE_KEY, newer);

    store.gradeCard("surv_001", "good");

    expect(store.isSaveBlocked()).toBe(true);
    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBe(newer);
  });

  it("reports a synchronous write failure", () => {
    const storage: SyncOrAsyncStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {},
    };
    const store = createCrossPlatformProgressStore(storage);

    store.gradeCard("surv_001", "good");

    expect(store.hasSaveError()).toBe(true);
  });

  it("reports an asynchronous write failure after flushing", async () => {
    const deferred: { reject?: (error: Error) => void } = {};
    const storage: SyncOrAsyncStorage = {
      getItem: () => null,
      setItem: () =>
        new Promise<void>((_resolve, reject) => {
          deferred.reject = reject;
        }),
      removeItem: () => {},
    };
    const store = createCrossPlatformProgressStore(storage);

    store.gradeCard("surv_001", "good");
    deferred.reject?.(new Error("disk full"));
    await store.flush();

    expect(store.hasSaveError()).toBe(true);
  });

  it("notifies subscribers until they unsubscribe", () => {
    const storage = createMemoryStorage();
    const store = createCrossPlatformProgressStore(storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.gradeCard("surv_001", "good");
    store.updateSettings({ dailyGoal: 12 });
    store.recordGrammarResult("copula", 2, 3);

    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    store.gradeCard("surv_002", "good");

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("replaces the whole state", () => {
    const storage = createMemoryStorage();
    const store = createCrossPlatformProgressStore(storage);
    const replacement = parseSavedState(null);
    replacement.stats.totalXp = 77;
    replacement.settings.dailyGoal = 7;

    store.replaceState(replacement);

    expect(store.getState()).toEqual(replacement);
    expect(storedState(storage).stats.totalXp).toBe(77);
  });

  it("adopts another tab's save without writing it back", () => {
    const storage = createMemoryStorage();
    const store = createCrossPlatformProgressStore(storage);
    const listener = vi.fn();
    store.subscribe(listener);
    const setItem = vi.spyOn(storage, "setItem");
    const other = parseSavedState(null);
    other.stats.totalXp = 42;

    store.adoptStoredSave(JSON.stringify(other));

    expect(store.getState().stats.totalXp).toBe(42);
    expect(setItem).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("adopts another tab's reset as a fresh save", () => {
    const storage = createMemoryStorage();
    const store = createCrossPlatformProgressStore(storage);
    store.gradeCard("surv_001", "good");

    store.adoptStoredSave(null);

    expect(store.getState().cardStates).toEqual({});
    expect(store.getState().stats.totalXp).toBe(0);
  });

  it("blocks instead of adopting a newer build's save from another tab", () => {
    const storage = createMemoryStorage();
    const store = createCrossPlatformProgressStore(storage);
    store.gradeCard("surv_001", "good");
    const newer = JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1 });
    storage.setItem(PROGRESS_STORAGE_KEY, newer);

    store.adoptStoredSave(newer);
    store.gradeCard("surv_002", "good");

    expect(store.isSaveBlocked()).toBe(true);
    expect(Object.keys(store.getState().cardStates)).toEqual([
      "surv_001",
      "surv_002",
    ]);
    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBe(newer);
  });

  it("lifts the block when another tab writes a save this build can read", () => {
    const newer = { schemaVersion: SCHEMA_VERSION + 1 };
    const storage = seededStorage(newer);
    const store = createCrossPlatformProgressStore(storage);
    expect(store.isSaveBlocked()).toBe(true);

    const readable = JSON.stringify(parseSavedState(null));
    storage.setItem(PROGRESS_STORAGE_KEY, readable);
    store.adoptStoredSave(readable);
    store.updateSettings({ dailyGoal: 12 });

    expect(store.isSaveBlocked()).toBe(false);
    expect(storedState(storage).settings.dailyGoal).toBe(12);
  });

  it("writes nothing until the first change", () => {
    const storage = createMemoryStorage();
    const setItem = vi.spyOn(storage, "setItem");

    createCrossPlatformProgressStore(storage);

    // A visit that never studies must not leave a default save behind.
    expect(setItem).not.toHaveBeenCalled();
    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
  });

  it("resets progress and clears the stored save", async () => {
    const storage = createMemoryStorage();
    const store = createCrossPlatformProgressStore(storage);
    store.gradeCard("surv_001", "good");
    const listener = vi.fn();
    store.subscribe(listener);

    await store.resetProgress();

    expect(store.getState().stats.totalXp).toBe(0);
    expect(store.getState().cardStates).toEqual({});
    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
    expect(store.isSaveBlocked()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("createCrossPlatformProgressStore with asynchronous storage", () => {
  it("loads the save through hydrate and reuses the initial read", async () => {
    const saved = parseSavedState(null);
    saved.stats.totalXp = 315;
    const asyncStorage = createAsyncStorage(JSON.stringify(saved));
    const store = createCrossPlatformProgressStore(asyncStorage.storage);

    // Async storage is not ready until hydrate resolves.
    expect(store.getState().stats.totalXp).toBe(0);

    const hydrated = await store.hydrate();

    expect(hydrated.stats.totalXp).toBe(315);
    expect(store.getState().stats.totalXp).toBe(315);
    expect(asyncStorage.counts.reads).toBe(1);

    await store.hydrate();
    expect(asyncStorage.counts.reads).toBe(1);
  });

  it("persists grades through async storage", async () => {
    const asyncStorage = createAsyncStorage();
    const store = createCrossPlatformProgressStore(asyncStorage.storage);
    await store.hydrate();

    store.gradeCard("surv_001", "good");
    await store.flush();

    expect(asyncStorage.counts.writes).toBe(1);
    expect(JSON.parse(asyncStorage.read() ?? "{}").stats.totalXp).toBe(10);
  });

  it("hydrates into the newer-save block", async () => {
    const newer = JSON.stringify({
      schemaVersion: SCHEMA_VERSION + 1,
      stats: { totalXp: 1234 },
    });
    const asyncStorage = createAsyncStorage(newer);
    const store = createCrossPlatformProgressStore(asyncStorage.storage);

    await store.hydrate();

    expect(store.isSaveBlocked()).toBe(true);

    store.gradeCard("surv_001", "good");
    await store.flush();

    expect(asyncStorage.read()).toBe(newer);
  });

  it("reports a failed read and keeps the default state", async () => {
    const storage: SyncOrAsyncStorage = {
      getItem: async () => {
        throw new Error("storage unavailable");
      },
      setItem: async () => {},
      removeItem: async () => {},
    };
    const store = createCrossPlatformProgressStore(storage);

    const state = await store.hydrate();

    expect(state.stats.totalXp).toBe(0);
    expect(store.hasSaveError()).toBe(true);
  });

  it("resets an async save after removeItem resolves", async () => {
    const saved = parseSavedState(null);
    saved.stats.totalXp = 50;
    const asyncStorage = createAsyncStorage(JSON.stringify(saved));
    const store = createCrossPlatformProgressStore(asyncStorage.storage);
    await store.hydrate();

    await store.resetProgress();

    expect(asyncStorage.counts.removes).toBe(1);
    expect(asyncStorage.read()).toBeNull();
    expect(store.getState().stats.totalXp).toBe(0);
  });
});

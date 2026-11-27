import { describe, expect, it, vi, type Mock } from "vitest";
import {
  isChunkLoadError,
  reloadToLatestApp,
  type AppReloadEnvironment,
  type ServiceWorkerContainerLike,
  type ServiceWorkerLike,
  type ServiceWorkerRegistrationLike,
} from "./appReload";

/**
 * The Settings "Reload app" button must land on the newest build. Posting
 * SKIP_WAITING and reloading in the same tick leaves the old worker in control,
 * so the page comes back unchanged; these tests pin the wait for activation.
 */

interface FakeWorker extends ServiceWorkerLike {
  readonly messages: unknown[];
  moveTo(state: string): void;
}

function fakeWorker(state = "installed"): FakeWorker {
  const listeners = new Set<() => void>();
  const messages: unknown[] = [];
  const worker: FakeWorker = {
    state,
    messages,
    postMessage(message: unknown) {
      messages.push(message);
    },
    addEventListener(_type, listener) {
      listeners.add(listener);
    },
    removeEventListener(_type, listener) {
      listeners.delete(listener);
    },
    moveTo(next: string) {
      worker.state = next;
      listeners.forEach(listener => listener());
    },
  };
  return worker;
}

interface FakeContainer extends ServiceWorkerContainerLike {
  changeController(): void;
  listenerCount(): number;
}

function fakeContainer(
  registration: ServiceWorkerRegistrationLike | undefined
): FakeContainer {
  const listeners = new Set<() => void>();
  return {
    getRegistration: async () => registration,
    addEventListener(_type, listener) {
      listeners.add(listener);
    },
    removeEventListener(_type, listener) {
      listeners.delete(listener);
    },
    changeController() {
      listeners.forEach(listener => listener());
    },
    listenerCount: () => listeners.size,
  };
}

function fakeRegistration(
  initialWaiting: ServiceWorkerLike | null,
  afterUpdate: ServiceWorkerLike | null = null
) {
  let waiting = initialWaiting;
  const update = vi.fn(async () => {
    waiting = afterUpdate;
  });
  return {
    get waiting() {
      return waiting;
    },
    update,
  };
}

type TestEnvironment = AppReloadEnvironment & { reload: Mock };

function environment(
  overrides: Partial<Omit<AppReloadEnvironment, "reload">> = {}
) {
  const env: TestEnvironment = {
    reload: vi.fn(),
    setTimeout: (handler: () => void, ms: number) =>
      setTimeout(handler, ms) as unknown as number,
    clearTimeout: (id: number) => clearTimeout(id),
  };
  Object.assign(env, overrides);
  return env;
}

describe("reloadToLatestApp", () => {
  it("reloads when the browser has no service worker", async () => {
    const env = environment();

    await reloadToLatestApp(env);

    expect(env.reload).toHaveBeenCalledOnce();
  });

  it("reloads when no registration exists yet", async () => {
    const env = environment({ serviceWorker: fakeContainer(undefined) });

    await reloadToLatestApp(env);

    expect(env.reload).toHaveBeenCalledOnce();
  });

  it("waits for a waiting worker to activate before reloading", async () => {
    const worker = fakeWorker("installed");
    const container = fakeContainer(fakeRegistration(worker));
    const env = environment({ serviceWorker: container });

    const done = reloadToLatestApp(env);
    await vi.waitFor(() => expect(worker.messages).toHaveLength(1));
    expect(worker.messages[0]).toEqual({ type: "SKIP_WAITING" });
    expect(env.reload).not.toHaveBeenCalled();

    worker.moveTo("activated");
    await done;

    expect(env.reload).toHaveBeenCalledOnce();
  });

  it("reloads when the controller changes instead of the worker state", async () => {
    const worker = fakeWorker("installed");
    const container = fakeContainer(fakeRegistration(worker));
    const env = environment({ serviceWorker: container });

    const done = reloadToLatestApp(env);
    await vi.waitFor(() => expect(worker.messages).toHaveLength(1));
    container.changeController();
    await done;

    expect(env.reload).toHaveBeenCalledOnce();
  });

  it("reloads at once when the worker is already activated", async () => {
    const worker = fakeWorker("activated");
    const env = environment({
      serviceWorker: fakeContainer(fakeRegistration(worker)),
    });

    await reloadToLatestApp(env);

    expect(env.reload).toHaveBeenCalledOnce();
  });

  it("checks for a new deployment when nothing is waiting", async () => {
    const worker = fakeWorker("installed");
    const registration = fakeRegistration(null, worker);
    const container = fakeContainer(registration);
    const env = environment({ serviceWorker: container });

    const done = reloadToLatestApp(env);
    await vi.waitFor(() => expect(registration.update).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(worker.messages).toHaveLength(1));
    expect(env.reload).not.toHaveBeenCalled();

    worker.moveTo("activated");
    await done;

    expect(env.reload).toHaveBeenCalledOnce();
  });

  it("reloads without waiting when the update check finds nothing", async () => {
    const registration = fakeRegistration(null);
    const env = environment({
      serviceWorker: fakeContainer(registration),
    });

    await reloadToLatestApp(env);

    expect(registration.update).toHaveBeenCalledOnce();
    expect(env.reload).toHaveBeenCalledOnce();
  });

  it("reloads after the activation timeout so the button never stalls", async () => {
    vi.useFakeTimers();
    try {
      const worker = fakeWorker("installing");
      const container = fakeContainer(fakeRegistration(worker));
      const env = environment({
        serviceWorker: container,
        activationTimeoutMs: 3000,
      });

      const done = reloadToLatestApp(env);
      await vi.advanceTimersByTimeAsync(3000);
      await done;

      expect(env.reload).toHaveBeenCalledOnce();
      expect(container.listenerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("still reloads when the registration cannot be read", async () => {
    const container: ServiceWorkerContainerLike = {
      ...fakeContainer(undefined),
      getRegistration: async () => {
        throw new Error("Storage is unavailable");
      },
    };
    const env = environment({ serviceWorker: container });

    await reloadToLatestApp(env);

    expect(env.reload).toHaveBeenCalledOnce();
  });

  it("still reloads when the update check fails", async () => {
    const registration = fakeRegistration(null);
    registration.update.mockRejectedValueOnce(new Error("Offline"));
    const env = environment({
      serviceWorker: fakeContainer(registration),
    });

    await reloadToLatestApp(env);

    expect(env.reload).toHaveBeenCalledOnce();
  });

  it("reloads when the waiting worker cannot receive the message", async () => {
    const worker = fakeWorker("installed");
    worker.postMessage = () => {
      throw new Error("Invalid state");
    };
    const env = environment({
      serviceWorker: fakeContainer(fakeRegistration(worker)),
    });

    await reloadToLatestApp(env);

    expect(env.reload).toHaveBeenCalledOnce();
  });
});

describe("isChunkLoadError", () => {
  it.each([
    new TypeError(
      "Failed to fetch dynamically imported module: https://x/assets/a.js"
    ),
    new TypeError("error loading dynamically imported module: https://x/a.js"),
    new TypeError("Importing a module script failed."),
    new Error("Unable to preload CSS for /assets/a.css"),
    Object.assign(new Error("Loading chunk 3 failed."), {
      name: "ChunkLoadError",
    }),
  ])("recognises a dynamic-import failure: %s", error => {
    expect(isChunkLoadError(error)).toBe(true);
  });

  it("rejects ordinary errors", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of null"))).toBe(
      false
    );
  });

  it("rejects non-Error values", () => {
    expect(
      isChunkLoadError("Failed to fetch dynamically imported module")
    ).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError({})).toBe(false);
    expect(isChunkLoadError({ message: 42 })).toBe(false);
  });

  it("accepts an error-like object with a matching message", () => {
    expect(
      isChunkLoadError({ message: "Importing a module script failed" })
    ).toBe(true);
  });
});

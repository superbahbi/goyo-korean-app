/**
 * Reloading onto the newest deployed build.
 *
 * `registerType: "prompt"` keeps a new service worker waiting. Asking it to
 * skip waiting is asynchronous, and without `clientsClaim` the old worker keeps
 * controlling the page until the navigation. Reloading immediately therefore
 * serves the old precache and the button appears to do nothing. This module
 * waits for the waiting worker to activate (or for the controller to change),
 * with a timeout so a stuck worker cannot trap the user on the old build.
 */

const DEFAULT_ACTIVATION_TIMEOUT_MS = 3000;
const SKIP_WAITING_MESSAGE = { type: "SKIP_WAITING" } as const;

/** The subset of `ServiceWorker` the reload handshake needs. */
export interface ServiceWorkerLike {
  state: string;
  postMessage(message: unknown): void;
  addEventListener(type: "statechange", listener: () => void): void;
  removeEventListener(type: "statechange", listener: () => void): void;
}

/** The subset of `ServiceWorkerRegistration` the reload handshake needs. */
export interface ServiceWorkerRegistrationLike {
  readonly waiting: ServiceWorkerLike | null;
  update(): Promise<unknown>;
}

/** The subset of `ServiceWorkerContainer` the reload handshake needs. */
export interface ServiceWorkerContainerLike {
  getRegistration(): Promise<ServiceWorkerRegistrationLike | undefined>;
  addEventListener(type: "controllerchange", listener: () => void): void;
  removeEventListener(type: "controllerchange", listener: () => void): void;
}

/** Injected dependencies so the handshake is testable without a browser. */
export interface AppReloadEnvironment {
  serviceWorker?: ServiceWorkerContainerLike;
  reload: () => void;
  setTimeout: (handler: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
  activationTimeoutMs?: number;
}

async function findRegistration(
  container: ServiceWorkerContainerLike
): Promise<ServiceWorkerRegistrationLike | undefined> {
  try {
    return await container.getRegistration();
  } catch {
    // An unreadable registration must never block the reload.
    return undefined;
  }
}

async function requestUpdate(
  registration: ServiceWorkerRegistrationLike
): Promise<void> {
  try {
    await registration.update();
  } catch {
    // Offline (or a failed update check) still allows a reload.
  }
}

/**
 * Asks the waiting worker to activate and resolves once it takes over, fails,
 * or the timeout elapses. Listeners are attached before the message so a fast
 * activation cannot be missed; a message that cannot be delivered also
 * resolves instead of leaving the button dead.
 */
function activateWaitingWorker(
  worker: ServiceWorkerLike,
  container: ServiceWorkerContainerLike,
  env: AppReloadEnvironment
): Promise<void> {
  return new Promise(resolve => {
    let settled = false;
    let timer = 0;

    const finish = () => {
      if (settled) return;
      settled = true;
      env.clearTimeout(timer);
      container.removeEventListener("controllerchange", finish);
      worker.removeEventListener("statechange", checkState);
      resolve();
    };

    const checkState = () => {
      // "redundant" means activation failed; reload anyway rather than hang.
      if (worker.state === "activated" || worker.state === "redundant")
        finish();
    };

    container.addEventListener("controllerchange", finish);
    worker.addEventListener("statechange", checkState);
    timer = env.setTimeout(
      finish,
      env.activationTimeoutMs ?? DEFAULT_ACTIVATION_TIMEOUT_MS
    );
    // The worker may have activated between reading the registration and here.
    checkState();
    if (settled) return;

    try {
      worker.postMessage(SKIP_WAITING_MESSAGE);
    } catch {
      // A worker that is already gone cannot be activated; reload without it.
      finish();
    }
  });
}

/**
 * Moves the page onto the newest build, then reloads.
 *
 * - No service worker or registration: a plain reload is still the right
 *   action (a browser tab update also needs this button).
 * - A worker is waiting: ask it to skip waiting and wait until it activates.
 * - Nothing is waiting: check for a fresh deployment once, then reload.
 */
export async function reloadToLatestApp(
  env: AppReloadEnvironment
): Promise<void> {
  const container = env.serviceWorker;
  if (!container) {
    env.reload();
    return;
  }

  const registration = await findRegistration(container);
  if (!registration) {
    env.reload();
    return;
  }

  let waiting = registration.waiting;
  if (!waiting) {
    await requestUpdate(registration);
    waiting = registration.waiting;
  }

  if (!waiting) {
    env.reload();
    return;
  }

  // Register the listeners before the message so a fast activation cannot be
  // missed.
  await activateWaitingWorker(waiting, container, env);
  env.reload();
}

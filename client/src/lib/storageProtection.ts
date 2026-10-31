/**
 * Progress protection.
 *
 * localStorage is not durable: browsers evict it under storage pressure, and
 * Safari clears it after seven days of not using the site. Installed PWAs can
 * ask for persistent storage, and on iPhone the only way to get that is to add
 * the app to the Home Screen. Nothing here is required for the app to work.
 */

const IOS_HINT_KEY = "goyo-ios-install-hint";
let persistRequest: Promise<boolean | null> | null = null;

export function isIosDevice(userAgent: string, maxTouchPoints = 0): boolean {
  if (/iPad|iPhone|iPod/.test(userAgent)) return true;
  // iPadOS 13+ reports a desktop Safari user agent; touch points give it away.
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

export function isStandaloneApp(
  displayModeStandalone: boolean,
  navigatorStandalone = false
): boolean {
  return displayModeStandalone || navigatorStandalone;
}

function readHintShown(): boolean {
  try {
    return localStorage.getItem(IOS_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function shouldSuggestIosInstall(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined")
    return false;
  if (!isIosDevice(navigator.userAgent, navigator.maxTouchPoints)) return false;
  const standalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const navigatorStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isStandaloneApp(Boolean(standalone), navigatorStandalone)) return false;
  return !readHintShown();
}

export function markIosInstallHintShown(): void {
  try {
    localStorage.setItem(IOS_HINT_KEY, "1");
  } catch {
    /* storage may be unavailable; showing the hint twice is harmless */
  }
}

/**
 * Ask the browser to keep this origin's storage. Called once, after the first
 * graded card, because a prompt on first paint would be noise. Resolves null
 * when the browser has no Storage API or the request fails.
 */
export function requestPersistentStorage(): Promise<boolean | null> {
  if (persistRequest) return persistRequest;
  persistRequest = (async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.storage?.persist)
        return null;
      return await navigator.storage.persist();
    } catch {
      return null;
    }
  })();
  return persistRequest;
}

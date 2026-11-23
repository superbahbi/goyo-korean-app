import { afterEach, describe, expect, it, vi } from "vitest";
import { isIosDevice, isStandaloneApp } from "./storageProtection";

const iphoneSafari =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ipadDesktopMode =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const androidChrome =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

describe("iOS detection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("recognises iPhone and iPad user agents", () => {
    expect(isIosDevice(iphoneSafari)).toBe(true);
    expect(isIosDevice(ipadDesktopMode, 5)).toBe(true);
  });

  it("does not treat a desktop Mac or Android as iOS", () => {
    expect(isIosDevice(ipadDesktopMode, 0)).toBe(false);
    expect(isIosDevice(androidChrome, 5)).toBe(false);
  });

  it("knows when the app already runs standalone", () => {
    expect(isStandaloneApp(true)).toBe(true);
    expect(isStandaloneApp(false, true)).toBe(true);
    expect(isStandaloneApp(false, false)).toBe(false);
  });

  it("asks for persistent storage once and reuses the answer", async () => {
    const persist = vi.fn(async () => true);
    vi.stubGlobal("navigator", { storage: { persist } });

    const { requestPersistentStorage: request } = await import(
      "./storageProtection"
    );

    await expect(request()).resolves.toBe(true);
    await expect(request()).resolves.toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("reports no result when the browser has no Storage API", async () => {
    vi.stubGlobal("navigator", {});

    const { requestPersistentStorage: request } = await import(
      "./storageProtection"
    );

    await expect(request()).resolves.toBeNull();
  });
});

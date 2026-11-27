// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reloadToLatestApp } from "@domain/appReload";
import { LazyBoundary } from "./LazyBoundary";

vi.mock("@domain/appReload", async importOriginal => ({
  ...(await importOriginal<typeof import("@domain/appReload")>()),
  reloadToLatestApp: vi.fn(() => Promise.resolve()),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let failure: Error | null;

function Screen() {
  if (failure) throw failure;
  return createElement("p", null, "Screen loaded");
}

function render(onClose = vi.fn()) {
  act(() => {
    root.render(
      createElement(LazyBoundary, { onClose, children: createElement(Screen) })
    );
  });
}

const button = (name: string) =>
  [...container.querySelectorAll("button")].find(
    element => element.textContent?.trim() === name
  );

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(reloadToLatestApp).mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("a screen that fails to load", () => {
  it("offers a reload, not a retry, when the lazy chunk is gone", () => {
    failure = new TypeError(
      "Failed to fetch dynamically imported module: https://goyo.bahbi.net/assets/StatsDialog-old.js"
    );
    render();

    expect(button("Try again")).toBeUndefined();
    act(() => button("Reload Goyo")!.click());

    expect(reloadToLatestApp).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="alertdialog"]')).not.toBeNull();
  });

  it("retries in place for any other error", () => {
    failure = new Error("render failed");
    render();

    expect(button("Reload Goyo")).toBeUndefined();
    failure = null;
    act(() => button("Try again")!.click());

    expect(container.textContent).toContain("Screen loaded");
    expect(reloadToLatestApp).not.toHaveBeenCalled();
  });

  it("closes through the dashboard's callback", () => {
    failure = new Error("render failed");
    const onClose = vi.fn();
    render(onClose);

    act(() => button("Close")!.click());

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

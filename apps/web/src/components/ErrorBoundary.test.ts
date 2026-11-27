// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_STORAGE_KEY } from "@domain/progressStorage";
import ErrorBoundary from "./ErrorBoundary";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function Crash(): never {
  throw new Error("render failed");
}

let container: HTMLDivElement;
let root: Root;

function renderCrashed() {
  act(() => {
    root.render(createElement(ErrorBoundary, null, createElement(Crash)));
  });
}

const button = (name: string) =>
  [...container.querySelectorAll("button")].find(
    element => element.textContent?.trim() === name
  );

beforeEach(() => {
  // React reports the caught render error; keep the test output readable.
  vi.spyOn(console, "error").mockImplementation(() => {});
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("crash screen backup", () => {
  it("offers a backup of the stored save, byte for byte, before any reset", async () => {
    // A newer build's save must survive untouched, so it is never parsed.
    const raw = '{"schemaVersion":99,"cardStates":{},"note":"kept as is"}';
    localStorage.setItem(PROGRESS_STORAGE_KEY, raw);
    let saved: Blob | null = null;
    const createObjectURL = vi.fn((blob: Blob) => {
      saved = blob;
      return "blob:backup";
    });
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    renderCrashed();
    const download = button("Download backup");
    expect(download).toBeDefined();
    act(() => download!.click());

    expect(click).toHaveBeenCalledTimes(1);
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toMatch(
      /^goyo-progress-backup-\d{4}-\d{2}-\d{2}\.json$/
    );
    expect(await (saved as Blob | null)?.text()).toBe(raw);
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBe(raw);
  });

  it("hides the backup when there is no stored save", () => {
    renderCrashed();

    expect(button("Download backup")).toBeUndefined();
    expect(button("Reload Page")).toBeDefined();
    expect(button("Reset local progress")).toBeDefined();
  });

  it("still asks for a second click before erasing progress", () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, "{}");
    renderCrashed();

    act(() => button("Reset local progress")!.click());

    expect(button("Yes, erase local progress")).toBeDefined();
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBe("{}");
  });
});

import { describe, expect, it } from "vitest";
import {
  knownDialogKind,
  NO_DIALOG,
  reduceDialog,
  type DialogRequest,
  type DialogRequestInput,
} from "./dialogLauncher";

function open(request: DialogRequestInput) {
  return reduceDialog(NO_DIALOG, { type: "open", request });
}

describe("dialog launcher", () => {
  it("opens a dialog from none", () => {
    expect(open({ kind: "stats" })).toEqual({ kind: "stats" });
    expect(knownDialogKind({ kind: "stats" })).toBe("stats");
  });

  it("replaces the current dialog instead of stacking requests", () => {
    const browse = open({ kind: "browse", category: "food" });
    const settings = reduceDialog(browse, {
      type: "open",
      request: { kind: "settings" },
    });

    expect(settings).toEqual({ kind: "settings" });
    expect(knownDialogKind(settings)).toBe("settings");
  });

  it("returns to none when closed", () => {
    const openStats = open({ kind: "stats" });

    expect(reduceDialog(openStats, { type: "close" })).toBe(NO_DIALOG);
    expect(knownDialogKind(NO_DIALOG)).toBeNull();
  });

  it("normalizes a browse request with no category", () => {
    expect(open({ kind: "browse" })).toEqual({
      kind: "browse",
      category: null,
    });
  });

  it("keeps the browse category payload for preselect", () => {
    expect(open({ kind: "browse", category: "travel" })).toEqual({
      kind: "browse",
      category: "travel",
    });
  });

  it("renders nothing for absent or unknown requests", () => {
    expect(knownDialogKind(NO_DIALOG)).toBeNull();
    expect(
      knownDialogKind({ kind: "retired" } as unknown as DialogRequest)
    ).toBeNull();
  });
});

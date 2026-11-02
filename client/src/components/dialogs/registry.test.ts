import { describe, expect, it } from "vitest";
import { DIALOG_KINDS } from "@/lib/dialogLauncher";
import { DIALOG_REGISTRY } from "./registry";

describe("dialog registry", () => {
  it("has one entry for every dialog kind", () => {
    expect(Object.keys(DIALOG_REGISTRY).sort()).toEqual(
      [...DIALOG_KINDS].sort()
    );
  });

  it("gives every entry a dispatchable render function", () => {
    for (const kind of DIALOG_KINDS) {
      expect(DIALOG_REGISTRY[kind], kind).toBeDefined();
      expect(typeof DIALOG_REGISTRY[kind].render, kind).toBe("function");
    }
  });
});

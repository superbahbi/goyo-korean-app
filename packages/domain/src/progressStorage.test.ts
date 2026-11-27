import { describe, expect, it } from "vitest";
import { progressBackupFileName } from "./progressStorage";

describe("progressBackupFileName", () => {
  it("dates the file by the local day", () => {
    expect(progressBackupFileName(new Date(2026, 10, 5, 23, 59))).toBe(
      "goyo-progress-backup-2026-11-05.json"
    );
  });
});

import { describe, expect, it } from "vitest";
import { daysSince, describeBackupAge, isBackupOverdue } from "./backupStatus";

const now = new Date("2026-10-31T12:00:00Z");

describe("backup age", () => {
  it("asks for a first export when the device has never backed up", () => {
    expect(describeBackupAge(null, now)).toBe(
      "Progress has never been exported from this device."
    );
    expect(isBackupOverdue(null, now)).toBe(true);
  });

  it("reads as today and yesterday, then as a day count", () => {
    expect(describeBackupAge(new Date("2026-10-31T08:00:00Z"), now)).toBe(
      "Last backed up today."
    );
    expect(describeBackupAge(new Date("2026-10-30T08:00:00Z"), now)).toBe(
      "Last backed up yesterday."
    );
    expect(describeBackupAge(new Date("2026-10-24T08:00:00Z"), now)).toBe(
      "Last backed up 7 days ago."
    );
  });

  it("never counts backwards when the clock is behind the backup", () => {
    expect(daysSince(new Date("2026-11-02T12:00:00Z"), now)).toBe(0);
    expect(describeBackupAge(new Date("2026-11-02T12:00:00Z"), now)).toBe(
      "Last backed up today."
    );
  });

  it("only calls a backup overdue once it is a week old", () => {
    expect(isBackupOverdue(new Date("2026-10-25T12:00:00Z"), now)).toBe(false);
    expect(isBackupOverdue(new Date("2026-10-24T12:00:00Z"), now)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { STUDY_KEY_HINT, studyKeyCommand, type StudyPhase } from "./studyKeys";

const space = { key: " " };
const spaceByCode = { key: "Unidentified", code: "Space" };

describe("study keymap", () => {
  it("renders the hint from the same table as the bindings", () => {
    expect(STUDY_KEY_HINT).toBe(
      "Space reveals · 1 Again · 2 Good · 3 Easy · Esc closes"
    );
  });

  it("starts the intro with Enter or Space", () => {
    expect(studyKeyCommand({ key: "Enter" }, "intro")).toBe("start-intro");
    expect(studyKeyCommand(space, "intro")).toBe("start-intro");
    expect(studyKeyCommand(spaceByCode, "intro")).toBe("start-intro");
  });

  it("reveals with Space and grades only once the answer is visible", () => {
    expect(studyKeyCommand(space, "recall")).toBe("reveal");
    expect(studyKeyCommand(spaceByCode, "recall")).toBe("reveal");
    expect(studyKeyCommand({ key: "1" }, "recall")).toBeNull();
    expect(studyKeyCommand({ key: "2" }, "recall")).toBeNull();

    expect(studyKeyCommand({ key: "1" }, "revealed")).toBe("grade-again");
    expect(studyKeyCommand({ key: "2" }, "revealed")).toBe("grade-good");
    expect(studyKeyCommand({ key: "3" }, "revealed")).toBe("grade-easy");
  });

  it("consumes Space on a revealed card without revealing again", () => {
    expect(studyKeyCommand(space, "revealed")).toBe("consume");
  });

  it("closes from every phase, including the summary", () => {
    const phases: StudyPhase[] = ["intro", "recall", "revealed", "completed"];
    for (const phase of phases) {
      expect(studyKeyCommand({ key: "Escape" }, phase)).toBe("close");
    }
  });

  it("ignores keys that have no job in the current phase", () => {
    expect(studyKeyCommand({ key: "Enter" }, "recall")).toBeNull();
    expect(studyKeyCommand({ key: "1" }, "intro")).toBeNull();
    expect(studyKeyCommand(space, "completed")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { buildSentenceItems } from "./generate-elevenlabs-audio";

describe("sentence audio items", () => {
  it("uses the line id and trimmed text", () => {
    const items = buildSentenceItems(
      [
        { id: "surv_001", text: "  안녕하세요, 저는 학생입니다. " },
        { id: "surv_002", text: "   " },
      ],
      "elevenlabs_"
    );

    expect(items).toEqual([
      {
        id: "surv_001",
        text: "안녕하세요, 저는 학생입니다.",
        group: "sentences",
        filename: "elevenlabs_sent_surv_001.mp3",
      },
    ]);
  });

  it("keeps the female voice in its own filename space", () => {
    const [item] = buildSentenceItems(
      [{ id: "surv_001", text: "안녕하세요." }],
      "elevenlabs_female_"
    );
    expect(item.filename).toBe("elevenlabs_female_sent_surv_001.mp3");
  });

  it("emits one item per non-empty line with unique ids", () => {
    const items = buildSentenceItems(
      [
        { id: "a", text: "가." },
        { id: "b", text: "나." },
        { id: "c", text: "" },
        { id: "d", text: "다." },
      ],
      "p_"
    );
    expect(items).toHaveLength(3);
    expect(new Set(items.map(item => item.id)).size).toBe(3);
  });

  it("names grammar lines with their own prefix", () => {
    const [item] = buildSentenceItems(
      [{ id: "grammar_copula_1", text: "저는 학생이에요." }],
      "elevenlabs_"
    );
    expect(item.filename).toBe("elevenlabs_sent_grammar_copula_1.mp3");
  });
});

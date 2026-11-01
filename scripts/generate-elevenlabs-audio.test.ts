import { describe, expect, it } from "vitest";
import { buildSentenceItems } from "./generate-elevenlabs-audio";

describe("sentence audio items", () => {
  it("uses the card id and trimmed example text", () => {
    const items = buildSentenceItems(
      [
        { id: "surv_001", example: "  안녕하세요, 저는 학생입니다. " },
        { id: "surv_002" },
        { id: "surv_003", example: "   " },
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
      [{ id: "surv_001", example: "안녕하세요." }],
      "elevenlabs_female_"
    );
    expect(item.filename).toBe("elevenlabs_female_sent_surv_001.mp3");
  });

  it("emits one item per card example with unique ids", () => {
    const cards = [
      { id: "a", example: "가." },
      { id: "b", example: "나." },
      { id: "c" },
      { id: "d", example: "다." },
    ];
    const items = buildSentenceItems(cards, "p_");
    expect(items).toHaveLength(3);
    expect(new Set(items.map(item => item.id)).size).toBe(3);
  });
});

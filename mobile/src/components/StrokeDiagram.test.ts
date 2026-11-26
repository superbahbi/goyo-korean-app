import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ALPHABET_DATA } from "../../../packages/domain/src/alphabet";
import { getHangulStrokes } from "../../../packages/domain/src/hangulStrokes";
import { StrokeDiagram, strokeStart } from "./StrokeDiagram";

describe("StrokeDiagram", () => {
  it("reads the pen's first point from a stroke path", () => {
    expect(strokeStart("M20 26 H76 V84")).toEqual({ x: 20, y: 26 });
    expect(strokeStart("M 30.5, 12 C 1 2 3 4 5 6")).toEqual({
      x: 30.5,
      y: 12,
    });
    expect(strokeStart("H76")).toBeNull();
  });

  it("finds a start point for every stroke of every letter", () => {
    for (const card of ALPHABET_DATA) {
      for (const path of getHangulStrokes(card.id)) {
        expect(strokeStart(path), `${card.hangul} ${path}`).not.toBeNull();
      }
    }
  });

  it("draws each stroke with a numbered start, labelled for screen readers", () => {
    const markup = renderToStaticMarkup(
      createElement(StrokeDiagram, {
        characterId: "cons_003",
        hangul: "ㄷ",
        color: "#059669",
        badge: "#0f172a",
        badgeText: "#ffffff",
      })
    );
    expect(markup).toContain('aria-label="Stroke order for ㄷ: 2 strokes"');
    expect(markup.match(/<path /g)).toHaveLength(2);
    expect(markup).toContain(">1</text>");
    expect(markup).toContain(">2</text>");
  });

  it("renders nothing for a letter without stroke data", () => {
    const markup = renderToStaticMarkup(
      createElement(StrokeDiagram, {
        characterId: "cons_999",
        hangul: "?",
        color: "#000",
        badge: "#000",
        badgeText: "#fff",
      })
    );
    expect(markup).toBe("");
  });
});

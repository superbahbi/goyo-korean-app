import { describe, expect, it } from "vitest";
import {
  GRAMMAR_LESSONS,
  GRAMMAR_LESSON_COUNT,
  GRAMMAR_SENTENCE_LINES,
  findGrammarLesson,
  grammarExampleId,
} from "./grammar";

describe("grammar lessons", () => {
  it("has twelve lessons numbered 1 to 12", () => {
    expect(GRAMMAR_LESSON_COUNT).toBe(12);
    expect(GRAMMAR_LESSONS.map(lesson => lesson.order)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1)
    );
  });

  it("gives every lesson a unique id and complete text", () => {
    const ids = GRAMMAR_LESSONS.map(lesson => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const lesson of GRAMMAR_LESSONS) {
      expect(lesson.title.trim(), lesson.id).not.toBe("");
      expect(lesson.subtitle.trim(), lesson.id).not.toBe("");
      expect(lesson.summary.trim(), lesson.id).not.toBe("");
      expect(lesson.mistake.trim(), lesson.id).not.toBe("");
      expect(lesson.points.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(lesson.examples.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(lesson.quiz.length, lesson.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps every quiz answer inside its options", () => {
    for (const lesson of GRAMMAR_LESSONS) {
      for (const question of lesson.quiz) {
        expect(question.prompt.trim(), lesson.id).not.toBe("");
        expect(question.explanation.trim(), lesson.id).not.toBe("");
        expect(question.options.length, question.prompt).toBeGreaterThanOrEqual(
          2
        );
        expect(new Set(question.options).size, question.prompt).toBe(
          question.options.length
        );
        expect(question.answerIndex, question.prompt).toBeGreaterThanOrEqual(0);
        expect(question.answerIndex, question.prompt).toBeLessThan(
          question.options.length
        );
        for (const option of question.options) {
          expect(option.trim(), question.prompt).not.toBe("");
        }
      }
    }
  });

  it("gives every example Korean and English text", () => {
    for (const lesson of GRAMMAR_LESSONS) {
      for (const example of lesson.examples) {
        expect(example.ko.trim(), lesson.id).not.toBe("");
        expect(example.en.trim(), lesson.id).not.toBe("");
        expect(example.ko, lesson.id).toMatch(/[가-힣]/);
      }
    }
  });

  it("builds one unique sentence line per example", () => {
    const exampleCount = GRAMMAR_LESSONS.reduce(
      (total, lesson) => total + lesson.examples.length,
      0
    );
    expect(GRAMMAR_SENTENCE_LINES).toHaveLength(exampleCount);
    const ids = GRAMMAR_SENTENCE_LINES.map(line => line.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const line of GRAMMAR_SENTENCE_LINES) {
      expect(line.id).toMatch(/^grammar_[a-z-]+_\d+$/);
      expect(line.text.trim()).not.toBe("");
    }
  });

  it("resolves lessons and example ids the same way the UI does", () => {
    const lesson = findGrammarLesson("copula");
    expect(lesson?.order).toBe(1);
    expect(findGrammarLesson("missing")).toBeUndefined();
    expect(grammarExampleId("copula", 0)).toBe("grammar_copula_1");
    expect(GRAMMAR_SENTENCE_LINES[0]).toEqual({
      id: "grammar_copula_1",
      text: GRAMMAR_LESSONS[0].examples[0].ko,
    });
  });
});

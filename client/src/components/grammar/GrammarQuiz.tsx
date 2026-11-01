import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChoiceButton } from "@/components/practice/ChoiceButton";
import type { GrammarLesson } from "@/lib/grammar";

interface GrammarQuizProps {
  lesson: GrammarLesson;
  best?: { correct: number; total: number };
  onComplete: (correct: number, total: number) => void;
}

const LETTERS = ["A", "B", "C", "D"];

export function GrammarQuiz({ lesson, best, onComplete }: GrammarQuizProps) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = lesson.quiz[index];
  const answered = chosen !== null;
  const isLast = index === lesson.quiz.length - 1;
  const isCorrect = chosen === question?.answerIndex;

  const choose = (optionIndex: number) => {
    if (answered) return;
    setChosen(optionIndex);
    if (optionIndex === question.answerIndex) {
      setCorrectCount(count => count + 1);
    }
  };

  const next = () => {
    if (!answered) return;
    if (isLast) {
      setFinished(true);
      onComplete(correctCount, lesson.quiz.length);
      return;
    }
    setIndex(value => value + 1);
    setChosen(null);
  };

  const retake = () => {
    setIndex(0);
    setChosen(null);
    setCorrectCount(0);
    setFinished(false);
  };

  if (finished) {
    const perfect = correctCount === lesson.quiz.length;
    return (
      <section
        aria-labelledby="grammar-quiz-result"
        className="rounded-2xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/40 p-5 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
          Check complete
        </p>
        <h3
          id="grammar-quiz-result"
          className="mt-2 font-serif text-2xl text-foreground"
        >
          {correctCount} of {lesson.quiz.length} correct
        </h3>
        <p className="mt-2 text-sm text-foreground/70">
          {perfect
            ? "You have this pattern. Review it once more in a few days."
            : "Read the explanation above, then try the check again."}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 gap-2 border-emerald-300 dark:border-emerald-700 bg-card text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          onClick={retake}
        >
          <RotateCcw size={15} />
          Retake the check
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="grammar-quiz-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h3
          id="grammar-quiz-heading"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300"
        >
          Check yourself
        </h3>
        <span className="text-xs font-medium text-foreground/70">
          {index + 1} / {lesson.quiz.length}
          {best ? ` · best ${best.correct}/${best.total}` : ""}
        </span>
      </div>

      <p
        className="mt-3 rounded-xl bg-card px-4 py-3 text-lg font-semibold text-foreground ring-1 ring-border"
        lang={/[가-힣]/.test(question.prompt) ? "ko" : undefined}
      >
        {question.prompt}
      </p>

      <div className="mt-3 space-y-2">
        {question.options.map((option, optionIndex) => (
          <ChoiceButton
            key={option}
            letter={LETTERS[optionIndex]}
            label={option}
            labelLang={/[가-힣]/.test(option) ? "ko" : undefined}
            answered={answered}
            chosen={chosen === optionIndex}
            correct={optionIndex === question.answerIndex}
            onChoose={() => choose(optionIndex)}
          />
        ))}
      </div>

      <div aria-live="polite">
        {answered && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <p
              className={`text-sm font-semibold ${isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}
            >
              {isCorrect ? "Correct." : "Not quite."}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/70">
              {question.explanation}
            </p>
            <Button
              type="button"
              className="mt-3 min-h-11 w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              onClick={next}
            >
              {isLast ? "See result" : "Next question"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

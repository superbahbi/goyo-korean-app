import { useRef } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChoiceButton } from "@/components/practice/ChoiceButton";
import { PracticeFeedback } from "@/components/practice/PracticeFeedback";
import { useQuestionLoop } from "@/components/practice/useQuestionLoop";
import type { GrammarLesson, GrammarQuizQuestion } from "@/lib/grammar";

interface GrammarQuizProps {
  lesson: GrammarLesson;
  best?: { correct: number; total: number };
  onComplete: (correct: number, total: number) => void;
}

interface GrammarQuestion {
  question: GrammarQuizQuestion;
  answerId: string;
}

const LETTERS = ["A", "B", "C", "D"];

export function GrammarQuiz({ lesson, best, onComplete }: GrammarQuizProps) {
  const reportedComplete = useRef(false);

  const { state, current, verdict, answer, next, restart } =
    useQuestionLoop<GrammarQuestion>(() =>
      lesson.quiz.map(question => ({
        question,
        answerId: String(question.answerIndex),
      }))
    );

  const { answered, isCorrect, isLast } = verdict;

  const choose = (optionIndex: number) => {
    if (answered) return;
    answer(String(optionIndex));
  };

  const advance = () => {
    if (!answered) return;
    const result = next();
    // The summary replaces the check immediately; report it once even if a
    // second click lands before the result renders.
    if (result.completed && !reportedComplete.current) {
      reportedComplete.current = true;
      onComplete(result.correctCount, result.questions.length);
    }
  };

  const retake = () => {
    reportedComplete.current = false;
    restart();
  };

  if (state.completed || !current) {
    const perfect = state.correctCount === state.questions.length;
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
          {state.correctCount} of {state.questions.length} correct
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

  const question = current.question;

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
          {state.index + 1} / {state.questions.length}
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
            chosen={state.selectedId === String(optionIndex)}
            correct={String(optionIndex) === verdict.correctId}
            onChoose={() => choose(optionIndex)}
          />
        ))}
      </div>

      <PracticeFeedback
        answered={answered}
        correct={isCorrect}
        correctText="Correct."
        wrongText="Not quite."
        detail={question.explanation}
        className="mt-4 border-border bg-card p-4 text-left"
        textClassName="text-sm"
        detailClassName="leading-relaxed text-foreground/70"
        animate={false}
        action={
          <Button
            type="button"
            className="mt-3 min-h-11 w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            onClick={advance}
          >
            {isLast ? "See result" : "Next question"}
          </Button>
        }
      />
    </section>
  );
}

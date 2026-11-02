import { Badge } from "@/components/ui/badge";
import { Check, RotateCcw } from "lucide-react";
import { type VocabularyCard } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";
import { shuffle } from "@/lib/shuffle";
import { pickDistractors } from "@/lib/practiceDistractors";
import { ChoiceButton } from "@/components/practice/ChoiceButton";
import { PracticeComplete } from "@/components/practice/PracticeComplete";
import { PracticeFeedback } from "@/components/practice/PracticeFeedback";
import {
  PracticePrimaryButton,
  PracticeShell,
} from "@/components/practice/PracticeShell";
import { SCENARIOS } from "@/components/practice/scenarios";
import { ScenarioPrompt } from "@/components/practice/ScenarioPrompt";
import { useQuestionLoop } from "@/components/practice/useQuestionLoop";

interface ScenarioPracticeProps {
  cards: VocabularyCard[];
  onGrade: (cardId: string, rating: "again" | "good") => void;
  onClose: () => void;
}

interface ScenarioQuestion {
  scenario: (typeof SCENARIOS)[number];
  card: VocabularyCard;
  choices: VocabularyCard[];
  answerId: string;
}

const DISTRACTOR_COUNT = 2;

export function ScenarioPractice({
  cards,
  onGrade,
  onClose,
}: ScenarioPracticeProps) {
  const { state, current, answer, next, restart } =
    useQuestionLoop<ScenarioQuestion>(() => {
      const cardMap = new Map(cards.map(card => [card.id, card]));
      // Scenarios only use cards the learner has already met, so this mode
      // never introduces a brand-new phrase.
      const availableScenarios = shuffle(
        SCENARIOS.flatMap(scenario => {
          const card = cardMap.get(scenario.cardId);
          return card ? [{ scenario, card }] : [];
        })
      );

      return availableScenarios.map(({ scenario, card }) => {
        const distractors = pickDistractors(cards, {
          count: DISTRACTOR_COUNT,
          correctCardId: card.id,
          // Prefer survival phrases, then any reviewed card, and never repeat
          // a phrase.
          dedupeKey: candidate => candidate.front,
          preferTag: "survival",
        });
        return {
          scenario,
          card,
          answerId: card.id,
          choices: shuffle([card, ...distractors]),
        };
      });
    });

  const answered = state.verdict !== "unanswered";
  const isCorrect = state.verdict === "correct";
  const isLast = state.index === state.questions.length - 1;

  const closePractice = () => {
    stopAudio();
    onClose();
  };

  if (state.questions.length === 0) {
    return (
      <PracticeShell
        title="Nothing to practice yet"
        description="Scenarios reuse phrases you have already studied, so nothing new is introduced here. Review a few survival phrases in a daily session, then come back."
        tone="rose"
        closeLabel="Close scenario practice"
        onClose={closePractice}
        footer={
          <PracticePrimaryButton onClick={closePractice}>
            Back to dashboard
          </PracticePrimaryButton>
        }
      >
        <p className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-center text-sm leading-relaxed text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-100">
          Scenarios are drawn only from cards you have already reviewed, so the
          daily queue is the fastest way to unlock them.
        </p>
      </PracticeShell>
    );
  }

  if (state.completed || !current) {
    return (
      <PracticeComplete
        title="Scenario practice complete"
        eyebrow="Scenario practice complete"
        heading="You used Korean in context"
        icon={<Check size={34} />}
        tone="rose"
        closeLabel="Return to dashboard"
        restartLabel={
          <>
            Practice again <RotateCcw size={16} className="ml-2" />
          </>
        }
        restartClassName="bg-emerald-700 hover:bg-emerald-800"
        onClose={closePractice}
        onRestart={restart}
      >
        You chose the useful phrase in <strong>{state.correctCount}</strong> of{" "}
        {state.questions.length} situations.
      </PracticeComplete>
    );
  }

  const choose = (card: VocabularyCard) => {
    if (answered) return;
    const result = answer(card.id);
    onGrade(current.card.id, result.verdict === "correct" ? "good" : "again");
  };

  const nextScenario = () => {
    if (!answered) return;
    if (isLast) stopAudio();
    next();
  };

  return (
    <PracticeShell
      title="What would you say?"
      badge={
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900/50">
          {current.scenario.place}
        </Badge>
      }
      description={current.scenario.prompt}
      tone="rose"
      closeLabel="Close scenario practice"
      onClose={closePractice}
      progress={(state.index / state.questions.length) * 100}
      progressLabel="Scenario progress"
      counter={`${state.index + 1} / ${state.questions.length}`}
      status="Survival Korean"
      center
      footer={
        answered ? (
          <PracticePrimaryButton onClick={nextScenario}>
            {isLast ? "See results" : "Next situation"}
          </PracticePrimaryButton>
        ) : undefined
      }
    >
      <ScenarioPrompt
        onHear={() => void playVocabularyAudio(current.card.id)}
      />

      <div className="mt-5 grid gap-3">
        {current.choices.map((choice, choiceIndex) => (
          <ChoiceButton
            key={choice.id}
            letter={String.fromCharCode(65 + choiceIndex)}
            label={choice.front}
            labelLang="ko"
            answered={answered}
            chosen={state.selectedId === choice.id}
            correct={choice.id === current.card.id}
            onChoose={() => choose(choice)}
          />
        ))}
      </div>

      <PracticeFeedback
        answered={answered}
        correct={isCorrect}
        correctText="That fits the situation."
        wrongText={
          <>
            A useful answer is “<span lang="ko">{current.card.front}</span>”.
          </>
        }
        detail={
          <>
            {current.card.back} · <span lang="ko">{current.card.example}</span>
          </>
        }
      />
    </PracticeShell>
  );
}

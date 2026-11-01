import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, RotateCcw } from "lucide-react";
import { type VocabularyCard } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";
import { shuffle } from "@/lib/shuffle";
import { ChoiceButton } from "@/components/practice/ChoiceButton";
import { PracticeComplete } from "@/components/practice/PracticeComplete";
import { PracticeFeedback } from "@/components/practice/PracticeFeedback";
import {
  PracticePrimaryButton,
  PracticeShell,
} from "@/components/practice/PracticeShell";
import { SCENARIOS } from "@/components/practice/scenarios";
import { ScenarioPrompt } from "@/components/practice/ScenarioPrompt";

interface ScenarioPracticeProps {
  cards: VocabularyCard[];
  onGrade: (cardId: string, rating: "again" | "good") => void;
  onClose: () => void;
}

export function ScenarioPractice({
  cards,
  onGrade,
  onClose,
}: ScenarioPracticeProps) {
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [complete, setComplete] = useState(false);
  const [round, setRound] = useState(0);

  const cardMap = useMemo(
    () => new Map(cards.map(card => [card.id, card])),
    [cards]
  );
  // Scenarios only use cards the learner has already met, so this mode never
  // introduces a brand-new phrase.
  const availableScenarios = useMemo(
    () => SCENARIOS.filter(scenario => cardMap.has(scenario.cardId)),
    [cardMap]
  );
  const scenarios = useMemo(() => {
    // Reading the round counter is what forces a fresh order after restart.
    void round;
    return shuffle(availableScenarios);
  }, [availableScenarios, round]);
  const current = scenarios[index];
  const currentCard = current ? cardMap.get(current.cardId) : undefined;

  const choices = useMemo(() => {
    if (!currentCard) return [];
    const pool = shuffle(cards.filter(card => card.id !== currentCard.id));
    // Prefer survival phrases, then any reviewed card, and never repeat a phrase.
    const ordered = [
      ...pool.filter(card => card.tag === "survival"),
      ...pool.filter(card => card.tag !== "survival"),
    ];
    const seen = new Set([currentCard.front]);
    const distractors: VocabularyCard[] = [];
    for (const card of ordered) {
      if (seen.has(card.front)) continue;
      seen.add(card.front);
      distractors.push(card);
      if (distractors.length === 2) break;
    }
    return shuffle([currentCard, ...distractors]);
  }, [cards, currentCard]);

  const closePractice = () => {
    stopAudio();
    onClose();
  };

  if (scenarios.length === 0) {
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

  if (complete) {
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
        onRestart={() => {
          setIndex(0);
          setSelectedId(null);
          setScore(0);
          setComplete(false);
          setRound(value => value + 1);
        }}
      >
        You chose the useful phrase in <strong>{score}</strong> of{" "}
        {scenarios.length} situations.
      </PracticeComplete>
    );
  }

  if (!current || !currentCard) return null;
  const answered = selectedId !== null;
  const isCorrect = selectedId === currentCard.id;

  const choose = (card: VocabularyCard) => {
    if (answered) return;
    setSelectedId(card.id);
    const correct = card.id === currentCard.id;
    if (correct) setScore(value => value + 1);
    onGrade(currentCard.id, correct ? "good" : "again");
  };

  const next = () => {
    if (index === scenarios.length - 1) {
      stopAudio();
      setComplete(true);
    } else {
      setIndex(value => value + 1);
      setSelectedId(null);
    }
  };

  return (
    <PracticeShell
      title="What would you say?"
      badge={
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900/50">
          {current.place}
        </Badge>
      }
      description={current.prompt}
      tone="rose"
      closeLabel="Close scenario practice"
      onClose={closePractice}
      progress={(index / scenarios.length) * 100}
      progressLabel="Scenario progress"
      counter={`${index + 1} / ${scenarios.length}`}
      status="Survival Korean"
      center
      footer={
        answered ? (
          <PracticePrimaryButton onClick={next}>
            {index === scenarios.length - 1 ? "See results" : "Next situation"}
          </PracticePrimaryButton>
        ) : undefined
      }
    >
      <ScenarioPrompt onHear={() => void playVocabularyAudio(currentCard.id)} />

      <div className="mt-5 grid gap-3">
        {choices.map((choice, choiceIndex) => (
          <ChoiceButton
            key={choice.id}
            letter={String.fromCharCode(65 + choiceIndex)}
            label={choice.front}
            labelLang="ko"
            answered={answered}
            chosen={selectedId === choice.id}
            correct={choice.id === currentCard.id}
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
            A useful answer is “<span lang="ko">{currentCard.front}</span>”.
          </>
        }
        detail={
          <>
            {currentCard.back} · <span lang="ko">{currentCard.example}</span>
          </>
        }
      />
    </PracticeShell>
  );
}

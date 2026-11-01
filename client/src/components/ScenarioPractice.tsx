import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, RotateCcw, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { type VocabularyCard } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";
import { shuffle } from "@/lib/shuffle";
import { ChoiceButton } from "@/components/practice/ChoiceButton";
import { PracticeComplete } from "@/components/practice/PracticeComplete";
import { SCENARIOS } from "@/components/practice/scenarios";
import { ScenarioPrompt } from "@/components/practice/ScenarioPrompt";
import { ScenarioVerdict } from "@/components/practice/ScenarioVerdict";

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
      <Dialog
        open
        onOpenChange={open => {
          if (!open) closePractice();
        }}
      >
        <DialogContent
          aria-modal="true"
          aria-describedby={undefined}
          showCloseButton={false}
          className="max-w-md rounded-3xl"
        >
          <DialogTitle>Nothing to practice yet</DialogTitle>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            Scenarios reuse phrases you have already studied, so nothing new is
            introduced here. Review a few survival phrases in a daily session,
            then come back.
          </p>
          <Button className="mt-5 min-h-12 w-full" onClick={closePractice}>
            Back to dashboard
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  if (complete) {
    return (
      <PracticeComplete
        title="You used Korean in context"
        eyebrow="Scenario practice complete"
        heading="You used Korean in context"
        icon={<Check size={34} />}
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
    <Dialog
      open
      onOpenChange={open => {
        if (!open) closePractice();
      }}
    >
      <DialogContent
        aria-modal="true"
        aria-describedby={undefined}
        showCloseButton={false}
        className="inset-0 top-0 left-0 z-50 flex h-[100dvh] max-h-[100dvh] min-h-0 max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-gradient-to-br from-amber-50 dark:from-amber-950 via-background to-emerald-50 dark:to-emerald-950 p-0 shadow-none sm:max-w-none"
      >
        <DialogTitle className="sr-only">What would you say?</DialogTitle>
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-card/80 p-4 backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={closePractice}
            aria-label="Close scenario practice"
          >
            <X size={20} />
          </Button>
          <div className="max-w-xs flex-1 px-4">
            <Progress
              value={(index / scenarios.length) * 100}
              aria-label="Scenario progress"
              className="h-2"
            />
          </div>
          <div className="min-w-[60px] text-right text-sm font-semibold text-muted-foreground">
            {index + 1} / {scenarios.length}
            <span className="block text-xs text-muted-foreground">
              Survival Korean
            </span>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-2xl">
            <ScenarioPrompt
              place={current.place}
              prompt={current.prompt}
              onHear={() => void playVocabularyAudio(currentCard.id)}
            />
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
                  sizeClass="min-h-16"
                  correctIcon={<Check size={20} />}
                  wrongIcon={<X size={20} />}
                />
              ))}
            </div>
            <ScenarioVerdict
              card={currentCard}
              answered={answered}
              correct={isCorrect}
              isLast={index === scenarios.length - 1}
              onNext={next}
            />
          </div>
        </main>
      </DialogContent>
    </Dialog>
  );
}

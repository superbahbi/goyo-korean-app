import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, RotateCcw, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { VocabularyCard } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";
import { shuffle } from "@/lib/shuffle";
import { ChoiceButton } from "@/components/practice/ChoiceButton";
import { ListeningPrompt } from "@/components/practice/ListeningPrompt";
import { ListeningVerdict } from "@/components/practice/ListeningVerdict";
import { PracticeComplete } from "@/components/practice/PracticeComplete";

interface ListeningPracticeProps {
  cards: VocabularyCard[];
  onGrade: (cardId: string, rating: "again" | "good") => void;
  onClose: () => void;
}

const QUESTION_COUNT = 10;

type AnswerState = "unanswered" | "correct" | "incorrect";

export function ListeningPractice({
  cards,
  onGrade,
  onClose,
}: ListeningPracticeProps) {
  // The caller orders due and weak cards first; keep that order so the session
  // starts with what is actually slipping, and only shuffle the alternatives.
  const questions = useMemo(() => cards.slice(0, QUESTION_COUNT), [cards]);
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [isPlaying, setIsPlaying] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [round, setRound] = useState(0);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const currentCard = questions[index];
  const isComplete = !currentCard;

  const choices = useMemo(() => {
    // Reading the round counter is what forces fresh choices after restart.
    void round;
    if (!currentCard) return [];
    // Distractors must differ in meaning, not just in card id.
    const seen = new Set([currentCard.back.trim().toLowerCase()]);
    const distractors: { id: string; text: string }[] = [];
    for (const card of shuffle(cards)) {
      if (card.id === currentCard.id) continue;
      const meaning = card.back.trim().toLowerCase();
      if (seen.has(meaning)) continue;
      seen.add(meaning);
      distractors.push({ id: card.id, text: card.back });
      if (distractors.length === 3) break;
    }
    return shuffle([
      { id: currentCard.id, text: currentCard.back },
      ...distractors,
    ]);
  }, [cards, currentCard, round]);

  useEffect(() => () => stopAudio(), []);

  useEffect(() => {
    if (answerState !== "unanswered") nextButtonRef.current?.focus();
  }, [answerState]);

  const closePractice = () => {
    stopAudio();
    onClose();
  };

  if (isComplete) {
    return (
      <PracticeComplete
        title="A quiet step forward"
        eyebrow="Listening complete"
        heading="A quiet step forward"
        icon={<CheckCircle2 size={34} />}
        closeLabel="Done"
        restartLabel={
          <>
            <RotateCcw size={16} className="mr-2" />
            Practice again
          </>
        }
        restartClassName="bg-emerald-600 hover:bg-emerald-700"
        onClose={closePractice}
        onRestart={() => {
          setIndex(0);
          setCorrectCount(0);
          setSelectedAnswer(null);
          setAnswerState("unanswered");
          setRound(value => value + 1);
        }}
      >
        You recognized <strong>{correctCount}</strong> of {questions.length}{" "}
        Korean recordings.
      </PracticeComplete>
    );
  }

  const playCurrent = async () => {
    if (isPlaying || !currentCard) return;
    setIsPlaying(true);
    try {
      await playVocabularyAudio(currentCard.id);
    } finally {
      setIsPlaying(false);
    }
  };

  const chooseAnswer = (choiceId: string) => {
    if (answerState !== "unanswered") return;
    const correct = choiceId === currentCard.id;
    setSelectedAnswer(choiceId);
    setAnswerState(correct ? "correct" : "incorrect");
    if (correct) setCorrectCount(count => count + 1);
    onGrade(currentCard.id, correct ? "good" : "again");
  };

  const nextQuestion = () => {
    stopAudio();
    setIndex(value => value + 1);
    setSelectedAnswer(null);
    setAnswerState("unanswered");
  };

  const answered = answerState !== "unanswered";

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
        className="inset-0 top-0 left-0 z-50 flex h-[100dvh] max-h-[100dvh] min-h-0 max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100 p-0 shadow-none sm:max-w-none"
      >
        <DialogTitle className="sr-only">What did you hear?</DialogTitle>
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={closePractice}
            aria-label="Close listening practice"
          >
            <X size={20} />
          </Button>
          <div className="flex-1 px-5">
            <Progress
              value={(index / questions.length) * 100}
              aria-label="Listening progress"
              className="h-2"
            />
          </div>
          <div className="min-w-[70px] text-right text-sm font-semibold text-slate-500">
            {index + 1} / {questions.length}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 [scrollbar-gutter:stable] sm:px-5 sm:py-8">
          <div className="mx-auto flex w-full max-w-2xl flex-col justify-start sm:min-h-full sm:justify-center">
            <div className="mb-5 text-center sm:mb-6">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Listening practice
              </Badge>
              <h1 className="mt-3 font-serif text-2xl text-slate-900 sm:mt-4 sm:text-3xl">
                What did you hear?
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Listen first. Choose the meaning that matches the Korean
                recording.
              </p>
            </div>

            <ListeningPrompt
              key={currentCard.id}
              card={currentCard}
              isPlaying={isPlaying}
              revealed={answered}
              onPlay={playCurrent}
            />

            <div className="mt-6 grid gap-3">
              {choices.map((choice, choiceIndex) => (
                <ChoiceButton
                  key={choice.id}
                  letter={String.fromCharCode(65 + choiceIndex)}
                  label={choice.text}
                  answered={answered}
                  chosen={selectedAnswer === choice.id}
                  correct={choice.id === currentCard.id}
                  onChoose={() => chooseAnswer(choice.id)}
                  sizeClass="min-h-14 text-sm"
                  correctIcon={<CheckCircle2 size={20} />}
                  wrongIcon={<XCircle size={20} />}
                />
              ))}
            </div>

            <ListeningVerdict
              card={currentCard}
              answered={answered}
              correct={answerState === "correct"}
              isLast={index === questions.length - 1}
              nextButtonRef={nextButtonRef}
              onNext={nextQuestion}
            />
          </div>
        </main>
      </DialogContent>
    </Dialog>
  );
}

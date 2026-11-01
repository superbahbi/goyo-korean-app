import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VocabularyCard } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";
import { shuffle } from "@/lib/shuffle";
import { ChoiceButton } from "@/components/practice/ChoiceButton";
import { ListeningPrompt } from "@/components/practice/ListeningPrompt";
import { PracticeComplete } from "@/components/practice/PracticeComplete";
import { PracticeFeedback } from "@/components/practice/PracticeFeedback";
import {
  PracticePrimaryButton,
  PracticeShell,
} from "@/components/practice/PracticeShell";

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
        title="Listening complete"
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
  const isCorrect = answerState === "correct";

  return (
    <PracticeShell
      title="What did you hear?"
      badge={
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50">
          Listening practice
        </Badge>
      }
      description="Listen first. Choose the meaning that matches the Korean recording."
      tone="emerald"
      closeLabel="Close listening practice"
      onClose={closePractice}
      progress={(index / questions.length) * 100}
      progressLabel="Listening progress"
      counter={`${index + 1} / ${questions.length}`}
      status="Listening"
      center
      footer={
        answered ? (
          <PracticePrimaryButton ref={nextButtonRef} onClick={nextQuestion}>
            {index === questions.length - 1 ? "See results" : "Next recording"}
          </PracticePrimaryButton>
        ) : undefined
      }
    >
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
          />
        ))}
      </div>

      <PracticeFeedback
        answered={answered}
        correct={isCorrect}
        correctText="Correct — nice listening."
        wrongText={`The answer is “${currentCard.back}”.`}
        detail={<span lang="ko">{currentCard.example}</span>}
      />
    </PracticeShell>
  );
}

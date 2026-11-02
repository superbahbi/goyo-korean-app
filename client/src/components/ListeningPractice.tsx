import { useEffect, useRef } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VocabularyCard } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";
import { shuffle } from "@/lib/shuffle";
import { pickDistractors } from "@/lib/practiceDistractors";
import { ChoiceButton } from "@/components/practice/ChoiceButton";
import { ListeningPrompt } from "@/components/practice/ListeningPrompt";
import { PracticeComplete } from "@/components/practice/PracticeComplete";
import { PracticeFeedback } from "@/components/practice/PracticeFeedback";
import {
  PracticePrimaryButton,
  PracticeShell,
} from "@/components/practice/PracticeShell";
import { useQuestionLoop } from "@/components/practice/useQuestionLoop";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { ratingForVerdict } from "@/lib/practiceVerdict";

interface ListeningPracticeProps {
  cards: VocabularyCard[];
  onGrade: (cardId: string, rating: "again" | "good") => void;
  onClose: () => void;
}

interface ListeningQuestion {
  card: VocabularyCard;
  choices: { id: string; text: string }[];
  answerId: string;
}

const QUESTION_COUNT = 10;
const DISTRACTOR_COUNT = 3;

export function ListeningPractice({
  cards,
  onGrade,
  onClose,
}: ListeningPracticeProps) {
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const playback = useAudioPlayback();

  const { state, current, verdict, answer, next, restart } =
    useQuestionLoop<ListeningQuestion>(() => {
      // The caller orders due and weak cards first; keep that order so the
      // session starts with what is actually slipping, and only shuffle the
      // alternatives.
      return cards.slice(0, QUESTION_COUNT).map(card => {
        const distractors = pickDistractors(cards, {
          count: DISTRACTOR_COUNT,
          correctCardId: card.id,
          // Distractors must differ in meaning, not just in card id.
          dedupeKey: candidate => candidate.back.trim().toLowerCase(),
        });
        return {
          card,
          answerId: card.id,
          choices: shuffle([
            { id: card.id, text: card.back },
            ...distractors.map(candidate => ({
              id: candidate.id,
              text: candidate.back,
            })),
          ]),
        };
      });
    });

  const { answered, isCorrect, isLast } = verdict;
  const isPlaying =
    playback.playing &&
    playback.clip?.kind === "vocabulary" &&
    playback.clip.id === current?.card.id;

  useEffect(() => () => stopAudio(), []);

  useEffect(() => {
    if (answered) nextButtonRef.current?.focus();
  }, [answered]);

  const closePractice = () => {
    stopAudio();
    onClose();
  };

  if (state.completed || !current) {
    return (
      <PracticeComplete
        title="Listening complete"
        eyebrow="Listening complete"
        heading="A quiet step forward"
        icon={<CheckCircle2 size={34} />}
        tone="emerald"
        closeLabel="Done"
        restartLabel={
          <>
            <RotateCcw size={16} className="mr-2" />
            Practice again
          </>
        }
        restartClassName="bg-emerald-600 hover:bg-emerald-700"
        onClose={closePractice}
        onRestart={restart}
      >
        You recognized <strong>{state.correctCount}</strong> of{" "}
        {state.questions.length} Korean recordings.
      </PracticeComplete>
    );
  }

  const playCurrent = () => {
    if (isPlaying) return;
    void playVocabularyAudio(current.card.id);
  };

  const chooseAnswer = (choiceId: string) => {
    if (answered) return;
    const result = answer(choiceId);
    onGrade(current.card.id, ratingForVerdict(result.verdict === "correct"));
  };

  const nextQuestion = () => {
    stopAudio();
    next();
  };

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
      progress={(state.index / state.questions.length) * 100}
      progressLabel="Listening progress"
      counter={`${state.index + 1} / ${state.questions.length}`}
      status="Listening"
      center
      footer={
        answered ? (
          <PracticePrimaryButton ref={nextButtonRef} onClick={nextQuestion}>
            {isLast ? "See results" : "Next recording"}
          </PracticePrimaryButton>
        ) : undefined
      }
    >
      <ListeningPrompt
        key={current.card.id}
        card={current.card}
        isPlaying={isPlaying}
        revealed={answered}
        onPlay={playCurrent}
      />

      <div className="mt-6 grid gap-3">
        {current.choices.map((choice, choiceIndex) => (
          <ChoiceButton
            key={choice.id}
            letter={String.fromCharCode(65 + choiceIndex)}
            label={choice.text}
            answered={answered}
            chosen={state.selectedId === choice.id}
            correct={choice.id === verdict.correctId}
            onChoose={() => chooseAnswer(choice.id)}
          />
        ))}
      </div>

      <PracticeFeedback
        answered={answered}
        correct={isCorrect}
        correctText="Correct — nice listening."
        wrongText={`The answer is “${current.card.back}”.`}
        detail={<span lang="ko">{current.card.example}</span>}
      />
    </PracticeShell>
  );
}

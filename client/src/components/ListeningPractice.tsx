import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, RotateCcw, Volume2, X, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VocabularyCard } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";

interface ListeningPracticeProps {
  cards: VocabularyCard[];
  onGrade: (cardId: string, rating: "again" | "good") => void;
  onClose: () => void;
}

const QUESTION_COUNT = 10;

type AnswerState = "unanswered" | "correct" | "incorrect";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function ListeningPractice({ cards, onGrade, onClose }: ListeningPracticeProps) {
  const questions = useMemo(() => shuffle(cards).slice(0, QUESTION_COUNT), [cards]);
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [isPlaying, setIsPlaying] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentCard = questions[index];
  const isComplete = !currentCard;

  const choices = useMemo(() => {
    if (!currentCard) return [];
    const distractors = shuffle(cards.filter((card) => card.id !== currentCard.id))
      .slice(0, 3)
      .map((card) => ({ id: card.id, text: card.back }));
    return shuffle([{ id: currentCard.id, text: currentCard.back }, ...distractors]);
  }, [cards, currentCard]);

  useEffect(() => () => stopAudio(), []);

  const closePractice = () => {
    stopAudio();
    onClose();
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={34} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Listening complete</p>
          <h2 className="mt-2 font-serif text-3xl text-slate-900">A quiet step forward</h2>
          <p className="mt-3 text-slate-600">
            You recognized <strong>{correctCount}</strong> of {questions.length} Korean recordings.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="min-h-12 flex-1" onClick={closePractice}>Done</Button>
            <Button className="min-h-12 flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => {
              setIndex(0);
              setCorrectCount(0);
              setSelectedAnswer(null);
              setAnswerState("unanswered");
            }}>
              <RotateCcw size={16} className="mr-2" />
              Practice again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const playCurrent = async () => {
    if (isPlaying || !currentCard) return;
    setIsPlaying(true);
    try {
      await playVocabularyAudio(currentCard.id, currentCard.front);
    } finally {
      setIsPlaying(false);
    }
  };

  const chooseAnswer = (choiceId: string) => {
    if (answerState !== "unanswered") return;
    const correct = choiceId === currentCard.id;
    setSelectedAnswer(choiceId);
    setAnswerState(correct ? "correct" : "incorrect");
    if (correct) setCorrectCount((count) => count + 1);
    onGrade(currentCard.id, correct ? "good" : "again");
  };

  const nextQuestion = () => {
    stopAudio();
    setIndex((value) => value + 1);
    setSelectedAnswer(null);
    setAnswerState("unanswered");
  };

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4">
        <Button variant="ghost" size="icon" onClick={closePractice} aria-label="Close listening practice">
          <X size={20} />
        </Button>
        <div className="flex-1 px-5">
          <Progress value={(index / questions.length) * 100} className="h-2" />
        </div>
        <div className="min-w-[70px] text-right text-sm font-semibold text-slate-500">
          {index + 1} / {questions.length}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 [scrollbar-gutter:stable] sm:px-5 sm:py-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col justify-start sm:min-h-full sm:justify-center">
        <div className="mb-5 text-center sm:mb-6">
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Listening practice</Badge>
          <h1 className="mt-3 font-serif text-2xl text-slate-900 sm:mt-4 sm:text-3xl">What did you hear?</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">Listen first. Choose the meaning that matches the Korean recording.</p>
        </div>

        <motion.div
          key={currentCard.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-emerald-100 bg-white p-5 text-center shadow-xl shadow-emerald-100/50 sm:p-7"
        >
          <Button
            size="lg"
            onClick={playCurrent}
            disabled={isPlaying}
            className="mx-auto flex h-24 w-24 flex-col gap-1 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 sm:h-28 sm:w-28 sm:gap-2"
            aria-label="Play Korean recording"
          >
            <Volume2 size={34} className={isPlaying ? "animate-pulse" : ""} />
            <span className="text-xs">{isPlaying ? "Playing" : "Play"}</span>
          </Button>
          <p className="mt-4 text-sm text-slate-400">Replay as many times as you need</p>

          {answerState !== "unanswered" && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-4xl font-bold tracking-wide text-slate-900">{currentCard.front}</p>
              <p className="mt-2 font-mono text-emerald-600">{currentCard.romanization}</p>
            </div>
          )}
        </motion.div>

        <div className="mt-6 grid gap-3">
          {choices.map((choice, choiceIndex) => {
            const isSelected = selectedAnswer === choice.id;
            const isCorrect = choice.id === currentCard.id;
            const statusClass = answerState === "unanswered"
              ? "border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50"
              : isCorrect
                ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                : isSelected
                  ? "border-red-300 bg-red-50 text-red-800"
                  : "border-slate-100 bg-white/70 text-slate-400";
            return (
              <button
                key={choice.id}
                disabled={answerState !== "unanswered"}
                onClick={() => chooseAnswer(choice.id)}
                className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 p-4 text-left text-sm font-semibold transition-all ${statusClass}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                  {String.fromCharCode(65 + choiceIndex)}
                </span>
                <span className="flex-1">{choice.text}</span>
                {answerState !== "unanswered" && isCorrect && <CheckCircle2 size={20} />}
                {answerState !== "unanswered" && isSelected && !isCorrect && <XCircle size={20} />}
              </button>
            );
          })}
        </div>

        {answerState !== "unanswered" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl bg-white/80 p-4 text-center">
            <p className={`font-semibold ${answerState === "correct" ? "text-emerald-700" : "text-red-700"}`}>
              {answerState === "correct" ? "Correct — nice listening." : `The answer is “${currentCard.back}”.`}
            </p>
            <p className="mt-1 text-sm text-slate-500">{currentCard.example}</p>
            <Button onClick={nextQuestion} className="mt-4 min-h-12 w-full bg-slate-900 hover:bg-slate-800">
              {index === questions.length - 1 ? "See results" : "Next recording"}
              <ArrowLeft size={16} className="ml-2 rotate-180" />
            </Button>
          </motion.div>
        )}
        </div>
      </main>
    </div>
  );
}

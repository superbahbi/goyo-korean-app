import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Eye,
  Headphones,
  Mic,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { type VocabularyCard } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";
import { PracticeComplete } from "@/components/practice/PracticeComplete";
import {
  PracticePrimaryButton,
  PracticeShell,
} from "@/components/practice/PracticeShell";

interface ShadowingPracticeProps {
  cards: VocabularyCard[];
  onGrade: (cardId: string, rating: "again" | "good") => void;
  onClose: () => void;
}

export function ShadowingPractice({
  cards,
  onGrade,
  onClose,
}: ShadowingPracticeProps) {
  const queue = useMemo(
    () =>
      cards
        .filter(card => card.tag === "survival" || card.tag === "daily")
        .slice(0, 8),
    [cards]
  );
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [shadowed, setShadowed] = useState(false);
  const [complete, setComplete] = useState(false);
  const currentCard = queue[index];

  useEffect(() => {
    if (!currentCard || complete) return;
    const timer = window.setTimeout(
      () => void playVocabularyAudio(currentCard.id),
      300
    );
    return () => window.clearTimeout(timer);
  }, [currentCard, complete]);

  useEffect(() => () => stopAudio(), []);

  const close = () => {
    stopAudio();
    onClose();
  };

  const restart = () => {
    stopAudio();
    setIndex(0);
    setVisible(false);
    setShadowed(false);
    setComplete(false);
  };

  const next = () => {
    if (!currentCard) return;
    onGrade(currentCard.id, shadowed ? "good" : "again");
    if (index === queue.length - 1) {
      stopAudio();
      setComplete(true);
    } else {
      setIndex(value => value + 1);
      setVisible(false);
      setShadowed(false);
    }
  };

  if (complete) {
    return (
      <PracticeComplete
        title="Shadowing complete"
        eyebrow="Shadowing complete"
        heading="Your Korean had a voice"
        icon={<Mic size={34} />}
        closeLabel="Return to dashboard"
        restartLabel={
          <>
            <RotateCcw size={16} className="mr-2" />
            Practice again
          </>
        }
        restartClassName="bg-violet-600 hover:bg-violet-700"
        onClose={close}
        onRestart={restart}
      >
        You practiced matching the rhythm and sound of {queue.length} Korean
        phrases.
      </PracticeComplete>
    );
  }

  if (!currentCard) return null;

  return (
    <PracticeShell
      title="Match the model"
      badge={
        <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/50 dark:text-violet-300 dark:hover:bg-violet-900/50">
          Listen → imitate
        </Badge>
      }
      description="Listen once, then speak at the same time. Reveal the text only when you need support."
      tone="violet"
      closeLabel="Close shadowing practice"
      onClose={close}
      progress={(index / queue.length) * 100}
      progressLabel="Shadowing progress"
      counter={`${index + 1} / ${queue.length}`}
      status="Shadowing"
      center
      footer={
        <PracticePrimaryButton onClick={next}>
          {index === queue.length - 1 ? "Finish shadowing" : "Next phrase"}
        </PracticePrimaryButton>
      }
    >
      <div className="rounded-3xl border border-violet-100 bg-card p-6 shadow-xl shadow-violet-100/40 dark:border-violet-900/60 dark:shadow-black/20 sm:p-8">
        <Button
          onClick={() => void playVocabularyAudio(currentCard.id)}
          className="mx-auto flex h-28 w-28 flex-col gap-2 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-200 hover:bg-violet-700 dark:shadow-black/40"
        >
          <Volume2 size={36} />
          <span className="text-xs">Play model</span>
        </Button>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Replay as many times as you need.
        </p>
        {visible ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-7 border-t border-border/70 pt-6 text-center"
          >
            <p
              className="text-4xl font-bold tracking-wide text-foreground"
              lang="ko"
            >
              {currentCard.front}
            </p>
            <p className="mt-2 font-mono text-emerald-700 dark:text-emerald-300">
              {currentCard.romanization}
            </p>
            <p className="mt-4 text-sm italic text-muted-foreground" lang="ko">
              {currentCard.example}
            </p>
          </motion.div>
        ) : (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              className="border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800/70 dark:text-violet-300 dark:hover:bg-violet-950/40"
              onClick={() => setVisible(true)}
            >
              <Eye size={16} className="mr-2" /> Reveal Korean
            </Button>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card/80 p-4 text-left">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
          <Headphones
            size={16}
            className="text-violet-600 dark:text-violet-400"
            aria-hidden="true"
          />
          Did you shadow it aloud?
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Mark “I shadowed it” only after you have tried to match the model’s
          rhythm.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant={shadowed ? "default" : "outline"}
            className={
              shadowed
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800/70 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            }
            onClick={() => setShadowed(true)}
          >
            <Check size={16} className="mr-2" /> I shadowed it
          </Button>
          <Button
            variant="outline"
            className="border-border text-foreground/70"
            onClick={() => setShadowed(false)}
          >
            <X size={16} className="mr-2" /> Not yet
          </Button>
        </div>
      </div>
    </PracticeShell>
  );
}

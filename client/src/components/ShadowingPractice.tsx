import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Check, Eye, Headphones, RotateCcw, Volume2, X } from "lucide-react";
import { motion } from "framer-motion";
import { type VocabularyCard } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";

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
      <Dialog
        open
        onOpenChange={open => {
          if (!open) close();
        }}
      >
        <DialogContent
          aria-modal="true"
          aria-describedby={undefined}
          showCloseButton={false}
          className="inset-0 top-0 left-0 z-50 flex max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 overflow-y-auto rounded-none border-0 bg-slate-950/40 p-4 shadow-none backdrop-blur-sm sm:max-w-none"
        >
          <DialogTitle className="sr-only">Your Korean had a voice</DialogTitle>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-2xl"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <Check size={34} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              Shadowing complete
            </p>
            <h2 className="mt-2 font-serif text-3xl text-foreground">
              Your Korean had a voice
            </h2>
            <p className="mt-3 text-foreground/70">
              You practiced matching the rhythm and sound of {queue.length}{" "}
              Korean phrases.
            </p>
            <Button
              className="mt-7 min-h-12 w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={close}
            >
              Return to dashboard
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentCard) return null;

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) close();
      }}
    >
      <DialogContent
        aria-modal="true"
        aria-describedby={undefined}
        showCloseButton={false}
        className="inset-0 top-0 left-0 z-50 flex h-[100dvh] max-h-[100dvh] min-h-0 max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-gradient-to-br from-indigo-50 dark:from-indigo-950 via-background to-emerald-50 dark:to-emerald-950 p-0 shadow-none sm:max-w-none"
      >
        <DialogTitle className="sr-only">Match the model</DialogTitle>
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-card/80 p-4 backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Close shadowing practice"
          >
            <X size={20} />
          </Button>
          <div className="max-w-xs flex-1 px-4">
            <Progress
              value={(index / queue.length) * 100}
              aria-label="Shadowing progress"
              className="h-2"
            />
          </div>
          <div className="min-w-[60px] text-right text-sm font-semibold text-muted-foreground">
            {index + 1} / {queue.length}
            <span className="block text-xs text-muted-foreground/80">
              Shadowing
            </span>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-xl text-center">
            <Badge className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50">
              Listen → imitate
            </Badge>
            <h1 className="mt-4 font-serif text-3xl text-foreground">
              Match the model
            </h1>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Listen once, then speak at the same time. Reveal the text only
              when you need support.
            </p>
            <div className="mt-8 rounded-3xl border border-indigo-100 dark:border-indigo-900/60 bg-card p-6 shadow-xl shadow-indigo-100/40 sm:p-8">
              <Button
                onClick={() => void playVocabularyAudio(currentCard.id)}
                className="mx-auto flex h-28 w-28 flex-col gap-2 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-black/40 hover:bg-indigo-700"
              >
                <Volume2 size={36} />
                <span className="text-xs">Play model</span>
              </Button>
              <p className="mt-5 text-sm text-muted-foreground">
                Replay as many times as you need.
              </p>
              {visible ? (
                <div className="mt-7 border-t border-border/70 pt-6">
                  <p
                    className="text-4xl font-bold tracking-wide text-foreground"
                    lang="ko"
                  >
                    {currentCard.front}
                  </p>
                  <p className="mt-2 font-mono text-emerald-700 dark:text-emerald-300">
                    {currentCard.romanization}
                  </p>
                  <p
                    className="mt-4 text-sm italic text-muted-foreground"
                    lang="ko"
                  >
                    {currentCard.example}
                  </p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="mt-6 border-indigo-200 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  onClick={() => setVisible(true)}
                >
                  <Eye size={16} className="mr-2" /> Reveal Korean
                </Button>
              )}
            </div>
            <div className="mt-5 rounded-2xl border border-border bg-card/80 p-4 text-left">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                <Headphones
                  size={16}
                  className="text-indigo-600 dark:text-indigo-400"
                />{" "}
                Did you shadow it aloud?
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Mark “I shadowed it” only after you have tried to match the
                model’s rhythm.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant={shadowed ? "default" : "outline"}
                  className={
                    shadowed
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
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
            <Button
              onClick={next}
              className="mt-5 min-h-12 w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {index === queue.length - 1 ? "Finish shadowing" : "Next phrase"}
              <RotateCcw size={16} className="ml-2 rotate-180" />
            </Button>
          </div>
        </main>
      </DialogContent>
    </Dialog>
  );
}

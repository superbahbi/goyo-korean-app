import { useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playSentenceAudio, playVocabularyAudio } from "@/lib/audioPlayer";
import type { VocabularyCard } from "@/lib/vocabulary";

interface NewCardIntroProps {
  card: VocabularyCard;
  /** Respects the learner's auto-play setting; replay always works. */
  autoPlayAudio?: boolean;
  /** True when the example sentence has a generated clip to play. */
  sentenceAudioReady?: boolean;
  onStart: () => void;
}

/**
 * First meeting with a word. This is a presentation step, not a review: it has
 * no grade controls and never touches card state, the queue, or the schedule.
 */
export function NewCardIntro({
  card,
  autoPlayAudio = true,
  sentenceAudioReady = false,
  onStart,
}: NewCardIntroProps) {
  // Auto-play the pronunciation once per word, not on every re-render.
  const autoPlayedId = useRef<string | null>(null);

  useEffect(() => {
    if (!autoPlayAudio || autoPlayedId.current === card.id) return;
    const timer = window.setTimeout(() => {
      autoPlayedId.current = card.id;
      void playVocabularyAudio(card.id);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [autoPlayAudio, card.id]);

  return (
    <div className="mx-auto mt-2 w-full max-w-md rounded-3xl border border-emerald-200 bg-card/95 p-6 text-center shadow-xl dark:border-emerald-800/70 sm:p-8">
      <p className="inline-flex rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
        New word
      </p>

      <h2
        className="mt-6 text-5xl font-bold tracking-tight text-foreground"
        lang="ko"
      >
        {card.front}
      </h2>
      <p className="mt-3 font-mono text-lg font-semibold text-emerald-700 dark:text-emerald-300">
        {card.romanization}
      </p>
      <p className="mt-4 text-xl font-semibold leading-snug text-foreground">
        {card.back}
      </p>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-left dark:border-emerald-800/70 dark:bg-emerald-950/40">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          In context
        </p>
        <p
          className="mt-2 text-sm italic leading-relaxed text-foreground/80"
          lang="ko"
        >
          “{card.example}”
        </p>
        {card.exampleEnglish && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {card.exampleEnglish}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="rounded-full"
          data-intro-audio
          aria-label={`Play pronunciation for ${card.front}`}
          onClick={() => void playVocabularyAudio(card.id)}
        >
          <Volume2 size={18} />
          Hear it again
        </Button>
        {sentenceAudioReady && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            data-intro-audio
            aria-label={`Hear sentence for ${card.front}`}
            onClick={() => void playSentenceAudio(card.id)}
          >
            <Volume2 size={16} />
            Hear sentence
          </Button>
        )}
      </div>

      <Button
        type="button"
        className="mt-6 h-14 w-full rounded-2xl bg-emerald-700 text-lg font-bold text-white transition-all hover:bg-emerald-800 sm:h-16 sm:text-xl"
        onClick={onStart}
      >
        Start practising
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        Press Enter or Space to continue
      </p>
    </div>
  );
}

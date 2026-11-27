import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playSentenceAudio, playVocabularyAudio } from "@domain/audioPlayer";
import { useAutoPlayOnce } from "@/hooks/useAutoPlayOnce";
import type { VocabularyCard } from "@domain/vocabulary";

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
  useAutoPlayOnce({
    clipId: card.id,
    enabled: autoPlayAudio,
    play: playVocabularyAudio,
  });

  return (
    <div className="mx-auto mt-2 w-full max-w-md rounded-3xl border border-emerald-200 bg-card/95 p-6 text-center shadow-xl dark:border-emerald-800/70 sm:p-8">
      <p className="inline-flex rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
        New word
      </p>

      <h2
        className="mt-6 break-keep text-5xl font-bold tracking-tight text-foreground"
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
          className="mt-2 break-keep text-sm font-medium leading-relaxed text-foreground/90"
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
          className="h-11 rounded-full border border-border px-3.5 font-semibold"
          data-intro-audio
          aria-label={`Hear it again for ${card.front}`}
          onClick={() => void playVocabularyAudio(card.id)}
        >
          <Volume2 size={17} />
          Hear it again
        </Button>
        {sentenceAudioReady && (
          <Button
            type="button"
            variant="secondary"
            className="h-11 rounded-full border border-border px-3.5 font-semibold"
            data-intro-audio
            aria-label={`Hear sentence for ${card.front}`}
            onClick={() => void playSentenceAudio(card.id)}
          >
            <Volume2 size={17} />
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
      <p className="mt-3 hidden text-xs text-muted-foreground pointer-fine:block">
        Press Enter or Space to continue
      </p>
    </div>
  );
}

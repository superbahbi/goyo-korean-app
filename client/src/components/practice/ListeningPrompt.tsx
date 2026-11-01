import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type VocabularyCard } from "@/lib/vocabulary";

interface ListeningPromptProps {
  card: VocabularyCard;
  isPlaying: boolean;
  revealed: boolean;
  onPlay: () => void;
}

export function ListeningPrompt({
  card,
  isPlaying,
  revealed,
  onPlay,
}: ListeningPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-emerald-100 dark:border-emerald-900/60 bg-card p-5 text-center shadow-xl shadow-emerald-100/50 sm:p-7"
    >
      <Button
        size="lg"
        onClick={onPlay}
        disabled={isPlaying}
        className="mx-auto flex h-24 w-24 flex-col gap-1 rounded-full bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-black/40 hover:bg-emerald-800 sm:h-28 sm:w-28 sm:gap-2"
        aria-label="Play Korean recording"
      >
        <Volume2 size={34} className={isPlaying ? "animate-pulse" : ""} />
        <span className="text-xs">{isPlaying ? "Playing" : "Play"}</span>
      </Button>
      <p className="mt-4 text-sm text-muted-foreground">
        Replay as many times as you need
      </p>

      {revealed && (
        <div className="mt-6 border-t border-border/70 pt-5">
          <p
            className="text-4xl font-bold tracking-wide text-foreground"
            lang="ko"
          >
            {card.front}
          </p>
          <p className="mt-2 font-mono text-emerald-700 dark:text-emerald-300">
            {card.romanization}
          </p>
        </div>
      )}
    </motion.div>
  );
}

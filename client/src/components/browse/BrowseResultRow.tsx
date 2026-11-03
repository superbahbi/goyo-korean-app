import { Eye, EyeOff, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MASTERY_LABELS,
  MASTERY_STYLES,
  type MasteryState,
} from "@/lib/mastery";
import type { VocabularyCard } from "@/lib/vocabulary";

interface BrowseResultRowProps {
  card: VocabularyCard;
  mastery: MasteryState;
  isCardPlaying: boolean;
  hasSentenceAudio: boolean;
  isSentencePlaying: boolean;
  isSpeaking: boolean;
  isShowingRoman: boolean;
  onSpeak: () => void;
  onSpeakSentence: () => void;
  onToggleRomanization: () => void;
}

export function BrowseResultRow({
  card,
  mastery,
  isCardPlaying,
  hasSentenceAudio,
  isSentencePlaying,
  isSpeaking,
  isShowingRoman,
  onSpeak,
  onSpeakSentence,
  onToggleRomanization,
}: BrowseResultRowProps) {
  const romanization = card.romanization || "";
  const isAudioPending = card.audioReady === false;

  return (
    <div
      aria-busy={isCardPlaying}
      className={`rounded-2xl border p-4 transition-all ${
        isCardPlaying
          ? "audio-card-playing border-emerald-400 dark:border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-200 dark:ring-emerald-800/60 shadow-lg shadow-emerald-100"
          : "border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div
            className="text-xl font-bold leading-7 text-foreground"
            lang="ko"
          >
            {card.front}
          </div>
          <div className="mt-0.5 text-sm font-medium text-foreground/70">
            {card.back}
          </div>
          {romanization && (
            // The line is always reserved so revealing it never reflows the list.
            <div className="mt-1 h-5 overflow-hidden">
              {isShowingRoman && (
                <p className="truncate text-sm font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="mr-2 font-sans text-xs text-muted-foreground">
                    Romanization:
                  </span>
                  {romanization}
                </p>
              )}
            </div>
          )}
          {card.example && (
            <div className="mt-1 flex items-start gap-1.5">
              <span className="flex size-6 shrink-0 items-center justify-center">
                {hasSentenceAudio && (
                  <button
                    type="button"
                    onClick={onSpeakSentence}
                    aria-label={`${isSentencePlaying ? "Playing" : "Play"} example sentence for ${card.front}`}
                    className={`flex size-6 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
                      isSentencePlaying
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                        : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                    }`}
                  >
                    <Volume2
                      size={13}
                      className={isSentencePlaying ? "animate-pulse" : ""}
                    />
                  </button>
                )}
              </span>
              <p
                className="line-clamp-2 min-w-0 flex-1 text-xs italic leading-6 text-muted-foreground"
                lang="ko"
              >
                "{card.example}"
              </p>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="secondary"
            className="capitalize whitespace-nowrap bg-muted text-foreground/70"
          >
            {card.tag}
          </Badge>
          <Badge className={`whitespace-nowrap ${MASTERY_STYLES[mastery]}`}>
            {MASTERY_LABELS[mastery]}
          </Badge>
          {isAudioPending && (
            <Badge
              variant="outline"
              className="whitespace-nowrap border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
            >
              Audio pending
            </Badge>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2 border-t border-border/70 pt-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={isSpeaking || isAudioPending}
          className={`h-8 flex-1 gap-1 text-xs disabled:opacity-50 ${
            isCardPlaying
              ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
              : "text-foreground/70 hover:text-foreground hover:bg-muted"
          }`}
          onClick={onSpeak}
          aria-label={
            isAudioPending
              ? `Audio pending for ${card.front}`
              : isCardPlaying
                ? `Playing pronunciation for ${card.front}`
                : `Speak pronunciation for ${card.front}`
          }
        >
          <Volume2 size={14} className={isCardPlaying ? "animate-pulse" : ""} />
          <span className="inline-flex min-w-14 items-center justify-center">
            {isAudioPending
              ? "Audio pending"
              : isCardPlaying
                ? "Playing…"
                : "Speak"}
          </span>
        </Button>
        {romanization && (
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={Boolean(isShowingRoman)}
            aria-label={`${isShowingRoman ? "Hide" : "Show"} romanization for ${card.front}`}
            className="h-8 flex-1 gap-1 text-xs text-foreground/70 hover:text-foreground hover:bg-muted"
            onClick={onToggleRomanization}
          >
            {isShowingRoman ? (
              <>
                <EyeOff size={14} />
                <span className="inline-flex min-w-14 items-center justify-center">
                  Hide
                </span>
              </>
            ) : (
              <>
                <Eye size={14} />
                <span className="inline-flex min-w-14 items-center justify-center">
                  Show
                </span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

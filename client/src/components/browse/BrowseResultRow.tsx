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

  return (
    <div
      aria-busy={isCardPlaying}
      className={`rounded-2xl border p-4 transition-all ${
        isCardPlaying
          ? "audio-card-playing border-emerald-400 dark:border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-200 dark:ring-emerald-800/60 shadow-lg shadow-emerald-100"
          : "border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-foreground" lang="ko">
            {card.front}
          </div>
          <div className="mt-1 text-sm font-medium text-foreground/70">
            {card.back}
          </div>
          {isShowingRoman && romanization && (
            <div className="text-sm text-emerald-700 dark:text-emerald-300 font-mono font-semibold mt-1">
              <span className="text-xs text-muted-foreground mr-2">
                Romanization:
              </span>
              {romanization}
            </div>
          )}
          {card.example && (
            <div className="mt-2 flex items-center gap-2">
              <p
                className="min-w-0 flex-1 text-xs italic text-muted-foreground line-clamp-2"
                lang="ko"
              >
                "{card.example}"
              </p>
              {hasSentenceAudio && (
                <button
                  type="button"
                  onClick={onSpeakSentence}
                  aria-label={`${isSentencePlaying ? "Playing" : "Play"} example sentence for ${card.front}`}
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                >
                  <Volume2
                    size={13}
                    className={isSentencePlaying ? "animate-pulse" : ""}
                  />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isCardPlaying && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              <span
                className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"
                aria-hidden="true"
              />
              Playing
            </span>
          )}
          <Badge
            variant="secondary"
            className="capitalize whitespace-nowrap bg-muted text-foreground/70"
          >
            {card.tag}
          </Badge>
          <Badge className={`whitespace-nowrap ${MASTERY_STYLES[mastery]}`}>
            {MASTERY_LABELS[mastery]}
          </Badge>
          {card.audioReady === false && (
            <Badge
              variant="outline"
              className="whitespace-nowrap border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
            >
              Audio pending
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t border-border/70">
        <Button
          variant="ghost"
          size="sm"
          disabled={isSpeaking || card.audioReady === false}
          className={`flex-1 h-8 text-xs gap-1 disabled:opacity-50 ${
            isCardPlaying
              ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
              : "text-foreground/70 hover:text-foreground hover:bg-muted"
          }`}
          onClick={onSpeak}
          aria-label={
            card.audioReady === false
              ? `Audio pending for ${card.front}`
              : isCardPlaying
                ? `Playing pronunciation for ${card.front}`
                : `Speak pronunciation for ${card.front}`
          }
        >
          <Volume2 size={14} className={isCardPlaying ? "animate-pulse" : ""} />
          {card.audioReady === false
            ? "Audio pending"
            : isCardPlaying
              ? "Playing..."
              : "Speak"}
        </Button>
        {romanization && (
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={Boolean(isShowingRoman)}
            aria-label={`${isShowingRoman ? "Hide" : "Show"} romanization for ${card.front}`}
            className="flex-1 h-8 text-xs gap-1 text-foreground/70 hover:text-foreground hover:bg-muted"
            onClick={onToggleRomanization}
          >
            {isShowingRoman ? (
              <>
                <EyeOff size={14} />
                Hide
              </>
            ) : (
              <>
                <Eye size={14} />
                Show
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

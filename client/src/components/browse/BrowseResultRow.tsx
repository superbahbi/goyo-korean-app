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
          ? "audio-card-playing border-emerald-400 bg-emerald-50/80 ring-2 ring-emerald-200 shadow-lg shadow-emerald-100"
          : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xl font-bold text-slate-900" lang="ko">
              {card.front}
            </div>
            {isShowingRoman && romanization && (
              <span className="text-xs font-mono text-emerald-700">
                {romanization}
              </span>
            )}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-600">
            {card.back}
          </div>
          {isShowingRoman && romanization && (
            <div className="text-sm text-emerald-700 font-mono font-semibold mt-1">
              <span className="text-xs text-slate-500 mr-2">Romanization:</span>
              {romanization}
            </div>
          )}
          {card.example && (
            <div className="mt-2 flex items-start gap-2">
              <p
                className="min-w-0 flex-1 text-xs italic text-slate-500 line-clamp-2"
                lang="ko"
              >
                "{card.example}"
              </p>
              {hasSentenceAudio && (
                <button
                  type="button"
                  onClick={onSpeakSentence}
                  aria-label={`${isSentencePlaying ? "Playing" : "Play"} example sentence for ${card.front}`}
                  className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
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
            className="capitalize whitespace-nowrap bg-slate-100 text-slate-600"
          >
            {card.tag}
          </Badge>
          <Badge className={`whitespace-nowrap ${MASTERY_STYLES[mastery]}`}>
            {MASTERY_LABELS[mastery]}
          </Badge>
          {card.audioReady === false && (
            <Badge
              variant="outline"
              className="whitespace-nowrap border-amber-200 bg-amber-50 text-amber-700"
            >
              Audio pending
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          disabled={isSpeaking || card.audioReady === false}
          className={`flex-1 h-8 text-xs gap-1 disabled:opacity-50 ${
            isCardPlaying
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
            className="flex-1 h-8 text-xs gap-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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

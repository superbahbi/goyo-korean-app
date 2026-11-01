import { Search } from "lucide-react";
import { BrowseResultRow } from "@/components/browse/BrowseResultRow";
import { Button } from "@/components/ui/button";
import { getMasteryState, type CardState } from "@/lib/mastery";
import type { VocabularyCard } from "@/lib/vocabulary";

interface BrowseResultsListProps {
  visibleCards: VocabularyCard[];
  matchingCount: number;
  cardStates: Record<string, CardState>;
  showRomanization: Record<string, boolean>;
  playingCardId: string | null;
  playingSentenceId: string | null;
  sentenceAudioIds: ReadonlySet<string>;
  isSpeaking: boolean;
  onSpeak: (cardId: string) => void;
  onSpeakSentence: (cardId: string) => void;
  onToggleRomanization: (cardId: string) => void;
  onLoadMore: () => void;
}

export function BrowseResultsList({
  visibleCards,
  matchingCount,
  cardStates,
  showRomanization,
  playingCardId,
  playingSentenceId,
  sentenceAudioIds,
  isSpeaking,
  onSpeak,
  onSpeakSentence,
  onToggleRomanization,
  onLoadMore,
}: BrowseResultsListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-3 px-5 py-4 sm:px-6">
        {matchingCount > 0 ? (
          visibleCards.map(card => (
            <BrowseResultRow
              key={card.id}
              card={card}
              mastery={getMasteryState(cardStates[card.id])}
              isCardPlaying={playingCardId === card.id}
              hasSentenceAudio={sentenceAudioIds.has(card.id)}
              isSentencePlaying={playingSentenceId === card.id}
              isSpeaking={isSpeaking}
              isShowingRoman={showRomanization[card.id]}
              onSpeak={() => onSpeak(card.id)}
              onSpeakSentence={() => onSpeakSentence(card.id)}
              onToggleRomanization={() => onToggleRomanization(card.id)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/60 px-6 py-12 text-center">
            <Search size={28} className="mx-auto text-muted-foreground/60" />
            <p className="mt-3 font-semibold text-foreground/80">
              No matching cards
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search or clear your filters.
            </p>
          </div>
        )}
        {visibleCards.length < matchingCount && (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            onClick={onLoadMore}
          >
            Load 40 more · {matchingCount - visibleCards.length} remaining
          </Button>
        )}
      </div>
    </div>
  );
}

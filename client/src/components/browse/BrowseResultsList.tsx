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
  isSpeaking: boolean;
  onSpeak: (cardId: string) => void;
  onToggleRomanization: (cardId: string) => void;
  onLoadMore: () => void;
}

export function BrowseResultsList({
  visibleCards,
  matchingCount,
  cardStates,
  showRomanization,
  playingCardId,
  isSpeaking,
  onSpeak,
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
              isSpeaking={isSpeaking}
              isShowingRoman={showRomanization[card.id]}
              onSpeak={() => onSpeak(card.id)}
              onToggleRomanization={() => onToggleRomanization(card.id)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <Search size={28} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">
              No matching cards
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search or clear your filters.
            </p>
          </div>
        )}
        {visibleCards.length < matchingCount && (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={onLoadMore}
          >
            Load 40 more · {matchingCount - visibleCards.length} remaining
          </Button>
        )}
      </div>
    </div>
  );
}

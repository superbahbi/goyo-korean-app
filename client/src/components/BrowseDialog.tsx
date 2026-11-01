import { useEffect, useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { BrowseResultsList } from "@/components/browse/BrowseResultsList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getMasteryState,
  MASTERY_LABELS,
  type CardState,
  type MasteryState,
} from "@/lib/mastery";
import { CATEGORIES, type VocabularyCard } from "@/lib/vocabulary";
import {
  playSentenceAudio,
  playVocabularyAudio,
  stopAudio,
} from "@/lib/audioPlayer";
import { useSentenceAudioIds } from "@/hooks/useSentenceAudioIds";

const BROWSE_PAGE_SIZE = 40;

interface BrowseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategory: string | null;
  vocabulary: VocabularyCard[];
  cardStates: Record<string, CardState>;
}

export function BrowseDialog({
  open,
  onOpenChange,
  initialCategory,
  vocabulary,
  cardStates,
}: BrowseDialogProps) {
  // Rendered only while open, so each open starts with fresh browse state.
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [query, setQuery] = useState("");
  const [masteryFilter, setMasteryFilter] = useState<MasteryState | "all">(
    "all"
  );
  const [visibleCount, setVisibleCount] = useState(BROWSE_PAGE_SIZE);
  const [showRomanization, setShowRomanization] = useState<
    Record<string, boolean>
  >({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [playingSentenceId, setPlayingSentenceId] = useState<string | null>(
    null
  );
  const sentenceAudioIds = useSentenceAudioIds();

  useEffect(() => {
    setVisibleCount(BROWSE_PAGE_SIZE);
  }, [query, masteryFilter, category]);

  const masteryCounts = useMemo(
    () =>
      vocabulary.reduce<Record<MasteryState, number>>(
        (counts, card) => {
          counts[getMasteryState(cardStates?.[card.id])] += 1;
          return counts;
        },
        { new: 0, learning: 0, shaky: 0, known: 0 }
      ),
    [vocabulary, cardStates]
  );

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredCards = vocabulary.filter(card => {
    const matchesCategory = !category || card.tag === category;
    const matchesMastery =
      masteryFilter === "all" ||
      getMasteryState(cardStates[card.id]) === masteryFilter;
    const matchesQuery =
      !normalizedQuery ||
      [card.front, card.back, card.romanization, card.example].some(value =>
        value.toLocaleLowerCase().includes(normalizedQuery)
      );
    return matchesCategory && matchesMastery && matchesQuery;
  });
  const visibleCards = filteredCards.slice(0, visibleCount);

  const speakKorean = async (wordId: string) => {
    setIsSpeaking(true);
    setPlayingCardId(wordId);
    try {
      await playVocabularyAudio(wordId);
    } finally {
      setIsSpeaking(false);
      setPlayingCardId(null);
    }
  };

  const speakSentence = async (cardId: string) => {
    setPlayingSentenceId(cardId);
    try {
      await playSentenceAudio(cardId);
    } finally {
      setPlayingSentenceId(null);
    }
  };

  const toggleRomanization = (cardId: string) => {
    setShowRomanization({
      ...showRomanization,
      [cardId]: !showRomanization[cardId],
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) {
          stopAudio();
          setPlayingCardId(null);
          setPlayingSentenceId(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-emerald-50 to-white px-5 pb-4 pt-5 sm:px-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-slate-900">
              <BookOpen size={21} className="text-emerald-600" />
              {category
                ? `${CATEGORIES.find(c => c.id === category)?.name} library`
                : "Vocabulary library"}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="mt-1 text-sm text-slate-500">
            Search Korean, meanings, examples, or romanization.
          </DialogDescription>
          <div className="relative mt-4">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search the deck..."
              aria-label="Search vocabulary library"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {(["all", "new", "learning", "shaky", "known"] as const).map(
              filter => (
                <button
                  type="button"
                  key={filter}
                  onClick={() => setMasteryFilter(filter)}
                  aria-pressed={masteryFilter === filter}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${masteryFilter === filter ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"}`}
                >
                  {filter === "all" ? "All cards" : MASTERY_LABELS[filter]}
                  <span className="ml-1">
                    {filter === "all"
                      ? vocabulary.length
                      : masteryCounts[filter]}
                  </span>
                </button>
              )
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              {filteredCards.length} matching card
              {filteredCards.length === 1 ? "" : "s"}
            </span>
            {(category || query || masteryFilter !== "all") && (
              <button
                type="button"
                className="rounded font-semibold text-emerald-700 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                onClick={() => {
                  setCategory(null);
                  setQuery("");
                  setMasteryFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        <BrowseResultsList
          visibleCards={visibleCards}
          matchingCount={filteredCards.length}
          cardStates={cardStates}
          showRomanization={showRomanization}
          playingCardId={playingCardId}
          playingSentenceId={playingSentenceId}
          sentenceAudioIds={sentenceAudioIds}
          isSpeaking={isSpeaking}
          onSpeak={cardId => speakKorean(cardId)}
          onSpeakSentence={cardId => void speakSentence(cardId)}
          onToggleRomanization={toggleRomanization}
          onLoadMore={() =>
            setVisibleCount(count =>
              Math.min(count + BROWSE_PAGE_SIZE, filteredCards.length)
            )
          }
        />
      </DialogContent>
    </Dialog>
  );
}

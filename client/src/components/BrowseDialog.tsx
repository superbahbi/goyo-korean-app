import { useEffect, useMemo, useState } from "react";
import { BookOpen, Eye, EyeOff, Search, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  MASTERY_STYLES,
  type CardState,
  type MasteryState,
} from "@/lib/mastery";
import { CATEGORIES, type VocabularyCard } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";

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

  const getRomanization = (card: VocabularyCard) => {
    return card.romanization || "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) {
          stopAudio();
          setPlayingCardId(null);
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
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3 px-5 py-4 sm:px-6">
            {filteredCards.length > 0 ? (
              visibleCards.map(card => {
                const romanization = getRomanization(card);
                const isShowingRoman = showRomanization[card.id];
                const isCardPlaying = playingCardId === card.id;
                const mastery = getMasteryState(cardStates[card.id]);
                return (
                  <div
                    key={card.id}
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
                          <div
                            className="text-xl font-bold text-slate-900"
                            lang="ko"
                          >
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
                            <span className="text-xs text-slate-500 mr-2">
                              Romanization:
                            </span>
                            {romanization}
                          </div>
                        )}
                        {card.example && (
                          <div
                            className="text-xs text-slate-500 italic mt-2 line-clamp-2"
                            lang="ko"
                          >
                            "{card.example}"
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
                        <Badge
                          className={`whitespace-nowrap ${MASTERY_STYLES[mastery]}`}
                        >
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
                        onClick={() => speakKorean(card.id)}
                        aria-label={
                          card.audioReady === false
                            ? `Audio pending for ${card.front}`
                            : isCardPlaying
                              ? `Playing pronunciation for ${card.front}`
                              : `Speak pronunciation for ${card.front}`
                        }
                      >
                        <Volume2
                          size={14}
                          className={isCardPlaying ? "animate-pulse" : ""}
                        />
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
                          onClick={() =>
                            setShowRomanization({
                              ...showRomanization,
                              [card.id]: !isShowingRoman,
                            })
                          }
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
              })
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
            {visibleCards.length < filteredCards.length && (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() =>
                  setVisibleCount(count =>
                    Math.min(count + BROWSE_PAGE_SIZE, filteredCards.length)
                  )
                }
              >
                Load 40 more · {filteredCards.length - visibleCards.length}{" "}
                remaining
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

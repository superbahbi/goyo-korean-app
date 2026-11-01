import { memo, useCallback, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { playSentenceAudio, playVocabularyAudio } from "@/lib/audioPlayer";

interface FlashCardProps {
  wordId: string;
  front: string;
  back: string;
  example?: string;
  exampleEnglish?: string;
  usageNote?: string;
  tag: string;
  romanization?: string;
  /** True when the example sentence has a generated clip to play. */
  sentenceAudioReady?: boolean;
  onFlip?: (flipped: boolean) => void;
  autoSpeak?: boolean;
  audioFirst?: boolean;
  revealed?: boolean;
}

function cleanKoreanText(text: string): string {
  const match = text.match(/^([^(]+)/);
  return match ? match[1].trim() : text.trim();
}

function FlashCardBase({
  wordId,
  front,
  back,
  example,
  exampleEnglish,
  usageNote,
  tag,
  romanization: romanizationProp,
  onFlip,
  autoSpeak = true,
  audioFirst = false,
  revealed,
  sentenceAudioReady = false,
}: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [showRoman, setShowRoman] = useState(false);
  // A card that only shows audio is unusable when the clip cannot play (muted
  // device, blocked /audio/, offline miss). Track that so the front can offer a
  // way forward instead of trapping the learner.
  const [audioFailed, setAudioFailed] = useState(false);
  const audioFailureAnnounced = useRef(false);
  const isRevealed = revealed ?? flipped;
  // Auto-play at most once per word per mount: flipping back to the front must
  // not replay the pronunciation.
  const lastAutoPlayedId = useRef<string | null>(null);

  const markAudioFailed = useCallback((announce: boolean) => {
    setAudioFailed(true);
    if (!announce || audioFailureAnnounced.current) return;
    audioFailureAnnounced.current = true;
    toast.error("Pronunciation unavailable", {
      description: "Reveal the Korean to keep this card moving.",
    });
  }, []);

  useEffect(() => {
    audioFailureAnnounced.current = false;
    setAudioFailed(false);
  }, [wordId]);

  useEffect(() => {
    if (!isRevealed && autoSpeak && lastAutoPlayedId.current !== wordId) {
      const timer = setTimeout(() => {
        lastAutoPlayedId.current = wordId;
        void playVocabularyAudio(wordId).then(played => {
          if (!played) markAudioFailed(true);
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isRevealed, front, wordId, autoSpeak, markAudioFailed]);

  const handleFlip = () => {
    const nextValue = !isRevealed;
    setFlipped(nextValue);
    onFlip?.(nextValue);
  };

  const getRomanization = () => {
    if (romanizationProp) return romanizationProp;
    const match = front.match(/\(([^)]*)\)/);
    return match ? match[1] : "";
  };

  const romanization = getRomanization();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col items-center justify-center"
    >
      {/* The card surface is the mouse/touch reveal; the keyboard path is the
          labelled reveal button in the session footer. No third hint is needed.
          A flexible height on phones keeps the whole back visible above the
          footer, while desktop keeps the portrait 3:4 card. */}
      <div
        className="relative h-[min(60dvh,32rem)] w-full max-w-md cursor-pointer sm:h-auto sm:aspect-[3/4]"
        onClick={handleFlip}
      >
        {/* Front */}
        <motion.div
          initial={false}
          inert={isRevealed}
          animate={{
            opacity: isRevealed ? 0 : 1,
            pointerEvents: isRevealed ? "none" : "auto",
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-3xl border-2 border-border/70 bg-card p-6 text-center shadow-xl sm:p-8"
        >
          <Badge
            variant="outline"
            className="mb-6 capitalize border-border bg-muted/60 font-medium text-muted-foreground sm:mb-8"
          >
            {tag}
          </Badge>
          {audioFirst ? (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 sm:mb-5 sm:h-20 sm:w-20">
                <Volume2 size={32} />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                Listen &amp; recall
              </p>
              <h2 className="mt-2 text-xl font-bold text-foreground/90 sm:mt-3 sm:text-2xl">
                What does this mean?
              </h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Say the meaning silently before revealing the Korean and
                example.
              </p>
              {audioFailed && (
                <div
                  role="status"
                  className="mt-5 flex max-w-xs flex-col items-center gap-2 rounded-2xl border border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/40 px-4 py-3"
                >
                  <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                    Audio isn&apos;t available, so you can&apos;t hear this
                    card. Reveal it to keep going.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-amber-300 dark:border-amber-700 bg-card text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    onClick={event => {
                      event.stopPropagation();
                      handleFlip();
                    }}
                  >
                    Show Korean
                  </Button>
                </div>
              )}
            </>
          ) : (
            <h2
              className="mb-4 text-4xl font-bold text-foreground sm:mb-6 sm:text-5xl"
              lang="ko"
            >
              {cleanKoreanText(front)}
            </h2>
          )}
          {!audioFirst && showRoman && romanization && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 font-mono text-xl font-semibold text-emerald-600 dark:text-emerald-400 sm:mb-8 sm:text-2xl"
            >
              {romanization}
            </motion.p>
          )}
          <div className="mt-5 flex items-center gap-3 sm:mt-8 sm:gap-4">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full w-12 h-12"
              aria-label={`Play pronunciation for ${cleanKoreanText(front)}`}
              onClick={e => {
                e.stopPropagation();
                void playVocabularyAudio(wordId).then(played => {
                  if (!played) markAudioFailed(true);
                });
              }}
            >
              <Volume2 size={20} />
            </Button>
            {!audioFirst && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground/80"
                onClick={e => {
                  e.stopPropagation();
                  setShowRoman(!showRoman);
                }}
              >
                {showRoman ? "Hide" : "Show"} Romanization
              </Button>
            )}
          </div>
        </motion.div>

        {/* Back */}
        <motion.div
          initial={false}
          inert={!isRevealed}
          animate={{
            opacity: isRevealed ? 1 : 0,
            pointerEvents: isRevealed ? "auto" : "none",
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 overflow-y-auto rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-background to-teal-50 p-5 text-center shadow-xl dark:border-emerald-800/70 dark:from-emerald-950 dark:to-teal-950 sm:p-9"
        >
          <div className="flex min-h-full flex-col items-center justify-center">
            <Badge className="mb-3 bg-emerald-700 text-white shadow-sm sm:mb-5">
              {audioFirst ? "Korean + meaning" : "Meaning"}
            </Badge>
            {audioFirst && (
              <p
                className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
                lang="ko"
              >
                {cleanKoreanText(front)}
              </p>
            )}
            {romanization && (
              <p className="mt-2 font-mono text-base font-semibold text-emerald-700 dark:text-emerald-300 sm:mt-3 sm:text-lg">
                {romanization}
              </p>
            )}
            <div className="my-4 h-px w-full max-w-xs bg-emerald-200 dark:bg-emerald-900/60 sm:my-6" />
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70 sm:mb-2">
              Meaning
            </p>
            <h2 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {back}
            </h2>
            {example && (
              <div className="mt-4 max-w-xs rounded-2xl border border-emerald-200 bg-card/80 p-3 shadow-sm dark:border-emerald-800/70 sm:mt-6 sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  In context
                </p>
                <p
                  className="mt-2 text-sm italic leading-relaxed text-foreground/70"
                  lang="ko"
                >
                  “{example}”
                </p>
                {exampleEnglish && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {exampleEnglish}
                  </p>
                )}
                {sentenceAudioReady && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 gap-1.5 px-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-200"
                    aria-label={`Hear sentence for ${cleanKoreanText(front)}`}
                    onClick={event => {
                      event.stopPropagation();
                      void playSentenceAudio(wordId).then(played => {
                        if (!played) {
                          toast.error("Sentence audio unavailable", {
                            description: "The word pronunciation still works.",
                          });
                        }
                      });
                    }}
                  >
                    <Volume2 size={14} />
                    Hear sentence
                  </Button>
                )}
              </div>
            )}
            {usageNote && (
              <div className="mt-2 max-w-xs rounded-2xl border border-border bg-card/60 px-4 py-3 text-left sm:mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                  Usage note
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/70">
                  {usageNote}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// React.memo keeps a card from re-rendering when its parent session re-renders
// without any change to this card's props.
export const FlashCard = memo(FlashCardBase);

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { playVocabularyAudio } from "@/lib/audioPlayer";

interface FlashCardProps {
  wordId: string;
  front: string;
  back: string;
  example?: string;
  exampleEnglish?: string;
  usageNote?: string;
  tag: string;
  romanization?: string;
  onFlip?: (flipped: boolean) => void;
  autoSpeak?: boolean;
  audioFirst?: boolean;
  revealed?: boolean;
}

function cleanKoreanText(text: string): string {
  const match = text.match(/^([^\(]+)/);
  return match ? match[1].trim() : text.trim();
}

export function FlashCard({
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
}: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [showRoman, setShowRoman] = useState(false);
  const isRevealed = revealed ?? flipped;

  useEffect(() => {
    if (!isRevealed && autoSpeak) {
      const timer = setTimeout(() => {
        void playVocabularyAudio(wordId, cleanKoreanText(front));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isRevealed, front, wordId, autoSpeak]);

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
      <div
        className={`w-full max-w-md aspect-[3/4] relative transition-all duration-500 cursor-pointer ${
          isRevealed ? "scale-105" : ""
        }`}
        onClick={handleFlip}
      >
        {/* Front */}
        <motion.div
          initial={false}
          animate={{ opacity: isRevealed ? 0 : 1, pointerEvents: isRevealed ? "none" : "auto" }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-white border-2 border-slate-100 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-center"
        >
          <Badge variant="outline" className="mb-8 capitalize text-slate-500 font-medium bg-slate-50 border-slate-200">
            {tag}
          </Badge>
          {audioFirst ? (
            <>
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Volume2 size={36} />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Listen &amp; recall</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-800">What does this mean?</h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">Say the meaning silently before revealing the Korean and example.</p>
            </>
          ) : (
            <h2 className="text-5xl font-bold text-slate-900 mb-6">{cleanKoreanText(front)}</h2>
          )}
          {!audioFirst && showRoman && romanization && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl text-emerald-600 font-mono font-semibold mb-8"
            >
              {romanization}
            </motion.p>
          )}
          <div className="mt-8 flex gap-4">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full w-12 h-12"
              onClick={(e) => {
                e.stopPropagation();
                void playVocabularyAudio(wordId, cleanKoreanText(front));
              }}
            >
              <Volume2 size={20} />
            </Button>
            {!audioFirst && <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-700"
              onClick={(e) => {
                e.stopPropagation();
                setShowRoman(!showRoman);
              }}
            >
              {showRoman ? "Hide" : "Show"} Romanization
            </Button>}
          </div>
          <div className="absolute bottom-12 flex items-center gap-2 text-sm text-slate-300 animate-pulse">
            {audioFirst ? "Tap to reveal meaning" : "Tap to reveal"} <ChevronRight size={16} />
          </div>
        </motion.div>

        {/* Back */}
        <motion.div
          initial={false}
          animate={{ opacity: isRevealed ? 1 : 0, pointerEvents: isRevealed ? "auto" : "none" }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 overflow-y-auto rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-7 text-center shadow-xl sm:p-9"
        >
          <div className="flex min-h-full flex-col items-center justify-center">
            <Badge className="mb-5 bg-emerald-600 text-white shadow-sm">{audioFirst ? "Korean + meaning" : "Meaning"}</Badge>
            {audioFirst && <p className="text-5xl font-bold tracking-tight text-slate-900">{cleanKoreanText(front)}</p>}
            {romanization && <p className="mt-3 font-mono text-lg font-semibold text-emerald-700">{romanization}</p>}
            <div className="my-6 h-px w-full max-w-xs bg-emerald-200" />
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Meaning</p>
            <h2 className="text-3xl font-bold leading-tight text-slate-900">{back}</h2>
          {example && (
            <div className="mt-6 max-w-xs rounded-2xl border border-emerald-200 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">In context</p>
              <p className="mt-2 text-sm italic leading-relaxed text-slate-600">“{example}”</p>
              {exampleEnglish && <p className="mt-2 text-xs leading-relaxed text-slate-500">{exampleEnglish}</p>}
            </div>
          )}
          {usageNote && (
            <div className="mt-3 max-w-xs rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Usage note</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{usageNote}</p>
            </div>
          )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

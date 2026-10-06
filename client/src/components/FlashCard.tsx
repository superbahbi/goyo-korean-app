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
  tag: string;
  onFlip?: (flipped: boolean) => void;
  autoSpeak?: boolean;
  audioFirst?: boolean;
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
  tag,
  onFlip,
  autoSpeak = true,
  audioFirst = false,
}: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [showRoman, setShowRoman] = useState(false);

  useEffect(() => {
    if (!flipped && autoSpeak) {
      const timer = setTimeout(() => {
        void playVocabularyAudio(wordId, cleanKoreanText(front));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [flipped, front, wordId, autoSpeak]);

  const handleFlip = () => {
    setFlipped(!flipped);
    onFlip?.(!flipped);
  };

  const getRomanization = () => {
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
          flipped ? "scale-105" : ""
        }`}
        onClick={handleFlip}
      >
        {/* Front */}
        <motion.div
          initial={false}
          animate={{ opacity: flipped ? 0 : 1, pointerEvents: flipped ? "none" : "auto" }}
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
          animate={{ opacity: flipped ? 1 : 0, pointerEvents: flipped ? "auto" : "none" }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-emerald-50 border-2 border-emerald-100 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-center"
        >
          <Badge className="mb-6 bg-emerald-500 text-white font-semibold">{audioFirst ? "Korean + meaning" : "Meaning"}</Badge>
          {audioFirst && <p className="mb-4 text-5xl font-bold text-slate-900">{cleanKoreanText(front)}</p>}
          <h2 className="text-3xl font-bold text-slate-900 mb-6">{back}</h2>
          {example && (
            <div className="mt-4 p-4 bg-white/70 rounded-2xl border border-emerald-200 max-w-xs">
              <p className="text-sm text-slate-600 italic">\"{ example}\"</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

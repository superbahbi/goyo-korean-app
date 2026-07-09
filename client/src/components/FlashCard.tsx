import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface FlashCardProps {
  front: string;
  back: string;
  example?: string;
  tag: string;
  onFlip?: (flipped: boolean) => void;
  autoSpeak?: boolean;
}

function cleanKoreanText(text: string): string {
  const match = text.match(/^([^\(]+)/);
  return match ? match[1].trim() : text.trim();
}

function speakKorean(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function FlashCard({
  front,
  back,
  example,
  tag,
  onFlip,
  autoSpeak = true,
}: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [showRoman, setShowRoman] = useState(false);

  useEffect(() => {
    if (!flipped && autoSpeak) {
      const timer = setTimeout(() => {
        speakKorean(cleanKoreanText(front));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [flipped, front, autoSpeak]);

  const handleFlip = () => {
    setFlipped(!flipped);
    onFlip?.(!flipped);
  };

  const getRomanization = () => {
    const match = front.match(/\(([^)]*)\)/);
    return match ? match[1] : "";
  };

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
          <Badge variant="outline" className="mb-8 capitalize text-slate-400 font-normal">
            {tag}
          </Badge>
          <h2 className="text-5xl font-bold text-slate-900 mb-6">
            {cleanKoreanText(front)}
          </h2>
          {showRoman && (
            <p className="text-xl text-slate-500 font-mono mb-8">
              {getRomanization()}
            </p>
          )}
          <div className="flex gap-4 mt-8">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full w-12 h-12"
              onClick={(e) => {
                e.stopPropagation();
                speakKorean(cleanKoreanText(front));
              }}
            >
              <Volume2 size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400"
              onClick={(e) => {
                e.stopPropagation();
                setShowRoman(!showRoman);
              }}
            >
              {showRoman ? "Hide" : "Show"} Romanization
            </Button>
          </div>
          <div className="absolute bottom-12 text-slate-300 flex items-center gap-2 text-sm animate-pulse">
            Tap to reveal <ChevronRight size={16} />
          </div>
        </motion.div>

        {/* Back */}
        <motion.div
          initial={false}
          animate={{ opacity: flipped ? 1 : 0, pointerEvents: flipped ? "auto" : "none" }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-emerald-50 border-2 border-emerald-100 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-center"
        >
          <Badge className="mb-8 bg-emerald-500">Meaning</Badge>
          <h2 className="text-3xl font-bold text-slate-900 mb-6">{back}</h2>
          {example && (
            <div className="mt-4 p-4 bg-white/50 rounded-2xl border border-emerald-100 max-w-xs">
              <p className="text-sm text-slate-600 italic">"{example}"</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

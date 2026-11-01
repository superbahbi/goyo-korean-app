import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlphabetCard as AlphabetCardType } from "@/lib/alphabet";

interface AlphabetCardProps {
  card: AlphabetCardType;
  onSpeak: (
    characterId: string,
    type: "consonant" | "vowel" | "number"
  ) => void;
}

export function AlphabetCard({ card, onSpeak }: AlphabetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-2xl border-2 border-border p-8 max-w-md w-full shadow-lg"
    >
      {/* Main Hangul Character */}
      <div className="text-center mb-8">
        <div
          className="text-8xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 font-serif"
          lang="ko"
        >
          {card.hangul}
        </div>
        <div className="text-2xl font-bold text-foreground mb-2" lang="ko">
          {card.sound}
        </div>
        <div className="text-lg text-foreground/70">{card.romanization}</div>
      </div>

      {/* Example */}
      <div className="bg-muted/60 rounded-xl p-4 mb-6 border border-border">
        <p className="text-sm text-foreground/70 mb-1">Example:</p>
        <p className="text-lg font-semibold text-foreground">{card.example}</p>
      </div>

      {/* Speak Button */}
      <Button
        onClick={() => onSpeak(card.id, card.type)}
        className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold gap-2 rounded-xl"
      >
        <Volume2 size={20} />
        Hear Pronunciation
      </Button>

      {/* Type Badge */}
      <div className="mt-4 text-center">
        <span
          className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
            card.type === "consonant"
              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
              : card.type === "vowel"
                ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {card.type === "consonant"
            ? "Consonant"
            : card.type === "vowel"
              ? "Vowel"
              : "Native number"}
        </span>
      </div>
    </motion.div>
  );
}

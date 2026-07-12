import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlphabetCard as AlphabetCardType } from "@/lib/alphabet";

interface AlphabetCardProps {
  card: AlphabetCardType;
  onSpeak: (characterId: string, type: "consonant" | "vowel") => void;
}

export function AlphabetCard({ card, onSpeak }: AlphabetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border-2 border-slate-200 p-8 max-w-md w-full shadow-lg"
    >
      {/* Main Hangul Character */}
      <div className="text-center mb-8">
        <div className="text-8xl font-bold text-emerald-600 mb-4 font-serif">
          {card.hangul}
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-2">
          {card.sound}
        </div>
        <div className="text-lg text-slate-600">
          {card.romanization}
        </div>
      </div>

      {/* Example */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
        <p className="text-sm text-slate-600 mb-1">Example:</p>
        <p className="text-lg font-semibold text-slate-900">
          {card.example}
        </p>
      </div>

      {/* Speak Button */}
      <Button
        onClick={() => onSpeak(card.id, card.type)}
        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold gap-2 rounded-xl"
      >
        <Volume2 size={20} />
        Hear Pronunciation
      </Button>

      {/* Type Badge */}
      <div className="mt-4 text-center">
        <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
          card.type === "consonant"
            ? "bg-blue-100 text-blue-700"
            : "bg-purple-100 text-purple-700"
        }`}>
          {card.type === "consonant" ? "Consonant" : "Vowel"}
        </span>
      </div>
    </motion.div>
  );
}

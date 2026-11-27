import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StrokeOrderDiagram } from "@/components/StrokeOrderDiagram";
import {
  splitAlphabetExample,
  type AlphabetCard as AlphabetCardType,
} from "@domain/alphabet";

interface AlphabetCardProps {
  card: AlphabetCardType;
  onSpeak: (characterId: string, type: "consonant" | "vowel") => void;
}

export function AlphabetCard({ card, onSpeak }: AlphabetCardProps) {
  const example = splitAlphabetExample(card.example);
  return (
    <div className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-2xl border-2 border-border bg-card p-4 shadow-lg sm:p-8">
      {/* Main Hangul Character */}
      <div className="mb-3 text-center sm:mb-6">
        <StrokeOrderDiagram
          characterId={card.id}
          hangul={card.hangul}
          className="mb-2 sm:mb-4"
        />
        <div
          className="mb-0.5 text-xl font-bold text-foreground sm:mb-2 sm:text-2xl"
          lang="ko"
        >
          {card.sound}
        </div>
        <div className="text-base text-foreground/70 sm:text-lg">
          {card.romanization}
        </div>
      </div>

      {/* Example */}
      <div className="mb-3 rounded-xl border border-border bg-muted/60 p-2.5 sm:mb-6 sm:p-4">
        <p className="mb-0.5 text-xs text-foreground/70 sm:mb-1 sm:text-sm">
          Example:
        </p>
        <p className="break-keep text-base font-semibold text-foreground sm:text-lg">
          <span lang="ko">{example.word}</span> {example.gloss}
        </p>
      </div>

      {/* Speak Button */}
      <Button
        onClick={() => onSpeak(card.id, card.type)}
        className="h-11 w-full gap-2 rounded-xl bg-emerald-700 font-semibold text-white hover:bg-emerald-800 sm:h-12"
      >
        <Volume2 size={20} />
        Hear Pronunciation
      </Button>

      {/* Type Badge */}
      <div className="mt-2.5 text-center sm:mt-4">
        <span
          className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold sm:px-4 sm:py-1 sm:text-sm ${
            card.type === "consonant"
              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
              : "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
          }`}
        >
          {card.type === "consonant" ? "Consonant" : "Vowel"}
        </span>
      </div>
    </div>
  );
}

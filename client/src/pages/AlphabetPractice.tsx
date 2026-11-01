import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Hash,
  Languages,
  Music2,
  Sparkles,
  Timer,
} from "lucide-react";
import { motion } from "framer-motion";
import { AlphabetCard } from "@/components/AlphabetCard";
import {
  PracticePrimaryButton,
  PracticeShell,
} from "@/components/practice/PracticeShell";
import {
  ALPHABET_DATA,
  ALPHABET_CATEGORIES,
  NUMBER_DATA,
} from "@/lib/alphabet";
import { playAlphabetAudio, playVocabularyAudio } from "@/lib/audioPlayer";

interface AlphabetPracticeProps {
  onClose: () => void;
}

const CATEGORY_DETAILS: Record<string, string> = {
  consonants: "19 letter names",
  vowels: "21 vowel sounds",
  numbers: "1–10 in native Korean",
};

const CATEGORY_ICONS = {
  consonants: Languages,
  vowels: Music2,
  numbers: Hash,
} as const;

const TIPS = [
  {
    icon: BookOpen,
    title: "Start with the shapes",
    body: "Hangul is a real alphabet: each shape maps to one predictable sound.",
  },
  {
    icon: Sparkles,
    title: "Say it out loud",
    body: "Tap “Hear Pronunciation” and repeat the example to anchor the sound.",
  },
  {
    icon: Timer,
    title: "A few minutes a day",
    body: "Most beginners can read their first Korean words within a few hours.",
  },
];

export function AlphabetPractice({ onClose }: AlphabetPracticeProps) {
  const [selectedType, setSelectedType] = useState<
    "consonants" | "vowels" | "numbers" | null
  >(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async (
    characterId: string,
    type: "consonant" | "vowel" | "number"
  ) => {
    setIsSpeaking(true);
    try {
      await speakHangul(characterId, type);
    } finally {
      setIsSpeaking(false);
    }
  };

  const speakHangul = async (
    characterId: string,
    type: "consonant" | "vowel" | "number"
  ) => {
    if (type === "number") {
      await playVocabularyAudio(characterId);
      return;
    }
    await playAlphabetAudio(characterId, type);
  };

  if (!selectedType) {
    return (
      <PracticeShell
        key="categories"
        title="Learn Hangul"
        badge={
          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900/50">
            Korean alphabet
          </Badge>
        }
        description="Pick a set, listen to each shape, and move at your own pace."
        tone="indigo"
        closeLabel="Close Hangul practice"
        onClose={onClose}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {ALPHABET_CATEGORIES.map(category => {
            const Icon =
              CATEGORY_ICONS[category.id as keyof typeof CATEGORY_ICONS];
            return (
              <motion.button
                key={category.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  setCurrentIndex(0);
                  setSelectedType(
                    category.id as "consonants" | "vowels" | "numbers"
                  );
                }}
                className={`flex min-h-36 flex-col items-center justify-center rounded-2xl p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${category.color}`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 dark:bg-black/20">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span className="mt-3 text-xl font-bold">{category.name}</span>
                <span className="mt-1 text-sm">
                  {CATEGORY_DETAILS[category.id]}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card/85 p-4 sm:p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
            How it works
          </h2>
          <ul className="mt-3 space-y-3">
            {TIPS.map(tip => {
              const Icon = tip.icon;
              return (
                <li key={tip.title} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                    aria-hidden="true"
                  >
                    <Icon size={16} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground/90">
                      {tip.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                      {tip.body}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </PracticeShell>
    );
  }

  const cards =
    selectedType === "numbers"
      ? NUMBER_DATA
      : ALPHABET_DATA.filter(c =>
          selectedType === "consonants"
            ? c.type === "consonant"
            : c.type === "vowel"
        );

  const currentCard = cards[currentIndex] ?? cards[0];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const sectionTitle =
    selectedType === "consonants"
      ? "Consonants"
      : selectedType === "vowels"
        ? "Vowels"
        : "Numbers";

  return (
    <PracticeShell
      key={selectedType}
      title={sectionTitle}
      titleLang="en"
      badge={
        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900/50">
          Hangul
        </Badge>
      }
      description="Tap the speaker to hear the name, then move through the set."
      tone="indigo"
      closeLabel="Close Hangul practice"
      onClose={onClose}
      onBack={() => setSelectedType(null)}
      backLabel="Back to categories"
      progress={((currentIndex + 1) / cards.length) * 100}
      progressLabel={`${sectionTitle} progress`}
      counter={`${currentIndex + 1} / ${cards.length}`}
      status={sectionTitle}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0 || isSpeaking}
            className="min-h-12 rounded-xl"
          >
            <ArrowLeft size={16} className="mr-2" /> Previous
          </Button>
          <PracticePrimaryButton
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1 || isSpeaking}
          >
            Next <ArrowRight size={16} className="ml-2" />
          </PracticePrimaryButton>
        </div>
      }
    >
      {currentCard && (
        <div className="flex justify-center">
          <AlphabetCard card={currentCard} onSpeak={handleSpeak} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Quick reference
        </h2>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8">
          {cards.map((card, idx) => (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
              aria-label={`Go to ${card.hangul}`}
              aria-current={idx === currentIndex ? "true" : undefined}
              className={`aspect-square rounded-xl text-2xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                idx === currentIndex
                  ? "scale-105 bg-emerald-700 text-white shadow-lg"
                  : "border-2 border-border bg-card text-foreground hover:border-emerald-300 dark:hover:border-emerald-700"
              }`}
              lang="ko"
            >
              {card.hangul}
            </motion.button>
          ))}
        </div>
      </div>
    </PracticeShell>
  );
}

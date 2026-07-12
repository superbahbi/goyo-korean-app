import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { AlphabetCard } from "@/components/AlphabetCard";
import { ALPHABET_DATA, ALPHABET_CATEGORIES, AlphabetCard as AlphabetCardType } from "@/lib/alphabet";
import { playAlphabetAudio } from "@/lib/audioPlayer";

interface AlphabetPracticeProps {
  onClose: () => void;
}

export function AlphabetPractice({ onClose }: AlphabetPracticeProps) {
  const [selectedType, setSelectedType] = useState<"consonants" | "vowels" | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async (text: string) => {
    setIsSpeaking(true);
    try {
      await speakHangul(text);
    } finally {
      setIsSpeaking(false);
    }
  };

  const speakHangul = async (characterId: string, type: "consonant" | "vowel") => {
    await playAlphabetAudio(characterId, type);
  };

  if (!selectedType) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-slate-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="mb-4"
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Learn Hangul</h1>
          <p className="text-slate-600 mt-2">Master the Korean alphabet</p>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ALPHABET_CATEGORIES.map((category) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedType(category.id as "consonants" | "vowels")}
                  className={`p-8 rounded-2xl text-center transition-all hover:shadow-lg ${category.color}`}
                >
                  <div className="text-5xl mb-4">{category.icon}</div>
                  <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
                  <p className="text-sm opacity-75">
                    {category.id === "consonants"
                      ? "15 consonant sounds"
                      : "12 vowel sounds"}
                  </p>
                </motion.button>
              ))}
            </div>

            {/* Info Cards */}
            <div className="mt-12 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Why Learn Hangul?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <p>
                    🎯 <strong>Foundation:</strong> Hangul is the Korean alphabet. Learning it is the first step to reading and writing Korean.
                  </p>
                  <p>
                    🔊 <strong>Pronunciation:</strong> Each character has a consistent sound, making Korean pronunciation logical and learnable.
                  </p>
                  <p>
                    ⚡ <strong>Quick to Learn:</strong> Most people can learn Hangul in just a few hours!
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How to Practice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <p>
                    1️⃣ Select either Consonants or Vowels to begin
                  </p>
                  <p>
                    2️⃣ Study each character with its pronunciation and example
                  </p>
                  <p>
                    3️⃣ Click "Hear Pronunciation" to listen to the sound
                  </p>
                  <p>
                    4️⃣ Navigate through all characters at your own pace
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const cards = ALPHABET_DATA.filter((c) =>
    selectedType === "consonants" ? c.type === "consonant" : c.type === "vowel"
  );

  const currentCard = cards[currentIndex];

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

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 z-50 flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedType(null)}
              className="mb-2"
            >
              <ArrowLeft />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">
              {selectedType === "consonants" ? "Consonants" : "Vowels"}
            </h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">
              {currentIndex + 1} / {cards.length}
            </div>
            <div className="w-48 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${((currentIndex + 1) / cards.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
        <div className="max-w-2xl w-full">
          <AlphabetCard
            card={currentCard}
            onSpeak={handleSpeak}
          />

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 justify-center">
            <Button
              onClick={handlePrev}
              disabled={currentIndex === 0 || isSpeaking}
              variant="outline"
              className="px-6 py-2 rounded-xl"
            >
              ← Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1 || isSpeaking}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
            >
              Next →
            </Button>
          </div>

          {/* Quick Reference Grid */}
          <div className="mt-12">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Reference</h2>
            <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
              {cards.map((card, idx) => (
                <motion.button
                  key={card.id}
                  onClick={() => setCurrentIndex(idx)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`aspect-square rounded-lg font-bold text-2xl transition-all ${
                    idx === currentIndex
                      ? "bg-emerald-500 text-white shadow-lg scale-110"
                      : "bg-white text-slate-900 border-2 border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  {card.hangul}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

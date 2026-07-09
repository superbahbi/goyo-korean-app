import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Flame, Star, Trophy, Play, BookOpen, BarChart2, Settings, TrendingUp, Zap, Volume2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useStudyState } from "@/hooks/useStudyState";
import { StudySession } from "@/components/StudySession";
import { VOCABULARY_DATA, CATEGORIES } from "@/lib/vocabulary";
import { AlphabetPractice } from "./AlphabetPractice";

export default function Home() {
  const { state, gradeCard } = useStudyState();
  const [queue, setQueue] = useState<typeof VOCABULARY_DATA>([]);
  const [isStudying, setIsStudying] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlphabet, setShowAlphabet] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showRomanization, setShowRomanization] = useState<Record<string, boolean>>({});

  const speakKorean = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const match = text.match(/^([^(]+)/);
    const cleanText = match ? match[1].trim() : text;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ko-KR";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const getRomanization = (card: typeof VOCABULARY_DATA[0]) => {
    return card.romanization || "";
  };

  // Build queue of cards to study
  useEffect(() => {
    if (!state) return;

    const dailyGoal = state.settings.dailyGoal;
    const cardsStudiedToday = state.stats.cardsStudiedToday;
    
    // If daily goal not reached, show only new cards
    if (cardsStudiedToday < dailyGoal) {
      const newCards = VOCABULARY_DATA.filter((c) => !state.cardStates[c.id]);
      const cardsToStudy = newCards.slice(0, dailyGoal - cardsStudiedToday);
      setQueue(cardsToStudy);
    } else {
      // Daily goal reached - allow repeating all cards for practice
      setQueue(VOCABULARY_DATA);
    }
  }, [state?.cardStates, state?.stats.cardsStudiedToday]);

  const handleGrade = (cardId: string, rating: "again" | "good" | "easy") => {
    gradeCard(cardId, rating);

    const xpGain = rating === "easy" ? 15 : rating === "good" ? 10 : 5;
    if (state && state.stats.cardsStudiedToday + 1 >= state.settings.dailyGoal) {
      setTimeout(() => {
        toast.success("Daily goal reached! 🎉", {
          description: `You've earned ${xpGain} XP and maintained your streak!`,
        });
      }, 300);
    }
  };

  const startSession = () => {
    if (queue.length === 0) {
      toast.info("No cards available to study today");
      return;
    }
    setIsStudying(true);
  };

  if (!state) return null;

  const cardsRemaining = Math.max(0, state.settings.dailyGoal - state.stats.cardsStudiedToday);
  const progressPercent = (state.stats.cardsStudiedToday / state.settings.dailyGoal) * 100;
  const dailyGoalReached = state.stats.cardsStudiedToday >= state.settings.dailyGoal;
  const filteredCards = selectedCategory
    ? VOCABULARY_DATA.filter((c) => c.tag === selectedCategory)
    : VOCABULARY_DATA;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-serif text-slate-900">고요</h1>
              <p className="text-sm text-slate-500">Stillness · Scientific Korean Practice</p>
            </div>
            <div className="flex gap-6 items-center">
              <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
                <Flame size={20} className="text-orange-500" fill="currentColor" />
                <span className="font-bold text-orange-600">{state.stats.streak}</span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-100">
                <Star size={20} className="text-yellow-500" fill="currentColor" />
                <span className="font-bold text-yellow-600">{state.stats.totalXp}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
                <Settings size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Trophy size={140} />
            </div>
            <CardHeader>
              <CardTitle className="text-3xl font-serif">Ready to practice?</CardTitle>
              <p className="text-emerald-50 opacity-90 mt-2">
                {cardsRemaining > 0
                  ? `${cardsRemaining} cards left for today's goal`
                  : "Daily goal complete! Come back tomorrow."}
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <Button
                size="lg"
                className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-bold text-lg h-14 disabled:opacity-50"
                onClick={startSession}
                disabled={cardsRemaining <= 0}
              >
                <Play className="mr-2 fill-current" size={20} />
                Start Daily Session
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 font-medium flex items-center gap-2">
                  <BookOpen size={16} />
                  Today's Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {state.stats.cardsStudiedToday}/{state.settings.dailyGoal}
                </div>
                <Progress value={progressPercent} className="h-2 mt-3 bg-slate-100" />
                <p className="text-xs text-slate-400 mt-2">Cards studied today</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 font-medium flex items-center gap-2">
                  <Zap size={16} />
                  Level {state.stats.level}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">Expert</div>
                <p className="text-xs text-slate-400 mt-2">
                  {100 - (state.stats.totalXp % 100)} XP to next level
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 font-medium flex items-center gap-2">
                  <TrendingUp size={16} />
                  Total Learned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {state.stats.totalCardsLearned}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {Math.round((state.stats.totalCardsLearned / VOCABULARY_DATA.length) * 100)}% of deck
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Hangul Practice Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowAlphabet(true)}
          className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-base hover:shadow-lg transition-all"
        >
          <div className="text-2xl mb-1">🔤</div>
          Learn Hangul (Korean Alphabet)
        </motion.button>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-12 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setShowBrowse(true)}
          >
            <BookOpen className="mr-2" size={18} />
            Browse Deck
          </Button>
          <Button
            variant="outline"
            className="h-12 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setShowStats(true)}
          >
            <BarChart2 className="mr-2" size={18} />
            Full Stats
          </Button>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`p-3 rounded-xl text-center transition-all ${
                  selectedCategory === cat.id
                    ? cat.color
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <div className="text-lg mb-1">{cat.icon}</div>
                <div className="text-xs font-medium">{cat.name}</div>
              </motion.button>
            ))}
          </div>
        </div>
      </main>

      {/* Study Session Modal */}
      {isStudying && queue.length > 0 && (
        <StudySession
          queue={queue}
          onGrade={handleGrade}
          onClose={() => setIsStudying(false)}
          allowRepeat={dailyGoalReached}
        />
      )}

      {/* Alphabet Practice Modal */}
      {showAlphabet && (
        <AlphabetPractice onClose={() => setShowAlphabet(false)} />
      )}

      {/* Browse Dialog */}
      <Dialog open={showBrowse} onOpenChange={setShowBrowse}>
        <DialogContent className="w-full max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedCategory
                ? `${CATEGORIES.find((c) => c.id === selectedCategory)?.name} Vocabulary`
                : "Vocabulary Library"}
            </h2>
            <p className="text-sm text-slate-500 font-normal mt-1">
              {filteredCards.length} words
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-4 space-y-2">
              {filteredCards.length > 0 ? (
                filteredCards.map((card) => {
                  const romanization = getRomanization(card);
                  const isShowingRoman = showRomanization[card.id];
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-white border border-slate-100 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                    >
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-lg font-bold text-slate-900">{card.front}</div>
                          <div className="text-sm text-slate-600 font-medium">{card.back}</div>
                          {isShowingRoman && romanization && (
                            <div className="text-sm text-emerald-600 font-mono font-semibold mt-1">
                              <span className="text-xs text-slate-500 mr-2">Romanization:</span>
                              {romanization}
                            </div>
                          )}
                          {card.example && (
                            <div className="text-xs text-slate-500 italic mt-2 line-clamp-2">"{ card.example}"</div>
                          )}
                        </div>
                        <Badge variant="secondary" className="capitalize whitespace-nowrap flex-shrink-0">
                          {card.tag}
                        </Badge>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          onClick={() => speakKorean(card.front)}
                        >
                          <Volume2 size={14} />
                          Speak
                        </Button>
                        {romanization && (
                          <Button
                            variant="ghost"
                            size="sm"
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
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500">No words in this category</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Learning Statistics</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
              <div className="text-xs text-yellow-600 font-medium">Total XP</div>
              <div className="text-3xl font-bold text-yellow-700">{state.stats.totalXp}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="text-xs text-purple-600 font-medium">Current Level</div>
              <div className="text-3xl font-bold text-purple-700">{state.stats.level}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <div className="text-xs text-orange-600 font-medium">Longest Streak</div>
              <div className="text-3xl font-bold text-orange-700">{state.stats.highestStreak}d</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
              <div className="text-xs text-emerald-600 font-medium">Current Streak</div>
              <div className="text-3xl font-bold text-emerald-700">{state.stats.streak}d</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Daily Goal</label>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {state.settings.dailyGoal} cards
              </div>
            </div>
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-slate-700">Text-to-Speech</label>
              <div className="text-sm text-slate-500 mt-1">
                {state.settings.ttsEnabled ? "Enabled" : "Disabled"}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

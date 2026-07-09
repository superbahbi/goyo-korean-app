import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Flame, Star, Trophy, Play, BookOpen, BarChart2, Volume2, X, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Sample vocabulary data
const VOCABULARY_DATA = [
  { id: "surv_001", front: "안녕하세요 (annyeonghaseyo)", back: "Hello (polite/formal)", tag: "survival", example: "안녕하세요, 저는 학생입니다." },
  { id: "surv_002", front: "감사합니다 (gamsahamnida)", back: "Thank you (formal)", tag: "survival", example: "도와주셔서 감사합니다." },
  { id: "surv_003", front: "죄송합니다 (joesonghamnida)", back: "I'm sorry / Excuse me", tag: "survival", example: "늦어서 죄송합니다." },
  { id: "daily_001", front: "만나서 반가워요 (mannaseo bangawoyo)", back: "Nice to meet you", tag: "daily" },
  { id: "daily_002", front: "잘 지내요? (jal jinaeyo?)", back: "How are you doing?", tag: "daily" },
  { id: "daily_003", front: "좋아해요 (joahaeyo)", back: "I like it", tag: "daily" },
  { id: "num_001", front: "하나 / 둘 / 셋 (hana / dul / set)", back: "One / Two / Three", tag: "numbers" },
  { id: "food_001", front: "밥 (bap)", back: "Rice / Meal", tag: "food" },
  { id: "food_002", front: "물 (mul)", back: "Water", tag: "food" },
  { id: "food_003", front: "커피 (keopi)", back: "Coffee", tag: "food" },
];

interface CardState {
  id: string;
  box: number;
  due: string;
  interval: number;
  timesReviewed: number;
  timesCorrect: number;
}

interface UserState {
  cardStates: Record<string, CardState>;
  stats: {
    totalXp: number;
    level: number;
    streak: number;
    lastStudyDate: string;
    highestStreak: number;
  };
  settings: {
    dailyGoal: number;
    ttsEnabled: boolean;
    autoPlayAudio: boolean;
  };
}

const STORAGE_KEY = "goyo-progress-v1";

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

function StudySessionComponent({ queue, cardStates, onGrade, onClose }: any) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showRoman, setShowRoman] = useState(false);

  const currentCard = queue[index];

  useEffect(() => {
    if (currentCard && !flipped) {
      const timer = setTimeout(() => {
        speakKorean(cleanKoreanText(currentCard.front));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [index, currentCard, flipped]);

  const handleGrade = (rating: "again" | "good" | "easy") => {
    onGrade(rating);
    if (index < queue.length - 1) {
      setIndex(index + 1);
      setFlipped(false);
      setShowRoman(false);
    } else {
      onClose();
    }
  };

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <header className="p-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X />
        </Button>
        <div className="flex-1 px-8">
          <Progress value={(index / queue.length) * 100} className="h-2" />
        </div>
        <div className="text-sm font-medium text-slate-500">
          {index + 1} / {queue.length}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id + (flipped ? "-back" : "-front")}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md aspect-[3/4]"
          >
            <div 
              className={`w-full h-full relative transition-transform duration-500 ${flipped ? "rotate-y-180" : ""}`}
              style={{ transformStyle: "preserve-3d" }}
              onClick={!flipped ? () => setFlipped(true) : undefined}
            >
              <div 
                className="absolute inset-0 bg-white border-2 border-slate-100 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <Badge variant="outline" className="mb-8 capitalize text-slate-400 font-normal">
                  {currentCard.tag}
                </Badge>
                <h2 className="text-5xl font-bold text-slate-900 mb-6">
                  {cleanKoreanText(currentCard.front)}
                </h2>
                {showRoman && (
                  <p className="text-xl text-slate-500 font-mono mb-8">
                    {currentCard.front.match(/\(([^)]*)\)/)?.[1]}
                  </p>
                )}
                <div className="flex gap-4 mt-8">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="rounded-full w-12 h-12"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakKorean(cleanKoreanText(currentCard.front));
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
                {!flipped && (
                  <div className="absolute bottom-12 text-slate-300 flex items-center gap-2 text-sm animate-pulse">
                    Tap to reveal <ChevronRight size={16} />
                  </div>
                )}
              </div>

              <div 
                className="absolute inset-0 bg-emerald-50 border-2 border-emerald-100 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <Badge className="mb-8 bg-emerald-500">Meaning</Badge>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  {currentCard.back}
                </h2>
                {currentCard.example && (
                  <div className="mt-4 p-4 bg-white/50 rounded-2xl border border-emerald-100 max-w-xs">
                    <p className="text-sm text-slate-600 italic">"{currentCard.example}"</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="p-8 border-t bg-slate-50">
        {!flipped ? (
          <Button 
            className="w-full h-16 rounded-2xl text-xl font-bold bg-slate-900 hover:bg-slate-800"
            onClick={() => setFlipped(true)}
          >
            Reveal Answer
          </Button>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-1 border-2 border-red-100 hover:bg-red-50 text-red-600 rounded-2xl"
              onClick={() => handleGrade("again")}
            >
              <X size={20} />
              <span className="font-bold">Again</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-1 border-2 border-emerald-100 hover:bg-emerald-50 text-emerald-600 rounded-2xl"
              onClick={() => handleGrade("good")}
            >
              <Check size={20} />
              <span className="font-bold">Good</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-1 border-2 border-blue-100 hover:bg-blue-50 text-blue-600 rounded-2xl"
              onClick={() => handleGrade("easy")}
            >
              <Star size={20} />
              <span className="font-bold">Easy</span>
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
}

export default function Home() {
  const [state, setState] = useState<UserState | null>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [isStudying, setIsStudying] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const initial: UserState = raw ? JSON.parse(raw) : {
      cardStates: {},
      stats: {
        totalXp: 0,
        level: 1,
        streak: 0,
        lastStudyDate: "",
        highestStreak: 0
      },
      settings: {
        dailyGoal: 10,
        ttsEnabled: true,
        autoPlayAudio: true
      }
    };
    setState(initial);
  }, []);

  useEffect(() => {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const today = new Date().toISOString().slice(0, 10);
    const newCards = VOCABULARY_DATA.filter(c => !state.cardStates[c.id]).slice(0, 10);
    setQueue(newCards);
  }, [state?.cardStates]);

  const handleGrade = (rating: "again" | "good" | "easy") => {
    if (!state) return;
    
    const xpGain = rating === "easy" ? 15 : rating === "good" ? 10 : 5;
    const today = new Date().toISOString().slice(0, 10);
    
    setState({
      ...state,
      stats: {
        ...state.stats,
        totalXp: state.stats.totalXp + xpGain,
        level: Math.floor(Math.sqrt((state.stats.totalXp + xpGain) / 100)) + 1,
        lastStudyDate: today,
        streak: state.stats.lastStudyDate === today ? state.stats.streak : state.stats.streak + 1
      }
    });

    setQueue(prev => prev.slice(1));
    
    if (queue.length === 1) {
      setIsStudying(false);
      toast.success("Daily session complete! 🎉");
    }
  };

  if (!state) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-serif text-slate-900">고요</h1>
              <p className="text-sm text-slate-500">Stillness · Scientific Korean Practice</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-orange-500 font-bold">
                <Flame size={20} fill="currentColor" />
                <span>{state.stats.streak}</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-500 font-bold">
                <Star size={20} fill="currentColor" />
                <span>{state.stats.totalXp}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Trophy size={120} />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Ready to practice?</CardTitle>
              <p className="text-emerald-50 opacity-90">
                {queue.length > 0 
                  ? `You have ${queue.length} cards ready to learn.` 
                  : "You're all caught up! Come back tomorrow."}
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <Button 
                size="lg" 
                className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-bold text-lg h-14"
                onClick={() => setIsStudying(true)}
              >
                <Play className="mr-2 fill-current" />
                Start Daily Session
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium flex items-center gap-2">
                <BookOpen size={16} />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {Object.keys(state.cardStates).length}
              </div>
              <Progress value={Math.min(100, (Object.keys(state.cardStates).length / 10) * 100)} className="h-2 mt-2 bg-slate-100" />
              <p className="text-xs text-slate-400 mt-2">
                Cards started
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium flex items-center gap-2">
                <Star size={16} />
                Level {state.stats.level}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">Expert</div>
              <p className="text-xs text-slate-400 mt-2">
                {100 - (state.stats.totalXp % 100)} XP to next level
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 h-12 border-slate-200 text-slate-600" onClick={() => setShowBrowse(true)}>
            <BookOpen className="mr-2" size={18} />
            Browse Deck
          </Button>
          <Button variant="outline" className="flex-1 h-12 border-slate-200 text-slate-600" onClick={() => setShowStats(true)}>
            <BarChart2 className="mr-2" size={18} />
            Full Stats
          </Button>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-500">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {["survival", "daily", "numbers", "food"].map(tag => (
              <Badge key={tag} variant="secondary" className="px-3 py-1 bg-slate-100 text-slate-600 capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </main>

      {/* Study Session Modal */}
      {isStudying && queue.length > 0 && (
        <StudySessionComponent 
          queue={queue}
          cardStates={state.cardStates}
          onGrade={handleGrade}
          onClose={() => setIsStudying(false)}
        />
      )}

      {/* Browse Dialog */}
      <Dialog open={showBrowse} onOpenChange={setShowBrowse}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Vocabulary Library</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {VOCABULARY_DATA.map(card => (
                <div key={card.id} className="p-4 bg-white border rounded-xl flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold text-slate-900">{cleanKoreanText(card.front)}</div>
                    <div className="text-sm text-slate-500">{card.back}</div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{card.tag}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Learning Statistics</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-sm text-slate-500">Total XP</div>
              <div className="text-2xl font-bold">{state.stats.totalXp}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-sm text-slate-500">Current Level</div>
              <div className="text-2xl font-bold">{state.stats.level}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-sm text-slate-500">Longest Streak</div>
              <div className="text-2xl font-bold">{state.stats.highestStreak} days</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-sm text-slate-500">Current Streak</div>
              <div className="text-2xl font-bold">{state.stats.streak} days</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

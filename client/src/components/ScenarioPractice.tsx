import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronRight, RotateCcw, Volume2, X } from "lucide-react";
import { motion } from "framer-motion";
import { STUDY_READY_VOCABULARY, type VocabularyCard } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";

interface Scenario {
  id: string;
  place: string;
  prompt: string;
  cardId: string;
}

const SCENARIOS: Scenario[] = [
  { id: "greeting", place: "Meeting someone", prompt: "You meet someone for the first time. Greet them politely.", cardId: "surv_001" },
  { id: "thanks", place: "Receiving help", prompt: "Someone helps you. What do you say?", cardId: "surv_002" },
  { id: "sorry", place: "Apologizing", prompt: "You are late to an appointment. Apologize politely.", cardId: "surv_003" },
  { id: "bathroom", place: "Finding a place", prompt: "You are in a café and need to ask where the bathroom is.", cardId: "surv_008" },
  { id: "price", place: "Shopping", prompt: "You want to ask the price of an item.", cardId: "surv_009" },
  { id: "repair", place: "Conversation repair", prompt: "You did not understand someone. Tell them you do not know.", cardId: "surv_006" },
];

interface ScenarioPracticeProps {
  onGrade: (cardId: string, rating: "again" | "good") => void;
  onClose: () => void;
}

export function ScenarioPractice({ onGrade, onClose }: ScenarioPracticeProps) {
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [complete, setComplete] = useState(false);

  const scenarios = useMemo(() => [...SCENARIOS].sort(() => Math.random() - 0.5), []);
  const current = scenarios[index];
  const cardMap = useMemo(() => new Map(STUDY_READY_VOCABULARY.map((card) => [card.id, card])), []);
  const currentCard = current ? cardMap.get(current.cardId) : undefined;

  const choices = useMemo(() => {
    if (!currentCard) return [];
    const distractors = STUDY_READY_VOCABULARY
      .filter((card) => card.tag === "survival" && card.id !== currentCard.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    return [currentCard, ...distractors].sort(() => Math.random() - 0.5);
  }, [currentCard]);

  if (complete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={34} /></div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Scenario practice complete</p>
          <h2 className="mt-2 font-serif text-3xl text-slate-900">You used Korean in context</h2>
          <p className="mt-3 text-slate-600">You chose the useful phrase in <strong>{score}</strong> of {scenarios.length} situations.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="min-h-12 flex-1" onClick={() => { stopAudio(); onClose(); }}>Return to dashboard</Button>
            <Button className="min-h-12 flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { setIndex(0); setSelectedId(null); setScore(0); setComplete(false); }}>Practice again <RotateCcw size={16} className="ml-2" /></Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!current || !currentCard) return null;
  const answered = selectedId !== null;
  const isCorrect = selectedId === currentCard.id;

  const choose = (card: VocabularyCard) => {
    if (answered) return;
    setSelectedId(card.id);
    const correct = card.id === currentCard.id;
    if (correct) setScore((value) => value + 1);
    onGrade(currentCard.id, correct ? "good" : "again");
  };

  const next = () => {
    if (index === scenarios.length - 1) setComplete(true);
    else { setIndex((value) => value + 1); setSelectedId(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 p-4 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => { stopAudio(); onClose(); }} aria-label="Close scenario practice"><X size={20} /></Button>
        <div className="max-w-xs flex-1 px-4"><Progress value={(index / scenarios.length) * 100} className="h-2" /></div>
        <div className="min-w-[60px] text-right text-sm font-semibold text-slate-500">{index + 1} / {scenarios.length}<span className="block text-xs text-slate-400">Survival Korean</span></div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{current.place}</Badge>
          <h1 className="mt-4 font-serif text-3xl text-slate-900">What would you say?</h1>
          <p className="mt-2 text-lg leading-relaxed text-slate-600">{current.prompt}</p>
          <div className="mt-7 rounded-3xl border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-100/40 sm:p-7">
            <Button variant="outline" className="h-12 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => void playVocabularyAudio(currentCard.id, currentCard.front)}>
              <Volume2 size={18} className="mr-2" /> Hear a hint
            </Button>
            <p className="mt-3 text-center text-xs text-slate-400">Listen for the natural Korean phrase, then choose from memory.</p>
          </div>
          <div className="mt-5 grid gap-3">
            {choices.map((choice, choiceIndex) => {
              const chosen = selectedId === choice.id;
              const correct = choice.id === currentCard.id;
              const stateClass = !answered ? "border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50" : correct ? "border-emerald-400 bg-emerald-50 text-emerald-800" : chosen ? "border-red-300 bg-red-50 text-red-800" : "border-slate-100 bg-white/70 text-slate-400";
              return <button key={choice.id} disabled={answered} onClick={() => choose(choice)} className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 p-4 text-left font-semibold transition-all ${stateClass}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">{String.fromCharCode(65 + choiceIndex)}</span><span className="flex-1">{choice.front}</span>{answered && correct && <Check size={20} />}{answered && chosen && !correct && <X size={20} />}</button>;
            })}
          </div>
          {answered && <div className="mt-5 rounded-2xl bg-white/85 p-5 text-center"><p className={`font-semibold ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>{isCorrect ? "That fits the situation." : `A useful answer is “${currentCard.front}”.`}</p><p className="mt-2 text-sm text-slate-500">{currentCard.back} · {currentCard.example}</p><Button className="mt-4 min-h-12 w-full bg-slate-900 hover:bg-slate-800" onClick={next}>{index === scenarios.length - 1 ? "See results" : "Next situation"}<ChevronRight size={16} className="ml-2" /></Button></div>}
        </div>
      </main>
    </div>
  );
}

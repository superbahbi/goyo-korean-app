import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Eye, Headphones, RotateCcw, Volume2, X } from "lucide-react";
import { motion } from "framer-motion";
import { STUDY_READY_VOCABULARY } from "@/lib/vocabulary";
import { playVocabularyAudio, stopAudio } from "@/lib/audioPlayer";

interface ShadowingPracticeProps {
  onGrade: (cardId: string, rating: "again" | "good") => void;
  onClose: () => void;
}

export function ShadowingPractice({ onGrade, onClose }: ShadowingPracticeProps) {
  const cards = useMemo(
    () => STUDY_READY_VOCABULARY.filter((card) => card.tag === "survival" || card.tag === "daily").slice(0, 8),
    [],
  );
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [shadowed, setShadowed] = useState(false);
  const [complete, setComplete] = useState(false);
  const currentCard = cards[index];

  useEffect(() => {
    if (!currentCard || complete) return;
    const timer = window.setTimeout(() => void playVocabularyAudio(currentCard.id, currentCard.front), 300);
    return () => window.clearTimeout(timer);
  }, [currentCard, complete]);

  const close = () => {
    stopAudio();
    onClose();
  };

  const next = () => {
    if (!currentCard) return;
    onGrade(currentCard.id, shadowed ? "good" : "again");
    if (index === cards.length - 1) setComplete(true);
    else {
      setIndex((value) => value + 1);
      setVisible(false);
      setShadowed(false);
    }
  };

  if (complete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={34} /></div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Shadowing complete</p>
          <h2 className="mt-2 font-serif text-3xl text-slate-900">Your Korean had a voice</h2>
          <p className="mt-3 text-slate-600">You practiced matching the rhythm and sound of {cards.length} Korean phrases.</p>
          <Button className="mt-7 min-h-12 w-full bg-emerald-600 hover:bg-emerald-700" onClick={close}>Return to dashboard</Button>
        </motion.div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 p-4 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={close} aria-label="Close shadowing practice"><X size={20} /></Button>
        <div className="max-w-xs flex-1 px-4"><Progress value={(index / cards.length) * 100} className="h-2" /></div>
        <div className="min-w-[60px] text-right text-sm font-semibold text-slate-500">{index + 1} / {cards.length}<span className="block text-xs text-slate-400">Shadowing</span></div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-xl text-center">
          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Listen → imitate</Badge>
          <h1 className="mt-4 font-serif text-3xl text-slate-900">Match the model</h1>
          <p className="mx-auto mt-2 max-w-md text-slate-500">Listen once, then speak at the same time. Reveal the text only when you need support.</p>
          <div className="mt-8 rounded-3xl border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-100/40 sm:p-8">
            <Button onClick={() => void playVocabularyAudio(currentCard.id, currentCard.front)} className="mx-auto flex h-28 w-28 flex-col gap-2 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700">
              <Volume2 size={36} />
              <span className="text-xs">Play model</span>
            </Button>
            <p className="mt-5 text-sm text-slate-400">Replay as many times as you need.</p>
            {visible ? (
              <div className="mt-7 border-t border-slate-100 pt-6">
                <p className="text-4xl font-bold tracking-wide text-slate-900">{currentCard.front}</p>
                <p className="mt-2 font-mono text-emerald-600">{currentCard.romanization}</p>
                <p className="mt-4 text-sm italic text-slate-500">{currentCard.example}</p>
              </div>
            ) : (
              <Button variant="outline" className="mt-6 border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => setVisible(true)}><Eye size={16} className="mr-2" /> Reveal Korean</Button>
            )}
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4 text-left">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Headphones size={16} className="text-indigo-600" /> Did you shadow it aloud?</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Mark “I shadowed it” only after you have tried to match the model’s rhythm.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant={shadowed ? "default" : "outline"} className={shadowed ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"} onClick={() => setShadowed(true)}><Check size={16} className="mr-2" /> I shadowed it</Button>
              <Button variant="outline" className="border-slate-200 text-slate-600" onClick={() => setShadowed(false)}><X size={16} className="mr-2" /> Not yet</Button>
            </div>
          </div>
          <Button onClick={next} className="mt-5 min-h-12 w-full bg-slate-900 hover:bg-slate-800">{index === cards.length - 1 ? "Finish shadowing" : "Next phrase"}<RotateCcw size={16} className="ml-2 rotate-180" /></Button>
        </div>
      </main>
    </div>
  );
}

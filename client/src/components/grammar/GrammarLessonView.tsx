import { useState } from "react";
import { ArrowLeft, Lightbulb, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { GrammarQuiz } from "@/components/grammar/GrammarQuiz";
import { useSentenceAudioIds } from "@/hooks/useSentenceAudioIds";
import { grammarExampleId, type GrammarLesson } from "@/lib/grammar";
import type { GrammarProgress } from "@/lib/grammarProgress";
import { playSentenceAudio } from "@/lib/audioPlayer";

interface GrammarLessonViewProps {
  lesson: GrammarLesson;
  progress: GrammarProgress;
  onBack: () => void;
  onComplete: (correct: number, total: number) => void;
}

export function GrammarLessonView({
  lesson,
  progress,
  onBack,
  onComplete,
}: GrammarLessonViewProps) {
  const sentenceAudioIds = useSentenceAudioIds();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const best = progress.scores[lesson.id];
  const completed = progress.completedLessonIds.includes(lesson.id);

  const play = async (sentenceId: string) => {
    setPlayingId(sentenceId);
    try {
      await playSentenceAudio(sentenceId);
    } finally {
      setPlayingId(null);
    }
  };

  return (
    <>
      <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-emerald-50 to-white px-5 pb-4 pt-5 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-slate-600 hover:text-slate-900"
          onClick={onBack}
        >
          <ArrowLeft size={15} />
          All lessons
        </Button>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-200 bg-white text-emerald-700"
          >
            Lesson {lesson.order}
          </Badge>
          {completed && (
            <Badge className="bg-emerald-700 text-white">
              Completed
              {best ? ` · ${best.correct}/${best.total}` : ""}
            </Badge>
          )}
        </div>
        <DialogTitle
          className="mt-2 text-2xl font-bold text-slate-900"
          lang="ko"
        >
          {lesson.title}
        </DialogTitle>
        <p className="mt-1 text-sm text-slate-600">{lesson.subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <p className="text-[15px] leading-relaxed text-slate-700">
          {lesson.summary}
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {lesson.points.map(point => (
            <div
              key={point.heading}
              className="rounded-2xl border border-slate-200 bg-white p-3.5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {point.heading}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {point.body}
              </p>
            </div>
          ))}
        </div>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          Examples
        </h3>
        <ul className="mt-2 space-y-2">
          {lesson.examples.map((example, index) => {
            const sentenceId = grammarExampleId(lesson.id, index);
            const hasAudio = sentenceAudioIds.has(sentenceId);
            return (
              <li
                key={sentenceId}
                className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[15px] font-semibold leading-snug text-slate-900"
                    lang="ko"
                  >
                    {example.ko}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {example.en}
                  </p>
                </div>
                {hasAudio && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Play example: ${example.ko}`}
                    className="h-9 w-9 shrink-0 rounded-full text-emerald-700 hover:bg-emerald-100"
                    onClick={() => void play(sentenceId)}
                  >
                    <Volume2
                      size={16}
                      className={
                        playingId === sentenceId ? "animate-pulse" : ""
                      }
                    />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Lightbulb
            size={16}
            className="mt-0.5 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <p className="text-sm leading-relaxed text-amber-900">
            <span className="font-semibold">Common slip: </span>
            {lesson.mistake}
          </p>
        </div>

        <div className="mt-6">
          <GrammarQuiz
            key={lesson.id}
            lesson={lesson}
            best={best}
            onComplete={onComplete}
          />
        </div>
      </div>
    </>
  );
}

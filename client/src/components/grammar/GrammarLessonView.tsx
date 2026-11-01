import { useState } from "react";
import { Lightbulb, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GrammarQuiz } from "@/components/grammar/GrammarQuiz";
import { useSentenceAudioIds } from "@/hooks/useSentenceAudioIds";
import { grammarExampleId, type GrammarLesson } from "@/lib/grammar";
import type { GrammarProgress } from "@/lib/grammarProgress";
import { playSentenceAudio } from "@/lib/audioPlayer";

interface GrammarLessonViewProps {
  lesson: GrammarLesson;
  progress: GrammarProgress;
  onComplete: (correct: number, total: number) => void;
}

export function GrammarLessonView({
  lesson,
  progress,
  onComplete,
}: GrammarLessonViewProps) {
  const sentenceAudioIds = useSentenceAudioIds();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const best = progress.scores[lesson.id];

  const play = async (sentenceId: string) => {
    setPlayingId(sentenceId);
    try {
      await playSentenceAudio(sentenceId);
    } finally {
      setPlayingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed text-foreground/80">
        {lesson.summary}
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {lesson.points.map(point => (
          <div
            key={point.heading}
            className="rounded-2xl border border-border bg-card p-3.5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {point.heading}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/70">
              {point.body}
            </p>
          </div>
        ))}
      </div>

      <section aria-labelledby="grammar-examples">
        <h3
          id="grammar-examples"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70"
        >
          Examples
        </h3>
        <ul className="mt-2 space-y-2">
          {lesson.examples.map((example, index) => {
            const sentenceId = grammarExampleId(lesson.id, index);
            const hasAudio = sentenceAudioIds.has(sentenceId);
            return (
              <li
                key={sentenceId}
                className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/40"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[15px] font-semibold leading-snug text-foreground"
                    lang="ko"
                  >
                    {example.ko}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                    {example.en}
                  </p>
                </div>
                {hasAudio && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Play example: ${example.ko}`}
                    className="h-9 w-9 shrink-0 rounded-full text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
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
      </section>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/70 dark:bg-amber-950/40">
        <Lightbulb
          size={16}
          className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
          <span className="font-semibold">Common slip: </span>
          {lesson.mistake}
        </p>
      </div>

      <GrammarQuiz
        key={lesson.id}
        lesson={lesson}
        best={best}
        onComplete={onComplete}
      />
    </div>
  );
}

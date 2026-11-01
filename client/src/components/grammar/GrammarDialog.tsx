import { useState } from "react";
import { BookMarked, Check, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PracticeShell } from "@/components/practice/PracticeShell";
import { GrammarLessonView } from "@/components/grammar/GrammarLessonView";
import {
  GRAMMAR_LESSONS,
  GRAMMAR_LESSON_COUNT,
  findGrammarLesson,
} from "@/lib/grammar";
import type { GrammarProgress } from "@/lib/grammarProgress";
import { stopAudio } from "@/lib/audioPlayer";

interface GrammarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: GrammarProgress;
  onCompleteLesson: (lessonId: string, correct: number, total: number) => void;
}

export function GrammarDialog({
  open,
  onOpenChange,
  progress,
  onCompleteLesson,
}: GrammarDialogProps) {
  const [lessonId, setLessonId] = useState<string | null>(null);
  const lesson = lessonId ? findGrammarLesson(lessonId) : undefined;
  const completedCount = progress.completedLessonIds.filter(id =>
    GRAMMAR_LESSONS.some(entry => entry.id === id)
  ).length;

  const close = () => {
    stopAudio();
    setLessonId(null);
    onOpenChange(false);
  };

  const backToList = () => {
    stopAudio();
    setLessonId(null);
  };

  if (!open) return null;

  if (lesson) {
    const best = progress.scores[lesson.id];
    const completed = progress.completedLessonIds.includes(lesson.id);
    return (
      <PracticeShell
        key={lesson.id}
        title={lesson.title}
        titleLang="ko"
        badge={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-200 bg-card text-emerald-700 dark:border-emerald-800/70 dark:text-emerald-300"
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
        }
        description={lesson.subtitle}
        tone="teal"
        closeLabel="Close grammar lessons"
        onClose={close}
        onBack={backToList}
        backLabel="All lessons"
        progress={(lesson.order / GRAMMAR_LESSON_COUNT) * 100}
        progressLabel="Lesson progress"
        counter={`${lesson.order} / ${GRAMMAR_LESSON_COUNT}`}
        status="Lessons"
      >
        <GrammarLessonView
          lesson={lesson}
          progress={progress}
          onComplete={(correct, total) =>
            onCompleteLesson(lesson.id, correct, total)
          }
        />
      </PracticeShell>
    );
  }

  return (
    <PracticeShell
      key="list"
      title="Grammar Lessons"
      badge={
        <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/50 dark:text-teal-300 dark:hover:bg-teal-900/50">
          <BookMarked size={13} aria-hidden="true" />
          TOPIK I
        </Badge>
      }
      description="Patterns in the order the deck introduces them. Read, listen, then check yourself."
      tone="teal"
      closeLabel="Close grammar lessons"
      onClose={close}
      progress={(completedCount / GRAMMAR_LESSON_COUNT) * 100}
      progressLabel="Grammar lessons completed"
      counter={`${completedCount} / ${GRAMMAR_LESSON_COUNT}`}
      status="Lessons complete"
    >
      <ul className="space-y-2">
        {GRAMMAR_LESSONS.map(entry => {
          const score = progress.scores[entry.id];
          const completed = progress.completedLessonIds.includes(entry.id);
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setLessonId(entry.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition hover:border-emerald-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:hover:border-emerald-700"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    completed
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                  aria-hidden="true"
                >
                  {completed ? <Check size={17} /> : entry.order}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[15px] font-semibold text-foreground"
                    lang="ko"
                  >
                    {entry.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {entry.subtitle}
                  </span>
                </span>
                {score && (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    {score.correct}/{score.total}
                  </Badge>
                )}
                <ChevronRight
                  size={16}
                  className="shrink-0 text-muted-foreground/80"
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </PracticeShell>
  );
}

import { useState } from "react";
import { BookMarked, Check, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) close();
      }}
    >
      <DialogContent className="flex max-h-[92vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0">
        {lesson ? (
          <>
            <DialogDescription className="sr-only">
              Lesson {lesson.order}: {lesson.subtitle}
            </DialogDescription>
            <GrammarLessonView
              lesson={lesson}
              progress={progress}
              onBack={backToList}
              onComplete={(correct, total) =>
                onCompleteLesson(lesson.id, correct, total)
              }
            />
          </>
        ) : (
          <>
            <div className="shrink-0 border-b border-border bg-gradient-to-br from-emerald-50 dark:from-emerald-950/40 to-background px-5 pb-4 pt-6 sm:px-6">
              <div className="flex items-center gap-2">
                <BookMarked
                  size={20}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                <DialogTitle className="text-2xl font-bold text-foreground">
                  Grammar Lessons
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 text-sm text-foreground/70">
                TOPIK I patterns in the order the deck introduces them.
              </DialogDescription>
              <div className="mt-3 flex items-center gap-3">
                <div
                  role="progressbar"
                  aria-label="Grammar lessons completed"
                  aria-valuemin={0}
                  aria-valuemax={GRAMMAR_LESSON_COUNT}
                  aria-valuenow={completedCount}
                  className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{
                      width: `${(completedCount / GRAMMAR_LESSON_COUNT) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground/70">
                  {completedCount} / {GRAMMAR_LESSON_COUNT}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ul className="space-y-2 px-5 py-4 sm:px-6">
                {GRAMMAR_LESSONS.map(entry => {
                  const score = progress.scores[entry.id];
                  const completed = progress.completedLessonIds.includes(
                    entry.id
                  );
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => setLessonId(entry.id)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
                            className="shrink-0 border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
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
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

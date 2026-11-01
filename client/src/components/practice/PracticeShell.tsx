import { type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type PracticeTone =
  | "emerald"
  | "teal"
  | "indigo"
  | "violet"
  | "rose"
  | "amber"
  | "sky"
  | "neutral";

// One full-screen shell for every practice mode: same gradient rhythm, same
// close/progress/counter header, same scroll area and footer. Only the accent
// colour changes, so a learner always knows where they are.
export const practiceToneBackground: Record<PracticeTone, string> = {
  emerald:
    "bg-gradient-to-br from-background via-emerald-50 to-muted dark:via-emerald-950/40 dark:to-background",
  teal: "bg-gradient-to-br from-background via-teal-50 to-muted dark:via-teal-950/40 dark:to-background",
  indigo:
    "bg-gradient-to-br from-background via-indigo-50 to-muted dark:via-indigo-950/40 dark:to-background",
  violet:
    "bg-gradient-to-br from-background via-violet-50 to-muted dark:via-violet-950/40 dark:to-background",
  rose: "bg-gradient-to-br from-background via-rose-50 to-muted dark:via-rose-950/40 dark:to-background",
  amber:
    "bg-gradient-to-br from-background via-amber-50 to-muted dark:via-amber-950/40 dark:to-background",
  sky: "bg-gradient-to-br from-background via-sky-50 to-muted dark:via-sky-950/40 dark:to-background",
  neutral:
    "bg-gradient-to-br from-background via-muted to-background dark:via-muted/60",
};

interface PracticeShellProps {
  /** Dialog label and the visible heading unless `showTitle` is false. */
  title: string;
  titleLang?: string;
  badge?: ReactNode;
  description?: ReactNode;
  tone?: PracticeTone;
  closeLabel: string;
  onClose: () => void;
  /** Optional sub-navigation (for example back to a list). */
  onBack?: () => void;
  backLabel?: string;
  progress?: number;
  progressLabel?: string;
  counter?: string;
  status?: string;
  showTitle?: boolean;
  /** Centers short question content on tall screens. */
  center?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}

export function PracticeShell({
  title,
  titleLang,
  badge,
  description,
  tone = "neutral",
  closeLabel,
  onClose,
  onBack,
  backLabel = "Back",
  progress,
  progressLabel,
  counter,
  status,
  showTitle = true,
  center = false,
  footer,
  children,
}: PracticeShellProps) {
  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-modal="true"
        aria-describedby={undefined}
        showCloseButton={false}
        className={cn(
          "inset-0 top-0 left-0 z-50 data-[state=open]:animate-none data-[state=closed]:animate-none flex h-[100dvh] max-h-[100dvh] min-h-0 max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none sm:max-w-none",
          practiceToneBackground[tone],
          // Solid fallback under the gradient so the dashboard can never show
          // through, even if the gradient image fails to paint. Written as an
          // arbitrary property so it does not replace the gradient the way a
          // `bg-*` colour utility would.
          "[background-color:var(--background)]"
        )}
      >
        <header className="flex shrink-0 items-center gap-1.5 border-b border-border bg-card px-3 py-2.5 sm:px-4 sm:py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <X size={20} />
          </Button>
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              aria-label={backLabel}
              className="gap-1.5 text-foreground/70 hover:text-foreground"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">{backLabel}</span>
            </Button>
          )}
          <div className="min-w-0 flex-1 px-1.5 sm:px-3">
            {progress !== undefined && (
              <Progress
                value={Math.min(100, Math.max(0, progress))}
                aria-label={progressLabel ?? "Practice progress"}
                className="h-2"
              />
            )}
          </div>
          {counter && (
            <div className="min-w-[64px] text-right text-sm font-semibold text-muted-foreground">
              {counter}
              {status && (
                <span className="block text-xs font-normal text-muted-foreground">
                  {status}
                </span>
              )}
            </div>
          )}
        </header>

        <main
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-6 [scrollbar-gutter:stable] sm:px-6 sm:py-8",
            footer ? "pb-6" : "pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          )}
        >
          <div
            className={cn(
              "mx-auto flex w-full max-w-2xl flex-col",
              center && "sm:min-h-full sm:justify-center"
            )}
          >
            {showTitle ? (
              <div className="mb-5 text-center sm:mb-6">
                {badge && <div className="flex justify-center">{badge}</div>}
                <DialogTitle asChild>
                  <h1
                    className="mt-3 font-serif text-2xl leading-tight text-foreground sm:mt-4 sm:text-3xl"
                    lang={titleLang}
                  >
                    {title}
                  </h1>
                </DialogTitle>
                {description && (
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            ) : (
              <DialogTitle className="sr-only">{title}</DialogTitle>
            )}
            {children}
          </div>
        </main>

        {footer && (
          <footer className="shrink-0 border-t border-border bg-card px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:py-4">
            {footer}
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Primary action shared by every practice footer. */
export function PracticePrimaryButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={cn(
        "min-h-12 w-full rounded-xl bg-slate-900 text-base font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
        className
      )}
    />
  );
}

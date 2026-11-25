import { Compass, Home } from "lucide-react";
import { useLocation } from "wouter";

/**
 * An unknown route. It shares the dashboard's emerald surface and primary
 * action, and reassures the learner that their saved progress is untouched.
 */
export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-emerald-50 to-muted px-4 dark:via-emerald-950/40">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-card/90 p-8 text-center shadow-xl shadow-emerald-100/40 backdrop-blur-sm dark:border-emerald-900/60 dark:shadow-black/20">
        <span
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
          aria-hidden="true"
        >
          <Compass size={32} />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
          Page not found
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          This page is not part of Goyo
        </h1>
        <p className="mt-3 leading-relaxed text-foreground/70">
          The link may be old or mistyped. Your saved progress in this browser
          is untouched.
        </p>
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="mt-8 inline-flex h-11 touch-manipulation items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 active:scale-[0.99] dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 sm:text-base"
        >
          <Home size={16} aria-hidden="true" />
          Back to dashboard
        </button>
      </div>
    </main>
  );
}

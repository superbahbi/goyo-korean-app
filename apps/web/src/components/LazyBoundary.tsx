import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isChunkLoadError, reloadToLatestApp } from "@domain/appReload";

interface LazyBoundaryProps {
  onClose: () => void;
  children: ReactNode;
}

interface LazyBoundaryState {
  failed: boolean;
  error: unknown;
}

/**
 * Keeps a failed chunk download (stale deploy, offline) from unmounting the whole
 * dashboard through the root error boundary.
 */
export class LazyBoundary extends Component<
  LazyBoundaryProps,
  LazyBoundaryState
> {
  state: LazyBoundaryState = { failed: false, error: null };

  static getDerivedStateFromError(error: unknown): LazyBoundaryState {
    return { failed: true, error };
  }

  componentDidCatch(error: unknown) {
    console.error("Failed to load a practice mode:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    // React.lazy caches a rejected import, so a retry rethrows the same error.
    // Only a page load fetches the chunk again.
    const stale = isChunkLoadError(this.state.error);

    return (
      <div
        role="alertdialog"
        aria-labelledby="lazy-boundary-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      >
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-400"
              size={20}
              aria-hidden="true"
            />
            <div>
              <h2
                id="lazy-boundary-title"
                className="text-lg font-semibold text-foreground"
              >
                This practice mode could not load
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {stale
                  ? "Goyo was probably updated while it was open. Reload to get the new version. Your saved progress is kept."
                  : "The connection may have dropped. Try again, and refresh the page if it keeps failing."}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-1"
              onClick={() =>
                stale
                  ? void reloadToLatestApp({
                      serviceWorker: navigator.serviceWorker,
                      reload: () => window.location.reload(),
                      setTimeout: (handler, ms) =>
                        window.setTimeout(handler, ms),
                      clearTimeout: id => window.clearTimeout(id),
                    })
                  : this.setState({ failed: false, error: null })
              }
            >
              {stale ? "Reload Goyo" : "Try again"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-card sm:flex-1"
              onClick={this.props.onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

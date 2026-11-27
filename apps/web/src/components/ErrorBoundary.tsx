import { cn } from "@domain/utils";
import { isChunkLoadError, reloadToLatestApp } from "@domain/appReload";
import {
  clearProgress,
  PROGRESS_STORAGE_KEY,
  progressBackupFileName,
} from "@domain/progressStorage";
import { AlertTriangle, Download, RotateCcw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  /** A lazy chunk is gone (a newer deploy); only a reload can recover. */
  staleChunk: boolean;
  confirmingReset: boolean;
}

// The iOS shell serves the app from goyo:// (see App.tsx). Its WKWebView does
// not handle <a download>, so a backup link there would open the raw file in a
// view with no way back; the shell keeps its own Settings export instead.
const CAN_DOWNLOAD_FILES =
  typeof window !== "undefined" && window.location.protocol !== "goyo:";

/** The stored save exactly as written; null when none or storage is blocked. */
function readRawSave(): string | null {
  if (!CAN_DOWNLOAD_FILES) return null;
  try {
    return localStorage.getItem(PROGRESS_STORAGE_KEY);
  } catch {
    return null;
  }
}

// The save is not parsed: the crash may come from it, and a newer build's save
// must be kept byte for byte.
function downloadRawSave(raw: string) {
  const url = URL.createObjectURL(
    new Blob([raw], { type: "application/json" })
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = progressBackupFileName();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resetProgressAndReload() {
  try {
    clearProgress();
  } catch (error) {
    console.error("Failed to reset local progress:", error);
  }
  window.location.reload();
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, staleChunk: false, confirmingReset: false };
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      staleChunk: isChunkLoadError(error),
      confirmingReset: false,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled application error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const { staleChunk } = this.state;
      // A missing chunk after a deploy is not broken progress: offer the
      // reload onto the new build and keep backup and reset out of the way.
      const rawSave = staleChunk ? null : readRawSave();
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-2">
              {staleChunk ? "Goyo has been updated." : "Something went wrong."}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {staleChunk
                ? "This page is from an older version, or the connection dropped. Reload to get the latest version. Your saved progress is kept."
                : rawSave !== null
                  ? "Try reloading the page. If the problem keeps happening, download a backup of your progress first, then reset it. Resetting erases saved study history on this device."
                  : "Try reloading the page. If the problem keeps happening, you can reset your local progress, which erases saved study history on this device."}
            </p>

            {this.state.confirmingReset && (
              <p
                role="alert"
                className="mb-4 max-w-md text-center text-sm text-destructive"
              >
                This permanently erases saved progress on this device. Click the
                button again to confirm, or reload instead.
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() =>
                  staleChunk
                    ? void reloadToLatestApp({
                        serviceWorker: navigator.serviceWorker,
                        reload: () => window.location.reload(),
                        setTimeout: (handler, ms) =>
                          window.setTimeout(handler, ms),
                        clearTimeout: id => window.clearTimeout(id),
                      })
                    : window.location.reload()
                }
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>
              {rawSave !== null && (
                <button
                  onClick={() => downloadRawSave(rawSave)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg",
                    "border border-border text-foreground",
                    "hover:bg-muted cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  <Download size={16} />
                  Download backup
                </button>
              )}
              {!staleChunk && (
                <button
                  onClick={() => {
                    if (!this.state.confirmingReset) {
                      this.setState({ confirmingReset: true });
                      return;
                    }
                    resetProgressAndReload();
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg",
                    "border border-destructive text-destructive",
                    "hover:bg-destructive/10 cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                  )}
                >
                  {this.state.confirmingReset
                    ? "Yes, erase local progress"
                    : "Reset local progress"}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

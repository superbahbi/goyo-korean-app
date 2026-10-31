import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  confirmingReset: boolean;
}

const STORAGE_KEY = "goyo-progress-v2";

function resetProgressAndReload() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to reset local progress:", error);
  }
  window.location.reload();
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, confirmingReset: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, confirmingReset: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled application error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-2">Something went wrong.</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Try reloading the page. If the problem keeps happening, you can
              reset your local progress, which erases saved study history on
              this device.
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
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>
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
                  "hover:bg-destructive/10 cursor-pointer"
                )}
              >
                {this.state.confirmingReset
                  ? "Yes, erase local progress"
                  : "Reset local progress"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import { Toaster } from "@/components/ui/sonner";
import { Component, lazy, Suspense, type ReactNode } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const GoyoMobileApp = lazy(() => import("../../../mobile/App"));

// Analytics are not needed to paint or study, so their code loads after the
// app does and stays out of the first-load bundle.
const Analytics = lazy(() =>
  import("@vercel/analytics/react").then(m => ({ default: m.Analytics }))
);
const SpeedInsights = lazy(() =>
  import("@vercel/speed-insights/react").then(m => ({
    default: m.SpeedInsights,
  }))
);

/**
 * Swallows a failed analytics chunk (offline, blocked by an extension). A lazy
 * import that rejects throws during render, and with no boundary around it the
 * whole root would unmount.
 */
class AnalyticsBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// The iOS shell serves this bundle from its own goyo:// scheme. Vercel's
// analytics describe the website only, so the native app never loads them.
const IN_NATIVE_SHELL =
  typeof window !== "undefined" && window.location.protocol === "goyo:";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/mobile"}>
        <Suspense fallback={null}>
          <GoyoMobileApp />
        </Suspense>
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - The palette lives in index.css: light tokens in `:root`, dark overrides in `.dark`.
// - ThemeProvider persists the choice to localStorage and follows the OS by default,
//   so `bg-card`, `text-foreground`, `text-muted-foreground` and `border-border`
//   resolve correctly in either theme.

function App() {
  return (
    <>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="system" switchable>
          <Toaster />
          <Router />
        </ThemeProvider>
      </ErrorBoundary>
      {/* Aggregate, cookieless page views and Core Web Vitals, disclosed in the
          dashboard footer. Kept outside the error boundary so a failed
          analytics script can never take down the study app. */}
      {!IN_NATIVE_SHELL && (
        <AnalyticsBoundary>
          <Suspense fallback={null}>
            <Analytics />
            <SpeedInsights />
          </Suspense>
        </AnalyticsBoundary>
      )}
    </>
  );
}

export default App;

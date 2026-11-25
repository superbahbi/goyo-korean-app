import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { MotionConfig } from "framer-motion";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const GoyoMobileApp = lazy(() => import("../../../mobile/App"));

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
        <MotionConfig reducedMotion="user">
          <ThemeProvider defaultTheme="system" switchable>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </MotionConfig>
      </ErrorBoundary>
      {/* Aggregate, cookieless page views and Core Web Vitals, disclosed in the
          dashboard footer. Kept outside the error boundary so a failed
          analytics script can never take down the study app. */}
      {!IN_NATIVE_SHELL && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </>
  );
}

export default App;

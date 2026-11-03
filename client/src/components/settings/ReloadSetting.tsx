import { useState } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reloadToLatestApp } from "@/lib/appReload";

/**
 * The installed PWA can sit on an old build when the update toast is missed.
 * The policy lives in `lib/appReload.ts`: ask a waiting worker to activate and
 * wait for it before reloading, so the new precache is actually served.
 */
export function ReloadSetting() {
  const [reloading, setReloading] = useState(false);

  const reload = () => {
    setReloading(true);
    void reloadToLatestApp({
      serviceWorker: navigator.serviceWorker,
      reload: () => window.location.reload(),
      setTimeout: (handler, ms) => window.setTimeout(handler, ms),
      clearTimeout: id => window.clearTimeout(id),
    });
  };

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="text-sm font-medium text-foreground/80">App version</div>
      <p className="text-xs leading-relaxed text-foreground/70">
        Reload Goyo to pick up a new version. Your saved progress is kept.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={reload}
        disabled={reloading}
      >
        <RotateCw aria-hidden="true" />
        {reloading ? "Reloading…" : "Reload app"}
      </Button>
    </div>
  );
}

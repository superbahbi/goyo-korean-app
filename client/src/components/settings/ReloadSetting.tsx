import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The installed PWA can sit on an old build when the update toast is missed.
 * A waiting service worker only activates after skip-waiting, so ask for that
 * before reloading; without a waiting worker this is a plain reload.
 */
async function reloadApp(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
  } catch {
    /* no service worker: reload is still safe */
  }
  window.location.reload();
}

export function ReloadSetting() {
  return (
    <div className="space-y-2 border-t pt-4">
      <div className="text-sm font-medium text-slate-700">App version</div>
      <p className="text-xs leading-relaxed text-slate-600">
        Reload Goyo to pick up a new version. Your saved progress is kept.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void reloadApp()}
      >
        <RotateCw aria-hidden="true" />
        Reload app
      </Button>
    </div>
  );
}

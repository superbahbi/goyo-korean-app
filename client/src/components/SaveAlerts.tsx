import { AlertTriangle } from "lucide-react";

interface SaveAlertsProps {
  saveBlocked: boolean;
  saveError: boolean;
}

/** Storage warnings shown above the dashboard when saves cannot be trusted. */
export function SaveAlerts({ saveBlocked, saveError }: SaveAlertsProps) {
  return (
    <>
      {saveBlocked && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-4 text-amber-950 dark:text-amber-50 shadow-sm"
        >
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">
              A newer save from Goyo is stored in this browser.
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              This tab was built for an older save format, so it will not
              overwrite that progress, and new study in this tab will not be
              saved. Update Goyo and reload this page to continue where you left
              off.
            </p>
          </div>
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 p-4 text-red-900 dark:text-red-100 shadow-sm"
        >
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">Your progress is not being saved.</p>
            <p className="mt-1 text-sm leading-relaxed">
              This browser's storage is full or blocked, so changes in this tab
              are only kept in memory. Export your progress from Settings before
              closing or reloading the page.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

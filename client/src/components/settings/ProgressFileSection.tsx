import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { UserState } from "@/hooks/useStudyState";
import { describeBackupAge, isBackupOverdue } from "@/lib/backupStatus";
import type { ProgressFile } from "@/components/settings/useProgressFile";

interface ProgressFileSectionProps {
  state: UserState;
  progressFile: ProgressFile;
}

export function ProgressFileSection({
  state,
  progressFile,
}: ProgressFileSectionProps) {
  const {
    pendingImport,
    clearPendingImport,
    includeReviewLog,
    setIncludeReviewLog,
    lastBackupAt,
    importInputRef,
    handleExportProgress,
    handleImportFile,
    confirmImport,
  } = progressFile;

  return (
    <div className="border-t pt-4 space-y-2">
      <div className="text-sm font-medium text-foreground/80">
        Progress file
      </div>
      <p className="text-xs leading-relaxed text-foreground/70">
        Progress is saved only in this browser. Export a JSON file to move it to
        another device, then import that file there.
      </p>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs leading-relaxed text-foreground/70">
          {describeBackupAge(lastBackupAt)}
        </p>
        {isBackupOverdue(lastBackupAt) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-200"
            onClick={handleExportProgress}
          >
            Export now
          </Button>
        )}
      </div>
      <label className="flex items-start gap-2 rounded-lg border border-border bg-muted/60 p-3">
        <Checkbox
          id="include-review-log"
          checked={includeReviewLog}
          onCheckedChange={checked => setIncludeReviewLog(checked === true)}
          className="mt-0.5"
        />
        <span className="text-xs leading-relaxed text-foreground/70">
          <span className="block text-sm font-medium text-foreground/80">
            Include review log
          </span>
          Adds {state.reviewLog.entries.length}{" "}
          {state.reviewLog.entries.length === 1 ? "entry" : "entries"} of grade
          history for analysis. Leave it off to keep the file small; it is not
          needed to restore progress.
        </span>
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="w-full bg-card sm:flex-1"
          onClick={handleExportProgress}
        >
          <Download aria-hidden="true" />
          Export progress
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full bg-card sm:flex-1"
          onClick={() => importInputRef.current?.click()}
        >
          <Upload aria-hidden="true" />
          Import progress
        </Button>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
      {pendingImport && (
        <div
          role="region"
          aria-labelledby="import-confirm-title"
          className="space-y-3 rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/40 p-3"
        >
          <p
            id="import-confirm-title"
            className="text-sm font-medium text-amber-900 dark:text-amber-100"
          >
            Replace current progress?
          </p>
          <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-100">
            {pendingImport.fileName} contains{" "}
            {Object.keys(pendingImport.state.cardStates).length}{" "}
            {Object.keys(pendingImport.state.cardStates).length === 1
              ? "card"
              : "cards"}
            {pendingImport.exportedAt
              ? `, exported ${new Date(pendingImport.exportedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`
              : ""}
            . Importing it replaces your current progress (
            {Object.keys(state.cardStates).length} cards) in this browser.
            Export first if you want to keep it.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={confirmImport}
            >
              Replace progress
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-card"
              autoFocus
              onClick={clearPendingImport}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

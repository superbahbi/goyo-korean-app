import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  buildExportPayload,
  importSizeRejection,
  stateAfterImport,
  validateImportPayload,
  type UserState,
} from "@domain/savedState";
import { getLastBackupAt, recordBackup } from "@domain/backupStatus";

export interface PendingImport {
  state: UserState;
  exportedAt: string | null;
  fileName: string;
  hasReviewLog: boolean;
}

interface UseProgressFileOptions {
  state: UserState;
  replaceState: (next: UserState) => void;
  /** A newer build's save is stored here; an import would not be written. */
  saveBlocked: boolean;
  today: string;
}

// The store never overwrites a newer build's save, so an import in this tab
// would only live in memory. Say so instead of reporting a success that a
// reload would undo.
function rejectImportWhileBlocked(): void {
  toast.error("Import paused", {
    description:
      "This browser has progress from a newer version of Goyo. Reload the app to update it, then import the file.",
  });
}

export function useProgressFile({
  state,
  replaceState,
  saveBlocked,
  today,
}: UseProgressFileOptions) {
  // Rendered only while open, so import drafts never leak between opens.
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(
    null
  );
  const [includeReviewLog, setIncludeReviewLog] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<Date | null>(() =>
    getLastBackupAt()
  );
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExportProgress = () => {
    const payload = buildExportPayload(state, new Date(), { includeReviewLog });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const fileName = `goyo-progress-${today}.json`;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    recordBackup();
    setLastBackupAt(new Date());

    const cardCount = Object.keys(state.cardStates).length;
    if (cardCount === 0) {
      toast.success("Exported a fresh save", {
        description: `${fileName} has no card progress yet.`,
      });
    } else {
      toast.success(
        `Exported progress for ${cardCount} ${cardCount === 1 ? "card" : "cards"}`,
        { description: fileName }
      );
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (saveBlocked) {
      rejectImportWhileBlocked();
      return;
    }

    const tooBig = importSizeRejection(file.size);
    if (tooBig) {
      toast.error("Import failed", { description: tooBig });
      return;
    }

    let result;
    try {
      result = validateImportPayload(await file.text());
    } catch {
      toast.error("Import failed", {
        description: "The file could not be read.",
      });
      return;
    }

    if (!result.ok) {
      toast.error("Import failed", { description: result.reason });
      return;
    }
    setPendingImport({
      state: result.state,
      exportedAt: result.exportedAt,
      fileName: file.name,
      hasReviewLog: result.hasReviewLog,
    });
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    if (saveBlocked) {
      setPendingImport(null);
      rejectImportWhileBlocked();
      return;
    }
    // A progress-only file must not wipe the local review log.
    replaceState(stateAfterImport(state, pendingImport));
    const cardCount = Object.keys(pendingImport.state.cardStates).length;
    setPendingImport(null);
    toast.success(
      `Imported progress for ${cardCount} ${cardCount === 1 ? "card" : "cards"}`
    );
  };

  return {
    pendingImport,
    clearPendingImport: () => setPendingImport(null),
    includeReviewLog,
    setIncludeReviewLog,
    lastBackupAt,
    importInputRef,
    handleExportProgress,
    handleImportFile,
    confirmImport,
  };
}

export type ProgressFile = ReturnType<typeof useProgressFile>;

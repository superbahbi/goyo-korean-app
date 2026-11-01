import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  buildExportPayload,
  validateImportPayload,
  type UserState,
} from "@/hooks/useStudyState";
import { getLastBackupAt, recordBackup } from "@/lib/backupStatus";

export interface PendingImport {
  state: UserState;
  exportedAt: string | null;
  fileName: string;
  hasReviewLog: boolean;
}

interface UseProgressFileOptions {
  state: UserState;
  replaceState: (next: UserState) => void;
  today: string;
}

export function useProgressFile({
  state,
  replaceState,
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
    // A progress-only file must not wipe the local review log.
    replaceState({
      ...pendingImport.state,
      reviewLog: pendingImport.hasReviewLog
        ? pendingImport.state.reviewLog
        : state.reviewLog,
    });
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

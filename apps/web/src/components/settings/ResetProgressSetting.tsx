import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { UserState } from "@domain/savedState";

interface ResetProgressSettingProps {
  state: UserState;
  resetProgress: () => Promise<void>;
}

/**
 * Erases this browser's saved progress after an explicit second step. The
 * confirmation says what will be lost and points at the export above it, the
 * same pattern as "Replace current progress?" on import.
 */
export function ResetProgressSetting({
  state,
  resetProgress,
}: ResetProgressSettingProps) {
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const cardCount = Object.keys(state.cardStates).length;

  const confirmReset = async () => {
    setResetting(true);
    try {
      await resetProgress();
      toast.success("Progress reset", {
        description: "This browser now starts from a fresh save.",
      });
      setConfirming(false);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="text-sm font-medium text-foreground/80">
        Reset progress
      </div>
      <p className="text-xs leading-relaxed text-foreground/70">
        Start over from a fresh save. Theme and downloaded audio are kept.
      </p>
      {confirming ? (
        <div
          role="region"
          aria-labelledby="reset-confirm-title"
          className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800/70 dark:bg-red-950/40"
        >
          <p
            id="reset-confirm-title"
            className="text-sm font-medium text-red-900 dark:text-red-100"
          >
            Erase all progress in this browser?
          </p>
          <p className="text-xs leading-relaxed text-red-900 dark:text-red-100">
            This deletes the schedule for {cardCount}{" "}
            {cardCount === 1 ? "card" : "cards"}, your XP, streak, review
            history, grammar scores and study settings. It cannot be undone.
            Export your progress first if you might want it back.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={resetting}
              onClick={() => void confirmReset()}
            >
              {resetting ? "Erasing…" : "Erase progress"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-card"
              autoFocus
              disabled={resetting}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800/70 dark:text-red-300 dark:hover:bg-red-950/40 dark:hover:text-red-200"
          onClick={() => setConfirming(true)}
        >
          <Trash2 aria-hidden="true" />
          Reset progress
        </Button>
      )}
    </div>
  );
}

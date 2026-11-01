import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DownloadAllAudio } from "@/components/DownloadAllAudio";
import { AudioSpeakerSetting } from "@/components/settings/AudioSpeakerSetting";
import { ProgressFileSection } from "@/components/settings/ProgressFileSection";
import {
  AutoPlaySetting,
  DailyGoalSetting,
  NewCardsPerDaySetting,
} from "@/components/settings/StudyPaceSettings";
import { useProgressFile } from "@/components/settings/useProgressFile";
import type { UserState } from "@/hooks/useStudyState";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: UserState;
  updateSettings: (settings: Partial<UserState["settings"]>) => void;
  replaceState: (next: UserState) => void;
  today: string;
}

export function SettingsDialog({
  open,
  onOpenChange,
  state,
  updateSettings,
  replaceState,
  today,
}: SettingsDialogProps) {
  const progressFile = useProgressFile({ state, replaceState, today });

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) progressFile.clearPendingImport();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Daily goal, Korean speaker, and progress export and import.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <DailyGoalSetting
            settings={state.settings}
            updateSettings={updateSettings}
          />
          <NewCardsPerDaySetting
            settings={state.settings}
            updateSettings={updateSettings}
          />
          <AutoPlaySetting
            settings={state.settings}
            updateSettings={updateSettings}
          />
          <AudioSpeakerSetting
            settings={state.settings}
            updateSettings={updateSettings}
          />
          <ProgressFileSection state={state} progressFile={progressFile} />
          <DownloadAllAudio />
        </div>
      </DialogContent>
    </Dialog>
  );
}

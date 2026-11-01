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
import { ReloadSetting } from "@/components/settings/ReloadSetting";
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
      {/*
        The title stays put and only the options scroll. `dvh` (with `vh` as the
        fallback) keeps the card inside the visible area on phones: `vh` is the
        height with the browser toolbar hidden, so 90vh can put the bottom of the
        card under the toolbar where no scroll can reach it.
      */}
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden p-0 supports-[height:100dvh]:max-h-[90dvh]">
        <DialogHeader className="shrink-0 border-b px-6 pt-6 pr-12 pb-4 text-left">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Daily goal, Korean speaker, progress export and import, and reload.
          </DialogDescription>
        </DialogHeader>
        <div
          role="group"
          aria-label="Settings options"
          tabIndex={0}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
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
          <ReloadSetting />
        </div>
      </DialogContent>
    </Dialog>
  );
}

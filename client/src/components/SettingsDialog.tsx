import { useRef, useState, type ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DownloadAllAudio } from "@/components/DownloadAllAudio";
import {
  buildExportPayload,
  validateImportPayload,
  type UserState,
} from "@/hooks/useStudyState";
import {
  describeBackupAge,
  getLastBackupAt,
  isBackupOverdue,
  recordBackup,
} from "@/lib/backupStatus";
import {
  setAudioSpeaker,
  stopAudio,
  type AudioSpeaker,
} from "@/lib/audioPlayer";

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
  // Rendered only while open, so import drafts never leak between opens.
  const [pendingImport, setPendingImport] = useState<{
    state: UserState;
    exportedAt: string | null;
    fileName: string;
    hasReviewLog: boolean;
  } | null>(null);
  const [includeReviewLog, setIncludeReviewLog] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<Date | null>(() =>
    getLastBackupAt()
  );
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleSpeakerChange = (speaker: AudioSpeaker) => {
    updateSettings({ audioSpeaker: speaker });
    setAudioSpeaker(speaker);
    toast.success("Speaker preference saved");
  };

  const handleDailyGoalChange = (value: string) => {
    const dailyGoal = Number(value);
    if (!Number.isFinite(dailyGoal) || dailyGoal < 1) return;
    updateSettings({ dailyGoal });
    toast.success(`Daily goal set to ${dailyGoal} cards`);
  };

  const handleNewCardsPerDayChange = (value: string) => {
    const newCardsPerDay = Number(value);
    if (!Number.isFinite(newCardsPerDay) || newCardsPerDay < 1) return;
    updateSettings({ newCardsPerDay });
    toast.success(`New cards set to ${newCardsPerDay} per day`);
  };

  const handleAutoPlayChange = (autoPlayAudio: boolean) => {
    updateSettings({ autoPlayAudio });
    if (!autoPlayAudio) stopAudio();
  };

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

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) setPendingImport(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Daily goal, Korean speaker, and progress export and import.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="daily-goal"
            >
              Daily Goal
            </label>
            <Select
              value={String(state.settings.dailyGoal)}
              onValueChange={handleDailyGoalChange}
            >
              <SelectTrigger id="daily-goal" className="mt-2 w-full bg-white">
                <SelectValue placeholder="Choose a daily goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 cards · Quick practice</SelectItem>
                <SelectItem value="10">10 cards · Balanced</SelectItem>
                <SelectItem value="15">15 cards · Focused</SelectItem>
                <SelectItem value="20">20 cards · Intensive</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Choose a goal you can sustain. Consistent recall is more valuable
              than a large daily streak.
            </p>
          </div>
          <div className="border-t pt-4">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="new-cards-per-day"
            >
              New cards per day
            </label>
            <Select
              value={String(state.settings.newCardsPerDay)}
              onValueChange={handleNewCardsPerDayChange}
            >
              <SelectTrigger
                id="new-cards-per-day"
                className="mt-2 w-full bg-white"
              >
                <SelectValue placeholder="Choose a new-card pace" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 8, 10].map(count => (
                  <SelectItem key={count} value={String(count)}>
                    {count} new {count === 1 ? "card" : "cards"} per day
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Brand-new words are capped at this number each day, so the daily
              goal can run shorter on a fresh deck. Due reviews still come
              first, so a lower pace keeps the session short without hiding
              scheduled work.
            </p>
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="auto-play-audio"
                >
                  Auto-play pronunciation
                </label>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Play the clip as each card appears. Off leaves audio to the
                  speaker button, so nothing plays until you tap.
                </p>
              </div>
              <Switch
                id="auto-play-audio"
                checked={state.settings.autoPlayAudio}
                onCheckedChange={checked => handleAutoPlayChange(checked)}
              />
            </div>
          </div>
          <div className="border-t pt-4 space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="audio-speaker"
            >
              Korean speaker
            </label>
            <Select
              value={state.settings.audioSpeaker}
              onValueChange={value =>
                handleSpeakerChange(value as AudioSpeaker)
              }
            >
              <SelectTrigger id="audio-speaker" className="w-full bg-white">
                <SelectValue placeholder="Choose a speaker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elevenlabs">
                  Hyuk · Cold &amp; Clear
                </SelectItem>
                <SelectItem value="elevenlabs-female">
                  Jini · Warm &amp; Intelligent
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs leading-relaxed text-slate-500">
              Goyo uses ElevenLabs recordings only. Choose Hyuk for a cold,
              clear delivery or Jini for a warm, intelligent Seoul Korean voice.
            </p>
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="text-sm font-medium text-slate-700">
              Progress file
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Progress is saved only in this browser. Export a JSON file to move
              it to another device, then import that file there.
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-slate-500">
                {describeBackupAge(lastBackupAt)}
              </p>
              {isBackupOverdue(lastBackupAt) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  onClick={handleExportProgress}
                >
                  Export now
                </Button>
              )}
            </div>
            <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Checkbox
                id="include-review-log"
                checked={includeReviewLog}
                onCheckedChange={checked =>
                  setIncludeReviewLog(checked === true)
                }
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed text-slate-600">
                <span className="block text-sm font-medium text-slate-700">
                  Include review log
                </span>
                Adds {state.reviewLog.entries.length}{" "}
                {state.reviewLog.entries.length === 1 ? "entry" : "entries"} of
                grade history for analysis. Leave it off to keep the file small;
                it is not needed to restore progress.
              </span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white sm:flex-1"
                onClick={handleExportProgress}
              >
                <Download aria-hidden="true" />
                Export progress
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white sm:flex-1"
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
                className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3"
              >
                <p
                  id="import-confirm-title"
                  className="text-sm font-medium text-amber-900"
                >
                  Replace current progress?
                </p>
                <p className="text-xs leading-relaxed text-amber-900">
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
                    className="bg-white"
                    autoFocus
                    onClick={() => setPendingImport(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DownloadAllAudio />
        </div>
      </DialogContent>
    </Dialog>
  );
}

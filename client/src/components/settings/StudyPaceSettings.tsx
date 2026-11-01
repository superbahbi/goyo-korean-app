import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { UserState } from "@/hooks/useStudyState";
import { stopAudio } from "@/lib/audioPlayer";

interface StudyPaceSettingsProps {
  settings: UserState["settings"];
  updateSettings: (settings: Partial<UserState["settings"]>) => void;
}

export function DailyGoalSetting({
  settings,
  updateSettings,
}: StudyPaceSettingsProps) {
  const handleDailyGoalChange = (value: string) => {
    const dailyGoal = Number(value);
    if (!Number.isFinite(dailyGoal) || dailyGoal < 1) return;
    updateSettings({ dailyGoal });
    toast.success(`Daily goal set to ${dailyGoal} cards`);
  };

  return (
    <div>
      <label
        className="text-sm font-medium text-foreground/80"
        htmlFor="daily-goal"
      >
        Daily Goal
      </label>
      <Select
        value={String(settings.dailyGoal)}
        onValueChange={handleDailyGoalChange}
      >
        <SelectTrigger id="daily-goal" className="mt-2 w-full bg-card">
          <SelectValue placeholder="Choose a daily goal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">5 cards · Quick practice</SelectItem>
          <SelectItem value="10">10 cards · Balanced</SelectItem>
          <SelectItem value="15">15 cards · Focused</SelectItem>
          <SelectItem value="20">20 cards · Intensive</SelectItem>
        </SelectContent>
      </Select>
      <p className="mt-2 text-xs leading-relaxed text-foreground/70">
        Choose a goal you can sustain. Consistent recall is more valuable than a
        large daily streak.
      </p>
    </div>
  );
}

export function NewCardsPerDaySetting({
  settings,
  updateSettings,
}: StudyPaceSettingsProps) {
  const handleNewCardsPerDayChange = (value: string) => {
    const newCardsPerDay = Number(value);
    if (!Number.isFinite(newCardsPerDay) || newCardsPerDay < 1) return;
    updateSettings({ newCardsPerDay });
    toast.success(`New cards set to ${newCardsPerDay} per day`);
  };

  return (
    <div className="border-t pt-4">
      <label
        className="text-sm font-medium text-foreground/80"
        htmlFor="new-cards-per-day"
      >
        New cards per day
      </label>
      <Select
        value={String(settings.newCardsPerDay)}
        onValueChange={handleNewCardsPerDayChange}
      >
        <SelectTrigger id="new-cards-per-day" className="mt-2 w-full bg-card">
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
      <p className="mt-2 text-xs leading-relaxed text-foreground/70">
        Brand-new words are capped at this number each day, so the daily goal
        can run shorter on a fresh deck. Due reviews still come first, so a
        lower pace keeps the session short without hiding scheduled work.
      </p>
    </div>
  );
}

export function AutoPlaySetting({
  settings,
  updateSettings,
}: StudyPaceSettingsProps) {
  const handleAutoPlayChange = (autoPlayAudio: boolean) => {
    updateSettings({ autoPlayAudio });
    if (!autoPlayAudio) stopAudio();
  };

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <label
            className="text-sm font-medium text-foreground/80"
            htmlFor="auto-play-audio"
          >
            Auto-play pronunciation
          </label>
          <p className="mt-1 text-xs leading-relaxed text-foreground/70">
            Play the clip as each card appears. Off leaves audio to the speaker
            button, so nothing plays until you tap.
          </p>
        </div>
        <Switch
          id="auto-play-audio"
          checked={settings.autoPlayAudio}
          onCheckedChange={checked => handleAutoPlayChange(checked)}
        />
      </div>
    </div>
  );
}

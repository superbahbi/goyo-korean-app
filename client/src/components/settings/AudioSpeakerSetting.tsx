import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserState } from "@/hooks/useStudyState";
import { setAudioSpeaker, type AudioSpeaker } from "@/lib/audioPlayer";

interface AudioSpeakerSettingProps {
  settings: UserState["settings"];
  updateSettings: (settings: Partial<UserState["settings"]>) => void;
}

export function AudioSpeakerSetting({
  settings,
  updateSettings,
}: AudioSpeakerSettingProps) {
  const handleSpeakerChange = (speaker: AudioSpeaker) => {
    updateSettings({ audioSpeaker: speaker });
    setAudioSpeaker(speaker);
    toast.success("Speaker preference saved");
  };

  return (
    <div className="border-t pt-4 space-y-2">
      <label
        className="text-sm font-medium text-foreground/80"
        htmlFor="audio-speaker"
      >
        Korean speaker
      </label>
      <Select
        value={settings.audioSpeaker}
        onValueChange={value => handleSpeakerChange(value as AudioSpeaker)}
      >
        <SelectTrigger id="audio-speaker" className="w-full bg-card">
          <SelectValue placeholder="Choose a speaker" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="elevenlabs">
            Yong Gyu · Calm &amp; Clear
          </SelectItem>
          <SelectItem value="elevenlabs-female">
            Jini · Warm &amp; Intelligent
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs leading-relaxed text-foreground/70">
        Goyo uses ElevenLabs recordings only. Choose Yong Gyu for a calm, clear
        delivery or Jini for a warm, intelligent Seoul Korean voice.
      </p>
    </div>
  );
}

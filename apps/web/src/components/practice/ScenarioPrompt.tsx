import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface ScenarioPromptProps {
  onHear: () => void;
}

/** The single "hear a hint" control under a scenario prompt. */
export function ScenarioPrompt({ onHear }: ScenarioPromptProps) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-card p-5 shadow-lg shadow-emerald-100/40 dark:border-emerald-900/60 dark:shadow-black/20 sm:p-7">
      <Button
        variant="outline"
        className="h-12 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800/70 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
        onClick={onHear}
      >
        <Volume2 size={18} className="mr-2" /> Hear a hint
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Listen for the natural Korean phrase, then choose from memory.
      </p>
    </div>
  );
}

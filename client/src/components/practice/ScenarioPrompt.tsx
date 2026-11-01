import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface ScenarioPromptProps {
  place: string;
  prompt: string;
  onHear: () => void;
}

export function ScenarioPrompt({ place, prompt, onHear }: ScenarioPromptProps) {
  return (
    <>
      <Badge className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50">
        {place}
      </Badge>
      <h1 className="mt-4 font-serif text-3xl text-foreground">
        What would you say?
      </h1>
      <p className="mt-2 text-lg leading-relaxed text-foreground/70">
        {prompt}
      </p>
      <div className="mt-7 rounded-3xl border border-emerald-100 dark:border-emerald-900/60 bg-card p-5 shadow-lg shadow-emerald-100/40 sm:p-7">
        <Button
          variant="outline"
          className="h-12 w-full border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          onClick={onHear}
        >
          <Volume2 size={18} className="mr-2" /> Hear a hint
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Listen for the natural Korean phrase, then choose from memory.
        </p>
      </div>
    </>
  );
}

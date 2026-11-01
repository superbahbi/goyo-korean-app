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
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        {place}
      </Badge>
      <h1 className="mt-4 font-serif text-3xl text-slate-900">
        What would you say?
      </h1>
      <p className="mt-2 text-lg leading-relaxed text-slate-600">{prompt}</p>
      <div className="mt-7 rounded-3xl border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-100/40 sm:p-7">
        <Button
          variant="outline"
          className="h-12 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          onClick={onHear}
        >
          <Volume2 size={18} className="mr-2" /> Hear a hint
        </Button>
        <p className="mt-3 text-center text-xs text-slate-500">
          Listen for the natural Korean phrase, then choose from memory.
        </p>
      </div>
    </>
  );
}

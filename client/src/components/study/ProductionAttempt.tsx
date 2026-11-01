import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic2 } from "lucide-react";

interface ProductionAttemptProps {
  value: string;
  onChange: (value: string) => void;
  done: boolean;
  onDone: () => void;
}

export function ProductionAttempt({
  value,
  onChange,
  done,
  onDone,
}: ProductionAttemptProps) {
  return (
    <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 text-left">
      <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
        <Mic2 size={16} />
        Use it in a new situation
      </div>
      <p className="mt-1 text-xs leading-relaxed text-indigo-700">
        Say a new sentence aloud with this Korean word or phrase. Writing your
        attempt is optional.
      </p>
      <div className="mt-3 flex gap-2">
        <Input
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder="Your Korean sentence (optional)"
          className="h-10 border-indigo-200 bg-white"
          onClick={event => event.stopPropagation()}
        />
        <Button
          type="button"
          variant={done ? "default" : "outline"}
          className={
            done
              ? "h-10 shrink-0 bg-indigo-600 hover:bg-indigo-700"
              : "h-10 shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
          }
          onClick={onDone}
        >
          {done ? "Tried" : "Done"}
        </Button>
      </div>
    </div>
  );
}

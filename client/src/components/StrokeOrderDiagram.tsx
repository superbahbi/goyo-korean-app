import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHangulStrokes } from "@/lib/hangulStrokes";
import { cn } from "@/lib/utils";

/** Seconds each pen stroke takes to draw, and the delay between stroke starts. */
const STROKE_DURATION = 0.38;
const STROKE_STAGGER = 0.5;

interface StrokeOrderDiagramProps {
  characterId: string;
  hangul: string;
  className?: string;
}

/**
 * Draws one jamo stroke by stroke in writing order, with the finished letter
 * held underneath as a faint guide. Playing again restarts the animation; a
 * learner who prefers reduced motion sees the letter already complete.
 */
export function StrokeOrderDiagram({
  characterId,
  hangul,
  className,
}: StrokeOrderDiagramProps) {
  const strokes = getHangulStrokes(characterId);
  const reduceMotion = useReducedMotion();
  const [runId, setRunId] = useState(0);

  if (strokes.length === 0) return null;

  const strokeCount = `${strokes.length} ${
    strokes.length === 1 ? "stroke" : "strokes"
  }`;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Stroke order
      </span>
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Stroke order for ${hangul}: ${strokeCount}`}
        className="mt-1 h-32 w-32 text-emerald-600 dark:text-emerald-400 sm:h-40 sm:w-40"
      >
        <g aria-hidden="true" className="opacity-[0.12]">
          {strokes.map((d, index) => (
            <path
              key={`guide-${index}`}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
        <g aria-hidden="true">
          {strokes.map((d, index) => (
            <motion.path
              key={`${characterId}-${runId}-${index}`}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={
                reduceMotion
                  ? { pathLength: 1, opacity: 1 }
                  : { pathLength: 0, opacity: 0 }
              }
              animate={{ pathLength: 1, opacity: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      pathLength: {
                        duration: STROKE_DURATION,
                        delay: index * STROKE_STAGGER,
                        ease: "easeInOut",
                      },
                      // A zero-length round cap still paints a dot, so keep a
                      // stroke invisible until its turn to be drawn.
                      opacity: {
                        duration: 0.01,
                        delay: index * STROKE_STAGGER,
                      },
                    }
              }
            />
          ))}
        </g>
      </svg>
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          {strokeCount}
        </span>
        <span aria-hidden="true" className="text-xs text-muted-foreground/40">
          ·
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRunId(id => id + 1)}
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          aria-label={`Replay stroke order for ${hangul}`}
        >
          <RotateCcw size={12} aria-hidden="true" />
          Replay
        </Button>
      </div>
    </div>
  );
}

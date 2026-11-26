import { getHangulStrokes } from "../../../packages/domain/src/hangulStrokes";

/** Where a stroke's path starts ("M x y …"): the pen's first point. */
export function strokeStart(path: string): { x: number; y: number } | null {
  const match = /^M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/.exec(path.trim());
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
}

interface StrokeDiagramProps {
  characterId: string;
  hangul: string;
  /** Colour of the strokes. */
  color: string;
  /** Fill of the numbered start dots, and the colour of their numbers. */
  badge: string;
  badgeText: string;
  size?: number;
}

/**
 * A still stroke-order chart for one jamo, drawn from the same paths the web
 * card animates: every stroke, with its number on the point where the pen
 * starts, as on a school chart. Nothing moves, so it needs no animation
 * library and suits reduced-motion settings as is.
 */
export function StrokeDiagram({
  characterId,
  hangul,
  color,
  badge,
  badgeText,
  size = 132,
}: StrokeDiagramProps) {
  const strokes = getHangulStrokes(characterId);
  if (strokes.length === 0) return null;
  const count = `${strokes.length} ${strokes.length === 1 ? "stroke" : "strokes"}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`Stroke order for ${hangul}: ${count}`}
    >
      <g
        aria-hidden="true"
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {strokes.map((d, index) => (
          <path key={`${characterId}-${index}`} d={d} />
        ))}
      </g>
      <g aria-hidden="true">
        {strokes.map((d, index) => {
          const start = strokeStart(d);
          if (!start) return null;
          return (
            <g key={`${characterId}-start-${index}`}>
              <circle cx={start.x} cy={start.y} r={6.5} fill={badge} />
              <text
                x={start.x}
                y={start.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={8}
                fontWeight={700}
                fill={badgeText}
              >
                {index + 1}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

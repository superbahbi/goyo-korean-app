import type { ReactNode } from "react";

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  action?: ReactNode;
}

/** Shared heading rhythm for the dashboard's lower sections. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
          {eyebrow}
        </p>
        <h2 id={id} className="mt-1 font-serif text-2xl text-foreground">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

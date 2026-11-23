/**
 * The study session keyboard interface: one table for what each key does and
 * for the hint the view renders. Key handling lives in the React adapter; this
 * module only decides which command a key maps to in the current phase.
 */

export type StudyPhase = "intro" | "recall" | "revealed" | "completed";

export type StudyKeyCommand =
  | "close"
  | "start-intro"
  | "reveal"
  | "grade-again"
  | "grade-good"
  | "grade-easy"
  /** Swallow the key so the page does not scroll, without acting. */
  | "consume";

export interface StudyKeyInput {
  key: string;
  code?: string;
}

export interface StudyKeyBinding {
  /** Normalized key; the space bar is always `"Space"`. */
  key: string;
  command: StudyKeyCommand;
  /** Phase where the key acts; `"any"` also covers the summary. */
  phase: StudyPhase | "any";
  /** Copy for the visible hint, when the key belongs there. */
  hint?: string;
}

export const STUDY_KEYMAP: readonly StudyKeyBinding[] = [
  { key: "Space", command: "reveal", phase: "recall", hint: "Space reveals" },
  { key: "1", command: "grade-again", phase: "revealed", hint: "1 Again" },
  { key: "2", command: "grade-good", phase: "revealed", hint: "2 Good" },
  { key: "3", command: "grade-easy", phase: "revealed", hint: "3 Easy" },
  { key: "Escape", command: "close", phase: "any", hint: "Esc closes" },
  // The intro offers both keys; its own card carries the call to action.
  { key: "Enter", command: "start-intro", phase: "intro" },
  { key: "Space", command: "start-intro", phase: "intro" },
  // A revealed card consumes Space without acting.
  { key: "Space", command: "consume", phase: "revealed" },
];

/** The visible hint line, derived from the same table as the bindings. */
export const STUDY_KEY_HINT = STUDY_KEYMAP.flatMap(binding =>
  binding.hint ? [binding.hint] : []
).join(" · ");

function normalizeKey(input: StudyKeyInput): string {
  return input.key === " " || input.code === "Space" ? "Space" : input.key;
}

/** The command a key press means in `phase`, or null when it is ignored. */
export function studyKeyCommand(
  input: StudyKeyInput,
  phase: StudyPhase
): StudyKeyCommand | null {
  const key = normalizeKey(input);
  const binding = STUDY_KEYMAP.find(
    item => item.key === key && (item.phase === "any" || item.phase === phase)
  );
  return binding?.command ?? null;
}

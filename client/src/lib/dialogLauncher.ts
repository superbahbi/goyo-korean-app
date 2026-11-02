/**
 * Dialog launcher: at most one dashboard dialog is open at a time. A request
 * names that dialog and carries the payload it needs, so opening a mode is one
 * value instead of one boolean per dialog. Opening another request replaces
 * the current one; close returns to no request.
 */

export type DialogRequest =
  | { kind: "browse"; category: string | null }
  | { kind: "stats" }
  | { kind: "settings" }
  | { kind: "alphabet" }
  | { kind: "grammar" }
  | { kind: "listening" }
  | { kind: "scenario" }
  | { kind: "shadowing" };

export type DialogKind = DialogRequest["kind"];

/**
 * A request as an entry point supplies it. Browse defaults to the unfiltered
 * library; every other mode has no payload.
 */
export type DialogRequestInput =
  | { kind: "browse"; category?: string | null }
  | { kind: Exclude<DialogKind, "browse"> };

export type ActiveDialog = DialogRequest | null;

/** The launcher's resting state: no dialog requested. */
export const NO_DIALOG: ActiveDialog = null;

const DIALOG_KINDS: readonly DialogKind[] = [
  "browse",
  "stats",
  "settings",
  "alphabet",
  "grammar",
  "listening",
  "scenario",
  "shadowing",
];

export type DialogAction =
  | { type: "open"; request: DialogRequestInput }
  | { type: "close" };

function normalizeDialog(request: DialogRequestInput): DialogRequest {
  if (request.kind === "browse") {
    return { kind: "browse", category: request.category ?? null };
  }
  return request;
}

/**
 * The launcher's policy: one request at a time. `open` replaces whatever was
 * active rather than stacking, and `close` leaves nothing behind to remount.
 */
export function reduceDialog(
  _state: ActiveDialog,
  action: DialogAction
): ActiveDialog {
  switch (action.type) {
    case "open":
      return normalizeDialog(action.request);
    case "close":
      return NO_DIALOG;
  }
}

/**
 * The kind the host may mount, or null when no known dialog is requested.
 * A request from an older or edited caller renders nothing.
 */
export function knownDialogKind(dialog: ActiveDialog): DialogKind | null {
  if (!dialog || !DIALOG_KINDS.includes(dialog.kind)) return null;
  return dialog.kind;
}

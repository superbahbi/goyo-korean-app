/**
 * Dialog launcher: at most one dashboard dialog is open at a time. A request
 * names that dialog and carries the payload it needs, so opening a mode is one
 * value instead of one boolean per dialog. Opening another request replaces
 * the current one; close returns to no request.
 */

/**
 * The one enumerable list of dialog kinds. The request union, the launcher, and
 * the host registry are all derived from this list, so a new dialog cannot be
 * added to one without failing compilation in the others.
 */
export const DIALOG_KINDS = [
  "browse",
  "stats",
  "settings",
  "alphabet",
  "grammar",
  "listening",
  "scenario",
  "shadowing",
] as const;

export type DialogKind = (typeof DIALOG_KINDS)[number];

export type DialogRequest =
  | { kind: Extract<DialogKind, "browse">; category: string | null }
  | { kind: Exclude<DialogKind, "browse"> };

/**
 * A request as an entry point supplies it. Browse defaults to the unfiltered
 * library; every other mode has no payload.
 */
export type DialogRequestInput =
  | { kind: Extract<DialogKind, "browse">; category?: string | null }
  | { kind: Exclude<DialogKind, "browse"> };

export type ActiveDialog = DialogRequest | null;

/** The launcher's resting state: no dialog requested. */
export const NO_DIALOG: ActiveDialog = null;

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

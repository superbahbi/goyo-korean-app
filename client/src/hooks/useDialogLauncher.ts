import { useReducer } from "react";
import {
  NO_DIALOG,
  reduceDialog,
  type DialogRequestInput,
} from "@/lib/dialogLauncher";

/**
 * React adapter for the dialog launcher. Home calls `open` from any entry point
 * and the dialog host calls `close`; the page never keeps one flag per dialog.
 */
export function useDialogLauncher() {
  const [activeDialog, dispatch] = useReducer(reduceDialog, NO_DIALOG);

  const open = (request: DialogRequestInput) =>
    dispatch({ type: "open", request });
  const close = () => dispatch({ type: "close" });

  return { activeDialog, open, close };
}

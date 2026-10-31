import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// registerType is "prompt" in vite.config.ts, so a new worker installs in the
// background and waits. Without a notice an installed iPhone app can stay on an
// old build indefinitely, so surface the update with a Reload action.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    toast("A new version of Goyo is ready", {
      id: "pwa-update",
      duration: Infinity,
      description:
        "Reload to use the latest version. Your saved progress is kept.",
      action: {
        label: "Reload",
        onClick: () => {
          void updateSW(true);
        },
      },
    });
  },
});

import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

// registerType is "prompt" in vite.config.ts, so a new worker installs in the
// background and takes over on the next launch instead of reloading mid-session.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<App />);

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { AUDIO_CACHE_NAME } from "./client/src/lib/audioCache";
import { PRECACHE_GLOBS } from "./client/src/lib/pwaConfig";

// =============================================================================
// Goyo dev server
// =============================================================================

const ROOT = import.meta.dirname;

/**
 * The Hangul and number clips are small and used from the very first session, so
 * they are precached. The 26 MB vocabulary library stays on-demand: each clip is
 * cached the first time it plays, and the Settings dialog can fetch the rest.
 */
function alphabetAudioEntries() {
  const manifestPath = path.join(ROOT, "public", "audio", "index.json");
  const index = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    alphabet: { consonants: Record<string, string>; vowels: Record<string, string> };
    female?: { alphabet?: { consonants: Record<string, string>; vowels: Record<string, string> } };
    vocabulary: Record<string, string>;
  };

  const files = new Set<string>();
  const addAll = (map?: Record<string, string>) => {
    for (const file of Object.values(map ?? {})) files.add(file);
  };

  addAll(index.alphabet.consonants);
  addAll(index.alphabet.vowels);
  addAll(index.female?.alphabet?.consonants);
  addAll(index.female?.alphabet?.vowels);
  for (const [id, file] of Object.entries(index.vocabulary)) {
    if (id.startsWith("num_")) files.add(file);
  }

  // A revision derived from the file itself means a regenerated clip is
  // re-fetched instead of being served from an old precache entry.
  return [...files].map((file) => {
    const stats = statSync(path.join(ROOT, "public", "audio", file));
    return { url: `/audio/${file}`, revision: `${stats.size}-${Math.round(stats.mtimeMs)}` };
  });
}

const plugins = [
  react(),
  tailwindcss(),
  VitePWA({
    // "prompt" keeps a new worker waiting instead of reloading the page mid-session.
    // The waiting worker activates on the next launch, which is the roadmap behaviour.
    registerType: "prompt",
    injectRegister: false,
    manifest: {
      name: "Goyo - Scientific Korean Practice",
      short_name: "Goyo",
      description: "Audio-first Korean vocabulary practice with spaced repetition.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#f8fafc",
      theme_color: "#059669",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    workbox: {
      // audio/index.json is precached with the shell: it is the map every clip is
      // resolved through, so without it no audio can play offline, not even the
      // Hangul clips that are themselves precached.
      globPatterns: [...PRECACHE_GLOBS],
      additionalManifestEntries: alphabetAudioEntries(),
      navigateFallback: "/index.html",
      navigateFallbackDenylist: [/^\/audio\//, /^\/icons\//],
      runtimeCaching: [
        {
          urlPattern: /\/audio\/.*\.mp3$/,
          handler: "CacheFirst",
          options: {
            cacheName: AUDIO_CACHE_NAME,
            expiration: { maxEntries: 1800, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    devOptions: { enabled: false },
  }),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  // Goyo keeps its large, GitHub-tracked pronunciation library in the project-level public directory.
  // Serve that directory explicitly even though the Vite application root is client/.
  publicDir: path.resolve(import.meta.dirname, "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});

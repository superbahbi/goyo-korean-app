/**
 * Files the service worker precaches along with the app shell.
 *
 * `audio/index.json` belongs here even though it is not part of the shell: it is
 * the map every clip is resolved through, so without it no audio can play
 * offline — not even the Hangul clips that are themselves precached. Vocabulary
 * mp3s deliberately stay on demand (see `audioCache.ts`).
 *
 * `VitePWA` already adds `manifest.webmanifest` and `manifest.icons` PNGs via
 * `additionalManifestEntries`, so `png` and `webmanifest` are excluded here to
 * avoid duplicate precache entries.
 */
export const PRECACHE_GLOBS = [
  "**/*.{js,css,html,svg,ico}",
  "audio/index.json",
] as const;

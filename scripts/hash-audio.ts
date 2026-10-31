// Renames every clip in public/audio to `<base>.<sha256-8>.mp3` and rewrites
// the filenames in public/audio/index.json.
//
// A regenerated clip gets a new URL, so neither the browser cache nor the
// service worker's CacheFirst audio store (nor Vercel's immutable mp3 header)
// can keep serving the old bytes. Run `pnpm audio:hash` after adding or
// regenerating clips; the generator calls this itself at the end of a run.
import { createHash } from "node:crypto";
import { readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const HASH_LENGTH = 8;
const HASHED_NAME = /^(.*)\.[0-9a-f]{8}\.mp3$/;

export function audioBaseName(file: string): string {
  const hashed = HASHED_NAME.exec(file);
  if (hashed) return hashed[1];
  return file.replace(/\.mp3$/i, "");
}

export async function contentHash(filePath: string): Promise<string> {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex").slice(0, HASH_LENGTH);
}

/**
 * Renames the library in place and returns the filename for each base name, so
 * callers (the generator) can record the new names in their manifests.
 */
export async function hashAudioLibrary(projectRoot = ROOT): Promise<{
  renamed: number;
  unchanged: number;
  filenames: Map<string, string>;
}> {
  const audioDir = path.join(projectRoot, "public", "audio");
  const indexPath = path.join(audioDir, "index.json");

  const byBase = new Map<string, string[]>();
  for (const file of await readdir(audioDir)) {
    if (!file.endsWith(".mp3")) continue;
    const base = audioBaseName(file);
    byBase.set(base, [...(byBase.get(base) ?? []), file]);
  }

  const filenames = new Map<string, string>();
  let renamed = 0;
  let unchanged = 0;

  for (const [base, candidates] of byBase) {
    // A bare `<base>.mp3` is a freshly generated clip and wins over a hashed
    // sibling from an earlier run. Otherwise keep the first candidate whose
    // embedded hash still matches its bytes.
    let source = candidates.includes(`${base}.mp3`)
      ? `${base}.mp3`
      : candidates[0];
    if (!candidates.includes(`${base}.mp3`)) {
      for (const candidate of candidates) {
        const match = HASHED_NAME.exec(candidate);
        if (
          match &&
          (await contentHash(path.join(audioDir, candidate))) === match[1]
        ) {
          source = candidate;
          break;
        }
      }
    }

    const hash = await contentHash(path.join(audioDir, source));
    const target = `${base}.${hash}.mp3`;

    for (const candidate of candidates) {
      if (candidate !== source) await unlink(path.join(audioDir, candidate));
    }

    if (source === target) {
      unchanged += 1;
    } else {
      await rename(path.join(audioDir, source), path.join(audioDir, target));
      renamed += 1;
    }
    filenames.set(base, target);
  }

  const index = JSON.parse(await readFile(indexPath, "utf8"));
  const rewrite = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(rewrite);
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string") {
        if (!value.endsWith(".mp3")) continue;
        const resolved = filenames.get(audioBaseName(value));
        if (!resolved) {
          throw new Error(`index.json references a missing clip: ${value}`);
        }
        (node as Record<string, string>)[key] = resolved;
      } else {
        rewrite(value);
      }
    }
  };
  rewrite(index);

  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  return { renamed, unchanged, filenames };
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const { renamed, unchanged } = await hashAudioLibrary();
  console.log(`hashed audio: ${renamed} renamed, ${unchanged} already current`);
}

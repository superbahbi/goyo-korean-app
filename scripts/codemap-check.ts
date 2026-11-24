// Guards the committed codemap cache against dead paths.
//
// `.slim/codemap.json` maps every tracked file and folder to a hash so the
// codemap skill can re-visit only what changed. The map is committed, and a
// directory move or deletion leaves entries pointing at paths that no longer
// exist — delivery.md's move checklist calls this out, but nothing validated
// it. This check fails on exactly that.
//
// It deliberately does not compare hashes: a changed hash means "changed since
// the last run", which is the cache doing its job. Only a missing path is a
// defect.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
export const CACHE_PATH = path.join(REPO_ROOT, ".slim", "codemap.json");

export interface CodemapCache {
  file_hashes?: Record<string, string>;
  folder_hashes?: Record<string, string>;
}

/** Keys in either map that the `exists` predicate does not find on disk. */
export function deadEntries(
  cache: CodemapCache,
  exists: (relativePath: string) => boolean
): string[] {
  const keys = [
    ...Object.keys(cache.file_hashes ?? {}),
    ...Object.keys(cache.folder_hashes ?? {}),
  ];
  return [...new Set(keys)].filter(key => !exists(key)).sort();
}

export function readCache(file = CACHE_PATH): CodemapCache {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as CodemapCache;
  } catch (error) {
    throw new Error(
      `Cannot read ${path.relative(REPO_ROOT, file)}: ${(error as Error).message}`,
      { cause: error }
    );
  }
}

function main(): void {
  const cache = readCache();
  const dead = deadEntries(cache, key => existsSync(path.join(REPO_ROOT, key)));

  if (dead.length === 0) {
    const files = Object.keys(cache.file_hashes ?? {}).length;
    const folders = Object.keys(cache.folder_hashes ?? {}).length;
    console.log(
      `codemap cache is current (${files} files, ${folders} folders)`
    );
    return;
  }

  const isOne = dead.length === 1;
  console.error(
    `codemap cache has ${dead.length} path${isOne ? "" : "s"} that no longer ${
      isOne ? "exists" : "exist"
    }:`
  );
  for (const key of dead) console.error(`  ${key}`);
  console.error(
    "\nRegenerate the codemap for the moved tree, or delete these keys from .slim/codemap.json."
  );
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();

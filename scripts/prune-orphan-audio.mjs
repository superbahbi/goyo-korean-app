// Removes audio-manifest entries for cards that no longer exist in the deck.
// The mp3 files themselves are kept; only the index is pruned.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MANIFEST = path.join(ROOT, "public", "audio", "index.json");
const SOURCES = [
  path.join(ROOT, "client", "src", "lib", "vocabulary.ts"),
  path.join(ROOT, "client", "src", "lib", "essentialVocabulary.ts"),
];

const ids = new Set();
for (const file of SOURCES) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(/id: "([^"]+)"/g)) ids.add(match[1]);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const prune = section => {
  const before = Object.keys(section).length;
  for (const key of Object.keys(section)) {
    if (ids.has(key)) continue;
    // Alphabet mnemonics and number clips are keyed by their own ids.
    if (/^[a-z]+$/.test(key) && !key.startsWith("num_")) continue;
    delete section[key];
  }
  return before - Object.keys(section).length;
};

const removedMale = prune(manifest.vocabulary);
const removedFemale = manifest.female?.vocabulary
  ? prune(manifest.female.vocabulary)
  : 0;

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(
  `pruned ${removedMale} male and ${removedFemale} female entries; ` +
    `now ${Object.keys(manifest.vocabulary).length} male, ${Object.keys(manifest.female.vocabulary).length} female`
);

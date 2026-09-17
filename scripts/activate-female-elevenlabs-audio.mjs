import { readFile, writeFile } from "node:fs/promises";

const indexPath = new URL("../public/audio/index.json", import.meta.url);
const manifestPath = new URL("../public/audio/elevenlabs-female-manifest.json", import.meta.url);
const index = JSON.parse(await readFile(indexPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
index.female = { vocabulary: {}, alphabet: { consonants: {}, vowels: {} } };
for (const item of [...manifest.vocabulary, ...manifest.alphabet]) {
  if (item.id.startsWith("cons_")) index.female.alphabet.consonants[item.id] = item.filename;
  else if (item.id.startsWith("vowel_")) index.female.alphabet.vowels[item.id] = item.filename;
  else index.female.vocabulary[item.id] = item.filename;
}
await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log({ vocabulary: Object.keys(index.female.vocabulary).length, consonants: Object.keys(index.female.alphabet.consonants).length, vowels: Object.keys(index.female.alphabet.vowels).length });

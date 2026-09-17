import { readFile, writeFile } from "node:fs/promises";

const indexPath = new URL("../public/audio/index.json", import.meta.url);
const index = JSON.parse(await readFile(indexPath, "utf8"));
index.alphabet ??= {};
index.alphabet.consonants ??= {};
index.alphabet.vowels ??= {};
for (let n = 1; n <= 19; n += 1) {
  const id = `cons_${String(n).padStart(3, "0")}`;
  index.alphabet.consonants[id] = `elevenlabs_${id}.mp3`;
}
for (let n = 1; n <= 21; n += 1) {
  const id = `vowel_${String(n).padStart(3, "0")}`;
  index.alphabet.vowels[id] = `elevenlabs_${id}.mp3`;
}
await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(`indexed ${Object.keys(index.alphabet.consonants).length} consonant aliases and ${Object.keys(index.alphabet.vowels).length} vowel aliases`);

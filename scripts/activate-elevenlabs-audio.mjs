import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(process.argv[2] ?? process.cwd());
const audioDir = path.join(projectRoot, "public", "audio");
const indexPath = path.join(audioDir, "index.json");
const manifestPath = path.join(audioDir, "elevenlabs-manifest.json");

const consonantKeys = ["ga", "na", "da", "ra", "ma", "ba", "sa", "a_consonant", "ja", "cha2", "cha", "kha", "ta", "pha", "ha"];
const vowelKeys = ["a", "ya", "eo", "yeo", "o", "yo", "u", "yu", "eu", "i", "ae", "e"];

const index = JSON.parse(await readFile(indexPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const generated = new Map([...manifest.vocabulary, ...manifest.alphabet].map((item) => [item.id, item]));

for (const item of [...manifest.vocabulary, ...manifest.alphabet]) {
  if (!item.filename || item.status === "failed") {
    throw new Error(`Manifest contains an unusable item: ${item.id}`);
  }
  await access(path.join(audioDir, item.filename));
}

for (const item of manifest.vocabulary) {
  index.vocabulary[item.id] = item.filename;
}

for (let position = 0; position < consonantKeys.length; position += 1) {
  const id = `cons_${String(position + 1).padStart(3, "0")}`;
  index.alphabet.consonants[consonantKeys[position]] = generated.get(id).filename;
}

for (let position = 0; position < vowelKeys.length; position += 1) {
  const id = `vowel_${String(position + 1).padStart(3, "0")}`;
  index.alphabet.vowels[vowelKeys[position]] = generated.get(id).filename;
}

index.metadata = {
  ...(index.metadata ?? {}),
  provider: "ElevenLabs",
  model: manifest.modelId,
  voiceId: manifest.voiceId,
  generatedAt: manifest.generatedAt,
};

await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(`Activated ${manifest.counts.total} ElevenLabs files in ${indexPath}`);

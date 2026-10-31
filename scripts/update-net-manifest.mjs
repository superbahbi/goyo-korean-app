import { readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(fileURLToPath(import.meta.url), "../..");
const manifestPath = path.join(rootDir, "public", "audio", "elevenlabs-manifest.json");
const audioPath = path.join(rootDir, "public", "audio", "elevenlabs_num_004.mp3");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const bytes = (await stat(audioPath)).size;
const item = manifest.vocabulary.find((entry) => entry.id === "num_004");
if (!item) throw new Error("num_004 is missing from the manifest");
item.text = "넷";
item.bytes = bytes;
item.status = "generated";
manifest.generatedAt = new Date().toISOString();
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log({ id: item.id, bytes: item.bytes, text: item.text });

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(process.argv[2] ?? process.cwd());
const audioDir = path.join(projectRoot, "public", "audio");
const vocabularyPath = path.join(projectRoot, "client", "src", "lib", "vocabulary.ts");
const alphabetPath = path.join(projectRoot, "client", "src", "lib", "alphabet.ts");
const manifestPath = path.join(audioDir, "elevenlabs-manifest.json");

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID || "ZJCNdZEjYwkOElxugmW2";
const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const concurrency = Math.max(1, Math.min(5, Number(process.env.ELEVENLABS_CONCURRENCY || 3)));
const force = process.argv.includes("--force");

if (!apiKey) {
  throw new Error("ELEVENLABS_API_KEY is not available in this shell.");
}

const vocabularySource = await readFile(vocabularyPath, "utf8");
const alphabetSource = await readFile(alphabetPath, "utf8");

const vocabulary = [...vocabularySource.matchAll(/\{ id: "([^"]+)", front: "([^"]+)"/g)].map((match) => ({
  id: match[1],
  text: match[2],
  group: "vocabulary",
  filename: `elevenlabs_${match[1]}.mp3`,
}));

const alphabet = [...alphabetSource.matchAll(/\{ id: "([^"]+)", hangul: "([^"]+)", romanization: "[^"]+", sound: "[^"]+", ttsText: "([^"]+)"/g)].map((match) => ({
  id: match[1],
  text: match[3],
  group: "alphabet",
  filename: `elevenlabs_${match[1]}.mp3`,
}));

const items = [...vocabulary, ...alphabet];
if (vocabulary.length === 0 || alphabet.length === 0) {
  throw new Error(`Could not parse source data. vocabulary=${vocabulary.length}, alphabet=${alphabet.length}`);
}

await mkdir(audioDir, { recursive: true });

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function generateOne(item) {
  const outputPath = path.join(audioDir, item.filename);
  const temporaryPath = `${outputPath}.part`;

  if (!force) {
    try {
      const existing = await readFile(outputPath);
      if (existing.length > 1000) {
        return { ...item, status: "skipped", bytes: existing.length };
      }
    } catch {
      // The file does not exist yet; continue with generation.
    }
  }

  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "content-type": "application/json",
            accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: item.text,
            model_id: modelId,
            language_code: "ko",
            voice_settings: {
              stability: 0.55,
              similarity_boost: 0.8,
              style: 0.15,
              use_speaker_boost: true,
            },
          }),
        },
      );

      if (!response.ok) {
        const detail = await response.text();
        const retryable = response.status === 429 || response.status >= 500;
        throw Object.assign(new Error(`HTTP ${response.status}: ${detail.slice(0, 240)}`), { retryable });
      }

      const audio = Buffer.from(await response.arrayBuffer());
      if (audio.length < 1000) {
        throw new Error(`Received an unexpectedly small audio response (${audio.length} bytes)`);
      }

      await writeFile(temporaryPath, audio);
      await rename(temporaryPath, outputPath);
      return { ...item, status: "generated", bytes: audio.length };
    } catch (error) {
      lastError = error;
      if (!error?.retryable || attempt === 4) break;
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }

  return { ...item, status: "failed", error: lastError instanceof Error ? lastError.message : String(lastError) };
}

const results = [];
let cursor = 0;
async function worker() {
  while (cursor < items.length) {
    const item = items[cursor];
    cursor += 1;
    const result = await generateOne(item);
    results.push(result);
    const completed = results.length;
    console.log(`[${completed}/${items.length}] ${result.status} ${item.group}/${item.id} ${item.text}`);
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
results.sort((left, right) => left.id.localeCompare(right.id));

const summary = {
  generatedAt: new Date().toISOString(),
  voiceId,
  modelId,
  counts: {
    total: results.length,
    generated: results.filter((result) => result.status === "generated").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    failed: results.filter((result) => result.status === "failed").length,
  },
  vocabulary: results.filter((result) => result.group === "vocabulary"),
  alphabet: results.filter((result) => result.group === "alphabet"),
};

await writeFile(manifestPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary.counts));

if (summary.counts.failed > 0) {
  process.exitCode = 1;
}

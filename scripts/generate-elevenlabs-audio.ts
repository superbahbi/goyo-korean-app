import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";
import { CURATED_CARDS, loadVocabularyDeck } from "../client/src/lib/vocabulary";
import { ALPHABET_DATA } from "../client/src/lib/alphabet";

export interface AudioItem {
  id: string;
  text: string;
  group: "vocabulary" | "alphabet";
  filename: string;
}

export interface AudioResult extends AudioItem {
  status: "generated" | "skipped" | "failed";
  bytes?: number;
  error?: string;
}

interface RetryableError extends Error {
  retryable?: boolean;
}

const rootArg = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const defaultRoot = path.resolve(fileURLToPath(import.meta.url), "../..");
const projectRoot = rootArg ? path.resolve(rootArg) : defaultRoot;
const audioDir = path.join(projectRoot, "public", "audio");

// CLI voice flag handling: --voice female | --voice=female | --voice <voiceId>
const voiceArg = process.argv.find((arg) => arg.startsWith("--voice="));
const voiceFlagIndex = process.argv.indexOf("--voice");
const voiceCli = voiceArg
  ? voiceArg.split("=")[1]
  : voiceFlagIndex !== -1 && process.argv[voiceFlagIndex + 1] && !process.argv[voiceFlagIndex + 1].startsWith("--")
    ? process.argv[voiceFlagIndex + 1]
    : undefined;

const isFemale = voiceCli === "female";
const defaultVoiceId = isFemale ? "uyVNoMrnUku1dZyVEXwD" : "ZJCNdZEjYwkOElxugmW2";
const defaultPrefix = isFemale ? "elevenlabs_female_" : "elevenlabs_";
const defaultManifest = isFemale ? "elevenlabs-female-manifest.json" : "elevenlabs-manifest.json";

const filePrefix = process.env.ELEVENLABS_FILE_PREFIX || defaultPrefix;
const manifestPath = path.join(audioDir, process.env.ELEVENLABS_MANIFEST_NAME || defaultManifest);
const voiceId = process.env.ELEVENLABS_VOICE_ID || (voiceCli && voiceCli !== "female" && voiceCli !== "male" ? voiceCli : defaultVoiceId);
const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const concurrency = Math.max(1, Math.min(5, Number(process.env.ELEVENLABS_CONCURRENCY || 3)));
const force = process.argv.includes("--force");
const apiKey = process.env.ELEVENLABS_API_KEY;

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function generateOne(item: AudioItem): Promise<AudioResult> {
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

  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey as string,
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
    } catch (error: unknown) {
      lastError = error;
      const retryable = (error as RetryableError)?.retryable;
      if (!retryable || attempt === 4) break;
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }

  return {
    ...item,
    status: "failed",
    error: lastError instanceof Error ? lastError.message : String(lastError),
  };
}

export async function main() {
  const deck = await loadVocabularyDeck();
  const deckCards = deck.vocabulary;

  const vocabulary: AudioItem[] = deckCards.map((card) => ({
    id: card.id,
    text: card.front,
    group: "vocabulary",
    filename: `${filePrefix}${card.id}.mp3`,
  }));

  // Hard assertion: discovered vocabulary must equal deck length
  assert.strictEqual(
    vocabulary.length,
    deckCards.length,
    `Vocabulary item count mismatch: discovered ${vocabulary.length}, expected ${deckCards.length}`,
  );
  assert.ok(
    deckCards.length >= CURATED_CARDS.length,
    `Deck length (${deckCards.length}) must be at least curated cards count (${CURATED_CARDS.length})`,
  );

  const alphabet: AudioItem[] = ALPHABET_DATA.map((card) => ({
    id: card.id,
    text: card.ttsText,
    group: "alphabet",
    filename: `${filePrefix}${card.id}.mp3`,
  }));

  assert.strictEqual(
    alphabet.length,
    ALPHABET_DATA.length,
    `Alphabet item count mismatch: discovered ${alphabet.length}, expected ${ALPHABET_DATA.length}`,
  );

  const items = [...vocabulary, ...alphabet];
  if (vocabulary.length === 0 || alphabet.length === 0) {
    throw new Error(`Could not parse source data. vocabulary=${vocabulary.length}, alphabet=${alphabet.length}`);
  }

  console.log(
    `Discovered ${items.length} audio items (${vocabulary.length} vocabulary across curated + imported decks, ${alphabet.length} alphabet).`,
  );

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not available in this shell.");
  }

  await mkdir(audioDir, { recursive: true });

  const results: AudioResult[] = [];
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
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
    process.argv[1].endsWith("generate-elevenlabs-audio.ts"));

if (isDirectRun) {
  await main();
}

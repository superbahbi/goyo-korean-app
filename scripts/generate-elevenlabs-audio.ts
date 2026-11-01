import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";
import {
  CURATED_CARDS,
  loadVocabularyDeck,
} from "../client/src/lib/vocabulary";
import { ALPHABET_DATA } from "../client/src/lib/alphabet";
import { GRAMMAR_SENTENCE_LINES } from "../client/src/lib/grammar";
import { audioBaseName, hashAudioLibrary } from "./hash-audio.ts";

export interface AudioItem {
  id: string;
  text: string;
  group: "vocabulary" | "alphabet" | "sentences";
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

const cliArgs = process.argv.slice(2);

// CLI voice flag handling: --voice female | --voice=female | --voice <voiceId>
const voiceArg = cliArgs.find(arg => arg.startsWith("--voice="));
const voiceFlagIndex = cliArgs.indexOf("--voice");
const voiceCli =
  voiceArg?.split("=")[1] ??
  (voiceFlagIndex !== -1 &&
  cliArgs[voiceFlagIndex + 1] &&
  !cliArgs[voiceFlagIndex + 1].startsWith("--")
    ? cliArgs[voiceFlagIndex + 1]
    : undefined);

// The first bare argument is an optional project root. The value following
// `--voice` belongs to that flag, so it must not be mistaken for a path.
const voiceValueIndex = voiceArg
  ? -1
  : voiceFlagIndex !== -1 && voiceCli
    ? voiceFlagIndex + 1
    : -1;
const rootArg = cliArgs.find(
  (arg, index) => index !== voiceValueIndex && !arg.startsWith("--")
);
const defaultRoot = path.resolve(fileURLToPath(import.meta.url), "../..");
const projectRoot = rootArg ? path.resolve(rootArg) : defaultRoot;
const audioDir = path.join(projectRoot, "public", "audio");

interface VoicePreset {
  voiceId: string;
  prefix: string;
  manifest: string;
  sentenceManifest: string;
  indexSlot: "male" | "female";
  modelId: string;
}

// Named presets keep the CLI terse: --voice male|female|jini. The male preset
// is Yong Gyu and `jini` reuses the female filename prefix and index slot, so
// the app's speakers play Yong Gyu and Jini.
const VOICE_PRESETS: Record<string, VoicePreset> = {
  male: {
    voiceId: "h5eZa8VFAq0EQ8E81dfL",
    prefix: "elevenlabs_",
    manifest: "elevenlabs-manifest.json",
    sentenceManifest: "elevenlabs-sentences-manifest.json",
    indexSlot: "male",
    modelId: "eleven_v4",
  },
  female: {
    voiceId: "uyVNoMrnUku1dZyVEXwD",
    prefix: "elevenlabs_female_",
    manifest: "elevenlabs-female-manifest.json",
    sentenceManifest: "elevenlabs-female-sentences-manifest.json",
    indexSlot: "female",
    modelId: "eleven_multilingual_v2",
  },
  jini: {
    voiceId: "0oqpliV6dVSr9XomngOW",
    prefix: "elevenlabs_female_",
    manifest: "elevenlabs-female-manifest.json",
    sentenceManifest: "elevenlabs-female-sentences-manifest.json",
    indexSlot: "female",
    modelId: "eleven_v4",
  },
};

const activePreset =
  (voiceCli && VOICE_PRESETS[voiceCli]) || VOICE_PRESETS.male;

const filePrefix = process.env.ELEVENLABS_FILE_PREFIX || activePreset.prefix;
const sentenceMode = process.argv.includes("--sentences");
const grammarOnly = sentenceMode && process.argv.includes("--grammar");
const sampleArg = process.argv.find(arg => arg.startsWith("--sample="));
const sampleSize = sampleArg ? Number(sampleArg.split("=")[1]) : undefined;
const manifestPath = path.join(
  audioDir,
  process.env.ELEVENLABS_MANIFEST_NAME ||
    (sentenceMode ? activePreset.sentenceManifest : activePreset.manifest)
);
const voiceId =
  process.env.ELEVENLABS_VOICE_ID ||
  (voiceCli && !VOICE_PRESETS[voiceCli] ? voiceCli : activePreset.voiceId);
const modelId = process.env.ELEVENLABS_MODEL_ID || activePreset.modelId;
const concurrency = Math.max(
  1,
  Math.min(5, Number(process.env.ELEVENLABS_CONCURRENCY || 3))
);
const force = process.argv.includes("--force");
const apiKey = process.env.ELEVENLABS_API_KEY;

const sleep = (milliseconds: number) =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

// Clips are named by content hash, so an existing clip is not necessarily at
// `<id>.mp3`. Filled from the audio directory before generation starts.
const existingAudioFiles = new Map<string, string[]>();

async function generateOne(item: AudioItem): Promise<AudioResult> {
  const outputPath = path.join(audioDir, item.filename);
  const temporaryPath = `${outputPath}.part`;

  if (!force) {
    for (const candidate of existingAudioFiles.get(
      audioBaseName(item.filename)
    ) ?? []) {
      try {
        const existing = await readFile(path.join(audioDir, candidate));
        if (existing.length > 1000) {
          return { ...item, status: "skipped", bytes: existing.length };
        }
      } catch {
        // A missing candidate just means this base still needs generating.
      }
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
        }
      );

      if (!response.ok) {
        const detail = await response.text();
        const retryable = response.status === 429 || response.status >= 500;
        throw Object.assign(
          new Error(`HTTP ${response.status}: ${detail.slice(0, 240)}`),
          { retryable }
        );
      }

      const audio = Buffer.from(await response.arrayBuffer());
      if (audio.length < 1000) {
        throw new Error(
          `Received an unexpectedly small audio response (${audio.length} bytes)`
        );
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

/**
 * Builds one clip per spoken line. Card examples use the card id; grammar
 * examples use `grammar_<lesson>_<n>`. `prefix` lets the female voice write
 * `elevenlabs_female_sent_*` instead of colliding with the male clip.
 */
export function buildSentenceItems(
  lines: { id: string; text: string }[],
  prefix: string
): AudioItem[] {
  return lines
    .filter(line => line.text.trim().length > 0)
    .map(line => ({
      id: line.id,
      text: line.text.trim(),
      group: "sentences" as const,
      filename: `${prefix}sent_${line.id}.mp3`,
    }));
}

/**
 * Adds the generated sentence clips to audio/index.json. The index is the only
 * file the app reads at runtime, so a clip that is not listed here is
 * unreachable even though it exists on disk.
 */
async function recordSentenceIndex(
  results: AudioResult[],
  filenames: Map<string, string>
): Promise<void> {
  const indexPath = path.join(audioDir, "index.json");
  const index = JSON.parse(await readFile(indexPath, "utf8")) as {
    sentences?: Record<string, string>;
    female?: { sentences?: Record<string, string> };
  };
  let target: Record<string, string>;
  if (activePreset.indexSlot === "female") {
    index.female ??= {};
    index.female.sentences ??= {};
    target = index.female.sentences;
  } else {
    index.sentences ??= {};
    target = index.sentences;
  }

  let recorded = 0;
  for (const result of results) {
    if (result.status === "failed") continue;
    const file = filenames.get(audioBaseName(result.filename));
    if (!file) continue;
    target[result.id] = file;
    recorded += 1;
  }
  if (recorded === 0) return;

  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  console.log(
    `Recorded ${recorded} sentence clips in audio/index.json (${activePreset.indexSlot}).`
  );
}

export async function main() {
  const deck = await loadVocabularyDeck();
  const deckCards = deck.vocabulary;

  const vocabulary: AudioItem[] = deckCards.map(card => ({
    id: card.id,
    text: card.front,
    group: "vocabulary",
    filename: `${filePrefix}${card.id}.mp3`,
  }));

  // Hard assertion: discovered vocabulary must equal deck length
  assert.strictEqual(
    vocabulary.length,
    deckCards.length,
    `Vocabulary item count mismatch: discovered ${vocabulary.length}, expected ${deckCards.length}`
  );
  assert.ok(
    deckCards.length >= CURATED_CARDS.length,
    `Deck length (${deckCards.length}) must be at least curated cards count (${CURATED_CARDS.length})`
  );

  const alphabet: AudioItem[] = ALPHABET_DATA.map(card => ({
    id: card.id,
    // Letter names are the spoken text; numbers use their Hangul reading.
    text: card.type === "number" ? card.hangul : card.sound,
    group: "alphabet",
    filename: `${filePrefix}${card.id}.mp3`,
  }));

  assert.strictEqual(
    alphabet.length,
    ALPHABET_DATA.length,
    `Alphabet item count mismatch: discovered ${alphabet.length}, expected ${ALPHABET_DATA.length}`
  );

  const items = [...vocabulary, ...alphabet];
  if (vocabulary.length === 0 || alphabet.length === 0) {
    throw new Error(
      `Could not parse source data. vocabulary=${vocabulary.length}, alphabet=${alphabet.length}`
    );
  }

  const sentences = buildSentenceItems(
    grammarOnly
      ? GRAMMAR_SENTENCE_LINES
      : [
          ...deckCards.map(card => ({
            id: card.id,
            text: card.example ?? "",
          })),
          ...GRAMMAR_SENTENCE_LINES,
        ],
    filePrefix
  );
  const sentenceItems =
    sampleSize !== undefined && Number.isFinite(sampleSize) && sampleSize > 0
      ? sentences.slice(0, Math.floor(sampleSize))
      : sentences;
  if (sentenceMode && sentenceItems.length === 0) {
    throw new Error("No card examples were found to generate.");
  }

  const selectedItems = sentenceMode ? sentenceItems : items;
  console.log(
    sentenceMode
      ? `Discovered ${selectedItems.length} ${grammarOnly ? "grammar " : ""}sentence items${sampleSize ? ` (sample of ${sentences.length})` : ""}.`
      : `Discovered ${items.length} audio items (${vocabulary.length} vocabulary across curated + imported decks, ${alphabet.length} alphabet).`
  );

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not available in this shell.");
  }

  await mkdir(audioDir, { recursive: true });
  for (const file of await readdir(audioDir)) {
    if (!file.endsWith(".mp3")) continue;
    const base = audioBaseName(file);
    existingAudioFiles.set(base, [
      ...(existingAudioFiles.get(base) ?? []),
      file,
    ]);
  }

  const results: AudioResult[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < selectedItems.length) {
      const item = selectedItems[cursor];
      cursor += 1;
      const result = await generateOne(item);
      results.push(result);
      const completed = results.length;
      console.log(
        `[${completed}/${selectedItems.length}] ${result.status} ${item.group}/${item.id} ${item.text}`
      );
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, selectedItems.length) }, worker)
  );
  results.sort((left, right) => left.id.localeCompare(right.id));

  // Rename the new clips by content hash and point index.json at them. The
  // manifests below record the hashed names that are actually on disk.
  const { filenames } = await hashAudioLibrary(projectRoot);
  for (const result of results) {
    const resolved = filenames.get(audioBaseName(result.filename));
    if (resolved) result.filename = resolved;
  }
  if (sentenceMode) await recordSentenceIndex(results, filenames);

  const summary = {
    generatedAt: new Date().toISOString(),
    voiceId,
    modelId,
    counts: {
      total: results.length,
      generated: results.filter(result => result.status === "generated").length,
      skipped: results.filter(result => result.status === "skipped").length,
      failed: results.filter(result => result.status === "failed").length,
    },
    vocabulary: results.filter(result => result.group === "vocabulary"),
    alphabet: results.filter(result => result.group === "alphabet"),
    sentences: results.filter(result => result.group === "sentences"),
  };

  await writeFile(
    manifestPath,
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );
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

import { writeFile } from "node:fs/promises";

const voiceId = process.env.ELEVENLABS_VOICE_ID || "ZJCNdZEjYwkOElxugmW2";
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is missing");
const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
  method: "POST",
  headers: { "xi-api-key": apiKey, "content-type": "application/json", accept: "audio/mpeg" },
  body: JSON.stringify({
    text: "Speak Korean clearly. Say 넷 as the number four, with a short clipped final t sound, not an s sound: 넷.",
    model_id: "eleven_multilingual_v2",
    language_code: "ko",
    voice_settings: { stability: 0.62, similarity_boost: 0.82, style: 0.1, use_speaker_boost: true },
  }),
});
if (!response.ok) throw new Error(`ElevenLabs HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
const audio = Buffer.from(await response.arrayBuffer());
if (audio.length < 1000) throw new Error(`Audio too small: ${audio.length}`);
await writeFile("/home/ubuntu/goyo-korean-app/public/audio/elevenlabs_num_004.mp3", audio);
console.log(`regenerated male num_004 (${audio.length} bytes)`);

import fs from 'node:fs/promises';
import { CONFIG } from '../config';
import { workFile } from '../paths';
import { ffmpeg } from './ffmpeg';
import { withRetries } from './images';
import characters from '../../../characters.json';
import type { Scene } from '../types';

/**
 * STEP 6. One fixed voice for Mammon, one for JT, across the whole episode.
 *
 * Two ways, set by VOICE_MODE in .env:
 *   changer (default) - takes the talking Veo made and swaps the voice.
 *   tts               - reads the script line in the fixed voice. Cheaper,
 *                       and lets Veo run silent.
 */
export async function makeSceneVoice(
  jobId: string,
  scene: Scene,
  index: number,
  clipPath: string,
): Promise<string> {
  const out = workFile(jobId, `scene_${index + 1}_voice.mp3`);

  if (CONFIG.mockMode) {
    // Lift the clip's own audio so the stitched episode still has a soundtrack.
    await ffmpeg(['-i', clipPath, '-vn', '-c:a', 'libmp3lame', '-q:a', '5', out]);
    return out;
  }

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error('No ELEVENLABS_API_KEY found. Put it in your .env file.');
  }

  const voiceId = characters[scene.speaker].voiceId;
  if (!voiceId || voiceId.startsWith('PUT_YOUR')) {
    throw new Error(
      `No voice chosen for ${characters[scene.speaker].name} yet. ` +
        'See the README section "Pick the two voices".',
    );
  }

  const audio = await withRetries(CONFIG.voices.maxRetries, async () =>
    CONFIG.voices.mode === 'changer'
      ? voiceChanger(key, voiceId, clipPath, jobId, index)
      : textToSpeech(key, voiceId, scene.line),
  );

  await fs.writeFile(out, audio);
  return out;
}

/** Speech to speech: Veo's talking goes in, the fixed voice comes out. */
async function voiceChanger(
  key: string,
  voiceId: string,
  clipPath: string,
  jobId: string,
  index: number,
): Promise<Buffer> {
  const sourceAudio = workFile(jobId, `scene_${index + 1}_source.mp3`);
  await ffmpeg(['-i', clipPath, '-vn', '-c:a', 'libmp3lame', '-q:a', '2', sourceAudio]);

  const form = new FormData();
  form.append('audio', new Blob([await fs.readFile(sourceAudio)]), 'source.mp3');
  form.append('model_id', CONFIG.voices.changerModel);
  form.append('remove_background_noise', 'true');

  const res = await fetch(
    `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}?output_format=${CONFIG.voices.outputFormat}`,
    { method: 'POST', headers: { 'xi-api-key': key }, body: form },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs said no (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** Text to speech: reads the written line in the fixed voice. */
async function textToSpeech(key: string, voiceId: string, line: string): Promise<Buffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${CONFIG.voices.outputFormat}`,
    {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: line,
        model_id: CONFIG.voices.ttsModel,
        voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.3 },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs said no (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

import fs from 'node:fs/promises';
import { CONFIG } from '../config';
import { workFile } from '../paths';
import { ffmpeg } from './ffmpeg';
import { withRetries } from './images';

/**
 * STEP 7. Sync Labs lipsync-2 moves the mouths to match the finished voices.
 * See the note on lipSync in src/lib/config.ts for why this goes through
 * fal.ai by default.
 */
export async function syncSceneLips(
  jobId: string,
  clipPath: string,
  voicePath: string,
  index: number,
): Promise<string> {
  const out = workFile(jobId, `scene_${index + 1}_synced.mp4`);

  if (CONFIG.mockMode) {
    // Mock mode just lays the voice over the clip, so timing is still tested.
    await ffmpeg([
      '-i', clipPath,
      '-i', voicePath,
      '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'copy', '-c:a', 'aac', '-shortest',
      out,
    ]);
    return out;
  }

  const videoUrl = await dataUri(clipPath, 'video/mp4');
  const audioUrl = await dataUri(voicePath, 'audio/mpeg');

  const resultUrl = await withRetries(CONFIG.lipSync.maxRetries, async () =>
    CONFIG.lipSync.provider === 'sync'
      ? viaSyncLabs(videoUrl, audioUrl, index)
      : viaFal(videoUrl, audioUrl, index),
  );

  const res = await fetch(resultUrl);
  if (!res.ok) throw new Error(`Could not download the synced scene ${index + 1}.`);
  await fs.writeFile(out, Buffer.from(await res.arrayBuffer()));
  return out;
}

/** Sync's lipsync-2, hosted by fal.ai. Uses FAL_KEY. */
async function viaFal(videoUrl: string, audioUrl: string, index: number): Promise<string> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('No FAL_KEY found, which lip sync needs. Put it in your .env file.');

  const res = await fetch(`https://fal.run/${CONFIG.lipSync.falModel}`, {
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_url: videoUrl,
      audio_url: audioUrl,
      sync_mode: 'cut_off',
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Lip sync said no on scene ${index + 1} (${res.status}): ${(await res.text()).slice(0, 300)}`,
    );
  }

  const data = (await res.json()) as { video?: { url?: string } };
  const url = data.video?.url;
  if (!url) throw new Error(`Lip sync returned nothing for scene ${index + 1}.`);
  return url;
}

/** Sync Labs directly. Needs files at a public web address, not data URIs. */
async function viaSyncLabs(videoUrl: string, audioUrl: string, index: number): Promise<string> {
  const key = process.env.SYNC_LABS_API_KEY;
  if (!key) throw new Error('No SYNC_LABS_API_KEY found. Put it in your .env file.');

  if (videoUrl.startsWith('data:')) {
    throw new Error(
      'Sync Labs can only read files from a public web address, and this app keeps clips on your ' +
        'own computer. Set LIPSYNC_PROVIDER=fal in your .env file instead.',
    );
  }

  const start = await fetch(`${CONFIG.lipSync.apiBase}/generate`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.lipSync.model,
      input: [
        { type: 'video', url: videoUrl },
        { type: 'audio', url: audioUrl },
      ],
      options: { sync_mode: 'cut_off' },
    }),
  });

  if (!start.ok) {
    throw new Error(
      `Sync Labs said no on scene ${index + 1} (${start.status}): ${(await start.text()).slice(0, 300)}`,
    );
  }

  const { id } = (await start.json()) as { id: string };
  const deadline = Date.now() + CONFIG.lipSync.timeoutMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 8000));
    const poll = await fetch(`${CONFIG.lipSync.apiBase}/generations/${id}`, {
      headers: { 'x-api-key': key },
    });
    if (!poll.ok) continue;

    const job = (await poll.json()) as { status?: string; outputUrl?: string; error?: string };
    if (job.status === 'COMPLETED' && job.outputUrl) return job.outputUrl;
    if (job.status === 'FAILED') {
      throw new Error(`Sync Labs failed on scene ${index + 1}: ${job.error ?? 'no reason given'}`);
    }
  }

  throw new Error(`Sync Labs took too long on scene ${index + 1}.`);
}

async function dataUri(file: string, mime: string): Promise<string> {
  const bytes = await fs.readFile(file);
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

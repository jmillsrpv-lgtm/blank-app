import fs from 'node:fs/promises';
import { GoogleAuth } from 'google-auth-library';
import { CONFIG } from '../config';
import { buildCharacterLockBlock } from '../prompt';
import { getStyle } from '../styles';
import { workFile } from '../paths';
import { ffmpeg, fontPrefix } from './ffmpeg';
import { esc, withRetries, wrapLine } from './images';
import characters from '../../../characters.json';
import type { Scene } from '../types';

/**
 * STEP 4. Image to video with Google Veo, through Vertex AI.
 *
 * The Gemini API Veo previews were shut down on 2026-10-22, so Vertex AI is
 * the only way in. That means a Google Cloud project with billing on and a
 * service account JSON file, not just an API key.
 *
 * Model names move. If this fails with "model not found", change
 * video.model in src/lib/config.ts.
 */
export async function makeSceneVideo(
  jobId: string,
  scene: Scene,
  index: number,
  styleId: string,
  stillPath: string,
): Promise<string> {
  const out = workFile(jobId, `scene_${index + 1}_clip.mp4`);

  if (CONFIG.mockMode) {
    await mockClip(out, stillPath, scene, index);
    return out;
  }

  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) {
    throw new Error(
      'No GOOGLE_CLOUD_PROJECT found. See the README section "Google Cloud, the fiddly one".',
    );
  }

  const style = getStyle(styleId);
  const withAudio = CONFIG.voices.mode === 'changer';
  const speakerName = characters[scene.speaker].name;

  const prompt = [
    style.look,
    '',
    buildCharacterLockBlock(scene.speaker),
    '',
    `SHOT: ${scene.shot}. The camera is locked off and does not move.`,
    `ACTION: ${speakerName} ${scene.action} while speaking.`,
    withAudio
      ? `${speakerName} says, clearly and in sync with the lips: "${scene.line}"`
      : 'No speech audio. Mouth moves as if speaking, no sound.',
    'No on-screen text, no subtitles, no captions, no watermark.',
  ].join('\n');

  const token = await accessToken();
  const base =
    `https://${CONFIG.video.location}-aiplatform.googleapis.com/v1/projects/${project}` +
    `/locations/${CONFIG.video.location}/publishers/google/models/${CONFIG.video.model}`;

  const imageBytes = (await fs.readFile(stillPath)).toString('base64');

  const videoBase64 = await withRetries(CONFIG.video.maxRetries, async () => {
    // Veo is a long-running operation: start it, then poll until it is done.
    const startRes = await fetch(`${base}:predictLongRunning`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt,
            image: { bytesBase64Encoded: imageBytes, mimeType: 'image/png' },
          },
        ],
        parameters: {
          aspectRatio: CONFIG.video.aspectRatio,
          durationSeconds: CONFIG.episode.secondsPerScene,
          resolution: CONFIG.video.resolution,
          generateAudio: withAudio,
          sampleCount: 1,
        },
      }),
    });

    if (!startRes.ok) {
      const text = (await startRes.text()).slice(0, 400);
      throw new Error(
        `Veo would not start scene ${index + 1} (${startRes.status}): ${text}` +
          (startRes.status === 404
            ? ' -- the model name may have been retired. Change video.model in src/lib/config.ts.'
            : ''),
      );
    }

    const { name: operation } = (await startRes.json()) as { name: string };
    return pollVeo(base, operation, token, index);
  });

  await fs.writeFile(out, Buffer.from(videoBase64, 'base64'));
  return out;
}

async function pollVeo(
  base: string,
  operationName: string,
  token: string,
  index: number,
): Promise<string> {
  const deadline = Date.now() + CONFIG.video.timeoutMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 10_000));

    const res = await fetch(`${base}:fetchPredictOperation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operationName }),
    });
    if (!res.ok) continue;

    const op = (await res.json()) as {
      done?: boolean;
      error?: { message?: string };
      response?: {
        videos?: { bytesBase64Encoded?: string; gcsUri?: string }[];
        raiMediaFilteredReasons?: string[];
      };
    };

    if (!op.done) continue;
    if (op.error?.message) throw new Error(`Veo failed on scene ${index + 1}: ${op.error.message}`);

    const filtered = op.response?.raiMediaFilteredReasons?.[0];
    if (filtered) {
      throw new Error(
        `Veo refused scene ${index + 1}: ${filtered}. Soften the wording of that line and try again.`,
      );
    }

    const bytes = op.response?.videos?.[0]?.bytesBase64Encoded;
    if (bytes) return bytes;

    throw new Error(`Veo finished scene ${index + 1} but sent no video back.`);
  }

  throw new Error(
    `Veo took too long on scene ${index + 1}. Try again, or lower the number of scenes.`,
  );
}

/** Google Cloud wants a signed token, not a plain API key. */
async function accessToken(): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) throw new Error('empty token');
    return token.token;
  } catch (err) {
    throw new Error(
      'Google Cloud would not let us in. Check that GOOGLE_APPLICATION_CREDENTIALS in your .env ' +
        'points at your service account JSON file, and that Vertex AI and billing are both switched on. ' +
        `(${err instanceof Error ? err.message : String(err)})`,
    );
  }
}

/** Mock mode: a real 8-second clip made from the still, so stitching is tested. */
async function mockClip(
  out: string,
  stillPath: string,
  scene: Scene,
  index: number,
): Promise<void> {
  const seconds = CONFIG.episode.secondsPerScene;
  await ffmpeg([
    '-loop', '1',
    '-i', stillPath,
    '-f', 'lavfi',
    '-i', `sine=frequency=${scene.speaker === 'mammon' ? 110 : 190}:duration=${seconds}`,
    '-vf', [
      // A slow zoom so the clip is obviously moving video, not a still.
      `zoompan=z='min(zoom+0.0008,1.08)':d=${seconds * CONFIG.episode.fps}:s=1080x1920:fps=${CONFIG.episode.fps}`,
      ...wrapLine(scene.line).map(
        (row, r) =>
          `drawtext=${fontPrefix()}text='${row}':fontcolor=0xEDE4D3:fontsize=40:` +
          `x=(w-text_w)/2:y=${1020 + r * 56}:box=1:boxcolor=0x0A0806@0.65:boxborderw=14`,
      ),
    ].join(','),
    '-t', String(seconds),
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-shortest',
    out,
  ]);
}

import fs from 'node:fs/promises';
import { CONFIG } from '../config';
import { buildCharacterLockBlock } from '../prompt';
import { getStyle } from '../styles';
import { workFile } from '../paths';
import { MOCK_SCENE_COLORS } from '../mock';
import { ffmpeg, fontPrefix } from './ffmpeg';
import characters from '../../../characters.json';
import type { Scene } from '../types';

/**
 * STEP 3. One still image per scene, from fal.ai Flux.
 * The character lock text and the reference pictures go with every request,
 * so Mammon and JT do not drift from scene to scene.
 */
export async function makeSceneImage(
  jobId: string,
  scene: Scene,
  index: number,
  styleId: string,
): Promise<string> {
  const out = workFile(jobId, `scene_${index + 1}_still.png`);

  if (CONFIG.mockMode) {
    await mockStill(out, index, scene);
    return out;
  }

  const key = process.env.FAL_KEY;
  if (!key) {
    throw new Error(
      'No FAL_KEY found. It is the same key as your PennyPixel app. Put it in your .env file.',
    );
  }

  const style = getStyle(styleId);
  const prompt = [
    style.look,
    '',
    buildCharacterLockBlock(scene.speaker),
    '',
    `SHOT: ${scene.shot}.`,
    `ACTION: ${characters[scene.speaker].name} ${scene.action}.`,
    'Vertical 9:16. No on-screen text, no subtitles, no watermark, no logo.',
  ].join('\n');

  const referenceImages = [
    ...characters.mammon.referenceImages,
    ...characters.jt.referenceImages,
  ].filter((url) => /^https?:\/\//.test(url));

  const body: Record<string, unknown> = {
    prompt,
    image_size: { width: 1080, height: 1920 },
    num_images: 1,
    enable_safety_checker: false,
  };
  // Flux uses the reference pictures to hold the faces steady.
  if (referenceImages.length) body.image_prompts = referenceImages;

  const url = await withRetries(CONFIG.images.maxRetries, async () => {
    const res = await fetch(`https://fal.run/${CONFIG.images.model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`fal.ai said no (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as { images?: { url: string }[] };
    const first = data.images?.[0]?.url;
    if (!first) throw new Error('fal.ai returned no picture.');
    return first;
  });

  const img = await fetch(url);
  await fs.writeFile(out, Buffer.from(await img.arrayBuffer()));
  return out;
}

/** A readable placeholder still, so mock mode produces something watchable. */
async function mockStill(out: string, index: number, scene: Scene): Promise<void> {
  const color = MOCK_SCENE_COLORS[index % MOCK_SCENE_COLORS.length];
  const who = scene.speaker === 'mammon' ? 'MR. MAMMON' : 'JT';
  await ffmpeg([
    '-f', 'lavfi',
    '-i', `color=c=${color}:s=1080x1920`,
    '-vf', [
      `drawbox=x=0:y=0:w=1080:h=1920:color=0x0A0806@1:t=fill`,
      `drawbox=x=40:y=40:w=1000:h=1840:color=${color}@1:t=fill`,
      `drawtext=${fontPrefix()}text='SCENE ${index + 1}':fontcolor=0xF2C14E:fontsize=64:x=(w-text_w)/2:y=240`,
      `drawtext=${fontPrefix()}text='${esc(who)}':fontcolor=0xEDE4D3:fontsize=48:x=(w-text_w)/2:y=360`,
      `drawtext=${fontPrefix()}text='${esc(scene.shot)}':fontcolor=0x8A8070:fontsize=34:x=(w-text_w)/2:y=1500`,
      `drawtext=${fontPrefix()}text='MOCK MODE - no money spent':fontcolor=0x5C5447:fontsize=28:x=(w-text_w)/2:y=1800`,
    ].join(','),
    '-frames:v', '1',
    out,
  ]);
}

/** ffmpeg drawtext chokes on some characters. Clean them, keep the words. */
export function esc(text: string): string {
  return text
    .replace(/\\/g, '')
    // A straight apostrophe would end the filter string, so use the curly one.
    .replace(/'/g, '\u2019')
    .replace(/"/g, '')
    .replace(/:/g, '\\:')
    .replace(/%/g, '')
    .replace(/[\r\n]+/g, ' ');
}

/** Breaks a long line into rows of at most `perLine` characters. */
export function wrapLine(text: string, perLine = 34, maxRows = 3): string[] {
  const words = esc(text).split(/\s+/);
  const rows: string[] = [];
  let row = '';
  for (const word of words) {
    if (!row) row = word;
    else if ((row + ' ' + word).length <= perLine) row += ' ' + word;
    else {
      rows.push(row);
      row = word;
    }
  }
  if (row) rows.push(row);
  return rows.slice(0, maxRows);
}

export async function withRetries<T>(
  maxRetries: number,
  fn: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { CONFIG } from '../config';
import { assetsDir, publicEpisodeDir, workFile } from '../paths';
import { ffmpeg, fontPrefix } from './ffmpeg';
import { esc } from './images';
import type { Scene, Script } from '../types';

/**
 * STEP 8. Join the scenes, burn the big caption word onto each one, drop the
 * cha-ching on the punchlines, add the end card, and write the finished
 * 1080x1920 MP4 into public/episodes so the browser can play it.
 */
export async function stitchEpisode(
  jobId: string,
  script: Script,
  scenePaths: string[],
): Promise<string> {
  const { width, height, fps, secondsPerScene } = CONFIG.episode;

  // 1. Burn the caption word onto each scene.
  const captioned: string[] = [];
  for (let i = 0; i < scenePaths.length; i++) {
    const scene = script.scenes[i];
    const out = workFile(jobId, `scene_${i + 1}_captioned.mp4`);
    await ffmpeg([
      '-i', scenePaths[i],
      '-vf', captionFilter(scene, width, height),
      '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
      '-r', String(fps),
      '-c:a', 'aac', '-b:a', '192k',
      out,
    ]);
    captioned.push(out);
  }

  // 2. The end card.
  const endCard = workFile(jobId, 'end_card.mp4');
  await makeEndCard(endCard, script);
  captioned.push(endCard);

  // 3. Join them all.
  const listFile = workFile(jobId, 'join.txt');
  await fs.writeFile(
    listFile,
    captioned.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'),
  );

  const joined = workFile(jobId, 'joined.mp4');
  await ffmpeg([
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`,
    joined,
  ]);

  // 4. The cha-ching hits, if there is a sound file for it.
  const withSfx = await addSfx(jobId, joined, script, secondsPerScene);

  // 5. Out it goes.
  const safeTitle = script.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  const finalName = `${safeTitle || 'episode'}-${jobId}.mp4`;
  const finalPath = path.join(publicEpisodeDir(), finalName);
  await fs.copyFile(withSfx, finalPath);

  // Served by the video route, not straight out of public/, because Next.js
  // only serves files that were already there when the app started.
  return `/api/video/${encodeURIComponent(finalName)}`;
}

/** Big gold caption word, low in frame, with a dark outline so it always reads. */
function captionFilter(scene: Scene, width: number, height: number): string {
  if (!scene.caption) return `scale=${width}:${height}`;
  const size = scene.caption.length > 8 ? CONFIG.stitch.captionFontSize * 0.7 : CONFIG.stitch.captionFontSize;
  return [
    `scale=${width}:${height}`,
    [
      `drawtext=${fontPrefix()}text='${esc(scene.caption.toUpperCase())}'`,
      `fontcolor=${CONFIG.stitch.captionColor}`,
      `fontsize=${Math.round(size)}`,
      `borderw=8`,
      `bordercolor=${CONFIG.stitch.captionStrokeColor}`,
      `x=(w-text_w)/2`,
      `y=h-460`,
      // Pops in a third of a second after the scene starts.
      `enable='gte(t,0.35)'`,
    ].join(':'),
  ].join(',');
}

async function makeEndCard(out: string, script: Script): Promise<void> {
  const { width, height, fps } = CONFIG.episode;
  const seconds = CONFIG.stitch.endCardSeconds;
  await ffmpeg([
    '-f', 'lavfi', '-i', `color=c=0x0A0806:s=${width}x${height}:d=${seconds}:r=${fps}`,
    '-f', 'lavfi', '-i', `anullsrc=channel_layout=stereo:sample_rate=44100:d=${seconds}`,
    '-vf', [
      `drawtext=${fontPrefix()}text='THE PRICE':fontcolor=0xF2C14E:fontsize=120:x=(w-text_w)/2:y=h/2-200`,
      `drawtext=${fontPrefix()}text='OF PROFIT':fontcolor=0xF2C14E:fontsize=120:x=(w-text_w)/2:y=h/2-60`,
      `drawtext=${fontPrefix()}text='${esc(script.title)}':fontcolor=0x8A8070:fontsize=44:x=(w-text_w)/2:y=h/2+120`,
      `drawtext=${fontPrefix()}text='Who next? Comments.':fontcolor=0xEDE4D3:fontsize=52:x=(w-text_w)/2:y=h/2+260`,
    ].join(','),
    '-t', String(seconds),
    '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    out,
  ]);
}

/**
 * Mixes the cha-ching in at each punchline scene.
 * Put a short sound file at assets/cha-ching.mp3 to switch this on.
 * Without the file, the episode is simply finished without it.
 */
async function addSfx(
  jobId: string,
  input: string,
  script: Script,
  secondsPerScene: number,
): Promise<string> {
  if (!CONFIG.stitch.sfxEnabled) return input;

  const sfxFile = path.join(assetsDir(), 'cha-ching.mp3');
  try {
    await fs.access(sfxFile);
  } catch {
    return input; // No sound file yet. Not a problem.
  }

  const hits = script.scenes
    .map((scene, i) => (scene.sfx === 'cha-ching' ? i * secondsPerScene + 0.4 : null))
    .filter((t): t is number => t !== null);

  if (!hits.length) return input;

  const out = workFile(jobId, 'with_sfx.mp4');
  const inputs = hits.flatMap(() => ['-i', sfxFile]);
  const delayed = hits
    .map((t, n) => `[${n + 1}:a]adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)},volume=0.5[s${n}]`)
    .join(';');
  const mixInputs = hits.map((_, n) => `[s${n}]`).join('');

  await ffmpeg([
    '-i', input,
    ...inputs,
    '-filter_complex',
    `${delayed};[0:a]${mixInputs}amix=inputs=${hits.length + 1}:duration=first:dropout_transition=0:normalize=0[aout]`,
    '-map', '0:v', '-map', '[aout]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    out,
  ]);

  return out;
}

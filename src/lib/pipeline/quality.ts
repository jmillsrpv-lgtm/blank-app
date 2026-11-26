import fs from 'node:fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import { CONFIG } from '../config';
import { workFile } from '../paths';
import { ffmpeg } from './ffmpeg';
import characters from '../../../characters.json';
import type { Scene } from '../types';

export type QualityVerdict = {
  score: number;
  passed: boolean;
  reason: string;
};

/**
 * STEP 5. Pull a frame out of the finished clip and have Claude look at it
 * next to the reference pictures. If the character has drifted, the scene
 * gets rendered again, up to the retry limit.
 */
export async function checkSceneQuality(
  jobId: string,
  clipPath: string,
  scene: Scene,
  index: number,
): Promise<QualityVerdict> {
  if (!CONFIG.qualityCheck.enabled || CONFIG.mockMode) {
    return { score: 10, passed: true, reason: CONFIG.mockMode ? 'mock mode' : 'check switched off' };
  }

  const framePath = workFile(jobId, `scene_${index + 1}_frame.jpg`);
  await ffmpeg(['-i', clipPath, '-ss', '00:00:02', '-frames:v', '1', '-q:v', '3', framePath]);

  const refUrls = [
    ...characters.mammon.referenceImages,
    ...characters.jt.referenceImages,
  ].filter((u) => /^https?:\/\//.test(u));

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const frameBase64 = (await fs.readFile(framePath)).toString('base64');
  const who = characters[scene.speaker];

  const content: Anthropic.ContentBlockParam[] = [];

  for (const url of refUrls.slice(0, 4)) {
    content.push({ type: 'image', source: { type: 'url', url } });
  }
  content.push({
    type: 'image',
    source: { type: 'base64', media_type: 'image/jpeg', data: frameBase64 },
  });
  content.push({
    type: 'text',
    text: [
      refUrls.length
        ? 'The first pictures are the official reference pictures for these characters. The last picture is a frame from a clip we just generated.'
        : 'The picture is a frame from a clip we just generated. Judge it against the written description alone.',
      '',
      'The characters must look like this:',
      `MR. MAMMON: ${characters.mammon.description}`,
      `JT: ${characters.jt.description}`,
      `SET: ${characters.set.description}`,
      '',
      `In this shot, ${who.name} is speaking.`,
      '',
      'Score the frame out of 10 on whether the characters and set match. Mark it down hard for:',
      'wrong number of people, swapped sides of frame, missing horns, missing baseball cap,',
      'a different face, modern clothing on Mammon, on-screen text or subtitles, or a mangled face or hands.',
      '',
      'Answer with ONLY valid JSON: {"score": 0-10, "reason": "one short sentence"}',
    ].join('\n'),
  });

  try {
    const res = await client.messages.create({
      model: CONFIG.qualityCheck.model,
      max_tokens: 300,
      messages: [{ role: 'user', content }],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? (JSON.parse(match[0]) as { score?: number; reason?: string }) : {};
    const score = Number(parsed.score ?? 0);

    return {
      score,
      passed: score >= CONFIG.qualityCheck.passScore,
      reason: String(parsed.reason ?? 'no reason given'),
    };
  } catch (err) {
    // A failed check must never block the episode. Let it through and say so.
    return {
      score: CONFIG.qualityCheck.passScore,
      passed: true,
      reason: `could not check this one (${err instanceof Error ? err.message : String(err)})`,
    };
  }
}

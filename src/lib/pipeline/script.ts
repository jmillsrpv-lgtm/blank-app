import Anthropic from '@anthropic-ai/sdk';
import { CONFIG } from '../config';
import { buildScriptSystemPrompt, buildScriptUserPrompt } from '../prompt';
import type { Script } from '../types';
import { MOCK_SCRIPT } from '../mock';

/** STEP 1. Ask Claude for the 8 scenes. */
export async function writeScript(topic: string, episodeNumber: number): Promise<Script> {
  if (CONFIG.mockMode) {
    await new Promise((r) => setTimeout(r, 900));
    return { ...MOCK_SCRIPT, title: MOCK_SCRIPT.title.replace('#N', `#${episodeNumber}`) };
  }

  const client = new Anthropic({ apiKey: requireKey() });

  const ask = async (model: string) =>
    client.messages.create({
      model,
      max_tokens: CONFIG.script.maxOutputTokens,
      system: buildScriptSystemPrompt(),
      messages: [{ role: 'user', content: buildScriptUserPrompt(topic) }],
    });

  let response;
  try {
    response = await ask(CONFIG.script.model);
  } catch (err) {
    // The model name in config may have been retired. Try the fallback once.
    console.warn(
      `Script model ${CONFIG.script.model} failed, trying ${CONFIG.script.fallbackModel}`,
      err,
    );
    response = await ask(CONFIG.script.fallbackModel);
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  const script = parseScript(text);
  script.title = script.title.replace('#N', `#${episodeNumber}`);
  return script;
}

function requireKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      'No ANTHROPIC_API_KEY found. Put it in your .env file, then stop and start the app again.',
    );
  }
  return key;
}

/** Claude sometimes wraps JSON in a markdown fence. Handle both. */
export function parseScript(raw: string): Script {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace > 0 || lastBrace < text.length - 1) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The script did not come back as readable JSON. Try Make Episode again.');
  }

  const script = parsed as Script;
  if (!script?.scenes?.length) {
    throw new Error('The script came back with no scenes in it. Try Make Episode again.');
  }

  // Trim or pad to the configured scene count so later steps are predictable.
  const want = CONFIG.episode.sceneCount;
  if (script.scenes.length > want) script.scenes = script.scenes.slice(0, want);

  script.scenes = script.scenes.map((scene) => ({
    ...scene,
    speaker: scene.speaker === 'jt' ? 'jt' : 'mammon',
    line: String(scene.line ?? '').trim(),
    shot: String(scene.shot ?? 'medium two-shot').trim(),
    action: String(scene.action ?? 'sits still').trim(),
    caption: String(scene.caption ?? '').trim().split(/\s+/).slice(0, 2).join(' '),
    sfx: scene.sfx === 'cha-ching' ? 'cha-ching' : 'none',
  }));

  script.hashtags = Array.isArray(script.hashtags) ? script.hashtags : [];
  script.postCaption = String(script.postCaption ?? '').trim();
  script.title = String(script.title ?? "Mammon's Old Friends #N").trim();

  return script;
}

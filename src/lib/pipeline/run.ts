import fs from 'node:fs';
import { CONFIG } from '../config';
import { ACTUAL } from '../cost';
import { addLog, addSpend, getJob, updateStep } from '../jobs';
import { publicEpisodeDir } from '../paths';
import type { Script } from '../types';
import { writeScript } from './script';
import { makeSceneImage } from './images';
import { makeSceneVideo } from './video';
import { checkSceneQuality } from './quality';
import { makeSceneVoice } from './voices';
import { syncSceneLips } from './lipsync';
import { stitchEpisode } from './stitch';

/**
 * The whole machine, behind the one button. Steps run in order; the eight
 * scenes inside a step run at the same time where that is safe to do.
 */
export async function runEpisode(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) return;

  job.status = 'running';
  const n = CONFIG.episode.sceneCount;

  try {
    // 1. SCRIPT
    updateStep(jobId, 'script', { status: 'running', detail: 'Asking Claude for 8 scenes' });
    addLog(jobId, `Writing the script about: ${job.topic}`);
    const script = await writeScript(job.topic, countEpisodes());
    job.script = script;
    job.postCaption = buildPostCaption(script);
    addSpend(jobId, 0.05);
    updateStep(jobId, 'script', { status: 'done', progress: 100, detail: script.title });
    addLog(jobId, `Script done: ${script.title}`);

    const scenes = script.scenes.slice(0, n);

    // 3. SCENE IMAGES, all at once
    updateStep(jobId, 'images', { status: 'running', detail: `0 of ${scenes.length} drawn` });
    let imagesDone = 0;
    const stills = await Promise.all(
      scenes.map(async (scene, i) => {
        const still = await makeSceneImage(jobId, scene, i, job.styleId);
        imagesDone++;
        addSpend(jobId, ACTUAL.imagePerScene);
        updateStep(jobId, 'images', {
          progress: Math.round((imagesDone / scenes.length) * 100),
          detail: `${imagesDone} of ${scenes.length} drawn`,
        });
        return still;
      }),
    );
    updateStep(jobId, 'images', { status: 'done', progress: 100 });
    addLog(jobId, `All ${scenes.length} scene pictures drawn.`);

    // 4 + 5. VIDEO, then the quality check, with a re-render if a face drifted
    updateStep(jobId, 'video', { status: 'running', detail: `0 of ${scenes.length} animated` });
    updateStep(jobId, 'quality', { status: 'running', detail: 'Waiting for clips' });

    let videosDone = 0;
    const clips = await Promise.all(
      scenes.map(async (scene, i) => {
        let clip = await makeSceneVideo(jobId, scene, i, job.styleId, stills[i]);
        addSpend(jobId, ACTUAL.videoPerScene);

        // Look at the clip. If the character drifted, render that scene again.
        for (let attempt = 0; attempt < CONFIG.qualityCheck.maxRetries; attempt++) {
          const verdict = await checkSceneQuality(jobId, clip, scene, i);
          if (verdict.passed) {
            if (verdict.score < 10) {
              addLog(jobId, `Scene ${i + 1} passed the look check (${verdict.score}/10).`);
            }
            break;
          }
          addLog(
            jobId,
            `Scene ${i + 1} drifted (${verdict.score}/10: ${verdict.reason}). Animating it again.`,
          );
          clip = await makeSceneVideo(jobId, scene, i, job.styleId, stills[i]);
          addSpend(jobId, ACTUAL.videoPerScene);
        }

        videosDone++;
        updateStep(jobId, 'video', {
          progress: Math.round((videosDone / scenes.length) * 100),
          detail: `${videosDone} of ${scenes.length} animated`,
        });
        return clip;
      }),
    );
    updateStep(jobId, 'video', { status: 'done', progress: 100 });
    updateStep(jobId, 'quality', { status: 'done', progress: 100, detail: 'Faces all match' });
    addLog(jobId, 'All scenes animated and checked.');

    // 6. VOICES
    updateStep(jobId, 'voices', { status: 'running', detail: `0 of ${scenes.length} voiced` });
    let voicesDone = 0;
    const voices = await Promise.all(
      scenes.map(async (scene, i) => {
        const voice = await makeSceneVoice(jobId, scene, i, clips[i]);
        voicesDone++;
        addSpend(jobId, ACTUAL.voicePerScene);
        updateStep(jobId, 'voices', {
          progress: Math.round((voicesDone / scenes.length) * 100),
          detail: `${voicesDone} of ${scenes.length} voiced`,
        });
        return voice;
      }),
    );
    updateStep(jobId, 'voices', { status: 'done', progress: 100 });
    addLog(jobId, 'Voices fixed to Mammon and JT.');

    // 7. LIP SYNC
    updateStep(jobId, 'lipsync', { status: 'running', detail: `0 of ${scenes.length} synced` });
    let syncedDone = 0;
    const synced = await Promise.all(
      scenes.map(async (_scene, i) => {
        const out = await syncSceneLips(jobId, clips[i], voices[i], i);
        syncedDone++;
        addSpend(jobId, ACTUAL.lipSyncPerScene);
        updateStep(jobId, 'lipsync', {
          progress: Math.round((syncedDone / scenes.length) * 100),
          detail: `${syncedDone} of ${scenes.length} synced`,
        });
        return out;
      }),
    );
    updateStep(jobId, 'lipsync', { status: 'done', progress: 100 });
    addLog(jobId, 'Mouths matched to the voices.');

    // 8. STITCH
    updateStep(jobId, 'stitch', { status: 'running', detail: 'Joining clips and burning captions' });
    const videoUrl = await stitchEpisode(jobId, script, synced);
    updateStep(jobId, 'stitch', { status: 'done', progress: 100, detail: 'Finished' });

    job.videoUrl = videoUrl;
    job.status = 'done';
    addLog(jobId, `Episode finished. Spent about $${job.spentUsd.toFixed(2)}.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    job.status = 'failed';
    job.error = message;
    const running = job.steps.find((s) => s.status === 'running');
    if (running) updateStep(jobId, running.name, { status: 'failed', detail: message });
    addLog(jobId, `Stopped: ${message}`);
  }
}

function buildPostCaption(script: Script): string {
  return [script.postCaption, '', script.hashtags.join(' ')].join('\n').trim();
}

/** Episode numbers carry on from however many MP4s are already finished. */
function countEpisodes(): number {
  try {
    return fs.readdirSync(publicEpisodeDir()).filter((f) => f.endsWith('.mp4')).length + 1;
  } catch {
    return 1;
  }
}

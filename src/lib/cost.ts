import { CONFIG } from './config';
import type { CostEstimate, CostLine } from './types';

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Works out what one episode will cost BEFORE anything is spent.
 * Shown on the screen; the run only starts by itself if it is under the cap.
 */
export function estimateEpisodeCost(): CostEstimate {
  const { sceneCount, secondsPerScene } = CONFIG.episode;
  const totalSeconds = sceneCount * secondsPerScene;
  const lines: CostLine[] = [];

  // 1. Script
  const scriptUsd =
    (CONFIG.script.estInputTokens / 1_000_000) * CONFIG.script.priceInputPerMTok +
    (CONFIG.script.estOutputTokens / 1_000_000) * CONFIG.script.priceOutputPerMTok;
  lines.push({ label: 'Writing the script', usd: scriptUsd, note: 'Claude' });

  // 3. Scene images
  const imagesUsd = sceneCount * CONFIG.images.pricePerImageUsd;
  lines.push({
    label: 'Drawing scenes',
    usd: imagesUsd,
    note: `${sceneCount} images`,
  });

  // 4. Video. Silent is cheaper, and we can run silent when we are making the
  // voices from the script text rather than changing Veo's own voices.
  const needsVeoAudio = CONFIG.voices.mode === 'changer';
  const perSecond = needsVeoAudio
    ? CONFIG.video.pricePerSecondWithAudioUsd
    : CONFIG.video.pricePerSecondSilentUsd;
  const videoUsd = totalSeconds * perSecond;
  lines.push({
    label: 'Animating',
    usd: videoUsd,
    note: `${totalSeconds}s of Veo${needsVeoAudio ? ' with sound' : ' silent'}`,
  });

  // 5. Quality check
  if (CONFIG.qualityCheck.enabled) {
    const qcUsd =
      sceneCount *
      ((CONFIG.qualityCheck.estInputTokensPerScene / 1_000_000) *
        CONFIG.qualityCheck.priceInputPerMTok +
        (CONFIG.qualityCheck.estOutputTokensPerScene / 1_000_000) *
          CONFIG.qualityCheck.priceOutputPerMTok);
    lines.push({
      label: 'Checking faces',
      usd: qcUsd,
      note: 'Claude looks at every clip',
    });
  }

  // 6. Voices
  const characters = totalSeconds * CONFIG.voices.charactersPerSecondOfAudio;
  const voicesUsd = characters * CONFIG.voices.pricePerCharacterUsd;
  lines.push({
    label: 'Fixing voices',
    usd: voicesUsd,
    note: `ElevenLabs, ${CONFIG.voices.mode === 'changer' ? 'voice changer' : 'text to speech'}`,
  });

  // 7. Lip sync
  const lipSyncUsd = totalSeconds * CONFIG.lipSync.pricePerSecondUsd;
  lines.push({ label: 'Syncing lips', usd: lipSyncUsd, note: 'Sync Labs' });

  // 8. Stitch is ffmpeg on your own machine. Free.
  lines.push({ label: 'Stitching', usd: 0, note: 'on your computer, free' });

  const totalUsd = lines.reduce((sum, l) => sum + l.usd, 0);

  return {
    lines: lines.map((l) => ({ ...l, usd: round(l.usd) })),
    totalUsd: round(totalUsd),
    capUsd: CONFIG.costCapUsd,
    overCap: totalUsd > CONFIG.costCapUsd,
  };
}

/** Per-scene cost, used to add up what a run has actually spent. */
export const ACTUAL = {
  imagePerScene: CONFIG.images.pricePerImageUsd,
  videoPerScene:
    CONFIG.episode.secondsPerScene *
    (CONFIG.voices.mode === 'changer'
      ? CONFIG.video.pricePerSecondWithAudioUsd
      : CONFIG.video.pricePerSecondSilentUsd),
  lipSyncPerScene: CONFIG.episode.secondsPerScene * CONFIG.lipSync.pricePerSecondUsd,
  voicePerScene:
    CONFIG.episode.secondsPerScene *
    CONFIG.voices.charactersPerSecondOfAudio *
    CONFIG.voices.pricePerCharacterUsd,
};

import { NextResponse } from 'next/server';
import { estimateEpisodeCost } from '@/lib/cost';
import { CONFIG } from '@/lib/config';
import { STYLES, DEFAULT_STYLE_ID } from '@/lib/styles';

/** The screen asks for this on load, so the cost is on show before anything runs. */
export async function GET() {
  return NextResponse.json({
    estimate: estimateEpisodeCost(),
    styles: STYLES.map(({ id, label }) => ({ id, label })),
    defaultStyleId: DEFAULT_STYLE_ID,
    mockMode: CONFIG.mockMode,
    sceneCount: CONFIG.episode.sceneCount,
    seconds: CONFIG.episode.sceneCount * CONFIG.episode.secondsPerScene,
  });
}

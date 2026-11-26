import { NextResponse } from 'next/server';
import { estimateEpisodeCost } from '@/lib/cost';
import { freshSteps, newJobId, putJob } from '@/lib/jobs';
import { runEpisode } from '@/lib/pipeline/run';
import { DEFAULT_STYLE_ID, getStyle } from '@/lib/styles';
import type { Job } from '@/lib/types';

/**
 * Make Episode. Works out the cost, and starts the run straight away if it is
 * under the cap. Over the cap it waits for an explicit yes.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    topic?: string;
    styleId?: string;
    approveOverCap?: boolean;
  };

  const topic = (body.topic ?? '').trim();
  if (!topic) {
    return NextResponse.json({ error: 'Type a topic first.' }, { status: 400 });
  }

  const estimate = estimateEpisodeCost();
  const job: Job = {
    id: newJobId(),
    topic,
    styleId: getStyle(body.styleId ?? DEFAULT_STYLE_ID).id,
    status: estimate.overCap && !body.approveOverCap ? 'awaiting-approval' : 'running',
    createdAt: Date.now(),
    steps: freshSteps(),
    estimate,
    spentUsd: 0,
    log: [],
  };
  putJob(job);

  if (job.status === 'running') {
    // Runs on in the background. The screen polls for how it is going.
    void runEpisode(job.id);
  }

  return NextResponse.json({ job });
}

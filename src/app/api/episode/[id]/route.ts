import { NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs';
import { runEpisode } from '@/lib/pipeline/run';

/** How is it going? The screen asks this about once a second. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: 'That episode is not running any more.' }, { status: 404 });
  }
  return NextResponse.json({ job });
}

/** Yes, go ahead even though it is over the cap. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: 'That episode is not running any more.' }, { status: 404 });
  }
  if (job.status === 'awaiting-approval') {
    job.status = 'running';
    void runEpisode(job.id);
  }
  return NextResponse.json({ job });
}

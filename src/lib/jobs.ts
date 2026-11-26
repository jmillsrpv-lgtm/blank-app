import type { Job, Step, StepName, StepStatus } from './types';

/**
 * Where running episodes are kept. In memory, because this runs on Jake's
 * own computer one episode at a time. Nothing to install, nothing to set up.
 * If this ever moves to a real server with more than one user, this is the
 * one file that has to become a proper database.
 */
const jobs = new Map<string, Job>();

export const STEP_LABELS: Record<StepName, string> = {
  script: 'Writing script',
  images: 'Drawing scenes',
  video: 'Animating',
  quality: 'Checking faces',
  voices: 'Fixing voices',
  lipsync: 'Syncing lips',
  stitch: 'Stitching',
};

export function freshSteps(): Step[] {
  return (Object.keys(STEP_LABELS) as StepName[]).map((name) => ({
    name,
    label: STEP_LABELS[name],
    status: 'waiting' as StepStatus,
    progress: 0,
  }));
}

export function putJob(job: Job): void {
  jobs.set(job.id, job);
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateStep(
  jobId: string,
  name: StepName,
  patch: Partial<Step>,
): void {
  const job = jobs.get(jobId);
  if (!job) return;
  const step = job.steps.find((s) => s.name === name);
  if (!step) return;
  Object.assign(step, patch);
  if (patch.status === 'running' && !step.startedAt) step.startedAt = Date.now();
  if (patch.status === 'done' || patch.status === 'failed') step.endedAt = Date.now();
}

export function addLog(jobId: string, message: string): void {
  const job = jobs.get(jobId);
  if (!job) return;
  job.log.push(`${new Date().toLocaleTimeString()}  ${message}`);
  console.log(`[${jobId}] ${message}`);
}

export function addSpend(jobId: string, usd: number): void {
  const job = jobs.get(jobId);
  if (!job) return;
  job.spentUsd = Math.round((job.spentUsd + usd) * 100) / 100;
}

export function newJobId(): string {
  return `ep_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

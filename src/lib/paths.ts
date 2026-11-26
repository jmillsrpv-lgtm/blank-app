import fs from 'node:fs';
import path from 'node:path';

/** Working files for one episode live together in one folder. */
export function workDir(jobId: string): string {
  const dir = path.join(process.cwd(), '.work', jobId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Finished MP4s go here, so the browser can play and download them. */
export function publicEpisodeDir(): string {
  const dir = path.join(process.cwd(), 'public', 'episodes');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function workFile(jobId: string, name: string): string {
  return path.join(workDir(jobId), name);
}

export const assetsDir = (): string => path.join(process.cwd(), 'assets');

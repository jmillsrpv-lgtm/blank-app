import { spawn } from 'node:child_process';

/** Runs ffmpeg and resolves when it is finished. Throws with its own words. */
export function ffmpeg(args: string[]): Promise<void> {
  return run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
}

export function ffprobeDuration(file: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      file,
    ]);
    let out = '';
    proc.stdout.on('data', (d) => (out += d));
    proc.on('error', reject);
    proc.on('close', () => {
      const n = Number.parseFloat(out.trim());
      resolve(Number.isFinite(n) ? n : 0);
    });
  });
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stderr = '';
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new Error(
            'ffmpeg is not installed on this computer. See the README section "Install ffmpeg".',
          ),
        );
        return;
      }
      reject(err);
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed: ${stderr.trim().split('\n').slice(-3).join(' ')}`));
    });
  });
}

/** True if ffmpeg can be found, so the app can warn early instead of late. */
export async function ffmpegAvailable(): Promise<boolean> {
  try {
    await run('ffmpeg', ['-version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * ffmpeg's text drawing needs a font. On most computers it finds one by
 * itself. If yours cannot (the error says "Cannot find a valid font"), put
 * the full path to a .ttf file in CAPTION_FONT_FILE in your .env file.
 */
export function fontPrefix(): string {
  const file = process.env.CAPTION_FONT_FILE?.trim();
  return file ? `fontfile='${file.replace(/'/g, '')}':` : '';
}

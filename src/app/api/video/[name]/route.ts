import fs from 'node:fs';
import path from 'node:path';
import { publicEpisodeDir } from '@/lib/paths';

/**
 * Serves a finished episode off the disk.
 *
 * Next.js only knows about files that were in public/ when the app started,
 * and every episode is made after that, so they have to be served from here
 * instead. Handles range requests too, so the video can be scrubbed.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  // Only ever serve a plain MP4 file name from inside the episodes folder.
  const safeName = path.basename(name);
  if (!/^[A-Za-z0-9._-]+\.mp4$/.test(safeName)) {
    return new Response('Not found', { status: 404 });
  }

  const dir = publicEpisodeDir();
  const file = path.join(dir, safeName);
  if (path.dirname(path.resolve(file)) !== path.resolve(dir)) {
    return new Response('Not found', { status: 404 });
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(file);
  } catch {
    return new Response('That episode is no longer on disk.', { status: 404 });
  }

  const wantsDownload = new URL(request.url).searchParams.has('download');
  const headers = new Headers({
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  });
  if (wantsDownload) {
    headers.set('Content-Disposition', `attachment; filename="${safeName}"`);
  }

  const range = request.headers.get('range');
  const match = range?.match(/bytes=(\d*)-(\d*)/);

  if (match) {
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : stat.size - 1;

    if (start >= stat.size || end >= stat.size || start > end) {
      return new Response('Range not satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${stat.size}` },
      });
    }

    headers.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(toWebStream(fs.createReadStream(file, { start, end })), {
      status: 206,
      headers,
    });
  }

  headers.set('Content-Length', String(stat.size));
  return new Response(toWebStream(fs.createReadStream(file)), { status: 200, headers });
}

function toWebStream(stream: fs.ReadStream): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => {
        controller.enqueue(
          typeof chunk === 'string' ? new TextEncoder().encode(chunk) : new Uint8Array(chunk),
        );
      });
      stream.on('end', () => controller.close());
      stream.on('error', (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });
}

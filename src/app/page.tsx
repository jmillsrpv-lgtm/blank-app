'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CostEstimate, Job } from '@/lib/types';

type Boot = {
  estimate: CostEstimate;
  styles: { id: string; label: string }[];
  defaultStyleId: string;
  mockMode: boolean;
  sceneCount: number;
  seconds: number;
};

export default function Page() {
  const [boot, setBoot] = useState<Boot | null>(null);
  const [topic, setTopic] = useState('');
  const [styleId, setStyleId] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  // What will this cost, and which styles are there?
  useEffect(() => {
    fetch('/api/estimate')
      .then((r) => r.json())
      .then((data: Boot) => {
        setBoot(data);
        setStyleId(data.defaultStyleId);
      })
      .catch(() => setError('Could not reach the machine. Is the app still running?'));
  }, []);

  // While an episode is being made, ask how it is going once a second.
  useEffect(() => {
    if (!job || (job.status !== 'running' && job.status !== 'awaiting-approval')) {
      if (poll.current) clearInterval(poll.current);
      return;
    }
    poll.current = setInterval(async () => {
      const res = await fetch(`/api/episode/${job.id}`);
      if (!res.ok) return;
      const data = (await res.json()) as { job: Job };
      setJob(data.job);
    }, 1000);
    return () => {
      if (poll.current) clearInterval(poll.current);
    };
  }, [job?.id, job?.status]);

  const makeEpisode = useCallback(async () => {
    setError('');
    setStarting(true);
    try {
      const res = await fetch('/api/episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, styleId }),
      });
      const data = (await res.json()) as { job?: Job; error?: string };
      if (!res.ok || !data.job) {
        setError(data.error ?? 'Something went wrong starting the episode.');
        return;
      }
      setJob(data.job);
    } catch {
      setError('Could not reach the machine. Is the app still running?');
    } finally {
      setStarting(false);
    }
  }, [topic, styleId]);

  const approveOverCap = useCallback(async () => {
    if (!job) return;
    const res = await fetch(`/api/episode/${job.id}`, { method: 'POST' });
    const data = (await res.json()) as { job: Job };
    setJob(data.job);
  }, [job]);

  const copyCaption = useCallback(async () => {
    if (!job?.postCaption) return;
    await navigator.clipboard.writeText(job.postCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [job?.postCaption]);

  const startOver = useCallback(() => {
    setJob(null);
    setTopic('');
    setError('');
  }, []);

  const estimate = job?.estimate ?? boot?.estimate;
  const busy = job?.status === 'running';
  const waitingForYes = job?.status === 'awaiting-approval';
  const finished = job?.status === 'done';
  const failed = job?.status === 'failed';

  return (
    <main className="shell">
      <header className="masthead">
        <div className="crest">Mammon&apos;s Old Friends</div>
        <h1 className="wordmark">
          The Price
          <em>of Profit</em>
        </h1>
        <p className="standfirst">
          One topic in. One finished episode out. He will speak of them fondly.
        </p>
        {boot?.mockMode && <div className="test-flag">Test mode — no money spent</div>}
      </header>

      {/* ---------- The topic ---------- */}
      {!job && (
        <>
          <div className="field">
            <label className="field-label" htmlFor="topic">
              The old friend
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && topic.trim() && !starting) makeEpisode();
              }}
              placeholder="Hawks Nest tunnel"
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="style">
              Style
            </label>
            <select id="style" value={styleId} onChange={(e) => setStyleId(e.target.value)}>
              {boot?.styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* ---------- What it will cost ---------- */}
      {estimate && !finished && (
        <section className="ledger">
          <div className="ledger-head">
            <span>Bill of costs</span>
            <span>
              {boot?.sceneCount ?? 8} scenes · {boot?.seconds ?? 64}s
            </span>
          </div>

          {estimate.lines.map((line) => (
            <div className="ledger-line" key={line.label}>
              <span className="what">{line.label}</span>
              {line.note && <span className="note">{line.note}</span>}
              <span className="leader" />
              <span className="sum">{line.usd === 0 ? '—' : `$${line.usd.toFixed(2)}`}</span>
            </div>
          ))}

          <div className="ledger-total">
            <span className="what">Per episode</span>
            <span className="leader" />
            <span className="sum">${estimate.totalUsd.toFixed(2)}</span>
          </div>

          <p className={`cap-note${estimate.overCap ? ' over' : ''}`}>
            {estimate.overCap
              ? `Over your $${estimate.capUsd.toFixed(2)} limit. It will stop and ask you first.`
              : `Under your $${estimate.capUsd.toFixed(2)} limit, so it runs on its own.`}
          </p>
        </section>
      )}

      {/* ---------- The button ---------- */}
      {!job && (
        <button
          className="make"
          onClick={makeEpisode}
          disabled={!topic.trim() || starting || !boot}
        >
          {starting ? 'Starting…' : 'Make Episode'}
        </button>
      )}

      {/* ---------- Over the limit, needs a yes ---------- */}
      {waitingForYes && (
        <>
          <div className="notice">
            <strong>This one is over your limit.</strong> It is about $
            {job.estimate.totalUsd.toFixed(2)}, and your limit is $
            {job.estimate.capUsd.toFixed(2)}. Nothing has been spent yet.
          </div>
          <button className="make" onClick={approveOverCap}>
            Spend ${job.estimate.totalUsd.toFixed(2)} and go
          </button>
          <button className="make secondary" onClick={startOver}>
            No, go back
          </button>
        </>
      )}

      {/* ---------- How it is going ---------- */}
      {job && (busy || finished || failed) && (
        <section className="run">
          {job.steps.map((step, i) => (
            <div className="step" key={step.name} data-status={step.status}>
              <span className="step-no">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <span className="step-name">{step.label}</span>
                {step.detail && <span className="step-detail">{step.detail}</span>}
              </span>
              <span className="step-mark">
                {step.status === 'done'
                  ? 'done'
                  : step.status === 'running'
                    ? 'working'
                    : step.status === 'failed'
                      ? 'stopped'
                      : '—'}
              </span>
              {step.status === 'running' && (
                <span className="step-bar">
                  <span style={{ width: `${step.progress}%` }} />
                </span>
              )}
            </div>
          ))}

          {busy && (
            <p className="spent">
              Spent so far ${job.spentUsd.toFixed(2)} — you can leave this open and come back
            </p>
          )}
        </section>
      )}

      {/* ---------- Finished ---------- */}
      {finished && job.videoUrl && (
        <section className="finished">
          <h2>{job.script?.title ?? 'Your episode'}</h2>
          <video src={job.videoUrl} controls playsInline />
          <a className="download" href={`${job.videoUrl}?download=1`}>
            Download the MP4
          </a>

          {job.postCaption && (
            <div className="caption-block">
              <h2>Caption for the post</h2>
              <p className="caption-text">{job.postCaption}</p>
              <button className="copy" onClick={copyCaption}>
                {copied ? 'Copied' : 'Copy caption'}
              </button>
            </div>
          )}

          <button className="make secondary" onClick={startOver}>
            Make another
          </button>
          <p className="spent">Cost ${job.spentUsd.toFixed(2)}</p>
        </section>
      )}

      {/* ---------- Trouble ---------- */}
      {failed && (
        <div className="notice bad">
          <strong>It stopped.</strong> {job.error}
          <br />
          <br />
          Nothing more will be spent. The step it stopped on is marked above.
        </div>
      )}

      {error && (
        <div className="notice bad">
          <strong>Hold on.</strong> {error}
        </div>
      )}

      {failed && (
        <button className="make secondary" onClick={startOver}>
          Try again
        </button>
      )}

      {/* ---------- The log, folded away ---------- */}
      {job && job.log.length > 0 && (
        <details className="log">
          <summary>What happened, step by step</summary>
          <pre>{job.log.join('\n')}</pre>
        </details>
      )}

      <footer className="colophon">The Price of Profit · Est. MMXXVI</footer>
    </main>
  );
}

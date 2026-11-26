export type Speaker = 'mammon' | 'jt';

/** One of the 8 scenes, as Claude returns it. */
export type Scene = {
  speaker: Speaker;
  /** Max 20 words. */
  line: string;
  /** Camera framing, e.g. "medium two-shot, slow push in". */
  shot: string;
  /** What the character does, e.g. "turns the pocket watch over". */
  action: string;
  /** 1-2 words burned big onto the screen. */
  caption: string;
  /** Sound effect cue, e.g. "cha-ching" or "none". */
  sfx: string;
};

export type Script = {
  title: string;
  /** Post caption and hashtags for the finished video. */
  postCaption: string;
  hashtags: string[];
  scenes: Scene[];
};

export type StepName =
  | 'script'
  | 'images'
  | 'video'
  | 'quality'
  | 'voices'
  | 'lipsync'
  | 'stitch';

export type StepStatus = 'waiting' | 'running' | 'done' | 'failed';

export type Step = {
  name: StepName;
  /** Plain words shown to Jake, e.g. "Drawing scenes". */
  label: string;
  status: StepStatus;
  /** 0-100 within this step. */
  progress: number;
  detail?: string;
  startedAt?: number;
  endedAt?: number;
};

export type CostLine = {
  label: string;
  usd: number;
  note?: string;
};

export type CostEstimate = {
  lines: CostLine[];
  totalUsd: number;
  capUsd: number;
  overCap: boolean;
};

export type JobStatus =
  | 'awaiting-approval'
  | 'running'
  | 'done'
  | 'failed'
  | 'cancelled';

export type Job = {
  id: string;
  topic: string;
  styleId: string;
  status: JobStatus;
  createdAt: number;
  steps: Step[];
  estimate: CostEstimate;
  /** What it actually cost, filled in as the run goes. */
  spentUsd: number;
  script?: Script;
  /** Public URL of the finished MP4, once there is one. */
  videoUrl?: string;
  postCaption?: string;
  error?: string;
  /** Plain-words log Jake can read if something goes wrong. */
  log: string[];
};

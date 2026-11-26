/**
 * ONE PLACE FOR MODEL NAMES AND PRICES.
 *
 * Google retires Veo versions often, and every provider changes prices.
 * When something breaks with "model not found", or the cost estimate looks
 * wrong, change it HERE and nowhere else.
 *
 * Prices last checked: 2026-11-26. Verify against the official pages:
 *   Veo (Vertex AI) ... https://cloud.google.com/vertex-ai/generative-ai/pricing
 *   Claude ........... https://www.anthropic.com/pricing
 *   fal.ai ........... https://fal.ai/pricing
 *   ElevenLabs ....... https://elevenlabs.io/pricing
 *   Sync Labs ........ https://sync.so/pricing
 */

export const CONFIG = {
  /** Episode shape. 8 scenes x 8 seconds = 64 seconds of finished video. */
  episode: {
    sceneCount: 8,
    secondsPerScene: 8,
    width: 1080,
    height: 1920,
    fps: 25,
  },

  /** Hard spending cap. Auto-runs under this, stops and asks over it. */
  costCapUsd: Number(process.env.COST_CAP_USD ?? 8),

  /** 1. SCRIPT - Anthropic (Claude) */
  script: {
    model: 'claude-opus-4-5',
    /** Fallback if the model above is retired or unavailable. */
    fallbackModel: 'claude-sonnet-4-5',
    maxOutputTokens: 4000,
    priceInputPerMTok: 5.0,
    priceOutputPerMTok: 25.0,
    /** Rough token use for one episode script. Used for the estimate only. */
    estInputTokens: 2000,
    estOutputTokens: 1800,
  },

  /** 2. SCENE IMAGES - fal.ai Flux (same provider + key as PennyPixel) */
  images: {
    /** fal.ai model path. Swap to 'fal-ai/flux-pro/v1.1' for higher quality. */
    model: 'fal-ai/flux/dev',
    pricePerImageUsd: 0.025,
    /** How many times to retry one image before giving up on the scene. */
    maxRetries: 2,
  },

  /** 3. VIDEO - Google Veo via Vertex AI
   *  The Gemini API Veo previews were shut down on 2026-10-22, so Vertex AI
   *  is the only API route. Model IDs move; check:
   *  https://cloud.google.com/vertex-ai/generative-ai/docs/models
   */
  video: {
    /** Lite/Fast tier at 720p is the cheap default, per the build rules. */
    model: 'veo-3.1-fast-generate-preview',
    /** Higher quality, roughly 4x the price. Only for a final keeper episode. */
    qualityModel: 'veo-3.1-generate-preview',
    location: process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1',
    resolution: '720p' as '720p' | '1080p',
    aspectRatio: '9:16',
    /** $/second. Fast tier, 720p. With audio costs more than silent. */
    pricePerSecondWithAudioUsd: 0.1,
    pricePerSecondSilentUsd: 0.08,
    /** Run all 8 scenes at once instead of one after another. */
    parallel: true,
    maxRetries: 2,
    /** How long to wait for one 8-second clip before calling it failed. */
    timeoutMs: 6 * 60 * 1000,
  },

  /** 5. QUALITY CHECK - Claude vision compares clip frames to the references */
  qualityCheck: {
    enabled: process.env.QUALITY_CHECK !== 'false',
    model: 'claude-opus-4-5',
    priceInputPerMTok: 5.0,
    priceOutputPerMTok: 25.0,
    /** Roughly what one frame-vs-reference comparison costs to think about. */
    estInputTokensPerScene: 2500,
    estOutputTokensPerScene: 300,
    /** Below this score (0-10) the scene is re-rendered. */
    passScore: 6,
    maxRetries: 2,
  },

  /** 6. VOICES - ElevenLabs
   *
   *  'changer' = speech-to-speech. Veo generates the talking, ElevenLabs
   *              swaps in the fixed Mammon / JT voice. This is what the
   *              build handoff asks for. Needs Veo to generate audio.
   *  'tts'     = text-to-speech straight from the script lines. Cheaper,
   *              because Veo can then be run silent, and the voice is exactly
   *              the fixed voice every time. Lips are fixed by lip sync either
   *              way. Switch with VOICE_MODE=tts in .env.
   */
  voices: {
    mode: (process.env.VOICE_MODE ?? 'changer') as 'changer' | 'tts',
    changerModel: 'eleven_multilingual_sts_v2',
    ttsModel: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128',
    /** ElevenLabs bills characters. ~$0.00018/char on the Creator tier. */
    pricePerCharacterUsd: 0.00018,
    /** Speech-to-speech bills about 1000 characters per minute of audio. */
    charactersPerSecondOfAudio: 16.7,
    maxRetries: 2,
  },

  /** 7. LIP SYNC - Sync Labs lipsync-2
   *
   *  provider 'fal' (default) runs Sync's lipsync-2 through fal.ai, using the
   *  same FAL_KEY as the scene pictures. We default to this because it accepts
   *  the clips straight off your computer.
   *
   *  provider 'sync' talks to Sync Labs directly with SYNC_LABS_API_KEY. It is
   *  a little cheaper, but Sync Labs can only fetch files from a public web
   *  address, so the clips have to be uploaded somewhere first. Only switch to
   *  this once the app is deployed and serving its own files publicly.
   */
  lipSync: {
    provider: (process.env.LIPSYNC_PROVIDER ?? 'fal') as 'fal' | 'sync',
    model: 'lipsync-2',
    falModel: 'fal-ai/sync-lipsync/v2',
    apiBase: 'https://api.sync.so/v2',
    /** $/second of output. lipsync-2 is ~$0.04, lipsync-2-pro ~$0.067. */
    pricePerSecondUsd: 0.04,
    maxRetries: 2,
    timeoutMs: 10 * 60 * 1000,
  },

  /** 8. STITCH - ffmpeg, runs locally and costs nothing */
  stitch: {
    /** Big caption words burned into the picture. */
    captionFontSize: 110,
    captionColor: '#F2C14E',
    captionStrokeColor: '#0A0806',
    endCardSeconds: 2.5,
    /** Set to false if you do not have the cha-ching sound file yet. */
    sfxEnabled: process.env.SFX_ENABLED !== 'false',
  },

  /** Run the whole machine with fake data and no API calls, for free.
   *  Leave this true until Jake has all his keys in. */
  mockMode: process.env.MOCK_MODE !== 'false',
} as const;

export type Config = typeof CONFIG;

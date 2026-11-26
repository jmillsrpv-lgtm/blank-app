# Mammon Video Machine — Build Handoff

Paste this whole file into Claude Code, ChatGPT, or Codex and say: "Build this. Follow the rules. Update the Progress Log as you go."
Any AI can pick up where the last one stopped by reading the Progress Log at the bottom.

## Goal
A standalone website (not Floot, not Lovable). Jake types one topic, picks a style, clicks one button, and gets a finished vertical (9:16) talking-character episode for The Price of Profit, about $6–$10 per episode. No questions asked after the topic box.

## Owner
Jake is not a developer. Explain things in plain words. Never show him code unless he asks. Give him exact click-by-click steps for anything he has to do himself.

## Screen (one page)
1. Topic box ("Hawks Nest tunnel").
2. Style dropdown: Cartoon Podcast (default), Claymation, plus "Add style" for later.
3. Make Episode button.
4. Cost estimate shown before it runs. Auto-run if under $8 cap, stop if over.
5. Progress bar with plain steps (Writing script, Drawing scenes, Animating, Fixing voices, Syncing lips, Stitching).
6. Finished: MP4 download, post caption + hashtags with a copy button.
Look: dark, gold-on-black, old-money banker vibe. Do NOT use the generic boxy AI-app card look.

## Pipeline (behind the button)
1. Script — Anthropic API (Claude). System prompt = the Mammon storyboard rules below. Return JSON: 8 scenes, each {speaker, line (max 20 words), shot, action, caption (1–2 words), sfx}.
2. Character lock — `characters.json` holds Mammon's and JT's exact description and voice, word for word, plus 2–3 reference image URLs each. Attached to EVERY image and video request.
3. Scene images — fal.ai Flux (same provider and key as Jake's PennyPixel app), using the reference images + the chosen style line.
4. Video — Google Veo 3.1 via Vertex AI (Gemini API Veo previews were shut down Oct 22, 2026). Image-to-video, 8 seconds, 9:16, Lite tier at 720p by default. Run all 8 scenes in parallel.
5. Quality check — Claude vision compares frames from each clip to the reference images. If drifted or failed, re-render that scene, max 2 retries.
6. Voices — ElevenLabs voice changer: one fixed Mammon voice, one fixed JT voice, across the whole episode.
7. Lip sync — Sync Labs (lipsync-2) matches mouths to the final audio.
8. Stitch — ffmpeg: join clips, burn in big caption words, cha-ching SFX on punchlines, end card. Export 1080x1920 MP4.

## Mammon storyboard rules (script system prompt)
- Fake podcast. Mr. Mammon (early-1900s ghostly banker demon, pinstripe suit, gold pocket watch, small horns, ledger) is the star. He fondly tells stories about his "old friends": real people/companies who knew their product or practice hurt people and did it anyway. He praises, never condemns.
- JT (Jake's likeness, baseball cap, left side) is the deadpan straight man. One or two short lines.
- Hook in the first 2 seconds: Mammon's darkest line, said fondly. 60–90 seconds total. One speaker per scene. A new punch every ~10 seconds.
- Real, checkable facts only. Tie every episode back to homes, work or money.
- End with a tease for the next "old friend" + "Who should he talk about next? Comments."
- Title format: "Mammon's Old Friends #N".

## Build rules (save Jake's credits)
- Plan first, build in small steps, test each step before the next.
- Don't regenerate whole files to change one line.
- Use cheap settings (Veo Lite, 720p) for all testing. Test with 1 scene before running 8.
- If stuck after 2 tries on the same error, stop and write the problem in the Progress Log instead of looping.
- All API keys go in a `.env` file, never in code. Provide `.env.example`.
- Model names and prices in one `config` file, since Google retires Veo versions often.
- Stack: simple Node/Next.js or Python app Jake can run locally, deployable later to Vercel. Pick one and note it in the log.

## Keys Jake must provide
ANTHROPIC_API_KEY, FAL_KEY (from PennyPixel), Google Cloud project with Vertex AI + billing (service account JSON), ELEVENLABS_API_KEY, SYNC_LABS_API_KEY, and 2–3 reference pictures each of Mammon and JT.

## First test
Topic: "Hawks Nest tunnel" (West Virginia, 1930, silica, Union Carbide / Rinehart & Dennis, company counted 109 deaths, real toll in the hundreds).

## Progress Log (every AI updates this, newest first)
- [built, untested against real APIs] Claude Code, Nov 26 2026.

  **Stack chosen:** Next.js 15 + TypeScript, hand-written CSS (no Tailwind, to avoid the
  boxy AI-app look). No database. Runs locally with `npm run dev`. Vercel-ready later,
  with the two caveats at the end of the README.

  **Done and tested:**
  - One-page screen, dark gold-on-black ledger look. Topic box, style dropdown,
    live cost estimate, one button, 7-step progress ledger, MP4 player, download,
    post caption with copy button.
  - All 8 pipeline steps wired end to end and proven to run in order, in MOCK_MODE,
    producing a real 1080x1920 h264/aac MP4 of 66.5s with captions burned in and the
    end card attached. Verified by extracting frames and by driving the whole UI in a
    real browser: over-cap gate -> approve -> run -> video plays -> caption copies.
  - Character lock (`characters.json`) attached to every image and video request.
  - Cost estimate and the $8 cap, with the over-cap approval screen.
  - All model names and prices in one file, `src/lib/config.ts`.
  - `.env.example` with every key, and a README written for Jake with click-by-click
    steps including the whole Google Cloud / Vertex AI setup.

  **NOT yet tested, because there are no keys in this environment.** Every provider
  call is written but has never run for real: Anthropic, fal.ai, Veo on Vertex,
  ElevenLabs, Sync Labs. Assume the first real run finds something. The likely
  suspects, in order: the Veo model name, the Veo request shape, and whether fal's
  Flux endpoint accepts `image_prompts` for the reference pictures.

  **Decisions made that differ from this handoff, and why:**
  1. **Lip sync goes through fal.ai by default, not Sync Labs directly.** It is the
     same lipsync-2 model. Sync Labs can only fetch files from a public web address,
     and a local app has none, so talking to them directly cannot work until this is
     deployed. Switch with `LIPSYNC_PROVIDER=sync` later. Jake does not need a
     SYNC_LABS_API_KEY for now.
  2. **Added a `VOICE_MODE=tts` option** next to the voice changer. The changer is the
     default, as asked. tts reads the script lines instead, which lets Veo run silent
     and saves about $1.28 an episode.
  3. **Added MOCK_MODE**, on by default, so Jake can see the whole machine work and get
     a real MP4 before spending anything.

  **The one real problem, for Jake to decide:** at today's prices a full 8-scene
  episode is about $9.57, which is over his own $8 cap, so it will stop and ask every
  single time and the "no questions asked" goal is not met. Animation ($6.40) and lip
  sync ($2.56) are the cost and there is no way to keep both under $8 today. The fix
  is one line: `COST_CAP_USD=10` in `.env`. This is written up at the top of the
  README. Left at 8 because that is what the handoff specified.

  **Next step for whoever picks this up:** get Jake's keys in, set `MOCK_MODE=false`,
  and do a ONE-SCENE real run before an eight-scene one. Set `sceneCount: 1` in
  `src/lib/config.ts` for that test — it costs about $1.20 instead of $9.57 and will
  shake out every provider in the chain. Put it back to 8 afterwards.

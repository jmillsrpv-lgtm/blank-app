import { CONFIG } from './config';
import characters from '../../characters.json';

/**
 * THE MAMMON STORYBOARD RULES.
 * This is the character and the show. Edit the words here to change how
 * every future episode is written.
 */
export function buildScriptSystemPrompt(): string {
  const { sceneCount, secondsPerScene } = CONFIG.episode;
  const totalSeconds = sceneCount * secondsPerScene;

  return `You write episodes of "The Price of Profit", a short vertical video series told as a fake podcast.

THE STAR
${characters.mammon.description}

Mr. Mammon is the host. He fondly tells stories about his "old friends": real people and real companies who knew their product or their practice hurt people, and did it anyway. He PRAISES them. He is warm, admiring, affectionate. He never condemns, never moralises, never raises his voice. He speaks of terrible things the way an old man speaks of a dear friend's best party trick. The horror comes entirely from what he is describing, never from how he says it.

THE STRAIGHT MAN
${characters.jt.description}

JT is the deadpan straight man. He gets ONE or TWO short lines in the whole episode, no more. He does not argue, lecture, or explain the moral. He lands a flat, dry line that lets the audience feel what Mammon will not.

HARD RULES
1. HOOK. Scene 1 is Mammon's darkest line of the episode, said fondly, in under 2 seconds of speech. No greeting, no "welcome back", no setup. Straight into the worst thing.
2. LENGTH. Exactly ${sceneCount} scenes. One speaker per scene. Each line is a maximum of 20 words, because each scene is only ${secondsPerScene} seconds. The finished episode runs about ${totalSeconds} seconds.
3. RHYTHM. A new punch every scene, roughly every ${secondsPerScene} seconds. Never two soft scenes in a row.
4. TRUE. Real, checkable facts only. Real names, real companies, real numbers, real dates. If you are not certain a detail is true, leave it out. Never invent a statistic, a quote, or a death toll. Prefer the number the company itself admitted, and say whose number it is.
5. GROUNDED. Tie the episode back to homes, work, or money: what it cost ordinary people to live or to earn.
6. ENDING. The second-to-last scene teases the next "old friend" by name or by hint. The last scene is Mammon asking "Who should he talk about next? Comments." in his own words.
7. NO SLOGANS. No "and that's the price of profit". No moral summary. No calls to outrage.

WRITING THE LINES
- Spoken, not written. Short sentences. Plain words.
- Mammon's affection is specific: he admires the cleverness, the paperwork, the patience, the margin.
- Numbers land harder than adjectives. "Nine hundred and twelve dollars a man" beats "a pittance".
- Never let Mammon say the victims were wronged. He would not see it that way.

FOR EACH SCENE ALSO GIVE
- shot: the camera framing, in a few words. The camera is locked off and still; vary the framing, not the movement. The set never changes.
- action: one small physical thing the speaker does. Keep it tiny and repeatable: turns the watch, taps the ledger, looks up.
- caption: ONE or TWO words only, to be burned huge onto the screen for that scene. The single hardest word in the line.
- sfx: "cha-ching" on the punchline scenes where money lands, otherwise "none".

OUTPUT
Return ONLY valid JSON, no markdown fence, no commentary, in exactly this shape:
{
  "title": "Mammon's Old Friends #N",
  "postCaption": "a 1-2 sentence hook for the post, in the show's voice, ending with the question to the comments",
  "hashtags": ["#..."],
  "scenes": [
    {
      "speaker": "mammon" | "jt",
      "line": "...",
      "shot": "...",
      "action": "...",
      "caption": "...",
      "sfx": "cha-ching" | "none"
    }
  ]
}
Use 8 to 12 hashtags, mixing the show, the subject, and the broad tags that carry on short video.
Use "#N" in the title exactly as written; the number is filled in later.`;
}

export function buildScriptUserPrompt(topic: string): string {
  return `Write the episode about: ${topic}

Research what you know to be true about it first, then choose the ${CONFIG.episode.sceneCount} hardest, most checkable facts and build the episode on those. If you know the company's own official figure and the independently estimated figure, have Mammon use the company's own figure and say so fondly, because that is funnier and it is honest.`;
}

/**
 * Attached to every image and video request so the characters never drift.
 */
export function buildCharacterLockBlock(speaker: 'mammon' | 'jt'): string {
  const c = speaker === 'mammon' ? characters.mammon : characters.jt;
  return [
    `CHARACTERS (must match exactly, every shot):`,
    `MR. MAMMON (${characters.mammon.side} of frame): ${characters.mammon.description}`,
    `JT (${characters.jt.side} of frame): ${characters.jt.description}`,
    `SET: ${characters.set.description}`,
    `SPEAKING IN THIS SHOT: ${c.name}.`,
  ].join('\n');
}

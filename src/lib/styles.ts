/**
 * EPISODE STYLES. The dropdown on the screen is built from this list.
 * To add a style later, copy a block and change the words. The `look` line
 * is pasted into every image and video request for that episode.
 */

export type EpisodeStyle = {
  id: string;
  label: string;
  look: string;
};

export const STYLES: EpisodeStyle[] = [
  {
    id: 'cartoon-podcast',
    label: 'Cartoon Podcast',
    look:
      'Hand-drawn 2D animated cartoon in the style of a prestige adult animation series. ' +
      'Bold confident ink outlines, flat rich colour with painted shadow, slight paper grain. ' +
      'Warm gold and deep green-black palette, heavy film noir lighting. Expressive but not goofy. ' +
      'Smooth limited animation, the camera locked off and still.',
  },
  {
    id: 'claymation',
    label: 'Claymation',
    look:
      'Stop-motion claymation in the style of a handmade studio short. Visible fingerprints and ' +
      'thumb marks in the plasticine, slight surface lumps, real miniature set with practical ' +
      'lighting and soft shadows. Tiny fabric costumes with visible stitching. Faint frame-to-frame ' +
      'jitter typical of stop motion. Warm gold and deep green-black palette, camera locked off.',
  },
];

export const DEFAULT_STYLE_ID = 'cartoon-podcast';

export function getStyle(id: string): EpisodeStyle {
  return STYLES.find((s) => s.id === id) ?? STYLES[0];
}

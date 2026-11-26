import type { Script } from './types';

/**
 * TEST DATA, used when MOCK_MODE is on.
 *
 * With mock mode on, the whole machine runs end to end, builds a real MP4
 * with ffmpeg, and costs nothing. This is how you check the screen, the
 * progress bar, the captions and the download before you spend a penny.
 *
 * The script below is the real Hawks Nest Tunnel first test, written out by
 * hand. Every fact in it is checkable.
 */
export const MOCK_SCRIPT: Script = {
  title: "Mammon's Old Friends #N",
  postCaption:
    'They drilled through a mountain of pure silica without water, and counted the dead by the head. Who should he talk about next? Comments.',
  hashtags: [
    '#thepriceofprofit',
    '#hawksnest',
    '#westvirginia',
    '#history',
    '#truecrime',
    '#unioncarbide',
    '#workersrights',
    '#darkhistory',
    '#fyp',
    '#storytime',
  ],
  scenes: [
    {
      speaker: 'mammon',
      line: 'They drilled dry. The dust hung so thick a man could not see his own hands.',
      shot: 'tight on Mammon, head on',
      action: 'smiles fondly at the memory',
      caption: 'DRY',
      sfx: 'none',
    },
    {
      speaker: 'mammon',
      line: 'Hawks Nest, West Virginia, 1930. Three miles of mountain. Union Carbide wanted the power.',
      shot: 'medium two-shot',
      action: 'opens the ledger',
      caption: 'POWER',
      sfx: 'none',
    },
    {
      speaker: 'mammon',
      line: 'Water would have settled that dust. Water was slow. Slow costs money.',
      shot: 'medium on Mammon',
      action: 'turns the pocket watch over',
      caption: 'SLOW',
      sfx: 'cha-ching',
    },
    {
      speaker: 'jt',
      line: 'So they just let them breathe it.',
      shot: 'tight on JT',
      action: 'looks straight ahead, flat',
      caption: 'BREATHE',
      sfx: 'none',
    },
    {
      speaker: 'mammon',
      line: 'Silica shreds a lung. Some died within months. The company counted one hundred and nine.',
      shot: 'medium on Mammon',
      action: 'taps a column in the ledger',
      caption: '109',
      sfx: 'none',
    },
    {
      speaker: 'mammon',
      line: 'Congress later heard of hundreds more. The settlements were paid out by the head.',
      shot: 'wide two-shot',
      action: 'closes the ledger gently',
      caption: 'BY THE HEAD',
      sfx: 'cha-ching',
    },
    {
      speaker: 'mammon',
      line: 'Next time, a friend who sold asbestos and kept the chest x-rays in a drawer.',
      shot: 'tight on Mammon',
      action: 'leans toward the microphone',
      caption: 'DRAWER',
      sfx: 'none',
    },
    {
      speaker: 'mammon',
      line: 'Who should I talk about next? Comments.',
      shot: 'medium two-shot',
      action: 'folds his hands and waits',
      caption: 'COMMENTS',
      sfx: 'none',
    },
  ],
};

/** Stand-in colours so mock scenes look different from each other. */
export const MOCK_SCENE_COLORS = [
  '#1b1410', '#14191b', '#1b1a10', '#101b16',
  '#1b1013', '#15101b', '#1b1710', '#101418',
];

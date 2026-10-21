// Section boundaries measured from the REAL narration (voice_build offsets → marker sentences).
export const SEC = {
  cold: [0, 95.0],
  stakes: [94.77, 157.03],
  twoStatements: [157.03, 293.32],
  counting: [293.32, 523.51],
  levers: [523.51, 950.47],
  barrels: [950.47, 1030.18],
  meaning: [1030.18, 1172.07],
} as const;

// Lever identities from the actual narration (marker + first named sentence):
export const LEVERS = [
  { n: 1, t: 536.18, name: "LAW & DECLARATION" },
  { n: 2, t: 586.72, name: "WEAPONS" },
  { n: 3, t: 661.78, name: "MINES" },
  { n: 4, t: 741.42, name: "INSURANCE" },
  { n: 5, t: 794.5, name: "PERMITS & FEES" },
  { n: 6, t: 857.45, name: "VISIBILITY" },
  { n: 7, t: 885.19, name: "NAVAL FACILITATION" },
];

export const FPS = 30;
export const TOTAL_FRAMES = Math.round(SEC.meaning[1] * FPS); // 35162

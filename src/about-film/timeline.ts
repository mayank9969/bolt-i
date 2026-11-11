export const DURATION = 40.0; // seconds of animation

export interface StageWindow {
  key: "scene" | "s1" | "s2" | "s3" | "s4";
  label: string;
  /** center time of the stage, used for progress-bar markers */
  mark: number;
}

export const STAGES: StageWindow[] = [
  { key: "scene", label: "The Present", mark: 1.4 },
  { key: "s1", label: "Memory", mark: 11.8 },
  { key: "s2", label: "Elsewhere", mark: 17.8 },
  { key: "s3", label: "Her", mark: 23.0 },
  { key: "s4", label: "Too Much", mark: 27.6 },
  { key: "scene", label: "Gone", mark: 37.0 },
];

/**
 * Voiceover script — record these lines (girl or boy voice) and save the
 * result as public/voiceover.mp3; the film detects and syncs it automatically.
 * Captions double as subtitles until then.
 */
export interface Caption {
  at: number;
  until: number;
  text: string;
}

export const CAPTIONS: Caption[] = [
  { at: 2.6, until: 5.8, text: "Some evenings hold everything you will ever need." },
  { at: 7.2, until: 10.2, text: "He was here. Almost." },
  { at: 11.6, until: 15.2, text: "But his mind had already left the bench — chasing a somewhere that was never real." },
  { at: 16.2, until: 20.2, text: "Out here, the light was real. In there, it was only louder." },
  { at: 21.2, until: 25.2, text: "She stayed. Close enough to touch… too far to reach." },
  { at: 26.2, until: 29.8, text: "Until the noise inside got so bright, he couldn't hear the quiet holding him." },
  { at: 30.8, until: 34.6, text: "She said his name. He smiled at somewhere else." },
  { at: 35.6, until: 38.8, text: "And the moment passed — the way they always do. Without him." },
];

export const QUOTE = {
  line1: "We live more in our minds",
  line2: "than in our moments —",
  line3: "always somewhere else, never here.",
  kicker: "…so were you, just now.",
  appearsAt: 39.0,
};

/** Per-stage visibility windows (fade-in start/end, fade-out start/end). */
export const WINDOWS: Record<StageWindow["key"], Array<[number, number, number, number]>> = {
  scene: [
    [-1, -1, 7.6, 8.6], // opening reality
    [30.2, 31.4, 999, 999], // return to reality
  ],
  s1: [[8.0, 9.2, 15.0, 16.2]],
  s2: [[15.4, 16.6, 20.2, 21.4]],
  s3: [[20.8, 22.0, 25.2, 26.4]],
  s4: [[25.8, 27.0, 29.6, 30.8]],
};

export function stageWeight(key: StageWindow["key"], t: number): number {
  let w = 0;
  for (const [a, b, c, d] of WINDOWS[key]) {
    const fadeIn = smooth(a, b, t);
    const fadeOut = 1 - smooth(c, d, t);
    w = Math.max(w, fadeIn * fadeOut);
  }
  return w;
}

export function dreamWeight(t: number): number {
  return Math.min(1, stageWeight("s1", t) + stageWeight("s2", t) + stageWeight("s3", t) + stageWeight("s4", t));
}

function smooth(a: number, b: number, x: number): number {
  if (b <= a) return x >= b ? 1 : 0;
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

/* ------------------------------------------------------------------ */
/* Reference metadata for the storyboard section below the film        */
/* ------------------------------------------------------------------ */

export interface Reference {
  index: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  motion: string;
  palette: string[];
  vector: number[];
}

export const VECTOR_AXES = ["floral", "human", "colour", "soft focus", "surreal", "overwhelm"];

export const REFERENCES: Reference[] = [
  {
    index: 1,
    image: "/about-film/stage1.jpg",
    title: "Flowers Lost in a Memory",
    subtitle: "Movement I — the first rush",
    description:
      "The present dissolves into a field of overlapping blooms, edges drifting like something half-remembered. The camera drifts through petals and pulls one flower briefly into focus.",
    motion: "Slow petal drift · gentle focus pull · warm haze",
    palette: ["#E90096", "#FF9A00", "#A982FF", "#179FE8", "#1E1034"],
    vector: [0.98, 0.0, 0.96, 0.92, 0.72, 0.55],
  },
  {
    index: 2,
    image: "/about-film/stage2.jpg",
    title: "The Flower Between Worlds",
    subtitle: "Movement II — the private feeling",
    description:
      "One bloom spans three worlds: liquid colour, grey ordinary, and a starless dark. His inner feeling ignites at the flower's heart, brighter than the world around it, while the panel seams slowly soften.",
    motion: "Neon core awakening · drifting stars · dissolving seams",
    palette: ["#FF8A00", "#15F02A", "#1428FF", "#D8D8D8", "#09090D"],
    vector: [0.82, 0.0, 0.99, 0.3, 0.98, 0.8],
  },
  {
    index: 3,
    image: "/about-film/stage3.jpg",
    title: "The Beloved, Idealised",
    subtitle: "Movement III — the imagined her",
    description:
      "She appears as he keeps her: quiet, unreadable, half veiled by an impossible bloom of cyan and magenta. He fills the parts of her he never knew with beauty.",
    motion: "Hair and petals breathing · blossoms unfolding across one side",
    palette: ["#20D1DA", "#163BF2", "#E7139E", "#F4F5FA", "#28103E"],
    vector: [0.88, 0.92, 0.95, 0.15, 0.94, 0.78],
  },
  {
    index: 4,
    image: "/about-film/stage4.jpg",
    title: "Feeling Becomes Overwhelming",
    subtitle: "Movement IV — the flood",
    description:
      "Thought crowds out sight. The portrait breaks into restless strokes and watchful reflections — too many minds running at once — then, slowly, begins to settle.",
    motion: "Brush-stroke ripple · floating glances settling into stillness",
    palette: ["#14D9ED", "#FFDE22", "#F03429", "#E533BE", "#141035"],
    vector: [0.12, 0.88, 1.0, 0.15, 0.99, 1.0],
  },
];

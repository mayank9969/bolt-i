import { fbm3, noise3 } from "./noise";

type RGB = [number, number, number];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

// pastel, iridescent palette lifted from the reference
const PAL: { at: number; c: RGB }[] = [
  { at: 0.0, c: [20, 240, 255] },
  { at: 0.2, c: [140, 255, 250] },
  { at: 0.38, c: [255, 248, 245] },
  { at: 0.55, c: [255, 110, 190] },
  { at: 0.75, c: [210, 140, 255] },
  { at: 1.0, c: [255, 150, 70] },
];

function pal(v: number): RGB {
  v = clamp01(v);
  for (let i = 1; i < PAL.length; i++) {
    if (v <= PAL[i].at) {
      const a = PAL[i - 1],
        b = PAL[i];
      return mix(a.c, b.c, (v - a.at) / (b.at - a.at));
    }
  }
  return PAL[PAL.length - 1].c;
}

/**
 * Paint a polar iris. `kind` 0 = full colour disc, 1 = translucent streak overlay
 * (rotates the opposite way to create a living shimmer).
 */
export function makeIrisTexture(size: number, kind: 0 | 1): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const c = size / 2;
  const seed = kind === 0 ? 0 : 41;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5 - c) / c;
      const v = (y + 0.5 - c) / c;
      const r = Math.hypot(u, v);
      const idx = (y * size + x) * 4;
      if (r > 1) continue;

      const th = Math.atan2(v, u);
      const ct = Math.cos(th),
        st = Math.sin(th);

      // ragged, spiky outer edge
      const edge =
        0.92 +
        0.07 * (noise3(ct * 7 + seed, st * 7, 1) - 0.5) * 2 +
        0.045 * (noise3(ct * 70 + seed, st * 70, 9) - 0.5) * 2 +
        0.02 * (noise3(ct * 160, st * 160, 3) - 0.5) * 2;
      const edgeA = clamp01((edge - r) / 0.012);
      if (edgeA <= 0) continue;

      // fine radial fibres
      const s1 = noise3(ct * 55 + seed, st * 55, r * 2.5);
      const s2 = noise3(ct * 140 + seed, st * 140, r * 1.2 + 5);

      if (kind === 0) {
        // swirling flow
        const warp = (noise3(ct * 0.9 + 11, st * 0.9, r * 2) - 0.5) * 1.3;
        const phi = th - 3.3 * Math.pow(r, 1.25) + warp;
        let val = fbm3(Math.cos(phi) * 1.35, Math.sin(phi) * 1.35, r * 2.4, 3);
        val = clamp01((val - 0.5) * 2.0 + 0.5);
        let col = pal(val);

        const bright = (1.08 + 0.35 * s1) * (0.95 + 0.2 * s2);
        col = [col[0] * bright, col[1] * bright, col[2] * bright];

        // warm collarette around the pupil
        const eo =
          0.47 +
          0.1 * (noise3(ct * 6, st * 6, 2) - 0.5) * 2 +
          0.07 * (noise3(ct * 38, st * 38, 4) - 0.5) * 2;
        const om = smooth(eo + 0.13, eo - 0.08, r);
        let orange = mix([255, 182, 118], [205, 86, 34], smooth(0.5, 0.14, r));
        orange = mix(orange, [96, 34, 16], smooth(0.22, 0.1, r));
        const ob = 0.7 + 0.6 * s1;
        orange = [orange[0] * ob, orange[1] * ob, orange[2] * ob];
        const fin = mix(col, orange, om * 0.32);

        d[idx] = Math.min(255, fin[0]);
        d[idx + 1] = Math.min(255, fin[1]);
        d[idx + 2] = Math.min(255, fin[2]);
        d[idx + 3] = edgeA * 255;
      } else {
        const sA = noise3(ct * 36 + seed, st * 36, r * 1.1 + 30);
        const a = clamp01((sA - 0.52) * 3.2) * smooth(0.3, 0.55, r) * (0.7 + 0.6 * s2);
        const warp = fbm3(ct * 1.1 + 3, st * 1.1, r * 2.2 + 7, 2);
        const col = mix(pal(warp * 1.2), [255, 255, 255], 0.55);
        d[idx] = col[0];
        d[idx + 1] = col[1];
        d[idx + 2] = col[2];
        d[idx + 3] = Math.min(1, a) * edgeA * 150;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

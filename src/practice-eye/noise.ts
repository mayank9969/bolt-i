// Tiny seeded 3D value-noise helpers used to paint the iris texture.

const P = new Uint8Array(512);
(() => {
  const base = Array.from({ length: 256 }, (_, i) => i);
  let s = 1337;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 512; i++) P[i] = base[i & 255];
})();

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const h3 = (x: number, y: number, z: number) => P[P[P[x & 255] + (y & 255)] + (z & 255)] / 255;

export function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  const xf = x - xi,
    yf = y - yi,
    zf = z - zi;
  const u = fade(xf),
    v = fade(yf),
    w = fade(zf);
  const c000 = h3(xi, yi, zi),
    c100 = h3(xi + 1, yi, zi),
    c010 = h3(xi, yi + 1, zi),
    c110 = h3(xi + 1, yi + 1, zi),
    c001 = h3(xi, yi, zi + 1),
    c101 = h3(xi + 1, yi, zi + 1),
    c011 = h3(xi, yi + 1, zi + 1),
    c111 = h3(xi + 1, yi + 1, zi + 1);
  return lerp(
    lerp(lerp(c000, c100, u), lerp(c010, c110, u), v),
    lerp(lerp(c001, c101, u), lerp(c011, c111, u), v),
    w,
  );
}

export function fbm3(x: number, y: number, z: number, oct = 3): number {
  let amp = 0.5,
    f = 1,
    sum = 0,
    norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * noise3(x * f, y * f, z * f);
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return sum / norm;
}

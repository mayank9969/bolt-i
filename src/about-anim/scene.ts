/* ------------------------------------------------------------------
   SELF-REFLECTION — procedural 2D/3D hybrid animation
   Logical stage 900 x 1600, rendered at device resolution, 60fps motion
   with 24fps "boiling" hand-drawn line jitter (classic anime trick).
------------------------------------------------------------------- */

export const W = 900;
export const H = 1600;
export const DURATION = 10;

/* Timeline (seconds) — shared with audio */
export const T = {
  impact: 3.6,
  calmStart: 5.2,
  calmEnd: 7.4,
  mergeStart: 6.9,
  mergeEnd: 8.1,
};
export const BEATS_PRE = [0.4, 1.15, 1.8, 2.35, 2.8, 3.15, 3.4];
export const BEATS_POST = [4.9, 5.9, 6.9];

const TAU = Math.PI * 2;
type RGB = [number, number, number];

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const eio = (t: number) => {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const eob = (t: number) => {
  t = clamp(t);
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
function hash(a: number, b = 0) {
  const s = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
}
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SERIF = '"Fraunces Variable", Fraunces, Georgia, serif';

/* ------------------------------ DATA ------------------------------ */
const R = mulberry(11);

/* chaotic scribble strands (the noise in his head) */
const NCH = 340;
const M = 30;
interface Strand {
  xs: Float32Array;
  ys: Float32Array;
  d: number;
  delay: number;
  trimR: number;
  bin: number;
}
const chaos: Strand[] = Array.from({ length: NCH }, () => {
  const xs = new Float32Array(M);
  const ys = new Float32Array(M);
  let x = R() * (W + 200) - 100;
  let y = R() * (H + 200) - 100;
  let a = R() * TAU;
  for (let j = 0; j < M; j++) {
    xs[j] = x;
    ys[j] = y;
    a += (R() - 0.5) * (R() < 0.18 ? 4.6 : 1.8);
    const step = 40 + R() * 110;
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    if (x < -160 || x > W + 160) a = Math.PI - a;
    if (y < -160 || y > H + 160) a = -a;
  }
  const d = R();
  return { xs, ys, d, delay: R() * 1.7, trimR: R(), bin: d < 0.3 ? 0 : d < 0.6 ? 1 : d < 0.88 ? 2 : 3 };
});
const BIN_W = [0.8, 1.25, 1.9, 4.2];
const BIN_A = [0.85, 0.9, 0.92, 0.5];

/* 3D scribble rings tangled around the head */
const rings = Array.from({ length: 64 }, () => ({
  r: 90 + R() * 120,
  ax: R() * TAU,
  ay: R() * TAU,
  az: R() * TAU,
  sx: (R() - 0.5) * 1.8,
  sy: (R() - 0.5) * 1.8,
  sz: (R() - 0.5) * 1.8,
  wob: R() * TAU,
  sq: 0.7 + R() * 0.5,
}));

/* elegant flowing threads (after clarity) */
const flows = Array.from({ length: 46 }, () => ({
  a: (R() - 0.5) * 2.6,
  L: 520 + R() * 900,
  amp: 20 + R() * 70,
  ph: R() * TAU,
  k: 1.2 + R() * 2.6,
  w: 0.8 + R() * 1.1,
  delay: R() * 0.5,
  ox: (R() - 0.5) * 60,
}));

/* coils around the torso */
const coils = Array.from({ length: 18 }, (_, i) => ({
  y: (R() - 0.5) * 170 + i * 2,
  k: 2 + R() * 3,
  ph: R() * TAU,
  span: 270 + R() * 140,
  w: 0.8 + R() * 1.3,
  loopR: 30 + R() * 80,
  delay: R() * 0.4,
}));

/* intrusive thoughts floating around */
const WORDS = ['why?', 'again?', 'not enough', 'too late', 'what if…', 'me?', 'wrong?', "should've", "why can't I", 'failed', '?', '?', '?', '?', '?', '?'];
const thoughts = Array.from({ length: 30 }, (_, i) => {
  const q = i % 2 === 0 || i > 20;
  const word = q && R() < 0.6 ? '?' : WORDS[Math.floor(R() * 10)];
  return {
    word,
    x: 60 + R() * (W - 120),
    y: 90 + R() * 900,
    d: R(),
    size: word === '?' ? 90 + R() * 110 : 26 + R() * 30,
    t0: 0.5 + R() * 2.7,
    life: 1.0 + R() * 1.2,
    rot: (R() - 0.5) * 0.6,
  };
});

/* silhouette */
function catmull(pts: number[][], seg: number) {
  const out: number[][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < seg; j++) {
      const u = j / seg;
      const u2 = u * u;
      const u3 = u2 * u;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const RIGHT = [
  [0, -270],
  [62, -254],
  [97, -190],
  [93, -110],
  [60, -58],
  [40, -20],
  [46, 10],
  [102, 36],
  [188, 70],
  [238, 135],
  [254, 270],
  [259, 560],
  [266, 1100],
];
const BASE = [
  ...catmull(RIGHT, 10),
  ...catmull(
    RIGHT.map(([x, y]) => [-x, y]).reverse(),
    10,
  ),
];
const NP = BASE.length;
const HEAD_LOCAL = { x: 0, y: -165 };
const PIVOT_Y = -10;

const bufX = new Float32Array(NP);
const bufY = new Float32Array(NP);
function shapePts(rot: number, droop: number) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let i = 0; i < NP; i++) {
    const [x, y] = BASE[i];
    const w = sm(0, 1, clamp((10 - y) / 60));
    if (w <= 0) {
      bufX[i] = x;
      bufY[i] = y;
      continue;
    }
    const a = rot * w;
    const ca = rot === 0 ? 1 : Math.cos(a);
    const sa = rot === 0 ? 0 : Math.sin(a);
    void c;
    void s;
    const dx = x;
    const dy = y - PIVOT_Y;
    bufX[i] = dx * ca - dy * sa;
    bufY[i] = dx * sa + dy * ca + PIVOT_Y + droop * w;
  }
}
function headWorld(X: number, Y: number, s: number, rot: number, droop: number) {
  const dx = HEAD_LOCAL.x;
  const dy = HEAD_LOCAL.y - PIVOT_Y;
  const ca = Math.cos(rot);
  const sa = Math.sin(rot);
  const lx = dx * ca - dy * sa;
  const ly = dx * sa + dy * ca + PIVOT_Y + droop;
  return { x: X + lx * s, y: Y + ly * s };
}

/* grain texture */
let grain: HTMLCanvasElement | null = null;
function getGrain() {
  if (grain) return grain;
  grain = document.createElement('canvas');
  grain.width = grain.height = 256;
  const g = grain.getContext('2d')!;
  const id = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = Math.random() < 0.5 ? 0 : 255;
    id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v;
    id.data[i * 4 + 3] = Math.random() * 46;
  }
  g.putImageData(id, 0, 0);
  return grain;
}

/* ------------------------------ STATE ------------------------------ */
interface S {
  t: number;
  boil: number;
  inv: boolean;
  ink: RGB;
  paper: RGB;
  calm: number;
  anger: number;
  bgMix: number;
  cz: number;
  camx: number;
  I: (a: number) => string;
  P: (a: number) => string;
}
const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function beatAmt(t: number) {
  let v = 0;
  for (const b of BEATS_PRE) {
    if (t - b >= 0) v += Math.exp(-(t - b) * 14);
    if (t - b - 0.16 >= 0) v += 0.6 * Math.exp(-(t - b - 0.16) * 14);
  }
  for (const b of BEATS_POST) {
    if (t - b >= 0) v += 0.45 * Math.exp(-(t - b) * 9);
    if (t - b - 0.2 >= 0) v += 0.25 * Math.exp(-(t - b - 0.2) * 9);
  }
  return Math.min(v, 1.4);
}

/* ------------------------------ DRAWERS ------------------------------ */
function drawChaos(ctx: CanvasRenderingContext2D, S: S, bins: number[]) {
  const { t, boil } = S;
  const amp = 1.2 + 6 * S.anger;
  for (const b of bins) {
    ctx.beginPath();
    for (let i = 0; i < NCH; i++) {
      const st = chaos[i];
      if (st.bin !== b) continue;
      const rev = clamp((t - st.delay) / 0.9);
      if (rev <= 0) continue;
      const trim = clamp((S.calm - 0.55 * st.trimR) / 0.45);
      if (trim >= 1) continue;
      const zf = 1 + (S.cz - 1) * (0.3 + 1.3 * st.d);
      const par = S.camx * (st.d - 0.3) * 1.2;
      const s0 = trim * (M - 1);
      const s1 = rev * (M - 1);
      if (s1 - s0 < 0.01) continue;
      const params: number[] = [s0];
      for (let k = Math.floor(s0) + 1; k < s1; k++) params.push(k);
      params.push(s1);
      for (let q = 0; q < params.length; q++) {
        const f = params[q];
        const i0 = Math.min(Math.floor(f), M - 2);
        const fr = f - i0;
        const x = lerp(st.xs[i0], st.xs[i0 + 1], fr);
        const y = lerp(st.ys[i0], st.ys[i0 + 1], fr);
        const jx = (hash(i * 31 + i0, boil) - 0.5) * amp * (0.4 + st.d);
        const jy = (hash(i * 17 + i0, boil + 91) - 0.5) * amp * (0.4 + st.d);
        const dr = Math.sin(t * 0.9 + i * 0.7 + i0 * 0.5) * 5 * (1 + S.anger * 2);
        const X = W / 2 + (x - W / 2) * zf + jx + dr + par;
        const Y = 620 + (y - 620) * zf + jy + dr * 0.6;
        if (q === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      }
    }
    ctx.lineWidth = BIN_W[b];
    ctx.strokeStyle = S.I(BIN_A[b]);
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

function drawThoughts(ctx: CanvasRenderingContext2D, S: S) {
  const { t, boil } = S;
  if (t > T.impact) return;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < thoughts.length; i++) {
    const th = thoughts[i];
    const p = (t - th.t0) / th.life;
    if (p < 0 || p > 1) continue;
    const flick = hash(i, boil) > 0.12 ? 1 : 0.45;
    const a = Math.pow(Math.sin(p * Math.PI), 0.6) * 0.9 * flick;
    const zf = 1 + (S.cz - 1) * (0.3 + 1.3 * th.d);
    const x = W / 2 + (th.x - W / 2) * zf + S.camx * (th.d - 0.3) * 1.2 + (hash(i, boil + 3) - 0.5) * 3;
    const y = 620 + (th.y - 620) * zf - p * 40 + (hash(i, boil + 5) - 0.5) * 3;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(th.rot + Math.sin(t * 3 + i) * 0.04);
    ctx.font = `italic 600 ${th.size * (0.8 + th.d * 0.6)}px ${SERIF}`;
    ctx.fillStyle = S.I(a);
    ctx.fillText(th.word, 0, 0);
    ctx.restore();
  }
}

function drawFigure(
  ctx: CanvasRenderingContext2D,
  S: S,
  o: { X: number; Y: number; s: number; rot: number; droop: number; ghost: boolean; alpha: number; seed: number; breath: number },
) {
  if (o.alpha <= 0.002) return;
  const { boil } = S;
  shapePts(o.rot, o.droop);
  ctx.save();
  ctx.globalAlpha = o.alpha;
  ctx.translate(o.X, o.Y);
  ctx.scale(o.s, o.s * (1 + o.breath));

  const path = () => {
    ctx.beginPath();
    for (let i = 0; i < NP; i++) {
      const x = bufX[i] + (hash(i, boil + o.seed) - 0.5) * 2.4;
      const y = bufY[i] + (hash(i, boil + o.seed + 50) - 0.5) * 2.4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  if (!o.ghost) {
    path();
    ctx.fillStyle = S.I(1);
    ctx.fill();
  } else {
    path();
    ctx.fillStyle = S.P(0.94);
    ctx.fill();
  }

  /* hatch texture inside */
  ctx.save();
  path();
  ctx.clip();
  ctx.beginPath();
  const nh = o.ghost ? 46 : 70;
  for (let k = 0; k < nh; k++) {
    const x = (hash(k, o.seed + 7) - 0.5) * 540 + (hash(k, boil + 9) - 0.5) * 6;
    const y0 = -200 + hash(k, o.seed + 8) * 1000;
    const len = 100 + hash(k, o.seed + 9) * 260;
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + (hash(k, boil + 2) - 0.5) * 22, y0 + len / 2, x + (hash(k, o.seed + 3) - 0.5) * 40, y0 + len);
  }
  ctx.lineWidth = o.ghost ? 1.3 : 1.1;
  ctx.strokeStyle = o.ghost ? S.I(0.22) : S.P(0.11);
  ctx.stroke();
  ctx.restore();

  /* edge: fuzzy scribbled contour */
  ctx.beginPath();
  const nf = o.ghost ? 90 : 240;
  for (let k = 0; k < nf; k++) {
    const idx = 1 + Math.floor(hash(k, boil + o.seed + 21) * (NP - 2));
    const px = bufX[idx];
    const py = bufY[idx];
    let nx = bufY[idx + 1] - bufY[idx - 1];
    let ny = -(bufX[idx + 1] - bufX[idx - 1]);
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    if ((px - 0) * nx + (py - 250) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const inn = 6 + hash(k, o.seed + 1) * 16;
    const out = 4 + hash(k, o.seed + 2) * 30;
    const sl = (hash(k, boil + 5) - 0.5) * 12;
    ctx.moveTo(px - nx * inn + ny * sl, py - ny * inn - nx * sl);
    ctx.lineTo(px + nx * out, py + ny * out);
  }
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = S.I(o.ghost ? 0.55 : 0.95);
  ctx.stroke();

  /* ghost outline strokes */
  if (o.ghost) {
    for (let p = 0; p < 3; p++) {
      ctx.beginPath();
      for (let i = 0; i < NP; i++) {
        const x = bufX[i] + (hash(i, boil + p * 13 + 70) - 0.5) * 5;
        const y = bufY[i] + (hash(i, boil + p * 13 + 71) - 0.5) * 5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.lineWidth = p === 0 ? 2.6 : 1.4;
      ctx.strokeStyle = S.I(p === 0 ? 0.95 : 0.6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawTangle(ctx: CanvasRenderingContext2D, S: S, cx: number, cy: number, s: number) {
  const { t, boil } = S;
  const amt = sm(0.5, 2.2, t);
  const alpha = amt * (1 - sm(5.6, 7.2, t));
  if (alpha < 0.01) return;
  const expand = 1 + 3.2 * eio(sm(5.4, 7.4, t));
  const tight = 1 - 0.22 * S.anger;
  const n = Math.floor(rings.length * amt);
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const r = rings[k];
    const ax = r.ax + r.sx * t;
    const ay = r.ay + r.sy * t;
    const az = r.az + r.sz * t;
    const cax = Math.cos(ax), sax = Math.sin(ax);
    const cay = Math.cos(ay), say = Math.sin(ay);
    const caz = Math.cos(az), saz = Math.sin(az);
    const steps = 44;
    for (let j = 0; j <= steps; j++) {
      const th = (j / steps) * TAU;
      const rr = r.r * tight * expand * s * (1 + 0.12 * Math.sin(th * 3 + r.wob + t * 2) + 0.08 * Math.sin(th * 5 - r.wob + t * 1.3));
      let x = Math.cos(th) * rr;
      let y = Math.sin(th) * rr * r.sq;
      let z = 0;
      // rotate X
      let y1 = y * cax - z * sax;
      let z1 = y * sax + z * cax;
      y = y1;
      z = z1;
      // rotate Y
      const x2 = x * cay + z * say;
      const z2 = -x * say + z * cay;
      x = x2;
      z = z2;
      // rotate Z
      const x3 = x * caz - y * saz;
      y1 = x * saz + y * caz;
      x = x3;
      y = y1;
      const f = 560 / (560 + z);
      const px = cx + x * f + (hash(k * 50 + j, boil) - 0.5) * 3;
      const py = cy + y * f * 1.1 + (hash(k * 50 + j, boil + 4) - 0.5) * 3;
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  }
  ctx.lineWidth = 1.35;
  ctx.strokeStyle = S.I(0.8 * alpha);
  ctx.stroke();
}

function drawFlows(ctx: CanvasRenderingContext2D, S: S, hx: number, hy: number) {
  const { t } = S;
  const g = sm(5.6, 8.6, t);
  if (g <= 0) return;
  ctx.beginPath();
  for (const f of flows) {
    const rev = clamp((g - f.delay * 0.6) / 0.6);
    if (rev <= 0) continue;
    const n = 50;
    for (let j = 0; j <= n * rev; j++) {
      const u = j / n;
      const wv = Math.sin(u * f.k * Math.PI + f.ph + t * 0.9) * f.amp * u;
      const x = hx + f.ox * (1 - u) + Math.sin(f.a) * f.L * Math.pow(u, 1.6) + wv;
      const y = hy - 40 - f.L * Math.pow(u, 0.8) * 0.9 + wv * 0.3 + Math.sin(t * 0.6 + f.ph) * 4 * u;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = S.I(0.85);
  ctx.stroke();
}

function drawCoils(ctx: CanvasRenderingContext2D, S: S, cx: number, cy: number, s: number) {
  const { t } = S;
  const g = sm(7.0, 9.2, t);
  if (g <= 0) return;
  ctx.beginPath();
  for (const c of coils) {
    const rev = clamp((g - c.delay) / 0.6);
    if (rev <= 0) continue;
    const n = 110;
    for (let j = 0; j <= n * rev; j++) {
      const u = j / n;
      const ang = u * TAU * c.k + c.ph + t * 0.5;
      const env = Math.sin(u * Math.PI);
      const x = cx + (u - 0.5) * 2 * c.span * s + c.loopR * Math.cos(ang) * env * s;
      const y = cy + c.y * s + c.loopR * 0.9 * Math.sin(ang) * env * s + Math.sin(u * 7 + t * 1.2 + c.ph) * 6;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = 'rgba(176,158,128,0.8)';
  ctx.stroke();
}

function drawLink(ctx: CanvasRenderingContext2D, S: S, a: { x: number; y: number }, b: { x: number; y: number }, amt: number) {
  if (amt <= 0.01) return;
  const { t, boil } = S;
  const calmK = 1 - 0.88 * S.calm;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  ctx.beginPath();
  for (let k = 0; k < 14; k++) {
    const ph = hash(k, 3) * TAU;
    const am = (30 + hash(k, 4) * 90) * calmK;
    const n = 26;
    for (let j = 0; j <= n * amt; j++) {
      const u = j / n;
      const w = Math.sin(u * Math.PI) * (Math.sin(u * 5 + ph + t * 3) * am + (hash(k * 40 + j, boil) - 0.5) * 8 * calmK);
      const x = lerp(a.x, b.x, u) + px * w;
      const y = lerp(a.y, b.y, u) + py * w;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = S.I(0.8);
  ctx.stroke();
}

function drawOrb(ctx: CanvasRenderingContext2D, S: S, x: number, y: number, r: number, a: number) {
  if (a <= 0.01) return;
  const { t } = S;
  const pulse = 1 + 0.08 * Math.sin(t * 4) + beatAmt(t) * 0.08;
  const rr = r * pulse;
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, rr * 3.2);
  g.addColorStop(0, `rgba(255,248,226,${0.95 * a})`);
  g.addColorStop(0.25, `rgba(255,214,140,${0.65 * a})`);
  g.addColorStop(1, 'rgba(255,190,100,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, rr * 3.2, 0, TAU);
  ctx.fill();
  // rays
  ctx.beginPath();
  for (let i = 0; i < 28; i++) {
    const an = (i / 28) * TAU + t * 0.25;
    const l = rr * (1.4 + hash(i, 8) * 2.4) * (0.8 + 0.2 * Math.sin(t * 3 + i));
    ctx.moveTo(x + Math.cos(an) * rr * 0.9, y + Math.sin(an) * rr * 0.9);
    ctx.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l);
  }
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = `rgba(255,236,190,${0.7 * a})`;
  ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath();
  ctx.arc(x, y, rr * 0.55, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCosmicHead(ctx: CanvasRenderingContext2D, S: S, hw: { x: number; y: number }, rot: number, s: number, a: number) {
  if (a <= 0.01) return;
  const { t } = S;
  ctx.save();
  ctx.translate(hw.x, hw.y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, 90 * s, 106 * s, 0, 0, TAU);
  ctx.clip();
  const g = ctx.createRadialGradient(-20 * s, -30 * s, 0, 0, 0, 110 * s);
  g.addColorStop(0, `rgba(120,108,96,${0.55 * a})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-120 * s, -130 * s, 240 * s, 260 * s);
  for (let i = 0; i < 70; i++) {
    const an = hash(i, 1) * TAU;
    const rr = Math.sqrt(hash(i, 2)) * 95 * s;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (1 + hash(i, 3) * 2) + i));
    ctx.fillStyle = `rgba(245,232,205,${a * tw * (0.4 + hash(i, 4) * 0.6)})`;
    const sz = (0.6 + hash(i, 5) * 1.6) * s;
    ctx.fillRect(Math.cos(an) * rr, Math.sin(an) * rr, sz, sz);
  }
  ctx.restore();
}

function drawSpeedLines(ctx: CanvasRenderingContext2D, S: S, cx: number, cy: number) {
  const p = (S.t - T.impact) / 0.5;
  if (p < 0 || p > 1) return;
  const a = 1 - p;
  ctx.fillStyle = S.I(0.95 * a);
  for (let i = 0; i < 90; i++) {
    const an = (i / 90) * TAU + (hash(i, 1) - 0.5) * 0.08;
    const r0 = 150 + hash(i, 2) * 260 + p * 200;
    const r1 = r0 + 500 + hash(i, 3) * 800;
    const wdt = 0.003 + hash(i, 4) * 0.012;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(an - wdt) * r0, cy + Math.sin(an - wdt) * r0);
    ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1);
    ctx.lineTo(cx + Math.cos(an + wdt) * r0, cy + Math.sin(an + wdt) * r0);
    ctx.closePath();
    ctx.fill();
  }
  // shockwave
  const q = eio(clamp((S.t - T.impact) / 0.9));
  if (q < 1) {
    ctx.beginPath();
    ctx.arc(cx, cy, q * 1000, 0, TAU);
    ctx.lineWidth = 18 * (1 - q) + 1;
    ctx.strokeStyle = S.I(0.85 * (1 - q));
    ctx.stroke();
  }
}

/* typography */
interface CapOpts {
  x?: number;
  y: number;
  size: number;
  weight?: number;
  italic?: boolean;
  track?: number;
  fill: string;
  halo?: string;
  haloW?: number;
  stagger?: number;
  split?: number; // chromatic split amount
  shake?: number;
  fade?: number;
}
function caption(ctx: CanvasRenderingContext2D, text: string, t: number, t0: number, t1: number, o: CapOpts) {
  if (t < t0 || t > t1) return;
  const x = o.x ?? W / 2;
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 600} ${o.size}px ${SERIF}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const track = o.track ?? 0;
  const chars = Array.from(text);
  const widths = chars.map((c) => ctx.measureText(c).width + track);
  const total = widths.reduce((a, b) => a + b, 0) - track;
  const out = 1 - clamp((t - (t1 - (o.fade ?? 0.35))) / (o.fade ?? 0.35));
  let cx = x - total / 2;
  const boil = Math.floor(t * 24);
  for (let i = 0; i < chars.length; i++) {
    const p = clamp((t - t0 - i * (o.stagger ?? 0.035)) / 0.32);
    const e = 1 - Math.pow(1 - p, 3);
    const a = e * out;
    if (a > 0.003 && chars[i] !== ' ') {
      const sx = o.shake ? (hash(i, boil) - 0.5) * o.shake : 0;
      const sy = o.shake ? (hash(i, boil + 9) - 0.5) * o.shake : 0;
      const yy = o.y + (1 - e) * 18 + sy;
      const xx = cx + sx;
      ctx.globalAlpha = a;
      if (o.split) {
        ctx.fillStyle = 'rgba(255,30,70,0.85)';
        ctx.fillText(chars[i], xx - o.split, yy);
        ctx.fillStyle = 'rgba(0,210,255,0.85)';
        ctx.fillText(chars[i], xx + o.split, yy);
      }
      if (o.halo) {
        ctx.lineWidth = o.haloW ?? 10;
        ctx.strokeStyle = o.halo;
        ctx.strokeText(chars[i], xx, yy);
      }
      ctx.fillStyle = o.fill;
      ctx.fillText(chars[i], xx, yy);
    }
    cx += widths[i];
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------ MAIN RENDER ------------------------------ */
export function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, t: number) {
  const k = canvas.width / W;
  const boil = Math.floor(t * 24);
  const frame60 = Math.floor(t * 60);
  const inv = (t >= T.impact && t < T.impact + 0.12) || (t >= T.impact + 0.18 && t < T.impact + 0.22);
  const calm = sm(T.calmStart, T.calmEnd, t);
  const bgMix = sm(5.6, 8.2, t);
  const paper: RGB = inv ? [0, 0, 0] : lerp3([247, 246, 242], [240, 230, 208], bgMix);
  const ink: RGB = inv ? [255, 255, 255] : lerp3([0, 0, 0], [26, 17, 10], bgMix);
  const pre = t < T.impact;
  const anger = (pre ? sm(0.3, T.impact, t) : 0.7) * (1 - calm);
  const beat = beatAmt(t);

  const merge = eio(sm(T.mergeStart, T.mergeEnd, t));
  const sepAmt = pre ? 0 : eob(sm(T.impact, T.impact + 1.2, t));
  const sep = sepAmt * (1 - merge);

  const zPre = 0.88 + 0.4 * Math.pow(clamp(t / T.impact), 1.5);
  const zPost = 0.8 + 0.03 * sm(3.7, 5.5, t);
  const figS = (pre ? zPre : lerp(zPost, 0.98, merge)) + beat * 0.018;
  const cz = pre ? zPre : 0.9 + 0.22 * sm(T.impact, 6.0, t) - 0.12 * merge;
  const camx = Math.sin(t * 0.7) * 45 * (0.6 + 0.4 * calm);

  const S: S = {
    t,
    boil,
    inv,
    ink,
    paper,
    calm,
    anger,
    bgMix,
    cz,
    camx,
    I: (a) => rgba(ink, a),
    P: (a) => rgba(paper, a),
  };

  /* backdrop */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = S.P(1);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  /* camera: shake + dutch angle */
  const shakeAmt =
    (0.4 + 3.2 * anger) * (1 - calm) + beat * 2.2 * (1 - calm * 0.6) + (t > T.impact ? 14 * Math.exp(-(t - T.impact) * 7) : 0);
  const shx = (hash(frame60, 1) - 0.5) * shakeAmt * 2;
  const shy = (hash(frame60, 2) - 0.5) * shakeAmt * 2;
  const dutch = (0.018 * Math.sin(t * 0.8) + 0.02 * anger) * (1 - calm);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.translate(W / 2 + shx, H / 2 + shy);
  ctx.rotate(dutch);
  ctx.translate(-W / 2, -H / 2);

  /* geometry */
  const neckBase = pre ? 800 : lerp(820, 790, merge);
  const emerge = sm(0.15, 1.3, t);
  const neckY = neckBase + (1 - emerge) * 90;
  const mainX = W / 2 - 215 * sep + camx * 0.12;
  const ghostX = W / 2 + 215 * sep + camx * 0.12;
  const bow = pre ? sm(0.6, 2.8, t) : 1 - sm(4.0, 5.6, t);
  const droopMain = 26 * bow - 10 * merge;
  const tremble = pre ? Math.sin(t * 38) * 0.012 * anger : 0;
  const tilt = 0.14 * sep * sm(4.1, 5.2, t);
  const rotMain = tremble + tilt * (1 - merge);
  const rotGhost = -tilt;
  const breathe = Math.sin(t * 2.2) * 0.006;
  const ghostA = (pre ? 0 : sm(T.impact - 0.02, T.impact + 0.35, t)) * (1 - sm(0.7, 1, merge));
  const ghostY = neckY + Math.sin(t * 1.8) * 7;

  const headMain = headWorld(mainX, neckY, figS, rotMain, droopMain);
  const headGhost = headWorld(ghostX, ghostY, figS, rotGhost, 0);

  /* layers (back → front) */
  drawChaos(ctx, S, [0, 1, 2]);
  drawThoughts(ctx, S);
  drawFlows(ctx, S, headMain.x, headMain.y - 80 * figS);

  drawFigure(ctx, S, { X: ghostX, Y: ghostY, s: figS, rot: rotGhost, droop: 0, ghost: true, alpha: ghostA, seed: 300, breath: breathe });
  drawLink(ctx, S, headGhost, headMain, sm(4.4, 5.6, t) * (1 - merge) * sepAmt);
  drawFigure(ctx, S, { X: mainX, Y: neckY, s: figS, rot: rotMain, droop: droopMain, ghost: false, alpha: emerge, seed: 0, breath: breathe });
  drawCosmicHead(ctx, S, headMain, rotMain, figS, sm(7.4, 8.8, t));

  drawTangle(ctx, S, headMain.x, headMain.y, figS);
  drawCoils(ctx, S, mainX, neckY + 480 * figS, figS);

  /* the inner light — his own reflection finally seen */
  const orbA = sm(T.impact + 0.4, T.impact + 1.0, t);
  const orbR = (14 + 16 * sm(4.4, 5.6, t) + 40 * sm(7.4, 9.0, t)) * (0.7 + figS * 0.3);
  const chest = { x: lerp(ghostX, mainX, merge), y: lerp(ghostY, neckY, merge) + 270 * figS };
  drawOrb(ctx, S, chest.x, chest.y, orbR, orbA);

  drawChaos(ctx, S, [3]);

  drawSpeedLines(ctx, S, W / 2, neckY - 120);

  /* captions */
  const haloD = S.I(1);
  const whiteD = rgba(paper, 1);
  caption(ctx, 'your mind never stops.', t, 0.35, 2.15, { y: 1370, size: 58, italic: true, fill: whiteD, halo: haloD, haloW: 12, stagger: 0.04 });
  caption(ctx, 'why does it feel… wrong?', t, 2.15, 3.55, { y: 1370, size: 58, italic: true, fill: whiteD, halo: haloD, haloW: 12, stagger: 0.04, shake: 1.6 });
  caption(ctx, 'WHAT AM I', t, T.impact + 0.02, 5.3, {
    y: 1215, size: 104, weight: 700, track: 6, fill: whiteD, halo: haloD, haloW: 16, stagger: 0.02,
    split: t < T.impact + 0.6 ? 6 : 2, shake: t < T.impact + 0.6 ? 7 : 0.8, fade: 0.4,
  });
  caption(ctx, 'DOING WRONG?', t, T.impact + 0.14, 5.3, {
    y: 1330, size: 104, weight: 700, track: 6, fill: whiteD, halo: haloD, haloW: 16, stagger: 0.02,
    split: t < T.impact + 0.7 ? 6 : 2, shake: t < T.impact + 0.7 ? 7 : 0.8, fade: 0.4,
  });
  caption(ctx, 'stop. look at yourself.', t, 5.45, 7.05, { y: 1370, size: 60, italic: true, fill: whiteD, halo: haloD, haloW: 12, stagger: 0.045 });

  const cream = rgba([240, 230, 208], 1);
  const dark = '#1a110a';
  caption(ctx, 'SELF-REFLECTION', t, 7.3, 99, { y: 235, size: 82, weight: 700, track: 14, fill: dark, halo: cream, haloW: 14, stagger: 0.06, fade: 0 });
  caption(ctx, 'turning the gaze inward —', t, 8.0, 99, { y: 305, size: 40, italic: true, weight: 500, fill: dark, halo: cream, haloW: 10, stagger: 0.03, fade: 0 });
  caption(ctx, 'not to blame, but to understand.', t, 8.5, 99, { y: 352, size: 40, italic: true, weight: 500, fill: dark, halo: cream, haloW: 10, stagger: 0.03, fade: 0 });

  /* post: vignette + grain + glitch */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const vg = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, canvas.width / 2, canvas.height / 2, canvas.height * 0.78);
  vg.addColorStop(0, S.I(0));
  vg.addColorStop(1, S.I(inv ? 0 : 0.3 * (1 - bgMix * 0.5)));
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gr = getGrain();
  const pat = ctx.createPattern(gr, 'repeat');
  if (pat) {
    ctx.save();
    ctx.translate(-Math.floor(hash(boil, 1) * 256), -Math.floor(hash(boil, 2) * 256));
    ctx.fillStyle = pat;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, canvas.width + 256, canvas.height + 256);
    ctx.restore();
  }

  const gl = t - (T.impact + 0.22);
  if (gl > 0 && gl < 0.3) {
    const amp = 70 * (1 - gl / 0.3);
    for (let i = 0; i < 6; i++) {
      const y = hash(i, frame60) * H;
      const h = 20 + hash(i, frame60 + 4) * 110;
      const dx = (hash(i, frame60 + 8) - 0.5) * amp;
      ctx.drawImage(canvas, 0, y * k, canvas.width, h * k, dx * k, y * k, canvas.width, h * k);
    }
  }
  // impact white pop
  const pop = t - T.impact;
  if (pop > 0 && pop < 0.08) {
    ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - pop / 0.08)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

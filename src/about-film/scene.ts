import { dreamWeight, stageWeight } from "./timeline";

/* ------------------------------------------------------------------ */
/* One cohesive illustrated world with a slow virtual camera, layered  */
/* atmosphere and secondary motion. Reality is warm golden hour; as    */
/* the boy drifts, the same world shifts into the four dream grammars. */
/* Glows use cached sprites (no per-frame shadowBlur) to hold 60fps.   */
/* ------------------------------------------------------------------ */

function smooth(a: number, b: number, x: number) {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
}
function hex(c: string): [number, number, number] {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}
function mix(a: string, b: string, k: number) {
  const A = hex(a), B = hex(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(
    A[2] + (B[2] - A[2]) * k
  )})`;
}
function rnd(i: number) {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* cached radial glow sprites -------------------------------------- */
const glowCache = new Map<string, HTMLCanvasElement>();
function glow(color: string) {
  let c = glowCache.get(color);
  if (!c) {
    c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const [r, gg, b] = hex(color);
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${r},${gg},${b},0.95)`);
    grad.addColorStop(0.35, `rgba(${r},${gg},${b},0.38)`);
    grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    glowCache.set(color, c);
  }
  return c;
}
function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, color: string, alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(glow(color), x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function limb(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, ex: number, ey: number, x2: number, y2: number,
  w: number, color: string | CanvasGradient
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(ex, ey, x2, y2);
  ctx.stroke();
}

function flower(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, petals: number,
  color: string, center: string, rot: number, alpha = 1
) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  for (let i = 0; i < petals; i++) {
    ctx.rotate((Math.PI * 2) / petals);
    ctx.beginPath();
    ctx.ellipse(r * 0.75, 0, r * 0.62, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* precomputed ambient particle fields ------------------------------ */
const GRASS = Array.from({ length: 34 }, (_, i) => ({
  x: rnd(i + 200), h: 0.03 + rnd(i + 230) * 0.05, ph: rnd(i + 260) * 6.28, lean: rnd(i + 290) - 0.5,
}));
const MOTES = Array.from({ length: 22 }, (_, i) => ({
  x: rnd(i + 300), y: rnd(i + 330), sp: 0.008 + rnd(i + 360) * 0.02, ph: rnd(i + 390) * 6.28,
}));

/* ================================================================== */
export function drawFilmScene(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  idle: number
) {
  const d = dreamWeight(t);
  const w1 = stageWeight("s1", t);
  const w2 = stageWeight("s2", t);
  const w3 = stageWeight("s3", t);
  const w4 = stageWeight("s4", t);
  const settle = smooth(30.0, 31.5, t);
  const dEff = d * (1 - settle * 0.9);
  const X = (f: number) => f * W;
  const Y = (f: number) => f * H;

  /* ---------- virtual camera: slow push-in + handheld drift ---------- */
  const camZ = 1 + 0.055 * smooth(1, 38, t);
  const camX = Math.sin(idle * 0.21) * W * 0.004 + Math.sin(t * 0.1) * W * 0.0035;
  const camY = Math.cos(idle * 0.17) * H * 0.003;
  ctx.save();
  ctx.translate(W / 2 + camX, H / 2 + camY);
  ctx.scale(camZ, camZ);
  ctx.translate(-W / 2, -H / 2);
  const P = 0.04; // overscan padding

  /* ================= SKY ================= */
  const sky = ctx.createLinearGradient(0, 0, 0, Y(0.72));
  sky.addColorStop(0, mix("#f4a259", "#150a2e", dEff));
  sky.addColorStop(0.55, mix("#f7c877", "#341048", dEff));
  sky.addColorStop(1, mix("#fbe6b6", "#4a1656", dEff));
  ctx.fillStyle = sky;
  ctx.fillRect(-W * P, -H * P, W * (1 + 2 * P), Y(0.78));

  /* clouds — slow parallax drift, tinting with the dream */
  const cloudCol = mix("#ffe9c8", "#5a2a72", dEff);
  ctx.fillStyle = cloudCol;
  for (let i = 0; i < 3; i++) {
    const cx = ((rnd(i + 20) + idle * (0.006 + i * 0.003)) % 1.3 - 0.15) * W;
    const cy = Y(0.12 + i * 0.09);
    ctx.globalAlpha = 0.5 - dEff * 0.25;
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.ellipse(cx + j * X(0.035) - X(0.05), cy + (j % 2) * Y(0.012), X(0.05 - j * 0.006), Y(0.016), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  /* stars */
  if (w2 > 0.02) {
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 90; i++) {
      const sx = rnd(i) * W;
      const sy = rnd(i + 50) * Y(0.55);
      if (sx < W * 0.45) continue;
      const tw = 0.5 + 0.5 * Math.sin(idle * 2 + i * 3.1);
      ctx.globalAlpha = w2 * tw * 0.9;
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }

  /* sun / dream-moon */
  const sunX = X(0.82), sunY = Y(0.24);
  drawGlow(ctx, sunX, sunY, Y(0.3), "#ffcf8a", 0.8 * (1 - dEff) + 0.2 * dEff);
  ctx.fillStyle = mix("#fff6d8", "#dfe4ff", dEff);
  ctx.beginPath();
  ctx.arc(sunX, sunY, Y(0.045), 0, Math.PI * 2);
  ctx.fill();

  /* soft god-rays */
  const rayA = 0.09 * (1 - dEff) * (0.8 + 0.2 * Math.sin(idle * 0.7));
  if (rayA > 0.005) {
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(idle * 0.015);
    const rg = ctx.createLinearGradient(0, 0, -W, Y(0.5));
    rg.addColorStop(0, `rgba(255,228,170,${rayA})`);
    rg.addColorStop(1, "rgba(255,228,170,0)");
    ctx.fillStyle = rg;
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2) / 5 * i + 0.4);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-W * 1.2, -Y(0.06));
      ctx.lineTo(-W * 1.2, Y(0.06));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  /* dust motes dancing in the light (reality) */
  const moteA = 0.5 * (1 - dEff);
  if (moteA > 0.02) {
    for (const m of MOTES) {
      const my = ((m.y - idle * m.sp) % 1 + 1) % 1;
      const mx = m.x + Math.sin(idle * 0.8 + m.ph) * 0.02;
      const tw = 0.5 + 0.5 * Math.sin(idle * 3 + m.ph * 4);
      drawGlow(ctx, mx * W, my * H * 0.7 + H * 0.08, Y(0.006) * (0.6 + tw), "#ffe9c0", moteA * tw);
    }
  }

  /* birds crossing the present (early reality beat) */
  const birdP = smooth(2.6, 3.0, t) * (1 - smooth(6.6, 7.2, t));
  if (birdP > 0.02) {
    ctx.strokeStyle = `rgba(40,28,24,${0.7 * birdP * (1 - dEff)})`;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    for (let i = 0; i < 2; i++) {
      const p = smooth(2.6 + i * 0.5, 7.0 + i * 0.5, t);
      const bx = X(0.95 - p * 0.55);
      const by = Y(0.16 + i * 0.05 + Math.sin(p * 9) * 0.008);
      const flap = Math.sin(idle * 9 + i * 2) * Y(0.008);
      ctx.beginPath();
      ctx.moveTo(bx - X(0.012), by - flap);
      ctx.quadraticCurveTo(bx - X(0.004), by + flap * 0.5, bx, by);
      ctx.quadraticCurveTo(bx + X(0.004), by + flap * 0.5, bx + X(0.012), by - flap);
      ctx.stroke();
    }
  }

  /* ================= BLAZING FLOWER (II) ================= */
  if (w2 > 0.02) {
    const fx = X(0.36), fy = Y(0.4);
    const R = Y(0.26) * (0.85 + 0.15 * Math.sin(idle * 0.8));
    ctx.save();
    ctx.globalAlpha = w2 * 0.92;
    for (let ring = 0; ring < 2; ring++) {
      const n = 18 - ring * 6;
      const rr = R * (1 - ring * 0.32);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.2 + Math.sin(idle * 0.3) * 0.02;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(a);
        ctx.fillStyle = ring ? "#cfd2da" : "#8b8f9c";
        ctx.beginPath();
        ctx.ellipse(rr * 0.72, 0, rr * 0.5, rr * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    const pulse = 0.7 + 0.3 * Math.sin(idle * 2.4);
    drawGlow(ctx, fx, fy, R * 0.55, "#ff3cb4", 0.7 * pulse * w2);
    drawGlow(ctx, fx, fy, R * 0.3, "#ffd44a", 0.8 * pulse * w2);
    ctx.restore();
  }

  /* ================= TREES ================= */
  const treeCol = mix("#4a5d38", "#1c1134", dEff);
  const treeDark = mix("#33422a", "#120a24", dEff);
  const sway = Math.sin(idle * 0.6) * X(0.004);

  ctx.fillStyle = mix("#6a7a4d", "#2a1a44", dEff);
  ctx.beginPath();
  ctx.moveTo(-W * P, Y(0.62));
  for (let i = 0; i <= 12; i++) {
    const px = (i / 12) * W;
    ctx.quadraticCurveTo(px - W / 24, Y(0.585 - rnd(i + 9) * 0.05) - Y(0.02), px, Y(0.585 - rnd(i + 9) * 0.05));
  }
  ctx.lineTo(W * (1 + P), Y(0.78));
  ctx.lineTo(-W * P, Y(0.78));
  ctx.fill();

  const tree = (bx: number, r: number, seed: number) => {
    ctx.fillStyle = treeDark;
    ctx.fillRect(X(bx) - Y(0.014), Y(0.42), Y(0.028), Y(0.28));
    ctx.fillStyle = treeCol;
    for (let i = 0; i < 7; i++) {
      const a = rnd(seed + i) * Math.PI * 2;
      const rr = r * (0.55 + rnd(seed + i + 3) * 0.5);
      ctx.beginPath();
      ctx.arc(X(bx) + Math.cos(a) * r * 0.5 + sway * (1 + i * 0.08), Y(0.36) + Math.sin(a) * r * 0.34, rr, 0, Math.PI * 2);
      ctx.fill();
    }
    drawGlow(ctx, X(bx) + r * 0.45 + sway, Y(0.34), r * 0.55, "#ffc882", 0.2 * (1 - dEff));
  };
  tree(0.09, Y(0.13), 2);
  tree(0.93, Y(0.15), 7);

  /* ================= GROUND ================= */
  const gnd = ctx.createLinearGradient(0, Y(0.66), 0, H);
  gnd.addColorStop(0, mix("#8a9a55", "#221338", dEff));
  gnd.addColorStop(1, mix("#5c6b3a", "#140a26", dEff));
  ctx.fillStyle = gnd;
  ctx.fillRect(-W * P, Y(0.66), W * (1 + 2 * P), H * 0.4);
  // dream light pools on the grass
  if (dEff > 0.03) {
    drawGlow(ctx, X(0.3), Y(0.78), X(0.22), "#E90096", 0.16 * dEff);
    drawGlow(ctx, X(0.72), Y(0.8), X(0.2), "#179FE8", 0.14 * dEff);
  }
  // path
  ctx.fillStyle = mix("#d9b98a", "#3a2450", dEff);
  ctx.beginPath();
  ctx.moveTo(X(0.42), Y(0.68));
  ctx.quadraticCurveTo(X(0.5), Y(0.8), X(0.3), H * 1.1);
  ctx.lineTo(X(0.62), H * 1.1);
  ctx.quadraticCurveTo(X(0.56), Y(0.8), X(0.55), Y(0.68));
  ctx.closePath();
  ctx.fill();

  /* distant strangers, each lost in their own elsewhere (the reveal) */
  const walk = smooth(34.2, 35.6, t);
  if (walk > 0.01) {
    const wp = smooth(34.2, 41, t);
    const figs: Array<[number, string, number]> = [
      [0.52, "#20D1DA", 1],
      [0.2, "#FF9A00", -1],
    ];
    figs.forEach(([fx0, col, dir], i) => {
      const fx = X(fx0 + dir * wp * 0.06);
      const fy = Y(0.662);
      const s = Y(0.055);
      const step = Math.sin(idle * 4 + i * 2.2) * s * 0.07;
      ctx.globalAlpha = walk * 0.8;
      ctx.fillStyle = mix("#241a30", "#120a20", dEff);
      ctx.beginPath();
      ctx.ellipse(fx, fy - s * 0.45 + Math.abs(step) * 0.2, s * 0.15, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx, fy - s * 0.98, s * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = s * 0.09;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(fx, fy - s * 0.12);
      ctx.lineTo(fx + step, fy + s * 0.14);
      ctx.moveTo(fx, fy - s * 0.12);
      ctx.lineTo(fx - step, fy + s * 0.14);
      ctx.stroke();
      drawGlow(ctx, fx, fy - s * 1.32, s * 0.5, col, walk * (0.32 + 0.14 * Math.sin(idle * 1.5 + i * 3)));
      ctx.globalAlpha = 1;
    });
  }

  // bench shadow
  ctx.fillStyle = `rgba(20,10,30,${0.28 + 0.1 * dEff})`;
  ctx.beginPath();
  ctx.ellipse(X(0.47), Y(0.845), X(0.34), Y(0.032), 0, 0, Math.PI * 2);
  ctx.fill();

  /* ================= BENCH ================= */
  const wood = mix("#8a6242", "#4a3550", dEff * 0.5);
  const woodDk = mix("#5e4029", "#33243c", dEff * 0.5);
  const slat = (y: number, x0: number, x1: number, h: number) => {
    ctx.fillStyle = wood;
    ctx.fillRect(X(x0), Y(y), X(x1 - x0), Y(h));
    ctx.fillStyle = "rgba(255,220,160,0.25)";
    ctx.fillRect(X(x0), Y(y), X(x1 - x0), Y(h * 0.25));
    ctx.fillStyle = woodDk;
    ctx.fillRect(X(x0), Y(y + h - 0.005), X(x1 - x0), Y(0.005));
  };
  slat(0.512, 0.205, 0.795, 0.018);
  slat(0.556, 0.205, 0.795, 0.018);
  ctx.fillStyle = "#241a20";
  [0.235, 0.765].forEach((sx) => ctx.fillRect(X(sx - 0.005), Y(0.512), X(0.01), Y(0.15)));
  ctx.strokeStyle = "#241a20";
  ctx.lineWidth = Y(0.012);
  ctx.lineCap = "round";
  [0.215, 0.785].forEach((sx) => {
    ctx.beginPath();
    ctx.moveTo(X(sx), Y(0.655));
    ctx.quadraticCurveTo(X(sx), Y(0.6), X(sx + (sx < 0.5 ? 0.02 : -0.02)), Y(0.6));
    ctx.stroke();
  });
  ctx.fillStyle = "#241a20";
  ctx.fillRect(X(0.225), Y(0.672), X(0.014), Y(0.185));
  ctx.fillRect(X(0.762), Y(0.672), X(0.014), Y(0.185));

  /* ================= CHARACTERS ================= */
  drawBoy(ctx, W, H, t, idle, dEff, w4);
  drawGirl(ctx, W, H, t, idle, dEff, w3);

  /* her voice rings (≈31–34s) */
  const voice = smooth(30.7, 31.0, t) * (1 - smooth(33.4, 34.2, t));
  if (voice > 0.02) {
    const mx = X(0.618), my = Y(0.472);
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const p = ((t - 30.7) * 0.55 + i * 0.33) % 1;
      ctx.globalAlpha = voice * (1 - p) * 0.55;
      ctx.strokeStyle = "#ffe6c4";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(mx, my, Y(0.02 + p * 0.1), Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* bench seat over hips */
  slat(0.652, 0.19, 0.81, 0.022);
  ctx.fillStyle = "#241a20";
  ctx.fillRect(X(0.225), Y(0.674), X(0.014), Y(0.02));
  ctx.fillRect(X(0.762), Y(0.674), X(0.014), Y(0.02));

  /* ================= FLOATING BLOOMS (I) ================= */
  if (w1 > 0.02) {
    const cols: Array<[string, string]> = [
      ["#ff9a3c", "#ffd27a"], ["#ff5fa8", "#ffc0dd"], ["#a982ff", "#e0d2ff"], ["#ff7a4d", "#ffd0a0"],
    ];
    for (let i = 0; i < 11; i++) {
      const p = (idle * 0.05 + rnd(i) * 1.3) % 1.2;
      const bx = X(0.12 + rnd(i + 20) * 0.76 + Math.sin(idle * 0.5 + i) * 0.02);
      const by = Y(0.75 - p * 0.6);
      const [c, cc] = cols[i % cols.length];
      drawGlow(ctx, bx, by, Y(0.05), c, w1 * (1 - p * 0.5) * 0.5);
      flower(ctx, bx, by, Y(0.015 + rnd(i + 5) * 0.018), 6, c, cc, idle * 0.3 + i, w1 * (1 - p * 0.5));
    }
  }

  /* ================= OVERWHELM (IV) ================= */
  if (w4 > 0.02) {
    const calm = 1 - smooth(29.2, 30.2, t);
    const cols = ["#14D9ED", "#FFDE22", "#F03429", "#E533BE", "#2255FF", "#ffffff"];
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < 44; i++) {
      const a = rnd(i) * Math.PI * 2 + idle * (0.6 + rnd(i + 9) * 1.6) * calm;
      const rad = Y(0.05 + rnd(i + 3) * 0.16);
      const cx = X(0.368) + Math.cos(a) * rad * 1.15;
      const cy = Y(0.44) + Math.sin(a) * rad * 0.8;
      const len = Y(0.012 + rnd(i + 7) * 0.02) * (0.5 + calm);
      ctx.globalAlpha = w4 * (0.35 + 0.6 * rnd(i + 11)) * (0.4 + 0.6 * calm);
      ctx.strokeStyle = cols[i % cols.length];
      ctx.lineWidth = Y(0.004 + rnd(i + 13) * 0.004);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a + 1.2) * len, cy + Math.sin(a + 1.2) * len);
      ctx.stroke();
    }
    ctx.restore();
    const gl = 1 - smooth(28.6, 29.9, t);
    for (let i = 0; i < 4; i++) {
      const ex = X(0.15 + i * 0.24 + Math.sin(idle * 0.7 + i * 2) * 0.02 * gl);
      const ey = Y(0.14 + (i % 2) * 0.1 + Math.cos(idle * 0.6 + i) * 0.015 * gl);
      drawGlow(ctx, ex, ey, Y(0.045), "#ff3ca0", 0.75 * w4);
      ctx.fillStyle = `rgba(30,6,24,${0.9 * w4})`;
      ctx.beginPath();
      ctx.arc(ex, ey, Y(0.008), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ================= DRIFTING LEAVES ================= */
  for (let i = 0; i < 16; i++) {
    const p = (idle * (0.04 + rnd(i) * 0.05) + rnd(i + 40)) % 1.3;
    const lx = ((rnd(i + 60) + idle * 0.012 * (i % 2 ? 1 : -1)) % 1.1 + 1.1) % 1.1 - 0.05;
    const ly = p * 0.95 - 0.1;
    const swayL = Math.sin(idle * 1.8 + i * 2) * X(0.012);
    ctx.save();
    ctx.translate(lx * W + swayL, ly * H);
    ctx.rotate(Math.sin(idle * 2.2 + i) * 1.2 + i); // flutter, not spin
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = dEff > 0.4 ? ["#E90096", "#A982FF", "#ff9a00"][i % 3] : ["#d98a2b", "#b5651d", "#c9a23a"][i % 3];
    ctx.beginPath();
    ctx.ellipse(0, 0, Y(0.008), Y(0.004), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ================= FOREGROUND GRASS ================= */
  ctx.lineCap = "round";
  for (const b of GRASS) {
    const gsway = Math.sin(idle * 1.1 + b.ph) * X(0.006) + b.lean * X(0.004);
    ctx.strokeStyle = mix("#3c4d2a", "#180e2c", dEff);
    ctx.lineWidth = Y(0.0035);
    ctx.beginPath();
    ctx.moveTo(b.x * W, H * 1.02);
    ctx.quadraticCurveTo(b.x * W + gsway * 0.4, H - b.h * H * 0.6, b.x * W + gsway, H - b.h * H);
    ctx.stroke();
  }

  /* ================= THE LEAF BETWEEN THEM ================= */
  if (t > 33.0) {
    const p = smooth(33.0, 34.6, t);
    const lx = X(0.497 + Math.sin(p * 9) * 0.018 * (1 - p));
    const ly = Y(0.3 + p * 0.352);
    // its shadow gathers on the bench as it lands
    ctx.fillStyle = `rgba(10,5,15,${0.25 * p})`;
    ctx.beginPath();
    ctx.ellipse(X(0.497), Y(0.652), Y(0.012) * (0.3 + p * 0.7), Y(0.004) * p, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(p * 6.5);
    ctx.fillStyle = "#d98a2b";
    ctx.beginPath();
    ctx.ellipse(0, 0, Y(0.012), Y(0.006), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore(); // end camera

  /* ================= VIGNETTE (screen space) ================= */
  const vig = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.5, H * 0.85);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(8,4,16,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  /* fade up from black */
  const fadein = 1 - smooth(0, 1.1, t);
  if (fadein > 0.001) {
    ctx.fillStyle = `rgba(6,3,12,${fadein})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ================================================================== */
function drawBoy(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  t: number, idle: number, d: number, w4: number
) {
  const X = (f: number) => f * W;
  const Y = (f: number) => f * H;
  const breathe = Math.sin(idle * 1.25) * 0.5 + 0.5;
  const headLift = d * 0.011 + Math.sin(idle * 0.5) * 0.003;
  const fade = 1 - d * 0.14;
  const farSmile = smooth(31.0, 31.8, t) * (1 - smooth(34.0, 35.0, t));

  const jacket = ctx.createLinearGradient(0, Y(0.48), 0, Y(0.68));
  jacket.addColorStop(0, "#37453c");
  jacket.addColorStop(1, "#171f1a");
  const jeans = "#232a38";
  const skin = "#d8a880";
  const hair = "#221a30";

  ctx.save();
  ctx.globalAlpha = fade;

  limb(ctx, X(0.352), Y(0.648), X(0.318), Y(0.662), X(0.302), Y(0.83), Y(0.034), jeans);
  limb(ctx, X(0.364), Y(0.652), X(0.338), Y(0.668), X(0.33), Y(0.833), Y(0.034), jeans);
  ctx.fillStyle = "#141018";
  ctx.beginPath();
  ctx.ellipse(X(0.294), Y(0.838), Y(0.024), Y(0.012), -0.15, 0, Math.PI * 2);
  ctx.ellipse(X(0.322), Y(0.841), Y(0.024), Y(0.012), -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = jacket;
  ctx.beginPath();
  ctx.moveTo(X(0.346), Y(0.655));
  ctx.bezierCurveTo(X(0.332), Y(0.6), X(0.334), Y(0.545), X(0.348), Y(0.508 - breathe * 0.005));
  ctx.lineTo(X(0.374), Y(0.505 - breathe * 0.005));
  ctx.bezierCurveTo(X(0.386), Y(0.56), X(0.382), Y(0.62), X(0.372), Y(0.655));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#101612";
  ctx.beginPath();
  ctx.moveTo(X(0.35), Y(0.512));
  ctx.lineTo(X(0.362), Y(0.524));
  ctx.lineTo(X(0.372), Y(0.51));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(255,205,140,${0.5 * (1 - d)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(0.374), Y(0.508));
  ctx.bezierCurveTo(X(0.386), Y(0.56), X(0.382), Y(0.62), X(0.372), Y(0.652));
  ctx.stroke();

  limb(ctx, X(0.352), Y(0.52), X(0.334), Y(0.585), X(0.318), Y(0.628), Y(0.024), jacket);
  limb(ctx, X(0.372), Y(0.52), X(0.392), Y(0.588), X(0.402), Y(0.646), Y(0.024), jacket);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(X(0.316), Y(0.632), Y(0.01), 0, Math.PI * 2);
  ctx.arc(X(0.403), Y(0.65), Y(0.01), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin;
  ctx.fillRect(X(0.356), Y(0.488), X(0.014), Y(0.024));
  const hx = X(0.368), hy = Y(0.452 - headLift), hr = Y(0.031);
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx - hr * 0.9, hy - hr * 0.1);
  ctx.lineTo(hx - hr * 1.28, hy + hr * 0.28);
  ctx.lineTo(hx - hr * 0.95, hy + hr * 0.55);
  ctx.quadraticCurveTo(hx - hr * 0.4, hy + hr * 0.95, hx + hr * 0.2, hy + hr * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(60,35,25,0.8)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(hx - hr * 0.62, hy + hr * 0.02);
  ctx.lineTo(hx - hr * 0.3, hy + hr * 0.06);
  ctx.stroke();
  if (farSmile > 0.02) {
    ctx.strokeStyle = `rgba(90,45,35,${0.85 * farSmile})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx - hr * 0.72, hy + hr * 0.52);
    ctx.quadraticCurveTo(hx - hr * 0.5, hy + hr * (0.62 + 0.08 * farSmile), hx - hr * 0.28, hy + hr * 0.5);
    ctx.stroke();
  }
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(hx + hr * 0.45, hy + hr * 0.2, hr * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.moveTo(hx - hr, hy - hr * 0.15);
  ctx.bezierCurveTo(hx - hr * 1.2, hy - hr, hx - hr * 0.3, hy - hr * 1.35, hx + hr * 0.35, hy - hr * 1.15);
  ctx.bezierCurveTo(hx + hr * 1.15, hy - hr * 0.95, hx + hr * 1.15, hy - hr * 0.1, hx + hr * 0.85, hy + hr * 0.35);
  ctx.bezierCurveTo(hx + hr * 0.7, hy - hr * 0.35, hx + hr * 0.2, hy - hr * 0.6, hx - hr * 0.3, hy - hr * 0.55);
  ctx.bezierCurveTo(hx - hr * 0.7, hy - hr * 0.5, hx - hr * 0.9, hy - hr * 0.35, hx - hr, hy - hr * 0.15);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = -2.5 + i * 0.5 + Math.sin(idle * 1.5 + i) * 0.04;
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(a) * hr * 0.7, hy + Math.sin(a) * hr * 0.7);
    ctx.lineTo(hx + Math.cos(a - 0.18) * hr * (1.25 + d * 0.2), hy + Math.sin(a - 0.18) * hr * (1.25 + d * 0.2));
    ctx.lineTo(hx + Math.cos(a + 0.22) * hr * 0.85, hy + Math.sin(a + 0.22) * hr * 0.85);
    ctx.closePath();
    ctx.fill();
  }
  if (d > 0.08 || w4 > 0.05) {
    const k = Math.max(d, w4);
    const cols = ["#14D9ED", "#FFDE22", "#F03429", "#E533BE", "#2255FF"];
    ctx.lineCap = "round";
    for (let i = 0; i < 6; i++) {
      const a = -2.6 + i * 0.55 + Math.sin(idle * 2 + i * 1.7) * 0.06;
      ctx.globalAlpha = fade * k * 0.85;
      ctx.strokeStyle = cols[i % cols.length];
      ctx.lineWidth = hr * (0.16 + 0.08 * Math.sin(idle * 2.4 + i));
      ctx.beginPath();
      ctx.moveTo(hx + Math.cos(a) * hr * 0.6, hy + Math.sin(a) * hr * 0.6);
      ctx.lineTo(hx + Math.cos(a) * hr * (1.3 + 0.2 * Math.sin(idle + i)), hy + Math.sin(a) * hr * (1.3 + 0.2 * Math.sin(idle + i)));
      ctx.stroke();
    }
    ctx.globalAlpha = fade;
  }
  if (d > 0.05) {
    drawGlow(ctx, hx - hr * 0.4, hy - hr * 0.4, hr * 1.6, "#E533BE", d * 0.35);
  }
  ctx.restore();
}

/* ================================================================== */
function drawGirl(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  t: number, idle: number, d: number, w3: number
) {
  const X = (f: number) => f * W;
  const Y = (f: number) => f * H;
  const breathe = Math.sin(idle * 1.15 + 1.2) * 0.5 + 0.5;
  const lookAway = smooth(34.6, 35.8, t);

  const coat = ctx.createLinearGradient(0, Y(0.48), 0, Y(0.7));
  coat.addColorStop(0, "#cf9d68");
  coat.addColorStop(1, "#8a6238");
  const tights = "#20182e";
  const skin = "#f0c8a6";
  const hairL = "#e3e7f4";
  const hairS = "#aab2d6";

  limb(ctx, X(0.64), Y(0.648), X(0.604), Y(0.666), X(0.592), Y(0.83), Y(0.03), tights);
  limb(ctx, X(0.652), Y(0.652), X(0.62), Y(0.67), X(0.614), Y(0.833), Y(0.03), tights);
  ctx.fillStyle = "#141018";
  ctx.beginPath();
  ctx.ellipse(X(0.585), Y(0.838), Y(0.022), Y(0.011), 0.15, 0, Math.PI * 2);
  ctx.ellipse(X(0.608), Y(0.841), Y(0.022), Y(0.011), 0.15, 0, Math.PI * 2);
  ctx.fill();

  const hemSway = Math.sin(idle * 1.0 + 1) * X(0.004);
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(X(0.628), Y(0.668));
  ctx.bezierCurveTo(X(0.618), Y(0.6), X(0.622), Y(0.545), X(0.634), Y(0.508 - breathe * 0.005));
  ctx.lineTo(X(0.66), Y(0.506 - breathe * 0.005));
  ctx.bezierCurveTo(X(0.674), Y(0.56), X(0.672), Y(0.62), X(0.668), Y(0.668));
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(X(0.626), Y(0.648));
  ctx.quadraticCurveTo(X(0.596), Y(0.662), X(0.592) + hemSway, Y(0.7));
  ctx.lineTo(X(0.668) + hemSway, Y(0.7));
  ctx.quadraticCurveTo(X(0.672), Y(0.66), X(0.668), Y(0.648));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2a2136";
  ctx.fillRect(X(0.636), Y(0.492), X(0.016), Y(0.022));
  ctx.strokeStyle = `rgba(255,215,150,${0.55 * (1 - d)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(0.66), Y(0.508));
  ctx.bezierCurveTo(X(0.674), Y(0.56), X(0.672), Y(0.62), X(0.668), Y(0.65));
  ctx.stroke();

  limb(ctx, X(0.658), Y(0.52), X(0.668), Y(0.585), X(0.654), Y(0.63), Y(0.022), coat);
  // reach with a breath of anticipation
  const ant = smooth(21.6, 22.0, t) * (1 - smooth(22.0, 22.5, t));
  const reach = smooth(22.0, 23.0, t) * (1 - smooth(24.6, 25.6, t));
  const handX = 0.63 - reach * 0.078 + ant * 0.008;
  const handY = 0.626 - reach * 0.05 + ant * 0.012 + Math.sin(idle * 1.4) * 0.003;
  limb(ctx, X(0.638), Y(0.52), X(0.614), Y(0.588 - reach * 0.02), X(handX), Y(handY), Y(0.022), coat);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(X(0.654), Y(0.634), Y(0.009), 0, Math.PI * 2);
  ctx.arc(X(handX), Y(handY), Y(0.009), 0, Math.PI * 2);
  ctx.fill();

  const ghx = X(0.636 - lookAway * 0.012);
  const ghy = Y(0.452 + lookAway * 0.013 + Math.sin(idle * 0.6 + 2) * 0.002);
  const ghr = Y(0.029);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(ghx, ghy, ghr, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(ghx - ghr * 0.7, ghy + ghr * 0.4);
  ctx.quadraticCurveTo(ghx - ghr * 0.2, ghy + ghr, ghx + ghr * 0.35, ghy + ghr * 0.85);
  ctx.closePath();
  ctx.fill();

  /* hair — three sway phases for follow-through */
  const sway = Math.sin(idle * 1.05) * X(0.007);
  const sway2 = Math.sin(idle * 0.9 + 1.1) * X(0.009);
  const sway3 = Math.sin(idle * 0.8 + 2.2) * X(0.011);
  ctx.fillStyle = hairL;
  ctx.beginPath();
  ctx.moveTo(ghx - ghr * 0.5, ghy - ghr * 0.9);
  ctx.bezierCurveTo(ghx + ghr * 1.6, ghy - ghr * 1.2, ghx + ghr * 2.1 + sway, ghy + ghr, ghx + ghr * 1.6 + sway2, ghy + ghr * 4.8);
  ctx.bezierCurveTo(ghx + ghr * 1.2 + sway3, ghy + ghr * 5.8, ghx + ghr * 0.3, ghy + ghr * 5.2, ghx + ghr * 0.6 + sway3, ghy + ghr * 3.2);
  ctx.bezierCurveTo(ghx + ghr * 0.2, ghy + ghr * 1.4, ghx - ghr * 0.7, ghy + ghr * 0.5, ghx - ghr, ghy - ghr * 0.25);
  ctx.bezierCurveTo(ghx - ghr * 1.05, ghy - ghr * 0.8, ghx - ghr * 0.8, ghy - ghr, ghx - ghr * 0.5, ghy - ghr * 0.9);
  ctx.closePath();
  ctx.fill();
  // loose lock over her shoulder, lagging the main sway
  ctx.beginPath();
  ctx.moveTo(ghx + ghr * 0.2, ghy + ghr * 0.4);
  ctx.quadraticCurveTo(ghx + ghr * 0.05 + sway2, ghy + ghr * 2.2, ghx + ghr * 0.25 + sway3, ghy + ghr * 3.6);
  ctx.quadraticCurveTo(ghx + ghr * 0.45 + sway2, ghy + ghr * 2.2, ghx + ghr * 0.4, ghy + ghr * 0.5);
  ctx.closePath();
  ctx.fill();
  // fringe
  ctx.beginPath();
  ctx.moveTo(ghx - ghr * 0.95, ghy - ghr * 0.5);
  ctx.quadraticCurveTo(ghx - ghr * 0.1, ghy - ghr * 1.1, ghx + ghr * 0.75, ghy - ghr * 0.7);
  ctx.quadraticCurveTo(ghx + ghr * 0.15, ghy - ghr * 0.3, ghx - ghr * 0.5, ghy - ghr * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(ghx + ghr * 0.95, ghy - ghr * 0.35);
  ctx.bezierCurveTo(ghx + ghr * 1.5 + sway * 0.5, ghy + ghr, ghx + ghr * 1.35 + sway2, ghy + ghr * 3, ghx + ghr * 1.1 + sway3, ghy + ghr * 4.5);
  ctx.stroke();
  ctx.strokeStyle = hairS;
  ctx.beginPath();
  ctx.moveTo(ghx + ghr * 0.45, ghy + ghr * 0.2);
  ctx.bezierCurveTo(ghx + ghr * 0.75 + sway2, ghy + ghr * 2, ghx + ghr * 0.65 + sway3, ghy + ghr * 3.4, ghx + ghr * 0.55, ghy + ghr * 4.7);
  ctx.stroke();

  /* face */
  const blink = (idle % 3.4) < 0.13 ? 0.12 : 1;
  const eyeX = ghx - ghr * 0.42 + lookAway * ghr * 0.25;
  const eyeY = ghy + ghr * 0.02 + lookAway * ghr * 0.4;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(eyeX, eyeY, ghr * 0.17, ghr * 0.17 * blink, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a2a4a";
  ctx.beginPath();
  ctx.ellipse(eyeX - ghr * 0.05, eyeY, ghr * 0.09, ghr * 0.09 * blink, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(90,60,50,0.7)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(eyeX - ghr * 0.22, eyeY - ghr * 0.32);
  ctx.lineTo(eyeX + ghr * 0.12, eyeY - ghr * 0.36);
  ctx.stroke();
  ctx.strokeStyle = "rgba(180,90,80,0.8)";
  ctx.beginPath();
  ctx.moveTo(ghx - ghr * 0.55, ghy + ghr * 0.55);
  ctx.quadraticCurveTo(ghx - ghr * 0.4, ghy + ghr * 0.62, ghx - ghr * 0.25, ghy + ghr * 0.55);
  ctx.stroke();

  /* idealised halo (III) */
  if (w3 > 0.02) {
    const blooms: Array<[number, number, number, string, string]> = [
      [0.9, -0.7, 0.55, "#20D1DA", "#baf7fb"],
      [1.25, 0.1, 0.7, "#163BF2", "#9fb0ff"],
      [1.05, 0.9, 0.6, "#E7139E", "#ffb7e4"],
      [0.55, 1.5, 0.5, "#7a3bff", "#d4c2ff"],
      [1.5, 1.7, 0.45, "#20D1DA", "#baf7fb"],
      [0.3, 2.4, 0.5, "#E7139E", "#ffb7e4"],
    ];
    blooms.forEach(([ox, oy, s, c, cc], i) => {
      const grow = smooth(0, 1, w3 * 1.4 - i * 0.12);
      if (grow <= 0) return;
      const bx = ghx + ghr * ox * 1.6;
      const by = ghy + ghr * oy * 1.5;
      const br = ghr * s * grow * (1 + 0.08 * Math.sin(idle * 1.6 + i));
      drawGlow(ctx, bx, by, br * 2.2, c, w3 * grow * 0.5);
      flower(ctx, bx, by, br, 6, c, cc, idle * 0.2 + i, w3 * grow);
    });
  }

  /* her own quiet elsewhere — the twist (≈36s+): she was never fully here either */
  const herDrift = smooth(36.2, 37.6, t);
  if (herDrift > 0.01) {
    const bx2 = ghx + ghr * 0.15;
    const by2 = ghy - ghr * 1.9;
    drawGlow(ctx, bx2, by2, ghr * 1.5, "#7fd8ff", 0.4 * herDrift);
    flower(
      ctx, bx2, by2,
      ghr * 0.34 * herDrift * (1 + 0.1 * Math.sin(idle * 1.3)),
      5, "#9fb0ff", "#eaf6ff", idle * 0.25, herDrift * 0.9
    );
  }
}

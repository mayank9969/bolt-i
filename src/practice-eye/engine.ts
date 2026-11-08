import { makeIrisTexture } from "./iris";

type RGB = [number, number, number];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const mix3 = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const rgba = (c: RGB, a: number) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

/* ------------------------------------------------------------------ */
/*  Emotional state                                                    */
/* ------------------------------------------------------------------ */

interface State {
  // live (spring driven) values
  gx: number;
  gy: number;
  gvx: number;
  gvy: number;
  pupil: number; // 0 contracted .. 1 fully dilated
  pvel: number;
  lid: number;
  lvel: number;
  mood: number; // 0 warm curiosity .. 1 cool uncertainty
  tension: number; // jitter / nervousness
  sparkle: number;
  // targets
  sgx: number;
  sgy: number;
  gazeSpeed: number;
  pupilT: number;
  lidT: number;
  moodT: number;
  tensionT: number;
  // pointer
  px: number;
  py: number;
  lastPointer: number;
  interest: number;
  startleT: number;
  // blink
  blinkT: number; // <0 = idle, else time into blink
  nextBlink: number;
  doubleBlink: boolean;
  // micro saccades
  mx: number;
  my: number;
  nextMicro: number;
  label: string;
}

const makeState = (): State => ({
  gx: 0,
  gy: 0,
  gvx: 0,
  gvy: 0,
  pupil: 0.5,
  pvel: 0,
  lid: 0.3,
  lvel: 0,
  mood: 0.1,
  tension: 0,
  sparkle: 0.2,
  sgx: 0,
  sgy: 0,
  gazeSpeed: 1,
  pupilT: 0.5,
  lidT: 0.05,
  moodT: 0.1,
  tensionT: 0.1,
  px: 0,
  py: 0,
  lastPointer: -100,
  interest: 0,
  startleT: 99,
  blinkT: -1,
  nextBlink: 2,
  doubleBlink: false,
  mx: 0,
  my: 0,
  nextMicro: 1,
  label: "",
});

/* ------------------------------------------------------------------ */
/*  The "inner life" script – a little story of curiosity and doubt     */
/* ------------------------------------------------------------------ */

function* script(S: State, R: () => number, api: Api): Generator<number> {
  const sign = () => (R() < 0.5 ? -1 : 1);
  S.sgx = 0;
  S.sgy = 0;
  yield 1.4;

  while (true) {
    /* 1 · idle wondering */
    api.say("curious…");
    api.set({ pupil: 0.48, lid: 0.05, mood: 0.14, tension: 0.08 });
    for (let i = 0; i < 2; i++) {
      api.look((R() - 0.5) * 1.3, (R() - 0.5) * 0.9, 0.35);
      yield 1.5 + R() * 1.3;
    }

    /* 2 · something catches its attention */
    const tx = sign() * (0.55 + R() * 0.35);
    const ty = (R() - 0.6) * 0.8;
    api.blink();
    yield 0.25;
    api.say("wait… what's that?");
    api.look(tx, ty, 1.1);
    api.set({ pupil: 0.86, lid: 0, mood: 0.2, tension: 0.25 });
    api.spark(1);
    yield 1.2;

    /* 3 · leaning in – the pupil "hunts" for focus */
    api.say("closer…");
    for (const v of [0.98, 0.68, 1, 0.76, 0.96]) {
      api.set({ pupil: v });
      api.look(tx * (0.85 + R() * 0.2), ty * (0.8 + R() * 0.3), 1.2);
      yield 0.5 + R() * 0.35;
    }

    /* 4 · doubt – flinches away, creeps back, flinches again */
    api.say("is it safe?");
    api.set({ pupil: 0.12, lid: 0.34, mood: 1, tension: 0.9 });
    api.look(-tx * 0.8, -ty * 0.3 + 0.25, 1.5);
    yield 1.1;
    api.say("hmm…");
    api.set({ pupil: 0.42, lid: 0.2, tension: 0.7 });
    api.look(tx * 0.25, ty * 0.25, 0.24);
    yield 1.7;
    api.set({ pupil: 0.16, lid: 0.32, tension: 0.95 });
    api.look(-tx * 0.4, ty * 0.5 + 0.2, 1.3);
    api.blink();
    yield 0.9;
    api.say("maybe…");
    api.set({ pupil: 0.58, lid: 0.1, tension: 0.6 });
    api.look(tx * 0.6, ty * 0.6, 0.3);
    yield 1.8;

    /* 5 · resolution */
    if (R() < 0.65) {
      api.say("oh…");
      api.look(0, 0, 0.22);
      api.set({ pupil: 1, lid: 0, mood: 0, tension: 0 });
      api.spark(1.5);
      yield 2.2;
      api.say("i want to know everything.");
      api.spark(0.9);
      yield 3.2;
    } else {
      api.say("never mind…");
      api.look(-0.55, 0.7, 0.3);
      api.set({ pupil: 0.24, lid: 0.42, mood: 0.78, tension: 0.4 });
      yield 1.4;
      api.blink();
      yield 0.6;
      api.blink();
      yield 1.2;
      api.set({ lid: 0.08, tension: 0.15 });
      yield 0.8;
    }
  }
}

interface Api {
  say: (s: string) => void;
  look: (x: number, y: number, speed?: number) => void;
  set: (p: Partial<{ pupil: number; lid: number; mood: number; tension: number }>) => void;
  blink: () => void;
  spark: (v: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Engine                                                             */
/* ------------------------------------------------------------------ */

export function startEye(canvas: HTMLCanvasElement, onLabel: (s: string) => void): () => void {
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const S = makeState();

  const rnd = () => Math.random();

  const api: Api = {
    say: (s) => (S.label = s),
    look: (x, y, speed = 1) => {
      S.sgx = clamp(x, -1, 1);
      S.sgy = clamp(y, -1, 1);
      S.gazeSpeed = speed;
    },
    set: (p) => {
      if (p.pupil !== undefined) S.pupilT = p.pupil;
      if (p.lid !== undefined) S.lidT = p.lid;
      if (p.mood !== undefined) S.moodT = p.mood;
      if (p.tension !== undefined) S.tensionT = p.tension;
    },
    blink: () => {
      if (S.blinkT < 0) S.blinkT = 0;
    },
    spark: (v) => (S.sparkle = Math.max(S.sparkle, v)),
  };
  const gen = script(S, rnd, api);
  let wait = 0;

  /* ----- assets ----- */
  const texSize = 1024;
  let texA: HTMLCanvasElement | null = null;
  let texB: HTMLCanvasElement | null = null;

  // grain tile (chunky 2px grain)
  const grainSmall = document.createElement("canvas");
  grainSmall.width = grainSmall.height = 160;
  {
    const g = grainSmall.getContext("2d")!;
    const id = g.createImageData(160, 160);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.random() * 255;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
    g.putImageData(id, 0, 0);
  }
  const grainTile = document.createElement("canvas");
  grainTile.width = grainTile.height = 320;
  {
    const g = grainTile.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.drawImage(grainSmall, 0, 0, 320, 320);
  }
  const grainPattern = ctx.createPattern(grainTile, "repeat")!;
  let grainOX = 0,
    grainOY = 0,
    grainTick = 0;

  // iris fibres (pre-rolled randomness so they don't flicker randomly)
  const FIB = 260;
  const fib = Array.from({ length: FIB }, (_, i) => ({
    a: (i / FIB) * Math.PI * 2 + (Math.random() - 0.5) * 0.04,
    len: Math.pow(Math.random(), 0.7),
    ph: Math.random() * 6.28,
    w: Math.random() < 0.5 ? 0 : 1,
    tone: Math.random(),
  }));

  /* ----- sizing ----- */
  let W = 0,
    H = 0,
    dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    W = Math.max(160, box.width || canvas.clientWidth || 280);
    H = Math.max(140, box.height || canvas.clientHeight || W * 0.7);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = "";
    canvas.style.height = "";
  };
  resize();
  window.addEventListener("resize", resize);

  /* ----- input ----- */
  let lastPX = 0,
    lastPY = 0,
    lastPT = 0;
  let now = 0;
  const onMove = (e: PointerEvent) => {
    const t = performance.now() / 1000;
    const dx = e.clientX - lastPX,
      dy = e.clientY - lastPY;
    const dt = Math.max(0.008, t - lastPT);
    const speed = Math.hypot(dx, dy) / dt;
    S.interest = Math.min(1, S.interest + speed * 0.00012 + 0.02);
    lastPX = e.clientX;
    lastPY = e.clientY;
    lastPT = t;
    const box = canvas.getBoundingClientRect();
    S.px = clamp((e.clientX - (box.left + box.width / 2)) / (box.width * 0.32), -1, 1);
    S.py = clamp((e.clientY - (box.top + box.height / 2)) / (box.height * 0.32), -1, 1);
    S.lastPointer = now;
  };
  const onDown = (e: PointerEvent) => {
    onMove(e);
    S.startleT = 0;
    api.blink();
    S.sparkle = 1.4;
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerdown", onDown);

  /* ----- spring helper ----- */
  const spring = (x: number, v: number, target: number, k: number, c: number, dt: number) => {
    v += (target - x) * k * dt;
    v *= Math.exp(-c * dt);
    return [x + v * dt, v] as const;
  };

  /* ----- update ----- */
  let shownLabel = "";
  const update = (dt: number) => {
    now += dt;

    // script
    wait -= dt;
    while (wait <= 0) {
      const r = gen.next();
      wait = (r.value as number) ?? 1;
    }

    const pointerActive = now - S.lastPointer < 2.8;
    S.interest = Math.max(0, S.interest - dt * 0.35);

    // micro-saccades — more nervous when tense
    S.nextMicro -= dt;
    if (S.nextMicro <= 0) {
      const amp = 0.025 + S.tension * 0.1;
      S.mx = (rnd() - 0.5) * 2 * amp;
      S.my = (rnd() - 0.5) * 2 * amp * 0.7;
      S.nextMicro = 0.25 + rnd() * (1.3 - S.tension * 0.9);
    }
    S.mx *= Math.exp(-dt * 0.8);
    S.my *= Math.exp(-dt * 0.8);

    // gaze target + spring
    let tgx = S.sgx,
      tgy = S.sgy,
      sp = S.gazeSpeed;
    if (pointerActive) {
      tgx = S.px;
      tgy = S.py;
      sp = 0.75 + S.interest * 0.5;
    }
    // slow breathing drift
    tgx += S.mx + Math.sin(now * 0.37) * 0.015;
    tgy += S.my + Math.cos(now * 0.29) * 0.012;
    const k = 420 * sp * sp,
      c = 28 * sp;
    [S.gx, S.gvx] = spring(S.gx, S.gvx, tgx, k, c, dt);
    [S.gy, S.gvy] = spring(S.gy, S.gvy, tgy, k, c, dt);

    // startle (click): flinch → wide dilation
    let pupilT = S.pupilT,
      lidT = S.lidT;
    S.startleT += dt;
    let pk = 70;
    if (S.startleT < 0.22) {
      pupilT = 0.02;
      lidT = Math.max(lidT, 0.5);
      pk = 400;
      S.moodT = 0.9;
      S.label = "!";
    } else if (S.startleT < 1.8) {
      pupilT = 1;
      lidT = 0;
      pk = 90;
      if (S.startleT < 0.3) S.label = "oh!";
    }
    // pointer sparks interest → dilation
    if (pointerActive && S.startleT > 1.8) {
      pupilT = lerp(pupilT, 0.62 + 0.38 * S.interest, 0.7);
      lidT = Math.min(lidT, 0.04);
    }
    // constriction is quicker than dilation – like a real pupil
    if (pupilT < S.pupil) pk = Math.max(pk, 160);
    [S.pupil, S.pvel] = spring(S.pupil, S.pvel, pupilT, pk, 2 * Math.sqrt(pk) * 0.8, dt);
    [S.lid, S.lvel] = spring(S.lid, S.lvel, lidT, 110, 17, dt);

    S.mood = lerp(S.mood, S.moodT, 1 - Math.exp(-dt * 1.6));
    S.tension = lerp(S.tension, S.tensionT, 1 - Math.exp(-dt * 2.2));
    S.sparkle = lerp(S.sparkle, pointerActive ? 0.45 : 0.2, 1 - Math.exp(-dt * 0.9));

    // blinks
    S.nextBlink -= dt;
    if (S.nextBlink <= 0 && S.blinkT < 0) {
      S.blinkT = 0;
      S.doubleBlink = rnd() < 0.2 + S.tension * 0.4;
      S.nextBlink = 2.5 + rnd() * 3.5 - S.tension * 1.5;
    }
    if (S.blinkT >= 0) {
      S.blinkT += dt;
      if (S.blinkT > 0.3) {
        S.blinkT = -1;
        if (S.doubleBlink) {
          S.doubleBlink = false;
          S.nextBlink = 0.05;
        }
      }
    }

    // label reporting
    const lab = pointerActive && S.startleT > 1.8 ? "who's there?" : S.label;
    if (lab !== shownLabel) {
      shownLabel = lab;
      onLabel(lab);
    }
    if (S.startleT > 1.8 && (S.label === "!" || S.label === "oh!")) S.label = "curious…";
  };

  /* ----- draw ----- */
  const WARM_IN: RGB = [255, 158, 82];
  const COOL_IN: RGB = [226, 98, 196];
  const WARM_MID: RGB = [228, 62, 28];
  const COOL_MID: RGB = [118, 40, 176];
  const WARM_LOW: RGB = [22, 124, 122];
  const COOL_LOW: RGB = [34, 84, 178];

  const draw = (dt: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    const cx = W / 2;
    const cy = H * 0.5;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const Rr = Math.min(W * 0.42, H * 0.42);
    const t = now;
    const breath = Math.sin(t * 1.1) * 0.5 + 0.5;
    const flick = 1 + (Math.random() - 0.5) * 0.06 * S.tension;

    /* background glow */
    const m = S.mood;
    const cIn = mix3(WARM_IN, COOL_IN, m * 0.85);
    const cMid = mix3(WARM_MID, COOL_MID, m);
    const cLow = mix3(WARM_LOW, COOL_LOW, m * 0.9);

    ctx.fillStyle = "#150a1c";
    ctx.fillRect(0, 0, W, H);

    const glowR = Rr * (1.95 + 0.35 * S.pupil + 0.07 * breath + 0.12 * S.sparkle) * flick;
    let g = ctx.createRadialGradient(cx, cy - Rr * 0.12, Rr * 0.4, cx, cy - Rr * 0.12, glowR);
    g.addColorStop(0, rgba(cIn, 1));
    g.addColorStop(0.5, rgba(cIn, 0.96));
    g.addColorStop(0.68, rgba(cMid, 0.88));
    g.addColorStop(0.86, rgba(cMid, 0.28));
    g.addColorStop(1, rgba(cMid, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    g = ctx.createRadialGradient(cx, cy + Rr * 1.3, Rr * 0.2, cx, cy + Rr * 1.3, Rr * 2.5);
    g.addColorStop(0, rgba(cLow, 0.98));
    g.addColorStop(0.4, rgba(cLow, 0.78));
    g.addColorStop(0.75, rgba(mix3(cLow, [20, 10, 30], 0.6), 0.25));
    g.addColorStop(1, rgba(cLow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // olive/yellow transition between orange and teal (like the reference)
    g = ctx.createRadialGradient(cx, cy + Rr * 0.75, Rr * 0.9, cx, cy + Rr * 0.75, Rr * 1.9);
    g.addColorStop(0, rgba([230, 160, 60], 0.0));
    g.addColorStop(0.4, rgba([230, 160, 60], 0.26 * (1 - m * 0.6)));
    g.addColorStop(1, rgba([230, 160, 60], 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // vignette
    g = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.3, cx, cy, Math.max(W, H) * 0.78);
    g.addColorStop(0, "rgba(14,6,20,0)");
    g.addColorStop(1, "rgba(14,6,20,0.8)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    /* the dark ring (limbus / socket) */
    ctx.save();
    ctx.shadowColor = rgba(cIn, 0.55);
    ctx.shadowBlur = Rr * 0.12;
    ctx.beginPath();
    ctx.arc(cx, cy, Rr, 0, Math.PI * 2);
    g = ctx.createRadialGradient(cx, cy, Rr * 0.6, cx, cy, Rr);
    g.addColorStop(0, "#1c0f20");
    g.addColorStop(1, "#0d060f");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    /* iris group ---------------------------------------------------- */
    if (texA && texB) {
      const Ri = Rr * 0.88 * (1 + 0.012 * breath + 0.01 * S.pupil);
      const ix = cx + S.gx * Rr * 0.1;
      const iy = cy + S.gy * Rr * 0.085;
      const sx = 1 - 0.07 * Math.abs(S.gx);
      const sy = 1 - 0.06 * Math.abs(S.gy);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, Rr * 0.985, 0, Math.PI * 2);
      ctx.clip();
      ctx.translate(ix, iy);
      ctx.scale(sx, sy);

      const rotBase = t * (0.035 + 0.1 * S.sparkle + 0.05 * S.tension);
      const shiver = Math.sin(t * 23) * 0.004 * S.tension;

      // colour disc
      ctx.save();
      ctx.rotate(rotBase + shiver);
      ctx.drawImage(texA, -Ri, -Ri, Ri * 2, Ri * 2);
      ctx.restore();

      // counter-rotating shimmer
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.rotate(-rotBase * 1.7 + 1.2);
      const bs = 1 + 0.015 * Math.sin(t * 0.9);
      ctx.globalAlpha = 0.6 + 0.25 * S.sparkle;
      ctx.drawImage(texB, -Ri * bs, -Ri * bs, Ri * 2 * bs, Ri * 2 * bs);
      ctx.restore();

      // mood tint — doubt cools the iris, awe warms it
      ctx.save();
      ctx.globalCompositeOperation = "soft-light";
      ctx.globalAlpha = 0.55 * m;
      ctx.beginPath();
      ctx.arc(0, 0, Ri * 0.96, 0, Math.PI * 2);
      ctx.fillStyle = "rgb(110,90,255)";
      ctx.fill();
      ctx.restore();

      // limbal darkening
      g = ctx.createRadialGradient(0, 0, Ri * 0.72, 0, 0, Ri * 1.0);
      g.addColorStop(0, "rgba(28,10,40,0)");
      g.addColorStop(1, "rgba(28,10,40,0.42)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, Ri * 0.99, 0, Math.PI * 2);
      ctx.fill();

      /* pupil + fibres (parallax: pupil sits slightly "above" the iris) */
      const ox = (S.gx * Rr * 0.045) / sx;
      const oy = (S.gy * Rr * 0.04) / sy;
      ctx.translate(ox, oy);

      const hippus =
        Math.sin(t * 2.1) * 0.008 +
        Math.sin(t * 5.3 + 1) * 0.005 +
        S.tension * (Math.sin(t * 17) * 0.012 + Math.sin(t * 29 + 2) * 0.008);
      const Rp = Ri * (0.13 + 0.31 * clamp(S.pupil, -0.05, 1.05) + hippus);

      // warm glow hugging the pupil
      g = ctx.createRadialGradient(0, 0, Rp * 0.9, 0, 0, Rp * 2.3);
      g.addColorStop(0, "rgba(34,10,6,0.96)");
      g.addColorStop(0.3, "rgba(150,50,16,0.6)");
      g.addColorStop(0.7, "rgba(255,150,80,0.22)");
      g.addColorStop(1, "rgba(255,150,80,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, Rp * 2.3, 0, Math.PI * 2);
      ctx.fill();

      // radial fibres anchored to the pupil edge → they stretch as it dilates
      ctx.lineCap = "round";
      const passes: [number, number, string][] = [
        [0, Ri * 0.0065, "rgba(70,20,8,0.55)"],
        [1, Ri * 0.011, "rgba(80,24,8,0.4)"],
        [0, Ri * 0.0045, "rgba(255,168,92,0.5)"],
        [1, Ri * 0.0075, "rgba(255,206,140,0.35)"],
      ];
      for (let p = 0; p < passes.length; p++) {
        const [wcls, lw, col] = passes[p];
        const light = p >= 2;
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let i = 0; i < FIB; i++) {
          const f = fib[i];
          if (f.w !== wcls) continue;
          const a = f.a + Math.sin(t * 0.5 + f.ph) * 0.006 + (S.tension > 0.3 ? Math.sin(t * 9 + f.ph) * 0.004 * S.tension : 0);
          const reach = light ? 0.05 + f.len * 0.2 : 0.07 + f.len * 0.27;
          const r0 = Rp * 0.98;
          const r1 = Rp + Ri * reach * (0.85 + 0.3 * f.tone);
          const ca = Math.cos(a),
            sa = Math.sin(a);
          ctx.moveTo(ca * r0, sa * r0);
          ctx.lineTo(ca * r1, sa * r1);
        }
        ctx.stroke();
      }

      // iridescent fringe at the pupil margin
      const fringeW = Rp * 0.12;
      ctx.lineWidth = fringeW;
      const anyCtx = ctx as CanvasRenderingContext2D & {
        createConicGradient?: (a: number, x: number, y: number) => CanvasGradient;
      };
      if (anyCtx.createConicGradient) {
        const cg = anyCtx.createConicGradient(t * 0.25, 0, 0);
        cg.addColorStop(0, "rgba(255,214,90,0.8)");
        cg.addColorStop(0.25, "rgba(255,120,60,0.55)");
        cg.addColorStop(0.5, "rgba(190,90,230,0.6)");
        cg.addColorStop(0.75, "rgba(110,200,190,0.5)");
        cg.addColorStop(1, "rgba(255,214,90,0.8)");
        ctx.strokeStyle = cg;
      } else {
        ctx.strokeStyle = "rgba(255,190,80,0.6)";
      }
      ctx.beginPath();
      ctx.arc(0, 0, Rp * 1.05, 0, Math.PI * 2);
      ctx.stroke();

      // feathered edge + organic pupil
      g = ctx.createRadialGradient(0, 0, Rp * 0.8, 0, 0, Rp * 1.1);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, Rp * 1.1, 0, Math.PI * 2);
      ctx.fill();

      const amp = 0.012 + 0.045 * S.tension;
      ctx.beginPath();
      const N = 72;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const rr =
          Rp *
          (1 +
            amp *
              (Math.sin(a * 3 + t * 2.1) * 0.5 +
                Math.sin(a * 5 - t * 3.3) * 0.3 +
                Math.sin(a * 9 + t * 5.2 + S.tension * t * 3) * 0.2));
        const px = Math.cos(a) * rr,
          py = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, Rp);
      g.addColorStop(0, "#000");
      g.addColorStop(0.75, "#030105");
      g.addColorStop(1, "#0b0410");
      ctx.fillStyle = g;
      ctx.fill();

      ctx.restore(); // iris transform + clip
    }

    /* corneal reflections (fixed in world – the eye rolls beneath them) */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, Rr * 0.985, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = "screen";
    const hx = cx - Rr * 0.34 + S.gx * Rr * 0.02;
    const hy = cy - Rr * 0.4 + S.gy * Rr * 0.02;
    g = ctx.createRadialGradient(hx, hy, 0, hx, hy, Rr * 0.34);
    g.addColorStop(0, `rgba(255,245,235,${0.28 + 0.12 * S.sparkle})`);
    g.addColorStop(1, "rgba(255,245,235,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - Rr, cy - Rr, Rr * 2, Rr * 2);
    // crisp catch-light
    const hs = Rr * (0.04 + 0.012 * S.sparkle);
    ctx.fillStyle = `rgba(255,252,246,${0.6 + 0.25 * Math.min(1, S.sparkle)})`;
    ctx.beginPath();
    ctx.ellipse(hx - Rr * 0.02, hy - Rr * 0.02, hs * 1.3, hs, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + Rr * 0.25, cy + Rr * 0.34, hs * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,240,230,0.35)";
    ctx.fill();
    ctx.restore();

    /* lids — blink + squint (uncertainty) ----------------------------- */
    let blink = 0;
    if (S.blinkT >= 0) {
      const bt = S.blinkT;
      blink = bt < 0.09 ? bt / 0.09 : 1 - (bt - 0.09) / 0.21;
      blink = clamp(blink, 0, 1);
      blink = blink * blink * (3 - 2 * blink);
    }
    const lidV = clamp(S.lid, 0, 0.98);
    const closure = 1 - (1 - blink) * (1 - lidV);
    if (closure > 0.004) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, Rr * 1.003, 0, Math.PI * 2);
      ctx.clip();
      const ey = cy + Rr * closure * 0.18;
      const ry = Math.max(0.0001, Rr * (1 - closure) * 1.0);
      ctx.beginPath();
      ctx.rect(cx - Rr - 4, cy - Rr - 4, Rr * 2 + 8, Rr * 2 + 8);
      ctx.moveTo(cx + Rr, ey);
      ctx.ellipse(cx, ey, Rr, ry, 0, 0, Math.PI * 2, true);
      ctx.fillStyle = "#0e0711";
      ctx.fill("evenodd");
      // warm rim light on the lid edge
      ctx.beginPath();
      ctx.ellipse(cx, ey, Rr, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(cIn, 0.28);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    /* star flare ------------------------------------------------------ */
    {
      const fx = cx + Rr * 0.13 + S.gx * Rr * 0.025 + Math.sin(t * 0.4) * Rr * 0.01;
      const fy = cy - Rr * 1.21 + S.gy * Rr * 0.015;
      const I = 0.78 + 0.16 * Math.sin(t * 1.7) + 0.08 * Math.sin(t * 6.1) + S.sparkle * 0.7;
      const L = Rr * (0.95 + 0.55 * Math.min(1.5, S.sparkle));
      const tilt = -1.1 + S.gx * 0.08;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      const streak = (ang: number, len: number, back: number, a: number, wd: number) => {
        const dx = Math.cos(ang),
          dy = Math.sin(ang);
        const x0 = fx - dx * len * back,
          y0 = fy - dy * len * back;
        const x1 = fx + dx * len,
          y1 = fy + dy * len;
        const lg = ctx.createLinearGradient(x0, y0, x1, y1);
        const mid = back / (1 + back);
        lg.addColorStop(0, "rgba(255,40,20,0)");
        lg.addColorStop(mid, `rgba(255,236,224,${Math.min(1, a)})`);
        lg.addColorStop(mid + (1 - mid) * 0.3, `rgba(255,70,34,${a * 0.65})`);
        lg.addColorStop(1, "rgba(255,40,20,0)");
        ctx.strokeStyle = lg;
        ctx.lineWidth = wd;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      };
      streak(tilt, L, 0.28, 0.95 * I, 2.4);
      streak(tilt - 0.5, L * 0.55, 0.2, 0.5 * I, 1.6);
      streak(tilt + 1.57, L * 0.15, 1, 0.5 * I, 1.2);
      streak(0.2, L * 0.22, 1, 0.55 * I, 1.2);
      streak(0.2 + 1.7, L * 0.12, 1, 0.35 * I, 1);

      // halo + core
      const hr = Rr * (0.2 + 0.1 * S.sparkle);
      g = ctx.createRadialGradient(fx, fy, 0, fx, fy, hr);
      g.addColorStop(0, `rgba(255,250,240,${Math.min(1, 0.95 * I)})`);
      g.addColorStop(0.12, `rgba(255,220,180,${0.55 * I})`);
      g.addColorStop(0.4, `rgba(255,110,50,${0.18 * I})`);
      g.addColorStop(1, "rgba(255,80,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fx, fy, hr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* film grain ------------------------------------------------------ */
    grainTick++;
    if (grainTick % 3 === 0) {
      grainOX = Math.floor(Math.random() * 320);
      grainOY = Math.floor(Math.random() * 320);
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, -grainOX, -grainOY);
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = grainPattern;
    ctx.fillRect(grainOX, grainOY, canvas.width + 320, canvas.height + 320);
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    void dt;
  };

  /* ----- main loop ----- */
  let raf = 0;
  let last = performance.now();
  let alive = true;
  const frame = (tNow: number) => {
    if (!alive) return;
    const dt = Math.min(0.05, (tNow - last) / 1000);
    last = tNow;
    update(dt);
    draw(dt);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  // build the heavy textures after first paint so the page appears instantly
  const buildTimer = window.setTimeout(() => {
    texA = makeIrisTexture(texSize, 0);
    texB = makeIrisTexture(texSize, 1);
    S.lid = 0.95; // eye opens slowly on awakening
  }, 30);

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.clearTimeout(buildTimer);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
  };
}

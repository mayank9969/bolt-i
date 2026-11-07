"use strict";
(() => {
  // src/practice-eye/noise.ts
  var P = new Uint8Array(512);
  (() => {
    const base = Array.from({ length: 256 }, (_, i) => i);
    let s = 1337;
    const rnd = () => {
      s = s * 1664525 + 1013904223 >>> 0;
      return s / 4294967296;
    };
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    for (let i = 0; i < 512; i++) P[i] = base[i & 255];
  })();
  var fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  var lerp = (a, b, t) => a + (b - a) * t;
  var h3 = (x, y, z) => P[P[P[x & 255] + (y & 255)] + (z & 255)] / 255;
  function noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = fade(xf), v = fade(yf), w = fade(zf);
    const c000 = h3(xi, yi, zi), c100 = h3(xi + 1, yi, zi), c010 = h3(xi, yi + 1, zi), c110 = h3(xi + 1, yi + 1, zi), c001 = h3(xi, yi, zi + 1), c101 = h3(xi + 1, yi, zi + 1), c011 = h3(xi, yi + 1, zi + 1), c111 = h3(xi + 1, yi + 1, zi + 1);
    return lerp(
      lerp(lerp(c000, c100, u), lerp(c010, c110, u), v),
      lerp(lerp(c001, c101, u), lerp(c011, c111, u), v),
      w
    );
  }
  function fbm3(x, y, z, oct = 3) {
    let amp = 0.5, f = 1, sum = 0, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * noise3(x * f, y * f, z * f);
      norm += amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return sum / norm;
  }

  // src/practice-eye/iris.ts
  var clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  var smooth = (a, b, x) => {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  var mix = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
  var PAL = [
    { at: 0, c: [70, 196, 214] },
    // teal / cyan
    { at: 0.22, c: [150, 226, 224] },
    // aqua
    { at: 0.42, c: [255, 232, 224] },
    // pearl
    { at: 0.6, c: [248, 170, 196] },
    // pink
    { at: 0.78, c: [200, 166, 238] },
    // lavender
    { at: 1, c: [255, 190, 140] }
    // peach
  ];
  function pal(v) {
    v = clamp01(v);
    for (let i = 1; i < PAL.length; i++) {
      if (v <= PAL[i].at) {
        const a = PAL[i - 1], b = PAL[i];
        return mix(a.c, b.c, (v - a.at) / (b.at - a.at));
      }
    }
    return PAL[PAL.length - 1].c;
  }
  function makeIrisTexture(size, kind) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const ctx = cv.getContext("2d");
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
        const ct = Math.cos(th), st = Math.sin(th);
        const edge = 0.92 + 0.07 * (noise3(ct * 7 + seed, st * 7, 1) - 0.5) * 2 + 0.045 * (noise3(ct * 70 + seed, st * 70, 9) - 0.5) * 2 + 0.02 * (noise3(ct * 160, st * 160, 3) - 0.5) * 2;
        const edgeA = clamp01((edge - r) / 0.012);
        if (edgeA <= 0) continue;
        const s1 = noise3(ct * 55 + seed, st * 55, r * 2.5);
        const s2 = noise3(ct * 140 + seed, st * 140, r * 1.2 + 5);
        if (kind === 0) {
          const warp = (noise3(ct * 0.9 + 11, st * 0.9, r * 2) - 0.5) * 1.3;
          const phi = th - 3.3 * Math.pow(r, 1.25) + warp;
          let val = fbm3(Math.cos(phi) * 1.35, Math.sin(phi) * 1.35, r * 2.4, 3);
          val = clamp01((val - 0.5) * 2 + 0.5);
          let col = pal(val);
          const bright = (0.8 + 0.4 * s1) * (0.92 + 0.16 * s2);
          col = [col[0] * bright, col[1] * bright, col[2] * bright];
          const eo = 0.47 + 0.1 * (noise3(ct * 6, st * 6, 2) - 0.5) * 2 + 0.07 * (noise3(ct * 38, st * 38, 4) - 0.5) * 2;
          const om = smooth(eo + 0.13, eo - 0.08, r);
          let orange = mix([255, 182, 118], [205, 86, 34], smooth(0.5, 0.14, r));
          orange = mix(orange, [96, 34, 16], smooth(0.22, 0.1, r));
          const ob = 0.7 + 0.6 * s1;
          orange = [orange[0] * ob, orange[1] * ob, orange[2] * ob];
          const fin = mix(col, orange, om);
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

  // src/practice-eye/engine.ts
  var lerp2 = (a, b, t) => a + (b - a) * t;
  var clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  var mix3 = (a, b, t) => [
    lerp2(a[0], b[0], t),
    lerp2(a[1], b[1], t),
    lerp2(a[2], b[2], t)
  ];
  var rgba = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
  var makeState = () => ({
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
    label: ""
  });
  function* script(S, R, api) {
    const sign = () => R() < 0.5 ? -1 : 1;
    S.sgx = 0;
    S.sgy = 0;
    yield 1.4;
    while (true) {
      api.say("curious\u2026");
      api.set({ pupil: 0.48, lid: 0.05, mood: 0.14, tension: 0.08 });
      for (let i = 0; i < 2; i++) {
        api.look((R() - 0.5) * 1.3, (R() - 0.5) * 0.9, 0.35);
        yield 1.5 + R() * 1.3;
      }
      const tx = sign() * (0.55 + R() * 0.35);
      const ty = (R() - 0.6) * 0.8;
      api.blink();
      yield 0.25;
      api.say("wait\u2026 what's that?");
      api.look(tx, ty, 1.1);
      api.set({ pupil: 0.86, lid: 0, mood: 0.2, tension: 0.25 });
      api.spark(1);
      yield 1.2;
      api.say("closer\u2026");
      for (const v of [0.98, 0.68, 1, 0.76, 0.96]) {
        api.set({ pupil: v });
        api.look(tx * (0.85 + R() * 0.2), ty * (0.8 + R() * 0.3), 1.2);
        yield 0.5 + R() * 0.35;
      }
      api.say("is it safe?");
      api.set({ pupil: 0.12, lid: 0.34, mood: 1, tension: 0.9 });
      api.look(-tx * 0.8, -ty * 0.3 + 0.25, 1.5);
      yield 1.1;
      api.say("hmm\u2026");
      api.set({ pupil: 0.42, lid: 0.2, tension: 0.7 });
      api.look(tx * 0.25, ty * 0.25, 0.24);
      yield 1.7;
      api.set({ pupil: 0.16, lid: 0.32, tension: 0.95 });
      api.look(-tx * 0.4, ty * 0.5 + 0.2, 1.3);
      api.blink();
      yield 0.9;
      api.say("maybe\u2026");
      api.set({ pupil: 0.58, lid: 0.1, tension: 0.6 });
      api.look(tx * 0.6, ty * 0.6, 0.3);
      yield 1.8;
      if (R() < 0.65) {
        api.say("oh\u2026");
        api.look(0, 0, 0.22);
        api.set({ pupil: 1, lid: 0, mood: 0, tension: 0 });
        api.spark(1.5);
        yield 2.2;
        api.say("i want to know everything.");
        api.spark(0.9);
        yield 3.2;
      } else {
        api.say("never mind\u2026");
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
  function startEye(canvas, onLabel) {
    const ctx = canvas.getContext("2d", { alpha: false });
    const S = makeState();
    const rnd = () => Math.random();
    const api = {
      say: (s) => S.label = s,
      look: (x, y, speed = 1) => {
        S.sgx = clamp(x, -1, 1);
        S.sgy = clamp(y, -1, 1);
        S.gazeSpeed = speed;
      },
      set: (p) => {
        if (p.pupil !== void 0) S.pupilT = p.pupil;
        if (p.lid !== void 0) S.lidT = p.lid;
        if (p.mood !== void 0) S.moodT = p.mood;
        if (p.tension !== void 0) S.tensionT = p.tension;
      },
      blink: () => {
        if (S.blinkT < 0) S.blinkT = 0;
      },
      spark: (v) => S.sparkle = Math.max(S.sparkle, v)
    };
    const gen = script(S, rnd, api);
    let wait = 0;
    const texSize = 640;
    let texA = null;
    let texB = null;
    const grainSmall = document.createElement("canvas");
    grainSmall.width = grainSmall.height = 160;
    {
      const g = grainSmall.getContext("2d");
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
      const g = grainTile.getContext("2d");
      g.imageSmoothingEnabled = false;
      g.drawImage(grainSmall, 0, 0, 320, 320);
    }
    const grainPattern = ctx.createPattern(grainTile, "repeat");
    let grainOX = 0, grainOY = 0, grainTick = 0;
    const FIB = 260;
    const fib = Array.from({ length: FIB }, (_, i) => ({
      a: i / FIB * Math.PI * 2 + (Math.random() - 0.5) * 0.04,
      len: Math.pow(Math.random(), 0.7),
      ph: Math.random() * 6.28,
      w: Math.random() < 0.5 ? 0 : 1,
      tone: Math.random()
    }));
    let W = 0, H = 0, dpr = 1;
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
    let lastPX = 0, lastPY = 0, lastPT = 0;
    let now = 0;
    const onMove = (e) => {
      const t = performance.now() / 1e3;
      const dx = e.clientX - lastPX, dy = e.clientY - lastPY;
      const dt = Math.max(8e-3, t - lastPT);
      const speed = Math.hypot(dx, dy) / dt;
      S.interest = Math.min(1, S.interest + speed * 12e-5 + 0.02);
      lastPX = e.clientX;
      lastPY = e.clientY;
      lastPT = t;
      const box = canvas.getBoundingClientRect();
      S.px = clamp((e.clientX - (box.left + box.width / 2)) / (box.width * 0.32), -1, 1);
      S.py = clamp((e.clientY - (box.top + box.height / 2)) / (box.height * 0.32), -1, 1);
      S.lastPointer = now;
    };
    const onDown = (e) => {
      onMove(e);
      S.startleT = 0;
      api.blink();
      S.sparkle = 1.4;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    const spring = (x, v, target, k, c, dt) => {
      v += (target - x) * k * dt;
      v *= Math.exp(-c * dt);
      return [x + v * dt, v];
    };
    let shownLabel = "";
    const update = (dt) => {
      now += dt;
      wait -= dt;
      while (wait <= 0) {
        const r = gen.next();
        wait = r.value ?? 1;
      }
      const pointerActive = now - S.lastPointer < 2.8;
      S.interest = Math.max(0, S.interest - dt * 0.35);
      S.nextMicro -= dt;
      if (S.nextMicro <= 0) {
        const amp = 0.025 + S.tension * 0.1;
        S.mx = (rnd() - 0.5) * 2 * amp;
        S.my = (rnd() - 0.5) * 2 * amp * 0.7;
        S.nextMicro = 0.25 + rnd() * (1.3 - S.tension * 0.9);
      }
      S.mx *= Math.exp(-dt * 0.8);
      S.my *= Math.exp(-dt * 0.8);
      let tgx = S.sgx, tgy = S.sgy, sp = S.gazeSpeed;
      if (pointerActive) {
        tgx = S.px;
        tgy = S.py;
        sp = 0.75 + S.interest * 0.5;
      }
      tgx += S.mx + Math.sin(now * 0.37) * 0.015;
      tgy += S.my + Math.cos(now * 0.29) * 0.012;
      const k = 420 * sp * sp, c = 28 * sp;
      [S.gx, S.gvx] = spring(S.gx, S.gvx, tgx, k, c, dt);
      [S.gy, S.gvy] = spring(S.gy, S.gvy, tgy, k, c, dt);
      let pupilT = S.pupilT, lidT = S.lidT;
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
      if (pointerActive && S.startleT > 1.8) {
        pupilT = lerp2(pupilT, 0.62 + 0.38 * S.interest, 0.7);
        lidT = Math.min(lidT, 0.04);
      }
      if (pupilT < S.pupil) pk = Math.max(pk, 160);
      [S.pupil, S.pvel] = spring(S.pupil, S.pvel, pupilT, pk, 2 * Math.sqrt(pk) * 0.8, dt);
      [S.lid, S.lvel] = spring(S.lid, S.lvel, lidT, 110, 17, dt);
      S.mood = lerp2(S.mood, S.moodT, 1 - Math.exp(-dt * 1.6));
      S.tension = lerp2(S.tension, S.tensionT, 1 - Math.exp(-dt * 2.2));
      S.sparkle = lerp2(S.sparkle, pointerActive ? 0.45 : 0.2, 1 - Math.exp(-dt * 0.9));
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
      const lab = pointerActive && S.startleT > 1.8 ? "who's there?" : S.label;
      if (lab !== shownLabel) {
        shownLabel = lab;
        onLabel(lab);
      }
      if (S.startleT > 1.8 && (S.label === "!" || S.label === "oh!")) S.label = "curious\u2026";
    };
    const WARM_IN = [255, 158, 82];
    const COOL_IN = [226, 98, 196];
    const WARM_MID = [228, 62, 28];
    const COOL_MID = [118, 40, 176];
    const WARM_LOW = [22, 124, 122];
    const COOL_LOW = [34, 84, 178];
    const draw = (dt) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      const cx = W / 2;
      const cy = H * 0.5;
      const Rr = Math.min(W * 0.4, H * 0.34);
      const t = now;
      const breath = Math.sin(t * 1.1) * 0.5 + 0.5;
      const flick = 1 + (Math.random() - 0.5) * 0.06 * S.tension;
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
      g = ctx.createRadialGradient(cx, cy + Rr * 0.75, Rr * 0.9, cx, cy + Rr * 0.75, Rr * 1.9);
      g.addColorStop(0, rgba([230, 160, 60], 0));
      g.addColorStop(0.4, rgba([230, 160, 60], 0.26 * (1 - m * 0.6)));
      g.addColorStop(1, rgba([230, 160, 60], 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      g = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.3, cx, cy, Math.max(W, H) * 0.78);
      g.addColorStop(0, "rgba(14,6,20,0)");
      g.addColorStop(1, "rgba(14,6,20,0.8)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
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
        const shiver = Math.sin(t * 23) * 4e-3 * S.tension;
        ctx.save();
        ctx.rotate(rotBase + shiver);
        ctx.drawImage(texA, -Ri, -Ri, Ri * 2, Ri * 2);
        ctx.restore();
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.rotate(-rotBase * 1.7 + 1.2);
        const bs = 1 + 0.015 * Math.sin(t * 0.9);
        ctx.globalAlpha = 0.6 + 0.25 * S.sparkle;
        ctx.drawImage(texB, -Ri * bs, -Ri * bs, Ri * 2 * bs, Ri * 2 * bs);
        ctx.restore();
        ctx.save();
        ctx.globalCompositeOperation = "soft-light";
        ctx.globalAlpha = 0.55 * m;
        ctx.beginPath();
        ctx.arc(0, 0, Ri * 0.96, 0, Math.PI * 2);
        ctx.fillStyle = "rgb(110,90,255)";
        ctx.fill();
        ctx.restore();
        g = ctx.createRadialGradient(0, 0, Ri * 0.72, 0, 0, Ri * 1);
        g.addColorStop(0, "rgba(28,10,40,0)");
        g.addColorStop(1, "rgba(28,10,40,0.42)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, Ri * 0.99, 0, Math.PI * 2);
        ctx.fill();
        const ox = S.gx * Rr * 0.045 / sx;
        const oy = S.gy * Rr * 0.04 / sy;
        ctx.translate(ox, oy);
        const hippus = Math.sin(t * 2.1) * 8e-3 + Math.sin(t * 5.3 + 1) * 5e-3 + S.tension * (Math.sin(t * 17) * 0.012 + Math.sin(t * 29 + 2) * 8e-3);
        const Rp = Ri * (0.13 + 0.31 * clamp(S.pupil, -0.05, 1.05) + hippus);
        g = ctx.createRadialGradient(0, 0, Rp * 0.9, 0, 0, Rp * 2.3);
        g.addColorStop(0, "rgba(34,10,6,0.96)");
        g.addColorStop(0.3, "rgba(150,50,16,0.6)");
        g.addColorStop(0.7, "rgba(255,150,80,0.22)");
        g.addColorStop(1, "rgba(255,150,80,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, Rp * 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineCap = "round";
        const passes = [
          [0, Ri * 65e-4, "rgba(70,20,8,0.55)"],
          [1, Ri * 0.011, "rgba(80,24,8,0.4)"],
          [0, Ri * 45e-4, "rgba(255,168,92,0.5)"],
          [1, Ri * 75e-4, "rgba(255,206,140,0.35)"]
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
            const a = f.a + Math.sin(t * 0.5 + f.ph) * 6e-3 + (S.tension > 0.3 ? Math.sin(t * 9 + f.ph) * 4e-3 * S.tension : 0);
            const reach = light ? 0.05 + f.len * 0.2 : 0.07 + f.len * 0.27;
            const r0 = Rp * 0.98;
            const r1 = Rp + Ri * reach * (0.85 + 0.3 * f.tone);
            const ca = Math.cos(a), sa = Math.sin(a);
            ctx.moveTo(ca * r0, sa * r0);
            ctx.lineTo(ca * r1, sa * r1);
          }
          ctx.stroke();
        }
        const fringeW = Rp * 0.12;
        ctx.lineWidth = fringeW;
        const anyCtx = ctx;
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
          const a = i / N * Math.PI * 2;
          const rr = Rp * (1 + amp * (Math.sin(a * 3 + t * 2.1) * 0.5 + Math.sin(a * 5 - t * 3.3) * 0.3 + Math.sin(a * 9 + t * 5.2 + S.tension * t * 3) * 0.2));
          const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
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
        ctx.restore();
      }
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
      let blink = 0;
      if (S.blinkT >= 0) {
        const bt = S.blinkT;
        blink = bt < 0.09 ? bt / 0.09 : 1 - (bt - 0.09) / 0.21;
        blink = clamp(blink, 0, 1);
        blink = blink * blink * (3 - 2 * blink);
      }
      const lidV = clamp(S.lid, 0, 0.98);
      const closure = 1 - (1 - blink) * (1 - lidV);
      if (closure > 4e-3) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, Rr * 1.003, 0, Math.PI * 2);
        ctx.clip();
        const ey = cy + Rr * closure * 0.18;
        const ry = Math.max(1e-4, Rr * (1 - closure) * 1);
        ctx.beginPath();
        ctx.rect(cx - Rr - 4, cy - Rr - 4, Rr * 2 + 8, Rr * 2 + 8);
        ctx.moveTo(cx + Rr, ey);
        ctx.ellipse(cx, ey, Rr, ry, 0, 0, Math.PI * 2, true);
        ctx.fillStyle = "#0e0711";
        ctx.fill("evenodd");
        ctx.beginPath();
        ctx.ellipse(cx, ey, Rr, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(cIn, 0.28);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
      {
        const fx = cx + Rr * 0.13 + S.gx * Rr * 0.025 + Math.sin(t * 0.4) * Rr * 0.01;
        const fy = cy - Rr * 1.21 + S.gy * Rr * 0.015;
        const I = 0.78 + 0.16 * Math.sin(t * 1.7) + 0.08 * Math.sin(t * 6.1) + S.sparkle * 0.7;
        const L = Rr * (0.95 + 0.55 * Math.min(1.5, S.sparkle));
        const tilt = -1.1 + S.gx * 0.08;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        const streak = (ang, len, back, a, wd) => {
          const dx = Math.cos(ang), dy = Math.sin(ang);
          const x0 = fx - dx * len * back, y0 = fy - dy * len * back;
          const x1 = fx + dx * len, y1 = fy + dy * len;
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
      grainTick++;
      if (grainTick % 3 === 0) {
        grainOX = Math.floor(Math.random() * 320);
        grainOY = Math.floor(Math.random() * 320);
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, -grainOX, -grainOY);
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = grainPattern;
      ctx.fillRect(grainOX, grainOY, canvas.width + 320, canvas.height + 320);
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    };
    let raf = 0;
    let last = performance.now();
    let alive = true;
    const frame = (tNow) => {
      if (!alive) return;
      const dt = Math.min(0.05, (tNow - last) / 1e3);
      last = tNow;
      update(dt);
      draw(dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const buildTimer = window.setTimeout(() => {
      texA = makeIrisTexture(texSize, 0);
      texB = makeIrisTexture(texSize, 1);
      S.lid = 0.95;
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

  // src/practice-eye/browser.ts
  window.startVeyraEye = (canvas, onLabel) => startEye(canvas, onLabel ?? (() => {
  }));
})();

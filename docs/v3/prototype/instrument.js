// VEYRA v3 — "The Instrument": ONE 3D system used across the site.
// Almanac dial (Today) · timer ring (Quiz) · score ring (Result) · 30-day relief (Progress) · balance (Learn)
// Enhancement, never dependency: if WebGL is missing the SVG/CSS fallbacks stay visible.
import * as THREE from './vendor/three.module.min.js';

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = () => getComputedStyle(document.documentElement);
const tok = n => new THREE.Color(css().getPropertyValue(n).trim());
const scenes = [];
const status = (t) => { const el = document.getElementById('glstatus'); if (el) el.textContent = t; };
status('3D: module loaded');
const mats = []; // {mat, token}
export const M = (token, extra={}) => { const m = new THREE.MeshStandardMaterial({ color: tok(token), roughness: .92, metalness: 0, ...extra }); mats.push({ m, token }); return m; };
const retheme = () => mats.forEach(({ m, token }) => m.color.copy(tok(token)));
new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
export const fitW = (cam, halfW, dist, minFov) => { const f = 2 * Math.atan((halfW / cam.aspect) / dist) * 180 / Math.PI; const v = Math.max(minFov, f); if (Math.abs(v - cam.fov) > .1) { cam.fov = v; cam.updateProjectionMatrix(); } };
export const ease = x => 1 - Math.pow(1 - x, 3);
export const mouse = { x: 0, y: 0 };
addEventListener('pointermove', e => { mouse.x = (e.clientX / innerWidth - .5) * 2; mouse.y = (e.clientY / innerHeight - .5) * 2; }, { passive: true });

export function lights(scene, shadowSize = 10) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfbf, 2.3));
  const d = new THREE.DirectionalLight(0xfff4e6, 2.7); d.position.set(-5, 8, 4); d.castShadow = true;
  d.shadow.mapSize.set(1024, 1024); d.shadow.camera.left = d.shadow.camera.bottom = -shadowSize; d.shadow.camera.right = d.shadow.camera.top = shadowSize;
  d.shadow.radius = 6; d.shadow.bias = -0.0005; scene.add(d);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .16 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.001; ground.receiveShadow = true; scene.add(ground);
}

export function mount(host, build) {
  const canvas = document.createElement('canvas'); canvas.className = 'gl'; host.prepend(canvas);
  let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); } catch (e) { canvas.remove(); status('3D: off — WebGL unavailable (' + e.message + ') — showing flat fallback'); return; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.classList.add('has-gl');
  const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(30, 1, .1, 100);
  const api = { scene, cam, canvas, host, start: performance.now(), shown: 0 };
  api.update = build(api) || (() => {});
  const fit = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  new ResizeObserver(fit).observe(host); fit();
  scenes.push({ api, renderer, visible: () => host.offsetParent !== null });
  status('3D: on — ' + scenes.length + ' scene(s), ' + (renderer.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1'));
}

function tick(now) {
  for (const s of scenes) {
    if (s.dead) continue;
    if (!s.visible()) { s.api.shown = 0; continue; }
    if (!s.api.shown) s.api.shown = now;
    try { s.api.update(now, (now - s.api.shown) / 1000); s.renderer.render(s.api.scene, s.api.cam); }
    catch (e) { s.api.host.classList.remove('has-gl'); s.api.canvas.remove(); s.dead = true; status('3D ERROR: ' + e.message); }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ───────────────────────── 1 · Almanac dial (Today)
export function dial(host, due) {
  mount(host, ({ scene, cam }) => {
    lights(scene);
    cam.position.set(0, 9.6, 8.8); cam.lookAt(0, 0.1, 0); cam.fov = 32; cam.updateProjectionMatrix();
    const g = new THREE.Group(); scene.add(g);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, .22, 128), M('--card')); base.receiveShadow = true; base.castShadow = true; base.position.y = .11; g.add(base);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(3.3, .035, 12, 160), M('--line2')); lip.rotation.x = Math.PI / 2; lip.position.y = .22; g.add(lip);
    const groove = new THREE.Mesh(new THREE.TorusGeometry(2.15, .018, 8, 160), M('--line2')); groove.rotation.x = Math.PI / 2; groove.position.y = .225; g.add(groove);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, .08, 96), M('--surface')); hub.position.y = .26; hub.receiveShadow = true; g.add(hub);
    const ticks = due.map((n, i) => {
      const h = .12 + Math.min(n, 14) * .13, a = -i * (Math.PI * 2 / 30) + Math.PI / 2;
      const m = new THREE.Mesh(new THREE.BoxGeometry(.12, 1, .42), M(i === 0 ? '--accent' : n ? '--retained' : '--line2'));
      m.castShadow = m.receiveShadow = true; m.position.set(Math.cos(a) * 2.72, .22, -Math.sin(a) * 2.72); m.rotation.y = a + Math.PI / 2; m.userData.h = h; m.scale.y = 0.001; g.add(m); return m;
    });
    // slowly sweeping outer hand (the only thing that moves on its own)
    const hand = new THREE.Group(); const arm = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, 1.2), M('--text')); arm.position.z = -2.0; arm.castShadow = true; hand.add(arm);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(.09, 24, 24), M('--accent')); pin.position.z = -2.6; hand.add(pin); hand.position.y = .34; g.add(hand);
    return (now, t) => {
      ticks.forEach((m, i) => { const k = ease(Math.min(1, Math.max(0, (t - i * .025) / .8))); m.scale.y = Math.max(.001, m.userData.h * k); m.position.y = .22 + m.scale.y / 2; });
      if (!reduced) { hand.rotation.y = -t * .12; g.rotation.x += ((mouse.y * .10) - g.rotation.x) * .05; g.rotation.z += ((-mouse.x * .10) - g.rotation.z) * .05; }
    };
  });
}

// ───────────────────────── 2 · Timer ring (Quiz)  — same ring, now a clock
export function timer(host, getFrac) {
  mount(host, ({ scene, cam }) => {
    lights(scene, 3);
    cam.position.set(0, 3.8, 3.2); cam.lookAt(0, 0, 0);
    const track = new THREE.Mesh(new THREE.TorusGeometry(1, .13, 16, 96), M('--surface')); track.rotation.x = Math.PI / 2; track.position.y = .13; track.receiveShadow = true; scene.add(track);
    let arc = null; const mat = M('--accent');
    return () => {
      const f = Math.max(.001, getFrac());
      if (arc) { arc.geometry.dispose(); scene.remove(arc); }
      arc = new THREE.Mesh(new THREE.TorusGeometry(1, .16, 16, 96, Math.PI * 2 * f), mat); arc.rotation.x = Math.PI / 2; arc.rotation.z = Math.PI / 2; arc.position.y = .16; arc.castShadow = true; scene.add(arc);
    };
  });
}

// ───────────────────────── 3 · Score ring (Result) — ring fills, 10 question blocks around it
export function score(host, pct, outcomes) {
  mount(host, ({ scene, cam }) => {
    lights(scene, 4);
    cam.position.set(0, 7.0, 5.8); cam.lookAt(0, 0, 0);
    const g = new THREE.Group(); scene.add(g);
    const track = new THREE.Mesh(new THREE.TorusGeometry(1.5, .12, 16, 128), M('--surface')); track.rotation.x = Math.PI / 2; track.position.y = .12; track.receiveShadow = true; g.add(track);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, .08, 96), M('--card')); plate.position.y = .04; plate.receiveShadow = true; g.add(plate);
    const blocks = outcomes.map((o, i) => {
      const a = -i * (Math.PI * 2 / outcomes.length) + Math.PI / 2;
      const m = new THREE.Mesh(new THREE.BoxGeometry(.16, .5, .3), M(o === 1 ? '--retained' : o === 2 ? '--t3' : '--accent')); m.castShadow = true;
      m.position.set(Math.cos(a) * 2.0, .25, -Math.sin(a) * 2.0); m.rotation.y = a + Math.PI / 2; m.scale.y = .001; g.add(m); return m;
    });
    let arc = null; const mat = M('--retained');
    return (now, t) => {
      const f = Math.max(.002, pct * ease(Math.min(1, t / 1.6)));
      if (arc) { arc.geometry.dispose(); g.remove(arc); }
      arc = new THREE.Mesh(new THREE.TorusGeometry(1.5, .15, 16, 128, Math.PI * 2 * f), mat); arc.rotation.x = Math.PI / 2; arc.rotation.z = Math.PI / 2; arc.position.y = .15; arc.castShadow = true; g.add(arc);
      blocks.forEach((m, i) => { const k = ease(Math.min(1, Math.max(0, (t - .4 - i * .07) / .5))); m.scale.y = Math.max(.001, k); m.position.y = .25 * k; });
      if (!reduced) g.rotation.y += ((mouse.x * .18) - g.rotation.y) * .05;
    };
  });
}

// ───────────────────────── 4 · 30-day relief (Progress) — the dial's ticks, unrolled
export function relief(host, days) {
  mount(host, ({ scene, cam }) => {
    lights(scene, 9);
    cam.position.set(1.5, 4.0, 7.5); cam.lookAt(0, .4, 0); cam.fov = 26; cam.updateProjectionMatrix();
    const g = new THREE.Group(); scene.add(g);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(10.4, .14, 1.4), M('--card')); slab.position.y = .07; slab.receiveShadow = true; g.add(slab);
    const bars = days.map((d, i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(.22, 1, .6), M(i === days.length - 1 ? '--accent' : d ? '--retained' : '--line2')); m.castShadow = m.receiveShadow = true;
      m.position.set(-4.95 + i * (9.9 / 29), .14, 0); m.userData.h = d ? .15 + d * .22 : .06; m.scale.y = .001; g.add(m); return m;
    });
    return (now, t) => {
      fitW(cam, 5.7, 8.6, 26);
      bars.forEach((m, i) => { const k = ease(Math.min(1, Math.max(0, (t - i * .03) / .7))); m.scale.y = Math.max(.001, m.userData.h * k); m.position.y = .14 + m.scale.y / 2; });
      if (!reduced) g.rotation.y += ((mouse.x * .08) - g.rotation.y) * .05;
    };
  });
}

// ───────────────────────── 5 · Balance (Learn) — content-driven: the lesson's own diagram, in 3D
export function balance(host, getStep) {
  mount(host, ({ scene, cam }) => {
    lights(scene, 6);
    cam.position.set(0, 2.6, 7.5); cam.lookAt(0, 1.0, 0); cam.fov = 28; cam.updateProjectionMatrix();
    const g = new THREE.Group(); scene.add(g);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, 2.2, 24), M('--text')); post.position.y = 1.1; post.castShadow = true; g.add(post);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(.7, .8, .12, 48), M('--card')); foot.position.y = .06; foot.receiveShadow = true; g.add(foot);
    const beam = new THREE.Group(); beam.position.y = 2.2; g.add(beam);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(5.2, .1, .14), M('--text')); bar.castShadow = true; beam.add(bar);
    const pans = [-2.3, 2.3].map(x => {
      const p = new THREE.Group(); p.position.x = x; beam.add(p);
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.1, 8), M('--line2')); wire.position.y = -.55; p.add(wire);
      const pan = new THREE.Mesh(new THREE.CylinderGeometry(.95, .85, .08, 48), M('--surface')); pan.position.y = -1.1; pan.receiveShadow = true; pan.castShadow = true; p.add(pan);
      return p;
    });
    const boxMat = M('--accent'), unitMat = M('--retained');
    const boxes = [], units = [];
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .5), boxMat); b.position.set(-.55 + i * .55, -1.06 + .25, 0); b.castShadow = true; pans[0].add(b); boxes.push(b); }
    for (let i = 0; i < 5; i++) { const u = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .2), unitMat); u.position.set(-.6 + i * .3, -1.06 + .1, .5); u.castShadow = true; pans[0].add(u); units.push({ m: u, side: 0, idx: i }); }
    for (let i = 0; i < 20; i++) { const u = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .2), unitMat); u.position.set(-.6 + (i % 5) * .3, -1.06 + .1 + Math.floor(i / 5) * .22, 0); u.castShadow = true; pans[1].add(u); units.push({ m: u, side: 1, idx: i }); }
    return (now, t) => {
      fitW(cam, 3.5, 7.6, 28);
      const step = getStep(); // 1: 3x+5=20   2: 3x=15   3: x=5
      boxes.forEach((b, i) => { const on = step < 3 || i === 0; b.scale.setScalar(b.scale.x + ((on ? 1 : .001) - b.scale.x) * .12); });
      units.forEach(({ m, side, idx }) => {
        let on = true;
        if (side === 0) on = step < 2;
        if (side === 1) on = step < 2 ? true : step === 2 ? idx < 15 : idx < 5;
        m.scale.setScalar(m.scale.x + ((on ? 1 : .001) - m.scale.x) * .12);
      });
      if (!reduced) { beam.rotation.z = Math.sin(t * 1.4) * .012; g.rotation.y += ((mouse.x * .25) - g.rotation.y) * .05; }
    };
  });
}

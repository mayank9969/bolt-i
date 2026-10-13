// VEYRA v3 — "Folded Atlas" hero.
// Warm paper unfolds (one big fold, then a three-panel accordion) into a layered relief map.
// Regions sit on the map; regions with questions due today rise as terracotta markers;
// teal paths link regions that have been studied together. Enhancement only: SVG fallback stays underneath.
import * as THREE from './vendor/three.module.min.js';
import { mount, lights, M, ease, reduced, mouse, fitW } from './instrument.js';

const PW = 2.2, PD = 2.0;               // panel width (x) and depth (z): 3 columns × 2 rows = 6.6 × 4.0 sheet
const clamp01 = x => Math.min(1, Math.max(0, x));
const seg = (t, a, b) => ease(clamp01((t - a) / (b - a)));

function blob(cx, cz, r, k, n = 7) {    // soft organic outline for a relief terrace
  const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const rr = r * (0.78 + 0.22 * Math.sin(a * 3 + k) + 0.1 * Math.cos(a * 5 + k * 2)); pts.push(new THREE.Vector3(cx + Math.cos(a) * rr, 0, cz + Math.sin(a) * rr)); }
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', .6); const p = curve.getPoints(60);
  // shape is drawn in (x, -z) so that after rotation.x = -90° it lies on the sheet in world (x, z)
  const sh = new THREE.Shape(); sh.moveTo(p[0].x, -p[0].z); p.slice(1).forEach(v => sh.lineTo(v.x, -v.z)); sh.closePath(); return { sh, pts: p };
}
function inside(pts, x, z) {           // point-in-polygon (ray casting) on the terrace outline
  let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a.z > z) !== (b.z > z) && x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x) c = !c; } return c;
}

export function atlas(host, regions, links) {
  const labelsEl = document.createElement('div'); labelsEl.className = 'atlas-labels'; host.appendChild(labelsEl);
  mount(host, ({ scene, cam }) => {
    lights(scene, 7);
    cam.position.set(0, 5.6, 6.6); cam.lookAt(0, .1, 0);
    const root = new THREE.Group(); scene.add(root);

    // ── paper: two rows (hinged on the centre fold) × three columns (accordion) ──
    const paper = M('--card', { roughness: .96 });
    const panel = () => { const m = new THREE.Mesh(new THREE.BoxGeometry(PW, .035, PD), paper); m.castShadow = m.receiveShadow = true; return m; };
    const hinges = [];
    const row = (zc) => {
      const g = new THREE.Group(); g.position.set(-PW * 1.5, 0, 0);          // left edge of the sheet
      const c0 = panel(); c0.position.set(PW / 2, 0, zc); g.add(c0);
      const h1 = new THREE.Group(); h1.position.set(PW, 0, 0); g.add(h1);     // fold between col 0 and 1
      const c1 = panel(); c1.position.set(PW / 2, 0, zc); h1.add(c1);
      const h2 = new THREE.Group(); h2.position.set(PW, 0, 0); h1.add(h2);    // fold between col 1 and 2
      const c2 = panel(); c2.position.set(PW / 2, 0, zc); h2.add(c2);
      hinges.push({ h1, h2 }); return g;
    };
    const front = row(PD / 2); root.add(front);
    const hz = new THREE.Group(); root.add(hz);                               // centre fold (x axis, z = 0)
    const back = row(-PD / 2); hz.add(back);

    // ── relief terraces (stacked paper layers), markers and paths live above the opened sheet ──
    const relief = new THREE.Group(); relief.position.y = .06; root.add(relief);
    const LH = .1;                                                           // one paper layer = 0.1 high
    const terr = [[-1.1, -.2, 2.4, 1, '--surface', 0], [1.3, .7, 1.5, 4, '--surface', 0], [-1.4, .1, 1.3, 2.5, '--card', 1], [1.5, .6, .8, 6, '--card', 1], [-1.5, 0, .6, 8, '--ground', 2]];
    const outlines = [];
    const layers = terr.map(([x, z, r, k, tokn, level], i) => {
      const { sh, pts } = blob(x, z, r, k); outlines.push({ pts, level });
      const geo = new THREE.ExtrudeGeometry(sh, { depth: LH, bevelEnabled: true, bevelThickness: .015, bevelSize: .03, bevelSegments: 2, curveSegments: 6 });
      const m = new THREE.Mesh(geo, M(tokn, { roughness: .95 })); m.rotation.x = -Math.PI / 2; m.position.y = level * LH + .001 * i; m.castShadow = m.receiveShadow = true; m.scale.set(1, 1, .001); relief.add(m); return m;
    });
    function layerY(x, z) { let top = 0; outlines.forEach(o => { if (inside(o.pts, x, z)) top = Math.max(top, (o.level + 1) * LH); }); return top + .015; }
    const pos = {}; const markers = [];
    regions.forEach(r => {
      pos[r.name] = new THREE.Vector3(r.x, 0, r.z);
      const g = new THREE.Group(); g.position.set(r.x, layerY(r.x, r.z), r.z); relief.add(g);
      if (r.due > 0) {        // terracotta marker: a cairn — tapered post with a cap, height = how much is due
        const h = .28 + Math.min(r.due, 12) * .07;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(.05, .11, h, 16), M('--accent', { roughness: .8 })); post.position.y = h / 2; post.castShadow = true; g.add(post);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(.085, 20, 16), M('--accent', { roughness: .8 })); cap.position.y = h + .02; cap.castShadow = true; g.add(cap);
        g.userData = { h, label: `${r.name} · ${r.due} due` };
      } else if (r.soon > 0) { // due later this month: low teal stud
        const s = new THREE.Mesh(new THREE.CylinderGeometry(.09, .1, .09, 16), M('--retained')); s.position.y = .045; s.castShadow = true; g.add(s); g.userData = { h: .1 };
      } else {                 // known region, nothing due: a pin-prick in the paper
        const s = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .03, 12), M('--line2')); s.position.y = .015; g.add(s); g.userData = { h: .05 };
      }
      g.scale.setScalar(.001); markers.push(g);
    });

    // teal paths: raised arcs between linked regions, drawn on progressively
    const pathMat = M('--retained', { roughness: .7 });
    const paths = links.map(([a, b], i) => {
      const A = pos[a].clone().setY(layerY(pos[a].x, pos[a].z) + .04), B = pos[b].clone().setY(layerY(pos[b].x, pos[b].z) + .04);
      const mid = A.clone().lerp(B, .5); mid.y += .22 + A.distanceTo(B) * .08;
      const geo = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, mid, B), 28, .018, 6, false);
      const m = new THREE.Mesh(geo, pathMat); m.castShadow = true; m.userData.total = geo.index.count; m.geometry.setDrawRange(0, 0); relief.add(m); return m;
    });

    // label chips (HTML, inside the canvas box only — never over the copy)
    const labels = markers.filter(g => g.userData.label).map(g => { const d = document.createElement('span'); d.className = 'atlas-label'; d.textContent = g.userData.label; labelsEl.appendChild(d); return { g, d }; });
    const v = new THREE.Vector3();

    return (now, t) => {
      fitW(cam, 3.75, 8.65, 30);
      const T = reduced ? 10 : t;                                   // reduced motion: start fully open
      // 1 · centre fold opens   2 · accordion opens   3 · relief rises   4 · markers   5 · paths draw
      hz.rotation.x = Math.PI * (1 - seg(T, .05, 1.1));
      const k = seg(T, .55, 1.9);
      hinges.forEach(({ h1, h2 }) => { h1.rotation.z = Math.PI * (1 - k) + .028 * k; h2.rotation.z = -Math.PI * (1 - seg(T, .7, 2.0)) - .05 * k; });
      layers.forEach((m, i) => { m.scale.z = Math.max(.001, seg(T, 1.9 + i * .12, 2.6 + i * .12)); });
      markers.forEach((g, i) => { g.scale.setScalar(Math.max(.001, seg(T, 2.5 + i * .04, 3.0 + i * .04))); });
      paths.forEach((m, i) => { m.geometry.setDrawRange(0, Math.floor(m.userData.total * seg(T, 3.0 + i * .12, 3.9 + i * .12))); });
      if (!reduced) { root.rotation.y += ((mouse.x * .14) - root.rotation.y) * .05; root.rotation.x += ((mouse.y * .05) - root.rotation.x) * .05; }
      // project labels
      const W = host.clientWidth, H = host.clientHeight;
      labels.forEach(({ g, d }) => {
        g.getWorldPosition(v); v.y += g.userData.h * g.scale.y + .14; v.project(cam);
        d.style.transform = `translate(${((v.x + 1) / 2 * W).toFixed(1)}px, ${((1 - v.y) / 2 * H).toFixed(1)}px) translate(-50%,-100%)`;
        d.style.opacity = g.scale.y > .9 ? 1 : 0;
      });
    };
  });
}

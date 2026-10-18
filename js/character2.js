// Coach character renderer. The app uses the Studio style; the others remain for comparison (dev/character-options.html).
// Studio colors come from the Limber palette (palette.js), except natural skin tones and hair.

import { C, mix } from './palette.js';
// Draws a body with shaped (muscle-profile) limbs, clothing, faces, and three views
// (front, side, back) over the joints produced by figure.js.

const f = (n) => n.toFixed(2);
const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];
const norm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

// Darken toward Charcoal (amt > 0) or lighten toward White (amt < 0), so shading stays in the palette family.
const shade = (hex, amt) => (amt > 0 ? mix(hex, C.charcoal, Math.min(1, amt * 1.15)) : mix(hex, C.white, -amt));

// Smooth closed path through points (Catmull-Rom → cubic Bézier).
// Convex hull (monotone chain), counter-clockwise.
function hull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cross(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && cross(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

// corners: indices drawn as sharp corners (no overshoot), e.g. the open hem of a sleeve.
function smooth(pts, open = false, corners = null) {
  const n = pts.length;
  const P = (i) => (open ? pts[Math.max(0, Math.min(n - 1, i))] : pts[(i + n) % n]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = open ? n - 1 : n;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const i2 = (i + 1) % n;
    const c1 = corners?.has(i) ? p1 : [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = corners?.has(i2) ? p2 : [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return open ? d : d + 'Z';
}

function interp(prof, u) {
  if (u <= prof[0][0]) return [prof[0][1], prof[0][2]];
  for (let i = 1; i < prof.length; i++) {
    if (u <= prof[i][0]) {
      const [u0, a0, b0] = prof[i - 1], [u1, a1, b1] = prof[i];
      const k = (u - u0) / (u1 - u0);
      return [a0 + (a1 - a0) * k, b0 + (b1 - b0) * k];
    }
  }
  const l = prof[prof.length - 1];
  return [l[1], l[2]];
}

// Segment frame: position and unit tangent along the bone (torso follows the spine curve).
function frame(J, a, b, curved) {
  const A = J[a], B = J[b];
  if (!curved) {
    const T = norm([B[0] - A[0], B[1] - A[1]]);
    return { at: (u) => [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u], tan: () => T };
  }
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
  const nx = (B[1] - A[1]) / len, ny = -(B[0] - A[0]) / len;
  const C = [(A[0] + B[0]) / 2 + nx * J.c * 1.6, (A[1] + B[1]) / 2 + ny * J.c * 1.6];
  const at = (u) => [(1 - u) ** 2 * A[0] + 2 * (1 - u) * u * C[0] + u * u * B[0], (1 - u) ** 2 * A[1] + 2 * (1 - u) * u * C[1] + u * u * B[1]];
  const tan = (u) => norm([2 * (1 - u) * (C[0] - A[0]) + 2 * u * (B[0] - C[0]), 2 * (1 - u) * (C[1] - A[1]) + 2 * u * (B[1] - C[1])]);
  return { at, tan };
}

// Outline of a body part. prof rows: [u, radius on +N side, radius on −N side], N = tangent rotated −90°.
function part(fr, prof, u0, u1, { capA = true, capB = true, grow = 0, keep = null, scale = 1 } = {}) {
  const n = 9, L = [], R = [];
  const geo = [];
  for (let i = 0; i < n; i++) {
    const u = u0 + ((u1 - u0) * i) / (n - 1);
    const P = fr.at(u), T = fr.tan(u), N = [-T[1], T[0]];
    let [ra, rb] = interp(prof, u).map((r) => r * scale + grow);
    if (keep === 'a') rb = 0.05; else if (keep === 'b') ra = 0.05;
    L.push(add(P, N, ra)); R.push(add(P, N, -rb));
    geo.push({ P, T, N, ra, rb });
  }
  const cap = (g, start) => {
    const out = [], rc = (g.ra + g.rb) / 2, T = start ? [-g.T[0], -g.T[1]] : g.T;
    for (let k = 1; k < 6; k++) {
      const ph = (k / 6) * Math.PI, c = Math.cos(ph), s = Math.sin(ph);
      const side = start ? -1 : 1;
      const r = (side * c > 0) ? g.ra : g.rb;
      out.push([g.P[0] + g.N[0] * c * r * side + T[0] * s * rc, g.P[1] + g.N[1] * c * r * side + T[1] * s * rc]);
    }
    return out;
  };
  const pts = [...L, ...(capB ? cap(geo[n - 1], false) : []), ...R.reverse(), ...(capA ? cap(geo[0], true) : [])];
  // Open ends (hems, waistbands) are cut straight across with crisp corners instead of curving past them.
  const corners = new Set();
  if (!capB) corners.add(n - 1).add(n);
  if (!capA) corners.add(pts.length - 1).add(0);
  return smooth(pts, false, corners);
}

// Center (or offset) line along a part, for dashed muscle cues.
function midline(fr, prof, u0, u1, side, scale = 1) {
  const pts = [];
  for (let i = 0; i < 7; i++) {
    const u = u0 + ((u1 - u0) * i) / 6;
    const P = fr.at(u), T = fr.tan(u), N = [-T[1], T[0]];
    const [ra, rb] = interp(prof, u).map((r) => r * scale);
    pts.push(add(P, N, side > 0 ? ra * 0.5 : side < 0 ? -rb * 0.5 : 0));
  }
  return smooth(pts, true);
}

// ───────────── Body proportions (radii in figure units) ─────────────
// Side view limbs: [u, back, front]. Front view limbs: [u, outer, inner].
const P = {
  thighSide: [[0, 3.7, 3.5], [0.25, 3.5, 3.7], [0.6, 3.0, 3.2], [0.88, 2.5, 2.6], [1, 2.4, 2.5]],
  shinSide: [[0, 2.4, 2.5], [0.22, 3.0, 2.2], [0.45, 2.7, 2.0], [0.8, 1.6, 1.5], [1, 1.4, 1.4]],
  uarmSide: [[0, 2.1, 2.1], [0.25, 2.2, 2.1], [0.55, 2.0, 2.15], [1, 1.65, 1.65]],
  farmSide: [[0, 1.7, 1.7], [0.3, 1.9, 1.7], [1, 1.15, 1.15]],
  thighFront: [[0, 2.7, 3.1], [0.18, 3.1, 3.0], [0.55, 2.8, 2.5], [1, 2.2, 2.1]],
  shinFront: [[0, 2.3, 2.3], [0.28, 2.8, 2.6], [0.6, 2.1, 1.9], [1, 1.35, 1.35]],
  uarmFront: [[0, 1.5, 1.4], [0.14, 2.05, 1.8], [0.35, 2.15, 1.9], [0.6, 2.05, 1.85], [1, 1.6, 1.6]],
  farmFront: [[0, 1.65, 1.6], [0.3, 1.8, 1.7], [1, 1.15, 1.1]],
  neck: [[0, 1.75, 1.75], [1, 1.5, 1.5]],
};
// Torso. Side: [u, front, back], from the hip joint to the neck — the seat is a separate glute shape
// (J.glute) so it stays round whichever way the hips fold. Front: [u, half-width, half-width], from below the hip.
const TORSO = {
  sideF: [[0, 3.4, 4.4], [0.1, 3.9, 5.0], [0.24, 3.8, 4.5], [0.38, 3.6, 4.0], [0.6, 4.3, 4.3], [0.74, 5.5, 4.6], [0.88, 4.4, 4.5], [1, 2.2, 2.6]],
  sideM: [[0, 3.5, 4.2], [0.1, 4.1, 4.8], [0.24, 4.0, 4.4], [0.38, 3.9, 4.1], [0.6, 4.5, 4.4], [0.74, 5.1, 4.8], [0.88, 4.5, 4.6], [1, 2.3, 2.7]],
  frontF: [[-0.12, 3.2, 3.2], [0, 6.2, 6.2], [0.16, 6.3, 6.3], [0.4, 4.9, 4.9], [0.62, 5.4, 5.4], [0.8, 6.3, 6.3], [0.88, 6.9, 6.9], [0.95, 5.2, 5.2], [1, 2.2, 2.2]],
  frontM: [[-0.12, 3.4, 3.4], [0, 6.0, 6.0], [0.16, 5.9, 5.9], [0.4, 5.5, 5.5], [0.62, 6.0, 6.0], [0.8, 6.8, 6.8], [0.88, 7.3, 7.3], [0.95, 5.6, 5.6], [1, 2.4, 2.4]],
};

// Muscle → [segment kind, from, to, side ('front' | 'back' | 'both')].
const MUSCLE = {
  quads: ['th', 0.1, 0.85, 'front'], hamstrings: ['th', 0.15, 0.9, 'back'], glutes: ['torso', -0.14, 0.14, 'back'],
  hipFlexors: ['th', 0, 0.38, 'front'], adductors: ['th', 0.1, 0.8, 'both'], calves: ['sh', 0.06, 0.62, 'back'],
  chest: ['torso', 0.62, 0.88, 'front'], abs: ['torso', 0.16, 0.58, 'front'], obliques: ['torso', 0.18, 0.62, 'both'],
  lowerBack: ['torso', 0.08, 0.45, 'back'], upperBack: ['torso', 0.58, 0.9, 'back'], lats: ['torso', 0.42, 0.85, 'back'],
  traps: ['torso', 0.86, 1, 'back'], shoulders: ['ua', 0, 0.35, 'both'], biceps: ['ua', 0.2, 0.9, 'front'],
  triceps: ['ua', 0.2, 0.9, 'back'], forearms: ['fa', 0.1, 0.8, 'both'], neck: ['neck', -0.1, 0.4, 'both'],
};

// ───────────── Styles ─────────────
export const STYLES = {
  studio: {
    label: 'A · Studio',
    blurb: 'Closest to the app you showed me: soft flat illustration, real body shape, shaped muscles, sneakers, simple friendly face. Muscle cue = orange dashes.',
    outline: null, scale: 1, head: 1.1, shadow: true, face: 'full', highlight: 'dash',
    skin: '#eab38e',
    people: {
      ava: { hair: '#4a2c22', top: C.violet, bottom: C.charcoal, stripe: mix(C.violet, C.white, 0.35), shoe: C.green, tie: C.lime, fem: true },
      max: { hair: '#2a211d', top: C.ocean, bottom: C.charcoal, stripe: C.slate, shoe: C.green, fem: false },
    },
  },
  bold: {
    label: 'B · Bold Cartoon',
    blurb: 'Playful outlined cartoon: dark outlines, slightly bigger head, brighter colors. Very readable at small sizes. Muscle cue = glowing orange fill.',
    outline: '#22263a', scale: 1.08, head: 1.14, shadow: true, face: 'simple', highlight: 'fill',
    skin: '#f0bd97',
    people: {
      ava: { hair: '#3b2a5c', top: '#8c6bff', bottom: '#253050', stripe: '#b7a6ff', shoe: '#ffd166', tie: '#ff6b8f', fem: true },
      max: { hair: '#2b2230', top: '#12b886', bottom: '#2f3640', stripe: '#5c6670', shoe: '#ff6b8f', fem: false },
    },
  },
  form: {
    label: 'C · Form Silhouette',
    blurb: 'Clean, gender-neutral mannequin with no clothes or face — just body form, like an anatomy/coaching app. The worked muscles light up directly on the body.',
    outline: null, scale: 1, head: 0.95, shadow: false, face: 'none', highlight: 'solid',
    skin: '#5b6b84',
    people: {
      ava: { mono: true, fem: true },
      max: { mono: true, fem: false },
    },
  },
};

const HL = C.coral; // worked-muscle highlight
const LIPS = mix(C.coral, C.charcoal, 0.35);
const GLUTE_R = 3.8; // matches GLUTE.r in figure.js

// App-facing look: which coach and skin tone the Studio character uses.
export const COACHES = { a: { label: 'Ava', person: 'ava' }, b: { label: 'Max', person: 'max' } };
export const SKINS = ['#f7d5b8', '#eab38e', '#c68a62', '#8b5a3c'];
// Face options (ear: 'current' | 'a' | 'b' | 'c'; hair: 'classic' | 'real'). setFace is only used by dev demos.
const FACE = { ear: 'a', hair: 'real', blush: false, nose: 'soft' };
export function setFace(opts) { Object.assign(FACE, opts); }

let look = { person: 'ava', skin: SKINS[1] };
export function setLook(coach, skin) {
  look = { person: (COACHES[coach] ?? COACHES.a).person, skin: SKINS[skin] ?? SKINS[1] };
}
export const paint = (J, view, hot, hotSegs, floor) => paint2(J, view, 'studio', look.person, hot, hotSegs, look.skin, floor);

// Paint one frame. view: 'side' | 'front' | 'back'. floor: keep hair above y = 0.
export function paint2(J, view, styleKey, personKey, hot = [], hotSegs = null, skinOverride = null, floor = false) {
  const S = STYLES[styleKey], who = S.people[personKey];
  const ops = [];
  const side = view === 'side', back = view === 'back';
  const fem = who.fem;
  const sc = S.scale;
  const skin = who.mono ? S.skin : skinOverride ?? S.skin;
  const far = (c, isFar) => (isFar ? shade(c, who.mono ? -0.45 : 0.14) : c);
  const push = (d, fill, extra = {}) => ops.push({ tag: 'path', d, fill, ...extra });
  // Run a body group; with outlines on, draw a stroked copy underneath so joints inside the group stay seamless.
  const group = (fn) => {
    const start = ops.length;
    fn();
    if (!S.outline) return;
    const mine = ops.splice(start);
    // Small face details carry an explicit opacity so they aren't outlined.
    const shapes = mine.filter((o) => o.fill && o.fill !== 'none' && o.opacity === undefined);
    ops.push(...shapes.map((o) => ({ ...o, stroke: S.outline, 'stroke-width': 1.7, 'stroke-linejoin': 'round' })), ...mine);
  };
  const frames = {};

  // Limb profile for this view (swap outer/inner per side in front/back views).
  const limbProf = (kind, s) => {
    if (side) return P[kind + 'Side'].map(([u, back_, front]) => [u, back_, front]);
    const p = P[kind + 'Front'];
    const outerIsA = (s === 'L') !== back; // +N is screen-left for a limb pointing down
    return p.map(([u, o, i]) => (outerIsA ? [u, o, i] : [u, i, o]));
  };
  const torsoProf = side ? (fem ? TORSO.sideF : TORSO.sideM) : (fem ? TORSO.frontF : TORSO.frontM);

  const limb = (s, isFar, upper) => {
    const kinds = upper ? ['uarm', 'farm'] : ['thigh', 'shin'];
    const joints = upper ? ['shoulder', 'elbow', 'hand'] : ['hip', 'knee', 'ankle'];
    const k1 = upper ? 'ua' : 'th', k2 = upper ? 'fa' : 'sh';
    const f1 = frame(J, joints[0] + s, joints[1] + s), f2 = frame(J, joints[1] + s, joints[2] + s);
    const p1 = limbProf(kinds[0], s), p2 = limbProf(kinds[1], s);
    frames[k1 + s] = { fr: f1, prof: p1, far: isFar }; frames[k2 + s] = { fr: f2, prof: p2, far: isFar };
    if (upper) {
      const base = who.mono ? skin : skin;
      push(part(f2, p2, 0, 1, { scale: sc }), far(base, isFar));
      push(part(f1, p1, 0, 1, { scale: sc }), far(base, isFar));
      if (!who.mono && !fem) push(part(f1, p1, 0, 0.42, { grow: side ? 0.15 : 0.05, capB: false, scale: sc }), far(who.top, isFar));
      hand(s, isFar);
    } else {
      const legCol = who.mono ? skin : fem ? who.bottom : skin;
      const thigh = () => {
        push(part(f1, p1, 0, 1, { scale: sc }), far(legCol, isFar));
        if (!who.mono && !fem) push(part(f1, p1, -0.05, 0.55, { grow: 0.35, capB: false, scale: sc }), far(who.bottom, isFar));
      };
      const shin = () => {
        push(part(f2, p2, 0, 1, { scale: sc }), far(legCol, isFar));
        if (!who.mono && !fem) push(part(f2, p2, 0.8, 1.0, { grow: 0.12, capA: false, capB: false, scale: sc }), far(C.white, isFar));
      };
      // Cross-legged front poses: the shins cross in front of the thighs.
      if (J.legsFront === 'cross' && !side) { thigh(); shin(); } else { shin(); thigh(); }
      shoe(s, isFar);
    }
  };

  const hand = (s, isFar) => {
    const E = J['elbow' + s], H = J['hand' + s];
    const F = norm([H[0] - E[0], H[1] - E[1]]);
    const c = add(H, F, 1.0 * sc);
    const ang = (Math.atan2(F[1], F[0]) * 180) / Math.PI;
    ops.push({ tag: 'ellipse', cx: f(c[0]), cy: f(c[1]), rx: f(2.0 * sc), ry: f(1.45 * sc), transform: `rotate(${f(ang)} ${f(c[0])} ${f(c[1])})`, fill: far(skin, isFar) });
  };

  const shoe = (s, isFar) => {
    if (who.mono) {
      const A = J['ankle' + s], T = J['toe' + s];
      const F = norm([T[0] - A[0], T[1] - A[1]]), G = [-F[1], F[0]];
      const pts = side
        ? [[-1.5, -0.9], [-1.4, 1.3], [5.4, 1.4], [6.2, 0.6], [5.2, -0.6], [1.5, -1.2]]
        : [[-1.6, -0.6], [-1.6, 1.4], [1.9, 1.4], [2.3, 0.3], [1.2, -1]];
      const W = pts.map(([x, y]) => [A[0] + F[0] * x * sc + G[0] * y * sc * (side ? 1 : 1), A[1] + F[1] * x * sc + G[1] * y * sc]);
      push(smooth(W), far(skin, isFar));
      return;
    }
    const A = J['ankle' + s], T = J['toe' + s];
    let F = norm([T[0] - A[0], T[1] - A[1]]);
    let G = [-F[1], F[0]];
    // In front/back views draw a compact shoe under the ankle.
    if (!side) {
      // Compact shoe under the ankle, oriented along the shin.
      const K = J['knee' + s];
      const D = norm([A[0] - K[0], A[1] - K[1]]), X = [-D[1], D[0]];
      const O = add(A, D, 0.4 * sc);
      const at = ([x, y]) => [O[0] + (X[0] * x + D[0] * y) * sc, O[1] + (X[1] * x + D[1] * y) * sc];
      // Sneaker seen from the front: ankle collar, toe box widening toward the floor, light sole, laces.
      push(smooth([[-1.3, -1.1], [1.3, -1.1], [1.8, 0.2], [2.15, 1.3], [2.0, 1.95], [-2.0, 1.95], [-2.15, 1.3], [-1.8, 0.2]].map(at), false, new Set([4, 5])), far(who.shoe, isFar));
      push(smooth([[-2.2, 1.6], [2.2, 1.6], [2.1, 2.3], [-2.1, 2.3]].map(at), false, new Set([0, 1])), far(mix(C.mist, C.slate, 0.25), isFar));
      push(smooth([[-0.75, -1.1], [0.75, -1.1], [0.6, 0.9], [-0.6, 0.9]].map(at)), far(mix(who.shoe, C.white, 0.45), isFar)); // tongue
      for (const y of [-0.45, 0.1, 0.6]) ops.push({ tag: 'path', d: `M${f(at([-0.8, y])[0])} ${f(at([-0.8, y])[1])}L${f(at([0.8, y])[0])} ${f(at([0.8, y])[1])}`, stroke: far(C.white, isFar), 'stroke-width': 0.32 * sc, 'stroke-linecap': 'round', fill: 'none' });
      return;
    }
    if (G[1] < 0) G = [-G[0], -G[1]]; // sole faces down
    const L = (x, y) => [A[0] + (F[0] * x + G[0] * y) * sc, A[1] + (F[1] * x + G[1] * y) * sc];
    const upper = [[-1.9, -1.5], [-0.4, -2.3], [2.4, -1.4], [5.6, -0.4], [6.8, 0.6], [6.6, 1.5], [-1.7, 1.5], [-2.1, 0.2]].map(([x, y]) => L(x, y));
    push(smooth(upper), far(who.shoe, isFar));
    const sole = [[-1.9, 1.0], [6.8, 1.0], [6.6, 2.0], [-1.7, 2.0]].map(([x, y]) => L(x, y));
    push(smooth(sole), far(C.mist, isFar));
    ops.push({ tag: 'path', d: `M${f(L(1.2, -1.2)[0])} ${f(L(1.2, -1.2)[1])}L${f(L(3.6, -0.6)[0])} ${f(L(3.6, -0.6)[1])}`, stroke: far(C.white, isFar), 'stroke-width': 0.45, 'stroke-linecap': 'round', 'stroke-dasharray': '0.5 0.8', fill: 'none', opacity: 0.85 });
  };

  // Side-view seat: a round glute behind the hip (see GLUTE in figure.js).
  // It's wrapped in a hull with the back of the torso and thigh so it blends in instead of bulging out.
  const seat = (grow = 0) => {
    const c = J.glute, r = GLUTE_R * sc + grow, H = J.hip;
    const pts = Array.from({ length: 16 }, (_, i) => [c[0] + Math.cos((i / 16) * 2 * Math.PI) * r, c[1] + Math.sin((i / 16) * 2 * Math.PI) * r]);
    const toward = (to, along, w) => {
      const T = norm([to[0] - H[0], to[1] - H[1]]); let N = [-T[1], T[0]];
      if (N[0] * (c[0] - H[0]) + N[1] * (c[1] - H[1]) < 0) N = [-N[0], -N[1]];
      return [H[0] + T[0] * along + N[0] * (w + grow), H[1] + T[1] * along + N[1] * (w + grow)];
    };
    pts.push(toward(J.neck, 3.2 * sc, 3.9 * sc), toward(J.kneeR, 5.5 * sc, 3.2 * sc), toward(J.kneeL, 5.5 * sc, 3.2 * sc));
    return smooth(hull(pts));
  };
  const torso = () => {
    const fr = frame(J, 'hip', 'neck', true);
    // Torso profile is [u, +N, −N]; +N is the front in side view.
    const prof = torsoProf.map(([u, a, b]) => [u, a, b]);
    frames.torso = { fr, prof };
    const u0 = side ? 0 : -0.14, glute = side && J.glute;
    if (who.mono) { push(part(fr, prof, u0, 1, { scale: sc }), skin); if (glute) push(seat(), skin); return; }
    push(part(fr, prof, u0, 1, { scale: sc }), skin);
    if (glute) push(seat(0.1), who.bottom);
    if (fem) {
      push(part(fr, prof, u0, 0.34, { capB: false, grow: 0.1, scale: sc }), who.bottom);
      push(part(fr, prof, 0.56, back ? 0.86 : 0.9, { capA: false, capB: false, grow: 0.1, scale: sc }), who.top);
      if (!side) {
        // Straps (front) or racerback (back).
        const T = fr.tan(0.9), N = [-T[1], T[0]];
        const strap = (o) => { const a = add(fr.at(0.88), N, o * sc), b = add(fr.at(1.0), N, o * 0.45 * sc); return `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`; };
        if (back) push(part(fr, prof.map(([u]) => [u, 1.3, 1.3]), 0.84, 1, { capA: false, scale: sc }), who.top);
        else ops.push({ tag: 'path', d: strap(3.4) + strap(-3.4), stroke: who.top, 'stroke-width': 1.1 * sc, 'stroke-linecap': 'round', fill: 'none' });
      }
    } else {
      push(part(fr, prof, 0.2, 1, { capA: false, grow: 0.25, scale: sc }), who.top);
      push(part(fr, prof, u0, 0.26, { capB: false, grow: 0.3, scale: sc }), who.bottom);
      if (!side && !back) {
        const T = fr.tan(1), N = [-T[1], T[0]], c = fr.at(0.985);
        const a = add(c, N, 2.3 * sc), b = add(c, N, -2.3 * sc), m = add(c, T, -1.6 * sc);
        ops.push({ tag: 'path', d: `M${f(a[0])} ${f(a[1])}Q${f(m[0])} ${f(m[1])} ${f(b[0])} ${f(b[1])}`, stroke: shade(who.top, 0.25), 'stroke-width': 0.9 * sc, fill: 'none', 'stroke-linecap': 'round' });
      }
    }
    if (back && !S.outline) {
      // Glute seam on leggings / shorts.
      const T = fr.tan(0), N = [-T[1], T[0]];
      const c = fr.at(-0.06);
      const p1 = add(c, N, 0), p2 = add(add(c, T, -3.4), N, 0);
      ops.push({ tag: 'path', d: `M${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}`, stroke: shade(who.bottom, 0.25), 'stroke-width': 0.4, fill: 'none' });
    }
  };

  const neck = () => {
    const fr = frame(J, 'neck', 'head');
    frames.neck = { fr, prof: P.neck };
    push(part(fr, P.neck, -0.2, 0.62, { scale: sc }), shade(skin, who.mono ? 0 : 0.05));
  };

  const head = () => {
    const R = 4.9 * S.head;
    const HC = J.head;
    const U = norm([HC[0] - J.neck[0], HC[1] - J.neck[1]]);
    const F = [-U[1], U[0]]; // facing (side) / screen-right (front)
    const Q = (fw, up) => [HC[0] + F[0] * fw * R + U[0] * up * R, HC[1] + F[1] * fw * R + U[1] * up * R];
    const ell = (c, rx, ry, fill, extra = {}, tilt = 0) => {
      const ang = (Math.atan2(F[1], F[0]) * 180) / Math.PI + tilt;
      ops.push({ tag: 'ellipse', cx: f(c[0]), cy: f(c[1]), rx: f(rx * R), ry: f(ry * R), transform: `rotate(${f(ang)} ${f(c[0])} ${f(c[1])})`, fill, ...extra });
    };
    const poly = (list, fill, extra = {}) => push(smooth(list.map(([a, b]) => Q(a, b))), fill, extra);
    const line = (list, color, w, extra = {}) => ops.push({ tag: 'path', d: smooth(list.map(([a, b]) => Q(a, b)), true), stroke: color, 'stroke-width': w * R, 'stroke-linecap': 'round', fill: 'none', ...extra });
    if (who.mono) {
      if (side) { poly([[-0.95, 0.15], [-0.6, 0.85], [0.2, 1.0], [0.85, 0.45], [0.95, -0.15], [0.7, -0.75], [0.15, -0.95], [-0.55, -0.7]], skin); }
      else ell(HC, 0.86, 1.0, skin);
      return;
    }
    const tn = Math.max(-1, Math.min(1, J.turn ?? 0)) * 0.4;
    let tie = null;
    const real = FACE.hair === 'real';
    const hairHi = shade(who.hair, -0.2), hairLo = shade(who.hair, 0.35), fade = mix(who.hair, skin, 0.42);
    // Ear: x is the ear's centre across the face (side view: 0 = middle of the head), m mirrors it.
    const ear = (x, y, m = 1, sideView = false) => {
      const e = FACE.ear, dark = shade(skin, 0.16), base = shade(skin, 0.07);
      if (e === 'current') { ell(Q(x, y), sideView ? 0.15 : 0.14, 0.22, shade(skin, sideView ? 0.12 : 0.08)); return; }
      if (e === 'a') { // classic C-shaped ear with an inner fold
        ell(Q(x, y), sideView ? 0.16 : 0.13, 0.23, base);
        line(sideView ? [[x + 0.06, y + 0.12], [x - 0.06, y + 0.1], [x - 0.08, y - 0.04], [x - 0.02, y - 0.12]] : [[x - 0.03 * m, y + 0.13], [x + 0.04 * m, y + 0.06], [x + 0.04 * m, y - 0.06], [x - 0.01 * m, y - 0.13]], dark, 0.04);
        return;
      }
      if (e === 'b') { // tucked teardrop: wider at the top, soft lobe, inner shadow
        poly(sideView
          ? [[x + 0.06, y + 0.22], [x - 0.1, y + 0.2], [x - 0.15, y + 0.04], [x - 0.08, y - 0.16], [x + 0.02, y - 0.24], [x + 0.07, y - 0.1], [x + 0.06, y + 0.08]]
          : [[x - 0.04 * m, y + 0.2], [x + 0.1 * m, y + 0.16], [x + 0.13 * m, y + 0.02], [x + 0.06 * m, y - 0.18], [x - 0.03 * m, y - 0.22], [x - 0.05 * m, y - 0.04]], base);
        ell(Q(x + (sideView ? -0.03 : 0.04 * m), y + 0.03), sideView ? 0.06 : 0.04, 0.1, dark, { opacity: 0.55 });
        return;
      }
      // 'c': minimal — small, same tone as the face, one soft line
      ell(Q(x, y), sideView ? 0.12 : 0.1, 0.17, skin);
      line(sideView ? [[x + 0.03, y + 0.08], [x - 0.04, y + 0.02], [x + 0.0, y - 0.08]] : [[x, y + 0.08], [x + 0.03 * m, y], [x, y - 0.08]], dark, 0.03, { opacity: 0.7 });
    };
    if (side) {
      if (fem) {
        // Ponytail.
        // Starts at the back of the head, then swings back and falls with gravity.
        const g = [0, 1], bk = [-F[0], -F[1]];
        const p0 = Q(-0.75, 0.72);
        const p1 = add(add(p0, bk, 0.7 * R), g, 0.1 * R);
        const p2 = add(add(p1, bk, 0.35 * R), g, 0.8 * R);
        const p3 = add(add(p2, bk, 0.05 * R), g, 0.8 * R);
        const p4 = add(p3, g, 0.5 * R);
        const rads = real ? [0.34, 0.46, 0.44, 0.3, 0.06] : [0.36, 0.44, 0.42, 0.3, 0.1];
        // Lying down, the ponytail rests on the floor instead of hanging through it.
        const T = [p0, p1, p2, p3, p4].map((p, i) => (floor ? [p[0], Math.min(p[1], -rads[i] * R - 0.15)] : p));
        const fr = { at: (u) => { const i = Math.min(3, Math.floor(u * 4)); const k = u * 4 - i; return [T[i][0] + (T[i + 1][0] - T[i][0]) * k, T[i][1] + (T[i + 1][1] - T[i][1]) * k]; }, tan: (u) => { const i = Math.min(3, Math.floor(u * 4)); return norm([T[i + 1][0] - T[i][0], T[i + 1][1] - T[i][1]]); } };
        push(part(fr, rads.map((r, i) => [i / 4, r * R, r * R]), 0, 1), who.hair);
        { const a = Q(-0.6, 0.96), b = Q(-0.99, 0.37), m = Q(-0.88, 0.72); tie = [a, add(m, [-F[0], -F[1]], 0.06 * R), b]; } // along the back of the skull, where the ponytail starts
        if (real) {
          // Strands down the tail: one lighter sheen, one darker groove.
          for (const [off, col, w] of [[0.12, hairHi, 0.05], [-0.14, hairLo, 0.045]]) {
            const pts = [0.12, 0.35, 0.6, 0.85].map((u) => { const c = fr.at(u), t = fr.tan(u), n = [-t[1], t[0]]; return add(c, n, off * R * (1 - u * 0.6)); });
            ops.push({ tag: 'path', d: smooth(pts, true), stroke: col, 'stroke-width': w * R, 'stroke-linecap': 'round', fill: 'none', opacity: 0.8 });
          }
        }
      }
      // Skull + face profile (jaw, nose, chin).
      const nose = FACE.nose === 'soft' ? [[0.88, 0.06], [0.95, -0.04], [0.99, -0.13], [0.95, -0.2], [0.87, -0.24]] : [[0.9, 0.05], [1.06, -0.12], [0.88, -0.22]];
      poly([[-0.92, 0.1], [-0.72, 0.72], [-0.1, 1.0], [0.55, 0.82], [0.86, 0.35], ...nose, [0.86, -0.5], [0.66, -0.72], [0.38, -0.86], [-0.05, -0.8], [-0.45, -0.72], [-0.82, -0.4]], skin);
      // Hair.
      if (!real) {
        if (fem) poly([[0.62, 0.62], [0.2, 1.04], [-0.55, 0.92], [-1.0, 0.35], [-0.98, -0.3], [-0.72, -0.62], [-0.42, -0.2], [-0.22, 0.3], [0.2, 0.46]], who.hair);
        else poly([[0.66, 0.6], [0.35, 1.06], [-0.4, 1.02], [-0.96, 0.5], [-0.96, -0.1], [-0.66, -0.36], [-0.38, 0.05], [-0.1, 0.42], [0.36, 0.52]], who.hair);
      } else if (fem) {
        // Pulled back to the ponytail: hairline at the temple, wisp in front of the ear, strands sweeping back.
        poly([[0.64, 0.6], [0.3, 1.02], [-0.4, 1.02], [-0.92, 0.62], [-1.0, 0.2], [-0.92, -0.3], [-0.72, -0.5], [-0.46, -0.32], [-0.38, 0.02], [-0.28, 0.24], [-0.06, 0.3], [0.03, 0.06], [0.1, 0.1], [0.14, 0.36], [0.42, 0.46]], who.hair);
        line([[0.5, 0.68], [0.0, 0.9], [-0.55, 0.8]], hairHi, 0.035, { opacity: 0.7 });
        line([[0.3, 0.5], [-0.15, 0.62], [-0.6, 0.6]], hairLo, 0.03, { opacity: 0.6 });
        line([[-0.1, 0.4], [-0.45, 0.46], [-0.7, 0.58]], hairHi, 0.03, { opacity: 0.5 });
      } else {
        // Short textured crop: one colour, fuller on top, tapered at the back and sideburn, light accents for shape.
        poly([[0.7, 0.58], [0.62, 0.76], [0.66, 0.84], [0.42, 1.06], [0.0, 1.12], [-0.45, 1.06], [-0.88, 0.74], [-0.98, 0.24], [-0.92, -0.26], [-0.72, -0.46], [-0.46, -0.3], [-0.38, 0.02], [-0.28, 0.22], [-0.08, 0.28], [0.02, 0.04], [0.1, 0.06], [0.14, 0.34], [0.4, 0.5]], who.hair);
        line([[0.55, 0.78], [0.2, 0.98], [-0.25, 1.0]], hairHi, 0.035, { opacity: 0.75 });
        line([[0.3, 0.66], [-0.05, 0.82], [-0.5, 0.84]], hairHi, 0.03, { opacity: 0.45 });
        line([[-0.62, 0.62], [-0.82, 0.3], [-0.82, -0.05]], hairHi, 0.03, { opacity: 0.4 });
      }
      if (tie) {
        // Hair tie: a band in the shirt colour wrapped across the base of the ponytail.
        const [a, m, b] = tie, d = `M${f(a[0])} ${f(a[1])}Q${f(m[0])} ${f(m[1])} ${f(b[0])} ${f(b[1])}`;
        ops.push({ tag: 'path', d, stroke: who.top, 'stroke-width': 0.17 * R, 'stroke-linecap': 'round', fill: 'none' });
        ops.push({ tag: 'path', d, stroke: shade(who.top, 0.3), 'stroke-width': 0.05 * R, 'stroke-linecap': 'round', fill: 'none', opacity: 0.55 });
      }
      ear(-0.2, -0.05, 1, true);
      if (S.face !== 'none') {
        ell(Q(0.56, 0.1), S.face === 'simple' ? 0.11 : 0.09, S.face === 'simple' ? 0.11 : 0.13, C.charcoal, { opacity: 1 });
        if (S.face === 'full') line([[0.42, 0.34], [0.66, 0.36]], who.hair, 0.09);
        line([[0.6, -0.48], [0.76, -0.46]], LIPS, 0.07);
        if (FACE.blush) ell(Q(0.48, -0.25), 0.15, 0.1, C.coral, { opacity: 0.35 });
      }
      return;
    }
    if (back) {
      ear(-0.9, -0.05, -1); ear(0.9, -0.05, 1);
      if (fem) {
        poly([[-0.88, 0.1], [-0.6, 0.85], [0, 1.06], [0.6, 0.85], [0.88, 0.1], [0.75, -0.6], [0, -0.85], [-0.75, -0.6]], who.hair);
        poly([[-0.3, 0.5], [0.3, 0.5], [0.42, -0.4], [0.25, -1.3], [0, -1.6], [-0.25, -1.3], [-0.42, -0.4]], shade(who.hair, -0.06));
        line([[-0.26, 0.54], [0, 0.5], [0.26, 0.54]], who.top, 0.16);
      } else poly([[-0.9, 0.1], [-0.65, 0.85], [0, 1.05], [0.65, 0.85], [0.9, 0.1], [0.78, -0.45], [0, -0.62], [-0.78, -0.45]], who.hair);
      return;
    }
    // Front.
    if (fem && !real) poly([[-0.98, 0.1], [-0.82, 0.85], [0, 1.1], [0.82, 0.85], [0.98, 0.1], [0.9, -0.55], [-0.9, -0.55]], who.hair);
    ear(-0.86 + tn * 0.2, -0.05, -1); ear(0.86 + tn * 0.2, -0.05, 1);
    poly([[-0.84, 0.15], [-0.7, 0.75], [0, 0.98], [0.7, 0.75], [0.84, 0.15], [0.72, -0.5], [0.35, -0.9], [0, -0.98], [-0.35, -0.9], [-0.72, -0.5]].map(([a, b]) => [a + tn * 0.15, b]), skin);
    if (!real) {
      if (fem) poly([[-0.9, 0.1], [-0.78, 0.8], [0, 1.1], [0.78, 0.8], [0.9, 0.1], [0.62, 0.48], [0.1 + tn, 0.6], [-0.4, 0.44], [-0.72, 0.36]], who.hair);
      else poly([[-0.88, 0.2], [-0.72, 0.86], [0, 1.08], [0.72, 0.86], [0.88, 0.2], [0.66, 0.6], [0.2, 0.68], [-0.35, 0.62], [-0.7, 0.52]], who.hair);
    } else if (fem) {
      // Pulled back with a side part; hair wraps the temples and tucks behind the ears.
      const p = 0.28 + tn;
      poly([[-0.9, 0.0], [-0.86, 0.6], [-0.5, 0.98], [p, 1.1], [0.62, 0.98], [0.9, 0.6], [0.92, 0.02], [0.8, 0.12], [0.7, 0.5], [p + 0.1, 0.66], [p - 0.05, 0.62], [-0.3, 0.58], [-0.68, 0.46], [-0.8, 0.1]], who.hair);
      line([[p, 1.06], [p - 0.02, 0.72]], hairLo, 0.04, { opacity: 0.9 });
      line([[p - 0.08, 0.96], [-0.35, 0.86], [-0.72, 0.56]], hairHi, 0.035, { opacity: 0.7 });
      line([[p - 0.1, 0.78], [-0.4, 0.7], [-0.76, 0.36]], hairLo, 0.03, { opacity: 0.6 });
      line([[p + 0.1, 0.96], [0.58, 0.86], [0.8, 0.5]], hairHi, 0.03, { opacity: 0.6 });
      line([[-0.8, 0.2], [-0.84, -0.12]], who.hair, 0.04, { opacity: 0.9 }); // loose wisp at the temple
    } else {
      // Short textured crop: soft uneven fringe, faded sides down to the ears.
      for (const m of [-1, 1]) poly([[0.88 * m, 0.46], [0.9 * m, 0.04], [0.84 * m, -0.06], [0.8 * m, 0.2], [0.76 * m, 0.46]], who.hair);
      poly([[-0.9, 0.34], [-0.84, 0.78], [-0.5, 1.04], [0, 1.14], [0.5, 1.04], [0.84, 0.78], [0.9, 0.34], [0.76, 0.5], [0.56, 0.6], [0.42, 0.57], [0.24, 0.63], [0.06, 0.59], [-0.14, 0.64], [-0.34, 0.6], [-0.56, 0.62], [-0.76, 0.5]].map(([a, b]) => [a + tn * 0.1, b]), who.hair);
      line([[-0.5, 0.9], [-0.1, 1.02], [0.36, 0.96]].map(([a, b]) => [a + tn * 0.1, b]), hairHi, 0.035, { opacity: 0.7 });
      line([[-0.3, 0.76], [0.05, 0.84], [0.5, 0.78]].map(([a, b]) => [a + tn * 0.1, b]), hairLo, 0.03, { opacity: 0.6 });
    }
    if (S.face !== 'none') {
      for (const x of [-0.32, 0.32]) {
        const xx = x + tn;
        if (Math.abs(xx) > 0.78) continue;
        ell(Q(xx, 0.06), S.face === 'simple' ? 0.11 : 0.09, S.face === 'simple' ? 0.11 : 0.13, C.charcoal, { opacity: 1 });
        if (S.face === 'full') line([[xx - 0.13, 0.3], [xx + 0.13, 0.31]], who.hair, 0.08);
        if (FACE.blush) ell(Q(xx * 1.35, -0.3), 0.14, 0.09, C.coral, { opacity: 0.35 });
      }
      line([[-0.16 + tn, -0.44], [tn, -0.52], [0.16 + tn, -0.44]], LIPS, 0.07);
    }
  };

  // Draw order (each call is one outlined group).
  const G = (fn) => group(fn);
  if (side) {
    G(() => limb('L', true, true)); G(() => limb('L', true, false)); G(() => { torso(); }); G(() => limb('R', false, false));
    G(() => { neck(); head(); }); G(() => limb('R', false, true));
  } else {
    // Seated front poses (J.legsFront) have the knees toward the viewer, so the legs go over the torso.
    if (J.legsFront && !back) { G(() => torso()); G(() => { limb('L', false, false); limb('R', false, false); }); }
    else { G(() => { limb('L', false, false); limb('R', false, false); }); G(() => torso()); }
    if (back) { G(() => { neck(); head(); }); G(() => limb('L', false, true)); G(() => limb('R', false, true)); }
    else { G(() => limb('L', false, true)); G(() => limb('R', false, true)); G(() => { neck(); head(); }); }
  }

  // Muscle highlights.
  const allow = hotSegs ? new Set(hotSegs) : null;
  for (const m of hot) {
    const spec = MUSCLE[m];
    if (!spec) continue;
    if (m === 'glutes' && side && J.glute) {
      // Arc around the back of the seat, facing away from the hip.
      const c = J.glute, a0 = Math.atan2(c[1] - J.hip[1], c[0] - J.hip[0]), r = GLUTE_R * sc * 0.55;
      const d = smooth(Array.from({ length: 7 }, (_, i) => { const a = a0 + ((i - 3) / 3) * 1.1; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; }), true);
      if (S.highlight === 'dash') {
        ops.push({ tag: 'path', d, fill: 'none', stroke: HL, 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0.18 });
        ops.push({ tag: 'path', d, fill: 'none', stroke: HL, 'stroke-width': 1.0, 'stroke-linecap': 'round', 'stroke-dasharray': '1.6 1.25' });
      } else ops.push({ tag: 'path', d: seat(-0.8), fill: HL, opacity: S.highlight === 'fill' ? 0.55 : 0.95 });
      continue;
    }
    const [kind, u0, u1, where] = spec;
    let names = kind === 'torso' || kind === 'neck' ? [kind] : side ? [kind + 'R'] : [kind + 'L', kind + 'R'];
    if (allow && kind !== 'torso' && kind !== 'neck') names = [...allow].filter((n) => n.startsWith(kind));
    const frontView = !side && !back;
    if (!side && where === 'back' && frontView && kind === 'torso') continue;
    if (!side && where === 'front' && back && kind === 'torso') continue;
    for (const nm of names) {
      const fp = frames[nm];
      if (!fp) continue;
      // Which outline side holds the muscle: limbs have back on +N, torso has front on +N.
      let keep = null;
      if (side && where !== 'both') keep = (kind === 'torso') === (where === 'front') ? 'a' : 'b';
      const fill = fp.far ? shade(HL, 0.25) : HL;
      if (S.highlight === 'dash') {
        const d = midline(fp.fr, fp.prof, u0, u1, keep === 'a' ? 1 : keep === 'b' ? -1 : 0, sc);
        ops.push({ tag: 'path', d, fill: 'none', stroke: HL, 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0.18 });
        ops.push({ tag: 'path', d, fill: 'none', stroke: fill, 'stroke-width': 1.0, 'stroke-linecap': 'round', 'stroke-dasharray': '1.6 1.25' });
      } else {
        const d = part(fp.fr, fp.prof, u0, u1, { keep, grow: S.highlight === 'fill' ? -0.7 : -0.35, scale: sc });
        ops.push({ tag: 'path', d, fill, opacity: S.highlight === 'fill' ? 0.55 : 0.95 });
      }
    }
  }
  return ops;
}

// Coach character renderer. The app uses the Studio style; the others remain for comparison (dev/character-options.html).
// Draws a body with shaped (muscle-profile) limbs, clothing, faces, and three views
// (front, side, back) over the joints produced by figure.js.

const f = (n) => n.toFixed(2);
const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];
const norm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(amt > 0 ? v * (1 - amt) : v + (255 - v) * -amt))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Smooth closed path through points (Catmull-Rom → cubic Bézier).
function smooth(pts, open = false) {
  const n = pts.length;
  const P = (i) => (open ? pts[Math.max(0, Math.min(n - 1, i))] : pts[(i + n) % n]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = open ? n - 1 : n;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
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
  return smooth(pts);
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
  uarmSide: [[0, 2.6, 2.6], [0.25, 2.3, 2.2], [0.55, 2.0, 2.2], [1, 1.65, 1.65]],
  farmSide: [[0, 1.7, 1.7], [0.3, 1.9, 1.7], [1, 1.15, 1.15]],
  thighFront: [[0, 2.7, 3.1], [0.18, 3.1, 3.0], [0.55, 2.8, 2.5], [1, 2.2, 2.1]],
  shinFront: [[0, 2.3, 2.3], [0.28, 2.8, 2.6], [0.6, 2.1, 1.9], [1, 1.35, 1.35]],
  uarmFront: [[0, 2.7, 2.4], [0.3, 2.3, 2.0], [0.6, 2.1, 1.9], [1, 1.6, 1.6]],
  farmFront: [[0, 1.65, 1.6], [0.3, 1.8, 1.7], [1, 1.15, 1.1]],
  neck: [[0, 1.75, 1.75], [1, 1.5, 1.5]],
};
// Torso, from slightly below the hip joint (glutes) to the neck. Side: [u, front, back]. Front: [u, half-width, half-width].
const TORSO = {
  sideF: [[-0.14, 2.6, 4.4], [0, 4.2, 5.7], [0.18, 3.9, 4.9], [0.38, 3.6, 4.0], [0.6, 4.3, 4.3], [0.74, 5.5, 4.6], [0.88, 4.4, 4.5], [1, 2.2, 2.6]],
  sideM: [[-0.14, 2.6, 4.1], [0, 4.3, 5.3], [0.18, 4.1, 4.7], [0.38, 3.9, 4.1], [0.6, 4.5, 4.4], [0.74, 5.1, 4.8], [0.88, 4.5, 4.6], [1, 2.3, 2.7]],
  frontF: [[-0.12, 3.2, 3.2], [0, 6.2, 6.2], [0.16, 6.3, 6.3], [0.4, 4.9, 4.9], [0.62, 5.4, 5.4], [0.8, 6.2, 6.2], [0.9, 6.4, 6.4], [0.97, 4.4, 4.4], [1, 2.2, 2.2]],
  frontM: [[-0.12, 3.4, 3.4], [0, 6.0, 6.0], [0.16, 5.9, 5.9], [0.4, 5.5, 5.5], [0.62, 6.0, 6.0], [0.8, 6.7, 6.7], [0.9, 6.8, 6.8], [0.97, 4.8, 4.8], [1, 2.4, 2.4]],
};

// Muscle → [segment kind, from, to, side ('front' | 'back' | 'both')].
const MUSCLE = {
  quads: ['th', 0.1, 0.85, 'front'], hamstrings: ['th', 0.15, 0.9, 'back'], glutes: ['torso', -0.14, 0.14, 'back'],
  hipFlexors: ['th', 0, 0.38, 'front'], adductors: ['th', 0.1, 0.8, 'both'], calves: ['sh', 0.06, 0.62, 'back'],
  chest: ['torso', 0.62, 0.88, 'front'], abs: ['torso', 0.16, 0.58, 'front'], obliques: ['torso', 0.18, 0.62, 'both'],
  lowerBack: ['torso', 0.08, 0.45, 'back'], upperBack: ['torso', 0.58, 0.9, 'back'], lats: ['torso', 0.42, 0.85, 'back'],
  traps: ['torso', 0.86, 1, 'back'], shoulders: ['ua', 0, 0.35, 'both'], biceps: ['ua', 0.2, 0.9, 'front'],
  triceps: ['ua', 0.2, 0.9, 'back'], forearms: ['fa', 0.1, 0.8, 'both'], neck: ['neck', 0, 1, 'both'],
};

// ───────────── Styles ─────────────
export const STYLES = {
  studio: {
    label: 'A · Studio',
    blurb: 'Closest to the app you showed me: soft flat illustration, real body shape, shaped muscles, sneakers, simple friendly face. Muscle cue = orange dashes.',
    outline: null, scale: 1, head: 1.1, shadow: true, face: 'full', highlight: 'dash',
    skin: '#eab38e',
    people: {
      ava: { hair: '#4a2c22', top: '#ff6b8f', bottom: '#30364a', stripe: '#ff8fab', shoe: '#ff5a86', tie: '#ffd166', fem: true },
      max: { hair: '#2a211d', top: '#2f80ed', bottom: '#28303f', stripe: '#4f5b73', shoe: '#ff8a3d', fem: false },
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

const HL = '#ff5a1f';

// App-facing look: which coach and skin tone the Studio character uses.
export const COACHES = { a: { label: 'Ava', person: 'ava' }, b: { label: 'Max', person: 'max' } };
export const SKINS = ['#f7d5b8', '#eab38e', '#c68a62', '#8b5a3c'];
let look = { person: 'ava', skin: SKINS[1] };
export function setLook(coach, skin) {
  look = { person: (COACHES[coach] ?? COACHES.a).person, skin: SKINS[skin] ?? SKINS[1] };
}
export const paint = (J, view, hot, hotSegs) => paint2(J, view, 'studio', look.person, hot, hotSegs, look.skin);

// Paint one frame. view: 'side' | 'front' | 'back'.
export function paint2(J, view, styleKey, personKey, hot = [], hotSegs = null, skinOverride = null) {
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
      if (!who.mono && !fem) push(part(f1, p1, 0, 0.44, { grow: 0.3, capB: false, scale: sc }), far(who.top, isFar));
      hand(s, isFar);
    } else {
      const legCol = who.mono ? skin : fem ? who.bottom : skin;
      push(part(f2, p2, 0, 1, { scale: sc }), far(legCol, isFar));
      push(part(f1, p1, 0, 1, { scale: sc }), far(legCol, isFar));
      if (!who.mono && !fem) {
        push(part(f1, p1, -0.05, 0.55, { grow: 0.55, capB: false, scale: sc }), far(who.bottom, isFar));
        push(part(f2, p2, 0.8, 0.95, { grow: 0.12, capA: false, capB: false, scale: sc }), far('#ffffff', isFar));
      }
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
      const C = add(A, D, 0.6 * sc);
      const at = ([x, y]) => [C[0] + (X[0] * x + D[0] * y) * sc, C[1] + (X[1] * x + D[1] * y) * sc];
      push(smooth([[-1.9, -1.2], [1.9, -1.2], [2.3, 0.6], [1.6, 1.9], [-1.6, 1.9], [-2.3, 0.6]].map(at)), far(who.shoe, isFar));
      push(smooth([[-2.3, 1.1], [2.3, 1.1], [1.8, 2.15], [-1.8, 2.15]].map(at)), far('#f4f4f6', isFar));
      return;
    }
    if (G[1] < 0) G = [-G[0], -G[1]]; // sole faces down
    const L = (x, y) => [A[0] + (F[0] * x + G[0] * y) * sc, A[1] + (F[1] * x + G[1] * y) * sc];
    const upper = [[-1.9, -1.5], [-0.4, -2.3], [2.4, -1.4], [5.6, -0.4], [6.8, 0.6], [6.6, 1.5], [-1.7, 1.5], [-2.1, 0.2]].map(([x, y]) => L(x, y));
    push(smooth(upper), far(who.shoe, isFar));
    const sole = [[-1.9, 1.0], [6.8, 1.0], [6.6, 2.0], [-1.7, 2.0]].map(([x, y]) => L(x, y));
    push(smooth(sole), far('#f4f4f6', isFar));
    ops.push({ tag: 'path', d: `M${f(L(1.2, -1.2)[0])} ${f(L(1.2, -1.2)[1])}L${f(L(3.6, -0.6)[0])} ${f(L(3.6, -0.6)[1])}`, stroke: far('#ffffff', isFar), 'stroke-width': 0.45, 'stroke-linecap': 'round', 'stroke-dasharray': '0.5 0.8', fill: 'none', opacity: 0.85 });
  };

  const torso = () => {
    const fr = frame(J, 'hip', 'neck', true);
    // Torso profile is [u, +N, −N]; +N is the front in side view.
    const prof = torsoProf.map(([u, a, b]) => [u, a, b]);
    frames.torso = { fr, prof };
    if (who.mono) { push(part(fr, prof, -0.14, 1, { scale: sc }), skin); return; }
    push(part(fr, prof, -0.14, 1, { scale: sc }), skin);
    if (fem) {
      push(part(fr, prof, -0.14, 0.34, { capB: false, grow: 0.1, scale: sc }), who.bottom);
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
      push(part(fr, prof, -0.14, 0.26, { capB: false, grow: 0.3, scale: sc }), who.bottom);
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
    const C = J.head;
    const U = norm([C[0] - J.neck[0], C[1] - J.neck[1]]);
    const F = [-U[1], U[0]]; // facing (side) / screen-right (front)
    const Q = (fw, up) => [C[0] + F[0] * fw * R + U[0] * up * R, C[1] + F[1] * fw * R + U[1] * up * R];
    const ell = (c, rx, ry, fill, extra = {}) => {
      const ang = (Math.atan2(F[1], F[0]) * 180) / Math.PI;
      ops.push({ tag: 'ellipse', cx: f(c[0]), cy: f(c[1]), rx: f(rx * R), ry: f(ry * R), transform: `rotate(${f(ang)} ${f(c[0])} ${f(c[1])})`, fill, ...extra });
    };
    const poly = (list, fill, extra = {}) => push(smooth(list.map(([a, b]) => Q(a, b))), fill, extra);
    const line = (list, color, w, extra = {}) => ops.push({ tag: 'path', d: smooth(list.map(([a, b]) => Q(a, b)), true), stroke: color, 'stroke-width': w * R, 'stroke-linecap': 'round', fill: 'none', ...extra });
    if (who.mono) {
      if (side) { poly([[-0.95, 0.15], [-0.6, 0.85], [0.2, 1.0], [0.85, 0.45], [0.95, -0.15], [0.7, -0.75], [0.15, -0.95], [-0.55, -0.7]], skin); }
      else ell(C, 0.86, 1.0, skin);
      return;
    }
    const tn = Math.max(-1, Math.min(1, J.turn ?? 0)) * 0.4;
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
        const T = [p0, p1, p2, p3, p4];
        const rads = [0.36, 0.44, 0.42, 0.3, 0.1];
        const fr = { at: (u) => { const i = Math.min(3, Math.floor(u * 4)); const k = u * 4 - i; return [T[i][0] + (T[i + 1][0] - T[i][0]) * k, T[i][1] + (T[i + 1][1] - T[i][1]) * k]; }, tan: (u) => { const i = Math.min(3, Math.floor(u * 4)); return norm([T[i + 1][0] - T[i][0], T[i + 1][1] - T[i][1]]); } };
        push(part(fr, rads.map((r, i) => [i / 4, r * R, r * R]), 0, 1), who.hair);
      }
      // Skull + face profile (jaw, nose, chin).
      poly([[-0.92, 0.1], [-0.72, 0.72], [-0.1, 1.0], [0.55, 0.82], [0.86, 0.35], [0.9, 0.05], [1.06, -0.12], [0.88, -0.22], [0.86, -0.5], [0.66, -0.72], [0.38, -0.86], [-0.05, -0.8], [-0.45, -0.72], [-0.82, -0.4]], skin);
      // Hair cap.
      if (fem) poly([[0.62, 0.62], [0.2, 1.04], [-0.55, 0.92], [-1.0, 0.35], [-0.98, -0.3], [-0.72, -0.62], [-0.42, -0.2], [-0.22, 0.3], [0.2, 0.46]], who.hair);
      else poly([[0.66, 0.6], [0.35, 1.06], [-0.4, 1.02], [-0.96, 0.5], [-0.96, -0.1], [-0.66, -0.36], [-0.38, 0.05], [-0.1, 0.42], [0.36, 0.52]], who.hair);
      if (fem) ell(Q(-0.72, 0.72), 0.14, 0.16, who.tie);
      ell(Q(-0.2, -0.05), 0.15, 0.22, shade(skin, 0.12)); // ear
      if (S.face !== 'none') {
        ell(Q(0.56, 0.1), S.face === 'simple' ? 0.11 : 0.09, S.face === 'simple' ? 0.11 : 0.13, '#2a2733', { opacity: 1 });
        if (S.face === 'full') line([[0.42, 0.34], [0.66, 0.36]], who.hair, 0.09);
        line([[0.6, -0.48], [0.76, -0.46]], '#b0605a', 0.07);
        ell(Q(0.48, -0.25), 0.15, 0.1, '#ff7a8a', { opacity: 0.35 });
      }
      return;
    }
    if (back) {
      ell(Q(-0.9, -0.05), 0.15, 0.22, shade(skin, 0.08));
      ell(Q(0.9, -0.05), 0.15, 0.22, shade(skin, 0.08));
      if (fem) {
        poly([[-0.88, 0.1], [-0.6, 0.85], [0, 1.06], [0.6, 0.85], [0.88, 0.1], [0.75, -0.6], [0, -0.85], [-0.75, -0.6]], who.hair);
        poly([[-0.3, 0.5], [0.3, 0.5], [0.42, -0.4], [0.25, -1.3], [0, -1.6], [-0.25, -1.3], [-0.42, -0.4]], shade(who.hair, -0.06));
        ell(Q(0, 0.52), 0.24, 0.14, who.tie);
      } else poly([[-0.9, 0.1], [-0.65, 0.85], [0, 1.05], [0.65, 0.85], [0.9, 0.1], [0.78, -0.45], [0, -0.62], [-0.78, -0.45]], who.hair);
      return;
    }
    // Front.
    if (fem) poly([[-0.98, 0.1], [-0.82, 0.85], [0, 1.1], [0.82, 0.85], [0.98, 0.1], [0.9, -0.55], [-0.9, -0.55]], who.hair);
    ell(Q(-0.88 + tn * 0.2, -0.05), 0.14, 0.22, shade(skin, 0.08));
    ell(Q(0.88 + tn * 0.2, -0.05), 0.14, 0.22, shade(skin, 0.08));
    poly([[-0.84, 0.15], [-0.7, 0.75], [0, 0.98], [0.7, 0.75], [0.84, 0.15], [0.72, -0.5], [0.35, -0.9], [0, -0.98], [-0.35, -0.9], [-0.72, -0.5]].map(([a, b]) => [a + tn * 0.15, b]), skin);
    if (fem) poly([[-0.9, 0.1], [-0.78, 0.8], [0, 1.1], [0.78, 0.8], [0.9, 0.1], [0.62, 0.48], [0.1 + tn, 0.6], [-0.4, 0.44], [-0.72, 0.36]], who.hair);
    else poly([[-0.88, 0.2], [-0.72, 0.86], [0, 1.08], [0.72, 0.86], [0.88, 0.2], [0.66, 0.6], [0.2, 0.68], [-0.35, 0.62], [-0.7, 0.52]], who.hair);
    if (S.face !== 'none') {
      for (const x of [-0.32, 0.32]) {
        const xx = x + tn;
        if (Math.abs(xx) > 0.78) continue;
        ell(Q(xx, 0.06), S.face === 'simple' ? 0.11 : 0.09, S.face === 'simple' ? 0.11 : 0.13, '#2a2733', { opacity: 1 });
        if (S.face === 'full') line([[xx - 0.13, 0.3], [xx + 0.13, 0.31]], who.hair, 0.08);
        ell(Q(xx * 1.35, -0.3), 0.14, 0.09, '#ff7a8a', { opacity: 0.35 });
      }
      line([[-0.16 + tn, -0.44], [tn, -0.52], [0.16 + tn, -0.44]], '#b0605a', 0.07);
    }
  };

  // Draw order (each call is one outlined group).
  const G = (fn) => group(fn);
  if (side) {
    G(() => limb('L', true, true)); G(() => limb('L', true, false)); G(() => { torso(); }); G(() => limb('R', false, false));
    G(() => { neck(); head(); }); G(() => limb('R', false, true));
  } else {
    G(() => { limb('L', false, false); limb('R', false, false); }); G(() => torso());
    if (back) { G(() => { neck(); head(); }); G(() => limb('L', false, true)); G(() => limb('R', false, true)); }
    else { G(() => limb('L', false, true)); G(() => limb('R', false, true)); G(() => { neck(); head(); }); }
  }

  // Muscle highlights.
  const allow = hotSegs ? new Set(hotSegs) : null;
  for (const m of hot) {
    const spec = MUSCLE[m];
    if (!spec) continue;
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

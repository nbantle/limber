// Flat-illustration character drawn over the animation skeleton from figure.js.
// paint() turns a set of joints into a list of SVG shape ops for one frame.

export const COACHES = {
  a: { label: 'Ava', hair: '#4a2c22', top: '#ff6b8f', bottom: '#3a404e', shoe: '#ff5a86', tie: '#ffd166', ponytail: true, sleeves: false, shorts: false },
  b: { label: 'Max', hair: '#2a211d', top: '#3b8be0', bottom: '#2c3548', shoe: '#ff8a3d', ponytail: false, sleeves: true, shorts: true },
};
export const SKINS = ['#f7d5b8', '#e9b58f', '#c68a62', '#8b5a3c'];

let look = { ...COACHES.a, skin: SKINS[1] };
export function setLook(coach, skin) {
  look = { ...(COACHES[coach] ?? COACHES.a), skin: SKINS[skin] ?? SKINS[1] };
}
export const lookKey = () => `${look.label}-${look.skin}`;

const HL = '#ff5a1f';
const EYE = '#2a2733';
const HEAD_R = 5;

// Limb radii at [start, end].
const RAD = { th: [3.7, 2.6], sh: [2.55, 1.75], ua: [2.35, 1.8], fa: [1.8, 1.45], neck: [1.8, 1.8], shoe: [1.95, 1.6] };
const TORSO = {
  side: [[0, 4.9], [0.35, 4.3], [0.72, 5.2], [1, 3.9]],
  front: [[0, 6.4], [0.35, 5.5], [0.72, 7.1], [1, 6.1]],
};

// Where each muscle's dashed line sits: [segment kind, from, to, side (1 = front, -1 = back, 0 = center)].
const LINES = {
  quads: ['th', 0.14, 0.85, 1], hamstrings: ['th', 0.18, 0.88, -1], glutes: ['th', 0, 0.36, -1],
  hipFlexors: ['th', 0, 0.4, 1], adductors: ['th', 0.15, 0.8, 0], calves: ['sh', 0.1, 0.62, -1],
  chest: ['torso', 0.6, 0.88, 1], abs: ['torso', 0.18, 0.56, 1], obliques: ['torso', 0.2, 0.62, 0],
  lowerBack: ['torso', 0.08, 0.44, -1], upperBack: ['torso', 0.58, 0.9, -1], lats: ['torso', 0.42, 0.84, -0.5],
  traps: ['torso', 0.84, 1, -1], neck: ['neck', -0.2, 0.42, 0], shoulders: ['ua', 0, 0.38, 0],
  biceps: ['ua', 0.22, 0.88, 1], triceps: ['ua', 0.22, 0.88, -1], forearms: ['fa', 0.12, 0.8, 0],
};

const f = (n) => n.toFixed(2);
const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - amt)));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Filled outline around a polyline with per-point radii and optional round caps.
function ribbon(pts, rads, capA = true, capB = true) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const p = pts[Math.max(0, i - 1)], q = pts[Math.min(n - 1, i + 1)];
    let tx = q[0] - p[0], ty = q[1] - p[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len; ty /= len;
    L.push([pts[i][0] - ty * rads[i], pts[i][1] + tx * rads[i]]);
    R.push([pts[i][0] + ty * rads[i], pts[i][1] - tx * rads[i]]);
  }
  let d = `M${f(L[0][0])} ${f(L[0][1])}`;
  for (let i = 1; i < n; i++) d += `L${f(L[i][0])} ${f(L[i][1])}`;
  const re = rads[n - 1], rs = rads[0];
  d += capB ? `A${f(re)} ${f(re)} 0 0 0 ${f(R[n - 1][0])} ${f(R[n - 1][1])}` : `L${f(R[n - 1][0])} ${f(R[n - 1][1])}`;
  for (let i = n - 2; i >= 0; i--) d += `L${f(R[i][0])} ${f(R[i][1])}`;
  d += capA ? `A${f(rs)} ${f(rs)} 0 0 0 ${f(L[0][0])} ${f(L[0][1])}Z` : 'Z';
  return d;
}

function profile(table, u) {
  for (let i = 1; i < table.length; i++) {
    if (u <= table[i][0]) {
      const [u0, r0] = table[i - 1], [u1, r1] = table[i];
      return r0 + ((r1 - r0) * (u - u0)) / (u1 - u0);
    }
  }
  return table[table.length - 1][1];
}

// Segment geometry: point at u, radius at u, unit "front" normal.
function segGeom(kind, a, b, J, view) {
  if (kind === 'torso') {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = (b[1] - a[1]) / len, ny = -(b[0] - a[0]) / len;
    const c = [(a[0] + b[0]) / 2 + nx * J.c * 1.6, (a[1] + b[1]) / 2 + ny * J.c * 1.6];
    const at = (u) => [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
    const table = TORSO[view === 'front' ? 'front' : 'side'];
    const tx = (b[0] - a[0]) / len, ty = (b[1] - a[1]) / len;
    return { at, rad: (u) => profile(table, u), front: [-ty, tx], curved: true };
  }
  const [r0, r1] = RAD[kind];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const tx = (b[0] - a[0]) / len, ty = (b[1] - a[1]) / len;
  return { at: (u) => lerp(a, b, u), rad: (u) => r0 + (r1 - r0) * u, front: [ty, -tx], curved: false };
}

function band(g, u0, u1, extra = 0, capA = false, capB = false) {
  const n = g.curved ? 9 : 2;
  const pts = [], rads = [];
  for (let i = 0; i < n; i++) { const u = u0 + ((u1 - u0) * i) / (n - 1); pts.push(g.at(u)); rads.push(g.rad(u) + extra); }
  return ribbon(pts, rads, capA, capB);
}

function dashLine(g, u0, u1, side) {
  const n = g.curved ? 8 : 2;
  let d = '';
  for (let i = 0; i < n; i++) {
    const u = u0 + ((u1 - u0) * i) / (n - 1);
    const p = g.at(u), off = g.rad(u) * 0.52 * side;
    d += `${i ? 'L' : 'M'}${f(p[0] + g.front[0] * off)} ${f(p[1] + g.front[1] * off)}`;
  }
  return d;
}

const path = (d, fill) => ({ tag: 'path', d, fill });
const circle = (c, r, fill, extra) => ({ tag: 'circle', cx: f(c[0]), cy: f(c[1]), r: f(r), fill, ...extra });

export function paint(J, view, hot, hotSegs) {
  const side = view !== 'front';
  const ops = [];
  const S = look;
  const tone = (col, far) => (far ? shade(col, 0.16) : col);
  const geoms = {};
  const seg = (name, kind, a, b) => (geoms[name] = { kind, g: segGeom(kind, J[a], J[b], J, view) });

  const arm = (s, far) => {
    const ua = seg('ua' + s, 'ua', 'shoulder' + s, 'elbow' + s).g;
    const fa = seg('fa' + s, 'fa', 'elbow' + s, 'hand' + s).g;
    ops.push(path(band(ua, 0, 1, 0, true, true), tone(S.skin, far)));
    if (S.sleeves) ops.push(path(band(ua, 0, 0.46, 0.4, true, false), tone(S.top, far)));
    ops.push(path(band(fa, 0, 1, 0, true, true), tone(S.skin, far)));
    ops.push(circle(J['hand' + s], 1.9, tone(S.skin, far)));
  };
  const leg = (s, far) => {
    const th = seg('th' + s, 'th', 'hip' + s, 'knee' + s).g;
    const sh = seg('sh' + s, 'sh', 'knee' + s, 'ankle' + s).g;
    const legCol = S.shorts ? S.skin : S.bottom;
    ops.push(path(band(sh, 0, 1, 0, true, true), tone(legCol, far)));
    ops.push(path(band(th, 0, 1, 0, true, true), tone(legCol, far)));
    if (S.shorts) ops.push(path(band(th, 0, 0.56, 0.45, true, false), tone(S.bottom, far)));
    // Sneaker from just behind the ankle to the toe.
    const A = J['ankle' + s], T = J['toe' + s];
    const len = Math.hypot(T[0] - A[0], T[1] - A[1]) || 1;
    const heel = [A[0] - ((T[0] - A[0]) / len) * 1.1, A[1] - ((T[1] - A[1]) / len) * 1.1];
    ops.push(path(ribbon([heel, T], RAD.shoe), tone(S.shoe, far)));
  };
  const torso = () => {
    const g = seg('torso', 'torso', 'hip', 'neck').g;
    ops.push(path(band(g, 0, 1, 0, true, true), S.top));
    if (S.shorts) ops.push(path(band(g, 0, 0.2, 0.08, true, false), S.bottom));
    else {
      ops.push(path(band(g, 0, 0.24, 0.08, true, false), S.bottom));
      ops.push(path(band(g, 0.24, 0.42, 0.05), S.skin));
    }
  };
  const neck = () => {
    const g = seg('neck', 'neck', 'neck', 'head').g;
    ops.push(path(band(g, 0, 0.55, 0, true, true), shade(S.skin, 0.06)));
  };
  const head = () => {
    const C = J.head, r = HEAD_R;
    let ux = C[0] - J.neck[0], uy = C[1] - J.neck[1];
    const ul = Math.hypot(ux, uy) || 1;
    ux /= ul; uy /= ul;
    const fx = -uy, fy = ux; // facing direction (side view)
    const P = (fw, up) => [C[0] + fx * fw * r + ux * up * r, C[1] + fy * fw * r + uy * up * r];
    if (side) {
      if (S.ponytail) {
        const base = P(-0.8, 0.42);
        const tail = [P(-0.8, 0.42), P(-1.45, -0.1), P(-1.55, -0.95)];
        ops.push(path(ribbon(tail, [0.42 * r, 0.5 * r, 0.16 * r]), S.hair));
        ops.push(circle(base, 0.24 * r, S.tie));
      }
      ops.push(circle(P(S.ponytail ? -0.16 : -0.12, S.ponytail ? 0.1 : 0.16), (S.ponytail ? 1.04 : 0.99) * r, S.hair));
      ops.push(circle(P(0.1, -0.06), 0.9 * r, S.skin));
      if (!S.ponytail) ops.push(path(ribbon([P(-0.2, 0.86), P(0.62, 0.62)], [0.22 * r, 0.14 * r]), S.hair));
      ops.push(circle(P(-0.14, -0.04), 0.2 * r, shade(S.skin, 0.12)));
      ops.push(circle(P(0.6, 0.12), 0.11 * r, EYE));
      ops.push(circle(P(0.52, -0.32), 0.16 * r, '#ff7a8a', { opacity: 0.35 }));
    } else {
      if (S.ponytail) ops.push(circle(P(0, 0.95), 0.36 * r, S.hair));
      ops.push(circle(P(0, 0.12), 1.03 * r, S.hair));
      ops.push(circle(P(-0.92, -0.08), 0.2 * r, shade(S.skin, 0.08)));
      ops.push(circle(P(0.92, -0.08), 0.2 * r, shade(S.skin, 0.08)));
      // Head turn shifts the face features toward one side.
      const tn = Math.max(-1, Math.min(1, J.turn ?? 0)) * 0.42;
      ops.push(circle(P(tn * 0.25, -0.1), 0.88 * r, S.skin));
      ops.push(path(ribbon([P(-0.6 + tn * 0.5, 0.62), P(0.6 + tn * 0.5, 0.62)], [0.18 * r, 0.18 * r]), S.hair));
      for (const ex of [-0.33, 0.33]) {
        const x = ex + tn * (1 - Math.abs(ex + tn) * 0.4);
        if (Math.abs(x) < 0.8) ops.push(circle(P(x, 0.04), 0.1 * r, EYE));
        ops.push(circle(P(x * 1.4, -0.32), 0.15 * r, '#ff7a8a', { opacity: Math.abs(x) < 0.7 ? 0.3 : 0 }));
      }
    }
  };

  if (side) {
    arm('L', true); leg('L', true); torso(); leg('R', false); neck(); head(); arm('R', false);
  } else {
    leg('L', false); leg('R', false); torso(); neck(); arm('L', false); arm('R', false); head();
  }

  // Dashed lines on the muscles being worked.
  const allow = hotSegs ? new Set(hotSegs) : null;
  // Back-of-torso muscles aren't visible from the front; skip them unless nothing else would show.
  let list = [...hot].filter((m) => LINES[m]);
  if (!side) {
    const visible = list.filter((m) => !(LINES[m][0] === 'torso' && LINES[m][3] < 0));
    if (visible.length) list = visible;
  }
  for (const m of list) {
    const spec = LINES[m];
    const [kind, u0, u1, sd] = spec;
    const names = kind === 'torso' || kind === 'neck' ? [kind] : side ? [kind + 'R'] : [kind + 'L', kind + 'R'];
    const targets = allow ? Object.keys(geoms).filter((n) => geoms[n].kind === kind && (allow.has(n) || kind === 'torso' || kind === 'neck')) : names;
    for (const n of targets) {
      const G = geoms[n];
      if (!G) continue;
      const sides = !side && m === 'obliques' ? [-0.75, 0.75] : [side ? sd : 0];
      for (const s of sides) {
        const d = dashLine(G.g, u0, u1, s);
        ops.push({ tag: 'path', d, fill: 'none', stroke: HL, 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0.22 });
        ops.push({ tag: 'path', d, fill: 'none', stroke: HL, 'stroke-width': 1.05, 'stroke-linecap': 'round', 'stroke-dasharray': '1.7 1.3' });
      }
    }
  }
  return ops;
}

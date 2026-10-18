import { paint } from './character2.js';
import { C, mix } from './palette.js';

// Animated figure renderer.
//
// Poses use absolute segment angles in degrees: 0 = up, 90 = forward (screen right),
// 180 = down, 270 (or -90) = backward. Side-view figures face right; "R" limbs are the
// near side and "L" limbs the far side. In front view, "L" is the screen-left limb.
//
// pose = { t: torso, h: head, aL/aR: [upperArm, forearm], lL/lR: [thigh, shin, foot?], lift,
//          c: spine curve, sy: shoulder lift, turn: head turn (-1..1, front view),
//          kth/ksh/kua/kfa: thigh/shin/upper-arm/forearm length factor for limbs pointing at the viewer (number or [L, R]),
//          pv: pelvis angle in front view (defaults to t; 0 keeps the hips level while the torso bends) }
// A leg's foot angle defaults to flat (side view) or turned out (front view). In side view a relaxed
// foot sits at shin − 90; pointed toes approach the shin angle. Anything past the shin angle is backwards.
// anim.top draws a lying figure seen from above (front view rules, no floor).
// anim.legsFront (front view) draws the legs over the torso, for seated poses with the knees toward the viewer;
//   'cross' (cross-legged) also puts the shins in front of the thighs.
// anim.steady keeps the anchor fixed between frames (e.g. hands on the floor while the legs swing).
// anim.gear draws equipment in the hands: { kind: 'db' | 'kb' | 'bb', hands: 'LR' | 'R' | 'both', axis, at }.
//   axis (dumbbells/barbells): 'end' = handle points at the viewer (drawn as a plate), 'perp' = across the
//   forearm, 'along' = in line with the forearm, 'level' = horizontal, 'upright' = vertical. hands 'both' = one item held in both hands.
//   at: 'back' rests a barbell across the upper back instead of in the hands.
//   Resistance bands: { kind: 'band', to: 'hands' | 'feet' | 'anchor' | 'knees', at, dx, dy, behind }.
//   'hands' stretches between the grips, 'feet' runs from each grip down under that foot, 'anchor' runs to
//   a fixed point (at + dx/dy, from the first frame), 'knees' is a loop around the thighs. behind: draw it behind the body.

const LEN = { torso: 24, shoulderAt: 21, neck: 2.5, headR: 5, ua: 12.5, fa: 12, th: 18, sh: 18, foot: 6, footFront: 3.2 };
export const GLUTE = { r: 4.2, off: 1.4 }; // side-view seat: circle tucked behind the hip, between torso and thighs
const WID = { torso: 10, neck: 3.6, ua: 4.7, fa: 3.6, th: 7.4, sh: 5.1, foot: 3.9 };
const SVGNS = 'http://www.w3.org/2000/svg';


const rad = (a) => (a * Math.PI) / 180;
const dir = (a) => [Math.sin(rad(a)), -Math.cos(rad(a))];
const add = (p, a, len) => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);
const side = (v, s) => (Array.isArray(v) ? v[s === 'L' ? 0 : 1] : v ?? 1);

function solve(pose, view) {
  const front = view === 'front';
  const t = pose.t ?? 0;
  const h = pose.h ?? t;
  const J = {};
  J.c = pose.c ?? 0;
  J.turn = pose.turn ?? 0;
  J.hip = [0, 0];
  J.neck = add(J.hip, t, LEN.torso);
  J.head = add(J.neck, h, LEN.neck + LEN.headR);
  const sh = add(J.hip, t, LEN.shoulderAt + (pose.sy ?? 0));
  const p = front ? dir(t + 90) : [0, 0];
  const pp = front ? dir((pose.pv ?? t) + 90) : [0, 0];
  J.shoulderL = [sh[0] - p[0] * 7, sh[1] - p[1] * 7];
  J.shoulderR = [sh[0] + p[0] * 7, sh[1] + p[1] * 7];
  J.hipL = [-pp[0] * 4.2, -pp[1] * 4.2];
  J.hipR = [pp[0] * 4.2, pp[1] * 4.2];
  for (const s of ['L', 'R']) {
    const [u, f] = pose['a' + s] ?? [180, 180];
    J['elbow' + s] = add(J['shoulder' + s], u, LEN.ua * side(pose.kua, s));
    J['hand' + s] = add(J['elbow' + s], f, LEN.fa * side(pose.kfa, s));
    const [th, shn, ft] = pose['l' + s] ?? [180, 180];
    J['knee' + s] = add(J['hip' + s], th, LEN.th * side(pose.kth, s));
    J['ankle' + s] = add(J['knee' + s], shn, LEN.sh * side(pose.ksh, s));
    J['footAngle' + s] = ft ?? defaultFoot(shn, s, front);
    J['toe' + s] = add(J['ankle' + s], J['footAngle' + s], front ? LEN.footFront : LEN.foot);
  }
  if (!front) {
    // Glutes sit behind the hip, pointing away from where the torso and thighs go.
    const thL = (pose.lL ?? [180])[0], thR = (pose.lR ?? [180])[0];
    const mix = (a, b, c) => [0, 1].map((i) => dir(a)[i] + (dir(b)[i] + dir(c)[i]) / 2);
    const bk = mix(t - 90, thL + 90, thR + 90), fw = mix(t, thL, thR);
    const v = [bk[0] - 0.6 * fw[0], bk[1] - 0.6 * fw[1]];
    const l = Math.hypot(v[0], v[1]) || 1;
    J.glute = [v[0] / l * GLUTE.off, v[1] / l * GLUTE.off];
  }
  return J;
}

const defaultFoot = (shn, s, front) => (front ? (s === 'L' ? shn + 90 : shn - 90) : 90);

function segments(J, view) {
  const S = (name, a, b, kind, far) => ({ name, a: J[a], b: J[b], kind, far, w: WID[kind] });
  const limbs = (s, far) => ({
    arm: [S('ua' + s, 'shoulder' + s, 'elbow' + s, 'ua', far), S('fa' + s, 'elbow' + s, 'hand' + s, 'fa', far)],
    leg: [S('th' + s, 'hip' + s, 'knee' + s, 'th', far), S('sh' + s, 'knee' + s, 'ankle' + s, 'sh', far), S('ft' + s, 'ankle' + s, 'toe' + s, 'foot', far)],
  });
  const core = [{ ...S('torso', 'hip', 'neck', 'torso', false), c: J.c }, S('neck', 'neck', 'head', 'neck', false)];
  const L = limbs('L', view !== 'front');
  const R = limbs('R', false);
  // Seated front views (butterfly) have the legs coming toward the viewer, so they draw over the torso.
  if (view === 'front') return J.legsFront ? [...core, ...L.leg, ...R.leg, ...L.arm, ...R.arm] : [...L.leg, ...R.leg, ...core, ...L.arm, ...R.arm];
  return [...L.arm, ...L.leg, ...core, ...R.leg, ...R.arm];
}

// ───────────── Equipment ─────────────
const GEAR = { plate: C.charcoal, hub: C.slate, bar: mix(C.slate, C.white, 0.35), far: mix(C.slate, C.white, 0.15), ring: mix(C.charcoal, C.white, 0.12) };
const unit = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const grip = (J, s) => { const F = unit([J['hand' + s][0] - J['elbow' + s][0], J['hand' + s][1] - J['elbow' + s][1]]); return { p: [J['hand' + s][0] + F[0], J['hand' + s][1] + F[1]], F }; };
const f2 = (n) => n.toFixed(2);

export const BAND_COLORS = [C.lime, C.coral, C.green, C.ocean, C.charcoal]; // extra light → extra heavy

function bandParts(J, gear, view, anchor, color) {
  const out = { far: [], near: [], pts: [] };
  const side = view === 'side';
  const line = (list, a, b) => list.push({ tag: 'path', d: `M${f2(a[0])} ${f2(a[1])}L${f2(b[0])} ${f2(b[1])}`, stroke: color, 'stroke-width': 1.4, 'stroke-linecap': 'round', fill: 'none' });
  const layer = (s) => (gear.behind || (side && s === 'L') ? out.far : out.near);
  if (gear.to === 'hands') { line(gear.behind ? out.far : out.near, grip(J, 'L').p, grip(J, 'R').p); return out; }
  if (gear.to === 'knees') {
    const at = (s) => { const h = J['hip' + s], k = J['knee' + s]; return [h[0] + (k[0] - h[0]) * 0.8, h[1] + (k[1] - h[1]) * 0.8]; };
    if (side) {
      const a = at('R'), T = unit([J.kneeR[0] - J.hipR[0], J.kneeR[1] - J.hipR[1]]), N = [-T[1], T[0]];
      line(out.near, [a[0] + N[0] * 2.9, a[1] + N[1] * 2.9], [a[0] - N[0] * 2.9, a[1] - N[1] * 2.9]);
    } else {
      const a = at('L'), b = at('R'), A = unit([b[0] - a[0], b[1] - a[1]]);
      line(out.near, [a[0] - A[0] * 2.6, a[1] - A[1] * 2.6], [b[0] + A[0] * 2.6, b[1] + A[1] * 2.6]);
    }
    return out;
  }
  for (const s of ['L', 'R']) {
    const g = grip(J, s).p;
    let end;
    if (gear.to === 'feet') {
      const A = J['ankle' + s], T = J['toe' + s];
      end = [(A[0] + T[0]) / 2, Math.max(A[1], T[1]) + 0.6];
    } else end = anchor;
    if (end) line(layer(s), g, end);
  }
  if (gear.to === 'anchor' && anchor) {
    out.far.push({ tag: 'circle', cx: f2(anchor[0]), cy: f2(anchor[1]), r: 1.3, fill: GEAR.plate });
    out.pts.push([anchor[0], anchor[1], 1.5]);
  }
  return out;
}

// Returns { far, near } paint ops and contact circles [x, y, r] for the equipment in this pose.
function gearParts(J, gear, view, anchor, color = BAND_COLORS[2]) {
  const out = { far: [], near: [], pts: [] };
  if (!gear) return out;
  if (gear.kind === 'band') return anchor === null ? out : bandParts(J, gear, view, anchor, color);
  const side = view === 'side';
  const circle = (list, c, r, fill) => { list.push({ tag: 'circle', cx: f2(c[0]), cy: f2(c[1]), r: f2(r), fill }); out.pts.push([c[0], c[1], r]); };
  const bar = (list, a, b, w, stroke) => list.push({ tag: 'path', d: `M${f2(a[0])} ${f2(a[1])}L${f2(b[0])} ${f2(b[1])}`, stroke, 'stroke-width': w, 'stroke-linecap': 'round', fill: 'none' });
  const plate = (list, c, A, along, across, fill) => {
    const N = [-A[1], A[0]], ang = (Math.atan2(A[1], A[0]) * 180) / Math.PI;
    list.push({ tag: 'rect', x: f2(c[0] - along / 2), y: f2(c[1] - across / 2), width: f2(along), height: f2(across), rx: 0.8, transform: `rotate(${f2(ang)} ${f2(c[0])} ${f2(c[1])})`, fill });
    out.pts.push([c[0], c[1], Math.max(Math.abs(N[1]) * across, Math.abs(A[1]) * along) / 2]);
  };
  const axisOf = (F) => {
    const a = gear.axis ?? (side ? 'end' : 'perp');
    return a === 'perp' ? [-F[1], F[0]] : a === 'along' ? F : a === 'level' ? [1, 0] : a === 'upright' ? [0, -1] : null;
  };
  const dumbbell = (list, c, A, far) => {
    const col = far ? GEAR.far : GEAR.plate;
    if (!A) { circle(list, c, 2.6, col); list.push({ tag: 'circle', cx: f2(c[0]), cy: f2(c[1]), r: 1, fill: GEAR.hub }); return; }
    bar(list, [c[0] - A[0] * 3.2, c[1] - A[1] * 3.2], [c[0] + A[0] * 3.2, c[1] + A[1] * 3.2], 1.2, GEAR.bar);
    for (const k of [-1, 1]) plate(list, [c[0] + A[0] * 3.9 * k, c[1] + A[1] * 3.9 * k], A, 2.2, 5.2, col);
  };
  const kettlebell = (list, c, D, far) => {
    list.push({ tag: 'circle', cx: f2(c[0] + D[0] * 1.3), cy: f2(c[1] + D[1] * 1.3), r: 1.9, fill: 'none', stroke: GEAR.hub, 'stroke-width': 1.1 });
    circle(list, [c[0] + D[0] * 4.4, c[1] + D[1] * 4.4], 3.3, far ? GEAR.far : GEAR.plate);
  };
  const hands = gear.hands ?? 'LR';
  if (gear.kind === 'bb') {
    let c, A;
    if (gear.at === 'back') {
      const T = unit([J.neck[0] - J.hip[0], J.neck[1] - J.hip[1]]);
      c = [J.neck[0] - T[0] * 2 + T[1] * 4.2, J.neck[1] - T[1] * 2 - T[0] * 4.2]; // behind the neck (side view faces right)
    } else c = side ? grip(J, 'R').p : [(grip(J, 'L').p[0] + grip(J, 'R').p[0]) / 2, (grip(J, 'L').p[1] + grip(J, 'R').p[1]) / 2];
    if (side) {
      circle(out.near, c, 7.4, GEAR.plate);
      out.near.push({ tag: 'circle', cx: f2(c[0]), cy: f2(c[1]), r: 5.6, fill: 'none', stroke: GEAR.ring, 'stroke-width': 0.6 });
      out.near.push({ tag: 'circle', cx: f2(c[0]), cy: f2(c[1]), r: 1.6, fill: GEAR.hub });
      out.near.push({ tag: 'circle', cx: f2(c[0]), cy: f2(c[1]), r: 0.8, fill: GEAR.bar });
    } else {
      const gl = grip(J, 'L').p, gr = grip(J, 'R').p;
      A = unit([gr[0] - gl[0], gr[1] - gl[1]]);
      const half = Math.hypot(gr[0] - gl[0], gr[1] - gl[1]) / 2 + 13;
      bar(out.far, [c[0] - A[0] * half, c[1] - A[1] * half], [c[0] + A[0] * half, c[1] + A[1] * half], 1.3, GEAR.bar);
      for (const k of [-1, 1]) {
        plate(out.near, [c[0] + A[0] * (half - 4.5) * k, c[1] + A[1] * (half - 4.5) * k], A, 2.8, 14, GEAR.plate);
        plate(out.near, [c[0] + A[0] * (half - 7.6) * k, c[1] + A[1] * (half - 7.6) * k], A, 2.2, 10, GEAR.plate);
      }
    }
    return out;
  }
  const draw = gear.kind === 'kb' ? kettlebell : dumbbell;
  if (hands === 'both') {
    const a = grip(J, 'L'), b = grip(J, 'R');
    const c = [(a.p[0] + b.p[0]) / 2, (a.p[1] + b.p[1]) / 2];
    const F = unit([a.F[0] + b.F[0], a.F[1] + b.F[1]]);
    draw(out.near, c, gear.kind === 'kb' ? F : axisOf(F), false);
    return out;
  }
  for (const s of hands === 'R' ? ['R'] : ['L', 'R']) {
    const g = grip(J, s), far = side && s === 'L';
    draw(far ? out.far : out.near, g.p, gear.kind === 'kb' ? g.F : axisOf(g.F), far);
  }
  return out;
}

function contactPoints(J, exclude) {
  const pts = [[J.head[0], J.head[1], LEN.headR], [J.hip[0], J.hip[1], WID.torso / 2], [J.neck[0], J.neck[1], WID.torso / 2]];
  if (J.glute) pts.push([J.glute[0], J.glute[1], GLUTE.r]);
  for (const s of ['L', 'R']) {
    if (!exclude.has('hand' + s)) pts.push([...J['elbow' + s], WID.ua / 2], [...J['hand' + s], WID.fa / 2]);
    pts.push([...J['shoulder' + s], WID.ua / 2]);
    if (!exclude.has('ankle' + s)) pts.push([...J['ankle' + s], WID.sh / 2], [...J['toe' + s], WID.foot / 2]);
    pts.push([...J['knee' + s], WID.th / 2]);
  }
  return pts;
}

const ANGLES = new Set(['t', 'h', 'pv', 'aL', 'aR', 'lL', 'lR']);

function interp(a, b, u, front) {
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const def = { t: 0, c: 0, lift: 0, sy: 0, turn: 0, kth: 1, ksh: 1, kua: 1, kfa: 1, aL: [180, 180], aR: [180, 180], lL: [180, 180], lR: [180, 180] };
  // Angles turn the short way round (a raised arm lowers in front, it doesn't swing through the body).
  const lerp = (k, x, y) => {
    if (!ANGLES.has(k)) return x + (y - x) * u;
    return x + ((((y - x) % 360) + 540) % 360 - 180) * u;
  };
  // A leg that names its foot angle in only one frame gets the other frame's default foot, not a copy.
  const leg = (v, k) => (v.length > 2 ? v : [...v, defaultFoot(v[1], k.slice(-1), front)]);
  for (const k of keys) {
    let va = a[k] ?? (k === 'h' || k === 'pv' ? a.t ?? 0 : def[k]);
    let vb = b[k] ?? (k === 'h' || k === 'pv' ? b.t ?? 0 : def[k]);
    if (Array.isArray(va) || Array.isArray(vb)) {
      va = va ?? []; vb = vb ?? [];
      if ((k === 'lL' || k === 'lR') && va.length !== vb.length) { va = leg(va, k); vb = leg(vb, k); }
      const n = Math.max(va.length, vb.length);
      out[k] = [];
      for (let i = 0; i < n; i++) {
        const x = va[i], y = vb[i];
        if (x === undefined && y === undefined) continue;
        out[k][i] = x === undefined ? y : y === undefined ? x : lerp(k, x, y);
      }
    } else out[k] = lerp(k, va, vb);
  }
  return out;
}

function ik(J, s, target, kind) {
  const [root, mid, end, a, b] = kind === 'hand'
    ? ['shoulder' + s, 'elbow' + s, 'hand' + s, LEN.ua, LEN.fa]
    : ['hip' + s, 'knee' + s, 'ankle' + s, LEN.th, LEN.sh];
  const R = J[root], M = J[mid], E = J[end];
  const cross = (M[0] - R[0]) * (E[1] - M[1]) - (M[1] - R[1]) * (E[0] - M[0]);
  const dx = target[0] - R[0], dy = target[1] - R[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(a - b) + 0.01), a + b - 0.001);
  const base = Math.atan2(dy, dx);
  const alpha = Math.acos((a * a + d * d - b * b) / (2 * a * d));
  const tgt = [R[0] + Math.cos(base) * d, R[1] + Math.sin(base) * d];
  let best = null;
  for (const c of [base + alpha, base - alpha]) {
    const m = [R[0] + Math.cos(c) * a, R[1] + Math.sin(c) * a];
    const cr = (m[0] - R[0]) * (tgt[1] - m[1]) - (m[1] - R[1]) * (tgt[0] - m[0]);
    const score = Math.sign(cr) === Math.sign(cross) ? 0 : 1;
    const dist = Math.hypot(m[0] - M[0], m[1] - M[1]);
    if (!best || score < best.score || (score === best.score && dist < best.dist)) best = { m, score, dist };
  }
  J[mid] = best.m;
  J[end] = tgt;
  if (kind === 'ankle') J['toe' + s] = add(tgt, J['footAngle' + s], LEN.foot);
}

// Build a sampler for an exercise animation: returns world-space joints at time t (seconds).
export function makeRig(anim) {
  const frames = anim.frames;
  const view = anim.top ? 'front' : anim.view ?? 'side';
  const dur = anim.dur ?? 1.4;
  const anchor = anim.anchor ?? (view === 'front' || anim.top ? 'hip' : 'ankleR');
  const plant = new Set(anim.plant ?? []);
  const cycle = frames.length * dur;

  const poseAt = (time) => {
    if (frames.length === 1) return frames[0];
    const tt = ((time % cycle) + cycle) % cycle;
    const i = Math.floor(tt / dur);
    const u = (tt - i * dur) / dur;
    const hold = anim.hold ?? 0.25;
    const uu = u < hold / 2 ? 0 : u > 1 - hold / 2 ? 1 : (u - hold / 2) / (1 - hold);
    return interp(frames[i], frames[(i + 1) % frames.length], ease(uu), view === 'front');
  };

  const place = (pose, ref) => {
    const J = solve(pose, view);
    let dx = 0, dy = 0;
    if (ref) dx = ref.anchor[0] - J[anchor][0];
    // steady: after the first frame, hold the anchor still instead of re-seating the body on the floor.
    if (anim.hang || anim.top || (anim.steady && ref)) {
      if (ref) dy = ref.anchor[1] - J[anchor][1];
    } else {
      const pts = [...contactPoints(J, plant), ...gearParts(J, anim.gear, view, null).pts];
      dy = -Math.max(...pts.map((p) => p[1] + p[2])) - (pose.lift ?? 0);
    }
    for (const k in J) if (Array.isArray(J[k])) J[k] = [J[k][0] + dx, J[k][1] + dy];
    if (anim.legsFront) J.legsFront = anim.legsFront;
    if (ref) {
      for (const p of plant) {
        const s = p.slice(-1);
        ik(J, s, ref.joints[p], p.startsWith('hand') ? 'hand' : 'ankle');
      }
    }
    return J;
  };

  const J0 = place(frames[0], null);
  const g = anim.gear;
  const bandAnchor = g?.kind === 'band' && g.to === 'anchor' ? [J0[g.at ?? 'shoulderR'][0] + (g.dx ?? 0), J0[g.at ?? 'shoulderR'][1] + (g.dy ?? 0)] : undefined;
  const ref = { anchor: J0[anchor], joints: J0 };
  const at = (time) => place(poseAt(time), ref);
  const atFrame = (i) => place(frames[i % frames.length], ref);

  // Props are positioned from the first frame.
  const props = (anim.props ?? []).map((pr) => {
    const j = J0[pr.at ?? 'hip'];
    if (pr.type === 'wall') return { type: 'wall', x: j[0] + (pr.dx ?? 0) };
    if (pr.type === 'bar') return { type: 'bar', x: j[0] + (pr.dx ?? 0), y: j[1] - 1.5, w: pr.w ?? 34 };
    if (pr.type === 'box') return { type: 'box', x: j[0] + (pr.dx ?? 0), y: j[1] + (pr.dy ?? 2), w: pr.w ?? 16 };
    if (pr.type === 'bench') return { type: 'bench', x: j[0] + (pr.dx ?? 0), y: j[1] + (pr.dy ?? 2), w: pr.w ?? 30 };
    if (pr.type === 'chair') return { type: 'chair', x: j[0] + (pr.dx ?? 0), y: J0.glute ? J0.glute[1] + GLUTE.r - 0.4 : j[1] + 4.6, front: view === 'front' };
    return null;
  }).filter(Boolean);

  // Bounding box across the whole cycle.
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const grow = (x, y, r = 0) => { x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r); };
  const N = Math.max(24, frames.length * 10);
  for (let i = 0; i <= N; i++) {
    const J = at((i / N) * cycle);
    for (const s of segments(J, view)) { grow(...s.a, s.w / 2); grow(...s.b, s.w / 2); }
    grow(...J.head, LEN.headR);
    for (const [x, y, r] of gearParts(J, anim.gear, view, bandAnchor).pts) grow(x, y, r);
  }
  if (!anim.hang && !anim.top) grow(x0, 0);
  for (const pr of props) {
    if (pr.type === 'wall') grow(pr.x, y0), grow(pr.x, 0);
    if (pr.type === 'bar') grow(pr.x - pr.w / 2, pr.y - 2), grow(pr.x + pr.w / 2, pr.y);
    if (pr.type === 'box' || pr.type === 'bench') grow(pr.x - pr.w / 2, pr.y), grow(pr.x + pr.w / 2, 0);
    if (pr.type === 'chair') grow(pr.x - 10, pr.y - 24), grow(pr.x + 10, 0);
  }
  // Floor exercises get a yoga mat.
  const nearFloor = ['hip', 'kneeL', 'kneeR', 'handL', 'handR', 'neck'].some((k) => J0[k][1] > -7.5);
  const mat = anim.top || (anim.mat ?? (!anim.hang && nearFloor));
  const bbox = [x0, y0, x1, y1];
  return { at, atFrame, view, cycle, bbox, props, mat, bandAnchor, hang: !!anim.hang, top: !!anim.top };
}

function fitBox(bbox, aspect, pad = 7) {
  let [x0, y0, x1, y1] = bbox;
  x0 -= pad; x1 += pad; y0 -= pad; y1 += pad * 0.6;
  let w = x1 - x0, h = y1 - y0;
  const minH = 62;
  if (h < minH) { y0 -= (minH - h) * 0.75; y1 += (minH - h) * 0.25; h = minH; }
  if (w / h < aspect) { const nw = h * aspect; x0 -= (nw - w) / 2; w = nw; }
  else { const nh = w / aspect; y0 -= (nh - h) * 0.75; h = nh; }
  return [x0, y0, w, h];
}

const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};

function drawChair(svg, { x, y, front }) {
  const g = el('g', { class: 'fig-chair' }, svg);
  if (front) {
    el('rect', { x: x - 8.5, y: y - 24, width: 17, height: 22, rx: 2.5, class: 'back' }, g);
    for (const dx of [-8.5, -6, 6, 8.5]) el('line', { x1: x + dx, x2: x + dx, y1: y, y2: 0 }, g);
    el('rect', { x: x - 10, y, width: 20, height: 2.6, rx: 1.2 }, g);
  } else {
    el('line', { x1: x - 7, x2: x - 7, y1: y - 22, y2: 0 }, g);
    el('line', { x1: x + 6, x2: x + 6, y1: y, y2: 0 }, g);
    el('rect', { x: x - 8, y, width: 15, height: 2.6, rx: 1.2 }, g);
  }
}

// Flat weight bench: padded top on two legs.
function drawBench(svg, { x, y, w }) {
  const g = el('g', { class: 'fig-chair' }, svg);
  for (const dx of [-w / 2 + 3, w / 2 - 3]) el('line', { x1: x + dx, x2: x + dx, y1: y + 2, y2: 0 }, g);
  el('line', { x1: x - w / 2 + 1, x2: x + w / 2 - 1, y1: 0.2, y2: 0.2 }, g);
  el('rect', { x: x - w / 2, y, width: w, height: 3, rx: 1.4, class: 'pad' }, g);
}

// ───────────── Motion arrows ─────────────
// Curved arrows beside the body showing which way the main moving part travels.
// Picked automatically from the animation; anim.arrow names a joint to override, or false to hide.
const ARROW_JOINTS = ['hip', 'head', 'handL', 'handR', 'kneeL', 'kneeR', 'ankleL', 'ankleR', 'elbowL', 'elbowR', 'shoulderR'];
const PAIR = { handL: 'handR', handR: 'handL', kneeL: 'kneeR', kneeR: 'kneeL', ankleL: 'ankleR', ankleR: 'ankleL', elbowL: 'elbowR', elbowR: 'elbowL' };
const P2 = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

function arrowHead(tip, from, size = 2.1) {
  const dx = tip[0] - from[0], dy = tip[1] - from[1];
  const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  const b = [tip[0] - ux * size * 1.25, tip[1] - uy * size * 1.25];
  return `M${P2(tip)}L${P2([b[0] - uy * size * 0.75, b[1] + ux * size * 0.75])}L${P2([b[0] + uy * size * 0.75, b[1] - ux * size * 0.75])}Z`;
}

function motionArrows(rig, anim, exercise) {
  if (anim.arrow === false || anim.frames.length < 2) return [];
  const F = anim.frames.map((_, i) => rig.atFrame(i));
  const body = [(F[0].hip[0] + F[0].neck[0]) / 2, (F[0].hip[1] + F[0].neck[1]) / 2];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const out = [];
  const circular = /direction/i.test(exercise.halfway ?? '') && anim.frames.length >= 4;
  // Joint with the largest movement (arms count a little less so whole-body moves win).
  const travel = (k) => (circular ? Math.max(...F.map((J) => dist(J[k], F[0][k]))) : dist(F[0][k], F[1][k])) * (/hand|elbow/.test(k) ? 0.75 : 1);
  const joint = anim.arrow ?? ARROW_JOINTS.reduce((best, k) => (travel(k) > travel(best) ? k : best), 'hip');
  const raw = circular ? Math.max(...F.map((J) => dist(J[joint], F[0][joint]))) : dist(F[0][joint], F[1][joint]);
  if (raw < (anim.arrow ? 1 : 2.5)) return [];
  const joints = [joint];
  if (PAIR[joint] && rig.view === 'front' && !anim.arrow) {
    const other = PAIR[joint];
    if (dist(F[0][other], F[1][other]) > raw * 0.7) joints.push(other);
  }
  for (const k of joints) {
    if (circular) {
      const pts = F.map((J) => J[k]);
      const c = [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
      const r = Math.max(3.4, Math.max(...pts.map((p) => dist(p, c))) + 2.6);
      // Spin direction from the order of the frames.
      let turn = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        turn += (a[0] - c[0]) * (b[1] - c[1]) - (a[1] - c[1]) * (b[0] - c[0]);
      }
      const dir = turn >= 0 ? 1 : -1, a0 = -Math.PI * 0.9, sweep = Math.PI * 1.55 * dir;
      const at = (t) => [c[0] + Math.cos(a0 + sweep * t) * r, c[1] + Math.sin(a0 + sweep * t) * r];
      const s = at(0), e = at(1);
      out.push({ d: `M${P2(s)}A${r.toFixed(2)} ${r.toFixed(2)} 0 1 ${dir > 0 ? 1 : 0} ${P2(e)}`, head: arrowHead(e, at(0.94)), ext: [c[0] - r - 2, c[1] - r - 2, c[0] + r + 2, c[1] + r + 2] });
      continue;
    }
    let a = F[0][k], b = F[1][k];
    let len = dist(a, b);
    const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
    if (len < 8) {
      // Small movements still get a readable arrow, centered on the actual motion.
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      a = [m[0] - ux * 4, m[1] - uy * 4]; b = [m[0] + ux * 4, m[1] + uy * 4]; len = 8;
    }
    // Offset sideways, away from the middle of the body.
    let nx = -uy, ny = ux;
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if ((mid[0] - body[0]) * nx + (mid[1] - body[1]) * ny < 0) { nx = -nx; ny = -ny; }
    const off = 4.2 + len * 0.08, bow = len * 0.22;
    const trim = Math.min(1.6, len * 0.12);
    const s = [a[0] + ux * trim + nx * off, a[1] + uy * trim + ny * off];
    const e = [b[0] - ux * trim + nx * off, b[1] - uy * trim + ny * off];
    const c = [mid[0] + nx * (off + bow), mid[1] + ny * (off + bow)];
    const xs = [s[0], e[0], c[0]], ys = [s[1], e[1], c[1]];
    out.push({ d: `M${P2(s)}Q${P2(c)} ${P2(e)}`, head: arrowHead(e, c), ext: [Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) + 2, Math.max(...ys) + 2] });
  }
  return out;
}

// Renders an exercise figure into `container`. Returns a controller.
// band: resistance level (index into BAND_COLORS) for band exercises.
export function renderFigure(container, exercise, { animate = true, aspect = 1.3, frame = null, time = null, highlight = true, arrows: arrowsOn = true, band = null } = {}) {
  const anim = exercise.anim;
  const rig = makeRig(anim);
  const arrows = arrowsOn ? motionArrows(rig, anim, exercise) : [];
  const box = arrows.reduce((b, a) => [Math.min(b[0], a.ext[0]), Math.min(b[1], a.ext[1]), Math.max(b[2], a.ext[2]), Math.max(b[3], a.ext[3])], rig.bbox);
  const [vx, vy, vw, vh] = fitBox(box, aspect);
  const svg = el('svg', { viewBox: `${vx.toFixed(2)} ${vy.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`, class: 'figure', role: 'img', 'aria-label': exercise.name });
  const hl = new Set(highlight ? exercise.primary ?? [] : []);
  const [bx0, by0, bx1, by1] = rig.bbox;
  if (rig.top) el('rect', { x: bx0 - 3, y: by0 - 3, width: bx1 - bx0 + 6, height: by1 - by0 + 6, rx: 3, class: 'fig-mat' }, svg);
  else if (!rig.hang) {
    if (rig.mat) el('path', { d: `M${bx0 - 1} 0.2L${bx1 + 1} 0.2L${bx1 + 4} 2.6L${bx0 - 4} 2.6Z`, class: 'fig-mat' }, svg);
    el('line', { x1: vx, x2: vx + vw, y1: 0.2, y2: 0.2, class: 'fig-ground' }, svg);
  }
  for (const pr of rig.props) {
    if (pr.type === 'wall') el('line', { x1: pr.x, x2: pr.x, y1: 0, y2: vy, class: 'fig-wall' }, svg);
    if (pr.type === 'bar') el('line', { x1: pr.x - pr.w / 2, x2: pr.x + pr.w / 2, y1: pr.y, y2: pr.y, class: 'fig-bar' }, svg);
    if (pr.type === 'box') el('rect', { x: pr.x - pr.w / 2, y: pr.y, width: pr.w, height: -pr.y, rx: 1.2, class: 'fig-box' }, svg);
    if (pr.type === 'chair') drawChair(svg, pr);
    if (pr.type === 'bench') drawBench(svg, pr);
  }
  const shadow = rig.hang || rig.top ? null : el('ellipse', { cy: 0.4, ry: 1.3, class: 'fig-shadow' }, svg);
  const g = el('g', {}, svg);
  let nodes = [];
  const draw = (J) => {
    if (shadow) {
      const xs = ['ankleL', 'ankleR', 'hip'].map((k) => J[k][0]);
      shadow.setAttribute('cx', ((Math.min(...xs) + Math.max(...xs)) / 2).toFixed(2));
      shadow.setAttribute('rx', Math.max(6, (Math.max(...xs) - Math.min(...xs)) / 2 + 5).toFixed(2));
    }
    const gear = gearParts(J, anim.gear, rig.view, rig.bandAnchor, BAND_COLORS[band ?? exercise.band ?? 2]);
    const ops = [...gear.far, ...paint(J, rig.view, hl, anim.hotSegs, !rig.hang && !rig.top), ...gear.near];
    if (ops.length !== nodes.length || ops.some((o, i) => nodes[i].tagName !== o.tag)) {
      g.replaceChildren();
      nodes = ops.map((o) => el(o.tag, {}, g));
    }
    ops.forEach((o, i) => { for (const k in o) if (k !== 'tag') nodes[i].setAttribute(k, o[k]); });
  };

  if (arrows.length) {
    const ag = el('g', { class: 'fig-arrows' }, svg);
    for (const a of arrows) { el('path', { d: a.d, class: 'fig-arrow' }, ag); el('path', { d: a.head, class: 'fig-arrow-head' }, ag); }
  }

  container.replaceChildren(svg);
  let raf = 0, start = performance.now(), running = false;
  const loop = (now) => { draw(rig.at((now - start) / 1000)); raf = requestAnimationFrame(loop); };
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (time !== null) draw(rig.at(time));
  else if (frame !== null || !animate || reduce) draw(rig.atFrame(frame ?? (anim.thumb ?? Math.min(1, anim.frames.length - 1))));
  else { running = true; raf = requestAnimationFrame(loop); }
  return {
    svg,
    stop() { cancelAnimationFrame(raf); running = false; },
    pause() { if (running) { cancelAnimationFrame(raf); running = false; } },
    resume() { if (!running && animate && !reduce && frame === null && time === null) { running = true; raf = requestAnimationFrame(loop); } },
  };
}

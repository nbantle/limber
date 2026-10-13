import { paint } from './character2.js';

// Animated figure renderer.
//
// Poses use absolute segment angles in degrees: 0 = up, 90 = forward (screen right),
// 180 = down, 270 (or -90) = backward. Side-view figures face right; "R" limbs are the
// near side and "L" limbs the far side. In front view, "L" is the screen-left limb.
//
// pose = { t: torso, h: head, aL/aR: [upperArm, forearm], lL/lR: [thigh, shin, foot?], lift,
//          c: spine curve, sy: shoulder lift, turn: head turn (-1..1, front view),
//          kth/kfa: thigh/forearm length factor for limbs pointing at the viewer (number or [L, R]) }
// anim.top draws a lying figure seen from above (front view rules, no floor).

const LEN = { torso: 24, shoulderAt: 21, neck: 2.5, headR: 5, ua: 12.5, fa: 12, th: 18, sh: 18, foot: 6, footFront: 3.2 };
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
  J.shoulderL = [sh[0] - p[0] * 7, sh[1] - p[1] * 7];
  J.shoulderR = [sh[0] + p[0] * 7, sh[1] + p[1] * 7];
  J.hipL = [-p[0] * 4.2, -p[1] * 4.2];
  J.hipR = [p[0] * 4.2, p[1] * 4.2];
  for (const s of ['L', 'R']) {
    const [u, f] = pose['a' + s] ?? [180, 180];
    J['elbow' + s] = add(J['shoulder' + s], u, LEN.ua);
    J['hand' + s] = add(J['elbow' + s], f, LEN.fa * side(pose.kfa, s));
    const [th, shn, ft] = pose['l' + s] ?? [180, 180];
    J['knee' + s] = add(J['hip' + s], th, LEN.th * side(pose.kth, s));
    J['ankle' + s] = add(J['knee' + s], shn, LEN.sh);
    J['footAngle' + s] = ft ?? (front ? (s === 'L' ? shn + 90 : shn - 90) : 90);
    J['toe' + s] = add(J['ankle' + s], J['footAngle' + s], front ? LEN.footFront : LEN.foot);
  }
  return J;
}

function segments(J, view) {
  const S = (name, a, b, kind, far) => ({ name, a: J[a], b: J[b], kind, far, w: WID[kind] });
  const limbs = (s, far) => ({
    arm: [S('ua' + s, 'shoulder' + s, 'elbow' + s, 'ua', far), S('fa' + s, 'elbow' + s, 'hand' + s, 'fa', far)],
    leg: [S('th' + s, 'hip' + s, 'knee' + s, 'th', far), S('sh' + s, 'knee' + s, 'ankle' + s, 'sh', far), S('ft' + s, 'ankle' + s, 'toe' + s, 'foot', far)],
  });
  const core = [{ ...S('torso', 'hip', 'neck', 'torso', false), c: J.c }, S('neck', 'neck', 'head', 'neck', false)];
  const L = limbs('L', view !== 'front');
  const R = limbs('R', false);
  if (view === 'front') return [...L.leg, ...R.leg, ...core, ...L.arm, ...R.arm];
  return [...L.arm, ...L.leg, ...core, ...R.leg, ...R.arm];
}

function contactPoints(J, exclude) {
  const pts = [[J.head[0], J.head[1], LEN.headR], [J.hip[0], J.hip[1], WID.torso / 2], [J.neck[0], J.neck[1], WID.torso / 2]];
  for (const s of ['L', 'R']) {
    if (!exclude.has('hand' + s)) pts.push([...J['elbow' + s], WID.ua / 2], [...J['hand' + s], WID.fa / 2]);
    pts.push([...J['shoulder' + s], WID.ua / 2]);
    if (!exclude.has('ankle' + s)) pts.push([...J['ankle' + s], WID.sh / 2], [...J['toe' + s], WID.foot / 2]);
    pts.push([...J['knee' + s], WID.th / 2]);
  }
  return pts;
}

function interp(a, b, u) {
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const def = { t: 0, c: 0, lift: 0, sy: 0, turn: 0, kth: 1, kfa: 1, aL: [180, 180], aR: [180, 180], lL: [180, 180], lR: [180, 180] };
  for (const k of keys) {
    let va = a[k] ?? (k === 'h' ? a.t ?? 0 : def[k]);
    let vb = b[k] ?? (k === 'h' ? b.t ?? 0 : def[k]);
    if (Array.isArray(va) || Array.isArray(vb)) {
      va = va ?? []; vb = vb ?? [];
      const n = Math.max(va.length, vb.length);
      out[k] = [];
      for (let i = 0; i < n; i++) {
        const x = va[i], y = vb[i];
        if (x === undefined && y === undefined) continue;
        out[k][i] = x === undefined ? y : y === undefined ? x : x + (y - x) * u;
      }
    } else out[k] = va + (vb - va) * u;
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
    return interp(frames[i], frames[(i + 1) % frames.length], ease(uu));
  };

  const place = (pose, ref) => {
    const J = solve(pose, view);
    let dx = 0, dy = 0;
    if (ref) dx = ref.anchor[0] - J[anchor][0];
    if (anim.hang || anim.top) {
      if (ref) dy = ref.anchor[1] - J[anchor][1];
    } else {
      const pts = contactPoints(J, plant);
      dy = -Math.max(...pts.map((p) => p[1] + p[2])) - (pose.lift ?? 0);
    }
    for (const k in J) if (Array.isArray(J[k])) J[k] = [J[k][0] + dx, J[k][1] + dy];
    if (ref) {
      for (const p of plant) {
        const s = p.slice(-1);
        ik(J, s, ref.joints[p], p.startsWith('hand') ? 'hand' : 'ankle');
      }
    }
    return J;
  };

  const J0 = place(frames[0], null);
  const ref = { anchor: J0[anchor], joints: J0 };
  const at = (time) => place(poseAt(time), ref);
  const atFrame = (i) => place(frames[i % frames.length], ref);

  // Props are positioned from the first frame.
  const props = (anim.props ?? []).map((pr) => {
    const j = J0[pr.at ?? 'hip'];
    if (pr.type === 'wall') return { type: 'wall', x: j[0] + (pr.dx ?? 0) };
    if (pr.type === 'bar') return { type: 'bar', x: j[0] + (pr.dx ?? 0), y: j[1] - 1.5, w: pr.w ?? 34 };
    if (pr.type === 'box') return { type: 'box', x: j[0] + (pr.dx ?? 0), y: j[1] + (pr.dy ?? 2), w: pr.w ?? 16 };
    if (pr.type === 'chair') return { type: 'chair', x: j[0] + (pr.dx ?? 0), y: j[1] + 4.6, front: view === 'front' };
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
  }
  if (!anim.hang && !anim.top) grow(x0, 0);
  for (const pr of props) {
    if (pr.type === 'wall') grow(pr.x, y0), grow(pr.x, 0);
    if (pr.type === 'bar') grow(pr.x - pr.w / 2, pr.y - 2), grow(pr.x + pr.w / 2, pr.y);
    if (pr.type === 'box') grow(pr.x - pr.w / 2, pr.y), grow(pr.x + pr.w / 2, 0);
    if (pr.type === 'chair') grow(pr.x - 10, pr.y - 24), grow(pr.x + 10, 0);
  }
  // Floor exercises get a yoga mat.
  const nearFloor = ['hip', 'kneeL', 'kneeR', 'handL', 'handR', 'neck'].some((k) => J0[k][1] > -7.5);
  const mat = anim.top || (anim.mat ?? (!anim.hang && nearFloor));
  const bbox = [x0, y0, x1, y1];
  return { at, atFrame, view, cycle, bbox, props, mat, hang: !!anim.hang, top: !!anim.top };
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
export function renderFigure(container, exercise, { animate = true, aspect = 1.3, frame = null, highlight = true, arrows: arrowsOn = true } = {}) {
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
    const ops = paint(J, rig.view, hl, anim.hotSegs);
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
  if (frame !== null || !animate || reduce) draw(rig.atFrame(frame ?? (anim.thumb ?? Math.min(1, anim.frames.length - 1))));
  else { running = true; raf = requestAnimationFrame(loop); }
  return {
    svg,
    stop() { cancelAnimationFrame(raf); running = false; },
    pause() { if (running) { cancelAnimationFrame(raf); running = false; } },
    resume() { if (!running && animate && !reduce && frame === null) { running = true; raf = requestAnimationFrame(loop); } },
  };
}

// Animated mannequin renderer.
//
// Poses use absolute segment angles in degrees: 0 = up, 90 = forward (screen right),
// 180 = down, 270 (or -90) = backward. Side-view figures face right; "R" limbs are the
// near side and "L" limbs the far side. In front view, "L" is the screen-left limb.
//
// pose = { t: torso, h: head, aL/aR: [upperArm, forearm], lL/lR: [thigh, shin, foot?], lift }

const LEN = { torso: 24, shoulderAt: 21, neck: 2.5, headR: 4.8, ua: 12.5, fa: 12, th: 18, sh: 18, foot: 6, footFront: 3.2 };
const WID = { torso: 9.5, neck: 4, ua: 4.8, fa: 4, th: 6.6, sh: 5.2, foot: 3.4 };
const SVGNS = 'http://www.w3.org/2000/svg';

const SEG_MUSCLES = {
  torso: ['chest', 'abs', 'obliques', 'lats', 'upperBack', 'lowerBack'],
  neck: ['neck', 'traps'],
  ua: ['shoulders', 'biceps', 'triceps'],
  fa: ['forearms'],
  th: ['quads', 'hamstrings', 'glutes', 'hipFlexors', 'adductors'],
  sh: ['calves'],
  foot: [],
};

const rad = (a) => (a * Math.PI) / 180;
const dir = (a) => [Math.sin(rad(a)), -Math.cos(rad(a))];
const add = (p, a, len) => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);

function solve(pose, view) {
  const front = view === 'front';
  const t = pose.t ?? 0;
  const h = pose.h ?? t;
  const J = {};
  J.c = pose.c ?? 0;
  J.hip = [0, 0];
  J.neck = add(J.hip, t, LEN.torso);
  J.head = add(J.neck, h, LEN.neck + LEN.headR);
  const sh = add(J.hip, t, LEN.shoulderAt);
  const p = front ? dir(t + 90) : [0, 0];
  J.shoulderL = [sh[0] - p[0] * 7, sh[1] - p[1] * 7];
  J.shoulderR = [sh[0] + p[0] * 7, sh[1] + p[1] * 7];
  J.hipL = [-p[0] * 4.2, -p[1] * 4.2];
  J.hipR = [p[0] * 4.2, p[1] * 4.2];
  for (const s of ['L', 'R']) {
    const [u, f] = pose['a' + s] ?? [180, 180];
    J['elbow' + s] = add(J['shoulder' + s], u, LEN.ua);
    J['hand' + s] = add(J['elbow' + s], f, LEN.fa);
    const [th, shn, ft] = pose['l' + s] ?? [180, 180];
    J['knee' + s] = add(J['hip' + s], th, LEN.th);
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
  const def = { t: 0, c: 0, lift: 0, aL: [180, 180], aR: [180, 180], lL: [180, 180], lR: [180, 180] };
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
  const view = anim.view ?? 'side';
  const dur = anim.dur ?? 1.4;
  const anchor = anim.anchor ?? (view === 'front' ? 'hip' : 'ankleR');
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
    if (anim.hang) {
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
  if (!anim.hang) grow(x0, 0);
  for (const pr of props) {
    if (pr.type === 'wall') grow(pr.x, y0), grow(pr.x, 0);
    if (pr.type === 'bar') grow(pr.x - pr.w / 2, pr.y - 2), grow(pr.x + pr.w / 2, pr.y);
    if (pr.type === 'box') grow(pr.x - pr.w / 2, pr.y), grow(pr.x + pr.w / 2, 0);
  }
  const bbox = [x0, y0, x1, y1];
  return { at, atFrame, view, cycle, bbox, props, hang: !!anim.hang };
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

// Renders an exercise figure into `container`. Returns a controller.
export function renderFigure(container, exercise, { animate = true, aspect = 1.3, frame = null, highlight = true } = {}) {
  const anim = exercise.anim;
  const rig = makeRig(anim);
  const [vx, vy, vw, vh] = fitBox(rig.bbox, aspect);
  const svg = el('svg', { viewBox: `${vx.toFixed(2)} ${vy.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`, class: 'figure', role: 'img', 'aria-label': exercise.name });
  const hl = new Set(highlight ? exercise.primary ?? [] : []);
  if (!rig.hang) el('line', { x1: vx, x2: vx + vw, y1: 0.2, y2: 0.2, class: 'fig-ground' }, svg);
  for (const pr of rig.props) {
    if (pr.type === 'wall') el('line', { x1: pr.x, x2: pr.x, y1: 0, y2: vy, class: 'fig-prop' }, svg);
    if (pr.type === 'bar') el('line', { x1: pr.x - pr.w / 2, x2: pr.x + pr.w / 2, y1: pr.y, y2: pr.y, class: 'fig-bar' }, svg);
    if (pr.type === 'box') el('rect', { x: pr.x - pr.w / 2, y: pr.y, width: pr.w, height: -pr.y, rx: 1.2, class: 'fig-box' }, svg);
  }
  const g = el('g', {}, svg);
  const J0 = rig.atFrame(0);
  const segs = segments(J0, rig.view);
  const lines = segs.map((s) => {
    const hot = SEG_MUSCLES[s.kind].some((m) => hl.has(m));
    const cls = ['fig-seg', s.far ? 'far' : 'near', hot ? 'hot' : ''].join(' ');
    return el(s.kind === 'torso' ? 'path' : 'line', { 'stroke-width': s.w, class: cls }, g);
  });
  const head = el('circle', { r: LEN.headR, class: 'fig-head' + (hl.has('neck') ? ' hot' : '') }, g);
  // Head goes before the near arm in side view so arms can pass in front of the face.
  g.insertBefore(head, lines[segs.findIndex((s) => s.name === 'neck') + 1] ?? null);

  const draw = (J) => {
    const ss = segments(J, rig.view);
    ss.forEach((s, i) => {
      const ln = lines[i];
      if (s.kind === 'torso') {
        // Curved spine: bulge toward the back (positive c) or belly (negative c).
        const [ax, ay] = s.a, [bx, by] = s.b;
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const nx = (by - ay) / len, ny = -(bx - ax) / len;
        const cx = (ax + bx) / 2 + nx * s.c * 1.6, cy = (ay + by) / 2 + ny * s.c * 1.6;
        ln.setAttribute('d', `M${ax.toFixed(2)} ${ay.toFixed(2)}Q${cx.toFixed(2)} ${cy.toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`);
        return;
      }
      ln.setAttribute('x1', s.a[0].toFixed(2)); ln.setAttribute('y1', s.a[1].toFixed(2));
      ln.setAttribute('x2', s.b[0].toFixed(2)); ln.setAttribute('y2', s.b[1].toFixed(2));
    });
    head.setAttribute('cx', J.head[0].toFixed(2)); head.setAttribute('cy', J.head[1].toFixed(2));
  };

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

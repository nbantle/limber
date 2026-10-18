// Coach: turns "what's bothering you / what you want" into a routine built from the exercise library.
// Rule-based (no AI service): keywords map to target muscles and a style; the builder picks and orders
// exercises to fit the time, equipment and level. Pure functions — the chat UI lives in app.js.

import { makeRig } from './figure.js';

// ───────────── Understanding the request ─────────────

// Each topic: words that trigger it, muscles to target (weight), a style, and how to describe it.
const TOPICS = [
  { key: 'back', words: ['lower back', 'back pain', 'back hurts', 'sciatica', 'spine', 'my back', 'back is', 'back feels', 'lumbar'], targets: { lowerBack: 3, glutes: 2, hamstrings: 2, hipFlexors: 2, abs: 1 }, style: 'relief', label: 'Lower back relief', why: 'gentle stretches for your hips, hamstrings and back, plus core moves that support your spine' },
  { key: 'neck', words: ['neck', 'trap', 'tech neck', 'headache', 'tension'], targets: { neck: 3, traps: 3, shoulders: 2, upperBack: 2, chest: 1 }, style: 'relief', label: 'Neck & shoulder relief', why: 'releases for your neck and traps and openers for your chest and shoulders' },
  { key: 'shoulder', words: ['shoulder'], targets: { shoulders: 3, upperBack: 2, chest: 2, traps: 1 }, style: 'mobility', label: 'Shoulder mobility', why: 'shoulder mobility and the upper-back muscles that keep shoulders healthy' },
  { key: 'desk', words: ['desk', 'computer', 'office', 'sitting', 'sit all day', 'work from home', 'laptop'], targets: { hipFlexors: 2, upperBack: 2, chest: 2, neck: 2, glutes: 2, lowerBack: 1 }, style: 'posture', label: 'Desk worker reset', why: 'stretches for what sitting tightens (hips, chest, neck) and strength for what it weakens (glutes, upper back)' },
  { key: 'posture', words: ['posture', 'hunch', 'slouch', 'rounded shoulders', 'forward head'], targets: { upperBack: 3, chest: 2, shoulders: 2, neck: 1, traps: 1 }, style: 'posture', label: 'Posture fix', why: 'upper-back strengthening and chest openers to pull your shoulders back' },
  { key: 'hips', words: ['hip', 'groin', 'pigeon'], targets: { hipFlexors: 3, glutes: 3, adductors: 2 }, style: 'mobility', label: 'Hip mobility', why: 'openers for your hip flexors, glutes and inner thighs' },
  { key: 'knee', words: ['knee'], targets: { quads: 2, glutes: 3, hamstrings: 1, calves: 1 }, style: 'gentle', label: 'Knee-friendly strength', why: 'low-impact glute and leg strength (no jumping) to support your knees' },
  { key: 'flex', words: ['flexib', 'touch my toes', 'touch toes', 'hamstring', 'stiff', 'tight', 'limber', 'loosen'], targets: { hamstrings: 3, hipFlexors: 2, lowerBack: 1, calves: 1 }, style: 'mobility', label: 'Flexibility', why: 'longer holds for your hamstrings, hips and calves' },
  { key: 'sleep', words: ['sleep', 'bed', 'insomnia', 'stress', 'anxious', 'anxiety', 'relax', 'calm', 'wind down', 'unwind'], targets: { lowerBack: 2, hipFlexors: 2, glutes: 2, hamstrings: 1 }, style: 'sleep', label: 'Wind-down stretch', why: 'slow floor stretches with long holds to help you relax' },
  { key: 'sore', words: ['sore', 'recovery', 'rest day', 'recover', 'achy'], targets: { hamstrings: 2, quads: 2, glutes: 2, lowerBack: 1, chest: 1 }, style: 'relief', label: 'Recovery', why: 'light movement and stretches for sore muscles' },
  { key: 'run', words: ['run', 'jog', 'marathon', '5k', '10k'], targets: { calves: 2, hamstrings: 2, hipFlexors: 2, glutes: 3, quads: 1 }, style: 'mixed', label: "Runner's strength & mobility", why: 'glute and single-leg strength plus stretches for calves, hamstrings and hips' },
  { key: 'golf', words: ['golf', 'tennis', 'pickleball', 'rotation', 'swing'], targets: { obliques: 3, upperBack: 2, hipFlexors: 2, glutes: 1 }, style: 'mixed', label: 'Rotation ready', why: 'twisting mobility and rotational core strength' },
  { key: 'cardio', words: ['cardio', 'lose weight', 'weight loss', 'fat', 'burn', 'sweat', 'endurance', 'hiit', 'conditioning', 'stamina', 'heart'], targets: { quads: 1, glutes: 1, abs: 1, shoulders: 1 }, style: 'cardio', label: 'Cardio burn', why: 'moves that get your heart rate up, alternating upper and lower body' },
  { key: 'abs', words: ['abs', 'core', 'stomach', 'belly', 'six pack', 'waist'], targets: { abs: 3, obliques: 2, lowerBack: 1 }, style: 'strength', label: 'Core strength', why: 'core work from every angle: front, sides and back' },
  { key: 'glutes', words: ['glute', 'butt', 'booty'], targets: { glutes: 3, hamstrings: 2, quads: 1 }, style: 'strength', label: 'Glute builder', why: 'glute-focused strength moves' },
  { key: 'legs', words: ['leg', 'thigh', 'quad', 'calf', 'calves'], targets: { quads: 3, glutes: 2, hamstrings: 2, calves: 1 }, style: 'strength', label: 'Leg strength', why: 'squats, lunges and hinges for your legs' },
  { key: 'arms', words: ['arm', 'bicep', 'tricep', 'gun'], targets: { biceps: 3, triceps: 3, shoulders: 1, forearms: 1 }, style: 'strength', label: 'Arms', why: 'biceps and triceps work with some shoulders' },
  { key: 'chest', words: ['chest', 'pec', 'push-up', 'pushup'], targets: { chest: 3, triceps: 2, shoulders: 1 }, style: 'strength', label: 'Chest & push strength', why: 'pushing strength for your chest, shoulders and triceps' },
  { key: 'upper', words: ['upper body', 'back muscles', 'pull-up', 'pullup', 'lats'], targets: { lats: 3, upperBack: 2, chest: 2, shoulders: 2, biceps: 1, triceps: 1 }, style: 'strength', label: 'Upper body strength', why: 'balanced pushing and pulling for your upper body' },
  { key: 'strength', words: ['strong', 'strength', 'muscle', 'tone', 'build', 'gain', 'lift', 'workout', 'full body', 'fit'], targets: {}, style: 'strength', label: 'Full-body strength', why: 'a balanced full-body session: squat, push, pull, hinge and core' },
];

// Words that mean "see a professional first" — the Coach keeps things gentle and says so.
const CAUTION = ['sharp', 'numb', 'tingl', 'shooting', 'injur', 'surgery', 'pregnan', 'chest pain', 'dizzy', 'fracture', 'herniat', 'torn', 'tear', 'sprain', 'swollen', 'can\'t walk', 'radiat'];

export const GEAR_CHOICES = ['Dumbbells', 'Kettlebell', 'Barbell', 'Bands', 'Pull-up bar', 'Bench'];
const GEAR_WORDS = { Dumbbells: ['dumbbell', 'weights', 'free weight'], Kettlebell: ['kettlebell', 'kettle bell'], Barbell: ['barbell', 'squat rack', 'gym'], Bands: ['band'], 'Pull-up bar': ['pull-up bar', 'pullup bar', 'pull up bar', 'chin-up bar'], Bench: ['bench', 'gym'] };
const NO_GEAR = ['no equipment', 'nothing', 'no gear', 'bodyweight', 'body weight', 'none', 'at home with nothing'];

// Pulls everything it can from a message. Unknown pieces stay undefined so the chat can ask.
export function understand(text) {
  const t = ` ${text.toLowerCase()} `;
  let topics = TOPICS.filter((tp) => tp.words.some((w) => t.includes(w)));
  // A specific goal ("stronger core") beats the generic full-body one; otherwise the first thing mentioned leads.
  if (topics.length > 1) topics = topics.filter((tp) => tp.key !== 'strength');
  const at = (tp) => Math.min(...tp.words.map((w) => t.indexOf(w)).filter((i) => i >= 0));
  topics.sort((a, b) => at(a) - at(b));
  // "back" alone means lower back unless they said upper back / back muscles.
  if (!topics.some((x) => x.key === 'back') && /\bback\b/.test(t) && !/upper back|back muscles/.test(t) && /(hurt|pain|ache|sore|stiff|tight)/.test(t)) topics.unshift(TOPICS[0]);
  const min = t.match(/(\d+)\s*(?:-|to)?\s*(?:\d+\s*)?(?:minutes?|mins?)\b/) ?? t.match(/\b(half an hour|an hour|hour)\b/);
  const time = min ? (min[1] === 'half an hour' ? 30 : /hour/.test(min[1]) ? 60 : Math.min(90, Math.max(5, +min[1]))) : undefined;
  const gear = NO_GEAR.some((w) => t.includes(w)) ? [] : (() => { const g = GEAR_CHOICES.filter((k) => GEAR_WORDS[k].some((w) => t.includes(w))); return g.length ? g : undefined; })();
  const level = /\b(beginner|new to|just starting|out of shape|haven't worked out|never|senior|older)\b/.test(t) ? 'Beginner'
    : /\b(advanced|athlete|experienced|very fit|years of lifting)\b/.test(t) ? 'Advanced'
      : /\b(intermediate|some experience|moderately|pretty fit)\b/.test(t) ? 'Intermediate' : undefined;
  return { topics, time, gear, level, caution: CAUTION.some((w) => t.includes(w)) };
}

// Quick-reply starting points (each is just text the user could have typed).
export const STARTERS = ['My lower back hurts', 'Tight hips from sitting', 'Neck & shoulder tension', 'I want to get stronger', 'Cardio to lose weight', 'Better posture', 'More flexible', 'Help me wind down for sleep', 'Strength for running', 'Stronger core'];

// ───────────── Building the routine ─────────────

const JUMPY = new Set(['jumping-jacks', 'burpee', 'high-knees', 'butt-kicks', 'mountain-climbers']);
const HARD = new Set(['burpee', 'pike-push-up', 'pull-up', 'hollow-hold', 'leg-raises', 'bb-back-squat', 'bb-deadlift', 'bb-bench-press', 'bb-overhead-press', 'bb-row', 'kb-swing']);
const GENTLE_CORE = new Set(['bird-dog', 'dead-bug', 'glute-bridge', 'band-glute-bridge', 'superman', 'plank', 'side-plank', 'swimmers', 'floor-slides', 'band-pull-apart', 'band-face-pull', 'band-row', 'calf-raises']);
// Very easy moves only, for when someone mentions nerve pain, an injury and so on.
const CAREFUL = new Set(['cat-cow', 'childs-pose', 'knee-to-chest', 'double-knee-chest', 'lying-twist', 'figure-four', 'supine-hamstring', 'glute-bridge', 'bird-dog', 'dead-bug', 'neck-tilts', 'neck-side', 'shoulder-rolls', 'floor-slides', 'lying-butterfly', 'cobra', 'seated-forward-fold']);
const NOT_COOLDOWN = new Set(['legs-up-wall', 'leg-swings', 'lying-leg-swings', 'standing-hip-opener', 'arm-circles', 'overhead-arm-circles', 'knee-circles', 'wrist-ankle-circles', 'shoulder-rolls', 'torso-twist', 'cross-touch-reach']);

// How high the hips start (standing ≈ 38, seated or kneeling ≈ 10–20, lying ≈ 5), to order stretch sessions
// from standing down to the floor so nobody pops up and down.
const hipCache = new Map();
const hipHeight = (ex) => {
  if (!hipCache.has(ex.id)) {
    let h = 0;
    try { h = ex.anim.top ? 0 : -makeRig(ex.anim).atFrame(0).hip[1]; } catch { /* custom or odd anim */ }
    hipCache.set(ex.id, h);
  }
  return hipCache.get(ex.id);
};
const CARDIO = new Set(['jumping-jacks', 'burpee', 'high-knees', 'butt-kicks', 'mountain-climbers', 'marching', 'squat', 'reverse-lunge', 'side-lunge', 'cross-touch-reach', 'kb-swing', 'push-up', 'knee-push-up', 'band-lateral-walk']);
const FLOOR_CALM = new Set(['childs-pose', 'cat-cow', 'figure-four', 'lying-twist', 'spinal-twist-supine', 'double-knee-chest', 'knee-to-chest', 'lying-butterfly', 'legs-up-wall', 'supine-hamstring', 'butterfly', 'seated-forward-fold', 'single-leg-forward-fold', 'pigeon', 'seated-single-hamstring', 'cobra', 'seated-twist', 'seated-side-bend', 'neck-side', 'levator-scapulae', 'neck-tilts']);
const WARMUPS = { gentle: ['cat-cow', 'shoulder-rolls', 'arm-circles', 'torso-twist', 'knee-circles', 'marching'], active: ['jumping-jacks', 'arm-circles', 'leg-swings', 'marching', 'torso-twist', 'cat-cow'] };
// Full-body strength slots, so a general session covers every pattern.
const SLOTS = [
  { quads: 3, glutes: 2 }, { chest: 3, triceps: 1 }, { lats: 3, upperBack: 2 }, { hamstrings: 3, glutes: 2 },
  { shoulders: 3 }, { abs: 3, obliques: 1 }, { glutes: 2, quads: 2 }, { biceps: 2, triceps: 2 },
];

// What a built-in exercise needs. Chairs and walls are assumed to be around.
function needs(ex) {
  const id = ex.id;
  const out = [];
  if (id.startsWith('bb-')) out.push('Barbell');
  if (id.startsWith('kb-')) out.push('Kettlebell');
  if (id.startsWith('db-') || id === 'farmers-carry') out.push('Dumbbells');
  if (id === 'goblet-squat') out.push('Dumbbells|Kettlebell');
  if (ex.type === 'bands') out.push('Bands');
  if (id === 'pull-up') out.push('Pull-up bar');
  if (['db-bench-press', 'bb-bench-press', 'db-row'].includes(id)) out.push('Bench');
  return out;
}
const hasAll = (ex, gear) => needs(ex).every((n) => n.split('|').some((g) => gear.includes(g)));

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Merges the topics into one plan: target muscles, style, a name and an explanation.
export function plan(prefs) {
  // (also used by the chat to decide which questions still matter)
  const topics = prefs.topics.length ? prefs.topics : [TOPICS.find((x) => x.key === 'strength')];
  const targets = {};
  for (const tp of topics) for (const [m, w] of Object.entries(tp.targets)) targets[m] = Math.max(targets[m] ?? 0, w);
  let style = topics[0].style;
  if (prefs.caution) style = 'relief';
  const label = prefs.caution ? 'Gentle relief' : topics[0].label;
  return { targets, style, label, why: topics.slice(0, 2).map((x) => x.why).join(', and '), general: !Object.keys(targets).length };
}

// Builds { name, rest, steps } close to prefs.time minutes. ctx: { exercises, estimate }.
export function buildRoutine(prefs, ctx, seed = 1) {
  const { targets, style, label, general } = plan(prefs);
  const level = prefs.level ?? 'Beginner';
  const gear = prefs.gear ?? [];
  const goal = (prefs.time ?? 20) * 60;
  const rand = rng(seed);
  const calm = style === 'relief' || style === 'sleep' || prefs.caution;
  const usable = ctx.exercises.filter((ex) => !ex.custom && hasAll(ex, gear)
    && !(level === 'Beginner' && HARD.has(ex.id))
    && !((calm || style === 'gentle' || style === 'mobility' || targets.quads && prefs.topics.some((x) => x.key === 'knee')) && JUMPY.has(ex.id))
    && !(style === 'sleep' && !FLOOR_CALM.has(ex.id))
    && !(prefs.caution && !CAREFUL.has(ex.id)));
  const fit = (ex, t) => (ex.primary ?? []).reduce((a, m) => a + (t[m] ?? 0) * 2, 0) + (ex.secondary ?? []).reduce((a, m) => a + (t[m] ?? 0) * 0.6, 0);
  const typeBonus = (ex) => {
    const loaded = ex.type === 'weights' || ex.type === 'bands';
    switch (style) {
      case 'relief': return ex.type === 'stretch' ? 3 : GENTLE_CORE.has(ex.id) ? 1.5 : -6;
      case 'sleep': return ex.type === 'stretch' ? 3 : -10;
      case 'mobility': return ex.type === 'stretch' ? 3 : GENTLE_CORE.has(ex.id) ? 0.5 : -4;
      case 'posture': return ex.type === 'bands' ? 3 : ex.type === 'stretch' ? 2 : GENTLE_CORE.has(ex.id) ? 1.5 : 0;
      case 'cardio': return CARDIO.has(ex.id) ? 3 : ex.type === 'stretch' ? -6 : 0;
      case 'gentle': return JUMPY.has(ex.id) ? -10 : ex.type === 'stretch' ? 0 : 2;
      case 'mixed': return ex.type === 'stretch' ? 1.5 : 2;
      default: return ex.type === 'stretch' ? -6 : loaded ? 3 : 2; // strength
    }
  };
  const sets = level === 'Beginner' ? 2 : 3;
  const short = goal <= 12 * 60;
  const step = (ex, role) => {
    if (ex.type === 'stretch' && ex.mode === 'time') return { ex: ex.id, mode: 'time', duration: calm || style === 'mobility' ? 45 : 30 };
    if (ex.type === 'stretch') return { ex: ex.id };
    if (style === 'cardio') return { ex: ex.id, mode: 'time', duration: level === 'Beginner' ? 30 : 40 };
    const n = role === 'main' && !short && !calm && style !== 'mixed' && style !== 'posture' ? sets : style === 'posture' || style === 'mixed' ? 2 : 1;
    return ex.mode === 'time' ? { ex: ex.id, sets: n } : { ex: ex.id, reps: ex.reps, sets: n };
  };
  const rest = calm || style === 'mobility' ? 5 : style === 'cardio' ? 15 : gear.some((g) => ['Dumbbells', 'Kettlebell', 'Barbell'].includes(g)) && style === 'strength' ? 45 : 25;
  const routine = { name: `${label} · ${Math.round(goal / 60)} min`, rest, steps: [] };
  const used = new Set();
  const add = (ex, role) => { routine.steps.push(step(ex, role)); used.add(ex.id); };
  const best = (list, score) => list.filter((ex) => !used.has(ex.id)).map((ex) => [ex, score(ex) + rand() * 1.2]).sort((a, b) => b[1] - a[1])[0]?.[0];
  const byId = new Map(usable.map((ex) => [ex.id, ex]));

  // Warm-up: a couple of easy moves (the whole session is gentle for relief/sleep/mobility, so skip it there).
  const warm = !calm && style !== 'mobility' && style !== 'sleep';
  if (warm) {
    const list = (style === 'gentle' || level === 'Beginner' ? WARMUPS.gentle : WARMUPS.active).map((id) => byId.get(id)).filter(Boolean);
    for (const ex of list.sort(() => rand() - 0.5).slice(0, goal >= 20 * 60 ? 3 : goal >= 10 * 60 ? 2 : 1)) add(ex, 'warm');
  }
  // Cool-down stretches are chosen now (so they're reserved) and appended at the end.
  const cool = [];
  if (style !== 'relief' && style !== 'sleep' && style !== 'mobility') {
    const stretches = usable.filter((ex) => ex.type === 'stretch' && !CARDIO.has(ex.id) && !NOT_COOLDOWN.has(ex.id));
    const coolTargets = general || style === 'cardio' ? { hamstrings: 2, hipFlexors: 2, chest: 1, quads: 1, lowerBack: 1 } : targets;
    for (let i = 0; i < (goal >= 25 * 60 ? 4 : goal >= 12 * 60 ? 3 : 1); i++) {
      const ex = best(stretches, (e) => fit(e, coolTargets));
      if (ex) { cool.push(ex); used.add(ex.id); }
    }
  }
  // Main block: best-fitting moves (or full-body slots for a general strength session) until the time is used.
  const main = usable.filter((ex) => !(warm && WARMUPS.active.includes(ex.id) && style !== 'cardio'));
  const total = () => ctx.estimate({ ...routine, steps: [...routine.steps, ...cool.map((ex) => step(ex, 'cool'))] });
  for (let i = 0; i < 40 && total() < goal * 0.93; i++) {
    const t = general || style === 'cardio' && Object.keys(targets).length < 2 ? SLOTS[i % SLOTS.length] : targets;
    let ex = best(main, (e) => fit(e, t) + typeBonus(e));
    if (!ex) { used.clear(); routine.steps.forEach((st) => used.add(st.ex)); ex = best(main, (e) => fit(e, t) + typeBonus(e)); }
    if (!ex) break;
    add(ex, 'main');
    if (total() > goal * 1.12 && routine.steps.length > 3) { routine.steps.pop(); break; }
  }
  // Stretch-led sessions flow from standing to the floor; cool-downs end lying down too.
  if (calm || style === 'mobility') {
    const ex = (st) => ctx.exercises.find((e) => e.id === st.ex);
    routine.steps.sort((a, b) => hipHeight(ex(b)) - hipHeight(ex(a)));
  }
  cool.sort((a, b) => hipHeight(b) - hipHeight(a));
  for (const ex of cool) routine.steps.push(step(ex, 'cool'));
  return routine;
}

// Ready-made Explore routines that fit the request: overlap with the targets and style, usable gear, time.
export function matchExplore(prefs, ctx) {
  const { targets, style } = plan(prefs);
  const gear = prefs.gear ?? [];
  const goalWords = { relief: ['Recovery', 'Stretch & Mobility'], sleep: ['Recovery'], mobility: ['Stretch & Mobility'], posture: ['Desk & Travel', 'Full Workout'], cardio: ['Cardio & HIIT'], strength: ['Strength', 'Full Workout'], gentle: ['Strength', 'Full Workout'], mixed: ['Full Workout'] }[style] ?? [];
  const ok = (r) => ctx.routineGear(r).every((g) => g === 'No equipment' || g === 'Chair or bench' || gear.includes(g));
  return ctx.explore.map((r) => {
    const exs = r.steps.map((s) => ctx.getEx(s.ex)).filter(Boolean);
    const overlap = exs.reduce((a, ex) => a + (ex.primary ?? []).reduce((b, m) => b + (targets[m] ?? 0), 0), 0) / Math.max(1, exs.length);
    const mins = ctx.estimate(r) / 60;
    const score = overlap * 2 + (goalWords.includes(r.goal) ? 3 : 0) - Math.abs(mins - (prefs.time ?? 20)) / 10 + (prefs.level && r.level === prefs.level ? 1 : 0) - (prefs.level === 'Beginner' && r.level === 'Advanced' ? 5 : 0);
    return { r, score };
  }).filter(({ r }) => ok(r) && (!prefs.caution || (r.goal === 'Recovery' && r.level === 'Beginner'))).sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.r);
}

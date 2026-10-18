import { EXERCISES, STARTER_ROUTINES, MUSCLES, AREAS } from './exercises.js';
import { EXPLORE, GOALS, LEVELS } from './routines.js';
import * as coachBrain from './coach.js';
import { renderFigure, BAND_COLORS } from './figure.js';
import { COACHES, SKINS, setLook } from './character2.js';
import { muscleMapSVG } from './muscles.js';
import { audio, wakeLock } from './audio.js';
import * as stats from './analytics.js';

// ───────────────────────── Storage ─────────────────────────

const KEY = 'limber.v1';
const DEFAULT_SETTINGS = { voice: true, beeps: true, prep: 5, switchTime: 5, coach: 'a', skin: 1, units: 'lb', reminder: { days: [], time: '07:00' }, theme: 'auto', stats: true };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
const clone = (o) => JSON.parse(JSON.stringify(o));

const seedRoutines = () => STARTER_ROUTINES.map((r) => ({ ...clone(r), id: uid(), steps: r.steps.map((s) => ({ ...s, id: uid() })) }));

let db;
function load() {
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
  if (!db || typeof db !== 'object') {
    db = { routines: seedRoutines(), custom: [], history: [], settings: { ...DEFAULT_SETTINGS } };
    save();
  }
  normalize();
}
function normalize() {
  db.routines ??= [];
  db.custom ??= [];
  db.history ??= [];
  db.settings = { ...DEFAULT_SETTINGS, ...db.settings };
  setLook(db.settings.coach, db.settings.skin);
  applyTheme(db.settings.theme);
}
// Appearance: 'auto' follows the phone's light/dark setting (which iOS can switch at sunset); 'light'/'dark' force it.
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme; else delete root.dataset.theme;
  try { localStorage.setItem('limber.theme', theme); } catch { /* ignore */ }
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.content = theme === 'dark' ? '#1f242c' : theme === 'light' ? '#eef1f5' : (m.media.includes('dark') ? '#1f242c' : '#eef1f5');
  });
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { toast('Could not save — storage is full or blocked'); }
}
load();

const BUILTIN = new Map(EXERCISES.map((e) => [e.id, e]));
function getEx(id) {
  if (BUILTIN.has(id)) return BUILTIN.get(id);
  const c = db.custom.find((x) => x.id === id);
  if (!c) return null;
  const like = BUILTIN.get(c.like) ?? EXERCISES[0];
  return { ...c, anim: like.anim, custom: true };
}
const allExercises = () => [...EXERCISES, ...db.custom.map((c) => getEx(c.id))];
const getRoutine = (id) => db.routines.find((r) => r.id === id);

stats.setAllowed(() => db.settings.stats !== false);
// Once per launch: installed app or browser tab.
stats.event(isStandaloneApp() ? 'open-installed-app' : 'open-in-browser');
function isStandaloneApp() { return window.navigator.standalone || window.matchMedia?.('(display-mode: standalone)').matches; }

// ───────────────────────── Helpers ─────────────────────────

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`; };
const fmtClock = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const fmtMin = (s) => (s < 60 ? `${Math.max(1, Math.round(s))} sec` : `${Math.round(s / 60)} min`);
// Exercise types. 'strength' is the stored id for calisthenics (kept so saved routines keep working).
const TYPES = {
  stretch: { label: 'Stretch', plural: 'Stretches', count: 'stretch', color: 'var(--stretch)' },
  strength: { label: 'Calisthenics', plural: 'Calisthenics', count: 'calisthenics', color: 'var(--strength)' },
  weights: { label: 'Free Weights', plural: 'Free Weights', count: 'free weight', color: 'var(--weights)' },
  bands: { label: 'Bands', plural: 'Bands', count: 'band', color: 'var(--bands)' },
};
const typeVar = (t) => (TYPES[t] ?? TYPES.stretch).color;
const typeLabel = (t) => (TYPES[t] ?? TYPES.stretch).label;

// Weights are stored in the units chosen in Settings; built-in defaults are in pounds.
const LB_PER_KG = 2.2046;
const weightInc = () => (db.settings.units === 'kg' ? 1 : 2.5);
const roundWeight = (w) => Math.round(w * 2) / 2;
const defaultWeight = (ex) => (ex.weight ? (db.settings.units === 'kg' ? Math.round(ex.weight / LB_PER_KG) : ex.weight) : 0);
const fmtWeight = (w) => `${+(+w).toFixed(1)} ${db.settings.units}`;

// Resistance band levels, matching BAND_COLORS in figure.js.
const BAND_LEVELS = ['X-Light', 'Light', 'Medium', 'Heavy', 'X-Heavy'];
const BAND_SPOKEN = ['extra light', 'light', 'medium', 'heavy', 'extra heavy'];
const fmtBand = (b) => `${BAND_LEVELS[b]} band`;
const bandDot = (b) => `<i class="band-dot" style="background:${BAND_COLORS[b]}"></i>`;

// ───────────────────────── Lift log ─────────────────────────
// Finished workouts store lifts: [{ ex, mode, u, b?, sets: [[load, reps or seconds]] }] — load is a weight
// in units u, or a band level when b is set.

function liftLog(exId) { // newest first
  const out = [];
  for (const h of db.history) for (const l of h.lifts ?? []) if (l.ex === exId) out.push({ date: h.date, ...l });
  return out;
}
const toUnits = (w, u) => (!u || u === db.settings.units ? w : roundWeight(u === 'kg' ? w * LB_PER_KG : w / LB_PER_KG));
// Heaviest set (most reps breaks ties), in current units.
const topSet = (l) => l.sets.map(([w, n]) => [l.b ? w : toUnits(w, l.u), n]).reduce((a, s) => (s[0] > a[0] || (s[0] === a[0] && s[1] > a[1]) ? s : a));
const fmtLoad = (l, w) => (l.b ? fmtBand(w) : fmtWeight(w));
const liftText = (l) => { const [w, n] = topSet(l); return `${fmtLoad(l, w)} × ${n}${l.mode === 'time' ? 's' : ''}`; };
const setsText = (l) => l.sets.map(([w, n]) => `${l.b ? BAND_LEVELS[w] : +toUnits(w, l.u).toFixed(1)}×${n}${l.mode === 'time' ? 's' : ''}`).join(', ');
const shortDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// Top-set trend, oldest → newest. Small line; the newest point gets a marker.
function sparkline(vals, { w = 92, h = 30 } = {}) {
  if (vals.length < 2) return '';
  const min = Math.min(...vals), span = Math.max(...vals) - min || 1;
  const xy = vals.map((v, i) => [3 + (i / (vals.length - 1)) * (w - 6), h - 4 - ((v - min) / span) * (h - 8)]);
  const [lx, ly] = xy[xy.length - 1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path d="M${xy.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}"/><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="3"/></svg>`;
}
const muscleNames = (list) => (list ?? []).map((m) => MUSCLES[m] ?? m).join(', ');

const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none"/>',
  next: '<path d="M6 5.5v13l9-6.5zM17 5v14" />',
  prev: '<path d="M18 5.5v13l-9-6.5zM7 5v14" />',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  share: '<path d="M12 15V3M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16M8 7h7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M5 9h14M12 9v6M9 21l3-6 3 6"/>',
  grip: '<circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/>',
  sort: '<path d="M7 4v16M3.5 7.5L7 4l3.5 3.5M17 20V4M13.5 16.5L17 20l3.5-3.5"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17A8.5 8.5 0 0 0 12 3.5z" fill="currentColor"/>',
};
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

let toastTimer;
function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

// Bottom sheet helper. Returns { el, close }.
function sheet(html, { onClose, cls = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.append(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  const close = () => {
    wrap.classList.remove('open');
    setTimeout(() => wrap.remove(), 250);
    onClose?.();
  };
  $('.sheet-backdrop', wrap).onclick = close;
  return { el: $('.sheet', wrap), close };
}

function menu(items) {
  const s = sheet(`<div class="menu">${items.map((it, i) => `<button class="menu-item ${it.danger ? 'danger' : ''}" data-i="${i}">${icon(it.icon)}<span>${esc(it.label)}</span></button>`).join('')}
    <button class="menu-item cancel" data-i="-1">Cancel</button></div>`);
  s.el.onclick = (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    s.close();
    items[+b.dataset.i]?.run();
  };
}

// ───────────────────────── Feedback ─────────────────────────

// Feedback goes out as an email from the tester's own mail app, with what they were looking at attached.
const FEEDBACK_EMAIL = '__EMAIL__';
const FEEDBACK_KINDS = [['problem', 'Problem'], ['idea', 'Idea'], ['other', 'Other']];
let lastScreen = '#/';

async function appVersion() {
  try { return (await caches.keys()).find((k) => k.startsWith('limber-'))?.replace('limber-', '') ?? 'dev'; } catch { return 'dev'; }
}

function deviceName() {
  const ua = navigator.userAgent, ios = ua.match(/(iPhone|iPad|iPod).*? OS (\d+)_(\d+)/), android = ua.match(/Android ([\d.]+)/);
  if (ios) return `${ios[1]} · iOS ${ios[2]}.${ios[3]}`;
  if (android) return `Android ${android[1]}`;
  return ua;
}

function screenName(hash) {
  const [, page, id] = hash.match(/^#\/([\w]+)?(?:\/([\w-]+))?/) ?? [];
  if (page === 'routine') return `Routine editor (${db.routines.find((r) => r.id === id)?.name ?? 'routine'})`;
  if (page === 'exercise') return `Exercise: ${getEx(id)?.name ?? id}`;
  if (page === 'explore') return `Explore: ${EXPLORE.find((r) => r.id === id)?.name ?? id}`;
  if (page === 'play') return 'Workout player';
  return { library: 'Exercises', history: 'History', settings: 'Settings', coach: 'Coach', custom: 'Custom exercise' }[page] ?? 'Routines (home)';
}

function openFeedback() {
  let kind = 'problem';
  const where = screenName(lastScreen);
  const s = sheet(`
    <div class="sheet-head"><h3>Send feedback</h3><button class="btn-icon" data-act="close" aria-label="Close">${icon('close')}</button></div>
    <div class="form fb">
      <div class="seg" role="radiogroup" aria-label="Kind of feedback">${FEEDBACK_KINDS.map(([k, l]) => `<button role="radio" data-kind="${k}" class="${k === kind ? 'on' : ''}" aria-checked="${k === kind}">${l}</button>`).join('')}</div>
      <label>What happened?<textarea rows="5" placeholder="What you were doing, what you expected, and what went wrong."></textarea></label>
      <label><span>Your name <span class="muted">(optional)</span></span><input type="text" autocomplete="name" placeholder="So I know who to thank"></label>
      <p class="muted small">Your phone's mail app opens with this filled in, plus the app version, your phone model and the screen you were on (${esc(where)}). Nothing sends until you tap Send there.</p>
      <button class="btn primary wide big" data-act="send" disabled>${icon('send', 'inline')} Write email</button>
    </div>`);
  const text = $('textarea', s.el), name = $('input', s.el), send = $('[data-act=send]', s.el);
  text.oninput = () => { send.disabled = !text.value.trim(); };
  s.el.onclick = async (e) => {
    const t = e.target.closest('[data-kind],[data-act]');
    if (!t) return;
    if (t.dataset.act === 'close') { s.close(); return; }
    if (t.dataset.kind) {
      kind = t.dataset.kind;
      $$('[data-kind]', s.el).forEach((b) => { b.classList.toggle('on', b === t); b.setAttribute('aria-checked', b === t); });
      return;
    }
    if (t.dataset.act !== 'send' || !text.value.trim()) return;
    const label = FEEDBACK_KINDS.find(([k]) => k === kind)[1];
    const body = [text.value.trim(), '', name.value.trim() ? `From: ${name.value.trim()}` : '', '— Sent from Limber —',
      `Screen: ${where}`, `Version: ${await appVersion()}`, `Device: ${deviceName()}`,
      `Screen size: ${screen.width}×${screen.height}, ${isStandaloneApp() ? 'installed app' : 'browser'}, ${matchMedia('(prefers-color-scheme: dark)').matches && db.settings.theme !== 'light' || db.settings.theme === 'dark' ? 'dark' : 'light'} mode`,
    ].filter((l, i) => l || i === 1).join('\n');
    const first = text.value.trim().split('\n')[0];
    const subject = `Limber ${label.toLowerCase()}: ${first.length > 50 ? `${first.slice(0, 50)}…` : first}`;
    stats.event('feedback', label);
    location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    s.close();
    toast('Thanks! Tap Send in Mail to finish.');
  };
  setTimeout(() => text.focus(), 300);
}

// ───────────────────────── Routine math ─────────────────────────

function stepInfo(step) {
  const ex = getEx(step.ex);
  if (!ex) return null;
  const mode = step.mode ?? ex.mode;
  return {
    ex, mode,
    duration: step.duration ?? ex.duration ?? 30,
    reps: step.reps ?? ex.reps ?? 10,
    sets: step.sets ?? ex.sets ?? 1,
    setRest: step.setRest ?? (ex.type === 'weights' ? 60 : ex.type === 'strength' ? 30 : 10),
    weight: ex.type === 'weights' ? step.weight ?? defaultWeight(ex) : null,
    band: ex.type === 'bands' ? step.band ?? ex.band ?? 2 : null,
    sided: !!ex.sided && step.sides !== 'one',
  };
}

const SEC_PER_REP = 3;

function buildPhases(routine) {
  const S = db.settings;
  const P = [];
  const steps = routine.steps.map((s) => ({ s, i: stepInfo(s) })).filter((x) => x.i);
  if (steps.length && S.prep > 0) P.push({ kind: 'prep', dur: S.prep });
  steps.forEach(({ s, i: si }, idx) => {
    const sides = si.sided ? ['Left', 'Right'] : [null];
    for (let set = 1; set <= si.sets; set++) {
      sides.forEach((side, k) => {
        if (k > 0 && S.switchTime > 0) P.push({ kind: 'switch', dur: S.switchTime, side });
        P.push({ kind: 'work', ex: si.ex, mode: si.mode, dur: si.mode === 'time' ? si.duration : null, reps: si.reps, weight: si.weight, band: si.band, side, set, sets: si.sets, step: idx, sid: s.id });
      });
      if (set < si.sets && si.setRest > 0) P.push({ kind: 'rest', dur: si.setRest });
    }
    const rest = s.rest ?? routine.rest ?? 10;
    if (idx < steps.length - 1 && rest > 0) P.push({ kind: 'rest', dur: rest });
  });
  P.forEach((p, i) => { if (p.kind !== 'work') p.next = P.slice(i + 1).find((q) => q.kind === 'work'); });
  return P;
}

const phaseSeconds = (p) => p.dur ?? p.reps * SEC_PER_REP;
const estimate = (routine) => buildPhases(routine).reduce((a, p) => a + phaseSeconds(p), 0);

function stepSummary(step) {
  const si = stepInfo(step);
  if (!si) return 'Missing exercise';
  let s = si.mode === 'time' ? fmtTime(si.duration) : `${si.reps} reps`;
  if (si.sets > 1) s += ` × ${si.sets} sets`;
  if (si.weight) s += ` · ${fmtWeight(si.weight)}`;
  if (si.band !== null) s += ` · ${fmtBand(si.band)}`;
  if (si.sided) s += ' · each side';
  return s;
}

// ───────────────────────── Router ─────────────────────────

const app = $('#app');
let cleanup = null;

const routes = [
  [/^#\/?$/, viewRoutines],
  [/^#\/routine\/([\w-]+)$/, viewEditor],
  [/^#\/library$/, viewLibrary],
  [/^#\/exercise\/([\w-]+)$/, viewExercise],
  [/^#\/custom\/([\w-]+)$/, viewCustomEditor],
  [/^#\/history$/, viewHistory],
  [/^#\/settings$/, viewSettings],
  [/^#\/play\/([\w-]+)$/, viewPlayer],
  [/^#\/import\/(.+)$/, viewImport],
  [/^#\/explore\/([\w-]+)$/, viewExplore],
  [/^#\/coach$/, viewCoach],
];

function render() {
  cleanup?.();
  cleanup = null;
  const hash = location.hash || '#/';
  for (const [re, fn] of routes) {
    const m = hash.match(re);
    if (m) {
      const tab = hash.startsWith('#/library') || hash.startsWith('#/exercise') || hash.startsWith('#/custom') ? 'library'
        : hash.startsWith('#/history') ? 'history' : hash.startsWith('#/settings') ? 'settings' : hash.startsWith('#/coach') ? 'coach' : 'routines';
      document.body.dataset.tab = tab;
      document.body.classList.toggle('playing', hash.startsWith('#/play'));
      cleanup = fn(...m.slice(1)) || null;
      if (!hash.startsWith('#/settings')) lastScreen = hash;
      stats.pageview(hash);
      updateTabs(tab);
      return;
    }
  }
  location.hash = '#/';
}
window.addEventListener('hashchange', () => {
  if (updateWaiting && !location.hash.startsWith('#/play')) { reloadIntoUpdate(); return; }
  render(); window.scrollTo(0, 0);
});

// A new version of the app is ready (see the service worker setup at the bottom).
let updateWaiting = false;
function reloadIntoUpdate() {
  try { sessionStorage.setItem('limber.updated', '1'); } catch { /* ignore */ }
  location.reload();
}

function updateTabs(tab) {
  $$('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
}

// ───────────────────────── Routines ─────────────────────────

const isStandalone = isStandaloneApp;

// Home: My routines (compact rows) and Explore — ready-made routines with search, filters and sort.
// Which half of the home screen is showing: 'mine' or 'explore' (remembered between visits).
let homeView = (() => { try { return localStorage.getItem('limber.homeView') === 'explore' ? 'explore' : 'mine'; } catch { return 'mine'; } })();
const exploreState = { open: false, goal: 'all', len: 'all', gear: 'all', level: 'all' };
let exploreQuery = '', exploreSort = 'recommended';

const GEAR = ['No equipment', 'Dumbbells', 'Kettlebell', 'Barbell', 'Bands', 'Pull-up bar', 'Chair or bench'];
const EXPLORE_FILTERS = [
  { key: 'goal', label: 'Goal', options: GOALS.map((g) => [g, g]) },
  { key: 'len', label: 'Length', options: [['short', 'Under 10 min'], ['mid', '10–20 min'], ['long', '20–40 min'], ['xl', '40+ min']] },
  { key: 'gear', label: 'Equipment', options: GEAR.map((g) => [g, g]) },
  { key: 'level', label: 'Level', options: LEVELS.map((l) => [l, l]) },
];
const SORTS = [['recommended', 'Recommended'], ['short', 'Shortest first'], ['long', 'Longest first'], ['easy', 'Easiest first'], ['name', 'A–Z']];

// What you need for a routine, worked out from its exercises.
function routineGear(r) {
  const tags = new Set();
  for (const st of r.steps) {
    const ex = getEx(st.ex);
    if (!ex) continue;
    const e = (ex.equipment ?? '').toLowerCase();
    if (ex.type === 'bands') tags.add('Bands');
    if (e.includes('barbell')) tags.add('Barbell');
    if (ex.id.startsWith('kb-')) tags.add('Kettlebell');
    if (e.includes('dumbbell')) tags.add('Dumbbells');
    if (e.includes('pull-up')) tags.add('Pull-up bar');
    if (e.includes('chair') || e.includes('bench')) tags.add('Chair or bench');
  }
  return tags.size ? GEAR.filter((g) => tags.has(g)) : ['No equipment'];
}

function exploreResults() {
  const q = exploreQuery.trim().toLowerCase();
  const S = exploreState;
  const LEN = { short: [0, 600], mid: [600, 1200], long: [1200, 2400], xl: [2400, Infinity] };
  const list = EXPLORE.map((r, i) => ({ r, i, secs: estimate(r), gear: routineGear(r) })).filter(({ r, gear, secs }) =>
    (S.goal === 'all' || r.goal === S.goal) && (S.len === 'all' || (secs >= LEN[S.len][0] && secs < LEN[S.len][1])) && (S.level === 'all' || r.level === S.level) && (S.gear === 'all' || gear.includes(S.gear)) &&
    (!q || [r.name, r.desc, r.goal, r.level, ...gear, ...r.steps.map((st) => getEx(st.ex)?.name ?? '')].some((x) => x.toLowerCase().includes(q))));
  const by = {
    recommended: (a, b) => a.i - b.i,
    short: (a, b) => a.secs - b.secs,
    long: (a, b) => b.secs - a.secs,
    easy: (a, b) => LEVELS.indexOf(a.r.level) - LEVELS.indexOf(b.r.level) || a.secs - b.secs,
    name: (a, b) => a.r.name.localeCompare(b.r.name),
  };
  return list.sort(by[exploreSort]);
}

function viewRoutines() {
  const hintDismissed = (() => { try { return localStorage.getItem('limber.hint') === '1'; } catch { return false; } })();
  const showHint = !isStandalone() && !hintDismissed && /iPhone|iPad|iPod/.test(navigator.userAgent);
  let sorting = false;
  const figs = [];
  const drawExplore = () => {
    figs.splice(0).forEach((f) => f.stop());
    $('.fwrap', app).innerHTML = filterBar(exploreState, EXPLORE_FILTERS);
    const items = exploreResults();
    $('.x-count', app).textContent = `${items.length} routine${items.length === 1 ? '' : 's'}`;
    $('.xlist', app).innerHTML = items.map(({ r, secs, gear }) => {
      const added = db.routines.some((m) => m.from === r.id);
      return `<a class="xrow" href="#/explore/${r.id}" style="--acc:${typeVar(getEx(r.steps[0].ex)?.type)}">
        <span class="x-thumb" data-ex="${r.steps[0].ex}"></span>
        <span class="x-text"><b>${esc(r.name)}</b><span class="x-meta">${typeDots(r.steps)}<span>${r.level} · ~${fmtMin(secs)} · ${esc(gear.join(', '))}</span></span></span>
        ${added ? `<span class="x-added" aria-label="In My routines">${icon('check')}</span>` : icon('back', 'x-chev')}
      </a>`;
    }).join('') || '<p class="muted pad center">No routines match. Try clearing a filter.</p>';
    $$('.x-thumb', app).forEach((el) => figs.push(renderFigure(el, getEx(el.dataset.ex), { animate: false, aspect: 1.15, arrows: false })));
  };
  const draw = () => {
    const mine = homeView === 'mine' || sorting;
    app.innerHTML = `
      <header class="top">
        <h1>Routines</h1>
        <div class="top-actions">
          ${mine && db.routines.length > 1 ? (sorting
            ? '<button class="btn small primary" data-act="sort">Done</button>'
            : `<button class="btn-icon" data-act="sort" aria-label="Reorder routines">${icon('sort')}</button>`) : ''}
          ${sorting ? '' : `<a class="btn-icon" href="#/coach" aria-label="Ask the Coach">${icon('chat')}</a>`}
          ${sorting ? '' : `<button class="btn-icon accent" data-act="new" aria-label="New routine">${icon('plus')}</button>`}
        </div>
      </header>
      ${sorting ? '' : `<div class="home-tabs" role="tablist" aria-label="Routines view">
        <button role="tab" data-view="mine" class="${mine ? 'on' : ''}" aria-selected="${mine}">My routines <span>${db.routines.length}</span></button>
        <button role="tab" data-view="explore" class="${mine ? '' : 'on'}" aria-selected="${!mine}">Explore <span>${EXPLORE.length}</span></button>
      </div>`}
      ${showHint && !sorting ? `<div class="hint"><div><strong>Install Limber</strong><p>Tap the Share button ${icon('share', 'inline')} then <b>Add to Home Screen</b> to use it like an app. Routines you make in the installed app stay there.</p></div><button class="btn-icon" data-act="hint" aria-label="Dismiss">${icon('close')}</button></div>` : ''}
      ${sorting ? '<p class="muted small sort-tip">Drag the handles to reorder.</p>' : workoutDayNudge()}
      ${mine ? `
      <div class="rlist ${sorting ? 'sorting-mode' : ''}">
        ${db.routines.length ? db.routines.map((r) => routineCard(r, sorting)).join('') : `<div class="empty small"><p>No routines yet. Make your own, pick one from Explore, or ask the Coach to build one.</p><button class="btn primary small" data-act="new">Create a routine</button> <a class="btn small" href="#/coach">Ask the Coach</a></div>`}
      </div>` : `
      <section class="explore">
        <a class="coach-cta" href="#/coach">${icon('spark')}<span><b>Not sure what to do?</b><span>Tell the Coach what's bothering you and get a routine built for you.</span></span>${icon('back', 'x-chev')}</a>
        <div class="search">${icon('search')}<input type="search" placeholder="Search routines or exercises" value="${esc(exploreQuery)}" aria-label="Search routines"></div>
        <div class="fwrap"></div>
        <div class="x-tools"><span class="x-count muted small"></span>
          <label class="sort-select">${icon('sort', 'inline')}<select aria-label="Sort routines">${SORTS.map(([k, l]) => `<option value="${k}" ${k === exploreSort ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        <div class="xlist"></div>
      </section>`}
      ${sorting ? '' : `<button class="fb-link" data-act="feedback">${icon('flag', 'inline')} Something not right? Send feedback</button>`}
    `;
    if (mine) sortable($('.rlist', app), '.rrow', (from, to) => { move(db.routines, from, to); save(); draw(); });
    else {
      drawExplore();
      $('.explore input', app).addEventListener('input', (e) => { exploreQuery = e.target.value; drawExplore(); });
      $('.explore select', app).addEventListener('change', (e) => { exploreSort = e.target.value; drawExplore(); });
    }
  };
  draw();
  app.onclick = (e) => {
    if (filterClick(e, exploreState)) { drawExplore(); return; }
    const v = e.target.closest('[data-view]');
    if (v && v.dataset.view !== homeView) {
      homeView = v.dataset.view;
      try { localStorage.setItem('limber.homeView', homeView); } catch { /* ignore */ }
      draw(); window.scrollTo(0, 0);
      return;
    }
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const id = t.closest('[data-id]')?.dataset.id;
    if (t.dataset.act === 'sort') { sorting = !sorting; draw(); }
    if (t.dataset.act === 'feedback') openFeedback();
    if (t.dataset.act === 'new') {
      const r = { id: uid(), name: 'New Routine', rest: 10, steps: [] };
      db.routines.unshift(r); save();
      location.hash = `#/routine/${r.id}`;
    }
    if (t.dataset.act === 'open') location.hash = `#/routine/${id}`;
    if (t.dataset.act === 'play') startRoutine(id);
    if (t.dataset.act === 'nudge') { try { localStorage.setItem('limber.nudge', new Date().toDateString()); } catch { /* ignore */ } t.closest('.hint').remove(); }
    if (t.dataset.act === 'hint') { try { localStorage.setItem('limber.hint', '1'); } catch { /* ignore */ } t.closest('.hint').remove(); }
  };
  return () => figs.forEach((f) => f.stop());
}

// On a reminder day with no workout yet, a gentle banner on the home screen.
function workoutDayNudge() {
  const today = new Date().toDateString();
  const dismissed = (() => { try { return localStorage.getItem('limber.nudge') === today; } catch { return false; } })();
  if (dismissed || !db.settings.reminder.days.includes(new Date().getDay()) || db.history.some((h) => new Date(h.date).toDateString() === today) || !db.routines.length) return '';
  return `<div class="hint nudge"><div><strong>It's a workout day</strong><p>Pick a routine below and press play.</p></div><button class="btn-icon" data-act="nudge" aria-label="Dismiss">${icon('close')}</button></div>`;
}

// One colored dot per exercise type in a routine (stretch, calisthenics, weights, bands).
const typeDots = (steps) => Object.keys(TYPES).filter((k) => steps.some((st) => getEx(st.ex)?.type === k)).map((k) => `<i class="tdot" style="background:${TYPES[k].color}" title="${TYPES[k].label}"></i>`).join('');

// Compact My routines row: name, a one-line summary with type dots, and play (or a drag handle while reordering).
function routineCard(r, sorting = false) {
  const infos = r.steps.map(stepInfo).filter(Boolean);
  const dots = typeDots(r.steps);
  const last = db.history.find((h) => h.routineId === r.id);
  return `<article class="rrow" data-id="${r.id}">
    <button class="rrow-main" ${sorting ? 'tabindex="-1"' : 'data-act="open"'}>
      <b>${esc(r.name)}</b>
      <span class="rrow-meta">${dots}<span>${infos.length} ex · ~${fmtMin(estimate(r))}${last ? ` · ${relDate(last.date)}` : ''}</span></span>
    </button>
    ${sorting
      ? `<span class="grip" aria-label="Drag to reorder ${esc(r.name)}">${icon('grip')}</span>`
      : `<button class="play-btn sm" data-act="play" aria-label="Start ${esc(r.name)}" ${infos.length ? '' : 'disabled'}>${icon('play')}</button>`}
  </article>`;
}

const move = (arr, from, to) => arr.splice(to, 0, ...arr.splice(from, 1));

// Drag-to-reorder for a list: press a .grip inside an item and drag. Calls onDrop(from, to).
// Attach again whenever the list element is re-rendered.
function sortable(list, itemSel, onDrop) {
  list.addEventListener('pointerdown', (e) => {
    const grip = e.target.closest('.grip');
    const el = grip?.closest(itemSel);
    if (!el || !list.contains(el) || e.button > 0) return;
    const items = [...list.querySelectorAll(itemSel)];
    const from = items.indexOf(el);
    e.preventDefault();
    grip.setPointerCapture?.(e.pointerId);
    const rects = items.map((x) => x.getBoundingClientRect());
    const gap = rects.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 8;
    const shift = rects[from].height + gap;
    const y0 = e.clientY, scroll0 = window.scrollY;
    let y = y0, to = from, raf = 0;
    el.classList.add('dragging');
    list.classList.add('sorting');
    const frame = () => {
      // Scroll when dragging near the top or bottom edge.
      const edge = 72;
      if (y < edge) window.scrollBy(0, -Math.ceil((edge - y) / 6));
      else if (y > innerHeight - edge - 70) window.scrollBy(0, Math.ceil((y - (innerHeight - edge - 70)) / 6));
      const dy = y - y0 + (window.scrollY - scroll0);
      el.style.transform = `translateY(${dy}px)`;
      const mid = rects[from].top + rects[from].height / 2 + dy;
      to = from;
      rects.forEach((r, i) => {
        const m = r.top + r.height / 2;
        if (i < from && mid < m) to = Math.min(to, i);
        if (i > from && mid > m) to = Math.max(to, i);
      });
      items.forEach((x, i) => {
        if (x === el) return;
        const s = from < to && i > from && i <= to ? -shift : to < from && i >= to && i < from ? shift : 0;
        x.style.transform = s ? `translateY(${s}px)` : '';
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const onMove = (ev) => { y = ev.clientY; };
    const end = () => {
      cancelAnimationFrame(raf);
      grip.removeEventListener('pointermove', onMove);
      grip.removeEventListener('pointerup', end);
      grip.removeEventListener('pointercancel', end);
      items.forEach((x) => { x.style.transform = ''; });
      el.classList.remove('dragging');
      list.classList.remove('sorting');
      if (to !== from) onDrop(from, to);
    };
    grip.addEventListener('pointermove', onMove);
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
  });
}

function relDate(iso) {
  const d = new Date(iso), now = new Date();
  const days = Math.round((new Date(now.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function startRoutine(id) {
  audio.unlock();
  const r = getRoutine(id);
  stats.event('workout-start', r?.from ? EXPLORE.find((x) => x.id === r.from)?.name ?? 'Custom' : 'Custom');
  location.hash = `#/play/${id}`;
}

// ───────────────────────── Routine editor ─────────────────────────

function viewEditor(id) {
  const r = getRoutine(id);
  if (!r) { location.hash = '#/'; return; }
  let open = null; // expanded step id
  const figs = [];

  const draw = () => {
    figs.splice(0).forEach((f) => f.stop());
    const total = estimate(r);
    app.innerHTML = `
      <header class="top">
        <a class="btn-icon" href="#/" aria-label="Back">${icon('back')}</a>
        <div class="top-title"></div>
        <button class="btn-icon" data-act="menu" aria-label="Routine options">${icon('more')}</button>
      </header>
      <input class="title-input" value="${esc(r.name)}" aria-label="Routine name" data-field="name" maxlength="60">
      <div class="editor-meta">
        <span>${r.steps.length} exercise${r.steps.length === 1 ? '' : 's'} · ~${fmtMin(total)}</span>
        <label class="inline-stepper">Rest between ${stepper('rest', r.rest ?? 10, 5, 0, 300, 's')}</label>
      </div>
      <ol class="steps">
        ${r.steps.map((s, i) => stepRow(s, i, r.steps.length, open === s.id, r.rest ?? 10)).join('')}
      </ol>
      ${r.steps.length ? '' : '<div class="empty small"><p>Add stretches and exercises to build your routine.</p></div>'}
      <button class="btn ghost wide" data-act="add">${icon('plus')} Add exercises</button>
      <div class="bottom-cta"><button class="btn primary wide big" data-act="start" ${r.steps.length ? '' : 'disabled'}>${icon('play')} Start routine</button></div>
    `;
    $$('.step-thumb', app).forEach((el) => {
      const ex = getEx(el.dataset.ex);
      if (ex) figs.push(renderFigure(el, ex, { animate: false, aspect: 1.15 }));
    });
    const openFig = $('.step-preview', app);
    if (openFig) figs.push(renderFigure(openFig, getEx(openFig.dataset.ex), { aspect: 1.25, band: stepInfo(r.steps.find((x) => x.id === open))?.band }));
    sortable($('.steps', app), '.step', (from, to) => { move(r.steps, from, to); commit(); });
  };

  const commit = (redraw = true) => { save(); if (redraw) draw(); };

  app.onclick = (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const sid = t.closest('[data-sid]')?.dataset.sid;
    const idx = r.steps.findIndex((s) => s.id === sid);
    const step = r.steps[idx];
    switch (t.dataset.act) {
      case 'toggle': open = open === sid ? null : sid; draw(); break;
      case 'dup': r.steps.splice(idx + 1, 0, { ...clone(step), id: uid() }); commit(); break;
      case 'remove': r.steps.splice(idx, 1); if (open === sid) open = null; commit(); break;
      case 'mode': step.mode = t.dataset.v; commit(); break;
      case 'sides': step.sides = step.sides === 'one' ? undefined : 'one'; commit(); break;
      case 'band': step.band = Math.min(4, Math.max(0, stepInfo(step).band + +t.dataset.inc)); commit(); break;
      case 'step': {
        const f = t.dataset.f, target = f === 'rest' && !sid ? r : step;
        const [min, max, inc] = [+t.dataset.min, +t.dataset.max, +t.dataset.inc];
        const cur = target[f] ?? (f === 'rest' ? r.rest ?? 10 : stepInfo(step)[f]);
        target[f] = roundWeight(Math.min(max, Math.max(min, cur + inc)));
        commit();
        break;
      }
      case 'info': location.hash = `#/exercise/${step.ex}`; break;
      case 'add': pickExercises(r, () => { commit(); }); break;
      case 'start': startRoutine(r.id); break;
      case 'menu': menu([
        { icon: 'share', label: 'Share routine', run: () => shareRoutine(r) },
        { icon: 'copy', label: 'Duplicate', run: () => { const c = { ...clone(r), id: uid(), name: r.name + ' (copy)' }; c.steps.forEach((s) => { s.id = uid(); }); db.routines.splice(db.routines.indexOf(r) + 1, 0, c); save(); location.hash = `#/routine/${c.id}`; } },
        { icon: 'trash', label: 'Delete routine', danger: true, run: () => { if (confirm(`Delete "${r.name}"?`)) { db.routines.splice(db.routines.indexOf(r), 1); save(); location.hash = '#/'; } } },
      ]); break;
    }
  };
  app.onchange = (e) => {
    const t = e.target;
    if (t.dataset.field === 'name') { r.name = t.value.trim() || 'Untitled Routine'; commit(false); }
    if (t.dataset.num) {
      const sid = t.closest('[data-sid]')?.dataset.sid;
      const target = sid ? r.steps.find((s) => s.id === sid) : r;
      const v = t.dataset.num === 'weight' ? roundWeight(+t.value) : Math.round(+t.value);
      if (t.value === '' && sid) delete target[t.dataset.num];
      else if (Number.isFinite(v)) target[t.dataset.num] = Math.min(+t.max, Math.max(+t.min, v));
      commit();
    }
  };
  draw();
  return () => figs.forEach((f) => f.stop());
}

function stepper(field, value, inc, min, max, unit = '', placeholder = '') {
  return `<span class="stepper">
    <button data-act="step" data-f="${field}" data-inc="${-inc}" data-min="${min}" data-max="${max}" aria-label="Decrease">−</button>
    <input type="number" inputmode="${inc % 1 ? 'decimal' : 'numeric'}" step="any" data-num="${field}" value="${value}" min="${min}" max="${max}" placeholder="${placeholder}" aria-label="${field}"><span class="unit">${unit}</span>
    <button data-act="step" data-f="${field}" data-inc="${inc}" data-min="${min}" data-max="${max}" aria-label="Increase">+</button>
  </span>`;
}

function stepRow(s, i, n, isOpen, routineRest) {
  const si = stepInfo(s);
  const grip = `<span class="grip" aria-label="Drag to reorder">${icon('grip')}</span>`;
  if (!si) {
    return `<li class="step" data-sid="${s.id}"><div class="step-row"><div class="step-head"><div class="step-name">Missing exercise</div><button class="btn-icon" data-act="remove">${icon('trash')}</button></div>${grip}</div></li>`;
  }
  const ex = si.ex;
  const tile = (label, control) => `<label class="tile"><span class="tile-l">${label}</span>${control}</label>`;
  const per = si.sided ? ' <small>/side</small>' : '';
  return `<li class="step ${isOpen ? 'open' : ''}" data-sid="${s.id}" style="--acc:${typeVar(ex.type)}">
    <div class="step-row">
      <button class="step-head" data-act="toggle" aria-expanded="${isOpen}">
        <span class="step-num">${i + 1}</span>
        <span class="step-thumb" data-ex="${ex.id}"></span>
        <span class="step-text"><span class="step-name">${esc(ex.name)}</span><span class="step-sum">${stepSummary(s)}</span></span>
      </button>
      ${grip}
    </div>
    ${isOpen ? `<div class="step-body">
      <div class="step-top">
        <div class="step-preview" data-ex="${ex.id}"></div>
        <div class="step-side">
          <div class="seg" role="group" aria-label="Measure by">
            <button data-act="mode" data-v="time" class="${si.mode === 'time' ? 'on' : ''}">Timed</button>
            <button data-act="mode" data-v="reps" class="${si.mode === 'reps' ? 'on' : ''}">Reps</button>
          </div>
          ${ex.sided ? `<label class="mini-switch"><span>Both sides</span><button class="toggle sm ${s.sides === 'one' ? '' : 'on'}" data-act="sides" role="switch" aria-checked="${s.sides !== 'one'}"><span></span></button></label>` : ''}
          <div class="step-actions">
            <button class="btn-icon sm" data-act="dup" aria-label="Duplicate">${icon('copy')}</button>
            <button class="btn-icon sm" data-act="info" aria-label="How to do it">${icon('info')}</button>
            <button class="btn-icon sm danger" data-act="remove" aria-label="Remove">${icon('trash')}</button>
          </div>
        </div>
      </div>
      <div class="tiles">
        ${si.mode === 'time'
          ? tile(`Duration${per}`, stepper('duration', si.duration, 5, 5, 600, 's'))
          : tile(`Reps${per}`, stepper('reps', si.reps, 1, 1, 200))}
        ${tile('Sets', stepper('sets', si.sets, 1, 1, 20))}
        ${tile('Rest after', stepper('rest', s.rest ?? '', 5, 0, 300, 's', routineRest))}
        ${si.weight !== null ? tile('Weight', stepper('weight', si.weight, weightInc(), 0, db.settings.units === 'kg' ? 500 : 1000, db.settings.units)) : ''}
        ${si.band !== null ? tile('Band', `<span class="stepper"><button data-act="band" data-inc="-1" aria-label="Lighter band" ${si.band ? '' : 'disabled'}>−</button><span class="band-val">${bandDot(si.band)}${BAND_LEVELS[si.band]}</span><button data-act="band" data-inc="1" aria-label="Heavier band" ${si.band < 4 ? '' : 'disabled'}>+</button></span>`) : ''}
        ${si.sets > 1 ? tile('Set rest', stepper('setRest', si.setRest, 5, 0, 300, 's')) : ''}
      </div>
      ${(() => { const last = si.weight !== null || si.band !== null ? liftLog(ex.id)[0] : null; return last ? `<p class="last-lift">Last time: <b>${liftText(last)}</b> · ${shortDate(last.date)}</p>` : ''; })()}
    </div>` : ''}
  </li>`;
}

// Exercise picker sheet: tap to add to routine.
function pickExercises(routine, onDone) {
  const fs = { open: false, type: 'all', area: 'all' };
  let q = '';
  const figs = [];
  const s = sheet(`
    <div class="sheet-head"><h3>Add exercises</h3><button class="btn small primary" data-act="done">Done</button></div>
    <div class="search">${icon('search')}<input type="search" placeholder="Search exercises or muscles" aria-label="Search"></div>
    <div class="fwrap"></div>
    <div class="pick-list"></div>`, { cls: 'tall', onClose: () => { figs.forEach((f) => f.stop()); onDone(); } });
  const list = $('.pick-list', s.el);
  const draw = () => {
    figs.splice(0).forEach((f) => f.stop());
    $('.fwrap', s.el).innerHTML = filterBar(fs, EX_FILTERS);
    const items = filterExercises(allExercises(), fs.type, q, fs.area);
    list.innerHTML = items.map((ex) => `<button class="pick" data-id="${ex.id}" style="--acc:${typeVar(ex.type)}">
      <span class="pick-thumb" data-ex="${ex.id}"></span>
      <span class="pick-text"><span class="pick-name">${esc(ex.name)}</span><span class="pick-sub">${esc(muscleNames(ex.primary))}</span></span>
      <span class="pick-add">${icon('plus')}</span></button>`).join('') || '<p class="muted pad">No matches.</p>';
    $$('.pick-thumb', list).forEach((el) => figs.push(renderFigure(el, getEx(el.dataset.ex), { animate: false, aspect: 1.15 })));
  };
  s.el.addEventListener('click', (e) => {
    if (filterClick(e, fs)) { draw(); return; }
    if (e.target.closest('[data-act="done"]')) { s.close(); return; }
    const p = e.target.closest('.pick');
    if (p) {
      routine.steps.push({ id: uid(), ex: p.dataset.id });
      save();
      p.classList.add('added');
      setTimeout(() => p.classList.remove('added'), 600);
      toast(`Added ${getEx(p.dataset.id).name}`);
    }
  });
  $('input', s.el).addEventListener('input', (e) => { q = e.target.value; draw(); });
  draw();
}

// ───────────────────────── Filters ─────────────────────────
// "All", the active filters, and a Filters button that opens wrapping chip groups — nothing scrolls sideways.
// state: { open, [group key]: value | 'all' }; groups: [{ key, label, options: [[value, label], ...] }].

const EX_FILTERS = [
  { key: 'type', label: 'Type', options: Object.entries(TYPES).map(([k, t]) => [k, t.plural]) },
  { key: 'area', label: 'Body area', options: Object.entries(AREAS).map(([k, a]) => [k, a.label]) },
];

function filterBar(state, groups) {
  const active = groups.filter((g) => state[g.key] !== 'all');
  const label = (g, v) => g.options.find(([x]) => x === v)?.[1] ?? v;
  return `<div class="fbar">
      <button class="chip ${active.length ? '' : 'on'}" data-fb="all">All</button>
      ${active.map((g) => `<button class="chip on removable" data-fb-clear="${g.key}" aria-label="Remove ${esc(label(g, state[g.key]))} filter">${esc(label(g, state[g.key]))}${icon('close', 'x')}</button>`).join('')}
      <button class="chip more ${state.open ? 'open' : ''}" data-fb="toggle" aria-expanded="${state.open}">${icon('filter', 'inline')} ${state.open ? 'Hide filters' : 'Filters'}</button>
    </div>
    ${state.open ? `<div class="fpanel">${groups.map((g) => `<div class="fgroup"><span class="fgroup-l">${g.label}</span><div class="chips wrap">${[['all', 'Any'], ...g.options].map(([v, l]) => `<button class="chip ${state[g.key] === v ? 'on' : ''}" data-fb-set="${g.key}" data-v="${v}">${esc(l)}</button>`).join('')}</div></div>`).join('')}</div>` : ''}`;
}

// Applies a click inside a filter bar to state. Returns true if it was a filter click.
function filterClick(e, state) {
  const b = e.target.closest('[data-fb],[data-fb-clear],[data-fb-set]');
  if (!b) return false;
  if (b.dataset.fb === 'toggle') state.open = !state.open;
  else if (b.dataset.fb === 'all') { for (const k in state) if (k !== 'open') state[k] = 'all'; }
  else if (b.dataset.fbClear) state[b.dataset.fbClear] = 'all';
  else state[b.dataset.fbSet] = b.dataset.v;
  return true;
}

function filterExercises(list, filter, q, area = 'all') {
  q = q.trim().toLowerCase();
  const inArea = (ex) => area === 'all' || (ex.primary ?? []).some((m) => AREAS[area].muscles.includes(m));
  return list.filter((ex) => (filter === 'all' || ex.type === filter) && inArea(ex) &&
    (!q || ex.name.toLowerCase().includes(q) || [...(ex.primary ?? []), ...(ex.secondary ?? [])].some((m) => (MUSCLES[m] ?? m).toLowerCase().includes(q))));
}

// ───────────────────────── Sharing ─────────────────────────

const b64enc = (str) => btoa(String.fromCharCode(...new TextEncoder().encode(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64dec = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

async function shareRoutine(r) {
  const customIds = new Set(r.steps.map((s) => s.ex).filter((id) => !BUILTIN.has(id)));
  const payload = {
    v: 1,
    r: { name: r.name, rest: r.rest, steps: r.steps.map(({ id, ...s }) => s) },
    x: db.custom.filter((c) => customIds.has(c.id)),
  };
  const url = `${location.origin}${location.pathname}#/import/${b64enc(JSON.stringify(payload))}`;
  try {
    if (navigator.share) { await navigator.share({ title: `Limber: ${r.name}`, text: `Try my "${r.name}" routine in Limber`, url }); return; }
  } catch (err) { if (err?.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch { prompt('Copy this link:', url); }
}

function viewImport(data) {
  let payload;
  try { payload = JSON.parse(b64dec(data)); } catch { payload = null; }
  if (!payload?.r?.steps) {
    app.innerHTML = `<header class="top"><a class="btn-icon" href="#/">${icon('back')}</a></header><div class="empty"><p>This share link is broken or incomplete.</p><a class="btn primary" href="#/">Go to my routines</a></div>`;
    return;
  }
  const custom = (payload.x ?? []).filter((c) => c?.id && c.name);
  const lookup = (id) => getEx(id) ?? (() => { const c = custom.find((x) => x.id === id); return c ? { ...c, anim: (BUILTIN.get(c.like) ?? EXERCISES[0]).anim } : null; })();
  const steps = payload.r.steps.filter((s) => lookup(s.ex));
  app.innerHTML = `
    <header class="top"><a class="btn-icon" href="#/" aria-label="Back">${icon('back')}</a><div class="top-title">Shared routine</div><span></span></header>
    <h1 class="title-static">${esc(payload.r.name)}</h1>
    <p class="muted">${steps.length} exercises</p>
    <ol class="plain-list">${steps.map((s) => `<li><span>${esc(lookup(s.ex).name)}</span></li>`).join('')}</ol>
    <div class="bottom-cta"><button class="btn primary wide big" data-act="save">Save to my routines</button></div>`;
  app.onclick = (e) => {
    if (!e.target.closest('[data-act="save"]')) return;
    for (const c of custom) if (!db.custom.some((x) => x.id === c.id)) db.custom.push(c);
    const r = { id: uid(), name: payload.r.name, rest: payload.r.rest ?? 10, steps: steps.map((s) => ({ ...s, id: uid() })) };
    db.routines.unshift(r);
    save();
    toast('Routine saved');
    location.hash = `#/routine/${r.id}`;
  };
}

// Explore routine preview: what's in it, then add it to My routines or start right away.
function viewExplore(id) {
  const x = EXPLORE.find((r) => r.id === id);
  if (!x) { location.hash = '#/'; return; }
  const figs = [];
  const mine = () => db.routines.find((m) => m.from === x.id);
  const addCopy = () => {
    const r = { id: uid(), from: x.id, name: x.name, rest: x.rest ?? 10, steps: x.steps.map((st) => ({ ...clone(st), id: uid() })) };
    db.routines.unshift(r);
    save();
    return r;
  };
  const steps = x.steps.filter((st) => getEx(st.ex));
  const secs = estimate(x);
  app.innerHTML = `
    <header class="top"><button class="btn-icon" data-act="back" aria-label="Back">${icon('back')}</button><div class="top-title">Explore</div><span></span></header>
    <h1 class="title-static">${esc(x.name)}</h1>
    <p class="x-desc">${esc(x.desc)}</p>
    <div class="x-facts">
      <div><b>~${fmtMin(secs)}</b><span>long</span></div>
      <div><b>${steps.length}</b><span>exercises</span></div>
      <div><b>${x.level}</b><span>level</span></div>
    </div>
    <div class="x-tags"><span class="pill">${esc(x.goal)}</span>${routineGear(x).map((g) => `<span class="pill">${esc(g)}</span>`).join('')}</div>
    <ol class="x-steps">${steps.map((st, i) => {
      const ex = getEx(st.ex);
      return `<li style="--acc:${typeVar(ex.type)}"><a href="#/exercise/${ex.id}">
        <span class="step-num">${i + 1}</span><span class="step-thumb" data-ex="${ex.id}"></span>
        <span class="step-text"><span class="step-name">${esc(ex.name)}</span><span class="step-sum">${stepSummary(st)}</span></span></a></li>`;
    }).join('')}</ol>
    <div class="bottom-cta x-cta">
      ${mine() ? `<button class="btn wide" data-act="open">${icon('check')} In My routines — open</button>` : `<button class="btn wide" data-act="add">${icon('plus')} Add to My routines</button>`}
      <button class="btn primary wide big" data-act="start">${icon('play')} Start now</button>
    </div>`;
  $$('.step-thumb', app).forEach((el) => figs.push(renderFigure(el, getEx(el.dataset.ex), { animate: false, aspect: 1.15, arrows: false })));
  app.onclick = (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    if (t.dataset.act === 'back') { history.length > 1 ? history.back() : (location.hash = '#/'); }
    if (t.dataset.act === 'add') { const r = addCopy(); stats.event('explore-add', x.name); toast(`Added to My routines`); location.hash = `#/routine/${r.id}`; }
    if (t.dataset.act === 'open') location.hash = `#/routine/${mine().id}`;
    if (t.dataset.act === 'start') startRoutine((mine() ?? addCopy()).id);
  };
  return () => figs.forEach((f) => f.stop());
}

// ───────────────────────── Coach ─────────────────────────
// A chat that asks what's going on, how long, what equipment and how fit, then builds a routine
// (coach.js) and suggests Explore routines. The conversation stays put while the app is open.

const coachChat = { msgs: [], prefs: null, ask: null, seed: 1, picked: [], result: null };
const LEVEL_UP = { Beginner: 'Intermediate', Intermediate: 'Advanced', Advanced: 'Advanced' };
const LEVEL_DOWN = { Advanced: 'Intermediate', Intermediate: 'Beginner', Beginner: 'Beginner' };
const coachCtx = () => ({ exercises: allExercises(), estimate, explore: EXPLORE, routineGear, getEx });

function coachSay(html, chips = [], extra = {}) { coachChat.msgs.push({ from: 'coach', html, chips, ...extra }); }
function coachStart() {
  Object.assign(coachChat, { msgs: [], prefs: { topics: [], caution: false }, ask: 'focus', seed: 1, picked: [], result: null });
  coachSay(`Hi! I'm your Limber Coach. Tell me what's bothering you or what you want to work on, and I'll build a routine for you.<br><span class="muted small">For example: "my lower back is stiff from sitting" or "I want stronger legs, I have dumbbells and 30 minutes."</span>`, coachBrain.STARTERS);
}

// Next question still worth asking, or null when there's enough to build.
function coachNext() {
  const p = coachChat.prefs;
  const { style } = coachBrain.plan(p);
  const stretchy = ['relief', 'sleep', 'mobility'].includes(style);
  if (!p.topics.length && !p.caution) return 'focus';
  if (p.time === undefined) return 'time';
  if (p.gear === undefined) { if (stretchy) p.gear = []; else return 'gear'; }
  if (p.level === undefined) { if (stretchy) p.level = 'Beginner'; else return 'level'; }
  return null;
}

function coachAsk() {
  const q = coachNext();
  coachChat.ask = q;
  if (q === 'focus') coachSay("I didn't quite catch what you'd like to work on. Pick one of these, or describe it in your own words.", coachBrain.STARTERS);
  if (q === 'time') coachSay('How much time do you have?', ['5 min', '10 min', '20 min', '30 min', '45 min', '60 min']);
  if (q === 'gear') { coachChat.picked = []; coachSay('What equipment do you have? Tap everything that applies, then Done.', [], { gear: true }); }
  if (q === 'level') coachSay('How would you describe your fitness level?', ['Beginner', 'Intermediate', 'Advanced']);
  if (!q) coachBuild();
}

function coachBuild(intro) {
  const p = coachChat.prefs;
  const r = coachBrain.buildRoutine(p, coachCtx(), coachChat.seed);
  const pl = coachBrain.plan(p);
  const matches = coachBrain.matchExplore(p, coachCtx());
  coachChat.result = { routine: r, saved: null };
  stats.event('coach-built', pl.label);
  const used = routineGear(r).filter((g) => g !== 'No equipment').map((g) => g.toLowerCase());
  const gearTxt = used.length ? `using ${used.length > 1 ? `${used.slice(0, -1).join(', ')} and ${used.at(-1)}` : used[0]}` : 'with no equipment';
  const caution = p.caution ? `<p class="coach-warn">${icon('info', 'inline')} Pain that's sharp, shoots down an arm or leg, or comes with numbness or tingling should be checked by a doctor or physical therapist before you exercise. If you've been cleared, here's a very gentle routine — stop anything that makes it worse.</p>` : '';
  coachSay(`${caution}${intro ?? `Here's a ${Math.round(estimate(r) / 60)}-minute routine ${gearTxt}. I focused on ${pl.why}.`}`, ['Shuffle', 'Shorter', 'Longer', 'Easier', 'Harder', 'Start over'], { result: true, matches: matches.map((m) => m.id) });
}

function coachHear(text) {
  text = text.trim();
  if (!text) return;
  coachChat.msgs.push({ from: 'me', html: esc(text) });
  const p = coachChat.prefs;
  const low = text.toLowerCase();
  if (coachChat.result && ['shuffle', 'shorter', 'longer', 'easier', 'harder', 'start over'].includes(low)) {
    if (low === 'start over') { coachStart(); return; }
    if (low === 'shuffle') coachChat.seed++;
    if (low === 'shorter') p.time = Math.max(5, (p.time ?? 20) - (p.time > 20 ? 10 : 5));
    if (low === 'longer') p.time = Math.min(90, (p.time ?? 20) + (p.time >= 20 ? 10 : 5));
    if (low === 'easier') p.level = LEVEL_DOWN[p.level ?? 'Beginner'];
    if (low === 'harder') p.level = LEVEL_UP[p.level ?? 'Beginner'];
    coachBuild({ shuffle: 'Here\'s a different mix.', shorter: `Trimmed to about ${p.time} minutes.`, longer: `Stretched to about ${p.time} minutes.`, easier: `Made it easier (${p.level.toLowerCase()} level).`, harder: `Made it harder (${p.level.toLowerCase()} level).` }[low]);
    return;
  }
  const u = coachBrain.understand(text);
  if (coachChat.ask === 'level' && !u.level && /^(beginner|intermediate|advanced)$/i.test(low)) u.level = text[0].toUpperCase() + low.slice(1);
  if (u.topics.length) {
    // A new problem after a finished routine starts a fresh request (keeping time, gear and level).
    p.topics = coachChat.result ? u.topics : [...new Set([...p.topics, ...u.topics])];
    if (coachChat.result) p.caution = false;
  }
  if (u.time !== undefined) p.time = u.time;
  if (u.gear !== undefined) p.gear = u.gear;
  if (u.level !== undefined) p.level = u.level;
  p.caution = p.caution || u.caution;
  const changed = u.topics.length || u.time !== undefined || u.gear !== undefined || u.level !== undefined || u.caution;
  if (coachChat.result && changed && !coachNext()) { coachBuild(u.topics.length ? undefined : 'Updated to match.'); return; }
  if (!changed && coachChat.ask && coachChat.ask !== 'focus') {
    coachSay(coachChat.ask === 'time' ? 'Sorry, how many minutes? Tap one below or type something like "15 minutes".'
      : coachChat.ask === 'level' ? 'Tap the level that fits best.' : 'Tap what you have, or "No equipment".',
    coachChat.ask === 'time' ? ['5 min', '10 min', '20 min', '30 min', '45 min', '60 min'] : coachChat.ask === 'level' ? ['Beginner', 'Intermediate', 'Advanced'] : [], { gear: coachChat.ask === 'gear' });
    return;
  }
  coachAsk();
}

function viewCoach() {
  if (!coachChat.msgs.length) coachStart();
  const figs = [];
  const draw = () => {
    figs.splice(0).forEach((f) => f.stop());
    const last = coachChat.msgs.length - 1;
    const resultIdx = coachChat.msgs.map((m) => !!m.result).lastIndexOf(true);
    app.innerHTML = `
      <header class="top"><h1>Coach</h1><button class="btn small" data-act="restart">${icon('edit', 'inline')} New chat</button></header>
      <p class="coach-note muted small">The Coach builds routines from Limber's exercise library using built-in rules. It isn't a medical professional.</p>
      <div class="chat">${coachChat.msgs.map((m, i) => `
        <div class="msg ${m.from}">${m.html}</div>
        ${m.result && i === resultIdx ? coachResultCard() : ''}
        ${m.result && i === resultIdx && m.matches?.length ? `<div class="msg coach">You might also like these ready-made routines:</div><div class="coach-matches">${m.matches.map((id) => { const x = EXPLORE.find((r) => r.id === id); return `<a class="xrow" href="#/explore/${x.id}"><span class="x-text"><b>${esc(x.name)}</b><span class="x-meta">${typeDots(x.steps)}<span>${x.level} · ~${fmtMin(estimate(x))}</span></span></span>${icon('back', 'x-chev')}</a>`; }).join('')}</div>` : ''}
        ${i === last && m.chips?.length ? `<div class="chips quick">${m.chips.map((c) => `<button class="chip" data-say="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}
        ${i === last && m.gear ? `<div class="chips quick">${coachBrain.GEAR_CHOICES.map((g) => `<button class="chip ${coachChat.picked.includes(g) ? 'on' : ''}" data-gear="${g}">${g}</button>`).join('')}<button class="chip" data-say="No equipment">No equipment</button><button class="chip done" data-act="gear-done" ${coachChat.picked.length ? '' : 'disabled'}>Done</button></div>` : ''}
      `).join('')}</div>
      <form class="chat-input" autocomplete="off"><input name="q" placeholder="Describe what you need…" aria-label="Message the Coach" enterkeyhint="send"><button class="btn-icon accent" aria-label="Send">${icon('send')}</button></form>`;
    $$('.chat .step-thumb', app).forEach((el) => figs.push(renderFigure(el, getEx(el.dataset.ex), { animate: false, aspect: 1.15, arrows: false })));
    requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
  };
  const say = (text) => { coachHear(text); draw(); };
  app.onclick = (e) => {
    const t = e.target.closest('[data-say],[data-gear],[data-act]');
    if (!t) return;
    if (t.dataset.say) { say(t.dataset.say); return; }
    if (t.dataset.gear) { const g = t.dataset.gear; coachChat.picked = coachChat.picked.includes(g) ? coachChat.picked.filter((x) => x !== g) : [...coachChat.picked, g]; draw(); return; }
    const res = coachChat.result;
    switch (t.dataset.act) {
      case 'gear-done': say(`I have ${coachChat.picked.map((g) => g.toLowerCase()).join(', ')}`); break;
      case 'restart': coachStart(); draw(); break;
      case 'coach-save': case 'coach-start': {
        if (!res.saved || !getRoutine(res.saved)) {
          const r = { ...clone(res.routine), id: uid(), from: 'coach', steps: res.routine.steps.map((st) => ({ ...st, id: uid() })) };
          db.routines.unshift(r); save(); res.saved = r.id;
          stats.event('coach-saved', coachBrain.plan(coachChat.prefs).label);
        }
        if (t.dataset.act === 'coach-start') startRoutine(res.saved); else { toast('Saved to My routines'); draw(); }
        break;
      }
      case 'coach-open': location.hash = `#/routine/${res.saved}`; break;
    }
  };
  app.onsubmit = (e) => { e.preventDefault(); const q = e.target.elements.q; const v = q.value; q.value = ''; say(v); };
  draw();
  return () => { figs.forEach((f) => f.stop()); app.onsubmit = null; };
}

// The routine the Coach just built: what's in it and Save / Start.
function coachResultCard() {
  const { routine: r, saved } = coachChat.result;
  const steps = r.steps.filter((st) => getEx(st.ex));
  const savedOk = saved && getRoutine(saved);
  return `<div class="coach-card">
    <div class="coach-card-head"><b>${esc(r.name)}</b><span class="x-meta">${typeDots(steps)}<span>~${fmtMin(estimate(r))} · ${steps.length} exercises</span></span></div>
    <ol class="coach-steps">${steps.map((st) => { const ex = getEx(st.ex); return `<li style="--acc:${typeVar(ex.type)}"><span class="step-thumb" data-ex="${ex.id}"></span><span class="step-text"><span class="step-name">${esc(ex.name)}</span><span class="step-sum">${stepSummary(st)}</span></span></li>`; }).join('')}</ol>
    <div class="coach-actions">
      ${savedOk ? `<button class="btn" data-act="coach-open">${icon('check')} Saved — edit</button>` : `<button class="btn" data-act="coach-save">${icon('plus')} Save</button>`}
      <button class="btn primary" data-act="coach-start">${icon('play')} Start</button>
    </div>
  </div>`;
}

// ───────────────────────── Library ─────────────────────────

const libState = { open: false, type: 'all', area: 'all' };
let libQuery = '';

function viewLibrary() {
  const figs = [];
  app.innerHTML = `
    <header class="top"><h1>Exercises</h1><a class="btn-icon accent" href="#/custom/new" aria-label="New custom exercise">${icon('plus')}</a></header>
    <div class="search">${icon('search')}<input type="search" placeholder="Search exercises or muscles" value="${esc(libQuery)}" aria-label="Search"></div>
    <div class="fwrap"></div>
    <p class="lib-count muted small"></p>
    <div class="ex-grid"></div>`;
  const grid = $('.ex-grid', app);
  const draw = () => {
    figs.splice(0).forEach((f) => f.stop());
    $('.fwrap', app).innerHTML = filterBar(libState, EX_FILTERS);
    const items = filterExercises(allExercises(), libState.type, libQuery, libState.area);
    $('.lib-count', app).textContent = `${items.length} exercise${items.length === 1 ? '' : 's'}`;
    grid.innerHTML = items.map((ex) => `<a class="ex-card" href="#/exercise/${ex.id}" style="--acc:${typeVar(ex.type)}">
      <span class="ex-thumb" data-ex="${ex.id}"></span>
      <span class="ex-name">${esc(ex.name)}</span>
      <span class="ex-sub">${esc(muscleNames(ex.primary))}</span>
      ${ex.custom ? '<span class="tag">Custom</span>' : ''}
    </a>`).join('') || '<p class="muted pad">No matches.</p>';
    $$('.ex-thumb', grid).forEach((el) => figs.push(renderFigure(el, getEx(el.dataset.ex), { animate: false, aspect: 1.25 })));
  };
  app.onclick = (e) => { if (filterClick(e, libState)) draw(); };
  $('.search input', app).addEventListener('input', (e) => { libQuery = e.target.value; draw(); });
  draw();
  return () => figs.forEach((f) => f.stop());
}

function viewExercise(id) {
  const ex = getEx(id);
  if (!ex) { location.hash = '#/library'; return; }
  app.innerHTML = `
    <header class="top"><button class="btn-icon" data-act="back" aria-label="Back">${icon('back')}</button><div class="top-title"></div>
      ${ex.custom ? `<a class="btn-icon" href="#/custom/${ex.id}" aria-label="Edit">${icon('edit')}</a>` : '<span></span>'}</header>
    <div class="ex-detail" style="--acc:${typeVar(ex.type)}">
      <div class="ex-hero"></div>
      <div class="ex-title">
        <span class="pill ${ex.type}">${typeLabel(ex.type)}</span>
        <h1>${esc(ex.name)}</h1>
        <p class="muted">${ex.mode === 'time' ? `${fmtTime(ex.duration)}${ex.type === 'stretch' ? ' hold' : ''}` : `${ex.reps} reps`}${ex.sided ? ' · each side' : ''}${ex.equipment ? ` · ${esc(ex.equipment)}` : ''}</p>
      </div>
      <section class="card">
        <h3>Muscles</h3>
        <div class="muscle-row">
          <div class="mm-wrap">${muscleMapSVG(ex.primary, ex.secondary)}</div>
          <div class="muscle-legend">
            <p><span class="sw pri"></span><b>Primary</b><br>${esc(muscleNames(ex.primary)) || '—'}</p>
            ${ex.secondary?.length ? `<p><span class="sw sec"></span><b>Also works</b><br>${esc(muscleNames(ex.secondary))}</p>` : ''}
          </div>
        </div>
      </section>
      ${liftHistoryCard(ex)}
      <section class="card">
        <h3>How to do it</h3>
        <ol class="cues">${(ex.cues ?? []).map((c) => `<li>${esc(c)}</li>`).join('') || '<li>No instructions yet.</li>'}</ol>
      </section>
      <button class="btn primary wide" data-act="addto">${icon('plus')} Add to a routine</button>
    </div>`;
  const fig = renderFigure($('.ex-hero', app), ex, { aspect: 1.5 });
  app.onclick = (e) => {
    const pt = e.target.closest('[data-pt]');
    if (pt) {
      // Tap a point on the trend chart to read it.
      $$('.lc-dot', app).forEach((d) => d.classList.toggle('on', d.dataset.i === pt.dataset.pt));
      $('.lc-read', app).textContent = pt.dataset.label;
      return;
    }
    const t = e.target.closest('[data-act]');
    if (!t) return;
    if (t.dataset.act === 'back') { history.length > 1 ? history.back() : (location.hash = '#/library'); }
    if (t.dataset.act === 'addto') {
      if (!db.routines.length) { const r = { id: uid(), name: 'My Routine', rest: 10, steps: [] }; db.routines.push(r); }
      menu(db.routines.map((r) => ({ icon: 'list', label: r.name, run: () => { r.steps.push({ id: uid(), ex: ex.id }); save(); toast(`Added to ${r.name}`); } })));
    }
  };
  return () => fig.stop();
}

// "Your history" card on an exercise page: best / last / sessions, a trend chart, and the sessions as a list.
function liftHistoryCard(ex) {
  const log = liftLog(ex.id);
  if (!log.length) {
    return ex.type === 'weights' || ex.type === 'bands'
      ? '<section class="card"><h3>Your history</h3><p class="muted small">Finish a workout with this exercise and your weights and reps will show up here.</p></section>' : '';
  }
  const isBand = !!log[0].b;
  const tops = log.map(topSet);
  const best = tops.reduce((a, s) => (s[0] > a[0] ? s : a));
  const recent = log.slice(0, 12).reverse();
  const vals = recent.map((l) => topSet(l)[0]);
  // Trend chart: one series, so no legend; the title names it.
  const W = 320, H = 120, padL = 34, padR = 10, padT = 12, padB = 22;
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const X = (i) => padL + (vals.length > 1 ? (i / (vals.length - 1)) * (W - padL - padR) : (W - padL - padR) / 2);
  const Y = (v) => padT + (max === min ? 0.5 : 1 - (v - min) / span) * (H - padT - padB);
  const yl = (v) => (isBand ? BAND_LEVELS[v] : +v.toFixed(1));
  const label = (l) => `${shortDate(l.date)} · ${liftText(l)}`;
  const chart = `<div class="lift-chart"><p class="lc-read muted small">${esc(label(recent[recent.length - 1]))}</p>
    <svg viewBox="0 0 ${W} ${H}" class="lc" role="img" aria-label="Top set per workout">
      <line class="lc-grid" x1="${padL}" x2="${W - padR}" y1="${Y(max)}" y2="${Y(max)}"/><line class="lc-grid" x1="${padL}" x2="${W - padR}" y1="${Y(min)}" y2="${Y(min)}"/>
      <text class="lc-ax" x="${padL - 6}" y="${Y(max) + 4}" text-anchor="end">${yl(max)}</text>${max !== min ? `<text class="lc-ax" x="${padL - 6}" y="${Y(min) + 4}" text-anchor="end">${yl(min)}</text>` : ''}
      <text class="lc-ax" x="${padL}" y="${H - 4}">${shortDate(recent[0].date)}</text><text class="lc-ax" x="${W - padR}" y="${H - 4}" text-anchor="end">${shortDate(recent[recent.length - 1].date)}</text>
      ${vals.length > 1 ? `<path class="lc-line" d="M${vals.map((v, i) => `${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('L')}"/>` : ''}
      ${vals.map((v, i) => `<circle class="lc-dot ${i === vals.length - 1 ? 'on' : ''}" data-i="${i}" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="4"/>`).join('')}
      ${vals.map((v, i) => `<circle class="lc-hit" data-pt="${i}" data-label="${esc(label(recent[i]))}" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="14"/>`).join('')}
    </svg></div>`;
  return `<section class="card lift-card">
    <h3>Your history</h3>
    <div class="lift-stats">
      <div><b>${fmtLoad(log[0], best[0])}</b><span>best</span></div>
      <div><b>${liftText(log[0])}</b><span>last time</span></div>
      <div><b>${log.length}</b><span>workout${log.length === 1 ? '' : 's'}</span></div>
    </div>
    ${chart}
    <ul class="lift-list">${log.slice(0, 10).map((l) => `<li><span>${shortDate(l.date)}</span><span>${esc(setsText(l))}${isBand ? '' : ` ${db.settings.units}`}</span></li>`).join('')}</ul>
  </section>`;
}

function viewCustomEditor(id) {
  const isNew = id === 'new';
  const c = isNew
    ? { id: 'c-' + uid().slice(0, 8), name: '', type: 'stretch', mode: 'time', duration: 30, reps: 10, sided: false, primary: [], secondary: [], cues: [], like: 'forward-fold' }
    : clone(db.custom.find((x) => x.id === id) ?? {});
  if (!c.id) { location.hash = '#/library'; return; }
  let fig;
  const muscleChips = (field) => Object.entries(MUSCLES).map(([k, v]) => `<button type="button" class="chip ${c[field].includes(k) ? 'on' : ''}" data-m="${k}" data-field="${field}">${v}</button>`).join('');
  app.innerHTML = `
    <header class="top"><a class="btn-icon" href="#/library" aria-label="Cancel">${icon('back')}</a><div class="top-title">${isNew ? 'New exercise' : 'Edit exercise'}</div><span></span></header>
    <form class="form" autocomplete="off">
      <label>Name<input name="name" required maxlength="50" value="${esc(c.name)}" placeholder="e.g. Doorway Pec Stretch"></label>
      <div class="seg" data-group="type">${Object.entries(TYPES).map(([k, t]) => `<button type="button" data-v="${k}" class="${c.type === k ? 'on' : ''}">${t.label}</button>`).join('')}</div>
      <div class="seg" data-group="mode"><button type="button" data-v="time" class="${c.mode === 'time' ? 'on' : ''}">Timed</button><button type="button" data-v="reps" class="${c.mode === 'reps' ? 'on' : ''}">Reps</button></div>
      <div class="row2">
        <label>Default seconds<input name="duration" type="number" inputmode="numeric" min="5" max="600" value="${c.duration}"></label>
        <label>Default reps<input name="reps" type="number" inputmode="numeric" min="1" max="200" value="${c.reps}"></label>
      </div>
      <label class="switch-row"><span>Done on each side</span><button type="button" class="toggle ${c.sided ? 'on' : ''}" data-toggle="sided" role="switch" aria-checked="${c.sided}"><span></span></button></label>
      <fieldset><legend>Primary muscles</legend><div class="chips wrap">${muscleChips('primary')}</div></fieldset>
      <fieldset><legend>Also works</legend><div class="chips wrap">${muscleChips('secondary')}</div></fieldset>
      <label>Technique cues <span class="muted">(one per line)</span><textarea name="cues" rows="4" placeholder="Keep your back flat&#10;Breathe slowly">${esc(c.cues.join('\n'))}</textarea></label>
      <label>Animation — looks most like
        <select name="like">${EXERCISES.map((e) => `<option value="${e.id}" ${e.id === c.like ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select>
      </label>
      <div class="like-preview"></div>
      <button class="btn primary wide big" type="submit">Save exercise</button>
      ${isNew ? '' : '<button class="btn ghost wide danger" type="button" data-act="delete">Delete exercise</button>'}
    </form>`;
  const form = $('form', app);
  const preview = () => { fig?.stop(); fig = renderFigure($('.like-preview', app), { ...BUILTIN.get(c.like), primary: c.primary }, { aspect: 1.8 }); };
  form.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const seg = b.closest('.seg');
    if (seg) { c[seg.dataset.group] = b.dataset.v; $$('button', seg).forEach((x) => x.classList.toggle('on', x === b)); return; }
    if (b.dataset.m) {
      const arr = c[b.dataset.field];
      const i = arr.indexOf(b.dataset.m);
      i >= 0 ? arr.splice(i, 1) : arr.push(b.dataset.m);
      b.classList.toggle('on', i < 0);
      if (b.dataset.field === 'primary') preview();
      return;
    }
    if (b.dataset.toggle) { c.sided = !c.sided; b.classList.toggle('on', c.sided); b.setAttribute('aria-checked', c.sided); return; }
    if (b.dataset.act === 'delete') {
      const used = db.routines.some((r) => r.steps.some((s) => s.ex === c.id));
      if (!confirm(used ? 'This exercise is used in a routine. Delete it and remove it from those routines?' : `Delete "${c.name}"?`)) return;
      db.routines.forEach((r) => { r.steps = r.steps.filter((s) => s.ex !== c.id); });
      db.custom = db.custom.filter((x) => x.id !== c.id);
      save();
      location.hash = '#/library';
    }
  };
  const F = form.elements;
  F.like.onchange = () => { c.like = F.like.value; preview(); };
  form.onsubmit = (e) => {
    e.preventDefault();
    c.name = F.name.value.trim();
    if (!c.name) { F.name.focus(); return; }
    c.duration = Math.min(600, Math.max(5, Math.round(+F.duration.value) || 30));
    c.reps = Math.min(200, Math.max(1, Math.round(+F.reps.value) || 10));
    c.cues = F.cues.value.split('\n').map((x) => x.trim()).filter(Boolean);
    c.like = F.like.value;
    const i = db.custom.findIndex((x) => x.id === c.id);
    i >= 0 ? (db.custom[i] = c) : db.custom.push(c);
    save();
    toast('Exercise saved');
    location.hash = `#/exercise/${c.id}`;
  };
  preview();
  return () => fig?.stop();
}

// ───────────────────────── History ─────────────────────────

function viewHistory() {
  const H = db.history;
  const dayKey = (d) => new Date(d).toDateString();
  const days = new Set(H.map((h) => dayKey(h.date)));
  let streak = 0;
  for (let d = new Date(); ; d.setDate(d.getDate() - 1)) {
    if (days.has(d.toDateString())) streak++;
    else if (streak > 0 || d.toDateString() !== new Date().toDateString()) break;
  }
  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = H.filter((h) => new Date(h.date) > weekAgo);
  const weekMin = Math.round(thisWeek.reduce((a, h) => a + h.seconds, 0) / 60);
  // Last 4 weeks calendar strip.
  const cells = [];
  const start = new Date(); start.setDate(start.getDate() - 27);
  for (let i = 0; i < 28; i++) { const d = new Date(start); d.setDate(start.getDate() + i); cells.push(d); }
  app.innerHTML = `
    <header class="top"><h1>History</h1></header>
    <div class="stats">
      <div class="stat"><b>${streak}</b><span>day streak</span></div>
      <div class="stat"><b>${thisWeek.length}</b><span>this week</span></div>
      <div class="stat"><b>${weekMin}</b><span>min this week</span></div>
    </div>
    <div class="cal" aria-label="Last 4 weeks">${cells.map((d) => `<span class="${days.has(d.toDateString()) ? 'on' : ''} ${d.toDateString() === new Date().toDateString() ? 'today' : ''}" title="${d.toLocaleDateString()}"></span>`).join('')}</div>
    <div class="seg hist-tabs" role="tablist">${[['workouts', 'Workouts'], ['lifts', 'Lifts']].map(([k, l]) => `<button role="tab" data-tab="${k}" class="${histTab === k ? 'on' : ''}" aria-selected="${histTab === k}">${l}</button>`).join('')}</div>
    ${histTab === 'lifts' ? liftsList() : `<ul class="hist">${H.slice(0, 100).map((h) => `<li><div><b>${esc(h.name)}</b><span class="muted">${new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${new Date(h.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>${h.lifts?.length ? `<span class="hist-lifts">${esc(h.lifts.map((l) => `${getEx(l.ex)?.name ?? 'Exercise'} ${liftText(l)}`).join(' · '))}</span>` : ''}</div><span class="hist-time">${fmtTime(h.seconds)}${h.partial ? '<small>partial</small>' : ''}</span></li>`).join('') || '<li class="muted">Finish a routine and it will show up here.</li>'}</ul>`}`;
  app.onclick = (e) => {
    const t = e.target.closest('[data-tab]');
    if (t) { histTab = t.dataset.tab; viewHistory(); }
  };
}

let histTab = 'workouts';

// Every exercise you've logged a load for: last top set, trend, best. Most recently done first.
function liftsList() {
  const ids = [...new Set(db.history.flatMap((h) => (h.lifts ?? []).map((l) => l.ex)))].filter(getEx);
  if (!ids.length) return '<p class="muted pad center">Finish a workout with free weights or bands and your lifts will show up here.</p>';
  return `<ul class="lifts">${ids.map((id) => {
    const log = liftLog(id), ex = getEx(id);
    const best = log.map(topSet).reduce((a, s) => (s[0] > a[0] ? s : a));
    return `<li><a href="#/exercise/${id}" style="--acc:${typeVar(ex.type)}">
      <span class="lift-main"><b>${esc(ex.name)}</b><span class="muted">${liftText(log[0])} · ${shortDate(log[0].date)}</span></span>
      ${sparkline(log.slice(0, 10).reverse().map((l) => topSet(l)[0]))}
      <span class="lift-best"><b>${fmtLoad(log[0], best[0])}</b><small>best</small></span>
    </a></li>`;
  }).join('')}</ul>`;
}

// ───────────────────────── Reminders ─────────────────────────
// A static web app can't schedule notifications on iPhone, so reminders go into the phone's calendar
// as a weekly repeating event with an alert, which works even when Limber is closed.

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function reminderIcs({ days, time }) {
  const [hh, mm] = time.split(':').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  while (!days.includes(d.getDay()) || d < new Date()) d.setDate(d.getDate() + 1); // first upcoming workout day
  const local = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hh)}${pad(mm)}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const url = `${location.origin}${location.pathname}`;
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Limber//Workout reminder//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:limber-${Date.now()}@limber`, `DTSTAMP:${stamp}`, `DTSTART:${local}`, 'DURATION:PT20M',
    `RRULE:FREQ=WEEKLY;BYDAY=${days.map((i) => ICS_DAYS[i]).join(',')}`,
    'SUMMARY:Limber workout', `DESCRIPTION:Time to move! Open Limber: ${url}`, `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Time for your Limber workout', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

function addReminderToCalendar(reminder) {
  if (!reminder.days.length) return;
  const ics = reminderIcs(reminder);
  // iPhone/iPad open a calendar file straight into the "Add to Calendar" screen; elsewhere download it.
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) { location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`; return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'limber-workout-reminder.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Open the downloaded file to add it to your calendar');
}

// ───────────────────────── Settings ─────────────────────────

let settingsFig = null;

function viewSettings() {
  const S = db.settings;
  const tog = (k, label, sub) => `<label class="switch-row"><span>${label}${sub ? `<small>${sub}</small>` : ''}</span><button class="toggle ${S[k] ? 'on' : ''}" data-tog="${k}" role="switch" aria-checked="${!!S[k]}"><span></span></button></label>`;
  app.innerHTML = `
    <header class="top"><h1>Settings</h1></header>
    <section class="card settings feedback-card">
      <h3>Feedback</h3>
      <p class="muted small">Found a problem or have an idea? Tell me. I read every one.</p>
      <button class="btn primary wide" data-act="feedback">${icon('flag', 'inline')} Send feedback</button>
    </section>
    <section class="card settings">
      <h3>Appearance</h3>
      <div class="seg theme-seg" role="radiogroup" aria-label="Appearance">${[['auto', 'Auto', 'auto'], ['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']].map(([k, l, ic]) => `<button role="radio" aria-checked="${S.theme === k}" data-theme-pick="${k}" class="${S.theme === k ? 'on' : ''}">${icon(ic, 'inline')} ${l}</button>`).join('')}</div>
      <p class="muted small theme-note">Auto matches your phone. To switch at sunset, set iPhone Settings → Display &amp; Brightness → Automatic.</p>
    </section>
    <section class="card settings">
      <h3>Your coach</h3>
      <div class="coach-row">
        <div class="coach-preview"></div>
        <div class="coach-pick">
          <div class="seg">${Object.entries(COACHES).map(([k, c]) => `<button data-coach="${k}" class="${S.coach === k ? 'on' : ''}">${c.label}</button>`).join('')}</div>
          <div class="swatches" role="group" aria-label="Skin tone">${SKINS.map((c, i) => `<button class="swatch ${S.skin === i ? 'on' : ''}" data-skin="${i}" style="background:${c}" aria-label="Skin tone ${i + 1}"></button>`).join('')}</div>
        </div>
      </div>
    </section>
    <section class="card settings">
      <h3>During a routine</h3>
      ${tog('voice', 'Voice guidance', 'Announces each exercise and side')}
      ${tog('beeps', 'Countdown beeps', '3-2-1 before each change')}
      <label class="switch-row"><span>Get ready time</span>${stepper('prep', S.prep, 5, 0, 60, 's')}</label>
      <label class="switch-row"><span>Switch sides pause</span>${stepper('switchTime', S.switchTime, 1, 0, 30, 's')}</label>
      <div class="switch-row"><span>Weight units</span><div class="seg units">${['lb', 'kg'].map((u) => `<button data-units="${u}" class="${S.units === u ? 'on' : ''}">${u}</button>`).join('')}</div></div>
      <button class="btn ghost wide" data-act="test">Test sound</button>
    </section>
    <section class="card settings">
      <h3>Workout reminders</h3>
      <p class="muted small">Pick your workout days and a time. Limber adds a repeating event with an alert to your phone's calendar, so you get reminded even when the app is closed.</p>
      <div class="days" role="group" aria-label="Workout days">${DAY_NAMES.map((d, i) => `<button class="day ${S.reminder.days.includes(i) ? 'on' : ''}" data-day="${i}" aria-pressed="${S.reminder.days.includes(i)}" aria-label="${d}">${d[0]}</button>`).join('')}</div>
      <label class="switch-row"><span>Time</span><input class="time-input" type="time" value="${S.reminder.time}" data-rem="time"></label>
      <button class="btn primary wide" data-act="calendar" ${S.reminder.days.length ? '' : 'disabled'}>${icon('clock')} Add to Calendar</button>
    </section>
    <section class="card settings">
      <h3>Your data</h3>
      <p class="muted">Routines and history are saved on this phone. Make a backup before switching phones.</p>
      ${tog('stats', 'Share anonymous usage stats', 'Counts which screens are opened and workouts started — never your routines, history, or anything personal.')}
      <button class="btn ghost wide" data-act="export">Export backup</button>
      <label class="btn ghost wide file-btn">Import backup<input type="file" accept="application/json,.json" hidden></label>
      <button class="btn ghost wide" data-act="starters">Add starter routines</button>
    </section>
    <p class="muted center small">Limber · stretching, calisthenics, weights &amp; bands<br>Listen to your body — stop if anything hurts.</p>`;
  settingsFig?.stop();
  settingsFig = renderFigure($('.coach-preview', app), BUILTIN.get('side-bend'), { aspect: 0.9 });
  app.onclick = (e) => {
    const t = e.target.closest('[data-tog],[data-act],[data-coach],[data-skin],[data-units],[data-day],[data-theme-pick]');
    if (!t) return;
    if (t.dataset.themePick) { S.theme = t.dataset.themePick; applyTheme(S.theme); save(); viewSettings(); return; }
    if (t.dataset.day) {
      const d = +t.dataset.day, days = S.reminder.days;
      S.reminder = { ...S.reminder, days: days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort() };
      save(); viewSettings();
      return;
    }
    if (t.dataset.act === 'calendar') { addReminderToCalendar(S.reminder); stats.event('reminder-added', `${S.reminder.days.length} days a week`); return; }
    if (t.dataset.units && t.dataset.units !== S.units) {
      // Convert weights already set on routine steps so they mean the same load.
      const f = t.dataset.units === 'kg' ? 1 / LB_PER_KG : LB_PER_KG;
      db.routines.forEach((r) => r.steps.forEach((st) => { if (st.weight != null) st.weight = roundWeight(st.weight * f); }));
      S.units = t.dataset.units; save(); viewSettings();
      return;
    }
    if (t.dataset.coach || t.dataset.skin) {
      if (t.dataset.coach) S.coach = t.dataset.coach;
      if (t.dataset.skin) S.skin = +t.dataset.skin;
      setLook(S.coach, S.skin); save(); viewSettings();
      return;
    }
    if (t.dataset.tog) { S[t.dataset.tog] = !S[t.dataset.tog]; save(); viewSettings(); return; }
    if (t.dataset.act === 'step') {
      const f = t.dataset.f;
      S[f] = Math.min(+t.dataset.max, Math.max(+t.dataset.min, S[f] + +t.dataset.inc));
      save(); viewSettings();
    }
    if (t.dataset.act === 'feedback') { openFeedback(); return; }
    if (t.dataset.act === 'test') { audio.unlock(); audio.beep(660); setTimeout(() => audio.beep(990, 0.25), 300); if (S.voice) setTimeout(() => audio.speak('Voice guidance is on.'), 700); }
    if (t.dataset.act === 'export') {
      const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `limber-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    if (t.dataset.act === 'starters') { db.routines.push(...seedRoutines()); save(); toast('Starter routines added'); }
  };
  app.onchange = async (e) => {
    const t = e.target;
    if (t.dataset.num) { S[t.dataset.num] = Math.min(+t.max, Math.max(+t.min, Math.round(+t.value) || 0)); save(); viewSettings(); }
    if (t.dataset.rem === 'time' && t.value) { S.reminder = { ...S.reminder, time: t.value }; save(); }
    if (t.type === 'file' && t.files[0]) {
      try {
        const data = JSON.parse(await t.files[0].text());
        if (!Array.isArray(data.routines)) throw new Error('bad');
        if (!confirm('Replace everything on this phone with this backup?')) return;
        db = data; normalize(); save();
        toast('Backup restored');
        viewSettings();
      } catch { toast('That file is not a Limber backup'); }
    }
  };
  return () => settingsFig?.stop();
}

// ───────────────────────── Player ─────────────────────────

const RING_C = 2 * Math.PI * 54;

function viewPlayer(id) {
  const r = getRoutine(id);
  if (!r) { location.hash = '#/'; return; }
  const phases = buildPhases(r);
  if (!phases.length) { location.hash = `#/routine/${id}`; return; }
  const S = db.settings;
  const workTotal = phases.filter((p) => p.kind === 'work').length;

  let idx = 0, acc = 0, runningSince = null, extra = 0, lastWhole = null, done = false;
  let sessionAcc = 0, sessionSince = null;
  let fig = null, figEx = null, figBand = null, cueTimer = null, cueI = 0, showMap = false, pendingIntro = !audio.unlocked;

  app.innerHTML = `
    <div class="player">
      <div class="pl-top">
        <button class="btn-icon" data-act="exit" aria-label="End workout">${icon('close')}</button>
        <div class="pl-progress"><div class="pl-bar"><span></span></div><div class="pl-count"></div></div>
        <button class="btn-icon" data-act="map" aria-label="Show muscles">${icon('body')}</button>
      </div>
      <div class="pl-head">
        <div class="pl-kicker"></div>
        <h1 class="pl-name"></h1>
        <div class="pl-chips"></div>
      </div>
      <div class="pl-stage">
        <div class="pl-fig"></div>
        <div class="pl-map" hidden></div>
        <div class="pl-mini"></div>
      </div>
      <button class="pl-cue" data-act="cues"></button>
      <div class="pl-timer-row">
        <button class="pl-less" data-act="less" aria-label="Take 15 seconds off">−15s</button>
        <div class="pl-timer">
          <svg viewBox="0 0 120 120" class="ring"><circle cx="60" cy="60" r="54" class="ring-bg"/><circle cx="60" cy="60" r="54" class="ring-fg" stroke-dasharray="${RING_C}" stroke-dashoffset="0"/></svg>
          <div class="pl-time"><b></b><small></small></div>
        </div>
        <button class="pl-extra" data-act="extra" aria-label="Add time">+10s</button>
      </div>
      <div class="pl-controls">
        <button class="btn-icon lg" data-act="prev" aria-label="Previous">${icon('prev')}</button>
        <button class="pl-main" data-act="main" aria-label="Pause"></button>
        <button class="btn-icon lg" data-act="next" aria-label="Skip">${icon('next')}</button>
      </div>
    </div>`;

  const el = {
    root: $('.player', app), bar: $('.pl-bar span', app), count: $('.pl-count', app),
    kicker: $('.pl-kicker', app), name: $('.pl-name', app), chips: $('.pl-chips', app),
    fig: $('.pl-fig', app), map: $('.pl-map', app), mini: $('.pl-mini', app), cue: $('.pl-cue', app),
    ring: $('.ring-fg', app), timeB: $('.pl-time b', app), timeS: $('.pl-time small', app),
    main: $('.pl-main', app), extra: $('.pl-extra', app), less: $('.pl-less', app), timer: $('.pl-timer', app),
  };

  const now = () => Date.now();
  const elapsed = () => acc + (runningSince ? now() - runningSince : 0);
  const sessionElapsed = () => sessionAcc + (sessionSince ? now() - sessionSince : 0);
  const paused = () => runningSince === null;
  const phase = () => phases[idx];

  const say = (text) => { if (S.voice) audio.speak(text); };
  const beep = (f, d) => { if (S.beeps) audio.beep(f, d); };

  function describe(p) {
    const side = p.side ? `, ${p.side.toLowerCase()} side` : '';
    const amount = p.mode === 'time' ? `${p.dur} seconds` : `${p.reps} reps`;
    const load = p.weight ? ` ${+p.weight.toFixed(1)} ${S.units === 'kg' ? 'kilos' : 'pounds'}.` : p.band !== null && p.band !== undefined ? ` ${BAND_SPOKEN[p.band]} band.` : '';
    return `${p.ex.name}${side}. ${amount}.${load}`;
  }

  function setFigure(ex, dim, band = null) {
    if (figEx !== ex || figBand !== band) {
      fig?.stop();
      fig = renderFigure(el.fig, ex, { aspect: 1.25, band });
      figBand = band;
      el.map.innerHTML = muscleMapSVG(ex.primary, ex.secondary);
      el.mini.innerHTML = muscleMapSVG(ex.primary, ex.secondary, { labels: false });
      figEx = ex;
    }
    el.root.style.setProperty('--acc', typeVar(ex.type));
    el.fig.classList.toggle('dim', !!dim);
    paused() ? fig.pause() : fig.resume();
  }

  function rotateCues(ex) {
    clearInterval(cueTimer);
    const cues = ex.cues ?? [];
    cueI = 0;
    const show = () => {
      el.cue.classList.remove('in');
      requestAnimationFrame(() => {
        el.cue.innerHTML = cues.length ? `${icon('info', 'inline')} ${esc(cues[cueI % cues.length])}` : '';
        el.cue.classList.add('in');
      });
    };
    show();
    if (cues.length > 1) cueTimer = setInterval(() => { if (!paused()) { cueI++; show(); } }, 6000);
  }

  function enter(i, { silent = false, carry = 0 } = {}) {
    idx = i;
    acc = carry;
    extra = 0;
    lastWhole = null;
    if (!paused()) runningSince = now();
    if (idx >= phases.length) return finish();
    const p = phase();
    const workIdx = phases.slice(0, idx + 1).filter((q) => q.kind === 'work').length;
    el.count.textContent = `${Math.min(workIdx + (p.kind === 'work' ? 0 : 1), workTotal)} of ${workTotal}`;
    el.root.dataset.kind = p.kind;
    el.root.dataset.mode = p.kind === 'work' ? p.mode : 'time';

    if (p.kind === 'work') {
      el.kicker.textContent = typeLabel(p.ex.type);
      el.name.textContent = p.ex.name;
      workChips(p);
      setFigure(p.ex, false, p.band);
      rotateCues(p.ex);
      if (!silent) { beep(1046, 0.22); say(describe(p)); }
    } else {
      const n = p.next;
      el.kicker.textContent = p.kind === 'prep' ? 'Get ready' : p.kind === 'switch' ? 'Switch sides' : 'Rest';
      el.name.textContent = p.kind === 'switch' ? `${p.side} side next` : n ? `Next: ${n.ex.name}` : 'Almost done';
      el.chips.innerHTML = (n ? `<span class="chip">${n.mode === 'time' ? fmtTime(n.dur) : `${n.reps} reps`}${n.weight ? ` · ${fmtWeight(n.weight)}` : ''}${n.band !== null ? ` · ${fmtBand(n.band)}` : ''}${n.side ? ` · ${n.side}` : ''}</span>` : '')
        + `<button class="chip skip" data-act="next">${p.kind === 'rest' ? 'Skip rest' : 'Skip'} ›</button>`;
      if (n) { setFigure(n.ex, true, n.band); rotateCues(n.ex); }
      if (!silent) {
        if (p.kind === 'prep') say(`Get ready. First up: ${n ? describe(n) : ''}`);
        else if (p.kind === 'switch') say(`Switch to the ${p.side.toLowerCase()} side.`);
        else say(n ? `Rest. Next up: ${n.ex.name}${n.side ? `, ${n.side.toLowerCase()} side` : ''}.` : 'Rest.');
      }
    }
    // Timed work can be extended by 10s; rests, prep and side switches get −15s / +15s.
    const resting = p.kind !== 'work';
    el.extra.hidden = !p.dur;
    el.extra.textContent = resting ? '+15s' : '+10s';
    el.less.hidden = !resting;
    tick();
  }

  // Chips for a work phase: side, set, the load (tap to change it) and what you lifted last time.
  function workChips(p) {
    const last = p.weight !== null || p.band !== null ? liftLog(p.ex.id)[0] : null;
    el.chips.innerHTML = [
      p.side && `<span class="chip on">${p.side} side</span>`,
      p.sets > 1 && `<span class="chip">Set ${p.set} of ${p.sets}</span>`,
      p.weight !== null && `<button class="chip load" data-act="load">${fmtWeight(p.weight)} ${icon('edit', 'inline')}</button>`,
      p.band !== null && `<button class="chip load" data-act="load">${bandDot(p.band)}${fmtBand(p.band)} ${icon('edit', 'inline')}</button>`,
      last && `<span class="chip ghost">Last: ${liftText(last)}</span>`,
    ].filter(Boolean).join('');
  }

  // Completed work phases, for the lift log. Skipping counts once at least half the set is done.
  function next(opts = {}) {
    const p = phase();
    if (p?.kind === 'work' && !p.logged && (opts.done || elapsed() >= (p.dur ? p.dur * 500 : 4000))) p.logged = true;
    enter(idx + 1, opts);
  }

  function lifts() {
    const out = [];
    phases.forEach((p) => {
      if (!p.logged || (p.weight === null && p.band === null)) return;
      let l = out.find((x) => x.step === p.step);
      if (!l) out.push(l = { step: p.step, ex: p.ex.id, mode: p.mode, u: S.units, ...(p.band !== null ? { b: true } : {}), sets: [] });
      l.sets.push([p.band ?? p.weight, p.mode === 'time' ? p.dur : p.reps]);
    });
    return out.map(({ step, ...l }) => l);
  }

  // Change the load for this exercise mid-workout; it sticks to the routine for next time.
  function editLoad(p) {
    const step = r.steps.find((st) => st.id === p.sid);
    if (!step) return;
    const wasPaused = paused();
    pause();
    const isBand = p.band !== null;
    const body = () => (isBand
      ? `<div class="load-pick">${BAND_LEVELS.map((l, i) => `<button class="chip ${i === p.band ? 'on' : ''}" data-band="${i}">${bandDot(i)}${l}</button>`).join('')}</div>`
      : `<div class="load-row">${stepper('weight', p.weight, weightInc(), 0, S.units === 'kg' ? 500 : 1000, S.units)}</div>`);
    const s = sheet(`<div class="sheet-head"><h3>${esc(p.ex.name)}</h3><button class="btn small primary" data-act="ok">Done</button></div><p class="muted small">Changes this exercise in “${esc(r.name)}” too.</p><div class="load-body">${body()}</div>`,
      { onClose: () => { save(); workChips(phase()); if (!wasPaused) resume(); } });
    const set = (v) => {
      phases.forEach((q) => { if (q.sid === p.sid) q[isBand ? 'band' : 'weight'] = v; });
      step[isBand ? 'band' : 'weight'] = v;
      $('.load-body', s.el).innerHTML = body();
      if (isBand) setFigure(p.ex, false, v);
    };
    s.el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.act === 'ok') s.close();
      else if (b.dataset.band) set(+b.dataset.band);
      else if (b.dataset.act === 'step') set(roundWeight(Math.min(+b.dataset.max, Math.max(+b.dataset.min, p.weight + +b.dataset.inc))));
    });
    s.el.addEventListener('change', (e) => { if (e.target.dataset.num === 'weight') set(roundWeight(Math.max(0, +e.target.value || 0))); });
  }

  function finish() {
    done = true;
    stopTimers();
    const secs = Math.round(sessionElapsed() / 1000);
    const lf = lifts();
    db.history.unshift({ id: uid(), routineId: r.id, name: r.name, date: new Date().toISOString(), seconds: secs, ...(lf.length ? { lifts: lf } : {}) });
    stats.event('workout-finish', r.from ? EXPLORE.find((x) => x.id === r.from)?.name ?? 'Custom' : 'Custom');
    db.history = db.history.slice(0, 1000);
    save();
    say('Workout complete. Great job!');
    beep(784, 0.15); setTimeout(() => beep(1046, 0.3), 180);
    wakeLock.off();
    fig?.stop();
    app.innerHTML = `
      <div class="finish">
        <div class="finish-badge">${icon('check')}</div>
        <h1>Nice work!</h1>
        <p class="muted">${esc(r.name)}</p>
        <div class="stats">
          <div class="stat"><b>${fmtTime(secs)}</b><span>total time</span></div>
          <div class="stat"><b>${r.steps.filter((st) => getEx(st.ex)).length}</b><span>exercises</span></div>
        </div>
        <a class="btn primary wide big" href="#/">Done</a>
        <a class="btn ghost wide" href="#/history">See history</a>
      </div>`;
  }

  function tick() {
    if (done) return;
    const p = phase();
    if (!p) return;
    const e = elapsed();
    if (p.dur) {
      const total = p.dur * 1000 + extra;
      const remain = total - e;
      if (remain <= 0) {
        // Catch up if the phone slept through one or more phases.
        const late = -remain;
        next({ silent: late > 1500, carry: late > 1500 ? late : 0, done: true });
        return;
      }
      const whole = Math.ceil(remain / 1000);
      if (lastWhole !== null && whole !== lastWhole && whole <= 3 && whole >= 1) beep(660, 0.1);
      if (p.kind === 'work' && lastWhole !== null && whole !== lastWhole && whole === Math.round(p.dur / 2)) {
        if (p.ex.halfway && p.dur >= 10) say(p.ex.halfway);
        else if (p.dur >= 40) say('Halfway.');
      }
      lastWhole = whole;
      el.ring.style.strokeDashoffset = String(RING_C * (1 - remain / total));
      el.timeB.textContent = fmtClock(remain / 1000);
      el.timeS.textContent = p.kind === 'work' ? (p.side ? `${p.side} side` : 'remaining') : p.kind === 'prep' ? 'starting in' : p.kind === 'switch' ? 'switch' : 'rest';
    } else {
      el.ring.style.strokeDashoffset = '0';
      el.timeB.textContent = `${p.reps}`;
      el.timeS.textContent = `reps · ${fmtClock(e / 1000)}`;
    }
    const doneWork = phases.slice(0, idx).filter((q) => q.kind === 'work').length;
    el.bar.style.width = `${(doneWork / workTotal) * 100}%`;
    const btn = paused() ? 'play' : p.kind === 'work' && p.mode === 'reps' ? 'done' : 'pause';
    if (el.main.dataset.state !== btn) {
      el.main.dataset.state = btn;
      el.main.innerHTML = btn === 'done' ? `${icon('check')}<span>Done</span>` : icon(btn);
      el.main.classList.toggle('done-btn', btn === 'done');
      el.main.setAttribute('aria-label', btn === 'play' ? 'Resume' : btn === 'done' ? 'Done' : 'Pause');
      el.root.classList.toggle('paused', btn === 'play');
    }
  }

  function pause() {
    if (paused()) return;
    acc = elapsed(); runningSince = null;
    sessionAcc = sessionElapsed(); sessionSince = null;
    fig?.pause();
    audio.stopSpeech();
    tick();
  }
  function resume() {
    if (!paused()) return;
    runningSince = now(); sessionSince = now();
    wakeLock.on();
    fig?.resume();
    if (pendingIntro) { pendingIntro = false; enter(idx, { carry: acc }); return; }
    tick();
  }

  const loop = setInterval(tick, 100);
  const stopTimers = () => { clearInterval(loop); clearInterval(cueTimer); };

  app.onclick = (e) => {
    const t = e.target.closest('[data-act]');
    if (!t || done) return;
    const p = phase();
    switch (t.dataset.act) {
      case 'main':
        if (!audio.unlocked) audio.unlock();
        if (paused()) resume();
        else if (p.kind === 'work' && p.mode === 'reps') next({ done: true });
        else pause();
        break;
      case 'next': next(); break;
      case 'prev':
        if (elapsed() > 3000 || idx === 0) enter(idx);
        else { let j = idx - 1; while (j > 0 && phases[j].kind !== 'work' && phases[j].kind !== 'prep') j--; enter(j); }
        break;
      case 'extra': extra += p.kind === 'work' ? 10000 : 15000; lastWhole = null; tick(); break;
      case 'less':
        if (p.dur * 1000 + extra - 15000 - elapsed() < 1000) next();
        else { extra -= 15000; lastWhole = null; tick(); }
        break;
      case 'load': editLoad(p); break;
      case 'map': showMap = !showMap; el.map.hidden = !showMap; el.fig.hidden = showMap; el.mini.hidden = showMap; t.classList.toggle('on', showMap); break;
      case 'cues': {
        const ex = p.kind === 'work' ? p.ex : p.next?.ex;
        if (!ex) break;
        const wasPaused = paused();
        pause();
        sheet(`<div class="sheet-head"><h3>${esc(ex.name)}</h3></div><ol class="cues">${(ex.cues ?? []).map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
          <p class="muted small">Primary: ${esc(muscleNames(ex.primary))}${ex.secondary?.length ? `<br>Also: ${esc(muscleNames(ex.secondary))}` : ''}</p>`,
          { onClose: () => { if (!wasPaused) resume(); } });
        break;
      }
      case 'exit':
        if (sessionElapsed() < 15000 || confirm('End this workout?')) {
          const workDone = phases.slice(0, idx).filter((q) => q.kind === 'work').length;
          if (workDone > 0) {
            const lf = lifts();
            db.history.unshift({ id: uid(), routineId: r.id, name: r.name, date: new Date().toISOString(), seconds: Math.round(sessionElapsed() / 1000), partial: true, ...(lf.length ? { lifts: lf } : {}) });
            save();
          }
          location.hash = `#/routine/${r.id}`;
        }
        break;
    }
  };

  // Start immediately if audio was unlocked by the tap that got us here; otherwise wait for a tap.
  wakeLock.on();
  if (audio.unlocked) { runningSince = now(); sessionSince = now(); }
  enter(0, { silent: !audio.unlocked });
  if (!audio.unlocked) { el.kicker.textContent = 'Ready'; el.timeS.textContent = 'tap play to start'; }

  return () => { stopTimers(); fig?.stop(); wakeLock.off(); audio.stopSpeech(); };
}

// ───────────────────────── Boot ─────────────────────────

render();
try { if (sessionStorage.getItem('limber.updated')) { sessionStorage.removeItem('limber.updated'); toast('Updated to the latest version'); } } catch { /* ignore */ }

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  // The installed app resumes from memory instead of reloading, so check for a new version whenever it
  // comes back to the foreground; when one takes over, reload into it (never in the middle of a workout).
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return; // first install, nothing old on screen
    if (location.hash.startsWith('#/play')) { updateWaiting = true; return; }
    reloadIntoUpdate();
  });
}

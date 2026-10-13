import { EXERCISES, STARTER_ROUTINES, MUSCLES } from './exercises.js';
import { renderFigure } from './figure.js';
import { muscleMapSVG } from './muscles.js';
import { audio, wakeLock } from './audio.js';

// ───────────────────────── Storage ─────────────────────────

const KEY = 'limber.v1';
const DEFAULT_SETTINGS = { voice: true, beeps: true, prep: 5, switchTime: 5 };
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

// ───────────────────────── Helpers ─────────────────────────

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`; };
const fmtClock = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const fmtMin = (s) => (s < 60 ? `${Math.max(1, Math.round(s))} sec` : `${Math.round(s / 60)} min`);
const typeVar = (t) => (t === 'strength' ? 'var(--strength)' : 'var(--stretch)');
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

// ───────────────────────── Routine math ─────────────────────────

function stepInfo(step) {
  const ex = getEx(step.ex);
  if (!ex) return null;
  const mode = step.mode ?? ex.mode;
  return {
    ex, mode,
    duration: step.duration ?? ex.duration ?? 30,
    reps: step.reps ?? ex.reps ?? 10,
    sets: step.sets ?? 1,
    setRest: step.setRest ?? (ex.type === 'strength' ? 30 : 10),
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
        P.push({ kind: 'work', ex: si.ex, mode: si.mode, dur: si.mode === 'time' ? si.duration : null, reps: si.reps, side, set, sets: si.sets, step: idx });
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
];

function render() {
  cleanup?.();
  cleanup = null;
  const hash = location.hash || '#/';
  for (const [re, fn] of routes) {
    const m = hash.match(re);
    if (m) {
      const tab = hash.startsWith('#/library') || hash.startsWith('#/exercise') || hash.startsWith('#/custom') ? 'library'
        : hash.startsWith('#/history') ? 'history' : hash.startsWith('#/settings') ? 'settings' : 'routines';
      document.body.dataset.tab = tab;
      document.body.classList.toggle('playing', hash.startsWith('#/play'));
      cleanup = fn(...m.slice(1)) || null;
      updateTabs(tab);
      return;
    }
  }
  location.hash = '#/';
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

function updateTabs(tab) {
  $$('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
}

// ───────────────────────── Routines ─────────────────────────

const isStandalone = () => window.navigator.standalone || window.matchMedia?.('(display-mode: standalone)').matches;

function viewRoutines() {
  const hintDismissed = (() => { try { return localStorage.getItem('limber.hint') === '1'; } catch { return false; } })();
  const showHint = !isStandalone() && !hintDismissed && /iPhone|iPad|iPod/.test(navigator.userAgent);
  app.innerHTML = `
    <header class="top">
      <h1>Routines</h1>
      <button class="btn-icon accent" data-act="new" aria-label="New routine">${icon('plus')}</button>
    </header>
    ${showHint ? `<div class="hint"><div><strong>Install Limber</strong><p>Tap the Share button ${icon('share', 'inline')} then <b>Add to Home Screen</b> to use it like an app. Routines you make in the installed app stay there.</p></div><button class="btn-icon" data-act="hint" aria-label="Dismiss">${icon('close')}</button></div>` : ''}
    <div class="cards">
      ${db.routines.length ? db.routines.map(routineCard).join('') : `<div class="empty"><p>No routines yet.</p><button class="btn primary" data-act="new">Create a routine</button></div>`}
    </div>
    ${db.routines.length ? `<button class="btn ghost wide" data-act="new">${icon('plus')} New routine</button>` : ''}
  `;
  app.onclick = (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const id = t.closest('[data-id]')?.dataset.id;
    if (t.dataset.act === 'new') {
      const r = { id: uid(), name: 'New Routine', rest: 10, steps: [] };
      db.routines.unshift(r); save();
      location.hash = `#/routine/${r.id}`;
    }
    if (t.dataset.act === 'open') location.hash = `#/routine/${id}`;
    if (t.dataset.act === 'play') startRoutine(id);
    if (t.dataset.act === 'hint') { try { localStorage.setItem('limber.hint', '1'); } catch { /* ignore */ } t.closest('.hint').remove(); }
  };
}

function routineCard(r) {
  const infos = r.steps.map(stepInfo).filter(Boolean);
  const nStretch = infos.filter((i) => i.ex.type === 'stretch').length;
  const nStrength = infos.length - nStretch;
  const last = db.history.find((h) => h.routineId === r.id);
  return `<article class="rcard" data-id="${r.id}">
    <button class="rcard-main" data-act="open">
      <h2>${esc(r.name)}</h2>
      <p class="meta">${infos.length} exercise${infos.length === 1 ? '' : 's'} · ~${fmtMin(estimate(r))}${last ? ` · last done ${relDate(last.date)}` : ''}</p>
      <div class="mix">${nStretch ? `<span class="pill stretch">${nStretch} stretch</span>` : ''}${nStrength ? `<span class="pill strength">${nStrength} strength</span>` : ''}</div>
    </button>
    <button class="play-btn" data-act="play" aria-label="Start ${esc(r.name)}" ${infos.length ? '' : 'disabled'}>${icon('play')}</button>
  </article>`;
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
        ${r.steps.map((s, i) => stepRow(s, i, r.steps.length, open === s.id)).join('')}
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
    if (openFig) figs.push(renderFigure(openFig, getEx(openFig.dataset.ex), { aspect: 1.6 }));
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
      case 'up': if (idx > 0) { [r.steps[idx - 1], r.steps[idx]] = [r.steps[idx], r.steps[idx - 1]]; commit(); } break;
      case 'down': if (idx < r.steps.length - 1) { [r.steps[idx + 1], r.steps[idx]] = [r.steps[idx], r.steps[idx + 1]]; commit(); } break;
      case 'dup': r.steps.splice(idx + 1, 0, { ...clone(step), id: uid() }); commit(); break;
      case 'remove': r.steps.splice(idx, 1); if (open === sid) open = null; commit(); break;
      case 'mode': step.mode = t.dataset.v; commit(); break;
      case 'sides': step.sides = step.sides === 'one' ? undefined : 'one'; commit(); break;
      case 'step': {
        const f = t.dataset.f, target = f === 'rest' && !sid ? r : step;
        const [min, max, inc] = [+t.dataset.min, +t.dataset.max, +t.dataset.inc];
        const cur = target[f] ?? (f === 'rest' ? r.rest ?? 10 : stepInfo(step)[f]);
        target[f] = Math.min(max, Math.max(min, cur + inc));
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
      const v = Math.round(+t.value);
      if (t.value === '' && sid) delete target[t.dataset.num];
      else if (Number.isFinite(v)) target[t.dataset.num] = Math.min(+t.max, Math.max(+t.min, v));
      commit();
    }
  };
  draw();
  return () => figs.forEach((f) => f.stop());
}

function stepper(field, value, inc, min, max, unit = '') {
  return `<span class="stepper">
    <button data-act="step" data-f="${field}" data-inc="${-inc}" data-min="${min}" data-max="${max}" aria-label="Decrease">−</button>
    <input type="number" inputmode="numeric" data-num="${field}" value="${value}" min="${min}" max="${max}" aria-label="${field}"><span class="unit">${unit}</span>
    <button data-act="step" data-f="${field}" data-inc="${inc}" data-min="${min}" data-max="${max}" aria-label="Increase">+</button>
  </span>`;
}

function stepRow(s, i, n, isOpen) {
  const si = stepInfo(s);
  if (!si) {
    return `<li class="step" data-sid="${s.id}"><div class="step-head"><div class="step-name">Missing exercise</div><button class="btn-icon" data-act="remove">${icon('trash')}</button></div></li>`;
  }
  const ex = si.ex;
  return `<li class="step ${isOpen ? 'open' : ''}" data-sid="${s.id}" style="--acc:${typeVar(ex.type)}">
    <button class="step-head" data-act="toggle" aria-expanded="${isOpen}">
      <span class="step-num">${i + 1}</span>
      <span class="step-thumb" data-ex="${ex.id}"></span>
      <span class="step-text"><span class="step-name">${esc(ex.name)}</span><span class="step-sum">${stepSummary(s)}</span></span>
      ${icon(isOpen ? 'up' : 'down', 'chev')}
    </button>
    ${isOpen ? `<div class="step-body">
      <div class="step-preview" data-ex="${ex.id}"></div>
      <div class="seg" role="group" aria-label="Measure by">
        <button data-act="mode" data-v="time" class="${si.mode === 'time' ? 'on' : ''}">Timed</button>
        <button data-act="mode" data-v="reps" class="${si.mode === 'reps' ? 'on' : ''}">Reps</button>
      </div>
      <div class="fields">
        ${si.mode === 'time'
          ? `<label>Duration${si.sided ? ' (per side)' : ''} ${stepper('duration', si.duration, 5, 5, 600, 's')}</label>`
          : `<label>Reps${si.sided ? ' (per side)' : ''} ${stepper('reps', si.reps, 1, 1, 200)}</label>`}
        <label>Sets ${stepper('sets', si.sets, 1, 1, 20)}</label>
        ${si.sets > 1 ? `<label>Rest between sets ${stepper('setRest', si.setRest, 5, 0, 300, 's')}</label>` : ''}
        <label>Rest after <span class="muted">(blank = routine default)</span> ${stepper('rest', s.rest ?? '', 5, 0, 300, 's')}</label>
        ${ex.sided ? `<label class="switch-row"><span>Do both sides</span><button class="toggle ${s.sides === 'one' ? '' : 'on'}" data-act="sides" role="switch" aria-checked="${s.sides !== 'one'}"><span></span></button></label>` : ''}
      </div>
      <div class="step-actions">
        <button class="btn-icon" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${icon('up')}</button>
        <button class="btn-icon" data-act="down" ${i === n - 1 ? 'disabled' : ''} aria-label="Move down">${icon('down')}</button>
        <button class="btn-icon" data-act="dup" aria-label="Duplicate">${icon('copy')}</button>
        <button class="btn-icon" data-act="info" aria-label="How to do it">${icon('info')}</button>
        <button class="btn-icon danger" data-act="remove" aria-label="Remove">${icon('trash')}</button>
      </div>
    </div>` : ''}
  </li>`;
}

// Exercise picker sheet: tap to add to routine.
function pickExercises(routine, onDone) {
  let filter = 'all', q = '';
  const figs = [];
  const s = sheet(`
    <div class="sheet-head"><h3>Add exercises</h3><button class="btn small primary" data-act="done">Done</button></div>
    <div class="search">${icon('search')}<input type="search" placeholder="Search exercises or muscles" aria-label="Search"></div>
    <div class="chips" role="group">${['all', 'stretch', 'strength'].map((f) => `<button class="chip ${f === 'all' ? 'on' : ''}" data-f="${f}">${f === 'all' ? 'All' : f === 'stretch' ? 'Stretches' : 'Strength'}</button>`).join('')}</div>
    <div class="pick-list"></div>`, { cls: 'tall', onClose: () => { figs.forEach((f) => f.stop()); onDone(); } });
  const list = $('.pick-list', s.el);
  const draw = () => {
    figs.splice(0).forEach((f) => f.stop());
    const items = filterExercises(allExercises(), filter, q);
    list.innerHTML = items.map((ex) => `<button class="pick" data-id="${ex.id}" style="--acc:${typeVar(ex.type)}">
      <span class="pick-thumb" data-ex="${ex.id}"></span>
      <span class="pick-text"><span class="pick-name">${esc(ex.name)}</span><span class="pick-sub">${esc(muscleNames(ex.primary))}</span></span>
      <span class="pick-add">${icon('plus')}</span></button>`).join('') || '<p class="muted pad">No matches.</p>';
    $$('.pick-thumb', list).forEach((el) => figs.push(renderFigure(el, getEx(el.dataset.ex), { animate: false, aspect: 1.15 })));
  };
  s.el.addEventListener('click', (e) => {
    const c = e.target.closest('.chip');
    if (c) { filter = c.dataset.f; $$('.chip', s.el).forEach((x) => x.classList.toggle('on', x === c)); draw(); return; }
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

function filterExercises(list, filter, q) {
  q = q.trim().toLowerCase();
  return list.filter((ex) => (filter === 'all' || ex.type === filter) &&
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

// ───────────────────────── Library ─────────────────────────

let libFilter = 'all', libQuery = '';

function viewLibrary() {
  const figs = [];
  app.innerHTML = `
    <header class="top"><h1>Exercises</h1><a class="btn-icon accent" href="#/custom/new" aria-label="New custom exercise">${icon('plus')}</a></header>
    <div class="search">${icon('search')}<input type="search" placeholder="Search exercises or muscles" value="${esc(libQuery)}" aria-label="Search"></div>
    <div class="chips">${['all', 'stretch', 'strength'].map((f) => `<button class="chip ${f === libFilter ? 'on' : ''}" data-f="${f}">${f === 'all' ? 'All' : f === 'stretch' ? 'Stretches' : 'Strength'}</button>`).join('')}</div>
    <div class="ex-grid"></div>`;
  const grid = $('.ex-grid', app);
  const draw = () => {
    figs.splice(0).forEach((f) => f.stop());
    const items = filterExercises(allExercises(), libFilter, libQuery);
    grid.innerHTML = items.map((ex) => `<a class="ex-card" href="#/exercise/${ex.id}" style="--acc:${typeVar(ex.type)}">
      <span class="ex-thumb" data-ex="${ex.id}"></span>
      <span class="ex-name">${esc(ex.name)}</span>
      <span class="ex-sub">${esc(muscleNames(ex.primary))}</span>
      ${ex.custom ? '<span class="tag">Custom</span>' : ''}
    </a>`).join('') || '<p class="muted pad">No matches.</p>';
    $$('.ex-thumb', grid).forEach((el) => figs.push(renderFigure(el, getEx(el.dataset.ex), { animate: false, aspect: 1.25 })));
  };
  app.onclick = (e) => {
    const c = e.target.closest('.chip');
    if (c) { libFilter = c.dataset.f; $$('.chip', app).forEach((x) => x.classList.toggle('on', x === c)); draw(); }
  };
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
        <span class="pill ${ex.type}">${ex.type === 'strength' ? 'Strength' : 'Stretch'}</span>
        <h1>${esc(ex.name)}</h1>
        <p class="muted">${ex.mode === 'time' ? `${fmtTime(ex.duration)} hold` : `${ex.reps} reps`}${ex.sided ? ' · each side' : ''}${ex.equipment ? ` · ${esc(ex.equipment)}` : ''}</p>
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
      <section class="card">
        <h3>How to do it</h3>
        <ol class="cues">${(ex.cues ?? []).map((c) => `<li>${esc(c)}</li>`).join('') || '<li>No instructions yet.</li>'}</ol>
      </section>
      <button class="btn primary wide" data-act="addto">${icon('plus')} Add to a routine</button>
    </div>`;
  const fig = renderFigure($('.ex-hero', app), ex, { aspect: 1.5 });
  app.onclick = (e) => {
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
      <div class="seg" data-group="type"><button type="button" data-v="stretch" class="${c.type === 'stretch' ? 'on' : ''}">Stretch</button><button type="button" data-v="strength" class="${c.type === 'strength' ? 'on' : ''}">Strength</button></div>
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
    <ul class="hist">${H.slice(0, 100).map((h) => `<li><div><b>${esc(h.name)}</b><span class="muted">${new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${new Date(h.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span></div><span class="hist-time">${fmtTime(h.seconds)}${h.partial ? '<small>partial</small>' : ''}</span></li>`).join('') || '<li class="muted">Finish a routine and it will show up here.</li>'}</ul>`;
}

// ───────────────────────── Settings ─────────────────────────

function viewSettings() {
  const S = db.settings;
  const tog = (k, label, sub) => `<label class="switch-row"><span>${label}${sub ? `<small>${sub}</small>` : ''}</span><button class="toggle ${S[k] ? 'on' : ''}" data-tog="${k}" role="switch" aria-checked="${!!S[k]}"><span></span></button></label>`;
  app.innerHTML = `
    <header class="top"><h1>Settings</h1></header>
    <section class="card settings">
      <h3>During a routine</h3>
      ${tog('voice', 'Voice guidance', 'Announces each exercise and side')}
      ${tog('beeps', 'Countdown beeps', '3-2-1 before each change')}
      <label class="switch-row"><span>Get ready time</span>${stepper('prep', S.prep, 5, 0, 60, 's')}</label>
      <label class="switch-row"><span>Switch sides pause</span>${stepper('switchTime', S.switchTime, 1, 0, 30, 's')}</label>
      <button class="btn ghost wide" data-act="test">Test sound</button>
    </section>
    <section class="card settings">
      <h3>Your data</h3>
      <p class="muted">Routines and history are saved on this phone. Make a backup before switching phones.</p>
      <button class="btn ghost wide" data-act="export">Export backup</button>
      <label class="btn ghost wide file-btn">Import backup<input type="file" accept="application/json,.json" hidden></label>
      <button class="btn ghost wide" data-act="starters">Add starter routines</button>
    </section>
    <p class="muted center small">Limber · stretch &amp; calisthenics guide<br>Listen to your body — stop if anything hurts.</p>`;
  app.onclick = (e) => {
    const t = e.target.closest('[data-tog],[data-act]');
    if (!t) return;
    if (t.dataset.tog) { S[t.dataset.tog] = !S[t.dataset.tog]; save(); viewSettings(); return; }
    if (t.dataset.act === 'step') {
      const f = t.dataset.f;
      S[f] = Math.min(+t.dataset.max, Math.max(+t.dataset.min, S[f] + +t.dataset.inc));
      save(); viewSettings();
    }
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
  let fig = null, figEx = null, cueTimer = null, cueI = 0, showMap = false, pendingIntro = !audio.unlocked;

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
        <span></span>
        <div class="pl-timer">
          <svg viewBox="0 0 120 120" class="ring"><circle cx="60" cy="60" r="54" class="ring-bg"/><circle cx="60" cy="60" r="54" class="ring-fg" stroke-dasharray="${RING_C}" stroke-dashoffset="0"/></svg>
          <div class="pl-time"><b></b><small></small></div>
        </div>
        <button class="pl-extra" data-act="extra" aria-label="Add 10 seconds">+10s</button>
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
    main: $('.pl-main', app), extra: $('.pl-extra', app), timer: $('.pl-timer', app),
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
    return `${p.ex.name}${side}. ${amount}.`;
  }

  function setFigure(ex, dim) {
    if (figEx !== ex) {
      fig?.stop();
      fig = renderFigure(el.fig, ex, { aspect: 1.25 });
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
      el.kicker.textContent = p.ex.type === 'strength' ? 'Strength' : 'Stretch';
      el.name.textContent = p.ex.name;
      el.chips.innerHTML = [p.side && `<span class="chip on">${p.side} side</span>`, p.sets > 1 && `<span class="chip">Set ${p.set} of ${p.sets}</span>`].filter(Boolean).join('');
      setFigure(p.ex, false);
      rotateCues(p.ex);
      if (!silent) { beep(1046, 0.22); say(describe(p)); }
    } else {
      const n = p.next;
      el.kicker.textContent = p.kind === 'prep' ? 'Get ready' : p.kind === 'switch' ? 'Switch sides' : 'Rest';
      el.name.textContent = p.kind === 'switch' ? `${p.side} side next` : n ? `Next: ${n.ex.name}` : 'Almost done';
      el.chips.innerHTML = n ? `<span class="chip">${n.mode === 'time' ? fmtTime(n.dur) : `${n.reps} reps`}${n.side ? ` · ${n.side}` : ''}</span>` : '';
      if (n) { setFigure(n.ex, true); rotateCues(n.ex); }
      if (!silent) {
        if (p.kind === 'prep') say(`Get ready. First up: ${n ? describe(n) : ''}`);
        else if (p.kind === 'switch') say(`Switch to the ${p.side.toLowerCase()} side.`);
        else say(n ? `Rest. Next up: ${n.ex.name}${n.side ? `, ${n.side.toLowerCase()} side` : ''}.` : 'Rest.');
      }
    }
    el.extra.hidden = !p.dur;
    tick();
  }

  function next(opts) { enter(idx + 1, opts); }

  function finish() {
    done = true;
    stopTimers();
    const secs = Math.round(sessionElapsed() / 1000);
    db.history.unshift({ id: uid(), routineId: r.id, name: r.name, date: new Date().toISOString(), seconds: secs });
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
        next({ silent: late > 1500, carry: late > 1500 ? late : 0 });
        return;
      }
      const whole = Math.ceil(remain / 1000);
      if (lastWhole !== null && whole !== lastWhole && whole <= 3 && whole >= 1) beep(660, 0.1);
      if (p.kind === 'work' && lastWhole !== null && whole !== lastWhole && whole === Math.round(p.dur / 2) && p.dur >= 40) say('Halfway.');
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
        else if (p.kind === 'work' && p.mode === 'reps') next();
        else pause();
        break;
      case 'next': next(); break;
      case 'prev':
        if (elapsed() > 3000 || idx === 0) enter(idx);
        else { let j = idx - 1; while (j > 0 && phases[j].kind !== 'work' && phases[j].kind !== 'prep') j--; enter(j); }
        break;
      case 'extra': extra += 10000; lastWhole = null; tick(); break;
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
            db.history.unshift({ id: uid(), routineId: r.id, name: r.name, date: new Date().toISOString(), seconds: Math.round(sessionElapsed() / 1000), partial: true });
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

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

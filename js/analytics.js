// Anonymous usage stats via GoatCounter (https://www.goatcounter.com): no cookies, no personal data,
// nothing from your routines or history — just which screens are opened and a few events.
// Off until GOATCOUNTER is set to the site code (e.g. 'limber' for https://limber.goatcounter.com).
export const GOATCOUNTER = '';

let allowed = () => true;
export const setAllowed = (fn) => { allowed = fn; };

let first = true;
function send(path, title, event) {
  const local = /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname);
  if (!GOATCOUNTER || local || navigator.doNotTrack === '1' || !allowed()) return;
  const q = new URLSearchParams({ p: path, t: title ?? '', s: `${screen.width},${screen.height},${devicePixelRatio}`, rnd: Math.random().toString(36).slice(2) });
  if (event) q.set('e', 'true');
  if (first && !event && document.referrer) q.set('r', document.referrer);
  if (!event) first = false;
  const url = `https://${GOATCOUNTER}.goatcounter.com/count?${q}`;
  try { if (navigator.sendBeacon?.(url)) return; } catch { /* fall through */ }
  new Image().src = url;
}

// Screen views. Personal ids (routine, play) are dropped so pages group together; explore and exercise ids stay.
export function pageview(hash) {
  const parts = (hash.replace(/^#\/?/, '') || 'routines').split('/');
  const keepId = parts[0] === 'explore' || parts[0] === 'exercise';
  send('/' + (keepId ? parts.slice(0, 2) : parts.slice(0, 1)).join('/'), document.title);
}

// Named events, e.g. event('workout-finish', '7-Minute Workout').
export const event = (name, title = '') => send(name, title, true);

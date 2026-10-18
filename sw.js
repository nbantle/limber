// Offline support: serve the app shell from cache, refresh it in the background.
const CACHE = 'limber-v25';
const ASSETS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/figure.js', './js/exercises.js', './js/exercises-more.js', './js/exercises-weights.js', './js/exercises-bands.js', './js/routines.js', './js/analytics.js', './js/coach.js', './js/muscles.js', './js/audio.js', './js/character2.js', './js/palette.js', './js/whatsnew.js',
  './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' skips the browser's HTTP cache so a new version never precaches old files.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network first so updates show up right away; fall back to cache when offline.
// cache: 'no-cache' checks with the server every time (GitHub Pages otherwise lets browsers reuse files
// for 10 minutes); unchanged files come back as a quick 304.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});

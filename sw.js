// Kleine Werft – Service Worker (Offline-Betrieb)
// Alle Dateien liegen im Cache. Eine neue Version wird im Hintergrund vollständig geladen
// und erst aktiv, wenn die App das nächste Mal gestartet wird (kein skipWaiting) – ein laufendes Spiel wird nie unterbrochen.
const CACHE = 'kleine-werft-66';
const FILES = ["musik/meer/1-drunken-sailor.mp3", "musik/meer/10-haul-away-joe.mp3", "musik/meer/11-alle-meine-entchen.mp3", "musik/meer/2-wellerman.mp3", "musik/meer/3-my-bonnie.mp3", "musik/meer/4-hamborger-veermaster.mp3", "musik/meer/5-row-your-boat.mp3", "musik/meer/6-michael-row.mp3", "musik/meer/7-shenandoah.mp3", "musik/meer/8-blow-the-man-down.mp3", "musik/meer/9-sailors-hornpipe.mp3", "musik/werft/1-werft-jazz-1.mp3", "musik/werft/2-werft-jazz-2.mp3", "./", "index.html", "three.min.js", "manifest.webmanifest", "fonts/Fredoka.ttf", "fonts/AtkinsonHyperlegible-Regular.ttf", "fonts/AtkinsonHyperlegible-Bold.ttf", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kleine-werft-') && k !== CACHE).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // nichts aus dem Netz nötig
  e.respondWith(
    caches.open(CACHE).then(c =>
      c.match(req, { ignoreSearch: true }).then(hit => hit ||
        (req.mode === 'navigate' ? c.match('index.html') : null)).then(hit => hit || fetch(req))
    )
  );
});

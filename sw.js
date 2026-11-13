// Kleine Werft – Service Worker (Offline-Betrieb)
// Alle Dateien liegen im Cache. Eine neue Version wird im Hintergrund vollständig geladen
// und erst aktiv, wenn die App das nächste Mal gestartet wird (kein skipWaiting) – ein laufendes Spiel wird nie unterbrochen.
// Während des Ladens meldet der Service Worker den Fortschritt (nach Dateigröße) an die geöffneten Fenster.
const VERSION = '71';
const CACHE = 'kleine-werft-' + VERSION;
const FILES = [["musik/kran/1-rolling-deckside-x-rolling-deckside-mashup.mp3", 3725957], ["musik/meer/1-rolling-deckside-1.mp3", 5760554], ["musik/meer/2-rolling-deckside-2.mp3", 5755956], ["musik/meer/3-rolling-deckside-3.mp3", 5759289], ["musik/meer/4-rolling-deckside-4.mp3", 5747168], ["musik/werft/1-werft-1.mp3", 5756781], ["musik/tauchen/1-diving.mp3", 5759300], ["./", 429450], ["index.html", 429450], ["three.min.js", 603445], ["manifest.webmanifest", 665], ["fonts/Fredoka.ttf", 159184], ["fonts/AtkinsonHyperlegible-Regular.ttf", 54348], ["fonts/AtkinsonHyperlegible-Bold.ttf", 55256], ["icons/icon-192.png", 6534], ["icons/icon-512.png", 19181], ["icons/icon-maskable-512.png", 19181]]; // [pfad, bytes]

async function tell(msg) {
  const cs = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  cs.forEach(c => c.postMessage(msg));
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    const total = FILES.reduce((s, f) => s + f[1], 0);
    let done = 0, last = 0;
    for (const [path, size] of FILES) {
      const res = await fetch(new Request(path, { cache: 'reload' }));
      if (!res.ok) throw new Error('Laden fehlgeschlagen: ' + path);
      await c.put(path, res);
      done += size;
      if (done - last > total / 100 || done === total) { last = done; tell({ type: 'kw-progress', v: VERSION, done, total }); }
    }
    tell({ type: 'kw-installed', v: VERSION });
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kleine-werft-') && k !== CACHE).map(k => caches.delete(k)))));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'kw-version?' && e.source) e.source.postMessage({ type: 'kw-version', v: VERSION });
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

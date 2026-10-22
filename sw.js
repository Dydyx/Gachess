/*
 * Service worker de Gachess : l'appli fonctionne hors connexion une fois installée.
 * Les fichiers sont servis depuis le cache puis mis à jour en arrière-plan
 * (la nouvelle version s'applique au lancement suivant). Changer VERSION force un rafraîchissement.
 */
const VERSION = 'gachess-v5';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/rules.js', 'js/pieces.js', 'js/sound.js', 'js/board.js', 'js/bots.js', 'js/app.js', 'js/ai-worker.js',
  'engine/stockfish-19-lite-single.js', 'engine/stockfish-19-lite-single.wasm',
  'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then(res => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  }));
});

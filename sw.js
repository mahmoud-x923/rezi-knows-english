// Offline support. Online, files come fresh from the network so updates show up
// straight away. Offline, or on a very slow connection, the saved copies are used.

const CACHE = 'rezi-knows-english-v1';
const NETWORK_TIMEOUT_MS = 3000;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Every file the site needs. Add new files here, and change CACHE when removing one.
const FILES = [
  './',
  'index.html',
  'manifest.json',
  'css/base.css',
  'js/app.js',
  'js/data.js',
  'js/date.js',
  'js/debug.js',
  'js/decor.js',
  'js/dom.js',
  'js/games/match.js',
  'js/graduation.js',
  'js/guide.js',
  'js/hero.js',
  'js/lesson.js',
  'js/motion.js',
  'js/names.js',
  'js/practice.js',
  'js/quiz.js',
  'js/settings.js',
  'js/speech.js',
  'js/state.js',
  'js/tabs.js',
  'js/theme.js',
  'data/abbreviations.json',
  'data/curriculum.json',
  'data/greetings.json',
  'data/guide.json',
  'data/names.json',
  'data/verbs.json',
  'icons/favicon-48.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'stickers/cheer.webp',
  'stickers/cozy.webp',
  'stickers/listening.webp',
  'stickers/pouting.webp',
  'stickers/proud.webp',
  'stickers/sleepy.webp',
  'stickers/sweet.webp',
  'stickers/thinking.webp',
  'stickers/welcome.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function timeout(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Network timeout')), ms);
  });
}

// Pages are saved with their ?debug or other query, so any version of the page can stand in.
async function findSaved(cache, request) {
  if (request.mode !== 'navigate') return cache.match(request);
  return (await cache.match(request, { ignoreSearch: true })) ?? cache.match('index.html');
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  const network = fetch(request).then((response) => {
    // The font stylesheet comes back opaque, which is still safe to save.
    if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
    return response;
  });
  try {
    return await Promise.race([network, timeout(NETWORK_TIMEOUT_MS)]);
  } catch {
    // Without a saved copy, keep waiting for the network.
    return (await findSaved(cache, request)) ?? network;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isOwnFile = url.origin === self.location.origin;
  if (!isOwnFile && !FONT_HOSTS.includes(url.hostname)) return;
  event.respondWith(networkFirst(request));
});

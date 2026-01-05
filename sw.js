const CACHE_NAME = 'hkd-ncb-v10-force-update';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/reset.css',
    './css/style.css',
    './js/app.js',
    './js/state.js',
    './js/renderers.js',
    './js/mock-data.js',
    './manifest.json',
    './icon.svg'
];

// Install Event: Cache files
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    self.skipWaiting(); // FORCE ACTIVE IMMEDIATELY
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all: ', ASSETS_TO_CACHE);
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// Fetch Event: Serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

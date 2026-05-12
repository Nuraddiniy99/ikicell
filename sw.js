// IKI CELL v3.0 - Service Worker
const CACHE_NAME = 'iki-cell-v3.0';
const RUNTIME_CACHE = 'iki-cell-runtime-v3';

const PRECACHE_ASSETS = [
    'ikicell/',
    'ikicell/index.html',
    'ikicell/splash.html',
    'ikicell/sw.js',
    'ikicell/manifest.json',
    'ikicell/icons/icon-72x72.png',
    'ikicell/icons/icon-96x96.png',
    'ikicell/icons/icon-128x128.png',
    'ikicell/icons/icon-144x144.png',
    'ikicell/icons/icon-152x152.png',
    'ikicell/icons/icon-192x192.png',
    'ikicell/icons/icon-384x384.png',
    'ikicell/icons/icon-512x512.png',
    'ikicell/icons/maskable-icon-512x512.png'
];

// Install
self.addEventListener('install', (event) => {
    console.log('[IKI Cell SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
            .catch((err) => console.error('[IKI Cell SW] Install error:', err))
    );
});

// Activate
self.addEventListener('activate', (event) => {
    console.log('[IKI Cell SW] Activating...');
    const validCaches = [CACHE_NAME, RUNTIME_CACHE];
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (!validCaches.includes(key)) {
                        console.log('[IKI Cell SW] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - Network first, cache fallback
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('/index.html');
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

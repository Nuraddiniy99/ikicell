// IKI CELL v3.0 - Service Worker
// Cache-first strategy - by MAS Tracker schema

const CACHE_NAME = 'iki-cell-v3.0.0';
const STATIC_ASSETS = [
    '/iki-cell/',
    '/iki-cell/index.html',
    '/iki-cell/splash.html',
    '/iki-cell/manifest.json',
    '/iki-cell/sw.js',
    '/iki-cell/icons/icon-72x72.png',
    '/iki-cell/icons/icon-96x96.png',
    '/iki-cell/icons/icon-128x128.png',
    '/iki-cell/icons/icon-144x144.png',
    '/iki-cell/icons/icon-152x152.png',
    '/iki-cell/icons/icon-192x192.png',
    '/iki-cell/icons/icon-384x384.png',
    '/iki-cell/icons/icon-512x512.png',
    '/iki-cell/icons/maskable-icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[IKI Cell] Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch((err) => console.log('[IKI Cell] Cache failed:', err))
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[IKI Cell] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (event.request.url.startsWith('chrome-extension://')) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) {
                // Update cache in background
                fetch(event.request)
                    .then((response) => {
                        if (response.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, response.clone());
                            });
                        }
                    })
                    .catch(() => {});
                return cached;
            }

            return fetch(event.request)
                .then((response) => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    if (event.request.mode === 'navigate') {
                        return caches.match('/iki-cell/index.html');
                    }
                });
        })
    );
});

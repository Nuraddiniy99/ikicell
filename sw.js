// IKI CELL v3.0 - Service Worker
// Force activation dan caching lengkap

const CACHE_NAME = 'iki-cell-v3';
const RUNTIME_CACHE = 'iki-cell-runtime-v3';

const PRECACHE_ASSETS = [
    './',
    './index.html',
    './splash.html',
    './sw.js',
    './manifest.json',
    './icons/icon-72x72.png',
    './icons/icon-96x96.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-152x152.png',
    './icons/icon-192x192.png',
    './icons/icon-384x384.png',
    './icons/icon-512x512.png',
    './icons/maskable-icon-512x512.png'
];

// Install event
self.addEventListener('install', function(event) {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('[SW] Caching all assets');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(function() {
                console.log('[SW] Skip waiting');
                return self.skipWaiting();
            })
    );
});

// Activate event
self.addEventListener('activate', function(event) {
    console.log('[SW] Activating...');
    var cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            console.log('[SW] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch event - Network first
self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;
    
    var url = new URL(event.request.url);
    if (!url.protocol.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                if (response && response.status === 200) {
                    var responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(function() {
                return caches.match(event.request).then(function(cachedResponse) {
                    if (cachedResponse) return cachedResponse;
                    if (event.request.headers.get('accept') && event.request.headers.get('accept').indexOf('text/html') !== -1) {
                        return caches.match('/index.html');
                    }
                    return new Response('Offline', {status: 503, statusText: 'Service Unavailable'});
                });
            })
    );
});

console.log('[SW] Service Worker file loaded');
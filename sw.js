// Advanced Service Worker for TargetSweeper 360 Web PWA
const CACHE_NAME = 'targetsweeper-360-v2';
const STATIC_CACHE = 'targetsweeper-static-v2';
const DYNAMIC_CACHE = 'targetsweeper-dynamic-v2';

// Resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icon-base.svg',
    '/offline.html' // Fallback page
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
    'googleapis.com',
    'maps.googleapis.com'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');

    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            }),
            self.skipWaiting() // Activate immediately
        ])
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');

    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE &&
                            cacheName !== DYNAMIC_CACHE &&
                            cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim() // Take control immediately
        ])
    );
});

// Fetch event - advanced caching strategy
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different types of requests
    if (url.pathname === '/') {
        // App shell - cache first, then network
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
        // Static assets - cache first
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (CACHEABLE_APIS.some(api => url.hostname.includes(api))) {
        // API requests - network first, then cache
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    } else if (url.pathname.endsWith('.kml') || url.pathname.endsWith('.kmz')) {
        // KML files - network first with caching
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    } else {
        // Everything else - network first
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    }
});

// Caching strategies
async function cacheFirst(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            // Update cache in background
            fetch(request).then(response => {
                if (response.ok) {
                    cache.put(request, response.clone());
                }
            });
            return cachedResponse;
        }

        // Not in cache, fetch from network
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Cache first failed:', error);
        return new Response('Offline - Resource unavailable', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // No cache either, return offline page for navigation
        if (request.mode === 'navigate') {
            const offlineResponse = await cache.match('/offline.html');
            if (offlineResponse) {
                return offlineResponse;
            }
        }

        return new Response('Offline - Network unavailable', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);

    if (event.tag === 'location-update') {
        event.waitUntil(syncLocationData());
    }
});

async function syncLocationData() {
    // Handle background location sync when back online
    console.log('Syncing location data...');
    // Implementation depends on your needs
}

// Push notifications (if needed for location updates)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();

        const options = {
            body: data.body || 'New update available',
            icon: '/icon-192.png',
            badge: '/icon-96.png',
            tag: 'targetsweeper-notification',
            requireInteraction: false,
            actions: [
                {
                    action: 'view',
                    title: 'View',
                    icon: '/icon-view.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'TargetSweeper 360', options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling for PWA features
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CACHE_KML':
            if (data.url) {
                caches.open(DYNAMIC_CACHE).then(cache => {
                    cache.add(data.url);
                });
            }
            break;
        case 'CLEAR_CACHE':
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            });
            break;
    }
});
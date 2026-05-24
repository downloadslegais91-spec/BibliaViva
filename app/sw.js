// BíbliaViva Service Worker – Offline-first PWA
const CACHE_NAME = 'bibliaviva-v8';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/Intensiva.html',
  '/admin.html',
  '/sermon-player.js',
  '/sermon-player.css',
  '/manifest.json',
  '/icon-512.png',
  '/icon-biblia-viva.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// API routes that should be cached with network-first strategy
const API_CACHE_NAME = 'bibliaviva-api-v1';

// ----- INSTALL: pre-cache the shell -----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching static shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately instead of waiting
  self.skipWaiting();
});

// ----- ACTIVATE: clean old caches -----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE_NAME)
          .map(k => {
            console.log('[SW] Removing old cache:', k);
            return caches.delete(k);
          })
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ----- FETCH: smart caching strategy -----
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (POST/PUT/DELETE go straight to network)
  if (event.request.method !== 'GET') return;

  // Strategy for HTML pages (Navigation requests): Network-first, fallback to cache
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirstThenCache(event.request));
    return;
  }

  // Strategy for API calls: Network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstThenCache(event.request));
    return;
  }

  // Strategy for everything else (CSS, JS, fonts, images): Cache-first, fallback to network
  event.respondWith(cacheFirstThenNetwork(event.request));
});

// ----- Cache-first strategy (static assets) -----
async function cacheFirstThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    // Cache successful responses for future offline use
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // If both cache and network fail, return offline fallback for navigation
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }
    // For other resources, just fail gracefully
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// ----- Network-first strategy (API data) -----
async function networkFirstThenCache(request) {
  try {
    const networkResponse = await fetch(request);
    // Cache successful API responses for offline fallback
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Network failed – try to serve cached API data
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving cached API data for:', request.url);
      return cached;
    }
    // No cache available – return structured offline error
    return new Response(
      JSON.stringify({
        status: 'offline',
        message: 'Você está sem conexão. Dados salvos localmente serão exibidos.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

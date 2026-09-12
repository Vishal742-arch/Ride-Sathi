// Ride Sathi — Service Worker
// Caches static assets for a fast, offline-capable app-like experience.

const CACHE_NAME = 'ride-sathi-v1';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/find',
  '/offer',
  '/manifest.json',
  '/favicon.png',
  '/logo.png',
  '/favicon.svg',
];

// Install: pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always bypass SW for API routes and Supabase calls
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('supabase.co') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Network-first strategy for HTML navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first for static assets (images, fonts, JS, CSS)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache valid same-origin responses
        if (
          response.ok &&
          response.type === 'basic' &&
          url.origin === self.location.origin
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

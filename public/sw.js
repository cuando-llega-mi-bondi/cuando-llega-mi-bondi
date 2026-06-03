// Bondi MDP — Service Worker
//
// Strategies per resource type:
//   - /_next/static/, /icon-*, fonts: cache-first (immutable, hashed filenames).
//   - HTML / pages: network-first with cache fallback.
//
// Reference/live API traffic ya no se intercepta: las acciones de catálogo van
// al mismo origen (`/api/reference`, dump estático) y las de tiempo real salen
// cross-origin al backend self-hosted, que el SW no toca por la guarda de
// `url.origin !== self.location.origin`.

const CACHE_VERSION = 'v4';
const STATIC_CACHE = `bondimdp-static-${CACHE_VERSION}`;
const PAGES_CACHE = `bondimdp-pages-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const allowed = new Set([STATIC_CACHE, PAGES_CACHE]);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) =>
            (name.startsWith('cuandollega-') || name.startsWith('bondimdp-')) &&
            !allowed.has(name)
          )
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (request.method !== 'GET') return;

  // Immutable static assets (Next.js hashed filenames, app icons).
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname === '/favicon.ico'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Other static-like assets (manifest, geojson, screenshots): SWR.
  if (
    url.pathname === '/manifest.json' ||
    url.pathname.endsWith('.geojson') ||
    url.pathname.startsWith('/screenshots/')
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // HTML pages: network-first to keep them fresh, fallback to cache offline.
  event.respondWith(networkFirst(request, PAGES_CACHE));
});

// ── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Sin conexión. Revisá tu red.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    networkPromise; // refresh in background
    return cached;
  }

  const fresh = await networkPromise;
  if (fresh) return fresh;
  return new Response('Offline', { status: 503 });
}

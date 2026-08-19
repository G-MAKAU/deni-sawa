const CACHE_NAME = 'deni-sawa-v1';
const STATIC_CACHE = 'deni-sawa-static-v1';
const PAGE_CACHE = 'deni-sawa-pages-v1';
const IMAGE_CACHE = 'deni-sawa-images-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-96x96.png',
  '/apple-touch-icon.png',
];

const OFFLINE_PAGE = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, PAGE_CACHE, IMAGE_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

async function fetchWithNetworkFallback(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match(OFFLINE_PAGE);
      if (offlineResponse) return offlineResponse;
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }
    throw new Error('Network error and no cache');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin !== location.origin) return;

  if (request.destination === 'image') {
    event.respondWith(fetchWithNetworkFallback(request, IMAGE_CACHE));
    return;
  }

  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGE_CACHE);
        const cachedResponse = await cache.match(request);
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          if (cachedResponse) return cachedResponse;
          const offlineResponse = await cache.match(OFFLINE_PAGE);
          if (offlineResponse) return offlineResponse;
          return new Response('You are offline', { status: 503 });
        }
      })()
    );
    return;
  }

  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(fetchWithNetworkFallback(request, STATIC_CACHE));
    return;
  }

  event.respondWith(fetchWithNetworkFallback(request, STATIC_CACHE));
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
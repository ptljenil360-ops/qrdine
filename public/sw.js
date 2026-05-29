/**
 * QRDine Service Worker — basic caching for offline capability.
 * Caches static assets on install, serves from cache first for speed.
 */

const CACHE_NAME = 'qrdine-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

/* Install — pre-cache static assets */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

/* Activate — clean up old caches */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

/* Fetch — network first with cache fallback for standard GET requests */
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Handle navigation requests (HTML page)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // Network-First with Cache Fallback for other assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses from our own origin or cross-origin assets (e.g. fonts)
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const cacheCopy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

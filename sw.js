/**
 * sw.js - Service Worker for Dr. Mahmoud Ghanema Clinic PWA
 * Enables 100% offline access, fast loading, and asset caching
 */

const CACHE_NAME = 'ghanema-clinic-v1';
const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'assets/doctor_logo.png',
  'js/db.js?v=3',
  'js/joint-map.js?v=3',
  'js/gemini.js?v=3',
  'js/seed-data.js?v=3',
  'js/app.js?v=3',
  'js/sync.js?v=1',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some non-critical assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clear old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Cache-First for local assets, Network-First for Gemini AI API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Gemini API calls must always bypass cache and go to network
  if (url.hostname.includes('googleapis.com') && url.pathname.includes('models')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch update in background (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => { /* Offline, ignore */ });

        return cachedResponse;
      }

      // If not cached, fetch from network and cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // If offline and requesting an HTML page, return cached index.html
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('index.html');
        }
      });
    })
  );
});

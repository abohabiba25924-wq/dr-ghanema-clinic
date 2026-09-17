/**
 * sw.js - Service Worker for Dr. Mahmoud Ghanema Clinic PWA
 * Enables 100% offline access, fast loading, and asset caching
 */

const CACHE_NAME = 'ghanema-clinic-v6';
const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'assets/doctor_logo.png',
  'js/db.js?v=6',
  'js/sync.js?v=6',
  'js/joint-map.js?v=6',
  'js/gemini.js?v=6',
  'js/seed-data.js?v=6',
  'js/app.js?v=6',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Non-critical asset cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clear all old cache versions immediately
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

// Fetch Event:
// 1. Network-Only for Gemini AI & Supabase APIs
// 2. Network-First for HTML navigation (ensures updates load instantly)
// 3. Stale-While-Revalidate for cached assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Gemini API and Supabase calls bypass cache directly
  if ((url.hostname.includes('googleapis.com') && url.pathname.includes('models')) || url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML Navigation: Network-First with Cache Fallback
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((res) => res || caches.match('index.html'));
        })
    );
    return;
  }

  // Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      }).catch(() => { /* Offline fallback */ });

      return cachedResponse || fetchPromise;
    })
  );
});
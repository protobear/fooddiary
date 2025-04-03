const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/main.js',
  '/style.css',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  // Add other URLs of assets to cache as needed
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
// ============================================================ 
// sw.js — Service Worker for Voice-to-Text PWA 
// Caches app files for offline use with OIP logo 
// ============================================================ 
 
const CACHE_NAME = 'voice-to-text-v1'; 
 
// Files to cache for offline use 
const FILES_TO_CACHE = [ 
  './', 
  './index.html', 
  './style.css', 
  './app.js', 
  './install.js', 
  './manifest.json', 
  './OIP.ico', 
  './OIP-192.ico', 
  './OIP-512.ico' 
]; 
 
// ---- INSTALL: Cache all app files ---- 
self.addEventListener('install', (event) => { 
  console.log('[SW] Installing Service Worker...'); 
  event.waitUntil( 
    caches.open(CACHE_NAME).then((cache) => { 
      console.log('[SW] Caching app shell and OIP logo...'); 
      return cache.addAll(FILES_TO_CACHE); 
    }) 
  ); 
  self.skipWaiting(); 
}); 
 
// ---- ACTIVATE: Clear old caches ---- 
self.addEventListener('activate', (event) => { 
  console.log('[SW] Activating Service Worker...'); 
  event.waitUntil( 
    caches.keys().then((cacheNames) => { 
      return Promise.all( 
        cacheNames 
          .filter((name) => name !== CACHE_NAME) 
          .map((name) => { 
            console.log('[SW] Deleting old cache:', name); 
            return caches.delete(name); 
          }) 
      ); 
    }) 
  ); 
  self.clients.claim(); 
}); 
 
// ---- FETCH: Serve from cache, fallback to network ---- 
self.addEventListener('fetch', (event) => { 
  event.respondWith( 
    caches.match(event.request).then((cachedResponse) => { 
      if (cachedResponse) { 
        return cachedResponse; // Serve from cache (offline) 
      } 
      return fetch(event.request); // Fetch from network 
    }) 
  ); 
}); 
// sw.js — simple offline cache 
 
const CACHE_NAME = 'voice-to-text-cache-v1'; 
const ASSETS = [ 
  './', 
  './index.html', 
  './style.css', 
  './app.js', 
  './install.js', 
  './manifest.json', 
  './OIP.ico', 
  './icon-192.png', 
  './icon-512.png' 
]; 
 
self.addEventListener('install', (event) => { 
  event.waitUntil( 
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)) 
  ); 
}); 
 
self.addEventListener('activate', (event) => { 
  event.waitUntil( 
    caches.keys().then((keys) => 
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))) 
    ) 
  ); 
}); 
 
self.addEventListener('fetch', (event) => { 
  event.respondWith( 
    caches.match(event.request).then((cached) => { 
      return cached || fetch(event.request); 
    }) 
  ); 
}); 
 
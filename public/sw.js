const CACHE_NAME = 'sismovzla-v1-emergencia';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Instalar Service Worker y guardar recursos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activar y remover caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Manejo de peticiones Fetch resiliente (Offline-First)
self.addEventListener('fetch', (event) => {
  // Solo procesar peticiones HTTP/HTTPS (ignorar extensiones chrome-extension://, etc.)
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Estrategia Network-First para datos dinámicos / alertas / Firebase Auth o Firestore
  // Si falla la red, caemos a caché o devolvemos error seguro
  if (url.pathname.includes('/api/') || url.hostname.includes('firestore') || url.hostname.includes('firebase')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Navegación de página completa: Network-First con fallback a offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL) || caches.match('/');
      })
    );
    return;
  }

  // Estrategia Stale-While-Revalidate para el resto de assets (imágenes, fuentes, css, scripts)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Ignorar errores de red en segundo plano
        });
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Background Sync para reportes encolados
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reportes') {
    console.log('[Service Worker] Sincronización en segundo plano activada.');
  }
});

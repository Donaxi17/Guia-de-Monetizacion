const CACHE_NAME = 'monetiza-yt-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    // Si tienes imágenes locales, agrégalas aquí. Por ejemplo: '/logo.png'
];

// CDNs externos que queremos cachear para funcionamiento offline
const EXTERNAL_URLS = [
    'cdn.tailwindcss.com',
    'cdnjs.cloudflare.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
];

// Instalar Service Worker y cachear recursos estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Intentamos cachear los assets locales
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activar y limpiar caches antiguos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Estrategia de Caching: Stale-While-Revalidate para mayor velocidad
// Intenta servir del cache primero, pero actualiza en segundo plano
self.addEventListener('fetch', (event) => {
    // Solo procesamos peticiones GET
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Verificamos si es una URL externa que queremos cachear (Fuentes, Tailwind, Iconos)
    const isExternalAsset = EXTERNAL_URLS.some(domain => url.hostname.includes(domain));

    // Si es un request del mismo origen o un asset externo permitido
    if (url.origin === location.origin || isExternalAsset) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // Estrategia: Cache First, falling back to network
                // Si está en cache, lo devolvemos
                if (cachedResponse) {
                    // Opcional: Actualizar el cache en segundo plano (Stale-while-revalidate)
                    // Esto asegura que la próxima vez el usuario tenga la versión más reciente
                    fetch(event.request).then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, networkResponse.clone());
                            });
                        }
                    }).catch(() => { /* Error silencioso si no hay red */ });

                    return cachedResponse;
                }

                // Si no está en cache, vamos a la red
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Verificamos si la respuesta es válida antes de cachear
                        if (!networkResponse || networkResponse.status !== 200 ||
                            (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                            return networkResponse;
                        }

                        // Clonamos la respuesta para guardarla en cache y devolverla
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                        return networkResponse;
                    })
                    .catch(() => {
                        // Si todo falla y es una navegación a página, podríamos mostrar una página offline custom
                        // Pero para una SPA, el index.html cacheado suele ser suficiente
                    });
            })
        );
    }
});

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "index.js",
    "/db.js",
    "/styles.css",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

// install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                cache.addAll(FILES_TO_CACHE);
                console.log("Your files were cached successfully!");
            })
            .then(self.skipWaiting())
    );
});

// activate
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache.", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// fetch
self.addEventListener("fetch", event => {
    if (event.request.url.includes('/api/transaction')) {
        console.log('[Service Worker] Fetch(data)', event.request.url);

        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        if (response.status === 200) {
                            cache.put(event.request.url, response.clone());
                        }
                        return response;
                    })
                    .catch(error => {
                        return cache.match(event.request);
                    });
            }).catch(error => console.log(error))
        );
        return;
    }
    event.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                return response || fetch(event.request);
            });
        })
    );
});
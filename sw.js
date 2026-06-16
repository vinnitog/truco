/* Service Worker — cache-first do app shell para uso offline. */
const CACHE_NAME = "truco-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/truco.js",
  "./js/db.js",
  "./js/audio.js",
  "./js/pranks.js",
  "./js/app.js",
  "./icons/icon.svg",
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(ASSETS);
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE_NAME;
      }).map(function (k) {
        return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return (
        cached ||
        fetch(e.request).then(function (res) {
          return res;
        }).catch(function () {
          return caches.match("./index.html");
        })
      );
    })
  );
});

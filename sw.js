var CACHE = "webmap-v5";
var ASSETS = [
  "./",
  "index.html",
  "css/style.css",
  "js/theme.js",
  "js/main.js",
  "js/charts.js",
  "js/monitor.js",
  "js/map.js",
  "js/live.js",
  "js/scene.js",
  "manifest.json"
];
var CDN = [
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/three@0.170.0/build/three.module.js",
  "https://unpkg.com/three@0.170.0/examples/jsm/controls/OrbitControls.js"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS).then(function () {
        return Promise.all(CDN.map(function (url) {
          return fetch(url).then(function (res) {
            if (res && res.ok) return cache.put(url, res);
          }).catch(function () {});
        }));
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE) return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function remember(req, res) {
  var copy = res.clone();
  caches.open(CACHE).then(function (cache) {
    cache.put(req, copy);
  });
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var isCDN = url.hostname === "unpkg.com";
  if (url.origin !== self.location.origin && !isCDN) return;
  if (url.pathname.indexOf("/api/") === 0) return;

  if (isCDN) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        return cached || fetch(req).then(function (res) {
          if (res && res.ok && CDN.indexOf(req.url) !== -1) remember(req, res);
          return res;
        });
      })
    );
    return;
  }

  // File situs sendiri: ambil yang terbaru dulu, cache hanya cadangan saat offline.
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok && res.type === "basic") remember(req, res);
      return res;
    }).catch(function () {
      return caches.match(req).then(function (cached) {
        if (cached) return cached;
        return req.mode === "navigate" ? caches.match("index.html") : Response.error();
      });
    })
  );
});

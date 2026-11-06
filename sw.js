var CACHE = "webmap-v4";
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
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
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

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin && url.hostname !== "unpkg.com") return;
  if (url.pathname.indexOf("/api/") === 0) return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(req, copy);
          });
        } else if (res && res.ok && res.type === "cors" &&
                   url.hostname === "unpkg.com" && CDN.indexOf(req.url) !== -1) {
          var cdnCopy = res.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(req, cdnCopy);
          });
        }
        return res;
      }).catch(function () {
        if (req.mode === "navigate") return caches.match("index.html");
        return cached || Response.error();
      });
      return cached || network;
    })
  );
});
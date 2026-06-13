// WA Fish service worker — offline support.
// Shell (HTML/CSS/JS/data/Leaflet): cache-first, refreshed on new SW version.
// Map tiles: cache-first with a size cap so viewed areas work offline.
// API calls (NOAA/Open-Meteo/USGS): network only — the app keeps its own
// last-good copy in localStorage, so the SW stays out of the way.
var VERSION = "wafish-v3";
var SHELL = VERSION + "-shell";
var TILES = VERSION + "-tiles";
var TILE_CAP = 600;

var SHELL_FILES = [
  "./", "index.html", "manifest.webmanifest",
  "css/style.css",
  "data/spots.js", "data/regs.js", "data/marine_areas.js", "data/species.js",
  "js/fishart.js", "js/conditions.js", "js/scoring.js", "js/waterbodies.js",
  "js/tidechart.js", "js/map.js", "js/ui.js", "js/app.js",
  "icons/icon-192.png", "icons/icon-512.png",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(SHELL).then(function (c) { return c.addAll(SHELL_FILES); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf(VERSION) !== 0; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function trimTiles() {
  caches.open(TILES).then(function (c) {
    c.keys().then(function (keys) {
      if (keys.length > TILE_CAP) {
        Promise.all(keys.slice(0, keys.length - TILE_CAP).map(function (k) { return c.delete(k); }));
      }
    });
  });
}

self.addEventListener("fetch", function (e) {
  var url = e.request.url;
  if (e.request.method !== "GET") return;

  // live data APIs: straight to network (app caches results itself)
  if (url.indexOf("tidesandcurrents.noaa.gov") >= 0 ||
      url.indexOf("open-meteo.com") >= 0 ||
      url.indexOf("waterservices.usgs.gov") >= 0) return;

  // map tiles: cache-first, capped
  if (url.indexOf("tile.openstreetmap.org") >= 0) {
    e.respondWith(
      caches.open(TILES).then(function (c) {
        return c.match(e.request).then(function (hit) {
          if (hit) return hit;
          return fetch(e.request).then(function (res) {
            if (res.ok || res.type === "opaque") { c.put(e.request, res.clone()); trimTiles(); }
            return res;
          });
        });
      })
    );
    return;
  }

  // shell: cache-first, network fallback (and navigation fallback to index)
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(e.request).catch(function () {
        if (e.request.mode === "navigate") return caches.match("index.html");
      });
    })
  );
});

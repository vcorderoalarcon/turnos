/* Turnos · Savia Educa
   Trabajador de red: guarda la app para que abra sin internet.
   Estrategia: primero la red, y si no hay, lo guardado. Así siempre
   ves la versión más nueva cuando hay señal, y funciona igual sin ella.
   Solo toca archivos de este mismo sitio; las tipografías de Google
   quedan fuera y, sin internet, el navegador usa las de respaldo. */

var CACHE = "turnos-v1";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icono-192.png",
  "./icono-512.png",
  "./icono-180.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ARCHIVOS); })
      .catch(function () {})
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url;
  try { url = new URL(e.request.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(CACHE).then(function (c) {
        try { c.put(e.request, copia); } catch (err) {}
      });
      return r;
    }).catch(function () {
      return caches.match(e.request).then(function (guardado) {
        return guardado || caches.match("./index.html");
      });
    })
  );
});

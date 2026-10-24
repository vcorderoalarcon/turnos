/* Turnos · Savia Educa
   Trabajador de red v2.

   Estrategia: caché primero con revalidación en segundo plano.
   Responde al instante con lo guardado y pide la versión nueva por detrás,
   que queda lista para la próxima apertura.

   Por qué no red primero: el wifi de colegio suele conectar sin navegar.
   Con red primero la app se quedaba esperando el tiempo de espera completo
   y parecía que no abría. Con caché primero abre igual de rápido con señal,
   sin señal, o con señal que no sirve.

   Consecuencia al desarrollar: un cambio se ve en la segunda apertura.
   En las herramientas del navegador, Application → Service Workers →
   marcar "Update on reload". */

var CACHE = "turnos-v5";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icono-192.png",
  "./icono-512.png",
  "./icono-180.png",
  "./icono-maskable-192.png",
  "./icono-maskable-512.png",
  "./lora-600.woff2",
  "./lora-700.woff2",
  "./ws-400.woff2",
  "./ws-500.woff2",
  "./ws-600.woff2",
  "./ws-700.woff2"
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
    caches.match(e.request).then(function (guardado) {
      var red = fetch(e.request).then(function (r) {
        if (r && r.ok) {
          var copia = r.clone();
          caches.open(CACHE).then(function (c) {
            try { c.put(e.request, copia); } catch (err) {}
          });
        }
        return r;
      }).catch(function () {
        return guardado || caches.match("./index.html");
      });
      return guardado || red;
    })
  );
});

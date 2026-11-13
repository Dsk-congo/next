/* NextGenIT – application installable.
   Toujours la version en ligne d’abord (aucune page périmée) ; la copie locale ne sert que hors connexion. */
var CACHE = "nextgenit-v47";
var BASE = ["./", "index.html", "mon-espace.html", "etudiant.html", "technicien.html", "connexion.html", "contact.html", "style.css", "pro.css", "marque.css", "theme.js", "store.js", "contenu.js", "site.js", "langue.js", "fichiers.js", "photo.js", "effets.js", "firebase-config.js", "assets/img/embleme.png", "assets/img/logo.png", "assets/img/logo-sombre.png", "assets/img/app-192.png"];
self.addEventListener("install", function (e) { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(BASE.map(function (u) { return c.add(u).catch(function () {}); })); })); });
self.addEventListener("activate", function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== CACHE; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener("fetch", function (e) {
  var r = e.request; if (r.method !== "GET") return;
  var u = new URL(r.url); if (u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(function (rep) { if (rep && rep.ok) { var copie = rep.clone(); caches.open(CACHE).then(function (c) { c.put(r, copie); }); } return rep; }).catch(function () { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match("index.html"); }); }));
});
self.addEventListener("notificationclick", function (e) { e.notification.close(); e.waitUntil(self.clients.openWindow(e.notification.data && e.notification.data.url || "./")); });

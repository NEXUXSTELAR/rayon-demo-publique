// Garde l'appli utilisable sans réseau, dans un dépôt ou un hangar.
const VERSION = "rayon-v21";
const FICHIERS = ["./", "index.html", "styles.css", "data.js", "metiers.js", "graphes.js", "plus.js", "outils.js", "config.js", "blocs.js", "visites.js", "xlsx.js", "documents.js", "etiquettes.js", "espace.js", "app.js", "icone.svg", "manifest.webmanifest", "lib/jsQR.js", "lib/qrcode.js", "img/chaise.webp", "img/table.webp", "img/assiette.webp", "img/verre.webp", "img/nappe.webp", "img/enceinte.webp", "img/groupe.webp", "img/rallonge.webp", "img/housse.webp"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSION).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
// Réseau d'abord pour avoir la dernière version, cache si le réseau ne répond pas.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copie = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copie)); return r; })
      // Sans réseau : la copie en cache, même si l'adresse porte des paramètres (?metier=…, ?profil=…), sinon la page d'accueil
      .catch(() => caches.match(e.request, { ignoreSearch: true })
        .then(r => r || (e.request.mode === "navigate" ? caches.match("index.html", { ignoreSearch: true }) : undefined)))
  );
});

// Garde l'appli utilisable sans réseau, dans un dépôt ou un hangar.
const VERSION = "rayon-v39";
const FICHIERS = ["./", "index.html", "styles.css", "data.js", "metiers.js", "graphes.js", "plus.js", "outils.js", "config.js", "blocs.js", "controles.js", "lieux.js", "groupe.js", "articles.js", "visites.js", "xlsx.js", "documents.js", "etiquettes.js", "espace.js", "liste.js", "modele_liste_articles.xlsx", "app.js", "icone.svg", "manifest.webmanifest", "lib/jsQR.js", "lib/qrcode.js", "polices/atkinson-hyperlegible-next-latin.woff2", "polices/atkinson-hyperlegible-next-latin-ext.woff2", "polices/atkinson-hyperlegible-mono-latin.woff2", "polices/atkinson-hyperlegible-mono-latin-ext.woff2", "img/chaise.webp", "img/table.webp", "img/assiette.webp", "img/verre.webp", "img/nappe.webp", "img/enceinte.webp", "img/groupe.webp", "img/rallonge.webp", "img/housse.webp"];

// En plus, sans bloquer l'installation si un fichier manque : les icônes, la page d'essai.
// Chaque fichier est ajouté à part ; un échec est ignoré, et le fichier sera mis en cache à sa première utilisation en ligne.
const EN_PLUS = ["essai.js", "icone-192.png", "icone-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FICHIERS).then(() => Promise.all(EN_PLUS.map(f => c.add(f).catch(() => {})))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSION).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
// Les photos du métier ouvert : l'appli envoie leur liste après son démarrage (app.js, garderPhotos).
// Celles qui manquent sont mises en cache une à une ; un fichier absent n'arrête rien.
self.addEventListener("message", e => {
  const d = e.data || {};
  if (d.type !== "photos" || !Array.isArray(d.liste)) return;
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(d.liste.map(u => c.match(u).then(r => r || c.add(u).catch(() => {}))))));
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

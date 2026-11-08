"use strict";

const CLE = "rayon-demo-v10";
const CLE_THEME = "rayon-theme";
const EUR_XOF = 655.957;
const SEUIL_VALIDATION_EUR = 500;

/* Pictogrammes dessinés pour le projet, tous sur la même grille de 48. */
const P = d => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  logo: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="7" width="28" height="18" rx="4" fill="currentColor"/><rect x="6" y="11" width="10" height="10" rx="1.5" style="fill:var(--marque)"/><rect x="8.5" y="13.5" width="5" height="5" fill="currentColor"/><path d="M19 12h7M19 16h5M19 20h7" style="stroke:var(--carte)" stroke-width="2"/></svg>',
  scan: P('<path d="M6 16V8a2 2 0 0 1 2-2h8M32 6h8a2 2 0 0 1 2 2v8M42 32v8a2 2 0 0 1-2 2h-8M16 42H8a2 2 0 0 1-2-2v-8"/><rect x="15" y="15" width="18" height="18" rx="2"/><path d="M21 21h6v6h-6z" fill="currentColor"/>'),
  sortie: P('<path d="M8 24h26M26 14l10 10-10 10"/><path d="M42 8v32"/>'),
  retour: P('<path d="M40 24H14M22 14 12 24l10 10"/><path d="M6 8v32"/>'),
  compter: P('<rect x="8" y="6" width="32" height="36" rx="3"/><path d="M15 16h4M15 24h4M15 32h4M24 16h10M24 24h10M24 32h10"/>'),
  perte: P('<path d="M24 6 4 40h40z"/><path d="M24 18v10M24 34v1"/>'),
  kit: P('<rect x="6" y="18" width="36" height="22" rx="3"/><path d="M16 18v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6M6 27h36"/>'),
  camion: P('<path d="M4 12h24v22H4zM28 20h9l7 7v7H28z"/><circle cx="12" cy="36" r="4" style="fill:var(--carte)"/><circle cx="36" cy="36" r="4" style="fill:var(--carte)"/>'),
  loupe: P('<circle cx="21" cy="21" r="12"/><path d="m30 30 12 12"/>'),
  jour: P('<rect x="6" y="9" width="36" height="33" rx="3"/><path d="M6 18h36M16 5v8M32 5v8M14 26h6M14 33h6M26 26h8"/>'),
  releve: P('<path d="M8 40V24M18 40V12M28 40V20M38 40V8M4 42h40"/>'),
  materiel: P('<path d="M6 40V18L24 8l18 10v22M14 40V26h20v14M14 33h20"/>'),
  bon: P('<path d="M12 4h17l9 9v31H12z"/><path d="M29 4v9h9M18 22h14M18 29h14M18 36h8"/>'),
  journal: P('<path d="M8 10h32M8 19h32M8 28h20M8 37h20"/>'),
  docs: P('<path d="M14 4h16l8 8v28H14z"/><path d="M10 10v34h22"/>'),
  abo: P('<path d="M6 14h36M6 34h36"/><circle cx="30" cy="14" r="5" style="fill:var(--carte)"/><circle cx="16" cy="34" r="5" style="fill:var(--carte)"/>'),
  argent: P('<rect x="4" y="12" width="40" height="24" rx="3"/><circle cx="24" cy="24" r="6"/><path d="M10 18v12M38 18v12"/>'),
  imprimer: P('<path d="M12 18V6h24v12M12 34H6V18h36v16h-6"/><path d="M12 28h24v14H12z"/>'),
  partager: P('<circle cx="12" cy="24" r="5"/><circle cx="36" cy="12" r="5"/><circle cx="36" cy="36" r="5"/><path d="m16.5 21.5 15-7M16.5 26.5l15 7"/>'),
  excel: P('<rect x="6" y="6" width="36" height="36" rx="3"/><path d="M6 18h36M6 30h36M18 6v36"/>'),
  etiquette: P('<path d="M6 8h18l18 18-16 16L6 24z"/><circle cx="15" cy="17" r="3"/>'),
  pers_terrain: P('<circle cx="24" cy="10" r="5"/><path d="M14 44V30l4-10h12l4 10v14"/><rect x="16" y="26" width="16" height="10" rx="1" fill="currentColor"/>'),
  pers_bureau: P('<rect x="10" y="6" width="28" height="36" rx="3"/><path d="M18 6v4h12V6M16 20l3 3 6-6M16 32h16"/>'),
  pers_direction: P('<path d="M6 40h36M10 40V28M20 40V18M30 40V24M40 40V10"/>'),
  reglages: P('<circle cx="24" cy="24" r="6"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2"/>'),
  cadenas: P('<rect x="9" y="21" width="30" height="21" rx="3"/><path d="M16 21v-6a8 8 0 0 1 16 0v6M24 29v6"/>'),
  equipe: P('<circle cx="17" cy="15" r="6"/><circle cx="33" cy="17" r="5"/><path d="M5 40v-4a10 10 0 0 1 20 0v4M28 40v-3a8 8 0 0 1 15-4"/>'),
  effacer: P('<path d="M17 10h23a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H17L5 24z"/><path d="m22 18 12 12M34 18 22 30"/>'),
  fleche: P('<path d="M10 24h28M28 14l10 10-10 10"/>'),
};

/* ---------------- Thème : clair par défaut, réglé par appareil ---------------- */
const THEMES = { clair: "Clair", sombre: "Anthracite", nuit: "Nuit bleue", auto: "Comme le téléphone" };
function choixTheme() { try { return localStorage.getItem(CLE_THEME) || "clair"; } catch (e) { return "clair"; } }
function appliquerTheme() {
  const c = choixTheme();
  const t = c === "auto" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair") : c;
  document.documentElement.dataset.theme = t;
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = getComputedStyle(document.documentElement).getPropertyValue("--fond").trim();
}
appliquerTheme();
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (choixTheme() === "auto") { appliquerTheme(); rendre(); } });

let S = charger();
let session = null;      // { uid, nom, profil, admin }
let verrouille = false;   // écran verrouillé : la personne retape son code
let vue = { nom: "profil", arg: null };

/* ---------------- Stockage ---------------- */
function charger() {
  try { const b = localStorage.getItem(CLE); if (b) { const s = JSON.parse(b); if (s.version === 10) return s; } } catch (e) { /* stockage bloqué : données de démo */ }
  return seedMouvements(SEED());
}
function sauver() { try { localStorage.setItem(CLE, JSON.stringify(S)); } catch (e) { /* mode privé */ } }

/* ---------------- Calculs ---------------- */
const SIGNE = { "Inventaire initial": 1, "Entrée": 1, "Retour": 1, "Prêt": -1, "Perte": -1, "Sortie": -1, "Ajustement": 1 };
const art = id => S.articles.find(a => a.id === id);
const actif = c => !!S.modules[c];
const stock = id => S.mouvements.filter(m => m.article === id).reduce((t, m) => t + SIGNE[m.type] * m.qte, 0);
function dehors(id) {
  const p = {};
  S.mouvements.filter(m => (!id || m.article === id) && m.evenement).forEach(m => {
    const k = m.article + "|" + m.evenement;
    p[k] = (p[k] || 0) + (m.type === "Prêt" ? m.qte : ["Retour", "Perte"].includes(m.type) ? -m.qte : 0);
  });
  return Object.entries(p).filter(([, q]) => q > 0).map(([k, qte]) => ({ article: k.split("|")[0], evenement: k.split("|")[1], qte }));
}
function etat(a) {
  const q = stock(a.id);
  if (a.type === "equip") return q >= 1 ? { c: "", t: "Au dépôt" } : { c: "sorti", t: "Chez un client" };
  if (q <= 0) return { c: "zero", t: "Plus aucun" };
  if (q <= a.seuil) return { c: "bas", t: "Bientôt à commander" };
  return { c: "", t: "Disponible" };
}
const pertesN = j => S.mouvements.filter(m => m.type === "Perte" && m.date >= Date.now() - j * 86400000);
const valeurM = m => m.qte * art(m.article).prix;

/* ---------------- Format ---------------- */
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function argent(eur) {
  if (S.monnaie === "XOF") return Math.round(eur * EUR_XOF).toLocaleString("fr-FR") + " FCFA";
  return eur.toLocaleString("fr-FR", { maximumFractionDigits: eur >= 100 ? 0 : 2 }) + " €";
}
const quand = t => { const d = new Date(t); return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); };
const img = a => `<div class="vignette"><img src="img/${a.img}.webp" alt="" loading="lazy" width="360" height="360"></div>`;
const pic = ic => `<div class="vignette pic">${ic}</div>`;
const initiales = n => n.split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();
const avatar = (u, grand) => `<span class="avatar ${u.role === "direction" ? "direction" : ""} ${grand ? "grand" : ""}" aria-hidden="true">${esc(initiales(u.nom))}</span>`;
// Jauge en anneau : valeur sur maximum, chiffre au centre
function anneau(val, max, coul, centre, sous, petit) {
  const r = 52, c = 2 * Math.PI * r, f = max > 0 ? Math.max(0, Math.min(1, val / max)) : 0;
  return `<div class="anneau ${petit ? "petit" : ""}" role="img" aria-label="${esc(sous)} : ${esc(String(centre))}"><svg viewBox="0 0 120 120"><circle class="piste" cx="60" cy="60" r="${r}" fill="none" stroke-width="10"/><circle cx="60" cy="60" r="${r}" fill="none" stroke="${coul}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(f * c).toFixed(1)} ${c.toFixed(1)}"/></svg><div class="centre"><b>${centre}</b><small>${sous}</small></div></div>`;
}
const couleurEtat = e => e.c === "zero" || e.c === "sorti" ? "var(--alerte)" : e.c === "bas" ? "var(--attention)" : "var(--retour)";
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* ---------------- Mouvements ---------------- */
function mouvement(article, type, qte, extra) {
  S.mouvements.push(Object.assign({ id: "MV-" + String(S.mouvements.length + 1).padStart(5, "0"), date: Date.now(), profil: session.profil, qui: session.nom, article, type, qte, evenement: "", motif: "" }, extra || {}));
  verifierSeuil(article);
  sauver();
}
function verifierSeuil(id) {
  const a = art(id);
  if (a.type === "equip") return;
  const q = stock(id);
  if (q > a.seuil) return;
  const txt = q <= 0 ? `Plus aucun en stock : ${a.nom} (${a.id}).` : `${a.nom} : il en reste ${q}, seuil ${a.seuil}.`;
  S.alertes.unshift({ date: Date.now(), article: id, txt });
  ["AL-SMS", "AL-WA"].forEach(c => { if (actif(c)) S.messages.unshift({ date: Date.now(), canal: c === "AL-SMS" ? "SMS" : "WhatsApp", txt }); });
}

/* ---------------- Navigation ---------------- */
function aller(nom, arg) { vue = { nom, arg }; rendre(); window.scrollTo(0, 0); }
function toast(t) {
  $$(".toast").forEach(x => x.remove());
  const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t;
  document.body.appendChild(d); setTimeout(() => d.remove(), 3000);
}
const DEMO = `<div class="demo">Démonstration · données fictives</div>`;

function rendre() {
  if (typeof rafraichirPalette === "function") rafraichirPalette();
  const r = $("#racine");
  if (!session && vue.nom === "pin") r.innerHTML = vuePin(vue.arg);
  else if (!session) r.innerHTML = vueProfil();
  else if (verrouille) r.innerHTML = vuePin(session.uid);
  else if (session.profil === "terrain") r.innerHTML = cadreTerrain();
  else r.innerHTML = cadreBureau(session.profil);
  brancher();
  if (vue.nom === "etiquettes") dessinerQr();
  dessinerTour();
}

/* ---------------- Connexion : qui êtes-vous, puis votre code ---------------- */
const boutonReglages = `<button class="rond" data-act="reglages" aria-label="Réglages de l'appareil">${I.reglages}</button>`;
function vueProfil() {
  return `${DEMO}<div class="accueil">
    <div class="barre"><div class="marque">${I.logo}<span>Stock démo</span></div>${boutonReglages}</div>
    <h1>Qui êtes-vous ?</h1>
    <p class="sous">Touchez votre nom, puis tapez votre code personnel.</p>
    <div class="profils">${S.equipe.map(u => `<button data-profil="${u.role}" data-uid="${u.id}" ${u.actif ? "" : "disabled"}>${avatar(u)}<div><b>${esc(u.nom)}</b><span>${esc(u.poste)}${u.actif ? "" : " · accès retiré"}</span></div><span class="fleche">${I.fleche}</span></button>`).join("")}</div>
    <p class="indice">Codes de démonstration : ${EQUIPE_DEMO.map(u => `${esc(u.nom)} <span class="code">${u.pin}</span>`).join(" · ")}</p>
    ${(S.metier || "loueur") === "loueur" ? `<button class="btn plein" data-act="tour" style="margin-top:18px">Montrer la démo en 7 étapes</button>` : `<p class="indice" style="margin-top:14px">Démo réglée pour : <b>${esc(metier().nom)}</b></p>`}
    <p style="margin-top:18px"><button class="lien" data-act="reinit">Remettre la démo à zéro</button></p>
  </div>`;
}
let saisiePin = "";
function vuePin(uid) {
  const u = S.equipe.find(x => x.id === uid); if (!u) return vueProfil();
  const e = S.essais[uid] || {}, bloque = e.jusqua && e.jusqua > Date.now();
  const reste = bloque ? Math.ceil((e.jusqua - Date.now()) / 1000) : 0;
  return `${DEMO}<div class="accueil"><div class="barre">${verrouille ? `<div class="marque">${I.cadenas}<span>Écran verrouillé</span></div>` : `<button class="btn petit" data-act="retourListe">← Changer de personne</button>`}${boutonReglages}</div>
    <div class="pin"><div class="qui-pin">${avatar(u, true)}<h1>${esc(u.nom)}</h1><span class="sous" style="margin:0">${esc(u.poste)}</span></div>
    <div class="points" aria-hidden="true">${[0, 1, 2, 3].map(i => `<i class="${i < saisiePin.length ? "plein" : ""}"></i>`).join("")}</div>
    <p class="message" role="alert">${bloque ? `Trop d'essais. Réessayez dans ${reste} s.` : e.n ? `Code incorrect. Encore ${5 - e.n} essai${5 - e.n > 1 ? "s" : ""} avant le blocage.` : ""}</p>
    <div class="clavier">${["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(n => `<button class="touche" data-touche="${n}" ${bloque ? "disabled" : ""}>${n}</button>`).join("")}
      <button class="touche discret" data-act="${verrouille ? "sortir" : "retourListe"}">${verrouille ? "Changer" : "Retour"}</button>
      <button class="touche" data-touche="0" ${bloque ? "disabled" : ""}>0</button>
      <button class="touche discret" data-touche="x" aria-label="Effacer">${I.effacer}</button></div>
    </div></div>`;
}
function taper(ch) {
  const uid = verrouille ? session.uid : vue.arg;
  if (ch === "x") { saisiePin = saisiePin.slice(0, -1); return rendre(); }
  if (saisiePin.length >= 4) return;
  saisiePin += ch; rendre();
  if (saisiePin.length < 4) return;
  const u = S.equipe.find(x => x.id === uid), ok = !!(u && u.actif && u.empreinte === empreinte(uid, saisiePin));
  saisiePin = "";
  S.connexions.unshift({ date: Date.now(), uid, nom: u ? u.nom : "?", ok, motif: verrouille ? "Déverrouillage" : "Connexion" });
  S.connexions = S.connexions.slice(0, 200);
  if (ok) {
    delete S.essais[uid]; sauver();
    if (verrouille) { verrouille = false; activite(); return rendre(); }
    return ouvrirSession(u);
  }
  const e = S.essais[uid] = S.essais[uid] || { n: 0 };
  e.n += 1;
  if (e.n >= 5) { e.jusqua = Date.now() + 30000; e.n = 0; setTimeout(rendre, 30500); }
  sauver(); rendre();
  const pts = $(".points"); if (pts) pts.classList.add("erreur");
  if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
}
function ouvrirSession(u) {
  session = { uid: u.id, nom: u.nom, profil: u.role, admin: !!u.admin };
  vue = { nom: PROFILS[u.role].accueil }; lienProfond(); activite(); rendre();
}
/* Verrouillage automatique après un temps sans toucher l'écran (réglé par le gérant) */
let minuteur = null;
function activite() {
  clearTimeout(minuteur);
  const min = S.reglages.verrou;
  if (session && !verrouille && min > 0) minuteur = setTimeout(() => {
    if (session && !document.querySelector(".camera")) { verrouille = true; saisiePin = ""; $$(".feuille").forEach(f => f.remove()); rendre(); }
  }, min * 60000);
}
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, activite, { passive: true }));

/* Réglages de l'appareil : le thème, et de quoi verrouiller ou changer de personne */
function feuilleReglages() {
  const ap = { clair: ["#f2f3f5", "#ffffff", "#f4b223"], sombre: ["#141619", "#1e2125", "#f5b82e"], nuit: ["#111a2c", "#182339", "#e9eef8"], auto: ["#f2f3f5", "#141619", "#f5b82e"] };
  const c = choixTheme();
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tr"><h1 id="tr" style="font-size:26px">Réglages de l'appareil</h1>
    <p class="sous">Le thème ne change que l'affichage de ce téléphone. Les couleurs des actions gardent leur sens : orange, ça part ; vert, ça revient.</p>
    <div class="themes" role="radiogroup" aria-label="Thème">${Object.entries(THEMES).map(([k, n]) => `<label><input type="radio" name="theme" value="${k}" ${k === c ? "checked" : ""}><span class="apercu" style="background:${ap[k][0]}"><i style="background:${ap[k][1]}"></i><i style="background:${ap[k][2]}"></i></span>${n}</label>`).join("")}</div>
    ${session ? `<div class="valider" style="grid-template-columns:1fr 1fr"><button class="btn" data-a="verrouiller">${I.cadenas}Verrouiller</button><button class="btn" data-a="sortir">Changer de personne</button></div>` : ""}
    <div class="valider" style="grid-template-columns:1fr"><button class="btn plein" data-x>Fermer</button></div></div>`);
  f.querySelectorAll("input[name=theme]").forEach(i => i.onchange = () => { try { localStorage.setItem(CLE_THEME, i.value); } catch (e) { /* stockage bloqué */ } appliquerTheme(); rendre(); });
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { f.remove(); ACTIONS[b.dataset.a](); });
}

/* =================================================================
   PROFIL TERRAIN : une action à la fois, des photos, de gros boutons
   ================================================================= */
function cadreTerrain() {
  const corps = ({ terrain: tAccueil, objet: tObjet, kits: tKits, recuperer: tRecuperer, retourEv: tRetourEvenement, chercher: tChercher, jour: tJour, bon: tBon, preparer: tPreparer, preparation: tPreparation, facture: vFacture, reception: tReception, receptionCmd: tReceptionCmd })[vue.nom] || tAccueil;
  const u = S.equipe.find(x => x.id === session.uid) || { nom: session.nom, role: "terrain" };
  return `${DEMO}<header class="t-haut">
      ${vue.nom === "terrain" ? `<div class="qui">${avatar(u)}<span>${esc(session.nom)}</span></div>` : `<button class="btn petit" data-aller="terrain">← Accueil</button>`}
      <div class="outils"><button class="rond" data-act="verrouiller" aria-label="Verrouiller l'écran">${I.cadenas}</button>${boutonReglages}</div>
    </header><main class="t-main">${corps(vue.arg)}</main>`;
}
function tAccueil() {
  const n = aDesPrets() ? new Set(dehors().map(d => d.evenement)).size : 0;
  const attendues = S.commandes.filter(c => ["Envoyée", "Reçue en partie"].includes(c.statut)).length;
  return `
  <button class="t-scan" data-act="camera">${I.scan}<b>Scanner</b><span>Visez l'étiquette de l'objet</span></button>
  <form class="t-ou" data-form="code"><label class="cache" for="code">Code de l'étiquette</label>
    <input id="code" name="code" placeholder="ou tapez le code" autocomplete="off"><button class="btn plein petit" type="submit">OK</button></form>
  ${actif("MO-RES") ? tuilePreparer() : ""}
  <div class="t-tuiles">
    ${actif("MO-KIT") && S.kits.length ? `<button class="t-tuile" data-aller="kits"><span class="pastille">${I.kit}</span><div><b>Sortir un kit</b><small>Tout un ensemble d'un coup</small></div></button>` : ""}
    ${aDesPrets() ? `<button class="t-tuile" data-aller="recuperer"><span class="pastille">${I.retour}</span><div><b>${V("retourTitre")}</b><small>${n} ${V("retourSous")}</small></div></button>` : ""}
    <button class="t-tuile" data-aller="reception"><span class="pastille">${I.camion}</span><div><b>Réceptionner une livraison</b><small>${attendues} attendue${attendues > 1 ? "s" : ""}</small></div></button>
    <button class="t-tuile" data-aller="chercher"><span class="pastille">${I.loupe}</span><div><b>Chercher un objet</b><small>Sans étiquette sous la main</small></div></button>
    <button class="t-tuile" data-aller="jour"><span class="pastille">${I.jour}</span><div><b>Ma journée</b><small>Ce que j'ai enregistré</small></div></button>
  </div>`;
}
function tObjet(id) {
  const a = art(id); if (!a) return `<p>Objet introuvable.</p>`;
  const q = stock(id), e = etat(a), pret = logique(a) === "pret";
  const jauge = a.type === "equip" ? `<div class="t-stock">${q >= 1 ? "Ici" : "Sorti"}</div>` : anneau(q, a.cible, couleurEtat(e), q, `en stock sur ${a.cible}`);
  const lots = metier().dlc ? lotsEnStock(id) : [];
  const actions = pret ? `
    <button class="t-action sortie" data-mvt="Prêt">${I.sortie}<span>${V("pretSortie")}<small>${V("pretSortieSous")}</small></span></button>
    <button class="t-action retour" data-mvt="Retour">${I.retour}<span>${V("pretRetour")}<small>${V("pretRetourSous")}</small></span></button>` : `
    <button class="t-action sortie" data-mvt="Sortie">${I.sortie}<span>${V("prendre")}<small>${V("prendreSous")}</small></span></button>
    <button class="t-action retour" data-mvt="Surplus">${I.retour}<span>${V("remettre")}<small>${V("remettreSous")}</small></span></button>`;
  return `<div class="t-objet">${img(a)}<span class="code">${a.id}</span><h1>${esc(a.nom)}</h1>
    ${jauge}<div style="margin-top:8px"><span class="etat ${e.c}"><i></i>${e.t}</span></div>
    ${lots.length ? `<p class="lot-premier">À sortir en premier : ${lots[0].qte} avec date limite au <b>${dateFr(lots[0].dlc)}</b></p>` : ""}</div>
  <div class="t-actions">${actions}
    <button class="t-action compter" data-mvt="Compter">${I.compter}<span>Compter<small>Je vérifie combien il y en a</small></span></button>
    <button class="t-action perte" data-mvt="Perte">${I.perte}<span>${metier().dlc ? "Périmé, cassé ou perdu" : "Cassé ou perdu"}</span></button>
  </div>`;
}
function tChercher(filtre) {
  const f = (filtre || "").toLowerCase();
  const l = S.articles.filter(a => !f || a.nom.toLowerCase().includes(f));
  return `<h1>Chercher un objet</h1>
  <form class="t-ou" data-form="cherche"><label class="cache" for="q">Nom</label><input id="q" name="q" value="${esc(filtre || "")}" placeholder="chaise, verre…" style="text-transform:none;font-family:inherit"><button class="btn plein petit">OK</button></form>
  <ul class="t-liste">${l.map(a => `<li><button data-objet="${a.id}">${img(a)}<span><b>${esc(a.nom)}</b><small>${esc((S.emplacements.find(x => x.id === a.emp) || {}).nom || "")}</small></span><span class="n">${stock(a.id)}</span></button></li>`).join("") || `<li class="vide">Rien trouvé.</li>`}</ul>`;
}
function tJour() {
  const debut = new Date(); debut.setHours(0, 0, 0, 0);
  const l = S.mouvements.filter(m => m.date >= debut.getTime() && m.profil === "terrain").reverse();
  return `<h1>Ma journée</h1><p class="sous">${l.length} enregistrement${l.length > 1 ? "s" : ""} aujourd'hui.</p>
  <ul class="t-liste">${l.map(m => { const a = art(m.article); return `<li><button data-objet="${a.id}">${img(a)}<span><b>${esc(m.type)} · ${esc(a.nom)}</b><small>${quand(m.date)}${(m.evenement || m.imputation) ? " · " + esc(m.evenement || m.imputation) : ""}</small></span><span class="n">${m.qte}</span></button></li>`; }).join("") || `<li class="vide">Rien encore aujourd'hui. Scannez un objet pour commencer.</li>`}</ul>`;
}
function tKits() {
  return `<h1>Sortir un kit</h1><p class="sous">Choisissez le kit, puis le nombre et l'événement.</p>
  <ul class="t-liste">${S.kits.map(k => {
    const ok = k.lignes.every(([id, q]) => stock(id) >= q);
    return `<li><button data-kit="${k.id}">${pic(I.kit)}<span><b>${esc(k.nom)}</b><small>${k.lignes.map(([id, q]) => q + " × " + esc(art(id).nom)).join(" · ")}</small></span><span class="etat ${ok ? "" : "zero"}"><i></i></span></button></li>`;
  }).join("")}</ul>`;
}
function tRecuperer() {
  const parEv = {};
  dehors().forEach(d => { (parEv[d.evenement] = parEv[d.evenement] || []).push(d); });
  return `<h1>Retour d'un événement</h1><p class="sous">Touchez l'événement qui revient. Tout ce qui était parti s'affiche : vous ne corrigez que ce qui manque.</p>
  <ul class="t-liste">${Object.entries(parEv).map(([ev, l]) => `<li><button data-ev="${esc(ev)}">${pic(I.camion)}<span><b>${esc(ev)}</b><small>${l.length} sorte${l.length > 1 ? "s" : ""} d'objets</small></span><span class="n">${l.reduce((t, d) => t + d.qte, 0)}</span></button></li>`).join("") || `<li class="vide">Tout est rentré au dépôt.</li>`}</ul>`;
}
function tRetourEvenement(ev) {
  const l = dehors().filter(d => d.evenement === ev);
  if (!l.length) return `<h1>Tout est revenu</h1><button class="btn" data-aller="terrain">Accueil</button>`;
  return `<h1>${esc(ev)}</h1><p class="sous">Indiquez ce qui revient vraiment. Ce qui manque sera noté à refacturer.</p>
  <form data-form="retourEv"><ul class="t-liste">${l.map(d => { const a = art(d.article); return `<li><div class="t-retour">${img(a)}<span><b>${esc(a.nom)}</b><small>parti : ${d.qte}</small></span>
    <input type="number" inputmode="numeric" min="0" max="${d.qte}" name="${a.id}" value="${d.qte}" aria-label="Revenus : ${esc(a.nom)}"></div></li>`; }).join("")}</ul>
  <div class="valider"><button type="button" class="btn" data-aller="recuperer">Annuler</button><button class="btn plein" style="background:var(--retour);border-color:var(--retour);color:#fff">Valider le retour</button></div></form>`;
}
/* Le bon remis au client est la sortie papier du magasinier. */
function tuilePreparer() {
  const p = S.reservations.filter(r => ["Confirmée", "Préparée"].includes(r.statut) && r.debut <= isoJour(Date.now() + 10 * JOUR_MS)).length;
  return `<button class="t-tuile large" data-aller="preparer"><span class="pastille">${I.camion}</span><div><b>Préparer un départ</b><small>${p} départ${p > 1 ? "s" : ""} prévu${p > 1 ? "s" : ""} dans les 10 jours</small></div></button>`;
}
function tBon(arg) {
  const b = bonDe(arg);
  if (!b) return tAccueil();
  const lignes = b.lignes.map(([id, q]) => `<tr><td>${esc(art(id).nom)}</td><td>${art(id).id}</td><td style="text-align:right">${q}</td></tr>`).join("");
  const manq = (b.manquants || []).map(([id, q]) => `<tr><td>${esc(art(id).nom)}</td><td style="text-align:right">${q}</td></tr>`).join("");
  const loueur = (S.equipe.find(x => x.id === session.uid) || {}).nom || "";
  return `<div class="feuille-doc"><h1>${b.type === "sortie" ? "Bon de sortie" : "Bon de retour"}</h1>
    <p>${esc(b.evenement)}<br>${quand(b.date)} · n° ${b.id}</p>
    <table><thead><tr><th>Objet</th><th>Code</th><th style="text-align:right">${b.type === "sortie" ? "Remis" : "Rendu"}</th></tr></thead><tbody>${lignes || `<tr><td colspan="3">Rien n'est revenu.</td></tr>`}</tbody></table>
    ${manq ? `<p><b>Manquants ou cassés, à refacturer :</b></p><table><tbody>${manq}</tbody></table>` : ""}
    ${b.photos.length ? `<div class="photos">${b.photos.map(p => `<img src="${p}" alt="Photo jointe au bon">`).join("")}</div>` : ""}
    <div class="sign"><div>Pour le loueur<br><b>${esc(loueur)}</b></div><div>Pour le client${b.signature ? `<img class="sig" src="${b.signature}" alt="Signature du client"><b>${esc(b.signataire)}</b> · ${quand(b.signeLe)}` : ""}</div></div></div>
  <div class="t-actions pas-imprimer">
    ${b.signature ? "" : `<button class="btn plein" data-signer="${b.id}">Faire signer le client</button>`}
    ${b.photos.length < 4 ? `<label class="btn">Ajouter des photos<input type="file" accept="image/*" capture="environment" multiple data-photos="${b.id}" class="cache"></label>` : ""}
    ${manq ? `<button class="btn" data-facture="${esc(b.evenement)}">Voir la facture de casse</button>` : ""}
    <button class="btn ${b.signature ? "plein" : ""}" data-act="partager">${I.partager}Envoyer au client</button>
    <button class="btn" data-act="imprimer">${I.imprimer}Imprimer</button>
    <button class="btn" data-aller="terrain">Terminé</button></div>`;
}
function texteBon(arg) {
  const b = bonDe(arg);
  const l = b.lignes.map(([id, q]) => `- ${art(id).nom} : ${q}`).join("\n");
  const m = (b.manquants || []).map(([id, q]) => `- ${art(id).nom} : ${q}`).join("\n");
  return `${b.type === "sortie" ? "Bon de sortie" : "Bon de retour"} · ${b.evenement} · ${quand(b.date)}\n${l}${m ? "\nManquants à refacturer :\n" + m : ""}${b.signature ? "\nSigné par " + b.signataire + " le " + quand(b.signeLe) : ""}`;
}

/* =================================================================
   PROFILS BUREAU ET DIRECTION
   ================================================================= */
function navBureau(p) {
  if (p === "direction") return [["direction", "Synthèse", I.argent]].concat(actif("MO-RES") ? [["reservations", "Réservations", I.jour]] : []).concat([["docs", "Documents", I.docs]]).concat(session.admin ? [["equipe", "Équipe et accès", I.equipe]] : []).concat([["installation", "Installation", I.abo]]);
  const l = [["releve", "Relevé", I.releve]].concat(actif("MO-RES") ? [["reservations", "Réservations", I.jour]] : []).concat([["materiel", "Matériel", I.materiel], ["scanner", "Scanner", I.scan]]);
  if (actif("MO-CMD")) l.push(["commandes", "Commandes", I.bon]);
  l.push(["journal", "Journal", I.journal], ["docs", "Documents", I.docs]);
  return l;
}
function cadreBureau(p) {
  const nav = navBureau(p);
  const vues = { releve: bReleve, materiel: bMateriel, fiche: bFiche, commandes: bCommandes, journal: bJournal, docs: bDocs, etiquettes: bEtiquettes,
    inventairePapier: bInventairePapier, refacturer: bRefacturer, rapport: dRapport, direction: dSynthese, abonnement: dInstallation, installation: dInstallation, scanner: bScanner, equipe: dEquipe, reservations: bReservations, reservation: bReservation, facture: vFacture };
  const corps = vues[vue.nom] || (p === "direction" ? dSynthese : bReleve);
  const parent = { fiche: "materiel", etiquettes: "docs", inventairePapier: "docs", refacturer: "docs", rapport: "docs", reservation: "reservations", facture: "docs" };
  const courant = nav.some(([k]) => k === vue.nom) ? vue.nom : parent[vue.nom];
  return `<div class="${p === "direction" ? "d" : "b"}">${DEMO}
    <header class="b-haut"><div class="marque">${I.logo}<span>Stock démo</span></div>
      <div class="qui"><span class="nom"><b>${esc(session.nom)}</b>${esc((S.equipe.find(x => x.id === session.uid) || {}).poste || PROFILS[p].nom)}</span>${avatar(S.equipe.find(x => x.id === session.uid) || { nom: session.nom, role: p })}
      <button class="rond" data-act="verrouiller" aria-label="Verrouiller l'écran">${I.cadenas}</button>${boutonReglages}</div></header>
    <nav class="b-nav" aria-label="Navigation">${nav.map(([k, t, ic]) => `<button data-aller="${k}" ${k === courant ? 'aria-current="page"' : ""}>${ic}<span>${t}</span></button>`).join("")}</nav>
    <main class="${p === "direction" ? "d-main" : "b-main"}">${corps(vue.arg)}</main></div>`;
}
function bReleve() {
  const rupt = S.articles.filter(a => etat(a).c === "zero").length;
  const bas = S.articles.filter(a => etat(a).c === "bas").length;
  const out = dehors().reduce((t, d) => t + d.qte, 0);
  const pts = pertesN(30).reduce((t, m) => t + m.qte, 0);
  return `<h1>${V("parc")}</h1><p class="sous">${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
  <div class="chiffres">
    <button data-aller="materiel" data-arg="alerte"><b class="${rupt ? "rouge" : ""}">${rupt}</b><span>Plus aucun en stock</span></button>
    <button data-aller="materiel" data-arg="alerte"><b>${bas}</b><span>Bientôt à commander</span></button>
    ${aDesPrets() ? `<button data-aller="materiel" data-arg="dehors"><b>${out}</b><span>${V("chez")}</span></button>` : `<button data-aller="journal"><b>${S.mouvements.filter(m => m.type === "Sortie" && m.date >= Date.now() - 7 * 86400000).reduce((t, m) => t + m.qte, 0)}</b><span>${V("sortiesMot")} en 7 jours</span></button>`}
    <button data-aller="refacturer"><b class="${pts ? "rouge" : ""}">${pts}</b><span>${metier().dlc ? "Périmées, cassées ou perdues" : "Cassées ou perdues"}, 30 jours</span></button>
  </div>
  ${actif("MO-CMD") && (rupt || bas) ? `<p style="margin-top:16px"><button class="btn plein" data-aller="commandes">${I.bon}Préparer les commandes</button></p>` : ""}
  ${metier().dlc ? blocPeremption() : ""}
  <h2>${aDesPrets() ? "Le cycle du matériel" : "Le mouvement du stock"}</h2>
  ${cycle()}
  <h2>En un coup d'œil</h2>
  <div class="graphes deuxcol">${gMouvements14()}${aDesPrets() ? gDepotClients() : gTopLoues()}</div>
  <h2>Alertes</h2>
  ${S.alertes.length ? `<ul class="b-liste">${S.alertes.slice(0, 6).map(x => { const a = art(x.article); return `<li><button class="l" data-fiche="${a.id}">${img(a)}<span><b>${esc(x.txt)}</b><small>${quand(x.date)}</small></span><span></span></button></li>`; }).join("")}</ul>` : `<p class="vide">Pas d'alerte depuis le début de la démo.</p>`}
  ${S.messages.length ? `<h2>Messages envoyés</h2>${S.messages.slice(0, 4).map(m => `<div class="msg"><small>${m.canal} · ${quand(m.date)} · simulation</small>${esc(m.txt)}</div>`).join("")}` : ""}`;
}
// Où en est le parc : au dépôt, chez les clients, revenu et perdu sur 7 jours
function cycle() {
  const sem = Date.now() - 7 * 86400000, pret = aDesPrets();
  const depot = S.articles.reduce((t, a) => t + Math.max(0, stock(a.id)), 0);
  const deuxieme = pret ? dehors().reduce((t, d) => t + d.qte, 0) : S.mouvements.filter(m => m.type === "Sortie" && m.date >= sem).reduce((t, m) => t + m.qte, 0);
  const rev = S.mouvements.filter(m => (pret ? m.type === "Retour" : m.type === "Entrée") && m.date >= sem).reduce((t, m) => t + m.qte, 0);
  const perdu = S.mouvements.filter(m => m.type === "Perte" && m.date >= sem).reduce((t, m) => t + m.qte, 0);
  const f = n => n >= 10000 ? Math.round(n / 1000) + " k" : n.toLocaleString("fr-FR");
  return `<div class="cycle">
    <button data-aller="materiel" data-arg="tous"><span class="rondv" style="--c:var(--depot)">${f(depot)}</span><span>En stock</span></button>
    <button data-aller="${pret ? "materiel" : "journal"}" data-arg="dehors"><span class="rondv" style="--c:var(--sortie)">${f(deuxieme)}</span><span>${pret ? V("chez") : V("sortiesMot") + " en 7 jours"}</span></button>
    <button data-aller="journal"><span class="rondv" style="--c:var(--retour)">${f(rev)}</span><span>${pret ? "Revenus" : "Entrés"} en 7 jours</span></button>
    <button data-aller="refacturer"><span class="rondv" style="--c:var(--alerte)">${f(perdu)}</span><span>Perdus en 7 jours</span></button></div>`;
}
function blocPeremption() {
  const l = bientotPerimes(4);
  return `<h2>À utiliser en premier</h2>${l.length ? `<ul class="b-liste">${l.slice(0, 6).map(x => `<li><button class="l" data-fiche="${x.a.id}">${img(x.a)}<span><b>${esc(x.a.nom)}</b><small>${x.qte} avec date limite au ${dateFr(x.dlc)}</small></span><span class="statut s-partie">${x.dlc <= new Date().toISOString().slice(0, 10) ? "Périmé" : "Bientôt"}</span></button></li>`).join("")}</ul>` : `<p class="vide">Rien ne périme dans les 4 prochains jours.</p>`}`;
}
function bMateriel(f) {
  f = f || "tous";
  const ids = new Set(dehors().map(d => d.article));
  const l = S.articles.filter(a => f === "tous" || (f === "alerte" && ["zero", "bas"].includes(etat(a).c)) || (f === "dehors" && ids.has(a.id)));
  return `<h1>Matériel</h1>
  <div class="filtres">${[["tous", "Tout"], ["alerte", "À commander"]].concat(aDesPrets() ? [["dehors", V("chez")]] : []).map(([k, t]) => `<button data-aller="materiel" data-arg="${k}" aria-pressed="${f === k}">${t}</button>`).join("")}</div>
  <ul class="b-liste">${l.map(a => { const e = etat(a); return `<li><button class="l" data-fiche="${a.id}">${img(a)}<span><b>${esc(a.nom)}</b><small><span class="code">${a.id}</span> · <span class="etat ${e.c}"><i></i>${e.t}</span></small></span><span class="n">${stock(a.id)}</span></button></li>`; }).join("") || `<li class="vide" style="padding:16px">Rien dans cette liste.</li>`}</ul>`;
}
function bFiche(id) {
  const a = art(id); if (!a) return "<p>Introuvable.</p>";
  const q = stock(id), e = etat(a), d = dehors(id);
  return `<p class="pas-imprimer"><button class="lien" data-aller="materiel">← Matériel</button></p>
  <div class="fiche">${img(a)}<div>
    <div class="entete"><div><span class="code">${a.id}</span><h1>${esc(a.nom)}</h1><span class="etat ${e.c}"><i></i>${e.t}</span></div>
    ${a.type === "equip" ? "" : anneau(q, a.cible, couleurEtat(e), q, "sur " + a.cible, true)}</div>
    <dl><div><dt>En stock</dt><dd>${q}</dd></div>${logique(a) === "pret" ? `<div><dt>${V("chez")}</dt><dd>${d.reduce((t, x) => t + x.qte, 0)}</dd></div>` : `<div><dt>${V("sortiesMot")} en 30 jours</dt><dd>${S.mouvements.filter(m => m.article === id && m.type === "Sortie" && m.date >= Date.now() - 30 * 86400000).reduce((t, m) => t + m.qte, 0)}</dd></div>`}
      <div><dt>Seuil d'alerte</dt><dd>${a.seuil}</dd></div><div><dt>Niveau normal</dt><dd>${a.cible}</dd></div>
      <div><dt>Prix unitaire</dt><dd>${argent(a.prix)}</dd></div><div><dt>Valeur au dépôt</dt><dd>${argent(Math.max(0, q) * a.prix)}</dd></div>
      ${a.serie ? `<div><dt>N° de série</dt><dd class="code">${a.serie}</dd></div>` : ""}</dl>
    <div class="boutons"><button class="btn petit" data-mvt="Entrée">Entrée en stock</button><button class="btn petit" data-mvt="Compter">Compter</button><button class="btn petit" data-mvt="Perte">Perte</button></div>
  </div></div>
  ${metier().dlc && lotsEnStock(id).length ? `<h2>Lots en stock</h2><table class="t"><tbody>${lotsEnStock(id).map(l => `<tr><td>Date limite au ${dateFr(l.dlc)}</td><td class="n">${l.qte}</td></tr>`).join("")}</tbody></table>` : ""}
  ${d.length ? `<h2>Chez qui</h2><table class="t"><tbody>${d.map(x => `<tr><td>${esc(x.evenement)}</td><td class="n">${x.qte}</td></tr>`).join("")}</tbody></table>` : ""}
  <h2>Historique</h2>${tableMouvements(S.mouvements.filter(m => m.article === id).slice(-10).reverse(), false)}`;
}
function tableMouvements(l, avecObjet) {
  if (!l.length) return `<p class="vide">Aucun mouvement.</p>`;
  return `<div class="defile"><table class="t"><thead><tr><th>Quand</th><th>Qui</th><th>Quoi</th>${avecObjet ? "<th>Objet</th>" : ""}<th class="n">Qté</th></tr></thead><tbody>
  ${l.map(m => `<tr><td>${quand(m.date)}</td><td>${esc(m.qui || PROFILS[m.profil].nom)}</td><td>${esc(m.type)}${(m.evenement || m.imputation) ? "<br><small>" + esc(m.evenement || m.imputation) + "</small>" : ""}${m.motif ? "<br><small>" + esc(m.motif) + "</small>" : ""}</td>${avecObjet ? `<td>${esc(art(m.article).nom)}</td>` : ""}<td class="n">${m.qte}</td></tr>`).join("")}</tbody></table></div>`;
}
const bJournal = () => `<h1>Journal</h1><p class="sous">Tout est gardé. Une erreur se corrige par un nouveau mouvement, jamais en effaçant.</p>${tableMouvements(S.mouvements.slice().reverse(), true)}`;
const bScanner = () => `<h1>Scanner</h1><p class="sous">Ouvre la fiche complète de l'objet.</p>
  <button class="t-scan" data-act="camera" style="max-width:420px">${I.scan}<b>Scanner</b></button>
  <form class="t-ou" data-form="code" style="max-width:420px"><label class="cache" for="code">Code</label><input id="code" name="code" placeholder="ou tapez le code"><button class="btn plein petit">OK</button></form>`;

function brouillons() {
  const f = {};
  S.articles.filter(a => a.type === "conso" && stock(a.id) <= a.seuil).forEach(a => {
    const q = a.cible - stock(a.id); if (q > 0) (f[a.fou] = f[a.fou] || []).push({ id: a.id, qte: q });
  });
  return f;
}
function bCommandes() {
  const b = Object.entries(brouillons());
  return `<h1>Commandes</h1><p class="sous">Préparées seules à partir des seuils. Au-dessus de ${argent(SEUIL_VALIDATION_EUR)}, le gérant valide.</p>
  ${b.map(([fid, l]) => {
    const f = S.fournisseurs.find(x => x.id === fid);
    const tot = l.reduce((t, x) => t + x.qte * art(x.id).prix, 0);
    const attente = S.commandes.find(c => c.fid === fid && c.statut === "À valider");
    return `<section class="bon"><header><b>${esc(f.nom)}</b><span>Brouillon · délai ${f.delai} j</span></header>
      <table class="t"><tbody>${l.map(x => `<tr><td>${esc(art(x.id).nom)}</td><td class="n">${x.qte}</td><td class="n">${argent(x.qte * art(x.id).prix)}</td></tr>`).join("")}</tbody></table>
      <p style="text-align:right;font-weight:800;font-size:20px">${argent(tot)} HT</p>
      ${attente ? `<p class="sous">En attente de l'accord du gérant.</p>` : tot > SEUIL_VALIDATION_EUR ? `<button class="btn" data-cmd="${fid}" data-statut="À valider">Demander l'accord du gérant</button>` : `<button class="btn plein" data-cmd="${fid}" data-statut="Envoyée">Envoyer au fournisseur</button>`}
    </section>`;
  }).join("") || `<p class="vide">Rien à commander.</p>`}
  <h2>Commandes passées</h2>
  ${S.commandes.length ? `<table class="t"><tbody>${S.commandes.slice().reverse().map(c => `<tr><td>${quand(c.date)}<br><small>${esc(c.fournisseur)}</small></td><td>${esc(c.statut)}</td><td class="n">${c.statut === "Envoyée" ? `<button class="btn petit" data-recevoir="${c.id}">Réceptionner</button>` : ""}</td></tr>`).join("")}</tbody></table>` : `<p class="vide">Aucune pour l'instant.</p>`}`;
}
function creerCommande(fid, statut) {
  const l = brouillons()[fid], f = S.fournisseurs.find(x => x.id === fid);
  S.commandes.push({ id: "CMD-" + String(S.commandes.length + 1).padStart(4, "0"), date: Date.now(), fid, fournisseur: f.nom, lignes: l, total: l.reduce((t, x) => t + x.qte * art(x.id).prix, 0), statut });
  sauver();
}

/* Les sorties (documents) changent selon le profil. */
function bDocs() {
  const d = session.profil === "direction"
    ? [["rapport", I.argent, "Rapport du mois", "Valeur, pertes, refacturable, à imprimer ou garder en PDF"], ["csv", I.excel, "Export pour le comptable", "Tous les mouvements avec leur valeur"], ["refacturer", I.perte, "Manquants à refacturer", "Par événement, avec les montants"]]
    : [["etiquettes", I.etiquette, "Planche d'étiquettes", "QR à imprimer et coller"], ["inventairePapier", I.compter, "Fiche d'inventaire papier", "Pour compter sans téléphone, allée par allée"],
       ["refacturer", I.perte, "Manquants à refacturer", "Par événement, avec les montants"], ["csv", I.excel, "Export Excel", "Tous les mouvements"]];
  return `<h1>Documents</h1><p class="sous">Ce que vous pouvez imprimer, envoyer ou transmettre.</p>
  <div class="docs">${d.map(([k, ic, t, s]) => `<button class="doc-carte" ${k === "csv" ? 'data-act="csv"' : `data-aller="${k}"`}><span class="pastille">${ic}</span><span><b>${t}</b><small>${s}</small></span></button>`).join("")}</div>`;
}
const retourDocs = `<p class="pas-imprimer"><button class="lien" data-aller="docs">← Documents</button> · <button class="lien" data-act="imprimer">Imprimer ou enregistrer en PDF</button></p>`;
const bEtiquettes = () => `${retourDocs}<div class="pas-imprimer"><h1>Planche d'étiquettes</h1><p class="sous">Scanné avec l'appareil photo, le QR ouvre directement la fiche de l'objet.</p></div>
  <div class="planche">${S.articles.map(a => `<div class="etiquette"><div data-qr="${a.id}"></div><div><b>${esc(a.nom)}</b><span class="code">${a.id}</span></div></div>`).join("")}</div>`;
const bInventairePapier = () => `${retourDocs}<div class="feuille-doc"><h1>Fiche d'inventaire</h1><p>Date : ____ / ____ / ________ · Compté par : ______________________</p>
  ${S.emplacements.map(e => `<h2 style="font-size:17px">${esc(e.nom)}</h2><table><thead><tr><th>Code</th><th>Objet</th><th>Attendu</th><th>Compté</th></tr></thead><tbody>
  ${S.articles.filter(a => a.emp === e.id).map(a => `<tr><td>${a.id}</td><td>${esc(a.nom)}</td><td>${stock(a.id)}</td><td style="width:90px"></td></tr>`).join("")}</tbody></table>`).join("")}</div>`;
function bRefacturer() {
  const l = S.mouvements.filter(m => m.type === "Perte" && m.refac);
  return `${retourDocs}<div class="feuille-doc"><h1>Manquants à refacturer</h1>
  <table><thead><tr><th>Événement</th><th>Objet</th><th>Qté</th><th>Montant</th></tr></thead><tbody>
  ${l.map(m => `<tr><td>${esc(m.evenement)}</td><td>${esc(art(m.article).nom)}</td><td>${m.qte}</td><td>${argent(valeurM(m))}</td></tr>`).join("") || `<tr><td colspan="4">Rien à refacturer.</td></tr>`}</tbody></table>
  <p style="text-align:right"><b>Total : ${argent(l.reduce((t, m) => t + valeurM(m), 0))}</b></p></div>
  ${l.length ? `<h2 class="pas-imprimer">Factures de casse par événement</h2><div class="boutons pas-imprimer">${[...new Set(l.map(m => m.evenement))].slice(-8).reverse().map(ev => `<button class="btn petit" data-facture="${esc(ev)}">${esc(ev)}</button>`).join("")}</div>` : ""}`;
}

/* Direction : peu d'éléments, des montants, une tendance, ce qui attend une décision. */
let periode = 30;
function dSynthese() {
  const valeur = S.articles.reduce((t, a) => t + Math.max(0, stock(a.id)) * a.prix, 0);
  const chez = dehors().reduce((t, d) => t + d.qte * art(d.article).prix, 0);
  const J = 86400000, maintenant = Date.now();
  const sur = (deb, fin, f) => S.mouvements.filter(m => m.date >= deb && m.date < fin && f(m));
  const somme = l => l.reduce((t, m) => t + valeurM(m), 0);
  const p = sur(maintenant - periode * J, maintenant + 1, m => m.type === "Perte"), pAvant = sur(maintenant - 2 * periode * J, maintenant - periode * J, m => m.type === "Perte");
  const sorte = m => m.type === "Prêt" || m.type === "Sortie";
  const s = sur(maintenant - periode * J, maintenant + 1, sorte), sAvant = sur(maintenant - 2 * periode * J, maintenant - periode * J, sorte);
  const vp = somme(p), refac = somme(p.filter(m => m.refac));
  // Évolution par rapport à la période précédente de même durée, seulement si elle a des données
  const delta = (a, b, plusEstMieux) => {
    if (!b) return `<span class="delta">pas de période avant</span>`;
    const d = Math.round((a - b) / b * 100), mieux = plusEstMieux ? d >= 0 : d <= 0;
    return `<span class="delta ${d === 0 ? "" : mieux ? "mieux" : "pire"}">${d > 0 ? "+" : ""}${d} % vs avant</span>`;
  };
  const attente = S.commandes.filter(c => c.statut === "À valider");
  const partLoue = Math.round(chez / ((chez + valeur) || 1) * 100), partRefac = vp ? Math.round(refac / vp * 100) : 0;
  return `<div class="d-tete"><div><p class="sous" style="margin:8px 0 0">${(S.metier || "loueur") === "loueur" ? "Valeur du matériel au dépôt" : "Valeur du stock"}</p><div class="d-grand">${argent(valeur)}</div></div>
    <div class="segments" role="group" aria-label="Période">${[7, 30, 90].map(n => `<button data-periode="${n}" aria-pressed="${periode === n}">${n} jours</button>`).join("")}</div></div>
  <div class="trio">
    <div><small>${V("sortiesMot")}</small><b>${argent(somme(s))}</b>${delta(somme(s), somme(sAvant), true)}</div>
    <div><small>Cassé ou perdu</small><b style="color:var(--alerte)">${argent(vp)}</b>${delta(vp, somme(pAvant), false)}</div>
    ${(S.metier || "loueur") === "loueur" ? `<div><small>Refacturable</small><b>${argent(refac)}</b><span class="delta">${partRefac} % des pertes</span></div>` : `<div><small>Taux de perte</small><b>${somme(s) ? Math.round(vp / (somme(s) + vp) * 1000) / 10 : 0} %</b><span class="delta">de la valeur sortie</span></div>`}
  </div>
  <div class="paire">
    ${aDesPrets() ? `<div>${anneau(chez, chez + valeur, "var(--compter)", partLoue + " %", S.metier === "loueur" ? "du parc loué" : "du matériel prêté", true)}<p>${argent(chez)} ${V("chez").toLowerCase()} aujourd'hui</p></div>` : (() => { const ok = S.articles.filter(x => etat(x).c === "").length; return `<div>${anneau(ok, S.articles.length, "var(--retour)", Math.round(ok / S.articles.length * 100) + " %", "au bon niveau", true)}<p>${S.articles.length - ok} référence${S.articles.length - ok > 1 ? "s" : ""} à commander</p></div>`; })()}
    ${(S.metier || "loueur") === "loueur" ? `<div>${anneau(refac, vp, "var(--neutre)", partRefac + " %", "refacturé", true)}<p>des pertes sur ${periode} jours</p></div>` : `<div>${anneau(vp, somme(s) + vp, "var(--alerte)", (somme(s) ? Math.round(vp / (somme(s) + vp) * 100) : 0) + " %", "perdu", true)}<p>${argent(vp)} perdus sur ${periode} jours</p></div>`}
  </div>
  <h2>À décider</h2>
  ${attente.length ? attente.map(c => `<div class="bon"><header><b>${esc(c.fournisseur)}</b><span>${argent(c.total)} HT</span></header><p class="sous">${c.lignes.map(x => x.qte + " × " + esc(art(x.id).nom)).join(", ")}</p><button class="btn plein" data-valider="${c.id}">Valider la commande</button></div>`).join("") : `<p class="vide">Rien n'attend votre accord.</p>`}
  ${actif("MO-DASH") ? `<h2>Tendances</h2><div class="graphes">${aDesPrets() ? gUtilisation() : ""}${gPertes8()}${gTopLoues()}</div>` : `<p class="sous">Le module Tableau de direction ajoute les tendances : utilisation du parc, pertes par semaine, objets qui dorment.</p>`}`;
}

/* Équipe et accès : qui peut entrer, avec quel rôle, et le journal des connexions */
const ROLES = { terrain: "Terrain : dépôt et camion", bureau: "Bureau : stock et commandes", direction: "Direction : argent et décisions" };
function dEquipe() {
  if (!session.admin) return `<h1>Équipe et accès</h1><p class="vide">Seul l'administrateur du compte gère les accès.</p>`;
  return `<h1>Équipe et accès</h1><p class="sous">Chaque personne a son code. Chaque mouvement porte son nom. Retirer un accès prend une seconde.</p>
  <div class="bloc">${S.equipe.map(u => `<div class="personne ${u.actif ? "" : "inactif"}">${avatar(u)}<div><b>${esc(u.nom)}${u.admin ? " · administratrice du compte" : ""}</b><small>${esc(u.poste)} · ${ROLES[u.role]}${u.actif ? "" : " · accès retiré"}</small></div>
    <div class="actions"><button class="btn petit" data-nouveau-code="${u.id}">Nouveau code</button>${u.id === session.uid ? "" : `<label class="inter"><input type="checkbox" data-acces="${u.id}" ${u.actif ? "checked" : ""} aria-label="Accès de ${esc(u.nom)}"><span></span></label>`}</div></div>`).join("")}</div>
  <p style="margin-top:12px"><button class="btn plein petit" data-act="ajouterPersonne">Ajouter une personne</button></p>
  <h2>Sécurité</h2>
  <div class="bloc"><div class="module"><label for="verrou"><b>Verrouillage automatique</b></label><select id="verrou" data-verrou>${[[1, "Après 1 minute"], [5, "Après 5 minutes"], [15, "Après 15 minutes"], [0, "Jamais"]].map(([v, n]) => `<option value="${v}" ${S.reglages.verrou === v ? "selected" : ""}>${n}</option>`).join("")}</select><p>Sans toucher l'écran, le téléphone redemande le code.</p></div>
  <div class="module"><b>Codes faux</b><span></span><p>Après 5 codes faux, il faut attendre 30 secondes. Chaque essai est noté ci-dessous.</p></div></div>
  <h2>Journal des connexions</h2>
  ${S.connexions.length ? `<div class="defile"><table class="t"><thead><tr><th>Quand</th><th>Qui</th><th>Quoi</th><th class="n">Résultat</th></tr></thead><tbody>${S.connexions.slice(0, 20).map(c => `<tr><td>${quand(c.date)}</td><td>${esc(c.nom)}</td><td>${esc(c.motif)}</td><td class="n"><span class="resultat ${c.ok ? "ok" : "ko"}">${c.ok ? "Réussie" : "Code faux"}</span></td></tr>`).join("")}</tbody></table></div>` : `<p class="vide">Aucune connexion enregistrée pour l'instant.</p>`}
  <h2>Ce qui protège les données en vrai</h2>
  <ul class="puces">
    <li>Bureau et direction se connectent avec leur compte Google ou Microsoft, avec la validation en deux étapes.</li>
    <li>Sur les téléphones partagés du dépôt, chacun a un code personnel, vérifié par le serveur et jamais gardé sur le téléphone.</li>
    <li>Les droits sont appliqués par le serveur : un magasinier ne reçoit même pas les prix.</li>
    <li>Le journal des mouvements ne s'efface pas. Une erreur se corrige par un nouveau mouvement.</li>
    <li>Un téléphone perdu se coupe à distance. Les données restent dans le compte de l'entreprise.</li>
  </ul>`;
}
function feuilleCode(uid) {
  const u = uid ? S.equipe.find(x => x.id === uid) : null;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tc"><h1 id="tc" style="font-size:26px">${u ? "Nouveau code pour " + esc(u.nom) : "Ajouter une personne"}</h1>
    ${u ? `<p class="sous">L'ancien code ne marchera plus. Donnez le nouveau en main propre, jamais par message.</p>` : `
    <label class="champ">Prénom<input name="nom" autocomplete="off" maxlength="30"></label>
    <label class="champ">Poste<input name="poste" autocomplete="off" maxlength="40" placeholder="Magasinier, chauffeur…"></label>
    <label class="champ">Rôle<select name="role">${Object.entries(ROLES).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></label>`}
    <label class="champ">Code à 4 chiffres<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="new-password"></label>
    <label class="champ">Le même code, une seconde fois<input name="pin2" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="new-password"></label>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div></div>`);
  const champ = n => f.querySelector(`[name=${n}]`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const pin = champ("pin").value, pin2 = champ("pin2").value;
    if (!/^\d{4}$/.test(pin)) return toast("Le code fait 4 chiffres.");
    if (pin !== pin2) return toast("Les deux codes ne sont pas pareils.");
    if (/^(\d)\1{3}$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin)) return toast("Code trop facile à deviner : évitez 1234 ou 0000.");
    if (u) { u.empreinte = empreinte(u.id, pin); toast(`Nouveau code enregistré pour ${u.nom}.`); }
    else {
      const nom = champ("nom").value.trim(); if (!nom) return toast("Indiquez le prénom.");
      const id = "U-" + String(S.equipe.length + 1).padStart(2, "0"), role = champ("role").value;
      S.equipe.push({ id, nom, poste: champ("poste").value.trim() || PROFILS[role].nom, role, admin: false, actif: true, empreinte: empreinte(id, pin) });
      toast(`${nom} peut se connecter avec son code.`);
    }
    sauver(); f.remove(); rendre();
  };
}

function dRapport() {
  const valeur = S.articles.reduce((t, a) => t + Math.max(0, stock(a.id)) * a.prix, 0);
  const p = pertesN(30);
  const sorties = S.mouvements.filter(m => m.type === "Prêt" && m.date >= Date.now() - 30 * 86400000);
  const top = {}; sorties.forEach(m => top[m.article] = (top[m.article] || 0) + m.qte);
  return `${retourDocs}<div class="feuille-doc"><h1>Rapport des 30 derniers jours</h1><p>Édité le ${new Date().toLocaleDateString("fr-FR")}</p>
  <table><tbody><tr><td>Valeur du matériel au dépôt</td><td>${argent(valeur)}</td></tr><tr><td>Cassé ou perdu</td><td>${argent(p.reduce((t, m) => t + valeurM(m), 0))}</td></tr>
  <tr><td>Refacturable aux clients</td><td>${argent(p.filter(m => m.refac).reduce((t, m) => t + valeurM(m), 0))}</td></tr>
  <tr><td>Pièces sorties chez les clients</td><td>${sorties.reduce((t, m) => t + m.qte, 0)}</td></tr></tbody></table>
  <h2 style="font-size:17px">Objets les plus loués</h2><table><tbody>${Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, q]) => `<tr><td>${esc(art(id).nom)}</td><td>${q}</td></tr>`).join("") || "<tr><td>Aucune sortie.</td></tr>"}</tbody></table></div>`;
}
function dInstallation() {
  const unite = S.monnaie === "XOF" ? "xof" : "eur";
  const fmt = n => unite === "xof" ? n.toLocaleString("fr-FR") + " FCFA" : n.toLocaleString("fr-FR") + " €";
  const inst = S.installation || { livreLe: Date.now(), heuresUtilisees: 0 };
  const fin = inst.livreLe + OFFRE.jours * 86400000, jours = Math.max(0, Math.ceil((fin - Date.now()) / 86400000));
  const restantes = Math.max(0, OFFRE.heures - inst.heuresUtilisees), enCours = jours > 0 && restantes > 0;
  const google = S.equipe.filter(u => u.actif).length * (unite === "xof" ? 4460 : 6.8);
  return `<h1>Votre installation</h1>
  <p class="sous">Offre ${OFFRE.nom}, payée une fois : ${fmt(OFFRE[unite])} HT, livrée le ${new Date(inst.livreLe).toLocaleDateString("fr-FR")}. L'appli et les données vous appartiennent. Rien n'est dû chaque mois à RAYON.</p>
  <div class="bloc"><div class="module"><b>Assistance incluse</b><span class="statut ${enCours ? "s-revenue" : "s-partie"}">${enCours ? "en cours" : "terminée"}</span>
    <p>${enCours ? `Encore ${jours} jour${jours > 1 ? "s" : ""} et ${String(restantes).replace(".", ",")} h sur ${OFFRE.heures} h. ` : `Terminée le ${new Date(fin).toLocaleDateString("fr-FR")}. `}Elle couvre les corrections de notre paramétrage et les questions d'utilisation, pas les nouvelles fonctions.</p></div>
  <div class="module"><b>Intervention ensuite</b><span>${fmt(TARIF_INTERVENTION[unite])} HT / h</span><p>À distance, par quart d'heure, 30 minutes au minimum, toujours sur devis accepté.</p></div>
  <div class="module"><b>Payé chaque mois à Google, pas à RAYON</b><span>${fmt(Math.round(google * 100) / 100)}</span><p>Licences Google des ${S.equipe.filter(u => u.actif).length} personnes de l'équipe (environ 6,80 € HT par personne).</p></div></div>
  <p style="margin-top:12px"><button class="btn plein" data-act="demanderIntervention">Demander une intervention</button></p>
  ${(S.interventions || []).length ? `<h2>Vos demandes</h2><table class="t"><tbody>${S.interventions.slice().reverse().map(i => `<tr><td>${quand(i.date)}<br><small>${esc(i.texte)}</small></td><td class="n">${i.incluse ? "dans l'assistance" : "devis envoyé"}</td></tr>`).join("")}</tbody></table>` : ""}
  <h2>Modules de votre appli</h2>
  <p class="sous">Un module installé reste à vous. En ajouter un se paie une fois, après devis.</p>
  ${Object.entries(CATALOGUE).map(([k, m]) => `<div class="module"><b>${m.nom}</b><label class="inter"><input type="checkbox" data-module="${k}" ${actif(k) ? "checked" : ""} aria-label="${m.nom}"><span></span></label><p>${actif(k) ? "Installé." : `Ajout possible : ${fmt(m[unite])} HT, une fois.`} ${m.detail}</p></div>`).join("")}
  <h2>Réglages</h2>
  <div class="module"><label for="metier"><b>Métier de l'entreprise</b></label><select id="metier" data-metier>${Object.entries(METIERS).map(([k, m]) => `<option value="${k}" ${(S.metier || "loueur") === k ? "selected" : ""}>${m.nom}</option>`).join("")}</select><p>Change les mots, les boutons du terrain et les objets de la démo.</p></div>
  <div class="module"><label for="monnaie"><b>Monnaie des montants</b></label><select id="monnaie" data-monnaie><option value="EUR" ${S.monnaie === "EUR" ? "selected" : ""}>Euro</option><option value="XOF" ${S.monnaie === "XOF" ? "selected" : ""}>Franc CFA</option></select><p>Pour les prix, les pertes et les factures.</p></div>`;
}
function feuilleIntervention() {
  const inst = S.installation || { livreLe: Date.now(), heuresUtilisees: 0 };
  const incluse = Date.now() < inst.livreLe + OFFRE.jours * 86400000 && inst.heuresUtilisees < OFFRE.heures;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="ti"><h1 id="ti" style="font-size:26px">Demander une intervention</h1>
    <p class="sous">${incluse ? "Votre assistance incluse est en cours : si la demande entre dedans, elle ne vous coûte rien." : "Votre assistance incluse est terminée : vous recevrez un devis avant tout travail."}</p>
    <label class="champ">Votre demande<textarea name="texte" rows="4" maxlength="400" style="border-radius:10px;border:2px solid var(--trait-fort);padding:10px;font:inherit;background:var(--carte);color:var(--encre)"></textarea></label>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Envoyer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const t = f.querySelector("[name=texte]").value.trim();
    if (!t) return toast("Décrivez votre demande.");
    (S.interventions = S.interventions || []).push({ date: Date.now(), texte: t, incluse });
    sauver(); f.remove(); rendre();
    toast(incluse ? "Demande envoyée (simulation). Réponse sous 2 jours ouvrés." : "Demande envoyée (simulation). Un devis vous sera envoyé.");
  };
}
/* =================================================================
   Saisies
   ================================================================= */
function ouvrirFeuille(html) { const f = document.createElement("div"); f.className = "feuille"; f.innerHTML = html; document.body.appendChild(f); f.onclick = e => { if (e.target === f) f.remove(); }; return f; }
function compteur(f, min, max) {
  const c = f.querySelector("input[type=number]");
  const borne = v => Math.max(min, max !== null ? Math.min(max, v) : v);
  f.querySelectorAll("[data-pas]").forEach(b => b.onclick = () => c.value = borne((+c.value || 0) + +b.dataset.pas));
  f.querySelectorAll("[data-plus]").forEach(b => b.onclick = () => c.value = borne((+c.value || 0) + +b.dataset.plus));
  return c;
}
const radios = (nom, liste, etiquette) => `<div class="choix" role="radiogroup" aria-label="${etiquette}">${liste.map((e, i) => `<label><input type="radio" name="${nom}" value="${esc(e)}" ${i === 0 ? "checked" : ""}>${esc(e)}</label>`).join("")}</div>`;

function feuille(id, type) {
  const a = art(id), q = stock(id), d = dehors(id);
  if (type === "Retour" && !d.length) return toast("Rien de cet objet n'est chez un client.");
  if (["Prêt", "Sortie"].includes(type) && q <= 0) return toast("Il n'y en a plus en stock.");
  const titre = { "Sortie": "Combien en sortez-vous ?", "Surplus": "Combien en remettez-vous ?", "Prêt": "Combien partent ?", "Retour": "Combien reviennent ?", "Compter": "Combien en voyez-vous ?", "Perte": "Combien sont cassés ou perdus ?", "Entrée": "Combien entrent en stock ?" }[type];
  const defaut = type === "Compter" ? q : type === "Retour" ? d[0].qte : 1;
  const evs = ["Prêt", "Sortie", "Surplus"].includes(type) ? S.evenements : type === "Retour" ? d.map(x => x.evenement) : type === "Perte" ? ["Au dépôt"].concat(d.map(x => x.evenement)) : null;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tf">
    <div class="tete">${img(a)}<div><span class="code">${a.id}</span><br><b>${esc(a.nom)}</b></div></div>
    <h1 id="tf" style="font-size:26px">${titre}</h1>
    <div class="compteur"><button data-pas="-1" aria-label="Un de moins">−</button><input type="number" inputmode="numeric" min="0" value="${defaut}" aria-label="Quantité"><button data-pas="1" aria-label="Un de plus">+</button></div>
    ${a.type === "conso" && type !== "Compter" ? `<div class="rapides">${[10, 50, 100].map(n => `<button data-plus="${n}">+${n}</button>`).join("")}</div>` : ""}
    ${evs ? radios("ev", evs, V("imp")) : ""}
    ${type === "Perte" ? radios("motif", ["Cassé", "Pas rendu", "Abîmé", "Volé"], "Motif") : ""}
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Valider</button></div></div>`);
  const max = ["Prêt", "Sortie"].includes(type) ? q : null;
  const champ = compteur(f, 0, max);
  if (type === "Retour") f.querySelectorAll("input[name=ev]").forEach(r => r.onchange = () => { champ.value = d.find(x => x.evenement === r.value).qte; });
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const n = Math.floor(+champ.value);
    if (!(n >= 0) || (n === 0 && type !== "Compter")) return toast("Indiquez une quantité.");
    if (max !== null && n > max) return toast(`Il n'y en a que ${max} au dépôt.`);
    const ev = (f.querySelector("input[name=ev]:checked") || {}).value || "";
    const motif = (f.querySelector("input[name=motif]:checked") || {}).value || "";
    f.remove();
    if (type === "Compter") { const e = n - q; if (e) mouvement(id, "Ajustement", e, { motif: "Comptage" }); toast(e ? `Écart de ${e > 0 ? "+" : ""}${e} enregistré.` : "Le compte est bon."); return rendre(); }
    if (type === "Retour") {
      const attendu = d.find(x => x.evenement === ev).qte, rendu = Math.min(n, attendu);
      mouvement(id, "Retour", rendu, { evenement: ev });
      if (rendu < attendu) return manquants(ev, [[id, attendu - rendu]], [[id, rendu]]);
      if (session.profil === "terrain" && (S.metier || "loueur") === "loueur") return aller("bon", creerBon({ type: "retour", evenement: ev, date: Date.now(), lignes: [[id, rendu]] }));
      toast("Retour enregistré."); return rendre();
    }
    if (type === "Sortie") { mouvement(id, "Sortie", n, { imputation: ev }); toast(`${n} sorti${n > 1 ? "s" : ""} pour ${ev}.`); return rendre(); }
    if (type === "Surplus") { mouvement(id, "Entrée", n, { motif: "Surplus remis", imputation: ev }); toast(`${n} remis en stock.`); return rendre(); }
    if (type === "Prêt") { mouvement(id, "Prêt", n, { evenement: ev }); if (S.metier && S.metier !== "loueur") { toast(`Emprunté pour ${ev}.`); return rendre(); } return aller("bon", creerBon({ type: "sortie", evenement: ev, date: Date.now(), lignes: [[id, n]] })); }
    mouvement(id, type, n, { evenement: ev === "Au dépôt" ? "" : ev, motif, refac: type === "Perte" && ev !== "Au dépôt" && motif !== "Abîmé" });
    toast("Enregistré."); rendre();
  };
}
function manquants(ev, liste, rendus) {
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true"><h1 style="font-size:26px">Il manque des objets</h1>
    <p>${liste.map(([id, q]) => `<b>${q}</b> × ${esc(art(id).nom)}`).join("<br>")}</p>
    <div class="t-actions"><button class="t-action perte" data-c="perte">${I.perte}<span>Cassés ou perdus : à refacturer</span></button>
    <button class="btn" data-c="attente">Ils reviendront plus tard</button></div></div>`);
  f.onclick = null;
  f.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
    const perte = b.dataset.c === "perte";
    if (perte) liste.forEach(([id, q]) => mouvement(id, "Perte", q, { evenement: ev, motif: "Pas rendu", refac: true }));
    f.remove();
    aller("bon", creerBon({ type: "retour", evenement: ev, date: Date.now(), lignes: rendus.filter(([, q]) => q > 0), manquants: perte ? liste : [] }));
  });
}
function feuilleKit(kid) {
  const k = S.kits.find(x => x.id === kid);
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true"><h1 style="font-size:26px">${esc(k.nom)}</h1><p class="sous">Combien de kits ?</p>
    <div class="compteur"><button data-pas="-1" aria-label="Un de moins">−</button><input type="number" inputmode="numeric" min="1" value="1" aria-label="Nombre de kits"><button data-pas="1" aria-label="Un de plus">+</button></div>
    ${radios("ev", S.evenements, V("imp"))}
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Valider</button></div></div>`);
  const champ = compteur(f, 1, null);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const n = Math.max(1, Math.floor(+champ.value)), ev = f.querySelector("input[name=ev]:checked").value;
    const manque = k.lignes.filter(([id, q]) => stock(id) < q * n);
    if (manque.length) return toast("Pas assez au dépôt : " + manque.map(([id]) => art(id).nom).join(", ") + ".");
    k.lignes.forEach(([id, q]) => logique(art(id)) === "pret" ? mouvement(id, "Prêt", q * n, { evenement: ev }) : mouvement(id, "Sortie", q * n, { imputation: ev }));
    f.remove();
    if (S.metier && S.metier !== "loueur") { toast(`${n} × ${k.nom} : sortie enregistrée pour ${ev}.`); return aller("terrain"); }
    aller("bon", creerBon({ type: "sortie", evenement: ev, date: Date.now(), lignes: k.lignes.map(([id, q]) => [id, q * n]) }));
  };
}

/* ---------------- Caméra ---------------- */
const script = src => new Promise((ok, ko) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
const code = t => { const m = String(t).toUpperCase().match(/ART-\d{4}/); return m ? m[0] : null; };
function ouvrir(id) { if (!art(id)) return toast(`Aucun objet ${id} ici.`); if (vue.nom === "preparation") return scanPreparation(id); aller(session.profil === "terrain" ? "objet" : "fiche", id); }
let dernierScan = { id: "", t: 0 };
async function camera(rafale) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return toast("Caméra indisponible : tapez le code de l'étiquette.");
  const c = document.createElement("div"); c.className = "camera";
  c.innerHTML = `<video playsinline muted></video><div class="viseur"><div></div></div><div class="pied"><span>${rafale ? "Visez chaque caisse. La caméra reste ouverte." : "Visez l'étiquette"}</span><button class="btn" data-x>${rafale ? "Terminé" : "Annuler"}</button></div>`;
  document.body.appendChild(c);
  const v = c.querySelector("video"); let flux, fini = false;
  const fermer = () => { fini = true; if (flux) flux.getTracks().forEach(t => t.stop()); c.remove(); };
  c.querySelector("[data-x]").onclick = fermer;
  try { flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }); }
  catch (e) { fermer(); return toast("Caméra refusée : tapez le code de l'étiquette."); }
  v.srcObject = flux; await v.play();
  let lire;
  if ("BarcodeDetector" in window) { const d = new BarcodeDetector({ formats: ["qr_code"] }); lire = async () => { const r = await d.detect(v); return r[0] && r[0].rawValue; }; }
  else {
    // iPhone et Android anciens : pas de lecteur intégré au navigateur, on charge jsQR.
    try { await script("https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"); } catch (e) { fermer(); return toast("Lecteur indisponible hors ligne : tapez le code."); }
    const cv = document.createElement("canvas"), cx = cv.getContext("2d", { willReadFrequently: true });
    lire = async () => { const w = v.videoWidth; if (!w) return null; const s = Math.min(1, 640 / w); cv.width = w * s; cv.height = v.videoHeight * s; cx.drawImage(v, 0, 0, cv.width, cv.height); const r = window.jsQR(cx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height); return r && r.data; };
  }
  const boucle = async () => {
    if (fini) return;
    try {
      const t = await lire(), id = t && code(t);
      if (id && rafale) {
        // Mode rafale : on ne compte pas deux fois la même étiquette restée devant l'objectif.
        if (id !== dernierScan.id || Date.now() - dernierScan.t > 1800) { if (navigator.vibrate) navigator.vibrate(60); scanPreparation(id); }
        dernierScan = { id, t: Date.now() };
      } else if (id) { if (navigator.vibrate) navigator.vibrate(60); fermer(); return ouvrir(id); }
    } catch (e) { /* image floue : on recommence */ }
    setTimeout(boucle, 200);
  };
  boucle();
}
async function dessinerQr() {
  const cases = $$("[data-qr]"); if (!cases.length) return;
  try { await script("https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"); } catch (e) { cases.forEach(c => c.textContent = "QR indisponible hors ligne"); return; }
  const base = location.href.split("#")[0].split("?")[0];
  cases.forEach(c => { const q = window.qrcode(0, "M"); q.addData(base + "#/a/" + c.dataset.qr); q.make(); c.innerHTML = q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); });
}
function exporterCsv() {
  const l = [["Date", "Profil", "Type", "Code", "Objet", "Quantité", "Événement", "Motif", "Valeur"]];
  S.mouvements.forEach(m => l.push([new Date(m.date).toLocaleString("fr-FR"), PROFILS[m.profil].nom, m.type, m.article, art(m.article).nom, m.qte, m.evenement, m.motif, valeurM(m).toFixed(2).replace(".", ",")]));
  const csv = "﻿" + l.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "mouvements.csv"; a.click();
}

/* ---------------- Branchements ---------------- */
function brancher() {
  // Connexion : le nom ouvre le clavier du code
  $$("[data-uid]").forEach(b => b.onclick = () => { saisiePin = ""; vue = { nom: "pin", arg: b.dataset.uid }; rendre(); });
  $$("[data-touche]").forEach(b => b.onclick = () => taper(b.dataset.touche));
  $$("[data-periode]").forEach(b => b.onclick = () => { periode = +b.dataset.periode; rendre(); });
  $$("[data-acces]").forEach(c => c.onchange = () => { const u = S.equipe.find(x => x.id === c.dataset.acces); u.actif = c.checked; sauver(); rendre(); toast(c.checked ? `${u.nom} peut de nouveau se connecter.` : `Accès retiré à ${u.nom}. Ses mouvements restent dans le journal.`); });
  $$("[data-nouveau-code]").forEach(b => b.onclick = () => feuilleCode(b.dataset.nouveauCode));
  $$("[data-verrou]").forEach(s => s.onchange = () => { S.reglages.verrou = +s.value; sauver(); activite(); toast("Réglage enregistré."); });
  $$("[data-aller]").forEach(b => b.onclick = () => aller(b.dataset.aller, b.dataset.arg));
  $$("[data-objet]").forEach(b => b.onclick = () => aller("objet", b.dataset.objet));
  $$("[data-fiche]").forEach(b => b.onclick = () => aller("fiche", b.dataset.fiche));
  $$("[data-mvt]").forEach(b => b.onclick = () => feuille(vue.arg, b.dataset.mvt));
  $$("[data-kit]").forEach(b => b.onclick = () => feuilleKit(b.dataset.kit));
  $$("[data-ev]").forEach(b => b.onclick = () => aller("retourEv", b.dataset.ev));
  $$("[data-module]").forEach(c => c.onchange = () => { S.modules[c.dataset.module] = c.checked; sauver(); rendre(); toast(c.checked ? `${CATALOGUE[c.dataset.module].nom} ajouté (démo). En vrai : devis, puis paiement unique.` : `${CATALOGUE[c.dataset.module].nom} retiré de la démo.`); });
  $$("[data-monnaie]").forEach(s => s.onchange = () => { S.monnaie = s.value; sauver(); rendre(); });
  $$("[data-cmd]").forEach(b => b.onclick = () => { creerCommande(b.dataset.cmd, b.dataset.statut); toast(b.dataset.statut === "Envoyée" ? "Bon de commande envoyé (simulation)." : "Demande envoyée au gérant."); rendre(); });
  $$("[data-valider]").forEach(b => b.onclick = () => { S.commandes.find(c => c.id === b.dataset.valider).statut = "Envoyée"; sauver(); toast("Commande validée et envoyée (simulation)."); rendre(); });
  $$("[data-recevoir]").forEach(b => b.onclick = () => { const c = S.commandes.find(x => x.id === b.dataset.recevoir); c.lignes.forEach(l => mouvement(l.id, "Entrée", l.qte, { motif: "Réception " + c.id })); c.statut = "Reçue"; sauver(); toast("Réception enregistrée."); rendre(); });
  const fc = $('[data-form="code"]'); if (fc) fc.onsubmit = e => { e.preventDefault(); const v = fc.code.value; const id = code(v) || code("ART-" + v.replace(/\D/g, "").padStart(4, "0")); if (id) ouvrir(id); else toast("Code non reconnu, exemple : ART-0003."); };
  const fq = $('[data-form="cherche"]'); if (fq) fq.onsubmit = e => { e.preventDefault(); aller("chercher", fq.q.value.trim()); };
  const fr = $('[data-form="retourEv"]'); if (fr) fr.onsubmit = e => {
    e.preventDefault(); const ev = vue.arg, rendus = [], manque = [];
    dehors().filter(d => d.evenement === ev).forEach(d => {
      const n = Math.max(0, Math.min(d.qte, Math.floor(+fr.elements[d.article].value || 0)));
      if (n) { mouvement(d.article, "Retour", n, { evenement: ev }); rendus.push([d.article, n]); }
      if (n < d.qte) manque.push([d.article, d.qte - n]);
    });
    if (manque.length) manquants(ev, manque, rendus); else aller("bon", creerBon({ type: "retour", evenement: ev, date: Date.now(), lignes: rendus }));
  };
  $$("[data-act]").forEach(b => { if (ACTIONS[b.dataset.act]) b.onclick = ACTIONS[b.dataset.act]; });
  brancherPlus();
  brancherMetiers();
}
const ACTIONS = {
  camera: () => camera(),
  scanRafale: () => camera(true),
  camionPart: () => camionPart(),
  tour: () => demarrerTour(),
  demanderIntervention: () => feuilleIntervention(),
  sortir: () => { session = null; verrouille = false; saisiePin = ""; clearTimeout(minuteur); vue = { nom: "profil" }; rendre(); },
  retourListe: () => { saisiePin = ""; vue = { nom: "profil" }; rendre(); },
  verrouiller: () => { verrouille = true; saisiePin = ""; clearTimeout(minuteur); rendre(); },
  reglages: () => feuilleReglages(),
  ajouterPersonne: () => feuilleCode(null),
  reinit: () => { if (confirm("Effacer ce qui a été fait pendant la démo ?")) { S = construireDemo(S.metier || "loueur"); sauver(); session = null; verrouille = false; vue = { nom: "profil" }; rendre(); toast("Démo remise à zéro."); } },
  imprimer: () => window.print(),
  csv: () => exporterCsv(),
  partager: async () => {
    const t = texteBon(vue.arg);
    partagerTexte(t);
  },
};
function lienProfond() { const id = code(location.hash); if (id && art(id)) vue = { nom: session.profil === "terrain" ? "objet" : "fiche", arg: id }; }

// Liens directs pour la démo : ?profil=terrain|bureau|direction&vue=…&arg=…
(function () {
  const q = new URLSearchParams(location.search);
  if (METIERS[q.get("metier")] && (S.metier || "loueur") !== q.get("metier")) { const garder = { monnaie: S.monnaie }; S = construireDemo(q.get("metier")); Object.assign(S, garder); sauver(); }
  if (q.get("monnaie") === "XOF" || q.get("monnaie") === "EUR") { S.monnaie = q.get("monnaie"); sauver(); }
  // En démo, un lien direct ouvre la session de la première personne active du profil, sans code.
  // En production, ces liens n'existent pas : chacun se connecte avec son code.
  const u = PROFILS[q.get("profil")] && S.equipe.find(x => x.role === q.get("profil") && x.actif);
  if (u) { session = { uid: u.id, nom: u.nom, profil: u.role, admin: !!u.admin }; vue = { nom: q.get("vue") || PROFILS[u.role].accueil, arg: q.get("arg") }; lienProfond(); activite(); }
  if (["clair", "sombre", "nuit"].includes(q.get("theme"))) { try { localStorage.setItem(CLE_THEME, q.get("theme")); } catch (e) { /* stockage bloqué */ } appliquerTheme(); }
})();
window.addEventListener("hashchange", () => { if (session) { lienProfond(); rendre(); } });
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
rendre();
// Les graphiques se redessinent à la largeur de l'écran (rotation du téléphone, fenêtre redimensionnée).
let attenteTaille;
window.addEventListener("resize", () => { clearTimeout(attenteTaille); attenteTaille = setTimeout(() => { if (session && session.profil !== "terrain" && !document.querySelector(".feuille, .camera")) rendre(); }, 300); });

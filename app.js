"use strict";

const CLE = "rayon-demo-v12";
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
  chevron: P('<path d="M18 10l14 14-14 14"/>'),
  precedent: P('<path d="M38 24H10M20 14 10 24l10 10"/>'),
  maison: P('<path d="M6 22 24 7l18 15"/><path d="M11 18v22h26V18M20 40V28h8v12"/>'),
  grille: P('<rect x="7" y="7" width="14" height="14" rx="3"/><rect x="27" y="7" width="14" height="14" rx="3"/><rect x="7" y="27" width="14" height="14" rx="3"/><rect x="27" y="27" width="14" height="14" rx="3"/>'),
  oeil: P('<path d="M4 24s7-12 20-12 20 12 20 12-7 12-20 12S4 24 4 24z"/><circle cx="24" cy="24" r="5"/>'),
  sortir: P('<path d="M20 8H9a2 2 0 0 0-2 2v28a2 2 0 0 0 2 2h11M30 15l9 9-9 9M39 24H18"/>'),
  appareil: P('<path d="M6 15h8l3-5h14l3 5h8v25H6z"/><circle cx="24" cy="27" r="7"/>'),
  telecharger: P('<path d="M24 6v24M14 21l10 10 10-10"/><path d="M8 36v4a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2v-4"/>'),
  telephone: P('<rect x="13" y="4" width="22" height="40" rx="4"/><path d="M21 37h6"/>'),
  // Un dessin par destination : la tournée (un trajet entre deux points), la réception (un colis), ma journée (une liste cochée), les clients (un carnet).
  itineraire: P('<circle cx="11" cy="37" r="5"/><circle cx="37" cy="11" r="5"/><path d="M16 37h14a6.5 6.5 0 0 0 0-13H18a6.5 6.5 0 0 1 0-13h14"/>'),
  colis: P('<path d="M6 15 24 6l18 9v18L24 42 6 33z"/><path d="M6 15l18 9 18-9M24 24v18M15 10.5l18 9"/>'),
  liste: P('<path d="m7 12 4 4 7-8M7 28l4 4 7-8M25 13h16M25 29h16M25 40h10"/>'),
  carnet: P('<rect x="11" y="6" width="30" height="36" rx="3"/><path d="M6 15h9M6 24h9M6 33h9"/><circle cx="27" cy="19" r="4.5"/><path d="M19 33a8 8 0 0 1 16 0"/>'),
  cle: P('<path d="M41 13a10 10 0 0 1-13.6 9.3L12 37.7a4 4 0 0 1-5.7-5.7l15.4-15.4A10 10 0 0 1 35 7l-6 6 1.5 4.5L35 19z"/>'),
  crayon: P('<path d="M7 41l3-12L31 8l9 9-21 21z"/><path d="M26 13l9 9M10 29l9 9"/>'),
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
let verrouille = false;   // écran verrouillé : la personne retape son mot de passe
let vue = { nom: "accueil", arg: null };
let pile = [];            // écrans précédents, pour le bouton retour

/* ---------------- Stockage ---------------- */
function charger() {
  try { const b = localStorage.getItem(CLE); if (b) { const s = JSON.parse(b); if (s.version === 13) return s; } } catch (e) { /* stockage bloqué : données de démo */ }
  return semerComptages(seedMouvements(SEED()));
}
// Si le téléphone refuse d'enregistrer (mémoire pleine, navigation privée), l'en-tête le dit : sans cela les gestes se perdraient en silence.
let nonEnregistre = false;
function sauver() { try { localStorage.setItem(CLE, JSON.stringify(S)); nonEnregistre = false; } catch (e) { nonEnregistre = true; } }

/* ---------------- Calculs ---------------- */
const SIGNE = { "Inventaire initial": 1, "Entrée": 1, "Retour": 1, "Prêt": -1, "Perte": -1, "Sortie": -1, "Ajustement": 1, "Réparation": -1, "Retour réparation": 1, "Contrôle": 0, "Transfert": 0, "Envoi": -1, "Fiche": 0 };
// Un article retiré du stock (articles.js) n'est plus dans S.articles, mais le journal et les anciens bons le retrouvent ici.
const art = id => S.articles.find(a => a.id === id) || (S.retires || []).find(a => a.id === id);
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
  if (a.chezEtab) return { c: "sorti", t: "Envoyé : " + a.chezEtab }; // objet unique parti dans un autre établissement (groupe.js)
  if (a.type === "equip") return q >= 1 ? { c: "", t: "Au dépôt" } : { c: "sorti", t: (!estLoueur() && V("chez")) || "Chez un client" };
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
// Un article importé d'une liste n'a pas encore de photo : un pictogramme la remplace
const img = a => a.photo ? `<div class="vignette"><img src="${a.photo}" alt="" loading="lazy" width="360" height="360"></div>` : a.img ? `<div class="vignette"><img src="img/${a.img}.webp" alt="" loading="lazy" width="360" height="360"></div>` : pic(I.materiel);
const pic = ic => `<div class="vignette pic">${ic}</div>`;
const initiales = n => n.split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();
const avatar = (u, grand) => `<span class="avatar ${u.photo ? "photo" : u.role === "direction" ? "direction" : ""} ${grand === "tres" ? "tres-grand" : grand ? "grand" : ""}" aria-hidden="true">${u.photo ? `<img src="${u.photo}" alt="">` : esc(initiales(u.nom))}</span>`;
// Jauge en anneau : valeur sur maximum, chiffre au centre
function anneau(val, max, coul, centre, sous, petit) {
  const r = 52, c = 2 * Math.PI * r, f = max > 0 ? Math.max(0, Math.min(1, val / max)) : 0;
  return `<div class="anneau ${petit ? "petit" : ""}" role="img" aria-label="${esc(sous)} : ${esc(String(centre))}"><svg viewBox="0 0 120 120"><circle class="piste" cx="60" cy="60" r="${r}" fill="none" stroke-width="10"/><circle cx="60" cy="60" r="${r}" fill="none" stroke="${coul}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(f * c).toFixed(1)} ${c.toFixed(1)}"/></svg><div class="centre"><b>${centre}</b><small>${sous}</small></div></div>`;
}
const couleurEtat = e => e.c === "zero" ? "var(--alerte)" : e.c === "sorti" ? "var(--sortie)" : e.c === "bas" ? "var(--attention)" : "var(--retour)";
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* ---------------- Mouvements ---------------- */
// Numéro du prochain mouvement : toujours au-dessus du plus grand déjà donné, pour ne jamais en réutiliser un.
function prochainMv() {
  let n = S.mouvements.length;
  S.mouvements.forEach(m => { const k = +String(m.id).replace(/\D/g, ""); if (k > n) n = k; });
  return "MV-" + String(n + 1).padStart(5, "0");
}
function mouvement(article, type, qte, extra) {
  const id = prochainMv();
  S.mouvements.push(Object.assign({ id, date: Date.now(), profil: session.profil, qui: session.nom, uid: session.uid, article, type, qte, evenement: "", motif: "" }, extra || {}));
  verifierSeuil(article);
  sauver();
  return id;
}
/* « Annuler » pendant 10 secondes. Le journal ne s'efface pas : l'annulation ajoute la même ligne en négatif,
   signée par la personne. Si un bon a été rempli, ses lignes sont retirées. */
function annulable(ids, texte, bonId, lignes) {
  $$(".toast").forEach(x => x.remove());
  const d = document.createElement("div"); d.className = "toast avec-bouton"; d.setAttribute("role", "status");
  d.innerHTML = `<span>${esc(texte)}</span><button>Annuler</button><i class="decompte" aria-hidden="true"></i>`;
  document.body.appendChild(d);
  const t = setTimeout(() => d.remove(), 10000);
  d.querySelector("button").onclick = () => { clearTimeout(t); d.remove(); annuler(ids, bonId, lignes); };
}
function annuler(ids, bonId, lignes) {
  ids.filter(Boolean).forEach(id => {
    const m = S.mouvements.find(x => x.id === id);
    if (!m || S.mouvements.some(x => x.annule === id)) return;
    const c = Object.assign({}, m, { id: prochainMv(), date: Date.now(), profil: session.profil, qui: session.nom, uid: session.uid, qte: -m.qte, motif: "Annulation de " + m.id, annule: m.id });
    delete c.photo; S.mouvements.push(c);
  });
  const b = bonId && S.bons.find(x => x.id === bonId);
  if (b && !b.signature && lignes) {
    lignes.forEach(([id, q]) => { const l = b.lignes.find(x => x[0] === id); if (l) l[1] -= q; });
    b.lignes = b.lignes.filter(l => l[1] > 0);
    if (!b.lignes.length && !(b.manquants || []).length) { S.bons = S.bons.filter(x => x !== b); if (vue.nom === "bon") vue = pile.pop() || { nom: "accueil" }; }
  }
  sauver(); rendre(); toast("Annulé. Le journal garde les deux lignes.");
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
// Les anciens noms d'écran restent valables (liens directs, démo guidée).
const ALIAS = { terrain: "accueil", releve: "accueil", direction: "accueil", abonnement: "installation", scanner: "depot", profil: "accueil" };
let entree = true, toutVoir = false;
/* Recherche dans les listes : le texte tapé filtre les lignes sans redessiner l'écran (le clavier reste ouvert). */
const JR_VUES = 8, JR_PAS = 40; // journal : huit lignes à l'arrivée, quarante de plus à chaque « Afficher la suite »
let filtreTexte = "", jr = { type: "tous", q: "", n: JR_VUES };
const sansAccent = t => String(t).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
const cherchable = (...t) => esc(sansAccent(t.filter(Boolean).join(" ")));
const champFiltre = (cible, exemple) => `<label class="recherche">${I.loupe}<span class="cache">Chercher dans la liste</span><input type="search" data-filtre="${cible}" value="${esc(filtreTexte)}" placeholder="${esc(exemple)}" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search"></label>`;
function filtrerListe(champ) {
  const cible = $(champ.dataset.filtre); if (!cible) return 0;
  const mots = sansAccent(champ.value.trim()).split(/\s+/).filter(Boolean); let n = 0;
  cible.querySelectorAll("[data-cherche]").forEach(li => { const ok = mots.every(m => li.dataset.cherche.includes(m)); li.hidden = !ok; if (ok) n += 1; li.classList.toggle("premier", ok && n === 1); });
  const rien = cible.querySelector("[data-rien]"); if (rien) rien.hidden = n > 0;
  const c = $("[data-filtre-compte]"); if (c) c.textContent = mots.length ? `${n} sur ${cible.querySelectorAll("[data-cherche]").length}` : "";
  return n;
}
function aller(nom, arg, racine) {
  entree = true; toutVoir = false;
  if (vue.nom !== nom) { filtreTexte = ""; jr = { type: "tous", q: "", n: JR_VUES }; }
  if (racine) pile = [];
  else if (vue.nom !== nom || vue.arg !== arg) pile = pile.concat([vue]).slice(-20);
  vue = { nom, arg }; rendre(); window.scrollTo(0, 0);
}
function toast(t) {
  $$(".toast").forEach(x => x.remove());
  const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t;
  document.body.appendChild(d); setTimeout(() => d.remove(), 3000);
}
const DEMO = `<div class="demo">Démonstration · données fictives</div>`;
const mouvementReduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function animerChiffres(r) {
  if (mouvementReduit()) return;
  r.querySelectorAll("[data-compte]").forEach(el => {
    const fin = +el.dataset.compte, fmt = el.dataset.format === "argent" ? argent : n => Math.round(n).toLocaleString("fr-FR");
    if (!fin) return;
    const t0 = performance.now(), d = 800;
    const pas = t => { const k = Math.min(1, (t - t0) / d), v = fin * (1 - Math.pow(1 - k, 3)); el.textContent = fmt(k < 1 ? (Math.abs(fin) >= 100 ? Math.round(v) : v) : fin); if (k < 1) requestAnimationFrame(pas); };
    el.textContent = fmt(0); requestAnimationFrame(pas);
  });
}

function rendre() {
  if (FRANCE_SEULE && S.monnaie !== "EUR") { S.monnaie = "EUR"; sauver(); }
  if (typeof rafraichirPalette === "function") rafraichirPalette();
  const r = $("#racine");
  if (!session && invitation) r.innerHTML = vInvitation();
  else if (!session && installateur) r.innerHTML = coqueEspace();
  else if (!session) r.innerHTML = vConnexion();
  else if (verrouille) r.innerHTML = vVerrou();
  else r.innerHTML = coque();
  if (entree) {
    // Les blocs arrivent l'un après l'autre et les chiffres montent, seulement à l'ouverture d'un écran.
    entree = false; r.classList.add("entree"); animerChiffres(r);
    clearTimeout(rendre.t); rendre.t = setTimeout(() => r.classList.remove("entree"), 1400);
  }
  brancher();
  if (vue.nom === "etiquettes") dessinerQr();
  dessinerTour();
}

/* ---------------- Connexion : identifiant et mot de passe ----------------
   Personne n'est affiché à l'avance : chacun entre ce que son responsable lui a donné. */
const boutonReglages = `<button class="rond" data-act="reglages" aria-label="Réglages de l'appareil">${I.reglages}</button>`;
const CLE_IDENT = "rayon-identifiant";
const identMemorise = () => { try { return localStorage.getItem(CLE_IDENT) || ""; } catch (e) { return ""; } };
let msgConnexion = "", identSaisi = null;
const champMdp = (auto) => `<span class="mdp"><input name="mdp" type="password" autocomplete="${auto}" required><button type="button" class="voir" data-voir aria-label="Afficher le mot de passe">${I.oeil}</button></span>`;
function vConnexion() {
  const e = S.entreprise || {}, memo = identMemorise(), ident = identSaisi !== null ? identSaisi : memo;
  return `${DEMO}<div class="connexion">
    <div class="barre"><div class="marque">${e.logo ? `<img src="${e.logo}" alt="" class="logo-client">` : I.logo}<span>${esc(e.nom || "Stock démo")}</span></div>${boutonReglages}</div>
    <div class="c-tete"><h1>Bonjour</h1><p class="sous es-etat">Entrez votre identifiant et votre mot de passe.</p></div>
    <form class="c-form verre" data-form="connexion">
      <label class="champ">Identifiant<input name="ident" value="${esc(ident)}" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required${msgConnexion ? ' aria-invalid="true"' : ""}></label>
      <label class="champ">Mot de passe${champMdp("current-password")}</label>
      <label class="case"><input type="checkbox" name="memo" ${memo ? "checked" : ""}>Garder mon identifiant sur ce téléphone</label>
      <p class="message" role="alert">${esc(msgConnexion)}</p>
      <button class="btn plein">Se connecter</button>
    </form>
    <section class="es-carte pi-carte pi-nue c-liens"><ul class="es-lignes">
      ${piLigne({ g: piPic(I.fleche), t: "Visite guidée en 2 minutes", a: `data-act="tour"` })}
      ${dejaInstallee() ? "" : piLigne({ g: piPic(I.telecharger), t: "Installer l'appli", s: "Une icône sur l'écran d'accueil, même sans réseau", a: `data-act="ecranAccueil"` })}
    </ul></section>
    ${blocEtabConnexion()}<details class="c-demo" open><summary><span><b>Comptes de démonstration</b><small>Un toucher pour entrer. Chacun a son écran.</small></span></summary>
      <div class="c-comptes">${EQUIPE_DEMO.filter(d => S.equipe.some(x => x.id === d.id && (S.etab || x.identifiant === d.identifiant) && x.empreinte === empreinte(x.id, d.mdp))).map(d => { const u = S.equipe.find(x => x.id === d.id) || d; return `<button type="button" data-remplir="${S.etab ? u.identifiant : d.identifiant}|${d.mdp}" title="Identifiant ${S.etab ? u.identifiant : d.identifiant}, mot de passe ${d.mdp}">${avatar(u)}<span><b>${esc(u.poste)}</b><small>${esc(u.nom)}</small></span>${I.fleche}</button>`; }).join("")}</div>
      <p class="w-note">Dans l'appli livrée, cette liste n'existe pas.</p>
    </details>
    <details class="c-demo c-options"><summary><span><b>Options de la démonstration</b><small>Démo réglée pour : ${esc(metier().nom)}</small></span></summary>
      <div class="c-pied">
        <p><button class="lien" data-act="metiers">Voir un autre métier</button></p>
        <p>${ESPACE ? `<button class="lien" data-act="installateur">Mon espace (installateur)</button> · ` : ""}<button class="lien" data-act="reinit">Remettre la démo à zéro</button></p>
      </div>
    </details>
  </div>`;
}
function seConnecter(f) {
  const ident = f.ident.value.trim().toLowerCase(), mdp = f.mdp.value;
  identSaisi = f.ident.value.trim();
  const e = S.essais[ident] || {};
  if (e.jusqua && e.jusqua > Date.now()) { msgConnexion = `Trop d'essais. Réessayez dans ${Math.ceil((e.jusqua - Date.now()) / 1000)} secondes.`; return rendre(); }
  const u = S.equipe.find(x => x.identifiant === ident);
  const ok = !!(u && u.actif && u.empreinte === empreinte(u.id, mdp));
  S.connexions.unshift({ date: Date.now(), uid: u ? u.id : "", nom: u ? u.nom : ident || "?", ok, motif: "Connexion" });
  S.connexions = S.connexions.slice(0, 200);
  if (ok) {
    delete S.essais[ident]; sauver();
    try { if (f.memo.checked) localStorage.setItem(CLE_IDENT, identSaisi); else localStorage.removeItem(CLE_IDENT); } catch (x) { /* stockage bloqué */ }
    msgConnexion = ""; identSaisi = null;
    return ouvrirSession(u);
  }
  const n = S.essais[ident] = S.essais[ident] || { n: 0 };
  n.n += 1;
  if (n.n >= 5) { n.jusqua = Date.now() + 30000; n.n = 0; msgConnexion = "Trop d'essais. Réessayez dans 30 secondes."; }
  else msgConnexion = u && !u.actif ? "Cet accès a été retiré. Voyez votre responsable." : `Identifiant ou mot de passe incorrect. Encore ${5 - n.n} essai${5 - n.n > 1 ? "s" : ""}.`;
  sauver(); rendre();
  if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
}
function vVerrou() {
  const u = moi();
  return `${DEMO}<div class="connexion">
    <div class="barre"><div class="marque">${I.cadenas}<span>Écran verrouillé</span></div>${boutonReglages}</div>
    <div class="c-tete centre">${avatar(u, true)}<h1>${esc(u.nom)}</h1><p class="sous">${esc(u.poste || "")}</p></div>
    <form class="c-form verre" data-form="deverrouiller">
      <label class="champ">Mot de passe${champMdp("current-password")}</label>
      <p class="message" role="alert">${esc(msgConnexion)}</p>
      <button class="btn plein">Déverrouiller</button>
    </form>
    <p class="c-pied"><button class="lien" data-act="sortir">Ce n'est pas moi : changer de personne</button></p>
  </div>`;
}
function deverrouiller(f) {
  const u = moi(), ok = u.actif !== false && u.empreinte === empreinte(u.id, f.mdp.value);
  S.connexions.unshift({ date: Date.now(), uid: u.id, nom: u.nom, ok, motif: "Déverrouillage" });
  const e = S.essais[u.identifiant] = S.essais[u.identifiant] || { n: 0 };
  if (ok) { delete S.essais[u.identifiant]; verrouille = false; msgConnexion = ""; sauver(); activite(); return rendre(); }
  e.n += 1;
  // Cinq erreurs à l'écran verrouillé : la session se ferme, il faut se reconnecter.
  if (e.n >= 5) { e.n = 0; sauver(); msgConnexion = "Trop d'essais : reconnectez-vous."; return ACTIONS.sortir(true); }
  msgConnexion = `Mot de passe incorrect. Encore ${5 - e.n} essai${5 - e.n > 1 ? "s" : ""}.`;
  sauver(); rendre();
}
const moi = () => (session && S.equipe.find(x => x.id === session.uid)) || { id: "", nom: session ? session.nom : "", role: session ? session.profil : "terrain", poste: "" };
function ouvrirSession(u) {
  session = { uid: u.id, nom: u.nom, profil: u.role, admin: !!u.admin };
  verrouille = false; pile = []; entree = true; toutVoir = false; ongletAccueil = "jour"; tableauEntier = false;
  vue = { nom: vueDepart(u.role) }; lienProfond(); activite(); rendre(); window.scrollTo(0, 0);
  // Appui long sur l'icône de l'appli, « Scanner une étiquette » : la caméra s'ouvre dès l'entrée.
  if (raccourciScanner) { raccourciScanner = false; camera(); }
}
let raccourciScanner = new URLSearchParams(location.search).get("raccourci") === "scanner";
/* Verrouillage automatique après un temps sans toucher l'écran (réglé par le gérant) */
let minuteur = null;
function activite() {
  clearTimeout(minuteur);
  const min = S.reglages.verrou;
  if (session && !verrouille && min > 0) minuteur = setTimeout(() => {
    if (session && !document.querySelector(".camera")) { verrouille = true; msgConnexion = ""; $$(".feuille").forEach(f => f.remove()); rendre(); }
  }, min * 60000);
}
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, activite, { passive: true }));

/* Réglages de l'appareil : le thème, et de quoi verrouiller ou changer de personne */
function feuilleReglages() {
  const ap = { clair: ["#f2f3f5", "#ffffff", "#f4b223"], sombre: ["#141619", "#1e2125", "#f5b82e"], nuit: ["#111a2c", "#182339", "#e9eef8"], auto: ["#f2f3f5", "#141619", "#f5b82e"] };
  const c = choixTheme();
  // Quatre thèmes en lignes (le choisi porte la pastille de la marque), puis ce qu'on fait de l'appareil, en lignes aussi.
  const lignes = (session ? [piLigne({ g: piPic(I.cadenas), t: "Verrouiller", a: `data-a="verrouiller"` }), piLigne({ g: piPic(I.sortir), t: "Se déconnecter", a: `data-a="sortir"` })] : [])
    .concat(dejaInstallee() ? [] : [piLigne({ g: piPic(I.telecharger), t: "Installer l'appli sur cet appareil", a: `data-a="ecranAccueil"` })]);
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tr" class="pi-f"><h1 id="tr">Réglages de l'appareil</h1>
    ${sousAide("Le thème ne change que cet appareil.", "Les couleurs des actions gardent leur sens dans tous les thèmes : orange, ça part ; vert, ça revient.")}
    <div class="themes" role="radiogroup" aria-label="Thème">${Object.entries(THEMES).map(([k, n]) => `<label><input type="radio" name="theme" value="${k}" ${k === c ? "checked" : ""}><span class="apercu" style="background:${ap[k][0]}"><i style="background:${ap[k][1]}"></i><i style="background:${ap[k][2]}"></i></span><span>${n}</span></label>`).join("")}</div>
    ${lignes.length ? `<ul class="es-lignes pi-f-lignes">${lignes.join("")}</ul>` : ""}
    <div class="valider" style="grid-template-columns:1fr"><button class="btn" data-x>Fermer</button></div></div>`);
  f.querySelectorAll("input[name=theme]").forEach(i => i.onchange = () => { try { localStorage.setItem(CLE_THEME, i.value); } catch (e) { /* stockage bloqué */ } appliquerTheme(); rendre(); });
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { f.remove(); ACTIONS[b.dataset.a](); });
}
/* =================================================================
   LA COQUE : une même appli pour tous, réglée par rôle et par entreprise.
   Téléphone : barre flottante en bas, Scanner au milieu, « Plus » pour le reste.
   Ordinateur : menu à gauche.
   ================================================================= */
const VUES = () => ({
  accueil: () => vAccueil(), depot: () => vDepot(), analyses: () => vAnalyses(), tournee: () => vTournee(),
  objet: tObjet, kits: tKits, recuperer: tRecuperer, retourEv: tRetourEvenement, chercher: tChercher, jour: tJour, bon: tBon,
  preparer: tPreparer, preparation: tPreparation, facture: vFacture, reception: tReception, receptionCmd: tReceptionCmd, zones: tZones, zone: tZone,
  materiel: bMateriel, fiche: bFiche, commandes: bCommandes, journal: bJournal, docs: bDocs, etiquettes: bEtiquettes,
  inventairePapier: bInventairePapier, refacturer: bRefacturer, rapport: dRapport, installation: dInstallation, equipe: vEquipe, personne: vPersonne, compteRendu: vCompteRendu,
  reservations: bReservations, reservation: bReservation, clients: bClients, client: vClient, devisLoc: vDevisLocation,
  controles: vRegistreControles, lieux: vLieux, lieu: vLieu, ficheLieu: vFicheLieu, groupe: vGroupe, article: vArticle,
});
// Les écrans du dépôt restent sur une colonne étroite, même sur ordinateur.
const ETROITS = new Set(["tournee", "depot", "objet", "kits", "recuperer", "retourEv", "chercher", "jour", "bon", "preparer", "preparation", "reception", "receptionCmd", "zones", "zone", "lieux", "lieu", "article"]);
const PARENT = { client: "clients", devisLoc: "reservations", fiche: "materiel", reservation: "reservations", etiquettes: "docs", inventairePapier: "docs", refacturer: "docs", rapport: "docs", controles: "docs", lieu: "lieux", ficheLieu: "lieux", retourEv: "recuperer", preparation: "preparer", receptionCmd: "reception", zone: "zones" };
const TITRES = { client: "Client", devisLoc: "Devis de location", objet: "Objet", fiche: "Fiche de l'objet", bon: "Bon", facture: "Facture de casse", reservation: "Réservation", retourEv: "Retour", preparation: "Préparation", receptionCmd: "Réception", zone: "Comptage", etiquettes: "Étiquettes", inventairePapier: "Inventaire", refacturer: "À refacturer", rapport: "Rapport", controles: "Contrôles", lieu: "Contenu du lieu", ficheLieu: "Fiche du lieu", groupe: "Groupe", article: "Article", personne: "Fiche", compteRendu: "Compte rendu d'activité" };
const sectionsPermises = () => Object.keys(SECTIONS).filter(k => k !== "accueil" && permis(k));
// « Tournée » est l'écran du chauffeur : elle n'est proposée qu'à lui, ou au rôle qui l'a dans sa barre. L'écran reste ouvert à tous par son lien.
const tourneePourMoi = () => !!session && (session.profil === "chauffeur" || cfg().barre.includes("tournee"));

function coque() {
  // Une fiche de l'équipe s'ouvre aussi pour qui n'a pas l'écran « Équipe » : chacun voit la sienne (equipe.js vérifie qui voit qui).
  const nom = ALIAS[vue.nom] || vue.nom, sec = (nom === "personne" || nom === "compteRendu") ? (permis("equipe") ? "equipe" : nom) : PARENT[nom] || nom;
  const vues = VUES(), ok = permis(sec) && vues[nom];
  const corps = ok ? vues[nom](vue.arg) : `<h1>Pas d'accès</h1><p class="sous">Cet écran n'est pas prévu pour votre rôle. Demandez à votre responsable.</p>`;
  const u = moi(), e = S.entreprise || {};
  const barre = cfg().barre.filter(k => permis(k)).slice(0, 3);
  while (barre.length < 3) barre.push("");
  const courant = k => (k === sec ? 'aria-current="page"' : "");
  const bouton = k => k ? `<button data-racine="${k}" ${courant(k)}>${I[SECTIONS[k].i]}<span>${esc(titreCourt(k))}</span></button>` : `<span></span>`;
  const dansBarre = barre.includes(sec);
  // Menu de gauche : les gestes du dépôt tiennent en une entrée (plus les raccourcis du rôle), pour garder la gestion visible.
  // Un intertitre qui coiffe une seule entrée du même nom (« Au dépôt ») ne s'écrit pas.
  const groupes = Object.entries(GROUPES).map(([g, t]) => { const l = sectionsPermises().filter(k => SECTIONS[k].g === g && (g !== "depot" || k === "depot" || barre.includes(k)) && (k !== "tournee" || tourneePourMoi())); return l.length ? `${l.length === 1 && titreSection(l[0]) === t ? "" : `<h4>${t}</h4>`}${l.map(k => `<button data-racine="${k}" ${courant(k)}>${I[SECTIONS[k].i]}<span>${esc(titreSection(k))}</span></button>`).join("")}` : ""; }).join("");
  const titre = nom === "accueil" ? esc(e.nom || "Stock démo") : esc(TITRES[nom] || titreSection(nom) || "");
  // Quand l'en-tête porte déjà le mot du grand titre, le titre n'est écrit qu'une fois (styles.css : .titre-double).
  const h1 = nom !== "accueil" && corps.match(/^\s*<h1>([^<]*)<\/h1>/), titreDouble = !!h1 && h1[1] === titre;
  return `<div class="app">${DEMO}
    <aside class="cote" aria-label="Menu">
      <div class="marque">${e.logo ? `<img src="${e.logo}" alt="" class="logo-client">` : I.logo}<span>${esc(e.nom || "Stock démo")}</span></div>
      <button class="btn plein" data-act="camera">${I.scan}Scanner</button>
      <nav>${navGroupe(courant)}<button data-racine="accueil" ${courant("accueil")}>${I.maison}<span>Accueil</span></button>${groupes}</nav>
      <div class="cote-pied"><button class="moi" data-act="monProfil" aria-label="Ma fiche">${avatar(u)}<span><b>${esc(u.nom)}</b><small>${esc(u.poste || "")}</small></span></button>
        <div class="cote-outils"><button class="rond" data-act="verrouiller" aria-label="Verrouiller l'écran">${I.cadenas}</button>${boutonReglages}<button class="rond" data-act="sortir" aria-label="Se déconnecter">${I.sortir}</button></div></div>
    </aside>
    <header class="haut verre">
      ${nom === "accueil" ? `<div class="marque">${e.logo ? `<img src="${e.logo}" alt="" class="logo-client">` : I.logo}</div>` : `<button class="rond" data-act="retour" aria-label="Retour">${I.precedent}</button>`}
      <b class="haut-titre">${nom === "accueil" ? `<span class="ht-tel">${titre}</span><span class="ht-ordi">Accueil</span>` : titre}</b>
      <form class="haut-cherche" data-form="rapide" role="search"><label class="recherche">${I.loupe}<span class="cache">Chercher un objet ou taper le code d'une étiquette</span><input type="search" name="q" placeholder="Chercher un objet, ou taper un code" autocomplete="off" autocapitalize="none" spellcheck="false"></label></form>${nonEnregistre ? `<span class="hors-ligne non-enregistre" role="status" title="Ce téléphone refuse d'enregistrer : mémoire pleine ou navigation privée. Ce que vous faites sera perdu à la fermeture.">Non enregistré</span>` : navigator.onLine === false ? `<span class="hors-ligne" role="status" title="L'appli continue sans réseau. Vos gestes sont gardés sur ce téléphone.">Hors ligne</span>` : ""}
      <div class="outils"><button class="rond" data-act="verrouiller" aria-label="Verrouiller l'écran">${I.cadenas}</button><button class="avatar-btn" data-act="plus" aria-label="Mon compte et tous les écrans">${avatar(u)}</button></div>
    </header>
    <main class="${ETROITS.has(nom) ? "t-main" : "b-main"}${titreDouble ? " titre-double" : ""}">${bandeauEtab()}${corps}</main>
    <nav class="barre-bas verre" aria-label="Navigation">${bouton(barre[0])}${bouton(barre[1])}
      <button class="bb-scan" data-act="camera" aria-label="Scanner une étiquette">${I.scan}</button>
      ${bouton(barre[2])}<button data-act="plus" ${dansBarre || sec === "accueil" || sec === "groupe" || !SECTIONS[sec] ? "" : 'aria-current="page"'}>${I.grille}<span>Plus</span></button></nav>
  </div>`;
}

/* « Plus » : tout ce que la personne a le droit d'ouvrir, en tuiles. Pas de menu qui défile de côté. */
function feuillePlus() {
  const u = moi(), sec = PARENT[ALIAS[vue.nom] || vue.nom] || ALIAS[vue.nom] || vue.nom;
  // Gérant et responsable : leurs écrans d'abord, et une seule tuile « Au dépôt ». Un geste du dépôt que l'écran « Au dépôt »
  // propose déjà n'a pas sa tuile ici (même règle que le menu de gauche). Le magasinier et le chauffeur gardent leurs tuiles.
  const gestion = !["terrain", "chauffeur"].includes(session.profil), ici = vue;
  // L'écran « Au dépôt » est lu tel qu'il s'affichera une fois ouvert (ses tuiles dépendent de l'écran en cours).
  let ecranDepot = ""; if (gestion) { vue = { nom: "depot", arg: null }; try { ecranDepot = vDepot(); } finally { vue = ici; } }
  const garde = k => (k !== "tournee" || tourneePourMoi()) && (!gestion || SECTIONS[k].g !== "depot" || k === "depot" || !new RegExp(`data-(aller|racine)="${k}"`).test(ecranDepot));
  const permises = sectionsPermises().filter(garde), du = g => permises.filter(k => SECTIONS[k].g === g);
  const grille = l => `<div class="plus-grille">${l.map(k => `<button data-k="${k}" ${k === sec ? 'aria-current="page"' : ""}><span class="pastille">${I[SECTIONS[k].i]}</span>${esc(titreSection(k))}</button>`).join("")}</div>`;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-label="Tous les écrans" class="pi-f pi-plus">
    <button class="plus-moi" data-a="monProfil">${avatar(u, true)}<span><b>${esc(u.nom)}</b><small>${esc(u.poste || "")}${session.admin ? " · administre le compte" : ""}</small><small class="plus-fiche">Ma fiche et ma photo</small></span><span class="chev">${I.chevron}</span></button>
    ${gestion ? `${grille(du("gestion").concat(du("depot"), du("compte")))}` : Object.entries(GROUPES).map(([g, t]) => du(g).length ? `<h2>${t}</h2>${grille(du(g))}` : "").join("")}
    <div class="valider trois"><button class="btn" data-a="reglages">${I.reglages}Thème</button><button class="btn" data-a="verrouiller">${I.cadenas}Verrouiller</button><button class="btn" data-a="sortir">${I.sortir}Sortir</button></div>
    ${installateur ? `<div class="valider" style="grid-template-columns:1fr"><button class="btn plein" data-a="revenirConfig">Revenir au réglage de l'installation</button></div>` : ""}
  </div>`);
  f.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { f.remove(); aller(b.dataset.k, null, true); });
  f.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { f.remove(); ACTIONS[b.dataset.a](); });
}

/* Accueil : une salutation, puis les blocs choisis pour ce rôle dans cette entreprise. */
// Au premier coup d'œil, l'essentiel du jour. Les courbes et l'équipe attendent dans leur onglet.
let ongletAccueil = "jour";
function vAccueil() {
  if (accueilEssentiel()) return vEssentiel();
  const u = moi(), h = new Date().getHours();
  const liste = accueilAvecControles(cfg().accueil).filter(([k]) => WIDGETS[k] && (!WIDGETS[k].si || WIDGETS[k].si()));
  const chiffres = liste.filter(([k]) => WIDGETS[k].o === "chiffres"), jour = liste.filter(([k]) => WIDGETS[k].o !== "chiffres");
  const deux = chiffres.length > 1 && jour.length > 0 && liste.length > 4, onglets = [];
  if (deux) onglets.push(["jour", "Aujourd'hui"], ["chiffres", "Chiffres"]);
  else if (fichesVisibles().length) onglets.push(["jour", "Aujourd'hui"]);
  if (fichesVisibles().length) onglets.push(["equipe", "Équipe"]);
  if (!onglets.some(([k]) => k === ongletAccueil)) ongletAccueil = "jour";
  // « Chiffres » ne recopie pas l'écran Analyses : les chiffres de la période et ce qu'Analyses ne montre pas (le dépôt en 3D), puis un bouton vers toutes les courbes.
  // Le résumé de la semaine s'y range aussi : il ne demande pas un regard chaque jour.
  const versAnalyses = deux && permis("analyses"), courbes = new Set(versAnalyses ? cfg().analyses.map(([k]) => k) : []);
  const garde = new Set(chiffres.filter(([k]) => k === "trio" || !courbes.has(k)).map(([k]) => k));
  chiffres.forEach(([k]) => { if (garde.size < 2) garde.add(k); });
  const resume = deux ? jour.filter(([k]) => k === "resume") : [];
  const blocs = !deux ? liste : ongletAccueil === "chiffres" ? chiffres.filter(([k]) => garde.has(k)).sort((a, b) => (b[0] === "trio") - (a[0] === "trio")).concat(resume) : jour.filter(([k]) => k !== "resume");
  const corps = ongletAccueil === "equipe" ? ongletEquipe() : bento(blocs, window.innerWidth < 720 && !toutVoir ? 6 : 0)
    + (versAnalyses && ongletAccueil === "chiffres" ? `<p class="toutes-courbes"><button class="btn" data-racine="analyses">${I.releve}Toutes les courbes</button></p>` : "");
  // Ouvert depuis l'accueil essentiel par « Voir tout le tableau de bord » : un lien ramène à l'essentiel.
  return `${tableauEntier && roleEssentiel() ? `<p class="es-retour"><button class="es-lien" data-act="essentiel">${I.precedent}Revenir à l'essentiel</button></p>` : ""}<div class="salut"><p class="date">${dateLongue(aujourdHui())}</p><h1>${h >= 18 || h < 5 ? "Bonsoir" : "Bonjour"} ${esc(u.nom)}</h1></div>
  ${onglets.length ? `<div class="segments onglets-accueil" role="group" aria-label="Partie de l'accueil">${onglets.map(([k, t]) => `<button data-onglet-accueil="${k}" aria-pressed="${ongletAccueil === k}">${t}</button>`).join("")}</div>` : ""}${corps}`;
}
/* ---------------- Accueil essentiel du gérant et du responsable ----------------
   Un seul chiffre en grand, quatre raccourcis ronds, une carte de quatre lignes au plus, sur fond uni et sans onglets.
   Cinq chiffres au plus sur l'écran : la phrase d'état écrit donc son nombre en lettres.
   Rien n'est retiré de l'appli : « Voir tout le tableau de bord » rouvre les onglets, pour cette visite seulement.
   Les nombres viennent des calculs existants : taches(), et les voyants « à commander » et « à décider » du panneau de pilotage. */
let tableauEntier = false;
const roleEssentiel = () => !!session && ["direction", "bureau"].includes(session.profil) && presentation() === "essentiel";
const accueilEssentiel = () => roleEssentiel() && !tableauEntier;
const EN_LETTRES = ["Aucune", "Une", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf", "Dix", "Onze", "Douze"];
const phraseEtat = (n, accord) => !n ? "Tout est à jour." : `${EN_LETTRES[n] || n} ${n > 1 ? "choses demandent" : "chose demande"} ${accord ? "votre accord" : "un regard"}.`;
const nbEs = (n, un, plusieurs) => `${n.toLocaleString("fr-FR")} ${n > 1 ? plusieurs : un}`;
// Le chiffre du gérant : la valeur du stock, et dessous ce qu'elle laisse de côté (un loueur) ou ce qui en est sorti (les autres métiers).
function heroGerant() {
  const prix = droit("prix"), loueur = (S.metier || "loueur") === "loueur";
  const pieces = S.articles.reduce((t, a) => t + Math.max(0, stock(a.id)), 0), chiffre = prix ? argent(valeurStock()) : pieces.toLocaleString("fr-FR") + " pièces";
  let sens;
  if (loueur && aDesPrets()) {
    const chez = dehors().reduce((t, x) => t + x.qte, 0), ou = estLoueur() ? "chez vos clients" : (V("chez") || "dehors").toLowerCase().replace(/^prêtés$/, "prêtées");
    sens = chez ? `${nbEs(chez, "pièce de plus est", "pièces de plus sont")} ${ou}` : "Tout votre matériel est au dépôt";
  } else {
    const l = S.mouvements.filter(m => (m.type === "Prêt" || m.type === "Sortie") && m.date >= Date.now() - 30 * J_MS);
    const n = prix ? l.reduce((t, m) => t + valeurM(m), 0) : l.reduce((t, m) => t + m.qte, 0);
    sens = n > 0 ? `${V("sortiesMot") || "Sorti"} depuis un mois : ${prix ? argent(Math.round(n)) : nbEs(n, "pièce", "pièces")}` : "Rien n'est sorti depuis un mois";
  }
  return `<div class="es-hero"><small>${loueur ? "Valeur du matériel au dépôt" : "Valeur du stock"}</small><b class="es-chiffre${chiffre.length > 11 ? " es-long" : ""}">${chiffre}</b><p>${esc(sens)}</p></div>`;
}
const heroResponsable = n => `<div class="es-hero"><small>Aujourd'hui</small>${n ? `<b class="es-chiffre">${n}<span> ${n > 1 ? "choses" : "chose"} à faire</span></b>` : `<b class="es-chiffre es-calme">Rien à faire pour l'instant</b>`}</div>`;
// Quatre raccourcis, parmi les écrans que le rôle a le droit d'ouvrir. S'il en manque un, le suivant de la liste prend sa place.
function raccourcisEssentiel() {
  const gerant = session.profil === "direction", paire = (S.metier || "loueur") === "loueur" ? ["reservations", "commandes"] : ["commandes", "reservations"];
  const voulus = gerant ? ["materiel", paire.find(k => permis(k)), "analyses", S.taille === "seul" ? "depot" : "equipe", "docs", "journal", "equipe", "clients", "depot"]
    : ["materiel", paire.find(k => permis(k)), "journal", "docs", "analyses", "clients", "equipe", "depot"];
  const l = [...new Set(voulus.filter(k => k && permis(k)))].slice(0, 4), court = window.innerWidth < 360;
  return l.length ? `<nav class="es-raccourcis" aria-label="Raccourcis">${l.map(k => `<button data-racine="${k}"><span class="es-rond">${I[SECTIONS[k].i]}</span><span>${k === "analyses" ? "Chiffres" : esc(court ? titreCourt(k) : titreSection(k))}</span></button>`).join("")}</nav>` : "";
}
// Gérant : trois sujets au plus. Une ligne n'existe que si son nombre n'est pas zéro.
function lignesGerant() {
  const l = [], rupt = S.articles.filter(a => ["zero", "bas"].includes(etat(a).c)).length;
  const dec = droit("valider") && actif("MO-CMD") ? S.commandes.filter(c => c.statut === "À valider").length : 0;
  const faire = taches().filter(x => !x.bouton), depot = faire.every(x => ["sortie", "retour", "compter", "alerte"].includes(x.c));
  if (rupt) l.push({ c: "alerte", t: nbEs(rupt, "objet est à commander", "objets sont à commander"), a: permis("materiel") ? `data-aller="materiel" data-arg="alerte"` : "" });
  if (dec) l.push({ c: "marque", n: dec, accord: true, t: nbEs(dec, "commande attend votre accord", "commandes attendent votre accord"), a: permis("commandes") ? `data-aller="commandes"` : `data-act="aDecider"` });
  if (faire.length) l.push({ c: "compter", t: nbEs(faire.length, "chose est à faire", "choses sont à faire") + (depot ? " au dépôt" : ""), a: `data-act="tachesAFaire"` });
  return l;
}
// Responsable : ses tâches, une ligne chacune. Une commande à valider ouvre les commandes (ou la feuille « À décider »).
const lignesResponsable = () => taches().map(x => ({ c: x.c, t: x.t, a: x.a || (permis("commandes") ? `data-aller="commandes"` : `data-act="aDecider"`) }));
const ligneEs = x => `<li>${x.a ? `<button class="es-ligne" ${x.a}>` : `<div class="es-ligne">`}<i style="--c:var(--${x.c})"></i><span>${esc(x.t)}</span>${x.a ? `<span class="chev">${I.chevron}</span></button>` : `</div>`}</li>`;
/* Les mêmes composants, pour les autres pages du gérant et du responsable (styles.css : « Refonte : pilotage »).
   piLigne : g = ce qui se pose à gauche (avatar, vignette, pastille), ou c = la couleur d'une puce ; t = le texte, s = sa seconde ligne grise ;
   v = la valeur à droite ; a = les attributs du bouton (la ligne porte alors un chevron). t, s et v sont du HTML déjà échappé. */
const piPic = ic => `<span class="pi-pic">${ic}</span>`;
const piLigne = x => {
  const dedans = `${x.g || (x.c ? `<i style="--c:var(--${x.c})"></i>` : "")}<span class="pi-txt">${x.t}${x.s ? `<small>${x.s}</small>` : ""}</span>${x.v !== undefined && x.v !== "" ? `<span class="pi-val">${x.v}</span>` : ""}${x.a && !x.sansChevron ? `<span class="chev">${I.chevron}</span>` : ""}`;
  return `<li${x.li ? " " + x.li : ""}>${x.a ? `<button class="es-ligne${x.k ? " " + x.k : ""}" ${x.a}>${dedans}</button>` : `<div class="es-ligne${x.k ? " " + x.k : ""}">${dedans}</div>`}</li>`;
};
const piCarte = (titre, lignes, vide, cls) => `<section class="es-carte pi-carte${titre ? "" : " pi-nue"}${cls ? " " + cls : ""}">${titre ? `<h2>${titre}</h2>` : ""}${lignes.length ? `<ul class="es-lignes">${lignes.join("")}</ul>` : `<p class="es-rien">${vide || "Rien à signaler."}</p>`}</section>`;
// Une rangée de raccourcis ronds : [pictogramme, libellé, attributs du bouton] ou, pour un lien, [pictogramme, libellé, attributs, "a"].
const piRonds = (l, cls) => { l = l.filter(Boolean); return l.length ? `<nav class="es-raccourcis pi-ronds${cls ? " " + cls : ""}" aria-label="Actions">${l.map(([ic, t, a, b]) => `<${b || "button"} ${a}><span class="es-rond">${ic}</span><span>${t}</span></${b || "button"}>`).join("")}</nav>` : ""; };
// Un volet replié dans une carte de lignes : le détail attend un toucher.
const piVolet = (titre, corps, attr) => `<li><details class="pi-volet"${attr ? " " + attr : ""}><summary class="es-ligne"><span>${titre}</span><span class="chev">${I.chevron}</span></summary><div class="pi-volet-corps">${corps}</div></details></li>`;
function vEssentiel() {
  const u = moi(), h = new Date().getHours(), gerant = session.profil === "direction";
  let lignes = gerant ? lignesGerant() : lignesResponsable(), suite = "";
  const accord = gerant && lignes.length === 1 && lignes[0].accord, n = accord ? lignes[0].n : lignes.length;
  if (!gerant && n > TACHES_VUES) {
    const reste = n - TACHES_VUES; lignes = lignes.slice(0, TACHES_VUES);
    suite = `<li><button class="es-ligne es-suite" data-act="tachesToutes"><span>${reste > 1 ? `Voir les ${reste} autres` : "Voir la dernière"}</span><span class="chev">${I.chevron}</span></button></li>`;
  }
  return `<div class="essentiel">
  <div class="salut"><p class="date">${dateLongue(aujourdHui())}</p><h1>${h >= 18 || h < 5 ? "Bonsoir" : "Bonjour"} ${esc(u.nom)}</h1><p class="es-etat">${phraseEtat(n, accord)}</p></div>
  ${gerant ? heroGerant() : heroResponsable(n)}
  ${raccourcisEssentiel()}
  <section class="es-carte" aria-labelledby="es-titre"><h2 id="es-titre">${gerant ? "À voir aujourd'hui" : "À faire"}</h2>
    ${lignes.length ? `<ul class="es-lignes">${lignes.map(ligneEs).join("")}${suite}</ul>` : `<p class="es-rien">Rien à signaler.</p>`}</section>
  <p class="es-pied"><button class="es-lien" data-act="tableauEntier">Voir tout le tableau de bord</button></p>
  </div>`;
}
// « À décider » dans une feuille, pour qui valide les commandes sans avoir l'écran Commandes.
function feuilleDecider() {
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-label="À décider">${wDecider() || `<p class="vide">Rien n'attend votre accord.</p>`}
    <div class="valider" style="grid-template-columns:1fr"><button class="btn" data-x>Fermer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  brancher();
  f.querySelectorAll("[data-valider]").forEach(b => { const suite = b.onclick; b.onclick = e => { f.remove(); if (suite) suite.call(b, e); }; });
}
// Les gestes du magasinier, ouverts à toute l'équipe.
const vDepot = () => `<h1>Au dépôt</h1>${wScan()}${wActions()}`;
function tObjet(id) {
  const a = art(id); if (!a) return `<p>Objet introuvable.</p>`;
  if (a.retire) return objetRetire(a);
  const q = stock(id), e = etat(a), pret = logique(a) === "pret";
  // La jauge tient en une ligne : le chiffre en grand, le niveau normal, une barre. Les boutons restent visibles à l'arrivée sur un petit téléphone.
  const part = a.cible > 0 ? Math.max(0, Math.min(100, Math.round(q / a.cible * 100))) : 0;
  const jauge = a.type === "equip" ? `<div class="to-jauge"><b class="t-stock">${q >= 1 ? "Ici" : "Sorti"}</b></div>`
    : `<div class="to-jauge" role="img" aria-label="${q} en stock sur ${a.cible}"><b class="t-stock">${q}</b><span>en stock<br>sur ${a.cible}</span><i class="to-barre"><i style="width:${part}%;background:${couleurEtat(e)}"></i></i></div>`;
  const lots = metier().dlc ? lotsEnStock(id) : [];
  const c = conseil(a), d = dehors(id);
  const b1 = pret ? ["Prêt", "sortie", I.sortie, V("pretSortie"), V("pretSortieSous")] : ["Sortie", "sortie", I.sortie, V("prendre"), V("prendreSous")];
  const b2 = pret ? ["Retour", "retour", I.retour, V("pretRetour"), V("pretRetourSous")] : ["Surplus", "retour", I.retour, V("remettre"), V("remettreSous")];
  const bouton = ([mvt, cl, ic, t, st]) => `<button class="t-action ${cl} ${c.mvt === mvt ? "conseil" : ""}" data-mvt="${mvt}">${ic}<span>${t}<small>${st}</small></span></button>`;
  const leger = ([mvt, cl, ic, t]) => `<button class="t-action leger ${cl}" data-mvt="${mvt}">${ic}<span>${t}</span></button>`;
  // Un geste impossible n'est pas proposé : rien à sortir quand le stock est vide, rien à rentrer quand rien n'est dehors.
  const faisable = b => b[0] === "Retour" ? d.length > 0 : ["Prêt", "Sortie"].includes(b[0]) ? q > 0 : true;
  // Le geste le plus probable passe en premier et un peu plus grand. Deux gestes en couleur pleine, pas plus : les autres sont en contour.
  const ordre = (c.mvt === b2[0] ? [b2, b1] : [b1, b2]).filter(faisable), pleins = ordre.slice(0, c.html ? 1 : 2);
  const perime = metier().dlc && !pret, nAtelier = pret ? totalAtelier(id) : 0;
  return `<div class="t-objet"><div class="to-tete">${img(a)}<div><span class="code">${a.id}</span><h1>${esc(a.nom)}</h1><span class="etat ${e.c}"><i></i>${e.t}</span></div></div>
    ${jauge}
    ${ligneControle(a)}${ligneLieux(a)}
    ${lots.length ? `<p class="lot-premier">À sortir en premier : <b>${lots[0].qte}</b> · date limite <b>${dateFr(lots[0].dlc)}</b></p>` : ""}</div>
  <div class="t-actions">${c.html || ""}${pleins.map(bouton).join("")}
    ${boutonControleFait(a)}
    <div class="t-legers">${ordre.slice(pleins.length).map(leger).join("")}
      <button class="t-action leger compter" data-mvt="Compter">${I.compter}<span>Compter</span></button>
      ${pret ? `<button class="t-action leger atelier" data-atelier="${a.id}">${I.cle}<span>À réparer ou nettoyer${nAtelier ? `<small>${nAtelier} à l'atelier</small>` : ""}</span></button>` : ""}
      <button class="t-action leger perte" data-mvt="Perte">${I.perte}<span>${perime ? "Périmé, cassé ou perdu" : "Cassé ou perdu"}</span></button>
      ${boutonTransfert(a)}${boutonEnvoiEtab(a)}
      ${permis("materiel") ? `<button class="t-action leger" data-fiche="${a.id}">${I.materiel}<span>Fiche complète</span></button>` : ""}
    </div>
  </div>`;
}
/* Le geste le plus probable, d'après ce qui se passe autour de l'objet */
function conseil(a) {
  const id = a.id, auj = aujourdHui(), demain = isoJour(Date.now() + JOUR_MS);
  const prep = actif("MO-RES") && S.reservations.find(r => ["Confirmée", "Préparée"].includes(r.statut) && r.debut <= demain && r.lignes.some(l => l[0] === id) && (r.charge[id] || 0) < r.lignes.find(l => l[0] === id)[1]);
  if (prep) return { html: `<button class="t-action sortie conseil" data-prep="${prep.id}">${I.camion}<span>Charger pour ${esc(prep.nom)}<small>Départ ${prep.debut <= auj ? "aujourd'hui" : "demain"} · ${prep.charge[id] || 0} / ${prep.lignes.find(l => l[0] === id)[1]} chargés</small></span></button>` };
  const cmd = S.commandes.find(k => ["Envoyée", "Reçue en partie"].includes(k.statut) && k.lignes.some(l => l.id === id && (l.recu || 0) < l.qte));
  if (cmd) return { html: `<button class="t-action compter conseil" data-recep="${cmd.id}">${I.camion}<span>Réceptionner la livraison<small>${cmd.id} · ${esc(cmd.fournisseur)}</small></span></button>` };
  if (logique(a) === "pret" && dehors(id).length) return { mvt: "Retour" };
  return { mvt: logique(a) === "pret" ? "Prêt" : "Sortie" };
}
const zoneDe = a => (S.emplacements.find(x => x.id === a.emp) || {}).nom || "";
const exempleRecherche = () => S.articles.slice(0, 2).map(a => a.nom.split(/\s+/)[0].toLowerCase()).join(", ") + "…";
function tChercher(filtre) {
  if (filtre && entree) filtreTexte = filtre;
  return `<h1>Chercher un objet</h1><p class="sous">Tapez un nom, un code ou une zone.</p>
  <form class="t-ou" data-form="cherche">${champFiltre("#liste-cherche", exempleRecherche())}</form>
  <ul class="t-liste dp" id="liste-cherche">${S.articles.map(a => `<li data-cherche="${cherchable(a.nom, a.id, zoneDe(a))}"><button data-objet="${a.id}">${img(a)}<span><b>${esc(a.nom)}</b><small>${esc(zoneDe(a))}</small></span><span class="n">${stock(a.id)}</span></button></li>`).join("")}
  <li class="vide" data-rien hidden>Aucun objet ne correspond. Vérifiez l'orthographe, ou tapez le code écrit sous le QR.${boutonCreerRecherche()}</li></ul>`;
}
function tJour() {
  const debut = new Date(); debut.setHours(0, 0, 0, 0);
  const l = S.mouvements.filter(m => m.date >= debut.getTime() && m.qui === session.nom).reverse();
  return `<h1>Ma journée</h1><p class="sous">${l.length} enregistrement${l.length > 1 ? "s" : ""} aujourd'hui.</p>
  <ul class="t-liste dp">${l.map(m => { const a = art(m.article); return `<li><button data-objet="${a.id}">${img(a)}<span><b>${esc(m.type)} · ${esc(a.nom)}</b><small>${quand(m.date)}${(m.evenement || m.imputation) ? " · " + esc(m.evenement || m.imputation) : ""}</small></span><span class="n">${m.type === "Contrôle" || m.type === "Fiche" ? "" : m.qte}</span></button></li>`; }).join("") || `<li class="vide">Rien encore aujourd'hui. Scannez un objet pour commencer.</li>`}</ul>`;
}
function tKits() {
  return `<h1>Sortir un kit</h1><p class="sous">Choisissez le kit.</p>
  <ul class="t-liste dp">${S.kits.map(k => {
    // Le contenu du kit se lit dans la feuille qui s'ouvre : ici, ce qu'il faut pour choisir.
    const ok = k.lignes.every(([id, q]) => stockIci(id) >= q), n = k.lignes.length;
    return `<li><button data-kit="${k.id}">${pic(I.kit)}<span><b>${esc(k.nom)}</b><small>${n} sorte${n > 1 ? "s" : ""} d'objets${ok ? "" : " · il en manque au dépôt"}</small></span><span class="etat ${ok ? "" : "zero"}"><i></i></span></button></li>`;
  }).join("")}</ul>`;
}
function tRecuperer() {
  const parEv = {};
  dehors().forEach(d => { (parEv[d.evenement] = parEv[d.evenement] || []).push(d); });
  return `<h1>${esc(V("retourTitre") || "Retours")}</h1><p class="sous">Touchez ce qui revient.</p>
  <ul class="t-liste dp">${Object.entries(parEv).map(([ev, l]) => `<li><button data-ev="${esc(ev)}">${pic(I.camion)}<span><b>${esc(ev)}</b><small>${l.length} sorte${l.length > 1 ? "s" : ""} d'objets</small></span><span class="n">${l.reduce((t, d) => t + d.qte, 0)}</span></button></li>`).join("") || `<li class="vide">Tout est rentré au dépôt.</li>`}</ul>`;
}
function tRetourEvenement(ev) {
  const l = dehors().filter(d => d.evenement === ev);
  if (!l.length) return `<h1>Tout est revenu</h1><button class="btn" data-aller="terrain">Accueil</button>`;
  return `<h1>${esc(ev)}</h1><p class="sous">Corrigez seulement ce qui manque.</p>
  <form data-form="retourEv"><ul class="t-liste dp">${l.map(d => { const a = art(d.article); return `<li><div class="t-retour">${img(a)}<span><b>${esc(a.nom)}</b><small>parti : ${d.qte}</small></span>
    <input type="number" inputmode="numeric" min="0" max="${d.qte}" name="${a.id}" value="${d.qte}" aria-label="Revenus : ${esc(a.nom)}"></div></li>`; }).join("")}</ul>
  <div class="valider dp-colle"><button type="button" class="btn" data-aller="recuperer">Annuler</button><button class="btn plein" style="background:var(--retour);border-color:var(--retour);color:#fff">Valider le retour</button></div></form>`;
}
/* Le bon remis au client est la sortie papier du magasinier. */
function tuilePreparer() {
  const p = S.reservations.filter(r => ["Confirmée", "Préparée"].includes(r.statut) && r.debut <= isoJour(Date.now() + 10 * JOUR_MS)).length;
  return `<button class="t-tuile large" data-aller="preparer"><span class="pastille">${I.camion}</span><div><b>Préparer un départ</b><small>${p} départ${p > 1 ? "s" : ""} prévu${p > 1 ? "s" : ""} dans les 10 jours</small></div></button>`;
}
/* =================================================================
   PROFILS BUREAU ET DIRECTION
   ================================================================= */
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
  const j = metier().alerteDlc || 4, l = bientotPerimes(j);
  // Rien ne périme : une ligne discrète, pas un bloc entier.
  if (!l.length) return `<p class="w-ligne"><b>Dates limites</b> Rien ne périme dans les ${j} prochains jours.</p>`;
  return `<h2>À utiliser en premier</h2>${l.length ? `<ul class="b-liste">${l.slice(0, 6).map(x => `<li><button class="l" data-objet="${x.a.id}">${img(x.a)}<span><b>${esc(x.a.nom)}</b><small>${x.qte} avec date limite au ${dateFr(x.dlc)}${x.lieu !== undefined ? " · " + esc(nomLieu(x.lieu)) : ""}</small></span><span class="statut s-partie">${x.dlc <= new Date().toISOString().slice(0, 10) ? "Périmé" : "Bientôt"}</span></button></li>`).join("")}</ul>` : `<p class="vide">Rien ne périme dans les ${j} prochains jours.</p>`}`;
}
function bMateriel(f) {
  f = f || "tous";
  if (f === "retires") return vRetires();
  if (f === "controle" && !suiviControles()) f = "tous";
  const ids = new Set(dehors().map(d => d.article));
  const ctrl = suiviControles() ? aControler() : [];
  const l = (f === "controle" ? ctrl : S.articles.filter(a => f === "tous" || (f === "alerte" && ["zero", "bas"].includes(etat(a).c)) || (f === "dehors" && ids.has(a.id)))).filter(dansLieuStock);
  const vide = f === "alerte" ? "Rien à commander : tout est au-dessus du seuil." : f === "dehors" ? "Tout est rentré." : f === "controle" ? "Aucun contrôle en retard ni à faire dans les 30 jours." : "Aucun objet pour l'instant.";
  const compte = k => k === "retires" ? S.retires.length : k === "tous" ? S.articles.length : k === "alerte" ? S.articles.filter(a => ["zero", "bas"].includes(etat(a).c)).length : k === "controle" ? ctrl.length : ids.size;
  // Une phrase d'état, les filtres, puis huit lignes ; la suite attend un toucher (une recherche porte toujours sur toute la liste).
  const nAl = compte("alerte"), replie = !stockEntier && !filtreTexte.trim() && l.length > ST_LIGNES + 2;
  const phrase = f === "tous" && !filtreLieuActif() ? `${nbEs(S.articles.length, "objet", "objets")} · ${nAl ? `${nAl} à commander` : "rien à commander"}.` : `${nbEs(l.length, "objet", "objets")} sur ${S.articles.length}.`;
  return `<h1>${esc(titreSection("materiel"))}</h1>${ST_COL}<p class="es-etat st-etat">${phrase}</p>${outilsArticles()}
  <div class="outils-liste"><div class="filtres">${[["tous", "Tout"], ["alerte", "À commander"]].concat(aDesPrets() ? [["dehors", V("chez")]] : [], suiviControles() ? [["controle", "À contrôler"]] : [], aDesRetires() ? [["retires", "Retirés"]] : []).map(([k, t]) => `<button data-filtre-materiel="${k}" aria-pressed="${f === k}">${t}<span class="nb">${compte(k)}</span></button>`).join("")}</div>
  ${champFiltre("#liste-materiel", exempleRecherche())}${boutonNouvelArticle()}${choixLieuStock()}<span class="filtre-compte" data-filtre-compte role="status"></span></div>
  <div class="${replie ? "st-replie" : ""}" data-st-replie><ul class="b-liste st-liste" id="liste-materiel">${l.map(a => { const e = etat(a); return `<li data-cherche="${cherchable(a.nom, a.id, zoneDe(a), e.t)}"><button class="l" data-fiche="${a.id}">${img(a)}<span><b>${esc(a.nom)}</b><small><span class="etat ${e.c}"><i></i>${e.t}</span><span class="st-code"> · <span class="code">${a.id}</span></span>${pastilleControle(a, f === "controle")}</small></span><span class="l-zone">${esc(zoneDe(a))}</span><span class="n">${qteStock(a)}</span></button></li>`; }).join("")}
  <li class="vide" data-rien ${l.length ? "hidden" : ""}>${l.length ? "Aucun objet ne correspond à cette recherche." : filtreLieuActif() ? `Rien ici : ${esc(nomLieu(lieuStock))}.` : vide}</li></ul>
  ${replie ? stSuite(l.length - ST_LIGNES, "autres objets") : ""}</div>`;
}
function bFiche(id) {
  const a = art(id); if (!a) return "<p>Introuvable.</p>";
  if (a.retire) return ficheRetiree(a);
  const q = stock(id), e = etat(a), d = dehors(id), unique = a.type === "equip", ctrl = etatControle(a), aFaire = !!ctrl && ctrl.c !== "ok";
  // La photo à côté du nom, un seul chiffre en grand (ce qu'il y a en stock), les gestes courants en raccourcis ronds,
  // le détail en lignes, et ce qui sert rarement (modifier, retirer, régler un contrôle) derrière « Autres actions ».
  const ronds = [{ a: `data-mvt="Entrée"`, i: I.retour, t: "Entrée en stock" }, { a: `data-mvt="Compter"`, i: I.compter, t: "Compter" }, { a: `data-mvt="Perte"`, i: I.perte, t: "Perte" }, { a: `data-atelier="${a.id}"`, i: I.cle, t: "Envoyer à l'atelier" }]
    .concat(aFaire ? [{ a: `data-ctrl-fait="${a.id}"`, i: PICTO_CONTROLE, t: "Contrôle fait" }] : []);
  const autres = `${boutonTransfert(a, true)}${boutonEnvoiEtab(a, true)}${aFaire ? "" : boutonControleFait(a, true)}${boutonsControle(a, true)}${boutonsArticle(a)}`;
  const ligne = (t, v, cls) => `<div><dt>${t}</dt><dd${cls ? ` class="${cls}"` : ""}>${v}</dd></div>`;
  return `${ST_COL}<div class="fiche st-fiche">
    <div class="st-tete">${img(a)}<div><h1>${esc(a.nom)}</h1><p class="st-sousnom"><span class="etat ${e.c}"><i></i>${e.t}</span> · <span class="code">${a.id}</span></p></div></div>
    ${unique ? "" : `<div class="es-hero"><small>En stock</small><b class="es-chiffre">${q.toLocaleString("fr-FR")}</b><p>sur un niveau normal de ${a.cible.toLocaleString("fr-FR")}</p>
      <span class="st-barre" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, a.cible ? Math.round(q / a.cible * 100) : 0))}%;background:${couleurEtat(e)}"></i></span></div>`}
    ${ligneControle(a)}
    ${stRonds(ronds, "boutons")}
    ${totalAtelier(id) ? `<p class="es-etat st-atelier">À l'atelier : ${aLAtelier(id).map(x => x.qte + " " + (x.motif === "Au nettoyage" ? "au nettoyage" : "en réparation")).join(", ")}.</p>` : ""}
    <dl>${unique ? ligne("En stock", q) : ""}${logique(a) === "pret" ? ligne(V("chez"), d.reduce((t, x) => t + x.qte, 0)) : ligne(`${V("sortiesMot")} en 30 jours`, S.mouvements.filter(m => m.article === id && m.type === "Sortie" && m.date >= Date.now() - 30 * 86400000).reduce((t, m) => t + m.qte, 0))}
      ${droit("prix") ? (unique ? "" : ligne("Valeur au dépôt", argent(Math.max(0, q) * a.prix))) + ligne("Prix unitaire", argent(a.prix)) : ""}
      ${unique ? "" : ligne("Seuil d'alerte", a.seuil)}
      ${a.serie ? ligne("Numéro de série", a.serie, "code") : ""}${detailsControle(a)}</dl>
    ${autres ? `<details class="st-plus"><summary>Autres actions</summary><div class="boutons">${autres}</div></details>` : ""}
  </div>
  ${blocLieuxFiche(a)}
  ${blocRentabilite(a)}
  ${metier().dlc && lotsEnStock(id).length ? `<h2>Lots en stock</h2><table class="t st-lignes"><tbody>${lotsEnStock(id).map(l => `<tr><td>Date limite au ${dateFr(l.dlc)}</td><td class="n">${l.qte}</td></tr>`).join("")}</tbody></table>` : ""}
  ${d.length ? `<h2>Chez qui</h2><table class="t st-lignes"><tbody>${d.map(x => `<tr><td>${esc(x.evenement)}</td><td class="n">${x.qte}</td></tr>`).join("")}</tbody></table>` : ""}
  ${stHistorique(id, 10)}`;
}
function tableMouvements(l, avecObjet) {
  if (!l.length) return `<p class="vide">Aucun mouvement.</p>`;
  return `<div class="defile"><table class="t mvts${avecObjet ? " avec-objet" : ""}"><thead><tr><th>Quand</th><th>Qui</th><th>Quoi</th>${avecObjet ? "<th>Objet</th>" : ""}<th class="n">Qté</th></tr></thead><tbody>
  ${l.map(m => `<tr><td class="m-quand">${quand(m.date)}</td><td class="m-qui">${esc(m.qui || PROFILS[m.profil].nom)}</td><td class="m-quoi">${esc(m.type)}${(m.evenement || m.imputation) ? "<br><small>" + esc(m.evenement || m.imputation) + "</small>" : ""}${m.motif ? "<br><small>" + esc(m.motif) + "</small>" : ""}${lieuMv(m)}</td>${avecObjet ? `<td class="m-objet">${esc(art(m.article).nom)}</td>` : ""}<td class="n m-qte">${qteSignee(m)}</td></tr>`).join("")}</tbody></table></div>`;
}
// La quantité porte son sens : + ce qui entre au dépôt, − ce qui en sort.
const qteSignee = m => { if (m.type === "Contrôle" || m.type === "Fiche") return ""; if (m.type === "Transfert") return (m.qte < 0 ? "−" : "") + Math.abs(m.qte).toLocaleString("fr-FR"); const v = (SIGNE[m.type] || 1) * m.qte; return (v < 0 ? "−" : "+") + Math.abs(v).toLocaleString("fr-FR"); };
/* Journal : les 60 derniers mouvements, un filtre par geste et une recherche (objet, personne, lieu, motif). */
const GESTES_JOURNAL = { sorties: ["Prêt", "Sortie"], entrees: ["Retour", "Entrée", "Inventaire initial"], pertes: ["Perte"], comptages: ["Ajustement"], atelier: ["Réparation", "Retour réparation"], controles: ["Contrôle"], transferts: ["Transfert"] };
function lignesJournal() {
  const types = GESTES_JOURNAL[jr.type], mots = sansAccent(jr.q.trim()).split(/\s+/).filter(Boolean);
  return S.mouvements.filter(m => {
    if (types && !types.includes(m.type)) return false;
    if (!mots.length) return true;
    const a = art(m.article), t = sansAccent([a ? a.nom : "", m.article, m.type, m.qui, m.evenement, m.imputation, m.motif, m.lieu ? nomLieu(m.lieu) : ""].filter(Boolean).join(" "));
    return mots.every(x => t.includes(x));
  }).reverse().sort((a, b) => b.date - a.date);
}
function corpsJournal() {
  const l = lignesJournal(), filtre = jr.type !== "tous" || jr.q.trim();
  return `<p class="liste-compte" role="status">${l.length.toLocaleString("fr-FR")} mouvement${l.length > 1 ? "s" : ""}${filtre ? ` sur ${S.mouvements.length.toLocaleString("fr-FR")}` : ""}, du plus récent au plus ancien</p>
  ${l.length ? tableMouvements(l.slice(0, jr.n), true) : `<p class="vide">Aucun mouvement ne correspond. Essayez un autre mot, ou revenez sur « Tout ».</p>`}
  ${l.length > jr.n ? `<p class="st-suite"><button class="es-lien" data-journal-plus>Afficher la suite</button></p>` : ""}`;
}
function brancherJournal() {
  const boite = $("[data-journal]"); if (!boite) return;
  const plus = boite.querySelector("[data-journal-plus]"); if (plus) plus.onclick = () => { jr.n += JR_PAS; boite.innerHTML = corpsJournal(); brancherJournal(); };
}
const bJournal = () => `<h1>Journal</h1>${ST_COL}${sousAide("Tout est gardé, rien ne s'efface.", "Une erreur se corrige par un nouveau mouvement, jamais en effaçant.")}
  <div class="outils-liste"><div class="filtres">${[["tous", "Tout"], ["sorties", "Sorties"], ["entrees", "Entrées et retours"], ["pertes", "Pertes"], ["comptages", "Comptages"]].concat(lieuxActifs() ? [["transferts", "Transferts"]] : [], suiviControles() ? [["controles", "Contrôles"]] : []).map(([k, t]) => `<button data-journal-type="${k}" aria-pressed="${jr.type === k}">${t}</button>`).join("")}</div>
  <label class="recherche">${I.loupe}<span class="cache">Chercher dans le journal</span><input type="search" data-journal-q value="${esc(jr.q)}" placeholder="Objet, personne, ${esc((V("imp") || "lieu").toLowerCase())}…" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search"></label></div>
  <div data-journal>${corpsJournal()}</div>`;
// « 6 lots de 10 » quand l'objet se commande par lots entiers, rien sinon.
const parLots = (id, qte) => { const lot = art(id).lot || 1; return lot > 1 && qte > 0 && qte % lot === 0 ? `${qte / lot} lot${qte / lot > 1 ? "s" : ""} de ${lot}` : ""; };
function brouillons() {
  const f = {};
  // Un brouillon déjà envoyé depuis cet écran ne se propose pas une seconde fois tant que la livraison est attendue.
  const dejaEnvoye = new Set(S.commandes.filter(c => c.deBrouillon && ["Envoyée", "Reçue en partie"].includes(c.statut)).flatMap(c => c.lignes.map(x => x.id)));
  S.articles.filter(a => a.type === "conso" && stock(a.id) <= a.seuil && !dejaEnvoye.has(a.id)).forEach(a => {
    // On commande par lots entiers : un objet conditionné par 10 se commande par 10, arrondi au lot du dessus.
    const lot = a.lot > 1 ? a.lot : 1, q = Math.ceil((a.cible - stock(a.id)) / lot) * lot; if (q > 0) (f[a.fou] = f[a.fou] || []).push({ id: a.id, qte: q });
  });
  return f;
}
function bCommandes() {
  const b = Object.entries(brouillons());
  // Qui valide voit d'abord ce qui attend son accord. Un seul bouton plein sur l'écran : le premier geste possible.
  const accords = droit("valider") ? S.commandes.filter(c => c.statut === "À valider") : [];
  let plein = true; const fort = () => { const c = plein ? " plein" : ""; plein = false; return c; };
  const phrase = accords.length ? nbEs(accords.length, "commande attend votre accord.", "commandes attendent votre accord.") : b.length ? nbEs(b.length, "commande est prête.", "commandes sont prêtes.") : "Rien à commander pour l'instant.";
  const passees = S.commandes.slice().reverse(), puce = { "Reçue": "retour", "À valider": "attention", "Reçue en partie": "attention" };
  return `<h1>Commandes</h1>${ST_COL}${sousAide(phrase, `Les commandes se préparent seules, d'après le seuil d'alerte de chaque objet. Au-dessus de ${argent(SEUIL_VALIDATION_EUR)}, la direction donne son accord avant l'envoi.`)}
  ${accords.map(c => `<section class="bon st-bon st-accord"><header><b>${esc(c.fournisseur)}</b><span>Attend votre accord</span></header>
      <table class="t"><tbody>${c.lignes.map(x => `<tr><td>${x.qte} × ${esc(art(x.id).nom)}</td><td class="n">${argent(x.qte * art(x.id).prix)}</td></tr>`).join("")}</tbody></table>
      <p class="st-total"><span>Total hors taxes</span><b>${argent(c.total)}</b></p>
      <button class="btn${fort()}" data-valider="${c.id}">Valider la commande</button></section>`).join("")}
  ${b.map(([fid, l]) => {
    const f = S.fournisseurs.find(x => x.id === fid);
    const tot = l.reduce((t, x) => t + x.qte * art(x.id).prix, 0);
    const attente = S.commandes.find(c => c.fid === fid && c.statut === "À valider");
    return `<section class="bon st-bon"><header><b>${esc(f.nom)}</b><span>Brouillon · livré en ${f.delai} jour${f.delai > 1 ? "s" : ""}</span></header>
      <table class="t"><tbody>${l.map(x => `<tr><td>${x.qte} × ${esc(art(x.id).nom)}${parLots(x.id, x.qte) ? `<br><small>${parLots(x.id, x.qte)}</small>` : ""}</td><td class="n">${argent(x.qte * art(x.id).prix)}</td></tr>`).join("")}</tbody></table>
      <p class="st-total"><span>Total hors taxes</span><b>${argent(tot)}</b></p>
      ${attente ? `<p class="es-etat">En attente de l'accord de la direction.</p>` : tot > SEUIL_VALIDATION_EUR ? `<button class="btn${fort()}" data-cmd="${fid}" data-statut="À valider">Demander l'accord de la direction</button>` : `<button class="btn${fort()}" data-cmd="${fid}" data-statut="Envoyée">Envoyer au fournisseur</button>`}
    </section>`;
  }).join("")}
  <h2>Commandes passées</h2>
  ${passees.length ? `<div class="${passees.length > ST_LIGNES + 2 ? "st-replie" : ""}" data-st-replie><ul class="b-liste st-liste st-cmdes">${passees.map(c => `<li><div class="l"><i class="st-puce" style="--c:var(--${puce[c.statut] || "neutre"})"></i><span><b>${esc(c.fournisseur)}</b><small>${esc(c.statut)} · ${quand(c.date)}</small></span>${["Envoyée", "Reçue en partie"].includes(c.statut) ? `<button class="btn petit" data-recevoir="${c.id}">${c.statut === "Envoyée" ? "Réceptionner" : "Réceptionner le reste"}</button>` : c.total ? `<span class="n">${argent(c.total)}</span>` : ""}</div></li>`).join("")}</ul>
  ${passees.length > ST_LIGNES + 2 ? stSuite(passees.length - ST_LIGNES, "commandes suivantes") : ""}</div>` : `<p class="es-rien">Aucune pour l'instant.</p>`}`;
}
function creerCommande(fid, statut) {
  const l = brouillons()[fid], f = S.fournisseurs.find(x => x.id === fid);
  S.commandes.push({ id: "CMD-" + String(S.commandes.length + 1).padStart(4, "0"), date: Date.now(), fid, fournisseur: f.nom, lignes: l, total: l.reduce((t, x) => t + x.qte * art(x.id).prix, 0), statut, deBrouillon: true });
  sauver();
}

/* Les sorties (documents) changent selon le profil. */
function bDocs() {
  const loueur = (S.metier || "loueur") === "loueur", cp = complet();
  const papier = [["etiquettes", I.etiquette, "Planche d'étiquettes", "QR à imprimer et coller"], ["inventairePapier", I.compter, "Fiche d'inventaire papier", "Pour compter sans téléphone, zone par zone"]];
  const argent_ = [["rapport", I.argent, "Rapport du mois", "Valeur du stock, pertes, part refacturable"], ["refacturer", I.perte, "Manquants à refacturer", `Par ${motImp()}, avec les montants et les factures`]];
  const excel = [["csv", I.excel, "Journal des mouvements", cp ? "Qui, quoi, quand, pour qui, avec la valeur" : "Tous les gestes enregistrés"], ["finAnnee", I.excel, "Inventaire de fin d'année", cp ? "Trois onglets : résumé, stock valorisé, pertes" : "Stock valorisé et pertes de l'année"]]
    .concat(cp && (loueur || (S.clientsLoc || []).length) ? [["exportClients", I.excel, motClients() + " et " + motImps(), `Coordonnées, cautions, casse par ${motImp()}`]] : []);
  const registre = suiviControles() ? [["controles", PICTO_CONTROLE, "Registre des contrôles", "Échéances, dernier contrôle et par qui"]] : [];
  const imprimer = session.profil === "direction" ? argent_.concat(registre) : papier.concat(registre, argent_.slice(1));
  const acte = k => ["csv", "finAnnee", "exportClients"].includes(k);
  // Deux cartes de lignes : ce qui s'imprime, ce qui se télécharge. Chaque ligne garde sa classe « doc-carte » (les fiches clients la visent).
  const carte = (titre, l) => `<section class="es-carte pi-carte"><h2>${titre}</h2><ul>${l.map(([k, ic, t, s_]) => `<li><button class="doc-carte" ${acte(k) ? `data-act="${k}"` : `data-aller="${k}"`}><span class="pastille ${acte(k) ? "excel" : ""}">${ic}</span><span><b>${t}</b><small>${s_}</small></span><span class="chev">${acte(k) ? I.telecharger : I.chevron}</span></button></li>`).join("")}</ul></section>`;
  return `<h1>Documents</h1><div class="pi-page"><p class="es-etat">À imprimer, à envoyer ou à transmettre.</p>
  <div class="docs pi-docs">${carte("À imprimer ou à garder en PDF", imprimer)}${carte("Fichiers Excel", excel)}</div>
  <p class="pi-note docs-note">Les fichiers Excel s'ouvrent aussi dans Google Sheets et LibreOffice.</p></div>`;
}
const retourDocs = `<p class="pas-imprimer pi-outils-doc"><button class="es-lien" data-aller="docs">${I.precedent}Documents</button><button class="btn petit plein" data-act="imprimer">${I.imprimer}Imprimer ou enregistrer en PDF</button></p>`;
const bEtiquettes = id => id && art(id) ? etiquetteSeule(id) : `${retourDocs}<div class="pas-imprimer"><h1>Planche d'étiquettes</h1><p class="sous">Scanné avec l'appareil photo, le QR ouvre directement la fiche de l'objet.</p></div>
  ${blocPlanEtiquetage()}<h2 class="pas-imprimer">La planche à imprimer</h2>
  <div class="planche">${S.articles.map(a => `<div class="etiquette"><div data-qr="${a.id}"></div><div><b>${esc(a.nom)}</b><span class="code">${a.id}</span><small class="proprio">Propriété de ${esc((S.entreprise || {}).nom || "l'entreprise")}</small></div></div>`).join("")}</div>`;
const bInventairePapier = () => `${retourDocs}<div class="feuille-doc">${enTeteDoc()}<h1>Fiche d'inventaire</h1><p>Date : ____ / ____ / ________ · Compté par : ______________________</p>
  ${S.emplacements.map(e => `<h2 style="font-size:17px">${esc(e.nom)}</h2><table><thead><tr><th class="code">Code</th><th>Objet</th><th>Attendu</th><th>Compté</th></tr></thead><tbody>
  ${S.articles.filter(a => a.emp === e.id).map(a => `<tr><td>${a.id}</td><td>${esc(a.nom)}</td><td>${stockIci(a.id)}</td><td style="width:90px"></td></tr>`).join("")}</tbody></table>`).join("")}${inventaireLieux()}</div>`;
function bRefacturer() {
  const l = S.mouvements.filter(m => m.type === "Perte" && m.refac);
  return `${retourDocs}<div class="feuille-doc">${enTeteDoc()}<h1>Manquants à refacturer</h1>
  <table><thead><tr><th>${esc(V("imp") || "Événement")}</th><th>Objet</th><th>Qté</th><th>Montant</th></tr></thead><tbody>
  ${l.map(m => `<tr><td>${esc(m.evenement)}</td><td>${esc(art(m.article).nom)}</td><td>${m.qte}</td><td>${argent(valeurM(m))}</td></tr>`).join("") || `<tr><td colspan="4">Rien à refacturer.</td></tr>`}</tbody></table>
  <p style="text-align:right"><b>Total : ${argent(l.reduce((t, m) => t + valeurM(m), 0))}</b></p></div>
  ${l.length ? `<h2 class="pas-imprimer">Factures de casse par ${motImp()}</h2><div class="boutons pas-imprimer">${[...new Set(l.map(m => m.evenement))].slice(-8).reverse().map(ev => `<button class="btn petit" data-facture="${esc(ev)}">${esc(ev)}</button>`).join("")}</div>` : ""}`;
}

/* Période des chiffres de la direction (7, 30 ou 90 jours) */
let periode = 30;

/* Équipe et accès : qui peut entrer, avec quel rôle, et le journal des connexions */
const ROLES = { terrain: "Terrain : dépôt et camion", chauffeur: "Chauffeur : livraisons et reprises", bureau: "Bureau : stock et commandes", direction: "Direction : argent et décisions" };
function dAcces() {
  // Une ligne par personne : son identifiant, son poste, son rôle ; l'interrupteur retire l'accès d'un geste. Le bouton du lien est dessous.
  const ligne = u => {
    const moiMeme = u.id === session.uid, e = u.actif ? (u.empreinte ? "" : "invitation en attente") : "accès retiré";
    const bouton = moiMeme ? `<button class="btn petit" data-nouveau-code="${u.id}">Changer mon mot de passe</button>` : u.actif ? `<button class="btn petit" data-inviter="${u.id}">${u.empreinte ? "Nouveau lien d'accès" : "Inviter"}</button>` : "";
    return `<li class="personne ${u.actif ? "" : "inactif"}"><div class="es-ligne">${avatar(u)}<span class="pi-txt"><b>${esc(u.nom)}</b><small><span class="code">${esc(u.identifiant || "")}</span> · ${[esc(u.poste), ROLES[u.role].split(" : ")[0], u.admin ? "administre le compte" : "", e].filter(Boolean).join(" · ")}</small></span>
      ${moiMeme ? "" : `<label class="inter"><input type="checkbox" data-acces="${u.id}" ${u.actif ? "checked" : ""} aria-label="Accès de ${esc(u.nom)}"><span></span></label>`}</div>
      ${bouton ? `<div class="actions pi-ev-docs">${bouton}</div>` : ""}</li>`;
  };
  const connexions = S.connexions.length ? `<div class="defile"><table class="t"><thead><tr><th>Quand</th><th>Qui</th><th>Quoi</th><th class="n">Résultat</th></tr></thead><tbody>${S.connexions.slice(0, 20).map(c => `<tr><td>${quand(c.date)}</td><td>${esc(c.nom)}</td><td>${esc(c.motif)}</td><td class="n"><span class="resultat ${c.ok ? "ok" : "ko"}">${c.ok ? "Réussie" : "Refusée"}</span></td></tr>`).join("")}</tbody></table></div>` : `<p>Aucune connexion enregistrée pour l'instant.</p>`;
  return `<section class="es-carte pi-carte pi-nue pi-acces"><ul class="es-lignes">${S.equipe.map(ligne).join("")}</ul></section>
  <div class="pi-boutons"><button class="btn plein" data-act="ajouterPersonne">${I.equipe}Ajouter une personne</button></div>
  <p class="pi-note">Un mot de passe oublié ? « Nouveau lien d'accès » : la personne en choisit un autre elle-même. Personne d'autre ne le connaît, pas même vous.</p>
  ${piCarte("Sécurité", [
    `<li><div class="es-ligne pi-reglage"><span class="pi-txt"><label for="verrou">Verrouillage automatique</label><small>Sans toucher l'écran, le téléphone redemande le mot de passe.</small></span><select id="verrou" data-verrou>${[[1, "Après 1 minute"], [5, "Après 5 minutes"], [15, "Après 15 minutes"], [0, "Jamais"]].map(([v, n]) => `<option value="${v}" ${S.reglages.verrou === v ? "selected" : ""}>${n}</option>`).join("")}</select></div></li>`,
    piLigne({ t: "Mots de passe faux", s: "Après 5 erreurs, il faut attendre 30 secondes. Chaque essai est noté." }),
    piVolet("Journal des connexions", connexions),
    piVolet("Comment vos données sont protégées", `<ul class="puces">
    <li>La liste de l'équipe n'est jamais affichée à l'entrée : il faut connaître son identifiant.</li>
    <li>Chacun choisit son mot de passe à partir d'un lien d'invitation, valable 7 jours et une seule fois. Aucun mot de passe ne circule par message.</li>
    <li>Le mot de passe est vérifié par le serveur et n'est jamais gardé sur le téléphone. Bureau et direction peuvent aussi entrer avec leur compte Google ou Microsoft, avec la validation en deux étapes.</li>
    <li>Les droits sont appliqués par le serveur : une personne sans le droit « prix » ne reçoit même pas les prix.</li>
    <li>Le journal des mouvements ne s'efface pas. Une erreur se corrige par un nouveau mouvement.</li>
    <li>Un téléphone perdu se coupe à distance. Les données restent dans le compte de l'entreprise.</li>
  </ul>`)])}`;
}
const MDP_FAIBLES = ["123456", "1234567", "12345678", "azerty", "azertyuiop", "motdepasse", "password", "000000", "111111"];
function feuilleCode(uid) {
  const u = uid ? S.equipe.find(x => x.id === uid) : null;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tc" class="pi-f"><h1 id="tc">${u ? (u.id === session.uid ? "Changer mon mot de passe" : "Nouveau mot de passe pour " + esc(u.nom)) : "Ajouter une personne"}</h1>
    ${u ? `<p class="sous">${u.id === session.uid ? "L'ancien ne marchera plus. Personne d'autre ne le connaît." : "L'ancien ne marchera plus. Donnez le nouveau en main propre, jamais par message."}</p>` : `
    <label class="champ">Prénom<input name="nom" autocomplete="off" maxlength="30"></label>
    <label class="champ">Identifiant<input name="ident" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="30" placeholder="prenom ou prenom.nom"></label>
    <label class="champ">Poste<input name="poste" autocomplete="off" maxlength="40" placeholder="Magasinier, chauffeur…"></label>
    <label class="champ">Rôle<select name="role">${Object.entries(ROLES).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></label>`}
    <label class="champ">Mot de passe, 6 caractères au moins<input name="pin" type="password" autocomplete="new-password" maxlength="64"></label>
    <label class="champ">Le même, une seconde fois<input name="pin2" type="password" autocomplete="new-password" maxlength="64"></label>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div></div>`);
  const champ = n => f.querySelector(`[name=${n}]`);
  if (!u) {
    // L'identifiant se propose à partir du prénom, tant qu'on ne l'a pas tapé soi-même.
    champ("nom").oninput = () => { if (!champ("ident").dataset.touche) champ("ident").value = champ("nom").value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9.-]/g, ""); };
    champ("ident").oninput = () => { champ("ident").dataset.touche = "1"; };
  }
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const mdp = champ("pin").value, mdp2 = champ("pin2").value;
    const ident = u ? u.identifiant : champ("ident").value.trim().toLowerCase();
    if (!u && !champ("nom").value.trim()) return toast("Indiquez le prénom.");
    if (!u && !/^[a-z0-9.-]{3,30}$/.test(ident)) return toast("Identifiant : 3 caractères au moins, lettres, chiffres, point ou tiret.");
    if (!u && S.equipe.some(x => x.identifiant === ident)) return toast("Cet identifiant est déjà pris.");
    if (mdp.length < 6) return toast("Le mot de passe fait 6 caractères au moins.");
    if (mdp !== mdp2) return toast("Les deux mots de passe ne sont pas pareils.");
    if (MDP_FAIBLES.includes(mdp.toLowerCase()) || mdp.toLowerCase().includes(ident)) return toast("Mot de passe trop facile à deviner.");
    if (u) { u.empreinte = empreinte(u.id, mdp); delete u.invite; toast(u.id === session.uid ? "Nouveau mot de passe enregistré." : `Nouveau mot de passe enregistré pour ${u.nom}.`); }
    else {
      const nom = champ("nom").value.trim(), id = prochainUid(), role = champ("role").value;
      S.equipe.push({ id, nom, identifiant: ident, poste: champ("poste").value.trim() || PROFILS[role].nom, role, admin: false, actif: true, empreinte: empreinte(id, mdp), depuis: Date.now() });
      toast(`${nom} peut se connecter avec l'identifiant « ${ident} ».`);
    }
    sauver(); f.remove(); rendre();
  };
}

function dRapport() {
  const valeur = S.articles.reduce((t, a) => t + Math.max(0, stock(a.id)) * a.prix, 0);
  const p = pertesN(30);
  const sorties = S.mouvements.filter(m => (m.type === "Prêt" || (!estLoueur() && m.type === "Sortie")) && m.qte > 0 && !S.mouvements.some(x => x.annule === m.id) && m.date >= Date.now() - 30 * 86400000);
  const top = {}; sorties.forEach(m => top[m.article] = (top[m.article] || 0) + m.qte);
  return `${retourDocs}<div class="feuille-doc">${enTeteDoc()}<h1>Rapport des 30 derniers jours</h1><p>Édité le ${new Date().toLocaleDateString("fr-FR")}</p>
  <table><tbody><tr><td>Valeur du matériel au dépôt</td><td>${argent(valeur)}</td></tr><tr><td>Cassé ou perdu</td><td>${argent(p.reduce((t, m) => t + valeurM(m), 0))}</td></tr>
  <tr><td>Refacturable aux clients</td><td>${argent(p.filter(m => m.refac).reduce((t, m) => t + valeurM(m), 0))}</td></tr>
  <tr><td>${estLoueur() ? "Pièces sorties chez les clients" : "Pièces sorties du stock"}</td><td>${sorties.reduce((t, m) => t + m.qte, 0)}</td></tr></tbody></table>
  <h2 style="font-size:17px">${estLoueur() ? "Objets les plus loués" : "Objets les plus sortis"}</h2><table><tbody>${Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, q]) => `<tr><td>${esc(art(id).nom)}</td><td>${q}</td></tr>`).join("") || "<tr><td>Aucune sortie.</td></tr>"}</tbody></table></div>`;
}
function dInstallation() {
  const unite = S.monnaie === "XOF" ? "xof" : "eur";
  const fmt = n => unite === "xof" ? n.toLocaleString("fr-FR") + " FCFA" : n.toLocaleString("fr-FR") + " €";
  const inst = S.installation || { livreLe: Date.now(), heuresUtilisees: 0 };
  const fin = inst.livreLe + OFFRE.jours * 86400000, jours = Math.max(0, Math.ceil((fin - Date.now()) / 86400000));
  const restantes = Math.max(0, OFFRE.heures - inst.heuresUtilisees), enCours = jours > 0 && restantes > 0;
  // Les montants ne s'affichent que sur l'appareil de l'installateur : la démo publique ne montre aucun prix, comme le site.
  const prix = ESPACE;
  // D'abord deux lignes (l'offre, l'assistance) et le bouton ; les demandes, les fonctions et le détail sont des lignes qui s'ouvrent d'un toucher.
  const installes = Object.entries(CATALOGUE).filter(([k]) => actif(k)), aAjouter = Object.entries(CATALOGUE).filter(([k]) => !actif(k));
  const detail = m => m.detailClient || m.detail, etat = (t, c) => `<span class="pi-etatl"${c ? ` style="--c:var(--${c})"` : ""}>${t}</span>`;
  return `<h1>Votre installation</h1><div class="pi-page">
  <p class="es-etat">${enCours ? "Votre assistance incluse est en cours." : "Votre assistance incluse est terminée."}</p>
  <section class="es-carte pi-carte pi-nue inst-resume"><ul class="es-lignes">
    ${piLigne({ t: `Offre ${OFFRE.nom}`, s: `Livrée le ${new Date(inst.livreLe).toLocaleDateString("fr-FR")}${prix ? `, ${fmt(OFFRE[unite])} HT` : ""}. Rien à payer chaque mois.`, v: etat("payée une fois") })}
    ${piLigne({ t: "Assistance incluse", s: enCours ? `Encore ${jours} jour${jours > 1 ? "s" : ""} et ${String(restantes).replace(".", ",")} h sur ${OFFRE.heures} h.` : `Terminée le ${new Date(fin).toLocaleDateString("fr-FR")}.`, v: etat(enCours ? "en cours" : "terminée", enCours ? "retour" : "") })}
  </ul></section>
  <div class="pi-boutons"><button class="btn plein" data-act="demanderIntervention">Demander une intervention</button></div>
  ${(S.interventions || []).length ? piCarte("Vos demandes", S.interventions.slice().reverse().map(i => piLigne({ t: esc(i.texte), s: quand(i.date), v: etat(i.incluse ? "dans l'assistance" : "devis envoyé") }))) : ""}
  ${piCarte("Ce qui est installé", installes.map(([, m]) => piVolet(m.nom, `<p>${detail(m)}.</p>`)), "Aucune fonction en plus de l'offre.", "inst-liste-carte")}
  ${aAjouter.length ? piCarte("À ajouter, une fois et sur devis", aAjouter.map(([k, m]) => piVolet(m.nom, `<p>${detail(m)}.${prix ? ` Environ ${fmt(m[unite])} HT, une fois.` : ""} Une fonction ajoutée reste à vous.</p><button class="btn petit" data-devis="${k}">Demander un devis</button>`)), "", "inst-ajout") : ""}
  ${piCarte("Bon à savoir", [
    piVolet("Ce que couvre l'assistance", `<p>Les corrections de notre paramétrage et les questions d'utilisation, pas les nouvelles fonctions.</p>`),
    piVolet("Une intervention ensuite", `<p>${prix ? fmt(TARIF_INTERVENTION[unite]) + " HT par heure" : "Sur devis"}. À distance, par quart d'heure, 30 minutes au minimum, toujours sur devis accepté.</p>`),
    piVolet("Vos données sont à vous", `<p>L'appli et les données vous appartiennent. Elles sont gardées dans votre propre compte Google : un seul compte suffit, un compte gratuit convient. Rien n'est dû chaque mois à Stockclair, ni par personne.</p>`)], "", "inst-detail")}
  ${piCarte("Réglages", [piLigne({ t: "Vos coordonnées sur les documents", s: S.entreprise && S.entreprise.nom ? esc(S.entreprise.nom) : "Nom, adresse, téléphone et logo en haut des bons et des factures.", a: `data-act="coordonnees"` })]
    .concat(FRANCE_SEULE ? [] : [`<li><div class="es-ligne pi-reglage"><span class="pi-txt"><label for="monnaie">Monnaie des montants</label><small>Pour les prix, les pertes et les factures.</small></span><select id="monnaie" data-monnaie><option value="EUR" ${S.monnaie === "EUR" ? "selected" : ""}>Euro</option><option value="XOF" ${S.monnaie === "XOF" ? "selected" : ""}>Franc CFA</option></select></div></li>`]))}</div>`;
}
// Un ajout de module est une nouvelle fonction : toujours sur devis, jamais dans l'assistance incluse.
function feuilleIntervention(module) {
  const inst = S.installation || { livreLe: Date.now(), heuresUtilisees: 0 };
  const incluse = !module && Date.now() < inst.livreLe + OFFRE.jours * 86400000 && inst.heuresUtilisees < OFFRE.heures;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="ti" class="pi-f"><h1 id="ti">${module ? "Demander un devis" : "Demander une intervention"}</h1>
    <p class="sous">${module ? "Nous vous envoyons un devis. Rien n'est ajouté ni facturé avant votre accord." : incluse ? "Votre assistance incluse est en cours : si la demande entre dedans, elle ne vous coûte rien." : "Votre assistance incluse est terminée : vous recevrez un devis avant tout travail."}</p>
    <label class="champ">Votre demande<textarea name="texte" rows="4" maxlength="400" style="border-radius:10px;border:2px solid var(--trait-fort);padding:10px;font:inherit;background:var(--carte);color:var(--encre)">${module ? esc("Ajout de la fonction « " + CATALOGUE[module].nom + " ».") : ""}</textarea></label>
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
/* L'appli sur l'écran d'accueil du téléphone : rien à télécharger, le navigateur pose une icône.
   Android propose parfois l'installation tout seul (invite gardée ici) ; sinon, et sur iPhone, on montre le chemin. */
let inviteInstall = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); inviteInstall = e; });
window.addEventListener("appinstalled", () => { inviteInstall = null; toast("L'appli est sur votre écran d'accueil"); });
function dejaInstallee() { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
function feuilleEcranAccueil() {
  if (inviteInstall) { const i = inviteInstall; inviteInstall = null; i.prompt(); return; }
  const ordi = !/Android|iPhone|iPad|iPod/.test(navigator.userAgent) && navigator.maxTouchPoints < 2;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tea" class="pi-f"><h1 id="tea">Installer l'appli</h1>
    ${sousAide("Aucun magasin d'applications : l'appareil pose une icône.", "L'appli s'ouvre ensuite dans sa propre fenêtre, en plein écran, même sans réseau.")}
    ${ordi ? `<div class="eq-qr"><div data-qr-appli role="img" aria-label="QR code de l'appli"></div><p><b>Sur votre téléphone</b>Visez ce QR code avec l'appareil photo : l'appli s'ouvre, il reste à l'installer.</p></div>` : ""}
    ${pasInstallation()}
    <div class="valider" style="grid-template-columns:1fr"><button class="btn plein" data-x>J'ai compris</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  if (ordi) script("lib/qrcode.js").then(() => { const q = window.qrcode(0, "M"); q.addData(adresseDemo()); q.make(); f.querySelector("[data-qr-appli]").innerHTML = q.createSvgTag({ cellSize: 3, margin: 2, scalable: true }); }).catch(() => { f.querySelector(".eq-qr").hidden = true; });
}

function ouvrirFeuille(html) {
  const f = document.createElement("div"); f.className = "feuille"; f.innerHTML = html; document.body.appendChild(f);
  f.onclick = e => { if (e.target === f) f.remove(); };
  // Au clavier : le focus entre dans la feuille, « Entrée » dans une quantité ou un mot de passe valide.
  const d = f.firstElementChild; if (d) { d.tabIndex = -1; d.focus({ preventScroll: true }); }
  f.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.matches("input[type=number], input[type=password]")) { const ok = f.querySelector("[data-ok]"); if (ok) { e.preventDefault(); ok.click(); } }
    if (e.key !== "Tab") return;
    const l = [...f.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter(x => !x.disabled && x.offsetParent !== null);
    if (!l.length) return;
    const premier = l[0], dernier = l[l.length - 1];
    if (e.shiftKey && (document.activeElement === premier || document.activeElement === d)) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  });
  return f;
}
// « Échap » ferme ce qui est ouvert par-dessus l'écran : la caméra, puis la feuille du dessus (sauf celle qui exige un choix).
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const cam = $(".camera [data-x]"); if (cam) return cam.click();
  const l = $$(".feuille"), f = l[l.length - 1]; if (!f || !f.onclick) return;
  const x = f.querySelector("[data-x]"); if (x) x.click(); else f.remove();
});
function compteur(f, min, max) {
  const c = f.querySelector("input[type=number]");
  const borne = v => Math.max(min, max !== null ? Math.min(max, v) : v);
  // Le raccourci dont la valeur est affichée reste marqué, pour qu'on voie d'un coup d'œil ce qui est choisi.
  const marquer = () => f.querySelectorAll("[data-fixe]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.fixe === +c.value)));
  f.querySelectorAll("[data-pas]").forEach(b => b.onclick = () => { c.value = borne((+c.value || 0) + +b.dataset.pas); marquer(); });
  f.querySelectorAll("[data-plus]").forEach(b => b.onclick = () => { c.value = borne((+c.value || 0) + +b.dataset.plus); marquer(); }); // transfert entre lieux, envoi entre établissements
  // Un raccourci fixe la quantité : « 10 » donne 10, quel que soit le chiffre déjà affiché.
  f.querySelectorAll("[data-fixe]").forEach(b => b.onclick = () => { c.value = borne(+b.dataset.fixe); marquer(); });
  c.addEventListener("input", marquer); marquer();
  return c;
}
// Les raccourcis de quantité d'une feuille : jamais plus que ce qu'on peut prendre, et « Tout » quand le stock tient en un toucher.
function raccourcisQte(max) {
  const l = [10, 50, 100].filter(n => max === null || n <= max);
  const tout = max !== null && max > 10 && !l.includes(max) ? `<button type="button" data-fixe="${max}">Tout (${max})</button>` : "";
  return l.length || tout ? `<div class="rapides">${l.map(n => `<button type="button" data-fixe="${n}">${n}</button>`).join("")}${tout}</div>` : "";
}
function choixEvenement(liste) {
  const usage = {};
  S.mouvements.forEach(m => { const k = m.evenement || m.imputation; if (k) usage[k] = Math.max(usage[k] || 0, m.date); });
  S.reservations.forEach(r => { if (["Préparée", "Partie", "Confirmée"].includes(r.statut)) usage[r.nom] = Math.max(usage[r.nom] || 0, Date.now() - Math.abs(new Date(r.debut) - Date.now()) / 10); });
  const tri = liste.slice().sort((a, b) => (usage[b] || 0) - (usage[a] || 0)), vus = tri.slice(0, 4);
  return `<p class="choix-titre">${V("imp")}</p><div class="choix" role="radiogroup" aria-label="${V("imp")}">${vus.map((e, i) => `<label><input type="radio" name="ev" value="${esc(e)}" ${i === 0 ? "checked" : ""}>${esc(e)}</label>`).join("")}
    <label class="autre"><input type="radio" name="ev" value="__autre" aria-label="Autre"><input type="text" name="evAutre" list="liste-ev" placeholder="Autre : chercher ou créer" autocomplete="off" maxlength="60"></label>
    <datalist id="liste-ev">${liste.map(e => `<option value="${esc(e)}">`).join("")}</datalist></div>`;
}
function evChoisi(f) {
  const r = (f.querySelector("input[name=ev]:checked") || {}).value || "";
  if (r !== "__autre") return r;
  const t = f.querySelector("[name=evAutre]").value.trim();
  if (t && !S.evenements.includes(t)) S.evenements.unshift(t);
  return t;
}
function brancherAutre(f) { const t = f.querySelector("[name=evAutre]"); if (t) t.oninput = t.onfocus = () => { f.querySelector('input[name=ev][value="__autre"]').checked = true; }; }
// Un seul choix possible : on ne pose pas la question. La réponse reste dans la feuille, et s'écrit en une ligne quand elle apprend quelque chose.
const radios = (nom, liste, etiquette, cls) => liste.length === 1
  ? `<input type="radio" name="${nom}" value="${esc(liste[0])}" checked hidden>${liste[0] === "Au dépôt" ? "" : `<p class="choix-seul">${etiquette} : <b>${esc(liste[0])}</b></p>`}`
  : `<p class="choix-titre">${etiquette}</p><div class="choix ${cls || ""}" role="radiogroup" aria-label="${etiquette}">${liste.map((e, i) => `<label><input type="radio" name="${nom}" value="${esc(e)}" ${i === 0 ? "checked" : ""}>${esc(e)}</label>`).join("")}</div>`;
// Motifs d'une perte : « Périmé » quand le métier suit des dates limites, « Pas rendu » seulement pour ce qui est dehors.
function motifsPerte(a, dehorsIci) {
  if (metier().dlc && logique(a) !== "pret") return ["Périmé", "Cassé", "Perdu", "Volé"];
  return ["Cassé", dehorsIci ? "Pas rendu" : "Perdu", "Abîmé", "Volé"];
}
// Quantité proposée à l'ouverture d'une sortie : ce qu'un départ proche attend encore, sinon le lot de l'objet (« 1 scan = 10 »), sinon 1.
function qteDepart(a, q) {
  const demain = isoJour(Date.now() + JOUR_MS);
  const r = actif("MO-RES") && logique(a) === "pret" && S.reservations.find(x => ["Confirmée", "Préparée"].includes(x.statut) && x.debut <= demain && x.lignes.some(l => l[0] === a.id && (x.charge[a.id] || 0) < l[1]));
  const n = r ? r.lignes.find(l => l[0] === a.id)[1] - (r.charge[a.id] || 0) : a.lot > 1 ? a.lot : 1;
  return Math.max(1, Math.min(n, q));
}

/* Comptage très loin de l'attendu : on demande confirmation avant d'enregistrer, une faute de frappe est vite arrivée.
   La règle : l'écart fait au moins 5 unités ET au moins la moitié de la quantité attendue. */
const grandEcart = (compte, attendu) => { const e = Math.abs(compte - attendu); return e >= 5 && e * 2 >= attendu; };
// lignes : [{ nom, compte, attendu }]. « oui » n'est appelé que si la personne confirme ; sinon elle retrouve sa saisie.
function confirmerEcart(lignes, oui) {
  const un = lignes.length === 1 ? lignes[0] : null;
  $$(".toast:not(.avec-bouton)").forEach(x => x.remove()); // un message encore affiché ne doit pas cacher les boutons
  const f = ouvrirFeuille(`<div class="f-geste" role="dialog" aria-modal="true" aria-labelledby="tce">
    <h1 id="tce" style="font-size:26px">${un ? `Vous avez compté ${un.compte}, l'appli en attendait ${un.attendu}. C'est bien ça ?` : `${lignes.length} comptages sont très loin de ce que l'appli attendait. C'est bien ça ?`}</h1>
    ${un ? `<p class="sous">${esc(un.nom)}</p>` : `<ul class="ecarts">${lignes.map(l => `<li><b>${esc(l.nom)}</b><span>compté ${l.compte}, attendu ${l.attendu}</span></li>`).join("")}</ul>`}
    <div class="valider pile"><button class="btn plein" data-oui>${un ? `Oui, il y en a ${un.compte}` : "Oui, enregistrer ces quantités"}</button><button class="btn" data-x>${un ? "Non, je recompte" : "Non, je corrige"}</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-oui]").onclick = () => { f.remove(); oui(); };
}

function feuille(id, type) {
  const a = art(id), q = stock(id), d = dehors(id);
  if (type === "Retour" && !d.length) return toast("Rien de cet objet n'est chez un client.");
  if (["Prêt", "Sortie"].includes(type) && q <= 0) return toast("Il n'y en a plus en stock.");
  const perime = type === "Perte" && metier().dlc && logique(a) !== "pret";
  const titre = { "Sortie": "Combien en sortez-vous ?", "Surplus": "Combien en remettez-vous ?", "Prêt": "Combien partent ?", "Retour": "Combien reviennent ?", "Compter": "Combien en voyez-vous ?", "Perte": perime ? "Combien sont périmés, cassés ou perdus ?" : "Combien sont cassés ou perdus ?", "Entrée": "Combien entrent en stock ?" }[type];
  const max = ["Prêt", "Sortie"].includes(type) ? q : null;
  const defaut = type === "Compter" ? q : type === "Retour" ? d[0].qte : max !== null ? qteDepart(a, q) : 1;
  const evs = ["Prêt", "Sortie", "Surplus"].includes(type) ? S.evenements : type === "Retour" ? d.map(x => x.evenement) : type === "Perte" ? ["Au dépôt"].concat(d.map(x => x.evenement)) : null;
  // Raccourcis : pour ce qui se compte par dizaines, jamais au-delà de ce qui est là. Une perte se compte à l'unité.
  const plafond = max !== null ? max : type === "Retour" ? Math.max(...d.map(x => x.qte)) : null;
  const f = ouvrirFeuille(`<div class="f-geste" role="dialog" aria-modal="true" aria-labelledby="tf">
    <div class="tete">${img(a)}<div><span class="code">${a.id}</span><br><b>${esc(a.nom)}</b></div></div>
    <h1 id="tf" style="font-size:26px">${titre}</h1>
    <div class="compteur"><button data-pas="-1" aria-label="Un de moins">−</button><input type="number" inputmode="numeric" min="0" value="${defaut}" aria-label="Quantité"><button data-pas="1" aria-label="Un de plus">+</button></div>
    ${a.type === "conso" && !["Compter", "Perte"].includes(type) ? raccourcisQte(plafond) : ""}
    ${evs ? (["Prêt", "Sortie", "Surplus"].includes(type) ? choixEvenement(evs) : radios("ev", evs, V("imp"))) : ""}
    ${type === "Perte" ? radios("motif", motifsPerte(a, d.length > 0), "Motif", "deux") : ""}
    ${champLieu(a, type)}
    <div class="valider colle"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Valider</button></div></div>`);
  const champ = compteur(f, 0, max);
  brancherAutre(f); brancherLieuFeuille(f, id, type, champ);
  // Avec plusieurs lieux de stock : les raccourcis et la quantité proposée suivent ce qu'il y a dans le lieu choisi.
  if (max !== null) {
    const suivreLieu = () => { const dsp = dispoGeste(f, id, type); if (dsp === null) return;
      f.querySelectorAll("[data-fixe]").forEach(b => { b.hidden = +b.dataset.fixe > dsp; });
      if (+champ.value > dsp) { champ.value = Math.max(dsp ? 1 : 0, dsp); champ.dispatchEvent(new Event("input")); } };
    const sl = f.querySelector("select[name=lieu]"); if (sl) sl.addEventListener("change", suivreLieu);
    suivreLieu();
  }
  if (type === "Retour") f.querySelectorAll("input[name=ev]").forEach(r => r.onchange = () => { champ.value = d.find(x => x.evenement === r.value).qte; champ.dispatchEvent(new Event("input")); });
  f.querySelector("[data-x]").onclick = () => f.remove();
  const valider = confirme => {
    const n = Math.floor(+champ.value);
    if (!(n >= 0) || (n === 0 && type !== "Compter")) return toast("Indiquez une quantité.");
    // Avec plusieurs lieux de stock : on compte un lieu, on prend dans un lieu
    const lieu = lieuChoisi(f), qc = lieu === undefined ? q : stockLieu(id, lieu), dispo = dispoGeste(f, id, type);
    if (type === "Compter" && !confirme && grandEcart(n, Math.max(0, qc))) return confirmerEcart([{ nom: a.nom, compte: n, attendu: Math.max(0, qc) }], () => valider(true));
    if (max !== null && n > max) return toast(`Il n'y en a que ${max} au dépôt.`);
    if (dispo !== null && n > dispo) return toast(dispo ? `Il n'y en a que ${dispo} : ${nomLieu(lieu || "")}.` : `Il n'y en a pas : ${nomLieu(lieu || "")}.`);
    if (lieu !== undefined) retenirLieu(lieu);
    const ev = evChoisi(f);
    if (evs && !ev) return toast(`Indiquez : ${V("imp").toLowerCase()}.`);
    const motif = (f.querySelector("input[name=motif]:checked") || {}).value || "";
    f.remove();
    if (type === "Compter") { const e = n - qc; if (!e) { toast("Le compte est bon."); return rendre(); } const m = mouvement(id, "Ajustement", e, Object.assign({ motif: "Comptage" }, extraLieu(lieu))); rendre(); return annulable([m], `Écart de ${e > 0 ? "+" : "−"}${Math.abs(e)} enregistré.`); }
    if (type === "Retour") {
      const attendu = d.find(x => x.evenement === ev).qte, rendu = Math.min(n, attendu);
      const m = mouvement(id, "Retour", rendu, { evenement: ev });
      if (rendu < attendu) return manquants(ev, [[id, attendu - rendu]], [[id, rendu]]);
      if ((S.metier || "loueur") === "loueur") { const b = creerBon({ type: "retour", evenement: ev, date: Date.now(), lignes: [[id, rendu]] }); aller("bon", b); return annulable([m], `${rendu} revenu${rendu > 1 ? "s" : ""}, ajouté${rendu > 1 ? "s" : ""} au bon de retour.`, b, [[id, rendu]]); }
      rendre(); return annulable([m], "Retour enregistré.");
    }
    if (type === "Sortie") { const m = mouvement(id, "Sortie", n, Object.assign({ imputation: ev }, extraLieu(lieu))); rendre(); return annulable([m], `${n} sorti${n > 1 ? "s" : ""} pour ${ev}.`); }
    if (type === "Surplus") { const m = mouvement(id, "Entrée", n, Object.assign({ motif: "Surplus remis", imputation: ev }, extraLieu(lieu))); rendre(); return annulable([m], `${n} remis en stock.`); }
    if (type === "Prêt") {
      const m = mouvement(id, "Prêt", n, { evenement: ev });
      if (S.metier && S.metier !== "loueur") { rendre(); return annulable([m], `Emprunté pour ${ev}.`); }
      // Un seul bon par événement et par jour : les sorties suivantes s'y ajoutent jusqu'à la signature.
      const b = creerBon({ type: "sortie", evenement: ev, date: Date.now(), lignes: [[id, n]] }); aller("bon", b);
      return annulable([m], `${n} ajouté${n > 1 ? "s" : ""} au bon de sortie.`, b, [[id, n]]);
    }
    const m = mouvement(id, type, n, Object.assign({ evenement: ev === "Au dépôt" ? "" : ev, motif, refac: type === "Perte" && ev !== "Au dépôt" && motif !== "Abîmé" }, extraLieu(lieu)));
    rendre(); annulable([m], "Enregistré.");
  };
  f.querySelector("[data-ok]").onclick = () => valider();
}
function manquants(ev, liste, rendus) {
  // Rentrer une partie d'un lot est un geste normal (deux voyages) : le titre constate, le choix sans conséquence passe en premier.
  const total = liste.reduce((t, [, q]) => t + q, 0);
  const f = ouvrirFeuille(`<div class="f-geste" role="dialog" aria-modal="true" aria-labelledby="tmq"><h1 id="tmq" style="font-size:26px">${total > 1 ? `${total} ne sont pas de retour` : "1 n'est pas de retour"}</h1>
    <p>${liste.map(([id, q]) => `<b>${q}</b> × ${esc(art(id).nom)}`).join("<br>")}</p>
    <div class="t-actions manque-choix"><button class="btn plein" data-c="attente">${total > 1 ? "Le reste reviendra plus tard" : "Il reviendra plus tard"}</button>
    <button class="btn" data-c="perte">${I.perte}<span>Cassé ou perdu<small>Noté à refacturer</small></span></button></div></div>`);
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
  const f = ouvrirFeuille(`<div class="f-geste" role="dialog" aria-modal="true" aria-labelledby="tk"><h1 id="tk" style="font-size:26px">${esc(k.nom)}</h1>
    <details class="dp-contenu"><summary>Voir ce que contient le kit</summary><p>${k.lignes.map(([id, q]) => `${q} × ${esc(art(id).nom)}`).join("<br>")}</p></details>
    <p class="sous">Combien de kits ?</p>
    <div class="compteur"><button data-pas="-1" aria-label="Un de moins">−</button><input type="number" inputmode="numeric" min="1" value="1" aria-label="Nombre de kits"><button data-pas="1" aria-label="Un de plus">+</button></div>
    ${choixEvenement(S.evenements)}
    <div class="valider colle"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Valider</button></div></div>`);
  const champ = compteur(f, 1, null);
  brancherAutre(f);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const n = Math.max(1, Math.floor(+champ.value)), ev = evChoisi(f);
    if (!ev) return toast(`Indiquez : ${V("imp").toLowerCase()}.`);
    const manque = k.lignes.filter(([id, q]) => stockIci(id) < q * n);
    if (manque.length) return toast("Pas assez au dépôt : " + manque.map(([id]) => art(id).nom).join(", ") + ".");
    const ids = k.lignes.map(([id, q]) => logique(art(id)) === "pret" ? mouvement(id, "Prêt", q * n, { evenement: ev }) : mouvement(id, "Sortie", q * n, { imputation: ev }));
    f.remove();
    if (S.metier && S.metier !== "loueur") { aller("accueil"); return annulable(ids, `${n} × ${k.nom} : sortie enregistrée pour ${ev}.`); }
    const lignes = k.lignes.map(([id, q]) => [id, q * n]), b = creerBon({ type: "sortie", evenement: ev, date: Date.now(), lignes });
    aller("bon", b); annulable(ids, `${n} × ${k.nom} ajouté${n > 1 ? "s" : ""} au bon de sortie.`, b, lignes);
  };
}

/* ---------------- Caméra ---------------- */
const script = src => new Promise((ok, ko) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
const code = t => { const m = String(t).toUpperCase().match(/ART-\d{4}/); return m ? m[0] : null; };
function ouvrir(id) { if (!art(id)) return codeInconnu(id); if (vue.nom === "preparation") return scanPreparation(id); aller("objet", id); }
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
    try { await script("lib/jsQR.js"); } catch (e) { fermer(); return toast("Lecteur indisponible hors ligne : tapez le code."); }
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
  try { await script("lib/qrcode.js"); } catch (e) { cases.forEach(c => c.textContent = "QR indisponible hors ligne"); return; }
  const base = location.href.split("#")[0].split("?")[0];
  cases.forEach(c => { const q = window.qrcode(0, "M"); q.addData(base + "#/a/" + c.dataset.qr); q.make(); c.innerHTML = q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); });
}
/* ---------------- Branchements ---------------- */
function brancher() {
  // Connexion et déverrouillage
  const fco = $('[data-form="connexion"]'); if (fco) fco.onsubmit = e => { e.preventDefault(); seConnecter(fco); };
  const fdv = $('[data-form="deverrouiller"]'); if (fdv) { fdv.onsubmit = e => { e.preventDefault(); deverrouiller(fdv); }; if (window.innerWidth >= 960) fdv.mdp.focus(); }
  $$("[data-voir]").forEach(b => b.onclick = () => { const i = b.parentNode.querySelector("input"); const v = i.type === "password"; i.type = v ? "text" : "password"; b.setAttribute("aria-label", v ? "Cacher le mot de passe" : "Afficher le mot de passe"); b.classList.toggle("actif", v); });
  $$("[data-remplir]").forEach(b => b.onclick = () => { const [i, m] = b.dataset.remplir.split("|"), f = $('[data-form="connexion"]'); f.ident.value = i; f.mdp.value = m; seConnecter(f); });
  $$("[data-racine]").forEach(b => b.onclick = () => aller(b.dataset.racine, null, true));
  $$("[data-periode]").forEach(b => b.onclick = () => { periode = +b.dataset.periode; rendre(); refocus(`[data-periode="${periode}"]`); });
  $$("[data-acces]").forEach(c => c.onchange = () => { const u = S.equipe.find(x => x.id === c.dataset.acces); u.actif = c.checked; if (!u.actif) delete u.invite; sauver(); rendre(); toast(c.checked ? `${u.nom} peut de nouveau se connecter.` : `Accès retiré à ${u.nom}. Ses mouvements restent dans le journal.`); });
  $$("[data-nouveau-code]").forEach(b => b.onclick = () => feuilleCode(b.dataset.nouveauCode));
  $$("[data-verrou]").forEach(s => s.onchange = () => { S.reglages.verrou = +s.value; sauver(); activite(); toast("Réglage enregistré."); });
  $$("[data-aller]").forEach(b => b.onclick = () => aller(b.dataset.aller, b.dataset.arg));
  $$("[data-objet]").forEach(b => b.onclick = () => aller("objet", b.dataset.objet));
  $$("[data-fiche]").forEach(b => b.onclick = () => aller("fiche", b.dataset.fiche));
  $$("[data-mvt]").forEach(b => b.onclick = () => feuille(vue.arg, b.dataset.mvt));
  $$("[data-kit]").forEach(b => b.onclick = () => feuilleKit(b.dataset.kit));
  $$("[data-ev]").forEach(b => b.onclick = () => aller("retourEv", b.dataset.ev));
  $$("[data-devis]").forEach(b => b.onclick = () => feuilleIntervention(b.dataset.devis));
  // Modules : seulement dans l'espace installateur, d'après le devis
  $$("[data-module]").forEach(c => c.onchange = () => { S.modules[c.dataset.module] = c.checked; sauver(); rendre(); toast(`${CATALOGUE[c.dataset.module].nom} ${c.checked ? "installé" : "retiré"} pour ce client.`); });
  $$("[data-monnaie]").forEach(s => s.onchange = () => { S.monnaie = s.value; sauver(); rendre(); });
  $$("[data-cmd]").forEach(b => b.onclick = () => { creerCommande(b.dataset.cmd, b.dataset.statut); toast(b.dataset.statut === "Envoyée" ? "Bon de commande envoyé (simulation)." : "Demande envoyée à la direction."); rendre(); });
  $$("[data-valider]").forEach(b => b.onclick = () => { S.commandes.find(c => c.id === b.dataset.valider).statut = "Envoyée"; sauver(); toast("Commande validée et envoyée (simulation)."); rendre(); });
  // « Réceptionner » ouvre l'écran de réception, prérempli avec la commande : on y note un écart et on photographie le bon.
  $$("[data-recevoir]").forEach(b => b.onclick = () => aller("receptionCmd", b.dataset.recevoir));
  const fc = $('[data-form="code"]'); if (fc) fc.onsubmit = e => { e.preventDefault(); const v = fc.code.value; const id = code(v) || code("ART-" + v.replace(/\D/g, "").padStart(4, "0")); if (id) ouvrir(id); else toast("Code non reconnu, exemple : ART-0003."); };
  // Recherche dans une liste : on filtre les lignes en place. « Entrée » ouvre l'objet s'il n'en reste qu'un.
  $$("[data-filtre]").forEach(c => {
    c.oninput = () => { filtreTexte = c.value; filtrerListe(c); };
    c.onkeydown = e => { if (e.key !== "Enter") return; e.preventDefault(); const l = [...$(c.dataset.filtre).querySelectorAll("[data-cherche]:not([hidden]) button")]; if (l.length === 1) l[0].click(); else if (!l.length) toast("Aucun objet ne correspond."); };
    if (filtreTexte) filtrerListe(c);
  });
  const fq = $('[data-form="cherche"]'); if (fq) fq.onsubmit = e => e.preventDefault();
  // Après un filtre, l'écran est redessiné : on rend le focus au filtre choisi (clavier, lecteur d'écran).
  const refocus = sel => { const n = $(sel); if (n) n.focus({ preventScroll: true }); };
  $$("[data-filtre-materiel]").forEach(b => b.onclick = () => { const k = b.dataset.filtreMateriel; vue = { nom: "materiel", arg: k }; rendre(); refocus(`[data-filtre-materiel="${k}"]`); });
  $$("[data-journal-type]").forEach(b => b.onclick = () => { const k = b.dataset.journalType; jr.type = k; jr.n = JR_VUES; rendre(); refocus(`[data-journal-type="${k}"]`); });
  $$("[data-journal-q]").forEach(c => c.oninput = () => { jr.q = c.value; jr.n = JR_VUES; $("[data-journal]").innerHTML = corpsJournal(); brancherJournal(); });
  brancherJournal();
  // Sur ordinateur, la recherche de l'en-tête : un code ouvre l'objet, un mot filtre la liste.
  const fra = $('[data-form="rapide"]'); if (fra) fra.onsubmit = e => {
    e.preventDefault(); const q = fra.q.value.trim(); if (!q) return;
    const id = code(q) || (/^\d{1,4}$/.test(q) ? code("ART-" + q.padStart(4, "0")) : null);
    if (id && art(id)) return ouvrir(id);
    const m = sansAccent(q).split(/\s+/), l = S.articles.filter(a => m.every(x => sansAccent(a.nom + " " + a.id + " " + zoneDe(a)).includes(x)));
    if (l.length === 1) return aller(permis("materiel") ? "fiche" : "objet", l[0].id);
    const vers = permis("materiel") ? "materiel" : "chercher";
    aller(vers, vers === "materiel" ? "tous" : null); filtreTexte = q; rendre();
  };
  const fr = $('[data-form="retourEv"]'); if (fr) fr.onsubmit = e => {
    e.preventDefault(); const ev = vue.arg, rendus = [], manque = [];
    dehors().filter(d => d.evenement === ev).forEach(d => {
      const n = Math.max(0, Math.min(d.qte, Math.floor(+fr.elements[d.article].value || 0)));
      if (n) { mouvement(d.article, "Retour", n, { evenement: ev }); rendus.push([d.article, n]); }
      if (n < d.qte) manque.push([d.article, d.qte - n]);
    });
    if (manque.length) manquants(ev, manque, rendus); else aller("bon", creerBon({ type: "retour", evenement: ev, date: Date.now(), lignes: rendus }));
  };
  $$("[data-act]").forEach(b => { if (ACTIONS[b.dataset.act]) b.onclick = () => ACTIONS[b.dataset.act](); });
  brancherPlus();
  brancherEquipe();
  brancherMetiers();
  brancherOutils();
  brancherControles();
  brancherLieux();
  brancherGroupe();
  brancherArticles();
  brancherConfig();
  brancherBlocs();
  brancherDocuments();
  brancherEspace();
}
const ACTIONS = {
  camera: () => camera(),
  scanRafale: () => camera(true),
  camionPart: () => camionPart(),
  tour: () => demarrerTour(),
  demanderIntervention: () => feuilleIntervention(),
  coordonnees: () => feuilleCoordonnees(),
  nouveauClient: () => feuilleClient(),
  finAnnee: () => exporterFinAnnee(),
  plus: () => feuillePlus(),
  resume: () => feuilleResume(),
  voirDevis: () => feuilleDevis(),
  metiers: () => feuilleMetiers(),
  voirPlus: () => { toutVoir = true; rendre(); },
  tableauEntier: () => { tableauEntier = true; ongletAccueil = "jour"; entree = true; toutVoir = false; rendre(); window.scrollTo(0, 0); },
  essentiel: () => { tableauEntier = false; entree = true; rendre(); window.scrollTo(0, 0); },
  aDecider: () => feuilleDecider(),
  tachesAFaire: () => feuilleTaches(x => !x.bouton),
  tachesToutes: () => feuilleTaches(),
  retour: () => { const p = pile.pop(), parent = PARENT[ALIAS[vue.nom] || vue.nom]; vue = p || { nom: parent || "accueil" }; rendre(); window.scrollTo(0, 0); },
  sortir: garderMessage => { session = null; verrouille = false; clearTimeout(minuteur); if (garderMessage !== true) msgConnexion = ""; vue = { nom: "accueil" }; pile = []; tableauEntier = false; $$(".feuille").forEach(f => f.remove()); rendre(); window.scrollTo(0, 0); },
  verrouiller: () => { verrouille = true; msgConnexion = ""; clearTimeout(minuteur); rendre(); },
  reglages: () => feuilleReglages(),
  ecranAccueil: () => feuilleEcranAccueil(),
  ajouterPersonne: () => feuilleAjouter(),
  monProfil: () => { nFiche = 30; aller("personne", session.uid); },
  installateur: () => { if (ESPACE) feuilleInstallateur(); },
  quitterInstallateur: () => { installateur = false; rendre(); },
  revenirConfig: () => { session = null; verrouille = false; clearTimeout(minuteur); installateur = true; vueE = { nom: "reglages", arg: null }; rendre(); window.scrollTo(0, 0); },
  plusE: () => feuillePlusE(),
  retourE: () => { vueE = pileE.pop() || { nom: "tableau", arg: null }; rendre(); window.scrollTo(0, 0); },
  nouveauClientP: () => feuilleClientP(null),
  voirDemoClient: () => { installateur = false; session = null; rendre(); window.scrollTo(0, 0); },
  configDefaut: () => { if (!confirm("Remettre les blocs, la barre et les droits de tous les rôles comme le prévoit le métier ?")) return; S.config = configParDefaut(S.metier); sauver(); rendre(); toast("Réglages du métier remis."); },
  reinit: () => { if (confirm("Effacer ce qui a été fait pendant la démo ?")) { ecrireTemoin(""); if (groupeActif()) reinitGroupe(); else S = construireDemo(S.metier || "loueur"); sauver(); session = null; verrouille = false; vue = { nom: "accueil" }; rendre(); toast("Démo remise à zéro."); } },
  imprimer: () => window.print(),
  csv: () => exporterJournal(),
  exportClients: () => exporterClients(),
  partagerDevisLoc: () => partagerTexte(texteDevisLocation(vue.arg)),
  partager: async () => {
    const t = texteBon(vue.arg);
    partagerTexte(t);
  },
};
function lienProfond() { const id = code(location.hash); if (id && art(id)) vue = { nom: "objet", arg: id }; }

// Liens directs pour la démo : ?profil=terrain|bureau|direction&vue=…&arg=…, ?installateur=1
(function () {
  const q = new URLSearchParams(location.search);
  // Démo de groupe (groupe.js) : ?groupe=… ouvre plusieurs établissements ; ?metier=… seul revient à une démo simple
  adresseGroupe(q);
  // Une démo d'essai ouverte (essai.js) n'est pas remplacée ici : essai.js la met de côté avec ses gestes avant de changer de métier
  if (propre(METIERS, q.get("metier")) && !S.monEssai && (S.variante || S.metier || "loueur") !== q.get("metier")) { const garder = { monnaie: S.monnaie }; S = construireDemo(q.get("metier")); Object.assign(S, garder); sauver(); }
  if (!FRANCE_SEULE && (q.get("monnaie") === "XOF" || q.get("monnaie") === "EUR")) { S.monnaie = q.get("monnaie"); sauver(); }
  // ?presentation=complet|essentiel fixe la présentation de l'accueil (config.js), pour les essais et les scripts de capture.
  if (PRESENTATIONS[q.get("presentation")]) reglerPresentation(q.get("presentation"));
  // En démo, un lien direct ouvre la session de la première personne active du profil, sans mot de passe.
  // En production, ces liens n'existent pas : chacun se connecte avec son identifiant et son mot de passe.
  const u = PROFILS[q.get("profil")] && S.equipe.find(x => x.role === q.get("profil") && x.actif);
  if (u) { session = { uid: u.id, nom: u.nom, profil: u.role, admin: !!u.admin }; vue = { nom: q.get("vue") || vueDepart(u.role), arg: q.get("arg") }; lienProfond(); activite(); }
  else if (q.get("installateur") === "1" && ESPACE) {
    installateur = true;
    if (["terrain", "chauffeur", "bureau", "direction"].includes(q.get("role"))) { roleConf = q.get("role"); vueE = { nom: "reglages", arg: null }; }
    else if (VUES_E[q.get("vue")] || ["client", "installation"].includes(q.get("vue"))) vueE = { nom: q.get("vue"), arg: q.get("arg") };
  }
  if (["clair", "sombre", "nuit"].includes(q.get("theme"))) { try { localStorage.setItem(CLE_THEME, q.get("theme")); } catch (e) { /* stockage bloqué */ } appliquerTheme(); }
})();
window.addEventListener("hashchange", () => { if (session) { lienProfond(); rendre(); } });
["online", "offline"].forEach(ev => window.addEventListener(ev, () => { if (session && !verrouille) { rendre(); toast(ev === "online" ? "Réseau revenu." : "Hors ligne : l'appli continue, vos gestes sont gardés sur ce téléphone."); } }));
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").then(() => garderPhotos()).catch(() => {});
// Hors ligne, les photos des objets doivent être là : on demande au service worker de garder celles du métier ouvert.
function garderPhotos() {
  if (!("serviceWorker" in navigator)) return;
  const liste = [...new Set(S.articles.filter(a => a.img).map(a => `img/${a.img}.webp`))];
  navigator.serviceWorker.ready.then(r => { if (r.active) r.active.postMessage({ type: "photos", liste }); }).catch(() => {});
}
demarrerInvitation();
rendre();
// Les graphiques se redessinent à la largeur de l'écran (rotation du téléphone, fenêtre redimensionnée).
let attenteTaille, largeurAvant = window.innerWidth;
window.addEventListener("resize", () => {
  clearTimeout(attenteTaille);
  attenteTaille = setTimeout(() => {
    // Sur téléphone, le clavier qui s'ouvre change la hauteur, pas la largeur : on ne redessine pas.
    if (window.innerWidth === largeurAvant) return;
    largeurAvant = window.innerWidth;
    if (session && !verrouille && !document.querySelector(".feuille, .camera") && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) rendre();
  }, 300);
});

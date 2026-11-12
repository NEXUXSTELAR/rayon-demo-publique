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
  precedent: P('<path d="M38 24H10M20 14 10 24l10 10"/>'),
  maison: P('<path d="M6 22 24 7l18 15"/><path d="M11 18v22h26V18M20 40V28h8v12"/>'),
  grille: P('<rect x="7" y="7" width="14" height="14" rx="3"/><rect x="27" y="7" width="14" height="14" rx="3"/><rect x="7" y="27" width="14" height="14" rx="3"/><rect x="27" y="27" width="14" height="14" rx="3"/>'),
  oeil: P('<path d="M4 24s7-12 20-12 20 12 20 12-7 12-20 12S4 24 4 24z"/><circle cx="24" cy="24" r="5"/>'),
  sortir: P('<path d="M20 8H9a2 2 0 0 0-2 2v28a2 2 0 0 0 2 2h11M30 15l9 9-9 9M39 24H18"/>'),
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
const SIGNE = { "Inventaire initial": 1, "Entrée": 1, "Retour": 1, "Prêt": -1, "Perte": -1, "Sortie": -1, "Ajustement": 1, "Réparation": -1, "Retour réparation": 1, "Contrôle": 0, "Transfert": 0 };
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
const img = a => a.img ? `<div class="vignette"><img src="img/${a.img}.webp" alt="" loading="lazy" width="360" height="360"></div>` : pic(I.materiel);
const pic = ic => `<div class="vignette pic">${ic}</div>`;
const initiales = n => n.split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();
const avatar = (u, grand) => `<span class="avatar ${u.role === "direction" ? "direction" : ""} ${grand ? "grand" : ""}" aria-hidden="true">${esc(initiales(u.nom))}</span>`;
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
  S.mouvements.push(Object.assign({ id, date: Date.now(), profil: session.profil, qui: session.nom, article, type, qte, evenement: "", motif: "" }, extra || {}));
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
    const c = Object.assign({}, m, { id: prochainMv(), date: Date.now(), profil: session.profil, qui: session.nom, qte: -m.qte, motif: "Annulation de " + m.id, annule: m.id });
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
let filtreTexte = "", jr = { type: "tous", q: "", n: 60 };
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
  if (vue.nom !== nom) { filtreTexte = ""; jr = { type: "tous", q: "", n: 60 }; }
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
  if (typeof rafraichirPalette === "function") rafraichirPalette();
  const r = $("#racine");
  if (!session && installateur) r.innerHTML = coqueEspace();
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
    <div class="c-tete"><h1>Bonjour</h1><p class="sous">Entrez l'identifiant et le mot de passe que votre responsable vous a donnés.</p></div>
    <form class="c-form verre" data-form="connexion">
      <label class="champ">Identifiant<input name="ident" value="${esc(ident)}" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required${msgConnexion ? ' aria-invalid="true"' : ""}></label>
      <label class="champ">Mot de passe${champMdp("current-password")}</label>
      <label class="case"><input type="checkbox" name="memo" ${memo ? "checked" : ""}>Garder mon identifiant sur ce téléphone</label>
      <p class="message" role="alert">${esc(msgConnexion)}</p>
      <button class="btn plein">Se connecter</button>
    </form>
    <details class="c-demo" open><summary><span><b>Comptes de démonstration</b><small>Entrer d'un geste, sans rien taper</small></span></summary>
      <p class="sous">Touchez un compte pour entrer. Chacun voit un écran différent, réglé pour son travail. Dans l'appli livrée, cette liste n'existe pas : chacun reçoit son identifiant.</p>
      <div class="c-comptes">${EQUIPE_DEMO.filter(d => S.equipe.some(x => x.id === d.id)).map(d => { const u = S.equipe.find(x => x.id === d.id) || d; return `<button type="button" data-remplir="${d.identifiant}|${d.mdp}">${avatar(u)}<span><b>${esc(u.poste)}</b><small>${esc(u.nom)} · <span class="code">${d.identifiant}</span> · <span class="code">${d.mdp}</span></small></span>${I.fleche}</button>`; }).join("")}</div>
    </details>
    <div class="c-pied">
      <button class="btn plein visite" data-act="tour">${I.fleche}Visite guidée en 2 minutes</button>
      <p>Démo réglée pour : <b>${esc(metier().nom)}</b> · <button class="lien" data-act="metiers">Voir un autre métier</button></p>
      <p>${ESPACE ? `<button class="lien" data-act="installateur">Mon espace (installateur)</button> · ` : ""}<button class="lien" data-act="reinit">Remettre la démo à zéro</button></p>
    </div>
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
  verrouille = false; pile = []; entree = true; toutVoir = false;
  vue = { nom: "accueil" }; lienProfond(); activite(); rendre(); window.scrollTo(0, 0);
}
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
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tr"><h1 id="tr" style="font-size:26px">Réglages de l'appareil</h1>
    <p class="sous">Le thème ne change que l'affichage de cet appareil. Les couleurs des actions gardent leur sens : orange, ça part ; vert, ça revient.</p>
    <div class="themes" role="radiogroup" aria-label="Thème">${Object.entries(THEMES).map(([k, n]) => `<label><input type="radio" name="theme" value="${k}" ${k === c ? "checked" : ""}><span class="apercu" style="background:${ap[k][0]}"><i style="background:${ap[k][1]}"></i><i style="background:${ap[k][2]}"></i></span>${n}</label>`).join("")}</div>
    ${session ? `<div class="valider" style="grid-template-columns:1fr 1fr"><button class="btn" data-a="verrouiller">${I.cadenas}Verrouiller</button><button class="btn" data-a="sortir">${I.sortir}Se déconnecter</button></div>` : ""}
    <div class="valider" style="grid-template-columns:1fr"><button class="btn plein" data-x>Fermer</button></div></div>`);
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
  inventairePapier: bInventairePapier, refacturer: bRefacturer, rapport: dRapport, installation: dInstallation, equipe: dEquipe,
  reservations: bReservations, reservation: bReservation, clients: bClients, client: vClient, devisLoc: vDevisLocation,
  controles: vRegistreControles, lieux: vLieux, lieu: vLieu, ficheLieu: vFicheLieu,
});
// Les écrans du dépôt restent sur une colonne étroite, même sur ordinateur.
const ETROITS = new Set(["tournee", "depot", "objet", "kits", "recuperer", "retourEv", "chercher", "jour", "bon", "preparer", "preparation", "reception", "receptionCmd", "zones", "zone", "lieux", "lieu"]);
const PARENT = { client: "clients", devisLoc: "reservations", fiche: "materiel", reservation: "reservations", etiquettes: "docs", inventairePapier: "docs", refacturer: "docs", rapport: "docs", controles: "docs", lieu: "lieux", ficheLieu: "lieux", retourEv: "recuperer", preparation: "preparer", receptionCmd: "reception", zone: "zones" };
const TITRES = { client: "Client", devisLoc: "Devis de location", objet: "Objet", fiche: "Fiche de l'objet", bon: "Bon", facture: "Facture de casse", reservation: "Réservation", retourEv: "Retour", preparation: "Préparation", receptionCmd: "Réception", zone: "Comptage", etiquettes: "Étiquettes", inventairePapier: "Inventaire", refacturer: "À refacturer", rapport: "Rapport", controles: "Contrôles", lieu: "Contenu du lieu", ficheLieu: "Fiche du lieu" };
const sectionsPermises = () => Object.keys(SECTIONS).filter(k => k !== "accueil" && permis(k));

function coque() {
  const nom = ALIAS[vue.nom] || vue.nom, sec = PARENT[nom] || nom;
  const vues = VUES(), ok = permis(sec) && vues[nom];
  const corps = ok ? vues[nom](vue.arg) : `<h1>Pas d'accès</h1><p class="sous">Cet écran n'est pas prévu pour votre rôle. Demandez à votre responsable.</p>`;
  const u = moi(), e = S.entreprise || {};
  const barre = cfg().barre.filter(k => permis(k)).slice(0, 3);
  while (barre.length < 3) barre.push("");
  const courant = k => (k === sec ? 'aria-current="page"' : "");
  const bouton = k => k ? `<button data-racine="${k}" ${courant(k)}>${I[SECTIONS[k].i]}<span>${esc(titreCourt(k))}</span></button>` : `<span></span>`;
  const dansBarre = barre.includes(sec);
  // Menu de gauche : les gestes du dépôt tiennent en une entrée (plus les raccourcis du rôle), pour garder la gestion visible.
  const groupes = Object.entries(GROUPES).map(([g, t]) => { const l = sectionsPermises().filter(k => SECTIONS[k].g === g && (g !== "depot" || k === "depot" || barre.includes(k))); return l.length ? `<h4>${t}</h4>${l.map(k => `<button data-racine="${k}" ${courant(k)}>${I[SECTIONS[k].i]}<span>${esc(titreSection(k))}</span></button>`).join("")}` : ""; }).join("");
  const titre = nom === "accueil" ? esc(e.nom || "Stock démo") : esc(TITRES[nom] || titreSection(nom) || "");
  return `<div class="app">${DEMO}
    <aside class="cote" aria-label="Menu">
      <div class="marque">${e.logo ? `<img src="${e.logo}" alt="" class="logo-client">` : I.logo}<span>${esc(e.nom || "Stock démo")}</span></div>
      <button class="btn plein" data-act="camera">${I.scan}Scanner</button>
      <nav><button data-racine="accueil" ${courant("accueil")}>${I.maison}<span>Accueil</span></button>${groupes}</nav>
      <div class="cote-pied"><div class="moi">${avatar(u)}<span><b>${esc(u.nom)}</b><small>${esc(u.poste || "")}</small></span></div>
        <div class="cote-outils"><button class="rond" data-act="verrouiller" aria-label="Verrouiller l'écran">${I.cadenas}</button>${boutonReglages}<button class="rond" data-act="sortir" aria-label="Se déconnecter">${I.sortir}</button></div></div>
    </aside>
    <header class="haut verre">
      ${nom === "accueil" ? `<div class="marque">${e.logo ? `<img src="${e.logo}" alt="" class="logo-client">` : I.logo}</div>` : `<button class="rond" data-act="retour" aria-label="Retour">${I.precedent}</button>`}
      <b class="haut-titre">${nom === "accueil" ? `<span class="ht-tel">${titre}</span><span class="ht-ordi">Accueil</span>` : titre}</b>
      <form class="haut-cherche" data-form="rapide" role="search"><label class="recherche">${I.loupe}<span class="cache">Chercher un objet ou taper le code d'une étiquette</span><input type="search" name="q" placeholder="Chercher un objet, ou taper un code" autocomplete="off" autocapitalize="none" spellcheck="false"></label></form>${nonEnregistre ? `<span class="hors-ligne non-enregistre" role="status" title="Ce téléphone refuse d'enregistrer : mémoire pleine ou navigation privée. Ce que vous faites sera perdu à la fermeture.">Non enregistré</span>` : navigator.onLine === false ? `<span class="hors-ligne" role="status" title="L'appli continue sans réseau. Vos gestes sont gardés sur ce téléphone.">Hors ligne</span>` : ""}
      <div class="outils"><button class="rond" data-act="verrouiller" aria-label="Verrouiller l'écran">${I.cadenas}</button><button class="avatar-btn" data-act="plus" aria-label="Mon compte et tous les écrans">${avatar(u)}</button></div>
    </header>
    <main class="${ETROITS.has(nom) ? "t-main" : "b-main"}">${corps}</main>
    <nav class="barre-bas verre" aria-label="Navigation">${bouton(barre[0])}${bouton(barre[1])}
      <button class="bb-scan" data-act="camera" aria-label="Scanner une étiquette">${I.scan}</button>
      ${bouton(barre[2])}<button data-act="plus" ${dansBarre || sec === "accueil" ? "" : 'aria-current="page"'}>${I.grille}<span>Plus</span></button></nav>
  </div>`;
}

/* « Plus » : tout ce que la personne a le droit d'ouvrir, en tuiles. Pas de menu qui défile de côté. */
function feuillePlus() {
  const u = moi(), sec = PARENT[ALIAS[vue.nom] || vue.nom] || ALIAS[vue.nom] || vue.nom;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-label="Tous les écrans">
    <div class="plus-moi">${avatar(u, true)}<div><b>${esc(u.nom)}</b><small>${esc(u.poste || "")}${session.admin ? " · administratrice du compte" : ""}</small></div></div>
    ${Object.entries(GROUPES).map(([g, t]) => { const l = sectionsPermises().filter(k => SECTIONS[k].g === g); return l.length ? `<h2>${t}</h2><div class="plus-grille">${l.map(k => `<button data-k="${k}" ${k === sec ? 'aria-current="page"' : ""}><span class="pastille">${I[SECTIONS[k].i]}</span>${esc(titreSection(k))}</button>`).join("")}</div>` : ""; }).join("")}
    <div class="valider trois"><button class="btn" data-a="reglages">${I.reglages}Thème</button><button class="btn" data-a="verrouiller">${I.cadenas}Verrouiller</button><button class="btn" data-a="sortir">${I.sortir}Sortir</button></div>
    ${installateur ? `<div class="valider" style="grid-template-columns:1fr"><button class="btn plein" data-a="revenirConfig">Revenir au réglage de l'installation</button></div>` : ""}
  </div>`);
  f.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { f.remove(); aller(b.dataset.k, null, true); });
  f.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { f.remove(); ACTIONS[b.dataset.a](); });
}

/* Accueil : une salutation, puis les blocs choisis pour ce rôle dans cette entreprise. */
function vAccueil() {
  const u = moi(), h = new Date().getHours();
  return `<div class="salut"><p class="date">${dateLongue(aujourdHui())}</p><h1>${h >= 18 || h < 5 ? "Bonsoir" : "Bonjour"} ${esc(u.nom)}</h1></div>${bento(accueilAvecControles(cfg().accueil), window.innerWidth < 720 && !toutVoir ? 6 : 0)}`;
}
// Les gestes du magasinier, ouverts à toute l'équipe.
const vDepot = () => `<h1>Au dépôt</h1><p class="sous">Scanner, sortir, rentrer, compter : ce que fait le magasinier, chacun peut le faire.</p>${wScan()}${wActions()}`;
function tObjet(id) {
  const a = art(id); if (!a) return `<p>Objet introuvable.</p>`;
  const q = stock(id), e = etat(a), pret = logique(a) === "pret";
  const jauge = a.type === "equip" ? `<div class="t-stock">${q >= 1 ? "Ici" : "Sorti"}</div>` : anneau(q, a.cible, couleurEtat(e), q, `en stock sur ${a.cible}`);
  const lots = metier().dlc ? lotsEnStock(id) : [];
  const c = conseil(a);
  const b1 = pret ? ["Prêt", "sortie", I.sortie, V("pretSortie"), V("pretSortieSous")] : ["Sortie", "sortie", I.sortie, V("prendre"), V("prendreSous")];
  const b2 = pret ? ["Retour", "retour", I.retour, V("pretRetour"), V("pretRetourSous")] : ["Surplus", "retour", I.retour, V("remettre"), V("remettreSous")];
  const bouton = ([mvt, cl, ic, t, st]) => `<button class="t-action ${cl} ${c.mvt === mvt ? "conseil" : ""}" data-mvt="${mvt}">${ic}<span>${t}<small>${st}</small></span></button>`;
  // Le geste le plus probable passe en premier et un peu plus grand
  const actions = (c.html || "") + (c.mvt === b2[0] ? bouton(b2) + bouton(b1) : bouton(b1) + bouton(b2));
  return `<div class="t-objet">${img(a)}<span class="code">${a.id}</span><h1>${esc(a.nom)}</h1>
    ${jauge}<div style="margin-top:8px"><span class="etat ${e.c}"><i></i>${e.t}</span></div>
    ${ligneControle(a)}${ligneLieux(a)}
    ${lots.length ? `<p class="lot-premier">À sortir en premier : ${lots[0].qte} avec date limite au <b>${dateFr(lots[0].dlc)}</b></p>` : ""}</div>
  <div class="t-actions">${actions}
    <button class="t-action compter" data-mvt="Compter">${I.compter}<span>Compter<small>Je vérifie combien il y en a</small></span></button>
    ${boutonControleFait(a)}${boutonTransfert(a)}
    ${pret ? `<button class="btn" data-atelier="${a.id}">À réparer ou à nettoyer${totalAtelier(id) ? ` (${totalAtelier(id)} déjà à l'atelier)` : ""}</button>` : ""}
    <button class="t-action perte" data-mvt="Perte">${I.perte}<span>${metier().dlc ? "Périmé, cassé ou perdu" : "Cassé ou perdu"}</span></button>
    ${permis("materiel") ? `<button class="btn" data-fiche="${a.id}">${I.materiel}Fiche complète : ${droit("prix") ? "prix, " : ""}historique, entrée en stock</button>` : ""}
  </div>`;
}
/* Le geste le plus probable, d'après ce qui se passe autour de l'objet */
function conseil(a) {
  const id = a.id, auj = aujourdHui(), demain = isoJour(Date.now() + JOUR_MS);
  const prep = actif("MO-RES") && S.reservations.find(r => ["Confirmée", "Préparée"].includes(r.statut) && r.debut <= demain && r.lignes.some(l => l[0] === id) && (r.charge[id] || 0) < r.lignes.find(l => l[0] === id)[1]);
  if (prep) return { html: `<button class="t-action sortie conseil" data-prep="${prep.id}">${I.camion}<span>Charger pour ${esc(prep.nom)}<small>Départ ${prep.debut <= auj ? "aujourd'hui" : "demain"} · ${prep.charge[id] || 0} / ${prep.lignes.find(l => l[0] === id)[1]} chargés</small></span></button>` };
  const cmd = S.commandes.find(k => ["Envoyée", "Reçue en partie"].includes(k.statut) && k.lignes.some(l => l.id === id && (l.recu || 0) < l.qte));
  if (cmd) return { html: `<button class="t-action compter conseil" data-recep="${cmd.id}">${I.camion}<span>Réceptionner la livraison<small>${esc(cmd.fournisseur)} · ${cmd.id}</small></span></button>` };
  if (logique(a) === "pret" && dehors(id).length) return { mvt: "Retour" };
  return { mvt: logique(a) === "pret" ? "Prêt" : "Sortie" };
}
const zoneDe = a => (S.emplacements.find(x => x.id === a.emp) || {}).nom || "";
const exempleRecherche = () => S.articles.slice(0, 2).map(a => a.nom.split(/\s+/)[0].toLowerCase()).join(", ") + "…";
function tChercher(filtre) {
  if (filtre && entree) filtreTexte = filtre;
  return `<h1>Chercher un objet</h1><p class="sous">Tapez le début du nom, le code de l'étiquette ou la zone. La liste se réduit à mesure.</p>
  <form class="t-ou" data-form="cherche">${champFiltre("#liste-cherche", exempleRecherche())}</form>
  <ul class="t-liste" id="liste-cherche">${S.articles.map(a => `<li data-cherche="${cherchable(a.nom, a.id, zoneDe(a))}"><button data-objet="${a.id}">${img(a)}<span><b>${esc(a.nom)}</b><small>${esc(zoneDe(a))}</small></span><span class="n">${stock(a.id)}</span></button></li>`).join("")}
  <li class="vide" data-rien hidden>Aucun objet ne correspond. Vérifiez l'orthographe, ou tapez le code écrit sous le QR.</li></ul>`;
}
function tJour() {
  const debut = new Date(); debut.setHours(0, 0, 0, 0);
  const l = S.mouvements.filter(m => m.date >= debut.getTime() && m.qui === session.nom).reverse();
  return `<h1>Ma journée</h1><p class="sous">${l.length} enregistrement${l.length > 1 ? "s" : ""} aujourd'hui.</p>
  <ul class="t-liste">${l.map(m => { const a = art(m.article); return `<li><button data-objet="${a.id}">${img(a)}<span><b>${esc(m.type)} · ${esc(a.nom)}</b><small>${quand(m.date)}${(m.evenement || m.imputation) ? " · " + esc(m.evenement || m.imputation) : ""}</small></span><span class="n">${m.type === "Contrôle" ? "" : m.qte}</span></button></li>`; }).join("") || `<li class="vide">Rien encore aujourd'hui. Scannez un objet pour commencer.</li>`}</ul>`;
}
function tKits() {
  return `<h1>Sortir un kit</h1><p class="sous">Choisissez le kit, puis indiquez le nombre et la destination (${motImp()}).</p>
  <ul class="t-liste">${S.kits.map(k => {
    const ok = k.lignes.every(([id, q]) => stockIci(id) >= q);
    return `<li><button data-kit="${k.id}">${pic(I.kit)}<span><b>${esc(k.nom)}</b><small>${k.lignes.map(([id, q]) => q + " × " + esc(art(id).nom)).join(" · ")}</small></span><span class="etat ${ok ? "" : "zero"}"><i></i></span></button></li>`;
  }).join("")}</ul>`;
}
function tRecuperer() {
  const parEv = {};
  dehors().forEach(d => { (parEv[d.evenement] = parEv[d.evenement] || []).push(d); });
  return `<h1>${esc(V("retourTitre") || "Retours")}</h1><p class="sous">Touchez ce qui revient. Tout ce qui était parti s'affiche : vous ne corrigez que ce qui manque.</p>
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
  return `<h2>À utiliser en premier</h2>${l.length ? `<ul class="b-liste">${l.slice(0, 6).map(x => `<li><button class="l" data-objet="${x.a.id}">${img(x.a)}<span><b>${esc(x.a.nom)}</b><small>${x.qte} avec date limite au ${dateFr(x.dlc)}${x.lieu !== undefined ? " · " + esc(nomLieu(x.lieu)) : ""}</small></span><span class="statut s-partie">${x.dlc <= new Date().toISOString().slice(0, 10) ? "Périmé" : "Bientôt"}</span></button></li>`).join("")}</ul>` : `<p class="vide">Rien ne périme dans les ${j} prochains jours.</p>`}`;
}
function bMateriel(f) {
  f = f || "tous";
  if (f === "controle" && !suiviControles()) f = "tous";
  const ids = new Set(dehors().map(d => d.article));
  const ctrl = suiviControles() ? aControler() : [];
  const l = (f === "controle" ? ctrl : S.articles.filter(a => f === "tous" || (f === "alerte" && ["zero", "bas"].includes(etat(a).c)) || (f === "dehors" && ids.has(a.id)))).filter(dansLieuStock);
  const vide = f === "alerte" ? "Rien à commander : tout est au-dessus du seuil." : f === "dehors" ? "Tout est rentré." : f === "controle" ? "Aucun contrôle en retard ni à faire dans les 30 jours." : "Aucun objet pour l'instant.";
  const compte = k => k === "tous" ? S.articles.length : k === "alerte" ? S.articles.filter(a => ["zero", "bas"].includes(etat(a).c)).length : k === "controle" ? ctrl.length : ids.size;
  return `<h1>${esc(titreSection("materiel"))}</h1>
  <div class="outils-liste"><div class="filtres">${[["tous", "Tout"], ["alerte", "À commander"]].concat(aDesPrets() ? [["dehors", V("chez")]] : [], suiviControles() ? [["controle", "À contrôler"]] : []).map(([k, t]) => `<button data-filtre-materiel="${k}" aria-pressed="${f === k}">${t}<span class="nb">${compte(k)}</span></button>`).join("")}</div>
  ${champFiltre("#liste-materiel", exempleRecherche())}${choixLieuStock()}<span class="filtre-compte" data-filtre-compte role="status"></span></div>
  <ul class="b-liste" id="liste-materiel">${l.map(a => { const e = etat(a); return `<li data-cherche="${cherchable(a.nom, a.id, zoneDe(a), e.t)}"><button class="l" data-fiche="${a.id}">${img(a)}<span><b>${esc(a.nom)}</b><small><span class="code">${a.id}</span> · <span class="etat ${e.c}"><i></i>${e.t}</span>${pastilleControle(a, f === "controle")}</small></span><span class="l-zone">${esc(zoneDe(a))}</span><span class="n">${qteStock(a)}</span></button></li>`; }).join("")}
  <li class="vide" data-rien ${l.length ? "hidden" : ""}>${l.length ? "Aucun objet ne correspond à cette recherche." : filtreLieuActif() ? `Rien ici : ${esc(nomLieu(lieuStock))}.` : vide}</li></ul>`;
}
function bFiche(id) {
  const a = art(id); if (!a) return "<p>Introuvable.</p>";
  const q = stock(id), e = etat(a), d = dehors(id);
  return `<div class="fiche">${img(a)}<div>
    <div class="entete"><div><span class="code">${a.id}</span><h1>${esc(a.nom)}</h1><span class="etat ${e.c}"><i></i>${e.t}</span></div>
    ${a.type === "equip" ? "" : anneau(q, a.cible, couleurEtat(e), q, "sur " + a.cible, true)}</div>
    ${ligneControle(a)}
    <dl><div><dt>En stock</dt><dd>${q}</dd></div>${logique(a) === "pret" ? `<div><dt>${V("chez")}</dt><dd>${d.reduce((t, x) => t + x.qte, 0)}</dd></div>` : `<div><dt>${V("sortiesMot")} en 30 jours</dt><dd>${S.mouvements.filter(m => m.article === id && m.type === "Sortie" && m.date >= Date.now() - 30 * 86400000).reduce((t, m) => t + m.qte, 0)}</dd></div>`}
      <div><dt>Seuil d'alerte</dt><dd>${a.seuil}</dd></div><div><dt>Niveau normal</dt><dd>${a.cible}</dd></div>
      ${droit("prix") ? `<div><dt>Prix unitaire</dt><dd>${argent(a.prix)}</dd></div><div><dt>Valeur au dépôt</dt><dd>${argent(Math.max(0, q) * a.prix)}</dd></div>` : ""}
      ${a.serie ? `<div><dt>N° de série</dt><dd class="code">${a.serie}</dd></div>` : ""}${detailsControle(a)}</dl>
    <div class="boutons">${totalAtelier(id) ? `<p class="sous" style="width:100%;margin:0 0 6px">À l'atelier : ${aLAtelier(id).map(x => x.qte + " " + (x.motif === "Au nettoyage" ? "au nettoyage" : "en réparation")).join(", ")}</p>` : ""}<button class="btn petit" data-atelier="${a.id}">Envoyer à l'atelier</button><button class="btn petit" data-mvt="Entrée">Entrée en stock</button><button class="btn petit" data-mvt="Compter">Compter</button><button class="btn petit" data-mvt="Perte">Perte</button>${boutonTransfert(a, true)}${boutonsControle(a)}</div>
  </div></div>
  ${blocLieuxFiche(a)}
  ${blocRentabilite(a)}
  ${metier().dlc && lotsEnStock(id).length ? `<h2>Lots en stock</h2><table class="t"><tbody>${lotsEnStock(id).map(l => `<tr><td>Date limite au ${dateFr(l.dlc)}</td><td class="n">${l.qte}</td></tr>`).join("")}</tbody></table>` : ""}
  ${d.length ? `<h2>Chez qui</h2><table class="t"><tbody>${d.map(x => `<tr><td>${esc(x.evenement)}</td><td class="n">${x.qte}</td></tr>`).join("")}</tbody></table>` : ""}
  <h2>Historique</h2>${tableMouvements(S.mouvements.filter(m => m.article === id).slice(-10).reverse(), false)}`;
}
function tableMouvements(l, avecObjet) {
  if (!l.length) return `<p class="vide">Aucun mouvement.</p>`;
  return `<div class="defile"><table class="t mvts${avecObjet ? " avec-objet" : ""}"><thead><tr><th>Quand</th><th>Qui</th><th>Quoi</th>${avecObjet ? "<th>Objet</th>" : ""}<th class="n">Qté</th></tr></thead><tbody>
  ${l.map(m => `<tr><td class="m-quand">${quand(m.date)}</td><td class="m-qui">${esc(m.qui || PROFILS[m.profil].nom)}</td><td class="m-quoi">${esc(m.type)}${(m.evenement || m.imputation) ? "<br><small>" + esc(m.evenement || m.imputation) + "</small>" : ""}${m.motif ? "<br><small>" + esc(m.motif) + "</small>" : ""}${lieuMv(m)}</td>${avecObjet ? `<td class="m-objet">${esc(art(m.article).nom)}</td>` : ""}<td class="n m-qte">${qteSignee(m)}</td></tr>`).join("")}</tbody></table></div>`;
}
// La quantité porte son sens : + ce qui entre au dépôt, − ce qui en sort.
const qteSignee = m => { if (m.type === "Contrôle") return ""; if (m.type === "Transfert") return (m.qte < 0 ? "−" : "") + Math.abs(m.qte).toLocaleString("fr-FR"); const v = (SIGNE[m.type] || 1) * m.qte; return (v < 0 ? "−" : "+") + Math.abs(v).toLocaleString("fr-FR"); };
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
  return `<p class="liste-compte" role="status">${l.length.toLocaleString("fr-FR")} mouvement${l.length > 1 ? "s" : ""}${filtre ? ` sur ${S.mouvements.length.toLocaleString("fr-FR")}` : ""}${l.length > jr.n ? ` · les ${jr.n} plus récents sont affichés` : ""}</p>
  ${l.length ? tableMouvements(l.slice(0, jr.n), true) : `<p class="vide">Aucun mouvement ne correspond. Essayez un autre mot, ou revenez sur « Tout ».</p>`}
  ${l.length > jr.n ? `<p style="margin-top:12px"><button class="btn" data-journal-plus>Afficher ${Math.min(60, l.length - jr.n)} mouvements de plus</button></p>` : ""}`;
}
function brancherJournal() {
  const boite = $("[data-journal]"); if (!boite) return;
  const plus = boite.querySelector("[data-journal-plus]"); if (plus) plus.onclick = () => { jr.n += 60; boite.innerHTML = corpsJournal(); brancherJournal(); };
}
const bJournal = () => `<h1>Journal</h1><p class="sous">Tout est gardé. Une erreur se corrige par un nouveau mouvement, jamais en effaçant.</p>
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
  return `<h1>Commandes</h1><p class="sous">Préparées seules à partir des seuils. Au-dessus de ${argent(SEUIL_VALIDATION_EUR)}, le gérant valide.</p>
  ${b.map(([fid, l]) => {
    const f = S.fournisseurs.find(x => x.id === fid);
    const tot = l.reduce((t, x) => t + x.qte * art(x.id).prix, 0);
    const attente = S.commandes.find(c => c.fid === fid && c.statut === "À valider");
    return `<section class="bon"><header><b>${esc(f.nom)}</b><span>Brouillon · délai ${f.delai} j</span></header>
      <table class="t"><tbody>${l.map(x => `<tr><td>${esc(art(x.id).nom)}${parLots(x.id, x.qte) ? `<br><small>${parLots(x.id, x.qte)}</small>` : ""}</td><td class="n">${x.qte}</td><td class="n">${argent(x.qte * art(x.id).prix)}</td></tr>`).join("")}</tbody></table>
      <p style="text-align:right;font-weight:800;font-size:20px">${argent(tot)} HT</p>
      ${attente ? `<p class="sous">En attente de l'accord du gérant.</p>` : tot > SEUIL_VALIDATION_EUR ? `<button class="btn" data-cmd="${fid}" data-statut="À valider">Demander l'accord du gérant</button>` : `<button class="btn plein" data-cmd="${fid}" data-statut="Envoyée">Envoyer au fournisseur</button>`}
    </section>`;
  }).join("") || `<p class="vide">Rien à commander.</p>`}
  <h2>Commandes passées</h2>
  ${S.commandes.length ? `<table class="t cmdes"><tbody>${S.commandes.slice().reverse().map(c => `<tr><td>${quand(c.date)}<br><small>${esc(c.fournisseur)}</small></td><td>${esc(c.statut)}</td><td class="n">${["Envoyée", "Reçue en partie"].includes(c.statut) ? `<button class="btn petit" data-recevoir="${c.id}">${c.statut === "Envoyée" ? "Réceptionner" : "Réceptionner le reste"}</button>` : ""}</td></tr>`).join("")}</tbody></table>` : `<p class="vide">Aucune pour l'instant.</p>`}`;
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
  const argent_ = [["rapport", I.argent, "Rapport du mois", "Valeur, pertes, refacturable, à imprimer ou garder en PDF"], ["refacturer", I.perte, "Manquants à refacturer", `Par ${motImp()}, avec les montants et les factures`]];
  const excel = [["csv", I.excel, "Journal des mouvements", cp ? "Excel : qui, quoi, quand, pour qui, avec la valeur" : "Excel : tous les gestes enregistrés"], ["finAnnee", I.excel, "Inventaire de fin d'année", cp ? "Excel en trois onglets : résumé, stock valorisé, pertes" : "Excel : stock valorisé et pertes de l'année"]]
    .concat(cp && (loueur || (S.clientsLoc || []).length) ? [["exportClients", I.excel, motClients() + " et " + motImps(), `Excel : coordonnées, cautions, casse par ${motImp()}`]] : []);
  const registre = suiviControles() ? [["controles", PICTO_CONTROLE, "Registre des contrôles", "Échéances, dernier contrôle et par qui, à imprimer"]] : [];
  const d = session.profil === "direction" ? argent_.concat(registre, excel) : papier.concat(registre, argent_.slice(1), excel);
  const acte = k => ["csv", "finAnnee", "exportClients"].includes(k);
  return `<h1>Documents</h1><p class="sous">Ce que vous pouvez imprimer, envoyer ou transmettre. Les fichiers Excel s'ouvrent aussi dans Google Sheets et LibreOffice.</p>
  <div class="docs">${d.map(([k, ic, t, s_]) => `<button class="doc-carte" ${acte(k) ? `data-act="${k}"` : `data-aller="${k}"`}><span class="pastille ${acte(k) ? "excel" : ""}">${ic}</span><span><b>${t}</b><small>${s_}</small></span></button>`).join("")}</div>`;
}
const retourDocs = `<p class="pas-imprimer"><button class="lien" data-aller="docs">← Documents</button> · <button class="lien" data-act="imprimer">Imprimer ou enregistrer en PDF</button></p>`;
const bEtiquettes = () => `${retourDocs}<div class="pas-imprimer"><h1>Planche d'étiquettes</h1><p class="sous">Scanné avec l'appareil photo, le QR ouvre directement la fiche de l'objet.</p></div>
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
function dEquipe() {
  if (!session.admin) return `<h1>Équipe et accès</h1><p class="vide">Seul l'administrateur du compte gère les accès.</p>`;
  return `<h1>Équipe et accès</h1><p class="sous">Chacun entre avec son identifiant et son mot de passe. Chaque mouvement porte son nom. Retirer un accès prend une seconde.</p>
  <div class="bloc">${S.equipe.map(u => `<div class="personne ${u.actif ? "" : "inactif"}">${avatar(u)}<div><b>${esc(u.nom)}${u.admin ? " · administratrice du compte" : ""}</b><small><span class="code">${esc(u.identifiant || "")}</span> · ${esc(u.poste)} · ${ROLES[u.role]}${u.actif ? "" : " · accès retiré"}</small></div>
    <div class="actions"><button class="btn petit" data-nouveau-code="${u.id}">Nouveau mot de passe</button>${u.id === session.uid ? "" : `<label class="inter"><input type="checkbox" data-acces="${u.id}" ${u.actif ? "checked" : ""} aria-label="Accès de ${esc(u.nom)}"><span></span></label>`}</div></div>`).join("")}</div>
  <p style="margin-top:12px"><button class="btn plein petit" data-act="ajouterPersonne">Ajouter une personne</button></p>
  <h2>Sécurité</h2>
  <div class="bloc"><div class="module"><label for="verrou"><b>Verrouillage automatique</b></label><select id="verrou" data-verrou>${[[1, "Après 1 minute"], [5, "Après 5 minutes"], [15, "Après 15 minutes"], [0, "Jamais"]].map(([v, n]) => `<option value="${v}" ${S.reglages.verrou === v ? "selected" : ""}>${n}</option>`).join("")}</select><p>Sans toucher l'écran, le téléphone redemande le mot de passe de la même personne.</p></div>
  <div class="module"><b>Mots de passe faux</b><span></span><p>Après 5 erreurs, il faut attendre 30 secondes. Chaque essai est noté ci-dessous.</p></div></div>
  <h2>Journal des connexions</h2>
  ${S.connexions.length ? `<div class="defile"><table class="t"><thead><tr><th>Quand</th><th>Qui</th><th>Quoi</th><th class="n">Résultat</th></tr></thead><tbody>${S.connexions.slice(0, 20).map(c => `<tr><td>${quand(c.date)}</td><td>${esc(c.nom)}</td><td>${esc(c.motif)}</td><td class="n"><span class="resultat ${c.ok ? "ok" : "ko"}">${c.ok ? "Réussie" : "Refusée"}</span></td></tr>`).join("")}</tbody></table></div>` : `<p class="vide">Aucune connexion enregistrée pour l'instant.</p>`}
  <h2>Ce qui protège les données en vrai</h2>
  <ul class="puces">
    <li>La liste de l'équipe n'est jamais affichée à l'entrée : il faut connaître son identifiant.</li>
    <li>Le mot de passe est vérifié par le serveur et n'est jamais gardé sur le téléphone. Bureau et direction peuvent aussi entrer avec leur compte Google ou Microsoft, avec la validation en deux étapes.</li>
    <li>Les droits sont appliqués par le serveur : une personne sans le droit « prix » ne reçoit même pas les prix.</li>
    <li>Le journal des mouvements ne s'efface pas. Une erreur se corrige par un nouveau mouvement.</li>
    <li>Un téléphone perdu se coupe à distance. Les données restent dans le compte de l'entreprise.</li>
  </ul>`;
}
const MDP_FAIBLES = ["123456", "1234567", "12345678", "azerty", "azertyuiop", "motdepasse", "password", "000000", "111111"];
function feuilleCode(uid) {
  const u = uid ? S.equipe.find(x => x.id === uid) : null;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tc"><h1 id="tc" style="font-size:26px">${u ? "Nouveau mot de passe pour " + esc(u.nom) : "Ajouter une personne"}</h1>
    ${u ? `<p class="sous">L'ancien ne marchera plus. Donnez le nouveau en main propre, jamais par message.</p>` : `
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
    if (u) { u.empreinte = empreinte(u.id, mdp); toast(`Nouveau mot de passe enregistré pour ${u.nom}.`); }
    else {
      const nom = champ("nom").value.trim(), id = "U-" + String(S.equipe.length + 1).padStart(2, "0"), role = champ("role").value;
      S.equipe.push({ id, nom, identifiant: ident, poste: champ("poste").value.trim() || PROFILS[role].nom, role, admin: false, actif: true, empreinte: empreinte(id, mdp) });
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
  const google = S.equipe.filter(u => u.actif).length * (unite === "xof" ? 4460 : 6.8);
  return `<h1>Votre installation</h1>
  <p class="sous">Offre ${OFFRE.nom}, payée une fois : ${fmt(OFFRE[unite])} HT, livrée le ${new Date(inst.livreLe).toLocaleDateString("fr-FR")}. L'appli et les données vous appartiennent. Rien n'est dû chaque mois à Stockclair.</p>
  <div class="bloc"><div class="module"><b>Assistance incluse</b><span class="statut ${enCours ? "s-revenue" : "s-partie"}">${enCours ? "en cours" : "terminée"}</span>
    <p>${enCours ? `Encore ${jours} jour${jours > 1 ? "s" : ""} et ${String(restantes).replace(".", ",")} h sur ${OFFRE.heures} h. ` : `Terminée le ${new Date(fin).toLocaleDateString("fr-FR")}. `}Elle couvre les corrections de notre paramétrage et les questions d'utilisation, pas les nouvelles fonctions.</p></div>
  <div class="module"><b>Intervention ensuite</b><span>${fmt(TARIF_INTERVENTION[unite])} HT / h</span><p>À distance, par quart d'heure, 30 minutes au minimum, toujours sur devis accepté.</p></div>
  <div class="module"><b>Payé chaque mois à Google, pas à Stockclair</b><span>${fmt(Math.round(google * 100) / 100)}</span><p>Licences Google des ${S.equipe.filter(u => u.actif).length} personnes de l'équipe (environ 6,80 € HT par personne).</p></div></div>
  <p style="margin-top:12px"><button class="btn plein" data-act="demanderIntervention">Demander une intervention</button></p>
  ${(S.interventions || []).length ? `<h2>Vos demandes</h2><table class="t"><tbody>${S.interventions.slice().reverse().map(i => `<tr><td>${quand(i.date)}<br><small>${esc(i.texte)}</small></td><td class="n">${i.incluse ? "dans l'assistance" : "devis envoyé"}</td></tr>`).join("")}</tbody></table>` : ""}
  <h2>Ce qui est installé</h2>
  <p class="sous">Réglé à l'installation, d'après votre devis. Pour ajouter un module, demandez un devis : il se paie une fois et reste à vous.</p>
  <div class="bloc">${Object.entries(CATALOGUE).map(([k, m]) => `<div class="module"><b>${m.nom}</b>${actif(k) ? `<span class="statut s-revenue">installé</span>` : `<button class="btn petit" data-devis="${k}">Demander un devis</button>`}<p>${m.detail}.${actif(k) ? "" : ` Environ ${fmt(m[unite])} HT, une fois.`}</p></div>`).join("")}</div>
  <h2>Réglages</h2>
  <div class="module"><b>Vos coordonnées sur les documents</b><button class="btn petit" data-act="coordonnees">Modifier</button><p>${S.entreprise && S.entreprise.nom ? esc(S.entreprise.nom) : "Nom, adresse, téléphone et logo en haut des bons et des factures."}</p></div>
  <div class="module"><label for="monnaie"><b>Monnaie des montants</b></label><select id="monnaie" data-monnaie><option value="EUR" ${S.monnaie === "EUR" ? "selected" : ""}>Euro</option><option value="XOF" ${S.monnaie === "XOF" ? "selected" : ""}>Franc CFA</option></select><p>Pour les prix, les pertes et les factures.</p></div>`;
}
// Un ajout de module est une nouvelle fonction : toujours sur devis, jamais dans l'assistance incluse.
function feuilleIntervention(module) {
  const inst = S.installation || { livreLe: Date.now(), heuresUtilisees: 0 };
  const incluse = !module && Date.now() < inst.livreLe + OFFRE.jours * 86400000 && inst.heuresUtilisees < OFFRE.heures;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="ti"><h1 id="ti" style="font-size:26px">${module ? "Demander un devis" : "Demander une intervention"}</h1>
    <p class="sous">${module ? "Nous vous envoyons un devis. Rien n'est ajouté ni facturé avant votre accord." : incluse ? "Votre assistance incluse est en cours : si la demande entre dedans, elle ne vous coûte rien." : "Votre assistance incluse est terminée : vous recevrez un devis avant tout travail."}</p>
    <label class="champ">Votre demande<textarea name="texte" rows="4" maxlength="400" style="border-radius:10px;border:2px solid var(--trait-fort);padding:10px;font:inherit;background:var(--carte);color:var(--encre)">${module ? esc("Ajout du module « " + CATALOGUE[module].nom + " ».") : ""}</textarea></label>
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
  f.querySelectorAll("[data-pas]").forEach(b => b.onclick = () => c.value = borne((+c.value || 0) + +b.dataset.pas));
  f.querySelectorAll("[data-plus]").forEach(b => b.onclick = () => c.value = borne((+c.value || 0) + +b.dataset.plus));
  return c;
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
const radios = (nom, liste, etiquette) => `<p class="choix-titre">${etiquette}</p><div class="choix" role="radiogroup" aria-label="${etiquette}">${liste.map((e, i) => `<label><input type="radio" name="${nom}" value="${esc(e)}" ${i === 0 ? "checked" : ""}>${esc(e)}</label>`).join("")}</div>`;

/* Comptage très loin de l'attendu : on demande confirmation avant d'enregistrer, une faute de frappe est vite arrivée.
   La règle : l'écart fait au moins 5 unités ET au moins la moitié de la quantité attendue. */
const grandEcart = (compte, attendu) => { const e = Math.abs(compte - attendu); return e >= 5 && e * 2 >= attendu; };
// lignes : [{ nom, compte, attendu }]. « oui » n'est appelé que si la personne confirme ; sinon elle retrouve sa saisie.
function confirmerEcart(lignes, oui) {
  const un = lignes.length === 1 ? lignes[0] : null;
  $$(".toast:not(.avec-bouton)").forEach(x => x.remove()); // un message encore affiché ne doit pas cacher les boutons
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tce">
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
  const titre = { "Sortie": "Combien en sortez-vous ?", "Surplus": "Combien en remettez-vous ?", "Prêt": "Combien partent ?", "Retour": "Combien reviennent ?", "Compter": "Combien en voyez-vous ?", "Perte": "Combien sont cassés ou perdus ?", "Entrée": "Combien entrent en stock ?" }[type];
  const defaut = type === "Compter" ? q : type === "Retour" ? d[0].qte : 1;
  const evs = ["Prêt", "Sortie", "Surplus"].includes(type) ? S.evenements : type === "Retour" ? d.map(x => x.evenement) : type === "Perte" ? ["Au dépôt"].concat(d.map(x => x.evenement)) : null;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tf">
    <div class="tete">${img(a)}<div><span class="code">${a.id}</span><br><b>${esc(a.nom)}</b></div></div>
    <h1 id="tf" style="font-size:26px">${titre}</h1>
    <div class="compteur"><button data-pas="-1" aria-label="Un de moins">−</button><input type="number" inputmode="numeric" min="0" value="${defaut}" aria-label="Quantité"><button data-pas="1" aria-label="Un de plus">+</button></div>
    ${a.type === "conso" && type !== "Compter" ? `<div class="rapides">${[10, 50, 100].map(n => `<button data-plus="${n}">+${n}</button>`).join("")}</div>` : ""}
    ${evs ? (["Prêt", "Sortie", "Surplus"].includes(type) ? choixEvenement(evs) : radios("ev", evs, V("imp"))) : ""}
    ${type === "Perte" ? radios("motif", ["Cassé", "Pas rendu", "Abîmé", "Volé"], "Motif") : ""}
    ${champLieu(a, type)}
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Valider</button></div></div>`);
  const max = ["Prêt", "Sortie"].includes(type) ? q : null;
  const champ = compteur(f, 0, max);
  brancherAutre(f); brancherLieuFeuille(f, id, type, champ);
  if (type === "Retour") f.querySelectorAll("input[name=ev]").forEach(r => r.onchange = () => { champ.value = d.find(x => x.evenement === r.value).qte; });
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
    ${choixEvenement(S.evenements)}
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Valider</button></div></div>`);
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
function ouvrir(id) { if (!art(id)) return toast(`Aucun objet ${id} ici.`); if (vue.nom === "preparation") return scanPreparation(id); aller("objet", id); }
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
  $$("[data-acces]").forEach(c => c.onchange = () => { const u = S.equipe.find(x => x.id === c.dataset.acces); u.actif = c.checked; sauver(); rendre(); toast(c.checked ? `${u.nom} peut de nouveau se connecter.` : `Accès retiré à ${u.nom}. Ses mouvements restent dans le journal.`); });
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
  $$("[data-cmd]").forEach(b => b.onclick = () => { creerCommande(b.dataset.cmd, b.dataset.statut); toast(b.dataset.statut === "Envoyée" ? "Bon de commande envoyé (simulation)." : "Demande envoyée au gérant."); rendre(); });
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
  $$("[data-journal-type]").forEach(b => b.onclick = () => { const k = b.dataset.journalType; jr.type = k; jr.n = 60; rendre(); refocus(`[data-journal-type="${k}"]`); });
  $$("[data-journal-q]").forEach(c => c.oninput = () => { jr.q = c.value; jr.n = 60; $("[data-journal]").innerHTML = corpsJournal(); brancherJournal(); });
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
  brancherMetiers();
  brancherOutils();
  brancherControles();
  brancherLieux();
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
  retour: () => { const p = pile.pop(); vue = p || { nom: "accueil" }; rendre(); window.scrollTo(0, 0); },
  sortir: garderMessage => { session = null; verrouille = false; clearTimeout(minuteur); if (garderMessage !== true) msgConnexion = ""; vue = { nom: "accueil" }; pile = []; $$(".feuille").forEach(f => f.remove()); rendre(); window.scrollTo(0, 0); },
  verrouiller: () => { verrouille = true; msgConnexion = ""; clearTimeout(minuteur); rendre(); },
  reglages: () => feuilleReglages(),
  ajouterPersonne: () => feuilleCode(null),
  installateur: () => { if (ESPACE) feuilleInstallateur(); },
  quitterInstallateur: () => { installateur = false; rendre(); },
  revenirConfig: () => { session = null; verrouille = false; clearTimeout(minuteur); installateur = true; vueE = { nom: "reglages", arg: null }; rendre(); window.scrollTo(0, 0); },
  plusE: () => feuillePlusE(),
  retourE: () => { vueE = pileE.pop() || { nom: "tableau", arg: null }; rendre(); window.scrollTo(0, 0); },
  nouveauClientP: () => feuilleClientP(null),
  voirDemoClient: () => { installateur = false; session = null; rendre(); window.scrollTo(0, 0); },
  configDefaut: () => { if (!confirm("Remettre les blocs, la barre et les droits de tous les rôles comme le prévoit le métier ?")) return; S.config = configParDefaut(S.metier); sauver(); rendre(); toast("Réglages du métier remis."); },
  reinit: () => { if (confirm("Effacer ce qui a été fait pendant la démo ?")) { S = construireDemo(S.metier || "loueur"); sauver(); session = null; verrouille = false; vue = { nom: "accueil" }; rendre(); toast("Démo remise à zéro."); } },
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
  // Une démo d'essai ouverte (essai.js) n'est pas remplacée ici : essai.js la met de côté avec ses gestes avant de changer de métier
  if (METIERS[q.get("metier")] && !S.monEssai && (S.variante || S.metier || "loueur") !== q.get("metier")) { const garder = { monnaie: S.monnaie }; S = construireDemo(q.get("metier")); Object.assign(S, garder); sauver(); }
  if (q.get("monnaie") === "XOF" || q.get("monnaie") === "EUR") { S.monnaie = q.get("monnaie"); sauver(); }
  // En démo, un lien direct ouvre la session de la première personne active du profil, sans mot de passe.
  // En production, ces liens n'existent pas : chacun se connecte avec son identifiant et son mot de passe.
  const u = PROFILS[q.get("profil")] && S.equipe.find(x => x.role === q.get("profil") && x.actif);
  if (u) { session = { uid: u.id, nom: u.nom, profil: u.role, admin: !!u.admin }; vue = { nom: q.get("vue") || "accueil", arg: q.get("arg") }; lienProfond(); activite(); }
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

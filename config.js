"use strict";
/* Une appli réglée pour chaque entreprise.
   Ce que chaque rôle voit (barre du bas, blocs de l'accueil, courbes d'analyse) et ce qu'il a le droit de faire
   se règle par l'installateur, à partir du devis signé. Le client ne coche rien lui-même : s'il veut plus, on refait un devis.
   Chargé avant app.js : les fonctions utilisent l'état et les outils d'app.js au moment où elles tournent. */

/* ---------------- Droits ---------------- */
const DROITS = {
  stock: "Voir le stock complet et le journal",
  prix: "Voir les prix et les montants",
  reserver: "Réservations et clients",
  commander: "Préparer et envoyer les commandes",
  valider: "Valider les commandes au-dessus du seuil",
  documents: "Documents, étiquettes et exports",
  analyses: "Analyses et courbes",
  equipe: "Gérer l'équipe et les accès (administrateur seulement)",
  installation: "Voir l'installation et demander une intervention",
};

/* ---------------- Sections de l'appli ----------------
   Les gestes du dépôt n'ont pas de droit : toute l'équipe peut scanner, sortir, rentrer, compter. */
const SECTIONS = {
  accueil:      { t: "Accueil", i: "maison", g: "" },
  depot:        { t: "Au dépôt", i: "scan", g: "depot", s: "Scanner, sortir, rentrer" },
  tournee:      { t: "Tournée", i: "camion", g: "depot", mod: "MO-RES", si: () => (S.metier || "loueur") === "loueur", s: "Livraisons et reprises" },
  preparer:     { t: "Préparer", i: "camion", g: "depot", mod: "MO-RES", s: "Les départs prévus" },
  recuperer:    { t: () => V("retourTitre") || "Retours", i: "retour", g: "depot", si: () => aDesPrets() },
  reception:    { t: "Réception", i: "camion", g: "depot", s: "Une livraison" },
  zones:        { t: "Compter", i: "compter", g: "depot", s: "Une zone" },
  kits:         { t: "Kits", i: "kit", g: "depot", mod: "MO-KIT", si: () => S.kits.length > 0 },
  chercher:     { t: "Chercher", i: "loupe", g: "depot" },
  jour:         { t: "Ma journée", i: "jour", g: "depot" },
  materiel:     { t: "Stock", i: "materiel", g: "gestion", droit: "stock" },
  reservations: { t: "Réservations", i: "jour", g: "gestion", mod: "MO-RES", droit: "reserver" },
  clients:      { t: () => motClients(), i: "equipe", g: "gestion", si: () => actif("MO-RES") || complet(), droit: "reserver" },
  commandes:    { t: "Commandes", i: "bon", g: "gestion", mod: "MO-CMD", droit: "commander" },
  journal:      { t: "Journal", i: "journal", g: "gestion", droit: "stock" },
  analyses:     { t: "Analyses", i: "releve", g: "gestion", droit: "analyses" },
  docs:         { t: "Documents", i: "docs", g: "gestion", droit: "documents" },
  equipe:       { t: "Équipe et accès", i: "equipe", g: "compte", droit: "equipe" },
  installation: { t: "Installation", i: "abo", g: "compte", droit: "installation" },
};
const GROUPES = { depot: "Au dépôt", gestion: "Gestion", compte: "Compte" };
const titreSection = k => { const s = SECTIONS[k]; return !s ? "" : typeof s.t === "function" ? s.t() : s.t; };

/* ---------------- Configuration par défaut, selon le métier ----------------
   Chaque bloc : [clé, taille]. Taille s = demi-ligne, m = moitié sur ordinateur, l = pleine largeur. */
function configParDefaut(m, taille) {
  m = m || "loueur"; taille = taille || "bureau";
  const loueur = m === "loueur", dlc = !!(METIERS[m] || {}).dlc;
  const courbesDirection = loueur
    ? [["g_utilisation", "m"], ["g_pertes8", "m"], ["g_top", "m"], ["g_valeur", "m"]]
    : [["g_imputations", "m"], ["g_valeur", "m"], ["g_top", "m"], ["g_pertes8", "m"]];
  const courbesBureau = loueur ? [["g_mvt14", "m"], ["g_depot", "m"]] : [["g_mvt14", "m"], ["g_imputations", "m"]];
  const c = {
    terrain: {
      barre: ["accueil", loueur ? "preparer" : "reception", "jour"],
      accueil: [["scan", "l"], ["taches", "l"], ["actions", "l"]],
      analyses: [],
      droits: {},
    },
    chauffeur: {
      barre: ["accueil", "tournee", "jour"],
      accueil: [["tournee", "l"], ["scan", "l"], ["taches", "l"]],
      analyses: [],
      droits: {},
    },
    bureau: {
      barre: ["accueil", "materiel", loueur ? "reservations" : "commandes"],
      accueil: [["aujourdhui", "l"], ["taches", "m"]].concat(loueur ? [["dispo", "m"]] : [], [["depot3d", "m"], ["cycle", "m"]], dlc ? [["peremption", "m"]] : [], [["atelier", "m"]], courbesBureau, [["alertes", "m"]]),
      analyses: courbesBureau.concat([["g_top", "m"], ["g_valeur", "m"]]),
      droits: { stock: 1, prix: 1, reserver: 1, commander: 1, documents: 1, analyses: 1 },
    },
    direction: {
      barre: ["accueil", "analyses", "docs"],
      accueil: [["pouls", "l"], ["partLoue", "s"], ["refac", "s"], ["decider", "m"], ["depot3d", "m"], ["trio", "l"]].concat(dlc ? [["peremption", "m"]] : [], courbesDirection.slice(0, 2), [["resume", "m"], ["assistance", "m"]]),
      analyses: [["trio", "l"]].concat(courbesDirection, loueur ? [["g_depot", "m"], ["g_mvt14", "m"]] : [["g_mvt14", "m"]]),
      droits: { stock: 1, prix: 1, reserver: 1, valider: 1, documents: 1, analyses: 1, equipe: 1, installation: 1 },
    },
  };
  // Une seule personne fait tout : un accueil court, les gestes du dépôt en premier, tous les droits.
  if (taille === "seul") c.direction = {
    barre: ["accueil", "depot", "materiel"],
    accueil: [["scan", "l"], ["taches", "l"], ["pouls", "l"]].concat(loueur ? [["dispo", "m"]] : [], [["actions", "l"], ["g_top", "m"]]),
    analyses: c.direction.analyses,
    droits: { stock: 1, prix: 1, reserver: 1, commander: 1, valider: 1, documents: 1, analyses: 1, equipe: 1, installation: 1 },
  };
  // Un patron et des magasiniers, sans bureau : le patron commande et réserve lui-même.
  if (taille === "petite") {
    c.direction.barre = ["accueil", "materiel", loueur ? "reservations" : "commandes"];
    c.direction.accueil = [["pouls", "l"], ["taches", "m"]].concat(loueur ? [["dispo", "m"]] : [], [["partLoue", "s"], ["refac", "s"], ["depot3d", "m"]], courbesDirection.slice(0, 1), [["resume", "m"]]);
    Object.assign(c.direction.droits, { commander: 1 });
  }
  return c;
}
const TAILLES_EQUIPE = {
  seul: { nom: "Seul", detail: "Le patron fait tout : un accueil court, le scan d'abord, tous les droits" },
  petite: { nom: "Petite équipe", detail: "Un patron et des magasiniers : le patron commande et réserve" },
  bureau: { nom: "Avec un bureau", detail: "Magasiniers, un responsable au bureau, une direction" },
};
// Les rôles présents : ceux de l'équipe active, plus ceux que la taille prévoit
const rolesUtiles = () => ["terrain", "chauffeur", "bureau", "direction"].filter(r => S.equipe.some(u => u.role === r) && !(S.taille === "seul" && r !== "direction") && !(S.taille === "petite" && r === "bureau"));
function config() {
  if (!S.config) S.config = configParDefaut(S.metier, S.taille);
  // Un rôle ajouté depuis (le chauffeur, par exemple) reçoit ses réglages par défaut.
  const d = configParDefaut(S.metier, S.taille); Object.keys(d).forEach(r => { if (!S.config[r]) S.config[r] = d[r]; });
  return S.config;
}
const cfg = role => config()[role || (session && session.profil) || "terrain"];
const droit = (d, role) => !!cfg(role).droits[d];
// Une section est ouverte si son module est installé, si elle a un sens ici, et si le rôle en a le droit.
function permis(k, role) {
  const s = SECTIONS[k]; if (!s) return true;
  if (s.mod && !actif(s.mod)) return false;
  if (s.si && !s.si()) return false;
  if (s.droit && !droit(s.droit, role)) return false;
  if (k === "equipe" && !role && session && !session.admin) return false;
  return true;
}

/* ---------------- Blocs de l'accueil et des analyses ---------------- */
const WIDGETS = {
  pouls:         { t: "Panneau de pilotage : valeur, tendance, quatre voyants", tailles: ["l"], nu: true, r: () => wPouls() },
  aujourdhui:    { t: "Aujourd'hui : départs, retours, livraisons, alertes", tailles: ["l"], nu: true, r: () => wAujourdhui() },
  depot3d:       { t: "Le dépôt en 3D, zone par zone", tailles: ["m", "l"], r: () => wDepot3d() },
  dispo:         { t: "Disponible le … ? (réponse en dix secondes)", tailles: ["m", "l"], si: () => actif("MO-RES"), r: () => wDispo() },
  resume:        { t: "Résumé du lundi par WhatsApp", tailles: ["s", "m"], si: () => droit("prix"), r: () => wResume() },
  tournee:       { t: "Tournée du jour (chauffeur)", tailles: ["m", "l"], si: () => permis("tournee"), r: () => wTournee() },
  scan:          { t: "Gros bouton Scanner", tailles: ["l"], nu: true, r: wScan },
  actions:       { t: "Gestes du dépôt", tailles: ["l"], nu: true, r: wActions },
  taches:        { t: "À faire", tailles: ["m", "l"], r: wTaches },
  valeur:        { t: "Valeur du stock", tailles: ["s", "m", "l"], cls: "accent", r: wValeur },
  partLoue:      { t: "Jauge : part louée, ou stock au bon niveau", tailles: ["s", "m"], r: wPartLoue },
  refac:         { t: "Jauge : part refacturée, ou part perdue", tailles: ["s", "m"], si: () => droit("prix"), r: wRefac },
  trio:          { t: "Sorties, pertes, refacturable, avec la période", tailles: ["m", "l"], si: () => droit("prix"), r: wTrio },
  decider:       { t: "À décider (commandes à valider)", tailles: ["m", "l"], si: () => droit("valider") && actif("MO-CMD"), r: wDecider },
  chiffres:      { t: "Quatre chiffres du stock", tailles: ["m", "l"], r: wChiffres },
  cycle:         { t: "Cycle du matériel", tailles: ["m", "l"], r: () => `<h3 class="w-titre">${aDesPrets() ? "Le cycle du matériel" : "Le mouvement du stock"}</h3>${cycle()}` },
  atelier:       { t: "À l'atelier (réparation, nettoyage)", tailles: ["m", "l"], r: () => blocAtelier() },
  peremption:    { t: "Dates limites proches", tailles: ["m", "l"], si: () => metier().dlc, r: () => blocPeremption() },
  alertes:       { t: "Alertes de stock", tailles: ["m", "l"], r: wAlertes },
  resas:         { t: "Réservations à venir", tailles: ["m", "l"], si: () => permis("reservations"), r: wResas },
  assistance:    { t: "Assistance restante", tailles: ["s", "m"], si: () => permis("installation"), r: wAssistance },
  g_mvt14:       { t: "Courbe : sorties et entrées par jour", tailles: ["m", "l"], nu: true, r: () => gMouvements14() },
  g_depot:       { t: "Graphique : au dépôt ou chez les clients", tailles: ["m", "l"], nu: true, si: () => aDesPrets(), r: () => gDepotClients() },
  g_utilisation: { t: "Courbe : part du parc louée", tailles: ["m", "l"], nu: true, si: () => aDesPrets() && droit("prix"), r: () => gUtilisation() },
  g_pertes8:     { t: "Graphique : pertes par semaine", tailles: ["m", "l"], nu: true, si: () => droit("prix"), r: () => gPertes8() },
  g_top:         { t: "Graphique : ce qui sort, ce qui dort", tailles: ["m", "l"], nu: true, r: () => gTopLoues() },
  g_imputations: { t: "Graphique : sorties par chantier, service ou lieu", tailles: ["m", "l"], nu: true, si: () => droit("prix"), r: () => gImputations() },
  g_valeur:      { t: "Courbe : valeur du stock", tailles: ["m", "l"], nu: true, si: () => droit("prix"), r: () => gValeurStock() },
};
const TAILLES = { s: "Petit", m: "Moyen", l: "Pleine largeur" };

function bento(liste, limite) {
  let blocs = (liste || []).map(([k, taille]) => {
    const w = WIDGETS[k]; if (!w || (w.si && !w.si())) return "";
    window.largeurDemi = taille !== "l" && window.innerWidth >= 1100;
    const h = w.r(); window.largeurDemi = false;
    return h ? `<section class="w w-${taille} ${w.nu ? "nu" : ""} ${w.cls || ""}">${h}</section>` : "";
  }).filter(Boolean);
  // Sur téléphone, l'accueil reste court : les blocs suivants s'ouvrent d'un geste.
  const cache = limite && blocs.length > limite + 1 ? blocs.length - limite : 0;
  if (cache) blocs = blocs.slice(0, limite).concat(`<button class="w w-l voir-plus" data-act="voirPlus">Voir les ${cache} autres blocs</button>`);
  return blocs.length ? `<div class="bento">${blocs.map((h, i) => h.replace(/^<(section|button) class="w /, `<$1 style="--i:${i}" class="w `)).join("")}</div>` : `<p class="vide">Rien à afficher ici pour l'instant.</p>`;
}

function wScan() {
  return `<button class="t-scan" data-act="camera">${I.scan}<b>Scanner</b><span>Visez l'étiquette de l'objet</span></button>
  <form class="t-ou" data-form="code"><label class="cache" for="code">Code de l'étiquette</label>
    <input id="code" name="code" placeholder="ou tapez le code" autocomplete="off"><button class="btn plein petit" type="submit">OK</button></form>`;
}
function wActions() {
  const n = aDesPrets() ? new Set(dehors().map(d => d.evenement)).size : 0;
  const attendues = S.commandes.filter(c => ["Envoyée", "Reçue en partie"].includes(c.statut)).length;
  return `${actif("MO-RES") ? tuilePreparer() : ""}
  <div class="t-tuiles">
    ${actif("MO-KIT") && S.kits.length ? `<button class="t-tuile" data-aller="kits"><span class="pastille">${I.kit}</span><div><b>Sortir un kit</b><small>Tout un ensemble d'un coup</small></div></button>` : ""}
    ${aDesPrets() ? `<button class="t-tuile" data-aller="recuperer"><span class="pastille">${I.retour}</span><div><b>${V("retourTitre")}</b><small>${n} ${V("retourSous")}</small></div></button>` : ""}
    <button class="t-tuile" data-aller="reception"><span class="pastille">${I.camion}</span><div><b>Réceptionner une livraison</b><small>${attendues} attendue${attendues > 1 ? "s" : ""}</small></div></button>
    <button class="t-tuile" data-aller="zones"><span class="pastille">${I.compter}</span><div><b>Compter une zone</b><small>Allée par allée</small></div></button>
    <button class="t-tuile" data-aller="chercher"><span class="pastille">${I.loupe}</span><div><b>Chercher un objet</b><small>Sans étiquette sous la main</small></div></button>
    <button class="t-tuile" data-aller="jour"><span class="pastille">${I.jour}</span><div><b>Ma journée</b><small>Ce que j'ai enregistré</small></div></button>
  </div>`;
}

/* À faire : la liste se construit seule, à partir des données et des droits de la personne. */
function taches() {
  const l = [], auj = aujourdHui(), dans3 = isoJour(Date.now() + 3 * JOUR_MS);
  if (actif("MO-RES")) S.reservations.filter(r => ["Confirmée", "Préparée"].includes(r.statut) && r.debut <= dans3).sort((a, b) => a.debut.localeCompare(b.debut)).forEach(r => {
    const tot = r.lignes.reduce((t, x) => t + x[1], 0), ch = r.lignes.reduce((t, x) => t + Math.min(x[1], r.charge[x[0]] || 0), 0);
    l.push({ c: "sortie", i: I.camion, t: "Préparer · " + r.nom, s: (r.debut <= auj ? "Départ aujourd'hui" : "Départ " + dateCourte(r.debut)) + ` · ${ch} / ${tot} chargés`, p: tot ? ch / tot : 0, a: `data-prep="${r.id}"` });
  });
  if (aDesPrets()) S.reservations.filter(r => r.statut === "Partie" && r.fin <= auj && dehors().some(d => d.evenement === r.nom)).forEach(r =>
    l.push({ c: "retour", i: I.retour, t: "Retour attendu · " + r.nom, s: "Fin prévue " + dateCourte(r.fin), a: `data-ev="${esc(r.nom)}"` }));
  S.commandes.filter(c => ["Envoyée", "Reçue en partie"].includes(c.statut)).forEach(c =>
    l.push({ c: "compter", i: I.camion, t: "Réceptionner · " + c.fournisseur, s: `${c.id} · ${c.lignes.reduce((t, x) => t + (x.qte - (x.recu || 0)), 0)} pièces attendues`, a: `data-recep="${c.id}"` }));
  if (droit("valider") && actif("MO-CMD")) S.commandes.filter(c => c.statut === "À valider").forEach(c =>
    l.push({ c: "marque", i: I.bon, t: "Valider · " + c.fournisseur, s: argent(c.total) + " HT", bouton: `<button class="btn petit plein" data-valider="${c.id}">Valider</button>` }));
  if (droit("commander") && actif("MO-CMD")) {
    const n = Object.values(brouillons()).reduce((t, x) => t + x.length, 0);
    if (n && !S.commandes.some(c => c.statut === "À valider")) l.push({ c: "attention", i: I.bon, t: "Commandes à préparer", s: `${n} objet${n > 1 ? "s" : ""} sous le seuil`, a: `data-aller="commandes"` });
  }
  if (complet() && droit("reserver")) evSansClient().slice(0, 2).forEach(ev => l.push({ c: "attention", i: I.equipe, t: "Indiquer le client · " + ev, s: "Pour des bons et des factures complets", a: `data-infos-ev="${esc(ev)}"` }));
  if (metier().dlc) { const b = bientotPerimes(2); if (b.length) l.push({ c: "alerte", i: I.perte, t: "À utiliser en premier", s: b.slice(0, 2).map(x => x.a.nom).join(", "), a: `data-objet="${b[0].a.id}"` }); }
  return l;
}
function wTaches() {
  const l = taches();
  return `<h3 class="w-titre">À faire ${l.length ? `<span class="compte">${l.length}</span>` : ""}</h3>
  ${l.length ? `<ul class="taches">${l.map(x => {
    const corps = `<span class="pastille">${x.i}</span><span><b>${esc(x.t)}</b><small>${esc(x.s)}</small>${x.p !== undefined ? `<i class="barre"><i style="width:${Math.round(x.p * 100)}%"></i></i>` : ""}</span>`;
    return `<li>${x.bouton ? `<div class="tache c-${x.c}">${corps}${x.bouton}</div>` : `<button class="tache c-${x.c}" ${x.a}>${corps}<span class="chev">${I.fleche}</span></button>`}</li>`;
  }).join("")}</ul>` : `<p class="vide" style="padding:4px 0">Rien en attente. Tout est à jour.</p>`}`;
}

/* Chiffres de la direction */
const J_MS = 86400000;
const valeurStock = () => S.articles.reduce((t, a) => t + Math.max(0, stock(a.id)) * a.prix, 0);
function wValeur() {
  const v = valeurStock(), pieces = S.articles.reduce((t, a) => t + Math.max(0, stock(a.id)), 0);
  const corps = `<small>${(S.metier || "loueur") === "loueur" ? "Valeur du matériel au dépôt" : "Valeur du stock"}</small><b class="w-grand">${droit("prix") ? argent(v) : pieces.toLocaleString("fr-FR") + " pièces"}</b><small>${S.articles.length} références${droit("prix") ? " · " + pieces.toLocaleString("fr-FR") + " pièces" : ""}</small>`;
  return permis("materiel") ? `<button class="w-plein" data-aller="materiel">${corps}</button>` : corps;
}
function wPartLoue() {
  if (aDesPrets()) {
    const valeur = valeurStock(), chez = dehors().reduce((t, d) => t + d.qte * art(d.article).prix, 0), part = Math.round(chez / ((chez + valeur) || 1) * 100);
    return `<div class="w-jauge">${anneau(chez, chez + valeur, "var(--compter)", part + " %", S.metier === "loueur" ? "du parc loué" : "du matériel prêté", true)}<p>${droit("prix") ? argent(chez) + " " : ""}${V("chez").toLowerCase()}</p></div>`;
  }
  const ok = S.articles.filter(x => etat(x).c === "").length;
  return `<div class="w-jauge">${anneau(ok, S.articles.length, "var(--retour)", Math.round(ok / S.articles.length * 100) + " %", "au bon niveau", true)}<p>${S.articles.length - ok} à commander</p></div>`;
}
function periodeSur(f) {
  const m = Date.now(), sur = (deb, fin) => S.mouvements.filter(x => x.date >= deb && x.date < fin && f(x)).reduce((t, x) => t + valeurM(x), 0);
  return [sur(m - periode * J_MS, m + 1), sur(m - 2 * periode * J_MS, m - periode * J_MS)];
}
function wRefac() {
  const p = S.mouvements.filter(m => m.type === "Perte" && m.date >= Date.now() - periode * J_MS);
  const vp = p.reduce((t, m) => t + valeurM(m), 0);
  if ((S.metier || "loueur") === "loueur") {
    const refac = p.filter(m => m.refac).reduce((t, m) => t + valeurM(m), 0), part = vp ? Math.round(refac / vp * 100) : 0;
    return `<div class="w-jauge">${anneau(refac, vp, "var(--neutre)", part + " %", "refacturé", true)}<p>des pertes sur ${periode} jours</p></div>`;
  }
  const [s] = periodeSur(m => m.type === "Prêt" || m.type === "Sortie"), taux = s + vp ? Math.round(vp / (s + vp) * 100) : 0;
  return `<div class="w-jauge">${anneau(vp, s + vp, "var(--alerte)", taux + " %", "perdu", true)}<p>${argent(vp)} sur ${periode} jours</p></div>`;
}
function wTrio() {
  const [s, sAvant] = periodeSur(m => m.type === "Prêt" || m.type === "Sortie");
  const [vp, pAvant] = periodeSur(m => m.type === "Perte");
  const [refac] = periodeSur(m => m.type === "Perte" && m.refac);
  const delta = (a, b, plusEstMieux) => {
    if (!b) return `<span class="delta">pas de période avant</span>`;
    const d = Math.round((a - b) / b * 100), mieux = plusEstMieux ? d >= 0 : d <= 0;
    return `<span class="delta ${d === 0 ? "" : mieux ? "mieux" : "pire"}">${d > 0 ? "+" : ""}${d} % vs avant</span>`;
  };
  return `<div class="w-entete"><h3 class="w-titre">Sur ${periode} jours</h3><div class="segments" role="group" aria-label="Période">${[7, 30, 90].map(n => `<button data-periode="${n}" aria-pressed="${periode === n}">${n} j</button>`).join("")}</div></div>
  <div class="trio">
    <div><small>${V("sortiesMot")}</small><b>${argent(s)}</b>${delta(s, sAvant, true)}</div>
    <div><small>Cassé ou perdu</small><b style="color:var(--alerte)">${argent(vp)}</b>${delta(vp, pAvant, false)}</div>
    ${(S.metier || "loueur") === "loueur" ? `<div><small>Refacturable</small><b>${argent(refac)}</b><span class="delta">${vp ? Math.round(refac / vp * 100) : 0} % des pertes</span></div>` : `<div><small>Taux de perte</small><b>${(s ? Math.round(vp / (s + vp) * 1000) / 10 : 0).toLocaleString("fr-FR")} %</b><span class="delta">de la valeur sortie</span></div>`}
  </div>`;
}
function wDecider() {
  const l = S.commandes.filter(c => c.statut === "À valider");
  return `<h3 class="w-titre">À décider ${l.length ? `<span class="compte">${l.length}</span>` : ""}</h3>
  ${l.length ? l.map(c => `<div class="bon"><header><b>${esc(c.fournisseur)}</b><span>${argent(c.total)} HT</span></header><p class="sous">${c.lignes.map(x => x.qte + " × " + esc(art(x.id).nom)).join(", ")}</p><button class="btn plein" data-valider="${c.id}">Valider la commande</button></div>`).join("") : `<p class="vide" style="padding:4px 0">Rien n'attend votre accord.</p>`}`;
}
function wChiffres() {
  const rupt = S.articles.filter(a => etat(a).c === "zero").length, bas = S.articles.filter(a => etat(a).c === "bas").length;
  const out = dehors().reduce((t, d) => t + d.qte, 0), pts = pertesN(30).reduce((t, m) => t + m.qte, 0);
  const lien = (vers, arg) => permis(vers) ? `data-aller="${vers}" ${arg ? `data-arg="${arg}"` : ""}` : "disabled";
  return `<div class="chiffres">
    <button ${lien("materiel", "alerte")}><b class="${rupt ? "rouge" : ""}">${rupt}</b><span>Plus aucun en stock</span></button>
    <button ${lien("materiel", "alerte")}><b>${bas}</b><span>Bientôt à commander</span></button>
    ${aDesPrets() ? `<button ${lien("materiel", "dehors")}><b>${out}</b><span>${V("chez")}</span></button>` : `<button ${lien("journal")}><b>${S.mouvements.filter(m => m.type === "Sortie" && m.date >= Date.now() - 7 * J_MS).reduce((t, m) => t + m.qte, 0)}</b><span>${V("sortiesMot")} en 7 jours</span></button>`}
    <button ${permis("docs") ? `data-aller="refacturer"` : "disabled"}><b class="${pts ? "rouge" : ""}">${pts}</b><span>${metier().dlc ? "Périmés, cassés ou perdus" : "Cassés ou perdus"}, 30 jours</span></button>
  </div>`;
}
function wAlertes() {
  return `<h3 class="w-titre">Alertes</h3>${S.alertes.length ? `<ul class="b-liste">${S.alertes.slice(0, 5).map(x => { const a = art(x.article); return `<li><button class="l" data-objet="${a.id}">${img(a)}<span><b>${esc(x.txt)}</b><small>${quand(x.date)}</small></span><span></span></button></li>`; }).join("")}</ul>` : `<p class="vide" style="padding:4px 0">Pas d'alerte depuis le début de la démo.</p>`}
  ${S.messages.length ? S.messages.slice(0, 2).map(m => `<div class="msg"><small>${m.canal} · ${quand(m.date)} · simulation</small>${esc(m.txt)}</div>`).join("") : ""}`;
}
function wResas() {
  const l = S.reservations.filter(r => r.fin >= aujourdHui() && r.statut !== "Revenue").sort((a, b) => a.debut.localeCompare(b.debut)).slice(0, 4);
  return `<h3 class="w-titre">Réservations à venir</h3>${l.length ? `<ul class="b-liste">${l.map(r => `<li><button class="l" data-resa="${r.id}">${pic(I.jour)}<span><b>${esc(r.nom)}</b><small>${dateCourte(r.debut)}</small></span><span class="statut s-${r.statut.toLowerCase().replace(/[^a-z]/g, "")}">${r.statut}</span></button></li>`).join("")}</ul>` : `<p class="vide">Aucune réservation à venir.</p>`}`;
}
function wAssistance() {
  const inst = S.installation || { livreLe: Date.now(), heuresUtilisees: 0 };
  const jours = Math.max(0, Math.ceil((inst.livreLe + OFFRE.jours * J_MS - Date.now()) / J_MS)), h = Math.max(0, OFFRE.heures - inst.heuresUtilisees);
  const enCours = jours > 0 && h > 0;
  return `<button class="w-plein" data-aller="installation"><small>Assistance incluse</small><b class="w-moyen">${enCours ? String(h).replace(".", ",") + " h restantes" : "Terminée"}</b><small>${enCours ? `encore ${jours} jours` : "interventions sur devis"}</small></button>`;
}

/* Page Analyses : les courbes choisies pour ce rôle et ce métier */
const vAnalyses = () => `<h1>Analyses</h1><p class="sous">Les courbes choisies pour votre activité. Touchez une barre ou un point pour lire la valeur.</p>${bento(cfg().analyses)}`;

/* =================================================================
   ESPACE INSTALLATEUR : ce que nous réglons chez chaque client
   ================================================================= */
let installateur = false, roleConf = "direction";
const NOMS_ROLES = () => { const n = { terrain: V("terrain") || "Terrain", chauffeur: "Chauffeur", bureau: V("bureau") || "Bureau", direction: S.taille === "seul" ? "Patron (seul)" : V("direction") || "Direction" }; return Object.fromEntries(rolesUtiles().map(r => [r, n[r]])); };
function editeurBlocs(role, cle) {
  const l = config()[role][cle];
  const reste = Object.keys(WIDGETS).filter(k => !l.some(([x]) => x === k));
  return `<div class="bloc">${l.map(([k, t], i) => `<div class="w-edit"><b>${esc(WIDGETS[k].t)}</b>
      <select data-w-taille="${cle}|${i}" aria-label="Taille">${WIDGETS[k].tailles.map(x => `<option value="${x}" ${x === t ? "selected" : ""}>${TAILLES[x]}</option>`).join("")}</select>
      <span class="fl"><button data-w-bouger="${cle}|${i}|-1" aria-label="Monter" ${i === 0 ? "disabled" : ""}>↑</button><button data-w-bouger="${cle}|${i}|1" aria-label="Descendre" ${i === l.length - 1 ? "disabled" : ""}>↓</button><button data-w-retirer="${cle}|${i}" aria-label="Retirer">✕</button></span></div>`).join("") || `<p class="vide">Aucun bloc.</p>`}
    ${reste.length ? `<div class="w-edit ajout"><select data-w-ajouter="${cle}" aria-label="Ajouter un bloc"><option value="">Ajouter un bloc…</option>${reste.map(k => `<option value="${k}">${esc(WIDGETS[k].t)}</option>`).join("")}</select></div>` : ""}</div>`;
}
function vInstallateur() {
  if (!rolesUtiles().includes(roleConf)) roleConf = rolesUtiles()[0];
  const c = config()[roleConf], noms = NOMS_ROLES();
  const choix = Object.keys(SECTIONS).filter(k => permis(k, roleConf));
  const u = S.equipe.find(x => x.role === roleConf && x.actif);
  const bouton = k => `<button disabled ${k === "accueil" ? 'aria-current="page"' : ""}>${I[SECTIONS[k].i]}<span>${esc(titreSection(k))}</span></button>`;
  return `${DEMO}<div class="inst">
  <div class="barre"><button class="btn petit" data-act="quitterInstallateur">← Quitter</button>${boutonReglages}</div>
  <h1>Réglage de l'installation</h1>
  <p class="sous">Ce que nous réglons chez chaque client, à partir du devis signé. Le client ne voit pas cet écran : s'il veut plus, on fait un nouveau devis et on l'ajoute ici.</p>
  <h2>Taille de l'équipe</h2>
  <p class="sous">Un modèle règle d'un coup les rôles, les blocs et les droits. On ajuste ensuite les détails plus bas.</p>
  <div class="tailles">${Object.entries(TAILLES_EQUIPE).map(([k, t]) => `<button data-taille="${k}" aria-pressed="${(S.taille || "bureau") === k}"><b>${t.nom}</b><small>${t.detail}</small></button>`).join("")}</div>
  <h2>Niveau de détail</h2>
  <p class="sous">Ce que les documents demandent et affichent. Le dépôt n'a jamais plus à remplir : c'est le bureau qui complète.</p>
  <div class="tailles">${Object.entries(NIVEAUX).map(([k, n]) => `<button data-niveau="${k}" aria-pressed="${(S.detail || "complet") === k}"><b>${n.nom}</b><small>${n.detail}</small></button>`).join("")}</div>
  <h2>L'entreprise</h2>
  <div class="bloc">
    <div class="module"><label for="metier"><b>Métier</b></label><select id="metier" data-metier>${Object.entries(METIERS).map(([k, m]) => `<option value="${k}" ${(S.metier || "loueur") === k ? "selected" : ""}>${m.nom}</option>`).join("")}</select><p>Mots, boutons du terrain, blocs et courbes proposés par défaut.</p></div>
    ${Object.entries(CATALOGUE).map(([k, m]) => `<div class="module"><b>${m.nom}</b><label class="inter"><input type="checkbox" data-module="${k}" ${actif(k) ? "checked" : ""} aria-label="${m.nom}"><span></span></label><p>${m.detail}. ${argent(m.eur)} HT, une fois.</p></div>`).join("")}
  </div>
  <h2>Le devis</h2>
  ${blocDevis()}
  <h2>Chaque rôle</h2>
  <div class="segments" role="group" aria-label="Rôle">${Object.entries(noms).map(([k, n]) => `<button data-role-conf="${k}" aria-pressed="${roleConf === k}">${esc(n)}</button>`).join("")}</div>
  <h3>Barre du bas</h3>
  <p class="sous">Trois raccourcis. Le bouton Scanner reste toujours au milieu, « Plus » ouvre tout le reste. Sur ordinateur, le menu est à gauche.</p>
  <div class="barre-choix">${[0, 1, 2].map(i => `<select data-barre="${i}" aria-label="Raccourci ${i + 1}">${choix.map(k => `<option value="${k}" ${c.barre[i] === k ? "selected" : ""}>${esc(titreSection(k))}</option>`).join("")}</select>`).join("")}</div>
  <nav class="barre-bas verre mini" aria-label="Aperçu de la barre">${c.barre.slice(0, 2).map(bouton).join("")}<span class="bb-scan">${I.scan}</span>${c.barre.slice(2, 3).map(bouton).join("")}<button disabled>${I.grille}<span>Plus</span></button></nav>
  <h3>Écran d'accueil</h3>
  <p class="sous">Les blocs dans l'ordre d'affichage. Un bloc sans objet chez ce client (pas de prêts, pas de dates limites) ne s'affiche pas.</p>
  ${editeurBlocs(roleConf, "accueil")}
  <h3>Analyses</h3>
  <p class="sous">Les courbes de la page Analyses, pour ce rôle.</p>
  ${editeurBlocs(roleConf, "analyses")}
  <h3>Droits</h3>
  <div class="bloc">${Object.entries(DROITS).map(([k, t]) => `<div class="module"><b>${esc(t)}</b><label class="inter"><input type="checkbox" data-droit="${k}" ${c.droits[k] ? "checked" : ""} aria-label="${esc(t)}"><span></span></label></div>`).join("")}
    <div class="module"><b>Scanner, sortir, rentrer, compter</b><span class="statut s-revenue">toujours</span><p>Toute l'équipe peut faire les gestes du dépôt.</p></div></div>
  <div class="valider" style="grid-template-columns:1fr">
    ${u ? `<button class="btn plein" data-apercu="${u.id}">Voir l'appli comme ${esc(u.nom)} (${esc(noms[roleConf])})</button>` : ""}
    <button class="btn" data-act="configDefaut">Revenir aux réglages du métier</button>
  </div></div>`;
}
function feuilleInstallateur() {
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tin"><h1 id="tin" style="font-size:26px">Espace installateur</h1>
    <p class="sous">Réservé à l'équipe qui installe l'appli. Code de démonstration : <span class="code">${CODE_INSTALLATEUR}</span></p>
    <label class="champ">Code<input name="code" type="password" inputmode="numeric" autocomplete="off"></label>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Entrer</button></div></div>`);
  const champ = f.querySelector("[name=code]"); champ.focus();
  const ok = () => { if (champ.value !== CODE_INSTALLATEUR) return toast("Code incorrect."); f.remove(); installateur = true; rendre(); window.scrollTo(0, 0); };
  champ.onkeydown = e => { if (e.key === "Enter") ok(); };
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = ok;
}
function brancherConfig() {
  const c = () => config()[roleConf];
  $$("[data-role-conf]").forEach(b => b.onclick = () => { roleConf = b.dataset.roleConf; rendre(); });
  $$("[data-barre]").forEach(s => s.onchange = () => { c().barre[+s.dataset.barre] = s.value; sauver(); rendre(); });
  $$("[data-w-taille]").forEach(s => s.onchange = () => { const [cle, i] = s.dataset.wTaille.split("|"); c()[cle][+i][1] = s.value; sauver(); rendre(); });
  $$("[data-w-bouger]").forEach(b => b.onclick = () => { const [cle, i, d] = b.dataset.wBouger.split("|"), l = c()[cle], j = +i + +d; [l[+i], l[j]] = [l[j], l[+i]]; sauver(); rendre(); });
  $$("[data-w-retirer]").forEach(b => b.onclick = () => { const [cle, i] = b.dataset.wRetirer.split("|"); c()[cle].splice(+i, 1); sauver(); rendre(); });
  $$("[data-w-ajouter]").forEach(s => s.onchange = () => { if (!s.value) return; c()[s.dataset.wAjouter].push([s.value, WIDGETS[s.value].tailles.includes("m") ? "m" : WIDGETS[s.value].tailles[0]]); sauver(); rendre(); });
  $$("[data-droit]").forEach(x => x.onchange = () => { c().droits[x.dataset.droit] = x.checked ? 1 : 0; sauver(); rendre(); });
  $$("[data-apercu]").forEach(b => b.onclick = () => ouvrirSession(S.equipe.find(u => u.id === b.dataset.apercu)));
}

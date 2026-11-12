"use strict";
/* Plusieurs établissements : un outil pour tous, mais chacun le sien (docs/28).
   Un établissement a son stock, son équipe, ses fournisseurs et son journal : c'est un état complet de l'appli (S), comme une entreprise seule.
   Un groupe réunit plusieurs établissements. La direction voit l'écran « Groupe », compare, entre dans un établissement et en ressort ;
   le dépôt et le responsable ne voient que le leur.
   - L'établissement ouvert reste dans S et s'enregistre comme d'habitude (rayon-demo-v12). Les autres attendent dans rayon-groupe-v1.
   - S.etab = { groupe, id } marque un état qui appartient à un groupe. Sans cette marque, rien de ce fichier ne s'affiche :
     ni écran, ni bandeau, ni bouton, ni tâche. C'est le cas des douze démos par métier.
   - Un envoi d'un établissement à un autre écrit « Envoi » dans le journal de celui qui envoie, puis « Entrée » dans le journal
     de celui qui reçoit, quand son équipe confirme l'arrivée.
   Chargé après lieux.js et controles.js, avant app.js. */

const CLE_GROUPE = "rayon-groupe-v1";

/* ---------------- Les trois démos de groupe ----------------
   regle : ce qui change avant de fabriquer l'historique (graine du hasard, rythme de consommation, niveaux de stock, objets absents).
   varie : ce qui s'ajoute ensuite, pour que la comparaison dise quelque chose (pertes, livraisons en trop, écarts d'inventaire, contrôles en retard). */
const GROUPES_DEMO = {
  restaurants: {
    nom: "Tables du Canal (démo)", metier: "restaurant", vignette: "chafing", patron: "Gérante du groupe",
    titre: "Trois restaurants, deux enseignes", detail: "Chaque restaurant a sa réserve et son équipe. La gérante compare les trois : pertes, livraisons, dates limites",
    mot: { s: "restaurant", p: "restaurants", ce: "ce restaurant", autre: "un autre restaurant", ouvert: "Restaurant ouvert", entre: "Entre restaurants", chaque: "Chaque restaurant", tous: "les trois restaurants", un: "un restaurant", affiche: "le restaurant affiché" },
    etabs: [
      { id: "E1", nom: "Le Comptoir · Lyon Part-Dieu (démo)", court: "Part-Dieu", enseigne: "Le Comptoir", ville: "Lyon", adresse: "Quartier de la Part-Dieu, Lyon",
        regle: { graine: 11 }, varie: { ecarts: 1 } },
      { id: "E2", nom: "Le Comptoir · Lyon Confluence (démo)", court: "Confluence", enseigne: "Le Comptoir", ville: "Lyon", adresse: "Quartier de la Confluence, Lyon",
        equipe: { "U-01": "Bilal", "U-02": "Chloé", "U-03": "Nadia" },
        regle: { graine: 29, conso: .8, niveau: .8, sans: ["ART-0013"] }, varie: { pertes: 14, forcePertes: 2, motif: "Périmé", ecarts: 4 } },
      { id: "E3", nom: "Bistrot du Canal · Bron (démo)", court: "Bron", enseigne: "Bistrot du Canal", ville: "Bron", adresse: "Centre-ville, Bron",
        equipe: { "U-01": "Mehdi", "U-02": "Sarah", "U-03": "Julien" },
        regle: { graine: 53, conso: .6, niveau: 1.3, sans: ["ART-0006", "ART-0013"] }, varie: { surstock: 2.2, ecarts: 2 } },
    ],
    transferts: [["E3", "E2", "ART-0002", 3, 6, true], ["E1", "E2", "ART-0007", 2, 1, false]],
  },
  proprete: {
    nom: "Clair Net Services (démo)", metier: "proprete", vignette: "autolaveuse", patron: "Gérant",
    titre: "Une entreprise de propreté, trois agences", detail: "Chaque agence a son dépôt, ses sites et ses machines. Le gérant compare : entretiens en retard, produits qui dorment, pertes",
    mot: { s: "agence", p: "agences", ce: "cette agence", autre: "une autre agence", ouvert: "Agence ouverte", entre: "Entre agences", chaque: "Chaque agence", tous: "les trois agences", un: "une agence", affiche: "l'agence affichée" },
    etabs: [
      { id: "E1", nom: "Clair Net · agence de Nantes (démo)", court: "Nantes", ville: "Nantes", adresse: "Zone d'activités, Nantes",
        regle: { graine: 11 }, varie: { ecarts: 1 } },
      { id: "E2", nom: "Clair Net · agence d'Angers (démo)", court: "Angers", ville: "Angers", adresse: "Zone d'activités, Angers",
        equipe: { "U-01": "Yanis", "U-02": "Manon", "U-03": "Sophie" },
        noms: { "Bureaux Canal Sud": "Bureaux Les Halles", "Clinique des Tilleuls": "École Jean-Moulin", "Résidence Le Parc": "Résidence du Lac" },
        regle: { graine: 37, conso: .7, niveau: .8 }, varie: { pertes: 9, forcePertes: 1.5, motif: "Abîmé", ctrlRetard: ["ART-0010", "ART-0014"], ecarts: 3 } },
      { id: "E3", nom: "Clair Net · agence de Saint-Nazaire (démo)", court: "St-Nazaire", ville: "Saint-Nazaire", adresse: "Zone portuaire, Saint-Nazaire",
        equipe: { "U-01": "Lucas", "U-02": "Aminata", "U-03": "Thomas" },
        noms: { "Bureaux Canal Sud": "Bureaux du Port", "Clinique des Tilleuls": "Cabinet médical du Port", "Résidence Le Parc": "Résidence Les Dunes" },
        regle: { graine: 61, conso: .5, niveau: 1.2, sans: ["ART-0013"] }, varie: { surstock: 2, ecarts: 1 } },
    ],
    transferts: [["E3", "E1", "ART-0005", 4, 5, true], ["E1", "E3", "ART-0013", 1, 1, false]],
  },
  loueur: {
    nom: "Location Fêtes (démo)", metier: "loueur", vignette: "chaise", patron: "Gérante",
    titre: "Un loueur, deux dépôts", detail: "Deux dépôts, deux équipes, le même matériel. La gérante voit ce qui est chez les clients, la casse et les retours en retard, dépôt par dépôt",
    mot: { s: "dépôt", p: "dépôts", ce: "ce dépôt", autre: "l'autre dépôt", ouvert: "Dépôt ouvert", entre: "Entre dépôts", chaque: "Chaque dépôt", tous: "les deux dépôts", un: "un dépôt", affiche: "le dépôt affiché" },
    etabs: [
      { id: "E1", nom: "Location Fêtes · dépôt de Toulouse (démo)", court: "Toulouse", ville: "Toulouse", adresse: "Zone d'activités, entrepôt 4, Toulouse",
        regle: { graine: 7 }, varie: { initial: { "ART-0001": 180, "ART-0002": 16, "ART-0010": 120, "ART-0011": 2, "ART-0012": 12, "ART-0013": 24, "ART-0014": 8 }, ecarts: 1 } },
      { id: "E2", nom: "Location Fêtes · dépôt de Montauban (démo)", court: "Montauban", ville: "Montauban", adresse: "Route de Toulouse, Montauban",
        equipe: { "U-01": "Hugo", "U-02": "Inès", "U-03": "Rachid", "U-05": "Kévin" },
        noms: { "Mariage · salle des fêtes": "Mariage · domaine des Chênes", "Séminaire · hôtel": "Congrès · salle des congrès", "Anniversaire · particulier": "Baptême · particulier", "Fête de quartier · association": "Kermesse · école",
          "Mariage · samedi": "Mariage · dimanche", "Séminaire d'entreprise": "Assemblée générale", "Gala de fin d'année": "Arbre de Noël" },
        regle: { graine: 23 }, varie: { pertes: 10, forcePertes: 1, motif: "Casse au chargement", ecarts: 3, retourRetard: true, enCours: .5, loues: ["ART-0008"] } },
    ],
    transferts: [["E1", "E2", "ART-0002", 6, 4, true], ["E1", "E2", "ART-0014", 4, 1, false]],
  },
};

/* ---------------- L'état du groupe ---------------- */
let G = null, groupeLu = false;
// Le groupe ouvert, ou null. Il n'existe que si l'état courant porte la marque d'un établissement de ce groupe.
function groupe() {
  if (typeof S === "undefined" || !S || !S.etab) return null;
  if (!groupeLu) { groupeLu = true; try { G = JSON.parse(localStorage.getItem(CLE_GROUPE)); } catch (e) { G = null; } }
  return G && G.cle === S.etab.groupe && G.actif === S.etab.id && G.etats ? G : null;
}
const groupeActif = () => !!groupe();
const voitGroupe = () => groupeActif() && !!session && session.profil === "direction";
const etabDe = id => (groupe() ? G.etabs : []).find(e => e.id === id) || null;
const nomEtab = id => { const e = etabDe(id); return e ? e.nom.replace(/ \(démo\)$/, "") : "Établissement retiré"; };
const courtEtab = id => (etabDe(id) || {}).court || "?";
function persisterGroupe() {
  if (!G) return;
  try { const etats = Object.assign({}, G.etats); etats[G.actif] = null; localStorage.setItem(CLE_GROUPE, JSON.stringify(Object.assign({}, G, { etats }))); }
  catch (e) { nonEnregistre = true; }
}
function oublierGroupe() { G = null; groupeLu = true; try { localStorage.removeItem(CLE_GROUPE); } catch (e) { /* stockage bloqué */ } }
// Faire un calcul ou une écriture dans un autre établissement que celui qui est ouvert, puis revenir.
function dansEtab(id, f) {
  const g = groupe(); if (!g || id === g.actif) return f();
  const ici = S; S = g.etats[id];
  try { return f(); } finally { g.etats[id] = S; S = ici; }
}
// Ouvrir un autre établissement : celui qu'on quitte est rangé, l'autre devient l'état courant.
function changerEtab(id) {
  const g = groupe(); if (!g || id === g.actif || !g.etats[id]) return false;
  g.etats[g.actif] = S; S = g.etats[id]; g.etats[id] = null; g.actif = id;
  persisterGroupe(); sauver();
  if (session) { const u = S.equipe.find(x => x.id === session.uid); if (u) session.nom = u.nom; }
  if (typeof garderPhotos === "function") garderPhotos();
  return true;
}
function entrerEtab(id) { changerEtab(id); aller("accueil", null, true); toast(`Vous êtes dans : ${nomEtab(id)}.`); }
// L'écran d'arrivée : la direction d'un groupe arrive sur « Groupe », tout le monde sinon sur son accueil.
const vueDepart = role => groupeActif() && role === "direction" ? "groupe" : "accueil";

/* ---------------- Construire une démo de groupe ---------------- */
function reglerEtab(st, r) {
  if (!r) return;
  if (r.graine) st.graine = r.graine;
  if (r.sans) { st.articles = st.articles.filter(a => !r.sans.includes(a.id)); st.kits = (st.kits || []).map(k => Object.assign({}, k, { lignes: k.lignes.filter(l => !r.sans.includes(l[0])) })).filter(k => k.lignes.length); }
  st.articles.forEach(a => {
    if (r.conso && a.jour) a.jour = Math.round(a.jour * r.conso * 100) / 100;
    if (r.niveau && a.type !== "equip") { a.cible = Math.max(1, Math.round(a.cible * r.niveau)); a.seuil = Math.min(a.cible - 1, Math.round(a.seuil * r.niveau)); if (a.lot > 1) a.cible = Math.max(a.lot, Math.round(a.cible / a.lot) * a.lot); }
  });
}
// Ce qui distingue un établissement des autres, une fois son historique fabriqué.
function varierEtab(st, e, g) {
  const J = 86400000, maintenant = Date.now(), v = e.varie || {}, minuit = new Date(maintenant).setHours(0, 0, 0, 0);
  const iso = t => { const d = new Date(t); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  let n = 0;
  const add = (t, profil, article, type, qte, extra) => { n += 1; st.mouvements.push(Object.assign({ id: "MV-G" + String(n).padStart(4, "0"), date: t, profil, qui: profil === "bureau" ? "Karim" : (n % 3 ? "Ousmane" : "Léa"), article, type, qte, evenement: "", motif: "", refac: false }, extra || {})); };
  const total = id => st.mouvements.reduce((t, m) => m.article === id ? t + (SIGNE[m.type] || 0) * m.qte : t, 0);
  const dansLieux = id => (st.lieux || []).length ? st.mouvements.reduce((t, m) => m.article === id && m.type === "Transfert" ? t + (m.vers ? m.qte : 0) - (m.de ? m.qte : 0) : m.article === id && m.lieu ? t + (SIGNE[m.type] || 0) * m.qte : t, 0) : 0;
  const auDepot = id => total(id) - dansLieux(id);
  // Ce qui se suit en quantité : les consommables, et chez le loueur tout ce qui n'a pas de numéro de série
  const suivis = st.articles.filter(a => a.type !== "equip" && (!a.logique || a.logique !== "pret")), pasChers = suivis.filter(a => a.prix <= 300);
  // Un dépôt plus grand : du matériel en plus dès l'inventaire de départ
  if (v.initial) { const debut = Math.min(...st.mouvements.map(m => m.date)); Object.entries(v.initial).forEach(([id, q]) => { if (st.articles.some(a => a.id === id)) add(debut + 60000, "bureau", id, "Inventaire initial", q); }); }
  // Un établissement qui commande trop : deux livraisons en plus de ce qu'il consomme
  if (v.surstock) {
    const parFou = {};
    suivis.filter(a => st.fournisseurs.some(f => f.id === a.fou)).forEach((a, i) => {
      const lot = a.lot > 1 ? a.lot : 1, q = Math.max(lot, Math.ceil(a.cible * v.surstock / lot) * lot), j = i % 2 ? 9 : 21, t = minuit - j * J + 8 * 3600000, f = st.fournisseurs.find(x => x.id === a.fou);
      add(t, "terrain", a.id, "Entrée", q, Object.assign({ motif: "Livraison " + f.nom }, a.dlcJours ? { dlc: iso(t + a.dlcJours * J) } : {}));
      (parFou[f.id + "|" + j] = parFou[f.id + "|" + j] || { f, t, lignes: [] }).lignes.push({ id: a.id, qte: q, recu: q });
    });
    Object.values(parFou).sort((x, y) => x.t - y.t).forEach(c => st.commandes.push({ id: "CMD-" + String(st.commandes.length + 1).padStart(4, "0"), date: c.t - 2 * J, fid: c.f.id, fournisseur: c.f.nom, lignes: c.lignes, total: c.lignes.reduce((t, l) => t + l.qte * st.articles.find(a => a.id === l.id).prix, 0), statut: "Reçue" }));
  }
  // Un établissement qui perd plus : des pertes en plus, étalées sur les quatre dernières semaines
  if (v.pertes) for (let i = 0; i < v.pertes; i++) {
    const a = pasChers[(i * 5 + 2) % pasChers.length], q = Math.max(1, Math.round(Math.max(1, a.jour || a.seuil * .05) * (v.forcePertes || 1)));
    if (auDepot(a.id) - q < 1) continue;
    add(minuit - (1 + (i * 2) % 27) * J + (14 + i % 4) * 3600000, "terrain", a.id, "Perte", q, { motif: v.motif || "Abîmé" });
  }
  // Des comptages qui trouvent moins que prévu
  for (let i = 0; i < (v.ecarts || 0); i++) {
    const a = suivis[(i * 2 + e.id.charCodeAt(1)) % suivis.length], q = Math.max(1, Math.round(a.seuil * .2));
    if (auDepot(a.id) - q < 1) continue;
    add(minuit - (3 + i * 5) * J + 16 * 3600000, "bureau", a.id, "Ajustement", -q, { motif: "Comptage" });
  }
  // Des contrôles qu'on a laissé passer
  (v.ctrlRetard || []).forEach((id, i) => {
    const a = st.articles.find(x => x.id === id); if (!a || !a.ctrlLe) return;
    const le = new Date(maintenant - (8 + i * 9) * J), fait = new Date(le); fait.setMonth(fait.getMonth() - (a.ctrlMois || 12));
    a.ctrlLe = iso(le); a.ctrlFait = iso(fait);
  });
  // Un dépôt plus petit : moins de matériel chez les clients en ce moment (les réservations parties suivent)
  if (v.enCours) {
    const parties = (st.reservations || []).filter(r => r.statut === "Partie"), noms = new Set(parties.map(r => r.nom)), k = q => Math.max(1, Math.round(q * v.enCours));
    st.mouvements.forEach(m => { if (m.type === "Prêt" && noms.has(m.evenement) && m.date > maintenant - 5 * J) m.qte = k(m.qte); });
    parties.forEach(r => r.lignes.forEach(l => { l[1] = k(l[1]); }));
  }
  // Un objet qui dort ailleurs et qui travaille ici : il est parti avec un événement passé, et il en est revenu
  (v.loues || []).forEach(id => {
    const ev = st.mouvements.find(m => m.type === "Prêt" && m.evenement && m.date > maintenant - 20 * J && m.date < maintenant - 9 * J);
    if (ev && st.articles.some(a => a.id === id)) { add(ev.date, "terrain", id, "Prêt", 1, { evenement: ev.evenement }); add(ev.date + 2 * J + 3600000, "terrain", id, "Retour", 1, { evenement: ev.evenement }); }
  });
  // Un retour que le client n'a pas rendu à la date prévue
  if (v.retourRetard) { const r = (st.reservations || []).find(x => x.statut === "Partie"); if (r) r.fin = iso(maintenant - J); }
  st.mouvements.sort((a, b) => a.date - b.date);
  // Les noms propres à l'établissement : sites, chantiers, événements
  if (e.noms) {
    const nom = x => e.noms[x] || x;
    st.evenements = st.evenements.map(nom);
    st.mouvements.forEach(m => { if (m.evenement) m.evenement = nom(m.evenement); if (m.imputation) m.imputation = nom(m.imputation); if (m.type === "Transfert" && m.motif) Object.keys(e.noms).forEach(k => { m.motif = m.motif.replace(k, e.noms[k]); }); });
    (st.reservations || []).forEach(r => { r.nom = nom(r.nom); });
    (st.lieux || []).forEach(l => { l.nom = nom(l.nom); });
    if (st.clientsEv) st.clientsEv = Object.fromEntries(Object.entries(st.clientsEv).map(([k, x]) => [nom(k), x]));
  }
  // L'équipe : chaque établissement a la sienne ; la direction est la même personne partout
  const prenoms = {};
  st.equipe.forEach(u => {
    const p = (e.equipe || {})[u.id];
    if (p) { prenoms[u.nom] = p; u.nom = p; u.identifiant = sansAccent(p).replace(/[^a-z0-9.-]/g, ""); }
    if (u.role === "direction") u.poste = g.patron;
  });
  st.mouvements.forEach(m => { if (prenoms[m.qui]) m.qui = prenoms[m.qui]; });
  st.articles.forEach(a => { if (prenoms[a.ctrlQui]) a.ctrlQui = prenoms[a.ctrlQui]; });
  st.entreprise = Object.assign({}, st.entreprise, { nom: e.nom, adresse: e.adresse || "" });
  st.etab = { groupe: g.cle, id: e.id };
  return st;
}
// Fabrique les établissements du groupe, ouvre le premier, et sème un envoi reçu et un envoi en route.
function ouvrirGroupe(cle) {
  const d = GROUPES_DEMO[cle]; if (!d) return false;
  const monnaie = S.monnaie, reglages = S.reglages, etats = {};
  d.etabs.forEach(e => { etats[e.id] = Object.assign(varierEtab(construireDemo(d.metier, st => reglerEtab(st, e.regle)), e, Object.assign({ cle }, d)), { monnaie, reglages: Object.assign({}, reglages) }); });
  const premier = d.etabs[0].id;
  G = { cle, nom: d.nom, metier: d.metier, mot: d.mot, actif: premier, etabs: d.etabs.map(e => ({ id: e.id, nom: e.nom, court: e.court, enseigne: e.enseigne || "", ville: e.ville || "" })), etats, transferts: [] };
  groupeLu = true; S = etats[premier]; etats[premier] = null;
  const J = 86400000;
  (d.transferts || []).forEach(([de, vers, article, qte, jours, recu]) => {
    const resp = id => dansEtab(id, () => { const u = S.equipe.find(x => x.role === "bureau") || S.equipe[0]; return { nom: u.nom, profil: u.role }; });
    const dispo = dansEtab(de, () => art(article) ? Math.max(0, stockIci(article)) : 0), n = Math.min(qte, dispo); if (n <= 0) return;
    const t = envoyerEtab(de, vers, article, n, resp(de), new Date(Date.now() - jours * J).setHours(10, 20, 0, 0));
    if (recu) recevoirEtab(t, resp(vers), t.date + 5 * 3600000 + 600000);
  });
  d.etabs.forEach(e => dansEtab(e.id, () => S.mouvements.sort((a, b) => a.date - b.date)));
  sauver(); persisterGroupe();
  return true;
}
function reinitGroupe() { const g = groupe(); if (!g) return; const id = g.actif; ouvrirGroupe(g.cle); changerEtab(id); }
// Adresse : ?groupe=restaurants|proprete|loueur ouvre un groupe (&etab=E2 ouvre directement un établissement) ;
// ?metier=… sans groupe revient à la démo simple du métier, même si c'est celui du groupe ouvert.
function adresseGroupe(q) {
  const k = q.get("groupe");
  if (GROUPES_DEMO[k] && !S.monEssai) {
    if (!(groupe() && G.cle === k)) ouvrirGroupe(k);
    if (q.get("etab")) changerEtab(q.get("etab"));
  } else if (S.etab && METIERS[q.get("metier")]) {
    const garder = { monnaie: S.monnaie }; S = construireDemo(q.get("metier")); Object.assign(S, garder); sauver(); oublierGroupe();
  } else if (!S.etab) { try { localStorage.removeItem(CLE_GROUPE); } catch (e) { /* stockage bloqué */ } }
}
const lienGroupe = k => location.href.split("#")[0].split("?")[0] + "?groupe=" + k;

/* ---------------- Envoyer d'un établissement à un autre ---------------- */
function pousserMv(m) { const id = prochainMv(); S.mouvements.push(Object.assign({ id, evenement: "", motif: "" }, m)); return id; }
// L'objet sort tout de suite du stock de celui qui envoie. qui = { nom, profil }.
function envoyerEtab(de, vers, article, qte, qui, date) {
  const t = { id: "TR-" + String(G.transferts.length + 1).padStart(4, "0"), date, de, vers, article, qte, statut: "En route", qui: qui.nom };
  dansEtab(de, () => {
    const a = art(article), fiche = Object.assign({}, a); delete fiche.chezEtab;
    t.nom = a.nom; t.fiche = fiche;
    const lots = metier().dlc ? prendreLots(lotsAuDepot(article), qte) : []; if (lots.length) t.lots = lots;
    t.mvDe = pousserMv({ date, profil: qui.profil, qui: qui.nom, article, type: "Envoi", qte, motif: "Vers " + nomEtab(vers), etab: vers, transfert: t.id });
    if (a.type === "equip") a.chezEtab = courtEtab(vers);
  });
  G.transferts.push(t);
  return t;
}
// L'objet entre dans le stock de celui qui reçoit, quand son équipe confirme. S'il ne le connaît pas, sa fiche est créée avec le même code.
function recevoirEtab(t, qui, date) {
  dansEtab(t.vers, () => {
    let a = art(t.article);
    if (!a) { a = Object.assign({}, t.fiche, { emp: (S.emplacements.find(x => x.id === t.fiche.emp) || S.emplacements[0] || {}).id || "", fou: (S.fournisseurs.find(x => x.id === t.fiche.fou) || S.fournisseurs[0] || {}).id || "" }); S.articles.push(a); t.cree = true; }
    delete a.chezEtab;
    const base = { profil: qui.profil, qui: qui.nom, article: t.article, type: "Entrée", motif: "Reçu de " + nomEtab(t.de), etab: t.de, transfert: t.id };
    let reste = t.qte;
    (t.lots || []).forEach((l, i) => { pousserMv(Object.assign({}, base, { date: date + i, qte: l.qte, dlc: l.dlc })); reste -= l.qte; });
    if (reste > 0) pousserMv(Object.assign({}, base, { date: date + (t.lots || []).length, qte: reste }));
  });
  Object.assign(t, { statut: "Reçu", recuLe: date, recuPar: qui.nom });
}
function annulerEnvoiEtab(t, qui) {
  dansEtab(t.de, () => {
    pousserMv({ date: Date.now(), profil: qui.profil, qui: qui.nom, article: t.article, type: "Envoi", qte: -t.qte, motif: "Annulation de " + t.mvDe, annule: t.mvDe, etab: t.vers, transfert: t.id });
    const a = art(t.article); if (a) delete a.chezEtab;
  });
  Object.assign(t, { statut: "Annulé", annuleLe: Date.now(), annulePar: qui.nom });
}
const moiGroupe = () => ({ nom: session.nom, profil: session.profil });
// Depuis l'objet scanné ou sa fiche : le responsable et la direction seulement, c'est leur accord qui fait partir l'objet.
function boutonEnvoiEtab(a, petit) {
  if (!groupeActif() || !session || session.profil === "terrain" || session.profil === "chauffeur") return "";
  return `<button class="btn${petit ? " petit" : ""}" data-etab-envoi="${a.id}">${petit ? "Envoyer" : "Envoyer à " + esc(G.mot.autre)}</button>`;
}
function feuilleEnvoiEtab(id) {
  const g = groupe(), a = art(id); if (!g || !a) return;
  const dispo = Math.max(0, stockIci(id)), unique = a.type === "equip";
  // Un objet unique ne part que là où aucun objet ne porte déjà son code : un code d'étiquette ne désigne qu'un objet dans tout le groupe.
  const libre = e => !unique || dansEtab(e.id, () => { const b = art(id); return !b || !!b.chezEtab; });
  const autres = g.etabs.filter(e => e.id !== g.actif && libre(e));
  if (dispo <= 0) return toast(unique ? "Cet objet n'est pas au dépôt : il ne peut pas partir." : "Il n'y en a plus au dépôt.");
  if (!autres.length) return toast("Un objet porte déjà ce code ailleurs dans le groupe. Dans l'appli livrée, chaque objet unique a son propre code.");
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tee">
    <div class="tete">${img(a)}<div><span class="code">${a.id}</span><br><b>${esc(a.nom)}</b></div></div>
    <h1 id="tee" style="font-size:26px">${unique ? "Envoyer cet objet à " + esc(g.mot.autre) : "Combien envoyez-vous ?"}</h1>
    ${unique ? `<input type="hidden" data-qte value="1">` : `<div class="compteur"><button data-pas="-1" aria-label="Un de moins">−</button><input type="number" inputmode="numeric" min="0" value="1" aria-label="Quantité"><button data-pas="1" aria-label="Un de plus">+</button></div>
    <div class="rapides">${[5, 10, 50].map(n => `<button data-plus="${n}">+${n}</button>`).join("")}</div>`}
    <p class="choix-titre">Pour qui</p><div class="choix" role="radiogroup" aria-label="Pour qui">${autres.map((e, i) => `<label><input type="radio" name="vers" value="${e.id}" ${i === 0 ? "checked" : ""}>${esc(nomEtab(e.id))}</label>`).join("")}</div>
    <p class="sous" style="margin:12px 0 0">Il sort de votre stock tout de suite. Il entre dans l'autre stock quand son équipe confirme l'arrivée. Les deux journaux gardent la trace.</p>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Envoyer</button></div></div>`);
  const champ = unique ? f.querySelector("[data-qte]") : compteur(f, 0, dispo);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const n = Math.floor(+champ.value), vers = (f.querySelector("input[name=vers]:checked") || {}).value;
    if (!(n > 0)) return toast("Indiquez une quantité.");
    if (n > dispo) return toast(`Il n'y en a que ${dispo} au dépôt.`);
    if (!vers) return toast("Indiquez pour qui.");
    envoyerEtab(g.actif, vers, id, n, moiGroupe(), Date.now()); verifierSeuil(id); sauver(); persisterGroupe();
    f.remove(); rendre(); toast(`${n} × ${a.nom} : en route vers ${nomEtab(vers)}.`);
  };
}
const statutTransfert = t => t.statut === "Reçu" ? `<span class="statut s-revenue">Reçu</span>` : t.statut === "Annulé" ? `<span class="statut">Annulé</span>` : `<span class="statut s-partie">En route</span>`;
function feuilleTransfertEtab(tid) {
  const g = groupe(), t = g && g.transferts.find(x => x.id === tid); if (!t) return;
  const patron = session.profil === "direction", enRoute = t.statut === "En route";
  const peutRecevoir = enRoute && (g.actif === t.vers || patron), peutAnnuler = enRoute && (patron || (g.actif === t.de && session.profil === "bureau"));
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tte">
    <h1 id="tte" style="font-size:26px">${t.qte} × ${esc(t.nom)}</h1>
    <ul class="ecarts">
      <li><b>${esc(nomEtab(t.de))} → ${esc(nomEtab(t.vers))}</b><span>Envoyé par ${esc(t.qui)} · ${quand(t.date)}</span></li>
      <li><b>${t.statut === "Reçu" ? "Reçu" : t.statut === "Annulé" ? "Envoi annulé" : "En route"}</b><span>${t.statut === "Reçu" ? `Confirmé par ${esc(t.recuPar)} · ${quand(t.recuLe)}` : t.statut === "Annulé" ? `Par ${esc(t.annulePar)} · ${quand(t.annuleLe)}. La quantité est revenue dans le stock de départ.` : `Sorti du stock de départ, pas encore entré dans le stock d'arrivée.`}</span></li>
      ${t.lots ? `<li><b>Dates limites</b><span>${t.lots.map(l => `${l.qte} au ${dateFr(l.dlc)}`).join(", ")}</span></li>` : ""}
    </ul>
    <div class="valider pile">${peutRecevoir ? `<button class="btn plein" data-ok>${g.actif === t.vers ? "C'est arrivé" : "Marquer reçu · " + esc(courtEtab(t.vers))}</button>` : ""}${peutAnnuler ? `<button class="btn rouge" data-annuler>Annuler l'envoi</button>` : ""}<button class="btn" data-x>Fermer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  const ok = f.querySelector("[data-ok]"); if (ok) ok.onclick = () => { recevoirEtab(t, moiGroupe(), Date.now()); sauver(); persisterGroupe(); f.remove(); rendre(); toast(`${t.qte} × ${t.nom} : entré dans le stock (${courtEtab(t.vers)}).`); };
  const an = f.querySelector("[data-annuler]"); if (an) an.onclick = () => { annulerEnvoiEtab(t, moiGroupe()); sauver(); persisterGroupe(); f.remove(); rendre(); toast("Envoi annulé. Les journaux gardent les lignes."); };
}
// Dans « À faire » : ce qui arrive d'un autre établissement, pour toute l'équipe ; ce qui est parti et pas encore reçu, pour qui voit le stock.
function tachesGroupe() {
  const g = groupe(); if (!g) return [];
  const l = g.transferts.filter(t => t.statut === "En route");
  return l.filter(t => t.vers === g.actif).map(t => ({ c: "retour", i: I.camion, t: `À recevoir · ${t.qte} × ${t.nom}`, s: `Envoyé par ${nomEtab(t.de)} · ${quand(t.date)}`, a: `data-etab-tr="${t.id}"` }))
    .concat(droit("stock") ? l.filter(t => t.de === g.actif).map(t => ({ c: "sortie", i: I.camion, t: `En route · ${t.qte} × ${t.nom}`, s: `Vers ${nomEtab(t.vers)} · pas encore reçu`, a: `data-etab-tr="${t.id}"` })) : []);
}
const tachesSansGroupe = taches;
taches = function () { return tachesGroupe().concat(tachesSansGroupe()); };

/* ---------------- Les chiffres d'un établissement ---------------- */
// Calculés dans l'état de l'établissement (dansEtab), avec les mêmes fonctions que ses propres écrans.
function chiffresEtab() {
  const t0 = Date.now() - periode * J_MS, j30 = Date.now() - 30 * J_MS;
  const som = f => S.mouvements.reduce((t, m) => m.date >= t0 && f(m) ? t + valeurM(m) : t, 0);
  const sorties = som(m => m.type === "Prêt" || m.type === "Sortie"), pertes = som(m => m.type === "Perte");
  const bouge = new Set(S.mouvements.filter(m => m.date >= j30 && (m.type === "Prêt" || m.type === "Sortie") && m.qte > 0).map(m => m.article));
  const dort = S.articles.filter(a => !bouge.has(a.id) && stock(a.id) > 0);
  const ctrl = suiviControles() ? S.articles.filter(a => (etatControle(a) || {}).c === "retard").length : 0;
  const aCtrl = suiviControles(), aDlc = !!metier().dlc;
  const dlc = aDlc ? new Set(bientotPerimes(0).filter(x => x.dlc < aujourdHui()).map(x => x.a.id)).size : 0;
  const retours = !aCtrl && !aDlc && aDesPrets() ? S.reservations.filter(r => r.statut === "Partie" && r.fin < aujourdHui() && dehors().some(d => d.evenement === r.nom)).length : 0;
  return {
    valeur: valeurStock(), aCommander: S.articles.filter(a => ["zero", "bas"].includes(etat(a).c)).length,
    dehors: aDesPrets() ? dehors().reduce((t, d) => t + d.qte, 0) : 0, sorties, pertes, taux: sorties + pertes ? pertes / (sorties + pertes) : 0,
    dort: dort.reduce((t, a) => t + stock(a.id) * a.prix, 0), dortN: dort.length,
    recu: som(m => m.type === "Entrée" && /^Livraison/.test(m.motif || "")),
    ecarts: S.mouvements.reduce((t, m) => m.date >= t0 && m.type === "Ajustement" ? t + Math.abs(valeurM(m)) : t, 0),
    retard: ctrl + dlc + retours, aValider: S.commandes.filter(c => c.statut === "À valider").length,
    mots: { chez: V("chez") || "Dehors", sorties: V("sortiesMot"), retard: aCtrl && aDlc ? "Contrôles et dates limites en retard" : aCtrl ? "Contrôles en retard" : aDlc ? "Dates limites dépassées" : "Retours en retard" },
  };
}
let triGroupe = { k: "", sens: -1 };
const pourcent = x => (Math.round(x * 1000) / 10).toLocaleString("fr-FR") + " %";
// Les lignes de la comparaison. mauvais : la valeur la plus haute est signalée.
function lignesComparaison(c0) {
  return [
    { k: "valeur", t: "Valeur du stock", f: argentCourt },
    { k: "sorties", t: `${c0.mots.sorties} en ${periode} j`, f: argentCourt },
    { k: "pertes", t: `Cassé ou perdu en ${periode} j`, f: argentCourt, mauvais: true },
    { k: "taux", t: "Part perdue de ce qui sort", f: pourcent, mauvais: true },
    { k: "dort", t: "Stock qui dort depuis 30 j", f: argentCourt, mauvais: true },
    { k: "recu", t: `Reçu des fournisseurs en ${periode} j`, f: argentCourt },
    { k: "ecarts", t: `Écarts d'inventaire en ${periode} j`, f: argentCourt, mauvais: true },
    { k: "aCommander", t: "Références à commander", f: n => n.toLocaleString("fr-FR"), mauvais: true },
    { k: "dehors", t: c0.mots.chez, f: n => n.toLocaleString("fr-FR") },
    { k: "retard", t: c0.mots.retard, f: n => n.toLocaleString("fr-FR"), mauvais: true },
    { k: "aValider", t: "Commandes à valider", f: n => n.toLocaleString("fr-FR") },
  ];
}
// Ce qui ressort d'un établissement quand on le compare aux autres : deux phrases au plus.
function remarquesEtab(e, tous) {
  const max = k => Math.max(...tous.map(x => x.c[k])), autres = k => tous.filter(x => x !== e).map(x => x.c[k]), seul = (k, marge) => e.c[k] > 0 && e.c[k] === max(k) && autres(k).every(v => v * (marge || 1.25) < e.c[k]);
  const r = [];
  if (seul("taux") && e.c.taux >= .01) r.push(["alerte", `Perd le plus : ${pourcent(e.c.taux)} de ce qui sort`]);
  if (seul("retard", 1)) r.push(["alerte", `Le plus de retards : ${e.c.retard}`]);
  if (e.c.recu > 0 && e.c.sorties > 0 && e.c.recu > e.c.sorties * 1.1 && seul("recu", 1)) r.push(["attention", `Reçoit plus qu'il ne sort : ${argentCourt(e.c.recu)} reçus, ${argentCourt(e.c.sorties)} sortis`]);
  else if (seul("dort") && e.c.dort > 0) r.push(["attention", `Le plus de stock qui dort : ${argentCourt(e.c.dort)}`]);
  if (seul("ecarts")) r.push(["attention", `Les plus gros écarts d'inventaire : ${argentCourt(e.c.ecarts)}`]);
  return r.slice(0, 2);
}

/* ---------------- Courbes comparées ---------------- */
// Un établissement garde sa couleur et son trait d'un graphique à l'autre. Ce ne sont pas des couleurs d'action : encre, bleu, gris.
const traitEtab = i => ({ c: [C.encre, C.bleu, C.neutre][i % 3], tiret: i >= 3 ? "6 4" : "" });
const legendeEtabs = l => `<div class="legende">${l.map(e => `<span><i style="background:${traitEtab(e.i).c}"></i>${esc(e.court)}</span>`).join("")}</div>`;
function courbesComparees(l, titre, question, series, fmt, nomAxe) {
  const n = series[0].length, W = LARGE(), H = 200, g = 64, base = 170, haut = 150, max = Math.max(1, ...series.flat().map(p => p.v)) * 1.08;
  const x = i => g + (i / (n - 1)) * (W - g - 10), y = v => base - (v / max) * haut;
  let svg = `<line x1="${g}" x2="${W}" y1="${base}" y2="${base}" stroke="${C.encre}"/>`;
  [.5, 1].forEach(f => { const v = max * f; svg += `<line x1="${g}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="${C.trait}"/><text x="${g - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; });
  series.forEach((pts, k) => { const t = traitEtab(l[k].i);
    svg += `<polyline points="${pts.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ")}" fill="none" stroke="${t.c}" stroke-width="2.5" stroke-linejoin="round"${t.tiret ? ` stroke-dasharray="${t.tiret}"` : ""}/><circle cx="${x(n - 1)}" cy="${y(pts[n - 1].v)}" r="4" fill="${t.c}" stroke="${C.carte}" stroke-width="2"/>`; });
  const pas = (W - g - 10) / (n - 1);
  series[0].forEach((p, i) => { svg += `<rect x="${x(i) - pas / 2}" y="${base - haut}" width="${pas}" height="${haut}" fill="transparent" data-tip="${esc(p.nom + " : " + l.map((e, k) => `${e.court} ${fmt(series[k][i].v)}`).join(" · "))}"/>`; });
  [0, Math.floor((n - 1) / 2), n - 1].forEach(i => { svg += `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}">${new Date(series[0][i].t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</text>`; });
  return cadre(titre, question, legendeEtabs(l) + `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(nomAxe)}">${svg}</svg>`);
}
// Huit semaines, la dernière se termine aujourd'hui
function parSemaine(f) {
  const s0 = debutJour(Date.now()) - 55 * JOUR, sem = [...Array(8)].map((_, i) => ({ t: s0 + i * 7 * JOUR, v: 0, nom: "Semaine du " + new Date(s0 + i * 7 * JOUR).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) }));
  S.mouvements.forEach(m => { const i = Math.floor((m.date - s0) / (7 * JOUR)); if (i >= 0 && i <= 7 && f(m)) sem[i].v += valeurM(m); });
  return sem;
}
function gGroupeValeur(l) {
  const series = l.map(e => dansEtab(e.id, () => serieValeurStock(56, true).map(p => ({ t: p.t, v: p.v, nom: jourCourt(p.t) }))));
  return courbesComparees(l, "Valeur du stock, 8 semaines", `Combien d'argent dort dans chaque ${esc(G.mot.s)}, et dans quel sens il va.`, series, argentCourt, "Valeur du stock par établissement sur 8 semaines");
}
function gGroupeSorties(l) {
  // Chez un loueur, ce qui sort est ce qui part en location. Ailleurs, c'est ce qui est consommé : le matériel prêté revient, il n'est pas compté ici.
  const loc = (G.metier || "loueur") === "loueur", series = l.map(e => dansEtab(e.id, () => parSemaine(m => m.type === (loc ? "Prêt" : "Sortie"))));
  return courbesComparees(l, `${l[0].c.mots.sorties}, par semaine`, loc ? "Valeur du matériel parti chez les clients, semaine par semaine. Qui travaille le plus, qui ralentit ?" : "Valeur de ce qui est consommé, semaine par semaine, sans le matériel prêté. Qui travaille le plus, qui ralentit ?", series, argentCourt, "Valeur sortie par établissement et par semaine");
}
function gGroupePertes(l) {
  const series = l.map(e => dansEtab(e.id, () => parSemaine(m => m.type === "Perte")));
  const W = LARGE(), H = 220, base = 190, haut = 160, g = 64, pas = (W - g) / 8, max = Math.max(1, ...series.flat().map(p => p.v)), bw = Math.max(4, (pas - (W < 500 ? 6 : 14)) / l.length - 1);
  let svg = `<line x1="${g}" x2="${W}" y1="${base}" y2="${base}" stroke="${C.encre}"/>`;
  [.5, 1].forEach(k => { const y = base - haut * k; svg += `<line x1="${g}" x2="${W}" y1="${y}" y2="${y}" stroke="${C.trait}"/><text x="${g - 6}" y="${y + 4}" text-anchor="end">${argentCourt(max * k)}</text>`; });
  series[0].forEach((s, i) => {
    const x0 = g + i * pas + (pas - (bw + 1) * l.length) / 2, tip = s.nom + " : " + l.map((e, k) => `${e.court} ${argent(Math.round(series[k][i].v))}`).join(" · ");
    l.forEach((e, k) => { const h = (series[k][i].v / max) * haut; svg += barre(x0 + k * (bw + 1), base - h, bw, h, traitEtab(e.i).c, "haut", tip); });
    svg += `<rect x="${g + i * pas}" y="${base - haut}" width="${pas}" height="${haut}" fill="transparent" data-tip="${esc(tip)}"/>`;
    if (W >= 500 || i % 2 === 0) svg += `<text x="${g + i * pas + pas / 2}" y="${H - 8}" text-anchor="middle">${new Date(s.t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</text>`;
  });
  return cadre("Pertes et casse, par semaine", `Ce que coûte la casse, le périmé et le perdu dans chaque ${esc(G.mot.s)}. Une barre qui dépasse les autres plusieurs semaines de suite mérite une visite.`,
    legendeEtabs(l) + `<svg viewBox="0 0 ${W} ${H + 8}" role="img" aria-label="Pertes par établissement et par semaine">${svg}</svg>`);
}

/* ---------------- L'écran « Groupe » ---------------- */
function vGroupe() {
  const g = groupe();
  if (!g || !voitGroupe()) return `<h1>Pas d'accès</h1><p class="sous">Cet écran est celui de la direction du groupe. Demandez à votre responsable.</p>`;
  const l = g.etabs.map((e, i) => Object.assign({ i }, e, { c: dansEtab(e.id, chiffresEtab) }));
  const lignes = lignesComparaison(l[0].c).filter(x => !["recu", "aValider", "dehors"].includes(x.k) || l.some(e => e.c[x.k] > 0));
  const ordre = triGroupe.k ? l.slice().sort((a, b) => (a.c[triGroupe.k] - b.c[triGroupe.k]) * triGroupe.sens || a.i - b.i) : l;
  const enseignes = new Set(g.etabs.map(e => e.enseigne).filter(Boolean)).size;
  const tot = k => l.reduce((t, e) => t + e.c[k], 0);
  const total = (coul, n, txt, sous) => `<div class="voyant" style="--c:${coul}"><span class="voyant-n">${n}</span><b>${txt}</b><small>${sous}</small></div>`;
  // Le chiffre le plus élevé n'est signalé que s'il se détache : seul en tête, avec au moins 15 % d'avance sur le suivant
  const pire = x => { const v = l.map(e => e.c[x.k]).sort((a, b) => b - a), m = v[0]; return x.mauvais && m > 0 && m - v[1] >= m * .15 ? m : null; };
  const carte = e => {
    const r = remarquesEtab(e, l), v = (t, val, cl) => `<div${cl ? ` class="${cl}"` : ""}><dt>${t}</dt><dd>${val}</dd></div>`;
    return `<article class="etab-carte${e.id === g.actif ? " ouvert" : ""}">
      <header><div><h3>${esc(nomEtab(e.id))}</h3><small>${[e.enseigne ? "Enseigne " + esc(e.enseigne) : "", esc(e.ville)].filter(Boolean).join(" · ")}</small></div>${e.id === g.actif ? `<span class="statut">ouvert</span>` : ""}</header>
      <dl class="etab-voyants">${v("Valeur du stock", argent(Math.round(e.c.valeur)), "large")}${v("À commander", e.c.aCommander, e.c.aCommander ? "attention" : "")}${v(esc(e.c.mots.chez), e.c.dehors)}${v(`Pertes en ${periode} j`, argent(Math.round(e.c.pertes)), e.c.pertes ? "alerte" : "")}${v(esc(e.c.mots.retard), e.c.retard, e.c.retard ? "alerte" : "")}</dl>
      ${r.length ? `<ul class="etab-remarques">${r.map(([c, t]) => `<li class="${c}"><i></i>${esc(t)}</li>`).join("")}</ul>` : `<p class="etab-rien">Rien ne ressort par rapport aux autres.</p>`}
      <button class="btn plein" data-etab-entrer="${e.id}">Entrer dans ${esc(g.mot.ce)}</button></article>`;
  };
  const fleche = k => triGroupe.k === k ? (triGroupe.sens < 0 ? " ▼" : " ▲") : "";
  window.largeurDemi = window.innerWidth >= 1100;
  const graphes = gGroupeValeur(l) + gGroupePertes(l) + gGroupeSorties(l);
  window.largeurDemi = false;
  const tr = g.transferts.slice().reverse().slice(0, 6);
  return `<h1>${esc(g.nom)}</h1>
  <p class="sous">${g.etabs.length} ${esc(g.mot.p)}${enseignes > 1 ? `, ${enseignes} enseignes` : ""}. Chacun a son stock et son équipe ; vous seul voyez tout. Entrez dans ${esc(g.mot.un)} pour y travailler, « Groupe » vous ramène ici.</p>
  <div class="w-entete"><h2 class="g-titre">Le groupe en ce moment</h2><div class="segments" role="group" aria-label="Période">${[7, 30, 90].map(n => `<button data-periode="${n}" aria-pressed="${periode === n}">${n} j</button>`).join("")}</div></div>
  <div class="voyants g-totaux">
    ${total("var(--depot)", argentCourt(tot("valeur")), "Valeur du stock", g.mot.tous)}
    ${total("var(--attention)", tot("aCommander"), "À commander", "références sous le seuil")}
    ${total("var(--alerte)", argentCourt(tot("pertes")), "Cassé ou perdu", `en ${periode} jours`)}
    ${total("var(--alerte)", tot("retard"), "En retard", esc(l[0].c.mots.retard.toLowerCase()))}
  </div>
  <h2>${esc(g.mot.tous.replace(/^l/, "L"))}, côte à côte</h2>
  <div class="etabs n${l.length}">${ordre.map(carte).join("")}</div>
  <h2>Comparer</h2>
  <p class="sous">Touchez une ligne pour classer ${esc(g.mot.tous)} sur ce chiffre. Le point rouge signale le chiffre le plus élevé quand c'est un mauvais signe.</p>
  <div class="defile"><table class="t comparer"><thead><tr><th scope="col">Sur ${periode} jours</th>${ordre.map(e => `<th scope="col" class="n">${esc(e.court)}</th>`).join("")}</tr></thead><tbody>
  ${lignes.map(x => { const p = pire(x); return `<tr><th scope="row"><button data-etab-tri="${x.k}" aria-pressed="${triGroupe.k === x.k}">${esc(x.t)}${fleche(x.k)}</button></th>${ordre.map(e => `<td class="n${p !== null && e.c[x.k] === p ? " pire" : ""}">${p !== null && e.c[x.k] === p ? `<i aria-label="le plus élevé"></i>` : ""}${x.f(e.c[x.k])}</td>`).join("")}</tr>`; }).join("")}</tbody></table></div>
  <h2>Courbes comparées</h2>
  <div class="graphes g-graphes">${graphes}</div>
  <h2>${esc(g.mot.entre)}</h2>
  <p class="sous">Un responsable envoie un objet ou une quantité depuis la fiche de l'objet. L'autre équipe confirme à l'arrivée. Chaque journal garde sa ligne.</p>
  ${tr.length ? `<ul class="b-liste g-transferts">${tr.map(t => `<li><button class="l" data-etab-tr="${t.id}"><span><b>${t.qte} × ${esc(t.nom)}</b><small>${esc(courtEtab(t.de))} → ${esc(courtEtab(t.vers))} · ${quand(t.date)} · ${esc(t.qui)}</small></span>${statutTransfert(t)}</button></li>`).join("")}</ul>` : `<p class="vide">Aucun envoi pour l'instant.</p>`}`;
}

/* ---------------- Ce qui s'affiche ailleurs, pour la direction d'un groupe seulement ---------------- */
// Sous l'en-tête de chaque écran : revenir au groupe, et dire dans quel établissement on se trouve.
function bandeauEtab() {
  if (!voitGroupe()) return "";
  const sur = (ALIAS[vue.nom] || vue.nom) === "groupe";
  return `<div class="etab-bandeau pas-imprimer"><button class="eb-groupe" data-racine="groupe" ${sur ? 'aria-current="page"' : ""}>${I.grille}<span>Groupe</span></button><button class="eb-choix" data-etab-choisir aria-haspopup="dialog"><span><small>${esc(G.mot.ouvert)}</small><b>${esc(nomEtab(G.actif))}</b></span>${I.fleche}</button></div>`;
}
const navGroupe = courant => voitGroupe() ? `<button data-racine="groupe" ${courant("groupe")}>${I.grille}<span>Groupe</span></button>` : "";
function feuilleEtabs() {
  const g = groupe(); if (!g || !voitGroupe()) return;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tce2"><h1 id="tce2" style="font-size:26px">Où voulez-vous aller ?</h1>
    <p class="sous">Les menus ouvrent toujours ${esc(g.mot.affiche)} sous l'en-tête.</p>
    <div class="etab-choix"><button data-vers="groupe">${I.grille}<span><b>Le groupe</b><small>${esc(g.mot.tous.replace(/^l/, "L"))}, côte à côte</small></span></button>
    ${g.etabs.map(e => `<button data-vers="${e.id}" ${e.id === g.actif ? 'aria-current="true"' : ""}>${I.materiel}<span><b>${esc(nomEtab(e.id))}</b><small>${[e.enseigne ? "Enseigne " + esc(e.enseigne) : "", esc(e.ville), e.id === g.actif ? "ouvert" : ""].filter(Boolean).join(" · ")}</small></span></button>`).join("")}</div>
    <div class="valider" style="grid-template-columns:1fr"><button class="btn" data-x>Fermer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelectorAll("[data-vers]").forEach(b => b.onclick = () => { f.remove(); if (b.dataset.vers === "groupe") return aller("groupe", null, true); if (b.dataset.vers === g.actif) return aller("accueil", null, true); entrerEtab(b.dataset.vers); });
}
// Écran de connexion d'une démo de groupe : on choisit de quel établissement est ce téléphone. Dans l'appli livrée, chaque établissement a son adresse.
function blocEtabConnexion() {
  const g = groupe(); if (!g) return "";
  return `<div class="etab-connexion"><label class="champ">${esc(g.mot.chaque)} a son appli. Ce téléphone est celui de :<select data-etab-connexion>${g.etabs.map(e => `<option value="${e.id}" ${e.id === g.actif ? "selected" : ""}>${esc(nomEtab(e.id))}</option>`).join("")}</select></label>
    <p class="sous">Le dépôt et le responsable ne voient que ${esc(g.mot.ce)}. La direction voit ${esc(g.mot.tous)} et les compare. Dans l'appli livrée, ce choix n'existe pas : ${esc(g.mot.chaque.toLowerCase())} a sa propre adresse.</p></div>`;
}
// Dans la feuille « Une démo par métier » (visites.js)
function blocDemosGroupe() {
  const ici = groupe();
  return `<h2 style="margin-top:22px">Un groupe, plusieurs établissements</h2>
    <p class="sous">Plusieurs restaurants, agences ou dépôts : chacun a son stock et son équipe, la direction les voit côte à côte.</p>
    <div class="metiers">${Object.entries(GROUPES_DEMO).map(([k, d]) => `<div class="metier ${ici && ici.cle === k ? "actuel" : ""}"><div class="vignette"><img src="img/${d.vignette}.webp" alt="" loading="lazy"></div>
      <div><b>${esc(d.titre)}</b><small>${esc(d.detail)}</small>
      <div class="metier-boutons"><button class="btn petit plein" data-g="${k}">${ici && ici.cle === k ? "Démo actuelle" : "Voir cette démo"}</button><button class="btn petit" data-lien-g="${k}">Copier le lien</button></div></div></div>`).join("")}</div>`;
}
function brancherDemosGroupe(f) {
  f.querySelectorAll("[data-g]").forEach(b => b.onclick = () => {
    f.remove(); const k = b.dataset.g; if (groupe() && G.cle === k) return;
    if (S.monEssai) return toast("Un essai est ouvert sur ce téléphone : terminez-le avant d'ouvrir une démo de groupe.");
    session = null; installateur = false; ouvrirGroupe(k); history.replaceState(null, "", "?groupe=" + k); rendre(); toast(`Démo : ${GROUPES_DEMO[k].titre.toLowerCase()}.`);
    if (typeof garderPhotos === "function") garderPhotos();
  });
  f.querySelectorAll("[data-lien-g]").forEach(b => b.onclick = async () => {
    const l = lienGroupe(b.dataset.lienG);
    try { await navigator.clipboard.writeText(l); toast("Lien copié : " + l); } catch (e) { prompt("Lien de la démo :", l); }
  });
}

function brancherGroupe() {
  if (!groupeActif()) return;
  $$("[data-etab-entrer]").forEach(b => b.onclick = () => entrerEtab(b.dataset.etabEntrer));
  $$("[data-etab-choisir]").forEach(b => b.onclick = () => feuilleEtabs());
  $$("[data-etab-envoi]").forEach(b => b.onclick = () => feuilleEnvoiEtab(b.dataset.etabEnvoi));
  $$("[data-etab-tr]").forEach(b => b.onclick = () => feuilleTransfertEtab(b.dataset.etabTr));
  $$("[data-etab-tri]").forEach(b => b.onclick = () => { const k = b.dataset.etabTri; triGroupe = triGroupe.k === k ? (triGroupe.sens < 0 ? { k, sens: 1 } : { k: "", sens: -1 }) : { k, sens: -1 }; rendre(); const n = $(`[data-etab-tri="${k}"]`); if (n) n.focus({ preventScroll: true }); });
  $$("[data-etab-connexion]").forEach(s => s.onchange = () => { changerEtab(s.value); msgConnexion = ""; identSaisi = null; rendre(); });
}

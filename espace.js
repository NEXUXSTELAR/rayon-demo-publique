"use strict";
/* Mon espace : l'outil de l'installateur, c'est-à-dire nous.
   Ses clients, une fiche par client, l'installation guidée à cocher, ses chiffres, le réglage de l'appli du client,
   et « Mes réglages » : ses taux, ses délais, la liste des étapes, l'en-tête du devis, la sauvegarde.
   Ses données sont gardées à part de la démo : elles ne s'effacent pas quand on change de métier ou qu'on remet la démo à zéro.
   En vrai, elles vivront dans le classeur de pilotage (appsheet/apps-script-pilotage/Pilotage.gs). Chargé avant app.js. */

const CLE_PILOTAGE = "rayon-pilotage-v1";
const MON_COMPTE = { complet: "Souleymane Diouf", compte: "souleymane.diouf.pro@gmail.com" };
const PHASES = ["Avant", "Sur place", "Après"];
// Liste d'origine des étapes. Celle qui sert est dans les réglages (Mes réglages) : on y ajoute, renomme, déplace ou retire une étape.
const ETAPES_ORIGINE = [
  { id: "devis", phase: "Avant", t: "Devis signé" },
  { id: "acompte", phase: "Avant", t: "Acompte de 40 % reçu" },
  { id: "articles", phase: "Avant", t: "Liste des articles reçue et importée (modèle à envoyer : modeles/07)" },
  { id: "google", phase: "Avant", t: "Compte Google du client prêt" },
  { id: "classeur", phase: "Avant", t: "Classeur créé et script installé" },
  { id: "reglage", phase: "Avant", t: "Appli réglée : taille de l'équipe, détail, rôles, blocs" },
  { id: "plan_etiq", phase: "Avant", t: "Plan d'étiquetage validé : quoi, où, sur quel support (docs/21)" },
  { id: "etiquettes", phase: "Sur place", t: "Étiquettes imprimées et posées (par nous, ou par l'équipe du client guidée en visio)" },
  { id: "comptes", phase: "Sur place", t: "Identifiants remis à chaque personne, en main propre ou en visio" },
  { id: "form_terrain", phase: "Sur place", t: "Formation du dépôt : scanner, sortir, rentrer, compter" },
  { id: "form_bureau", phase: "Sur place", t: "Formation du bureau et de la direction" },
  { id: "premier", phase: "Sur place", t: "Premier vrai geste scanné par le client" },
  { id: "pv", phase: "Après", t: "Procès-verbal de livraison signé" },
  { id: "solde", phase: "Après", t: "Solde reçu" },
  { id: "note", phase: "Après", t: "Note d'information des salariés remise" },
  { id: "fiche", phase: "Après", t: "Fiche d'assistance remise : fin, heures, contact" },
];
// Trois étapes portent les calculs : on peut les renommer et les déplacer, pas les retirer.
const ETAPES_FIXES = { devis: "donne le statut « signé »", acompte: "compte 40 % encaissés", solde: "compte 60 % encaissés" };
// Réglages d'origine. Les deux taux sont des hypothèses, à remplacer par les vrais (TACHES, section 0 bis).
// Sénégal : on vend en notre nom (docs/24). Le partenaire touche le relais qu'il fait, plus une commission s'il a apporté le client.
// Tarif de l'heure d'intervention : les valeurs de départ sont celles de data.js (docs/23). Il se règle dans Mes réglages.
const TARIF_ORIGINE = { eur: TARIF_INTERVENTION.eur, xof: TARIF_INTERVENTION.xof };
const RELANCE_ORIGINE = `Bonjour {contact},

Je me permets de revenir vers vous au sujet du devis Stockclair envoyé le {date} pour {entreprise}. Avez-vous eu le temps de le regarder ?

Si vous le souhaitez, je vous propose un échange de 10 minutes pour répondre à vos questions.

Bien cordialement,
{moi}`;
const reglagesOrigine = () => ({
  nom: MON_COMPTE.complet, compte: MON_COMPTE.compte, vendeurFR: "", mentionSN: "",
  commission: 10,            // % du total, au partenaire sénégalais quand il a apporté le client
  netPortage: 50,            // % qui reste en France après le portage salarial
  tarifEur: TARIF_ORIGINE.eur, tarifXof: TARIF_ORIGINE.xof, // heure d'intervention HT, en France et au Sénégal
  relance: RELANCE_ORIGINE,  // message de relance d'un devis ; repères {contact}, {entreprise}, {date}, {moi}
  relanceJours: 7,           // « Relancer » quand le devis est envoyé depuis plus de tant de jours
  alerteAssistanceJours: 15, // « Fin d'assistance » quand il reste tant de jours ou moins
  heures: { demarrage: 8, complet: 13, mesure: 32 }, // heures prévues proposées à la création d'un client
  etapes: ETAPES_ORIGINE.map(e => Object.assign({}, e)),
});

/* ---------------- Données ---------------- */
function pilotageDemo() {
  const J = 86400000, n = Date.now(), fait = (ids, il) => Object.fromEntries(ids.map(k => [k, n - il * J]));
  const tout = ETAPES_ORIGINE.map(e => e.id);
  return { clients: [
    { id: "C-01", nom: "Location Fêtes (démo)", metier: "loueur", pays: "SN", ville: "Dakar", contact: "Mme Ndiaye", tel: "+221 70 000 00 01", offre: "complet", modules: ["MO-RES", "MO-KIT"], relais: 2, apporteur: true, devisLe: n - 45 * J, livreLe: n - 20 * J, etapes: fait(tout, 21), heuresEstimees: 14, heuresPassees: 16.5,
      interventions: [{ date: n - 9 * J, h: 0.75, t: "Ajout de deux kits", statut: "incluse" }, { date: n - 3 * J, h: 0.75, t: "Nouveau magasinier : identifiant et formation", statut: "incluse" }], notes: "Client pilote au Sénégal, par la société partenaire." },
    { id: "C-02", nom: "Atelier Élec (démo)", metier: "artisan", pays: "FR", ville: "Toulouse", contact: "M. Martin", tel: "06 00 00 00 21", offre: "demarrage", mode: "place", modules: [], devisLe: n - 12 * J, prevuLe: isoJour(n + 5 * J), etapes: fait(["devis", "acompte", "articles", "google"], 4), heuresEstimees: 8, heuresPassees: 2, interventions: [], notes: "" },
    { id: "C-03", nom: "Le Comptoir (démo)", metier: "restaurant", pays: "FR", ville: "Montreuil", contact: "Mme Bernard", tel: "06 00 00 00 31", offre: "complet", mode: "distance", essaiDeduit: true, modules: ["AL-WA"], devisLe: n - 9 * J, etapes: {}, heuresEstimees: 13, heuresPassees: 1, interventions: [], notes: "Veut les dates limites et la consommation par service." },
    { id: "C-04", nom: "Projet Santé Solidaire (démo)", metier: "ong", pays: "SN", ville: "Thiès", contact: "Mme Faye", tel: "+221 77 000 00 41", offre: "mesure", prixEur: 4400, modules: [], devisLe: n - 130 * J, livreLe: n - 100 * J, etapes: fait(tout, 101), heuresEstimees: 32, heuresPassees: 38,
      interventions: [{ date: n - 70 * J, h: 2, t: "Rapport par bailleur", statut: "incluse" }, { date: n - 6 * J, h: 1.5, t: "Nouvel entrepôt à Kaolack", statut: "facturée" }], notes: "" },
    { id: "C-05", nom: "Quincaillerie du Centre (démo)", metier: "distribution", pays: "SN", ville: "Dakar", contact: "M. Sow", tel: "+221 76 000 00 51", offre: "demarrage", modules: [], devisLe: n - 70 * J, livreLe: n - 50 * J, etapes: fait(tout.filter(k => k !== "note"), 50), heuresEstimees: 8, heuresPassees: 9,
      interventions: [{ date: n - 2 * J, h: 1, t: "Import de 120 nouvelles références", statut: "à facturer" }], notes: "" },
  ] };
}
// Remet des données lues (stockage ou fichier de sauvegarde) dans la forme attendue : les champs absents prennent leur valeur d'origine.
function normaliserP(s) {
  const o = reglagesOrigine(), r = Object.assign({}, o, s.reglages || {});
  const nb = (v, d, min, max) => v === "" || v === null || v === undefined || !isFinite(+v) ? d : Math.min(max, Math.max(min, +v));
  r.commission = nb(r.commission, o.commission, 0, 100); r.netPortage = nb(r.netPortage, o.netPortage, 0, 100);
  r.tarifEur = nb(r.tarifEur, o.tarifEur, 1, 1000); r.tarifXof = Math.round(nb(r.tarifXof, o.tarifXof, 500, 1000000));
  r.relance = String(r.relance === null || r.relance === undefined ? "" : r.relance).replace(/\r/g, "").trim().slice(0, 800) || o.relance;
  r.relanceJours = Math.round(nb(r.relanceJours, o.relanceJours, 1, 90)); r.alerteAssistanceJours = Math.round(nb(r.alerteAssistanceJours, o.alerteAssistanceJours, 1, 90));
  r.heures = Object.assign({}, o.heures, r.heures || {}); Object.keys(o.heures).forEach(k => { r.heures[k] = nb(r.heures[k], o.heures[k], 0, 500); });
  ["nom", "compte", "vendeurFR", "mentionSN"].forEach(k => { r[k] = String(r[k] === null || r[k] === undefined ? o[k] : r[k]).trim().slice(0, 120); });
  if (!r.nom) r.nom = o.nom;
  const vus = new Set();
  r.etapes = (Array.isArray(r.etapes) ? r.etapes : o.etapes).filter(e => e && e.id && PHASES.includes(e.phase) && String(e.t || "").trim() && !vus.has(String(e.id)) && vus.add(String(e.id)))
    .map(e => ({ id: String(e.id), phase: e.phase, t: String(e.t).trim().slice(0, 140) }));
  Object.keys(ETAPES_FIXES).forEach(k => { if (!vus.has(k)) r.etapes.push(Object.assign({}, ETAPES_ORIGINE.find(e => e.id === k))); });
  s.reglages = r;
  s.clients = (Array.isArray(s.clients) ? s.clients : []).filter(c => c && c.id && c.nom).map(c => {
    c = Object.assign({ metier: "loueur", pays: "FR", ville: "", contact: "", tel: "", email: "", offre: "complet", modules: [], etapes: {}, interventions: [], heuresPassees: 0, heuresEstimees: 0, notes: "" }, c);
    if (!METIERS[c.metier]) c.metier = "loueur";
    if (!OFFRES[c.offre]) c.offre = "complet";
    if (!Array.isArray(c.modules)) c.modules = [];
    if (!Array.isArray(c.interventions)) c.interventions = [];
    if (!c.etapes || typeof c.etapes !== "object") c.etapes = {};
    c.heuresPassees = +c.heuresPassees || 0; c.heuresEstimees = +c.heuresEstimees || 0;
    if (c.liste && !(Array.isArray(c.liste.articles) && c.liste.articles.length && c.liste.articles.every(a => a && a.nom && Array.isArray(a.lots)))) delete c.liste;
    return c;
  });
  return s;
}
let P_ = normaliserP((() => { try { const s = JSON.parse(localStorage.getItem(CLE_PILOTAGE)); if (s && s.clients) return s; } catch (e) { /* stockage bloqué */ } return pilotageDemo(); })());
// Sur un appareil où Mon espace est ouvert, le tarif réglé sert aussi au devis et à l'écran d'offre de la démo (TARIF_INTERVENTION).
// Pour un visiteur de la démo, qui n'a jamais ouvert Mon espace, rien ne change : les valeurs de data.js restent.
function appliquerTarifP() { if (ESPACE) { TARIF_INTERVENTION.eur = P_.reglages.tarifEur; TARIF_INTERVENTION.xof = P_.reglages.tarifXof; } }
appliquerTarifP();
const sauverP = () => { appliquerTarifP(); try { localStorage.setItem(CLE_PILOTAGE, JSON.stringify(P_)); } catch (e) { /* mode privé */ } };
const clientP = id => P_.clients.find(c => c.id === id);
const reglP = () => P_.reglages, etapesP = () => P_.reglages.etapes;
const moiP = () => ({ complet: reglP().nom, nom: reglP().nom.split(/\s+/)[0], compte: reglP().compte, initiale: reglP().nom.charAt(0).toUpperCase() });
// Numéro du prochain client : le plus grand numéro déjà pris, plus un (un client supprimé ne libère pas le sien)
const nouvelIdP = () => "C-" + String(P_.clients.reduce((m, c) => Math.max(m, +String(c.id).replace(/\D/g, "") || 0), 0) + 1).padStart(2, "0");
const estDemoP = c => /\(démo\)\s*$/.test(c.nom);
const hTexte = h => String(h).replace(".", ",");

/* ---------------- Calculs ---------------- */
const fmtEur = n => Math.round(n).toLocaleString("fr-FR") + " €";
const fmtXof = n => Math.round(n).toLocaleString("fr-FR") + " FCFA";
// Prix de vente HT : règles communes de calculerDevis (data.js, docs/23). France sur place ou à distance ; Sénégal à distance.
// Les anciens clients sans mode sont comptés sur place en France.
function prixVente(c) {
  return calculerDevis({ offre: c.offre, pays: c.pays, mode: c.mode || "place", modules: c.modules || [], utilisateurs: c.utilisateurs || 0, relais: c.relais || 0, essaiDeduit: !!c.essaiDeduit, prixEur: c.prixEur || 0 });
}
const modeTexte = c => c.pays === "SN" ? "à distance" + (c.relais ? `, relais ${c.relais} demi-journée${c.relais > 1 ? "s" : ""}` : "") : (c.mode === "distance" ? "à distance" : "sur place");
const paysTexte = c => c.pays === "SN" ? "Sénégal" : "France";
const enEur = (c, v) => c.pays === "SN" ? v / EUR_XOF : v;
// Prix d'une heure d'intervention, en euros pour les calculs ; affiché dans la monnaie du client
const heureEur = c => c.pays === "SN" ? reglP().tarifXof / EUR_XOF : reglP().tarifEur;
const prixHeures = (c, h) => c.pays === "SN" ? fmtXof(h * reglP().tarifXof) : fmtEur(h * reglP().tarifEur);
const tarifTexte = c => c.pays === "SN" ? fmtXof(reglP().tarifXof) : fmtEur(reglP().tarifEur);
// Ce qui revient au partenaire sénégalais sur une vente : ses demi-journées de relais, plus la commission d'apporteur
function partPartenaire(c) {
  if (c.pays !== "SN") return 0;
  const p = prixVente(c);
  return (c.relais || 0) * RELAIS_XOF + (c.apporteur ? reglP().commission / 100 * p.total : 0);
}
// Part qui nous revient, en proportion du total (1 en France)
const partNous = c => { const t = prixVente(c).total; return c.pays === "SN" && t ? (t - partPartenaire(c)) / t : 1; };
// Encaissé : 40 % à l'acompte, 60 % au solde, plus les interventions facturées. « depuis » ne garde que ce qui est daté après.
function encaisse(c, depuis) {
  const p = enEur(c, prixVente(c).total), d = depuis || 0;
  const vente = (c.etapes.acompte && c.etapes.acompte >= d ? .4 * p : 0) + (c.etapes.solde && c.etapes.solde >= d ? .6 * p : 0);
  const interv = c.interventions.filter(i => i.statut === "facturée" && i.date >= d).reduce((t, i) => t + i.h * heureEur(c), 0);
  return { vente, interv, total: vente + interv };
}
function aEncaisser(c) {
  if (!c.etapes.devis) return 0;
  const p = enEur(c, prixVente(c).total);
  return (c.etapes.acompte ? 0 : .4 * p) + (c.etapes.solde ? 0 : .6 * p) + c.interventions.filter(i => i.statut === "à facturer").reduce((t, i) => t + i.h * heureEur(c), 0);
}
function assistance(c) {
  if (!c.livreLe) return null;
  const o = OFFRES[c.offre], jours = Math.ceil((c.livreLe + o.jours * 86400000 - Date.now()) / 86400000);
  const utilisees = c.interventions.filter(i => i.statut === "incluse").reduce((t, i) => t + i.h, 0);
  return { jours: Math.max(0, jours), heures: Math.max(0, o.heures - utilisees), total: o.heures, enCours: jours > 0 && utilisees < o.heures };
}
const avancement = c => etapesP().filter(e => c.etapes[e.id]).length;
function statutP(c) {
  if (!c.etapes.devis) return c.devisLe ? { t: "Devis envoyé", c: "s-confirme" } : { t: "À chiffrer", c: "" };
  if (!c.livreLe) return { t: c.prevuLe ? "Installation le " + dateCourte(c.prevuLe) : "Signé", c: "s-prpare" };
  const a = assistance(c);
  return a.enCours ? { t: "Assistance en cours", c: "s-revenue" } : { t: "Assistance terminée", c: "" };
}
// Gain net estimé de l'heure, sur ce qui est déjà encaissé
const gainHeure = c => c.heuresPassees ? encaisse(c).total * partNous(c) * (c.pays === "FR" ? reglP().netPortage / 100 : 1) / c.heuresPassees : 0;

/* ---------------- Ce qui attend ---------------- */
function tachesP() {
  const l = [], J = 86400000, E = etapesP(), r = reglP();
  P_.clients.forEach(c => {
    const a = assistance(c);
    if (c.devisLe && !c.etapes.devis && Date.now() - Math.max(c.devisLe, c.relanceLe || 0) > r.relanceJours * J) l.push({ c: "attention", i: I.bon, t: "Relancer · " + c.nom, s: `Devis envoyé il y a ${Math.round((Date.now() - c.devisLe) / J)} jours${c.relanceLe ? `, relancé il y a ${Math.round((Date.now() - c.relanceLe) / J)} jours` : ""}`, cl: c.id, rel: c.id });
    if (c.prevuLe && !c.livreLe) { const reste = E.filter(e => e.phase === "Avant" && !c.etapes[e.id]).length; l.push({ c: "sortie", i: I.camion, t: "Installer · " + c.nom, s: `Le ${dateCourte(c.prevuLe)}${c.ville ? " à " + c.ville : ""}${reste ? ` · ${reste} étape${reste > 1 ? "s" : ""} à préparer` : " · tout est prêt"}`, p: avancement(c) / E.length, inst: c.id }); }
    if (a && a.enCours && a.jours <= r.alerteAssistanceJours) l.push({ c: "compter", i: I.abo, t: "Fin d'assistance · " + c.nom, s: `Dans ${a.jours} jours : prévenir et proposer les interventions`, cl: c.id });
    c.interventions.filter(x => x.statut === "à facturer").forEach(x => l.push({ c: "retour", i: I.argent, t: "Facturer · " + c.nom, s: `${x.t} · ${hTexte(x.h)} h · ${prixHeures(c, x.h)}`, cl: c.id }));
    if (c.livreLe && !c.etapes.solde) l.push({ c: "alerte", i: I.argent, t: "Solde à encaisser · " + c.nom, s: prixVente(c).fmt(.6 * prixVente(c).total), cl: c.id });
    if (c.livreLe && E.some(e => !c.etapes[e.id])) l.push({ c: "attention", i: I.compter, t: "Installation à terminer · " + c.nom, s: E.filter(e => !c.etapes[e.id]).map(e => e.t).join(", "), inst: c.id });
  });
  return l;
}

/* ---------------- Écrans ---------------- */
let vueE = { nom: "tableau", arg: null }, pileE = [];
function allerE(nom, arg, racine) {
  if (racine) pileE = []; else if (vueE.nom !== nom || vueE.arg !== arg) pileE = pileE.concat([vueE]).slice(-20);
  vueE = { nom, arg }; entree = true; rendre(); window.scrollTo(0, 0);
}
const iconePlus = () => P('<path d="M24 8v32M8 24h32"/>');
const VUES_E = { tableau: { t: "Tableau", i: "maison" }, clients: { t: "Clients", i: "equipe" }, installations: { t: "Installations", i: "compter" }, chiffres: { t: "Chiffres", i: "releve" }, reglages: { t: "Régler une appli", i: "grille" }, mesreglages: { t: "Mes réglages", i: "reglages" } };

function coqueEspace() {
  const nom = vueE.nom, parent = { client: "clients", installation: "installations", liste: "clients", etiquettes: "clients" }[nom] || nom, moi = moiP();
  const corps = ({ tableau: eTableau, clients: eClients, client: eClient, installations: eInstallations, installation: eInstallation, chiffres: eChiffres, reglages: eReglageAppli, mesreglages: eMesReglages, liste: eListeP, etiquettes: eEtiquettesP })[nom] || eTableau;
  const courant = k => k === parent ? 'aria-current="page"' : "";
  const titre = { client: "Client", installation: "Installation guidée", liste: "Liste d'articles", etiquettes: "Étiquettes" }[nom] || (VUES_E[nom] || VUES_E.tableau).t;
  const nav = Object.entries(VUES_E).map(([k, v]) => `<button data-e="${k}" data-racine-e ${courant(k)}>${I[v.i]}<span>${v.t}</span></button>`).join("");
  return `<div class="app espace">${DEMO}
    <aside class="cote" aria-label="Menu">
      <div class="marque">${I.logo}<span>Mon espace</span></div>
      <button class="btn plein" data-act="nouveauClientP">${iconePlus()}Nouveau client</button>
      <nav>${nav}<h4>Démo</h4><button data-act="voirDemoClient">${I.fleche}<span>Ouvrir la démo du client</span></button></nav>
      <div class="cote-pied"><div class="moi"><span class="avatar direction">${esc(moi.initiale)}</span><span><b>${esc(moi.complet)}</b><small>${esc(moi.compte)}</small></span></div>
        <div class="cote-outils">${boutonReglages}<button class="rond" data-act="quitterInstallateur" aria-label="Quitter mon espace">${I.sortir}</button></div></div>
    </aside>
    <header class="haut verre">
      ${nom === "tableau" ? `<div class="marque">${I.logo}</div>` : `<button class="rond" data-act="retourE" aria-label="Retour">${I.precedent}</button>`}
      <b class="haut-titre">${nom === "tableau" ? "Mon espace" : esc(titre)}</b>
      <div class="outils"><button class="rond" data-act="quitterInstallateur" aria-label="Quitter mon espace">${I.sortir}</button></div>
    </header>
    <main class="b-main">${corps(vueE.arg)}</main>
    <nav class="barre-bas verre" aria-label="Navigation">
      <button data-e="tableau" data-racine-e ${courant("tableau")}>${I.maison}<span>Tableau</span></button>
      <button data-e="clients" data-racine-e ${courant("clients")}>${I.equipe}<span>Clients</span></button>
      <button class="bb-scan" data-act="nouveauClientP" aria-label="Nouveau client">${iconePlus()}</button>
      <button data-e="chiffres" data-racine-e ${courant("chiffres")}>${I.releve}<span>Chiffres</span></button>
      <button data-act="plusE" ${["installations", "reglages", "mesreglages"].includes(parent) ? 'aria-current="page"' : ""}>${I.grille}<span>Plus</span></button>
    </nav></div>`;
}
function feuillePlusE() {
  const moi = moiP();
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-label="Mon espace">
    <div class="plus-moi"><span class="avatar grand direction">${esc(moi.initiale)}</span><div><b>${esc(moi.complet)}</b><small>${esc(moi.compte)}</small></div></div>
    <h2>Mon espace</h2><div class="plus-grille">${Object.entries(VUES_E).map(([k, v]) => `<button data-k="${k}"><span class="pastille">${I[v.i]}</span>${v.t}</button>`).join("")}<button data-a="voirDemoClient"><span class="pastille">${I.fleche}</span>Démo du client</button></div>
    <div class="valider"><button class="btn" data-a="reglages">${I.reglages}Thème</button><button class="btn" data-a="quitterInstallateur">${I.sortir}Quitter</button></div></div>`);
  f.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { f.remove(); allerE(b.dataset.k, null, true); });
  f.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { f.remove(); ACTIONS[b.dataset.a](); });
}

/* Tableau : le centre de commande de l'installateur */
function eTableau() {
  const h = new Date().getHours(), an = new Date().getFullYear(), debut = new Date(an, 0, 1).getTime(), E = etapesP();
  const enc = P_.clients.reduce((t, c) => t + encaisse(c, debut).total * partNous(c), 0), att = P_.clients.reduce((t, c) => t + aEncaisser(c) * partNous(c), 0);
  const actifs = P_.clients.filter(c => assistance(c) && assistance(c).enCours).length, prevus = P_.clients.filter(c => c.prevuLe && !c.livreLe).length;
  const devis = P_.clients.filter(c => c.devisLe && !c.etapes.devis).length, aFact = P_.clients.reduce((t, c) => t + c.interventions.filter(i => i.statut === "à facturer").length, 0);
  const l = tachesP();
  const tache = x => `<li ${x.rel ? 'class="tache-double"' : ""}><button class="tache c-${x.c}" ${x.inst ? `data-e="installation" data-earg="${x.inst}"` : `data-e="client" data-earg="${x.cl}"`}><span class="pastille">${x.i}</span><span><b>${esc(x.t)}</b><small>${esc(x.s)}</small>${x.p !== undefined ? `<i class="barre"><i style="width:${Math.round(x.p * 100)}%"></i></i>` : ""}</span><span class="chev">${I.fleche}</span></button>${x.rel ? `<button class="btn petit" data-relancer-p="${x.rel}">Relancer</button>` : ""}</li>`;
  const puce = (vers, coul, n, txt, filtre) => `<button class="puce" data-e="${vers}" data-racine-e ${filtre ? `data-filtre-vers="${filtre}"` : ""}><i style="--c:${coul}"></i><b>${compte(n)}</b><span>${txt}</span></button>`;
  const prochaines = P_.clients.filter(c => c.prevuLe && !c.livreLe).sort((a, b) => a.prevuLe.localeCompare(b.prevuLe));
  return `<div class="salut"><p class="date">${dateLongue(aujourdHui())}</p><h1>${h >= 18 || h < 5 ? "Bonsoir" : "Bonjour"} ${esc(moiP().nom)}</h1></div>
  <div class="bento">
    <section class="w w-l nu" style="--i:0"><div class="pouls">
      <div class="pouls-tete"><div><small>Pour nous, encaissé en ${an}</small><b class="pouls-chiffre">${compte(Math.round(enc), "n")} €</b><span class="pouls-delta">${fmtEur(att)} encore à encaisser</span></div>
        <button class="rond clair" data-e="chiffres" data-racine-e aria-label="Voir les chiffres">${I.fleche}</button></div>
      <div class="pouls-puces" style="margin-top:16px">${puce("clients", "var(--retour)", actifs, "en assistance", "livres")}${puce("installations", "var(--sortie)", prevus, "à installer")}${puce("clients", "var(--marque)", devis, "devis en attente", "signer")}${puce("clients", "var(--compter)", aFact, "à facturer", "tous")}</div>
    </div></section>
    <section class="w w-m" style="--i:1"><h3 class="w-titre">À faire ${l.length ? `<span class="compte">${l.length}</span>` : ""}</h3>${l.length ? `<ul class="taches">${l.map(tache).join("")}</ul>` : `<p class="vide">Rien en attente.</p>`}</section>
    <section class="w w-m" style="--i:2"><h3 class="w-titre">${I.camion}Prochaines installations</h3>
      ${prochaines.map(c => `<button class="client" data-e="installation" data-earg="${c.id}"><span class="avatar">${esc(initiales(c.nom))}</span><span><b>${esc(c.nom)}</b><small>${dateLongue(c.prevuLe)}${c.ville ? " · " + esc(c.ville) : ""}</small></span>${anneau(avancement(c), E.length, "var(--sortie)", avancement(c) + "/" + E.length, "", true).replace('class="anneau petit"', 'class="anneau petit mini"')}</button>`).join("") || `<p class="vide">Aucune installation prévue.</p>`}
      <p style="margin-top:10px"><button class="btn petit" data-act="nouveauClientP">${iconePlus()}Nouveau client</button></p></section>
    <section class="w w-l nu" style="--i:3">${gVentesMois()}</section>
  </div>`;
}

/* Clients */
let filtreP = "tous", chercheP = "";
const FILTRES_P = { tous: ["Tous", () => true], signer: ["À signer", c => !c.etapes.devis], installer: ["À installer", c => c.etapes.devis && !c.livreLe], livres: ["Livrés", c => !!c.livreLe] };
function eClients() {
  if (!FILTRES_P[filtreP]) filtreP = "tous";
  const l = P_.clients.filter(FILTRES_P[filtreP][1]).sort((a, b) => (b.devisLe || b.creeLe || 0) - (a.devisLe || a.creeLe || 0)), nE = etapesP().length;
  return `<h1>Clients</h1><p class="sous">Chaque installation, de la proposition à la fin de l'assistance.</p>
  <div class="outils-liste"><label class="recherche">${I.loupe}<span class="cache">Chercher un client</span><input type="search" data-cherche-p placeholder="Chercher : nom, ville, contact, e-mail" autocomplete="off" value="${esc(chercheP)}"></label>
    <div class="segments" role="group" aria-label="Filtre">${Object.entries(FILTRES_P).map(([k, [t, f]]) => `<button data-filtre-p="${k}" aria-pressed="${filtreP === k}">${t} <span class="nb-p">${P_.clients.filter(f).length}</span></button>`).join("")}</div></div>
  <div class="clients">${l.map(c => {
    const s = statutP(c), p = prixVente(c), a = assistance(c);
    return `<button class="client client-p" data-e="client" data-earg="${c.id}" data-txt="${esc(sansAccent([c.nom, c.ville, c.contact, c.tel, c.email, METIERS[c.metier].nom, paysTexte(c), OFFRES[c.offre].nom, s.t].join(" ")))}"><span class="avatar">${esc(initiales(c.nom))}</span>
      <span><b>${esc(c.nom)}</b><small>${[esc(METIERS[c.metier].nom), esc(c.ville), paysTexte(c)].filter(Boolean).join(" · ")}</small>
        <span class="client-etat"><span class="statut ${s.c}">${esc(s.t)}</span>${a && a.enCours ? `<small>${a.jours} j et ${hTexte(a.heures)} h restants</small>` : ""}</span>
        <i class="barre"><i style="width:${Math.round(avancement(c) / nE * 100)}%"></i></i></span>
      <span class="client-chiffres"><small>${esc(OFFRES[c.offre].nom)} · ${modeTexte(c)}</small><b>${p.fmt(p.total)}</b></span></button>`;
  }).join("")}<p class="vide" data-vide-p ${l.length ? "hidden" : ""}>${P_.clients.length ? "Aucun client dans cette liste." : "Aucun client pour l'instant. Le bouton « + » en crée un."}</p></div>`;
}
// La recherche filtre la liste affichée sans redessiner l'écran : le champ garde le curseur
function filtrerClientsP() {
  const q = sansAccent(chercheP.trim()); let n = 0;
  $$(".client-p[data-txt]").forEach(b => { const ok = !q || b.dataset.txt.includes(q); b.hidden = !ok; if (ok) n++; });
  const v = $("[data-vide-p]"); if (v) { v.hidden = n > 0; if (q && !n) v.textContent = "Aucun client ne correspond à cette recherche."; }
}
function eClient(id) {
  const c = clientP(id); if (!c) return eClients();
  const s = statutP(c), p = prixVente(c), a = assistance(c), e = encaisse(c), o = OFFRES[c.offre], nE = etapesP().length;
  const tarif = tarifTexte(c), aSigner = c.devisLe && !c.etapes.devis;
  // Le geste qui fait avancer le client vient en premier
  const geste = !c.devisLe ? `<button class="btn petit plein" data-devis-envoye-p="${c.id}">Devis envoyé aujourd'hui</button>` : !c.etapes.devis ? `<button class="btn petit plein" data-signe-p="${c.id}">Devis signé</button><button class="btn petit" data-relancer-p="${c.id}">Relancer</button>` : "";
  return `<div class="fiche-client"><span class="avatar grand">${esc(initiales(c.nom))}</span><div><h1>${esc(c.nom)}</h1>
    <p class="sous">${esc(METIERS[c.metier].nom)} · ${c.ville ? esc(c.ville) + ", " : ""}${c.pays === "SN" ? "Sénégal (par la société partenaire)" : "France"} · <span class="statut ${s.c}">${esc(s.t)}</span></p></div></div>
  <div class="boutons">${geste}
    <button class="btn petit ${geste ? "" : "plein"}" data-e="installation" data-earg="${c.id}">${I.compter}Installation guidée · ${avancement(c)}/${nE}</button>
    <button class="btn petit" data-devis-p="${c.id}">${I.bon}Devis</button>
    ${c.tel ? `<a class="btn petit" href="tel:${esc(c.tel.replace(/\s/g, ""))}">Appeler</a><a class="btn petit" href="https://wa.me/${esc(c.tel.replace(/\D/g, "").replace(/^0/, "33"))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}${c.email ? `<a class="btn petit" href="mailto:${esc(c.email)}">E-mail</a>` : ""}
    <button class="btn petit" data-regler-p="${c.id}">${I.reglages}Régler son appli</button>
    <button class="btn petit" data-modifier-p="${c.id}">Modifier</button></div>
  <div class="bento" style="margin-top:14px">
    <section class="w w-m"><h3 class="w-titre">${I.argent}Vente</h3>
      <div class="lignes-p"><div><span>Offre ${esc(o.nom)}, ${modeTexte(c)}</span><b>${p.fmt(p.base)}</b></div>${p.lignes.map(l => `<div><span>${esc(l.t)}</span><b>${l.m ? p.fmt(l.m) : "compris"}</b></div>`).join("")}
      <div class="fort"><span>Total HT${o.aPartirDe ? " (à partir de)" : ""}</span><b>${p.fmt(p.total)}</b></div>${p.alertes.map(a => `<div><span class="rouge">${esc(a)}</span></div>`).join("")}
      <div><span>Devis</span><b>${c.devisLe ? "envoyé le " + new Date(c.devisLe).toLocaleDateString("fr-FR") + (aSigner && c.relanceLe ? ", relancé le " + new Date(c.relanceLe).toLocaleDateString("fr-FR") : "") : "pas encore envoyé"}</b></div>
      <div><span>Acompte de 40 %</span><b class="${c.etapes.acompte ? "vert" : ""}">${c.etapes.acompte ? "reçu" : p.fmt(.4 * p.total)}</b></div>
      <div><span>Solde de 60 %</span><b class="${c.etapes.solde ? "vert" : ""}">${c.etapes.solde ? "reçu" : p.fmt(.6 * p.total)}</b></div>
      ${c.pays === "SN" ? `<div><span>Pour le partenaire (relais${c.apporteur ? ", commission d'apporteur" : ""})</span><b>${p.fmt(partPartenaire(c))}</b></div><div><span>Pour nous</span><b>${p.fmt(p.total - partPartenaire(c))}</b></div>` : ""}</div></section>
    <section class="w w-m"><h3 class="w-titre">${I.abo}Assistance</h3>
      ${a ? `<div class="paire" style="margin-top:0">
        <div>${anneau(a.jours, o.jours, a.enCours ? "var(--retour)" : "var(--neutre)", a.jours, "jours restants", true)}<p>sur ${o.jours} jours</p></div>
        <div>${anneau(a.heures, a.total, a.enCours ? "var(--compter)" : "var(--neutre)", hTexte(a.heures), "heures restantes", true)}<p>sur ${a.total} h</p></div></div>
        <p class="w-note">${a.enCours ? "Corrections et questions d'utilisation comprises. Les nouvelles fonctions passent par un devis." : `Terminée. Interventions à ${tarif} HT de l'heure, sur devis.`}</p>` : `<p class="vide">Commence à la livraison : ${o.jours} jours et ${o.heures} h.</p>`}</section>
    <section class="w w-l"><div class="w-entete"><h3 class="w-titre">${I.journal}Interventions</h3><button class="btn petit" data-intervention-p="${c.id}">${iconePlus()}Ajouter</button></div>
      ${c.interventions.length ? `<ul class="b-liste">${c.interventions.slice().reverse().map((x, k) => { const i = c.interventions.length - 1 - k; return `<li><div class="l ligne-interv"><span><b>${esc(x.t)}</b><small>${quand(x.date)} · ${hTexte(x.h)} h${x.statut !== "incluse" ? " · " + prixHeures(c, x.h) : ""}</small></span>
        <span class="boutons"><span class="statut ${x.statut === "facturée" ? "s-revenue" : x.statut === "à facturer" ? "s-partie" : ""}">${x.statut}</span>${x.statut === "à facturer" ? `<button class="btn petit" data-facturer-p="${c.id}|${i}">Marquer facturée</button>` : ""}<button class="btn petit" data-modifier-interv-p="${c.id}|${i}">Modifier</button><button class="btn petit" data-retirer-interv-p="${c.id}|${i}">Retirer</button></span></div></li>`; }).join("")}</ul>` : `<p class="vide">Aucune intervention.</p>`}</section>
    <section class="w w-m"><h3 class="w-titre">${I.jour}Heures passées</h3>
      <div class="lignes-p"><div><span>Prévues dans le prix</span><b>${hTexte(c.heuresEstimees)} h</b></div><div class="fort"><span>Passées</span><b class="${c.heuresPassees > c.heuresEstimees ? "rouge" : ""}">${hTexte(c.heuresPassees)} h</b></div>
      <div><span>Gain net estimé de l'heure</span><b>${c.heuresPassees && e.total ? fmtEur(gainHeure(c)) : "—"}</b></div></div>
      <div class="boutons" style="margin-top:10px"><button class="btn petit" data-heures-p="${c.id}|0.5">+ 30 min</button><button class="btn petit" data-heures-p="${c.id}|1">+ 1 h</button><button class="btn petit" data-heures-p="${c.id}|-0.5">− 30 min</button></div></section>
    ${blocFicheListeP(c)}
    <section class="w w-m"><h3 class="w-titre">${I.equipe}Contact</h3><p style="margin:0"><b>${esc(c.contact || "—")}</b>${c.tel ? "<br>" + esc(c.tel) : ""}${c.email ? `<br><span class="mel-p">${esc(c.email)}</span>` : ""}</p>${c.notes ? `<p class="msg" style="margin-top:10px">${esc(c.notes)}</p>` : ""}</section>
  </div>`;
}

/* Installation guidée */
function eInstallations() {
  const l = P_.clients.filter(c => c.etapes.devis || c.prevuLe).sort((a, b) => avancement(a) - avancement(b)), nE = etapesP().length;
  return `<h1>Installations</h1><p class="sous">La même liste d'étapes pour chaque client, à cocher avant, sur place et après. Rien n'est oublié, et le temps se compte.</p>
  <div class="clients">${l.map(c => `<button class="client" data-e="installation" data-earg="${c.id}"><span class="avatar">${esc(initiales(c.nom))}</span><span><b>${esc(c.nom)}</b><small>${c.livreLe ? "Livré le " + new Date(c.livreLe).toLocaleDateString("fr-FR") : c.prevuLe ? "Prévue le " + dateCourte(c.prevuLe) : "Date à fixer"}${c.ville ? " · " + esc(c.ville) : ""}</small><i class="barre"><i style="width:${Math.round(avancement(c) / nE * 100)}%"></i></i></span><span class="client-chiffres"><b>${avancement(c)}/${nE}</b><small>étapes</small></span></button>`).join("") || `<p class="vide">Aucune installation : un client apparaît ici quand son devis est signé.</p>`}</div>
  <p style="margin-top:14px"><button class="btn petit" data-e="mesreglages" data-racine-e>${I.reglages}Changer la liste des étapes</button></p>`;
}
function eInstallation(id) {
  const c = clientP(id); if (!c) return eInstallations();
  const E = etapesP(), n = avancement(c), tot = E.length;
  return `<div class="inst-tete">${anneau(n, tot, n === tot ? "var(--retour)" : "var(--sortie)", Math.round(n / tot * 100) + " %", "fait")}
    <div><h1>${esc(c.nom)}</h1><p class="sous">${c.livreLe ? "Livré le " + new Date(c.livreLe).toLocaleDateString("fr-FR") : c.prevuLe ? "Installation prévue le " + dateLongue(c.prevuLe) : "Date d'installation à fixer"}${c.ville ? " · " + esc(c.ville) : ""}</p>
    <div class="boutons">${c.livreLe ? `<label class="btn petit date-p">Livré le<input type="date" data-livre-le-p="${c.id}" value="${isoJour(c.livreLe)}" max="${aujourdHui()}"></label>` : `<label class="btn petit date-p">Installation le<input type="date" data-date-p="${c.id}" value="${c.prevuLe || ""}"></label>`}
    ${!c.livreLe && E.filter(e => e.phase !== "Après").every(e => c.etapes[e.id]) ? `<button class="btn petit plein" data-livrer-p="${c.id}">Marquer livré : l'assistance commence</button>` : ""}
    <button class="btn petit" data-e="client" data-earg="${c.id}">Fiche du client</button></div></div></div>
  ${PHASES.map(ph => { const l = E.filter(e => e.phase === ph), f = l.filter(e => c.etapes[e.id]).length; if (!l.length) return "";
    return `<div class="phase-tete"><h2>${ph} <small class="compte-ph">${f}/${l.length}</small></h2>${f < l.length ? `<button class="btn petit" data-phase-p="${c.id}|${ph}">Tout cocher</button>` : ""}</div><div class="etapes">${l.map(e => `<button class="etape ${c.etapes[e.id] ? "faite" : ""}" data-etape-p="${c.id}|${e.id}" aria-pressed="${!!c.etapes[e.id]}"><span class="case">${c.etapes[e.id] ? "✓" : ""}</span><span><b>${esc(e.t)}</b>${c.etapes[e.id] ? `<small>le ${new Date(c.etapes[e.id]).toLocaleDateString("fr-FR")}</small>` : ""}</span></button>`).join("")}</div>`; }).join("")}`;
}

/* Chiffres */
function eChiffres() {
  const r = reglP();
  const signe = P_.clients.filter(c => c.etapes.devis).reduce((t, c) => t + enEur(c, prixVente(c).total) * partNous(c), 0);
  const enc = P_.clients.reduce((t, c) => t + encaisse(c).total * partNous(c), 0);
  const h = P_.clients.reduce((t, c) => t + c.heuresPassees, 0), net = P_.clients.reduce((t, c) => t + gainHeure(c) * c.heuresPassees, 0);
  return `<h1>Chiffres</h1><p class="sous">Ce qui nous revient : au Sénégal, après le relais payé au partenaire et sa commission quand il a apporté le client (${hTexte(r.commission)} %). Le gain net de l'heure compte aussi le portage en France (${hTexte(r.netPortage)} % net). <button class="lien" data-e="mesreglages" data-racine-e>Changer ces taux</button></p>
  <div class="trio"><div><small>Signé</small><b>${fmtEur(signe)}</b><span class="delta">${P_.clients.filter(c => c.etapes.devis).length} clients</span></div><div><small>Encaissé</small><b>${fmtEur(enc)}</b><span class="delta">dont interventions ${fmtEur(P_.clients.reduce((t, c) => t + encaisse(c).interv * partNous(c), 0))}</span></div><div><small>Gain net de l'heure</small><b>${h ? fmtEur(net / h) : "—"}</b><span class="delta">${hTexte(Math.round(h * 10) / 10)} h passées</span></div></div>
  <div class="bento" style="margin-top:14px"><section class="w w-l nu">${gVentesMois()}</section>
  <section class="w w-l"><h3 class="w-titre">Par client</h3><div class="defile"><table class="t"><thead><tr><th>Client</th><th class="n">Pour nous</th><th class="n">Heures prévues</th><th class="n">Heures passées</th><th class="n">Net de l'heure</th></tr></thead><tbody>
  ${P_.clients.filter(c => c.etapes.devis).map(c => `<tr><td>${esc(c.nom)}<br><small>${paysTexte(c)} · ${esc(OFFRES[c.offre].nom)}</small></td><td class="n">${fmtEur(enEur(c, prixVente(c).total) * partNous(c))}</td><td class="n">${hTexte(c.heuresEstimees)} h</td><td class="n ${c.heuresPassees > c.heuresEstimees ? "rouge" : ""}">${hTexte(c.heuresPassees)} h</td><td class="n">${encaisse(c).total ? fmtEur(gainHeure(c)) : "—"}</td></tr>`).join("")}</tbody></table></div>
  <p class="w-note">Quand les heures passées dépassent les heures prévues, le prix de l'offre est trop bas : à recaler après les trois premières installations (TACHES, section 0 bis).</p></section></div>`;
}
// Encaissé et à encaisser, mois par mois, sur six mois
function gVentesMois() {
  const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
  const mois = [...Array(6)].map((_, i) => { const d = new Date(m0); d.setMonth(d.getMonth() - 5 + i); return { d, enc: 0, att: 0 }; });
  const idx = t => mois.findIndex((m, i) => t >= m.d.getTime() && (i === 5 || t < mois[i + 1].d.getTime()));
  P_.clients.forEach(c => {
    const p = enEur(c, prixVente(c).total) * partNous(c);
    if (c.etapes.acompte) { const i = idx(c.etapes.acompte); if (i >= 0) mois[i].enc += .4 * p; }
    if (c.etapes.solde) { const i = idx(c.etapes.solde); if (i >= 0) mois[i].enc += .6 * p; }
    c.interventions.forEach(x => { const i = idx(x.date); if (i < 0) return; if (x.statut === "facturée") mois[i].enc += x.h * heureEur(c) * partNous(c); if (x.statut === "à facturer") mois[i].att += x.h * heureEur(c) * partNous(c); });
    if (c.etapes.devis && !c.etapes.solde) mois[5].att += (c.etapes.acompte ? .6 : 1) * p;
  });
  const max = Math.max(1, ...mois.map(m => m.enc + m.att));
  const W = LARGE(), H = 220, base = 190, haut = 160, g = 56, pas = (W - g) / 6, bw = pas - (W < 500 ? 14 : 30);
  let svg = `<line x1="${g}" x2="${W}" y1="${base}" y2="${base}" stroke="${C.encre}"/>`;
  [.5, 1].forEach(k => { const y = base - haut * k; svg += `<line x1="${g}" x2="${W}" y1="${y}" y2="${y}" stroke="${C.trait}"/><text x="${g - 6}" y="${y + 4}" text-anchor="end">${fmtEur(max * k)}</text>`; });
  mois.forEach((m, i) => {
    const x = g + i * pas + (pas - bw) / 2, h1 = m.enc / max * haut, h2 = m.att / max * haut, nom = m.d.toLocaleDateString("fr-FR", { month: "short" });
    const tip = `${m.d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} : ${fmtEur(m.enc)} encaissés${m.att ? ", " + fmtEur(m.att) + " à encaisser" : ""}`;
    if (h1) svg += barre(x, base - h1, bw, h1, C.retour, "haut", tip);
    if (h2) svg += barre(x, base - h1 - h2 - (h1 ? 2 : 0), bw, h2, C.neutre, "haut", tip);
    svg += `<rect x="${g + i * pas}" y="${base - haut}" width="${pas}" height="${haut}" fill="transparent" data-tip="${esc(tip)}"/><text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${nom}</text>`;
  });
  return cadre("Encaissements, six mois", "Ce qui nous revient, mois par mois, et ce qui reste à encaisser.", legende([[C.retour, "Encaissé"], [C.neutre, "À encaisser"]]) + `<svg viewBox="0 0 ${W} ${H + 4}" role="img" aria-label="Encaissements par mois">${svg}</svg>`);
}

/* ---------------- Régler l'appli d'un client ----------------
   La démo n'a qu'une entreprise à la fois. Quand on règle l'appli d'un client, son réglage (taille de l'équipe, niveau de détail,
   barre du bas, blocs, courbes, droits) se garde dans sa fiche à chaque changement, et se retrouve la fois suivante. */
const metierDemo = () => S.variante || S.metier || "loueur";
const copieP = x => JSON.parse(JSON.stringify(x));
// Le client dont la démo porte le réglage en ce moment. Garde son réglage dans sa fiche s'il a changé.
function clientEnReglage() {
  const c = P_.enReglage && clientP(P_.enReglage);
  if (!c || c.metier !== metierDemo() || (S.entreprise || {}).nom !== c.nom) { if (P_.enReglage) { delete P_.enReglage; sauverP(); } return null; }
  const a = { metier: c.metier, taille: S.taille || "bureau", detail: S.detail || "complet", config: config() }, avant = c.appli || {};
  if (JSON.stringify(a) !== JSON.stringify({ metier: avant.metier, taille: avant.taille, detail: avant.detail, config: avant.config })) { c.appli = Object.assign(copieP(a), { le: Date.now() }); sauverP(); }
  return c;
}
function appliquerAppliP(a) { S.taille = a.taille; S.detail = a.detail; S.config = copieP(a.config); }
// Dans la démo, l'appli prend le métier du client, les modules de son offre, son nom, sa monnaie, et son réglage s'il en a déjà un
function reglerAppliP(id) {
  const c = clientP(id); if (!c) return;
  const autre = metierDemo() !== c.metier;
  if (autre && !confirm(`L'appli de démo passe en « ${METIERS[c.metier].nom} » pour régler ${c.nom}. Continuer ?`)) return rendre();
  if (autre) changerMetier(c.metier);
  // Ses articles importés remplacent les objets de démonstration du métier ; sans liste, la démo du métier revient
  const recharge = chargerListeP(c);
  Object.keys(CATALOGUE).forEach(k => { S.modules[k] = OFFRES[c.offre].inclus.includes(k) || c.modules.includes(k) || (k === "MO-PRET" && S.articles.some(a => logique(a) === "pret")); });
  if (c.appli && c.appli.metier === c.metier && c.appli.config) appliquerAppliP(c.appli);
  else if (recharge || (P_.enReglage && P_.enReglage !== c.id)) S.config = configParDefaut(S.metier, S.taille); // pas le réglage du client précédent
  S.entreprise = Object.assign({}, S.entreprise, { nom: c.nom }); S.monnaie = c.pays === "SN" ? "XOF" : "EUR"; // les montants de son appli et de son devis, dans sa monnaie
  devisOffre = c.offre; devisMode = c.pays === "SN" ? "distance" : (c.mode || "place"); sauver();
  // Des articles à date limite : le bloc « Dates limites proches » s'ajoute à l'accueil du bureau et de la direction
  if (S.suiviLots) ["bureau", "direction"].forEach(r => { const cf = config()[r]; if (cf && !cf.accueil.some(([k]) => k === "peremption")) cf.accueil.push(["peremption", "m"]); });
  sauver();
  P_.enReglage = c.id; sauverP();
  allerE("reglages");
  if (recharge && c.liste) toast(`La démo est chargée avec les ${c.liste.articles.length} articles de ${c.nom}.`);
}
function eReglageAppli() {
  const c = clientEnReglage();
  const autres = P_.clients.filter(x => x.appli && x.appli.config && x.appli.metier === metierDemo() && (!c || x.id !== c.id));
  return `<div class="regl-client">
    ${c ? `<p><b>Réglage de ${esc(c.nom)}.</b> Chaque changement se garde dans sa fiche : vous le retrouvez avec « Régler son appli ».</p>` : `<p><b>Réglage de la démo, sans client.</b> Pour régler et garder l'appli d'un client, choisissez-le ici ou passez par sa fiche.</p>`}
    <div class="regl-choix">
      ${P_.clients.length ? `<label class="champ">${c ? "Passer à un autre client" : "Régler l'appli de"}<select data-regler-choix-p><option value="">Choisir un client…</option>${P_.clients.filter(x => !c || x.id !== c.id).map(x => `<option value="${x.id}">${esc(x.nom)} · ${esc(METIERS[x.metier].nom)}</option>`).join("")}</select></label>` : ""}
      ${autres.length ? `<label class="champ">Reprendre le réglage d'un autre client<select data-reprendre-appli-p><option value="">Choisir un réglage…</option>${autres.map(x => `<option value="${x.id}">${esc(x.nom)} · ${esc(TAILLES_EQUIPE[x.appli.taille] ? TAILLES_EQUIPE[x.appli.taille].nom : "")}</option>`).join("")}</select></label>` : ""}
    </div></div>${vInstallateur(true)}`;
}

/* ---------------- Mes réglages : ce qui se change sans toucher au code ---------------- */
function eMesReglages() {
  const r = reglP(), demo = P_.clients.filter(estDemoP).length, n = P_.clients.length;
  const champ = (cle, titre, attrs, aide) => `<label class="champ">${titre}<input data-regl="${cle}" value="${esc(r[cle])}" ${attrs}>${aide ? `<small>${aide}</small>` : ""}</label>`;
  const nombre = 'type="number" inputmode="decimal" min="0" max="100" step="0.5"', jours = 'type="number" inputmode="numeric" min="1" max="90" step="1"';
  return `<div class="inst dans-espace mes-reglages"><h1>Mes réglages</h1>
  <p class="sous">Ce qui se change ici vaut pour tous les clients, tout de suite, et se garde dans ce navigateur. Les prix des offres et des modules ne se changent pas ici : ils suivent le modèle de devis (docs/23).</p>
  <h2>Mes taux</h2>
  <div class="bloc regl-bloc"><div class="regl-deux">
    ${champ("commission", "Commission d'apporteur au Sénégal, en %", nombre, "Part du total laissée au partenaire quand il a apporté le client.")}
    ${champ("netPortage", "Ce qui reste après le portage en France, en %", nombre, "Sert au gain net de l'heure des clients en France.")}
    ${champ("tarifEur", "Heure d'intervention en France, en € HT", 'type="number" inputmode="decimal" min="1" max="1000" step="1"', `Valeur de départ : ${fmtEur(TARIF_ORIGINE.eur)}.`)}
    ${champ("tarifXof", "Heure d'intervention au Sénégal, en FCFA HT", 'type="number" inputmode="numeric" min="500" max="1000000" step="500"', `Valeur de départ : ${fmtXof(TARIF_ORIGINE.xof)}.`)}</div>
    <p class="w-note">Le tarif de l'heure sert aux interventions à facturer, à l'encaissé, et s'écrit sur les devis faits depuis cet appareil.</p></div>
  <h2>Mes rappels</h2>
  <div class="bloc regl-bloc"><div class="regl-deux">
    ${champ("relanceJours", "Relancer un devis après, en jours", jours, "« Relancer » apparaît dans « À faire » passé ce délai.")}
    ${champ("alerteAssistanceJours", "Prévenir de la fin d'assistance, en jours", jours, "« Fin d'assistance » apparaît quand il reste ce nombre de jours ou moins.")}</div>
    <label class="champ">Message de relance<textarea data-regl="relance" rows="9" maxlength="800">${esc(r.relance)}</textarea><small>Proposé par le bouton « Relancer », à relire avant chaque envoi. Repères remplacés : {contact}, {entreprise}, {date} (envoi du devis), {moi} (votre nom). Vide : le message d'origine revient.</small></label></div>
  <h2>Heures prévues par offre</h2>
  <div class="bloc regl-bloc"><div class="regl-trois">${Object.entries(OFFRES).map(([k, o]) => `<label class="champ">${esc(o.nom)}<input data-regl-heures="${k}" type="number" inputmode="decimal" min="0" max="500" step="0.5" value="${r.heures[k]}"></label>`).join("")}</div>
    <p class="w-note">Proposées à la création d'un client. Elles servent à repérer une offre vendue trop bas ; chaque fiche garde les siennes.</p></div>
  <h2>En-tête du devis</h2>
  <div class="bloc regl-bloc"><div class="regl-deux">
    ${champ("nom", "Mon nom", 'maxlength="60" autocomplete="off"')}
    ${champ("compte", "Mon adresse e-mail", 'type="email" maxlength="80" autocomplete="off"')}</div>
    ${champ("vendeurFR", "Vendeur en France", 'maxlength="120" autocomplete="off" placeholder="Société de portage : nom, SIRET"', "Vide : le devis affiche « [Vendeur, à compléter : docs/17] ».")}
    ${champ("mentionSN", "Mentions au Sénégal", 'maxlength="120" autocomplete="off" placeholder="RCCM et NINEA"', "Vide : le devis affiche « RCCM et NINEA à compléter (docs/24) ».")}</div>
  <h2>Étapes de l'installation <small class="compte-ph">${r.etapes.length}</small></h2>
  <p class="sous">La même liste pour tous les clients. « Marquer livré » apparaît quand « Avant » et « Sur place » sont cochées. Une étape retirée disparaît de toutes les installations ; ce qui était coché reste en mémoire si vous la remettez.</p>
  ${PHASES.map(ph => { const l = r.etapes.filter(e => e.phase === ph);
    return `<h3>${ph}</h3><div class="bloc">${l.map((e, i) => `<div class="w-edit regl-etape"><input type="text" data-etape-nom="${esc(e.id)}" value="${esc(e.t)}" maxlength="140" aria-label="Nom de l'étape">
      <small>${ETAPES_FIXES[e.id] ? "Étape fixe : " + ETAPES_FIXES[e.id] : ""}</small>
      <span class="fl"><button data-etape-bouger="${esc(e.id)}|-1" aria-label="Monter" ${i === 0 ? "disabled" : ""}>↑</button><button data-etape-bouger="${esc(e.id)}|1" aria-label="Descendre" ${i === l.length - 1 ? "disabled" : ""}>↓</button>${ETAPES_FIXES[e.id] ? "" : `<button data-etape-retirer="${esc(e.id)}" aria-label="Retirer">✕</button>`}</span></div>`).join("") || `<p class="vide">Aucune étape.</p>`}
      <div class="w-edit regl-ajout"><input type="text" data-etape-nouvelle="${ph}" maxlength="140" placeholder="Nouvelle étape" aria-label="Nouvelle étape, ${ph}"><button class="btn petit" data-etape-ajouter="${ph}">${iconePlus()}Ajouter</button></div></div>`; }).join("")}
  <p style="margin-top:12px"><button class="btn petit" data-etapes-origine>Revenir aux ${ETAPES_ORIGINE.length} étapes d'origine</button></p>
  <h2>Mes données</h2>
  <div class="bloc regl-bloc"><p style="margin:10px 0 0"><b>${n} client${n > 1 ? "s" : ""}</b>${demo ? `, dont ${demo} de démonstration` : ""}. ${P_.sauvegardeLe ? "Dernière sauvegarde le " + new Date(P_.sauvegardeLe).toLocaleDateString("fr-FR") + "." : "Aucune sauvegarde enregistrée depuis ce navigateur."}</p>
    <p class="w-note">Tout est gardé dans ce navigateur seulement. La sauvegarde est un fichier à ranger ou à reprendre sur un autre appareil : clients, installations, interventions, réglages.</p>
    <div class="boutons" style="margin:12px 0"><button class="btn petit plein" data-export-p>Enregistrer une sauvegarde</button>
      <label class="btn petit">Reprendre une sauvegarde<input type="file" class="cache" accept=".json,application/json" data-import-p></label></div>
    <div class="boutons" style="margin:0 0 12px"><button class="btn petit" data-zero-p>Repartir de zéro</button><button class="btn petit" data-demo-p>Remettre les clients de démonstration</button></div></div></div>`;
}
function exporterP() {
  P_.sauvegardeLe = Date.now(); sauverP();
  const blob = new Blob([JSON.stringify({ type: "stockclair-mon-espace", version: 1, exporteLe: new Date().toISOString(), donnees: P_ }, null, 1)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `mon-espace-${aujourdHui()}.json`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  rendre(); toast("Sauvegarde enregistrée dans vos téléchargements.");
}
function importerP(fichier) {
  const l = new FileReader();
  l.onerror = () => toast("Ce fichier ne se lit pas.");
  l.onload = () => {
    let d; try { d = JSON.parse(l.result); } catch (e) { return toast("Ce fichier n'est pas une sauvegarde de Mon espace."); }
    d = d && d.donnees ? d.donnees : d;
    if (!d || !Array.isArray(d.clients)) return toast("Ce fichier n'est pas une sauvegarde de Mon espace.");
    if (!confirm(`Remplacer les ${P_.clients.length} clients et les réglages actuels par ceux du fichier (${d.clients.length} clients) ?`)) return rendre();
    P_ = normaliserP(d); sauverP(); rendre(); toast(`Sauvegarde reprise : ${P_.clients.length} client${P_.clients.length > 1 ? "s" : ""}.`);
  };
  l.readAsText(fichier);
}

/* ---------------- Saisies ---------------- */
// Nouveau client, client modifié, ou client créé d'après un autre (modele). Le prix se calcule pendant la saisie.
function feuilleClientP(id, modele) {
  const c = id ? clientP(id) : Object.assign({ pays: "FR", mode: "distance", offre: "complet", metier: "loueur", modules: [] }, modele || {});
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tcp" class="saisie-p"><h1 id="tcp" style="font-size:26px">${id ? "Modifier" : "Nouveau client"}</h1>
    ${modele ? `<p class="sous">D'après ${esc(modele.dapres)} : même métier, même offre, mêmes modules${modele.appli ? ", même réglage de l'appli" : ""}.</p>` : ""}
    <h2>L'entreprise</h2>
    <label class="champ">Nom de l'entreprise<input name="nom" maxlength="60" autocomplete="off" value="${esc(c.nom || "")}"></label>
    <label class="champ">Métier<select name="metier">${Object.entries(METIERS).map(([k, m]) => `<option value="${k}" ${c.metier === k ? "selected" : ""}>${m.nom}</option>`).join("")}</select></label>
    <div class="dispo-dates"><label class="champ">Pays<select name="pays"><option value="FR" ${c.pays === "FR" ? "selected" : ""}>France</option><option value="SN" ${c.pays === "SN" ? "selected" : ""}>Sénégal</option></select></label><label class="champ">Ville<input name="ville" maxlength="40" value="${esc(c.ville || "")}"></label></div>
    <div class="dispo-dates"><label class="champ">Contact<input name="contact" maxlength="50" value="${esc(c.contact || "")}"></label><label class="champ">Téléphone<input name="tel" type="tel" maxlength="20" value="${esc(c.tel || "")}"></label></div>
    <label class="champ">E-mail<input name="email" type="email" inputmode="email" maxlength="80" autocomplete="off" value="${esc(c.email || "")}"></label>
    <h2>L'offre</h2>
    <label class="champ">Offre<select name="offre">${Object.entries(OFFRES).map(([k, o]) => `<option value="${k}" ${c.offre === k ? "selected" : ""}>${o.nom}</option>`).join("")}</select></label>
    <label class="champ" data-si="fr">Installation<select name="mode"><option value="distance" ${c.mode !== "place" ? "selected" : ""}>À distance</option><option value="place" ${c.mode === "place" ? "selected" : ""}>Sur place</option></select></label>
    <label class="champ" data-si="sn">Relais sur place, en demi-journées<input name="relais" type="number" inputmode="numeric" min="0" step="1" value="${c.relais || 0}"></label>
    <label class="case" data-si="sn"><input type="checkbox" name="apporteur" ${c.apporteur ? "checked" : ""}>Client apporté par le partenaire</label>
    <label class="champ" data-si="mesure">Prix convenu HT, en euros<input name="prix" type="number" inputmode="decimal" min="0" step="10" value="${c.prixEur || ""}" placeholder="${OFFRES.mesure.eur}"><small>Vide : le prix de départ de l'offre.</small></label>
    <label class="champ">Utilisateurs prévus<input name="utilisateurs" type="number" inputmode="numeric" min="0" step="1" value="${c.utilisateurs || ""}"></label>
    <label class="case"><input type="checkbox" name="essai" ${c.essaiDeduit ? "checked" : ""}>Essai déjà payé, à déduire</label>
    <fieldset class="modules-p"><legend>Modules en plus</legend>${Object.entries(CATALOGUE).map(([k, m]) => `<label class="case"><input type="checkbox" name="mod" value="${k}" ${(c.modules || []).includes(k) ? "checked" : ""}><span>${esc(m.nom)} <small data-compris="${k}" hidden>compris dans l'offre</small></span></label>`).join("")}</fieldset>
    <div class="lignes-p devis-vif" data-vif aria-live="polite"></div>
    <h2>Le suivi</h2>
    <div class="dispo-dates"><label class="champ">Heures prévues<input name="heures" type="number" inputmode="decimal" min="0" step="0.5" value="${c.heuresEstimees || reglP().heures[c.offre]}"></label>
      <label class="champ">Devis envoyé le<input name="devisLe" type="date" max="${aujourdHui()}" value="${c.devisLe ? isoJour(c.devisLe) : ""}"></label></div>
    <p class="w-note">Sans date d'envoi, le client reste « À chiffrer ».</p>
    <label class="champ">Notes<textarea name="notes" rows="2" maxlength="300">${esc(c.notes || "")}</textarea></label>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div>
    ${id ? `<div class="boutons saisie-pied"><button class="btn petit" data-dupliquer>Créer un client d'après celui-ci</button><button class="btn petit rouge" data-supprimer>Supprimer ce client</button></div>` : ""}</div>`);
  const q = n => f.querySelector(`[name=${n}]`), v = n => q(n).value.trim();
  let heuresAuto = !c.heuresEstimees;
  const lire = () => {
    const sn = v("pays") === "SN", iso = v("devisLe");
    return { nom: v("nom"), metier: v("metier"), pays: v("pays"), ville: v("ville"), contact: v("contact"), tel: v("tel"), email: v("email"), offre: v("offre"), mode: v("mode"),
      relais: sn ? Math.max(0, Math.round(+v("relais") || 0)) : 0, utilisateurs: Math.max(0, Math.round(+v("utilisateurs") || 0)), essaiDeduit: q("essai").checked, apporteur: sn && q("apporteur").checked,
      prixEur: v("offre") === "mesure" ? Math.max(0, +v("prix") || 0) : 0, modules: [...f.querySelectorAll("[name=mod]:checked:not(:disabled)")].map(x => x.value), heuresEstimees: Math.max(0, +v("heures") || 0),
      devisLe: iso ? (c.devisLe && isoJour(c.devisLe) === iso ? c.devisLe : new Date(iso + "T12:00:00").getTime()) : null, notes: v("notes") };
  };
  // Ce qui dépend du pays et de l'offre ne s'affiche que quand il sert ; le total suit la saisie
  const maj = () => {
    const d = lire(), sn = d.pays === "SN", o = OFFRES[d.offre];
    f.querySelectorAll("[data-si]").forEach(x => { x.hidden = !({ fr: !sn, sn, mesure: d.offre === "mesure" })[x.dataset.si]; });
    f.querySelectorAll("[name=mod]").forEach(x => { const inclus = o.inclus.includes(x.value); x.disabled = inclus; f.querySelector(`[data-compris="${x.value}"]`).hidden = !inclus; });
    if (heuresAuto) q("heures").value = reglP().heures[d.offre];
    const p = prixVente(lire());
    f.querySelector("[data-vif]").innerHTML = `<div><span>Offre ${esc(o.nom)}, ${modeTexte(d)}</span><b>${p.fmt(p.base)}</b></div>${p.lignes.map(l => `<div><span>${esc(l.t)}</span><b>${l.m ? p.fmt(l.m) : "compris"}</b></div>`).join("")}
      <div class="fort"><span>Total HT${o.aPartirDe ? " (à partir de)" : ""}</span><b>${p.fmt(p.total)}</b></div>${p.alertes.map(a => `<div><span class="rouge">${esc(a)}</span></div>`).join("")}`;
  };
  q("heures").oninput = () => { heuresAuto = false; };
  f.querySelectorAll("select, input").forEach(x => { if (x.name !== "heures") x.addEventListener(x.type === "checkbox" || x.tagName === "SELECT" ? "change" : "input", maj); });
  maj();
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const d = lire();
    if (!d.nom) return toast("Indiquez le nom de l'entreprise.");
    if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) return toast("Vérifiez l'adresse e-mail.");
    if (id) {
      if (P_.enReglage === id && d.nom !== c.nom && (S.entreprise || {}).nom === c.nom) { S.entreprise = Object.assign({}, S.entreprise, { nom: d.nom }); sauver(); }
      Object.assign(c, d); sauverP(); f.remove(); rendre(); return toast("Client enregistré.");
    }
    const nid = nouvelIdP();
    P_.clients.push(Object.assign({ id: nid, creeLe: Date.now(), etapes: {}, heuresPassees: 0, interventions: [] }, modele && modele.appli ? { appli: copieP(modele.appli) } : {}, d));
    f.remove(); sauverP(); allerE("client", nid); toast(d.devisLe ? "Client ajouté." : "Client ajouté. Le devis est prêt à envoyer.");
  };
  if (!id) return;
  f.querySelector("[data-dupliquer]").onclick = () => {
    f.remove();
    feuilleClientP(null, { dapres: c.nom, metier: c.metier, pays: c.pays, ville: c.ville, offre: c.offre, mode: c.mode, relais: c.relais, apporteur: c.apporteur, utilisateurs: c.utilisateurs, prixEur: c.prixEur, modules: c.modules.slice(), heuresEstimees: c.heuresEstimees, appli: c.appli && c.appli.config ? c.appli : null });
  };
  f.querySelector("[data-supprimer]").onclick = () => {
    if (!confirm(`Supprimer ${c.nom} et tout son suivi (installation, interventions, heures) ?`)) return;
    P_.clients = P_.clients.filter(x => x.id !== id); if (P_.enReglage === id) delete P_.enReglage;
    sauverP(); f.remove(); allerE("clients", null, true); toast("Client supprimé.");
  };
}
// Nouvelle intervention, ou intervention modifiée (i : son rang dans la liste). Les heures passées suivent la différence de durée.
function feuilleInterventionP(id, i) {
  const c = clientP(id), a = assistance(c), x = i === undefined ? null : c.interventions[i];
  const choix = [["incluse", "Dans l'assistance incluse"], ["à facturer", "À facturer"]].concat(x && x.statut === "facturée" ? [["facturée", "Facturée"]] : []);
  const coche = x ? x.statut : (a && a.enCours ? "incluse" : "à facturer");
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tip"><h1 id="tip" style="font-size:26px">${x ? "Modifier l'intervention" : "Intervention"}</h1>
    <p class="sous">${a && a.enCours ? `Assistance en cours : ${a.jours} jours et ${hTexte(a.heures)} h restants.` : "Assistance terminée : l'intervention se facture."} Tarif : ${tarifTexte(c)} HT de l'heure.</p>
    <label class="champ">Ce qui a été fait<input name="t" maxlength="100" autocomplete="off" value="${x ? esc(x.t) : ""}"></label>
    <label class="champ">Durée, par quart d'heure<input name="h" type="number" inputmode="decimal" min="0.25" step="0.25" value="${x ? x.h : 0.5}"></label>
    <div class="choix" role="radiogroup" aria-label="Facturation">${choix.map(([k, t]) => `<label><input type="radio" name="statut" value="${k}" ${k === coche ? "checked" : ""}>${t}</label>`).join("")}</div>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const t = f.querySelector("[name=t]").value.trim(), h = Math.max(.25, Math.round((+f.querySelector("[name=h]").value || .5) * 4) / 4), statut = f.querySelector("[name=statut]:checked").value;
    if (!t) return toast("Décrivez l'intervention.");
    const avant = x ? x.h : 0;
    if (x) Object.assign(x, { t, h, statut }); else c.interventions.push({ date: Date.now(), h, t, statut });
    c.heuresPassees = Math.max(0, Math.round((c.heuresPassees + h - avant) * 100) / 100);
    sauverP(); f.remove(); rendre(); toast(x ? "Intervention modifiée, heures passées corrigées." : "Intervention notée, et ajoutée aux heures passées.");
  };
}
// Relance d'un devis envoyé et pas encore signé : un message déjà écrit (Mes réglages), à relire avant de l'envoyer
function texteRelanceP(c) {
  const rempl = { contact: c.contact || "", entreprise: c.nom, date: c.devisLe ? new Date(c.devisLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "", moi: moiP().complet };
  return reglP().relance.replace(/\{(contact|entreprise|date|moi)\}/g, (m, k) => rempl[k]).replace(/ +,/g, ",").replace(/[ \t]+\n/g, "\n");
}
function feuilleRelanceP(id) {
  const c = clientP(id), J = 86400000, tel = (c.tel || "").replace(/\D/g, "").replace(/^0/, "33"), n = (tel ? 1 : 0) + (c.email ? 1 : 0);
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="trl" class="saisie-p"><h1 id="trl" style="font-size:26px">Relancer</h1>
    <p class="sous">${esc(c.nom)} · devis envoyé il y a ${Math.round((Date.now() - c.devisLe) / J)} jours${c.relanceLe ? `, déjà relancé le ${new Date(c.relanceLe).toLocaleDateString("fr-FR")}` : ""}. Relisez le message et changez-le si besoin avant de l'envoyer.</p>
    <label class="champ">Message<textarea name="m" rows="10" maxlength="1200">${esc(texteRelanceP(c))}</textarea></label>
    ${n ? "" : `<p class="w-note">Ni téléphone ni e-mail dans la fiche : copiez le message, ou complétez la fiche avec « Modifier ».</p>`}
    <div class="valider ${n === 2 ? "trois" : ""}"><button class="btn" data-x>Annuler</button>${tel ? `<button class="btn plein" data-par="wa">WhatsApp</button>` : ""}${c.email ? `<button class="btn ${tel ? "" : "plein"}" data-par="mel">E-mail</button>` : ""}${n ? "" : `<button class="btn plein" data-par="copie">Copier le message</button>`}</div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelectorAll("[data-par]").forEach(b => b.onclick = () => {
    const m = f.querySelector("[name=m]").value.trim();
    if (!m) return toast("Le message est vide.");
    if (b.dataset.par === "wa") window.open(`https://wa.me/${tel}?text=${encodeURIComponent(m)}`, "_blank", "noopener");
    else if (b.dataset.par === "mel") window.open(`mailto:${encodeURIComponent(c.email).replace(/%40/g, "@")}?subject=${encodeURIComponent("Votre devis Stockclair")}&body=${encodeURIComponent(m)}`, "_self");
    else if (navigator.clipboard) navigator.clipboard.writeText(m).catch(() => {});
    c.relanceLe = Date.now(); sauverP(); f.remove(); rendre(); toast(b.dataset.par === "copie" ? "Message copié. Relance notée aujourd'hui." : "Relance notée aujourd'hui.");
  });
}
// Devis du client, avec notre en-tête
const numeroDevisP = c => `D-${new Date(c.devisLe || Date.now()).getFullYear()}-${String(c.id).slice(2)}`;
function texteDevisP(c) {
  const p = prixVente(c), o = OFFRES[c.offre];
  return `Devis ${numeroDevisP(c)} pour ${c.nom}
Offre ${o.nom}, installation ${modeTexte(c)} : ${p.fmt(p.base)}
${p.lignes.map(l => `${l.t} : ${l.m ? p.fmt(l.m) : "compris"}`).join("\n")}${p.lignes.length ? "\n" : ""}Total HT${o.aPartirDe ? " (à partir de)" : ""} : ${p.fmt(p.total)}
Acompte à la commande, 40 % : ${p.fmt(.4 * p.total)}
Solde à la livraison, 60 % : ${p.fmt(.6 * p.total)}
Paiement unique, aucun abonnement. Assistance comprise : ${o.jours} jours et ${o.heures} h. Devis valable 30 jours.
${moiP().complet}`;
}
function feuilleDevisP(id) {
  const c = clientP(id), p = prixVente(c), o = OFFRES[c.offre], sn = c.pays === "SN", moi = moiP(), r = reglP();
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-label="Devis"><div class="feuille-doc">
    <header class="doc-tete"><div class="doc-emetteur"><img src="icone.svg" alt="Stockclair"><div><b>${esc(sn ? moi.complet : r.vendeurFR || "[Vendeur, à compléter : docs/17]")}</b><br>${esc(sn ? r.mentionSN || "RCCM et NINEA à compléter (docs/24)" : moi.complet)}<br>${esc(moi.compte)}</div></div>
    <div class="doc-titre"><h1>Devis</h1><p>N° <b>${numeroDevisP(c)}</b><br>Valable 30 jours</p></div></header>
    <div class="doc-parties"><div><small>Client</small><b>${esc(c.nom)}</b>${c.contact ? "<br>" + esc(c.contact) : ""}${c.tel ? "<br>" + esc(c.tel) : ""}<br>${esc(c.ville)}</div><div><small>Offre</small><b>${esc(o.nom)}</b><br>${o.sites} site${o.sites === 1 ? "" : "s"}, ${o.utilisateurs} utilisateurs, ${o.etiquettes} étiquettes<br>Installation ${modeTexte(c)}</div></div>
    <table><thead><tr><th>Désignation</th><th class="n">Montant HT</th></tr></thead><tbody>
    <tr><td>Offre ${esc(o.nom)} : paramétrage, étiquettes, ${esc(p.installation)}, assistance ${o.jours} jours et ${o.heures} h à distance${o.inclus.length ? `<br><small>Compris : ${o.inclus.map(k => esc(CATALOGUE[k].nom)).join(", ")}</small>` : ""}</td><td class="n">${p.fmt(p.base)}</td></tr>
    ${p.lignes.map(l => `<tr><td>${esc(l.t)}<br><small>${esc(l.d)}</small></td><td class="n">${l.m ? p.fmt(l.m) : "compris"}</td></tr>`).join("")}</tbody>
    <tfoot><tr class="fort"><td>Total HT${o.aPartirDe ? " (à partir de)" : ""}</td><td class="n">${p.fmt(p.total)}</td></tr><tr><td>Acompte à la commande, 40 %</td><td class="n">${p.fmt(.4 * p.total)}</td></tr><tr><td>Solde à la livraison, 60 %</td><td class="n">${p.fmt(.6 * p.total)}</td></tr></tfoot></table>
    <div class="doc-conditions"><p>Paiement unique, aucun abonnement. Les licences Google sont payées directement par le client. Après l'assistance incluse, interventions à ${tarifTexte(c)} HT de l'heure, sur devis. Un module ajouté après la livraison coûte ${p.fmt(PRIX_MODULE_APRES[sn ? "xof" : "eur"])} HT, sur un nouveau devis. TVA en sus selon la réglementation applicable.</p></div>
    <div class="sign"><div>Pour le vendeur</div><div>Bon pour accord, date et signature du client</div></div></div>
    <div class="valider trois"><button class="btn" data-x>Fermer</button><button class="btn" data-msg>${I.partager}En message</button><button class="btn plein" data-ok>${I.imprimer}Imprimer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-msg]").onclick = () => partagerTexte(texteDevisP(c));
  f.querySelector("[data-ok]").onclick = () => { document.body.classList.add("impression-feuille"); window.print(); setTimeout(() => document.body.classList.remove("impression-feuille"), 500); };
}

function brancherEspace() {
  if (!installateur || session) return;
  $$("[data-e]").forEach(b => b.onclick = () => { if (b.dataset.filtreVers) { filtreP = b.dataset.filtreVers; chercheP = ""; } allerE(b.dataset.e, b.dataset.earg || null, b.hasAttribute("data-racine-e")); });
  $$("[data-filtre-p]").forEach(b => b.onclick = () => { filtreP = b.dataset.filtreP; rendre(); });
  $$("[data-cherche-p]").forEach(i => { i.oninput = () => { chercheP = i.value; filtrerClientsP(); }; if (chercheP) filtrerClientsP(); });
  $$("[data-etape-p]").forEach(b => b.onclick = () => {
    const [id, e] = b.dataset.etapeP.split("|"), c = clientP(id);
    if (c.etapes[e]) delete c.etapes[e]; else c.etapes[e] = Date.now();
    if (e === "devis" && c.etapes.devis && !c.prevuLe && !c.livreLe) toast("Devis signé : fixez la date d'installation.");
    sauverP(); rendre();
  });
  $$("[data-phase-p]").forEach(b => b.onclick = () => {
    const [id, ph] = b.dataset.phaseP.split("|"), c = clientP(id), t = Date.now();
    etapesP().filter(e => e.phase === ph && !c.etapes[e.id]).forEach(e => { c.etapes[e.id] = t; });
    sauverP(); rendre(); toast(`« ${ph} » : tout est coché.`);
  });
  $$("[data-devis-envoye-p]").forEach(b => b.onclick = () => { clientP(b.dataset.devisEnvoyeP).devisLe = Date.now(); sauverP(); rendre(); toast("Devis noté envoyé aujourd'hui."); });
  $$("[data-signe-p]").forEach(b => b.onclick = () => { const c = clientP(b.dataset.signeP); c.etapes.devis = Date.now(); sauverP(); allerE("installation", c.id); toast("Devis signé : fixez la date d'installation."); });
  $$("[data-date-p]").forEach(i => i.onchange = () => { clientP(i.dataset.dateP).prevuLe = i.value; sauverP(); rendre(); toast(i.value ? "Date d'installation enregistrée." : "Date d'installation retirée."); });
  $$("[data-livre-le-p]").forEach(i => i.onchange = () => {
    const c = clientP(i.dataset.livreLeP);
    if (i.value) { c.livreLe = new Date(i.value + "T12:00:00").getTime(); toast("Date de livraison corrigée : l'assistance est recalculée."); }
    else if (confirm(`Annuler la livraison de ${c.nom} ? L'assistance ne court plus.`)) { delete c.livreLe; toast("Livraison annulée."); }
    sauverP(); rendre();
  });
  $$("[data-livrer-p]").forEach(b => b.onclick = () => { const c = clientP(b.dataset.livrerP); c.livreLe = Date.now(); delete c.prevuLe; sauverP(); rendre(); toast(`Livré. L'assistance de ${OFFRES[c.offre].jours} jours commence aujourd'hui.`); });
  $$("[data-heures-p]").forEach(b => b.onclick = () => { const [id, h] = b.dataset.heuresP.split("|"), c = clientP(id); c.heuresPassees = Math.max(0, Math.round((c.heuresPassees + +h) * 100) / 100); sauverP(); rendre(); });
  $$("[data-facturer-p]").forEach(b => b.onclick = () => { const [id, i] = b.dataset.facturerP.split("|"); clientP(id).interventions[+i].statut = "facturée"; sauverP(); rendre(); toast("Intervention marquée facturée."); });
  $$("[data-retirer-interv-p]").forEach(b => b.onclick = () => {
    const [id, i] = b.dataset.retirerIntervP.split("|"), c = clientP(id), x = c.interventions[+i];
    if (!confirm(`Retirer l'intervention « ${x.t} » ? Ses ${hTexte(x.h)} h sont retirées des heures passées.`)) return;
    c.interventions.splice(+i, 1); c.heuresPassees = Math.max(0, Math.round((c.heuresPassees - x.h) * 100) / 100);
    sauverP(); rendre(); toast("Intervention retirée.");
  });
  $$("[data-intervention-p]").forEach(b => b.onclick = () => feuilleInterventionP(b.dataset.interventionP));
  $$("[data-modifier-interv-p]").forEach(b => b.onclick = () => { const [id, i] = b.dataset.modifierIntervP.split("|"); feuilleInterventionP(id, +i); });
  $$("[data-relancer-p]").forEach(b => b.onclick = () => feuilleRelanceP(b.dataset.relancerP));
  $$("[data-devis-p]").forEach(b => b.onclick = () => feuilleDevisP(b.dataset.devisP));
  $$("[data-modifier-p]").forEach(b => b.onclick = () => feuilleClientP(b.dataset.modifierP));
  // Régler l'appli du client : depuis sa fiche, ou depuis l'écran de réglage
  $$("[data-regler-p]").forEach(b => b.onclick = () => reglerAppliP(b.dataset.reglerP));
  $$("[data-regler-choix-p]").forEach(s => s.onchange = () => { if (s.value) reglerAppliP(s.value); });
  $$("[data-reprendre-appli-p]").forEach(s => s.onchange = () => {
    const x = clientP(s.value); if (!x) return;
    if (!confirm(`Remplacer le réglage affiché (taille de l'équipe, détail, barre, blocs, droits) par celui de ${x.nom} ?`)) return rendre();
    appliquerAppliP(x.appli); sauver(); rendre(); toast(`Réglage de ${x.nom} repris.`);
  });

  // Mes réglages
  $$("[data-regl]").forEach(i => i.onchange = () => { reglP()[i.dataset.regl] = i.value; normaliserP(P_); i.value = reglP()[i.dataset.regl]; sauverP(); toast("Réglage enregistré."); });
  $$("[data-regl-heures]").forEach(i => i.onchange = () => { reglP().heures[i.dataset.reglHeures] = i.value; normaliserP(P_); i.value = reglP().heures[i.dataset.reglHeures]; sauverP(); toast("Réglage enregistré."); });
  $$("[data-etape-nom]").forEach(i => i.onchange = () => {
    const e = etapesP().find(x => x.id === i.dataset.etapeNom), t = i.value.trim();
    if (!t) { i.value = e.t; return toast("Une étape porte un nom. Pour l'enlever, touchez ✕."); }
    e.t = t; sauverP(); toast("Étape renommée.");
  });
  $$("[data-etape-bouger]").forEach(b => b.onclick = () => {
    const [id, d] = b.dataset.etapeBouger.split("|"), l = etapesP(), i = l.findIndex(x => x.id === id);
    let j = i + +d; while (l[j] && l[j].phase !== l[i].phase) j += +d;
    if (!l[j]) return;
    [l[i], l[j]] = [l[j], l[i]]; sauverP(); rendre();
  });
  $$("[data-etape-retirer]").forEach(b => b.onclick = () => {
    const l = etapesP(), i = l.findIndex(x => x.id === b.dataset.etapeRetirer);
    if (i < 0 || ETAPES_FIXES[l[i].id] || !confirm(`Retirer l'étape « ${l[i].t} » de toutes les installations ?`)) return;
    l.splice(i, 1); sauverP(); rendre(); toast("Étape retirée.");
  });
  const ajouterEtape = ph => {
    const i = $(`[data-etape-nouvelle="${ph}"]`), t = i.value.trim();
    if (!t) { i.focus(); return toast("Écrivez le nom de l'étape."); }
    const l = etapesP(), dernier = l.map(e => e.phase).lastIndexOf(ph);
    l.splice(dernier < 0 ? l.length : dernier + 1, 0, { id: "e" + Date.now().toString(36), phase: ph, t: t.slice(0, 140) });
    sauverP(); rendre(); toast("Étape ajoutée.");
  };
  $$("[data-etape-ajouter]").forEach(b => b.onclick = () => ajouterEtape(b.dataset.etapeAjouter));
  $$("[data-etape-nouvelle]").forEach(i => i.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); ajouterEtape(i.dataset.etapeNouvelle); } });
  $$("[data-etapes-origine]").forEach(b => b.onclick = () => {
    if (!confirm(`Remettre les ${ETAPES_ORIGINE.length} étapes d'origine ? Les étapes ajoutées et les noms changés sont perdus.`)) return;
    reglP().etapes = ETAPES_ORIGINE.map(e => Object.assign({}, e)); sauverP(); rendre(); toast("Étapes d'origine remises.");
  });
  $$("[data-export-p]").forEach(b => b.onclick = exporterP);
  $$("[data-import-p]").forEach(i => i.onchange = () => { if (i.files[0]) importerP(i.files[0]); i.value = ""; });
  $$("[data-zero-p]").forEach(b => b.onclick = () => {
    if (!confirm(`Retirer les ${P_.clients.length} clients de Mon espace ? Vos réglages sont gardés. Enregistrez une sauvegarde avant pour pouvoir revenir en arrière.`)) return;
    P_.clients = []; delete P_.enReglage; relectureP = null; sauverP(); rendre(); toast("Mon espace est vide. Le bouton « + » crée le premier client.");
  });
  brancherListeP();
  $$("[data-demo-p]").forEach(b => b.onclick = () => {
    if (!confirm(`Remplacer les ${P_.clients.length} clients actuels par les cinq clients de démonstration ? Vos réglages sont gardés.`)) return;
    P_.clients = normaliserP({ clients: pilotageDemo().clients, reglages: reglP() }).clients; delete P_.enReglage; sauverP(); rendre(); toast("Clients de démonstration remis.");
  });
}

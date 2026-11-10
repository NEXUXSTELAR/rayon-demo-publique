"use strict";
/* Mon espace : l'outil de l'installateur, c'est-à-dire nous.
   Ses clients, une fiche par client, l'installation guidée à cocher, ses chiffres, et le réglage de l'appli du client.
   Ses données sont gardées à part de la démo : elles ne s'effacent pas quand on change de métier ou qu'on remet la démo à zéro.
   En vrai, elles vivront dans le classeur de pilotage (appsheet/apps-script-pilotage/Pilotage.gs). Chargé avant app.js. */

const CLE_PILOTAGE = "rayon-pilotage-v1";
const MON_COMPTE = { nom: "Souleymane", complet: "Souleymane Diouf", compte: "souleymane.diouf.pro@gmail.com" };
// Hypothèses de calcul, à remplacer par les vrais chiffres (TACHES, section 0 bis)
const PART_NOUS_SN = 0.6;    // au Sénégal, la société partenaire garde environ 40 %
const NET_PORTAGE_FR = 0.5;  // en France, ce qui reste après le portage salarial (simulateur)
const ETAPES_INSTALL = [
  { id: "devis", phase: "Avant", t: "Devis signé" },
  { id: "acompte", phase: "Avant", t: "Acompte de 40 % reçu" },
  { id: "articles", phase: "Avant", t: "Liste des articles reçue : noms, quantités, emplacements" },
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

/* ---------------- Données ---------------- */
function pilotageDemo() {
  const J = 86400000, n = Date.now(), fait = (ids, il) => Object.fromEntries(ids.map(k => [k, n - il * J]));
  const avant = ["devis", "acompte", "articles", "google", "classeur", "reglage", "plan_etiq"], tout = ETAPES_INSTALL.map(e => e.id);
  return { clients: [
    { id: "C-01", nom: "Location Fêtes (démo)", metier: "loueur", pays: "SN", ville: "Dakar", contact: "Mme Ndiaye", tel: "+221 70 000 00 01", offre: "complet", modules: ["MO-RES", "MO-KIT"], relais: 2, devisLe: n - 45 * J, livreLe: n - 20 * J, etapes: fait(tout, 21), heuresEstimees: 14, heuresPassees: 16.5,
      interventions: [{ date: n - 9 * J, h: 0.75, t: "Ajout de deux kits", statut: "incluse" }, { date: n - 3 * J, h: 0.75, t: "Nouveau magasinier : identifiant et formation", statut: "incluse" }], notes: "Client pilote au Sénégal, par la société partenaire." },
    { id: "C-02", nom: "Atelier Élec (démo)", metier: "artisan", pays: "FR", ville: "Toulouse", contact: "M. Martin", tel: "06 00 00 00 21", offre: "demarrage", mode: "place", modules: [], devisLe: n - 12 * J, prevuLe: isoJour(n + 5 * J), etapes: fait(["devis", "acompte", "articles", "google"], 4), heuresEstimees: 8, heuresPassees: 2, interventions: [], notes: "" },
    { id: "C-03", nom: "Le Comptoir (démo)", metier: "restaurant", pays: "FR", ville: "Montreuil", contact: "Mme Bernard", tel: "06 00 00 00 31", offre: "complet", mode: "distance", essaiDeduit: true, modules: ["AL-WA"], devisLe: n - 9 * J, etapes: {}, heuresEstimees: 13, heuresPassees: 1, interventions: [], notes: "Veut les dates limites et la consommation par service." },
    { id: "C-04", nom: "Projet Santé Solidaire (démo)", metier: "ong", pays: "SN", ville: "Thiès", contact: "Mme Faye", tel: "+221 77 000 00 41", offre: "mesure", prixEur: 4400, modules: [], devisLe: n - 130 * J, livreLe: n - 100 * J, etapes: fait(tout, 101), heuresEstimees: 32, heuresPassees: 38,
      interventions: [{ date: n - 70 * J, h: 2, t: "Rapport par bailleur", statut: "incluse" }, { date: n - 6 * J, h: 1.5, t: "Nouvel entrepôt à Kaolack", statut: "facturée" }], notes: "" },
    { id: "C-05", nom: "Quincaillerie du Centre (démo)", metier: "distribution", pays: "SN", ville: "Dakar", contact: "M. Sow", tel: "+221 76 000 00 51", offre: "demarrage", modules: [], devisLe: n - 70 * J, livreLe: n - 50 * J, etapes: fait(tout.filter(k => k !== "note"), 50), heuresEstimees: 8, heuresPassees: 9,
      interventions: [{ date: n - 2 * J, h: 1, t: "Import de 120 nouvelles références", statut: "à facturer" }], notes: "" },
  ] };
}
let P_ = (() => { try { const s = JSON.parse(localStorage.getItem(CLE_PILOTAGE)); if (s && s.clients) return s; } catch (e) { /* stockage bloqué */ } return pilotageDemo(); })();
const sauverP = () => { try { localStorage.setItem(CLE_PILOTAGE, JSON.stringify(P_)); } catch (e) { /* mode privé */ } };
const clientP = id => P_.clients.find(c => c.id === id);

/* ---------------- Calculs ---------------- */
const fmtEur = n => Math.round(n).toLocaleString("fr-FR") + " €";
const fmtXof = n => Math.round(n).toLocaleString("fr-FR") + " FCFA";
// Prix de vente HT : règles communes de calculerDevis (data.js, docs/23). France sur place ou à distance ; Sénégal à distance.
// Les anciens clients sans mode sont comptés sur place en France.
function prixVente(c) {
  return calculerDevis({ offre: c.offre, pays: c.pays, mode: c.mode || "place", modules: c.modules || [], utilisateurs: c.utilisateurs || 0, relais: c.relais || 0, essaiDeduit: !!c.essaiDeduit, prixEur: c.prixEur || 0 });
}
const modeTexte = c => c.pays === "SN" ? "à distance" + (c.relais ? `, relais ${c.relais} demi-journée${c.relais > 1 ? "s" : ""}` : "") : (c.mode === "distance" ? "à distance" : "sur place");
const enEur = (c, v) => c.pays === "SN" ? v / EUR_XOF : v;
// Prix d'une heure d'intervention, en euros pour les calculs ; affiché dans la monnaie du client
const heureEur = c => c.pays === "SN" ? TARIF_INTERVENTION.xof / EUR_XOF : TARIF_INTERVENTION.eur;
const prixHeures = (c, h) => c.pays === "SN" ? fmtXof(h * TARIF_INTERVENTION.xof) : fmtEur(h * TARIF_INTERVENTION.eur);
const partNous = c => c.pays === "SN" ? PART_NOUS_SN : 1;
function encaisse(c) {
  const p = enEur(c, prixVente(c).total);
  const vente = (c.etapes.acompte ? .4 * p : 0) + (c.etapes.solde ? .6 * p : 0);
  const interv = c.interventions.filter(i => i.statut === "facturée").reduce((t, i) => t + i.h * heureEur(c), 0);
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
const avancement = c => ETAPES_INSTALL.filter(e => c.etapes[e.id]).length;
function statutP(c) {
  if (!c.etapes.devis) return c.devisLe ? { t: "Devis envoyé", c: "s-confirme" } : { t: "À chiffrer", c: "" };
  if (!c.livreLe) return { t: c.prevuLe ? "Installation le " + dateCourte(c.prevuLe) : "Signé", c: "s-prpare" };
  const a = assistance(c);
  return a.enCours ? { t: "Assistance en cours", c: "s-revenue" } : { t: "Assistance terminée", c: "" };
}
// Gain net estimé de l'heure, sur ce qui est déjà encaissé
const gainHeure = c => c.heuresPassees ? encaisse(c).total * partNous(c) * (c.pays === "FR" ? NET_PORTAGE_FR : 1) / c.heuresPassees : 0;

/* ---------------- Ce qui attend ---------------- */
function tachesP() {
  const l = [], J = 86400000;
  P_.clients.forEach(c => {
    const a = assistance(c);
    if (c.devisLe && !c.etapes.devis && Date.now() - c.devisLe > 7 * J) l.push({ c: "attention", i: I.bon, t: "Relancer · " + c.nom, s: `Devis envoyé il y a ${Math.round((Date.now() - c.devisLe) / J)} jours`, cl: c.id });
    if (c.prevuLe && !c.livreLe) { const reste = ETAPES_INSTALL.filter(e => e.phase === "Avant" && !c.etapes[e.id]).length; l.push({ c: "sortie", i: I.camion, t: "Installer · " + c.nom, s: `Le ${dateCourte(c.prevuLe)} à ${c.ville}${reste ? ` · ${reste} étape${reste > 1 ? "s" : ""} à préparer` : " · tout est prêt"}`, p: avancement(c) / ETAPES_INSTALL.length, inst: c.id }); }
    if (a && a.enCours && a.jours <= 15) l.push({ c: "compter", i: I.abo, t: "Fin d'assistance · " + c.nom, s: `Dans ${a.jours} jours : prévenir et proposer les interventions`, cl: c.id });
    c.interventions.filter(x => x.statut === "à facturer").forEach(x => l.push({ c: "retour", i: I.argent, t: "Facturer · " + c.nom, s: `${x.t} · ${String(x.h).replace(".", ",")} h · ${prixHeures(c, x.h)}`, cl: c.id }));
    if (c.livreLe && !c.etapes.solde) l.push({ c: "alerte", i: I.argent, t: "Solde à encaisser · " + c.nom, s: prixVente(c).fmt(.6 * prixVente(c).total), cl: c.id });
    if (c.livreLe && ETAPES_INSTALL.some(e => !c.etapes[e.id])) l.push({ c: "attention", i: I.compter, t: "Installation à terminer · " + c.nom, s: ETAPES_INSTALL.filter(e => !c.etapes[e.id]).map(e => e.t).join(", "), inst: c.id });
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
const VUES_E = { tableau: { t: "Tableau", i: "maison" }, clients: { t: "Clients", i: "equipe" }, installations: { t: "Installations", i: "compter" }, chiffres: { t: "Chiffres", i: "releve" }, reglages: { t: "Réglage de l'appli", i: "reglages" } };

function coqueEspace() {
  const nom = vueE.nom, parent = { client: "clients", installation: "installations" }[nom] || nom;
  const corps = ({ tableau: eTableau, clients: eClients, client: eClient, installations: eInstallations, installation: eInstallation, chiffres: eChiffres, reglages: () => vInstallateur(true) })[nom] || eTableau;
  const courant = k => k === parent ? 'aria-current="page"' : "";
  const titre = { client: "Client", installation: "Installation guidée" }[nom] || VUES_E[nom].t;
  const nav = Object.entries(VUES_E).map(([k, v]) => `<button data-e="${k}" data-racine-e ${courant(k)}>${I[v.i]}<span>${v.t}</span></button>`).join("");
  return `<div class="app espace">${DEMO}
    <aside class="cote" aria-label="Menu">
      <div class="marque">${I.logo}<span>Mon espace</span></div>
      <button class="btn plein" data-act="nouveauClientP">${iconePlus()}Nouveau client</button>
      <nav>${nav}<h4>Démo</h4><button data-act="voirDemoClient">${I.fleche}<span>Ouvrir l'appli client</span></button></nav>
      <div class="cote-pied"><div class="moi"><span class="avatar direction">S</span><span><b>${MON_COMPTE.complet}</b><small>${MON_COMPTE.compte}</small></span></div>
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
      <button data-act="plusE" ${["installations", "reglages"].includes(parent) ? 'aria-current="page"' : ""}>${I.grille}<span>Plus</span></button>
    </nav></div>`;
}
function feuillePlusE() {
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-label="Mon espace">
    <div class="plus-moi"><span class="avatar grand direction">S</span><div><b>${MON_COMPTE.complet}</b><small>${MON_COMPTE.compte}</small></div></div>
    <h2>Mon espace</h2><div class="plus-grille">${Object.entries(VUES_E).map(([k, v]) => `<button data-k="${k}"><span class="pastille">${I[v.i]}</span>${v.t}</button>`).join("")}<button data-a="voirDemoClient"><span class="pastille">${I.fleche}</span>Appli client</button></div>
    <div class="valider"><button class="btn" data-a="reglages">${I.reglages}Thème</button><button class="btn" data-a="quitterInstallateur">${I.sortir}Quitter</button></div></div>`);
  f.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { f.remove(); allerE(b.dataset.k, null, true); });
  f.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { f.remove(); ACTIONS[b.dataset.a](); });
}

/* Tableau : le centre de commande de l'installateur */
function eTableau() {
  const h = new Date().getHours(), an = new Date().getFullYear(), debut = new Date(an, 0, 1).getTime();
  const enc = P_.clients.reduce((t, c) => t + encaisse(c).total * partNous(c), 0), att = P_.clients.reduce((t, c) => t + aEncaisser(c) * partNous(c), 0);
  const actifs = P_.clients.filter(c => assistance(c) && assistance(c).enCours).length, prevus = P_.clients.filter(c => c.prevuLe && !c.livreLe).length;
  const devis = P_.clients.filter(c => c.devisLe && !c.etapes.devis).length, aFact = P_.clients.reduce((t, c) => t + c.interventions.filter(i => i.statut === "à facturer").length, 0);
  const l = tachesP();
  const tache = x => `<li><button class="tache c-${x.c}" ${x.inst ? `data-e="installation" data-earg="${x.inst}"` : `data-e="client" data-earg="${x.cl}"`}><span class="pastille">${x.i}</span><span><b>${esc(x.t)}</b><small>${esc(x.s)}</small>${x.p !== undefined ? `<i class="barre"><i style="width:${Math.round(x.p * 100)}%"></i></i>` : ""}</span><span class="chev">${I.fleche}</span></button></li>`;
  const puce = (vers, coul, n, txt) => `<button class="puce" data-e="${vers}" data-racine-e><i style="--c:${coul}"></i><b>${compte(n)}</b><span>${txt}</span></button>`;
  const prochaines = P_.clients.filter(c => c.prevuLe && !c.livreLe).sort((a, b) => a.prevuLe.localeCompare(b.prevuLe));
  return `<div class="salut"><p class="date">${dateLongue(aujourdHui())}</p><h1>${h >= 18 || h < 5 ? "Bonsoir" : "Bonjour"} ${MON_COMPTE.nom}</h1></div>
  <div class="bento">
    <section class="w w-l nu" style="--i:0"><div class="pouls">
      <div class="pouls-tete"><div><small>Pour nous, encaissé en ${an}</small><b class="pouls-chiffre">${compte(Math.round(enc), "n")} €</b><span class="pouls-delta">${fmtEur(att)} encore à encaisser</span></div>
        <button class="rond clair" data-e="chiffres" data-racine-e aria-label="Voir les chiffres">${I.fleche}</button></div>
      <div class="pouls-puces" style="margin-top:16px">${puce("clients", "var(--retour)", actifs, "en assistance")}${puce("installations", "var(--sortie)", prevus, "à installer")}${puce("clients", "var(--marque)", devis, "devis en attente")}${puce("clients", "var(--compter)", aFact, "à facturer")}</div>
    </div></section>
    <section class="w w-m" style="--i:1"><h3 class="w-titre">À faire ${l.length ? `<span class="compte">${l.length}</span>` : ""}</h3>${l.length ? `<ul class="taches">${l.map(tache).join("")}</ul>` : `<p class="vide">Rien en attente.</p>`}</section>
    <section class="w w-m" style="--i:2"><h3 class="w-titre">${I.camion}Prochaines installations</h3>
      ${prochaines.map(c => `<button class="client" data-e="installation" data-earg="${c.id}"><span class="avatar">${esc(initiales(c.nom))}</span><span><b>${esc(c.nom)}</b><small>${dateLongue(c.prevuLe)} · ${esc(c.ville)}</small></span>${anneau(avancement(c), ETAPES_INSTALL.length, "var(--sortie)", avancement(c) + "/" + ETAPES_INSTALL.length, "", true).replace('class="anneau petit"', 'class="anneau petit mini"')}</button>`).join("") || `<p class="vide">Aucune installation prévue.</p>`}
      <p style="margin-top:10px"><button class="btn petit" data-act="nouveauClientP">${iconePlus()}Nouveau client</button></p></section>
    <section class="w w-l nu" style="--i:3">${gVentesMois()}</section>
  </div>`;
}

/* Clients */
let filtreP = "tous";
function eClients() {
  const f = { tous: () => true, cours: c => !c.livreLe, livres: c => !!c.livreLe }[filtreP];
  const l = P_.clients.filter(f).sort((a, b) => (b.devisLe || 0) - (a.devisLe || 0));
  return `<h1>Clients</h1><p class="sous">Chaque installation, de la proposition à la fin de l'assistance.</p>
  <div class="segments" role="group" aria-label="Filtre">${[["tous", "Tous"], ["cours", "En cours"], ["livres", "Livrés"]].map(([k, t]) => `<button data-filtre-p="${k}" aria-pressed="${filtreP === k}">${t}</button>`).join("")}</div>
  <div class="clients">${l.map(c => {
    const s = statutP(c), p = prixVente(c), a = assistance(c);
    return `<button class="client client-p" data-e="client" data-earg="${c.id}"><span class="avatar">${esc(initiales(c.nom))}</span>
      <span><b>${esc(c.nom)}</b><small>${esc(METIERS[c.metier].nom)} · ${esc(c.ville)} · ${c.pays === "SN" ? "Sénégal" : "France"}</small>
        <span class="client-etat"><span class="statut ${s.c}">${esc(s.t)}</span>${a && a.enCours ? `<small>${a.jours} j et ${String(a.heures).replace(".", ",")} h restants</small>` : ""}</span>
        <i class="barre"><i style="width:${Math.round(avancement(c) / ETAPES_INSTALL.length * 100)}%"></i></i></span>
      <span class="client-chiffres"><small>${esc(OFFRES[c.offre].nom)} · ${modeTexte(c)}</small><b>${p.fmt(p.total)}</b></span></button>`;
  }).join("") || `<p class="vide">Aucun client dans cette liste.</p>`}</div>`;
}
function eClient(id) {
  const c = clientP(id); if (!c) return eClients();
  const s = statutP(c), p = prixVente(c), a = assistance(c), e = encaisse(c), o = OFFRES[c.offre];
  const tarif = c.pays === "SN" ? fmtXof(TARIF_INTERVENTION.xof) : fmtEur(TARIF_INTERVENTION.eur);
  return `<div class="fiche-client"><span class="avatar grand">${esc(initiales(c.nom))}</span><div><h1>${esc(c.nom)}</h1>
    <p class="sous">${esc(METIERS[c.metier].nom)} · ${esc(c.ville)}, ${c.pays === "SN" ? "Sénégal (par la société partenaire)" : "France"} · <span class="statut ${s.c}">${esc(s.t)}</span></p></div></div>
  <div class="boutons">${c.tel ? `<a class="btn petit" href="tel:${esc(c.tel.replace(/\s/g, ""))}">Appeler</a><a class="btn petit" href="https://wa.me/${esc(c.tel.replace(/\D/g, "").replace(/^0/, "33"))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
    <button class="btn petit plein" data-e="installation" data-earg="${c.id}">${I.compter}Installation guidée · ${avancement(c)}/${ETAPES_INSTALL.length}</button>
    <button class="btn petit" data-devis-p="${c.id}">${I.bon}Devis</button>
    <button class="btn petit" data-regler-p="${c.id}">${I.reglages}Régler son appli</button>
    <button class="btn petit" data-modifier-p="${c.id}">Modifier</button></div>
  <div class="bento" style="margin-top:14px">
    <section class="w w-m"><h3 class="w-titre">${I.argent}Vente</h3>
      <div class="lignes-p"><div><span>Offre ${esc(o.nom)}, ${modeTexte(c)}</span><b>${p.fmt(p.base)}</b></div>${p.lignes.map(l => `<div><span>${esc(l.t)}</span><b>${l.m ? p.fmt(l.m) : "compris"}</b></div>`).join("")}
      <div class="fort"><span>Total HT${o.aPartirDe ? " (à partir de)" : ""}</span><b>${p.fmt(p.total)}</b></div>${p.alertes.map(a => `<div><span class="rouge">${esc(a)}</span></div>`).join("")}
      <div><span>Acompte de 40 %</span><b class="${c.etapes.acompte ? "vert" : ""}">${c.etapes.acompte ? "reçu" : p.fmt(.4 * p.total)}</b></div>
      <div><span>Solde de 60 %</span><b class="${c.etapes.solde ? "vert" : ""}">${c.etapes.solde ? "reçu" : p.fmt(.6 * p.total)}</b></div>
      ${c.pays === "SN" ? `<div><span>Notre part (${Math.round(PART_NOUS_SN * 100)} %)</span><b>${p.fmt(p.total * PART_NOUS_SN)}</b></div>` : ""}</div></section>
    <section class="w w-m"><h3 class="w-titre">${I.abo}Assistance</h3>
      ${a ? `<div class="paire" style="margin-top:0">
        <div>${anneau(a.jours, o.jours, a.enCours ? "var(--retour)" : "var(--neutre)", a.jours, "jours restants", true)}<p>sur ${o.jours} jours</p></div>
        <div>${anneau(a.heures, a.total, a.enCours ? "var(--compter)" : "var(--neutre)", String(a.heures).replace(".", ","), "heures restantes", true)}<p>sur ${a.total} h</p></div></div>
        <p class="w-note">${a.enCours ? "Corrections et questions d'utilisation comprises. Les nouvelles fonctions passent par un devis." : `Terminée. Interventions à ${tarif} HT de l'heure, sur devis.`}</p>` : `<p class="vide">Commence à la livraison : ${o.jours} jours et ${o.heures} h.</p>`}</section>
    <section class="w w-l"><div class="w-entete"><h3 class="w-titre">${I.journal}Interventions</h3><button class="btn petit" data-intervention-p="${c.id}">${iconePlus()}Ajouter</button></div>
      ${c.interventions.length ? `<ul class="b-liste">${c.interventions.slice().reverse().map((x, k) => { const i = c.interventions.length - 1 - k; return `<li><div class="l ligne-interv"><span><b>${esc(x.t)}</b><small>${quand(x.date)} · ${String(x.h).replace(".", ",")} h${x.statut !== "incluse" ? " · " + prixHeures(c, x.h) : ""}</small></span>
        <span class="boutons"><span class="statut ${x.statut === "facturée" ? "s-revenue" : x.statut === "à facturer" ? "s-partie" : ""}">${x.statut}</span>${x.statut === "à facturer" ? `<button class="btn petit" data-facturer-p="${c.id}|${i}">Marquer facturée</button>` : ""}</span></div></li>`; }).join("")}</ul>` : `<p class="vide">Aucune intervention.</p>`}</section>
    <section class="w w-m"><h3 class="w-titre">${I.jour}Heures passées</h3>
      <div class="lignes-p"><div><span>Prévues dans le prix</span><b>${String(c.heuresEstimees).replace(".", ",")} h</b></div><div class="fort"><span>Passées</span><b class="${c.heuresPassees > c.heuresEstimees ? "rouge" : ""}">${String(c.heuresPassees).replace(".", ",")} h</b></div>
      <div><span>Gain net estimé de l'heure</span><b>${c.heuresPassees && e.total ? fmtEur(gainHeure(c)) : "—"}</b></div></div>
      <div class="boutons" style="margin-top:10px"><button class="btn petit" data-heures-p="${c.id}|0.5">+ 30 min</button><button class="btn petit" data-heures-p="${c.id}|1">+ 1 h</button><button class="btn petit" data-heures-p="${c.id}|-0.5">− 30 min</button></div></section>
    <section class="w w-m"><h3 class="w-titre">${I.equipe}Contact</h3><p style="margin:0"><b>${esc(c.contact || "—")}</b><br>${esc(c.tel || "")}</p>${c.notes ? `<p class="msg" style="margin-top:10px">${esc(c.notes)}</p>` : ""}</section>
  </div>`;
}

/* Installation guidée */
function eInstallations() {
  const l = P_.clients.filter(c => c.etapes.devis || c.prevuLe).sort((a, b) => avancement(a) - avancement(b));
  return `<h1>Installations</h1><p class="sous">La même liste d'étapes pour chaque client, à cocher avant, sur place et après. Rien n'est oublié, et le temps se compte.</p>
  <div class="clients">${l.map(c => `<button class="client" data-e="installation" data-earg="${c.id}"><span class="avatar">${esc(initiales(c.nom))}</span><span><b>${esc(c.nom)}</b><small>${c.livreLe ? "Livré le " + new Date(c.livreLe).toLocaleDateString("fr-FR") : c.prevuLe ? "Prévue le " + dateCourte(c.prevuLe) : "Date à fixer"} · ${esc(c.ville)}</small><i class="barre"><i style="width:${Math.round(avancement(c) / ETAPES_INSTALL.length * 100)}%"></i></i></span><span class="client-chiffres"><b>${avancement(c)}/${ETAPES_INSTALL.length}</b><small>étapes</small></span></button>`).join("") || `<p class="vide">Aucune installation : un client apparaît ici quand son devis est signé.</p>`}</div>`;
}
function eInstallation(id) {
  const c = clientP(id); if (!c) return eInstallations();
  const n = avancement(c), tot = ETAPES_INSTALL.length;
  return `<div class="inst-tete">${anneau(n, tot, n === tot ? "var(--retour)" : "var(--sortie)", Math.round(n / tot * 100) + " %", "fait")}
    <div><h1>${esc(c.nom)}</h1><p class="sous">${c.livreLe ? "Livré le " + new Date(c.livreLe).toLocaleDateString("fr-FR") : c.prevuLe ? "Installation prévue le " + dateLongue(c.prevuLe) : "Date d'installation à fixer"} · ${esc(c.ville)}</p>
    <div class="boutons">${c.livreLe ? "" : `<label class="btn petit">Date<input type="date" data-date-p="${c.id}" value="${c.prevuLe || ""}" style="height:36px;border:0;background:none;color:inherit"></label>`}
    ${!c.livreLe && ETAPES_INSTALL.filter(e => e.phase !== "Après").every(e => c.etapes[e.id]) ? `<button class="btn petit plein" data-livrer-p="${c.id}">Marquer livré : l'assistance commence</button>` : ""}
    <button class="btn petit" data-e="client" data-earg="${c.id}">Fiche du client</button></div></div></div>
  ${["Avant", "Sur place", "Après"].map(ph => { const l = ETAPES_INSTALL.filter(e => e.phase === ph), f = l.filter(e => c.etapes[e.id]).length;
    return `<h2>${ph} <small class="compte-ph">${f}/${l.length}</small></h2><div class="etapes">${l.map(e => `<button class="etape ${c.etapes[e.id] ? "faite" : ""}" data-etape-p="${c.id}|${e.id}" aria-pressed="${!!c.etapes[e.id]}"><span class="case">${c.etapes[e.id] ? "✓" : ""}</span><span><b>${esc(e.t)}</b>${c.etapes[e.id] ? `<small>le ${new Date(c.etapes[e.id]).toLocaleDateString("fr-FR")}</small>` : ""}</span></button>`).join("")}</div>`; }).join("")}`;
}

/* Chiffres */
function eChiffres() {
  const signe = P_.clients.filter(c => c.etapes.devis).reduce((t, c) => t + enEur(c, prixVente(c).total) * partNous(c), 0);
  const enc = P_.clients.reduce((t, c) => t + encaisse(c).total * partNous(c), 0);
  const h = P_.clients.reduce((t, c) => t + c.heuresPassees, 0), net = P_.clients.reduce((t, c) => t + gainHeure(c) * c.heuresPassees, 0);
  return `<h1>Chiffres</h1><p class="sous">Ce qui nous revient : au Sénégal, après la part du partenaire (${Math.round((1 - PART_NOUS_SN) * 100)} %). Le gain net de l'heure compte aussi le portage en France (${Math.round(NET_PORTAGE_FR * 100)} % net). Ces deux taux sont à remplacer par les vrais.</p>
  <div class="trio"><div><small>Signé</small><b>${fmtEur(signe)}</b><span class="delta">${P_.clients.filter(c => c.etapes.devis).length} clients</span></div><div><small>Encaissé</small><b>${fmtEur(enc)}</b><span class="delta">dont interventions ${fmtEur(P_.clients.reduce((t, c) => t + encaisse(c).interv * partNous(c), 0))}</span></div><div><small>Gain net de l'heure</small><b>${h ? fmtEur(net / h) : "—"}</b><span class="delta">${String(Math.round(h * 10) / 10).replace(".", ",")} h passées</span></div></div>
  <div class="bento" style="margin-top:14px"><section class="w w-l nu">${gVentesMois()}</section>
  <section class="w w-l"><h3 class="w-titre">Par client</h3><div class="defile"><table class="t"><thead><tr><th>Client</th><th class="n">Pour nous</th><th class="n">Heures prévues</th><th class="n">Heures passées</th><th class="n">Net de l'heure</th></tr></thead><tbody>
  ${P_.clients.filter(c => c.etapes.devis).map(c => `<tr><td>${esc(c.nom)}<br><small>${c.pays === "SN" ? "Sénégal" : "France"} · ${esc(OFFRES[c.offre].nom)}</small></td><td class="n">${fmtEur(enEur(c, prixVente(c).total) * partNous(c))}</td><td class="n">${String(c.heuresEstimees).replace(".", ",")} h</td><td class="n ${c.heuresPassees > c.heuresEstimees ? "rouge" : ""}">${String(c.heuresPassees).replace(".", ",")} h</td><td class="n">${encaisse(c).total ? fmtEur(gainHeure(c)) : "—"}</td></tr>`).join("")}</tbody></table></div>
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

/* ---------------- Saisies ---------------- */
function feuilleClientP(id) {
  const c = id ? clientP(id) : { pays: "FR", mode: "distance", offre: "complet", metier: "loueur", modules: [] };
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tcp"><h1 id="tcp" style="font-size:26px">${id ? "Modifier" : "Nouveau client"}</h1>
    <label class="champ">Entreprise<input name="nom" maxlength="60" autocomplete="off" value="${esc(c.nom || "")}"></label>
    <label class="champ">Métier<select name="metier">${Object.entries(METIERS).map(([k, m]) => `<option value="${k}" ${c.metier === k ? "selected" : ""}>${m.nom}</option>`).join("")}</select></label>
    <div class="dispo-dates"><label class="champ">Pays<select name="pays"><option value="FR" ${c.pays === "FR" ? "selected" : ""}>France</option><option value="SN" ${c.pays === "SN" ? "selected" : ""}>Sénégal</option></select></label><label class="champ">Ville<input name="ville" maxlength="40" value="${esc(c.ville || "")}"></label></div>
    <div class="dispo-dates"><label class="champ">Contact<input name="contact" maxlength="50" value="${esc(c.contact || "")}"></label><label class="champ">Téléphone<input name="tel" type="tel" maxlength="20" value="${esc(c.tel || "")}"></label></div>
    <label class="champ">Offre<select name="offre">${Object.entries(OFFRES).map(([k, o]) => `<option value="${k}" ${c.offre === k ? "selected" : ""}>${o.nom} · ${o.aPartirDe ? "dès " + fmtEur(o.eur) : `${fmtEur(o.eurDist)} à distance, ${fmtEur(o.eur)} sur place, ${fmtXof(o.xof)}`}</option>`).join("")}</select></label>
    <div class="dispo-dates"><label class="champ">Installation (France)<select name="mode"><option value="distance" ${c.mode !== "place" ? "selected" : ""}>À distance</option><option value="place" ${c.mode === "place" ? "selected" : ""}>Sur place</option></select></label><label class="champ">Relais au Sénégal (demi-journées)<input name="relais" type="number" inputmode="numeric" min="0" step="1" value="${c.relais || 0}"></label></div>
    <div class="dispo-dates"><label class="champ">Utilisateurs prévus<input name="utilisateurs" type="number" inputmode="numeric" min="0" step="1" value="${c.utilisateurs || ""}"></label><label class="case" style="align-self:end"><input type="checkbox" name="essai" ${c.essaiDeduit ? "checked" : ""}>Essai payé, à déduire</label></div>
    <fieldset class="modules-p"><legend>Modules en plus</legend>${Object.entries(CATALOGUE).map(([k, m]) => `<label class="case"><input type="checkbox" name="mod" value="${k}" ${(c.modules || []).includes(k) ? "checked" : ""}>${esc(m.nom)}</label>`).join("")}</fieldset>
    <label class="champ">Heures prévues pour l'installation<input name="heures" type="number" inputmode="decimal" min="0" step="0.5" value="${c.heuresEstimees || ({ demarrage: 8, complet: 13, mesure: 32 })[c.offre]}"></label>
    <label class="champ">Notes<textarea name="notes" rows="2" maxlength="300">${esc(c.notes || "")}</textarea></label>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div></div>`);
  const v = n => f.querySelector(`[name=${n}]`).value.trim();
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    if (!v("nom")) return toast("Indiquez le nom de l'entreprise.");
    const d = { nom: v("nom"), metier: v("metier"), pays: v("pays"), ville: v("ville"), contact: v("contact"), tel: v("tel"), offre: v("offre"), mode: v("mode"), relais: v("pays") === "SN" ? Math.max(0, Math.round(+v("relais") || 0)) : 0, utilisateurs: Math.max(0, Math.round(+v("utilisateurs") || 0)), essaiDeduit: f.querySelector("[name=essai]").checked, modules: [...f.querySelectorAll("[name=mod]:checked")].map(x => x.value), heuresEstimees: Math.max(0, +v("heures") || 0), notes: v("notes") };
    if (id) Object.assign(c, d);
    else { const nid = "C-" + String(P_.clients.length + 1).padStart(2, "0"); P_.clients.push(Object.assign({ id: nid, devisLe: Date.now(), etapes: {}, heuresPassees: 0, interventions: [] }, d)); f.remove(); sauverP(); allerE("client", nid); return toast("Client ajouté. Le devis est prêt."); }
    sauverP(); f.remove(); rendre(); toast("Client enregistré.");
  };
}
function feuilleInterventionP(id) {
  const c = clientP(id), a = assistance(c);
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tip"><h1 id="tip" style="font-size:26px">Intervention</h1>
    <p class="sous">${a && a.enCours ? `Assistance en cours : ${a.jours} jours et ${String(a.heures).replace(".", ",")} h restants.` : "Assistance terminée : l'intervention se facture."}</p>
    <label class="champ">Ce qui a été fait<input name="t" maxlength="100" autocomplete="off"></label>
    <label class="champ">Durée, par quart d'heure<input name="h" type="number" inputmode="decimal" min="0.25" step="0.25" value="0.5"></label>
    <div class="choix" role="radiogroup" aria-label="Facturation">${[["incluse", "Dans l'assistance incluse"], ["à facturer", "À facturer"]].map(([k, t], i) => `<label><input type="radio" name="statut" value="${k}" ${(a && a.enCours ? i === 0 : i === 1) ? "checked" : ""}>${t}</label>`).join("")}</div>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const t = f.querySelector("[name=t]").value.trim(), h = Math.max(.25, Math.round((+f.querySelector("[name=h]").value || .5) * 4) / 4);
    if (!t) return toast("Décrivez l'intervention.");
    c.interventions.push({ date: Date.now(), h, t, statut: f.querySelector("[name=statut]:checked").value });
    c.heuresPassees = Math.round((c.heuresPassees + h) * 100) / 100;
    sauverP(); f.remove(); rendre(); toast("Intervention notée, et ajoutée aux heures passées.");
  };
}
// Devis du client, avec notre en-tête
function feuilleDevisP(id) {
  const c = clientP(id), p = prixVente(c), o = OFFRES[c.offre], sn = c.pays === "SN";
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-label="Devis"><div class="feuille-doc">
    <header class="doc-tete"><div class="doc-emetteur"><div><b>${sn ? "Société partenaire au Sénégal" : "[Vendeur, à compléter : docs/17]"}</b><br>${MON_COMPTE.complet}<br>${MON_COMPTE.compte}</div></div>
    <div class="doc-titre"><h1>Devis</h1><p>N° <b>D-${new Date(c.devisLe || Date.now()).getFullYear()}-${c.id.slice(2)}</b><br>Valable 30 jours</p></div></header>
    <div class="doc-parties"><div><small>Client</small><b>${esc(c.nom)}</b>${c.contact ? "<br>" + esc(c.contact) : ""}${c.tel ? "<br>" + esc(c.tel) : ""}<br>${esc(c.ville)}</div><div><small>Offre</small><b>${esc(o.nom)}</b><br>${o.sites} site${o.sites === 1 ? "" : "s"}, ${o.utilisateurs} utilisateurs, ${o.etiquettes} étiquettes<br>Installation ${modeTexte(c)}</div></div>
    <table><thead><tr><th>Désignation</th><th class="n">Montant HT</th></tr></thead><tbody>
    <tr><td>Offre ${esc(o.nom)} : paramétrage, étiquettes, ${esc(p.installation)}, assistance ${o.jours} jours et ${o.heures} h à distance${o.inclus.length ? `<br><small>Compris : ${o.inclus.map(k => esc(CATALOGUE[k].nom)).join(", ")}</small>` : ""}</td><td class="n">${p.fmt(p.base)}</td></tr>
    ${p.lignes.map(l => `<tr><td>${esc(l.t)}<br><small>${esc(l.d)}</small></td><td class="n">${l.m ? p.fmt(l.m) : "compris"}</td></tr>`).join("")}</tbody>
    <tfoot><tr class="fort"><td>Total HT${o.aPartirDe ? " (à partir de)" : ""}</td><td class="n">${p.fmt(p.total)}</td></tr><tr><td>Acompte à la commande, 40 %</td><td class="n">${p.fmt(.4 * p.total)}</td></tr><tr><td>Solde à la livraison, 60 %</td><td class="n">${p.fmt(.6 * p.total)}</td></tr></tfoot></table>
    <div class="doc-conditions"><p>Paiement unique, aucun abonnement. Les licences Google sont payées directement par le client. Après l'assistance incluse, interventions à ${sn ? fmtXof(TARIF_INTERVENTION.xof) : fmtEur(TARIF_INTERVENTION.eur)} HT de l'heure, sur devis. Un module ajouté après la livraison coûte ${p.fmt(PRIX_MODULE_APRES[sn ? "xof" : "eur"])} HT, sur un nouveau devis. TVA en sus selon la réglementation applicable.</p></div>
    <div class="sign"><div>Pour le vendeur</div><div>Bon pour accord, date et signature du client</div></div></div>
    <div class="valider"><button class="btn" data-x>Fermer</button><button class="btn plein" data-ok>${I.imprimer}Imprimer ou PDF</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => { document.body.classList.add("impression-feuille"); window.print(); setTimeout(() => document.body.classList.remove("impression-feuille"), 500); };
}

function brancherEspace() {
  if (!installateur || session) return;
  $$("[data-e]").forEach(b => b.onclick = () => allerE(b.dataset.e, b.dataset.earg || null, b.hasAttribute("data-racine-e")));
  $$("[data-filtre-p]").forEach(b => b.onclick = () => { filtreP = b.dataset.filtreP; rendre(); });
  $$("[data-etape-p]").forEach(b => b.onclick = () => {
    const [id, e] = b.dataset.etapeP.split("|"), c = clientP(id);
    if (c.etapes[e]) delete c.etapes[e]; else c.etapes[e] = Date.now();
    if (e === "devis" && c.etapes.devis && !c.prevuLe && !c.livreLe) toast("Devis signé : fixez la date d'installation.");
    sauverP(); rendre();
  });
  $$("[data-date-p]").forEach(i => i.onchange = () => { clientP(i.dataset.dateP).prevuLe = i.value; sauverP(); rendre(); toast("Date d'installation enregistrée."); });
  $$("[data-livrer-p]").forEach(b => b.onclick = () => { const c = clientP(b.dataset.livrerP); c.livreLe = Date.now(); delete c.prevuLe; sauverP(); rendre(); toast(`Livré. L'assistance de ${OFFRES[c.offre].jours} jours commence aujourd'hui.`); });
  $$("[data-heures-p]").forEach(b => b.onclick = () => { const [id, h] = b.dataset.heuresP.split("|"), c = clientP(id); c.heuresPassees = Math.max(0, Math.round((c.heuresPassees + +h) * 100) / 100); sauverP(); rendre(); });
  $$("[data-facturer-p]").forEach(b => b.onclick = () => { const [id, i] = b.dataset.facturerP.split("|"); clientP(id).interventions[+i].statut = "facturée"; sauverP(); rendre(); toast("Intervention marquée facturée."); });
  $$("[data-intervention-p]").forEach(b => b.onclick = () => feuilleInterventionP(b.dataset.interventionP));
  $$("[data-devis-p]").forEach(b => b.onclick = () => feuilleDevisP(b.dataset.devisP));
  $$("[data-modifier-p]").forEach(b => b.onclick = () => feuilleClientP(b.dataset.modifierP));
  // Régler l'appli du client : dans la démo, l'appli prend son métier, sa taille et ses modules
  $$("[data-regler-p]").forEach(b => b.onclick = () => {
    const c = clientP(b.dataset.reglerP);
    if ((S.metier || "loueur") !== c.metier && !confirm(`L'appli de démo passe en « ${METIERS[c.metier].nom} » pour régler ${c.nom}. Continuer ?`)) return;
    if ((S.metier || "loueur") !== c.metier) changerMetier(c.metier);
    Object.keys(CATALOGUE).forEach(k => { S.modules[k] = OFFRES[c.offre].inclus.includes(k) || c.modules.includes(k) || (k === "MO-PRET" && S.articles.some(a => logique(a) === "pret")); });
    S.entreprise = Object.assign({}, S.entreprise, { nom: c.nom }); devisOffre = c.offre; devisMode = c.pays === "SN" ? "distance" : (c.mode || "place"); sauver();
    allerE("reglages");
  });
}

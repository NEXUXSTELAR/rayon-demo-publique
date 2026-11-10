// Données de démonstration : un loueur de matériel de réception.
// Tout est fictif et signalé comme tel dans l'interface.

// Vente ponctuelle : chaque module est un ajout payé une fois, jamais un abonnement.
const CATALOGUE = {
  "MO-PRET": { nom: "Prêts et retours", detail: "Départ chez le client, retour, manquants à refacturer", eur: 290, xof: 140000 },
  "MO-RES":  { nom: "Réservations et préparation", detail: "Disponibilité à une date, liste de préparation scannée, facture de casse", eur: 490, xof: 230000, pack: true },
  "MO-KIT":  { nom: "Kits", detail: "Sortir un ensemble complet en un geste", eur: 290, xof: 140000 },
  "MO-CMD":  { nom: "Commandes fournisseurs", detail: "Brouillons automatiques, validation, bon de commande", eur: 290, xof: 140000 },
  "MO-DASH": { nom: "Tableau de direction", detail: "Valeur du stock, pertes, rapport du mois", eur: 290, xof: 140000 },
  "AL-SMS":  { nom: "Alertes SMS", detail: "Branchées sur le compte SMS du client, qui paie ses messages à son fournisseur", eur: 190, xof: 90000 },
  "AL-WA":   { nom: "Alertes WhatsApp", detail: "Branchées sur le compte WhatsApp du client, qui paie ses messages à son fournisseur", eur: 190, xof: 90000 },
};
const OFFRE = { nom: "Complet", eur: 1990, xof: 950000, jours: 60, heures: 4 };
// Les trois offres (docs/23). « inclus » : modules compris dans le prix ; les autres s'ajoutent au prix du catalogue.
// eur : France, sur place · eurDist : France, à distance · xof : Sénégal, toujours à distance (relais sur place en option).
// packInclus : nombre de packs métier (modules marqués pack) compris dans l'offre.
const OFFRES = {
  demarrage: { nom: "Démarrage", eur: 1190, eurDist: 1040, xof: 500000, inclus: [], packInclus: 0, jours: 30, heures: 2, sites: 1, utilisateurs: 5, etiquettes: 300, surPlace: "une demi-journée", formations: "une séance" },
  complet:   { nom: "Complet", eur: 1990, eurDist: 1790, xof: 950000, inclus: ["MO-PRET", "MO-CMD", "MO-DASH"], packInclus: 1, jours: 60, heures: 4, sites: 3, utilisateurs: 20, etiquettes: 1000, surPlace: "une journée", formations: "deux séances" },
  mesure:    { nom: "Sur mesure", eur: 4400, eurDist: 4400, xof: 0, inclus: Object.keys(CATALOGUE), packInclus: 9, jours: 90, heures: 10, sites: "plusieurs", utilisateurs: "au contrat", etiquettes: 3000, surPlace: "plusieurs journées", formations: "plusieurs séances", aPartirDe: true },
};
const TARIF_INTERVENTION = { eur: 60, xof: 25000 };
const PRIX_MODULE_APRES = { eur: 390, xof: 190000 };   // module ajouté après la livraison
const TRANCHE_UTILISATEURS = { eur: 90, xof: 40000 };   // Démarrage, de 6 à 10 utilisateurs
const ESSAI = { eur: 150, xof: 50000, jours: 14 };       // déduit si commande dans les 30 jours après le bilan
const RELAIS_XOF = 75000;                                // Sénégal : demi-journée du relais sur place, à Dakar

// Calcul d'un devis, partagé par le devis de l'appli et par Mon espace (règles : docs/23).
// pays "FR" ou "SN" · mode "place" ou "distance" (le Sénégal est toujours à distance).
function calculerDevis({ offre, pays, mode, modules = [], utilisateurs = 0, relais = 0, essaiDeduit = false, prixEur = 0 }) {
  const o = OFFRES[offre], sn = pays === "SN", u = sn ? "xof" : "eur", distance = sn || mode === "distance";
  const prixOffre = k => sn ? OFFRES[k].xof : distance ? OFFRES[k].eurDist : OFFRES[k].eur;
  const base = prixEur ? (sn ? prixEur * EUR_XOF : prixEur) : (prixOffre(offre) || o.eur * EUR_XOF);
  let packs = o.packInclus;
  const lignes = [];
  modules.filter(k => CATALOGUE[k] && !o.inclus.includes(k)).forEach(k => {
    const m = CATALOGUE[k];
    if (m.pack && packs > 0) { packs--; lignes.push({ code: k, t: `Pack métier ${m.nom}`, d: `${m.detail}. Compris dans l'offre.`, m: 0 }); return; }
    lignes.push({ code: k, t: `${m.pack ? "Pack métier" : "Module"} ${m.nom}`, d: m.detail, m: m[u] });
  });
  if (offre === "demarrage" && utilisateurs > 5) lignes.push({ t: "Utilisateurs 6 à 10", d: "Une tranche de 5 utilisateurs en plus", m: TRANCHE_UTILISATEURS[u] });
  if (sn && relais > 0) lignes.push({ t: `Relais sur place, ${relais} demi-journée${relais > 1 ? "s" : ""}`, d: "Pose des étiquettes, inventaire de départ, accompagnement de l'équipe (Dakar)", m: relais * RELAIS_XOF });
  if (essaiDeduit) lignes.push({ t: "Essai déjà payé, déduit", d: `Essai de ${ESSAI.jours} jours`, m: -ESSAI[u] });
  const total = base + lignes.reduce((t, l) => t + l.m, 0);
  const fmt = n => u === "xof" ? Math.round(n).toLocaleString("fr-FR") + " FCFA" : Math.round(n).toLocaleString("fr-FR") + " €";
  const alertes = [];
  if (offre === "demarrage") {
    const avecAjouts = base + lignes.filter(l => l.m > 0 && !/^Relais/.test(l.t)).reduce((t, l) => t + l.m, 0);
    if (avecAjouts >= prixOffre("complet")) alertes.push(`Démarrage avec ces ajouts revient à ${fmt(avecAjouts)}, autant ou plus que Complet (${fmt(prixOffre("complet"))}) : proposer Complet.`);
    if (utilisateurs > 10) alertes.push("Plus de 10 utilisateurs : passer en Complet.");
  }
  if (offre === "complet" && utilisateurs > 20) alertes.push("Plus de 20 utilisateurs : passer en Sur mesure.");
  const installation = distance
    ? `installation à distance : étiquettes envoyées avec le plan de pose, pose par votre équipe guidée en visio, formation en visio (${o.formations})${sn && relais ? ", relais sur place" : ""}`
    : `installation sur place (${o.surPlace}) : pose des étiquettes, inventaire de départ et formation`;
  return { o, u, sn, distance, base, lignes, total, fmt, alertes, installation };
}

// Trois profils, trois façons de travailler, donc trois écrans différents.
const PROFILS = {
  terrain:   { nom: "Magasinier", role: "Au dépôt et au camion", theme: "terrain", accueil: "terrain" },
  bureau:    { nom: "Responsable du parc", role: "Stock, commandes, étiquettes", theme: "bureau", accueil: "releve" },
  direction: { nom: "Gérant", role: "Argent, pertes, installation", theme: "direction", accueil: "direction" },
  chauffeur: { nom: "Chauffeur-livreur", role: "Livraisons et reprises chez les clients", theme: "terrain", accueil: "accueil" },
};

// Équipe de démonstration. Chacun entre avec son identifiant et son mot de passe : la liste de l'équipe n'est jamais affichée.
// Les mots de passe de démo ne sont montrés que dans le volet « Comptes de démonstration ». Seule leur empreinte est enregistrée.
const EQUIPE_DEMO = [
  { id: "U-01", nom: "Ousmane", identifiant: "ousmane", mdp: "depot-24", poste: "Magasinier", role: "terrain" },
  { id: "U-02", nom: "Léa", identifiant: "lea", mdp: "depot-25", poste: "Magasinière", role: "terrain" },
  { id: "U-03", nom: "Karim", identifiant: "karim", mdp: "bureau-24", poste: "Responsable du parc", role: "bureau" },
  { id: "U-04", nom: "Awa", identifiant: "awa", mdp: "gerant-24", poste: "Gérante", role: "direction", admin: true },
  { id: "U-05", nom: "Moussa", identifiant: "moussa", mdp: "route-24", poste: "Chauffeur-livreur", role: "chauffeur", metiers: ["loueur"] },
];
// Code de l'espace installateur (démo). En vrai : notre propre compte, jamais donné au client.
const CODE_INSTALLATEUR = "2580";
// Empreinte du mot de passe (FNV-1a sur l'identifiant interne et le mot de passe). En démo, tout reste dans le navigateur ;
// en production, le mot de passe est vérifié par le serveur et n'est jamais stocké sur le téléphone.
function empreinte(uid, pin) {
  let h = 0x811c9dc5;
  const s = "rayon|" + uid + "|" + pin;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

const SEED = () => ({
  version: 13,
  entreprise: { nom: "Location Fêtes (démo)", adresse: "Zone d'activités, entrepôt 4", tel: "", email: "", logo: "" },
  detail: "complet", // simple ou complet : ce que les documents demandent et affichent (documents.js)
  infosEv: {}, // client, dates, lieu et contact des événements sans réservation
  taille: "bureau", // seul, petite ou bureau : la taille de l'équipe règle l'appli (config.js)
  clientsLoc: [],
  installation: { livreLe: Date.now() - 20 * 86400000, heuresUtilisees: 1.5 },
  interventions: [],
  metier: "loueur",
  equipe: EQUIPE_DEMO.filter(u => !u.metiers || u.metiers.includes("loueur")).map(u => ({ id: u.id, nom: u.nom, identifiant: u.identifiant, poste: u.poste, role: u.role, admin: !!u.admin, actif: true, empreinte: empreinte(u.id, u.mdp) })),
  config: null, // ce que chaque rôle voit et peut faire, réglé par l'installateur (config.js) ; null = réglages du métier
  connexions: [],
  essais: {},
  reglages: { verrou: 5 },
  monnaie: "EUR",
  modules: { "MO-PRET": true, "MO-RES": true, "MO-KIT": true, "MO-CMD": true, "MO-DASH": true, "AL-SMS": false, "AL-WA": false },
  fournisseurs: [
    { id: "FOU-01", nom: "Fournisseur de mobilier (démo)", delai: 3 },
    { id: "FOU-02", nom: "Fournisseur de textile (démo)", delai: 7 },
    { id: "FOU-03", nom: "Fournisseur de structures et d'éclairage (démo)", delai: 10 },
  ],
  emplacements: [
    { id: "EMP-A1", nom: "Allée A · chaises et tables" },
    { id: "EMP-B2", nom: "Allée B · vaisselle" },
    { id: "EMP-C1", nom: "Cage technique · son et énergie" },
    { id: "EMP-D1", nom: "Mezzanine · textile" },
    { id: "EMP-E1", nom: "Cour · tentes et structures" },
  ],
  articles: [
    { id: "ART-0001", nom: "Chaise pliante blanche", img: "chaise", type: "conso", unite: "chaise", emp: "EMP-A1", seuil: 80, cible: 300, prix: 18, loc: 1.5, lot: 10, fou: "FOU-01" },
    { id: "ART-0002", nom: "Table ronde 180 cm", img: "table", type: "conso", unite: "table", emp: "EMP-A1", seuil: 8, cible: 30, prix: 145, loc: 9, lot: 1, fou: "FOU-01" },
    { id: "ART-0003", nom: "Assiette plate", img: "assiette", type: "conso", unite: "assiette", emp: "EMP-B2", seuil: 200, cible: 800, prix: 2.4, loc: 0.3, lot: 40, fou: "FOU-01" },
    { id: "ART-0004", nom: "Verre à pied", img: "verre", type: "conso", unite: "verre", emp: "EMP-B2", seuil: 200, cible: 900, prix: 1.6, loc: 0.3, lot: 36, fou: "FOU-01" },
    { id: "ART-0005", nom: "Nappe ronde ivoire", img: "nappe", type: "conso", unite: "nappe", emp: "EMP-D1", seuil: 24, cible: 40, prix: 22, loc: 6, lot: 5, fou: "FOU-02" },
    { id: "ART-0006", nom: "Enceinte 15 pouces n°1", img: "enceinte", type: "equip", unite: "enceinte", emp: "EMP-C1", seuil: 0, cible: 1, prix: 690, loc: 60, lot: 1, fou: "FOU-01", serie: "SN-EA15-4471" },
    { id: "ART-0007", nom: "Enceinte 15 pouces n°2", img: "enceinte", type: "equip", unite: "enceinte", emp: "EMP-C1", seuil: 0, cible: 1, prix: 690, loc: 60, lot: 1, fou: "FOU-01", serie: "SN-EA15-4472" },
    { id: "ART-0008", nom: "Groupe électrogène 3 kW", img: "groupe", type: "equip", unite: "groupe", emp: "EMP-C1", seuil: 0, cible: 1, prix: 1150, loc: 90, lot: 1, fou: "FOU-01", serie: "SN-GE3-0912" },
    { id: "ART-0009", nom: "Rallonge 25 m", img: "rallonge", type: "conso", unite: "rallonge", emp: "EMP-C1", seuil: 6, cible: 20, prix: 34, loc: 5, lot: 1, fou: "FOU-01" },
    { id: "ART-0010", nom: "Housse de chaise", img: "housse", type: "conso", unite: "housse", emp: "EMP-D1", seuil: 60, cible: 300, prix: 3.9, loc: 1.2, lot: 25, fou: "FOU-02" },
    { id: "ART-0011", nom: "Tente 5 × 10 m", img: "tente", type: "conso", unite: "tente", emp: "EMP-E1", seuil: 1, cible: 4, prix: 2400, loc: 180, lot: 1, fou: "FOU-03" },
    { id: "ART-0012", nom: "Bâche de côté 5 m", img: "bache", type: "conso", unite: "bâche", emp: "EMP-E1", seuil: 6, cible: 24, prix: 85, loc: 12, lot: 2, fou: "FOU-03" },
    { id: "ART-0013", nom: "Leste 25 kg", img: "leste", type: "conso", unite: "leste", emp: "EMP-E1", seuil: 12, cible: 48, prix: 19, loc: 2, lot: 4, fou: "FOU-03" },
    { id: "ART-0014", nom: "Projecteur LED", img: "projecteur", type: "conso", unite: "projecteur", emp: "EMP-C1", seuil: 4, cible: 16, prix: 240, loc: 25, lot: 1, fou: "FOU-03" },
    { id: "ART-0015", nom: "Micro sans fil n°1", img: "micro", type: "equip", unite: "micro", emp: "EMP-C1", seuil: 0, cible: 1, prix: 380, loc: 35, lot: 1, fou: "FOU-03", serie: "SN-MHF-2081" },
    { id: "ART-0016", nom: "Câble XLR 10 m", img: "cable_xlr", type: "conso", unite: "câble", emp: "EMP-C1", seuil: 8, cible: 30, prix: 18, loc: 2, lot: 1, fou: "FOU-03" },
  ],
  kits: [
    { id: "KIT-01", nom: "Kit 50 couverts", lignes: [["ART-0003", 50], ["ART-0004", 50], ["ART-0005", 5]] },
    { id: "KIT-02", nom: "Kit salle 100 places", lignes: [["ART-0001", 100], ["ART-0010", 100], ["ART-0002", 10], ["ART-0005", 10]] },
    { id: "KIT-03", nom: "Kit son", lignes: [["ART-0006", 1], ["ART-0007", 1], ["ART-0009", 4], ["ART-0015", 1], ["ART-0016", 4]] },
    { id: "KIT-04", nom: "Tente 5 × 10 complète", lignes: [["ART-0011", 1], ["ART-0012", 6], ["ART-0013", 12]] },
    { id: "KIT-05", nom: "Kit éclairage", lignes: [["ART-0014", 4], ["ART-0016", 4]] },
  ],
  evenements: ["Mariage · salle des fêtes", "Séminaire · hôtel", "Anniversaire · particulier", "Fête de quartier · association"],
  mouvements: [],
  reservations: [],
  bons: [],
  commandes: [],
  alertes: [],
  messages: [],
});

// Historique de démonstration : huit semaines d'événements, puis quelques sorties en cours.
// Générateur pseudo-aléatoire à graine fixe : la démo est identique à chaque remise à zéro.
function seedMouvements(state) {
  let graine = 7;
  const alea = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  const entre = (a, b) => Math.round(a + alea() * (b - a));
  const jour = 86400000, maintenant = Date.now();
  const debut = maintenant - 62 * jour;
  let n = 0;
  const add = (t, profil, art, type, qte, evenement, motif, refac) => {
    if (qte <= 0) return;
    n += 1;
    state.mouvements.push({ id: "MV-" + String(n).padStart(5, "0"), date: t, profil, qui: profil === "bureau" ? "Karim" : (n % 3 ? "Ousmane" : "Léa"), article: art, type, qte, evenement: evenement || "", motif: motif || "", refac: !!refac });
  };
  const init = { "ART-0001": 420, "ART-0002": 44, "ART-0003": 1000, "ART-0004": 1100, "ART-0005": 34, "ART-0006": 1, "ART-0007": 1, "ART-0008": 1, "ART-0009": 22, "ART-0010": 420, "ART-0011": 4, "ART-0012": 26, "ART-0013": 52, "ART-0014": 16, "ART-0015": 1, "ART-0016": 32 };
  Object.entries(init).forEach(([a, q]) => add(debut, "bureau", a, "Inventaire initial", q));
  const types = ["Mariage", "Séminaire", "Anniversaire", "Gala", "Salon", "Fête d'association", "Repas d'entreprise"];
  const mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  // Événements passés, tous revenus (avec un peu de casse)
  for (let j = 58; j >= 8; j -= entre(3, 5)) {
    const t = maintenant - j * jour + 9 * 3600000, d = new Date(t + 2 * jour);
    const ev = `${types[entre(0, types.length - 1)]} · ${d.getDate()} ${mois[d.getMonth()]}`;
    const lot = [["ART-0001", entre(60, 220)], ["ART-0003", entre(80, 300)], ["ART-0004", entre(80, 320)], ["ART-0002", entre(6, 18)], ["ART-0010", entre(0, 160)], ["ART-0005", entre(4, 10)]];
    if (alea() > .5) lot.push(["ART-0006", 1], ["ART-0009", entre(2, 5)]);
    if (alea() > .6) lot.push(["ART-0011", 1], ["ART-0012", 6], ["ART-0013", 12]);
    if (alea() > .6) lot.push(["ART-0014", 4], ["ART-0016", 4], ["ART-0015", 1]);
    lot.forEach(([a, q]) => add(t, "terrain", a, "Prêt", q, ev));
    lot.forEach(([a, q]) => {
      const casse = a === "ART-0003" || a === "ART-0004" ? entre(0, Math.ceil(q * .03)) : a === "ART-0001" ? entre(0, 3) : a === "ART-0016" || a === "ART-0013" ? entre(0, 1) : 0;
      const refac = alea() < .45;
      add(t + 2 * jour + 3600000, "terrain", a, "Retour", q - casse, ev);
      add(t + 2 * jour + 3700000, "terrain", a, "Perte", casse, ev, refac ? "Cassé par le client" : "Casse au chargement", refac);
    });
  }
  // Événements en cours
  const ev = state.evenements;
  const t0 = maintenant - 3 * jour;
  add(t0, "terrain", "ART-0001", "Prêt", 120, ev[0]);
  add(t0, "terrain", "ART-0003", "Prêt", 240, ev[0]);
  add(t0, "terrain", "ART-0005", "Prêt", 12, ev[0]);
  add(t0, "terrain", "ART-0011", "Prêt", 1, ev[0]);
  add(t0, "terrain", "ART-0012", "Prêt", 6, ev[0]);
  add(t0, "terrain", "ART-0013", "Prêt", 12, ev[0]);
  add(t0 + jour, "terrain", "ART-0014", "Prêt", 4, ev[1]);
  add(t0 + jour, "terrain", "ART-0006", "Prêt", 1, ev[1]);
  add(t0 + jour, "terrain", "ART-0009", "Prêt", 4, ev[1]);
  add(t0 + 2 * jour, "terrain", "ART-0004", "Prêt", 300, ev[2]);
  // Réservations : les trois événements en cours, puis trois à venir
  const iso = n => { const d = new Date(maintenant + n * jour); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  state.reservations.push(
    { id: "R-P01", nom: ev[0], debut: iso(-3), fin: iso(1), lignes: [["ART-0001", 120], ["ART-0003", 240], ["ART-0005", 12], ["ART-0011", 1], ["ART-0012", 6], ["ART-0013", 12]], statut: "Partie", charge: {} },
    { id: "R-P02", nom: ev[1], debut: iso(-2), fin: iso(1), lignes: [["ART-0006", 1], ["ART-0009", 4], ["ART-0014", 4]], statut: "Partie", charge: {} },
    { id: "R-P03", nom: ev[2], debut: iso(-1), fin: iso(2), lignes: [["ART-0004", 300]], statut: "Partie", charge: {} },
    { id: "R-001", nom: "Mariage · samedi", debut: iso(3), fin: iso(4), lignes: [["ART-0001", 200], ["ART-0002", 20], ["ART-0003", 200], ["ART-0004", 216], ["ART-0005", 20], ["ART-0010", 200], ["ART-0011", 2], ["ART-0012", 12], ["ART-0013", 24]], statut: "Confirmée", charge: {} },
    { id: "R-002", nom: "Séminaire d'entreprise", debut: iso(6), fin: iso(6), lignes: [["ART-0001", 80], ["ART-0002", 8], ["ART-0006", 1], ["ART-0009", 4], ["ART-0014", 4], ["ART-0015", 1], ["ART-0016", 4]], statut: "Confirmée", charge: {} },
    { id: "R-003", nom: "Gala de fin d'année", debut: iso(10), fin: iso(11), lignes: [["ART-0001", 300], ["ART-0004", 600], ["ART-0002", 30]], statut: "Confirmée", charge: {} },
  );
  ["Mariage · samedi", "Séminaire d'entreprise", "Gala de fin d'année"].forEach(n => state.evenements.push(n));
  // Clients de location, liés aux réservations
  state.clientsLoc = [
    { id: "CL-001", nom: "Particulier · mariage (démo)", tel: "06 00 00 00 01", caution: 300 },
    { id: "CL-002", nom: "Hôtel du centre (démo)", tel: "05 00 00 00 02", caution: 0 },
    { id: "CL-003", nom: "Association de quartier (démo)", tel: "06 00 00 00 03", caution: 150 },
  ];
  const lien = { "R-P01": "CL-001", "R-P02": "CL-002", "R-P03": "CL-001", "R-001": "CL-001", "R-002": "CL-002", "R-003": "CL-003" };
  // Adresses fictives, pour la tournée du chauffeur
  const adresse = { "R-P01": "Salle des fêtes, place de la Mairie", "R-P02": "Hôtel du centre, salle Horizon", "R-P03": "12 rue des Lilas, jardin", "R-001": "Domaine des Tilleuls, route du Lac", "R-002": "Hôtel du centre, salle Horizon", "R-003": "Parc des expositions, hall B" };
  state.reservations.forEach(r => { r.client = lien[r.id] || ""; r.adresse = adresse[r.id] || ""; });
  // Une enceinte au nettoyage et des nappes en réparation, pour montrer l'atelier
  add(maintenant - 2 * jour, "terrain", "ART-0010", "Réparation", 25, "", "Au nettoyage");
  // Une livraison attendue, à réceptionner depuis le terrain
  state.commandes.push({ id: "CMD-0001", date: maintenant - 2 * jour, fid: "FOU-02", fournisseur: "Fournisseur de textile (démo)", lignes: [{ id: "ART-0005", qte: 20 }, { id: "ART-0010", qte: 100 }], total: 20 * 22 + 100 * 3.9, statut: "Envoyée" });
  // Événements passés reliés à un client (pour la caution sur la facture de casse)
  state.clientsEv = {};
  state.mouvements.forEach(m => { if (m.evenement) state.clientsEv[m.evenement] = /^Mariage/.test(m.evenement) ? "CL-001" : /^Fête/.test(m.evenement) ? "CL-003" : "CL-002"; });
  return state;
}

"use strict";
/* Un même outil, six métiers. Chaque métier change les mots, les boutons du terrain, les modules et les objets de démo.
   Chaque objet suit une logique : « pret » (il revient) ou « conso » (il est consommé, vendu ou distribué). */

const METIERS = {
  loueur: {
    entreprise: "Location Fêtes (démo)", nom: "Loueur de matériel", logique: "pret", dlc: false,
    v: { imp: "Événement", imps: "événements", retourTitre: "Retour d'un événement", retourSous: "en cours", chez: "Chez les clients",
         pretSortie: "Part chez un client", pretSortieSous: "Je l'emmène", pretRetour: "Revient", pretRetourSous: "Je le range",
         prendre: "Je sors", prendreSous: "Sortie définitive", remettre: "Je remets", remettreSous: "Retour en stock",
         terrain: "Magasinier", bureau: "Responsable du parc", direction: "Gérante", parc: "Relevé du parc", sortiesMot: "Mis en location" },
  },
  artisan: {
    entreprise: "Atelier Élec (démo)", nom: "Artisan et maintenance", logique: "conso", dlc: false,
    v: { imp: "Chantier", imps: "chantiers", retourTitre: "Rendre l'outillage", retourSous: "outils dehors", chez: "Sur les chantiers",
         pretSortie: "Je l'emprunte", pretSortieSous: "Pour un chantier", pretRetour: "Je le rends", pretRetourSous: "Il revient au dépôt",
         prendre: "J'en prends", prendreSous: "Pour un chantier", remettre: "Je remets le surplus", remettreSous: "Pas utilisé sur le chantier",
         terrain: "Technicien", bureau: "Conducteur de travaux", direction: "Gérante", parc: "Relevé du dépôt", sortiesMot: "Posé sur chantier" },
    imputations: ["Chantier Dupont · rénovation", "Résidence Les Pins · lot B", "Maintenance école Jean-Moulin", "Dépannage · particulier"],
    fournisseurs: [{ id: "FOU-01", nom: "Grossiste en électricité (démo)", delai: 2 }, { id: "FOU-02", nom: "Fournisseur d'outillage (démo)", delai: 5 }, { id: "FOU-03", nom: "Grossiste en plomberie (démo)", delai: 3 }],
    emplacements: [{ id: "EMP-A1", nom: "Dépôt · rayonnage électrique" }, { id: "EMP-A2", nom: "Dépôt · rayonnage plomberie" }, { id: "EMP-B1", nom: "Dépôt · armoire outillage" }, { id: "EMP-C1", nom: "Dépôt · EPI" }, { id: "EMP-V1", nom: "Camion 1" }, { id: "EMP-V2", nom: "Camion 2" }],
    articles: [
      ["ART-0001", "Disjoncteur 16 A", "disjoncteur", "conso", 40, 120, 7.9, 10, "EMP-A1", "FOU-01", 6],
      ["ART-0002", "Câble 3G2,5 · couronne 100 m", "couronne_cable", "conso", 3, 10, 96, 1, "EMP-A1", "FOU-01", .4],
      ["ART-0003", "Gaine ICTA 20 mm · 100 m", "gaine", "conso", 4, 12, 31, 1, "EMP-V1", "FOU-01", .5],
      ["ART-0004", "Gants nitrile · boîte de 100", "gants", "conso", 6, 20, 8.5, 1, "EMP-B1", "FOU-02", .6],
      ["ART-0005", "Chevilles 8 mm · boîte de 100", "chevilles", "conso", 5, 15, 5.6, 1, "EMP-A1", "FOU-02", .5],
      ["ART-0006", "Perforateur n°1", "perforateur", "pret", 0, 1, 289, 1, "EMP-B1", "FOU-02", 0, "SN-PF-55821"],
      ["ART-0007", "Perforateur n°2", "perforateur", "pret", 0, 1, 289, 1, "EMP-B1", "FOU-02", 0, "SN-PF-55822"],
      ["ART-0008", "Rallonge 25 m", "rallonge", "pret", 1, 4, 34, 1, "EMP-B1", "FOU-02", 0],
      ["ART-0009", "Harnais antichute n°1", "harnais", "pret", 0, 1, 145, 1, "EMP-C1", "FOU-02", 0, "SN-HA-2207"],
      ["ART-0010", "Casque de chantier", "casque", "conso", 4, 15, 12, 1, "EMP-C1", "FOU-02", .15],
      ["ART-0011", "Multimètre numérique", "multimetre", "pret", 0, 1, 119, 1, "EMP-B1", "FOU-02", 0, "SN-MM-1180"],
      ["ART-0012", "Échelle 3 plans", "echelle", "pret", 0, 1, 260, 1, "EMP-B1", "FOU-02", 0, "SN-EC-0045"],
      ["ART-0013", "Raccords à sertir · boîte de 10", "raccords", "conso", 4, 15, 24, 1, "EMP-A2", "FOU-03", .6],
      ["ART-0014", "Contacteur 25 A", "contacteur", "conso", 3, 10, 38, 1, "EMP-A1", "FOU-01", .2],
      ["ART-0015", "Lunettes de protection", "lunettes", "conso", 5, 20, 4.5, 1, "EMP-C1", "FOU-02", .3],
      ["ART-0016", "Visseuse n°1", "visseuse", "pret", 0, 1, 189, 1, "EMP-B1", "FOU-02", 0, "SN-VS-31007"],
      ["ART-0017", "Tube cuivre 14 mm · barre de 2 m", "tube_cuivre", "conso", 10, 40, 16, 5, "EMP-A2", "FOU-03", 2],
    ],
    kits: [{ id: "KIT-01", nom: "Kit tableau électrique", lignes: [["ART-0001", 10], ["ART-0003", 1], ["ART-0005", 1]] },
           { id: "KIT-02", nom: "Kit EPI chantier", lignes: [["ART-0010", 1], ["ART-0015", 1], ["ART-0004", 1]] }],
  },
  restaurant: {
    entreprise: "Le Comptoir (démo)", nom: "Restaurant et traiteur", logique: "conso", dlc: true,
    v: { imp: "Service", imps: "services", retourTitre: "Retour d'une prestation", retourSous: "matériel dehors", chez: "En prestation",
         pretSortie: "Part en prestation", pretSortieSous: "Traiteur ou banquet", pretRetour: "Revient", pretRetourSous: "Je le range",
         prendre: "J'en sors", prendreSous: "Pour le service", remettre: "Je remets en réserve", remettreSous: "Pas utilisé",
         terrain: "Cuisinier", bureau: "Chef de cuisine", direction: "Gérante", parc: "Relevé de la réserve", sortiesMot: "Consommé" },
    imputations: ["Traiteur · mariage Martin", "Service du midi", "Service du soir", "Bar", "Repas du personnel"],
    fournisseurs: [{ id: "FOU-01", nom: "Grossiste alimentaire (démo)", delai: 1 }, { id: "FOU-02", nom: "Maraîcher (démo)", delai: 1 }, { id: "FOU-03", nom: "Fournisseur de matériel de cuisine (démo)", delai: 5 }],
    emplacements: [{ id: "EMP-R1", nom: "Réserve sèche" }, { id: "EMP-F1", nom: "Chambre froide" }, { id: "EMP-B1", nom: "Boissons" }, { id: "EMP-M1", nom: "Local matériel traiteur" }, { id: "EMP-L1", nom: "Lingerie" }],
    articles: [
      ["ART-0001", "Riz · sac de 25 kg", "riz", "conso", 2, 6, 32, 1, "EMP-R1", "FOU-01", .35, null, 180],
      ["ART-0002", "Huile · bidon de 5 L", "huile", "conso", 3, 10, 14, 1, "EMP-R1", "FOU-01", .6, null, 240],
      ["ART-0003", "Tomates · cagette de 6 kg", "tomates", "conso", 3, 8, 15, 1, "EMP-F1", "FOU-02", 1.6, null, 6],
      ["ART-0004", "Oignons · filet de 10 kg", "oignons", "conso", 2, 6, 9, 1, "EMP-R1", "FOU-02", .7, null, 21],
      ["ART-0005", "Eau · pack de 6", "eau", "conso", 10, 40, 3.2, 1, "EMP-B1", "FOU-01", 4, null, 365],
      ["ART-0006", "Barquettes à emporter · 50", "barquettes", "conso", 4, 12, 11, 1, "EMP-R1", "FOU-01", .8, null, 0],
      ["ART-0007", "Chafing-dish inox", "chafing", "pret", 2, 12, 95, 1, "EMP-M1", "FOU-03", 0],
      ["ART-0008", "Glacière isotherme 50 L", "glaciere", "pret", 1, 8, 70, 1, "EMP-M1", "FOU-03", 0],
      ["ART-0009", "Percolateur 10 L", "percolateur", "pret", 0, 1, 180, 1, "EMP-M1", "FOU-03", 0, "SN-PC-0412"],
      ["ART-0010", "Farine · sac de 25 kg", "farine", "conso", 2, 6, 19, 1, "EMP-R1", "FOU-01", .3, null, 240],
      ["ART-0011", "Crème liquide · 1 L", "creme", "conso", 6, 24, 3.4, 6, "EMP-F1", "FOU-01", 2, null, 12],
      ["ART-0012", "Jus de fruits · pack de 12", "jus", "conso", 4, 15, 14, 1, "EMP-B1", "FOU-01", 1, null, 200],
      ["ART-0013", "Serviette de bain", "serviette", "conso", 20, 80, 9, 10, "EMP-L1", "FOU-03", 0],
    ],
    kits: [{ id: "KIT-01", nom: "Kit buffet 50 couverts", lignes: [["ART-0007", 4], ["ART-0008", 2], ["ART-0009", 1]] }],
    atelier: [["ART-0013", 30, "Au nettoyage"]],
  },
  labo: {
    entreprise: "Labo Analyses (démo)", nom: "Laboratoire", logique: "conso", dlc: true,
    v: { imp: "Projet", imps: "projets", retourTitre: "Retour d'un emprunt", retourSous: "appareils prêtés", chez: "Prêtés",
         pretSortie: "Je l'emprunte", pretSortieSous: "Pour un projet ou un TP", pretRetour: "Je le rends", pretRetourSous: "Il revient au labo",
         prendre: "J'en prends", prendreSous: "Pour un projet ou un TP", remettre: "Je remets le surplus", remettreSous: "Pas utilisé",
         terrain: "Technicien de labo", bureau: "Responsable du labo", direction: "Directrice", parc: "Relevé du labo", sortiesMot: "Consommé" },
    imputations: ["TP de chimie · L2", "Projet de recherche A", "Contrôle qualité", "Stage · M1"],
    fournisseurs: [{ id: "FOU-01", nom: "Fournisseur de consommables de labo (démo)", delai: 4 }],
    emplacements: [{ id: "EMP-L1", nom: "Armoire produits" }, { id: "EMP-L2", nom: "Paillasse 2" }, { id: "EMP-L3", nom: "Salle des appareils" }, { id: "EMP-L4", nom: "Réfrigérateur réactifs" }],
    articles: [
      ["ART-0001", "Éthanol 70 % · pissette 500 mL", "ethanol", "conso", 6, 20, 6.5, 1, "EMP-L1", "FOU-01", .6, null, 365],
      ["ART-0002", "Gants nitrile · boîte de 100", "gants", "conso", 5, 20, 8.5, 1, "EMP-L1", "FOU-01", .5, null, 0],
      ["ART-0003", "Cônes de pipette · rack de 96", "embouts", "conso", 8, 30, 7.2, 1, "EMP-L2", "FOU-01", 1.2, null, 0],
      ["ART-0004", "Papier filtre · boîte de 100", "papier_filtre", "conso", 3, 10, 12, 1, "EMP-L2", "FOU-01", .25, null, 0],
      ["ART-0005", "Microscope optique n°1", "microscope", "pret", 0, 1, 1450, 1, "EMP-L3", "FOU-01", 0, "SN-MO-3301"],
      ["ART-0006", "Micropipette 100-1000 µL", "pipette", "pret", 0, 1, 320, 1, "EMP-L3", "FOU-01", 0, "SN-MP-7781"],
      ["ART-0007", "Réactif glycémie · coffret de 100 tests", "reactif", "conso", 3, 12, 58, 1, "EMP-L4", "FOU-01", .5, null, 90],
      ["ART-0008", "Tubes de prélèvement · boîte de 100", "tubes", "conso", 4, 15, 16, 1, "EMP-L1", "FOU-01", .6, null, 365],
      ["ART-0009", "Masques FFP2 · boîte de 20", "masques", "conso", 4, 15, 11, 1, "EMP-L1", "FOU-01", .4],
      ["ART-0010", "Centrifugeuse de paillasse", "centrifugeuse", "pret", 0, 1, 2100, 1, "EMP-L3", "FOU-01", 0, "SN-CF-5520"],
      ["ART-0011", "Balance de précision", "balance", "pret", 0, 1, 890, 1, "EMP-L3", "FOU-01", 0, "SN-BL-2081"],
    ],
    lotsCourts: [["ART-0007", 2, 12], ["ART-0001", 4, 25]],
    kits: [],
  },
  distribution: {
    entreprise: "Quincaillerie du Centre (démo)", nom: "Quincaillerie et distribution", logique: "conso", dlc: false,
    v: { imp: "Client", imps: "clients", retourTitre: "", retourSous: "", chez: "",
         pretSortie: "", pretSortieSous: "", pretRetour: "", pretRetourSous: "",
         prendre: "Je sors pour une vente", prendreSous: "Comptoir ou client pro", remettre: "Retour d'un client", remettreSous: "Remis en rayon",
         terrain: "Magasinier", bureau: "Responsable de magasin", direction: "Gérante", parc: "Relevé du magasin", sortiesMot: "Vendu" },
    imputations: ["Vente au comptoir", "Client professionnel · chantier", "Transfert vers le magasin 2"],
    fournisseurs: [{ id: "FOU-01", nom: "Cimenterie (démo)", delai: 3 }, { id: "FOU-02", nom: "Grossiste en quincaillerie (démo)", delai: 4 }, { id: "FOU-03", nom: "Distributeur de pièces auto (démo)", delai: 5 }],
    emplacements: [{ id: "EMP-M1", nom: "Magasin · outillage et électricité" }, { id: "EMP-M2", nom: "Cour · matériaux" }, { id: "EMP-M3", nom: "Magasin · plomberie" }, { id: "EMP-M4", nom: "Magasin · carrelage" }, { id: "EMP-P1", nom: "Rayon pièces auto" }, { id: "EMP-P2", nom: "Rack à pneus" }],
    articles: [
      ["ART-0001", "Ciment · sac de 50 kg", "ciment", "conso", 40, 150, 6.8, 10, "EMP-M2", "FOU-01", 14],
      ["ART-0002", "Peinture blanche · seau de 15 L", "peinture", "conso", 6, 20, 42, 1, "EMP-M1", "FOU-02", 1],
      ["ART-0003", "Mitigeur de cuisine", "robinet", "conso", 3, 10, 38, 1, "EMP-M3", "FOU-02", .4],
      ["ART-0004", "Tube PVC 32 mm · 4 m", "tuyau", "conso", 20, 60, 5.5, 10, "EMP-M3", "FOU-02", 4],
      ["ART-0005", "Vis à bois · boîte de 200", "vis", "conso", 10, 40, 6.2, 1, "EMP-M1", "FOU-02", 2],
      ["ART-0006", "Fer à béton 10 mm · barre de 12 m", "fer", "conso", 50, 200, 6.4, 10, "EMP-M2", "FOU-01", 12],
      ["ART-0007", "Carreaux 60 × 60 · carton de 1,44 m²", "carreaux", "conso", 15, 60, 19, 1, "EMP-M4", "FOU-02", 2],
      ["ART-0008", "Câble 2,5 mm² · couronne de 100 m", "couronne_cable", "conso", 3, 12, 58, 1, "EMP-M1", "FOU-02", .4],
      ["ART-0009", "Disjoncteur 16 A", "disjoncteur", "conso", 20, 80, 6.5, 10, "EMP-M1", "FOU-02", 3],
      ["ART-0010", "Filtre à huile", "filtre", "conso", 10, 40, 7.5, 1, "EMP-P1", "FOU-03", 2],
      ["ART-0011", "Plaquettes de frein · jeu", "plaquettes", "conso", 6, 24, 28, 1, "EMP-P1", "FOU-03", .8],
      ["ART-0012", "Pneu 195/65 R15", "pneu", "conso", 8, 32, 62, 1, "EMP-P2", "FOU-03", .6],
      ["ART-0013", "Huile moteur · bidon de 5 L", "huile_moteur", "conso", 10, 40, 31, 1, "EMP-P1", "FOU-03", 1.2],
    ],
    kits: [],
  },
  ong: {
    entreprise: "Projet Santé Solidaire (démo)", nom: "ONG et projets", logique: "conso", dlc: true,
    v: { imp: "Distribution", imps: "distributions", retourTitre: "Retour du matériel", retourSous: "matériel sur le terrain", chez: "Sur le terrain",
         pretSortie: "Part sur le terrain", pretSortieSous: "Pour une antenne ou une distribution", pretRetour: "Revient", pretRetourSous: "Il revient à l'entrepôt",
         prendre: "Je distribue", prendreSous: "Lieu de distribution", remettre: "Je rapporte le reste", remettreSous: "Non distribué",
         terrain: "Agent logistique", bureau: "Logisticien", direction: "Coordinatrice", parc: "Relevé de l'entrepôt", sortiesMot: "Distribué" },
    imputations: ["Distribution · quartier Nord", "Distribution · école primaire", "Antenne régionale", "Centre de santé"],
    fournisseurs: [{ id: "FOU-01", nom: "Centrale d'achat humanitaire (démo)", delai: 10 }, { id: "FOU-02", nom: "Banque alimentaire régionale (démo)", delai: 4 }],
    emplacements: [{ id: "EMP-E1", nom: "Entrepôt · allée 1" }, { id: "EMP-E2", nom: "Entrepôt · allée 2" }, { id: "EMP-E3", nom: "Entrepôt · matériel" }],
    articles: [
      ["ART-0001", "Kit d'hygiène familial", "kit_hygiene", "conso", 40, 200, 18, 10, "EMP-E1", "FOU-01", 9],
      ["ART-0002", "Moustiquaire imprégnée", "moustiquaire", "conso", 60, 300, 4.5, 20, "EMP-E1", "FOU-01", 14],
      ["ART-0003", "Riz · sac de 25 kg", "riz", "conso", 20, 80, 32, 1, "EMP-E2", "FOU-01", 3, null, 180],
      ["ART-0004", "Jerrican 20 L", "jerrican", "conso", 30, 120, 6, 10, "EMP-E2", "FOU-01", 5],
      ["ART-0005", "Couverture", "couverture", "conso", 30, 150, 9, 10, "EMP-E2", "FOU-01", 6],
      ["ART-0006", "Savon · carton de 48", "savon", "conso", 10, 40, 22, 1, "EMP-E1", "FOU-01", 1.5, null, 720],
      ["ART-0007", "Lampe solaire", "lampe_solaire", "conso", 20, 80, 14, 10, "EMP-E1", "FOU-01", 2],
      ["ART-0008", "Kit scolaire", "kit_scolaire", "conso", 30, 120, 8, 10, "EMP-E3", "FOU-02", 4],
      ["ART-0009", "Lait en poudre · boîte de 400 g", "lait", "conso", 40, 160, 5.5, 12, "EMP-E2", "FOU-01", 6, null, 300],
      ["ART-0010", "Conserves de légumes · carton de 24", "conserves", "conso", 10, 40, 26, 1, "EMP-E2", "FOU-02", 1.4, null, 540],
      ["ART-0011", "Groupe électrogène 3 kW", "groupe", "pret", 0, 1, 1150, 1, "EMP-E3", "FOU-01", 0, "SN-GE3-0410"],
    ],
    lotsCourts: [["ART-0009", 24, 18], ["ART-0010", 3, 40]],
    kits: [{ id: "KIT-01", nom: "Kit d'accueil famille", lignes: [["ART-0001", 1], ["ART-0002", 2], ["ART-0004", 1], ["ART-0005", 2]] }],
  },
};

const metier = () => METIERS[(typeof S !== "undefined" && S && S.metier) || "loueur"] || METIERS.loueur;
const V = k => metier().v[k];
const logique = a => a.logique || metier().logique;
const aDesPrets = () => S.articles.some(a => logique(a) === "pret") && actif("MO-PRET");

/* ---------------- Construire la démo d'un métier ---------------- */
function construireDemo(m) {
  if (!METIERS[m] || m === "loueur") { const s = seedMouvements(SEED()); s.metier = "loueur"; return s; }
  const d = METIERS[m], st = SEED();
  st.metier = m;
  st.entreprise = Object.assign({}, st.entreprise, { nom: d.entreprise, adresse: "Adresse de l'entreprise" });
  st.installation = { livreLe: Date.now() - 20 * 86400000, heuresUtilisees: 1.5 };
  st.interventions = [];
  st.clientsLoc = [];
  st.clientsEv = {};
  st.modules = { "MO-PRET": d.articles.some(x => x[3] === "pret"), "MO-RES": false, "MO-KIT": d.kits.length > 0, "MO-CMD": true, "MO-DASH": true, "AL-SMS": false, "AL-WA": false };
  st.fournisseurs = d.fournisseurs; st.emplacements = d.emplacements; st.kits = d.kits; st.evenements = d.imputations.slice();
  st.articles = d.articles.map(([id, nom, im, lg, seuil, cible, prix, lot, emp, fou, jour, serie, dlcJours]) =>
    Object.assign({ id, nom, img: im, logique: lg, type: lg === "pret" && serie ? "equip" : "conso", unite: "", emp, seuil, cible, prix, lot, fou, jour }, serie ? { serie } : {}, dlcJours ? { dlcJours } : {}));
  st.equipe = st.equipe.filter(u => u.role !== "chauffeur"); // la tournée du chauffeur sert aux loueurs
  const postes = { terrain: d.v.terrain, bureau: d.v.bureau, direction: d.v.direction };
  st.equipe.forEach(u => { u.poste = postes[u.role]; });
  seedAutre(st, d);
  return st;
}

// Huit semaines de vie : sorties quotidiennes, livraisons quand le stock baisse, quelques pertes, quelques prêts.
function seedAutre(st, d) {
  let graine = 11;
  const alea = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  const J = 86400000, maintenant = Date.now(), debut = maintenant - 57 * J;
  let n = 0;
  const add = (t, profil, article, type, qte, extra) => {
    if (qte <= 0) return;
    n += 1;
    st.mouvements.push(Object.assign({ id: "MV-" + String(n).padStart(5, "0"), date: t, profil, qui: profil === "bureau" ? "Karim" : (n % 3 ? "Ousmane" : "Léa"), article, type, qte, evenement: "", motif: "", refac: false }, extra || {}));
  };
  const iso = t => new Date(t).toISOString().slice(0, 10);
  const q = {};
  st.articles.forEach(a => { q[a.id] = Math.round(a.cible * 1.1); add(debut, "bureau", a.id, "Inventaire initial", q[a.id], a.dlcJours ? { dlc: iso(debut + a.dlcJours * J) } : {}); });
  for (let j = 56; j >= 0; j--) {
    const t = maintenant - j * J;
    st.articles.forEach(a => {
      if (a.logique === "pret") {
        if (j % 6 === 2 && j > 3) { const ev = d.imputations[(j + a.id.charCodeAt(7)) % d.imputations.length]; add(t + 8 * 3600000, "terrain", a.id, "Prêt", 1, { evenement: ev }); add(t + 2 * J + 17 * 3600000, "terrain", a.id, "Retour", 1, { evenement: ev }); }
        return;
      }
      const jour = (d.nom.startsWith("Restaurant") && new Date(t).getDay() === 1) ? 0 : a.jour; // fermé le lundi
      let sortie = Math.round(jour * (.5 + alea()));
      if (a.lot > 1) sortie = Math.round(sortie / a.lot) * a.lot;
      sortie = Math.min(sortie, q[a.id]);
      if (sortie > 0 && j > 0) { add(t + 11 * 3600000, "terrain", a.id, "Sortie", sortie, { imputation: d.imputations[Math.floor(alea() * d.imputations.length)] }); q[a.id] -= sortie; }
      if (alea() < .05 && q[a.id] > 2 && j > 0) {
        const perte = Math.max(1, Math.round(a.jour * .3));
        add(t + 15 * 3600000, "terrain", a.id, "Perte", Math.min(perte, q[a.id]), { motif: d.dlc && a.dlcJours ? "Périmé" : "Abîmé" }); q[a.id] -= Math.min(perte, q[a.id]);
      }
      if (q[a.id] <= a.seuil && j > 2) {
        const r = a.cible - q[a.id];
        add(t + 7 * 3600000 + J, "terrain", a.id, "Entrée", r, Object.assign({ motif: "Livraison " + (st.fournisseurs.find(f => f.id === a.fou) || {}).nom }, a.dlcJours ? { dlc: iso(t + J + a.dlcJours * J) } : {}));
        q[a.id] += r;
      }
    });
  }
  // Des lots reçus récemment avec une date limite courte, pour montrer « à utiliser en premier »
  (d.lotsCourts || []).forEach(([id, qte, jours]) => add(maintenant - 2 * J, "terrain", id, "Entrée", qte, { motif: "Livraison", dlc: iso(maintenant + jours * J) }));
  // Ce qui est à l'atelier ou au nettoyage (le linge de l'hôtel, par exemple)
  (d.atelier || []).forEach(([id, qte, motif]) => { if (q[id] >= qte) { add(maintenant - J, "terrain", id, "Réparation", qte, { motif }); q[id] -= qte; } });
  // Un outil encore dehors, si le métier en prête
  const pret = st.articles.find(a => a.logique === "pret");
  if (pret) add(maintenant - 1 * J, "terrain", pret.id, "Prêt", 1, { evenement: d.imputations[0] });
  // Une livraison attendue, à réceptionner depuis le terrain
  const lignes = st.articles.filter(a => a.logique !== "pret").slice(0, 3).map(a => ({ id: a.id, qte: Math.max(a.lot, Math.round(a.cible / 3 / a.lot) * a.lot) }));
  const f = st.fournisseurs[0];
  st.commandes.push({ id: "CMD-0001", date: maintenant - 2 * J, fid: f.id, fournisseur: f.nom, lignes, total: lignes.reduce((t, l) => t + l.qte * st.articles.find(a => a.id === l.id).prix, 0), statut: "Envoyée" });
  st.mouvements.sort((a, b) => a.date - b.date);
}

/* ---------------- Lots et dates limites ---------------- */
// Les entrées les plus récentes sont celles qui restent en stock (on sort les plus anciennes d'abord).
function lotsEnStock(id) {
  let reste = Math.max(0, stock(id));
  const lots = [];
  S.mouvements.filter(m => m.article === id && m.dlc && ["Entrée", "Inventaire initial"].includes(m.type)).sort((a, b) => b.date - a.date).forEach(m => {
    if (reste <= 0) return;
    const qte = Math.min(reste, m.qte); reste -= qte; lots.push({ dlc: m.dlc, qte });
  });
  return lots.sort((a, b) => a.dlc.localeCompare(b.dlc));
}
function bientotPerimes(jours) {
  const limite = new Date(Date.now() + jours * 86400000).toISOString().slice(0, 10);
  const l = [];
  S.articles.forEach(a => lotsEnStock(a.id).filter(x => x.dlc <= limite).forEach(x => l.push({ a, dlc: x.dlc, qte: x.qte })));
  return l.sort((x, y) => x.dlc.localeCompare(y.dlc));
}
const dateFr = iso => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/* ---------------- Terrain : réceptionner une livraison ---------------- */
function tReception() {
  const attendues = S.commandes.filter(c => ["Envoyée", "Reçue en partie"].includes(c.statut));
  return `<h1>Réceptionner une livraison</h1><p class="sous">Le livreur est là : choisissez la commande, comptez ce qui arrive, photographiez le bon de livraison.</p>
  <ul class="t-liste">${attendues.map(c => `<li><button data-recep="${c.id}">${pic(I.camion)}<span><b>${esc(c.fournisseur)}</b><small>${c.id} · commandé le ${quand(c.date)} · ${c.lignes.length} ligne${c.lignes.length > 1 ? "s" : ""}${c.statut === "Reçue en partie" ? " · reliquat" : ""}</small></span><span class="n">${c.lignes.reduce((t, l) => t + (l.qte - (l.recu || 0)), 0)}</span></button></li>`).join("") || `<li class="vide">Aucune livraison attendue.</li>`}</ul>
  <p style="margin-top:14px"><button class="btn" data-recep="libre">Livraison sans commande</button></p>`;
}
function tReceptionCmd(id) {
  const libre = id === "libre", c = libre ? null : S.commandes.find(x => x.id === id);
  if (!libre && !c) return tReception();
  const lignes = libre ? S.articles.filter(a => logique(a) !== "pret").map(a => ({ id: a.id, qte: 0, recu: 0 })) : c.lignes;
  const dlc = metier().dlc;
  return `<h1>${libre ? "Livraison sans commande" : esc(c.fournisseur)}</h1><p class="sous">${libre ? "Indiquez ce qui arrive." : `Commande ${c.id}. Les quantités attendues sont déjà remplies : corrigez seulement si ça ne correspond pas.`}</p>
  <form data-form="recep" data-cmd-id="${libre ? "" : c.id}">
  ${libre ? `<label class="champ">Fournisseur<select name="fou">${S.fournisseurs.map(f => `<option value="${f.id}">${esc(f.nom)}</option>`).join("")}</select></label>` : ""}
  <ul class="t-liste">${lignes.map(l => { const a = art(l.id), attendu = l.qte - (l.recu || 0);
    return `<li><div class="t-retour recep">${img(a)}<span><b>${esc(a.nom)}</b><small>${libre ? "" : `attendu : ${attendu}`}</small>${dlc && a.dlcJours ? `<label class="dlc">Date limite <input type="date" name="dlc-${a.id}" value="${new Date(Date.now() + a.dlcJours * 86400000).toISOString().slice(0, 10)}"></label>` : ""}</span>
    <input type="number" inputmode="numeric" min="0" name="${a.id}" value="${libre ? 0 : attendu}" aria-label="Reçu : ${esc(a.nom)}"></div></li>`; }).join("")}</ul>
  <label class="btn" style="margin-top:12px">Photographier le bon de livraison<input type="file" accept="image/*" capture="environment" data-photo-bl class="cache"></label>
  <p class="sous" data-bl-etat style="margin-top:6px"></p>
  <div class="valider"><button type="button" class="btn" data-aller="reception">Annuler</button><button class="btn plein" style="background:var(--retour);border-color:var(--retour);color:#fff">Valider la réception</button></div></form>`;
}
let photoBL = "";
function validerReception(form) {
  const cid = form.dataset.cmdId, c = cid ? S.commandes.find(x => x.id === cid) : null;
  const fou = c ? c.fournisseur : (S.fournisseurs.find(f => f.id === form.fou.value) || {}).nom;
  const lignes = c ? c.lignes : S.articles.filter(a => logique(a) !== "pret").map(a => ({ id: a.id, qte: 0, recu: 0 }));
  let total = 0, ecarts = [];
  lignes.forEach(l => {
    const champ = form.elements[l.id]; if (!champ) return;
    const n = Math.max(0, Math.floor(+champ.value || 0)), attendu = l.qte - (l.recu || 0);
    if (n > 0) {
      const dl = form.elements["dlc-" + l.id];
      mouvement(l.id, "Entrée", n, Object.assign({ motif: "Livraison " + fou + (c ? " · " + c.id : "") }, dl && dl.value ? { dlc: dl.value } : {}, photoBL ? { photo: photoBL } : {}));
      total += n;
    }
    if (c) { l.recu = (l.recu || 0) + n; if (n !== attendu) ecarts.push(`${art(l.id).nom} : ${n} au lieu de ${attendu}`); }
  });
  if (!total) return toast("Indiquez au moins une quantité reçue.");
  if (c) c.statut = c.lignes.every(l => (l.recu || 0) >= l.qte) ? "Reçue" : "Reçue en partie";
  if (ecarts.length) S.alertes.unshift({ date: Date.now(), article: lignes[0].id, txt: `Écart de livraison (${fou}) : ${ecarts.join(", ")}.` });
  photoBL = ""; sauver();
  toast(ecarts.length ? `Réception enregistrée, ${ecarts.length} écart${ecarts.length > 1 ? "s" : ""} signalé${ecarts.length > 1 ? "s" : ""} au responsable.` : "Réception enregistrée.");
  aller("terrain");
}

function brancherMetiers() {
  $$("[data-recep]").forEach(b => b.onclick = () => aller("receptionCmd", b.dataset.recep));
  const fr = $('[data-form="recep"]'); if (fr) fr.onsubmit = e => { e.preventDefault(); validerReception(fr); };
  const bl = $("[data-photo-bl]"); if (bl) bl.onchange = () => {
    const fi = bl.files[0]; if (!fi) return;
    const lect = new FileReader();
    lect.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 900 / Math.max(im.width, im.height)), cv = document.createElement("canvas"); cv.width = im.width * k; cv.height = im.height * k; cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height); photoBL = cv.toDataURL("image/jpeg", .6); const e = $("[data-bl-etat]"); if (e) e.textContent = "Photo du bon de livraison jointe."; }; im.src = lect.result; };
    lect.readAsDataURL(fi);
  };
  $$("[data-metier]").forEach(s => s.onchange = () => {
    if (!confirm(`Passer la démo en « ${METIERS[s.value].nom} » ? Les données de démonstration sont remplacées.`)) { s.value = S.metier || "loueur"; return; }
    changerMetier(s.value);
  });
}
function changerMetier(m) {
  const garder = { monnaie: S.monnaie, reglages: S.reglages };
  S = construireDemo(m); Object.assign(S, garder); sauver();
  if (session) { const u = S.equipe.find(x => x.id === session.uid); if (u) session.nom = u.nom; }
  rendre(); toast(`Démo : ${METIERS[m].nom}.`);
}

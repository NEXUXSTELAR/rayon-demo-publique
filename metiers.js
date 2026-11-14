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
  // La brasserie suit la logique du loueur (ça part chez le bar, ça revient vide, bons, tournée, réservations) :
  // on part de la démo du loueur et on l'habille (objets, bars, mots). S.metier reste « loueur », S.variante dit « brasserie ».
  brasserie: {
    base: "loueur", vignette: "fut",
    entreprise: "Brasserie du Canal (démo)", nom: "Brasserie artisanale", logique: "pret", dlc: false,
    v: { imp: "Bar", imps: "bars", retourTitre: "Reprise des vides", retourSous: "fûts dehors", chez: "Chez les bars",
         pretSortie: "Part chez le bar", pretSortieSous: "Livraison", pretRetour: "Revient vide", pretRetourSous: "Je le range au lavage",
         prendre: "Je sors", prendreSous: "Sortie définitive", remettre: "Je remets", remettreSous: "Retour en stock",
         terrain: "Livreur", bureau: "Responsable des livraisons", direction: "Brasseur", parc: "Relevé de la cave", sortiesMot: "Livré",
         question: "Une tireuse et 20 fûts samedi ?", leDepart: "la livraison", chaque: "fût" },
    habillage: {
      articles: {
        "ART-0001": { nom: "Fût inox 30 L", img: "fut", unite: "fût", prix: 95, loc: 4 },
        "ART-0002": { nom: "Fût inox 20 L", img: "fut", unite: "fût", prix: 85, loc: 3 },
        "ART-0003": { nom: "Gobelet réutilisable 50 cl", img: "gobelet", unite: "gobelet", prix: 1.2, loc: 0.2 },
        "ART-0004": { nom: "Verre à bière 50 cl", img: "verre_biere", unite: "verre", prix: 2.5, loc: 0.3 },
        "ART-0005": { nom: "Mange-debout", img: "mange_debout", unite: "mange-debout", prix: 120, loc: 8 },
        "ART-0006": { nom: "Tireuse mobile 2 becs n°1", img: "tireuse", unite: "tireuse", prix: 690, loc: 60, serie: "SN-TIR-0201" },
        "ART-0007": { nom: "Tireuse mobile 2 becs n°2", img: "tireuse", unite: "tireuse", prix: 690, loc: 60, serie: "SN-TIR-0202" },
        "ART-0008": { nom: "Bouteille de CO2 · 10 kg n°1", img: "co2", unite: "bouteille", prix: 70, loc: 10, serie: "SN-CO2-1001" },
        "ART-0009": { nom: "Tête de soutirage type S", img: "tete_soutirage", unite: "tête", prix: 45, loc: 5 },
        "ART-0010": { nom: "Caisse de 24 bouteilles consignées", img: "caisse_biere", unite: "caisse", prix: 12, loc: 0 },
        "ART-0011": { nom: "Tente 3 × 6 m", img: "tente", unite: "tente", prix: 900, loc: 80 },
      },
      evenements: { "Mariage · salle des fêtes": "Le Comptoir des Halles", "Séminaire · hôtel": "Bar Le Quai", "Anniversaire · particulier": "Restaurant La Cour",
        "Fête de quartier · association": "Fête du quartier · samedi", "Mariage · samedi": "Fête de la bière · samedi", "Séminaire d'entreprise": "Festival du Canal", "Gala de fin d'année": "Marché de Noël" },
      adresses: { "Hôtel du centre, salle Horizon": "Bar Le Quai, 4 quai du Canal", "Salle des fêtes, place de la Mairie": "Le Comptoir des Halles, place du Marché",
        "12 rue des Lilas, jardin": "Restaurant La Cour, 12 rue des Lilas", "Domaine des Tilleuls, route du Lac": "Place de la Fontaine", "Parc des expositions, hall B": "Halle du marché couvert" },
      clients: { "CL-001": "Le Comptoir des Halles (démo)", "CL-002": "Bar Le Quai (démo)", "CL-003": "Comité des fêtes (démo)" },
      fournisseurs: [{ id: "FOU-01", nom: "Fournisseur de fûts inox (démo)", delai: 15 }, { id: "FOU-02", nom: "Fournisseur de verrerie et caisses (démo)", delai: 5 }, { id: "FOU-03", nom: "Fournisseur de matériel de tirage (démo)", delai: 7 }],
      emplacements: [{ id: "EMP-A1", nom: "Cave · fûts" }, { id: "EMP-B2", nom: "Réserve · verres et gobelets" }, { id: "EMP-C1", nom: "Local matériel de tirage" }, { id: "EMP-D1", nom: "Quai · caisses consignées" }, { id: "EMP-E1", nom: "Cour · tentes et mange-debout" }],
      kits: [{ id: "KIT-01", nom: "Kit fête de quartier", lignes: [["ART-0006", 1], ["ART-0008", 1], ["ART-0009", 2], ["ART-0003", 200]] },
             { id: "KIT-02", nom: "Kit dégustation", lignes: [["ART-0005", 4], ["ART-0004", 50]] }],
    },
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
    // Contrôles périodiques : [nom du contrôle, jours avant l'échéance (négatif = en retard), rythme en mois]
    controles: { "ART-0009": ["Vérification périodique", 18, 12], "ART-0011": ["Vérification annuelle", -4, 12], "ART-0012": ["Vérification périodique", 200, 12] },
    // Stock par lieu : [identifiant, nom, { objet: [dotation, quantité chargée] }]
    lieux: { mot: "Fourgons", geste: "Charger un fourgon", liste: [
      ["LIEU-01", "Fourgon 1", { "ART-0001": [20, 14], "ART-0003": [2, 2], "ART-0005": [3, 3], "ART-0013": [4, 2], "ART-0014": [2, 2], "ART-0004": [1, 1] }],
      ["LIEU-02", "Fourgon 2", { "ART-0001": [15, 15], "ART-0013": [5, 5], "ART-0017": [10, 10], "ART-0005": [2, 2] }]] },
    kits: [{ id: "KIT-01", nom: "Kit tableau électrique", lignes: [["ART-0001", 10], ["ART-0003", 1], ["ART-0005", 1]] },
           { id: "KIT-02", nom: "Kit EPI chantier", lignes: [["ART-0010", 1], ["ART-0015", 1], ["ART-0004", 1]] }],
  },
  industrie: {
    entreprise: "Atelier Méca (démo)", nom: "Sous-traitance industrielle", logique: "conso", dlc: false,
    v: { imp: "Affaire", imps: "affaires", retourTitre: "Rendre l'outillage", retourSous: "outils sortis", chez: "Aux postes",
         pretSortie: "Je l'emprunte", pretSortieSous: "Pour un poste ou une affaire", pretRetour: "Je le rends", pretRetourSous: "Il revient au magasin",
         prendre: "J'en prends", prendreSous: "Pour une affaire", remettre: "Je remets le surplus", remettreSous: "Pas utilisé",
         terrain: "Opérateur", bureau: "Chef d'atelier", direction: "Gérant", parc: "Relevé du magasin", sortiesMot: "Consommé" },
    imputations: ["Affaire 2417 · carters aluminium", "Affaire 2422 · série de 200 brides", "Maintenance · centre d'usinage n°3", "Prototype · support moteur"],
    fournisseurs: [{ id: "FOU-01", nom: "Distributeur d'outils coupants (démo)", delai: 2 }, { id: "FOU-02", nom: "Négociant en métaux (démo)", delai: 5 }, { id: "FOU-03", nom: "Fournisseur de consommables et EPI (démo)", delai: 3 }],
    emplacements: [{ id: "EMP-A1", nom: "Magasin · armoire outils coupants" }, { id: "EMP-A2", nom: "Magasin · porte-outils et cônes" }, { id: "EMP-M1", nom: "Salle de mesure" }, { id: "EMP-R1", nom: "Racks matière" }, { id: "EMP-S1", nom: "Poste de soudure" }, { id: "EMP-C1", nom: "Magasin · EPI et consommables" }],
    articles: [
      ["ART-0001", "Plaquettes carbure CNMG · boîte de 10", "plaquette_carbure", "conso", 4, 15, 98, 1, "EMP-A1", "FOU-01", .5],
      ["ART-0002", "Fraise carbure Ø12 · 4 dents", "fraise", "conso", 3, 10, 64, 1, "EMP-A1", "FOU-01", .3],
      ["ART-0003", "Foret carbure Ø8,5", "foret", "conso", 3, 10, 42, 1, "EMP-A1", "FOU-01", .3],
      ["ART-0004", "Taraud machine M8", "taraud", "conso", 4, 12, 28, 1, "EMP-A1", "FOU-01", .2],
      ["ART-0005", "Micromètre 0-25 mm n°1", "micrometre", "pret", 0, 1, 185, 1, "EMP-M1", "FOU-01", 0, "SN-MIC-2501"],
      ["ART-0006", "Porte-outil HSK63 n°1", "porte_outil", "pret", 0, 1, 340, 1, "EMP-A2", "FOU-01", 0, "SN-HSK-6301"],
      ["ART-0007", "Pied à coulisse 150 mm n°1", "pied_coulisse", "pret", 0, 1, 129, 1, "EMP-M1", "FOU-01", 0, "SN-PAC-1501"],
      ["ART-0008", "Calibre tampon M8", "calibre", "pret", 0, 1, 76, 1, "EMP-M1", "FOU-01", 0, "SN-CT-0808"],
      ["ART-0009", "Clé dynamométrique 5-60 N·m", "cle_dynamo", "pret", 0, 1, 210, 1, "EMP-A2", "FOU-01", 0, "SN-CD-0560"],
      ["ART-0010", "Barre alu 2017 Ø40 · 3 m", "barre_alu", "conso", 4, 15, 58, 1, "EMP-R1", "FOU-02", .4],
      ["ART-0011", "Tôle acier S235 · 2 mm", "tole", "conso", 5, 20, 46, 1, "EMP-R1", "FOU-02", .5],
      ["ART-0012", "Fil de soudure MIG 1 mm · bobine 15 kg", "bobine_mig", "conso", 2, 6, 52, 1, "EMP-S1", "FOU-03", .15],
      ["ART-0013", "Disque à tronçonner 125 mm · boîte de 25", "disque", "conso", 2, 8, 35, 1, "EMP-S1", "FOU-03", .2],
      ["ART-0014", "Huile de coupe soluble · bidon 20 L", "huile_moteur", "conso", 2, 6, 118, 1, "EMP-C1", "FOU-03", .1],
      ["ART-0015", "Gants anti-coupure · paire", "gants", "conso", 10, 40, 6.5, 5, "EMP-C1", "FOU-03", 1.5],
      ["ART-0016", "Lunettes de protection", "lunettes", "conso", 5, 20, 4.5, 1, "EMP-C1", "FOU-03", .3],
    ],
    controles: { "ART-0005": ["Étalonnage", 150, 12], "ART-0007": ["Étalonnage", -9, 12], "ART-0008": ["Étalonnage", 12, 12], "ART-0009": ["Étalonnage", 26, 12] },
    kits: [{ id: "KIT-01", nom: "Kit de réglage série brides", lignes: [["ART-0002", 1], ["ART-0003", 1], ["ART-0004", 1]] },
           { id: "KIT-02", nom: "Kit EPI atelier", lignes: [["ART-0015", 1], ["ART-0016", 1]] }],
  },
  paysagiste: {
    entreprise: "Jardins et Espaces Verts (démo)", nom: "Paysagiste et espaces verts", logique: "conso", dlc: false,
    v: { imp: "Chantier", imps: "chantiers", retourTitre: "Rentrer le matériel", retourSous: "machines dehors", chez: "Sur les chantiers",
         pretSortie: "Je l'emprunte", pretSortieSous: "Pour un chantier", pretRetour: "Je le rends", pretRetourSous: "Il revient au dépôt",
         prendre: "J'en prends", prendreSous: "Pour un chantier", remettre: "Je remets le surplus", remettreSous: "Pas utilisé sur le chantier",
         terrain: "Chef d'équipe", bureau: "Conducteur de travaux", direction: "Gérant", parc: "Relevé du dépôt", sortiesMot: "Posé sur chantier" },
    imputations: ["Résidence Les Tilleuls · entretien", "Siège d'entreprise · espaces verts", "Jardin particulier · création", "Copropriété Le Parc · taille"],
    fournisseurs: [{ id: "FOU-01", nom: "Concessionnaire de motoculture (démo)", delai: 3 }, { id: "FOU-02", nom: "Pépinière (démo)", delai: 5 }, { id: "FOU-03", nom: "Fournisseur de fournitures et EPI (démo)", delai: 2 }],
    emplacements: [{ id: "EMP-A1", nom: "Dépôt · machines thermiques" }, { id: "EMP-A2", nom: "Dépôt · machines à batterie et chargeurs" }, { id: "EMP-B1", nom: "Dépôt · fournitures" }, { id: "EMP-C1", nom: "Dépôt · EPI" }, { id: "EMP-V1", nom: "Fourgon équipe 1" }, { id: "EMP-V2", nom: "Fourgon équipe 2" }],
    articles: [
      ["ART-0001", "Paillage · sac de 50 L", "paillage", "conso", 10, 40, 9, 5, "EMP-B1", "FOU-02", 2],
      ["ART-0002", "Fil de débroussailleuse · bobine", "fil_debroussaille", "conso", 3, 10, 38, 1, "EMP-B1", "FOU-03", .3],
      ["ART-0003", "Huile 2 temps · bidon 5 L", "huile_moteur", "conso", 2, 6, 42, 1, "EMP-B1", "FOU-03", .2],
      ["ART-0004", "Gants de travail · paire", "gants", "conso", 10, 30, 6, 5, "EMP-C1", "FOU-03", 1],
      ["ART-0005", "Casque de protection", "casque", "conso", 2, 8, 18, 1, "EMP-C1", "FOU-03", .1],
      ["ART-0006", "Taille-haie à batterie n°1", "taille_haie", "pret", 0, 1, 420, 1, "EMP-A2", "FOU-01", 0, "SN-TH-2201"],
      ["ART-0007", "Taille-haie à batterie n°2", "taille_haie", "pret", 0, 1, 420, 1, "EMP-A2", "FOU-01", 0, "SN-TH-2202"],
      ["ART-0008", "Batterie 36 V n°1", "batterie", "pret", 0, 1, 260, 1, "EMP-A2", "FOU-01", 0, "SN-BT-3601"],
      ["ART-0009", "Batterie 36 V n°2", "batterie", "pret", 0, 1, 260, 1, "EMP-A2", "FOU-01", 0, "SN-BT-3602"],
      ["ART-0010", "Débroussailleuse thermique n°1", "debroussailleuse", "pret", 0, 1, 690, 1, "EMP-A1", "FOU-01", 0, "SN-DB-1101"],
      ["ART-0011", "Débroussailleuse thermique n°2", "debroussailleuse", "pret", 0, 1, 690, 1, "EMP-A1", "FOU-01", 0, "SN-DB-1102"],
      ["ART-0012", "Souffleur à dos", "souffleur", "pret", 0, 1, 540, 1, "EMP-A1", "FOU-01", 0, "SN-SF-0501"],
      ["ART-0013", "Tronçonneuse n°1", "tronconneuse", "pret", 0, 1, 610, 1, "EMP-A1", "FOU-01", 0, "SN-TR-0801"],
    ],
    lieux: { mot: "Fourgons", geste: "Charger un fourgon", liste: [
      ["LIEU-01", "Fourgon 1", { "ART-0001": [10, 5], "ART-0002": [2, 2], "ART-0003": [1, 1], "ART-0004": [5, 5] }],
      ["LIEU-02", "Fourgon 2", { "ART-0002": [2, 1], "ART-0003": [1, 1], "ART-0004": [5, 5], "ART-0005": [2, 2] }]] },
    kits: [{ id: "KIT-01", nom: "Kit taille équipe", lignes: [["ART-0006", 1], ["ART-0008", 1], ["ART-0009", 1]] },
           { id: "KIT-02", nom: "Kit EPI débroussaillage", lignes: [["ART-0004", 1], ["ART-0005", 1]] }],
  },
  menuisier: {
    entreprise: "Menuiserie des Halles (démo)", nom: "Menuisier-poseur et agenceur", logique: "conso", dlc: false,
    v: { imp: "Chantier", imps: "chantiers", retourTitre: "Rentrer le matériel", retourSous: "machines dehors", chez: "Sur les chantiers",
         pretSortie: "Je l'emprunte", pretSortieSous: "Pour un chantier", pretRetour: "Je le rends", pretRetourSous: "Il revient au dépôt",
         prendre: "J'en prends", prendreSous: "Pour un chantier", remettre: "Je remets le surplus", remettreSous: "Pas utilisé sur le chantier",
         terrain: "Poseur", bureau: "Chef d'atelier", direction: "Gérant", parc: "Relevé du dépôt", sortiesMot: "Posé sur chantier" },
    imputations: ["Chantier Martin · fenêtres", "Boutique rue des Arts · agencement", "Résidence Le Parc · portes palières", "Chantier Durand · cuisine"],
    fournisseurs: [{ id: "FOU-01", nom: "Fournisseur d'outillage (démo)", delai: 3 }, { id: "FOU-02", nom: "Négoce de quincaillerie (démo)", delai: 2 }, { id: "FOU-03", nom: "Fournisseur de produits de pose (démo)", delai: 2 }],
    emplacements: [{ id: "EMP-A1", nom: "Dépôt · machines" }, { id: "EMP-A2", nom: "Dépôt · mesure et levage" }, { id: "EMP-B1", nom: "Dépôt · produits de pose" }, { id: "EMP-B2", nom: "Dépôt · quincaillerie" }, { id: "EMP-V1", nom: "Fourgon équipe 1" }, { id: "EMP-V2", nom: "Fourgon équipe 2" }],
    articles: [
      ["ART-0001", "Mousse expansive · cartouche", "mousse_pu", "conso", 12, 48, 8, 12, "EMP-B1", "FOU-03", 2],
      ["ART-0002", "Silicone · cartouche", "silicone", "conso", 12, 48, 6, 12, "EMP-B1", "FOU-03", 2],
      ["ART-0003", "Cales de vitrage · boîte", "cales", "conso", 4, 12, 14, 1, "EMP-B1", "FOU-03", .4],
      ["ART-0004", "Vis de fixation · boîte de 200", "vis", "conso", 6, 20, 18, 1, "EMP-B2", "FOU-02", .8],
      ["ART-0005", "Gants de travail · paire", "gants", "conso", 10, 30, 6, 5, "EMP-B2", "FOU-02", 1],
      ["ART-0006", "Laser de chantier n°1", "laser", "pret", 0, 1, 640, 1, "EMP-A2", "FOU-01", 0, "SN-LA-2201"],
      ["ART-0007", "Scie plongeante n°1", "scie_plongeante", "pret", 0, 1, 520, 1, "EMP-A1", "FOU-01", 0, "SN-SP-1101"],
      ["ART-0008", "Scie plongeante n°2", "scie_plongeante", "pret", 0, 1, 520, 1, "EMP-A1", "FOU-01", 0, "SN-SP-1102"],
      ["ART-0009", "Ventouse de pose de vitrage", "ventouse", "pret", 0, 2, 180, 1, "EMP-A2", "FOU-01", 0],
      ["ART-0010", "Visseuse à batterie n°1", "visseuse", "pret", 0, 1, 290, 1, "EMP-A1", "FOU-01", 0, "SN-VI-3301"],
      ["ART-0011", "Visseuse à batterie n°2", "visseuse", "pret", 0, 1, 290, 1, "EMP-A1", "FOU-01", 0, "SN-VI-3302"],
      ["ART-0012", "Batterie 18 V n°1", "batterie", "pret", 0, 1, 110, 1, "EMP-A1", "FOU-01", 0, "SN-BT-1801"],
      ["ART-0013", "Batterie 18 V n°2", "batterie", "pret", 0, 1, 110, 1, "EMP-A1", "FOU-01", 0, "SN-BT-1802"],
    ],
    controles: { "ART-0006": ["Étalonnage", 21, 12], "ART-0009": ["Vérification périodique", 95, 6] },
    lieux: { mot: "Fourgons", geste: "Charger un fourgon", liste: [
      ["LIEU-01", "Fourgon 1", { "ART-0001": [12, 8], "ART-0002": [12, 12], "ART-0003": [2, 2], "ART-0004": [3, 2], "ART-0005": [5, 5] }],
      ["LIEU-02", "Fourgon 2", { "ART-0001": [6, 6], "ART-0002": [6, 6], "ART-0004": [2, 2] }]] },
    kits: [{ id: "KIT-01", nom: "Kit pose de fenêtres", lignes: [["ART-0006", 1], ["ART-0009", 2], ["ART-0010", 1], ["ART-0012", 1]] },
           { id: "KIT-02", nom: "Kit produits de pose", lignes: [["ART-0001", 6], ["ART-0002", 4], ["ART-0003", 1]] }],
  },
  // Ambulances : la dotation de chaque véhicule, ce qui manque, ce qui périme. Le matériel unique (défibrillateur, brancard) se suit par le prêt et le contrôle.
  ambulance: {
    entreprise: "Ambulances du Canal (démo)", nom: "Ambulances et transport sanitaire", logique: "conso", dlc: true, alerteDlc: 30,
    v: { imp: "Service", imps: "services", retourTitre: "Rentrer le matériel", retourSous: "matériel sorti", chez: "En service",
         pretSortie: "Je le prends", pretSortieSous: "Pour un service", pretRetour: "Je le rends", pretRetourSous: "Il revient au dépôt",
         prendre: "J'en utilise", prendreSous: "Pendant un service", remettre: "Je remets le surplus", remettreSous: "Pas utilisé",
         terrain: "Ambulancier", bureau: "Régulateur ou responsable", direction: "Gérant", parc: "Relevé du dépôt", sortiesMot: "Utilisé" },
    imputations: ["Service de jour", "Garde de nuit", "Transports programmés", "Garde départementale"],
    fournisseurs: [{ id: "FOU-01", nom: "Fournisseur de matériel médical (démo)", delai: 3 }, { id: "FOU-02", nom: "Fournisseur de gaz médicaux (démo)", delai: 2 }],
    emplacements: [{ id: "EMP-A1", nom: "Dépôt · consommables" }, { id: "EMP-A2", nom: "Dépôt · oxygène" }, { id: "EMP-B1", nom: "Dépôt · matériel" }],
    articles: [
      ["ART-0001", "Compresses stériles · boîte de 50", "compresses", "conso", 8, 30, 4.5, 1, "EMP-A1", "FOU-01", .8, null, 400],
      ["ART-0002", "Pansements absorbants · boîte de 20", "pansements", "conso", 6, 20, 6, 1, "EMP-A1", "FOU-01", .4, null, 500],
      ["ART-0003", "Gants d'examen · boîte de 100", "gants", "conso", 8, 30, 7.5, 1, "EMP-A1", "FOU-01", 1],
      ["ART-0004", "Draps à usage unique · rouleau", "draps_examen", "conso", 8, 28, 9, 1, "EMP-A1", "FOU-01", .8],
      ["ART-0005", "Masque à oxygène adulte", "masque_oxygene", "conso", 8, 30, 3.2, 1, "EMP-A1", "FOU-01", .6, null, 700],
      ["ART-0006", "Solution désinfectante · flacon 500 mL", "ethanol", "conso", 6, 20, 5.5, 1, "EMP-A1", "FOU-01", .5, null, 365],
      ["ART-0007", "Couverture de survie", "couverture", "conso", 12, 50, 1.8, 1, "EMP-A1", "FOU-01", .8],
      ["ART-0008", "Bouteille d'oxygène 5 L", "oxygene", "conso", 4, 14, 95, 1, "EMP-A2", "FOU-02", .3],
      ["ART-0009", "Kit de désinfection du véhicule", "kit_hygiene", "conso", 4, 14, 14, 1, "EMP-A1", "FOU-01", .3, null, 365],
      ["ART-0010", "Défibrillateur n°1", "defibrillateur", "pret", 0, 1, 1450, 1, "EMP-B1", "FOU-01", 0, "SN-DEF-0101"],
      ["ART-0011", "Aspirateur de mucosités n°1", "aspirateur_mucosites", "pret", 0, 1, 420, 1, "EMP-B1", "FOU-01", 0, "SN-ASP-0201"],
      ["ART-0012", "Brancard n°1", "brancard", "pret", 0, 1, 2800, 1, "EMP-B1", "FOU-01", 0, "SN-BRA-0301"],
      ["ART-0013", "Matelas à dépression n°1", "matelas_depression", "pret", 0, 1, 390, 1, "EMP-B1", "FOU-01", 0, "SN-MAD-0401"],
      ["ART-0014", "Attelles à dépression · jeu n°1", "attelles", "pret", 0, 1, 260, 1, "EMP-B1", "FOU-01", 0, "SN-ATT-0501"],
    ],
    lotsCourts: [["ART-0001", 6, 2], ["ART-0005", 4, 20]],
    controles: { "ART-0010": ["Vérification annuelle", 20, 12], "ART-0011": ["Maintenance", -5, 12], "ART-0012": ["Vérification annuelle", 120, 12] },
    lieux: { mot: "Véhicules", geste: "Charger un véhicule", liste: [
      ["LIEU-01", "Ambulance 1", { "ART-0001": [4, 4], "ART-0002": [3, 2], "ART-0003": [2, 2], "ART-0004": [3, 3], "ART-0005": [4, 4], "ART-0006": [1, 1], "ART-0007": [5, 5], "ART-0008": [2, 2], "ART-0009": [1, 1] }],
      ["LIEU-02", "Ambulance 2", { "ART-0001": [4, 4], "ART-0002": [3, 3], "ART-0003": [2, 2], "ART-0004": [3, 3], "ART-0005": [4, 4], "ART-0006": [1, 1], "ART-0007": [5, 5], "ART-0008": [2, 1], "ART-0009": [1, 1] }],
      ["LIEU-03", "VSL 1", { "ART-0003": [1, 1], "ART-0004": [2, 2], "ART-0006": [1, 1], "ART-0007": [2, 2] }]] },
    kits: [],
  },
  // Propreté : les produits dans le local de chaque site client, les machines prêtées à un site.
  proprete: {
    entreprise: "Clair Net Services (démo)", nom: "Propreté et nettoyage", logique: "conso", dlc: false,
    v: { imp: "Site", imps: "sites", retourTitre: "Rentrer une machine", retourSous: "machines sur les sites", chez: "Sur les sites",
         pretSortie: "Part sur un site", pretSortieSous: "Je l'y laisse", pretRetour: "Revient", pretRetourSous: "Elle revient au dépôt",
         prendre: "J'en utilise", prendreSous: "Sur un site", remettre: "Je remets le surplus", remettreSous: "Pas utilisé",
         terrain: "Agent", bureau: "Chef de secteur", direction: "Gérant", parc: "Relevé du dépôt", sortiesMot: "Utilisé" },
    imputations: ["Bureaux Canal Sud", "Clinique des Tilleuls", "Résidence Le Parc", "Remise en état · ponctuel"],
    fournisseurs: [{ id: "FOU-01", nom: "Fournisseur de produits d'entretien (démo)", delai: 3 }, { id: "FOU-02", nom: "Fournisseur de machines de nettoyage (démo)", delai: 7 }],
    emplacements: [{ id: "EMP-A1", nom: "Dépôt · produits" }, { id: "EMP-A2", nom: "Dépôt · papier et sacs" }, { id: "EMP-B1", nom: "Dépôt · machines" }],
    articles: [
      ["ART-0001", "Détergent multi-usages · bidon 5 L", "jerrican", "conso", 6, 24, 11, 1, "EMP-A1", "FOU-01", .8],
      ["ART-0002", "Désinfectant de surfaces · bidon 5 L", "desinfectant", "conso", 5, 20, 16, 1, "EMP-A1", "FOU-01", .6],
      ["ART-0003", "Savon pour les mains · bidon 5 L", "savon", "conso", 4, 16, 13, 1, "EMP-A1", "FOU-01", .4],
      ["ART-0004", "Sacs-poubelle 110 L · rouleau", "sacs_poubelle", "conso", 10, 40, 4.5, 1, "EMP-A2", "FOU-01", 2],
      ["ART-0005", "Papier toilette · colis", "papier_toilette", "conso", 6, 24, 18, 1, "EMP-A2", "FOU-01", 1],
      ["ART-0006", "Essuie-mains · colis", "essuie_mains", "conso", 6, 24, 21, 1, "EMP-A2", "FOU-01", .8],
      ["ART-0007", "Lavettes microfibre · lot de 10", "lavettes", "conso", 4, 16, 8, 1, "EMP-A1", "FOU-01", .4],
      ["ART-0008", "Franges de lavage", "frange", "conso", 8, 30, 3.5, 1, "EMP-A1", "FOU-01", .8],
      ["ART-0009", "Gants de ménage · paire", "gants", "conso", 10, 40, 1.6, 5, "EMP-A1", "FOU-01", 1.5],
      ["ART-0010", "Autolaveuse n°1", "autolaveuse", "pret", 0, 1, 3900, 1, "EMP-B1", "FOU-02", 0, "SN-AUT-0101"],
      ["ART-0011", "Monobrosse n°1", "monobrosse", "pret", 0, 1, 1250, 1, "EMP-B1", "FOU-02", 0, "SN-MON-0201"],
      ["ART-0012", "Aspirateur dorsal n°1", "aspirateur_dorsal", "pret", 0, 1, 480, 1, "EMP-B1", "FOU-02", 0, "SN-ASD-0301"],
      ["ART-0013", "Aspirateur dorsal n°2", "aspirateur_dorsal", "pret", 0, 1, 480, 1, "EMP-B1", "FOU-02", 0, "SN-ASD-0302"],
      ["ART-0014", "Injecteur-extracteur n°1", "injecteur_extracteur", "pret", 0, 1, 1650, 1, "EMP-B1", "FOU-02", 0, "SN-INJ-0401"],
    ],
    controles: { "ART-0010": ["Entretien", 15, 6], "ART-0011": ["Entretien", -6, 12], "ART-0014": ["Contrôle électrique", 140, 12] },
    lieux: { mot: "Sites", geste: "Approvisionner un site", liste: [
      ["LIEU-01", "Bureaux Canal Sud", { "ART-0001": [2, 2], "ART-0002": [1, 1], "ART-0003": [1, 1], "ART-0004": [6, 3], "ART-0005": [3, 3], "ART-0006": [3, 2], "ART-0007": [2, 2], "ART-0008": [4, 4] }],
      ["LIEU-02", "Clinique des Tilleuls", { "ART-0001": [2, 2], "ART-0002": [3, 3], "ART-0003": [2, 2], "ART-0004": [8, 8], "ART-0005": [4, 4], "ART-0006": [4, 4], "ART-0008": [6, 6], "ART-0009": [10, 5] }],
      ["LIEU-03", "Résidence Le Parc", { "ART-0001": [1, 1], "ART-0004": [4, 4], "ART-0007": [1, 1], "ART-0008": [2, 2] }]] },
    kits: [],
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
    controles: { "ART-0010": ["Vérification périodique", 21, 12], "ART-0011": ["Étalonnage", -4, 12] },
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

const metier = () => {
  const s = typeof S !== "undefined" && S;
  const m = s && s.variante && METIERS[s.variante] ? Object.assign({}, METIERS.loueur, METIERS[s.variante]) : METIERS[(s && s.metier) || "loueur"] || METIERS.loueur;
  // Une liste importée dans Mon espace avec des dates limites allume le suivi par lots, quel que soit le métier (liste.js)
  return s && s.suiviLots && !m.dlc ? Object.assign({}, m, { dlc: true }) : m;
};
const V = k => metier().v[k];
// Vrai seulement pour la démo du loueur de matériel de réception (la brasserie part de la même base, avec ses mots à elle).
const estLoueur = () => (S.metier || "loueur") === "loueur" && !S.variante;
// Le mot du métier pour « événement » : chantier, service, bar, projet… Chez le quincaillier, où ce mot est « client », on dit « vente ».
const motImp = () => { const m = (V("imp") || "Événement").toLowerCase(); return m === "client" ? "vente" : m; };
const motImps = () => { const m = V("imps") || "événements"; return m === "clients" ? "ventes" : m; };
const logique = a => a.logique || metier().logique;
const aDesPrets = () => S.articles.some(a => logique(a) === "pret") && actif("MO-PRET");

/* ---------------- Construire la démo d'un métier ---------------- */
// Stock par lieu (lieux.js) : les fourgons de la démo, leur dotation, et ce qu'on y a chargé il y a trois jours.
// Le stock total ne bouge pas : un transfert déplace, il ne consomme pas. Le dépôt garde toujours au moins la moitié.
function semerLieux(st, d) {
  const plus = ["Inventaire initial", "Entrée", "Retour", "Ajustement", "Retour réparation"], moins = ["Prêt", "Perte", "Sortie", "Réparation"];
  const reste = {}; st.articles.forEach(a => { reste[a.id] = st.mouvements.filter(m => m.article === a.id).reduce((t, m) => t + (plus.includes(m.type) ? m.qte : moins.includes(m.type) ? -m.qte : 0), 0); });
  const total = Object.assign({}, reste);
  st.motLieux = d.mot; st.gesteLieu = d.geste;
  st.lieux = d.liste.map(([id, nom, dot]) => ({ id, nom, dot: Object.fromEntries(Object.entries(dot).map(([k, v]) => [k, v[0]])) }));
  const quand = new Date(Date.now() - 3 * 86400000).setHours(7, 30, 0, 0); let n = 0;
  d.liste.forEach(([id, nom, dot], i) => Object.entries(dot).forEach(([aid, [, charge]]) => {
    const q = Math.min(charge, Math.floor(Math.max(0, reste[aid] || 0) / 2)); if (q <= 0) return;
    reste[aid] -= q; n += 1;
    const lots = prendreLots(lotsDepotDe(st.mouvements, st.lieux, aid, lotsTotaux(st.mouvements, aid, total[aid])), q);
    st.mouvements.push(Object.assign({ id: "MV-T" + String(n).padStart(4, "0"), date: quand + i * 600000 + n * 20000, profil: "terrain", qui: i % 2 ? "Léa" : "Ousmane", article: aid, type: "Transfert", qte: q, evenement: "", motif: `Dépôt → ${nom}`, de: "", vers: id }, lots.length ? { lots } : {}));
  }));
  st.lieuDe = { "U-01": d.liste[0][0], "U-02": (d.liste[1] || d.liste[0])[0] };
  st.mouvements.sort((a, b) => a.date - b.date);
}
// Inventaire tournant : la démo part avec une zone comptée par semaine, la première étant la plus ancienne.
function semerComptages(st) {
  const n = st.emplacements.length; st.comptages = {};
  st.emplacements.forEach((e, i) => { st.comptages[e.id] = Date.now() - ((n - i) * 7 + 2) * 86400000; });
  return st;
}
// regler (facultatif) : ajuste l'état avant que son historique soit fabriqué. Sert aux établissements d'un groupe (groupe.js).
// La présentation de l'accueil (config.js) est un réglage d'installation : elle suit l'entreprise quand la démo est refaite.
function construireDemo(m, regler) {
  const st = fabriquerDemo(m, regler);
  try { if (S && S.presentation) st.presentation = S.presentation; } catch (e) { /* premier chargement : pas encore d'état */ }
  return st;
}
function fabriquerDemo(m, regler) {
  if (!METIERS[m] || m === "loueur") { const s0 = SEED(); if (regler) regler(s0); const s = seedMouvements(s0); s.metier = "loueur"; return semerComptages(s); }
  if (METIERS[m].base === "loueur") return semerComptages(habiller(seedMouvements(SEED()), METIERS[m], m));
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
  if (regler) regler(st);
  seedAutre(st, d);
  // Les objets à contrôler : la date tombe toujours au même écart d'aujourd'hui, le dernier contrôle un rythme plus tôt
  Object.entries(d.controles || {}).forEach(([id, [nom, jours, mois]]) => {
    const a = st.articles.find(x => x.id === id); if (!a) return;
    const le = new Date(Date.now() + jours * 86400000), fait = new Date(le); fait.setMonth(fait.getMonth() - mois);
    const iso = t => { const x = new Date(t); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
    Object.assign(a, { ctrlNom: nom, ctrlLe: iso(le), ctrlMois: mois, ctrlFait: iso(fait), ctrlQui: "Karim" });
  });
  if (d.lieux) semerLieux(st, d.lieux);
  return semerComptages(st);
}

// Une variante du loueur : mêmes gestes et mêmes données, autres objets et autres mots. Les objets sans équivalent sont retirés.
function habiller(st, d, m) {
  const h = d.habillage, garde = id => !!h.articles[id];
  st.metier = "loueur"; st.variante = m;
  st.entreprise = Object.assign({}, st.entreprise, { nom: d.entreprise });
  st.articles = st.articles.filter(a => garde(a.id)).map(a => Object.assign({}, a, h.articles[a.id]));
  const ev = x => h.evenements[x] || x;
  st.evenements = st.evenements.map(ev);
  st.mouvements = st.mouvements.filter(x => garde(x.article)).map(x => Object.assign(x, { evenement: ev(x.evenement) }));
  st.reservations = st.reservations.map(r => Object.assign(r, { nom: ev(r.nom), adresse: (h.adresses || {})[r.adresse] || r.adresse, lignes: r.lignes.filter(l => garde(l[0])) })).filter(r => r.lignes.length);
  st.clientsLoc.forEach(c => { if (h.clients[c.id]) c.nom = h.clients[c.id]; });
  st.clientsEv = Object.fromEntries(Object.entries(st.clientsEv || {}).map(([k, v]) => [ev(k), v]));
  st.fournisseurs = h.fournisseurs; st.emplacements = h.emplacements; st.kits = h.kits;
  st.commandes = st.commandes.map(c => Object.assign(c, { lignes: c.lignes.filter(l => garde(l.id)), fournisseur: (h.fournisseurs.find(f => f.id === c.fid) || {}).nom || c.fournisseur }))
    .filter(c => c.lignes.length).map(c => Object.assign(c, { total: c.lignes.reduce((t, l) => t + l.qte * st.articles.find(a => a.id === l.id).prix, 0) }));
  st.bons = (st.bons || []).filter(b => (b.lignes || []).some(l => garde(l[0])));
  // Des fûts au lavage, comme les housses du loueur au nettoyage
  st.mouvements.push({ id: "MV-L0001", date: Date.now() - 86400000, profil: "terrain", qui: "Ousmane", article: "ART-0001", type: "Réparation", qte: 24, evenement: "", motif: "Au nettoyage", refac: false });
  st.mouvements.sort((a, b) => a.date - b.date);
  const postes = { terrain: d.v.terrain, bureau: d.v.bureau, direction: d.v.direction, chauffeur: "Chauffeur-livreur" };
  st.equipe.forEach(u => { u.poste = postes[u.role] || u.poste; });
  return st;
}

// Huit semaines de vie : sorties quotidiennes, livraisons quand le stock baisse, quelques pertes, quelques prêts.
function seedAutre(st, d) {
  let graine = st.graine || 11;
  const alea = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  const J = 86400000, maintenant = Date.now(), debut = maintenant - 57 * J;
  const minuit = new Date(maintenant).setHours(0, 0, 0, 0); // les gestes tombent aux heures de travail, pas la nuit
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
    const t = minuit - j * J;
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
  // Toujours une commande à préparer : si aucun objet n'est sous son seuil ce jour-là, le plus proche y passe ce matin
  const courts = (d.lotsCourts || []).map(l => l[0]);
  const suivis = st.articles.filter(a => a.logique !== "pret" && a.jour > 0 && !courts.includes(a.id));
  if (suivis.length && !suivis.some(a => q[a.id] <= a.seuil)) {
    const a = suivis.slice().sort((x, y) => (q[x.id] - x.seuil) / x.cible - (q[y.id] - y.seuil) / y.cible)[0];
    let s = q[a.id] - a.seuil; if (a.lot > 1) s = Math.ceil(s / a.lot) * a.lot;
    s = Math.min(s, q[a.id]);
    add(Math.min(minuit + 9 * 3600000, maintenant - 3600000), "terrain", a.id, "Sortie", s, { imputation: d.imputations[0] }); q[a.id] -= s;
  }
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
function lotsTotaux(mvts, id, total) {
  let reste = Math.max(0, total);
  const lots = [];
  mvts.filter(m => m.article === id && m.dlc && ["Entrée", "Inventaire initial"].includes(m.type)).sort((a, b) => b.date - a.date).forEach(m => {
    if (reste <= 0) return;
    const qte = Math.min(reste, m.qte); reste -= qte; lots.push({ dlc: m.dlc, qte });
  });
  return lots.sort((a, b) => a.dlc.localeCompare(b.dlc));
}
const lotsEnStock = id => lotsTotaux(S.mouvements, id, stock(id));

/* Lots par lieu (stock par lieu, lieux.js). Un transfert emporte les lots les plus proches de leur date (m.lots),
   et ce qui sort d'un lieu est pris sur ses lots les plus proches. Le total, lui, garde le calcul ci-dessus. */
const signeLot = t => ["Inventaire initial", "Entrée", "Retour", "Ajustement", "Retour réparation"].includes(t) ? 1 : ["Prêt", "Perte", "Sortie", "Réparation"].includes(t) ? -1 : 0;
function lotsDuLieu(mvts, id, lieu) {
  const lots = {}; let sorti = 0;
  mvts.forEach(m => {
    if (m.article !== id) return;
    if (m.type === "Transfert") {
      const s = m.qte < 0 ? -1 : 1; // une annulation reprend les mêmes lots, en sens inverse
      if (m.vers === lieu) (m.lots || []).forEach(x => { lots[x.dlc] = (lots[x.dlc] || 0) + s * x.qte; });
      if (m.de === lieu) (m.lots || []).forEach(x => { lots[x.dlc] = (lots[x.dlc] || 0) - s * x.qte; });
    } else if (m.lieu === lieu) sorti -= signeLot(m.type) * m.qte;
  });
  let reste = Math.max(0, sorti);
  return Object.keys(lots).sort().map(dlc => { const q = Math.max(0, lots[dlc]), k = Math.min(q, reste); reste -= k; return { dlc, qte: q - k }; }).filter(x => x.qte > 0);
}
// Les n premières pièces d'une liste de lots triée par date
function prendreLots(lots, n) { const r = []; lots.forEach(x => { const k = Math.min(x.qte, n); if (k > 0) { r.push({ dlc: x.dlc, qte: k }); n -= k; } }); return r; }
// Les lots restés au dépôt : ceux de tout le stock, moins ceux que portent les autres lieux
function lotsDepotDe(mvts, lieux, id, totaux) {
  const t = totaux.map(x => ({ dlc: x.dlc, qte: x.qte }));
  lieux.forEach(l => lotsDuLieu(mvts, id, l.id).forEach(p => {
    let r = p.qte;
    t.forEach(x => { if (x.dlc === p.dlc) { const k = Math.min(x.qte, r); x.qte -= k; r -= k; } });
    t.forEach(x => { const k = Math.min(x.qte, r); x.qte -= k; r -= k; });
  }));
  return t.filter(x => x.qte > 0);
}
const lotsAuDepot = id => (S.lieux || []).length ? lotsDepotDe(S.mouvements, S.lieux, id, lotsEnStock(id)) : lotsEnStock(id);
function bientotPerimes(jours) {
  const limite = new Date(Date.now() + jours * 86400000).toISOString().slice(0, 10);
  const l = [];
  // Avec plusieurs lieux de stock, chaque ligne dit où se trouve le lot (lieu : "" pour le dépôt)
  const lieux = (S.lieux || []).length > 0;
  S.articles.forEach(a => {
    if (!lieux) return lotsEnStock(a.id).filter(x => x.dlc <= limite).forEach(x => l.push({ a, dlc: x.dlc, qte: x.qte }));
    lotsAuDepot(a.id).filter(x => x.dlc <= limite).forEach(x => l.push({ a, dlc: x.dlc, qte: x.qte, lieu: "" }));
    S.lieux.forEach(k => lotsDuLieu(S.mouvements, a.id, k.id).filter(x => x.dlc <= limite).forEach(x => l.push({ a, dlc: x.dlc, qte: x.qte, lieu: k.id })));
  });
  return l.sort((x, y) => x.dlc.localeCompare(y.dlc));
}
const dateFr = iso => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/* ---------------- Terrain : réceptionner une livraison ---------------- */
function tReception() {
  const attendues = S.commandes.filter(c => ["Envoyée", "Reçue en partie"].includes(c.statut));
  return `<h1>Réceptionner une livraison</h1><p class="sous">Choisissez la commande.</p>
  <ul class="t-liste dp">${attendues.map(c => `<li><button data-recep="${c.id}">${pic(I.camion)}<span><b>${esc(c.fournisseur)}</b><small>${c.id} · commandé le ${quand(c.date)} · ${c.lignes.length} ligne${c.lignes.length > 1 ? "s" : ""}${c.statut === "Reçue en partie" ? " · reliquat" : ""}</small></span><span class="n">${c.lignes.reduce((t, l) => t + (l.qte - (l.recu || 0)), 0)}</span></button></li>`).join("") || `<li class="vide">Aucune livraison attendue.</li>`}</ul>
  <p style="margin-top:14px"><button class="btn" data-recep="libre">Livraison sans commande</button></p>`;
}
function tReceptionCmd(id) {
  const libre = id === "libre", c = libre ? null : S.commandes.find(x => x.id === id);
  if (!libre && !c) return tReception();
  const lignes = libre ? S.articles.filter(a => logique(a) !== "pret").map(a => ({ id: a.id, qte: 0, recu: 0 })) : c.lignes;
  const dlc = metier().dlc;
  return `<h1>${libre ? "Livraison sans commande" : esc(c.fournisseur)}</h1><p class="sous">${libre ? "Indiquez ce qui arrive." : `Commande ${c.id}. Corrigez seulement ce qui ne correspond pas.`}</p>
  <form data-form="recep" data-cmd-id="${libre ? "" : c.id}">
  ${libre ? `<label class="champ">Fournisseur<select name="fou">${S.fournisseurs.map(f => `<option value="${f.id}">${esc(f.nom)}</option>`).join("")}</select></label>` : ""}
  <ul class="t-liste dp">${lignes.map(l => { const a = art(l.id), attendu = l.qte - (l.recu || 0);
    return `<li><div class="t-retour recep">${img(a)}<span><b>${esc(a.nom)}</b><small>${libre ? "" : `attendu : ${attendu}${parLots(a.id, attendu) ? ", soit " + parLots(a.id, attendu) : ""}`}</small>${dlc && a.dlcJours ? `<label class="dlc">Date limite <input type="date" name="dlc-${a.id}" value="${new Date(Date.now() + a.dlcJours * 86400000).toISOString().slice(0, 10)}"></label>` : ""}</span>
    <input type="number" inputmode="numeric" min="0" name="${a.id}" value="${libre ? 0 : attendu}" aria-label="Reçu : ${esc(a.nom)}"></div></li>`; }).join("")}</ul>
  <label class="btn" style="margin-top:12px">Photographier le bon de livraison<input type="file" accept="image/*" capture="environment" data-photo-bl class="cache"></label>
  <p class="sous" data-bl-etat style="margin-top:6px"></p>
  <div class="valider dp-colle"><button type="button" class="btn" data-aller="reception">Annuler</button><button class="btn plein" style="background:var(--retour);border-color:var(--retour);color:#fff">Valider la réception</button></div></form>`;
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
  if (typeof garderPhotos === "function") garderPhotos();
}

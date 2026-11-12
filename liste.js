"use strict";
/* Mon espace : la liste d'articles d'un client.
   Le client remplit un tableur (modeles/07_Liste_articles_a_remplir.xlsx) ; on l'importe ici d'un coup, par le fichier ou par un collage,
   après une relecture qui dit ce qui cloche. La liste vit dans la fiche du client (donc dans la sauvegarde de Mon espace).
   Elle sert à quatre choses : charger la démo avec ses objets (« Régler son appli »), sortir ses étiquettes, produire
   les onglets à coller dans son classeur, et envoyer au prospect sa démo d'essai (« Envoyer sa démo », puis « Ouvrir son essai »
   pour relire ce qu'il en a fait ; le côté prospect est dans essai.js). Rien n'est lu ni écrit ailleurs que dans le navigateur.
   Chargé après espace.js, avant app.js. */

const LISTE_MAX = 5000; // lignes lues au plus ; les codes vont de ART-0001 à ART-9999
// Titres reconnus, dans l'ordre où on les essaie (le premier qui convient gagne). Les titres sont comparés sans accents ni majuscules.
// Ils couvrent le modèle à remplir, l'onglet ARTICLES du classeur livré, et les mots courants d'un tableau de patron.
const COLONNES_LISTE = [
  ["vie", /ou vit|milieu|environnement/, "Où vit l'objet"],
  ["ctrlLe", /prochain controle|echeance|date d[ue] controle|controle avant/, "Prochain contrôle (date)"],
  ["ctrlMois", /controle tous|tous les|periodicite|rythme/, "Contrôle tous les (mois)"],
  ["ctrlNom", /controle|etalonnage|verification/, "Nom du contrôle"],
  ["lieu", /dans quel lieu|fourgon|vehicule|\bsite\b/, "Dans quel lieu (fourgon, véhicule, site)"],
  ["suivi", /suivi|par lots/, "Suivi par lots et dates limites"],
  ["dlc", /date limite|peremption|\bdlc\b|\bdluo\b|\bddm\b|expir/, "Date limite"],
  ["cond", /conditionnement|colisage|par carton|par paquet/, "Conditionnement"],
  ["serie", /serie/, "Numéro de série"],
  ["lotNum", /\blots?\b/, "Numéro de lot"],
  ["cible", /quantite a avoir|qte cible|cible|\bmaxi/, "Quantité à avoir"],
  ["seuil", /seuil|alerte|\bmini/, "Seuil d'alerte"],
  ["prix", /prix|cout|tarif/, "Prix d'achat unitaire HT"],
  ["qte", /stock|quantite|\bqte\b|\bnombre\b/, "Quantité en stock"],
  ["emp", /range|emplacement|rayon|\bzone\b|\blieu\b|etagere/, "Où il est rangé"],
  ["logique", /prete|consomm|logique/, "On le prête ou on le consomme ?"],
  ["categorie", /categorie|famille/, "Catégorie"],
  ["unite", /^unite/, "Unité"],
  ["fou", /fournisseur/, "Fournisseur"],
  ["code", /code|reference|\bref\b|^id\b/, "Votre code"],
  ["nom", /^nom|designation|article|produit|libelle|objet|materiel/, "Nom de l'article"],
];
// Ordre des colonnes du modèle : sert quand on colle des cellules sans leur ligne de titres
const ORDRE_MODELE = ["nom", "qte", "emp", "logique", "categorie", "unite", "prix", "fou", "seuil", "cible", "cond", "serie", "suivi", "lotNum", "dlc", "code", "lieu", "ctrlNom", "ctrlLe", "ctrlMois", "vie"];
// Stock par lieu (lieux.js) : le mot affiché dans l'appli du client, son singulier (étiquettes) et le nom du geste
const MOTS_LIEUX = { "Fourgons": ["Fourgon", "Charger un fourgon"], "Véhicules": ["Véhicule", "Charger un véhicule"], "Sites": ["Site", "Approvisionner un site"], "Lieux de stock": ["Lieu de stock", "Déplacer vers un autre lieu"] };
const EMP_DEFAUT = "À ranger", FOU_DEFAUT = "Fournisseur à préciser";

const normP = t => String(t === null || t === undefined ? "" : t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const texteP = v => v === null || v === undefined ? "" : String(v).replace(/\s+/g, " ").trim();
const pluriel = (n, mot, mots) => `${n.toLocaleString("fr-FR")} ${n > 1 ? (mots || mot + "s") : mot}`;
const dateCourteFr = iso => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR");

/* ---------------- Lire un fichier .xlsx, sans bibliothèque ---------------- */
// Un .xlsx est une archive ZIP de fichiers XML. On lit la table des fichiers, on décompresse ceux qu'il faut
// avec DecompressionStream (Chrome et Edge 103, Safari 16.4, Firefox 113), on lit le XML avec DOMParser.
async function lireZipP(buffer) {
  const dv = new DataView(buffer), u8 = new Uint8Array(buffer), dec = new TextDecoder();
  let fin = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  if (fin < 0) throw new Error("zip");
  const n = dv.getUint16(fin + 10, true), fichiers = {};
  let p = dv.getUint32(fin + 16, true);
  for (let k = 0; k < n && dv.getUint32(p, true) === 0x02014b50; k++) {
    const methode = dv.getUint16(p + 10, true), taille = dv.getUint32(p + 20, true), ln = dv.getUint16(p + 28, true), le = dv.getUint16(p + 30, true), lc = dv.getUint16(p + 32, true), local = dv.getUint32(p + 42, true);
    fichiers[dec.decode(u8.subarray(p + 46, p + 46 + ln))] = { methode, taille, local };
    p += 46 + ln + le + lc;
  }
  return async nom => {
    const f = fichiers[nom]; if (!f) return null;
    const debut = f.local + 30 + dv.getUint16(f.local + 26, true) + dv.getUint16(f.local + 28, true), brut = u8.subarray(debut, debut + f.taille);
    if (f.methode === 0) return dec.decode(brut);
    if (f.methode !== 8 || typeof DecompressionStream === "undefined") throw new Error("deflate");
    return new Response(new Blob([brut]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
  };
}
// Rend les onglets du classeur : [{ nom, lignes: [[cellule, …]] }]. Une cellule est un texte, un nombre, ou "" si elle est vide.
async function lireXlsxP(buffer) {
  const lire = await lireZipP(buffer), xml = t => new DOMParser().parseFromString(t, "application/xml");
  const wb = await lire("xl/workbook.xml"); if (!wb) throw new Error("classeur");
  const rels = xml(await lire("xl/_rels/workbook.xml.rels") || "<r/>"), cibles = {};
  [...rels.getElementsByTagName("Relationship")].forEach(r => { cibles[r.getAttribute("Id")] = r.getAttribute("Target").replace(/^\/?(xl\/)?/, ""); });
  const partagees = [], ss = await lire("xl/sharedStrings.xml");
  if (ss) [...xml(ss).getElementsByTagName("si")].forEach(si => partagees.push([...si.getElementsByTagName("t")].filter(t => t.parentNode.localName !== "rPh").map(t => t.textContent).join("")));
  const feuilles = [];
  for (const s of [...xml(wb).getElementsByTagName("sheet")]) {
    const rid = s.getAttribute("r:id") || s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const t = await lire("xl/" + (cibles[rid] || "")); if (!t) continue;
    const lignes = [];
    [...xml(t).getElementsByTagName("row")].forEach((row, k) => {
      const r = +row.getAttribute("r") || k + 1, l = []; let suivante = 0;
      [...row.getElementsByTagName("c")].forEach(c => {
        const ref = (c.getAttribute("r") || "").replace(/\d+/g, ""), col = ref ? [...ref].reduce((x, ch) => x * 26 + ch.charCodeAt(0) - 64, 0) - 1 : suivante;
        suivante = col + 1;
        const type = c.getAttribute("t"), v = c.getElementsByTagName("v")[0], brut = v ? v.textContent : "";
        let val = "";
        if (type === "s") val = partagees[+brut] || "";
        else if (type === "inlineStr") val = [...c.getElementsByTagName("t")].map(x => x.textContent).join("");
        else if (type === "str" || type === "e") val = type === "e" ? "" : brut;
        else if (type === "b") val = brut === "1" ? "Oui" : "Non";
        else if (brut !== "") val = isFinite(+brut) ? +brut : brut;
        if (val !== "") l[col] = val;
      });
      if (l.length) lignes[r - 1] = l;
    });
    feuilles.push({ nom: s.getAttribute("name") || "", lignes });
  }
  return feuilles;
}
// Cellules collées depuis Excel ou Google Sheets : des tabulations entre les colonnes, des guillemets autour d'une cellule à plusieurs lignes.
// Un fichier .csv à points-virgules passe par le même chemin.
function lireCollageP(t) {
  t = String(t).replace(/\r\n?/g, "\n");
  const sep = t.includes("\t") ? "\t" : t.includes(";") ? ";" : "\t", lignes = [];
  let l = [], cel = "", guillemets = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (guillemets) { if (ch === '"' && t[i + 1] === '"') { cel += '"'; i++; } else if (ch === '"') guillemets = false; else cel += ch; }
    else if (ch === '"' && cel === "") guillemets = true;
    else if (ch === sep) { l.push(cel); cel = ""; }
    else if (ch === "\n") { l.push(cel); lignes.push(l); l = []; cel = ""; }
    else cel += ch;
  }
  if (cel !== "" || l.length) { l.push(cel); lignes.push(l); }
  return lignes;
}

/* ---------------- Reconnaître les colonnes ---------------- */
function reconnaitreTitresP(ligne) {
  const pris = {}, inconnues = [];
  (ligne || []).forEach((t, i) => {
    const n = normP(t); if (!n) return;
    const c = COLONNES_LISTE.find(([k, re]) => pris[k] === undefined && re.test(n));
    if (c) pris[c[0]] = i; else inconnues.push(texteP(t));
  });
  return { pris, inconnues };
}
// Cherche la ligne de titres dans les 15 premières lignes : celle qui a une colonne « nom » et le plus de titres reconnus.
// Sans ligne de titres, on lit les colonnes dans l'ordre du modèle.
function preparerLignesP(lignes) {
  let meilleur = null;
  for (let i = 0; i < Math.min(15, lignes.length); i++) {
    if (!lignes[i]) continue;
    const r = reconnaitreTitresP(lignes[i]), n = Object.keys(r.pris).length;
    if (r.pris.nom !== undefined && n >= 2 && (!meilleur || n > meilleur.n)) meilleur = { i, n, r };
  }
  const pris = meilleur ? meilleur.r.pris : Object.fromEntries(ORDRE_MODELE.map((k, i) => [k, i]));
  const brutes = [];
  for (let i = meilleur ? meilleur.i + 1 : 0; i < lignes.length; i++) {
    const l = lignes[i]; if (!l || !l.some(x => texteP(x) !== "")) continue;
    brutes.push({ n: i + 1, v: Object.fromEntries(Object.entries(pris).map(([k, col]) => [k, l[col] === undefined ? "" : l[col]])) });
  }
  return { brutes, sansTitres: !meilleur, colonnes: Object.keys(pris).filter(() => !!meilleur).map(k => COLONNES_LISTE.find(c => c[0] === k)[2]), inconnues: meilleur ? meilleur.r.inconnues : [] };
}
// Dans un classeur : l'onglet « Vos articles » s'il existe, sinon le premier onglet qui a une ligne de titres (hors mode d'emploi et exemples)
function choisirFeuilleP(feuilles) {
  const utiles = feuilles.filter(f => !/mode d emploi|exemple|lisez moi|dictionnaire|parametre|vos lieux/.test(normP(f.nom)));
  return utiles.find(f => normP(f.nom) === "vos articles") || utiles.find(f => !preparerLignesP(f.lignes).sansTitres) || utiles[0] || feuilles[0];
}

/* ---------------- Lire une cellule ---------------- */
// « 1 200 », « 12,5 », « 15 € », « 25 000 FCFA » : un nombre. Autre chose : NaN.
function nombreP(v) {
  if (typeof v === "number") return v;
  let t = String(v).trim().replace(/[\s  ]/g, "").replace(/(€|eur|euros?|fcfa|cfa|xof)$/i, "");
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, "");
  t = t.replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(t) ? +t : NaN;
}
// Date d'un tableur (numéro de série), 31/12/2027, 31-12-27, 2027-12-31 : rend 2027-12-31, ou null.
function dateP(v) {
  const iso = (a, m, j) => { const d = new Date(Date.UTC(a, m - 1, j)); return a >= 2000 && a <= 2100 && d.getUTCFullYear() === a && d.getUTCMonth() === m - 1 && d.getUTCDate() === j ? d.toISOString().slice(0, 10) : null; };
  const t = String(v).trim();
  if (/^\d{5}(\.\d+)?$/.test(t)) { const d = new Date(Math.round((Math.floor(+t) - 25569) * 86400000)); return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); }
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return iso(+m[1], +m[2], +m[3]);
  m = t.match(/^(\d{1,2})[\/.\- ](\d{1,2})[\/.\- ](\d{2}|\d{4})$/); if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  return null;
}
const ouiNonP = v => { const n = normP(v); return /^(o|oui|yes|y|x|1|vrai|true)$/.test(n) ? true : /^(n|non|no|0|faux|false)?$/.test(n) ? false : null; };
const logiqueP = v => { const n = normP(v); return !n ? "" : /consomm|\bconso\b|vend|ne revient pas/.test(n) ? "conso" : /pret|revient|loue|location|equipement/.test(n) ? "pret" : null; };

/* ---------------- Contrôler : ce qui est bon, ce qui cloche ---------------- */
// brutes : [{ n: numéro de ligne, v: { nom, qte, … } }]. existants : les articles déjà dans la liste, quand on ajoute.
// Rend la liste finale (articles), le nombre de lignes bonnes, les lignes refusées (erreurs) et les lignes importées avec une valeur de départ (remarques).
function controlerListeP(brutes, c, existants) {
  const articles = (existants || []).map(a => JSON.parse(JSON.stringify(a))), erreurs = [], remarques = [];
  const noms = {}, series = {}, codes = {}, defautLogique = (METIERS[c.metier] || METIERS.loueur).logique || "conso";
  articles.forEach(a => { a.lieux = a.lieux || []; if (a.serie) series[normP(a.serie)] = "liste"; else noms[normP(a.nom)] = { a, n: "liste" }; if (a.code) codes[normP(a.code)] = "liste"; });
  let bonnes = 0, exemples = 0, dejaLa = 0;
  const auj = new Date(); auj.setMinutes(auj.getMinutes() - auj.getTimezoneOffset()); const aujIso = auj.toISOString().slice(0, 10);
  brutes.slice(0, LISTE_MAX).forEach(({ n, v }) => {
    const nomBrut = texteP(v.nom);
    if (/^\((obligatoire|facultatif)\)/i.test(nomBrut)) return;            // la ligne d'aide du modèle
    if (/\(exemple\)$/i.test(nomBrut)) { exemples++; return; }               // une ligne recopiée de l'onglet Exemples
    const nom = nomBrut.slice(0, 80), err = t => erreurs.push({ n, nom: nom || "(sans nom)", t }), rem = t => remarques.push({ n, nom, t });
    if (!nom) return err("Nom vide.");
    const serie = texteP(v.serie).slice(0, 40), brutQte = texteP(v.qte);
    let qte = brutQte === "" ? (serie ? 1 : 0) : nombreP(v.qte);
    if (isNaN(qte)) return err(`Quantité illisible : « ${brutQte.slice(0, 30)} ». Un nombre seul est attendu.`);
    if (qte < 0) return err("Quantité négative.");
    if (!Number.isInteger(qte)) return err(`Quantité à virgule (${String(qte).replace(".", ",")}) : l'appli compte en unités entières. Changer d'unité (grammes, boîtes) ou arrondir.`);
    let logique = logiqueP(v.logique);
    if (logique === null) { rem(`« ${texteP(v.logique).slice(0, 30)} » n'est ni prêté ni consommé : valeur du métier retenue.`); logique = ""; }
    if (serie) {
      if (qte !== 1) return err(`Numéro de série avec une quantité de ${qte} : un numéro de série désigne un seul objet. Une ligne par objet, quantité 1.`);
      if (series[normP(serie)]) return err(`Numéro de série « ${serie} » déjà utilisé ${series[normP(serie)] === "liste" ? "dans la liste" : "ligne " + series[normP(serie)]}.`);
      if (logique === "conso") rem("Numéro de série sur un article noté consommé : compté comme un objet prêté.");
      logique = "pret";
    }
    logique = logique || defautLogique;
    // Lots et dates limites
    const brutDlc = texteP(v.dlc), lotNum = texteP(v.lotNum).slice(0, 30), suiviBrut = ouiNonP(v.suivi);
    let dlc = null;
    if (suiviBrut === null) rem(`Suivi par lots : « ${texteP(v.suivi).slice(0, 20)} » n'est ni Oui ni Non. Compté Non.`);
    if (brutDlc) { dlc = dateP(v.dlc); if (!dlc) return err(`Date limite illisible : « ${brutDlc.slice(0, 30)} ». Forme attendue : 31/12/2027.`); }
    if (suiviBrut && !dlc) return err("Suivi par lots demandé, mais sans date limite.");
    if (dlc && logique === "pret") return err("Date limite sur un objet prêté : les dates limites vont aux articles consommés.");
    if (lotNum && !dlc) rem("Numéro de lot sans date limite : non repris.");
    if (dlc && dlc < aujIso) rem(`Date limite déjà dépassée (${dateCourteFr(dlc)}).`);
    const bonNombre = (cle, titre, entier) => { const b = texteP(v[cle]); if (b === "") return null; const x = nombreP(v[cle]); if (isNaN(x) || x < 0) { rem(`${titre} illisible (« ${b.slice(0, 20)} ») : valeur de départ retenue.`); return null; } return entier ? Math.round(x) : x; };
    const prix = bonNombre("prix", "Prix"), seuilLu = bonNombre("seuil", "Seuil d'alerte", true), cibleLue = bonNombre("cible", "Quantité à avoir", true);
    let cond = bonNombre("cond", "Conditionnement", true); if (cond !== null && cond < 1) cond = null;
    // Contrôle périodique : la date suffit ; le nom et le rythme sont facultatifs
    const brutCtrl = texteP(v.ctrlLe), brutMois = texteP(v.ctrlMois), ctrlNom = texteP(v.ctrlNom).slice(0, 40); let ctrlLe = "", ctrlMois = 0;
    if (brutCtrl) { ctrlLe = dateP(v.ctrlLe) || ""; if (!ctrlLe) rem(`Date du prochain contrôle illisible (« ${brutCtrl.slice(0, 30)} ») : contrôle non repris. Forme attendue : 31/12/2027.`); else if (ctrlLe < aujIso) rem(`Contrôle déjà en retard (${dateCourteFr(ctrlLe)}).`); }
    if (brutMois) { const m = nombreP(v.ctrlMois); if (isNaN(m) || m < 1 || m > 120 || !Number.isInteger(m)) rem(`Rythme de contrôle illisible (« ${brutMois.slice(0, 20)} ») : un nombre de mois est attendu. Aucun rythme retenu.`); else ctrlMois = m; }
    if (!brutCtrl && (ctrlMois || ctrlNom)) rem("Contrôle sans date de prochain contrôle : non repris.");
    // Stock par lieu : la quantité de la ligne est celle qui se trouve dans ce lieu ; sans lieu, elle est au dépôt
    let lieu = texteP(v.lieu).slice(0, 40);
    if (/^(au )?(depot|magasin|entrepot)$/.test(normP(lieu))) lieu = "";
    if (lieu && serie) { rem("Lieu sur un objet à numéro de série : non repris (un objet unique se suit par le prêt)."); lieu = ""; }
    if (lieu && dlc) { rem("Lieu et date limite sur la même ligne : la quantité est comptée, le lieu n'est pas repris."); lieu = ""; }
    // Doublons : deux objets uniques peuvent porter le même nom, deux lots du même produit s'ajoutent, le reste est un doublon
    const cle = normP(nom), deja = !serie && noms[cle];
    if (deja) {
      const memeLot = dlc && deja.a.suiviLots && deja.a.lots.some(l => l.dlc === dlc && l.num === lotNum);
      if (memeLot && deja.n !== "liste") return err(`Doublon de la ligne ${deja.n} : même nom, même lot, même date limite.`);
      if (dlc && deja.a.suiviLots && !memeLot) { deja.a.lots.push({ num: lotNum, dlc, qte }); deja.a.qte += qte; bonnes++; return; }
      if (deja.n === "liste") { dejaLa++; return; }
      // Le même article dans un autre lieu : une ligne par lieu, les quantités s'ajoutent
      if (lieu && !deja.a.suiviLots) {
        if (deja.a.lieux.some(l => normP(l.nom) === normP(lieu))) return err(`Doublon de la ligne ${deja.n} : même nom, même lieu.`);
        deja.a.lieux.push({ nom: lieu, qte }); deja.a.qte += qte; bonnes++; return;
      }
      if (!lieu && !dlc && deja.a.lieux.length && !deja.depot) { deja.depot = true; deja.a.qte += qte; bonnes++; return; }
      return err(`Doublon de la ligne ${deja.n} : même nom. Garder une seule ligne${dlc || deja.a.suiviLots ? ", ou donner une date limite aux deux pour en faire deux lots" : ""}.`);
    }
    const code = texteP(v.code).slice(0, 30);
    if (code && codes[normP(code)]) rem(`Votre code « ${code} » est déjà porté par ${codes[normP(code)] === "liste" ? "un article de la liste" : "la ligne " + codes[normP(code)]}.`);
    if (brutQte === "" && !serie) rem("Quantité vide : comptée 0.");
    const cible = cibleLue !== null && cibleLue >= 1 ? cibleLue : Math.max(1, qte);
    let seuil = seuilLu !== null ? seuilLu : serie || logique === "pret" ? 0 : Math.min(cible, Math.ceil(qte * .2));
    if (seuil > cible) { rem(`Seuil d'alerte (${seuil}) au-dessus de la quantité à avoir (${cible}) : seuil ramené à ${cible}.`); seuil = cible; }
    const a = { nom, qte, emp: texteP(v.emp).slice(0, 50) || EMP_DEFAUT, logique, categorie: texteP(v.categorie).slice(0, 40), unite: texteP(v.unite).slice(0, 20), prix: prix === null ? 0 : prix, fou: texteP(v.fou).slice(0, 60) || FOU_DEFAUT,
      seuil, cible, lot: cond || 1, serie, suiviLots: !!dlc, lots: dlc ? [{ num: lotNum, dlc, qte }] : [], code,
      lieux: lieu ? [{ nom: lieu, qte }] : [], ctrlLe, ctrlMois: ctrlLe ? ctrlMois : 0, ctrlNom: ctrlLe ? ctrlNom : "" };
    // « Où vit l'objet » : facultatif, oriente le format et le support de son étiquette
    const vie = vieP(v.vie); if (vie) a.vie = vie; else if (texteP(v.vie)) rem(`« Où vit l'objet » : « ${texteP(v.vie).slice(0, 30)} » n'est pas dans la liste. Étiquette proposée sans cette indication.`);
    articles.push(a); bonnes++;
    if (serie) series[normP(serie)] = n; else noms[cle] = { a, n, depot: !lieu };
    if (code) codes[normP(code)] = n;
  });
  return { articles: articles.slice(0, 9999), bonnes, erreurs, remarques, exemples, dejaLa, tropLong: Math.max(0, brutes.length - LISTE_MAX) };
}

/* ---------------- De la liste aux données de l'appli ---------------- */
// Codes donnés dans l'ordre de la liste : ART-0001…, EMP-01…, FOU-01… Les mêmes pour la démo, les étiquettes et le classeur.
// Les prix de la liste sont dans la monnaie du client ; l'appli compte en euros et affiche dans la monnaie réglée.
function construireListeP(c) {
  const L = (c.liste && c.liste.articles) || [], emplacements = [], fournisseurs = [], sn = c.pays === "SN", le = (c.liste && c.liste.le) || Date.now();
  const idDe = (tab, nom, prefixe, extra) => { let x = tab.find(e => normP(e.nom) === normP(nom)); if (!x) { x = Object.assign({ id: prefixe + String(tab.length + 1).padStart(2, "0"), nom }, extra); tab.push(x); } return x.id; };
  const mouvements = []; let nMv = 0;
  // Stock par lieu et contrôles : seulement si le client les a (fiche, bloc « Ses lieux et ses contrôles »)
  const cl = c.lieux && c.lieux.actif && c.lieux.liste.length ? c.lieux : null, ctrl = controlesP(c);
  const lieux = cl ? cl.liste.map((l, i) => ({ id: "LIEU-" + String(i + 1).padStart(2, "0"), nom: l.nom, dot: {} })) : [];
  const entree = (article, qte, extra) => { if (qte > 0) mouvements.push(Object.assign({ id: "MV-" + String(++nMv).padStart(5, "0"), date: le, profil: "bureau", qui: "Installation", article, type: "Inventaire initial", qte, evenement: "", motif: "Stock de départ", refac: false }, extra)); };
  const articles = L.map((x, i) => {
    const id = "ART-" + String(i + 1).padStart(4, "0"), premiere = x.lots.map(l => l.dlc).sort()[0];
    // L'appli sort d'abord ce qui est entré le plus tôt : le lot à la date limite la plus proche est écrit comme le plus ancien
    if (x.suiviLots) x.lots.slice().sort((p, q) => p.dlc.localeCompare(q.dlc)).forEach((l, k) => entree(id, l.qte, { date: le + k, dlc: l.dlc, lotNum: l.num, motif: "Stock de départ" + (l.num ? " · lot " + l.num : "") })); else entree(id, x.qte);
    // Ce qui est dans un fourgon ou sur un site : le stock de départ entre au dépôt, puis un transfert le place dans son lieu
    if (cl && !x.serie) {
      (x.lieux || []).forEach(v => { const l = lieux.find(y => normP(y.nom) === normP(v.nom)); if (l && v.qte > 0) mouvements.push({ id: "MV-" + String(++nMv).padStart(5, "0"), date: le + 1000, profil: "bureau", qui: "Installation", article: id, type: "Transfert", qte: v.qte, evenement: "", motif: `Dépôt → ${l.nom}`, de: "", vers: l.id, refac: false }); });
      cl.liste.forEach((l, k) => { const d = Math.round(+(l.dot || {})[normP(x.nom)] || 0); if (d > 0) lieux[k].dot[id] = d; });
    }
    return Object.assign({ id, nom: x.nom + (x.code ? " · réf. " + x.code : ""), img: "", logique: x.logique, type: x.serie ? "equip" : "conso", unite: x.unite, emp: idDe(emplacements, x.emp, "EMP-"), seuil: x.seuil, cible: x.cible,
      prix: sn ? x.prix / EUR_XOF : x.prix, lot: x.lot, fou: idDe(fournisseurs, x.fou, "FOU-", { delai: 7 }), jour: 0, categorie: x.categorie },
      x.serie ? { serie: x.serie } : {},
      ctrl && x.ctrlLe ? Object.assign({ ctrlLe: x.ctrlLe }, x.ctrlMois ? { ctrlMois: x.ctrlMois } : {}, x.ctrlNom ? { ctrlNom: x.ctrlNom } : {}) : {},
      // Date proposée à la prochaine réception : la durée qui restait au lot de départ, à corriger à chaque livraison
      x.suiviLots ? { dlcJours: Math.max(1, Math.round((new Date(premiere + "T12:00:00").getTime() - le) / 86400000)) } : {});
  });
  return { articles, emplacements, fournisseurs, mouvements, lieux, mot: cl ? (MOTS_LIEUX[cl.mot] ? cl.mot : "Lieux de stock") : "", controles: ctrl };
}
// Les contrôles périodiques sont suivis si la fiche le dit, ou, sans réglage, dès qu'un article porte une date de contrôle
const controlesP = c => c.controles === true || (c.controles !== false && !!c.liste && c.liste.articles.some(a => a.ctrlLe));
// Les lieux nommés dans la liste (et dans l'onglet « Vos lieux ») s'ajoutent à ceux de la fiche. Rend le nombre de lieux ajoutés.
function synchroLieuxP(c, declares) {
  const noms = [], voir = n => { if (n && !noms.some(x => normP(x) === normP(n))) noms.push(n); };
  (declares || []).forEach(d => voir(d.nom)); c.liste.articles.forEach(a => (a.lieux || []).forEach(l => voir(l.nom)));
  if (!noms.length) return 0;
  const t = normP((declares || []).map(d => d.type).join(" ") + " " + noms.join(" "));
  const mot = /fourgon|camion|utilitaire/.test(t) ? "Fourgons" : /vehicule|ambulance|voiture/.test(t) ? "Véhicules" : /site|chantier|antenne|agence/.test(t) ? "Sites" : "Lieux de stock";
  const L = c.lieux = c.lieux || { actif: true, mot, liste: [] }; let n = 0;
  noms.forEach(x => { if (!L.liste.some(l => normP(l.nom) === normP(x))) { L.liste.push({ nom: x, dot: {} }); n += 1; } });
  if (n) L.actif = true;
  return n;
}
// La démo avec les objets du client, à la place des objets de démonstration du métier. Pas d'historique inventé :
// seul le stock de départ est écrit, à la date de l'import. etatListeP construit cet état (il sert aussi à la démo d'essai
// du prospect, essai.js) ; chargerListeP le met dans la démo de l'installateur et rend vrai si elle a été rechargée.
function etatListeP(c) {
  const b = construireListeP(c), neuf = construireDemo(c.metier);
  Object.assign(neuf, { articles: b.articles, emplacements: b.emplacements, fournisseurs: b.fournisseurs, mouvements: b.mouvements, kits: [], reservations: [], commandes: [], bons: [], alertes: [], messages: [], clientsLoc: [], clientsEv: {}, infosEv: {}, interventions: [] });
  neuf.suiviLots = b.articles.some(a => a.dlcJours); // au moins un article à date limite : le suivi par lots s'allume pour ce client
  // Les lieux et les contrôles sont ceux du client, jamais ceux de la démo du métier
  neuf.lieux = b.lieux; delete neuf.lieuDe; delete neuf.motLieux; delete neuf.gesteLieu;
  if (b.lieux.length) { neuf.motLieux = b.mot; neuf.gesteLieu = MOTS_LIEUX[b.mot][1]; }
  neuf.suiviControles = b.controles;
  return neuf;
}
function chargerListeP(c) {
  const garder = { monnaie: S.monnaie, reglages: S.reglages };
  if (!c.liste || !c.liste.articles.length) {
    if (!S.listeDe) return false;
    S = Object.assign(construireDemo(c.metier), garder); return true; // la démo portait la liste d'un autre client
  }
  const marque = [c.id, c.liste.le, c.liste.articles.length, empreinteEssai(JSON.stringify([c.lieux || 0, controlesP(c)]))].join("|");
  if (S.listeDe === marque) return false;
  const neuf = Object.assign(etatListeP(c), garder);
  neuf.listeDe = marque;
  S = neuf; return true;
}
function resumeListeP(c) {
  const L = c.liste.articles, b = construireListeP(c);
  return { n: L.length, emp: b.emplacements.length, fou: b.fournisseurs.filter(f => f.nom !== FOU_DEFAUT).length, prets: L.filter(a => a.logique === "pret").length, series: L.filter(a => a.serie).length, consos: L.filter(a => a.logique !== "pret").length, lots: L.filter(a => a.suiviLots).length, cond: L.filter(a => a.lot > 1).length, lieux: b.lieux.length, ctrl: b.controles ? L.filter(a => a.ctrlLe).length : 0 };
}

/* ---------------- Étiquettes : la planche du client ---------------- */
// Le plan de docs/21 : sur l'objet quand il est prêté, sur le contenant quand il sort par paquet, sur le bac ou l'étagère pour ce qui se consomme.
function planListeP(a, c) {
  const m = METIERS[c.metier] && METIERS[c.metier].base ? "loueur" : c.metier;
  if (a.serie) return { sur: "objet", n: 1 };
  if (a.logique === "pret") return a.lot > 1 ? { sur: "contenant", n: Math.max(1, Math.ceil(a.qte / a.lot)) } : { sur: "objet", n: Math.max(1, a.qte) };
  if (m === "ong" && a.lot > 1) return { sur: "contenant", n: Math.max(1, Math.ceil(a.qte / a.lot)) };
  return { sur: "emplacement", n: 1 };
}
const ETIQ_MAX = 60; // exemplaires au plus pour un même article
// Les six formats de docs/21, section 13. Planches A4 prédécoupées : étiquette (l × h), QR sans sa marge, colonnes × rangées,
// marges et pas en mm (calculés : à vérifier sur le gabarit du fabricant). Rubans laminés : largeur du ruban (h), longueur (l), points par module.
// niveau : correction du QR (Q pour les petits formats). nom : nombre de caractères gardés du nom.
const FORMATS_ETIQ = {
  etagere:    { t: "Étagère", l: 63.5, h: 33.9, qr: 22, niveau: "M", cols: 3, rangs: 8, haut: 12.9, gauche: 7.2, pasX: 66.0, pasY: 33.9, gabarit: "L4773", cout: .12 },
  bac:        { t: "Bac", l: 45.7, h: 25.4, qr: 16, niveau: "M", cols: 4, rangs: 10, haut: 21.5, gauche: 9.8, pasX: 48.2, pasY: 25.4, gabarit: "L6140", cout: .06 },
  petit:      { t: "Petit objet", l: 45.7, h: 21.2, qr: 13, niveau: "Q", cols: 4, rangs: 12, haut: 21.3, gauche: 9.8, pasX: 48.2, pasY: 21.2, gabarit: "L4778", nom: 18, cout: .06 },
  outil:      { t: "Outil", ruban: 24, l: 38, h: 24, qr: 14.8, niveau: "Q", points: 5, nom: 12, cout: .08 },
  petitOutil: { t: "Petit outil", ruban: 18, l: 28, h: 18, qr: 11.9, niveau: "Q", points: 4, nom: 0, cout: .05 },
  drapeau:    { t: "Drapeau de câble", ruban: 24, l: 85, h: 24, qr: 14.8, niveau: "Q", points: 5, nom: 16, cout: .20 }, // 2 faces de 30 mm + le tour d'un câble de 8 mm
};
// Supports. « special » : à reporter à part sur le devis. « sansEtiquette » : fait par un graveur ou un atelier, rien à imprimer ici.
// Coûts d'achat indicatifs de docs/21 (sections 11 et 12), jamais des prix de vente.
const SUPPORTS_ETIQ = {
  planche:    { t: "Polyester en planche" },
  ruban:      { t: "Ruban laminé" },
  plaquette:  { t: "Plaquette à collier", special: true, cout: .32 },
  inviolable: { t: "Inviolable", special: true, cout: .12 },
  gravee:     { t: "Plaque gravée", special: true, sansEtiquette: true, coutTexte: "1 à 6 € pièce" },
  textile:    { t: "Étiquette textile", special: true, sansEtiquette: true, coutTexte: "sur devis" },
};
// « Où vit l'objet » : l'indication facultative qui oriente la proposition. Le motif reconnaît ce que le client a écrit.
const VIES_ETIQ = {
  sec: ["Intérieur sec", /sec|interieur/], gras: ["Atelier gras", /gras|atelier|huile/], dehors: ["Extérieur", /exterieur|dehors/], lavage: ["Lavage", /lav|\bjet\b/], froid: ["Froid", /froid|congel/],
  colle: ["Ne se colle pas", /colle pas|tuyau|\bsacs?\b|elingue/], cable: ["Câble ou manche", /cable|manche|rallonge|flexible/], cher: ["Objet cher", /\bcher|\bvol\b/],
};
const vieP = v => { const n = normP(v); return !n ? "" : (Object.entries(VIES_ETIQ).find(([, [, re]]) => re.test(n)) || [null])[0]; };
const supportDuFormat = fmt => FORMATS_ETIQ[fmt].ruban ? "ruban" : "planche";
// La proposition : d'abord où va l'étiquette (objet, contenant, bac ou étagère), puis ce que dit « Où vit l'objet »
function propositionEtiqP(x, sur) {
  if (x.vie === "cable") return { fmt: "drapeau", sup: "ruban" };
  if (x.vie === "colle") return { fmt: "petitOutil", sup: "plaquette" };
  if (x.vie === "cher") return { fmt: "petit", sup: "inviolable" };
  if (["gras", "dehors", "lavage"].includes(x.vie) && sur !== "emplacement") return { fmt: "outil", sup: "ruban" };
  return sur === "objet" ? { fmt: "outil", sup: "ruban" } : sur === "contenant" ? { fmt: "bac", sup: "planche" } : { fmt: "etagere", sup: "planche" };
}
// Le choix retenu : celui de l'installateur s'il en a fait un, sinon la proposition. Le support suit le format (une planche ne passe pas dans une étiqueteuse).
function choixEtiqP(x, sur) {
  const p = propositionEtiqP(x, sur), fmt = FORMATS_ETIQ[x.fmt] ? x.fmt : p.fmt;
  let sup = SUPPORTS_ETIQ[x.sup] ? x.sup : fmt === p.fmt ? p.sup : supportDuFormat(fmt);
  if (sup === "planche" || sup === "ruban") sup = supportDuFormat(fmt);
  if (sup === "inviolable" && FORMATS_ETIQ[fmt].ruban) sup = "ruban"; // l'inviolable n'existe qu'en planche
  return { fmt, sup, propose: p };
}
// Une ligne par article et par emplacement ou lieu : { id, nom, sous, n (exemplaires), fmt, sup, i (rang de l'article, -1 sinon) }
function etiquettesListeP(c) {
  const b = construireListeP(c), L = c.liste.articles, l = [];
  const emps = b.emplacements.slice().sort((x, y) => x.nom.localeCompare(y.nom, "fr", { numeric: true }));
  b.lieux.forEach(x => l.push({ type: "emp", id: x.id, nom: x.nom, sous: MOTS_LIEUX[b.mot][0], n: 1, fmt: "etagere", sup: "planche", i: -1 })); // une étiquette par fourgon, véhicule ou site
  emps.forEach(e => {
    l.push({ type: "emp", id: e.id, nom: e.nom, sous: "Emplacement", n: 1, fmt: "etagere", sup: "planche", i: -1 });
    b.articles.forEach((a, i) => {
      if (a.emp !== e.id) return;
      const p = planListeP(L[i], c), n = Math.min(ETIQ_MAX, p.n), ch = choixEtiqP(L[i], p.sur);
      l.push({ type: p.sur, id: a.id, nom: a.nom, sous: a.serie ? "N° de série " + a.serie : p.sur === "contenant" ? `Par ${L[i].lot}` : p.sur === "emplacement" ? "Sur le bac ou l'étagère" : "", n, coupe: p.n > ETIQ_MAX ? p.n : 0, fmt: ch.fmt, sup: ch.sup, i, emp: e.nom });
    });
  });
  return l;
}
const mm = n => String(Math.round(n * 100) / 100).replace(".", ",");
const coupeP = (t, n) => t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
// Le récapitulatif : par format et par support, les planches, le ruban, les supports spéciaux. departs : case de départ par format de planche.
function recapEtiqP(l, departs) {
  const lignes = new Map(), formats = {};
  l.forEach(x => {
    const s = SUPPORTS_ETIQ[x.sup], k = (s.sansEtiquette ? "-" : x.fmt) + "|" + x.sup, r = lignes.get(k) || { fmt: s.sansEtiquette ? "" : x.fmt, sup: x.sup, n: 0 };
    r.n += x.n; lignes.set(k, r);
    if (!s.sansEtiquette) formats[x.fmt] = (formats[x.fmt] || 0) + x.n;
  });
  const tot = {}; Object.entries(formats).forEach(([k, n]) => { const f = FORMATS_ETIQ[k]; tot[k] = f.ruban ? { n, cm: Math.round(n * f.l / 10) } : { n, planches: Math.ceil((n + (departs[k] || 1) - 1) / (f.cols * f.rangs)) }; });
  return { lignes: [...lignes.values()], formats: tot, speciaux: Object.keys(SUPPORTS_ETIQ).filter(k => SUPPORTS_ETIQ[k].special).map(k => [k, l.filter(x => x.sup === k).reduce((t, x) => t + x.n, 0)]).filter(x => x[1]) };
}
function texteRecapEtiqP(c, l, R) {
  const std = l.filter(x => !SUPPORTS_ETIQ[x.sup].special).reduce((t, x) => t + x.n, 0);
  return `Étiquettes · ${c.nom}\nÉtiquettes standard (polyester en planche ou ruban laminé) : ${std}\n` +
    Object.entries(R.formats).map(([k, v]) => `- ${FORMATS_ETIQ[k].t} : ${v.n}${v.planches ? `, ${pluriel(v.planches, "planche")} A4` : `, ${v.cm} cm de ruban de ${FORMATS_ETIQ[k].ruban} mm`}`).join("\n") +
    `\nSupports spéciaux : ${R.speciaux.length ? "\n" + R.speciaux.map(([k, n]) => `- ${SUPPORTS_ETIQ[k].t} : ${n}`).join("\n") : "aucun"}`;
}
// Une étiquette. Le QR est une case vide remplie par dessinerQrP : code | niveau | taille du code en mm (sans la marge).
function etiquetteP(x, c, style) {
  const f = FORMATS_ETIQ[x.fmt], qr = `<i class="pl-qr" data-qr-p="${x.id}|${f.niveau}|${f.qr}"></i>`, prop = `Propriété de ${esc(c.nom)}`;
  if (x.fmt === "etagere") return `<div class="pl-e pl-etagere" ${style}>${qr}<div><span class="pl-nom">${esc(x.nom)}</span><b class="pl-code">${x.id}</b>${x.sous ? `<small>${esc(x.sous)}</small>` : ""}<small>${prop}</small></div></div>`;
  if (x.fmt === "bac") return `<div class="pl-e pl-bac" ${style}>${qr}<div><b class="pl-code">${x.id}</b><span class="pl-nom">${esc(x.nom)}</span><small>${prop}</small></div></div>`;
  if (x.fmt === "petit") return `<div class="pl-e pl-petit" ${style}>${qr}<div><b class="pl-code">${x.id}</b><span class="pl-nom">${esc(coupeP(x.nom, f.nom))}</span><small>${prop}</small></div></div>`;
  if (x.fmt === "outil") return `<div class="pl-e pl-outil">${qr}<div><b class="pl-code">${x.id}</b><span class="pl-nom">${esc(coupeP(x.nom, f.nom))}</span><small>${esc(c.nom)}</small></div></div>`;
  if (x.fmt === "petitOutil") { const [a, n] = x.id.split("-"); return `<div class="pl-e pl-petitOutil">${qr}<div><b class="pl-code">${a}-<br>${n || ""}</b></div></div>`; }
  return `<div class="pl-e pl-drapeau"><span class="pl-face">${qr}</span><span class="pl-tour">tour du câble</span><span class="pl-face"><b class="pl-code">${x.id}</b><span class="pl-nom">${esc(coupeP(x.nom, f.nom))}</span></span></div>`;
}
let departEtiqP = {}, choixEtiqOuvert = false; // case de départ par format ; le volet des choix reste ouvert pendant qu'on y travaille
function eEtiquettesP(id) {
  const c = clientP(id); if (!c || !c.liste) return eClient(id);
  const l = etiquettesListeP(c), L = c.liste.articles, R = recapEtiqP(l, departEtiqP), total = l.reduce((t, x) => t + x.n, 0), coupes = l.filter(x => x.coupe);
  const nf = n => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  let achat = 0; const aPart = [];
  const lignes = R.lignes.map(r => {
    const s = SUPPORTS_ETIQ[r.sup], f = r.fmt ? FORMATS_ETIQ[r.fmt] : null, u = s.coutTexte ? null : (s.cout || f.cout);
    if (u === null) aPart.push(s.t + " : " + s.coutTexte); else achat += u * r.n;
    return `<tr><td>${f ? esc(f.t) : "—"}</td><td>${esc(s.t)}${s.special ? " <small>(spécial)</small>" : ""}</td><td class="n">${r.n.toLocaleString("fr-FR")}</td><td class="n">${u === null ? esc(s.coutTexte) : nf(u * r.n)}</td></tr>`;
  }).join("");
  // Les choix : par groupe, puis article par article
  const groupes = [...new Set(L.map(x => "emp|" + x.emp))].map(k => [k, "Emplacement : " + k.slice(4)]).concat([...new Set(L.filter(x => x.categorie).map(x => "cat|" + x.categorie))].map(k => [k, "Catégorie : " + k.slice(4)]));
  const optF = (v, prop) => `<option value="">${prop}</option>${Object.entries(FORMATS_ETIQ).map(([k, f]) => `<option value="${k}" ${v === k ? "selected" : ""}>${f.t}</option>`).join("")}`;
  const optS = (v, prop) => `<option value="">${prop}</option>${Object.entries(SUPPORTS_ETIQ).map(([k, s]) => `<option value="${k}" ${v === k ? "selected" : ""}>${s.t}</option>`).join("")}`;
  const optV = v => `<option value="">Non précisé</option>${Object.entries(VIES_ETIQ).map(([k, [t]]) => `<option value="${k}" ${v === k ? "selected" : ""}>${t}</option>`).join("")}`;
  const choix = `<details class="bloc regl-bloc pl-choix" data-etiq-choix ${choixEtiqOuvert ? "open" : ""}><summary>Format et support de chaque objet</summary>
    <p class="w-note">Chaque article reçoit une proposition : sur l'objet, un ruban laminé « Outil » ; sur un contenant, « Bac » ; sur le bac ou l'étagère, « Étagère ». « Où vit l'objet » l'affine (câble : drapeau ; ne se colle pas : plaquette à collier ; objet cher : inviolable ; gras, extérieur, lavage : ruban laminé). Changez ce qui ne convient pas ; laissez le reste.</p>
    <div class="pl-groupe"><label class="champ">Tout un groupe<select data-etiq-groupe><option value="">Choisir un emplacement ou une catégorie…</option>${groupes.map(([k, t]) => `<option value="${esc(k)}">${esc(t)}</option>`).join("")}</select></label>
      <label class="champ">Format<select data-etiq-gfmt>${optF("", "Format proposé")}</select></label><label class="champ">Support<select data-etiq-gsup>${optS("", "Support proposé")}</select></label>
      <button class="btn petit" data-etiq-appliquer="${c.id}">Appliquer au groupe</button></div>
    <div class="pl-lignes">${l.filter(x => x.i >= 0).map(x => { const a = L[x.i], p = propositionEtiqP(a, x.type);
      return `<div class="pl-ligne"><span><b>${esc(a.nom)}</b><small>${x.id} · ${esc(a.emp)}${a.categorie ? " · " + esc(a.categorie) : ""} · ${pluriel(x.n, "étiquette")}</small></span>
        <select data-etiq-vie="${c.id}|${x.i}" aria-label="Où vit l'objet">${optV(a.vie || "")}</select>
        <select data-etiq-fmt="${c.id}|${x.i}" aria-label="Format">${optF(a.fmt || "", "Proposé : " + FORMATS_ETIQ[p.fmt].t)}</select>
        <select data-etiq-sup="${c.id}|${x.i}" aria-label="Support">${optS(a.sup || "", "Proposé : " + SUPPORTS_ETIQ[p.sup].t)}</select></div>`; }).join("")}</div>
    <p style="margin:10px 0 0"><button class="btn petit" data-etiq-propositions="${c.id}">Revenir aux propositions</button></p></details>`;
  // Une section par format
  const sections = Object.entries(FORMATS_ETIQ).map(([k, f]) => {
    const items = l.filter(x => x.fmt === k && !SUPPORTS_ETIQ[x.sup].sansEtiquette), n = items.reduce((t, x) => t + x.n, 0); if (!n) return "";
    const sup = [...new Set(items.map(x => SUPPORTS_ETIQ[x.sup].t))].join(", ");
    if (f.ruban) {
      const vus = items.slice(0, 12);
      return `<section class="pl-format pas-imprimer" data-fmt="${k}"><h2>${f.t} <small class="compte-ph">${n}</small></h2>
        <p class="sous">Ruban laminé de ${f.ruban} mm, ${mm(f.l)} mm de long${k === "drapeau" ? " pour un câble de 8 mm (deux faces de 30 mm, plus le tour du câble)" : ""} · QR de ${mm(f.qr)} mm, soit ${f.points} points par module à 180 points par pouce · ${R.formats[k].cm} cm de ruban · ${esc(sup)}.</p>
        <div class="boutons" style="margin-bottom:10px"><button class="btn petit plein" data-etiq-csv="${c.id}|${k}">${I.excel}Exporter le CSV pour l'étiqueteuse</button></div>
        <p class="w-note">Le fichier s'ouvre dans le logiciel de l'étiqueteuse, relié à un modèle d'étiquette : une ligne par étiquette (code, nom coupé, sous-titre, entreprise, format, longueur). C'est ce logiciel qui dessine le QR et qui imprime. Aperçu à taille réelle, un exemplaire par article${items.length > vus.length ? `, les ${vus.length} premiers` : ""} :</p>
        <div class="pl-rubans">${vus.map(x => etiquetteP(x, c, "")).join("")}</div></section>`;
    }
    const par = f.cols * f.rangs, depart = Math.min(par, Math.max(1, departEtiqP[k] || 1)), cases = []; items.forEach(x => { for (let j = 0; j < x.n; j++) cases.push(x); });
    const pages = []; for (let p = 0; p * par < cases.length + depart - 1; p++) pages.push(cases.slice(Math.max(0, p * par - depart + 1), (p + 1) * par - depart + 1).map((x, j) => { const pos = (p ? 0 : depart - 1) + j; return etiquetteP(x, c, `style="left:${mm(f.gauche + (pos % f.cols) * f.pasX).replace(",", ".")}mm;top:${mm(f.haut + Math.floor(pos / f.cols) * f.pasY).replace(",", ".")}mm"`); }).join(""));
    return `<section class="pl-format" data-fmt="${k}"><div class="pas-imprimer"><h2>${f.t} <small class="compte-ph">${n}</small></h2>
      <p class="sous">Planche A4 prédécoupée de ${par} étiquettes de ${mm(f.l)} × ${mm(f.h)} mm (${f.cols} × ${f.rangs}) · QR de ${mm(f.qr)} mm · ${pluriel(pages.length, "planche")} · ${esc(sup)}.</p>
      <div class="boutons pl-outils"><label class="champ">Commencer à l'étiquette n°<input type="number" inputmode="numeric" min="1" max="${par}" step="1" value="${depart}" data-etiq-depart="${k}"></label>
        <button class="btn petit plein" data-etiq-imprimer="${k}">${I.imprimer}Imprimer ce format</button></div>
      <p class="w-note"><b>Imprimez à 100 %</b> (« Taille réelle », sans « Ajuster à la page »), sans marges ni en-têtes. Marges et pas calculés (haut ${mm(f.haut)} mm, gauche ${mm(f.gauche)} mm, pas ${mm(f.pasX)} × ${mm(f.pasY)} mm) : <b>à vérifier sur le gabarit du fabricant</b> (${f.gabarit}), par une impression d'essai sur papier, posée sur la planche à contre-jour.</p></div>
      <div class="pl-zone">${pages.map(p => `<div class="pl-page">${p}</div>`).join("")}</div></section>`;
  }).join("");
  return `<div class="pas-imprimer ecran-etiq"><h1>Étiquettes · ${esc(c.nom)}</h1>
    <p class="sous">${pluriel(total, "étiquette")} pour ${pluriel(L.length, "article")}, leurs emplacements et leurs lieux. Le QR porte le code seul (ART-0001, EMP-01), avec sa marge blanche : il se lit avec le bouton Scanner de l'appli.${coupes.length ? ` Au plus ${ETIQ_MAX} exemplaires par article : ${coupes.length > 1 ? coupes.length + " articles en demandent" : esc(coupes[0].nom) + " en demande"} davantage, à réimprimer au besoin.` : ""}</p>
    <div class="boutons" style="margin-bottom:12px"><button class="btn petit" data-e="liste" data-earg="${c.id}">Sa liste</button><button class="btn petit" data-e="client" data-earg="${c.id}">Fiche du client</button></div>
    <h2>Récapitulatif, à reporter sur le devis</h2>
    <div class="bloc regl-bloc" style="padding-top:12px"><div class="defile"><table class="t"><thead><tr><th>Format</th><th>Support</th><th class="n">Étiquettes</th><th class="n">Achat indicatif</th></tr></thead><tbody>${lignes}</tbody></table></div>
      <p style="margin:10px 0 4px">${Object.entries(R.formats).map(([k, v]) => `<b>${FORMATS_ETIQ[k].t}</b> : ${v.planches ? pluriel(v.planches, "planche") + " A4" : v.cm + " cm de ruban de " + FORMATS_ETIQ[k].ruban + " mm"}`).join(" · ")}</p>
      <p style="margin:0 0 4px"><b>Supports spéciaux</b> : ${R.speciaux.length ? R.speciaux.map(([k, n]) => `${esc(SUPPORTS_ETIQ[k].t)} ${n}`).join(" · ") : "aucun"}.</p>
      <p class="w-note">Achat des consommables, indicatif, à confirmer : ${nf(achat)} HT${aPart.length ? ", plus " + esc(aPart.join(" ; ")) : ""}. Ce n'est pas un prix de vente : les étiquettes standard sont dans l'offre, les supports spéciaux se chiffrent à part (docs/21, section 12).</p>
      <div class="boutons"><button class="btn petit plein" data-etiq-copier="${c.id}">Copier pour le devis</button><button class="btn petit" data-etiq-liste="${c.id}">${I.excel}Exporter la liste (CSV)</button></div></div>
    <h2>Les choix</h2>${choix}</div>${sections}`;
}
function csvEtiqP(nom, lignes) {
  const cel = v => /[";\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + lignes.map(l => l.map(cel).join(";")).join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" })); a.download = nom;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
// Les QR se dessinent par paquets, pour qu'une planche de plusieurs centaines d'étiquettes ne fige pas l'écran.
// Marge blanche de 4 modules dessinée avec le code ; la taille demandée est celle du code sans la marge, agrandie si le code a plus de 21 modules.
async function dessinerQrP() {
  const cases = [...$$("[data-qr-p]")]; delete document.body.dataset.qrPrets; if (!cases.length) return;
  try { await script("lib/qrcode.js"); } catch (e) { cases.forEach(c => { c.textContent = "QR indisponible hors ligne"; }); return; }
  const faits = {};
  for (let i = 0; i < cases.length; i += 150) {
    cases.slice(i, i + 150).forEach(c => {
      const k = c.dataset.qrP;
      if (!faits[k]) { const [code, niveau, taille] = k.split("|"), q = window.qrcode(0, niveau); q.addData(code); q.make(); const n = q.getModuleCount(), cote = Math.round(+taille * (n + 8) / 21 * 100) / 100;
        faits[k] = q.createSvgTag({ cellSize: 4, margin: 16, scalable: true }).replace("<svg ", `<svg shape-rendering="crispEdges" style="width:${cote}mm;height:${cote}mm" `); }
      c.innerHTML = faits[k];
    });
    await new Promise(r => setTimeout(r, 0));
  }
  document.body.dataset.qrPrets = String(cases.length);
}
function brancherEtiqP() {
  const lire = b => { const [id, i] = b.split("|"), c = clientP(id); return { c, a: c.liste.articles[+i] }; };
  const poser = (a, cle, v) => { if (v) a[cle] = v; else delete a[cle]; };
  const det = $("[data-etiq-choix]"); if (det) det.ontoggle = () => { choixEtiqOuvert = det.open; };
  [["vie", "etiqVie"], ["fmt", "etiqFmt"], ["sup", "etiqSup"]].forEach(([cle, d]) => $$(`[data-etiq-${cle}]`).forEach(s => s.onchange = () => { const { a } = lire(s.dataset[d]); poser(a, cle, s.value); sauverP(); rendre(); }));
  $$("[data-etiq-appliquer]").forEach(b => b.onclick = () => {
    const c = clientP(b.dataset.etiqAppliquer), g = $("[data-etiq-groupe]").value, fmt = $("[data-etiq-gfmt]").value, sup = $("[data-etiq-gsup]").value;
    if (!g) return toast("Choisissez d'abord un emplacement ou une catégorie.");
    const l = c.liste.articles.filter(a => g.startsWith("emp|") ? a.emp === g.slice(4) : a.categorie === g.slice(4));
    l.forEach(a => { poser(a, "fmt", fmt); poser(a, "sup", sup); }); sauverP(); rendre();
    toast(`${pluriel(l.length, "article")} : ${fmt ? FORMATS_ETIQ[fmt].t : "format proposé"}, ${sup ? SUPPORTS_ETIQ[sup].t.toLowerCase() : "support proposé"}.`);
  });
  $$("[data-etiq-propositions]").forEach(b => b.onclick = () => {
    const c = clientP(b.dataset.etiqPropositions);
    if (!confirm("Revenir aux formats et aux supports proposés pour tous les articles ? « Où vit l'objet » est gardé.")) return;
    c.liste.articles.forEach(a => { delete a.fmt; delete a.sup; }); sauverP(); rendre(); toast("Propositions remises.");
  });
  $$("[data-etiq-depart]").forEach(i => i.onchange = () => { departEtiqP[i.dataset.etiqDepart] = Math.max(1, Math.floor(+i.value) || 1); rendre(); });
  $$("[data-etiq-imprimer]").forEach(b => b.onclick = () => {
    $$(".pl-format").forEach(s => s.classList.toggle("pl-hors", s.dataset.fmt !== b.dataset.etiqImprimer));
    window.print(); setTimeout(() => $$(".pl-hors").forEach(s => s.classList.remove("pl-hors")), 500);
  });
  $$("[data-etiq-csv]").forEach(b => b.onclick = () => {
    const [id, k] = b.dataset.etiqCsv.split("|"), c = clientP(id), f = FORMATS_ETIQ[k], lignes = [["Code", "Nom", "Sous-titre", "Entreprise", "Format", "Longueur (mm)"]];
    etiquettesListeP(c).filter(x => x.fmt === k && !SUPPORTS_ETIQ[x.sup].sansEtiquette).forEach(x => { for (let j = 0; j < x.n; j++) lignes.push([x.id, f.nom ? coupeP(x.nom, f.nom) : "", x.sous, c.nom, f.t, mm(f.l)]); });
    csvEtiqP(`etiquettes-${normP(f.t).replace(/ /g, "-")}-${normP(c.nom).replace(/ /g, "-").slice(0, 30) || "client"}.csv`, lignes); toast(`${pluriel(lignes.length - 1, "étiquette")} « ${f.t} » dans le fichier.`);
  });
  $$("[data-etiq-liste]").forEach(b => b.onclick = () => {
    const c = clientP(b.dataset.etiqListe), lignes = [["Code", "Nom", "Format", "Support", "Étiquettes", "Où vit l'objet", "Emplacement"]];
    etiquettesListeP(c).forEach(x => lignes.push([x.id, x.nom, SUPPORTS_ETIQ[x.sup].sansEtiquette ? "" : FORMATS_ETIQ[x.fmt].t, SUPPORTS_ETIQ[x.sup].t, x.n, x.i >= 0 && c.liste.articles[x.i].vie ? VIES_ETIQ[c.liste.articles[x.i].vie][0] : "", x.emp || ""]));
    csvEtiqP(`plan-etiquettes-${normP(c.nom).replace(/ /g, "-").slice(0, 30) || "client"}.csv`, lignes); toast("Plan d'étiquetage enregistré dans vos téléchargements.");
  });
  $$("[data-etiq-copier]").forEach(b => b.onclick = async () => {
    const c = clientP(b.dataset.etiqCopier), l = etiquettesListeP(c), t = texteRecapEtiqP(c, l, recapEtiqP(l, departEtiqP));
    try { await navigator.clipboard.writeText(t); toast("Récapitulatif copié."); } catch (e) { prompt("Copiez ce récapitulatif :", t); }
  });
}

/* ---------------- Export pour le classeur du client ---------------- */
// Un classeur nu : les titres en ligne 1, aux noms exacts du modèle livré (modeles/02), prêt à coller onglet par onglet.
// Cellule : texte, nombre, { f: formule }, { d: date et heure }, { j: "2027-12-31" }.
function classeurSimpleP(feuilles) {
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy hh:mm"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const cel = (ref, v, s) => {
    if (v === null || v === undefined || v === "") return "";
    if (typeof v === "number") return `<c r="${ref}"><v>${v}</v></c>`;
    if (v.f) return `<c r="${ref}"><f>${xmlEsc(v.f)}</f></c>`;
    if (v.d) return `<c r="${ref}" s="2"><v>${serieExcel(v.d).toFixed(6)}</v></c>`;
    if (v.j) return `<c r="${ref}" s="3"><v>${Math.round(Date.UTC(+v.j.slice(0, 4), +v.j.slice(5, 7) - 1, +v.j.slice(8, 10)) / 86400000 + 25569)}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${s ? ` s="${s}"` : ""}><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
  };
  const xmlFeuille = f => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${f.entetes.map((t, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.max(12, t.length + 4)}" customWidth="1"/>`).join("")}</cols><sheetData><row r="1">${f.entetes.map((t, i) => cel(colonne(i) + "1", t, 1)).join("")}</row>${f.lignes.map((l, j) => `<row r="${j + 2}">${l.map((v, i) => cel(colonne(i) + (j + 2), v)).join("")}</row>`).join("")}</sheetData></worksheet>`;
  return zipStocke([
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${feuilles.map((f, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`],
    ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${feuilles.map((f, i) => `<sheet name="${xmlEsc(f.nom)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${feuilles.map((f, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${feuilles.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ["xl/styles.xml", styles],
  ].concat(feuilles.map((f, i) => [`xl/worksheets/sheet${i + 1}.xml`, xmlFeuille(f)])));
}
// ARTICLES, EMPLACEMENTS, FOURNISSEURS aux colonnes du modèle livré, et MOUVEMENTS avec le stock de départ :
// dans le classeur, le stock d'un article est la somme de ses mouvements, pas une case que l'on remplit.
function feuillesClasseurP(c) {
  const b = construireListeP(c), L = c.liste.articles;
  const articles = b.articles.map((a, i) => { const x = L[i], r = i + 2; return [a.id, a.nom, x.categorie, x.serie ? "Équipement" : "Consommable", x.unite || "pièce", "", x.prix, x.fou === FOU_DEFAUT ? "" : a.fou, a.emp, a.seuil, a.cible, x.serie,
    { f: `SUMIFS(MOUVEMENTS!$I:$I,MOUVEMENTS!$D:$D,A${r})` }, { f: `IF(D${r}="Équipement",IF(M${r}>=1,"Disponible","Sorti"),IF(M${r}<=0,"Rupture",IF(M${r}<=J${r},"Sous le seuil","OK")))` },
    { f: `-SUMIFS(MOUVEMENTS!$I:$I,MOUVEMENTS!$D:$D,A${r},MOUVEMENTS!$F:$F,"Sortie",MOUVEMENTS!$B:$B,">="&(TODAY()-30))` }, { f: `IF(O${r}<=0,"",ROUND(M${r}/(O${r}/30),0))` }, { f: `M${r}*G${r}` },
    x.logique === "pret" ? "Prêt" : "Consommation", x.suiviLots ? "OUI" : "NON"]; });
  const empDe = Object.fromEntries(b.articles.map(a => [a.id, a.emp]));
  return [
    { nom: "ARTICLES", entetes: ["ID_Article", "Nom", "Categorie", "Type", "Unite", "Photo", "Prix_unitaire_HT", "Fournisseur", "Emplacement_defaut", "Seuil_mini", "Qte_cible", "Numero_serie", "Stock_actuel", "Statut", "Conso_30j", "Jours_restants", "Valeur_stock", "Logique", "Suivi_lots"], lignes: articles },
    { nom: "EMPLACEMENTS", entetes: ["ID_Emplacement", "Site", "Zone", "Etagere_Bac", "Type", "Responsable"], lignes: b.emplacements.map(e => [e.id, "SITE-01", e.nom, "", "Dépôt", ""]) },
    { nom: "FOURNISSEURS", entetes: ["ID_Fournisseur", "Nom", "Contact", "Email", "Telephone", "Delai_jours", "Minimum_commande"], lignes: b.fournisseurs.filter(f => f.nom !== FOU_DEFAUT).map(f => [f.id, f.nom, "", "", "", "", ""]) },
    { nom: "MOUVEMENTS", entetes: ["ID_Mouvement", "Date_heure", "Utilisateur", "Article", "Emplacement", "Type", "Quantite", "Motif", "Qte_signee", "Imputation", "Photo", "Commande_liee", "Retour_prevu", "Lot", "Date_limite", "Bon"],
      lignes: b.mouvements.map(m => [m.id, { d: m.date }, "", m.article, empDe[m.article], "Inventaire initial", m.qte, "Démarrage", m.qte, "", "", "", "", m.lotNum || "", m.dlc ? { j: m.dlc } : "", ""]) },
  ];
}
function exporterClasseurP(c) {
  const blob = classeurSimpleP(feuillesClasseurP(c)), a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `classeur-${normP(c.nom).replace(/ /g, "-").slice(0, 40) || "client"}-${aujourdHui()}.xlsx`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast("Classeur enregistré dans vos téléchargements : ARTICLES, EMPLACEMENTS, FOURNISSEURS, MOUVEMENTS.");
}

/* ---------------- Écran : la liste d'un client ---------------- */
let relectureP = null; // { id, source, colonnes, inconnues, sansTitres, remplacer, ajouter }
function lancerRelectureP(id, lignes, source, lieux) {
  const c = clientP(id), p = preparerLignesP(lignes);
  if (!p.brutes.length) return toast("Aucune ligne à lire : le fichier ou le collage est vide.");
  relectureP = { id, source, lieux: lieux || [], colonnes: p.colonnes, inconnues: p.inconnues, sansTitres: p.sansTitres, remplacer: controlerListeP(p.brutes, c, []), ajouter: c.liste ? controlerListeP(p.brutes, c, c.liste.articles) : null };
  rendre();
  const z = $("[data-relecture-p]"); if (z) z.scrollIntoView({ block: "start" });
}
function blocListeP(c) {
  if (!c.liste) return `<p class="vide" style="padding:6px 0 12px">Pas encore de liste. Le client remplit le modèle, ou envoie son propre tableau.</p>`;
  const r = resumeListeP(c);
  return `<p style="margin:0 0 4px"><b>${pluriel(r.n, "article")}</b> dans ${pluriel(r.emp, "emplacement")}${r.fou ? `, ${pluriel(r.fou, "fournisseur")}` : ""}. Importée le ${new Date(c.liste.le).toLocaleDateString("fr-FR")}.</p>
    <p class="w-note" style="margin-bottom:12px">${[[r.prets, "prêté", "prêtés"], [r.series, "avec numéro de série", "avec numéro de série"], [r.consos, "consommé", "consommés"], [r.lots, "suivi par lots et dates limites", "suivis par lots et dates limites"], [r.cond, "avec un conditionnement", "avec un conditionnement"], [r.ctrl, "avec un contrôle à échéance", "avec un contrôle à échéance"], [r.lieux, "lieu de stock en plus du dépôt", "lieux de stock en plus du dépôt"]].filter(x => x[0]).map(([n, a, b]) => `${n} ${n > 1 ? b : a}`).join(" · ")}</p>`;
}
const boutonsListeP = c => `<button class="btn petit plein" data-e="etiquettes" data-earg="${c.id}">${I.etiquette}Générer ses étiquettes</button><button class="btn petit" data-classeur-p="${c.id}">${I.excel}Exporter pour le classeur</button>`;
function eListeP(id) {
  const c = clientP(id); if (!c) return eClients();
  const R = relectureP && relectureP.id === id ? relectureP : null;
  const ligne = x => `<li><div class="l ligne-liste"><span><b>Ligne ${x.n}${x.nom ? " · " + esc(x.nom) : ""}</b><small>${esc(x.t)}</small></span></div></li>`;
  let relecture = "";
  if (R) {
    const r = R.remplacer, a = R.ajouter, crees = { articles: r.articles };
    const nEmp = new Set(crees.articles.map(x => normP(x.emp))).size, nFou = new Set(crees.articles.filter(x => x.fou !== FOU_DEFAUT).map(x => normP(x.fou))).size;
    relecture = `<section class="w relecture-p" data-relecture-p><h2 style="margin-top:0">Relecture avant d'enregistrer</h2>
      <p class="sous">${esc(R.source)}. Rien n'est encore enregistré.</p>
      <div class="trio"><div><small>Lignes bonnes</small><b class="vert">${r.bonnes}</b></div><div><small>À corriger</small><b class="${r.erreurs.length ? "rouge" : ""}">${r.erreurs.length}</b></div><div><small>Remarques</small><b>${r.remarques.length}</b></div></div>
      <p class="w-note" style="margin-top:10px">${R.sansTitres ? "Aucune ligne de titres trouvée : les colonnes sont lues dans l'ordre du modèle (nom, quantité, emplacement…)." : `Colonnes reconnues : ${R.colonnes.map(esc).join(", ")}.${R.inconnues.length ? ` Laissées de côté : ${R.inconnues.map(esc).join(", ")}.` : ""}`}
        ${r.exemples ? ` ${pluriel(r.exemples, "ligne")} d'exemple écartée${r.exemples > 1 ? "s" : ""}.` : ""}${r.tropLong ? ` Au-delà de ${LISTE_MAX} lignes, ${pluriel(r.tropLong, "ligne")} non lue${r.tropLong > 1 ? "s" : ""}.` : ""}</p>
      <p class="w-note">Ce qui sera créé : ${pluriel(crees.articles.length, "article")} (${r.articles.filter(x => x.logique === "pret").length} prêtés dont ${r.articles.filter(x => x.serie).length} avec numéro de série, ${r.articles.filter(x => x.logique !== "pret").length} consommés dont ${r.articles.filter(x => x.suiviLots).length} suivis par lots), ${pluriel(nEmp, "emplacement")}, ${pluriel(nFou, "fournisseur")}${(() => { const nl = new Set(r.articles.flatMap(x => (x.lieux || []).map(y => normP(y.nom))).concat((R.lieux || []).map(y => normP(y.nom)))).size, nc = r.articles.filter(x => x.ctrlLe).length; return (nl ? `, ${pluriel(nl, "lieu de stock", "lieux de stock")} en plus du dépôt` : "") + (nc ? `, ${pluriel(nc, "contrôle")} à échéance` : ""); })()}.</p>
      ${r.erreurs.length ? `<h3>À corriger : ces ${pluriel(r.erreurs.length, "ligne")} ne ser${r.erreurs.length > 1 ? "ont" : "a"} pas importée${r.erreurs.length > 1 ? "s" : ""}</h3><ul class="b-liste liste-controle">${r.erreurs.slice(0, 200).map(ligne).join("")}</ul>${r.erreurs.length > 200 ? `<p class="w-note">Et ${r.erreurs.length - 200} autres.</p>` : ""}` : ""}
      ${r.remarques.length ? `<details class="remarques-p"><summary>${pluriel(r.remarques.length, "remarque")} : lignes importées avec une valeur de départ</summary><ul class="b-liste liste-controle">${r.remarques.slice(0, 200).map(ligne).join("")}</ul>${r.remarques.length > 200 ? `<p class="w-note">Et ${r.remarques.length - 200} autres.</p>` : ""}</details>` : ""}
      ${a && a.dejaLa ? `<p class="w-note">${pluriel(a.dejaLa, "ligne")} port${a.dejaLa > 1 ? "ent" : "e"} le nom d'un article déjà dans la liste : « Ajouter à la liste » ne ${a.dejaLa > 1 ? "les" : "la"} reprend pas.</p>` : ""}
      <div class="boutons" style="margin-top:14px">${!r.bonnes ? "" : c.liste ? `<button class="btn petit plein" data-liste-valider="remplacer">Remplacer la liste (${pluriel(r.bonnes, "ligne")})</button>${a.bonnes ? `<button class="btn petit" data-liste-valider="ajouter">Ajouter à la liste (${pluriel(a.bonnes, "ligne")})</button>` : ""}` : `<button class="btn petit plein" data-liste-valider="remplacer">Importer les ${r.bonnes} lignes bonnes</button>`}
        <button class="btn petit" data-liste-annuler>Annuler</button></div></section>`;
  }
  return `<div class="inst dans-espace ecran-liste"><h1>Liste d'articles · ${esc(c.nom)}</h1>
  <p class="sous">Le client n'a pas à saisir ses articles un par un, et vous non plus : il remplit un tableur, vous l'importez ici. La liste se garde dans sa fiche et part dans la sauvegarde de Mon espace.</p>
  ${relecture}
  <h2>Sa liste</h2>
  <div class="bloc regl-bloc" style="padding-top:12px">${blocListeP(c)}
    ${c.liste ? `<div class="boutons">${boutonsListeP(c)}<button class="btn petit" data-regler-p="${c.id}">${I.reglages}Régler son appli</button><button class="btn petit" data-envoi-p="${c.id}">${I.partager}Envoyer sa démo</button><button class="btn petit rouge" data-liste-retirer="${c.id}">Retirer la liste</button></div>` : ""}</div>
  <h2>1. Envoyer le modèle au client</h2>
  <div class="bloc regl-bloc" style="padding-top:12px"><p style="margin:0 0 10px">Deux colonnes obligatoires (le nom, la quantité en stock), le reste facultatif, une ligne d'aide sous chaque titre, un mode d'emploi et des exemples par métier.</p>
    <div class="boutons"><a class="btn petit" href="modele_liste_articles.xlsx" download="Liste_articles_a_remplir.xlsx">${I.excel}Télécharger le modèle à envoyer</a></div>
    <p class="w-note" style="margin-top:10px">Le client a déjà un tableau ? Il s'importe tel quel : les colonnes sont reconnues à leur titre.</p></div>
  <h2>2. Importer ${c.liste ? "une nouvelle liste" : "la liste remplie"}</h2>
  <div class="bloc regl-bloc saisie-p" style="padding-top:12px">
    <div class="boutons"><label class="btn petit plein">${I.excel}Choisir le fichier rempli<input type="file" class="cache" accept=".xlsx,.csv,.tsv,.txt" data-liste-fichier="${c.id}"></label></div>
    <label class="champ">Ou coller ici les cellules copiées depuis Excel ou Google Sheets, titres compris<textarea rows="5" data-liste-collage placeholder="Nom de l'article	Quantité en stock	Où il est rangé…"></textarea></label>
    <div class="boutons"><button class="btn petit" data-liste-coller="${c.id}">Contrôler ce collage</button></div>
    <p class="w-note" style="margin-top:10px">Dans les deux cas, une relecture s'affiche avant d'enregistrer : le nombre de lignes bonnes, et ce qui cloche ligne par ligne.${c.liste ? " Vous choisirez alors de remplacer la liste ou de la compléter." : ""}</p></div></div>`;
}
// Sur la fiche du client
function blocFicheListeP(c) {
  return `<section class="w w-l"><div class="w-entete"><h3 class="w-titre">${I.materiel}Ses articles</h3></div>
    ${blocListeP(c)}<div class="boutons"><button class="btn petit ${c.liste ? "" : "plein"}" data-e="liste" data-earg="${c.id}">${I.excel}Importer sa liste</button>${c.liste ? boutonsListeP(c) : ""}</div></section>${blocLieuxP(c)}${blocEssaiP(c)}`;
}

/* ---------------- Ses lieux et ses contrôles : le réglage du client ---------------- */
// Gardé dans la fiche : c.lieux = { actif, mot, liste: [{ nom, dot: { nom de l'article : quantité } }] } et c.controles (oui, non, ou selon la liste).
// La dotation est rangée par nom d'article : elle survit à un nouvel import de la liste.
function blocLieuxP(c) {
  if (!c.liste) return "";
  const L = c.lieux || { actif: false, mot: "Lieux de stock", liste: [] }, nCtrl = c.liste.articles.filter(a => a.ctrlLe).length;
  const dans = l => c.liste.articles.reduce((t, a) => t + ((a.lieux || []).find(x => normP(x.nom) === normP(l.nom)) || { qte: 0 }).qte, 0);
  return `<section class="w w-l lieux-p"><div class="w-entete"><h3 class="w-titre">${I.camion}Ses lieux et ses contrôles</h3></div>
    <label class="case"><input type="checkbox" data-lieux-actif="${c.id}" ${L.actif ? "checked" : ""}>Stock par lieu : le dépôt, plus des fourgons, des véhicules ou des sites</label>
    ${L.actif ? `<label class="champ lieux-mot">Mot affiché dans son appli<select data-lieux-mot="${c.id}">${Object.keys(MOTS_LIEUX).map(k => `<option ${k === L.mot ? "selected" : ""}>${k}</option>`).join("")}</select></label>
    <div class="bloc">${L.liste.map((l, i) => { const nd = Object.keys(l.dot || {}).length; return `<div class="w-edit regl-etape"><input type="text" data-lieu-nom="${c.id}|${i}" value="${esc(l.nom)}" maxlength="40" aria-label="Nom du lieu">
      <small>${dans(l).toLocaleString("fr-FR")} en stock d'après sa liste · ${nd ? "dotation : " + pluriel(nd, "article") : "pas de dotation"}</small>
      <span class="boutons"><button class="btn petit" data-lieu-dot="${c.id}|${i}">Dotation</button><button class="btn petit rouge" data-lieu-retirer="${c.id}|${i}">Retirer</button></span></div>`; }).join("") || `<p class="vide">Aucun lieu en plus du dépôt.</p>`}
      <div class="w-edit regl-ajout"><input type="text" data-lieu-nouveau="${c.id}" maxlength="40" placeholder="Nouveau lieu : Fourgon 3" aria-label="Nouveau lieu"><button class="btn petit" data-lieu-ajouter="${c.id}">${iconePlus()}Ajouter</button></div></div>`
      : L.liste.length ? `<p class="w-note">${pluriel(L.liste.length, "lieu gardé", "lieux gardés")} dans sa fiche, non affiché${L.liste.length > 1 ? "s" : ""} dans son appli : tout son stock est compté au dépôt.</p>` : ""}
    <label class="case" style="margin-top:14px"><input type="checkbox" data-controles-p="${c.id}" ${controlesP(c) ? "checked" : ""}>Contrôles périodiques : une échéance par objet (étalonnage, vérification)</label>
    <p class="w-note">${nCtrl ? `${pluriel(nCtrl, "objet")} de sa liste port${nCtrl > 1 ? "ent" : "e"} une date de prochain contrôle.` : "Aucun objet de sa liste ne porte de date de contrôle : son équipe en ajoutera dans l'appli."} Ces réglages se gardent dans sa fiche ; ils partent avec « Régler son appli » et « Envoyer sa démo ».</p></section>`;
}
// La dotation d'un lieu : ce qu'il doit contenir, article par article (les objets à numéro de série se suivent par le prêt)
function feuilleDotationP(id, i) {
  const c = clientP(id), l = c.lieux.liste[i], vus = new Set(), arts = c.liste.articles.filter(a => !a.serie && !vus.has(normP(a.nom)) && vus.add(normP(a.nom)));
  const autres = c.lieux.liste.map((x, k) => [x, k]).filter(([x, k]) => k !== i && Object.keys(x.dot || {}).length);
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tdo" class="saisie-p"><h1 id="tdo" style="font-size:26px">Dotation · ${esc(l.nom)}</h1>
    <p class="sous">Ce que ce lieu doit contenir. L'appli du client dit ce qui manque et propose de le recharger depuis le dépôt. Laissez vide ce qui n'en fait pas partie.</p>
    ${autres.length ? `<label class="champ">Reprendre la dotation de<select data-reprendre><option value="">Choisir un lieu…</option>${autres.map(([x, k]) => `<option value="${k}">${esc(x.nom)}</option>`).join("")}</select></label>` : ""}
    <div class="dot-p">${arts.map(a => `<label><span>${esc(a.nom)}</span><input type="number" inputmode="numeric" min="0" step="1" data-dot="${esc(normP(a.nom))}" value="${(l.dot || {})[normP(a.nom)] || ""}" placeholder="0"></label>`).join("")}</div>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  const rep = f.querySelector("[data-reprendre]"); if (rep) rep.onchange = () => { if (rep.value === "") return; const d = c.lieux.liste[+rep.value].dot || {}; f.querySelectorAll("[data-dot]").forEach(x => { x.value = d[x.dataset.dot] || ""; }); toast(`Dotation de ${c.lieux.liste[+rep.value].nom} reprise : vérifiez, puis enregistrez.`); };
  f.querySelector("[data-ok]").onclick = () => {
    l.dot = {}; f.querySelectorAll("[data-dot]").forEach(x => { const n = Math.floor(+x.value); if (n > 0) l.dot[x.dataset.dot] = Math.min(n, 100000); });
    sauverP(); f.remove(); rendre(); toast(`Dotation de ${l.nom} enregistrée : ${pluriel(Object.keys(l.dot).length, "article")}.`);
  };
}
function brancherLieuxP() {
  const lire = b => { const [id, i] = String(b).split("|"), c = clientP(id); return { c, i: +i, L: c.lieux = c.lieux || { actif: false, mot: "Lieux de stock", liste: [] } }; };
  const pris = (L, nom, sauf) => L.liste.some((l, k) => k !== sauf && normP(l.nom) === normP(nom));
  $$("[data-lieux-actif]").forEach(x => x.onchange = () => { const { c, L } = lire(x.dataset.lieuxActif); L.actif = x.checked; if (x.checked) synchroLieuxP(c); sauverP(); rendre(); toast(x.checked ? "Stock par lieu activé pour ce client." : "Stock par lieu retiré de son appli. Ses lieux restent dans sa fiche."); });
  $$("[data-lieux-mot]").forEach(x => x.onchange = () => { lire(x.dataset.lieuxMot).L.mot = x.value; sauverP(); toast(`Son appli dira « ${x.value} ».`); });
  $$("[data-lieu-nom]").forEach(x => x.onchange = () => {
    const { c, i, L } = lire(x.dataset.lieuNom), l = L.liste[i], t = texteP(x.value).slice(0, 40);
    if (!t || pris(L, t, i)) { x.value = l.nom; return toast(t ? "Un autre lieu porte déjà ce nom." : "Un lieu porte un nom. Pour l'enlever, touchez « Retirer »."); }
    c.liste.articles.forEach(a => (a.lieux || []).forEach(y => { if (normP(y.nom) === normP(l.nom)) y.nom = t; }));
    l.nom = t; sauverP(); toast("Lieu renommé.");
  });
  $$("[data-lieu-retirer]").forEach(x => x.onclick = () => {
    const { c, i, L } = lire(x.dataset.lieuRetirer), l = L.liste[i];
    if (!confirm(`Retirer « ${l.nom} » ? Ce qui s'y trouvait est compté au dépôt ; sa dotation est perdue.`)) return;
    c.liste.articles.forEach(a => { a.lieux = (a.lieux || []).filter(y => normP(y.nom) !== normP(l.nom)); });
    L.liste.splice(i, 1); sauverP(); rendre(); toast("Lieu retiré.");
  });
  const ajouter = id => {
    const { L } = lire(id), champ = $(`[data-lieu-nouveau="${id}"]`), t = texteP(champ.value).slice(0, 40);
    if (!t) { champ.focus(); return toast("Écrivez le nom du lieu."); }
    if (pris(L, t, -1)) return toast("Ce lieu existe déjà.");
    if (L.liste.length >= 60) return toast("60 lieux au plus.");
    L.liste.push({ nom: t, dot: {} }); sauverP(); rendre(); toast("Lieu ajouté.");
  };
  $$("[data-lieu-ajouter]").forEach(x => x.onclick = () => ajouter(x.dataset.lieuAjouter));
  $$("[data-lieu-nouveau]").forEach(x => x.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); ajouter(x.dataset.lieuNouveau); } });
  $$("[data-lieu-dot]").forEach(x => x.onclick = () => { const [id, i] = x.dataset.lieuDot.split("|"); feuilleDotationP(id, +i); });
  $$("[data-controles-p]").forEach(x => x.onchange = () => { clientP(x.dataset.controlesP).controles = x.checked; sauverP(); rendre(); toast(x.checked ? "Contrôles périodiques activés pour ce client." : "Contrôles périodiques retirés de son appli."); });
}

/* ---------------- Envoyer sa démo au prospect, puis relire son essai ---------------- */
// La démo telle que le prospect la reçoit (essai.js la lit) : son métier, son nom, sa monnaie, ses modules, le réglage de son appli,
// ses articles et son stock de départ, la date de fin de l'essai, et de quoi nous écrire. Jamais le devis, l'offre, le contact
// du client, les notes, ni rien d'un autre client. Le numéro d'essai est l'empreinte du contenu : la même liste donne le même numéro.
// Colonnes d'un article dans la démo envoyée, et empreinte du contenu. Définies ici, avant essai.js : la fiche d'un client s'en sert dès le premier affichage.
const COLONNES_ESSAI = ["nom", "qte", "emp", "logique", "categorie", "unite", "prix", "fou", "seuil", "cible", "lot", "serie", "lots", "code", "ctrlLe", "ctrlMois", "ctrlNom", "lieux"];
function empreinteEssai(t) {
  let a = 0x811c9dc5, b = 0x1b873593;
  for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193) >>> 0; b = Math.imul(b ^ c, 0x5bd1e995) >>> 0; b ^= b >>> 13; }
  return a.toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0").slice(0, 4);
}
function paquetEssaiP(c, fin) {
  const L = c.liste.articles, base = METIERS[c.metier].base || c.metier, o = OFFRES[c.offre], r = reglP();
  const a = c.appli && c.appli.metier === c.metier && c.appli.config ? c.appli : null;
  const cl = c.lieux && c.lieux.actif && c.lieux.liste.length ? c.lieux : null, ctrl = controlesP(c);
  const p = { type: "stockclair-essai", version: 1, id: "", entreprise: c.nom, metier: c.metier, monnaie: c.pays === "SN" ? "XOF" : "EUR",
    modules: Object.keys(CATALOGUE).filter(k => o.inclus.includes(k) || c.modules.includes(k) || (k === "MO-PRET" && L.some(x => x.logique === "pret"))),
    // Le réglage ne part que s'il diffère de celui du métier : le lien reste court
    appli: a ? Object.assign({ taille: a.taille, detail: a.detail }, JSON.stringify(a.config) === JSON.stringify(configParDefaut(base, a.taille)) ? {} : { config: a.config }) : null,
    // Sans lieu ni contrôle, la démo garde sa forme (et son numéro) d'avant
    importeLe: c.liste.le, colonnes: cl || ctrl ? COLONNES_ESSAI : COLONNES_ESSAI.slice(0, 14),
    articles: L.map(x => { const l = [x.nom, x.qte, x.emp, x.logique, x.categorie, x.unite, x.prix, x.fou, x.seuil, x.cible, x.lot, x.serie, x.lots.map(t => [t.num, t.dlc, t.qte]), x.code, ctrl ? x.ctrlLe || "" : "", ctrl && x.ctrlLe ? x.ctrlMois || "" : "", ctrl && x.ctrlLe ? x.ctrlNom || "" : "", cl ? (x.lieux || []).map(t => [t.nom, t.qte]) : []]; while (l.length && (l[l.length - 1] === "" || (Array.isArray(l[l.length - 1]) && !l[l.length - 1].length))) l.pop(); return l; }) };
  if (cl) p.lieux = { mot: cl.mot, liste: cl.liste.map(l => [l.nom, l.dot || {}]) };
  if (ctrl) p.controles = true;
  p.id = empreinteEssai(JSON.stringify(p));
  p.fin = fin || ""; p.contact = r.nom || r.compte ? { nom: r.nom, email: r.compte } : null; p.prepareLe = Date.now();
  return p;
}
// Le message qui accompagne la démo : vouvoiement, pas de prix. « [lien] » est remplacé à l'envoi.
function messageEnvoiP(c, p, avecLien) {
  const fin = p.fin ? `\n\nL'essai est prévu jusqu'au ${new Date(p.fin + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}.` : "";
  const debut = `Bonjour${c.contact ? " " + c.contact : ""},\n\nVoici votre démo Stockclair, préparée avec vos articles`;
  const suite = `Il n'y a rien à installer et aucun compte à créer. Ce que vous y faites reste sur votre téléphone.${fin}\n\nJe reste à votre disposition pour toute question.\n\nBien cordialement,\n${moiP().complet}`;
  return avecLien ? `${debut} :\n\n[lien]\n\nOuvrez ce lien sur votre téléphone, puis touchez un compte pour entrer. ${suite}`
    : `${debut} : c'est le fichier joint, ${nomFichierEssai("ma-demo-stockclair", c.nom)}.\n\nPour l'ouvrir : enregistrez le fichier sur votre téléphone, allez sur ${adresseDemo()}, touchez « Ouvrir ma démo d'essai » en bas de l'écran et choisissez le fichier. Puis touchez un compte pour entrer. ${suite}`;
}
function feuilleEnvoiP(id) {
  const c = clientP(id); if (!c || !c.liste) return;
  const r = resumeListeP(c), tel = (c.tel || "").replace(/\D/g, "").replace(/^0/, "33"), fin0 = c.essai && c.essai.fin >= aujourdHui() ? c.essai.fin : "";
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="ted" class="saisie-p"><h1 id="ted" style="font-size:26px">Envoyer sa démo</h1>
    <p class="sous">${esc(c.nom)} · ${pluriel(r.n, "article")} dans ${pluriel(r.emp, "emplacement")}. Le prospect l'ouvre sur son téléphone, sans compte : son métier, ses articles, son stock de départ, le réglage de son appli. Rien ne passe par un serveur ; ni le devis ni vos notes ne partent.</p>
    <label class="champ">Fin de l'essai (facultatif)<input type="date" name="fin" min="${aujourdHui()}" value="${fin0}"><small>Affichée dans sa démo comme un rappel, avec votre nom et votre e-mail de « Mes réglages ». Rien ne se bloque après cette date. <button type="button" class="lien" data-fin-essai>Dans ${ESSAI.jours} jours</button></small></label>
    <p class="essai-etat" data-etat role="status">Préparation de sa démo…</p>
    <label class="champ">Message<textarea name="m" rows="9" maxlength="1500"></textarea><small data-aide></small></label>
    <div class="boutons essai-envois"><button class="btn petit plein" data-par="copier">Copier le lien</button>${navigator.share ? `<button class="btn petit" data-par="partager">${I.partager}Partager</button>` : ""}<button class="btn petit" data-par="wa">WhatsApp</button><button class="btn petit" data-par="mel">E-mail</button><button class="btn petit" data-par="fichier">Télécharger le fichier</button></div>
    <div class="valider" style="grid-template-columns:1fr"><button class="btn" data-x>Fermer</button></div></div>`);
  const q = n => f.querySelector(`[name=${n}]`), nb = n => n.toLocaleString("fr-FR");
  let p = null, lien = "", fichier = null, modifie = false, tour = 0;
  // La démo est préparée à l'ouverture, puis à chaque changement de la date de fin
  const preparer = async () => {
    const n = ++tour, neuf = paquetEssaiP(c, q("fin").value), code = await coderEssai(neuf).catch(() => null);
    if (n !== tour || !f.isConnected) return;
    const l = code ? lienEssai("essai", code) : "";
    p = neuf; lien = l && l.length <= LIEN_ESSAI_MAX ? l : ""; fichier = { nom: nomFichierEssai("ma-demo-stockclair", c.nom), texte: JSON.stringify(p) };
    f.querySelector("[data-etat]").textContent = lien ? `Lien prêt : ${nb(l.length)} caractères, pour ${nb(LIEN_ESSAI_MAX)} au plus. Le fichier reste possible.`
      : l ? `Liste trop grande pour un lien (${nb(l.length)} caractères, ${nb(LIEN_ESSAI_MAX)} au plus) : sa démo part dans un fichier, à joindre au message.`
        : "Ce navigateur ne sait pas préparer le lien : sa démo part dans un fichier, à joindre au message.";
    if (!modifie) q("m").value = messageEnvoiP(c, p, !!lien);
    f.querySelector("[data-aide]").textContent = lien ? "« [lien] » est remplacé par le lien de sa démo à l'envoi." : "Le fichier se télécharge au moment de l'envoi : joignez-le au message.";
    f.querySelector('[data-par="copier"]').hidden = !lien;
  };
  q("m").oninput = () => { modifie = true; };
  q("fin").onchange = preparer;
  f.querySelector("[data-fin-essai]").onclick = () => { q("fin").value = isoJour(Date.now() + ESSAI.jours * JOUR_MS); preparer(); };
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelectorAll("[data-par]").forEach(b => b.onclick = async () => {
    if (!p) return toast("Sa démo se prépare : un instant.");
    const m = q("m").value.trim(), par = b.dataset.par;
    if (!m && par !== "copier" && par !== "fichier") return toast("Le message est vide.");
    const t = await envoyerEssai(par, { message: m, lien, fichier, tel, email: c.email, sujet: "Votre démo Stockclair" });
    if (!t) return;
    c.essai = Object.assign({}, c.essai, { id: p.id, envoyeLe: Date.now(), fin: p.fin, n: p.articles.length }); sauverP(); rendre();
    toast(t + " Envoi noté dans sa fiche.");
  });
  preparer();
}
// L'essai renvoyé par le prospect (« Envoyer mon essai », essai.js) : ses gestes, nettoyés et bornés comme tout ce qui vient d'un fichier
function lireRetourP(o) {
  if (!o || o.type !== "stockclair-essai-retour" || o.version !== 1 || !Array.isArray(o.gestes)) throw new Error("forme");
  const gestes = o.gestes.slice(0, 20000).filter(l => Array.isArray(l) && l[5] in SIGNE && isFinite(+l[1]) && isFinite(+l[6]))
    .map(l => ({ id: texteSur(l[0], 12), date: +l[1], qui: texteSur(l[2], 40), role: texteSur(l[3], 12), article: texteSur(l[4], 12), type: l[5], qte: Math.round(+l[6]), lieu: texteSur(l[7], 60), motif: texteSur(l[8], 60), annule: texteSur(l[9], 12) }));
  const noms = {}; Object.entries(o.noms && typeof o.noms === "object" ? o.noms : {}).slice(0, 10000).forEach(([k, v]) => { noms[texteSur(k, 12)] = texteSur(v, 120); });
  return { id: texteSur(o.id, 20), entreprise: texteSur(o.entreprise, 60), ouvertLe: +o.ouvertLe || 0, envoyeLe: +o.envoyeLe || 0, articles: entierSur(o.articles, 0, 9999), gestes, noms, recuLe: Date.now() };
}
// Range l'essai dans la fiche du client. Sans id (essai arrivé par un lien), le client est retrouvé par le numéro d'essai, sinon par son nom.
function recevoirRetourP(o, id) {
  let r; try { r = lireRetourP(o); } catch (e) { return toast(o && o.type === "stockclair-essai" ? "Ce fichier est la démo envoyée au prospect, pas son essai." : "Ce fichier n'est pas un essai Stockclair."); }
  const c = id ? clientP(id) : P_.clients.find(x => x.essai && x.essai.id === r.id) || P_.clients.find(x => x.liste && x.nom === r.entreprise);
  if (!c) return toast(`Aucun client ne correspond à l'essai de ${r.entreprise} : ouvrez sa fiche, puis « Ouvrir son essai ».`);
  if (id && r.entreprise !== c.nom && !(c.essai && c.essai.id === r.id) && !confirm(`Cet essai porte le nom « ${r.entreprise} ». L'ouvrir dans la fiche de ${c.nom} ?`)) return;
  const avant = c.essai && c.essai.retour ? c.essai.retour.gestes.length : 0;
  if (avant > r.gestes.length && !confirm(`L'essai déjà ouvert compte ${pluriel(avant, "geste")}, celui-ci ${r.gestes.length}. Le remplacer ?`)) return;
  c.essai = Object.assign({}, c.essai, { retour: r }); sauverP();
  session = null; installateur = true; allerE("client", c.id);
  toast(`Essai de ${c.nom} ouvert : ${pluriel(r.gestes.length, "geste")}.`);
}
// De quoi préparer le bilan : combien de gestes, par qui, ce qui sort le plus, les écarts de comptage. Un geste annulé ne compte pas.
function bilanEssaiP(c) {
  const r = c.essai.retour, b = construireListeP(c), nomDe = id => r.noms[id] || (b.articles.find(a => a.id === id) || {}).nom || id;
  const annules = new Set(r.gestes.map(g => g.annule).filter(Boolean)), G = r.gestes.filter(g => !g.annule && !annules.has(g.id));
  const compter = cle => { const m = new Map(); G.forEach(g => { const k = cle(g); m.set(k, (m.get(k) || 0) + 1); }); return [...m].sort((x, y) => y[1] - x[1]); };
  const v = METIERS[c.metier].v || {}, role = g => g.role === "chauffeur" ? "Chauffeur-livreur" : v[g.role] || "";
  const genre = g => ["Prêt", "Sortie"].includes(g.type) ? "Sorties" : g.type === "Retour" ? "Retours" : g.type === "Entrée" ? (g.motif === "Surplus remis" ? "Surplus remis en stock" : "Entrées en stock") : g.type === "Ajustement" ? "Comptages avec écart" : g.type === "Perte" ? "Pertes et casse" : g.type === "Transfert" ? "Déplacements entre lieux" : g.type === "Contrôle" ? "Contrôles faits" : "Atelier";
  const sortis = new Map(); G.filter(g => ["Prêt", "Sortie"].includes(g.type)).forEach(g => { const x = sortis.get(g.article) || { qte: 0, fois: 0 }; x.qte += g.qte; x.fois += 1; sortis.set(g.article, x); });
  const dates = G.map(g => g.date).sort((x, y) => x - y);
  return { n: G.length, annules: annules.size, du: dates[0], au: dates[dates.length - 1], jours: new Set(dates.map(isoJour)).size,
    personnes: compter(g => (g.qui || "?") + (role(g) ? " · " + role(g) : "")), genres: compter(genre),
    sortis: [...sortis].sort((x, y) => y[1].qte - x[1].qte).slice(0, 5).map(([k, x]) => ({ nom: nomDe(k), qte: x.qte, fois: x.fois })),
    ecarts: G.filter(g => g.type === "Ajustement").map(g => ({ nom: nomDe(g.article), ecart: g.qte, qui: g.qui, date: g.date })),
    pertes: G.filter(g => g.type === "Perte").reduce((t, g) => t + g.qte, 0), touches: new Set(G.map(g => g.article)).size, total: r.articles || c.liste.articles.length };
}
function blocEssaiP(c) {
  if (!c.liste) return "";
  const e = c.essai || {}, r = e.retour, jour = t => new Date(t).toLocaleDateString("fr-FR"), jourMois = t => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const lignes = (l, vide) => l.length ? `<div class="lignes-p">${l.map(([t, n]) => `<div><span>${t}</span><b>${n}</b></div>`).join("")}</div>` : `<p class="vide" style="padding:6px 0">${vide}</p>`;
  let bilan = "";
  if (r) {
    const B = bilanEssaiP(c);
    bilan = `<p style="margin:16px 0 0"><b>${pluriel(B.n, "geste")}</b>${B.n ? ` en ${pluriel(B.jours, "jour")}, ${B.jours > 1 ? `du ${jourMois(B.du)} au ${jourMois(B.au)}` : `le ${jourMois(B.du)}`}` : ""}. Essai reçu le ${jour(r.recuLe)}.${B.annules ? ` ${pluriel(B.annules, "geste annulé", "gestes annulés")} par le prospect, non compté${B.annules > 1 ? "s" : ""}.` : ""}</p>
    ${B.n ? `<div class="bilan-p">
      <div><h4>Par personne</h4>${lignes(B.personnes.map(([k, n]) => [esc(k), n]), "")}</div>
      <div><h4>Par geste</h4>${lignes(B.genres.map(([k, n]) => [esc(k), n]), "")}</div>
      <div><h4>Objets les plus sortis</h4>${lignes(B.sortis.map(x => [esc(x.nom), `${x.qte.toLocaleString("fr-FR")} en ${x.fois} fois`]), "Aucune sortie.")}</div>
      <div><h4>Écarts de comptage</h4>${lignes(B.ecarts.slice(0, 12).map(x => [`${esc(x.nom)} · ${esc(x.qui)}, ${jourMois(x.date)}`, (x.ecart > 0 ? "+" : "−") + Math.abs(x.ecart).toLocaleString("fr-FR")]), "Aucun écart relevé.")}${B.ecarts.length > 12 ? `<p class="w-note">Et ${B.ecarts.length - 12} autres.</p>` : ""}</div></div>
    <p class="w-note" style="margin-top:10px">${pluriel(B.touches, "objet touché", "objets touchés")} sur ${B.total}${B.pertes ? ` · ${B.pertes.toLocaleString("fr-FR")} perdu${B.pertes > 1 ? "s" : ""} ou cassé${B.pertes > 1 ? "s" : ""}` : ""}. Un comptage juste ne laisse pas de ligne : seuls les écarts apparaissent.</p>` : `<p class="w-note" style="margin-top:6px">Le prospect n'a enregistré aucun geste.</p>`}`;
  }
  const change = e.envoyeLe && paquetEssaiP(c, "").id !== e.id;
  return `<section class="w w-l"><div class="w-entete"><h3 class="w-titre">${I.partager}Son essai</h3></div>
    <p style="margin:0 0 4px">${e.envoyeLe ? `Démo envoyée le ${jour(e.envoyeLe)} (${pluriel(e.n, "article")})${e.fin ? `, essai prévu jusqu'au ${dateCourteFr(e.fin)}` : ", sans date de fin"}.${change ? " <b>Sa liste ou le réglage de son appli a changé depuis : renvoyez-lui sa démo.</b>" : ""}` : "Sa démo n'a pas encore été envoyée."}</p>
    <p class="w-note" style="margin-bottom:12px">Le prospect ouvre sa démo sur son téléphone, avec ses articles. À la fin de l'essai, il touche « Envoyer mon essai » sur l'écran de connexion de sa démo : ses gestes vous reviennent par un lien ou par un fichier.</p>
    <div class="boutons"><button class="btn petit ${r ? "" : "plein"}" data-envoi-p="${c.id}">${I.partager}Envoyer sa démo</button><label class="btn petit">Ouvrir son essai<input type="file" class="cache" accept=".json,.txt,application/json,text/plain" data-retour-p="${c.id}"></label>${r ? `<button class="btn petit rouge" data-retour-retirer-p="${c.id}">Retirer cet essai</button>` : ""}</div>${bilan}</section>`;
}

function brancherListeP() {
  if (vueE.nom === "etiquettes") { dessinerQrP(); brancherEtiqP(); }
  $$("[data-liste-fichier]").forEach(i => i.onchange = async () => {
    const f = i.files[0], id = i.dataset.listeFichier; if (!f) return; i.value = "";
    try {
      if (/\.xlsx$/i.test(f.name)) {
        const feuilles = await lireXlsxP(await f.arrayBuffer()), fe = choisirFeuilleP(feuilles);
        if (!fe) return toast("Ce classeur n'a aucun onglet lisible.");
        // L'onglet facultatif « Vos lieux » : nom et type, à partir de la ligne 3
        const fl = feuilles.find(x => normP(x.nom) === "vos lieux");
        lancerRelectureP(id, fe.lignes, `Fichier ${f.name}, onglet « ${fe.nom} »`, fl ? fl.lignes.slice(1).filter(l => l && texteP(l[0]) && !/^\((obligatoire|facultatif)\)/i.test(texteP(l[0]))).slice(0, 200).map(l => ({ nom: texteP(l[0]).slice(0, 40), type: texteP(l[1]).slice(0, 20) })) : []);
      } else lancerRelectureP(id, lireCollageP(await f.text()), `Fichier ${f.name}`);
    } catch (e) {
      toast(e && e.message === "deflate" ? "Ce navigateur ne sait pas ouvrir ce fichier : collez plutôt les cellules." : /\.xls$/i.test(f.name) ? "Ancien format .xls : enregistrez-le en .xlsx, ou collez les cellules." : "Ce fichier ne se lit pas : collez plutôt les cellules.");
    }
  });
  $$("[data-liste-coller]").forEach(b => b.onclick = () => {
    const t = $("[data-liste-collage]").value;
    if (!t.trim()) return toast("Collez d'abord les cellules copiées.");
    lancerRelectureP(b.dataset.listeColler, lireCollageP(t), "Cellules collées");
  });
  $$("[data-liste-annuler]").forEach(b => b.onclick = () => { relectureP = null; rendre(); toast("Rien n'a été enregistré."); });
  $$("[data-liste-valider]").forEach(b => b.onclick = () => {
    const c = clientP(relectureP.id), r = relectureP[b.dataset.listeValider], avant = c.liste ? c.liste.articles.length : 0;
    c.liste = { le: Date.now(), articles: r.articles }; synchroLieuxP(c, relectureP.lieux); relectureP = null; sauverP(); rendre(); window.scrollTo(0, 0);
    toast(b.dataset.listeValider === "ajouter" ? `${pluriel(r.articles.length - avant, "article")} ajouté${r.articles.length - avant > 1 ? "s" : ""} : la liste en compte ${r.articles.length}.` : `Liste enregistrée : ${pluriel(r.articles.length, "article")}.`);
  });
  $$("[data-liste-retirer]").forEach(b => b.onclick = () => {
    const c = clientP(b.dataset.listeRetirer);
    if (!confirm(`Retirer la liste de ${c.nom} (${pluriel(c.liste.articles.length, "article")}) ? Ses étiquettes et son classeur ne pourront plus être produits sans la réimporter.`)) return;
    delete c.liste; sauverP(); rendre(); toast("Liste retirée.");
  });
  $$("[data-classeur-p]").forEach(b => b.onclick = () => exporterClasseurP(clientP(b.dataset.classeurP)));
  brancherLieuxP();
  // Envoyer sa démo au prospect, ouvrir l'essai qu'il renvoie
  $$("[data-envoi-p]").forEach(b => b.onclick = () => feuilleEnvoiP(b.dataset.envoiP));
  $$("[data-retour-p]").forEach(i => i.onchange = () => {
    const f = i.files[0], id = i.dataset.retourP; i.value = ""; if (!f) return;
    const l = new FileReader();
    l.onerror = () => toast("Ce fichier ne se lit pas.");
    l.onload = () => { let o; try { o = JSON.parse(l.result); } catch (e) { return toast("Ce fichier n'est pas un essai Stockclair."); } recevoirRetourP(o, id); };
    l.readAsText(f);
  });
  $$("[data-retour-retirer-p]").forEach(b => b.onclick = () => {
    const c = clientP(b.dataset.retourRetirerP);
    if (!confirm(`Retirer de la fiche l'essai renvoyé par ${c.nom} ? La date d'envoi de sa démo est gardée.`)) return;
    delete c.essai.retour; sauverP(); rendre(); toast("Essai retiré de la fiche.");
  });
}

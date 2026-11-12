"use strict";
/* Mon espace : la liste d'articles d'un client.
   Le client remplit un tableur (modeles/07_Liste_articles_a_remplir.xlsx) ; on l'importe ici d'un coup, par le fichier ou par un collage,
   après une relecture qui dit ce qui cloche. La liste vit dans la fiche du client (donc dans la sauvegarde de Mon espace).
   Elle sert à trois choses : charger la démo avec ses objets (« Régler son appli »), sortir ses étiquettes, et produire
   les onglets à coller dans son classeur. Rien n'est lu ni écrit ailleurs que dans le navigateur. Chargé après espace.js, avant app.js. */

const LISTE_MAX = 5000; // lignes lues au plus ; les codes vont de ART-0001 à ART-9999
// Titres reconnus, dans l'ordre où on les essaie (le premier qui convient gagne). Les titres sont comparés sans accents ni majuscules.
// Ils couvrent le modèle à remplir, l'onglet ARTICLES du classeur livré, et les mots courants d'un tableau de patron.
const COLONNES_LISTE = [
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
const ORDRE_MODELE = ["nom", "qte", "emp", "logique", "categorie", "unite", "prix", "fou", "seuil", "cible", "cond", "serie", "suivi", "lotNum", "dlc", "code"];
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
  const utiles = feuilles.filter(f => !/mode d emploi|exemple|lisez moi|dictionnaire|parametre/.test(normP(f.nom)));
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
  articles.forEach(a => { if (a.serie) series[normP(a.serie)] = "liste"; else noms[normP(a.nom)] = { a, n: "liste" }; if (a.code) codes[normP(a.code)] = "liste"; });
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
    // Doublons : deux objets uniques peuvent porter le même nom, deux lots du même produit s'ajoutent, le reste est un doublon
    const cle = normP(nom), deja = !serie && noms[cle];
    if (deja) {
      const memeLot = dlc && deja.a.suiviLots && deja.a.lots.some(l => l.dlc === dlc && l.num === lotNum);
      if (memeLot && deja.n !== "liste") return err(`Doublon de la ligne ${deja.n} : même nom, même lot, même date limite.`);
      if (dlc && deja.a.suiviLots && !memeLot) { deja.a.lots.push({ num: lotNum, dlc, qte }); deja.a.qte += qte; bonnes++; return; }
      if (deja.n === "liste") { dejaLa++; return; }
      return err(`Doublon de la ligne ${deja.n} : même nom. Garder une seule ligne${dlc || deja.a.suiviLots ? ", ou donner une date limite aux deux pour en faire deux lots" : ""}.`);
    }
    const code = texteP(v.code).slice(0, 30);
    if (code && codes[normP(code)]) rem(`Votre code « ${code} » est déjà porté par ${codes[normP(code)] === "liste" ? "un article de la liste" : "la ligne " + codes[normP(code)]}.`);
    if (brutQte === "" && !serie) rem("Quantité vide : comptée 0.");
    const cible = cibleLue !== null && cibleLue >= 1 ? cibleLue : Math.max(1, qte);
    let seuil = seuilLu !== null ? seuilLu : serie || logique === "pret" ? 0 : Math.min(cible, Math.ceil(qte * .2));
    if (seuil > cible) { rem(`Seuil d'alerte (${seuil}) au-dessus de la quantité à avoir (${cible}) : seuil ramené à ${cible}.`); seuil = cible; }
    const a = { nom, qte, emp: texteP(v.emp).slice(0, 50) || EMP_DEFAUT, logique, categorie: texteP(v.categorie).slice(0, 40), unite: texteP(v.unite).slice(0, 20), prix: prix === null ? 0 : prix, fou: texteP(v.fou).slice(0, 60) || FOU_DEFAUT,
      seuil, cible, lot: cond || 1, serie, suiviLots: !!dlc, lots: dlc ? [{ num: lotNum, dlc, qte }] : [], code };
    articles.push(a); bonnes++;
    if (serie) series[normP(serie)] = n; else noms[cle] = { a, n };
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
  const entree = (article, qte, extra) => { if (qte > 0) mouvements.push(Object.assign({ id: "MV-" + String(++nMv).padStart(5, "0"), date: le, profil: "bureau", qui: "Installation", article, type: "Inventaire initial", qte, evenement: "", motif: "Stock de départ", refac: false }, extra)); };
  const articles = L.map((x, i) => {
    const id = "ART-" + String(i + 1).padStart(4, "0"), premiere = x.lots.map(l => l.dlc).sort()[0];
    if (x.suiviLots) x.lots.forEach(l => entree(id, l.qte, { dlc: l.dlc, lotNum: l.num, motif: "Stock de départ" + (l.num ? " · lot " + l.num : "") })); else entree(id, x.qte);
    return Object.assign({ id, nom: x.nom + (x.code ? " · réf. " + x.code : ""), img: "", logique: x.logique, type: x.serie ? "equip" : "conso", unite: x.unite, emp: idDe(emplacements, x.emp, "EMP-"), seuil: x.seuil, cible: x.cible,
      prix: sn ? x.prix / EUR_XOF : x.prix, lot: x.lot, fou: idDe(fournisseurs, x.fou, "FOU-", { delai: 7 }), jour: 0, categorie: x.categorie },
      x.serie ? { serie: x.serie } : {},
      // Date proposée à la prochaine réception : la durée qui restait au lot de départ, à corriger à chaque livraison
      x.suiviLots ? { dlcJours: Math.max(1, Math.round((new Date(premiere + "T12:00:00").getTime() - le) / 86400000)) } : {});
  });
  return { articles, emplacements, fournisseurs, mouvements };
}
// Charge la démo avec les objets du client, à la place des objets de démonstration du métier. Pas d'historique inventé :
// seul le stock de départ est écrit, à la date de l'import. Rend vrai si la démo a été rechargée.
function chargerListeP(c) {
  const garder = { monnaie: S.monnaie, reglages: S.reglages };
  if (!c.liste || !c.liste.articles.length) {
    if (!S.listeDe) return false;
    S = Object.assign(construireDemo(c.metier), garder); return true; // la démo portait la liste d'un autre client
  }
  const marque = [c.id, c.liste.le, c.liste.articles.length].join("|");
  if (S.listeDe === marque) return false;
  const b = construireListeP(c), neuf = Object.assign(construireDemo(c.metier), garder);
  Object.assign(neuf, { articles: b.articles, emplacements: b.emplacements, fournisseurs: b.fournisseurs, mouvements: b.mouvements, kits: [], reservations: [], commandes: [], bons: [], alertes: [], messages: [], clientsLoc: [], clientsEv: {}, infosEv: {}, interventions: [] });
  neuf.suiviLots = b.articles.some(a => a.dlcJours); // au moins un article à date limite : le suivi par lots s'allume pour ce client
  neuf.listeDe = marque;
  S = neuf; return true;
}
function resumeListeP(c) {
  const L = c.liste.articles, b = construireListeP(c);
  return { n: L.length, emp: b.emplacements.length, fou: b.fournisseurs.filter(f => f.nom !== FOU_DEFAUT).length, prets: L.filter(a => a.logique === "pret").length, series: L.filter(a => a.serie).length, consos: L.filter(a => a.logique !== "pret").length, lots: L.filter(a => a.suiviLots).length, cond: L.filter(a => a.lot > 1).length };
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
const ETIQ_MAX = 60, ETIQ_PAR_PAGE = 24; // exemplaires au plus pour un même article ; 3 colonnes de 8 sur une page A4
function etiquettesListeP(c) {
  const b = construireListeP(c), L = c.liste.articles, l = [];
  const emps = b.emplacements.slice().sort((x, y) => x.nom.localeCompare(y.nom, "fr", { numeric: true }));
  emps.forEach(e => {
    l.push({ type: "emp", id: e.id, nom: e.nom, sous: "Emplacement", n: 1 });
    b.articles.forEach((a, i) => {
      if (a.emp !== e.id) return;
      const p = planListeP(L[i], c), n = Math.min(ETIQ_MAX, p.n);
      l.push({ type: p.sur, id: a.id, nom: a.nom, sous: a.serie ? "N° de série " + a.serie : p.sur === "contenant" ? `Par ${L[i].lot}` : p.sur === "emplacement" ? "Sur le bac ou l'étagère" : "", n, coupe: p.n > ETIQ_MAX ? p.n : 0 });
    });
  });
  return l;
}
function eEtiquettesP(id) {
  const c = clientP(id); if (!c || !c.liste) return eClient(id);
  const l = etiquettesListeP(c), total = l.reduce((t, x) => t + x.n, 0), compte = k => l.filter(x => x.type === k).reduce((t, x) => t + x.n, 0), coupes = l.filter(x => x.coupe);
  return `<div class="pas-imprimer"><h1>Étiquettes · ${esc(c.nom)}</h1>
    <p class="sous">${pluriel(total, "étiquette")}, rangées par emplacement : ${[[compte("emp"), "d'emplacement"], [compte("objet"), "à poser sur l'objet"], [compte("contenant"), "sur le chariot, le casier ou le carton"], [compte("emplacement"), "sur le bac ou l'étagère"]].filter(x => x[0]).map(x => x.join(" ")).join(", ")}. Environ ${pluriel(Math.ceil(total / ETIQ_PAR_PAGE), "page")} A4, ${ETIQ_PAR_PAGE} étiquettes par page.</p>
    <div class="boutons" style="margin-bottom:12px"><button class="btn petit plein" data-act="imprimer">${I.imprimer}Imprimer ou enregistrer en PDF</button><button class="btn petit" data-e="liste" data-earg="${c.id}">Sa liste</button><button class="btn petit" data-e="client" data-earg="${c.id}">Fiche du client</button></div>
    <p class="w-note">Le QR contient le code seul (ART-0001, EMP-01), comme dans le classeur du client : il se lit avec le bouton Scanner de l'appli. Un objet unique a une étiquette ; un objet prêté en plusieurs exemplaires en a une par exemplaire ou par contenant ; un consommable en a une, pour son bac ou son étagère.${coupes.length ? ` Au plus ${ETIQ_MAX} exemplaires par article : ${coupes.length > 1 ? coupes.length + " articles en demandent" : esc(coupes[0].nom) + " en demande"} davantage, à réimprimer au besoin.` : ""} Support de chaque étiquette : docs/21.</p></div>
  <div class="planche planche-p">${l.map(x => { const une = `<div class="etiquette ${x.type === "emp" ? "etiq-emp" : ""}"><div data-qr-p="${x.id}"></div><div><b>${esc(x.nom)}</b><span class="code">${x.id}</span>${x.sous ? `<small class="proprio">${esc(x.sous)}</small>` : ""}<small class="proprio">Propriété de ${esc(c.nom)}</small></div></div>`; return x.n > 1 ? une.repeat(x.n) : une; }).join("")}</div>`;
}
// Les QR se dessinent par paquets, pour qu'une planche de plusieurs centaines d'étiquettes ne fige pas l'écran
async function dessinerQrP() {
  const cases = [...$$("[data-qr-p]")]; if (!cases.length) return;
  try { await script("lib/qrcode.js"); } catch (e) { cases.forEach(c => { c.textContent = "QR indisponible hors ligne"; }); return; }
  const faits = {};
  for (let i = 0; i < cases.length; i += 120) {
    cases.slice(i, i + 120).forEach(c => { const k = c.dataset.qrP; if (!faits[k]) { const q = window.qrcode(0, "M"); q.addData(k); q.make(); faits[k] = q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); } c.innerHTML = faits[k]; });
    await new Promise(r => setTimeout(r, 0));
  }
  document.body.dataset.qrPrets = String(cases.length);
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
function lancerRelectureP(id, lignes, source) {
  const c = clientP(id), p = preparerLignesP(lignes);
  if (!p.brutes.length) return toast("Aucune ligne à lire : le fichier ou le collage est vide.");
  relectureP = { id, source, colonnes: p.colonnes, inconnues: p.inconnues, sansTitres: p.sansTitres, remplacer: controlerListeP(p.brutes, c, []), ajouter: c.liste ? controlerListeP(p.brutes, c, c.liste.articles) : null };
  rendre();
  const z = $("[data-relecture-p]"); if (z) z.scrollIntoView({ block: "start" });
}
function blocListeP(c) {
  if (!c.liste) return `<p class="vide" style="padding:6px 0 12px">Pas encore de liste. Le client remplit le modèle, ou envoie son propre tableau.</p>`;
  const r = resumeListeP(c);
  return `<p style="margin:0 0 4px"><b>${pluriel(r.n, "article")}</b> dans ${pluriel(r.emp, "emplacement")}${r.fou ? `, ${pluriel(r.fou, "fournisseur")}` : ""}. Importée le ${new Date(c.liste.le).toLocaleDateString("fr-FR")}.</p>
    <p class="w-note" style="margin-bottom:12px">${[[r.prets, "prêté", "prêtés"], [r.series, "avec numéro de série", "avec numéro de série"], [r.consos, "consommé", "consommés"], [r.lots, "suivi par lots et dates limites", "suivis par lots et dates limites"], [r.cond, "avec un conditionnement", "avec un conditionnement"]].filter(x => x[0]).map(([n, a, b]) => `${n} ${n > 1 ? b : a}`).join(" · ")}</p>`;
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
      <p class="w-note">Ce qui sera créé : ${pluriel(crees.articles.length, "article")} (${r.articles.filter(x => x.logique === "pret").length} prêtés dont ${r.articles.filter(x => x.serie).length} avec numéro de série, ${r.articles.filter(x => x.logique !== "pret").length} consommés dont ${r.articles.filter(x => x.suiviLots).length} suivis par lots), ${pluriel(nEmp, "emplacement")}, ${pluriel(nFou, "fournisseur")}.</p>
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
    ${c.liste ? `<div class="boutons">${boutonsListeP(c)}<button class="btn petit" data-regler-p="${c.id}">${I.reglages}Régler son appli</button><button class="btn petit rouge" data-liste-retirer="${c.id}">Retirer la liste</button></div>` : ""}</div>
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
    ${blocListeP(c)}<div class="boutons"><button class="btn petit ${c.liste ? "" : "plein"}" data-e="liste" data-earg="${c.id}">${I.excel}Importer sa liste</button>${c.liste ? boutonsListeP(c) : ""}</div></section>`;
}

function brancherListeP() {
  if (vueE.nom === "etiquettes") dessinerQrP();
  $$("[data-liste-fichier]").forEach(i => i.onchange = async () => {
    const f = i.files[0], id = i.dataset.listeFichier; if (!f) return; i.value = "";
    try {
      if (/\.xlsx$/i.test(f.name)) {
        const feuilles = await lireXlsxP(await f.arrayBuffer()), fe = choisirFeuilleP(feuilles);
        if (!fe) return toast("Ce classeur n'a aucun onglet lisible.");
        lancerRelectureP(id, fe.lignes, `Fichier ${f.name}, onglet « ${fe.nom} »`);
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
    c.liste = { le: Date.now(), articles: r.articles }; relectureP = null; sauverP(); rendre(); window.scrollTo(0, 0);
    toast(b.dataset.listeValider === "ajouter" ? `${pluriel(r.articles.length - avant, "article")} ajouté${r.articles.length - avant > 1 ? "s" : ""} : la liste en compte ${r.articles.length}.` : `Liste enregistrée : ${pluriel(r.articles.length, "article")}.`);
  });
  $$("[data-liste-retirer]").forEach(b => b.onclick = () => {
    const c = clientP(b.dataset.listeRetirer);
    if (!confirm(`Retirer la liste de ${c.nom} (${pluriel(c.liste.articles.length, "article")}) ? Ses étiquettes et son classeur ne pourront plus être produits sans la réimporter.`)) return;
    delete c.liste; sauverP(); rendre(); toast("Liste retirée.");
  });
  $$("[data-classeur-p]").forEach(b => b.onclick = () => exporterClasseurP(clientP(b.dataset.classeurP)));
}

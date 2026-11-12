"use strict";
/* La démo d'essai du prospect : sa démo « à ses noms », ouverte sur son propre appareil, sans compte et sans serveur.
   L'installateur la prépare dans Mon espace (liste.js, « Envoyer sa démo ») sous deux formes : un lien dont les données
   sont dans le fragment de l'adresse (après #, donc jamais transmises à un serveur), ou un fichier à ouvrir depuis l'écran de connexion.
   Ici : ouvrir le lien ou le fichier, afficher le bandeau, remettre à zéro sur ses articles, revenir à la démo générale,
   et renvoyer ses gestes d'essai (« Envoyer mon essai »). Tout reste dans le navigateur. Chargé après app.js. */

const CLE_ESSAI = "rayon-essai-v1";
const ADRESSE_DEMO = "https://nexuxstelar.github.io/rayon-demo-publique/";
// Taille maximale d'un lien, adresse comprise. Au-delà, on passe par le fichier : un lien plus long se colle mal
// dans un message, et certains logiciels de courrier le coupent.
const LIEN_ESSAI_MAX = 4000;
const MEL_ESSAI_MAX = 1900; // au-delà, un lien « mailto: » n'est plus ouvert par tous les logiciels de courrier
const COLONNES_GESTES = ["id", "date", "qui", "role", "article", "type", "qte", "lieu", "motif", "annule"];

/* ---------------- Coder et décoder : JSON, compressé, en lettres sûres pour une adresse ---------------- */
const adresseDemo = () => location.protocol === "https:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? location.origin + location.pathname.replace(/index\.html$/, "") : ADRESSE_DEMO;
async function coderEssai(objet) {
  if (typeof CompressionStream === "undefined") return null;
  const u8 = new Uint8Array(await new Response(new Blob([JSON.stringify(objet)]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());
  let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return "1." + btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function decoderEssai(texte) {
  const m = String(texte).match(/^1\.([A-Za-z0-9_-]+)$/);
  if (!m || typeof DecompressionStream === "undefined") throw new Error(m ? "navigateur" : "forme");
  const brut = atob(m[1].replace(/-/g, "+").replace(/_/g, "/")), u8 = new Uint8Array(brut.length);
  for (let i = 0; i < brut.length; i++) u8[i] = brut.charCodeAt(i);
  // Lecture bornée : un lien fabriqué exprès ne doit pas pouvoir remplir la mémoire
  const lecteur = new Blob([u8]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader(), morceaux = [];
  for (let total = 0; ;) { const { done, value } = await lecteur.read(); if (done) break; total += value.length; if (total > 6e6) { lecteur.cancel(); throw new Error("taille"); } morceaux.push(value); }
  return JSON.parse(await new Blob(morceaux).text());
}
const lienEssai = (genre, code) => adresseDemo() + (genre === "retour" ? "?installateur=1" : "") + "#" + genre + "=" + code;
const nomFichierEssai = (debut, nom) => `${debut}-${normP(nom).replace(/ /g, "-").slice(0, 30) || "essai"}.json`;
function telechargerEssai(nom, texte) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([texte], { type: "application/json" })); a.download = nom;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function copierEssai(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { prompt("Copiez ce lien :", t); return false; } }

/* Envoi d'un message qui porte le lien, ou qui accompagne le fichier. Sert aux deux côtés : l'installateur envoie la démo,
   le prospect renvoie son essai. o : { message, lien, fichier: { nom, texte }, tel, email, sujet }. Rend le texte à afficher. */
async function envoyerEssai(par, o) {
  const avecLien = l => o.message.includes("[lien]") ? o.message.replace("[lien]", l) : o.message + "\n\n" + l;
  const texte = o.lien ? avecLien(o.lien) : o.message.replace(/\n*\[lien\]\n*/, "\n\n");
  if (par === "fichier") { telechargerEssai(o.fichier.nom, o.fichier.texte); return `Fichier ${o.fichier.nom} enregistré dans vos téléchargements.`; }
  if (par === "copier") return (await copierEssai(o.lien)) ? "Lien copié." : "";
  if (par === "partager") {
    try {
      if (o.lien) await navigator.share({ text: texte });
      else {
        // Le partage du téléphone n'accepte pas tous les types de fichiers : on propose le .json, sinon le même contenu en .txt
        const essais = [new File([o.fichier.texte], o.fichier.nom, { type: "application/json" }), new File([o.fichier.texte], o.fichier.nom.replace(/\.json$/, ".txt"), { type: "text/plain" })];
        const f = essais.find(x => navigator.canShare && navigator.canShare({ files: [x] }));
        if (f) await navigator.share({ files: [f], text: texte });
        else { telechargerEssai(o.fichier.nom, o.fichier.texte); await navigator.share({ text: texte }); return `Fichier ${o.fichier.nom} enregistré : joignez-le au message.`; }
      }
    } catch (e) { return ""; /* partage annulé */ }
    return "Partage ouvert.";
  }
  if (par === "wa") {
    window.open(`https://wa.me/${o.tel || ""}?text=${encodeURIComponent(texte)}`, "_blank", "noopener");
    if (o.lien) return "WhatsApp ouvert avec le message.";
    telechargerEssai(o.fichier.nom, o.fichier.texte); return `Fichier ${o.fichier.nom} enregistré : joignez-le à la conversation WhatsApp.`;
  }
  // E-mail : le lien part dans le message s'il est assez court pour tous les logiciels de courrier ; sinon il est copié, à coller
  const mel = t => `mailto:${encodeURIComponent(o.email || "").replace(/%40/g, "@")}?subject=${encodeURIComponent(o.sujet)}&body=${encodeURIComponent(t)}`;
  if (!o.lien) { telechargerEssai(o.fichier.nom, o.fichier.texte); window.open(mel(texte), "_self"); return `Fichier ${o.fichier.nom} enregistré : joignez-le à l'e-mail.`; }
  if (mel(texte).length <= MEL_ESSAI_MAX) { window.open(mel(texte), "_self"); return "E-mail ouvert avec le message."; }
  await copierEssai(o.lien); window.open(mel(avecLien("(collez ici le lien : il vient d'être copié)")), "_self");
  return "Lien copié : collez-le dans l'e-mail qui vient de s'ouvrir.";
}

/* ---------------- Lire une démo d'essai reçue ---------------- */
// Ce qui vient d'un lien ou d'un fichier n'est pas sûr : chaque texte est nettoyé et borné, chaque nombre vérifié.
const texteSur = (v, max) => String(v === null || v === undefined ? "" : v).replace(/[<>]/g, "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const entierSur = (v, min, max) => { const n = Math.round(+v); return isFinite(n) ? Math.min(max, Math.max(min, n)) : min; };
function configSure(c, metierBase, taille) {
  const d = configParDefaut(metierBase, taille); if (!c || typeof c !== "object") return null;
  const blocs = l => Array.isArray(l) ? l.filter(x => Array.isArray(x) && WIDGETS[x[0]] && WIDGETS[x[0]].tailles.includes(x[1])).map(x => [x[0], x[1]]).slice(0, 40) : null;
  const r = {};
  for (const role of Object.keys(d)) {
    const x = c[role]; if (!x || typeof x !== "object") { r[role] = d[role]; continue; }
    const barre = Array.isArray(x.barre) ? x.barre.filter(k => typeof k === "string" && SECTIONS[k]).slice(0, 3) : null, accueil = blocs(x.accueil), analyses = blocs(x.analyses);
    if (!barre || !accueil || !analyses) { r[role] = d[role]; continue; }
    r[role] = { barre, accueil, analyses, droits: Object.fromEntries(Object.entries(x.droits && typeof x.droits === "object" ? x.droits : {}).filter(([k, v]) => /^[a-z]{1,20}$/.test(k) && v).map(([k]) => [k, 1])) };
  }
  return r;
}
// Rend la démo sous sa forme de travail, ou lève une erreur si ce n'est pas une démo d'essai
function lirePaquetEssai(o) {
  if (!o || o.type !== "stockclair-essai" || o.version !== 1 || !Array.isArray(o.articles)) throw new Error("forme");
  const metier = METIERS[o.metier] ? o.metier : "loueur", base = METIERS[metier].base || metier;
  const articles = o.articles.slice(0, 9999).filter(l => Array.isArray(l)).map(l => {
    const [nom, qte, emp, lg, categorie, unite, prix, fou, seuil, cible, lot, serie, lots, code] = l;
    const a = { nom: texteSur(nom, 80), qte: entierSur(qte, 0, 1e7), emp: texteSur(emp, 50) || EMP_DEFAUT, logique: lg === "pret" ? "pret" : "conso", categorie: texteSur(categorie, 40), unite: texteSur(unite, 20),
      prix: isFinite(+prix) && +prix > 0 ? Math.min(+prix, 1e9) : 0, fou: texteSur(fou, 60) || FOU_DEFAUT, seuil: entierSur(seuil, 0, 1e7), cible: entierSur(cible, 1, 1e7), lot: entierSur(lot, 1, 1e6), serie: texteSur(serie, 40),
      lots: (Array.isArray(lots) ? lots : []).filter(x => Array.isArray(x) && /^\d{4}-\d{2}-\d{2}$/.test(x[1])).slice(0, 50).map(x => ({ num: texteSur(x[0], 30), dlc: x[1], qte: entierSur(x[2], 0, 1e7) })), code: texteSur(code, 30) };
    if (a.serie) { a.logique = "pret"; a.qte = Math.min(1, a.qte); a.lots = []; }
    if (a.logique === "pret") a.lots = [];
    a.suiviLots = a.lots.length > 0; if (a.suiviLots) a.qte = a.lots.reduce((t, x) => t + x.qte, 0);
    return a;
  }).filter(a => a.nom);
  if (!articles.length) throw new Error("vide");
  const ap = o.appli && typeof o.appli === "object" ? o.appli : {}, taille = TAILLES_EQUIPE[ap.taille] ? ap.taille : "bureau";
  const c = o.contact && typeof o.contact === "object" ? { nom: texteSur(o.contact.nom, 60), email: /^[^\s<>"']+@[^\s<>"']+\.[^\s<>"']+$/.test(String(o.contact.email || "")) ? String(o.contact.email).slice(0, 80) : "" } : null;
  return { id: texteSur(o.id, 20).replace(/[^a-z0-9]/gi, "") || empreinteEssai(JSON.stringify(o.articles)), entreprise: texteSur(o.entreprise, 60) || "Votre entreprise", metier, monnaie: o.monnaie === "XOF" ? "XOF" : "EUR",
    modules: Object.keys(CATALOGUE).filter(k => Array.isArray(o.modules) && o.modules.includes(k)), taille, detail: ap.detail === "simple" ? "simple" : "complet", config: configSure(ap.config, base, taille),
    importeLe: isFinite(+o.importeLe) && +o.importeLe > 1e12 ? Math.min(+o.importeLe, Date.now()) : Date.now(), articles,
    fin: /^\d{4}-\d{2}-\d{2}$/.test(o.fin || "") ? o.fin : "", contact: c && (c.nom || c.email) ? c : null };
}
// L'état de départ de la démo d'essai : les objets du prospect, son stock de départ, son réglage. Aucun historique inventé.
function etatEssai(p) {
  const st = etatListeP({ id: "essai", nom: p.entreprise, metier: p.metier, pays: p.monnaie === "XOF" ? "SN" : "FR", liste: { le: p.importeLe, articles: p.articles } });
  Object.keys(CATALOGUE).forEach(k => { st.modules[k] = p.modules.includes(k); });
  st.taille = p.taille; st.detail = p.detail; st.config = p.config ? JSON.parse(JSON.stringify(p.config)) : configParDefaut(st.metier, st.taille);
  if (st.suiviLots) ["bureau", "direction"].forEach(r => { const cf = st.config[r]; if (cf && !cf.accueil.some(([k]) => k === "peremption")) cf.accueil.push(["peremption", "m"]); });
  st.entreprise = Object.assign({}, st.entreprise, { nom: p.entreprise }); st.monnaie = p.monnaie;
  st.monEssai = p.id; // la démo sait qu'elle porte un essai : remise à zéro, bandeau, retour
  return st;
}

/* ---------------- L'essai gardé sur cet appareil ---------------- */
// { brut : la démo telle qu'elle a été reçue, recuLe, etat : la démo d'essai mise de côté pendant qu'on regarde la démo générale }
let E_ = (() => { try { const e = JSON.parse(localStorage.getItem(CLE_ESSAI)); lirePaquetEssai(e.brut); return e; } catch (x) { return null; } })();
let paquetLu = null;
const paquetEssai = () => { if (!E_) return null; if (!paquetLu || paquetLu.de !== E_.brut) paquetLu = { de: E_.brut, p: lirePaquetEssai(E_.brut) }; return paquetLu.p; };
const essaiActif = () => !!(E_ && S.monEssai && S.monEssai === paquetEssai().id);
function ecrireEssai() {
  try { if (E_) localStorage.setItem(CLE_ESSAI, JSON.stringify(E_)); else localStorage.removeItem(CLE_ESSAI); return true; } catch (e) { return false; }
}
// Les gestes faits pendant l'essai : tout sauf le stock de départ écrit à l'ouverture
const gestesEssai = etat => ((etat || S).mouvements || []).filter(m => !(m.type === "Inventaire initial" && m.qui === "Installation"));
const versConnexion = () => { session = null; verrouille = false; installateur = false; clearTimeout(minuteur); msgConnexion = ""; vue = { nom: "accueil" }; pile = []; $$(".feuille").forEach(f => f.remove()); entree = true; rendre(); window.scrollTo(0, 0); };
// L'adresse ne garde pas ?metier=… quand la démo d'essai est ouverte : un rechargement doit la retrouver
function nettoyerAdresse() {
  const q = new URLSearchParams(location.search); q.delete("metier");
  history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : ""));
}
// Avant de montrer autre chose (un autre métier, la visite guidée), la démo d'essai est mise de côté avec ses gestes
function mettreEssaiDeCote() {
  if (!essaiActif()) return;
  E_.etat = S;
  if (!ecrireEssai()) { try { localStorage.removeItem(CLE); } catch (e) { /* stockage bloqué */ } ecrireEssai(); } // place : la démo d'essai n'est plus gardée deux fois
}
function reprendreEssai() {
  const p = paquetEssai(), garde = E_.etat && E_.etat.monEssai === p.id && E_.etat.version === SEED().version ? E_.etat : null;
  S = garde || etatEssai(p); delete E_.etat;
  try { localStorage.removeItem(CLE); } catch (e) { /* stockage bloqué */ }
  ecrireEssai(); sauver(); nettoyerAdresse(); versConnexion();
  toast(garde ? "Votre démo d'essai est rouverte, avec vos gestes." : "Votre démo d'essai est rouverte, avec vos articles de départ.");
}
function quitterEssai() {
  const m = paquetEssai().metier;
  mettreEssaiDeCote(); S = construireDemo(m); sauver(); versConnexion();
  toast("Démo générale. Votre démo d'essai est gardée : « Reprendre ma démo d'essai ».");
}
function retirerEssai() {
  const p = paquetEssai(), n = gestesEssai(essaiActif() ? S : E_.etat || { mouvements: [] }).length;
  if (!confirm(`Retirer de cet appareil la démo d'essai « ${p.entreprise} »${n ? ` et ses ${n} gestes` : ""} ? Vous pourrez la rouvrir avec le lien ou le fichier reçu, sans vos gestes.`)) return;
  if (essaiActif()) { S = construireDemo(p.metier); sauver(); }
  E_ = null; ecrireEssai(); versConnexion(); toast("Démo d'essai retirée de cet appareil.");
}
// Une démo arrive par le lien ou par le fichier
function recevoirEssai(o) {
  let p; try { p = lirePaquetEssai(o); } catch (e) { return toast("Ce n'est pas une démo d'essai Stockclair : demandez le lien ou le fichier à la personne qui vous accompagne."); }
  if (E_ && paquetEssai().id === p.id) {
    // La même démo, rouverte : les gestes déjà faits sont gardés ; la date de fin et le contact suivent le dernier envoi
    E_.brut = o;
    if (!essaiActif()) return reprendreEssai();
    ecrireEssai(); nettoyerAdresse(); versConnexion();
    return toast("Votre démo d'essai est déjà sur cet appareil : vos gestes sont gardés.");
  }
  if (E_) {
    const avant = paquetEssai(), n = gestesEssai(essaiActif() ? S : E_.etat || { mouvements: [] }).length;
    if (!confirm(`Une démo d'essai est déjà sur cet appareil (${avant.entreprise}${n ? `, ${n} gestes` : ""}). La remplacer par « ${p.entreprise} » ?`)) return;
  }
  E_ = { brut: o, recuLe: Date.now() }; S = etatEssai(p);
  try { localStorage.removeItem(CLE); } catch (e) { /* stockage bloqué */ }
  const garde = ecrireEssai(); sauver(); nettoyerAdresse(); versConnexion();
  toast(garde ? `Votre démo d'essai est prête : ${pluriel(p.articles.length, "article")}.` : "Votre démo d'essai est ouverte, mais cet appareil ne peut pas la garder : elle disparaîtra à la fermeture de la page.");
}
function ouvrirFichierEssai(fichier) {
  const l = new FileReader();
  l.onerror = () => toast("Ce fichier ne se lit pas.");
  l.onload = () => {
    let o; try { o = JSON.parse(l.result); } catch (e) { return toast("Ce fichier n'est pas une démo d'essai Stockclair."); }
    if (o && o.type === "stockclair-essai-retour") return toast("Ce fichier contient un essai à renvoyer, pas une démo : il est destiné à la personne qui vous accompagne.");
    recevoirEssai(o);
  };
  l.readAsText(fichier);
}
// Lien ouvert : les données sont dans le fragment de l'adresse, qui est aussitôt retiré de la barre d'adresse
async function ouvrirLienEssai() {
  const m = location.hash.match(/^#(essai|retour)=(.+)$/); if (!m) return;
  history.replaceState(null, "", location.pathname + location.search);
  let o; try { o = await decoderEssai(m[2]); }
  catch (e) { return toast(e && e.message === "navigateur" ? "Ce navigateur ne sait pas ouvrir ce lien : demandez le fichier, ou essayez avec un navigateur plus récent." : "Ce lien est incomplet : il a peut-être été coupé à l'envoi. Demandez le fichier."); }
  if (m[1] === "essai") return recevoirEssai(o);
  // L'essai renvoyé par un prospect ne s'ouvre que dans Mon espace
  if (ESPACE && typeof recevoirRetourP === "function") recevoirRetourP(o);
  else toast("Ce lien porte un essai à renvoyer : il s'ouvre chez la personne qui vous accompagne.");
}

/* ---------------- Ce que le prospect renvoie ---------------- */
function retourEssai() {
  const p = paquetEssai(), g = gestesEssai(), noms = {};
  g.forEach(m => { const a = art(m.article); if (a) noms[m.article] = a.nom; });
  return { type: "stockclair-essai-retour", version: 1, id: p.id, entreprise: p.entreprise, ouvertLe: E_.recuLe, envoyeLe: Date.now(), articles: S.articles.length, colonnes: COLONNES_GESTES,
    gestes: g.map(m => { const l = [m.id, m.date, m.qui || "", m.profil || "", m.article, m.type, m.qte, m.evenement || m.imputation || "", m.motif || "", m.annule || ""]; while (l[l.length - 1] === "") l.pop(); return l; }), noms };
}
async function feuilleRetourEssai() {
  const p = paquetEssai(), g = gestesEssai(), r = retourEssai(), fichier = { nom: nomFichierEssai("mon-essai-stockclair", p.entreprise), texte: JSON.stringify(r) };
  const compte = t => g.filter(m => t.includes(m.type) && !m.annule).length, detail = [[compte(["Prêt", "Sortie"]), "sortie"], [compte(["Retour"]), "retour"], [compte(["Ajustement"]), "comptage avec écart", "comptages avec écart"], [compte(["Perte"]), "perte"], [compte(["Entrée"]), "entrée"]].filter(x => x[0]).map(x => pluriel(...x)).join(", ");
  let lien = "";
  if (g.length) { const code = await coderEssai(r).catch(() => null), l = code ? lienEssai("retour", code) : ""; if (l && l.length <= LIEN_ESSAI_MAX) lien = l; }
  const prenom = p.contact && p.contact.nom ? " " + p.contact.nom.split(/\s+/)[0] : "";
  const message = `Bonjour${prenom},\n\nVoici mon essai Stockclair pour ${p.entreprise} : ${pluriel(g.length, "geste")}${lien ? ".\n\n[lien]" : ", dans le fichier joint."}\n\nCordialement`;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tee" class="saisie-p"><h1 id="tee" style="font-size:26px">Envoyer mon essai</h1>
    <p class="sous">${g.length ? `Depuis le ${new Date(E_.recuLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}, vous avez enregistré ${pluriel(g.length, "geste")}${detail ? " : " + detail : ""}.` : "Vous n'avez encore enregistré aucun geste. Entrez avec un compte, scannez ou cherchez un objet, sortez-le ou comptez-le : votre essai se remplit tout seul."}</p>
    ${g.length ? `<p class="w-note">Ce qui part : la liste de vos gestes (date, personne, objet, quantité, destination), et rien d'autre. Rien ne part tout seul : c'est vous qui l'envoyez${p.contact ? `, à ${esc(p.contact.nom || p.contact.email)}` : ""}. ${lien ? "" : "Vos gestes sont trop nombreux pour un lien : ils partent dans un fichier, à joindre au message."}</p>
    <label class="champ">Message<textarea name="m" rows="6" maxlength="1200">${esc(message)}</textarea>${lien ? `<small>« [lien] » est remplacé par le lien de votre essai à l'envoi.</small>` : ""}</label>
    <div class="boutons essai-envois">${navigator.share ? `<button class="btn petit plein" data-par="partager">${I.partager}Partager</button>` : ""}<button class="btn petit ${navigator.share ? "" : "plein"}" data-par="wa">WhatsApp</button><button class="btn petit" data-par="mel">E-mail</button>${lien ? `<button class="btn petit" data-par="copier">Copier le lien</button>` : ""}<button class="btn petit" data-par="fichier">Télécharger le fichier</button></div>` : ""}
    <div class="valider" style="grid-template-columns:1fr"><button class="btn" data-x>Fermer</button></div>
    <p class="essai-retirer"><button class="lien" data-retirer>Retirer ma démo d'essai de cet appareil</button></p></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-retirer]").onclick = () => { f.remove(); retirerEssai(); };
  f.querySelectorAll("[data-par]").forEach(b => b.onclick = async () => {
    const m = f.querySelector("[name=m]").value.trim(); if (!m) return toast("Le message est vide.");
    const t = await envoyerEssai(b.dataset.par, { message: m, lien, fichier, email: p.contact ? p.contact.email : "", sujet: `Mon essai Stockclair · ${p.entreprise}` });
    if (t) toast(t);
  });
}

/* ---------------- Ce qui s'affiche chez le prospect ---------------- */
function finEssai(p) {
  if (!p.fin) return null;
  const j = Math.round((new Date(p.fin + "T12:00:00") - new Date(aujourdHui() + "T12:00:00")) / JOUR_MS), court = new Date(p.fin + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return { passee: j < 0, court: j < 0 ? `essai terminé le ${court}` : `essai jusqu'au ${court}`,
    phrase: j < 0 ? `L'essai prévu s'est terminé le ${dateLongue(p.fin)}. Rien n'est bloqué : votre démo fonctionne toujours.` : j === 0 ? "L'essai prévu se termine aujourd'hui. Rien ne se bloquera ensuite." : `Essai prévu jusqu'au ${dateLongue(p.fin)} : encore ${pluriel(j, "jour")}. Rien ne se bloquera ensuite.` };
}
// Appelé après chaque affichage (depuis brancherEspace) : habille l'écran sans toucher à la démo d'un visiteur ordinaire
function brancherEssai() {
  const actif = essaiActif(), p = actif ? paquetEssai() : null, fin = p && finEssai(p);
  const bande = $("#racine .demo");
  if (actif && bande && !$("#racine .app.espace")) bande.textContent = "Votre démo d'essai · vos articles · rien n'est envoyé" + (fin ? " · " + fin.court : "");
  const co = $("#racine .connexion"), form = co && co.querySelector('[data-form="connexion"]');
  if (!form) return;
  const pied = co.querySelector(".c-pied") || co, ligne = document.createElement("p"); ligne.className = "essai-pied";
  if (actif) {
    const c = p.contact, b = document.createElement("section"); b.className = "essai-bandeau"; b.setAttribute("aria-label", "Votre démo d'essai");
    b.innerHTML = `<h2>Votre démo d'essai, avec vos articles</h2>
      <p>${esc(p.entreprise)} : ${pluriel(p.articles.length, "article")}, avec votre stock de départ. Tout ce que vous faites ici reste sur cet appareil : rien n'est envoyé, à personne.</p>
      ${fin ? `<p>${esc(fin.phrase)}</p>` : ""}
      ${c ? `<p>${fin && fin.passee ? "Pour faire le point" : "Une question"} : ${esc(c.nom)}${c.email ? `${c.nom ? ", " : ""}<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ""}.</p>` : ""}
      <div class="boutons"><button type="button" class="btn petit ${fin && fin.passee ? "plein" : ""}" data-essai="envoyer">${I.partager}Envoyer mon essai</button></div>`;
    const barre = co.querySelector(".barre"); if (barre) barre.after(b); else co.prepend(b);
    co.classList.add("en-essai");
    const sous = co.querySelector(".c-tete .sous"); if (sous) sous.textContent = "Touchez un compte de démonstration ci-dessous pour entrer, sans rien taper.";
    // La visite guidée et le choix d'un métier montrent la démo générale : ils laissent la place au retour vers elle
    const tour = pied.querySelector('[data-act="tour"]'); if (tour) tour.remove();
    const metiers = pied.querySelector('[data-act="metiers"]'); if (metiers && metiers.closest("p")) metiers.closest("p").remove();
    ligne.innerHTML = `Démo d'essai : <b>${esc(p.entreprise)}</b> · <button type="button" class="lien" data-essai="quitter">Revenir à la démo générale</button>`;
    const zero = pied.querySelector('[data-act="reinit"]');
    if (zero && zero.closest("p")) zero.closest("p").before(ligne); else pied.appendChild(ligne);
  } else {
    ligne.innerHTML = `${E_ ? `<button type="button" class="lien" data-essai="reprendre">Reprendre ma démo d'essai</button> · ` : ""}<button type="button" class="lien" data-essai="ouvrir">${E_ ? "Ouvrir un autre fichier" : "Ouvrir ma démo d'essai"}</button><input type="file" class="cache" accept=".json,.txt,application/json,text/plain" data-essai-fichier tabindex="-1" aria-label="Fichier de ma démo d'essai">`;
    pied.appendChild(ligne);
  }
  const actions = { envoyer: feuilleRetourEssai, quitter: quitterEssai, reprendre: reprendreEssai, ouvrir: () => co.querySelector("[data-essai-fichier]").click() };
  co.querySelectorAll("[data-essai]").forEach(b => b.onclick = () => actions[b.dataset.essai]());
  const champ = co.querySelector("[data-essai-fichier]"); if (champ) champ.onchange = () => { if (champ.files[0]) ouvrirFichierEssai(champ.files[0]); champ.value = ""; };
}

/* ---------------- Démarrage ---------------- */
(function () {
  // « Remettre la démo à zéro » revient aux articles du prospect, pas à ceux du métier
  const zeroGeneral = ACTIONS.reinit;
  ACTIONS.reinit = () => {
    if (!essaiActif()) return zeroGeneral();
    if (!confirm("Revenir à vos articles et à votre stock de départ ? Les gestes faits pendant l'essai seront effacés de cet appareil.")) return;
    S = etatEssai(paquetEssai()); sauver(); versConnexion(); toast("Démo remise à zéro : vos articles, votre stock de départ.");
  };
  // La visite guidée et le changement de métier remplacent les données : la démo d'essai est d'abord mise de côté
  const tourGeneral = ACTIONS.tour;
  ACTIONS.tour = () => { if (essaiActif()) { const m = paquetEssai().metier; mettreEssaiDeCote(); S = construireDemo(m); sauver(); } tourGeneral(); };
  const metierGeneral = changerMetier;
  changerMetier = function (m) { mettreEssaiDeCote(); return metierGeneral(m); };
  // Un lien ?metier=… ouvert pendant un essai : la démo de ce métier s'affiche, l'essai attend avec ses gestes
  const qm = new URLSearchParams(location.search).get("metier");
  if (essaiActif() && METIERS[qm] && !/^#essai=/.test(location.hash)) { mettreEssaiDeCote(); S = construireDemo(qm); sauver(); rendre(); }
  else brancherEssai(); // le premier affichage a eu lieu avant le chargement de ce fichier
  window.addEventListener("hashchange", ouvrirLienEssai);
  ouvrirLienEssai();
})();

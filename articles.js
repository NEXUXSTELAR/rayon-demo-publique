"use strict";
/* Les articles, gérés par le client lui-même : en ajouter, en modifier, en retirer, sans passer par l'installateur.
   - Ajouter : « Nouvel article » dans le stock, « Créer cet article » quand une recherche ou un scan ne trouve rien.
     Le code est attribué seul et n'est jamais réutilisé (S.dernierCode). Le stock de départ entre comme un inventaire signé du prénom.
   - Modifier : depuis la fiche complète. Une ligne « Fiche » dans le journal dit qui a changé quoi (la quantité y est à zéro).
   - Retirer : rien n'est effacé. L'article passe de S.articles à S.retires : il sort des listes, des commandes, des comptages
     et des alertes, mais art() le retrouve toujours, pour le journal et les anciens bons. On peut le remettre.
   - Le dépôt ne crée pas : il demande l'ajout (S.demandesArticles), qui arrive dans « À faire » de qui a le droit.
   Droits : « articles » (ajouter, modifier, remettre) et « retirer ». La direction les a toujours.
   Chargé après groupe.js, avant app.js. */

const peutArticles = () => !!session && (session.profil === "direction" || droit("articles"));
const peutRetirer = () => !!session && (session.profil === "direction" || droit("retirer"));
const aDesRetires = () => (S.retires || []).length > 0;
const jourRetrait = a => new Date(a.retire.le).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/* ---------------- Codes ---------------- */
const numeroCode = id => { const m = /^ART-(\d+)$/.exec(id || ""); return m ? +m[1] : 0; };
// Le plus grand numéro jamais donné : articles présents, retirés, et tout ce que le journal a vu passer.
function dernierNumero() {
  let n = S.dernierCode || 0;
  S.articles.concat(S.retires || []).forEach(a => { n = Math.max(n, numeroCode(a.id)); });
  S.mouvements.forEach(m => { n = Math.max(n, numeroCode(m.article)); });
  // Dans un groupe, un code ne désigne qu'un objet : le nouveau numéro passe au-dessus de ceux de tous les établissements
  if (groupeActif()) Object.values(G.etats).forEach(st => { if (st) st.articles.concat(st.retires || []).forEach(x => { n = Math.max(n, numeroCode(x.id)); }); });
  return n;
}
const prochainCode = () => "ART-" + String(dernierNumero() + 1).padStart(4, "0");
// Une étiquette déjà imprimée, pas encore attribuée : son code est libre s'il n'a jamais servi.
const codeLibre = id => /^ART-\d{4}$/.test(id || "") && !art(id) && !S.mouvements.some(m => m.article === id);
// Une ligne dans le journal, sans toucher au stock
function ligneFiche(id, motif) {
  const mv = prochainMv();
  S.mouvements.push({ id: mv, date: Date.now(), profil: session.profil, qui: session.nom, article: id, type: "Fiche", qte: 0, evenement: "", motif });
  return mv;
}

/* ---------------- Ce qui s'ajoute aux écrans existants ---------------- */
// En haut du stock : le bouton, et les ajouts demandés par le dépôt
function outilsArticles() {
  if (!peutArticles()) return "";
  const d = S.demandesArticles || [];
  return `<div class="art-outils"><button class="btn petit plein" data-article-nouveau>Nouvel article</button></div>
  ${d.length ? `<ul class="b-liste art-demandes">${d.map(x => `<li><button class="l" data-demande-article="${x.id}">${pic(I.etiquette)}<span><b>Ajout demandé · ${esc(x.nom)}</b><small>Par ${esc(x.qui)} · ${quand(x.date)}</small></span><span class="statut">à voir</span></button></li>`).join("")}</ul>` : ""}`;
}
// Sous une recherche qui ne trouve rien
const boutonCreerRecherche = () => `<button type="button" class="btn petit plein" data-article-recherche style="margin-top:10px">${peutArticles() ? "Créer cet article" : "Demander l'ajout"}</button>`;
// Sur la fiche complète
function boutonsArticle(a) {
  return (peutArticles() ? `<button class="btn petit" data-article-modifier="${a.id}">Modifier</button>` : "") + (peutRetirer() ? `<button class="btn petit rouge" data-article-retirer="${a.id}">Retirer du stock</button>` : "");
}
// Dans « À faire » : les ajouts demandés par le dépôt
function tachesArticles() {
  if (!peutArticles()) return [];
  return (S.demandesArticles || []).map(x => ({ c: "compter", i: I.etiquette, t: "Ajout demandé · " + x.nom, s: `Par ${x.qui} · ${quand(x.date)}`, a: `data-demande-article="${x.id}"` }));
}
const tachesSansArticles = taches;
taches = function () { return tachesArticles().concat(tachesSansArticles()); };

/* ---------------- Un code que personne ne connaît (scan, code tapé) ---------------- */
function codeInconnu(id) {
  const libre = codeLibre(id);
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tci"><h1 id="tci" style="font-size:26px">Aucun article ne porte le code <span class="code">${esc(id)}</span></h1>
    <p class="sous">${libre ? "Cette étiquette n'est pas encore attribuée." : "Ce code a déjà servi : il ne sera pas réutilisé."} ${peutArticles() ? (libre ? "Vous pouvez créer l'article qu'elle désigne : il gardera ce code." : "Vous pouvez créer l'article : il recevra un nouveau code.") : "Votre responsable peut créer l'article."}</p>
    <div class="valider pile"><button class="btn plein" data-ok>${peutArticles() ? "Créer cet article" : "Demander l'ajout"}</button><button class="btn" data-x>Fermer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => { f.remove(); if (peutArticles()) nouvelArticle({ code: libre ? id : "" }); else feuilleDemandeArticle({ code: libre ? id : "" }); };
}

/* ---------------- Le dépôt demande l'ajout ---------------- */
function feuilleDemandeArticle(o) {
  o = o || {};
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tda"><h1 id="tda" style="font-size:26px">Demander l'ajout d'un article</h1>
    <p class="sous">Votre responsable reçoit la demande dans « À faire » et crée l'article.</p>
    <label class="champ">Nom de l'article<input name="nom" maxlength="60" autocomplete="off" value="${esc(o.nom || "")}"></label>
    <label class="champ">Combien en voyez-vous ?<input name="qte" type="number" inputmode="numeric" min="0" value="1"></label>
    <label class="champ">Où est-il rangé ? (facultatif)<input name="ou" maxlength="60" autocomplete="off"></label>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Envoyer la demande</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const nom = f.querySelector("[name=nom]").value.trim(); if (!nom) return toast("Indiquez le nom de l'article.");
    const l = S.demandesArticles = S.demandesArticles || [], n = (S.dernierDemande = (S.dernierDemande || 0) + 1);
    l.push({ id: "DA-" + n, date: Date.now(), qui: session.nom, nom, qte: Math.max(0, Math.floor(+f.querySelector("[name=qte]").value || 0)), ou: f.querySelector("[name=ou]").value.trim(), code: o.code || "" });
    sauver(); f.remove(); rendre(); toast("Demande envoyée à votre responsable.");
  };
}

/* ---------------- Le formulaire : créer ou modifier ---------------- */
let brouillonArticle = {}, photoArticle = "";
function nouvelArticle(o) { brouillonArticle = o || {}; photoArticle = ""; aller("article", "nouveau"); }
const choisirOuCreer = (nom, liste, choisi, creer) => `<select name="${nom}">${liste.map(x => `<option value="${x.id}" ${x.id === choisi ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}<option value="__nouveau" ${liste.length ? "" : "selected"}>${creer}</option></select>`;
// Seuil et quantité à avoir proposés comme le fait l'import d'une liste (liste.js)
function niveauxProposes(qte, unique) {
  const cible = Math.max(1, qte);
  return { cible, seuil: unique ? 0 : Math.min(cible, Math.ceil(qte * .2)) };
}
function vArticle(arg) {
  const neuf = !arg || arg === "nouveau", a = neuf ? null : art(arg);
  if (!peutArticles()) return `<h1>Pas d'accès</h1><p class="sous">Ajouter ou modifier un article n'est pas prévu pour votre rôle. Demandez à votre responsable.</p>`;
  if (!neuf && (!a || a.retire)) return `<h1>Article introuvable</h1><p class="sous">Il a peut-être été retiré du stock.</p>`;
  const b = neuf ? brouillonArticle : {}, dem = neuf && b.demande ? (S.demandesArticles || []).find(x => x.id === b.demande) : null;
  const v = k => neuf ? "" : a[k] === undefined || a[k] === null ? "" : a[k];
  const deuxLogiques = !!V("pretSortie") && actif("MO-PRET"), lg = metier().logique;
  const champ = (t, corps) => `<label class="champ">${t}${corps}</label>`;
  const texte = (nom, val, max, plus) => `<input name="${nom}" value="${esc(val)}" maxlength="${max}" autocomplete="off" ${plus || ""}>`;
  const nombre = (nom, val, plus) => `<input name="${nom}" type="number" inputmode="decimal" min="0" value="${esc(val)}" ${plus || ""}>`;
  const prop = neuf ? niveauxProposes(b.qte === undefined ? 1 : b.qte, lg === "pret") : null;
  return `<form data-form="article" data-id="${neuf ? "" : a.id}" class="art-form" novalidate>
    <h1>${neuf ? "Nouvel article" : "Modifier l'article"}</h1>
    <p class="sous">${neuf ? `Il recevra le code <span class="code">${esc(b.code || prochainCode())}</span>. Un code n'est jamais réutilisé.` : `<span class="code">${a.id}</span> · le code ne change pas. La quantité se corrige avec « Compter », pas ici.`}</p>
    ${dem ? `<p class="art-note">Demandé par ${esc(dem.qui)} le ${quand(dem.date)}${dem.ou ? ` · rangé : ${esc(dem.ou)}` : ""}. <button type="button" class="lien" data-demande-refuser="${dem.id}">Refuser la demande</button></p>` : ""}
    ${champ("Nom", texte("nom", neuf ? b.nom || "" : a.nom, 60, "required"))}
    ${neuf && deuxLogiques ? `<p class="choix-titre">Cet article</p><div class="choix" role="radiogroup" aria-label="Cet article">
      <label><input type="radio" name="logique" value="pret" ${lg === "pret" ? "checked" : ""}>Il revient · ${esc(V("pretSortie"))}, puis ${esc(V("pretRetour").toLowerCase())}</label>
      <label><input type="radio" name="logique" value="conso" ${lg === "pret" ? "" : "checked"}>Il ne revient pas · ${esc(V("prendre"))}</label></div>` : ""}
    ${neuf ? champ("Quantité en stock aujourd'hui", nombre("qte", b.qte === undefined ? 1 : b.qte, 'inputmode="numeric" step="1"')) : ""}
    ${champ("Emplacement", choisirOuCreer("emp", S.emplacements, neuf ? (S.emplacements[0] || {}).id : a.emp, "Créer un emplacement…"))}
    <label class="champ" data-si="emp" hidden>Nom du nouvel emplacement${texte("empNouveau", "", 40)}</label>
    ${neuf && lieuxActifs() ? champ("Où se trouve cette quantité", `<select name="lieu"><option value="">${esc(nomDepot())}</option>${S.lieux.map(l => `<option value="${l.id}">${esc(l.nom)}</option>`).join("")}</select>`) : ""}
    <details class="art-details"${neuf ? "" : " open"}><summary>Plus de détails</summary>
      ${champ("Catégorie", texte("categorie", v("categorie"), 40))}
      ${champ("Unité (pièce, boîte, sac…)", texte("unite", v("unite"), 20))}
      ${droit("prix") ? champ("Prix d'achat, hors taxes", nombre("prix", v("prix"), 'step="0.01"')) : ""}
      ${champ("Fournisseur", choisirOuCreer("fou", S.fournisseurs, neuf ? (S.fournisseurs[0] || {}).id : a.fou, "Créer un fournisseur…"))}
      <label class="champ" data-si="fou" hidden>Nom du nouveau fournisseur${texte("fouNouveau", "", 60)}</label>
      ${champ("Seuil d'alerte", nombre("seuil", v("seuil"), `step="1" ${neuf ? `placeholder="proposé : ${prop.seuil}"` : ""}`))}
      ${champ("Quantité à avoir", nombre("cible", v("cible"), `step="1" ${neuf ? `placeholder="proposé : ${prop.cible}"` : ""}`))}
      ${champ("Conditionnement : commandé par lots de", nombre("lot", neuf ? 1 : a.lot || 1, 'step="1" min="1"'))}
      ${neuf || a.type === "equip" ? champ("Numéro de série (un seul objet)", texte("serie", v("serie"), 40)) : ""}
      ${neuf && metier().dlc ? champ("Date limite de ce qui est en stock", `<input name="dlc" type="date" min="${aujourdHui()}">`) + champ("Numéro de lot", texte("lotNum", "", 30)) : ""}
      ${neuf && suiviControles() ? champ("Contrôle à suivre", `<select name="ctrlNom"><option value="">Aucun</option>${NATURES_CONTROLE.map(n => `<option>${esc(n)}</option>`).join("")}</select>`) + champ("Prochain contrôle le", `<input name="ctrlLe" type="date">`) + champ("Rythme", `<select name="ctrlMois">${PERIODES_CONTROLE.map(([n, t]) => `<option value="${n}" ${n === 12 ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`) : ""}
      <div class="art-photo">${!neuf && a.photo ? `<div class="vignette"><img src="${a.photo}" alt=""></div>` : ""}<label class="btn">${!neuf && (a.photo || a.img) ? "Remplacer la photo" : "Prendre une photo"}<input type="file" accept="image/*" capture="environment" data-photo-article class="cache"></label></div>
      <p class="sous" data-photo-etat role="status" style="margin:6px 0 0">${photoArticle ? "Photo jointe." : "Facultative. Elle est réduite avant d'être gardée."}</p>
    </details>
    <div class="valider"><button type="button" class="btn" data-act="retour">Annuler</button><button class="btn plein">${neuf ? "Créer l'article" : "Enregistrer"}</button></div>
    ${neuf ? "" : `<p style="margin-top:14px"><button type="button" class="btn" data-aller="etiquettes" data-arg="${a.id}">${I.etiquette}Imprimer son étiquette</button></p>`}
  </form>`;
}
// L'emplacement ou le fournisseur choisi dans le formulaire ; créé s'il est nouveau. Rend son identifiant, ou null si le nom manque.
function choisiOuCree(f, nom, liste, prefixe, extra) {
  const s = f.elements[nom].value; if (s !== "__nouveau") return s;
  const t = f.elements[nom + "Nouveau"].value.trim(); if (!t) return null;
  const deja = liste.find(x => sansAccent(x.nom) === sansAccent(t)); if (deja) return deja.id;
  let n = liste.length + 1; while (liste.some(x => x.id === prefixe + String(n).padStart(2, "0"))) n += 1;
  const x = Object.assign({ id: prefixe + String(n).padStart(2, "0"), nom: t }, extra || {}); liste.push(x); return x.id;
}
const entierChamp = (f, nom) => { const c = f.elements[nom]; return c && c.value.trim() !== "" && isFinite(+c.value) ? Math.max(0, Math.floor(+c.value)) : null; };
function validerArticle(f) {
  const id = f.dataset.id, neuf = !id, a = neuf ? null : art(id), val = n => (f.elements[n] ? f.elements[n].value.trim() : "");
  const nom = val("nom"); if (!nom) return toast("Indiquez le nom de l'article.");
  const meme = S.articles.find(x => x !== a && sansAccent(x.nom) === sansAccent(nom));
  if (meme) return toast(`« ${meme.nom} » existe déjà (${meme.id}). Ajoutez un détail au nom.`);
  const serie = val("serie"), qte = neuf ? entierChamp(f, "qte") || 0 : 0;
  if (neuf && serie && qte > 1) return toast("Avec un numéro de série, il n'y a qu'un objet. Créez un article par objet.");
  if (f.elements.emp.value === "__nouveau" && !val("empNouveau")) return toast("Indiquez le nom du nouvel emplacement.");
  if (f.elements.fou.value === "__nouveau" && !val("fouNouveau") && S.fournisseurs.length) return toast("Indiquez le nom du nouveau fournisseur.");
  const emp = choisiOuCree(f, "emp", S.emplacements, "EMP-N");
  if (f.elements.fou.value === "__nouveau" && !val("fouNouveau")) f.elements.fouNouveau.value = "Fournisseur à préciser";
  const fou = choisiOuCree(f, "fou", S.fournisseurs, "FOU-N", { delai: 7 });
  const prix = f.elements.prix && val("prix") !== "" && isFinite(+val("prix").replace(",", ".")) ? Math.max(0, Math.round(+val("prix").replace(",", ".") * 100) / 100) : null;
  const lot = Math.max(1, entierChamp(f, "lot") || 1);
  if (neuf) {
    const b = brouillonArticle, code = b.code && codeLibre(b.code) ? b.code : prochainCode();
    const logiqueA = f.elements.logique ? f.elements.logique.value : !V("pretSortie") || !actif("MO-PRET") ? "conso" : metier().logique;
    const p = niveauxProposes(qte, !!serie || logiqueA === "pret"), cible = Math.max(1, entierChamp(f, "cible") === null ? p.cible : entierChamp(f, "cible"));
    const seuil = Math.min(cible, entierChamp(f, "seuil") === null ? p.seuil : entierChamp(f, "seuil"));
    const neufA = Object.assign({ id: code, nom, img: "", logique: logiqueA, type: serie ? "equip" : "conso", unite: val("unite"), emp, seuil: serie ? 0 : seuil, cible: serie ? 1 : cible, prix: prix || 0, lot, fou },
      val("categorie") ? { categorie: val("categorie") } : {}, serie ? { serie } : {}, photoArticle ? { photo: photoArticle } : {});
    if (val("ctrlLe")) Object.assign(neufA, { ctrlNom: val("ctrlNom") || "Contrôle", ctrlLe: val("ctrlLe"), ctrlMois: +val("ctrlMois") || 0 });
    S.articles.push(neufA); S.dernierCode = Math.max(dernierNumero(), numeroCode(code));
    ligneFiche(code, "Article créé");
    if (qte > 0) {
      mouvement(code, "Inventaire initial", qte, Object.assign({ motif: "Stock de départ" }, val("dlc") ? { dlc: val("dlc") } : {}, val("lotNum") ? { lotNum: val("lotNum") } : {}));
      const lieu = f.elements.lieu ? f.elements.lieu.value : "";
      if (lieu && !serie) noterTransfert(code, qte, "", lieu);
    }
    if (b.demande) S.demandesArticles = (S.demandesArticles || []).filter(x => x.id !== b.demande);
    brouillonArticle = {}; photoArticle = ""; sauver();
    vue = permis("materiel") ? { nom: "materiel", arg: "tous" } : { nom: "accueil" }; pile = pile.filter(x => x.nom !== "article"); aller(permis("materiel") ? "fiche" : "objet", code);
    return feuilleArticleCree(code);
  }
  // Modification : on note ce qui change, puis on l'écrit
  const ch = [], nomDe = (liste, x) => (liste.find(y => y.id === x) || {}).nom || "aucun";
  const change = (k, apres, t, fmt) => { const avant = a[k] === undefined ? "" : a[k]; if (String(avant) === String(apres)) return; ch.push(`${t} : ${fmt ? fmt(avant) : avant === "" ? "rien" : avant} → ${fmt ? fmt(apres) : apres === "" ? "rien" : apres}`); if (apres === "" && k !== "unite") delete a[k]; else a[k] = apres; };
  change("nom", nom, "Nom", x => `« ${x} »`);
  if (prix !== null) change("prix", prix, "Prix", argent);
  if (a.type !== "equip") { const s = entierChamp(f, "seuil"), c = entierChamp(f, "cible"); if (c !== null) change("cible", Math.max(1, c), "Quantité à avoir"); if (s !== null) change("seuil", Math.min(a.cible, s), "Seuil"); }
  change("emp", emp, "Emplacement", x => nomDe(S.emplacements, x)); change("fou", fou, "Fournisseur", x => nomDe(S.fournisseurs, x));
  change("lot", lot, "Conditionnement"); change("unite", val("unite"), "Unité"); change("categorie", val("categorie"), "Catégorie");
  if (f.elements.serie && serie) change("serie", serie, "Numéro de série");
  if (photoArticle) { a.photo = photoArticle; ch.push("Photo changée"); }
  photoArticle = "";
  if (ch.length) { ligneFiche(a.id, "Modifié · " + ch.join(" · ")); sauver(); }
  vue = pile.pop() || { nom: "fiche", arg: a.id }; rendre(); window.scrollTo(0, 0);
  toast(ch.length ? "Fiche modifiée. Le journal garde ce qui a changé." : "Rien n'a changé.");
}
function feuilleArticleCree(id) {
  const a = art(id); if (!a) return;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tac"><div class="tete">${img(a)}<div><span class="code">${a.id}</span><br><b>${esc(a.nom)}</b></div></div>
    <h1 id="tac" style="font-size:26px">Article créé</h1>
    <p class="sous">${stock(id) > 0 ? `${stock(id)} en stock, inscrit${stock(id) > 1 ? "s" : ""} à votre nom dans le journal.` : "Aucun en stock pour l'instant : « Entrée en stock » ou « Compter » depuis sa fiche."} Sans étiquette, vous le retrouvez par « Chercher » : tapez son nom ou son code.</p>
    <div class="valider pile">${permis("docs") ? `<button class="btn plein" data-etiq>${I.etiquette}Imprimer son étiquette</button>` : ""}<button class="btn" data-autre>Créer un autre article</button><button class="btn" data-x>Voir sa fiche</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-autre]").onclick = () => { f.remove(); nouvelArticle(); };
  const e = f.querySelector("[data-etiq]"); if (e) e.onclick = () => { f.remove(); aller("etiquettes", id); };
}
// Une étiquette seule, à imprimer : la même que sur la planche
function etiquetteSeule(id) {
  const a = art(id);
  return `<p class="pas-imprimer"><button class="lien" data-fiche="${a.id}">← Fiche de l'article</button> · <button class="lien" data-act="imprimer">Imprimer ou enregistrer en PDF</button> · <button class="lien" data-aller="etiquettes">Toute la planche</button></p>
  <div class="pas-imprimer"><h1>Étiquette · ${esc(a.nom)}</h1><p class="sous">Scanné avec l'appareil photo, le QR ouvre directement la fiche de l'objet. En attendant de la coller, l'article se sort par « Chercher ».</p></div>
  <div class="planche"><div class="etiquette"><div data-qr="${a.id}"></div><div><b>${esc(a.nom)}</b><span class="code">${a.id}</span><small class="proprio">Propriété de ${esc((S.entreprise || {}).nom || "l'entreprise")}</small></div></div></div>`;
}

/* ---------------- Retirer, remettre ---------------- */
// Ce qui empêche de retirer tout de suite : on le dit, on ne retire pas en silence.
function obstaclesRetrait(id) {
  const o = [], dh = dehors(id).reduce((t, d) => t + d.qte, 0), at = totalAtelier(id);
  if (dh) o.push(`${dh} ${dh > 1 ? "sont dehors" : "est dehors"} (${(V("chez") || "chez un client").toLowerCase()}) : attendez ${dh > 1 ? "leur" : "son"} retour, ou notez ${dh > 1 ? "les" : "le"} perdu${dh > 1 ? "s" : ""}.`);
  if (at) o.push(`${at} à l'atelier : attendez ${at > 1 ? "leur" : "son"} retour.`);
  const res = (S.reservations || []).filter(r => ["Confirmée", "Préparée"].includes(r.statut) && r.lignes.some(l => l[0] === id));
  if (res.length) o.push(`Réservé pour ${res.slice(0, 2).map(r => r.nom).join(", ")}${res.length > 2 ? "…" : ""} : retirez-le d'abord de la réservation.`);
  const cmd = S.commandes.filter(c => ["À valider", "Envoyée", "Reçue en partie"].includes(c.statut) && c.lignes.some(l => l.id === id && (l.recu || 0) < l.qte));
  if (cmd.length) o.push(`Commande en cours (${cmd.map(c => c.id).join(", ")}) : réceptionnez-la d'abord.`);
  if (groupeActif() && G.transferts.some(t => t.statut === "En route" && t.article === id)) o.push("Un envoi de cet article est en route entre deux établissements : attendez sa réception.");
  return o;
}
function feuilleRetirerArticle(id) {
  const a = art(id); if (!a || a.retire || !peutRetirer()) return;
  const o = obstaclesRetrait(id), q = stock(id), kits = (S.kits || []).filter(k => k.lignes.some(l => l[0] === id));
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tra2"><div class="tete">${img(a)}<div><span class="code">${a.id}</span><br><b>${esc(a.nom)}</b></div></div>
    <h1 id="tra2" style="font-size:26px">${o.length ? "Cet article ne peut pas être retiré tout de suite" : "Retirer cet article du stock ?"}</h1>
    ${o.length ? `<ul class="ecarts">${o.map(t => `<li><span>${esc(t)}</span></li>`).join("")}</ul>` : `
    <p class="sous">Il ne sera plus proposé, compté ni commandé. Rien n'est effacé : son historique reste dans le journal et sur les anciens bons, et vous pourrez le remettre depuis « Retirés ».</p>
    ${q > 0 ? `<p class="art-note"><b>Il en reste ${q} en stock${droit("prix") ? ` (${argent(q * a.prix)})` : ""}.</b> S'ils sont encore là, gardez l'article. S'ils n'y sont plus, le retrait les compte à zéro, et le journal le note à votre nom.</p>` : ""}
    ${kits.length ? `<p class="art-note">Il fait partie du kit « ${esc(kits[0].nom)} »${kits.length > 1 ? " et d'autres" : ""} : ce kit ne pourra plus sortir.</p>` : ""}`}
    <div class="valider pile">${o.length ? "" : `<button class="btn plein" data-ok>${q > 0 ? "Compter à zéro et retirer" : "Retirer du stock"}</button>`}<button class="btn" data-x>${o.length ? "Fermer" : "Annuler"}</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  const ok = f.querySelector("[data-ok]"); if (ok) ok.onclick = () => { f.remove(); retirerArticle(id); };
}
function retirerArticle(id) {
  const a = art(id), mvs = [];
  // Ce qui reste est compté à zéro, lieu par lieu
  if (lieuxActifs() && reparti(a)) S.lieux.forEach(l => { const n = stockLieu(id, l.id); if (n) mvs.push(mouvement(id, "Ajustement", -n, { motif: "Retrait du stock", lieu: l.id })); });
  const reste = stock(id); if (reste) mvs.push(mouvement(id, "Ajustement", -reste, { motif: "Retrait du stock" }));
  a.retire = { le: Date.now(), par: session.nom };
  S.articles = S.articles.filter(x => x !== a); (S.retires = S.retires || []).push(a);
  ligneFiche(id, "Retiré du stock"); sauver();
  vue = { nom: "materiel", arg: "tous" }; pile = pile.filter(x => x.arg !== id); rendre(); window.scrollTo(0, 0);
  $$(".toast").forEach(x => x.remove());
  const d = document.createElement("div"); d.className = "toast avec-bouton"; d.setAttribute("role", "status");
  d.innerHTML = `<span>${esc(a.nom)} : retiré du stock.</span><button>Annuler</button><i class="decompte" aria-hidden="true"></i>`;
  document.body.appendChild(d);
  const t = setTimeout(() => d.remove(), 10000);
  d.querySelector("button").onclick = () => { clearTimeout(t); d.remove(); remettreArticle(id, true); annuler(mvs); };
}
function remettreArticle(id, discret, motif) {
  const a = (S.retires || []).find(x => x.id === id); if (!a) return;
  delete a.retire; S.retires = S.retires.filter(x => x !== a); S.articles.push(a); S.articles.sort((x, y) => x.id.localeCompare(y.id));
  ligneFiche(id, motif || (discret ? "Retrait annulé" : "Remis dans le stock")); sauver();
  if (discret) return;
  rendre(); toast(`${a.nom} : remis dans le stock. Comptez-le pour dire combien il y en a.`);
}
const noteRetire = a => `<p class="art-note retire">Cet article a été retiré le ${jourRetrait(a)} par ${esc(a.retire.par)}. Il n'est plus compté ni commandé.</p>
  ${peutArticles() ? `<button class="btn plein" data-article-remettre="${a.id}">Remettre dans le stock</button>` : `<p class="sous">Votre responsable peut le remettre dans le stock.</p>`}`;
// L'étiquette d'un article retiré, scannée
const objetRetire = a => `<div class="t-objet">${img(a)}<span class="code">${a.id}</span><h1>${esc(a.nom)}</h1></div>
  <div class="t-actions">${noteRetire(a)}${permis("materiel") ? `<button class="btn" data-fiche="${a.id}">${I.materiel}Voir son historique</button>` : ""}</div>`;
const ficheRetiree = a => `<div class="fiche">${img(a)}<div><div class="entete"><div><span class="code">${a.id}</span><h1>${esc(a.nom)}</h1><span class="etat zero"><i></i>Retiré</span></div></div>
  ${noteRetire(a)}</div></div>
  <h2>Historique</h2>${tableMouvements(S.mouvements.filter(m => m.article === a.id).slice(-15).reverse(), false)}`;
// Le filtre « Retirés » du stock
function vRetires() {
  const l = (S.retires || []).slice().sort((x, y) => y.retire.le - x.retire.le);
  return `<h1>${esc(titreSection("materiel"))}</h1>
  <div class="outils-liste"><div class="filtres"><button data-filtre-materiel="tous" aria-pressed="false">Tout</button><button data-filtre-materiel="retires" aria-pressed="true">Retirés<span class="nb">${l.length}</span></button></div></div>
  <p class="sous">Retirés du stock : ils ne sont plus proposés, comptés ni commandés. Leur historique reste dans le journal.</p>
  <ul class="b-liste">${l.map(a => `<li><button class="l" data-fiche="${a.id}">${img(a)}<span><b>${esc(a.nom)}</b><small><span class="code">${a.id}</span> · retiré le ${jourRetrait(a)} par ${esc(a.retire.par)}</small></span><span class="statut">Retiré</span></button></li>`).join("") || `<li class="vide">Aucun article retiré.</li>`}</ul>`;
}

function brancherArticles() {
  $$("[data-article-nouveau]").forEach(b => b.onclick = () => nouvelArticle());
  $$("[data-article-recherche]").forEach(b => b.onclick = () => { const nom = (filtreTexte || "").trim().slice(0, 60); if (peutArticles()) nouvelArticle({ nom }); else feuilleDemandeArticle({ nom }); });
  $$("[data-article-modifier]").forEach(b => b.onclick = () => { photoArticle = ""; aller("article", b.dataset.articleModifier); });
  $$("[data-article-retirer]").forEach(b => b.onclick = () => feuilleRetirerArticle(b.dataset.articleRetirer));
  $$("[data-article-remettre]").forEach(b => b.onclick = () => { if (peutArticles()) remettreArticle(b.dataset.articleRemettre); });
  $$("[data-demande-article]").forEach(b => b.onclick = () => { const d = (S.demandesArticles || []).find(x => x.id === b.dataset.demandeArticle); if (d) nouvelArticle({ nom: d.nom, qte: d.qte, code: d.code, demande: d.id }); });
  $$("[data-demande-refuser]").forEach(b => b.onclick = () => { S.demandesArticles = (S.demandesArticles || []).filter(x => x.id !== b.dataset.demandeRefuser); brouillonArticle = {}; sauver(); ACTIONS.retour(); toast("Demande refusée. Prévenez la personne qui l'avait faite."); });
  const f = $('[data-form="article"]'); if (!f) return;
  f.onsubmit = e => { e.preventDefault(); validerArticle(f); };
  ["emp", "fou"].forEach(n => { const s = f.elements[n], l = f.querySelector(`[data-si="${n}"]`), maj = () => { l.hidden = s.value !== "__nouveau"; }; s.onchange = maj; maj(); });
  // Les niveaux proposés suivent la quantité tapée
  const q = f.elements.qte; if (q) q.oninput = () => { const p = niveauxProposes(Math.max(0, Math.floor(+q.value || 0)), !!f.elements.serie.value.trim() || (f.elements.logique ? f.elements.logique.value === "pret" : metier().logique === "pret")); f.elements.seuil.placeholder = "proposé : " + p.seuil; f.elements.cible.placeholder = "proposé : " + p.cible; };
  const ph = f.querySelector("[data-photo-article]"); if (ph) ph.onchange = () => {
    const fi = ph.files[0]; if (!fi) return;
    const lect = new FileReader();
    lect.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 360 / Math.max(im.width, im.height)), cv = document.createElement("canvas"); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height); photoArticle = cv.toDataURL("image/jpeg", .7); const e = f.querySelector("[data-photo-etat]"); if (e) e.textContent = "Photo jointe."; }; im.onerror = () => toast("Cette image ne peut pas être lue."); im.src = lect.result; };
    lect.readAsDataURL(fi);
  };
}

"use strict";
/* Stock par lieu : le dépôt, plus des fourgons, des véhicules ou des sites (S.lieux).
   Le stock total d'un objet ne change pas de calcul : il reste la somme de ses mouvements, tous lieux confondus.
   Ce fichier ajoute seulement la répartition :
   - un mouvement « Transfert » (de, vers) déplace une quantité sans toucher au total ;
   - une sortie, une remise, une perte ou un comptage peut porter un lieu (m.lieu) ; sans lieu, c'est le dépôt ;
   - ce qui est au dépôt = le total, moins ce qui est dans les autres lieux.
   Une dotation facultative par lieu (lieu.dot) dit ce que le fourgon ou le véhicule doit contenir.
   Rien ne s'affiche pour une entreprise qui n'a qu'un lieu de stock (S.lieux vide ou absent).
   Chargé après config.js et controles.js, avant app.js. */

const lieuxActifs = () => (S.lieux || []).length > 0;
const lieuDe = id => (S.lieux || []).find(l => l.id === id) || null;
const nomDepot = () => S.nomDepot || "Dépôt";
const nomLieu = id => id ? (lieuDe(id) || {}).nom || "Lieu retiré" : nomDepot();
const motLieux = () => S.motLieux || "Lieux de stock";
// Les objets uniques (une perceuse avec son numéro de série) se suivent par le prêt, pas par lieu.
const reparti = a => !!a && a.type !== "equip";

/* ---------------- Calculs ---------------- */
// Quantité d'un objet dans chaque lieu autre que le dépôt : { "LIEU-01": 6, … }
function parLieu(id) {
  const q = {};
  S.mouvements.forEach(m => {
    if (m.article !== id) return;
    if (m.type === "Transfert") { if (m.de) q[m.de] = (q[m.de] || 0) - m.qte; if (m.vers) q[m.vers] = (q[m.vers] || 0) + m.qte; }
    else if (m.lieu) q[m.lieu] = (q[m.lieu] || 0) + (SIGNE[m.type] || 0) * m.qte;
  });
  return q;
}
// Ce qui est au dépôt. Sans autre lieu, c'est tout le stock.
const stockIci = id => lieuxActifs() ? stock(id) - Object.values(parLieu(id)).reduce((t, x) => t + x, 0) : stock(id);
const stockLieu = (id, lieu) => lieu ? (parLieu(id)[lieu] || 0) : stockIci(id);
const dotation = (lieu, id) => ((lieuDe(lieu) || {}).dot || {})[id] || 0;
// Les objets d'un lieu : ceux qui s'y trouvent et ceux de sa dotation
const articlesDuLieu = lieu => S.articles.filter(a => reparti(a) && (stockLieu(a.id, lieu) > 0 || dotation(lieu, a.id) > 0));
// Ce qui manque dans un lieu par rapport à sa dotation : [{ a, manque, ici }]
const manquesLieu = lieu => S.articles.filter(reparti).map(a => ({ a, manque: dotation(lieu, a.id) - Math.max(0, stockLieu(a.id, lieu)), ici: Math.max(0, stockIci(a.id)) })).filter(x => x.manque > 0);
// Le lieu habituel de la personne connectée (son fourgon) : mémorisé à son dernier choix
const monLieu = () => { const l = (S.lieuDe || {})[session ? session.uid : ""]; return l && lieuDe(l) ? l : ""; };
function retenirLieu(lieu) { if (!session) return; (S.lieuDe = S.lieuDe || {})[session.uid] = lieu || ""; }

/* ---------------- Dates limites dans un lieu ---------------- */
const alerteDlc = () => metier().alerteDlc || 4; // jours : en dessous, un lot est « bientôt périmé »
const isoDans = j => isoJour(Date.now() + j * JOUR_MS);
// Le lot le plus proche de sa date dans un lieu : { dlc, qte, c } avec c = "perime", "bientot" ou ""
function lotProche(a, lieu) {
  if (!metier().dlc) return null;
  const l = lieu ? lotsDuLieu(S.mouvements, a.id, lieu) : lotsAuDepot(a.id); if (!l.length) return null;
  return Object.assign({ c: l[0].dlc < aujourdHui() ? "perime" : l[0].dlc <= isoDans(alerteDlc()) ? "bientot" : "" }, l[0]);
}
const texteLot = p => p ? `${p.qte} ${p.c === "perime" ? "périmé" + (p.qte > 1 ? "s" : "") + " depuis le" : "à utiliser avant le"} ${dateCtrl(p.dlc)}` : "";
const perimesLieu = lieu => articlesDuLieu(lieu).map(a => ({ a, p: lotProche(a, lieu) })).filter(x => x.p && x.p.c);
const pictoLieu = () => /site|local|magasin|antenne/i.test(motLieux()) ? I.materiel : I.camion;

/* ---------------- Ce qui s'affiche sur un objet ---------------- */
// Sous la jauge de l'objet scanné : où sont les pièces
function ligneLieux(a) {
  if (!lieuxActifs() || !reparti(a)) return "";
  const p = parLieu(a.id), l = S.lieux.filter(x => (p[x.id] || 0) > 0 || dotation(x.id, a.id) > 0);
  if (!l.length) return "";
  return `<p class="lieux-objet"><span><b>${Math.max(0, stockIci(a.id))}</b> ${esc(nomDepot().toLowerCase())}</span>${l.map(x => `<span><b>${Math.max(0, p[x.id] || 0)}</b> ${esc(x.nom)}</span>`).join("")}</p>`;
}
function boutonTransfert(a, petit) {
  if (!lieuxActifs() || !reparti(a)) return "";
  return `<button class="btn${petit ? " petit" : ""}" data-transfert="${a.id}">${petit ? "Déplacer" : esc(S.gesteLieu || "Déplacer vers un autre lieu")}</button>`;
}
// Fiche complète : la répartition, avec la dotation de chaque lieu
function blocLieuxFiche(a) {
  if (!lieuxActifs() || !reparti(a)) return "";
  const p = parLieu(a.id);
  return `<h2>Où il se trouve</h2><table class="t"><tbody><tr><td>${esc(nomDepot())}</td><td class="n">${Math.max(0, stockIci(a.id))}</td></tr>
  ${S.lieux.filter(x => (p[x.id] || 0) > 0 || dotation(x.id, a.id) > 0).map(x => { const d = dotation(x.id, a.id), q = Math.max(0, p[x.id] || 0); const pl = lotProche(a, x.id); return `<tr><td>${esc(x.nom)}${d ? `<br><small>dotation ${d}${q < d ? ` · il en manque ${d - q}` : ""}</small>` : ""}${pl ? `<br><small>${texteLot(pl)}</small>` : ""}</td><td class="n">${q}</td></tr>`; }).join("")}</tbody></table>`;
}

/* ---------------- Le choix du lieu dans la feuille d'un geste (sortie, remise, perte, comptage) ---------------- */
const GESTES_LIEU = { "Sortie": "Pris dans", "Surplus": "Remis dans", "Perte": "Où était-il ?", "Compter": "Lieu compté" };
function champLieu(a, type) {
  if (!lieuxActifs() || !reparti(a) || !GESTES_LIEU[type]) return "";
  const p = parLieu(a.id), mien = monLieu(), faut = type === "Sortie" || type === "Perte";
  const defaut = mien && (!faut || (p[mien] || 0) > 0) ? mien : "";
  const opt = (id, nom, q) => `<option value="${id}" ${id === defaut ? "selected" : ""}>${esc(nom)} · ${Math.max(0, q)}</option>`;
  return `<label class="champ">${GESTES_LIEU[type]}<select name="lieu">${opt("", nomDepot(), stockIci(a.id))}${S.lieux.map(x => opt(x.id, x.nom, p[x.id] || 0)).join("")}</select></label>`;
}
// Le lieu choisi dans la feuille ; undefined si la feuille n'a pas ce choix (un seul lieu de stock, objet unique)
const lieuChoisi = f => { const s = f.querySelector("select[name=lieu]"); return s ? s.value : undefined; };
// Ce qu'on peut prendre : au dépôt pour un prêt, dans le lieu choisi pour une sortie ou une perte. null = pas de limite par lieu.
function dispoGeste(f, id, type) {
  if (!lieuxActifs()) return null;
  if (type === "Prêt") return Math.max(0, stockIci(id));
  const l = lieuChoisi(f);
  return l !== undefined && (type === "Sortie" || type === "Perte") ? Math.max(0, stockLieu(id, l)) : null;
}
// Comptage : la quantité attendue suit le lieu choisi
function brancherLieuFeuille(f, id, type, champ) {
  const s = f.querySelector("select[name=lieu]"); if (!s) return;
  if (type === "Compter") { champ.value = Math.max(0, stockLieu(id, s.value)); s.onchange = () => { champ.value = Math.max(0, stockLieu(id, s.value)); }; }
}
// Ce que le mouvement retient du lieu : rien pour le dépôt
const extraLieu = l => l ? { lieu: l } : {};
// Dans le journal : le lieu d'une sortie ou d'un comptage ; pour un transfert annulé, le trajet d'origine (le motif dit « Annulation de… »)
const lieuMv = m => m.type === "Transfert" ? (/→/.test(m.motif || "") ? "" : `<br><small>${esc(nomLieu(m.de))} → ${esc(nomLieu(m.vers))}</small>`) : m.lieu ? `<br><small>${esc(nomLieu(m.lieu))}</small>` : "";

/* ---------------- Déplacer une quantité d'un lieu à un autre ---------------- */
function noterTransfert(id, n, de, vers) {
  const mv = prochainMv();
  // Les lots à date limite suivent : on déplace d'abord ceux qui sont les plus proches de leur date
  const lots = metier().dlc ? prendreLots(de ? lotsDuLieu(S.mouvements, id, de) : lotsAuDepot(id), n) : [];
  S.mouvements.push(Object.assign({ id: mv, date: Date.now(), profil: session.profil, qui: session.nom, article: id, type: "Transfert", qte: n, evenement: "", motif: `${nomLieu(de)} → ${nomLieu(vers)}`, de: de || "", vers: vers || "" }, lots.length ? { lots } : {}));
  return mv;
}
function feuilleTransfert(id, de, vers) {
  const a = art(id); if (!a || !lieuxActifs()) return;
  if (de === undefined) de = "";
  if (vers === undefined) vers = de ? "" : (monLieu() || S.lieux[0].id);
  const tous = [{ id: "", nom: nomDepot() }].concat(S.lieux);
  const opts = (choisi) => tous.map(x => `<option value="${x.id}" ${x.id === choisi ? "selected" : ""}>${esc(x.nom)} · ${Math.max(0, stockLieu(id, x.id))}</option>`).join("");
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="ttr">
    <div class="tete">${img(a)}<div><span class="code">${a.id}</span><br><b>${esc(a.nom)}</b></div></div>
    <h1 id="ttr" style="font-size:26px">Combien déplacez-vous ?</h1>
    <div class="compteur"><button data-pas="-1" aria-label="Un de moins">−</button><input type="number" inputmode="numeric" min="0" value="1" aria-label="Quantité"><button data-pas="1" aria-label="Un de plus">+</button></div>
    <div class="rapides">${[5, 10, 50].map(n => `<button data-plus="${n}">+${n}</button>`).join("")}</div>
    <div class="deux-lieux"><label class="champ">De<select name="de">${opts(de)}</select></label><label class="champ">Vers<select name="vers">${opts(vers)}</select></label></div>
    <p class="sous" data-tr-aide style="margin:0" role="status"></p>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Valider</button></div></div>`);
  const champ = compteur(f, 0, null), sde = f.querySelector("[name=de]"), svers = f.querySelector("[name=vers]"), aide = f.querySelector("[data-tr-aide]");
  const maj = () => {
    const d = dotation(svers.value, id), q = Math.max(0, stockLieu(id, svers.value));
    aide.textContent = sde.value === svers.value ? "Choisissez deux lieux différents." : d ? `Dotation de ${nomLieu(svers.value)} : ${d}. Il y en a ${q}${q < d ? `, il en manque ${d - q}` : ""}.` : "";
  };
  // Le lieu d'arrivée ne peut pas être celui de départ : on bascule l'autre côté
  sde.onchange = () => { if (sde.value === svers.value) svers.value = sde.value ? "" : S.lieux[0].id; maj(); };
  svers.onchange = () => { if (sde.value === svers.value) sde.value = svers.value ? "" : S.lieux[0].id; maj(); };
  const manque = dotation(vers, id) - Math.max(0, stockLieu(id, vers)); if (manque > 0) champ.value = Math.min(manque, Math.max(1, stockLieu(id, de)));
  maj();
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const n = Math.floor(+champ.value), d = sde.value, v = svers.value, dispo = Math.max(0, stockLieu(id, d));
    if (!(n > 0)) return toast("Indiquez une quantité.");
    if (d === v) return toast("Choisissez deux lieux différents.");
    if (n > dispo) return toast(dispo ? `Il n'y en a que ${dispo} : ${nomLieu(d)}.` : `Il n'y en a pas : ${nomLieu(d)}.`);
    const mv = noterTransfert(id, n, d, v); retenirLieu(v || d); sauver();
    f.remove(); rendre(); annulable([mv], `${n} déplacé${n > 1 ? "s" : ""} : ${nomLieu(d)} → ${nomLieu(v)}.`);
  };
}

/* Réapprovisionner un lieu d'un geste : tout ce qui manque à sa dotation part du dépôt, dans la limite de ce que le dépôt contient. */
function feuilleReappro(lieu) {
  const L = lieuDe(lieu); if (!L) return;
  const l = manquesLieu(lieu).map(x => Object.assign(x, { n: Math.min(x.manque, x.ici) }));
  if (!l.length) return toast(`${L.nom} : la dotation est complète.`);
  const possibles = l.filter(x => x.n > 0);
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tra">
    <h1 id="tra" style="font-size:26px">Réapprovisionner ${esc(L.nom)}</h1>
    <p class="sous">${possibles.length ? `Ce qui manque à la dotation part du ${esc(nomDepot().toLowerCase())}. Chargez, puis validez.` : `Le ${esc(nomDepot().toLowerCase())} n'a plus rien de ce qui manque.`}</p>
    <ul class="ecarts">${l.map(x => `<li><b>${x.n > 0 ? x.n + " × " : ""}${esc(x.a.nom)}</b><span>${x.n >= x.manque ? `il en manque ${x.manque}` : x.n > 0 ? `il en manque ${x.manque}, le ${esc(nomDepot().toLowerCase())} n'en a que ${x.ici}` : `il en manque ${x.manque}, plus aucun au ${esc(nomDepot().toLowerCase())}`}</span></li>`).join("")}</ul>
    <div class="valider"><button class="btn" data-x>${possibles.length ? "Annuler" : "Fermer"}</button>${possibles.length ? `<button class="btn plein" data-ok>C'est chargé</button>` : "<span></span>"}</div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  const ok = f.querySelector("[data-ok]"); if (ok) ok.onclick = () => {
    const ids = possibles.map(x => noterTransfert(x.a.id, x.n, "", lieu)), pieces = possibles.reduce((t, x) => t + x.n, 0);
    sauver(); f.remove(); rendre();
    annulable(ids, `${L.nom} réapprovisionné : ${pieces} pièce${pieces > 1 ? "s" : ""}, ${possibles.length} objet${possibles.length > 1 ? "s" : ""}.`);
  };
}

/* Dotation : ce que le lieu doit contenir. Réglée par qui voit le stock complet. */
function feuilleDotation(lieu) {
  const L = lieuDe(lieu); if (!L) return;
  const l = S.articles.filter(reparti);
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tdo">
    <h1 id="tdo" style="font-size:26px">Dotation · ${esc(L.nom)}</h1>
    <p class="sous">Ce que ce lieu doit toujours contenir. Laissez 0 pour un objet qui n'en fait pas partie.</p>
    <ul class="t-liste dot-liste">${l.map(a => `<li><div class="t-retour">${img(a)}<span><b>${esc(a.nom)}</b><small>sur place : ${Math.max(0, stockLieu(a.id, lieu))}</small></span>
      <input type="number" inputmode="numeric" min="0" name="${a.id}" value="${dotation(lieu, a.id)}" aria-label="Dotation : ${esc(a.nom)}"></div></li>`).join("")}</ul>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const dot = {};
    l.forEach(a => { const n = Math.max(0, Math.floor(+f.querySelector(`[name="${a.id}"]`).value || 0)); if (n) dot[a.id] = n; });
    L.dot = dot; sauver(); f.remove(); rendre(); toast("Dotation enregistrée.");
  };
}

/* ---------------- Écrans ---------------- */
function vLieux() {
  if (!lieuxActifs()) return vDepot();
  const mien = monLieu();
  return `<h1>${esc(motLieux())}</h1><p class="sous">Ce que contient chaque lieu, et ce qui manque à sa dotation. Le reste est au ${esc(nomDepot().toLowerCase())}.</p>
  <ul class="t-liste">${S.lieux.map(x => { const l = articlesDuLieu(x.id), m = manquesLieu(x.id).length, pieces = l.reduce((t, a) => t + Math.max(0, stockLieu(a.id, x.id)), 0);
    const np = perimesLieu(x.id).length;
    return `<li><button data-lieu="${x.id}">${pic(pictoLieu())}<span><b>${esc(x.nom)}</b><small>${pieces} pièce${pieces > 1 ? "s" : ""} · ${m ? `${m} objet${m > 1 ? "s" : ""} sous la dotation` : Object.keys(x.dot || {}).length ? "dotation complète" : "pas de dotation"}${np ? ` · ${np} date${np > 1 ? "s" : ""} limite${np > 1 ? "s" : ""} proche${np > 1 ? "s" : ""}` : ""}</small>${x.id === mien ? `<small class="zone-tour">Votre lieu habituel</small>` : ""}</span><span class="etat ${np ? "zero" : m ? "bas" : ""}"><i></i></span></button></li>`; }).join("")}</ul>`;
}
function vLieu(id) {
  const L = lieuDe(id); if (!L) return vLieux();
  const l = articlesDuLieu(id), m = manquesLieu(id), mien = monLieu() === id, np = perimesLieu(id).length;
  return `<h1>${esc(L.nom)}</h1><p class="sous">${m.length ? `${m.length} objet${m.length > 1 ? "s" : ""} sous la dotation.` : Object.keys(L.dot || {}).length ? "La dotation est complète." : "Pas de dotation réglée pour ce lieu."}${np ? ` ${np} objet${np > 1 ? "s" : ""} à date limite proche ou dépassée.` : ""}${mien ? " C'est votre lieu habituel : vos sorties en partent." : ""}</p>
  <div class="t-actions">${m.length ? `<button class="t-action retour conseil" data-reappro="${id}">${I.retour}<span>Réapprovisionner<small>${m.length} objet${m.length > 1 ? "s" : ""} à compléter depuis le ${esc(nomDepot().toLowerCase())}</small></span></button>` : ""}
    <button class="t-action compter" data-zone="${id}">${I.compter}<span>Compter ce lieu<small>Je vérifie ce qu'il contient</small></span></button></div>
  <ul class="t-liste" style="margin-top:14px">${l.map(a => { const q = Math.max(0, stockLieu(a.id, id)), d = dotation(id, a.id);
    const p = lotProche(a, id);
    return `<li><button data-objet="${a.id}">${img(a)}<span><b>${esc(a.nom)}</b><small>${d ? `dotation ${d}${q < d ? ` · il en manque ${d - q}` : ""}` : "hors dotation"}</small>${p ? `<small class="lot-lieu ${p.c}">${texteLot(p)}</small>` : ""}</span><span class="n">${q}</span></button></li>`; }).join("") || `<li class="vide">Ce lieu est vide. Scannez un objet au ${esc(nomDepot().toLowerCase())}, puis « ${esc(S.gesteLieu || "Déplacer vers un autre lieu")} ».</li>`}</ul>
  <div class="boutons" style="margin-top:14px">${mien ? "" : `<button class="btn petit" data-mon-lieu="${id}">C'est mon lieu habituel</button>`}${droit("stock") ? `<button class="btn petit" data-dotation="${id}">Régler la dotation</button>` : ""}<button class="btn petit" data-aller="ficheLieu" data-arg="${id}">Fiche à imprimer</button></div>`;
}
// Fiche d'un lieu, à imprimer et à laisser dans le véhicule : présent, dotation, manquant
function vFicheLieu(id) {
  const L = lieuDe(id); if (!L) return vLieux();
  const l = articlesDuLieu(id), dlc = metier().dlc, per = perimesLieu(id), man = manquesLieu(id);
  return `<p class="pas-imprimer"><button class="lien" data-aller="lieu" data-arg="${id}">← ${esc(L.nom)}</button> · <button class="lien" data-act="imprimer">Imprimer ou enregistrer en PDF</button></p>
  <div class="feuille-doc">${enTeteDoc()}<h1>${esc(L.nom)} · contenu et dotation</h1><p>Édité le ${new Date().toLocaleDateString("fr-FR")} · d'après les gestes enregistrés dans l'appli</p>
  <div class="defile"><table class="etroit"><thead><tr><th>Objet</th><th class="n">Dotation</th><th class="n">Présent</th><th class="n">Manque</th><th class="n">${dlc ? "Date limite" : "Compté"}</th></tr></thead><tbody>
  ${l.map(a => { const q = Math.max(0, stockLieu(a.id, id)), d = dotation(id, a.id), p = dlc ? lotProche(a, id) : null; return `<tr><td>${esc(a.nom)}<br><small>${a.id}</small></td><td class="n">${d || "—"}</td><td class="n">${q}</td><td class="n">${d > q ? d - q : "—"}</td>${dlc ? `<td class="n">${p ? new Date(p.dlc + "T12:00:00").toLocaleDateString("fr-FR") : "—"}</td>` : `<td style="width:70px"></td>`}</tr>`; }).join("") || `<tr><td colspan="5">Ce lieu est vide.</td></tr>`}</tbody></table></div>
  ${man.length ? `<h2>Manquant</h2><p>${man.map(x => `${x.manque} × ${esc(x.a.nom)}`).join(" · ")}</p>` : ""}
  ${dlc ? `<h2>Date limite dépassée ou dans les ${alerteDlc()} jours</h2><p>${per.map(x => `${esc(x.a.nom)} : ${texteLot(x.p)}`).join(" · ") || "Rien."}</p>` : ""}
  <p class="petit">Date : ____ / ____ / ________ · Vérifié par : ______________________</p></div>`;
}
// Fiche d'inventaire papier : une partie par lieu, après les zones du dépôt
function inventaireLieux() {
  if (!lieuxActifs()) return "";
  return S.lieux.map(x => `<h2 style="font-size:17px">${esc(x.nom)}</h2><table><thead><tr><th class="code">Code</th><th>Objet</th><th>Attendu</th><th>Compté</th></tr></thead><tbody>
  ${articlesDuLieu(x.id).map(a => `<tr><td>${a.id}</td><td>${esc(a.nom)}</td><td>${Math.max(0, stockLieu(a.id, x.id))}</td><td style="width:90px"></td></tr>`).join("") || `<tr><td colspan="4">Vide.</td></tr>`}</tbody></table>`).join("");
}

/* ---------------- Le stock filtré par lieu ---------------- */
let lieuStock = null; // null = tous les lieux confondus ; "" = le dépôt ; sinon l'identifiant d'un lieu
function choixLieuStock() {
  if (!lieuxActifs()) return "";
  return `<label class="choix-lieu"><span class="cache">Lieu de stock</span><select data-lieu-stock><option value="tous">Tous les lieux</option>${[{ id: "", nom: nomDepot() }].concat(S.lieux).map(x => `<option value="${x.id}" ${lieuStock === x.id ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></label>`;
}
const filtreLieuActif = () => lieuxActifs() && lieuStock !== null && (lieuStock === "" || !!lieuDe(lieuStock));
const dansLieuStock = a => !filtreLieuActif() || (lieuStock === "" ? !reparti(a) || stockIci(a.id) > 0 : reparti(a) && (stockLieu(a.id, lieuStock) > 0 || dotation(lieuStock, a.id) > 0));
const qteStock = a => filtreLieuActif() && reparti(a) ? Math.max(0, stockLieu(a.id, lieuStock)) : stock(a.id);

/* ---------------- À faire : un lieu sous sa dotation ---------------- */
function tachesLieux() {
  if (!lieuxActifs()) return [];
  const mien = monLieu();
  return S.lieux.map(x => ({ x, m: manquesLieu(x.id) })).filter(o => o.m.length).sort((a, b) => (b.x.id === mien) - (a.x.id === mien)).slice(0, 2)
    .map(o => ({ c: "retour", i: pictoLieu(), t: "Réapprovisionner · " + o.x.nom, s: `${o.m.length} objet${o.m.length > 1 ? "s" : ""} sous la dotation : ${o.m.slice(0, 2).map(k => k.a.nom).join(", ")}${o.m.length > 2 ? "…" : ""}`, a: `data-lieu="${o.x.id}"` }));
}

SECTIONS.lieux = { t: () => motLieux(), get i() { return /site|local|magasin|antenne/i.test(motLieux()) ? "materiel" : "camion"; }, g: "depot", si: () => lieuxActifs(), s: "Ce que contient chaque lieu" };

function brancherLieux() {
  $$("[data-transfert]").forEach(b => b.onclick = () => feuilleTransfert(b.dataset.transfert));
  $$("[data-lieu]").forEach(b => b.onclick = () => aller("lieu", b.dataset.lieu));
  $$("[data-reappro]").forEach(b => b.onclick = () => feuilleReappro(b.dataset.reappro));
  $$("[data-dotation]").forEach(b => b.onclick = () => feuilleDotation(b.dataset.dotation));
  $$("[data-mon-lieu]").forEach(b => b.onclick = () => { retenirLieu(b.dataset.monLieu); sauver(); rendre(); toast(`${nomLieu(b.dataset.monLieu)} : vos sorties en partiront.`); });
  $$("[data-lieu-stock]").forEach(s => s.onchange = () => { lieuStock = s.value === "tous" ? null : s.value; rendre(); const n = $("[data-lieu-stock]"); if (n) n.focus({ preventScroll: true }); });
}

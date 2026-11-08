"use strict";
/* Réparation et nettoyage, clients de location et cautions, coordonnées sur les documents,
   inventaire de fin d'année, comptage d'une zone. Chargé avant app.js. */

/* ---------------- Atelier : en réparation ou au nettoyage ---------------- */
// L'objet sort du stock disponible sans être perdu, puis revient.
function aLAtelier(id) {
  const parMotif = {};
  S.mouvements.filter(m => m.article === id && ["Réparation", "Retour réparation"].includes(m.type)).forEach(m => {
    const k = m.motif || "À réparer";
    parMotif[k] = (parMotif[k] || 0) + (m.type === "Réparation" ? m.qte : -m.qte);
  });
  return Object.entries(parMotif).filter(([, q]) => q > 0).map(([motif, qte]) => ({ motif, qte }));
}
const totalAtelier = id => aLAtelier(id).reduce((t, x) => t + x.qte, 0);
function feuilleAtelier(id) {
  const a = art(id), q = stock(id);
  if (q <= 0) return toast("Il n'y en a pas en stock à envoyer.");
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="ta">
    <div class="tete">${img(a)}<div><span class="code">${a.id}</span><br><b>${esc(a.nom)}</b></div></div>
    <h1 id="ta" style="font-size:26px">Combien partent à l'atelier ?</h1>
    <div class="compteur"><button data-pas="-1" aria-label="Un de moins">−</button><input type="number" inputmode="numeric" min="1" value="1" aria-label="Quantité"><button data-pas="1" aria-label="Un de plus">+</button></div>
    ${radios("motif", ["À réparer", "Au nettoyage"], "Motif")}
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Valider</button></div></div>`);
  const champ = compteur(f, 1, q);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const n = Math.max(1, Math.min(q, Math.floor(+champ.value || 1))), motif = f.querySelector("input[name=motif]:checked").value;
    mouvement(id, "Réparation", n, { motif });
    f.remove(); toast(`${n} ${motif === "Au nettoyage" ? "au nettoyage" : "en réparation"} : plus disponibles jusqu'au retour.`); rendre();
  };
}
function blocAtelier() {
  const l = [];
  S.articles.forEach(a => aLAtelier(a.id).forEach(x => l.push({ a, ...x })));
  if (!l.length) return "";
  return `<h2>À l'atelier</h2><ul class="b-liste">${l.map(x => `<li><div class="l" style="display:grid;grid-template-columns:48px 1fr auto;gap:12px;align-items:center;padding:10px 14px">${img(x.a)}<span><b>${esc(x.a.nom)}</b><small>${x.qte} ${x.motif === "Au nettoyage" ? "au nettoyage" : "en réparation"}</small></span><button class="btn petit" data-retour-atelier="${x.a.id}|${esc(x.motif)}|${x.qte}">Revenu</button></div></li>`).join("")}</ul>`;
}

/* ---------------- Clients de location ---------------- */
function clientDe(ev) {
  const r = S.reservations.find(x => x.nom === ev);
  const id = (r && r.client) || (S.clientsEv || {})[ev];
  return id ? (S.clientsLoc || []).find(c => c.id === id) || null : null;
}
function bClients() {
  const l = S.clientsLoc || [];
  return `<h1>Clients de location</h1><p class="sous">Nom, téléphone et caution versée. La caution s'affiche sur la facture de casse.</p>
  <ul class="b-liste">${l.map(c => {
    const resas = S.reservations.filter(r => r.client === c.id);
    const casse = S.mouvements.filter(m => m.type === "Perte" && m.refac && clientDe(m.evenement) === c).reduce((t, m) => t + valeurM(m), 0);
    return `<li><div class="l" style="display:grid;grid-template-columns:1fr auto;gap:4px 12px;padding:12px 14px"><span><b>${esc(c.nom)}</b><small>${esc(c.tel || "")} · ${resas.length} réservation${resas.length > 1 ? "s" : ""}${casse ? " · casse : " + argent(casse) : ""}</small></span><span class="n" style="font-size:16px">${c.caution ? "Caution " + argent(c.caution) : "Sans caution"}</span></div></li>`;
  }).join("") || `<li class="vide" style="padding:16px">Aucun client enregistré.</li>`}</ul>
  <p style="margin-top:12px"><button class="btn plein petit" data-act="nouveauClient">Ajouter un client</button></p>`;
}
function feuilleClient() {
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tcl"><h1 id="tcl" style="font-size:26px">Nouveau client</h1>
    <label class="champ">Nom<input name="nom" maxlength="60" autocomplete="off"></label>
    <label class="champ">Téléphone<input name="tel" type="tel" maxlength="20" autocomplete="off"></label>
    <label class="champ">Caution versée (en euros)<input name="caution" type="number" inputmode="numeric" min="0" value="0"></label>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const nom = f.querySelector("[name=nom]").value.trim(); if (!nom) return toast("Indiquez le nom.");
    (S.clientsLoc = S.clientsLoc || []).push({ id: "CL-" + String(S.clientsLoc.length + 1).padStart(3, "0"), nom, tel: f.querySelector("[name=tel]").value.trim(), caution: Math.max(0, +f.querySelector("[name=caution]").value || 0) });
    sauver(); f.remove(); rendre(); toast("Client enregistré.");
  };
}

/* ---------------- Coordonnées sur les documents ---------------- */
function enTeteDoc() {
  const e = S.entreprise || {};
  if (!e.nom && !e.logo) return "";
  return `<div class="entete-doc">${e.logo ? `<img src="${e.logo}" alt="Logo">` : ""}<div><b>${esc(e.nom || "")}</b>${[e.adresse, e.tel, e.email].filter(Boolean).map(x => `<br>${esc(x)}`).join("")}</div></div>`;
}
function feuilleCoordonnees() {
  const e = S.entreprise || {};
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tco"><h1 id="tco" style="font-size:26px">Vos coordonnées sur les documents</h1>
    <p class="sous">Elles apparaissent en haut des bons, des factures de casse, des rapports et des fiches d'inventaire.</p>
    <label class="champ">Nom de l'entreprise<input name="nom" maxlength="60" value="${esc(e.nom || "")}"></label>
    <label class="champ">Adresse<input name="adresse" maxlength="120" value="${esc(e.adresse || "")}"></label>
    <label class="champ">Téléphone<input name="tel" maxlength="20" value="${esc(e.tel || "")}"></label>
    <label class="champ">E-mail<input name="email" type="email" maxlength="80" value="${esc(e.email || "")}"></label>
    <label class="btn" style="margin-top:8px">Choisir le logo<input type="file" accept="image/*" data-logo class="cache"></label>
    <p class="sous" data-logo-etat style="margin-top:6px">${e.logo ? "Logo enregistré." : ""}</p>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div></div>`);
  let logo = e.logo || "";
  f.querySelector("[data-logo]").onchange = ev => {
    const fi = ev.target.files[0]; if (!fi) return;
    const lect = new FileReader();
    lect.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 320 / Math.max(im.width, im.height)), cv = document.createElement("canvas"); cv.width = im.width * k; cv.height = im.height * k; cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height); logo = cv.toDataURL("image/png"); f.querySelector("[data-logo-etat]").textContent = "Logo prêt."; }; im.src = lect.result; };
    lect.readAsDataURL(fi);
  };
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const v = n => f.querySelector(`[name=${n}]`).value.trim();
    S.entreprise = { nom: v("nom"), adresse: v("adresse"), tel: v("tel"), email: v("email"), logo };
    try { sauver(); } catch (e2) { return toast("Logo trop lourd pour la démo : choisissez une image plus petite."); }
    f.remove(); rendre(); toast("Coordonnées enregistrées.");
  };
}

/* ---------------- Inventaire de fin d'année (pour le comptable) ---------------- */
function exporterFinAnnee() {
  const annee = new Date().getFullYear(), debut = new Date(annee, 0, 1).getTime();
  const l = [[`Inventaire valorisé au ${new Date().toLocaleDateString("fr-FR")}`], ["Code", "Objet", "Emplacement", "Quantité en stock", "À l'atelier", "Chez les clients", "Prix unitaire", "Valeur totale"]];
  let total = 0;
  S.articles.forEach(a => {
    const q = Math.max(0, stock(a.id)), at = totalAtelier(a.id), dh = dehors(a.id).reduce((t, d) => t + d.qte, 0), v = (q + at + dh) * a.prix;
    total += v;
    l.push([a.id, a.nom, (S.emplacements.find(e => e.id === a.emp) || {}).nom || "", q, at, dh, a.prix.toFixed(2).replace(".", ","), v.toFixed(2).replace(".", ",")]);
  });
  l.push(["", "Total", "", "", "", "", "", total.toFixed(2).replace(".", ",")], [], [`Pertes de l'année ${annee}`], ["Date", "Code", "Objet", "Quantité", "Motif", "Refacturable", "Valeur"]);
  S.mouvements.filter(m => m.type === "Perte" && m.date >= debut).forEach(m => l.push([new Date(m.date).toLocaleDateString("fr-FR"), m.article, art(m.article).nom, m.qte, m.motif, m.refac ? "oui" : "non", valeurM(m).toFixed(2).replace(".", ",")]));
  const csv = "﻿" + l.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = `inventaire-fin-${annee}.csv`; a.click();
}

/* ---------------- Compter une zone ---------------- */
function tZones() {
  return `<h1>Compter une zone</h1><p class="sous">Choisissez l'allée ou le lieu. Les quantités attendues s'affichent : vous ne corrigez que ce qui ne correspond pas.</p>
  <ul class="t-liste">${S.emplacements.map(e => { const n = S.articles.filter(a => a.emp === e.id).length; return `<li><button data-zone="${e.id}">${pic(I.compter)}<span><b>${esc(e.nom)}</b><small>${n} objet${n > 1 ? "s" : ""}</small></span><span class="n">${n}</span></button></li>`; }).join("")}</ul>`;
}
function tZone(id) {
  const e = S.emplacements.find(x => x.id === id); if (!e) return tZones();
  const l = S.articles.filter(a => a.emp === id);
  return `<h1>${esc(e.nom)}</h1><p class="sous">Comptez et corrigez. Chaque écart est enregistré et signé de votre prénom.</p>
  <form data-form="zone" data-zone-id="${id}"><ul class="t-liste">${l.map(a => `<li><div class="t-retour">${img(a)}<span><b>${esc(a.nom)}</b><small>attendu : ${Math.max(0, stock(a.id))}</small></span>
    <input type="number" inputmode="numeric" min="0" name="${a.id}" value="${Math.max(0, stock(a.id))}" aria-label="Compté : ${esc(a.nom)}"></div></li>`).join("")}</ul>
  <div class="valider"><button type="button" class="btn" data-aller="zones">Annuler</button><button class="btn plein" style="background:var(--compter);border-color:var(--compter);color:#fff">Valider le comptage</button></div></form>`;
}
function validerZone(form) {
  let ecarts = 0;
  S.articles.filter(a => a.emp === form.dataset.zoneId).forEach(a => {
    const c = form.elements[a.id]; if (!c) return;
    const n = Math.max(0, Math.floor(+c.value || 0)), d = n - Math.max(0, stock(a.id));
    if (d) { mouvement(a.id, "Ajustement", d, { motif: "Comptage de zone" }); ecarts += 1; }
  });
  toast(ecarts ? `${ecarts} écart${ecarts > 1 ? "s" : ""} enregistré${ecarts > 1 ? "s" : ""}.` : "Tout est juste.");
  aller("terrain");
}

function brancherOutils() {
  $$("[data-atelier]").forEach(b => b.onclick = () => feuilleAtelier(b.dataset.atelier));
  $$("[data-retour-atelier]").forEach(b => b.onclick = () => { const [id, motif, q] = b.dataset.retourAtelier.split("|"); mouvement(id, "Retour réparation", +q, { motif }); toast("Revenu en stock."); rendre(); });
  $$("[data-zone]").forEach(b => b.onclick = () => aller("zone", b.dataset.zone));
  const fz = $('[data-form="zone"]'); if (fz) fz.onsubmit = e => { e.preventDefault(); validerZone(fz); };
}

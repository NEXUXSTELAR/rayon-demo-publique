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

/* ---------------- Coordonnées sur les documents ---------------- */
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
function validerZone(form, confirme) {
  // Avant d'enregistrer : les lignes très loin de l'attendu sont montrées, la personne confirme ou corrige.
  if (!confirme) {
    const loin = [];
    S.articles.filter(a => a.emp === form.dataset.zoneId).forEach(a => {
      const c = form.elements[a.id]; if (!c) return;
      const n = Math.max(0, Math.floor(+c.value || 0)), attendu = Math.max(0, stock(a.id));
      if (grandEcart(n, attendu)) loin.push({ nom: a.nom, compte: n, attendu });
    });
    if (loin.length) return confirmerEcart(loin, () => validerZone(form, true));
  }
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

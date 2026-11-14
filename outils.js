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
  const a = art(id), q = stockIci(id);
  if (q <= 0) return toast("Il n'y en a pas en stock à envoyer.");
  const f = ouvrirFeuille(`<div class="f-geste" role="dialog" aria-modal="true" aria-labelledby="ta">
    <div class="tete">${img(a)}<div><span class="code">${a.id}</span><br><b>${esc(a.nom)}</b></div></div>
    <h1 id="ta" style="font-size:26px">Combien partent à l'atelier ?</h1>
    <div class="compteur"><button data-pas="-1" aria-label="Un de moins">−</button><input type="number" inputmode="numeric" min="1" value="1" aria-label="Quantité"><button data-pas="1" aria-label="Un de plus">+</button></div>
    ${radios("motif", ["À réparer", "Au nettoyage"], "Motif", "deux")}
    <div class="valider colle"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Valider</button></div></div>`);
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
/* Inventaire tournant : une zone par semaine, la plus ancienne d'abord. Tout le dépôt est recompté petit à petit,
   sans fermer une journée. S.comptages garde la date du dernier comptage de chaque zone, même quand tout était juste. */
const depuisComptage = id => { const t = (S.comptages || {})[id]; return t ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : null; };
const texteDepuis = j => j === null ? "jamais comptée" : j === 0 ? "comptée aujourd'hui" : j === 1 ? "comptée hier" : `comptée il y a ${j} jours`;
function zoneDeLaSemaine() {
  const c = S.comptages || {}, l = S.emplacements.filter(e => S.articles.some(a => a.emp === e.id));
  if (!l.length) return null;
  const dernier = Math.max(0, ...l.map(e => c[e.id] || 0));
  return { e: l.slice().sort((x, y) => (c[x.id] || 0) - (c[y.id] || 0))[0], due: Date.now() - dernier >= 7 * 86400000 };
}
// Une zone comptée aujourd'hui porte une coche à la place du pictogramme : on voit d'un coup d'œil ce qui est fait.
const COCHE = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 25l10 10 20-22"/></svg>`;
function tZones() {
  const z = zoneDeLaSemaine(), nz = S.emplacements.filter(e => S.articles.some(a => a.emp === e.id)).length;
  return `<h1>Compter une zone</h1>${sousAide("Choisissez la zone.", "Chaque écart est enregistré et signé de votre prénom.")}
  <ul class="t-liste dp">${S.emplacements.map(e => { const n = S.articles.filter(a => a.emp === e.id).length, tour = z && z.due && z.e.id === e.id, faite = n && depuisComptage(e.id) === 0; return `<li class="${faite ? "zone-faite" : ""}"><button data-zone="${e.id}">${pic(faite ? COCHE : I.compter)}<span><b>${esc(e.nom)}</b><small>${n} objet${n > 1 ? "s" : ""}${n ? " · " + texteDepuis(depuisComptage(e.id)) : ""}</small>${tour ? `<small class="zone-tour">À compter cette semaine</small>` : ""}</span><span class="chev">${I.chevron}</span></button></li>`; }).join("")}</ul>
  ${lieuxActifs() ? `<h2>${esc(motLieux())}</h2><ul class="t-liste dp">${S.lieux.map(x => { const n = articlesDuLieu(x.id).length, faite = n && depuisComptage(x.id) === 0; return `<li class="${faite ? "zone-faite" : ""}"><button data-zone="${x.id}">${pic(faite ? COCHE : I.camion)}<span><b>${esc(x.nom)}</b><small>${n} objet${n > 1 ? "s" : ""}${n ? " · " + texteDepuis(depuisComptage(x.id)) : ""}</small></span><span class="chev">${I.chevron}</span></button></li>`; }).join("")}</ul>` : ""}`;
}
// Une zone du dépôt, ou un autre lieu de stock (fourgon, véhicule, site) : les objets à compter et la quantité attendue
const objetsAZone = id => lieuDe(id) ? articlesDuLieu(id) : S.articles.filter(a => a.emp === id);
const attenduZone = (a, id) => Math.max(0, lieuDe(id) ? stockLieu(a.id, id) : stockIci(a.id));
function tZone(id) {
  const e = S.emplacements.find(x => x.id === id) || lieuDe(id); if (!e) return tZones();
  const l = objetsAZone(id);
  return `<h1>${esc(e.nom)}</h1><p class="sous">Corrigez seulement ce qui ne correspond pas.</p>
  <form data-form="zone" data-zone-id="${id}"><ul class="t-liste dp">${l.map(a => `<li><div class="t-retour">${img(a)}<span><b>${esc(a.nom)}</b><small>attendu : ${attenduZone(a, id)}</small></span>
    <input type="number" inputmode="numeric" min="0" name="${a.id}" value="${attenduZone(a, id)}" aria-label="Compté : ${esc(a.nom)}"></div></li>`).join("") || `<li class="vide">Rien à compter ici pour l'instant.</li>`}</ul>
  <div class="valider dp-colle"><button type="button" class="btn" data-aller="zones">Annuler</button><button class="btn plein" style="background:var(--compter);border-color:var(--compter);color:#fff">Valider le comptage</button></div></form>`;
}
function validerZone(form, confirme) {
  // Avant d'enregistrer : les lignes très loin de l'attendu sont montrées, la personne confirme ou corrige.
  if (!confirme) {
    const loin = [];
    objetsAZone(form.dataset.zoneId).forEach(a => {
      const c = form.elements[a.id]; if (!c) return;
      const n = Math.max(0, Math.floor(+c.value || 0)), attendu = attenduZone(a, form.dataset.zoneId);
      if (grandEcart(n, attendu)) loin.push({ nom: a.nom, compte: n, attendu });
    });
    if (loin.length) return confirmerEcart(loin, () => validerZone(form, true));
  }
  let ecarts = 0;
  const zid = form.dataset.zoneId, ailleurs = lieuDe(zid);
  objetsAZone(zid).forEach(a => {
    const c = form.elements[a.id]; if (!c) return;
    const n = Math.max(0, Math.floor(+c.value || 0)), d = n - attenduZone(a, zid);
    if (d) { mouvement(a.id, "Ajustement", d, Object.assign({ motif: ailleurs ? "Comptage d'un lieu" : "Comptage de zone" }, ailleurs ? { lieu: zid } : {})); ecarts += 1; }
  });
  (S.comptages = S.comptages || {})[form.dataset.zoneId] = Date.now(); sauver();
  toast(ecarts ? `${ecarts} écart${ecarts > 1 ? "s" : ""} enregistré${ecarts > 1 ? "s" : ""}.` : "Tout est juste.");
  // On revient sur la liste des zones, où celle-ci est cochée « comptée aujourd'hui ». « Retour » ne rouvre pas le comptage qu'on vient de valider.
  if (pile.length && pile[pile.length - 1].nom === "zones") pile.pop();
  entree = true; vue = { nom: "zones", arg: null }; rendre(); window.scrollTo(0, 0);
}

/* ---------------- Ce que rapporte un objet loué ----------------
   Estimation : chaque sortie en location compte au prix de location actuel de l'objet. Ce n'est pas la facturation réelle. */
function rapportObjet(a) {
  const l = S.mouvements.filter(m => m.article === a.id && m.type === "Prêt" && m.qte > 0 && !S.mouvements.some(x => x.annule === m.id));
  const premier = S.mouvements.find(m => m.article === a.id);
  const possede_ = Math.max(0, stock(a.id)) + dehors(a.id).reduce((t, d) => t + d.qte, 0);
  return { sorties: l.length, pieces: l.reduce((t, m) => t + m.qte, 0), revenu: l.reduce((t, m) => t + m.qte * a.loc, 0), achat: possede_ * a.prix, jours: premier ? Math.max(1, Math.round((Date.now() - premier.date) / 86400000)) : 0 };
}
function blocRentabilite(a) {
  if (!a.loc || !droit("prix") || logique(a) !== "pret") return "";
  const r = rapportObjet(a); if (!r.jours) return "";
  const part = r.achat ? Math.round(r.revenu / r.achat * 100) : 0;
  return `<h2>Ce qu'il rapporte</h2><table class="t st-lignes"><tbody>
    <tr><td>Locations en ${r.jours} jour${r.jours > 1 ? "s" : ""}<br><small>${r.sorties} sortie${r.sorties > 1 ? "s" : ""}, ${r.pieces.toLocaleString("fr-FR")} pièce${r.pieces > 1 ? "s" : ""} à ${argent(a.loc)}</small></td><td class="n">${argent(r.revenu)}</td></tr>
    <tr><td>Valeur du parc de cet objet<br><small>au prix unitaire de ${argent(a.prix)}</small></td><td class="n">${argent(r.achat)}</td></tr>
    <tr><td>Part de cette valeur déjà couverte</td><td class="n">${part} %</td></tr></tbody></table>
  ${sousAide("Une estimation, pas votre facturation.", "Chaque sortie est comptée au prix de location actuel.")}`;
}

function brancherOutils() {
  $$("[data-atelier]").forEach(b => b.onclick = () => feuilleAtelier(b.dataset.atelier));
  $$("[data-retour-atelier]").forEach(b => b.onclick = () => { const [id, motif, q] = b.dataset.retourAtelier.split("|"); mouvement(id, "Retour réparation", +q, { motif }); toast("Revenu en stock."); rendre(); });
  $$("[data-zone]").forEach(b => b.onclick = () => aller("zone", b.dataset.zone));
  const fz = $('[data-form="zone"]'); if (fz) fz.onsubmit = e => { e.preventDefault(); validerZone(fz); };
}

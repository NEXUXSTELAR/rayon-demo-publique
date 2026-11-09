"use strict";
/* Blocs « centre de commande » : panneau de pilotage, bande du jour, dépôt en 3D, disponibilité à une date,
   résumé du lundi, tournée du chauffeur, devis de l'installateur.
   Chargé avant app.js : les fonctions utilisent l'état et les outils d'app.js au moment où elles tournent. */

// Montant court pour les petites cases : 12,3 k€, 8,1 M FCFA
function argentCourt(eur) {
  const xof = S.monnaie === "XOF", v = xof ? eur * EUR_XOF : eur, u = xof ? " FCFA" : " €";
  if (v >= 1e6) return (Math.round(v / 1e5) / 10).toLocaleString("fr-FR") + " M" + u;
  if (v >= 1e4) return (Math.round(v / 100) / 10).toLocaleString("fr-FR") + " k" + u;
  return Math.round(v).toLocaleString("fr-FR") + u;
}
// Chiffre qui s'anime à l'arrivée sur l'écran (data-compte), écrit tout de suite à sa valeur finale
const compte = (n, format) => `<span data-compte="${n}" data-format="${format || "n"}">${format === "argent" ? argent(n) : Math.round(n).toLocaleString("fr-FR")}</span>`;

/* ---------------- Panneau de pilotage du gérant ---------------- */
function wPouls() {
  // Moyenne sur 7 jours : un départ et un retour font des dents de scie, la tendance se lit mieux lissée.
  const brut = serieValeurStock(36), serie = brut.slice(6).map((x, i) => brut.slice(i, i + 7).reduce((t, y) => t + y, 0) / 7), v = valeurStock();
  const d = serie[0] ? Math.round((v - serie[0]) / serie[0] * 100) : 0;
  const chez = aDesPrets() ? dehors().reduce((t, x) => t + x.qte, 0) : S.mouvements.filter(m => m.type === "Sortie" && m.date >= Date.now() - 7 * J_MS).reduce((t, m) => t + m.qte, 0);
  const rupt = S.articles.filter(a => ["zero", "bas"].includes(etat(a).c)).length;
  const dec = S.commandes.filter(c => c.statut === "À valider").length, nt = taches().length;
  // Courbe de la valeur, remplie, sans axes : une tendance se lit d'un coup d'œil
  const W = 320, H = 70, max = Math.max(...serie) * 1.04 || 1, min = Math.min(...serie) * .96;
  const x = i => (i / (serie.length - 1)) * W, y = val => H - ((val - min) / ((max - min) || 1)) * (H - 6) - 3;
  const ligne = serie.map((val, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(val).toFixed(1)}`).join("");
  const puce = (vers, coul, n, txt) => `<button class="puce" ${vers && permis(vers) ? `data-aller="${vers}"` : "disabled"}><i style="--c:${coul}"></i><b>${compte(n)}</b><span>${txt}</span></button>`;
  const prix = droit("prix");
  return `<div class="pouls">
    <div class="pouls-tete">
      <div><small>${(S.metier || "loueur") === "loueur" ? "Valeur du matériel au dépôt" : "Valeur du stock"}</small>
        <b class="pouls-chiffre">${prix ? compte(v, "argent") : compte(S.articles.reduce((t, a) => t + Math.max(0, stock(a.id)), 0)) + " pièces"}</b>
        <span class="pouls-delta ${d > 0 ? "haut" : d < 0 ? "bas" : ""}">${d ? `<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1 9.5 9h-9z"/></svg>` : ""}${d > 0 ? "+" : ""}${d} % en 30 jours</span></div>
      ${permis("analyses") ? `<button class="rond clair" data-racine="analyses" aria-label="Voir les analyses">${I.fleche}</button>` : ""}
    </div>
    <svg class="pouls-courbe" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <path class="aire" d="${ligne}L${W},${H}L0,${H}Z"/><path class="trait" d="${ligne}"/><circle cx="${x(serie.length - 1)}" cy="${y(serie[serie.length - 1])}" r="3.5"/></svg>
    <div class="pouls-puces">
      ${puce("materiel", "var(--sortie)", chez, aDesPrets() ? V("chez").toLowerCase() : V("sortiesMot").toLowerCase() + " en 7 j")}
      ${puce("materiel", "var(--alerte)", rupt, "à commander")}
      ${puce("", "var(--marque)", dec, "à décider")}
      ${puce("", "var(--compter)", nt, "à faire")}
    </div></div>`;
}

/* ---------------- Aujourd'hui : quatre voyants ---------------- */
function wAujourdhui() {
  const auj = aujourdHui();
  const departs = actif("MO-RES") ? S.reservations.filter(r => ["Confirmée", "Préparée"].includes(r.statut) && r.debut <= isoJour(Date.now() + JOUR_MS)).length : 0;
  const retours = aDesPrets() ? S.reservations.filter(r => r.statut === "Partie" && r.fin <= isoJour(Date.now() + JOUR_MS)).length : 0;
  const livr = S.commandes.filter(c => ["Envoyée", "Reçue en partie"].includes(c.statut)).length;
  const al = S.articles.filter(a => ["zero", "bas"].includes(etat(a).c)).length;
  const case_ = (vers, coul, n, txt, sous) => `<button class="voyant" ${permis(vers) ? `data-aller="${vers}"` : "disabled"} style="--c:${coul}"><span class="voyant-n">${compte(n)}</span><b>${txt}</b><small>${sous}</small></button>`;
  return `<div class="voyants">
    ${actif("MO-RES") ? case_("preparer", "var(--sortie)", departs, "Départs", "aujourd'hui et demain") : case_("journal", "var(--sortie)", S.mouvements.filter(m => m.type === "Sortie" && isoJour(m.date) === auj).reduce((t, m) => t + m.qte, 0), V("sortiesMot"), "aujourd'hui")}
    ${aDesPrets() ? case_("recuperer", "var(--retour)", retours, "Retours", "attendus d'ici demain") : case_("journal", "var(--retour)", S.mouvements.filter(m => m.type === "Entrée" && isoJour(m.date) === auj).reduce((t, m) => t + m.qte, 0), "Entrées", "aujourd'hui")}
    ${case_("reception", "var(--compter)", livr, "Livraisons", "attendues")}
    ${case_("materiel", "var(--alerte)", al, "Alertes", "à commander")}
  </div>`;
}

/* ---------------- Le dépôt en 3D : une colonne par zone, sa hauteur dit ce qu'elle contient ---------------- */
function wDepot3d() {
  const prix = droit("prix");
  const zones = S.emplacements.map(e => {
    const l = S.articles.filter(a => a.emp === e.id);
    const v = l.reduce((t, a) => t + Math.max(0, stock(a.id)) * (prix ? a.prix : 1), 0);
    return { e, v, alerte: l.some(a => ["zero", "bas"].includes(etat(a).c)), n: l.length };
  });
  const max = Math.max(1, ...zones.map(z => z.v)), n = zones.length;
  const a = 44, b = 24, pas = 124, W = Math.max(360, n * pas + 40), H = 272, sol = 220;
  let svg = "";
  zones.forEach((z, i) => {
    const ox = 40 + pas / 2 + i * pas - 20, oy = sol, h = 18 + (z.v / max) * 128;
    const P = pts => pts.map(p => p.join(",")).join(" ");
    const nom = z.e.nom.split("·").pop().trim();
    svg += `<g class="prisme" style="--i:${i}" data-zone="${z.e.id}" role="button" tabindex="0" aria-label="Compter : ${esc(z.e.nom)}">
      <polygon class="dalle" points="${P([[ox - a - 8, oy - b], [ox, oy + 4], [ox + a + 8, oy - b], [ox, oy - 2 * b - 4]])}"/>
      <g class="corps">
        <polygon class="g" points="${P([[ox - a, oy - b], [ox, oy], [ox, oy - h], [ox - a, oy - b - h]])}"/>
        <polygon class="d" points="${P([[ox, oy], [ox + a, oy - b], [ox + a, oy - b - h], [ox, oy - h]])}"/>
        <polygon class="h" points="${P([[ox - a, oy - b - h], [ox, oy - h], [ox + a, oy - b - h], [ox, oy - 2 * b - h]])}"/>
        ${z.alerte ? `<circle class="alerte" cx="${ox}" cy="${oy - b - h}" r="6"/>` : ""}
      </g>
      <text class="v" x="${ox}" y="${oy - 2 * b - h - 10}" text-anchor="middle">${prix ? argentCourt(z.v) : Math.round(z.v).toLocaleString("fr-FR")}</text>
      <text x="${ox}" y="${oy + 26}" text-anchor="middle">${esc(court(nom, 16))}</text></g>`;
  });
  return `<div class="w-entete"><h3 class="w-titre">Le dépôt en 3D</h3><small>${prix ? "valeur" : "pièces"} par zone</small></div>
  <svg class="iso" viewBox="0 0 ${W} ${H}" role="img" aria-label="Valeur du stock par zone du dépôt">${svg}</svg>
  <p class="w-note">Touchez une zone pour la compter.${zones.some(z => z.alerte) ? ` <i class="pt-rouge"></i> une référence à commander dans la zone.` : ""}</p>`;
}

/* ---------------- Disponible le … ? ---------------- */
function wDispo() {
  const d = isoJour(Date.now() + 3 * JOUR_MS);
  return `<h3 class="w-titre">${I.jour}Disponible le … ?</h3>
  <form class="dispo-vite" data-form="dispoVite" onsubmit="return false">
    <label class="cache" for="dv-a">Objet</label><select id="dv-a" name="a">${S.articles.map(a => `<option value="${a.id}">${esc(a.nom)}</option>`).join("")}</select>
    <div class="dv-ligne"><label>Le<input type="date" name="d" value="${d}" min="${aujourdHui()}"></label><label>Combien<input type="number" name="q" value="${S.articles[0].type === "equip" ? 1 : 100}" min="1" inputmode="numeric"></label></div>
    <p class="dv-reponse" data-dv-reponse role="status"></p>
    <button type="button" class="btn petit" data-dv-envoyer>${I.partager}Envoyer la réponse par WhatsApp</button>
  </form>`;
}
function reponseDispo(f) {
  const a = art(f.a.value), d = f.d.value || aujourdHui(), q = Math.max(1, Math.floor(+f.q.value || 1));
  const p = prisSur(a.id, d, d), libre = Math.max(0, possede(a.id) - p.total), ok = q <= libre;
  const qui = p.qui.filter(x => x.q > 0).slice(0, 2).map(x => `${x.q} pour ${x.nom}`).join(", ");
  return { ok, txt: ok ? `Oui : ${libre} ${a.nom.toLowerCase()} libres le ${dateCourte(d)}.` : `Il en manque ${q - libre} : ${libre} libres le ${dateCourte(d)}${qui ? ` (déjà pris : ${qui})` : ""}.`,
    message: ok ? `Bonjour, oui : nous avons ${q} × ${a.nom} disponibles le ${dateLongue(d)}. Voulez-vous que je les réserve ?` : `Bonjour, le ${dateLongue(d)} nous avons ${libre} × ${a.nom} disponibles sur les ${q} demandés. Voulez-vous que je réserve ceux-là ?` };
}

/* ---------------- Résumé du lundi ---------------- */
function texteResume() {
  const sem = Date.now() - 7 * J_MS, l = S.mouvements.filter(m => m.date >= sem);
  const som = f => l.filter(f).reduce((t, m) => t + valeurM(m), 0);
  const sorties = som(m => m.type === "Prêt" || m.type === "Sortie"), pertes = som(m => m.type === "Perte"), refac = som(m => m.type === "Perte" && m.refac);
  const rupt = S.articles.filter(a => ["zero", "bas"].includes(etat(a).c)).map(a => a.nom);
  const dec = S.commandes.filter(c => c.statut === "À valider");
  const prochain = S.reservations.filter(r => r.debut >= aujourdHui() && r.statut === "Confirmée").sort((a, b) => a.debut.localeCompare(b.debut))[0];
  return `Bonjour ${moi().nom}, la semaine en bref (${(S.entreprise || {}).nom || ""}) :
• Valeur du stock : ${argent(valeurStock())}
• ${V("sortiesMot")} : ${argent(sorties)}
• Cassé ou perdu : ${argent(pertes)}${refac ? `, dont ${argent(refac)} refacturables` : ""}
• À commander : ${rupt.length ? rupt.slice(0, 3).join(", ") + (rupt.length > 3 ? "…" : "") : "rien"}
• À décider : ${dec.length ? dec.map(c => `${c.fournisseur} (${argent(c.total)})`).join(", ") : "rien"}${prochain ? `\n• Prochain départ : ${prochain.nom}, ${dateLongue(prochain.debut)}` : ""}`;
}
const wResume = () => `<button class="w-plein" data-act="resume"><small>Chaque lundi à 8 h</small><b class="w-moyen">Résumé de la semaine</b><small>envoyé sur votre WhatsApp · voir le message</small></button>`;
function feuilleResume() {
  const t = texteResume();
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="trs"><h1 id="trs" style="font-size:26px">Résumé du lundi</h1>
    <p class="sous">Ce message part tout seul chaque lundi à 8 h. Le gérant n'a pas besoin d'ouvrir l'appli pour savoir où il en est.</p>
    <div class="bulle-wa">${esc(t).replace(/\n/g, "<br>")}<small>08:00 ✓✓</small></div>
    <div class="valider"><button class="btn" data-x>Fermer</button><button class="btn plein" data-ok>${I.partager}Envoyer maintenant</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => { f.remove(); partagerTexte(t); };
}

/* ---------------- Tournée du chauffeur ---------------- */
function arrets() {
  const jours = [0, 1, 2].map(n => isoJour(Date.now() + n * JOUR_MS)), auj = jours[0], l = [];
  S.reservations.forEach(r => {
    if (["Confirmée", "Préparée", "Partie"].includes(r.statut) && jours.includes(r.debut)) l.push({ r, type: "livraison", jour: r.debut });
    if (r.statut === "Partie" && dehors().some(d => d.evenement === r.nom) && r.fin <= jours[2]) l.push({ r, type: "reprise", jour: r.fin < auj ? auj : r.fin, retard: r.fin < auj });
  });
  return l.sort((a, b) => a.jour.localeCompare(b.jour) || (a.type === "reprise" ? -1 : 1));
}
function carteArret(x) {
  const r = x.r, c = (S.clientsLoc || []).find(k => k.id === r.client), liv = x.type === "livraison";
  const bon = S.bons.slice().reverse().find(b => b.evenement === r.nom && b.type === "sortie");
  const action = liv
    ? (bon ? `<button class="btn petit plein" data-aller="bon" data-arg="${bon.id}">${bon.signature ? "Bon signé · voir" : "Faire signer le client"}</button>` : `<button class="btn petit" data-prep="${r.id}">À charger au dépôt</button>`)
    : `<button class="btn petit plein" data-ev="${esc(r.nom)}">Reprendre le matériel</button>`;
  return `<article class="arret c-${liv ? "sortie" : "retour"}">
    <div class="arret-tete"><span class="pastille">${liv ? I.sortie : I.retour}</span>
      <div><b>${liv ? "Livraison" : "Reprise"} · ${esc(r.nom)}</b><small>${c ? esc(c.nom) + " · " : ""}${esc(r.adresse || "Adresse à compléter")}</small></div>
      ${x.retard ? `<span class="statut s-partie">en retard</span>` : bon && bon.signature && liv ? `<span class="statut s-revenue">signé</span>` : ""}</div>
    <div class="arret-actions">
      ${c && c.tel ? `<a class="btn petit" href="tel:${esc(c.tel.replace(/\s/g, ""))}">Appeler</a>` : ""}
      ${r.adresse ? `<a class="btn petit" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.adresse)}" target="_blank" rel="noopener">Itinéraire</a>` : ""}
      ${action}</div></article>`;
}
function vTournee() {
  const l = arrets(), jours = [...new Set(l.map(x => x.jour))];
  const nomJour = d => d === aujourdHui() ? "Aujourd'hui" : d === isoJour(Date.now() + JOUR_MS) ? "Demain" : dateLongue(d);
  return `<h1>Tournée</h1><p class="sous">Livraisons et reprises des trois prochains jours. Le client signe sur le téléphone, le bon part aussitôt.</p>
  ${jours.map(d => `<h2>${nomJour(d)}</h2><div class="arrets">${l.filter(x => x.jour === d).map(carteArret).join("")}</div>`).join("") || `<p class="vide">Rien de prévu dans les trois prochains jours.</p>`}`;
}
function wTournee() {
  const l = arrets(), auj = l.filter(x => x.jour === aujourdHui()), dem = l.filter(x => x.jour !== aujourdHui());
  return `<div class="w-entete"><h3 class="w-titre">${I.camion}Ma tournée</h3><button class="btn petit" data-racine="tournee">Tout voir</button></div>
  <div class="tournee-resume"><div><b>${auj.length}</b><small>arrêt${auj.length > 1 ? "s" : ""} aujourd'hui</small></div><div><b>${dem.length}</b><small>les jours suivants</small></div></div>
  ${l.slice(0, 2).map(carteArret).join("")}`;
}

/* ---------------- Devis de l'installateur ---------------- */
let devisOffre = "complet";
function prixDevis() {
  const o = OFFRES[devisOffre], u = S.monnaie === "XOF" ? "xof" : "eur";
  const ajouts = Object.keys(CATALOGUE).filter(k => actif(k) && !o.inclus.includes(k));
  const base = o[u] || OFFRES[devisOffre].eur * (u === "xof" ? EUR_XOF : 1);
  const total = base + ajouts.reduce((t, k) => t + CATALOGUE[k][u], 0);
  const fmt = n => u === "xof" ? Math.round(n).toLocaleString("fr-FR") + " FCFA" : n.toLocaleString("fr-FR") + " €";
  return { o, u, ajouts, base, total, fmt };
}
function blocDevis() {
  const p = prixDevis();
  return `<div class="bloc">
    <div class="module"><label for="offre"><b>Offre</b></label><select id="offre" data-offre>${Object.entries(OFFRES).map(([k, o]) => `<option value="${k}" ${k === devisOffre ? "selected" : ""}>${o.nom}</option>`).join("")}</select><p>${p.o.sites} site${p.o.sites === 1 ? "" : "s"}, ${p.o.utilisateurs} utilisateurs, ${p.o.etiquettes} étiquettes, ${p.o.surPlace} sur place, assistance ${p.o.jours} jours et ${p.o.heures} h.</p></div>
    <div class="module"><b>Modules en plus de l'offre</b><span>${p.ajouts.length ? p.ajouts.map(k => CATALOGUE[k].nom).join(", ") : "aucun"}</span><p>Cochez les modules ci-dessus : ceux qui ne sont pas compris dans l'offre s'ajoutent ici.</p></div>
    <div class="total"><span>Total HT${p.o.aPartirDe ? ", à partir de" : ""}</span><span>${p.fmt(p.total)}</span></div>
  </div>
  <p style="margin-top:10px"><button class="btn plein" data-act="voirDevis">Voir le devis à envoyer</button></p>`;
}
function feuilleDevis() {
  const p = prixDevis(), e = S.entreprise || {}, n = "D-" + new Date().getFullYear() + "-" + String(Math.floor(Date.now() / 1e5) % 1000).padStart(3, "0");
  const lignes = [[`Offre ${p.o.nom} : installation, paramétrage, ${p.o.etiquettes} étiquettes, formation (${p.o.surPlace} sur place), assistance ${p.o.jours} jours et ${p.o.heures} h à distance`, p.base]]
    .concat(p.o.inclus.length ? [[`Compris dans l'offre : ${p.o.inclus.map(k => CATALOGUE[k].nom).join(", ")}`, 0]] : [])
    .concat(p.ajouts.map(k => [`Module ${CATALOGUE[k].nom} : ${CATALOGUE[k].detail}`, CATALOGUE[k][p.u]]));
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-label="Devis"><div class="feuille-doc">
    <h1>Devis n° ${n}</h1><p>Pour : <b>${esc(e.nom || "Client")}</b> · ${esc(METIERS[S.metier || "loueur"].nom)}<br>Établi le ${new Date().toLocaleDateString("fr-FR")}, valable 30 jours</p>
    <table><thead><tr><th>Désignation</th><th style="text-align:right">Montant HT</th></tr></thead><tbody>
    ${lignes.map(([t, m]) => `<tr><td>${esc(t)}</td><td style="text-align:right">${m ? p.fmt(m) : "compris"}</td></tr>`).join("")}</tbody></table>
    <p style="text-align:right;font-size:18px"><b>Total HT${p.o.aPartirDe ? " (à partir de)" : ""} : ${p.fmt(p.total)}</b></p>
    <p class="petit">Paiement unique : 40 % à la commande, le solde à la livraison. Aucun abonnement. Les licences Google sont payées directement par le client. Après l'assistance incluse, interventions à ${p.u === "xof" ? TARIF_INTERVENTION.xof.toLocaleString("fr-FR") + " FCFA" : TARIF_INTERVENTION.eur + " €"} HT de l'heure, sur devis. Un module ajouté plus tard fait l'objet d'un nouveau devis. TVA en sus selon la réglementation applicable.</p></div>
    <div class="valider"><button class="btn" data-x>Fermer</button><button class="btn plein" data-ok>${I.imprimer}Imprimer ou PDF</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => { document.body.classList.add("impression-feuille"); window.print(); setTimeout(() => document.body.classList.remove("impression-feuille"), 500); };
}

function brancherBlocs() {
  const dv = $('[data-form="dispoVite"]');
  if (dv) {
    const maj = () => { const r = reponseDispo(dv), el = dv.querySelector("[data-dv-reponse]"); el.textContent = r.txt; el.className = "dv-reponse " + (r.ok ? "oui" : "non"); };
    dv.querySelectorAll("select, input").forEach(i => i.oninput = maj); maj();
    dv.querySelector("[data-dv-envoyer]").onclick = () => partagerTexte(reponseDispo(dv).message);
  }
  $$("[data-offre]").forEach(s => s.onchange = () => { devisOffre = s.value; rendre(); });
  $$("[data-taille]").forEach(b => b.onclick = () => {
    if (!confirm(`Régler l'appli pour « ${TAILLES_EQUIPE[b.dataset.taille].nom} » ? Les blocs, la barre et les droits de chaque rôle sont remis selon ce modèle.`)) return;
    S.taille = b.dataset.taille; S.detail = S.taille === "bureau" ? "complet" : "simple"; S.config = configParDefaut(S.metier, S.taille); roleConf = rolesUtiles().includes(roleConf) ? roleConf : rolesUtiles()[0]; sauver(); rendre(); toast(`Appli réglée : ${TAILLES_EQUIPE[S.taille].nom}.`);
  });
  $$(".iso [data-zone]").forEach(g => g.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aller("zone", g.dataset.zone); } });
}

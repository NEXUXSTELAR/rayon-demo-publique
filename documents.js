"use strict";
/* Clients, événements, documents de sortie et exports Excel.
   Deux niveaux de détail, réglés par entreprise dans l'espace installateur :
   - Simple : un nom d'événement, des bons courts, des exports en un onglet.
   - Complet : client, dates, lieu, contact sur place ; bons avec codes et conditions (valeur de remplacement sur le seul bon de sortie du loueur) ; devis de location ; exports en plusieurs onglets.
   Le dépôt ne remplit jamais ces informations : le bureau ou le patron les complète, depuis le bon ou la réservation.
   Chargé avant app.js. */

const complet = () => (S.detail || "complet") === "complet";
const NIVEAUX = {
  simple: { nom: "Simple", detail: "Un nom d'événement suffit. Bons courts, exports en un onglet. Pour les petites équipes et ceux qui veulent le moins de champs possible." },
  complet: { nom: "Complet", detail: "Client, dates, lieu et contact sur place. Bons avec codes et conditions, devis de location, exports détaillés." },
};
const dateDoc = iso => iso ? new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
const motClients = () => ({ ong: "Bailleurs", labo: "Demandeurs" }[S.metier] || "Clients");

/* ---------------- Ce qu'on sait d'un événement ---------------- */
function infoEv(ev) {
  const r = S.reservations.find(x => x.nom === ev) || null, i = (S.infosEv || {})[ev] || {};
  const g = k => (r && r[k]) || i[k] || "";
  return { client: (r && r.client) || i.client || (S.clientsEv || {})[ev] || "", debut: g("debut"), fin: g("fin"), adresse: g("adresse"), contact: g("contact"), notes: g("notes"), resa: r };
}
function clientDe(ev) { const id = infoEv(ev).client; return id ? (S.clientsLoc || []).find(c => c.id === id) || null : null; }
function evenementsDe(c) {
  const l = new Set();
  S.reservations.forEach(r => { if (r.client === c.id) l.add(r.nom); });
  Object.entries(S.infosEv || {}).forEach(([ev, i]) => { if (i.client === c.id) l.add(ev); });
  Object.entries(S.clientsEv || {}).forEach(([ev, id]) => { if (id === c.id && !S.reservations.some(r => r.nom === ev)) l.add(ev); });
  return [...l];
}
const casseDe = ev => S.mouvements.filter(m => m.type === "Perte" && m.refac && m.evenement === ev).reduce((t, m) => t + valeurM(m), 0);
// Événements dehors dont on ne connaît pas le client : le bureau les complète
const evSansClient = () => [...new Set(dehors().map(d => d.evenement))].filter(ev => !clientDe(ev));

function feuilleEvenement(ev) {
  const i = infoEv(ev), cl = S.clientsLoc || [];
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tev" class="pi-f"><h1 id="tev">${esc(ev)}</h1>
    <p class="sous">Ces informations s'impriment sur les bons, les factures et les exports. Le dépôt n'a rien à remplir.</p>
    <label class="champ">${esc(motClients().replace(/s$/, ""))}<select name="client"><option value="">Pas encore indiqué</option>${cl.map(c => `<option value="${c.id}" ${c.id === i.client ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}<option value="__nouveau">Nouveau…</option></select></label>
    <div data-nouveau hidden><label class="champ">Nom<input name="cnom" maxlength="60" autocomplete="off"></label><label class="champ">Téléphone<input name="ctel" type="tel" maxlength="20" autocomplete="off"></label></div>
    <div class="dispo-dates"><label class="champ">Du<input type="date" name="debut" value="${i.debut}"></label><label class="champ">Au<input type="date" name="fin" value="${i.fin}"></label></div>
    <label class="champ">Lieu ou adresse<input name="adresse" maxlength="120" value="${esc(i.adresse)}"></label>
    <label class="champ">Contact sur place<input name="contact" maxlength="80" placeholder="Nom et téléphone" value="${esc(i.contact)}"></label>
    <label class="champ">Notes<textarea name="notes" rows="2" maxlength="300">${esc(i.notes)}</textarea></label>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div></div>`);
  const v = n => f.querySelector(`[name=${n}]`).value.trim();
  f.querySelector("[name=client]").onchange = e => { f.querySelector("[data-nouveau]").hidden = e.target.value !== "__nouveau"; };
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    let client = v("client");
    if (client === "__nouveau") {
      if (!v("cnom")) return toast("Indiquez le nom.");
      client = "CL-" + String((S.clientsLoc = S.clientsLoc || []).length + 1).padStart(3, "0");
      S.clientsLoc.push({ id: client, nom: v("cnom"), tel: v("ctel"), caution: 0 });
    }
    const infos = { client, debut: v("debut"), fin: v("fin") || v("debut"), adresse: v("adresse"), contact: v("contact"), notes: v("notes") };
    if (infos.fin && infos.debut && infos.fin < infos.debut) return toast("La date de fin est avant la date de début.");
    if (i.resa) Object.assign(i.resa, infos, { debut: infos.debut || i.resa.debut, fin: infos.fin || i.resa.fin });
    else (S.infosEv = S.infosEv || {})[ev] = infos;
    sauver(); f.remove(); rendre(); toast("Informations enregistrées.");
  };
}

/* ---------------- Clients ---------------- */
function bClients() {
  const l = (S.clientsLoc || []).slice().sort((a, b) => a.nom.localeCompare(b.nom)), n = l.length;
  const un = motClients().replace(/s$/, "").toLowerCase(), sans = complet() ? evSansClient() : [];
  const lignes = l.map(c => {
    const evs = evenementsDe(c), casse = evs.reduce((t, ev) => t + casseDe(ev), 0);
    return piLigne({ g: `<span class="avatar">${esc(initiales(c.nom))}</span>`, t: esc(c.nom), s: [c.tel, evs.length + " " + (evs.length > 1 ? motImps() : motImp()), casse ? "casse " + argent(casse) : ""].filter(Boolean).map(esc).join(" · "),
      v: c.caution ? `${argent(c.caution)}<small>de caution</small>` : "", a: `data-client="${c.id}"` });
  });
  return `<h1>${motClients()}</h1><div class="pi-page">
  ${sousAide(!n ? `Aucun ${un} enregistré.` : n === 1 ? `Un ${un} enregistré.` : `${EN_LETTRES[n] || n} ${motClients().toLowerCase()} enregistrés.`, complet() ? `Coordonnées, caution, ${motImps()} et casse de chacun. Tout s'imprime sur les bons et les factures.` : "Nom, téléphone et caution de chacun. La caution s'affiche sur la facture de casse.")}
  ${n ? piCarte("", lignes) : ""}
  <div class="pi-boutons"><button class="btn plein" data-act="nouveauClient">Ajouter un ${un}</button>${complet() && n ? `<button class="btn" data-act="exportClients">${I.excel}Exporter en Excel</button>` : ""}</div>
  ${sans.length ? piCarte("À compléter : du matériel est dehors sans client indiqué", sans.map(ev => piLigne({ c: "attention", t: esc(ev), s: "Client à indiquer", a: `data-infos-ev="${esc(ev)}"` }))) : ""}</div>`;
}
function vClient(id) {
  const c = (S.clientsLoc || []).find(x => x.id === id); if (!c) return bClients();
  const evs = evenementsDe(c).map(ev => ({ ev, i: infoEv(ev), casse: casseDe(ev), bons: S.bons.filter(b => b.evenement === ev) })).sort((a, b) => (b.i.debut || "").localeCompare(a.i.debut || ""));
  const casse = evs.reduce((t, x) => t + x.casse, 0);
  const chiffres = [piLigne({ t: esc(motImps().replace(/^./, x => x.toUpperCase())), v: evs.length }), piLigne({ t: "Caution versée", v: c.caution ? argent(c.caution) : `<span class="pi-gris">aucune</span>` }),
    piLigne({ c: casse ? "alerte" : "", t: "Casse refacturable", v: argent(casse) })].concat(c.notes ? [piLigne({ t: "Notes", s: esc(c.notes) })] : []);
  const doc = (attr, t) => `<button class="btn petit" ${attr}>${t}</button>`;
  return `<div class="pi-page"><div class="fiche-client pi-tete"><span class="avatar grand">${esc(initiales(c.nom))}</span><div><h1>${esc(c.nom)}</h1><p class="es-etat">${[c.type, c.tel, c.email, c.adresse].filter(Boolean).map(esc).join(" · ") || "Coordonnées à compléter"}</p></div></div>
  ${piRonds([c.tel && [I.telephone, "Appeler", `href="tel:${esc(c.tel.replace(/\s/g, ""))}"`, "a"], c.tel && [I.partager, "WhatsApp", `href="https://wa.me/${esc(c.tel.replace(/\D/g, "").replace(/^0/, "33"))}" target="_blank" rel="noopener"`, "a"], [I.crayon, "Modifier", `data-modifier-client="${c.id}"`]])}
  ${piCarte("", chiffres)}
  <section class="es-carte pi-carte"><h2>Ses ${motImps()}</h2>${evs.length ? `<ul class="es-lignes">${evs.map(x => { const docs = x.bons.map(b => doc(`data-aller="bon" data-arg="${b.id}"`, (b.type === "sortie" ? "Bon de sortie" : "Bon de retour") + (b.signature ? ", signé" : ""))).concat(x.casse ? [doc(`data-facture="${esc(x.ev)}"`, "Casse " + argentCourt(x.casse))] : [], x.i.resa && aDesPrixLocation() ? [doc(`data-aller="devisLoc" data-arg="${x.i.resa.id}"`, "Devis")] : []);
    return `<li><div class="es-ligne"><span class="pi-txt">${esc(x.ev)}<small>${[x.i.debut ? dateDoc(x.i.debut) : "", x.i.adresse].filter(Boolean).map(esc).join(" · ")}</small></span></div>${docs.length ? `<div class="pi-ev-docs">${docs.join("")}</div>` : ""}</li>`; }).join("")}</ul>` : `<p class="es-rien">Rien pour l'instant.</p>`}</section></div>`;
}
function feuilleClient(id) {
  const c = id ? (S.clientsLoc || []).find(x => x.id === id) : {}, cp = complet();
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tcl" class="pi-f"><h1 id="tcl">${id ? "Modifier" : "Nouveau client"}</h1>
    <label class="champ">Nom<input name="nom" maxlength="60" autocomplete="off" value="${esc(c.nom || "")}"></label>
    ${cp ? `<label class="champ">Type<select name="type">${["Particulier", "Entreprise", "Association", "Collectivité"].map(t => `<option ${c.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>` : ""}
    <label class="champ">Téléphone<input name="tel" type="tel" maxlength="20" autocomplete="off" value="${esc(c.tel || "")}"></label>
    ${cp ? `<label class="champ">E-mail<input name="email" type="email" maxlength="80" autocomplete="off" value="${esc(c.email || "")}"></label>
    <label class="champ">Adresse de facturation<input name="adresse" maxlength="120" autocomplete="off" value="${esc(c.adresse || "")}"></label>` : ""}
    <label class="champ">Caution versée (${S.monnaie === "XOF" ? "en euros, convertie à l'affichage" : "en euros"})<input name="caution" type="number" inputmode="decimal" min="0" value="${c.caution || 0}"></label>
    ${cp ? `<label class="champ">Notes<textarea name="notes" rows="2" maxlength="300">${esc(c.notes || "")}</textarea></label>` : ""}
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div></div>`);
  const v = n => { const e = f.querySelector(`[name=${n}]`); return e ? e.value.trim() : undefined; };
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    if (!v("nom")) return toast("Indiquez le nom.");
    const donnees = Object.fromEntries(Object.entries({ nom: v("nom"), type: v("type"), tel: v("tel"), email: v("email"), adresse: v("adresse"), notes: v("notes"), caution: Math.max(0, +v("caution") || 0) }).filter(([, x]) => x !== undefined));
    if (id) Object.assign(c, donnees);
    else (S.clientsLoc = S.clientsLoc || []).push(Object.assign({ id: "CL-" + String(S.clientsLoc.length + 1).padStart(3, "0") }, donnees));
    sauver(); f.remove(); rendre(); toast("Client enregistré.");
  };
}

/* ---------------- En-tête et parties des documents ---------------- */
function teteDoc(titre, numero, date) {
  const e = S.entreprise || {};
  return `<header class="doc-tete"><div class="doc-emetteur">${e.logo ? `<img src="${e.logo}" alt="Logo">` : ""}<div><b>${esc(e.nom || "")}</b>${[e.adresse, e.tel, e.email].filter(Boolean).map(x => `<br>${esc(x)}`).join("")}</div></div>
  <div class="doc-titre"><h1>${esc(titre)}</h1>${numero ? `<p>N° <b>${esc(numero)}</b>${date ? `<br>${esc(date)}` : ""}</p>` : ""}</div></header>`;
}
// Ancien nom, gardé pour la fiche d'inventaire et les rapports
const enTeteDoc = () => { const e = S.entreprise || {}; return e.nom || e.logo ? `<div class="entete-doc">${e.logo ? `<img src="${e.logo}" alt="Logo">` : ""}<div><b>${esc(e.nom || "")}</b>${[e.adresse, e.tel, e.email].filter(Boolean).map(x => `<br>${esc(x)}`).join("")}</div></div>` : ""; };
function blocParties(ev) {
  const i = infoEv(ev), c = clientDe(ev);
  const cli = c ? [c.nom, c.tel, c.email, c.adresse].filter(Boolean) : [];
  const evl = [ev, i.debut ? (i.fin && i.fin !== i.debut ? `Du ${dateDoc(i.debut)} au ${dateDoc(i.fin)}` : `Le ${dateDoc(i.debut)}`) : "", i.adresse, i.contact ? "Contact sur place : " + i.contact : ""].filter(Boolean);
  const lignes = l => l.map((x, k) => k ? `<br>${esc(x)}` : `<b>${esc(x)}</b>`).join("");
  return `<div class="doc-parties"><div><small>${esc(motClients().replace(/s$/, ""))}</small>${cli.length ? lignes(cli) : `<span class="a-completer">à compléter</span>`}</div><div><small>${esc(V("imp"))}</small>${lignes(evl)}</div></div>`;
}
const blocSignatures = (gauche, droite) => `<div class="sign"><div>${gauche}</div><div>${droite}</div></div>`;

/* ---------------- Bon de sortie et de retour ---------------- */
function tBon(arg) {
  const b = bonDe(arg); if (!b) return vAccueil();
  const cp = complet(), sortie = b.type === "sortie", i = infoEv(b.evenement), c = clientDe(b.evenement);
  const pieces = b.lignes.reduce((t, [, q]) => t + q, 0);
  // La valeur de remplacement ne figure que sur le bon de sortie d'un loueur : c'est ce que le client accepte de payer en cas de casse.
  // Ailleurs (bon de retour, autres métiers), elle ne ferait que montrer au client ce que le matériel a coûté.
  const val = cp && sortie && estLoueur();
  const manq = b.manquants || [], valManq = manq.reduce((t, [id, q]) => t + q * art(id).prix, 0);
  const loueur = (moi().nom) || "";
  const table = cp
    ? `<table><thead><tr><th class="code">Code</th><th>Objet</th><th class="n">${sortie ? "Remis" : "Rendu"}</th>${val ? `<th class="n">Valeur de remplacement, l'unité</th>` : ""}</tr></thead><tbody>${b.lignes.map(([id, q]) => `<tr><td class="code">${id}</td><td>${esc(art(id).nom)}</td><td class="n">${q}</td>${val ? `<td class="n">${argent(art(id).prix)}</td>` : ""}</tr>`).join("") || `<tr><td colspan="3">Rien n'est revenu.</td></tr>`}</tbody>
      <tfoot><tr><td colspan="2">${pieces} pièce${pieces > 1 ? "s" : ""}</td><td class="n">${pieces}</td>${val ? "<td></td>" : ""}</tr></tfoot></table>`
    : `<table><thead><tr><th>Objet</th><th class="n">${sortie ? "Remis" : "Rendu"}</th></tr></thead><tbody>${b.lignes.map(([id, q]) => `<tr><td>${esc(art(id).nom)}</td><td class="n">${q}</td></tr>`).join("") || `<tr><td colspan="2">Rien n'est revenu.</td></tr>`}</tbody></table>`;
  const tableManq = manq.length ? `<h2>Manquants ou cassés, à refacturer</h2><table><tbody>${manq.map(([id, q]) => `<tr>${cp ? `<td class="code">${id}</td>` : ""}<td>${esc(art(id).nom)}</td><td class="n">${q}</td>${cp ? `<td class="n">${argent(q * art(id).prix)}</td>` : ""}</tr>`).join("")}</tbody>${cp ? `<tfoot><tr><td colspan="3">Total à refacturer</td><td class="n">${argent(valManq)}</td></tr></tfoot>` : ""}</table>` : "";
  const conditions = cp ? `<div class="doc-conditions">${sortie
    ? `${i.fin ? `<p>Retour prévu le <b>${dateDoc(i.fin)}</b>.</p>` : ""}${c && c.caution ? `<p>Caution versée : <b>${argent(c.caution)}</b>.</p>` : ""}<p>Le matériel est remis en bon état. Tout objet manquant ou cassé au retour est facturé à sa valeur de remplacement${val ? " indiquée ci-dessus" : ""}.</p>`
    : `<p>Matériel rendu le ${quand(b.date)}.${manq.length ? " Les manquants ci-dessus sont facturés à leur valeur de remplacement" + (c && c.caution ? ", retenue sur la caution." : ".") : " Tout est revenu."}</p>`}</div>` : "";
  return `<div class="feuille-doc">${cp ? teteDoc(sortie ? "Bon de sortie" : "Bon de retour", b.id, quand(b.date)) + blocParties(b.evenement) : `${enTeteDoc()}<h1>${sortie ? "Bon de sortie" : "Bon de retour"}</h1><p>${esc(b.evenement)}${c ? " · " + esc(c.nom) : ""}<br>${quand(b.date)} · n° ${b.id}</p>`}
    ${table}${tableManq}${conditions}
    ${b.photos.length ? `<div class="photos">${b.photos.map(p => `<img src="${p}" alt="Photo jointe au bon">`).join("")}</div>` : ""}
    ${blocSignatures(`Pour ${esc((S.entreprise || {}).nom || "le loueur")}<br><b>${esc(loueur)}</b>`, `Pour le client${b.signature ? `<img class="sig" src="${b.signature}" alt="Signature du client"><b>${esc(b.signataire)}</b> · ${quand(b.signeLe)}` : ""}`)}</div>
  <div class="t-actions pas-imprimer bon-gestes">
    ${b.signature ? "" : `<button class="btn plein" data-signer="${b.id}">Faire signer le client</button>`}
    ${cp && !c && session.profil !== "terrain" ? `<button class="btn" data-infos-ev="${esc(b.evenement)}">Ajouter le client, les dates et le lieu</button>` : ""}
    ${b.photos.length < 4 ? `<label class="btn">Ajouter des photos<input type="file" accept="image/*" capture="environment" multiple data-photos="${b.id}" class="cache"></label>` : ""}
    ${manq.length ? `<button class="btn" data-facture="${esc(b.evenement)}">Voir la facture de casse</button>` : ""}
    <button class="btn ${b.signature ? "plein" : ""}" data-act="partager">${I.partager}Envoyer au client</button>
    <button class="btn" data-act="imprimer">${I.imprimer}Imprimer ou PDF</button>
    <button class="btn" data-racine="accueil">Terminé</button></div>`;
}
function texteBon(arg) {
  const b = bonDe(arg), c = clientDe(b.evenement), i = infoEv(b.evenement), e = S.entreprise || {};
  const l = b.lignes.map(([id, q]) => `- ${art(id).nom} : ${q}`).join("\n"), m = (b.manquants || []).map(([id, q]) => `- ${art(id).nom} : ${q}`).join("\n");
  return `${e.nom ? e.nom + "\n" : ""}${b.type === "sortie" ? "Bon de sortie" : "Bon de retour"} n° ${b.id} · ${b.evenement}${c ? " · " + c.nom : ""} · ${quand(b.date)}\n${l}${m ? "\nManquants à refacturer :\n" + m : ""}${b.type === "sortie" && i.fin && complet() ? "\nRetour prévu le " + dateDoc(i.fin) : ""}${b.signature ? "\nSigné par " + b.signataire + " le " + quand(b.signeLe) : ""}`;
}

/* ---------------- Facture de casse ---------------- */
function vFacture(ev) {
  const l = S.mouvements.filter(m => m.type === "Perte" && m.refac && m.evenement === ev);
  const tot = l.reduce((t, m) => t + valeurM(m), 0), c = clientDe(ev), cp = complet();
  const n = "FC-" + new Date().getFullYear() + "-" + String(Math.max(1, S.evenements.indexOf(ev) + 1)).padStart(3, "0");
  const bon = S.bons.slice().reverse().find(b => b.evenement === ev && b.type === "retour");
  return `<div class="feuille-doc">${teteDoc("Facture de casse", n, "Établie le " + new Date().toLocaleDateString("fr-FR"))}${cp ? blocParties(ev) : `<p>Client : <b>${esc(c ? c.nom : ev)}</b>${c && c.tel ? " · " + esc(c.tel) : ""}<br>${esc(V("imp"))} : ${esc(ev)}</p>`}
  ${bon && bon.signataire ? `<p class="petit">Bon de retour n° ${bon.id}, signé par ${esc(bon.signataire)} le ${quand(bon.signeLe)}.</p>` : ""}
  <table><thead><tr>${cp ? '<th class="code">Code</th>' : ""}<th>Objet</th><th class="n">Qté</th><th class="n">Valeur de remplacement</th><th class="n">Montant</th></tr></thead><tbody>
  ${l.map(m => `<tr>${cp ? `<td class="code">${m.article}</td>` : ""}<td>${esc(art(m.article).nom)}${m.motif ? `<br><small>${esc(m.motif)}</small>` : ""}</td><td class="n">${m.qte}</td><td class="n">${argent(art(m.article).prix)}</td><td class="n">${argent(valeurM(m))}</td></tr>`).join("") || `<tr><td colspan="${cp ? 5 : 4}">Aucune casse refacturable.</td></tr>`}</tbody>
  <tfoot><tr><td colspan="${cp ? 4 : 3}">Total</td><td class="n">${argent(tot)}</td></tr>
  ${c && c.caution ? `<tr><td colspan="${cp ? 4 : 3}">Retenu sur la caution de ${argent(c.caution)}</td><td class="n">− ${argent(Math.min(tot, c.caution))}</td></tr><tr class="fort"><td colspan="${cp ? 4 : 3}">${tot > c.caution ? "Reste à payer" : "Caution à rendre"}</td><td class="n">${argent(Math.abs(tot - c.caution))}</td></tr>` : ""}</tfoot></table>
  <div class="doc-conditions"><p>À régler à réception${c && c.caution ? ", après retenue sur la caution" : ""}. Les photos et la signature du bon de retour font foi.</p></div></div>
  <div class="t-actions pas-imprimer">${tot ? `<button class="btn plein" data-partager-facture="${esc(ev)}">${I.partager}Envoyer au client</button>` : ""}
    <button class="btn" data-act="imprimer">${I.imprimer}Imprimer ou PDF</button>${cp && !c && session.profil !== "terrain" ? `<button class="btn" data-infos-ev="${esc(ev)}">Ajouter le client</button>` : ""}</div>`;
}
function texteFacture(ev) {
  const l = S.mouvements.filter(m => m.type === "Perte" && m.refac && m.evenement === ev), c = clientDe(ev);
  const tot = l.reduce((t, m) => t + valeurM(m), 0);
  return `${(S.entreprise || {}).nom || ""}\nFacture de casse · ${ev}${c ? " · " + c.nom : ""}\n${l.map(m => `- ${art(m.article).nom} : ${m.qte} × ${argent(art(m.article).prix)}`).join("\n")}\nTotal : ${argent(tot)}${c && c.caution ? `\nRetenu sur la caution : ${argent(Math.min(tot, c.caution))}\n${tot > c.caution ? "Reste à payer : " + argent(tot - c.caution) : "Caution à rendre : " + argent(c.caution - tot)}` : ""}`;
}

/* ---------------- Devis de location (loueurs) ---------------- */
const aDesPrixLocation = () => S.articles.some(a => a.loc);
function vDevisLocation(id) {
  const r = S.reservations.find(x => x.id === id); if (!r) return bReservations();
  const c = clientDe(r.nom), lignes = r.lignes.filter(([aid]) => art(aid).loc);
  const ht = lignes.reduce((t, [aid, q]) => t + q * art(aid).loc, 0), valeur = r.lignes.reduce((t, [aid, q]) => t + q * art(aid).prix, 0);
  const caution = c && c.caution ? c.caution : Math.max(50, Math.round(valeur * .2 / 10) * 10);
  const jours = r.fin && r.debut ? Math.round((new Date(r.fin) - new Date(r.debut)) / 864e5) + 1 : 1;
  return `<div class="feuille-doc">${teteDoc("Devis de location", "DL-" + r.id.replace(/\D/g, "").padStart(4, "0"), "Établi le " + new Date().toLocaleDateString("fr-FR") + ", valable 15 jours")}${blocParties(r.nom)}
  <table><thead><tr><th>Objet</th><th class="n">Qté</th><th class="n">Prix unitaire</th><th class="n">Montant HT</th></tr></thead><tbody>
  ${lignes.map(([aid, q]) => `<tr><td>${esc(art(aid).nom)}</td><td class="n">${q}</td><td class="n">${argent(art(aid).loc)}</td><td class="n">${argent(q * art(aid).loc)}</td></tr>`).join("")}</tbody>
  <tfoot><tr class="fort"><td colspan="3">Total HT</td><td class="n">${argent(ht)}</td></tr><tr><td colspan="3">Caution demandée, rendue au retour du matériel complet</td><td class="n">${argent(caution)}</td></tr></tfoot></table>
  <div class="doc-conditions"><p>Matériel ${r.adresse ? "livré à l'adresse indiquée" : "à retirer au dépôt"}${jours > 1 ? `, pour ${jours} jours` : ""}. Tout objet manquant ou cassé est facturé à sa valeur de remplacement. Réservation ferme à réception du devis signé et de la caution.</p></div>
  ${blocSignatures(`Pour ${esc((S.entreprise || {}).nom || "le loueur")}`, "Bon pour accord, date et signature du client")}</div>
  <div class="t-actions pas-imprimer"><button class="btn plein" data-act="partagerDevisLoc">${I.partager}Envoyer au client</button><button class="btn" data-act="imprimer">${I.imprimer}Imprimer ou PDF</button>${c ? "" : `<button class="btn" data-infos-ev="${esc(r.nom)}">Ajouter le client</button>`}</div>`;
}
function texteDevisLocation(id) {
  const r = S.reservations.find(x => x.id === id), c = clientDe(r.nom), lignes = r.lignes.filter(([aid]) => art(aid).loc);
  return `${(S.entreprise || {}).nom || ""}\nDevis de location · ${r.nom}${c ? " · " + c.nom : ""}\n${dateDoc(r.debut)}${r.fin !== r.debut ? " au " + dateDoc(r.fin) : ""}\n${lignes.map(([aid, q]) => `- ${q} × ${art(aid).nom} : ${argent(q * art(aid).loc)}`).join("\n")}\nTotal HT : ${argent(lignes.reduce((t, [aid, q]) => t + q * art(aid).loc, 0))}`;
}

/* ---------------- Exports Excel ---------------- */
const NOMS_GESTES = { "Fiche": "Fiche de l'article", "Envoi": "Envoi à un autre établissement", "Prêt": "Sortie (prêt)", "Retour": "Retour", "Sortie": "Sortie", "Entrée": "Entrée", "Perte": "Perte ou casse", "Ajustement": "Correction de comptage", "Inventaire initial": "Inventaire initial", "Réparation": "Envoi à l'atelier", "Retour réparation": "Retour de l'atelier", "Contrôle": "Contrôle périodique", "Transfert": "Transfert entre lieux" };
const sousTitreExport = () => `Exporté le ${new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })} par ${moi().nom || "?"} · ${S.monnaie === "XOF" ? "montants en francs CFA" : "montants en euros"}`;
const nomEntreprise = () => (S.entreprise || {}).nom || "Stock";
const fichier = n => `${nomEntreprise().replace(/\s*\(démo\)/, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}-${n.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}-${aujourdHui()}.xlsx`;
function exporterJournal() {
  const cp = complet(), prix = droit("prix");
  const colonnes = [{ t: "Date et heure", l: 17, f: "dateheure" }, { t: "Par", l: 12 }, { t: "Geste", l: 22 }, { t: "Code", l: 11 }, { t: "Objet", l: 32 }, { t: "Quantité", l: 10, f: "entier", somme: false }, { t: V("imp"), l: 30 }]
    .concat(lieuxActifs() ? [{ t: "Lieu", l: 22 }] : [], cp ? [{ t: motClients().replace(/s$/, ""), l: 26 }, { t: "Motif", l: 24 }] : [], prix ? [{ t: "Valeur", l: 14, f: "argent", somme: false }] : []);
  const lignes = S.mouvements.slice().sort((a, b) => a.date - b.date).map(m => {
    const ev = m.evenement || m.imputation || "", c = ev ? clientDe(ev) : null;
    return [m.date, m.qui || "", (NOMS_GESTES[m.type] || m.type) + (m.annule ? " (annulation)" : ""), m.article, art(m.article).nom, m.qte, ev].concat(lieuxActifs() ? [m.type === "Transfert" ? `${nomLieu(m.de)} → ${nomLieu(m.vers)}` : nomLieu(m.lieu || "")] : [], cp ? [c ? c.nom : "", m.motif || ""] : [], prix ? [m.type === "Transfert" ? 0 : valeurM(m)] : []);
  });
  telechargerXlsx(fichier("journal"), [{ nom: "Journal", titre: `${nomEntreprise()} · Journal des mouvements`, sousTitre: sousTitreExport() + ". Rien ne s'efface : une erreur se corrige par une nouvelle ligne.", colonnes, lignes }]);
  toast("Journal exporté en Excel.");
}
function exporterFinAnnee() {
  const annee = new Date().getFullYear(), debut = new Date(annee, 0, 1).getTime(), cp = complet();
  const stockL = S.articles.map(a => {
    const q = Math.max(0, stock(a.id)), at = totalAtelier(a.id), dh = dehors(a.id).reduce((t, d) => t + d.qte, 0);
    return [a.id, a.nom, (S.emplacements.find(e => e.id === a.emp) || {}).nom || "", q, at, dh, q + at + dh, a.prix, (q + at + dh) * a.prix];
  });
  const pertes = S.mouvements.filter(m => m.type === "Perte" && m.date >= debut).map(m => [m.date, m.article, art(m.article).nom, m.qte, m.motif || "", m.evenement || "", m.refac ? "oui" : "non", valeurM(m)]);
  const feuilles = [
    { nom: "Stock valorisé", titre: `${nomEntreprise()} · Inventaire valorisé au ${new Date().toLocaleDateString("fr-FR")}`, sousTitre: sousTitreExport(), total: true,
      colonnes: [{ t: "Code", l: 11 }, { t: "Objet", l: 32 }, { t: "Emplacement", l: 28 }, { t: "Au dépôt", l: 11, f: "entier" }, { t: "À l'atelier", l: 11, f: "entier" }, { t: "Chez les clients", l: 12, f: "entier" }, { t: "Total possédé", l: 12, f: "entier" }, { t: "Prix unitaire", l: 13, f: "argent", somme: false }, { t: "Valeur", l: 15, f: "argent" }], lignes: stockL },
    { nom: `Pertes ${annee}`, titre: `${nomEntreprise()} · Pertes et casse de l'année ${annee}`, sousTitre: "Pour sortir de l'inventaire les objets perdus, avec leur motif.", total: true,
      colonnes: [{ t: "Date", l: 17, f: "dateheure" }, { t: "Code", l: 11 }, { t: "Objet", l: 30 }, { t: "Quantité", l: 10, f: "entier" }, { t: "Motif", l: 22 }, { t: V("imp"), l: 28 }, { t: "Refacturable", l: 12 }, { t: "Valeur", l: 14, f: "argent" }], lignes: pertes },
  ];
  if (cp) {
    const v = stockL.reduce((t, l) => t + l[8], 0), p = pertes.reduce((t, l) => t + l[7], 0), r = pertes.filter(l => l[6] === "oui").reduce((t, l) => t + l[7], 0);
    feuilles.unshift({ nom: "Résumé", titre: `${nomEntreprise()} · Inventaire de fin d'année ${annee}`, sousTitre: sousTitreExport(),
      colonnes: [{ t: "Indicateur", l: 44 }, { t: "Montant", l: 18, f: "argent" }, { t: "Nombre", l: 12, f: "entier" }],
      lignes: [["Valeur du stock possédé (dépôt, atelier, chez les clients)", v, stockL.length], ["Pertes et casse de l'année", p, pertes.length], ["dont refacturable aux clients", r, null], ["dont à la charge de l'entreprise", p - r, null]] });
  }
  telechargerXlsx(fichier("inventaire-" + annee), feuilles);
  toast("Inventaire de fin d'année exporté en Excel.");
}
function exporterClients() {
  const cl = S.clientsLoc || [];
  const evs = [...new Set(S.reservations.map(r => r.nom).concat(Object.keys(S.infosEv || {}), Object.keys(S.clientsEv || {})))];
  telechargerXlsx(fichier(motClients().toLowerCase()), [
    { nom: motClients(), titre: `${nomEntreprise()} · ${motClients()}`, sousTitre: sousTitreExport(), total: true,
      colonnes: [{ t: "Nom", l: 30 }, { t: "Type", l: 13 }, { t: "Téléphone", l: 16 }, { t: "E-mail", l: 26 }, { t: "Adresse", l: 32 }, { t: "Caution versée", l: 14, f: "argent" }, { t: "Événements", l: 11, f: "entier" }, { t: "Casse refacturable", l: 16, f: "argent" }],
      lignes: cl.map(c => { const e = evenementsDe(c); return [c.nom, c.type || "", c.tel || "", c.email || "", c.adresse || "", c.caution || 0, e.length, e.reduce((t, ev) => t + casseDe(ev), 0)]; }) },
    { nom: "Événements", titre: `${nomEntreprise()} · ${V("imps").replace(/^./, x => x.toUpperCase())}`, sousTitre: sousTitreExport(), total: true,
      colonnes: [{ t: V("imp"), l: 32 }, { t: motClients().replace(/s$/, ""), l: 28 }, { t: "Début", l: 12, f: "date" }, { t: "Fin", l: 12, f: "date" }, { t: "Lieu", l: 32 }, { t: "Pièces sorties", l: 12, f: "entier" }, { t: "Encore dehors", l: 12, f: "entier" }, { t: "Casse refacturable", l: 16, f: "argent" }],
      lignes: evs.map(ev => { const i = infoEv(ev), c = clientDe(ev); return [ev, c ? c.nom : "", i.debut ? new Date(i.debut + "T12:00:00").getTime() : null, i.fin ? new Date(i.fin + "T12:00:00").getTime() : null, i.adresse, S.mouvements.filter(m => m.evenement === ev && m.type === "Prêt").reduce((t, m) => t + m.qte, 0), dehors().filter(d => d.evenement === ev).reduce((t, d) => t + d.qte, 0), casseDe(ev)]; }) },
  ]);
  toast(`${motClients()} et ${motImps()} exportés en Excel.`);
}

function brancherDocuments() {
  $$("[data-client]").forEach(b => b.onclick = () => aller("client", b.dataset.client));
  $$("[data-modifier-client]").forEach(b => b.onclick = () => feuilleClient(b.dataset.modifierClient));
  $$("[data-infos-ev]").forEach(b => b.onclick = () => feuilleEvenement(b.dataset.infosEv));
  $$("[data-niveau]").forEach(b => b.onclick = () => { S.detail = b.dataset.niveau; sauver(); rendre(); toast(`Niveau de détail : ${NIVEAUX[S.detail].nom}.`); });
}

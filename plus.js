"use strict";
/* Réservations et disponibilité, liste de préparation, signature et photos, facture de casse, démo guidée.
   Chargé avant app.js : les fonctions utilisent l'état et les outils d'app.js au moment où elles tournent. */

const JOUR_MS = 86400000;
const isoJour = t => { const d = new Date(t); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const aujourdHui = () => isoJour(Date.now());
const dateLongue = iso => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const dateCourte = iso => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const chevauche = (r, d1, d2) => r.debut <= d2 && r.fin >= d1;

/* ---------------- Disponibilité ---------------- */
// Ce que l'entreprise possède : au dépôt + chez les clients (la casse est déjà déduite).
const possede = id => Math.max(0, stock(id)) + dehors(id).reduce((t, d) => t + d.qte, 0);
// Quantité déjà prise sur la période, et par qui.
function prisSur(id, d1, d2, sauf) {
  let total = 0; const qui = [];
  const evResa = new Set(S.reservations.map(r => r.nom));
  S.reservations.filter(r => r.id !== sauf && chevauche(r, d1, d2) && r.statut !== "Revenue").forEach(r => {
    const q = r.statut === "Partie" ? dehors(id).filter(d => d.evenement === r.nom).reduce((t, d) => t + d.qte, 0) : (r.lignes.find(l => l[0] === id) || [0, 0])[1];
    if (q > 0) { total += q; qui.push({ nom: r.nom, q, fin: r.fin }); }
  });
  // Sorties faites sans réservation : on les considère absentes jusqu'à demain.
  if (d1 <= isoJour(Date.now() + JOUR_MS)) dehors(id).filter(d => !evResa.has(d.evenement)).forEach(d => { total += d.qte; qui.push({ nom: d.evenement, q: d.qte, fin: "" }); });
  return { total, qui };
}
const dispoSur = (id, d1, d2, sauf) => possede(id) - prisSur(id, d1, d2, sauf).total;

/* ---------------- Bureau : réservations ---------------- */
let rechercheDispo = null; // { d1, d2 }
// Une question (« est-ce libre ? ») et sa réponse en lignes, puis ce qui est déjà réservé. Six lignes d'abord, la suite d'un toucher.
const RESA_VUES = 6, PUCE_RESA = { "Confirmée": "neutre", "Préparée": "compter", "Partie": "sortie", "Revenue": "retour" };
let dispoTout = false, resasTout = false;
const periodeResa = (d1, d2, court) => { const f = court ? dateCourte : dateLongue; return d2 && d2 !== d1 ? `Du ${f(d1)} au ${f(d2)}` : `Le ${f(d1)}`; };
function bReservations() {
  const d1 = (rechercheDispo && rechercheDispo.d1) || isoJour(Date.now() + 3 * JOUR_MS);
  const d2 = (rechercheDispo && rechercheDispo.d2) || d1;
  if (entree) { dispoTout = false; resasTout = false; }
  const avenir = S.reservations.filter(r => r.fin >= aujourdHui() && r.statut !== "Revenue").sort((a, b) => a.debut.localeCompare(b.debut)), n = avenir.length;
  const suite = (reste, attr, mot) => reste > 0 ? `<li><button class="es-ligne es-suite" ${attr}><span>${reste > 1 ? `Afficher les ${reste} ${mot}` : "Afficher la dernière ligne"}</span><span class="chev">${I.chevron}</span></button></li>` : "";
  const libres = S.articles.map(a => { const p = prisSur(a.id, d1, d2), tout = possede(a.id), libre = Math.max(0, tout - p.total);
    return piLigne({ g: img(a), t: esc(a.nom), s: (p.qui.length ? p.qui.map(x => `${x.q} pour ${esc(x.nom)}`).join(", ") : p.total ? `${p.total} déjà pris` : "Rien de pris") + ` · ${tout} en tout`, v: `<span class="${libre ? "" : "pi-rouge"}">${libre}</span><small>${libre > 1 ? "libres" : "libre"}</small>` }); });
  const venir = avenir.map(r => piLigne({ c: PUCE_RESA[r.statut] || "neutre", t: esc(r.nom), s: `${esc(r.statut)} · ${periodeResa(r.debut, r.fin, true).replace(/^(Du|Le) /, "").replace(" au ", " → ")} · ${r.lignes.reduce((t, l) => t + l[1], 0)} pièces`, a: `data-resa="${r.id}"` }));
  const vusL = dispoTout || libres.length <= RESA_VUES + 1 ? libres : libres.slice(0, RESA_VUES), vusV = resasTout || venir.length <= RESA_VUES + 1 ? venir : venir.slice(0, RESA_VUES);
  return `<h1>Réservations</h1><div class="pi-page">
  ${sousAide(!n ? "Aucune réservation à venir." : `${n === 1 ? "Une réservation" : (EN_LETTRES[n] || n) + " réservations"} à venir.`, `Un client demande « ${esc(V("question") || "Avez-vous 300 chaises le 14 ?")} » Choisissez les dates : la réponse tient compte de ce qui est déjà réservé et de ce qui revient d'ici là.`)}
  <section class="es-carte pi-carte pi-dispo"><h2>Qu'est-ce qui est libre ?</h2>
    <form class="dispo-dates" data-form="dispo">
      <label class="champ">Du<input type="date" name="d1" value="${d1}" min="${aujourdHui()}"></label>
      <label class="champ">Au<input type="date" name="d2" value="${d2}" min="${aujourdHui()}"></label>
      <button class="btn">Voir ce qui est libre</button>
    </form>
    <ul class="es-lignes">${vusL.join("")}${suite(libres.length - vusL.length, "data-dispo-tout", "autres objets")}</ul>
  </section>
  <div class="pi-boutons"><button class="btn plein" data-nouvelle-resa="${d1}|${d2}">${I.jour}Réserver pour ces dates</button></div>
  <section class="es-carte pi-carte"><h2>À venir</h2>${venir.length ? `<ul class="es-lignes">${vusV.join("")}${suite(venir.length - vusV.length, "data-resas-tout", "autres réservations")}</ul>` : `<p class="es-rien">Aucune réservation à venir.</p>`}</section></div>`;
}
function bReservation(id) {
  const r = S.reservations.find(x => x.id === id); if (!r) return `<h1>Réservation</h1><div class="pi-page"><p class="es-etat">Réservation introuvable.</p></div>`;
  const cl = clientDe(r.nom), aIndiquer = `<span class="pi-gris">à indiquer</span>`;
  const infos = [piLigne({ t: "Client", v: cl ? esc(cl.nom) : aIndiquer, a: cl ? `data-client="${cl.id}"` : `data-infos-ev="${esc(r.nom)}"` })]
    .concat(complet() ? [piLigne({ t: "Lieu", v: r.adresse ? esc(r.adresse) : aIndiquer }), piLigne({ t: "Contact sur place", v: r.contact ? esc(r.contact) : aIndiquer })] : []);
  const objets = r.lignes.map(([aid, q]) => { const libre = dispoSur(aid, r.debut, r.fin, r.id), a = art(aid);
    return piLigne({ g: img(a), t: esc(a.nom), s: libre < q ? `<span class="pi-rouge">Il en manque ${q - libre}</span>` : `${libre} ${libre > 1 ? "libres" : "libre"} ces jours-là`, v: q }); });
  return `<h1>${esc(r.nom)}</h1><div class="pi-page">
  <p class="es-etat">${periodeResa(r.debut, r.fin)} · <span class="pi-etatl" style="--c:var(--${PUCE_RESA[r.statut] || "neutre"})">${esc(r.statut)}</span></p>
  ${piCarte("", infos, "", "pi-infos")}
  <div class="pi-boutons">${aDesPrixLocation() ? `<button class="btn plein" data-aller="devisLoc" data-arg="${r.id}">${I.bon}Devis de location</button>` : ""}<button class="btn" data-infos-ev="${esc(r.nom)}">Client, dates, lieu</button></div>
  ${piCarte("Matériel réservé", objets)}
  ${r.statut === "Confirmée" ? `<p class="pi-note">Le jour du départ, cette réservation devient la liste de préparation du dépôt.</p><p class="es-pied"><button class="es-lien" data-annuler-resa="${r.id}">Annuler la réservation</button></p>` : ""}</div>`;
}
function feuilleReservation(d1, d2) {
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="trz" class="pi-f"><h1 id="trz">Nouvelle réservation</h1>
    <label class="champ">Client<select name="client"><option value="">Sans fiche client</option>${(S.clientsLoc || []).map(c => `<option value="${c.id}">${esc(c.nom)}</option>`).join("")}</select></label>
    <label class="champ">Événement<input name="nom" maxlength="60" placeholder="Mariage · samedi, Séminaire…" autocomplete="off"></label>
    ${complet() ? `<label class="champ">Lieu ou adresse<input name="adresse" maxlength="120" autocomplete="off"></label><label class="champ">Contact sur place<input name="contact" maxlength="80" placeholder="Nom et téléphone" autocomplete="off"></label>` : ""}
    <div class="dispo-dates"><label class="champ">Du<input type="date" name="d1" value="${d1}" min="${aujourdHui()}"></label><label class="champ">Au<input type="date" name="d2" value="${d2}" min="${aujourdHui()}"></label></div>
    <div class="resa-lignes">${S.articles.map(a => `<label class="resa-ligne">${img(a)}<span><b>${esc(a.nom)}</b><small data-libre="${a.id}"></small></span><input type="number" inputmode="numeric" min="0" value="0" name="${a.id}" aria-label="Quantité : ${esc(a.nom)}"></label>`).join("")}</div>
    <p class="message" data-bilan role="status"></p>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Réserver</button></div></div>`);
  const val = n => f.querySelector(`[name="${n}"]`).value;
  const maj = () => {
    let manque = 0;
    S.articles.forEach(a => {
      const libre = dispoSur(a.id, val("d1"), val("d2") || val("d1")), q = +val(a.id) || 0, el = f.querySelector(`[data-libre="${a.id}"]`);
      el.textContent = q > libre ? `Il en manque ${q - libre} : ${libre} libres` : `${libre} libres ces jours-là`;
      el.className = q > libre ? "rouge" : "";
      if (q > libre) manque += 1;
    });
    f.querySelector("[data-bilan]").textContent = manque ? `${manque} objet${manque > 1 ? "s" : ""} en quantité insuffisante.` : "";
    return manque;
  };
  f.querySelectorAll("input").forEach(i => i.oninput = maj); maj();
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const nom = val("nom").trim(), a1 = val("d1"), a2 = val("d2") || a1;
    if (!nom) return toast("Indiquez l'événement ou le client.");
    if (a2 < a1) return toast("La date de fin est avant la date de début.");
    const lignes = S.articles.map(a => [a.id, Math.max(0, Math.floor(+val(a.id) || 0))]).filter(l => l[1] > 0);
    if (!lignes.length) return toast("Indiquez au moins une quantité.");
    if (maj() && !confirm("Certaines quantités ne sont pas disponibles. Réserver quand même ?")) return;
    const id = "R-" + String(S.reservations.length + 1).padStart(3, "0");
    const extra = n => { const e = f.querySelector(`[name=${n}]`); return e ? e.value.trim() : ""; };
    S.reservations.push({ id, nom, debut: a1, fin: a2, lignes, statut: "Confirmée", charge: {}, client: f.querySelector("[name=client]").value, adresse: extra("adresse"), contact: extra("contact") });
    if (!S.evenements.includes(nom)) S.evenements.unshift(nom);
    sauver(); f.remove(); aller("reservation", id); toast("Réservation enregistrée.");
  };
}

/* ---------------- Terrain : liste de préparation ---------------- */
function tPreparer() {
  const l = S.reservations.filter(r => ["Confirmée", "Préparée"].includes(r.statut) && r.debut <= isoJour(Date.now() + 10 * JOUR_MS)).sort((a, b) => a.debut.localeCompare(b.debut));
  return `<h1>Préparer un départ</h1><p class="sous">Choisissez ${esc(V("leDepart") || "le départ")}.</p>
  <ul class="t-liste dp">${l.map(r => { const tot = r.lignes.reduce((t, x) => t + x[1], 0), ch = r.lignes.reduce((t, x) => t + Math.min(x[1], r.charge[x[0]] || 0), 0);
    return `<li><button data-prep="${r.id}">${pic(I.camion)}<span><b>${esc(r.nom)}</b><small>${dateCourte(r.debut)} · ${ch} / ${tot} pièces chargées</small></span><span class="n">${Math.round(ch / tot * 100)} %</span></button></li>`; }).join("") || `<li class="vide">Aucun départ prévu dans les 10 jours.</li>`}</ul>`;
}
function tPreparation(id) {
  const r = S.reservations.find(x => x.id === id); if (!r) return tPreparer();
  const reste = r.lignes.filter(([aid, q]) => (r.charge[aid] || 0) < q), faites = r.lignes.filter(([aid, q]) => (r.charge[aid] || 0) >= q);
  const tot = r.lignes.reduce((t, x) => t + x[1], 0), ch = r.lignes.reduce((t, x) => t + Math.min(x[1], r.charge[x[0]] || 0), 0);
  // Une ligne pas commencée n'a ni liseré ni bouton « − » : rien à retirer, rien à signaler.
  const ligne = ([aid, q]) => { const a = art(aid), c = r.charge[aid] || 0, lot = a.lot || 1, ok = c >= q;
    return `<li><div class="prep-ligne ${ok ? "ok" : c ? "" : "vide"}">${img(a)}<span><b>${esc(a.nom)}</b><small>${c} / ${q}${lot > 1 ? ` · 1 scan = ${lot}` : ""}</small><i class="barre"><i style="width:${Math.min(100, c / q * 100)}%"></i></i></span>
      <span class="prep-boutons">${c ? `<button class="btn petit" data-charge="${aid}|${-lot}" aria-label="Retirer ${lot}">−</button>` : ""}${ok ? "" : `<button class="btn petit plein" data-charge="${aid}|${lot}" aria-label="Ajouter ${lot}">+${lot}</button>`}</span></div></li>`; };
  // Le bilan est un compte, pas une alerte : ce qui manque n'est nommé que lorsqu'il reste peu de lignes, et « Le camion part » le redemande.
  const bilan = !reste.length ? "Tout est chargé."
    : `<b>${ch} / ${tot}</b> chargés<i class="barre"><i style="width:${tot ? Math.round(ch / tot * 100) : 0}%"></i></i>${ch && reste.length <= 2 ? `<small>Reste : ${reste.map(([aid, q]) => `${q - (r.charge[aid] || 0)} ${esc(art(aid).nom.toLowerCase())}`).join(", ")}</small>` : ""}`;
  return `<h1>${esc(r.nom)}</h1><p class="sous">Départ ${dateLongue(r.debut)}</p>
  <div class="prep-bilan dp ${reste.length ? "encours" : "complet"}" role="status">${bilan}</div>
  <button class="t-scan petit" data-act="scanRafale">${I.scan}<b>Scanner en chargeant</b><span>Un bip par ${esc(V("chaque") || "caisse")}</span></button>
  ${reste.length ? `<ul class="t-liste prep dp">${reste.map(ligne).join("")}</ul>` : ""}
  ${faites.length ? `<details class="prep-faites dp"><summary>${faites.length} ligne${faites.length > 1 ? "s" : ""} complète${faites.length > 1 ? "s" : ""}</summary><ul class="t-liste prep dp">${faites.map(ligne).join("")}</ul></details>` : ""}
  <div class="t-actions prep-depart"><button class="t-action sortie" data-act="camionPart">${I.sortie}<span>Le camion part<small>Crée le bon de sortie</small></span></button></div>`;
}
function charger1(r, aid, delta) {
  const q = (r.lignes.find(l => l[0] === aid) || [0, 0])[1];
  r.charge[aid] = Math.max(0, Math.min(q + (art(aid).lot || 1) * 2, (r.charge[aid] || 0) + delta));
  if (r.statut === "Confirmée") r.statut = "Préparée";
  sauver();
}
function scanPreparation(aid) {
  const r = S.reservations.find(x => x.id === vue.arg);
  if (!r) return;
  if (!r.lignes.some(l => l[0] === aid)) { toast(`${art(aid) ? art(aid).nom : aid} n'est pas prévu pour cet événement.`); return; }
  charger1(r, aid, art(aid).lot || 1); rendre();
  const c = r.charge[aid], q = r.lignes.find(l => l[0] === aid)[1];
  toast(`${art(aid).nom} : ${c} / ${q}${c > q ? " · trop chargé" : ""}`);
}
function camionPart() {
  const r = S.reservations.find(x => x.id === vue.arg);
  const lignes = r.lignes.map(([aid]) => [aid, Math.min(r.charge[aid] || 0, Math.max(0, stock(aid)))]).filter(l => l[1] > 0);
  const manque = r.lignes.filter(([aid, q]) => (r.charge[aid] || 0) < q);
  if (!lignes.length) return toast("Rien n'est chargé.");
  // C'est ici, au moment de partir, que l'appli nomme ce qui manque.
  const detail = manque.slice(0, 4).map(([aid, q]) => `${q - (r.charge[aid] || 0)} ${art(aid).nom.toLowerCase()}`).join(", ") + (manque.length > 4 ? ` et ${manque.length - 4} autre${manque.length > 5 ? "s" : ""}` : "");
  if (manque.length && !confirm(`Il manque encore : ${detail}. Le camion part quand même ?`)) return;
  lignes.forEach(([aid, q]) => mouvement(aid, "Prêt", q, { evenement: r.nom }));
  r.statut = "Partie";
  aller("bon", creerBon({ type: "sortie", evenement: r.nom, date: Date.now(), lignes }));
}

/* ---------------- Bons enregistrés, signature, photos ---------------- */
// Un seul bon par événement et par jour : tant que le client n'a pas signé, ce qui part ou revient s'y ajoute.
const fusionner = (l, ajout) => (ajout || []).forEach(([id, q]) => { const x = l.find(y => y[0] === id); if (x) x[1] += q; else l.push([id, q]); });
function creerBon(b) {
  const ouvert = S.bons.find(x => x.type === b.type && x.evenement === b.evenement && !x.signature && isoJour(x.date) === isoJour(b.date || Date.now()));
  if (ouvert) { fusionner(ouvert.lignes, b.lignes); if (b.manquants && b.manquants.length) { ouvert.manquants = ouvert.manquants || []; fusionner(ouvert.manquants, b.manquants); } sauver(); return ouvert.id; }
  const id = "B-" + String(S.bons.reduce((m, x) => Math.max(m, +x.id.slice(2) || 0), 0) + 1).padStart(4, "0");
  S.bons.push(Object.assign({ id, signature: "", signataire: "", photos: [] }, b));
  sauver(); return id;
}
const bonDe = arg => typeof arg === "string" ? S.bons.find(b => b.id === arg) : arg;
function feuilleSignature(bid) {
  const b = S.bons.find(x => x.id === bid);
  const f = ouvrirFeuille(`<div class="f-geste" role="dialog" aria-modal="true" aria-labelledby="tsg"><h1 id="tsg" style="font-size:26px">Signature du client</h1>
    <p class="sous">${b.type === "sortie" ? "Le client confirme avoir reçu le matériel ci-dessus." : "Le client confirme le retour et les manquants indiqués."}</p>
    <label class="champ">Nom du signataire<input name="nom" maxlength="50" autocomplete="off"></label>
    <canvas class="signature" width="600" height="220" aria-label="Zone de signature"></canvas>
    <p class="dp-effacer"><button class="btn petit" data-effacer>Effacer</button></p>
    <div class="valider colle"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Valider la signature</button></div></div>`);
  f.onclick = null;
  const cv = f.querySelector("canvas"), cx = cv.getContext("2d");
  cx.lineWidth = 3.2; cx.lineCap = "round"; cx.strokeStyle = "#101418";
  let trace = false, vide = true;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
  cv.onpointerdown = e => { trace = true; vide = false; cv.setPointerCapture(e.pointerId); cx.beginPath(); cx.moveTo(...pos(e)); };
  cv.onpointermove = e => { if (trace) { cx.lineTo(...pos(e)); cx.stroke(); } };
  cv.onpointerup = () => { trace = false; };
  f.querySelector("[data-effacer]").onclick = () => { cx.clearRect(0, 0, cv.width, cv.height); vide = true; };
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const nom = f.querySelector("[name=nom]").value.trim();
    if (!nom) return toast("Indiquez le nom du signataire.");
    if (vide) return toast("Le client doit signer dans le cadre.");
    b.signature = cv.toDataURL("image/png"); b.signataire = nom; b.signeLe = Date.now();
    sauver(); f.remove(); rendre(); toast("Signé.");
  };
}
function ajouterPhotos(bid, fichiers) {
  const b = S.bons.find(x => x.id === bid);
  [...fichiers].slice(0, 4 - b.photos.length).forEach(fi => {
    const lect = new FileReader();
    lect.onload = () => {
      const im = new Image();
      im.onload = () => {
        // Réduite à 640 px : assez pour prouver la casse, assez léger pour un vieux téléphone.
        const k = Math.min(1, 640 / Math.max(im.width, im.height)), cv = document.createElement("canvas");
        cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
        cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
        b.photos.push(cv.toDataURL("image/jpeg", .62));
        try { sauver(); } catch (e) { b.photos.pop(); toast("Mémoire du téléphone pleine pour la démo."); }
        rendre();
      };
      im.src = lect.result;
    };
    lect.readAsDataURL(fi);
  });
}

/* ---------------- Démo guidée ---------------- */
let tour = null;
function connecterRole(role) {
  const u = S.equipe.find(x => x.role === role && x.actif);
  session = { uid: u.id, nom: u.nom, profil: u.role, admin: !!u.admin }; verrouille = false; installateur = false; pile = []; tableauEntier = false;
}
const ETAPES = [
  { t: "Ousmane, magasinier, prépare le mariage de samedi. La réservation est devenue sa liste de préparation.", f: () => { connecterRole("terrain"); aller("preparation", "R-001"); } },
  { t: "Il scanne chaque caisse en chargeant. Ici, un casier de verres n'est pas encore chargé : l'appli le dit avant que le camion parte.", f: () => {
      const r = S.reservations.find(x => x.id === "R-001"); r.lignes.forEach(([aid, q]) => { r.charge[aid] = q; }); r.charge["ART-0004"] -= art("ART-0004").lot || 1; r.statut = "Préparée"; sauver(); rendre(); } },
  { t: "Le casier est chargé, le camion part. Le bon de sortie est prêt : le client le signe sur le téléphone, puis le reçoit par WhatsApp.", f: () => {
      const r = S.reservations.find(x => x.id === "R-001"); r.charge["ART-0004"] = r.lignes.find(l => l[0] === "ART-0004")[1]; sauver(); camionPart(); } },
  { t: "Moussa, le chauffeur, a sa tournée : adresse, appel, itinéraire. Chez le client, il fait signer le bon sur le téléphone.", f: () => { connecterRole("chauffeur"); aller("tournee", null, true); } },
  { t: "Lundi, le matériel revient. Six chaises manquent : elles sont notées à refacturer, et le bon de retour le montre.", f: () => {
      const r = S.reservations.find(x => x.id === "R-001"), rendus = [];
      dehors().filter(d => d.evenement === r.nom).forEach(d => { const n = d.article === "ART-0001" ? d.qte - 6 : d.qte; mouvement(d.article, "Retour", n, { evenement: r.nom }); rendus.push([d.article, n]); });
      mouvement("ART-0001", "Perte", 6, { evenement: r.nom, motif: "Pas rendu", refac: true }); r.statut = "Revenue";
      aller("bon", creerBon({ type: "retour", evenement: r.nom, date: Date.now(), lignes: rendus, manquants: [["ART-0001", 6]] })); } },
  { t: "La facture de casse est prête à envoyer : plus de dispute sur la caution.", f: () => aller("facture", S.reservations.find(x => x.id === "R-001").nom) },
  { t: "Karim, au bureau, reçoit un appel : « Vous avez 350 chaises dans quinze jours ? » Il choisit la date et voit tout de suite combien sont libres, en tenant compte des autres réservations.", f: () => { connecterRole("bureau"); const d = isoJour(Date.now() + 15 * JOUR_MS); rechercheDispo = { d1: d, d2: d }; aller("reservations"); } },
  { get t() { return presentation() === "essentiel" ? "Awa, la gérante, ouvre son accueil : la valeur de son matériel, puis ce qui demande son accord ou un regard aujourd'hui. Les courbes et l'équipe sont à un geste." : "Awa, la gérante, pilote : valeur du parc et sa tendance, part louée, pertes et ce qu'elle récupère."; }, f: () => { connecterRole("direction"); aller("accueil", null, true); } },
  ESPACE && { t: "Tout se règle pour votre entreprise : taille de l'équipe, écrans, blocs, droits de chacun. C'est nous qui le faisons, d'après votre devis.", f: () => { session = null; installateur = true; vueE = { nom: "reglages", arg: null }; entree = true; rendre(); window.scrollTo(0, 0); } },
];
function demarrerTour() {
  const garder = { monnaie: S.monnaie, reglages: S.reglages }, neuf = construireDemo(S.variante || S.metier || "loueur");
  // On ne pose la question que s'il y a quelque chose à perdre : des gestes faits pendant la démo.
  const touche = ["mouvements", "commandes", "reservations", "bons"].some(k => (S[k] || []).length !== (neuf[k] || []).length);
  if (touche && !confirm("La visite guidée repart des données de départ : ce que vous avez fait pendant la démo sera effacé. Continuer ?")) return;
  S = neuf; Object.assign(S, garder); sauver();
  tour = { i: 0, etapes: ((S.metier || "loueur") === "loueur" ? ETAPES : etapesMetier()).filter(Boolean) }; tour.etapes[0].f();
}
function dessinerTour() {
  $$(".tour").forEach(x => x.remove());
  if (!tour) return;
  const e = tour.etapes[tour.i], d = document.createElement("div");
  d.className = "tour"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Démo guidée");
  d.innerHTML = `<i class="tour-avance" aria-hidden="true"><i style="width:${Math.round((tour.i + 1) / tour.etapes.length * 100)}%"></i></i><div><small>Visite guidée · étape ${tour.i + 1} sur ${tour.etapes.length}</small><p>${esc(e.t)}</p></div>
    <div class="tour-boutons"><button class="btn petit" data-tour="quitter">Quitter</button><button class="btn petit plein" data-tour="suivant">${tour.i === tour.etapes.length - 1 ? "Terminer" : "Suivant"}</button></div>`;
  document.body.appendChild(d);
  d.querySelector('[data-tour="quitter"]').onclick = () => { tour = null; d.remove(); };
  d.querySelector('[data-tour="suivant"]').onclick = () => {
    if (tour.i === tour.etapes.length - 1) { tour = null; d.remove(); toast("Fin de la visite. Tout reste à essayer."); return; }
    tour.i += 1; tour.etapes[tour.i].f(); dessinerTour();
  };
}

/* ---------------- Branchements propres à ce fichier ---------------- */
function brancherPlus() {
  $$("[data-resa]").forEach(b => b.onclick = () => aller("reservation", b.dataset.resa));
  $$("[data-nouvelle-resa]").forEach(b => b.onclick = () => { const [d1, d2] = b.dataset.nouvelleResa.split("|"); feuilleReservation(d1, d2); });
  $$("[data-annuler-resa]").forEach(b => b.onclick = () => { if (!confirm("Annuler cette réservation ?")) return; S.reservations = S.reservations.filter(r => r.id !== b.dataset.annulerResa); sauver(); aller("reservations"); toast("Réservation annulée."); });
  $$("[data-prep]").forEach(b => b.onclick = () => aller("preparation", b.dataset.prep));
  $$("[data-charge]").forEach(b => b.onclick = () => { const [aid, d] = b.dataset.charge.split("|"); charger1(S.reservations.find(x => x.id === vue.arg), aid, +d); rendre(); });
  $$("[data-signer]").forEach(b => b.onclick = () => feuilleSignature(b.dataset.signer));
  $$("[data-photos]").forEach(i => i.onchange = () => ajouterPhotos(i.dataset.photos, i.files));
  $$("[data-facture]").forEach(b => b.onclick = () => aller("facture", b.dataset.facture));
  $$("[data-partager-facture]").forEach(b => b.onclick = () => partagerTexte(texteFacture(b.dataset.partagerFacture)));
  const fd = $('[data-form="dispo"]'); if (fd) fd.onsubmit = e => { e.preventDefault(); const d1 = fd.d1.value, d2 = fd.d2.value < fd.d1.value ? fd.d1.value : fd.d2.value; rechercheDispo = { d1, d2 }; rendre(); };
  $$("[data-dispo-tout]").forEach(b => b.onclick = () => { dispoTout = true; rendre(); });
  $$("[data-resas-tout]").forEach(b => b.onclick = () => { resasTout = true; rendre(); });
}
async function partagerTexte(t) {
  if (navigator.share) { try { await navigator.share({ title: "Document", text: t }); } catch (e) { /* partage annulé */ } }
  else window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank", "noopener");
}

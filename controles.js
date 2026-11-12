"use strict";
/* Contrôles périodiques : étalonnage d'un instrument, vérification d'un harnais, d'un extincteur, d'un appareil de levage.
   Un objet peut porter une date de prochain contrôle (ctrlLe), une périodicité en mois (ctrlMois, facultative)
   et le nom du contrôle (ctrlNom). Rien ne s'affiche pour un objet qui n'a pas de date,
   ni pour une entreprise qui ne suit aucun contrôle.
   Chargé après config.js et blocs.js, avant app.js : les fonctions utilisent l'état d'app.js au moment où elles tournent. */

const CTRL_BIENTOT = 30; // jours : en dessous, le contrôle passe en « à faire »
const NATURES_CONTROLE = ["Étalonnage", "Vérification périodique", "Contrôle électrique", "Vérification annuelle", "Maintenance"];
const PERIODES_CONTROLE = [[0, "Pas de rythme fixe"], [3, "Tous les 3 mois"], [6, "Tous les 6 mois"], [12, "Tous les ans"], [24, "Tous les 2 ans"], [60, "Tous les 5 ans"]];
const PICTO_CONTROLE = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 5 8 11v12c0 9.5 6.6 16.6 16 20 9.4-3.4 16-10.5 16-20V11z"/><path d="m16.5 24 5.5 5.5 10-11"/></svg>';

// L'entreprise suit des contrôles : réglé à l'installation, ou dès qu'un objet porte une date.
const suiviControles = () => !!S.suiviControles || S.articles.some(a => a.ctrlLe || a.ctrlFait);
const nomControle = a => a.ctrlNom || "Contrôle";
const dateCtrl = iso => { const d = new Date(iso + "T12:00:00"); return d.toLocaleDateString("fr-FR", Object.assign({ day: "numeric", month: "short" }, d.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" })); };
function plusMois(iso, n) {
  const d = new Date(iso + "T12:00:00"), j = d.getDate();
  d.setMonth(d.getMonth() + n); if (d.getDate() !== j) d.setDate(0); // le 31 d'un mois court : dernier jour du mois
  return isoJour(d.getTime());
}
const rythmeControle = a => { const p = PERIODES_CONTROLE.find(x => x[0] === (a.ctrlMois || 0)); return a.ctrlMois ? (p ? p[1].toLowerCase() : `tous les ${a.ctrlMois} mois`) : ""; };

/* État du contrôle d'un objet : rien s'il n'a pas de date, sinon en retard, à faire (30 jours avant) ou à jour. */
function etatControle(a) {
  if (!a || !a.ctrlLe) return null;
  const j = Math.round((new Date(a.ctrlLe + "T12:00:00") - new Date(aujourdHui() + "T12:00:00")) / JOUR_MS), nom = nomControle(a);
  if (j < 0) return { c: "retard", j, court: "Contrôle en retard", t: `${nom} : en retard depuis le ${dateCtrl(a.ctrlLe)}`, s: `En retard depuis le ${dateCtrl(a.ctrlLe)}` };
  if (j <= CTRL_BIENTOT) return { c: "bientot", j, court: "À contrôler", t: `${nom} : à faire ${j === 0 ? "aujourd'hui" : "avant le " + dateCtrl(a.ctrlLe)}`, s: j === 0 ? "À faire aujourd'hui" : `À faire avant le ${dateCtrl(a.ctrlLe)}` };
  return { c: "ok", j, court: "Contrôle à jour", t: `${nom} : à jour jusqu'au ${dateCtrl(a.ctrlLe)}`, s: `À jour jusqu'au ${dateCtrl(a.ctrlLe)}` };
}
// Les objets dont le contrôle est en retard ou à faire dans les 30 jours, le plus urgent d'abord.
const aControler = () => S.articles.filter(a => { const e = etatControle(a); return e && e.c !== "ok"; }).sort((x, y) => x.ctrlLe.localeCompare(y.ctrlLe));

/* ---------------- Ce qui s'affiche ---------------- */
// Sous la jauge de l'objet scanné : l'opérateur sait tout de suite si l'instrument est bon à prendre.
function ligneControle(a) {
  const e = etatControle(a);
  return e ? `<p class="ctrl-etat ${e.c}"><i></i><span>${esc(e.t)}</span></p>` : "";
}
function boutonControleFait(a, toujours) {
  const e = etatControle(a);
  if (!e || (!toujours && e.c === "ok")) return "";
  return `<button class="btn ${e.c === "ok" ? "" : "plein"}${toujours ? " petit" : ""}" data-ctrl-fait="${a.id}">${PICTO_CONTROLE}Contrôle fait</button>`;
}
// Dans la ligne d'un objet de la liste du stock : une pastille seulement s'il y a quelque chose à faire.
function pastilleControle(a, detail) {
  const e = etatControle(a);
  return e && e.c !== "ok" ? `<span class="etat ctrl-pastille ${e.c === "retard" ? "zero" : "bas"}"><i></i>${esc(detail ? e.t : e.court)}</span>` : "";
}
// Fiche complète : l'échéance, le dernier contrôle, et les deux gestes.
function detailsControle(a) {
  if (!a.ctrlLe && !a.ctrlFait) return "";
  const e = etatControle(a);
  return `${a.ctrlLe ? `<div><dt>${esc(nomControle(a))} à faire avant le</dt><dd>${dateCtrl(a.ctrlLe)}${a.ctrlMois ? `<small class="ctrl-rythme">${esc(rythmeControle(a))}</small>` : ""}</dd></div>` : ""}
    ${a.ctrlFait ? `<div><dt>Dernier contrôle</dt><dd>${dateCtrl(a.ctrlFait)}${a.ctrlQui ? `<small class="ctrl-rythme">par ${esc(a.ctrlQui)}</small>` : ""}</dd></div>` : ""}`;
}
function boutonsControle(a) {
  if (!suiviControles()) return "";
  const suivi = a.ctrlLe || a.ctrlFait;
  return `${boutonControleFait(a, true)}<button class="btn petit" data-ctrl-regler="${a.id}">${suivi ? "Régler le contrôle" : "Suivre un contrôle"}</button>`;
}

/* À faire : les contrôles s'ajoutent à la liste des personnes qui voient le stock. En retard en tête, à venir à la fin. */
function tachesControles() {
  if (!droit("stock")) return { retard: [], bientot: [] };
  const groupe = c => {
    const l = aControler().filter(a => etatControle(a).c === c); if (!l.length) return [];
    const un = l.length === 1 ? l[0] : null, e = etatControle(l[0]);
    return [{ c: c === "retard" ? "alerte" : "attention", i: PICTO_CONTROLE,
      t: un ? `${c === "retard" ? nomControle(un) + " en retard" : nomControle(un) + " à faire"} · ${un.nom}` : `${c === "retard" ? "Contrôles en retard" : "Contrôles à faire"} · ${l.length} objets`,
      s: un ? e.s : l.slice(0, 2).map(a => a.nom).join(", ") + (l.length > 2 ? "…" : ""),
      a: un ? `data-fiche="${un.id}"` : `data-aller="materiel" data-arg="controle"` }];
  };
  return { retard: groupe("retard"), bientot: groupe("bientot") };
}
// Inventaire tournant (outils.js) : la zone de la semaine, tant qu'aucune zone n'a été comptée depuis 7 jours.
function tacheComptage() {
  const z = zoneDeLaSemaine(); if (!z || !z.due) return [];
  return [{ c: "compter", i: I.compter, t: "Compter · " + z.e.nom, s: "Zone de la semaine · " + texteDepuis(depuisComptage(z.e.id)), a: `data-zone="${z.e.id}"` }];
}
const tachesSansControles = taches;
taches = function () { const c = tachesControles(); return c.retard.concat(tachesSansControles(), tachesLieux(), c.bientot, tacheComptage()); };

/* Accueil : un bloc « Contrôles à faire », seulement s'il y en a. Il se place seul sur l'accueil d'un rôle
   qui voit le stock et n'a pas déjà la liste « À faire » (le gérant, le plus souvent). */
function blocControles() {
  const l = aControler(); if (!l.length) return "";
  return `<div class="w-entete"><h3 class="w-titre">Contrôles à faire <span class="compte">${l.length}</span></h3>${l.length > 3 ? `<button class="btn petit" data-aller="materiel" data-arg="controle">Tout voir</button>` : ""}</div>
  <ul class="taches">${l.slice(0, 3).map(a => { const e = etatControle(a); return `<li><button class="tache c-${e.c === "retard" ? "alerte" : "attention"}" data-fiche="${a.id}"><span class="pastille">${PICTO_CONTROLE}</span><span><b>${esc(a.nom)}</b><small>${esc(e.t)}</small></span><span class="chev">${I.fleche}</span></button></li>`; }).join("")}</ul>`;
}
WIDGETS.controles = { t: "Contrôles à faire (étalonnages, vérifications)", tailles: ["m", "l"], si: () => droit("stock") && aControler().length > 0, r: () => blocControles() };
function accueilAvecControles(liste) {
  liste = liste || [];
  if (!droit("stock") || !aControler().length || liste.some(([k]) => k === "taches" || k === "controles")) return liste;
  const l = liste.slice(); l.splice(Math.min(1, l.length), 0, ["controles", "m"]); return l;
}

/* ---------------- Les gestes ---------------- */
// Une ligne dans le journal. Le stock ne bouge pas : la quantité est à zéro.
function ligneJournalControle(a, motif, extra) {
  const id = prochainMv();
  S.mouvements.push(Object.assign({ id, date: Date.now(), profil: session.profil, qui: session.nom, article: a.id, type: "Contrôle", qte: 0, evenement: "", motif }, extra || {}));
  return id;
}
const champsControle = a => ({ ctrlLe: a.ctrlLe, ctrlMois: a.ctrlMois, ctrlNom: a.ctrlNom, ctrlFait: a.ctrlFait, ctrlQui: a.ctrlQui });
function remettreControle(a, avant) { Object.keys(avant).forEach(k => { if (avant[k] === undefined || avant[k] === "") delete a[k]; else a[k] = avant[k]; }); }
// « Annuler » pendant 10 secondes, comme pour les autres gestes : l'objet retrouve ses dates, le journal garde les deux lignes.
function annulableControle(a, avant, mv, texte) {
  $$(".toast").forEach(x => x.remove());
  const d = document.createElement("div"); d.className = "toast avec-bouton"; d.setAttribute("role", "status");
  d.innerHTML = `<span>${esc(texte)}</span><button>Annuler</button><i class="decompte" aria-hidden="true"></i>`;
  document.body.appendChild(d);
  const t = setTimeout(() => d.remove(), 10000);
  d.querySelector("button").onclick = () => {
    clearTimeout(t); d.remove();
    if (S.mouvements.some(x => x.annule === mv)) return;
    remettreControle(a, avant); ligneJournalControle(a, "Annulation de " + mv, { annule: mv });
    sauver(); rendre(); toast("Annulé. Le journal garde les deux lignes.");
  };
}

/* « Contrôle fait » : la date, le prénom de la personne connectée, et la prochaine échéance reportée. */
function feuilleControleFait(id) {
  const a = art(id); if (!a) return;
  const auj = aujourdHui(), nom = nomControle(a), mois = a.ctrlMois || 0;
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tcf">
    <div class="tete">${img(a)}<div><span class="code">${a.id}</span><br><b>${esc(a.nom)}</b></div></div>
    <h1 id="tcf" style="font-size:26px">${a.ctrlNom ? "Contrôle fait · " + esc(nom) : "Contrôle fait"}</h1>
    <p class="sous">Noté dans le journal à votre prénom (${esc(session.nom)}).</p>
    <label class="champ">Fait le<input type="date" name="fait" value="${auj}" max="${auj}" required></label>
    <label class="champ">Prochaine échéance<input type="date" name="prochain" value="${mois ? plusMois(auj, mois) : ""}" min="${auj}"></label>
    <p class="sous" style="margin:0">${mois ? `Rythme : ${esc(rythmeControle(a))}. La date est proposée, vous pouvez la changer.` : "Pas de rythme fixe pour cet objet : indiquez la prochaine date, ou laissez vide s'il n'y en a plus."}</p>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Valider</button></div></div>`);
  const fait = f.querySelector("[name=fait]"), prochain = f.querySelector("[name=prochain]");
  let touche = false; prochain.oninput = () => { touche = true; };
  fait.oninput = () => { if (mois && !touche && fait.value) prochain.value = plusMois(fait.value, mois); };
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const d = fait.value, p = prochain.value;
    if (!d) return toast("Indiquez la date du contrôle.");
    if (d > auj) return toast("La date du contrôle ne peut pas être dans le futur.");
    if (p && p <= d) return toast("La prochaine échéance doit venir après la date du contrôle.");
    const avant = champsControle(a);
    a.ctrlFait = d; a.ctrlQui = session.nom; if (p) a.ctrlLe = p; else delete a.ctrlLe;
    const mv = ligneJournalControle(a, `${nom} : fait${d === auj ? "" : " le " + dateCtrl(d)}${p ? " · prochaine échéance le " + dateCtrl(p) : " · pas de prochaine échéance"}`);
    sauver(); f.remove(); rendre();
    annulableControle(a, avant, mv, p ? `Contrôle noté. Prochaine échéance le ${dateCtrl(p)}.` : "Contrôle noté.");
  };
}

/* Régler le contrôle d'un objet : son nom, la prochaine échéance, le rythme. Réservé à qui voit le stock complet. */
function feuilleReglerControle(id) {
  const a = art(id); if (!a) return;
  const suivi = !!(a.ctrlLe || a.ctrlFait), auj = aujourdHui();
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tcr">
    <div class="tete">${img(a)}<div><span class="code">${a.id}</span><br><b>${esc(a.nom)}</b></div></div>
    <h1 id="tcr" style="font-size:26px">${suivi ? "Régler le contrôle" : "Suivre un contrôle"}</h1>
    <p class="sous">Étalonnage d'un instrument, vérification d'un harnais, d'un extincteur ou d'un appareil de levage : l'appli prévient 30 jours avant la date.</p>
    <label class="champ">Quel contrôle ?<input name="nom" list="liste-ctrl" maxlength="40" value="${esc(a.ctrlNom || "")}" placeholder="Étalonnage, vérification périodique…" autocomplete="off"></label>
    <datalist id="liste-ctrl">${NATURES_CONTROLE.map(n => `<option value="${n}">`).join("")}</datalist>
    <label class="champ">Prochaine échéance<input type="date" name="le" value="${a.ctrlLe || ""}" required></label>
    <label class="champ">Rythme<select name="mois">${PERIODES_CONTROLE.map(([m, t]) => `<option value="${m}" ${m === (a.ctrlMois || 0) ? "selected" : ""}>${t}</option>`).join("")}</select></label>
    <div class="valider"><button class="btn" data-x>Annuler</button><button class="btn plein" data-ok>Enregistrer</button></div>
    ${suivi ? `<p style="margin:14px 0 0;text-align:center"><button class="lien" data-arret>Ne plus suivre de contrôle sur cet objet</button></p>` : ""}</div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelector("[data-ok]").onclick = () => {
    const le = f.querySelector("[name=le]").value, nom = f.querySelector("[name=nom]").value.trim(), mois = +f.querySelector("[name=mois]").value || 0;
    if (!le) return toast("Indiquez la date du prochain contrôle.");
    const avant = champsControle(a), change = le !== a.ctrlLe;
    a.ctrlLe = le; if (nom) a.ctrlNom = nom; else delete a.ctrlNom; if (mois) a.ctrlMois = mois; else delete a.ctrlMois;
    const mv = change ? ligneJournalControle(a, `Échéance réglée : ${nomControle(a).toLowerCase()} avant le ${dateCtrl(le)}${le < auj ? " (déjà dépassée)" : ""}`) : "";
    sauver(); f.remove(); rendre();
    if (mv) annulableControle(a, avant, mv, `Contrôle suivi : prochaine échéance le ${dateCtrl(le)}.`); else toast("Réglage enregistré.");
  };
  const arret = f.querySelector("[data-arret]");
  if (arret) arret.onclick = () => {
    const avant = champsControle(a);
    ["ctrlLe", "ctrlMois", "ctrlNom", "ctrlFait", "ctrlQui"].forEach(k => delete a[k]);
    const mv = ligneJournalControle(a, "Contrôle : suivi arrêté");
    sauver(); f.remove(); rendre();
    annulableControle(a, avant, mv, "Cet objet n'a plus de contrôle suivi.");
  };
}

/* ---------------- Registre des contrôles, à imprimer (audit, visite de l'organisme) ---------------- */
function vRegistreControles() {
  if (!suiviControles()) return bDocs(); // rien à montrer pour une entreprise qui ne suit aucun contrôle
  const l = S.articles.filter(a => a.ctrlLe || a.ctrlFait).sort((x, y) => (x.ctrlLe || "9999").localeCompare(y.ctrlLe || "9999"));
  const mot = { retard: "En retard", bientot: "À faire", ok: "À jour" };
  return `${retourDocs}<div class="feuille-doc">${enTeteDoc()}<h1>Registre des contrôles</h1><p>Édité le ${new Date().toLocaleDateString("fr-FR")} · ${l.length} objet${l.length > 1 ? "s" : ""} suivi${l.length > 1 ? "s" : ""}</p>
  <div class="defile"><table class="registre etroit"><thead><tr><th>Objet</th><th>Contrôle</th><th>Dernier</th><th>Prochaine échéance</th></tr></thead><tbody>
  ${l.map(a => { const e = etatControle(a); return `<tr><td><b>${esc(a.nom)}</b><br><small>${a.id}${a.serie ? " · n° " + esc(a.serie) : ""}</small></td>
    <td>${esc(nomControle(a))}${a.ctrlMois ? `<br><small>${esc(rythmeControle(a))}</small>` : ""}</td>
    <td>${a.ctrlFait ? new Date(a.ctrlFait + "T12:00:00").toLocaleDateString("fr-FR") + (a.ctrlQui ? `<br><small>par ${esc(a.ctrlQui)}</small>` : "") : "—"}</td>
    <td>${a.ctrlLe ? new Date(a.ctrlLe + "T12:00:00").toLocaleDateString("fr-FR") + `<br><small>${mot[e.c]}</small>` : "—"}</td></tr>`; }).join("") || `<tr><td colspan="4">Aucun objet n'a de contrôle suivi. Ouvrez la fiche d'un objet, puis « Suivre un contrôle ».</td></tr>`}</tbody></table></div>
  <p class="petit">Chaque contrôle noté dans l'appli reste dans le journal, avec sa date et le prénom de la personne. Ce registre ne remplace pas le certificat ou le rapport remis par l'organisme de contrôle.</p></div>`;
}

function brancherControles() {
  $$("[data-ctrl-fait]").forEach(b => b.onclick = () => feuilleControleFait(b.dataset.ctrlFait));
  $$("[data-ctrl-regler]").forEach(b => b.onclick = () => feuilleReglerControle(b.dataset.ctrlRegler));
}

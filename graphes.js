"use strict";
/* Graphiques du responsable et du gérant. SVG simple, une couleur = un sens :
   brique = sorties, vert = retours, rouge = pertes à notre charge, gris = refacturable ou au dépôt,
   bleu = taux d'utilisation. Les valeurs détaillées s'affichent au survol ou au toucher (data-tip). */

// Les couleurs viennent du thème actif (variables CSS) : un même graphique se lit en clair comme en sombre.
const C = {};
function rafraichirPalette() {
  const st = getComputedStyle(document.documentElement), v = n => st.getPropertyValue("--" + n).trim();
  Object.assign(C, { sortie: v("sortie"), retour: v("retour"), alerte: v("alerte"), neutre: v("neutre"), depot: v("depot"), bleu: v("compter"), trait: v("trait"), encre: v("encre"), carte: v("carte") });
}
const JOUR = 86400000;
// Sur téléphone on dessine plus étroit pour que le texte reste lisible (12 px réels).
const LARGE = () => Math.max(320, Math.min(600, (document.querySelector("main") || document.body).clientWidth - 34));
const court = (t, n) => t.length > n ? t.slice(0, n - 1) + "…" : t;
const debutJour = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const jourCourt = t => new Date(t).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
const entier = n => Math.round(n).toLocaleString("fr-FR");
const legende = l => `<div class="legende">${l.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join("")}</div>`;
const cadre = (titre, question, corps) => `<section class="graphe"><h3>${titre}</h3><p class="q">${question}</p>${corps}</section>`;
// Barre aux extrémités arrondies du côté opposé à la ligne de base
function barre(x, y, w, h, coul, vers, tip) {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  const d = vers === "haut"
    ? `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
    : `M${x},${y}V${y + h - r}Q${x},${y + h} ${x + r},${y + h}H${x + w - r}Q${x + w},${y + h} ${x + w},${y + h - r}V${y}Z`;
  return `<path d="${d}" fill="${coul}" data-tip="${esc(tip)}"/>`;
}

/* Responsable : ce qui part et revient, jour par jour (sorties au-dessus, retours en dessous). */
function gMouvements14() {
  const j0 = debutJour(Date.now()) - 13 * JOUR;
  const jours = [...Array(14)].map((_, i) => ({ t: j0 + i * JOUR, s: 0, r: 0 }));
  S.mouvements.forEach(m => {
    const i = Math.floor((m.date - j0) / JOUR); if (i < 0 || i > 13) return;
    if (m.type === "Prêt") jours[i].s += m.qte; if (m.type === "Retour") jours[i].r += m.qte;
  });
  const max = Math.max(1, ...jours.map(j => Math.max(j.s, j.r)));
  const W = LARGE(), H = 220, mid = 104, haut = 88, g = 34, pas = (W - g) / 14, bw = pas - 4;
  const y = v => (v / max) * haut;
  let svg = `<line x1="${g}" x2="${W}" y1="${mid}" y2="${mid}" stroke="${C.encre}" stroke-width="1"/>`;
  svg += `<text x="${g - 6}" y="${mid - haut + 4}" text-anchor="end">${entier(max)}</text><text x="${g - 6}" y="${mid + haut + 4}" text-anchor="end">${entier(max)}</text>`;
  jours.forEach((j, i) => {
    const x = g + i * pas + 3, tip = `${jourCourt(j.t)} : ${entier(j.s)} pièces parties, ${entier(j.r)} revenues`;
    svg += barre(x, mid - y(j.s) - 1, bw, y(j.s), C.sortie, "haut", tip);
    svg += barre(x, mid + 1, bw, y(j.r), C.retour, "bas", tip);
    svg += `<rect x="${x - 3}" y="${mid - haut}" width="${pas}" height="${haut * 2}" fill="transparent" data-tip="${esc(tip)}"/>`;
    if ((W < 500 ? i % 3 === 1 : i % 2 === 1) || i === 13) svg += `<text x="${x + bw / 2}" y="${H - 4}" text-anchor="middle">${jourCourt(j.t)}</text>`;
  });
  return cadre("Départs et retours, 14 derniers jours", "Quels jours le dépôt travaille le plus ? Utile pour prévoir les équipes.",
    legende([[C.sortie, "Pièces parties"], [C.retour, "Pièces revenues"]]) + `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Départs et retours par jour">${svg}</svg>`);
}

/* Responsable : pour chaque objet, la part au dépôt et la part chez les clients. */
function gDepotClients() {
  const lignes = S.articles.map(a => {
    const dep = Math.max(0, stock(a.id)), dh = dehors(a.id).reduce((t, d) => t + d.qte, 0);
    return { a, dep, dh, part: dep + dh ? dh / (dep + dh) : 0 };
  }).sort((x, y) => y.part - x.part);
  const W = LARGE(), lh = 30, g = W < 500 ? 118 : 170, H = lignes.length * lh + 6, L = W - g - 44;
  let svg = "";
  lignes.forEach((l, i) => {
    const y = i * lh + 4, tot = l.dep + l.dh || 1, w1 = (l.dep / tot) * L, w2 = (l.dh / tot) * L;
    const tip = `${l.a.nom} : ${entier(l.dep)} au dépôt, ${entier(l.dh)} chez les clients`;
    svg += `<text x="${g - 8}" y="${y + 15}" text-anchor="end">${esc(court(l.a.nom, W < 500 ? 17 : 26))}</text>`;
    svg += `<rect x="${g}" y="${y + 2}" width="${Math.max(0, w1 - 1)}" height="18" rx="3" fill="${C.depot}" data-tip="${esc(tip)}"/>`;
    if (w2 > 0) svg += `<rect x="${g + w1 + 1}" y="${y + 2}" width="${Math.max(2, w2 - 1)}" height="18" rx="3" fill="${C.sortie}" data-tip="${esc(tip)}"/>`;
    svg += `<text x="${W - 4}" y="${y + 15}" text-anchor="end" class="v">${Math.round(l.part * 100)} %</text>`;
  });
  return cadre("Où est le matériel en ce moment", "Pourcentage de chaque objet parti chez les clients. En haut de la liste : ce qui risque de manquer.",
    legende([[C.depot, "Au dépôt"], [C.sortie, "Chez les clients"]]) + `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Répartition dépôt et clients par objet">${svg}</svg>`);
}

/* Gérant : ce que coûtent les pertes chaque semaine, et ce qu'on peut refacturer. */
function gPertes8() {
  const s0 = debutJour(Date.now()) - 55 * JOUR;
  const sem = [...Array(8)].map((_, i) => ({ t: s0 + i * 7 * JOUR, charge: 0, refac: 0 }));
  S.mouvements.filter(m => m.type === "Perte").forEach(m => {
    const i = Math.floor((m.date - s0) / (7 * JOUR)); if (i < 0 || i > 7) return;
    sem[i][m.refac ? "refac" : "charge"] += valeurM(m);
  });
  const max = Math.max(1, ...sem.map(s => s.charge + s.refac));
  const W = LARGE(), H = 220, base = 190, haut = 160, g = 52, pas = (W - g) / 8, bw = pas - (W < 500 ? 8 : 18);
  let svg = `<line x1="${g}" x2="${W}" y1="${base}" y2="${base}" stroke="${C.encre}"/>`;
  [0.5, 1].forEach(k => { const y = base - haut * k; svg += `<line x1="${g}" x2="${W}" y1="${y}" y2="${y}" stroke="${C.trait}"/><text x="${g - 6}" y="${y + 4}" text-anchor="end">${argent(max * k)}</text>`; });
  sem.forEach((s, i) => {
    const x = g + i * pas + (pas - bw) / 2, h1 = (s.charge / max) * haut, h2 = (s.refac / max) * haut;
    const tip = `Semaine du ${new Date(s.t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} : ${argent(s.charge)} à notre charge, ${argent(s.refac)} refacturables`;
    if (h1) svg += `<rect x="${x}" y="${base - h1}" width="${bw}" height="${h1}" fill="${C.alerte}" data-tip="${esc(tip)}"/>`;
    svg += barre(x, base - h1 - h2 - (h1 && h2 ? 2 : 0), bw, h2, C.neutre, "haut", tip);
    svg += `<rect x="${g + i * pas}" y="${base - haut}" width="${pas}" height="${haut}" fill="transparent" data-tip="${esc(tip)}"/>`;
    if (W >= 500 || i % 2 === 0) svg += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${new Date(s.t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</text>`;
  });
  return cadre("Pertes et casse par semaine", "Combien la casse nous coûte vraiment, et quelle part on peut refacturer aux clients.",
    legende([[C.alerte, "À notre charge"], [C.neutre, "Refacturable au client"]]) + `<svg viewBox="0 0 ${W} ${H + 8}" role="img" aria-label="Pertes par semaine">${svg}</svg>`);
}

/* Gérant : quelle part du parc travaille (est louée) chaque jour. */
function gUtilisation() {
  const j0 = debutJour(Date.now()) - 66 * JOUR;
  const tri = S.mouvements.slice().sort((a, b) => a.date - b.date);
  const dehorsQ = {}, stockQ = {};
  let k = 0;
  const pts = [];
  for (let i = 0; i < 67; i++) {
    const fin = j0 + (i + 1) * JOUR;
    while (k < tri.length && tri[k].date < fin) {
      const m = tri[k++];
      stockQ[m.article] = (stockQ[m.article] || 0) + SIGNE[m.type] * m.qte;
      if (m.evenement) dehorsQ[m.article] = (dehorsQ[m.article] || 0) + (m.type === "Prêt" ? m.qte : ["Retour", "Perte"].includes(m.type) ? -m.qte : 0);
    }
    let vDeh = 0, vTot = 0;
    S.articles.forEach(a => { const dh = Math.max(0, dehorsQ[a.id] || 0); vDeh += dh * a.prix; vTot += (Math.max(0, stockQ[a.id] || 0) + dh) * a.prix; });
    pts.push({ t: fin - JOUR, brut: vTot ? vDeh / vTot : 0 });
  }
  // Moyenne sur 7 jours : un événement dure deux jours, la courbe brute serait illisible.
  pts.forEach((p, i) => { const f = pts.slice(Math.max(0, i - 6), i + 1); p.p = f.reduce((t, x) => t + x.brut, 0) / f.length; });
  pts.splice(0, 7); // on garde 60 jours, chacun avec 7 jours d'historique derrière lui
  const moy = pts.reduce((t, p) => t + p.p, 0) / pts.length;
  const W = LARGE(), H = 200, g = 40, base = 170, haut = 150, max = Math.max(.1, ...pts.map(p => p.p)) * 1.1;
  const x = i => g + (i / (pts.length - 1)) * (W - g - 10), y = p => base - (p / max) * haut;
  let svg = `<line x1="${g}" x2="${W}" y1="${base}" y2="${base}" stroke="${C.encre}"/>`;
  [.5, 1].forEach(f => { const v = max * f; svg += `<line x1="${g}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="${C.trait}"/><text x="${g - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v * 100)} %</text>`; });
  svg += `<line x1="${g}" x2="${W - 10}" y1="${y(moy)}" y2="${y(moy)}" stroke="${C.neutre}" stroke-dasharray="4 4"/><text x="${W - 10}" y="${y(moy) - 6}" text-anchor="end">moyenne ${Math.round(moy * 100)} %</text>`;
  svg += `<polyline points="${pts.map((p, i) => `${x(i)},${y(p.p)}`).join(" ")}" fill="none" stroke="${C.bleu}" stroke-width="2" stroke-linejoin="round"/>`;
  const der = pts[pts.length - 1];
  svg += `<circle cx="${x(pts.length - 1)}" cy="${y(der.p)}" r="4" fill="${C.bleu}" stroke="${C.carte}" stroke-width="2"/>`;
  pts.forEach((p, i) => { svg += `<rect x="${x(i) - 5}" y="${base - haut}" width="10" height="${haut}" fill="transparent" data-tip="${esc(jourCourt(p.t) + " : " + Math.round(p.p * 100) + " % du parc loué en moyenne sur 7 jours")}"/>`; });
  [0, 30, pts.length - 1].forEach(i => { svg += `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}">${new Date(pts[i].t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</text>`; });
  return cadre("Part du parc en location", "Valeur du matériel chez les clients rapportée à tout le parc, en moyenne sur 7 jours. Plus c'est haut, plus le matériel rapporte.",
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Taux d'utilisation du parc sur 60 jours">${svg}</svg>`);
}

/* Gérant : ce qui se loue le plus, et ce qui dort. */
function gTopLoues() {
  const depuis = Date.now() - 30 * JOUR, q = {};
  S.mouvements.filter(m => m.type === "Prêt" && m.date >= depuis).forEach(m => q[m.article] = (q[m.article] || 0) + m.qte);
  const l = S.articles.map(a => ({ a, n: q[a.id] || 0 })).sort((x, y) => y.n - x.n);
  const actifs = l.filter(x => x.n > 0).slice(0, 6), dorment = l.filter(x => x.n === 0);
  const max = Math.max(1, ...actifs.map(x => x.n));
  const W = LARGE(), lh = 30, g = W < 500 ? 118 : 170, L = W - g - 56, H = actifs.length * lh + 4;
  let svg = "";
  actifs.forEach((x, i) => {
    const y = i * lh + 4, w = (x.n / max) * L;
    svg += `<text x="${g - 8}" y="${y + 15}" text-anchor="end">${esc(court(x.a.nom, W < 500 ? 17 : 26))}</text>`;
    svg += `<path d="M${g},${y + 2}H${g + w - 4}Q${g + w},${y + 2} ${g + w},${y + 6}V${y + 16}Q${g + w},${y + 20} ${g + w - 4},${y + 20}H${g}Z" fill="${C.sortie}" data-tip="${esc(x.a.nom + " : " + entier(x.n) + " pièces louées en 30 jours")}"/>`;
    svg += `<text x="${g + w + 6}" y="${y + 15}" class="v">${entier(x.n)}</text>`;
  });
  return cadre("Ce qui se loue, et ce qui dort", "Pièces louées sur 30 jours. Ce qui ne sort jamais immobilise de l'argent : à vendre ou à mettre en avant.",
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Objets les plus loués">${svg}</svg>` +
    (dorment.length ? `<p class="q" style="margin-top:10px"><b style="color:var(--encre)">Pas sorti depuis 30 jours :</b> ${dorment.map(x => esc(x.a.nom)).join(", ")}.</p>` : ""));
}

/* Bulle d'information, à la souris comme au doigt */
(function () {
  let b = null, t = null;
  const montrer = (e, txt) => {
    if (!b) { b = document.createElement("div"); b.className = "bulle"; b.setAttribute("role", "status"); document.body.appendChild(b); }
    b.textContent = txt; b.style.display = "block";
    const x = Math.min(window.innerWidth - b.offsetWidth - 8, e.clientX + 12), y = Math.max(8, e.clientY - b.offsetHeight - 12);
    b.style.left = x + "px"; b.style.top = y + "px";
  };
  const cacher = () => { if (b) b.style.display = "none"; };
  document.addEventListener("pointermove", e => { const c = e.target.closest && e.target.closest("[data-tip]"); if (c && e.pointerType === "mouse") montrer(e, c.dataset.tip); else if (e.pointerType === "mouse") cacher(); });
  document.addEventListener("pointerdown", e => { const c = e.target.closest && e.target.closest("[data-tip]"); if (c) { montrer(e, c.dataset.tip); clearTimeout(t); t = setTimeout(cacher, 2500); } else cacher(); });
  window.addEventListener("scroll", cacher, { passive: true });
})();

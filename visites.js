"use strict";
/* Démos par métier, pour les prospects : une visite guidée de 2 minutes par métier,
   et un choix du métier avec le lien à envoyer. Chargé avant app.js. */

const PRESENTATION_METIERS = {
  loueur: "Mariages, séminaires : réservations, départs, retours, casse refacturée",
  artisan: "Chantiers : outillage prêté et rendu, consommables par chantier",
  restaurant: "Réserve et chambre froide : dates limites, consommation par service",
  labo: "Consommables, appareils prêtés, lots et dates limites",
  distribution: "Magasin et cour : ventes, retours de clients, réassort",
  ong: "Entrepôt et distributions : kits, lieux, rapport par projet",
};
const lienDemo = m => location.href.split("#")[0].split("?")[0] + "?metier=" + m;

function feuilleMetiers() {
  const f = ouvrirFeuille(`<div role="dialog" aria-modal="true" aria-labelledby="tm"><h1 id="tm" style="font-size:26px">Une démo par métier</h1>
    <p class="sous">Mêmes gestes, mots et blocs adaptés. Le lien ouvre directement la démo du métier : c'est celui à envoyer au prospect.</p>
    <div class="metiers">${Object.entries(METIERS).map(([k, m]) => {
      const a = (k === "loueur" ? SEED().articles : m.articles.map(x => ({ img: x[2] })))[0];
      return `<div class="metier ${(S.metier || "loueur") === k ? "actuel" : ""}"><div class="vignette"><img src="img/${a.img}.webp" alt="" loading="lazy"></div>
        <div><b>${esc(m.nom)}</b><small>${esc(PRESENTATION_METIERS[k] || "")}</small>
        <div class="metier-boutons"><button class="btn petit plein" data-m="${k}">${(S.metier || "loueur") === k ? "Démo actuelle" : "Voir cette démo"}</button><button class="btn petit" data-lien="${k}">Copier le lien</button></div></div></div>`;
    }).join("")}</div>
    <div class="valider" style="grid-template-columns:1fr"><button class="btn" data-x>Fermer</button></div></div>`);
  f.querySelector("[data-x]").onclick = () => f.remove();
  f.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { f.remove(); if ((S.metier || "loueur") !== b.dataset.m) { session = null; installateur = false; changerMetier(b.dataset.m); history.replaceState(null, "", "?metier=" + b.dataset.m); } });
  f.querySelectorAll("[data-lien]").forEach(b => b.onclick = async () => {
    const l = lienDemo(b.dataset.lien);
    try { await navigator.clipboard.writeText(l); toast("Lien copié : " + l); } catch (e) { prompt("Lien de la démo :", l); }
  });
}

/* Visite guidée des métiers qui consomment leur stock (artisan, restaurant, labo, quincaillerie, ONG) */
function etapesMetier() {
  const m = metier(), a0 = S.articles.find(a => logique(a) !== "pret") || S.articles[0], imp = (m.imputations || S.evenements)[0];
  const qte = Math.max(1, a0.lot > 1 ? a0.lot : 2), terrain = S.equipe.find(u => u.role === "terrain"), bureau = S.equipe.find(u => u.role === "bureau"), dir = S.equipe.find(u => u.role === "direction");
  const etapes = [
    { t: `${terrain.nom}, ${m.v.terrain.toLowerCase()}, scanne « ${a0.nom} ». Il voit la photo, le stock, et le geste le plus probable en premier. Pas de menu, pas de texte à taper.`, f: () => { connecterRole("terrain"); aller("objet", a0.id, true); } },
    { t: `Il en sort ${qte} pour « ${imp} ». Son prénom et l'heure sont enregistrés. S'il se trompe, il annule pendant 10 secondes.`, f: () => { mouvement(a0.id, "Sortie", qte, { imputation: imp }); aller("jour", null, true); toast(`${qte} sorti${qte > 1 ? "s" : ""} pour ${imp}.`); } },
    { t: "Le livreur arrive : la commande attendue s'affiche, il ne corrige que l'écart et photographie le bon de livraison.", f: () => aller("receptionCmd", "CMD-0001", true) },
    { t: `${bureau.nom}, ${m.v.bureau.toLowerCase()}, ouvre sa journée : ce qu'il y a à faire, le dépôt en 3D zone par zone${m.dlc ? ", les dates limites" : ""}, ce qui sort par ${m.v.imp.toLowerCase()}.`, f: () => { connecterRole("bureau"); aller("accueil", null, true); } },
    { t: `${dir.nom}, ${m.v.direction.toLowerCase()}, pilote : valeur du stock et sa tendance, ce qui est à commander, ce qui attend sa décision.`, f: () => { connecterRole("direction"); aller("accueil", null, true); } },
    { t: `Les analyses montrent où part l'argent, ${m.v.imp.toLowerCase()} par ${m.v.imp.toLowerCase()}, et ce qui dort sur les étagères.`, f: () => aller("analyses", null, true) },
    { t: "Tout se règle pour votre entreprise : taille de l'équipe, écrans, blocs, droits de chacun. C'est nous qui le faisons, d'après votre devis.", f: () => { session = null; installateur = true; entree = true; rendre(); window.scrollTo(0, 0); } },
  ];
  return etapes;
}

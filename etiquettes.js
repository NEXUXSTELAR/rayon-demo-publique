"use strict";
/* =================================================================
   LE PLAN D'ÉTIQUETAGE : pour chaque objet, où poser l'étiquette et sur quel support.
   Une étiquette ne va pas toujours sur l'objet : parfois sur la caisse, le sac ou l'étagère.
   Détails et prix indicatifs : docs/21_Etiquettes_selon_les_usages.md
   ================================================================= */
const SUPPORTS = {
  papier:    { t: "Papier plastifié", s: "À l'abri : cartons, étagères intérieures, ce qui part vite" },
  polyester: { t: "Polyester laminé", s: "Le standard : eau, soleil, frottements, polyester en planche ou ruban laminé (jamais en papier thermique, qui s'efface à la chaleur)" },
  labo:      { t: "Polyester de labo", s: "Autoclave, congélateur, solvants" },
  textile:   { t: "Étiquette textile", s: "Cousue ou thermocollée, tient au lavage à 95 °C" },
  metal:     { t: "Plaque alu gravée", s: "Rivetée ou collée : chocs, lave-vaisselle, extérieur" },
  rayon:     { t: "Étiquette de rayon", s: "Sur le bord de l'étagère, avec le prix si besoin" },
};
const SUR = { objet: "Sur l'objet", contenant: "Sur le contenant", emplacement: "Sur l'emplacement" };

// Par type d'objet (clé de la photo). Les chiffres « par 10 », « par 40 » suivent le lot de l'article.
const PLAN_OBJETS = {
  plaquette_carbure: { sur: "contenant", support: "rayon", ou: () => "Sur le bac du tiroir, jamais sur la plaquette : on tape le nombre" },
  micrometre:     { sur: "contenant", support: "polyester", ou: () => "Sur l'étui de l'instrument" },
  pied_coulisse:  { sur: "contenant", support: "polyester", ou: () => "Sur l'étui de l'instrument" },
  porte_outil:    { sur: "emplacement", support: "metal", ou: () => "Sur l'alvéole du chariot à cônes, pas sur le cône" },
  barre_alu:      { sur: "emplacement", support: "rayon", ou: () => "Sur le rack, une étiquette par diamètre" },
  tole:           { sur: "emplacement", support: "rayon", ou: () => "Sur le rack à tôles, par épaisseur" },
  fut:            { sur: "objet", support: "metal", ou: () => "Sur la jupe du fût, en bas : elle ne touche ni la tête ni le lavage intérieur" },
  tireuse:        { sur: "objet", support: "polyester", ou: () => "Sous le plateau, à l'abri de la mousse" },
  co2:            { sur: "objet", support: "polyester", ou: () => "Sur le col de la bouteille, au-dessus de l'étiquette du gaz" },
  tete_soutirage: { sur: "contenant", support: "rayon", ou: () => "Sur le bac des têtes : on tape le nombre" },
  caisse_biere:   { sur: "emplacement", support: "rayon", ou: () => "Sur le quai des caisses : on tape le nombre" },
  gobelet:        { sur: "contenant", support: "rayon", ou: () => "Sur le carton de gobelets, jamais sur le gobelet" },
  verre_biere:    { sur: "contenant", support: "rayon", ou: () => "Sur le casier de verres" },
  mange_debout:   { sur: "objet", support: "polyester", ou: () => "Sous le plateau, près du pied" },
  chaise:     { sur: "contenant", support: "polyester", ou: a => `Sur le chariot ou la sangle de chaque pile de ${a.lot || 10}. Sous chaque assise, un petit « Propriété de… » sans QR, contre le vol` },
  table:      { sur: "objet", support: "polyester", ou: () => "Sous le plateau, près d'un pied : invisible des invités" },
  assiette:   { sur: "contenant", support: "metal", ou: a => `Sur le casier de lave-vaisselle de ${a.lot || 40} : jamais sur l'assiette` },
  verre:      { sur: "contenant", support: "metal", ou: a => `Sur le casier de ${a.lot || 36} verres, qui passe au lave-vaisselle` },
  nappe:      { sur: "contenant", support: "textile", ou: a => `Sur le sac de ${a.lot || 5} nappes. En option, une étiquette textile dans l'ourlet pour suivre chaque nappe` },
  housse:     { sur: "contenant", support: "textile", ou: a => `Sur le sac de ${a.lot || 25} housses, qui passe en blanchisserie` },
  enceinte:   { sur: "objet", support: "polyester", ou: () => "Au dos, à côté du numéro de série, en version qui se déchire si on l'arrache" },
  groupe:     { sur: "objet", support: "metal", ou: () => "Sur le capot, côté poignée, loin du pot d'échappement" },
  rallonge:   { sur: "objet", support: "polyester", ou: () => "Sur l'enrouleur, pas sur le câble" },
  perforateur:{ sur: "objet", support: "metal", ou: () => "Une plaque sur l'outil, et la même étiquette sur la mallette : l'outil part parfois sans elle" },
  microscope: { sur: "objet", support: "labo", ou: () => "Sur le socle, côté opposé à l'utilisateur" },
  pipette:    { sur: "objet", support: "labo", ou: () => "Sur le corps, sous le bouton, en petit format" },
  tomates:    { sur: "emplacement", support: "polyester", ou: () => "Sur l'étagère de la chambre froide : la cagette change à chaque livraison" },
  kit_hygiene:{ sur: "contenant", support: "papier", ou: () => "Sur le carton du kit : il part avec la famille" },
  moustiquaire:{ sur: "contenant", support: "papier", ou: a => `Sur le carton de ${a.lot || 20}, et sur la palette` },
  couverture: { sur: "contenant", support: "papier", ou: a => `Sur la balle de ${a.lot || 10}, et sur la palette` },
  jerrican:   { sur: "contenant", support: "papier", ou: () => "Sur la palette ou le lot filmé" },
  tente:      { sur: "contenant", support: "polyester", ou: () => "Sur la housse de la tente, et une plaque sur un montant de la structure" },
  bache:      { sur: "contenant", support: "textile", ou: a => `Sur le sac de ${a.lot || 2} bâches ; en option, une étiquette textile cousue dans l'ourlet` },
  leste:      { sur: "emplacement", support: "rayon", ou: () => "Sur la palette ou le rack des lestes : on compte le lot" },
  projecteur: { sur: "objet", support: "polyester", ou: () => "Sous la lyre, à côté du numéro de série" },
  micro:      { sur: "contenant", support: "polyester", ou: () => "Sur la valise du micro et sur le récepteur" },
  cable_xlr:  { sur: "objet", support: "polyester", ou: () => "Une étiquette drapeau près d'une fiche, sur la gaine" },
  harnais:    { sur: "objet", support: "textile", ou: () => "Étiquette textile cousue sur la sangle dorsale, à côté de l'étiquette du fabricant" },
  taille_haie:      { sur: "objet", support: "polyester", ou: () => "Sur le carter, du côté de la poignée : loin de la lame et du moteur" },
  debroussailleuse: { sur: "objet", support: "polyester", ou: () => "Sur le tube, près de la poignée : loin du moteur chaud" },
  tronconneuse:     { sur: "objet", support: "polyester", ou: () => "Sur le carter, à l'opposé du guide-chaîne" },
  souffleur:        { sur: "objet", support: "polyester", ou: () => "Sur le dossier du harnais, à l'abri des chocs" },
  batterie:         { sur: "objet", support: "polyester", ou: () => "Une étiquette par batterie, sur la face qui ne glisse pas dans le chargeur" },
  paillage:         { sur: "emplacement", support: "rayon", ou: () => "Sur le bac ou la palette du dépôt : on tape le nombre de sacs" },
  fil_debroussaille:{ sur: "emplacement", support: "rayon", ou: () => "Sur le bac des bobines" },
  casque:     { sur: "emplacement", support: "rayon", ou: () => "Sur le bac des casques : on suit le stock, pas chaque casque" },
  multimetre: { sur: "objet", support: "polyester", ou: () => "Au dos de l'appareil, et sur sa housse" },
  echelle:    { sur: "objet", support: "metal", ou: () => "Une plaque rivetée sur un montant, à hauteur d'yeux" },
  visseuse:   { sur: "objet", support: "metal", ou: () => "Une plaque sur l'outil, et la même étiquette sur la mallette" },
  chafing:    { sur: "objet", support: "metal", ou: () => "Une plaque gravée sous le bac : elle passe au lave-vaisselle" },
  glaciere:   { sur: "objet", support: "polyester", ou: () => "Sur le côté, sous la poignée" },
  percolateur:{ sur: "objet", support: "metal", ou: () => "Une plaque gravée sous la base" },
  serviette:  { sur: "contenant", support: "textile", ou: a => `Sur le chariot de linge ou le sac de ${a.lot || 10} ; en option, une étiquette textile qui passe en blanchisserie` },
  centrifugeuse:{ sur: "objet", support: "labo", ou: () => "Sur le côté, loin du couvercle" },
  balance:    { sur: "objet", support: "labo", ou: () => "Sur le socle, côté opposé à l'utilisateur" },
  reactif:    { sur: "emplacement", support: "labo", ou: () => "Sur l'étagère du réfrigérateur : pas sur chaque coffret" },
  pneu:       { sur: "emplacement", support: "rayon", ou: () => "Sur le bord du rack, par dimension" },
  fer:        { sur: "emplacement", support: "rayon", ou: () => "Sur le râtelier de la cour, par diamètre" },

};

function planEtiquette(a) {
  const m = S.metier || "loueur", p = PLAN_OBJETS[a.img];
  if (p) return { sur: p.sur, support: m === "labo" && p.support !== "labo" ? "labo" : p.support, ou: p.ou(a) };
  const pret = a.type === "equip" || a.type === "pret" || logique(a) === "pret";
  if (pret) return { sur: "objet", support: m === "labo" ? "labo" : m === "artisan" ? "metal" : "polyester", ou: "Sur l'objet, à un endroit qui ne frotte pas" };
  if (m === "labo") return { sur: "emplacement", support: "labo", ou: "Sur l'étagère ou le bac : pas sur chaque flacon" };
  if (m === "distribution") return { sur: "emplacement", support: "rayon", ou: "Sur le bord du rayon ou de la case de la cour" };
  if (m === "ong") return { sur: "contenant", support: "papier", ou: "Sur le carton ou la palette" };
  if (m === "restaurant") return { sur: "emplacement", support: "polyester", ou: "Sur l'étagère de la réserve (adhésif grand froid en chambre froide)" };
  return { sur: "emplacement", support: "polyester", ou: "Sur le bac ou l'étagère : on scanne le bac, on tape la quantité" };
}

// Le plan, à l'écran seulement (au-dessus de la planche à imprimer)
function blocPlanEtiquetage() {
  const l = S.articles.map(a => ({ a, p: planEtiquette(a) }));
  const compte = k => l.filter(x => x.p.sur === k).length;
  return `<section class="plan-etiq pas-imprimer"><h2>Où poser chaque étiquette</h2>
    <p class="sous">Une étiquette ne va pas toujours sur l'objet. Ici : ${[[compte("objet"), "sur l'objet"], [compte("contenant"), "sur la caisse, le sac ou le carton"], [compte("emplacement"), "sur l'étagère"]].filter(x => x[0]).map(x => x.join(" ")).join(", ")}.</p>
    <div class="plan-l">${l.map(({ a, p }) => `<div class="plan-ligne"><span class="plan-sur s-${p.sur}">${SUR[p.sur]}</span><b>${esc(a.nom)}</b><small>${esc(p.ou)}</small><span class="plan-support" title="${esc(SUPPORTS[p.support].s)}">${esc(SUPPORTS[p.support].t)}</span></div>`).join("")}</div>
    <details class="plan-supports"><summary>Les supports, en bref</summary><ul>${Object.values(SUPPORTS).map(s => `<li><b>${s.t}</b> : ${s.s}</li>`).join("")}</ul></details>
  </section>`;
}

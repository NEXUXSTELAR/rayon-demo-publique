"use strict";
/* Vrais fichiers Excel (.xlsx), sans bibliothèque et sans réseau : un titre, des en-têtes en couleur,
   la première ligne figée, des filtres, des montants en euros ou en francs CFA, des dates, plusieurs onglets.
   Ils s'ouvrent dans Excel, LibreOffice et Google Sheets.

   telechargerXlsx("fichier.xlsx", [{ nom, titre, sousTitre, colonnes: [{ t, l, f }], lignes: [[...]], total: true }])
   f : "texte" (par défaut), "entier", "nombre", "argent", "date", "dateheure". total : une ligne de sommes en bas. */

const XLSX_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = o => { let c = 0xffffffff; for (let i = 0; i < o.length; i++) c = XLSX_CRC[(c ^ o[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
// Archive ZIP sans compression (méthode « stockée »), suffisante pour un classeur
function zipStocke(fichiers) {
  const enc = new TextEncoder(), parts = [], central = [];
  let pos = 0;
  const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  fichiers.forEach(([nom, texte]) => {
    const n = enc.encode(nom), d = enc.encode(texte), c = crc32(d);
    const local = [...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(n.length), ...u16(0)];
    parts.push(new Uint8Array(local), n, d);
    central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(n.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(pos)]), n);
    pos += local.length + n.length + d.length;
  });
  const tailleCentral = central.reduce((t, x) => t + x.length, 0);
  const fin = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(fichiers.length), ...u16(fichiers.length), ...u32(tailleCentral), ...u32(pos), ...u16(0)]);
  return new Blob([...parts, ...central, fin], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

const xmlEsc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const colonne = i => { let s = ""; i += 1; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
// Date JavaScript vers numéro de série Excel, à l'heure locale
const serieExcel = t => (t - new Date(t).getTimezoneOffset() * 60000) / 86400000 + 25569;

function telechargerXlsx(nomFichier, feuilles) {
  const xof = S.monnaie === "XOF";
  // Styles : 1 titre, 2 sous-titre, 3 en-tête, 4 texte, 5 entier, 6 argent, 7 date et heure, 8 date, 9 total (libellé), 10 total argent, 11 total entier, 12 nombre
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="4"><numFmt numFmtId="164" formatCode="${xof ? '#,##0 &quot;FCFA&quot;' : '#,##0.00 &quot;€&quot;'}"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm"/><numFmt numFmtId="166" formatCode="dd/mm/yyyy"/><numFmt numFmtId="167" formatCode="#,##0.##"/></numFmts>
<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="15"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF5A626B"/><name val="Calibri"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF14171B"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFDF3DC"/></patternFill></fill></fills>
<borders count="2"><border/><border><top style="thin"><color rgb="FF14171B"/></top></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="13"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>
<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>
<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="1" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="3" fontId="1" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const styleDe = { texte: 4, entier: 5, argent: 6, dateheure: 7, date: 8, nombre: 12 };
  const valeurArgent = v => xof ? Math.round(v * EUR_XOF) : Math.round(v * 100) / 100;
  const cellule = (ref, v, f) => {
    if (v === null || v === undefined || v === "") return `<c r="${ref}" s="${styleDe[f] || 4}"/>`;
    if (["entier", "nombre", "argent"].includes(f) && typeof v === "number" && isFinite(v)) return `<c r="${ref}" s="${styleDe[f]}"><v>${f === "argent" ? valeurArgent(v) : v}</v></c>`;
    if ((f === "date" || f === "dateheure") && typeof v === "number") return `<c r="${ref}" s="${styleDe[f]}"><v>${serieExcel(v).toFixed(6)}</v></c>`;
    return `<c r="${ref}" t="inlineStr" s="${styleDe[f] || 4}"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
  };
  const feuillesXml = feuilles.map(fe => {
    const nc = fe.colonnes.length, derniere = colonne(nc - 1), debut = 5, fin = debut + Math.max(0, fe.lignes.length - 1);
    let rows = `<row r="1" ht="22" customHeight="1">${cellule("A1", fe.titre, "")} </row>`.replace(`s="4"`, `s="1"`);
    rows += `<row r="2">${`<c r="A2" t="inlineStr" s="2"><is><t xml:space="preserve">${xmlEsc(fe.sousTitre || "")}</t></is></c>`}</row>`;
    rows += `<row r="4" ht="30" customHeight="1">${fe.colonnes.map((c, i) => `<c r="${colonne(i)}4" t="inlineStr" s="3"><is><t xml:space="preserve">${xmlEsc(c.t)}</t></is></c>`).join("")}</row>`;
    fe.lignes.forEach((l, j) => { rows += `<row r="${debut + j}">${fe.colonnes.map((c, i) => cellule(colonne(i) + (debut + j), l[i], c.f)).join("")}</row>`; });
    if (fe.total && fe.lignes.length) {
      const r = fin + 1;
      rows += `<row r="${r}">${fe.colonnes.map((c, i) => i === 0 ? `<c r="A${r}" t="inlineStr" s="9"><is><t>Total</t></is></c>`
        : (c.f === "argent" || c.f === "entier") && c.somme !== false ? `<c r="${colonne(i)}${r}" s="${c.f === "argent" ? 10 : 11}"><f>SUBTOTAL(9,${colonne(i)}${debut}:${colonne(i)}${fin})</f></c>` : `<c r="${colonne(i)}${r}" s="9"/>`).join("")}</row>`;
    }
    const cols = fe.colonnes.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.l || 14}" customWidth="1"/>`).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols><sheetData>${rows}</sheetData>
${fe.lignes.length ? `<autoFilter ref="A4:${derniere}${fin}"/>` : ""}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  });
  const noms = feuilles.map(f => f.nom.replace(/[\\/?*[\]:]/g, " ").slice(0, 31));
  const fichiers = [
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${feuilles.map((f, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`],
    ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${noms.map((n, i) => `<sheet name="${xmlEsc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets><definedNames>${feuilles.map((f, i) => f.lignes.length ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xmlEsc(noms[i]).replace(/'/g, "''")}'!$A$4:$${colonne(f.colonnes.length - 1)}$${4 + f.lignes.length}</definedName>` : "").join("")}</definedNames></workbook>`],
    ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${feuilles.map((f, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${feuilles.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ["xl/styles.xml", styles],
  ].concat(feuillesXml.map((x, i) => [`xl/worksheets/sheet${i + 1}.xml`, x]));
  const blob = zipStocke(fichiers);
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nomFichier; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return blob;
}

/* ============ SECCIÓN 10: PLANOS TÉCNICOS MULTI-CAPA (2 CUADRADITOS = 1 m) Y EXPORTACIONES ============
   Genera:
   - 6 capas vectoriales SVG a escala (Implantación, Camas, Mobiliario, Circulaciones, Riego, Residuos)
   - Exportación GeoJSON WGS84 real (Bogotá / Kennedy)
   - Exportación CSV completa (especies, calendario, cuadro de áreas, materiales cerco INTA, simulaciones)
   - Reporte técnico imprimible a PDF con comparación de escenarios A / B / C y divulgación de supuestos. */

import { ESPECIES, CATALOGO_ELEMENTOS, BOGOTA_CLIMA } from './datos_agronomia.js?v=1';
import { mundoAGeo } from './diagnostico_parque.js?v=1';

const esc = (s) => String(s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const fmt = (v, d = 0) => Number(v).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

export const CAPAS_PLANO = [
  { id: 'camas',         n: 'Camas y cultivos (INTA)' },
  { id: 'implantacion',  n: 'Implantación en el parque' },
  { id: 'mobiliario',    n: 'Mobiliario y permanencia' },
  { id: 'circulaciones', n: 'Circulaciones y accesibilidad' },
  { id: 'riego',         n: 'Riego por goteo y lluvia' },
  { id: 'residuos',      n: 'Flujo residuos → compost' }
];

/* ---------- Plano vectorial SVG a escala (papel cuadriculado: 2 cuadraditos = 1 m) ---------- */
export function renderPlanoCapaSVG(proyecto, capa = 'camas', diag = null, opts = {}) {
  if (capa === 'implantacion' && proyecto.park) return renderPlanoImplantacionSVG(proyecto, diag);

  const { dims, elementos, infra, cerco, cfg, park, sim } = proyecto;
  const PXM = opts.pxm || 22; // 22 px/m => cada cuadradito de 0,5 m = 11 px (2 cuadraditos = 1 m, INTA p. 6)
  const padL = 74, padR = 74, padT = 84, padB = 96;
  const W = Math.round(dims.totalL * PXM + padL + padR);
  const H = Math.round(dims.totalW * PXM + padT + padB);
  const X = (u) => padL + (u - dims.uMin) * PXM;
  const Y = (v) => padT + (v - dims.vMin) * PXM;

  const tituloCapa = (CAPAS_PLANO.find(c => c.id === capa) || CAPAS_PLANO[0]).n.toUpperCase();
  const P = [];
  P.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="ph-plano-tit" data-pxm="${PXM}" data-padl="${padL}" data-padt="${padT}" data-umin="${dims.uMin}" data-vmin="${dims.vMin}">`);
  P.push(`<title id="ph-plano-tit">Plano de ${esc(tituloCapa)} — ${esc(park ? park.nombre : 'Parque')} (escala 2 cuadraditos = 1 m)</title>`);
  P.push(`<defs>
    <pattern id="pl-sub" width="${PXM / 2}" height="${PXM / 2}" patternUnits="userSpaceOnUse"><path d="M ${PXM / 2} 0 L 0 0 0 ${PXM / 2}" fill="none" stroke="#dce7e1" stroke-width="0.6"/></pattern>
    <pattern id="pl-m" width="${PXM}" height="${PXM}" patternUnits="userSpaceOnUse"><rect width="${PXM}" height="${PXM}" fill="url(#pl-sub)"/><path d="M ${PXM} 0 L 0 0 0 ${PXM}" fill="none" stroke="#b4cdc0" stroke-width="1.05"/></pattern>
    <marker id="pl-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#b45309"/></marker>
    <marker id="pl-arr-b" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7"/></marker>
  </defs>`);

  // Papel cuadriculado técnico
  P.push(`<rect width="${W}" height="${H}" fill="#f7faf8"/>`);
  P.push(`<rect x="${padL - 22}" y="${padT - 22}" width="${dims.totalL * PXM + 44}" height="${dims.totalW * PXM + 44}" fill="url(#pl-m)" stroke="#88a896" stroke-width="1.2"/>`);

  // Encabezado técnico
  P.push(`<text x="${padL - 18}" y="25" font-family="Inter,system-ui,sans-serif" font-size="13.5" font-weight="700" fill="#143224">${esc(tituloCapa)} · ${esc((park ? park.nombre : 'PARQUE').toUpperCase())}</text>`);
  P.push(`<text x="${padL - 18}" y="43" font-family="JetBrains Mono,monospace" font-size="9.8" fill="#3f5d4e">Tipología ${esc(proyecto.tipologia.letra)} (${esc(proyecto.tipologia.corto)}) · ${dims.totalL}×${dims.totalW} m (${dims.areaTotal} m²) · Cultivo ${sim.areaCultivo} m² · 2 cuadraditos = 1 m · Año ${cfg.anioRotacion}/4</text>`);

  // Rosa de los vientos (NORTE real)
  const nDeg = -(proyecto.orientAng * 180 / Math.PI);
  P.push(`<g transform="translate(${W - 42},40) rotate(${nDeg.toFixed(1)})">
    <circle r="19" fill="#fff" stroke="#1f4d36" stroke-width="1.2"/>
    <polygon points="0,-15 4.5,4 0,0 -4.5,4" fill="#1f4d36"/>
    <polygon points="0,15 4.5,-4 0,0 -4.5,-4" fill="#b4cdc0"/>
    <text x="0" y="-21" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="9" font-weight="700" fill="#143224">N</text>
  </g>`);

  // Polígono de intervención (editable)
  const polyPts = (proyecto.poligonoInterv || [[dims.uMin, dims.vMin], [dims.uMax, dims.vMin], [dims.uMax, dims.vMax], [dims.uMin, dims.vMax]])
    .map(q => `${X(q[0]).toFixed(1)},${Y(q[1]).toFixed(1)}`).join(' ');
  P.push(`<polygon points="${polyPts}" fill="${cfg.concepto === 'paisajistico' ? '#efe2d1' : '#ede4d3'}" fill-opacity="0.55" stroke="#64748b" stroke-width="1" stroke-dasharray="4 3"/>`);

  // Franjas solares (en capa camas)
  if ((capa === 'camas' || opts.editor) && cfg.mapaSolar) {
    const midV = (dims.vMin + dims.vMax) / 2;
    P.push(`<rect x="${X(dims.uMin)}" y="${Y(dims.vMin)}" width="${dims.totalL * PXM}" height="${(midV - dims.vMin) * PXM}" fill="rgba(16,185,129,0.06)"/>`);
    P.push(`<rect x="${X(dims.uMin)}" y="${Y(midV)}" width="${dims.totalL * PXM}" height="${(dims.vMax - midV) * PXM}" fill="rgba(245,158,11,0.08)"/>`);
    P.push(`<text x="${X(dims.uMin) + 6}" y="${Y(dims.vMin) + 12}" font-family="JetBrains Mono,monospace" font-size="8.2" fill="#047857">☀ 4–5 h luz (hojas / raíces)</text>`);
    P.push(`<text x="${X(dims.uMin) + 6}" y="${Y(dims.vMax) - 6}" font-family="JetBrains Mono,monospace" font-size="8.2" fill="#b45309">☀ 6–8 h sol pleno · cultivos altos hacia Sur/Oeste (sol ${sim.solar.sol.altDeg}°)</text>`);
  }

  // Cortinas cortavientos (Sur y Oeste)
  for (const cv of infra.cortaviento) {
    P.push(`<circle cx="${X(cv.u).toFixed(1)}" cy="${Y(cv.v).toFixed(1)}" r="${(1.1 * PXM).toFixed(1)}" fill="#2f7d44" fill-opacity="${capa === 'camas' ? 0.65 : 0.3}" stroke="#14532d" stroke-width="1"/>`);
  }
  if (infra.cortaviento.length) {
    P.push(`<text x="${X(0)}" y="${Y(dims.vMax + 3.0)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="8.8" font-weight="600" fill="#14532d">▲ CORTINAS CORTAVIENTOS (SUR Y OESTE · SIN SOMBREAR CANTEROS) ▲</text>`);
  }

  // Frutales y aromáticas perimetrales
  for (const ar of infra.aromaticas) {
    P.push(`<circle cx="${X(ar.u).toFixed(1)}" cy="${Y(ar.v).toFixed(1)}" r="4" fill="#9333ea" fill-opacity="0.48"/>`);
  }
  for (const fr of infra.frutales) {
    P.push(`<circle cx="${X(fr.u).toFixed(1)}" cy="${Y(fr.v).toFixed(1)}" r="${(0.8 * PXM).toFixed(1)}" fill="#84cc16" fill-opacity="0.38" stroke="#3f6212" stroke-width="1"/>`);
  }

  // Capa especial: Circulaciones y Accesibilidad
  if (capa === 'circulaciones') {
    const accX = X(infra.acceso.u), accY = Y(infra.acceso.v);
    const uMain = dims.uMin + 3.0 + dims.cab / 2;
    const vMid = (dims.vMin + dims.vMax) / 2;
    // Ruta principal accesible sin barreras (verde azulado grueso)
    P.push(`<polyline points="${accX.toFixed(1)},${(accY - 16).toFixed(1)} ${accX.toFixed(1)},${Y(vMid).toFixed(1)} ${X(uMain).toFixed(1)},${Y(vMid).toFixed(1)}" fill="none" stroke="#0d9488" stroke-width="${Math.max(10, dims.cab * PXM * 0.65).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.32"/>`);
    P.push(`<polyline points="${accX.toFixed(1)},${(accY - 16).toFixed(1)} ${accX.toFixed(1)},${Y(vMid).toFixed(1)} ${X(uMain).toFixed(1)},${Y(vMid).toFixed(1)}" fill="none" stroke="#0f766e" stroke-width="2" stroke-dasharray="6 4"/>`);
    // Círculo de giro silla de ruedas (1,50 m diámetro NTC 4143)
    P.push(`<circle cx="${accX.toFixed(1)}" cy="${Y(vMid).toFixed(1)}" r="${(0.75 * PXM).toFixed(1)}" fill="rgba(13,148,136,0.16)" stroke="#0f766e" stroke-width="1.4" stroke-dasharray="3 2"/>`);
    P.push(`<text x="${(accX + 18).toFixed(1)}" y="${(Y(vMid) + 4).toFixed(1)}" font-family="JetBrains Mono,monospace" font-size="8" font-weight="700" fill="#115e59">Giro Ø 1,50 m (NTC 4143)</text>`);
  }

  // Capa especial: Riego por goteo y captación lluvia
  const camas = elementos.filter(e => e.cat === 'cultivo');
  if ((capa === 'riego' || capa === 'camas') && camas.length) {
    const taX = X(infra.tomaAgua.u), taY = Y(infra.tomaAgua.v);
    const uPipe = camas[0].u + camas[0].l / 2 + 0.35;
    P.push(`<polyline points="${taX.toFixed(1)},${taY.toFixed(1)} ${X(uPipe).toFixed(1)},${taY.toFixed(1)} ${X(uPipe).toFixed(1)},${Y(camas[camas.length - 1].v).toFixed(1)}" fill="none" stroke="#0284c7" stroke-width="${capa === 'riego' ? 3 : 1.8}" stroke-dasharray="5 3" marker-end="url(#pl-arr-b)"/>`);
    if (capa === 'riego' && infra.invernadero) {
      P.push(`<line x1="${X(infra.invernadero.u).toFixed(1)}" y1="${Y(infra.invernadero.v - infra.invernadero.w / 2).toFixed(1)}" x2="${taX.toFixed(1)}" y2="${taY.toFixed(1)}" stroke="#0ea5e9" stroke-width="2.2" marker-end="url(#pl-arr-b)"/>`);
      P.push(`<text x="${((X(infra.invernadero.u) + taX) / 2).toFixed(1)}" y="${(taY + 14).toFixed(1)}" font-family="JetBrains Mono,monospace" font-size="7.5" fill="#0369a1">Captación lluvia cubierta</text>`);
    }
  }

  // Renderizado de todos los elementos paramétricos (resaltando la categoría de la capa activa)
  const bordeCol = { ladrillo: '#9a3412', madera: '#713f12', piedra: '#52525b', botellas: '#15803d' }[cfg.contencion] || '#713f12';
  const selId = opts.selectedId || null;

  for (const el of elementos) {
    const cx = X(el.u), cy = Y(el.v), bw = el.l * PXM, bh = el.w * PXM;
    const deg = (el.rot || 0) * 180 / Math.PI;
    const isSel = el.id === selId;
    const emphasis =
      capa === 'camas' ? (el.cat === 'cultivo' || el.tipo === 'invernadero') :
      capa === 'mobiliario' ? (el.cat === 'mobiliario' || el.tipo === 'jardinera_acc') :
      capa === 'riego' ? (el.cat === 'cultivo' || el.tipo === 'agua' || el.tipo === 'infiltracion' || el.tipo === 'invernadero') :
      capa === 'residuos' ? (el.tipo === 'abonera' || el.tipo === 'residuos_sep' || el.tipo === 'lavado' || el.cat === 'cultivo') :
      true;
    const op = emphasis ? 1 : 0.35;

    P.push(`<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${deg.toFixed(1)})" opacity="${op}" data-elid="${esc(el.id)}" style="${opts.editor ? 'cursor:grab' : ''}">`);

    if (el.cat === 'cultivo') {
      const fill = el.tipo === 'hidroponia' ? '#cffafe' : el.tipo === 'jardinera_acc' ? '#fde68a' : '#cbb896';
      const stroke = isSel ? '#dc2626' : (el.tipo === 'hidroponia' ? '#0891b2' : bordeCol);
      P.push(`<rect x="${(-bw / 2).toFixed(1)}" y="${(-bh / 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${cfg.concepto === 'paisajistico' ? 5 : 1.5}" fill="${fill}" stroke="${stroke}" stroke-width="${isSel ? 3 : 2}"/>`);
      if (capa === 'camas' || capa === 'riego' || opts.editor) {
        const dl = el.dripLines || 2;
        for (let li = 0; li < dl; li++) {
          const ly = -bh / 2 + ((li + 0.5) / dl) * bh;
          P.push(`<line x1="${(-bw / 2 + 4).toFixed(1)}" y1="${ly.toFixed(1)}" x2="${(bw / 2 - 4).toFixed(1)}" y2="${ly.toFixed(1)}" stroke="#0284c7" stroke-width="${capa === 'riego' ? 1.5 : 0.9}" stroke-dasharray="3 2" opacity="0.82"/>`);
        }
      }
      const esp = ESPECIES[el.especieId] || ESPECIES.lechuga;
      P.push(`<text x="0" y="-1" text-anchor="middle" font-family="Inter,sans-serif" font-size="8.2" font-weight="700" fill="#1c1917">#${el.bedNum || ''} ${esc(esp.n.split(' ')[0])}</text>`);
      P.push(`<text x="0" y="8.2" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.8" fill="#44403c">${el.l}×${el.w}m (${(el.l * el.w).toFixed(1)}m²)</text>`);
    } else {
      const cat = CATALOGO_ELEMENTOS[el.tipo] || { c: '#64748b' };
      const fillMap = {
        invernadero: '#e0f2fe', abonera: '#f5d0c5', bodega: '#e5e7eb', agua: '#bae6fd',
        pergola: '#fef3c7', banca: '#fed7aa', mesa_trabajo: '#fde68a', polinizadores: '#f3e8ff',
        infiltracion: '#dbeafe', hotel_insectos: '#ffedd5', lavado: '#ccfbf1', meteo: '#f3e8ff',
        senalizacion: '#f1f5f9', residuos_sep: '#dcfce7'
      };
      P.push(`<rect x="${(-bw / 2).toFixed(1)}" y="${(-bh / 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${fillMap[el.tipo] || '#e2e8f0'}" fill-opacity="${el.tipo === 'pergola' ? 0.55 : 0.88}" stroke="${isSel ? '#dc2626' : cat.c}" stroke-width="${isSel ? 3 : 1.7}" stroke-dasharray="${el.tipo === 'pergola' ? '5 3' : 'none'}"/>`);
      const shortN = el.tipo === 'invernadero' ? `INVERN. ${el.l}×${el.w}m`
        : el.tipo === 'abonera' ? `ABONERA ${el.l}×${el.w}m`
        : el.tipo === 'bodega' ? 'BODEGA'
        : el.tipo === 'agua' ? 'AGUA'
        : el.tipo === 'pergola' ? 'AULA / PÉRGOLA'
        : el.tipo === 'banca' ? 'Banca'
        : el.tipo === 'mesa_trabajo' ? 'Mesa'
        : el.tipo === 'polinizadores' ? 'POLINIZADORES'
        : el.tipo === 'infiltracion' ? 'INFILTRACIÓN'
        : el.tipo === 'residuos_sep' ? 'RESIDUOS'
        : el.tipo === 'lavado' ? 'LAVADO'
        : el.tipo === 'meteo' ? 'METEO'
        : el.tipo === 'hotel_insectos' ? 'HOTEL' : 'SEÑAL';
      P.push(`<text x="0" y="3" text-anchor="middle" font-family="Inter,sans-serif" font-size="7.2" font-weight="700" fill="#1e293b">${esc(shortN)}</text>`);
    }
    P.push('</g>');
  }

  // Capa especial: Flechas de flujo de residuos -> compostaje -> retorno a camas (Sección 4 & 10)
  if (capa === 'residuos' && camas.length) {
    const ab = infra.abonera;
    const sep = elementos.find(e => e.tipo === 'residuos_sep') || infra.acceso;
    const cUlt = camas[camas.length - 1];
    P.push(`<path d="M ${X(sep.u).toFixed(1)} ${Y(sep.v).toFixed(1)} Q ${(X(ab.u) + 40).toFixed(1)} ${((Y(sep.v) + Y(ab.v)) / 2).toFixed(1)} ${X(ab.u).toFixed(1)} ${Y(ab.v - ab.w / 2).toFixed(1)}" fill="none" stroke="#b45309" stroke-width="2.4" stroke-dasharray="5 3" marker-end="url(#pl-arr)"/>`);
    P.push(`<path d="M ${X(ab.u - ab.l / 2).toFixed(1)} ${Y(ab.v).toFixed(1)} Q ${((X(ab.u) + X(cUlt.u)) / 2).toFixed(1)} ${(Y(ab.v) + 34).toFixed(1)} ${X(cUlt.u).toFixed(1)} ${Y(cUlt.v).toFixed(1)}" fill="none" stroke="#15803d" stroke-width="2.6" marker-end="url(#pl-arr)"/>`);
    P.push(`<text x="${X(ab.u).toFixed(1)}" y="${(Y(ab.v + ab.w / 2) + 14).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="8" font-weight="700" fill="#9a3412">Orgánicos aptos → -62% masa (75 d) → ${sim.compostaje.compostObtenidoKg} kg compost/año</text>`);
  }

  // Escuadra 3-4-5 (60 × 80 × 100 cm, INTA p. 2)
  if ((capa === 'camas' || opts.editor) && cfg.guiaReplanteo && infra.triangulo345) {
    const tx = X(infra.triangulo345.u), ty = Y(infra.triangulo345.v);
    P.push(`<polygon points="${tx.toFixed(1)},${ty.toFixed(1)} ${(tx + 0.8 * PXM).toFixed(1)},${ty.toFixed(1)} ${tx.toFixed(1)},${(ty + 0.6 * PXM).toFixed(1)}" fill="rgba(234,179,8,0.38)" stroke="#ca8a04" stroke-width="1.5"/>`);
    P.push(`<text x="${(tx + 0.8 * PXM + 4).toFixed(1)}" y="${(ty - 3).toFixed(1)}" font-family="JetBrains Mono,monospace" font-size="7.2" font-weight="700" fill="#854d0e">3-4-5 (60×80×100 cm)</text>`);
  }

  // Cerco perimetral 1,50 m + postes + puerta acceso 1,50 m
  if (cerco.tipo !== 'ninguno') {
    for (const tr of cerco.tramos) {
      P.push(`<line x1="${X(tr.a[0]).toFixed(1)}" y1="${Y(tr.a[1]).toFixed(1)}" x2="${X(tr.b[0]).toFixed(1)}" y2="${Y(tr.b[1]).toFixed(1)}" stroke="#1f2937" stroke-width="2.2" stroke-dasharray="${cerco.tipo === 'romboidal' ? '6 2' : 'none'}"/>`);
    }
    for (const pt of cerco.postes) {
      P.push(`<circle cx="${X(pt.u).toFixed(1)}" cy="${Y(pt.v).toFixed(1)}" r="${pt.esq ? 3.4 : 2.1}" fill="${pt.esq ? '#b45309' : '#111827'}"/>`);
    }
  }
  P.push(`<text x="${X(infra.acceso.u).toFixed(1)}" y="${(Y(infra.acceso.v) - 6).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="8.6" font-weight="700" fill="#0f172a">▼ ACCESO ${infra.acceso.ancho.toFixed(2)} m ▼</text>`);

  // Cotas y escala gráfica
  const yCota = H - 34;
  P.push(`<line x1="${X(dims.uMin)}" y1="${yCota}" x2="${X(dims.uMax)}" y2="${yCota}" stroke="#1e293b" stroke-width="1"/>`);
  P.push(`<text x="${X(0)}" y="${yCota + 14}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="9" fill="#0f172a">${dims.totalL} × ${dims.totalW} m · paso ${Math.round(dims.paso * 100)} cm · cabeceras ${dims.cab.toFixed(2)} m · goteo ${dims.dripLines} líneas/cantero</text>`);
  P.push(`<g transform="translate(${W - 128},${H - 20})">
    <rect x="0" y="0" width="${PXM * 2}" height="5" fill="#143224"/><rect x="${PXM * 2}" y="0" width="${PXM * 2}" height="5" fill="#fff" stroke="#143224" stroke-width="0.9"/>
    <text x="0" y="-3" font-family="JetBrains Mono,monospace" font-size="7.5" fill="#143224">0</text>
    <text x="${PXM * 2}" y="-3" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="7.5" fill="#143224">2 m</text>
    <text x="${PXM * 4}" y="-3" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="7.5" fill="#143224">4 m</text>
  </g>`);
  P.push('</svg>');
  return P.join('');
}

/* ---------- Plano General de Implantación sobre el polígono real del parque ---------- */
function renderPlanoImplantacionSVG(proyecto, diag) {
  const { park, dims, sitio, orientAng, sim } = proyecto;
  const { x0, x1, z0, z1 } = park.bbox;
  const spanX = Math.max(20, x1 - x0), spanZ = Math.max(20, z1 - z0);
  const W = 740, H = 500, pad = 54;
  const sc = Math.min((W - pad * 2) / spanX, (H - pad * 2 - 42) / spanZ);
  const ox = (W - spanX * sc) / 2, oy = (H - 36 - spanZ * sc) / 2 + 26;
  const X = (x) => ox + (x - x0) * sc;
  const Y = (z) => oy + (z - z0) * sc;

  const P = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Plano general de implantación en ${esc(park.nombre)}">`];
  P.push(`<rect width="${W}" height="${H}" fill="#f7faf8"/>`);
  P.push(`<text x="20" y="24" font-family="Inter,sans-serif" font-size="13.5" font-weight="700" fill="#143224">PLANO GENERAL DE IMPLANTACIÓN · ${esc(park.nombre.toUpperCase())}</text>`);
  P.push(`<text x="20" y="40" font-family="JetBrains Mono,monospace" font-size="9.5" fill="#3f5d4e">${esc(park.tipo)} (${fmt(park.area)} m²) · Huerta ${dims.areaTotal} m² (${sim.pctParqueOcupado}% ocupación · ${sim.pctParqueLibre}% parque abierto) · 0 árboles talados</text>`);

  // Polígono real del parque
  const pStr = park.poly.map(q => `${X(q[0]).toFixed(1)},${Y(q[1]).toFixed(1)}`).join(' ');
  P.push(`<polygon points="${pStr}" fill="#e6f4ea" stroke="#15803d" stroke-width="2"/>`);

  // Rejilla de zonificación (Apta / Condicionada / No apta)
  if (diag && diag.celdas) {
    for (const c of diag.celdas) {
      const col = c.clase === 'apta' ? '#22c55e' : c.clase === 'cond' ? '#f59e0b' : '#ef4444';
      const r = Math.max(2, (c.s * sc) * 0.45);
      P.push(`<rect x="${(X(c.x) - r).toFixed(1)}" y="${(Y(c.z) - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" fill="${col}" fill-opacity="0.26"/>`);
    }
  }
  // Árboles censados conservados
  if (diag && diag.arbolesParque) {
    for (const t of diag.arbolesParque) {
      P.push(`<circle cx="${X(t[0]).toFixed(1)}" cy="${Y(t[1]).toFixed(1)}" r="${Math.max(2.5, 2.2 * sc).toFixed(1)}" fill="#166534" fill-opacity="0.72"/>`);
    }
  }
  // Huella de la huerta implantada
  const cs = Math.cos(orientAng), sn = Math.sin(orientAng);
  const corners = [[-dims.totalL / 2, -dims.totalW / 2], [dims.totalL / 2, -dims.totalW / 2], [dims.totalL / 2, dims.totalW / 2], [-dims.totalL / 2, dims.totalW / 2]]
    .map(([u, v]) => [sitio[0] + u * cs - v * sn, sitio[1] + u * sn + v * cs]);
  P.push(`<polygon points="${corners.map(q => `${X(q[0]).toFixed(1)},${Y(q[1]).toFixed(1)}`).join(' ')}" fill="#f59e0b" fill-opacity="0.45" stroke="#92400e" stroke-width="2.2"/>`);
  P.push(`<text x="${X(sitio[0]).toFixed(1)}" y="${(Y(sitio[1]) + 3).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="9" font-weight="700" fill="#451a03">HUERTA ${dims.totalL}×${dims.totalW}m</text>`);

  // Leyenda
  P.push(`<g transform="translate(20,${H - 22})" font-family="JetBrains Mono,monospace" font-size="9" fill="#1e293b">
    <rect x="0" y="-9" width="10" height="10" fill="#22c55e" fill-opacity="0.4"/><text x="14" y="0">Apta (${diag ? diag.pctApta : '-'}%)</text>
    <rect x="112" y="-9" width="10" height="10" fill="#f59e0b" fill-opacity="0.4"/><text x="126" y="0">Condicionada (${diag ? diag.pctCond : '-'}%)</text>
    <rect x="260" y="-9" width="10" height="10" fill="#ef4444" fill-opacity="0.4"/><text x="274" y="0">No apta (${diag ? diag.pctNoApta : '-'}%)</text>
    <circle cx="390" cy="-4" r="4" fill="#166534"/><text x="400" y="0">Árboles conservados (${diag ? diag.arbolesDentro : 0})</text>
    <rect x="575" y="-9" width="12" height="10" fill="#f59e0b" fill-opacity="0.55" stroke="#92400e"/><text x="592" y="0">Huerta diseñada</text>
  </g>`);
  P.push('</svg>');
  return P.join('');
}

/* ---------- Exportación GeoJSON WGS84 real (Kennedy, Bogotá) ---------- */
export function generarGeoJSON(proyecto) {
  const { park, sitio, orientAng, elementos, dims, sim } = proyecto;
  const cs = Math.cos(orientAng), sn = Math.sin(orientAng);
  const locAMundo = (u, v) => [sitio[0] + u * cs - v * sn, sitio[1] + u * sn + v * cs];
  const rectGeo = (u, v, l, w, rot = 0) => {
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const pts = [[-l / 2, -w / 2], [l / 2, -w / 2], [l / 2, w / 2], [-l / 2, w / 2], [-l / 2, -w / 2]]
      .map(([a, b]) => {
        const lu = u + a * cr - b * sr, lv = v + a * sr + b * cr;
        const mw = locAMundo(lu, lv);
        return mundoAGeo(mw[0], mw[1]);
      });
    return [pts];
  };

  const features = [];
  if (park && park.poly) {
    const ring = park.poly.map(q => mundoAGeo(q[0], q[1]));
    ring.push(ring[0]);
    features.push({
      type: 'Feature',
      properties: { capa: 'parque', nombre: park.nombre, clasificacion: park.tipo, area_m2: park.area, fuente: 'IDRD data3d/parques.json' },
      geometry: { type: 'Polygon', coordinates: [ring] }
    });
  }
  features.push({
    type: 'Feature',
    properties: {
      capa: 'huerta_perimetro', tipologia: proyecto.tipologia.n, escenario: proyecto.cfg.escenario,
      area_total_m2: dims.areaTotal, area_cultivo_m2: sim.areaCultivo, ocupacion_pct: sim.pctParqueOcupado
    },
    geometry: { type: 'Polygon', coordinates: rectGeo(0, 0, dims.totalL, dims.totalW, 0) }
  });
  for (const el of elementos) {
    const esp = el.especieId ? ESPECIES[el.especieId] : null;
    features.push({
      type: 'Feature',
      properties: {
        capa: el.cat, id: el.id, tipo: el.tipo, nombre: el.n, largo_m: el.l, ancho_m: el.w,
        especie: esp ? esp.n : null, familia: esp ? esp.fam : null, lineas_goteo: el.dripLines || null,
        justificacion: el.justificacion || null
      },
      geometry: { type: 'Polygon', coordinates: rectGeo(el.u, el.v, el.l, el.w, el.rot || 0) }
    });
  }
  return JSON.stringify({
    type: 'FeatureCollection',
    name: `huerta_${(park ? park.nombre : 'parque').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    crs_note: 'WGS84 (EPSG:4326) · Kennedy, Bogotá D.C.',
    features
  }, null, 2);
}

/* ---------- Exportación CSV completa (Excel UTF-8 BOM) ---------- */
export function generarCSV(proyecto) {
  const { park, elementos, cerco, sim, dims } = proyecto;
  const rows = [
    ['SECCION', 'ITEM', 'DETALLE', 'MEDIDA / CANTIDAD', 'UNIDAD / NOTA'],
    ['RESUMEN', 'Parque', park ? park.nombre : '-', park ? park.area : 0, 'm2 totales IDRD'],
    ['RESUMEN', 'Tipología', `${proyecto.tipologia.letra} · ${proyecto.tipologia.n}`, dims.areaTotal, `m2 huerta (${sim.pctParqueOcupado}% del parque)`],
    ['RESUMEN', 'Superficie cultivada neta', 'Camas productivas + jardineras', sim.areaCultivo, 'm2 netos'],
    ['RESUMEN', 'Producción estimada (rango)', 'JBB / Pro Huerta INTA / AGROSAVIA', `${sim.productiva.kgMin}–${sim.productiva.kgMax}`, 'kg frescos/año (confianza Media)'],
    ['RESUMEN', 'Demanda hídrica / Lluvia', 'FAO-56 + IDEAM Bogotá (880 mm/año)', `${sim.hidrica.demandaDiariaL} L/día · ${sim.hidrica.coberturaLluviaPct}% lluvia`, `${sim.hidrica.demAnualM3} m3/año`],
    ['RESUMEN', 'Compostaje circular', 'Reducción masa 62% en 75 días', sim.compostaje.compostObtenidoKg, `kg compost/año (${sim.compostaje.autosufAbonoPct}% demanda)`],
    ['RESUMEN', 'Inversión referencial (COP)', 'Estimación paramétrica Bogotá (±30%)', sim.costos.capexTotal, 'COP inversión inicial'],
    ['', '', '', '', ''],
    ['CAMAS Y ESPECIES', 'Cantero', 'Especie (Familia)', 'Dimensiones / Goteo', 'Calendario / Relevo / Rotación 4 años']
  ];
  for (const el of elementos.filter(e => e.cat === 'cultivo')) {
    const esp = ESPECIES[el.especieId] || ESPECIES.lechuga;
    rows.push([
      'CULTIVO', el.etiqueta || el.n, `${esp.n} (${esp.fam})`,
      `${el.l}x${el.w} m (${(el.l * el.w).toFixed(1)} m2) · ${el.dripLines || 2} líneas goteo`,
      `${esp.etapas.semillas.calendario} | Relevo: ${esp.etapas.regeneracion.relevo} | Rot: ${(el.rot4 || []).join('->')}`
    ]);
  }
  rows.push(['', '', '', '', '']);
  rows.push(['CERCO INTA 1.50m', 'Material', 'Especificación INTA p. 4', 'Cantidad', 'Unidad']);
  const b = cerco.bom;
  rows.push(['CERCO', 'Tejido romboidal', 'Malla 3", alambre N°14, 1,50 m alto', b.tejidoRomboidalM, 'm']);
  rows.push(['CERCO', 'Postes', 'Madera/hormigón 3"x3"x2m (ent. 45-50 cm)', b.postesUn, 'unidades']);
  rows.push(['CERCO', 'Puntales', '3"x3"x2m (esquinas, puerta y cada 10 m)', b.puntalesUn, 'unidades']);
  rows.push(['CERCO', 'Alambre liso', 'Galvanizado N°14 (3 líneas tensado)', b.alambreLisoM, 'm']);
  rows.push(['CERCO', 'Accesorios', 'Planchuelas / Ganchos J / Golondrinas', `${b.planchuelasUn} / ${b.ganchosJUn} / ${b.torniquetesUn}`, 'unidades']);
  rows.push(['CERCO', 'Faja malla fina', '1,00 m alto + 40 cm enterrada', b.mallaFinaM, 'm']);
  return '\uFEFF' + rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

/* ---------- Reporte técnico imprimible a PDF (abre ventana de impresión limpia con planos, tablas y comparación A/B/C) ---------- */
export function abrirReportePDF(proyecto, escenarios, diag) {
  const { park, sim, dims, cerco, elementos } = proyecto;
  const svgImp = renderPlanoCapaSVG(proyecto, 'implantacion', diag);
  const svgCam = renderPlanoCapaSVG(proyecto, 'camas', diag);
  const svgRie = renderPlanoCapaSVG(proyecto, 'riego', diag);
  const camas = elementos.filter(e => e.cat === 'cultivo');

  const compRows = escenarios ? ['A', 'B', 'C'].map(k => {
    const p = escenarios[k];
    return `<tr>
      <td><b>Escenario ${k}</b> (${esc(p.tipologia.corto)})</td>
      <td>${p.sim.areaCultivo} m²</td>
      <td>${p.sim.productiva.kgMin}–${p.sim.productiva.kgMax} kg/año</td>
      <td>${p.sim.hidrica.demandaDiariaL} L/d (${p.sim.hidrica.coberturaLluviaPct}% lluvia)</td>
      <td>${p.sim.biodiversidad.indiceBio}/100</td>
      <td>${p.sim.usoPublico.aforoSim} pers. (${p.sim.pctParqueLibre}% libre)</td>
      <td>$${(p.sim.costos.capexTotal / 1e6).toFixed(1)} M COP</td>
    </tr>`;
  }).join('') : '';

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <title>Reporte Técnico Huerta Urbana · ${esc(park ? park.nombre : 'Kennedy')}</title>
  <style>
    body{font-family:Inter,system-ui,sans-serif;color:#14231c;margin:20px;line-height:1.45;font-size:11.5px}
    h1{font-size:18px;margin:0 0 4px;color:#0f3d28} h2{font-size:13.5px;margin:18px 0 6px;border-bottom:1.5px solid #166534;padding-bottom:3px;color:#14532d}
    .meta{color:#475569;font-size:10.5px;margin-bottom:14px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}
    .card{border:1px solid #cbd5e1;border-radius:8px;padding:8px;background:#f8fafc}
    .card b{display:block;font-size:14px;color:#14532d}
    table{width:100%;border-collapse:collapse;margin:8px 0;font-size:10.5px}
    th,td{border:1px solid #cbd5e1;padding:5px 7px;text-align:left;vertical-align:top}
    th{background:#ecfdf5;color:#14532d}
    .svgbox{border:1px solid #cbd5e1;border-radius:8px;padding:8px;margin:8px 0;text-align:center;page-break-inside:avoid}
    .svgbox svg{max-width:100%;height:auto}
    .aviso{background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:8px 10px;font-size:10.5px;margin:10px 0}
    @media print{.noprint{display:none}}
  </style></head><body>
  <div class="noprint" style="margin-bottom:12px"><button onclick="window.print()" style="padding:8px 14px;background:#166534;color:#fff;border:0;border-radius:6px;cursor:pointer;font-weight:600">🖨 Imprimir / Guardar como PDF</button></div>
  <h1>Laboratorio Agroecológico Urbano · ${esc(park ? park.nombre : 'Parque')} (Kennedy, Bogotá)</h1>
  <div class="meta">Clasificación IDRD: ${esc(park ? park.tipo : '-')} (${fmt(park ? park.area : 0)} m²) · Tipología ${esc(proyecto.tipologia.letra)}: ${esc(proyecto.tipologia.n)} · Referencias: Pro Huerta–INTA (2016), JBB, FAO-56, AGROSAVIA, IDEAM.</div>

  <div class="grid">
    <div class="card"><b>${sim.areaCultivo} m²</b>Superficie cultivada (${dims.areaTotal} m² huella · ${sim.pctParqueLibre}% parque libre)</div>
    <div class="card"><b>${sim.productiva.kgMin}–${sim.productiva.kgMax} kg/año</b>Producción estimada (${sim.productiva.familiasINTA} familias ref. INTA)</div>
    <div class="card"><b>${sim.hidrica.demandaDiariaL} L/día</b>Riego goteo (lluvia cubre ${sim.hidrica.coberturaLluviaPct}%)</div>
    <div class="card"><b>$${(sim.costos.capexTotal / 1e6).toFixed(1)} M COP</b>Inversión referencial (±30%)</div>
  </div>

  <div class="aviso"><b>Transparencia y verificación en campo:</b> Este reporte distingue datos importados (IDRD/OSM/Censo arbolado), mediciones geométricas y estimaciones paramétricas. Antes de ejecutar obra se debe validar en campo: (1) análisis de suelo y metales pesados (Regla 11.2), (2) topografía de detalle (&lt;0,5 m), (3) punto de acueducto EAAB y (4) viabilidad jurídica/administrativa con IDRD y comunidad (JAC).</div>

  <h2>1. Plano General de Implantación</h2><div class="svgbox">${svgImp}</div>
  <h2>2. Plano de Camas de Cultivo (Escala 2 cuadraditos = 1 m)</h2><div class="svgbox">${svgCam}</div>
  <h2>3. Plano de Riego por Goteo y Captación Pluvial</h2><div class="svgbox">${svgRie}</div>

  <h2>4. Comparación de Escenarios Automáticos (A · B · C)</h2>
  <table><thead><tr><th>Escenario</th><th>Cultivo</th><th>Producción est.</th><th>Agua</th><th>Biodiversidad</th><th>Uso público</th><th>Costo ref.</th></tr></thead><tbody>${compRows}</tbody></table>

  <h2>5. Listado de Especies, Calendario y Rotación (≥ 3 años)</h2>
  <table><thead><tr><th>Cama</th><th>Especie</th><th>Área</th><th>Distancia</th><th>Siembra y ciclo</th><th>Relevo y Rotación 4 años</th></tr></thead><tbody>
  ${camas.map(c => {
    const e = ESPECIES[c.especieId] || ESPECIES.lechuga;
    return `<tr><td>${esc(c.etiqueta)}</td><td><b>${esc(e.n)}</b><br><i>${esc(e.sci)}</i> (${esc(e.fam)})</td><td>${c.l}×${c.w} m (${(c.l * c.w).toFixed(1)} m²)</td><td>${esc(e.etapas.trasplante.dist)}</td><td>${esc(e.etapas.semillas.siembra)} · ${e.etapas.cosecha.dias} d</td><td>${esc(e.etapas.regeneracion.relevo)}<br>${(c.rot4 || []).join(' → ')}</td></tr>`;
  }).join('')}
  </tbody></table>

  <h2>6. Cómputo de Materiales · Cerco Perimetral 1,50 m (INTA p. 4)</h2>
  <table><thead><tr><th>Material</th><th>Cantidad</th></tr></thead><tbody>
    <tr><td>Tejido romboidal malla 3", alambre Nº 14, 1,50 m alto</td><td>${cerco.bom.tejidoRomboidalM} m</td></tr>
    <tr><td>Postes 3"×3"×2 m (enterrados 45–50 cm, pintura asfáltica)</td><td>${cerco.bom.postesUn} unidades</td></tr>
    <tr><td>Puntales 3"×3"×2 m (esquinas, puerta y cada 10 m)</td><td>${cerco.bom.puntalesUn} unidades</td></tr>
    <tr><td>Alambre galvanizado liso Nº 14 (3 líneas)</td><td>${cerco.bom.alambreLisoM} m</td></tr>
    <tr><td>Planchuelas / Ganchos "J" / Torniquetes golondrina Nº 5</td><td>${cerco.bom.planchuelasUn} / ${cerco.bom.ganchosJUn} / ${cerco.bom.torniquetesUn} unid.</td></tr>
    <tr><td>Faja inferior de malla fina (1 m alto + 40 cm enterrada)</td><td>${cerco.bom.mallaFinaM} m</td></tr>
  </tbody></table>

  <h2>7. Supuestos, Fuentes y Limitaciones de las 7 Simulaciones</h2>
  <table><thead><tr><th>Simulación</th><th>Resultado</th><th>Supuestos y Fuentes</th><th>Limitaciones y Confianza</th></tr></thead><tbody>
  ${['solar', 'hidrica', 'productiva', 'compostaje', 'biodiversidad', 'usoPublico', 'costos'].map(k => {
    const s = sim[k];
    return `<tr><td><b>${esc(s.titulo)}</b></td><td>${esc(s.resumen)}</td><td>${esc(s.supuestos)}<br><i>Fuentes: ${esc(s.fuentes)}</i></td><td>${esc(s.limitaciones)}<br><b>Confianza: ${esc(s.confianza)}</b></td></tr>`;
  }).join('')}
  </tbody></table>
  </body></html>`;

  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (w) { w.document.open(); w.document.write(html); w.document.close(); }
}

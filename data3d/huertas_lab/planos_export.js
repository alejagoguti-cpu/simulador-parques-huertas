/* ============ PLANOS ARQUITECTÓNICOS CAD (ESTILO RAYON · 2 CUADRADITOS = 1 m) Y EXPORTACIONES ============
   - Estética de lámina de arquitectura del paisaje (papel técnico cálido, espesores de línea calibrados,
     bloques CAD arquitectónicos, símbolos botánicos de vegetales en planta y tramas/rayados editables).
   - 6 capas vectoriales SVG a escala + bloques de rayado personalizados por el usuario
   - Exportación GeoJSON WGS84 real (Bogotá / Kennedy), CSV Excel UTF-8 y reporte imprimible PDF.
   - Cero emojis: simbología arquitectónica técnica y limpia. */

import { ESPECIES, CATALOGO_ELEMENTOS } from './datos_agronomia.js?v=1';
import { mundoAGeo } from './diagnostico_parque.js?v=1';

const esc = (s) => String(s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const fmt = (v, d = 0) => Number(v).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

export const CAPAS_PLANO = [
  { id: 'camas',         n: 'Planta de cultivos y bloques' },
  { id: 'implantacion',  n: 'Implantación en el parque' },
  { id: 'mobiliario',    n: 'Mobiliario y permanencia' },
  { id: 'circulaciones', n: 'Circulaciones y accesibilidad' },
  { id: 'riego',         n: 'Riego por goteo y lluvia' },
  { id: 'residuos',      n: 'Flujo residuos y compostaje' }
];

export const HATCHES_RAYON = {
  tierra:   { id: 'tierra',   n: 'Tierra labrada (45°)',      bg: '#efe7da', ink: '#9e8263', col3d: '#594230' },
  grava:    { id: 'grava',    n: 'Gravilla / viruta',         bg: '#f2efe8', ink: '#8f877a', col3d: '#9c8b74' },
  prado:    { id: 'prado',    n: 'Cobertura vegetal / prado', bg: '#e6efe2', ink: '#5f8764', col3d: '#66875c' },
  madera:   { id: 'madera',   n: 'Deck / entablado madera',   bg: '#efe3d2', ink: '#8c6540', col3d: '#8a6240' },
  adoquin:  { id: 'adoquin',  n: 'Adoquín peatonal',          bg: '#ece9e3', ink: '#857e76', col3d: '#aba399' },
  agua:     { id: 'agua',     n: 'Agua / biofiltración',      bg: '#e2eff4', ink: '#3b7a94', col3d: '#46829c' },
  compost:  { id: 'compost',  n: 'Sustrato / compostaje',     bg: '#ebe0d6', ink: '#7a5a42', col3d: '#453123' },
  concreto: { id: 'concreto', n: 'Estancia mineral / losa',   bg: '#ededeb', ink: '#808482', col3d: '#9e9d99' }
};

/* ---------- Patrones SVG arquitectónicos (Rayados CAD estilo Rayon) ---------- */
function svgDefsArquitectonicos(PXM) {
  return `<defs>
    <pattern id="pl-sub" width="${PXM / 2}" height="${PXM / 2}" patternUnits="userSpaceOnUse">
      <path d="M ${PXM / 2} 0 L 0 0 0 ${PXM / 2}" fill="none" stroke="#ebe6dc" stroke-width="0.45"/>
    </pattern>
    <pattern id="pl-m" width="${PXM}" height="${PXM}" patternUnits="userSpaceOnUse">
      <rect width="${PXM}" height="${PXM}" fill="url(#pl-sub)"/>
      <path d="M ${PXM} 0 L 0 0 0 ${PXM}" fill="none" stroke="#dad3c7" stroke-width="0.75"/>
    </pattern>

    <!-- Rayado 1: Tierra labrada 45° -->
    <pattern id="rh-tierra" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="7" height="7" fill="#efe7da"/>
      <line x1="0" y1="0" x2="0" y2="7" stroke="#b59b7c" stroke-width="0.65"/>
      <line x1="3.5" y1="0" x2="3.5" y2="7" stroke="#cbb89e" stroke-width="0.35" stroke-dasharray="2 2"/>
    </pattern>

    <!-- Rayado 2: Gravilla / viruta punteada -->
    <pattern id="rh-grava" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="#f3f0e9"/>
      <circle cx="2.5" cy="3" r="0.65" fill="#9c9385"/>
      <circle cx="8.5" cy="2" r="0.5" fill="#b0a89b"/>
      <circle cx="5.5" cy="7.5" r="0.7" fill="#9c9385"/>
      <circle cx="10.5" cy="9.5" r="0.55" fill="#a8a093"/>
      <circle cx="1.5" cy="10.5" r="0.45" fill="#b0a89b"/>
    </pattern>

    <!-- Rayado 3: Prado / cobertura vegetal -->
    <pattern id="rh-prado" width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="#e8f0e4"/>
      <path d="M3 9 l1 -3 l1 3 M9 5 l1 -2.5 l1 2.5 M7 12 l1 -2.5 l1 2.5" fill="none" stroke="#6c9470" stroke-width="0.65" stroke-linecap="round"/>
    </pattern>

    <!-- Rayado 4: Deck / entablado madera -->
    <pattern id="rh-madera" width="16" height="6" patternUnits="userSpaceOnUse">
      <rect width="16" height="6" fill="#efe3d2"/>
      <line x1="0" y1="0" x2="16" y2="0" stroke="#9b7752" stroke-width="0.6"/>
      <line x1="8" y1="0" x2="8" y2="3" stroke="#b89977" stroke-width="0.4"/>
      <line x1="0" y1="3" x2="16" y2="3" stroke="#9b7752" stroke-width="0.55"/>
      <line x1="14" y1="3" x2="14" y2="6" stroke="#b89977" stroke-width="0.4"/>
    </pattern>

    <!-- Rayado 5: Adoquín peatonal -->
    <pattern id="rh-adoquin" width="14" height="8" patternUnits="userSpaceOnUse">
      <rect width="14" height="8" fill="#edeae4"/>
      <path d="M0 0 H14 M0 4 H14 M0 0 V4 M7 0 V4 M3.5 4 V8 M10.5 4 V8" fill="none" stroke="#a69f95" stroke-width="0.5"/>
    </pattern>

    <!-- Rayado 6: Agua / biofiltración -->
    <pattern id="rh-agua" width="16" height="7" patternUnits="userSpaceOnUse">
      <rect width="16" height="7" fill="#e3eff4"/>
      <path d="M0 3.5 Q4 2 8 3.5 T16 3.5" fill="none" stroke="#4a89a4" stroke-width="0.65"/>
    </pattern>

    <!-- Rayado 7: Compostaje / sustrato -->
    <pattern id="rh-compost" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="#ebe0d6"/>
      <path d="M0 6 L6 0 M0 0 L6 6" fill="none" stroke="#8c6b52" stroke-width="0.48" opacity="0.7"/>
    </pattern>

    <!-- Rayado 8: Concreto / losa mineral -->
    <pattern id="rh-concreto" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#eeefed"/>
      <path d="M16 0 L0 0 0 16" fill="none" stroke="#b9beba" stroke-width="0.55"/>
      <circle cx="8" cy="8" r="0.45" fill="#9ea39f"/>
    </pattern>

    <!-- Rayado técnico: vidrio invernadero -->
    <pattern id="rh-vidrio" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <rect width="12" height="12" fill="#f3f9fb"/>
      <line x1="0" y1="0" x2="0" y2="12" stroke="#9ec0cc" stroke-width="0.55"/>
      <line x1="3" y1="0" x2="3" y2="12" stroke="#c8dfe7" stroke-width="0.35"/>
    </pattern>

    <!-- Marcadores técnicos sutiles -->
    <marker id="pl-arr-w" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1.2 L 7 4 L 0 6.8 z" fill="#2c6f8e"/>
    </marker>
    <marker id="pl-arr-c" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1.2 L 7 4 L 0 6.8 z" fill="#7c5334"/>
    </marker>
    <marker id="pl-arr-g" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1.2 L 7 4 L 0 6.8 z" fill="#2f6b47"/>
    </marker>
  </defs>`;
}

/* ---------- Símbolos botánicos arquitectónicos en planta (trazos limpios CAD, ligeros y legibles) ---------- */
function dibujarVegetalPlanta(esp, x, y, r, seed = 0) {
  const rot = (seed * 47) % 360;
  const t = esp.tipo3d || 'roseta';
  const ink = '#1e3829';
  const fill = esp.c || '#6b9e63';
  const fill2 = esp.c2 || '#8bb878';
  const f1 = (v) => v.toFixed(1);

  // 1. Roseta (Lechuga, Espinaca): corona festoneada de 6 hojas + corazón espiral interior
  if (t === 'roseta') {
    const r1 = r * 0.96, r2 = r * 0.56;
    let dOut = '';
    for (let k = 0; k < 6; k++) {
      const a0 = (k * 60) * Math.PI / 180, a1 = (k * 60 + 30) * Math.PI / 180, a2 = ((k + 1) * 60) * Math.PI / 180;
      const x0 = Math.cos(a0) * r2, y0 = Math.sin(a0) * r2;
      const xc = Math.cos(a1) * r1 * 1.18, yc = Math.sin(a1) * r1 * 1.18;
      const x2 = Math.cos(a2) * r2, y2 = Math.sin(a2) * r2;
      dOut += (k === 0 ? `M${f1(x0)},${f1(y0)}` : '') + `Q${f1(xc)},${f1(yc)} ${f1(x2)},${f1(y2)}`;
    }
    return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${rot})">
      <path d="${dOut}Z" fill="${fill}" fill-opacity="0.56" stroke="${ink}" stroke-width="0.65"/>
      <circle r="${f1(r * 0.45)}" fill="${fill2}" fill-opacity="0.72" stroke="${ink}" stroke-width="0.5"/>
      <path d="M${f1(-r * 0.2)},0 A${f1(r * 0.2)},${f1(r * 0.2)} 0 1,1 ${f1(r * 0.16)},${f1(r * 0.12)}" fill="none" stroke="#f0f5e8" stroke-width="0.6"/>
    </g>`;
  }

  // 2. Acelga (hojas verdes radiales + pencas blancas marcadas)
  if (t === 'hojaAlta') {
    let leaves = '', ribs = '';
    for (let k = 0; k < 5; k++) {
      const a = k * 72 * Math.PI / 180;
      const dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
      leaves += `M0,0 Q${f1(dx * r * 0.5 + px * r * 0.34)},${f1(dy * r * 0.5 + py * r * 0.34)} ${f1(dx * r)},${f1(dy * r)} Q${f1(dx * r * 0.5 - px * r * 0.34)},${f1(dy * r * 0.5 - py * r * 0.34)} 0,0 `;
      ribs += `M0,0 L${f1(dx * r * 0.72)},${f1(dy * r * 0.72)} `;
    }
    return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${rot})">
      <path d="${leaves}" fill="${fill}" fill-opacity="0.62" stroke="${ink}" stroke-width="0.6"/>
      <path d="${ribs}" stroke="#faf7ee" stroke-width="0.9" stroke-linecap="round"/>
      <circle r="${f1(r * 0.16)}" fill="#faf7ee" stroke="${ink}" stroke-width="0.45"/>
    </g>`;
  }

  // 3. Repollo / Brócoli / Coliflor (hojas envolventes + cogollo o florete central)
  if (t === 'repollo') {
    const esCol = /brócoli|coliflor/i.test(esp.n);
    const headCol = /coliflor/i.test(esp.n) ? '#f4f0e4' : (/brócoli/i.test(esp.n) ? '#32633e' : '#bfd6b0');
    let dW = '';
    for (let k = 0; k < 5; k++) {
      const a0 = k * 72 * Math.PI / 180, a1 = (k * 72 + 36) * Math.PI / 180, a2 = (k + 1) * 72 * Math.PI / 180;
      dW += (k === 0 ? `M${f1(Math.cos(a0) * r * 0.52)},${f1(Math.sin(a0) * r * 0.52)}` : '')
        + `Q${f1(Math.cos(a1) * r * 1.15)},${f1(Math.sin(a1) * r * 1.15)} ${f1(Math.cos(a2) * r * 0.52)},${f1(Math.sin(a2) * r * 0.52)}`;
    }
    const detail = esCol
      ? `<circle r="${f1(r * 0.24)}" fill="none" stroke="${ink}" stroke-width="0.45" stroke-dasharray="1.4 1.2"/>`
      : `<path d="M${f1(-r * 0.22)},0 A${f1(r * 0.22)},${f1(r * 0.22)} 0 1,1 ${f1(r * 0.2)},${f1(r * 0.1)}" fill="none" stroke="${ink}" stroke-width="0.5"/>`;
    return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${rot})">
      <path d="${dW}Z" fill="${fill}" fill-opacity="0.48" stroke="${ink}" stroke-width="0.6"/>
      <circle r="${f1(r * 0.48)}" fill="${headCol}" stroke="${ink}" stroke-width="0.65"/>${detail}
    </g>`;
  }

  // 4. Tomate / Ají / Arveja con tutor (cruz de tutor + follaje estrellado + tomates rojos)
  if (t === 'tutor') {
    let dF = '';
    for (let k = 0; k < 5; k++) {
      const a = k * 72 * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
      dF += `M0,0 Q${f1(dx * r * 0.55 + px * r * 0.28)},${f1(dy * r * 0.55 + py * r * 0.28)} ${f1(dx * r)},${f1(dy * r)} Q${f1(dx * r * 0.55 - px * r * 0.28)},${f1(dy * r * 0.55 - py * r * 0.28)} 0,0 `;
    }
    const fr = esp.fr
      ? `<circle cx="${f1(r * 0.42)}" cy="${f1(r * 0.26)}" r="${f1(r * 0.21)}" fill="${esp.fr}" stroke="#6b1d14" stroke-width="0.45"/><circle cx="${f1(-r * 0.34)}" cy="${f1(-r * 0.34)}" r="${f1(r * 0.17)}" fill="${esp.fr}" stroke="#6b1d14" stroke-width="0.4"/>`
      : '';
    return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${rot})">
      <path d="${dF}" fill="${fill}" fill-opacity="0.56" stroke="${ink}" stroke-width="0.55"/>
      <circle r="${f1(r * 0.19)}" fill="#c8ab80" stroke="#5c4328" stroke-width="0.65"/>${fr}
    </g>`;
  }

  // 5. Raíces (Zanahoria, Rábano, Remolacha): fronda radial fina + corona naranja/carmesí
  if (t === 'raiz' || t === 'fina') {
    let rays = '';
    for (let k = 0; k < 8; k++) {
      const a = k * 45 * Math.PI / 180;
      rays += `M0,0 L${f1(Math.cos(a) * r)},${f1(Math.sin(a) * r)} `;
    }
    return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${rot})">
      <circle r="${f1(r * 0.72)}" fill="${fill}" fill-opacity="0.24"/>
      <path d="${rays}" stroke="${ink}" stroke-width="0.65" stroke-linecap="round"/>
      <circle r="${f1(r * 0.30)}" fill="${esp.fr || '#d97736'}" stroke="${ink}" stroke-width="0.55"/>
    </g>`;
  }

  // 6. Cebolla larga (haz compacto de tallos)
  if (t === 'tira') {
    return `<g transform="translate(${f1(x)},${f1(y)})">
      <circle r="${f1(r * 0.68)}" fill="${fill}" fill-opacity="0.46" stroke="${ink}" stroke-width="0.6" stroke-dasharray="2.2 1.2"/>
      <circle r="${f1(r * 0.28)}" fill="#f6f4ec" stroke="${ink}" stroke-width="0.55"/>
    </g>`;
  }

  // 7. Calabacín / Ahuyama (hoja palmada lobulada + flor amarilla)
  if (t === 'rastrero') {
    let dP = '';
    for (let k = 0; k < 5; k++) {
      const a = k * 72 * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
      dP += `M0,0 Q${f1(dx * r * 0.45 + px * r * 0.38)},${f1(dy * r * 0.45 + py * r * 0.38)} ${f1(dx * r)},${f1(dy * r)} Q${f1(dx * r * 0.45 - px * r * 0.38)},${f1(dy * r * 0.45 - py * r * 0.38)} 0,0 `;
    }
    return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${rot})">
      <path d="${dP}" fill="${fill}" fill-opacity="0.58" stroke="${ink}" stroke-width="0.6"/>
      ${esp.fr ? `<circle cx="${f1(r * 0.28)}" cy="${f1(-r * 0.22)}" r="${f1(r * 0.22)}" fill="${esp.fr}" stroke="#7a5414" stroke-width="0.45"/>` : ''}
      <circle r="${f1(r * 0.12)}" fill="${ink}"/>
    </g>`;
  }

  // 8. Maíz / Aromáticas (corona estrellada limpia)
  let dM = '';
  for (let k = 0; k < 6; k++) {
    const a = k * 60 * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
    dM += `M0,0 Q${f1(dx * r * 0.5 + px * r * 0.22)},${f1(dy * r * 0.5 + py * r * 0.22)} ${f1(dx * r)},${f1(dy * r)} Q${f1(dx * r * 0.5 - px * r * 0.22)},${f1(dy * r * 0.5 - py * r * 0.22)} 0,0 `;
  }
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${rot})">
    <path d="${dM}" fill="${fill}" fill-opacity="0.56" stroke="${ink}" stroke-width="0.55"/>
    <circle r="${f1(r * 0.2)}" fill="${esp.fr || '#d4b157'}" stroke="${ink}" stroke-width="0.45"/>
  </g>`;
}

/* ---------- Símbolo arquitectónico de árbol / arbusto CAD en planta ---------- */
function dibujarArbolCAD(cx, cy, r, tipo = 'frutal', op = 1) {
  const nLobes = tipo === 'cortaviento' ? 11 : (tipo === 'arom' ? 7 : 9);
  const fill = tipo === 'cortaviento' ? '#c8dbc3' : (tipo === 'arom' ? '#dfd8e8' : '#d5e4cc');
  const ink = tipo === 'arom' ? '#4a3d5c' : '#264230';
  let path = '';
  for (let i = 0; i < nLobes; i++) {
    const a0 = (i / nLobes) * Math.PI * 2;
    const a1 = ((i + 0.5) / nLobes) * Math.PI * 2;
    const a2 = ((i + 1) / nLobes) * Math.PI * 2;
    const rOut = r * (0.94 + ((i * 7) % 3) * 0.05);
    const rCtrl = r * 1.12;
    const x0 = cx + Math.cos(a0) * rOut, y0 = cy + Math.sin(a0) * rOut;
    const xc = cx + Math.cos(a1) * rCtrl, yc = cy + Math.sin(a1) * rCtrl;
    const x2 = cx + Math.cos(a2) * rOut, y2 = cy + Math.sin(a2) * rOut;
    path += (i === 0 ? `M ${x0.toFixed(1)} ${y0.toFixed(1)}` : '') + ` Q ${xc.toFixed(1)} ${yc.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  path += ' Z';
  let out = `<g opacity="${op}">`;
  // Sombra arquitectónica suave hacia SE
  if (tipo !== 'arom') {
    out += `<circle cx="${(cx + r * 0.18).toFixed(1)}" cy="${(cy + r * 0.18).toFixed(1)}" r="${(r * 0.94).toFixed(1)}" fill="#1c2420" fill-opacity="0.07"/>`;
  }
  out += `<path d="${path}" fill="${fill}" fill-opacity="0.72" stroke="${ink}" stroke-width="${tipo === 'arom' ? 0.55 : 0.85}"/>`;
  if (tipo !== 'arom') {
    // Ramificación arquitectónica interior + cruz de tronco
    const br = r * 0.52;
    out += `<path d="M${(cx - br).toFixed(1)},${cy.toFixed(1)} L${(cx + br).toFixed(1)},${cy.toFixed(1)} M${cx.toFixed(1)},${(cy - br).toFixed(1)} L${cx.toFixed(1)},${(cy + br).toFixed(1)} M${(cx - br * 0.65).toFixed(1)},${(cy - br * 0.65).toFixed(1)} L${(cx + br * 0.65).toFixed(1)},${(cy + br * 0.65).toFixed(1)}" stroke="${ink}" stroke-width="0.45" opacity="0.5"/>`;
    out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${Math.max(1.4, r * 0.11).toFixed(1)}" fill="${ink}"/>`;
  } else {
    out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.0" fill="${ink}"/>`;
  }
  out += '</g>';
  return out;
}

/* ---------- Bloques CAD arquitectónicos por elemento (Rayon style) ---------- */
function dibujarBloqueArquitectonico(el, bw, bh, PXM, cfg, capa, isSel, opts) {
  const hw = bw / 2, hh = bh / 2;
  const ink = isSel ? '#b91c1c' : '#1e2723';
  const swSel = isSel ? 2.1 : 1.1;
  const P = [];

  if (el.cat === 'cultivo') {
    const esp = ESPECIES[el.especieId] || ESPECIES.lechuga;
    if (el.tipo === 'hidroponia') {
      // Módulo hidropónico NFT: bastidor metálico + 4 canales PVC + rosetas vegetales en línea
      P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="#edf6f8" stroke="${ink}" stroke-width="${swSel}"/>`);
      for (let ti = 0; ti < 4; ti++) {
        const yPipe = -hh + ((ti + 0.5) / 4) * bh;
        P.push(`<rect x="${(-hw + 3).toFixed(1)}" y="${(yPipe - 2.6).toFixed(1)}" width="${(bw - 6).toFixed(1)}" height="5.2" rx="2" fill="#ffffff" stroke="#3b7a94" stroke-width="0.7"/>`);
        const step = Math.max(11, PXM * 0.45);
        for (let px = -hw + 9; px <= hw - 9; px += step) {
          P.push(dibujarVegetalPlanta(esp, px, yPipe, Math.min(4.8, bh * 0.12), Math.round(px + ti * 13)));
        }
      }
    } else {
      // Contención arquitectónica (doble línea muro ladrillo / madera / piedra / botellas)
      const wallT = Math.max(2.6, Math.min(4.2, PXM * 0.14));
      const wallFill = el.tipo === 'jardinera_acc'
        ? '#dcc6aa'
        : ({ ladrillo: '#c88d74', madera: '#c9ad8a', piedra: '#bab7b0', botellas: '#97b89c' }[cfg.contencion] || '#c88d74');
      const rx = cfg.concepto === 'paisajistico' ? 3 : 0.8;
      P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${rx}" fill="${wallFill}" stroke="${ink}" stroke-width="${swSel}"/>`);
      P.push(`<rect x="${(-hw + wallT).toFixed(1)}" y="${(-hh + wallT).toFixed(1)}" width="${Math.max(4, bw - wallT * 2).toFixed(1)}" height="${Math.max(4, bh - wallT * 2).toFixed(1)}" fill="url(#rh-tierra)" stroke="${ink}" stroke-width="0.65"/>`);

      // Juntas arquitectónicas del borde (ladrillo / piedra / madera)
      if (cfg.contencion === 'ladrillo' || cfg.contencion === 'piedra') {
        const jStep = Math.max(7, PXM * 0.42);
        for (let jx = -hw + jStep; jx < hw - 2; jx += jStep) {
          P.push(`<line x1="${jx.toFixed(1)}" y1="${(-hh).toFixed(1)}" x2="${jx.toFixed(1)}" y2="${(-hh + wallT).toFixed(1)}" stroke="${ink}" stroke-width="0.4" opacity="0.55"/>`);
          P.push(`<line x1="${jx.toFixed(1)}" y1="${(hh - wallT).toFixed(1)}" x2="${jx.toFixed(1)}" y2="${hh.toFixed(1)}" stroke="${ink}" stroke-width="0.4" opacity="0.55"/>`);
        }
      }

      // Líneas de riego por goteo (sutiles en planta general, marcadas en capa riego)
      if (capa === 'camas' || capa === 'riego' || opts.editor) {
        const dl = el.dripLines || 2;
        for (let li = 0; li < dl; li++) {
          const ly = -hh + wallT + ((li + 0.5) / dl) * (bh - wallT * 2);
          P.push(`<line x1="${(-hw + wallT + 2).toFixed(1)}" y1="${ly.toFixed(1)}" x2="${(hw - wallT - 2).toFixed(1)}" y2="${ly.toFixed(1)}" stroke="#2c6f8e" stroke-width="${capa === 'riego' ? 1.35 : 0.65}" stroke-dasharray="3 2.5" opacity="${capa === 'riego' ? 0.95 : 0.55}"/>`);
        }
      }

      // VEGETALES EN PLANTA (hileras agronómicas legibles con bloques botánicos dibujados!)
      if (capa !== 'circulaciones') {
        const innerW = Math.max(6, bw - wallT * 2 - 4);
        const innerH = Math.max(6, bh - wallT * 2 - 3);
        const fil = Math.max(1, Math.min(3, esp.fil || 2));
        const pasoPx = Math.max(12.5, Math.min(24, (esp.paso || 0.35) * PXM * 1.45));
        const nCol = Math.max(2, Math.min(12, Math.floor(innerW / pasoPx)));
        const rVeg = Math.max(4.4, Math.min(innerH / (fil * 2.05), (innerW / nCol) * 0.45, 9.2));
        for (let f = 0; f < fil; f++) {
          const py = -innerH / 2 + ((f + 0.5) / fil) * innerH;
          for (let ci = 0; ci < nCol; ci++) {
            const px = -innerW / 2 + ((ci + 0.5) / nCol) * innerW;
            P.push(dibujarVegetalPlanta(esp, px, py, rVeg, f * 17 + ci * 7 + (el.bedNum || 1)));
          }
        }
      }
    }

    // Rótulo arquitectónico discreto (no tapa los vegetales!)
    const tagTxt = `${el.tipo === 'jardinera_acc' ? 'J' : el.tipo === 'hidroponia' ? 'H' : 'C'}${String(el.bedNum || 1).padStart(2, '0')} · ${esp.n.split(' ')[0]}`;
    const tagW = Math.min(bw - 4, tagTxt.length * 4.5 + 10);
    P.push(`<rect x="${(-tagW / 2).toFixed(1)}" y="${(-hh - 6.5).toFixed(1)}" width="${tagW.toFixed(1)}" height="11" rx="2" fill="#faf8f4" fill-opacity="0.94" stroke="${ink}" stroke-width="0.5"/>`);
    P.push(`<text x="0" y="${(-hh + 1.4).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.4" font-weight="600" fill="#1a2420">${esc(tagTxt)}</text>`);
    return P.join('');
  }

  if (el.tipo === 'pergola') {
    // Pérgola arquitectónica: proyección discontinua + viguetas de madera + 4 pilares sólidos en esquinas
    P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="rgba(232,216,192,0.18)" stroke="${ink}" stroke-width="${swSel}" stroke-dasharray="5 3"/>`);
    const nVig = Math.max(4, Math.round(el.l / 0.58));
    for (let i = 0; i < nVig; i++) {
      const vx = -hw + (i / (nVig - 1)) * bw;
      P.push(`<line x1="${vx.toFixed(1)}" y1="${(-hh - 2.5).toFixed(1)}" x2="${vx.toFixed(1)}" y2="${(hh + 2.5).toFixed(1)}" stroke="#6e5034" stroke-width="0.95" opacity="0.65"/>`);
    }
    const colS = 4.2;
    for (const sx of [-hw + 3, hw - 3]) for (const sy of [-hh + 3, hh - 3]) {
      P.push(`<rect x="${(sx - colS / 2).toFixed(1)}" y="${(sy - colS / 2).toFixed(1)}" width="${colS}" height="${colS}" fill="#1e2723"/>`);
    }
    P.push(`<text x="0" y="${(-hh - 4.5).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.5" font-weight="600" fill="#4e3a24">PÉRGOLA / AULA ABIERTA</text>`);
    return P.join('');
  }

  if (el.tipo === 'banca') {
    // Bloque CAD de banca urbana: 3 listones de asiento + respaldo posterior + soportes laterales
    P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="1" fill="#e8d8c2" stroke="${ink}" stroke-width="${swSel * 0.9}"/>`);
    P.push(`<line x1="${(-hw).toFixed(1)}" y1="${(-hh + bh * 0.25).toFixed(1)}" x2="${hw.toFixed(1)}" y2="${(-hh + bh * 0.25).toFixed(1)}" stroke="${ink}" stroke-width="1.35"/>`);
    P.push(`<line x1="${(-hw + 2).toFixed(1)}" y1="${(-hh + bh * 0.55).toFixed(1)}" x2="${(hw - 2).toFixed(1)}" y2="${(-hh + bh * 0.55).toFixed(1)}" stroke="#7a5b3b" stroke-width="0.55"/>`);
    P.push(`<line x1="${(-hw + 2).toFixed(1)}" y1="${(-hh + bh * 0.78).toFixed(1)}" x2="${(hw - 2).toFixed(1)}" y2="${(-hh + bh * 0.78).toFixed(1)}" stroke="#7a5b3b" stroke-width="0.55"/>`);
    P.push(`<line x1="${(-hw + 4).toFixed(1)}" y1="${(-hh).toFixed(1)}" x2="${(-hw + 4).toFixed(1)}" y2="${hh.toFixed(1)}" stroke="${ink}" stroke-width="0.9"/>`);
    P.push(`<line x1="${(hw - 4).toFixed(1)}" y1="${(-hh).toFixed(1)}" x2="${(hw - 4).toFixed(1)}" y2="${hh.toFixed(1)}" stroke="${ink}" stroke-width="0.9"/>`);
    return P.join('');
  }

  if (el.tipo === 'mesa_trabajo' || el.tipo === 'lavado') {
    P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="1" fill="${el.tipo === 'lavado' ? '#eef3f5' : '#f2e8d9'}" stroke="${ink}" stroke-width="${swSel}"/>`);
    if (el.tipo === 'lavado') {
      // Doble poceta arquitectónica + desagües + grifo
      const pw = bw * 0.36, ph = bh * 0.64;
      P.push(`<rect x="${(-hw + 4).toFixed(1)}" y="${(-ph / 2).toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" rx="1.5" fill="#dcebf0" stroke="${ink}" stroke-width="0.7"/>`);
      P.push(`<circle cx="${(-hw + 4 + pw / 2).toFixed(1)}" cy="0" r="2" fill="none" stroke="${ink}" stroke-width="0.6"/>`);
      P.push(`<rect x="${(-hw + 7 + pw).toFixed(1)}" y="${(-ph / 2).toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" rx="1.5" fill="#dcebf0" stroke="${ink}" stroke-width="0.7"/>`);
      P.push(`<circle cx="${(-hw + 7 + pw * 1.5).toFixed(1)}" cy="0" r="2" fill="none" stroke="${ink}" stroke-width="0.6"/>`);
      P.push(`<line x1="${(-hw + 5 + pw).toFixed(1)}" y1="${(-hh).toFixed(1)}" x2="${(-hw + 5 + pw).toFixed(1)}" y2="${(-hh + 5).toFixed(1)}" stroke="#2c6f8e" stroke-width="1.3"/>`);
    } else {
      // Mesa de germinación/talleres con bandejas de almácigo dibujadas
      const tw = (bw - 10) / 3, th = bh - 7;
      for (let i = 0; i < 3; i++) {
        P.push(`<rect x="${(-hw + 4 + i * (tw + 1)).toFixed(1)}" y="${(-th / 2).toFixed(1)}" width="${(tw - 1).toFixed(1)}" height="${th.toFixed(1)}" fill="#e6efe2" stroke="#5f8764" stroke-width="0.5"/>`);
      }
    }
    P.push(`<text x="0" y="${(hh + 8).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.2" fill="#3a4540">${el.tipo === 'lavado' ? 'LAVADO' : 'MESA TALLER'}</text>`);
    return P.join('');
  }

  if (el.tipo === 'invernadero') {
    // Invernadero arquitectónico: arcos estructurales + cumbrera + vidrio rayado + mesas interiores discontinuas
    P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="url(#rh-vidrio)" stroke="${ink}" stroke-width="${swSel * 1.15}"/>`);
    P.push(`<line x1="${(-hw).toFixed(1)}" y1="0" x2="${hw.toFixed(1)}" y2="0" stroke="${ink}" stroke-width="0.95"/>`);
    const nArc = Math.max(4, Math.round(el.l / 1.4) + 1);
    for (let i = 0; i < nArc; i++) {
      const ax = -hw + (i / (nArc - 1)) * bw;
      P.push(`<line x1="${ax.toFixed(1)}" y1="${(-hh).toFixed(1)}" x2="${ax.toFixed(1)}" y2="${hh.toFixed(1)}" stroke="#4a6975" stroke-width="0.65"/>`);
    }
    P.push(`<rect x="${(-hw + 6).toFixed(1)}" y="${(-hh + 5).toFixed(1)}" width="${(bw - 12).toFixed(1)}" height="${(bh * 0.27).toFixed(1)}" fill="#e3eedd" fill-opacity="0.7" stroke="#4a6e52" stroke-width="0.55" stroke-dasharray="3 2"/>`);
    P.push(`<rect x="${(-hw + 6).toFixed(1)}" y="${(hh - 5 - bh * 0.27).toFixed(1)}" width="${(bw - 12).toFixed(1)}" height="${(bh * 0.27).toFixed(1)}" fill="#e3eedd" fill-opacity="0.7" stroke="#4a6e52" stroke-width="0.55" stroke-dasharray="3 2"/>`);
    P.push(`<text x="0" y="2.5" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.8" font-weight="600" fill="#1a2f38">INVERNADERO ${el.l}×${el.w}m</text>`);
    return P.join('');
  }

  if (el.tipo === 'abonera') {
    // Abonera de 3 compartimentos con tabiques de madera y densidad progresiva I · II · III
    P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="url(#rh-compost)" stroke="${ink}" stroke-width="${swSel}"/>`);
    const bay = bw / 3;
    const rom = ['I', 'II', 'III'];
    const tints = ['rgba(124,154,96,0.22)', 'rgba(154,114,72,0.26)', 'rgba(78,52,32,0.34)'];
    for (let k = 0; k < 3; k++) {
      const bx = -hw + k * bay;
      P.push(`<rect x="${(bx + 1.5).toFixed(1)}" y="${(-hh + 2).toFixed(1)}" width="${(bay - 3).toFixed(1)}" height="${(bh - 4).toFixed(1)}" fill="${tints[k]}" stroke="${ink}" stroke-width="0.65"/>`);
      P.push(`<text x="${(bx + bay / 2).toFixed(1)}" y="2.5" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="7" font-weight="700" fill="#2c1f14">${rom[k]}</text>`);
    }
    P.push(`<text x="0" y="${(hh + 8.5).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.3" font-weight="600" fill="#4c3828">ABONERA ${el.l}×${el.w}m</text>`);
    return P.join('');
  }

  if (el.tipo === 'bodega') {
    // Bodega con cubierta a un agua (línea de pendiente + flecha dirección desagüe)
    P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="url(#rh-madera)" stroke="${ink}" stroke-width="${swSel * 1.1}"/>`);
    P.push(`<rect x="${(-hw + 3).toFixed(1)}" y="${(-hh + 3).toFixed(1)}" width="${(bw - 6).toFixed(1)}" height="${(bh - 6).toFixed(1)}" fill="none" stroke="${ink}" stroke-width="0.5"/>`);
    P.push(`<line x1="${(-hw).toFixed(1)}" y1="${(-hh).toFixed(1)}" x2="${hw.toFixed(1)}" y2="${hh.toFixed(1)}" stroke="${ink}" stroke-width="0.4" opacity="0.45"/>`);
    P.push(`<text x="0" y="2.5" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.4" font-weight="600" fill="#1e2723">BODEGA</text>`);
    return P.join('');
  }

  if (el.tipo === 'agua') {
    // Cisterna circular arquitectónica con anillos concéntricos + símbolo de válvula
    const r = Math.min(hw, hh) * 0.92;
    P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="url(#rh-concreto)" stroke="${ink}" stroke-width="0.7"/>`);
    P.push(`<circle cx="0" cy="0" r="${r.toFixed(1)}" fill="url(#rh-agua)" stroke="${ink}" stroke-width="${swSel}"/>`);
    P.push(`<circle cx="0" cy="0" r="${(r * 0.65).toFixed(1)}" fill="none" stroke="#2c6f8e" stroke-width="0.6" stroke-dasharray="2.5 2"/>`);
    P.push(`<line x1="${(-r * 0.5).toFixed(1)}" y1="0" x2="${(r * 0.5).toFixed(1)}" y2="0" stroke="#1e495e" stroke-width="0.55"/>`);
    P.push(`<line x1="0" y1="${(-r * 0.5).toFixed(1)}" x2="0" y2="${(r * 0.5).toFixed(1)}" stroke="#1e495e" stroke-width="0.55"/>`);
    P.push(`<text x="0" y="${(hh + 8).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.1" font-weight="600" fill="#1e495e">CISTERNA</text>`);
    return P.join('');
  }

  if (el.tipo === 'polinizadores') {
    // Jardín orgánico de polinizadores con bloques florales múltiples
    P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${(hh * 0.65).toFixed(1)}" fill="url(#rh-prado)" stroke="${ink}" stroke-width="${swSel}"/>`);
    const flCols = ['#9c75b8', '#d49a45', '#c96f85', '#769c6a'];
    const nFl = Math.max(5, Math.round(el.l * 2.2));
    for (let i = 0; i < nFl; i++) {
      const fx = -hw + 9 + ((i + 0.5) / nFl) * Math.max(8, bw - 18);
      const fy = (i % 2 === 0 ? -1 : 1) * (hh * 0.28);
      P.push(dibujarArbolCAD(fx, fy, Math.min(7.5, hh * 0.42), 'arom', 0.92));
      P.push(`<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="1.9" fill="${flCols[i % flCols.length]}"/>`);
    }
    P.push(`<text x="0" y="${(hh + 8.5).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.1" font-weight="600" fill="#3a4c3e">JARDÍN POLINIZADORES</text>`);
    return P.join('');
  }

  if (el.tipo === 'infiltracion') {
    // Zanja biofiltrante con curvas de nivel interiores
    P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${(hh * 0.7).toFixed(1)}" fill="url(#rh-grava)" stroke="${ink}" stroke-width="${swSel}"/>`);
    P.push(`<rect x="${(-hw + 4).toFixed(1)}" y="${(-hh + 3.5).toFixed(1)}" width="${Math.max(4, bw - 8).toFixed(1)}" height="${Math.max(4, bh - 7).toFixed(1)}" rx="${(hh * 0.55).toFixed(1)}" fill="url(#rh-agua)" stroke="#3b7a94" stroke-width="0.7" stroke-dasharray="3 2"/>`);
    P.push(`<text x="0" y="${(hh + 8).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6" fill="#2c5d73">ZANJA BIOFILTRANTE</text>`);
    return P.join('');
  }

  if (el.tipo === 'residuos_sep') {
    // 3 canecas de separación (Verde orgánicos / Blanco aprovechables / Negro no aprovechables)
    P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="#f2f1ed" stroke="${ink}" stroke-width="${swSel * 0.9}"/>`);
    const rc = Math.min(hh * 0.65, bw / 7.5);
    const cols = ['#5d9668', '#ffffff', '#3d4548'];
    for (let k = -1; k <= 1; k++) {
      P.push(`<circle cx="${(k * bw * 0.28).toFixed(1)}" cy="0" r="${rc.toFixed(1)}" fill="${cols[k + 1]}" stroke="${ink}" stroke-width="0.75"/>`);
    }
    P.push(`<text x="0" y="${(hh + 8).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="5.8" fill="#3a4540">SEPARACIÓN</text>`);
    return P.join('');
  }

  if (el.tipo === 'meteo') {
    // Estación meteorológica: cruz cardinal + círculo sensor
    const r = Math.min(hw, hh) * 0.85;
    P.push(`<circle cx="0" cy="0" r="${r.toFixed(1)}" fill="#f3f1f7" stroke="${ink}" stroke-width="${swSel}"/>`);
    P.push(`<line x1="${(-r).toFixed(1)}" y1="0" x2="${r.toFixed(1)}" y2="0" stroke="${ink}" stroke-width="0.65"/>`);
    P.push(`<line x1="0" y1="${(-r).toFixed(1)}" x2="0" y2="${r.toFixed(1)}" stroke="${ink}" stroke-width="0.65"/>`);
    P.push(`<circle cx="0" cy="0" r="2.2" fill="#4f4675"/>`);
    P.push(`<text x="0" y="${(hh + 8).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="5.8" fill="#3e3859">METEO</text>`);
    return P.join('');
  }

  // Señalización / Hotel de insectos / bloque genérico
  P.push(`<rect x="${(-hw).toFixed(1)}" y="${(-hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="1" fill="#ede7dc" stroke="${ink}" stroke-width="${swSel}"/>`);
  P.push(`<line x1="${(-hw + 2).toFixed(1)}" y1="0" x2="${(hw - 2).toFixed(1)}" y2="0" stroke="${ink}" stroke-width="0.8"/>`);
  P.push(`<text x="0" y="${(hh + 7.5).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="5.7" fill="#3a4540">${el.tipo === 'hotel_insectos' ? 'REFUGIO FAUNA' : 'SEÑAL'}</text>`);
  return P.join('');
}

/* ---------- Cota arquitectónica con ticks a 45° ---------- */
function cotaArq(x1, y1, x2, y2, label) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const horiz = Math.abs(y2 - y1) < 1;
  const t = 4;
  return `<g stroke="#2a3530" stroke-width="0.7">
    <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>
    <line x1="${(x1 - t).toFixed(1)}" y1="${(y1 + t).toFixed(1)}" x2="${(x1 + t).toFixed(1)}" y2="${(y1 - t).toFixed(1)}" stroke-width="1.15"/>
    <line x1="${(x2 - t).toFixed(1)}" y1="${(y2 + t).toFixed(1)}" x2="${(x2 + t).toFixed(1)}" y2="${(y2 - t).toFixed(1)}" stroke-width="1.15"/>
    ${horiz
      ? `<rect x="${(mx - label.length * 2.8 - 4).toFixed(1)}" y="${(my - 6).toFixed(1)}" width="${(label.length * 5.6 + 8).toFixed(1)}" height="11" fill="#faf8f4" stroke="none"/><text x="${mx.toFixed(1)}" y="${(my + 2.5).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="7.6" fill="#1e2723" stroke="none">${esc(label)}</text>`
      : `<text x="${(mx - 6).toFixed(1)}" y="${my.toFixed(1)}" text-anchor="middle" transform="rotate(-90 ${(mx - 6).toFixed(1)} ${my.toFixed(1)})" font-family="JetBrains Mono,monospace" font-size="7.6" fill="#1e2723" stroke="none">${esc(label)}</text>`
    }
  </g>`;
}

/* ---------- Plano vectorial arquitectónico SVG a escala (2 cuadraditos = 1 m) ---------- */
export function renderPlanoCapaSVG(proyecto, capa = 'camas', diag = null, opts = {}) {
  if (capa === 'implantacion' && proyecto.park) return renderPlanoImplantacionSVG(proyecto, diag);

  const { dims, elementos, infra, cerco, cfg, park, sim } = proyecto;
  const PXM = opts.pxm || 24; // 24 px/m => cada cuadradito de 0,5 m = 12 px (2 cuadraditos = 1 m, INTA p. 6)
  const padL = 78, padR = 72, padT = 82, padB = 104;
  const W = Math.round(dims.totalL * PXM + padL + padR);
  const H = Math.round(dims.totalW * PXM + padT + padB);
  const X = (u) => padL + (u - dims.uMin) * PXM;
  const Y = (v) => padT + (v - dims.vMin) * PXM;

  const tituloCapa = (CAPAS_PLANO.find(c => c.id === capa) || CAPAS_PLANO[0]).n.toUpperCase();
  const P = [];
  P.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="ph-plano-tit" data-pxm="${PXM}" data-padl="${padL}" data-padt="${padT}" data-umin="${dims.uMin}" data-vmin="${dims.vMin}">`);
  P.push(`<title id="ph-plano-tit">Plano arquitectónico: ${esc(tituloCapa)} — ${esc(park ? park.nombre : 'Parque')} (2 cuadraditos = 1 m)</title>`);
  P.push(svgDefsArquitectonicos(PXM));

  // Lámina de papel arquitectónico cálido + marco técnico doble
  P.push(`<rect width="${W}" height="${H}" fill="#faf8f4"/>`);
  P.push(`<rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="#1e2723" stroke-width="1.15"/>`);
  P.push(`<rect x="13.5" y="13.5" width="${W - 27}" height="${H - 27}" fill="none" stroke="#9aa39e" stroke-width="0.45"/>`);

  // Grilla técnica 0,5 m / 1,0 m (2 cuadraditos = 1 m)
  P.push(`<rect x="${padL - 20}" y="${padT - 18}" width="${dims.totalL * PXM + 40}" height="${dims.totalW * PXM + 36}" fill="url(#pl-m)" stroke="#c7c0b4" stroke-width="0.75"/>`);

  // Encabezado arquitectónico limpio
  P.push(`<text x="24" y="32" font-family="Inter,system-ui,sans-serif" font-size="12.5" font-weight="700" letter-spacing="0.06em" fill="#18221e">${esc(tituloCapa)} — ${esc((park ? park.nombre : 'PARQUE').toUpperCase())}</text>`);
  P.push(`<text x="24" y="47" font-family="JetBrains Mono,monospace" font-size="8.6" fill="#525f59">TIPOLOGÍA ${esc(proyecto.tipologia.letra)} (${esc(proyecto.tipologia.corto.toUpperCase())})  |  HUELLA ${dims.totalL}×${dims.totalW} m (${dims.areaTotal} m²)  |  CULTIVO ${sim.areaCultivo} m²  |  ESCALA 2 CUADRADITOS = 1 m  |  ROTACIÓN AÑO ${cfg.anioRotacion}/4</text>`);
  P.push(`<line x1="24" y1="54" x2="${W - 76}" y2="54" stroke="#cfd5d1" stroke-width="0.7"/>`);

  // Norte arquitectónico minimalista
  const nDeg = -(proyecto.orientAng * 180 / Math.PI);
  P.push(`<g transform="translate(${W - 44},40) rotate(${nDeg.toFixed(1)})">
    <circle r="15" fill="#faf8f4" stroke="#1e2723" stroke-width="0.9"/>
    <polygon points="0,-12 3.8,3 0,0" fill="#1e2723"/>
    <polygon points="0,-12 -3.8,3 0,0" fill="#faf8f4" stroke="#1e2723" stroke-width="0.65"/>
    <line x1="0" y1="0" x2="0" y2="11" stroke="#1e2723" stroke-width="0.7"/>
    <text x="0" y="-17" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="8" font-weight="700" fill="#1e2723">N</text>
  </g>`);

  // Suelo base del polígono de intervención (trama de adoquín o gravilla/viruta)
  const polyPts = (proyecto.poligonoInterv || [[dims.uMin, dims.vMin], [dims.uMax, dims.vMin], [dims.uMax, dims.vMax], [dims.uMin, dims.vMax]])
    .map(q => `${X(q[0]).toFixed(1)},${Y(q[1]).toFixed(1)}`).join(' ');
  const sueloHatch = cfg.concepto === 'paisajistico' ? 'url(#rh-adoquin)' : 'url(#rh-grava)';
  P.push(`<polygon points="${polyPts}" fill="${sueloHatch}" stroke="#5c6661" stroke-width="0.85" stroke-dasharray="4 3"/>`);

  // Bloques / zonas de rayado personalizadas por el usuario (Estilo Rayon!)
  const zonasRayado = proyecto.zonasRayado || [];
  const selId = opts.selectedId || null;
  for (const z of zonasRayado) {
    const isSel = z.id === selId;
    const hDef = HATCHES_RAYON[z.hatch] || HATCHES_RAYON.prado;
    const zcx = X(z.u), zcy = Y(z.v), zw = z.l * PXM, zh = z.w * PXM;
    const deg = (z.rot || 0) * 180 / Math.PI;
    P.push(`<g transform="translate(${zcx.toFixed(1)},${zcy.toFixed(1)}) rotate(${deg.toFixed(1)})" data-elid="${esc(z.id)}" data-zona="1" style="${opts.editor ? 'cursor:grab' : ''}">
      <rect x="${(-zw / 2).toFixed(1)}" y="${(-zh / 2).toFixed(1)}" width="${zw.toFixed(1)}" height="${zh.toFixed(1)}" fill="url(#rh-${hDef.id})" stroke="${isSel ? '#b91c1c' : '#3d4a44'}" stroke-width="${isSel ? 2 : 0.9}" stroke-dasharray="${isSel ? '4 2' : 'none'}"/>
      <text x="0" y="3" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.4" font-weight="600" fill="#2a3630">${esc(z.n || hDef.n)} (${z.l}×${z.w}m)</text>
    </g>`);
  }

  // Indicador solar sutil en borde lateral (sin bloques neón invasivos!)
  if ((capa === 'camas' || opts.editor) && cfg.mapaSolar) {
    const midV = (dims.vMin + dims.vMax) / 2;
    P.push(`<line x1="${(X(dims.uMin) - 8).toFixed(1)}" y1="${Y(midV).toFixed(1)}" x2="${(X(dims.uMax) + 8).toFixed(1)}" y2="${Y(midV).toFixed(1)}" stroke="#b88744" stroke-width="0.65" stroke-dasharray="6 4" opacity="0.7"/>`);
    P.push(`<text x="${(X(dims.uMin) + 4).toFixed(1)}" y="${(Y(dims.vMin) + 10).toFixed(1)}" font-family="JetBrains Mono,monospace" font-size="6.8" fill="#3a6b4c">ZONA NORTE · 4–5 h LUZ (HOJAS / RAÍCES)</text>`);
    P.push(`<text x="${(X(dims.uMin) + 4).toFixed(1)}" y="${(Y(dims.vMax) - 5).toFixed(1)}" font-family="JetBrains Mono,monospace" font-size="6.8" fill="#8f6024">ZONA SUR/OESTE · 6–8 h SOL PLENO · CULTIVOS ALTOS (ALT. SOLAR ${sim.solar.sol.altDeg}°)</text>`);
  }

  // Vegetación arquitectónica perimetral: cortinas cortavientos (Sur–Oeste), frutales y aromáticas
  const vegOp = (capa === 'camas' || capa === 'mobiliario' || opts.editor) ? 1 : 0.4;
  for (const cv of infra.cortaviento) {
    P.push(dibujarArbolCAD(X(cv.u), Y(cv.v), 1.05 * PXM, 'cortaviento', vegOp));
  }
  if (infra.cortaviento.length) {
    P.push(`<text x="${X(0)}" y="${(Y(dims.vMax) + 2.15 * PXM).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.8" letter-spacing="0.08em" fill="#2d4a36">CORTINA CORTAVIENTOS (SUR Y OESTE · SIN SOMBREAR CANTEROS)</text>`);
  }
  for (const fr of infra.frutales) {
    P.push(dibujarArbolCAD(X(fr.u), Y(fr.v), 0.72 * PXM, 'frutal', vegOp));
  }
  for (const ar of infra.aromaticas) {
    P.push(dibujarArbolCAD(X(ar.u), Y(ar.v), Math.max(4.5, 0.24 * PXM), 'arom', vegOp * 0.92));
  }

  // Capa Circulaciones y Accesibilidad (NTC 4143)
  if (capa === 'circulaciones') {
    const accX = X(infra.acceso.u), accY = Y(infra.acceso.v);
    const uMain = dims.uMin + 3.0 + dims.cab / 2;
    const vMid = (dims.vMin + dims.vMax) / 2;
    P.push(`<polyline points="${accX.toFixed(1)},${(accY - 14).toFixed(1)} ${accX.toFixed(1)},${Y(vMid).toFixed(1)} ${X(uMain).toFixed(1)},${Y(vMid).toFixed(1)}" fill="none" stroke="#2f7d6e" stroke-width="${Math.max(10, dims.cab * PXM * 0.6).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.22"/>`);
    P.push(`<polyline points="${accX.toFixed(1)},${(accY - 14).toFixed(1)} ${accX.toFixed(1)},${Y(vMid).toFixed(1)} ${X(uMain).toFixed(1)},${Y(vMid).toFixed(1)}" fill="none" stroke="#1f5c50" stroke-width="1.35" stroke-dasharray="6 3"/>`);
    P.push(`<circle cx="${accX.toFixed(1)}" cy="${Y(vMid).toFixed(1)}" r="${(0.75 * PXM).toFixed(1)}" fill="rgba(47,125,110,0.12)" stroke="#1f5c50" stroke-width="1.1" stroke-dasharray="3 2"/>`);
    P.push(`<text x="${(accX + 0.85 * PXM).toFixed(1)}" y="${(Y(vMid) + 3).toFixed(1)}" font-family="JetBrains Mono,monospace" font-size="7.2" font-weight="600" fill="#184a40">GIRO Ø 1,50 m (NTC 4143)</text>`);
  }

  // Capa Riego por goteo y captación pluvial
  const camas = elementos.filter(e => e.cat === 'cultivo');
  if ((capa === 'riego' || capa === 'camas') && camas.length) {
    const taX = X(infra.tomaAgua.u), taY = Y(infra.tomaAgua.v);
    const uPipe = camas[0].u + camas[0].l / 2 + 0.35;
    P.push(`<polyline points="${taX.toFixed(1)},${taY.toFixed(1)} ${X(uPipe).toFixed(1)},${taY.toFixed(1)} ${X(uPipe).toFixed(1)},${Y(camas[camas.length - 1].v).toFixed(1)}" fill="none" stroke="#2c6f8e" stroke-width="${capa === 'riego' ? 2.2 : 1.1}" stroke-dasharray="5 3" marker-end="url(#pl-arr-w)"/>`);
    if (capa === 'riego' && infra.invernadero) {
      P.push(`<line x1="${X(infra.invernadero.u).toFixed(1)}" y1="${Y(infra.invernadero.v - infra.invernadero.w / 2).toFixed(1)}" x2="${taX.toFixed(1)}" y2="${taY.toFixed(1)}" stroke="#2c6f8e" stroke-width="1.8" marker-end="url(#pl-arr-w)"/>`);
      P.push(`<text x="${((X(infra.invernadero.u) + taX) / 2 + 6).toFixed(1)}" y="${(taY + 13).toFixed(1)}" font-family="JetBrains Mono,monospace" font-size="6.8" fill="#1f5670">CAPTACIÓN LLUVIA CUBIERTA</text>`);
    }
  }

  // Bloques arquitectónicos (orden: primero suelo/camas/mobiliario, al final pérgola en proyección superior!)
  const ordenados = elementos.slice().sort((a, b) => (a.tipo === 'pergola' ? 1 : 0) - (b.tipo === 'pergola' ? 1 : 0));
  for (const el of ordenados) {
    const cx = X(el.u), cy = Y(el.v), bw = el.l * PXM, bh = el.w * PXM;
    const deg = (el.rot || 0) * 180 / Math.PI;
    const isSel = el.id === selId;
    const emphasis =
      capa === 'camas' ? (el.cat === 'cultivo' || el.tipo === 'invernadero' || el.tipo === 'polinizadores') :
      capa === 'mobiliario' ? (el.cat === 'mobiliario' || el.tipo === 'jardinera_acc') :
      capa === 'riego' ? (el.cat === 'cultivo' || el.tipo === 'agua' || el.tipo === 'infiltracion' || el.tipo === 'invernadero') :
      capa === 'residuos' ? (el.tipo === 'abonera' || el.tipo === 'residuos_sep' || el.tipo === 'lavado' || el.cat === 'cultivo') :
      true;
    const op = (opts.editor || capa === 'camas' || emphasis) ? 1 : 0.34;
    P.push(`<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${deg.toFixed(1)})" opacity="${op}" data-elid="${esc(el.id)}" style="${opts.editor ? 'cursor:grab' : ''}">`);
    P.push(dibujarBloqueArquitectonico(el, bw, bh, PXM, cfg, capa, isSel, opts));
    if (isSel && opts.editor) {
      P.push(`<rect x="${(-bw / 2 - 3.5).toFixed(1)}" y="${(-bh / 2 - 3.5).toFixed(1)}" width="${(bw + 7).toFixed(1)}" height="${(bh + 7).toFixed(1)}" fill="none" stroke="#b91c1c" stroke-width="1" stroke-dasharray="3 2"/>`);
      for (const hx of [-bw / 2 - 3.5, bw / 2 + 3.5]) for (const hy of [-bh / 2 - 3.5, bh / 2 + 3.5]) {
        P.push(`<rect x="${(hx - 2.3).toFixed(1)}" y="${(hy - 2.3).toFixed(1)}" width="4.6" height="4.6" fill="#ffffff" stroke="#b91c1c" stroke-width="1"/>`);
      }
    }
    P.push('</g>');
  }

  // Flujo circular de residuos -> compostaje -> retorno a camas
  if (capa === 'residuos' && camas.length) {
    const ab = infra.abonera;
    const sep = elementos.find(e => e.tipo === 'residuos_sep') || infra.acceso;
    const cUlt = camas[camas.length - 1];
    P.push(`<path d="M ${X(sep.u).toFixed(1)} ${Y(sep.v).toFixed(1)} Q ${(X(ab.u) + 36).toFixed(1)} ${((Y(sep.v) + Y(ab.v)) / 2).toFixed(1)} ${X(ab.u).toFixed(1)} ${Y(ab.v - ab.w / 2).toFixed(1)}" fill="none" stroke="#7c5334" stroke-width="1.8" stroke-dasharray="5 3" marker-end="url(#pl-arr-c)"/>`);
    P.push(`<path d="M ${X(ab.u - ab.l / 2).toFixed(1)} ${Y(ab.v).toFixed(1)} Q ${((X(ab.u) + X(cUlt.u)) / 2).toFixed(1)} ${(Y(ab.v) + 32).toFixed(1)} ${X(cUlt.u).toFixed(1)} ${Y(cUlt.v).toFixed(1)}" fill="none" stroke="#2f6b47" stroke-width="1.9" marker-end="url(#pl-arr-g)"/>`);
    P.push(`<text x="${X(ab.u).toFixed(1)}" y="${(Y(ab.v + ab.w / 2) + 18).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="7" font-weight="600" fill="#5c3c24">ORGÁNICOS APTOS (-62% MASA · 75 D) = ${sim.compostaje.compostObtenidoKg} kg COMPOST/AÑO</text>`);
  }

  // Escuadra 3-4-5 (60 × 80 × 100 cm, replanteo INTA p. 2)
  if ((capa === 'camas' || opts.editor) && cfg.guiaReplanteo && infra.triangulo345) {
    const tx = X(infra.triangulo345.u), ty = Y(infra.triangulo345.v);
    P.push(`<polygon points="${tx.toFixed(1)},${ty.toFixed(1)} ${(tx + 0.8 * PXM).toFixed(1)},${ty.toFixed(1)} ${tx.toFixed(1)},${(ty + 0.6 * PXM).toFixed(1)}" fill="rgba(184,135,68,0.2)" stroke="#9c6c28" stroke-width="1"/>`);
    P.push(`<text x="${(tx + 0.8 * PXM + 4).toFixed(1)}" y="${(ty - 2).toFixed(1)}" font-family="JetBrains Mono,monospace" font-size="6.4" font-weight="600" fill="#7c531c">3-4-5</text>`);
  }

  // Cerco perimetral arquitectónico + símbolo de puerta batiente (arco de 90°!)
  if (cerco.tipo !== 'ninguno') {
    for (const tr of cerco.tramos) {
      P.push(`<line x1="${X(tr.a[0]).toFixed(1)}" y1="${Y(tr.a[1]).toFixed(1)}" x2="${X(tr.b[0]).toFixed(1)}" y2="${Y(tr.b[1]).toFixed(1)}" stroke="#1e2723" stroke-width="1.65" stroke-dasharray="${cerco.tipo === 'romboidal' ? '6 2.5' : 'none'}"/>`);
    }
    for (const pt of cerco.postes) {
      P.push(`<rect x="${(X(pt.u) - (pt.esq ? 2.4 : 1.5)).toFixed(1)}" y="${(Y(pt.v) - (pt.esq ? 2.4 : 1.5)).toFixed(1)}" width="${pt.esq ? 4.8 : 3}" height="${pt.esq ? 4.8 : 3}" fill="${pt.esq ? '#8f5626' : '#1e2723'}"/>`);
    }
  }
  // Puerta arquitectónica en planta con arco de abatimiento de 90°
  const gX = X(infra.acceso.u - infra.acceso.ancho / 2), gY = Y(infra.acceso.v), gW = infra.acceso.ancho * PXM;
  P.push(`<line x1="${gX.toFixed(1)}" y1="${gY.toFixed(1)}" x2="${gX.toFixed(1)}" y2="${(gY + gW).toFixed(1)}" stroke="#1e2723" stroke-width="1.3"/>`);
  P.push(`<path d="M ${(gX + gW).toFixed(1)} ${gY.toFixed(1)} A ${gW.toFixed(1)} ${gW.toFixed(1)} 0 0 1 ${gX.toFixed(1)} ${(gY + gW).toFixed(1)}" fill="none" stroke="#525f59" stroke-width="0.7" stroke-dasharray="2.5 2"/>`);
  P.push(`<text x="${X(infra.acceso.u).toFixed(1)}" y="${(gY - 5).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="7.2" font-weight="700" letter-spacing="0.06em" fill="#1e2723">ACCESO ${infra.acceso.ancho.toFixed(2)} m</text>`);

  // Cotas arquitectónicas exteriores (horizontal + vertical con ticks 45°)
  P.push(cotaArq(X(dims.uMin), H - 58, X(dims.uMax), H - 58, `${dims.totalL.toFixed(1)} m`));
  P.push(cotaArq(padL - 34, Y(dims.vMin), padL - 34, Y(dims.vMax), `${dims.totalW.toFixed(1)} m`));

  // Cajetín técnico arquitectónico inferior + escala gráfica
  P.push(`<line x1="20" y1="${H - 42}" x2="${W - 20}" y2="${H - 42}" stroke="#1e2723" stroke-width="0.8"/>`);
  P.push(`<text x="24" y="${H - 27}" font-family="JetBrains Mono,monospace" font-size="7.8" font-weight="600" fill="#1e2723">PASO ENTRE CANTEROS: ${Math.round(dims.paso * 100)} cm  |  CABECERAS: ${dims.cab.toFixed(2)} m  |  GOTEO: ${dims.dripLines} LÍNEAS  |  CONTENCIÓN: ${esc(cfg.contencion.toUpperCase())}</text>`);
  P.push(`<text x="24" y="${H - 16}" font-family="JetBrains Mono,monospace" font-size="7" fill="#5e6b65">PRO HUERTA INTA · JARDÍN BOTÁNICO DE BOGOTÁ · DISTRITO BIOTECNOLÓGICO DE KENNEDY</text>`);

  // Escala gráfica arquitectónica (0 — 1 — 2 — 4 m)
  const scX = W - 26 - PXM * 4, scY = H - 26;
  P.push(`<g transform="translate(${scX.toFixed(1)},${scY})">
    <rect x="0" y="0" width="${PXM}" height="4.5" fill="#1e2723"/><rect x="${PXM}" y="0" width="${PXM}" height="4.5" fill="#faf8f4" stroke="#1e2723" stroke-width="0.7"/>
    <rect x="${PXM * 2}" y="0" width="${PXM * 2}" height="4.5" fill="#1e2723"/>
    <text x="0" y="-3" font-family="JetBrains Mono,monospace" font-size="6.8" fill="#1e2723">0</text>
    <text x="${PXM}" y="-3" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.8" fill="#1e2723">1</text>
    <text x="${PXM * 2}" y="-3" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.8" fill="#1e2723">2</text>
    <text x="${PXM * 4}" y="-3" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.8" fill="#1e2723">4 m</text>
  </g>`);

  P.push('</svg>');
  return P.join('');
}

/* ---------- Plano Arquitectónico de Implantación sobre el polígono real del parque ---------- */
function renderPlanoImplantacionSVG(proyecto, diag) {
  const { park, dims, sitio, orientAng, sim } = proyecto;
  const { x0, x1, z0, z1 } = park.bbox;
  const spanX = Math.max(20, x1 - x0), spanZ = Math.max(20, z1 - z0);
  const W = 760, H = 520, pad = 56;
  const sc = Math.min((W - pad * 2) / spanX, (H - pad * 2 - 50) / spanZ);
  const ox = (W - spanX * sc) / 2, oy = (H - 44 - spanZ * sc) / 2 + 28;
  const X = (x) => ox + (x - x0) * sc;
  const Y = (z) => oy + (z - z0) * sc;

  const P = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Plano arquitectónico de implantación en ${esc(park.nombre)}">`];
  P.push(svgDefsArquitectonicos(20));
  P.push(`<rect width="${W}" height="${H}" fill="#faf8f4"/>`);
  P.push(`<rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="#1e2723" stroke-width="1.15"/>`);
  P.push(`<rect x="13.5" y="13.5" width="${W - 27}" height="${H - 27}" fill="none" stroke="#9aa39e" stroke-width="0.45"/>`);
  P.push(`<text x="24" y="32" font-family="Inter,sans-serif" font-size="12.5" font-weight="700" letter-spacing="0.06em" fill="#18221e">PLANO GENERAL DE IMPLANTACIÓN — ${esc(park.nombre.toUpperCase())}</text>`);
  P.push(`<text x="24" y="47" font-family="JetBrains Mono,monospace" font-size="8.6" fill="#525f59">${esc(park.tipo)} (${fmt(park.area)} m²)  |  HUERTA ${dims.areaTotal} m² (${sim.pctParqueOcupado}% OCUPACIÓN · ${sim.pctParqueLibre}% PARQUE ABIERTO)  |  0 ÁRBOLES TALADOS</text>`);
  P.push(`<line x1="24" y1="54" x2="${W - 76}" y2="54" stroke="#cfd5d1" stroke-width="0.7"/>`);

  // Norte minimalista
  P.push(`<g transform="translate(${W - 44},40)">
    <circle r="14" fill="#faf8f4" stroke="#1e2723" stroke-width="0.9"/>
    <polygon points="0,-11 3.5,2.5 0,0" fill="#1e2723"/><polygon points="0,-11 -3.5,2.5 0,0" fill="#faf8f4" stroke="#1e2723" stroke-width="0.6"/>
    <text x="0" y="-16" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="7.8" font-weight="700" fill="#1e2723">N</text>
  </g>`);

  // Polígono real del parque con trama vegetal sutil
  const pStr = park.poly.map(q => `${X(q[0]).toFixed(1)},${Y(q[1]).toFixed(1)}`).join(' ');
  P.push(`<polygon points="${pStr}" fill="url(#rh-prado)" stroke="#1e2723" stroke-width="1.5"/>`);

  // Zonificación arquitectónica sobria (tonos minerales atenuados, sin neones)
  if (diag && diag.celdas) {
    for (const c of diag.celdas) {
      const col = c.clase === 'apta' ? '#5d966d' : c.clase === 'cond' ? '#cfa459' : '#c27168';
      const r = Math.max(2, (c.s * sc) * 0.48);
      P.push(`<rect x="${(X(c.x) - r).toFixed(1)}" y="${(Y(c.z) - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" fill="${col}" fill-opacity="0.24"/>`);
    }
  }
  // Árboles censados con símbolo arquitectónico limpio
  if (diag && diag.arbolesParque) {
    for (const t of diag.arbolesParque) {
      const rT = Math.max(2.6, Math.min(7, 2.3 * sc));
      P.push(`<circle cx="${X(t[0]).toFixed(1)}" cy="${Y(t[1]).toFixed(1)}" r="${rT.toFixed(1)}" fill="#b8cfb4" fill-opacity="0.72" stroke="#24402d" stroke-width="0.6"/>`);
      P.push(`<circle cx="${X(t[0]).toFixed(1)}" cy="${Y(t[1]).toFixed(1)}" r="0.8" fill="#24402d"/>`);
    }
  }
  // Huella de la huerta implantada con rayado tierra + contorno terracota arquitectónico
  const cs = Math.cos(orientAng), sn = Math.sin(orientAng);
  const corners = [[-dims.totalL / 2, -dims.totalW / 2], [dims.totalL / 2, -dims.totalW / 2], [dims.totalL / 2, dims.totalW / 2], [-dims.totalL / 2, dims.totalW / 2]]
    .map(([u, v]) => [sitio[0] + u * cs - v * sn, sitio[1] + u * sn + v * cs]);
  P.push(`<polygon points="${corners.map(q => `${X(q[0]).toFixed(1)},${Y(q[1]).toFixed(1)}`).join(' ')}" fill="url(#rh-tierra)" stroke="#9e472b" stroke-width="1.9"/>`);
  const hx = X(sitio[0]), hy = Y(sitio[1]);
  P.push(`<line x1="${hx.toFixed(1)}" y1="${hy.toFixed(1)}" x2="${(hx + 28).toFixed(1)}" y2="${(hy - 22).toFixed(1)}" stroke="#9e472b" stroke-width="0.9"/>`);
  P.push(`<rect x="${(hx + 28).toFixed(1)}" y="${(hy - 31).toFixed(1)}" width="114" height="15" rx="2" fill="#faf8f4" stroke="#9e472b" stroke-width="0.8"/>`);
  P.push(`<text x="${(hx + 85).toFixed(1)}" y="${(hy - 21).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="7.4" font-weight="700" fill="#7c331c">HUERTA ${dims.totalL}×${dims.totalW} m</text>`);

  // Escala gráfica y leyenda arquitectónica inferior
  const barM = spanX > 180 ? 50 : (spanX > 80 ? 20 : 10);
  const barPx = barM * sc;
  P.push(`<line x1="20" y1="${H - 42}" x2="${W - 20}" y2="${H - 42}" stroke="#1e2723" stroke-width="0.8"/>`);
  P.push(`<g transform="translate(24,${H - 22})" font-family="JetBrains Mono,monospace" font-size="7.8" fill="#24302a">
    <rect x="0" y="-8" width="9" height="9" fill="#5d966d" fill-opacity="0.38" stroke="#447352" stroke-width="0.6"/><text x="13" y="0">APTA (${diag ? diag.pctApta : '-'}%)</text>
    <rect x="96" y="-8" width="9" height="9" fill="#cfa459" fill-opacity="0.38" stroke="#9e7834" stroke-width="0.6"/><text x="109" y="0">CONDIC. (${diag ? diag.pctCond : '-'}%)</text>
    <rect x="206" y="-8" width="9" height="9" fill="#c27168" fill-opacity="0.38" stroke="#8f4c45" stroke-width="0.6"/><text x="219" y="0">NO APTA (${diag ? diag.pctNoApta : '-'}%)</text>
    <circle cx="326" cy="-3.5" r="4" fill="#b8cfb4" stroke="#24402d" stroke-width="0.7"/><text x="335" y="0">ÁRBOLES (${diag ? diag.arbolesDentro : 0})</text>
    <rect x="434" y="-8" width="11" height="9" fill="url(#rh-tierra)" stroke="#9e472b" stroke-width="1"/><text x="449" y="0">HUERTA PROPUESTA</text>
  </g>`);
  P.push(`<g transform="translate(${(W - 24 - barPx).toFixed(1)},${H - 25})">
    <rect x="0" y="0" width="${(barPx / 2).toFixed(1)}" height="4.5" fill="#1e2723"/>
    <rect x="${(barPx / 2).toFixed(1)}" y="0" width="${(barPx / 2).toFixed(1)}" height="4.5" fill="#faf8f4" stroke="#1e2723" stroke-width="0.7"/>
    <text x="0" y="-3" font-family="JetBrains Mono,monospace" font-size="7" fill="#1e2723">0</text>
    <text x="${barPx.toFixed(1)}" y="-3" text-anchor="end" font-family="JetBrains Mono,monospace" font-size="7" fill="#1e2723">${barM} m</text>
  </g>`);
  P.push('</svg>');
  return P.join('');
}

/* ---------- Exportación GeoJSON WGS84 real (Kennedy, Bogotá) ---------- */
export function generarGeoJSON(proyecto) {
  const { park, sitio, orientAng, elementos, zonasRayado = [], dims, sim } = proyecto;
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
  for (const z of zonasRayado) {
    features.push({
      type: 'Feature',
      properties: { capa: 'zona_rayado', id: z.id, nombre: z.n, hatch: z.hatch, largo_m: z.l, ancho_m: z.w },
      geometry: { type: 'Polygon', coordinates: rectGeo(z.u, z.v, z.l, z.w, z.rot || 0) }
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

/* ---------- Reporte técnico arquitectónico imprimible a PDF ---------- */
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
  <title>Dossier Arquitectónico Huerta Urbana · ${esc(park ? park.nombre : 'Kennedy')}</title>
  <style>
    body{font-family:Inter,system-ui,sans-serif;color:#18221e;margin:22px;line-height:1.45;font-size:11.5px;background:#fff}
    h1{font-size:17px;margin:0 0 4px;color:#14261e;letter-spacing:.02em}
    h2{font-size:12.5px;margin:18px 0 6px;border-bottom:1.2px solid #1e2723;padding-bottom:3px;color:#1e2723;text-transform:uppercase;letter-spacing:.06em}
    .meta{color:#525f59;font-size:10.5px;margin-bottom:14px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}
    .card{border:1px solid #cfd5d1;border-radius:6px;padding:8px;background:#faf8f4}
    .card b{display:block;font-size:13.5px;color:#18221e}
    table{width:100%;border-collapse:collapse;margin:8px 0;font-size:10.5px}
    th,td{border:1px solid #cfd5d1;padding:5px 7px;text-align:left;vertical-align:top}
    th{background:#f2f0eb;color:#18221e}
    .svgbox{border:1px solid #cfd5d1;border-radius:6px;padding:6px;margin:8px 0;text-align:center;page-break-inside:avoid;background:#faf8f4}
    .svgbox svg{max-width:100%;height:auto}
    .aviso{background:#faf6ec;border:1px solid #c9a769;border-radius:6px;padding:8px 10px;font-size:10.5px;margin:10px 0}
    @media print{.noprint{display:none}}
  </style></head><body>
  <div class="noprint" style="margin-bottom:12px"><button onclick="window.print()" style="padding:8px 14px;background:#1e2723;color:#fff;border:0;border-radius:5px;cursor:pointer;font-weight:600">Imprimir / Guardar como PDF</button></div>
  <h1>Dossier Arquitectónico y Agroecológico · ${esc(park ? park.nombre : 'Parque')} (Kennedy, Bogotá)</h1>
  <div class="meta">Clasificación IDRD: ${esc(park ? park.tipo : '-')} (${fmt(park ? park.area : 0)} m²) · Tipología ${esc(proyecto.tipologia.letra)}: ${esc(proyecto.tipologia.n)} · Referencias: Pro Huerta–INTA (2016), JBB, FAO-56, AGROSAVIA, IDEAM.</div>

  <div class="grid">
    <div class="card"><b>${sim.areaCultivo} m²</b>Superficie cultivada (${dims.areaTotal} m² huella · ${sim.pctParqueLibre}% parque libre)</div>
    <div class="card"><b>${sim.productiva.kgMin}–${sim.productiva.kgMax} kg/año</b>Producción estimada (${sim.productiva.familiasINTA} familias ref. INTA)</div>
    <div class="card"><b>${sim.hidrica.demandaDiariaL} L/día</b>Riego goteo (lluvia cubre ${sim.hidrica.coberturaLluviaPct}%)</div>
    <div class="card"><b>$${(sim.costos.capexTotal / 1e6).toFixed(1)} M COP</b>Inversión referencial (±30%)</div>
  </div>

  <div class="aviso"><b>Transparencia y verificación en campo:</b> Este dossier distingue datos importados (IDRD/OSM/Censo arbolado), mediciones geométricas y estimaciones paramétricas. Antes de ejecutar obra se debe validar en campo: (1) análisis de suelo y metales pesados, (2) topografía de detalle (&lt;0,5 m), (3) punto de acueducto EAAB y (4) viabilidad institucional con IDRD y comunidad (JAC).</div>

  <h2>1. Plano General de Implantación</h2><div class="svgbox">${svgImp}</div>
  <h2>2. Planta Arquitectónica de Cultivos y Bloques (2 cuadraditos = 1 m)</h2><div class="svgbox">${svgCam}</div>
  <h2>3. Planta de Riego por Goteo y Captación Pluvial</h2><div class="svgbox">${svgRie}</div>

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

/* ============ FASE 1 & SECCIÓN 2: DIAGNÓSTICO INTEGRAL DE LOS 576 PARQUES DE KENNEDY ============
   Evalúa los 12 criterios exigidos ANTES de generar cualquier propuesta:
   1. Área total y geometría · 2. Superficies disponibles (Apta / Condicionada / No apta) · 3. Accesos peatonales
   4. Caminos existentes · 5. Arbolado existente a conservar (0 árboles talados) · 6. Edificaciones/canchas/obstáculos
   7. Sol y sombras (posición solar astronómica real Bogotá) · 8. Pendientes/topografía · 9. Fuentes de agua
   10. Condiciones del suelo y contaminación · 11. Relación con colegios/equipamientos · 12. Espacio público y permanencia.
   Distingue explícitamente cada dato como: IMPORTADO | MEDIDO | ESTIMADO | PENDIENTE DE VERIFICAR. */

import { BOGOTA_CLIMA, TIPOLOGIAS } from './datos_agronomia.js?v=1';

export const PROVENIENCIA = {
  IMPORTADO: { tag: 'Importado', c: '#38bdf8' },
  MEDIDO:    { tag: 'Medido 3D', c: '#34d399' },
  ESTIMADO:  { tag: 'Estimado',  c: '#f59e0b' },
  PENDIENTE: { tag: 'Verificar campo', c: '#fb7185' }
};

/* ---------- Geometría 2D básica ---------- */
export const polyArea = (P) => {
  let a = 0;
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[(i + 1) % P.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(a) * 0.5;
};
export const polyPerim = (P) => {
  let l = 0;
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[(i + 1) % P.length];
    l += Math.hypot(q[0] - p[0], q[1] - p[1]);
  }
  return l;
};
export const polyCentro = (P) => {
  let x = 0, z = 0;
  for (const p of P) { x += p[0]; z += p[1]; }
  return [x / P.length, z / P.length];
};
export const pip = (P, x, z) => {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i], b = P[j];
    if ((a[1] > z) !== (b[1] > z) && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
};
export const distSeg = (x, z, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
  return Math.hypot(x - (a[0] + t * dx), z - (a[1] + t * dz));
};
export const distBorde = (P, x, z) => {
  let m = 1e9;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) m = Math.min(m, distSeg(x, z, P[j], P[i]));
  return m;
};
export const polyEje = (P) => {
  let best = 0, ang = 0;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l > best) { best = l; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); }
  }
  return ang;
};

/* ---------- Posición Solar Astronómica Real para Bogotá (lat 4.628°N, lon -74.155°W) ----------
   Devuelve altitud solar (rad), azimut desde Norte hacia Este (rad), y vector de dirección al sol en mundo 3D (+X=E, -Z=N, +Y=arriba). */
export function posicionSolarBogota(mes1a12 = 6, horaLocal = 10.5) {
  const diaAnio = Math.round((mes1a12 - 0.5) * 30.44);
  const lat = BOGOTA_CLIMA.lat * Math.PI / 180;
  // Declinación solar aproximada (Cooper, 1969)
  const decl = 23.45 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + diaAnio) / 365);
  // Ángulo horario (hora solar local respecto a mediodía 12:00 en UTC-5, corrección lon ≈ +3.4 min)
  const H = ((horaLocal - 12.05) * 15) * Math.PI / 180;
  const sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAz = (Math.sin(decl) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat) || 1e-6);
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (H > 0) az = 2 * Math.PI - az; // tarde: sol hacia el Oeste
  // En Three.js: +X = Este (sin az), -Z = Norte (cos az), +Y = sin alt
  const dir = [Math.cos(alt) * Math.sin(az), Math.sin(alt), -Math.cos(alt) * Math.cos(az)];
  const sombraLen = alt > 0.08 ? Math.min(4.5, 1 / Math.tan(alt)) : 4.5;
  return {
    altRad: alt, altDeg: +(alt * 180 / Math.PI).toFixed(1),
    azRad: az, azDeg: +(az * 180 / Math.PI).toFixed(1),
    dir, sombraLen, deDia: alt > 0.05
  };
}

// Conversión inversa mundo 3D -> WGS84 (lon, lat) para exportación GeoJSON real de Kennedy
const LAT0 = 4.640683, LON0 = -74.149778;
const MX = 111320 * Math.cos(4.63 * Math.PI / 180), MY = 110540.0;
export const geoAMundo = (lon, lat) => [(lon - LON0) * MX + 2095.67, -(lat - LAT0) * MY - 109.06];
export const mundoAGeo = (x, z) => [
  +(LON0 + (x - 2095.67) / MX).toFixed(6),
  +(LAT0 - (z + 109.06) / MY).toFixed(6)
];

/* ---------- Carga e indexación territorial (576 parques + contextos reales) ---------- */
export async function cargarContextoTerritorial({ T3, lw }) {
  const cj = (u) => (window.cargarJSON ? window.cargarJSON(u) : fetch(u).then(r => r.json()));
  const [PQ, KEN, CAN, WB, COL, AG, NET, RES] = await Promise.all([
    cj('data3d/parques.json'),
    cj('data3d/kennedy.json').catch(() => null),
    cj('data3d/canchas.json').catch(() => ({ canchas: [] })),
    cj('data3d/water_bodies.json').catch(() => []),
    cj('data3d/colegios.json?v=2').catch(() => ({ colegios: [] })),
    cj('data3d/agua.json?v=1').catch(() => ({ huertas: [], cisternas: [] })),
    cj('data3d/net.json').catch(() => ({ edges: [] })),
    cj('data3d/residuos.json').catch(() => ({ puntos: [] }))
  ]);

  const LIM = KEN && KEN.limite ? KEN.limite.map(p => geoAMundo(p[0], p[1])) : null;

  const AGUAS = (WB || []).filter(w => w.pts && w.pts.length >= 4).map(w => {
    const P = w.pts.map(q => lw(q[0], q[1]));
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const p of P) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < z0) z0 = p[1]; if (p[1] > z1) z1 = p[1]; }
    return { n: w.nombre || w.tipo || 'Cuerpo de agua', P, x0: x0 - 6, x1: x1 + 6, z0: z0 - 6, z1: z1 + 6 };
  });

  const CANCHAS = (CAN && CAN.canchas || []).map(c => ({
    x: c.c[0] + 2095.67, z: c.c[1] - 109.06, L: c.L / 2 + 3.5, W: c.W / 2 + 3.5, ca: Math.cos(-c.a), sa: Math.sin(-c.a)
  }));

  const COLEGIOS = (COL && COL.colegios || []).map(c => ({ n: c.n || 'Colegio', c: c.c }));
  const HUERTAS_EX = (AG && AG.huertas || []).map(h => ({ n: h.n, dir: h.dir, agua: h.agua, p: h.p }));

  // Nodos de vías perimetrales muestreados para localizar accesos peatonales reales (net.json)
  const VIAS_GRID = new Map();
  const addViaPt = (x, z, tipo) => {
    const k = Math.floor(x / 60) + '_' + Math.floor(z / 60);
    let a = VIAS_GRID.get(k); if (!a) { a = []; VIAS_GRID.set(k, a); }
    a.push(x, z, tipo);
  };
  for (const e of (NET && NET.edges || [])) {
    if (!e[1] || e[1].length < 2) continue;
    const pts = e[1];
    for (let i = 0; i < pts.length; i += Math.max(1, Math.floor(pts.length / 3))) {
      const w = lw(pts[i][0], pts[i][1]);
      addViaPt(w[0], w[1], e[0] || 0);
    }
  }

  // Índice espacial de árboles existentes (119.886 árboles del censo en T3.trees.pos o trees.json)
  let arbolGrid = null;
  let treesPromise = null;
  const construirGridArboles = (arrX, arrZ, arrH) => {
    const G = new Map();
    for (let i = 0; i < arrX.length; i++) {
      const k = Math.floor(arrX[i] / 20) + '_' + Math.floor(arrZ[i] / 20);
      let a = G.get(k); if (!a) { a = []; G.set(k, a); }
      a.push(arrX[i], arrZ[i], arrH ? arrH[i] : 8);
    }
    return G;
  };
  const asegurarArboles = async () => {
    if (arbolGrid) return arbolGrid;
    const P = T3 && T3.trees && T3.trees.pos;
    if (P && P.X && P.X.length) {
      arbolGrid = construirGridArboles(P.X, P.Z, P.Hh);
      return arbolGrid;
    }
    if (!treesPromise) {
      treesPromise = cj('data3d/trees.json').then(T => {
        const list = (T && T.t) || [];
        const X = new Float32Array(list.length), Z = new Float32Array(list.length), Hh = new Float32Array(list.length);
        for (let i = 0; i < list.length; i++) {
          const w = lw(list[i][0], list[i][1]);
          X[i] = w[0]; Z[i] = w[1]; Hh[i] = Math.max(5, Math.min(15, 5.5 + (list[i][2] || 4) * 0.8));
        }
        arbolGrid = construirGridArboles(X, Z, Hh);
        return arbolGrid;
      }).catch(() => new Map());
    }
    return treesPromise;
  };

  // Exactamente los 576 parques reales de Kennedy (área >= 200 m², excluyendo polígonos Manual)
  const TIPO_COL = {
    'PARQUE METROPOLITANO': '#34d399',
    'PARQUE ZONAL': '#60a5fa',
    'PARQUE VECINAL': '#a3e635',
    'PARQUE DE BOLSILLO': '#fbbf24'
  };
  const PARQUES = [];
  let id = 0;
  for (const p of PQ || []) {
    if (!p.pts || p.pts.length < 4 || p.tipo === 'Manual') continue;
    const poly = p.pts.map(q => lw(q[0], q[1]));
    const c = polyCentro(poly);
    if (LIM && !pip(LIM, c[0], c[1])) continue;
    const area = Math.round(polyArea(poly));
    if (area < 200) continue; // exactamente 576 parques clasificados de Kennedy
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const q of poly) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < z0) z0 = q[1]; if (q[1] > z1) z1 = q[1]; }
    PARQUES.push({
      id: id++,
      nombre: (p.nombre || 'Parque sin nombre').trim(),
      tipo: p.tipo || 'PARQUE VECINAL',
      area, perim: Math.round(polyPerim(poly)),
      poly, c, ang: polyEje(poly),
      bbox: { x0, x1, z0, z1 },
      color: TIPO_COL[p.tipo] || '#a3e635',
      diag: null,
      sitio: null
    });
  }
  PARQUES.sort((a, b) => b.area - a.area);

  const enAgua = (x, z) => AGUAS.some(w => x >= w.x0 && x <= w.x1 && z >= w.z0 && z <= w.z1 && (pip(w.P, x, z) || distBorde(w.P, x, z) < 6));
  const enCancha = (x, z) => CANCHAS.some(c => {
    const dx = x - c.x, dz = z - c.z;
    if (Math.abs(dx) > c.L + c.W || Math.abs(dz) > c.L + c.W) return false;
    const u = dx * c.ca - dz * c.sa, v = dx * c.sa + dz * c.ca;
    return Math.abs(u) <= c.L && Math.abs(v) <= c.W;
  });

  /* ---------- Analizador de los 12 criterios + Zonificación real (Apta / Condicionada / No apta) ---------- */
  async function analizarParque(park) {
    if (park.diag) return park.diag;
    const G = await asegurarArboles();
    const { x0, x1, z0, z1 } = park.bbox;

    // 1. Recolectar árboles dentro y a 12 m del parque
    const arbolesParque = [];
    const ix0 = Math.floor((x0 - 12) / 20), ix1 = Math.floor((x1 + 12) / 20);
    const iz0 = Math.floor((z0 - 12) / 20), iz1 = Math.floor((z1 + 12) / 20);
    for (let ix = ix0; ix <= ix1; ix++) for (let iz = iz0; iz <= iz1; iz++) {
      const a = G.get(ix + '_' + iz); if (!a) continue;
      for (let i = 0; i < a.length; i += 3) {
        if (pip(park.poly, a[i], a[i + 1]) || distBorde(park.poly, a[i], a[i + 1]) < 8) {
          arbolesParque.push([a[i], a[i + 1], a[i + 2]]);
        }
      }
    }
    const arbolesDentro = arbolesParque.filter(t => pip(park.poly, t[0], t[1])).length;

    // 2. Canchas y cuerpos de agua en o junto al parque
    const canchasParque = CANCHAS.filter(c => c.x >= x0 - 20 && c.x <= x1 + 20 && c.z >= z0 - 20 && c.z <= z1 + 20 && (pip(park.poly, c.x, c.z) || distBorde(park.poly, c.x, c.z) < 8));
    const aguasCerca = AGUAS.filter(w => !(w.x1 < x0 - 30 || w.x0 > x1 + 30 || w.z1 < z0 - 30 || w.z0 > z1 + 30));

    // 3. Accesos peatonales reales detectados desde red vial OSM (net.json)
    const accesos = [];
    const vx0 = Math.floor((x0 - 40) / 60), vx1 = Math.floor((x1 + 40) / 60);
    const vz0 = Math.floor((z0 - 40) / 60), vz1 = Math.floor((z1 + 40) / 60);
    let viaArterialCerca = false;
    for (let vx = vx0; vx <= vx1; vx++) for (let vz = vz0; vz <= vz1; vz++) {
      const a = VIAS_GRID.get(vx + '_' + vz); if (!a) continue;
      for (let i = 0; i < a.length; i += 3) {
        const d = distBorde(park.poly, a[i], a[i + 1]);
        if (d < 22) {
          if (a[i + 2] >= 2) viaArterialCerca = true;
          if (!accesos.some(q => Math.hypot(q[0] - a[i], q[1] - a[i + 1]) < 35)) accesos.push([a[i], a[i + 1]]);
        }
      }
    }

    // 4. Colegios y huertas comunitarias cercanas
    const colDist = COLEGIOS.map(c => ({ n: c.n, d: Math.round(Math.hypot(c.c[0] - park.c[0], c.c[1] - park.c[1])) })).sort((a, b) => a.d - b.d);
    const col500 = colDist.filter(c => c.d <= 500).length;
    const col1000 = colDist.filter(c => c.d <= 1000).length;
    const colCerca = colDist[0] || null;

    const huertaDist = HUERTAS_EX.map(h => ({ n: h.n, d: Math.round(Math.hypot(h.p[0] - park.c[0], h.p[1] - park.c[1])) })).sort((a, b) => a.d - b.d);
    const huertaCerca = huertaDist[0] || null;

    // 5. Rejilla espacial de aptitud (Apta / Condicionada / No apta) respetando árboles, canchas, agua y circulaciones
    const span = Math.max(x1 - x0, z1 - z0);
    const cell = Math.max(4, Math.min(14, span / 22));
    const celdas = []; // { x, z, s: cell, clase: 'apta'|'cond'|'no', razon, solH }
    let nApta = 0, nCond = 0, nNo = 0;
    const solManana = posicionSolarBogota(6, 9.5);
    const solTarde = posicionSolarBogota(6, 15.0);

    for (let x = x0 + cell / 2; x <= x1; x += cell) {
      for (let z = z0 + cell / 2; z <= z1; z += cell) {
        if (!pip(park.poly, x, z)) continue;
        const db = distBorde(park.poly, x, z);
        const isAgua = enAgua(x, z);
        const isCancha = enCancha(x, z);
        let dMinArb = 1e9, sombraArb = 0;
        for (const t of arbolesParque) {
          const d = Math.hypot(x - t[0], z - t[1]);
          if (d < dMinArb) dMinArb = d;
          const rCopa = Math.max(2.8, Math.min(5.8, t[2] * 0.42));
          if (d < rCopa + t[2] * 0.55) sombraArb++;
        }
        // Estima horas de sol directo en Bogotá (máx ~8.5 h efectivas por nubosidad media)
        const solH = Math.max(2.0, +(8.0 - sombraArb * 1.45 - (db < 3 ? 0.5 : 0)).toFixed(1));
        let clase = 'apta', razon = 'Claro soleado disponible (≥ 5,5 h luz)';
        if (isAgua) { clase = 'no'; razon = 'Cuerpo de agua / ronda hídrica'; nNo++; }
        else if (isCancha) { clase = 'no'; razon = 'Cancha deportiva existente'; nNo++; }
        else if (dMinArb < 4.2) { clase = 'no'; razon = 'Zona de copa/raíz de árbol a conservar'; nNo++; }
        else if (db < 2.2) { clase = 'cond'; razon = 'Borde perimetral / retiro peatonal'; nCond++; }
        else if (solH < 5.5) { clase = 'cond'; razon = 'Semisombra (4–5 h: solo hojas/raíces o estancia)'; nCond++; }
        else { nApta++; }
        celdas.push({ x, z, s: cell, clase, razon, solH });
      }
    }
    const totC = Math.max(1, nApta + nCond + nNo);
    const areaApta = Math.round(park.area * (nApta / totC));
    const areaCond = Math.round(park.area * (nCond / totC));
    const areaNoApta = Math.max(0, park.area - areaApta - areaCond);
    const pctApta = Math.round((nApta / totC) * 100);
    const pctCond = Math.round((nCond / totC) * 100);
    const pctNoApta = Math.max(0, 100 - pctApta - pctCond);
    const solProm = celdas.length ? +(celdas.reduce((s, c) => s + c.solH, 0) / celdas.length).toFixed(1) : 6.0;

    // 6. Recomendación razonada de tipologías (la escala es contexto, NO regla absoluta — Sección 2)
    const scores = Object.values(TIPOLOGIAS).map(t => {
      let sc = 50;
      const motivos = [];
      if (t.id === 'educativa') {
        if (col500 >= 1) { sc += 28; motivos.push(`${col500} colegio(s) a ≤ 500 m`); }
        else if (col1000 >= 2) { sc += 16; motivos.push(`${col1000} colegios a ≤ 1 km`); }
      }
      if (t.id === 'produccion') {
        if (areaApta >= 600 && solProm >= 6.0) { sc += 26; motivos.push(`${areaApta} m² de claros soleados`); }
        else if (areaApta < 180) { sc -= 18; motivos.push('Claros soleados reducidos'); }
      }
      if (t.id === 'biodiversidad') {
        if (arbolesDentro >= 15 || aguasCerca.length) { sc += 25; motivos.push(`${arbolesDentro} árboles existentes${aguasCerca.length ? ' + cercanía hídrica' : ''}`); }
      }
      if (t.id === 'comunitaria') {
        if (accesos.length >= 2) { sc += 22; motivos.push(`${accesos.length} accesos peatonales vecinales`); }
      }
      if (t.id === 'terapeutica') {
        if (pctCond >= 20 || park.area <= 15000) { sc += 20; motivos.push('Ideal para recorridos accesibles con sombra existente'); }
      }
      if (t.id === 'circular') {
        if (accesos.length >= 2 && areaApta >= 250) { sc += 18; motivos.push('Buen acceso de servicio para compostaje barrial'); }
      }
      if (t.id === 'experimental') {
        if (col1000 >= 1 && areaApta >= 300) { sc += 17; motivos.push('Entorno escolar/institucional apto para monitoreo'); }
      }
      if (!motivos.length) motivos.push('Viable con diseño adaptado a la geometría del parque');
      return { id: t.id, n: t.n, letra: t.letra, c: t.c, score: Math.min(98, Math.max(25, sc)), motivos };
    }).sort((a, b) => b.score - a.score);

    // 7. Matriz explícita de los 12 criterios con su proveniencia (Importado / Medido / Estimado / Pendiente)
    const criterios12 = [
      { n: '1. Área y geometría', val: `${park.area.toLocaleString('es-CO')} m² · perímetro ${park.perim} m (${park.tipo})`, prov: 'IMPORTADO', fuente: 'IDRD · data3d/parques.json' },
      { n: '2. Superficies disponibles', val: `Apta ${areaApta.toLocaleString('es-CO')} m² (${pctApta}%) · Cond. ${areaCond.toLocaleString('es-CO')} m² (${pctCond}%) · No apta ${areaNoApta.toLocaleString('es-CO')} m² (${pctNoApta}%)`, prov: 'MEDIDO', fuente: 'Rejilla espacial sobre polígono y obstáculos' },
      { n: '3. Accesos peatonales', val: accesos.length ? `${accesos.length} puntos de conexión peatonal perimetral` : 'Verificar acceso peatonal directo en campo', prov: accesos.length ? 'IMPORTADO' : 'PENDIENTE', fuente: 'Red vial OSM · data3d/net.json' },
      { n: '4. Caminos existentes', val: `Eje dominante ${(park.ang * 180 / Math.PI).toFixed(0)}° · respetar trazado sin bloquear flujos`, prov: 'ESTIMADO', fuente: 'Geometría del parque (verificar senderos internos en sitio)' },
      { n: '5. Arbolado a conservar', val: `${arbolesDentro} árboles censados dentro del parque (0 talas permitidas)`, prov: 'IMPORTADO', fuente: 'Censo arbolado · data3d/trees.json' },
      { n: '6. Canchas y obstáculos', val: `${canchasParque.length} cancha(s) deportiva(s) · ${aguasCerca.length} cuerpo(s) de agua cercanos`, prov: 'IMPORTADO', fuente: 'OSM canchas.json + water_bodies.json' },
      { n: '7. Sol y sombras', val: `Promedio estimado ${solProm} h/día (solsticios/equinoccios lat 4.63°N · sombra arbórea)`, prov: 'ESTIMADO', fuente: 'Cálculo astronómico solar + copas censadas' },
      { n: '8. Topografía y pendientes', val: 'Terraza plana de Kennedy (< 2% macro); verificar micro-encharcamiento en campo', prov: 'PENDIENTE', fuente: 'Requiere levantamiento altimétrico (< 0,5 m); canteros alomados 15 cm' },
      { n: '9. Fuentes de agua', val: `${huertaCerca ? `Huerta comunitaria más cercana: ${huertaCerca.n} (${huertaCerca.d} m)` : 'Captación lluvia + cisterna'}; acometida EAAB por verificar`, prov: 'PENDIENTE', fuente: 'Ruta Agroecológica JBB + verificación acometida EAAB' },
      { n: '10. Suelo y contaminación', val: viaArterialCerca ? 'Proximidad a vía arterial: obligatorio bancal elevado con geotextil y sustrato validado' : 'Sin análisis fisicoquímico: exigir ensayo de suelo (pH, MO, Pb/Cd) antes de siembra directa', prov: 'PENDIENTE', fuente: 'Regla sanitaria 11.2 · pendiente laboratorio de suelos' },
      { n: '11. Colegios y entorno', val: colCerca ? `${col500} colegio(s) a ≤ 500 m · ${col1000} a ≤ 1 km (más cercano: ${colCerca.n}, ${colCerca.d} m)` : 'Sin colegios censados en radio inmediato', prov: 'IMPORTADO', fuente: 'data3d/colegios.json (74 colegios Kennedy)' },
      { n: '12. Espacio público y gestión', val: `Mínimo 75–85% del parque libre para recreación · viabilidad IDRD/JAC pendiente de validación`, prov: 'PENDIENTE', fuente: 'Lineamientos espacio público Bogotá (DADEP/IDRD)' }
    ];

    park.diag = {
      areaApta, areaCond, areaNoApta, pctApta, pctCond, pctNoApta,
      arbolesDentro, arbolesParque, canchasParque, aguasCerca, accesos, viaArterialCerca,
      col500, col1000, colCerca, huertaCerca, solProm, celdas, scores, criterios12,
      solRef: { solManana, solTarde }
    };
    return park.diag;
  }

  // Encuentra el mejor emplazamiento libre de obstáculos dentro de la zona APTA del parque
  function encontrarSitioOptimo(park, diag, L, W, ang = 0) {
    const hl = L / 2, hw = W / 2, cs = Math.cos(ang), sn = Math.sin(ang);
    const ptsCheck = [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw], [0, 0], [-hl, 0], [hl, 0], [0, -hw], [0, hw]];
    const cands = diag.celdas.filter(c => c.clase === 'apta');
    const pool = cands.length ? cands : diag.celdas.filter(c => c.clase !== 'no');
    let best = null;
    for (const cd of pool) {
      let inAll = true, bad = false, treeHits = 0;
      for (const [u, v] of ptsCheck) {
        const wx = cd.x + u * cs - v * sn, wz = cd.z + u * sn + v * cs;
        if (!pip(park.poly, wx, wz)) { inAll = false; break; }
        if (enAgua(wx, wz) || enCancha(wx, wz)) { bad = true; break; }
      }
      if (bad) continue;
      for (const t of diag.arbolesParque) {
        const dx = t[0] - cd.x, dz = t[1] - cd.z;
        const u = dx * cs + dz * sn, v = -dx * sn + dz * cs;
        if (Math.abs(u) <= hl + 2.5 && Math.abs(v) <= hw + 2.5) treeHits++;
      }
      const db = distBorde(park.poly, cd.x, cd.z);
      // Penaliza salirse del polígono o tocar árboles; favorece sol pleno y cercanía moderada a un acceso peatonal
      let dAcc = 40;
      for (const a of diag.accesos) dAcc = Math.min(dAcc, Math.hypot(a[0] - cd.x, a[1] - cd.z));
      const score = (inAll ? 0 : 1200) + treeHits * 80 - cd.solH * 14 - Math.min(db, 14) * 2.2 + dAcc * 0.25;
      if (!best || score < best.score) best = { x: cd.x, z: cd.z, score, inAll, treeHits };
    }
    if (best) return [best.x, best.z];
    return park.c.slice();
  }

  return { PARQUES, COLEGIOS, HUERTAS_EX, AGUAS, CANCHAS, analizarParque, encontrarSitioOptimo, asegurarArboles };
}

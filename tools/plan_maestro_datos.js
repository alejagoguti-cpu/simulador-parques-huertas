/* Plan maestro «Bavaria Común · Distrito de Tecnologías Convergentes» -> data3d/plan_maestro.json
   Uso: node tools/plan_maestro_datos.js
   Fuentes: data3d/bavaria.json (predio, 29 edificios, tanques), data3d/bavaria_pres.json (puertas, árboles, ángulo del predio)
   y tools/cache/kennedy_osm.json (Transversal 71B, Calle 7A, Av. Boyacá = Av. Carrera 72).
   Marco «modelo» del simulador: x este, y norte, metros.
   Asignación de edificios: decisión de anteproyecto según tipo y posición (ver PROG); se corrige con la inspección real. */
const fs = require('fs'), path = require('path');
const R = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const B = R('data3d/bavaria.json'), P = R('data3d/bavaria_pres.json');
const area = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };
const cen = (p) => { let a = 0, x = 0, y = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length], f = x1 * y2 - x2 * y1; a += f; x += (x1 + x2) * f; y += (y1 + y2) * f; } return [x / (3 * a), y / (3 * a)]; };
const dentro = (x, y, Q) => { let c = false; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) if ((Q[i][1] > y) !== (Q[j][1] > y) && x < (Q[j][0] - Q[i][0]) * (y - Q[i][1]) / (Q[j][1] - Q[i][1]) + Q[i][0]) c = !c; return c; };
const dSeg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
const dPoly = (p, Q) => { if (dentro(p[0], p[1], Q)) return 0; let m = 1e9; for (let i = 0; i < Q.length; i++) m = Math.min(m, dSeg(p, Q[i], Q[(i + 1) % Q.length])); return m; };
const E = B.edif.map((e, i) => ({ i, p: e.p, h: e.h, s: e.s, a: area(e.p), c: cen(e.p) }));
const near = (pt, filtro = () => true) => E.filter(filtro).sort((a, b) => Math.hypot(a.c[0] - pt[0], a.c[1] - pt[1]) - Math.hypot(b.c[0] - pt[0], b.c[1] - pt[1]))[0];

// --- puertas: las de bavaria_pres.json más cercanas a cada calle de OSM ---
const MX = 111320 * Math.cos(4.63 * Math.PI / 180), toM = (la, lo) => [(lo + 74.17) * MX + 5193.24, (la - 4.63) * 110540 + 2090.06];
const OSM = R('tools/cache/kennedy_osm.json').elements.filter((e) => e.type === 'way' && e.tags && e.tags.highway && e.tags.name && e.geometry);
const calle = (re) => OSM.filter((w) => re.test(w.tags.name)).map((w) => w.geometry.map((g) => toM(g.lat, g.lon)));
const puertaDe = (lineas) => { let best = null, bd = 1e9; for (const q of P.entradas) for (const L of lineas) for (let k = 0; k + 1 < L.length; k++) { const d = dSeg(q, L[k], L[k + 1]); if (d < bd) { bd = d; best = q; } } return { p: best, d: Math.round(bd) }; };
// la 71B toca el predio en dos puertas; la principal es la del sur (la del oriente obligaría a cruzar el bosque)
const A = (() => { const L = calle(/^Transversal 71B$/), c = P.entradas.filter((q) => L.some((l) => l.some((_, k) => k + 1 < l.length && dSeg(q, l[k], l[k + 1]) < 15))); const q = c.sort((a, b) => a[1] - b[1])[0]; return { p: q, d: 0 }; })(), Bp = puertaDe(calle(/^Calle 7A$/)), C = puertaDe(calle(/^Avenida Carrera 72$/));
// trazos de calle cerca del predio (para dibujar y nombrar)
let sx0 = 1e9, sx1 = -1e9, sy0 = 1e9, sy1 = -1e9; B.sitio.forEach(([x, y]) => { sx0 = Math.min(sx0, x); sx1 = Math.max(sx1, x); sy0 = Math.min(sy0, y); sy1 = Math.max(sy1, y); });
const recorta = (L) => L.filter((pt) => pt[0] > sx0 - 400 && pt[0] < sx1 + 400 && pt[1] > sy0 - 400 && pt[1] < sy1 + 400);
const calles = [['Transversal 71B', /^Transversal 71B$/], ['Calle 7A', /^Calle 7A$/], ['Av. Boyacá', /^Avenida Carrera 72$/]].map(([n, re]) => ({ n, l: calle(re).map(recorta).filter((L) => L.length > 1) }));

// --- programa (índices de bavaria.json) ---
const IDX = { instituto: 5, labs: [7, 28], mercado: 3, poscosecha: 19, memoria: 23, silos: 6 };
// D1: anexo pequeño más cercano a la recta portería 71B -> instituto
const inst = E[IDX.instituto].c, d1 = E.filter((e) => e.a < 700 && e.s === 'ladrillo').sort((a, b) => dSeg(a.c, A.p, inst) - dSeg(b.c, A.p, inst))[0];
// D2: anexo pequeño más cercano a la recta poscosecha -> mercado
const pos = E[IDX.poscosecha].c, mer = E[IDX.mercado].c, d2 = E.filter((e) => e.a < 700 && e.s === 'ladrillo' && e.i !== d1.i).sort((a, b) => dSeg(a.c, pos, mer) - dSeg(b.c, pos, mer))[0];

// --- patio de cultivo: 4 módulos de 8 camas de 1,25 × 10 m en un rectángulo libre (≈ 40 × 24 m) cerca de instituto y laboratorios ---
const ang = P.angulo || 0, /* radianes */ ux = [Math.cos(ang), Math.sin(ang)], uy = [-Math.sin(ang), Math.cos(ang)];
const rect = (c, w, h) => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([u, v]) => [c[0] + u * ux[0] + v * uy[0], c[1] + u * ux[1] + v * uy[1]]);
const ARB = (P.arboles || []).map((a) => (Array.isArray(a) ? a : [a.x, a.y]));
const objetivo = [(inst[0] + E[7].c[0]) / 2, (inst[1] + E[7].c[1]) / 2];
let patio = null, mejor = 1e9;
for (let gx = -260; gx <= 260; gx += 6) for (let gy = -260; gy <= 260; gy += 6) {
  const c = [objetivo[0] + gx, objetivo[1] + gy], R4 = rect(c, 44, 28);
  if (!R4.every(([x, y]) => dentro(x, y, B.sitio))) continue;
  if (E.some((e) => R4.some((q) => dPoly(q, e.p) < 4) || dentro(e.c[0], e.c[1], R4) || e.p.some(([x, y]) => dentro(x, y, R4)))) continue;
  if (B.tanques.some((t) => Math.hypot(t[0] - c[0], t[1] - c[1]) < 60)) continue;
  const nArb = ARB.filter(([x, y]) => dentro(x, y, R4)).length; if (nArb > 3) continue;
  const costo = Math.hypot(gx, gy) + nArb * 30; if (costo < mejor) { mejor = costo; patio = c; }
}
if (!patio) throw new Error('sin patio libre');
const camas = []; // [x, y, módulo]
['A', 'B', 'C', 'D'].forEach((m, k) => { const mc = [(k % 2 ? 1 : -1) * 10.5, (k < 2 ? 1 : -1) * 6.5]; for (let j = 0; j < 8; j++) { const u = mc[0] + (j - 3.5) * 2.3, v = mc[1]; camas.push([patio[0] + u * ux[0] + v * uy[0], patio[1] + u * ux[1] + v * uy[1], m]); } });
const inv = ['A', 'B'].map((m, k) => { const u = (k ? 1 : -1) * 10.5, v = 6.5; return { m, c: [patio[0] + u * ux[0] + v * uy[0], patio[1] + u * ux[1] + v * uy[1]] }; });

// --- bosque: dos puntos de observación en el borde del arbolado más cercano al patio (fuera de la masa) ---
let obs = [];
if (ARB.length) {
  // bosque denso: árboles con muchos vecinos; borde: denso con pocos vecinos densos, del lado del patio
  const G = new Map(), kc = (x, y) => Math.floor(x / 20) + ',' + Math.floor(y / 20); ARB.forEach((a) => { const k = kc(a[0], a[1]); if (!G.has(k)) G.set(k, []); G.get(k).push(a); });
  const vec = (x, y, r) => { let n = 0; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (const a of G.get((Math.floor(x / 20) + i) + ',' + (Math.floor(y / 20) + j)) || []) if (Math.hypot(a[0] - x, a[1] - y) < r) n++; return n; };
  const denso = ARB.filter(([x, y]) => dentro(x, y, B.sitio) && vec(x, y, 22) >= 9);
  const tc = denso.reduce((s, a) => [s[0] + a[0] / denso.length, s[1] + a[1] / denso.length], [0, 0]);
  const borde = denso.filter(([x, y]) => vec(x, y, 22) < 14 && Math.hypot(x - patio[0], y - patio[1]) > 45).sort((a, b) => Math.hypot(a[0] - patio[0], a[1] - patio[1]) - Math.hypot(b[0] - patio[0], b[1] - patio[1]));
  if (borde.length) { obs.push(borde[0]); const o2 = borde.find((q) => Math.hypot(q[0] - borde[0][0], q[1] - borde[0][1]) > 80); if (o2) obs.push(o2); }
  obs = obs.map((o) => { const d = Math.hypot(o[0] - tc[0], o[1] - tc[1]) || 1; return [o[0] + (o[0] - tc[0]) / d * 8, o[1] + (o[1] - tc[1]) / d * 8]; }); // 8 m afuera del borde
  console.log('bosque denso', denso.length, 'centro', tc.map(Math.round));
}

// --- recorridos (puntos de paso; cada tramo evita atravesar edificios cuando es posible) ---
const borde_ = (e, hacia) => { const c = e.c; let best = c, bd = 1e9; for (let i = 0; i < e.p.length; i++) { const a = e.p[i], b = e.p[(i + 1) % e.p.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = Math.hypot(m[0] - hacia[0], m[1] - hacia[1]); if (d < bd) { bd = d; best = m; } } return best; };
const plazaA = d1.c, patioD2 = d2.c, memo = borde_(E[IDX.memoria], mer);
const peatonal = [A.p, plazaA, borde_(E[IDX.instituto], plazaA), memo, borde_(E[IDX.mercado], memo), borde_(E[IDX.mercado], Bp.p), Bp.p];
const servicio = [C.p, borde_(E[IDX.poscosecha], C.p), patioD2, borde_(E[IDX.mercado], patioD2)];
const trabajo = [borde_(E[IDX.instituto], patio), patio, borde_(E[IDX.labs[0]], patio)];
const canastilla = [patio, borde_(E[IDX.poscosecha], patio)];

const prog = [
  { k: 'instituto', i: [IDX.instituto], n: 'Instituto', m2: 290, c: '#e3a64a', det: 'Recepción 35 · 2 aulas de 60 (24 est.) · sala de trabajo 45 · docentes 30 · coordinación 25 · casilleros 35' },
  { k: 'labs', i: IDX.labs, n: 'Laboratorios NBIC', m2: 250, c: '#a98bd6', det: 'Biotecnología vegetal 60 · materiales y sensores 60 · aula digital 60 · pruebas con usuarios 30 · lavado 25 · depósito 15' },
  { k: 'mercado', i: [IDX.mercado], n: 'Mercado de enseñanza', m2: 315, c: '#e0664f', det: '12 puestos de 9 · circulación 120 · demostraciones 45 · pesaje 18 · mobiliario 24' },
  { k: 'poscosecha', i: [IDX.poscosecha], n: 'Poscosecha', m2: 190, c: '#5fb3d9', det: 'Recepción 30 · selección y lavado 40 · empaque 35 · cámara fría 20 · canastillas 20 · orgánicos 15 · despacho 30' },
  { k: 'memoria', i: [IDX.memoria], n: 'Patio de memoria industrial', m2: 120, c: '#e58aa8', det: 'Inducción de 24 · exposiciones · muestras de cosecha · encuentros con productores' },
];
const out = {
  fuente: 'bavaria.json y bavaria_pres.json (simulador); calles de OpenStreetMap; programa: plan maestro Bavaria Común',
  centro: P.centro, angulo: P.angulo || 0, sitio: B.sitio, edif: B.edif.map((e) => ({ p: e.p, h: e.h, s: e.s })),
  tanques: B.tanques, silos: IDX.silos, entradas: P.entradas,
  puertas: { A: { ...A, n: 'Transversal 71B', q: 'Entrada principal del instituto' }, B: { ...Bp, n: 'Calle 7A', q: 'Entrada barrial del mercado' }, C: { ...C, n: 'Borde de Boyacá', q: 'Entrada de operación' } },
  calles, prog, retiros: { D1: { i: d1.i, a: Math.round(d1.a), c: d1.c }, D2: { i: d2.i, a: Math.round(d2.a), c: d2.c } },
  patio, camas, inv, obs, rutas: { peatonal, servicio, trabajo, canastilla },
};
fs.writeFileSync(path.join(__dirname, '..', 'data3d', 'plan_maestro.json'), JSON.stringify(out));
console.log({ A, B: Bp, C, D1: [d1.i, Math.round(d1.a)], D2: [d2.i, Math.round(d2.a)], patio: patio.map(Math.round), obs: obs.map((o) => o.map(Math.round)), arboles: ARB.length });

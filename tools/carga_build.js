/* ¿El proyecto ALIVIA una calle o DESPLAZA el tráfico de carga hacia otra? -> data3d/carga.json
   Uso: node tools/carga_build.js   (después de tools/escenarios_build.js, que da los camiones por costado de Corabastos)
   1. Flujo actual de cada tramo (net.json): vehículos únicos de la grabación SUMO que pasan a menos de 10 m, llevados a 1 hora;
      camión = el mismo 8 % por id que usa el simulador.
   2. Mercados de barrio: 8, elegidos como en data3d/propuesta.js (tiendas de propuesta.json, punto más lejano a los ya abiertos,
      empezando junto a El Burro).
   3. Proyecto [SUP]: los camiones que dejan de ir a Corabastos (el % de naves retiradas, por costado del predio) siguen desde ese
      costado hasta los mercados de barrio (repartidos por igual), por la ruta más corta para un camión (las vías locales cuestan
      1,6 veces su largo; las intermedias 1,15). En las vías del borde de Corabastos bajan los camiones en ese mismo %.
   4. Ruido de cada tramo antes y después: CoRTN, L10 a 10 m, 30 km/h (mínimo 20 veh/h para no exagerar en calles casi vacías). */
const fs = require('fs'), path = require('path');
const D = (p) => path.join(__dirname, '..', 'data3d', p), R = (p) => JSON.parse(fs.readFileSync(D(p), 'utf8'));
const LC = { x: 5341.33, y: 3161.9 }, ll2l = (lat, lng) => [LC.x + (lng + 74.153) * 110955, LC.y + (lat - 4.636) * 110540];
const N = R('net.json'), I = R('traf/index.json'), CO = R('corabastos.json'), ESC = R('escenarios.json'), PR = R('propuesta.json');
const POLY = CO.poly, RETIRO = ESC.corabastos.retiroNaves / 100;
const r1 = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const esCamion = (id) => ((id * 2654435761) >>> 0) / 4294967296 >= 0.92;
const cortn = (q, p, V = 30) => 42.2 + 10 * Math.log10(Math.max(q, 20)) + 33 * Math.log10(V + 40 + 500 / V) + 10 * Math.log10(1 + 5 * p / V) - 68.8;

/* ---------- grafo ---------- */
/* ---------- grafo: la red de calles de OpenStreetMap ya conectada en sus cruces (giro_sim.json, la misma de la sintaxis espacial) ---------- */
const GS_ = R('giro_sim.json'), OX = 2095.67, OZ = -109.06, aModelo = ([x, y]) => [x + OX + LC.x, LC.y - (y + OZ)];
const PT = GS_.nodos.map(aModelo);
const E = GS_.seg.filter(s => s.v).map((s, ie) => { const pts = s.p.map(aModelo); return { ie, j: s.j, cls: s.j >= 3 ? 'mid' : 'local', pts, L: s.L, a: s.a, b: s.b, q: new Set(), d: 0, si: s.i, sc: s.c, sk: s.k }; });
const ADJ = PT.map(() => []); for (const e of E) { ADJ[e.a].push(e); ADJ[e.b].push(e); }
const COSTO_J = [1.8, 1.8, 1.3, 1.1, 1, 1]; // residencial 1,8 · terciaria 1,3 · secundaria 1,1 · primaria y troncal 1 (un camión prefiere las vías principales)
function dijkstra(src) {
  const dist = new Float64Array(PT.length).fill(Infinity), prev = new Array(PT.length); dist[src] = 0; const H = [[0, src]];
  const push = (x) => { H.push(x); let i = H.length - 1; while (i) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const t = H[0], l = H.pop(); if (H.length) { H[0] = l; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < H.length && H[a][0] < H[m][0]) m = a; if (b < H.length && H[b][0] < H[m][0]) m = b; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return t; };
  while (H.length) { const [d, u] = pop(); if (d > dist[u]) continue; for (const e of ADJ[u]) { const v = e.a === u ? e.b : e.a, nd = d + e.L * COSTO_J[e.j]; if (nd < dist[v]) { dist[v] = nd; prev[v] = e; push([nd, v]); } } }
  return { dist, prev };
}
// componente principal (las rutas se buscan solo ahí)
const comp = new Int32Array(PT.length).fill(-1); let cMax = 0, nMax = 0;
const TAM = [];
for (let s = 0, c = 0; s < PT.length; s++) { if (comp[s] >= 0) continue; const st = [s]; comp[s] = c; let n = 0; while (st.length) { const u = st.pop(); n++; for (const e of ADJ[u]) { const v = e.a === u ? e.b : e.a; if (comp[v] < 0) { comp[v] = c; st.push(v); } } } TAM.push(n); if (n > nMax) { nMax = n; cMax = c; } c++; }
console.log('nodos', PT.length, 'componente mayor', nMax, 'componentes', TAM.length);
const cercanoNodo = (x, y, filtro) => { let b = -1, bd = Infinity; for (let i = 0; i < PT.length; i++) { if (comp[i] !== cMax || (filtro && !filtro(i))) continue; const d = Math.hypot(PT[i][0] - x, PT[i][1] - y); if (d < bd) { bd = d; b = i; } } return b; };

/* ---------- 1. flujo actual por tramo ---------- */
const CELV = new Map();
const CEL = 25, GS = new Map(); // índice de segmentos de los tramos
E.forEach(e => { for (let k = 1; k < e.pts.length; k++) { const [x0, y0] = e.pts[k - 1], [x1, y1] = e.pts[k]; for (let i = Math.floor(Math.min(x0, x1) / CEL) - 1; i <= Math.floor(Math.max(x0, x1) / CEL) + 1; i++) for (let j = Math.floor(Math.min(y0, y1) / CEL) - 1; j <= Math.floor(Math.max(y0, y1) / CEL) + 1; j++) { const g = i * 100003 + j; let L = GS.get(g); if (!L) GS.set(g, L = []); L.push([e, x0, y0, x1, y1]); } } });
const tramoEn = (x, y) => { const L = GS.get(Math.floor(x / CEL) * 100003 + Math.floor(y / CEL)); if (!L) return null; let b = null, bd = 10; for (const [e, x0, y0, x1, y1] of L) { const ex = x1 - x0, ey = y1 - y0, l2 = ex * ex + ey * ey || 1, t = Math.max(0, Math.min(1, ((x - x0) * ex + (y - y0) * ey) / l2)), d = Math.hypot(x - x0 - t * ex, y - y0 - t * ey); if (d < bd) { bd = d; b = e; } } return b; };
for (let k = 0; k < I.n; k++) {
  const b = fs.readFileSync(D('traf/c' + String(k).padStart(2, '0') + '.bin')), dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let o = 4; const ns = dv.getUint16(o, true); o += 2; o += 4; let prev = new Map();
  for (let s = 0; s < ns; s++) {
    const n = dv.getUint16(o, true); o += 2; const pid = o, pdx = o + 2 * n, pdy = o + 4 * n; o += 6 * n; const cur = new Map(); let id = 0;
    for (let i = 0; i < n; i++) { id += dv.getUint16(pid + 2 * i, true); const p = prev.get(id); const xi = p ? p[0] + dv.getInt16(pdx + 2 * i, true) : dv.getUint16(pdx + 2 * i, true), yi = p ? p[1] + dv.getInt16(pdy + 2 * i, true) : dv.getUint16(pdy + 2 * i, true); cur.set(id, [xi, yi]); if (s % 2) continue; { const k = Math.floor(xi / I.scale / 250) * 1000 + Math.floor(yi / I.scale / 250); CELV.set(k, (CELV.get(k) || 0) + 1); } const e = tramoEn(xi / I.scale, yi / I.scale); if (e) e.q.add(id); }
    prev = cur;
  }
}
const H = 3600 / I.NS; // CELV: celdas de 250 m donde la grabación SUMO tiene vehículos (fuera de ellas no hay tráfico simulado)
for (const e of E) { const L = [...e.q]; e.qh = L.length * H; e.ch = L.filter(esCamion).length * H; }

/* ---------- 2. mercados de barrio (como propuesta.js) ---------- */
const aMod = (n) => [n.x + LC.x, LC.y - n.z];
const tiendas = PR.nodos.filter(n => n.t === 'tienda').map(n => ({ n: n.n, p: aMod(n) })), burro = aMod(PR.nodos.find(n => n.n === 'Humedal El Burro'));
const dB = (p) => Math.hypot(p[0] - burro[0], p[1] - burro[1]);
const MERC = [tiendas.reduce((b, c) => dB(c.p) < dB(b.p) ? c : b, tiendas[0])];
while (MERC.length < 8) { let best = null, bd = -Infinity; for (const c of tiendas) { if (MERC.includes(c)) continue; const d = Math.min(...MERC.map(m => Math.hypot(c.p[0] - m.p[0], c.p[1] - m.p[1]))) - 0.25 * dB(c.p); if (d > bd) { bd = d; best = c; } } MERC.push(best); }

/* ---------- 3. ruta de la carga desplazada ---------- */
const dPoly = (x, y) => { let m = 1e9, q = null; for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) { const ax = POLY[j][0], ay = POLY[j][1], ex = POLY[i][0] - ax, ey = POLY[i][1] - ay, L = ex * ex + ey * ey; if (!L) continue; const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / L)), d = Math.hypot(x - ax - t * ex, y - ay - t * ey); if (d < m) { m = d; q = [ax + t * ex, ay + t * ey]; } } return [m, q]; };
const cx = POLY.reduce((s, p) => s + p[0], 0) / POLY.length, cy = POLY.reduce((s, p) => s + p[1], 0) / POLY.length;
const lado = (x, y) => { const a = Math.atan2(y - cy, x - cx) * 180 / Math.PI; return a > 45 && a <= 135 ? 'norte' : a > -45 && a <= 45 ? 'oriente' : a > -135 && a <= -45 ? 'sur' : 'occidente'; };
// borde: tramos a menos de 40 m del predio -> bajan sus camiones en el % retirado
const BORDE = new Set(); for (const e of E) { const m = e.pts[Math.floor(e.pts.length / 2)]; const [d] = dPoly(m[0], m[1]); if (d < 40) { BORDE.add(e); e.d -= e.ch * RETIRO; } }
const MN = MERC.map(m => cercanoNodo(m.p[0], m.p[1], i => ADJ[i].some(e => e.cls !== 'local') || true));
const SAL = []; // salida de cada costado: el nodo de vía principal o intermedia del borde con más camiones
for (const acc of ESC.corabastos.accesos) {
  const l = acc.n.replace('Borde ', ''); let best = -1, bc = -1;
  for (const e of BORDE) for (const u of [e.a, e.b]) { if (comp[u] !== cMax) continue; const [, q] = dPoly(PT[u][0], PT[u][1]); if (lado(q[0], q[1]) !== l) continue; const pts = e.ch + e.j * 1000; if (pts > bc) { bc = pts; best = u; } } // la vía de mayor jerarquía del costado (y con más camiones)
  if (best < 0) continue; const cam = acc.hoy.camH * RETIRO, rt = dijkstra(best);
  for (const v of MN) { if (v < 0 || !isFinite(rt.dist[v])) continue; let u = v; while (u !== best) { const e = rt.prev[u]; e.d += cam / MN.length; u = e.a === u ? e.b : e.a; } }
  SAL.push({ lado: l, p: PT[best].map(v => r1(v)), cam: r1(cam) });
}

/* ---------- 4. nombres de las calles (OpenStreetMap) y salida ---------- */
const OSM = JSON.parse(fs.readFileSync(path.join(__dirname, 'cache', 'kennedy_osm.json'), 'utf8'));
const NG = new Map();
for (const w of OSM.elements) { if (w.type !== 'way' || !w.tags || !w.tags.highway || !w.tags.name || !w.geometry) continue; for (const g of w.geometry) { const p = ll2l(g.lat, g.lon), k = Math.floor(p[0] / 40) * 100003 + Math.floor(p[1] / 40); let L = NG.get(k); if (!L) NG.set(k, L = []); L.push([p[0], p[1], w.tags.name]); } }
const nombre = (x, y) => { let b = null, bd = 45; const i0 = Math.floor(x / 40), j0 = Math.floor(y / 40); for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) for (const [px, py, n] of NG.get(i * 100003 + j) || []) { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; b = n; } } return b; };
const simple = (pts) => { const o = [pts[0]]; for (let k = 1; k < pts.length - 1; k++) if (Math.hypot(pts[k][0] - o[o.length - 1][0], pts[k][1] - o[o.length - 1][1]) > 6) o.push(pts[k]); o.push(pts[pts.length - 1]); return o.map(p => [r1(p[0]), r1(p[1])]); };
const T = E.filter(e => Math.abs(e.d) >= 0.3).map(e => { const m = e.pts[Math.floor(e.pts.length / 2)], q1 = Math.max(0, e.qh + e.d), c1 = Math.max(0, e.ch + e.d), p0 = e.qh ? e.ch / e.qh * 100 : 0, p1 = q1 ? c1 / q1 * 100 : 0;
  return { p: simple(e.pts), L: Math.round(e.L), d: r1(e.d), q: Math.round(e.qh), c: r1(e.ch), dB0: r1(cortn(e.qh, p0)), dB1: r1(cortn(q1, p1)), n: nombre(m[0], m[1]), cls: e.cls }; });
// resumen por calle con nombre
const porCalle = {}; for (const t of T) { const k = t.n || 'Calle sin nombre'; const o = porCalle[k] || (porCalle[k] = { n: k, L: 0, d: 0, dB: 0, w: 0 }); o.L += t.L; o.d = Math.abs(t.d) > Math.abs(o.d) ? t.d : o.d; o.dB += (t.dB1 - t.dB0) * t.L; o.w += t.L; }
const CALLES = Object.values(porCalle).map(o => ({ n: o.n, L: o.L, d: r1(o.d), ddB: r1(o.dB / o.w) })).sort((a, b) => b.d - a.d);
const km = (f) => r1(T.filter(f).reduce((s, t) => s + t.L, 0) / 1000, 2);
const out = {
  fuente: 'tools/carga_build.js · SUMO (data3d/traf), net.json, propuesta.json, corabastos.json, OpenStreetMap (nombres)',
  retiro: ESC.corabastos.retiroNaves, desplazadosH: r1(SAL.reduce((s, x) => s + x.cam, 0)),
  mercados: MERC.map((m, i) => ({ n: 'Mercado de barrio ' + (i + 1), p: m.p.map(v => r1(v)), calle: nombre(m.p[0], m.p[1]) })),
  salidas: SAL, kmAlivia: km(t => t.d < 0), kmCarga: km(t => t.d > 0),
  calles: CALLES.slice(0, 8).concat(CALLES.slice(-8).filter(c => c.d < 0)), tramos: T
};
/* ---------- 5. ¿la sintaxis espacial explica el tráfico? flujo SUMO de cada calle vs. su elección e integración angular ----------
   Solo calles vehiculares dentro de Kennedy (k = 1) con su largo > 20 m. Correlación de rangos de Spearman (no supone una relación lineal). */
const VS = E.filter(e => { if (!e.sk || e.L <= 20) return false; const m = e.pts[Math.floor(e.pts.length / 2)]; const k = Math.floor(m[0] / 250) * 1000 + Math.floor(m[1] / 250), n = (CELV.get(k) || 0) + (CELV.get(k + 1) || 0) + (CELV.get(k - 1) || 0) + (CELV.get(k + 1000) || 0) + (CELV.get(k - 1000) || 0); return n >= 2000; }); // dentro de Kennedy y bien adentro del área con tráfico simulado (la celda y sus vecinas con 2.000 muestras o más)
const rangos = (v) => { const o = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = new Array(v.length); for (let i = 0; i < o.length;) { let j = i; while (j + 1 < o.length && o[j + 1][0] === o[i][0]) j++; for (let k = i; k <= j; k++) r[o[k][1]] = (i + j) / 2; i = j + 1; } return r; };
const spearman = (a, b) => { const ra = rangos(a), rb = rangos(b), n = a.length, ma = (n - 1) / 2; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (ra[i] - ma) * (rb[i] - ma); saa += (ra[i] - ma) ** 2; sbb += (rb[i] - ma) ** 2; } return sab / Math.sqrt(saa * sbb); };
const q = VS.map(e => e.qh);
const BINS = Array.from({ length: 10 }, (_, k) => { const L = VS.filter(e => e.sc >= k / 10 && (e.sc < (k + 1) / 10 || k === 9)).map(e => e.qh).sort((a, b) => a - b); const p = (f) => L.length ? L[Math.min(L.length - 1, Math.floor(f * L.length))] : 0; return { c: (k + 0.5) / 10, n: L.length, q25: Math.round(p(0.25)), q50: Math.round(p(0.5)), q75: Math.round(p(0.75)), con: r1(L.filter(x => x > 0).length / Math.max(1, L.length) * 100) }; });
// anomalías: mucho tráfico con poca elección (lo que la forma de la red no explica: destinos como Corabastos) y al revés
const conNombre = VS.map(e => { const m = e.pts[Math.floor(e.pts.length / 2)]; return { e, n: null, m }; });
const anom = (f, orden) => { const L = conNombre.filter(x => f(x.e)).sort(orden).slice(0, 40); const vistos = new Set(), o = []; for (const x of L) { const n = nombre(x.m[0], x.m[1]); if (!n || vistos.has(n)) continue; vistos.add(n); o.push({ n, c: r1(x.e.sc, 2), q: Math.round(x.e.qh), p: x.m.map(v => r1(v)) }); if (o.length >= 4) break; } return o; };
const PUNTOS = VS.filter((e, i) => e.qh > 0 || i % 4 === 0).map(e => [r1(e.sc, 3), Math.round(e.qh), e.j]);
out.sintaxisTrafico = {
  n: VS.length, rhoC: r1(spearman(VS.map(e => e.sc), q), 2), rhoI: r1(spearman(VS.map(e => e.si), q), 2), bins: BINS, puntos: PUNTOS,
  masDeLoEsperado: anom(e => e.sc < 0.5 && e.qh > 300, (a, b) => b.e.qh - a.e.qh),
  menosDeLoEsperado: anom(e => e.sc > 0.9 && e.qh < 20, (a, b) => b.e.sc - a.e.sc)
};fs.writeFileSync(D('carga.json'), JSON.stringify(out));
console.log(JSON.stringify({ ...out, tramos: out.tramos.length }, null, 1));

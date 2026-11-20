/* Indicadores para comparar KENNEDY HOY con KENNEDY CON EL PROYECTO (mismos lugares, mismo periodo) -> data3d/escenarios.json
   Uso: node tools/escenarios_build.js
   1. Corabastos (tráfico): la grabación SUMO (data3d/traf, 1.500 s de hora pico) se recorre completa. Se cuentan los vehículos que
      entran o salen del predio de Corabastos y por dónde (accesos = grupos de cruces del borde), y los que pasan a menos de 30 m de
      cada acceso. Camión = el mismo reparto por id que usa el simulador (8 %). Se lleva a vehículos por hora (x 3600/1500).
      Proyecto [SUP]: Corabastos reducido quita las naves a menos de 120 m del humedal La Vaca (corabastos_plan.js); los viajes de
      camión al predio bajan en la misma proporción que el área de naves retirada (18,7 %), y esa carga pasa a los mercados de barrio.
      Ruido: CoRTN (Calculation of Road Traffic Noise, UK DoT 1988), L10 a 10 m de la vía, a 30 km/h, con el flujo y el % de pesados.
   2. Sintaxis espacial: Bavaria Común, antes y después de los 25 pasajes (bavaria_pres.json, tools/bavaria_pres_datos.py: integración
      angular, 1.500 orígenes, los mismos en las dos corridas).
   3. Hábitat de polinizadores: % de Kennedy a menos de 200 m de un recurso floral [SUP: radio de forrajeo de abejas solitarias].
      Hoy: humedales, parques y el bosque de Bavaria. Proyecto: además huertas de E8 (lotes baldíos y cubiertas), bancales y techos
      productivos de Bavaria y la franja restaurada de Corabastos (naves retiradas). */
const fs = require('fs'), path = require('path');
const R = (p) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data3d', p), 'utf8'));
const OX = 2095.67, OZ = -109.06, LC = { x: 5341.33, y: 3161.9 };
const giroAModelo = ([x, y]) => [x + OX + LC.x, LC.y - (y + OZ)];
const dentro = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
const area = (P) => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return Math.abs(a / 2); };
const r1 = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/* ---------- 1. tráfico en los accesos de Corabastos ---------- */
const I = R('traf/index.json'), CO = R('corabastos.json'), POLY = CO.poly;
const esCamion = (id) => ((id * 2654435761) >>> 0) / 4294967296 >= 0.92; // mismo reparto que index.html (70 % carros, 22 % motos, 8 % camiones)
// la grabación SUMO no trae origen ni destino (solo 22 de 4.202 vehículos empiezan junto al predio): se mide el flujo que pasa por las
// vías del borde de Corabastos (a menos de 40 m del predio), por costado, que es donde se carga y descarga hoy
const dB = (x, y) => { let m = 1e9, q = null; for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) { const ax = POLY[j][0], ay = POLY[j][1], ex = POLY[i][0] - ax, ey = POLY[i][1] - ay, L = ex * ex + ey * ey; if (!L) continue; const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / L)), d = Math.hypot(x - ax - t * ex, y - ay - t * ey); if (d < m) { m = d; q = [ax + t * ex, ay + t * ey]; } } return [m, q]; };
const cx = POLY.reduce((s, p) => s + p[0], 0) / POLY.length, cy = POLY.reduce((s, p) => s + p[1], 0) / POLY.length;
const lado = (x, y) => { const a = Math.atan2(y - cy, x - cx) * 180 / Math.PI; return a > 45 && a <= 135 ? 'norte' : a > -45 && a <= 45 ? 'oriente' : a > -135 && a <= -45 ? 'sur' : 'occidente'; };
const porLado = {}; // lado -> Set de ids
for (let k = 0; k < I.n; k++) {
  const b = fs.readFileSync(path.join(__dirname, '..', 'data3d', 'traf', 'c' + String(k).padStart(2, '0') + '.bin')), dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let o = 4; const ns = dv.getUint16(o, true); o += 2; o += 4; let prev = new Map();
  for (let s = 0; s < ns; s++) {
    const n = dv.getUint16(o, true); o += 2; const pid = o, pdx = o + 2 * n, pdy = o + 4 * n; o += 6 * n; const cur = new Map(); let id = 0;
    for (let i = 0; i < n; i++) {
      id += dv.getUint16(pid + 2 * i, true); const p = prev.get(id);
      const xi = p ? p[0] + dv.getInt16(pdx + 2 * i, true) : dv.getUint16(pdx + 2 * i, true), yi = p ? p[1] + dv.getInt16(pdy + 2 * i, true) : dv.getUint16(pdy + 2 * i, true);
      cur.set(id, [xi, yi]); if (s % 2) continue;
      const x = xi / I.scale, y = yi / I.scale; if (Math.abs(x - cx) > 700 || Math.abs(y - cy) > 600) continue;
      const [d, q] = dB(x, y); if (d < 40) { const l = lado(q[0], q[1]); (porLado[l] = porLado[l] || new Set()).add(id); }
    }
    prev = cur;
  }
}
const H = 3600 / I.NS; // a vehículos por hora
const RETIRO = (() => { const fuera = CO.naves.filter(n => n.dh < 120), a = (L) => L.reduce((s, n) => s + n.L * n.W, 0); return a(fuera) / a(CO.naves); })();
const cortn = (q, p, V = 30) => 42.2 + 10 * Math.log10(Math.max(q, 1)) + 33 * Math.log10(V + 40 + 500 / V) + 10 * Math.log10(1 + 5 * p / V) - 68.8; // p en %
const cruces = { length: Object.values(porLado).reduce((s, L) => s + L.size, 0) };
const ACC = ['norte', 'oriente', 'sur', 'occidente'].filter(l => porLado[l]).map(l => {
  const L = [...porLado[l]], cam = L.filter(esCamion).length, q = L.length * H, qc = cam * H, qcP = qc * (1 - RETIRO), qP = q - qc * RETIRO;
  return { n: 'Borde ' + l, hoy: { flujoH: Math.round(q), camH: Math.round(qc), pesados: r1(qc / q * 100), dB: r1(cortn(q, qc / q * 100)) },
    proyecto: { flujoH: Math.round(qP), camH: Math.round(qcP), pesados: r1(qcP / qP * 100), dB: r1(cortn(qP, qcP / qP * 100)) } };
});// nombres únicos (dos accesos al mismo lado)
const vistos = {}; for (const a of ACC) { vistos[a.n] = (vistos[a.n] || 0) + 1; if (vistos[a.n] > 1) a.n += ' ' + vistos[a.n]; }

/* ---------- 2. sintaxis espacial de Bavaria Común ---------- */
const BP = R('bavaria_pres.json'), SX = BP.resumen;

/* ---------- 3. hábitat de polinizadores ---------- */
const G = R('giro_sim.json'), LIM = G.limite.map(giroAModelo);
const fuentesHoy = [], fuentesPro = [];
const muestrear = (P, L, paso = 25) => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } let n = 0; for (let x = x0; x <= x1; x += paso) for (let y = y0; y <= y1; y += paso) if (dentro(x, y, P)) { L.push([x, y]); n++; } if (!n) L.push([(x0 + x1) / 2, (y0 + y1) / 2]); for (const p of P) L.push(p); };
for (const h of G.humedales) muestrear(h.poly.map(giroAModelo), fuentesHoy);
const PQ = R('parques.json').filter(p => p.pts && p.pts.length > 2 && area(p.pts) > 300);
for (const p of PQ) muestrear(p.pts, fuentesHoy);
const BV = R('bavaria.json'); muestrear(BV.sitio, fuentesHoy); // el bosque de Bavaria ya existe
const E = R('estrategias.json'), E8 = E.estrategias.find(e => e.id === 'E8');
const anillo = (f) => { const P = []; for (let i = 0; i + 1 < f.length; i += 2) P.push([f[i] / 2, f[i + 1] / 2]); return P; };
let m2E8lotes = 0, m2E8techos = 0, nTechos = 0;
for (const c of E8.capas) {
  for (const l of c.lotes) { const P = anillo(l); if (P.length < 3) continue; if (/bald/i.test(c.n)) { muestrear(P, fuentesPro); m2E8lotes += area(P); } }
  for (const t of c.techos) { const P = anillo(t.slice(0, t.length - 1)); if (P.length < 3) continue; const a = area(P); m2E8techos += a; nTechos++; fuentesPro.push([P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length]); }
}
for (const b of BP.bancales) fuentesPro.push([b[0], b[1]]);
for (const t of BP.techos) fuentesPro.push([t.reduce((s, p) => s + p[0], 0) / t.length, t.reduce((s, p) => s + p[1], 0) / t.length]);
for (const n of CO.naves.filter(n => n.dh < 120)) fuentesPro.push(n.c);
const RAD = 200, CEL = 100, idx = (L) => { const M = new Map(); for (const p of L) { const k = Math.floor(p[0] / CEL) + ',' + Math.floor(p[1] / CEL); if (!M.has(k)) M.set(k, []); M.get(k).push(p); } return M; };
const cubre = (M, x, y) => { const i0 = Math.floor(x / CEL), j0 = Math.floor(y / CEL); for (let i = i0 - 2; i <= i0 + 2; i++) for (let j = j0 - 2; j <= j0 + 2; j++) { const L = M.get(i + ',' + j); if (L) for (const p of L) if ((p[0] - x) ** 2 + (p[1] - y) ** 2 < RAD * RAD) return true; } return false; };
const MH = idx(fuentesHoy), MP = idx(fuentesHoy.concat(fuentesPro));
let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of LIM) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
let tot = 0, ch = 0, cp = 0; for (let x = x0; x <= x1; x += 50) for (let y = y0; y <= y1; y += 50) { if (!dentro(x, y, LIM)) continue; tot++; if (cubre(MH, x, y)) ch++; if (cubre(MP, x, y)) cp++; }
const m2Bav = BP.bancales.length * 12 + 26098; // 1.187 bancales de 12 m² (14.244 m²) + 26.098 m² de techos productivos (bavaria_pres.json)

const out = {
  fuente: 'tools/escenarios_build.js · SUMO (data3d/traf), corabastos.json, bavaria_pres.json, giro_sim.json, parques.json, estrategias.json',
  periodo: 'Hora pico de la mañana (grabación SUMO de 1.500 s llevada a 1 hora)',
  corabastos: { retiroNaves: r1(RETIRO * 100), accesos: ACC, cruces: cruces.length },
  sintaxis: { antes: SX.antes_600m, despues: SX.despues_600m, pasajes_m: BP.pasajes_m || 5419 },
  polinizadores: { radio: RAD, hoy: r1(ch / tot * 100), proyecto: r1(cp / tot * 100), m2Hoy: 0, m2Proyecto: Math.round(m2E8lotes + m2E8techos + m2Bav), techos: nTechos, m2E8lotes: Math.round(m2E8lotes), m2E8techos: Math.round(m2E8techos), m2Bav }
};
fs.writeFileSync(path.join(__dirname, '..', 'data3d', 'escenarios.json'), JSON.stringify(out));
console.log(JSON.stringify(out, null, 1).slice(0, 3000));

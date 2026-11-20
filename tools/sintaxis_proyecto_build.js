/* Sintaxis espacial CON LA PROPUESTA para las calles del simulador -> data3d/sintaxis_proyecto.json
   Uso: node tools/sintaxis_proyecto_build.js
   bavaria_sx.json (tools/bavaria_pres_datos.py) trae TODA la red de Kennedy con el análisis angular antes (a) y después (b) de abrir los
   25 pasajes de Bavaria Común: [integración global, integración R800, elección]. Cada calle de giro_sim.json (i, c en percentil 0-1)
   toma el cambio de percentil de su tramo equivalente en bavaria_sx (mismo punto medio a menos de 12 m y misma dirección):
     iP = i + (pct(b0) - pct(a0)), cP = c + (pct(b2) - pct(a2)), con los percentiles medidos sobre la red de hoy (a).
   Los pasajes nuevos (n = 1) salen como calles nuevas con su percentil después. Solo se guardan las calles que cambian. */
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '..', 'data3d'), R = (f) => JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
const OX = 2095.67, OZ = -109.06, LC = { x: 5341.33, y: 3161.9 };
const aModelo = ([x, y]) => [x + OX + LC.x, LC.y - (y + OZ)], aGiro = ([X, Y]) => [X - OX - LC.x, LC.y - Y - OZ];
const G = R('giro_sim.json'), SX = R('bavaria_sx.json').seg;
const conA = SX.filter(s => s.a), orden = [0, 1, 2].map(k => conA.map(s => s.a[k]).sort((a, b) => a - b));
const pct = (v, k) => { const A = orden[k]; let lo = 0, hi = A.length; while (lo < hi) { const m = (lo + hi) >> 1; if (A[m] <= v) lo = m + 1; else hi = m; } return lo / A.length; };
const medio = (P) => { let L = 0; const acc = [0]; for (let i = 1; i < P.length; i++) acc.push(L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); const h = L / 2; let i = 1; while (i < P.length - 1 && acc[i] < h) i++; const f = (h - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1); return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f]; };
const dir = (P) => { const a = P[0], b = P[P.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
// índice de los tramos de bavaria_sx por celda de 25 m
const CEL = 25, IDX = new Map();
for (const s of conA) { s.m = medio(s.p); s.u = dir(s.p); const k = Math.floor(s.m[0] / CEL) + ',' + Math.floor(s.m[1] / CEL); if (!IDX.has(k)) IDX.set(k, []); IDX.get(k).push(s); }
const cambios = []; let emparejadas = 0;
G.seg.forEach((g, i) => {
  const P = g.p.map(aModelo), m = medio(P), u = dir(P), cx = Math.floor(m[0] / CEL), cy = Math.floor(m[1] / CEL);
  let mejor = null, dm = 12;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const s of IDX.get((cx + a) + ',' + (cy + b)) || []) {
    if (Math.abs(u[0] * s.u[0] + u[1] * s.u[1]) < 0.8) continue; const d = Math.hypot(s.m[0] - m[0], s.m[1] - m[1]); if (d < dm) { dm = d; mejor = s; } }
  if (!mejor) return; emparejadas++;
  const dI = pct(mejor.b[0], 0) - pct(mejor.a[0], 0), dC = pct(mejor.b[2], 2) - pct(mejor.a[2], 2);
  if (Math.abs(dI) < 0.002 && Math.abs(dC) < 0.002) return;
  const cl = (v) => Math.round(Math.max(0, Math.min(1, v)) * 1000) / 1000;
  cambios.push([i, cl(g.i + dI), cl(g.c + dC)]);
});
const nuevos = SX.filter(s => s.n).map(s => ({ p: s.p.map(aGiro).map(q => q.map(v => Math.round(v))), i: Math.round(pct(s.b[0], 0) * 1000) / 1000, c: Math.round(pct(s.b[2], 2) * 1000) / 1000 }));
const out = { fuente: 'tools/sintaxis_proyecto_build.js · bavaria_sx.json (análisis angular antes y después de los pasajes de Bavaria Común) sobre giro_sim.json', cambios, nuevos };
fs.writeFileSync(path.join(D, 'sintaxis_proyecto.json'), JSON.stringify(out));
const sube = cambios.filter(c => c[1] > G.seg[c[0]].i).length;
console.log({ calles: G.seg.length, emparejadas, cambian: cambios.length, suben_integracion: sube, nuevos: nuevos.length, kb: Math.round(fs.statSync(path.join(D, 'sintaxis_proyecto.json')).size / 1024) });

/* ============ INDICADORES EN 3D (los picos de https://anasoficasca-code.github.io/picos/) ============
   Cada indicador es una superficie de picos sobre Kennedy: más alto y más intenso = valor más alto (0 a 1), con la rampa de color
   de las láminas. Datos: data3d/indicadores/*.json (tools/indicadores_extraer.js). Marco de picos (x este, y norte, m) ->
   mundo del simulador: giro de -28,1° y desplazamiento (1692, -588), alineado con 409 de 446 edificios altos. Botón "Indicadores": empieza apagado. */
export async function crearIndicadores({ THREE, T3 }) {
  const I = await (await fetch('data3d/indicadores/index.json?v=2')).json();
  const g = new THREE.Group(); g.name = 'indicadores'; g.visible = false; T3.scene.add(g);
  const dec = (b) => { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const mallas = new Map(); let alto = 0.3, sel = null, anio = false;
  async function malla(f) {
    if (mallas.has(f)) return mallas.get(f);
    const d = await (await fetch('data3d/indicadores/' + f + '?v=1')).json();
    const q = new Uint16Array(dec(d.pos).buffer), n = d.nV, [x0, x1, y0, y1, zlo, zhi] = d.b, zs = zhi - zlo;
    const pos = new Float32Array(n * 3), z = new Float32Array(n);
    const ra = (I.rot || 0) * Math.PI / 180, cs = Math.cos(ra), sn = Math.sin(ra); /* la lámina está girada respecto al norte */
    for (let k = 0; k < n; k++) { const x = x0 + q[k * 3] / 65535 * (x1 - x0), zz = -(y0 + q[k * 3 + 1] / 65535 * (y1 - y0)); pos[k * 3] = x * cs - zz * sn + I.ox; pos[k * 3 + 2] = x * sn + zz * cs + I.oz; z[k] = q[k * 3 + 2] / 65535 * zs; }
    const cu = dec(d.col), qi = new Uint16Array(dec(d.idx).buffer), idx = new Uint32Array(d.nF * 6);
    for (let f2 = 0; f2 < d.nF; f2++) { const a = qi[f2 * 4], b = qi[f2 * 4 + 1], c = qi[f2 * 4 + 2], e = qi[f2 * 4 + 3]; idx.set([a, c, b, a, e, c], f2 * 6); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const col = new Float32Array(n * 3); for (let k = 0; k < n * 3; k++) col[k] = Math.pow(cu[k] / 255, 2.2); /* rampa de las láminas (sRGB -> lineal) */
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.9, emissive: 0xffffff, emissiveIntensity: 0, toneMapped: false }));
    /* sombreado suave: color propio + algo de luz del sol para leer el relieve */
    m.material.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = mix(diffuseColor.rgb, outgoingLight, 0.45);\n#include <opaque_fragment>'); };
    m.frustumCulled = false; m.renderOrder = 3; m.userData = { z, d };
    const M = { mesh: m, d, z, z0: z.slice(), zP: z.slice(), col0: col.slice(), zs, pos, code: f.replace(/(_2020)?\.json$/, ''), ramp: (I.lista.find(x => x.f === f) || {}).ramp }; mallas.set(f, M); return M;
  }
  function elevar(M) {
    const p = M.mesh.geometry.attributes.position.array, z = M.z, base = (T3.viaY != null ? T3.viaY : 0.6) + 2;
    for (let k = 0; k < z.length; k++) p[k * 3 + 1] = base + z[k] * alto;
    M.mesh.geometry.attributes.position.needsUpdate = true; M.mesh.geometry.computeVertexNormals(); M.mesh.geometry.computeBoundingSphere();
  }

  /* ---------- CON LA PROPUESTA: cada indicador cambia donde actúa la propuesta ----------
     [SUP] modelo espacial para discutir con el grupo (no viene de las láminas): las láminas son «Kennedy hoy»; con la propuesta el valor de cada punto
     se corrige según su cercanía a lo que cambia:
       · Corabastos descentralizado (los mismos % de carros y camiones de los sliders del flujo de carros, data3d/alivio_cali.js): baja PM, PA, EPO, CV y CCL
       · Bavaria Común (logística y conocimiento nuevos): sube CCL y CO
       · Árboles nuevos de la propuesta, contados uno por uno (rejilla de cobertura, abajo): sube SE; bajan IC, PA y EPO
       · Techos verdes (huertas en cubiertas abiertas) y lagunas del parque humedal de Corabastos: bajan IC, suben un poco SE
       · Comercio repartido: baja CCL en Corabastos, se achatan sus picos y aparecen centros medios en los 8 mercados de barrio, Bavaria Común y las huertas
       · Huertas (juntas que las cuidan): suben OC */
  const CORA = [1132.1, 948.6], BAV = [3966, 49];
  const lw = (x, y) => [x - 5341.33, 3161.9 - y]; // marco «modelo» (x este, y norte) -> mundo: el mismo de index.html y data3d/escenario.js
  const caida = (d, r0, r1) => d <= r0 ? 1 : d >= r1 ? 0 : 1 - (d - r0) / (r1 - r0);
  let HUERTA = [], MERCADOS = [], PARCHES = null;
  fetch('data3d/huertas_barrio.json?v=3').then(r => r.json()).then(D => { HUERTA = (D.huertas || []).map(h => h.c || (h.m && h.m.length ? [h.m.reduce((s, q) => s + q.c[0], 0) / h.m.length, h.m.reduce((s, q) => s + q.c[1], 0) / h.m.length] : null)).filter(Boolean); }).catch(() => {});
  let KMERC = null; // los 8 mercados de barrio que reciben la carga de Corabastos (marco del modelo); se pasan al mundo cuando T3.lw existe
  const mercadosMundo = () => { if (MERCADOS.length || !KMERC) return; const f = typeof T3.lw === 'function' ? T3.lw : lw; MERCADOS = KMERC.map(m => f(m.p[0], m.p[1])); };
  fetch('data3d/carga.json?v=1').then(r => r.json()).then(K => { KMERC = K.mercados || []; mercadosMundo(); }).catch(() => {});
  const leerParches = () => import('./parches_arboles.js?v=7').then(m => { const P = m.parchesCalculados(); if (P) PARCHES = P; return !!P; }).catch(() => false);
  const cerca = (L, x, z, r0, r1) => { let w = 0; for (const c of L) { const dx = c[0] - x, dz = c[1] - z; if (Math.abs(dx) > r1 || Math.abs(dz) > r1) continue; const v = caida(Math.hypot(dx, dz), r0, r1); if (v > w) w = v; } return w; };
  const reduccion = () => { const A = T3.alivio, M = A && A.manual; if (!A) return { car: 0.4, cam: 0.7 }; return { car: 1 - (M ? M.keep : 1) * A.KEEP, cam: 1 - (M ? M.keepCam : 1) * A.KEEP_CAM }; }; // sliders de Corabastos × dependencia del escenario

  /* ---------- COBERTURA DE ÁRBOLES NUEVOS: una rejilla con cada árbol de la propuesta ----------
     Se cuentan (si ya están cargados): los árboles de los parches nativos (data3d/parches_arboles.js, solo los que deja ver el slider «Densidad de
     árboles»: clave k < densidad), los del parque humedal de Corabastos y sus lagunas (data3d/corabastos_parque.js) y las cubiertas con huerta abiertas
     (data3d/huertas_hidro.js, orden <= fracción abierta). Cada cosa cae en una celda de CEL m; luego cada celda suma sus vecinas a menos de RAD m con
     caída suave (1 − (d/RAD)²)² y se satura: cobertura = 1 − e^(−suma/S0) -> 0 = sin árboles nuevos cerca, ~0,85 = en medio de un parche denso.
     Cada vértice de la lámina lee su celda (interpolación bilineal): no recorre los árboles. La rejilla se rehace solo si cambia lo que cuenta.
     [SUP] equivalencias para discutir con el grupo: un parche nativo tiene ~30-40 árboles en ~60 m -> suma ≈ 25-30 (S0 = 15 -> cobertura ≈ 0,85);
     una celda de laguna (40 × 40 m de agua) enfría como 10 árboles; para los techos verdes S0 = 6 (unas 6 cubiertas abiertas a menos de 150 m -> 0,63). */
  const CEL = 40, RAD = 150, S0A = 15, S0T = 6, AGUA_CEL = 10;
  const kA = (t) => { const h = Math.sin(t.x * 12.9898 + t.z * 78.233) * 43758.5453; return h - Math.floor(h); }; // la misma clave de densidad de parches_arboles.js
  const dentroP = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
  let CAMPO = null;
  function campo() {
    const KP = window.KEN_PARCHES, dens = KP && KP.dens != null ? KP.dens : 1, PC = window.KEN_PCORA, H = window.KEN_HIDRO;
    const arb = [], techo = [];
    if (PARCHES) for (const p of PARCHES) for (const t of p.arboles) if ((t.k != null ? t.k : kA(t)) < dens) arb.push(t.x, t.z);
    const nParches = arb.length / 2;
    if (PC && PC.listaArboles) for (const t of PC.listaArboles) arb.push(t.x, t.z);
    const lagunas = PC && PC.parques ? PC.parques.map(p => p.laguna).filter(Boolean) : [];
    if (H && H.centros) { const f = H.frac != null ? H.frac : 1; for (const [c, o] of H.centros()) if (c && o <= f) techo.push(c[0], c[2]); }
    const clave = arb.length + '|' + techo.length + '|' + lagunas.length;
    if (CAMPO && CAMPO.clave === clave) return CAMPO;
    // extensión: todo lo que cuenta, más el radio
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; const ext = (x, z) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; };
    for (let i = 0; i < arb.length; i += 2) ext(arb[i], arb[i + 1]); for (let i = 0; i < techo.length; i += 2) ext(techo[i], techo[i + 1]); for (const L of lagunas) for (const q of L) ext(q[0], q[1]);
    if (x0 > x1) { CAMPO = { clave, vacio: true, arboles: 0, techos: 0 }; return CAMPO; }
    x0 -= RAD + CEL; z0 -= RAD + CEL; x1 += RAD + CEL; z1 += RAD + CEL;
    const nx = Math.ceil((x1 - x0) / CEL) + 1, nz = Math.ceil((z1 - z0) / CEL) + 1, N = nx * nz;
    const rA = new Float32Array(N), rW = new Float32Array(N), rT = new Float32Array(N), cel = (x, z) => Math.floor((z - z0) / CEL) * nx + Math.floor((x - x0) / CEL);
    for (let i = 0; i < arb.length; i += 2) rA[cel(arb[i], arb[i + 1])] += 1;
    for (let i = 0; i < techo.length; i += 2) rT[cel(techo[i], techo[i + 1])] += 1;
    for (const L of lagunas) { let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const q of L) { a0 = Math.min(a0, q[0]); a1 = Math.max(a1, q[0]); b0 = Math.min(b0, q[1]); b1 = Math.max(b1, q[1]); }
      for (let j = Math.floor((b0 - z0) / CEL); j <= Math.floor((b1 - z0) / CEL); j++) for (let i = Math.floor((a0 - x0) / CEL); i <= Math.floor((a1 - x0) / CEL); i++)
        if (dentroP(L, x0 + (i + 0.5) * CEL, z0 + (j + 0.5) * CEL)) rW[j * nx + i] += AGUA_CEL; }
    // suavizado: cada celda con algo reparte a sus vecinas a menos de RAD (se recorren solo las celdas ocupadas)
    const R = Math.floor(RAD / CEL), K = []; for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) { const d = Math.hypot(di, dj) * CEL; if (d < RAD) K.push(di, dj, (1 - (d / RAD) ** 2) ** 2); }
    const sA = new Float32Array(N), sW = new Float32Array(N), sT = new Float32Array(N);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const c = j * nx + i, a = rA[c], w = rW[c], t = rT[c]; if (!a && !w && !t) continue;
      for (let q = 0; q < K.length; q += 3) { const ii = i + K[q], jj = j + K[q + 1]; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const e = jj * nx + ii, f = K[q + 2]; sA[e] += a * f; sW[e] += w * f; sT[e] += t * f; } }
    // coberturas saturadas: árboles solos (aire, exposición), árboles + agua (calor), árboles + media agua (soporte ecológico), techos verdes
    const cAr = new Float32Array(N), cI = new Float32Array(N), cS = new Float32Array(N), cT = new Float32Array(N);
    for (let c = 0; c < N; c++) { cAr[c] = 1 - Math.exp(-sA[c] / S0A); cI[c] = 1 - Math.exp(-(sA[c] + sW[c]) / S0A); cS[c] = 1 - Math.exp(-(sA[c] + 0.5 * sW[c]) / S0A); cT[c] = 1 - Math.exp(-sT[c] / S0T); }
    CAMPO = { clave, x0, z0, nx, nz, cAr, cI, cS, cT, arboles: arb.length / 2, deParches: nParches, techos: techo.length / 2 };
    return CAMPO;
  }
  // lectura bilineal de una capa de la rejilla en (x, z) del mundo
  const leer = (F, A, x, z) => { if (F.vacio) return 0; const fx = (x - F.x0) / CEL - 0.5, fz = (z - F.z0) / CEL - 0.5, i = Math.floor(fx), j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= F.nx - 1 || j >= F.nz - 1) return 0; const u = fx - i, v = fz - j, c = j * F.nx + i;
    return (A[c] * (1 - u) + A[c + 1] * u) * (1 - v) + (A[c + F.nx] * (1 - u) + A[c + F.nx + 1] * u) * v; };

  /* [SUP] MAGNITUDES (fracción del valor de la lámina; cA = cobertura de árboles nuevos, cI = árboles + lagunas, cT = techos verdes, de 0 a 1):
       SE  soporte ecológico     sube  60 % de lo que le falta para 1 con cobertura plena (árboles + media laguna), + 15 % con techos verdes, + 20 % junto a huertas
       IC  islas de calor        baja  40 % con árboles y lagunas, 20 % con techos verdes, 10 % junto a huertas (nunca más del 60 % en total)
       PA  presión sobre el aire baja  15 % con árboles, 3 % con techos verdes (además de lo que baja el tráfico de Corabastos: hasta 60 % × % carros)
       EPO exposición            baja  10 % con árboles (además del tráfico de Corabastos: hasta 45 % × % carros)
       CCL comercio y logística  Corabastos: −95 % × % de camiones que ya no llegan (cerca de la central); el exceso sobre la media de la lámina se
                                 achata (15 % + 35 % × % camiones: ~40 % con los valores por defecto); y sube hacia un nivel medio en los centros
                                 nuevos: Bavaria Común (hasta 0,62), los 8 mercados de barrio (hasta 0,55, radio ~450 m) y las huertas (hasta 0,42, radio ~220 m) */
  function calcularPropuesta(M) {
    mercadosMundo();
    const t0 = performance.now(), n = M.z0.length, Z = M.zP, r = reduccion(), c = M.code, zs = M.zs || 1;
    const verde = c === 'SE' || c === 'IC' || c === 'PA' || c === 'EPO', F = verde ? campo() : null;
    if (c === 'CCL' && M.media == null) { let s = 0; for (let k = 0; k < n; k++) s += M.z0[k]; M.media = s / n / zs; }
    const kR = Math.min(1, 0.4 + r.cam); // los mercados nuevos crecen con la carga que deja de ir a Corabastos
    for (let k = 0; k < n; k++) {
      const x = M.pos[k * 3], z = M.pos[k * 3 + 2], v = M.z0[k] / zs;
      const wC = caida(Math.hypot(x - CORA[0], z - CORA[1]), 600, 2600), wB = caida(Math.hypot(x - BAV[0], z - BAV[1]), 400, 1600);
      let u = v;
      if (c === 'PM') u = v * (1 - 0.9 * r.car * wC);
      else if (c === 'PA') { const a = leer(F, F.cAr, x, z), t = leer(F, F.cT, x, z); u = v * (1 - 0.6 * r.car * wC) * (1 - 0.15 * a - 0.03 * t); }
      else if (c === 'EPO') u = v * (1 - 0.45 * r.car * wC) * (1 - 0.1 * leer(F, F.cAr, x, z));
      else if (c === 'CV') u = v * (1 - 0.55 * r.cam * wC);
      else if (c === 'CCL') {
        u = v * (1 - 0.95 * r.cam * wC); // Corabastos descentralizado
        const md = M.media, ach = 0.15 + 0.35 * r.cam; if (u > md) u = md + (u - md) * (1 - ach); // los picos rojos se achatan hacia la media
        const sube = (meta, w) => { if (w > 0 && u < meta) u += (meta - u) * w; };
        sube(0.62, 0.85 * wB); sube(0.55, 0.8 * kR * cerca(MERCADOS, x, z, 60, 450)); sube(0.42, 0.6 * kR * cerca(HUERTA, x, z, 30, 220));
      }
      else if (c === 'IC') { const a = leer(F, F.cI, x, z), t = leer(F, F.cT, x, z), h = cerca(HUERTA, x, z, 40, 300); u = v * Math.max(0.4, 1 - 0.4 * a - 0.2 * t - 0.1 * h); }
      else if (c === 'SE') { const a = leer(F, F.cS, x, z), t = leer(F, F.cT, x, z), h = cerca(HUERTA, x, z, 40, 300); u = v + (1 - v) * Math.min(1, 0.6 * a + 0.15 * t + 0.2 * h); }
      else if (c === 'OC') u = v + (1 - v) * 0.45 * cerca(HUERTA, x, z, 80, 600);
      else if (c === 'CO') u = v + (1 - v) * 0.5 * wB;
      Z[k] = Math.max(0, Math.min(1, u)) * zs;
    }
    M.ms = performance.now() - t0; api.ultimoCalculo = { code: c, vertices: n, ms: +M.ms.toFixed(1) };
  }
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)].map(q => Math.pow(q / 255, 2.2));
  function colorear(M, pro) { // el color sigue al valor nuevo con la misma rampa de la lámina
    const col = M.mesh.geometry.attributes.color.array;
    if (!pro || !M.ramp) { col.set(M.col0); M.mesh.geometry.attributes.color.needsUpdate = true; return; }
    const R = M.ramp.map(hex), n = M.z.length;
    for (let k = 0; k < n; k++) { const d = M.z[k] - M.z0[k]; if (Math.abs(d) < 1e-4 * (M.zs || 1)) { col[k * 3] = M.col0[k * 3]; col[k * 3 + 1] = M.col0[k * 3 + 1]; col[k * 3 + 2] = M.col0[k * 3 + 2]; continue; }
      const t = Math.max(0, Math.min(0.9999, M.z[k] / (M.zs || 1))) * (R.length - 1), i = Math.floor(t), f = t - i;
      for (let j = 0; j < 3; j++) col[k * 3 + j] = R[i][j] + (R[i + 1][j] - R[i][j]) * f; }
    M.mesh.geometry.attributes.color.needsUpdate = true;
  }
  let anim = 0;
  async function aplicarEscenario(suave = true) {
    const pro = T3.escenario === 'proyecto'; if (pro) await leerParches();
    const vis = [...mallas.values()].filter(M => M.mesh.visible); if (!vis.length) return;
    for (const M of vis) { if (pro) calcularPropuesta(M); M.zA = M.z.slice(); M.zB = pro ? M.zP : M.z0; }
    const id = ++anim, t0 = performance.now(), dur = suave ? 1600 : 0;
    const paso = (t) => { if (id !== anim) return; const f = dur ? Math.min(1, (t - t0) / dur) : 1, e = f * f * (3 - 2 * f);
      for (const M of vis) { for (let k = 0; k < M.z.length; k++) M.z[k] = M.zA[k] + (M.zB[k] - M.zA[k]) * e; elevar(M); if (f === 1) colorear(M, pro); }
      if (f < 1) requestAnimationFrame(paso); else api.onCambio && api.onCambio(); };
    requestAnimationFrame(paso);
  }
  addEventListener('escenario', () => setTimeout(() => aplicarEscenario(true), 120));
  let tSl = 0; addEventListener('cora-cambio', () => { clearTimeout(tSl); tSl = setTimeout(() => { if (T3.escenario === 'proyecto') aplicarEscenario(false); }, 250); });
  const resumen = () => { const M = [...mallas.values()].find(q => q.mesh.visible); if (!M || T3.escenario !== 'proyecto') return null;
    let a = 0, b = 0, mx = 0; for (let k = 0; k < M.z0.length; k++) { a += M.z0[k]; b += M.zP[k]; const d = (M.zP[k] - M.z0[k]) / (M.zs || 1); if (Math.abs(d) > Math.abs(mx)) mx = d; }
    const F = CAMPO && !CAMPO.vacio ? CAMPO : null;
    return { prom: a ? (b / a - 1) * 100 : 0, max: mx * 100, arboles: F ? F.arboles : 0, techos: F ? F.techos : 0, mercados: MERCADOS.length }; };
  const api = {
    lista: I.lista.filter(x => !x.year), tiene2020: (code) => I.lista.some(x => x.code === code && x.year),
    get sel() { return sel; }, get anio() { return anio; }, get alto() { return alto; },
    async mostrar(code, en2020) {
      sel = code; anio = !!en2020 && api.tiene2020(code);
      for (const M of mallas.values()) M.mesh.visible = false;
      if (!code) return null;
      const it = I.lista.find(x => x.code === code && (anio ? x.year : !x.year)); const M = await malla(it.f);
      if (sel !== code) return null; /* se eligió otro mientras cargaba */
      if (!M.mesh.parent) g.add(M.mesh); M.mesh.visible = true; anim++;
      const pro = T3.escenario === 'proyecto'; if (pro) { await leerParches(); calcularPropuesta(M); }
      M.z.set(pro ? M.zP : M.z0); elevar(M); colorear(M, pro); return it;
    },
    resumen, onCambio: null, ultimoCalculo: null, cobertura: () => CAMPO, // ultimoCalculo: {code, vertices, ms} del último recálculo con la propuesta
    altura(v) { alto = v; for (const M of mallas.values()) if (M.mesh.visible) elevar(M); },
    ver(on) { g.visible = on; }
  };
  window.KEN_IND = api; // para revisar desde la consola (resumen, cobertura, ultimoCalculo)
  return api;
}

export function panelIndicadores(api, on) {
  let el = document.getElementById('ind-panel');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'ind-panel'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;left:' + (innerWidth > 760 ? 290 : 8) + 'px;bottom:96px;z-index:41;width:min(262px,calc(100vw - 32px));max-height:calc(100vh - 200px);overflow:auto;background:rgba(13,15,18,.86);border:1px solid rgba(255,255,255,.075);border-radius:10px;padding:9px 11px;color:#e9ebec;font:10.5px/1.35 Inter,system-ui,sans-serif;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)';
  const grad = (r) => 'linear-gradient(to top,' + r.join(',') + ')', gradH = (r) => 'linear-gradient(90deg,' + r.join(',') + ')';
  // qué hace la propuesta en cada indicador (texto corto para el panel)
  const QUE = { PM: 'Menos carros y camiones hacia Corabastos: baja la presión en sus vías.', PA: 'Menos tráfico hacia Corabastos y los árboles nuevos de los parches filtran el aire: baja la presión sobre el aire.',
    EPO: 'Menos camiones cerca de Corabastos y más árboles junto a las casas: menos gente expuesta.', CV: 'Corabastos reducido: menos conflicto entre vivienda y carga.',
    CCL: 'El comercio se reparte: Corabastos pierde los camiones que ya no llegan, sus picos rojos bajan y aparecen centros medianos en los 8 mercados de barrio, Bavaria Común y las huertas.',
    IC: 'Los árboles nuevos dan sombra, los techos verdes y las lagunas del parque de Corabastos refrescan: bajan las islas de calor donde se siembran.',
    SE: 'Cada árbol nuevo de los parches nativos y del parque de Corabastos, más los techos verdes y las huertas: sube el soporte ecológico donde se siembra.', OC: 'Cada huerta tiene una junta que la cuida: suben las organizaciones.', CO: 'Escuela de huertas y laboratorios de Bavaria Común: sube el conocimiento.' };
  const fmtN = (n) => Math.round(n).toLocaleString('es-CO');
  const cuenta = (c, r) => { if (!r) return '';
    if (['SE', 'IC', 'PA', 'EPO'].includes(c) && (r.arboles || r.techos)) return `<div style="margin-top:3px;color:#c9cdd0">Cuenta ${fmtN(r.arboles)} árboles nuevos${r.techos && c !== 'EPO' ? ` y ${fmtN(r.techos)} techos verdes` : ''}.</div>`;
    if (c === 'CCL' && r.mercados) return `<div style="margin-top:3px;color:#c9cdd0">${r.mercados} mercados de barrio reciben parte de la carga.</div>`; return ''; };
  const escBox = () => { const pro = (window.KEN_ESC && window.KEN_ESC.e) === 'proyecto', r = api.resumen(), b = (on, t, e) => `<button data-e="${e}" style="flex:1;padding:5px;border:0;font:inherit;cursor:pointer;background:${on ? (e === 'hoy' ? '#e9ebec' : '#34d399') : 'transparent'};color:${on ? '#0d0f12' : '#c9cdd0'}">${t}</button>`;
    return `<div style="display:flex;border:1px solid rgba(255,255,255,.12);border-radius:7px;overflow:hidden;margin-top:9px">${b(!pro, 'Kennedy hoy', 'hoy')}${b(pro, 'Con la propuesta', 'proyecto')}</div>
      <div style="margin-top:6px;color:#9aa2a7;font-size:10px;line-height:1.4">${pro ? `${QUE[api.sel] || ''}${cuenta(api.sel, r)}${r ? `<div style="margin-top:4px;color:#e9ebec;font:500 10.5px 'JetBrains Mono',monospace">Promedio en Kennedy ${r.prom >= 0 ? '+' : '−'}${Math.abs(r.prom).toFixed(1)} % · donde más cambia ${r.max >= 0 ? '+' : '−'}${Math.abs(r.max * 0.01).toFixed(2)}</div>` : ''}<div style="margin-top:3px;color:#646c71;font-size:9px">Supuesto del simulador sobre la lámina; los % de Corabastos salen de los sliders del flujo de carros.</div>`
        : 'Así está hoy, según las láminas. Pasa a <b style="color:#6ee7b7">Con la propuesta</b> para ver cómo cambia.'}</div>`; };
  api.onCambio = () => { if (document.getElementById('ind-panel')) pintar(); };
  const pintar = () => {
    const it = api.lista.find(x => x.code === api.sel), t2 = api.sel && api.tiene2020(api.sel);
    el.innerHTML = `<div style="font:500 9px 'JetBrains Mono',monospace;letter-spacing:.14em;color:#646c71;text-transform:uppercase;margin-bottom:7px">Indicadores</div>
      <div style="display:grid;gap:4px">${api.lista.map(x => `<button data-c="${x.code}" style="position:relative;display:flex;align-items:center;gap:7px;width:100%;text-align:left;padding:6px 8px 6px 14px;background:${x.code === api.sel ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.03)'};border:1px solid ${x.code === api.sel ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.08)'};border-radius:7px;color:#e9ebec;font:inherit;cursor:pointer;overflow:hidden"><i style="position:absolute;left:0;top:0;bottom:0;width:6px;background:${grad(x.ramp)}"></i><b style="font:500 10px 'JetBrains Mono',monospace;min-width:30px;color:#fff">${x.code}</b><span>${x.name.replace(/\s*\([A-Z]+\)\s*$/, '')}</span></button>`).join('')}</div>
      ${it ? `<div style="margin-top:8px">${t2 ? `<div style="display:flex;border:1px solid rgba(255,255,255,.12);border-radius:7px;overflow:hidden;margin-bottom:7px">${['Actual', 'Antes 2020'].map((t, k) => `<button data-a="${k}" style="flex:1;padding:5px;border:0;font:inherit;cursor:pointer;background:${(k === 1) === api.anio ? '#e9ebec' : 'transparent'};color:${(k === 1) === api.anio ? '#0d0f12' : '#c9cdd0'}">${t}</button>`).join('')}</div>` : ''}
        <div style="height:8px;border-radius:2px;background:${gradH(it.ramp)}"></div>
        <div style="display:flex;justify-content:space-between;color:#9aa2a7;font:400 9.5px 'JetBrains Mono',monospace;margin-top:2px"><span>0 · bajo</span><span>0,5</span><span>1 · alto</span></div>
        <label style="display:flex;justify-content:space-between;color:#9aa2a7;margin-top:7px">Altura de los picos <span id="ind-av">${api.alto.toFixed(2)}×</span></label>
        <input id="ind-alt" type="range" min="0.05" max="1" step="0.05" value="${api.alto}" style="width:100%">
        ${escBox()}</div>` : '<div style="margin-top:7px;color:#9aa2a7;font-size:10px">Elige un indicador: se levanta como picos sobre Kennedy (más alto = valor más alto).</div>'}
      <div style="margin-top:6px;color:#646c71;font:400 9px 'JetBrains Mono',monospace">Fuente: Indicadores en 3D · láminas del grupo</div>`;
    el.querySelectorAll('button[data-c]').forEach(b => b.onclick = async () => { const c = b.dataset.c === api.sel ? null : b.dataset.c; const p = api.mostrar(c, false); pintar(); await p; });
    el.querySelectorAll('button[data-a]').forEach(b => b.onclick = async () => { const p = api.mostrar(api.sel, b.dataset.a === '1'); pintar(); await p; });
    el.querySelectorAll('button[data-e]').forEach(b => b.onclick = () => { const K = window.KEN_ESC; if (K && K.poner) K.poner(b.dataset.e); setTimeout(pintar, 150); });
    const r = el.querySelector('#ind-alt'); if (r) r.oninput = () => { api.altura(+r.value); el.querySelector('#ind-av').textContent = (+r.value).toFixed(2) + '×'; };
  };
  pintar();
}

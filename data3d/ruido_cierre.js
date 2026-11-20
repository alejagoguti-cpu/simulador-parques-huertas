/* ============ RUIDO DE LOS CARROS + CIERRE DE VÍA (portado del módulo 08 3D de modelamiento2) ============
   RUIDO: mapa en dB(A) por calle (hoy, propuesta o diferencia) a partir del modelo de data3d/capas_escenario.js (T3.ruidoMod); el panel con números,
   porcentajes por rango y controles vive en panelRuido() (aquí) y en capas_escenario.js. Se repinta solo cuando algo cambia.
   CIERRE DE VÍA: se escoge una de las vías críticas (mayor tránsito registrado), se quita de la red y, para los
   vehículos que la usaban, se calcula un desvío real por las calles vecinas (Dijkstra sobre net.json).
   Es ilustrativo: se desvían los MISMOS vehículos grabados, no se re-simula SUMO. */

const STOPS = [[0, [255, 247, 179]], [0.2, [255, 224, 76]], [0.4, [255, 179, 77]], [0.6, [245, 124, 0]], [0.8, [230, 74, 25]], [1, [211, 47, 47]]];
const LUT = new Uint8Array(256 * 3);
for (let i = 0; i < 256; i++) {
  const t = i / 255; let k = 0; while (k < STOPS.length - 2 && t > STOPS[k + 1][0]) k++;
  const [ta, a] = STOPS[k], [tb, b] = STOPS[k + 1], f = (t - ta) / (tb - ta || 1);
  for (let c = 0; c < 3; c++) LUT[i * 3 + c] = Math.round(a[c] + (b[c] - a[c]) * f);
}

export const VIAS_CRITICAS = [
  { e: 9847, n: 'Vía crítica 1 (mayor tránsito registrado)' }, { e: 11268, n: 'Vía crítica 2' }, { e: 8260, n: 'Vía crítica 3' },
  { e: 9919, n: 'Vía crítica 4' }, { e: 10240, n: 'Vía crítica 5' }, { e: 9449, n: 'Vía crítica 6' },
];

export function crearRuidoCierre({ THREE, T3, LC }) {
  const lw = (x, y) => [x - LC.x, LC.y - y];
  const N = T3.net;
  // ---------------- RUIDO ----------------
  const [bx0, by0, bx1, by1] = (() => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const e of N.edges) for (const p of e[1]) { if (p[0] < a) a = p[0]; if (p[1] < b) b = p[1]; if (p[0] > c) c = p[0]; if (p[1] > d) d = p[1]; } return [a, b, c, d]; })();
  const W = 960, H = Math.round(W * (by1 - by0) / (bx1 - bx0)), sx = W / (bx1 - bx0), sy = H / (by1 - by0);
  const out = document.createElement('canvas'); out.width = W; out.height = H; const go = out.getContext('2d');
  const tex = new THREE.CanvasTexture(out); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
  const [wx0, wz0] = lw(bx0, by1), [wx1, wz1] = lw(bx1, by0);
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0, wz1 - wz0).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, toneMapped: false }));
  plano.position.set((wx0 + wx1) / 2, 1.4, (wz0 + wz1) / 2); plano.renderOrder = 4; plano.visible = false; plano.name = 'ruido-carros'; T3.scene.add(plano);
  let ultimo = 0;
  /* El mapa se pinta con el MODELO de ruido en dB (data3d/capas_escenario.js: T3.ruidoMod, rejilla de 16 m sobre la red vial), no con los carros de cada cuadro:
     así «hoy», «propuesta» y «diferencia» se ven en el mismo encuadre, el mapa responde a los controles del panel y no depende de la hora del reloj.
     Cada celda de vía aporta su energía (10^(dB/10)); se promedia en una ventana de 3×3 celdas (48 m) y el color sale del nivel con las bandas del panel:
     verde < 55, amarillo 55–65, naranja 65–70, rojo > 70 dB. Se repinta solo cuando cambia algo (vista, controles, árboles), no en cada cuadro. */
  const COL = [[63, 191, 111], [242, 211, 56], [242, 140, 40], [224, 65, 47]], LIM = [55, 65, 70];
  const suave = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const colNivel = (L, o) => { let u = 0; for (let i = 0; i < 3; i++) u += suave((L - (LIM[i] - 1.2)) / 2.4); const a = Math.min(2, Math.floor(u)), f = u - a, A = COL[a], B = COL[a + 1];
    o[0] = A[0] + (B[0] - A[0]) * f; o[1] = A[1] + (B[1] - A[1]) * f; o[2] = A[2] + (B[2] - A[2]) * f; };
  const DIF = [[0, [150, 156, 160]], [1.5, [125, 190, 250]], [3.5, [60, 130, 240]], [6, [30, 70, 190]]]; // 0 dB gris · −1,5 azul claro · −3,5 azul · −6 dB o más azul oscuro
  const colDif = (d, o) => { if (d > 0) { const f = Math.min(1, d / 3); o[0] = 150 + (224 - 150) * f; o[1] = 156 + (65 - 156) * f; o[2] = 160 + (47 - 160) * f; return; }
    const a = -d, k = a < DIF[1][0] ? 0 : a < DIF[2][0] ? 1 : 2, A = DIF[k], B = DIF[k + 1], f = Math.min(1, (a - A[0]) / (B[0] - A[0])); for (let c = 0; c < 3; c++) o[c] = A[1][c] + (B[1][c] - A[1][c]) * f; };
  let pxIdx = null, cov = null, covSig = '', campoH = null, campoP = null, sigH = -1, sigP = '', sigMapa = '';
  const badge = () => { let b = document.getElementById('rui-badge'); if (!b) { b = document.createElement('div'); b.id = 'rui-badge'; b.setAttribute('role', 'status'); document.body.appendChild(b); } return b; };
  const preparar = (RM) => { const G = RM.G;
    if (!pxIdx) { pxIdx = new Int32Array(W * H).fill(-1);
      for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) { const wx = bx0 + (px + 0.5) / sx - LC.x, wz = LC.y - (by0 + (H - py - 0.5) / sy), i = Math.floor((wx - G.x0) / G.cs), j = Math.floor((wz - G.z0) / G.cs); if (i >= 0 && j >= 0 && i < G.nx && j < G.nz) pxIdx[py * W + px] = j * G.nx + i; } }
    if (!cov) { const I = new Float32Array(G.nx * G.nz); for (let k = 0; k < G.roads.length; k++) I[G.roads[k]] = 1; cov = RM.caja(I, G.nx, G.nz, 1, false); } // cuántas celdas de vía hay en cada ventana de 3×3
    const campo = (L) => { const E = new Float32Array(G.nx * G.nz); for (let k = 0; k < G.roads.length; k++) E[G.roads[k]] = Math.pow(10, L[k] / 10); return RM.caja(E, G.nx, G.nz, 1, false); };
    const nv = RM.niveles(); if (!nv) return null;
    if (!campoH || sigH !== RM.ver) { campoH = campo(G.L0R); sigH = RM.ver; } if (sigP !== nv.sig) { campoP = campo(nv.Lp); sigP = nv.sig; }
    return nv; };
  function pintarRuido() {
    const RM = T3.ruidoMod; if (!RM || !RM.G) return; const nv = RM.G.L0R ? preparar(RM) : null; const ve = RM.vistaEf();
    if (!nv) { go.clearRect(0, 0, W, H); tex.needsUpdate = true; badge().textContent = 'Calculando el ruido…'; return; }
    const img = go.createImageData(W, H), d = img.data, c3 = [0, 0, 0];
    for (let p = 0; p < W * H; p++) { const q = pxIdx[p]; if (q < 0) continue; const c = cov[q]; if (c < 0.9) continue; const o = p * 4, al = Math.min(1, (c - 0.8) / 2.2);
      const Lh = 10 * Math.log10(campoH[q] / c), Lp = 10 * Math.log10(campoP[q] / c);
      if (ve === 'dif') { const dl = Lp - Lh; colDif(dl, c3); d[o + 3] = 225 * al * (0.3 + 0.7 * Math.min(1, Math.abs(dl) / 3)); } else { colNivel(ve === 'pro' ? Lp : Lh, c3); d[o + 3] = 225 * al; }
      d[o] = c3[0]; d[o + 1] = c3[1]; d[o + 2] = c3[2]; }
    go.putImageData(img, 0, 0); tex.needsUpdate = true; sigMapa = ve + '|' + nv.sig + '|' + RM.ver;
    const b = badge(); b.className = 'v-' + ve; b.textContent = ve === 'hoy' ? 'MAPA DE RUIDO · KENNEDY HOY' : ve === 'pro' ? 'MAPA DE RUIDO · CON LA PROPUESTA' : 'MAPA DE RUIDO · CUÁNTO BAJA CADA CALLE';
  }
  // ---------------- CIERRE DE VÍA ----------------
  let cerrada = null, desvios = new Map(), marca = null;
  const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy; let t = L2 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
  function grafo(ie, R) {
    const P = N.edges[ie][1]; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    x0 -= R; x1 += R; y0 -= R; y1 += R;
    const nodos = new Map(), ady = new Map(), SN = 22, clave = (x, y) => Math.round(x / SN) + ',' + Math.round(y / SN);
    const nodo = (x, y) => { const k = clave(x, y); if (!nodos.has(k)) nodos.set(k, { x, y }); return k; };
    const arista = (a, b, d) => { if (a === b) return; (ady.get(a) || ady.set(a, []).get(a)).push([b, d]); (ady.get(b) || ady.set(b, []).get(b)).push([a, d]); };
    N.edges.forEach(([, pts], k) => { if (k === ie) return; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; if (!((ax >= x0 && ax <= x1 && ay >= y0 && ay <= y1) || (bx >= x0 && bx <= x1 && by >= y0 && by <= y1))) continue; const d = Math.hypot(bx - ax, by - ay); if (d > 0) arista(nodo(ax, ay), nodo(bx, by), d); } });
    return { nodos, ady };
  }
  const cercano = (G, x, y) => { let m = null, dm = 1e18; G.nodos.forEach((p, k) => { if (!G.ady.has(k)) return; const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < dm) { dm = d; m = k; } }); return m; };
  function dijkstra(G, s, t) {
    const dist = new Map([[s, 0]]), prev = new Map(), vis = new Set(), H = [[0, s]];
    const push = (it) => { H.push(it); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
    const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return top; };
    while (H.length) { const [d, u] = pop(); if (vis.has(u)) continue; vis.add(u); if (u === t) break; for (const [v, w] of G.ady.get(u) || []) { const nd = d + w; if (nd < (dist.has(v) ? dist.get(v) : 1e18)) { dist.set(v, nd); prev.set(v, u); push([nd, v]); } } }
    if (!dist.has(t)) return null; const camino = []; for (let u = t; u; u = prev.get(u)) { camino.push(G.nodos.get(u)); if (u === s) break; } return camino.reverse();
  }
  function calcularDesvios(ie) {
    desvios = new Map(); const TR = T3.TRAF; if (!TR) return 0;
    const P = N.edges[ie][1], cerca = new Map();
    for (const st of TR.steps) { if (!st) continue; for (let i = 0; i < st.ids.length; i++) { const x = st.xs[i], y = st.ys[i]; let dm = 1e9; for (let k = 0; k < P.length - 1; k++) { const d = segDist(x, y, P[k][0], P[k][1], P[k + 1][0], P[k + 1][1]); if (d < dm) dm = d; } if (dm < 14) { const id = st.ids[i]; (cerca.get(id) || cerca.set(id, []).get(id)).push([st.t, x, y]); } } }
    const G = grafo(ie, 900); let n = 0;
    for (const [id, L] of cerca) {
      if (n >= 400) break; L.sort((a, b) => a[0] - b[0]); const A = L[0], B = L[L.length - 1];
      const s = cercano(G, A[1], A[2]), t = cercano(G, B[1], B[2]); if (!s || !t || s === t) continue;
      const cam = dijkstra(G, s, t); if (!cam || cam.length < 2) continue;
      const acum = [0]; for (let i = 1; i < cam.length; i++) acum.push(acum[i - 1] + Math.hypot(cam[i].x - cam[i - 1].x, cam[i].y - cam[i - 1].y));
      desvios.set(id, { t0: A[0], t1: Math.max(B[0], A[0] + 1), cam, acum, L: acum[acum.length - 1] }); n++;
    }
    return n;
  }
  /* posición desviada (mundo) de un vehículo en el tiempo t, o null */
  T3.desvio = (id, t) => {
    if (cerrada == null) return null; const D = desvios.get(id); if (!D || t < D.t0 || t > D.t1) return null;
    const objetivo = (t - D.t0) / (D.t1 - D.t0) * D.L; let i = 1; while (i < D.acum.length - 1 && D.acum[i] < objetivo) i++;
    const a = D.cam[i - 1], b = D.cam[i], seg = D.acum[i] - D.acum[i - 1] || 1, f = Math.max(0, Math.min(1, (objetivo - D.acum[i - 1]) / seg));
    const [x, z] = lw(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f), [x2, z2] = lw(b.x, b.y); return [x, z, x2 - x, z2 - z];
  };
  function marcar(ie) {
    if (marca) { T3.scene.remove(marca); marca.traverse(o => o.geometry && o.geometry.dispose()); marca = null; }
    if (ie == null) return;
    const pts = N.edges[ie][1].map(p => { const [x, z] = lw(p[0], p[1]); return new THREE.Vector3(x, 1.8, z); });
    marca = new THREE.Group(); marca.name = 'via-cerrada';
    const linea = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 6), 1.6, 6), new THREE.MeshBasicMaterial({ color: 0xe11d48, transparent: true, opacity: 0.85, toneMapped: false }));
    marca.add(linea);
    const matB = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 }), matR = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    for (const p of [pts[0], pts[pts.length - 1]]) { const v = new THREE.Group(); v.position.copy(p).setY(0.6); const b1 = new THREE.Mesh(new THREE.BoxGeometry(7, 1.1, 0.35), matR); b1.position.y = 1.2; const b2 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.35, 0.37), matB); b2.position.y = 1.2; for (const s of [-3, 3]) { const pa = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 0.2), matB); pa.position.set(s, 0.8, 0); v.add(pa); } v.add(b1, b2); const dir = pts[1].clone().sub(pts[0]); v.rotation.y = Math.atan2(dir.x, dir.z); marca.add(v); }
    T3.scene.add(marca);
  }
  async function cerrar(ie, estado) {
    if (ie == null) { cerrada = null; desvios = new Map(); marcar(null); estado('Sin cierre: el tráfico va por su ruta normal.'); return; }
    if (!T3.TRAF) { estado('La simulación de tráfico aún está cargando; intenta en un momento.'); return; }
    estado('Bajando el tráfico grabado y calculando desvíos…'); { const TR = T3.TRAF; if (TR.pedirTrozo) await Promise.all([...Array(Math.ceil(TR.NS / TR.chunk))].map((_, k) => TR.pedirTrozo(k))); } /* el tráfico se baja por partes: el cierre necesita todo */
    await new Promise(r => setTimeout(r, 30));
    const n = calcularDesvios(ie); cerrada = ie; marcar(ie);
    const vc = VIAS_CRITICAS.find(v => v.e === ie);
    estado(`${vc ? vc.n : 'Vía'}: cerrada. ${n} vehículos desviados por calles vecinas.`);
    const p = N.edges[ie][1][Math.floor(N.edges[ie][1].length / 2)], [x, z] = lw(p[0], p[1]);
    if (T3.orbit) { T3.orbit.target.set(x, 0, z); T3.camera.position.set(x + 260, 300, z + 260); T3.orbit.update(); }
  }
  return {
    ruido: { ver: (on) => { plano.visible = on; if (!on) { const b = document.getElementById('rui-badge'); if (b) b.remove(); } else { sigMapa = ''; pintarRuido(); } }, get visible() { return plano.visible; } },
    // el mapa solo se repinta si cambió la vista, un control del panel o el número de árboles (se mira cada 100 ms)
    update() { if (!plano.visible) return; const t = performance.now(); if (t - ultimo < 100) return; ultimo = t; const RM = T3.ruidoMod; if (!RM || !RM.G) return;
      if (!RM.G.L0R) { if (sigMapa !== 'espera') { sigMapa = 'espera'; pintarRuido(); } return; } const nv = RM.niveles(); if (!nv || sigMapa !== RM.vistaEf() + '|' + nv.sig + '|' + RM.ver) pintarRuido(); },
    cerrar, get cerrada() { return cerrada; },
  };
}

/* paneles (estilo del simulador) */
export function panelRuido(on) {
  let el = document.getElementById('ruido-panel');
  if (!on) { if (el) el.remove(); const b = document.getElementById('rui-badge'); if (b) b.remove(); return; }
  if (!document.getElementById('rui-css')) { const c = document.createElement('style'); c.id = 'rui-css'; c.textContent = `
#ruido-panel{position:fixed;left:16px;bottom:96px;z-index:40;width:min(372px,calc(100vw - 32px));max-height:calc(100vh - 190px);overflow:auto;overscroll-behavior:contain;box-sizing:border-box;padding:12px 14px 14px;border-radius:14px;
  background:var(--ui-glass,rgba(14,16,20,.92));border:1px solid var(--ui-glass-bd,rgba(255,255,255,.16));box-shadow:0 18px 40px rgba(0,0,0,.4);-webkit-backdrop-filter:var(--ui-glass-fx,blur(22px));backdrop-filter:var(--ui-glass-fx,blur(22px));
  color:#e5e9ec;font:400 11.5px/1.4 var(--ui-sans,Inter,system-ui,sans-serif);scrollbar-width:thin}
#ruido-panel .rui-h{font:600 10px var(--ui-mono,monospace);letter-spacing:.14em;text-transform:uppercase;color:#9aa4aa;margin:0 0 8px}
#ruido-panel .rui-big{display:grid;grid-template-columns:1fr auto 1fr auto;gap:6px;align-items:center}
#ruido-panel .rui-c,#ruido-panel .rui-d{display:flex;flex-direction:column;line-height:1}#ruido-panel .rui-c small,#ruido-panel .rui-d small{font-size:9.5px;letter-spacing:.06em;color:#9aa4aa;text-transform:uppercase;margin-bottom:3px}
#ruido-panel .rui-c b{font-size:30px;font-weight:600;font-variant-numeric:tabular-nums;color:#f1f4f5;letter-spacing:-.01em}#ruido-panel .rui-c.p b{color:#ffd9a3}
#ruido-panel .rui-c span,#ruido-panel .rui-d span{font-size:10.5px;color:#9aa4aa;margin-top:2px}#ruido-panel .rui-ar{font-style:normal;color:#6b757b;font-size:18px;align-self:center;margin-top:10px}
#ruido-panel .rui-d{padding:6px 9px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);text-align:center}#ruido-panel .rui-d b{font-size:20px;font-weight:600;font-variant-numeric:tabular-nums}
#ruido-panel .bien{color:#7fd6a0}#ruido-panel .mal{color:#ff8a80}
#ruido-panel .rui-tr{margin:9px 0 8px;color:#d3d9dc;font-size:11.5px;line-height:1.45}#ruido-panel .rui-tr b{color:#fff}#ruido-panel .rui-tr span{display:block;margin-top:3px;color:#8d979d;font-size:10.5px}
#ruido-panel .rui-bars{display:grid;gap:5px}#ruido-panel .rui-bars>div{display:grid;grid-template-columns:62px 1fr;align-items:center;gap:6px}#ruido-panel .rui-bars small{font-size:10px;color:#9aa4aa}
#ruido-panel .bb{display:flex;height:11px;border-radius:3px;overflow:hidden;background:rgba(255,255,255,.06)}#ruido-panel .bb i{display:block;height:100%}
#ruido-panel .rui-ley{margin-top:8px}#ruido-panel .rui-ley .h{display:flex;justify-content:space-between;font:500 9.5px var(--ui-mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:#8d979d;margin-bottom:3px}
#ruido-panel .rui-ley .f{display:grid;grid-template-columns:10px 1fr auto;gap:7px;align-items:center;padding:3px 0;border-top:1px solid rgba(255,255,255,.06);font-size:11px}#ruido-panel .rui-ley .f i{width:10px;height:10px;border-radius:2px}
#ruido-panel .rui-ley small{color:#8d979d;font-size:10px;margin-left:3px}#ruido-panel .rui-ley b{font-weight:500;font-variant-numeric:tabular-nums;color:#e5e9ec}
#ruido-panel .rui-cora{margin:8px 0 0;padding:7px 9px;border-radius:8px;background:rgba(255,255,255,.05);font-size:11px;line-height:1.4;color:#c9d0d4}#ruido-panel .rui-cora:empty{display:none}#ruido-panel .rui-cora b{color:#fff;font-weight:600}
#ruido-panel .rui-vis{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin-top:10px}#ruido-panel .rui-vis>span{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#9aa4aa;width:100%}
#ruido-panel .seg{display:inline-flex;border:1px solid rgba(255,255,255,.16);border-radius:8px;overflow:hidden}
#ruido-panel button{all:unset;box-sizing:border-box;cursor:pointer;font:500 11px var(--ui-sans,Inter,system-ui,sans-serif);color:#cfd5d8;padding:7px 11px;min-height:18px}#ruido-panel .seg button+button{border-left:1px solid rgba(255,255,255,.12)}
#ruido-panel .seg button:hover,#ruido-panel .cmp:hover{background:rgba(255,255,255,.08)}#ruido-panel .seg button.on{background:#f2c995;color:#1a1410;font-weight:600}
#ruido-panel .cmp{border:1px solid rgba(242,201,149,.55);border-radius:8px;color:#f2c995}#ruido-panel .cmp.on{background:rgba(242,201,149,.18)}#ruido-panel button:focus-visible,#ruido-panel input:focus-visible,#ruido-panel summary:focus-visible{outline:2px solid #f2c995;outline-offset:2px}
#ruido-panel .rui-mley{margin-top:8px}#ruido-panel .rui-mley .g{display:flex;height:7px;border-radius:3px;overflow:hidden}#ruido-panel .rui-mley .g i{flex:1}#ruido-panel .rui-mley .g.d{background:linear-gradient(90deg,#1e40af,#60a5fa 40%,#8a9298)}
#ruido-panel .rui-mley .l{display:flex;justify-content:space-between;font-size:9.5px;color:#8d979d;margin-top:2px;font-variant-numeric:tabular-nums}
#ruido-panel .rui-det{margin-top:10px;border-top:1px solid rgba(255,255,255,.1);padding-top:8px}#ruido-panel summary{cursor:pointer;font-weight:600;font-size:11.5px;color:#f2c995;list-style:none}#ruido-panel summary::-webkit-details-marker{display:none}
#ruido-panel summary::before{content:'+ ';color:#f2c995}#ruido-panel details[open]>summary::before{content:'– '}
#ruido-panel .rui-s{margin-top:10px}#ruido-panel .rui-s .t{display:flex;justify-content:space-between;gap:8px;font-size:11.5px;color:#d3d9dc}#ruido-panel .rui-s .t b{font-weight:600;color:#fff;font-variant-numeric:tabular-nums;white-space:nowrap}
#ruido-panel input[type=range]{width:100%;margin:6px 0 2px;accent-color:#f2c995;height:22px}
#ruido-panel .rui-s .e{display:flex;flex-direction:column;gap:1px;font-size:10px;line-height:1.35;color:#8d979d}#ruido-panel .rui-s .e span{font-weight:600;font-size:10.5px;color:#9aa4aa}#ruido-panel .rui-s .e em{font-style:normal}
#ruido-panel .rui-s .e span.bien{color:#7fd6a0}#ruido-panel .rui-s .e span.mal{color:#ff8a80}
#ruido-panel .rui-av{margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.1);font-size:10.5px;color:#aab2b7}#ruido-panel .rui-av:empty{display:none}#ruido-panel .rui-av b{color:#fff}
#ruido-panel .ci-ir{all:unset;cursor:pointer;color:#f2c995;font-weight:600;font-size:10.5px;padding:0}#ruido-panel .rui-nota{margin:6px 0 0;font-size:10px;line-height:1.45;color:#8d979d}
#rui-badge{position:fixed;left:50%;top:72px;transform:translateX(-50%);z-index:39;padding:5px 12px;border-radius:999px;pointer-events:none;white-space:nowrap;font:600 10.5px var(--ui-mono,monospace);letter-spacing:.12em;color:#eef1f2;
  background:rgba(14,16,20,.88);border:1px solid rgba(255,255,255,.2);box-shadow:0 6px 18px rgba(0,0,0,.35)}#rui-badge.v-pro{border-color:#f2c995;color:#ffd9a3}#rui-badge.v-dif{border-color:#60a5fa;color:#a9cdfc}
@media(max-width:760px){#ruido-panel{left:8px;right:8px;bottom:84px;width:auto;max-height:46vh;padding:10px 12px 12px}#ruido-panel .rui-c b{font-size:26px}#rui-badge{top:66px;font-size:9.5px;letter-spacing:.08em;max-width:calc(100vw - 24px);overflow:hidden;text-overflow:ellipsis}}`; document.head.appendChild(c); }
  if (!el) { el = document.createElement('div'); el.id = 'ruido-panel'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Ruido en las calles de Kennedy'); document.body.appendChild(el); }
  el.removeAttribute('style');
  el.innerHTML = '<div class="rui-h">Ruido promedio en las calles · dB(A)</div><div class="rui-cu"></div>';
}
export function panelCierre(api, on) {
  let el = document.getElementById('cierre-panel');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'cierre-panel'; document.body.appendChild(el); }
  el.style.cssText = 'position:fixed;right:16px;top:84px;z-index:41;width:min(300px,calc(100vw - 32px));background:rgba(17,24,33,.95);border:1px solid rgba(148,163,184,.22);border-radius:12px;padding:12px 14px;color:#e5e7eb;font:12px/1.4 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35)';
  el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="letter-spacing:.14em;font-size:10px;font-weight:700;color:#94a3b8">CERRAR UNA VÍA</div><button id="ci-x" style="background:none;border:0;color:#94a3b8;font-size:16px;cursor:pointer">×</button></div>
    <select id="ci-sel" style="width:100%;padding:7px 8px;border-radius:7px;background:#0f172a;color:#e5e7eb;border:1px solid rgba(148,163,184,.3);font:inherit"><option value="">— Ninguna (modelo base) —</option>${VIAS_CRITICAS.map(v => `<option value="${v.e}"${api.cerrada === v.e ? ' selected' : ''}>${v.n}</option>`).join('')}</select>
    <button id="ci-btn" style="width:100%;margin-top:8px;padding:8px;border-radius:7px;border:0;background:#e11d48;color:#fff;font-weight:700;cursor:pointer">Aplicar</button>
    <div id="ci-est" style="margin-top:8px;color:#94a3b8;font-size:11px">Escoge una vía crítica: los vehículos que pasaban por ella se desvían por las calles vecinas (ruta más corta).</div>
    <div style="margin-top:6px;color:#64748b;font-size:10px">Modelo ilustrativo: desvía los mismos vehículos grabados (SUMO), no re-simula.</div>`;
  const est = (s) => { el.querySelector('#ci-est').textContent = s; };
  el.querySelector('#ci-btn').onclick = () => { const v = el.querySelector('#ci-sel').value; api.cerrar(v ? +v : null, est); };
  el.querySelector('#ci-x').onclick = () => { const b = document.getElementById('ci-open'); if (b) b.click(); else el.remove(); };
}

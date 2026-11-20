/* ============ ESCENA DE HUERTAS DE BAVARIA COMÚN, EN PUNTOS (vista amplia, recorrible) ============
   Una escena propia, inspirada en los referentes del grupo: hileras largas de cultivos con un sendero de madera al centro,
   un pabellón paramétrico (cubierta ondulada de costillas sobre un volumen de vidrio), un invernadero de vidrio con cerchas
   de acero y muchos árboles (los modelos 3D reales del simulador: jacarandá, árboles de isla y árbol pequeño).
   Todo se convierte en PUNTOS con color: los árboles y plantas se muestrean sobre sus mallas con el color de su textura
   (MeshSurfaceSampler + uv), y la luz se hornea en el color (sol bajo de la tarde + cielo).
   Marco: el ojo está en (0, 1,6, 0) y mira hacia +z; y = 0 es el suelo. Devuelve los anclajes de cada especie (sobre su planta). */
export async function crearEscenaHuerta({ THREE, MOV = false, progreso = () => {} }) {
  const aFloat = (g) => { for (const k of Object.keys(g.attributes)) { const at = g.attributes[k]; if (at.array instanceof Float32Array && !at.normalized) continue; const A = new Float32Array(at.count * at.itemSize); for (let q = 0; q < at.count; q++) { A[q * at.itemSize] = at.getX(q); if (at.itemSize > 1) A[q * at.itemSize + 1] = at.getY(q); if (at.itemSize > 2) A[q * at.itemSize + 2] = at.getZ(q); if (at.itemSize > 3) A[q * at.itemSize + 3] = at.getW(q); } g.setAttribute(k, new THREE.BufferAttribute(A, at.itemSize)); } return g; }; // posiciones/uv cuantizadas (meshopt) -> Float32 ANTES de escalar
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
  const { MeshSurfaceSampler } = await import('three/addons/math/MeshSurfaceSampler.js');
  const K = MOV ? 0.38 : 1; // densidad
  let sem = 11; const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647), r2 = (a, b) => a + rnd() * (b - a);
  const P = [], C = []; const SOL = new THREE.Vector3(-0.55, 0.62, -0.56).normalize();
  const luz = (c, n, ao = 1) => { const d = n ? Math.max(0, n.dot(SOL)) : 0.6; const k = (0.62 + 0.85 * d) * ao; return [c[0] * k + 0.03, c[1] * k + 0.04, c[2] * k + 0.05]; };
  const pt = (x, y, z, c) => { P.push(x, y, z); C.push(c[0], c[1], c[2]); };
  const hex = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  const mezcla = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const UP = new THREE.Vector3(0, 1, 0);

  /* ---------- modelos reales (árboles y plantas): nube local de cada uno con el color de su textura ---------- */
  const carg = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const texPix = new Map();
  const leerTex = (tx) => { if (!tx || !tx.image) return null; if (texPix.has(tx)) return texPix.get(tx); const im = tx.image, w = Math.min(512, im.width || 0), h = Math.min(512, im.height || 0); if (!w) return null;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.drawImage(im, 0, 0, w, h); const o = { w, h, d: g.getImageData(0, 0, w, h).data }; texPix.set(tx, o); return o; };
  async function nube(urls, n, altoObj) {
    const pts = [], cols = [], nor = []; const escenas = await Promise.all(urls.map(u => carg.loadAsync('data3d/models/' + u + '.glb').catch(() => null)));
    const mallas = []; for (const s of escenas) if (s) { s.scene.updateMatrixWorld(true); s.scene.traverse(o => { if (o.isMesh) mallas.push(o); }); }
    if (!mallas.length) return null;
    const area = mallas.map(m => { const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry; let a = 0; const p = g.attributes.position, A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(); for (let i = 0; i < p.count; i += 3) { A.fromBufferAttribute(p, i); B.fromBufferAttribute(p, i + 1); Cc.fromBufferAttribute(p, i + 2); a += B.sub(A).cross(Cc.sub(A)).length() / 2; } return a; });
    const tot = area.reduce((a, b) => a + b, 0) || 1;
    const v = new THREE.Vector3(), nn = new THREE.Vector3(), uv = new THREE.Vector2(), col = new THREE.Color(), dummy = new THREE.Color();
    mallas.forEach((m, i) => {
      const cuantos = Math.round(n * area[i] / tot); if (!cuantos) return;
      const geo = aFloat(m.geometry.clone()); geo.applyMatrix4(m.matrixWorld); if (!geo.attributes.normal) geo.computeVertexNormals();
      const sm = new MeshSurfaceSampler(new THREE.Mesh(geo)).build(), mat = [].concat(m.material)[0] || {}, tp = leerTex(mat.map), base = mat.color ? [mat.color.r, mat.color.g, mat.color.b] : [0.5, 0.5, 0.5];
      for (let k = 0, tries = 0; k < cuantos && tries < cuantos * 3; tries++) {
        sm.sample(v, nn, dummy, uv); let c = base;
        if (tp && geo.attributes.uv) { const x = Math.floor(((uv.x % 1) + 1) % 1 * tp.w), y = Math.floor((1 - (((uv.y % 1) + 1) % 1)) * tp.h), j = (y * tp.w + x) * 4; if (tp.d[j + 3] < 110) continue;
          col.setRGB(tp.d[j] / 255, tp.d[j + 1] / 255, tp.d[j + 2] / 255, THREE.SRGBColorSpace); c = [col.r * base[0], col.g * base[1], col.b * base[2]]; }
        pts.push(v.x, v.y, v.z); cols.push(c[0], c[1], c[2]); nor.push(nn.x, nn.y, nn.z); k++;
      }
    });
    // normalizar: base en y = 0, centrado, altura 1
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < pts.length; i += 3) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); z0 = Math.min(z0, pts[i + 2]); z1 = Math.max(z1, pts[i + 2]); }
    const h = (y1 - y0) || 1, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; for (let i = 0; i < pts.length; i += 3) { pts[i] = (pts[i] - cx) / h * altoObj; pts[i + 1] = (pts[i + 1] - y0) / h * altoObj; pts[i + 2] = (pts[i + 2] - cz) / h * altoObj; }
    return { pts, cols, nor };
  }
  const poner = (N, x, z, esc, rot, tinte = null) => { if (!N) return; const cs = Math.cos(rot), sn = Math.sin(rot), n = new THREE.Vector3(), dd = Math.hypot(x, z), paso = dd > 90 ? 5 : dd > 55 ? 3 : dd > 28 ? 2 : 1;
    for (let i = 0; i < N.pts.length; i += 3 * paso) { const px = N.pts[i] * esc, py = N.pts[i + 1] * esc, pz = N.pts[i + 2] * esc; n.set(N.nor[i], N.nor[i + 1], N.nor[i + 2]);
      let c = [N.cols[i], N.cols[i + 1], N.cols[i + 2]]; if (tinte) c = mezcla(c, tinte, 0.18); { const m = (c[0] + c[1] + c[2]) / 3; c = [m + (c[0] - m) * 1.5, m + (c[1] - m) * 1.5, m + (c[2] - m) * 1.5]; } /* más saturado */ const ao = 0.55 + 0.45 * Math.min(1, py / (esc * 0.6 + 0.01));
      pt(x + px * cs - pz * sn, py, z + px * sn + pz * cs, luz(c, n, ao)); } };
  progreso(0.05);
  const AR = await Promise.all([
    nube(['jacaranda_L0_madera', 'jacaranda_L0_hojas'], 60000 * K, 1),
    nube(['island_tree_01_L0_madera', 'island_tree_01_L0_hojas'], 55000 * K, 1),
    nube(['island_tree_02_L0_madera', 'island_tree_02_L0_hojas'], 55000 * K, 1),
    nube(['arbolpeq_L0_madera', 'arbolpeq_L0_hojas'], 45000 * K, 1)]);
  const PL = await Promise.all(['fern_02', 'calathea_orbifolia_01', 'nettle_plant', 'periwinkle_plant', 'celandine_01'].map(u => nube([u], 900, 1)));
  progreso(0.35);

  /* ---------- suelo: pasto con matas y tierra entre hileras ---------- */
  const PASTO = [hex('#4f7a32'), hex('#6b8f3c'), hex('#3d6a2c'), hex('#7d9a4a')], TIERRA = [hex('#5a4030'), hex('#6b4c37'), hex('#4a3426')];
  const nG = Math.round(700000 * K);
  for (let i = 0; i < nG; i++) { const cerca = i % 3 === 0, ga = Math.sqrt(-2 * Math.log(rnd() + 1e-9)), gb = r2(0, 6.28), x = cerca ? Math.cos(gb) * ga * 7 : r2(-95, 95), z = cerca ? 6 + Math.sin(gb) * ga * 6 : r2(-6, 150); const enCult = Math.abs(x) > 2.2 && Math.abs(x) < 42 && z > 4 && z < 62; if (enCult) continue;
    const enCamino = Math.abs(x) < 1.6 && z < 70; const c = enCamino ? null : PASTO[(rnd() * 4) | 0]; if (enCamino) continue;
    pt(x, rnd() * 0.06, z, luz(mezcla(c, [0.75, 0.8, 0.55], rnd() * 0.2), UP, 0.85 + rnd() * 0.25)); }
  // sendero de madera (tablas de 14 cm con junta)
  const MAD = hex('#a07a55');
  for (let z = 1.2; z < 70; z += (z < 20 ? 0.02 : 0.04) / K) for (let x = -1.2; x <= 1.2; x += 0.06 / K) { const tabla = Math.floor((z + 100) / 0.15) % 2, junta = ((z + 100) % 0.15) < 0.012; const c = mezcla(MAD, [0.3, 0.22, 0.15], junta ? 0.6 : tabla * 0.08 + rnd() * 0.08); pt(x + r2(-0.02, 0.02), 0.12, z, luz(c, UP)); }
  progreso(0.45);

  /* ---------- hileras de cultivos a lado y lado (como el referente 4) ---------- */
  const CULT = [ // lo que se cultiva: bloques de 4 hileras por cultivo (k = clave, n = nombre, h = alto, r = radio de la mata, c = hojas, f = fruto)
    { k: 'lechuga', n: 'Lechuga', h: 0.26, r: 0.17, c: ['#7fbf4d', '#9ccf5d', '#6aa843'] },
    { k: 'tomate', n: 'Tomate', h: 1.15, r: 0.28, c: ['#3f7a35', '#4f8a3f', '#356b2c'], f: '#d92b1f' },
    { k: 'maiz', n: 'Maíz', h: 1.9, r: 0.22, c: ['#5f8f3a', '#73a346', '#4f7f30'], f: '#e8c23a' },
    { k: 'repollo', n: 'Repollo', h: 0.32, r: 0.25, c: ['#7aa39a', '#93b8ad', '#a9c9a0'] },
    { k: 'zanahoria', n: 'Zanahoria', h: 0.32, r: 0.1, c: ['#3f8a2f', '#55a03a', '#2f7a28'], f: '#e8742a' },
    { k: 'lavanda', n: 'Lavanda', h: 0.55, r: 0.28, c: ['#8b6fc4', '#a58ad8', '#6d5aa6'], tallo: '#6f8b5c' },
    { k: 'brocoli', n: 'Brócoli', h: 0.48, r: 0.24, c: ['#2f6b3a', '#3d7d48', '#24572e'] },
    { k: 'ahuyama', n: 'Ahuyama', h: 0.35, r: 0.45, c: ['#4f8a3a', '#5f9a46', '#3f7a30'], f: '#e8862a' },
    { k: 'remolacha', n: 'Remolacha', h: 0.32, r: 0.14, c: ['#3f7a35', '#9b2c4a', '#4f8a3f'] },
    { k: 'girasol', n: 'Girasol', h: 1.7, r: 0.2, c: ['#4f8a3a', '#5f9a46', '#3f7a30'], f: '#f2c230' }];
  const FILAS = [];
  for (const lado of [-1, 1]) for (let f = 0; f < 44; f++) { const x = lado * (2.6 + f * 0.9), ku = CULT[(Math.floor(f / 4) + (lado > 0 ? 5 : 0)) % CULT.length]; FILAS.push({ x, ku, bloque: f % 4 === 1 }); if (Math.abs(x) > 19 && Math.abs(x) < 25) continue;
    // camellón de tierra
    for (let z = 4; z < 62; z += (Math.abs(x) < 14 && z < 25 ? 0.03 : 0.07) / K) for (let w = -0.28; w <= 0.28; w += 0.09) pt(x + w + r2(-0.03, 0.03), 0.06 + (0.08 - Math.abs(w) * 0.25), z + r2(-0.03, 0.03), luz(TIERRA[(rnd() * 3) | 0], UP, 0.8));
    const cerca = (z) => Math.abs(x) < 14 && z < 25;
    const paso = Math.max(0.22, ku.r * 1.5) / Math.sqrt(K);
    for (let z = 4.2; z < 61.8; z += paso * r2(0.85, 1.15)) { const cx = x + r2(-0.05, 0.05), hh = ku.h * r2(0.85, 1.15), mult = K * (cerca(z) ? 4 : 1.2), C3 = () => hex(ku.c[(rnd() * 3) | 0]);
      const hoja = (y0, y1, rr0) => { for (let i = 0; i < 60 * mult + 6; i++) { const a = r2(0, 6.28), e = Math.acos(r2(0.05, 1)), rr = rr0 * r2(0.45, 1), n = new THREE.Vector3(Math.sin(e) * Math.cos(a), Math.cos(e), Math.sin(e) * Math.sin(a)); pt(cx + n.x * rr, y0 + n.y * (y1 - y0) * r2(0.7, 1.05), z + n.z * rr, luz(C3(), n, 0.55 + 0.45 * n.y)); } };
      const bola = (x0, y0, z0, r0, col, n) => { for (let i = 0; i < n; i++) { const a = r2(0, 6.28), e = Math.acos(r2(-1, 1)), nn = new THREE.Vector3(Math.sin(e) * Math.cos(a), Math.cos(e), Math.sin(e) * Math.sin(a)); pt(x0 + nn.x * r0, y0 + nn.y * r0, z0 + nn.z * r0, luz(hex(col), nn, 0.7 + 0.3 * nn.y)); } };
      const tallo = (h, col) => { for (let i = 0; i < 30 * mult + 4; i++) { const t = rnd(); pt(cx + r2(-0.015, 0.015), t * h, z + r2(-0.015, 0.015), luz(hex(col), null, 0.8)); } };
      if (ku.k === 'lavanda') { for (let i = 0; i < 90 * mult + 6; i++) { const a = r2(0, 6.28), t = Math.sqrt(rnd()), rr = ku.r * t, top = rnd() < 0.55, y = top ? hh * r2(0.75, 1.05) : hh * r2(0.05, 0.7) * (1 - t * 0.4); pt(cx + Math.cos(a) * rr, y, z + Math.sin(a) * rr, luz(hex(top ? ku.c[(rnd() * 3) | 0] : ku.tallo), new THREE.Vector3(Math.cos(a), 0.6, Math.sin(a)).normalize(), 0.65 + 0.35 * (y / hh))); } continue; }
      if (ku.k === 'maiz') { tallo(hh, '#7a9a3a'); for (let i = 0; i < 70 * mult + 6; i++) { const a = r2(0, 6.28), t = rnd(), y = hh * r2(0.2, 0.95), L2 = 0.45 * (1 - (y / hh) * 0.5); pt(cx + Math.cos(a) * t * L2, y - t * t * 0.25, z + Math.sin(a) * t * L2, luz(C3(), UP, 0.7 + 0.3 * (y / hh))); }
        for (let i = 0; i < 25 * mult; i++) { const t = rnd(); pt(cx + 0.06 + r2(-0.025, 0.025), hh * (0.48 + t * 0.14), z + r2(-0.025, 0.025), luz(hex(rnd() < 0.8 ? ku.f : '#9aa45a'), UP)); } continue; }
      if (ku.k === 'girasol') { tallo(hh, '#4f7a2a'); hoja(hh * 0.3, hh * 0.55, 0.18); for (let i = 0; i < 70 * mult + 10; i++) { const a = r2(0, 6.28), rr = 0.16 * Math.sqrt(rnd()); pt(cx + Math.cos(a) * rr, hh + Math.sin(a) * rr * 0.9, z - 0.05, luz(hex(rr < 0.075 ? '#4a2e17' : ku.f), new THREE.Vector3(0, 0.3, -1).normalize())); } continue; }
      if (ku.k === 'tomate') { for (let i = 0; i < 25 * mult; i++) pt(cx, rnd() * hh * 1.1, z, luz(hex('#a07a55'), null)); hoja(0.15, hh, ku.r); if (rnd() < 0.9) for (let q = 0; q < 5; q++) bola(cx + r2(-0.2, 0.2), r2(0.3, hh * 0.85), z + r2(-0.2, 0.2), 0.035, rnd() < 0.75 ? ku.f : '#e8862a', Math.round(14 * mult)); continue; }
      if (ku.k === 'ahuyama') { hoja(0.05, hh, ku.r); if (rnd() < 0.35) bola(cx + r2(-0.25, 0.25), 0.14, z + r2(-0.25, 0.25), 0.13, ku.f, Math.round(80 * mult)); continue; }
      if (ku.k === 'zanahoria' || ku.k === 'remolacha') { for (let i = 0; i < 45 * mult + 6; i++) { const t = rnd(), a = r2(0, 6.28); pt(cx + Math.cos(a) * 0.05 * (0.3 + t) * (ku.k === 'zanahoria' ? 1.4 : 1), 0.1 + t * hh, z + Math.sin(a) * 0.05 * (0.3 + t), luz(C3(), new THREE.Vector3(Math.cos(a), 0.4, Math.sin(a)).normalize(), 0.6 + 0.4 * t)); }
        bola(cx, 0.1, z, ku.k === 'zanahoria' ? 0.025 : 0.05, ku.k === 'zanahoria' ? ku.f : '#7a1f3a', Math.round(10 * mult)); continue; }
      if (ku.k === 'brocoli') { hoja(0.1, hh * 0.75, ku.r); bola(cx, hh * 0.85, z, 0.09, '#2e5a32', Math.round(50 * mult)); continue; }
      hoja(0.12, hh, ku.r); // lechuga, repollo
    }
  }
  progreso(0.6);

  /* ---------- plantas de borde (modelos escaneados) a lo largo del sendero ---------- */
  for (let z = 3; z < 66; z += 1.7) for (const lado of [-1, 1]) { const N = PL[(Math.floor(z * 3) + (lado > 0 ? 2 : 0)) % PL.length]; poner(N, lado * r2(1.45, 1.75), z + r2(-0.3, 0.3), r2(0.45, 0.8), r2(0, 6.28)); }

  /* ---------- árboles: muchos, alrededor del campo y al fondo ---------- */
  const ARB = [];
  const arbol = (x, z, alto) => { const N = AR[(rnd() * AR.length) | 0]; poner(N, x, z, alto, r2(0, 6.28)); ARB.push([x, z, alto]); };
  arbol(-7, 66.5, 7.5); arbol(8, 67.5, 8); // dos árboles junto a la entrada del pabellón
  // (sin alameda pegada al sendero: tapaba la vista de los cultivos)

  /* ---------- BAVARIA REAL (los mismos datos del simulador): predio, edificios con su altura, las 3.250 copas del censo,
     pasajes nuevos y huertas en los claros. La huerta de esta vista queda en su lugar real (huerta docente de hortalizas),
     con las hileras paralelas a los edificios. ---------- */
  const GEO = { SIT: null, EDS: [], ARB: [], CEL: [], PAS: [] }; // geometría para las visiones en mallas (escena_mallas.js)
  const J = (u) => fetch(u).then(r => r.json()).catch(() => null);
  const [BV, BA, SX] = await Promise.all([J('data3d/bavaria.json?v=3'), J('data3d/bavaria_arboles.json?v=3'), J('data3d/bavaria_distrito_sx.json?v=2')]);
  const lw = (x, y) => [x - 5341.33, 3161.9 - y];
  let CTX = null;
  if (BV) {
    const e2 = BV.edif[2].p.map(q => lw(q[0], q[1])), ANG = Math.atan2(e2[1][1] - e2[0][1], e2[1][0] - e2[0][0]), du = [Math.cos(ANG), Math.sin(ANG)], dv = [-du[1], du[0]];
    const ANCLA = [4300, 51], CAMPO = [0, 35]; // centro de la huerta docente (mundo) -> centro del campo de esta vista
    const aE = (w) => { const rx = w[0] - ANCLA[0], rz = w[1] - ANCLA[1]; return [CAMPO[0] + rx * dv[0] + rz * dv[1], CAMPO[1] + rx * du[0] + rz * du[1]]; }; // mundo -> escena (z = a lo largo de los edificios)
    const M2E = (x, y) => aE(lw(x, y));
    const enCampo = (x, z) => Math.abs(x) < 47 && z > -4 && z < 90; // la huerta detallada y su pabellón
    const dentro = (P2, x, z) => { let c = false; for (let i = 0, j = P2.length - 1; i < P2.length; j = i++) { const a = P2[i], b = P2[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    const SIT = BV.sitio.map(q => M2E(q[0], q[1])); let sx0 = 1e9, sx1 = -1e9, sz0 = 1e9, sz1 = -1e9; for (const q of SIT) { sx0 = Math.min(sx0, q[0]); sx1 = Math.max(sx1, q[0]); sz0 = Math.min(sz0, q[1]); sz1 = Math.max(sz1, q[1]); }
    const EDS = BV.edif.map(e => ({ P: e.p.map(q => M2E(q[0], q[1])), h: e.h || 8 })).filter(e => !e.P.some(q => enCampo(q[0], q[1])));
    GEO.SIT = SIT; GEO.EDS = EDS;
    const enEdif = (x, z, m = 0) => EDS.some(e => dentro(e.P, x, z));
    // suelo del predio: pasto y sotobosque
    const nS = Math.round(260000 * K);
    for (let i = 0; i < nS; i++) { const x = r2(sx0, sx1), z = r2(sz0, sz1); if (enCampo(x, z) || !dentro(SIT, x, z) || enEdif(x, z)) continue; pt(x, rnd() * 0.08, z, luz(mezcla(PASTO[(rnd() * 4) | 0], [0.35, 0.3, 0.2], rnd() * 0.35), UP, 0.8)); }
    // edificios: muros con pisos y ventanas, cubierta clara (la nave grande como estructura reticulada)
    const MURO = [0.86, 0.83, 0.78], TECHO = [0.78, 0.8, 0.82], VENT = [0.45, 0.58, 0.64];
    for (const e of EDS) { const P2 = e.P, h = e.h;
      for (let k = 0; k < P2.length; k++) { const a = P2[k], b = P2[(k + 1) % P2.length], Lk = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Lk < 0.5) continue; const nx = (b[1] - a[1]) / Lk, nz = -(b[0] - a[0]) / Lk, nrm = new THREE.Vector3(nx, 0, nz);
        const nP = Math.round(Lk * h * 1.6 * K) + 10; for (let i = 0; i < nP; i++) { const t = rnd(), y = rnd() * h, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; const piso = (y % 3.6) < 0.25, ven = !piso && ((t * Lk) % 3) < 1.6 && (y % 3.6) > 0.9 && (y % 3.6) < 2.6;
          pt(x, y, z, luz(piso ? mezcla(MURO, [0.5, 0.5, 0.5], 0.3) : ven ? VENT : MURO, nrm, 0.95)); } }
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of P2) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
      const nT = Math.round((x1 - x0) * (z1 - z0) * 0.9 * K) + 20; for (let i = 0; i < nT; i++) { const x = r2(x0, x1), z = r2(z0, z1); if (!dentro(P2, x, z)) continue; const reja = (Math.abs(((x - x0) % 6)) < 0.35) || (Math.abs(((z - z0) % 6)) < 0.35); pt(x, h, z, luz(reja ? [0.62, 0.64, 0.66] : TECHO, UP)); } }
    // pasajes nuevos: piso claro de 4 m
    for (const sg of (SX && SX.seg || [])) { if (!sg.n) continue; const Q = sg.p.map(q => M2E(q[0], q[1])); GEO.PAS.push(Q); for (let k = 1; k < Q.length; k++) { const a = Q[k - 1], b = Q[k], Lk = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / (Lk || 1), nz = (b[0] - a[0]) / (Lk || 1);
      for (let i = 0; i < Lk * 18 * K; i++) { const t = rnd(), w = r2(-2, 2), x = a[0] + (b[0] - a[0]) * t + nx * w, z = a[1] + (b[1] - a[1]) * t + nz * w; if (enCampo(x, z)) continue; pt(x, 0.1, z, luz([0.9, 0.86, 0.78], UP)); } } }
    // árboles reales del censo (copas que se conservan); los lejanos con menos puntos
    const ARBR = [];
    for (const a of (BA && BA.arboles || [])) { const [x, z] = M2E(a[0], a[1]); if (enCampo(x, z)) continue; const alto = Math.max(6, Math.min(22, a[2] || 12)); ARBR.push([x, z, alto]); } GEO.ARB.push(...ARBR);
    for (const [x, z, alto] of ARBR) { const N = AR[(Math.abs(Math.floor(x * 7 + z * 3))) % AR.length], dd = Math.hypot(x, z), lim = dd < 70 ? 9000 : dd < 160 ? 2200 : 700, st = Math.max(1, Math.floor(N.pts.length / 3 / lim));
      const rot = (x * 13.7 + z) % 6.28, cs = Math.cos(rot), sn = Math.sin(rot), nn = new THREE.Vector3();
      for (let i = 0; i < N.pts.length; i += 3 * st) { const px = N.pts[i] * alto, py = N.pts[i + 1] * alto, pz = N.pts[i + 2] * alto; nn.set(N.nor[i], N.nor[i + 1], N.nor[i + 2]); let c = [N.cols[i], N.cols[i + 1], N.cols[i + 2]]; { const m = (c[0] + c[1] + c[2]) / 3; c = [m + (c[0] - m) * 1.5, m + (c[1] - m) * 1.5, m + (c[2] - m) * 1.5]; }
        pt(x + px * cs - pz * sn, py, z + px * sn + pz * cs, luz(c, nn, 0.55 + 0.45 * Math.min(1, py / (alto * 0.6)))); } }
    // huertas en los claros (como el distrito del simulador): celdas de 7,5 m paralelas a los edificios, sin copa encima, lejos de los edificios
    const CELL = 7.5, ROW = ['#7fbf4d', '#6d2f4b', '#4f7a6b', '#8b6fc4', '#2f6b2a', '#8fb46a', '#7aa39a'].map(hex);
    for (let cx = Math.floor(sx0 / CELL) * CELL; cx < sx1; cx += CELL) for (let cz = Math.floor(sz0 / CELL) * CELL; cz < sz1; cz += CELL) {
      const mx = cx + CELL / 2, mz = cz + CELL / 2; if (enCampo(mx, mz) || !dentro(SIT, mx, mz)) continue;
      if (EDS.some(e => e.P.some(q => Math.hypot(q[0] - mx, q[1] - mz) < 22)) || EDS.some(e => dentro(e.P, mx, mz))) continue;
      if (ARBR.some(t => Math.abs(t[0] - mx) < 9 && Math.abs(t[1] - mz) < 9)) continue;
      const ci = (((Math.floor(cx / CELL) * 3 + Math.floor(cz / CELL)) % ROW.length) + ROW.length) % ROW.length, c = ROW[ci]; GEO.CEL.push([cx, cz, CELL, ci]);
      for (let r = 0; r < 4; r++) { const x = cx + 1 + r * 1.8; for (let i = 0; i < 160 * K + 20; i++) { const z = cz + 0.5 + rnd() * (CELL - 1); pt(x + r2(-0.35, 0.35), 0.15 + rnd() * 0.3, z, luz(mezcla(c, [0.95, 0.95, 0.8], rnd() * 0.15), UP, 0.85)); } }
      for (let i = 0; i < 60 * K + 10; i++) pt(cx + rnd() * CELL, 0.06, cz + rnd() * CELL, luz(TIERRA[(rnd() * 3) | 0], UP, 0.8));
    }
    CTX = { c: [(sx0 + sx1) / 2, (sz0 + sz1) / 2], R: Math.max(sx1 - sx0, sz1 - sz0) };
  }
  progreso(0.75);

  /* ---------- pabellón paramétrico (referentes 1 y 4): volumen de vidrio bajo y cubierta ondulada de costillas ---------- */
  const BL = [0.94, 0.95, 0.93], VID = [0.62, 0.74, 0.78], ACERO = [0.82, 0.84, 0.86];
  const Z0 = 74, Z1 = 86, X0 = -34, X1 = 34;
  const techo = (x, z) => 5.2 + 0.9 * Math.sin(x * 0.18) * Math.cos(z * 0.35) + 0.6 * Math.sin(x * 0.07 + 1.3);
  // vidrio: fachada sur con montantes cada 1,5 m; adentro se ven reflejos y plantas
  for (let x = X0; x <= X1; x += 0.05 / K) for (let y = 0; y < 4.3; y += 0.07 / K) { if (rnd() < 0.55) continue; const mont = ((x + 100) % 1.5) < 0.06;
    pt(x, y, Z0, luz(mont ? BL : mezcla(VID, [0.9, 0.95, 1], y / 4.3 * 0.5 + rnd() * 0.1), new THREE.Vector3(0, 0, -1), mont ? 1 : 0.9)); }
  for (const x of [X0, X1]) for (let z = Z0; z <= Z1; z += 0.08 / K) for (let y = 0; y < 4.3; y += 0.08 / K) if (rnd() < 0.5) pt(x, y, z, luz(VID, new THREE.Vector3(Math.sign(x), 0, 0)));
  // plantas adentro (jardín interior)
  for (let i = 0; i < 18; i++) poner(PL[i % PL.length], r2(X0 + 2, X1 - 2), r2(Z0 + 2, Z1 - 1), r2(0.8, 1.4), r2(0, 6.28));
  // cubierta: costillas curvas cada 1,2 m que siguen la superficie ondulada, voladizo hacia el campo
  for (let x = X0 - 3; x <= X1 + 3; x += 1.2) for (let z = Z0 - 5; z <= Z1 + 2; z += 0.035 / K) { const y = techo(x, z); pt(x, y, z, luz(BL, UP)); pt(x, y - 0.25, z, luz(mezcla(BL, [0.5, 0.5, 0.5], 0.3), new THREE.Vector3(0, -1, 0))); }
  for (let z = Z0 - 5; z <= Z1 + 2; z += 2.4) for (let x = X0 - 3; x <= X1 + 3; x += 0.05 / K) pt(x, techo(x, z) - 0.12, z, luz(ACERO, UP));
  // óculos con jardineras (como el atrio del referente 1) y techo verde
  for (const [ox, oz] of [[-16, 80], [0, 79], [16, 81]]) for (let i = 0; i < 1400 * K; i++) { const a = r2(0, 6.28), rr = r2(2.2, 3.4); const x = ox + Math.cos(a) * rr, z = oz + Math.sin(a) * rr * 0.7; pt(x, techo(x, z) + r2(0.05, 0.6), z, luz(hex(rnd() < 0.15 ? '#c25b8a' : PASTO[(rnd() * 4) | 0]), UP)); }
  // columnas inclinadas en V
  for (let x = X0; x <= X1; x += 6) for (const s of [-1, 1]) for (let t = 0; t <= 1; t += 0.01 / K) { const z = Z0 - 3.5, y = t * techo(x, z); pt(x + s * t * 1.2, y, z + r2(-0.04, 0.04), luz(BL, new THREE.Vector3(0, 0, -1))); }
  progreso(0.85);

  /* ---------- invernadero de vidrio con cerchas de acero (referente 3) ---------- */
  const GX0 = 40, GX1 = 62, GZ0 = 64, GZ1 = 84, GH = 4.2;
  const caballete = (x) => GH + 2.2 * (1 - Math.abs((x - (GX0 + GX1) / 2) / ((GX1 - GX0) / 2)));
  for (let z = GZ0; z <= GZ1; z += 2) { for (let x = GX0; x <= GX1; x += 0.04 / K) pt(x, caballete(x), z, luz(ACERO, UP)); for (let y = 0; y <= GH; y += 0.04 / K) { pt(GX0, y, z, luz(ACERO, null)); pt(GX1, y, z, luz(ACERO, null)); }
    for (let k = 0; k < 6; k++) { const xa = GX0 + k * (GX1 - GX0) / 6, xb = xa + (GX1 - GX0) / 6; for (let t = 0; t <= 1; t += 0.03 / K) pt(xa + (xb - xa) * t, GH + (k % 2 ? 1 - t : t) * 0.9, z, luz(ACERO, null)); } }
  for (let x = GX0; x <= GX1; x += 0.08 / K) for (let z = GZ0; z <= GZ1; z += 0.09 / K) if (rnd() < 0.45) pt(x, caballete(x) + 0.02, z, luz(mezcla(VID, [1, 1, 1], 0.35), UP, 0.95));
  for (let z = GZ0; z <= GZ1; z += 0.08 / K) for (let y = 0; y < GH; y += 0.1 / K) if (rnd() < 0.4) pt(GX0, y, z, luz(VID, new THREE.Vector3(-1, 0, 0)));
  for (let x = GX0 + 2; x < GX1 - 1; x += 3.2) for (let z = GZ0 + 1.5; z < GZ1 - 1; z += 0.25) { for (let y = 0; y < 0.8; y += 0.08) pt(x, y, z, luz(BL, null)); poner(PL[(Math.floor(x + z)) % PL.length], x, z, 0.45, r2(0, 6.28)); }

  progreso(0.95);

  /* ---------- anclajes de las especies (sobre su planta, cerca del ojo) ---------- */
  const fila = (k, lado) => FILAS.filter(f => f.ku.k === k && Math.sign(f.x) === lado).sort((a, b) => Math.abs(a.x) - Math.abs(b.x))[0];
  const A = (k, lado, z, dy) => { const f = fila(k, lado) || FILAS[0]; return [f.x, (f.ku.h || 0.3) + dy, z]; };
  const ANC = {
    cilantro: A('lavanda', -1, 9, 0.05), lechuga: A('lechuga', -1, 7, 0), tomate: A('tomate', -1, 13, 0.3), acelga: A('brocoli', 1, 11, 0), zanahoria: A('remolacha', 1, 6, 0),
    eucalipto: ARB.length ? [ARB[0][0], ARB[0][2] * 0.75, ARB[0][1]] : [-50, 9, 10]
  };
  ANC.copeton = [0.6, 0.13, 6.5]; ANC.mirla = [-0.5, 0.13, 9]; ANC.lombriz = [ANC.zanahoria[0] - 0.1, 0.1, 5.4];
  ANC.abeja = ANC.cilantro; ANC.mariposa = ANC.cilantro; ANC.colibri = ANC.cilantro; ANC.abejorro = ANC.tomate; ANC.mariquita = ANC.lechuga; ANC.murcielago = [ANC.eucalipto[0] + 2, ANC.eucalipto[1], ANC.eucalipto[2]];
  progreso(1);
  GEO.ARB.push(...ARB); GEO.FILAS = FILAS.map(f => ({ x: f.x, k: f.ku.k, n: f.ku.n, h: f.ku.h, r: f.ku.r, c: f.ku.c, bloque: f.bloque })); GEO.CULT = CULT; GEO.pab = { X0, X1, Z0, Z1 }; GEO.inv = { GX0, GX1, GZ0, GZ1, GH };
  return { pos: new Float32Array(P), col: new Float32Array(C), anc: ANC, n: P.length / 3, ctx: CTX, geo: GEO };
}

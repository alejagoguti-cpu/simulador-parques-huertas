/* ============ LA MISMA ESCENA EN MALLAS 3D (visiones Realista, Maqueta, Rayos X, Alambre y Térmica) ============
   Usa la geometría que entrega escena_huerta.js (predio y edificios reales de Bavaria, copas del censo, hileras, sendero,
   pabellón, invernadero, pasajes y huertas en los claros) y la arma con mallas: edificios extruidos, árboles 3D reales
   instanciados (jacarandá, árboles de isla, árbol pequeño), matas de cultivo instanciadas, cubierta ondulada, vidrio.
   Cada malla tiene una categoría (suelo, edificio, vegetación, hojas, cultivo, vidrio, estructura) y cada visión le pone
   su propio material: no es solo un cambio de color, cambia cómo se dibuja (luz y sombras, maqueta, transparencia, líneas). */
export async function crearEscenaMallas({ THREE, geo, sombras = true, movil = false }) {
  const aFloat = (g) => { for (const k of Object.keys(g.attributes)) { const at = g.attributes[k]; if (at.array instanceof Float32Array && !at.normalized) continue; const A = new Float32Array(at.count * at.itemSize); for (let q = 0; q < at.count; q++) { A[q * at.itemSize] = at.getX(q); if (at.itemSize > 1) A[q * at.itemSize + 1] = at.getY(q); if (at.itemSize > 2) A[q * at.itemSize + 2] = at.getZ(q); if (at.itemSize > 3) A[q * at.itemSize + 3] = at.getW(q); } g.setAttribute(k, new THREE.BufferAttribute(A, at.itemSize)); } return g; }; // posiciones/uv cuantizadas (meshopt) -> Float32 ANTES de escalar
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const G = new THREE.Group(); G.name = 'escena-mallas';
  const MESH = []; // { m, cat, orig }
  const add = (m, cat) => { m.userData.cat = cat; m.userData.orig = m.material; m.castShadow = sombras && cat !== 'suelo' && cat !== 'vidrio'; m.receiveShadow = sombras; MESH.push(m); G.add(m); return m; };
  const std = (c, ex = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...ex });
  const o = new THREE.Object3D();
  let sem = 5; const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);

  /* ---------- suelo ---------- */
  const tierraTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); g.fillStyle = '#5d7d3a'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) { g.fillStyle = ['#4a6b2c', '#6f9045', '#3e5f27', '#7b9a4f'][i % 4]; g.fillRect(rnd() * 256, rnd() * 256, 2, 3); } const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(120, 120); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  add(new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2).translate(0, -0.05, 0), std('#55703a', { map: tierraTex })), 'suelo');
  if (geo.SIT) { const sh = new THREE.Shape(geo.SIT.map(q => new THREE.Vector2(q[0], -q[1]))); add(new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2).translate(0, 0.01, 0), std('#6a8a45', { map: tierraTex })), 'suelo'); }

  /* ---------- edificios reales: extruidos con su altura ---------- */
  { const gs = []; for (const e of geo.EDS) { const sh = new THREE.Shape(e.P.map(q => new THREE.Vector2(q[0], -q[1]))); try { gs.push(new THREE.ExtrudeGeometry(sh, { depth: e.h, bevelEnabled: false }).rotateX(-Math.PI / 2)); } catch (er) {} }
    if (gs.length) add(new THREE.Mesh(mergeGeometries(gs.map(g => g.toNonIndexed())), std('#d9d2c6', { roughness: 0.9 })), 'edificio'); }

  /* ---------- pasajes y sendero ---------- */
  { const gs = []; const tira = (Q, w, y) => { for (let k = 1; k < Q.length; k++) { const a = Q[k - 1], b = Q[k], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.1) continue; const g = new THREE.PlaneGeometry(L, w).rotateX(-Math.PI / 2); g.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0])); g.translate((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2); gs.push(g); } };
    for (const Q of geo.PAS) tira(Q, 4, 0.04);
    if (gs.length) add(new THREE.Mesh(mergeGeometries(gs), std('#e6dfd1')), 'estructura');
    add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 69).translate(0, 0.07, 35.6), std('#a07a55', { roughness: 0.75 })), 'estructura'); }

  /* ---------- hileras de cultivo: camellón + cultivos 3D reales (Quaternius, jeremy, Poly by Google, Kenney: Poly Pizza, CC0 / CC BY)
     y un letrero con el nombre en cada bloque de 4 hileras ---------- */
  { const cam = []; for (const f of geo.FILAS) cam.push(new THREE.BoxGeometry(0.6, 0.12, 58).translate(f.x, 0.06, 33));
    add(new THREE.Mesh(mergeGeometries(cam), std('#5a4030', { roughness: 1 })), 'suelo');
    const carg = new GLTFLoader();
    // modelo -> una sola geometría con color por vértice (del color de cada material), base en y = 0, alto = 1
    const unaGeo = async (k) => { const g = await carg.loadAsync(`data3d/puntos/cultivos/${k}.glb`).catch(() => null); if (!g) return null; g.scene.updateMatrixWorld(true);
      const gs = []; g.scene.traverse(m => { if (!m.isMesh) return; let q = aFloat(m.geometry.clone()).applyMatrix4(m.matrixWorld); if (q.index) q = q.toNonIndexed(); const n = q.attributes.position.count, mt = [].concat(m.material)[0] || {}, c = mt.color || new THREE.Color(0.5, 0.6, 0.4);
        const P = new Float32Array(n * 3), C = new Float32Array(n * 3); for (let i = 0; i < n; i++) { P[i * 3] = q.attributes.position.getX(i); P[i * 3 + 1] = q.attributes.position.getY(i); P[i * 3 + 2] = q.attributes.position.getZ(i); C[i * 3] = c.r; C[i * 3 + 1] = c.g; C[i * 3 + 2] = c.b; }
        const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.BufferAttribute(P, 3)); r.setAttribute('color', new THREE.BufferAttribute(C, 3)); r.computeVertexNormals(); gs.push(r); });
      if (!gs.length) return null; const G2 = mergeGeometries(gs); G2.computeBoundingBox(); const b = G2.boundingBox, h = (b.max.y - b.min.y) || 1; G2.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); G2.scale(1 / h, 1 / h, 1 / h); return G2; };
    const ALTO = { lechuga: 0.3, repollo: 0.38, brocoli: 0.5, maiz: 2.0, zanahoria: 0.55, ahuyama: 0.42, remolacha: 0.45, girasol: 1.8 }, HUNDE = { zanahoria: 0.32, remolacha: 0.12 };
    const MOD = {}; await Promise.all(Object.keys(ALTO).map(async k => { MOD[k] = await unaGeo(k); }));
    // tomate: tutor de caña + mata + tomates del modelo
    const tomFruto = await unaGeo('tomate');
    { const gs = [new THREE.CylinderGeometry(0.015, 0.02, 1.4, 5).translate(0, 0.7, 0)]; const hojas = new THREE.IcosahedronGeometry(0.28, 1).scale(0.9, 1.9, 0.9).translate(0, 0.62, 0); gs.push(hojas);
      const pinta = (g, col) => { g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count, C = new Float32Array(n * 3), c = new THREE.Color(col); for (let i = 0; i < n; i++) C.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(C, 3)); for (const k2 of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k2)) g.deleteAttribute(k2); return g; };
      const partes = [pinta(gs[0], '#a07a55'), pinta(hojas, '#3f7a35')];
      if (tomFruto) for (const [x, y, z] of [[0.18, 0.45, 0.1], [-0.15, 0.7, 0.12], [0.12, 0.9, -0.16], [-0.1, 0.38, -0.18], [0.2, 0.65, -0.05]]) partes.push(tomFruto.clone().scale(0.11, 0.11, 0.11).translate(x, y, z));
      MOD.tomate = mergeGeometries(partes); ALTO.tomate = 1; }
    MOD.lavanda = (() => { const g = new THREE.ConeGeometry(0.28, 0.6, 8).translate(0, 0.3, 0).toNonIndexed(); const n = g.attributes.position.count, C = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const y = g.attributes.position.getY(i), c = new THREE.Color(y > 0.25 ? '#8b6fc4' : '#6f8b5c'); C.set([c.r, c.g, c.b], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.deleteAttribute('uv'); return g; })(); ALTO.lavanda = 1;
    const porK = {}; for (const f of geo.FILAS) (porK[f.k] = porK[f.k] || []).push(f);
    // huertas de los claros cercanos: los mismos cultivos, 4 hileras por claro (las lejanas quedan como camas de color)
    const KEYS = ['lechuga', 'repollo', 'brocoli', 'tomate', 'zanahoria', 'ahuyama', 'remolacha', 'maiz', 'girasol', 'lavanda'], CEXTRA = {}; geo.CERCA = new Set();
    geo.CEL.forEach(([cx, cz, S, ci], j) => { if (Math.hypot(cx - 0, cz - 35) > (movil ? 160 : 260)) return; geo.CERCA.add(j); const k = KEYS[(ci + j) % KEYS.length];
      for (let r = 0; r < 4; r++) (CEXTRA[k] = CEXTRA[k] || []).push({ x: cx + 1 + r * 1.8, z0: cz + 0.6, z1: cz + S - 0.6 }); });
    { const cam2 = []; geo.CEL.forEach(([cx, cz, S], j) => { if (!geo.CERCA.has(j)) return; for (let r = 0; r < 4; r++) cam2.push(new THREE.BoxGeometry(0.6, 0.12, S - 1).translate(cx + 1 + r * 1.8, 0.06, cz + S / 2)); });
      if (cam2.length) add(new THREE.Mesh(mergeGeometries(cam2), std('#5a4030', { roughness: 1 })), 'suelo'); }
    for (const k of KEYS) if (!porK[k] && CEXTRA[k]) porK[k] = [];
    for (const k in porK) { const L = porK[k], geom = MOD[k]; if (!geom) continue; const f0 = L[0] || (geo.CULT || []).find(c => c.k === k) || { r: 0.25 }, paso = Math.max(0.3, f0.r * 1.7) * (movil ? 1.8 : 1), EX = CEXTRA[k] || [], n = L.length * Math.ceil(57 / paso) + EX.reduce((s2, e) => s2 + Math.ceil((e.z1 - e.z0) / paso) + 1, 0) + 4;
      const im = new THREE.InstancedMesh(geom, std('#ffffff', { vertexColors: true, roughness: 0.75 }), n); let i = 0, a = ALTO[k];
      for (const f of L) { if (Math.abs(f.x) > 19 && Math.abs(f.x) < 25) continue; for (let z = 4.3; z < 61.7 && i < n; z += paso * (0.9 + rnd() * 0.2)) { const e = a * (0.85 + rnd() * 0.3); o.position.set(f.x + (rnd() - 0.5) * 0.06, 0.1 - (HUNDE[k] || 0) * e, z); o.rotation.set(0, rnd() * 6.28, 0); o.scale.set(e, e, e); o.updateMatrix(); im.setMatrixAt(i, o.matrix); i++; } }
      for (const e of EX) for (let z = e.z0; z < e.z1 && i < n; z += paso * (0.9 + rnd() * 0.2)) { const sc = a * (0.85 + rnd() * 0.3); o.position.set(e.x + (rnd() - 0.5) * 0.06, 0.1 - (HUNDE[k] || 0) * sc, z); o.rotation.set(0, rnd() * 6.28, 0); o.scale.set(sc, sc, sc); o.updateMatrix(); im.setMatrixAt(i, o.matrix); i++; }
      im.count = i; add(im, 'cultivo'); }
    // letreros: tabla con el nombre del cultivo al comienzo de cada bloque
    const NOM = {}; for (const c of geo.CULT || []) NOM[c.k] = c.n;
    const tabla = new THREE.BoxGeometry(1.5, 0.5, 0.05).translate(0, 0.95, 0), poste = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6).translate(0, 0.45, 0);
    const bloques = geo.FILAS.filter(f => f.bloque && !(Math.abs(f.x) > 19 && Math.abs(f.x) < 25));
    { const im = new THREE.InstancedMesh(poste, std('#6b4f36'), bloques.length); bloques.forEach((f, i) => { o.position.set(f.x + Math.sign(f.x) * 0.45, 0, 3.2); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); add(im, 'madera'); }
    const porN = {}; for (const f of bloques) (porN[f.k] = porN[f.k] || []).push(f);
    for (const k in porN) { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 170; const g = cv.getContext('2d'); g.fillStyle = '#f3ede0'; g.fillRect(0, 0, 512, 170); g.fillStyle = '#2b3a2a'; g.font = '600 74px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((NOM[k] || k).toUpperCase(), 256, 90); g.strokeStyle = '#6b4f36'; g.lineWidth = 10; g.strokeRect(5, 5, 502, 160);
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
      const im = new THREE.InstancedMesh(tabla, [std('#8a6a48'), std('#8a6a48'), std('#8a6a48'), std('#8a6a48'), std('#ffffff', { map: tx }), std('#ffffff', { map: tx })], porN[k].length);
      porN[k].forEach((f, i) => { o.position.set(f.x + Math.sign(f.x) * 0.45, 0, 3.2); o.rotation.set(0, Math.PI, 0); o.scale.set(1, 1, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); add(im, 'letrero'); } }

  /* ---------- huertas en los claros del predio ---------- */
  if (geo.CEL.length) { const COLS = ['#7fbf4d', '#6d2f4b', '#4f7a6b', '#8b6fc4', '#2f6b2a', '#8fb46a', '#7aa39a'];
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.35, 1).translate(0, 0.17, 0), std('#ffffff'), geo.CEL.length * 4); const cc = new THREE.Color(); let i = 0;
    for (const [cx, cz, S, ci] of geo.CEL.filter((_, j) => !(geo.CERCA && geo.CERCA.has(j)))) for (let r = 0; r < 4; r++) { o.position.set(cx + 1 + r * 1.8, 0, cz + S / 2); o.rotation.set(0, 0, 0); o.scale.set(1, 1, S - 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, cc.set(COLS[ci])); i++; }
    add(im, 'cultivo'); }

  /* ---------- árboles 3D reales instanciados ---------- */
  { const carg = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), SP = ['jacaranda', 'island_tree_01', 'island_tree_02', 'arbolpeq'];
    const mod = await Promise.all(SP.map(b => Promise.all(['madera', 'hojas'].map(p => carg.loadAsync(`data3d/models/${b}_L0_${p}.glb`).catch(() => null)))));
    const porSp = SP.map(() => []); geo.ARB.forEach((a, i) => porSp[(Math.abs(Math.floor(a[0] * 7 + a[1] * 3))) % SP.length].push(a));
    mod.forEach((partes, si) => { const L = porSp[si]; if (!L.length) return;
      const caja = new THREE.Box3(); partes.forEach(p => p && (p.scene.updateMatrixWorld(true), caja.expandByObject(p.scene))); const alto = (caja.max.y - caja.min.y) || 1, cx = (caja.min.x + caja.max.x) / 2, cz = (caja.min.z + caja.max.z) / 2;
      partes.forEach((p, pi) => { if (!p) return; const gs = [], mats = []; p.scene.traverse(m => { if (m.isMesh) { const g = aFloat(m.geometry.clone()).applyMatrix4(m.matrixWorld); g.translate(-cx, -caja.min.y, -cz); g.scale(1 / alto, 1 / alto, 1 / alto); for (const k of Object.keys(g.attributes)) { if (!['position', 'normal', 'uv'].includes(k)) { g.deleteAttribute(k); continue; } const at = g.attributes[k], A = new Float32Array(at.count * at.itemSize); for (let q = 0; q < at.count; q++) for (let c = 0; c < at.itemSize; c++) A[q * at.itemSize + c] = c === 0 ? at.getX(q) : c === 1 ? at.getY(q) : at.getZ(q); g.setAttribute(k, new THREE.BufferAttribute(A, at.itemSize)); } if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (!g.attributes.normal) g.computeVertexNormals(); gs.push(g); mats.push([].concat(m.material)[0]); } });
        if (!gs.length) return; let g = null; try { g = mergeGeometries(gs.map(x => x.index ? x.toNonIndexed() : x)); } catch (er) {} if (!g) g = gs[0]; const mt = mats[0].clone(); if (pi === 1) { mt.alphaTest = 0.45; mt.transparent = false; mt.side = THREE.DoubleSide; if (mt.map) { mt.emissive = new THREE.Color(1, 1, 1); mt.emissiveMap = mt.map; mt.emissiveIntensity = 0.32; } if (mt.color) mt.color.multiplyScalar(1.15); } else if (mt.color) mt.color.multiplyScalar(1.1);
        const im = new THREE.InstancedMesh(g, mt, L.length); L.forEach((a, i) => { o.position.set(a[0], 0, a[1]); o.rotation.set(0, (a[0] * 13.7 + a[1]) % 6.28, 0); o.scale.setScalar(a[2]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
        add(im, pi === 1 ? 'hojas' : 'madera'); }); }); }

  /* ---------- pabellón paramétrico: cubierta ondulada, vidrio, columnas en V ---------- */
  { const { X0, X1, Z0, Z1 } = geo.pab, techo = (x, z) => 5.2 + 0.9 * Math.sin(x * 0.18) * Math.cos(z * 0.35) + 0.6 * Math.sin(x * 0.07 + 1.3);
    const NX = 90, NZ = 24, P = [], I = []; for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) { const x = X0 - 3 + (X1 - X0 + 6) * i / NX, z = Z0 - 5 + (Z1 - Z0 + 7) * j / NZ; P.push(x, techo(x, z), z); if (i < NX && j < NZ) { const a = i * (NZ + 1) + j, b = a + NZ + 1; I.push(a, a + 1, b, b, a + 1, b + 1); } }
    const gt = new THREE.BufferGeometry(); gt.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gt.setIndex(I); gt.computeVertexNormals();
    add(new THREE.Mesh(gt, std('#f4f4f1', { side: THREE.DoubleSide, roughness: 0.5 })), 'estructura');
    const cost = []; for (let x = X0 - 3; x <= X1 + 3; x += 1.2) { const pts = []; for (let z = Z0 - 5; z <= Z1 + 2; z += 0.5) pts.push(new THREE.Vector3(x, techo(x, z) - 0.12, z)); cost.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.06, 4).toNonIndexed()); }
    for (let x = X0; x <= X1; x += 6) for (const sg of [-1, 1]) { const a = new THREE.Vector3(x, 0, Z0 - 3.5), b = new THREE.Vector3(x + sg * 1.2, techo(x, Z0 - 3.5), Z0 - 3.5), d = b.clone().sub(a); const c = new THREE.CylinderGeometry(0.09, 0.13, d.length(), 8).translate(0, d.length() / 2, 0); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); c.translate(a.x, a.y, a.z); cost.push(c.toNonIndexed()); }
    for (const [ox, oz] of [[-16, 80], [0, 79], [16, 81]]) cost.push(new THREE.TorusGeometry(2.8, 0.18, 6, 32).rotateX(Math.PI / 2).scale(1, 1, 0.7).translate(ox, techo(ox, oz) + 0.1, oz).toNonIndexed());
    add(new THREE.Mesh(mergeGeometries(cost), std('#ffffff', { roughness: 0.4, metalness: 0.1 })), 'estructura');
    add(new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 4.3, Z1 - Z0).translate((X0 + X1) / 2, 2.15, (Z0 + Z1) / 2), new THREE.MeshPhysicalMaterial({ color: '#bcd6dc', roughness: 0.08, transmission: 0, transparent: true, opacity: 0.35, metalness: 0.2 })), 'vidrio'); }

  /* ---------- invernadero de vidrio con cerchas ---------- */
  { const { GX0, GX1, GZ0, GZ1, GH } = geo.inv, W = GX1 - GX0, cxg = (GX0 + GX1) / 2;
    const perfil = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(W / 2, GH), new THREE.Vector2(0, GH + 2.2), new THREE.Vector2(-W / 2, GH)]);
    const cuerpo = new THREE.ExtrudeGeometry(perfil, { depth: GZ1 - GZ0, bevelEnabled: false }).translate(cxg, 0, GZ0);
    add(new THREE.Mesh(cuerpo, new THREE.MeshPhysicalMaterial({ color: '#d9ece8', roughness: 0.05, transparent: true, opacity: 0.3 })), 'vidrio');
    const ce = []; for (let z = GZ0; z <= GZ1; z += 2) { const ed = new THREE.EdgesGeometry(new THREE.ShapeGeometry(perfil)); const p = ed.attributes.position; for (let i = 0; i < p.count; i += 2) { const a = new THREE.Vector3(p.getX(i) + cxg, p.getY(i), z), b = new THREE.Vector3(p.getX(i + 1) + cxg, p.getY(i + 1), z), d = b.clone().sub(a); const c = new THREE.CylinderGeometry(0.05, 0.05, d.length(), 5).translate(0, d.length() / 2, 0); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); c.translate(a.x, a.y, a.z); ce.push(c.toNonIndexed()); } }
    add(new THREE.Mesh(mergeGeometries(ce), std('#c9cfd3', { metalness: 0.6, roughness: 0.35 })), 'estructura'); }

  /* ---------- luz ---------- */
  const sol = new THREE.DirectionalLight(0xfff1dc, 2.4); sol.position.set(-180, 260, -160); sol.target.position.set(0, 0, 60); G.add(sol, sol.target);
  if (sombras) { sol.castShadow = true; sol.shadow.mapSize.set(4096, 4096); const c = sol.shadow.camera; c.left = c.bottom = -420; c.right = c.top = 420; c.near = 10; c.far = 900; sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.6; }
  const hemi = new THREE.HemisphereLight(0xdbe8f5, 0x5d5140, 1.1); G.add(hemi);

  /* ---------- visiones: material por categoría ---------- */
  const alfaHoja = (m, mat) => { const map = m.userData.orig.map; if (!map) return mat; mat.alphaTest = 0.45; mat.side = THREE.DoubleSide;
    mat.onBeforeCompile = (sh) => { sh.uniforms.mapaH = { value: map }; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvH;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvUvH = uv;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D mapaH; varying vec2 vUvH;').replace('#include <alphatest_fragment>', 'diffuseColor.a *= texture2D(mapaH, vUvH).a;\n#include <alphatest_fragment>'); };
    mat.customProgramCacheKey = () => 'hoja-' + mat.type; return mat; };
  // shader propio (rayos X y térmica): funciona con instancias y recorta las hojas con su textura
  const shaderMat = (frag, extra = {}) => (m) => { const map = m.userData.orig.map;
    const mat = new THREE.ShaderMaterial({ uniforms: { mapa: { value: map || null }, usaMapa: { value: map && m.userData.cat === 'hojas' ? 1 : 0 }, uCat: { value: { suelo: 0, edificio: 1, estructura: 1, vidrio: 1.5, madera: 2, hojas: 3, cultivo: 4 }[m.userData.cat] || 0 } },
      vertexShader: `varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vY; void main(){ vUv = uv; vec4 p = vec4(position, 1.0); vec3 n = normal;
        #ifdef USE_INSTANCING
          p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
        #endif
        vec4 w = modelMatrix * p; vY = w.y; vec4 mv = viewMatrix * w; vN = normalize(normalMatrix * n); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D mapa; uniform float usaMapa, uCat; varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vY;
        void main(){ if (usaMapa > 0.5 && texture2D(mapa, vUv).a < 0.45) discard; ${frag} }`, ...extra });
    mat.side = THREE.DoubleSide; return mat; };
  const xray = shaderMat(`float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); vec3 c = mix(vec3(0.25, 0.55, 1.0), vec3(0.75, 0.95, 1.0), f);
      float a = (uCat > 2.5 && uCat < 3.5 ? 0.06 : uCat < 0.5 ? 0.02 : 0.1) + f * (uCat > 2.5 && uCat < 3.5 ? 0.25 : 0.75); gl_FragColor = vec4(c * (0.6 + f), a);`, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const termica = shaderMat(`float k = uCat > 3.5 ? 0.92 : uCat > 2.5 ? 0.72 : uCat > 1.8 ? 0.55 : uCat > 0.5 ? 0.18 + clamp(vY / 30.0, 0.0, 0.2) : 0.32; float l = 0.85 + 0.15 * dot(normalize(vN), vec3(0.0, 1.0, 0.0)); k = clamp(k * l, 0.0, 1.0);
      vec3 c = k < 0.33 ? mix(vec3(0.02, 0.0, 0.12), vec3(0.5, 0.0, 0.62), k / 0.33) : k < 0.66 ? mix(vec3(0.5, 0.0, 0.62), vec3(1.0, 0.33, 0.0), (k - 0.33) / 0.33) : mix(vec3(1.0, 0.33, 0.0), vec3(1.0, 0.97, 0.6), (k - 0.66) / 0.34); gl_FragColor = vec4(c, 1.0);`);
  const MATS = {
    realista: (m) => m.userData.orig,
    maqueta: (m) => { const c = m.userData.cat; if (c === 'vidrio') return new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.25, roughness: 0.2 }); const mat = new THREE.MeshStandardMaterial({ color: c === 'hojas' || c === 'madera' ? '#dfe6da' : c === 'cultivo' ? '#e8ece2' : c === 'suelo' ? '#efece6' : '#fbfaf7', roughness: 0.95 }); return c === 'hojas' ? alfaHoja(m, mat) : mat; },
    rayos: xray, termica,
    alambre: (m) => { const c = m.userData.cat; return new THREE.MeshBasicMaterial({ wireframe: true, color: c === 'hojas' || c === 'madera' || c === 'cultivo' ? '#5fd3a0' : c === 'suelo' ? '#1d4a6e' : '#9ad4ff', transparent: true, opacity: c === 'suelo' ? 0.35 : c === 'hojas' ? 0.35 : 0.85 }); }
  };
  const cache = {};
  function vision(v) { if (!MATS[v]) return; for (const it of MESH) { const k = v + it.uuid; let mt = cache[k]; if (!mt) mt = cache[k] = (it.userData.cat === 'letrero' && v !== 'rayos' && v !== 'alambre') ? it.userData.orig : MATS[v](it); it.material = mt; it.castShadow = sombras && v !== 'rayos' && v !== 'alambre' && it.userData.cat !== 'suelo' && it.userData.cat !== 'vidrio'; }
    sol.intensity = v === 'maqueta' ? 2.0 : 2.4; hemi.intensity = v === 'maqueta' ? 1.5 : 1.1; }
  return { grupo: G, vision, sol };
}

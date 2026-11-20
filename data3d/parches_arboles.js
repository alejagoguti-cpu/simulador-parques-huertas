/* ============ PARCHES DE ÁRBOLES NATIVOS (propuesta) ============
   La propuesta siembra parches de árboles nativos en los parques y alrededor de las huertas de parque, para que la vida no dependa solo
   de los humedales. Las especies se escogieron por cuántas especies de fauna sostienen en la Red de Interacciones Bióticas de Kennedy
   (data3d/biotica.json, enlaces flora-fauna) y por ser nativas de la sabana (el sauce llorón NO: casi solo sirve de dosel y compite):
     caucho sabanero (13 especies de fauna) · sauco (10) · aliso (8) · chicalá (7) · chilco (7) · arrayán (5)
     + arbustos de néctar para colibríes y abejas: tíbar, raque y mortiño.
   Cada parche tiene tres estratos: dosel en el centro (caucho, aliso), árboles medianos alrededor (sauco, chicalá, arrayán) y arbustos
   de flor en el borde (chilco, tíbar, raque, mortiño).
   - calcularParches(HB, PQ, lw): posiciones deterministas (las usan la red biótica y el 3D, así coinciden).
   - crearParches3D({ T3, P }): árboles instanciados (modelos escaneados) con el color de cada especie, flores y un punto que se ve de lejos. */
export const ESPECIES = {
  caucho: { n: 'Caucho sabanero', sci: 'Ficus soatensis', fl: ['f10'], alto: 10, hoja: '#3f6b36', modelo: 'island_tree_01', fauna: 13, estrato: 0 },
  aliso: { n: 'Aliso', sci: 'Alnus acuminata', fl: ['f28'], alto: 11, hoja: '#4d7a3f', modelo: 'island_tree_02', fauna: 8, estrato: 0 },
  sauco: { n: 'Sauco', sci: 'Sambucus peruviana', fl: ['f2'], alto: 5.5, hoja: '#6f9a4a', flor: '#f4f0da', modelo: 'arbolpeq', fauna: 10, estrato: 1 },
  chicala: { n: 'Chicalá', sci: 'Tecoma stans', fl: ['f0'], alto: 6, hoja: '#7aa046', flor: '#f2c230', modelo: 'arbolpeq', fauna: 7, estrato: 1 },
  arrayan: { n: 'Arrayán', sci: 'Myrcianthes leucoxyla', fl: ['f30'], alto: 5, hoja: '#4f7d45', modelo: 'island_tree_02', fauna: 5, estrato: 1 },
  chilco: { n: 'Chilco', sci: 'Baccharis latifolia', fl: ['f33'], alto: 2.2, hoja: '#6b8f4e', flor: '#efe9c9', modelo: 'arbolpeq', fauna: 7, estrato: 2 },
  tibar: { n: 'Tíbar', sci: 'Escallonia paniculata', fl: ['f102'], alto: 3, hoja: '#5c8a48', flor: '#d9534f', modelo: 'arbolpeq', fauna: 1, estrato: 2 },
  raque: { n: 'Raque', sci: 'Vallea stipularis', fl: ['f129'], alto: 3.2, hoja: '#5f8c4a', flor: '#d0517a', modelo: 'arbolpeq', fauna: 1, estrato: 2 },
  mortino: { n: 'Mortiño', sci: 'Hesperomeles goudotiana', fl: ['f213'], alto: 2.4, hoja: '#557f45', flor: '#f6eef4', modelo: 'arbolpeq', fauna: 1, estrato: 2 }
};
const ESTRATO = [['caucho', 'caucho', 'aliso'], ['sauco', 'sauco', 'chicala', 'chicala', 'arrayan'], ['chilco', 'chilco', 'tibar', 'raque', 'mortino']];
// fauna que llega a cada parche (las aves que comen frutos, néctar e insectos de estos árboles; abejas a las flores)
export const FAUNA_PARCHE = { copeton: 2, mirla: 2, colibri: 2, torcaza: 1, cucarachero: 1, chamon: 0.5, abeja: 3, lagartija: 0.5, caracol: 0.5 };

const azar = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const dentro = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
let CACHE = null;
export const parchesCalculados = () => CACHE; // los usa data3d/indicadores.js (sin recalcular)
export function calcularParches(HB, PQ, lw, movil = false) {
  if (CACHE) return CACHE;
  const R = azar(20261118), parques = (PQ || []).map(p => { const poly = p.pts.map(q => lw(q[0], q[1])); let a = 0, cx = 0, cz = 0; for (let i = 0; i < poly.length; i++) { const q = poly[i], r = poly[(i + 1) % poly.length]; a += q[0] * r[1] - r[0] * q[1]; cx += q[0]; cz += q[1]; }
    return { n: p.nombre ? 'Parque ' + p.nombre.replace(/^parque\s+/i, '') : 'Zona verde', poly, area: Math.abs(a) / 2, c: [cx / poly.length, cz / poly.length], usado: false }; }).filter(p => p.area > 1500);
  const OUT = [], todos = [];
  const libre = (x, z, evitar, d = 4.2) => { for (const t of todos) if (Math.abs(t.x - x) < d && Math.abs(t.z - z) < d && Math.hypot(t.x - x, t.z - z) < d) return false; for (const [ex, ez, er] of evitar) if (Math.hypot(x - ex, z - ez) < er) return false; return true; };
  // un parche = 2 o 3 manchas de árboles en estratos (dosel al centro, medianos alrededor, arbustos de flor en el borde)
  const parche = (n, c, poly, rIn, nMan, evitar) => {
    const A = [], a0 = R() * 6.283;
    for (let m = 0; m < nMan; m++) {
      const ang = a0 + m * 6.283 / nMan + (R() - 0.5) * 0.6, dist = rIn + 14 + R() * 14, mc = [c[0] + Math.cos(ang) * dist, c[1] + Math.sin(ang) * dist];
      if (poly && !dentro(mc[0], mc[1], poly)) { const k = 0.55; mc[0] = c[0] + (mc[0] - c[0]) * k; mc[1] = c[1] + (mc[1] - c[1]) * k; if (!dentro(mc[0], mc[1], poly)) continue; }
      for (const [est, nn, r0, r1] of [[0, 2, 0, 4], [1, 5, 6, 10], [2, 7, 11, 15]]) for (let i = 0; i < nn; i++) {
        for (let k = 0; k < 8; k++) { const aa = R() * 6.283, rr = r0 + R() * (r1 - r0), x = mc[0] + Math.cos(aa) * rr, z = mc[1] + Math.sin(aa) * rr;
          if (poly && !dentro(x, z, poly)) continue; if (!libre(x, z, evitar, est === 2 ? 2.6 : 4.2)) continue;
          const L = ESTRATO[est], sp = L[Math.floor(R() * L.length)], E = ESPECIES[sp], t = { x, z, sp, h: E.alto * (0.8 + R() * 0.35), rot: R() * 6.283 };
          A.push(t); todos.push(t); break; } }
    }
    if (A.length >= 6) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const t of A) { x0 = Math.min(x0, t.x); x1 = Math.max(x1, t.x); z0 = Math.min(z0, t.z); z1 = Math.max(z1, t.z); }
      OUT.push({ n, c: [(x0 + x1) / 2, (z0 + z1) / 2], x0: x0 - 6, x1: x1 + 6, z0: z0 - 6, z1: z1 + 6, poly: [[x0 - 6, z0 - 6], [x1 + 6, z0 - 6], [x1 + 6, z1 + 6], [x0 - 6, z1 + 6]], arboles: A }); }
  };
  // 1) alrededor de cada huerta de parque (sin tocar sus vainas)
  for (const h of (HB && HB.huertas || []).filter(h => h.tipo === 'parque')) {
    const pts = []; for (const p of h.pods || []) for (const q of p.pi || []) pts.push(q);
    const rIn = pts.length ? Math.max(...pts.map(q => Math.hypot(q[0] - h.c[0], q[1] - h.c[1]))) : 20;
    const pq = parques.find(p => dentro(h.c[0], h.c[1], p.poly)); if (pq) pq.usado = true;
    parche('Parche nativo · ' + h.n.replace(/^Huerta efímera del /i, ''), h.c, pq ? pq.poly : null, Math.min(rIn, 60), movil ? 2 : 3, [[h.c[0], h.c[1], Math.min(rIn, 60) + 5]]);
  }
  // 2) en los demás parques grandes (los más grandes primero)
  const resto = parques.filter(p => !p.usado && p.area > 4000).sort((a, b) => b.area - a.area).slice(0, movil ? 18 : 34);
  for (const p of resto) if (dentro(p.c[0], p.c[1], p.poly)) parche('Parche nativo · ' + p.n, p.c, p.poly, 4, p.area > 15000 ? 3 : 2, []);
  CACHE = OUT; return OUT;
}

export async function crearParches3D({ T3, P }) {
  const THREE = T3.THREE, MOV = innerWidth < 760 || matchMedia('(pointer:coarse)').matches;
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js')]);
  const grupo = new THREE.Group(); grupo.name = 'parches_arboles'; grupo.visible = false; T3.scene.add(grupo);
  const Y = (T3.sueloY != null ? T3.sueloY : 0.35);
  const ld = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), L = (n) => ld.loadAsync('data3d/models/' + n + '.glb').catch(() => null);
  const aF = (g) => { for (const k of Object.keys(g.attributes)) { const a = g.attributes[k]; if (!a.isInterleavedBufferAttribute && a.array instanceof Float32Array) continue; const n = a.count, s = a.itemSize, F = new Float32Array(n * s), get = [a.getX, a.getY, a.getZ, a.getW]; for (let i = 0; i < n; i++) for (let j = 0; j < s; j++) F[i * s + j] = get[j].call(a, i); g.setAttribute(k, new THREE.BufferAttribute(F, s)); } return g; };
  const NOMS = ['island_tree_01', 'island_tree_02', 'arbolpeq'], CARG = await Promise.all(NOMS.flatMap(m => [L(m + '_L1_madera'), L(m + '_L1_hojas')])), MOD = {}; NOMS.forEach((m, i) => { MOD[m] = [CARG[i * 2], CARG[i * 2 + 1]]; }); // los seis modelos a la vez
  // geometría normalizada de cada modelo: base en 0, 1 m de alto
  const NORM = {}; for (const [m, gls] of Object.entries(MOD)) { const MS = []; gls.filter(Boolean).forEach((gl, hj) => { gl.scene.updateMatrixWorld(true); gl.scene.traverse(o => { if (o.isMesh) MS.push([o, aF(o.geometry.clone()).applyMatrix4(o.matrixWorld), hj]); }); });
    const b = new THREE.Box3(); MS.forEach(([, g]) => { g.computeBoundingBox(); b.union(g.boundingBox); }); const h = (b.max.y - b.min.y) || 1;
    NORM[m] = { partes: MS.map(([o, g, hj]) => ({ geo: g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2).scale(1 / h, 1 / h, 1 / h), mat: o.material, hoja: hj === 1 })), ancho: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / h }; }
  /* DENSIDAD (slider «Densidad de árboles» de SIM-03): cada árbol tiene una clave fija k en [0, 1); las instancias se ordenan por k y se dibujan
     solo las que tienen k < densidad (árbol, sus flores y su pradera van juntos) */
  const kA = (t) => { const h = Math.sin(t.x * 12.9898 + t.z * 78.233) * 43758.5453; return h - Math.floor(h); };
  const todos = P.flatMap(p => p.arboles).map(t => (t.k = kA(t), t)).sort((a, b) => a.k - b.k), O = new THREE.Object3D(), FL = [], DENS = [];
  for (const [sp, E] of Object.entries(ESPECIES)) {
    const lista = todos.filter(t => t.sp === sp); if (!lista.length || !NORM[E.modelo]) continue; const N = NORM[E.modelo];
    for (const pt of N.partes) { const mat = pt.mat.clone(); mat.side = THREE.DoubleSide; if (mat.transparent) { mat.transparent = false; mat.alphaTest = 0.45; } mat.metalness = 0; mat.roughness = 1; mat.envMapIntensity = 0;
        if (pt.hoja) { /* la textura escaneada manda; solo un tinte suave hacia el verde de cada especie (antes el color multiplicaba la textura y las copas salían negras) */
          const c = new THREE.Color(E.hoja), mx = Math.max(c.r, c.g, c.b) || 1; mat.color = new THREE.Color(1, 1, 1).lerp(new THREE.Color(c.r / mx, c.g / mx, c.b / mx), 0.3).multiplyScalar(1.12); }
        if (mat.map) { mat.emissiveMap = mat.map; mat.emissive = new THREE.Color(1, 1, 1); mat.emissiveIntensity = pt.hoja ? 0.22 : 0.18; } /* las caras a la sombra no se ven negras */
      const im = new THREE.InstancedMesh(pt.geo, mat, lista.length); im.castShadow = !MOV; im.receiveShadow = false;
      lista.forEach((t, i) => { O.position.set(t.x, Y, t.z); O.rotation.set(0, t.rot, 0); O.scale.setScalar(t.h); O.updateMatrix(); im.setMatrixAt(i, O.matrix); }); grupo.add(im); DENS.push([im, lista.map(t => t.k)]); }
    if (E.flor) lista.forEach(t => { const r = t.h * N.ancho * 0.3; for (let k = 0; k < (MOV ? 10 : 22); k++) { const a = k * 2.399 + t.rot, rr = r * (0.4 + 0.6 * ((k * 37) % 10) / 10); FL.push([t.x + Math.cos(a) * rr, Y + t.h * (0.55 + 0.4 * ((k * 53) % 10) / 10), t.z + Math.sin(a) * rr, E.flor, t.k]); } });
  }
  // flores: racimos de color sobre la copa (amarillo del chicalá, crema del sauco y del chilco, rojo del tíbar, rosa del raque)
  FL.sort((a, b) => a[4] - b[4]);
  if (FL.length) { const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.3, 0), new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: '#3a3a3a', toneMapped: true }), FL.length), C = new THREE.Color();
    FL.forEach((f, i) => { O.position.set(f[0], f[1], f[2]); O.rotation.set(0, 0, 0); O.scale.setScalar(1); O.updateMatrix(); im.setMatrixAt(i, O.matrix); im.setColorAt(i, C.set(f[3])); }); grupo.add(im); DENS.push([im, FL.map(f => f[4])]); }
  // pradera del parche: una mancha verde clara bajo cada árbol; juntas dibujan la forma del parche sobre el suelo (se lee desde arriba)
  { const im = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#7cc35a', transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }), todos.length);
    todos.forEach((t, i) => { const r = ESPECIES[t.sp].estrato === 0 ? 6.5 : ESPECIES[t.sp].estrato === 1 ? 5 : 3.6; O.position.set(t.x, Y + 0.18, t.z); O.rotation.set(0, 0, 0); O.scale.set(r, 1, r); O.updateMatrix(); im.setMatrixAt(i, O.matrix); });
    im.renderOrder = 2; grupo.add(im); DENS.push([im, todos.map(t => t.k)]); }
  // marca que se ve de lejos: un punto verde oscuro con borde claro en cada parche (los árboles miden metros y desde 2 km no se distinguen)
  const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.Float32BufferAttribute(P.flatMap(p => [p.c[0], Y + 14, p.c[1]]), 3));
  const UA = { uA: { value: 0 }, uR: { value: Math.min(2, devicePixelRatio || 1) } };
  const marcas = new THREE.Points(gm, new THREE.ShaderMaterial({ uniforms: UA, transparent: true, depthWrite: false, depthTest: false, toneMapped: false,
    vertexShader: 'uniform float uR; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = 22.0 * uR; }',
    fragmentShader: `uniform float uA; void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q) * 2.0; if (d > 1.0) discard;
      float borde = smoothstep(0.78, 0.86, d) * (1.0 - smoothstep(0.92, 1.0, d)); vec3 c = mix(vec3(0.12, 0.42, 0.22), vec3(0.85, 1.0, 0.85), borde);
      float hoja = step(abs(q.x * 1.6) + abs(q.y + 0.08) * 1.1, 0.34) + step(length(q - vec2(0.0, 0.12)), 0.17);
      c = mix(c, vec3(0.75, 0.95, 0.6), clamp(hoja, 0.0, 1.0) * (1.0 - borde));
      gl_FragColor = vec4(c, uA * (d < 0.86 ? 0.95 : borde));
      #include <colorspace_fragment>
    }` }));
  marcas.renderOrder = 12; marcas.frustumCulled = false; grupo.add(marcas);
  // apoyar cada parche sobre el suelo real de la malla fotorrealista (rayos hacia abajo, como las huertas de parque)
  const rc = new THREE.Raycaster(), ab = new THREE.Vector3(0, -1, 0), P0 = new THREE.Vector3(); let hecho = false;
  const apoyar = () => { const tl = T3.tiles; if (hecho || !tl || !tl.group || !grupo.visible) return; const ys = [];
    for (const p of P.slice(0, 40)) { rc.set(P0.set(p.c[0], Y + 150, p.c[1]), ab); const hit = rc.intersectObject(tl.group, true)[0]; if (hit && Math.abs(hit.point.y - Y) < 30) ys.push(hit.point.y - Y); }
    if (ys.length > 8) { ys.sort((a, b) => a - b); grupo.position.y = ys[Math.floor(ys.length * 0.3)]; hecho = true; } };
  setInterval(apoyar, 2000);
  const cuadro = () => { requestAnimationFrame(cuadro); if (!grupo.visible) return; const y = T3.camera.position.y; UA.uA.value = Math.max(0, Math.min(1, (y - 220) / 300)); };
  requestAnimationFrame(cuadro);
  const n = todos.length, porEsp = Object.fromEntries(Object.keys(ESPECIES).map(k => [k, todos.filter(t => t.sp === k).length]));
  let dens = 1; // última densidad pedida por el slider (la leen los indicadores en 3D: solo cuentan los árboles con k < dens)
  return { grupo, ver(on) { grupo.visible = !!on; }, get dens() { return dens; }, densidad(d) { dens = d; for (const [im, ks] of DENS) { let lo = 0, hi = ks.length; while (lo < hi) { const m = (lo + hi) >> 1; if (ks[m] < d) lo = m + 1; else hi = m; } im.count = lo; } }, n, parches: P.length, porEsp };
}

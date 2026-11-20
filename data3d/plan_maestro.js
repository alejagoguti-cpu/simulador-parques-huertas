/* ============ Plan maestro «Bavaria Común · Distrito de Tecnologías Convergentes» (plan-maestro.html) ============
   Base: malla fotorrealista de Google (la misma del simulador). Encima va solo lo propuesto: retiros D1 y D2, accesos A·B·C,
   calle peatonal, calle de servicio, programa por edificio, 32 camas, resguardo del bosque y tres momentos de una jornada.
   Datos: data3d/plan_maestro.json (tools/plan_maestro_datos.js). */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MOVIL = matchMedia('(max-width:760px)').matches;
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
const D = await fetch('data3d/plan_maestro.json?v=1').then(r => r.json());
const [CX, CY] = D.centro;
const W = (x, y) => [x - CX, -(y - CY)];
const V3 = (x, y, h = 0) => { const [X, Z] = W(x, y); return new THREE.Vector3(X, h, Z); };
const cen = (p) => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];

/* ---------------- render ---------------- */
const host = $('#lienzo');
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOVIL ? 1.5 : 2)); renderer.setSize(innerWidth, innerHeight); host.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#0b1015');
const FOV = 30, cam = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 10, 60000);
scene.add(new THREE.HemisphereLight(0xdfe9f2, 0x1a1f24, 1.2));
const sol = new THREE.DirectionalLight(0xfff1dc, 1.8); sol.position.set(-600, 900, 400); scene.add(sol);

/* ---------------- malla fotorrealista de Google ---------------- */
const GKEY = 'AIzaSyCF2MXjc0DYRFrHk7j_BCyxVpWOdYqDIC4'; // la misma llave del simulador
const MXg = 111320 * Math.cos(4.63 * Math.PI / 180), MYg = 110540;
const aLL = (x, y) => [-74.17 + (x - 5193.24) / MXg, 4.63 + (y - 2090.06) / MYg];
const G = { tiles: null, dy: 0, M: null, luz: 1, luzObj: 1, mats: new Set(), t: 0, calib: 0 };
const gradoU = { uSat: { value: 1.15 }, uCon: { value: 0.92 }, uBri: { value: 1.15 } };
async function crearGoogle() {
  const [TR, PL] = await Promise.all([import('3d-tiles-renderer'), import('3d-tiles-renderer/plugins')]);
  const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
  const draco = new DRACOLoader().setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
  const tiles = new TR.TilesRenderer();
  tiles.registerPlugin(new PL.GoogleCloudAuthPlugin({ apiToken: GKEY, autoRefreshToken: true }));
  tiles.registerPlugin(new PL.GLTFExtensionsPlugin({ dracoLoader: draco }));
  tiles.setCamera(cam); tiles.setResolutionFromRenderer(cam, renderer); tiles.errorTarget = 40; G.meta = MOVIL ? 14 : 5;
  const q = aLL(CX, CY), D2R = Math.PI / 180, frame = new THREE.Matrix4();
  TR.WGS84_ELLIPSOID.getEastNorthUpFrame(q[1] * D2R, q[0] * D2R, frame);
  frame.multiply(new THREE.Matrix4().makeTranslation(0, 0, 2564));
  G.M = new THREE.Matrix4().makeRotationX(-Math.PI / 2).multiply(frame.invert());
  tiles.group.matrixAutoUpdate = false; aplicarG(tiles);
  tiles.addEventListener('load-model', ({ scene: s }) => s.traverse(c => {
    const m = c.isMesh && c.material; if (!m || !m.map) return;
    m.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (!m.isMeshBasicMaterial) { m.emissiveMap = m.map; m.emissive.setScalar(G.luz); m.color.setScalar(0); m.roughness = 1; m.metalness = 0; } else m.color.setScalar(G.luz);
    m.toneMapped = false;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, gradoU);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSat, uCon, uBri;')
        .replace('#include <opaque_fragment>', `{ vec3 c = max(outgoingLight - vec3(0.030, 0.036, 0.048), 0.0) / 0.96; float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = max(mix(vec3(l), c, uSat), 0.0); c += vec3(0.030, 0.040, 0.034) * (1.0 - smoothstep(0.0, 0.18, l)); outgoingLight = pow(c / 0.18, vec3(uCon)) * 0.18 * uBri; }
          #include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'gradoPlan'; m.needsUpdate = true; G.mats.add(m); c.renderOrder = -10;
  }));
  tiles.addEventListener('dispose-model', ({ scene: s }) => s.traverse(c => { if (c.isMesh) G.mats.delete(c.material); }));
  scene.add(tiles.group); G.tiles = tiles;
}
const aplicarG = (tl = G.tiles) => { tl.group.matrix.makeTranslation(0, G.dy, 0).multiply(G.M); tl.group.matrixWorldNeedsUpdate = true; tl.group.updateMatrixWorld(true); };
function calibrarG() {
  const st = G.tiles.stats; if (st.downloading + st.parsing > 4 || G.tiles.errorTarget > 12) return false;
  const rc = new THREE.Raycaster(), ab = new THREE.Vector3(0, -1, 0), hits = [];
  for (const [x, y] of D.entradas) for (const d of [[0, 0], [12, 0], [-12, 0], [0, 12], [0, -12]]) { const [X, Z] = W(x + d[0], y + d[1]); rc.set(new THREE.Vector3(X, 400, Z), ab); const h = rc.intersectObject(G.tiles.group, true)[0]; if (h && Math.abs(h.point.y) < 60) hits.push(h.point.y); }
  if (hits.length < 12) return false; hits.sort((a, b) => a - b); G.dy -= hits[Math.floor(hits.length * 0.25)]; aplicarG(); return true;
}
function actualizarG(dt) {
  const tl = G.tiles; if (!tl) return;
  try {
    tl.setResolutionFromRenderer(cam, renderer); cam.updateMatrixWorld(); tl.update();
    const st = tl.stats; if (tl.errorTarget > G.meta && st.downloading === 0 && st.parsing === 0 && st.visible > 3) tl.errorTarget = Math.max(G.meta, Math.round(tl.errorTarget * 0.62));
    G.t += dt; if (G.calib < 2 && G.t > [3, 12][G.calib]) { if (calibrarG()) G.calib++; else G.t = 0; }
    if (Math.abs(G.luz - G.luzObj) > 0.005) { G.luz += (G.luzObj - G.luz) * Math.min(1, dt * 4); for (const m of G.mats) { if (m.isMeshBasicMaterial) m.color.setScalar(G.luz); else m.emissive.setScalar(G.luz); } }
    if ((G.atrib = (G.atrib || 0) - dt) <= 0) { G.atrib = 2; const t = tl.getAttributions().filter(a => a.type === 'string').map(a => a.value).join(' · '); $('#atrib').textContent = /^google/i.test(t) ? t : 'Google' + (t ? ' · ' + t : ''); }
  } catch (err) { if (!G.fallo) { G.fallo = true; console.warn('malla', err); } }
}
crearGoogle().catch(err => console.warn('sin malla de Google', err));

/* ---------------- capas de la propuesta (encima de la foto) ---------------- */
const capas = {}; const nueva = (k) => { const g = new THREE.Group(); g.userData.a = 0; g.userData.obj = 0; scene.add(g); capas[k] = g; return g; };
const matB = (c, o = 0.85) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
const linea = (pts, c, ancho = 1) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: c, transparent: true, depthTest: false, linewidth: ancho })); l.renderOrder = 6; return l; };
const forma = (p) => { const s = new THREE.Shape(); p.forEach(([x, y], i) => { const [X, Z] = W(x, y); i ? s.lineTo(X, -Z) : s.moveTo(X, -Z); }); return s; };
const huella = (p, c, o, y = 0.6) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(forma(p)), matB(c, o)); m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 3; return m; };
const volumen = (p, h, c, o) => { const g = new THREE.ExtrudeGeometry(forma(p), { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, emissive: c, emissiveIntensity: 0.35 }));
  m.renderOrder = 4; const e = new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, depthTest: false })); e.renderOrder = 5; const gr = new THREE.Group(); gr.add(m, e); gr.userData.m = m; gr.userData.e = e; return gr; };

// 1. borde del predio
const cBorde = nueva('borde'); cBorde.add(linea(D.sitio.concat([D.sitio[0]]).map(([x, y]) => V3(x, y, 1)), '#e3a64a'));
// 2. calles de borde
const cCalles = nueva('calles'); D.calles.forEach(c => c.l.forEach(L => cCalles.add(linea(L.map(([x, y]) => V3(x, y, 1.5)), '#f2efe6'))));
// 3. programa: volúmenes de luz del color de cada uso
const cProg = nueva('prog'); const progVol = [];
D.prog.forEach(p => p.i.forEach(i => { const e = D.edif[i], v = volumen(e.p, e.h + 1, p.c, 0.5); v.userData.k = p.k; v.userData.h = e.h + 1; cProg.add(v); progVol.push(v); }));
// silos y combustible
const cResg = nueva('resg');
D.tanques.forEach(([x, y]) => { const r = new THREE.Mesh(new THREE.CircleGeometry(28, 48), matB('#e0664f', 0.28)); r.rotation.x = -Math.PI / 2; r.position.copy(V3(x, y, 0.8)); r.renderOrder = 3; cResg.add(r);
  const b = new THREE.Mesh(new THREE.RingGeometry(26, 28, 48), matB('#e0664f', 0.95)); b.rotation.x = -Math.PI / 2; b.position.copy(V3(x, y, 0.9)); b.renderOrder = 3; cResg.add(b); });
// 4. retiros D1 y D2: volumen rojo que desaparece y la plaza que aparece
const retiro = (k) => { const R = D.retiros[k], e = D.edif[R.i]; const v = volumen(e.p, e.h + 1.5, '#e0664f', 0.75); const g = nueva(k); g.add(v);
  const pl = new THREE.Group(); const c = cen(e.p); const r = Math.sqrt(R.a) * 0.9 + 8;
  const disco = new THREE.Mesh(new THREE.CircleGeometry(r, 64), matB(k === 'D1' ? '#e3a64a' : '#5fb3d9', 0.42)); disco.rotation.x = -Math.PI / 2; disco.position.copy(V3(c[0], c[1], 0.7)); disco.renderOrder = 3;
  const aro = new THREE.Mesh(new THREE.RingGeometry(r - 1.2, r, 64), matB('#ffffff', 0.95)); aro.rotation.x = -Math.PI / 2; aro.position.copy(V3(c[0], c[1], 0.8)); aro.renderOrder = 3;
  const pulso = new THREE.Mesh(new THREE.RingGeometry(r * 0.96, r, 64), matB(k === 'D1' ? '#e3a64a' : '#5fb3d9', 0.9)); pulso.rotation.x = -Math.PI / 2; pulso.position.copy(V3(c[0], c[1], 0.9)); pulso.renderOrder = 3;
  pl.add(disco, aro, pulso); const gp = nueva(k + 'p'); gp.add(pl); return { v, gp, pulso, r }; };
const RD1 = retiro('D1'), RD2 = retiro('D2');
// 5. accesos A·B·C: faro vertical con pulso
const cPuertas = nueva('puertas'); const faros = [];
Object.entries(D.puertas).forEach(([k, P]) => { const col = { A: '#e3a64a', B: '#e0664f', C: '#5fb3d9' }[k];
  const f = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 60, 12), matB(col, 0.9)); f.position.copy(V3(P.p[0], P.p[1], 30)); f.renderOrder = 6;
  const p = new THREE.Mesh(new THREE.RingGeometry(10, 12, 48), matB(col, 0.9)); p.rotation.x = -Math.PI / 2; p.position.copy(V3(P.p[0], P.p[1], 1)); p.renderOrder = 6; cPuertas.add(f, p); faros.push(p); });
// 6. recorridos: línea + partículas que avanzan
const curva = (pts, h) => new THREE.CatmullRomCurve3(pts.map(([x, y]) => V3(x, y, h)), false, 'centripetal', 0.2);
const RUTAS = { peatonal: { c: '#e3a64a', n: 90, v: 0.035 }, servicio: { c: '#5fb3d9', n: 40, v: 0.05 }, trabajo: { c: '#8fc46a', n: 26, v: 0.06 }, canastilla: { c: '#8fc46a', n: 0 } };
const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, '#fff'); g.addColorStop(0.35, '#fffd'); g.addColorStop(1, '#fff0'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const flujos = {};
for (const [k, r] of Object.entries(RUTAS)) {
  const cu = curva(D.rutas[k], 3), g = nueva('r_' + k);
  const tubo = new THREE.Mesh(new THREE.TubeGeometry(cu, 200, k === 'peatonal' ? 3.2 : 2.2, 6, false), matB(r.c, 0.55)); tubo.renderOrder = 5; g.add(tubo);
  let pts = null; if (r.n) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(r.n * 3), 3));
    pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: MOVIL ? 14 : 11, sizeAttenuation: false, map: dotTex, color: r.c, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending })); pts.renderOrder = 7; pts.frustumCulled = false; g.add(pts); }
  flujos[k] = { cu, pts, r, tubo };
}
// 7. cultivos: 32 camas de 1,25 × 10 m en 4 módulos (A y B bajo invernadero)
const cCult = nueva('cult'); const MODCOL = { A: '#8fc46a', B: '#b9e07a', C: '#6fae4e', D: '#d9c36a' }; const ang = D.angulo;
const camaGeo = new THREE.BoxGeometry(1.25, 0.6, 10); camaGeo.translate(0, 0.3, 0);
const camas = D.camas.map(([x, y, m], k) => { const c = new THREE.Mesh(camaGeo, matB(MODCOL[m], 0.95)); c.position.copy(V3(x, y, 0)); c.rotation.y = ang; c.renderOrder = 6; c.userData.k = k; cCult.add(c); return c; });
const piso = new THREE.Mesh(new THREE.PlaneGeometry(44, 28), matB('#3d3020', 0.55)); piso.rotation.x = -Math.PI / 2; piso.rotation.z = ang; piso.position.copy(V3(D.patio[0], D.patio[1], 0.5)); piso.renderOrder = 3; cCult.add(piso);
const cInv = nueva('inv'); D.inv.forEach(({ c }) => { const g = new THREE.BoxGeometry(20, 4.2, 12); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#d8efe9', transparent: true, opacity: 0.22, depthWrite: false })); m.position.copy(V3(c[0], c[1], 2.1)); m.rotation.y = ang; m.renderOrder = 7;
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: '#e8fff8', transparent: true, depthTest: false })); e.position.copy(m.position); e.rotation.y = ang; e.renderOrder = 8; cInv.add(m, e); });
// 8. bosque: puntos de observación de borde
const cObs = nueva('obs'); D.obs.forEach(([x, y]) => { const r = new THREE.Mesh(new THREE.RingGeometry(9, 11, 40), matB('#8fc46a', 0.95)); r.rotation.x = -Math.PI / 2; r.position.copy(V3(x, y, 1.2)); r.renderOrder = 6;
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 26, 8), matB('#8fc46a', 0.9)); p.position.copy(V3(x, y, 13)); p.renderOrder = 6; cObs.add(r, p); });
// 9. agentes de la jornada (camiones, canastillas, estudiantes, vecinos)
const nAg = 220, agGeo = new THREE.BufferGeometry(), agPos = new Float32Array(nAg * 3), agCol = new Float32Array(nAg * 3);
agGeo.setAttribute('position', new THREE.BufferAttribute(agPos, 3)); agGeo.setAttribute('color', new THREE.BufferAttribute(agCol, 3));
const cAg = nueva('ag'); const agPts = new THREE.Points(agGeo, new THREE.PointsMaterial({ size: MOVIL ? 12 : 10, sizeAttenuation: false, map: dotTex, vertexColors: true, transparent: true, depthTest: false, depthWrite: false })); agPts.frustumCulled = false; agPts.renderOrder = 9; cAg.add(agPts);
const camion = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 2.6), matB('#5fb3d9', 0.95)); camion.renderOrder = 9; const camion2 = camion.clone(); cAg.add(camion, camion2);
const estaciones = () => [D.prog[0], D.prog[1], null, D.prog[2]].map(p => p ? cen(D.edif[p.i[0]].p) : D.patio);
const ST = estaciones(), ag = Array.from({ length: nAg }, (_, i) => ({ r: Math.random(), a: Math.random() * 6.28, g: i % 4 }));

/* ---------------- etiquetas HTML ---------------- */
const etq = [], capaEt = $('#etiquetas');
const addEt = (html, pos, grupos, cls = '') => { const d = document.createElement('div'); d.className = 'et ' + cls; d.innerHTML = html; d.style.opacity = 0; capaEt.appendChild(d); etq.push({ d, pos, grupos: new Set(grupos) }); return d; };
const ePt = (x, y, h) => V3(x, y, h);
Object.entries(D.puertas).forEach(([k, P]) => addEt(`<b class="lt" style="--c:${{ A: '#e3a64a', B: '#e0664f', C: '#5fb3d9' }[k]}">${k}</b>${P.n}<small>${P.q}</small>`, ePt(P.p[0], P.p[1], 64), ['puertas', 'rutas', 'manana', 'barrial', 'hoy']));
D.prog.forEach(p => { const c = cen(D.edif[p.i[0]].p); addEt(`<i style="background:${p.c}"></i>${p.n}<small>${p.m2} m² útiles</small>`, ePt(c[0], c[1], D.edif[p.i[0]].h + 8), ['prog', 'plan', 'clase']); });
{ const c = cen(D.edif[D.silos].p); addEt('<i style="background:#cfd6d3"></i>Silos<small>referencia para orientarse</small>', ePt(c[0], c[1], 40), ['prog', 'resg', 'plan']); }
D.tanques.forEach(([x, y], k) => { if (!k) addEt('<i style="background:#e0664f"></i>Antiguo combustible<small>fuera de la 1.ª etapa hasta verificar</small>', ePt(x, y, 10), ['resg']); });
addEt('<i style="background:#8fc46a"></i>Observación de borde<small>2 puntos · equipos de 12</small>', ePt(D.obs[0][0], D.obs[0][1], 30), ['resg', 'clase']);
const etD1a = addEt('<b class="lt" style="--c:#e0664f">D1</b>Retiro selectivo<small>anexo de acceso · ' + D.retiros.D1.a + ' m²</small>', ePt(D.retiros.D1.c[0], D.retiros.D1.c[1], 16), ['d1a']);
addEt('<b class="lt" style="--c:#e3a64a">D1</b>Plaza de llegada<small>bancas · bicicletas · grupo de 24</small>', ePt(D.retiros.D1.c[0], D.retiros.D1.c[1], 10), ['d1b', 'plan', 'rutas']);
addEt('<b class="lt" style="--c:#e0664f">D2</b>Retiro selectivo<small>anexo de servicio · ' + D.retiros.D2.a + ' m²</small>', ePt(D.retiros.D2.c[0], D.retiros.D2.c[1], 16), ['d2a']);
addEt('<b class="lt" style="--c:#5fb3d9">D2</b>Patio de intercambio<small>canastillas en la mañana · demostraciones después</small>', ePt(D.retiros.D2.c[0], D.retiros.D2.c[1], 10), ['d2b', 'plan', 'manana', 'barrial']);
const etRuta = (k, n, sub, f = 0.5) => { const p = flujos[k].cu.getPoint(f); addEt(`<i style="background:${RUTAS[k].c}"></i>${n}<small>${sub}</small>`, p.clone().setY(14), ['rutas']); };
etRuta('peatonal', 'Calle peatonal pública', '71B → plaza → instituto → memoria → mercado → 7A', 0.42); etRuta('servicio', 'Calle de servicio', 'Boyacá → poscosecha → mercado (sin cruzar compradores)', 0.4); etRuta('trabajo', 'Paso aula · cultivo · laboratorio', 'estudiantes y carritos', 0.5);
['A', 'B', 'C', 'D'].forEach((m, k) => { const c = D.camas[k * 8 + 4]; addEt(`<b class="lt" style="--c:${MODCOL[m]}">${m}</b>${['Cubierto · lechuga referencia', 'Cubierto · ensayo biológico', 'Exterior · lechuga', 'Exterior · acelga y cilantro por pedido'][k]}`, ePt(c[0], c[1], k < 2 ? 9 : 4), ['cult']); });
const etMom = addEt('', ePt(D.patio[0], D.patio[1], 60), ['manana', 'clase', 'barrial'], 'mom');

/* ---------------- escenas ---------------- */
// cam: s = tamaño visible (m), az = rumbo, el = elevación, t = objetivo [x, y] del modelo
const cPred = cen(D.rutas.peatonal.concat(D.rutas.servicio)), cProgC = cen(D.edif[D.prog[2].i[0]].p); // encuadre: el conjunto del plan, no el centro del predio
const E = {
  portada: { cam: { s: 1500, az: -35, el: 32 }, on: ['borde', 'prog', 'D1p', 'D2p', 'cult', 'inv', 'r_peatonal'], giro: 1, luz: 1 },
  hoy: { cam: { s: 1350, az: -35, el: 40 }, on: ['borde', 'calles', 'puertas'], et: 'hoy', luz: 1, ley: 'hoy' },
  d1a: { cam: { s: 340, az: -20, el: 38, t: D.retiros.D1.c }, on: ['borde', 'D1'], et: 'd1a', luz: 0.8, ley: 'retiro' },
  d1b: { cam: { s: 340, az: -20, el: 38, t: D.retiros.D1.c }, on: ['borde', 'D1p', 'r_peatonal'], et: 'd1b', luz: 0.8, ley: 'plaza1' },
  d2a: { cam: { s: 340, az: 20, el: 38, t: D.retiros.D2.c }, on: ['borde', 'D2'], et: 'd2a', luz: 0.8, ley: 'retiro' },
  d2b: { cam: { s: 340, az: 20, el: 38, t: D.retiros.D2.c }, on: ['borde', 'D2p', 'r_servicio'], et: 'd2b', luz: 0.8, ley: 'plaza2' },
  puertas: { cam: { s: 1350, az: -35, el: 48 }, on: ['borde', 'calles', 'puertas'], et: 'puertas', luz: 0.75, ley: 'puertas' },
  rutas: { cam: { s: 1250, az: -35, el: 50 }, on: ['borde', 'puertas', 'D1p', 'D2p', 'r_peatonal', 'r_servicio', 'r_trabajo'], et: 'rutas', luz: 0.6, ley: 'rutas' },
  prog: { cam: { s: 1050, az: -40, el: 40, t: cProgC }, on: ['borde', 'prog', 'D1p', 'D2p'], et: 'prog', luz: 0.6, ley: 'prog' },
  cult: { cam: { s: 140, az: -30, el: 42, t: D.patio }, on: ['cult', 'inv'], et: 'cult', luz: 0.75, ley: 'cult' },
  resg: { cam: { s: 1150, az: 10, el: 46 }, on: ['borde', 'resg', 'obs', 'cult'], et: 'resg', luz: 0.85, ley: 'resg' },
  manana: { cam: { s: 1100, az: -35, el: 46 }, on: ['borde', 'prog', 'puertas', 'D2p', 'r_servicio', 'ag'], et: 'manana', luz: 0.55, ley: 'manana', mom: 'manana' },
  clase: { cam: { s: 1000, az: -35, el: 46 }, on: ['borde', 'prog', 'cult', 'inv', 'r_trabajo', 'ag', 'obs'], et: 'clase', luz: 0.55, ley: 'clase', mom: 'clase' },
  barrial: { cam: { s: 1100, az: -35, el: 46 }, on: ['borde', 'prog', 'puertas', 'D2p', 'r_peatonal', 'ag'], et: 'barrial', luz: 0.55, ley: 'barrial', mom: 'barrial' },
  plan: { cam: { s: 1450, az: -35, el: 36 }, on: ['borde', 'calles', 'prog', 'puertas', 'D1p', 'D2p', 'cult', 'inv', 'r_peatonal', 'r_servicio', 'r_trabajo', 'obs', 'resg'], et: 'plan', giro: 1, luz: 0.7, ley: 'plan' },
};
const LEYB = (t, f) => `<div class="t">${t}</div>` + f.map(([c, n]) => `<div class="f"><i style="background:${c}"></i>${n}</div>`).join('');
const LEY = {
  hoy: LEYB('El predio hoy', [['#e3a64a', 'Límite de la antigua fábrica'], ['#f2efe6', 'Transversal 71B · Calle 7A · Av. Boyacá']]),
  retiro: LEYB('Retiro selectivo propuesto', [['#e0664f', 'Pieza a desmontar (verificar deterioro en inspección)']]),
  plaza1: LEYB('Después del retiro D1', [['#e3a64a', 'Plaza de llegada desde la 71B'], ['#e3a64a', 'Inicio de la calle peatonal']]),
  plaza2: LEYB('Después del retiro D2', [['#5fb3d9', 'Patio de intercambio'], ['#5fb3d9', 'Calle de servicio']]),
  puertas: LEYB('Tres accesos', [['#e3a64a', 'A · 71B · instituto'], ['#e0664f', 'B · Calle 7A · mercado'], ['#5fb3d9', 'C · Boyacá · operación']]),
  rutas: LEYB('Vías interiores', [['#e3a64a', 'Calle peatonal pública'], ['#5fb3d9', 'Calle de servicio'], ['#8fc46a', 'Paso aula · cultivo · laboratorio']]),
  prog: LEYB('Programa · 1.ª etapa', D.prog.map(p => [p.c, `${p.n} · ${p.m2} m²`]).concat([['#8fc46a', 'Patio de cultivo · 800 m²']])),
  cult: LEYB('32 camas · 1,25 × 10 m', [['#8fc46a', 'A · cubierto · referencia'], ['#b9e07a', 'B · cubierto · ensayo'], ['#6fae4e', 'C · exterior'], ['#d9c36a', 'D · exterior · por pedido']]),
  resg: LEYB('Resguardo', [['#8fc46a', 'Observación de borde (sin abrir calzada)'], ['#e0664f', 'Antiguo combustible: fuera de la 1.ª etapa']]),
  manana: LEYB('En la mañana', [['#5fb3d9', 'Productores entran por Boyacá'], ['#8fc46a', 'Canastillas a poscosecha y al mercado'], ['#e3a64a', 'Estudiantes entran por la 71B']]),
  clase: LEYB('Durante la clase', [['#e3a64a', 'Aula'], ['#8fc46a', 'Cultivo'], ['#a98bd6', 'Laboratorio'], ['#e0664f', 'Mercado'], ['#ffffff', '4 grupos de 24 rotan']]),
  barrial: LEYB('Jornada barrial', [['#e0664f', 'Vecinos entran por la Calle 7A'], ['#5fb3d9', 'Patio D2: demostraciones'], ['#e3a64a', 'El instituto puede cerrar; el mercado sigue']]),
  plan: LEYB('Plan maestro', D.prog.map(p => [p.c, p.n]).concat([['#8fc46a', 'Cultivos y bosque'], ['#e3a64a', 'Calle peatonal']])),
};
const MOM = { manana: 'Mañana · llegan los productores', clase: 'Clase · 4 grupos rotan', barrial: 'Jornada barrial · abre el mercado' };

/* ---------------- cámara ---------------- */
const controles = new OrbitControls(cam, renderer.domElement); controles.enabled = false; controles.enableDamping = true;
let escena = 'portada', camObj = null, giroAz = 0, explorar = false, giro = !QUIETO, momento = null, tMom = 0;
const camAct = { s: 1500, az: -35, el: 32, x: 0, z: 0 };
const distCam = (s) => { const asp = innerWidth / innerHeight; const vh = asp >= 1 ? s : s / asp; return vh / 2 / Math.tan(FOV / 2 * Math.PI / 180); };
const ajustarCam = () => { const w = innerWidth, h = innerHeight, fx = explorar || MOVIL ? 0.5 : (w > 1000 ? 0.63 : 0.56), fy = explorar ? 0.5 : MOVIL ? 0.34 : 0.5;
  cam.aspect = w / h; cam.setViewOffset(w, h, w / 2 - fx * w, h / 2 - fy * h, w, h); const R = cam.position.distanceTo(controles.target); cam.near = Math.max(2, R * 0.05); cam.far = R * 4 + 4000; cam.updateProjectionMatrix(); };
const ponerCam = () => { const az = (camAct.az + giroAz) * Math.PI / 180, el = camAct.el * Math.PI / 180, R = distCam(camAct.s), t = new THREE.Vector3(camAct.x, 0, camAct.z);
  cam.position.set(t.x + R * Math.cos(el) * Math.sin(az), R * Math.sin(el), t.z + R * Math.cos(el) * Math.cos(az)); cam.lookAt(t); controles.target.copy(t); ajustarCam(); };
const setEscena = (k) => { const e = E[k]; if (!e) return; escena = k; const t = e.cam.t ? W(...e.cam.t) : W(...cPred);
  camObj = { s: e.cam.s * (MOVIL ? 0.7 : 1), az: e.cam.az, el: e.cam.el, x: t[0], z: t[1] }; giroAz = 0;
  for (const c in capas) capas[c].userData.obj = e.on.includes(c) ? 1 : 0; G.luzObj = e.luz ?? 1;
  if (e.mom !== momento) { momento = e.mom || null; tMom = 0; if (momento) etMom.innerHTML = MOM[momento]; }
  $('#leyenda').innerHTML = LEY[e.ley] || ''; };
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); if (!explorar) ajustarCam(); });
$('#b-giro').setAttribute('aria-pressed', String(giro)); $('#b-giro').onclick = (ev) => { giro = !giro; ev.currentTarget.setAttribute('aria-pressed', String(giro)); };
$('#b-explorar').onclick = (ev) => { explorar = !explorar; ev.currentTarget.setAttribute('aria-pressed', String(explorar)); document.body.classList.toggle('explorar', explorar); controles.enabled = explorar; ev.currentTarget.textContent = explorar ? 'Volver al relato' : 'Explorar el 3D'; };

/* ---------------- bucle ---------------- */
const reloj = new THREE.Clock(), tmp = new THREE.Vector3(), C3 = (h) => new THREE.Color(h);
const COLS = { est: C3('#e3a64a'), can: C3('#8fc46a'), vec: C3('#e0664f'), g: [C3('#e3a64a'), C3('#a98bd6'), C3('#8fc46a'), C3('#e0664f')] };
const opacGrupo = (g, a) => { g.visible = a > 0.01; g.traverse(o => { if (o.material) { if (o.material.userData.base === undefined) o.material.userData.base = o.material.opacity; o.material.opacity = o.material.userData.base * a; } }); };
function cuadro() {
  const dt = Math.min(0.05, reloj.getDelta()), t = reloj.elapsedTime, f = 1 - Math.pow(0.003, dt);
  if (!explorar && camObj) { for (const k of ['s', 'el', 'x', 'z', 'az']) camAct[k] += (camObj[k] - camAct[k]) * f; if (giro && E[escena].giro) giroAz += dt * 2; else giroAz += (0 - giroAz) * f; ponerCam(); }
  if (explorar) controles.update();
  for (const k in capas) { const g = capas[k]; g.userData.a += (g.userData.obj - g.userData.a) * f; opacGrupo(g, g.userData.a); }
  // el programa sube desde el suelo; los retiros bajan
  progVol.forEach(v => { const s = Math.max(0.02, capas.prog.userData.a); v.scale.y = s; });
  RD1.v.scale.y = Math.max(0.02, capas.D1.userData.a); RD2.v.scale.y = Math.max(0.02, capas.D2.userData.a);
  for (const R of [RD1, RD2]) { const ph = (t * 0.5) % 1, s = 0.3 + ph * 0.9; R.pulso.scale.set(s, s, 1); R.pulso.material.opacity = (1 - ph) * 0.9 * R.gp.userData.a; }
  faros.forEach((p, i) => { const ph = (t * 0.6 + i * 0.33) % 1, s = 0.6 + ph * 2.4; p.scale.set(s, s, 1); p.material.opacity = (1 - ph) * capas.puertas.userData.a; });
  // partículas por los recorridos
  for (const [k, F] of Object.entries(flujos)) { if (!F.pts || !F.pts.parent.visible) continue; const a = F.pts.geometry.attributes.position.array, n = F.r.n;
    for (let i = 0; i < n; i++) { const u = ((QUIETO ? 0 : t * F.r.v) + i / n) % 1; F.cu.getPoint(u, tmp); a[i * 3] = tmp.x; a[i * 3 + 1] = tmp.y + 1; a[i * 3 + 2] = tmp.z; } F.pts.geometry.attributes.position.needsUpdate = true; }
  // camas que crecen al entrar
  camas.forEach((c, k) => { const q = Math.min(1, Math.max(0.05, capas.cult.userData.a * 1.6 - (k % 8) * 0.07)); c.scale.y = q; });
  // agentes de la jornada
  if (capas.ag.visible && momento) {
    tMom += dt; const pos = agGeo.attributes.position.array, col = agGeo.attributes.color.array;
    const serv = flujos.servicio.cu, peat = flujos.peatonal.cu, tr = flujos.trabajo.cu;
    for (let i = 0; i < nAg; i++) { const A = ag[i]; let c = COLS.est, p;
      if (momento === 'manana') {
        if (i < 70) { const u = (t * 0.05 + A.r) % 1; p = serv.getPoint(Math.min(1, 0.45 + u * 0.55), tmp).clone(); p.x += Math.sin(A.a) * 3; p.z += Math.cos(A.a) * 3; c = COLS.can; }
        else if (i < 166) { const u = (t * 0.03 + A.r) % 1; p = peat.getPoint(u * 0.32, tmp).clone(); p.x += Math.sin(A.a) * 4; p.z += Math.cos(A.a) * 4; }
        else { p = new THREE.Vector3(0, -999, 0); }
      } else if (momento === 'clase') {
        const g = A.g, st = ST[(g + Math.floor(t / 6)) % 4], ph = (t % 6) / 6, nx = ST[(g + Math.floor(t / 6) + 1) % 4];
        const mov = ph > 0.8 ? (ph - 0.8) / 0.2 : 0, cx = st[0] + (nx[0] - st[0]) * mov, cy = st[1] + (nx[1] - st[1]) * mov;
        const rr = 6 + (i % 24) * 0.5; p = V3(cx + Math.cos(A.a + t * 0.3) * rr, cy + Math.sin(A.a + t * 0.3) * rr, 2); c = COLS.g[(g + Math.floor(t / 6)) % 4];
        if (i >= 96) p.y = -999;
      } else if (momento === 'barrial') {
        if (i < 150) { const u = (t * 0.035 + A.r) % 1; p = peat.getPoint(1 - u * 0.45, tmp).clone(); p.x += Math.sin(A.a) * 5; p.z += Math.cos(A.a) * 5; c = COLS.vec; }
        else { const d2 = D.retiros.D2.c, rr = 4 + (i % 30) * 0.8; p = V3(d2[0] + Math.cos(A.a + t * 0.2) * rr, d2[1] + Math.sin(A.a + t * 0.2) * rr, 2); c = COLS.can; }
      }
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y + 1.5; pos[i * 3 + 2] = p.z; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    agGeo.attributes.position.needsUpdate = true; agGeo.attributes.color.needsUpdate = true;
    const vis = momento === 'manana'; camion.visible = camion2.visible = vis;
    if (vis) { [camion, camion2].forEach((m, j) => { const u = ((t * 0.04 + j * 0.5) % 1) * 0.5; serv.getPoint(u, tmp); m.position.set(tmp.x, 2, tmp.z); serv.getPoint(Math.min(1, u + 0.01), m.userData.v || (m.userData.v = new THREE.Vector3())); m.lookAt(m.userData.v.x, 2, m.userData.v.z); m.rotateY(Math.PI / 2); }); }
  }
  actualizarG(dt); if (explorar) ajustarCam();
  // etiquetas
  const w = innerWidth, h = innerHeight, grupo = E[escena].et, vis = [];
  for (const e of etq) { const on = !explorar && grupo && e.grupos.has(grupo); if (!on) { if (e.d.style.opacity !== '0') e.d.style.opacity = 0; continue; }
    tmp.copy(e.pos).project(cam); const x = (tmp.x + 1) / 2 * w, y = (1 - tmp.y) / 2 * h; e.sx = x; e.sy = y; e.vis = tmp.z < 1 && x > 0 && x < w && y > 0 && y < h; vis.push(e); }
  vis.sort((a, b) => a.sy - b.sy); const puestos = [];
  for (const e of vis) { const ww = e.d.offsetWidth || 140, hh = e.d.offsetHeight || 34; let y = e.sy; for (const p of puestos) if (Math.abs(p.x - e.sx) < (p.w + ww) / 2 + 6 && Math.abs(p.y - y) < hh + 4) y = p.y + hh + 4; puestos.push({ x: e.sx, y, w: ww }); e.d.style.left = e.sx + 'px'; e.d.style.top = y + 'px'; e.d.style.opacity = e.vis ? 1 : 0; }
  renderer.render(scene, cam); requestAnimationFrame(cuadro);
}
const forzada = new URLSearchParams(location.search).get('escena');
setEscena(forzada && E[forzada] ? forzada : 'portada'); Object.assign(camAct, camObj); ponerCam();
for (const c in capas) capas[c].userData.a = capas[c].userData.obj;
if (forzada) { document.querySelector('main').style.display = 'none'; }
requestAnimationFrame(cuadro);
const io = new IntersectionObserver((ents) => { for (const en of ents) if (en.isIntersecting) setEscena(en.target.dataset.escena); }, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-escena]').forEach(p => io.observe(p));
setTimeout(() => $('#carga').classList.add('fuera'), 400);

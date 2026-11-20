/* ============ HUERTA CIRCULAR DE CUBIERTAS EFÍMERAS ============
   La huerta del prado circular de la Biblioteca El Tintal, como pieza reutilizable (también la usan los parques-huerta de la red
   de colegios, data3d/colegios_red.js): prado de pasto, bancales orgánicos de concreto claro con plantas reales (modelos de
   Poly Haven), composteras, bancas, y 6 cubiertas de lóbulos con membrana traslúcida, costillas blancas y borde tubular sobre
   columnas-árbol. Todo se escala con el radio (la del Tintal mide 41,7 m). Las plantas de alta resolución solo se prenden de cerca. */
const MOD = ['fern_02', 'calathea_orbifolia_01', 'nettle_plant', 'periwinkle_plant', 'celandine_01'];
let CARGA = null; // los modelos de plantas se bajan una sola vez para todas las huertas
async function plantas(THREE) {
  if (!CARGA) CARGA = (async () => {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'), { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
    const cargador = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    return Promise.all(MOD.map(n => cargador.loadAsync('data3d/models/' + n + '.glb').catch(e => { console.warn('planta', n, e); return null; })));
  })();
  return CARGA;
}
export async function crearHuertaCircular({ THREE, T3, c, r, Y0 = 0.85, movil = false, semilla = 31, flores = true }) {
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const grupo = new THREE.Group(); grupo.name = 'huerta-circular';
  const ANIS = Math.min(8, T3.renderer.capabilities.getMaxAnisotropy ? T3.renderer.capabilities.getMaxAnisotropy() : 4);
  const lienzo = (w, h, f, rep) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANIS; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t; };
  let semH = semilla; const rnd = () => ((semH = (semH * 16807) % 2147483647) / 2147483647);
  const HC = c, R = r - 1.5, k = R / 40.2, kh = Math.max(0.72, k); // escala horizontal y de alturas respecto a la del Tintal
  const o3 = new THREE.Object3D();
  const tl = new THREE.TextureLoader(), pasto = tl.load('data3d/textures/pasto_color.jpg'), pastoN = tl.load('data3d/textures/pasto_normal.jpg'); for (const t of [pasto, pastoN]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(R / 3, R / 3); } pasto.colorSpace = THREE.SRGBColorSpace;
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(R, 72).rotateX(-Math.PI / 2).translate(HC[0], Y0 + 0.5, HC[1]), new THREE.MeshStandardMaterial({ map: pasto, normalMap: pastoN, roughness: 0.95, color: 0xd8e6c8 }));
  plaza.receiveShadow = !movil; grupo.add(plaza);
  { const madera = new THREE.MeshStandardMaterial({ color: 0x7a5a3c, roughness: 0.95 }), comp = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 1 }); // composteras de madera
    const nk = R > 25 ? 6 : 3;
    for (let q = 0; q < nk; q++) { const a = q / nk * Math.PI * 2 + 0.45, rr = R - 6 * Math.max(0.6, k); for (let j = 0; j < 3; j++) { const x = HC[0] + Math.cos(a) * rr + Math.cos(a + 1.57) * (j - 1) * 1.6, z = HC[1] + Math.sin(a) * rr + Math.sin(a + 1.57) * (j - 1) * 1.6; const caja = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.4).translate(0, 0.45, 0), madera); caja.position.set(x, Y0 + 0.5, z); caja.rotation.y = -a; caja.castShadow = !movil; grupo.add(caja); const mon = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 6, 0, 6.29, 0, 1.3).scale(1, 0.5, 1), comp); mon.position.set(x, Y0 + 1.25, z); grupo.add(mon); } } }
  const blob = (cx, cz, r0, rot, k1, k2, n = 64) => { const P = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; const rr = r0 * (1 + k1 * Math.sin(3 * t + rot) + k2 * Math.sin(5 * t + rot * 1.7)); P.push([cx + Math.cos(t) * rr, cz + Math.sin(t) * rr]); } return P; };
  const dentroP = (W, x, z) => { let cc = false; for (let i = 0, j = W.length - 1; i < W.length; j = i++) { const a = W[i], b = W[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) cc = !cc; } return cc; };
  // bancales orgánicos: 1 grande al centro, 7 alrededor y 9 pequeños
  const camas = [blob(HC[0], HC[1], 9.5 * k, 0.4, 0.14, 0.06)];
  for (let q = 0; q < 7; q++) { const a = q / 7 * Math.PI * 2 + 0.3, rr = R * 0.64; camas.push(blob(HC[0] + Math.cos(a) * rr, HC[1] + Math.sin(a) * rr, (6.8 + rnd() * 2.4) * k, rnd() * 6, 0.22, 0.08)); }
  for (let q = 0; q < 9; q++) { const a = q / 9 * Math.PI * 2 + 0.65, rr = R * 0.36; camas.push(blob(HC[0] + Math.cos(a) * rr, HC[1] + Math.sin(a) * rr, Math.max(1.4, (2.6 + rnd() * 1.2) * k), rnd() * 6, 0.18, 0.06)); }
  const matBord = new THREE.MeshStandardMaterial({ color: 0xc9c5bc, roughness: 0.85 }), matTierra = new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 1 });
  for (const W of camas) {
    let mx = 0, mz = 0; for (const p of W) { mx += p[0]; mz += p[1]; } mx /= W.length; mz /= W.length;
    const ins = W.map(p => { const dx = p[0] - mx, dz = p[1] - mz, d = Math.hypot(dx, dz) || 1, kk = Math.max(0, d - 0.4) / d; return [mx + dx * kk, mz + dz * kk]; });
    const sh = new THREE.Shape(W.map(p => new THREE.Vector2(p[0], -p[1]))); sh.holes.push(new THREE.Path(ins.slice().reverse().map(p => new THREE.Vector2(p[0], -p[1]))));
    const ex = new THREE.ExtrudeGeometry(sh, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 4 }).rotateX(-Math.PI / 2).translate(0, Y0 + 0.1, 0);
    const m = new THREE.Mesh(ex, matBord); m.castShadow = m.receiveShadow = !movil; grupo.add(m);
    const t = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(ins.map(p => new THREE.Vector2(p[0], -p[1])))).rotateX(-Math.PI / 2).translate(0, Y0 + 0.55, 0), matTierra); t.receiveShadow = !movil; grupo.add(t);
  }
  // cubiertas: 6 lóbulos alargados que se cruzan, con membrana traslúcida, costillas blancas y borde tubular
  const texCost = lienzo(64, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; for (let y = 0; y < h; y += 22) g.fillRect(0, y, w, 2); g.fillRect(0, 0, 2, h); }, true);
  const matCost = new THREE.MeshStandardMaterial({ color: 0xf6f6f2, map: texCost, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.4 });
  const matMemb = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.DoubleSide, roughness: 0.3, depthWrite: false });
  const matCol = new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.35, metalness: 0.2 });
  const TECHOV = [];
  const lobulos = []; for (let q = 0; q < 6; q++) { const a = q / 6 * Math.PI * 2 + 0.6; lobulos.push({ cx: HC[0] + Math.cos(a) * R * 0.38, cz: HC[1] + Math.sin(a) * R * 0.38, rot: a + (rnd() - 0.5) * 0.8, A: (13 + rnd() * 5) * k, B: (5.5 + rnd() * 2) * k, H: (6.2 + rnd() * 2.8) * kh }); }
  for (const L of lobulos) {
    const NU = 40, NV = 14, P = [], U = [], I = [], cs = Math.cos(L.rot), sn = Math.sin(L.rot);
    const borde = (t) => { const s = Math.sin(t), cc = Math.cos(t), rr = 1 + 0.12 * Math.sin(2 * t) + 0.08 * Math.sin(3 * t + L.rot); return [cc * L.A * rr, s * L.B * (1 + 0.25 * Math.cos(t * 2))]; };
    for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
      const t = i / NU * Math.PI * 2, f = j / NV, e = borde(t), x = e[0] * f, z = e[1] * f, y = L.H + 1.8 * kh * (1 - f * f) - 0.6 * kh * Math.cos(t * 2) * f;
      P.push(L.cx + x * cs - z * sn, Y0 + y, L.cz + x * sn + z * cs); U.push(f, t / (Math.PI * 2) * 12);
      if (i < NU && j < NV) { const a = i * (NV + 1) + j, b = a + NV + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
    const m1 = new THREE.Mesh(g, matMemb), m2 = new THREE.Mesh(g, matCost); m2.castShadow = !movil; grupo.add(m1, m2);
    for (let s = 0; s < 30; s++) { const t = rnd() * Math.PI * 2, f = 0.15 + 0.75 * Math.sqrt(rnd()), e = borde(t), x = e[0] * f, z = e[1] * f, y = L.H + 1.8 * kh * (1 - f * f) - 0.6 * kh * Math.cos(t * 2) * f; TECHOV.push([L.cx + x * cs - z * sn, Y0 + y + 0.05, L.cz + x * sn + z * cs]); }
    const borP = []; for (let i = 0; i < 80; i++) { const t = i / 80 * Math.PI * 2, e = borde(t); borP.push(new THREE.Vector3(L.cx + e[0] * cs - e[1] * sn, Y0 + L.H - 0.6 * kh * Math.cos(t * 2), L.cz + e[0] * sn + e[1] * cs)); }
    const tubo = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(borP, true), 160, 0.09, 6, true), matCol); tubo.castShadow = !movil; grupo.add(tubo);
    for (const fx of [-0.45, 0.45]) { // columnas-árbol: fuste que se abre en 4 ramas hasta la cubierta
      const bx = L.cx + fx * L.A * cs, bz = L.cz + fx * L.A * sn, tope = Y0 + 3.6 * kh, ram = [];
      const tramo = (a, b, r0, r1) => { const d = b.clone().sub(a), Lh = d.length(), g2 = new THREE.CylinderGeometry(r1, r0, Lh, 10); g2.translate(0, Lh / 2, 0); g2.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g2.translate(a.x, a.y, a.z); return g2; };
      const pie = new THREE.Vector3(bx, Y0, bz), nudo = new THREE.Vector3(bx, tope, bz);
      ram.push(tramo(pie, nudo, 0.17, 0.13));
      for (let q = 0; q < 4; q++) { const a = q / 4 * Math.PI * 2 + L.rot, d = (2.6 + rnd() * 1.4) * Math.max(0.6, k), qq = new THREE.Vector3(bx + Math.cos(a) * d, Y0 + L.H + 1.2 * kh, bz + Math.sin(a) * d); ram.push(tramo(nudo, qq, 0.09, 0.05)); }
      const col = new THREE.Mesh(mergeGeometries(ram.map(x => x.toNonIndexed())), matCol); col.castShadow = !movil; grupo.add(col);
    }
  }
  // bancas curvas en el anillo exterior
  for (let q = 0; q < 10; q++) { const a = q / 10 * Math.PI * 2 + 0.15, rr = R - 2.2; const b2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.45, 0.7), matBord); b2.position.set(HC[0] + Math.cos(a) * rr, Y0 + 0.4, HC[1] + Math.sin(a) * rr); b2.rotation.y = -a + Math.PI / 2; b2.castShadow = !movil; grupo.add(b2); }
  // flores sobre las cubiertas (colores: polinizadores)
  const flor = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 6, 4), new THREE.MeshStandardMaterial({ roughness: 0.6 }), TECHOV.length), cf = ['#f2d14a', '#e9e4f5', '#d7609b', '#f08a24', '#b07ad9'].map(h => new THREE.Color(h));
  TECHOV.forEach(([x, y, z], q) => { o3.position.set(x + (rnd() - 0.5) * 0.6, y + 0.55 + rnd() * 0.4, z + (rnd() - 0.5) * 0.6); o3.rotation.set(0, 0, 0); o3.scale.setScalar(1); o3.updateMatrix(); flor.setMatrixAt(q, o3.matrix); flor.setColorAt(q, cf[q % cf.length]); }); grupo.add(flor);
  // plantas reales en los bancales y sobre las cubiertas: solo de cerca (son pesadas)
  const puntos = []; camas.forEach((W, ci) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of W) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
    for (let x = x0 + 0.5; x < x1; x += 1.1) for (let z = z0 + 0.5; z < z1; z += 1.1) { const px = x + (rnd() - 0.5) * 0.8, pz = z + (rnd() - 0.5) * 0.8; if (dentroP(W, px, pz)) puntos.push([px, pz, ci]); } });
  if (flores) T3.floresExtra = (T3.floresExtra || []).concat(TECHOV.map(p => [p[0], p[1] + 0.8, p[2], 0, -1]), puntos.filter((_, i) => i % 4 === 0).map(p => [p[0], Y0 + 1.6, p[1], 0, -2]));
  const PESADAS = [];
  plantas(THREE).then(carga => {
    carga.forEach((gl, mi) => {
      if (!gl) return; gl.scene.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(gl.scene), alto = Math.max(b.max.y - b.min.y, b.max.x - b.min.x, b.max.z - b.min.z) || 1, esc0 = (mi === 0 ? 1.9 : 1.5) / alto;
      const mis = puntos.filter((p, i) => (i * 7 + p[2] * 3) % MOD.length === mi), arr = TECHOV.filter((_, i) => i % MOD.length === mi);
      gl.scene.traverse(o => {
        if (!o.isMesh) return;
        const geo = o.geometry.clone().applyMatrix4(o.matrixWorld).translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
        const mat = o.material; if (mat.map) mat.map.anisotropy = ANIS; mat.side = THREE.DoubleSide; if (mat.map && mat.emissive) { mat.emissiveMap = mat.map; mat.emissive.setRGB(1, 1, 1); mat.emissiveIntensity = 0.25; } if (mat.transparent) { mat.transparent = false; mat.alphaTest = 0.4; }
        const im = new THREE.InstancedMesh(geo, mat, mis.length + arr.length);
        mis.forEach(([x, z], q) => { const e = esc0 * (1.0 + rnd() * 0.6); o3.position.set(x, Y0 + 0.55, z); o3.rotation.set(0, rnd() * 6.28, 0); o3.scale.set(e, e, e); o3.updateMatrix(); im.setMatrixAt(q, o3.matrix); });
        arr.forEach(([x, y, z], q) => { const e = 1.3 / alto * (0.7 + rnd() * 0.6); o3.position.set(x, y, z); o3.rotation.set(0, rnd() * 6.28, 0); o3.scale.set(e, e, e); o3.updateMatrix(); im.setMatrixAt(mis.length + q, o3.matrix); });
        im.castShadow = false; im.receiveShadow = !movil; im.visible = false; grupo.add(im); PESADAS.push(im);
      });
    });
  });
  setInterval(() => { const cam = T3.camera; if (!cam || !grupo.visible) return; const cerca = Math.hypot(cam.position.x - HC[0], cam.position.z - HC[1]) < 320 + cam.position.y * 0.5; for (const m of PESADAS) m.visible = cerca; }, 500);
  return grupo;
}

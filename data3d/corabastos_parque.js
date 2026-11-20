/* ============ PARQUE HUMEDAL DE CORABASTOS (con la propuesta) ============
   Corabastos reducido desmonta las bodegas que están a menos de 120 m del humedal La Vaca (campo dh de data3d/corabastos.json). Ese pedazo de la
   central se vuelve un parque humedal: pasto, una laguna que recoge el agua lluvia de las cubiertas que quedan y árboles nativos de borde de agua
   (aliso, sauco, chicalá, arrayán, caucho sabanero y arbustos de flor), con los mismos modelos escaneados de los parches (data3d/parches_arboles.js).
   Solo existe con la propuesta; las bodegas desmontadas se esconden. Hipótesis de diseño para discutir con el grupo. */
export async function crearParqueCorabastos({ T3, lw, cj }) {
  const THREE = T3.THREE;
  const C = await cj('data3d/corabastos.json?v=3'); if (!C || !C.naves) return null;
  const W = (p) => lw(p[0], p[1]);
  const rect = (n, m = 0) => { const [cx, cz] = W(n.c), e = W([n.c[0] + Math.cos(n.a), n.c[1] + Math.sin(n.a)]), ux = e[0] - cx, uz = e[1] - cz, vx = -uz, vz = ux, L2 = n.L / 2 + m, W2 = n.W / 2 + m; return [[-L2, -W2], [L2, -W2], [L2, W2], [-L2, W2]].map(([u, v]) => [cx + u * ux + v * vx, cz + u * uz + v * vz]); };
  const Q = C.naves.filter(n => n.dh < 120); if (!Q.length) return null;
  const env = (pts) => { const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = []; for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of P.slice().reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); } return lo.slice(0, -1).concat(hi.slice(0, -1)); };
  // las bodegas desmontadas quedan en grupos separados por bodegas que se conservan: un parque por grupo (bodegas a menos de 110 m entre centros)
  const grupos = []; for (const n of Q) { const g = grupos.find(G => G.some(m => Math.hypot(m.c[0] - n.c[0], m.c[1] - n.c[1]) < 110)); if (g) g.push(n); else grupos.push([n]); }
  const dentro = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
  const Y = (T3.viaY != null ? T3.viaY : 0.62) + 0.35; // por encima del asfalto: las calles internas entre las bodegas desmontadas se vuelven parque
  const grupo = new THREE.Group(); grupo.name = 'parque_corabastos'; grupo.visible = false; T3.scene.add(grupo);
  const forma = (P, y, esc, hueco) => { const sh = new THREE.Shape(P.map(p => new THREE.Vector2(p[0], -p[1]))); if (hueco) sh.holes.push(new THREE.Path(hueco.slice().reverse().map(p => new THREE.Vector2(p[0], -p[1])))); const g = new THREE.ShapeGeometry(sh, 2); /* hueco: anillos que no se enciman (sin parpadeo entre capas) */ g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
    const pos = g.attributes.position, uv = new Float32Array(pos.count * 2); for (let i = 0; i < pos.count; i++) { uv[i * 2] = pos.getX(i) / esc; uv[i * 2 + 1] = pos.getZ(i) / esc; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g; };
  const mPasto = (T3.suelo && T3.suelo.pasto) || new THREE.MeshStandardMaterial({ color: 0x4f6a30, roughness: 1 });
  const mOrilla = new THREE.MeshStandardMaterial({ color: 0x4a3f2e, roughness: 1, metalness: 0 });
  /* agua propia y OPACA (la del río es transparente y dejaba ver la foto de Google por debajo): verde-azulada, refleja el cielo y tiene oleaje suave */
  const nrm = new THREE.TextureLoader().load('data3d/waternormals.jpg'); nrm.wrapS = nrm.wrapT = THREE.RepeatWrapping;
  const mAgua = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.08, metalness: 0, envMap: T3.env || null, envMapIntensity: 0.6, clearcoat: 1, clearcoatRoughness: 0.05, normalMap: nrm, normalScale: new THREE.Vector2(0.35, 0.35) });
  { const t0 = performance.now(); const mover = () => { requestAnimationFrame(mover); if (!grupo.visible) return; const s = (performance.now() - t0) / 1000; nrm.offset.set(s * 0.012, s * 0.007); }; requestAnimationFrame(mover); }
  const mJunco = new THREE.MeshStandardMaterial({ color: 0x6f8a3c, roughness: 0.9, side: THREE.DoubleSide });
  const PARQUES = [], ARB = [];
  let PM = null; try { PM = await import('./parches_arboles.js?v=7'); } catch (e) { console.warn('parque Corabastos (especies):', e); }
  let sem = 2026; const rnd = () => ((sem = Math.imul(sem ^ (sem >>> 15), 2246822519) + 0x9e3779b9 | 0) >>> 0) / 4294967296;
  for (const G of grupos) {
  const poly = env(G.flatMap(n => rect(n, 12)));
  const cen = poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]);
  // contorno orgánico (sin esquinas): el polígono se recorre por ángulo desde el centro, se escala y se suaviza
  const radial = (k, ruido, sem) => { const N = 72, R = [];
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a); let lo = 0, hi = 2000; for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; if (dentro(poly, cen[0] + dx * m, cen[1] + dz * m)) lo = m; else hi = m; } R.push(lo); }
    const S = R.map((r, i) => (R[(i + N - 2) % N] + R[(i + N - 1) % N] * 2 + r * 3 + R[(i + 1) % N] * 2 + R[(i + 2) % N]) / 9);
    return S.map((r, i) => { const a = i / N * Math.PI * 2, f = k * (1 + ruido * (Math.sin(a * 3 + sem) * 0.6 + Math.sin(a * 5 + sem * 2.1) * 0.4)); return [cen[0] + Math.cos(a) * r * f, cen[1] + Math.sin(a) * r * f]; }); };
  const borde = radial(0.98, 0.02, 1.3), orilla = radial(0.62, 0.08, sem * 0.001 + 0.4), laguna = radial(0.55, 0.08, sem * 0.001 + 0.4);
  // pasto (mismo material fotográfico de los parques del modelo), orilla de tierra húmeda y laguna
  const pasto = new THREE.Mesh(forma(borde, Y, 6), mPasto); pasto.receiveShadow = true; pasto.renderOrder = 1; grupo.add(pasto);
  const orillaM = new THREE.Mesh(forma(orilla, Y + 0.3, 4), mOrilla); orillaM.receiveShadow = true; orillaM.renderOrder = 2; grupo.add(orillaM);
  // laguna: mismo material de agua de los humedales (ondas con mapa de normales y reflejo del cielo), en un tono verde-azulado de agua limpia
  const gA = forma(laguna, Y + 0.6, 30), nA = gA.attributes.position.count, col = new Float32Array(nA * 3); for (let i = 0; i < nA; i++) { col[i * 3] = 0.07; col[i * 3 + 1] = 0.14; col[i * 3 + 2] = 0.135; }
  gA.setAttribute('color', new THREE.BufferAttribute(col, 3)); gA.computeVertexNormals();
  const agua = new THREE.Mesh(gA, mAgua); agua.renderOrder = 3; grupo.add(agua);
  { // juncos en la orilla (manojos finos verdes y pajizos)
    const nJ = 700, im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 1, 3, 1, true).translate(0, 0.5, 0), mJunco, nJ), O = new THREE.Object3D(), cc = new THREE.Color();
    for (let i = 0; i < nJ; i++) { const k = Math.floor(rnd() * laguna.length), a = laguna[k], b = orilla[k], t = 0.1 + rnd() * 0.8, x = a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * 2, z = a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * 2;
      O.position.set(x, Y + 0.3, z); O.rotation.set((rnd() - 0.5) * 0.35, rnd() * 6.28, (rnd() - 0.5) * 0.35); O.scale.set(1, 0.9 + rnd() * 1.1, 1); O.updateMatrix(); im.setMatrixAt(i, O.matrix); im.setColorAt(i, cc.set(rnd() < 0.75 ? 0x5f7d34 : 0xb59f62)); }
    im.receiveShadow = true; grupo.add(im); }
  // árboles nativos de borde de agua: alisos cerca del agua, medianos y arbustos de flor en la orilla, cauchos hacia el borde
  if (PM) { const A = [], libre = (x, z, d) => A.every(t => Math.hypot(t.x - x, t.z - z) > d) && ARB.every(t => Math.hypot(t.x - x, t.z - z) > d);
    const elegir = (f) => f < 0.35 ? (rnd() < 0.75 ? 'aliso' : 'sauco') : f < 0.7 ? ['sauco', 'chicala', 'arrayan', 'aliso'][Math.floor(rnd() * 4)] : ['caucho', 'aliso', 'arrayan'][Math.floor(rnd() * 3)];
    const meta = Math.round(18 * G.length);
    for (let i = 0; i < 3000 && A.length < meta; i++) {
      const k = Math.floor(rnd() * borde.length), f = rnd(), a = orilla[k], b = borde[k], x = a[0] + (b[0] - a[0]) * (0.1 + f * 0.82) + (rnd() - 0.5) * 4, z = a[1] + (b[1] - a[1]) * (0.1 + f * 0.82) + (rnd() - 0.5) * 4;
      if (!dentro(borde, x, z) || dentro(orilla, x, z)) continue;
      const arb = rnd() < 0.3 && f < 0.5, sp = arb ? ['chilco', 'tibar', 'raque', 'mortino'][Math.floor(rnd() * 4)] : elegir(f), E = PM.ESPECIES[sp];
      if (!libre(x, z, arb ? 2.6 : 4.5)) continue;
      A.push({ x, z, sp, h: E.alto * (0.8 + rnd() * 0.35), rot: rnd() * 6.283 }); }
    ARB.push(...A); }
  PARQUES.push({ borde, laguna, centro: cen, area: Math.abs(borde.reduce((s, p, i) => { const q = borde[(i + 1) % borde.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2, bodegas: G.length });
  }
  let parches = null;
  if (PM && ARB.length) try { parches = await PM.crearParches3D({ T3, P: [{ n: 'Parques humedal de Corabastos', c: PARQUES[0].centro, arboles: ARB }] }); } catch (e) { console.warn('parque Corabastos (árboles):', e); }
  grupo.userData.arboles = ARB.length;
  const quitadas = () => { const co = T3.scene.getObjectByName('corabastos'); return co && co.userData.quitadas; };
  let on = false;
  const mayor = PARQUES.slice().sort((a, b) => b.area - a.area)[0];
  const api = {
    grupo, parques: PARQUES, laguna: mayor.laguna, centro: mayor.centro, area: Math.round(PARQUES.reduce((s, p) => s + p.area, 0)), arboles: ARB.length,
    listaArboles: ARB, // posición de cada árbol {x, z, sp, h} (los cuentan los indicadores en 3D, data3d/indicadores.js)
    ver(v) { on = !!v; grupo.visible = on; if (parches) parches.ver(on); const q = quitadas(); if (q) q.visible = !on; },
    get on() { return on; }
  };
  // la malla de Corabastos puede cargar después: se vuelve a aplicar
  setInterval(() => { const q = quitadas(); if (q && q.visible === on) q.visible = !on; }, 1500);
  return api;
}
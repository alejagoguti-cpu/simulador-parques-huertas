/* ============ CAMIONES HACIA CORABASTOS Y ENTRADAS DE CARGA (sobre las vías reales de la simulación) ============
   En la simulación SUMO cada vehículo «nace» (spawn) en un punto: en el borde del mapa si viene de fuera de Kennedy, o adentro si sale de un
   parqueadero, una casa o una bodega. Aquí se lee la grabación (T3.TRAF.steps): el primer paso en que aparece cada id es su punto de origen;
   se agrupan en celdas de 150 m y se conservan las 8 entradas de borde con más vehículos (marcas sobre el asfalto).
   Los camiones que van a Corabastos NO se dibujan aparte: se resaltan, con un anillo y un pin naranja sobre el techo, los camiones reales
   de la simulación (T3.TRAF.vis) que están a menos de 2,6 km de Corabastos y se acercan a él. No hay líneas en el aire.
   Horario: la carga entra de noche (6 p. m. a 11 p. m.; la venta mayorista abre a las 2 a. m.; Corabastos recibe 900 a 1.200 vehículos de carga al día). */
export function crearOrigenes({ T3, izq, despues }) {
  const THREE = T3.THREE, CORA = [1132.1, 948.6], CEL = 150;
  const grupo = new THREE.Group(); grupo.name = 'origenes'; grupo.visible = false; T3.scene.add(grupo);
  const Y = (T3.viaY != null ? T3.viaY : 0.62) + 0.4;
  let celdas = [], hecho = false, nSteps = 0;
  function calcular() {
    const TR = T3.TRAF, LC = T3.LC; if (!TR || !LC) return false;
    const S = TR.steps, M = new Map(); let prev = null, n = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let k = 0; k < S.length; k++) { const A = S[k]; if (!A) { prev = null; continue; } n++;
      if (prev) { let j = 0; for (let i = 0; i < A.ids.length; i++) { const id = A.ids[i]; while (j < prev.length && prev[j] < id) j++; if (j < prev.length && prev[j] === id) continue;
        const x = A.xs[i] - LC.x, z = LC.y - A.ys[i], key = Math.floor(x / CEL) * 100003 + Math.floor(z / CEL); let c = M.get(key); if (!c) M.set(key, c = { n: 0, x: 0, z: 0 }); c.n++; c.x += x; c.z += z; } }
      for (let i = 0; i < A.ids.length; i += 7) { const x = A.xs[i] - LC.x, z = LC.y - A.ys[i]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      prev = A.ids; }
    if (n < 3) return false;
    nSteps = n; const dur = n; // un paso = 1 s
    celdas = [...M.values()].map(c => ({ n: c.n, x: c.x / c.n, z: c.z / c.n })).sort((a, b) => b.n - a.n);
    for (const c of celdas) { c.borde = Math.min(c.x - x0, x1 - c.x, c.z - z0, z1 - c.z) < 350; c.hora = Math.round(c.n / dur * 3600); }
    celdas = celdas.filter(c => c.borde && c.n >= 3);
    return true;
  }
  // marcas de entrada sobre el asfalto (anillo que late) + halo de los camiones reales que van a Corabastos
  const UA = { uT: { value: 0 } };
  const mAnillo = new THREE.ShaderMaterial({ uniforms: UA, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
    vertexShader: 'attribute vec3 col; attribute float fase; varying vec2 vU; varying vec3 vC; varying float vF; void main(){ vU = uv; vC = col; vF = fase; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vU; varying vec3 vC; varying float vF; void main(){ float d = length(vU - 0.5) * 2.0; if (d > 1.0) discard;
      float r = fract(uT * 0.45 + vF); float onda = smoothstep(0.09, 0.0, abs(d - r)) * (1.0 - r);
      float nucleo = smoothstep(0.24, 0.16, d); float aro = smoothstep(0.06, 0.0, abs(d - 0.95));
      gl_FragColor = vec4(vC, max(nucleo * 0.85, max(onda * 0.9, aro * 0.5)));
      #include <colorspace_fragment>
    }` });
  let anillos = null, halos = null, pines = null, entradas = [], nCam = 0, elCont = null, ultCont = -1;
  const NMAX = 600, RADIO = 2600; // capacidad fija del halo; distancia máxima a Corabastos
  const ET = []; // etiquetas HTML
  const css = document.createElement('style'); css.textContent = `.og-et{position:fixed;left:0;top:0;z-index:7;pointer-events:none;padding:4px 8px;border-radius:7px;background:rgba(10,14,16,.84);border:1px solid rgba(255,255,255,.14);
  font:400 10.5px var(--ui-sans,Inter,system-ui,sans-serif);color:#e9ebec;white-space:nowrap;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-variant-numeric:tabular-nums}
.og-et b{font-weight:600}.og-et.reg{border-color:rgba(251,146,60,.5)}.og-et small{display:block;color:#9aa2a7;font-size:9.5px}@media(max-width:760px){.og-et{font-size:9.5px;padding:3px 6px}}`; document.head.appendChild(css);
  const etiqueta = (html, x, y, z, cls = '') => { const d = document.createElement('div'); d.className = 'og-et ' + cls; d.innerHTML = html; d.style.display = 'none'; document.body.appendChild(d); ET.push({ d, p: new THREE.Vector3(x, y, z) }); return d; };
  function armar() {
    entradas = celdas.filter(c => c.borde).slice(0, 8); // las 8 entradas de borde con más vehículos (no hay nombres de vía en net.json)
    const N = entradas.length, g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), col = new Float32Array(N * 3), fase = new Float32Array(N), O = new THREE.Object3D(), C = new THREE.Color('#fb923c');
    anillos = new THREE.InstancedMesh(g, mAnillo, Math.max(N, 1)); anillos.renderOrder = 9; anillos.frustumCulled = false; anillos.count = N;
    entradas.forEach((c, i) => { O.position.set(c.x, Y, c.z); O.rotation.set(0, 0, 0); O.scale.set(44, 1, 44); O.updateMatrix(); anillos.setMatrixAt(i, O.matrix);
      col.set([C.r, C.g, C.b], i * 3); fase[i] = (i * 0.137) % 1;
      etiqueta(`<b>Entrada de carga</b><small>${c.hora.toLocaleString('es-CO')} vehículos/hora entran por aquí</small>`, c.x, Y + 30, c.z); });
    g.setAttribute('col', new THREE.InstancedBufferAttribute(col, 3)); g.setAttribute('fase', new THREE.InstancedBufferAttribute(fase, 1));
    // halo sobre cada camión real que va hacia Corabastos: anillo plano en el techo + pin apuntando hacia abajo
    const mH = new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    halos = new THREE.InstancedMesh(new THREE.RingGeometry(0.62, 1, 28).rotateX(-Math.PI / 2), mH, NMAX); halos.renderOrder = 11; halos.frustumCulled = false; halos.count = 0;
    pines = new THREE.InstancedMesh(new THREE.ConeGeometry(0.42, 1.1, 10).rotateX(Math.PI).translate(0, 0.55, 0), mH, NMAX); pines.renderOrder = 11; pines.frustumCulled = false; pines.count = 0;
    grupo.add(anillos, halos, pines);
    const d = etiqueta('<b>Corabastos</b><small>900–1.200 camiones al día · la carga entra de 6 p. m. a 11 p. m.</small><small id="og-cont" style="color:#fdba74">0 camiones resaltados rumbo a Corabastos</small>', CORA[0], 120, CORA[1], 'reg');
    elCont = d.querySelector('#og-cont'); ultCont = -1;
    hecho = true;
  }
  const V = new THREE.Vector3(), O2 = new THREE.Object3D();
  // resalta los camiones de la simulación a menos de 2,6 km de Corabastos que se acercan a él
  function resaltar() {
    const TR = T3.TRAF, vis = TR && TR.vis; if (!vis || !halos) return;
    const cp = T3.camera.position; let k = 0;
    for (let i = 0; i < vis.n && k < NMAX; i++) {
      if (!vis.cam[i]) continue;
      const x = vis.x[i], z = vis.z[i], ax = CORA[0] - x, az = CORA[1] - z, d2 = ax * ax + az * az;
      if (d2 > RADIO * RADIO || vis.dx[i] * ax + vis.dz[i] * az <= 0) continue;
      const dc = Math.hypot(cp.x - x, cp.y - Y, cp.z - z), r = Math.min(60, Math.max(6, dc / 20)), yy = Y + 3.4 + r * 0.25;
      O2.rotation.set(0, 0, 0); O2.position.set(x, yy, z); O2.scale.set(r, 1, r); O2.updateMatrix(); halos.setMatrixAt(k, O2.matrix);
      O2.position.set(x, yy + r * 0.15, z); O2.scale.set(r * 0.9, r * 0.9, r * 0.9); O2.updateMatrix(); pines.setMatrixAt(k, O2.matrix); k++; }
    halos.count = pines.count = k; halos.instanceMatrix.needsUpdate = pines.instanceMatrix.needsUpdate = true; nCam = k;
    if (elCont && k !== ultCont) { ultCont = k; elCont.textContent = k + (k === 1 ? ' camión resaltado rumbo a Corabastos' : ' camiones resaltados rumbo a Corabastos'); }
  }
  function cuadro(t) { requestAnimationFrame(cuadro); if (!grupo.visible) { for (const e of ET) if (e.d.style.display !== 'none') e.d.style.display = 'none'; return; }
    UA.uT.value = t / 1000; const W = innerWidth, H = innerHeight; resaltar();
    for (const e of ET) { V.copy(e.p).project(T3.camera); const ok = V.z < 1 && Math.abs(V.x) < 0.95 && Math.abs(V.y) < 0.92; e.d.style.display = ok ? 'block' : 'none'; if (ok) e.d.style.transform = `translate(${((V.x + 1) / 2 * W).toFixed(1)}px,${((1 - V.y) / 2 * H).toFixed(1)}px) translate(-50%,-100%)`; } }
  requestAnimationFrame(cuadro);
  function ver(on) {
    if (on && !hecho) { if (!calcular()) { setTimeout(() => ver(true), 1500); return; } armar(); }
    grupo.visible = !!on;
  }
  // ---- panel: bajo el bloque de Corabastos del flujo de carros ----
  if (izq) {
    const H = (h, m = 0) => h * 60 + m;
    (despues || izq.lastElementChild).insertAdjacentHTML('afterend', `<div id="gs-og">
      <div class="gs-sub">¿DE DÓNDE VIENEN? <span>camiones hacia Corabastos</span></div>
      <div class="gs-fila" style="grid-template-columns:1fr 1fr" id="gs-ogb"><button data-v="1">Ver</button><button data-v="" class="on">Apagar</button></div>
      <div style="font-size:10.5px;line-height:1.45;color:#94a3b8;margin:6px 0 4px"><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#fb923c;margin-right:4px"></i>marca naranja sobre un camión real que va hacia Corabastos · anillo en el asfalto: entrada de carga</div>
      <div class="gs-fila" style="grid-template-columns:1fr 1fr" id="gs-ogh"><button data-h="22">22:00 · llega la carga</button><button data-h="2">02:00 · abre la venta</button></div>
      <div style="font-size:10px;color:#64748b;margin-top:4px;line-height:1.4">Corabastos recibe 900 a 1.200 vehículos de carga al día; la carga entra de 6 p. m. a 11 p. m. y la venta mayorista abre a las 2 a. m. En esas horas, cerca de Corabastos uno de cada cinco vehículos es camión. Se resaltan los camiones de la simulación a menos de 2,6 km que se acercan.</div></div>`);
    const caja = izq.querySelector('#gs-og');
    caja.querySelectorAll('#gs-ogb button').forEach(b => b.onclick = () => { ver(!!b.dataset.v); caja.querySelectorAll('#gs-ogb button').forEach(x => x.classList.toggle('on', x === b)); });
    caja.querySelectorAll('#gs-ogh button').forEach(b => b.onclick = () => { if (T3.reloj) { const h = +b.dataset.h, t = H(h); if (T3.reloj.t > t && h < 12) T3.reloj.dia = (T3.reloj.dia || 1) + 1; T3.reloj.t = t; }
      ver(true); caja.querySelectorAll('#gs-ogb button').forEach(x => x.classList.toggle('on', x.dataset.v === '1'));
      const FCb = document.querySelector('#gs-fc button[data-v="1"]'); if (FCb && !FCb.classList.contains('on')) FCb.click();
      if (T3.orbit) { const c = T3.orbit.target, p0 = T3.camera.position.clone(), c0 = c.clone(), p1 = new THREE.Vector3(CORA[0] + 900, 3400, CORA[1] + 2600), c1 = new THREE.Vector3(CORA[0], 0, CORA[1]); T3.anim = { t: 0, dur: 2.4, p0, c0, p1, c1 }; } });
  }
  return { ver, grupo, get celdas() { return celdas; }, get entradas() { return entradas; }, get camiones() { return nCam; } };
}

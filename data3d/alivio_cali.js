/* ============ AV. CIUDAD DE CALI: MENOS TRÁFICO CON LA PROPUESTA ============
   Hoy la Av. Ciudad de Cali (Av. Carrera 86) lleva el tráfico que entra a Corabastos desde el norte y pasa junto al Humedal El Burro.
   Con la propuesta el barrio se abastece en Bavaria Común y en los mercados de barrio: menos viajes a Corabastos por esa vía.
   [SUP] supuesto de escala para discutir con el grupo: siguen el 60 % de los carros y motos y el 30 % de los camiones.
   - T3.alivio(x, z, id): 0 = fuera de la vía · 1 = en la vía y sigue · 2 = en la vía y con la propuesta ya no pasa (index.html lo salta).
     Cuenta, cuadro a cuadro, cuántos vehículos hay en la vía hoy y cuántos quedan con la propuesta (T3.alivio.hoy / .pro, suavizados).
   - En 3D: cinta sobre la vía (roja hoy si se mira el tráfico; verde con la propuesta) y una etiqueta con el cambio en vivo.
   Datos: data3d/alivio_cali.json (tools/alivio_cali_build.py, OSM). Marco del mundo. */
export function crearAlivioCali({ T3, D }) {
  const THREE = T3.THREE, KEEP = 0.60, KEEP_CAM = 0.30, ANCHO = 16;
  // índice: tramos en celdas de 40 m
  const CEL = 40, grid = new Map(), cl = (x, z) => Math.floor(x / CEL) + ',' + Math.floor(z / CEL);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const L of D.lineas) for (let i = 1; i < L.length; i++) {
    const a = L[i - 1], b = L[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (CEL * 0.4)));
    const vis = new Set(); for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) { const kk = cl(x + dx * ANCHO, z + dz * ANCHO); if (vis.has(kk)) continue; vis.add(kk); let c = grid.get(kk); if (!c) grid.set(kk, c = []); c.push([a[0], a[1], b[0], b[1]]); } }
    x0 = Math.min(x0, a[0], b[0]); x1 = Math.max(x1, a[0], b[0]); z0 = Math.min(z0, a[1], b[1]); z1 = Math.max(z1, a[1], b[1]);
  }
  x0 -= ANCHO; x1 += ANCHO; z0 -= ANCHO; z1 += ANCHO;
  /* TODA LA RED DE CORABASTOS: con la propuesta Corabastos se descentraliza (Bavaria Común, mercados de barrio, Corabastos reducido) y deja de
     atraer viajes de toda la localidad. Cada vía cerca de Corabastos pierde carros según la distancia: plena hasta 600 m, se desvanece a 2,6 km.
     El cambio no es instantáneo: al pasar a «con la propuesta» la red se va descongestionando durante ~25 s de simulación (alivio.rampa). */
  const CORA = [1132.1, 948.6], R0 = 600, R1 = 2600;
  const pesoCora = (x, z) => { const d = Math.hypot(x - CORA[0], z - CORA[1]); return d <= R0 ? 1 : d >= R1 ? 0 : 1 - (d - R0) / (R1 - R0); };
  const enCali = (x, z) => { if (x < x0 || x > x1 || z < z0 || z > z1) return false; const c = grid.get(cl(x, z)); if (!c) return false;
    for (const [ax, az, bx, bz] of c) { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), ex = x - ax - t * dx, ez = z - az - t * dz; if (ex * ex + ez * ez < ANCHO * ANCHO) return true; }
    return false; };
  let cH = 0, cP = 0, kH = 0, kP = 0; // cuenta del cuadro: todos los de la vía (hoy) y los que quedan (propuesta)
  const enVia = (x, z) => enCali(x, z) || pesoCora(x, z) > 0;
  const alivio = (x, z, id) => {
    const cali = enCali(x, z), w = cali ? 1 : pesoCora(x, z);
    if (!w) return 0;
    const cam = ((id * 2654435761) >>> 0) / 4294967296 >= 0.92; // mismo sorteo de camiones que index.html
    cH++; if (cam) kH++;
    // los escenarios (data3d/escenarios_sim.js) cambian KEEP según la dependencia de Corabastos; lejos de Corabastos se quitan menos (w)
    const M = alivio.manual; // sliders del panel de flujo de carros (data3d/giro_sim.js): mandan sobre el valor del escenario
    // se combinan: lo que se queda = (sliders de Corabastos del flujo de carros) × (dependencia de Corabastos del escenario, sliders de SIM-01)
    const quita = (1 - (M ? (cam ? M.keepCam : M.keep) : 1) * (cam ? alivio.KEEP_CAM : alivio.KEEP)) * Math.max(w, pesoCora(x, z));
    const queda = (Math.imul(id ^ 0x27d4eb2d, 0x165667b1) >>> 0) / 4294967296 >= quita * alivio.rampa;
    if ((Math.imul(id ^ 0x27d4eb2d, 0x165667b1) >>> 0) / 4294967296 >= quita) { cP++; if (cam) kP++; }
    return T3.escenario === 'proyecto' && !queda ? 2 : 1;
  };
  alivio.rampa = 0; let tRampa = 0;
  alivio.hoy = 0; alivio.pro = 0; alivio.camHoy = 0; alivio.camPro = 0; alivio.KEEP = KEEP; alivio.KEEP_CAM = KEEP_CAM; alivio.n = D.n; alivio.largo = D.largo_m;
  alivio.ini = () => { // al empezar cada cuadro de tráfico: se cierra la cuenta del anterior (promedio móvil de ~5 s)
    { const t = performance.now(), dt = tRampa ? Math.min(0.5, (t - tRampa) / 1000) : 0; tRampa = t; // la red se descongestiona poco a poco (y vuelve a llenarse al pasar a «hoy»)
      alivio.rampa = T3.escenario === 'proyecto' ? Math.min(1, alivio.rampa + dt / 25) : Math.max(0, alivio.rampa - dt / 6); }
    if (cH || cP) { const k = 0.02; alivio.hoy += (cH - alivio.hoy) * k; alivio.pro += (cP - alivio.pro) * k; alivio.camHoy += (kH - alivio.camHoy) * k; alivio.camPro += (kP - alivio.camPro) * k; }
    cH = cP = kH = kP = 0; };
  alivio.enVia = enVia;
  T3.alivio = alivio;

  /* ---------- cinta sobre la vía ---------- */
  const P = [], U = [], I = [];
  for (const L of D.lineas) { let s = 0; const b0 = P.length / 3;
    for (let k = 0; k < L.length; k++) {
      const a = L[Math.max(0, k - 1)], b = L[Math.min(L.length - 1, k + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      if (k) s += Math.hypot(L[k][0] - L[k - 1][0], L[k][1] - L[k - 1][1]);
      const x = L[k][0], z = L[k][1], y = (T3.viaY != null ? T3.viaY : 0.62) + 0.12 + (T3.alzaVia ? T3.alzaVia(x, z) : 0), w = 7;
      P.push(x - dz * w, y, z + dx * w, x + dz * w, y, z - dx * w); U.push(s, 0, s, 1);
      if (k < L.length - 1) { const v = b0 + k * 2; I.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); } } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    uniforms: { uT: { value: 0 }, uC: { value: new THREE.Color('#34d399') }, uA: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uT; uniform vec3 uC; uniform float uA; varying vec2 vUv;
      void main(){ float borde = smoothstep(0.0,0.12,vUv.y)*smoothstep(1.0,0.88,vUv.y); float flecha = smoothstep(0.55,1.0,fract(vUv.x/38.0 - uT*0.35));
        float a = uA*(0.28*borde + 0.55*flecha*borde); gl_FragColor = vec4(uC, a);
        #include <colorspace_fragment>
      }` });
  const cinta = new THREE.Mesh(g, mat); cinta.renderOrder = 6; cinta.frustumCulled = false; cinta.visible = false; cinta.name = 'alivio_cali'; T3.scene.add(cinta);

  /* ---------- etiqueta con el cambio en vivo (centro de la vía) ---------- */
  const lm = D.lineas.reduce((m, L) => L.length > m.length ? L : m, D.lineas[0]), mid = lm[Math.floor(lm.length / 2)];
  alivio.mid = mid;
  const et = document.createElement('div'); et.id = 'alivio-et'; et.setAttribute('role', 'status');
  et.innerHTML = '<i></i><div><b>Vías de Corabastos</b><span id="alivio-v">menos viajes a Corabastos</span></div>';
  const css = document.createElement('style'); css.textContent = `
#alivio-et{position:fixed;z-index:7;left:0;top:0;display:none;align-items:center;gap:8px;padding:6px 10px 6px 8px;border-radius:9px;pointer-events:none;
  background:rgba(10,14,16,.82);border:1px solid rgba(52,211,153,.38);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  font:400 11px var(--ui-sans,Inter,system-ui,sans-serif);color:#e9ebec;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.35);font-variant-numeric:tabular-nums}
#alivio-et i{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 0 3px rgba(52,211,153,.2)}
#alivio-et b{display:block;font-weight:500;font-size:11.5px}#alivio-et span{color:#9aa2a7;font-size:10.5px}#alivio-et span em{font-style:normal;color:#6ee7b7;font-weight:500}
@media(max-width:760px){#alivio-et{padding:4px 8px;font-size:10px}#alivio-et b{font-size:10.5px}}`;
  document.head.appendChild(css); document.body.appendChild(et);
  const V = new THREE.Vector3(); let on = false, a = 0, tTxt = 0;
  const RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  function cuadro(t) {
    requestAnimationFrame(cuadro);
    a += ((on ? 1 : 0) - a) * 0.06; mat.uniforms.uA.value = a; cinta.visible = a > 0.01; if (!RMQ.matches) mat.uniforms.uT.value = t / 1000;
    if (!on) { if (et.style.display !== 'none') et.style.display = 'none'; return; }
    V.set(mid[0], 6 + (T3.alzaVia ? T3.alzaVia(mid[0], mid[1]) : 0), mid[1]).project(T3.camera);
    const vis = V.z < 1 && Math.abs(V.x) < 1 && Math.abs(V.y) < 1; et.style.display = vis ? 'flex' : 'none';
    if (vis) et.style.transform = `translate(${((V.x + 1) / 2 * innerWidth + 10).toFixed(1)}px,${((1 - V.y) / 2 * innerHeight - 18).toFixed(1)}px)`;
    if (t > tTxt) { tTxt = t + 700; const s = document.getElementById('alivio-v');
      if (s) s.innerHTML = alivio.hoy > 0.5 ? `<em>−${Math.round((1 - alivio.pro / alivio.hoy) * 100)} % vehículos</em> · camiones −${Math.round((1 - alivio.KEEP_CAM) * 100)} %` : `menos viajes a Corabastos`; }
  }
  requestAnimationFrame(cuadro);
  return { ver(v) { on = !!v; }, get on() { return on; }, cinta, alivio };
}

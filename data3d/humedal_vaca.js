/* ============ HUMEDAL LA VACA: RECUPERACIÓN A LO LARGO DE LOS 10 AÑOS DE LA PROPUESTA ============
   Solo con «Con la propuesta». Sigue la línea de tiempo del panel de escenarios (SIMST.t, semana 0 a 519):
   · la lámina de agua y la franja de juncos se ensanchan despacio (curva logística: casi nada el año 1, la mayor parte entre los años 3 y 7);
   · se siembran árboles nativos del humedal (aliso, sauce, chicalá, arrayán, sauco, mano de oso) por tandas
     del año 1 al 7, y cada uno crece de plántula a árbol en ~5 años;
   · llegan más aves a medida que se recupera el hábitat.
   La velocidad depende de SIM-03: la tasa de recuperación del humedal (P3.rec), la densidad de árboles (P3.arboles) y el escenario
   (B sin criterio de ubicación, C con corredores). Las cifras de ensanche, siembra y especies son supuestos de escala [SUP].
   Forma del humedal: data3d/water_bodies.json (sectores norte y sur de La Vaca), al marco del mundo con lw(). */
export async function iniciarHumedalVaca({ T3, cj }) {
  const THREE = T3.THREE, MOV = innerWidth < 760, LC = { x: 5341.33, y: 3161.9 }, lw = (x, y) => [x - LC.x, LC.y - y];
  const W = await cj('data3d/water_bodies.json').catch(() => []);
  const SECT = (W || []).filter(w => /la vaca/i.test(w.nombre || '') && w.pts && w.pts.length > 4).map(w => w.pts.map(p => lw(p[0], p[1])));
  if (!SECT.length) return null;
  const Y = T3.sueloY != null ? T3.sueloY : 0.3;
  const area = (P) => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return a / 2; };
  // polígono desplazado hacia afuera d metros (normal promedio por vértice, con tope de inglete)
  const ensanchar = (P, d) => { const s = Math.sign(area(P)) || 1, n = P.length, Q = [];
    for (let i = 0; i < n; i++) { const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n];
      let e1x = b[0] - a[0], e1z = b[1] - a[1], e2x = c[0] - b[0], e2z = c[1] - b[1]; const l1 = Math.hypot(e1x, e1z) || 1, l2 = Math.hypot(e2x, e2z) || 1; e1x /= l1; e1z /= l1; e2x /= l2; e2z /= l2;
      let nx = (e1z + e2z) * s, nz = -(e1x + e2x) * s; const ln = Math.hypot(nx, nz) || 1; nx /= ln; nz /= ln;
      const cosm = Math.max(0.5, nx * e1z * s - nz * e1x * s); Q.push([b[0] + nx * d / cosm, b[1] + nz * d / cosm]); }
    return Q; };
  const dentro = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
  const forma = (P) => { const sh = new THREE.Shape(); P.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z))); sh.closePath(); const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); return g; };
  const A0 = SECT.reduce((s, P) => s + Math.abs(area(P)), 0);
  const C0 = (() => { const P = SECT[0]; return [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length]; })();

  const grupo = new THREE.Group(); grupo.name = 'humedal_la_vaca'; grupo.visible = false; T3.scene.add(grupo);
  // franja de juncos y pasto de humedal (textura de tallos hecha en el shader) y lámina de agua; se rearman al cambiar el ensanche
  const UJ = { uT: { value: 0 }, uA: { value: 0 } };
  const mJunco = new THREE.ShaderMaterial({ uniforms: UJ, transparent: true, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec2 vP; uniform float uT, uA; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.0), f.x), f.y); }
      void main(){ float a = n(vP * 0.12) * 0.6 + n(vP * 0.5) * 0.3 + n(vP * 2.3) * 0.25; float tallo = step(0.62, n(vec2(vP.x * 3.1, vP.y * 0.9)));
        vec3 c = mix(vec3(0.030, 0.055, 0.018), vec3(0.085, 0.120, 0.035), a); c = mix(c, vec3(0.14, 0.15, 0.06), tallo * 0.35);
        gl_FragColor = vec4(c, 0.94 * uA);
        #include <colorspace_fragment>
      }` });
  // interior del humedal: espejos de agua que crecen con la recuperación (uK) dentro de un pantano de juncos
  const UA = { uT: { value: 0 }, uK: { value: 0 } };
  const mAgua = new THREE.ShaderMaterial({ uniforms: UA, transparent: true, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec2 vP; uniform float uT, uK; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.0), f.x), f.y); }
      void main(){ float m = n(vP * 0.016) * 0.7 + n(vP * 0.06) * 0.3, umbral = 0.28 + 0.42 * uK, agua = smoothstep(umbral + 0.03, umbral - 0.03, m);
        float o = sin(vP.x * 0.21 + uT * 0.8) * sin(vP.y * 0.17 - uT * 0.6) * 0.5 + 0.5;
        vec3 w = mix(vec3(0.010, 0.030, 0.034), vec3(0.030, 0.075, 0.080), o * 0.6 + smoothstep(umbral - 0.12, umbral, m) * 0.4);
        float a = n(vP * 0.31) * 0.6 + n(vP * 1.3) * 0.4; vec3 j = mix(vec3(0.030, 0.052, 0.018), vec3(0.085, 0.11, 0.035), a);
        float vel = 0.12 + 0.8 * smoothstep(0.0, 0.55, uK); /* al principio casi se ve el humedal de hoy; el pantano verde aparece con la recuperación */
        gl_FragColor = vec4(mix(j, w, agua), mix(vel, 0.95, agua));
        #include <colorspace_fragment>
      }` });
  let mJ = [], mW = [], ultD = -1;
  const rearmar = (dJ, dW) => { if (Math.abs(dJ - ultD) < 0.6) return; ultD = dJ;
    [...mJ, ...mW].forEach(m => { grupo.remove(m); m.geometry.dispose(); }); mJ = []; mW = [];
    SECT.forEach(P => { const j = new THREE.Mesh(forma(ensanchar(P, dJ)), mJunco); j.position.y = Y + 1.05; j.renderOrder = 5; grupo.add(j); mJ.push(j);
      const w = new THREE.Mesh(forma(P), mAgua); w.position.y = Y + 1.3; w.renderOrder = 6; grupo.add(w); mW.push(w); }); };
  // borde: línea que marca el límite de hoy (para comparar cuánto creció)
  SECT.forEach(P => { const g = new THREE.BufferGeometry().setFromPoints(P.concat([P[0]]).map(([x, z]) => new THREE.Vector3(x, Y + 1.6, z)));
    const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: '#f2f5f3', dashSize: 6, gapSize: 5, transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false })); l.computeLineDistances(); l.renderOrder = 8; grupo.add(l); });

  /* ---------- árboles nativos ---------- */
  const ESP = [ // nombre, color de copa, alto final (m), forma
    ['Aliso', '#2f5a2c', 12, 'alto'], ['Sauce llorón', '#6f8f3c', 10, 'ancho'], ['Chicalá', '#4d6b2a', 9, 'redondo'], ['Arrayán', '#355f35', 7, 'redondo'],
    ['Sauco', '#5b7d34', 6, 'ancho'], ['Mano de oso', '#3f6e45', 9, 'alto'], ['Raque', '#42683a', 7, 'redondo'], ['Cajeto', '#4a7438', 8, 'redondo']];
  const NA = MOV ? 260 : 620, PUN = [];
  let sem = 7; const rnd = () => { sem = (sem * 1664525 + 1013904223) >>> 0; return sem / 4294967296; };
  // puntos en la franja de +12 a +45 m alrededor de cada sector (fuera del agua de hoy), más algunos dentro del borde recuperado
  const anillos = SECT.map(P => ({ P, a: ensanchar(P, 12), b: ensanchar(P, 45) }));
  const caja = anillos.map(({ b }) => { const xs = b.map(p => p[0]), zs = b.map(p => p[1]); return [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]; });
  for (let k = 0; k < NA * 40 && PUN.length < NA; k++) { const i = rnd() < Math.abs(area(SECT[0])) / A0 ? 0 : Math.min(SECT.length - 1, 1 + Math.floor(rnd() * (SECT.length - 1))), [x0, x1, z0, z1] = caja[i], x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0);
    const R = anillos[i]; if (!dentro(x, z, R.b) || dentro(x, z, R.a)) continue; if (PUN.some(q => Math.hypot(q.x - x, q.z - z) < 7)) continue;
    // tandas de siembra: primero el borde más cercano al agua (años 1-3), luego hacia afuera (años 3-7)
    const lejos = SECT.reduce((m, P) => Math.min(m, P.reduce((mm, p) => Math.min(mm, Math.hypot(p[0] - x, p[1] - z)), 1e9)), 1e9);
    PUN.push({ x, z, s: Math.floor(rnd() * ESP.length), siem: 0.6 + Math.min(1, (lejos - 12) / 33) * 5 + rnd() * 1.4, rot: rnd() * 6.28, esc: 0.8 + rnd() * 0.4 }); }
  // geometría de árbol: tronco + copa (dos esferas deformadas), con color por vértice (tronco café, copa blanca para teñir por instancia)
  const arbolGeo = (forma) => { const parts = [];
    const tr = new THREE.CylinderGeometry(0.12, 0.2, 0.45, 6).translate(0, 0.225, 0); parts.push([tr, new THREE.Color('#5b4230')]);
    const c1 = new THREE.IcosahedronGeometry(0.34, 1); c1.scale(forma === 'ancho' ? 1.35 : 1, forma === 'alto' ? 1.5 : 1, forma === 'ancho' ? 1.25 : 1); c1.translate(0, forma === 'alto' ? 0.75 : 0.62, 0); parts.push([c1, new THREE.Color('#ffffff')]);
    const c2 = new THREE.IcosahedronGeometry(0.24, 1); c2.translate(0.14, forma === 'alto' ? 1.05 : 0.8, 0.06); parts.push([c2, new THREE.Color('#e8e8e8')]);
    const pos = [], col = [], nor = []; parts.forEach(([g, c]) => { const gi = g.toNonIndexed(); gi.computeVertexNormals(); const p = gi.attributes.position, n = gi.attributes.normal;
      for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(c.r, c.g, c.b); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g; };
  const mArbol = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  const FORMAS = ['alto', 'ancho', 'redondo'], ARB = {};
  FORMAS.forEach(f => { const idx = PUN.map((p, i) => i).filter(i => ESP[PUN[i].s][3] === f); if (!idx.length) return;
    const m = new THREE.InstancedMesh(arbolGeo(f), mArbol, idx.length); m.castShadow = !MOV; m.frustumCulled = false; m.count = idx.length;
    idx.forEach((i, k) => { const c = new THREE.Color(ESP[PUN[i].s][1]).offsetHSL(0, 0, (rnd() - 0.5) * 0.06); m.setColorAt(k, c); });
    grupo.add(m); ARB[f] = { m, idx }; });
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V1 = new THREE.Vector3(), S1 = new THREE.Vector3(), EJE = new THREE.Vector3(0, 1, 0);
  let ultAño = -1, sembrados = 0, grandes = 0;
  const crecerArboles = (años) => { if (Math.abs(años - ultAño) < 0.02) return; ultAño = años; sembrados = 0; grandes = 0;
    for (const f in ARB) { const { m, idx } = ARB[f]; idx.forEach((i, k) => { const p = PUN[i], edad = años - p.siem;
      let h = 0; if (edad > 0) { const u = Math.min(1, edad / 5); h = ESP[p.s][2] * p.esc * (0.12 + 0.88 * (1 - Math.pow(1 - u, 2))); sembrados++; if (u >= 0.8) grandes++; }
      Q.setFromAxisAngle(EJE, p.rot); V1.set(p.x, Y, p.z); S1.set(h, h, h); if (h <= 0) S1.set(0.0001, 0.0001, 0.0001); M4.compose(V1, Q, S1); m.setMatrixAt(k, M4); });
      m.instanceMatrix.needsUpdate = true; } };

  /* ---------- aves que llegan con la recuperación ---------- */
  const NB = MOV ? 50 : 110, BP = new Float32Array(NB * 3), gb = new THREE.BufferGeometry(); gb.setAttribute('position', new THREE.BufferAttribute(BP, 3));
  const aves = new THREE.Points(gb, new THREE.PointsMaterial({ size: MOV ? 4 : 5, sizeAttenuation: false, color: '#f4f1e8', transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false }));
  aves.renderOrder = 12; aves.frustumCulled = false; grupo.add(aves);
  const AV = Array.from({ length: NB }, (_, i) => { const P = SECT[i % SECT.length], c = P[Math.floor(rnd() * P.length)]; return { cx: c[0], cz: c[1], r: 25 + rnd() * 70, w: (0.15 + rnd() * 0.35) * (rnd() < 0.5 ? -1 : 1), f: rnd() * 6.28, y: 6 + rnd() * 22 }; });
  let nAves = 0;
  // especies que vuelven (supuesto del modelo [SUP]): [año desde el que se ven, nombre]
  const LLEGAN = [[0, 'Tingua de pico rojo'], [0, 'Garza real'], [0, 'Monjita'], [2, 'Copetón'], [3, 'Mirla patiamarilla'], [4, 'Colibrí chillón'], [5, 'Pato turrio'], [6, 'Cucarachero de pantano'], [8, 'Tingua bogotana']];

  /* ---------- etiqueta sobre el humedal ---------- */
  const css = document.createElement('style'); css.textContent = `
.vaca-et{position:fixed;left:0;top:0;z-index:6;pointer-events:none;display:none;width:250px;padding:9px 11px 10px;border-radius:12px;font:400 11px/1.4 var(--ui-sans,Inter,system-ui,sans-serif);color:#eef1f2;
  background:var(--ui-glass,rgba(14,16,20,.66));border:1px solid rgba(143,209,138,.45);backdrop-filter:blur(14px) saturate(1.6);-webkit-backdrop-filter:blur(14px) saturate(1.6);font-variant-numeric:tabular-nums}
.vaca-et b{display:flex;align-items:center;gap:6px;font-weight:600;font-size:12px}.vaca-et b i{width:9px;height:9px;border-radius:50%;background:#8fd18a;box-shadow:0 0 0 3px rgba(143,209,138,.25)}
.vaca-et small{display:block;color:#a9d6a5;font-size:10px;letter-spacing:.06em;text-transform:uppercase;margin:1px 0 6px}
.vaca-et .bar{height:4px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden;margin:2px 0 7px}.vaca-et .bar span{display:block;height:100%;background:linear-gradient(90deg,#4f8a4a,#8fd18a)}
.vaca-et ul{list-style:none;margin:0;padding:0;display:grid;gap:2px}.vaca-et li{display:flex;justify-content:space-between;gap:8px}.vaca-et li em{font-style:normal;color:#fff;font-weight:600}
.vaca-et .sp{margin-top:6px;color:#c3cace;font-size:10.5px}.vaca-et .sp em{font-style:normal;color:#8fd18a}`;
  document.head.appendChild(css);
  const et = document.createElement('div'); et.className = 'vaca-et'; et.setAttribute('aria-live', 'polite'); document.body.appendChild(et);
  const fmt = (v, d = 0) => v.toLocaleString('es-CO', { maximumFractionDigits: d, minimumFractionDigits: d });

  /* ---------- estado según el año y el escenario ---------- */
  let on = false, k = 0, años = 0, dJ = 0, dW = 0, haNueva = 0;
  const ESTADO = { on: false };
  function aplicar(t, esc, P3) {
    on = T3.escenario === 'proyecto' && esc !== 'A'; grupo.visible = on; if (!on) { et.style.display = 'none'; ESTADO.on = false; return; }
    años = (t + 1) / 52; // 0 a 10
    // velocidad de recuperación: tasa del humedal (P3.rec, 0,02 por defecto), densidad de árboles y escenario
    const vel = Math.max(0.35, Math.min(1.8, (0.55 + (P3 ? P3.rec : 0.02) / 0.02 * 0.3 + (P3 ? P3.arboles : 0.4) * 0.4) * (esc === 'C' ? 1 : 0.75)));
    const x = años * vel, logi = (u) => 1 / (1 + Math.exp(-1.1 * (u - 4.5))), l0 = logi(0);
    k = Math.max(0, Math.min(1, (logi(x) - l0) / (logi(10) - l0))); // 0 → 1, lento al principio
    dJ = 4 + 38 * k; dW = 18 * Math.max(0, k - 0.15) / 0.85; // la franja de juncos sale primero; el agua la sigue
    rearmar(dJ, dW); UA.uK.value = k; UJ.uA.value = Math.min(1, 0.25 + k * 1.5); crecerArboles(años * Math.min(1.25, vel));
    const A1 = SECT.reduce((s, P) => s + Math.abs(area(ensanchar(P, dJ))), 0); haNueva = (A1 - A0) / 10000;
    nAves = Math.round(NB * (0.25 + 0.75 * k)); for (let i = nAves; i < NB; i++) BP[i * 3 + 1] = -999;
    const esp = LLEGAN.filter(([a]) => años * vel >= a);
    Object.assign(ESTADO, { on: true, k, años, ha: haNueva, arboles: sembrados, grandes, especies: esp.length, aves: nAves });
    et.innerHTML = `<b><i></i>Humedal La Vaca · se recupera</b><small>${esc === 'C' ? 'con corredores' : 'sin criterio de ubicación'} · año ${Math.max(1, Math.ceil(años))} de 10</small>
      <div class="bar"><span style="width:${(k * 100).toFixed(0)}%"></span></div>
      <ul><li>Humedal recuperado<em>+${fmt(haNueva, 1)} ha</em></li><li>Árboles nativos sembrados<em>${fmt(sembrados)}</em></li><li>Ya son árboles grandes<em>${fmt(grandes)}</em></li><li>Especies de aves<em>${esp.length} de ${LLEGAN.length}</em></li></ul>
      <div class="sp">Llegan: <em>${esp.slice(-3).map(e => e[1]).join(', ')}</em></div>`;
  }
  /* ---------- cuadro ---------- */
  const V = new THREE.Vector3(), RMQ = matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function cuadro(now) { requestAnimationFrame(cuadro); if (!on) return; const tt = RMQ ? 0 : now / 1000; UA.uT.value = tt; UJ.uT.value = tt;
    for (let i = 0; i < nAves; i++) { const a = AV[i], an = a.f + tt * a.w; BP[i * 3] = a.cx + Math.cos(an) * a.r; BP[i * 3 + 1] = Y + a.y + Math.sin(tt * 2 + a.f) * 1.5; BP[i * 3 + 2] = a.cz + Math.sin(an) * a.r; }
    gb.attributes.position.needsUpdate = true;
    const cam = T3.camera; V.set(C0[0], 60, C0[1]).project(cam); const vis = V.z < 1 && Math.abs(V.x) < 0.95 && Math.abs(V.y) < 0.95 && !document.body.classList.contains('tb-abierto') && cam.position.y > 60;
    et.style.display = vis ? 'block' : 'none'; if (vis) et.style.transform = `translate(${((V.x + 1) / 2 * innerWidth).toFixed(1)}px,${((1 - V.y) / 2 * innerHeight).toFixed(1)}px) translate(-50%,-105%)`; })(0);
  // vuelo al humedal (usa la animación de cámara del simulador)
  const ver = () => { if (!T3.orbit) return; T3.anim = { t: 0, dur: 2.4, p0: T3.camera.position.clone(), c0: T3.orbit.target.clone(), p1: new THREE.Vector3(C0[0] + 260, 380, C0[1] + 520), c1: new THREE.Vector3(C0[0], 0, C0[1] - 40) }; };
  return { aplicar, ESTADO, centro: C0, ver };
}

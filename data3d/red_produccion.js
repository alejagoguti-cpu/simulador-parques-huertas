/* ============ RED DE PRODUCCIÓN ALIMENTARIA (estrategia «red», solo con la propuesta) ============
   Se lee como un recorrido de aprendizaje, de Bavaria hacia las casas:
   1. APRENDEN en Bavaria Común: huertas de enseñanza, aulas y laboratorios. De ahí sale el conocimiento (y semillas, bioinsumos)
      hacia cada clúster de barrio.
   2. PRACTICAN en el barrio: cada clúster tiene huertas efímeras en los parques; los colegios cercanos llevan a sus estudiantes a la
      huerta del parque más cercana (enseñanza práctica cerca del colegio).
   3. LO LLEVAN A CASA: los vecinos implementan huertas en techos y patios; cada casa se apoya en la huerta del parque más cercana
      (plántulas, compost, dudas) y lleva ahí lo que cosecha para el mercado del barrio.
   Datos: huertas_barrio.json (parques y lotes), colegios.json, estrategias.json (E8: techos), bavaria.json. */
export async function crearRedProduccion({ T3, lw, cj }) {
  const THREE = T3.THREE, MOV = matchMedia('(pointer:coarse)').matches, RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const [HB, ES, BV, CO] = await Promise.all([cj('data3d/huertas_barrio.json?v=3'), cj('data3d/estrategias.json?v=5'), cj('data3d/bavaria.json?v=3'), cj('data3d/colegios.json?v=2').catch(() => null)]);
  const grupo = new THREE.Group(); grupo.name = 'red_produccion'; grupo.visible = false; T3.scene.add(grupo);
  const PAL = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7']; // Tableau (convencional)
  const Y = (T3.sueloY != null ? T3.sueloY : 0.35);
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

  /* ---------- nodos ---------- */
  const HU = HB.huertas.map(h => ({ n: h.n, tipo: h.tipo, c: h.c || h.m[0].c }));
  const COL = (CO && CO.colegios || []).map(c => ({ n: c.n, c: c.c }));
  const e8 = ES.estrategias.find(e => e.id === 'E8'), esc = ES.escala || 0.5;
  const cen = (fl) => { let x = 0, y = 0, n = fl.length >> 1; for (let k = 0; k < n; k++) { x += fl[k * 2]; y += fl[k * 2 + 1]; } return lw(x / n * esc, y / n * esc); };
  const TE = []; for (const c of e8.capas) { if (/bald/i.test(c.n)) continue; const alto = /altura/i.test(c.n); c.lotes.forEach((l, i) => { if (!alto && i % (MOV ? 3 : 2)) return; TE.push({ c: cen(l), y: alto ? 24 : 8 }); }); }
  const bc = (i) => { const p = BV.edif[i].p; let x = 0, y = 0; for (const q of p) { x += q[0]; y += q[1]; } return lw(x / p.length, y / p.length); };
  const BAV = bc(3); // Instituto de enseñanza: de ahí sale la red

  // clústeres de barrio: k-medias sobre las huertas
  const K = 8, C = [HU[0].c.slice()];
  while (C.length < K) { let m = null, md = -1; for (const h of HU) { const d = Math.min(...C.map(c => d2(c, h.c))); if (d > md) { md = d; m = h; } } C.push(m.c.slice()); }
  for (let it = 0; it < 30; it++) { const S = C.map(() => [0, 0, 0]); for (const h of HU) { let b = 0; C.forEach((c, k) => { if (d2(c, h.c) < d2(C[b], h.c)) b = k; }); h.k = b; S[b][0] += h.c[0]; S[b][1] += h.c[1]; S[b][2]++; } S.forEach((s, k) => { if (s[2]) C[k] = [s[0] / s[2], s[1] / s[2]]; }); }
  const CL = C.map((c, k) => { const m = HU.filter(h => h.k === k); if (!m.length) return null; const hub = m.reduce((a, h) => d2(h.c, c) < d2(a.c, c) ? h : a, m[0]);
    const nom = (hub.n.replace(/^Huerta (efímera )?(del parque |en )?/i, '').split(',')[0] || 'Barrio').replace(/^Urbanización /i, ''); return { k, c: hub.c, m, nom, col: PAL[k % PAL.length], te: 0, co: 0 }; }).filter(Boolean);
  const cl = (k) => CL.find(q => q.k === k);
  const masCerca = (p) => { let b = HU[0], bd = 1e18; for (const h of HU) { const d = d2(h.c, p); if (d < bd) { bd = d; b = h; } } return [b, Math.sqrt(bd)]; };
  for (const t of TE) { const [h, d] = masCerca(t.c); t.h = h; t.d = d; if (d < 1000) cl(h.k).te++; }
  for (const s of COL) { const [h, d] = masCerca(s.c); s.h = h; s.d = d; if (d < 1400) cl(h.k).co++; }

  /* ---------- dibujo: cintas (tubos) con grosor según el paso, para que se lean de lejos ---------- */
  const colr = new THREE.Color();
  const curva = (a, b, ya, yb, k) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return new THREE.QuadraticBezierCurve3(new THREE.Vector3(a[0], ya, a[1]), new THREE.Vector3((a[0] + b[0]) / 2, Math.max(ya, yb) + L * k, (a[1] + b[1]) / 2), new THREE.Vector3(b[0], yb, b[1])); };
  const cintas = (lista, r, seg, op) => { if (!lista.length) return null; const gs = lista.map(([cv, c]) => { const g = new THREE.TubeGeometry(cv, seg, r, 5, false); colr.set(c); const n = g.attributes.position.count, A = new Float32Array(n * 3); for (let i = 0; i < n; i++) A.set([colr.r, colr.g, colr.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(A, 3)); return g; });
    const m = new THREE.Mesh(mergeGeometries(gs), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: op, depthWrite: false, toneMapped: false })); m.renderOrder = 9; grupo.add(m); return m; };
  const esHub = (h) => CL.some(q => q.c === h.c);
  const P1 = CL.map(q => [curva(BAV, q.c, 30, Y + 4, 0.16), q.col]);                                                   // 1 · Bavaria -> clúster
  const P2 = HU.filter(h => !esHub(h)).map(h => [curva(cl(h.k).c, h.c, Y + 4, Y + 3, 0.06), cl(h.k).col]);              //     nodo -> huertas del clúster
  const P3 = COL.filter(s => s.d < 1400).map(s => [curva(s.c, s.h.c, Y + 3, Y + 3, 0.05), cl(s.h.k).col]);            // 2 · colegio -> huerta del parque
  const P4 = TE.filter(t => t.d < 1000).map(t => [curva(t.h.c, t.c, Y + 3, t.y, 0.04), cl(t.h.k).col]);               // 3 · huerta -> casa
  const N1 = cintas(P1, MOV ? 5 : 4, 48, 0.85), N2 = cintas(P2, 1.6, 16, 0.7), N3 = cintas(P3, 1.2, 12, 0.75);
  const N4 = (() => { const P = [], Cc = []; for (const [cv, c] of P4) { const p = cv.getPoints(8); colr.set(c); for (let i = 1; i < p.length; i++) { P.push(p[i - 1].x, p[i - 1].y, p[i - 1].z, p[i].x, p[i].y, p[i].z); Cc.push(colr.r, colr.g, colr.b, colr.r, colr.g, colr.b); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false })); l.renderOrder = 9; grupo.add(l); return l; })();
  // nodos: casas (puntos), colegios (blancos), huertas (color del clúster), Bavaria (faro de luz)
  const pts = (lista, tam, op) => { const P = [], Cc = []; for (const [p, y, c] of lista) { P.push(p[0], y, p[1]); colr.set(c); Cc.push(colr.r, colr.g, colr.b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({ size: tam, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: op, depthWrite: false, toneMapped: false })); m.renderOrder = 10; grupo.add(m); return m; };
  const D4 = pts(TE.filter(t => t.d < 1000).map(t => [t.c, t.y, cl(t.h.k).col]), MOV ? 3 : 3.5, 0.9);
  const D3 = pts(COL.filter(s => s.d < 1400).map(s => [s.c, Y + 4, '#ffffff']), MOV ? 6 : 7, 0.95);
  const D2 = pts(HU.map(h => [h.c, Y + 4, cl(h.k).col]), MOV ? 8 : 10, 1);
  const faro = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 60, 16, 1, true).translate(0, 30, 0), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  faro.position.set(BAV[0], Y, BAV[1]); grupo.add(faro);
  // flujo animado: el conocimiento SALE de Bavaria hacia cada clúster, los colegios van a la huerta y de la huerta sale a las casas
  const flujos = [[P1, 4, MOV ? 7 : 8], [P3, 1, 5], [P4.filter((_, i) => i % 3 === 0), 1, 4]].map(([L, n, tam]) => {
    const N = Math.max(1, L.length * n), g = new THREE.BufferGeometry(), A = new Float32Array(N * 3), Cc = new Float32Array(N * 3), bl = new THREE.Color('#ffffff');
    for (let i = 0; i < N && L.length; i++) { colr.set(L[i % L.length][1]).lerp(bl, 0.35); Cc.set([colr.r, colr.g, colr.b], i * 3); }
    g.setAttribute('position', new THREE.BufferAttribute(A, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ size: tam, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false })); p.renderOrder = 11; grupo.add(p); return { L, n, N, A, g, p }; });
  const V = new THREE.Vector3();
  const animar = () => { const t = RMQ.matches ? 0.5 : performance.now() / 7000; for (const F of flujos) { if (!F.L.length) continue; for (let i = 0; i < F.N; i++) { const cv = F.L[i % F.L.length][0], f = (t + Math.floor(i / F.L.length) / F.n + (i % 5) * 0.05) % 1; cv.getPoint(f, V); F.A[i * 3] = V.x; F.A[i * 3 + 1] = V.y; F.A[i * 3 + 2] = V.z; } F.g.attributes.position.needsUpdate = true; } };
  let raf = 0; const loop = () => { animar(); raf = grupo.visible ? requestAnimationFrame(loop) : 0; };

  // los tres pasos se pueden resaltar desde la leyenda
  const PASO = { 1: [N1, N2, flujos[0].p, faro], 2: [N3, D3, flujos[1].p, D2], 3: [N4, D4, flujos[2].p] };
  for (const p in PASO) for (const o of PASO[p]) if (o) o.userData.op = o.material.opacity;
  const resaltar = (k) => { for (const p in PASO) for (const o of PASO[p]) if (o) o.material.opacity = (!k || +p === k) ? o.userData.op : 0.07; };

  /* ---------- etiquetas y leyenda ---------- */
  const st = document.createElement('style');
  st.textContent = `.rp-et{position:fixed;left:0;top:0;z-index:5;pointer-events:none;font:500 11px/1.25 var(--ui-sans,Inter,system-ui,sans-serif);color:#eef1f2;padding:5px 9px;border-radius:9px;background:var(--ui-glass,rgba(14,16,20,.6));border:1px solid var(--ui-glass-bd,rgba(255,255,255,.16));backdrop-filter:blur(14px) saturate(1.6);-webkit-backdrop-filter:blur(14px) saturate(1.6);white-space:nowrap;display:none}
.rp-et i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:0}.rp-et small{display:block;color:#b3bbc0;font-weight:400;font-size:10px;margin-top:1px}
#rp-ley{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:6;width:min(600px,calc(100vw - 32px));box-sizing:border-box;padding:10px;border-radius:16px;background:var(--ui-glass,rgba(14,16,20,.6));border:1px solid var(--ui-glass-bd,rgba(255,255,255,.16));box-shadow:var(--ui-glass-sh,none);backdrop-filter:var(--ui-glass-fx,blur(24px));-webkit-backdrop-filter:var(--ui-glass-fx,blur(24px));color:#e9ecee;font:400 11.5px/1.4 var(--ui-sans,Inter,system-ui,sans-serif);display:none}
#rp-ley ol{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
#rp-ley button{all:unset;box-sizing:border-box;display:block;width:100%;height:100%;padding:9px 10px;border-radius:11px;cursor:pointer;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);transition:background .2s,border-color .2s}
#rp-ley button:hover,#rp-ley button[aria-pressed=true]{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22)}#rp-ley button:focus-visible{outline:2px solid #fff;outline-offset:1px}
#rp-ley .n{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#fff;color:#111;font-weight:600;font-size:10.5px;margin-right:7px}
#rp-ley b{font-weight:600;font-size:12.5px}#rp-ley span.d{display:block;margin-top:4px;color:#b3bbc0;font-size:10.5px}#rp-ley em{font-style:normal;color:#fff}
@media (max-width:640px){#rp-ley{bottom:78px;padding:8px}#rp-ley ol{grid-template-columns:1fr}#rp-ley button{padding:7px 9px}#rp-ley span.d{display:inline;margin:0 0 0 6px}}`;
  document.head.appendChild(st);
  const nTE = TE.filter(t => t.d < 1000).length, nCO = COL.filter(s => s.d < 1400).length;
  const ET = CL.map(q => { const d = document.createElement('div'); d.className = 'rp-et'; d.innerHTML = `<i style="background:${q.col}"></i>${q.nom}<small>${q.m.length} huertas · ${q.co} colegios · ${q.te} casas</small>`; document.body.appendChild(d); return { p: [q.c[0], Y + 10, q.c[1]], d }; });
  { const d = document.createElement('div'); d.className = 'rp-et'; d.innerHTML = `<i style="background:#fff"></i>Bavaria Común<small>aquí se aprende a sembrar</small>`; document.body.appendChild(d); ET.push({ p: [BAV[0], 64, BAV[1]], d }); }
  const ley = document.createElement('div'); ley.id = 'rp-ley';
  ley.innerHTML = `<ol>
<li><button type="button" data-p="1" aria-pressed="false"><b><span class="n">1</span>Aprenden en Bavaria</b><span class="d">Cursos, semillas y bioinsumos salen hacia <em>${CL.length} barrios</em>.</span></button></li>
<li><button type="button" data-p="2" aria-pressed="false"><b><span class="n">2</span>Practican en el barrio</b><span class="d"><em>${nCO} colegios</em> usan las <em>${HU.length} huertas</em> de parques y lotes.</span></button></li>
<li><button type="button" data-p="3" aria-pressed="false"><b><span class="n">3</span>Lo llevan a casa</b><span class="d"><em>${nTE.toLocaleString('es-CO')} techos</em> y patios con huerta, apoyados en la huerta más cercana.</span></button></li></ol>`;
  document.body.appendChild(ley);
  let sel = 0; ley.addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (!b) return; sel = sel === +b.dataset.p ? 0 : +b.dataset.p; resaltar(sel); ley.querySelectorAll('[data-p]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.p === sel))); });
  let rafE = 0; const P2v = new THREE.Vector3();
  const etiquetas = () => { const cam = T3.camera, W = innerWidth, H = innerHeight; for (const e of ET) { P2v.set(e.p[0], e.p[1], e.p[2]).project(cam); const ok = P2v.z < 1 && Math.abs(P2v.x) < 0.95 && Math.abs(P2v.y) < 0.95; e.d.style.display = ok ? 'block' : 'none'; if (ok) e.d.style.transform = `translate(${((P2v.x + 1) / 2 * W).toFixed(1)}px,${((1 - P2v.y) / 2 * H).toFixed(1)}px) translate(-50%,-120%)`; } rafE = requestAnimationFrame(etiquetas); };
  const volar = () => { if (!T3.orbit) return; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of HU.map(h => h.c).concat([BAV])) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, o = T3.orbit, p0 = T3.camera.position.clone(), t0 = o.target.clone(), p1 = new THREE.Vector3(cx, 2450, cz + 500), t1 = new THREE.Vector3(cx, 0, cz + 120), ini = performance.now();
    const f = () => { const k = Math.min(1, (performance.now() - ini) / 1500), e = k * k * (3 - 2 * k); T3.camera.position.lerpVectors(p0, p1, e); o.target.lerpVectors(t0, t1, e); o.update(); if (k < 1) requestAnimationFrame(f); }; f(); };
  return {
    clusters: CL.length, huertas: HU.length, techos: nTE, colegios: nCO,
    ver(on) { on = !!on; if (on === grupo.visible) return; grupo.visible = on; ley.style.display = on ? 'block' : 'none'; cancelAnimationFrame(rafE);
      if (on) { etiquetas(); volar(); if (!raf) loop(); } else ET.forEach(e => { e.d.style.display = 'none'; }); }
  };
}

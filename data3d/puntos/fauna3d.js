/* ============ FAUNA 3D DE LA HUERTA (vista en puntos de Bavaria Común) ============
   Animales modelados con su forma y colores reales, animados en lo que hacen en la huerta:
   abejas y mariposas que van de flor en flor del cilantro y se posan; abejorro que hace vibrar las flores del tomate; colibrí que
   flota frente a las flores; mariquitas que caminan sobre la lechuga; lombrices en el suelo de las camas;
   copetón que salta y picotea en el camino; mirla que saca una lombriz; murciélago al rededor del urapán.
   Insectos a escala aumentada (x9) y aves (x2,4) para que se lean a la distancia de la vista; las posiciones salen de
   bavaria_campo.json (cada especie sobre su planta). */
export function crearFauna3D({ THREE, S, M, RMQ = false, modelo = null }) { // modelo(k): Object3D propio (p. ej. la especie en puntos) en vez de la malla
  const porK = Object.fromEntries(M.especies.map(e => [e.k, e]));
  const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  const grupo = new THREE.Group(); S.add(grupo);
  S.add(new THREE.HemisphereLight(0xdfe9f3, 0x3a3020, 1.3)); const sol = new THREE.DirectionalLight(0xfff1dc, 1.6); sol.position.set(-30, 60, 20); S.add(sol);
  const lienzo = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const std = (c, ex = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...ex });
  const elip = (rx, ry, rz, m, seg = 14) => { const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)); g.scale(rx, ry, rz); return new THREE.Mesh(g, m); };
  const ala = (w, l, tex, op = 1) => { const g = new THREE.PlaneGeometry(w, l); g.translate(w / 2, 0, 0); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, roughness: 0.4 })); return m; };
  const pivote = (obj) => { const p = new THREE.Group(); p.add(obj); return p; };

  /* ---------- texturas ---------- */
  const tAbdomen = lienzo(64, 64, (g, w, h) => { for (let y = 0; y < h; y += 16) { g.fillStyle = '#d9a31c'; g.fillRect(0, y, w, 9); g.fillStyle = '#2a1d0e'; g.fillRect(0, y + 9, w, 7); } });
  const tAlaVid = lienzo(128, 64, (g, w, h) => { g.fillStyle = 'rgba(230,238,245,.38)'; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 4, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,50,40,.55)'; g.lineWidth = 1.2; g.stroke(); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(4, h / 2); g.quadraticCurveTo(w * 0.5, h * (0.15 + i * 0.14), w - 6, h * (0.2 + i * 0.12)); g.stroke(); } });
  const tMariposa = lienzo(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h);
    g.fillStyle = '#d86a22'; g.beginPath(); g.moveTo(8, 128); g.bezierCurveTo(60, 10, 200, 0, 250, 60); g.bezierCurveTo(240, 120, 150, 130, 8, 128); g.fill();       // ala anterior
    g.fillStyle = '#c95e1d'; g.beginPath(); g.moveTo(8, 130); g.bezierCurveTo(110, 140, 200, 170, 190, 220); g.bezierCurveTo(140, 255, 50, 220, 8, 130); g.fill();  // ala posterior
    g.fillStyle = '#1b1410'; g.beginPath(); g.moveTo(150, 20); g.bezierCurveTo(210, 10, 250, 40, 250, 60); g.bezierCurveTo(235, 95, 200, 100, 170, 80); g.closePath(); g.fill(); // punta negra
    g.fillStyle = '#f4efe6'; for (const [x, y, r] of [[205, 45, 9], [228, 58, 6], [185, 62, 7], [215, 78, 5]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = '#2b1d14'; for (const [x, y] of [[120, 175], [150, 195], [100, 200]]) { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(60,40,25,.5)'; g.fillRect(8, 120, 60, 16); });
  const tMariquita = lienzo(64, 64, (g, w, h) => { g.fillStyle = '#d4231d'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.fillRect(w / 2 - 1, 0, 2, h); for (const [x, y, r] of [[18, 20, 6], [46, 20, 6], [14, 42, 5], [50, 42, 5], [32, 50, 5]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } });
  const tCopeton = lienzo(64, 64, (g, w, h) => { g.fillStyle = '#8b6a48'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? '#3d2c1e' : '#c9a77c'; g.fillRect(Math.random() * w, Math.random() * h, 3, 9); } });

  /* ---------- modelos ---------- */
  const K_INS = 9, K_AVE = 2.4;
  function abeja(abejorro = false) {
    const k = K_INS * (abejorro ? 1.6 : 1), g = new THREE.Group();
    const ab = elip(0.0055 * k, 0.0042 * k, 0.0075 * k, std('#ffffff', { map: tAbdomen, roughness: 0.85 })); ab.position.z = -0.008 * k; if (abejorro) ab.material.color.set('#cfc4a0');
    const tor = elip(0.0045 * k, 0.0042 * k, 0.0045 * k, std(abejorro ? '#1b1712' : '#6b4a22', { roughness: 1 })); const cab = elip(0.0033 * k, 0.003 * k, 0.003 * k, std('#1d1a17')); cab.position.z = 0.0065 * k;
    const aI = pivote(ala(0.011 * k, 0.005 * k, tAlaVid, 0.75)), aD = pivote(ala(0.011 * k, 0.005 * k, tAlaVid, 0.75)); aD.scale.x = -1; aI.position.set(0.002 * k, 0.004 * k, 0.001 * k); aD.position.set(-0.002 * k, 0.004 * k, 0.001 * k);
    g.add(ab, tor, cab, aI, aD); g.userData = { aI, aD, f: abejorro ? 140 : 190 }; return g;
  }
  function mariposa() {
    const k = 6, g = new THREE.Group(); const cuerpo = elip(0.0025 * k, 0.0025 * k, 0.013 * k, std('#2b2420'));
    const aI = pivote(ala(0.028 * k, 0.028 * k, tMariposa)), aD = pivote(ala(0.028 * k, 0.028 * k, tMariposa)); aD.scale.x = -1;
    for (const a of [aI, aD]) { a.children[0].material.depthWrite = true; a.children[0].material.alphaTest = 0.4; a.children[0].material.transparent = false; }
    g.add(cuerpo, aI, aD); g.userData = { aI, aD, f: 9 }; return g;
  }
  function mariquita() {
    const k = K_INS * 0.85, g = new THREE.Group(); const c = new THREE.Mesh(new THREE.SphereGeometry(0.0035 * k, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.75, 1.15), std('#ffffff', { map: tMariquita, roughness: 0.25, metalness: 0.1 }));
    const cab = elip(0.0016 * k, 0.0013 * k, 0.0013 * k, std('#111')); cab.position.set(0, 0.0005 * k, 0.0038 * k); g.add(c, cab); return g;
  }
  function colibri() {
    const k = K_AVE, g = new THREE.Group(); const iri = std('#1f8f6a', { metalness: 0.65, roughness: 0.25 });
    const cuerpo = elip(0.016 * k, 0.017 * k, 0.04 * k, iri); const cab = elip(0.014 * k, 0.014 * k, 0.015 * k, std('#2b7fae', { metalness: 0.6, roughness: 0.25 })); cab.position.set(0, 0.012 * k, 0.034 * k);
    const pico = new THREE.Mesh(new THREE.ConeGeometry(0.0025 * k, 0.032 * k, 6).rotateX(Math.PI / 2), std('#111')); pico.position.set(0, 0.011 * k, 0.063 * k);
    const cola = new THREE.Mesh(new THREE.ConeGeometry(0.01 * k, 0.03 * k, 4).rotateX(-Math.PI / 2).scale(1, 0.25, 1), iri); cola.position.set(0, -0.004 * k, -0.05 * k);
    const tA = lienzo(64, 32, (g2, w, h) => { g2.fillStyle = 'rgba(40,60,55,.55)'; g2.beginPath(); g2.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 3, 0, 0, 7); g2.fill(); });
    const aI = pivote(ala(0.055 * k, 0.018 * k, tA, 0.8)), aD = pivote(ala(0.055 * k, 0.018 * k, tA, 0.8)); aD.scale.x = -1; aI.position.y = aD.position.y = 0.01 * k;
    g.add(cuerpo, cab, pico, cola, aI, aD); g.userData = { aI, aD, f: 60 }; return g;
  }
  function pajaro(tipo) { // copetón (Zonotrichia capensis) o mirla patiamarilla (Turdus fuscater)
    const mirla = tipo === 'mirla', k = K_AVE * (mirla ? 1.3 : 1), g = new THREE.Group();
    const mc = mirla ? std('#4a4440', { roughness: 0.9 }) : std('#ffffff', { map: tCopeton, roughness: 0.95 }), mg = std(mirla ? '#3b3632' : '#8d8d8a', { roughness: 0.9 });
    const cuerpo = elip(0.03 * k, 0.03 * k, 0.05 * k, mc); cuerpo.position.y = 0.045 * k;
    const pecho = elip(0.026 * k, 0.026 * k, 0.03 * k, std(mirla ? '#5a534d' : '#cfc8bb', { roughness: 1 })); pecho.position.set(0, 0.04 * k, 0.022 * k);
    const cuello = new THREE.Group(); cuello.position.set(0, 0.07 * k, 0.04 * k);
    const cab = elip(0.021 * k, 0.021 * k, 0.023 * k, mg); cuello.add(cab);
    if (!mirla) { const collar = new THREE.Mesh(new THREE.TorusGeometry(0.02 * k, 0.006 * k, 6, 16), std('#a0522d')); collar.rotation.x = Math.PI / 2; collar.position.y = -0.012 * k; cuello.add(collar);
      const cresta = new THREE.Mesh(new THREE.ConeGeometry(0.008 * k, 0.02 * k, 6), mg); cresta.position.set(0, 0.022 * k, -0.004 * k); cresta.rotation.x = -0.5; cuello.add(cresta);
      for (const s of [-1, 1]) { const ra = elip(0.002 * k, 0.004 * k, 0.014 * k, std('#151515')); ra.position.set(s * 0.016 * k, 0.006 * k, 0); cuello.add(ra); } }
    const pico = new THREE.Mesh(new THREE.ConeGeometry(0.0055 * k, (mirla ? 0.026 : 0.016) * k, 6).rotateX(Math.PI / 2), std(mirla ? '#f2b705' : '#3a3530', { roughness: 0.5 })); pico.position.set(0, -0.002 * k, 0.027 * k); cuello.add(pico);
    for (const s of [-1, 1]) { const ojo = elip(0.003 * k, 0.003 * k, 0.003 * k, std(mirla ? '#f2b705' : '#111')); ojo.position.set(s * 0.014 * k, 0.005 * k, 0.012 * k); cuello.add(ojo); }
    const cola = new THREE.Mesh(new THREE.BoxGeometry(0.03 * k, 0.005 * k, 0.06 * k), mc); cola.position.set(0, 0.05 * k, -0.065 * k); cola.rotation.x = -0.3;
    const pata = std(mirla ? '#e0a400' : '#8a6f5a'); for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.0018 * k, 0.0018 * k, 0.03 * k, 5), pata); l.position.set(s * 0.012 * k, 0.015 * k, 0.004 * k); g.add(l); }
    g.add(cuerpo, pecho, cuello, cola); g.userData = { cuello }; return g;
  }
  function lombriz() { const pts = Array.from({ length: 9 }, (_, i) => new THREE.Vector3(0, 0, i * 0.012)); const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0028 * 2.5, 6), std('#b0646a', { roughness: 0.35 })); g.add(m); g.userData = { pts, m }; return g; }
  function murcielago() { const g = new THREE.Group(), k = 2; const c = elip(0.012 * k, 0.012 * k, 0.03 * k, std('#3a2f2a', { roughness: 1 }));
    const tA = lienzo(64, 64, (g2, w, h) => { g2.fillStyle = '#2a211d'; g2.beginPath(); g2.moveTo(0, 20); g2.lineTo(w, 4); g2.lineTo(w - 10, 30); g2.lineTo(w - 22, 26); g2.lineTo(w - 30, 44); g2.lineTo(w - 44, 36); g2.lineTo(0, 46); g2.fill(); });
    const aI = pivote(ala(0.13 * k, 0.07 * k, tA)), aD = pivote(ala(0.13 * k, 0.07 * k, tA)); aD.scale.x = -1; for (const a of [aI, aD]) { a.children[0].material.alphaTest = 0.5; a.children[0].material.transparent = false; }
    g.add(c, aI, aD); g.userData = { aI, aD, f: 11 }; return g; }

  /* ---------- comportamientos ---------- */
  const AG = [], rnd = (a, b) => a + Math.random() * (b - a);
  const flores = (k, n, r, dy) => { const e = porK[k]; if (!e) return []; return Array.from({ length: n }, () => new THREE.Vector3(e.p[0] + rnd(-r, r), e.p[1] + dy + rnd(-0.05, 0.12), e.p[2] + rnd(-r, r))); };
  const F_CIL = flores('cilantro', 14, 1.0, 0.05), F_TOM = flores('tomate', 10, 1.4, 0.2), F_LEC = flores('lechuga', 10, 0.45, 0.02);
  // volador que visita flores: vuela con curva, flota, se posa y sigue
  const visitante = (obj, F, vel, posa, alto, k) => { if (!F.length) return; obj.position.copy(F[0]); grupo.add(obj); AG.push({ tipo: 'vis', k, obj, F, vel, posa, alto, ini: obj.position.clone(), fin: F[Math.floor(Math.random() * F.length)].clone(), u: Math.random(), espera: 0 }); };
  const MK = (k, f) => (modelo && modelo(k)) || f();
  for (let i = 0; i < 7; i++) visitante(MK('abeja', abeja), F_CIL, rnd(1.2, 1.8), [1.2, 3.2], 0.5, 'abeja');
  for (let i = 0; i < 2; i++) visitante(MK('abejorro', () => abeja(true)), F_TOM, rnd(0.9, 1.2), [1.5, 3.5], 0.4, 'abejorro');
  for (let i = 0; i < 3; i++) visitante(MK('mariposa', mariposa), F_CIL, rnd(0.55, 0.8), [2.5, 5], 0.9, 'mariposa');
  visitante(MK('colibri', colibri), F_CIL.slice(0, 6), 2.6, [2.2, 3.4], 0.6, 'colibri');
  // mariquitas caminando sobre la lechuga
  for (let i = 0; i < 4; i++) { const o = MK('mariquita', mariquita), c = F_LEC[i % F_LEC.length]; if (!c) break; o.position.copy(c); grupo.add(o); AG.push({ tipo: 'cam', k: 'mariquita', obj: o, c: c.clone(), a: rnd(0, 6.28), r: rnd(0.03, 0.07), v: rnd(0.25, 0.45) }); }
  // lombrices en el suelo de la cama
  const eL = porK.lombriz; if (eL) for (let i = 0; i < 3; i++) { const o = MK('lombriz', lombriz); o.position.set(eL.p[0] + rnd(-0.4, 0.4), eL.p[1] + 0.02, eL.p[2] + rnd(-0.4, 0.4)); o.rotation.y = rnd(0, 6.28); grupo.add(o); AG.push({ tipo: 'lom', k: 'lombriz', obj: o, f: rnd(0, 6) }); }
  // pájaros en el camino: saltan, picotean; la mirla saca una lombriz
  for (const [k, n] of [['copeton', 2], ['mirla', 1]]) { const e = porK[k]; if (!e) continue;
    for (let i = 0; i < n; i++) { const o = MK(k, () => pajaro(k)), base = V3(e.p); base.x += rnd(-0.6, 0.6); base.z += rnd(-0.6, 0.6); o.position.copy(base); grupo.add(o);
      let presa = null; if (k === 'mirla') { presa = MK('lombriz', lombriz); if (!modelo) presa.scale.setScalar(1.3); grupo.add(presa); }
      AG.push({ tipo: 'paj', k, obj: o, base, dest: base.clone(), t: 0, est: 'mira', dur: rnd(0.6, 1.4), mirla: k === 'mirla', presa }); } }
  const eU = porK.urapan, eM = porK.murcielago; if (eU || eM) { const o = MK('murcielago', murcielago), c = V3((eM || eU).p); grupo.add(o); AG.push({ tipo: 'mur', k: 'murcielago', obj: o, c, r: 4, a: 0 }); }

  // pulgones sobre la lechuga: la mariquita se los come al pasar (vuelven a aparecer después)
  const PUL = [], nPul = 90, gPul = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0012 * K_INS, 6, 4).scale(1, 0.8, 1.3), std('#9acd32', { roughness: 0.5 }), nPul);
  AG.filter(g => g.tipo === 'cam').forEach((g, j) => { for (let i = 0; i < nPul / 4; i++) { const a = Math.random() * 6.28, r = g.r + (Math.random() - 0.5) * 0.05; PUL.push({ p: new THREE.Vector3(g.c.x + Math.cos(a) * r, g.c.y + 0.004, g.c.z + Math.sin(a) * r), vivo: true, t: 0 }); } });
  gPul.count = 0; // sin pulgones: la escena muestra solo las especies que ayudan a la huerta const oP = new THREE.Object3D();
  const pulgones = (dt) => { PUL.forEach((p, i) => { if (!p.vivo) { p.t -= dt; if (p.t <= 0) p.vivo = true; } else for (const g of AG) if (g.tipo === 'cam' && g.obj.position.distanceToSquared(p.p) < 0.0004) { p.vivo = false; p.t = 12 + Math.random() * 10; }
    oP.position.copy(p.p); oP.scale.setScalar(p.vivo ? 1 : 0.0001); oP.updateMatrix(); gPul.setMatrixAt(i, oP.matrix); }); gPul.instanceMatrix.needsUpdate = true; };
  /* ---------- animación ---------- */
  const tmp = new THREE.Vector3(), mira = new THREE.Vector3();
  const aletea = (o, t, amp = 0.9) => { const u = o.userData; if (!u.aI) return; const a = Math.sin(t * u.f) * amp; u.aI.rotation.z = a; u.aD.rotation.z = -a; };
  function paso(dt, t) {
    for (const g of AG) {
      if (g.tipo === 'vis') {
        if (g.espera > 0) { g.espera -= dt; aletea(g.obj, t, g.obj.userData.f > 50 ? 0.9 : 0.25); if (g.obj.userData.f < 20) aletea(g.obj, t * 0.25, 0.5); g.obj.position.y = g.fin.y + Math.sin(t * 6) * 0.004; continue; }
        const d = g.ini.distanceTo(g.fin) || 0.01; g.u = Math.min(1, g.u + dt * g.vel / d);
        const s = g.u * g.u * (3 - 2 * g.u); tmp.lerpVectors(g.ini, g.fin, s); tmp.y += Math.sin(Math.PI * s) * g.alto * Math.min(1, d); tmp.x += Math.sin(t * 7 + g.vel) * 0.03; tmp.z += Math.cos(t * 5.3) * 0.03;
        mira.copy(tmp).sub(g.obj.position); if (mira.lengthSq() > 1e-7) g.obj.rotation.y = Math.atan2(mira.x, mira.z); g.obj.position.copy(tmp); aletea(g.obj, t);
        if (g.u >= 1) { g.espera = rnd(g.posa[0], g.posa[1]); g.ini.copy(g.fin); g.fin.copy(g.F[Math.floor(Math.random() * g.F.length)]); g.u = 0; }
      } else if (g.tipo === 'cam') { g.a += dt * g.v * (Math.sin(t * 0.7 + g.r * 40) > -0.3 ? 1 : 0); g.obj.position.set(g.c.x + Math.cos(g.a) * g.r, g.c.y, g.c.z + Math.sin(g.a) * g.r); g.obj.rotation.y = -g.a; }
      else if (g.tipo === 'lom') { const u = g.obj.userData, P = u.pts; if (!P) { g.obj.position.y += Math.sin(t * 2 + g.f) * 0.0004; continue; } for (let i = 0; i < P.length; i++) P[i].x = Math.sin(t * 2.2 + g.f + i * 0.8) * 0.006 * Math.min(1, i / 2); u.m.geometry.dispose(); u.m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), 24, 0.007, 6); }
      else if (g.tipo === 'paj') { g.t += dt; const cu = g.obj.userData.cuello || new THREE.Object3D();
        if (g.est === 'mira') { cu.rotation.x = Math.sin(t * 3) * 0.1; if (g.t > g.dur) { g.t = 0; const r = Math.random(); if (r < 0.45) { g.est = 'pica'; g.dur = rnd(0.8, 1.6); } else { g.est = 'salta'; g.dur = 0.35; g.from = g.obj.position.clone(); g.dest = g.base.clone().add(new THREE.Vector3(rnd(-0.9, 0.9), 0, rnd(-0.9, 0.9))); g.obj.rotation.y = Math.atan2(g.dest.x - g.from.x, g.dest.z - g.from.z); } } }
        else if (g.est === 'pica') { cu.rotation.x = 0.9 * Math.max(0, Math.sin(g.t * 9)); if (g.mirla && g.presa) { const k2 = Math.min(1, g.t / g.dur); g.presa.visible = true; g.presa.position.copy(g.obj.position).add(new THREE.Vector3(Math.sin(g.obj.rotation.y) * 0.06, 0.005 + k2 * 0.04, Math.cos(g.obj.rotation.y) * 0.06)); g.presa.rotation.x = -k2 * 1.2; g.presa.rotation.y = g.obj.rotation.y; }
          if (g.t > g.dur) { g.t = 0; g.est = 'mira'; g.dur = rnd(0.6, 1.6); cu.rotation.x = 0; if (g.presa) g.presa.visible = false; } }
        else if (g.est === 'salta') { const k2 = Math.min(1, g.t / g.dur); g.obj.position.lerpVectors(g.from, g.dest, k2); g.obj.position.y = g.from.y + Math.sin(Math.PI * k2) * 0.08; if (k2 >= 1) { g.t = 0; g.est = Math.random() < 0.5 ? 'salta' : 'mira'; g.dur = g.est === 'salta' ? 0.35 : rnd(0.5, 1.2); if (g.est === 'salta') { g.from = g.obj.position.clone(); g.dest = g.base.clone().add(new THREE.Vector3(rnd(-0.9, 0.9), 0, rnd(-0.9, 0.9))); g.obj.rotation.y = Math.atan2(g.dest.x - g.from.x, g.dest.z - g.from.z); } } } }
      else if (g.tipo === 'mur') { g.a += dt * 0.6; g.obj.position.set(g.c.x + Math.cos(g.a) * g.r, g.c.y + 1 + Math.sin(g.a * 2) * 0.6, g.c.z + Math.sin(g.a) * g.r); g.obj.rotation.y = -g.a; aletea(g.obj, t, 0.8); }
    }
  }
  return { grupo, paso: RMQ ? () => {} : paso, n: AG.length, agentes: AG };
}

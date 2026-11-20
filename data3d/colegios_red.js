/* Red de colegios de Kennedy («conectografía escolar») — escenario «Con la propuesta», leyenda «Colegios».
   Datos: data3d/colegios_red.json (tools/colegios_red_build.py) + data3d/colegios.json (marco mundo).
   1. enlaces colegio–colegio: árbol de expansión mínima + vecinos cercanos, ≤ 1,5 km y sin cruces
   2. cada colegio -> el parque-huerta más cercano (parques del IDRD de 2 ha o más donde cabe un módulo de 48 × 30 m sin tocar
      árboles, canchas, edificios ni agua). En cada parque, una HUERTA EFÍMERA CIRCULAR (data3d/huerta_circular.js, la de la Biblioteca El Tintal); antes era de dos pisos:
      abajo 40 camas elevadas bajo malla anti-aves; arriba una pérgola liviana con enredaderas y flores para abejas, colibríes y mariposas,
      cajas nido, perchas y hoteles de insectos (todo con instancias)
   3. cada colegio -> Bavaria Común: edificio según la distancia (frecuencia de visita) y entrada según el recorrido más corto
   Uso: const R = crearRedColegios({ T3, lw }); R.ver(true | false). La × del panel dispara el evento 'col-cerrar'. */
export function crearRedColegios({ T3, lw, COLE = null }) {
  const THREE = T3.THREE, RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const cj = (u) => (window.cargarJSON ? window.cargarJSON(u) : fetch(u).then(r => r.json()));
  const grupo = new THREE.Group(); grupo.name = 'red-colegios'; grupo.visible = false; T3.scene.add(grupo);
  let on = false, listo = false, API = null;
  if (COLE && !Array.isArray(COLE)) COLE = COLE.colegios || null; // acepta la lista o el JSON completo de colegios.json (mismo orden que colegios_red.json)
  const pDatos = Promise.all([cj('data3d/colegios_red.json?v=3'), COLE ? Promise.resolve(COLE) : cj('data3d/colegios.json?v=2').then(C => C.colegios)])
    .then(([R, C]) => { API = armar(R, C); listo = true; if (on) API.mostrar(true); })
    .catch(e => console.warn('red de colegios:', e));

  function armar(R, C) {
    const COL = { red: '#76b7b2', hue: '#a3e635', inst: '#60a5fa', lab: '#c084fc', campo: '#4ade80', acc: '#fbbf24' };
    const DEST = { inst: { n: 'Instituto de enseñanza', c: COL.inst, f: 'Jornadas mensuales en bus', d: 'Más de 4 km: la visita es larga y poco frecuente; se aprovecha en el aula (módulos del ensayo, datos de su huerta y presentación de resultados).' },
      lab: { n: 'Centro de laboratorios NBIC', c: COL.lab, f: 'Salidas quincenales', d: 'Entre 2,2 y 4 km: traen las muestras y registros de su parque-huerta para analizarlos (suelo, sensores, germinación).' },
      campo: { n: 'Campo experimental', c: COL.campo, f: 'Salidas semanales a pie o en bici', d: 'A menos de 2,2 km: práctica directa de cultivo en las camas docentes y los invernaderos del distrito.' } };
    const ENT = { A: 'Tv. 71B', B: 'Calle 7A', C: 'Av. Boyacá' };
    const H = R.huertas, N = C.length;
    const nH = H.map((_, h) => R.asig.filter(a => a[0] === h).length);
    const fmt = (x, d = 0) => x.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

    /* ================= ENLACES ANIMADOS (tubos con pulsos, aditivos) ================= */
    const TU = { value: 0 };
    // dos pasadas por capa: cuerpo con el color (mezcla normal, se lee sobre la foto) + pulsos aditivos que avanzan
    const matEnlace = (col, vel, sep, r0, base) => new THREE.ShaderMaterial({
      uniforms: { uT: TU, uC: { value: new THREE.Color(col) }, uA: { value: 1 }, uV: { value: vel }, uS: { value: sep }, uR: { value: r0 }, uK: { value: 0.0016 }, uB: { value: base ? 1 : 0 } },
      vertexShader: `attribute float aL; uniform float uR,uK; varying float vD; varying float vL; varying float vC;
void main(){ vD=uv.x*aL; vL=aL; vec3 c=position-normal*uR; vec4 w=modelMatrix*vec4(position,1.); float dc=distance(w.xyz,cameraPosition); vC=dc;
  vec3 p=c+normal*max(uR,dc*uK); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
      fragmentShader: `uniform vec3 uC; uniform float uT,uA,uV,uS,uB; varying float vD; varying float vL; varying float vC;
void main(){ float d=fract((vD-uT*uV)/uS); float f=smoothstep(0.,10.,vD)*smoothstep(0.,10.,vL-vD)*smoothstep(45.,380.,vC);
  float a=uB>.5 ? .62*f : 1.35*pow(d,7.)*f; gl_FragColor=uB>.5 ? vec4(uC*.92,a*uA) : vec4(uC*a*uA,1.);
#include <colorspace_fragment>
}`,
      transparent: true, depthWrite: false, blending: base ? THREE.NormalBlending : THREE.AdditiveBlending, toneMapped: false
    });
    // une muchos tubos en una sola geometría (aL = largo de cada tubo, para que los pulsos vayan en metros)
    function unir(curvas, r0) {
      let nv = 0, ni = 0; const gs = curvas.map(cv => { const L = cv.getLength(), g = new THREE.TubeGeometry(cv, Math.max(12, Math.min(140, Math.round(L / 14))), r0, 5, false); g.userData.L = L; nv += g.attributes.position.count; ni += g.index.count; return g; });
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), aL = new Float32Array(nv), idx = new Uint32Array(ni); let ov = 0, oi = 0;
      for (const g of gs) { const n = g.attributes.position.count; pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3); uv.set(g.attributes.uv.array, ov * 2); aL.fill(g.userData.L, ov, ov + n);
        const I = g.index.array; for (let i = 0; i < I.length; i++) idx[oi + i] = I[i] + ov; ov += n; oi += I.length; g.dispose(); }
      const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); G.setAttribute('aL', new THREE.BufferAttribute(aL, 1)); G.setIndex(new THREE.BufferAttribute(idx, 1));
      G.computeBoundingSphere(); return G;
    }
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const arco = (a, b, h, y0 = 5, y1 = 5) => new THREE.QuadraticBezierCurve3(V3(a[0], y0, a[1]), V3((a[0] + b[0]) / 2, h * 2 - (y0 + y1) / 2, (a[1] + b[1]) / 2), V3(b[0], y1, b[1]));
    const P = C.map(c => c.c), dd = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const CAPAS = {};
    const capa = (k, curvas, col, r0, vel, sep) => { const G = unir(curvas, r0);
      for (const base of [true, false]) { const m = new THREE.Mesh(G, matEnlace(col, vel, sep, r0, base)); m.renderOrder = base ? 12 : 13; m.frustumCulled = false; grupo.add(m); (CAPAS[k] = CAPAS[k] || []).push(m); } };
    /* La red se lee en TRES PASOS, cada grupo con su color (el de su huerta):
       1. grupos: los colegios que comparten huerta, unidos entre sí solo dentro del grupo (líneas bajas, sin cruzar toda Kennedy)
       2. a la huerta: de cada colegio, una línea baja de su color hasta su huerta
       3. a Bavaria: UNA línea gruesa por huerta hasta el edificio de Bavaria Común que le toca (no 74 líneas sueltas) */
    const PAL = ['#a3e635', '#22d3ee', '#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#fb7185', '#60a5fa', '#f97316', '#76b7b2', '#2dd4bf', '#facc15'];
    const CG = H.map((_, k) => PAL[k % PAL.length]); // color de cada grupo
    const borde = (h, p) => { const dx = p[0] - h.c[0], dz = p[1] - h.c[1], n = Math.hypot(dx, dz) || 1, t = h.r + 4; return [h.c[0] + dx / n * t, h.c[1] + dz / n * t]; }; // borde de la huerta circular
    H.forEach((h, k) => {
      const mios = R.asig.map((a, i) => [a, i]).filter(([a]) => a[0] === k).map(([, i]) => i), set = new Set(mios);
      const en = R.enlaces.filter(([i, j]) => set.has(i) && set.has(j));
      if (en.length) capa('red', en.map(([i, j, d]) => arco(P[i], P[j], 3 + Math.min(30, d * 0.03), 3, 3)), CG[k], 0.55, 22, 110);
      if (mios.length) capa('hue', mios.map(i => arco(P[i], borde(h, P[i]), 4 + Math.min(40, dd(P[i], h.c) * 0.05), 3, 2)), CG[k], 0.8, 30, 90);
    });
    // 3. huerta -> entrada -> edificio de Bavaria Común (el que le toca a la mayoría de sus colegios)
    const destH = H.map((h, k) => { const c = { inst: 0, lab: 0, campo: 0 }; R.asig.forEach((a, i) => { if (a[0] === k) c[R.bav[i][0]]++; }); return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]; });
    H.forEach((h, k) => { const D = R.dest[destH[k]], e = Object.keys(R.ent).sort((a, b) => (dd(h.c, R.ent[a]) + dd(R.ent[a], D)) - (dd(h.c, R.ent[b]) + dd(R.ent[b], D)))[0], E = R.ent[e], dist = dd(h.c, E);
      const cv = new THREE.CatmullRomCurve3([V3(h.c[0], 8, h.c[1]), V3(h.c[0] + (E[0] - h.c[0]) * 0.5, 30 + Math.min(180, dist * 0.045), h.c[1] + (E[1] - h.c[1]) * 0.5), V3(E[0], 18, E[1]), V3(D[0], 12, D[1])], false, 'centripetal');
      capa('bav', [cv], CG[k], 1.2 + nH[k] * 0.12, 40, 140); });
    // anillo del color del grupo en el piso de cada colegio
    const anCol = new THREE.RingGeometry(9, 13, 32).rotateX(-Math.PI / 2);
    R.asig.forEach(([k], i) => { const m = new THREE.Mesh(anCol, new THREE.MeshBasicMaterial({ color: CG[k], transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); m.position.set(P[i][0], 1.4, P[i][1]); m.renderOrder = 11; grupo.add(m); (CAPAS.red = CAPAS.red || []).push(m); });    // anillos en las entradas de Bavaria y en los tres edificios destino
    const anillos = [];
    const anillo = (p, r, col) => { const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.78, r, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
      m.position.set(p[0], 1.2, p[1]); m.renderOrder = 11; grupo.add(m); anillos.push(m); (CAPAS.bav = CAPAS.bav || []).push(m); return m; };
    Object.values(R.ent).forEach(p => anillo(p, 9, COL.acc));
    Object.entries(R.dest).forEach(([k, p]) => anillo(p, 14, COL[k]));

    /* ================= (piezas de la huerta anterior de dos pisos: ya no se instancian) ================= */
    const mStd = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, ...o });
    const lienzo = (w, h, f) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    // malla anti-aves: hilo negro de polietileno, cuadro fino
    const texMalla = lienzo(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(20,22,24,1)'; g.lineWidth = 1.6; for (let i = 0; i <= 8; i++) { const s = i * 16; g.beginPath(); g.moveTo(s, 0); g.lineTo(s, h); g.stroke(); g.beginPath(); g.moveTo(0, s); g.lineTo(w, s); g.stroke(); } });
    texMalla.wrapS = texMalla.wrapT = THREE.RepeatWrapping; texMalla.repeat.set(4, 12);
    // tierra de las camas
    const texTierra = lienzo(128, 128, (g, w, h) => { g.fillStyle = '#3d2a1c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? 'rgba(25,16,10,.55)' : v < 0.85 ? 'rgba(92,66,44,.5)' : 'rgba(140,120,90,.45)'; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } });
    texTierra.wrapS = texTierra.wrapT = THREE.RepeatWrapping; texTierra.repeat.set(6, 1);
    // piso: corteza triturada bajo las camas y recebo claro en los caminos
    const texMulch = lienzo(256, 256, (g, w, h) => { g.fillStyle = '#6e5238'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { const v = Math.random(); g.fillStyle = v < 0.4 ? 'rgba(60,40,25,.6)' : v < 0.8 ? 'rgba(140,105,70,.5)' : 'rgba(180,150,110,.5)'; g.save(); g.translate(Math.random() * w, Math.random() * h); g.rotate(Math.random() * 3); g.fillRect(0, 0, 2 + Math.random() * 5, 1 + Math.random() * 1.5); g.restore(); } });
    texMulch.wrapS = texMulch.wrapT = THREE.RepeatWrapping; texMulch.repeat.set(12, 8);
    const texRecebo = lienzo(128, 128, (g, w, h) => { g.fillStyle = '#c4b08a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(150,130,98,.55)' : 'rgba(225,212,185,.55)'; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } });
    texRecebo.wrapS = texRecebo.wrapT = THREE.RepeatWrapping;
    // frente del hotel de insectos: marco de madera, cañas de bambú, troncos perforados, piñas y paja
    const texHotel = lienzo(256, 288, (g, w, h) => {
      g.fillStyle = '#5b3d26'; g.fillRect(0, 0, w, h);
      const celdas = [[8, 8, 116, 84, 'bambu'], [132, 8, 116, 84, 'tronco'], [8, 100, 116, 84, 'pina'], [132, 100, 116, 84, 'paja'], [8, 192, 240, 88, 'bambu']];
      for (const [x, y, cw, ch, t] of celdas) {
        g.fillStyle = '#20150d'; g.fillRect(x, y, cw, ch);
        if (t === 'bambu') for (let yy = y + 7; yy < y + ch - 3; yy += 11) for (let xx = x + 7 + ((yy / 11) % 2) * 5; xx < x + cw - 3; xx += 11) { g.fillStyle = '#d6b46f'; g.beginPath(); g.arc(xx, yy, 5, 0, 7); g.fill(); g.fillStyle = '#2a1a0c'; g.beginPath(); g.arc(xx, yy, 2.6, 0, 7); g.fill(); }
        if (t === 'tronco') { g.fillStyle = '#a77b4f'; g.beginPath(); g.ellipse(x + cw / 2, y + ch / 2, cw / 2 - 4, ch / 2 - 4, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(70,45,25,.6)'; for (let r = 6; r < 40; r += 6) { g.beginPath(); g.ellipse(x + cw / 2, y + ch / 2, r * 1.3, r, 0, 0, 7); g.stroke(); } g.fillStyle = '#1a0f07'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(x + 14 + Math.random() * (cw - 28), y + 10 + Math.random() * (ch - 20), 1.6 + Math.random() * 1.6, 0, 7); g.fill(); } }
        if (t === 'pina') for (let i = 0; i < 14; i++) { const px = x + 12 + (i % 5) * 23, py = y + 16 + Math.floor(i / 5) * 26; g.fillStyle = '#6b4423'; g.beginPath(); g.ellipse(px, py, 10, 12, 0, 0, 7); g.fill(); g.strokeStyle = '#3b2412'; g.lineWidth = 1.4; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(px - 9, py + k * 4); g.lineTo(px + 9, py + k * 4 + 3); g.stroke(); } }
        if (t === 'paja') { g.lineWidth = 2; for (let i = 0; i < 160; i++) { g.strokeStyle = Math.random() < 0.5 ? '#c9a95c' : '#a8873f'; const yy = y + 4 + Math.random() * (ch - 8); g.beginPath(); g.moveTo(x + 3, yy); g.lineTo(x + cw - 3, yy + (Math.random() - 0.5) * 8); g.stroke(); } }
      }
    });

    // un constructor de instancias: cada tipo de pieza junta matrices (de todas las huertas) en un solo InstancedMesh
    const PIEZAS = [];
    const pieza = (geo, mat, sombra = true, color = false) => { const p = { geo, mat, M: [], C: [], sombra, color }; PIEZAS.push(p); return p; };
    const O = new THREE.Object3D(), MH = new THREE.Matrix4(), MT = new THREE.Matrix4(), CC = new THREE.Color();
    const poner = (p, u, y, v, ry = 0, sx = 1, sy = 1, sz = 1, col = null, rx = 0, rz = 0) => { O.position.set(u, y, v); O.rotation.set(rx, ry, rz); O.scale.set(sx, sy, sz); O.updateMatrix(); MT.multiplyMatrices(MH, O.matrix); p.M.push(MT.clone()); if (p.color) p.C.push(CC.set(col || '#ffffff').clone()); };
    const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })(); // determinista: misma huerta en cada carga
    const elegir = (a) => a[Math.floor(rnd() * a.length)];

    const madera = mStd('#7a5434', { roughness: 0.78 }), maderaOsc = mStd('#5a3c25', { roughness: 0.8 });
    // follaje con tarjetas de hojas (textura en grises + tinte por instancia): se lee como planta, no como bola
    const hojaTx = (fn) => { const t = lienzo(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); fn(g, w, h); }); t.colorSpace = THREE.SRGBColorSpace; return t; };
    const dibHoja = (g, x, y, l, a, r, tono, nerv = true) => { g.save(); g.translate(x, y); g.rotate(r); const gr = g.createLinearGradient(0, -a, 0, a); gr.addColorStop(0, `hsl(0,0%,${tono + 10}%)`); gr.addColorStop(1, `hsl(0,0%,${tono - 8}%)`); g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(l * 0.3, -a, l * 0.75, -a * 0.9, l, 0); g.bezierCurveTo(l * 0.75, a * 0.9, l * 0.3, a, 0, 0); g.fill();
      if (nerv) { g.strokeStyle = `hsla(0,0%,${tono + 22}%,.7)`; g.lineWidth = Math.max(1, a * 0.12); g.beginPath(); g.moveTo(0, 0); g.lineTo(l * 0.92, 0); g.stroke(); } g.restore(); };
    const texEnred = hojaTx((g, w, h) => { for (let i = 0; i < 95; i++) { const r = Math.random() * 6.28, d = Math.random() * 100; dibHoja(g, 128 + Math.cos(r) * d * 0.9, 128 + Math.sin(r) * d * 0.9, 20 + Math.random() * 18, 9 + Math.random() * 7, Math.random() * 6.28, 52 + Math.random() * 30); }
      g.strokeStyle = 'rgba(60,60,60,.8)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(128, 128); g.quadraticCurveTo(128 + (Math.random() - 0.5) * 160, 128 + (Math.random() - 0.5) * 160, 128 + (Math.random() - 0.5) * 230, 128 + (Math.random() - 0.5) * 230); g.stroke(); } });
    const texLechuga = hojaTx((g) => { // una hoja de borde rizado, con nervadura
      g.beginPath(); for (let i = 0; i <= 60; i++) { const t = i / 60 * Math.PI * 2, rr = 1 + 0.07 * Math.sin(t * 18); g.lineTo(128 + Math.sin(t) * 104 * rr, 150 - Math.cos(t) * 104 * rr * 1.0); } const gr = g.createRadialGradient(128, 250, 10, 128, 120, 150); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#a8a8a8'); g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 5; g.beginPath(); g.moveTo(128, 254); g.lineTo(128, 60); g.stroke(); g.lineWidth = 2; for (let k = 0; k < 6; k++) { const y = 230 - k * 28; g.beginPath(); g.moveTo(128, y); g.lineTo(60, y - 40); g.moveTo(128, y); g.lineTo(196, y - 40); g.stroke(); } });
    const unirGeo = (gs) => { let nv = 0, ni = 0; gs.forEach(g => { nv += g.attributes.position.count; ni += g.index.count; }); const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint16Array(ni); let ov = 0, oi = 0;
      gs.forEach(g => { pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3); uv.set(g.attributes.uv.array, ov * 2); g.index.array.forEach((x, i) => { idx[oi + i] = x + ov; }); ov += g.attributes.position.count; oi += g.index.count; });
      const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); G.setIndex(new THREE.BufferAttribute(idx, 1)); return G; };
    // roseta: hojas que salen del centro inclinadas hacia arriba (lechuga, acelga)
    const roseta = (n, l, a, inc) => unirGeo(Array.from({ length: n }, (_, i) => new THREE.PlaneGeometry(a, l).translate(0, l / 2, 0).rotateX(-(Math.PI / 2 - inc - (i % 2) * 0.25)).rotateY(i / n * Math.PI * 2 + (i % 3) * 0.3)));
    // mata de enredadera: tarjetas cruzadas casi horizontales (techo) o verticales (postes y cortinas)
    const mata = (vert) => unirGeo([0, 1, 2].map(i => { const p = new THREE.PlaneGeometry(1, 1); if (vert) return p.rotateY(i * Math.PI / 3); return p.rotateX(-Math.PI / 2 + (i - 1) * 0.45).rotateY(i * 1.1).translate((i - 1) * 0.15, (i - 1) * 0.06, 0); }));
    const matHoja = (tx) => new THREE.MeshStandardMaterial({ color: '#ffffff', map: tx, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.78 });
    const PZ = {
      piso: pieza(new THREE.BoxGeometry(1, 1, 1), mStd('#ffffff', { map: texMulch, roughness: 0.95 }), false),
      camino: pieza(new THREE.BoxGeometry(1, 1, 1), mStd('#ffffff', { map: texRecebo, roughness: 0.95 }), false),
      cama: pieza(new THREE.BoxGeometry(9, 0.6, 1.2).translate(0, 0.3, 0), madera),
      tierra: pieza(new THREE.BoxGeometry(8.84, 0.04, 1.04), mStd('#ffffff', { map: texTierra, roughness: 1 }), false),
      lechuga: pieza(roseta(9, 0.26, 0.24, 0.35), matHoja(texLechuga), true, true),
      alta: pieza(roseta(7, 0.5, 0.2, 0.95), matHoja(texLechuga), true, true),
      malla: pieza(new THREE.CylinderGeometry(0.72, 0.72, 9.1, 18, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#ffffff', map: texMalla, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide, roughness: 0.6, depthWrite: false }), false),
      aro: pieza(new THREE.TorusGeometry(0.72, 0.012, 4, 14, Math.PI), mStd('#d9dde0', { metalness: 0.6, roughness: 0.35 }), false),
      poste: pieza(new THREE.BoxGeometry(0.2, 1, 0.2).translate(0, 0.5, 0), madera),
      zapata: pieza(new THREE.BoxGeometry(0.5, 0.25, 0.5).translate(0, 0.12, 0), mStd('#9b9890', { roughness: 0.9 })),
      viga: pieza(new THREE.BoxGeometry(1, 0.3, 0.14), madera),
      cable: pieza(new THREE.BoxGeometry(1, 0.03, 0.03), mStd('#9aa2a8', { metalness: 0.7, roughness: 0.35 }), false),
      hoja: pieza(mata(false), matHoja(texEnred), true, true),
      hojaV: pieza(mata(true), matHoja(texEnred), true, true),
      flor: pieza(new THREE.IcosahedronGeometry(0.075, 0), mStd('#ffffff', { roughness: 0.5, emissive: '#000000' }), false, true),
      nido: pieza(new THREE.BoxGeometry(0.24, 0.34, 0.24).translate(0, 0.17, 0), maderaOsc),
      techoNido: pieza(new THREE.BoxGeometry(0.34, 0.035, 0.34), mStd('#3f4a3a', { roughness: 0.7 })),
      hueco: pieza(new THREE.CircleGeometry(0.04, 12), new THREE.MeshBasicMaterial({ color: '#0c0805' }), false),
      percha: pieza(new THREE.CylinderGeometry(0.025, 0.025, 1, 6).rotateZ(Math.PI / 2), maderaOsc, false),
      hotel: pieza(new THREE.BoxGeometry(1.6, 1.8, 0.45).translate(0, 0.9, 0), [maderaOsc, maderaOsc, maderaOsc, maderaOsc, mStd('#ffffff', { map: texHotel, roughness: 0.9 }), maderaOsc]),
      techoHotel: pieza(new THREE.BoxGeometry(1.95, 0.05, 0.8), mStd('#4a3220', { roughness: 0.8 })),
      pata: pieza(new THREE.BoxGeometry(0.08, 0.5, 0.08).translate(0, 0.25, 0), maderaOsc, false),
      bancaFlor: pieza(mata(true), matHoja(texEnred), true, true)
    };
    const VERDES = ['#5f8f2e', '#6f9e36', '#4f7f2a', '#7aa63e', '#557d33', '#3f6b2b', '#86ad48'];
    const FLORES = ['#c026d3', '#a855f7', '#7c3aed', '#f97316', '#fb923c', '#facc15', '#fde047', '#dc2626', '#f43f5e', '#f5f5f4', '#fef3c7', '#ec4899'];
    const CULTIVO = [['#7fb847', '#94c95a', '#6aa93a'], ['#7b2d43', '#8e3a52', '#6a2438'], ['#4a7a52', '#3f6b48', '#58875e'], ['#a6c955', '#b5d46a', '#98bd4a']];
    const UP = [-23.4, -11.7, -1.5, 1.5, 11.7, 23.4], VP = [-14.2, -8.1, -1.5, 1.5, 8.1, 14.2], HP = 3.8; // ejes de la pérgola (pasan por pasillos, no por camas)
    const HIT = [], FAUNA = [];
    // huertas circulares de cubiertas efímeras (las mismas de la Biblioteca El Tintal, data3d/huerta_circular.js); la del Tintal ya la arma tintal.js
    const Yh = (T3.sueloY != null ? T3.sueloY : 0.35) - 0.38;
    import('./huerta_circular.js?v=1').then(({ crearHuertaCircular }) => H.forEach((h, k) => { if (h.fija) return;
      crearHuertaCircular({ THREE, T3, c: h.c, r: h.r, Y0: Yh, semilla: 97 + k * 13, flores: false }).then(g => grupo.add(g)).catch(e => console.warn('huerta', h.n, e)); }));
    H.forEach((h, k) => {
      // zona de toque (para volar al tocar la huerta)
      const hb = new THREE.Mesh(new THREE.CylinderGeometry(h.r + 3, h.r + 3, 10, 24).translate(0, 5, 0)); hb.position.set(h.c[0], 0, h.c[1]); hb.updateMatrixWorld(); hb.userData.k = k; HIT.push(hb);
      // contorno del parque sobre el suelo
      const pts = h.poly.map(p => V3(p[0], 1.1, p[1])); const ln = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: COL.hue, transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false })); ln.renderOrder = 11; grupo.add(ln);
      FAUNA.push({ c: h.c, a: 0, L: h.r * 1.6, W: h.r * 1.6 });
    });    for (const p of PIEZAS) { if (!p.M.length) continue; const im = new THREE.InstancedMesh(p.geo, p.mat, p.M.length); p.M.forEach((m, i) => im.setMatrixAt(i, m)); if (p.color) p.C.forEach((c, i) => im.setColorAt(i, c));
      im.castShadow = p.sombra; im.receiveShadow = true; im.computeBoundingSphere(); grupo.add(im); }

    // fauna que visita la huerta: mariposas, abejas y colibríes (solo se animan las de las huertas cercanas a la cámara)
    const geoMar = new THREE.BufferGeometry(); geoMar.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.16, 0, 0.1, 0.12, 0, -0.1, 0, 0, 0, -0.16, 0, 0.1, -0.12, 0, -0.1], 3)); geoMar.computeVertexNormals();
    const BICH = [
      { n: 9, geo: geoMar, mat: new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.6 }), cols: ['#f97316', '#facc15', '#60a5fa', '#f5f5f4'], r: [1.5, 5], y: [1.2, 5.2], v: 0.6, aleteo: true },
      { n: 22, geo: new THREE.SphereGeometry(0.045, 6, 4).scale(1, 0.85, 1.5), mat: new THREE.MeshStandardMaterial({ roughness: 0.5 }), cols: ['#eab308', '#ca8a04'], r: [0.8, 3], y: [3.9, 4.8], v: 1.6 },
      { n: 3, geo: new THREE.ConeGeometry(0.05, 0.2, 6).rotateX(Math.PI / 2), mat: new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.3 }), cols: ['#15803d', '#0f766e'], r: [2, 7], y: [3, 5.5], v: 2.2 }
    ];
    const BIM = BICH.map(b => { const im = new THREE.InstancedMesh(b.geo, b.mat, b.n * H.length); im.frustumCulled = false; grupo.add(im);
      const P0 = []; for (let i = 0; i < b.n * H.length; i++) { const k = Math.floor(i / b.n), f = FAUNA[k]; const u = (rnd() - 0.5) * f.L * 0.9, v = (rnd() - 0.5) * f.W * 0.9;
        P0.push({ x: f.c[0] + u * Math.cos(f.a) - v * Math.sin(f.a), z: f.c[1] + u * Math.sin(f.a) + v * Math.cos(f.a), r: b.r[0] + rnd() * (b.r[1] - b.r[0]), y: b.y[0] + rnd() * (b.y[1] - b.y[0]), f: rnd() * 6.28, w: (0.5 + rnd()) * b.v * (rnd() < 0.5 ? -1 : 1), k });
        im.setColorAt(i, CC.set(elegir(b.cols))); }
      return { b, im, P0 }; });
    const tFauna = (t) => { const cp = T3.camera.position; BIM.forEach(({ b, im, P0 }) => { P0.forEach((p, i) => { const f = FAUNA[p.k], cerca = Math.hypot(cp.x - f.c[0], cp.z - f.c[1]) < 600;
      if (!cerca) { O.position.set(0, -50, 0); O.scale.setScalar(0.001); } else { const a = p.f + t * p.w / p.r * 2; O.position.set(p.x + Math.cos(a) * p.r, p.y + Math.sin(t * 1.7 + p.f) * 0.4, p.z + Math.sin(a * 1.3) * p.r);
        O.rotation.set(0, -a, 0); const s = b.aleteo ? 1 : 1; O.scale.set(b.aleteo ? 0.25 + 0.75 * Math.abs(Math.sin(t * 14 + p.f)) : s, 1, 1); }
      O.updateMatrix(); im.setMatrixAt(i, O.matrix); }); im.instanceMatrix.needsUpdate = true; }); };
    tFauna(0);

    /* ================= ETIQUETAS 3D ================= */
    const css = document.createElement('style');
    css.textContent = `
.cr-lb{position:fixed;left:0;top:0;z-index:7;display:none;cursor:pointer;font-family:Inter,system-ui,sans-serif;color:#eef1f3;white-space:nowrap}
.cr-lb .cj{display:flex;align-items:stretch;background:rgba(10,13,17,.8);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);border-radius:6px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.cr-lb .k{display:flex;align-items:center;padding:0 6px;font:600 10px 'JetBrains Mono',ui-monospace,monospace;color:#0b0d10;background:var(--c)}
.cr-lb .t{padding:4px 8px 4px 7px;line-height:1.15}
.cr-lb b{display:block;font-weight:600;font-size:11px}
.cr-lb small{display:block;font:400 9.5px 'JetBrains Mono',ui-monospace,monospace;color:#9aa4ab;letter-spacing:.04em;margin-top:1px}
.cr-lb .pt{position:absolute;left:10px;top:100%;width:1px;height:18px;background:linear-gradient(var(--c),transparent)}
.cr-lb.act .cj,.cr-lb:hover .cj{border-color:var(--c);box-shadow:0 0 0 1px var(--c),0 8px 22px rgba(0,0,0,.45)}
.cr-lb.dim{opacity:.4}
.cr-lb:focus-visible{outline:2px solid #76b7b2;outline-offset:2px;border-radius:6px}
@media(max-width:760px){.cr-lb small{display:none}.cr-lb b{font-size:10px}.cr-lb .t{padding:3px 6px}.cr-lb.sec{display:none!important}}
#cr{position:fixed;z-index:32;right:14px;top:14px;width:380px;max-height:calc(100vh - 118px);display:none;flex-direction:column;font-family:Inter,system-ui,sans-serif;color:#e9ebec;
  background:rgba(12,14,17,.84);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.08);border-radius:12px;box-shadow:0 18px 44px rgba(0,0,0,.4);overflow:hidden}
#cr.on{display:flex;animation:crIn .45s cubic-bezier(.2,.8,.2,1)}
@keyframes crIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
body.cr-on #dock{display:none!important}
#cr header,#cr .tabs{flex:none}#cr .cuerpo{flex:1 1 auto;min-height:0}
#cr header{position:relative;padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,.06)}
#cr .cerrar{position:absolute;right:10px;top:10px;width:28px;height:28px;border-radius:7px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#cfd5d9;font:400 17px/1 Inter,system-ui,sans-serif;cursor:pointer}
#cr .cerrar:hover{background:rgba(255,255,255,.1);color:#fff}#cr .cerrar:focus-visible{outline:2px solid #76b7b2;outline-offset:1px}
#cr .ey{padding-right:34px;font:500 9.5px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#76b7b2}
#cr h2{margin:5px 0 6px;font:600 18px Inter,system-ui,sans-serif;letter-spacing:-.01em}
#cr .lead{margin:0;font-size:12.5px;line-height:1.5;color:#b9c1c6}
#cr .kp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:10px}
#cr .kp div{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:7px 8px;min-width:0}
#cr .kp b{display:block;font:500 15px 'JetBrains Mono',ui-monospace,monospace;color:#fff}
#cr .kp span{font-size:10px;color:#8e979d;line-height:1.25;display:block;margin-top:2px}
#cr .tabs{display:flex;gap:2px;padding:6px 8px 0;overflow-x:auto;scrollbar-width:none}
#cr .tabs button{flex:none;border:0;background:none;color:#8e979d;font:500 11.5px Inter,system-ui,sans-serif;padding:7px 9px;border-radius:7px 7px 0 0;cursor:pointer;border-bottom:2px solid transparent}
#cr .tabs button[aria-selected="true"]{color:#fff;border-bottom-color:#76b7b2}
#cr .tabs button:focus-visible{outline:2px solid #76b7b2;outline-offset:-2px}
#cr .cuerpo{overflow:auto;padding:10px 12px 12px;border-top:1px solid rgba(255,255,255,.06);overscroll-behavior:contain}
#cr .it{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:2px 9px;align-items:start;padding:8px 6px;border-radius:8px;cursor:pointer}
#cr .it:hover,#cr .it.act{background:rgba(255,255,255,.05)}
#cr .it:focus-visible{outline:2px solid #76b7b2;outline-offset:-2px}
#cr .it i{grid-row:span 2;width:22px;height:22px;border-radius:6px;background:var(--c);display:flex;align-items:center;justify-content:center;font:600 10px 'JetBrains Mono',ui-monospace,monospace;color:#0b0d10;font-style:normal}
#cr .it b{font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis}
#cr .it em{font:500 10.5px 'JetBrains Mono',ui-monospace,monospace;color:#cfd5d9;font-style:normal;white-space:nowrap}
#cr .it p{grid-column:2 / 4;margin:0;font-size:11.5px;line-height:1.45;color:#9aa4ab}
#cr .sub{font:500 9.5px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#7b858c;margin:12px 6px 4px}
#cr .nota{font-size:10.5px;color:#7b858c;line-height:1.45;margin:10px 6px 0}
#cr .ind{margin:6px 6px 0;padding:10px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);font-size:11.5px;color:#b9c1c6;line-height:1.45}
#cr .ind b{color:#fff;font-weight:600}
#cr .ley{display:flex;gap:9px;align-items:flex-start;padding:7px 6px;font-size:11.5px;color:#b9c1c6;line-height:1.4}
#cr .ley i{flex:none;width:18px;height:3px;border-radius:2px;margin-top:7px;background:var(--c);box-shadow:0 0 8px var(--c)}
#cr .ley b{color:#e9ebec;font-weight:600}
#cr .pisos{display:grid;gap:6px;margin:6px 6px 0}
#cr .piso{display:grid;grid-template-columns:62px minmax(0,1fr);gap:10px;padding:10px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
#cr .piso .n{font:500 10px 'JetBrains Mono',ui-monospace,monospace;color:#a3e635;letter-spacing:.08em;text-transform:uppercase;line-height:1.4}
#cr .piso .n span{display:block;color:#7b858c;font-size:9.5px;margin-top:3px}
#cr .piso ul{margin:0;padding:0 0 0 14px;font-size:11.5px;line-height:1.5;color:#b9c1c6}
#cr .piso li b{color:#e9ebec;font-weight:600}
#cr .bar{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:8px 0 6px}
#cr .lg{display:flex;flex-wrap:wrap;gap:4px 12px;font:500 10px 'JetBrains Mono',ui-monospace,monospace;color:#9aa4ab}
#cr .lg span{display:inline-flex;align-items:center;gap:5px}#cr .lg i{width:8px;height:8px;border-radius:2px}
#cr .esc{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:5px 6px;border-radius:6px;font-size:11.5px;color:#cfd5d9;cursor:pointer}
#cr .esc:hover{background:rgba(255,255,255,.05)}#cr .esc:focus-visible{outline:2px solid #76b7b2;outline-offset:-2px}
#cr .esc span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#cr .esc .e{font:600 9.5px 'JetBrains Mono',ui-monospace,monospace;color:#0b0d10;background:#fbbf24;border-radius:4px;padding:1px 5px}
#cr .esc .d{font:500 10.5px 'JetBrains Mono',ui-monospace,monospace;color:#8e979d;min-width:44px;text-align:right}
#cr .pasos{display:grid;gap:6px;margin:8px 6px 0}
#cr .paso{display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;align-items:start;text-align:left;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:#b9c1c6;font:400 11.5px/1.45 Inter,system-ui,sans-serif;cursor:pointer}
#cr .paso span{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 13px 'JetBrains Mono',monospace;color:#0b0d10;background:linear-gradient(135deg,#a3e635,#22d3ee)}
#cr .paso b{display:block;color:#fff;font-size:12.5px;font-weight:600;margin-bottom:2px}
#cr .paso:hover{border-color:rgba(255,255,255,.2)}#cr .paso.on{border-color:#a3e635;background:rgba(163,230,53,.1)}
#cr .paso:focus-visible{outline:2px solid #76b7b2;outline-offset:1px}
#cr .pie{flex:none;display:flex;gap:6px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.06)}
#cr .pie button{flex:1;height:34px;border-radius:8px;cursor:pointer;font:500 12px Inter,system-ui,sans-serif;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#cfd5d9}
#cr .pie button:hover{background:rgba(255,255,255,.1);color:#fff}#cr .pie button:focus-visible{outline:2px solid #76b7b2;outline-offset:1px}
@media(max-width:760px){
  #cr{left:8px;right:8px;width:auto;top:auto;bottom:calc(max(8px,env(safe-area-inset-bottom)) + 66px);max-height:56vh}
  #cr.min .cuerpo,#cr.min .tabs,#cr.min .kp,#cr.min .lead,#cr.min .pie{display:none}
  #cr.min h2::after{content:' ▴';color:#7b858c;font-size:12px}
  #cr header{padding:10px 12px 8px;cursor:pointer}#cr h2{font-size:15px;margin:3px 0 4px}
  #cr .lead{font-size:12px}
}
@media(prefers-reduced-motion:reduce){#cr.on{animation:none}}`;
    document.head.appendChild(css);
    const ETQ = [];
    const etiqueta = (n, sub, col, pos, cls, fn, num) => { const d = document.createElement('div'); d.className = 'cr-lb ' + (cls || ''); d.style.setProperty('--c', col);
      d.innerHTML = `<div class="cj"><span class="k">${num}</span><span class="t"><b>${n}</b>${sub ? `<small>${sub}</small>` : ''}</span></div><i class="pt"></i>`;
      if (fn) { d.setAttribute('role', 'button'); d.tabIndex = 0; d.setAttribute('aria-label', n); d.onclick = fn; d.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }; }
      document.body.appendChild(d); const o = { d, pos }; ETQ.push(o); return o; };
    const LBH = H.map((h, k) => etiqueta(h.n, `grupo ${k + 1} · ${nH[k]} colegios`, CG[k], [h.c[0], 9, h.c[1]], 'hue', () => enfocarHuerta(k), String(k + 1)));
    const nDest = { inst: 0, lab: 0, campo: 0 }, nEnt = { A: 0, B: 0, C: 0 }; R.bav.forEach(b => { nDest[b[0]]++; nEnt[b[1]]++; });
    // Bavaria: de lejos una sola etiqueta; de cerca los tres edificios y (más cerca) las tres entradas
    const LBB = Object.entries(R.dest).map(([k, p]) => Object.assign(etiqueta(DEST[k].n, `${nDest[k]} colegios`, COL[k], [p[0], 45, p[1]], 'bav', () => volarA(p, 260), k === 'inst' ? 'I' : k === 'lab' ? 'L' : 'C'), { max: 2600 }));
    const LBE = Object.entries(R.ent).map(([k, p]) => Object.assign(etiqueta('Entrada ' + k, `${ENT[k]} · ${nEnt[k]} colegios`, COL.acc, [p[0], 14, p[1]], 'bav sec', () => volarA(p, 220), k), { max: 1500 }));
    LBB.push(Object.assign(etiqueta('Bavaria Común', `distrito NBIC · ${N} colegios`, COL.lab, [3990, 30, 230], 'bav', () => { tab = 'bav'; pintar(); volarA([3990, 230], 900, 700); }, 'B'), { min: 2600 }));

    /* ================= PANEL ================= */
    const nComp = (() => { const pa = [...Array(N).keys()], f = (x) => (pa[x] === x ? x : (pa[x] = f(pa[x]))); R.enlaces.forEach(([i, j]) => { pa[f(i)] = f(j); }); return new Set(pa.map((_, i) => f(i))).size; })();
    const kmRed = R.enlaces.reduce((s, e) => s + e[2], 0) / 1000, medRed = R.enlaces.reduce((s, e) => s + e[2], 0) / R.enlaces.length;
    const medHue = R.asig.reduce((s, a) => s + a[1], 0) / N;
    const haH = H.reduce((s, h) => s + Math.PI * h.r * h.r, 0);
    const pan = document.createElement('section'); pan.id = 'cr'; pan.setAttribute('aria-label', 'Red de colegios de Kennedy');
    const fila = (num, col, n, a, d, data) => `<div class="it" ${data || ''} tabindex="0" role="button" style="--c:${col}"><i>${num}</i><b>${n}</b><em>${a || ''}</em><p>${d}</p></div>`;
    const ley = (col, n, d) => `<div class="ley" style="--c:${col}"><i></i><div><b>${n}</b><br>${d}</div></div>`;
    const TABS = {
      red: () => `<div class="ind" style="margin-top:0">Así se conectan los <b>${N} colegios</b>: se agrupan alrededor de una huerta, caminan hasta ella y cada huerta va al distrito Bavaria Común. Toca un paso para verlo solo.</div>
        <div class="pasos">
          <button type="button" class="paso" data-p="red"><span>1</span><div><b>Grupos de colegios</b>Los colegios cercanos forman un grupo (un color). Comparten docentes, semillas y herramientas.</div></button>
          <button type="button" class="paso" data-p="hue"><span>2</span><div><b>Caminan a su huerta</b>Cada colegio va a pie a la huerta de su grupo: en promedio ${fmt(medHue)} m (10–15 min).</div></button>
          <button type="button" class="paso" data-p="bav"><span>3</span><div><b>La huerta va a Bavaria</b>Una ruta por grupo hasta el edificio que le toca: campo, laboratorios o instituto.</div></button>
        </div>
        <div class="sub">Los ${H.length} grupos</div>` +
        H.map((h, k) => `<div class="it" data-h="${k}" tabindex="0" role="button" style="--c:${CG[k]}"><i>${k + 1}</i><b>${h.n}</b><em>${nH[k]} colegios</em><p>Huerta circular · va a ${DEST[destH[k]].n.toLowerCase()}</p></div>`).join('') +
        `<p class="nota">Fuente: OpenStreetMap (colegios con edificio en el 3D) y parques del IDRD. Los pulsos avanzan en el sentido del viaje.</p>`,      hue: () => `<div class="ind" style="margin-top:0">${H.length} <b>huertas efímeras circulares</b> (como la de la Biblioteca El Tintal: cubiertas de membrana sobre columnas-árbol, bancales y composteras; ${fmt(haH)} m² en total), una por cada 4 colegios o menos, en los parques del IDRD que cubren más colegios a menos de 1 km. Se arman sobre el claro más amplio de cada parque, sin tocar árboles, canchas ni edificios, y se pueden desmontar.</div>
        <div class="pisos">
          <div class="piso"><div class="n">Arriba<span>6 – 9 m</span></div><ul><li><b>Cubiertas efímeras</b> de membrana traslúcida con costillas blancas, sobre <b>columnas-árbol</b> que recogen el agua lluvia.</li><li>Sobre las cubiertas, <b>jardineras con flores</b> para abejas, colibríes y mariposas: los animales se alimentan arriba, no de la cosecha.</li></ul></div>
          <div class="piso"><div class="n">Abajo<span>±0 m</span></div><ul><li><b>Bancales orgánicos</b> de concreto claro sembrados (plantas medicinales y de hoja) sobre un prado circular.</li><li><b>Composteras</b> de madera y bancas curvas en el anillo exterior. Se arma y se desmonta.</li></ul></div>
        </div>
        <div class="sub">Parques-huerta</div>` +
        H.map((h, k) => fila('H' + (k + 1), COL.hue, h.n, `${fmt(h.area / 10000, 1)} ha`, `${nH[k]} colegios · ${h.tipo ? h.tipo.toLowerCase() : 'parque'} · media ${fmt(R.asig.filter(a => a[0] === k).reduce((s, a) => s + a[1], 0) / Math.max(1, nH[k]))} m`, `data-h="${k}"`)).join(''),
      bav: () => `<div class="ind" style="margin-top:0">Los estudiantes van al distrito de educación y tecnología <b>Bavaria Común</b>. El <b>edificio</b> depende de la distancia (cuántas veces pueden ir) y la <b>entrada</b> es la que da el recorrido más corto colegio → entrada → edificio.
          <div class="bar">${['campo', 'lab', 'inst'].map(k => `<span style="flex:${nDest[k]};background:${COL[k]}"></span>`).join('')}</div>
          <div class="lg">${['campo', 'lab', 'inst'].map(k => `<span><i style="background:${COL[k]}"></i>${DEST[k].n.split(' ')[0]} ${nDest[k]}</span>`).join('')}</div></div>
        <div class="ind">Entradas: ${Object.keys(ENT).map(k => `<b>${k}</b> ${ENT[k]} (${nEnt[k]})`).join(' · ')}</div>` +
        ['campo', 'lab', 'inst'].map(k => `<div class="sub" style="color:${COL[k]}">${DEST[k].n} · ${nDest[k]}</div>` + fila(k === 'inst' ? 'I' : k === 'lab' ? 'L' : 'C', COL[k], DEST[k].f, `${nDest[k]} col.`, DEST[k].d, `data-d="${k}"`) +
          R.bav.map((b, i) => [b, i]).filter(([b]) => b[0] === k).sort((a, b) => a[0][2] - b[0][2]).map(([b, i]) => `<div class="esc" data-c="${i}" tabindex="0" role="button"><span>${C[i].n}</span><span class="e">${b[1]}</span><span class="d">${fmt(b[2] / 1000, 1)} km</span></div>`).join('')).join('')
    };
    pan.innerHTML = `<header><button type="button" class="cerrar" aria-label="Cerrar la red de colegios">&#215;</button><div class="ey">Colegios · red educativa</div><h2>Conectografía escolar</h2>
      <p class="lead">Tres pasos: los colegios se agrupan, caminan a su huerta y cada huerta va a Bavaria Común.</p>
      <div class="kp"><div><b>${N}</b><span>colegios con edificio</span></div><div><b>${H.length}</b><span>grupos (uno por huerta)</span></div><div><b>${H.length}</b><span>huertas efímeras en parques</span></div></div></header>
      <nav class="tabs" role="tablist">${[['red', 'Red'], ['hue', 'Parques-huerta'], ['bav', 'Bavaria Común']].map(([k, n]) => `<button type="button" role="tab" data-t="${k}" aria-selected="false">${n}</button>`).join('')}</nav>
      <div class="cuerpo" role="tabpanel"></div>
      <div class="pie"><button type="button" id="cr-ver">Vista general</button></div>`;
    document.body.appendChild(pan);
    const cuerpo = pan.querySelector('.cuerpo');
    let tab = 'red';
    const enfasis = (k) => { // la capa de la pestaña queda plena; las otras, tenues
      for (const [kk, L] of Object.entries(CAPAS)) L.forEach(m => { const a = k ? (k === kk ? 1 : 0.22) : ({ red: 1, hue: 0.8, bav: 0.5 }[kk] || 1); if (m.material.uniforms) m.material.uniforms.uA.value = a; else m.material.opacity = 0.85 * a; });
      LBH.forEach(o => o.d.classList.toggle('dim', !!k && k !== 'hue')); LBB.concat(LBE).forEach(o => o.d.classList.toggle('dim', !!k && k !== 'bav'));
    };
    const pintar = () => { cuerpo.innerHTML = TABS[tab](); pan.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab))); cuerpo.scrollTop = 0; enfasis(tab === 'red' ? null : tab); };
    pan.querySelector('.tabs').onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; pintar(); if (tab === 'bav') volarA([3990, 230], 900, 700); else if (tab === 'red') general(); };
    const clic = (e) => { const ps = e.target.closest('.paso'); if (ps) { const ya = ps.classList.contains('on'); cuerpo.querySelectorAll('.paso').forEach(x => x.classList.toggle('on', !ya && x === ps)); enfasis(ya ? null : ps.dataset.p); if (ps.dataset.p === 'bav' && !ya) volarA([2600, 700], 3600, 3200); else general(); return; }
      const it = e.target.closest('.it,.esc'); if (!it) return;
      cuerpo.querySelectorAll('.it.act').forEach(x => x !== it && x.classList.remove('act')); it.classList.toggle('act');
      if (it.dataset.h !== undefined) enfocarHuerta(+it.dataset.h, true); else if (it.dataset.d) volarA(R.dest[it.dataset.d], 260); else if (it.dataset.c !== undefined) volarA(P[+it.dataset.c], 320); };
    cuerpo.addEventListener('click', clic); cuerpo.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clic(e); } });
    pan.querySelector('.cerrar').onclick = (e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('col-cerrar')); };
    pan.querySelector('header').addEventListener('click', (e) => { if (innerWidth < 760 && !e.target.closest('.cerrar')) pan.classList.toggle('min'); });
    pan.querySelector('#cr-ver').onclick = () => general();

    /* ================= CÁMARA ================= */
    let vuelo = 0;
    function volar(p1, t1, ms = 1600) {
      const o = T3.orbit; cancelAnimationFrame(vuelo);
      if (RMQ.matches) { T3.camera.position.copy(p1); o.target.copy(t1); o.update(); return; }
      const p0 = T3.camera.position.clone(), q0 = o.target.clone(), ini = performance.now();
      const f = () => { const k = Math.min(1, (performance.now() - ini) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; T3.camera.position.lerpVectors(p0, p1, e); o.target.lerpVectors(q0, t1, e); o.update(); if (k < 1) vuelo = requestAnimationFrame(f); };
      f();
    }
    const desplaza = (p1, t, d) => { const dir = t.clone().sub(p1).setY(0).normalize(), der = new THREE.Vector3(-dir.z, 0, dir.x);
      if (innerWidth > 760) { const k = d * 0.3; p1.addScaledVector(der, k); t.addScaledVector(der, k); } else { const k = -d * 0.22; p1.addScaledVector(dir, k); t.addScaledVector(dir, k); } };
    function volarA(c, dist, alto, ang = 0.75) { const t = new THREE.Vector3(c[0], 0, c[1]), p1 = new THREE.Vector3(c[0] + Math.sin(ang) * dist, alto || dist * 0.62, c[1] + Math.cos(ang) * dist); desplaza(p1, t, dist); volar(p1, t); }
    function general() { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; P.concat([R.dest.inst]).forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); });
      const s = Math.max(x1 - x0, z1 - z0) * (innerWidth < 760 ? 0.95 : 0.74), c = [(x0 + x1) / 2, (z0 + z1) / 2], t = new THREE.Vector3(c[0], 0, c[1]), p1 = new THREE.Vector3(c[0] + Math.sin(0.3) * s * 0.5, s * 0.9, c[1] + Math.cos(0.3) * s * 0.5);
      if (innerWidth < 760) { t.z += s * 0.18; p1.z += s * 0.18; } // celular: la hoja inferior tapa la parte de abajo
      volar(p1, t); LBH.forEach(o => o.d.classList.remove('act')); }
    function enfocarHuerta(k, desdePanel) {
      const h = H[k]; LBH.forEach((o, i) => o.d.classList.toggle('act', i === k));
      volarA(h.c, 62, 34, -h.a + 0.6);
      if (!desdePanel) { if (tab !== 'hue') { tab = 'hue'; pintar(); } const it = cuerpo.querySelector(`[data-h="${k}"]`); if (it) { it.classList.add('act'); it.scrollIntoView({ block: 'nearest', behavior: RMQ.matches ? 'auto' : 'smooth' }); } }
    }
    // tocar la huerta en el 3D también vuela allí (sin confundir con arrastrar la cámara)
    const rc = new THREE.Raycaster(), NDC = new THREE.Vector2(); let abajo = null;
    const cv = T3.renderer ? T3.renderer.domElement : document.querySelector('canvas');
    const pd = (e) => { abajo = [e.clientX, e.clientY]; };
    const pu = (e) => { if (!on || !abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 6) return; const r = cv.getBoundingClientRect();
      NDC.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); rc.setFromCamera(NDC, T3.camera); const hit = rc.intersectObjects(HIT, false)[0]; if (hit) enfocarHuerta(hit.object.userData.k); };
    if (cv) { cv.addEventListener('pointerdown', pd); cv.addEventListener('pointerup', pu); }

    /* ================= ANIMACIÓN ================= */
    let raf = 0, ult = performance.now(), tt = 0; const V = new THREE.Vector3();
    function cuadro() {
      raf = requestAnimationFrame(cuadro); const ahora = performance.now(), dt = Math.min(0.1, (ahora - ult) / 1000); ult = ahora;
      const mov = !RMQ.matches; if (mov) { TU.value += dt; tt += dt; tFauna(tt); }
      if (mov) anillos.forEach((m, i) => { const s = 1 + 0.12 * Math.sin(ahora / 420 + i); m.scale.set(s, 1, s); });
      const cam = T3.camera, Wd = innerWidth, Hh = innerHeight;
      for (const e of ETQ) { const dc = (e.min || e.max) ? cam.position.distanceTo(V.set(e.pos[0], e.pos[1], e.pos[2])) : 0;
        if ((e.min && dc < e.min) || (e.max && dc > e.max)) { if (e.d.style.display !== 'none') e.d.style.display = 'none'; continue; }
        V.set(e.pos[0], e.pos[1], e.pos[2]).project(cam); const ok = V.z < 1 && Math.abs(V.x) < 1.02 && Math.abs(V.y) < 1.02; e.d.style.display = ok ? 'block' : 'none';
        if (ok) e.d.style.transform = `translate(${((V.x + 1) / 2 * Wd - 10).toFixed(1)}px,${((1 - V.y) / 2 * Hh - e.d.offsetHeight - 18).toFixed(1)}px)`; }
    }
    return {
      mostrar(v) {
        grupo.visible = v; pan.classList.toggle('on', v); document.body.classList.toggle('cr-on', v);
        if (v) { pan.classList.toggle('min', innerWidth < 760); tab = 'red'; pintar(); ult = performance.now(); if (!raf) cuadro(); }
        else { cancelAnimationFrame(raf); raf = 0; cancelAnimationFrame(vuelo); ETQ.forEach(e => { e.d.style.display = 'none'; }); }
      },
      general, enfocarHuerta, huertas: H, colorDe: (i) => CG[R.asig[i][0]]
    };
  }

  return {
    ver(v) { v = !!v; if (v === on) return; on = v; if (listo) API.mostrar(v); },
    get on() { return on; }, grupo, listo: pDatos,
    general() { if (API) API.general(); }, huerta(k) { if (API) API.enfocarHuerta(k); }, colorDe(i) { return API ? API.colorDe(i) : null; }
  };
}

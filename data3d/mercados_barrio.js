/* ============ MERCADOS DE BARRIO EN LOS PARQUES (solo con la propuesta) ============
   Los 8 mercados de abastecimiento de data3d/carga.json (K.mercados) se ubican en el parque más cercano (data3d/parques.json, a menos de
   500 m y con área suficiente): dentro del polígono, en un claro cerca del borde que da a la calle, con el lado largo paralelo a ese borde.
   Cada mercado: piso duro de adoquín con sardinel, cubierta metálica a dos aguas de teja de zinc sobre pórticos de acero con canal,
   6+6 puestos bajo la cubierta y 4+4 puestos de toldo de lona en las bandas exteriores, 4 sombrillas, mesones de madera con huacales
   de tomate, papa, cebolla, zanahoria, plátano, mazorca, lechuga y naranja, canastas, bancas, estaciones de separación de residuos
   (verde orgánicos, blanco aprovechables, negro no aprovechables) y un aviso en los dos extremos.
   Todo se funde en una sola malla por material en todos los mercados: ~8 llamadas de dibujo en total. */
export async function crearMercados({ T3, cj }) {
  const THREE = T3.THREE;
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const carga = await cj('data3d/carga.json');
  const MER = (carga && carga.mercados) || [];
  const grupo = new THREE.Group(); grupo.name = 'mercados-barrio'; grupo.visible = false; T3.scene.add(grupo);
  const ANIS = Math.min(8, T3.renderer.capabilities.getMaxAnisotropy ? T3.renderer.capabilities.getMaxAnisotropy() : 4);
  let sem = 11; const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);
  const lienzo = (w, h, f, rep = true) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANIS; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };

  /* ---------- 1. ubicación: parque más cercano con claro suficiente ----------
     Calculada fuera de línea con los datos del modelo (parques.json, trees.json, canchas.json, buildings.json, water_bodies.json y las huertas efímeras de huertas_barrio.json): para cada
     mercado, el parque más cercano (a menos de 500 m del punto de carga.json, 1.500 m² o más) con un claro de 32x24 m (o 26x19 m) sin copas de
     árboles del censo, canchas, edificios ni agua, cerca del borde del parque y con el lado largo paralelo a ese borde (el lado de la calle).
     Cada fila: [x, y en coordenadas del modelo (T3.lw las pasa al mundo), ángulo del lado largo, escala, parque]. Si un mercado no tiene fila
     queda en su punto original. */
  const SITIOS = [
    [6946.4, 3553.6, 2.4229, 1, "Biblioteca El Tintal (parque metropolitano)"],
    [8573.8, 3166, 0.4721, 0.8, "Castilla (parque zonal)"],
    [8370.2, 3858.9, 1.1016, 1, "Ciudad Urbisa I y II Sector - Castilla Real (2 Sector) (parque vecinal)"],
    [7789.6, 2316.6, 1.6821, 0.8, "Rincon De Los Angeles (parque vecinal)"],
    [6541.4, 4941.2, -2.2081, 0.8, "La Magdalena Etapa II (parque vecinal)"],
    [6325, 3270, 0.8197, 0.8, "Patio Bonito II Sector (parque vecinal)"],
    [8266.2, 3700.9, -2.3534, 1, "Ciudad Urbisa I y II Sector - Castilla Real (2 Sector) (parque vecinal)"],
    [7266.3, 4006.7, -0.7694, 1, "Otero de Francisco (parque vecinal)"]
  ];
  const SIT = MER.map((m, i) => { const r = SITIOS[i]; const w = T3.lw((r ? r[0] : m.p[0]), (r ? r[1] : m.p[1]));
    return { n: m.n || ('Mercado de barrio ' + (i + 1)), x: w[0], z: w[1], a: r ? r[2] : 0, s: r ? r[3] : 1, parque: r ? r[4] : null, y: null, ok: false }; });
  const HU = 16, HV = 12; // medio largo y medio ancho de la huella (piso incluido)
  /* ---------- 2. texturas procedurales ---------- */
  const texAdo = lienzo(256, 256, (g, w, h) => { // adoquín de concreto 20x10 cm en hiladas trabadas; la textura cubre 1,6 m
    g.fillStyle = '#4a4742'; g.fillRect(0, 0, w, h); const pw = 32, ph = 16;
    for (let r = 0; r < h / ph; r++) for (let c = -1; c < w / pw + 1; c++) { const x = c * pw + (r % 2) * pw / 2, v = rnd(), gr = 138 + rnd() * 34;
      g.fillStyle = v < 0.18 ? `rgb(${gr + 22},${gr - 18},${gr - 34})` : v < 0.3 ? `rgb(${gr - 30},${gr - 26},${gr - 24})` : `rgb(${gr},${gr - 3},${gr - 8})`; g.fillRect(x + 1, r * ph + 1, pw - 2, ph - 2);
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 1, r * ph + 1, pw - 2, 2); }
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '30,28,24' : '200,195,180'},${0.05 + rnd() * 0.12})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } });
  const texMad = lienzo(512, 512, (g, w, h) => { // tablas de ~12 cm con veta, juntas y clavos; cubre 1 m
    for (let k = 0; k < 8; k++) { const y = k * 64, b = rnd(); g.fillStyle = `rgb(${150 + b * 36},${112 + b * 26},${72 + b * 18})`; g.fillRect(0, y, w, 64);
      for (let i = 0; i < 46; i++) { g.strokeStyle = `rgba(${70 + rnd() * 30},${44 + rnd() * 20},22,${0.12 + rnd() * 0.25})`; g.lineWidth = 1 + rnd(); const yy = y + 3 + rnd() * 58; g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(150, yy + 4 * (rnd() - 0.5), 350, yy + 5 * (rnd() - 0.5), w, yy + 2 * (rnd() - 0.5)); g.stroke(); }
      if (rnd() < 0.5) { const nx = rnd() * w, ny = y + 14 + rnd() * 36; g.fillStyle = 'rgba(60,36,16,.55)'; g.beginPath(); g.ellipse(nx, ny, 5, 3, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(35,20,8,.75)'; g.fillRect(0, y, w, 2); }
    g.fillStyle = 'rgba(0,0,0,.1)'; for (let i = 0; i < 300; i++) g.fillRect(rnd() * w, rnd() * h, 2, 1); });
  const texZinc = lienzo(128, 128, (g, w, h) => { // teja de zinc ondulada: la onda se repite cada 25 cm (texturas de 0,5 m con dos ondas)
    for (let x = 0; x < w; x++) { const f = 0.5 + 0.5 * Math.sin(x / w * Math.PI * 4); const v = Math.round(206 + f * 28); g.fillStyle = `rgb(${v - 4},${v},${v - 2})`; g.fillRect(x, 0, 1, h); }
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '90,72,52' : '240,240,235'},${0.04 + rnd() * 0.1})`; g.fillRect(rnd() * w, rnd() * h, 1, 3 + rnd() * 18); } });
  const texLona = lienzo(128, 8, (g, w, h) => { // franjas de lona de 22 cm (una clara y una apenas más oscura) con trama
    for (let x = 0; x < w; x++) { const franja = Math.floor(x / (w / 2)); g.fillStyle = franja ? 'rgb(208,204,198)' : 'rgb(255,252,246)'; g.fillRect(x, 0, 1, h); }
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.06})`; g.fillRect(rnd() * w, rnd() * h, 1, 1); } });
  const TIPOS = ['tomate', 'papa', 'cebolla', 'zanahoria', 'platano', 'mazorca', 'lechuga', 'naranja'];
  const bola = (g, x, y, r, col, sx = 1) => { const q = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r * 1.05); q.addColorStop(0, col[1]); q.addColorStop(0.65, col[0]); q.addColorStop(1, col[2]);
    g.fillStyle = q; g.beginPath(); g.ellipse(x, y, r * sx, r, 0, 0, 7); g.fill(); };
  const texFruta = lienzo(2048, 1024, (g) => {
    TIPOS.forEach((tp, k) => { const ox = (k % 4) * 512, oy = Math.floor(k / 4) * 512; g.save(); g.beginPath(); g.rect(ox, oy, 512, 512); g.clip(); g.translate(ox, oy);
      g.fillStyle = tp === 'lechuga' ? '#2f5a1f' : tp === 'platano' ? '#5b4a1a' : '#3a2a1c'; g.fillRect(0, 0, 512, 512);
      const items = []; const N = tp === 'tomate' || tp === 'naranja' ? 430 : tp === 'papa' || tp === 'cebolla' ? 340 : tp === 'lechuga' ? 90 : 170; for (let i = 0; i < N; i++) items.push([rnd() * 560 - 24, rnd() * 560 - 24, rnd()]); items.sort((a, b) => a[1] - b[1]);
      for (const [x, y, v] of items) {
        if (tp === 'tomate') { const c = v < 0.55 ? ['#bf2f1b', '#e8573a', '#7a1a10'] : v < 0.85 ? ['#cf3a20', '#f2704a', '#8a2012'] : ['#d9622a', '#f29a5a', '#92411a']; bola(g, x, y, 16 + v * 4, c); g.fillStyle = '#3f6b2a'; g.beginPath(); g.arc(x, y - 11, 4, 0, 7); g.fill(); }
        else if (tp === 'naranja') { const c = v < 0.5 ? ['#e08516', '#f7ad4a', '#9a5208'] : ['#ec9a22', '#ffc766', '#a35c0b']; bola(g, x, y, 17 + v * 3, c); g.fillStyle = 'rgba(120,60,0,.35)'; for (let n = 0; n < 6; n++) g.fillRect(x - 12 + rnd() * 22, y - 12 + rnd() * 22, 1.5, 1.5); }
        else if (tp === 'papa') { const c = v < 0.4 ? ['#b58b5e', '#d9b98c', '#6e4e30'] : v < 0.75 ? ['#a67a4d', '#cfae80', '#664528'] : ['#c4a273', '#e6cb9f', '#7c5c3a']; bola(g, x, y, 15 + v * 5, c, 1.2); g.fillStyle = 'rgba(70,45,25,.7)'; for (let n = 0; n < 3; n++) g.fillRect(x - 12 + rnd() * 24, y - 8 + rnd() * 16, 2.5, 2); }
        else if (tp === 'cebolla') { const c = v < 0.6 ? ['#8c3a4d', '#c26f7f', '#4e1a2a'] : ['#c9944f', '#ecc684', '#7d5224']; bola(g, x, y, 15 + v * 4, c); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - 18); g.quadraticCurveTo(x - 9, y, x, y + 18); g.stroke(); g.fillStyle = '#7e8a4a'; g.fillRect(x - 1.5, y - 28, 3, 9); }
        else if (tp === 'zanahoria') { g.save(); g.translate(x, y); g.scale(0.62, 0.62); g.rotate(-0.45 + v * 0.9 + (v > 0.5 ? 0 : 0)); const q = g.createLinearGradient(0, -9, 0, 9); q.addColorStop(0, '#f08a2a'); q.addColorStop(0.5, '#ee7a18'); q.addColorStop(1, '#b4560c'); g.fillStyle = q; g.beginPath(); g.moveTo(-62, -2); g.lineTo(44, -12); g.quadraticCurveTo(54, 0, 44, 12); g.lineTo(-62, 2); g.closePath(); g.fill(); g.strokeStyle = 'rgba(120,50,0,.35)'; g.lineWidth = 1; for (let n = 0; n < 5; n++) { g.beginPath(); g.moveTo(-50 + n * 22, -9); g.lineTo(-50 + n * 22, 9); g.stroke(); } g.fillStyle = '#3f7a28'; g.fillRect(44, -6, 18, 12); g.restore(); }
        else if (tp === 'platano') { g.save(); g.translate(x, y); g.scale(0.62, 0.62); g.rotate(-0.6 + v * 1.2); const verde = v < 0.28; g.lineCap = 'round'; g.strokeStyle = verde ? '#8aa83a' : '#e6bd2a'; g.lineWidth = 27; g.beginPath(); g.moveTo(-70, 12); g.quadraticCurveTo(0, -26, 70, 12); g.stroke(); g.strokeStyle = verde ? '#a6c24c' : '#f6d54a'; g.lineWidth = 9; g.beginPath(); g.moveTo(-62, 8); g.quadraticCurveTo(0, -30, 62, 8); g.stroke(); g.fillStyle = '#4a3a14'; g.beginPath(); g.arc(-72, 13, 6, 0, 7); g.arc(72, 13, 6, 0, 7); g.fill(); if (v > 0.6) { g.fillStyle = 'rgba(90,60,10,.5)'; for (let n = 0; n < 6; n++) g.fillRect(-50 + rnd() * 100, -6 + rnd() * 14, 2, 2); } g.restore(); }
        else if (tp === 'mazorca') { g.save(); g.translate(x, y); g.scale(0.62, 0.62); g.rotate(-0.7 + v * 1.4); const q = g.createLinearGradient(0, -15, 0, 15); q.addColorStop(0, '#f2cf48'); q.addColorStop(1, '#c79a1e'); g.fillStyle = q; g.beginPath(); g.moveTo(-58, 0); g.quadraticCurveTo(-50, -17, 10, -17); g.quadraticCurveTo(52, -12, 58, 0); g.quadraticCurveTo(52, 12, 10, 17); g.quadraticCurveTo(-50, 17, -58, 0); g.fill(); g.fillStyle = 'rgba(150,100,10,.55)'; for (let i = -50; i < 50; i += 7) for (let j = -12; j <= 12; j += 7) g.fillRect(i, j, 2.5, 2.5); g.fillStyle = '#6a8f33'; g.beginPath(); g.moveTo(-66, 0); g.quadraticCurveTo(-30, -26, 10, -12); g.quadraticCurveTo(-30, -2, -66, 0); g.fill(); g.restore(); }
        else if (tp === 'lechuga') { const c0 = v < 0.5 ? ['#74b83c', '#b6e070', '#3f7a22'] : ['#5fa22e', '#a2d466', '#2f6a1c']; for (let n = 0; n < 3; n++) bola(g, x + (n - 1) * 5, y + (n - 1) * 3, 40 - n * 8, c0); g.strokeStyle = 'rgba(235,250,200,.4)'; g.lineWidth = 2; for (let n = 0; n < 8; n++) { const a = n * 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30); g.stroke(); } }
      }
      g.restore(); });
  });
  texFruta.wrapS = texFruta.wrapT = THREE.ClampToEdgeWrapping;
  const texCartel = lienzo(1024, 192, (g, w, h) => {
    g.fillStyle = '#1f4a34'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e7dfc8'; g.lineWidth = 5; g.strokeRect(12, 12, w - 24, h - 24);
    g.fillStyle = '#efe6cc'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '600 78px "Barlow Condensed", "Arial Narrow", Arial, sans-serif'; g.fillText('MERCADO CAMPESINO DE BARRIO', w / 2, 82);
    g.fillStyle = '#c8d98a'; g.font = '400 36px Arial, sans-serif'; g.fillText('Productores locales  ·  frutas, verduras y tubérculos frescos', w / 2, 150); }, false);

  /* ---------- 3. materiales (uno por tipo; vertexColors para variar el color de cada pieza) ---------- */
  const mat = (ex) => new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, envMap: T3.env || null, envMapIntensity: 1.0, ...ex }); // con el mapa de entorno del cielo, bajo la cubierta también llega luz difusa
  const MATS = {
    ado: mat({ map: texAdo, roughness: 0.96 }), mad: mat({ map: texMad, roughness: 0.88 }), met: mat({ roughness: 0.55, metalness: 0.2 }),
    teja: mat({ map: texZinc, roughness: 0.5, metalness: 0.12, side: THREE.DoubleSide }), lona: mat({ map: texLona, roughness: 0.92, side: THREE.DoubleSide }),
    plas: mat({ roughness: 0.62 }), fruta: mat({ map: texFruta, roughness: 0.7 }), cartel: mat({ map: texCartel, roughness: 0.6, side: THREE.DoubleSide })
  };
  const SOMBRA = { mad: [1, 1], met: [1, 0], teja: [1, 1], lona: [1, 0], plas: [1, 1], ado: [0, 1], fruta: [0, 1], cartel: [1, 0] };
  const LONAS = ['#a9573c', '#6d7b40', '#c49a3b', '#3f6c76', '#d5c9ae', '#7e4141', '#4e6d56', '#8f6a3a'];

  /* ---------- 4. piezas: cada una se transforma al mundo y se acumula por material ---------- */
  let ACC = {}; let M0 = new THREE.Matrix4();
  const _e = new THREE.Euler(), _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1);
  const _c = new THREE.Color();
  const poner = (key, g0, color, x, y, z, rx = 0, ry = 0, rz = 0, esc = 0) => {
    const g = g0.index ? g0.toNonIndexed() : g0; const P = g.attributes.position, N = g.attributes.normal;
    if (esc) { const U = new Float32Array(P.count * 2); for (let i = 0; i < P.count; i++) { const ax = Math.abs(N.getX(i)), ay = Math.abs(N.getY(i)), az = Math.abs(N.getZ(i));
      if (ay >= ax && ay >= az) { U[i * 2] = P.getX(i) / esc; U[i * 2 + 1] = P.getZ(i) / esc; } else if (ax >= az) { U[i * 2] = P.getZ(i) / esc; U[i * 2 + 1] = P.getY(i) / esc; } else { U[i * 2] = P.getX(i) / esc; U[i * 2 + 1] = P.getY(i) / esc; } }
      g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); }
    _c.set(color); const C = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) { C[i * 3] = _c.r; C[i * 3 + 1] = _c.g; C[i * 3 + 2] = _c.b; } g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    _q.setFromEuler(_e.set(rx, ry, rz)); _m.compose(_p.set(x, y, z), _q, _s.set(1, 1, 1)); g.applyMatrix4(_m); g.applyMatrix4(M0);
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv' && k !== 'color') g.deleteAttribute(k);
    (ACC[key] = ACC[key] || []).push(g); };
  const caja = (key, w, h, d, x, y, z, color, esc = 1, rx = 0, ry = 0, rz = 0) => poner(key, new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz, esc);
  const cil = (key, rt, rb, h, seg, x, y, z, color, esc = 1, rx = 0, ry = 0, rz = 0) => poner(key, new THREE.CylinderGeometry(rt, rb, h, seg), color, x, y, z, rx, ry, rz, esc);
  // montón de producto sobre un huacal: media esfera aplastada con relieve; el atlas de frutas da el color y la forma de cada tipo
  const monton = (tipo, sx, sy, sz, x, y, z, ry = 0) => {
    const g = new THREE.SphereGeometry(1, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2), P = g.attributes.position, U = g.attributes.uv, k = TIPOS.indexOf(tipo), c = k % 4, r = Math.floor(k / 4);
    for (let i = 0; i < P.count; i++) { const px = P.getX(i), pz = P.getZ(i), py = P.getY(i); const rr = Math.hypot(px, pz); const b = (Math.sin(px * 17 + pz * 11) * Math.cos(pz * 19 - px * 7)) * 0.07 * (1 - rr * 0.6) * (py > 0.05 ? 1 : 0); P.setY(i, py * (1 + b) + (rr < 0.97 ? 0 : 0)); U.setXY(i, (c + 0.5 + px * 0.49) / 4, 1 - (r + 0.5 + pz * 0.49) / 2); }
    g.computeVertexNormals(); g.scale(sx, sy, sz); poner('fruta', g, '#ffffff', x, y, z, 0, ry, 0); };
  // huacal sin rotación propia: paredes en el marco del puesto (los puestos solo giran 0 o PI, no hace falta más)
  const huacalSimple = (w, h, d, x, y, z, tipo) => {
    const col = '#c4a070'; caja('mad', w, h, d, x, y + h / 2, z, col, 0.8);
    caja('mad', w + 0.03, 0.025, d + 0.03, x, y + h - 0.012, z, '#b08b5c', 0.8); // borde superior
    caja('mad', w + 0.03, 0.025, d + 0.03, x, y + 0.012, z, '#a98550', 0.8); // zuncho inferior
    if (tipo) monton(tipo, w * 0.47, h * 0.55, d * 0.47, x, y + h - 0.02, z); };
  const mesa = (x, z, w, d, hy) => { // mesón de madera con patas y travesaño
    caja('mad', w, 0.05, d, x, hy, z, '#d7b383', 1);
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) caja('mad', 0.06, hy, 0.06, x + dx * (w / 2 - 0.08), hy / 2, z + dz * (d / 2 - 0.08), '#a98456', 1);
    caja('mad', w - 0.2, 0.04, 0.05, x, 0.3, z - d / 2 + 0.08, '#a98456', 1); caja('mad', w - 0.2, 0.04, 0.05, x, 0.3, z + d / 2 - 0.08, '#a98456', 1); };
  let kt = 0;
  const puesto = (u, vc, sg, toldo, ic) => { // sg = +1/-1 lado del mercado: el cliente se acerca desde el pasillo (sg*) o desde afuera
    const hy = 0.07 + 0.86, w = toldo ? 2.9 : 2.5, d = 0.95, front = toldo ? 1 : -1; // el frente del mesón mira al cliente
    mesa(u, vc, w, d, hy);
    caja('lona', w, 0.46, 0.015, u, hy - 0.28, vc + sg * front * (d / 2 + 0.005) * 1, LONAS[(ic + 3) % LONAS.length], 0.44); // faldón de lona del mesón
    for (let c = 0; c < 3; c++) huacalSimple(0.66, 0.22, 0.4, u - w / 3 + c * w / 3, hy + 0.025, vc + sg * front * 0.18, TIPOS[(kt++ + ic) % 8]);
    // repisa trasera con huacales más pequeños
    caja('mad', w - 0.1, 0.04, 0.4, u, hy + 0.3, vc - sg * front * 0.27, '#a98456', 1);
    for (const dx of [-1, 1]) caja('mad', 0.05, 0.3, 0.05, u + dx * (w / 2 - 0.15), hy + 0.15, vc - sg * front * 0.4, '#a98456', 1);
    for (let c = 0; c < 3; c++) huacalSimple(0.5, 0.18, 0.32, u - w / 3 + c * w / 3, hy + 0.32, vc - sg * front * 0.27, TIPOS[(kt++ + ic + 4) % 8]);
    if (ic % 2 === 0) { // canastas de mimbre en el piso junto al puesto
      for (const dx of [-0.9, 0.9]) { cil('mad', 0.26, 0.2, 0.3, 10, u + dx * w / 2 * 0.62, 0.07 + 0.15, vc + sg * front * (d / 2 + 0.38), '#b6894a', 0.5); monton(TIPOS[(ic + (dx > 0 ? 2 : 5)) % 8], 0.25, 0.14, 0.25, u + dx * w / 2 * 0.62, 0.07 + 0.29, vc + sg * front * (d / 2 + 0.38)); } }
    if (toldo) { // toldo de lona inclinado sobre postes de tubo metálico
      const lc = LONAS[ic % LONAS.length], vb = vc - sg * 1.25, vf = vc + sg * 1.45, yb = 2.7, yf = 2.15, L = Math.hypot(vf - vb, yb - yf), ang = Math.atan2(yb - yf, Math.abs(vf - vb));
      for (const dx of [-1, 1]) { cil('met', 0.025, 0.025, yb, 6, u + dx * 1.5, 0.07 + yb / 2, vb, '#5b6460', 0.5); cil('met', 0.025, 0.025, yf, 6, u + dx * 1.5, 0.07 + yf / 2, vf, '#5b6460', 0.5); }
      caja('lona', 3.2, 0.02, L, u, 0.07 + (yb + yf) / 2 + 0.01, (vb + vf) / 2, lc, 0.44, sg * ang, 0, 0);
      caja('lona', 3.2, 0.24, 0.015, u, 0.07 + yf - 0.11, vf, lc, 0.44);
      cil('met', 0.012, 0.012, 3.2, 5, u, 0.07 + (yb + yf) / 2 - 0.04 + 0.0, (vb + vf) / 2, '#5b6460', 0.5, 0, 0, Math.PI / 2); }
  };
  const sombrilla = (u, v, ic) => {
    const col = LONAS[ic % LONAS.length];
    cil('met', 0.02, 0.025, 2.4, 6, u, 0.07 + 1.2, v, '#6a716d', 0.5);
    poner('lona', new THREE.ConeGeometry(1.45, 0.42, 10, 1, true), col, u, 0.07 + 2.4 + 0.1, v, 0, 0.3, 0, 0.44);
    mesa(u, v, 1.5, 0.8, 0.07 + 0.82);
    for (let c = 0; c < 2; c++) huacalSimple(0.58, 0.2, 0.36, u - 0.36 + c * 0.72, 0.07 + 0.845, v, TIPOS[(ic * 2 + c + 1) % 8]);
  };
  const banca = (u, v, sg) => {
    caja('mad', 1.7, 0.05, 0.42, u, 0.07 + 0.45, v, '#bf9b66', 1); caja('mad', 1.7, 0.36, 0.04, u, 0.07 + 0.72, v + sg * 0.19, '#bf9b66', 1, -sg * 0.12);
    for (const dx of [-0.7, 0.7]) { caja('met', 0.05, 0.45, 0.05, u + dx, 0.07 + 0.225, v - sg * 0.15, '#3b423f', 0.5); caja('met', 0.05, 0.45, 0.05, u + dx, 0.07 + 0.225, v + sg * 0.15, '#3b423f', 0.5); } };
  const canecas = (u, v) => { [['#2f7d3a', 0], ['#e6e6df', 1], ['#26292c', 2]].forEach(([c, i]) => { const x = u, z = v + (i - 1) * 0.62;
    cil('plas', 0.26, 0.21, 0.9, 12, x, 0.07 + 0.45, z, c, 0.5); cil('plas', 0.28, 0.28, 0.06, 12, x, 0.07 + 0.93, z, c, 0.5); caja('plas', 0.04, 0.04, 0.22, x, 0.07 + 0.97, z, '#202326', 0.5); });
    caja('plas', 0.04, 1.5, 1.9, u - 0.34, 0.07 + 0.75, v, '#d9d4c4', 0.5); // tablero con las tres categorías
    caja('plas', 0.045, 0.4, 0.6, u - 0.35, 0.07 + 1.28, v - 0.62, '#2f7d3a', 0.5); caja('plas', 0.045, 0.4, 0.6, u - 0.35, 0.07 + 1.28, v, '#cfd2cc', 0.5); caja('plas', 0.045, 0.4, 0.6, u - 0.35, 0.07 + 1.28, v + 0.62, '#26292c', 0.5); };

  const mercado = (S) => {
    const cu = Math.cos(S.a), su = Math.sin(S.a);
    M0.compose(new THREE.Vector3(S.x, S.y, S.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -S.a, 0)), new THREE.Vector3(S.s, S.s, S.s));
    kt = 0;
    // piso duro: losa de adoquín con sardinel claro; se hunde 0,3 m para sentarse en terrenos con pendiente
    caja('ado', 2 * HU, 0.4, 2 * HV, 0, 0.07 - 0.2, 0, '#e6e1d8', 1.6);
    for (const [w, d, x, z] of [[2 * HU + 0.3, 0.16, 0, -HV], [2 * HU + 0.3, 0.16, 0, HV], [0.16, 2 * HV, -HU, 0], [0.16, 2 * HV, HU, 0]]) caja('plas', w, 0.2, d, x, 0.07 + 0.04, z, '#b9b5ab', 0.5);
    // cubierta: 5 pórticos de acero (columnas, tirante, cabios y pendolón), correas y dos aguas de teja de zinc con cumbrera y canales
    const ST = '#59615d', FI = 0.262; let ic = 0;
    for (const fu of [-10, -5, 0, 5, 10]) {
      for (const sg of [-1, 1]) { caja('met', 0.16, 3.1, 0.16, fu, 0.07 + 1.55, sg * 5, ST, 0.5); caja('met', 0.1, 0.22, 0.6, fu, 0.07 + 3.0, sg * 5, ST, 0.5); // columna y cartela
        const L = Math.hypot(5.6, 1.5); caja('met', 0.08, 0.13, L, fu, 0.07 + 3.0 + 0.75 - 0.08, sg * 2.8, ST, 0.5, sg * FI, 0, 0); }
      caja('met', 0.07, 0.12, 10.2, fu, 0.07 + 3.0 - 0.02, 0, ST, 0.5); caja('met', 0.06, 1.3, 0.06, fu, 0.07 + 3.0 + 0.62, 0, ST, 0.5);
      for (const sg of [-1, 1]) caja('met', 0.04, 0.04, 3.1, fu, 0.07 + 3.0 + 0.25, sg * 1.25, ST, 0.5, sg * 0.38, 0, 0); // tornapuntas
    }
    for (const v of [-5.4, -2.8, 0, 2.8, 5.4]) caja('met', 25, 0.06, 0.08, 0, 0.07 + 4.5 - Math.abs(v) * 0.268 + 0.02, v, ST, 0.5);
    for (const sg of [-1, 1]) { caja('teja', 25.2, 0.045, Math.hypot(5.6, 1.5), 0, 0.07 + 3.75 + 0.14, sg * 2.8, '#cfd3cf', 0.5, sg * FI, 0, 0);
      caja('met', 25.4, 0.12, 0.14, 0, 0.07 + 2.95, sg * 5.65, '#6a716d', 0.5); // canal
      for (const du of [-10.5, 10.5]) cil('met', 0.045, 0.045, 3.0, 8, du, 0.07 + 1.5, sg * 5.75, '#6a716d', 0.5); } // bajantes
    caja('met', 25.4, 0.05, 0.46, 0, 0.07 + 4.64, 0, '#7a8280', 0.5); // cumbrera
    // avisos en los dos extremos
    for (const sg of [-1, 1]) { poner('cartel', new THREE.PlaneGeometry(4.4, 0.83), '#ffffff', sg * 12.115, 0.07 + 3.28, 0, 0, sg * Math.PI / 2, 0, 0); poner('cartel', new THREE.PlaneGeometry(4.4, 0.83), '#ffffff', sg * 12.025, 0.07 + 3.28, 0, 0, -sg * Math.PI / 2, 0, 0); // aviso legible por las dos caras
      caja('mad', 0.07, 0.95, 4.5, sg * 12.07, 0.07 + 3.28, 0, '#7a5a38', 1); for (const dv of [-2, 2]) caja('met', 0.07, 3.3, 0.07, sg * 12.1, 0.07 + 1.65, dv, ST, 0.5); }
    // puestos bajo la cubierta (pasillo central de 3 m) y puestos de toldo por fuera
    for (const sg of [-1, 1]) for (let k = 0; k < 6; k++) puesto(-7.5 + k * 3, sg * 3.7, sg, false, ic++);
    for (const sg of [-1, 1]) for (let k = 0; k < 4; k++) puesto(-6.75 + k * 4.5, sg * 8.6, sg, true, ic++);
    [[-13.6, -2.2], [-13.6, 2.4], [13.6, -2.4], [13.6, 2.2]].forEach(([u, v], i) => sombrilla(u, v, ic++ + i));
    for (const [u, v, sg] of [[-6.5, 10.7, 1], [6.5, 10.7, 1], [-6.5, -10.7, -1], [6.5, -10.7, -1]]) banca(u, v, sg);
    canecas(14.4, -7); canecas(-14.4, 7);
    // pilas de huacales vacíos y sacos de papa junto a los puestos de las esquinas
    for (const [u, v] of [[-14.3, -9.6], [14.3, 9.6]]) { for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) caja('mad', 0.6, 0.22, 0.4, u + j * 0.64, 0.07 + 0.11 + i * 0.22, v, '#c4a070', 0.8);
      for (let i = 0; i < 4; i++) caja('plas', 0.55, 0.2 + (i % 2) * 0.04, 0.38, u + 0.5 * (i % 2), 0.07 + 0.11 + (i >> 1) * 0.2, v + 0.55 + (i % 2) * 0.1, i % 2 ? '#b99b6a' : '#c8aa78', 0.5, 0, i * 0.3, 0); }
  };

  /* ---------- 5. armado: una malla por material para los 8 mercados ---------- */
  const MESH = {};
  const grupoMallas = new THREE.Group(); grupoMallas.name = 'mercados-mallas'; grupo.add(grupoMallas);
  const limpiar = () => { for (const k in MESH) { grupoMallas.remove(MESH[k]); MESH[k].geometry.dispose(); delete MESH[k]; } };
  let stats = { llamadas: 0, triangulos: 0 };
  const armar = () => {
    limpiar(); ACC = {};
    for (const S of SIT) { if (S.y == null) S.y = (T3.sueloY != null ? T3.sueloY : 0.35) + 0.02; mercado(S); }
    stats = { llamadas: 0, triangulos: 0 };
    for (const k in ACC) { const g = mergeGeometries(ACC[k]); for (const x of ACC[k]) x.dispose(); if (!g) continue; const m = new THREE.Mesh(g, MATS[k]); m.castShadow = !!SOMBRA[k][0]; m.receiveShadow = !!SOMBRA[k][1]; m.name = 'mercados-' + k; MESH[k] = m; grupoMallas.add(m); stats.llamadas++; stats.triangulos += g.attributes.position.count / 3; }
    ACC = {}; };
  armar();

  /* ---------- 6. apoyar cada mercado en el suelo real de la foto aérea (como las huertas de barrio) ---------- */
  const rc = new THREE.Raycaster(), ab = new THREE.Vector3(0, -1, 0), P0 = new THREE.Vector3(); rc.firstHitOnly = true; let ultDy = null;
  const apoyar = () => {
    const tl = T3.tiles; if (!tl || !tl.group || !grupo.visible) return; const st = tl.stats; if (st && st.downloading + st.parsing > 6) return;
    if (T3.tilesDy !== ultDy) { for (const S of SIT) S.ok = false; ultDy = T3.tilesDy; }
    const t = T3.orbit ? T3.orbit.target : T3.camera.position; let cambio = false;
    for (const S of SIT) { if (S.ok || !S.parque) continue; if (Math.hypot(S.x - t.x, S.z - t.z) > 650) continue;
      const base = (T3.sueloY != null ? T3.sueloY : 0.35) + 0.02, ys = [], c = Math.cos(S.a), n = Math.sin(S.a);
      for (const [u, v] of [[-0.9, -0.9], [0, -0.9], [0.9, -0.9], [-0.9, 0], [0, 0], [0.9, 0], [-0.9, 0.9], [0, 0.9], [0.9, 0.9]]) { const px = S.x + (u * HU * c - v * HV * n) * S.s, pz = S.z + (u * HU * n + v * HV * c) * S.s;
        rc.set(P0.set(px, base + 150, pz), ab); const h = rc.intersectObject(tl.group, true)[0]; if (h && Math.abs(h.point.y - base) < 30) ys.push(h.point.y); }
      if (ys.length < 4) continue; ys.sort((a, b) => a - b); const y = ys[Math.floor(ys.length * 0.5)] - 0.02; S.ok = true; if (S.y == null || Math.abs(S.y - y) > 0.12) { S.y = y; cambio = true; } }
    if (cambio) armar(); };
  const timer = setInterval(apoyar, 1600);

  return {
    grupo, stats: () => stats,
    lista: SIT.map(S => ({ get n() { return S.n; }, get x() { return S.x; }, get z() { return S.z; }, get a() { return S.a; }, s: S.s, parque: S.parque, get y() { return S.y; } })),
    ver(on) { grupo.visible = !!on; if (on) apoyar(); },
    quitar() { clearInterval(timer); limpiar(); T3.scene.remove(grupo); }
  };
}

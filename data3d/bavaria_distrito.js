/* ============ BAVARIA COMÚN · DISTRITO DE TECNOLOGÍAS CONVERGENTES (NBIC) ============
   Se prende al escoger «Bavaria Común» en la leyenda de «Con la propuesta» (data3d/escenario.js). Al prenderse, en secuencia:
   1. los edificios se levantan como volúmenes de luz de su uso (programa NBIC en 12 edificios: nano, bio, info, cogno + aulas,
      poscosecha, mercado, incubadora, alimentos, polinizadores y torre de monitoreo);
   2. la red de calles cambia a la NUEVA SINTAXIS ESPACIAL (integración angular a 800 m, después de abrir los 25 pasajes) y los pasajes
      se dibujan con gente caminando (data3d/bavaria_distrito_sx.json, de tools/bavaria_distrito_sx.py);
   3. la red de datos une el centro de datos con los edificios y los sensores;
   4. salen las INTERACCIONES BIÓTICAS que el distrito fomenta: abejas, abejorros, colibríes, mariposas, aves insectívoras, cernícalo,
      lechuza, murciélagos, ranas y libélulas, mariquitas y lombrices, cada una con su módulo de fauna y la tecnología que la mide.
   Huertas de enseñanza de seis tipos en los claros entre los parches de bosque, paralelas a los edificios y con aula junto a su pasaje.
   Retiros D1 (27) y D2 (20): bavaria.js los deja en un grupo aparte que aquí se esconde.
   Marco: bavaria.json y la sintaxis en el marco del modelo; lw() los pasa al mundo. */
export function crearDistritoBavaria({ T3, lw, D, ARB = [], SX = null }) {
  const THREE = T3.THREE, MOV = innerWidth < 760, RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const W = (p) => lw(p[0], p[1]), M = (x, y) => lw(x, y);
  const grupo = new THREE.Group(); grupo.name = 'bavaria_distrito'; grupo.visible = false; T3.scene.add(grupo);
  const ED = D.edif.map(e => ({ W: e.p.map(W), h: e.h }));
  const centro = (P) => { let x = 0, z = 0; for (const q of P) { x += q[0]; z += q[1]; } return [x / P.length, z / P.length]; };
  const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };
  const e2 = ED[2].W, ANG = Math.atan2(e2[1][1] - e2[0][1], e2[1][0] - e2[0][0]), CU = Math.cos(ANG), SU = Math.sin(ANG);
  const loc = (c, u, v) => [c[0] + u * CU - v * SU, c[1] + u * SU + v * CU];
  const rect = (c, w, d) => [loc(c, -w / 2, -d / 2), loc(c, w / 2, -d / 2), loc(c, w / 2, d / 2), loc(c, -w / 2, d / 2)];
  const fmt = (n) => Math.round(n).toLocaleString('es-CO');
  const TU = { value: 0 }; // tiempo compartido por los shaders
  const COLSP = '\n#include <colorspace_fragment>\n';

  /* ---------- programa NBIC ---------- */
  // programa: cada uso con su área (m²) y cuántas personas lo usan en un día típico (p). Hilo: se APRENDE a sembrar aquí y se lleva
  // a la casa, a la terraza y a las huertas de los parques junto a los colegios. NBIC = nano (sensores), bio (suelo y semillas),
  // info (datos de las huertas) y cogno (cómo se aprende y se decide qué comer), todos al servicio del mismo sistema de alimento.
  const PROG = [
    { k: 'inst', n: 'Escuela de agricultura urbana', c: '#60a5fa', e: 3, g: 'Aprender', m2: 620, p: 240, d: 'Aulas y taller donde empiezan todos los cursos: vecinos, colegios y productores aprenden a sembrar, abonar y cosechar.', x: '4 aulas de 30 personas, taller de herramientas, sala de profesores y casilleros. Dos jornadas al día.' },
    { k: 'bio', n: 'Laboratorio de suelos y semillas', c: '#34d399', e: 0, g: 'Bio', m2: 540, p: 70, d: 'Banco de semillas nativas, vida del suelo y abonos biológicos que luego se usan en las huertas de los barrios.', x: 'Banco de semillas, laboratorio de microbiología del suelo, producción de bioinsumos y cuarto de germinación.' },
    { k: 'nano', n: 'Taller de sensores', c: '#c084fc', e: 11, g: 'Nano', m2: 320, p: 30, d: 'Arma sensores baratos de humedad del suelo, agua y frescura del alimento para las huertas y los mercados.', x: 'Banco de electrónica, ensayo de empaques que avisan si el alimento se daña y préstamo de sensores a las huertas.' },
    { k: 'datos', n: 'Centro de datos y sensores ambientales', c: '#38bdf8', e: 4, g: 'Info', m2: 280, p: 35, d: 'Recibe las lecturas de las huertas de Bavaria, los parques y las terrazas: riego, cosechas, clima y polinizadores.', x: 'Sala de servidores pequeña, sala de lectura abierta a la comunidad y mapa de todas las huertas de Kennedy.' },
    { k: 'cogn', n: 'Laboratorio de aprendizaje y hábitos', c: '#f472b6', e: 5, g: 'Cogno', m2: 260, p: 45, d: 'Estudia cómo aprende mejor la gente a cultivar y qué la lleva a comer distinto; diseña las cartillas y los talleres.', x: 'Sala de observación, cocina de prueba y estudio de diseño de materiales para colegios y familias.' },
    { k: 'foro', n: 'Nave de encuentro y feria', c: '#e7e5e4', e: 2, g: 'Encuentro', m2: 1800, p: 320, d: 'La gran nave de la fábrica: llegada de los grupos, ferias de semillas, exposiciones y talleres abiertos.', x: 'Espacio libre con mobiliario móvil, fab lab de herramientas de huerta y punto de préstamo de semillas.' },
    { k: 'poli', n: 'Casa de polinizadores', c: '#fb923c', e: 23, g: 'Bio', m2: 420, p: 60, d: 'Mariposario y cría de abejorros nativos que polinizan las huertas del distrito y de los barrios.', x: 'Invernadero de cría, sala de observación para colegios y jardín de flores nativas.' },
    { k: 'pos', n: 'Poscosecha', c: '#f59e0b', e: 9, g: 'Producir', m2: 450, p: 30, d: 'Se pesa, se lava, se empaca y se enfría lo que se cosecha antes de ir al mercado.', x: 'Recepción, lavado, empaque, cuarto frío y despacho.' },
    { k: 'mer', n: 'Mercado de productores', c: '#fb7185', e: 8, g: 'Producir', m2: 900, p: 600, d: 'Venden las huertas de Bavaria, de los parques y de las casas; puerta propia a la Calle 7A.', x: '24 puestos, zona de pesaje y una cocina abierta para probar recetas.' },
    { k: 'inc', n: 'Incubadora de emprendimientos', c: '#a3e635', e: 15, g: 'Producir', m2: 360, p: 40, d: 'Acompaña a vecinos y egresados que montan su huerta, su vivero o su negocio de abono.', x: 'Oficinas compartidas, asesoría y vitrina de productos.' },
    { k: 'alim', n: 'Cocina laboratorio', c: '#fde047', e: 7, g: 'Producir', m2: 400, p: 90, d: 'Transforma lo que no se vende: conservas, deshidratados y menús para comedores escolares.', x: 'Cocina industrial docente, cuarto de conservas y comedor de prueba.' },
    { k: 'torre', n: 'Mirador y estación del clima', c: '#22d3ee', e: 6, g: 'Info', m2: 120, p: 80, d: 'Los silos se vuelven mirador con estación meteorológica: desde arriba se ven todas las huertas.', x: 'Escalera-mirador, estación del clima y grabadora de cantos de aves.' },
    { k: 'campo', n: 'Huertas de enseñanza', c: '#4ade80', g: 'Practicar', m2: 0, p: 400, d: 'Diez tipos de huerta en los claros del bosque: aquí se practica lo aprendido antes de llevarlo a casa.', x: '' },
    { k: 'comp', n: 'Planta de compostaje', c: '#d4a373', g: 'Producir', m2: 1440, p: 70, d: 'Vuelve abono los restos del mercado, la cocina y las huertas: pilas en hilera, lombrices, criba y bodega.', x: 'Cubierta de hojas curvas de 640 m² sobre 5 pilas: techo verde con flores, macetas colgantes, cajas nido y refugios de murciélagos. Lombricario de 4 camas, criba rotatoria, bodega de abono y composteras para enseñar. Unas 2 t de restos al día.' },
    { k: 'sol', n: 'Paneles solares', c: '#facc15', g: 'Energía', m2: 100, p: 0, d: '20 paneles sobre la cubierta con más sol: bombean el riego y enfrían la poscosecha.', x: '' }
  ];
  PROG.forEach(p => { p.a = p.m2 ? fmt(p.m2) + ' m²' : ''; });  const PK = Object.fromEntries(PROG.map(p => [p.k, p]));

  /* ---------- lugares (marco del modelo -> mundo) ---------- */
  const C_CAMPO = M(9478, 3066), C_PLAZA = M(9163, 2878); let C_COMP = M(9527, 3133);
  const ACC = [
    { k: 'A', n: 'Entrada A · Transversal 71B', d: 'Portería Tv. 71B n.º 9-01. Plaza de entrada y recepción del instituto.', p: M(9580, 2697) },
    { k: 'B', n: 'Entrada B · Calle 7A', d: 'Puerta barrial al mercado: se compra aunque el instituto esté cerrado.', p: M(9180, 2390) },
    { k: 'C', n: 'Entrada C · Av. Boyacá', d: 'Servicio: carga y descarga hacia poscosecha, el patio D2 y orgánicos.', p: M(8974, 3008) }
  ];
  const FA = { // módulos de fauna
    apiario: { n: 'Apiario inteligente', p: M(9660, 2990), c: '#fbbf24' }, abejorro: { n: 'Nidos de abejorro nativo', p: M(9514, 3212), c: '#facc15' },
    charca: { n: 'Charca didáctica', p: M(9550, 2893), c: '#60a5fa' },
    murc: [M(9694, 3060), M(9250, 3330), M(9480, 2772)], nidos: [M(9438, 2968), M(9520, 2950), M(9596, 3127), M(9420, 3120)],
    perchas: [M(9520, 3020), M(9600, 3020), M(9500, 3100)], hoteles: [M(9470, 3000), M(9554, 3086), M(9620, 2960)]
  };
  // pasajes nuevos (sintaxis) en el mundo
  const SEG = (SX && SX.seg) || [], PAS = SEG.filter(s => s.n).map(s => s.p.map(q => M(q[0], q[1])));

  /* ---------- materiales y utilidades ---------- */
  const mBasic = (c, o, ex = {}) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, toneMapped: false, ...ex });
  const mStd = (c, ex = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, ...ex });
  const lineas = (P, y, col, op = 1, cerrado = true, dash = 0) => { const a = []; const n = P.length; for (let i = 0; i < (cerrado ? n : n - 1); i++) { const p = P[i], q = P[(i + 1) % n]; a.push(p[0], y, p[1], q[0], y, q[1]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    const m = dash ? new THREE.LineDashedMaterial({ color: col, dashSize: dash, gapSize: dash * 0.7, transparent: true, opacity: op, depthWrite: false, toneMapped: false }) : new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, toneMapped: false });
    const l = new THREE.LineSegments(g, m); if (dash) l.computeLineDistances(); return l; };
  const losa = (P, y, mat) => { const s = new THREE.Shape(P.map(q => new THREE.Vector2(q[0], -q[1]))); const g = new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2); g.translate(0, y, 0); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m; };
  const unir = (gs) => { const P = [], N = []; for (const g0 of gs) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); return g; };
  const dentro = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const dSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz); };
  const distBorde = (P, x, z) => { let m = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) m = Math.min(m, dSeg(x, z, P[j], P[i])); return m; };
  const distPolilinea = (P, x, z) => { let m = 1e9; for (let i = 1; i < P.length; i++) m = Math.min(m, dSeg(x, z, P[i - 1], P[i])); return m; };
  const espectro = (t) => { // azul -> cian -> verde -> amarillo -> rojo (como DepthmapX)
    const S = [[0.16, 0.26, 0.72], [0.12, 0.65, 0.86], [0.24, 0.78, 0.36], [0.98, 0.84, 0.2], [0.92, 0.22, 0.16]], f = Math.max(0, Math.min(0.999, t)) * 4, i = Math.floor(f), k = f - i;
    return [0, 1, 2].map(j => S[i][j] + (S[i + 1][j] - S[i][j]) * k); };

  /* ---------- 1. edificios del programa: volumen de luz «tecnológico» (pisos, retícula y una banda de escaneo que sube) ---------- */
  const SHELL = [];
  const matShell = (col, h) => new THREE.ShaderMaterial({
    uniforms: { uT: TU, uC: { value: new THREE.Color(col) }, uH: { value: h }, uRise: { value: 0 }, uDim: { value: 1 } },
    vertexShader: 'uniform float uRise; varying vec3 vW; varying vec3 vN; void main(){ vec3 p=position; p.y=0.2+(p.y-0.2)*max(uRise,0.001); vec4 w=modelMatrix*vec4(p,1.); vW=w.xyz; vN=normal; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: 'uniform vec3 uC; uniform float uT,uH,uRise,uDim; varying vec3 vW; varying vec3 vN;\nvoid main(){ float piso=step(.9,fract(vW.y/3.6)); float ret=step(.94,fract((vW.x+vW.z)/6.)); float techo=step(.9,vN.y);\n float b=exp(-pow(vW.y-mod(uT*7.,uH+14.),2.)/5.);\n float a=.10+max(piso,ret*(1.-techo))*.32+b*.55+techo*(.12+.25*step(.9,fract(vW.x/6.))*step(.9,fract(vW.z/6.)));\n gl_FragColor=vec4(uC*(1.+b*.8),a*uDim*min(1.,uRise*1.5));' + COLSP + '}',
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false
  });
  const envolver = (i, p) => {
    const Wp = ED[i].W, h = ED[i].h, n = Wp.length, [cx, cz] = centro(Wp), Q = Wp.map(q => { const dx = q[0] - cx, dz = q[1] - cz, d = Math.hypot(dx, dz) || 1; return [q[0] + dx / d * 0.9, q[1] + dz / d * 0.9]; }), y0 = 0.2, y1 = h + 1.2;
    const P = [], N = [], I = [], L = [];
    for (let k = 0; k < n; k++) { const j = (k + 1) % n, b = P.length / 3, ex = Q[j][0] - Q[k][0], ez = Q[j][1] - Q[k][1], l = Math.hypot(ex, ez) || 1;
      for (const [q, y] of [[Q[k], y0], [Q[j], y0], [Q[j], y1], [Q[k], y1]]) { P.push(q[0], y, q[1]); N.push(ez / l, 0, -ex / l); } I.push(b, b + 1, b + 2, b, b + 2, b + 3);
      L.push(Q[k][0], y1, Q[k][1], Q[j][0], y1, Q[j][1], Q[k][0], y0, Q[k][1], Q[k][0], y1, Q[k][1]); }
    const bt = P.length / 3; for (const q of Q) { P.push(q[0], y1, q[1]); N.push(0, 1, 0); }
    let tri = []; try { tri = THREE.ShapeUtils.triangulateShape(Q.map(q => new THREE.Vector2(q[0], q[1])), []); } catch (e) {} for (const t of tri) I.push(bt + t[0], bt + t[1], bt + t[2]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
    const mat = matShell(p.c, y1), m = new THREE.Mesh(g, mat); m.renderOrder = 8;
    const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(L, 3)); const ml = new THREE.LineBasicMaterial({ color: p.c, transparent: true, opacity: 0, toneMapped: false }), li = new THREE.LineSegments(gl, ml); li.renderOrder = 9;
    const gr = new THREE.Group(); gr.add(m, li); grupo.add(gr);
    SHELL.push({ k: p.k, mat, ml, li, h: y1, c: [cx, cz], orden: SHELL.length });
  };
  PROG.forEach(p => { if (p.e !== undefined) envolver(p.e, p); });
  const POS = {}; PROG.forEach(p => { if (p.e !== undefined) { const c = centro(ED[p.e].W); POS[p.k] = [c[0], ED[p.e].h + 5, c[1]]; } });
  { const q = loc(C_CAMPO, 45, 15); POS.campo = [q[0], 9, q[1]]; } POS.comp = [C_COMP[0], 7, C_COMP[1]];

  /* ---------- 2. retiros D1 y D2 ---------- */
  const RET = [
    { k: 'D1', i: 27, n: 'D1 · Acceso al instituto', se: 'Caseta o anexo deteriorado que obstruye la conexión desde la portería de la Tv. 71B hacia el edificio en L.', pone: 'Plaza de entrada del distrito: bicicleteros, bancas, punto de información y encuentro para 24 estudiantes.' },
    { k: 'D2', i: 20, n: 'D2 · Patio de transferencia', se: 'Anexo liviano de contratistas o servicio con deterioro comprobado.', pone: 'Patio de transferencia y demostración: canastillas por la mañana, talleres de empaque y encuentros con productores después.' }
  ];
  RET.forEach(r => { const e = ED[r.i]; grupo.add(lineas(e.W, 0.6, '#ef4444', 1, true, 1.6), lineas(e.W, e.h, '#ef4444', 0.55, true, 1.6)); r.c = centro(e.W); r.h = e.h; });
  {
    const P = rect(C_PLAZA, 30, 18); grupo.add(losa(P, 0.35, mStd('#cfc8bb', { roughness: 0.9 })), lineas(P, 0.4, '#fbbf24', 0.8));
    const bancas = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 0.45, 0.6), mStd('#8a6a48'), 6), bici = new THREE.InstancedMesh(new THREE.TorusGeometry(0.42, 0.05, 6, 16, Math.PI), mStd('#9ca3af', { metalness: 0.6, roughness: 0.4 }), 10), o = new THREE.Object3D();
    for (let i = 0; i < 6; i++) { const q = loc(C_PLAZA, -11 + i * 4.4, 6.5); o.position.set(q[0], 0.6, q[1]); o.rotation.set(0, -ANG, 0); o.updateMatrix(); bancas.setMatrixAt(i, o.matrix); }
    for (let i = 0; i < 10; i++) { const q = loc(C_PLAZA, -12 + i * 1.1, -7); o.position.set(q[0], 0.35, q[1]); o.rotation.set(0, -ANG + Math.PI / 2, 0); o.updateMatrix(); bici.setMatrixAt(i, o.matrix); }
    grupo.add(bancas, bici);
  }
  const C_D2 = centro(ED[20].W);
  {
    const P = rect(C_D2, 46, 20); grupo.add(losa(P, 0.32, mStd('#bdb6aa', { roughness: 0.95 })), lineas(P, 0.38, '#ef4444', 0.5));
    const can = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.3, 0.4), mStd('#22c55e', { roughness: 0.6 }), 36), o = new THREE.Object3D(); let k = 0;
    for (let s = 0; s < 6; s++) for (let a = 0; a < 6; a++) { const q = loc(C_D2, -15 + s * 1.4, -5 + (a % 2) * 0.7); o.position.set(q[0], 0.5 + Math.floor(a / 2) * 0.32, q[1]); o.rotation.set(0, -ANG, 0); o.updateMatrix(); can.setMatrixAt(k++, o.matrix); }
    grupo.add(can);
  }

  /* ---------- 3. HUERTAS DE ENSEÑANZA + 4. PLANTA DE COMPOSTAJE (grupo gHu: se ven siempre con la propuesta, verHuertas) ----------
     Rejilla de 7,5 m PARALELA a los edificios (ANG), en TODOS los claros del predio: celdas sin copa de árbol encima, a 20 m o más
     de los edificios, a 7 m o más de los pasajes y a 12 m del borde. Cada claro es una huerta de un tipo distinto, con su aula al
     aire libre en la celda más cercana a su pasaje. Árboles frutales con los modelos 3D de árbol del simulador y plantas medicinales
     con modelos escaneados (data3d/models); hortalizas con hojas curvas texturizadas y fruta real. */
  const gHu = new THREE.Group(); gHu.name = 'bavaria_huertas'; gHu.visible = false; T3.scene.add(gHu);
  const S = 7.5, LB = 5.4; // celda y largo de bancal
  const CULT = {
    lechuga: { c: '#86c44c', c2: '#a7d86a', paso: 0.3, fil: 2 }, morada: { c: '#7a3b52', c2: '#9b5a5f', paso: 0.3, fil: 2 },
    acelga: { c: '#2f6b2a', c2: '#3f7f30', paso: 0.38, fil: 2 }, cilantro: { c: '#5fae3a', c2: '#7cc455', paso: 0.18, fil: 3 },
    repollo: { c: '#6f9a86', c2: '#89b39d', paso: 0.45, fil: 2 }, cebolla: { c: '#7fae5a', c2: '#9cc275', paso: 0.15, fil: 3 },
    zanahoria: { c: '#4f8f34', c2: '#5fa03e', paso: 0.12, fil: 3 }, kale: { c: '#3d5f4a', c2: '#4b6f55', paso: 0.4, fil: 2 },
    fresa: { c: '#3d7a35', c2: '#4a8a3a', paso: 0.3, fil: 2, fr: '#c8232c' }, flores: { c: '#a855f7', c2: '#facc15', pal: ['#a855f7', '#facc15', '#f97316', '#f8fafc', '#ec4899', '#60a5fa'], paso: 0.26, fil: 3 },
    tomate: { c: '#3f6f2c', c2: '#4b7f34', paso: 0.5, fil: 2, fr: '#d0261c' }, uchuva: { c: '#4f7d36', c2: '#5d8c3e', paso: 0.8, fil: 1, fr: '#f19a1a' },
    mora: { c: '#355f2a', c2: '#2f5626', paso: 0.7, fil: 1, fr: '#3a0d2a' }, maiz: { c: '#5b8a2f', c2: '#6c9a38', paso: 0.35, fil: 2, fr: '#e6c04a' },
    ahuyama: { c: '#3f7533', c2: '#4b8338', paso: 1.1, fil: 1, fr: '#de7a1e' }, lavanda: { c: '#7d8f73', c2: '#8a9b80', paso: 0.36, fil: 2, fr: '#8b6bd6' },
    aromatica: { c: '#4f7f45', c2: '#6b9a5a', paso: 0.25, fil: 3 }, nada: null
  };
  const SITIO = D.sitio.map(W), ARBW = (ARB || []).map(a => [...W(a), Math.max(2.5, a[3] || 4)]);
  { const P = T3.trees && T3.trees.pos; if (P) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of SITIO) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
      for (let i = 0; i < P.X.length; i++) if (P.X[i] > x0 && P.X[i] < x1 && P.Z[i] > z0 && P.Z[i] < z1) ARBW.push([P.X[i], P.Z[i], Math.max(2.5, (P.Hh[i] || 8) * 0.32)]); } }
  const ocupa = new Map(); for (const a of ARBW) { const k = Math.round(a[0] / 12) + '_' + Math.round(a[1] / 12); if (!ocupa.has(k)) ocupa.set(k, []); ocupa.get(k).push(a); }
  const arbolCerca = (x, z, m) => { for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const a of ocupa.get((Math.round(x / 12) + dx) + '_' + (Math.round(z / 12) + dz)) || []) if (Math.hypot(a[0] - x, a[1] - z) < m + a[2]) return true; return false; };
  const lejosEdif = (x, z, d) => !ED.some((e, k) => k !== 20 && k !== 27 && (dentro(e.W, x, z) || distBorde(e.W, x, z) < d));
  const PUNTOS_FAUNA = [[FA.apiario.p, 13], [FA.abejorro.p, 8], [FA.charca.p, 22], ...FA.murc.map(p => [p, 5]), ...FA.nidos.map(p => [p, 5]), ...FA.perchas.map(p => [p, 5]), ...FA.hoteles.map(p => [p, 6])];
  const pasajeCerca = (c) => { let m = [1e9, null]; for (const P of PAS) for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dz) / L2)), q = [a[0] + t * dx, a[1] + t * dz], d = Math.hypot(q[0] - c[0], q[1] - c[1]); if (d < m[0]) m = [d, q]; } return m; };
  /* --- planta de compostaje: rectángulo de 48 x 30 m en el claro más cercano a la entrada de servicio (C, Av. Boyacá) --- */
  const CL = 48, CW = 30;
  const C_PLANTA = (() => { let best = null; const ref = ACC[2].p;
    for (let i = -60; i <= 60; i++) for (let j = -60; j <= 60; j++) { const c = loc(C_CAMPO, i * 5, j * 5); if (!dentro(SITIO, c[0], c[1]) || distBorde(SITIO, c[0], c[1]) < 26) continue;
      let ok = true; for (let a = -1; a <= 1 && ok; a += 0.5) for (let b = -1; b <= 1 && ok; b += 0.5) { const q = loc(c, a * CL / 2, b * CW / 2); if (arbolCerca(q[0], q[1], 1.5) || !lejosEdif(q[0], q[1], 10) || PAS.some(P => distPolilinea(P, q[0], q[1]) < 5) || PUNTOS_FAUNA.some(([p, r]) => Math.hypot(p[0] - q[0], p[1] - q[1]) < r)) ok = false; }
      if (!ok) continue; const d = Math.hypot(c[0] - ref[0], c[1] - ref[1]); if (!best || d < best[0]) best = [d, c]; }
    return best ? best[1] : C_COMP; })();
  C_COMP = C_PLANTA;
  const enPlanta = (x, z) => { const dx = x - C_PLANTA[0], dz = z - C_PLANTA[1], u = dx * CU + dz * SU, v = -dx * SU + dz * CU; return Math.abs(u) < CL / 2 + 10 && Math.abs(v) < CW / 2 + 10; };
  /* --- celdas libres --- */
  const LIB = new Map();
  for (let i = -90; i < 90; i++) for (let j = -90; j < 90; j++) { const u = (i + 0.5) * S, v = (j + 0.5) * S, c = loc(C_CAMPO, u, v);
    if (!dentro(SITIO, c[0], c[1]) || distBorde(SITIO, c[0], c[1]) < 12 || !lejosEdif(c[0], c[1], 20) || arbolCerca(c[0], c[1], 5.6) || enPlanta(c[0], c[1])) continue;
    if (PAS.some(P => distPolilinea(P, c[0], c[1]) < 7) || PUNTOS_FAUNA.some(([p, r]) => Math.hypot(p[0] - c[0], p[1] - c[1]) < r + 5)) continue;
    LIB.set(i + '_' + j, { i, j, u, v, c }); }
  const COMP = []; { const vis = new Set(); for (const [k, x] of LIB) { if (vis.has(k)) continue; const pila = [x], L = []; vis.add(k);
      while (pila.length) { const a = pila.pop(); L.push(a); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const kk = (a.i + di) + '_' + (a.j + dj); if (LIB.has(kk) && !vis.has(kk)) { vis.add(kk); pila.push(LIB.get(kk)); } } }
      if (L.length >= 4) COMP.push(L); } }
  COMP.sort((a, b) => b.length - a.length);
  const TIPOS = [
    { k: 'hort', n: 'Huerta docente de hortalizas', c: '#86efac', d: 'Camas elevadas de lechuga, acelga, kale, zanahoria, cebolla y cilantro, y los cuatro módulos del ensayo A-D. Aquí se aprende a sembrar, regar y cosechar.', rec: ['camas'] },
    { k: 'frut', n: 'Huerto de frutales', c: '#fca5a5', d: 'Tomate de árbol, feijoa y lulo entre camas de fresa, uchuva y mora: se poda, se injerta y se cosecha la fruta.', rec: ['arboles', 'frutal', 'frutal'] },
    { k: 'med', n: 'Huerta medicinal y sensorial', c: '#c4b5fd', d: 'Ortiga, celidonia, helechos, aromáticas y una espiral de hierbas: se toca, se huele y se aprende para qué sirve cada planta.', rec: ['medic', 'medic', 'espiral', 'arom'] },
    { k: 'inv', n: 'Invernaderos de tomate', c: '#fda4af', d: 'Tomate en tutores bajo túnel, riego por goteo y abejorro nativo como polinizador.', rec: ['tomate'] },
    { k: 'bosq', n: 'Bosque comestible', c: '#a3e635', d: 'Tres pisos de cultivo como en el monte: frutales arriba, arbustos de bayas en medio y aromáticas cubriendo el suelo.', rec: ['bosque', 'frutal', 'bosque', 'arom'] },
    { k: 'col', n: 'Parcelas de los colegios', c: '#7dd3fc', d: 'Cada colegio de Kennedy tiene su parcela con letrero: siembra en una visita y cosecha en la siguiente.', rec: ['colegio'] },
    { k: 'semi', n: 'Semillero y vivero', c: '#fde68a', d: 'Plántulas bajo túnel para las huertas de Bavaria, de los parques y de las casas: aquí se lleva cada vecino su bandeja.', rec: ['semillero', 'flores'] },
    { k: 'hidro', n: 'Hidroponía demostrativa', c: '#99f6e4', d: 'Mesas de tubos con lechuga sin tierra: lo mismo que se instala en terrazas y balcones de Kennedy.', rec: ['hidro', 'hidro', 'camas'] },
    { k: 'milpa', n: 'Milpa: maíz, fríjol y ahuyama', c: '#fcd34d', d: 'El policultivo andino: el maíz da tutor al fríjol, el fríjol abona y la ahuyama cubre el suelo.', rec: ['milpa'] },
    { k: 'poli', n: 'Jardín de polinizadores', c: '#f0abfc', d: 'Flores nativas en franjas que alimentan abejas, abejorros, colibríes y mariposas de todas las huertas.', rec: ['flores', 'flores', 'arom'] }
  ];
  const RECETA = {
    camas: (r) => { const L = ['lechuga', 'morada', 'acelga', 'cilantro', 'repollo', 'cebolla', 'zanahoria', 'kale']; return [0, 1, 2].map(() => L[Math.floor(r() * L.length)]); },
    colegio: (r) => { const L = ['lechuga', 'zanahoria', 'fresa', 'cilantro', 'acelga', 'flores']; return [0, 1, 2].map(() => L[Math.floor(r() * L.length)]); },
    arom: () => ['lavanda', 'aromatica', 'aromatica'], flores: () => ['flores', 'flores', 'flores'], frutal: (r) => [['fresa', 'uchuva', 'mora'], ['fresa', 'fresa', 'uchuva'], ['mora', 'fresa', 'uchuva']][Math.floor(r() * 3)],
    milpa: () => ['maiz', 'ahuyama', 'maiz'], tomate: () => ['tomate', 'tomate', 'tomate'], semillero: () => ['lechuga', 'kale', 'cilantro']
  };
  const MODS = [
    { k: 'A', n: 'A · Bajo cubierta', inv: true, cul: ['lechuga'], q: '¿Cuánta agua y tiempo para una caja de lechuga?' }, { k: 'B', n: 'B · Con bioinsumos', inv: true, cul: ['lechuga'], q: '¿El abono biológico cambia la cosecha?' },
    { k: 'C', n: 'C · Al aire libre', inv: false, cul: ['lechuga'], q: '¿Qué cambia frente al módulo A?' }, { k: 'D', n: 'D · Por pedido', inv: false, cul: ['acelga', 'cilantro', 'acelga'], q: '¿Cuánto sembrar para un pedido real?' }
  ];
  const ZONAS = [], CEL = [];
  { let sem = 11; const rnd = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
    COMP.forEach((L, zi) => { const T = TIPOS[zi % TIPOS.length], cel = L.map(x => ({ ...x, dp: pasajeCerca(x.c) })).sort((a, b) => a.dp[0] - b.dp[0]);
      const Z = { k: 'Z' + (zi + 1), n: T.n, c: null, d: T.d, col: T.c, tipoZ: T.k, aula: cel[0] }; let n = 0;
      cel.forEach((x, xi) => { let tipo = x === Z.aula && L.length >= 6 ? 'aula' : T.rec[n++ % T.rec.length], doc = null;
        if (zi === 0 && xi >= 1 && xi <= 4) { doc = MODS[xi - 1]; tipo = 'doc'; doc.c = x.c; }
        const cul = doc ? [0, 1, 2].map(b => doc.cul[b % doc.cul.length]) : RECETA[tipo] ? RECETA[tipo](rnd) : null;
        CEL.push({ c: x.c, u: x.u, v: x.v, z: Z.k, zi, tipo, cul, col: T.c, flor: tipo === 'flores' || tipo === 'espiral' || tipo === 'arom', inv: doc ? doc.inv : tipo === 'tomate' || tipo === 'semillero', doc: doc ? doc.k : null }); });
      let cx = 0, cz = 0; for (const x of L) { cx += x.c[0]; cz += x.c[1]; } Z.c = [cx / L.length, cz / L.length]; Z.ha = L.length * S * S / 1e4;  ZONAS.push(Z); }); }
  const TIPOS_H = TIPOS.map(T => { const zs = ZONAS.filter(z => z.tipoZ === T.k); return zs.length ? { n: T.n, col: T.c, d: T.d, n2: zs.length, ha: zs.reduce((a, z) => a + z.ha, 0), z: zs[0].k } : null; }).filter(Boolean);
  const HA = CEL.length * S * S / 1e4, NFLOR = CEL.filter(c => c.flor).length, CAMAS_CEL = CEL.filter(c => c.cul);
  const C_DOC = MODS[0].c ? [(MODS[0].c[0] + MODS[3].c[0]) / 2, (MODS[0].c[1] + MODS[3].c[1]) / 2] : C_CAMPO;
  PK.campo.a = HA.toFixed(1).replace('.', ',') + ' ha'; PK.campo.m2 = Math.round(HA * 1e4);
  { const z0 = ZONAS[0]; POS.campo = z0 ? [z0.c[0], 9, z0.c[1]] : POS.campo; } POS.comp = [C_PLANTA[0], 10, C_PLANTA[1]];
  /* --- texturas: hojas con su color real (gradiente, nervadura y moteado) --- */
  const texCama = (k) => { const C = CULT[k], cv = document.createElement('canvas'); cv.width = 64; cv.height = 512; const g = cv.getContext('2d');
    g.fillStyle = '#3f2e22'; g.fillRect(0, 0, 64, 512); for (let n = 0; n < 1600; n++) { g.fillStyle = `rgba(${30 + Math.random() * 40},${20 + Math.random() * 25},${12 + Math.random() * 15},.55)`; g.fillRect(Math.random() * 64, Math.random() * 512, 2, 2); }
    for (let n = 0; n < 220; n++) { g.strokeStyle = `rgba(${190 + Math.random() * 40},${160 + Math.random() * 30},90,.45)`; g.lineWidth = 1; const x = Math.random() * 64, y = Math.random() * 512, a = Math.random() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); g.stroke(); }
    if (C) { const filas = C.fil, pas = Math.max(6, C.paso / LB * 512); for (let f = 0; f < filas; f++) { const x = (f + 0.5) * 64 / filas; for (let y = pas / 2; y < 512; y += pas) { const r = Math.min(64 / filas, pas) * 0.42 * (0.8 + Math.random() * 0.35);
      g.fillStyle = C.pal ? '#3f7a35' : (Math.random() < 0.5 ? C.c : C.c2); g.beginPath(); g.ellipse(x + (Math.random() - 0.5) * 2, y, r, r, 0, 0, 7); g.fill(); } } }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const sombra = (h, f) => { const c = new THREE.Color(h); c.multiplyScalar(f); return '#' + c.getHexString(); };
  const texHoja = (tipo, col) => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); g.clearRect(0, 0, 256, 256);
    const cl = sombra(col, 1.25), cd = sombra(col, 0.62), ve = sombra(col, 1.55);
    const gr = (y0, y1) => { const q = g.createLinearGradient(0, y0, 0, y1); q.addColorStop(0, cl); q.addColorStop(0.55, col); q.addColorStop(1, cd); return q; };
    const mota = () => { g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.06)'; g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2 + Math.random() * 3); } g.globalCompositeOperation = 'source-over'; };
    if (tipo === 'rizada' || tipo === 'lisa') { g.fillStyle = gr(20, 250); g.beginPath();
      for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2, rr = 1 + (tipo === 'rizada' ? 0.08 * Math.sin(a * 26) + 0.05 * Math.sin(a * 11) : 0.015 * Math.sin(a * 5)); g.lineTo(128 + Math.sin(a) * 100 * rr, 140 - Math.cos(a) * 112 * rr); }
      g.fill(); mota(); g.strokeStyle = ve; g.globalAlpha = 0.75; g.lineWidth = tipo === 'lisa' ? 8 : 5; g.beginPath(); g.moveTo(128, 254); g.lineTo(128, 36); g.stroke(); g.lineWidth = 1.8;
      for (let k = 0; k < 8; k++) { const y = 228 - k * 24; g.beginPath(); g.moveTo(128, y); g.quadraticCurveTo(162, y - 16, 210, y - 30); g.moveTo(128, y); g.quadraticCurveTo(94, y - 16, 46, y - 30); g.stroke(); } g.globalAlpha = 1; }
    if (tipo === 'fina') { for (let k = 0; k < 11; k++) { const a = -1.3 + k * 0.26, x = 128 + Math.sin(a) * 74, y = 150 - Math.cos(a) * 86; g.fillStyle = k % 2 ? col : cl; g.beginPath(); g.ellipse(x, y, 24, 15, a, 0, 7); g.fill(); g.strokeStyle = cd; g.lineWidth = 3; g.beginPath(); g.moveTo(128, 252); g.lineTo(x, y); g.stroke(); } mota(); }
    if (tipo === 'tira' || tipo === 'larga') { const xs = tipo === 'tira' ? [-30, 0, 30] : [0]; for (const dx of xs) { g.fillStyle = gr(0, 256); g.beginPath(); g.moveTo(128 + dx - (tipo === 'larga' ? 22 : 9), 256); g.quadraticCurveTo(128 + dx - 6, 110, 128 + dx * 1.5, 2); g.quadraticCurveTo(128 + dx + 6, 110, 128 + dx + (tipo === 'larga' ? 22 : 9), 256); g.fill(); } mota();
      g.strokeStyle = ve; g.globalAlpha = 0.6; g.lineWidth = 2; for (const dx of xs) { g.beginPath(); g.moveTo(128 + dx, 256); g.lineTo(128 + dx * 1.45, 10); g.stroke(); } g.globalAlpha = 1; }
    if (tipo === 'trebol') { g.fillStyle = gr(30, 250); for (const a of [-0.9, 0, 0.9]) { g.save(); g.translate(128, 200); g.rotate(a); g.beginPath(); for (let i = 0; i <= 50; i++) { const t2 = i / 50 * Math.PI * 2, rr = 1 + 0.07 * Math.sin(t2 * 16); g.lineTo(Math.sin(t2) * 42 * rr, -95 - Math.cos(t2) * 58 * rr); } g.fill(); g.restore(); } mota(); }
    if (tipo === 'flor') { g.fillStyle = '#f2f2f2'; for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; g.beginPath(); g.ellipse(128 + Math.cos(a) * 62, 128 + Math.sin(a) * 62, 40, 16, a, 0, 7); g.fill(); } g.fillStyle = '#6a5a2a'; g.beginPath(); g.arc(128, 128, 36, 0, 7); g.fill(); }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx; };
  const unirUV = (gs) => { const P = [], N = [], U = []; for (const g0 of gs) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); if (g.attributes.uv) U.push(...g.attributes.uv.array); else for (let i = 0; i < g.attributes.position.count; i++) U.push(0.5, 0.5); }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); return G; };
  // hoja CURVA: plano de 1 x 4 segmentos que se arquea hacia afuera (no tarjetas planas)
  const hoja = (a, l, curva = 0.35) => { const p = new THREE.PlaneGeometry(a, l, 2, 5); p.translate(0, l / 2, 0); const P = p.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i) / l, x = P.getX(i) / a; P.setZ(i, curva * l * y * y + Math.abs(x) * a * 0.25); } return p; };
  const roseta = (n, l, a, inc, alto = 0, giro = 0, curva = 0.35) => unirUV(Array.from({ length: n }, (_, i) => { const p = hoja(a * (0.85 + (i % 3) * 0.1), l * (0.8 + (i % 4) * 0.08), curva); p.rotateX(-(inc + (i % 2) * 0.16)); p.rotateY(i / n * Math.PI * 2 + (i % 3) * 0.4 + giro); p.translate(0, alto, 0); return p; }));
  const tallo = (h, r = 0.008) => new THREE.CylinderGeometry(r * 0.7, r, h, 5).translate(0, h / 2, 0);
  const fruto = (pts, f) => unirUV(pts.map(p => f().translate(p[0], p[1], p[2])));
  const anillo = (n, r, y0, y1, s = 1) => Array.from({ length: n }, (_, i) => { const a = i * 2.39996 * s, rr = r * (0.55 + 0.45 * ((i * 0.618) % 1)); return [Math.cos(a) * rr, y0 + (y1 - y0) * ((i * 0.37) % 1), Math.sin(a) * rr]; });
  const ahuyamaG = () => { const g = new THREE.SphereGeometry(1, 20, 12), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.07 * Math.cos(Math.atan2(z, x) * 9); p.setXYZ(i, x * k * 0.24, y * 0.15, z * k * 0.24); } g.computeVertexNormals(); return g.translate(0, 0.13, 0); };
  const GEO = {
    lechuga: roseta(14, 0.17, 0.16, 1.0, 0, 0, 0.45), morada: roseta(14, 0.16, 0.15, 0.95, 0, 0, 0.45), repollo: unirUV([roseta(10, 0.22, 0.22, 1.2, 0, 0, 0.5), new THREE.SphereGeometry(0.1, 12, 9).scale(1, 0.85, 1).translate(0, 0.09, 0)]),
    acelga: roseta(8, 0.34, 0.15, 0.32, 0, 0, 0.25), kale: roseta(9, 0.32, 0.13, 0.5, 0, 0, 0.4), cilantro: roseta(10, 0.17, 0.13, 0.55), cebolla: roseta(6, 0.36, 0.05, 0.1, 0, 0, 0.15), zanahoria: roseta(9, 0.24, 0.1, 0.35),
    fresa: roseta(8, 0.15, 0.13, 0.85),
    flores: unirUV([roseta(6, 0.18, 0.07, 0.7), tallo(0.42, 0.006), new THREE.PlaneGeometry(0.11, 0.11).rotateX(-Math.PI / 2).translate(0, 0.43, 0)]),
    tomate: unirUV([tallo(1.55, 0.012), ...[0.15, 0.4, 0.65, 0.9, 1.15, 1.38].map((h, i) => roseta(5, 0.24, 0.17, 1.1 - i * 0.07, h, i * 0.7))]),
    uchuva: unirUV([tallo(0.9, 0.012), ...[0.2, 0.42, 0.62, 0.82].map((h, i) => roseta(7, 0.2, 0.16, 1.2, h, i * 0.5))]),
    mora: unirUV([...[0, 1.2, 2.4, 3.6, 4.8].map(a => new THREE.TorusGeometry(0.55, 0.008, 3, 10, Math.PI * 0.8).rotateY(a).translate(0, 0.05, 0)), ...[0.3, 0.55, 0.8].map((h, i) => roseta(9, 0.13, 0.12, 1.35, h, i))]),
    maiz: unirUV([tallo(2.1, 0.018), ...[0.3, 0.6, 0.9, 1.2, 1.5, 1.8].map((h, i) => roseta(2, 0.75, 0.09, 0.9, h, i * 1.1, 0.6)), roseta(6, 0.25, 0.02, 0.35, 2.05)]),
    ahuyama: unirUV([roseta(7, 0.42, 0.4, 1.3, 0.02), roseta(5, 0.3, 0.3, 1.05, 0.12, 0.6)]),
    lavanda: unirUV([roseta(16, 0.22, 0.03, 0.45)]), aromatica: unirUV([roseta(10, 0.16, 0.12, 0.7), roseta(8, 0.12, 0.1, 0.5, 0.1, 0.4)])
  };
  const HOJA = { lechuga: 'rizada', morada: 'rizada', repollo: 'lisa', acelga: 'lisa', kale: 'rizada', cilantro: 'fina', cebolla: 'tira', zanahoria: 'fina', fresa: 'trebol', flores: 'flor', tomate: 'fina', uchuva: 'lisa', mora: 'trebol', maiz: 'larga', ahuyama: 'lisa', lavanda: 'tira', aromatica: 'fina' };
  const FRUTO = {
    fresa: fruto(anillo(6, 0.16, 0.02, 0.06), () => new THREE.ConeGeometry(0.022, 0.042, 8).rotateX(Math.PI)),
    tomate: fruto(anillo(11, 0.2, 0.35, 1.3), () => new THREE.SphereGeometry(0.04, 10, 7).scale(1, 0.86, 1)),
    uchuva: fruto(anillo(12, 0.22, 0.25, 0.85), () => new THREE.SphereGeometry(0.02, 8, 6)),
    mora: fruto(anillo(16, 0.4, 0.3, 0.8), () => new THREE.SphereGeometry(0.016, 6, 5).scale(1, 1.25, 1)),
    maiz: fruto([[0.05, 1.0, 0], [-0.04, 1.25, 0.03]], () => new THREE.SphereGeometry(1, 8, 6).scale(0.035, 0.11, 0.035).rotateZ(0.35)),
    ahuyama: fruto([[0.25, 0, 0.1]], ahuyamaG), zanahoria: fruto([[0, 0.01, 0]], () => new THREE.ConeGeometry(0.03, 0.05, 8).translate(0, 0.02, 0)),
    lavanda: fruto(anillo(10, 0.1, 0.25, 0.32), () => new THREE.CylinderGeometry(0.012, 0.006, 0.09, 5))
  };
  const MATP = {}; for (const k in HOJA) MATP[k] = new THREE.MeshStandardMaterial({ color: '#ffffff', map: texHoja(HOJA[k], k === 'flores' ? '#ffffff' : CULT[k].c), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.62 });
  const lienzoT = (w, h, f, rx = 1, ry = 1) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(rx, ry); tx.anisotropy = 8; return tx; };
  const texTabla = lienzoT(128, 512, (g, w, h) => { g.fillStyle = '#7d5a3a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 64) { g.fillStyle = `rgb(${110 + Math.random() * 30},${78 + Math.random() * 20},${48 + Math.random() * 15})`; g.fillRect(0, y + 2, w, 60); g.fillStyle = 'rgba(40,25,12,.55)'; g.fillRect(0, y, w, 3); }
    for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${60 + Math.random() * 30},${40 + Math.random() * 20},20,.35)`; g.lineWidth = 1; const y = Math.random() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(40, y + 3, 90, y - 3, w, y + (Math.random() - 0.5) * 4); g.stroke(); } }, 1, 1);
  const texViruta = lienzoT(256, 256, (g, w, h) => { g.fillStyle = '#8a6a48'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { const v = Math.random(); g.fillStyle = v < 0.4 ? 'rgba(70,48,28,.65)' : v < 0.8 ? 'rgba(170,135,92,.6)' : 'rgba(205,180,140,.6)'; g.save(); g.translate(Math.random() * w, Math.random() * h); g.rotate(Math.random() * 3); g.fillRect(0, 0, 3 + Math.random() * 7, 1.2 + Math.random() * 1.8); g.restore(); } }, 3, 3);
  const texGrava = lienzoT(256, 256, (g, w, h) => { g.fillStyle = '#9a9283'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { const v = 115 + Math.random() * 80; g.fillStyle = `rgba(${v},${v - 6},${v - 16},.8)`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.2, 1 + Math.random() * 1.6, Math.random() * 3, 0, 7); g.fill(); } }, 2, 2);
  const texCompost = lienzoT(256, 256, (g, w, h) => { g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? 'rgba(20,14,8,.6)' : v < 0.85 ? 'rgba(92,68,44,.55)' : 'rgba(176,150,96,.6)'; g.save(); g.translate(Math.random() * w, Math.random() * h); g.rotate(Math.random() * 3); g.fillRect(0, 0, 2 + Math.random() * 6, 1 + Math.random() * 1.5); g.restore(); } }, 4, 2);
  const texConc = lienzoT(256, 256, (g, w, h) => { g.fillStyle = '#a8a397'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { const v = 140 + Math.random() * 60; g.fillStyle = `rgba(${v},${v - 4},${v - 12},.35)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.strokeStyle = 'rgba(60,58,52,.5)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); }, 8, 5);
  const o3 = new THREE.Object3D();
  const instancias = (geo, mat, L, f, sh = !MOV, dest = gHu) => { const im = new THREE.InstancedMesh(geo, mat, Math.max(1, L.length)); im.count = L.length; L.forEach((x, k) => { f(x, o3); o3.updateMatrix(); im.setMatrixAt(k, o3.matrix); o3.scale.set(1, 1, 1); o3.rotation.set(0, 0, 0); }); im.castShadow = sh; im.receiveShadow = true; dest.add(im); return im; };
  const enCel = (c, u, v, y, o, giro = 0) => { const q = loc(c.c || c, u, v); o.position.set(q[0], y, q[1]); o.rotation.set(0, -ANG + giro, 0); };
  const Y0 = 0.22, BU = [-2.5, 0, 2.5]; // piso y posición de los 3 bancales de cada celda
  {
    const vir = CEL.filter(c => !['aula', 'espiral', 'arboles', 'bosque', 'medic'].includes(c.tipo)), gra = CEL.filter(c => c.tipo === 'aula' || c.tipo === 'espiral'), pasto = CEL.filter(c => ['arboles', 'bosque', 'medic'].includes(c.tipo));
    instancias(new THREE.PlaneGeometry(S - 0.2, S - 0.2).rotateX(-Math.PI / 2), mStd('#ffffff', { map: texViruta, roughness: 1 }), vir, (c, o) => enCel(c, 0, 0, Y0, o), false);
    instancias(new THREE.PlaneGeometry(S - 0.2, S - 0.2).rotateX(-Math.PI / 2), mStd('#ffffff', { map: texGrava, roughness: 1 }), gra, (c, o) => enCel(c, 0, 0, Y0, o), false);
    instancias(new THREE.PlaneGeometry(S - 0.2, S - 0.2).rotateX(-Math.PI / 2), mStd('#ffffff', { map: texViruta, color: '#a99a7c', roughness: 1 }), pasto, (c, o) => enCel(c, 0, 0, Y0, o), false);
    // bancales de tablas con tierra y riego
    const CAMAS = []; CAMAS_CEL.filter(c => c.tipo !== 'hidro').forEach(c => { c.camas = BU.map((u, b) => ({ q: loc(c.c, u, 0), k: c.cul[b] })); c.camas.forEach(cm => CAMAS.push([c, cm])); });
    instancias(new THREE.BoxGeometry(1.25, 0.42, LB + 0.2).translate(0, 0.21, 0), mStd('#ffffff', { map: texTabla, roughness: 0.9 }), CAMAS, ([c, cm], o) => { const q = cm.q; o.position.set(q[0], Y0, q[1]); o.rotation.set(0, -ANG, 0); });
    const porK = {}; for (const x of CAMAS) (porK[x[1].k] = porK[x[1].k] || []).push(x);
    for (const k in porK) if (CULT[k]) instancias(new THREE.PlaneGeometry(1.1, LB).rotateX(-Math.PI / 2), mStd('#ffffff', { map: texCama(k), roughness: 0.95 }), porK[k], ([c, cm], o) => { o.position.set(cm.q[0], Y0 + 0.43, cm.q[1]); o.rotation.set(0, -ANG, 0); }, false);
    instancias(new THREE.CylinderGeometry(0.008, 0.008, LB, 4).rotateX(Math.PI / 2), mStd('#111827', { roughness: 0.6 }), CAMAS.flatMap(x => [[x, -0.25], [x, 0.25]]), ([[c, cm], d], o) => { const q = loc(cm.q, d, 0); o.position.set(q[0], Y0 + 0.46, q[1]); o.rotation.set(0, -ANG, 0); }, false);
    // invernaderos de túnel (tomate, semillero y módulos A-B) del tamaño de la celda
    const INV = CEL.filter(c => c.inv);
    if (INV.length) { const R = S / 2 - 0.15, piel = [], cost = [];
      { const p = new THREE.CylinderGeometry(R, R, S - 0.3, 18, 1, true, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2); p.scale(1, 0.78, 1); piel.push(p); for (const e of [-(S - 0.3) / 2, (S - 0.3) / 2]) { const t = new THREE.CircleGeometry(R, 18, 0, Math.PI); t.scale(1, 0.78, 1); t.translate(0, 0, e); piel.push(t); }
        for (let z = -(S - 0.3) / 2; z <= (S - 0.3) / 2 + 0.01; z += (S - 0.3) / 5) { const r = new THREE.TorusGeometry(R, 0.035, 4, 18, Math.PI); r.scale(1, 0.78, 1); r.translate(0, 0, z); cost.push(r); } }
      const mP = new THREE.MeshStandardMaterial({ color: '#f1f7f4', roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
      const iP = instancias(unir(piel), mP, INV, (c, o) => enCel(c, 0, 0, Y0, o), false); iP.renderOrder = 7;
      instancias(unir(cost), mStd('#cbd2d6', { metalness: 0.6, roughness: 0.35 }), INV, (c, o) => enCel(c, 0, 0, Y0, o));
      const tom = CEL.filter(c => c.tipo === 'tomate'), tut = []; for (const c of tom) for (const u of BU) for (let s = -2.4; s <= 2.45; s += 0.8) tut.push([c, u, s]);
      instancias(new THREE.CylinderGeometry(0.012, 0.016, 1.7, 4).translate(0, 0.85, 0), mStd('#8a6a48'), tut, ([c, u, v], o) => enCel(c, u, v, Y0 + 0.42, o), false); }
    // hidroponía: mesas con 4 tubos blancos y lechugas sembradas en los huecos
    const HID = CEL.filter(c => c.tipo === 'hidro');
    if (HID.length) { const mesas = HID.flatMap(c => [[c, -1.6], [c, 1.6]]), lech = [];
      for (const [c, u] of mesas) for (const du of [-0.45, -0.15, 0.15, 0.45]) for (let s = -2.5; s <= 2.51; s += 0.25) lech.push([c, u + du, s]);
      instancias(unir([new THREE.BoxGeometry(1.4, 0.05, 6).translate(0, 0.78, 0), ...[-0.65, 0.65].flatMap(x => [-2.8, 0, 2.8].map(z => new THREE.BoxGeometry(0.05, 0.78, 0.05).translate(x, 0.39, z)))]), mStd('#9aa3a8', { metalness: 0.6, roughness: 0.4 }), mesas, ([c, u], o) => enCel(c, u, 0, Y0, o));
      instancias(unir([-0.45, -0.15, 0.15, 0.45].map(x => new THREE.CylinderGeometry(0.055, 0.055, 6, 10).rotateX(Math.PI / 2).translate(x, 0.86, 0))), mStd('#f4f4f2', { roughness: 0.35 }), mesas, ([c, u], o) => enCel(c, u, 0, Y0, o));
      const im = instancias(GEO.lechuga, MATP.lechuga, lech, ([c, u, v], o) => { enCel(c, u, v, Y0 + 0.9, o, (u * 7 + v * 3) % 6); o.scale.setScalar(0.85); }, false);
      const cc = new THREE.Color(); lech.forEach((x, i) => im.setColorAt(i, cc.setScalar(0.85 + ((i * 0.37) % 0.3))));
      instancias(new THREE.BoxGeometry(0.8, 0.7, 0.8).translate(0, 0.35, 0), mStd('#1f2937', { roughness: 0.5 }), HID, (c, o) => enCel(c, 0, -3.1, Y0, o)); }
    // aula al aire libre: tablero con techito, bancas y mesa
    const AU = CEL.filter(c => c.tipo === 'aula'), banc = [], mad = mStd('#8a6a48', { map: texTabla, roughness: 0.9 });
    for (const c of AU) for (let f = 0; f < 2; f++) for (let s = -1; s <= 1; s++) banc.push([c, -0.6 + f * 2.2, s * 2.2]);
    instancias(new THREE.BoxGeometry(0.42, 0.45, 1.8).translate(0, 0.22, 0), mad, banc, ([c, u, v], o) => enCel(c, u, v, Y0, o));
    instancias(new THREE.BoxGeometry(0.1, 2.3, 0.1).translate(0, 1.15, 0), mStd('#5b4636'), AU.flatMap(c => [[c, -3.2, -1.3], [c, -3.2, 1.3]]), ([c, u, v], o) => enCel(c, u, v, Y0, o));
    instancias(new THREE.BoxGeometry(0.06, 1.1, 2.7).translate(0, 1.5, 0), mStd('#244236', { roughness: 0.6 }), AU, (c, o) => enCel(c, -3.15, 0, Y0, o));
    instancias(new THREE.BoxGeometry(0.8, 0.05, 3.1).translate(0, 2.35, 0), mStd('#56615a', { metalness: 0.3, roughness: 0.5 }), AU, (c, o) => enCel(c, -3.1, 0, Y0, o));
    // letreros: uno por celda, del color de su huerta (en las parcelas de colegio, un color por colegio)
    const LET = CEL.filter(c => c.tipo !== 'aula'), PALC = ['#60a5fa', '#f472b6', '#facc15', '#34d399', '#fb923c', '#a78bfa'];
    instancias(new THREE.BoxGeometry(0.05, 0.9, 0.05).translate(0, 0.45, 0), mStd('#5b4636'), LET, (c, o) => enCel(c, -3.4, -3.4, Y0, o), false);
    const ilet = instancias(new THREE.BoxGeometry(0.03, 0.36, 0.55).translate(0, 1.0, 0).rotateZ(-0.35), mStd('#ffffff', { roughness: 0.7 }), LET, (c, o) => enCel(c, -3.4, -3.4, Y0, o), false);
    { const cc = new THREE.Color(); LET.forEach((c, i) => ilet.setColorAt(i, cc.set(c.tipo === 'colegio' ? PALC[i % PALC.length] : c.col))); }
    // caminos de grava: del aula de cada huerta a su pasaje
    for (const Z of ZONAS) { const a = Z.aula, d = a.dp; if (!d[1] || d[0] < 4) continue; const q0 = a.c, q1 = d[1], L = d[0] - 3, dx = (q1[0] - q0[0]) / d[0], dz = (q1[1] - q0[1]) / d[0];
      const g = new THREE.PlaneGeometry(2.2, L).rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * L / 2.2);
      const m = new THREE.Mesh(g, mStd('#ffffff', { map: texGrava, roughness: 1 })); m.position.set(q0[0] + dx * (3 + L / 2), Y0 + 0.02, q0[1] + dz * (3 + L / 2)); m.rotation.y = Math.atan2(dx, dz); m.receiveShadow = true; gHu.add(m); }
    // espiral de aromáticas
    const ESP = CEL.filter(c => c.tipo === 'espiral');
    if (ESP.length) { const pie = [], hier = [], TM = 2.4 * Math.PI * 2;
      for (const c of ESP) for (let t = 0.6; t < TM; t += 0.08) { const r = 3.2 - (t / TM) * 2.7, h = 0.25 + (t / TM) * 0.9, u = Math.cos(t) * r, v = Math.sin(t) * r; for (let y = 0; y < h; y += 0.18) pie.push([c, u, v, y, t]);
        if ((t * 10 | 0) % 3 === 0) { const ri = r - 0.45; hier.push([c, Math.cos(t) * ri, Math.sin(t) * ri, h * 0.85, ['aromatica', 'lavanda', 'aromatica', 'flores'][(t * 7 | 0) % 4], t]); } }
      instancias(new THREE.DodecahedronGeometry(0.15, 0).scale(1.3, 0.75, 1), mStd('#a39a8c', { roughness: 0.95 }), pie, ([c, u, v, y, t], o) => enCel(c, u, v, Y0 + 0.1 + y, o, t * 3.1));
      instancias(new THREE.CylinderGeometry(0.4, 3.1, 0.95, 28).translate(0, 0.48, 0), mStd('#4a3527', { roughness: 1 }), ESP, (c, o) => enCel(c, 0, 0, Y0, o), false);
      for (const k of ['aromatica', 'lavanda', 'flores']) { const L = hier.filter(h => h[4] === k); if (!L.length) continue; const col = new THREE.Color();
        const im = instancias(GEO[k], MATP[k], L, ([c, u, v, y, , t], o) => { enCel(c, u, v, Y0 + 0.08 + y, o, t * 5); o.scale.setScalar(1.3); }, false);
        L.forEach(([, , , , , t], i) => im.setColorAt(i, k === 'flores' ? col.set(CULT.flores.pal[(t * 13 | 0) % 6]) : col.setScalar(0.9 + ((t * 7) % 0.2))));
        if (FRUTO[k]) instancias(FRUTO[k], mStd(CULT[k].fr), L, ([c, u, v, y, , t], o) => { enCel(c, u, v, Y0 + 0.08 + y, o, t * 5); o.scale.setScalar(1.3); }, false); } }
    // compostera de 3 cajones de listones en las huertas grandes
    const CB = ZONAS.filter(z => z.aula && CEL.filter(c => c.z === z.k).length >= 8).map(z => z.aula);
    instancias(unir([-1.4, 0, 1.4].map(x => new THREE.BoxGeometry(1.2, 0.95, 1.2).translate(x, 0.475, 0))), mStd('#ffffff', { map: texTabla }), CB, (c, o) => enCel(c, 2.6, 0, Y0, o, Math.PI / 2));
    instancias(unir([-1.4, 0, 1.4].map(x => new THREE.SphereGeometry(0.55, 10, 6, 0, 6.29, 0, 1.4).scale(1, 0.5, 1).translate(x, 0.8, 0))), mStd('#ffffff', { map: texCompost, roughness: 1 }), CB, (c, o) => enCel(c, 2.6, 0, Y0, o, Math.PI / 2), false);
  }
  /* --- modelos reales: árboles del simulador (frutales y bosque comestible) y plantas escaneadas (huerta medicinal) --- */
  { const ARBC = CEL.filter(c => c.tipo === 'arboles' || c.tipo === 'bosque'), MED = CEL.filter(c => c.tipo === 'medic');
    const PT = []; ARBC.forEach((c, ci) => { const pos = c.tipo === 'arboles' ? [[-1.9, -1.9], [1.9, 1.9], [-1.9, 1.9], [1.9, -1.9]] : [[0, 0], [-2.6, 2.4], [2.5, -2.3]]; pos.forEach(([u, v], k) => PT.push({ c, u, v, e: 0.85 + ((ci * 3 + k * 7) % 5) * 0.08, fr: ['#d2452b', '#6f8f3a', '#e8a33a'][(ci + k) % 3], g: (ci + k) % 2 })); });
    const ARB2 = []; CEL.filter(c => c.tipo === 'bosque').forEach((c, ci) => { for (let k = 0; k < 7; k++) { const a = k * 0.9 + ci, r = 1.4 + (k % 3) * 0.9; ARB2.push([c, Math.cos(a) * r, Math.sin(a) * r, k]); } });
    if (ARB2.length) { instancias(GEO.mora, MATP.mora, ARB2, ([c, u, v, k], o) => { enCel(c, u, v, Y0, o, k); o.scale.setScalar(1.4); }, false); instancias(FRUTO.mora, mStd(CULT.mora.fr, { roughness: 0.4 }), ARB2, ([c, u, v, k], o) => { enCel(c, u, v, Y0, o, k); o.scale.setScalar(1.4); }, false); }
    Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js')]).then(([{ GLTFLoader }, { MeshoptDecoder }]) => {
      const ld = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), L = (n) => ld.loadAsync('data3d/models/' + n + '.glb').catch(e => { console.warn('modelo', n, e); return null; });
      // los modelos comprimidos (meshopt) traen enteros normalizados: a decimales ANTES de transformar (como real3d.js)
      const aF = (g) => { for (const k of Object.keys(g.attributes)) { const a = g.attributes[k]; if (!a.isInterleavedBufferAttribute && a.array instanceof Float32Array) continue; const n = a.count, s = a.itemSize, F = new Float32Array(n * s), get = [a.getX, a.getY, a.getZ, a.getW]; for (let i = 0; i < n; i++) for (let j = 0; j < s; j++) F[i * s + j] = get[j].call(a, i); g.setAttribute(k, new THREE.BufferAttribute(F, s)); } return g; };
      const plantar = (gls, lista, alto, f) => { gls = [].concat(gls).filter(Boolean); if (!gls.length || !lista.length) return null; const MS = []; gls.forEach(gl => { gl.scene.updateMatrixWorld(true); gl.scene.traverse(m => { if (m.isMesh) MS.push([m, aF(m.geometry.clone()).applyMatrix4(m.matrixWorld)]); }); });
        const b = new THREE.Box3(); MS.forEach(([, g]) => { g.computeBoundingBox(); b.union(g.boundingBox); }); const h = (b.max.y - b.min.y) || 1, k = alto / h, out = [];
        MS.forEach(([m, g0]) => { const geo = g0.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2).scale(k, k, k);
          const mat = m.material; mat.side = THREE.DoubleSide; if (mat.transparent) { mat.transparent = false; mat.alphaTest = 0.45; }
          out.push(instancias(geo, mat, lista, f, !MOV)); }); return { out, alto: (b.max.y - b.min.y) * k, ancho: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) * k }; };
      Promise.all([L('arbolpeq_L1_madera'), L('arbolpeq_L1_hojas'), L('island_tree_02_L1_madera'), L('island_tree_02_L1_hojas'), L('nettle_plant'), L('celandine_01'), L('fern_02'), L('periwinkle_plant')]).then(([am, ah, im, ih, ort, cel, hel, per]) => {
        const T1 = PT.filter(p => !p.g), T2 = PT.filter(p => p.g), fT = (p, o) => { enCel(p.c, p.u, p.v, Y0, o, p.e * 9); o.scale.setScalar(p.e); };
        const i1 = plantar([am, ah], T1, 4.2, fT), i2 = plantar([im, ih], T2, 4.6, fT);
        // fruta colgando de la copa: tomate de árbol (rojo), feijoa (verde) y lulo (naranja)
        for (const [lista, info] of [[T1, i1], [T2, i2]]) { if (!info || !lista.length) continue; const FR = anillo(22, info.ancho * 0.36, info.alto * 0.45, info.alto * 0.8);
          for (const col of ['#d2452b', '#6f8f3a', '#e8a33a']) { const Lc = lista.filter(p => p.fr === col); if (!Lc.length) continue; instancias(fruto(FR, () => new THREE.SphereGeometry(1, 9, 7).scale(0.06, 0.085, 0.06)), mStd(col, { roughness: 0.4 }), Lc, fT, false); } }
        instancias(new THREE.CircleGeometry(1.2, 22).rotateX(-Math.PI / 2), mStd('#ffffff', { map: texViruta, roughness: 1 }), PT, (p, o) => enCel(p.c, p.u, p.v, Y0 + 0.02, o), false);
        // huerta medicinal: matas escaneadas en grupos
        const MP = []; MED.forEach((c, ci) => { for (let k = 0; k < 16; k++) { const a = k * 2.4 + ci, r = 0.6 + (k % 5) * 0.62; MP.push({ c, u: Math.cos(a) * r, v: Math.sin(a) * r, m: k % 4, e: 0.8 + ((k * 7) % 5) * 0.1, g: k * 1.3 }); } });
        [[ort, 0.9], [cel, 0.55], [hel, 0.8], [per, 0.35]].forEach(([gl, alto], m) => plantar(gl, MP.filter(p => p.m === m), alto, (p, o) => { enCel(p.c, p.u, p.v, Y0, o, p.g); o.scale.setScalar(p.e); }));
      });
    }).catch(e => console.warn('modelos huertas Bavaria', e));
  }
  /* --- planta de compostaje y lombricultura (48 x 30 m, entrada de servicio): cubierta paramétrica-hábitat sobre 5 pilas en hilera (windrows),
     lombricario, criba rotatoria, bodega de abono, recepción con canecas y composteras didácticas --- */
  {
    const g = new THREE.Group(); g.position.set(C_PLANTA[0], 0, C_PLANTA[1]); g.rotation.y = -ANG; gHu.add(g);
    const add = (geo, mat, x, y, z, ry = 0, sh = !MOV) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = sh; m.receiveShadow = true; g.add(m); return m; };
    add(new THREE.BoxGeometry(CL, 0.25, CW), mStd('#ffffff', { map: texConc, roughness: 0.95 }), 0, Y0, 0, 0, false);
    // CUBIERTA PARAMÉTRICA HÁBITAT sobre las pilas (reemplaza la nave a dos aguas): cinco lóbulos-hoja que se entrecruzan, paralelos a los
    // edificios, con membrana traslúcida (deja pasar luz y lluvia controlada), costillas blancas, borde tubular y columnas-árbol que se abren
    // en ramas. Es también hábitat: techo verde en dos lóbulos con flores para polinizadores, jardineras colgantes en el borde, cajas nido y
    // refugios de murciélagos en las columnas.
    const mAc = mStd('#7b8288', { metalness: 0.55, roughness: 0.45 }), NX = -6;
    {
      const texCost = lienzoT(64, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; for (let y = 0; y < h; y += 20) c.fillRect(0, y, w, 2.4); c.fillRect(0, 0, 2.4, h); });
      const texVerde = lienzoT(256, 256, (c, w, h) => { c.fillStyle = '#4f6b34'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const v = Math.random(); c.fillStyle = v < 0.35 ? '#3d5a2a' : v < 0.7 ? '#6d8f45' : v < 0.85 ? '#8aa85a' : v < 0.93 ? '#a3a14a' : '#55703a'; c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 1.2 + Math.random() * 2.5, Math.random() * 3, 0, 7); c.fill(); }
        for (let i = 0; i < 220; i++) { c.fillStyle = ['#f2d14a', '#e9e4f5', '#d7609b', '#f08a24', '#b07ad9'][i % 5]; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 1.6 + Math.random() * 1.6, 0, 7); c.fill(); } }, 3, 3);
      const texColg = lienzoT(128, 256, (c, w, h) => { c.clearRect(0, 0, w, h); for (let k = 0; k < 7; k++) { let x = 20 + k * 15, y = 0; c.strokeStyle = '#3f5f2c'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0);
        for (let s2 = 0; s2 < 14; s2++) { x += (Math.random() - 0.5) * 10; y += 12 + Math.random() * 8; c.lineTo(x, y); c.fillStyle = Math.random() < 0.15 ? '#e9a0c8' : ['#4c7a33', '#5f8f3c', '#3c6629'][s2 % 3]; c.save(); c.translate(x, y); c.rotate(Math.random() * 3); c.beginPath(); c.ellipse(0, 0, 7, 4, 0, 0, 7); c.fill(); c.restore(); } c.stroke(); } });
      texColg.wrapS = texColg.wrapT = THREE.ClampToEdgeWrapping; texColg.repeat.set(1, 1);
      const matMemb = new THREE.MeshStandardMaterial({ color: '#f3f6f2', transparent: true, opacity: 0.3, side: THREE.DoubleSide, roughness: 0.25, depthWrite: false });
      const matCost = new THREE.MeshStandardMaterial({ color: '#f4f4f0', map: texCost, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.4 });
      const matVerde = mStd('#ffffff', { map: texVerde, roughness: 1, side: THREE.DoubleSide });
      const matCol = mStd('#efefea', { roughness: 0.35, metalness: 0.2 }), matColg = new THREE.MeshStandardMaterial({ map: texColg, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8 });
      const LOB = [{ cx: -15, cz: -3, rot: 0.22, A: 9, B: 6.5, H: 6.6, verde: false }, { cx: -5, cz: 3, rot: -0.18, A: 12, B: 7.5, H: 7.8, verde: true }, { cx: 4, cz: -4, rot: 0.3, A: 10, B: 6.5, H: 7.0, verde: false },
        { cx: -9, cz: -7, rot: -0.35, A: 8, B: 4.5, H: 5.8, verde: true }, { cx: 0, cz: 8, rot: 0.12, A: 8, B: 4.5, H: 6.0, verde: false }];
      const ENTRE = [-10, -6, -2, 2, 6, 10]; // las columnas van entre las hileras de compost
      const tramo = (a2, b2, r0, r1) => { const d = b2.clone().sub(a2), Lh = d.length(), g2 = new THREE.CylinderGeometry(r1, r0, Lh, 8); g2.translate(0, Lh / 2, 0); g2.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g2.translate(a2.x, a2.y, a2.z); return g2; };
      const ramas = [], colgs = [], nidos = [], murc = [];
      LOB.forEach((L, li) => {
        const cs = Math.cos(L.rot), sn = Math.sin(L.rot), sem = li * 1.7 + 0.4;
        const borde = (t) => { const rr = 1 + 0.13 * Math.sin(2 * t + sem) + 0.07 * Math.sin(3 * t + sem * 1.9); return [Math.cos(t) * L.A * rr, Math.sin(t) * L.B * (1 + 0.22 * Math.cos(2 * t))]; };
        const alto = (t, f) => L.H + 1.5 * (1 - f * f) - 0.7 * Math.cos(2 * t) * f; // silla de montar: sube en las puntas, baja a los lados
        const sup = (fMax, dy) => { const NU = 48, NV = 12, P = [], U = [], I = [];
          for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) { const t = i / NU * Math.PI * 2, f = j / NV * fMax, e = borde(t), x = e[0] * f, z = e[1] * f;
            P.push(L.cx + x * cs - z * sn, Y0 + alto(t, f) + dy, L.cz + x * sn + z * cs); U.push(f * 4, t / (Math.PI * 2) * 14); if (i < NU && j < NV) { const a2 = i * (NV + 1) + j, b2 = a2 + NV + 1; I.push(a2, b2, a2 + 1, b2, b2 + 1, a2 + 1); } }
          const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setIndex(I); geo.computeVertexNormals(); return geo; };
        const gm = sup(1, 0); const m1 = new THREE.Mesh(gm, matMemb), m2 = new THREE.Mesh(gm, matCost); m1.renderOrder = 6; m2.castShadow = !MOV; g.add(m1, m2);
        if (L.verde) { const v = new THREE.Mesh(sup(0.58, 0.12), matVerde); v.castShadow = !MOV; v.receiveShadow = true; g.add(v); } // techo verde con flores
        const bp = []; for (let i = 0; i < 90; i++) { const t = i / 90 * Math.PI * 2, e = borde(t); bp.push(new THREE.Vector3(L.cx + e[0] * cs - e[1] * sn, Y0 + alto(t, 1), L.cz + e[0] * sn + e[1] * cs)); }
        const tubo = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bp, true), 180, 0.1, 6, true), matCol); tubo.castShadow = !MOV; g.add(tubo);
        // jardineras colgantes del borde: cable + maceta + enredaderas que caen
        for (let i = 0; i < 90; i += 15) { const q = bp[(i + li * 4) % 90]; const caida = 1.4 + (i % 30 ? 0.6 : 0); colgs.push([q.x, q.y, q.z, caida]); }
        // columnas-árbol: fuste que se abre en cuatro ramas hasta la cubierta
        for (const fx of [-0.42, 0.42]) { let bx = L.cx + fx * L.A * cs, bz = L.cz + fx * L.A * sn; bz = ENTRE.reduce((m, z) => Math.abs(z - bz) < Math.abs(m - bz) ? z : m, ENTRE[0]);
          const pie = new THREE.Vector3(bx, Y0, bz), nudo = new THREE.Vector3(bx, Y0 + L.H * 0.6, bz); ramas.push(tramo(pie, nudo, 0.2, 0.15));
          for (let q = 0; q < 4; q++) { const a2 = q / 4 * Math.PI * 2 + L.rot + 0.4, d = 2.6 + (q % 2) * 1.1; ramas.push(tramo(nudo, new THREE.Vector3(bx + Math.cos(a2) * d, Y0 + L.H + 0.9, bz + Math.sin(a2) * d), 0.1, 0.06)); }
          (fx < 0 ? nidos : murc).push([bx, bz, L.H * 0.48, L.rot]); }
      });
      const gr = new THREE.Mesh(unir(ramas), matCol); gr.castShadow = !MOV; g.add(gr);
      // jardineras colgantes
      { const o = new THREE.Object3D(), N = colgs.length;
        const cable = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 4).translate(0, -0.5, 0), mStd('#2b2f33'), N);
        const maceta = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.22, 0.32, 12), mStd('#9a6a4a', { roughness: 0.8 }), N);
        const cruz = (() => { const a2 = new THREE.PlaneGeometry(0.9, 1.8).translate(0, -0.9, 0), b2 = a2.clone().rotateY(Math.PI / 2); return unir([a2, b2]); })();
        cruz.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1], 2)); // uv de las dos tarjetas (no indexadas)
        const enred = new THREE.InstancedMesh(cruz, matColg, N);
        colgs.forEach(([x, y, z, c], i) => { o.position.set(x, y, z); o.rotation.set(0, i, 0); o.scale.set(1, c, 1); o.updateMatrix(); cable.setMatrixAt(i, o.matrix); o.position.y = y - c; o.scale.set(1, 1, 1); o.updateMatrix(); maceta.setMatrixAt(i, o.matrix); o.position.y = y - c + 0.12; o.updateMatrix(); enred.setMatrixAt(i, o.matrix); });
        maceta.castShadow = enred.castShadow = !MOV; g.add(cable, maceta, enred); }
      // cajas nido (aves insectívoras) y refugios de murciélagos en las columnas
      for (const [x, z, h, r] of nidos) { const caja = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.3), mStd('#ffffff', { map: texTabla })); caja.position.set(x + 0.28, Y0 + h, z); caja.rotation.y = r; caja.castShadow = !MOV; g.add(caja);
        const tej = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.4), mStd('#56615a')); tej.position.set(x + 0.28, Y0 + h + 0.25, z); tej.rotation.set(0.25, r, 0); g.add(tej);
        const hueco = new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), mStd('#1a1410')); hueco.position.set(x + 0.28 + Math.sin(r) * 0.152, Y0 + h + 0.08, z + Math.cos(r) * 0.152); hueco.rotation.y = r; g.add(hueco); }
      for (const [x, z, h, r] of murc) { const caja = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.14), mStd('#5b4636', { roughness: 0.95 })); caja.position.set(x - 0.24, Y0 + h + 0.4, z); caja.rotation.y = r + Math.PI / 2; caja.castShadow = !MOV; g.add(caja); }
    }
    // 5 pilas en hilera bajo la cubierta: perfil de campana extruido, textura de compost con paja
    const perfil = new THREE.Shape(); perfil.moveTo(-1.6, 0); for (let i = 0; i <= 16; i++) { const t = i / 16, x = -1.6 + t * 3.2; perfil.lineTo(x, 1.55 * Math.pow(Math.sin(Math.PI * t), 0.75)); } perfil.lineTo(1.6, 0);
    const pila = new THREE.ExtrudeGeometry(perfil, { depth: 26, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 0.3, bevelSegments: 4, curveSegments: 4 }).translate(0, 0, -13).rotateY(Math.PI / 2);
    { const P = pila.attributes.position, U = pila.attributes.uv; for (let i = 0; i < P.count; i++) U.setXY(i, P.getX(i) / 3, (P.getY(i) + P.getZ(i)) / 2); }
    const mPila = mStd('#ffffff', { map: texCompost, roughness: 1 });
    for (let k = 0; k < 5; k++) add(pila, mPila, NX, Y0 + 0.12, -8 + k * 4);
    for (let k = 0; k < 5; k++) for (let s = -1; s <= 1; s += 2) add(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 4).translate(0, 0.8, 0), mStd('#9ca3af', { metalness: 0.7 }), NX + s * 6, Y0 + 0.5, -8 + k * 4, 0, false); // sondas de temperatura
    // volteadora (tractor pequeño)
    add(new THREE.BoxGeometry(2.6, 1.6, 1.8).translate(0, 0.8, 0), mStd('#c2410c', { roughness: 0.5 }), NX + 12, Y0 + 0.4, -6); for (const [x, z] of [[-0.9, 1], [0.9, 1], [-0.9, -1], [0.9, -1]]) add(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 14).rotateX(Math.PI / 2), mStd('#1f2328'), NX + 12 + x, Y0 + 0.55, -6 + z);
    // lombricario: 4 camas de concreto de 12 x 1,2 m con humus
    for (let k = 0; k < 4; k++) { add(new THREE.BoxGeometry(12, 0.7, 1.4).translate(0, 0.35, 0), mStd('#b7b2a7', { roughness: 0.9 }), 15, Y0 + 0.12, -11 + k * 2.4); add(new THREE.BoxGeometry(11.6, 0.05, 1.05), mStd('#ffffff', { map: texCompost, color: '#5c4636', roughness: 1 }), 15, Y0 + 0.8, -11 + k * 2.4, 0, false); }
    { const tl = add(new THREE.BoxGeometry(13, 0.05, 10), mStd('#2f4f3a', { transparent: true, opacity: 0.6, side: THREE.DoubleSide }), 15, Y0 + 2.6, -7.4, 0, false); for (const [x, z] of [[-6.4, -4.8], [6.4, -4.8], [-6.4, 4.8], [6.4, 4.8]]) add(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6).translate(0, 1.2, 0), mAc, 15 + x, Y0 + 0.12, -7.4 + z); } // malla de sombra
    // criba rotatoria (trommel) y montón de abono cernido
    { const tr = add(new THREE.CylinderGeometry(0.9, 0.9, 5, 20, 1, true).rotateZ(Math.PI / 2 - 0.12), mStd('#6b7280', { metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }), 13, Y0 + 1.7, 5); for (const x of [-2, 2]) add(new THREE.BoxGeometry(0.2, 1.6, 1.8).translate(0, 0.8, 0), mAc, 13 + x, Y0 + 0.12, 5);
      add(new THREE.ConeGeometry(2.2, 1.6, 24).translate(0, 0.8, 0), mStd('#ffffff', { map: texCompost, color: '#4a3527', roughness: 1 }), 17, Y0 + 0.12, 5); }
    // bodega de abono con bultos y estiba
    add(new THREE.BoxGeometry(8, 3.6, 6).translate(0, 1.8, 0), mStd('#ffffff', { map: texTabla, roughness: 0.9 }), 18, Y0 + 0.12, 11); add(new THREE.BoxGeometry(8.8, 0.12, 6.8), mStd('#56615a', { metalness: 0.3 }), 18, Y0 + 3.85, 11);
    { const b = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) b.push([12.2 + i * 0.65, Y0 + 0.3 + k * 0.28, 9.6 + j * 0.45]); const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.26, 0.42), mStd('#e8dcc2', { roughness: 0.85 }), b.length), o = new THREE.Object3D(); b.forEach((p, i) => { o.position.set(...p); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); g.add(im); add(new THREE.BoxGeometry(2.8, 0.15, 1.5), mStd('#8a6a48'), 13.2, Y0 + 0.16, 10.1); }
    // recepción: báscula y canecas (verde: orgánicos de huerta y mercado; café: material seco)
    add(new THREE.BoxGeometry(6, 0.12, 3.2), mStd('#4b5563', { metalness: 0.5 }), -20, Y0 + 0.12, 10);
    for (let i = 0; i < 8; i++) add(new THREE.CylinderGeometry(0.4, 0.36, 1.05, 14).translate(0, 0.52, 0), mStd(i % 2 ? '#7c5a3a' : '#2f7d44', { roughness: 0.5 }), -21 + (i % 4) * 1.1, Y0 + 0.12, 12.6 + Math.floor(i / 4) * 1.1, 0, false);
    // composteras didácticas y aula de compost
    for (let i = 0; i < 4; i++) { add(new THREE.BoxGeometry(1.2, 1, 1.2).translate(0, 0.5, 0), mStd('#ffffff', { map: texTabla }), -10 + i * 1.6, Y0 + 0.12, 13); add(new THREE.SphereGeometry(0.55, 10, 6, 0, 6.29, 0, 1.4).scale(1, 0.45, 1), mStd('#ffffff', { map: texCompost, roughness: 1 }), -10 + i * 1.6, Y0 + 1.1, 13, 0, false); }
    for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(2.2, 0.45, 0.45).translate(0, 0.22, 0), mStd('#8a6a48', { map: texTabla }), -2 + i * 0, Y0 + 0.12, 9.5 + i * 1.3);
    add(new THREE.BoxGeometry(0.06, 1.1, 2.6).translate(0, 1.5, 0), mStd('#244236'), -3.6, Y0 + 0.12, 10.8); add(new THREE.BoxGeometry(0.1, 2.2, 0.1).translate(0, 1.1, 0), mStd('#5b4636'), -3.6, Y0 + 0.12, 9.5); add(new THREE.BoxGeometry(0.1, 2.2, 0.1).translate(0, 1.1, 0), mStd('#5b4636'), -3.6, Y0 + 0.12, 12.1);
  }
  /* --- plantas de las camas: solo cerca de la cámara --- */
  const PLANTAS = (() => {
    const CAP = MOV ? 7000 : 26000, ims = {}, frs = {}, o = new THREE.Object3D(), cc = new THREE.Color();
    for (const k in GEO) { const n = Math.round(CAP / (['maiz', 'tomate', 'ahuyama', 'uchuva', 'mora'].includes(k) ? 6 : 3)); ims[k] = new THREE.InstancedMesh(GEO[k], MATP[k], n); ims[k].castShadow = false; ims[k].count = 0; ims[k].receiveShadow = true; ims[k].frustumCulled = false; gHu.add(ims[k]);
      if (FRUTO[k]) { frs[k] = new THREE.InstancedMesh(FRUTO[k], mStd(k === 'zanahoria' ? '#e8742a' : CULT[k].fr, { roughness: 0.4 }), n); frs[k].count = 0; frs[k].frustumCulled = false; gHu.add(frs[k]); } }
    let ux = 1e9, uz = 1e9;
    return function actualizar(forzar) {
      if (!gHu.visible) return; const t = T3.orbit.target, cam = T3.camera.position; if (cam.y > 420) { if (ux < 1e8) { for (const k in ims) ims[k].count = 0; for (const k in frs) frs[k].count = 0; ux = 1e9; } return; }
      if (!forzar && Math.hypot(t.x - ux, t.z - uz) < 25) return; ux = t.x; uz = t.z;
      const R = Math.min(170, 60 + cam.y * 0.6), cerca = CAMAS_CEL.filter(c => c.camas && Math.hypot(c.c[0] - t.x, c.c[1] - t.z) < R).sort((a, b) => Math.hypot(a.c[0] - t.x, a.c[1] - t.z) - Math.hypot(b.c[0] - t.x, b.c[1] - t.z));
      const n = {}; for (const k in ims) n[k] = 0;
      for (const c of cerca) for (const cm of c.camas) { const C = CULT[cm.k], im = ims[cm.k]; if (!C || !im) continue;
        const pas = C.paso * (MOV ? 1.6 : 1), fil = C.fil, cap = im.instanceMatrix.count, fr = frs[cm.k];
        for (let f = 0; f < fil; f++) { const du = (f + 0.5) / fil * 1.05 - 0.525; for (let s = -LB / 2 + 0.15; s < LB / 2 - 0.1 && n[cm.k] < cap; s += pas) {
          const h = Math.sin((cm.q[0] + s) * 12.9898 + (cm.q[1] + f) * 78.233) * 43758.5453, r = h - Math.floor(h), q = loc(cm.q, du + (r - 0.5) * 0.05, s);
          o.position.set(q[0], Y0 + 0.43, q[1]); o.rotation.set(0, r * 6.28, 0); const e = 0.72 + r * 0.55; o.scale.set(e, e * (0.88 + r * 0.24), e); o.updateMatrix(); im.setMatrixAt(n[cm.k], o.matrix); if (fr) fr.setMatrixAt(n[cm.k], o.matrix);
          if (C.pal) cc.set(C.pal[Math.floor(r * 997) % C.pal.length]); else cc.setRGB(0.82 + r * 0.3, 0.86 + r * 0.24, 0.8 + r * 0.25); im.setColorAt(n[cm.k], cc); n[cm.k]++; } } }
      for (const k in ims) { ims[k].count = n[k]; ims[k].instanceMatrix.needsUpdate = true; if (ims[k].instanceColor) ims[k].instanceColor.needsUpdate = true; if (frs[k]) { frs[k].count = n[k]; frs[k].instanceMatrix.needsUpdate = true; } }
    };
  })();
  setInterval(() => { if (gHu.visible && !raf) PLANTAS(); }, 600);

  /* ---------- estación solar ---------- */
  {
    const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(1.05, 0.05, 2.1), new THREE.MeshStandardMaterial({ color: '#1d3557', roughness: 0.25, metalness: 0.5, emissive: '#0b1a2e' }), 20), o = new THREE.Object3D();
    const e = ED[8], c = centro(e.W); let L0 = 0, a = 0; for (let i = 0; i < e.W.length; i++) { const p = e.W[i], q = e.W[(i + 1) % e.W.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]); if (l > L0) { L0 = l; a = Math.atan2(q[1] - p[1], q[0] - p[0]); } }
    for (let i = 0; i < 20; i++) { const u = -5.4 + (i % 10) * 1.2, v = i < 10 ? -1.3 : 1.3; o.position.set(c[0] + u * Math.cos(a) - v * Math.sin(a), e.h + 0.55, c[1] + u * Math.sin(a) + v * Math.cos(a)); o.rotation.set(0, -a, 0.17); o.updateMatrix(); pm.setMatrixAt(i, o.matrix); }
    grupo.add(pm); POS.sol = [c[0] + 6, e.h + 9, c[1] + 4];
  }

  /* ---------- 5. módulos de fauna (con su tecnología) ---------- */
  const mMadera = mStd('#8b6a4a'), mPoste = mStd('#4b5563', { metalness: 0.5, roughness: 0.5 }), mSensor = new THREE.MeshStandardMaterial({ color: '#0ea5e9', emissive: '#0ea5e9', emissiveIntensity: 0.9 });
  const pieza = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; grupo.add(m); return m; };
  const LUCES = []; // leds de sensores que titilan
  const sensor = (x, y, z) => { const m = pieza(new THREE.SphereGeometry(0.16, 10, 8), mSensor.clone(), x, y, z); LUCES.push(m); };
  { // apiario: 2 filas de 3 colmenas tipo Langstroth sobre bases, cerca baja y mástil con sensores
    const p = FA.apiario.p; grupo.add(losa(rect(p, 16, 10), 0.28, mStd('#9b8f74', { roughness: 1 })));
    for (let i = 0; i < 6; i++) { const q = loc(p, -5 + (i % 3) * 5, i < 3 ? -2 : 2.2);
      pieza(new THREE.BoxGeometry(0.6, 0.4, 0.6), mStd('#475569'), q[0], 0.45, q[1], -ANG);
      for (let s = 0; s < 3; s++) pieza(new THREE.BoxGeometry(0.5, 0.26, 0.42), mStd(['#f8fafc', '#fde68a', '#fef3c7'][s]), q[0], 0.8 + s * 0.27, q[1], -ANG);
      pieza(new THREE.BoxGeometry(0.58, 0.06, 0.5), mStd('#94a3b8', { metalness: 0.4 }), q[0], 1.62, q[1], -ANG); sensor(q[0], 1.72, q[1]); }
    const m = loc(p, 7, 0); pieza(new THREE.CylinderGeometry(0.08, 0.08, 5, 8).translate(0, 2.5, 0), mPoste, m[0], 0.2, m[1]); sensor(m[0], 5.2, m[1]);
    pieza(new THREE.BoxGeometry(1.2, 0.05, 0.7), mStd('#1d3557', { metalness: 0.5, roughness: 0.3 }), m[0], 4.5, m[1], -ANG);
  }
  { // nidos de abejorro nativo + hotel de abejas solitarias
    const p = FA.abejorro.p;
    for (let i = 0; i < 5; i++) { const q = loc(p, -4 + i * 2, 0); pieza(new THREE.CylinderGeometry(0.05, 0.05, 1, 6).translate(0, 0.5, 0), mPoste, q[0], 0.2, q[1]); pieza(new THREE.BoxGeometry(0.4, 0.35, 0.4), mMadera, q[0], 1.38, q[1], -ANG); }
    const h = loc(p, 0, 3); pieza(new THREE.BoxGeometry(2.4, 1.8, 0.5), mStd('#a0784f'), h[0], 1.3, h[1], -ANG); pieza(new THREE.BoxGeometry(2.6, 0.12, 0.8), mStd('#5b4636'), h[0], 2.3, h[1], -ANG); sensor(h[0], 2.5, h[1]);
  }
  { // charca didáctica: lámina de agua, juncos, muelle de observación y boya con sensor (ADN ambiental)
    const p = FA.charca.p, ag = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#1e3a4c', roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.92 }));
    ag.scale.set(16, 1, 9); ag.position.set(p[0], 0.32, p[1]); ag.rotation.y = -ANG; grupo.add(ag);
    const borde = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 48).rotateX(-Math.PI / 2), mStd('#6b5b45')); borde.scale.set(16, 1, 9); borde.position.set(p[0], 0.3, p[1]); borde.rotation.y = -ANG; grupo.add(borde);
    const N = 90, jun = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 1.4, 4).translate(0, 0.7, 0), mStd('#5d7a3a'), N), o = new THREE.Object3D();
    for (let i = 0; i < N; i++) { const t = i / N * Math.PI * 2 + Math.sin(i) * 0.1, r = 0.95 + Math.sin(i * 7.1) * 0.08, q = loc(p, Math.cos(t) * 16 * r, Math.sin(t) * 9 * r); o.position.set(q[0], 0.3, q[1]); o.rotation.set(Math.sin(i) * 0.15, 0, Math.cos(i) * 0.15); o.scale.setScalar(0.7 + (i % 5) * 0.12); o.updateMatrix(); jun.setMatrixAt(i, o.matrix); }
    grupo.add(jun);
    const m = loc(p, -14, 0), mm = loc(p, -9, 0); pieza(new THREE.BoxGeometry(10, 0.2, 1.8), mMadera, (m[0] + mm[0]) / 2, 0.7, (m[1] + mm[1]) / 2, -ANG);
    const b = loc(p, 4, 2); pieza(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 12), mStd('#f97316'), b[0], 0.5, b[1]); sensor(b[0], 0.9, b[1]);
  }
  FA.murc.forEach(p => { pieza(new THREE.CylinderGeometry(0.09, 0.09, 6, 8).translate(0, 3, 0), mPoste, p[0], 0.2, p[1]); pieza(new THREE.BoxGeometry(0.6, 0.8, 0.22), mStd('#3f3a36'), p[0], 5.6, p[1] + 0.2, -ANG); sensor(p[0], 6.4, p[1]); });
  FA.nidos.forEach(p => { pieza(new THREE.CylinderGeometry(0.06, 0.06, 3, 8).translate(0, 1.5, 0), mPoste, p[0], 0.2, p[1]); pieza(new THREE.BoxGeometry(0.3, 0.42, 0.3), mMadera, p[0], 3.2, p[1], -ANG); pieza(new THREE.ConeGeometry(0.28, 0.2, 4), mStd('#5b4636'), p[0], 3.5, p[1], -ANG + Math.PI / 4); sensor(p[0], 3.75, p[1]); });
  FA.perchas.forEach(p => { pieza(new THREE.CylinderGeometry(0.07, 0.09, 6.5, 8).translate(0, 3.25, 0), mMadera, p[0], 0.2, p[1]); pieza(new THREE.BoxGeometry(1.6, 0.08, 0.08), mMadera, p[0], 6.6, p[1], -ANG); });
  FA.hoteles.forEach(p => { pieza(new THREE.BoxGeometry(1.8, 1.5, 0.5), mStd('#a0784f'), p[0], 1.2, p[1], -ANG); pieza(new THREE.BoxGeometry(2, 0.1, 0.8), mStd('#5b4636'), p[0], 2.0, p[1], -ANG);
    for (const s of [-0.75, 0.75]) { const q = loc(p, s, 0); pieza(new THREE.BoxGeometry(0.1, 0.5, 0.1), mPoste, q[0], 0.25, q[1]); } });
  { const s = centro(ED[6].W); pieza(new THREE.BoxGeometry(0.6, 0.8, 0.6), mMadera, s[0] + 2, ED[6].h + 1.6, s[1]); sensor(s[0] + 2, ED[6].h + 2.3, s[1]); pieza(new THREE.CylinderGeometry(0.05, 0.05, 6, 6).translate(0, 3, 0), mPoste, s[0] - 3, ED[6].h + 1.2, s[1]); sensor(s[0] - 3, ED[6].h + 7.4, s[1]); }

  /* ---------- 6. interacciones bióticas: arcos con partículas (la posición se calcula en la GPU) ---------- */
  const celCerca = (p, n, filtro = () => true) => CEL.filter(filtro).map(c => [c, Math.hypot(c.c[0] - p[0], c.c[1] - p[1])]).sort((a, b) => a[1] - b[1]).slice(0, n).map(a => a[0].c);
  const bosque = (n, ref) => ARBW.map(a => [a, Math.hypot(a[0] - ref[0], a[1] - ref[1])]).filter(a => a[1] > 25).sort((a, b) => a[1] - b[1]).filter((_, i) => i % 7 === 0).slice(0, n).map(a => a[0]);
  const flores = CEL.filter(c => c.flor).map(c => c.c), invs = CEL.filter(c => c.inv).map(c => c.c), poli = centro(ED[23].W), silo = centro(ED[6].W);
  const INTER = [
    { k: 'abeja', n: 'Abeja de miel', sp: 'Apis mellifera', c: '#fbbf24', mod: 'Apiario inteligente (6 colmenas)', serv: 'Poliniza fresa, cilantro y las franjas de flores; miel y cera para el mercado.', tec: 'Colmenas con balanza, temperatura y sonido (IoT) del laboratorio de nanosensores; el centro de datos alerta si la colonia se debilita.', pares: celCerca(FA.apiario.p, 16).map(c => [FA.apiario.p, c]), h: [8, 16], v: 26, y0: 1.8 },
    { k: 'abejorro', n: 'Abejorro nativo', sp: 'Bombus atratus', c: '#facc15', mod: 'Nidos de abejorro y hotel de abejas solitarias', serv: 'Poliniza por vibración dentro de los invernaderos, donde la abeja de miel trabaja poco.', tec: 'Cámaras de conteo de visitas con IA en la entrada de los nidos.', pares: (invs.length ? invs : celCerca(FA.abejorro.p, 8)).slice(0, 10).map(c => [FA.abejorro.p, c]), h: [6, 12], v: 20, y0: 1.5 },
    { k: 'colibri', n: 'Colibrí chillón', sp: 'Colibri coruscans', c: '#2dd4bf', mod: 'Franjas de flores nativas', serv: 'Poliniza flores tubulares y une el bosque con las huertas.', tec: 'Grabadoras acústicas (tipo AudioMoth) y reconocimiento de cantos con IA.', pares: flores.slice(0, 8).flatMap((f, i) => { const b = bosque(8, f)[i % 8] || FA.apiario.p; return [[b, f]]; }), h: [10, 20], v: 34, y0: 6 },
    { k: 'mariposa', n: 'Mariposas', sp: 'Lepidoptera', c: '#fb923c', mod: 'Laboratorio vivo de polinizadores (mariposario)', serv: 'Se crían y se sueltan en las franjas de flores; indicadoras de la salud del ecosistema.', tec: 'Conteo con cámaras e IA en el mariposario y en las franjas.', pares: flores.map(f => [poli, f]), h: [12, 24], v: 14, y0: 4 },
    { k: 'ave', n: 'Aves insectívoras', sp: 'Copetón (Zonotrichia capensis) y otras', c: '#d6a77a', mod: 'Cajas nido en postes', serv: 'Comen orugas y saltamontes de las camas.', tec: 'Cajas nido con cámara y sensor de ocupación.', pares: FA.nidos.flatMap(p => celCerca(p, 3).map(c => [p, c])), h: [6, 12], v: 22, y0: 3.4 },
    { k: 'murcielago', n: 'Murciélagos insectívoros', sp: 'Chiroptera', c: '#a78bfa', mod: 'Refugios para murciélagos', serv: 'Comen polillas y mosquitos de noche: menos plagas en las camas.', tec: 'Detectores ultrasónicos y clasificación de llamadas con IA.', pares: FA.murc.flatMap(p => celCerca(p, 5).map(c => [p, c])), h: [8, 16], v: 30, y0: 5.6 },
    { k: 'rana', n: 'Rana sabanera y libélulas', sp: 'Dendropsophus molitor · Odonata', c: '#60a5fa', mod: 'Charca didáctica', serv: 'La rana come insectos; las libélulas, mosquitos. La charca une el distrito con los humedales de Kennedy.', tec: 'ADN ambiental (eDNA) en el agua, analizado en el hub de biotecnología, y sensor de calidad del agua.', pares: [...celCerca(FA.charca.p, 4), ...bosque(4, FA.charca.p)].map(c => [FA.charca.p, c]), h: [2, 5], v: 10, y0: 0.5 },
    { k: 'mariquita', n: 'Mariquitas y crisopas', sp: 'Coccinellidae · Chrysopidae', c: '#f87171', mod: 'Hoteles de insectos', serv: 'Comen pulgones: control biológico sin químicos.', tec: 'Trampas cromáticas con cámara para contar plagas y enemigos naturales.', pares: FA.hoteles.flatMap(p => celCerca(p, 4).map(c => [p, c])), h: [1.5, 4], v: 8, y0: 1.2 },
    { k: 'lombriz', n: 'Lombrices y microorganismos', sp: 'Eisenia fetida', c: '#c08457', mod: 'Compostaje y lombricultura', serv: 'Convierten los residuos en abono y vida del suelo para las camas.', tec: 'Sondas de temperatura y humedad por lote de compost.', pares: celCerca(C_COMP, 8).map(c => [C_COMP, c]), h: [1, 3], v: 6, y0: 0.6 }
  ];
  const FOC = new Float32Array(16).fill(1), FOCo = new Float32Array(16).fill(1);
  {
    let n = 0; const POR = MOV ? 3 : 6; INTER.forEach(I => { n += I.pares.length * POR; });
    const a0 = new Float32Array(n * 3), a1 = new Float32Array(n * 3), a2 = new Float32Array(n * 3), of = new Float32Array(n), ve = new Float32Array(n), cl = new Float32Array(n * 3), fi = new Float32Array(n);
    let k = 0; const cc = new THREE.Color(), lin = [];
    INTER.forEach((I, ii) => { cc.set(I.c); const L = [];
      I.pares.forEach(([p, q], pi) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]), hh = I.h[0] + (I.h[1] - I.h[0]) * ((pi * 0.37) % 1), A = new THREE.Vector3(p[0], I.y0, p[1]), B = new THREE.Vector3(q[0], 1.2, q[1]), C = A.clone().lerp(B, 0.5); C.y = Math.max(A.y, B.y) + hh + d * 0.05;
        const cur = new THREE.QuadraticBezierCurve3(A, C, B), pts = cur.getPoints(18); for (let s = 1; s < pts.length; s++) L.push(pts[s - 1].x, pts[s - 1].y, pts[s - 1].z, pts[s].x, pts[s].y, pts[s].z);
        for (let r = 0; r < POR; r++, k++) { A.toArray(a0, k * 3); C.toArray(a1, k * 3); B.toArray(a2, k * 3); cc.toArray(cl, k * 3); of[k] = (r / POR + pi * 0.13) % 1; ve[k] = I.v / Math.max(30, d) * (0.8 + ((k * 0.61) % 0.4)) * (r % 2 ? 1 : -1); fi[k] = ii; } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
      const ln = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: I.c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); ln.renderOrder = 11; ln.visible = false; grupo.add(ln); I.ln = ln; }); // sin líneas entre edificios: solo se mueve la fauna
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(a0, 3)); geo.setAttribute('a1', new THREE.BufferAttribute(a1, 3)); geo.setAttribute('a2', new THREE.BufferAttribute(a2, 3));
    geo.setAttribute('aOf', new THREE.BufferAttribute(of, 1)); geo.setAttribute('aVe', new THREE.BufferAttribute(ve, 1)); geo.setAttribute('aC', new THREE.BufferAttribute(cl, 3)); geo.setAttribute('aF', new THREE.BufferAttribute(fi, 1));
    var UBIO = { uVis: { value: 0 }, uFoc: { value: FOC }, uPx: { value: devicePixelRatio || 1 } };
    const pm = new THREE.ShaderMaterial({ uniforms: { uT: TU, ...UBIO },
      vertexShader: 'attribute vec3 a1,a2,aC; attribute float aOf,aVe,aF; uniform float uT,uPx; uniform float uFoc[16]; varying vec3 vC; varying float vA;\nvoid main(){ float t=fract(aOf+uT*abs(aVe)); if(aVe<0.) t=1.-t; float u=1.-t; vec3 p=u*u*position+2.*u*t*a1+t*t*a2; p.y+=sin(uT*9.+aOf*40.)*.25; vec4 mv=modelViewMatrix*vec4(p,1.);\n vC=aC; vA=uFoc[int(aF)]; gl_PointSize=clamp(1500.*uPx/-mv.z,2.*uPx,11.*uPx); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform float uVis; varying vec3 vC; varying float vA;\nvoid main(){ float r=length(gl_PointCoord-.5); if(r>.5) discard; float a=smoothstep(.5,0.,r); a=a*a+smoothstep(.15,0.,r); gl_FragColor=vec4(mix(vC,vec3(1.),smoothstep(.15,0.,r)*.6)*a*vA*uVis,1.);' + COLSP + '}',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const pts = new THREE.Points(geo, pm); pts.frustumCulled = false; pts.renderOrder = 12; pts.visible = false; grupo.add(pts); // sin arcos de partículas entre edificios
  }

  /* ---------- 7. sintaxis espacial: la red alrededor del predio, de hoy a «con el distrito» (integración angular 800 m) ---------- */
  const SXU = { uT: TU, uMix: { value: 0 }, uDraw: { value: 0 }, uVis: { value: 0 } };
  {
    const P = [], CA = [], CB = [], AN = [], AS = [], I = [];
    for (const s of SEG) { if (!s.n) continue; // en el distrito NO se pinta la sintaxis: solo los pasajes nuevos, como piso (la sintaxis va en el panel izquierdo con la propuesta)
      const pts = s.p.map(q => M(q[0], q[1])), w = 7, y = 1.4, ca = [0.86, 0.82, 0.74], cb = ca;
      let Lt = 0; for (let i = 1; i < pts.length; i++) Lt += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); let acc = 0;
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2, base = P.length / 3, s0 = acc / Lt, s1 = (acc + l) / Lt; acc += l;
        P.push(a[0] + nx, y, a[1] + nz, a[0] - nx, y, a[1] - nz, b[0] - nx, y, b[1] - nz, b[0] + nx, y, b[1] + nz);
        for (let k = 0; k < 4; k++) { CA.push(...ca); CB.push(...cb); AN.push(s.n ? 1 : 0); } AS.push(s0, s0, s1, s1); I.push(base, base + 1, base + 2, base, base + 2, base + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('cA', new THREE.Float32BufferAttribute(CA, 3)); g.setAttribute('cB', new THREE.Float32BufferAttribute(CB, 3));
    g.setAttribute('aN', new THREE.Float32BufferAttribute(AN, 1)); g.setAttribute('aS', new THREE.Float32BufferAttribute(AS, 1)); g.setIndex(I);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: SXU,
      vertexShader: 'attribute vec3 cA,cB; attribute float aN,aS; varying vec3 vC; varying float vN,vS; uniform float uMix; void main(){ vC=mix(cA,cB,uMix); vN=aN; vS=aS; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float uT,uMix,uDraw,uVis; varying vec3 vC; varying float vN,vS;\nvoid main(){ float a=.82; vec3 c=vC; if(vN>.5){ if(vS>uDraw||uMix<.5) discard; float p=pow(fract(vS*6.-uT*.5),8.); c=mix(c,vec3(1.),.08+p*.6); a=1.; } gl_FragColor=vec4(c,a*uVis);' + COLSP + '}',
      transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    m.renderOrder = 6; m.frustumCulled = false; grupo.add(m);
  }
  const SXR = SX ? SX.resumen : null, SUBEN = SEG.filter(s => s.ia !== null && s.ib !== null && s.ib > s.ia + 0.01).length, PAS_M = SX ? SX.pasajes_m : 0;
  // gente caminando por los pasajes nuevos
  const CAM = (() => {
    const L = PAS.map(P => { const acc = [0]; for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return { P, acc, L: acc[acc.length - 1] }; }).filter(p => p.L > 20);
    const n = MOV ? 50 : 140, im = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.28, 1.1, 3, 6).translate(0, 0.85, 0), mStd('#fde68a', { roughness: 0.6 }), n), cc = new THREE.Color(), PAL = ['#fde68a', '#93c5fd', '#f9a8d4', '#86efac', '#fdba74', '#e5e7eb'];
    const A = Array.from({ length: n }, (_, i) => ({ r: L[i % L.length], t: (i * 0.618) % 1, v: (1.1 + (i % 5) * 0.12) * (i % 2 ? 1 : -1), lado: ((i * 0.37) % 1 - 0.5) * 2.4 }));
    A.forEach((a, i) => im.setColorAt(i, cc.set(PAL[i % PAL.length]))); im.castShadow = !MOV; grupo.add(im); const o = new THREE.Object3D();
    return (dt, mov) => { if (!L.length) return; A.forEach((a, i) => { if (mov) a.t = (a.t + dt * a.v / a.r.L + 1) % 1; const s = a.t * a.r.L, { P, acc } = a.r; let k = 1; while (k < acc.length - 1 && acc[k] < s) k++; const f = (s - acc[k - 1]) / ((acc[k] - acc[k - 1]) || 1), p = P[k - 1], q = P[k], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1;
      o.position.set(p[0] + dx * f - dz / l * a.lado, 0.3, p[1] + dz * f + dx / l * a.lado); o.rotation.set(0, Math.atan2(dx * Math.sign(a.v), dz * Math.sign(a.v)), 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.instanceMatrix.needsUpdate = true; };
  })();

  /* ---------- 8. red de datos: del centro de datos a los edificios, sensores y huertas ---------- */
  const RD = { uT: TU, uDraw: { value: 0 }, uVis: { value: 0 } };
  {
    const o = POS.datos, dest = [...Object.entries(POS).filter(([k]) => k !== 'datos' && k !== 'sol').map(([, p]) => p), [FA.apiario.p[0], 5, FA.apiario.p[1]], [FA.charca.p[0], 1, FA.charca.p[1]], [FA.abejorro.p[0], 2.5, FA.abejorro.p[1]], ...FA.murc.map(p => [p[0], 6.4, p[1]])];
    const mat = new THREE.ShaderMaterial({ uniforms: RD,
      vertexShader: 'varying float vU; void main(){ vU=uv.x; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float uT,uDraw,uVis; varying float vU;\nvoid main(){ if(vU>uDraw) discard; float p=pow(fract(vU*5.-uT*.8),10.); vec3 c=vec3(.22,.74,.97); gl_FragColor=vec4(c*(.35+p*2.),(.25+p)*uVis);' + COLSP + '}',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    for (const d of dest) { const A = new THREE.Vector3(o[0], o[1] + 2, o[2]), B = new THREE.Vector3(d[0], d[1], d[2]), C = A.clone().lerp(B, 0.5); C.y = Math.max(A.y, B.y) + 18 + A.distanceTo(B) * 0.12;
      const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, C, B), 40, 0.35, 5), mat); t.renderOrder = 10; t.visible = false; grupo.add(t); } // la red de datos no se dibuja (eran conexiones entre edificios)
  }

  /* ---------- 9. carga y accesos ---------- */
  const matRuta = (col, rep) => new THREE.ShaderMaterial({ uniforms: { uT: TU, uC: { value: new THREE.Color(col) }, uRep: { value: rep } },
    vertexShader: 'varying float vU; void main(){ vU=uv.x; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uC; uniform float uT,uRep; varying float vU;\nvoid main(){ float d=fract(vU*uRep-uT*.6); float a=.35+pow(d,5.)*1.4; gl_FragColor=vec4(uC*a,min(1.,a));' + COLSP + '}', transparent: true, depthWrite: false, toneMapped: false });
  const CARGA = (() => { const p = [[8974, 3008], [9040, 3050], [9150, 3110], [9200, 3214], [9300, 3186], [9368, 3214], [9420, 3238], [9490, 3200], [9488, 3170], [9520, 3140]];
    const curva = new THREE.CatmullRomCurve3(p.map(q => { const w = M(q[0], q[1]); return new THREE.Vector3(w[0], 1.1, w[1]); }), false, 'centripetal'), L = curva.getLength();
    const m = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.round(L / 3), 0.85, 6), matRuta('#ef4444', L / 9)); m.renderOrder = 10; m.visible = false; grupo.add(m); // sin la línea roja de la carga
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 2.1, 4.6).translate(0, 1.05, 0), mStd('#f8fafc', { roughness: 0.6 }), 3); grupo.add(im); const t = [0, 0.33, 0.66], o = new THREE.Object3D();
    return (dt, mov) => { for (let i = 0; i < 3; i++) { if (mov) t[i] = (t[i] + dt * 4.5 / L) % 1; const q = curva.getPointAt(t[i]), g = curva.getTangentAt(t[i]); o.position.set(q.x, 0.3, q.z); o.rotation.set(0, Math.atan2(g.x, g.z), 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } im.instanceMatrix.needsUpdate = true; }; })();
  ACC.forEach(a => { const g = new THREE.Group(); g.position.set(a.p[0], 0, a.p[1]);
    const ani = new THREE.Mesh(new THREE.RingGeometry(3, 3.8, 40).rotateX(-Math.PI / 2), mBasic('#fbbf24', 0.8, { side: THREE.DoubleSide })); ani.position.y = 0.6;
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 9, 12).translate(0, 4.5, 0), mBasic('#ffffff', 0.85)), ani); grupo.add(g); a.ani = ani; });

  /* ---------- 10. la caja de lechuga (seguir una cosecha) ---------- */
  const COSECHA = [
    { t: 'Sale el grupo del aula', x: 'Un grupo de 24 recibe el ensayo del día en el instituto y sale por la cara interior de la L.', k: 'inst', p: [[9185, 2990]] },
    { t: 'Pasa por el hub de biotecnología', x: 'Biotecnología vegetal prepara el registro del ensayo: camas de tratamiento y de control.', k: 'bio', p: [[9150, 3080], [9200, 3215], [9300, 3200]] },
    { t: 'Cosecha en el invernadero A', x: 'Los abejorros nativos ya polinizaron; el grupo recoge lechugas, pesa una caja y registra el lote.', k: 'campo', p: [[9370, 3180], [9440, 3140], [9505, 3042]] },
    { t: 'Poscosecha: sensor en el empaque', x: 'Se selecciona, se empaca y se prueba el indicador de humedad del centro de nanotecnología.', k: 'pos', p: [[9470, 3000], [9420, 2930]] },
    { t: 'Mercado: ¿se entiende la etiqueta?', x: 'Ciencias cognitivas observa si el comerciante entiende la información y qué decide con la caja.', k: 'mer', p: [[9360, 2930], [9300, 2938]] },
    { t: 'Lo que sobra, a compostaje', x: 'Las hojas descartadas van al compostaje; las lombrices las vuelven abono para las camas.', k: 'comp', p: [[9380, 2965], [9445, 3060], [9500, 3120], [9527, 3133]] },
    { t: 'El tablero del distrito', x: 'El centro de datos junta peso vendido, residuos, energía y visitas de fauna. De cada 100 kg que recibe el mercado: cuántos se venden, cuántos siguen siendo alimento y cuántos van a compost.', k: 'datos', p: [[9527, 3133]] }
  ];
  const caja = new THREE.Group(); caja.visible = false; grupo.add(caja);
  caja.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 1.2), new THREE.MeshBasicMaterial({ color: '#86efac', toneMapped: false })));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 14), mBasic('#4ade80', 0.18, { blending: THREE.AdditiveBlending })); caja.add(halo);
  caja.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 60, 8).translate(0, 30, 0), mBasic('#bbf7d0', 0.5, { blending: THREE.AdditiveBlending })));

  /* ---------- etiquetas y panel ---------- */
  const css = document.createElement('style');
  css.textContent = `
.bd-lb{position:fixed;left:0;top:0;z-index:7;display:none;cursor:pointer;font-family:Inter,system-ui,sans-serif;color:#eef1f3;white-space:nowrap}
.bd-lb .cj{display:flex;align-items:stretch;border-radius:9px!important;background:rgba(10,13,17,.72);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);border-radius:6px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.bd-lb .k{display:flex;align-items:center;padding:0 6px;font:600 10px var(--ui-sans,Inter,system-ui,sans-serif);color:#0b0d10;background:var(--c)}
.bd-lb .t{padding:4px 8px 4px 7px;line-height:1.15}
.bd-lb b{display:block;font-weight:600;font-size:11px}
.bd-lb small{display:block;font:400 10px var(--ui-sans,Inter,system-ui,sans-serif);color:#a3acb1;margin-top:1px}
.bd-lb .pt{position:absolute;left:10px;top:100%;width:1px;height:18px;background:linear-gradient(var(--c),transparent)}
.bd-lb.act .cj,.bd-lb:hover .cj{border-color:var(--c);box-shadow:0 0 0 1px var(--c),0 8px 22px rgba(0,0,0,.45)}
.bd-lb.dim{opacity:.35}
.bd-lb.ret .cj{border-style:dashed;border-color:#ef4444}.bd-lb.ret .k{background:#ef4444;color:#fff}
@media(max-width:760px){.bd-lb small{display:none}.bd-lb b{font-size:10px}.bd-lb .t{padding:3px 6px}}
#bd{position:fixed;z-index:32;right:14px;top:14px;width:372px;max-height:calc(100vh - 118px);display:none;flex-direction:column;font-family:var(--ui-sans,Inter,system-ui,sans-serif);color:#eef1f2;border-radius:18px;overflow:hidden}
#bd.on{display:flex;animation:bdIn .45s cubic-bezier(.2,.8,.2,1)}
@keyframes bdIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
body.bd-on #dock,body.bd-on #hid-red{display:none!important}
#bd header,#bd .tabs,#bd .pie{flex:none}#bd .cuerpo{flex:1 1 auto;min-height:0}
#bd header{position:relative;padding:16px 18px 12px}
#bd .cerrar{position:absolute;right:12px;top:12px;width:28px;height:28px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:#dfe4e6;font-size:16px;line-height:1;font-family:inherit;cursor:pointer}
#bd .cerrar:hover{background:rgba(255,255,255,.16)}#bd .cerrar:focus-visible{outline:2px solid #86efac;outline-offset:1px}
#bd h2{margin:0 36px 4px 0;font-weight:600;font-size:20px;letter-spacing:-.01em}
#bd .lead{margin:0;font-size:13px;line-height:1.45;color:#c3cace}
#bd .ruta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:12px 0 0;padding:0;list-style:none}
#bd .ruta li{position:relative;padding:9px 9px 8px;border-radius:12px;background:rgba(255,255,255,.06)}
#bd .ruta li b{display:block;font-size:12.5px;font-weight:600}#bd .ruta li span{display:block;font-size:10.5px;line-height:1.3;color:#aab3b8;margin-top:2px}
#bd .ruta li i{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#86efac;color:#0d1a12;font-size:10.5px;font-weight:600;line-height:1;font-style:normal;margin-bottom:5px}
#bd .tot{margin:10px 0 0;font-size:11.5px;color:#aab3b8}#bd .tot b{color:#fff;font-weight:600}
#bd .tabs{display:flex;gap:4px;padding:0 14px 8px}
#bd .tabs button{flex:1;border:0;background:none;color:#aab3b8;font-size:12px;font-weight:500;font-family:inherit;padding:7px 4px;border-radius:999px;cursor:pointer}
#bd .tabs button[aria-selected="true"]{background:rgba(255,255,255,.12);color:#fff}
#bd .tabs button:focus-visible{outline:2px solid #86efac;outline-offset:-2px}
#bd .cuerpo{overflow:auto;padding:4px 10px 12px;overscroll-behavior:contain;scrollbar-width:thin}
#bd .it{display:grid;grid-template-columns:10px 1fr auto;gap:1px 10px;align-items:baseline;padding:9px 8px;border-radius:12px;cursor:pointer}
#bd .it:hover,#bd .it.act{background:rgba(255,255,255,.07)}
#bd .it:focus-visible{outline:2px solid #86efac;outline-offset:-2px}
#bd .it i{width:9px;height:9px;border-radius:50%;background:var(--c);align-self:center;font-size:0}
#bd .it b{font-size:13px;font-weight:500}
#bd .it em{font-size:11px;color:#c3cace;font-style:normal;text-align:right;white-space:nowrap}
#bd .it p{grid-column:2 / 4;margin:2px 0 0;font-size:11.5px;line-height:1.4;color:#a3acb1}
#bd .it .x{display:none;color:#d3d9dc;margin-top:4px}#bd .it.act .x{display:block}
#bd .it .tec{display:block;margin-top:3px;color:#9fd8f5}
#bd .sub{font-size:11px;font-weight:600;color:#8e989e;margin:12px 8px 2px}
#bd .nota{font-size:11px;color:#8e989e;line-height:1.45;margin:10px 8px 0}
#bd .ind{margin:4px 6px 6px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05);font-size:12px;color:#c3cace;line-height:1.45}
#bd .pasos{margin:4px 8px;padding:0;list-style:none;counter-reset:p}#bd .pasos li{counter-increment:p;display:grid;grid-template-columns:20px 1fr;gap:8px;padding:6px 0;font-size:12px;color:#c3cace;line-height:1.4}
#bd .pasos li::before{content:counter(p);display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:rgba(212,163,115,.25);color:#f2d3b1;font-size:11px;font-weight:600}
#bd .pasos li b{color:#fff;font-weight:500}
#bd .pie{display:flex;gap:6px;padding:10px 12px;flex-wrap:wrap}
#bd .pie button,#bd .pie a{flex:1;min-width:0;height:34px;border-radius:999px;cursor:pointer;font-size:12px;font-weight:500;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap;padding:0 10px}
#bd .go{flex:1 1 100%!important;border:0;background:#86efac;color:#0d1a12}#bd .go:hover{background:#a7f3c4}
#bd .sec2{border:0;background:rgba(255,255,255,.08);color:#dfe4e6;text-decoration:none}#bd .sec2:hover{background:rgba(255,255,255,.14)}
#bd .pie button:focus-visible,#bd .pie a:focus-visible{outline:2px solid #86efac;outline-offset:1px}#bd-cap{position:fixed;z-index:33;left:50%;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 84px);transform:translateX(-50%);width:min(480px,calc(100vw - 24px));display:none;
  font-family:Inter,system-ui,sans-serif;color:#eef1f3;background:rgba(10,13,17,.86);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:11px 14px 12px;box-shadow:0 16px 40px rgba(0,0,0,.4)}
#bd-cap.on{display:block;animation:bdCap .4s cubic-bezier(.2,.8,.2,1)}
@keyframes bdCap{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
#bd-cap .tp{display:flex;align-items:center;gap:8px;font:500 10.5px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.12em;color:#4ade80}
#bd-cap .tp span:nth-child(2){flex:1;height:2px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}
#bd-cap .tp span:nth-child(2) i{display:block;height:100%;width:0;background:#4ade80}
#bd-cap button{width:28px;height:28px;border-radius:7px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#cfd5d9;cursor:pointer;font:400 16px/1 Inter,system-ui,sans-serif}
#bd-cap h3{margin:8px 0 3px;font:600 15px Inter,system-ui,sans-serif}
#bd-cap p{margin:0;font-size:12.5px;line-height:1.5;color:#b9c1c6}
@media(max-width:1100px){#bd-cap{bottom:auto;top:calc(max(10px,env(safe-area-inset-top)) + 10px)}}
@media(max-width:760px){
  #bd{left:8px;right:8px;width:auto;top:auto;bottom:calc(max(8px,env(safe-area-inset-bottom)) + 66px);max-height:52vh}
  #bd.min .cuerpo,#bd.min .tabs,#bd.min .ruta,#bd.min .tot,#bd.min .lead{display:none}
  #bd.min h2::after{content:' ▴';color:#7b858c;font-size:12px}
  #bd header{padding:12px 14px 8px;cursor:pointer}#bd h2{font-size:16px;margin:0 36px 3px 0}#bd .ruta li span{display:none}
  body.bd-on #esc{display:none}
}
@media(prefers-reduced-motion:reduce){#bd.on,#bd-cap.on{animation:none}}`;
  document.head.appendChild(css);
  const ETQ = [];
  const etiqueta = (n, sub, col, pos, grupoE, fn, num, cls = '') => { const d = document.createElement('div'); d.className = 'bd-lb ' + cls; d.style.setProperty('--c', col);
    d.innerHTML = `<div class="cj"><span class="k">${num}</span><span class="t"><b>${n}</b>${sub ? `<small>${sub}</small>` : ''}</span></div><i class="pt"></i>`;
    d.setAttribute('role', 'button'); d.tabIndex = 0; d.onclick = fn; d.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
    document.body.appendChild(d); const o = { d, pos, g: grupoE, k: null }; ETQ.push(o); return o; };
  const LBP = {};
  PROG.forEach((p, i) => { const ps = POS[p.k]; if (!ps) return; LBP[p.k] = etiqueta(p.n, p.g + (p.a ? ' · ' + p.a : ''), p.c, [ps[0], ps[1], ps[2]], ['sol', 'comp', 'campo'].includes(p.k) ? 'huerta' : 'dist', () => enfocar(p.k), String(i + 1).padStart(2, '0')); LBP[p.k].k = p.k; });
  if (POS.sol) LBP.sol.pos = POS.sol;
  RET.forEach(r => etiqueta(r.n, 'se retira', '#ef4444', [r.c[0], r.h + 5, r.c[1]], 'dist', () => volarA(r.c, 90), r.k, 'ret'));
  ACC.forEach(a => etiqueta(a.n, '', '#fbbf24', [a.p[0], 11, a.p[1]], 'sx', () => volarA(a.p, 160), a.k));
  const FPOS = { abeja: [FA.apiario.p, 4], abejorro: [FA.abejorro.p, 4], colibri: [flores[0] || FA.apiario.p, 3], mariposa: [poli, ED[23].h + 4], ave: [FA.nidos[0], 5], cernicalo: [FA.perchas[0], 8], lechuza: [[silo[0] + 2, silo[1]], ED[6].h + 5], murcielago: [FA.murc[0], 8], rana: [FA.charca.p, 3], mariquita: [FA.hoteles[0], 3.5], lombriz: [C_COMP, 6] };
  const LBF = {}; INTER.forEach((I, i) => { const [p, y] = FPOS[I.k]; LBF[I.k] = etiqueta(I.n, I.mod, I.c, [p[0], y, p[1]], 'fauna', () => enfocarFauna(I.k), 'F' + (i + 1)); });
  let tab = 'dist';
  const verGrupoEtq = () => { const g = { dist: ['dist'], sx: ['sx'], fauna: ['fauna'], huerta: ['huerta', 'fauna'], ciclo: ['huerta', 'sx'] }[tab] || ['dist']; ETQ.forEach(e => { e.on = g.includes(e.g); }); };

  const pan = document.createElement('section'); pan.id = 'bd'; pan.setAttribute('aria-label', 'Bavaria Común, distrito de tecnologías convergentes');
  const fila = (num, col, n, a, d, x, data, tec) => `<div class="it" ${data} tabindex="0" role="button" style="--c:${col}"><i>${num}</i><b>${n}</b><em>${a || ''}</em><p>${d}${tec ? `<span class="tec">${tec}</span>` : ''}${x ? `<span class="x">${x}</span>` : ''}</p></div>`;
  const per = (p) => p.p ? `${fmt(p.p)} pers./día` : '';
  const uso = (p) => fila('', p.c, p.n, [p.a, per(p)].filter(Boolean).join(' · '), p.d, p.x, `data-k="${p.k}"`);
  const PER_DIA = PROG.reduce((s, p) => s + (p.p || 0), 0);
  const TABS = {
    dist: () => `<div class="sub" style="margin-top:2px">Aprender</div>` + PROG.filter(p => ['inst', 'cogn', 'foro', 'torre'].includes(p.k)).map(uso).join('') +
      `<div class="sub">Investigar (nano, bio, info)</div>` + PROG.filter(p => ['bio', 'nano', 'datos', 'poli'].includes(p.k)).map(uso).join('') +
      `<div class="sub">Producir y vender</div>` + PROG.filter(p => ['comp', 'pos', 'mer', 'alim', 'inc', 'sol'].includes(p.k)).map(uso).join('') +
      `<div class="sub">Se retira</div>` + RET.map(r => fila('', '#ef4444', r.n, '', r.pone, '', `data-ret="${r.k}"`)).join('') +
      `<p class="nota">Se reutilizan las naves de la fábrica; lo nuevo son invernaderos, cubiertas livianas y plazas. Áreas y personas son metas de anteproyecto.</p>`,
    huerta: () => `<div class="ind">${TIPOS_H.length} tipos de huerta en ${ZONAS.length} claros · ${HA.toFixed(1).replace('.', ',')} ha en los claros del bosque, sin talar ningún árbol. Cada una tiene su aula al aire libre junto al pasaje.</div>` +
      TIPOS_H.map(t => fila('', t.col, t.n, (t.n2 > 1 ? t.n2 + ' lugares · ' : '') + t.ha.toFixed(2).replace('.', ',') + ' ha', t.d, '', `data-zona="${t.z}"`)).join('') +
      `<div class="sub">Ensayos de la huerta docente</div>` + MODS.filter(m => m.c).map(m => fila('', '#86efac', m.n, '', m.q, '', `data-mod="${m.k}"`)).join(''),
    ciclo: () => `<div class="ind"><b style="color:#fff">${PK.comp.n} · ${PK.comp.a}.</b> ${PK.comp.d}</div><ol class="pasos">
      <li><span><b>Llega</b> lo que sobra del mercado, la cocina y las huertas; se pesa en la báscula.</span></li>
      <li><span><b>Se apila</b> en hileras con material seco y se voltea cada semana; las sondas miden la temperatura.</span></li>
      <li><span><b>Las lombrices</b> terminan el trabajo en el lombricario: sale humus.</span></li>
      <li><span><b>Se cierne</b> en la criba y se empaca en la bodega.</span></li>
      <li><span><b>Vuelve a la tierra:</b> abono para las huertas de Bavaria, de los parques y de las casas.</span></li></ol>` + uso(PK.sol),
    fauna: () => `<div class="ind">La fauna que llega trabaja para las huertas: poliniza, controla plagas y hace suelo.</div>` +
      INTER.map(I => fila('', I.c, I.n, '', `${I.mod}. ${I.serv}`, '', `data-f="${I.k}"`)).join('')
  };
  pan.innerHTML = `<header><button type="button" class="cerrar" aria-label="Cerrar Bavaria Común">&#215;</button><h2>Bavaria Común</h2>
      <p class="lead">Aquí se aprende a cultivar. Después, cada quien lo lleva a su casa, a su colegio y a su parque.</p>
      <ol class="ruta"><li><i>1</i><b>Aprendo</b><span>escuela, laboratorios y cocina</span></li><li><i>2</i><b>Practico</b><span>${TIPOS_H.length} tipos de huerta para enseñar</span></li><li><i>3</i><b>Lo llevo a casa</b><span>terrazas, parques y colegios</span></li></ol>
      <p class="tot"><b>${fmt(PER_DIA)}</b> personas al día · <b>${HA.toFixed(1).replace('.', ',')} ha</b> de huertas · <b>${fmt(PK.comp.m2)} m²</b> de compostaje</p></header>
    <nav class="tabs" role="tablist">${[['dist', 'Usos'], ['huerta', 'Huertas'], ['ciclo', 'Compost'], ['fauna', 'Fauna']].map(([k, n], i) => `<button type="button" role="tab" data-t="${k}" aria-selected="${!i}">${n}</button>`).join('')}</nav>
    <div class="cuerpo" role="tabpanel"></div>
    <div class="pie"><button type="button" class="go" id="bd-go">Seguir una cosecha</button><a class="sec2" id="bd-dentro" href="bavaria_interior.html?e=bio">Por dentro</a><a class="sec2" id="bd-pts" href="bavaria_puntos.html">En puntos</a><button type="button" class="sec2" id="bd-ver">Vista general</button></div>`;  document.body.appendChild(pan);
  const cuerpo = pan.querySelector('.cuerpo');
  let sxObj = 1, focoFauna = null;
  const pintar = () => { cuerpo.innerHTML = TABS[tab](); pan.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab))); cuerpo.scrollTop = 0; verGrupoEtq(); };
  pan.querySelector('.tabs').onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; pintar(); focoFauna = null; resaltar(null);
    if (tab === 'sx') volar(...vistaSx()); else if (tab === 'fauna') volarA(C_CAMPO, 260); else if (tab === 'huerta') volarA(C_DOC, 260); else if (tab === 'ciclo') enfocar('comp', true); else general(); };
  const clicFila = (e) => { const sw = e.target.closest('[data-sx]'); if (sw) { sxObj = +sw.dataset.sx; cuerpo.querySelectorAll('[data-sx]').forEach(b => b.setAttribute('aria-pressed', String(b === sw))); return; }
    const it = e.target.closest('.it'); if (!it) return; cuerpo.querySelectorAll('.it.act').forEach(x => x !== it && x.classList.remove('act')); it.classList.toggle('act');
    if (it.dataset.k) enfocar(it.dataset.k, true); else if (it.dataset.f) enfocarFauna(it.dataset.f, true); else if (it.dataset.ret) { const r = RET.find(q => q.k === it.dataset.ret); volarA(r.c, 90); }
    else if (it.dataset.mod) { const m = MODS.find(q => q.k === it.dataset.mod); if (m.c) volarA(m.c, 50); } else if (it.dataset.zona) { const z = ZONAS.find(q => q.k === it.dataset.zona); volarA(z.c, 120); } else if (it.dataset.acc) volarA(ACC.find(a => a.k === it.dataset.acc).p, 160); };
  cuerpo.addEventListener('click', clicFila); cuerpo.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clicFila(e); } });
  pan.querySelector('.cerrar').onclick = (e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('bav-cerrar')); };
  pan.querySelector('header').addEventListener('click', () => { if (innerWidth < 760) pan.classList.toggle('min'); });
  pan.querySelector('#bd-go').onclick = () => (paso >= 0 ? parar() : irPaso(0));
  pan.querySelector('#bd-ver').onclick = () => { parar(); general(); };

  /* ---------- cámara ---------- */
  let vuelo = 0;
  function volar(p1, t1, ms = 1500) {
    const o = T3.orbit; cancelAnimationFrame(vuelo);
    if (RMQ.matches) { T3.camera.position.copy(p1); o.target.copy(t1); o.update(); return; }
    const p0 = T3.camera.position.clone(), q0 = o.target.clone(), ini = performance.now();
    const f = () => { const k = Math.min(1, (performance.now() - ini) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; T3.camera.position.lerpVectors(p0, p1, e); o.target.lerpVectors(q0, t1, e); o.update(); if (k < 1) vuelo = requestAnimationFrame(f); };
    f();
  }
  const desplaza = (p1, t, d) => { const dir = t.clone().sub(p1).setY(0).normalize(), der = new THREE.Vector3(-dir.z, 0, dir.x);
    if (innerWidth > 760) { const k = d * 0.3; p1.addScaledVector(der, k); t.addScaledVector(der, k); } else { const k = -d * 0.22; p1.addScaledVector(dir, k); t.addScaledVector(dir, k); } };
  function volarA(c, dist, alto) { const t = new THREE.Vector3(c[0], 0, c[1]), a = -ANG + 0.9, p1 = new THREE.Vector3(c[0] + Math.sin(a) * dist, alto || dist * 0.75, c[1] + Math.cos(a) * dist); desplaza(p1, t, dist); volar(p1, t); }
  function general() { const c = M(9335, 3020), sm = MOV ? 1.5 : 1, t = new THREE.Vector3(c[0], 0, c[1]), p1 = new THREE.Vector3(c[0] + 170 * sm, 250 * sm, c[1] + 330 * sm); desplaza(p1, t, 330 * sm); volar(p1, t); }
  function vistaSx() { const c = M(9319, 2943), sm = MOV ? 1.4 : 1, t = new THREE.Vector3(c[0], 0, c[1]), p1 = new THREE.Vector3(c[0] + 300 * sm, 1250 * sm, c[1] + 700 * sm); desplaza(p1, t, 900 * sm); return [p1, t, 1800]; }
  function resaltar(k) { SHELL.forEach(s => { s.dim = !!k && s.k !== k; }); Object.entries(LBP).forEach(([kk, o]) => { o.d.classList.toggle('act', kk === k); o.d.classList.toggle('dim', !!k && kk !== k); }); }
  function enfocar(k, desdePanel) { { const pd = document.getElementById('bd-dentro'); if (pd && ['inst', 'bio', 'nano', 'datos', 'cogn', 'foro', 'poli', 'pos', 'mer', 'inc', 'alim', 'torre'].includes(k)) { pd.href = 'bavaria_interior.html?e=' + k; pd.textContent = 'Entrar: ' + (PK[k] ? PK[k].n.split(' ')[0] : 'edificio'); } }
    resaltar(k); const ps = POS[k]; if (!ps) return;
    const dist = { inst: 190, bio: 220, nano: 140, datos: 190, cogn: 180, foro: 260, poli: 150, pos: 150, mer: 140, inc: 140, alim: 140, torre: 160, campo: 260, comp: 95, sol: 70 }[k] || 160;
    volarA([ps[0], ps[2]], dist);
    if (!desdePanel) { const t = ['campo'].includes(k) ? 'huerta' : ['comp', 'sol'].includes(k) ? 'ciclo' : 'dist'; if (t !== tab) { tab = t; pintar(); } const it = cuerpo.querySelector(`[data-k="${k}"]`); if (it) { it.classList.add('act'); it.scrollIntoView({ block: 'nearest', behavior: RMQ.matches ? 'auto' : 'smooth' }); } }
  }
  function enfocarFauna(k, desdePanel) {
    focoFauna = k; INTER.forEach((I, i) => { FOCo[i] = I.k === k ? 1 : 0.12; }); const [p] = FPOS[k]; volarA(p, k === 'lechuza' ? 200 : 110);
    if (!desdePanel) { if (tab !== 'fauna') { tab = 'fauna'; pintar(); } const it = cuerpo.querySelector(`[data-f="${k}"]`); if (it) { it.classList.add('act'); it.scrollIntoView({ block: 'nearest' }); } }
  }

  /* ---------- seguir una cosecha ---------- */
  const cap = document.createElement('section'); cap.id = 'bd-cap'; cap.setAttribute('aria-live', 'polite');
  cap.innerHTML = `<div class="tp"><span></span><span><i></i></span><button type="button" data-a="p" aria-label="Paso anterior">&#8249;</button><button type="button" data-a="n" aria-label="Paso siguiente">&#8250;</button><button type="button" data-a="x" aria-label="Terminar">&#215;</button></div><h3></h3><p></p>`;
  document.body.appendChild(cap);
  cap.onclick = (e) => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'p') irPaso(paso - 1); else if (b.dataset.a === 'n') irPaso(paso + 1); else parar(); };
  let paso = -1, tPaso = 0, cajaDe = null; const DUR = 6500;
  function irPaso(i) {
    if (i < 0) i = 0; if (i >= COSECHA.length) { parar(); return; }
    const prev = paso >= 0 ? COSECHA[paso] : null; paso = i; const P = COSECHA[i];
    cap.querySelector('.tp span').textContent = `${String(i + 1).padStart(2, '0')} / ${String(COSECHA.length).padStart(2, '0')}`; cap.querySelector('h3').textContent = P.t; cap.querySelector('p').textContent = P.x; cap.classList.add('on');
    const ini = prev ? prev.p[prev.p.length - 1] : P.p[0], pts = [ini, ...P.p].map(q => { const w = M(q[0], q[1]); return new THREE.Vector3(w[0], 2.2, w[1]); });
    cajaDe = pts.length > 1 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : null; caja.visible = true; if (!cajaDe) caja.position.copy(pts[0]);
    resaltar(P.k); const fin = P.p[P.p.length - 1], w = M(fin[0], fin[1]);
    if (P.k === 'datos') enfocar('datos', true); else volarA(w, P.k === 'pos' ? 150 : P.k === 'mer' ? 120 : P.k === 'bio' ? 200 : 90);
    tPaso = performance.now(); pan.querySelector('#bd-go').textContent = 'Detener recorrido';
  }
  function parar() { if (paso < 0) return; paso = -1; cap.classList.remove('on'); caja.visible = false; resaltar(null); pan.querySelector('#bd-go').textContent = 'Seguir una cosecha'; }
  addEventListener('keydown', (e) => { if (paso >= 0 && e.key === 'Escape') parar(); });

  /* ---------- animación ---------- */
  let raf = 0, ult = performance.now(), tOn = 0, on = false; const V = new THREE.Vector3();
  const ease = (k) => { k = Math.max(0, Math.min(1, k)); return 1 - Math.pow(1 - k, 3); };
  function cuadro() {
    raf = requestAnimationFrame(cuadro); const ahora = performance.now(), dt = Math.min(0.1, (ahora - ult) / 1000); ult = ahora;
    const mov = !RMQ.matches, t = RMQ.matches ? 99 : (ahora - tOn) / 1000; if (mov) TU.value += dt;
    if ((cuadro.n = (cuadro.n || 0) + 1) % 12 === 0) PLANTAS();
    // secuencia de entrada: edificios (0-2,4 s), sintaxis (1,6-3,4 s), pasajes (2-4,5 s), red de datos (2,8-4,6 s), fauna (3,8-5 s)
    SHELL.forEach(s => { s.mat.uniforms.uRise.value = ease((t - s.orden * 0.18) / 1.0); const objD = s.dim ? 0.3 : 1; s.mat.uniforms.uDim.value += (objD - s.mat.uniforms.uDim.value) * Math.min(1, dt * 5); s.ml.opacity = 0.9 * s.mat.uniforms.uDim.value * s.mat.uniforms.uRise.value; });
    const sxDest = sxObj * ease((t - 1.6) / 1.8); SXU.uMix.value += (sxDest - SXU.uMix.value) * Math.min(1, dt * 3); SXU.uDraw.value = ease((t - 2) / 2.5); SXU.uVis.value = ease((t - 0.8) / 0.8);
    RD.uDraw.value = ease((t - 2.8) / 1.8); RD.uVis.value = ease((t - 2.8) / 0.6);
    UBIO.uVis.value = ease((t - 3.8) / 1.2); for (let i = 0; i < INTER.length; i++) { const obj = focoFauna ? FOCo[i] : 1; FOC[i] += (obj - FOC[i]) * Math.min(1, dt * 4); INTER[i].ln.material.opacity = 0.22 * FOC[i] * UBIO.uVis.value; }
    LUCES.forEach((l, i) => { l.material.emissiveIntensity = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(ahora / 300 + i)); });
    CAM(dt, mov && SXU.uMix.value > 0.5); CARGA(dt, mov);
    ACC.forEach(a => { const s = 1 + 0.25 * Math.sin(ahora / 350); a.ani.scale.set(s, 1, s); });
    if (paso >= 0) { const k = Math.min(1, (ahora - tPaso) / DUR); cap.querySelector('.tp i').style.width = (k * 100).toFixed(1) + '%';
      if (cajaDe) { const kk = Math.min(1, (ahora - tPaso) / 2600), e = kk * kk * (3 - 2 * kk); caja.position.copy(cajaDe.getPointAt(e)); } caja.rotation.y += dt; halo.scale.setScalar(1 + 0.2 * Math.sin(ahora / 200)); if (k >= 1) irPaso(paso + 1); }
    const cam = T3.camera, Wd = innerWidth, H = innerHeight;
    for (const e of ETQ) { let ok = e.on && t > 1.2; if (ok) { V.set(e.pos[0], e.pos[1], e.pos[2]).project(cam); ok = V.z < 1 && Math.abs(V.x) < 1.02 && Math.abs(V.y) < 1.02; }
      e.d.style.display = ok ? 'block' : 'none'; if (ok) e.d.style.transform = `translate(${((V.x + 1) / 2 * Wd - 10).toFixed(1)}px,${((1 - V.y) / 2 * H - e.d.offsetHeight - 18).toFixed(1)}px)`; }
  }

  let hOn = false;
  const verHu = () => { gHu.visible = on || hOn; if (gHu.visible) PLANTAS(true); };
  return {
    ver(v) {
      if (v === on) return; on = v; grupo.visible = v; verHu();
      const bv = T3.bavaria; if (bv && bv.userData) { if (bv.userData.demoler) bv.userData.demoler.visible = !v; if (bv.userData.mallasHuerta) bv.userData.mallasHuerta.forEach(m => { m.visible = false; }); }
      pan.classList.toggle('on', v); document.body.classList.toggle('bd-on', v);
      if (v) { pan.classList.toggle('min', innerWidth < 760); tab = 'dist'; sxObj = 1; focoFauna = null; pintar(); tOn = ult = performance.now(); SXU.uMix.value = 0; if (!raf) cuadro(); PLANTAS(true); general(); }
      else { parar(); cancelAnimationFrame(raf); raf = 0; ETQ.forEach(e => { e.d.style.display = 'none'; }); }
    },
    // solo las huertas de enseñanza y la planta de compostaje (con la propuesta se ven siempre, aunque la estrategia escogida sea otra)
    verHuertas(v) { hOn = !!v; const bv = T3.bavaria; if (hOn && bv && bv.userData && bv.userData.mallasHuerta) bv.userData.mallasHuerta.forEach(m => { m.visible = false; }); verHu(); },
    get on() { return on; }, grupo, gHuertas: gHu, sitio: SITIO, ha: HA, zonas: ZONAS.map(z => ({ n: z.n, c: z.c, ha: z.ha })), compost: C_PLANTA
  };
}
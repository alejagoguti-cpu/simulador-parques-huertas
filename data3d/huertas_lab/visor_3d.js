/* ============ SECCIÓN 8: VISOR 3D INTERACTIVO EN THREE.JS + ANIMACIONES DE PROCESOS ============
   Renderiza dentro de la escena existente T3 sin reemplazar nada:
   - Los 576 parques clasificados de Kennedy (resaltado + selección directa por clic 3D)
   - Capa 3D de zonificación del parque activo (Apta verde · Condicionada ámbar · No apta roja)
   - Todos los módulos de las 7 tipologías (canteros alomados 15 cm, jardineras elevadas 80 cm, hidroponía NFT,
     invernadero, abonera 3 compartimentos, bodega, cisterna lluvia, pérgola/aula, bancas, mesas, polinizadores,
     infiltración, hotel de insectos, estación meteo, señalización, separación de residuos, cerco 1,50 m INTA y cortaviento S-O)
   - Animaciones vinculadas a datos reales:
     1) Aparición constructiva progresiva por capas al generar/cambiar escenario A-B-C
     2) Crecimiento vegetal continuo según Día del ciclo (0–180 d): semilla → germinación → trasplante → fruto → residuo
     3) Flujo de agua por la red de riego por goteo (2–3 líneas por cantero)
     4) Dirección solar astronómica real para Bogotá (lat 4.63°N) rotando luz y sombras en la escena
     5) Transformación progresiva de materia orgánica en las 3 bahías de la abonera. */

import { ESPECIES } from './datos_agronomia.js?v=1';
import { HATCHES_RAYON } from './planos_export.js?v=2';

const TIPO_COL = {
  'PARQUE METROPOLITANO': '#4d9e74',
  'PARQUE ZONAL': '#5b8fb9',
  'PARQUE VECINAL': '#7ba65b',
  'PARQUE DE BOLSILLO': '#c79b52'
};

export function crearVisor3D({ THREE, T3, PARQUES, onPickPark, onPickElement }) {
  const RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const grupo = new THREE.Group();
  grupo.name = 'parques-huertas-lab';
  grupo.visible = false;
  T3.scene.add(grupo);

  const gParques = new THREE.Group(); gParques.name = 'lab-parques'; grupo.add(gParques);
  const gAptitud = new THREE.Group(); gAptitud.name = 'lab-aptitud'; grupo.add(gAptitud);
  const gBorde = new THREE.Group();   gBorde.name = 'lab-borde';     grupo.add(gBorde);
  const gHuerta = new THREE.Group();  gHuerta.name = 'lab-huerta';   grupo.add(gHuerta);

  const YG = () => (T3.sueloY != null ? T3.sueloY : 0.35) + 0.16;
  const ANIS = Math.min(8, T3.renderer.capabilities.getMaxAnisotropy ? T3.renderer.capabilities.getMaxAnisotropy() : 4);
  let sem = 42;
  const rnd = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);

  const lienzo = (w, h, fn, rep = true) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    fn(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = ANIS;
    if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };

  // Texturas procedurales compartidas (cero dependencias externas)
  const TEX = {
    viruta: lienzo(256, 256, (g, w, h) => {
      g.fillStyle = '#8b6d4a'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 3200; i++) {
        const v = rnd();
        g.fillStyle = v < 0.35 ? 'rgba(72,50,28,.65)' : v < 0.75 ? 'rgba(176,142,96,.6)' : 'rgba(218,194,142,.6)';
        g.save(); g.translate(rnd() * w, rnd() * h); g.rotate(rnd() * 3.14);
        g.fillRect(0, 0, 3 + rnd() * 7, 1.2 + rnd() * 1.8); g.restore();
      }
    }),
    adoquin: lienzo(256, 256, (g, w, h) => {
      g.fillStyle = '#c8bfb2'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 16; r++) for (let c = -1; c < 9; c++) {
        const x = c * 32 + (r % 2) * 16, s = 150 + Math.floor(rnd() * 32);
        g.fillStyle = `rgb(${s + 24},${s - 22},${s - 38})`;
        g.fillRect(x + 1.5, r * 16 + 1.5, 29, 13);
      }
    }),
    ladrillo: lienzo(256, 128, (g, w, h) => {
      g.fillStyle = '#b9afa2'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 4; r++) for (let c = -1; c < 5; c++) {
        const x = c * 64 + (r % 2) * 32, v = Math.floor(rnd() * 24);
        g.fillStyle = `rgb(${155 + v},${76 + Math.floor(v * 0.5)},${50 + Math.floor(v * 0.4)})`;
        g.fillRect(x + 2, r * 32 + 2, 60, 28);
      }
    }),
    madera: lienzo(512, 128, (g, w, h) => {
      for (let k = 0; k < 2; k++) {
        const y = k * 64;
        g.fillStyle = `rgb(${88 + rnd() * 22},${64 + rnd() * 16},${42 + rnd() * 10})`;
        g.fillRect(0, y, w, 64);
        for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(28,18,10,${0.18 + rnd() * 0.28})`; g.beginPath(); g.moveTo(0, y + rnd() * 64); g.lineTo(w, y + rnd() * 64); g.stroke(); }
        g.fillStyle = 'rgba(18,12,6,.7)'; g.fillRect(0, y, w, 3);
      }
    }),
    piedra: lienzo(256, 128, (g, w, h) => {
      g.fillStyle = '#6f6b64'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 42; i++) {
        const v = 105 + Math.floor(rnd() * 55); g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
        g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 18 + rnd() * 22, 12 + rnd() * 14, rnd(), 0, 7); g.fill();
        g.strokeStyle = 'rgba(40,38,35,.55)'; g.lineWidth = 2; g.stroke();
      }
    }),
    tierra: lienzo(256, 256, (g, w, h) => {
      g.fillStyle = '#402c1f'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2800; i++) {
        const v = rnd();
        g.fillStyle = v < 0.55 ? 'rgba(24,15,9,.6)' : v < 0.9 ? 'rgba(84,58,38,.55)' : 'rgba(130,104,70,.45)';
        g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 2, 2 + rnd() * 2);
      }
    }),
    romboidal: lienzo(128, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.strokeStyle = '#cbd5e1'; g.lineWidth = 2.6;
      for (let x = -h; x < w + h; x += 32) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke();
        g.beginPath(); g.moveTo(x + h, 0); g.lineTo(x, h); g.stroke();
      }
    }),
    mallaFina: lienzo(128, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.strokeStyle = '#64748b'; g.lineWidth = 1.8;
      for (let i = 0; i <= 128; i += 16) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
        g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
      }
    }),
    compList: lienzo(128, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let y = 0; y < h; y += 26) { g.fillStyle = `rgb(${124 + rnd() * 24},${90 + rnd() * 16},${56 + rnd() * 10})`; g.fillRect(0, y, w, 19); }
    })
  };

  const mStd = (c, ex = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.88, metalness: 0, ...ex });
  const limpiar = (gr) => {
    while (gr.children.length) {
      const ch = gr.children.pop();
      if (ch.geometry && !ch.geometry.userData?.shared) ch.geometry.dispose();
      if (ch.material) {
        if (Array.isArray(ch.material)) ch.material.forEach(m => m.dispose());
        else ch.material.dispose();
      }
      if (ch.children && ch.children.length) limpiar(ch);
    }
  };

  /* ---------- 1. Los 576 parques de Kennedy en 3D ---------- */
  const pickParques = [];
  {
    const byT = {};
    for (const p of PARQUES) (byT[p.tipo] = byT[p.tipo] || []).push(p);
    const yP = YG() + 0.05;
    for (const [tipo, lista] of Object.entries(byT)) {
      const col = TIPO_COL[tipo] || '#a3e635';
      const lpos = [];
      for (const p of lista) {
        const P = p.poly;
        for (let i = 0; i < P.length; i++) {
          const a = P[i], b = P[(i + 1) % P.length];
          lpos.push(a[0], yP + 0.2, a[1], b[0], yP + 0.2, b[1]);
        }
        try {
          const sh = new THREE.Shape(P.map(q => new THREE.Vector2(q[0], -q[1])));
          const sg = new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2).translate(0, yP, 0);
          const m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({
            color: col, transparent: true, opacity: 0.19, depthWrite: false, side: THREE.DoubleSide,
            polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6, toneMapped: false
          }));
          m.userData.park = p; m.renderOrder = 4;
          gParques.add(m); pickParques.push(m);
        } catch (e) {}
      }
      if (lpos.length) {
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lpos, 3));
        const lm = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.82, toneMapped: false }));
        lm.userData.tipo = tipo; lm.renderOrder = 5;
        gParques.add(lm);
      }
    }
  }

  function filtrarParques(tipo) {
    for (const ch of gParques.children) {
      const tp = ch.userData.park ? ch.userData.park.tipo : ch.userData.tipo;
      if (tp) ch.visible = (tipo === 'TODOS' || tp === tipo);
    }
  }

  /* ---------- 2. Capa de Zonificación 3D (Apta / Condicionada / No apta) + Borde activo ---------- */
  function mostrarDiagnostico3D(park, diag, verZonas = true) {
    limpiar(gBorde);
    limpiar(gAptitud);
    if (!park) return;
    const y = YG() + 0.34, pts = [];
    for (let i = 0; i < park.poly.length; i++) {
      const a = park.poly[i], b = park.poly[(i + 1) % park.poly.length];
      pts.push(a[0], y, a[1], b[0], y, b[1]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#fde047', toneMapped: false }));
    l.renderOrder = 10; gBorde.add(l);

    gAptitud.visible = !!verZonas;
    if (!diag || !diag.celdas || !diag.celdas.length) return;
    const obj = new THREE.Object3D(), col = new THREE.Color();
    const im = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.21, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 }),
      diag.celdas.length
    );
    diag.celdas.forEach((c, i) => {
      obj.position.set(c.x, YG() + 0.12, c.z);
      obj.rotation.set(0, 0, 0);
      obj.scale.set(c.s * 0.92, 1, c.s * 0.92);
      obj.updateMatrix();
      im.setMatrixAt(i, obj.matrix);
      im.setColorAt(i, col.set(c.clase === 'apta' ? '#529e6c' : c.clase === 'cond' ? '#cfa459' : '#c27168'));
    });
    im.renderOrder = 6;
    gAptitud.add(im);
  }

  /* ---------- Generador botánico 3D reconocible por especie (geometrías compuestas con vertexColors) ---------- */
  const vegGeoCache = new Map();
  function mergeParts(parts) {
    let totalVerts = 0;
    const norm = parts.map(({ g, col }) => {
      const ng = g.index ? g.toNonIndexed() : g;
      if (!ng.attributes.normal) ng.computeVertexNormals();
      totalVerts += ng.attributes.position.count;
      return { g: ng, c: new THREE.Color(col) };
    });
    const pos = new Float32Array(totalVerts * 3);
    const nrm = new Float32Array(totalVerts * 3);
    const clr = new Float32Array(totalVerts * 3);
    let off = 0;
    for (const { g, c } of norm) {
      const p = g.attributes.position.array;
      const n = g.attributes.normal.array;
      const cnt = g.attributes.position.count;
      pos.set(p, off * 3);
      nrm.set(n, off * 3);
      for (let i = 0; i < cnt; i++) {
        clr[(off + i) * 3] = c.r;
        clr[(off + i) * 3 + 1] = c.g;
        clr[(off + i) * 3 + 2] = c.b;
      }
      off += cnt;
      g.dispose();
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    out.setAttribute('color', new THREE.BufferAttribute(clr, 3));
    out.userData = { shared: true };
    return out;
  }

  function crearGeoVegetal3D(esp) {
    const key = `${esp.tipo3d}_${esp.n}_${esp.c}`;
    if (vegGeoCache.has(key)) return vegGeoCache.get(key);
    const parts = [];
    const t = esp.tipo3d || 'roseta';
    const c1 = esp.c || '#4e8a48';
    const c2 = esp.c2 || '#72ab60';

    if (t === 'roseta') {
      // Lechuga crespa / Espinaca: 2 coronas de hojas ahuecadas reales + corazón claro
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        const leaf = new THREE.SphereGeometry(0.11, 6, 5).scale(0.92, 0.22, 1.35);
        leaf.rotateX(0.45);
        leaf.translate(0, 0.08, 0.11);
        leaf.rotateY(a);
        parts.push({ g: leaf, col: c1 });
      }
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + 0.4;
        const leaf = new THREE.SphereGeometry(0.08, 6, 4).scale(0.85, 0.28, 1.15);
        leaf.rotateX(0.75);
        leaf.translate(0, 0.11, 0.055);
        leaf.rotateY(a);
        parts.push({ g: leaf, col: c2 });
      }
      parts.push({ g: new THREE.SphereGeometry(0.055, 6, 5).scale(1, 0.85, 1).translate(0, 0.09, 0), col: '#d4e8b8' });
    } else if (t === 'hojaAlta') {
      // Acelga: pencas blancas erguidas + láminas verdes anchas y rizadas
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const penca = new THREE.CylinderGeometry(0.011, 0.016, 0.20, 5).rotateX(0.24).translate(0, 0.10, 0.035).rotateY(a);
        const lamina = new THREE.SphereGeometry(0.095, 6, 5).scale(0.82, 0.16, 1.55).rotateX(0.65).translate(0, 0.24, 0.09).rotateY(a);
        parts.push({ g: penca, col: '#f2efe4' }, { g: lamina, col: k % 2 ? c1 : c2 });
      }
    } else if (t === 'repollo') {
      // Repollo / Brócoli / Coliflor: hojas exteriores abiertas + cogollo o inflorescencia multi-florete
      const esBro = /brócoli/i.test(esp.n);
      const esColi = /coliflor/i.test(esp.n);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const wrap = new THREE.SphereGeometry(0.13, 6, 5).scale(1.0, 0.20, 1.35).rotateX(0.36).translate(0, 0.10, 0.13).rotateY(a);
        parts.push({ g: wrap, col: c1 });
      }
      if (esBro || esColi) {
        const fCol = esColi ? '#f3efe0' : '#2e693c';
        parts.push({ g: new THREE.CylinderGeometry(0.032, 0.04, 0.14, 6).translate(0, 0.07, 0), col: '#6d9964' });
        for (let f = 0; f < 7; f++) {
          const fa = (f / 6) * Math.PI * 2;
          const r = f === 0 ? 0 : 0.062;
          const fl = new THREE.IcosahedronGeometry(f === 0 ? 0.072 : 0.056, 1).translate(Math.cos(fa) * r, f === 0 ? 0.19 : 0.16, Math.sin(fa) * r);
          parts.push({ g: fl, col: fCol });
        }
      } else {
        parts.push({ g: new THREE.SphereGeometry(0.12, 9, 7).scale(1.05, 0.92, 1.05).translate(0, 0.13, 0), col: '#bcd6a7' });
      }
    } else if (t === 'tutor') {
      // Tomate / Ají / Arveja / Haba: tallo central + 4 pisos de ramas con follaje compuesto natural
      const h = Math.min(1.35, Math.max(0.7, esp.h || 1.1));
      parts.push({ g: new THREE.CylinderGeometry(0.015, 0.022, h * 0.88, 6).translate(0, h * 0.44, 0), col: '#3c6e35' });
      for (let tier = 0; tier < 4; tier++) {
        const y = h * (0.22 + tier * 0.18);
        const rad = 0.15 + (1 - tier / 5) * 0.08;
        for (let b = 0; b < 3; b++) {
          const a = tier * 1.1 + (b / 3) * Math.PI * 2;
          const twig = new THREE.CylinderGeometry(0.006, 0.009, rad, 4).rotateX(Math.PI / 2 - 0.32).translate(0, y, rad * 0.45).rotateY(a);
          const lf1 = new THREE.SphereGeometry(0.072, 5, 4).scale(0.85, 0.18, 1.4).rotateX(0.25).translate(0, y + 0.03, rad * 0.82).rotateY(a);
          const lf2 = new THREE.SphereGeometry(0.055, 5, 4).scale(0.8, 0.18, 1.25).rotateZ(0.3).translate(0.055, y + 0.02, rad * 0.52).rotateY(a);
          parts.push({ g: twig, col: '#3e6e36' }, { g: lf1, col: c1 }, { g: lf2, col: c2 });
        }
      }
    } else if (t === 'raiz' || t === 'fina') {
      // Zanahoria / Rábano / Remolacha: hombro de raíz visible en tierra + penacho de 8 frondas arqueadas
      const rootCol = esp.fr || '#df7426';
      parts.push({ g: new THREE.SphereGeometry(0.044, 7, 5).scale(1, 0.72, 1).translate(0, 0.025, 0), col: rootCol });
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const frond = new THREE.ConeGeometry(0.026, 0.24, 4).scale(0.65, 1, 1.2).rotateX(0.42).translate(0, 0.12, 0.055).rotateY(a);
        parts.push({ g: frond, col: k % 2 ? c1 : c2 });
      }
    } else if (t === 'tira') {
      // Cebolla larga: cuello blanco + 7 tallos tubulares verdes erguidos
      parts.push({ g: new THREE.CylinderGeometry(0.024, 0.030, 0.07, 6).translate(0, 0.035, 0), col: '#f2f0e6' });
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        const tilt = 0.08 + (k % 3) * 0.07;
        const h = 0.30 + (k % 3) * 0.06;
        const stalk = new THREE.CylinderGeometry(0.005, 0.011, h, 5).rotateX(tilt).translate(0, h / 2 + 0.04, 0.016).rotateY(a);
        parts.push({ g: stalk, col: k % 2 ? c1 : c2 });
      }
    } else if (t === 'rastrero') {
      // Calabacín / Ahuyama: 5 grandes hojas palmadas sobre peciolos inclinados + flor amarilla abierta
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        const pet = new THREE.CylinderGeometry(0.01, 0.014, 0.22, 4).rotateX(0.75).translate(0, 0.10, 0.09).rotateY(a);
        const leaf = new THREE.CylinderGeometry(0.16, 0.13, 0.022, 5).scale(1.15, 1, 0.95).rotateX(0.22).translate(0, 0.19, 0.22).rotateY(a);
        parts.push({ g: pet, col: '#4a7a42' }, { g: leaf, col: k % 2 ? c1 : c2 });
      }
      parts.push({ g: new THREE.ConeGeometry(0.048, 0.07, 6).rotateX(Math.PI).translate(0.05, 0.13, 0.04), col: '#e8b931' });
    } else if (t === 'maiz') {
      // Maíz: caña alta + 6 hojas largas arqueadas alternas + espiga dorada superior
      parts.push({ g: new THREE.CylinderGeometry(0.018, 0.028, 1.55, 6).translate(0, 0.77, 0), col: '#5a8744' });
      for (let k = 0; k < 6; k++) {
        const y = 0.32 + k * 0.19;
        const a = k * 2.1;
        const blade = new THREE.BoxGeometry(0.055, 0.012, 0.42).rotateX(0.45).translate(0, y, 0.18).rotateY(a);
        parts.push({ g: blade, col: k % 2 ? c1 : c2 });
      }
      parts.push({ g: new THREE.ConeGeometry(0.035, 0.22, 5).translate(0, 1.62, 0), col: '#d4b45c' });
    } else {
      // Aromáticas: mata ramosa con hojas finas y espigas florales
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        const stem = new THREE.ConeGeometry(0.055, 0.26, 5).rotateX(0.25).translate(0, 0.13, 0.06).rotateY(a);
        parts.push({ g: stem, col: k % 2 ? c1 : c2 });
        if (esp.fr && k % 2 === 0) {
          parts.push({ g: new THREE.SphereGeometry(0.028, 5, 4).translate(0, 0.28, 0.09).rotateY(a), col: esp.fr });
        }
      }
    }
    const geo = mergeParts(parts);
    vegGeoCache.set(key, geo);
    return geo;
  }

  // Geometría de copa de árbol arquitectónico (3 lóbulos naturales en vez de un poliedro suelto)
  const geoCopaArb = mergeParts([
    { g: new THREE.IcosahedronGeometry(0.78, 1).scale(1.12, 0.85, 1.05).translate(0, 0.12, 0), col: '#4a7c45' },
    { g: new THREE.IcosahedronGeometry(0.58, 1).scale(1.05, 0.82, 1.0).translate(0.42, -0.05, 0.24), col: '#5c8f52' },
    { g: new THREE.IcosahedronGeometry(0.55, 1).scale(1.0, 0.82, 1.08).translate(-0.38, -0.08, -0.22), col: '#3e6e3b' }
  ]);
  const geoMataPol = mergeParts([
    { g: new THREE.SphereGeometry(0.16, 6, 5).scale(1.2, 0.72, 1.1).translate(0, 0.11, 0), col: '#4f7a4c' },
    { g: new THREE.CylinderGeometry(0.015, 0.02, 0.24, 5).translate(0.06, 0.24, 0.04), col: '#7c65a8' },
    { g: new THREE.CylinderGeometry(0.015, 0.02, 0.22, 5).translate(-0.07, 0.22, -0.04), col: '#d49a38' },
    { g: new THREE.CylinderGeometry(0.014, 0.02, 0.20, 5).translate(0.02, 0.21, -0.08), col: '#c46c84' }
  ]);

  /* ---------- 3. Renderizado 3D completo de la Huerta + Animaciones de Procesos ---------- */
  let pickElementos = [];
  let animState = {
    tBuild: 1,
    capasBuild: [],   // { grp, delay }
    cultivosAnim: [], // { grp, esp }
    frutosAnim: [],   // { grp, esp }
    compostPilas: [], // meshes
    gotasRiego: null, // { points, paths }
    diaCiclo: 65,
    riegoOn: true
  };
  let rootActual = null;
  let proyectoActual = null;

  function construirHuerta(proyecto, animar = true) {
    limpiar(gHuerta);
    pickElementos = [];
    proyectoActual = proyecto;
    animState.capasBuild = [];
    animState.cultivosAnim = [];
    animState.frutosAnim = [];
    animState.compostPilas = [];
    animState.gotasRiego = null;

    const { dims, elementos, infra, cerco, cfg, orientAng, sitio } = proyecto;
    const root = new THREE.Group();
    root.position.set(sitio[0], YG(), sitio[1]);
    root.rotation.y = -orientAng;
    gHuerta.add(root);
    rootActual = root;

    const mkCapa = (delay) => {
      const g = new THREE.Group();
      root.add(g);
      animState.capasBuild.push({ grp: g, delay });
      return g;
    };
    const cSuelo = mkCapa(0.0);
    const cCamas = mkCapa(0.15);
    const cInfra = mkCapa(0.32);
    const cMob = mkCapa(0.48);
    const cPlantas = mkCapa(0.62);
    const cBorde = mkCapa(0.76);

    // 1. Piso viruta / adoquín + bandas solares + brújula Norte real
    const txP = (cfg.concepto === 'paisajistico' ? TEX.adoquin : TEX.viruta).clone();
    txP.needsUpdate = true; txP.repeat.set(dims.totalL / 3, dims.totalW / 3);
    const piso = new THREE.Mesh(
      new THREE.PlaneGeometry(dims.totalL, dims.totalW).rotateX(-Math.PI / 2),
      mStd('#ffffff', { map: txP, roughness: 0.96, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })
    );
    piso.position.y = 0.04; piso.receiveShadow = true;
    cSuelo.add(piso);

    // Bloques / zonas de rayado personalizadas por el usuario (Estilo Rayon sincronizado 2D <-> 3D)
    for (const z of (proyecto.zonasRayado || [])) {
      const hDef = HATCHES_RAYON[z.hatch] || HATCHES_RAYON.prado;
      const matZ = z.hatch === 'madera' ? mStd('#ffffff', { map: TEX.madera, roughness: 0.88 })
        : z.hatch === 'adoquin' ? mStd('#ffffff', { map: TEX.adoquin, roughness: 0.92 })
        : z.hatch === 'tierra' ? mStd('#ffffff', { map: TEX.tierra, roughness: 0.98 })
        : z.hatch === 'agua' ? new THREE.MeshStandardMaterial({ color: hDef.col3d, transparent: true, opacity: 0.65, roughness: 0.2 })
        : mStd(hDef.col3d, { roughness: 0.92 });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(z.l, z.hatch === 'madera' ? 0.10 : 0.05, z.w), matZ);
      plate.position.set(z.u, z.hatch === 'madera' ? 0.09 : 0.065, z.v);
      plate.rotation.y = -(z.rot || 0);
      plate.receiveShadow = true;
      plate.userData.el = z;
      cSuelo.add(plate);
    }

    if (cfg.mapaSolar) {
      // Indicador solar arquitectónico sutil (sin bloques neón invasivos)
      const bruj = new THREE.Group();
      bruj.position.set(dims.uMax + 2.0, 0.14, dims.vMin + 1.6);
      bruj.rotation.y = orientAng;
      const aro = new THREE.Mesh(new THREE.RingGeometry(0.85, 0.96, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#c8a978', side: THREE.DoubleSide, toneMapped: false }));
      const fl = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0.9), new THREE.Vector2(0.24, -0.28), new THREE.Vector2(0, -0.08), new THREE.Vector2(-0.24, -0.28)])).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#d49a45', side: THREE.DoubleSide, toneMapped: false }));
      bruj.add(aro, fl); cSuelo.add(bruj);
    }

    // 2. Materiales y utilidades
    const matCont = cfg.contencion === 'madera' ? mStd('#ffffff', { map: TEX.madera, roughness: 0.9 })
      : cfg.contencion === 'piedra' ? mStd('#ffffff', { map: TEX.piedra, roughness: 0.94 })
      : mStd('#ffffff', { map: TEX.ladrillo, roughness: 0.9 });
    const matTierra = mStd('#ffffff', { map: TEX.tierra, roughness: 0.98 });
    const matGoteo = mStd('#111827', { roughness: 0.45 });
    const matAgua = mStd('#0284c7', { roughness: 0.35, metalness: 0.2 });
    const obj = new THREE.Object3D(), colTmp = new THREE.Color();

    const geoAlom = (L, W) => {
      const g = new THREE.BoxGeometry(Math.max(0.4, L - 0.14), 0.16, Math.max(0.4, W - 0.14), 1, 1, 4);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) {
        const zf = p.getZ(i) / (Math.max(0.4, W - 0.14) / 2);
        p.setY(i, 0.08 + 0.085 * (1 - zf * zf));
      }
      g.computeVertexNormals();
      return g;
    };

    const dripPaths = [];
    const botellasPos = [];

    // 3. Construcción de cada elemento paramétrico
    for (const el of elementos) {
      const eg = new THREE.Group();
      eg.position.set(el.u, 0, el.v);
      eg.rotation.y = -(el.rot || 0);
      eg.userData.el = el;

      if (el.cat === 'cultivo') {
        cCamas.add(eg);
        const esp = ESPECIES[el.especieId] || ESPECIES.lechuga;
        let yTop = 0.34;

        if (el.tipo === 'jardinera_acc') {
          // Jardinera elevada accesible a 80 cm de altura (espacio libre inferior para silla de ruedas)
          const base = new THREE.Mesh(new THREE.BoxGeometry(el.l, 0.30, el.w), mStd('#ffffff', { map: TEX.madera }));
          base.position.y = 0.65; base.castShadow = true; base.receiveShadow = true; base.userData.el = el;
          eg.add(base); pickElementos.push(base);
          for (const sx of [-el.l / 2 + 0.15, el.l / 2 - 0.15]) for (const sz of [-el.w / 2 + 0.12, el.w / 2 - 0.12]) {
            const pata = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.52, 0.1), mStd('#5c4028'));
            pata.position.set(sx, 0.26, sz); eg.add(pata);
          }
          const t = new THREE.Mesh(geoAlom(el.l, el.w), matTierra); t.position.y = 0.78; eg.add(t);
          yTop = 0.90;
        } else if (el.tipo === 'hidroponia') {
          // Mesa experimental de tubos PVC NFT blancos + depósito recirculador
          const marco = new THREE.Mesh(new THREE.BoxGeometry(el.l, 0.06, el.w), mStd('#94a3b8', { metalness: 0.4, roughness: 0.4 }));
          marco.position.y = 0.78; marco.userData.el = el; eg.add(marco); pickElementos.push(marco);
          for (const sx of [-el.l / 2 + 0.2, el.l / 2 - 0.2]) for (const sz of [-el.w / 2 + 0.12, el.w / 2 - 0.12]) {
            const pt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.78, 6), mStd('#64748b', { metalness: 0.5 }));
            pt.position.set(sx, 0.39, sz); eg.add(pt);
          }
          for (let ti = 0; ti < 4; ti++) {
            const dz = ((ti + 0.5) / 4 - 0.5) * (el.w - 0.18);
            const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, el.l - 0.1, 10).rotateZ(Math.PI / 2), mStd('#f1f5f9', { roughness: 0.25 }));
            tubo.position.set(0, 0.85, dz); eg.add(tubo);
          }
          const dep = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.55), matAgua);
          dep.position.set(el.l / 2 - 0.45, 0.24, 0); eg.add(dep);
          yTop = 0.91;
        } else {
          // Cantero alomado estándar INTA (15 cm elevación, 30 cm suelo trabajado)
          if (cfg.contencion === 'botellas') {
            for (let du = -el.l / 2; du <= el.l / 2; du += 0.15) botellasPos.push([el.u + du, el.v - el.w / 2], [el.u + du, el.v + el.w / 2]);
            for (let dv = -el.w / 2 + 0.15; dv < el.w / 2; dv += 0.15) botellasPos.push([el.u - el.l / 2, el.v + dv], [el.u + el.l / 2, el.v + dv]);
          } else {
            const caja = new THREE.Mesh(new THREE.BoxGeometry(el.l, 0.18, el.w), matCont);
            caja.position.y = 0.13; caja.castShadow = true; caja.receiveShadow = true; caja.userData.el = el;
            eg.add(caja); pickElementos.push(caja);
          }
          const t = new THREE.Mesh(geoAlom(el.l, el.w), matTierra);
          t.position.y = 0.21; t.receiveShadow = true; t.userData.el = el;
          eg.add(t); pickElementos.push(t);
          yTop = 0.35;
        }

        // Líneas de riego por goteo (2 en 1 m, 3 en 1,25 m) + trayectorias para animación de agua
        const dl = el.dripLines || 2;
        const cr = Math.cos(el.rot || 0), sr = Math.sin(el.rot || 0);
        for (let li = 0; li < dl; li++) {
          const dv = ((li + 0.5) / dl - 0.5) * (el.w - 0.22);
          const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, el.l - 0.16, 6).rotateZ(Math.PI / 2), matGoteo);
          pipe.position.set(0, yTop + 0.02, dv);
          eg.add(pipe);
          const aU = el.u + (-el.l / 2 + 0.1) * cr - dv * sr, aV = el.v + (-el.l / 2 + 0.1) * sr + dv * cr;
          const bU = el.u + (el.l / 2 - 0.1) * cr - dv * sr, bV = el.v + (el.l / 2 - 0.1) * sr + dv * cr;
          dripPaths.push([aU, yTop + 0.06, aV, bU, yTop + 0.06, bV]);
        }

        // Plantas del cantero agrupadas para animar crecimiento fenológico (Día 0–180)
        const gp = new THREE.Group();
        gp.position.set(el.u, yTop, el.v);
        gp.rotation.y = -(el.rot || 0);
        cPlantas.add(gp);

        const gf = new THREE.Group();
        gf.position.set(el.u, yTop, el.v);
        gf.rotation.y = -(el.rot || 0);
        cPlantas.add(gf);

        const pts = [];
        for (let f = 0; f < esp.fil; f++) {
          const dv = ((f + 0.5) / esp.fil - 0.5) * (el.w - 0.26);
          for (let du = -el.l / 2 + 0.22; du <= el.l / 2 - 0.20; du += esp.paso) pts.push([du, dv]);
        }
        const nP = pts.length;
        if (nP) {
          const gVeg = crearGeoVegetal3D(esp);
          const imV = new THREE.InstancedMesh(gVeg, mStd('#ffffff', { vertexColors: true, roughness: 0.78 }), nP);
          pts.forEach(([du, dv], i) => {
            obj.position.set(du, 0, dv); obj.rotation.set(0, (i * 2.399) % 6.28, 0);
            const k = 0.88 + (i % 4) * 0.07; obj.scale.set(k, k, k); obj.updateMatrix();
            imV.setMatrixAt(i, obj.matrix);
          });
          imV.castShadow = true;
          gp.add(imV);

          // Tutores de caña natural (fijos en la cama) para tomate/arveja/haba
          if (esp.tipo3d === 'tutor') {
            const imT = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.019, esp.h, 6).translate(0, esp.h / 2, 0), mStd('#a88d62', { roughness: 0.9 }), nP);
            pts.forEach(([du, dv], i) => { obj.position.set(du + 0.03, 0, dv + 0.02); obj.rotation.set(0, 0, 0); obj.scale.setScalar(1); obj.updateMatrix(); imT.setMatrixAt(i, obj.matrix); });
            eg.add(imT);
            imT.position.y = yTop;
          }
          // Racimos de frutos/flores botánicos (visibles solo en floración-cosecha!)
          if (esp.fr && esp.tipo3d !== 'raiz' && esp.tipo3d !== 'fina') {
            const frParts = [];
            if (esp.tipo3d === 'maiz') {
              frParts.push({ g: new THREE.CapsuleGeometry(0.036, 0.14, 4, 6).rotateZ(0.32).translate(0.06, 0.95, 0.02), col: esp.fr });
              frParts.push({ g: new THREE.CapsuleGeometry(0.032, 0.12, 4, 6).rotateZ(-0.28).translate(-0.05, 0.78, -0.02), col: esp.fr });
            } else if (esp.tipo3d === 'rastrero') {
              // Calabacín / ahuyama apoyado sobre el sustrato
              frParts.push({ g: new THREE.CapsuleGeometry(0.055, 0.18, 5, 7).rotateZ(Math.PI / 2).translate(0.12, 0.06, 0.05), col: esp.fr });
            } else if (esp.tipo3d === 'tutor') {
              // Racimo realista de 4 tomates/vainas colgando en distintos niveles
              const hy = Math.min(0.95, (esp.h || 1.1) * 0.62);
              frParts.push(
                { g: new THREE.SphereGeometry(0.038, 7, 5).translate(0.11, hy, 0.04), col: esp.fr },
                { g: new THREE.SphereGeometry(0.034, 7, 5).translate(-0.09, hy - 0.12, 0.07), col: esp.fr },
                { g: new THREE.SphereGeometry(0.036, 7, 5).translate(0.04, hy - 0.24, -0.10), col: esp.fr },
                { g: new THREE.SphereGeometry(0.032, 7, 5).translate(-0.07, hy + 0.11, -0.06), col: esp.fr }
              );
            } else {
              frParts.push({ g: new THREE.SphereGeometry(0.032, 6, 5).translate(0.04, Math.min(0.45, esp.h * 0.72), 0.03), col: esp.fr });
            }
            const gFr = mergeParts(frParts);
            const imF = new THREE.InstancedMesh(gFr, mStd('#ffffff', { vertexColors: true, roughness: 0.42 }), nP);
            pts.forEach(([du, dv], i) => { obj.position.set(du, 0, dv); obj.rotation.set(0, i * 1.9, 0); obj.scale.setScalar(1); obj.updateMatrix(); imF.setMatrixAt(i, obj.matrix); });
            gf.add(imF);
          }
          animState.cultivosAnim.push({ grp: gp, esp });
          animState.frutosAnim.push({ grp: gf, esp });
        }
      } else if (el.tipo === 'invernadero') {
        cInfra.add(eg);
        const rA = el.w / 2;
        const bov = new THREE.Mesh(
          new THREE.CylinderGeometry(rA, rA, el.l, 16, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.72, 1),
          new THREE.MeshStandardMaterial({ color: '#eef7fa', transparent: true, opacity: 0.42, roughness: 0.25, side: THREE.DoubleSide, depthWrite: false })
        );
        bov.position.y = 1.05; bov.userData.el = el; eg.add(bov); pickElementos.push(bov);
        const mA = mStd('#d6dde2', { roughness: 0.4, metalness: 0.45 });
        const nArc = Math.max(4, Math.round(el.l / 1.4) + 1);
        for (let i = 0; i < nArc; i++) {
          const x = -el.l / 2 + (i / (nArc - 1)) * el.l;
          const arc = new THREE.Mesh(new THREE.TorusGeometry(rA, 0.032, 6, 18, Math.PI).rotateY(Math.PI / 2).scale(1, 0.72, 1), mA);
          arc.position.set(x, 1.05, 0); eg.add(arc);
          for (const s of [-1, 1]) {
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.05, 6), mA);
            p.position.set(x, 0.525, s * rA); eg.add(p);
          }
        }
        // Mesas de almácigo interiores
        for (const s of [-0.58, 0.58]) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(el.l - 0.8, 0.08, el.w * 0.26), mStd('#96724c'));
          m.position.set(0, 0.78, s * rA);
          const pl = new THREE.Mesh(new THREE.BoxGeometry(el.l - 1.0, 0.12, el.w * 0.20), mStd('#4ade80'));
          pl.position.set(0, 0.88, s * rA);
          eg.add(m, pl);
        }
      } else if (el.tipo === 'abonera') {
        cInfra.add(eg);
        const mAb = mStd('#ffffff', { map: TEX.compList, alphaTest: 0.45, side: THREE.DoubleSide });
        const colsC = ['#4d5e2a', '#4a3525', '#261a11'];
        const bayW = el.l / 3;
        for (let k = 0; k < 3; k++) {
          const u = -el.l / 2 + (k + 0.5) * bayW;
          const bx = new THREE.Mesh(new THREE.BoxGeometry(bayW - 0.08, 0.95, el.w * 0.72), mAb);
          bx.position.set(u, 0.52, 0); bx.userData.el = el; eg.add(bx); pickElementos.push(bx);
          const pila = new THREE.Mesh(new THREE.SphereGeometry(bayW * 0.42, 10, 6, 0, Math.PI * 2, 0, 1.45).scale(1, 0.62, 1.2), mStd(colsC[k], { roughness: 1 }));
          pila.position.set(u, 0.76 - k * 0.08, 0);
          pila.userData.fase = k;
          eg.add(pila);
          animState.compostPilas.push(pila);
        }
      } else if (el.tipo === 'bodega') {
        cInfra.add(eg);
        const cas = new THREE.Mesh(new THREE.BoxGeometry(el.l, 2.05, el.w), mStd('#ffffff', { map: TEX.madera }));
        cas.position.y = 1.06; cas.castShadow = true; cas.userData.el = el; eg.add(cas); pickElementos.push(cas);
        const tech = new THREE.Mesh(new THREE.BoxGeometry(el.l + 0.42, 0.08, el.w + 0.42).rotateZ(-0.15), mStd('#4b5563', { roughness: 0.5, metalness: 0.35 }));
        tech.position.y = 2.22; tech.castShadow = true; eg.add(tech);
      } else if (el.tipo === 'agua') {
        cInfra.add(eg);
        const b = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.16, 1.15), mStd('#78716c')); b.position.y = 0.12;
        const tq = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.18, 16), mStd('#e2e8f0', { roughness: 0.35 })); tq.position.y = 0.79; tq.userData.el = el;
        const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 8), matAgua); gr.position.set(-0.68, 0.4, 0);
        eg.add(b, tq, gr); pickElementos.push(tq);
      } else if (el.tipo === 'pergola') {
        cMob.add(eg);
        const mMad = mStd('#7c5230', { roughness: 0.85 });
        for (const sx of [-el.l / 2 + 0.15, el.l / 2 - 0.15]) for (const sz of [-el.w / 2 + 0.15, el.w / 2 - 0.15]) {
          const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.65, 0.14), mMad);
          p.position.set(sx, 1.35, sz); p.castShadow = true; eg.add(p);
        }
        const nV = Math.max(4, Math.round(el.l / 0.65));
        for (let i = 0; i < nV; i++) {
          const x = -el.l / 2 + (i / (nV - 1)) * el.l;
          const v = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, el.w + 0.3), mMad);
          v.position.set(x, 2.72, 0); v.castShadow = true; v.userData.el = el; eg.add(v);
          if (i === 0) pickElementos.push(v);
        }
        const sombra = new THREE.Mesh(new THREE.PlaneGeometry(el.l, el.w).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#4d7c3f', transparent: true, opacity: 0.38, side: THREE.DoubleSide }));
        sombra.position.y = 2.81; eg.add(sombra);
      } else if (el.tipo === 'banca') {
        cMob.add(eg);
        const mB = mStd('#8f5d38');
        const as = new THREE.Mesh(new THREE.BoxGeometry(el.l, 0.08, el.w * 0.72), mB); as.position.y = 0.45; as.castShadow = true; as.userData.el = el;
        const resp = new THREE.Mesh(new THREE.BoxGeometry(el.l, 0.34, 0.07), mB); resp.position.set(0, 0.68, -el.w * 0.32); resp.rotation.x = -0.15;
        for (const sx of [-el.l / 2 + 0.25, el.l / 2 - 0.25]) {
          const pt = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.44, el.w * 0.65), mStd('#334155')); pt.position.set(sx, 0.22, 0); eg.add(pt);
        }
        eg.add(as, resp); pickElementos.push(as);
      } else if (el.tipo === 'mesa_trabajo' || el.tipo === 'lavado') {
        cMob.add(eg);
        const top = new THREE.Mesh(new THREE.BoxGeometry(el.l, 0.08, el.w), el.tipo === 'lavado' ? mStd('#cbd5e1', { metalness: 0.5, roughness: 0.3 }) : mStd('#a16a3f'));
        top.position.y = 0.82; top.castShadow = true; top.userData.el = el; eg.add(top); pickElementos.push(top);
        for (const sx of [-el.l / 2 + 0.14, el.l / 2 - 0.14]) for (const sz of [-el.w / 2 + 0.12, el.w / 2 - 0.12]) {
          const pt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.80, 0.08), mStd('#475569')); pt.position.set(sx, 0.40, sz); eg.add(pt);
        }
      } else if (el.tipo === 'polinizadores') {
        cPlantas.add(eg);
        const b = new THREE.Mesh(new THREE.BoxGeometry(el.l, 0.22, el.w), mStd('#ffffff', { map: TEX.piedra })); b.position.y = 0.12; b.userData.el = el; eg.add(b); pickElementos.push(b);
        const tP = new THREE.Mesh(new THREE.BoxGeometry(el.l - 0.16, 0.12, el.w - 0.16), matTierra); tP.position.y = 0.21; eg.add(tP);
        const nM = 16;
        const imPol = new THREE.InstancedMesh(geoMataPol, mStd('#ffffff', { vertexColors: true, roughness: 0.84 }), nM);
        for (let i = 0; i < nM; i++) {
          obj.position.set(((i % 4) - 1.5) * (el.l / 4.4), 0.24, (Math.floor(i / 4) - 1.5) * (el.w / 4.4));
          obj.rotation.set(0, i * 1.4, 0);
          obj.scale.setScalar(0.95 + (i % 3) * 0.18);
          obj.updateMatrix();
          imPol.setMatrixAt(i, obj.matrix);
        }
        eg.add(imPol);
      } else if (el.tipo === 'infiltracion') {
        cInfra.add(eg);
        const zj = new THREE.Mesh(new THREE.BoxGeometry(el.l, 0.08, el.w), mStd('#78716c', { map: TEX.piedra })); zj.position.y = 0.06; zj.userData.el = el;
        const ag = new THREE.Mesh(new THREE.PlaneGeometry(el.l - 0.4, el.w - 0.4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#0ea5e9', transparent: true, opacity: 0.45, roughness: 0.15 })); ag.position.y = 0.11;
        eg.add(zj, ag); pickElementos.push(zj);
      } else if (el.tipo === 'hotel_insectos') {
        cMob.add(eg);
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.3, 6), mStd('#5c4028')); p.position.y = 0.65;
        const bx = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.38), mStd('#a16207')); bx.position.y = 1.55; bx.userData.el = el;
        eg.add(p, bx); pickElementos.push(bx);
      } else if (el.tipo === 'meteo') {
        cInfra.add(eg);
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.5, 8), mStd('#e2e8f0', { metalness: 0.6 })); m.position.y = 1.25;
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 0.35), mStd('#f8fafc')); cap.position.y = 2.25; cap.userData.el = el;
        const solP = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.28).rotateX(0.3), mStd('#1e3a8a', { metalness: 0.4 })); solP.position.set(0, 2.55, 0.1);
        eg.add(m, cap, solP); pickElementos.push(cap);
      } else if (el.tipo === 'residuos_sep') {
        cMob.add(eg);
        const cs3 = ['#16a34a', '#f8fafc', '#1e293b'];
        for (let k = 0; k < 3; k++) {
          const can = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.82, 10), mStd(cs3[k], { roughness: 0.5 }));
          can.position.set((k - 1) * 0.56, 0.44, 0); can.userData.el = el; eg.add(can);
          if (k === 1) pickElementos.push(can);
        }
      } else {
        // Señalización educativa
        cMob.add(eg);
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.55, 6), mStd('#475569')); p1.position.set(-0.4, 0.78, 0);
        const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.55, 6), mStd('#475569')); p2.position.set(0.4, 0.78, 0);
        const tab = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.68, 0.06), mStd('#14532d', { roughness: 0.5 })); tab.position.y = 1.32; tab.userData.el = el;
        eg.add(p1, p2, tab); pickElementos.push(tab);
      }
    }

    // Botellas de vidrio si contención === 'botellas'
    if (botellasPos.length) {
      const imB = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 7).translate(0, 0.14, 0), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2, transparent: true, opacity: 0.88 }), botellasPos.length);
      botellasPos.forEach(([u, v], i) => {
        obj.position.set(u, 0.03, v); obj.rotation.set(0, i, 0); obj.scale.setScalar(1); obj.updateMatrix();
        imB.setMatrixAt(i, obj.matrix); imB.setColorAt(i, colTmp.set(i % 3 === 0 ? '#15803d' : i % 3 === 1 ? '#166534' : '#b45309'));
      });
      cCamas.add(imB);
    }

    // Pulsos animados de agua por el sistema de riego por goteo
    if (dripPaths.length) {
      const nGotas = dripPaths.length * 4;
      const gPos = new Float32Array(nGotas * 3);
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
      const ptsM = new THREE.Points(gg, new THREE.PointsMaterial({ color: '#38bdf8', size: 6, sizeAttenuation: false, transparent: true, opacity: 0.88, depthWrite: false, toneMapped: false }));
      ptsM.renderOrder = 11;
      cPlantas.add(ptsM);
      animState.gotasRiego = { points: ptsM, paths: dripPaths, arr: gPos };
    }

    // Escuadra 3-4-5 (60 × 80 × 100 cm, INTA p. 2)
    if (cfg.guiaReplanteo && infra.triangulo345) {
      const t0 = infra.triangulo345;
      const pts = [new THREE.Vector3(t0.u, 0.39, t0.v), new THREE.Vector3(t0.u + 0.8, 0.39, t0.v), new THREE.Vector3(t0.u, 0.39, t0.v + 0.6), new THREE.Vector3(t0.u, 0.39, t0.v)];
      cCamas.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#facc15', toneMapped: false })));
      for (let i = 0; i < 3; i++) {
        const est = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.5, 6), mStd('#facc15'));
        est.position.set(pts[i].x, 0.27, pts[i].z); cCamas.add(est);
      }
    }

    // Aromáticas perimetrales, frutales laterales y cortina cortavientos Sur–Oeste (arquitectónicos, sin poliedros neón)
    if (infra.aromaticas.length) {
      const imA = new THREE.InstancedMesh(geoMataPol, mStd('#ffffff', { vertexColors: true, roughness: 0.85 }), infra.aromaticas.length);
      infra.aromaticas.forEach((a, i) => { obj.position.set(a.u, 0.04, a.v); obj.rotation.set(0, i * 1.7, 0); obj.scale.setScalar(1.05 + (i % 3) * 0.18); obj.updateMatrix(); imA.setMatrixAt(i, obj.matrix); });
      cBorde.add(imA);
    }
    if (infra.frutales.length) {
      const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.055, 0.085, 1.35, 7).translate(0, 0.68, 0), mStd('#6e4e35'), infra.frutales.length);
      const cp = new THREE.InstancedMesh(geoCopaArb, mStd('#ffffff', { vertexColors: true, roughness: 0.86 }), infra.frutales.length);
      infra.frutales.forEach((f, i) => {
        const s = 0.88 + (i % 3) * 0.14;
        obj.position.set(f.u, 0.04, f.v); obj.rotation.set(0, i * 1.9, 0); obj.scale.setScalar(s); obj.updateMatrix(); tr.setMatrixAt(i, obj.matrix);
        obj.position.set(f.u, 1.65 * s, f.v); obj.updateMatrix(); cp.setMatrixAt(i, obj.matrix);
      });
      cp.castShadow = true; cBorde.add(tr, cp);
    }
    if (infra.cortaviento.length) {
      const trC = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.10, 0.15, 2.2, 7).translate(0, 1.1, 0), mStd('#5c4028'), infra.cortaviento.length);
      const cpC = new THREE.InstancedMesh(geoCopaArb, mStd('#c8d9c4', { vertexColors: true, roughness: 0.88 }), infra.cortaviento.length);
      infra.cortaviento.forEach((cv, i) => {
        const s = 1.48 + (i % 4) * 0.14;
        obj.position.set(cv.u, 0.02, cv.v); obj.rotation.set(0, i * 2.1, 0); obj.scale.setScalar(0.95 + (i % 3) * 0.1); obj.updateMatrix(); trC.setMatrixAt(i, obj.matrix);
        obj.position.set(cv.u, 2.85, cv.v); obj.scale.set(s, s * 1.15, s); obj.updateMatrix(); cpC.setMatrixAt(i, obj.matrix);
      });
      cpC.castShadow = true; cBorde.add(trC, cpC);
    }

    // Cerco perimetral 1,50 m (INTA p. 4)
    if (cerco.tipo !== 'ninguno') {
      const hC = cerco.altura, mPos = mStd('#5c4028', { roughness: 0.92 });
      const imP = new THREE.InstancedMesh(new THREE.BoxGeometry(0.085, hC + 0.08, 0.085).translate(0, (hC + 0.08) / 2, 0), mPos, cerco.postes.length);
      cerco.postes.forEach((p, i) => { obj.position.set(p.u, 0.02, p.v); obj.rotation.set(0, 0, 0); obj.scale.setScalar(1); obj.updateMatrix(); imP.setMatrixAt(i, obj.matrix); });
      imP.castShadow = true; cBorde.add(imP);
      const gPn = new THREE.CylinderGeometry(0.036, 0.04, 1, 6);
      for (const pn of cerco.puntales) {
        const pA = new THREE.Vector3(pn.u, hC * 0.85, pn.v), pB = new THREE.Vector3(pn.u + pn.du, 0.04, pn.v + pn.dv);
        const d = pB.clone().sub(pA), L = d.length(), m = new THREE.Mesh(gPn, mPos);
        m.scale.set(1, L, 1); m.position.copy(pA).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
        cBorde.add(m);
      }
      const mAl = mStd('#cbd5e1', { roughness: 0.3, metalness: 0.75 });
      for (const tr of cerco.tramos) {
        const dx = tr.b[0] - tr.a[0], dv = tr.b[1] - tr.a[1], len = Math.hypot(dx, dv); if (len < 0.3) continue;
        const ang = Math.atan2(dv, dx), mx = (tr.a[0] + tr.b[0]) / 2, mz = (tr.a[1] + tr.b[1]) / 2;
        if (cerco.tipo === 'romboidal') {
          const txR = TEX.romboidal.clone(); txR.needsUpdate = true; txR.repeat.set(len * 1.4, 2.2);
          const pn = new THREE.Mesh(new THREE.PlaneGeometry(len, hC), new THREE.MeshStandardMaterial({ map: txR, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.55 }));
          pn.position.set(mx, hC / 2 + 0.03, mz); pn.rotation.y = -ang; cBorde.add(pn);
          for (const yh of [0.12, 0.78, 1.46]) {
            const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 5).rotateZ(Math.PI / 2), mAl);
            hl.position.set(mx, yh, mz); hl.rotation.y = -ang; cBorde.add(hl);
          }
        } else if (cerco.tipo === 'madera') {
          for (const yh of [0.32, 0.78, 1.24]) {
            const tb = new THREE.Mesh(new THREE.BoxGeometry(len, 0.16, 0.03), mStd('#ffffff', { map: TEX.madera }));
            tb.position.set(mx, yh, mz); tb.rotation.y = -ang; cBorde.add(tb);
          }
        } else {
          const nP = Math.max(2, Math.floor(len / 0.18));
          const imC = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.032, 0.038, hC, 5).translate(0, hC / 2, 0), mStd('#96734b'), nP);
          for (let k = 0; k < nP; k++) { const f = (k + 0.5) / nP; obj.position.set(tr.a[0] + dx * f, 0.03, tr.a[1] + dv * f); obj.rotation.set(0, k, 0); obj.scale.setScalar(1); obj.updateMatrix(); imC.setMatrixAt(k, obj.matrix); }
          cBorde.add(imC);
        }
        if (cerco.mallaFina) {
          const txF = TEX.mallaFina.clone(); txF.needsUpdate = true; txF.repeat.set(len * 2.5, 2.5);
          const fj = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.0), new THREE.MeshStandardMaterial({ map: txF, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.45 }));
          fj.position.set(mx, 0.53, mz); fj.rotation.y = -ang; cBorde.add(fj);
        }
      }
    }

    animState.tBuild = (animar && !RMQ.matches) ? 0 : 1;
    aplicarDiaCiclo(animState.diaCiclo);
  }

  /* ---------- 4. Actualización fenológica (Día 0–180) y Sol astronómico ---------- */
  function aplicarDiaCiclo(dia) {
    animState.diaCiclo = dia;
    for (const { grp, esp } of animState.cultivosAnim) {
      const gD = esp.etapas.germinacion.dias || 7;
      const cD = esp.etapas.cosecha.dias || 80;
      let sc = 0.08;
      if (dia < gD) sc = 0.08 + 0.1 * (dia / gD); // semilla / germinación
      else if (dia <= cD) sc = 0.18 + 0.88 * Math.pow((dia - gD) / Math.max(1, cD - gD), 0.75); // crecimiento
      else if (dia <= cD + 35) sc = 1.06 - 0.35 * ((dia - cD) / 35); // cosecha y rastrojo
      else sc = 0.22; // cama en descanso / renovación con compost
      grp.scale.set(Math.max(0.2, sc), Math.max(0.08, sc), Math.max(0.2, sc));
    }
    for (const { grp, esp } of animState.frutosAnim) {
      const cD = esp.etapas.cosecha.dias || 80;
      const fStart = cD * 0.68;
      const vis = dia >= fStart && dia <= cD + 24;
      grp.visible = vis;
      if (vis) {
        const k = Math.min(1, (dia - fStart) / Math.max(8, cD - fStart));
        grp.scale.setScalar(0.35 + 0.65 * k);
      }
    }
    // Transformación de materia orgánica en las 3 bahías de la abonera (reducción de volumen ~62% en 75 d)
    const cicComp = (dia % 90) / 90;
    for (const pila of animState.compostPilas) {
      const f = pila.userData.fase || 0;
      const sy = f === 0 ? (0.75 + 0.35 * Math.sin(cicComp * Math.PI)) : f === 1 ? (0.72 - 0.15 * cicComp) : (0.52 + 0.2 * cicComp);
      pila.scale.set(1, sy, 1.2);
    }
  }

  let solOrig = null;
  function aplicarSol(sol) {
    if (!T3.sun) return;
    if (!solOrig) solOrig = T3.sun.position.clone();
    if (!sol) { T3.sun.position.copy(solOrig); return; }
    const R = 1600, tgt = proyectoActual ? proyectoActual.sitio : [0, 0];
    T3.sun.position.set(tgt[0] + sol.dir[0] * R, Math.max(120, sol.dir[1] * R), tgt[1] + sol.dir[2] * R);
    if (T3.sun.target) { T3.sun.target.position.set(tgt[0], 0, tgt[1]); T3.sun.target.updateMatrixWorld(); }
  }

  // Bucle ligero de animación (construcción progresiva + pulsos de agua en goteo)
  let raf = 0, lastT = performance.now();
  const loop = (now) => {
    raf = grupo.visible ? requestAnimationFrame(loop) : 0;
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (animState.tBuild < 1) {
      animState.tBuild = Math.min(1, animState.tBuild + dt * 0.95);
      for (const c of animState.capasBuild) {
        const k = Math.max(0, Math.min(1, (animState.tBuild - c.delay) / 0.28));
        const e = 1 - Math.pow(1 - k, 3);
        c.grp.visible = k > 0.01;
        c.grp.scale.set(1, Math.max(0.01, e), 1);
      }
    }
    if (animState.gotasRiego && animState.riegoOn && !RMQ.matches) {
      const { paths, arr, points } = animState.gotasRiego;
      const t = (now * 0.00038) % 1;
      for (let i = 0; i < paths.length; i++) {
        const p = paths[i];
        for (let q = 0; q < 4; q++) {
          const f = (t + q * 0.25 + (i % 5) * 0.07) % 1;
          const idx = (i * 4 + q) * 3;
          arr[idx] = p[0] + (p[3] - p[0]) * f;
          arr[idx + 1] = p[1] + (p[4] - p[1]) * f;
          arr[idx + 2] = p[2] + (p[5] - p[2]) * f;
        }
      }
      points.geometry.attributes.position.needsUpdate = true;
    }
  };

  // Calibración automática sobre Google 3D Tiles cuando Foto real 3D está activa
  const rcT = new THREE.Raycaster(), vDn = new THREE.Vector3(0, -1, 0), vOr = new THREE.Vector3();
  rcT.firstHitOnly = true;
  const timerTiles = setInterval(() => {
    if (!grupo.visible || !T3.tiles || !T3.tiles.group || !rootActual || !proyectoActual) return;
    const st = T3.tiles.stats; if (st && st.downloading + st.parsing > 6) return;
    const s = proyectoActual.sitio;
    rcT.set(vOr.set(s[0], YG() + 120, s[1]), vDn);
    const hit = rcT.intersectObject(T3.tiles.group, true)[0];
    if (hit && Math.abs(hit.point.y - YG()) < 22) rootActual.position.y = hit.point.y + 0.08;
  }, 2200);

  // Vuelo suave de cámara
  function volarA(cx, cz, dist = 54, alto = 38) {
    if (!T3.orbit || !T3.camera) return;
    const o = T3.orbit, p0 = T3.camera.position.clone(), t0 = o.target.clone();
    const p1 = new THREE.Vector3(cx + dist * 0.48, alto, cz + dist * 0.85);
    const t1 = new THREE.Vector3(cx, YG() + 0.6, cz);
    const ini = performance.now(), dur = RMQ.matches ? 1 : 1050;
    const paso = () => {
      const k = Math.min(1, (performance.now() - ini) / dur), e = k * k * (3 - 2 * k);
      T3.camera.position.lerpVectors(p0, p1, e); o.target.lerpVectors(t0, t1, e); o.update();
      if (k < 1) requestAnimationFrame(paso);
    };
    paso();
  }

  // Selección directa por clic 3D: primero módulos de la huerta (para ver historia de planta!), si no, parque
  const dom = T3.renderer.domElement;
  const ptr = new THREE.Vector2(), pickRC = new THREE.Raycaster();
  let downPos = null;
  dom.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
  dom.addEventListener('pointerup', (e) => {
    if (!grupo.visible || !downPos) return;
    if (Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]) > 6) return;
    const r = dom.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    pickRC.setFromCamera(ptr, T3.camera);
    const hEl = pickRC.intersectObjects(pickElementos, false);
    if (hEl.length && hEl[0].object.userData.el) {
      if (onPickElement) onPickElement(hEl[0].object.userData.el);
      return;
    }
    const hPq = pickRC.intersectObjects(pickParques.filter(m => m.visible), false);
    if (hPq.length && hPq[0].object.userData.park) {
      if (onPickPark) onPickPark(hPq[0].object.userData.park);
    }
  });

  return {
    grupo,
    ver(on) {
      grupo.visible = !!on;
      if (on && !raf) { lastT = performance.now(); loop(lastT); }
      if (!on) { cancelAnimationFrame(raf); raf = 0; aplicarSol(null); }
    },
    verZonas(on) { gAptitud.visible = !!on; },
    verRiegoAnim(on) { animState.riegoOn = !!on; if (animState.gotasRiego) animState.gotasRiego.points.visible = !!on; },
    filtrarParques,
    mostrarDiagnostico3D,
    construirHuerta,
    aplicarDiaCiclo,
    aplicarSol,
    volarA,
    quitar() { clearInterval(timerTiles); cancelAnimationFrame(raf); aplicarSol(null); T3.scene.remove(grupo); }
  };
}

/* ============ FAUNA EN PUNTOS 3D (como el manglar de la tesis de Tierra Bomba) ============
   Cada animal es un modelo 3D convertido en una nube DENSA de puntos con normal y color, iluminada y animada en el shader
   (alas que aletean, cuerpo que respira). Modelos: colibrí y mariposa de la tesis «Tierra Bomba» (mismo formato .bin:
   n, posiciones int16/16000, normales int8, color uint8) y, de Poly Pizza (CC BY 3.0): «Bee» y «Robin» (jeremy),
   «Bumblebee», «Ladybug» y «Cactus wren» (Poly by Google). La mirla (Turdus fuscater) usa el «Robin» teñido de su color;
   el copetón usa el «Cactus wren». */
const CFG = { // archivo, puntos, corrección de giro (rad) para que mire a +z, tinte [r,g,b,a], ala (|x| desde donde aletea), aleteo (Hz), amplitud
  colibri: { f: 'colibri.bin', ala: 0.06, hz: 38, amp: 0.9, giro: -Math.PI / 2, eje: 1, tam: 1.6 },
  mariposa: { f: 'mariposa.bin', ala: 0.03, hz: 7, amp: 0.7, giro: 0, tam: 1.3 },
  abeja: { f: 'abeja.glb', n: 26000, ala: 0.22, hz: 42, amp: 0.7, giro: 0 },
  abejorro: { f: 'abejorro.glb', n: 26000, ala: 0.25, hz: 36, amp: 0.6, giro: 0 },
  mariquita: { f: 'mariquita.glb', n: 30000, ala: 9, hz: 0, amp: 0, giro: Math.PI },
  copeton: { f: 'copeton.glb', n: 40000, ala: 9, hz: 0, amp: 0, giro: Math.PI / 2 },
  mirla: { f: 'mirla.glb', n: 32000, ala: 9, hz: 0, amp: 0, giro: Math.PI / 2, tinte: [0.22, 0.2, 0.18, 0.55] }
};
export const FAUNA_FUENTES = 'Colibrí y mariposa: tesis «Tierra Bomba» (Poly by Google, CC BY). Abeja y mirla: «Bee» y «Robin» de jeremy; abejorro, mariquita y copetón: «Bumblebee», «Ladybug» y «Cactus wren» de Poly by Google (Poly Pizza, CC BY 3.0).';
const CACHE = {};
async function cargarBin(THREE, url) {
  const b = await fetch(url).then(r => r.arrayBuffer()), n = new DataView(b).getUint32(0, true), al = (x) => (x + 3) & -4;
  const P = new Int16Array(b, 4, n * 3), N = new Int8Array(b, 4 + al(n * 6), n * 3), C = new Uint8Array(b, 4 + al(n * 6) + al(n * 3), n * 3);
  const p = new Float32Array(n * 3), nn = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) { p[i] = P[i] / 16000; nn[i] = N[i] / 127; c[i] = C[i] / 255; }
  return { p, n: nn, c };
}
async function cargarGlb(THREE, url, cuantos) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'), { MeshSurfaceSampler } = await import('three/addons/math/MeshSurfaceSampler.js');
  const g = await new GLTFLoader().loadAsync(url); g.scene.updateMatrixWorld(true);
  const mallas = []; g.scene.traverse(o => { if (o.isMesh) mallas.push(o); });
  const area = mallas.map(m => { const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); geo.applyMatrix4(m.matrixWorld); const p = geo.attributes.position; let a = 0; const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(); for (let i = 0; i < p.count; i += 3) { A.fromBufferAttribute(p, i); B.fromBufferAttribute(p, i + 1); C.fromBufferAttribute(p, i + 2); a += B.sub(A).cross(C.sub(A)).length() / 2; } return { geo, a }; });
  const tot = area.reduce((s, x) => s + x.a, 0) || 1, P = [], N = [], Cc = [], v = new THREE.Vector3(), nn = new THREE.Vector3(), col = new THREE.Color(), uv = new THREE.Vector2();
  const pix = (tx) => { if (!tx || !tx.image) return null; const im = tx.image, w = Math.min(256, im.width), h = Math.min(256, im.height); const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g2 = cv.getContext('2d'); g2.drawImage(im, 0, 0, w, h); return { w, h, d: g2.getImageData(0, 0, w, h).data }; };
  mallas.forEach((m, i) => {
    const k = Math.round(cuantos * area[i].a / tot); if (!k) return; const geo = area[i].geo; if (!geo.attributes.normal) geo.computeVertexNormals();
    const s = new MeshSurfaceSampler(new THREE.Mesh(geo)).build(), mat = [].concat(m.material)[0] || {}, tp = pix(mat.map), base = mat.color || new THREE.Color(1, 1, 1);
    const tieneCol = !!geo.attributes.color;
    for (let j = 0; j < k; j++) { s.sample(v, nn, col, uv);
      let r = base.r, gg = base.g, b = base.b;
      if (tieneCol) { r *= col.r; gg *= col.g; b *= col.b; }
      if (tp && geo.attributes.uv) { const x = Math.floor((((uv.x % 1) + 1) % 1) * tp.w), y = Math.floor((1 - (((uv.y % 1) + 1) % 1)) * tp.h), q = (y * tp.w + x) * 4; r *= Math.pow(tp.d[q] / 255, 2.2); gg *= Math.pow(tp.d[q + 1] / 255, 2.2); b *= Math.pow(tp.d[q + 2] / 255, 2.2); }
      P.push(v.x, v.y, v.z); N.push(nn.x, nn.y, nn.z); Cc.push(r, gg, b); }
  });
  // normalizar: centrado, la medida mayor = 1
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]); }
  const L = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) || 1, c0 = [(mn[0] + mx[0]) / 2, mn[1], (mn[2] + mx[2]) / 2];
  for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) P[i + a] = (P[i + a] - c0[a]) / L;
  return { p: new Float32Array(P), n: new Float32Array(N), c: new Float32Array(Cc) };
}
export async function cargarFauna(THREE, base = 'data3d/puntos/fauna/') {
  await Promise.all(Object.entries(CFG).map(async ([k, c]) => { try { CACHE[k] = c.f.endsWith('.bin') ? await cargarBin(THREE, base + c.f) : await cargarGlb(THREE, base + c.f, c.n); } catch (e) { console.warn('fauna', k, e); } }));
  return Object.keys(CACHE);
}
// material: luz por normal (sol + cielo), aleteo de las alas (rotación alrededor del eje del cuerpo para |x| > ala)
export function materialFauna(THREE, uPx, k, tam = 1) {
  const c = CFG[k] || {}, t = c.tinte || [0, 0, 0, 0];
  return new THREE.ShaderMaterial({ uniforms: { uPx, uT: { value: 0 }, uTam: { value: tam }, uAla: { value: c.ala || 9 }, uHz: { value: c.hz || 0 }, uAmp: { value: c.amp || 0 }, uTinte: { value: new THREE.Vector4(...t) }, uFase: { value: Math.random() * 6.28 }, uEje: { value: c.eje || 0 } },
    vertexColors: true,
    vertexShader: `attribute vec3 aN; uniform float uPx, uT, uTam, uAla, uHz, uAmp, uFase, uEje; uniform vec4 uTinte; varying vec3 vC;
      vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }
      void main(){ vec3 p = position, n = aN; if (uEje > 0.5) p.xz = p.zx;
        float w = smoothstep(uAla, uAla + 0.08, abs(p.x)); float a = -sign(p.x) * uAmp * sin(uT * uHz + uFase) * w;
        vec2 q = rot(vec2(abs(p.x) - uAla, p.y), a); p.x = sign(p.x) * (q.x + uAla); p.y = mix(p.y, q.y, w);
        if (uEje > 0.5) p.xz = p.zx; p.y += sin(uT * 1.6 + uFase) * 0.006;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uTam * uPx / max(-mv.z, 0.02), 1.0, 7.0);
        vec3 nv = normalize(normalMatrix * n); float dif = max(0.0, dot(nv, normalize(vec3(0.4, 0.8, 0.45)))); float cielo = 0.5 + 0.5 * nv.y;
        vec3 base = mix(color, uTinte.rgb, uTinte.a); vC = base * (0.38 + 0.28 * cielo + 0.75 * dif); }`,
    fragmentShader: `varying vec3 vC; void main(){ vec2 q = gl_PointCoord - 0.5; if (dot(q,q) > 0.25) discard; gl_FragColor = vec4(vC, 1.0);
      #include <colorspace_fragment>
    }` });
}
export function puntosFauna(THREE, k, uPx, tam = 1, max = 1e9) {
  const D = CACHE[k]; if (!D) return null; const n = D.p.length / 3, st = Math.max(1, Math.ceil(n / max)), m = Math.floor(n / st);
  const P = new Float32Array(m * 3), N = new Float32Array(m * 3), C = new Float32Array(m * 3);
  for (let i = 0, j = 0; j < m; i += st, j++) for (let a = 0; a < 3; a++) { P[j * 3 + a] = D.p[i * 3 + a]; N[j * 3 + a] = D.n[i * 3 + a]; C[j * 3 + a] = D.c[i * 3 + a]; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aN', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  const pts = new THREE.Points(g, materialFauna(THREE, uPx, k, tam * ((CFG[k] || {}).tam || 1))); pts.frustumCulled = false; pts.rotation.y = (CFG[k] || {}).giro || 0;
  return pts;
}
export const tieneFauna = (k) => !!CACHE[k];

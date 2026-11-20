(async () => {
  const w = t => new Promise(r => setTimeout(r, t));
  const V = window.CAP || { eye: [4322, 2.2, 6], look: [4255, 2.4, 138], fov: 62, W: 1440, H: 810 };
  KEN_ESC.poner('proyecto'); await w(1500);
  document.querySelector('#esc-ley [data-s=bav]').click(); await w(9000);
  const T = KEN3D, THREE = T.THREE, R = T.renderer, S = T.scene;
  // llevar la cámara principal al lugar (para que los árboles y las plantas carguen su detalle alto) y esperar
  T.anim = null; T.camera.position.set(V.eye[0], V.eye[1] + 6, V.eye[2]); // las plantas 3D se arman a ~65 m del centro de la vista: el centro va cerca del ojo
  T.orbit.target.set(V.eye[0] + (V.look[0] - V.eye[0]) * 0.22, V.look[1], V.eye[2] + (V.look[2] - V.eye[2]) * 0.22); T.orbit.update();
  if (T.arboles && T.arboles.update) try { T.arboles.update({ position: T.camera.position }, true); } catch (e) {}
  await w(9000);
  // fuera ayudas gráficas: líneas, partículas, sprites (las etiquetas son HTML y no salen)
  const ocultos = []; S.traverse(o => { if (o.visible && ((o.isMesh && o.material && o.material.isShaderMaterial && o.material.transparent) || o.isPoints || o.isLine || o.isLineSegments || o.isSprite || /LineSegments2|Line2/.test(o.type || ''))) { o.visible = false; ocultos.push(o); } });
  const { W, H } = V, cam = new THREE.PerspectiveCamera(V.fov, W / H, 0.25, 2500);
  cam.position.set(...V.eye); cam.lookAt(...V.look); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const rt = new THREE.WebGLRenderTarget(W, H); rt.texture.colorSpace = THREE.SRGBColorSpace;
  rt.depthTexture = new THREE.DepthTexture(W, H); rt.depthTexture.type = THREE.FloatType;
  const sh = R.shadowMap.autoUpdate; R.setRenderTarget(rt); R.render(S, cam);
  const col = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, col);
  // profundidad: se copia a una textura de números reales y se lee
  const rtD = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType });
  const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { d: { value: rt.depthTexture } },
    vertexShader: 'varying vec2 u; void main(){ u = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: 'uniform sampler2D d; varying vec2 u; void main(){ gl_FragColor = vec4(texture2D(d, u).r, 0.0, 0.0, 1.0); }' }));
  const sc2 = new THREE.Scene(); sc2.add(q); const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  R.setRenderTarget(rtD); R.render(sc2, oc); const dep = new Float32Array(W * H * 4); R.readRenderTargetPixels(rtD, 0, 0, W, H, dep); R.setRenderTarget(null);
  ocultos.forEach(o => { o.visible = true; });
  // tonos: filmic (ACES) como la vista normal del simulador
  const exp = R.toneMappingExposure || 1, lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); },
    aces = (x) => { x *= exp * 0.9; return Math.max(0, Math.min(1, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14))); },
    srgb = (c) => Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
  const LUT = new Uint8Array(256); for (let i = 0; i < 256; i++) LUT[i] = srgb(aces(lin(i)));
  // cada píxel -> punto 3D (relativo al ojo), 4 cm por unidad
  const GY = T.sueloY != null ? T.sueloY : 0.3, v = new THREE.Vector3(), N = W * H, buf = new ArrayBuffer(N * 9), I16 = new Int16Array(buf, 0, N * 3), U8 = new Uint8Array(buf, N * 6, N * 3);
  let n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, d = dep[i * 4];
    if (!(d < 0.99999)) { // sin profundidad (suelo dibujado sin escribir profundidad): se proyecta sobre el plano del suelo
      v.set((x + 0.5) / W * 2 - 1, (y + 0.5) / H * 2 - 1, 0.5).unproject(cam).sub(cam.position).normalize();
      if (v.y > -0.004) continue; const tt = (GY - V.eye[1]) / v.y; if (tt > 450) continue; v.multiplyScalar(tt).add(cam.position);
    } else v.set((x + 0.5) / W * 2 - 1, (y + 0.5) / H * 2 - 1, d * 2 - 1).unproject(cam);
    const dx = v.x - V.eye[0], dy = v.y - V.eye[1], dz = v.z - V.eye[2]; if (dx * dx + dy * dy + dz * dz > 1300 * 1300) continue;
    I16[n * 3] = Math.round(dx * 25); I16[n * 3 + 1] = Math.round(dy * 25); I16[n * 3 + 2] = Math.round(dz * 25);
    U8[n * 3] = LUT[col[i * 4]]; U8[n * 3 + 1] = LUT[col[i * 4 + 1]]; U8[n * 3 + 2] = LUT[col[i * 4 + 2]]; n++;
  }
  const out = new Uint8Array(n * 9); out.set(new Uint8Array(buf, 0, n * 6), 0); out.set(new Uint8Array(buf, N * 6, n * 3), n * 6);
  let s = ''; for (let i = 0; i < out.length; i += 0x8000) s += String.fromCharCode.apply(null, out.subarray(i, i + 0x8000));
  // vista previa en color (para revisar)
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), im = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = ((H - 1 - y) * W + x) * 4, b = (y * W + x) * 4; im.data[a] = LUT[col[b]]; im.data[a + 1] = LUT[col[b + 1]]; im.data[a + 2] = LUT[col[b + 2]]; im.data[a + 3] = 255; }
  g.putImageData(im, 0, 0);
  // zonas de huerta y árboles 3D cerca (para ubicar cada especie sobre su huerta real), relativos al ojo
  const Z = (window.KEN_BAV && KEN_BAV.zonas || []).map(z => ({ n: z.n, x: z.c[0] - V.eye[0], z: z.c[1] - V.eye[2], ha: z.ha })).filter(z => Math.hypot(z.x, z.z) < 260);
  const TP = T.trees && T.trees.pos, AR = []; if (TP) for (let i = 0; i < TP.X.length; i++) { const dx = TP.X[i] - V.eye[0], dz = TP.Z[i] - V.eye[2]; if (dx * dx + dz * dz < 200 * 200) AR.push([+dx.toFixed(2), +dz.toFixed(2), +(TP.Hh[i] || 8).toFixed(1)]); }
  return JSON.stringify({ n, eye: V.eye, look: V.look, fov: V.fov, W, H, esc: 0.04, zonas: Z, arboles: AR, pts: btoa(s), prev: cv.toDataURL('image/jpeg', 0.85) });
})()

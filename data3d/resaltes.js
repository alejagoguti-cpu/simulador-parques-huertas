/* ============ RESALTES: pulso de luz donde se abre una huerta ============
   Al pasar a la propuesta las huertas (parques, lotes y cubiertas) se van abriendo año a año; cada una que se abre dispara un anillo verde
   que se expande sobre ella y una columna tenue que se desvanece en ~3,5 s, así se ve dónde va creciendo la red.
   Uso: const R = resaltes(T3); R.pulso(x, y, z, radio) */
let API = null;
export function resaltes(T3) {
  if (API) return API;
  const THREE = T3.THREE, MAX = 400, DUR = 3.5;
  const U = { uT: { value: 0 } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, depthTest: false, toneMapped: false, side: THREE.DoubleSide,
    vertexShader: 'attribute float t0; varying vec2 vU; varying float vE; uniform float uT; void main(){ vU = uv; vE = clamp((uT - t0) / ' + DUR.toFixed(1) + ', 0.0, 1.0); gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vU; varying float vE; void main(){ if (vE >= 1.0) discard; float d = length(vU - 0.5) * 2.0; if (d > 1.0) discard;
      float r = 0.15 + vE * 0.85, aro = smoothstep(0.12, 0.0, abs(d - r)), nucleo = smoothstep(0.35, 0.0, d) * (1.0 - vE);
      vec3 c = mix(vec3(0.75, 1.0, 0.45), vec3(0.3, 0.9, 0.45), vE); gl_FragColor = vec4(c, (aro * 0.95 + nucleo * 0.6) * (1.0 - vE));
      #include <colorspace_fragment>
    }` });
  const g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), t0 = new Float32Array(MAX).fill(-1e4); g.setAttribute('t0', new THREE.InstancedBufferAttribute(t0, 1));
  const im = new THREE.InstancedMesh(g, mat, MAX); im.frustumCulled = false; im.renderOrder = 14; im.count = MAX; T3.scene.add(im);
  const O = new THREE.Object3D(); O.scale.set(0, 0, 0); O.updateMatrix(); for (let i = 0; i < MAX; i++) im.setMatrixAt(i, O.matrix);
  let k = 0, ini = performance.now();
  const cuadro = () => { requestAnimationFrame(cuadro); U.uT.value = (performance.now() - ini) / 1000; };
  requestAnimationFrame(cuadro);
  API = {
    pulso(x, y, z, radio = 30) { const i = k++ % MAX; O.position.set(x, y + 0.6, z); O.scale.set(radio * 2, 1, radio * 2); O.updateMatrix(); im.setMatrixAt(i, O.matrix); im.instanceMatrix.needsUpdate = true;
      t0[i] = U.uT.value + (i % 7) * 0.05; g.attributes.t0.needsUpdate = true; },
    malla: im
  };
  return API;
}

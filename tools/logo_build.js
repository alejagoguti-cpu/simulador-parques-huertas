/* Logo del simulador: la silueta del límite real de la localidad de Kennedy (giro_sim.json, norte arriba) -> logo_kennedy.svg
   Uso: node tools/logo_build.js */
const fs = require('fs'), path = require('path');
const G = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data3d', 'giro_sim.json'), 'utf8'));
const P = G.limite; // marco giro: x este, y sur (en pantalla, y hacia abajo = sur: norte arriba)
let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
for (const [x, y] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const s = 60 / Math.max(x1 - x0, y1 - y0), ox = 32 - (x1 - x0) * s / 2, oy = 32 - (y1 - y0) * s / 2;
const d = 'M' + P.map(([x, y]) => ((x - x0) * s + ox).toFixed(1) + ' ' + ((y - y0) * s + oy).toFixed(1)).join('L') + 'Z';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="${d}" fill="#e2a55b" stroke="#f2c995" stroke-width="1.2" stroke-linejoin="round"/>
</svg>
`;
fs.writeFileSync(path.join(__dirname, '..', 'logo_kennedy.svg'), svg);
console.log({ puntos: P.length, ancho_m: Math.round(x1 - x0), alto_m: Math.round(y1 - y0) });

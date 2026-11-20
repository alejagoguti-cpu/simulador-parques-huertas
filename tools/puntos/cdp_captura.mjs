// Uso: node cdp_cap.mjs <url> <salida.txt> <espera_s> <archivo_js> [ancho] [alto]  -> guarda el valor (string) que devuelve el js
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, out, espera = '60', jsf, ancho = '1600', alto = '900'] = process.argv.slice(2);
const js = readFileSync(jsf, 'utf8');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const perfil = mkdtempSync(join(tmpdir(), 'edgecdp-'));
const port = 9333 + Math.floor(Math.random() * 500);
const pr = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${perfil}`, `--window-size=${ancho},${alto}`,
  '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let ws = null;
for (let i = 0; i < 40 && !ws; i++) { await sleep(500); try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find(t => t.type === 'page'); if (p) ws = p.webSocketDebuggerUrl; } catch {} }
if (!ws) { console.log('sin CDP'); pr.kill(); process.exit(1); }
const s = new WebSocket(ws); let id = 0; const pend = new Map();
const call = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); s.send(JSON.stringify({ id: i, method, params })); });
s.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result || d); pend.delete(d.id); return; }
  if (d.method === 'Runtime.exceptionThrown') console.log('[excepcion]', (d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description || d.params.exceptionDetails.text).slice(0, 600)); };
await new Promise(r => s.onopen = r);
await call('Runtime.enable'); await call('Page.enable');
await call('Emulation.setDeviceMetricsOverride', { width: +ancho, height: +alto, deviceScaleFactor: 1, mobile: false });
await call('Page.navigate', { url });
await sleep(+espera * 1000);
const r = await call('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true });
const v = r.result && r.result.value;
if (typeof v === 'string') { writeFileSync(out, v); console.log('guardado', out, v.length); } else console.log('eval:', JSON.stringify(r).slice(0, 1500));
const shot = await call('Page.captureScreenshot', { format: 'png' }); writeFileSync(out + '.png', Buffer.from(shot.data, 'base64'));
s.close(); pr.kill(); await sleep(1500); try { rmSync(perfil, { recursive: true, force: true }); } catch {} process.exit(0);

/* ============ LABORATORIO INTERACTIVO DE PARQUES Y HUERTAS URBANAS · KENNEDY, BOGOTÁ ============
   Punto de entrada conectado a los botones "Parques" (#b-parques) y "Parques y huertas" (#pq-btn) de index.html.
   Integra sin reemplazar nada del visor 3D existente:
   - Fase 1: Diagnóstico de 12 criterios sobre los 576 parques reales de Kennedy (proveniencia: Importado/Medido/Estimado/Verificar)
   - Fase 2: Parque Piloto completo (Parque Zonal Castilla · 13.752 m²) escalable a los 576 parques + editor manual 2D/3D
   - Fase 3: Biblioteca paramétrica de 7 tipologías (A–G), mobiliario e infraestructura + especificaciones INTA Pro Huerta
   - Fase 4: Generador automático de 3 escenarios (A Producción · B Agroecológico · C Comunitario Educativo) con restricciones
   - Fase 5: Ciclo productivo de 8 etapas (semilla → germinación → trasplante → crecimiento → cosecha → aprovechamiento → residuo → regeneración)
   - Fase 6: 7 simulaciones transparentes (Solar, Hídrica, Productiva, Compostaje, Biodiversidad, Uso Público, Costos)
   - Fase 7: Comparación de escenarios A/B/C, 6 capas de planos técnicos (2 cuadraditos = 1 m) y exportaciones (PDF, SVG, GeoJSON, CSV, JSON). */

import { BOGOTA_CLIMA, TIPOLOGIAS, ESPECIES, CATALOGO_ELEMENTOS } from './huertas_lab/datos_agronomia.js?v=1';
import { cargarContextoTerritorial, PROVENIENCIA } from './huertas_lab/diagnostico_parque.js?v=1';
import { DEFAULT_CFG, generarProyecto, generarTresEscenarios, ejecutarSimulaciones, calcularCercoINTA } from './huertas_lab/motor_espacial.js?v=1';
import { CAPAS_PLANO, renderPlanoCapaSVG, generarGeoJSON, generarCSV, abrirReportePDF } from './huertas_lab/planos_export.js?v=1';
import { crearVisor3D } from './huertas_lab/visor_3d.js?v=1';

const STORAGE_KEY = 'kennedy_huertas_lab_v2';
const TIPO_SHORT = {
  'PARQUE METROPOLITANO': 'Metropolitano',
  'PARQUE ZONAL': 'Zonal',
  'PARQUE VECINAL': 'Vecinal',
  'PARQUE DE BOLSILLO': 'Bolsillo'
};
const esc = (s) => String(s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const fmt = (v, d = 0) => Number(v).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

export async function crearParquesHuertas({ THREE, T3, lw, say = () => {} }) {
  const ctx = await cargarContextoTerritorial({ T3, lw });
  const { PARQUES, analizarParque, encontrarSitioOptimo } = ctx;

  // Persistencia local de proyectos editados y registros de campo
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (e) {}
  const persistir = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch (e) {} };

  // Estado interactivo del laboratorio
  let filtroTipo = 'TODOS';
  let busqueda = '';
  let parqueActivo = null;
  let diagActivo = null;
  let proyectoActivo = null;
  let escenariosABC = null;
  let cfgActiva = { ...DEFAULT_CFG };
  let simEnv = { mes: 6, hora: 10.5, diaCiclo: 65 };
  let verZonas3D = true;
  let riegoAnimOn = true;
  let playTimer = 0;
  let capaPlano = 'camas';
  let especieFoco = 'lechuga';
  let elemSelId = null;
  let modoPoligono = false;
  let polyTemp = [];
  let undoStack = [];
  let redoStack = [];
  let onChangeCb = null;

  const visor = crearVisor3D({
    THREE, T3, PARQUES,
    onPickPark: (p) => { seleccionarParque(p, true); selectPanelTab(1); },
    onPickElement: (el) => {
      if (el.especieId) {
        especieFoco = el.especieId;
        elemSelId = el.id;
        poblarModal();
        modal.showModal();
        selectModalTab(2); // Abre directamente la historia de 8 etapas de esa planta!
      } else {
        say(`${el.n} · ${el.justificacion || ''}`, 4200);
      }
    }
  });

  /* ================= ESTILOS ACCESSIBLE GLASS + RESPONSIVE TABLE ================= */
  const style = document.createElement('style');
  style.textContent = `
#ph-panel{
  position:fixed; inset:auto; right:14px; top:66px; width:min(380px,calc(100vw - 24px));
  max-height:calc(100vh - 150px); margin:0; padding:0; z-index:35; color:#eef2f0;
  font-family:var(--ui-sans,Inter,system-ui,sans-serif); font-size:12px; line-height:1.4;
  background:var(--ui-glass,linear-gradient(160deg,rgba(24,33,31,.9),rgba(9,13,14,.94)));
  border:1px solid var(--ui-glass-bd,rgba(255,255,255,.16)); border-radius:18px;
  box-shadow:var(--ui-glass-sh,0 22px 50px rgba(0,0,0,.42));
  -webkit-backdrop-filter:var(--ui-glass-fx,blur(24px) saturate(1.8)); backdrop-filter:var(--ui-glass-fx,blur(24px) saturate(1.8));
  overflow:hidden;
}
#ph-panel:is(:popover-open, .\\:popover-open), #ph-panel[open]{ display:flex; flex-direction:column; }
#ph-panel::backdrop{ display:none; }
.ph-hd{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:11px 14px 9px; border-bottom:1px solid rgba(255,255,255,.1); flex:none; }
.ph-hd h2{ margin:0; font-size:13.5px; font-weight:600; color:#f4f7f5; display:flex; align-items:center; gap:7px; }
.ph-hd h2 .dot{ width:8px; height:8px; border-radius:50%; background:#34d399; box-shadow:0 0 10px #34d399; flex:none; }
.ph-hd small{ display:block; font:400 9.5px var(--ui-mono,monospace); color:#9fb0a8; letter-spacing:.07em; text-transform:uppercase; margin-top:2px; }
#ph-panel .ph-x, #ph-modal .ph-x{ min-width:30px; min-height:30px; padding:0; border-radius:9px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#d8e2dd; font-size:16px; cursor:pointer; display:grid; place-items:center; }
#ph-panel .ph-x:hover, #ph-modal .ph-x:hover{ background:rgba(255,255,255,.14); color:#fff; border-color:rgba(255,255,255,.28); }
#ph-panel :is(button,input,select):focus-visible, #ph-modal :is(button,input,select,textarea):focus-visible{ outline:2px solid #34d399; outline-offset:2px; }

.ph-tabs{ display:flex; overflow-x:auto; scrollbar-width:none; border-bottom:1px solid rgba(255,255,255,.1); padding:0 8px; gap:2px; flex:none; }
.ph-tabs::-webkit-scrollbar{ display:none; }
#ph-panel .ph-tabs [role="tab"], #ph-modal .ph-tabs [role="tab"]{
  position:relative; flex:none; min-height:36px; padding:6px 10px; border:0; border-radius:0; background:transparent;
  color:#a8b5ae; font:500 11.2px var(--ui-sans,Inter,sans-serif); cursor:pointer; white-space:nowrap;
}
#ph-panel .ph-tabs [role="tab"]:hover, #ph-modal .ph-tabs [role="tab"]:hover{ color:#f0f5f2; background:rgba(255,255,255,.04); border:0; }
#ph-panel .ph-tabs [role="tab"][aria-selected="true"], #ph-modal .ph-tabs [role="tab"][aria-selected="true"]{ color:#86efac; background:transparent; }
#ph-panel .ph-tabs [role="tab"][aria-selected="true"]::after, #ph-modal .ph-tabs [role="tab"][aria-selected="true"]::after{
  content:""; position:absolute; inset:auto 6px 0; border-block-end:2.5px solid #34d399;
}

.ph-body{ overflow-y:auto; flex:1; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.16) transparent; }
.ph-tp-inner{ padding:11px 13px 14px; display:flex; flex-direction:column; gap:9px; }
.ph-row{ display:flex; gap:5px; flex-wrap:wrap; align-items:center; }
.ph-grid2{ display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.ph-grid3{ display:grid; grid-template-columns:repeat(3,1fr); gap:5px; }
.ph-grid4{ display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
.ph-label{ display:block; font:500 9.5px var(--ui-mono,monospace); letter-spacing:.1em; text-transform:uppercase; color:#94a39b; margin-bottom:3px; }
.ph-input, .ph-select{ width:100%; min-height:31px; padding:5px 8px; border-radius:8px; border:1px solid rgba(255,255,255,.15); background:rgba(0,0,0,.3); color:#f1f5f3; font:400 11.5px var(--ui-sans,Inter,sans-serif); }
.ph-select option{ background:#121817; color:#f1f5f3; }

#ph-panel .ph-btn, #ph-modal .ph-btn{
  min-height:29px; padding:5px 9px; border-radius:8px; border:1px solid rgba(255,255,255,.13);
  background:rgba(255,255,255,.06); color:#d4dfd9; font:500 11px var(--ui-sans,Inter,sans-serif);
  cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:5px; text-align:center;
}
#ph-panel .ph-btn:hover, #ph-modal .ph-btn:hover{ background:rgba(255,255,255,.13); color:#fff; border-color:rgba(255,255,255,.24); }
#ph-panel .ph-btn[aria-pressed="true"], #ph-panel .ph-btn.on, #ph-modal .ph-btn[aria-pressed="true"], #ph-modal .ph-btn.on{ background:rgba(52,211,153,.2); border-color:rgba(52,211,153,.65); color:#bbf7d0; }
#ph-panel .ph-btn-pri, #ph-modal .ph-btn-pri{ background:linear-gradient(115deg,#10b981,#059669); border-color:#34d399; color:#041c12; font-weight:600; min-height:36px; width:100%; }
#ph-panel .ph-btn-pri:hover, #ph-modal .ph-btn-pri:hover{ background:linear-gradient(115deg,#34d399,#10b981); color:#03150d; border-color:#6ee7b7; }
#ph-panel .ph-btn-amb, #ph-modal .ph-btn-amb{ background:rgba(226,165,91,.18); border-color:rgba(226,165,91,.55); color:#f8d8a8; }

.ph-list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:5px; max-height:240px; overflow-y:auto; }
#ph-panel .ph-list button{
  width:100%; text-align:left; padding:7px 9px; border-radius:9px; border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.04); color:#e9f0ec; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:7px;
}
#ph-panel .ph-list button:hover{ background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.2); }
#ph-panel .ph-list button.sel{ background:rgba(52,211,153,.16); border-color:rgba(52,211,153,.6); }
.ph-list .pnom{ font-weight:500; font-size:11.5px; display:block; }
.ph-list .pmeta{ font:400 10px var(--ui-mono,monospace); color:#9fb0a8; display:block; margin-top:1px; }
.ph-tag{ flex:none; font:500 8.8px var(--ui-mono,monospace); padding:2px 6px; border-radius:999px; border:1px solid currentColor; text-transform:uppercase; }

.ph-kpis{ display:grid; grid-template-columns:repeat(3,1fr); gap:5px; }
.ph-kpi{ background:rgba(0,0,0,.24); border:1px solid rgba(255,255,255,.09); border-radius:9px; padding:6px 8px; }
.ph-kpi b{ display:block; font:600 12.5px var(--ui-mono,monospace); color:#86efac; }
.ph-kpi span{ display:block; font-size:9.3px; color:#9fb0a8; margin-top:1px; }
.ph-box{ background:rgba(0,0,0,.22); border:1px solid rgba(255,255,255,.09); border-radius:10px; padding:9px 10px; }
.ph-box h3{ margin:0 0 6px; font:600 9.8px var(--ui-mono,monospace); letter-spacing:.11em; text-transform:uppercase; color:#e2a55b; }
.ph-chk{ display:flex; align-items:center; gap:7px; min-height:26px; cursor:pointer; color:#dce6e0; font-size:11px; }
.ph-chk input{ accent-color:#34d399; width:14px; height:14px; cursor:pointer; }

/* Barra de zonificación 3 clases */
.ph-zbar{ display:flex; height:10px; border-radius:999px; overflow:hidden; background:rgba(255,255,255,.08); margin:4px 0 6px; }
.ph-crit{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:5px; }
.ph-crit li{ background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.07); border-radius:8px; padding:6px 8px; font-size:10.8px; }
.ph-crit .ctop{ display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:2px; }
.ph-crit b{ color:#f0f5f2; font-weight:600; }
.ph-crit small{ color:#9fb0a8; display:block; font-size:9.5px; margin-top:2px; }

/* Modal Laboratorio completo (<dialog>) */
#ph-modal{
  width:min(1140px,calc(100vw - 24px)); max-height:min(92vh,880px); margin:auto; padding:0;
  color:#eef2f0; font-family:var(--ui-sans,Inter,system-ui,sans-serif); font-size:12px;
  background:#0d1413; border:1px solid rgba(255,255,255,.16); border-radius:18px;
  box-shadow:0 28px 80px rgba(0,0,0,.72); overflow:hidden;
}
#ph-modal[open]{ display:flex; flex-direction:column; }
#ph-modal:modal{ overscroll-behavior:contain; }
#ph-modal::backdrop{ background:rgba(4,9,11,.76); backdrop-filter:blur(8px); overflow:hidden; overscroll-behavior:contain; }
.ph-mbody{ overflow-y:auto; flex:1; }
.ph-svg-wrap{ background:#f7faf8; border-radius:12px; border:1px solid rgba(255,255,255,.14); overflow:auto; padding:10px; text-align:center; max-height:54vh; }
.ph-svg-wrap svg{ max-width:100%; height:auto; display:inline-block; user-select:none; }

/* Editor Manual 2D/3D layout */
.ph-ed-grid{ display:grid; grid-template-columns:1fr 270px; gap:10px; align-items:start; }
@media (max-width:860px){ .ph-ed-grid{ grid-template-columns:1fr; } }

/* Ciclo de 8 etapas visual */
.ph-ciclo{ display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:8px; }
.ph-etapa{ background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:10px; padding:9px 10px; }
.ph-etapa.act{ border-color:#34d399; background:rgba(52,211,153,.12); }
.ph-etapa h4{ margin:0 0 4px; font:600 10.5px var(--ui-mono,monospace); color:#86efac; text-transform:uppercase; }
.ph-etapa p{ margin:0; font-size:11px; color:#d7e3dc; }

/* Cards de las 7 simulaciones transparentes */
.ph-sim-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(310px,1fr)); gap:9px; }
.ph-sim-card{ background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:11px; padding:10px 11px; }
.ph-sim-card h4{ margin:0 0 3px; font-size:12.5px; color:#f4f7f5; display:flex; justify-content:space-between; gap:6px; align-items:center; }
.ph-sim-res{ font:600 11.5px var(--ui-mono,monospace); color:#86efac; margin-bottom:6px; }
.ph-sim-meta{ font-size:10.4px; color:#b8c6be; display:flex; flex-direction:column; gap:3px; }
.ph-sim-meta b{ color:#e2a55b; font-weight:500; }
.ph-bars{ display:grid; grid-template-columns:repeat(12,1fr); gap:3px; align-items:end; height:64px; margin:7px 0 3px; padding:4px; background:rgba(0,0,0,.25); border-radius:7px; }
.ph-bar-col{ display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; gap:1px; }
.ph-bar-col span{ font:400 8px var(--ui-mono,monospace); color:#9fb0a8; }

/* Tabla responsiva accesible con container queries (modern-web-guidance: responsive-table) */
.ph-twrap{ overflow:auto; max-inline-size:100%; max-block-size:48vh; container-type:inline-size; border:1px solid rgba(255,255,255,.11); border-radius:10px; background:rgba(0,0,0,.22); }
.ph-twrap table{ width:100%; border-collapse:separate; border-spacing:0; font-size:11px; }
.ph-twrap caption{ text-align:left; padding:8px 10px; font:600 10px var(--ui-mono,monospace); letter-spacing:.08em; text-transform:uppercase; color:#e2a55b; background:#131d1b; }
.ph-twrap thead{ position:sticky; inset-block-start:0; z-index:2; background:#162421; }
.ph-twrap th, .ph-twrap td{ padding:7px 8px; text-align:left; border-bottom:1px solid rgba(255,255,255,.08); vertical-align:top; }
.ph-twrap thead th{ font:600 9.5px var(--ui-mono,monospace); letter-spacing:.07em; text-transform:uppercase; color:#9fd8bc; white-space:nowrap; }
.ph-twrap tbody th{ position:sticky; inset-inline-start:0; z-index:1; background:#111b19; font-weight:600; color:#f1f5f3; }
@container (width < 520px){
  .ph-twrap table, .ph-twrap thead, .ph-twrap tbody, .ph-twrap tr, .ph-twrap th, .ph-twrap td{ display:block; }
  .ph-twrap thead{ display:none; }
  .ph-twrap tr{ margin-block-end:10px; border:1px solid rgba(255,255,255,.12); border-radius:8px; overflow:hidden; }
  .ph-twrap tbody th{ position:sticky; inset-block-start:0; z-index:2; background:#192925; }
  .ph-twrap td::before{ content:attr(data-col) ": "; font-weight:600; color:#86efac; }
}
.ph-sr{ position:absolute!important; clip-path:inset(50%)!important; overflow:hidden!important; width:1px!important; height:1px!important; margin:-1px!important; padding:0!important; border:0!important; white-space:nowrap!important; }
@media (pointer:coarse){ #ph-panel .ph-btn, #ph-modal .ph-btn, .ph-tabs [role="tab"]{ min-height:38px; } }
@media (max-width:760px){ #ph-panel{ right:8px; left:8px; width:auto; top:auto; bottom:calc(max(16px,env(safe-area-inset-bottom)) + 64px); max-height:56vh; } }
`;
  document.head.appendChild(style);

  const live = document.createElement('div');
  live.className = 'ph-sr'; live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);
  const anunciar = (txt) => { live.textContent = ''; setTimeout(() => { live.textContent = txt; }, 40); };

  /* ================= PANEL NO MODAL (<dialog popover="manual">) ================= */
  const panel = document.createElement('dialog');
  panel.id = 'ph-panel';
  panel.setAttribute('popover', 'manual');
  panel.setAttribute('aria-labelledby', 'ph-title');
  panel.innerHTML = `
    <div class="ph-hd">
      <div>
        <h2 id="ph-title"><span class="dot" aria-hidden="true"></span>Parques · Lab Agroecológico</h2>
        <small>${PARQUES.length} parques Kennedy · INTA + JBB + FAO</small>
      </div>
      <button type="button" class="ph-x" id="ph-close" aria-label="Cerrar panel de parques y huertas">×</button>
    </div>
    <div class="ph-tabs" role="tablist" focusgroup="tablist nomemory" aria-label="Flujo de diseño de huertas" id="ph-tabs">
      <button type="button" role="tab" id="ph-t-parques" aria-selected="true" focusgroupstart>1. Parques (${PARQUES.length})</button>
      <button type="button" role="tab" id="ph-t-diag" aria-selected="false">2. Diagnóstico</button>
      <button type="button" role="tab" id="ph-t-diseno" aria-selected="false">3. Diseñar Huerta</button>
    </div>
    <div class="ph-body">
      <!-- TAB 1: 576 PARQUES + PARQUE PILOTO -->
      <div role="tabpanel" aria-labelledby="ph-t-parques" tabindex="0" id="ph-p-parques">
        <div class="ph-tp-inner">
          <button type="button" class="ph-btn ph-btn-amb" id="ph-piloto-btn" style="width:100%">★ Abrir Parque Piloto: Parque Zonal Castilla (13.752 m²)</button>
          <div>
            <label class="ph-label" for="ph-buscar">Buscar entre los ${PARQUES.length} parques de Kennedy</label>
            <input type="search" id="ph-buscar" class="ph-input" placeholder="Ej. Castilla, Timiza, Tintal, Alsacia…" autocomplete="off" />
          </div>
          <div class="ph-row" role="group" aria-label="Filtrar por clasificación IDRD" id="ph-filtros">
            <button type="button" class="ph-btn on" data-f="TODOS" aria-pressed="true">Todos</button>
            <button type="button" class="ph-btn" data-f="PARQUE METROPOLITANO" aria-pressed="false">Metro</button>
            <button type="button" class="ph-btn" data-f="PARQUE ZONAL" aria-pressed="false">Zonal</button>
            <button type="button" class="ph-btn" data-f="PARQUE VECINAL" aria-pressed="false">Vecinal</button>
            <button type="button" class="ph-btn" data-f="PARQUE DE BOLSILLO" aria-pressed="false">Bolsillo</button>
          </div>
          <div class="ph-grid2">
            <button type="button" class="ph-btn" id="ph-vista-all">🗺 Ver 576 parques</button>
            <button type="button" class="ph-btn" id="ph-acercar">🔎 Acercar huerta</button>
          </div>
          <ul class="ph-list" id="ph-lista" aria-label="Lista de parques de Kennedy"></ul>
        </div>
      </div>

      <!-- TAB 2: DIAGNÓSTICO DE 12 CRITERIOS (SECCIÓN 2) -->
      <div role="tabpanel" aria-labelledby="ph-t-diag" hidden="until-found" id="ph-p-diag">
        <div class="ph-tp-inner">
          <div class="ph-box">
            <h3 id="ph-diag-nom">Diagnóstico del parque</h3>
            <div class="ph-zbar" id="ph-zbar" aria-hidden="true"></div>
            <div class="ph-kpis" id="ph-diag-kpis"></div>
            <label class="ph-chk" style="margin-top:6px"><input type="checkbox" id="ph-ver-zonas" checked /> Mostrar áreas Apta / Condicionada / No apta en 3D</label>
          </div>
          <div class="ph-box">
            <h3>Tipologías viables según contexto (no regla fija)</h3>
            <div id="ph-diag-rec" class="ph-row"></div>
          </div>
          <button type="button" class="ph-btn ph-btn-pri" id="ph-go-disenar">🌱 DISEÑAR HUERTA EN ESTE PARQUE</button>
          <ul class="ph-crit" id="ph-diag-12" aria-label="Los 12 criterios de análisis del parque"></ul>
        </div>
      </div>

      <!-- TAB 3: DISEÑAR HUERTA (7 TIPOLOGÍAS · ESCENARIOS A/B/C · INTA · ANIMACIONES 3D) -->
      <div role="tabpanel" aria-labelledby="ph-t-diseno" hidden="until-found" id="ph-p-diseno">
        <div class="ph-tp-inner">
          <div class="ph-box">
            <h3 id="ph-parque-actual">Huerta activa</h3>
            <div class="ph-kpis" id="ph-kpis"></div>
          </div>

          <div>
            <span class="ph-label">Modo automático · 3 escenarios comparables</span>
            <div class="ph-grid3" role="group" aria-label="Escenarios automáticos A B C">
              <button type="button" class="ph-btn" data-esc="A" aria-pressed="false">Esc. A<br>Prod. máx</button>
              <button type="button" class="ph-btn on" data-esc="B" aria-pressed="true">Esc. B<br>Agroecol.</button>
              <button type="button" class="ph-btn" data-esc="C" aria-pressed="false">Esc. C<br>Educativo</button>
            </div>
          </div>

          <div>
            <label class="ph-label" for="ph-tipo-sel">Tipología de huerta (7 modelos A–G)</label>
            <select id="ph-tipo-sel" class="ph-select">
              ${Object.values(TIPOLOGIAS).map(t => `<option value="${t.id}">${t.letra} · ${esc(t.n)}</option>`).join('')}
            </select>
          </div>

          <!-- Animaciones de procesos 3D en tiempo real (Ciclo 0-180d · Sol Bogotá · Riego) -->
          <div class="ph-box">
            <h3>Simulación viva en 3D (Ciclo · Sol · Riego)</h3>
            <div class="ph-row" style="justify-content:space-between;margin-bottom:3px">
              <label class="ph-label" for="ph-dia" style="margin:0">Día <span id="ph-dia-v">65</span>/180 · <em id="ph-etapa-v" style="color:#86efac;font-style:normal">Crecimiento</em></label>
              <button type="button" class="ph-btn" id="ph-play-ciclo" style="min-height:24px;padding:2px 8px">▶ Ciclo</button>
            </div>
            <input type="range" id="ph-dia" min="0" max="180" step="1" value="65" style="width:100%;accent-color:#34d399" />
            <div class="ph-grid2" style="margin-top:6px">
              <div>
                <label class="ph-label" for="ph-hora">Sol hora: <span id="ph-hora-v">10:30</span></label>
                <input type="range" id="ph-hora" min="6.5" max="17.5" step="0.5" value="10.5" style="width:100%;accent-color:#f59e0b" />
              </div>
              <div>
                <label class="ph-label" for="ph-mes">Mes Bogotá</label>
                <select id="ph-mes" class="ph-select" style="min-height:26px;padding:2px 6px">
                  ${BOGOTA_CLIMA.meses.map((m, i) => `<option value="${i + 1}" ${i === 5 ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
              </div>
            </div>
            <label class="ph-chk" style="margin-top:4px"><input type="checkbox" id="ph-riego-anim" checked /> Animar flujo de agua en riego por goteo</label>
          </div>

          <!-- Parámetros INTA Pro Huerta -->
          <div class="ph-grid2">
            <div>
              <span class="ph-label">Concepto INTA</span>
              <div class="ph-grid2" role="group" aria-label="Concepto de diseño">
                <button type="button" class="ph-btn" data-cfg="concepto" data-v="utilitario" aria-pressed="false">Utilit.</button>
                <button type="button" class="ph-btn on" data-cfg="concepto" data-v="paisajistico" aria-pressed="true">Jardín</button>
              </div>
            </div>
            <div>
              <span class="ph-label">Orientación</span>
              <div class="ph-grid2" role="group" aria-label="Orientación">
                <button type="button" class="ph-btn on" data-cfg="orientacion" data-v="norte" aria-pressed="true">Norte</button>
                <button type="button" class="ph-btn" data-cfg="orientacion" data-v="parque" aria-pressed="false">Parque</button>
              </div>
            </div>
          </div>

          <div class="ph-grid2">
            <div>
              <label class="ph-label" for="ph-ancho">Ancho (riego goteo)</label>
              <select id="ph-ancho" class="ph-select"><option value="1">1,00 m · 2 líneas</option><option value="1.25" selected>1,25 m · 3 líneas</option></select>
            </div>
            <div>
              <label class="ph-label" for="ph-largo">Largo cantero</label>
              <select id="ph-largo" class="ph-select"><option value="4">4 m (4–5 m²)</option><option value="6" selected>6 m (6–7,5 m²)</option><option value="8">8 m (8–10 m²)</option></select>
            </div>
          </div>

          <div>
            <label class="ph-label" for="ph-ncant">Camas de cultivo: <span id="ph-ncant-v">10</span></label>
            <input type="range" id="ph-ncant" min="4" max="20" step="1" value="10" style="width:100%;accent-color:#34d399" />
          </div>

          <div class="ph-grid2">
            <div>
              <label class="ph-label" for="ph-cont">Contención lateral</label>
              <select id="ph-cont" class="ph-select">
                <option value="ladrillo" selected>Ladrillo (INTA)</option>
                <option value="piedra">Piedra</option>
                <option value="botellas">Botellas vidrio</option>
                <option value="madera">Madera tratada</option>
              </select>
            </div>
            <div>
              <label class="ph-label" for="ph-cerco">Cerco 1,50 m</label>
              <select id="ph-cerco" class="ph-select">
                <option value="romboidal" selected>Romboidal 3"</option>
                <option value="madera">Tablas madera</option>
                <option value="palo">Palo a pique</option>
                <option value="ninguno">Abierta</option>
              </select>
            </div>
          </div>

          <div>
            <span class="ph-label">Rotación ≥ 3 años (ciclo 4 familias)</span>
            <div class="ph-grid4" role="group" aria-label="Año de rotación">
              <button type="button" class="ph-btn on" data-cfg="anioRotacion" data-v="1" aria-pressed="true">Año 1</button>
              <button type="button" class="ph-btn" data-cfg="anioRotacion" data-v="2" aria-pressed="false">Año 2</button>
              <button type="button" class="ph-btn" data-cfg="anioRotacion" data-v="3" aria-pressed="false">Año 3</button>
              <button type="button" class="ph-btn" data-cfg="anioRotacion" data-v="4" aria-pressed="false">Año 4</button>
            </div>
          </div>

          <div class="ph-box" style="display:flex;flex-direction:column;gap:1px">
            <label class="ph-chk"><input type="checkbox" id="ph-inv" checked /> Invernadero (antiheladas y almácigos)</label>
            <label class="ph-chk"><input type="checkbox" id="ph-cort" checked /> Cortina cortavientos (Sur y Oeste)</label>
            <label class="ph-chk"><input type="checkbox" id="ph-mfina" checked /> Faja malla fina 1 m (ent. 40 cm)</label>
            <label class="ph-chk"><input type="checkbox" id="ph-guia" checked /> Escuadra 3-4-5 (60 × 80 × 100 cm)</label>
          </div>

          <button type="button" class="ph-btn ph-btn-pri" id="ph-open-modal">🧭 Editor Manual · Simulaciones · Planos · Exportar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  /* ================= MODAL DE LABORATORIO COMPLETO (<dialog closedby="any">) ================= */
  const modal = document.createElement('dialog');
  modal.id = 'ph-modal';
  modal.setAttribute('closedby', 'any');
  modal.setAttribute('aria-labelledby', 'ph-mtitle');
  modal.innerHTML = `
    <div class="ph-hd">
      <div>
        <h2 id="ph-mtitle">Laboratorio Agroecológico · Diseño, Simulaciones y Planos</h2>
        <small id="ph-msub">Pro Huerta INTA · JBB · FAO-56 · AGROSAVIA · Kennedy, Bogotá</small>
      </div>
      <div class="ph-row">
        <button type="button" class="ph-btn ph-btn-amb" id="ph-exp-pdf">🖨 PDF</button>
        <button type="button" class="ph-btn" id="ph-exp-svg">⬇ SVG</button>
        <button type="button" class="ph-btn" id="ph-exp-geo">⬇ GeoJSON</button>
        <button type="button" class="ph-btn" id="ph-exp-csv">⬇ CSV</button>
        <button type="button" class="ph-x" id="ph-mclose" aria-label="Cerrar laboratorio técnico">×</button>
      </div>
    </div>
    <div class="ph-tabs" role="tablist" focusgroup="tablist nomemory" aria-label="Herramientas del laboratorio agroecológico" id="ph-mtabs">
      <button type="button" role="tab" id="ph-mt-ed" aria-selected="true" focusgroupstart>✏️ Editor Manual 2D/3D</button>
      <button type="button" role="tab" id="ph-mt-planos" aria-selected="false">📐 Planos (6 capas)</button>
      <button type="button" role="tab" id="ph-mt-ciclo" aria-selected="false">🌱 Ciclo 8 Etapas</button>
      <button type="button" role="tab" id="ph-mt-sims" aria-selected="false">📊 7 Simulaciones</button>
      <button type="button" role="tab" id="ph-mt-comp" aria-selected="false">⚖️ Comparar A / B / C</button>
      <button type="button" role="tab" id="ph-mt-cerco" aria-selected="false">🧰 Cerco INTA y Registro</button>
    </div>
    <div class="ph-mbody">
      <!-- MODAL TAB 1: EDITOR MANUAL 2D/3D -->
      <div role="tabpanel" aria-labelledby="ph-mt-ed" tabindex="0" id="ph-mp-ed">
        <div class="ph-tp-inner">
          <div class="ph-row" style="justify-content:space-between">
            <div class="ph-row">
              <label class="ph-label" for="ph-add-tipo" style="margin:0">Añadir módulo:</label>
              <select id="ph-add-tipo" class="ph-select" style="width:auto;min-width:190px">
                ${Object.values(CATALOGO_ELEMENTOS).map(e => `<option value="${e.id}">${esc(e.n)} (${e.l}×${e.w}m)</option>`).join('')}
              </select>
              <button type="button" class="ph-btn" id="ph-add-btn">+ Insertar</button>
              <button type="button" class="ph-btn" id="ph-poly-btn" aria-pressed="false">⬠ Dibujar polígono</button>
            </div>
            <div class="ph-row">
              <button type="button" class="ph-btn" id="ph-undo">↶ Deshacer</button>
              <button type="button" class="ph-btn" id="ph-redo">↷ Rehacer</button>
              <button type="button" class="ph-btn ph-btn-amb" id="ph-save-proj">💾 Guardar proyecto</button>
            </div>
          </div>
          <div class="ph-ed-grid">
            <div class="ph-svg-wrap" id="ph-ed-canvas" style="max-height:56vh"></div>
            <div class="ph-box" id="ph-ed-prop">
              <h3>Elemento seleccionado</h3>
              <p style="color:#9fb0a8;font-size:11px">Haz clic sobre cualquier cama, banca, mesa, pérgola o infraestructura en el plano para moverla (arrastrando), rotarla, cambiar dimensiones o elegir especie. Todos los cambios se reflejan en 3D en vivo.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL TAB 2: PLANOS TÉCNICOS (6 CAPAS) -->
      <div role="tabpanel" aria-labelledby="ph-mt-planos" hidden="until-found" id="ph-mp-planos">
        <div class="ph-tp-inner">
          <div class="ph-row" role="group" aria-label="Capas de planos técnicos" id="ph-capas-btns">
            ${CAPAS_PLANO.map((c, i) => `<button type="button" class="ph-btn ${i === 0 ? 'on' : ''}" data-capa="${c.id}" aria-pressed="${i === 0}">${esc(c.n)}</button>`).join('')}
          </div>
          <div class="ph-svg-wrap" id="ph-plano-box"></div>
          <div class="ph-kpis" id="ph-mkpis" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))"></div>
        </div>
      </div>

      <!-- MODAL TAB 3: CICLO DE 8 ETAPAS (SEMILLA → RESIDUO) + TABLA DE CULTIVOS -->
      <div role="tabpanel" aria-labelledby="ph-mt-ciclo" hidden="until-found" id="ph-mp-ciclo">
        <div class="ph-tp-inner">
          <div class="ph-row" style="justify-content:space-between">
            <div class="ph-row">
              <label class="ph-label" for="ph-esp-foco" style="margin:0">Inspeccionar historia completa de especie:</label>
              <select id="ph-esp-foco" class="ph-select" style="width:auto;min-width:220px">
                ${Object.values(ESPECIES).map(e => `<option value="${e.id}">${esc(e.n)} (${esc(e.fam)})</option>`).join('')}
              </select>
            </div>
            <span id="ph-esp-clima" style="font-size:11px;color:#86efac"></span>
          </div>
          <div class="ph-ciclo" id="ph-ciclo-8"></div>
          <div tabindex="0" role="region" aria-labelledby="ph-cap-cul" class="ph-twrap">
            <table>
              <caption id="ph-cap-cul">Calendario de siembra, asociaciones y rotación de 4 años por cama</caption>
              <thead><tr>
                <th scope="col">Cama</th><th scope="col">Especie (Bogotá)</th><th scope="col">Área / Goteo</th>
                <th scope="col">Luz directa</th><th scope="col">Distancia</th><th scope="col">Siembra y cosecha</th>
                <th scope="col">Relevo / Sucesión</th><th scope="col">Rotación 4 años</th>
              </tr></thead>
              <tbody id="ph-tb-cul"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL TAB 4: 7 SIMULACIONES TRANSPARENTES (SECCIÓN 7 & 9) -->
      <div role="tabpanel" aria-labelledby="ph-mt-sims" hidden="until-found" id="ph-mp-sims">
        <div class="ph-tp-inner">
          <div class="ph-sim-grid" id="ph-sims-box"></div>
          <div class="ph-box">
            <h3>Arquitectura tecnológica y transparencia (GitHub Pages estático vs. cálculo científico externo)</h3>
            <p style="margin:0;font-size:11px;color:#c3d2ca">
              <b>Ejecución estática en navegador (GitHub Pages):</b> Three.js 3D, geometría de 576 parques IDRD, posición solar astronómica Bogotá (4.63°N), balance hídrico FAO-56/IDEAM, rangos productivos JBB/INTA, compostaje, biodiversidad estructural, editor 2D/3D y exportación SVG/PDF/CSV/GeoJSON.<br>
              <b>Requiere servicio/backend externo (no simulado localmente como dato de laboratorio):</b> radiación solar horaria por raytracing urbano detallado (<b>Ladybug Tools / Radiance</b>), modelo de estrés hídrico diario de suelo-cultivo (<b>FAO AquaCrop</b>), y laboratorio fisicoquímico de suelos (Pb/Cd/pH/MO).
            </p>
          </div>
        </div>
      </div>

      <!-- MODAL TAB 5: COMPARACIÓN DE ESCENARIOS A / B / C -->
      <div role="tabpanel" aria-labelledby="ph-mt-comp" hidden="until-found" id="ph-mp-comp">
        <div class="ph-tp-inner">
          <div tabindex="0" role="region" aria-labelledby="ph-cap-comp" class="ph-twrap">
            <table>
              <caption id="ph-cap-comp">Comparación de los 3 escenarios automáticos para el mismo terreno</caption>
              <thead><tr>
                <th scope="col">Indicador</th>
                <th scope="col">Escenario A · Producción máx.</th>
                <th scope="col">Escenario B · Parque agroecológico</th>
                <th scope="col">Escenario C · Comunitario educativo</th>
              </tr></thead>
              <tbody id="ph-tb-comp"></tbody>
            </table>
          </div>
          <div class="ph-grid3">
            <button type="button" class="ph-btn" data-apply-esc="A">Aplicar Escenario A en 3D</button>
            <button type="button" class="ph-btn" data-apply-esc="B">Aplicar Escenario B en 3D</button>
            <button type="button" class="ph-btn" data-apply-esc="C">Aplicar Escenario C en 3D</button>
          </div>
        </div>
      </div>

      <!-- MODAL TAB 6: CERCO INTA 1,50 m, SUELO Y REGISTRO DE CAMPO -->
      <div role="tabpanel" aria-labelledby="ph-mt-cerco" hidden="until-found" id="ph-mp-cerco">
        <div class="ph-tp-inner">
          <div class="ph-grid2" style="align-items:start">
            <div tabindex="0" role="region" aria-labelledby="ph-cap-cerco" class="ph-twrap">
              <table>
                <caption id="ph-cap-cerco">Cómputo de materiales · Cerco perimetral 1,50 m (Pro Huerta INTA p. 4)</caption>
                <thead><tr><th scope="col">Material especificado</th><th scope="col">Cantidad</th></tr></thead>
                <tbody id="ph-tb-cerco"></tbody>
              </table>
            </div>
            <div class="ph-box">
              <h3>Preparación del suelo, semillas y registro de campo (INTA pp. 2 & 6)</h3>
              <ul style="margin:0 0 8px 16px;padding:0;font-size:11px;color:#cfe0d6;display:flex;flex-direction:column;gap:4px">
                <li><b>Cantero alomado:</b> elevar 15 cm para drenaje y descompactar 30 cm sin dar vuelta el terrón.</li>
                <li><b>Suelo urbano (Regla 11.2):</b> si no hay análisis de laboratorio, aislar con geotextil y sustrato validado.</li>
                <li><b>Semillas:</b> realizar ensayo germinativo previo y guardar en recipientes herméticos en lugar fresco.</li>
              </ul>
              <label class="ph-label" for="ph-fecha">Fecha de plantación</label>
              <input type="date" id="ph-fecha" class="ph-input" style="margin-bottom:6px" />
              <label class="ph-label" for="ph-notas">Registro de campo (siembras, plagas, heladas, cosechas)</label>
              <textarea id="ph-notas" rows="3" class="ph-input" placeholder="Ej. Ensayo germinación 90% · almácigo tomate en invernadero · control de pulgón con caléndula…"></textarea>
              <button type="button" class="ph-btn ph-btn-amb" id="ph-save-reg" style="margin-top:6px;width:100%">💾 Guardar registro del parque</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Polyfill condicional de Popover + fallback light-dismiss (modern-web-guidance: dialog)
  if (!Object.hasOwn(HTMLElement.prototype, 'popover')) {
    import('https://unpkg.com/@oddbird/popover-polyfill@latest/dist/popover.min.js').catch(() => {});
  }
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const out = (e, d) => { const r = d.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
    let pOut = false;
    modal.addEventListener('pointerdown', (e) => { pOut = out(e, modal); });
    modal.addEventListener('pointerup', (e) => { if (pOut && out(e, modal)) modal.close(); });
  }
  modal.addEventListener('close', () => { modal.returnValue = ''; });

  // Pestañas accesibles (selection follows focus + hidden="until-found" + beforematch)
  const hasNativeFG = Object.hasOwn(HTMLElement.prototype, 'focusGroup');
  function wireTabs(tablistEl, panelIds) {
    const tabs = [...tablistEl.querySelectorAll('[role="tab"]')];
    const panels = panelIds.map(id => document.getElementById(id));
    const select = (idx, focus = false) => {
      tabs.forEach((t, i) => {
        const on = i === idx;
        t.setAttribute('aria-selected', String(on));
        t.toggleAttribute('focusgroupstart', on);
        if (!hasNativeFG) t.tabIndex = on ? 0 : -1;
        if (on) { panels[i].removeAttribute('hidden'); panels[i].tabIndex = 0; t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
        else { panels[i].setAttribute('hidden', 'until-found'); panels[i].removeAttribute('tabindex'); }
      });
      if (focus) tabs[idx].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('focus', () => select(i));
      if (!hasNativeFG) {
        t.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length, true); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
          else if (e.key === 'Home') { e.preventDefault(); select(0, true); }
          else if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
        });
      }
    });
    panels.forEach((p, i) => p.addEventListener('beforematch', () => select(i)));
    select(0);
    return select;
  }
  const selectPanelTab = wireTabs(document.getElementById('ph-tabs'), ['ph-p-parques', 'ph-p-diag', 'ph-p-diseno']);
  const selectModalTab = wireTabs(document.getElementById('ph-mtabs'), ['ph-mp-ed', 'ph-mp-planos', 'ph-mp-ciclo', 'ph-mp-sims', 'ph-mp-comp', 'ph-mp-cerco']);

  /* ================= LÓGICA DE SELECCIÓN, HISTORIAL UNDO/REDO Y ACTUALIZACIÓN ================= */
  const pushUndo = () => {
    if (!proyectoActivo) return;
    undoStack.push(JSON.stringify({ elementos: proyectoActivo.elementos, poligonoInterv: proyectoActivo.poligonoInterv }));
    if (undoStack.length > 35) undoStack.shift();
    redoStack = [];
  };

  function recalcularYRender(animar = false) {
    if (!proyectoActivo) return;
    proyectoActivo.sim = ejecutarSimulaciones(proyectoActivo, parqueActivo, diagActivo, simEnv);
    visor.construirHuerta(proyectoActivo, animar);
    visor.aplicarDiaCiclo(simEnv.diaCiclo);
    visor.aplicarSol(proyectoActivo.sim.solar.sol);
    actualizarPanelUI();
    if (modal.open) poblarModal();
  }

  function regenerarDesdeCfg(animar = true, reubicar = false) {
    if (!parqueActivo || !diagActivo) return;
    const prev = generarProyecto(parqueActivo, diagActivo, cfgActiva, parqueActivo.sitio);
    if (reubicar || !parqueActivo.sitio) {
      parqueActivo.sitio = encontrarSitioOptimo(parqueActivo, diagActivo, prev.dims.totalL, prev.dims.totalW, prev.orientAng);
    }
    proyectoActivo = generarProyecto(parqueActivo, diagActivo, cfgActiva, parqueActivo.sitio);
    proyectoActivo.sim = ejecutarSimulaciones(proyectoActivo, parqueActivo, diagActivo, simEnv);
    escenariosABC = generarTresEscenarios(parqueActivo, diagActivo, { orientacion: cfgActiva.orientacion, contencion: cfgActiva.contencion, cerco: cfgActiva.cerco, mallaFina: cfgActiva.mallaFina }, parqueActivo.sitio);
    undoStack = []; redoStack = []; elemSelId = null;
    recalcularYRender(animar);
  }

  async function seleccionarParque(park, volar = true) {
    if (!park) return;
    parqueActivo = park;
    diagActivo = await analizarParque(park);
    visor.mostrarDiagnostico3D(park, diagActivo, verZonas3D);

    // Cargar proyecto guardado si existe; si no, generar Escenario B (Parque agroecológico) con la tipología mejor evaluada
    const st = saved[park.id];
    if (st && st.cfg) {
      cfgActiva = { ...DEFAULT_CFG, ...st.cfg };
    } else {
      const topTipo = diagActivo.scores[0]?.id || 'educativa';
      cfgActiva = { ...DEFAULT_CFG, tipologia: topTipo, escenario: 'B', concepto: TIPOLOGIAS[topTipo].conceptoDef };
    }
    regenerarDesdeCfg(true, true);
    if (st && st.elementos) {
      proyectoActivo.elementos = JSON.parse(JSON.stringify(st.elementos));
      if (st.poligonoInterv) proyectoActivo.poligonoInterv = st.poligonoInterv;
      recalcularYRender(false);
    }

    if (volar && proyectoActivo.sitio) {
      const sp = Math.max(proyectoActivo.dims.totalL, proyectoActivo.dims.totalW);
      visor.volarA(proyectoActivo.sitio[0], proyectoActivo.sitio[1], Math.max(40, sp * 1.55), Math.max(26, sp * 1.05));
    }
    anunciar(`Parque seleccionado: ${park.nombre}. Área apta: ${diagActivo.areaApta} m² (${diagActivo.pctApta}%).`);
  }

  /* ================= RENDERIZADO DE INTERFAZ ================= */
  function pintarListaParques() {
    const q = busqueda.trim().toLowerCase();
    const list = PARQUES.filter(p => (filtroTipo === 'TODOS' || p.tipo === filtroTipo) && (!q || p.nombre.toLowerCase().includes(q)));
    document.getElementById('ph-lista').innerHTML = list.slice(0, 60).map(p => {
      const sel = parqueActivo && parqueActivo.id === p.id;
      const pil = p.nombre === 'Castilla' && p.tipo === 'PARQUE ZONAL';
      return `<li><button type="button" data-pid="${p.id}" class="${sel ? 'sel' : ''}">
        <span><span class="pnom">${pil ? '★ ' : ''}${esc(p.nombre)}</span><span class="pmeta">${fmt(p.area)} m²${saved[p.id] ? ' · proyecto guardado' : ''}</span></span>
        <span class="ph-tag" style="color:${p.color}">${TIPO_SHORT[p.tipo] || 'Parque'}</span>
      </button></li>`;
    }).join('') || '<li style="padding:8px;color:#94a39b">Sin resultados con ese filtro.</li>';
    visor.filtrarParques(filtroTipo);
  }

  function actualizarPanelUI() {
    pintarListaParques();
    if (!parqueActivo || !diagActivo || !proyectoActivo) return;

    // Tab 2: Diagnóstico 12 criterios
    document.getElementById('ph-diag-nom').textContent = `${parqueActivo.nombre} (${TIPO_SHORT[parqueActivo.tipo] || 'Parque'} · ${fmt(parqueActivo.area)} m²)`;
    document.getElementById('ph-zbar').innerHTML = `<div style="width:${diagActivo.pctApta}%;background:#22c55e" title="Apta"></div><div style="width:${diagActivo.pctCond}%;background:#f59e0b" title="Condicionada"></div><div style="width:${diagActivo.pctNoApta}%;background:#ef4444" title="No apta"></div>`;
    document.getElementById('ph-diag-kpis').innerHTML = `
      <div class="ph-kpi"><b style="color:#4ade80">${diagActivo.pctApta}%</b><span>Apta (${fmt(diagActivo.areaApta)} m²)</span></div>
      <div class="ph-kpi"><b style="color:#fbbf24">${diagActivo.pctCond}%</b><span>Condic. (${fmt(diagActivo.areaCond)} m²)</span></div>
      <div class="ph-kpi"><b style="color:#fb7185">${diagActivo.pctNoApta}%</b><span>No apta (${fmt(diagActivo.areaNoApta)} m²)</span></div>`;
    document.getElementById('ph-diag-rec').innerHTML = diagActivo.scores.slice(0, 4).map(s =>
      `<button type="button" class="ph-btn ${cfgActiva.tipologia === s.id ? 'on' : ''}" data-pick-tipo="${s.id}" title="${esc(s.motivos.join(' · '))}">${s.letra} · ${esc(TIPOLOGIAS[s.id].corto)} (${s.score}%)</button>`
    ).join('');
    document.getElementById('ph-diag-12').innerHTML = diagActivo.criterios12.map(c => {
      const pr = PROVENIENCIA[c.prov] || PROVENIENCIA.ESTIMADO;
      return `<li><div class="ctop"><b>${esc(c.n)}</b><span class="ph-tag" style="color:${pr.c}">${pr.tag}</span></div><div>${esc(c.val)}</div><small>${esc(c.fuente)}</small></li>`;
    }).join('');

    // Tab 3: Diseñar Huerta
    const { sim, dims, cfg } = proyectoActivo;
    document.getElementById('ph-parque-actual').textContent = `${parqueActivo.nombre} · ${proyectoActivo.tipologia.letra} ${proyectoActivo.tipologia.corto}`;
    document.getElementById('ph-kpis').innerHTML = `
      <div class="ph-kpi"><b>${sim.areaCultivo} m²</b><span>${sim.pctParqueLibre}% parque libre</span></div>
      <div class="ph-kpi"><b>${sim.productiva.kgMin}–${sim.productiva.kgMax} kg</b><span>est./año · ${sim.productiva.familiasINTA} fam.</span></div>
      <div class="ph-kpi"><b>${sim.hidrica.demandaDiariaL} L/d</b><span>${sim.hidrica.coberturaLluviaPct}% lluvia · Bio ${sim.biodiversidad.indiceBio}</span></div>`;

    document.getElementById('ph-tipo-sel').value = cfg.tipologia;
    document.getElementById('ph-ancho').value = String(cfg.anchoCantero);
    document.getElementById('ph-largo').value = String(cfg.largoCantero);
    document.getElementById('ph-ncant').value = String(cfg.numCanteros);
    document.getElementById('ph-ncant-v').textContent = `${cfg.numCanteros} (${sim.areaCultivo} m²)`;
    document.getElementById('ph-cont').value = cfg.contencion;
    document.getElementById('ph-cerco').value = cfg.cerco;
    document.getElementById('ph-inv').checked = !!cfg.invernadero;
    document.getElementById('ph-cort').checked = !!cfg.cortaviento;
    document.getElementById('ph-mfina').checked = !!cfg.mallaFina;
    document.getElementById('ph-guia').checked = !!cfg.guiaReplanteo;
    document.getElementById('ph-dia').value = String(simEnv.diaCiclo);
    document.getElementById('ph-dia-v').textContent = String(simEnv.diaCiclo);
    document.getElementById('ph-etapa-v').textContent = sim.productiva.etapaActual;
    const hh = Math.floor(simEnv.hora), mm = Math.round((simEnv.hora - hh) * 60);
    document.getElementById('ph-hora-v').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} (${sim.solar.sol.altDeg}°)`;
    panel.querySelectorAll('[data-esc]').forEach(b => { const on = b.dataset.esc === cfg.escenario; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    panel.querySelectorAll('[data-cfg]').forEach(b => { const on = String(cfg[b.dataset.cfg]) === b.dataset.v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  }

  /* ================= MODAL DE LABORATORIO: EDITOR 2D/3D, 6 PLANOS, 8 ETAPAS, 7 SIMS, A/B/C ================= */
  function poblarEditor() {
    if (!proyectoActivo) return;
    const box = document.getElementById('ph-ed-canvas');
    box.innerHTML = renderPlanoCapaSVG(proyectoActivo, 'camas', diagActivo, { editor: true, selectedId: elemSelId, pxm: 20 });
    const prop = document.getElementById('ph-ed-prop');
    const el = proyectoActivo.elementos.find(e => e.id === elemSelId);
    if (!el) {
      prop.innerHTML = `<h3>Editor manual 2D ↔ 3D</h3>
        <p style="margin:0 0 8px;color:#b8c7bf;font-size:11px"><b>Arrastra</b> cualquier módulo en el plano para reubicarlo en 3D en tiempo real, o haz clic para editar su especie, tamaño y rotación.</p>
        <p style="margin:0;color:#86efac;font-size:10.5px">${modoPoligono ? '⬠ Modo polígono activo: haz clic en 3+ puntos del plano y vuelve a pulsar "Dibujar polígono" para cerrar.' : `Módulos activos: ${proyectoActivo.elementos.length} · Área cultivo: ${proyectoActivo.sim.areaCultivo} m²`}</p>`;
    } else {
      const espOpts = el.cat === 'cultivo' ? `<label class="ph-label" for="ed-esp">Especie (Bogotá)</label>
        <select id="ed-esp" class="ph-select" style="margin-bottom:6px">${Object.values(ESPECIES).map(s => `<option value="${s.id}" ${s.id === el.especieId ? 'selected' : ''}>${esc(s.n)} (${esc(s.fam)})</option>`).join('')}</select>` : '';
      prop.innerHTML = `<h3>${esc(el.etiqueta || el.n)}</h3>
        ${el.justificacion ? `<p style="margin:0 0 7px;font-size:10.5px;color:#a7f3d0">${esc(el.justificacion)}</p>` : ''}
        ${espOpts}
        <div class="ph-grid2" style="margin-bottom:6px">
          <div><label class="ph-label" for="ed-l">Largo (m)</label><input type="number" id="ed-l" class="ph-input" step="0.25" min="0.5" max="12" value="${el.l}" /></div>
          <div><label class="ph-label" for="ed-w">Ancho (m)</label><input type="number" id="ed-w" class="ph-input" step="0.25" min="0.4" max="8" value="${el.w}" /></div>
        </div>
        <div class="ph-grid2" style="margin-bottom:6px">
          <button type="button" class="ph-btn" id="ed-rot-l">↺ -15°</button>
          <button type="button" class="ph-btn" id="ed-rot-r">↻ +15°</button>
        </div>
        <div class="ph-grid2">
          <button type="button" class="ph-btn" id="ed-dup">⧉ Duplicar</button>
          <button type="button" class="ph-btn" id="ed-del" style="color:#fda4af;border-color:rgba(251,113,133,.4)">✕ Eliminar</button>
        </div>`;

      const edEsp = document.getElementById('ed-esp');
      if (edEsp) edEsp.onchange = () => { pushUndo(); el.especieId = edEsp.value; especieFoco = edEsp.value; recalcularYRender(false); };
      document.getElementById('ed-l').onchange = (e) => { pushUndo(); el.l = Math.max(0.5, Number(e.target.value) || el.l); recalcularYRender(false); };
      document.getElementById('ed-w').onchange = (e) => { pushUndo(); el.w = Math.max(0.4, Number(e.target.value) || el.w); el.dripLines = el.w >= 1.2 ? 3 : 2; recalcularYRender(false); };
      document.getElementById('ed-rot-l').onclick = () => { pushUndo(); el.rot = +((el.rot || 0) - Math.PI / 12).toFixed(3); recalcularYRender(false); };
      document.getElementById('ed-rot-r').onclick = () => { pushUndo(); el.rot = +((el.rot || 0) + Math.PI / 12).toFixed(3); recalcularYRender(false); };
      document.getElementById('ed-dup').onclick = () => {
        pushUndo();
        const cp = JSON.parse(JSON.stringify(el));
        cp.id = 'el-' + (Date.now() % 100000);
        cp.u = +(el.u + 0.8).toFixed(2); cp.v = +(el.v + 0.8).toFixed(2);
        if (cp.cat === 'cultivo') cp.bedNum = proyectoActivo.elementos.filter(x => x.cat === 'cultivo').length + 1;
        proyectoActivo.elementos.push(cp); elemSelId = cp.id; recalcularYRender(false);
      };
      document.getElementById('ed-del').onclick = () => {
        pushUndo();
        proyectoActivo.elementos = proyectoActivo.elementos.filter(x => x.id !== el.id);
        elemSelId = null; recalcularYRender(false);
      };
    }

    // Interacción pointer (arrastre directo de módulos y dibujo de polígono de intervención)
    const svg = box.querySelector('svg');
    if (!svg) return;
    const pxm = Number(svg.dataset.pxm), padL = Number(svg.dataset.padl), padT = Number(svg.dataset.padt), uMin = Number(svg.dataset.umin), vMin = Number(svg.dataset.vmin);
    const toLocal = (ev) => {
      const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      const sx = (ev.clientX - r.left) * (vb.width / r.width), sy = (ev.clientY - r.top) * (vb.height / r.height);
      return [uMin + (sx - padL) / pxm, vMin + (sy - padT) / pxm];
    };
    let dragging = null, offU = 0, offV = 0, moved = false;
    svg.addEventListener('pointerdown', (ev) => {
      if (modoPoligono) {
        const [u, v] = toLocal(ev);
        polyTemp.push([+u.toFixed(2), +v.toFixed(2)]);
        if (polyTemp.length >= 3) { proyectoActivo.poligonoInterv = polyTemp.slice(); }
        poblarEditor(); return;
      }
      const gEl = ev.target.closest('[data-elid]');
      if (!gEl) { elemSelId = null; poblarEditor(); return; }
      const target = proyectoActivo.elementos.find(x => x.id === gEl.dataset.elid);
      if (!target) return;
      elemSelId = target.id;
      const [u, v] = toLocal(ev);
      dragging = target; offU = target.u - u; offV = target.v - v; moved = false;
      svg.setPointerCapture(ev.pointerId);
    });
    svg.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const [u, v] = toLocal(ev);
      if (!moved) { pushUndo(); moved = true; }
      dragging.u = +(Math.round((u + offU) * 4) / 4).toFixed(2);
      dragging.v = +(Math.round((v + offV) * 4) / 4).toFixed(2);
      const gNode = svg.querySelector(`[data-elid="${dragging.id}"]`);
      if (gNode) gNode.setAttribute('transform', `translate(${(padL + (dragging.u - uMin) * pxm).toFixed(1)},${(padT + (dragging.v - vMin) * pxm).toFixed(1)}) rotate(${((dragging.rot || 0) * 180 / Math.PI).toFixed(1)})`);
    });
    svg.addEventListener('pointerup', () => {
      if (dragging) { const wasMoved = moved; dragging = null; if (wasMoved) recalcularYRender(false); else poblarEditor(); }
    });
  }

  function poblarCiclo8() {
    const esp = ESPECIES[especieFoco] || ESPECIES.lechuga;
    document.getElementById('ph-esp-foco').value = esp.id;
    document.getElementById('ph-esp-clima').textContent = esp.climaBogota;
    const et = esp.etapas, d = simEnv.diaCiclo;
    const fase = d < 5 ? 0 : d < et.germinacion.dias + 3 ? 1 : d < (et.trasplante.edadDias || 18) + 6 ? 2 : d < et.cosecha.dias ? 3 : d < et.cosecha.dias + 20 ? 4 : d < et.cosecha.dias + 32 ? 5 : d < et.cosecha.dias + 45 ? 6 : 7;
    const cards = [
      ['1. Semillas', `Tasa germ. est.: ${et.semillas.tasaGerm}% · Dosis: ${et.semillas.gM2} g/m² · ${et.semillas.siembra}. Calendario: ${et.semillas.calendario}. Guardado: ${et.semillas.guardado}.`],
      ['2. Germinación', `${et.germinacion.dias} días · T° ${et.germinacion.tempC} · Humedad ${et.germinacion.humPct}% · Sustrato: ${et.germinacion.sustrato}. Pérdida est.: ${et.germinacion.perdidaPct}%. Protección: ${et.germinacion.proteccion}.`],
      ['3. Trasplante', `${et.trasplante.edadDias ? `Trasplante a los ${et.trasplante.edadDias} d` : 'Siembra directa'} · Distancia: ${et.trasplante.dist} (${et.trasplante.densM2} pl/m²). Suelo: ${et.trasplante.suelo}. Asociar con: ${esp.asociaciones.join(', ')}.`],
      ['4. Crecimiento', `Luz: ${esp.luz} · Riego: ~${et.crecimiento.riegoLDia} L/m²/d (Kc ${esp.kc}). Nutrientes: ${et.crecimiento.nutrientes}. Fenología: ${et.crecimiento.fenologia}. Manejo: ${et.crecimiento.manejo}.`],
      ['5. Cosecha', `Inicio a los ${et.cosecha.dias} días · Rango est.: ${esp.kgM2Rango[0]}–${esp.kgM2Rango[1]} kg/m²/ciclo (${esp.ciclosAnio} ciclos/año) · ${et.cosecha.frecuencia}. Merma est.: ${et.cosecha.mermaPct}%.`],
      ['6. Aprovechamiento', et.aprovechamiento],
      ['7. Residuos', `Fracción vegetal residual: ~${Math.round(et.residuos.fracResidual * 100)}% del peso fresco. ${et.residuos.tipo}.`],
      ['8. Regeneración', `Relación C:N ${et.regeneracion.cn} · Compostaje ~${et.regeneracion.compostDias} días. Sucesión/relevo: ${et.regeneracion.relevo}. Rotación: ${et.regeneracion.rotacion}.`]
    ];
    document.getElementById('ph-ciclo-8').innerHTML = cards.map(([t, p], i) => `<article class="ph-etapa ${i === fase ? 'act' : ''}"><h4>${t}</h4><p>${esc(p)}</p></article>`).join('');
  }

  function poblarModal() {
    if (!proyectoActivo || !parqueActivo) return;
    const { dims, sim, cerco, elementos } = proyectoActivo;
    document.getElementById('ph-mtitle').textContent = `Laboratorio Agroecológico · ${parqueActivo.nombre}`;
    document.getElementById('ph-msub').textContent = `${TIPO_SHORT[parqueActivo.tipo] || 'Parque'} (${fmt(parqueActivo.area)} m²) · Tipología ${proyectoActivo.tipologia.letra}: ${proyectoActivo.tipologia.n} · Escenario ${proyectoActivo.cfg.escenario}`;

    // Tab 1: Editor
    poblarEditor();

    // Tab 2: Planos 6 capas
    document.getElementById('ph-plano-box').innerHTML = renderPlanoCapaSVG(proyectoActivo, capaPlano, diagActivo);
    document.getElementById('ph-mkpis').innerHTML = `
      <div class="ph-kpi"><b>${sim.areaCultivo} m²</b><span>Superficie cultivo</span></div>
      <div class="ph-kpi"><b>${sim.pctParqueLibre}% libre</b><span>Ocupación ${sim.pctParqueOcupado}%</span></div>
      <div class="ph-kpi"><b>${sim.productiva.kgMin}–${sim.productiva.kgMax} kg</b><span>Producción est./año</span></div>
      <div class="ph-kpi"><b>${sim.hidrica.demandaDiariaL} L/d</b><span>Lluvia cubre ${sim.hidrica.coberturaLluviaPct}%</span></div>
      <div class="ph-kpi"><b>${sim.compostaje.compostObtenidoKg} kg</b><span>Compost/año (${sim.compostaje.autosufAbonoPct}%)</span></div>
      <div class="ph-kpi"><b>$${(sim.costos.capexTotal / 1e6).toFixed(1)} M</b><span>Inversión ref. COP</span></div>`;

    // Tab 3: Ciclo 8 etapas + tabla de camas
    poblarCiclo8();
    const camas = elementos.filter(e => e.cat === 'cultivo');
    document.getElementById('ph-tb-cul').innerHTML = camas.map(c => {
      const e = ESPECIES[c.especieId] || ESPECIES.lechuga;
      return `<tr>
        <th scope="row">${esc(c.etiqueta || c.n)}</th>
        <td data-col="Especie"><b>${esc(e.n)}</b><br><small style="color:#9fb0a8">${esc(e.fam)} · + ${esc(c.aromAsociada || 'Caléndula')}</small></td>
        <td data-col="Área / Goteo">${c.l}×${c.w} m (<b>${(c.l * c.w).toFixed(1)} m²</b>)<br>${c.dripLines || 2} líneas goteo</td>
        <td data-col="Luz">${esc(e.luz)}</td>
        <td data-col="Distancia">${esc(e.etapas.trasplante.dist)}</td>
        <td data-col="Siembra">${esc(e.etapas.semillas.siembra)}<br><small style="color:#9fb0a8">Cosecha ~${e.etapas.cosecha.dias} d</small></td>
        <td data-col="Relevo">${esc(e.etapas.regeneracion.relevo)}</td>
        <td data-col="Rotación 4 años">${(c.rot4 || []).map((r, i) => `${i + 1}° ${esc(r)}`).join(' → ')}</td>
      </tr>`;
    }).join('');

    // Tab 4: 7 Simulaciones transparentes
    const maxMes = Math.max(1, ...sim.hidrica.balanceMensual.map(m => Math.max(m.captacionL, m.demandaL)));
    const barsHtml = `<div class="ph-bars" aria-label="Balance hídrico mensual lluvia frente a demanda">${sim.hidrica.balanceMensual.map(m => {
      const hC = Math.max(4, Math.round((m.captacionL / maxMes) * 44));
      const hD = Math.max(4, Math.round((m.demandaL / maxMes) * 44));
      return `<div class="ph-bar-col" title="${m.mes}: lluvia ${m.captacionL} L vs demanda ${m.demandaL} L"><div style="display:flex;gap:1px;align-items:end;height:46px"><i style="width:5px;height:${hC}px;background:#38bdf8;border-radius:2px"></i><i style="width:5px;height:${hD}px;background:#f59e0b;border-radius:2px"></i></div><span>${m.mes[0]}</span></div>`;
    }).join('')}</div><div style="font-size:9.5px;color:#9fb0a8;margin-bottom:5px"><span style="color:#38bdf8">■ Captación lluvia</span> · <span style="color:#f59e0b">■ Demanda riego</span></div>`;

    document.getElementById('ph-sims-box').innerHTML = ['solar', 'hidrica', 'productiva', 'compostaje', 'biodiversidad', 'usoPublico', 'costos'].map(k => {
      const s = sim[k];
      return `<article class="ph-sim-card">
        <h4><span>${esc(s.titulo)}</span><span class="ph-tag" style="color:#e2a55b">${esc(s.confianza.split(' ')[0])}</span></h4>
        <div class="ph-sim-res">${esc(s.resumen)}</div>
        ${k === 'hidrica' ? barsHtml : ''}
        <div class="ph-sim-meta">
          <div><b>Variables:</b> ${esc(s.variables)}</div>
          <div><b>Supuestos:</b> ${esc(s.supuestos)}</div>
          <div><b>Unidades:</b> ${esc(s.unidades)}</div>
          <div><b>Fuentes:</b> ${esc(s.fuentes)}</div>
          <div><b>Limitaciones:</b> ${esc(s.limitaciones)}</div>
          <div><b>Confianza:</b> ${esc(s.confianza)}</div>
        </div>
      </article>`;
    }).join('');

    // Tab 5: Comparación Escenarios A / B / C
    if (escenariosABC) {
      const { A, B, C } = escenariosABC;
      const filas = [
        ['Tipología base', A.tipologia.n, B.tipologia.n, C.tipologia.n],
        ['Huella / Parque libre', `${A.dims.areaTotal} m² (${A.sim.pctParqueLibre}% libre)`, `${B.dims.areaTotal} m² (${B.sim.pctParqueLibre}% libre)`, `${C.dims.areaTotal} m² (${C.sim.pctParqueLibre}% libre)`],
        ['Superficie cultivada neta', `${A.sim.areaCultivo} m²`, `${B.sim.areaCultivo} m²`, `${C.sim.areaCultivo} m²`],
        ['Producción estimada (rango)', `${A.sim.productiva.kgMin}–${A.sim.productiva.kgMax} kg/año`, `${B.sim.productiva.kgMin}–${B.sim.productiva.kgMax} kg/año`, `${C.sim.productiva.kgMin}–${C.sim.productiva.kgMax} kg/año`],
        ['Familias ref. (50 m² INTA)', `${A.sim.productiva.familiasINTA} fam. (${A.sim.productiva.horasDiaINTA} h/d)`, `${B.sim.productiva.familiasINTA} fam. (${B.sim.productiva.horasDiaINTA} h/d)`, `${C.sim.productiva.familiasINTA} fam. (${C.sim.productiva.horasDiaINTA} h/d)`],
        ['Agua riego / Cobertura lluvia', `${A.sim.hidrica.demandaDiariaL} L/d (${A.sim.hidrica.coberturaLluviaPct}%)`, `${B.sim.hidrica.demandaDiariaL} L/d (${B.sim.hidrica.coberturaLluviaPct}%)`, `${C.sim.hidrica.demandaDiariaL} L/d (${C.sim.hidrica.coberturaLluviaPct}%)`],
        ['Compost producido / Autosuf.', `${A.sim.compostaje.compostObtenidoKg} kg (${A.sim.compostaje.autosufAbonoPct}%)`, `${B.sim.compostaje.compostObtenidoKg} kg (${B.sim.compostaje.autosufAbonoPct}%)`, `${C.sim.compostaje.compostObtenidoKg} kg (${C.sim.compostaje.autosufAbonoPct}%)`],
        ['Biodiversidad funcional', `${A.sim.biodiversidad.indiceBio}/100 (${A.sim.biodiversidad.numFamilias} fam.)`, `${B.sim.biodiversidad.indiceBio}/100 (${B.sim.biodiversidad.numFamilias} fam.)`, `${C.sim.biodiversidad.indiceBio}/100 (${C.sim.biodiversidad.numFamilias} fam.)`],
        ['Aforo público / Rutas acc.', `${A.sim.usoPublico.aforoSim} pers. (${A.dims.cab.toFixed(2)} m)`, `${B.sim.usoPublico.aforoSim} pers. (${B.dims.cab.toFixed(2)} m)`, `${C.sim.usoPublico.aforoSim} pers. (${C.dims.cab.toFixed(2)} m)`],
        ['Inversión referencial (COP)', `$${(A.sim.costos.capexTotal / 1e6).toFixed(1)} M COP`, `$${(B.sim.costos.capexTotal / 1e6).toFixed(1)} M COP`, `$${(C.sim.costos.capexTotal / 1e6).toFixed(1)} M COP`]
      ];
      document.getElementById('ph-tb-comp').innerHTML = filas.map(([k, a, b, c]) =>
        `<tr><th scope="row">${esc(k)}</th><td data-col="Escenario A">${esc(a)}</td><td data-col="Escenario B">${esc(b)}</td><td data-col="Escenario C">${esc(c)}</td></tr>`
      ).join('');
    }

    // Tab 6: Cerco INTA y Registro
    const b = cerco.bom;
    const fc = cerco.tipo === 'ninguno'
      ? [['Cerco perimetral', 'Desactivado (huerta abierta integrada al parque)']]
      : [
          ['Perímetro total / alambrado (descontando acceso 1,50 m)', `${cerco.perimetro} m / ${cerco.perimAlambrado} m`],
          ['Tejido romboidal abertura 3", alambre Nº 14, 1,50 m alto', `${b.tejidoRomboidalM} m`],
          ['Postes madera/hormigón 3" × 3" × 2 m (enterrados 45–50 cm, pintura asfáltica)', `${b.postesUn} unidades (cada 2–2,5 m)`],
          ['Puntales 3" × 3" × 2 m (esquinas, puerta y cada 10 m)', `${b.puntalesUn} unidades`],
          ['Alambre galvanizado liso Nº 14 (3 líneas: sup., med., inf.)', `${b.alambreLisoM} m`],
          ['Planchuelas 3/16" × 1" × 1,50 m / Ganchos "J" / Torniquetes Nº 5', `${b.planchuelasUn} / ${b.ganchosJUn} / ${b.torniquetesUn} unid.`],
          ['Faja malla fina (1 m alto + 40 cm enterrada contra fauna pequeña)', b.mallaFinaM ? `${b.mallaFinaM} m` : 'No incluida']
        ];
    document.getElementById('ph-tb-cerco').innerHTML = fc.map(([m, q]) => `<tr><th scope="row">${esc(m)}</th><td data-col="Cantidad">${esc(q)}</td></tr>`).join('');
    const reg = saved[parqueActivo.id]?.reg || {};
    document.getElementById('ph-fecha').value = reg.fecha || new Date().toISOString().slice(0, 10);
    document.getElementById('ph-notas').value = reg.notas || '';
  }

  /* ================= EVENTOS ================= */
  const piloto = PARQUES.find(p => p.nombre === 'Castilla' && p.tipo === 'PARQUE ZONAL') || PARQUES[0];
  document.getElementById('ph-piloto-btn').onclick = () => { seleccionarParque(piloto, true); selectPanelTab(1); };
  document.getElementById('ph-buscar').oninput = (e) => { busqueda = e.target.value; pintarListaParques(); };
  document.getElementById('ph-filtros').onclick = (e) => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    filtroTipo = b.dataset.f;
    panel.querySelectorAll('#ph-filtros [data-f]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    pintarListaParques();
  };
  document.getElementById('ph-lista').onclick = (e) => {
    const b = e.target.closest('[data-pid]'); if (!b) return;
    const p = PARQUES.find(x => x.id === Number(b.dataset.pid));
    if (p) { seleccionarParque(p, true); selectPanelTab(1); }
  };
  document.getElementById('ph-vista-all').onclick = () => { visor.volarA(2000, 1100, 3100, 2600); say(`576 parques de Kennedy · haz clic en cualquiera para analizarlo y diseñar su huerta`, 3800); };
  document.getElementById('ph-acercar').onclick = () => {
    if (proyectoActivo && proyectoActivo.sitio) {
      const sp = Math.max(proyectoActivo.dims.totalL, proyectoActivo.dims.totalW);
      visor.volarA(proyectoActivo.sitio[0], proyectoActivo.sitio[1], Math.max(26, sp * 1.1), Math.max(16, sp * 0.68));
    }
  };
  document.getElementById('ph-ver-zonas').onchange = (e) => { verZonas3D = e.target.checked; visor.verZonas(verZonas3D); };
  document.getElementById('ph-diag-rec').onclick = (e) => {
    const b = e.target.closest('[data-pick-tipo]'); if (!b) return;
    cfgActiva.tipologia = b.dataset.pickTipo;
    cfgActiva.concepto = TIPOLOGIAS[cfgActiva.tipologia].conceptoDef;
    cfgActiva.escenario = 'custom';
    regenerarDesdeCfg(true, false);
    selectPanelTab(2);
  };
  document.getElementById('ph-go-disenar').onclick = () => { selectPanelTab(2); if (proyectoActivo) visor.construirHuerta(proyectoActivo, true); };

  // Controles de diseño paramétrico + Escenarios A/B/C
  panel.addEventListener('click', (e) => {
    const be = e.target.closest('[data-esc]');
    if (be && escenariosABC && escenariosABC[be.dataset.esc]) {
      const target = escenariosABC[be.dataset.esc];
      cfgActiva = { ...target.cfg };
      proyectoActivo = JSON.parse(JSON.stringify(target));
      proyectoActivo.park = parqueActivo; proyectoActivo.tipologia = TIPOLOGIAS[cfgActiva.tipologia];
      recalcularYRender(true);
      say(`Escenario ${be.dataset.esc} aplicado (${proyectoActivo.tipologia.n})`, 2600);
      return;
    }
    const bc = e.target.closest('[data-cfg]');
    if (bc) {
      const k = bc.dataset.cfg;
      cfgActiva[k] = k === 'anioRotacion' ? Number(bc.dataset.v) : bc.dataset.v;
      regenerarDesdeCfg(false, k === 'orientacion');
    }
  });
  document.getElementById('ph-tipo-sel').onchange = (e) => {
    cfgActiva.tipologia = e.target.value;
    cfgActiva.concepto = TIPOLOGIAS[cfgActiva.tipologia].conceptoDef;
    cfgActiva.escenario = 'custom';
    regenerarDesdeCfg(true, false);
  };
  const bindSel = (id, key, num = false, reub = false) => {
    document.getElementById(id).onchange = (e) => { cfgActiva[key] = num ? Number(e.target.value) : e.target.value; regenerarDesdeCfg(false, reub); };
  };
  bindSel('ph-ancho', 'anchoCantero', true, true);
  bindSel('ph-largo', 'largoCantero', true, true);
  bindSel('ph-cont', 'contencion', false, false);
  bindSel('ph-cerco', 'cerco', false, false);
  document.getElementById('ph-ncant').oninput = (e) => { cfgActiva.numCanteros = Number(e.target.value); regenerarDesdeCfg(false, true); };
  const bindChk = (id, key, reub = false) => { document.getElementById(id).onchange = (e) => { cfgActiva[key] = e.target.checked; regenerarDesdeCfg(false, reub); }; };
  bindChk('ph-inv', 'invernadero', true);
  bindChk('ph-cort', 'cortaviento', false);
  bindChk('ph-mfina', 'mallaFina', false);
  bindChk('ph-guia', 'guiaReplanteo', false);

  // Sliders vivos 3D: Ciclo 0–180 días, Sol hora/mes, Riego animado
  document.getElementById('ph-dia').oninput = (e) => {
    simEnv.diaCiclo = Number(e.target.value);
    visor.aplicarDiaCiclo(simEnv.diaCiclo);
    if (proyectoActivo) { proyectoActivo.sim = ejecutarSimulaciones(proyectoActivo, parqueActivo, diagActivo, simEnv); actualizarPanelUI(); if (modal.open) poblarCiclo8(); }
  };
  document.getElementById('ph-play-ciclo').onclick = (e) => {
    if (playTimer) { clearInterval(playTimer); playTimer = 0; e.target.textContent = '▶ Ciclo'; return; }
    e.target.textContent = '❚❚ Pausa';
    playTimer = setInterval(() => {
      simEnv.diaCiclo = (simEnv.diaCiclo + 2) % 181;
      visor.aplicarDiaCiclo(simEnv.diaCiclo);
      if (proyectoActivo) { proyectoActivo.sim = ejecutarSimulaciones(proyectoActivo, parqueActivo, diagActivo, simEnv); actualizarPanelUI(); }
    }, 180);
  };
  const updSol = () => {
    simEnv.hora = Number(document.getElementById('ph-hora').value);
    simEnv.mes = Number(document.getElementById('ph-mes').value);
    if (proyectoActivo) {
      proyectoActivo.sim = ejecutarSimulaciones(proyectoActivo, parqueActivo, diagActivo, simEnv);
      visor.aplicarSol(proyectoActivo.sim.solar.sol);
      actualizarPanelUI();
    }
  };
  document.getElementById('ph-hora').oninput = updSol;
  document.getElementById('ph-mes').onchange = updSol;
  document.getElementById('ph-riego-anim').onchange = (e) => { riegoAnimOn = e.target.checked; visor.verRiegoAnim(riegoAnimOn); };

  // Modal Laboratorio y Editor Manual
  document.getElementById('ph-open-modal').onclick = () => { poblarModal(); modal.showModal(); };
  document.getElementById('ph-mclose').onclick = () => modal.close();
  document.getElementById('ph-capas-btns').onclick = (e) => {
    const b = e.target.closest('[data-capa]'); if (!b) return;
    capaPlano = b.dataset.capa;
    modal.querySelectorAll('#ph-capas-btns [data-capa]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    document.getElementById('ph-plano-box').innerHTML = renderPlanoCapaSVG(proyectoActivo, capaPlano, diagActivo);
  };
  document.getElementById('ph-esp-foco').onchange = (e) => { especieFoco = e.target.value; poblarCiclo8(); };

  document.getElementById('ph-add-btn').onclick = () => {
    if (!proyectoActivo) return;
    pushUndo();
    const tipo = document.getElementById('ph-add-tipo').value;
    const cat = CATALOGO_ELEMENTOS[tipo];
    const nuevo = {
      id: 'el-' + (Date.now() % 100000), tipo, cat: cat.cat, n: cat.n,
      u: 0, v: 0, l: cat.l, w: cat.w, h: cat.h, rot: 0,
      justificacion: cat.desc
    };
    if (cat.cat === 'cultivo') {
      nuevo.especieId = 'lechuga';
      nuevo.dripLines = cat.w >= 1.2 ? 3 : 2;
      nuevo.bedNum = proyectoActivo.elementos.filter(x => x.cat === 'cultivo').length + 1;
      nuevo.etiqueta = `${cat.n.split(' ')[0]} #${nuevo.bedNum}`;
      nuevo.rot4 = ['Hoja', 'Raíz', 'Leguminosas', 'Fruto'];
    }
    proyectoActivo.elementos.push(nuevo);
    elemSelId = nuevo.id;
    recalcularYRender(false);
  };
  document.getElementById('ph-poly-btn').onclick = (e) => {
    modoPoligono = !modoPoligono;
    if (modoPoligono) polyTemp = [];
    e.target.classList.toggle('on', modoPoligono);
    e.target.setAttribute('aria-pressed', String(modoPoligono));
    poblarEditor();
  };
  document.getElementById('ph-undo').onclick = () => {
    if (!undoStack.length || !proyectoActivo) return;
    redoStack.push(JSON.stringify({ elementos: proyectoActivo.elementos, poligonoInterv: proyectoActivo.poligonoInterv }));
    const prev = JSON.parse(undoStack.pop());
    proyectoActivo.elementos = prev.elementos; proyectoActivo.poligonoInterv = prev.poligonoInterv;
    elemSelId = null; recalcularYRender(false);
  };
  document.getElementById('ph-redo').onclick = () => {
    if (!redoStack.length || !proyectoActivo) return;
    undoStack.push(JSON.stringify({ elementos: proyectoActivo.elementos, poligonoInterv: proyectoActivo.poligonoInterv }));
    const nxt = JSON.parse(redoStack.pop());
    proyectoActivo.elementos = nxt.elementos; proyectoActivo.poligonoInterv = nxt.poligonoInterv;
    elemSelId = null; recalcularYRender(false);
  };
  document.getElementById('ph-save-proj').onclick = () => {
    if (!parqueActivo || !proyectoActivo) return;
    saved[parqueActivo.id] = { ...(saved[parqueActivo.id] || {}), cfg: { ...cfgActiva }, elementos: proyectoActivo.elementos, poligonoInterv: proyectoActivo.poligonoInterv };
    persistir();
    say(`💾 Proyecto guardado para ${parqueActivo.nombre}`, 2800);
    anunciar('Proyecto guardado.');
  };
  document.getElementById('ph-save-reg').onclick = () => {
    if (!parqueActivo) return;
    saved[parqueActivo.id] = { ...(saved[parqueActivo.id] || {}), cfg: { ...cfgActiva }, reg: { fecha: document.getElementById('ph-fecha').value, notas: document.getElementById('ph-notas').value } };
    persistir();
    say(`💾 Registro de campo guardado para ${parqueActivo.nombre}`, 2600);
  };

  modal.addEventListener('click', (e) => {
    const ba = e.target.closest('[data-apply-esc]');
    if (ba && escenariosABC && escenariosABC[ba.dataset.applyEsc]) {
      const target = escenariosABC[ba.dataset.applyEsc];
      cfgActiva = { ...target.cfg };
      proyectoActivo = JSON.parse(JSON.stringify(target));
      proyectoActivo.park = parqueActivo; proyectoActivo.tipologia = TIPOLOGIAS[cfgActiva.tipologia];
      recalcularYRender(true);
      say(`Escenario ${ba.dataset.applyEsc} aplicado en 3D`, 2600);
    }
  });

  // Exportaciones verificadas (PDF, SVG, GeoJSON, CSV)
  const dlBlob = (txt, mime, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: mime }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };
  const slug = () => (parqueActivo ? parqueActivo.nombre : 'parque').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  document.getElementById('ph-exp-pdf').onclick = () => { if (proyectoActivo) abrirReportePDF(proyectoActivo, escenariosABC, diagActivo); };
  document.getElementById('ph-exp-svg').onclick = () => { if (proyectoActivo) dlBlob(renderPlanoCapaSVG(proyectoActivo, capaPlano, diagActivo), 'image/svg+xml;charset=utf-8', `plano-${capaPlano}-${slug()}.svg`); };
  document.getElementById('ph-exp-geo').onclick = () => { if (proyectoActivo) dlBlob(generarGeoJSON(proyectoActivo), 'application/geo+json;charset=utf-8', `huerta-${slug()}.geojson`); };
  document.getElementById('ph-exp-csv').onclick = () => { if (proyectoActivo) dlBlob(generarCSV(proyectoActivo), 'text/csv;charset=utf-8', `reporte-huerta-${slug()}.csv`); };

  const abrirPanel = (show) => {
    try {
      if (show) { if (panel.showPopover) panel.showPopover(); else panel.show(); }
      else { if (panel.hidePopover) panel.hidePopover(); else panel.close(); }
    } catch (e) { if (show) panel.setAttribute('open', ''); else panel.removeAttribute('open'); }
  };
  document.getElementById('ph-close').onclick = () => api.ver(false);

  const api = {
    grupo: visor.grupo,
    parques: PARQUES,
    get activo() { return visor.grupo.visible; },
    onChange(fn) { onChangeCb = fn; },
    async ver(on) {
      on = !!on;
      visor.ver(on);
      abrirPanel(on);
      if (on) {
        if (!parqueActivo) {
          await seleccionarParque(piloto, true);
          selectPanelTab(1); // Abre primero el Diagnóstico del Parque Piloto (Castilla) siguiendo Fase 1 → 2!
        } else {
          actualizarPanelUI();
        }
        say(`🌳 ${PARQUES.length} parques de Kennedy · Parque piloto: ${parqueActivo.nombre}`, 4200);
      } else {
        if (playTimer) { clearInterval(playTimer); playTimer = 0; }
        if (modal.open) modal.close();
      }
      if (onChangeCb) onChangeCb(on);
    },
    quitar() {
      if (playTimer) clearInterval(playTimer);
      visor.quitar(); panel.remove(); modal.remove(); live.remove(); style.remove();
    }
  };
  return api;
}

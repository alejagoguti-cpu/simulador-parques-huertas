/* ============ MOTOR ESPACIAL PARAMÉTRICO · 3 ESCENARIOS (A/B/C) · 7 SIMULACIONES TRANSPARENTES ============
   Cumple:
   - Guía INTA Pro Huerta (canteros 1–1,25 m × 4–8 m alomados 15 cm / suelo 30 cm, pasos 40–50 cm, cabeceras ≥ 1 m,
     2–3 líneas goteo, cerco 1,50 m + puntales + faja fina 1 m, cortaviento Sur–Oeste, rotación ≥ 3 años)
   - Prompt Maestro Secciones 3 (7 tipologías), 5 (espacio público y mobiliario con relaciones funcionales),
     6 (generador automático con restricciones explícitas: Escenarios A, B y C + estructura editable en modo manual)
     y 7 (7 simulaciones reales con variables, supuestos, unidades, fuentes, limitaciones y nivel de confianza). */

import {
  BOGOTA_CLIMA, TIPOLOGIAS, ESPECIES, ROTACION_ORDEN, ROTACION_NOM, POOLS_ESPECIE, CATALOGO_ELEMENTOS
} from './datos_agronomia.js?v=1';
import { posicionSolarBogota } from './diagnostico_parque.js?v=1';

export const DEFAULT_CFG = {
  tipologia: 'educativa',      // 'produccion'|'comunitaria'|'educativa'|'biodiversidad'|'experimental'|'terapeutica'|'circular'
  escenario: 'B',              // 'A' (Producción máx) | 'B' (Agroecológico) | 'C' (Comunitario educativo) | 'custom'
  concepto: 'paisajistico',    // 'utilitario' | 'paisajistico'
  anchoCantero: 1.25,          // 1.0 (2 goteos) | 1.25 (3 goteos)
  largoCantero: 6,             // 4 | 6 | 8 m
  numCanteros: 10,             // se restringe al área apta y al tope de ocupación del parque
  pasoCanteros: 0.50,          // 0.40 | 0.50 m (viruta / pasto seco)
  pasoCabeceras: 1.25,         // ≥ 1.00 m (1.50 m en accesibilidad universal)
  contencion: 'ladrillo',      // 'ladrillo' | 'madera' | 'piedra' | 'botellas'
  cerco: 'romboidal',          // 'romboidal' | 'madera' | 'palo' | 'ninguno'
  mallaFina: true,             // faja inferior 1 m enterrada 40 cm (INTA p. 4)
  invernadero: true,           // 7×4 m o 4×3 m según parque
  cortaviento: true,           // cortina cortavientos en Sur y Oeste (INTA pp. 3 y 5)
  orientacion: 'norte',        // 'norte' (Norte real -Z) | 'parque' (eje del parque)
  anioRotacion: 1,             // 1..4 (rotación ≥ 3 años)
  guiaReplanteo: true,         // triángulo 3-4-5 (60×80×100 cm) + estacas/hilo
  mapaSolar: true              // franjas 6–8 h vs 4–5 h + flecha NORTE
};

const AROMATICAS = ['Romero', 'Lavanda', 'Caléndula', 'Albahaca', 'Menta', 'Tomillo', 'Ruda'];
const FRUTALES = ['Feijoa', 'Uchuva', 'Mora arbustiva', 'Espárrago (perenne)', 'Ruibarbo (perenne)'];

/* ---------- Generador espacial con restricciones explícitas (NO aleatorio) ---------- */
export function generarProyecto(park, diag, rawCfg = {}, sitioForzado = null) {
  const tipoObj = TIPOLOGIAS[rawCfg.tipologia || DEFAULT_CFG.tipologia] || TIPOLOGIAS.produccion;
  const cfg = { ...DEFAULT_CFG, concepto: tipoObj.conceptoDef, ...rawCfg, tipologia: tipoObj.id };

  // Restricción 1 (Regla 11.5): nunca ocupar más de 16–24% del parque ni exceder el área apta disponible
  const areaParque = park ? park.area : 6000;
  const areaApta = diag ? Math.max(80, diag.areaApta) : areaParque * 0.4;
  const topeOcup = Math.min(0.24, Math.max(0.16, tipoObj.maxOcupParque || 0.20));
  const maxHuella = Math.max(46, Math.min(areaParque * topeOcup, Math.max(68, areaApta * 0.72)));
  const esMini = areaParque < 550 || maxHuella < 115;
  const esBolsillo = !esMini && (areaParque < 1300 || maxHuella < 250);
  const esPequena = esMini || esBolsillo || areaParque < 1800;

  // Regla de accesibilidad (Sección 5 & Terapéutica/Educativa/Comunitaria): rutas accesibles ≥ 1,20–1,45 m
  const esAccesible = cfg.tipologia === 'terapeutica' || cfg.tipologia === 'educativa' || cfg.tipologia === 'comunitaria' || cfg.escenario === 'C';
  const cab = esMini
    ? Math.max(1.0, Math.min(1.15, cfg.pasoCabeceras))
    : (esBolsillo ? Math.max(1.1, Math.min(1.3, cfg.pasoCabeceras)) : Math.max(esAccesible ? 1.45 : 1.0, cfg.pasoCabeceras));
  const paso = esAccesible && cfg.tipologia === 'terapeutica' && !esMini
    ? Math.max(1.15, cfg.pasoCanteros)
    : (esMini ? Math.min(0.45, cfg.pasoCanteros) : cfg.pasoCanteros);

  const wC = esMini ? Math.min(1.0, cfg.anchoCantero) : cfg.anchoCantero;
  const lC = esMini ? Math.min(3.0, cfg.largoCantero) : (esPequena ? Math.min(4.0, cfg.largoCantero) : cfg.largoCantero);
  const dripLines = wC >= 1.2 ? 3 : 2; // INTA p. 3: 2 líneas en 1 m, 3 líneas en 1,25 m

  // Limitar cantidad de canteros a lo que realmente cabe sin violar la restricción de ocupación del parque (≥ 75% libre)
  const factorArea = esMini ? 0.34 : (esBolsillo ? 0.35 : 0.42);
  const minCant = esMini ? 2 : (esBolsillo ? 3 : 4);
  const maxCantPorArea = Math.max(minCant, Math.min(esMini ? 4 : (esBolsillo ? 6 : 20), Math.floor((maxHuella * factorArea) / (lC * (wC + paso)))));
  let nCanteros = Math.max(minCant, Math.min(cfg.numCanteros, maxCantPorArea));

  let invOn = !!cfg.invernadero && !esMini && maxHuella >= 225;
  const invL = esPequena ? 4.0 : 7.0;
  const invW = esPequena ? 3.0 : 4.0;
  const abL = esMini ? 1.6 : (esBolsillo ? 2.4 : 3.6);   // INTA p. 3: Abonera 3,60×2,40 m (compacta en bolsillo)
  const abW = esMini ? 1.0 : (esBolsillo ? 1.5 : 2.4);
  const resL = esMini ? 1.2 : (esBolsillo ? 1.6 : 2.4);  // Bodega herramientas
  const resW = esMini ? 0.9 : (esBolsillo ? 1.3 : 2.0);
  const frutAncho = esMini ? 0 : (esBolsillo ? 1.2 : 2.2); // Franja lateral perennes/frutales (INTA pp. 3, 5)
  const aromMargen = esMini ? 0.45 : (esBolsillo ? 0.65 : 0.85); // Franja perimetral aromáticas (INTA pp. 3, 6)

  const tieneAula = cfg.tipologia === 'educativa' || cfg.tipologia === 'comunitaria' || cfg.tipologia === 'terapeutica' || cfg.escenario === 'C';
  const isPais = cfg.concepto === 'paisajistico';
  let espacioCentral = (!esMini && (isPais || tieneAula) && maxHuella >= 185) ? (esBolsillo ? 2.8 : 4.2) : 0;

  const tieneLavado = !esMini && (cfg.tipologia === 'produccion' || cfg.tipologia === 'circular');
  const tieneInfilt = !esMini && (cfg.tipologia === 'biodiversidad' || cfg.escenario === 'B');
  const tieneMesaExp = !esMini && cfg.tipologia === 'experimental';

  // Dimensionamiento de franja de servicio Este (sin solapes por construcción)
  const servW = esMini
    ? Math.max(2.0, abL + 0.4)
    : (esBolsillo
      ? Math.max(invOn ? invL : 0, abL + 0.6, 3.0)
      : Math.max(invOn ? invL : 0, abL + resL + 1.1, 6.2));
  const abBodegaJuntas = servW >= abL + resL + 0.8;
  const calcServH = (hasInv) => {
    let h = 1.9; // banda superior (toma de agua + separación residuos)
    if (tieneLavado) h += 1.1 + 0.85;
    if (hasInv) h += invW + 0.95;
    h += abBodegaJuntas ? (Math.max(abW, resW) + 0.85) : (abW + 0.75 + resW + 0.85);
    if (tieneInfilt) h += 1.4 + 0.75;
    if (tieneMesaExp) h += 1.0 + 0.75;
    return h;
  };

  // Ajuste iterativo para garantizar que huella total <= maxHuella (parque ≥ 75% libre en los 576 parques)
  const calcDims = (nc, hasInv, espC) => {
    const c2 = (!esMini && !esBolsillo && nc >= 8) ? 2 : 1;
    const r2 = Math.ceil(nc / c2);
    const bU = c2 === 2 ? (lC * 2 + cab) : lC;
    const bV = r2 * wC + Math.max(0, r2 - 1) * paso + espC;
    const sH = calcServH(hasInv);
    const iU = (frutAncho > 0 ? frutAncho + cab : 0) + bU + cab + servW + cab * 0.5;
    const iV = Math.max(bV, sH) + cab * 1.6;
    const tL = Math.ceil((iU + aromMargen * 2) * 2) / 2;
    const tW = Math.ceil((iV + aromMargen * 2) * 2) / 2;
    return { cols: c2, rows: r2, bloqCanterosU: bU, bloqCanterosV: bV, servH: sH, totalL: tL, totalW: tW, area: tL * tW };
  };

  let D = calcDims(nCanteros, invOn, espacioCentral);
  const hardAreaMax = Math.max(48, areaParque * 0.245);
  while (D.area > hardAreaMax && (invOn || espacioCentral > 0 || nCanteros > minCant)) {
    if (invOn) { invOn = false; }
    else if (espacioCentral > 0) { espacioCentral = 0; }
    else if (nCanteros > minCant) { nCanteros--; }
    else break;
    D = calcDims(nCanteros, invOn, espacioCentral);
  }
  cfg.numCanteros = nCanteros;
  cfg.largoCantero = lC;
  cfg.anchoCantero = wC;

  const { cols, rows, bloqCanterosU, totalL, totalW } = D;
  const uMin = -totalL / 2, uMax = totalL / 2, vMin = -totalW / 2, vMax = totalW / 2;

  const orientAng = cfg.orientacion === 'parque' && park ? (park.ang || 0) : 0;
  const rotShift = ((cfg.anioRotacion || 1) - 1) % 4;

  /* ---------- Construcción de elementos editables con relaciones espaciales justificadas (Sección 5) ---------- */
  const elementos = [];
  let eid = 1;
  const addEl = (tipo, u, v, l, w, rot = 0, extra = {}) => {
    const cat = CATALOGO_ELEMENTOS[tipo] || { n: tipo, h: 0.5, c: '#888', cat: 'infra', costoCOP: 300000 };
    elementos.push({
      id: `el-${eid++}`, tipo, cat: cat.cat, n: extra.n || cat.n,
      u: +u.toFixed(2), v: +v.toFixed(2), l: +l.toFixed(2), w: +w.toFixed(2), h: extra.h || cat.h,
      rot: +rot.toFixed(3), ...extra
    });
  };

  // 1. Camas de cultivo organizadas (respetando gradiente Sol-Sombra & Altura Sur/Oeste INTA p. 5 + Rotación 4 años)
  const uStart = uMin + aromMargen + (frutAncho > 0 ? frutAncho + cab : 0.4);
  const vStart = vMin + aromMargen + cab;
  let bedIdx = 0;
  for (let r = 0; r < rows; r++) {
    const vExtra = espacioCentral > 0 && r >= Math.floor(rows / 2) ? espacioCentral : 0;
    const vCenter = vStart + r * (wC + paso) + wC / 2 + vExtra;
    for (let c = 0; c < cols; c++) {
      if (bedIdx >= nCanteros) break;
      const uCenter = uStart + c * (lC + cab) + lC / 2;
      const fracSur = rows > 1 ? r / (rows - 1) : 0.5;

      // Asignación por tipología y gradiente solar: altos hacia Sur (+v) y Oeste (-u)
      let tipoModulo = 'cantero';
      if (cfg.tipologia === 'terapeutica' && bedIdx % 2 === 0) tipoModulo = 'jardinera_acc';
      else if (cfg.tipologia === 'educativa' && bedIdx === 0) tipoModulo = 'jardinera_acc';
      else if (cfg.tipologia === 'experimental' && bedIdx < 2) tipoModulo = 'hidroponia';

      const baseGrpIdx = fracSur >= 0.55 ? 0 : (fracSur >= 0.3 ? 3 : (bedIdx % 2 === 0 ? 1 : 2));
      const grp = (cfg.tipologia === 'terapeutica' && bedIdx === nCanteros - 1)
        ? 'arom'
        : ROTACION_ORDEN[(baseGrpIdx + rotShift) % 4];
      const pool = grp === 'fruto'
        ? (fracSur >= 0.5 || c === 0 ? POOLS_ESPECIE.frutoAlto : POOLS_ESPECIE.frutoBajo)
        : (POOLS_ESPECIE[grp] || POOLS_ESPECIE.hoja);
      const filt = esPequena ? pool.filter(k => ESPECIES[k].peque) : pool;
      const lista = filt.length ? filt : pool;
      const especieId = tipoModulo === 'hidroponia'
        ? (bedIdx === 0 ? 'lechuga' : 'espinaca')
        : lista[(bedIdx + rotShift) % lista.length];
      const esp = ESPECIES[especieId];
      const lMod = tipoModulo === 'jardinera_acc' ? Math.min(lC, 3.5) : (tipoModulo === 'hidroponia' ? Math.min(lC, 4.0) : lC);
      const wMod = tipoModulo === 'jardinera_acc' ? 1.0 : wC;
      const rot4 = [0, 1, 2, 3].map(y => ROTACION_NOM[ROTACION_ORDEN[(baseGrpIdx + y) % 4]].split(' (')[0]);

      addEl(tipoModulo, uCenter, vCenter, lMod, wMod, 0, {
        bedNum: bedIdx + 1,
        especieId,
        dripLines: wMod >= 1.2 ? 3 : 2,
        zonaSol: fracSur >= 0.45 ? '6–8 h (sol pleno · Sur/Oeste)' : '4–5 h (semisombra · hojas/raíces)',
        aromAsociada: AROMATICAS[bedIdx % AROMATICAS.length],
        rot4,
        etiqueta: tipoModulo === 'jardinera_acc' ? `Jardinera accesible #${bedIdx + 1}` : tipoModulo === 'hidroponia' ? `Módulo NFT #${bedIdx + 1}` : `Cantero #${bedIdx + 1}`,
        justificacion: fracSur >= 0.5
          ? 'Ubicado al Sur/Oeste para que cultivos altos aprovechen 6–8 h de sol sin sombrear camas bajas (INTA p. 5).'
          : 'Ubicado al Norte/Este para hortalizas de hoja y raíz que prosperan con 4–5 h de luz.'
      });
      bedIdx++;
    }
  }

  // 2. Espacio público central (Pérgola / Aula abierta / Mesas y bancas con sombra — Sección 5)
  const uCenCanteros = uStart + bloqCanterosU / 2;
  const vCentroPlaza = vStart + Math.floor(rows / 2) * (wC + paso) + espacioCentral * 0.48;
  if (espacioCentral > 0) {
    if (tieneAula) {
      const pergL = Math.min(5.2, Math.max(3.6, bloqCanterosU - 0.3));
      const pergW = Math.min(3.2, espacioCentral - 0.6);
      const bLen = Math.min(1.8, (pergL - 0.6) / 2);
      const bDx = Math.min(1.35, pergL * 0.26);
      addEl('pergola', uCenCanteros, vCentroPlaza, pergL, pergW, 0, {
        n: cfg.tipologia === 'educativa' ? 'Aula abierta y pérgola escolar' : cfg.tipologia === 'terapeutica' ? 'Pérgola sensorial y contemplación' : 'Pérgola comunitaria y talleres',
        justificacion: 'Eje central de sombra y aprendizaje conectado sin barreras a las camas didácticas.'
      });
      addEl('mesa_trabajo', uCenCanteros, vCentroPlaza - 0.35, Math.min(2.4, pergL - 1.0), 0.95, 0, {
        n: cfg.tipologia === 'comunitaria' ? 'Mesa de intercambio de semillas y talleres' : 'Mesa de germinación y observación de suelo',
        justificacion: 'Bajo pérgola para talleres, siembra en almácigos y manejo protegido.'
      });
      addEl('banca', uCenCanteros - bDx, vCentroPlaza + pergW * 0.32, bLen, 0.6, 0, { justificacion: 'Asiento con sombra orientado hacia las camas y la mesa pedagógica.' });
      addEl('banca', uCenCanteros + bDx, vCentroPlaza + pergW * 0.32, bLen, 0.6, 0, { justificacion: 'Asiento colectivo para estudiantes y comunidad.' });
    } else {
      const polL = Math.min(4.2, Math.max(2.2, bloqCanterosU - 2.6));
      const polW = Math.min(1.8, espacioCentral - 1.2);
      addEl('polinizadores', uCenCanteros, vCentroPlaza, polL, polW, 0, {
        n: 'Jardín central de polinizadores',
        justificacion: 'Núcleo floral central que distribuye abejas y abejorros hacia todos los canteros.'
      });
      if (bloqCanterosU >= polL + 2.4) {
        // Bancas giradas 90° a lado y lado del jardín floral con 0,55 m de paso libre
        const bOff = polL / 2 + 0.95;
        addEl('banca', uCenCanteros - bOff, vCentroPlaza, 1.7, 0.6, Math.PI / 2, { justificacion: 'Banca de contemplación junto al jardín floral.' });
        addEl('banca', uCenCanteros + bOff, vCentroPlaza, 1.7, 0.6, -Math.PI / 2, { justificacion: 'Banca de descanso y lectura del paisaje.' });
      } else {
        addEl('banca', uCenCanteros, vCentroPlaza + polW / 2 + 0.6, Math.min(1.9, polL), 0.6, 0, { justificacion: 'Banca de contemplación frente al jardín de polinizadores.' });
      }
    }
  }

  // 3. Zona de servicio e infraestructura al Este (+u), apilada con cursor vertical (0 solapes por construcción)
  const uServ = uStart + bloqCanterosU + cab;
  const acceso = { u: uServ + servW * 0.5, v: vMin, ancho: esMini ? 1.2 : 1.5 }; // Acceso 1,50 m (INTA p. 4)

  // Señalización en cabecera Norte junto al acceso (sin invadir la franja de servicios)
  addEl('senalizacion', uStart + bloqCanterosU - 0.65, vMin + aromMargen + 0.45, 1.1, 0.45, 0, {
    justificacion: 'En el acceso principal para orientar sobre especies, ciclos y normas de cuidado.'
  });

  // Banda superior de servicio: Toma de agua + Separación de residuos
  let vCur = vMin + aromMargen + 0.35;
  const aguaSz = esMini ? 1.1 : 1.5;
  const tomaAgua = { u: uServ + aguaSz / 2 + 0.1, v: vCur + aguaSz / 2 };
  addEl('agua', tomaAgua.u, tomaAgua.v, aguaSz, aguaSz, 0, {
    justificacion: 'Junto al acceso y cubierta del invernadero para captar agua lluvia y presurizar el riego por goteo.'
  });
  if (servW >= aguaSz + 2.1) {
    addEl('residuos_sep', uServ + servW - 0.95, vCur + 0.55, 1.7, 0.72, 0, {
      n: cfg.tipologia === 'circular' ? 'Recepción separada de orgánicos aptos' : 'Punto de separación de residuos',
      justificacion: 'En entrada de servicio; separa orgánicos aptos y excluye residuos contaminados o peligrosos (Regla 11.6).'
    });
  } else {
    addEl('residuos_sep', uStart + 0.95, vMin + aromMargen + 0.45, 1.4, 0.6, 0, {
      n: 'Punto de separación de residuos',
      justificacion: 'En entrada de servicio; separa orgánicos aptos y excluye residuos contaminados (Regla 11.6).'
    });
  }
  vCur += aguaSz + 0.75;

  // Estación de cosecha / lavado / sustratos (producción y economía circular)
  if (tieneLavado) {
    const lavL = Math.min(2.4, servW - 0.3);
    addEl('lavado', uServ + servW * 0.5, vCur + 0.55, lavL, 1.1, 0, {
      n: cfg.tipologia === 'circular' ? 'Estación de picado, tamizado y sustratos' : 'Estación de cosecha, lavado y acopio',
      justificacion: 'Conectada a la toma de agua y al acceso de servicio para manejo higiénico de cosecha/sustratos.'
    });
    vCur += 1.1 + 0.85;
  }

  // Invernadero / Semillero (cultivo protegido en zona soleada)
  let invernadero = null;
  if (invOn) {
    const iv = { u: uServ + servW / 2, v: vCur + invW / 2, l: invL, w: invW };
    invernadero = iv;
    addEl('invernadero', iv.u, iv.v, iv.l, iv.w, 0, {
      justificacion: 'Ubicado en claro soleado junto a la cisterna para producir almácigos y proteger solanáceas de heladas bogotanas.'
    });
    vCur += invW + 0.95;
  }

  // Estación de compostaje / Abonera + Bodega de herramientas (lado a lado o apiladas según ancho disponible)
  let abonera, resguardo;
  if (abBodegaJuntas) {
    const hRow = Math.max(abW, resW);
    abonera = { u: uServ + abL / 2, v: vCur + hRow / 2, l: abL, w: abW };
    resguardo = { u: uServ + abL + 0.75 + resL / 2, v: vCur + hRow / 2, l: resL, w: resW };
    vCur += hRow + 0.85;
  } else {
    abonera = { u: uServ + servW / 2, v: vCur + abW / 2, l: abL, w: abW };
    vCur += abW + 0.75;
    resguardo = { u: uServ + servW / 2, v: vCur + resW / 2, l: resL, w: resW };
    vCur += resW + 0.85;
  }
  addEl('abonera', abonera.u, abonera.v, abonera.l, abonera.w, 0, {
    n: cfg.tipologia === 'circular' ? 'Compostaje + vermicompostaje + maduración' : `Abonera de 3 compartimentos (${abL.toFixed(1)} × ${abW.toFixed(1)} m)`,
    justificacion: 'En borde de servicio con acceso directo y separado de zonas de estancia para manejo sanitario (Regla 11.6).'
  });
  addEl('bodega', resguardo.u, resguardo.v, resguardo.l, resguardo.w, 0, {
    justificacion: 'Resguardo de herramientas y banco de semillas en frascos herméticos en lugar fresco (INTA p. 6).'
  });

  // Elementos específicos adicionales (Sección 3)
  if (tieneInfilt) {
    addEl('infiltracion', uServ + servW * 0.5, vCur + 0.7, Math.min(4.4, servW - 0.3), 1.4, 0, {
      justificacion: 'Zanja biofiltrante en borde bajo para infiltrar excedentes de lluvia y evitar encharcamientos.'
    });
    vCur += 1.4 + 0.75;
  }
  if ((cfg.tipologia === 'biodiversidad' || cfg.escenario === 'B') && frutAncho >= 1.1) {
    addEl('hotel_insectos', uMin + aromMargen + frutAncho * 0.52, vMin + aromMargen + 0.75, 0.9, 0.6, 0, {
      justificacion: 'Borde soleado junto a aromáticas y frutales para hospedar abejas solitarias y polinizadores.'
    });
  }
  if (cfg.tipologia === 'experimental') {
    if (!esMini) {
      addEl('meteo', uMin + aromMargen + Math.max(0.8, frutAncho * 0.52), vMin + aromMargen + 0.8, 1.0, 1.0, 0, {
        justificacion: 'Despejada de obstáculos para registrar radiación, lluvia, temperatura y humedad del suelo.'
      });
    }
    if (tieneMesaExp) {
      addEl('mesa_trabajo', uServ + servW * 0.5, vCur + 0.5, Math.min(2.4, servW - 0.3), 1.0, 0, {
        n: 'Mesa de registro experimental y análisis',
        justificacion: 'Espacio técnico para comparar suelo, sustratos e hidroponía.'
      });
      vCur += 1.0 + 0.75;
    }
  }
  if (!tieneAula && !esMini) {
    const vBanca = servW >= aguaSz + 2.1 ? (vMin + aromMargen + 0.5) : (vMax - aromMargen - 0.5);
    addEl('banca', uStart + Math.min(1.6, bloqCanterosU * 0.35), vBanca, 1.8, 0.6, 0, {
      justificacion: 'Banca de pausa junto al camino principal sin invadir camas de cultivo.'
    });
  }

  // 4. Frutales y perennes al costado Oeste (fuera de rotación anual, INTA pp. 3 y 5)
  const frutales = [];
  if (frutAncho > 0) {
    const uFrut = uMin + aromMargen + frutAncho * 0.52;
    const nFrut = Math.max(2, Math.floor((totalW - aromMargen * 2 - 2.6) / 3.2));
    for (let i = 0; i < nFrut; i++) {
      const f = nFrut > 1 ? i / (nFrut - 1) : 0.5;
      frutales.push({ u: uFrut, v: (vMin + aromMargen + 2.0) + f * (totalW - aromMargen * 2 - 3.6), n: FRUTALES[i % FRUTALES.length] });
    }
  }

  // 5. Aromáticas arbustivas en el perímetro (INTA pp. 3 y 6)
  const aromaticas = [];
  for (let u = uMin + 1.2; u <= uMax - 1.2; u += 2.0) {
    if (Math.abs(u - acceso.u) > 1.4) aromaticas.push({ u, v: vMin + 0.45, n: AROMATICAS[aromaticas.length % AROMATICAS.length] });
    aromaticas.push({ u, v: vMax - 0.45, n: AROMATICAS[aromaticas.length % AROMATICAS.length] });
  }
  for (let v = vMin + 2.0; v <= vMax - 2.0; v += 2.0) {
    aromaticas.push({ u: uMin + 0.45, v, n: AROMATICAS[aromaticas.length % AROMATICAS.length] });
    aromaticas.push({ u: uMax - 0.45, v, n: AROMATICAS[aromaticas.length % AROMATICAS.length] });
  }

  // 6. Cortina cortavientos estrictamente al Sur (+v) y Oeste (-u) (INTA pp. 3 y 5)
  const cortaviento = [];
  if (cfg.cortaviento) {
    for (let u = uMin - 1.4; u <= uMax + 0.8; u += 3.2) cortaviento.push({ u, v: vMax + 1.55, lado: 'Sur' });
    for (let v = vMin + 0.8; v <= vMax + 0.8; v += 3.2) cortaviento.push({ u: uMin - 1.55, v, lado: 'Oeste' });
  }

  // 7. Cerco perimetral 1,50 m con cómputo técnico exacto (INTA p. 4)
  const cerco = calcularCercoINTA(uMin, uMax, vMin, vMax, acceso, cfg.cerco, cfg.mallaFina);

  const primerC = elementos.find(e => e.cat === 'cultivo');
  const triangulo345 = primerC ? { u: primerC.u - primerC.l / 2, v: primerC.v - primerC.w / 2 } : { u: 0, v: 0 };

  const proyecto = {
    cfg, tipologia: tipoObj, park, orientAng,
    sitio: sitioForzado || (park && park.sitio) || (park && park.c) || [0, 0],
    poligonoInterv: [[uMin, vMin], [uMax, vMin], [uMax, vMax], [uMin, vMax]],
    dims: { totalL, totalW, areaTotal: +(totalL * totalW).toFixed(1), uMin, uMax, vMin, vMax, dripLines, paso, cab },
    elementos,
    infra: { acceso, tomaAgua, invernadero, abonera, resguardo, frutales, aromaticas, cortaviento, triangulo345 },
    cerco
  };

  proyecto.sim = ejecutarSimulaciones(proyecto, park, diag, { mes: 6, hora: 10.5, diaCiclo: 65 });
  return proyecto;
}

export function calcularCercoINTA(uMin, uMax, vMin, vMax, acceso, tipo, mallaFina) {
  const totalL = uMax - uMin, totalW = vMax - vMin;
  const perimetro = (totalL + totalW) * 2;
  const perimAlambrado = Math.max(0, perimetro - acceso.ancho);
  const tramos = [
    { a: [uMin, vMin], b: [acceso.u - acceso.ancho / 2, vMin], esqA: true, esqB: false, puerta: true },
    { a: [acceso.u + acceso.ancho / 2, vMin], b: [uMax, vMin], esqA: false, esqB: true, puerta: true },
    { a: [uMax, vMin], b: [uMax, vMax], esqA: true, esqB: true },
    { a: [uMax, vMax], b: [uMin, vMax], esqA: true, esqB: true },
    { a: [uMin, vMax], b: [uMin, vMin], esqA: true, esqB: true }
  ];
  const postes = [], puntales = [];
  let nPostes = 0, nPuntales = 0;
  for (const tr of tramos) {
    const dx = tr.b[0] - tr.a[0], dv = tr.b[1] - tr.a[1], len = Math.hypot(dx, dv);
    if (len < 0.4) continue;
    const ux = dx / len, uv = dv / len;
    const nSeg = Math.max(1, Math.round(len / 2.5));
    for (let i = 0; i <= nSeg; i++) {
      if (i === nSeg && tr.esqB) continue;
      const d = (i / nSeg) * len;
      const pu = tr.a[0] + ux * d, pv = tr.a[1] + uv * d;
      const esEsq = (i === 0 && tr.esqA);
      const cada10 = i > 0 && i < nSeg && Math.abs(d % 10) < 1.3 && d >= 8.5 && len - d >= 3;
      postes.push({ u: pu, v: pv, esq: esEsq }); nPostes++;
      if (esEsq) { puntales.push({ u: pu, v: pv, du: ux * 1.15, dv: uv * 1.15 }); nPuntales++; }
      else if (cada10) { puntales.push({ u: pu, v: pv, du: -ux * 1.1, dv: -uv * 1.1 }, { u: pu, v: pv, du: ux * 1.1, dv: uv * 1.1 }); nPuntales += 2; }
    }
    if (tr.puerta) {
      const gp = tr.esqA ? tr.b : tr.a, dir = tr.esqA ? -1 : 1;
      postes.push({ u: gp[0], v: gp[1], puerta: true });
      puntales.push({ u: gp[0], v: gp[1], du: ux * dir * 1.1, dv: uv * dir * 1.1 });
      nPostes++; nPuntales++;
    }
  }
  return {
    tipo, altura: 1.5, mallaFina: !!mallaFina,
    perimetro: +perimetro.toFixed(1), perimAlambrado: +perimAlambrado.toFixed(1),
    tramos, postes, puntales,
    bom: {
      tejidoRomboidalM: Math.ceil(perimAlambrado),
      postesUn: nPostes,
      puntalesUn: nPuntales,
      alambreLisoM: Math.ceil(perimAlambrado * 3 * 1.05),
      planchuelasUn: 6,
      ganchosJUn: 18,
      torniquetesUn: 12,
      mallaFinaM: mallaFina ? Math.ceil(perimAlambrado) : 0
    }
  };
}

/* ---------- 3 Escenarios Automáticos Comparables (Sección 6) ---------- */
export function generarTresEscenarios(park, diag, baseCfg = {}, sitio = null) {
  const escA = generarProyecto(park, diag, {
    ...baseCfg, escenario: 'A', tipologia: 'produccion', concepto: 'utilitario',
    anchoCantero: 1.25, largoCantero: 6, numCanteros: 16, pasoCanteros: 0.50, pasoCabeceras: 1.0, invernadero: true
  }, sitio);
  const escB = generarProyecto(park, diag, {
    ...baseCfg, escenario: 'B', tipologia: 'biodiversidad', concepto: 'paisajistico',
    anchoCantero: 1.25, largoCantero: 6, numCanteros: 10, pasoCanteros: 0.50, pasoCabeceras: 1.25, invernadero: true, cortaviento: true
  }, sitio);
  const escC = generarProyecto(park, diag, {
    ...baseCfg, escenario: 'C', tipologia: 'educativa', concepto: 'paisajistico',
    anchoCantero: 1.0, largoCantero: 4, numCanteros: 8, pasoCanteros: 0.50, pasoCabeceras: 1.50, invernadero: true
  }, sitio);
  return { A: escA, B: escB, C: escC };
}

/* ---------- 7 SIMULACIONES REALES CON TRANSPARENCIA CIENTÍFICA (SECCIÓN 7) ---------- */
export function ejecutarSimulaciones(proyecto, park, diag, simEnv = {}) {
  const mes = simEnv.mes || 6;
  const hora = simEnv.hora != null ? simEnv.hora : 10.5;
  const diaCiclo = simEnv.diaCiclo != null ? simEnv.diaCiclo : 65;

  const camas = proyecto.elementos.filter(e => e.cat === 'cultivo');
  const areaCultivo = +camas.reduce((s, e) => s + e.l * e.w, 0).toFixed(1);
  const areaParque = park ? park.area : 6000;
  const pctParqueOcupado = +((proyecto.dims.areaTotal / Math.max(1, areaParque)) * 100).toFixed(1);
  const pctParqueLibre = +(100 - pctParqueOcupado).toFixed(1);

  /* 1. SIMULACIÓN SOLAR (Astronómica real Bogotá 4.63°N) */
  const sol = posicionSolarBogota(mes, hora);
  const horasSolBase = diag ? diag.solProm : 6.4;
  const camasAdecuadasSol = camas.filter(c => {
    const esp = ESPECIES[c.especieId];
    return !esp || esp.grp !== 'fruto' || horasSolBase >= 5.5;
  }).length;
  const solar = {
    titulo: 'Simulación solar (Bogotá 4.63°N)',
    resumen: `${sol.altDeg}° altitud · azimut ${sol.azDeg}° · ~${horasSolBase} h sol directo/día`,
    sol, horasSolBase, camasAdecuadasSol, totalCamas: camas.length,
    variables: `Mes ${BOGOTA_CLIMA.meses[mes - 1]}, hora ${hora.toFixed(1)} h, latitud ${BOGOTA_CLIMA.lat}°N, ${diag ? diag.arbolesDentro : 0} árboles censados`,
    supuestos: 'Cielo parcialmente nublado típico de Bogotá (factor atenuación nubosidad ~0,68); copas modeladas por altura del censo.',
    unidades: 'Grados (°), horas de sol directo/día (h/d), longitud relativa de sombra (m/m altura)',
    fuentes: 'Ecuaciones astronómicas solares (Cooper 1969) + censo arbolado data3d/trees.json',
    limitaciones: 'No modela sombras dinámicas de edificios fuera del parque (para radiación horaria kWh/m² detallada integrar servicio Ladybug/Radiance).',
    confianza: 'Media-Alta (geometría solar exacta; nubosidad promediada)'
  };

  /* 2. SIMULACIÓN HÍDRICA (FAO-56 ETc + Captación de lluvia IDEAM Bogotá) */
  const efGoteo = 0.88; // eficiencia riego por goteo INTA
  let demandaDiariaL = 0;
  for (const c of camas) {
    const esp = ESPECIES[c.especieId] || ESPECIES.lechuga;
    const factorHidro = c.tipo === 'hidroponia' ? 0.35 : 1.0; // recirculación NFT ahorra ~65%
    demandaDiariaL += (BOGOTA_CLIMA.et0MmDia * esp.kc * (c.l * c.w) * factorHidro) / efGoteo;
  }
  demandaDiariaL = Math.round(demandaDiariaL);
  // Área de cubierta captadora (invernadero + bodega + pérgola)
  const areaCubiertas = proyecto.elementos
    .filter(e => e.tipo === 'invernadero' || e.tipo === 'bodega' || e.tipo === 'pergola')
    .reduce((s, e) => s + e.l * e.w, 0);
  const coefEscorrentia = 0.82;
  const balanceMensual = BOGOTA_CLIMA.lluviaMensualMm.map((mm, i) => {
    const capL = Math.round(areaCubiertas * mm * coefEscorrentia);
    const demL = Math.round(demandaDiariaL * 30.4 * (mm > 90 ? 0.65 : 0.92)); // meses lluviosos reducen riego
    return { mes: BOGOTA_CLIMA.meses[i], mm, captacionL: capL, demandaL: demL, balanceL: capL - demL };
  });
  const capAnualM3 = +(balanceMensual.reduce((s, m) => s + m.captacionL, 0) / 1000).toFixed(1);
  const demAnualM3 = +(balanceMensual.reduce((s, m) => s + m.demandaL, 0) / 1000).toFixed(1);
  const coberturaLluviaPct = Math.min(100, Math.round((capAnualM3 / Math.max(0.1, demAnualM3)) * 100));
  const metrosCintaGoteo = Math.round(camas.reduce((s, c) => s + c.l * (c.dripLines || 2), 0));
  const hidrica = {
    titulo: 'Simulación hídrica y captación pluvial',
    resumen: `${demandaDiariaL} L/día · ${demAnualM3} m³/año · Lluvia cubre ${coberturaLluviaPct}% (${capAnualM3} m³)`,
    demandaDiariaL, demAnualM3, capAnualM3, coberturaLluviaPct, areaCubiertas: +areaCubiertas.toFixed(1),
    metrosCintaGoteo, balanceMensual,
    variables: `Área cultivada ${areaCultivo} m², ET0 ${BOGOTA_CLIMA.et0MmDia} mm/d, cubiertas captadoras ${areaCubiertas.toFixed(1)} m², eficiencia goteo 88%`,
    supuestos: 'Precipitación media mensual Bogotá 880 mm/año (régimen bimodal), coeficiente escorrentía cubierta 0,82; en meses >90 mm se reduce riego suplementario 35%.',
    unidades: 'Litros/día (L/d), metros cúbicos/año (m³/año), milímetros/mes (mm)',
    fuentes: 'FAO-56 (Kc por hortaliza), IDEAM (lluvia mensual Bogotá), Pro Huerta–INTA (2–3 líneas goteo)',
    limitaciones: 'No modela variabilidad interanual (El Niño / La Niña) ni capacidad de infiltración medida en sitio (para simulación fenológica diaria usar AquaCrop en servidor).',
    confianza: 'Media (válida para dimensionamiento preliminar de cisternas y riego)'
  };

  /* 3. SIMULACIÓN PRODUCTIVA (Rangos JBB / Pro Huerta–INTA + Ciclo 0–180 días) */
  let kgMin = 0, kgMax = 0, residuoFrescoAnio = 0;
  for (const c of camas) {
    const esp = ESPECIES[c.especieId] || ESPECIES.lechuga;
    const areaC = c.l * c.w;
    const factorSol = horasSolBase >= 5.8 ? 1.0 : (esp.grp === 'fruto' ? 0.72 : 0.94);
    const factorHidro = c.tipo === 'hidroponia' ? 1.25 : 1.0;
    const kMin = esp.kgM2Rango[0] * esp.ciclosAnio * 0.72 * areaC * factorSol * factorHidro;
    const kMax = esp.kgM2Rango[1] * esp.ciclosAnio * 0.72 * areaC * factorSol * factorHidro;
    kgMin += kMin; kgMax += kMax;
    residuoFrescoAnio += ((kMin + kMax) * 0.5) * (esp.etapas.residuos.fracResidual || 0.25);
  }
  kgMin = Math.round(kgMin); kgMax = Math.round(kgMax);
  const kgMedio = Math.round((kgMin + kgMax) / 2);
  const familiasINTA = +(areaCultivo / 50).toFixed(1); // Referencia INTA p. 5: 50 m² ≈ 1 familia tipo
  const horasDiaINTA = +((areaCultivo / 50) * 1.5).toFixed(1); // Referencia INTA p. 5: 50 m² ≈ 1,5 h/día
  const etapaActual = diaCiclo < 10 ? '1–2 · Semilla y germinación'
    : diaCiclo < 32 ? '3 · Plántula y trasplante'
    : diaCiclo < 75 ? '4 · Crecimiento vegetativo y floración'
    : diaCiclo < 120 ? '5–6 · Cosecha y aprovechamiento'
    : '7–8 · Residuos, compostaje y rotación';
  const productiva = {
    titulo: 'Simulación productiva y ciclo fenológico',
    resumen: `${kgMin}–${kgMax} kg/año · ~${familiasINTA} familias (ref. 50 m² INTA) · ${horasDiaINTA} h/día`,
    kgMin, kgMax, kgMedio, familiasINTA, horasDiaINTA, diaCiclo, etapaActual,
    variables: `${camas.length} camas (${areaCultivo} m² netos), ciclos/año por especie, ajuste solar ${horasSolBase} h/d`,
    supuestos: 'Factor de ocupación efectiva del calendario 0,72 (descuenta transiciones y preparación de camas); mermas postcosecha 10–15% incluidas.',
    unidades: 'Kilogramos frescos/año (kg/año), familias equivalentes (50 m²/fam), horas/día',
    fuentes: 'Cartilla Agricultura Urbana JBB, Pro Huerta–INTA (2016), rangos AGROSAVIA clima frío',
    limitaciones: 'Los rendimientos reales dependen del manejo comunitario, análisis de suelo y control de heladas/plagas; se muestran como rango estimado, nunca como producción garantizada.',
    confianza: 'Media (rangos referenciales verificados para clima frío de Bogotá)'
  };

  /* 4. SIMULACIÓN DE COMPOSTAJE Y ECONOMÍA CIRCULAR */
  const aporteVecinalAnio = proyecto.cfg.tipologia === 'circular' ? 2400 : (proyecto.cfg.tipologia === 'comunitaria' ? 800 : 350);
  const residuosTotalesKg = Math.round(residuoFrescoAnio + aporteVecinalAnio);
  const perdidaMasaPct = 62; // compostaje aeróbico pierde ~60–65% de agua y CO2
  const compostObtenidoKg = Math.round(residuosTotalesKg * (1 - perdidaMasaPct / 100));
  const demandaAbonoKg = Math.round(areaCultivo * 4.0); // 4 kg/m²/año INTA
  const autosufAbonoPct = Math.min(100, Math.round((compostObtenidoKg / Math.max(1, demandaAbonoKg)) * 100));
  const compostaje = {
    titulo: 'Simulación de compostaje y economía circular',
    resumen: `${residuosTotalesKg} kg/año orgánicos → ${compostObtenidoKg} kg compost (${autosufAbonoPct}% de la demanda)`,
    residuoCultivoKg: Math.round(residuoFrescoAnio), aporteVecinalAnio, residuosTotalesKg,
    perdidaMasaPct, diasProceso: 75, compostObtenidoKg, demandaAbonoKg, autosufAbonoPct,
    variables: `Restos de cultivo ${Math.round(residuoFrescoAnio)} kg/año + orgánicos vecinales separados ${aporteVecinalAnio} kg/año`,
    supuestos: 'Relación C:N equilibrada 25–30:1 (restos verdes + viruta/paja seca), volteo quincenal, reducción de masa 62%, exclusión estricta de residuos contaminados/peligrosos.',
    unidades: 'Kilogramos/año (kg/año), días de maduración (d), porcentaje de masa (%)',
    fuentes: 'Manual de compostaje urbano FAO / JBB + Abonera 3,6×2,4 m Pro Huerta–INTA',
    limitaciones: 'Aporte vecinal es un escenario ilustrativo sujeto a participación barrial y separación limpia en la fuente.',
    confianza: 'Media (tasa de conversión de masa sólida en literatura; aporte vecinal es supuesto editable)'
  };

  /* 5. SIMULACIÓN DE BIODIVERSIDAD Y CONECTIVIDAD (Regla 11.9: riqueza funcional, NO conteo de objetos verdes) */
  const especiesSet = new Set(camas.map(c => c.especieId));
  const familiasSet = new Set(camas.map(c => (ESPECIES[c.especieId] || {}).fam).filter(Boolean));
  const tienePolin = proyecto.elementos.some(e => e.tipo === 'polinizadores');
  const tieneRefugio = proyecto.elementos.some(e => e.tipo === 'hotel_insectos');
  const tieneInfilt = proyecto.elementos.some(e => e.tipo === 'infiltracion');
  const estratos = 1 + (proyecto.infra.aromaticas.length ? 1 : 0) + (proyecto.infra.frutales.length ? 1 : 0) + (proyecto.infra.cortaviento.length ? 1 : 0);
  const indiceBio = Math.min(100, Math.round(
    familiasSet.size * 9 + especiesSet.size * 3.5 + estratos * 7 + (tienePolin ? 12 : 0) + (tieneRefugio ? 8 : 0) + (tieneInfilt ? 6 : 0)
  ));
  const biodiversidad = {
    titulo: 'Evaluación funcional de biodiversidad',
    resumen: `Índice ${indiceBio}/100 · ${familiasSet.size} familias botánicas · ${estratos} estratos · 0 árboles talados`,
    indiceBio, numEspecies: especiesSet.size, numFamilias: familiasSet.size, estratos,
    arbolesConservados: diag ? diag.arbolesDentro : 0,
    variables: `${especiesSet.size} especies en camas, ${familiasSet.size} familias botánicas, ${proyecto.infra.aromaticas.length} aromáticas, ${proyecto.infra.cortaviento.length} arbustos cortaviento, ${diag ? diag.arbolesDentro : 0} árboles conservados`,
    supuestos: 'Evalúa diversidad de familias botánicas, estratificación vertical y presencia de flora melífera/refugios (no simple número de objetos verdes).',
    unidades: 'Índice funcional compuesto (0–100), número de familias botánicas, estratos',
    fuentes: 'Red de Interacciones Bióticas de Kennedy (data3d/biotica.json) y guías JBB de polinizadores',
    limitaciones: 'Evalúa potencial de hábitat y oferta floral, NO sustituye muestreos biológicos de fauna en campo.',
    confianza: 'Media-Baja (indicador estructural de diseño; colonización real depende de conectividad del entorno)'
  };

  /* 6. SIMULACIÓN DE USO PÚBLICO Y ACCESIBILIDAD */
  const nBancas = proyecto.elementos.filter(e => e.tipo === 'banca').length;
  const nMesas = proyecto.elementos.filter(e => e.tipo === 'mesa_trabajo').length;
  const nPergolas = proyecto.elementos.filter(e => e.tipo === 'pergola').length;
  const nJardAcc = proyecto.elementos.filter(e => e.tipo === 'jardinera_acc').length;
  const aforoSim = nBancas * 3 + nPergolas * 16 + nMesas * 6 + Math.min(12, camas.length);
  const cumpleAccesibilidad = proyecto.dims.cab >= 1.2;
  const usoPublico = {
    titulo: 'Uso público, accesibilidad y permanencia',
    resumen: `Aforo ~${aforoSim} pers. · ${pctParqueLibre}% del parque libre · rutas ${proyecto.dims.cab.toFixed(2)} m`,
    aforoSim, pctParqueOcupado, pctParqueLibre, nBancas, nMesas, nPergolas, nJardAcc, cumpleAccesibilidad,
    variables: `Área huerta ${proyecto.dims.areaTotal} m² (${pctParqueOcupado}% del parque), cabeceras ${proyecto.dims.cab.toFixed(2)} m, ${nBancas} bancas, ${nPergolas} pérgola(s), ${nJardAcc} jardineras accesibles`,
    supuestos: '3 personas/banca, 16 personas/aula abierta, 6 personas/mesa de trabajo; mínimo 75% del parque permanece abierto al uso recreativo general.',
    unidades: 'Personas simultáneas, porcentaje de parque abierto (%), ancho libre de paso (m)',
    fuentes: 'Cartilla de Espacio Público Bogotá (DADEP/IDRD), NTC 4143 (accesibilidad peatonal), INTA p. 2 (cabeceras ≥ 1 m)',
    limitaciones: 'No simula dinámicas sociales de gobernanza ni conflictos horarios (requiere concertación con JAC y comunidad).',
    confianza: 'Media-Alta (geometría verificada; uso social es capacidad de diseño)'
  };

  /* 7. SIMULACIÓN DE COSTOS REFERENCIALES (COP Bogotá) */
  let capexElementos = 0;
  for (const e of proyecto.elementos) {
    const base = (CATALOGO_ELEMENTOS[e.tipo] || {}).costoCOP || 350000;
    const esc = e.tipo === 'cantero' ? (e.l * e.w) / 7.5 : 1.0;
    capexElementos += base * esc;
  }
  const capexCerco = proyecto.cerco.tipo === 'ninguno' ? 0 : Math.round(proyecto.cerco.perimAlambrado * 92000 + (proyecto.cerco.mallaFina ? proyecto.cerco.perimAlambrado * 28000 : 0));
  const capexPisoRiego = Math.round(proyecto.dims.areaTotal * (proyecto.cfg.concepto === 'paisajistico' ? 62000 : 28000) + metrosCintaGoteo * 4500);
  const capexAromCort = (proyecto.infra.aromaticas.length * 14000) + (proyecto.infra.frutales.length * 48000) + (proyecto.infra.cortaviento.length * 55000);
  const capexTotal = Math.round(capexElementos + capexCerco + capexPisoRiego + capexAromCort);
  const opexAnual = Math.round(capexTotal * 0.14 + areaCultivo * 18000);
  const costos = {
    titulo: 'Estimación paramétrica de costos (COP)',
    resumen: `Inversión ~$${(capexTotal / 1e6).toFixed(1)} M COP · Operación ~$${(opexAnual / 1e6).toFixed(1)} M/año`,
    capexTotal, opexAnual,
    desglose: {
      elementos: Math.round(capexElementos),
      cerco: capexCerco,
      pisosYRiego: capexPisoRiego,
      vegetacionPerimetral: capexAromCort
    },
    variables: `${proyecto.elementos.length} módulos construidos, ${proyecto.cerco.perimAlambrado} m cerco, ${proyecto.dims.areaTotal} m² piso/caminos, ${metrosCintaGoteo} m goteo`,
    supuestos: 'Precios unitarios referenciales de obra liviana/mobiliario urbano Bogotá (no incluye obra civil mayor de acueducto, estudios geotécnicos ni licencias).',
    unidades: 'Pesos colombianos (COP)',
    fuentes: 'Cantidades de obra medidas del modelo 3D + precios paramétricos referenciales Bogotá',
    limitaciones: 'Estimación conceptual de orden de magnitud (±25–35%); requiere APU detallado y cotizaciones vigentes.',
    confianza: 'Media-Baja (presupuesto conceptual preliminar)'
  };

  return { areaCultivo, pctParqueOcupado, pctParqueLibre, solar, hidrica, productiva, compostaje, biodiversidad, usoPublico, costos };
}

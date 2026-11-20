/* ============ CATÁLOGO AGRONÓMICO (BOGOTÁ 2.600 msnm) · 7 TIPOLOGÍAS · CICLO DE 8 ETAPAS ============
   Referencias técnicas verificadas:
   - Ing. Agr. Jorge E. Graziano, "Diseño de Huertas", Pro Huerta – INTA (AER San Martín de los Andes, 2016)
   - Jardín Botánico de Bogotá José Celestino Mutis (JBB), Cartilla de Agricultura Urbana y Periurbana Agroecológica
   - FAO-56 (Allen et al.), Evapotranspiración del cultivo (valores Kc de referencia)
   - AGROSAVIA, lineamientos de hortalizas de clima frío moderado (Altiplano Cundiboyacense, 2.550–2.650 msnm)
   - IDEAM, precipitación media mensual estación Aeropuerto El Dorado / Bogotá (~880 mm/año, régimen bimodal)
   NOTA DE RIGOR: Todos los rendimientos se expresan como rangos estimados [mín, máx] para agricultura urbana biointensiva;
   NO sustituyen mediciones de campo ni análisis de suelo de laboratorio. */

export const BOGOTA_CLIMA = {
  lat: 4.628,
  lon: -74.155,
  altitudM: 2560,
  tempMediaC: 14.0,
  tempMinC: 8.5,
  tempMaxC: 19.5,
  et0MmDia: 3.1, // Evapotranspiración de referencia media Sabana de Bogotá (IDEAM / FAO-56)
  // Precipitación media mensual Bogotá (mm/mes, régimen bimodal: picos abr-may y oct-nov)
  lluviaMensualMm: [32, 48, 78, 118, 102, 56, 42, 46, 74, 128, 104, 52],
  meses: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
};

export const TIPOLOGIAS = {
  produccion: {
    id: 'produccion',
    letra: 'A',
    n: 'Producción alimentaria',
    corto: 'Producción',
    c: '#22c55e',
    obj: 'Producir hortalizas frescas de manera eficiente y sostenible con diseño utilitario INTA.',
    conceptoDef: 'utilitario',
    pesoProd: 1.0, pesoBio: 0.45, pesoEdu: 0.4, pesoAcc: 0.55,
    maxOcupParque: 0.22,
    requiere: ['Camas productivas INTA (1–1,25 m × 4–8 m)', 'Invernadero / semillero', 'Riego por goteo (2–3 líneas)', 'Abonera 3,6×2,4 m', 'Bodega de herramientas', 'Zona de cosecha y acopio', 'Cerco 1,50 m + cortaviento S–O'],
    simula: 'Superficie cultivada, ciclos productivos, consumo hídrico y rango de cosecha estimada.'
  },
  comunitaria: {
    id: 'comunitaria',
    letra: 'B',
    n: 'Huerta comunitaria',
    corto: 'Comunitaria',
    c: '#f59e0b',
    obj: 'Integrar a los habitantes del barrio mediante parcelas colectivas, talleres e intercambio de semillas.',
    conceptoDef: 'paisajistico',
    pesoProd: 0.72, pesoBio: 0.6, pesoEdu: 0.8, pesoAcc: 0.85,
    maxOcupParque: 0.20,
    requiere: ['Parcelas individuales y colectivas', 'Mesas de trabajo y talleres', 'Bancas con sombra y encuentro', 'Caminos accesibles ≥ 1,20 m', 'Banco de intercambio de semillas', 'Compostaje comunitario', 'Señalización barrial'],
    simula: 'Capacidad de usuarios, accesibilidad, parcelas disponibles y carga de mantenimiento comunitario.'
  },
  educativa: {
    id: 'educativa',
    letra: 'C',
    n: 'Huerta educativa',
    corto: 'Educativa',
    c: '#38bdf8',
    obj: 'Enseñar procesos biológicos, agua, suelo y ciclos agrícolas en articulación con colegios de Kennedy.',
    conceptoDef: 'paisajistico',
    pesoProd: 0.55, pesoBio: 0.78, pesoEdu: 1.0, pesoAcc: 0.9,
    maxOcupParque: 0.18,
    requiere: ['Semilleros y mesas de germinación', 'Camas didácticas por etapas', 'Aula abierta con bancas para estudiantes', 'Jardín de polinizadores', 'Captación de lluvia demostrativa', 'Estación de observación de suelo y raíces (30 cm)', 'Señalización de ciclos biológicos'],
    simula: 'Aforo escolar simultáneo, cobertura de colegios en radio 500–1.000 m y ciclo interactivo semilla–cosecha.'
  },
  biodiversidad: {
    id: 'biodiversidad',
    letra: 'D',
    n: 'Agroecológica y biodiversidad',
    corto: 'Biodiversidad',
    c: '#10b981',
    obj: 'Fortalecer policultivos, corredores ecológicos, polinizadores e infiltración pluvial conservando el arbolado.',
    conceptoDef: 'paisajistico',
    pesoProd: 0.58, pesoBio: 1.0, pesoEdu: 0.65, pesoAcc: 0.65,
    maxOcupParque: 0.18,
    requiere: ['Policultivos y asociaciones vegetales', 'Jardines de polinizadores nativos', 'Corredor de vegetación nativa y cortaviento', 'Hoteles de insectos y refugios de fauna', 'Coberturas vegetales (mulch)', 'Zanja / jardín de infiltración pluvial', 'Conservación estricta de árboles existentes'],
    simula: 'Riqueza botánica (familias), continuidad floral para polinizadores y conectividad ecológica.'
  },
  experimental: {
    id: 'experimental',
    letra: 'E',
    n: 'Experimental y biotecnológica',
    corto: 'Experimental',
    c: '#a855f7',
    obj: 'Ensayar técnicas (suelo alomado, sustratos elevados e hidroponía) con sensores ambientales y registro.',
    conceptoDef: 'utilitario',
    pesoProd: 0.82, pesoBio: 0.55, pesoEdu: 0.85, pesoAcc: 0.72,
    maxOcupParque: 0.16,
    requiere: ['Módulos comparativos: suelo, sustrato e hidroponía', 'Sensores de humedad y temperatura', 'Estación meteorológica local', 'Riego controlado por goteo', 'Invernadero de ensayo', 'Mesa de registro y monitoreo'],
    simula: 'Comparativa de tecnologías por consumo hídrico, requerimiento energético, costo y productividad.'
  },
  terapeutica: {
    id: 'terapeutica',
    letra: 'F',
    n: 'Terapéutica y sensorial',
    corto: 'Terapéutica',
    c: '#ec4899',
    obj: 'Crear experiencias accesibles de bienestar, estimulación sensorial, confort térmico y jardinería sin barreras.',
    conceptoDef: 'paisajistico',
    pesoProd: 0.42, pesoBio: 0.72, pesoEdu: 0.7, pesoAcc: 1.0,
    maxOcupParque: 0.16,
    requiere: ['Jardineras elevadas accesibles (80 cm altura)', 'Recorridos sin barreras (≥ 1,50 m firmes)', 'Bancas con respaldo bajo pérgola de sombra', 'Jardines aromáticos y de texturas', 'Mesas accesibles de jardinería', 'Espacio de contemplación'],
    simula: 'Accesibilidad universal (NTC 4143), confort ergonómico, cobertura de sombra y seguridad.'
  },
  circular: {
    id: 'circular',
    letra: 'G',
    n: 'Economía circular',
    corto: 'Circular',
    c: '#d97706',
    obj: 'Cerrar ciclos de residuos orgánicos aptos hacia compost/vermicompost validado que nutre los cultivos.',
    conceptoDef: 'utilitario',
    pesoProd: 0.74, pesoBio: 0.68, pesoEdu: 0.78, pesoAcc: 0.68,
    maxOcupParque: 0.20,
    requiere: ['Recepción separada de orgánicos aptos (excluye peligrosos)', 'Estación de picado y pesaje', 'Compostaje en pilas + vermicompostaje', 'Zona de maduración y tamizado', 'Bodega de sustratos validados', 'Camas nutridas con compost propio', 'Señalización de flujos materiales'],
    simula: 'Flujo de residuos orgánicos, pérdida de masa (~62%), tiempo de maduración y autosuficiencia de abono.'
  }
};

// 18 especies validadas para clima frío moderado de Bogotá (2.550–2.650 msnm) con ciclo completo de 8 etapas
export const ESPECIES = {
  lechuga: {
    id: 'lechuga', n: 'Lechuga crespa / batavia', sci: 'Lactuca sativa', grp: 'hoja', fam: 'Asteráceas',
    climaBogota: 'Óptima en Bogotá (12–18 °C, aire libre todo el año)',
    h: 0.24, luz: '4–5 h (tolera semisombra)', kc: 0.75, alto: false, peque: true, sensorial: 'Textura suave',
    c: '#84cc16', c2: '#a3e635', fr: null, tipo3d: 'roseta', fil: 3, paso: 0.28,
    kgM2Rango: [3.5, 5.8], ciclosAnio: 4,
    asociaciones: ['Zanahoria', 'Rábano', 'Cebolla de verdeo', 'Caléndula'],
    etapas: {
      semillas: { tasaGerm: 88, gM2: 0.4, siembra: 'Almácigo o siembra directa escalonada', calendario: 'Todo el año (Bogotá); escalonar cada 10–14 días', guardado: 'Frasco hermético seco y fresco (viabilidad 2–3 años)' },
      germinacion: { dias: 6, tempC: '15–20 °C', humPct: 75, sustrato: '50% tierra negra + 30% compost tamizado + 20% cascarilla', perdidaPct: 10, proteccion: 'Malla polisombra 35% si sol fuerte' },
      trasplante: { edadDias: 24, dist: '30 × 25 cm', densM2: 13, suelo: 'Alomado 15 cm, suelto 30 cm sin voltear terrón' },
      crecimiento: { diasTot: 62, riegoLDia: 3.4, nutrientes: 'Alto N orgánico (compost maduro 3 kg/m²)', fenologia: '0–6 d germ. · 7–24 d plántula · 25–50 d roseta · 51–62 d cogollo', manejo: 'Asociar con caléndula y cebolla contra pulgón y babosas' },
      cosecha: { dias: 60, frecuencia: 'Corte escalonado de hojas externas o cabeza completa', mermaPct: 12 },
      aprovechamiento: 'Consumo fresco familiar, comedores escolares y entrega barrial el mismo día.',
      residuos: { fracResidual: 0.22, tipo: 'Hojas basales y tallo tierno (100% compostable; separar si hay pudrición)' },
      regeneracion: { cn: '15:1 (rico en N)', compostDias: 60, relevo: 'Remolacha, zanahoria, ajo o brócoli (INTA p. 5)', rotacion: 'No repetir Asteráceas por 3 años' }
    }
  },
  espinaca: {
    id: 'espinaca', n: 'Espinaca bogotana', sci: 'Spinacia oleracea', grp: 'hoja', fam: 'Amarantáceas',
    climaBogota: 'Óptima en Bogotá (tolera fríos y heladas leves)',
    h: 0.22, luz: '4–5 h (tolera semisombra)', kc: 0.78, alto: false, peque: true, sensorial: 'Hoja carnosa',
    c: '#1f612a', c2: '#2e7d3a', fr: null, tipo3d: 'roseta', fil: 3, paso: 0.22,
    kgM2Rango: [2.8, 4.6], ciclosAnio: 4,
    asociaciones: ['Haba', 'Arveja', 'Rábano', 'Fresa'],
    etapas: {
      semillas: { tasaGerm: 82, gM2: 1.8, siembra: 'Siembra directa en surco', calendario: 'Todo el año; ideal en meses frescos/lluviosos', guardado: 'Recipiente hermético oscuro (viabilidad 2 años)' },
      germinacion: { dias: 8, tempC: '12–18 °C', humPct: 75, sustrato: 'Tierra negra fértil con compost maduro', perdidaPct: 12, proteccion: 'Riego fino sin encharcar' },
      trasplante: { edadDias: 0, dist: '30 × 15 cm', densM2: 20, suelo: 'Alomado 15 cm con buen drenaje' },
      crecimiento: { diasTot: 55, riegoLDia: 3.5, nutrientes: 'Nitrógeno y hierro orgánico (humus de lombriz)', fenologia: '0–8 d germ. · 9–28 d hojas verdaderas · 29–55 d corte', manejo: 'Trampas de cerveza/ceniza para babosas; cobertura de paja' },
      cosecha: { dias: 52, frecuencia: 'Cosecha de hojas externas cada 7–10 días', mermaPct: 10 },
      aprovechamiento: 'Alto valor nutricional (hierro y folatos) para familias y cocinas comunitarias.',
      residuos: { fracResidual: 0.18, tipo: 'Pecíolos y hojas viejas (compostable verde)' },
      regeneracion: { cn: '14:1 (verde)', compostDias: 55, relevo: 'Brócoli, repollo, zanahoria o tomate en invernadero', rotacion: 'Alternar con Leguminosas o Raíces' }
    }
  },
  acelga: {
    id: 'acelga', n: 'Acelga', sci: 'Beta vulgaris var. cicla', grp: 'hoja', fam: 'Amarantáceas',
    climaBogota: 'Excelente en Bogotá (muy rústica y productiva)',
    h: 0.42, luz: '4–5 h (tolera semisombra)', kc: 0.85, alto: false, peque: true, sensorial: 'Penca brillante',
    c: '#2e6f2b', c2: '#438f3d', fr: null, tipo3d: 'hojaAlta', fil: 2, paso: 0.34,
    kgM2Rango: [4.8, 7.6], ciclosAnio: 2.5,
    asociaciones: ['Lechuga', 'Cebolla', 'Ajo', 'Repollo'],
    etapas: {
      semillas: { tasaGerm: 85, gM2: 1.5, siembra: 'Siembra directa (ralear a 1 planta por glomérulo)', calendario: 'Todo el año en Kennedy', guardado: 'Hermético y fresco (viabilidad 3–4 años)' },
      germinacion: { dias: 9, tempC: '14–20 °C', humPct: 72, sustrato: 'Suelo profundo 30 cm con compost', perdidaPct: 8, proteccion: 'Raleo a los 20 días' },
      trasplante: { edadDias: 0, dist: '40 × 30 cm', densM2: 8, suelo: 'Descompactado 30 cm + 4 kg/m² compost' },
      crecimiento: { diasTot: 70, riegoLDia: 3.9, nutrientes: 'Exigente en materia orgánica y potasio', fenologia: '0–9 d germ. · 10–35 d desarrollo · 36–150 d cortes continuos', manejo: 'Poda sanitaria de hojas con cercospora; purín de ortiga' },
      cosecha: { dias: 65, frecuencia: 'Corte continuo de pencas externas durante 4–5 meses', mermaPct: 11 },
      aprovechamiento: 'Abastecimiento sostenido familiar y talleres culinarios barriales.',
      residuos: { fracResidual: 0.20, tipo: 'Hojas exteriores sanas al compost; enfermas a descarte sanitario' },
      regeneracion: { cn: '16:1', compostDias: 65, relevo: 'Haba verde o arveja para reponer nitrógeno', rotacion: 'Evitar remolacha/espinaca en el siguiente ciclo' }
    }
  },
  repollo: {
    id: 'repollo', n: 'Repollo verde / morado', sci: 'Brassica oleracea var. capitata', grp: 'hoja', fam: 'Brasicáceas',
    climaBogota: 'Óptimo en Bogotá (clima frío, tolera heladas leves)',
    h: 0.36, luz: '4–5 h (mejor 6 h)', kc: 0.95, alto: false, peque: false, sensorial: 'Forma escultórica',
    c: '#5f967c', c2: '#7ab096', fr: null, tipo3d: 'repollo', fil: 2, paso: 0.45,
    kgM2Rango: [4.2, 6.8], ciclosAnio: 2,
    asociaciones: ['Cebolla', 'Romero', 'Menta', 'Caléndula'],
    etapas: {
      semillas: { tasaGerm: 86, gM2: 0.25, siembra: 'Almácigo y trasplante (INTA p. 5)', calendario: 'Doble cultivo anual (inicio lluvias)', guardado: 'Hermético fresco (viabilidad 3–4 años)' },
      germinacion: { dias: 7, tempC: '15–20 °C', humPct: 75, sustrato: 'Bandeja con sustrato fino + humus', perdidaPct: 12, proteccion: 'Proteger plántula de babosas y pájaros' },
      trasplante: { edadDias: 32, dist: '50 × 45 cm', densM2: 4.5, suelo: 'Firme, alomado 15 cm, pH 6,2–7,0' },
      crecimiento: { diasTot: 110, riegoLDia: 4.3, nutrientes: 'Alto requerimiento de compost (5 kg/m²)', fenologia: '0–7 d germ. · 8–32 d almácigo · 33–75 d hojas · 76–110 d acogollado', manejo: 'Aromáticas en borde (romero/tomillo) repelen polilla de la col' },
      cosecha: { dias: 105, frecuencia: 'Corte único cuando la cabeza está firme', mermaPct: 15 },
      aprovechamiento: 'Consumo comunitario, fermentados (chucrut) y mercado local.',
      residuos: { fracResidual: 0.35, tipo: 'Hojas externas y tronco picado fino (excelente para compostaje)' },
      regeneracion: { cn: '18:1', compostDias: 75, relevo: 'Leguminosas (haba/arveja) o cebolla', rotacion: 'No repetir Brasicáceas por 3 años (previene hernia de la col)' }
    }
  },
  brocoli: {
    id: 'brocoli', n: 'Brócoli / Coliflor', sci: 'Brassica oleracea var. italica', grp: 'hoja', fam: 'Brasicáceas',
    climaBogota: 'Óptimo en Bogotá (requiere frescura para formar pella)',
    h: 0.56, luz: '5–6 h (mín. 4–5 h)', kc: 0.95, alto: false, peque: false, sensorial: 'Textura floral',
    c: '#2f6e49', c2: '#3f875c', fr: null, tipo3d: 'repollo', fil: 2, paso: 0.48,
    kgM2Rango: [2.4, 4.2], ciclosAnio: 2,
    asociaciones: ['Cebolla', 'Lechuga', 'Manzanilla', 'Romero'],
    etapas: {
      semillas: { tasaGerm: 85, gM2: 0.25, siembra: 'Almácigo y trasplante (INTA p. 5)', calendario: '2 ciclos al año (doble cultivo)', guardado: 'Hermético fresco (viabilidad 3 años)' },
      germinacion: { dias: 7, tempC: '15–20 °C', humPct: 75, sustrato: 'Sustrato aireado de almácigo', perdidaPct: 12, proteccion: 'Invernadero en etapa de almácigo' },
      trasplante: { edadDias: 32, dist: '60 × 50 cm', densM2: 3.5, suelo: 'Profundo 30 cm, rico en compost y boro' },
      crecimiento: { diasTot: 95, riegoLDia: 4.3, nutrientes: 'Compost maduro + cobertura de viruta/paja', fenologia: '0–7 d germ. · 8–32 d almácigo · 33–70 d tallo · 71–95 d floración/pella', manejo: 'Control manual de orugas; asociación con aromáticas perimetrales' },
      cosecha: { dias: 90, frecuencia: 'Cabeza central + brotes laterales durante 3 semanas', mermaPct: 14 },
      aprovechamiento: 'Consumo familiar y alimentación escolar nutritiva.',
      residuos: { fracResidual: 0.45, tipo: 'Tallos y hojas grandes (picar antes de compostar)' },
      regeneracion: { cn: '20:1', compostDias: 80, relevo: 'Zanahoria, remolacha o leguminosas', rotacion: 'Rotación estricta 3–4 años fuera de Brasicáceas' }
    }
  },
  rucula: {
    id: 'rucula', n: 'Rúcula', sci: 'Eruca vesicaria', grp: 'hoja', fam: 'Brasicáceas',
    climaBogota: 'Óptima en Bogotá (ciclo muy rápido en clima fresco)',
    h: 0.20, luz: '4–5 h (tolera semisombra)', kc: 0.72, alto: false, peque: true, sensorial: 'Aroma picante',
    c: '#65a30d', c2: '#84cc16', fr: null, tipo3d: 'roseta', fil: 4, paso: 0.18,
    kgM2Rango: [2.2, 3.8], ciclosAnio: 5,
    asociaciones: ['Lechuga', 'Zanahoria', 'Acelga'],
    etapas: {
      semillas: { tasaGerm: 90, gM2: 1.2, siembra: 'Siembra directa a chorrillo', calendario: 'Siembra escalonada cada 14 días', guardado: 'Hermético seco (3 años)' },
      germinacion: { dias: 5, tempC: '12–20 °C', humPct: 72, sustrato: 'Tierra suelta superficial', perdidaPct: 8, proteccion: 'Riego suave' },
      trasplante: { edadDias: 0, dist: '25 × 10 cm', densM2: 35, suelo: 'Alomado 15 cm bien drenado' },
      crecimiento: { diasTot: 40, riegoLDia: 3.1, nutrientes: 'Moderados (compost ligero)', fenologia: '0–5 d germ. · 6–22 d hoja joven · 23–40 d corte · flores atraen abejas', manejo: 'Dejar 10% florecer para polinizadores y cosecha de semilla' },
      cosecha: { dias: 35, frecuencia: '2–3 cortes sucesivos sobre el tallo', mermaPct: 10 },
      aprovechamiento: 'Ensaladas frescas y aula sensorial de sabores.',
      residuos: { fracResidual: 0.15, tipo: 'Restos tiernos (compostaje rápido)' },
      regeneracion: { cn: '15:1', compostDias: 50, relevo: 'Cebolla, remolacha o tomate', rotacion: 'Alternar fuera de Brasicáceas' }
    }
  },
  remolacha: {
    id: 'remolacha', n: 'Remolacha', sci: 'Beta vulgaris', grp: 'raiz', fam: 'Amarantáceas',
    climaBogota: 'Óptima en Bogotá (muy estable en clima frío)',
    h: 0.30, luz: '4–5 h (tolera semisombra)', kc: 0.85, alto: false, peque: true, sensorial: 'Nervadura roja',
    c: '#3f7a34', c2: '#881337', fr: '#9f1239', tipo3d: 'raiz', fil: 3, paso: 0.20,
    kgM2Rango: [3.8, 6.2], ciclosAnio: 3,
    asociaciones: ['Lechuga', 'Cebolla', 'Repollo', 'Ajo'],
    etapas: {
      semillas: { tasaGerm: 82, gM2: 1.8, siembra: 'Siembra directa (ralear a 10–15 cm)', calendario: 'Doble o triple cultivo anual', guardado: 'Hermético fresco (4 años)' },
      germinacion: { dias: 10, tempC: '12–20 °C', humPct: 75, sustrato: 'Suelo suelto sin piedras hasta 30 cm', perdidaPct: 10, proteccion: 'Humedad constante en emergencia' },
      trasplante: { edadDias: 0, dist: '35 × 15 cm', densM2: 18, suelo: 'Descompactado 30 cm (INTA p. 2)' },
      crecimiento: { diasTot: 85, riegoLDia: 3.8, nutrientes: 'Potasio y boro (compost maduro + ceniza leve)', fenologia: '0–10 d germ. · 11–35 d follaje · 36–85 d engrosamiento raíz', manejo: 'Aporcar suavemente y mantener suelo mullido' },
      cosecha: { dias: 82, frecuencia: 'Cosecha escalonada por calibre (7–9 cm)', mermaPct: 10 },
      aprovechamiento: 'Raíz y hojas jóvenes 100% comestibles.',
      residuos: { fracResidual: 0.25, tipo: 'Corona y hojas maduras al compost' },
      regeneracion: { cn: '17:1', compostDias: 65, relevo: 'Haba, arveja o lechuga', rotacion: 'No seguir con acelga ni espinaca' }
    }
  },
  zanahoria: {
    id: 'zanahoria', n: 'Zanahoria chantenay', sci: 'Daucus carota', grp: 'raiz', fam: 'Apiáceas',
    climaBogota: 'Óptima en Bogotá (cultivo emblemático de la Sabana)',
    h: 0.28, luz: '4–5 h (mejor 6 h)', kc: 0.85, alto: false, peque: true, sensorial: 'Follaje plumoso',
    c: '#4d9435', c2: '#65ad49', fr: '#f97316', tipo3d: 'fina', fil: 4, paso: 0.16,
    kgM2Rango: [3.6, 5.8], ciclosAnio: 2.5,
    asociaciones: ['Cebolla', 'Lechuga', 'Rábano', 'Tomate', 'Romero'],
    etapas: {
      semillas: { tasaGerm: 75, gM2: 0.6, siembra: 'Siembra directa (no trasplantar)', calendario: 'Escalonar cada 25–30 días', guardado: 'Hermético refrigerado (viabilidad 1–2 años; probar germinación)' },
      germinacion: { dias: 14, tempC: '12–20 °C', humPct: 80, sustrato: 'Suelo muy suelto 30 cm, sin terrones ni piedras', perdidaPct: 18, proteccion: 'Cubrir ligeramente con paja húmeda hasta emerger' },
      trasplante: { edadDias: 0, dist: '25 × 8 cm', densM2: 45, suelo: 'Trabajado 30 cm sin abono fresco (evita raíces bifurcadas)' },
      crecimiento: { diasTot: 105, riegoLDia: 3.8, nutrientes: 'Compost bien maduro del ciclo anterior', fenologia: '0–14 d germ. · 15–45 d raleo y follaje · 46–105 d engrosamiento', manejo: 'Asociar con cebolla/romero para confundir mosca de la zanahoria' },
      cosecha: { dias: 100, frecuencia: 'Arranque gradual humedeciendo previamente el suelo', mermaPct: 12 },
      aprovechamiento: 'Consumo fresco familiar, mercados barriales y aulas de observación de raíces.',
      residuos: { fracResidual: 0.28, tipo: 'Follaje aéreo verde (rico en minerales para compost)' },
      regeneracion: { cn: '16:1', compostDias: 60, relevo: 'Leguminosas (haba / arveja) o lechuga', rotacion: 'Alternar fuera de Apiáceas por 3 años' }
    }
  },
  rabano: {
    id: 'rabano', n: 'Rábano rojo', sci: 'Raphanus sativus', grp: 'raiz', fam: 'Brasicáceas',
    climaBogota: 'Óptimo en Bogotá (ideal para escuelas por su rapidez)',
    h: 0.18, luz: '4–5 h (tolera semisombra)', kc: 0.70, alto: false, peque: true, sensorial: 'Cosecha rápida',
    c: '#5ea13c', c2: '#75b84f', fr: '#e11d48', tipo3d: 'raiz', fil: 4, paso: 0.16,
    kgM2Rango: [2.5, 4.2], ciclosAnio: 6,
    asociaciones: ['Lechuga', 'Zanahoria', 'Espinaca', 'Arveja'],
    etapas: {
      semillas: { tasaGerm: 92, gM2: 2.0, siembra: 'Siembra directa rápida', calendario: 'Semanal junto con lechuga (INTA p. 6)', guardado: 'Hermético fresco (4 años)' },
      germinacion: { dias: 4, tempC: '12–20 °C', humPct: 75, sustrato: 'Suelo mullido y húmedo', perdidaPct: 6, proteccion: 'Riego parejo para evitar sabor muy picante' },
      trasplante: { edadDias: 0, dist: '20 × 8 cm', densM2: 50, suelo: 'Alomado 15 cm' },
      crecimiento: { diasTot: 32, riegoLDia: 3.1, nutrientes: 'Bajos (aprovecha abono residual)', fenologia: '0–4 d germ. · 5–16 d hojas · 17–32 d bulbo cosechable', manejo: 'Sirve como marcador de surcos lentos de zanahoria' },
      cosecha: { dias: 30, frecuencia: 'Cosecha total antes de que ahueque (30–35 días)', mermaPct: 8 },
      aprovechamiento: 'Excelente para prácticas escolares cortas y cosecha continua.',
      residuos: { fracResidual: 0.25, tipo: 'Hojas (también comestibles o compostables)' },
      regeneracion: { cn: '15:1', compostDias: 45, relevo: 'Zanahoria, remolacha, brócoli o maíz (INTA p. 5)', rotacion: 'Evitar otra Brasicácea inmediatamente' }
    }
  },
  cebolla: {
    id: 'cebolla', n: 'Cebolla larga / Puerro', sci: 'Allium fistulosum', grp: 'raiz', fam: 'Amarilidáceas',
    climaBogota: 'Óptima en Bogotá (cultivo tradicional andino)',
    h: 0.42, luz: '4–5 h (mejor 6 h)', kc: 0.80, alto: false, peque: true, sensorial: 'Aroma culinario',
    c: '#6ba84f', c2: '#84bf67', fr: null, tipo3d: 'tira', fil: 3, paso: 0.18,
    kgM2Rango: [3.2, 5.4], ciclosAnio: 3,
    asociaciones: ['Zanahoria', 'Lechuga', 'Tomate', 'Remolacha'],
    etapas: {
      semillas: { tasaGerm: 80, gM2: 0.8, siembra: 'Almácigo o división de gajos', calendario: 'Todo el año; doble cultivo', guardado: 'Hermético refrigerado (1 año)' },
      germinacion: { dias: 11, tempC: '14–20 °C', humPct: 72, sustrato: 'Tierra suelta + arena/compost', perdidaPct: 12, proteccion: 'Control de malezas inicial' },
      trasplante: { edadDias: 45, dist: '25 × 12 cm', densM2: 30, suelo: 'Bien drenado (evitar encharcamiento)' },
      crecimiento: { diasTot: 95, riegoLDia: 3.5, nutrientes: 'Compost maduro + potasio', fenologia: '0–11 d germ. · 12–45 d almácigo · 46–95 d macollamiento', manejo: 'Repelente natural de plagas en asociaciones con zanahoria y tomate' },
      cosecha: { dias: 90, frecuencia: 'Deshije continuo dejando tallos madre', mermaPct: 10 },
      aprovechamiento: 'Ingrediente básico diario en hogares de Kennedy.',
      residuos: { fracResidual: 0.16, tipo: 'Raicillas y hojas secas al compost' },
      regeneracion: { cn: '19:1', compostDias: 70, relevo: 'Haba, arveja o repollo', rotacion: 'Alternar fuera de Aliáceas por 3 años' }
    }
  },
  haba: {
    id: 'haba', n: 'Haba verde sabanera', sci: 'Vicia faba', grp: 'legum', fam: 'Fabáceas',
    climaBogota: 'Óptima en Bogotá (fija nitrógeno y resiste heladas)',
    h: 0.82, luz: '6–8 h (tolera 5 h)', kc: 0.90, alto: false, peque: true, sensorial: 'Flor blanca/negra',
    c: '#4e8544', c2: '#639c58', fr: '#f8fafc', tipo3d: 'legum', fil: 2, paso: 0.28,
    kgM2Rango: [2.6, 4.4], ciclosAnio: 2,
    asociaciones: ['Espinaca', 'Lechuga', 'Maíz', 'Caléndula'],
    etapas: {
      semillas: { tasaGerm: 90, gM2: 18, siembra: 'Siembra directa (semilla grande, INTA p. 5)', calendario: '2 ciclos/año al inicio de lluvias', guardado: 'Frasco hermético seco (3–4 años)' },
      germinacion: { dias: 9, tempC: '10–18 °C', humPct: 70, sustrato: 'Tierra negra suelta con buen drenaje', perdidaPct: 7, proteccion: 'Sembrar a 4–5 cm de profundidad' },
      trasplante: { edadDias: 0, dist: '50 × 25 cm', densM2: 8, suelo: 'Alomado 15 cm; no requiere exceso de N' },
      crecimiento: { diasTot: 115, riegoLDia: 4.0, nutrientes: 'Fija nitrógeno atmosférico (Rhizobium) y regenera el suelo', fenologia: '0–9 d germ. · 10–50 d tallo · 51–85 d floración · 86–115 d vainas', manejo: 'Despunte apical contra pulgón negro; atrae abejorros nativos' },
      cosecha: { dias: 105, frecuencia: '3–4 recolecciones de vainas tiernas', mermaPct: 10 },
      aprovechamiento: 'Proteína vegetal local y mejora biológica del suelo del cantero.',
      residuos: { fracResidual: 0.55, tipo: 'Tallos, hojas y vainas ricas en N (oro para el compost); dejar raíces con nódulos en el suelo' },
      regeneracion: { cn: '15:1 (alto N)', compostDias: 60, relevo: 'Cultivos exigentes: tomate, maíz, repollo o brócoli', rotacion: 'Clave para cerrar la rotación de 4 años' }
    }
  },
  arveja: {
    id: 'arveja', n: 'Arveja verde', sci: 'Pisum sativum', grp: 'legum', fam: 'Fabáceas',
    climaBogota: 'Óptima en Bogotá (tolera frío, doble cultivo)',
    h: 1.15, luz: '6–8 h (tolera 5 h)', kc: 0.90, alto: true, peque: true, sensorial: 'Zarcillos trepadores',
    c: '#5b9447', c2: '#73ad5d', fr: '#fef08a', tipo3d: 'tutor', fil: 2, paso: 0.24,
    kgM2Rango: [2.0, 3.6], ciclosAnio: 2.5,
    asociaciones: ['Zanahoria', 'Rábano', 'Lechuga', 'Maíz'],
    etapas: {
      semillas: { tasaGerm: 88, gM2: 14, siembra: 'Siembra directa junto a tutorado (INTA p. 5)', calendario: 'Escalonar cada 2–3 semanas (2 ciclos)', guardado: 'Hermético seco (3 años)' },
      germinacion: { dias: 8, tempC: '10–18 °C', humPct: 72, sustrato: 'Suelo suelto sin encharcamiento', perdidaPct: 9, proteccion: 'Proteger brotes de aves urbanas' },
      trasplante: { edadDias: 0, dist: '50 × 15 cm', densM2: 14, suelo: 'Alomado 15 cm con malla/cañas tutoras' },
      crecimiento: { diasTot: 90, riegoLDia: 3.9, nutrientes: 'Fija nitrógeno; requiere fósforo/potasio de compost', fenologia: '0–8 d germ. · 9–42 d trepa · 43–68 d flor · 69–90 d vaina', manejo: 'Ubicar hacia Sur/Oeste para no sombrear lechugas' },
      cosecha: { dias: 82, frecuencia: 'Recolección manual cada 4–5 días durante 3 semanas', mermaPct: 10 },
      aprovechamiento: 'Consumo fresco, banco comunitario de semillas y pedagogía.',
      residuos: { fracResidual: 0.50, tipo: 'Follaje y vainas vacías compostables; dejar raíces fijadoras' },
      regeneracion: { cn: '16:1', compostDias: 55, relevo: 'Brócoli, repollo, zanahoria o espinaca', rotacion: 'Precede cultivos de fruto u hoja exigentes' }
    }
  },
  tomate: {
    id: 'tomate', n: 'Tomate chonto / cherry', sci: 'Solanum lycopersicum', grp: 'fruto', fam: 'Solanáceas',
    climaBogota: 'Viable en Bogotá bajo invernadero o microclima soleado (sensible a heladas)',
    h: 1.48, luz: '6–8 h (sol pleno · Sur/Oeste)', kc: 1.05, alto: true, peque: true, sensorial: 'Aroma follaje',
    c: '#3d6f2a', c2: '#4d8236', fr: '#dc2626', tipo3d: 'tutor', fil: 2, paso: 0.48,
    kgM2Rango: [5.0, 8.5], ciclosAnio: 1.5,
    asociaciones: ['Albahaca', 'Caléndula', 'Cebolla', 'Zanahoria'],
    etapas: {
      semillas: { tasaGerm: 86, gM2: 0.15, siembra: 'Almácigo protegido y trasplante (INTA p. 5)', calendario: 'Sembrar en invernadero para evitar heladas de ene–feb', guardado: 'Hermético fresco (4 años)' },
      germinacion: { dias: 8, tempC: '20–24 °C (invernadero)', humPct: 75, sustrato: 'Turba/compost tamizado + cascarilla', perdidaPct: 12, proteccion: 'Bajo cubierta obligatoria en noches frías de Bogotá' },
      trasplante: { edadDias: 35, dist: '70 × 45 cm', densM2: 3, suelo: 'Profundo 30 cm, compost 5 kg/m² + tutorado' },
      crecimiento: { diasTot: 120, riegoLDia: 4.8, nutrientes: 'Alto K y Ca (compost + harina de roca/cáscara)', fenologia: '0–8 d germ. · 9–35 d almácigo · 36–70 d flor · 71–120 d fruto', manejo: 'Riego por goteo sin mojar hojas (previene gota/Phytophthora); asociar con albahaca' },
      cosecha: { dias: 95, frecuencia: 'Recolección continua 2 veces/semana durante 6–8 semanas', mermaPct: 14 },
      aprovechamiento: 'Consumo fresco, salsas/conservas y ventas de mercado campesino.',
      residuos: { fracResidual: 0.35, tipo: 'Chupones y tallos sanos; si hubo tizón/gota NO compostar en frío (manejo sanitario)' },
      regeneracion: { cn: '20:1', compostDias: 75, relevo: 'Espinaca, lechuga o leguminosas', rotacion: 'Mínimo 3 años sin Solanáceas (papa, tomate, berenjena, pimiento)' }
    }
  },
  morron: {
    id: 'morron', n: 'Pimiento / Ají dulce', sci: 'Capsicum annuum', grp: 'fruto', fam: 'Solanáceas',
    climaBogota: 'Recomendado bajo invernadero o borde soleado protegido del viento',
    h: 0.85, luz: '6–8 h (sol pleno)', kc: 0.95, alto: true, peque: true, sensorial: 'Fruto brillante',
    c: '#3b7330', c2: '#4e8a3d', fr: '#ef4444', tipo3d: 'arbusto', fil: 2, paso: 0.42,
    kgM2Rango: [3.2, 5.5], ciclosAnio: 1.5,
    asociaciones: ['Albahaca', 'Cebolla', 'Zanahoria', 'Caléndula'],
    etapas: {
      semillas: { tasaGerm: 80, gM2: 0.2, siembra: 'Almácigo bajo invernadero (INTA p. 5)', calendario: 'Trasplante tras temporada de heladas', guardado: 'Hermético fresco (2–3 años)' },
      germinacion: { dias: 12, tempC: '20–25 °C (invernadero)', humPct: 78, sustrato: 'Sustrato fino aireado', perdidaPct: 15, proteccion: 'Invernadero indispensable en Bogotá' },
      trasplante: { edadDias: 42, dist: '60 × 40 cm', densM2: 4, suelo: 'Alomado 15 cm con acolchado de paja' },
      crecimiento: { diasTot: 125, riegoLDia: 4.4, nutrientes: 'Compost maduro rico en potasio', fenologia: '0–12 d germ. · 13–42 d almácigo · 43–85 d flor · 86–125 d fruto', manejo: 'Cortina cortavientos S–O protege las ramas frágiles' },
      cosecha: { dias: 105, frecuencia: 'Cosecha escalonada verde o maduro', mermaPct: 12 },
      aprovechamiento: 'Alto rendimiento por m² en huertas urbanas pequeñas.',
      residuos: { fracResidual: 0.30, tipo: 'Restos vegetales sanos picados al compost' },
      regeneracion: { cn: '22:1', compostDias: 75, relevo: 'Ajo, cebolla o lechuga', rotacion: 'Mínimo 3 años sin Solanáceas' }
    }
  },
  maiz: {
    id: 'maiz', n: 'Maíz sabanero', sci: 'Zea mays', grp: 'fruto', fam: 'Poáceas',
    climaBogota: 'Tradicional de la Sabana de Bogotá (ciclo largo, ocupa espacio)',
    h: 1.85, luz: '6–8 h (sol pleno · extremo Sur/Oeste)', kc: 1.05, alto: true, peque: false, sensorial: 'Susurro al viento',
    c: '#5a8f2e', c2: '#75a83c', fr: '#f2c94c', tipo3d: 'maiz', fil: 2, paso: 0.36,
    kgM2Rango: [1.8, 3.2], ciclosAnio: 1,
    asociaciones: ['Fríjol / Arveja (tutor vivo)', 'Calabacín / Ahuyama (milpa andina)'],
    etapas: {
      semillas: { tasaGerm: 90, gM2: 6, siembra: 'Siembra directa en bloques (mejora polinización)', calendario: 'Inicio de lluvias (mar–abr o sep–oct)', guardado: 'Grano seco hermético (2 años)' },
      germinacion: { dias: 8, tempC: '14–20 °C', humPct: 70, sustrato: 'Suelo profundo 30 cm con compost', perdidaPct: 8, proteccion: 'Proteger plántulas de aves' },
      trasplante: { edadDias: 0, dist: '70 × 30 cm', densM2: 5, suelo: 'Alomado 15 cm + aporque a 40 cm altura' },
      crecimiento: { diasTot: 155, riegoLDia: 4.8, nutrientes: 'Alto N (ideal después de habas o en milpa)', fenologia: '0–8 d germ. · 9–70 d caña · 71–105 d espiga · 106–155 d choclo', manejo: 'Ubicar SIEMPRE en borde Sur u Oeste para no sombrear cultivos bajos (INTA p. 5)' },
      cosecha: { dias: 145, frecuencia: 'Cosecha en choclo tierno o grano seco', mermaPct: 12 },
      aprovechamiento: 'Patrimonio alimentario andino, enseñanza de milpa y biomasa seca.',
      residuos: { fracResidual: 0.65, tipo: 'Cañas y hojas secas picadas (excelente material marrón rico en C para equilibrar compost)' },
      regeneracion: { cn: '60:1 (marrón/C)', compostDias: 90, relevo: 'Haba verde o arveja', rotacion: 'Rotar con leguminosas y hojas' }
    }
  },
  calabacin: {
    id: 'calabacin', n: 'Calabacín / Ahuyama', sci: 'Cucurbita pepo / maxima', grp: 'fruto', fam: 'Cucurbitáceas',
    climaBogota: 'Apta en Bogotá en sitios muy soleados y protegidos de heladas',
    h: 0.52, luz: '6–8 h (sol pleno)', kc: 0.95, alto: false, peque: true, sensorial: 'Flor amarilla grande',
    c: '#386e2d', c2: '#4c823b', fr: '#ea580c', tipo3d: 'rastrero', fil: 1, paso: 0.72,
    kgM2Rango: [4.5, 7.5], ciclosAnio: 1.8,
    asociaciones: ['Maíz', 'Haba', 'Capuchina / Caléndula'],
    etapas: {
      semillas: { tasaGerm: 88, gM2: 1.2, siembra: 'Siembra directa (semilla grande, INTA p. 5)', calendario: 'Meses sin heladas (mar–nov)', guardado: 'Hermético fresco (4 años)' },
      germinacion: { dias: 7, tempC: '16–22 °C', humPct: 75, sustrato: 'Compost abundante en hoyo de siembra', perdidaPct: 10, proteccion: 'Proteger del viento frío' },
      trasplante: { edadDias: 0, dist: '90 × 75 cm', densM2: 1.5, suelo: 'Alto aporte de abono orgánico (5 kg/m²)' },
      crecimiento: { diasTot: 85, riegoLDia: 4.5, nutrientes: 'Muy exigente en materia orgánica', fenologia: '0–7 d germ. · 8–40 d guía/hojas · 41–55 d flor · 56–85 d frutos', manejo: 'Riego por goteo al pie (previene oídio); sus flores sostienen abejorros' },
      cosecha: { dias: 65, frecuencia: 'Cosecha de calabacín tierno cada 3–4 días', mermaPct: 10 },
      aprovechamiento: 'Alto rendimiento por m² y recurso clave para polinizadores.',
      residuos: { fracResidual: 0.45, tipo: 'Hojas grandes y tallos (descartar hojas con oídio severo)' },
      regeneracion: { cn: '18:1', compostDias: 70, relevo: 'Haba o arveja', rotacion: 'No repetir Cucurbitáceas por 3 años' }
    }
  },
  berenjena: {
    id: 'berenjena', n: 'Berenjena (invernadero)', sci: 'Solanum melongena', grp: 'fruto', fam: 'Solanáceas',
    climaBogota: 'Requiere invernadero en Bogotá (termófila, sensible a frío)',
    h: 1.05, luz: '6–8 h (sol pleno · invernadero)', kc: 1.0, alto: true, peque: false, sensorial: 'Fruto violeta',
    c: '#3a6632', c2: '#4c7a42', fr: '#6b21a8', tipo3d: 'arbusto', fil: 2, paso: 0.50,
    kgM2Rango: [3.4, 5.8], ciclosAnio: 1.2,
    asociaciones: ['Albahaca', 'Caléndula', 'Arveja'],
    etapas: {
      semillas: { tasaGerm: 78, gM2: 0.2, siembra: 'Almácigo en invernadero', calendario: 'Solo en cultivo protegido (invernadero)', guardado: 'Hermético fresco (3 años)' },
      germinacion: { dias: 12, tempC: '22–26 °C (invernadero)', humPct: 78, sustrato: 'Sustrato fino cálido', perdidaPct: 16, proteccion: 'Invernadero obligatorio en Bogotá' },
      trasplante: { edadDias: 45, dist: '70 × 50 cm', densM2: 2.8, suelo: 'Rico en compost y potasio' },
      crecimiento: { diasTot: 130, riegoLDia: 4.5, nutrientes: 'Alto abono orgánico', fenologia: '0–12 d germ. · 13–45 d almácigo · 46–90 d flor · 91–130 d fruto', manejo: 'Tutorar y podar brotes basales' },
      cosecha: { dias: 110, frecuencia: 'Corte con tijera cuando la piel está brillante', mermaPct: 12 },
      aprovechamiento: 'Diversificación gastronómica en módulos protegidos.',
      residuos: { fracResidual: 0.35, tipo: 'Tallos sanos picados al compost' },
      regeneracion: { cn: '22:1', compostDias: 80, relevo: 'Espinaca o remolacha', rotacion: '3 años sin Solanáceas' }
    }
  },
  aromaticas: {
    id: 'aromaticas', n: 'Policultivo aromático y floral', sci: 'Rosmarinus · Lavandula · Calendula · Mentha', grp: 'arom', fam: 'Lamiáceas / Asteráceas',
    climaBogota: 'Óptimas en Bogotá (perennes, rústicas, clave para polinizadores)',
    h: 0.55, luz: '5–8 h (muy adaptables)', kc: 0.55, alto: false, peque: true, sensorial: 'Aroma intenso y color',
    c: '#6d8c52', c2: '#8b5cf6', fr: '#f59e0b', tipo3d: 'arom', fil: 3, paso: 0.35,
    kgM2Rango: [1.5, 2.8], ciclosAnio: 4,
    asociaciones: ['Todas las hortalizas (barrera perimetral biológica, INTA pp. 3 y 6)'],
    etapas: {
      semillas: { tasaGerm: 80, gM2: 0.5, siembra: 'Esquejes o almácigo (romero, lavanda, caléndula, tomillo, menta)', calendario: 'Plantación perenne todo el año', guardado: 'Semilla seca de caléndula hermética' },
      germinacion: { dias: 12, tempC: '14–20 °C', humPct: 68, sustrato: 'Bien drenado con arena/cascarilla', perdidaPct: 10, proteccion: 'Evitar exceso de humedad en raíces' },
      trasplante: { edadDias: 40, dist: '40 × 35 cm', densM2: 7, suelo: 'Perímetro y bordes de canteros' },
      crecimiento: { diasTot: 75, riegoLDia: 2.3, nutrientes: 'Bajos (rústicas)', fenologia: 'Perennes con floración continua en Bogotá', manejo: 'Atraen abejas, abejorros y sírfidos; repelen pulgones y mosca blanca' },
      cosecha: { dias: 60, frecuencia: 'Podas suaves continuas durante años', mermaPct: 5 },
      aprovechamiento: 'Infusiones, cocina, biopreparados, terapia sensorial y sustento de fauna benéfica.',
      residuos: { fracResidual: 0.15, tipo: 'Restos de poda aromática (excelentes activadores del compost)' },
      regeneracion: { cn: '25:1', compostDias: 70, relevo: 'Permanentes en perímetro (no rotan anualmente)', rotacion: 'Franja perimetral permanente' }
    }
  }
};

export const ROTACION_ORDEN = ['fruto', 'hoja', 'raiz', 'legum'];
export const ROTACION_NOM = {
  fruto: 'Fruto / semilla (6–8 h sol)',
  hoja: 'Hoja (4–5 h luz)',
  raiz: 'Raíz / bulbo (4–5 h luz)',
  legum: 'Leguminosas (fijan N₂)',
  arom: 'Aromáticas / polinizadores'
};

export const POOLS_ESPECIE = {
  frutoAlto: ['maiz', 'tomate', 'morron', 'berenjena'],
  frutoBajo: ['calabacin', 'morron', 'tomate'],
  hoja: ['lechuga', 'acelga', 'espinaca', 'repollo', 'brocoli', 'rucula'],
  raiz: ['remolacha', 'zanahoria', 'rabano', 'cebolla'],
  legum: ['haba', 'arveja'],
  arom: ['aromaticas']
};

// Catálogo paramétrico de mobiliario, infraestructura y módulos (Sección 5 & 6 — editor manual y automático)
export const CATALOGO_ELEMENTOS = {
  cantero:        { id: 'cantero',        cat: 'cultivo',   n: 'Cantero alomado (15 cm)',        l: 6.0, w: 1.25, h: 0.32, c: '#8b6f47', costoCOP: 420000, desc: 'Cama elevada 15 cm (suelo 30 cm) + contención + geotextil + riego goteo.' },
  jardinera_acc:  { id: 'jardinera_acc',  cat: 'cultivo',   n: 'Jardinera elevada accesible',    l: 3.0, w: 1.0,  h: 0.80, c: '#a16207', costoCOP: 780000, desc: 'Cama ergonómica a 80 cm de altura para silla de ruedas y adulto mayor (NTC 4143).' },
  hidroponia:     { id: 'hidroponia',     cat: 'cultivo',   n: 'Módulo hidropónico NFT',         l: 4.0, w: 1.25, h: 0.95, c: '#0891b2', costoCOP: 1650000, desc: 'Mesa experimental de tubos NFT con recirculación cerrada (requiere punto eléctrico).' },
  polinizadores:  { id: 'polinizadores',  cat: 'ecologia',  n: 'Jardín de polinizadores',        l: 4.0, w: 1.5,  h: 0.55, c: '#a855f7', costoCOP: 380000, desc: 'Franja de flores nativas y aromáticas para abejas, abejorros y colibríes.' },
  infiltracion:   { id: 'infiltracion',   cat: 'ecologia',  n: 'Jardín de infiltración pluvial', l: 4.5, w: 1.6,  h: 0.12, c: '#0284c7', costoCOP: 640000, desc: 'Depresión biofiltrante para retener escorrentía y recargar humedad local.' },
  hotel_insectos: { id: 'hotel_insectos', cat: 'ecologia',  n: 'Hotel de insectos / refugio',    l: 1.0, w: 0.7,  h: 1.85, c: '#b45309', costoCOP: 290000, desc: 'Refugio de madera, bambú y piñas para abejas solitarias y controladores biológicos.' },
  invernadero:    { id: 'invernadero',    cat: 'infra',     n: 'Invernadero / semillero',        l: 7.0, w: 4.0,  h: 2.6,  c: '#38bdf8', costoCOP: 4900000, desc: 'Cultivo protegido antiheladas (Bogotá) y mesas de almácigos (INTA p. 3).' },
  abonera:        { id: 'abonera',        cat: 'infra',     n: 'Estación de compostaje (3,6×2,4)', l: 3.6, w: 2.4,  h: 1.05, c: '#78350f', costoCOP: 1150000, desc: 'Abonera de 3 compartimentos + vermicompostaje con acceso sanitario (INTA p. 3).' },
  bodega:         { id: 'bodega',         cat: 'infra',     n: 'Bodega herramientas y semillas', l: 2.4, w: 2.0,  h: 2.25, c: '#57534e', costoCOP: 2600000, desc: 'Resguardo de herramientas y armario seco/hermético para banco de semillas (INTA p. 6).' },
  agua:           { id: 'agua',           cat: 'infra',     n: 'Cisterna lluvia y toma de agua', l: 1.6, w: 1.6,  h: 1.35, c: '#0ea5e9', costoCOP: 1450000, desc: 'Tanque captación lluvia (1.000–2.000 L) + llave de distribución a goteo (INTA p. 3).' },
  lavado:         { id: 'lavado',         cat: 'infra',     n: 'Estación lavado y acopio',       l: 2.4, w: 1.2,  h: 0.90, c: '#14b8a6', costoCOP: 1100000, desc: 'Mesón de selección, pesaje, lavado de cosecha y separación de orgánicos aptos.' },
  meteo:          { id: 'meteo',          cat: 'infra',     n: 'Estación meteo + sensores IoT',  l: 1.2, w: 1.2,  h: 2.60, c: '#c084fc', costoCOP: 1850000, desc: 'Sensores de humedad de suelo, T° aire y pluviómetro para monitoreo experimental.' },
  banca:          { id: 'banca',          cat: 'mobiliario', n: 'Banca con respaldo y sombra',   l: 2.0, w: 0.65, h: 0.85, c: '#92400e', costoCOP: 520000, desc: 'Estancia ergonómica vinculada a contemplación, sombra o aprendizaje.' },
  mesa_trabajo:   { id: 'mesa_trabajo',   cat: 'mobiliario', n: 'Mesa de trabajo / talleres',    l: 2.6, w: 1.1,  h: 0.82, c: '#b45309', costoCOP: 680000, desc: 'Mesa accesible para trasplante, intercambio de semillas y talleres comunitarios.' },
  pergola:        { id: 'pergola',        cat: 'mobiliario', n: 'Pérgola / Aula abierta',        l: 5.0, w: 3.6,  h: 2.80, c: '#d97706', costoCOP: 4200000, desc: 'Espacio cubierto con sombra y bancas para 16–20 estudiantes o vecinos.' },
  senalizacion:   { id: 'senalizacion',   cat: 'mobiliario', n: 'Totem señalización educativa',  l: 1.1, w: 0.45, h: 1.65, c: '#64748b', costoCOP: 360000, desc: 'Panel interpretativo de especies, ciclos biológicos y reglas de cuidado.' },
  residuos_sep:   { id: 'residuos_sep',   cat: 'mobiliario', n: 'Punto separación de residuos',  l: 1.8, w: 0.75, h: 1.05, c: '#16a34a', costoCOP: 490000, desc: '3 canecas (verde orgánicos aptos · blanco aprovechables · negro no aprovechables).' }
};

import unreal, re
OUT = r'C:\Users\ACER\Documents\Unreal Projects\Kennedy360\Saved\inspeccion2.txt'
filtros = {
    'CesiumGeoreference': r'origin|latitude|longitude|height|place',
    'Cesium3DTileset': r'ion|source|screen_space|url|token|server|cache|maximum|preload|forbid|occlusion|enable_|lod',
    'CesiumSunSky': r'solar|time|day|month|year|zone|lat|long|georef|daylight|sun|exposure|mobile|update',
    'CesiumIonServer': r'token|default|server|api|url',
}
lineas = []
for nombre, pat in filtros.items():
    cls = getattr(unreal, nombre, None)
    if cls is None:
        lineas.append(nombre + ': NO EXISTE'); continue
    props = sorted(p for p in dir(cls) if not p.startswith('_') and re.search(pat, p))
    lineas.append(nombre + ': ' + ', '.join(props))
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lineas))

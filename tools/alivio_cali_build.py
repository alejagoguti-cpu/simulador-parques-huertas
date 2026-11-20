"""Av. Ciudad de Cali (Avenida Carrera 86, OSM) entre el Humedal El Burro y Corabastos -> data3d/alivio_cali.json
Uso: python tools/alivio_cali_build.py  (usa tools/cache/kennedy_osm.json)
Es la vía por la que hoy se llega a Corabastos desde el norte y pasa junto al humedal: con la propuesta (abastecimiento en
Bavaria Común y mercados de barrio) baja su tráfico. Marco del mundo 3D (x+OX, z+OZ), como colegios.json."""
import json, math, os
from shapely.geometry import LineString
from shapely.ops import linemerge

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LAT0, LON0 = 4.640683, -74.149778
MX = 111320 * math.cos(math.radians(4.63)); MY = 110540.0
OX, OZ = 2095.67, -109.06
def xy(lon, lat): return ((lon - LON0) * MX + OX, -(lat - LAT0) * MY + OZ)

OSM = json.load(open(os.path.join(RAIZ, 'tools', 'cache', 'kennedy_osm.json'), encoding='utf-8'))['elements']
Z0, Z1 = -900, 1350  # del norte del humedal El Burro hasta el costado de Corabastos
L = []
for e in OSM:
    t = e.get('tags', {})
    if t.get('name') != 'Avenida Carrera 86' or 'geometry' not in e or t.get('highway') not in ('primary', 'trunk', 'secondary'): continue
    P = [xy(g['lon'], g['lat']) for g in e['geometry']]
    P = [p for p in P if Z0 <= p[1] <= Z1]
    if len(P) >= 2: L.append(LineString(P))
m = linemerge(L)
geoms = [m] if m.geom_type == 'LineString' else list(m.geoms)
geoms = [g.simplify(2) for g in geoms if g.length > 60]
out = {'n': 'Av. Ciudad de Cali (Av. Carrera 86)', 'fuente': 'OpenStreetMap, © colaboradores de OpenStreetMap, ODbL',
       'lineas': [[[round(x, 1), round(z, 1)] for x, z in g.coords] for g in geoms],
       'largo_m': round(sum(g.length for g in geoms) / 2)}  # dos calzadas
json.dump(out, open(os.path.join(RAIZ, 'data3d', 'alivio_cali.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('lineas', len(geoms), 'largo por calzada ~', out['largo_m'], 'm')

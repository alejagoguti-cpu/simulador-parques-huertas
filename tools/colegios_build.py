"""Colegios de Kennedy (OpenStreetMap, amenity=school) -> data3d/colegios.json
Uso: python tools/kennedy_osm.py (una vez, baja tools/cache/kennedy_osm.json) y luego python tools/colegios_build.py
- Solo los que quedan dentro del límite de la localidad.
- Coordenadas en el marco del mundo 3D (mismo que giro_sim: x+OX, z+OZ).
- Si el colegio está dibujado como predio se guarda el contorno; si es solo un punto, solo el centro.
- Se quitan los puntos repetidos (un nodo dentro del predio del mismo colegio)."""
import json, math, os
from shapely.geometry import Polygon, Point

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LAT0, LON0 = 4.640683, -74.149778
MX = 111320 * math.cos(math.radians(4.63)); MY = 110540.0
OX, OZ = 2095.67, -109.06
def xy(lon, lat): return ((lon - LON0) * MX + OX, -(lat - LAT0) * MY + OZ)

OSM = json.load(open(os.path.join(RAIZ, 'tools', 'cache', 'kennedy_osm.json'), encoding='utf-8'))['elements']
K = json.load(open(os.path.join(RAIZ, 'data3d', 'kennedy.json'), encoding='utf-8'))
LIM = Polygon([xy(*p) for p in K['limite']])
predios, puntos = [], []
for el in OSM:
    t = el.get('tags', {})
    if t.get('amenity') != 'school': continue
    n = (t.get('name') or '').strip() or 'Colegio'
    if el['type'] == 'way' and 'geometry' in el:
        P = [xy(g['lon'], g['lat']) for g in el['geometry']]
        if len(P) < 4: continue
        pg = Polygon(P).buffer(0)
        if pg.is_empty or not LIM.contains(pg.centroid): continue
        predios.append({'n': n, 'pg': pg})
    elif el['type'] == 'node':
        p = Point(xy(el['lon'], el['lat']))
        if LIM.contains(p): puntos.append({'n': n, 'p': p})
out = []
for c in predios:
    ext = c['pg'] if c['pg'].geom_type == 'Polygon' else max(c['pg'].geoms, key=lambda g: g.area)
    ce = ext.representative_point()
    out.append({'n': c['n'], 'c': [round(ce.x, 1), round(ce.y, 1)], 'a': round(ext.area), 'poly': [[round(x, 1), round(y, 1)] for x, y in ext.exterior.coords[:-1]]})
for c in puntos:
    if any(q['pg'].buffer(25).contains(c['p']) for q in predios): continue
    if any(math.dist((c['p'].x, c['p'].y), o['c']) < 40 for o in out): continue
    out.append({'n': c['n'], 'c': [round(c['p'].x, 1), round(c['p'].y, 1)], 'a': 0, 'poly': None})
# ---- solo los colegios que tienen edificios levantados en el 3D (data3d/edif/*.bin, marco del modelo) ----
import struct
from shapely.prepared import prep
LC = (5341.33, 3161.9)
EI = json.load(open(os.path.join(RAIZ, 'data3d', 'edif', 'index.json'), encoding='utf-8'))
def edificios(f):
    b = open(os.path.join(RAIZ, 'data3d', 'edif', f), 'rb').read()
    if b[:4] != b'REB1': return []
    end = 8 + struct.unpack_from('<I', b, 4)[0]; o = 8; iq = 1 / EI['Q']; L = []
    while o < end:
        n, h, x, y = struct.unpack_from('<HHHH', b, o); o += 8
        P = [(x * iq + EI['X0'], y * iq + EI['Y0'])]
        for i in range(1, n):
            dx, dy = struct.unpack_from('<hh', b, o); o += 4; x += dx; y += dy; P.append((x * iq + EI['X0'], y * iq + EI['Y0']))
        L.append((h / 10, [(X - LC[0], LC[1] - Y) for X, Y in P]))  # al marco del mundo
    return L
ED = [e for c in EI['celdas'] for e in edificios(c['f'])]
print('edificios del modelo', len(ED))
cent = [Polygon(P).centroid if len(P) >= 3 else None for _, P in ED]
from shapely.strtree import STRtree
idx = [i for i, c in enumerate(cent) if c is not None]
arbol = STRtree([cent[i] for i in idx])
con = []
for o in out:
    zona = Polygon(o['poly']).buffer(4) if o['poly'] else Point(o['c']).buffer(12)  # colegio dibujado solo como punto: el edificio que lo contiene
    pz = prep(zona); sel = []
    for k in arbol.query(zona):
        i = idx[int(k)]
        if pz.contains(cent[i]): h, P = ED[i]; sel.append({'h': round(h, 1), 'p': [[round(x, 1), round(z, 1)] for x, z in P]})
    if sel: o['ed'] = sel; con.append(o)
print('colegios con edificio 3D', len(con), 'de', len(out), 'edificios resaltados', sum(len(o['ed']) for o in con))
out = con
out.sort(key=lambda o: o['n'])
json.dump({'fuente': 'OpenStreetMap (amenity=school), © colaboradores de OpenStreetMap, ODbL', 'colegios': out},
          open(os.path.join(RAIZ, 'data3d', 'colegios.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('colegios', len(out), 'con predio', sum(1 for o in out if o['poly']))

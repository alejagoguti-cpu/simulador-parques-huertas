"""Red de colegios de Kennedy («conectografía») -> data3d/colegios_red.json (lo usa data3d/colegios_red.js).

Entrada (todo ya existente en data3d/):
- colegios.json: 74 colegios con edificio 3D (marco mundo).
- parques.json: parques del IDRD (marco «modelo»: mundo = (x - 5341.33, 3161.9 - y)).
- trees.json (marco modelo), canchas.json (marco giro: mundo = (x + 2095.67, z - 109.06)), tintal.json (zona_modelo).
- kennedy.json: límite de la localidad (lon/lat).

Criterios:
1. Enlaces colegio-colegio: árbol de expansión mínima (distancia en línea recta) + el vecino más cercano de cada
   colegio que aún no esté unido; se descarta todo enlace de más de 1,5 km.
2. Parques-huerta: parques del IDRD (no los trazados a mano) de 2 ha o más, dentro de Kennedy. Se escogen de forma
   voraz los que más colegios nuevos cubren a menos de 1,2 km (la Biblioteca El Tintal entra siempre), hasta 7
   parques, y solo si cabe un módulo completo de 48 x 30 m (12 orientaciones, rejilla de 4 m) sin tocar árboles,
   canchas, edificios, agua ni la plaza de la biblioteca, a 6 m o más del borde del parque.
   Cada colegio va al parque-huerta más cercano.
3. Bavaria Común: por distancia (frecuencia de visita):
   - a menos de 2,2 km  -> Campo experimental (salidas semanales a pie o en bici: práctica de cultivo)
   - 2,2 a 4 km         -> Centro de laboratorios NBIC (salidas quincenales: análisis de las muestras de su huerta)
   - más de 4 km        -> Instituto de enseñanza (jornadas mensuales en bus: aula, módulos y datos)
   La entrada es la que minimiza (colegio -> entrada) + (entrada -> edificio).
Uso: python tools/colegios_red_build.py
"""
import json, math, os
from shapely.geometry import Polygon, Point, box
from shapely import affinity
from shapely.strtree import STRtree

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = lambda f: os.path.join(RAIZ, 'data3d', f)
J = lambda f: json.load(open(D(f), encoding='utf-8'))
lw = lambda x, y: (x - 5341.33, 3161.9 - y)
giro = lambda x, z: (x + 2095.67, z - 109.06)
LAT0, LON0 = 4.640683, -74.149778
MX = 111320 * math.cos(math.radians(4.63)); MY = 110540.0
# igual que tools/colegios_build.py: lon/lat -> marco mundo
def xy(lon, lat): return ((lon - LON0) * MX + 2095.67, -(lat - LAT0) * MY - 109.06)

COL = J('colegios.json')['colegios']
LIM = Polygon([xy(*p) for p in J('kennedy.json')['limite']]).buffer(0)
N = len(COL)
P = [tuple(c['c']) for c in COL]
dist = lambda a, b: math.hypot(a[0] - b[0], a[1] - b[1])

# ---------- 1. enlaces colegio-colegio ----------
MAXL = 1500
ed = set()
# Prim
dentro = {0}; mejor = {j: (dist(P[0], P[j]), 0) for j in range(1, N)}
while mejor:
    j = min(mejor, key=lambda k: mejor[k][0]); d, i = mejor.pop(j); dentro.add(j)
    if d <= MAXL: ed.add((min(i, j), max(i, j)))
    for k in mejor:
        dk = dist(P[j], P[k])
        if dk < mejor[k][0]: mejor[k] = (dk, j)
for i in range(N):
    vec = sorted((dist(P[i], P[j]), j) for j in range(N) if j != i)
    for d, j in vec[:2]:
        if d <= MAXL * 0.6: ed.add((min(i, j), max(i, j)))
# sin cruces: si dos enlaces se cruzan, se queda el más corto
def cruza(a, b, c, d):
    o = lambda p, q, r: (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    return (o(a, b, c) * o(a, b, d) < 0) and (o(c, d, a) * o(c, d, b) < 0)
L = sorted(ed, key=lambda e: dist(P[e[0]], P[e[1]]))
ok = []
for e in L:
    if any(len({*e, *f}) == 4 and cruza(P[e[0]], P[e[1]], P[f[0]], P[f[1]]) for f in ok): continue
    ok.append(e)
enlaces = [[i, j, round(dist(P[i], P[j]))] for i, j in ok]

# ---------- 2. parques-huerta ----------
def area(p): return abs(sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))) / 2
cand = []
for p in J('parques.json'):
    if p.get('tipo') == 'Manual' or not p.get('pts') or len(p['pts']) < 4: continue
    if 'Mundo Aventura' in (p.get('nombre') or ''): continue  # parque de diversiones privado, no espacio público
    pg = Polygon([lw(*q) for q in p['pts']]).buffer(0)
    if pg.is_empty or pg.area < 12000 or not LIM.contains(pg.representative_point()): continue
    if pg.geom_type == 'MultiPolygon': pg = max(pg.geoms, key=lambda g: g.area)
    cand.append({'n': p.get('nombre') or 'Parque', 'tipo': p.get('tipo'), 'pg': pg, 'c': (pg.centroid.x, pg.centroid.y)})
print('candidatos', len(cand))
# obstáculos: árboles, canchas, plaza de la biblioteca
TR = J('trees.json')['t']
arb = [Point(*lw(t[0], t[1])).buffer(max(2.5, min(6, t[2] * 0.4 if len(t) > 2 else 3))) for t in TR]
CA = J('canchas.json')['canchas']
can = []
for c in CA:
    x, z = giro(*c['c'])
    r = box(-c['L'] / 2 - 4, -c['W'] / 2 - 4, c['L'] / 2 + 4, c['W'] / 2 + 4)
    can.append(affinity.translate(affinity.rotate(r, c['a'], use_radians=True, origin=(0, 0)), x, z))
TIN = J('tintal.json')
# edificios (OSM, marco modelo) que tocan los parques escogidos: coliseos, salones comunales, baños...
zona = STRtree([c['pg'].buffer(20) for c in cand])
edi = []
for b in J('buildings.json'):
    p = b.get('pts')
    if not p or len(p) < 4: continue
    q = Polygon([lw(*t) for t in p])
    if not q.is_valid: q = q.buffer(0)
    if len(zona.query(q, predicate='intersects')): edi.append(q.buffer(5))
print('edificios en parques', len(edi))
agua = []  # lagos, humedales y canales (Lago Timiza): la huerta va en tierra firme
for w in J('water_bodies.json'):
    if w.get('pts') and len(w['pts']) > 3:
        q = Polygon([lw(*t) for t in w['pts']]).buffer(0)
        if len(zona.query(q, predicate='intersects')): agua.append(q.buffer(10))
print('cuerpos de agua en parques', len(agua))
obst = arb + can + edi + agua + [Polygon([lw(*q) for q in TIN['zona_modelo']]).buffer(8)]
ARBOL = STRtree(obst)

RH = 30  # huerta circular de cubiertas efímeras (como la de la Biblioteca El Tintal): radio de 30 m si cabe, si no más pequeña
NOARB = STRtree(can + edi + agua + [obst[-1]]); obst2 = can + edi + agua + [obst[-1]]
def ubicar(pg):
    cx, cy = pg.centroid.x, pg.centroid.y
    for R, idx, lista in [(30, ARBOL, obst), (24, ARBOL, obst), (19, ARBOL, obst), (15, ARBOL, obst), (22, NOARB, obst2)]:
        seg = pg.buffer(-(4 + R))
        if seg.is_empty: continue
        x0, y0, x1, y1 = seg.bounds; best = None
        y = y0
        while y <= y1:
            x = x0
            while x <= x1:
                p = Point(x, y)
                if seg.contains(p):
                    r = p.buffer(R, 16)
                    if not any(lista[o].intersects(r) for o in idx.query(r)):
                        s = -dist((x, y), (cx, cy))
                        if best is None or s > best[0]: best = (s, x, y)
                x += 4
            y += 4
        if best: return {'c': [round(best[1], 1), round(best[2], 1)], 'r': R}
    return None
COB = 1000
MAXH = N // 4  # máximo una huerta por cada 4 colegios
def cubre(k): return {i for i in range(N) if cand[k]['pg'].distance(Point(P[i])) <= COB}
UB = {}
def cabe(k):
    if k not in UB: UB[k] = ubicar(cand[k]['pg'])
    return UB[k] is not None
# la Biblioteca El Tintal ya tiene su huerta circular (data3d/tintal.js): entra fija
kT = next(k for k, c in enumerate(cand) if 'Tintal' in c['n'])
TC = TIN['huerta']; UB[kT] = {'c': [round(TC['c'][0] + 2095.67, 1), round(TC['c'][1] - 109.06, 1)], 'r': TC['r'], 'fija': True}
sel = [kT]; cub = cubre(kT); fuera = set()
while len(sel) < MAXH:
    opc = sorted(((len(cubre(k) - cub), cand[k]['pg'].area, k) for k in range(len(cand)) if k not in sel and k not in fuera), reverse=True)
    opc = [o for o in opc if o[0] >= 2]
    if not opc: break
    g, _, k = opc[0]
    if not cabe(k): fuera.add(k); print('no cabe la huerta en', cand[k]['n']); continue
    # no dos huertas a menos de 700 m
    if any(dist(UB[k]['c'], UB[j]['c']) < 700 for j in sel): fuera.add(k); continue
    sel.append(k); cub |= cubre(k)
print('parques', len(sel), 'cubre', len(cub), 'de', N)

huertas = []
for k in sel:
    c = cand[k]; u = UB[k]
    CORTO = {'Marsella Sector Norte I Etapa,Pinos De Marsella': 'Pinos de Marsella', 'Las Margaritas (Gilma Jimenez)': 'Las Margaritas (Gilma Jiménez)',
             'Ciudad Urbisa I y II Sector - Castilla Real (2 Sector)': 'Castilla Real (Urbisa)', 'Bellavista-Dindalito': 'Bellavista – Dindalito', 'Urbanización El Carmelo "Favidi" Sectores A y B, Urbanización Gran Britalia': 'El Carmelo – Gran Britalia'}
    huertas.append({'n': CORTO.get(c['n'], c['n']).replace('Î¼', '').replace('\u03bc', '').strip(), 'idrd': c['n'], 'tipo': c['tipo'], 'area': round(c['pg'].area), **u,
                    'poly': [[round(x, 1), round(y, 1)] for x, y in list(c['pg'].simplify(2).exterior.coords)[:-1]]})
    print(c['n'], round(c['pg'].area), u)# colegio -> parque-huerta más cercano (al módulo de huerta)
asig = []
for i in range(N):
    d, h = min((dist(P[i], H['c']), h) for h, H in enumerate(huertas))
    asig.append([h, round(d)])

# ---------- 3. Bavaria Común ----------
DEST = {'inst': [3799.7, 203.9], 'lab': [4078, -0.6], 'campo': [4136.7, 95.9]}
ENT = {'A': [4238.7, 464.9], 'B': [3838.7, 771.9], 'C': [3632.7, 153.9]}
CB = [(DEST['inst'][0] + DEST['lab'][0] + DEST['campo'][0]) / 3, (DEST['inst'][1] + DEST['lab'][1] + DEST['campo'][1]) / 3]
bav = []
for i in range(N):
    d = dist(P[i], CB)
    k = 'campo' if d < 2200 else 'lab' if d < 4000 else 'inst'
    e = min(ENT, key=lambda q: dist(P[i], ENT[q]) + dist(ENT[q], DEST[k]))
    bav.append([k, e, round(d)])

out = {'fuente': 'tools/colegios_red_build.py · colegios.json, parques.json (IDRD), trees.json, canchas.json',
       'enlaces': enlaces, 'huertas': huertas, 'asig': asig, 'bav': bav, 'dest': DEST, 'ent': ENT,
       'criterio': {'maxEnlace': MAXL, 'cobertura': COB, 'bandas': [2200, 4000]}}
json.dump(out, open(D('colegios_red.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print('enlaces', len(enlaces), 'huertas', len(huertas), Counter(a[0] for a in asig), Counter(b[0] for b in bav), Counter(b[1] for b in bav))

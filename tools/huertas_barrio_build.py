"""Huertas de barrio de la propuesta (red distribuida de producción alimentaria) -> data3d/huertas_barrio.json
(lo usa data3d/huertas_barrio.js; también entran a la red biótica como hábitats «huerta», solo con la propuesta).

Sitios:
1. Lotes baldíos de la estrategia E8 (estrategias.json, marco modelo x0,5): se llenan con varios módulos.
2. Parques vecinales y de bolsillo del IDRD (parques.json) de 1.000 a 20.000 m² dentro de Kennedy, a más de 250 m de los
   parques-huerta de la red de colegios: un módulo por parque, repartidos (mínimo 320 m entre huertas).
Cada módulo es un rectángulo de bancales (26x16, 20x12 o 13x9 m), alineado con el parque, a 2 m o más del borde y sin tocar
árboles del censo (copa), canchas, edificios ni agua.
Uso: python tools/huertas_barrio_build.py
"""
import json, math, os
from shapely.geometry import Polygon, Point, box, LineString
from shapely.ops import unary_union
from shapely import affinity
from shapely.strtree import STRtree

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = lambda f: os.path.join(RAIZ, 'data3d', f)
J = lambda f: json.load(open(D(f), encoding='utf-8'))
lw = lambda x, y: (x - 5341.33, 3161.9 - y)
giro = lambda x, z: (x + 2095.67, z - 109.06)
LAT0, LON0 = 4.640683, -74.149778
MX = 111320 * math.cos(math.radians(4.63)); MY = 110540.0
def xy(lon, lat): return ((lon - LON0) * MX + 2095.67, -(lat - LAT0) * MY - 109.06)
LIM = Polygon([xy(*p) for p in J('kennedy.json')['limite']]).buffer(0)

ES = J('estrategias.json'); esc = ES.get('escala', 0.5)
e8 = [e for e in ES['estrategias'] if e['id'] == 'E8'][0]
bal = [c for c in e8['capas'] if 'bald' in c['n'].lower()][0]
LOTES = []
for fl in bal['lotes']:
    pg = Polygon([lw(fl[k] * esc, fl[k + 1] * esc) for k in range(0, len(fl), 2)]).buffer(0)
    if not pg.is_empty: LOTES.append(pg)
CR = J('colegios_red.json')['huertas']
COLH = [Point(*h['c']) for h in CR]
TIN = Polygon([lw(*q) for q in J('tintal.json')['zona_modelo']]).buffer(30)

PAR = []
for p in J('parques.json'):
    if p.get('tipo') not in ('PARQUE VECINAL', 'PARQUE DE BOLSILLO') or len(p.get('pts') or []) < 4: continue
    pg = Polygon([lw(*q) for q in p['pts']]).buffer(0)
    if pg.geom_type == 'MultiPolygon': pg = max(pg.geoms, key=lambda g: g.area)
    if pg.is_empty or not (1000 <= pg.area <= 40000) or not LIM.contains(pg.representative_point()): continue
    if pg.intersects(TIN) or any(pg.distance(c) < 250 for c in COLH): continue
    PAR.append({'n': p.get('nombre') or 'Parque vecinal', 'pg': pg})
print('lotes', len(LOTES), 'parques candidatos', len(PAR))

ZONA = [x['pg'] for x in PAR] + LOTES
zt = STRtree([z.buffer(15) for z in ZONA])
TR = J('trees.json')['t']
obst = []
for t in TR:
    q = Point(*lw(t[0], t[1]))
    if len(zt.query(q, predicate='intersects')): obst.append(q.buffer(max(2.6, min(6, (t[2] if len(t) > 2 else 3) * 0.8))))
print('árboles cerca', len(obst))
for c in J('canchas.json')['canchas']:
    x, z = giro(*c['c']); r = box(-c['L'] / 2 - 3, -c['W'] / 2 - 3, c['L'] / 2 + 3, c['W'] / 2 + 3)
    q = affinity.translate(affinity.rotate(r, c['a'], use_radians=True, origin=(0, 0)), x, z)
    if len(zt.query(q, predicate='intersects')): obst.append(q)
for b in J('buildings.json'):
    p = b.get('pts')
    if not p or len(p) < 4: continue
    q = Polygon([lw(*t) for t in p])
    if not q.is_valid: q = q.buffer(0)
    if len(zt.query(q, predicate='intersects')): obst.append(q.buffer(3))
for w in J('water_bodies.json'):
    if w.get('pts') and len(w['pts']) > 3:
        q = Polygon([lw(*t) for t in w['pts']]).buffer(0)
        if len(zt.query(q, predicate='intersects')): obst.append(q.buffer(6))
OB = STRtree(obst); print('obstáculos', len(obst))

def eje(pg):  # ángulo del lado largo del rectángulo mínimo
    r = list(pg.minimum_rotated_rectangle.exterior.coords)
    a = max(((r[i], r[i + 1]) for i in range(4)), key=lambda s: math.dist(*s))
    return math.atan2(a[1][1] - a[0][1], a[1][0] - a[0][0])

TAM = [(26, 16), (20, 12), (13, 9)]
def libre(rc, pg_in, ya):
    if not pg_in.contains(rc): return False
    if any(rc.intersects(o) for o in ya): return False
    return not any(obst[i].intersects(rc) for i in OB.query(rc))

def modulo(pg, ya, tams=TAM, paso=2.0):
    ang = eje(pg); pin = pg.buffer(-2)
    if pin.is_empty: return None
    cx, cy = pg.centroid.x, pg.centroid.y
    for L, W in tams:
        mejor = None
        for a in (ang, ang + math.pi / 2):
            base = affinity.rotate(box(-L / 2, -W / 2, L / 2, W / 2), a, use_radians=True, origin=(0, 0))
            x0, y0, x1, y1 = pin.bounds; y = y0
            while y <= y1:
                x = x0
                while x <= x1:
                    if pin.contains(Point(x, y)):
                        rc = affinity.translate(base, x, y)
                        if libre(rc, pin, ya):
                            d = math.hypot(x - cx, y - cy)
                            if not mejor or d < mejor[0]: mejor = (d, x, y, a, L, W, rc)
                    x += paso
                y += paso
        if mejor: return mejor
    return None

R = lambda v: round(v, 2)
OUT = []
for k, pg in enumerate(LOTES):  # lotes baldíos: varios módulos
    ya, mods = [], []
    for _ in range(8):
        m = modulo(pg, [r.buffer(3) for r in ya], tams=TAM[:2], paso=3.0)
        if not m: break
        _, x, y, a, L, W, rc = m; ya.append(rc); mods.append({'c': [R(x), R(y)], 'a': round(a, 4), 'l': L, 'w': W})
    if mods: OUT.append({'n': 'Huerta en lote baldío', 'tipo': 'lote', 'm': mods})
    print('lote', k, round(pg.area), len(mods))
# ---------- parques: huertas EFÍMERAS que siguen los senderos (vainas orgánicas a lado y lado del camino) ----------
SEND = []
try:
    for w in json.load(open(os.path.join(RAIZ, 'tools', 'cache', 'osm_senderos.json'), encoding='utf-8'))['elements']:
        g = w.get('geometry') or []
        if len(g) >= 2: SEND.append(LineString([xy(q['lon'], q['lat']) for q in g]))
except FileNotFoundError: print('sin senderos OSM: python tools/osm_senderos_bajar.py')
ST = STRtree(SEND); print('senderos', len(SEND))

def plano(geom):
    if geom.is_empty: return []
    if geom.geom_type == 'LineString': return [geom]
    if hasattr(geom, 'geoms'): return [x for g in geom.geoms for x in plano(g)]
    return []

def espina(pg):  # sin senderos: línea media del parque (centros de cortes perpendiculares al eje largo)
    a = eje(pg); c, s = math.cos(a), math.sin(a); x0, y0 = pg.centroid.x, pg.centroid.y; P = []
    for t in range(-400, 401, 6):
        px, py = x0 + c * t, y0 + s * t
        cut = LineString([(px - s * 300, py + c * 300), (px + s * 300, py - c * 300)]).intersection(pg)
        L = plano(cut)
        if L: m = max(L, key=lambda l: l.length); P.append(m.interpolate(0.5, normalized=True).coords[0])
    return [LineString(P)] if len(P) >= 3 else []

CULTP = ['lechuga', 'fresa', 'acelga', 'flores', 'cebolla', 'morada', 'cilantro', 'repollo', 'flores']
def vaina(line, s0, s1, lado, d0, D):
    out, inn = [], []
    for k in range(15):
        t = k / 14; s = s0 + (s1 - s0) * t
        p = line.interpolate(s); a = line.interpolate(max(0, s - 0.6)); b = line.interpolate(min(line.length, s + 0.6))
        tx, ty = b.x - a.x, b.y - a.y; l = math.hypot(tx, ty) or 1; nx, ny = -ty / l * lado, tx / l * lado
        w = D * math.sin(math.pi * t) ** 0.65; di = d0 + 0.5 * (1 - math.sin(math.pi * t))
        inn.append((p.x + nx * di, p.y + ny * di)); out.append((p.x + nx * (di + max(w, 0.15)), p.y + ny * (di + max(w, 0.15))))
    return Polygon(out + inn[::-1]).buffer(0.25, resolution=4).buffer(-0.1)

def adentro(g):
    i = g.buffer(-0.35)
    return max(i.geoms, key=lambda x: x.area) if i.geom_type == 'MultiPolygon' else (i if not i.is_empty else g)

def huerta_parque(p, k0):
    pg = p['pg']; pin = pg.buffer(-1.5)
    if pin.is_empty: return None
    L = [x for i in ST.query(pg) for x in plano(SEND[i].intersection(pg)) if x.length >= 10]
    fuente = 'senderos'
    if sum(l.length for l in L) < 25: L = [x for x in espina(pg.buffer(-2)) if x.length >= 12]; fuente = 'espina'
    if not L: return None
    pista = unary_union([l.buffer(1.4) for l in L])
    tope = int(min(22, max(3, pg.area / 900))); pods = []
    for li, line in enumerate(sorted(L, key=lambda l: -l.length)):
        for lado in (1, -1):
            s = 2.5 + (3.5 if lado < 0 else 0)
            while s < line.length - 4 and len(pods) < tope:
                ph = s * 0.19 + li * 1.7 + lado
                Lp = 11 + 10 * (0.5 + 0.5 * math.sin(ph)); D = 4 + 4 * (0.5 + 0.5 * math.sin(ph * 0.7 + 2))
                if s + Lp > line.length - 2: break
                v = vaina(line, s, s + Lp, lado, 2.1, D)
                ok = v.geom_type == 'Polygon' and v.is_valid and not v.is_empty and pin.contains(v) and not v.intersects(pista) and not any(v.intersects(q['g'].buffer(1.6)) for q in pods)
                if ok: ok = not any(obst[i].intersects(v) for i in OB.query(v))
                if ok:
                    c = v.centroid; a0, b0 = line.interpolate(s), line.interpolate(s + Lp)
                    pods.append({'g': v, 'c': (c.x, c.y), 'ang': math.atan2(b0.y - a0.y, b0.x - a0.x), 'L': Lp, 'D': D}); s += Lp + 2.2 + 1.5 * (0.5 + 0.5 * math.sin(ph * 1.3))
                else: s += 2.0
        if len(pods) >= tope: break
    if len(pods) < 2: return None
    if p['pg'].distance(BURRO) < 800 or len(pods) >= 6: pass
    nom = ('Huerta efímera del parque ' + p['n'].replace('PARQUE ', '').title()) if p['n'] else 'Huerta efímera de parque'
    cub = [{'c': [R(q['c'][0]), R(q['c'][1])], 'rot': round(q['ang'], 3), 'A': R(q['L'] * 0.78), 'B': R(q['D'] * 0.85 + 2.6), 'H': R(5.2 + (i % 3) * 0.9)} for i, q in enumerate(pods) if q['L'] >= 10 and i % 2 == 0]
    fau = []
    for i, q in enumerate(pods):
        if i % 4 == 1: fau.append([R(q['c'][0]), R(q['c'][1]), 'hotel'])
        if i % 4 == 3: fau.append([R(q['c'][0]), R(q['c'][1]), 'percha'])
    hull = unary_union([q['g'] for q in pods]).convex_hull
    return {'n': nom, 'tipo': 'parque', 'fuente': fuente, 'c': [R(hull.centroid.x), R(hull.centroid.y)],
            'pods': [{'p': [[R(x), R(y)] for x, y in list(q['g'].exterior.coords)[:-1]], 'pi': [[R(x), R(y)] for x, y in list(adentro(q['g']).exterior.coords)[:-1]], 'ang': round(q['ang'], 3), 'cul': CULTP[(k0 + i) % len(CULTP)]} for i, q in enumerate(pods)],
            'cub': cub, 'fau': fau, 'area': round(sum(q['g'].area for q in pods)), 'hull': [[R(x), R(y)] for x, y in list(hull.exterior.coords)[:-1]]}

BURRO = Point(2095.67, -109.06)
PAR.sort(key=lambda p: -p['pg'].area)
puestos = [Point(*h['m'][0]['c']) for h in OUT]
for p in PAR:
    c = p['pg'].centroid
    if any(c.distance(q) < (110 if c.distance(BURRO) < 800 else 300) for q in puestos): continue  # alrededor del Humedal El Burro, varias
    h = huerta_parque(p, len(OUT) * 3)
    if not h: continue
    OUT.append(h); puestos.append(c)
    if len(OUT) >= 56: break
area = sum(m['l'] * m['w'] for h in OUT for m in h.get('m', [])) + sum(h.get('area', 0) for h in OUT)
print('huertas', len(OUT), 'parques', sum(1 for h in OUT if h['tipo'] == 'parque'), 'vainas', sum(len(h.get('pods', [])) for h in OUT), 'm2', area,
      'por espina', sum(1 for h in OUT if h.get('fuente') == 'espina'))
json.dump({'fuente': 'tools/huertas_barrio_build.py: lotes baldíos E8 + parques vecinales y de bolsillo (IDRD), sin árboles, canchas, edificios ni agua',
           'area': area, 'huertas': OUT}, open(D('huertas_barrio.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

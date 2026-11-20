"""Claros sin árboles del predio de Bavaria para las huertas de enseñanza (lo usa data3d/bavaria_distrito.js, a mano).
Rejilla de 15 m alineada con los edificios (ANG del edificio 2, igual que en el JS) centrada en C_CAMPO.
Una celda es libre si: dentro del predio a 16 m del borde, a 20 m o más de los edificios, sin copa de árbol a < 9 m + radio,
a 9 m o más de los pasajes nuevos. Imprime los grupos de celdas libres (componentes) con su tamaño y su pasaje más cercano.
Uso: python tools/bavaria_claros.py [png]"""
import json, math, os, sys
from shapely.geometry import Polygon, Point, LineString
from shapely.strtree import STRtree
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data3d')
J = lambda f: json.load(open(os.path.join(R, f), encoding='utf-8'))
lw = lambda x, y: (x - 5341.33, 3161.9 - y)
D = J('bavaria.json'); A = J('bavaria_arboles.json')['arboles']; SX = J('bavaria_distrito_sx.json')['seg']; TR = J('trees.json')['t']
SIT = Polygon([lw(*p) for p in D['sitio']]).buffer(0)
ED = [Polygon([lw(*p) for p in e['p']]).buffer(0) for e in D['edif']]
e2 = [lw(*p) for p in D['edif'][2]['p']]; ANG = math.atan2(e2[1][1] - e2[0][1], e2[1][0] - e2[0][0]); CU, SU = math.cos(ANG), math.sin(ANG)
C = lw(9478, 3066)
loc = lambda u, v: (C[0] + u * CU - v * SU, C[1] + u * SU + v * CU)
arb = [(lw(a[0], a[1]), max(2.5, a[3])) for a in A]
x0, y0, x1, y1 = SIT.bounds
for t in TR:
    p = lw(t[0], t[1])
    if x0 < p[0] < x1 and y0 < p[1] < y1: arb.append((p, max(2.5, t[2] * 0.6)))
AT = STRtree([Point(p).buffer(r + 9) for p, r in arb])
PAS = [LineString([lw(*q) for q in s['p']]) for s in SX if s['n']]
bord = SIT.exterior
libre = {}
for i in range(-40, 40):
    for j in range(-40, 40):
        c = loc((i + 0.5) * 15, (j + 0.5) * 15); P = Point(c)
        if not SIT.contains(P) or bord.distance(P) < 16: continue
        if any(k not in (20, 27) and e.distance(P) < 20 for k, e in enumerate(ED)): continue
        if len(AT.query(P, predicate='intersects')): continue
        dp = min(l.distance(P) for l in PAS)
        if dp < 9: continue
        libre[(i, j)] = dp
# componentes
vis, comp = set(), []
for k in libre:
    if k in vis: continue
    st, cc = [k], []
    vis.add(k)
    while st:
        a = st.pop(); cc.append(a)
        for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            b = (a[0] + d[0], a[1] + d[1])
            if b in libre and b not in vis: vis.add(b); st.append(b)
    comp.append(cc)
comp.sort(key=len, reverse=True)
for n, cc in enumerate(comp):
    cx = sum(loc((i + .5) * 15, (j + .5) * 15)[0] for i, j in cc) / len(cc); cz = sum(loc((i + .5) * 15, (j + .5) * 15)[1] for i, j in cc) / len(cc)
    mx = (cx + 5341.33, 3161.9 - cz)
    print(n, len(cc), 'modelo', [round(v) for v in mx], 'pasaje min', round(min(libre[k] for k in cc)), sorted(cc))
if len(sys.argv) > 1:
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    f, ax = plt.subplots(figsize=(12, 12)); ax.plot(*SIT.exterior.xy, 'k')
    for e in ED: ax.fill(*e.exterior.xy, fc='#999')
    ax.scatter([p[0] for p, r in arb], [p[1] for p, r in arb], s=4, c='g')
    for l in PAS: ax.plot(*l.xy, 'r')
    for n, cc in enumerate(comp):
        for i, j in cc:
            q = [loc((i + a) * 15, (j + b) * 15) for a, b in ((0, 0), (1, 0), (1, 1), (0, 1))]; ax.fill([p[0] for p in q], [p[1] for p in q], fc='orange', alpha=.5, ec='k', lw=.3)
        c = loc((cc[0][0] + .5) * 15, (cc[0][1] + .5) * 15); ax.text(c[0], c[1], str(n), fontsize=10)
    ax.set_aspect('equal'); plt.savefig(sys.argv[1], dpi=70, bbox_inches='tight')

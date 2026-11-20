"""Sintaxis espacial del distrito Bavaria Común -> data3d/bavaria_distrito_sx.json
Uso: python tools/bavaria_distrito_sx.py   (después de tools/bavaria_pres_datos.py, que hace el análisis angular de toda Kennedy)
Toma de data3d/bavaria_sx.json los tramos a menos de 1,4 km del predio, con su análisis angular ANTES (a) y DESPUÉS (b) de abrir los
25 pasajes peatonales: [NAIN radio n, NAIN radio 800 m, NACH radio n]. Guarda percentiles 0-1 (medidos sobre la red de hoy de la zona)
de la integración a 800 m (i) y de la elección (c), antes y después, y marca los pasajes nuevos (n = 1). Marco del modelo."""
import json, math, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data3d')
SX = json.load(open(os.path.join(R, 'bavaria_sx.json'), encoding='utf-8'))['seg']
P = json.load(open(os.path.join(R, 'bavaria_pres.json'), encoding='utf-8'))
C = (9319, 2943)
def cerca(s): return any(math.hypot(x - C[0], y - C[1]) < 1400 for x, y in s['p'])
L = [s for s in SX if cerca(s)]
import bisect
def orden(k): return sorted(s['a'][k] for s in L if s.get('a'))
O = {k: orden(k) for k in (1, 2)}
def pct(v, k): A = O[k]; return round(bisect.bisect_right(A, v) / len(A), 3)
out = []
for s in L:
    a, b = s.get('a'), s.get('b')
    out.append({'p': [[round(x), round(y)] for x, y in s['p']], 'n': s.get('n', 0),
                'ia': pct(a[1], 1) if a else None, 'ib': pct(b[1], 1) if b else None,
                'ca': pct(a[2], 2) if a else None, 'cb': pct(b[2], 2) if b else None})
json.dump({'fuente': 'bavaria_sx.json (análisis angular de segmentos, método DepthmapX, tools/bavaria_pres_datos.py)', 'resumen': P['resumen'], 'pasajes_m': P['pasajes_m'], 'seg': out},
          open(os.path.join(R, 'bavaria_distrito_sx.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
nv = [o for o in out if o['n']]
sube = sum(1 for o in out if o['ia'] is not None and o['ib'] is not None and o['ib'] > o['ia'] + 0.01)
print('tramos', len(out), 'pasajes', len(nv), 'suben integracion', sube, 'kb', os.path.getsize(os.path.join(R, 'bavaria_distrito_sx.json')) // 1024)

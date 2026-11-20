"""Baja los senderos peatonales de OpenStreetMap (footway, path, pedestrian, track, steps) dentro de Kennedy
-> tools/cache/osm_senderos.json (lo usa tools/huertas_barrio_build.py para que las huertas efímeras sigan los caminos de los parques).
Uso: python tools/osm_senderos_bajar.py"""
import json, os, time, urllib.request, urllib.parse
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
L = json.load(open(os.path.join(RAIZ, 'data3d', 'kennedy.json'), encoding='utf-8'))['limite']
lo = [p[0] for p in L]; la = [p[1] for p in L]
bb = f'{min(la)},{min(lo)},{max(la)},{max(lo)}'
q = f'[out:json][timeout:170];way["highway"~"^(footway|path|pedestrian|track|steps)$"]({bb});out geom;'
d = None
for url in ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.private.coffee/api/interpreter']:
    for _ in range(2):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, data=urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': 'simulador-kennedy'}), timeout=200).read()
            d = json.loads(r); break
        except Exception as e: print(url, e); time.sleep(5)
    if d: break
os.makedirs(os.path.join(RAIZ, 'tools', 'cache'), exist_ok=True)
json.dump(d, open(os.path.join(RAIZ, 'tools', 'cache', 'osm_senderos.json'), 'w', encoding='utf-8'))
print('senderos', len(d['elements']))

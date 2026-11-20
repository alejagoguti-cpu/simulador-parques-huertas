"""Bavaria Común en puntos -> data3d/puntos/bavaria_campo.bin + bavaria_campo.json (los usa bavaria_puntos.html)

1. Captura (en el simulador, con la propuesta y el distrito Bavaria Común prendidos): vista peatonal en el campo experimental,
   color + profundidad EXACTA del 3D (huertas, invernaderos, árboles existentes del censo y edificios):
     node tools/puntos/cdp_captura.mjs http://127.0.0.1:8795/index.html tools/cache/puntos_bavaria_cap.json 115 tools/puntos/captura_bavaria.js
2. python tools/puntos/bavaria_puntos_build.py
   - guarda los puntos (int16 cada 4 cm, relativos al ojo + color RGB),
   - ubica cada especie sobre el punto 3D que está en su píxel de la vista,
   - fotos de iNaturalist con licencia libre (CC) de cada especie, con su atribución.
"""
import json, math, os, re, base64, urllib.request, urllib.parse
import numpy as np

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
CAP = json.load(open(os.path.join(RAIZ, 'tools', 'cache', 'puntos_bavaria_cap.json'), encoding='utf-8'))
n, W, H = CAP['n'], CAP['W'], CAP['H']
raw = base64.b64decode(CAP['pts'])
P = np.frombuffer(raw[:n * 6], dtype=np.int16).reshape(n, 3).astype(np.float32) * CAP['esc']
os.makedirs(os.path.join(RAIZ, 'data3d', 'puntos'), exist_ok=True)
open(os.path.join(RAIZ, 'data3d', 'puntos', 'bavaria_campo.bin'), 'wb').write(raw)

# proyección de cada punto a su píxel (misma cámara de la captura)
eye, look = np.array(CAP['eye'], np.float32), np.array(CAP['look'], np.float32)
f = look - eye; f /= np.linalg.norm(f); r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, f)
z = P @ f; tY = math.tan(math.radians(CAP['fov'] / 2)); tX = tY * W / H
px = ((P @ r) / z / tX + 1) / 2 * W; py = (1 - (P @ u) / z / tY) / 2 * H
def punto(x, y, dy=0.0):
    d2 = (px - x) ** 2 + (py - y) ** 2; m = d2 < 49
    if not m.any(): m = d2 < 400
    i = np.where(m)[0]; k = i[np.argmin(z[i])]  # el más cercano a la cámara en ese píxel
    q = P[k].copy(); q[1] += dy; return [round(float(v), 2) for v in q]

def foto(sci):
    try:
        q = 'https://api.inaturalist.org/v1/taxa?per_page=1&q=' + urllib.parse.quote(sci)
        t = json.load(urllib.request.urlopen(urllib.request.Request(q, headers={'User-Agent': 'simulador-kennedy'}), timeout=20))['results'][0]
        d = json.load(urllib.request.urlopen(urllib.request.Request(f"https://api.inaturalist.org/v1/taxa/{t['id']}", headers={'User-Agent': 'simulador-kennedy'}), timeout=20))['results'][0]
        for tp in d.get('taxon_photos', []):
            p = tp['photo']
            if p.get('license_code'): return {'url': p['medium_url'], 'atr': p['attribution'], 'lic': p['license_code']}
    except Exception as e: print('foto', sci, e)
    return None

# especies: [clave, nombre, científico, grupo, píxel x, y, altura sobre el punto, color, qué hace aquí, qué la atrae, qué prospera con ella]
E = [  # píxeles sobre la huerta reconstruida desde la fotografía (tools/puntos/huerta_foto_puntos.py, 1440 × 1080)
    ['cilantro', 'Fríjol trepador', 'Phaseolus coccineus', 'flor', 752, 318, 0.2, '#ef4444', 'Sube por los tutores de caña; sus flores rojas y tubulares son las favoritas del colibrí.', 'Tutores, sol y riego constante.', 'Polinizado por colibríes y abejorros; fija nitrógeno en el suelo.'],
    ['lechuga', 'Arveja', 'Pisum sativum', 'cultivo', 225, 525, 0.3, '#a3e635', 'Se siembra en la primera práctica del curso: crece rápido y enseña a tutorar.', 'Suelo suelto con compost del distrito.', 'Las mariquitas la protegen de los pulgones; no necesita plaguicidas.'],
    ['acelga', 'Maíz', 'Zea mays', 'cultivo', 600, 520, 0.6, '#65a30d', 'Parte de la milpa: maíz, fríjol y ahuyama crecen juntos y se ayudan.', 'Sol pleno y suelo rico.', 'Le da tutor al fríjol; las aves insectívoras controlan sus orugas.'],
    ['zanahoria', 'Cebolla larga', 'Allium fistulosum', 'cultivo', 1162, 600, 0.3, '#84cc16', 'La cebolla de la sabana: se siembra en hileras y se cosecha por tallos.', 'Camas elevadas bien drenadas.', 'Su olor confunde a las plagas de los cultivos vecinos.'],
    ['tomate', 'Calabacín', 'Cucurbita pepo', 'cultivo', 1125, 862, 0.25, '#facc15', 'Hojas grandes que dan sombra al suelo; sus flores amarillas se abren temprano.', 'Compost maduro y mucha agua.', 'Necesita abejorros y abejas: sin polinizadores no hay fruto.'],
    ['abeja', 'Abeja de miel', 'Apis mellifera', 'fauna', 760, 330, 0.5, '#facc15', 'Visita las flores del fríjol y las del calabacín; sale del apiario del distrito.', 'Franjas de flores y el apiario.', 'Más fruto y más parejo; miel para el mercado.'],
    ['abejorro', 'Abejorro', 'Bombus atratus', 'fauna', 1125, 862, 0.4, '#eab308', 'Entra a las flores del calabacín y las poliniza; es nativo de la sabana.', 'Nidos de abejorro nativo y flores grandes.', 'Calabacín y ahuyama con fruto.'],
    ['mariposa', 'Mariposa', 'Vanessa cardui', 'fauna', 330, 470, 0.6, '#fb923c', 'Toma néctar de las flores de la arveja; sus orugas viven en las plantas nativas del borde.', 'Franjas de flores y borde nativo.', 'Señal de una huerta sin venenos.'],
    ['colibri', 'Colibrí', 'Colibri coruscans', 'fauna', 700, 300, 0.6, '#22d3ee', 'Flota frente a las flores rojas del fríjol y toma su néctar; se lleva el polen en el pico.', 'Flores rojas y tubulares, perchas cerca.', 'Fríjol polinizado.'],
    ['mariquita', 'Mariquita', 'Coccinellidae', 'fauna', 225, 525, 0.2, '#dc2626', 'Camina por las hojas de la arveja comiéndose los pulgones: control natural de plagas.', 'Hoteles de insectos y franjas de flores.', 'Arveja y maíz sanos.'],
    ['lombriz', 'Lombriz roja', 'Eisenia fetida', 'fauna', 975, 937, 0.05, '#b87c8c', 'Convierte el compost del distrito en tierra fértil para los bancales.', 'Compost y suelo húmedo con materia orgánica.', 'Todas las camas: suelo vivo.'],
    ['copeton', 'Copetón', 'Zonotrichia capensis', 'fauna', 790, 800, 0.02, '#a3a3a3', 'Salta por el camino entre los bancales comiendo semillas de maleza e insectos.', 'Árboles existentes para posarse y anidar.', 'Menos malezas y orugas.'],
    ['mirla', 'Mirla patiamarilla', 'Turdus fuscater', 'fauna', 520, 975, 0.02, '#78716c', 'Busca lombrices en el pasto húmedo entre los bancales.', 'Árboles existentes y suelo con lombrices.', 'Control de babosas y orugas.'],
    ['murcielago', 'Murciélago', 'Glossophaga soricina', 'fauna', 900, 60, 0.5, '#a78bfa', 'Al anochecer sale de los refugios de los árboles y caza polillas sobre la huerta.', 'Refugios en los árboles.', 'Menos polillas.'],
    ['eucalipto', 'Árboles existentes', 'bosque de Bavaria', 'arbol', 1388, 45, 1.0, '#4d7c0f', 'Los árboles del predio se conservan: dan sombra, refugio y flores para las abejas.', 'Ya están: no se talan.', 'Percha y nido de aves; refugio de murciélagos.'],
]
# relaciones críticas que fomenta el campo: [quién, a quién, tipo]
REL = [['abeja', 'cilantro', 'Polinización'], ['abeja', 'tomate', 'Polinización'], ['colibri', 'cilantro', 'Polinización'], ['abejorro', 'tomate', 'Polinización'], ['mariposa', 'lechuga', 'Polinización'], ['mariquita', 'lechuga', 'Control de plagas'], ['mariquita', 'acelga', 'Control de plagas'], ['lombriz', 'zanahoria', 'Suelo vivo'], ['lombriz', 'tomate', 'Suelo vivo'], ['mirla', 'lombriz', 'Depredación'], ['copeton', 'acelga', 'Control de plagas'], ['copeton', 'eucalipto', 'Refugio'], ['mirla', 'eucalipto', 'Refugio'], ['murcielago', 'eucalipto', 'Refugio']]
TIPOS = {'Polinización': '#facc15', 'Control de plagas': '#f87171', 'Suelo vivo': '#c084fc', 'Depredación': '#fb923c', 'Refugio': '#4ade80'}
FOTOS0 = json.load(open(os.path.join(RAIZ, 'data3d', 'especies_fotos.json'), encoding='utf-8'))['esp']
out = []
for k, nom, sci, g, x, y, dy, c, hace, atrae, prospera in E:
    fo = {'url': FOTOS0[k], 'atr': 'Red de relaciones bióticas del Humedal El Burro / iNaturalist'} if k in FOTOS0 else foto(re.sub(r' var\. \w+', '', sci).replace('× ', ''))
    out.append({'k': k, 'n': nom, 'sci': sci, 'g': g, 'p': punto(x, y, dy), 'c': c, 'hace': hace, 'atrae': atrae, 'prospera': prospera, 'foto': fo})
    print(k, out[-1]['p'], (fo or {}).get('lic', '-'))
# la fauna va pegada a la planta con la que interactúa (el píxel puede caer en un fondo lejano)
JUNTO = {'abeja': ('cilantro', 0.25, 0.25, 0.2), 'colibri': ('cilantro', -0.5, 0.35, 0.4), 'mariposa': ('lechuga', 0.3, 0.45, 0.2), 'abejorro': ('tomate', 0.2, 0.25, -0.2), 'mariquita': ('lechuga', 0.1, 0.12, 0.05)}
PK = {o['k']: o for o in out}
for k, (b, dx, dy, dz) in JUNTO.items():
    if k in PK and b in PK: q = PK[b]['p']; PK[k]['p'] = [round(q[0] + dx, 2), round(q[1] + dy, 2), round(q[2] + dz, 2)]
meta = {'fuente': 'Huerta reconstruida con puntos desde una fotografía (Wikimedia Commons, CC BY-SA 4.0) y una profundidad estimada; tools/puntos/huerta_foto_puntos.py', 'foto': CAP.get('foto'),
        'n': n, 'esc': CAP['esc'], 'eye': CAP['eye'], 'look': CAP['look'], 'fov': CAP['fov'], 'W': W, 'H': H,
        'especies': out, 'rel': REL, 'tipos': TIPOS}
json.dump(meta, open(os.path.join(RAIZ, 'data3d', 'puntos', 'bavaria_campo.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('puntos', n, 'especies', len(out), 'relaciones', len(REL), 'MB', round(len(raw) / 1e6, 1))

"""Especies en PUNTOS desde fotografías reales (como el referente de Salento: «reconstruidos con puntos desde fotografías y una
profundidad estimada: representación, no un levantamiento») -> data3d/puntos/esp/<clave>.bin + esp.json
1. Foto CC de iNaturalist (o de la red biótica del Humedal El Burro) de cada especie (la de bavaria_campo.json), en tamaño grande.
2. Se recorta el animal o la planta del fondo con GrabCut (OpenCV), quedándose con la mancha principal.
3. Profundidad estimada: el centro de la silueta sale hacia adelante (transformada de distancia) y la textura de la foto
   le da relieve (luz = más cerca). Atrás se refleja la silueta, más oscura, para que tenga volumen al girar.
4. Cada píxel es un punto (int16, 1 unidad = 1/1000 de la altura de la especie) con su color.
Uso: python tools/puntos/especies_puntos.py
"""
import json, os, io, urllib.request
import numpy as np, cv2

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
M = json.load(open(os.path.join(RAIZ, 'data3d', 'puntos', 'bavaria_campo.json'), encoding='utf-8'))
OUT = os.path.join(RAIZ, 'data3d', 'puntos', 'esp'); os.makedirs(OUT, exist_ok=True)
CACHE = os.path.join(RAIZ, 'tools', 'cache', 'esp_fotos'); os.makedirs(CACHE, exist_ok=True)
FAUNA = ['colibri', 'abeja', 'abejorro', 'mariposa', 'mariquita', 'mirla', 'copeton', 'lombriz', 'murcielago']
PLANTAS = []  # ['cilantro', 'lechuga', 'zanahoria', 'tomate', 'acelga'] si se quieren las plantas en puntos
INDICE = {}

def bajar(k, url):
    f = os.path.join(CACHE, k + '.jpg')
    if not os.path.exists(f):
        u = url.replace('/medium.', '/large.')
        for cand in (u, url):
            try:
                data = urllib.request.urlopen(urllib.request.Request(cand, headers={'User-Agent': 'simulador-kennedy'}), timeout=30).read(); open(f, 'wb').write(data); break
            except Exception as e: print('foto', k, cand[:60], e)
    return cv2.imread(f) if os.path.exists(f) else None

# fotos escogidas a mano entre las CC de iNaturalist (tools/puntos/_candidatas.py): animal entero y bien recortable
ELEGIDA = {'colibri': 0, 'copeton': 0, 'mirla': 7}
CAND = json.load(open(os.path.join(CACHE, 'candidatas.json'), encoding='utf-8')) if os.path.exists(os.path.join(CACHE, 'candidatas.json')) else {}
for k, i in ELEGIDA.items():
    c = next((x for x in CAND.get(k, []) if x['i'] == i), None); src = os.path.join(CACHE, f'{k}_c{i}.jpg')
    if c and os.path.exists(src):
        import shutil; shutil.copyfile(src, os.path.join(CACHE, k + '.jpg'))
        for e in M['especies']:
            if e['k'] == k: e['foto'] = {'url': c['url'], 'atr': c['atr'], 'lic': c['lic']}
for k in FAUNA + PLANTAS:
    e = next((x for x in M['especies'] if x['k'] == k), None)
    if not e or not e.get('foto'): print('sin foto', k); continue
    img = bajar(k, e['foto']['url'])
    if img is None: continue
    h0, w0 = img.shape[:2]; esc = 440 / max(h0, w0); img = cv2.resize(img, (int(w0 * esc), int(h0 * esc)), interpolation=cv2.INTER_AREA); h, w = img.shape[:2]
    # GrabCut desde un rectángulo con margen
    mask = np.zeros((h, w), np.uint8); mx, my = int(w * 0.06), int(h * 0.06)
    bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, (mx, my, w - 2 * mx, h - 2 * my), bg, fg, 6, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1: big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); m = np.where(lab == big, 255, 0).astype(np.uint8)
    if m.sum() < 255 * 500: print('máscara pobre', k); continue
    # profundidad estimada
    dt = cv2.distanceTransform(m, cv2.DIST_L2, 5); dt = dt / (dt.max() or 1)
    lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255; lum = cv2.GaussianBlur(lum, (0, 0), 1.2)
    ys, xs = np.nonzero(m); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max(); H = max(y1 - y0, x1 - x0) or 1
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    z = np.sqrt(dt[ys, xs]) * 0.22 * H + (lum[ys, xs] - 0.5) * 0.05 * H
    col = img[ys, xs][:, ::-1]  # BGR -> RGB
    X = (xs - cx) / H; Y = (cy - ys) / H; Z = z / H
    # cara de atrás (silueta reflejada, más oscura y más rala)
    sel = np.arange(len(X)) % 2 == 0
    Xb, Yb, Zb, Cb = X[sel], Y[sel], -Z[sel] * 0.8, (col[sel] * 0.45).astype(np.uint8)
    P = np.concatenate([np.stack([X, Y, Z], 1), np.stack([Xb, Yb, Zb], 1)]); C = np.concatenate([col, Cb]).astype(np.uint8)
    q = np.clip(np.round(P * 1000), -32767, 32767).astype(np.int16)
    open(os.path.join(OUT, k + '.bin'), 'wb').write(q.tobytes() + C.tobytes())
    INDICE[k] = {'n': int(len(P)), 'aspecto': round(float((x1 - x0) / max(1, y1 - y0)), 3), 'atr': e['foto'].get('atr', ''), 'lic': e['foto'].get('lic', '')}
    cv2.imwrite(os.path.join(CACHE, k + '_mask.png'), cv2.bitwise_and(img, img, mask=m))
    print(k, len(P))
json.dump(INDICE, open(os.path.join(OUT, 'esp.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('especies', len(INDICE))

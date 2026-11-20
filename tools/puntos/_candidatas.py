import json, os, sys, urllib.request, urllib.parse
import numpy as np, cv2
C = 'tools/cache/esp_fotos'; os.makedirs(C, exist_ok=True)
SP = {'colibri': 'Colibri coruscans', 'copeton': 'Zonotrichia capensis', 'mirla': 'Turdus fuscater'}
H = {'User-Agent': 'simulador-kennedy'}
def J(u):
    for _ in range(4):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=40))
        except Exception as e: print('reintento', e)
    raise SystemExit('sin API')
ims, meta = [], {}
for k, sci in SP.items():
    t = J('https://api.inaturalist.org/v1/taxa?per_page=1&q=' + urllib.parse.quote(sci))['results'][0]
    d = J(f"https://api.inaturalist.org/v1/taxa/{t['id']}")['results'][0]
    fotos = [tp['photo'] for tp in d.get('taxon_photos', []) if tp['photo'].get('license_code')][:8]
    meta[k] = []
    for i, p in enumerate(fotos):
        u = p['medium_url'].replace('/medium.', '/large.'); f = os.path.join(C, f'{k}_c{i}.jpg')
        try:
            if not os.path.exists(f): open(f, 'wb').write(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=30).read())
        except Exception as e: print(k, i, e); continue
        img = cv2.imread(f); h0, w0 = img.shape[:2]; s = 300 / max(h0, w0); img = cv2.resize(img, (int(w0 * s), int(h0 * s)))
        h, w = img.shape[:2]; m = np.zeros((h, w), np.uint8); bg = np.zeros((1, 65)); fg = np.zeros((1, 65))
        cv2.grabCut(img, m, (int(w * .06), int(h * .06), int(w * .88), int(h * .88)), bg, fg, 5, cv2.GC_INIT_WITH_RECT)
        mm = np.where((m == 1) | (m == 3), 255, 0).astype(np.uint8); v = cv2.resize(cv2.bitwise_and(img, img, mask=mm), (200, 200))
        cv2.putText(v, f'{k} {i} {p["license_code"]}', (4, 16), 0, 0.45, (0, 255, 255), 1); ims.append(v)
        meta[k].append({'i': i, 'url': p['medium_url'], 'atr': p['attribution'], 'lic': p['license_code']})
json.dump(meta, open(os.path.join(C, 'candidatas.json'), 'w', encoding='utf-8'), ensure_ascii=False)
while len(ims) % 6: ims.append(np.zeros((200, 200, 3), np.uint8))
cv2.imwrite(sys.argv[1], np.vstack([np.hstack(ims[i:i + 6]) for i in range(0, len(ims), 6)]))
print('ok', {k: len(v) for k, v in meta.items()})

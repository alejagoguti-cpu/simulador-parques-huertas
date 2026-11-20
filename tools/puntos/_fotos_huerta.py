import json, os, sys, urllib.request, urllib.parse
import numpy as np, cv2
C = 'tools/cache/huerta_fotos'; os.makedirs(C, exist_ok=True)
H = {'User-Agent': 'simulador-kennedy/1.0 (investigacion academica)'}
def J(u): return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=40))
out, ims = [], []
for q in ['raised bed vegetable garden', 'community garden raised beds', 'urban garden vegetables beds', 'allotment garden vegetables rows']:
    u = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': 'filetype:bitmap ' + q, 'gsrnamespace': 6, 'gsrlimit': 12,
        'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iiurlwidth': 1600})
    try: r = J(u)
    except Exception as e: print(q, e); continue
    for p in (r.get('query') or {}).get('pages', {}).values():
        ii = (p.get('imageinfo') or [{}])[0]; md = ii.get('extmetadata') or {}
        lic = (md.get('LicenseShortName') or {}).get('value', ''); w, h = ii.get('width', 0), ii.get('height', 0)
        if not ii.get('thumburl') or w < h * 1.2 or not any(x in lic for x in ('CC', 'Public')): continue
        if any(o['t'] == p['title'] for o in out): continue
        out.append({'t': p['title'], 'u': ii['thumburl'], 'lic': lic, 'art': (md.get('Artist') or {}).get('value', ''), 'pag': ii.get('descriptionurl', '')})
print(len(out))
for i, o in enumerate(out[:24]):
    f = os.path.join(C, f'c{i}.jpg')
    try:
        if not os.path.exists(f): open(f, 'wb').write(urllib.request.urlopen(urllib.request.Request(o['u'], headers=H), timeout=40).read())
        im = cv2.imread(f); im = cv2.resize(im, (320, int(320 * im.shape[0] / im.shape[1]))); im = cv2.copyMakeBorder(im, 0, max(0, 220 - im.shape[0]), 0, 0, cv2.BORDER_CONSTANT)[:220]
        cv2.putText(im, str(i), (6, 24), 0, 0.8, (0, 255, 255), 2); ims.append(im); o['f'] = f
    except Exception as e: print(i, e)
json.dump(out[:24], open(os.path.join(C, 'candidatas.json'), 'w', encoding='utf-8'), ensure_ascii=False)
while len(ims) % 4: ims.append(np.zeros((220, 320, 3), np.uint8))
cv2.imwrite(sys.argv[1], np.vstack([np.hstack(ims[i:i + 4]) for i in range(0, len(ims), 4)]))

"""Logo del simulador: vista aérea de Kennedy recortada con la forma real de la localidad -> logo_kennedy.png
Uso: python tools/logo_aereo.py
- Límite: data3d/giro_sim.json (marco giro) -> lat/lon con el mismo marco del simulador (LC, OX, OZ).
- Foto aérea: Esri World Imagery (export de ArcGIS, © Esri, Maxar, Earthstar Geographics), se baja una vez a tools/cache/.
- Se recorta con la silueta (antialias por supermuestreo) y lleva un borde ámbar fino para que la forma se lea a 16 px."""
import json, os, urllib.request, io
from PIL import Image, ImageDraw, ImageFilter

R = os.path.join(os.path.dirname(__file__), '..')
OX, OZ, LC = 2095.67, -109.06, (5341.33, 3161.9)
G = json.load(open(os.path.join(R, 'data3d', 'giro_sim.json'), encoding='utf-8'))
ll = []
for x, y in G['limite']:
    X, Y = x + OX + LC[0], LC[1] - (y + OZ)
    ll.append((-74.153 + (X - LC[0]) / 110955, 4.636 + (Y - LC[1]) / 110540))  # (lon, lat)
lo0, lo1 = min(p[0] for p in ll), max(p[0] for p in ll)
la0, la1 = min(p[1] for p in ll), max(p[1] for p in ll)
# caja cuadrada (en metros) con 3 % de margen
cx, cy = (lo0 + lo1) / 2, (la0 + la1) / 2
lado_m = max((lo1 - lo0) * 110955, (la1 - la0) * 110540) * 1.06
dlo, dla = lado_m / 110955 / 2, lado_m / 110540 / 2
B = (cx - dlo, cy - dla, cx + dlo, cy + dla)
N = 1024
cache = os.path.join(os.path.dirname(__file__), 'cache'); os.makedirs(cache, exist_ok=True)
foto = os.path.join(cache, 'kennedy_aereo_esri.jpg')
if not os.path.exists(foto):
    url = ('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?'
           f'bbox={B[0]},{B[1]},{B[2]},{B[3]}&bboxSR=4326&imageSR=4326&size={N},{N}&format=jpg&f=image')
    req = urllib.request.Request(url, headers={'User-Agent': 'simulador-kennedy-logo'})
    open(foto, 'wb').write(urllib.request.urlopen(req, timeout=60).read())
img = Image.open(foto).convert('RGB').resize((N, N))
# un poco más de contraste y saturación (la foto aérea sale lavada)
from PIL import ImageEnhance
img = ImageEnhance.Contrast(ImageEnhance.Color(img).enhance(1.25)).enhance(1.15)
pts = [((lon - B[0]) / (B[2] - B[0]) * N, (B[3] - lat) / (B[3] - B[1]) * N) for lon, lat in ll]
SS = 2
mask = Image.new('L', (N * SS, N * SS), 0)
ImageDraw.Draw(mask).polygon([(x * SS, y * SS) for x, y in pts], fill=255)
mask = mask.resize((N, N), Image.LANCZOS)
out = Image.new('RGBA', (N, N), (0, 0, 0, 0)); out.paste(img, (0, 0), mask)
# borde ámbar
borde = Image.new('L', (N * SS, N * SS), 0)
ImageDraw.Draw(borde).line([(x * SS, y * SS) for x, y in pts + [pts[0]]], fill=255, width=22 * SS, joint='curve')
borde = borde.resize((N, N), Image.LANCZOS)
capa = Image.new('RGBA', (N, N), (226, 165, 91, 0)); capa.putalpha(borde)
out = Image.alpha_composite(out, capa)
for s, nombre in ((256, 'logo_kennedy.png'), (180, 'logo_kennedy_180.png')):
    out.resize((s, s), Image.LANCZOS).save(os.path.join(R, nombre), optimize=True)
print('listo', B)

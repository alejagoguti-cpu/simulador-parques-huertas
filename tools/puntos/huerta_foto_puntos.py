"""Huerta en PUNTOS desde una FOTOGRAFÍA real (como el referente de Salento: «reconstruido con puntos desde fotografías y
una profundidad estimada: representación, no un levantamiento»).
Foto: «Vegetable garden with raised beds, Trimingham, Norfolk» (Wikimedia Commons, CC BY-SA 4.0).
Profundidad estimada con geometría de cámara: ojo a 1,6 m, mirando 20° hacia abajo; cada píxel es un rayo:
  · si cae al suelo -> el punto del suelo;
  · lo que está parado (plantas, estacas, cerca) toma la distancia de su base (la del suelo unas filas más abajo);
  · lo que está detrás de la cerca va a un plano a 7,5 m; la copa y el techo del fondo a 13 m; el cielo se quita.
Sale en el mismo formato de la captura (tools/cache/puntos_bavaria_cap.json), así bavaria_puntos_build.py ubica las especies
por píxel sobre la foto.  Uso: python tools/puntos/huerta_foto_puntos.py && python tools/puntos/bavaria_puntos_build.py
"""
import json, os, base64, math
import numpy as np, cv2
from scipy.ndimage import minimum_filter1d
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
F = os.path.join(RAIZ, 'tools', 'cache', 'huerta_fotos', 'c1.jpg')
img = cv2.imread(F); H0, W0 = img.shape[:2]
W, H = 1440, 1080; img = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)
FOV, PITCH, ALTO = 50.0, -20.0, 1.6
EYE = [4322.0, 2.2, 6.0]; yaw_dir = np.array([4255 - 4322, 0, 138 - 6], float); yaw_dir /= np.linalg.norm(yaw_dir)
f = yaw_dir * math.cos(math.radians(PITCH)) + np.array([0, 1, 0]) * math.sin(math.radians(PITCH)); f /= np.linalg.norm(f)
r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, f)
tY = math.tan(math.radians(FOV / 2)); tX = tY * W / H
xs, ys = np.meshgrid(np.arange(W), np.arange(H))
nx = ((xs + 0.5) / W * 2 - 1) * tX; ny = (1 - (ys + 0.5) / H * 2) * tY
D = f[None, None, :] + nx[..., None] * r[None, None, :] + ny[..., None] * u[None, None, :]
D /= np.linalg.norm(D, axis=2, keepdims=True)
dy = D[..., 1]; hz = np.hypot(D[..., 0], D[..., 2])
# distancia horizontal del suelo por fila (centro de la imagen) y su mínimo hacia abajo (la base de lo que está parado)
with np.errstate(divide='ignore'): g = np.where(dy < -1e-3, ALTO / -dy * hz, np.inf)
g = np.minimum(g, 7.5)
k = np.clip(((ys - H * 0.1) * 0.16).astype(int), 0, 200)
base = g.copy()
for kk in np.unique(k):
    if kk < 2: continue
    m = k == kk; mf = minimum_filter1d(g, size=2 * kk + 1, axis=0, origin=-kk, mode='nearest'); base[m] = mf[m]
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32); S_, V_ = hsv[..., 1] / 255, hsv[..., 2] / 255
cielo = (ys < H * 0.13) & (S_ < 0.18) & (V_ > 0.75)
fondo = ys < H * 0.075  # copa y techo detrás de la cerca
dist = np.where(fondo & ~cielo, 13.0, base)
# relieve por la textura (las hojas claras salen un poco)
lum = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255, (0, 0), 1.0)
dist = dist * (1 - (lum - 0.5) * 0.05)
t = dist / np.maximum(hz, 1e-3)
P = D * t[..., None]
ok = ~cielo & np.isfinite(t) & (t < 40)
P = P[ok]; C = img[ok][:, ::-1]
# densidad: 1 de cada 2 píxeles (como una captura), con un poco de jitter para que no se vea la rejilla
sel = (np.random.default_rng(3).random(len(P)) < 0.8); P, C = P[sel], C[sel]
q = np.clip(np.round(P * 25), -32767, 32767).astype(np.int16)
raw = q.tobytes() + C.astype(np.uint8).tobytes()
look = (np.array(EYE) + f * 10).round(3).tolist()
cap = {'n': int(len(P)), 'W': W, 'H': H, 'esc': 0.04, 'eye': EYE, 'look': look, 'fov': FOV, 'zonas': [], 'arboles': [], 'pts': base64.b64encode(raw).decode(),
       'foto': {'t': 'Vegetable garden with raised beds, Trimingham, Norfolk', 'lic': 'CC BY-SA 4.0', 'autor': 'Wikimedia Commons', 'pag': 'https://commons.wikimedia.org/wiki/File:-2020-07-01_Vegetable_garden_with_raised_beds,_Trimingham,_Norfolk_(2).JPG'}}
json.dump(cap, open(os.path.join(RAIZ, 'tools', 'cache', 'puntos_bavaria_cap.json'), 'w'))
cv2.imwrite(os.path.join(RAIZ, 'tools', 'cache', 'huerta_fotos', 'base.jpg'), img)
print('puntos', len(P))

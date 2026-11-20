import unreal
out = []
for n in ('CesiumCartographicPolygon', 'CesiumPolygonRasterOverlay', 'CesiumTileExcluder'):
    c = getattr(unreal, n, None)
    out.append('== %s %s' % (n, 'existe' if c else 'NO'))
    if c: out.append(', '.join(x for x in dir(c) if not x.startswith('_') and x not in dir(unreal.Object)))
with open(r'C:\Users\ACER\Documents\Unreal Projects\Kennedy360\Saved\api_cesium.txt', 'w') as f: f.write('\n'.join(out))

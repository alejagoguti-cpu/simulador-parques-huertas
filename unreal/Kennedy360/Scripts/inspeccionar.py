import unreal

OUT = r'C:\Users\ACER\Documents\Unreal Projects\Kennedy360\Saved\inspeccion.txt'
lineas = []
def log(s):
    lineas.append(str(s))

log('engine: ' + unreal.SystemLibrary.get_engine_version())
for nombre in ('CesiumGeoreference', 'Cesium3DTileset', 'CesiumSunSky', 'CesiumIonRasterOverlay', 'CesiumCameraManager'):
    cls = getattr(unreal, nombre, None)
    if cls is None:
        log(nombre + ': NO EXISTE en Python')
        continue
    props = []
    for p in dir(cls):
        if p.startswith('_'):
            continue
        props.append(p)
    log(nombre + ': ' + ', '.join(props))
for nombre in ('TilesetSource', 'CesiumTilesetSource', 'ECesiumTilesetSource'):
    e = getattr(unreal, nombre, None)
    if e is not None:
        log('enum ' + nombre + ': ' + ', '.join(x for x in dir(e) if x.isupper()))
# clase blueprint del cielo de Cesium
bp = unreal.EditorAssetLibrary.does_asset_exist('/CesiumForUnreal/CesiumSunSky')
log('asset /CesiumForUnreal/CesiumSunSky existe: ' + str(bp))
log('MoviePipelineQueueSubsystem: ' + str(getattr(unreal, 'MoviePipelineQueueSubsystem', None) is not None))
log('LevelSequenceEditorBlueprintLibrary: ' + str(getattr(unreal, 'LevelSequenceEditorBlueprintLibrary', None) is not None))
open(OUT, 'w', encoding='utf-8').write('\n'.join(lineas))

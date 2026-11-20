"""Al abrir el editor: espera a que cargue el visor y pone la cámara a 1.500 m sobre el humedal El Burro mirando hacia abajo."""
import unreal
estado = {'n': 0, 'h': None}
def tick(dt):
    estado['n'] += 1
    if estado['n'] < 240: return  # unos segundos: que termine de cargar el nivel y el visor
    try:
        unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).set_level_viewport_camera_info(
            unreal.Vector(0, 0, 150000), unreal.Rotator(roll=0.0, pitch=-89.9, yaw=0.0))
        unreal.log('[Kennedy360] vista desde arriba lista')
    finally:
        unreal.unregister_slate_post_tick_callback(estado['h'])
estado['h'] = unreal.register_slate_post_tick_callback(tick)

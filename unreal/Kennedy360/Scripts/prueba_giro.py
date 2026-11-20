"""Deja ConfigPrueba renderizando los fotogramas 18-19 para comprobar que la cámara gira."""
import unreal
cfg = unreal.load_asset('/Game/Kennedy/ConfigPrueba')
out = cfg.find_or_add_setting_by_class(unreal.MoviePipelineOutputSetting)
out.set_editor_property('custom_start_frame', 18)
out.set_editor_property('custom_end_frame', 19)
unreal.EditorAssetLibrary.save_loaded_asset(cfg)
seq = unreal.load_asset('/Game/Kennedy/Giro')
unreal.log('[Kennedy360] prueba lista: fotogramas 18-19; spawnables %d, possessables %d' % (len(seq.get_spawnables()), len(seq.get_possessables())))

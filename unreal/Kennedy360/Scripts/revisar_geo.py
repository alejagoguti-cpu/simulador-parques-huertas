import unreal
OUT = r'C:\Users\ACER\Documents\Unreal Projects\Kennedy360\Saved\revisar_geo.txt'
les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
les.load_level('/Game/Kennedy/Kennedy')
eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
L = []
for a in eas.get_all_level_actors():
    linea = '%-28s %-30s tags=%s' % (a.get_actor_label(), a.get_class().get_name(), [str(t) for t in a.tags])
    if isinstance(a, unreal.CesiumGeoreference):
        linea += ' origen=%s' % a.get_origin_longitude_latitude_height()
    for prop in ('georeference',):
        try:
            g = a.get_editor_property(prop)
            linea += ' %s=%s' % (prop, g)
        except Exception:
            pass
    L.append(linea)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(L))

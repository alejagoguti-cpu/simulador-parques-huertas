import unreal
out = []
for n in ('ladrillo', 'salmon', 'crema', 'blanco', 'techo', 'lamina', 'balcon'):
    m = unreal.load_asset('/Game/Kennedy/Ren3D/%s.%s' % (n, n))
    if not m: out.append('%s: no' % n); continue
    sd = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
    out.append('%s: lods %d, tris lod0 %d, verts %d, nanite %s' % (n, m.get_num_lods(), m.get_num_triangles(0), m.get_num_vertices(0), m.get_editor_property('nanite_settings').get_editor_property('enabled')))
with open(r'C:\Users\ACER\Documents\Unreal Projects\Kennedy360\Saved\contar_tris.txt', 'w') as f: f.write('\n'.join(out))

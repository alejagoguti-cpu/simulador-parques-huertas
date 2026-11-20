import unreal
MEL = unreal.MaterialEditingLibrary
out = []
for n in ('M_Fachada_ladrillo', 'M_Techo', 'M_Follaje'):
    m = unreal.load_asset('/Game/Kennedy/Ren3D/%s.%s' % (n, n))
    for prop in (unreal.MaterialProperty.MP_BASE_COLOR, unreal.MaterialProperty.MP_NORMAL, unreal.MaterialProperty.MP_ROUGHNESS):
        e = MEL.get_material_property_input_node(m, prop)
        out.append('%s %s -> %s %s' % (n, prop, e.get_class().get_name() if e else None, MEL.get_material_property_input_node_output_name(m, prop) if e else ''))
    out.append('%s two_sided=%s' % (n, m.get_editor_property('two_sided')))
m = unreal.load_asset('/Game/Kennedy/Ren3D/ladrillo.ladrillo')
out.append('malla ladrillo material: %s' % [str(s.material_interface.get_name()) if s.material_interface else None for s in m.static_materials])
with open(r'C:\Users\ACER\Documents\Unreal Projects\Kennedy360\Saved\revisar_material.txt', 'w') as f: f.write('\n'.join(out))

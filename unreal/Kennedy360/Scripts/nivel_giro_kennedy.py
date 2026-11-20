"""Nivel del giro de toda Kennedy: /Game/Kennedy/KennedyGiro = copia COMPLETA del nivel Kennedy (edificios, árboles y suelo
REN3D de la zona de El Burro intactos) + los edificios y árboles REN3D del resto de la localidad (exportar_kennedy.py,
carpeta Importar/kennedy), con los mismos materiales de fachada. El nivel Kennedy original no se toca."""
import json, os, unreal
PROY = unreal.Paths.convert_relative_path_to_full(unreal.Paths.project_dir())
SRC = os.path.join(PROY, 'Importar', 'kennedy')
R, DK = '/Game/Kennedy/Ren3D', '/Game/Kennedy/Ren3DKennedy'
EAL = unreal.EditorAssetLibrary
tools = unreal.AssetToolsHelpers.get_asset_tools()
les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem); eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
info = []
MATS = {'ladrillo': 'M_Fachada_ladrillo', 'salmon': 'M_Fachada_salmon', 'crema': 'M_Fachada_crema', 'blanco': 'M_Fachada_blanco', 'techo': 'M_Techo', 'lamina': 'M_Lamina'}
MAT = {k: unreal.load_asset('%s/%s' % (R, v)) for k, v in MATS.items()}

# ---------- mallas ----------
if EAL.does_directory_exist(DK): EAL.delete_directory(DK)
mallas = []
for k in range(4):
    t = unreal.AssetImportTask()
    t.set_editor_property('filename', os.path.join(SRC, 'kennedy_edificios_%d.obj' % k)); t.set_editor_property('destination_path', '%s/C%d' % (DK, k))
    t.set_editor_property('automated', True); t.set_editor_property('replace_existing', True); t.set_editor_property('save', True)
    tools.import_asset_tasks([t])
    for p in t.get_editor_property('imported_object_paths'):
        o = unreal.load_asset(p)
        if not isinstance(o, unreal.StaticMesh): continue
        nombre = o.get_name()
        if nombre in MAT and MAT[nombre]: o.set_material(0, MAT[nombre])
        ns = o.get_editor_property('nanite_settings'); ns.set_editor_property('enabled', False); o.set_editor_property('nanite_settings', ns)
        EAL.save_loaded_asset(o); mallas.append((k, nombre, o))
info.append('mallas importadas: %d' % len(mallas))

# ---------- nivel ----------
DEST = '/Game/Kennedy/KennedyGiro'
if EAL.does_asset_exist(DEST): EAL.delete_asset(DEST)
EAL.duplicate_asset('/Game/Kennedy/Kennedy', DEST)
les.load_level(DEST)
for k, nombre, m in mallas:
    act = eas.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(0, 0, 0))
    act.static_mesh_component.set_static_mesh(m)
    act.set_actor_label('REN3DK_%d_%s' % (k, nombre)); act.set_actor_scale3d(unreal.Vector(100, 100, 100))

# ---------- árboles del resto de Kennedy (mismas especies e instancias que colocar_ren3d.py) ----------
D = json.load(open(os.path.join(SRC, 'arboles_kennedy.json'), encoding='utf-8'))
ESPECIES = [('jacaranda', 19.58), ('island_tree_01', 4.94)]
sds = unreal.get_engine_subsystem(unreal.SubobjectDataSubsystem)
def hism(host, malla):
    raiz = sds.k2_gather_subobject_data_for_instance(host)[0]
    h, _ = sds.add_new_subobject(unreal.AddNewSubobjectParams(parent_handle=raiz, new_class=unreal.HierarchicalInstancedStaticMeshComponent, blueprint_context=None))
    c = unreal.SubobjectDataBlueprintFunctionLibrary.get_object(unreal.SubobjectDataBlueprintFunctionLibrary.get_data(h))
    c.set_static_mesh(malla); c.set_editor_property('cast_shadow', True); return c
suelo = D['suelo']
for k, (esp, alto0) in enumerate(ESPECIES):
    host = eas.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(0, 0, 0)); host.set_actor_label('REN3DK_arboles_' + esp)
    tr = []
    for x, y, alto, rot, wf, s in D['arboles']:
        if s != k: continue
        e = alto / alto0
        tr.append(unreal.Transform(unreal.Vector(x * 100, -y * 100, (suelo - 0.2) * 100), unreal.Rotator(roll=0.0, pitch=0.0, yaw=rot), unreal.Vector(e * wf, e * wf, e)))
    for parte in ('hojas', 'madera'):
        n = '%s_L0_%s' % (esp, parte)
        m = unreal.load_asset('%s/Arboles/%s/%s/StaticMeshes/%s.%s' % (R, n, n, n, n))
        if not m: info.append('falta ' + n); continue
        c = hism(host, m); c.add_instances(tr, False)
        info.append('arboles %s %s: %d' % (esp, parte, c.get_instance_count()))
les.save_current_level()
info.append('nivel %s guardado con %d actores' % (DEST, len(eas.get_all_level_actors())))
with open(os.path.join(PROY, 'Saved', 'nivel_giro_kennedy.txt'), 'w', encoding='utf-8') as f: f.write('\n'.join(info))

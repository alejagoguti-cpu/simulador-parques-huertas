import unreal
out = []
for n in ('jacaranda_L0_hojas', 'island_tree_01_L0_hojas'):
    for p in unreal.EditorAssetLibrary.list_assets('/Game/Kennedy/Ren3D/Arboles/' + n, recursive=True):
        a = unreal.load_asset(p); out.append('%s  %s' % (type(a).__name__, p))
with open(r'C:\Users\ACER\Documents\Unreal Projects\Kennedy360\Saved\listar_hojas.txt', 'w') as f: f.write('\n'.join(out))

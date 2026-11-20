import unreal
with open(r'C:\Users\ACER\Documents\Unreal Projects\Kennedy360\Saved\listar_ren3d.txt', 'w') as f:
    for p in unreal.EditorAssetLibrary.list_assets('/Game/Kennedy/Ren3D', recursive=True):
        f.write(p + '\n')

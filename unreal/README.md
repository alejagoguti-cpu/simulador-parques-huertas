# Kennedy360 · proyecto de Unreal Engine 5.8

Proyecto de Unreal con el que se renderizó el giro fotorrealista de Kennedy que se ve en el simulador
(botón **RENDER** → [`giro_render.html`](../giro_render.html)): humedal El Burro, recorrido El Burro – La Vaca y humedal La Vaca.

- Motor: **Unreal Engine 5.8**
- Ciudad: malla fotorrealista de Google (Photorealistic 3D Tiles) con **Cesium for Unreal 2.30** (Cesium ion, asset 2275207)
- Niveles: `Content/Kennedy/KennedyGiro.umap` (giro de El Burro), `KennedyCorredor.umap` (recorrido), `Kennedy.umap`
- Encima de la malla: edificios, calles, agua, árboles, tráfico y fauna de REN3D (`Content/Kennedy/...`), armados con los scripts de `Scripts/`
- Render: Movie Render Queue → fotogramas → `tools/giro_build.py` los convierte a WebP para la web

## Cómo abrirlo

1. Instalar Unreal Engine 5.8 y el plugin **Cesium for Unreal** (desde Fab / Epic Games Launcher).
2. Crear `Config/cesium_ion_token.txt` con un token propio de Cesium ion (las claves no se suben al repositorio).
3. Abrir `Kennedy360.uproject`.

No se suben (se regeneran o son muy pesados): `Plugins/` (5,6 GB), `Saved/`, `Intermediate/`, `DerivedDataCache/`,
`Importar/` (datos intermedios) y la caché de Cesium.

# Kennedy360 · proyecto de Unreal Engine del simulador

Este es el proyecto de **Unreal Engine 5** (con **Cesium for Unreal** y la malla fotorrealista 3D de Google) con el que se armó la
base del simulador de Kennedy. El simulador web (`index.html`) no corre Unreal en el navegador: usa lo que este proyecto produjo
y comparte con él el mismo marco de coordenadas.

## Qué del simulador viene de aquí

| En el simulador | Viene de Unreal | Cómo |
|---|---|---|
| Marco de coordenadas del mundo 3D (origen en el humedal El Burro, X = este, metros) | Georreferencia del nivel (`Scripts/armar_escena.py` y `fijar_geo.py`: lat 4,640683 · lon −74,149778, El Burro) | `tools/kennedy_sim_datos.py` y `data3d/giro_sim.js` usan el marco del giro de Unreal; `index.html` suma (2095,67; −109,06) para pasar al mundo |
| Modelo de agentes de alimentos y fauna (dependencia de Corabastos, tiendas, comedores, colegios, acopio, huertas; aves, abejas y custodios del humedal) | `Scripts/simular_agentes.py` | Resultados en `Importar/agentes/` (`nodos.json`, `resultados.json`, `RESULTADOS.md`). `tools/propuesta_datos.py` toma `nodos.json` y genera `data3d/propuesta.json` (panel PROPUESTA del simulador) |
| Tráfico y agentes de calle (carros con modelo IDM, buses, peatones) | `Scripts/simular_calles.py`, `trafico_ren3d.py`, `calles_ren3d.py` | Versión en Unreal del tráfico que el simulador web muestra con la simulación SUMO y `data3d/giro_sim.js` |
| Giro fotorrealista de 360° alrededor de El Burro | Niveles `GiroKennedy`, `GiroVaca`, `GiroCorredor` + Movie Render Queue (`Scripts/giro_kennedy.py`, `nivel_giro_kennedy.py`, `camara_*.py`) | Fotogramas convertidos con `tools/giro_build.py`; se ven en `giro_render.html` (botón «Giro» del simulador) |
| Edificios y árboles de la maqueta encima de la malla de Google | `Scripts/importar_ren3d.py`, `colocar_ren3d.py`, `hojas_ren3d.py` | Los mismos datos que dibuja el simulador web (`data3d/buildings.json`, `data3d/trees.json`), exportados con `Scripts/exportar_edificios.py` |
| Alturas y aspecto de los árboles, luz de día | Render de Unreal como referencia | `data3d/real3d.js` (alturas como en el render) e `index.html` (ambiente `DIA`) se calibraron contra el render |

## Cómo se arma

1. Abrir `Kennedy360.uproject` en Unreal Engine 5 con el plugin Cesium for Unreal.
2. Poner el token de Cesium ion en `Config/cesium_ion_token.txt` (**no se sube**: está en `.gitignore`).
3. Correr los scripts con `UnrealEditor-Cmd Kennedy360.uproject -run=pythonscript -script=Scripts/<script>.py`, en este orden:
   `armar_escena.py` → `ajustes_mundo.py` → `fijar_geo.py` → `ajustes_giro.py` → `importar_ren3d.py` → `colocar_ren3d.py`.
4. Agentes: `simular_agentes.py` (escribe `Importar/agentes/`); después, en la raíz del repo, `python tools/propuesta_datos.py unreal/Kennedy360/Importar/agentes/nodos.json`.
5. Giro: render con Movie Render Queue y `python tools/giro_build.py`.

Las claves (Cesium ion y Google Maps) nunca se guardan en el repositorio.

# Simulación de agentes · Kennedy360

Generado por `tools/unreal/simular_agentes.py` (semilla 20261102). Todo parámetro marcado [SUP] en el código es un supuesto declarado, no un dato.

## Dependencia de Corabastos (volumen de alimentos que pasa por la central)

| Escenario | Dependencia (prom. últimos 30 días) | kg/día por Corabastos | kg/día por el acopio | de eso, producción local | de eso, compra conjunta | precio relativo de Corabastos |
|---|---|---|---|---|---|---|
| actual | 85,0 % | 17.876 | 0 | 0 | 0 | 1,000 |
| propuesto | 67,3 % | 14.152 | 4.380 | 880 | 3.500 | 0,927 |
| propuesto apagon | 67,3 % | 14.152 | 4.380 | 880 | 3.500 | 0,927 |

Consumo modelado: 21.030 kg/día (144 tiendas, 6 comedores de 500 raciones y 10 colegios de 800 raciones).

### Por grupo de alimentos, día final del escenario propuesto (kg/día)

| Grupo | Corabastos | Acopio | Otros canales |
|---|---|---|---|
| hortalizas | 4.435 | 228 | 783 |
| hongos | 0 | 652 | 0 |
| frutas | 2.051 | 1.750 | 362 |
| granos tuberculos | 4.524 | 1.750 | 798 |
| carne lacteos | 3.143 | 0 | 555 |

Lo que sigue llegando por Corabastos es lo que Kennedy no produce ni compra en conjunto: sobre todo carne y lácteos, y la parte de frutas y granos que supera la capacidad de las asociaciones de productores. La autonomía es relativa (corrección 3.8).

### Apagón en el distrito

Durante los días 40 a 43 el distrito trabaja con respaldo (biogás del compostaje + solar, 60,0 % de su producción). Dependencia máxima en esos días: 70,3 % (sin apagón: 69,4 %). Hongos entregados en esos días: 1.680 kg (sin apagón: 2.610 kg).

### Viajes del día final

| Escenario | Camiones externos a Corabastos | Compras en Corabastos | Bicicargas del acopio | Furgones del acopio |
|---|---|---|---|---|
| actual | 2 | 112 | 0 | 0 |
| propuesto | 2 | 88 | 152 | 4 |
| propuesto apagon | 2 | 88 | 152 | 4 |

## Fauna del humedal El Burro (10 min simulados por escenario)

| Métrica | Actual | Propuesto |
|---|---|---|
| Polinizaciones por parche de cultivo y hora | 0.0 | 45.7 |
| Visitas de abejas a flora de la ronda por hora | 1.938 | 942 |

Las bandadas no cambian entre escenarios en este modelo (la propuesta actúa sobre flores y huertas, no sobre el espejo de agua):

| Métrica de las bandadas (patrones POM) | Valor |
|---|---|
| Polarización media de las golondrinas (0 = enjambre, 1 = todas en la misma dirección) | 0.51 |
| Giro de grupo medio de las golondrinas (1 = remolino) | 0.36 |
| Polarización media de las torcazas | 0.83 |
| Cohesión del enjambre de quironómidos (Lin & Abaid) | 0.16 |
| Insectos cazados por golondrina y minuto | 1.64 |
| Ataques / capturas de la aguililla sobre las torcazas | 24 / 0 |

Acople entre los dos submodelos: las polinizaciones del escenario propuesto dan un factor de polinización de 89,8 % para la parte de la cosecha que depende de polinizadores (35,0 % de las huertas).

## Invariantes comprobadas en cada corrida

- cuenta de insectos (vivos + comidos = emergidos) en cada medición
- cuenta de néctar (producido = consumido + en flores) en cada medición
- cuenta de alimentos (consumido = Corabastos + otros canales + acopio) por escenario
- identidades estables y azar por dirección lógica (misma salida con la misma semilla)

## Leyenda de colores en Unreal

- Fichas: rojo camión externo a Corabastos · ocre tendero que compra en Corabastos · naranja compra conjunta al acopio · verde bicicarga del acopio · verde oscuro furgón del acopio · morado hongos del distrito · verde claro cosecha de huertas · café compost.
- Columnas (nodos): rojo Corabastos · ocre acopio · morado distrito · café compostaje · verde huertas · amarillo tiendas · verde claro comedores · azul colegios. Losa verde translúcida: área cedida al humedal La Vaca.
- Aves en vuelo a escala x4, aves del agua x2, abejas x12 y fichas de vehículos x10 para que se lean en el render.

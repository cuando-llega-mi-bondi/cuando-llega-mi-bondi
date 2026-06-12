# Planner «Cómo llego»

Cómo funciona el planificador multimodal (caminata + colectivos) que responde la
ruta [`/como-llego`](../app/como-llego/page.tsx) y la API
[`POST /api/geo/plan`](../app/api/geo/plan/route.ts).

A diferencia de los arribos en vivo, el planner **no contacta a la
Municipalidad**: trabaja por completo sobre el catálogo estático de
[`data/static/`](../data/static), así que es seguro en Vercel y funciona sin el
backend self-hosted.

## Panorama

```
data/static/  ──►  transitStaticModels  ──►  buildTransitModels  ──►  RoutingGraph
 (líneas +          (lazy, 1×/proceso)        (lib/server/             (paradas +
  recorridos)                                  transitGraph.ts)         secuencias +
                                                                        vecinos a pie)
                                                                            │
                          itinerarios + geometría para Leaflet  ◄── planMany + mapView
                                                                  (features/trip-planner)
```

| Pieza | Archivo | Rol |
| ----- | ------- | --- |
| Modelos de transit (lazy) | [`lib/server/transitStaticModels.ts`](../lib/server/transitStaticModels.ts) | Carga el catálogo y construye el grafo **una vez por proceso** |
| Constructor del grafo (puro) | [`lib/server/transitGraph.ts`](../lib/server/transitGraph.ts) | Paradas, secuencias por ramal, vecinos a pie. Sin Next: reutilizable en scripts |
| Modelo de costos | [`features/trip-planner/lib/costModel.ts`](../features/trip-planner/lib/costModel.ts) | Minutos estimados; lo que el planner optimiza **es** lo que la UI muestra |
| Algoritmo (RAPTOR por rondas) | [`features/trip-planner/lib/planner.ts`](../features/trip-planner/lib/planner.ts) | `planMany()` → mejores itinerarios de 1–3 colectivos |
| Geometría para el mapa | [`features/trip-planner/lib/itineraryMapPayload.ts`](../features/trip-planner/lib/itineraryMapPayload.ts) | Convierte un itinerario en polilíneas para Leaflet |
| Ruta API | [`app/api/geo/plan/route.ts`](../app/api/geo/plan/route.ts) | `GET` warm-up + `POST` con caché LRU |
| Tipos | [`features/trip-planner/types.ts`](../features/trip-planner/types.ts) | `RoutingGraph`, `Itinerary`, `RouteLeg`, … |

## El grafo de routing

`buildTransitModels()` agrega el catálogo de todas las líneas (API + manuales) en
un único `RoutingGraph`:

- **`paradas`** — `Map<id, ParadaGeo>` con la posición física de cada parada y
  todas las líneas que pasan. Las paradas se deduplican entre líneas por
  identificador. Se descartan las que vienen en `(0, 0)`.
- **`sequences`** — una `StopSequence` por **ramal** (ida/vuelta cuentan
  separado): la lista ordenada de paradas a lo largo del recorrido, más la
  polilínea `[lat, lng]` del ramal.
- **`sequencesByParada`** — índice inverso `paradaId → {sequenceIdx, posición}`;
  permite al planner saltar directo a las secuencias que tocan una parada.
- **`walkNeighbors`** — `paradaId → vecinas a ≤ 300 m`, para transbordos a pie.

### Orden de paradas a lo largo del ramal (el problema sutil)

El dump **no** trae las paradas ordenadas por recorrido, y a algunos ramales les
asigna paradas de otras variantes del servicio. `orderStopsAlongPolyline()`
resuelve ambas cosas:

1. Construye la geometría de la polilínea del ramal en metros
   (`buildPolylineGeometry`).
2. **Proyecta** cada parada sobre la polilínea (`projectStopOntoPolyline`),
   obteniendo su *longitud de arco* (distancia recorrida hasta el punto más
   cercano) y su *distancia perpendicular* a la traza.
3. Descarta las paradas a más de **`MAX_STOP_TO_POLYLINE_METERS` (80 m)** de la
   polilínea: son de otra variante y, si se proyectaran, romperían el orden.
4. Ordena por longitud de arco → secuencia de paradas en el sentido de
   circulación.

> El umbral de 80 m no es arbitrario: surge de
> [`scripts/audit-stop-order.ts`](#auditar-el-orden-de-paradas), que mide cuántos
> pares de paradas adyacentes quedan en un orden geométricamente imposible (el
> arco entre dos paradas es mucho menor que su distancia en línea recta). Bajar
> el umbral de ∞ a 80 m lleva esos pares imposibles de 129 a 4. Penalizar por el
> lado de circulación **empeora** el resultado: las coordenadas del dump no
> codifican el lado de subida de forma consistente.

### Vecinos a pie

`computeWalkingNeighbors()` usa una **grilla espacial** (celdas de `0.004°`)
para no comparar todas las paradas contra todas: para cada parada solo revisa
su celda y las 8 adyacentes, y guarda las que estén a ≤ `300 m`. La celda debe
medir al menos el radio en su eje más angosto (longitud, que se contrae con
`cos(lat)`: 0.004° ≈ 345 m a lat -39); con celdas más chicas se pierden vecinos
reales cerca de los bordes. Es lo que habilita transbordos «bajarse acá y
caminar a la parada de enfrente».

## Modelo de costos

Una sola fuente de verdad para el planner y la UI: el algoritmo optimiza
exactamente los minutos que el usuario ve. Es aritmética pura
([`costModel.ts`](../features/trip-planner/lib/costModel.ts)), importable tanto
del server como del cliente.

| Constante | Valor | Significado |
| --------- | ----- | ----------- |
| `WALK_METERS_PER_MIN` | 70 | Velocidad de caminata (~4,2 km/h) |
| `RIDE_METERS_PER_MIN` | 320 | Velocidad media del bondi en ciudad (~19 km/h, ya incluye semáforos y paradas) |
| `WALK_DETOUR_FACTOR` | 1,3 | La caminata real por la cuadrícula es más larga que la línea recta |
| `BOARDING_OVERHEAD_MINS` | 4 | Espera + abordaje por cada colectivo tomado |
| `TRANSFER_PENALTY_MINS` | 3 | Molestia extra **al rankear** cada transbordo — no se muestra como tiempo |

```
estimateMins  = caminata/70 + viaje/320 + colectivos·4      (lo que ve el usuario)
rankCostMins  = estimateMins + max(0, colectivos−1)·3        (con lo que compara el planner)
```

La penalidad por transbordo es la clave del modelo: «menos colectivos» ya **no**
gana automáticamente si implica caminar mucho o dar un rodeo. El costo se mide en
minutos, no en cantidad de transbordos.

## El algoritmo (RAPTOR por rondas)

`planMany()` es una variante de [RAPTOR](https://www.microsoft.com/en-us/research/publication/round-based-public-transit-routing/):
la **ronda `k` explora itinerarios de exactamente `k` colectivos**. De una sola
corrida salen los mejores de 1, 2 y 3 colectivos.

### Una corrida (`runRaptor`)

1. **Siembra (ronda 0):** todas las paradas a ≤ `USER_WALK_RADIUS_METERS`
   (800 m) del origen se marcan con una etiqueta «llegué caminando».
2. **Ronda `k`:** se juntan las secuencias que tocan alguna parada marcada y se
   escanea **cada secuencia una sola vez**, desde la posición marcada más
   temprana. Recorriendo la secuencia se mantiene el mejor «abordaje» visto
   (`onboard`) y, en cada parada siguiente, se evalúa si llegar en ese colectivo
   mejora el mejor costo conocido para esa parada.
3. **Transbordos a pie:** desde cada parada alcanzada en colectivo esta ronda se
   prueba **un** salto a pie a las `walkNeighbors`.
4. **Destino:** de las paradas mejoradas en la ronda, se toma la que minimiza el
   costo total sumando la caminata final al destino. Sale **un** itinerario por
   ronda (el mejor de `k` colectivos).
5. Las paradas mejoradas quedan marcadas para la ronda `k+1`.

Las etiquetas (`Label`) son **inmutables** y encadenan a su padre (`via`:
`origin` / `walk` / `ride`); `reconstruct()` recorre esa cadena hacia atrás para
materializar los tramos (`RouteLeg[]`) del itinerario.

### Diversidad y poda (`planMany`)

Una sola corrida da el óptimo, pero el usuario quiere **alternativas**:

- **Caminar directo** compite como un itinerario más si el origen y el destino
  están a ≤ `DIRECT_WALK_MAX_METERS` (1200 m); el ranking decide si vale la pena.
- **Re-corridas baneando líneas:** se vuelve a correr RAPTOR prohibiendo cada
  línea del mejor itinerario, y luego variando la primera línea que se toma. Eso
  produce rutas genuinamente distintas, no variaciones triviales.
- **Poda:** una alternativa que excede al mejor en más de
  `PRUNE_EXTRA_MINS` (15 min) **y** en más de `PRUNE_FACTOR` (1,5×) se descarta —
  solo metería ruido. Se devuelven hasta `max` itinerarios ordenados por costo.

### Rendimiento

El grafo se construye **una vez por proceso** (lazy, cacheado en
`transitStaticModels.ts`) y todas las corridas RAPTOR de una búsqueda comparten
una única pasada de «paradas caminables» sobre el grafo. Para medir tiempos
reales del grafo y de cada plan, ver [`scripts/smoke-plan.ts`](#smoke-test-del-planner).

## La ruta API `/api/geo/plan`

| Método | Uso |
| ------ | --- |
| `GET` | **Warm-up.** El cliente lo dispara al montar la página para forzar la construcción del grafo antes de la primera búsqueda real. Responde `{ ready }`. |
| `POST` | Planifica. Body: `{ originLat, originLng, destLat, destLng, max? }`. Responde `{ itineraries, mapViews }`. |

Detalles del `POST`:

- **Validación:** las cuatro coordenadas deben ser números finitos y caer dentro
  del *bounding box* de la región MGP (`lat ∈ [−39,5, −36,0]`,
  `lng ∈ [−58,6, −56,0]`). `max` se acota a `1..8` (default 5); `maxRides` es 3.
- **Caché LRU en memoria** (100 entradas): la clave redondea las coordenadas a 4
  decimales (~11 m), así que swaps origen↔destino, re-búsquedas y puntos casi
  idénticos responden al instante.
- **`mapViews`** son la geometría lista para Leaflet: tramos de caminata
  (línea punteada gris) y de colectivo (línea sólida de color, recortada a lo
  largo de la polilínea real del ramal entre la parada de subida y la de bajada).

## Scripts de diagnóstico

Estos scripts corren **fuera de Next**, contra el dump ya partido en
`data/static/`. No están en `package.json` (no son parte del flujo de build); se
ejecutan directo con `tsx`.

### Smoke test del planner

```bash
npx tsx scripts/smoke-plan.ts
```

Construye el grafo real e imprime itinerarios para pares origen/destino
deterministas (corto en el centro, centro→norte, norte→sur, centro→Batán),
con los tiempos de construcción del grafo y de cada plan. Útil para verificar a
ojo que el planner no rompió tras tocar el grafo o el modelo de costos.

### Auditar el orden de paradas

```bash
npx tsx scripts/audit-stop-order.ts [--verbose]
```

Para varios umbrales de distancia perpendicular máxima parada→polilínea
(`∞, 150, 120, 80 m`), cuenta los **pares de paradas adyacentes imposibles** y
lista los ramales más problemáticos. Es la herramienta con la que se eligió
`MAX_STOP_TO_POLYLINE_METERS = 80`. Corré esto si cambiás el umbral o sospechás
que un ramal quedó con paradas desordenadas.

---

Para el contexto general (arquitectura, backend externo, otros caminos de datos),
ver [docs/architecture.md](architecture.md).

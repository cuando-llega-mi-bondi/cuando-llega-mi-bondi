# Datos

Datasets públicos y derivados que la app usa o genera.

## `raw/` — datasets bajados de la muni

Todos publicados en [datos.mardelplata.gob.ar](https://datos.mardelplata.gob.ar) bajo **Creative Commons 3.0**.

| Archivo | Origen | Notas |
|---|---|---|
| `lineas-transporte-urbano.csv` | `/sites/default/files/lineas-transporte-urbano.csv` | 27 líneas + empresa operadora. Convertido a UTF-8. |
| `paradas.geojson` | `/sites/default/files/paradas.geojson` | 10081 paradas con coords + línea (deduplicadas a ~3160 únicas por coords). Sin `Identificador`/`Codigo` que la API usa para arribos. |
| `recorridos.geojson` | `/sites/default/files/recorridos.geojson` | 128 recorridos como MultiLineString. Props: `col1` (línea), `col2` (origen;destino). Cubre ~80% de las líneas. |
| `frecuencias-2024.csv` | `/sites/default/files/frecuencias_2024.csv` | Matriz hora×línea (servicios por hora). Datos de 2024 (mucho más actuales que el CSV 2013 que usábamos). |

## GTFS estático generado

`scripts/generate-gtfs.ts` produce un feed GTFS en `public/gtfs/`:

```bash
node --experimental-strip-types scripts/generate-gtfs.ts
(cd public/gtfs && zip ../gtfs.zip *.txt)
```

**Contenido del feed**:

| Archivo | Filas | Notas |
|---|---|---|
| `agency.txt` | 5 | Empresas operadoras |
| `routes.txt` | 31 | 28 líneas del CSV + variantes que aparecen solo en recorridos.geojson (BATAN, COSTA AZUL, 593CORTA) |
| `stops.txt` | 3166 | Paradas únicas (dedup por coords a 5 decimales) |
| `shapes.txt` | 7251 puntos | Geometría real de cada recorrido |
| `trips.txt` | 128 | Un trip por feature de recorridos.geojson, con headsign real ("AL PUERTO", "A BATAN", etc) |
| `frequencies.txt` | 558 | Del CSV 2024. Mapeadas a primer trip de cada línea (aproximación). |
| `calendar.txt` | 1 | service_id "everyday", todos los días, ventana de 1 año |
| `stop_times.txt` | 15124 | Matching geométrico parada↔shape. 124/128 trips con paradas (avg 122). Tiempos asumiendo 25 km/h constante. |

**Cómo se generan los stop_times**: para cada `trip` (= recorrido del geojson) se filtran las paradas asociadas a esa línea, se proyecta cada una sobre cada segmento del shape (equirectangular local), se descartan las que quedan a >80 m y se ordenan por progreso acumulado a lo largo del shape. La velocidad media (25 km/h) es una aproximación urbana; cuando tengamos GPS real conviene calcular dwell + travel time por segmento. Los 4 trips sin paradas son recorridos cuya `col1` no matchea con ninguna `linea` en `paradas.geojson` (ej. variantes "BATAN", "COSTA AZUL").

## ¿Por qué nos importa el GTFS?

Servir un feed GTFS propio nos libera de la API frágil de la muni para datos estáticos. Apps GTFS-compatibles (Citymapper, Google Maps, OneBusAway, Transit App) podrían consumir Bondi MDP como fuente sin tocar `webWS.php`. La parte **realtime** (cuándo llega) sigue dependiendo de la muni — eso requeriría GTFS-Realtime que necesita telemetría GPS de los colectivos, hoy solo disponible vía la API municipal.

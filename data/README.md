# Datos

Datasets públicos y derivados que la app usa o genera.

## `raw/` — datasets bajados de la muni

| Archivo | Origen | Notas |
|---|---|---|
| `lineas-transporte-urbano.csv` | https://datos.mardelplata.gob.ar/sites/default/files/lineas-transporte-urbano.csv | 27 líneas con su empresa operadora. Convertido a UTF-8. |
| `paradas.geojson` | https://datos.mardelplata.gob.ar/sites/default/files/paradas.geojson | 10081 paradas con coordenadas + línea. Muchas duplicadas (la misma parada física aparece N veces, una por línea que pasa). Solo trae `cartodb_id` y `linea` como propiedades — **no incluye el `Identificador`/`Codigo` que la API usa** para `RecuperarProximosArribosW`, así que sirven para mapas pero no para consultar arribos. |
| `frecuencias-2013.csv` | https://datos.mardelplata.gob.ar/?q=dataset/frecuencias-mínimas-de-recorrido-de-colectivos | Frecuencias por línea × franja horaria. **Datos del 2013**, los recorridos cambiaron pero las frecuencias son una aproximación razonable como fallback. |

Todos están bajo licencia **Creative Commons 3.0** (Datos Abiertos MGP).

## GTFS estático generado

`scripts/generate-gtfs.ts` produce un feed GTFS parcial en `public/gtfs/`:

```bash
bun scripts/generate-gtfs.ts
(cd public/gtfs && zip ../gtfs.zip *.txt)
```

**Lo que se genera con solo los datasets públicos**:

- `agency.txt` — empresas operadoras
- `routes.txt` — 27 líneas
- `stops.txt` — paradas dedup por coords (~3300 únicas estimadas)
- `calendar.txt` — placeholder "todos los días"
- `frequencies.txt` — del CSV 2013

**Lo que requiere fixtures de la API muni** (rama `dx/local-fixtures-and-mocks`, modo `MGP_USE_FIXTURES=record`):

- `trips.txt`
- `stop_times.txt`
- `shapes.txt` (geometría WKT del recorrido por línea)

Una vez grabadas las fixtures de `RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea` para cada línea, extender el script para consumirlas y completar el feed.

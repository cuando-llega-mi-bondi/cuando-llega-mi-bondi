# OSRM self-hosted (Mar del Plata)

Servicio de routing peatonal para Mar del Plata y alrededores, usando datos de OpenStreetMap.

## Setup (una vez)

```bash
# 1. Bajar y preprocesar (tarda ~5-10 min, descarga ~200MB de OSM)
./setup.sh

# 2. Levantar el servicio en :5000
docker compose up -d

# 3. Verificar
curl "http://localhost:5000/route/v1/foot/-57.5575,-38.0023;-57.5500,-38.0080?overview=full&geometries=geojson"
```

## Uso desde la app

```ts
const url = `http://localhost:5000/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
const res = await fetch(url);
const data = await res.json();
// data.routes[0].distance (metros), .duration (segundos), .geometry.coordinates ([[lng,lat], ...])
```

## Bounding box

Cubre MDP + Batán + Chapadmalal + Camet:
- SO: -57.80, -38.20
- NE: -57.45, -37.85

## Re-procesar (ej. al actualizar OSM)

```bash
docker compose down
rm -rf data/processed/*
./setup.sh
docker compose up -d
```

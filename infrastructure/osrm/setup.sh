#!/usr/bin/env bash
# Bajar OSM de Buenos Aires, cropear a MDP, preprocesar para OSRM (perfil foot).
# Idempotente: si los archivos ya existen, no los rehace.

set -euo pipefail

cd "$(dirname "$0")"

DATA_DIR="$(pwd)/data"
RAW="${DATA_DIR}/raw"
PROCESSED="${DATA_DIR}/processed"
mkdir -p "$RAW" "$PROCESSED"

# Bounding box MDP + alrededores: SO(-57.80,-38.20) → NE(-57.45,-37.85)
BBOX="-57.80,-38.20,-57.45,-37.85"

OSM_URL="https://download.geofabrik.de/south-america/argentina-latest.osm.pbf"
OSM_FILE="${RAW}/argentina.osm.pbf"
MDP_FILE="${RAW}/mdp.osm.pbf"

OSRM_IMAGE="osrm/osrm-backend:latest"
OSMIUM_IMAGE="iboates/osmium:latest"

log() { echo "[osrm-setup] $*"; }

# 1. Descargar OSM Argentina si falta
if [ ! -f "$OSM_FILE" ] || [ "$(stat -c%s "$OSM_FILE")" -lt 100000000 ]; then
  log "Bajando $OSM_URL (~700MB)…"
  rm -f "$OSM_FILE"
  curl -L --fail --progress-bar -o "$OSM_FILE.tmp" "$OSM_URL"
  mv "$OSM_FILE.tmp" "$OSM_FILE"
  log "  → $(du -h "$OSM_FILE" | cut -f1)"
else
  log "OSM Argentina ya descargado: $(du -h "$OSM_FILE" | cut -f1)"
fi

# 2. Cropear a MDP bbox
if [ ! -f "$MDP_FILE" ]; then
  log "Cropeando a bbox MDP ($BBOX) con osmium…"
  docker run --rm -v "$RAW:/data" "$OSMIUM_IMAGE" \
    extract --bbox "$BBOX" --overwrite -o /data/mdp.osm.pbf /data/argentina.osm.pbf
  log "  → $(du -h "$MDP_FILE" | cut -f1)"
else
  log "MDP crop ya existe: $(du -h "$MDP_FILE" | cut -f1)"
fi

# 3. Preprocesar con OSRM (foot profile)
cp "$MDP_FILE" "${PROCESSED}/mdp.osm.pbf"

if [ ! -f "${PROCESSED}/mdp.osrm" ]; then
  log "osrm-extract con perfil foot…"
  docker run --rm -v "$PROCESSED:/data" "$OSRM_IMAGE" \
    osrm-extract -p /opt/foot.lua /data/mdp.osm.pbf

  log "osrm-partition…"
  docker run --rm -v "$PROCESSED:/data" "$OSRM_IMAGE" \
    osrm-partition /data/mdp.osrm

  log "osrm-customize…"
  docker run --rm -v "$PROCESSED:/data" "$OSRM_IMAGE" \
    osrm-customize /data/mdp.osrm

  log "  → archivos listos en $PROCESSED"
else
  log "OSRM ya procesado, salteando."
fi

# 4. chown a user actual (Docker los crea como root y rompe Turbopack/Next)
if [ "$(stat -c %u "$PROCESSED")" != "$(id -u)" ] || \
   find "$PROCESSED" -uid 0 2>/dev/null | grep -q .; then
  log "Ajustando dueño de archivos generados por Docker…"
  sudo -n chown -R "$(id -u):$(id -g)" "$DATA_DIR" 2>/dev/null \
    || log "  (no pude usar sudo non-interactive, corré manualmente: sudo chown -R $(id -u):$(id -g) $DATA_DIR)"
fi

log "Listo. Levantá el servicio con: docker compose up -d"
log "Verificá con: curl 'http://localhost:5000/route/v1/foot/-57.5575,-38.0023;-57.5500,-38.0080'"

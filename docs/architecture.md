# Arquitectura de Bondi MDP

Este documento explica **cómo encajan las piezas** del front Next.js. El backend que habla con la Municipalidad vive **fuera** de este repositorio.

## Screaming Architecture (intención)

Seguimos la idea de [Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html) (Robert C. Martin): **la estructura del repo debería gritar qué hace la app**, no con qué framework está hecha.

Al abrir el proyecto, los nombres de primer nivel orientan por **caso de uso de transporte**, no por capa técnica genérica:

| En lugar de… | Usamos… |
| ------------ | ------- |
| `components/`, `hooks/`, `services/` sueltos | `features/arrivals`, `features/search`, `features/trip-planner` |
| «Capa de presentación» opaca | Carpetas que nombran la capacidad: arribos, favoritos, cómo llego |

Dentro de cada feature suele haber `components/`, `hooks/`, `api/` — pero **siempre bajo el dominio**, para que un cambio en «arribos» no obligue a recorrer todo el monorepo.

**No es una aplicación estricta del patrón.** Hay concesiones pragmáticas:

- **`app/`** — Next.js exige rutas y Route Handlers aquí; son adaptadores finos hacia `features/`.
- **`shared/`** — utilidades transversales (botones, cliente MGP, mapa) que no pertenecen a un solo dominio.
- **`lib/server/`** — infraestructura de servidor (dump estático, grafo del planificador) compartida por varias rutas API.

La regla al contribuir: **código nuevo de producto → `features/<dominio>/`**. Solo mové algo a `shared/` si al menos dos features lo necesitan sin acoplar dominios entre sí.

## Capas

```
┌─────────────────────────────────────────────────────────┐
│  app/          Rutas, layouts, API routes Next.js       │
├─────────────────────────────────────────────────────────┤
│  features/     Dominios: search, arrivals, route, …     │
├─────────────────────────────────────────────────────────┤
│  shared/       API client, UI, mapa, tipos, analytics   │
├─────────────────────────────────────────────────────────┤
│  lib/server/   Lectura de data/static, grafo transit    │
└─────────────────────────────────────────────────────────┘
```

- **`features/`** agrupa todo lo que el usuario percibe como una capacidad (consultar arribos, ver recorrido, planificar viaje).
- **`shared/`** evita duplicar cliente HTTP, componentes base y utilidades geográficas.
- **`lib/server/`** solo corre en servidor (Route Handlers, scripts): archivos en disco, sin `window`.

## Dos caminos de datos MGP

### 1. Catálogo estático (seguro en Vercel)

1. Un operador corre `npm run dump-static` contra el backend self-hosted → `data/mgp-static-dump.json`.
2. `npm run split-static` genera `data/static/lineas.json` y `data/static/linea/<codLinea>.json`.
3. En runtime, `GET /api/reference?accion=...` (`app/api/reference/route.ts`) lee esos archivos con caché larga (`s-maxage=86400`).
4. El navegador llama a `/api/reference` a través de `post()` en `shared/api/client.ts` cuando la acción está en `STATIC_REFERENCE_ACCIONES`.

Si el dump falta o la acción no está soportada, el cliente hace **fallback** al backend (`GET .../mgp/...`).

### 2. Datos en vivo (requiere backend externo)

Arribos GPS y banderas asociadas no se cachean en el dump de referencia. El cliente usa:

```
GET {NEXT_PUBLIC_CUANDO_API_URL}/mgp/{accion}?parametros
```

El backend (no incluido aquí) traduce, autentica y consulta la API municipal desde una IP permitida. Vercel **no** puede sustituir ese rol: las IPs de su edge están bloqueadas.

## Rutas API propias

| Ruta | Rol |
| ---- | --- |
| `/api/reference` | Proxy de lectura al catálogo en disco |
| `/api/geo/paradas-cercanas` | Haversine sobre paradas del modelo estático |
| `/api/geo/nominatim` | Proxy a Nominatim (OSM) con User-Agent y límites |
| `/api/geo/plan` | Planificador multimodal (`features/trip-planner`) |
| `/api/telegram-webhook` | Integración opcional con Supabase |

El planificador construye un grafo desde `lib/server/transitStaticModels.ts` (paradas, secuencias de recorrido, líneas manuales con GeoJSON) y devuelve itinerarios con caminata + hasta N colectivos. Algoritmo (RAPTOR por rondas), modelo de costos en minutos, orden de paradas sobre la polilínea y scripts de diagnóstico: [docs/trip-planner.md](trip-planner.md).

## Persistencia en el cliente

| Dato | Ubicación |
| ---- | --------- |
| Favoritos | `features/favorites/storage/favoritos.ts` → LocalStorage |
| Historial | `features/history/storage/historial.ts` |
| Caché de calles | `shared/` / storage con TTL 24 h donde aplique |

## Líneas manuales

`features/route/manualRoutes.ts` declara líneas con `isManual: true` y rutas a GeoJSON en `public/`. Se fusionan con las líneas del catálogo API (`mergeLineasWithManual`). El mapa y el dump manual (`loadManualStaticDump`) incorporan esos recorridos al grafo cuando corresponde.

## Despliegue

- **Vercel:** front + `/api/reference` + `/api/geo/*`; variables `NEXT_PUBLIC_*`.
- **Docker (`docker-compose.yml`):** imagen Next + túnel cloudflared; útil para self-host completo del front.

## Decisiones clave

| Decisión | Motivo |
| -------- | ------ |
| Sin `/api/cuando` en el repo | Bloqueo de IPs de Vercel por la muni |
| Dump partido en `data/static/` | Menor memoria en cold start y invalidación por línea |
| `GET` al backend en lugar de `POST` form | Cache en CDN del backend para acciones idempotentes |
| Features por dominio (Screaming Architecture) | El árbol refleja casos de uso; facilita onboarding y límites de bundle por área |

Para convenciones al contribuir código, ver [CONTRIBUTING.md](../CONTRIBUTING.md).

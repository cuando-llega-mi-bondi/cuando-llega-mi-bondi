# Contribuir a Bondi MDP

Gracias por tu interés en este proyecto open-source. Estas pautas mantienen el proceso claro para todos.

## Proceso de desarrollo

1. **Fork** del repositorio en tu cuenta de GitHub.
2. **Clonar** tu fork:
   ```bash
   git clone https://github.com/TU_USUARIO/cuando-llega-mi-bondi.git
   cd cuando-llega-mi-bondi
   ```
3. **Rama** para tu cambio:
   ```bash
   git checkout -b feature/mi-nueva-funcionalidad
   ```
   Prefijos útiles: `feature/`, `bugfix/`, `docs/`, `refactor/`.
4. **Entorno local:**
   ```bash
   cp .env.example .env.local
   # Completá NEXT_PUBLIC_CUANDO_API_URL y el resto según docs/env-reference.md
   npm install
   npm run dev
   ```

## Estructura del proyecto

Intentamos organizar el código con **Screaming Architecture**: las carpetas de `features/` nombran capacidades del producto (`arrivals`, `search`, `trip-planner`), no capas genéricas (`controllers`, `models`). Detalle y excepciones (`app/`, `shared/`): [docs/architecture.md — Screaming Architecture](docs/architecture.md#screaming-architecture-intención).

```
app/                    # App Router de Next.js
  (main)/               # Shell con navegación inferior (consultar, favoritos)
  api/
    reference/          # Catálogo MGP desde data/static/
    geo/                # paradas-cercanas, nominatim, plan (Cómo llego)
    telegram-webhook/   # Bot opcional
  consultar/, recorrido/, acerca/, como-llego/, un-mes-en-numeros/
features/               # Dominios de producto (UI + lógica + API por feature)
  arrivals/             # Panel de arribos, tarjetas, otras líneas
  favorites/            # Favoritos en LocalStorage
  history/              # Historial de consultas
  landing/              # Home y secciones de marketing
  live-sharing/         # Telegram y buses en vivo
  route/                # Mapa de recorrido, manualRoutes, RecorridoClient
  search/               # Flujo línea → calle → intersección → parada
  trip-planner/         # Cómo llego (planner + mapa)
shared/                 # Código transversal
  api/client.ts         # post(), swrFetcher, integración MGP
  layout/, ui/, icons/, map/, geo/, analytics/, pwa/
lib/
  server/               # Carga de dump estático, modelos de grafo para planner
  types.ts              # Tipos legacy compartidos con scripts (preferir @shared/types)
data/
  mgp-static-dump.json  # Fuente canónica (generada con dump-static)
  static/               # Catálogo partido en runtime (generada con split-static)
public/                 # Assets, PWA, GeoJSON de líneas manuales, sw.js
scripts/                # dump-static-reference.ts, split-static-dump.ts
```

Alias de importación (`tsconfig.json`): `@/*`, `@features/*`, `@shared/*`.

Mapa Diátaxis del repo: [`docs/DIATAXIS.md`](docs/DIATAXIS.md).

## Cómo agregar una línea manual (GeoJSON)

Para líneas que no están en la API municipal:

1. **GeoJSON:** `LineString` en `public/` (ej. `/mi-linea.geojson`). Podés definir varios **ramales** (ida/vuelta) con archivos distintos.
2. **Configuración:** editá `features/route/manualRoutes.ts`:

   ```typescript
   {
     line: {
       CodigoLineaParada: "ID_UNICO",
       Descripcion: "NOMBRE DE LA LÍNEA",
       CodigoEntidad: "MANUAL",
       CodigoEmpresa: 0,
       isManual: true,
     },
     ramales: [
       {
         key: "ida",
         label: "Ida",
         geoJsonPath: "/mi-linea-ida.geojson",
       },
       {
         key: "vuelta",
         label: "Vuelta",
         geoJsonPath: "/mi-linea-vuelta.geojson",
       },
     ],
     // Alternativa simple: un solo geoJsonPath sin ramales
   }
   ```

3. **Validación:** la línea aparece en el buscador (`mergeLineasWithManual`) y el mapa carga el recorrido local. Tras cambios al catálogo API, regenerá el dump si necesitás que el planificador incluya paradas de esa línea en el grafo estático.

## Scripts de datos estáticos

| Comando | Qué hace |
| ------- | -------- |
| `npm run dump-static` | Descarga referencia MGP al backend y escribe `data/mgp-static-dump.json` |
| `npm run split-static` | Parte el dump en `data/static/lineas.json` y `data/static/linea/<cod>.json` |

Requisitos: `NEXT_PUBLIC_CUANDO_API_URL` (o `DUMP_MGP_URL`) apuntando al backend. Opcional: `DUMP_DELAY_MS`, `STATIC_REFERENCE_DUMP_PATH`.

### Scripts de diagnóstico del planner

Corren fuera de Next, sobre `data/static/`. No están en `package.json` (no son parte del build); se ejecutan con `tsx`:

| Comando | Qué hace |
| ------- | -------- |
| `npx tsx scripts/smoke-plan.ts` | Construye el grafo real e imprime itinerarios para pares deterministas, con tiempos. Verificación a ojo tras tocar el planner |
| `npx tsx scripts/audit-stop-order.ts [--verbose]` | Mide pares de paradas «imposibles» por umbral de proyección; con esto se eligió `MAX_STOP_TO_POLYLINE_METERS` |

Contexto del algoritmo, modelo de costos y grafo: [docs/trip-planner.md](docs/trip-planner.md).

## Variables de entorno

Resumen en el [README](README.md). Tabla completa: [docs/env-reference.md](docs/env-reference.md).

- **Obligatoria para arribos en vivo:** `NEXT_PUBLIC_CUANDO_API_URL`
- **Telegram + mapa en vivo:** `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Convenciones de código

- **Tipos:** evitá `any`. Dominio compartido en `@shared/types`; tipos por feature en `features/*/types.ts`.
- **Estilos:** Tailwind 4 y tokens en `app/globals.css`. Seguí [DESIGN.md](DESIGN.md) para UI nueva.
- **Componentes:** una responsabilidad clara; si supera ~200 líneas, extraé subcomponentes o hooks.
- **Features nuevas:** preferí carpeta bajo `features/<nombre>/` con `components/`, `hooks/`, `api/` según haga falta.

## Pull request

1. Verificá build y lint:
   ```bash
   npm run build
   npm run lint
   ```
2. Commits descriptivos (Conventional Commits recomendado).
3. Push y abrí el PR contra `main`.
4. En la descripción: problema que resuelve, enfoque elegido, capturas si hay cambios visuales.

## Reportar bugs

Abrí una issue con pasos para reproducir, navegador/dispositivo y comportamiento esperado vs actual.

¡Gracias por ayudar a mantener la app rápida y confiable!

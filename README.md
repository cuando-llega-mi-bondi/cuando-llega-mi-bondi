<div align="center">
  <img src="public/icon-192x192.png" alt="Bondi MDP Logo" width="120" />

  <h1>Bondi MDP</h1>

  <p>
    <strong>Próximos arribos, mapa de paradas, "cómo llego" y avisos push para los colectivos urbanos de Mar del Plata.</strong>
  </p>

  <p>
    <a href="https://www.bondimdp.com.ar/">bondimdp.com.ar</a> •
    <a href="#-cómo-correrlo">Cómo correrlo</a> •
    <a href="#-arquitectura">Arquitectura</a> •
    <a href="#-variables-de-entorno">Env vars</a> •
    <a href="CONTRIBUTING.md">Contribuir</a>
  </p>
</div>

---

> [!NOTE]
> PWA instalable, mapa-first, con datos en tiempo real combinando la API
> municipal y GPS crowdsourced via un bot de Telegram. Auth real con
> favoritos persistidos por usuario y notificaciones push para rutinas
> (avisos de bondi y recordatorios diarios).

## ✨ Qué hace

- **Home con mapa**: paradas cercanas en tiempo real desde tu GPS.
- **Buscador unificado**: línea, parada o calle.
- **Detalle de parada**: distancia caminando real (OSRM, polyline por las
  calles), próximos arribos combinando **API muni** + **GPS crowdsourced**
  (Telegram live share).
- **Detalle de línea**: paradas por bandera con filtro y orden de recorrido.
- **Cómo llego**: catálogo de POIs de MDP + "tap en mapa" para destino,
  itinerarios con bondi directo o transbordos calculados con Dijkstra sobre
  un grafo precomputado de toda la red.
- **Auth real**: login con cuenta propia, JWT custom HS256 con `jose`.
- **Favoritos** con apodo y emoji, persistidos por usuario.
- **Rutinas push**: aviso cuando un colectivo está a ≤N min de tu parada,
  o recordatorio diario a una hora fija. Web push estándar (VAPID).
- **PWA**: install prompt, service worker con cache strategies y push.

## 🛠 Arquitectura

Hay dos artefactos independientes:

```
┌──────────────────────────────┐         ┌─────────────────────────────────┐
│  Frontend (Next 16, Vercel)  │  fetch  │  Backend (Hono + Node)          │
│                              │ ──────▶ │                                 │
│  - /v2/* (home actual)       │ cookie  │  - /auth/{login,me,logout}      │
│  - /v1/* (legacy)            │ auth    │  - /favoritos                   │
│  - /api/cuando (proxy MGP)   │ ──────▶ │  - /rutinas                     │
│  - /api/walk-route (OSRM)    │         │  - /subscribe (web push)        │
│                              │         │  - /telegram/webhook            │
│  Static catalog:             │         │  - /lineas/:l/en-vivo           │
│   lib/static/lines.json      │         │  - /lineas/:l/arribos           │
│   lib/static/stops.json      │         │                                 │
│   lib/static/places.ts       │         │  Worker (node-cron):            │
└──────────────┬───────────────┘         │   - arrival watch (1m)          │
               │                         │   - daily reminder (5m)         │
               ▼                         └────────────────┬────────────────┘
       ┌─────────────────┐                                │
       │  OSRM (foot)    │                                ▼
       │  Mar del Plata  │                       ┌────────────────┐
       │  crop           │                       │  Postgres      │
       └─────────────────┘                       │  schema bondi  │
                                                 └────────────────┘
```

- **Frontend**: Next 16 con App Router en Vercel. Mantiene el catálogo
  estático de líneas/paradas/POIs y la lógica de routing (Dijkstra), llama
  al backend para todo lo que requiera estado del usuario.
- **Backend**: server Hono en Node con Postgres. Maneja auth (JWT), CRUD de
  favoritos y rutinas, push subscriptions, webhook de Telegram para GPS
  crowdsourced y proxy a la API municipal.
- **OSRM**: instancia con un crop de MDP (perfil foot) que sirve el routing
  peatonal real. El frontend lo consulta vía un endpoint propio
  (`/api/walk-route`) que actúa de proxy server-side.

## 🧰 Stack

| Pieza | Tech |
|---|---|
| Frontend framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Estilo | Tailwind CSS 4 + tokens custom en `app/v2/v2.css` |
| Mapas | Leaflet + tiles CartoCDN |
| Routing peatonal | OSRM (foot profile) |
| Routing de bondis | Dijkstra propio en `lib/v2/{graph,dijkstra,route-finder}.ts` |
| Animaciones | `motion/react` |
| Cliente HTTP | SWR (data fetching) |
| Backend framework | Hono + `@hono/node-server` |
| DB | Postgres + `pg` directo, schema dedicado `bondi.*` |
| Auth | JWT HS256 (`jose`) + cookie httpOnly cross-site (`SameSite=None`) |
| Push | `web-push` con VAPID |
| Scheduler | `node-cron` en proceso separado |
| Live GPS | Webhook Telegram bot |

## 📁 Estructura

```
bondi-mdp/
├── app/
│   ├── v2/                # Home actual: mapa, buscar, parada, línea, cómo llego, login, favoritos, rutinas
│   ├── v1/                # Backup del flujo viejo (formulario)
│   ├── api/
│   │   ├── cuando/        # Proxy a la API muni (server-side)
│   │   └── walk-route/    # Proxy a OSRM (server-side)
│   └── layout.tsx         # SW registration con auto-reload on controllerchange
├── lib/
│   ├── v2/                # Routing engine (dijkstra, graph, route-finder)
│   ├── static/            # Catálogo precomputado: lines.json, stops.json, places.ts
│   ├── bondi-api/         # Cliente del backend + AuthContext + hooks SWR
│   └── osrm.ts            # Cliente del proxy /api/walk-route
├── server/                # ⬇ Backend ⬇
│   ├── src/
│   │   ├── auth/          # JWT, cookie, middleware
│   │   ├── routes/        # auth, favoritos, rutinas, subscribe, telegram, lineas
│   │   ├── scheduler/     # arrival.ts (1 min), daily.ts (5 min), run.ts (entry)
│   │   ├── lib/           # webpush, geo, mgpDirect, liveSharePayload
│   │   └── data/          # static.ts (lee bind mount de lib/static)
│   ├── Dockerfile
│   ├── docker-compose.yml # Services: bondi-api + bondi-scheduler
│   └── .env.example
├── db/migrations/         # SQL para schema bondi.*
└── infrastructure/osrm/   # docker-compose + setup.sh para procesar el .pbf de MDP
```

## 🚀 Cómo correrlo

### Frontend

```bash
pnpm install
cp .env.example .env.local   # editar
pnpm dev                     # localhost:3000
```

Variables mínimas para que el v2 funcione contra un backend remoto:

```env
NEXT_PUBLIC_BONDI_API_URL=https://api.tu-dominio.com
NEXT_PUBLIC_VAPID_PUBLIC=<la public key VAPID generada>
```

Para `/api/cuando` (proxy a la muni) y `/api/walk-route` (OSRM) server-side:

```env
MGP_RSA_PUBKEY=...
MGP_SHARED_KEY=...
OSRM_URL=https://osrm.tu-dominio.com   # o http://localhost:5000 en dev
```

### Backend

```bash
cd server
cp .env.example .env.local        # completar
docker compose up -d               # bondi-api + bondi-scheduler
docker compose logs -f bondi-api
```

Migraciones (idempotentes, requieren un Postgres running):

```bash
psql "$DATABASE_URL" -f db/migrations/001_bondi_init.sql
psql "$DATABASE_URL" -f db/migrations/002_bondi_bus_locations.sql
```

VAPID keys (generar una vez, mismo valor en `server/.env.local` y en
`NEXT_PUBLIC_VAPID_PUBLIC` del frontend):

```bash
npx web-push generate-vapid-keys
```

### OSRM

```bash
cd infrastructure/osrm
./setup.sh                  # descarga argentina.osm.pbf y lo crop a MDP (lento la primera vez)
docker compose up -d        # expone localhost:5000
```

Las labels de traefik en el `docker-compose.yml` son opcionales: si tenés un
reverse proxy (traefik, nginx, caddy) podés usarlas; sino con `localhost:5000`
alcanza para dev.

## 🔐 Variables de entorno

### Frontend (`.env.local`)

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_BONDI_API_URL` | URL del backend |
| `NEXT_PUBLIC_VAPID_PUBLIC` | Clave pública VAPID para `pushManager.subscribe` |
| `MGP_RSA_PUBKEY` | Path direct a la muni (RSA pubkey, server-side) |
| `MGP_SHARED_KEY` | Path direct a la muni (clave compartida, server-side) |
| `MGP_PROXY_URL` | Alternativa: proxy externo (Termux/Oracle) |
| `OSRM_URL` | URL absoluta de OSRM para `/api/walk-route` (server-side) |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Para construir deep links `t.me/<bot>?start=...` |

### Backend (`server/.env.local`)

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | HS256 secret (mínimo 32 chars) |
| `AUTH_COOKIE_NAME` | Default `auth_token` |
| `AUTH_COOKIE_DOMAIN` | Opcional, si frontend y backend comparten dominio padre |
| `AUTH_TOKEN_TTL_SECONDS` | Default 7 días |
| `ALLOWED_ORIGINS` | Lista CSV de orígenes permitidos para CORS (sin `*`) |
| `VAPID_PUBLIC` / `VAPID_PRIVATE` / `VAPID_SUBJECT` | Web push keys |
| `MGP_RSA_PUBKEY` / `MGP_SHARED_KEY` | Path direct a la muni para `/lineas/:l/arribos` |
| `MGP_PROXY_URL` | Alternativa por proxy externo |
| `TELEGRAM_BOT_TOKEN` | Para que el webhook pueda responder al `/start` |
| `PORT` / `HOST` | Default `4000` y `0.0.0.0` |

> [!IMPORTANT]
> Ninguna de estas variables debe commitearse. `.env.local` ya está en
> `.gitignore`. Los `.env.example` del repo solo contienen placeholders.

## 📡 API del backend

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/auth/login` | `{email, password}` → cookie `auth_token` |
| `POST` | `/auth/logout` | Limpia cookie |
| `GET` | `/auth/me` | User actual (requiere auth) |
| `GET/POST/PATCH/DELETE` | `/favoritos` | CRUD de favoritos del user |
| `GET/POST/PATCH/DELETE` | `/rutinas` | CRUD; discriminated union `arrival_watch \| daily_reminder` |
| `POST/DELETE` | `/subscribe` | Web push subscription |
| `POST` | `/telegram/webhook` | Recibe `/start` con linea+ramal y location updates |
| `GET` | `/lineas/:linea/en-vivo?paradaId=X` | Bondis con GPS activo + ETA por la ruta |
| `GET` | `/lineas/:linea/arribos?paradaId=X` | Próximos arribos según API muni (cache 15s) |

## 📡 API legacy (frontend Next, v1)

| Path | Descripción |
|---|---|
| `POST /api/cuando` | Proxy genérico a la API muni; soporta proxy externo o path direct (RSA) |
| `GET /api/walk-route` | Proxy a OSRM; usa `OSRM_URL` |

## 🤝 Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md). Convenciones de commits, estructura
del repo, y cómo correr los tests.

## 📄 Licencia

MIT — ver [LICENSE](LICENSE).

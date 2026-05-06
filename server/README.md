# bondi-server

Backend self-hosted (Node + Hono + Postgres) para favoritos, rutinas y push
notifications. Pega contra `pg-aeterna` reusando `public.auth_credentials` como
user store; el frontend Vercel (`bondimdp.com.ar`) le habla por HTTPS via
cloudflared tunnel.

## Setup

```bash
cd server
cp .env.example .env.local        # editar con valores reales
pnpm install
psql "$DATABASE_URL" -f ../db/migrations/001_bondi_init.sql
pnpm dev                           # API en $PORT
pnpm scheduler                     # worker de cron (otro proceso)
```

## Endpoints

### Auth
- `POST /auth/login` — `{ email, password }` → cookie `auth_token`
- `POST /auth/logout`
- `GET /auth/me` — requiere auth

### Favoritos (requiere auth)
- `GET /favoritos`
- `POST /favoritos` — `{ parada_id, apodo, emoji? }`
- `PATCH /favoritos/:id` — `{ apodo?, emoji?, posicion? }`
- `DELETE /favoritos/:id`

### Rutinas (requiere auth)
- `GET /rutinas`
- `POST /rutinas` — discriminated union por `kind`:
  - `arrival_watch`: `{ kind, nombre, parada_id, linea_id, threshold_min, cooldown_min?, active_dows?, enabled? }`
  - `daily_reminder`: `{ kind, nombre, fire_at: "HH:MM", tz?, active_dows?, origen_*?, destino_*?, enabled? }`
- `PATCH /rutinas/:id`
- `DELETE /rutinas/:id`

### Push (requiere auth)
- `POST /subscribe` — `{ endpoint, keys: { p256dh, auth }, user_agent? }`
- `DELETE /subscribe?endpoint=...`

## Auth flow

1. Frontend → `POST /auth/login`. Server valida contra `auth_credentials` con
   bcrypt, firma JWT (HS256, `JWT_SECRET`), setea cookie `auth_token`.
2. Frontend hace fetch con `credentials: 'include'`. La cookie viaja sola.
3. Middleware `requireAuth` valida JWT. Acepta también `Authorization: Bearer`
   por si en el futuro hay clientes nativos.

`JWT_SECRET` es el mismo que aeterna usa, así que cualquier token emitido por
estudio o cualquier otra app del ecosistema vale acá. Bondi puede emitir y
otras apps pueden verificar (futuro).

## Scheduler

`src/scheduler/run.ts` corre dos jobs con `node-cron`:
- `arrival` cada minuto: revisa rutinas `arrival_watch` y dispara push si el
  ETA está bajo `threshold_min` y pasó el `cooldown_min`.
- `daily` cada 5 min: dispara `daily_reminder` cuando llega `fire_at` en su TZ.

Self-hosted: si la PC está apagada, no salen pushes. Esperable.

## Seguridad

- Sin secretos en código. `env.ts` valida con zod y muere si falta algo.
- CORS estricto: solo origins de `ALLOWED_ORIGINS` (sin `*`).
- Cookie `httpOnly`, `Secure` en prod, `SameSite=None` (cross-site Vercel↔PC).
- bcrypt-compare en tiempo constante incluso si el user no existe.
- JWT verify rechaza tokens con alg ≠ HS256.

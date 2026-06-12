# Referencia de variables de entorno

Valores de ejemplo en [`.env.example`](../.env.example). En desarrollo, copiá ese archivo a `.env.local`.

## Obligatorias según funcionalidad

| Variable | Leída por la app | Descripción |
| -------- | ---------------- | ----------- |
| `NEXT_PUBLIC_CUANDO_API_URL` | Sí (`shared/api/client.ts`) | URL base del backend self-hosted. Sin ella, `post()` falla en acciones en vivo. Las peticiones van a `GET {url}/mgp/{accion}?...`. |
| `NEXT_PUBLIC_USE_STATIC_REFERENCE` | Sí | `true` (default) sirve catálogo desde `/api/reference`. `false` fuerza todo el catálogo al backend. |

## Integraciones opcionales (esta app)

| Variable | Uso |
| -------- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente Supabase y webhook Telegram |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Idem |
| `TELEGRAM_BOT_TOKEN` | `app/api/telegram-webhook` — `sendMessage` |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Enlaces `t.me/...` en UI (sin `@`) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics (`shared/analytics/`) |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Microsoft Clarity |

Sin Telegram ni Supabase, consultas de arribos y catálogo estático siguen funcionando si el backend y el dump están configurados.

## Scripts y datos estáticos

| Variable | Uso |
| -------- | --- |
| `DUMP_MGP_URL` | Alternativa a `NEXT_PUBLIC_CUANDO_API_URL` solo en `bun run dump-static` |
| `DUMP_DELAY_MS` | Pausa entre requests al generar el dump (default ~150 ms) |
| `STATIC_REFERENCE_DUMP_PATH` | Ruta al JSON monolítico para `split-static` o carga custom |

## Docker / despliegue

| Variable | Uso |
| -------- | --- |
| `TUNNEL_TOKEN` | Token de Cloudflare Tunnel en `docker-compose.yml` |
| `NEXT_PUBLIC_BONDI_API_URL` | Build arg en Docker; mismo propósito que `CUANDO_API_URL` en algunos entornos |
| `NEXT_PUBLIC_VAPID_PUBLIC` | Build arg para notificaciones push (futuro / PWA) |

## Presentes en `.env.example` pero no usadas por el front Next.js

Estas variables documentan el **stack completo** (proxy/oracle/crypto en el backend u otros servicios). No aparecen en el código TypeScript de este repositorio:

- `MGP_PROXY_URL`, `MGP_PROXY_TOKEN`
- `MGP_ORACLE_URL`, `MGP_ORACLE_TOKEN`
- `MGP_RSA_PUBKEY`, `MGP_SHARED_KEY`
- `OSRM_URL`

Configuralas en el servicio que las consuma (backend self-hosted), no esperes efecto solo por tenerlas en `.env.local` del front.

## Vercel

En producción, definí las `NEXT_PUBLIC_*` en el panel de Vercel. El catálogo estático viaja en el deploy (`data/static/`); el backend en vivo debe ser accesible desde el navegador del usuario (CORS en el servidor externo).

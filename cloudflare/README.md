# Cloudflare Worker — proxy a la API de la Municipalidad

Worker que replica el contrato de `app/api/cuando/route.ts` corriendo en el edge de Cloudflare en lugar de Vercel.

## ¿Por qué?

Cada llamada a la API municipal desde la app cuenta como un **edge request** en Vercel. El plan Hobby tiene 1M/mes; con un pico de tráfico (por ejemplo, una nota en un diario) se puede consumir buena parte de la cuota en pocos días.

Cloudflare Workers ofrecen 100.000 requests/día gratis y, además, cachean las respuestas a nivel de edge global, lo cual reduce también la carga sobre el servidor origen de la Municipalidad.

## Características

- **Mismo contrato HTTP** que la API route de Next.js (`POST` con body `application/x-www-form-urlencoded`).
- **Caché de 5 minutos** en Cloudflare Cache API para las acciones de referencia (líneas, calles, intersecciones, paradas, recorridos).
- **Sin caché para arribos** (esos siguen pegando al WS de la Municipalidad para mantener frescura).
- **Rate limiting** básico de 120 req/min por IP, en memoria del Worker.
- **CORS** habilitado para que pueda ser llamado desde cualquier origen.

## Cómo deployar

```bash
# 1) Instalar wrangler (si no lo tenés)
npm i -g wrangler

# 2) Login en Cloudflare
wrangler login

# 3) Deploy desde la carpeta del Worker
cd cloudflare
wrangler deploy
```

Wrangler te imprime la URL pública del Worker (algo como `https://cuando-proxy.tu-subdominio.workers.dev`).

## Activarlo en la app

En Vercel, agregar la variable de entorno:

```
NEXT_PUBLIC_CUANDO_API_URL=https://cuando-proxy.tu-subdominio.workers.dev
```

Hacer redeploy. El cliente (`lib/api/client.ts`) toma la variable automáticamente y deja de usar `/api/cuando`.

## Verificar que funciona

Las respuestas cacheadas incluyen el header `X-Cache: HIT` o `X-Cache: MISS`. Se puede inspeccionar desde DevTools del navegador.

En el dashboard de Cloudflare se ve la cantidad de requests, latencia y cache hit ratio en tiempo real.

## Diagnóstico (502, errores MGP, “no responde”)

Si la app con `NEXT_PUBLIC_CUANDO_API_URL` apuntando al Worker falla y **sin esa variable** (`/api/cuando` en Vercel) funciona, el origen municipal puede estar **filtrando o bloqueando** el tráfico que sale desde la red de Cloudflare (HTML/WAF/403 en lugar de JSON).

**Caso frecuente: 403 con HTML “Sorry, you have been blocked” / “Attention Required! | Cloudflare”.**  
El dominio municipal está detrás del **WAF de Cloudflare del propio sitio**. Las subrequests que hace **tu** Worker (otra IP de salida de Cloudflare / centro de datos) suelen ser calificadas como tráfico no deseado y bloqueadas. **No se arregla desde el código del Worker**; la salida práctica es dejar de usar el Worker para MGP y volver al proxy en Vercel (mitigación abajo).

1. **Logs en tiempo real** (desde la carpeta `cloudflare/`):

   ```bash
   npx wrangler tail
   ```

   Reproducí el fallo desde el navegador y buscá líneas JSON en consola del Worker:

   - `mgp_http_error` — MGP respondió con status no OK; `bodyPreview` muestra el inicio del cuerpo (a veces HTML de bloqueo).
   - `mgp_origin_cf_block` — mismo caso: el HTML es la página de bloqueo de **Cloudflare del sitio municipal**; el log incluye `hint` operativo.
   - `mgp_invalid_json` — status 200 pero el cuerpo no es JSON parseable (típico de página HTML intermedia).
   - `proxy_unhandled` — excepción antes de interpretar la respuesta de MGP (red, timeout, etc.).

2. **Dashboard**: Workers & Pages → `cuando-proxy` → Observability / Logs (equivalente a lo anterior).

3. **Probar el Worker directamente** (reemplazá la URL por la tuya; en cmd.exe usá `^` para partir líneas; en bash/PowerShell podés usar una sola línea):

   ```bash
   curl.exe -sS -X POST "https://cuando-proxy.TU-SUBDOMINIO.workers.dev" -H "Content-Type: application/x-www-form-urlencoded" --data "accion=RecuperarLineaPorCuandoLlega"
   ```

   Si la respuesta empieza con `{` suele estar bien; si empieza con `<html` el origen está devolviendo otra cosa al edge de Cloudflare.

## Mitigación: volver al proxy en Vercel

No hace falta tocar código: **eliminá o dejá vacía** `NEXT_PUBLIC_CUANDO_API_URL` en el proyecto de Vercel (y en `.env.local` si la usás en desarrollo) y hacé **redeploy**. La app vuelve a usar `POST /api/cuando` y las salidas a MGP pasan por Vercel.

## Mantenimiento

Si se cambia algún header o URL en `app/api/cuando/route.ts`, hay que actualizar también `cuando-proxy-worker.js` para que ambos endpoints sigan siendo intercambiables.

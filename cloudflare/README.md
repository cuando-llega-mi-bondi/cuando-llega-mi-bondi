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

## Mantenimiento

Si se cambia algún header o URL en `app/api/cuando/route.ts`, hay que actualizar también `cuando-proxy-worker.js` para que ambos endpoints sigan siendo intercambiables.
